"""One-anchor, experimental forward route transfer. No target goal is accepted.

Costs use the unchanged core running_cost. Fatigue and caps are explicit
scenario assumptions; one historical moving time identifies ONLY a scale.
"""
from datetime import date
from bisect import bisect_right
from dataclasses import asdict
from copy import deepcopy
import math
from trail_planner.gpx import InputError, parse_gpx
from trail_planner.geometry import Geometry, GEOMETRY_VERSION, build_geometry
from trail_planner.planning import running_cost, MODEL_VERSION as COST_CORE_VERSION

MODEL_VERSION = 'anchor-minetti-effort-forward-v1'
EVIDENCE_FIELDS = {'reference_completed_on', 'forecast_as_of', 'target_start',
                   'reference_moving_s', 'reference_elapsed_s', 'reference_stops_s',
                   'reference_is_actual', 'comparable_conditions_confirmed'}
OPTIONAL_ASSUMPTION_FIELDS = {'target_checkpoints'}
ASSUMPTION_FIELDS = {'fatigue_model', 'reference_end_slowdown', 'max_speed_m_s',
                     'uphill_cap_grade', 'uphill_cap_m_s', 'downhill_cap_grade',
                     'downhill_cap_m_s', 'target_stops_s'}


def _error(code, message):
    raise InputError(code, message)


def _number(value, name, *, zero=False):
    try:
        ok = not isinstance(value, bool) and isinstance(value, (int, float)) and math.isfinite(value)
    except (OverflowError, TypeError):
        ok = False
    if not ok or value < 0 or (not zero and value == 0):
        _error('invalid_prediction_number', f'{name} 必須是{"非負" if zero else "正"}有限數字。')
    return float(value)


def _sum(values):
    try:
        result = math.fsum(values)
    except (OverflowError, ValueError):
        _error('prediction_numeric_range', '累計值超出有限數值範圍。')
    if not math.isfinite(result):
        _error('prediction_numeric_range', '累計值超出有限數值範圍。')
    return result


def _day(value, name):
    try:
        result = date.fromisoformat(value) if isinstance(value, str) else None
    except ValueError:
        result = None
    if result is None or result.isoformat() != value:
        _error('invalid_prediction_date', f'{name} 必須是 YYYY-MM-DD。')
    return result


def _validate_evidence(e):
    if not isinstance(e, dict) or set(e) != EVIDENCE_FIELDS:
        _error('prediction_evidence_schema', '歷史證據欄位不符；不接受目標時間或額外能力係數。')
    for key in ('reference_is_actual', 'comparable_conditions_confirmed'):
        if not isinstance(e[key], bool):
            _error('prediction_evidence_schema', f'{key} 必須是布林值。')
        if not e[key]:
            _error('prediction_confirmation_required', '須確認是真實歷史成績，且體能、努力程度與路況條件大致可比。')
    completed = _day(e['reference_completed_on'], 'reference_completed_on')
    asof = _day(e['forecast_as_of'], 'forecast_as_of')
    target = _day(e['target_start'], 'target_start')
    if asof > target or completed >= asof or completed >= target:
        _error('prediction_date_order', '參考成績須早於本次預估與目標日期。')
    age = (target-completed).days
    if age > 365:
        _error('reference_too_old', '本版參考成績須在目標賽事之前365天內；此為資料使用政策。')
    moving, elapsed, stops = [e[k] for k in ('reference_moving_s', 'reference_elapsed_s', 'reference_stops_s')]
    if moving is not None:
        moving = _number(moving, 'reference_moving_s')
    if elapsed is not None:
        elapsed = _number(elapsed, 'reference_elapsed_s')
    if stops is not None:
        stops = _number(stops, 'reference_stops_s', zero=True)
    if elapsed is not None and stops is not None:
        if stops >= elapsed:
            _error('reference_stop_conflict', '歷史全部停頓時間須少於總完賽時間。')
        derived = elapsed-stops
        if moving is not None and abs(moving-derived) > 1.0:
            _error('reference_time_conflict', '歷史 moving 與 elapsed−stops 不相符。')
        if moving is None:
            moving = derived
    if moving is None:
        _error('reference_moving_unknown', '需要真實 moving，或 elapsed 及已知全部停頓；未知停頓不能當零。')
    if elapsed is not None and moving > elapsed:
        _error('reference_time_conflict', '歷史 moving 不能大於 elapsed。')
    return moving, age


def _validate_assumptions(a):
    if not isinstance(a, dict) or not ASSUMPTION_FIELDS <= set(a) or set(a)-ASSUMPTION_FIELDS-OPTIONAL_ASSUMPTION_FIELDS:
        _error('prediction_assumption_schema', '情境欄位不符；不接受目標完賽、Riegel、睡眠或額外係數。')
    if a['fatigue_model'] not in ('constant_rate', 'cumulative_effort'):
        _error('invalid_fatigue_scenario', '疲勞情境須選 constant_rate 或 cumulative_effort。')
    if a['fatigue_model'] == 'constant_rate':
        if a['reference_end_slowdown'] is not None:
            _error('invalid_fatigue_scenario', '固定速率模式的 reference_end_slowdown 須為 null。')
        fatigue = 1.0
    else:
        fatigue = _number(a['reference_end_slowdown'], 'reference_end_slowdown')
        if fatigue < 1:
            _error('invalid_fatigue_scenario', '指定參考末端局部耗時倍率須至少為1。')
    caps = {}
    for key in ('max_speed_m_s', 'uphill_cap_m_s', 'downhill_cap_m_s'):
        caps[key] = None if a[key] is None else _number(a[key], key)
    for prefix, lo, hi in (('uphill', 0., .45), ('downhill', -.45, 0.)):
        grade, cap = a[prefix+'_cap_grade'], caps[prefix+'_cap_m_s']
        if (grade is None) != (cap is None):
            _error('invalid_cap_scenario', '坡度門檻和速度上限須成對提供，或都為 null。')
        if grade is not None:
            try:
                valid = not isinstance(grade, bool) and isinstance(grade, (int,float)) and math.isfinite(grade) and lo <= grade <= hi
            except (OverflowError, TypeError):
                valid = False
            if not valid:
                _error('invalid_cap_scenario', '坡度情境門檻超出方向或±45%範圍。')
        caps[prefix+'_cap_grade'] = grade
    stops = _number(a['target_stops_s'], 'target_stops_s', zero=True)
    return fatigue, caps, stops


def _route_data(g, caps):
    if not isinstance(g, Geometry) or g.blocked or not g.cells:
        _error('prediction_route_blocked', '參考與目標 GPX 均須為可處理的連續有效路線。')
    if not g.elevation_complete:
        _error('prediction_missing_elevation', '跨路線預估需要兩條 GPX 的完整海拔，不能用平路補值。')
    rows, previous = [], 0.
    for c in g.cells:
        vals = (c.start_m,c.end_m,c.horizontal_m,c.elevation_start_m,c.elevation_end_m,c.grade)
        if any(isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v) for v in vals):
            _error('prediction_geometry_invalid', '幾何存在非有限或缺失數值。')
        if c.distance_m <= 0 or c.horizontal_m <= 0 or abs(c.start_m-previous) > 1e-7*max(1,g.distance_m):
            _error('prediction_geometry_invalid', '幾何 cell 不連續或距離無效。')
        if abs(c.grade) > .45+1e-10:
            _error('prediction_grade_out_of_domain', '處理後坡度超出±45%研究範圍；本模式不截斷坡度。')
        if abs(c.grade-(c.elevation_end_m-c.elevation_start_m)/c.horizontal_m) > 1e-8:
            _error('prediction_geometry_invalid', '坡度與海拔差不相符。')
        if abs(c.distance_m-math.hypot(c.horizontal_m,c.elevation_end_m-c.elevation_start_m)) > 1e-7*max(1,c.distance_m):
            _error('prediction_geometry_invalid', '沿坡距離與幾何不相符。')
        effort = running_cost(c.grade)*c.distance_m
        if not math.isfinite(effort) or effort <= 0:
            _error('prediction_geometry_invalid', '路線成本無法以有限正值表示。')
        options = []
        if caps['max_speed_m_s'] is not None:
            options.append(caps['max_speed_m_s'])
        if caps['uphill_cap_grade'] is not None and c.grade >= caps['uphill_cap_grade'] - 1e-10:
            options.append(caps['uphill_cap_m_s'])
        if caps['downhill_cap_grade'] is not None and c.grade <= caps['downhill_cap_grade'] + 1e-10:
            options.append(caps['downhill_cap_m_s'])
        cap = min(options) if options else None
        lower = c.distance_m/cap if cap is not None else 0.
        if not math.isfinite(lower):
            _error('prediction_numeric_range', '速度上限造成超出數值範圍的時間。')
        rows.append((c, effort, lower, cap))
        previous = c.end_m
    if abs(previous-g.distance_m) > 1e-7*max(1,g.distance_m):
        _error('prediction_geometry_invalid', '路線總距離與 cell 不相符。')
    return rows, _sum(r[1] for r in rows)


def _exp_integral(a, rate, lower):
    """Exact integral_0^1 max(a*exp(rate*x),lower) dx, rate >= 0."""
    if a == 0:
        return lower
    if rate == 0:
        return max(a, lower)
    if lower <= a:
        return a*math.expm1(rate)/rate
    # Compare in log space before evaluating the uncapped branch.
    crossing = (math.log(lower)-math.log(a))/rate
    if crossing >= 1:
        return lower
    # At crossing, a*exp(rate*crossing) == lower; this form is stable.
    return lower*crossing + lower*math.expm1(rate*(1-crossing))/rate


def _prepared(rows, decay):
    prepared, effort_prefix = [], 0.
    for c,e,lower,cap in rows:
        exponent = decay*effort_prefix
        end_exponent = decay*(effort_prefix+e)
        # Resource/numeric guard only, not a physiological validity boundary.
        if not math.isfinite(end_exponent) or end_exponent > 50:
            _error('prediction_scenario_extreme', '指定疲勞情境外推過大，超出本版數值計算範圍。')
        prepared.append((c,e,lower,cap,e*math.exp(exponent),decay*e,exponent,end_exponent))
        effort_prefix += e
    return prepared


def _times(prepared, scale):
    try:
        result = [_exp_integral(scale*r[4], r[5], r[2]) for r in prepared]
    except (OverflowError, ValueError):
        _error('prediction_numeric_range', '預估超出可計算數值範圍。')
    if any(not math.isfinite(t) or t < 0 for t in result):
        _error('prediction_numeric_range', '預估時間不是有限非負數字。')
    return result



def _checkpoint_specs(assumptions, distance, stops):
    """Validate stop positions without feeding them into geometry or rate fit."""
    if 'target_checkpoints' not in assumptions:
        return [{'name':'終點', 'distance_m':distance, 'stop_s':0.}], stops, 'aggregate_unlocated'
    raw = assumptions['target_checkpoints']
    if not isinstance(raw,list) or len(raw)>100:
        _error('prediction_checkpoints_invalid', '補給站须為不超過100站的清單。')
    result, previous = [], 0.
    for cp in raw:
        if not isinstance(cp,dict) or set(cp)!={'name','distance_m','stop_s'}:
            _error('prediction_checkpoints_invalid', '每站只接受name、distance_m、stop_s。')
        name = cp['name']
        if not isinstance(name,str) or not name.strip() or len(name)>80:
            _error('prediction_checkpoints_invalid', '每站名稱須為1至80字。')
        d = _number(cp['distance_m'],'checkpoint.distance_m',zero=True)
        stop = _number(cp['stop_s'],'checkpoint.stop_s',zero=True)
        if not previous<d<=distance:
            _error('prediction_checkpoint_distance', '補給站距離須沿線嚴格遞增，且不超出終點。')
        if d==distance and stop!=0:
            _error('prediction_finish_stop', '完賽是到達終點；終點後停留不計入預測。')
        result.append({'name':name.strip(),'distance_m':d,'stop_s':stop})
        previous=d
    total = _sum(cp['stop_s'] for cp in result)
    if abs(total-stops)>1e-9*max(1.,total,stops):
        _error('prediction_stop_total_mismatch', '各站停留總和須與target_stops_s一致，不能重加或藏入未定位停站。')
    if not result or result[-1]['distance_m']!=distance:
        result.append({'name':'終點','distance_m':distance,'stop_s':0.})
    return result, total, 'explicit_checkpoints'


def _checkpoint_times(prepared,times,scale,specs,stop_placement,stop_total):
    ends=[r[0].end_m for r in prepared]
    prefixes=[0.]
    for t in times:
        prefixes.append(_sum((prefixes[-1],t)))
    prefixes[-1]=_sum(times)
    out=[];seen_stops=[];prior_stops=0.;previous_moving=0.;previous_departure=0.;previous_distance=0.
    for cp in specs:
        d=cp['distance_m']
        index=bisect_right(ends,d)
        if index==len(prepared):
            moving=prefixes[-1]
        else:
            row=prepared[index];c=row[0]
            fraction=min(1.,max(0.,(d-c.start_m)/c.distance_m))
            # x=f*u: integral_0^f max(a exp(kx),L) dx
            # = f * integral_0^1 max(a exp(k*f*u),L) du.
            part=0. if fraction==0 else fraction*_exp_integral(scale*row[4],row[5]*fraction,row[2])
            moving=_sum((prefixes[index],part))
        unlocated=stop_total if stop_placement=='aggregate_unlocated' else 0.
        arrival=_sum((moving,prior_stops,unlocated))
        departure=_sum((arrival,cp['stop_s']))
        leg_distance=d-previous_distance
        leg_moving=moving-previous_moving
        leg_elapsed=departure-previous_departure
        out.append(dict(cp,cumulative_moving_s=moving,moving_s=leg_moving,
                        start_elapsed_s=previous_departure,
                        leg_distance_m=leg_distance,arrival_elapsed_s=arrival,
                        departure_elapsed_s=departure,leg_elapsed_s=leg_elapsed,
                        pace_s_per_km=leg_moving/leg_distance*1000,
                        total_pace_s_per_km=leg_elapsed/leg_distance*1000,
                        unallocated_stops_s=unlocated))
        seen_stops.append(cp['stop_s'])
        prior_stops=_sum(seen_stops)
        previous_moving=moving;previous_departure=departure;previous_distance=d
    return out


def _provenance(g, effort):
    return {'route_sha256':g.route_sha256, 'geometry_sha256':g.geometry_sha256,
            'geometry_version':GEOMETRY_VERSION, 'geometry_config':asdict(g.config),
            'distance_m':g.distance_m, 'ascent_m':g.ascent_m, 'descent_m':g.descent_m,
            'effort_j_kg':effort, 'source_points':g.source_points, 'cells':len(g.cells)}


def predict_geometries(reference_geometry, target_geometry, evidence, assumptions):
    """Advanced pure entrypoint for same-core Geometry objects; never plan dicts."""
    moving, age = _validate_evidence(evidence)
    fatigue, caps, stops = _validate_assumptions(assumptions)
    rr, er = _route_data(reference_geometry, caps)
    tr, et = _route_data(target_geometry, caps)
    if reference_geometry.config != target_geometry.config:
        _error('prediction_geometry_config_mismatch', '兩條路線必須使用相同版本與設定的幾何處理。')
    checkpoint_specs, stops, stop_placement = _checkpoint_specs(assumptions,target_geometry.distance_m,stops)
    decay = math.log(fatigue)/er
    rp, tp = _prepared(rr, decay), _prepared(tr, decay)
    floor = _sum(r[2] for r in rp)
    tolerance = 1e-9*max(1.,moving,floor)
    if moving < floor-tolerance:
        _error('reference_faster_than_caps', '參考 moving 比所選速度上限允許的最快時間還短。')
    if moving <= floor+tolerance:
        _error('reference_scale_unidentifiable', '參考時間位於速度限制的下界，無法辨識有限且唯一的有效能力尺度。')
    unscaled = _sum(_exp_integral(r[4],r[5],0.) for r in rp)
    if not math.isfinite(unscaled) or unscaled <= 0:
        _error('prediction_numeric_range', '參考成本積分超出數值範圍。')
    if floor == 0:
        scale = moving/unscaled
    else:
        left, right = 0., moving/unscaled
        for _ in range(80):
            mid = left+(right-left)/2
            if mid == left or mid == right:
                break
            if _sum(_times(rp,mid)) < moving:
                left = mid
            else:
                right = mid
        scale = left+(right-left)/2
    if not math.isfinite(scale) or scale <= 0 or not math.isfinite(1/scale):
        _error('prediction_numeric_range', '能力尺度无法以有限正數表示。')
    fitted = _sum(_times(rp,scale))
    if abs(fitted-moving) > 1e-8*max(1,moving):
        _error('prediction_fit_failed', '參考路線單一尺度求解未收斂。')
    target_times = _times(tp,scale)
    target_moving = _sum(target_times)
    elapsed = target_moving+stops
    if target_moving <= 0 or not math.isfinite(elapsed) or elapsed <= 0:
        _error('prediction_numeric_range', '總時間超出有限正值範圍。')
    timeline, cumulative = [], 0.
    for r,t in zip(tp,target_times):
        c,e,lower,cap,_,_,start_exp,end_exp = r
        cumulative += t
        timeline.append({'start_m':c.start_m, 'end_m':c.end_m, 'moving_s':t,
                         'cumulative_moving_s':cumulative, 'effort_j_kg':e,
                         'grade':c.grade, 'speed_cap_m_s':cap,
                         'fatigue_multiplier_start':math.exp(start_exp),
                         'fatigue_multiplier_end':math.exp(end_exp)})
    checkpoints = _checkpoint_times(tp,target_times,scale,checkpoint_specs,stop_placement,stops)
    warnings = [
        '跨路線實驗預估尚未作真實賽事外部準確度驗證。',
        '有效速率是單筆歷史表現的條件尺度，不是量測生理功率或VO2max。',
        '路面、天候、體能與努力程度相近由使用者確認，GPX無法驗證。',
        'Minetti跑台跑步成本不是技術下坡、跑走切換、肌肉損傷或超馬耐久模型。',
        '停站為指定情境，不預測塞車、意外停頓或停站後恢復。',
    ]
    if any(c.grade < 0 for c,_,_,_ in tr) and caps['max_speed_m_s'] is None and caps['downhill_cap_m_s'] is None:
        warnings.append('目標含下坡但未設下坡速度上限；純代謝式可能明顯高估下坡速度。')
    if fatigue != 1:
        warnings.append('effort指數衰退與末端倍率為使用者情境，未由這筆歷史識別；沒有另疊距離衰退。')
    else:
        warnings.append('固定速率是零額外衰退假設；較長路線的耐久衰退未被識別。')
    if et > er:
        warnings.append('目標累積effort大於參考路線，屬更長負荷外推。')
    return {
        'schema_version':'cross-trail-prediction/1.0', 'model_version':MODEL_VERSION,
        'status':'experimental_prediction', 'purpose':'forward_finish_prediction',
        'calibration_status':'one_anchor_conditionally_fitted_not_externally_validated',
        'moving_s':target_moving, 'stops_s':stops, 'elapsed_s':elapsed,
        'reference':_provenance(reference_geometry,er), 'target':_provenance(target_geometry,et),
        'reference_moving_s':moving, 'reference_age_days':age,
        'effort_ratio':et/er, 'distance_ratio':target_geometry.distance_m/reference_geometry.distance_m,
        'effective_rate_scale_j_kg_s':1/scale, 'anchor_fit_residual_s':fitted-moving,
        'identification':{'fitted_parameters':['effective_rate_scale'],
                          'fatigue_parameter_source':'explicit_scenario_not_fitted',
                          'cap_source':'explicit_scenario_not_fitted',
                          'conditions_match':'user_confirmed_not_verified'},
        'assumptions':deepcopy(assumptions), 'decay_per_j_kg':decay,
        'target_end_slowdown':math.exp(decay*et),
        'uncertainty':{'kind':'not_calibrated','interval':None,'goal_probability':None},
        'accuracy_claim':None, 'canonical_timeline':timeline, 'warnings':warnings,
        'geometry_snapshot':[asdict(c) for c in target_geometry.cells],
        'terrain_display_compatible':stop_placement=='explicit_checkpoints' or stops==0,
        'checkpoints':checkpoints, 'checkpoint_query_version':'analytic-prefix-v1',
        'checkpoint_stop_placement':stop_placement,
        'provenance':{'cost_core_version':COST_CORE_VERSION,
                      'cost_source':'https://doi.org/10.1152/japplphysiol.01177.2001',
                      'cost_function':'unchanged trail_planner.planning.running_cost',
                      'grade_domain':[-.45,.45], 'reference_recency_policy_days':365},
    }


def predict_from_gpx(reference_gpx, target_gpx, evidence, assumptions):
    # Validate small inputs before parsing either potentially large file.
    _validate_evidence(evidence)
    _validate_assumptions(assumptions)
    reference = build_geometry(parse_gpx(reference_gpx))
    target = build_geometry(parse_gpx(target_gpx))
    return predict_geometries(reference,target,evidence,assumptions)
