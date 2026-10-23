"""Bounded manual moving-pace clock accounting on the unchanged goal core.

This does not estimate intensity-dependent fatigue or station recovery. No
athlete coefficients, initial latent states or ability are inferred from a goal.
"""
from __future__ import annotations

import base64
import binascii
import copy
import hashlib
import json
import math
import sys
from bisect import bisect_right
from fractions import Fraction
from trail_planner import parse_gpx, build_geometry, create_plan, InputError
from trail_planner.planning import running_cost, _allocate_continuous, _round_second
from gpx_admission import validate_gpx_admission
from hiking_reference import is_hiking, create_hiking_plan, reference_curve

VERSION = 'manual-moving-pace-clock/1.0'
ALLOCATION = 'preserve_baseline_cost_shape'
MAX_SECTIONS = 25000
MAX_LOCKS = 1000


def fail(code, message):
    raise InputError(code, message)


def number(value, name, *, positive=False):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        fail('invalid_manual_pace', f'{name} 須為有限數字。')
    try:
        value = float(value)
    except (OverflowError, ValueError):
        fail('manual_numeric_support', f'{name} 超出計算範圍。')
    if not math.isfinite(value) or value < 0 or (positive and value == 0):
        fail('invalid_manual_pace', f'{name} 須為有效正值。')
    return value


def label(value, name):
    if not isinstance(value, str) or not value.strip() or len(value) > 256:
        fail('invalid_manual_schema', f'{name} 識別資料有誤。')
    return value


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, allow_nan=False,
                                     separators=(',', ':')).encode()).hexdigest()


def response_status():
    return {'status': 'not_estimable', 'reason': 'intensity_recovery_response_not_identified',
            'missing': ['coherent_same_law_ability_and_intensity_parameter_artifact',
                        'validated_initial_state_and_support_domain',
                        'identified_station_recovery_and_stop_composition'],
            'personal_model_calibrated': False,
            'unlocked_movement': 'unchanged_initial_goal_curve',
            'message': '只重算時間；尚未估計人工配速對後段疲勞與停站恢復的影響。'}


def _prepare(geometry, settings, raw_sections, checkpoint_ids, owner_revision):
    plan = create_hiking_plan(geometry, settings) if is_hiking(settings) else create_plan(geometry, settings)
    if len(geometry.cells) > MAX_SECTIONS:
        fail('manual_resource_limit', '此路線超出人工配速分段上限。')
    revision = label(owner_revision, '目前版本')
    if not isinstance(checkpoint_ids, list) or len(checkpoint_ids) != len(plan['checkpoints']):
        fail('invalid_manual_schema', '站點識別與目前計畫不一致。')
    ids = [label(value, '站點') for value in checkpoint_ids]
    if len(set(ids)) != len(ids):
        fail('invalid_manual_schema', '站點識別不得重複。')
    if not isinstance(raw_sections, list) or not 0 < len(raw_sections) <= MAX_SECTIONS:
        fail('invalid_manual_schema', '原始地形分段清單有誤。')
    sections, previous, section_ids = [], 0.0, set()
    for raw in raw_sections:
        if not isinstance(raw, dict) or set(raw) != {'id', 'start_m', 'end_m'}:
            fail('invalid_manual_schema', '原始地形分段欄位有誤。')
        identity = label(raw['id'], '原始地形分段')
        start, end = number(raw['start_m'], '起點'), number(raw['end_m'], '終點', positive=True)
        if identity in section_ids or start != previous or end <= start or end > geometry.distance_m:
            fail('invalid_manual_schema', '原始地形分段須連續、完整且保留唯一識別。')
        if end - start <= max(1e-9, 128 * sys.float_info.epsilon * max(1.0, abs(start), abs(end))):
            fail('manual_numeric_support', '此原始分段太短，無法可靠重算時間。')
        sections.append({'id': identity, 'start_m': start, 'end_m': end})
        section_ids.add(identity)
        previous = end
    if previous != geometry.distance_m:
        fail('invalid_manual_schema', '原始地形分段未涵蓋完整路線。')
    endpoints = {row['end_m'] for row in sections}
    if any(cp['distance_m'] not in endpoints for cp in plan['checkpoints']):
        fail('invalid_manual_schema', '每個站點都必須保留原始分段邊界。')
    binding = digest({'version': VERSION, 'route': geometry.route_sha256,
                      'geometry': geometry.geometry_sha256, 'model': plan['model_version'],
                      'input': plan['input'], 'raw_sections': sections,
                      'checkpoint_ids': ids, 'owner_revision': revision})
    return plan, sections, ids, binding


def prepare_geometry(geometry, settings, raw_sections, checkpoint_ids, owner_revision):
    plan, sections, ids, binding = _prepare(geometry, settings, raw_sections, checkpoint_ids, owner_revision)
    return {'version': VERSION, 'binding': binding, 'baseline_plan': plan,
            'raw_sections': sections, 'checkpoint_ids': ids, 'owner_revision': owner_revision,
            'downstream_response': response_status()}


def _curve(geometry, plan):
    settings = plan['input']
    if is_hiking(settings):
        return reference_curve(geometry, settings, plan['moving_s'])
    base, lower, upper = [], [], []
    for cell in geometry.cells:
        grade = 0 if cell.grade is None else min(.45, max(-.45, cell.grade))
        base.append(cell.distance_m * running_cost(grade) / running_cost(0))
        walk = cell.grade is not None and cell.grade >= settings['walk_uphill_grade'] - 1e-10
        cap = min(settings['max_speed_m_s'], settings['walk_max_speed_m_s']) if walk else settings['max_speed_m_s']
        lower.append(cell.distance_m / cap)
        upper.append(cell.distance_m / settings['min_speed_m_s'] if settings['min_speed_m_s'] > 0 else math.inf)
    total, work = math.fsum(base), 0.0
    q_start, q_steps = [], []
    for value in base:
        q_start.append(work / total)
        q_steps.append(value / total)
        work += value
    beta = math.log(settings['fatigue_end_multiplier'])
    times, partial = _allocate_continuous(base, q_start, q_steps, beta, lower, upper, plan['moving_s'])
    return base, q_start, q_steps, beta, lower, upper, times, partial


def _bounded_lock_target(pace, target, start, end, fragments, geometry, settings, lower, upper):
    """Compare pace in one representation before handing times to the solver.

    A legal cap-equal pace can produce a target one ULP below the fsum of
    independently rounded fragment floors (or above fragment ceilings). Build
    the weighted cap pace from exact binary64 endpoint/cap ratios, rounding it
    only once to the input pace representation. Even its adjacent outside
    binary64 pace is refused. Then reconcile only the duration representation;
    the allocator's existing per-fragment bounds remain unchanged.
    """
    if is_hiking(settings):
        maximum, minimum = settings['max_speed_m_s'], settings['min_speed_m_s']
        if (maximum is not None and pace < 1000. / maximum) or (minimum > 0 and pace > 1000. / minimum):
            fail('manual_pace_infeasible', '此段配速超出自行指定的速度界線。')
        return min(math.fsum(upper), max(math.fsum(lower), target))
    distance = Fraction(end) - Fraction(start)
    floor = Fraction(0)
    run_cap, run_left, run_right = None, None, None
    for index, left, right in fragments:
        cell = geometry.cells[index]
        walk = cell.grade is not None and cell.grade >= settings['walk_uphill_grade'] - 1e-10
        cap = min(settings['max_speed_m_s'], settings['walk_max_speed_m_s']) if walk else settings['max_speed_m_s']
        if run_cap is not None and cap != run_cap:
            floor += (Fraction(run_right) - Fraction(run_left)) / Fraction(run_cap)
        if cap != run_cap:
            run_cap, run_left = cap, left
        run_right = right
    floor += (Fraction(run_right) - Fraction(run_left)) / Fraction(run_cap)
    fastest_pace = float(floor / distance * 1000)
    slowest_pace = (1000. / settings['min_speed_m_s']
                    if settings['min_speed_m_s'] > 0 else math.inf)
    if pace < fastest_pace or pace > slowest_pace:
        fail('manual_pace_infeasible', '此段配速超出逐格速度限制，請調整；其他段保持不變。')
    return min(math.fsum(upper), max(math.fsum(lower), target))


def _locks(raw_locks, sections, geometry, cps, curve, settings):
    if not isinstance(raw_locks, list) or len(raw_locks) > MAX_LOCKS:
        fail('invalid_manual_schema', '人工配速鎖定清單有誤。')
    by_id = {row['id']: index for index, row in enumerate(sections)}
    seen_ids, covered, locks = set(), set(), []
    base, q_start, q_steps, beta, lower, upper, _, _ = curve
    cell_ends = [cell.end_m for cell in geometry.cells]
    for raw in raw_locks:
        if not isinstance(raw, dict) or set(raw) != {'id', 'child_ids', 'moving_pace_s_per_km', 'allocation'}:
            fail('invalid_manual_schema', '人工配速鎖定欄位有誤。')
        identity = label(raw['id'], '鎖定')
        children = raw['child_ids']
        if identity in seen_ids or raw['allocation'] != ALLOCATION or not isinstance(children, list) or not children or len(children) > MAX_SECTIONS:
            fail('invalid_manual_schema', '鎖定識別或分配方式有誤。')
        if any(not isinstance(value, str) or value not in by_id for value in children):
            fail('stale_manual_section', '鎖定地形分段已變更，請重新選擇。')
        indexes = [by_id[value] for value in children]
        if indexes != list(range(indexes[0], indexes[0] + len(indexes))) or any(index in covered for index in indexes):
            fail('overlapping_manual_lock', '鎖定須為連續原始分段，且不能重疊。')
        start, end = sections[indexes[0]]['start_m'], sections[indexes[-1]]['end_m']
        if any(start < cp['distance_m'] < end for cp in cps):
            fail('manual_checkpoint_barrier', '人工配速不能跨越站點，零分鐘站點也須保留。')
        pace = number(raw['moving_pace_s_per_km'], '移動配速', positive=True)
        target = pace * (end - start) / 1000
        if not math.isfinite(target) or target > 604800:
            fail('manual_numeric_support', '鎖定移動時間超出 7 天計算範圍。')
        fragments, bs, qs, ds, ls, us = [], [], [], [], [], []
        index = bisect_right(cell_ends, start)
        while index < len(geometry.cells) and geometry.cells[index].start_m < end:
            cell = geometry.cells[index]
            if cell.grade is None:
                fail('manual_unknown_terrain', '地形未知分段尚不支援人工配速鎖定。')
            left, right = max(start, cell.start_m), min(end, cell.end_m)
            fraction = (right - left) / cell.distance_m
            offset = (left - cell.start_m) / cell.distance_m
            fragments.append((index, left, right))
            bs.append(base[index] * fraction)
            qs.append(q_start[index] + q_steps[index] * offset)
            ds.append(q_steps[index] * fraction)
            ls.append(lower[index] * fraction)
            us.append(upper[index] * fraction)
            index += 1
        try:
            solver_target = _bounded_lock_target(pace, target, start, end, fragments,
                                                 geometry, settings, ls, us)
            times, partial = _allocate_continuous(bs, qs, ds, beta, ls, us, solver_target)
        except InputError as error:
            if error.code == 'infeasible_target':
                fail('manual_pace_infeasible', '此段配速超出逐格速度限制，請調整；其他段保持不變。')
            raise
        locks.append({'id': identity, 'child_ids': list(children), 'start_m': start, 'end_m': end,
                      'moving_pace_s_per_km': pace, 'requested_moving_s': target,
                      'allocation': ALLOCATION, 'fragments': fragments, 'times': times,
                      'partial': partial})
        seen_ids.add(identity)
        covered.update(indexes)
    return sorted(locks, key=lambda value: value['start_m'])


def recalculate_geometry(geometry, settings, raw_sections, checkpoint_ids, owner_revision, expected_binding, raw_locks):
    baseline, sections, ids, binding = _prepare(geometry, settings, raw_sections, checkpoint_ids, owner_revision)
    if not isinstance(expected_binding, str) or expected_binding != binding:
        fail('stale_manual_session', '路線、站點或設定已變更，請重新計算後再編輯配速。')
    curve = _curve(geometry, baseline)
    locks = _locks(raw_locks, sections, geometry, baseline['checkpoints'], curve, baseline['input'])
    base_partial = curve[-1]
    # Every atomic interval belongs to one unchanged canonical cell. CP and raw
    # identities are explicit boundaries; no display interpolation is introduced.
    boundaries = sorted({0.0, geometry.distance_m, *[c.end_m for c in geometry.cells],
                         *[row['end_m'] for row in sections]})
    cell_ends = [cell.end_m for cell in geometry.cells]
    fragments, cell_times, moving_at = [], [[] for _ in geometry.cells], {0.0: 0.0}
    lock_index, total_sum, compensation = 0, 0.0, 0.0
    for start, end in zip(boundaries, boundaries[1:]):
        index = bisect_right(cell_ends, start)
        cell = geometry.cells[index]
        while lock_index < len(locks) and locks[lock_index]['end_m'] <= start:
            lock_index += 1
        lock = locks[lock_index] if lock_index < len(locks) and locks[lock_index]['start_m'] <= start < locks[lock_index]['end_m'] else None
        if lock is None:
            high = base_partial(index, (end - cell.start_m) / cell.distance_m)
            low = base_partial(index, (start - cell.start_m) / cell.distance_m)
        else:
            fi = index - lock['fragments'][0][0]
            _, left, right = lock['fragments'][fi]
            high = lock['partial'](fi, (end - left) / (right - left))
            low = lock['partial'](fi, (start - left) / (right - left))
        duration = high - low
        if not math.isfinite(duration) or duration <= 128 * sys.float_info.epsilon * max(1.0, abs(high), abs(low)):
            fail('manual_numeric_support', '人工配速時間超出可計算範圍。')
        # Neumaier compensated prefix is O(N), not a fresh O(N) fsum for every
        # boundary. Retain small increments without quadratic route work.
        next_sum = total_sum + duration
        compensation += ((total_sum - next_sum) + duration) if abs(total_sum) >= abs(duration) else ((duration - next_sum) + total_sum)
        total_sum = next_sum
        prefix = total_sum + compensation
        if not math.isfinite(prefix):
            fail('manual_numeric_support', '累計時間超出可計算範圍。')
        moving_at[end] = prefix
        cell_times[index].append(duration)
        fragments.append({'start_m': start, 'end_m': end, 'cell_index': index,
                          'moving_s': duration, 'lock_id': lock['id'] if lock else None})
    result = copy.deepcopy(baseline)
    moving = moving_at[geometry.distance_m]
    stops = baseline['stops_s']
    elapsed = math.fsum((moving, stops))
    if not math.isfinite(elapsed) or elapsed > 604800:
        fail('manual_numeric_support', '重算完賽時間超出 7 天計算範圍。')
    for row in sections:
        high, low = moving_at[row['end_m']], moving_at[row['start_m']]
        if high - low <= 128 * sys.float_info.epsilon * max(1.0, abs(high), abs(low)):
            fail('manual_numeric_support', '此段累計時間差太小，無法可靠重算。')
    rows, warnings = [], []
    prev_distance, prev_moving, prev_display_departure, stops_before = 0.0, 0.0, 0, 0.0
    for identity, cp in zip(ids, baseline['checkpoints']):
        prefix = moving_at[cp['distance_m']]
        arrival, departure = prefix + stops_before, prefix + stops_before + cp['stop_s']
        duration, distance = prefix - prev_moving, cp['distance_m'] - prev_distance
        margin = None if cp['cutoff_elapsed_s'] is None else cp['cutoff_elapsed_s'] - (arrival if cp['cutoff_kind'] == 'arrival' else departure)
        if margin is not None and margin < 0:
            warnings.append({'code': 'cutoff_missed', 'checkpoint': cp['name'], 'message': f'{cp["name"]} 的目前配速時間晚於關門。', 'margin_s': margin})
        ad, dd = _round_second(arrival), _round_second(departure)
        rows.append({**cp, 'id': identity, 'leg_distance_m': distance, 'moving_s': duration,
                     'pace_s_per_km': duration / distance * 1000,
                     'arrival_elapsed_s': arrival, 'departure_elapsed_s': departure,
                     'cutoff_margin_s': margin, 'cutoff_status': 'not_provided' if margin is None else ('missed' if margin < 0 else 'within_plan'),
                     'display': {'moving_s': ad - prev_display_departure, 'stop_s': dd - ad,
                                 'arrival_elapsed_s': ad, 'departure_elapsed_s': dd}})
        prev_distance, prev_moving, prev_display_departure = cp['distance_m'], prefix, dd
        stops_before += cp['stop_s']
    prefix = 0.0
    for index, row in enumerate(result['canonical_timeline']):
        row['moving_s'] = math.fsum(cell_times[index])
        prefix += row['moving_s']
        row['cumulative_moving_s'] = prefix
    result.update({'schema_version': 'trail-manual-clock/1.0', 'manual_version': VERSION,
                   'purpose': 'manual_pace_clock_preview', 'initial_target_elapsed_s': baseline['target_elapsed_s'],
                   'target_elapsed_s': elapsed, 'revised_finish_elapsed_s': elapsed,
                   'moving_s': moving, 'stops_s': stops, 'display_target_elapsed_s': _round_second(elapsed),
                   'exact_conservation_error_s': math.fsum((moving, stops)) - elapsed,
                   'checkpoints': rows, 'warnings': warnings, 'downstream_response': response_status(),
                   'manual_session': {'binding': binding, 'owner_revision': owner_revision,
                                      'checkpoint_ids': ids, 'raw_sections': sections,
                                      'locks': [{key: value for key, value in lock.items() if key not in {'fragments', 'times', 'partial'}} for lock in locks],
                                      'fragments': fragments, 'mutates_input': False,
                                      'target_rebalanced': False, 'parameter_refit': False},
                   'raw_section_times': [{'id': row['id'], 'start_m': row['start_m'], 'end_m': row['end_m'],
                                          'moving_s': moving_at[row['end_m']] - moving_at[row['start_m']]} for row in sections]})
    result['constraints'].update({'all_provided_cutoffs_within_plan': not warnings if any(cp['cutoff_elapsed_s'] is not None for cp in rows) else None,
                                  'cutoff_guarantee': False,
                                  'exact_bounds_satisfied': all(row['minimum_s'] <= row['moving_s'] and (row['maximum_s'] is None or row['moving_s'] <= row['maximum_s']) for row in result['canonical_timeline'])})
    result['assumptions'].insert(0, response_status()['message'])
    result['assumptions'].insert(1, '原目標僅供初始分配；人工配速後完賽時間可改變，不自動重配回原目標。')
    return result


def prepare_from_gpx(data, settings, raw_sections, checkpoint_ids, owner_revision):
    validate_gpx_admission(data)
    return prepare_geometry(build_geometry(parse_gpx(data)), settings, raw_sections, checkpoint_ids, owner_revision)


def recalculate_from_gpx(data, settings, raw_sections, checkpoint_ids, owner_revision, expected_binding, locks):
    validate_gpx_admission(data)
    return recalculate_geometry(build_geometry(parse_gpx(data)), settings, raw_sections, checkpoint_ids, owner_revision, expected_binding, locks)


def handle_request(operation, request_json):
    try:
        request = json.loads(request_json)
        fields = {'gpx_b64', 'settings', 'raw_sections', 'checkpoint_ids', 'owner_revision'}
        if operation == 'manual_pace_recalculate':
            fields |= {'expected_binding', 'locks'}
        elif operation != 'manual_pace_prepare':
            fail('invalid_operation', '不支援的人工配速操作。')
        if not isinstance(request, dict) or set(request) != fields or not isinstance(request.get('gpx_b64'), str):
            fail('invalid_manual_schema', '人工配速請求格式有誤。')
        try:
            data = base64.b64decode(request['gpx_b64'], validate=True)
        except (ValueError, TypeError, binascii.Error):
            fail('invalid_file', 'GPX 傳輸編碼有誤。')
        args = [data, request['settings'], request['raw_sections'], request['checkpoint_ids'], request['owner_revision']]
        result = recalculate_from_gpx(*args, request['expected_binding'], request['locks']) if operation == 'manual_pace_recalculate' else prepare_from_gpx(*args)
        return json.dumps({'ok': True, 'result': result}, ensure_ascii=False, allow_nan=False, separators=(',', ':'))
    except InputError as error:
        return json.dumps({'ok': False, 'error': {'code': error.code, 'message': str(error)}}, ensure_ascii=False)
    except (ValueError, TypeError, UnicodeError, OverflowError):
        return json.dumps({'ok': False, 'error': {'code': 'invalid_manual_schema', 'message': '人工配速資料格式有誤。'}}, ensure_ascii=False)
