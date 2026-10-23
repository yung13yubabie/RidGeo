"""Explicit whole-route hiking-reference goal allocation; no personal prediction.

Independent implementation of Campbell et al. (2022), Eq.1/Table A3 p50.
Horizontal m/s, signed degrees. Existing canonical geometry is never altered.
"""
from bisect import bisect_right
from dataclasses import asdict
import copy
import math
from trail_planner.gpx import InputError
from trail_planner.geometry import GEOMETRY_VERSION
from trail_planner.planning import _number, _round_second, _allocate_continuous

ALLOCATION_MODEL = 'campbell2022-hiking-reference-v1'
MODEL_VERSION = 'campbell2022-hiking-reference-goal-v1'
GRADE_LIMIT = math.tan(math.radians(30.0))
REGISTRY = {
    'model_version': MODEL_VERSION, 'purpose': 'goal_scenario_allocation',
    'calibration_status': 'not_calibrated',
    'source': 'https://doi.org/10.1016/j.compenvurbsys.2022.101866',
    'equation': 'Eq.1/Table A3 p50', 'population': 'hiking_on_trails',
    'coefficients': {'a': -1.4579, 'b': 22.0787, 'c': 76.3271, 'd': .0525, 'e': -.00032002},
    'angle_domain_degrees': [-30.0, 30.0], 'grade_domain': [-GRADE_LIMIT, GRADE_LIMIT],
    'rate_unit': 'horizontal_m/s', 'weight_unit': 's',
    'weight_definition': 'horizontal_m / rate(atan(grade)*180/pi)',
    'sampled_horizontal_length_m': [2824, 17882],
    'sampled_length_is_input_gate': False,
    'notes': ['Target normalization is not a population-median or personal finish prediction.',
              'No running cost, running fatigue, technical-surface or recovery coefficients.',
              'Source study used 1 m LiDAR terrain and snapped trails; canonical GPX preprocessing differs.'],
}


def is_hiking(settings):
    return isinstance(settings, dict) and settings.get('allocation_model') == ALLOCATION_MODEL


def reference_rate(grade):
    if isinstance(grade, bool) or not isinstance(grade, (float, int)) or not math.isfinite(grade) or not -GRADE_LIMIT <= grade <= GRADE_LIMIT:
        raise InputError('hiking_grade_out_of_domain', '徒步參考需全程坡度在 ±30° 內；未截斷或外推。')
    theta = math.degrees(math.atan(grade))
    a, b, c, d, e = (-1.4579, 22.0787, 76.3271, .0525, -.00032002)
    rate = c / (math.pi * b * (1 + ((theta - a) / b) ** 2)) + d + e * theta
    if not math.isfinite(rate) or rate <= 0:
        raise InputError('hiking_invalid_rate', '徒步參考速度無法計算。')
    return rate


def reference_curve(geometry, settings, moving):
    base, lower, upper = [], [], []
    maximum, minimum = settings['max_speed_m_s'], settings['min_speed_m_s']
    previous = 0.0
    for cell in geometry.cells:
        values = (cell.start_m, cell.end_m, cell.horizontal_m, cell.grade)
        if any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) for v in values) or cell.start_m != previous or cell.end_m <= previous or cell.horizontal_m <= 0:
            raise InputError('hiking_invalid_geometry', '徒步參考需要連續、有限且海拔完整的路線。')
        rate = reference_rate(cell.grade)
        base.append(cell.horizontal_m / rate)
        lower.append(cell.distance_m / maximum if maximum is not None else 0.0)
        upper.append(cell.distance_m / minimum if minimum > 0 else math.inf)
        previous = cell.end_m
    if not base or previous != geometry.distance_m:
        raise InputError('hiking_invalid_geometry', '徒步參考需要完整路線。')
    total = math.fsum(base)
    work, starts, steps = 0.0, [], []
    for weight in base:
        starts.append(work / total)
        steps.append(weight / total)
        work += weight
    # beta=0: no running fatigue, including after manual edits and CP splits.
    times, partial = _allocate_continuous(base, starts, steps, 0.0, lower, upper, moving)
    return base, starts, steps, 0.0, lower, upper, times, partial


def create_hiking_plan(geometry, settings):
    if not isinstance(settings, dict):
        raise InputError('invalid_settings', '徒步參考設定須為物件。')
    allowed = {'allocation_model', 'hiking_consent', 'target_elapsed_s', 'checkpoints', 'max_speed_m_s', 'min_speed_m_s'}
    if set(settings) - allowed or not is_hiking(settings):
        raise InputError('invalid_hiking_settings', '徒步參考不接受跑步衰退、截斷或平路替代設定。')
    if settings.get('hiking_consent') is not True:
        raise InputError('hiking_consent_required', '請確認採用全程在步道上徒步的參考分配。')
    if geometry.blocked or not geometry.cells:
        raise InputError('route_blocked', '路線有斷段、跳點或無有效距離，請先修正 GPX。')
    if not geometry.elevation_complete:
        raise InputError('hiking_missing_elevation', '徒步參考需要完整海拔；不以平路替代未知坡度。')
    target = _number(settings, 'target_elapsed_s')
    if not 0 < target <= 604800:
        raise InputError('invalid_target', '目標完賽時間須大於零且不超過 7 天。')
    maximum = None if settings.get('max_speed_m_s') is None else _number(settings, 'max_speed_m_s')
    minimum = _number(settings, 'min_speed_m_s', 0.0)
    if maximum is not None and not 0 < maximum <= 15 or not 0 <= minimum <= 15 or maximum is not None and minimum > maximum:
        raise InputError('invalid_speed', '請確認自行指定的移動速度上下界。')
    raw_cps = settings.get('checkpoints', [])
    if not isinstance(raw_cps, list) or len(raw_cps) > 100:
        raise InputError('invalid_checkpoints', '補給站須為清單且不超過 100 站。')
    cps, previous = [], 0.0
    for raw in raw_cps:
        if not isinstance(raw, dict) or set(raw) - {'name', 'distance_m', 'stop_s', 'cutoff_elapsed_s', 'cutoff_kind'} or 'stop_s' not in raw:
            raise InputError('invalid_checkpoints', '每站需明確填寫停留；未知不能視為零。')
        distance, stop = _number(raw, 'distance_m'), _number(raw, 'stop_s')
        if not previous < distance <= geometry.distance_m:
            raise InputError('invalid_checkpoint_distance', '補給站沿線里程須嚴格遞增，且介於起點與終點之間。')
        if not 0 <= stop <= 86400:
            raise InputError('invalid_stop', '每站停留時間須為 0 至 86,400 秒。')
        if distance == geometry.distance_m and stop != 0:
            raise InputError('finish_stop', '終點不計停留時間。')
        name = raw.get('name', f'CP{len(cps)+1}')
        if not isinstance(name, str) or not name.strip() or len(name) > 80:
            raise InputError('invalid_checkpoint_name', '補給站名稱須為 1 至 80 字。')
        cutoff = None if raw.get('cutoff_elapsed_s') is None else _number(raw, 'cutoff_elapsed_s')
        if cutoff is not None and not 0 <= cutoff <= 604800:
            raise InputError('invalid_cutoff', '關門時間須為起跑後 0 至 7 天。')
        kind = raw.get('cutoff_kind', 'departure')
        if kind not in {'arrival', 'departure'}:
            raise InputError('invalid_cutoff_kind', '關門依據須選到站或離站。')
        cps.append({'name': name.strip(), 'distance_m': distance, 'stop_s': stop, 'cutoff_elapsed_s': cutoff, 'cutoff_kind': kind})
        previous = distance
    if not cps or cps[-1]['distance_m'] != geometry.distance_m:
        cps.append({'name': '終點', 'distance_m': geometry.distance_m, 'stop_s': 0, 'cutoff_elapsed_s': None, 'cutoff_kind': 'arrival'})
    stops = math.fsum(cp['stop_s'] for cp in cps)
    moving = target - stops
    if moving <= 0:
        raise InputError('stops_exceed_target', '停站總時間必須少於目標完賽時間。')
    normalized = {'allocation_model': ALLOCATION_MODEL, 'hiking_consent': True, 'target_elapsed_s': target,
                  'max_speed_m_s': maximum, 'min_speed_m_s': minimum, 'checkpoints': cps}
    base, _, _, _, lower, upper, times, partial = reference_curve(geometry, normalized, moving)
    prefix = [0.0]
    for duration in times:
        prefix.append(prefix[-1] + duration)
    ends = [cell.end_m for cell in geometry.cells]
    def time_at(distance):
        if distance >= geometry.distance_m:
            return moving
        index = bisect_right(ends, distance)
        cell = geometry.cells[index]
        return prefix[index] + partial(index, (distance - cell.start_m) / cell.distance_m)
    rows, warnings = [], []
    prev_distance, prev_moving, prior_stops, display_departure = 0.0, 0.0, 0.0, 0
    for cp in cps:
        cumul = time_at(cp['distance_m'])
        arrival, departure = cumul + prior_stops, cumul + prior_stops + cp['stop_s']
        duration, distance = cumul - prev_moving, cp['distance_m'] - prev_distance
        margin = None if cp['cutoff_elapsed_s'] is None else cp['cutoff_elapsed_s'] - (arrival if cp['cutoff_kind'] == 'arrival' else departure)
        if margin is not None and margin < 0:
            warnings.append({'code': 'cutoff_missed', 'checkpoint': cp['name'], 'message': f'{cp["name"]} 的計畫晚於關門；目標可分配不保證通過關門。', 'margin_s': margin})
        ad, dd = _round_second(arrival), _round_second(departure)
        rows.append({**cp, 'leg_distance_m': distance, 'moving_s': duration, 'pace_s_per_km': duration / distance * 1000,
                     'arrival_elapsed_s': arrival, 'departure_elapsed_s': departure, 'cutoff_margin_s': margin,
                     'cutoff_status': 'not_provided' if margin is None else ('missed' if margin < 0 else 'within_plan'),
                     'display': {'moving_s': ad - display_departure, 'stop_s': dd - ad, 'arrival_elapsed_s': ad, 'departure_elapsed_s': dd}})
        prev_distance, prev_moving, prior_stops, display_departure = cp['distance_m'], cumul, prior_stops + cp['stop_s'], dd
    beyond = not 2824 <= geometry.horizontal_distance_m <= 17882
    assumptions = ['全程採 Campbell 2022 徒步參考形狀，依指定目標縮放；不是個人完賽預估或可達成保證。',
                   '使用目前 25 m 網格／50 m 平滑路線；來源海拔與短陡坡仍有不確定性，不能視為實測地面。',
                   '原研究採步道與 LiDAR 高程；未驗證本路線、技術路面、天候或個人差異。',
                   '未加入跑步衰退或停站恢復；已知停留只計一次。自行指定的限速僅為情境限制。',
                   '補站使用目前三維沿線里程；顯示秒數依累計四捨五入，精確秒數保留於匯出。']
    if beyond:
        assumptions.append('路線長度超出原研究約 2.8–17.9 km 的觀測範圍；這是外推限制，不是距離禁用門檻。')
    return {'schema_version': 'trail-plan/1.0', 'model_version': MODEL_VERSION, 'geometry_version': GEOMETRY_VERSION,
            'purpose': 'goal_scenario_allocation', 'uncertainty_kind': 'not_estimated', 'ability_prediction': 'not_implemented',
            'in_domain': True, 'domain_status': {'hiking_angle_reference': 'in_domain', 'running_grade_reference': 'not_applied',
                                               'trail_surface': 'unknown', 'athlete_calibration': 'not_calibrated', 'walking_cost': 'not_applied'},
            'assumptions': assumptions, 'quality': list(geometry.quality), 'warnings': warnings,
            'input': normalized, 'model_registry': copy.deepcopy(REGISTRY),
            'reference_basis': {'allocation_model': ALLOCATION_MODEL, 'user_selected': True, 'on_trail_hiking_confirmed': True,
                                'source_route_sha256': geometry.route_sha256, 'geometry_sha256': geometry.geometry_sha256,
                                'geometry_version': GEOMETRY_VERSION, 'reference_moving_s': math.fsum(base),
                                'reference_total_is_finish_prediction': False, 'sampled_length_exceeded': beyond,
                                'representation_uncertainty': 'canonical_25m_grid_50m_smoothing_not_source_LiDAR_or_trail_truth',
                                'short_extremes_may_be_hidden': True},
            'route': geometry.summary(), 'geometry_snapshot': [asdict(cell) for cell in geometry.cells],
            'target_elapsed_s': target, 'moving_s': moving, 'stops_s': stops, 'exact_conservation_error_s': math.fsum(times) + stops - target,
            'display_target_elapsed_s': _round_second(target), 'checkpoints': rows,
            'constraints': {'minimum_moving_s': math.fsum(lower), 'maximum_moving_s': None if minimum == 0 else math.fsum(upper),
                            'bounds_are_user_scenarios_not_hiking_feasibility': True,
                            'exact_bounds_satisfied': all(l <= t <= u for t, l, u in zip(times, lower, upper)),
                            'continuous_speed_bounds_satisfied': True, 'cutoff_guarantee': False,
                            'cutoff_checks_supplied': sum(cp['cutoff_elapsed_s'] is not None for cp in cps),
                            'all_provided_cutoffs_within_plan': not warnings if any(cp['cutoff_elapsed_s'] is not None for cp in cps) else None},
            'canonical_timeline': [{'start_m': cell.start_m, 'end_m': cell.end_m, 'moving_s': duration,
                                    'cumulative_moving_s': prefix[i+1], 'weight': base[i], 'minimum_s': lower[i],
                                    'maximum_s': None if math.isinf(upper[i]) else upper[i], 'mode': 'hiking_reference_scenario'}
                                   for i, (cell, duration) in enumerate(zip(geometry.cells, times))]}
