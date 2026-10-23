"""One-anchor constant-rate mixed SCENARIO, not a validated steep-trail predictor.

The existing GPX/geometry/Minetti predictor are unchanged. For in-domain cells,
use the existing running_cost; outside +/-45%, use explicit vertical rates only.
Never infer vertical rates or fatigue from the one reference moving-time scalar.
"""
from bisect import bisect_right
from copy import deepcopy
from dataclasses import asdict
import math
from trail_planner.gpx import InputError,parse_gpx
from trail_planner.geometry import Geometry,GEOMETRY_VERSION,build_geometry
from trail_planner.planning import running_cost,MODEL_VERSION as COST_CORE_VERSION
from cross_trail_predictor import (_validate_evidence,_validate_assumptions,
    _checkpoint_specs,_number,_sum,_provenance,ASSUMPTION_FIELDS,OPTIONAL_ASSUMPTION_FIELDS)
MODEL_VERSION='anchor-minetti-vam-constant-scenario-v1'
SCHEMA_VERSION='hybrid-trail-scenario/1.0'
DOMAIN=.45
EXTRA_FIELDS={'steep_up_m_per_h','steep_down_m_per_h','steep_scenario_confirmed'}

def _error(code,message):raise InputError(code,message)
def _finite(x):
    try:return not isinstance(x,bool) and isinstance(x,(int,float)) and math.isfinite(x)
    except (OverflowError,TypeError):return False

def _assumptions(a):
    if not isinstance(a,dict) or not ASSUMPTION_FIELDS|EXTRA_FIELDS <= set(a) or set(a)-ASSUMPTION_FIELDS-OPTIONAL_ASSUMPTION_FIELDS-EXTRA_FIELDS:
        _error('hybrid_assumption_schema','混合情境欄位不符。')
    base={k:v for k,v in a.items() if k not in EXTRA_FIELDS}
    _,caps,stops=_validate_assumptions(base)
    if a['fatigue_model']!='constant_rate':
        _error('hybrid_constant_rate_only','混合情境只支援固定速率；陡坡時間不可再疊加未識別疲勞。')
    if not isinstance(a['steep_scenario_confirmed'],bool):
        _error('hybrid_confirmation_type','陡坡情境確認須為布林值。')
    rates={}
    for direction in ('up','down'):
        key='steep_'+direction+'_m_per_h'
        rates[direction]=None if a[key] is None else _number(a[key],key)
    return caps,stops,rates,a['steep_scenario_confirmed']

def _geometry(g):
    if not isinstance(g,Geometry) or g.blocked or not g.cells:
        _error('hybrid_route_blocked','需要連續有效路線；不可自行連接缺口。')
    if not _finite(g.distance_m) or g.distance_m<=0:
        _error('hybrid_geometry_invalid','路線距離不是正有限數。')
    previous=0.;horizontal=[]
    for c in g.cells:
        if any(not _finite(v) for v in (c.start_m,c.end_m,c.horizontal_m)) or c.distance_m<=0 or c.horizontal_m<=0 or abs(c.start_m-previous)>1e-7*max(1,g.distance_m):
            _error('hybrid_geometry_invalid','幾何格不連續或距離無效。')
        if g.elevation_complete:
            if any(not _finite(v) for v in (c.elevation_start_m,c.elevation_end_m,c.grade)):
                _error('hybrid_geometry_invalid','完整海拔幾何含缺失或非有限值。')
            dz=c.elevation_end_m-c.elevation_start_m
            if abs(c.grade-dz/c.horizontal_m)>1e-8 or abs(c.distance_m-math.hypot(c.horizontal_m,dz))>1e-7*max(1,c.distance_m):
                _error('hybrid_geometry_invalid','坡度、海拔差與沿坡距離不一致。')
        else:
            if c.grade is not None:
                _error('hybrid_geometry_invalid','不完整海拔不可包含可用坡度。')
        previous=c.end_m;horizontal.append(c.horizontal_m)
    if abs(previous-g.distance_m)>1e-7*max(1,g.distance_m) or not _finite(g.horizontal_distance_m) or abs(_sum(horizontal)-g.horizontal_distance_m)>1e-7*max(1,g.horizontal_distance_m):
        _error('hybrid_geometry_invalid','幾何總距離不一致。')

def _kind(c):
    if c.grade is None:return 'missing_elevation'
    if abs(c.grade)<=DOMAIN+1e-10:return 'minetti_in_domain'
    return 'steep_up' if c.grade>0 else 'steep_down'

def analyze_geometry(g):
    """Pure diagnostics, usable before entering historical evidence/rate scenarios."""
    _geometry(g)
    totals={k:dict(cells=0,distance_m=0.,vertical_m=0.) for k in ('minetti_in_domain','steep_up','steep_down','missing_elevation')}
    groups=[]
    for i,c in enumerate(g.cells):
        k=_kind(c);d=totals[k];d['cells']+=1;d['distance_m']+=c.distance_m
        d['vertical_m']+=abs(c.elevation_end_m-c.elevation_start_m) if g.elevation_complete else 0.
        if k=='minetti_in_domain':continue
        if groups and groups[-1]['kind']==k and groups[-1]['last_cell']==i-1:
            row=groups[-1];row['last_cell']=i;row['end_m']=c.end_m;row['vertical_m']=(row['vertical_m']+abs(c.elevation_end_m-c.elevation_start_m)) if g.elevation_complete else None
        else:groups.append(dict(kind=k,first_cell=i,last_cell=i,start_m=c.start_m,end_m=c.end_m,vertical_m=abs(c.elevation_end_m-c.elevation_start_m) if g.elevation_complete else None))
    for k,d in totals.items():
        d['distance_fraction']=d['distance_m']/g.distance_m
        if k=='missing_elevation':d['vertical_m']=None
    return dict(route_sha256=g.route_sha256,geometry_sha256=g.geometry_sha256,distance_m=g.distance_m,elevation_complete=g.elevation_complete,domain=[-DOMAIN,DOMAIN],categories=totals,groups=groups)

def _cap(c,caps):
    options=[]
    if caps['max_speed_m_s'] is not None:options.append(caps['max_speed_m_s'])
    if caps['uphill_cap_grade'] is not None and c.grade>=caps['uphill_cap_grade']-1e-10:options.append(caps['uphill_cap_m_s'])
    if caps['downhill_cap_grade'] is not None and c.grade<=caps['downhill_cap_grade']+1e-10:options.append(caps['downhill_cap_m_s'])
    cap=min(options) if options else None
    lower=c.distance_m/cap if cap is not None else 0.
    if not math.isfinite(lower):_error('hybrid_numeric_range','速度限制時間超出有限範圍。')
    return cap,lower

def _rows(g,caps,rates,confirmed):
    rows=[]
    for c in g.cells:
        kind=_kind(c);cap,lower=(None,0.) if kind=='missing_elevation' else _cap(c,caps)
        effort=None;fixed=None;reason=None;vam=None
        if kind=='minetti_in_domain':
            effort=running_cost(c.grade)*c.distance_m
            if not math.isfinite(effort) or effort<=0:_error('hybrid_numeric_range','域內成本不是正有限值。')
        elif kind=='missing_elevation':reason='missing_elevation'
        else:
            direction=kind.removeprefix('steep_');vam=rates[direction]
            if vam is None:reason='missing_'+kind+'_rate'
            elif not confirmed:reason='steep_scenario_not_confirmed'
            else:
                fixed=max(abs(c.elevation_end_m-c.elevation_start_m)*3600/vam,lower)
                if not math.isfinite(fixed) or fixed<=0:_error('hybrid_numeric_range','指定垂直速率造成非有限時間。')
        rows.append(dict(cell=c,kind=kind,effort=effort,fixed=fixed,cap=cap,lower=lower,unresolved_reason=reason,vertical_rate_m_h=vam))
    return rows

def _fit(rows,moving):
    unresolved=sorted(set(r['unresolved_reason'] for r in rows if r['unresolved_reason']))
    if unresolved:return None,None,'reference_parameters_incomplete',unresolved
    domain=[r for r in rows if r['effort'] is not None]
    if not domain:return None,None,'reference_scale_unidentifiable',[]
    fixed=_sum(r['fixed'] for r in rows if r['fixed'] is not None)
    floor=_sum([fixed,*[r['lower'] for r in domain]])
    tolerance=1e-9*max(1.,moving,floor)
    if moving<floor-tolerance:_error('hybrid_reference_infeasible','參考移動時間少於指定陡坡時間及限速最低時間，情境互相衝突。')
    if moving<=floor+tolerance:return None,None,'reference_scale_unidentifiable',[]
    effort=_sum(r['effort'] for r in domain)
    remaining=moving-fixed
    right=remaining/effort;left=0.
    if not math.isfinite(right) or right<=0:_error('hybrid_numeric_range','參考尺度超出有限正值範圍。')
    def total(scale):return _sum([fixed,*[max(scale*r['effort'],r['lower']) for r in domain]])
    for _ in range(100):
        mid=left+(right-left)/2
        if mid==left or mid==right:break
        if total(mid)<moving:left=mid
        else:right=mid
    scale=left+(right-left)/2
    if not math.isfinite(scale) or scale<=0 or not math.isfinite(1/scale):_error('hybrid_numeric_range','單一尺度無法有限表示。')
    residual=total(scale)-moving
    if abs(residual)>1e-8*max(1,moving):_error('hybrid_fit_failed','參考單一尺度求解未收斂。')
    return scale,residual,'identified_one_scale',[]

def _timeline(rows,scale):
    timeline=[];cumulative=0.;prefix_known=True
    for r in rows:
        c=r['cell'];reason=r['unresolved_reason']
        if r['effort'] is not None:
            if scale is None:t=None;reason='reference_scale_unavailable'
            else:t=max(scale*r['effort'],r['lower'])
        else:t=r['fixed']
        if t is None:prefix_known=False
        else:
            if not math.isfinite(t) or t<=0:_error('hybrid_numeric_range','局部情境時間不是正有限值。')
            cumulative=_sum((cumulative,t))
        timeline.append(dict(start_m=c.start_m,end_m=c.end_m,moving_s=t,cumulative_moving_s=cumulative if prefix_known else None,cumulative_known_moving_s=cumulative,grade=c.grade,effort_j_kg=r['effort'],speed_cap_m_s=r['cap'],model_component=r['kind'],vertical_rate_m_h=r['vertical_rate_m_h'],unresolved_reason=reason,fatigue_multiplier_start=1.,fatigue_multiplier_end=1.))
    return timeline

def _checkpoints(g,timeline,specs,placement,stops):
    """Exact integral of a piecewise-constant local time density. No route-linear CP interpolation."""
    ends=[c.end_m for c in g.cells];prefix=[0.]
    for t in timeline:prefix.append(_sum((prefix[-1],t['moving_s'])))
    out=[];previous_distance=previous_moving=previous_departure=prior_stops=0.
    for cp in specs:
        d=cp['distance_m'];index=bisect_right(ends,d)
        if index==len(ends):moving=prefix[-1]
        else:
            c=g.cells[index];fraction=(d-c.start_m)/c.distance_m
            moving=_sum((prefix[index],fraction*timeline[index]['moving_s']))
        arrival=_sum((moving,prior_stops,stops if placement=='aggregate_unlocated' else 0.));departure=_sum((arrival,cp['stop_s']))
        leg_distance=d-previous_distance;leg_moving=moving-previous_moving;leg_elapsed=departure-previous_departure
        out.append(dict(cp,cumulative_moving_s=moving,moving_s=leg_moving,start_elapsed_s=previous_departure,leg_distance_m=leg_distance,arrival_elapsed_s=arrival,departure_elapsed_s=departure,leg_elapsed_s=leg_elapsed,pace_s_per_km=leg_moving/leg_distance*1000,total_pace_s_per_km=leg_elapsed/leg_distance*1000,unallocated_stops_s=stops if placement=='aggregate_unlocated' else 0.))
        prior_stops=_sum((prior_stops,cp['stop_s']));previous_distance=d;previous_moving=moving;previous_departure=departure
    return out

def predict_geometries(reference_geometry,target_geometry,evidence,assumptions):
    moving,age=_validate_evidence(evidence);caps,stops,rates,confirmed=_assumptions(assumptions)
    rd,td=analyze_geometry(reference_geometry),analyze_geometry(target_geometry)
    if reference_geometry.config!=target_geometry.config:_error('hybrid_geometry_config_mismatch','兩條路線的幾何處理設定須相同。')
    specs,stops,placement=_checkpoint_specs(assumptions,target_geometry.distance_m,stops)
    rr=_rows(reference_geometry,caps,rates,confirmed);tr=_rows(target_geometry,caps,rates,confirmed)
    scale,residual,fit_status,fit_missing=_fit(rr,moving)
    timeline=_timeline(tr,scale);complete=scale is not None and all(r['moving_s'] is not None for r in timeline)
    known=_sum(r['moving_s'] for r in timeline if r['moving_s'] is not None)
    total=known if complete else None;elapsed=_sum((known,stops)) if complete else None
    parts={k:_sum(r['moving_s'] for r in timeline if r['moving_s'] is not None and r['model_component']==k) for k in ('minetti_in_domain','steep_up','steep_down')}
    er=_sum(r['effort'] for r in rr if r['effort'] is not None);et=_sum(r['effort'] for r in tr if r['effort'] is not None)
    reference=_provenance(reference_geometry,er);target=_provenance(target_geometry,et)
    reference['effort_scope']=target['effort_scope']='minetti_in_domain_only'
    result=dict(schema_version=SCHEMA_VERSION,model_version=MODEL_VERSION,status='hybrid_scenario_complete' if complete else 'hybrid_scenario_partial',purpose='forward_mixed_scenario',calibration_status='one_anchor_in_domain_scale_only_not_externally_validated',complete=complete,moving_s=total,stops_s=stops,elapsed_s=elapsed,target_elapsed_s=elapsed,computed_time_s=known,component_times_s=parts,unresolved_distance_m=_sum(r['end_m']-r['start_m'] for r in timeline if r['moving_s'] is None),reference=reference,target=target,reference_moving_s=moving,reference_age_days=age,effort_ratio=et/er if er else None,effort_ratio_scope='in_domain_only_not_whole_route',distance_ratio=target_geometry.distance_m/reference_geometry.distance_m,effective_rate_scale_j_kg_s=1/scale if scale is not None else None,anchor_fit_residual_s=residual,identification=dict(status=fit_status,fitted_parameters=['in_domain_effective_rate_scale'] if scale is not None else [],reference_missing=fit_missing,steep_rate_source='explicit_user_scenario_not_fitted',fatigue='constant_rate_no_extra_fatigue',conditions_match='user_confirmed_not_verified'),assumptions=deepcopy(assumptions),uncertainty=dict(kind='not_calibrated',interval=None,goal_probability=None),accuracy_claim=None,canonical_timeline=timeline,geometry_snapshot=[asdict(c) for c in target_geometry.cells],domain_diagnostics=dict(reference=rd,target=td),checkpoints=_checkpoints(target_geometry,timeline,specs,placement,stops) if complete else [],terrain_display_compatible=complete and (placement=='explicit_checkpoints' or stops==0),checkpoint_query_version='exact-piecewise-constant-prefix-v1',checkpoint_stop_placement=placement,provenance=dict(cost_core_version=COST_CORE_VERSION,cost_source='https://doi.org/10.1152/japplphysiol.01177.2001',cost_function='unchanged trail_planner.planning.running_cost for in-domain cells only',grade_domain=[-DOMAIN,DOMAIN],steep_function='abs(elevation_delta_m)*3600/user_vertical_rate_m_h, subject to explicit speed cap',geometry_version=GEOMETRY_VERSION),warnings=['混合情境估算未作真實賽事外部準確度驗證。','陡坡垂直速率由使用者明示，未從單筆成績估得；速度限制不是安全或生理界線。','域內固定速率只辨識一個条件尺度，不是VO2max、醫療安全或超馬耐久模型。','地形、路面、天候與体能可比性由使用者確認，GPX與DEM不能驗證。','陡坡與域內時間分開計算；無額外疲勞，沒有把未知區段當零或按目標完賽重分配。','未完成時computed_time_s只是已知區段加總，不能當完賽或時間下界保證。'])

    def finite_output(value):
        if isinstance(value,float) and not math.isfinite(value):_error('hybrid_numeric_range','輸出比例、配速或時間超出有限數值範圍。')
        if isinstance(value,dict):
            for v in value.values():finite_output(v)
        elif isinstance(value,(list,tuple)):
            for v in value:finite_output(v)
    finite_output(result)
    return result

def predict_from_gpx(reference_gpx,target_gpx,evidence,assumptions):
    _validate_evidence(evidence);_assumptions(assumptions)
    return predict_geometries(build_geometry(parse_gpx(reference_gpx)),build_geometry(parse_gpx(target_gpx)),evidence,assumptions)
