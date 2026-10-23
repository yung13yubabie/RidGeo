"""Isolated source-to-conditional-model bridge; never a production UI result.

The unchanged production adapter authenticates owner/section/lock identities.
The accepted frozen search owns every physiological calculation. No coefficients
or observed moving time are inferred from a goal, stop total or GPX timestamps.
"""
from __future__ import annotations
import base64
import binascii
import copy
from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import sys
import runtime_integrity as integrity

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / 'production'))
sys.path.insert(0, str(HERE / 'frozen-search'))
import conditional_stop_search as search_engine
import conditional_adapter as ca
import manual_pace_adapter as manual
from gpx_admission import validate_gpx_admission
from trail_planner import parse_gpx, build_geometry

VERSION = 'production-conditional-recovery-bridge/0.1'
MAX_GPX_BYTES = 5 * 1024 * 1024
MAX_AGGREGATE_GPX_BYTES = 10 * 1024 * 1024
SOURCE_FIELDS = ('gpx_b64', 'settings', 'raw_sections', 'checkpoint_ids',
                 'owner_revision', 'expected_manual_binding', 'locks', 'stations',
                 'context', 'start_at')
STATION_FIELDS = ('id', 'kind', 'service', 'rest_s', 'composition', 'bundle_id')
REQUEST_FIELDS = ('schema_version', 'mode', 'target_source', 'scenarios',
                  'rest_grid', 'constraints', 'limits', 'near_equivalent_s')
LIMIT_FIELDS = ('max_policies', 'max_work', 'max_primitive_events',
                'max_primitive_pieces', 'max_wall_s')
MANIFEST_SHA = 'b6e660c737624dbb9a628b502fa59424c0647266b7634d883ff5b9d8a2ae3248'  # Filled by the freeze procedure, not caller data.


def fail(code, message):
    ca.fail(code, message)


def unavailable(status, reason, budget=None, **details):
    return dict(schema_version=VERSION, status=status, reason=reason,
                complete=False, final_state=None, finish_elapsed_s=None,
                best_conditional_grid_policy=None, recommended_rest_s=None,
                accuracy_claim=None, personal_causal_effect_identified=False,
                physiological_feasibility_identified=False, mutates_input=False,
                resources=budget.snapshot() if budget else None, **details)


def verify_sources(budget):
    integrity.verify_runtime(budget)
    search_engine.verify_engine(budget)
    return dict(base_commit=integrity.SOURCE_BASE, files={name:spec['sha256'] for name,spec in integrity.FILES.items()})


def charge_search(budget, resources):
    """Commit known consumption and incomplete-accounting flags before cancel.

    Accepted r3 can omit failed-anchor counters. The accepted search reports
    that omission; it must survive a cancellation exactly at this handoff.
    """
    work, events, pieces, anchors = (resources[k] for k in ('adapter_work', 'events', 'pieces', 'anchors'))
    if any(isinstance(v, bool) or not isinstance(v, int) or v < 0 for v in (work, events, pieces, anchors)):
        fail('invalid_schema', 'invalid inner search usage receipt')
    if (budget.work + work > budget.max_work
            or budget.primitives.events + events > budget.primitives.max_events
            or budget.primitives.pieces + pieces > budget.primitives.max_pieces):
        fail('resource_limit', 'inner search exceeded shared remaining allowance')
    budget.work += work
    budget.primitives.events += events
    budget.primitives.pieces += pieces
    budget.anchors += anchors
    budget.accounting_complete = budget.accounting_complete and resources.get('usage_accounting_complete', False)
    budget.primitives.check()


def source_json(source):
    search_engine.strict_fields(source, SOURCE_FIELDS, 'production source')
    if not isinstance(source['gpx_b64'], str) or len(source['gpx_b64']) > 6990508:
        fail('source_resource_limit', 'bounded base64 GPX required')
    if not isinstance(source['raw_sections'], list) or len(source['raw_sections']) > 25000:
        fail('source_resource_limit', 'raw section bound')
    if not isinstance(source['checkpoint_ids'], list) or len(source['checkpoint_ids']) > 101:
        fail('source_resource_limit', 'production checkpoint bound')
    if not isinstance(source['locks'], list) or len(source['locks']) > 1000:
        fail('source_resource_limit', 'manual lock bound')
    if source['stations'] is not None and (not isinstance(source['stations'], list) or len(source['stations']) > 101):
        fail('source_resource_limit', 'station bound')
    return {k: v for k, v in source.items() if k != 'gpx_b64'}


def request_json(request):
    search_engine.strict_fields(request, REQUEST_FIELDS, 'bridge request')
    if request['schema_version'] != VERSION or request['mode'] not in ('forward', 'search'):
        fail('invalid_schema', 'bridge version/mode')
    search_engine.strict_fields(request['limits'], LIMIT_FIELDS, 'limits')
    scenarios = ca.sequence(request['scenarios'], 32, 'scenarios')
    clean = []
    for scenario in scenarios:
        search_engine.strict_fields(scenario, ('id', 'envelope', 'provenance', 'anchor'), 'scenario')
        anchor = scenario['anchor']
        if anchor is not None:
            search_engine.strict_fields(anchor, ('source', 'history', 'config'), 'historical source anchor')
            anchor = dict(source=source_json(anchor['source']), history=anchor['history'], config=anchor['config'])
        clean.append(dict(scenario, anchor=anchor))
    return dict(request, target_source=source_json(request['target_source']), scenarios=clean)


def compile_source(source, budget, byte_usage, *, historical=False):
    """Authenticate actual production preparation, then map declared inputs.

    Parsing is bounded by pinned GPX admission and aggregate byte ceilings. It
    does not have cooperative interruption within a parser call; the supported
    browser route must remain a terminate-on-cancel Worker.
    """
    budget.take()
    try:
        data = base64.b64decode(source['gpx_b64'], validate=True)
    except (ValueError, TypeError, binascii.Error):
        fail('invalid_file', 'invalid GPX base64')
    if not data or len(data) > MAX_GPX_BYTES:
        fail('source_resource_limit', 'individual GPX byte bound')
    byte_usage[0] += len(data)
    if byte_usage[0] > MAX_AGGREGATE_GPX_BYTES:
        fail('source_resource_limit', 'aggregate GPX byte bound')
    validate_gpx_admission(data)
    g = build_geometry(parse_gpx(data))
    budget.take(g.source_points + len(g.cells))
    if len(g.cells) > 25000:
        fail('source_resource_limit', 'canonical cell bound')
    prepared = manual.prepare_geometry(g, source['settings'], source['raw_sections'],
                                       source['checkpoint_ids'], source['owner_revision'])
    if source['expected_manual_binding'] != prepared['binding']:
        fail('stale_manual_session', 'production owner/route/settings/section binding differs')
    baseline = prepared['baseline_plan']
    settings = baseline['input']
    if settings['min_speed_m_s'] != 0:
        fail('outside_bridge_family', 'nonzero production minimum speed is unsupported, not discarded')
    if not g.elevation_complete or any(c.grade is None or abs(c.grade) > .45 for c in g.cells):
        fail('outside_bridge_family', 'complete unclamped ordinary-running terrain required')
    if historical and source['start_at'] is not None:
        fail('invalid_schema', 'historical anchor start_at must be None')
    if source['stations'] is None:
        fail('not_estimable', 'station service/rest composition is missing; a total dwell is insufficient')
    if len(source['stations']) != len(baseline['checkpoints']):
        fail('stale_station_binding', 'station occurrences must match all production checkpoints')
    cps, baseline_policy = [], {}
    for ident, original, declared in zip(prepared['checkpoint_ids'], baseline['checkpoints'], source['stations']):
        budget.take()
        ca.strict(declared, STATION_FIELDS, 'station decomposition')
        if declared['id'] != ident:
            fail('stale_station_binding', 'station occurrence order/identity differs')
        is_finish = original['distance_m'] == g.distance_m
        if (declared['kind'] == 'finish') != is_finish:
            fail('stale_station_binding', 'finish identity differs')
        if any(declared[k] is None for k in ('kind', 'rest_s', 'composition')):
            fail('not_estimable', 'station kind, extra/containing rest and overlap must be explicit')
        cutoff = (None if original['cutoff_elapsed_s'] is None else
                  dict(kind=original['cutoff_kind'], elapsed_s=original['cutoff_elapsed_s']))
        cps.append(dict(declared, name=original['name'], distance_m=original['distance_m'], cutoff=cutoff))
    # Compile only the service scheduler here. Its output is not a physiology
    # claim. r3 will repeat full supported-service/domain admission in search.
    for original, cp in zip(baseline['checkpoints'], cps):
        if cp['kind'] == 'service':
            if cp['service'] is None:
                fail('not_estimable', 'service makespan/task schedule missing')
            ca.strict(cp['service'], ('duration_s', 'tasks'), 'service')
            if (cp['service']['duration_s'] is None) == (cp['service']['tasks'] is None):
                fail('invalid_schema', 'supply makespan or tasks')
            service = (ca.schedule_checked(cp['service']['tasks'], budget) if cp['service']['tasks'] is not None
                       else ca.kernel.num(cp['service']['duration_s'], 'service duration'))
            rest = ca.kernel.num(cp['rest_s'], 'rest_s')
            if cp['composition'] == 'sequential_service_then_rest':
                dwell, extra = service + rest, rest
            elif cp['composition'] == 'rest_contains_all_service':
                if rest < service:
                    fail('invalid_schema', 'containing rest must cover all service')
                dwell, extra = rest, rest - service
            else:
                fail('not_estimable', 'unknown/partial service and rest overlap')
            if dwell != original['stop_s']:
                fail('stale_station_binding', 'declared dwell must exactly match current production stop seconds')
            baseline_policy[cp['id']] = extra
        elif cp['kind'] in ('timing_only', 'finish'):
            if (original['stop_s'] != 0 or cp['service'] is not None or cp['rest_s'] != 0
                    or cp['composition'] != 'none' or cp['bundle_id'] is not None):
                fail('stale_station_binding', 'timing-only/finish must preserve zero dwell')
        else:
            fail('invalid_schema', 'station kind')
    caps = dict(max_speed_m_s=settings['max_speed_m_s'],
                uphill_cap_grade=settings['walk_uphill_grade'],
                uphill_cap_m_s=settings['walk_max_speed_m_s'],
                downhill_cap_grade=None, downhill_cap_m_s=None)
    binding = dict(route_sha256=g.route_sha256, geometry_sha256=g.geometry_sha256,
                   geometry_config_sha256=ca.digest(asdict(g.config)), owner_revision=source['owner_revision'])
    plan = dict(g=g, caps=caps, sections=copy.deepcopy(prepared['raw_sections']),
                locks=copy.deepcopy(source['locks']), cps=cps, binding=binding,
                context=copy.deepcopy(source['context']),
                shape_end_multiplier=settings['fatigue_end_multiplier'], start_at=source['start_at'])
    bridge_binding = ca.digest(dict(version=VERSION, manual_binding=prepared['binding'],
                                    conditional_plan=search_engine.plan_json(plan)))
    receipt = dict(manual_binding=prepared['binding'], bridge_binding=bridge_binding,
                   original_target_elapsed_s=baseline['target_elapsed_s'],
                   original_stops_s=baseline['stops_s'], binding=binding,
                   checkpoint_ids=prepared['checkpoint_ids'], raw_sections=prepared['raw_sections'],
                   target_goal_used_for_scale=False, old_goal_curve_used_for_free_movement=False,
                   old_shape_used_only_inside_prescribed_locks=True,
                   zero_stop_checkpoint_barriers_retained=True)
    return plan, baseline_policy, receipt


def execute(request, *, cancelled=None, isolated_test=False):
    """Pure bounded forward/search request over authenticated production inputs."""
    budget = None
    try:
        clean = request_json(request)
        lim = request['limits']
        budget = search_engine.SharedWorkBudget(lim['max_work'], lim['max_primitive_events'],
                                                lim['max_primitive_pieces'], cancelled, lim['max_wall_s'])
        ca.bounded_input(clean, budget)
        sources = verify_sources(budget)
        byte_usage = [0]
        target, baseline, target_receipt = compile_source(request['target_source'], budget, byte_usage)
        scenarios, history_receipts = [], []
        for item in request['scenarios']:
            envelope = item['envelope']
            # The UI clock is elapsed from the route start. Nonzero accrued
            # effort/clocks require a separately specified in-race/resume mode.
            if envelope is not None:
                ref = envelope.get('payload', {}).get('state_reference', {}).get('initial_state')
                if isinstance(ref, dict) and any(ref.get(k) not in (None, 0) for k in ('effort_j_kg', 'moving_s', 'stopped_s')):
                    fail('outside_bridge_family', 'pre-route reference requires explicitly zero accrued effort and clocks')
            anchor = item['anchor']
            if anchor is not None:
                hp, _, receipt = compile_source(anchor['source'], budget, byte_usage, historical=True)
                if anchor['history'].get('independent_of_target') is not True:
                    fail('not_identified', 'target/goal is not independent observed history')
                history_receipts.append(dict(scenario_id=item['id'], **receipt))
                anchor = dict(history_plan=hp, history=anchor['history'], config=anchor['config'])
            scenarios.append(dict(item, anchor=anchor))
        if request['mode'] == 'forward':
            if request['rest_grid'] is not None:
                fail('invalid_schema', 'forward must use its declared baseline, not a rest grid')
            grid = {ident: [value] for ident, value in baseline.items()}
        else:
            grid = request['rest_grid']
        result = search_engine.search(scenarios, target, grid, baseline, request['constraints'],
                    max_policies=lim['max_policies'], max_work=budget.max_work - budget.work,
                    max_primitive_events=budget.primitives.max_events - budget.primitives.events,
                    max_primitive_pieces=budget.primitives.max_pieces - budget.primitives.pieces,
                    max_wall_s=budget.remaining_wall(), cancelled=budget.cancellation_check,
                    near_equivalent_s=request['near_equivalent_s'], isolated_test=isolated_test)
        if result.get('resources') is not None:
            charge_search(budget, result['resources'])
        else:
            budget.accounting_complete = False
        if not result.get('complete'):
            return unavailable(result['status'], result['reason'], budget, conditional_failure=result)
        budget.primitives.check()
        return dict(schema_version=VERSION, status='conditional_source_bridge_complete', complete=True,
                    mode=request['mode'], purpose='unvalidated_conditional_scenario',
                    production_result_compatible=False, owner_apply_admitted=False,
                    target_source_receipt=target_receipt, history_source_receipts=history_receipts,
                    scenario_set_sha256=ca.digest(clean['scenarios']),
                    baseline_policy=baseline, comparison=result,
                    resources=dict(budget.snapshot(), aggregate_scope='source_admission_compilation_all_anchors_all_policies_all_replays',
                                   admitted_gpx_bytes=byte_usage[0]),
                    source_base_commit=sources['base_commit'],
                    recommended_rest_s=None, accuracy_claim=None,
                    personal_causal_effect_identified=False, physiological_feasibility_identified=False,
                    target_rebalanced=False, parameter_refit=False, mutates_input=False)
    except (ca.kernel.ModelError, ca.InputError) as error:
        return unavailable('time_limit' if budget and budget.timed_out else error.code, str(error), budget)
    except (ValueError, TypeError, KeyError, IndexError, AttributeError, OverflowError, RecursionError):
        return unavailable('invalid_schema', 'malformed or unsupported bridge input', budget)


def handle_request(request_json_text, *, cancelled=None, isolated_test=False):
    if not isinstance(request_json_text, str) or len(request_json_text) > 16 * 1024 * 1024:
        return json.dumps(unavailable('source_resource_limit', 'bounded JSON request required'))
    try:
        request = json.loads(request_json_text)
    except (ValueError, TypeError, RecursionError):
        return json.dumps(unavailable('invalid_schema', 'invalid request JSON'))
    return json.dumps(execute(request, cancelled=cancelled, isolated_test=isolated_test),
                      allow_nan=False, ensure_ascii=False, separators=(',', ':'))
