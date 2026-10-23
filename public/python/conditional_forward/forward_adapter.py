"""Detached mechanical replay over the unchanged, byte-verified frozen law.

No production pack is admitted. The private replay seam is for a trusted,
explicitly isolated synthetic harness, not a Worker operation or request flag.
"""
from __future__ import annotations
import base64
import copy
from dataclasses import asdict
import hashlib
import importlib.util
import json
import math
import re
from pathlib import Path
import sys
import time

VERSION = 'conditional-forward-receipt/1'
INPUT_VERSION = 'conditional-forward-input/1'
RESULT_FAMILY = 'conditional-user-plan/1'
GUARD_SHA = '872c67f918758176e7f45b1705a3e667126a37e7d121dd5a2f04039435919788'
ROOT = Path(__file__).resolve().parent.parent / 'conditional_preview'
TEST_SCOPE = 'isolated_synthetic_mechanical_test'
INPUT_FIELDS = ('schema_version','fixed_source','current_A_clock','baseline','proposed',
                'geometry_snapshot','route','context','qualification','lifetime','limits',
                'production_admission','ui_apply_admitted','user_export_admitted')
STATE_FIELDS = ('fast','persistent','effort_j_kg','moving_s','stopped_s',
                'deficit_roundoff_bound','moving_roundoff_bound_s')


def resolve_qualified_pack():
    """Exact empty production allowlist; caller data cannot register a pack."""
    return None


def execute(request, *, cancelled=None):
    # No isolated_test/admitted/scenario argument or positive Worker operation.
    return dict(schema_version=VERSION,status='not_estimable',complete=False,
                reason='qualified_pack_resolver_empty',production_admission=False,
                ui_apply_admitted=False,user_export_admitted=False,recommended_rest_s=None)


def _runtime():
    guard = ROOT / 'runtime_integrity.py'
    if hashlib.sha256(guard.read_bytes()).hexdigest() != GUARD_SHA:
        raise RuntimeError('Conditional runtime capsule integrity/import mismatch.')
    integrity = sys.modules.get('runtime_integrity')
    if integrity is None:
        name = '_conditional_forward_verified_guard'
        spec = importlib.util.spec_from_file_location(name, guard)
        integrity = importlib.util.module_from_spec(spec)
        sys.modules[name] = integrity
        spec.loader.exec_module(integrity)
        integrity.bootstrap({})
    integrity.ensure_installed()
    return (integrity, sys.modules['conditional_adapter'],
            sys.modules['conditional_stop_search'], sys.modules['manual_pace_adapter'],
            sys.modules['production_recovery_bridge'])


def _state_checked(value, ca):
    ca.strict(value, STATE_FIELDS, 'complete state')
    ca.kernel.State(**value)
    z = ca.kernel.add(value['fast'],value['persistent'])
    if (value['deficit_roundoff_bound'] > ca.kernel._precision_limit(z)
            or value['moving_roundoff_bound_s'] > ca.kernel._precision_limit(value['moving_s'])):
        ca.fail('numeric_support','carried precision allowance exceeds frozen ceiling')


def _near(a,b):
    return abs(a-b) <= max(1e-7,1e-9*max(abs(a),abs(b)))


def _raw_seconds(raw,ca):
    # Lossless minute coefficient -> seconds, matching cp-stop-seconds.mjs.
    # Clock input arithmetic only; this is not a recovery law.
    if type(raw) is not str or len(raw)>64:ca.fail('invalid_schema','bounded raw minutes required')
    m=re.fullmatch(r'([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?',raw.strip())
    if m is None:ca.fail('not_estimable','complete raw minutes required')
    fraction=m[3] if m[3] is not None else m[4] or ''
    digits=((m[2] or '')+fraction).lstrip('0')
    if not digits:return 0.
    exponent=m[5] or '0'
    if m[1]=='-' or len(exponent.lstrip('+-').lstrip('0') or '0')>4:ca.fail('invalid_number','raw minute range')
    trailing=len(digits)-len(digits.rstrip('0'));digits=digits.rstrip('0')
    scale=int(exponent)-len(fraction)+trailing;order=len(digits)+scale
    whole=digits[:4].ljust(4,'0')
    if order>4 or order==4 and (whole>'1440' or whole=='1440' and len(digits)>4):ca.fail('invalid_number','raw minute range')
    value=float(str(int(digits)*60)+'e'+str(scale))
    if not math.isfinite(value) or value<=0:ca.fail('numeric_support','unrepresentable raw minute value')
    return value


def _declarations(data,ca):
    if len(data['declarations'])!=len(data['stations']):ca.fail('stale_station_binding','declaration occurrence count')
    result=[]
    for station,row in zip(data['stations'],data['declarations']):
        ca.strict(row,('id','composition'),'raw station declaration')
        if row['id']!=station['id']:ca.fail('stale_station_binding','raw station occurrence')
        d=row['composition'];mode=d.get('mode') if type(d) is dict else None
        if station['kind']=='service':
            keys=('mode','serviceRaw','restRaw') if mode=='sequential' else ('mode','serviceRaw','totalRaw') if mode=='contains' else ()
            ca.strict(d,keys,'supported service declaration')
            service=_raw_seconds(d['serviceRaw'],ca);rest=_raw_seconds(d['restRaw'] if mode=='sequential' else d['totalRaw'],ca)
            composition='sequential_service_then_rest' if mode=='sequential' else 'rest_contains_all_service'
            if station['service']!={'duration_s':service,'tasks':None} or station['rest_s']!=rest or station['composition']!=composition:
                ca.fail('stale_station_binding','numeric service/rest differs from exact raw declaration')
            if mode=='contains' and rest<service:ca.fail('invalid_schema','containing interval shorter than service')
            total=ca.kernel.add(service,rest) if mode=='sequential' else rest
        else:
            ca.strict(d,('mode','totalRaw'),'zero nonservice declaration')
            if mode!='total' or _raw_seconds(d['totalRaw'],ca)!=0 or station['service'] is not None or station['rest_s']!=0 or station['composition']!='none' or station['bundle_id'] is not None:
                ca.fail('stale_station_binding','timing/finish zero declaration differs')
            service=total=0.
        result.append((service,total))
    return result


def _requirements(current,data,values,ca):
    q=current['requirements'];ca.strict(q,('version','status','records','rows','canApply','physiologicalFeasibilityIdentified'),'service qualification')
    if q['version']!='station-service-minimum/1' or q['canApply'] is not True or q['physiologicalFeasibilityIdentified'] is not False or len(q['records'])!=len(q['rows']):ca.fail('not_estimable','service minimum qualification')
    seen=set()
    for record,row in zip(q['records'],q['rows']):
        ca.strict(record,('id','minimumRaw','origin','provenance'),'user minimum')
        if record['origin']!='user_declared' or record['provenance'] is not None or record['id'] in seen:ca.fail('not_estimable','only explicit user minima admitted')
        seen.add(record['id']);idx=next((i for i,s in enumerate(data['stations']) if s['id']==record['id'] and s['kind']=='service'),None)
        if idx is None:ca.fail('stale_station_binding','minimum occurrence')
        minimum=_raw_seconds(record['minimumRaw'],ca);service,total=values[idx]
        if service<minimum or row!={'id':record['id'],'minimumRaw':record['minimumRaw'],'minimumS':minimum,'serviceS':service,'totalDwellS':total,'status':'satisfied'}:
            ca.fail('not_estimable','service minimum unknown/violated or forged qualification')
    expected='satisfied_for_declared_service_times' if seen else 'not_declared'
    if q['status']!=expected:ca.fail('stale_station_binding','service qualification status')

def _source(request, budget, ca, manual, bridge):
    source = request['fixed_source']
    ca.strict(source,('gpx_b64','settings','raw_sections','checkpoint_ids','owner_revision','expected_manual_binding'),'fixed original source')
    encoded = source['gpx_b64']
    if type(encoded) is not str or len(encoded)>6990508:
        ca.fail('source_resource_limit','bounded original GPX required')
    try:
        data=base64.b64decode(encoded,validate=True)
    except (ValueError,TypeError):
        ca.fail('invalid_file','invalid GPX base64')
    if not data or len(data)>bridge.MAX_GPX_BYTES:
        ca.fail('source_resource_limit','individual GPX byte bound')
    bridge.validate_gpx_admission(data)
    g=bridge.build_geometry(bridge.parse_gpx(data))
    budget.take(g.source_points+len(g.cells))
    if len(g.cells)*2>15000 or not 0<len(source['raw_sections'])<=1500:
        ca.fail('resource_limit','both replay full-output allocation bound')
    prepared=manual.prepare_geometry(g,source['settings'],source['raw_sections'],source['checkpoint_ids'],source['owner_revision'])
    if prepared['binding']!=source['expected_manual_binding']:
        ca.fail('stale_manual_session','fixed original preparation binding mismatch')
    base=prepared['baseline_plan'];settings=base['input']
    if request['geometry_snapshot']!=base['geometry_snapshot'] or request['route']!=base['route']:
        ca.fail('stale_source_binding','original geometry or route snapshot differs')
    if (settings['min_speed_m_s']!=0 or not g.elevation_complete
            or any(c.grade is None or abs(c.grade)>.45 for c in g.cells)):
        ca.fail('outside_bridge_family','complete ordinary-running geometry and zero minimum speed required')
    for family in ('baseline','proposed'):
        val=request[family];ca.strict(val,('locks','stations','declarations'),family)
        if len(val['locks'])>256 or len(val['stations'])!=len(base['checkpoints']):
            ca.fail('stale_station_binding','complete bounded occurrence sequence required')
        for ident,cp,station in zip(prepared['checkpoint_ids'],base['checkpoints'],val['stations']):
            ca.strict(station,('id','name','distance_m','kind','service','rest_s','composition','bundle_id','cutoff'),'station')
            cutoff=None if cp['cutoff_elapsed_s'] is None else dict(kind=cp['cutoff_kind'],elapsed_s=cp['cutoff_elapsed_s'])
            if (station['id']!=ident or station['name']!=cp['name'] or station['distance_m']!=cp['distance_m']
                    or station['cutoff']!=cutoff or (station['kind']=='finish')!=(cp['distance_m']==g.distance_m)):
                ca.fail('stale_station_binding','original CP occurrence/cutoff differs')
    current=request['current_A_clock']
    ca.strict(current,('moving_s','dwell_s','finish_s','locks','declarations','requirements','canonical_cell_moving_s','raw_section_times','checkpoints'),'current A clock')
    baseline_values=_declarations(request['baseline'],ca)
    proposed_values=_declarations(request['proposed'],ca)
    _requirements(current,request['baseline'],baseline_values,ca)
    # Proposed minima use the same applied records but new declared service totals.
    for record in current['requirements']['records']:
        idx=next(i for i,s in enumerate(request['proposed']['stations']) if s['id']==record['id'])
        if proposed_values[idx][0]<_raw_seconds(record['minimumRaw'],ca):ca.fail('not_estimable','proposal violates applied service minimum')
    native=manual.recalculate_geometry(g,source['settings'],source['raw_sections'],source['checkpoint_ids'],source['owner_revision'],prepared['binding'],request['baseline']['locks'])
    if current['locks']!=request['baseline']['locks'] or current['declarations']!=request['baseline']['declarations']:
        ca.fail('stale_current_binding','current controls/declarations differ')
    if (len(current['canonical_cell_moving_s'])!=len(g.cells) or not _near(current['moving_s'],native['moving_s'])
            or not _near(current['moving_s']+current['dwell_s'],current['finish_s'])
            or any(not _near(a,b['moving_s']) for a,b in zip(current['canonical_cell_moving_s'],native['canonical_timeline']))):
        ca.fail('stale_current_binding','current moving cells are not original-reference manual replay')
    if current['raw_section_times']:
        for a,b in zip(current['raw_section_times'],native['raw_section_times']):
            if {k:a[k] for k in ('id','start_m','end_m')}!={k:b[k] for k in ('id','start_m','end_m')} or not _near(a['moving_s'],b['moving_s']):
                ca.fail('stale_current_binding','current raw-section moving times differ')
        if len(current['raw_section_times'])!=len(native['raw_section_times']):ca.fail('stale_current_binding','raw-section count')
    stopped=native_stopped=0.
    if len(current['checkpoints'])!=len(native['checkpoints']):ca.fail('stale_current_binding','current checkpoint count')
    for i,(row,cp) in enumerate(zip(current['checkpoints'],native['checkpoints'])):
        ca.strict(row,('id','distance_m','arrival_elapsed_s','departure_elapsed_s','stop_s'),'current checkpoint')
        if not _near(row['stop_s'],baseline_values[i][1]):ca.fail('stale_station_binding','unchanged baseline occurrence dwell differs')
        if (row['id']!=cp['id'] or row['distance_m']!=cp['distance_m'] or not _near(row['arrival_elapsed_s']-stopped,cp['arrival_elapsed_s']-native_stopped)
                or not _near(row['departure_elapsed_s'],row['arrival_elapsed_s']+row['stop_s'])):
            ca.fail('stale_current_binding','current exact CP moving prefix differs')
        stopped=ca.kernel.add(stopped,row['stop_s']);native_stopped=ca.kernel.add(native_stopped,cp['stop_s'])
    if not _near(stopped,current['dwell_s']):ca.fail('stale_current_binding','current dwell sum differs')
    caps=dict(max_speed_m_s=settings['max_speed_m_s'],uphill_cap_grade=settings['walk_uphill_grade'],uphill_cap_m_s=settings['walk_max_speed_m_s'],downhill_cap_grade=None,downhill_cap_m_s=None)
    binding=dict(route_sha256=g.route_sha256,geometry_sha256=g.geometry_sha256,geometry_config_sha256=ca.digest(asdict(g.config)),owner_revision=source['owner_revision'])
    return g,prepared,caps,binding,len(data)


def _profiles(prepared):
    return [dict(id=r['id'],child_ids=r['child_ids'],start_m=r['start_m'],end_m=r['end_m'],target_moving_s=r['target_moving_s'],
                 solver_residual_s=r['solver_residual_s'],construction_log_allowance=r['construction_log_allowance'],
                 profiles=[dict(cell_index=i,**asdict(p)) for i,p in sorted(r['profiles'].items())]) for r in prepared['lock_rows']]


def _complete(result, initial, prepared, ca):
    result=copy.deepcopy(result);before=copy.deepcopy(initial)
    _state_checked(before,ca)
    for event in result['events']:
        event['before_state']=before
        if event['kind']=='move':event['effort_increment_j_kg']=event['original_effort_end']-event['original_effort_start']
        _state_checked(event['state'],ca)
        before=copy.deepcopy(event['state'])
    _state_checked(result['final_state'],ca)
    result['initial_state']=copy.deepcopy(initial)
    result['prescribed_profiles']=_profiles(prepared)
    result['race_clock']=dict(moving_s=result['final_state']['moving_s']-initial['moving_s'],
                              dwell_s=result['final_state']['stopped_s']-initial['stopped_s'],
                              finish_s=result['final_state']['moving_s']-initial['moving_s']+result['final_state']['stopped_s']-initial['stopped_s'])
    return result


def _bounded_output(value,budget,ca):
    stack=[(value,0)];nodes=0
    while stack:
        v,depth=stack.pop();nodes+=1;budget.take()
        if nodes>500000 or depth>32:ca.fail('resource_limit','complete JSON node/depth bound')
        if type(v) is dict:
            if nodes+len(stack)+len(v)>500000 or any(type(k) is not str for k in v):ca.fail('resource_limit','complete JSON keys/nodes')
            stack.extend((x,depth+1) for x in v.values())
        elif type(v) is list:
            if nodes+len(stack)+len(v)>500000:ca.fail('resource_limit','complete JSON array nodes')
            stack.extend((x,depth+1) for x in v)
        elif v is None or type(v) in (str,bool):pass
        elif type(v) in (int,float):ca.kernel.num(v,'complete JSON number',signed=True)
        else:ca.fail('invalid_schema','complete JSON scalar')

def _forward_for_admitted(request, admitted, *, anchor=None, cancelled=None):
    """Private trusted synthetic harness seam. Never reachable via execute().

    admitted is the frozen ca.admit result, not an input request field. Future
    reviewed production activation needs a separate resolver/runtime acceptance.
    """
    started=time.perf_counter();budget=None
    try:
        integrity,ca,search,manual,bridge=_runtime()
        if type(request) is not dict:raise ValueError('plain detached input required')
        ca.strict(request,INPUT_FIELDS,'detached forward input')
        lim=request['limits'];ca.strict(lim,('max_work','max_primitive_events','max_primitive_pieces','max_wall_s','max_response_bytes'),'limits')
        for k,cap in (('max_work',10000000),('max_primitive_events',100000),('max_primitive_pieces',300000),('max_response_bytes',8*1024*1024)):
            if type(lim[k]) is not int or not 0<lim[k]<=cap:ca.fail('resource_limit','frozen '+k+' ceiling')
        if request['schema_version']!=INPUT_VERSION or any(request[k] is not False for k in ('production_admission','ui_apply_admitted','user_export_admitted')):
            ca.fail('invalid_schema','mechanical input version/capabilities')
        wall=ca.kernel.num(lim['max_wall_s'],'max_wall_s',positive=True)
        if wall>120:ca.fail('resource_limit','initialization-inclusive deadline')
        remaining=wall-(time.perf_counter()-started)
        if remaining<=0:ca.fail('time_limit','initialization-inclusive deadline')
        budget=search.SharedWorkBudget(lim['max_work'],lim['max_primitive_events'],lim['max_primitive_pieces'],cancelled,remaining)
        integrity.verify_runtime(budget)
        ca.strict(request['fixed_source'],('gpx_b64','settings','raw_sections','checkpoint_ids','owner_revision','expected_manual_binding'),'fixed source')
        bounded={k:v for k,v in request.items() if k!='fixed_source'}
        bounded['fixed_source']={k:v for k,v in request['fixed_source'].items() if k!='gpx_b64'}
        ca.bounded_input(bounded,budget)
        clean=copy.deepcopy(bounded)
        g,prepared,caps,binding,source_bytes=_source(request,budget,ca,manual,bridge)
        q=request['qualification'];ca.strict(q,('packId','reviewGeneration','artifactSha256','scaleStrategy','anchorId','anchorRevision'),'qualified identity')
        if q['packId']!=admitted['artifact']['artifact_id'] or q['artifactSha256']!=ca.digest(admitted['artifact']) or not q['reviewGeneration']:
            ca.fail('artifact_hash_mismatch','separate admitted pack identity')
        # Re-admit the bounded immutable law document, never trust a hand-edited
        # Parameters/State object or a copied public hash as qualification.
        ca.bounded_input(dict(artifact=admitted['artifact'],catalog=admitted['catalog']),budget)
        status,fresh=ca.admit(dict(payload=admitted['artifact'],sha256=q['artifactSha256']),
                             dict(records=list(admitted['catalog'].values())),isolated_test=True,
                             allow_missing_scale=q['scaleStrategy']=='independent_anchor')
        if fresh is None:ca.fail(status['status'],'fixed-law artifact admission refused')
        if (asdict(admitted['initial'])!=asdict(fresh['initial']) or admitted['values']!=fresh['values']
                or (asdict(admitted['parameters']) if admitted['parameters'] is not None else None)
                   !=(asdict(fresh['parameters']) if fresh['parameters'] is not None else None)):
            ca.fail('stale_parameter_binding','admitted state/parameters differ from fixed document')
        admitted=fresh
        initial=asdict(admitted['initial']);_state_checked(initial,ca)
        if any(initial[k]!=0 for k in ('effort_j_kg','moving_s','stopped_s')):ca.fail('outside_bridge_family','pre-route initial clocks/effort must be zero')
        anchor_receipt=None
        if q['scaleStrategy']=='independent_anchor':
            if anchor is None or admitted['parameters'] is not None:ca.fail('not_estimable','one separately admitted missing-scale anchor required')
            ca.strict(anchor,('source','history','config','envelope','provenance','id','revision'),'private independent anchor')
            if anchor['id']!=q['anchorId'] or anchor['revision']!=q['anchorRevision'] or anchor['envelope']['sha256']!=q['artifactSha256']:
                ca.fail('stale_anchor_binding','anchor selection or artifact differs')
            ca.bounded_input({k:v for k,v in anchor.items() if k!='source'},budget)
            ca.bounded_input(bridge.source_json(anchor['source']),budget)
            hp,_,_=bridge.compile_source(anchor['source'],budget,[source_bytes],historical=True)
            if hp['binding']['route_sha256']==binding['route_sha256']:ca.fail('historical_target_overlap','separate historical route occurrence required')
            config=copy.deepcopy(anchor['config'])
            config['max_primitive_events']=budget.primitives.max_events-budget.primitives.events
            config['max_primitive_pieces']=budget.primitives.max_pieces-budget.primitives.pieces
            anchor_receipt=ca.calibrate_scale(anchor['envelope'],anchor['provenance'],**{k:v for k,v in hp.items() if k!='start_at'},history=anchor['history'],config=config,max_work=budget.max_work-budget.work,cancelled=budget.cancellation_check,isolated_test=True,max_wall_s=budget.remaining_wall())
            if not anchor_receipt.get('complete'):
                if anchor_receipt.get('resources') is None:budget.accounting_complete=False
                else:budget.charge_anchor(anchor_receipt['resources'])
                ca.fail(anchor_receipt['status'],'independent anchor refused')
            budget.charge_anchor(anchor_receipt['resources'])
            admitted['values']['scale_s_per_j_kg']=anchor_receipt['scale_s_per_j_kg']
            admitted['parameters']=ca.parameters(admitted['values'],admitted['artifact']['support'],admitted['artifact']['artifact_id'])
        elif q['scaleStrategy']!='explicit_scale' or admitted['parameters'] is None or anchor is not None:
            ca.fail('not_estimable','reviewed explicit scale or independent anchor required')
        # Conservative typed full-output admission before dense event/profile
        # allocation. 8192 bytes/128 nodes per atomic event covers all frozen
        # numeric fields, two seven-field states and bounded identity strings;
        # 4096 bytes/64 nodes per original-cell profile is a separate allowance.
        atomic_upper=2*(len(g.cells)+len(prepared['raw_sections'])+len(prepared['checkpoint_ids']))
        profile_upper=2*len(g.cells)
        fixed_bytes=len(json.dumps(clean,allow_nan=False,separators=(',',':')).encode())*3
        if fixed_bytes+8192*atomic_upper+4096*profile_upper>lim['max_response_bytes'] or 128*atomic_upper+64*profile_upper>500000:
            ca.fail('resource_limit','conservative complete-output allocation bound')
        replays={}
        for name in ('baseline','proposed'):
            data=request[name]
            prep=ca.prepare_route(g,caps,prepared['raw_sections'],data['locks'],data['stations'],binding,request['context'],admitted['artifact'],budget,prepared['baseline_plan']['input']['fatigue_end_multiplier'])
            result=ca.forward_geometry(g,caps,prepared['raw_sections'],data['locks'],data['stations'],binding,request['context'],admitted,budget,shape_end_multiplier=prepared['baseline_plan']['input']['fatigue_end_multiplier'],prepared=prep,details=True)
            replays[name]=_complete(result,initial,prep,ca)
            replays[name]['controls']=copy.deepcopy(data)
            if anchor_receipt is not None:
                # Same disclosure as frozen run_anchored: no anchor support
                # interval is silently promoted to target clock uncertainty.
                replays[name]['uncertainty'].update(
                    numerical_bound_scope='conditional_on_returned_point_scale_fixed_theta_state_and_controls_only',
                    anchor_scale_support_s_per_j_kg=anchor_receipt['scale_support_s_per_j_kg'],
                    anchor_support_meaning=anchor_receipt['scale_support_meaning'],
                    anchor_scale_support_propagated_to_target_clock=False,
                    measurement_and_model_uncertainty_in_numerical_bound=False)
                replays[name]['capabilities']['anchor_status']='conditional_same_law_identified'

        if not _near(replays['baseline']['race_clock']['dwell_s'],request['current_A_clock']['dwell_s']):ca.fail('stale_station_binding','unchanged baseline dwell must equal A')
        clocks=dict(current_A_clock=copy.deepcopy(request['current_A_clock']),same_scenario_baseline=replays['baseline']['race_clock'],proposed_same_scenario=replays['proposed']['race_clock'])
        def delta(a,b):return {k:a[k]-b[k] for k in ('moving_s','dwell_s','finish_s')}
        output=dict(schema_version=VERSION,result_family=RESULT_FAMILY,status='conditional_scenario',complete=True,admission_scope=TEST_SCOPE,
                    binding=dict(lifetime=copy.deepcopy(request['lifetime']),qualification=copy.deepcopy(q),manual_binding=prepared['binding'],route=copy.deepcopy(binding),
                                 request_sha256=ca.digest(clean),runtime_guard_sha256=GUARD_SHA,law_hashes=copy.deepcopy(ca.EXPECTED),
                                 scale_s_per_j_kg=admitted['values']['scale_s_per_j_kg'],state_reference_id=admitted['artifact']['state_reference']['protocol_id']),
                    input_binding=copy.deepcopy(clean),geometry_snapshot=copy.deepcopy(request['geometry_snapshot']),route=copy.deepcopy(request['route']),raw_sections=copy.deepcopy(prepared['raw_sections']),
                    clocks=clocks,replays=replays,edit_delta=delta(clocks['proposed_same_scenario'],clocks['same_scenario_baseline']),
                    scenario_basis_gap=delta(clocks['same_scenario_baseline'],clocks['current_A_clock']),handoff_delta=delta(clocks['proposed_same_scenario'],clocks['current_A_clock']),
                    anchor_receipt=anchor_receipt,production_admission=False,ui_apply_admitted=False,user_export_admitted=False,recommended_rest_s=None,
                    personal_model_calibrated=False,personal_causal_effect_identified=False,physiological_feasibility_identified=False,accuracy_claim=None,
                    target_rebalanced=False,parameter_refit=False,mutates_input=False,resources=None)
        # Bounds apply to the complete full-state output; refuse, never truncate.
        _bounded_output(output,budget,ca)
        output['resources']=budget.snapshot()
        payload=json.dumps(output,separators=(',',':'),allow_nan=False).encode()
        budget.take(len(payload)//1024+1)
        if len(payload)>lim['max_response_bytes']:ca.fail('resource_limit','complete response byte bound')
        output['resources']=budget.snapshot();budget.primitives.check()
        return output
    except Exception as ex:
        # Failure is atomic: no partial numerical ledger or private path/content.
        code=getattr(ex,'code','invalid_schema')
        if budget and budget.timed_out:code='time_limit'
        return dict(schema_version=VERSION,status=code,complete=False,reason='detached forward replay refused',
                    production_admission=False,ui_apply_admitted=False,user_export_admitted=False,recommended_rest_s=None,
                    resources=budget.snapshot() if budget else None)
