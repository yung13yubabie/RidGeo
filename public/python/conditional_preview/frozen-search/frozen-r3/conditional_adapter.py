"""Isolated conditional scenario adapter. No production imports or defaults.

All evidence remains declared rather than scientifically authenticated. Only
explicit scenarios are executable; fitted/predictive/recommendation modes are
closed pending a separately reviewed evidence admission implementation.
"""
from __future__ import annotations
from dataclasses import asdict, fields, replace
from datetime import datetime, timedelta
from bisect import bisect_right
import copy
import hashlib
import json
import math
from pathlib import Path
import sys
import time

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / 'dependencies'))
import variable_transition as transition
from dependencies import intensity_transition as kernel
from trail_planner.geometry import Geometry, Cell, GeometryConfig, GEOMETRY_VERSION
from trail_planner.planning import running_cost, MODEL_VERSION
from trail_planner.gpx import InputError
import cross_trail_predictor as core

VERSION = 'conditional-route-recovery/0.3-bounded-validation'
ARTIFACT_SCHEMA = 'ridgeq.calibration-design/v1'
FREE_POLICY = 'max-fixed-scale-exp-total-deficit-cap/v1'
OBSERVATION_MODEL = 'confirmed-moving-total-fixed-controls/v1'
CONTROL_FAMILY = 'original-cell-clipped-exponential/v1'
TOP_FIELDS = set(json.loads((HERE / 'artifact-template.json').read_text()))
PARAM_UNITS = {
 'scale_s_per_j_kg':'s/(J/kg)', 'accrual_per_j_kg':'1/(J/kg)',
 'elasticity':'dimensionless', 'fast_fraction':'dimensionless',
 'recovery_rate_per_s':'1/s', 'service_exposure_fraction':'dimensionless'}
STATE_FIELDS = {f.name for f in fields(kernel.State)}
CAP_FIELDS = {'max_speed_m_s','uphill_cap_m_s','downhill_cap_m_s','uphill_cap_grade','downhill_cap_grade'}
MAX_CELLS = 25000
MAX_CP = 1000
MAX_LOCKS = 1000
MAX_PROVENANCE = 4096
HARD_MAX_WORK = 10000000
HARD_MAX_AGGREGATE_EVENTS = 4000000
HARD_MAX_AGGREGATE_PIECES = 12000000
EXPECTED = {
 'cross_trail_predictor.py':'2f91c50c176c626acd2665f1d229f4baeb394e01d7ed1e1f37ad52bca74c0be3',
 'trail_planner/gpx.py':'734e1aae59de0b4775d74257c767de9e5f4648b69247988b1087ec27fa18fe6f',
 'trail_planner/__init__.py':'06096ad97f2c6ce19894e9686fe836cd438309522d0781bf9a9bf263c41b15f3',
 'variable_transition.py':'95b6ad84d3cc19e4d8758c08a92669ad82eca956e9ddbb07db1b8a22529c08fd',
 'dependencies/intensity_transition.py':'f6b9f0a4d768e838e40de8320d225615339291ce8ce82915334e4189bc7c22ed',
 'trail_planner/geometry.py':'8a527265f1f890f913c4cc33e513afb7cb61cd14150e6155e9d9fcfe2d37bd25',
 'trail_planner/planning.py':'219bdcc59fea3d2ec581bd45adad0d8162e789d367437f1bec79d2066d276080'}


def fail(code, message):
    raise kernel.ModelError(code, message)


def strict(v, names, label):
    if not isinstance(v, dict) or set(v) != set(names):
        fail('invalid_schema', label + ' fields')
    return v



def bounded_input(value,budget=None):
    """JSON-tree bound before serialization: depth 32, 100k nodes, 2M chars.

    No callbacks/iterators/custom mappings are traversed. Bytes are not admitted
    here; source documents must be finite JSON objects. Cancellation is checked
    at each node when a public request provides a budget.
    """
    stack=[(value,0)];nodes=chars=0
    while stack:
        v,depth=stack.pop();nodes+=1
        if budget is not None:budget.take()
        if nodes>100000 or depth>32:fail('resource_limit','JSON node/depth bound')
        if type(v) is dict:
            if nodes+len(stack)+len(v)>100000:fail('resource_limit','JSON aggregate pending-node bound')
            for k,x in v.items():
                if budget is not None:budget.take()
                if not isinstance(k,str):fail('invalid_schema','JSON keys')
                chars+=len(k)
                if chars>2000000:fail('resource_limit','JSON character bound')
                stack.append((x,depth+1))
        elif type(v) in (list,tuple):
            if nodes+len(stack)+len(v)>100000:fail('resource_limit','JSON aggregate pending-node bound')
            for x in v:
                if budget is not None:budget.take()
                stack.append((x,depth+1))
        elif isinstance(v,str):chars+=len(v)
        elif v is None or isinstance(v,bool):pass
        elif isinstance(v,(int,float)):
            kernel.num(v,'JSON number',signed=True)
        else:fail('invalid_schema','JSON scalar type')
        if chars>2000000:fail('resource_limit','JSON character bound')


def schedule_checked(tasks,budget):
    """Same declared makespan semantics with cooperative checks in validation."""
    rows={};refs=0
    for t in sequence(tasks,4096,'service tasks'):
        budget.take();strict(t,('id','start_s','duration_s','resources','predecessors'),'service task')
        ident=label(t['id'],'task id')
        if ident in rows:fail('invalid_schema','duplicate service task')
        start=kernel.num(t['start_s'],'task start');end=kernel.add(start,kernel.num(t['duration_s'],'task duration'))
        resources=sequence(t['resources'],32,'resources');preds=sequence(t['predecessors'],64,'predecessors')
        if len(set(resources))!=len(resources) or len(set(preds))!=len(preds):fail('invalid_schema','duplicate service refs')
        for x in (*resources,*preds):budget.take();label(x,'service reference')
        refs+=len(resources)+len(preds)
        if refs>32768:fail('resource_limit','service references')
        rows[ident]=(start,end,resources,preds)
    incoming={k:len(v[3]) for k,v in rows.items()};succ={k:[] for k in rows};by_resource={}
    for ident,(start,end,resources,preds) in rows.items():
        budget.take()
        for pred in preds:
            budget.take()
            if pred==ident or pred not in rows or rows[pred][1]>start:fail('invalid_schema','service precedence')
            succ[pred].append(ident)
        if end>start:
            for resource in resources:budget.take();by_resource.setdefault(resource,[]).append((start,end))
    ready=[k for k,n in incoming.items() if not n];visited=0
    while ready:
        budget.take();ident=ready.pop();visited+=1
        for nxt in succ[ident]:
            budget.take();incoming[nxt]-=1
            if not incoming[nxt]:ready.append(nxt)
    if visited!=len(rows):fail('invalid_schema','service dependency cycle')
    for intervals in by_resource.values():
        budget.take(len(intervals));end=0.
        for left,right in sorted(intervals):
            budget.take()
            if left<end:fail('invalid_schema','service resource overlap')
            end=right
    return max((v[1] for v in rows.values()),default=0.)

def digest(v):
    bounded_input(v)
    try:
        return hashlib.sha256(json.dumps(v, sort_keys=True, allow_nan=False,
                       separators=(',',':')).encode()).hexdigest()
    except (ValueError,TypeError,OverflowError,RecursionError):
        fail('invalid_schema', 'unhashable or nonfinite JSON')


def sequence(v, maximum, label):
    if not isinstance(v, (list,tuple)) or len(v) > maximum:
        fail('resource_limit', label)
    return v


def label(v, name):
    return kernel.label(v, name)


def stamp(v, name):
    label(v,name)
    try:
        d = datetime.fromisoformat(v.replace('Z','+00:00'))
        if d.tzinfo is None:
            fail('invalid_schema', name+' needs timezone')
        return d
    except ValueError:
        fail('invalid_schema', name+' timestamp')


def verify_dependencies():
    for path, expected in EXPECTED.items():
        if hashlib.sha256((HERE/'dependencies'/path).read_bytes()).hexdigest() != expected:
            fail('model_hash_mismatch', path)


class AggregatePrimitiveBudget(transition.Budget):
    """Explicit adapter-only aggregate extension; frozen kernel stays unchanged.

    Counters cover every historical trial and target call, never reset per
    replay. This alters only the wrapper resource admission, not mathematics.
    """
    def __init__(self,max_events,max_pieces,cancelled=None):
        for name,value,maximum in (('aggregate events',max_events,HARD_MAX_AGGREGATE_EVENTS),('aggregate pieces',max_pieces,HARD_MAX_AGGREGATE_PIECES)):
            if isinstance(value,bool) or not isinstance(value,int) or not 0<=value<=maximum:fail('resource_limit',name)
        super().__init__(min(max_events,transition.HARD_MAX_EVENTS),min(max_pieces,transition.HARD_MAX_PIECES),cancelled)
        self.max_events=max_events;self.max_pieces=max_pieces
    def snapshot(self):
        return dict(super().snapshot(),limit_scope='explicit_adapter_aggregate_extension_no_per_trial_reset')

class WorkBudget:
    """Additional route/solver work, independent of frozen primitive counters."""
    def __init__(self, max_work, cancelled=None, max_wall_s=300.):
        if isinstance(max_work,bool) or not isinstance(max_work,int) or not 0 <= max_work <= HARD_MAX_WORK:
            fail('invalid_number','max_work')
        self.max_work,self.work=max_work,0
        self.max_wall_s=kernel.num(max_wall_s,'max_wall_s',positive=True)
        if self.max_wall_s>3600:fail('resource_limit','wall-time budget exceeds 3600s')
        self.deadline=time.perf_counter()+self.max_wall_s;self.timed_out=False
        def cancel_check():
            if time.perf_counter()>=self.deadline:self.timed_out=True;return True
            return False if cancelled is None else cancelled()
        self.cancellation_check=cancel_check
        self.primitives=transition.Budget(100000,300000,cancel_check)
    def take(self, n=1):
        self.primitives.check()
        if self.work+n > self.max_work:
            fail('resource_limit','route/solver work budget exhausted')
        self.work+=n
    def snapshot(self):
        return dict(self.primitives.snapshot(), adapter_work=self.work, max_adapter_work=self.max_work,max_wall_s=self.max_wall_s)


def capabilities(anchor='explicit_assumption', support='not_assessed'):
    return dict(anchor_status=anchor, intensity_effect_status='explicit_assumption',
      recovery_effect_status='explicit_assumption', service_status='explicit_declared_composition',
      support_status=support, policy_validation_status='not_validated', search_status='not_requested',
      allowed_output_modes=['conditional_scenario'], recommended_rest_s=None)


def unavailable(status, reason, missing=()):
    return dict(schema_version=VERSION,status=status,reason=reason,missing=list(missing),complete=False,
      final_state=None,finish_elapsed_s=None,recommended_rest_s=None,accuracy_claim=None,
      personal_causal_effect_identified=False,mutates_input=False)


def admit(envelope, provenance, *, isolated_test=False, allow_missing_scale=False):
    verify_dependencies()
    if envelope is None:
        return unavailable('not_estimable','parameter_artifact_missing'),None
    strict(envelope,('payload','sha256'),'artifact envelope')
    a=envelope['payload']
    strict(a, TOP_FIELDS,'artifact')
    if envelope['sha256'] != digest(a): fail('artifact_hash_mismatch','artifact payload')
    if a['schema_version'] != ARTIFACT_SCHEMA: fail('invalid_schema','artifact version')
    if a['artifact_kind'] is None:
        return unavailable('not_estimable','parameter_artifact_incomplete',['artifact_kind']),None
    if a['artifact_kind'] not in ('explicit_scenario','population_predictive','personal_predictive','personal_intervention'):fail('invalid_schema','artifact kind')
    if a['artifact_kind'] != 'explicit_scenario':
        return unavailable('needs_calibration','predictive_and_intervention_evidence_admission_not_implemented'),None
    if a['status'] not in ('draft','qualified','rejected'): fail('invalid_schema','artifact status')
    if a['status']=='rejected': return unavailable('needs_calibration','artifact_rejected'),None
    label(a['artifact_id'],'artifact_id')
    created,cutoff=stamp(a['created_at'],'created_at'),stamp(a['data_cutoff_at'],'data_cutoff_at')
    if cutoff>created: fail('invalid_schema','data cutoff follows artifact creation')
    m=a['model']
    strict(m,('kernel_version','kernel_sha256','variable_profile_version','geometry_cost_version',
              'geometry_config_sha256','observation_model_id','free_control_policy_id','prescribed_control_families'),'model')
    if (m['kernel_version'] != kernel.VERSION or m['kernel_sha256'] != EXPECTED['dependencies/intensity_transition.py']
       or m['variable_profile_version'] != transition.VERSION or m['geometry_cost_version'] != GEOMETRY_VERSION+'/'+MODEL_VERSION
       or m['observation_model_id'] != OBSERVATION_MODEL or m['free_control_policy_id'] != FREE_POLICY
       or m['prescribed_control_families'] != [CONTROL_FAMILY]):
        fail('model_hash_mismatch','artifact law/version/control policy')
    strict(provenance,('records',),'provenance')
    catalog={}
    for r in sequence(provenance['records'],MAX_PROVENANCE,'provenance records'):
        strict(r,('id','kind','content','content_sha256','rights_basis'),'provenance record')
        ident=label(r['id'],'provenance.id')
        if ident in catalog: fail('invalid_schema','duplicate provenance id')
        if r['content_sha256'] != digest(r['content']): fail('provenance_hash_mismatch',ident)
        if r['kind'] not in ('explicit_assumption','synthetic_fixture','owned_activity','licensed_activity'):
            fail('invalid_schema','provenance kind')
        if r['kind']=='synthetic_fixture' and not isolated_test:
            fail('scenario_fixture_not_authorized','synthetic fixture is isolated-test-only')
        if r['rights_basis'] not in ('explicit_scenario_only','isolated_synthetic_test','user_owned_declared','explicit_license_declared'):
            fail('rights_not_admitted',ident)
        catalog[ident]=r
    values={};missing=[]
    strict(a['parameters'],PARAM_UNITS,'parameters')
    for name,units in PARAM_UNITS.items():
        r=a['parameters'][name]
        strict(r,('value','units','role','provenance_id','identifiability'),name)
        if r['units']!=units: fail('invalid_schema',name+' units')
        if r['value'] is None:
            if name!='scale_s_per_j_kg' or not allow_missing_scale: missing.append(name)
            values[name]=None
            continue
        if r['role'] not in ('explicit_assumption','fixed_convention'):
            fail('evidence_not_admitted','scenario parameter must remain explicit assumption/convention')
        if r['provenance_id'] not in catalog: fail('provenance_missing',name)
        if catalog[r['provenance_id']]['kind'] not in ('explicit_assumption','synthetic_fixture'):
            fail('evidence_not_admitted','raw activity cannot qualify a coefficient')
        values[name]=kernel.num(r['value'],name,positive=name=='scale_s_per_j_kg',signed=name=='elasticity')
    if values.get('elasticity') is not None and values['elasticity']<0:
        fail('outside_adapter_family','adapter currently supports beta>=0 only; frozen kernel has broader support')
    if any(values.get(n) is not None and values[n]>1 for n in ('fast_fraction','service_exposure_fraction')):
        fail('invalid_number','fraction')
    ref=a['state_reference']
    strict(ref,('protocol_id','gauge_resolution','initial_state','conventions','measured_evidence_ids'),'state reference')
    if ref['initial_state'] is None: missing.append('initial_state')
    else:
        strict(ref['initial_state'],STATE_FIELDS,'initial state')
        if any(v is None for v in ref['initial_state'].values()): missing.append('initial_state_fields')
    if ref['gauge_resolution'] not in ('fixed_all_initial_fields_operational_convention','fixed_initial_fields_independent_evidence'):
        missing.append('explicit_initial_state_gauge_resolution')
    if ref['protocol_id'] is None:missing.append('state_reference.protocol_id')
    else:label(ref['protocol_id'],'state reference protocol')
    sequence(ref['conventions'],32,'state conventions')
    if not ref['conventions']: missing.append('initial_state_conventions')
    if any(e not in catalog for e in ref['measured_evidence_ids']): fail('provenance_missing','state evidence')
    j=a['joint_parameter_distribution']
    strict(j,('kind','joint_draws_ref','weights_interpretation','initial_state_joint_draws_ref','probability_claim_supported'),'joint distribution')
    if j != dict(kind='none',joint_draws_ref=None,weights_interpretation=None,initial_state_joint_draws_ref=None,probability_claim_supported=False):
        fail('evidence_not_admitted','joint predictive distributions require separate evidence admission')
    sup=a['support']
    strict(sup,('exercise_modes','gaits','surfaces','technicality','grade_range','altitude_range_m','environment',
               'proxy_ratio_range','cumulative_effort_range_j_kg','cumulative_moving_range_s','cumulative_elapsed_range_s',
               'pre_stop_state_support','service_bundles','extra_rest_range_s','total_dwell_range_s','joint_support_method','recency_policy'),'support')
    for name in ('grade_range','altitude_range_m','proxy_ratio_range','cumulative_effort_range_j_kg',
                 'cumulative_moving_range_s','cumulative_elapsed_range_s','extra_rest_range_s','total_dwell_range_s'):
        r=sup[name]
        if not isinstance(r,list) or len(r)!=2: missing.append('support.'+name); continue
        lo,hi=(kernel.num(x,name,signed=name in ('grade_range','altitude_range_m')) for x in r)
        if lo>hi: fail('invalid_schema','support interval reversed')
    if sup['joint_support_method']!='explicit_scenario_box_not_empirical_support':
        fail('evidence_not_admitted','joint empirical support not established')
    if sup['exercise_modes']!=['ordinary_running'] or sup['gaits']!=['running']:
        fail('outside_declared_domain','walking/hybrid model unavailable in this adapter')
    for name in ('surfaces','technicality','service_bundles'):
        sequence(sup[name],1000,name)
        if not sup[name]: missing.append('support.'+name)
    strict(sup['environment'],('labels',),'environment')
    strict(sup['pre_stop_state_support'],('max_fast','max_persistent','max_effort_j_kg'),'pre-stop support')
    for n,v in sup['pre_stop_state_support'].items(): kernel.num(v,n)
    strict(sup['recency_policy'],('kind',),'recency')
    if sup['recency_policy']['kind']!='explicit_scenario_no_empirical_recency_claim': fail('evidence_not_admitted','recency')
    strict(a['data_manifest'],('ref','rights_ref','activities','fit_ids','calibration_ids','test_ids','independent_counts','exclusions_ref'),'data manifest')
    strict(a['fit'],('objective','measurement_model','behavior_assumptions','gauge_constraints','free_parameters','fixed_parameters','convergence','sensitivity_rank_report','profile_report','prior_sensitivity_report'),'fit')
    strict(a['validation'],('frozen_candidate_id','baseline_ids','heldout_ref','metrics','uncertainty_meaning','coverage','support_rejection_rate','intervention_result_ref','policy_result_ref','limitations'),'validation')
    strict(a['capabilities'],('computed_by_admission_layer','anchor_status','intensity_effect_status','recovery_effect_status','service_status','support_status','policy_validation_status','allowed_output_modes','recommended_rest_s'),'capabilities')
    # Preserve all design fields but do not trust any claimed capabilities/fit/validation.
    if missing: return unavailable('not_estimable','missing_explicit_inputs',missing),None
    init=kernel.State(**ref['initial_state'])
    if allow_missing_scale and values['scale_s_per_j_kg'] is None: p=None
    else: p=parameters(values,sup,a['artifact_id'])
    return dict(status='conditional_scenario',artifact_sha256=envelope['sha256'],capabilities=capabilities(),
      provenance_authenticity='caller_supplied_declarations_hash_checked_not_independently_authenticated',
      empirical_parameter_support=False),dict(artifact=copy.deepcopy(a),values=values,initial=init,parameters=p,catalog=catalog)


def parameters(values,support,artifact_id):
    raw={k:values[k] for k in PARAM_UNITS if k!='service_exposure_fraction'}
    raw.update(ratio_min=support['proxy_ratio_range'][0],ratio_max=support['proxy_ratio_range'][1],
      max_cumulative_effort_j_kg=support['cumulative_effort_range_j_kg'][1],
      max_cumulative_moving_s=support['cumulative_moving_range_s'][1],source_kind='explicit_scenario',source_ref=artifact_id)
    return kernel.Parameters(**raw)


def caps_validate(caps):
    strict(caps,CAP_FIELDS,'caps')
    a=dict(caps,fatigue_model='constant_rate',reference_end_slowdown=None,target_stops_s=0.)
    return core._validate_assumptions(a)[1]


def route_validate(g,caps,a,binding,context,budget):
    strict(binding,('route_sha256','geometry_sha256','geometry_config_sha256','owner_revision'),'route binding')
    if not isinstance(g,Geometry) or not isinstance(g.config,GeometryConfig) or not isinstance(g.cells,tuple): fail('invalid_schema','actual core canonical Geometry and Cells required')
    if len(g.cells)>MAX_CELLS: fail('resource_limit','canonical cells')
    for cell in g.cells:
        budget.take()
        if not isinstance(cell,Cell):fail('invalid_schema','actual core Cell required')
    if not g.cells or g.cells[0].start_m!=0. or g.cells[-1].end_m!=g.distance_m or any(left.end_m!=right.start_m for left,right in zip(g.cells,g.cells[1:])):
        fail('invalid_schema','canonical geometry must have exact contiguous route endpoints')
    config_hash=digest(asdict(g.config))
    rows,E=core._route_data(g,caps)
    # Geometry is already validated as <=25k fixed-field numeric core cells,
    # so its canonical hash has a separate bounded typed representation.
    geometry_hash=hashlib.sha256(json.dumps(dict(version=GEOMETRY_VERSION,config=asdict(g.config),cells=[asdict(c) for c in g.cells]),sort_keys=True,allow_nan=False,separators=(',',':')).encode()).hexdigest()
    if geometry_hash!=g.geometry_sha256 or binding['geometry_sha256']!=g.geometry_sha256 or binding['route_sha256']!=g.route_sha256:
        fail('stale_route_binding','geometry and route hash binding mismatch')
    if binding['geometry_config_sha256']!=config_hash or a['model']['geometry_config_sha256']!=config_hash:
        fail('stale_route_binding','geometry configuration mismatch')
    label(binding['owner_revision'],'owner revision')
    strict(context,('exercise_mode','gait','surface','technicality','environment_label'),'route context')
    support=a['support']
    for k,sk in (('exercise_mode','exercise_modes'),('gait','gaits'),('surface','surfaces'),('technicality','technicality')):
        if context[k] not in support[sk]: fail('outside_declared_domain',k)
    if context['environment_label'] not in support['environment']['labels']: fail('outside_declared_domain','environment')
    for c,*_ in rows:
        budget.take()
        if not support['grade_range'][0]<=c.grade<=support['grade_range'][1]: fail('outside_declared_domain','grade')
        if any(not support['altitude_range_m'][0]<=v<=support['altitude_range_m'][1] for v in (c.elevation_start_m,c.elevation_end_m)):
            fail('outside_declared_domain','altitude')
    return rows,E


def sections_validate(raw,g):
    ids=set();prev=0.;out=[]
    for r in sequence(raw,MAX_CELLS,'raw sections'):
        strict(r,('id','start_m','end_m'),'raw section')
        ident=label(r['id'],'raw section id');start,end=(kernel.num(r[n],n) for n in ('start_m','end_m'))
        if ident in ids or start!=prev or end<=start or end>g.distance_m: fail('invalid_schema','raw sections not contiguous')
        if end-start<=128*sys.float_info.epsilon*max(1.,end): fail('numeric_support','raw section too narrow')
        ids.add(ident);prev=end;out.append(dict(id=ident,start_m=start,end_m=end))
    if not out or prev!=g.distance_m: fail('invalid_schema','raw section route coverage')
    return out


def cp_validate(cps,g,support,budget):
    out=[];ids=set();prev=0.
    for i,c in enumerate(sequence(cps,MAX_CP,'checkpoints')):
        budget.take()
        strict(c,('id','name','distance_m','kind','service','rest_s','composition','bundle_id','cutoff'),'checkpoint')
        ident=label(c['id'],'occurrence id');label(c['name'],'occurrence name');d=kernel.num(c['distance_m'],'distance_m')
        if ident in ids or d<prev or d>g.distance_m: fail('invalid_schema','occurrence ordering/identity')
        ids.add(ident);prev=d
        if c['kind'] not in ('service','timing_only','finish'): fail('invalid_schema','occurrence kind')
        if (c['kind']=='finish') != (i==len(cps)-1): fail('invalid_schema','finish must be last')
        if c['kind']=='finish' and d!=g.distance_m: fail('invalid_schema','finish distance')
        if c['kind']=='service' and d==g.distance_m: fail('invalid_schema','finish cannot include recovery stop')
        rest=kernel.num(c['rest_s'],'rest_s')
        if c['kind']=='service':
            if c['service'] is None: fail('not_estimable','service duration missing')
            strict(c['service'],('duration_s','tasks'),'service')
            if (c['service']['duration_s'] is None)==(c['service']['tasks'] is None): fail('invalid_schema','choose service makespan or tasks')
            service=(schedule_checked(c['service']['tasks'],budget) if c['service']['tasks'] is not None
                     else kernel.num(c['service']['duration_s'],'service duration'))
            if c['composition'] not in ('sequential_service_then_rest','rest_contains_all_service'):
                fail('not_estimable','station overlap composition unknown')
            if c['composition']=='rest_contains_all_service' and rest<service:
                fail('invalid_schema','overlap contract requires rest cover entire service makespan')
            if c['bundle_id'] not in support['service_bundles']: fail('outside_declared_domain','service bundle')
            dwell=service+rest if c['composition']=='sequential_service_then_rest' else rest
            extra=rest if c['composition']=='sequential_service_then_rest' else rest-service
            for value,name in ((extra,'extra_rest_range_s'),(dwell,'total_dwell_range_s')):
                if not support[name][0]<=value<=support[name][1]: fail('outside_declared_domain',name)
        else:
            if c['service'] is not None or rest!=0 or c['composition']!='none' or c['bundle_id'] is not None:
                fail('invalid_schema','timing/finish has no dwell')
            service=dwell=extra=0.
        cutoff=c['cutoff']
        if cutoff is not None:
            strict(cutoff,('kind','elapsed_s'),'cutoff')
            if cutoff['kind'] not in ('arrival','departure'): fail('invalid_schema','cutoff kind')
            kernel.num(cutoff['elapsed_s'],'cutoff elapsed')
        out.append(dict(c,id=ident,service_makespan_s=service,total_dwell_s=dwell,extra_rest_s=extra))
    if not out: fail('invalid_schema','finish occurrence required')
    return out


def _time(profile,start,end,budget):
    vals=[]
    for lo,hi,logh,delta,_ in transition._pieces(profile,start,end):
        budget.take();vals.append(transition._integral(logh,delta,hi-lo))
    return kernel.add(*vals)



def effort_coordinate(cell,effort,position):
    # Exact endpoint identities avoid e*distance/distance rounding beyond the
    # supplied original domain. Interior conversions retain their allowance.
    if position==cell.start_m:return 0.
    if position==cell.end_m:return effort
    return effort*((position-cell.start_m)/cell.distance_m)

def build_locks(locks,sections,rows,Eroute,shape,budget):
    shape=kernel.num(shape,'control_shape_end_multiplier',positive=True)
    if shape<1: fail('outside_adapter_family','only nondecreasing prescribed shape supported')
    b=math.log(shape);rate=b/Eroute
    ends=[r[0].end_m for r in rows];prefix=[];acc=0.
    for _,e,*_ in rows: prefix.append(acc);acc=kernel.add(acc,e)
    byid={r['id']:i for i,r in enumerate(sections)};covered=set();seen=set();out=[]
    for lock in sequence(locks,MAX_LOCKS,'locks'):
        strict(lock,('id','child_ids','moving_pace_s_per_km','allocation'),'lock')
        ident=label(lock['id'],'lock id');children=sequence(lock['child_ids'],MAX_CELLS,'lock children')
        if ident in seen or lock['allocation']!='preserve_baseline_cost_shape' or not children: fail('invalid_schema','lock identity/family')
        if any(c not in byid for c in children): fail('stale_manual_section','unknown raw child')
        idx=[byid[c] for c in children]
        if idx!=list(range(idx[0],idx[0]+len(idx))) or any(i in covered for i in idx): fail('overlapping_manual_lock','locks must be contiguous and disjoint')
        start,end=sections[idx[0]]['start_m'],sections[idx[-1]]['end_m']
        pace=kernel.num(lock['moving_pace_s_per_km'],'pace',positive=True);target=pace*(end-start)/1000.
        kernel.num(target,'lock target',positive=True)
        pieces=[];i=bisect_right(ends,start)
        while i<len(rows) and rows[i][0].start_m<end:
            budget.take();c,e,floor,_=rows[i]
            lo=effort_coordinate(c,e,max(start,c.start_m))
            hi=effort_coordinate(c,e,min(end,c.end_m))
            lower=floor/e
            A=math.exp(b*prefix[i]/Eroute)/running_cost(0)
            pieces.append((i,e,A,lo,hi,lower));i+=1
        lower_total=kernel.add(*(v[5]*(v[4]-v[3]) for v in pieces))
        if target<lower_total: fail('locked_pace_violates_cap','manual moving pace violates pointwise speed caps')
        def profiles(lam): return {i:transition.Profile(e,lam*A,rate,low,None) for i,e,A,lo,hi,low in pieces}
        def value(lam):
            ps=profiles(lam)
            return kernel.add(*(_time(ps[i],lo,hi,budget) for i,_,_,lo,hi,_ in pieces))
        if target==lower_total:
            ps={i:transition.Profile(e,low,0.,low,None) for i,e,A,lo,hi,low in pieces}
            lam=None
        else:
            left,right=0.,max(1.,target/(end-start))
            for _ in range(128):
                if value(right)>=target: break
                right*=2;kernel.num(right,'lambda bracket',positive=True)
            else: fail('numeric_support','bounded lock lambda bracket not found')
            for _ in range(100):
                budget.take();mid=left+(right-left)/2
                if mid==left or mid==right: break
                if value(mid)<target: left=mid
                else: right=mid
            lam=left+(right-left)/2;ps=profiles(lam)
        obtained=kernel.add(*(_time(ps[i],lo,hi,budget) for i,_,_,lo,hi,_ in pieces))
        residual=obtained-target
        if abs(residual)>1e-9*max(1.,target): fail('numeric_support','locked target solver residual')
        # Explicit input-construction allowance. This is numerical uncertainty,
        # not a biological or measured-pace interval.
        allowance=kernel.ROUNDING_ALLOWANCE*((1+abs(b))*len(rows)+abs(math.log(target))+abs(math.log(Eroute))+len(pieces))
        out.append(dict(id=ident,child_ids=list(children),start_m=start,end_m=end,target_moving_s=target,
          profiles=ps,solver_residual_s=residual,construction_log_allowance=allowance,lambda_value=lam))
        covered.update(idx);seen.add(ident)
    return sorted(out,key=lambda x:x['start_m'])


def add_mapping_allowance(state,val,p,relative,effort_error):
    z=kernel.add(state.fast,state.persistent)
    # beta>=0 free scalar flow contracts; stop also contracts. Componentwise
    # deficit allowances can grow by at most two in a moving transition.
    dz=kernel.add(2*p.accrual_per_j_kg*effort_error*max(val['ratio_min'],val['ratio_max'])**p.elasticity,
                  abs(p.elasticity)*relative*val['deficit_added'])
    dt=kernel.add(relative*val['moving_s'],effort_error*p.scale_s_per_j_kg/val['ratio_min'])
    ze=kernel.add(state.deficit_roundoff_bound,dz)
    te=kernel.add(state.moving_roundoff_bound_s,dt)
    if ze>kernel._precision_limit(z) or te>kernel._precision_limit(state.moving_s):
        fail('numeric_support','geometry/profile construction conditioning')
    return replace(state,deficit_roundoff_bound=ze,moving_roundoff_bound_s=te),dict(
      construction_deficit_allowance=dz,construction_moving_allowance_s=dt)


def prepare_route(g,caps,raw_sections,locks,checkpoints,binding,context,artifact,budget,shape_end_multiplier):
    a=artifact
    caps=caps_validate(caps)
    rows,Eroute=route_validate(g,caps,a,binding,context,budget)
    sections=sections_validate(raw_sections,g);cps=cp_validate(checkpoints,g,a['support'],budget)
    section_ends={r['end_m'] for r in sections}
    if any(c['distance_m'] not in section_ends and c['distance_m']!=0 for c in cps):fail('invalid_schema','checkpoint must retain raw section endpoint')
    lock_rows=build_locks(locks,sections,rows,Eroute,shape_end_multiplier,budget)
    cp_distances=[cp['distance_m'] for cp in cps]
    for lock in lock_rows:
        budget.take();ci=bisect_right(cp_distances,lock['start_m'])
        if ci<len(cp_distances) and cp_distances[ci]<lock['end_m']:fail('manual_checkpoint_barrier','manual lock cannot cross any CP occurrence, including zero-stop timing points')
    boundaries=sorted({0.,g.distance_m,*[r[0].end_m for r in rows],*[r['end_m'] for r in sections],*[r['distance_m'] for r in cps]})
    control_hash=digest(dict(sections=sections,locks=locks,cps=checkpoints,shape=shape_end_multiplier,caps=caps))
    return dict(rows=tuple(rows),sections=sections,cps=cps,lock_rows=lock_rows,boundaries=boundaries,control_hash=control_hash)


def forward_geometry(g,caps,raw_sections,locks,checkpoints,binding,context,admitted,budget,*,shape_end_multiplier,start_at=None,prepared=None,details=True):
    a=admitted['artifact'];p=admitted['parameters'];s=admitted['initial']
    if p is None: fail('not_estimable','same-law scale missing')
    prepared=prepared or prepare_route(g,caps,raw_sections,locks,checkpoints,binding,context,a,budget,shape_end_multiplier)
    rows,sections,cps,lock_rows=(prepared[n] for n in ('rows','sections','cps','lock_rows'))
    kernel.support_state(s,p)
    start=None if start_at is None else stamp(start_at,'start_at')
    boundaries=prepared['boundaries']
    ends=[r[0].end_m for r in rows];cell_times=[[] for _ in rows];raw_times={r['id']:[] for r in sections}
    cp_at={}
    for c in cps: cp_at.setdefault(c['distance_m'],[]).append(c)
    events=[];cp_rows=[];lock_times={x['id']:[] for x in lock_rows};section_index=0;lock_index=0;leg_moving_start=s.moving_s;initial_elapsed=s.moving_s+s.stopped_s
    def do_cps(distance):
        nonlocal s,leg_moving_start
        for cp in cp_at.get(distance,[]):
            budget.take();arrival=s.moving_s+s.stopped_s;before=asdict(s)
            support=a['support']['pre_stop_state_support']
            if cp['total_dwell_s'] and (s.fast>support['max_fast'] or s.persistent>support['max_persistent'] or s.effort_j_kg>support['max_effort_j_kg']):
                fail('outside_declared_domain','pre-stop state')
            rho=admitted['values']['service_exposure_fraction']
            # A containing rest interval receives full rest exposure; service
            # is not counted again. Sequential composition uses rho*S+R.
            if cp['composition']=='rest_contains_all_service': service_for_kernel=0.;rest_for_kernel=cp['total_dwell_s']
            else: service_for_kernel=cp['service_makespan_s'];rest_for_kernel=cp['extra_rest_s']
            val=transition.stop(s,service_for_kernel,rest_for_kernel,rho,p,budget.primitives)
            s=val['state'];departure=s.moving_s+s.stopped_s;cutoff=cp['cutoff']
            passed=None if cutoff is None else (arrival if cutoff['kind']=='arrival' else departure)<=cutoff['elapsed_s']
            def clock(sec):
                if start is None:return None
                try:return (start+timedelta(seconds=sec)).isoformat()
                except (OverflowError,ValueError):fail('numeric_support','calendar clock range')
            row=dict(id=cp['id'],name=cp['name'],kind=cp['kind'],distance_m=distance,
              arrival_elapsed_s=arrival,departure_elapsed_s=None if cp['kind']=='finish' else departure,
              arrival_at=clock(arrival),departure_at=None if cp['kind']=='finish' else clock(departure),
              leg_moving_s=s.moving_s-leg_moving_start,cumulative_moving_s=s.moving_s,
              cumulative_stopped_s=s.stopped_s,service_makespan_s=cp['service_makespan_s'],
              extra_rest_s=cp['extra_rest_s'],total_dwell_s=cp['total_dwell_s'],composition=cp['composition'],
              recovery_exposure_s=val['exposure_s'],arrival_state=before,departure_state=asdict(s),cutoff_pass=passed)
            if details:cp_rows.append(row);events.append(dict(kind='stop',id=cp['id'],**{k:v for k,v in val.items() if k!='state'},state=asdict(s)))
            leg_moving_start=s.moving_s
    do_cps(0.)
    for left,right in zip(boundaries,boundaries[1:]):
        budget.take();i=bisect_right(ends,left);c,e,floor,cap=rows[i]
        while section_index<len(sections)-1 and sections[section_index]['end_m']<=left:section_index+=1
        while lock_index<len(lock_rows) and lock_rows[lock_index]['end_m']<=left:lock_index+=1
        lock=lock_rows[lock_index] if lock_index<len(lock_rows) and lock_rows[lock_index]['start_m']<=left<lock_rows[lock_index]['end_m'] else None
        e0=effort_coordinate(c,e,left);e1=effort_coordinate(c,e,right)
        if e1<=e0:fail('numeric_support','collapsed original effort coordinates')
        effort=e1-e0;relative=kernel.ROUNDING_ALLOWANCE*(1+abs(math.log(e))+abs(math.log(c.distance_m)))
        effort_error=relative*effort+4*max(math.ulp(e0),math.ulp(e1))
        if lock is not None:
            val=transition.move_profile(s,lock['profiles'][i],e0,e1,p,budget.primitives)
            relative+=lock['construction_log_allowance']
        else:
            val=transition.move_free(s,effort,floor*effort/e,p,budget.primitives)
        s,allowance=add_mapping_allowance(val['state'],val,p,relative,effort_error)
        elapsed=s.moving_s+s.stopped_s
        if not a['support']['cumulative_elapsed_range_s'][0]<=elapsed<=a['support']['cumulative_elapsed_range_s'][1]:fail('outside_declared_domain','elapsed support')
        if s.effort_j_kg<a['support']['cumulative_effort_range_j_kg'][0] or s.moving_s<a['support']['cumulative_moving_range_s'][0]:
            fail('outside_declared_domain','cumulative lower support')
        row=dict(kind='move',cell_index=i,raw_section_id=sections[section_index]['id'],start_m=left,end_m=right,
          original_effort_start=e0,original_effort_end=e1,lock_id=lock['id'] if lock else None,
          **{k:v for k,v in val.items() if k!='state'},**allowance,state=asdict(s))
        if details:events.append(row);cell_times[i].append(val['moving_s']);raw_times[sections[section_index]['id']].append(val['moving_s'])
        if lock:lock_times[lock['id']].append(val['moving_s'])
        do_cps(right)
        if s.moving_s+s.stopped_s>a['support']['cumulative_elapsed_range_s'][1]:fail('outside_declared_domain','elapsed after stop')
    budget.primitives.check()
    # This independently verifies the actual committed kernel curve total for
    # each original group, including all intervening CP slices.
    lock_receipts=[]
    for lock in lock_rows:
        actual=kernel.add(*lock_times[lock['id']])
        if abs(actual-lock['target_moving_s'])>1e-9*max(1.,actual):fail('numeric_support','locked chronological target residual')
        lock_receipts.append({k:v for k,v in lock.items() if k not in ('profiles','lambda_value')} | dict(actual_moving_s=actual))
    return dict(schema_version=VERSION,status='conditional_scenario',complete=True,final_state=asdict(s),
      finish_elapsed_s=s.moving_s+s.stopped_s,route_elapsed_s=s.moving_s+s.stopped_s-initial_elapsed,
      moving_s=s.moving_s-admitted['initial'].moving_s,stopped_s=s.stopped_s-admitted['initial'].stopped_s,
      events=events,checkpoints=cp_rows,canonical_cell_moving_s=[kernel.add(*v) for v in cell_times],
      raw_section_times=[dict(r,moving_s=kernel.add(*raw_times[r['id']])) for r in sections],lock_receipts=lock_receipts,
      binding=dict(binding),control_binding_sha256=prepared['control_hash'],
      capabilities=capabilities(support='within_explicit_scenario_box'),
      uncertainty=dict(kind='not_calibrated',interval=None,meaning='explicit conditional values; no probability or accuracy claim',
        numerical_error_kind='engineering_binary64_plus_mapping_allowance_not_formal_interval',
        numerical_moving_bound_s=s.moving_roundoff_bound_s,numerical_deficit_bound=s.deficit_roundoff_bound),
      all_provided_cutoffs_pass=(all(r['cutoff_pass'] is not False for r in cp_rows) if any(r['cutoff_pass'] is not None for r in cp_rows) else None),
      target_rebalanced=False,parameter_refit=False,recommended_rest_s=None,accuracy_claim=None,
      physiological_feasibility_identified=False,personal_causal_effect_identified=False,mutates_input=False,
      resources=budget.snapshot(),warnings=['Scenario coefficients and state are explicit assumptions, not measured physiology.',
        'No personal recovery optimum or predictive interval is admitted.',
        'Inventory, medical needs, intake/absorption, environment changes and unprovided constraints are not modeled.'])


def run(envelope,provenance,g,caps,sections,locks,cps,binding,context,*,shape_end_multiplier,max_work,
        max_events=100000,max_pieces=300000,cancelled=None,isolated_test=False,start_at=None,max_wall_s=300.):
    budget=None
    try:
        budget=WorkBudget(max_work,cancelled,max_wall_s)
        budget.primitives=transition.Budget(max_events,max_pieces,budget.cancellation_check)
        bounded_input([envelope,provenance,caps,sections,locks,cps,binding,context],budget)
        status,admitted=admit(envelope,provenance,isolated_test=isolated_test)
        if admitted is None:return status
        result=forward_geometry(g,caps,sections,locks,cps,binding,context,admitted,budget,
                  shape_end_multiplier=shape_end_multiplier,start_at=start_at)
        result['artifact_sha256']=envelope['sha256']
        result['provenance_authenticity']=status['provenance_authenticity']
        return result
    except (kernel.ModelError,InputError) as ex:
        return dict(unavailable('time_limit' if budget and budget.timed_out else ex.code,'wall-time budget exhausted' if budget and budget.timed_out else str(ex)),resources=budget.snapshot() if budget else None)
    except (ValueError,TypeError,KeyError,IndexError,AttributeError,OverflowError,RecursionError) as ex:
        return dict(unavailable('invalid_schema','malformed or unsupported derived input'),resources=budget.snapshot() if budget else None)


def calibrate_scale(envelope,provenance,g,caps,sections,locks,cps,binding,context,history,config,*,
                    shape_end_multiplier,max_work,cancelled=None,isolated_test=False,max_wall_s=300.):
    """Same-law one-scale anchor only; never fit theta or target time.

    Only the beta>=0 family is admitted. A monotonicity proof is documented;
    strict bracketing plus a narrow numerical/observation support interval is
    required. Fully locked and fully capped anchors are explicitly refused.
    """
    budget=None
    try:
        budget=WorkBudget(max_work,cancelled,max_wall_s)
        bounded_input([envelope,provenance,caps,sections,locks,cps,binding,context,history,config],budget)
        status,admitted=admit(envelope,provenance,isolated_test=isolated_test,allow_missing_scale=True)
        if admitted is None:return status
        if admitted['values']['scale_s_per_j_kg'] is not None:
            fail('invalid_schema','calibration accepts missing scale only; never silently refits explicit scale')
        strict(history,('source_id','observed_moving_s','observation_error_s','moving_time_semantics','controls_complete',
                       'stops_complete','independent_of_target','completed_at','route_instance_id','initial_state_protocol_id'),'history')
        record=admitted['catalog'].get(history['source_id'])
        if record is None: fail('provenance_missing','history source')
        if record['kind']=='synthetic_fixture':
            if not isolated_test or record['rights_basis']!='isolated_synthetic_test':fail('rights_not_admitted','synthetic anchor')
        elif record['kind']=='owned_activity':
            if record['rights_basis']!='user_owned_declared':fail('rights_not_admitted','history rights')
        elif record['kind']=='licensed_activity':
            if record['rights_basis']!='explicit_license_declared':fail('rights_not_admitted','history rights')
        else:fail('not_estimable','history is an assumption/target rather than independent observed activity')
        # Observations and control metadata must live inside the hash-checked
        # evidence document, rather than an unrelated caller status flag.
        strict(record['content'],('purpose','history','route_binding','control_binding_sha256'),'history source content')
        if record['content']['purpose']!='independent_observed_history' or record['content']['history']!=history or record['content']['route_binding']!=binding:
            fail('provenance_hash_mismatch','history source/binding mismatch')
        if history['moving_time_semantics']!='confirmed_moving_only' or history['controls_complete'] is not True or history['stops_complete'] is not True:
            return unavailable('not_identified','moving_semantics_or_historical_controls_stops_incomplete')
        if history['independent_of_target'] is not True:return unavailable('not_identified','target_is_not_observed_ability')
        if stamp(history['completed_at'],'history completed')>stamp(admitted['artifact']['data_cutoff_at'],'cutoff'):
            fail('future_evidence','history after artifact data cutoff')
        if history['initial_state_protocol_id']!=admitted['artifact']['state_reference']['protocol_id']:
            fail('not_identified','reference state protocol differs')
        label(history['route_instance_id'],'history route instance')
        observed=kernel.num(history['observed_moving_s'],'observed moving',positive=True)
        observation_error=kernel.num(history['observation_error_s'],'observation_error_s')
        required_config={'scale_bounds_s_per_j_kg','max_evaluations','residual_tolerance_s','max_relative_scale_span'}
        optional_config={'max_primitive_events','max_primitive_pieces'}
        if not isinstance(config,dict) or not required_config<=set(config) or set(config)-required_config-optional_config:
            fail('invalid_schema','scale fit configuration')
        if bool(optional_config&set(config)) and not optional_config<=set(config):fail('invalid_schema','aggregate primitive budget fields must be paired')
        if optional_config<=set(config):budget.primitives=AggregatePrimitiveBudget(config['max_primitive_events'],config['max_primitive_pieces'],budget.cancellation_check)
        bounds=config['scale_bounds_s_per_j_kg']
        if not isinstance(bounds,list) or len(bounds)!=2:fail('invalid_schema','scale bounds')
        lo,hi=(kernel.num(v,'scale bounds',positive=True) for v in bounds)
        if lo>=hi:fail('invalid_schema','scale bounds ordering')
        max_evaluations=config['max_evaluations']
        if isinstance(max_evaluations,bool) or not isinstance(max_evaluations,int) or not 8<=max_evaluations<=256:fail('resource_limit','calibration evaluations')
        tolerance=kernel.num(config['residual_tolerance_s'],'residual tolerance',positive=True)
        maxspan=kernel.num(config['max_relative_scale_span'],'max relative scale span',positive=True)
        if maxspan>1:fail('invalid_number','scale-span criterion must be <=1')
        prepared=prepare_route(g,caps,sections,locks,cps,binding,context,admitted['artifact'],budget,shape_end_multiplier)
        events_per_trial=len(prepared['boundaries'])-1+len(prepared['cps'])
        event_upper=max_evaluations*events_per_trial
        work_upper=event_upper+max_evaluations+300
        prescribed_fragments=0;li=0
        for left in prepared['boundaries'][:-1]:
            budget.take()
            while li<len(prepared['lock_rows']) and prepared['lock_rows'][li]['end_m']<=left:li+=1
            if li<len(prepared['lock_rows']) and prepared['lock_rows'][li]['start_m']<=left:prescribed_fragments+=1
        pieces_upper=max_evaluations*((events_per_trial-len(prepared['cps'])-prescribed_fragments)+3*prescribed_fragments)
        if work_upper+budget.work>budget.max_work or event_upper>budget.primitives.max_events or pieces_upper>budget.primitives.max_pieces:
            return dict(unavailable('resource_limit','declared worst-case anchor trial cost exceeds requested aggregate budget'),
                        required_event_upper_bound=event_upper,required_piece_upper_bound=pieces_upper,
                        adapter_work_upper_bound=work_upper+budget.work,resources=budget.snapshot())
        logs=math.log(lo),math.log(hi);cache={};trials=[]
        def predict(logscale):
            if logscale in cache:return cache[logscale]
            if len(cache)>=max_evaluations:fail('resource_limit','calibration evaluation budget exhausted')
            budget.take();scale=math.exp(logscale)
            candidate=dict(admitted,values=dict(admitted['values'],scale_s_per_j_kg=scale))
            candidate['parameters']=parameters(candidate['values'],admitted['artifact']['support'],admitted['artifact']['artifact_id'])
            result=forward_geometry(g,caps,sections,locks,cps,binding,context,candidate,budget,
                           shape_end_multiplier=shape_end_multiplier,prepared=prepared,details=False)
            if result['control_binding_sha256']!=record['content']['control_binding_sha256']:
                fail('provenance_hash_mismatch','historical controls binding')
            val=result['moving_s'];err=result['final_state']['moving_roundoff_bound_s']
            cache[logscale]=(val,err,None)  # scalar-only trial cache; do not retain N full route ledgers
            trials.append(dict(scale_s_per_j_kg=scale,moving_s=val,numerical_bound_s=err))
            return cache[logscale]
        tl,el,_=predict(logs[0]);th,eh,_=predict(logs[1])
        if th+eh<tl-el:fail('numeric_support','monotone-family numerical ordering failure')
        if abs(th-tl)<=el+eh+tolerance:
            return dict(unavailable('not_identified','flat_scale_response_all_locked_or_cap_dominated'),trials=trials)
        error=observation_error+tolerance
        if not tl+el < observed-error or not th-eh > observed+error:
            return dict(unavailable('not_identified','no_strict_interior_anchor_bracket_or_boundary_plateau'),trials=trials)
        def root(target):
            left,right=logs
            for _ in range(100):
                budget.take();mid=left+(right-left)/2
                if mid==left or mid==right:break
                tm,em,_=predict(mid)
                if abs(tm-target)<=tolerance and right-left<=min(maxspan*.1,1e-8):return mid,(left,right)
                if tm<target:left=mid
                else:right=mid
                if right-left<=4*sys.float_info.epsilon*max(1.,abs(mid)):break
            mid=left+(right-left)/2;tm,em,_=predict(mid)
            if abs(tm-target)>tolerance+em:fail('numeric_support','same-law anchor residual unsupported')
            return mid,(left,right)
        mid,root_bracket=root(observed)
        tm,em,result=predict(mid)
        # Invert observed duration support, widened by numeric/tolerance error.
        # This is an observation-conditioned support range, not a confidence interval.
        def support_root(target,which):
            left,right=logs
            for _ in range(100):
                budget.take();point=left+(right-left)/2
                if point==left or point==right:break
                tp,ep,_=predict(point)
                if which=='lower':
                    if tp+ep<target:left=point
                    else:right=point
                else:
                    if tp-ep>target:right=point
                    else:left=point
                if right-left<=1e-12:break
            return left,right
        lower_bracket=support_root(observed-error,'lower')
        upper_bracket=support_root(observed+error,'upper')
        lowroot,highroot=lower_bracket[0],upper_bracket[1]
        slo=math.nextafter(math.exp(lowroot),-math.inf)
        shi=math.nextafter(math.exp(highroot),math.inf)
        relative_span=(shi-slo)/math.exp(mid)
        if relative_span>maxspan:
            return dict(unavailable('not_identified','anchor_scale_support_too_wide_or_weak_sensitivity'),
              scale_support_s_per_j_kg=[slo,shi],relative_scale_span=relative_span,trials=trials)
        slope=(predict(highroot)[0]-predict(lowroot)[0])/(highroot-lowroot) if highroot>lowroot else None
        if slope is None or slope<=0:
            return dict(unavailable('not_identified','flat_local_scale_sensitivity'),trials=trials)
        budget.primitives.check()
        return dict(schema_version=VERSION,status='conditional_scale_identified',complete=True,
          scale_s_per_j_kg=math.exp(mid),scale_source='same_law_independent_history_fixed_theta_and_reference_state',
          fitted_parameters=['scale_s_per_j_kg'],fixed_parameters=[n for n in PARAM_UNITS if n!='scale_s_per_j_kg'],
          anchor_residual_s=tm-observed,numerical_bound_s=em,observation_error_s=observation_error,
          scale_support_s_per_j_kg=[slo,shi],scale_support_meaning='duration-observation-support-plus-numerical-tolerance_not_confidence_interval',
          relative_scale_span=relative_span,local_moving_sensitivity_per_log_scale=slope,
          log_root_bracket=list(root_bracket),log_scale_support_outer_brackets=[list(lower_bracket),list(upper_bracket)],evaluations=len(cache),trials=trials,history_source_sha256=record['content_sha256'],
          artifact_sha256=envelope['sha256'],required_event_upper_bound=event_upper,required_piece_upper_bound=pieces_upper,resources=budget.snapshot(),capabilities=capabilities(anchor='conditional_same_law_identified'),
          personal_predictive_accuracy_validated=False,personal_causal_effect_identified=False,recommended_rest_s=None,accuracy_claim=None,
          provenance_authenticity='caller_supplied_declarations_hash_checked_not_independently_authenticated',mutates_input=False)
    except (kernel.ModelError,InputError) as ex:
        return dict(unavailable('time_limit' if budget and budget.timed_out else ex.code,'wall-time budget exhausted' if budget and budget.timed_out else str(ex)),resources=budget.snapshot() if budget else None)
    except (ValueError,TypeError,KeyError,IndexError,AttributeError,OverflowError,RecursionError):
        return dict(unavailable('invalid_schema','malformed or unsupported calibration input'),resources=budget.snapshot() if budget else None)


def run_anchored(envelope,provenance,history_plan,target_plan,history,config,*,max_work,
                 cancelled=None,isolated_test=False,max_wall_s=300.):
    """Calibrate and forecast atomically without relabeling fit as an assumption.

    Scalar receipts are never accepted from the caller. The same-law anchor is
    recomputed from hash-bound independent evidence each call. Fixed theta and
    reference conventions remain assumptions; this grants no predictive claim.
    """
    budget=None
    try:
        names=('g','caps','sections','locks','cps','binding','context','shape_end_multiplier','start_at')
        strict(history_plan,names,'historical plan');strict(target_plan,names,'target plan')
        operation_started=time.perf_counter()
        hist_args={k:v for k,v in history_plan.items() if k!='start_at'}
        fit=calibrate_scale(envelope,provenance,**hist_args,history=history,config=config,
                           max_work=max_work,cancelled=cancelled,isolated_test=isolated_test,max_wall_s=max_wall_s)
        if fit['status']!='conditional_scale_identified':return fit
        used=fit['resources'];remaining=max_work-used['adapter_work']
        remaining_wall=max_wall_s-(time.perf_counter()-operation_started)
        if remaining_wall<=0:return unavailable('time_limit','anchor/target wall-time budget exhausted')
        budget=WorkBudget(remaining,cancelled,remaining_wall)
        budget.primitives=AggregatePrimitiveBudget(used['max_events']-used['events'],used['max_pieces']-used['pieces'],budget.cancellation_check)
        bounded_input([envelope,provenance,*[v for k,v in target_plan.items() if k!='g']],budget)
        _,admitted=admit(envelope,provenance,isolated_test=isolated_test,allow_missing_scale=True)
        admitted['values']=dict(admitted['values'],scale_s_per_j_kg=fit['scale_s_per_j_kg'])
        admitted['parameters']=parameters(admitted['values'],admitted['artifact']['support'],admitted['artifact']['artifact_id'])
        result=forward_geometry(target_plan['g'],target_plan['caps'],target_plan['sections'],target_plan['locks'],
          target_plan['cps'],target_plan['binding'],target_plan['context'],admitted,budget,
          shape_end_multiplier=target_plan['shape_end_multiplier'],start_at=target_plan['start_at'])
        result['artifact_sha256']=envelope['sha256'];result['capabilities']['anchor_status']='conditional_same_law_identified'
        result['anchor']=fit;result['parameter_refit']=False
        result['uncertainty'].update(numerical_bound_scope='conditional_on_returned_point_scale_fixed_theta_state_and_controls_only',
          anchor_scale_support_s_per_j_kg=fit['scale_support_s_per_j_kg'],
          anchor_support_meaning=fit['scale_support_meaning'],
          anchor_scale_support_propagated_to_target_clock=False,
          measurement_and_model_uncertainty_in_numerical_bound=False)
        result['scale_source']='same_law_independent_history_fixed_theta_and_reference_state'
        result['provenance_authenticity']=fit['provenance_authenticity']
        result['resources']=dict(result['resources'],adapter_work=result['resources']['adapter_work']+used['adapter_work'],
          events=result['resources']['events']+used['events'],pieces=result['resources']['pieces']+used['pieces'],
          max_adapter_work=max_work,max_events=used['max_events'],max_pieces=used['max_pieces'],max_wall_s=max_wall_s)
        budget.primitives.check()
        return result
    except (kernel.ModelError,InputError) as ex:
        return dict(unavailable('time_limit' if budget and budget.timed_out else ex.code,'wall-time budget exhausted' if budget and budget.timed_out else str(ex)),resources=budget.snapshot() if budget else None)
    except (ValueError,TypeError,KeyError,IndexError,AttributeError,OverflowError,RecursionError):
        return dict(unavailable('invalid_schema','malformed or unsupported anchored request'),resources=budget.snapshot() if budget else None)
