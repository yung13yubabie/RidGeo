"""Bounded, non-mutating preview projection around immutable bridge r1.

No UI, Apply/export, physiological coefficients, fitting defaults or new model.
"""
from __future__ import annotations
import base64, binascii, copy, hashlib, json, math
from pathlib import Path
import sys
import runtime_integrity as integrity
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
import production_recovery_bridge as bridge
ca=bridge.ca
search=bridge.search_engine
VERSION='conditional-worker-preview/0.2-runtime-capsule'
SNAPSHOT_VERSION='conditional-preview-owner/0.1'
MAX_WALL_S=120.
MAX_RESPONSE_BYTES=8*1024*1024
MAX_RESPONSE_NODES=500000
MAX_SCENARIOS=2
MAX_POLICIES=64
MAX_TARGET_SCENARIO_CELLS=15000
MAX_TARGET_SCENARIO_RAW_SECTIONS=3000
MAX_HISTORY_CELLS=30000
META_FIELDS=('request_sha256','owner_snapshot_json','owner_snapshot_sha256','owner_generation','correlation','initialization_elapsed_s')
SNAP_FIELDS=('schema_version','mode','plan_identity','route_sha256','geometry_sha256','owner_revision','input_revision','raw_signature','target_gpx_b64_sha256','checkpoint_ids','raw_section_ids','station_revision','context_revision')


def sha_text(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def scalar_unicode_tree(value,budget):
    stack=[value]
    while stack:
        item=stack.pop();budget.take()
        if isinstance(item,str):item.encode('utf-8')
        elif type(item) is dict:
            for k,v in item.items():k.encode('utf-8');stack.append(v)
        elif type(item) is list:stack.extend(item)


def error(code,message,meta=None,**details):
    d=dict(request_sha256=meta.get('request_sha256') if isinstance(meta,dict) else None,
           owner_snapshot_sha256=meta.get('owner_snapshot_sha256') if isinstance(meta,dict) else None,
           owner_generation=meta.get('owner_generation') if isinstance(meta,dict) else None,
           correlation=meta.get('correlation') if isinstance(meta,dict) else None,
           source_role=None,scenario_id=None,source_id=None,source_b64_sha256=None)
    d.update(details)
    return dict(ok=False,error=dict(code=code,message=message,admission_rejected=d.pop('admission_rejected',False),details=d))


def validate_snapshot(text,expected,budget):
    if not isinstance(text,str) or len(text)>256*1024 or len(text.encode('utf-8'))>256*1024 or sha_text(text)!=expected:
        ca.fail('snapshot_hash_mismatch','owner snapshot text hash')
    snap=json.loads(text);search.strict_fields(snap,SNAP_FIELDS,'owner snapshot');ca.bounded_input(snap,budget);scalar_unicode_tree(snap,budget)
    if snap['schema_version']!=SNAPSHOT_VERSION or snap['mode']!='goal':
        ca.fail('invalid_preview_snapshot','current goal owner snapshot required')
    for field in ('plan_identity','owner_revision','input_revision','station_revision','context_revision'):
        ca.label(snap[field],field)
    for field in ('route_sha256','geometry_sha256','target_gpx_b64_sha256'):
        if not isinstance(snap[field],str) or len(snap[field])!=64 or any(c not in '0123456789abcdef' for c in snap[field]):
            ca.fail('invalid_preview_snapshot',field)
    if not isinstance(snap['raw_signature'],str) or len(snap['raw_signature'])>65536:
        ca.fail('invalid_preview_snapshot','raw signature')
    for field,maximum in (('checkpoint_ids',101),('raw_section_ids',15000)):
        values=ca.sequence(snap[field],maximum,field)
        if not values or any(not isinstance(v,str) or not v or len(v)>256 for v in values) or len(set(values))!=len(values):
            ca.fail('invalid_preview_snapshot',field)
    return snap


def admit_source(source,role,scenario_id,source_id,budget,usage,meta):
    """Only actual raw admission errors receive the source-retirement marker."""
    encoded=source['gpx_b64'];identity=sha_text(encoded)
    try:
        data=base64.b64decode(encoded,validate=True)
    except (ValueError,TypeError,binascii.Error):
        return None,error('invalid_file','GPX transport encoding refused',meta,admission_rejected=True,
                          source_role=role,scenario_id=scenario_id,source_id=source_id,source_b64_sha256=identity)
    try:
        bridge.validate_gpx_admission(data)
    except ca.InputError as ex:
        return None,error(ex.code,str(ex),meta,admission_rejected=True,source_role=role,
                          scenario_id=scenario_id,source_id=source_id,source_b64_sha256=identity)
    usage['gpx_bytes']+=len(data)
    if usage['gpx_bytes']>bridge.MAX_AGGREGATE_GPX_BYTES:
        ca.fail('source_resource_limit','aggregate preview GPX bytes')
    g=bridge.build_geometry(bridge.parse_gpx(data));budget.take(g.source_points+len(g.cells)+1)
    return g,None


def project_bridge(result,budget,g):
    """An explicitly incomplete-detail projection, not a raw/full route ledger."""
    result=dict(result)
    comparison=dict(result['comparison']);ledgers={};omitted=[]
    for purpose,scenario_ledgers in comparison['route_ledgers'].items():
        projected={}
        for scenario_id,ledger in scenario_ledgers.items():
            budget.take()
            events=ledger['events'];moves=stops=0;prefix_by_end={0.:0.}
            for event in events:
                budget.take();moves+=event['kind']=='move';stops+=event['kind']=='stop'
                if event['kind']=='move':prefix_by_end[event['end_m']]=event['state']['moving_s']
            projected[scenario_id]={k:v for k,v in ledger.items() if k!='events'}
            projected[scenario_id]['raw_boundary_samples']=[dict(id=r['id'],start_m=r['start_m'],end_m=r['end_m'],
                start_moving_s=prefix_by_end[r['start_m']],end_moving_s=prefix_by_end[r['end_m']]) for r in ledger['raw_section_times']]
            projected[scenario_id]['canonical_cell_prefix_samples']=[dict(end_m=c.end_m,cumulative_moving_s=prefix_by_end[c.end_m]) for c in g.cells]
            omitted.append(dict(purpose=purpose,scenario_id=scenario_id,omitted_event_count=len(events),
                                omitted_movement_event_count=moves,omitted_stop_event_count=stops))
        ledgers[purpose]=projected
    comparison['route_ledgers']=ledgers;result['comparison']=comparison
    return result,dict(schema_version='conditional-preview-projection/0.1',
                       full_route_ledger=False,complete_grid_scores=True,all_original_cell_times=True,
                       all_raw_section_times=True,all_checkpoint_seven_field_states=True,
                       exact_raw_boundary_samples=True,exact_canonical_cell_prefix_samples=True,
                       all_final_seven_field_states=True,interpolated_time_samples=False,
                       omitted_event_details=omitted,apply_admitted=False,export_admitted=False)


def bounded_output(value,budget):
    stack=[(value,0)];nodes=0
    while stack:
        item,depth=stack.pop();nodes+=1;budget.take()
        if nodes>MAX_RESPONSE_NODES or depth>32:
            ca.fail('response_resource_limit','preview response node/depth bound')
        if type(item) is dict:
            if nodes+len(stack)+len(item)>MAX_RESPONSE_NODES:ca.fail('response_resource_limit','response pending nodes')
            for k,v in item.items():
                if not isinstance(k,str):ca.fail('invalid_preview_response','response keys')
                stack.append((v,depth+1))
        elif type(item) is list:
            if nodes+len(stack)+len(item)>MAX_RESPONSE_NODES:ca.fail('response_resource_limit','response pending nodes')
            stack.extend((v,depth+1) for v in item)
        elif item is not None and type(item) not in (str,bool,int,float):ca.fail('invalid_preview_response','response scalar')
        elif type(item) in (int,float) and not math.isfinite(item):ca.fail('invalid_preview_response','nonfinite response')
    text=json.dumps(value,allow_nan=False,ensure_ascii=False,separators=(',',':'))
    if len(text.encode('utf-8'))>MAX_RESPONSE_BYTES:
        ca.fail('response_resource_limit','preview UTF-8 response byte bound')
    return text


def handle_request(request_text,metadata_text):
    integrity.ensure_installed()
    budget=None;meta=None;result=None
    try:
        if not isinstance(request_text,str) or len(request_text.encode('utf-8'))>16*1024*1024:
            return json.dumps(error('source_resource_limit','bounded UTF-8 request text required'))
        if not isinstance(metadata_text,str) or len(metadata_text)>600*1024 or len(metadata_text.encode('utf-8'))>600*1024:
            return json.dumps(error('invalid_preview_request','bounded metadata required'))
        meta=json.loads(metadata_text);search.strict_fields(meta,META_FIELDS,'preview metadata')
        if sha_text(request_text)!=meta['request_sha256']:
            return json.dumps(error('request_hash_mismatch','original request text hash differs',meta))
        search.strict_fields(meta['correlation'],('generation','request_id'),'Worker correlation')
        if any(isinstance(v,bool) or not isinstance(v,int) or not 0<v<2**53 for v in (meta['owner_generation'],*meta['correlation'].values())):
            ca.fail('invalid_preview_request','safe positive generation/request IDs required')
        request=json.loads(request_text);clean=bridge.request_json(request);limits=request['limits']
        wall=ca.kernel.num(limits['max_wall_s'],'max_wall_s',positive=True)
        if wall>MAX_WALL_S:ca.fail('preview_resource_limit','requested wall budget exceeds 120s transport cap')
        init=ca.kernel.num(meta['initialization_elapsed_s'],'initialization elapsed')
        if init>=wall:return json.dumps(error('time_limit','runtime initialization consumed request deadline',meta))
        budget=search.SharedWorkBudget(limits['max_work'],limits['max_primitive_events'],limits['max_primitive_pieces'],None,wall-init)
        ca.bounded_input(clean,budget);scalar_unicode_tree(clean,budget);snap=validate_snapshot(meta['owner_snapshot_json'],meta['owner_snapshot_sha256'],budget)
        scenarios=request['scenarios']
        if not 1<=len(scenarios)<=MAX_SCENARIOS:ca.fail('preview_resource_limit','preview supports one or two scenarios')
        if not 1<=limits['max_policies']<=MAX_POLICIES:ca.fail('preview_resource_limit','preview max_policies <=64')
        src=request['target_source']
        if (src['owner_revision']!=snap['owner_revision'] or src['checkpoint_ids']!=snap['checkpoint_ids']
            or [r['id'] for r in src['raw_sections']]!=snap['raw_section_ids']
            or sha_text(src['gpx_b64'])!=snap['target_gpx_b64_sha256']):
            ca.fail('stale_preview_owner','request source does not match owner snapshot')
        usage=dict(gpx_bytes=0);g,refusal=admit_source(src,'target',None,None,budget,usage,meta)
        if refusal:return json.dumps(refusal,ensure_ascii=False)
        if g.route_sha256!=snap['route_sha256'] or g.geometry_sha256!=snap['geometry_sha256']:
            ca.fail('stale_preview_owner','target geometry does not match captured owner')
        if len(g.cells)*len(scenarios)>MAX_TARGET_SCENARIO_CELLS:
            ca.fail('preview_resource_limit','upfront target-cell x scenario full-ledger allocation bound')
        if len(src['raw_sections'])*len(scenarios)>MAX_TARGET_SCENARIO_RAW_SECTIONS or len(src['locks'])>256:
            ca.fail('preview_resource_limit','upfront raw-section/lock preview projection allocation bound')
        history_cells=0
        for scenario in scenarios:
            anchor=scenario['anchor']
            if anchor is None:continue
            source_id=anchor['history'].get('source_id') if type(anchor['history']) is dict else None
            hg,refusal=admit_source(anchor['source'],'history',scenario['id'],source_id,budget,usage,meta)
            if refusal:return json.dumps(refusal,ensure_ascii=False)
            history_cells+=len(hg.cells)
            if history_cells>MAX_HISTORY_CELLS:ca.fail('preview_resource_limit','upfront historical-cell allocation bound')
        # Original request bytes remain the receipt identity. Only internal
        # resource allowances change, explicitly reported as effective budget.
        effective=dict(limits,max_work=budget.max_work-budget.work,
                       max_primitive_events=budget.primitives.max_events-budget.primitives.events,
                       max_primitive_pieces=budget.primitives.max_pieces-budget.primitives.pieces,
                       max_wall_s=budget.remaining_wall())
        internal=copy.deepcopy(request);internal['limits']=effective
        result=bridge.execute(internal,isolated_test=False,cancelled=budget.cancellation_check)
        if result.get('resources') is not None:bridge.charge_search(budget,result['resources'])
        else:budget.accounting_complete=False
        if not result['complete']:
            return json.dumps(error(result['status'],result['reason'],meta,resources=budget.snapshot()),ensure_ascii=False)
        projected,projection=project_bridge(result,budget,g)
        response=dict(ok=True,result=dict(schema_version=VERSION,status='conditional_preview_complete',complete=True,
            request_sha256=meta['request_sha256'],owner_snapshot_sha256=meta['owner_snapshot_sha256'],
            owner_generation=meta['owner_generation'],correlation=meta['correlation'],
            source_base_commit='5d2a8fcede539551d4d62f6ac3a469b8106f34db',
            integration_base_commit='d3f68a7f8f4adf10b1d6b25f9d9ac39ace545253',
            bridge_module_sha256=integrity.installed_identity()['bridge_module_sha256'],
            bridge_source_module_sha256='ad437060fd8224611609f504bd2aa431b5c6de34c030497dd2dda90451f2b8ae',
            runtime_capsule=integrity.installed_identity(),
            bridge_freeze_manifest_sha256='cf052324ed6ba2a418148623aac6543a0dbcbf51fe99d8e7c4214dc79d4fc924',
            requested_limits=limits,effective_bridge_limits=effective,initialization_elapsed_s=init,
            allocation_reserve=dict(target_scenario_cells=len(g.cells)*len(scenarios),history_cells=history_cells,
                                    target_scenario_raw_sections=len(src['raw_sections'])*len(scenarios),target_locks=len(src['locks']),
                                    maximum_target_scenario_cells=MAX_TARGET_SCENARIO_CELLS,maximum_history_cells=MAX_HISTORY_CELLS,
                                    maximum_target_scenario_raw_sections=MAX_TARGET_SCENARIO_RAW_SECTIONS,maximum_target_locks=256,
                                    maximum_scenarios=MAX_SCENARIOS,maximum_policies=MAX_POLICIES),
            projection=projection,bridge=projected,resources=budget.snapshot(),
            apply_admitted=False,export_admitted=False,recommended_rest_s=None,accuracy_claim=None,
            personal_model_calibrated=False,physiological_feasibility_identified=False,mutates_input=False))
        # Bound the completed response and its updated counter receipt before
        # Python returns it. No partial/truncated success crosses the Worker.
        bounded_output(response,budget);response['result']['resources']=budget.snapshot()
        text=json.dumps(response,allow_nan=False,ensure_ascii=False,separators=(',',':'))
        if len(text.encode('utf-8'))>MAX_RESPONSE_BYTES:ca.fail('response_resource_limit','final UTF-8 response byte bound')
        budget.primitives.check()
        return text
    except (ca.kernel.ModelError,ca.InputError) as ex:
        return json.dumps(error('time_limit' if budget and budget.timed_out else ex.code,str(ex),meta,
                               resources=budget.snapshot() if budget else None),ensure_ascii=False)
    except (ValueError,TypeError,KeyError,IndexError,AttributeError,OverflowError,RecursionError,UnicodeError):
        return json.dumps(error('invalid_preview_request','malformed bounded preview request',meta))
