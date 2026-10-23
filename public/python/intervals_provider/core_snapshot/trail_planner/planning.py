"""Fixed elapsed-goal allocation with explicit assumptions and bounded times."""
from bisect import bisect_right
import math
import copy
from dataclasses import asdict
from .gpx import InputError, finite_number
from .geometry import Geometry, GEOMETRY_VERSION

MODEL_VERSION = 'minetti-running-goal-f1-cap-v1'
SCHEMA_VERSION = 'trail-plan/1.0'
REGISTRY = {
    'model_version': MODEL_VERSION,
    'purpose': 'goal_scenario_allocation',
    'calibration_status': 'not_calibrated',
    'source': 'https://doi.org/10.1152/japplphysiol.01177.2001',
    'grade_domain': [-.45, .45],
    'coefficients_descending': [155.4, -30.4, -43.3, 46.3, 19.5, 3.6],
    'cost_unit': 'J/(kg*m)',
    'notes': ['Running treadmill reference; not a walking-cost or technical-trail model.',
              'No athlete power, fitness, probability or prediction is inferred from a goal.'],
}

def _number(settings, key, default=None):
    value = settings.get(key, default)
    if isinstance(value, bool):
        raise InputError('invalid_number', f'{key} 不接受布林值。')
    return finite_number(value, key)

def _safe_sum(values):
    try:
        return math.fsum(values)
    except OverflowError:
        return math.inf

def allocate_bounded(weights, lower, upper, total):
    """t = clip(lambda*w,l,u), no renormalization after clipping.

    General utility with finite lower bounds and finite or +inf upper bounds.
    Floating-point internal times, not quantized display times, obey the bounds.
    """
    if not weights or not len(weights) == len(lower) == len(upper):
        raise InputError('invalid_bounds', '權重與時間上下界長度必須相同且非空。')
    values = [*weights, *lower, total]
    if any(isinstance(x, bool) or not isinstance(x, (int, float)) or not math.isfinite(x) for x in values):
        raise InputError('invalid_bounds', '權重、下界與目標必須是有限數字。')
    if any(w <= 0 for w in weights):
        raise InputError('invalid_weights', '每段權重必須大於零。')
    if any(isinstance(u, bool) or not isinstance(u, (int, float)) or math.isnan(u) or u == -math.inf for u in upper):
        raise InputError('invalid_bounds', '上界只能是有限數字或正無限值。')
    if any(l < 0 or l > u for l, u in zip(lower, upper)):
        raise InputError('invalid_bounds', '時間上下界必須滿足 0 ≤ 下界 ≤ 上界。')
    try:
        low_sum, high_sum = math.fsum(lower), math.fsum(upper)
    except OverflowError:
        raise InputError('invalid_bounds', '時間上下界超出可計算範圍。') from None
    if total < low_sum or total > high_sum:
        raise InputError('infeasible_target', f'移動時間超出速度限制允許的範圍（至少 {low_sum:.1f} 秒）。')
    if total == low_sum:
        return list(lower)
    if total == high_sum:
        return list(upper)
    # Scaling preserves allocation while avoiding overflow of sum(weights).
    largest = max(weights)
    w = [v / largest for v in weights]
    if min(w) <= 0:
        raise InputError('invalid_weights', '權重尺度差異超出浮點計算範圍。')
    def clipped(lam):
        return [min(u, max(l, lam * v)) for v, l, u in zip(w, lower, upper)]
    left, right = 0.0, max(1.0, total)
    for _ in range(1024):
        if _safe_sum(clipped(right)) >= total:
            break
        right *= 2
        if not math.isfinite(right):
            raise InputError('invalid_weights', '權重尺度差異超出可求解範圍。')
    else:
        raise InputError('allocation_failed', '無法收斂至目標時間。')
    for _ in range(160):
        mid = left + (right - left) / 2
        if mid == left or mid == right:
            break
        if _safe_sum(clipped(mid)) < total:
            left = mid
        else:
            right = mid
    result = clipped(left + (right - left) / 2)
    if any(not math.isfinite(t) for t in result):
        raise InputError('allocation_failed', '結果超出有限數值範圍。')
    residual = total - math.fsum(result)
    # Correct numerical residue only within available slack. Never normalize
    # all times, which would violate a binding speed limit.
    for i in sorted(range(len(result)), key=lambda j: w[j], reverse=True):
        if residual == 0:
            break
        change = min(upper[i] - result[i], max(lower[i] - result[i], residual))
        result[i] += change
        residual = total - math.fsum(result)
    if any(not math.isfinite(t) for t in result) or not math.isfinite(residual) or abs(residual) > 1e-8 * max(1.0, total) or any(t < l or t > u for t, l, u in zip(result, lower, upper)):
        raise InputError('allocation_failed', '數值誤差超出可接受範圍。')
    return result

def running_cost(grade):
    # Grade is rise/horizontal distance: .1 is 10%, never 10.
    value = 0.0
    for c in REGISTRY['coefficients_descending']:
        value = value * grade + c
    return value

def _fatigue_integral(beta, q0, dq, base_total):
    if beta == 0:
        return base_total * dq
    return base_total * math.exp(beta * q0) * math.expm1(beta * dq) / beta

def _clipped_exponential_integral(a, k, lower, upper, fraction=1.0):
    """Integral over x in [0,f] of clip(a*exp(k*x),L,U), k>=0.

    L and U are whole-cell constant-speed times, so this bounds every
    subinterval, not merely the average speed of the complete cell.
    """
    f = min(1.0, max(0.0, fraction))
    if a <= 0:
        return lower * f
    if k == 0:
        return min(upper, max(lower, a)) * f
    log_a = math.log(a)
    cross_lower = (math.log(lower) - log_a) / k if lower > 0 else -math.inf
    cross_upper = (math.log(upper) - log_a) / k if math.isfinite(upper) else math.inf
    low_end = min(f, max(0.0, cross_lower))
    free_start = low_end
    free_end = max(free_start, min(f, max(0.0, cross_upper)))
    value = lower * low_end
    if free_end > free_start:
        value += a * math.exp(k * free_start) * math.expm1(k * (free_end - free_start)) / k
    if cross_upper < f:
        value += upper * (f - max(0.0, cross_upper))
    # Boundary residue must never produce an integrated time outside the
    # corresponding partial bounds.
    return min(upper * f, max(lower * f, value)) if f > 0 else 0.0


def _allocate_continuous(base, q_start, q_steps, beta, lower, upper, total):
    if any(l > u for l, u in zip(lower, upper)):
        raise InputError('invalid_speed_bounds', '最低移動速度高於部分上坡徒步速度上限，請調整速度設定。')
    lower_sum, upper_sum = math.fsum(lower), math.fsum(upper)
    if total < lower_sum or total > upper_sum:
        raise InputError('infeasible_target', f'移動時間超出速度限制允許的範圍（至少 {lower_sum:.1f} 秒）。')
    if total == lower_sum:
        return list(lower), lambda i, f: lower[i] * f
    if total == upper_sum:
        return list(upper), lambda i, f: upper[i] * f
    initial = [b * math.exp(beta * q) for b, q in zip(base, q_start)]
    rates = [beta * dq for dq in q_steps]
    def partial(lam, i, f=1.0):
        return _clipped_exponential_integral(lam * initial[i], rates[i], lower[i], upper[i], f)
    def values(lam):
        return [partial(lam, i) for i in range(len(base))]
    left, right = 0.0, max(1.0, total / math.fsum(base))
    while math.fsum(values(right)) < total:
        right *= 2
    for _ in range(100):
        mid = left + (right - left) / 2
        if mid == left or mid == right:
            break
        if math.fsum(values(mid)) < total:
            left = mid
        else:
            right = mid
    lam = left + (right - left) / 2
    times = values(lam)
    error = math.fsum(times) - total
    if abs(error) > 1e-9 * max(1, total):
        raise InputError('allocation_failed', '連續速度界限求解未收斂。')
    # Keep the exact same pointwise-clipped curve for checkpoints. No ad-hoc
    # post-solver scaling or CP-dependent correction is permitted.
    return times, lambda i, f: partial(lam, i, f)

def _round_second(t):
    return math.floor(t + .5)

def create_plan(geometry: Geometry, settings: dict):
    if not isinstance(settings, dict):
        raise InputError('invalid_settings', '計畫設定必須是物件。')
    allowed = {'target_elapsed_s', 'checkpoints', 'fatigue_end_multiplier', 'max_speed_m_s',
               'min_speed_m_s', 'walk_uphill_grade', 'walk_max_speed_m_s',
               'allow_flat_missing_elevation', 'allow_grade_clamp'}
    unknown = set(settings) - allowed
    if unknown:
        raise InputError('unknown_settings', f'不支援的設定：{", ".join(sorted(unknown))}。目標分配不接受賽後能力欄位。')
    for key in ('allow_flat_missing_elevation', 'allow_grade_clamp'):
        if key in settings and not isinstance(settings[key], bool):
            raise InputError('invalid_settings', f'{key} 必須是布林值。')
    if geometry.blocked or not geometry.cells:
        raise InputError('route_blocked', '路線有斷段、跳點或無有效距離，請先修正 GPX。')
    if not geometry.elevation_complete and not settings.get('allow_flat_missing_elevation', False):
        raise InputError('missing_elevation_consent', '沒有完整海拔；請明確同意全程平路假設，或補齊路線海拔。')
    out_domain = any(c.grade is not None and abs(c.grade) > .45 + 1e-10 for c in geometry.cells)
    if out_domain and not settings.get('allow_grade_clamp', False):
        raise InputError('grade_out_of_domain', '坡度超出 ±45% 研究範圍。請修正海拔，或在進階設定明確同意截斷情境。')
    target = _number(settings, 'target_elapsed_s')
    if not 0 < target <= 604800:
        raise InputError('invalid_target', '目標完賽時間須大於零且不超過 7 天。')
    fatigue = _number(settings, 'fatigue_end_multiplier', 1.0)
    if not 1 <= fatigue <= 3:
        raise InputError('invalid_fatigue', '末端／起點局部耗時倍率須為 1 至 3。')
    max_speed = _number(settings, 'max_speed_m_s', 6.0)
    min_speed = _number(settings, 'min_speed_m_s', 0.0)
    walk_grade = _number(settings, 'walk_uphill_grade', .15)
    walk_cap = _number(settings, 'walk_max_speed_m_s', 1.0)
    if not 0 < max_speed <= 15 or not 0 <= min_speed <= max_speed:
        raise InputError('invalid_speed', '最快速度须大於零且不超過 15 m/s；最低移動速度須介於零與最快速度之間。')
    if not 0 <= walk_grade <= .45 or not 0 < walk_cap <= max_speed:
        raise InputError('invalid_walk', '徒步坡度門檻須為 0 至 45%，徒步速度上限須大於零且不高於最快速度。')
    checkpoints = settings.get('checkpoints', [])
    if not isinstance(checkpoints, list) or len(checkpoints) > 100:
        raise InputError('invalid_checkpoints', '補給站须為清單且不超過 100 站。')
    cps, previous = [], 0.0
    for raw in checkpoints:
        if not isinstance(raw, dict) or set(raw) - {'name', 'distance_m', 'stop_s', 'cutoff_elapsed_s', 'cutoff_kind'}:
            raise InputError('invalid_checkpoints', '補給站欄位不完整或包含未知欄位。')
        d = _number(raw, 'distance_m')
        stop = _number(raw, 'stop_s', 0)
        if not previous < d <= geometry.distance_m:
            raise InputError('invalid_checkpoint_distance', '補給站沿線里程須嚴格遞增，且介於起點與終點之間。')
        if not 0 <= stop <= 86400:
            raise InputError('invalid_stop', '每站停留時間須為 0 至 86,400 秒。')
        if d == geometry.distance_m and stop != 0:
            raise InputError('finish_stop', '終點不計停留時間；目標是到達終點的完賽時間。')
        name = raw.get('name', f'CP{len(cps)+1}')
        if not isinstance(name, str) or not name.strip() or len(name) > 80:
            raise InputError('invalid_checkpoint_name', '補給站名稱須為 1 至 80 字。')
        cutoff = None
        if raw.get('cutoff_elapsed_s') is not None:
            cutoff = _number(raw, 'cutoff_elapsed_s')
            if not 0 <= cutoff <= 604800:
                raise InputError('invalid_cutoff', '關門時間須為起跑後 0 至 7 天。')
        kind = raw.get('cutoff_kind', 'departure')
        if kind not in {'arrival', 'departure'}:
            raise InputError('invalid_cutoff_kind', '關門依據须選到站或離站。')
        cps.append({'name': name.strip(), 'distance_m': d, 'stop_s': stop,
                    'cutoff_elapsed_s': cutoff, 'cutoff_kind': kind})
        previous = d
    if not cps or cps[-1]['distance_m'] != geometry.distance_m:
        cps.append({'name': '終點', 'distance_m': geometry.distance_m, 'stop_s': 0,
                    'cutoff_elapsed_s': None, 'cutoff_kind': 'arrival'})
    stop_total = math.fsum(cp['stop_s'] for cp in cps)
    moving = target - stop_total
    if moving <= 0:
        raise InputError('stops_exceed_target', '停站總時間必須少於目標完賽時間。')
    beta = math.log(fatigue)
    base, lower, upper, modes = [], [], [], []
    for c in geometry.cells:
        grade = 0 if c.grade is None else min(.45, max(-.45, c.grade))
        base.append(c.distance_m * running_cost(grade) / running_cost(0))
        walk = c.grade is not None and c.grade >= walk_grade - 1e-10
        cap = min(max_speed, walk_cap) if walk else max_speed
        lower.append(c.distance_m / cap)
        upper.append(c.distance_m / min_speed if min_speed > 0 else math.inf)
        modes.append('walk_cap_scenario' if walk else 'run_scenario')
    base_total = math.fsum(base)
    weights, q_start, q_steps, work = [], [], [], 0.0
    for b in base:
        q0, dq = work / base_total, b / base_total
        q_start.append(q0)
        q_steps.append(dq)
        weights.append(_fatigue_integral(beta, q0, dq, base_total))
        work += b
    times, rate_at = _allocate_continuous(base, q_start, q_steps, beta, lower, upper, moving)
    cell_ends = [c.end_m for c in geometry.cells]
    time_prefix = [0.0]
    for t in times:
        time_prefix.append(time_prefix[-1] + t)
    def time_at(distance):
        if distance >= geometry.distance_m:
            return moving
        if distance <= 0:
            return 0.0
        i = bisect_right(cell_ends, distance)
        c = geometry.cells[i]
        f = (distance - c.start_m) / c.distance_m
        partial = rate_at(i, f)
        return time_prefix[i] + partial
    rows, warnings = [], []
    prev_distance, prev_moving, stops_before, prev_display_depart = 0.0, 0.0, 0.0, 0
    for cp in cps:
        cumul_moving = time_at(cp['distance_m'])
        arrival = cumul_moving + stops_before
        departure = arrival + cp['stop_s']
        duration = cumul_moving - prev_moving
        leg_distance = cp['distance_m'] - prev_distance
        margin = None
        if cp['cutoff_elapsed_s'] is not None:
            checked = arrival if cp['cutoff_kind'] == 'arrival' else departure
            margin = cp['cutoff_elapsed_s'] - checked
            if margin < 0:
                warnings.append({'code': 'cutoff_missed', 'checkpoint': cp['name'],
                                 'message': f'{cp["name"]} 的{("到站" if cp["cutoff_kind"] == "arrival" else "離站")}計畫晚於關門。總時間可分配不保證每站能過關門。',
                                 'margin_s': margin})
        arrival_display, depart_display = _round_second(arrival), _round_second(departure)
        rows.append({**cp, 'leg_distance_m': leg_distance, 'moving_s': duration,
                     'pace_s_per_km': duration / (leg_distance / 1000),
                     'arrival_elapsed_s': arrival, 'departure_elapsed_s': departure,
                     'cutoff_margin_s': margin, 'cutoff_status': 'not_provided' if margin is None else ('missed' if margin < 0 else 'within_plan'),
                     'display': {'moving_s': arrival_display - prev_display_depart,
                                 'stop_s': depart_display - arrival_display,
                                 'arrival_elapsed_s': arrival_display, 'departure_elapsed_s': depart_display}})
        stops_before += cp['stop_s']
        prev_distance, prev_moving, prev_display_depart = cp['distance_m'], cumul_moving, depart_display
    assumptions = [
        '這是指定完賽目標的時間分配情境，尚未估計你的能力或達標機率。',
        '距離是經平滑海拔建立的沿線三維行進里程；補給站位置須使用同一里程尺度，可能與主辦標示里程有差異。',
        '坡度成本採 Minetti 跑台跑步參考；尚未以外部越野賽事校準。路面、天氣與個人差異未知。',
        '上坡徒步只代表使用者設定的速度上限情境；未使用或驗證步行代謝成本。',
        '末端／起點局部耗時倍率作用於累積基礎成本比例，再配合總時間與速度限制；不等於整段實際慢同一百分比。',
        '所有上下界以未四捨五入秒數驗算。顯示採累計時間四捨五入後相減，總秒數守恆，單段顯示可偏差不到 1 秒且不作精確界限證明。',
        '關門提示只檢查目前情境，尚未自動調整配速以保證全站通過。',
    ]
    if not geometry.elevation_complete:
        assumptions.append('因缺海拔，已明確採全程平路假設；爬升與坡度仍標為未知。')
    if out_domain:
        assumptions.append('已明確同意將超域坡度截斷至 ±45%；陡坡结果可信度未知。')
    normalized = {'target_elapsed_s': target, 'fatigue_end_multiplier': fatigue,
                  'max_speed_m_s': max_speed, 'min_speed_m_s': min_speed,
                  'walk_uphill_grade': walk_grade, 'walk_max_speed_m_s': walk_cap,
                  'allow_flat_missing_elevation': settings.get('allow_flat_missing_elevation', False),
                  'allow_grade_clamp': settings.get('allow_grade_clamp', False), 'checkpoints': cps}
    result = {'schema_version': SCHEMA_VERSION, 'model_version': MODEL_VERSION,
              'geometry_version': GEOMETRY_VERSION, 'purpose': 'goal_scenario_allocation',
              'uncertainty_kind': 'not_estimated', 'ability_prediction': 'not_implemented',
              'in_domain': not out_domain and geometry.elevation_complete,
              'domain_status': {'running_grade_reference': 'in_domain' if not out_domain and geometry.elevation_complete else 'clamped_or_unknown',
                                'trail_surface': 'unknown', 'athlete_calibration': 'not_calibrated',
                                'walking_cost': 'not_implemented'},
              'assumptions': assumptions, 'quality': list(geometry.quality), 'warnings': warnings,
              'input': normalized, 'model_registry': copy.deepcopy(REGISTRY),
              'route': geometry.summary(), 'geometry_snapshot': [asdict(c) for c in geometry.cells],
              'target_elapsed_s': target, 'moving_s': moving, 'stops_s': stop_total,
              'exact_conservation_error_s': math.fsum(times) + stop_total - target,
              'display_target_elapsed_s': _round_second(target), 'checkpoints': rows,
              'constraints': {'minimum_moving_s': math.fsum(lower),
                              'maximum_moving_s': None if min_speed == 0 else math.fsum(upper),
                              'exact_bounds_satisfied': all(l <= t <= u for t, l, u in zip(times, lower, upper)),
                              'continuous_speed_bounds_satisfied': True,
                              'cutoff_guarantee': False,
                              'cutoff_checks_supplied': sum(cp['cutoff_elapsed_s'] is not None for cp in cps),
                              'all_provided_cutoffs_within_plan': not warnings if any(cp['cutoff_elapsed_s'] is not None for cp in cps) else None},
              'canonical_timeline': [{'start_m': c.start_m, 'end_m': c.end_m, 'moving_s': t,
                                      'cumulative_moving_s': time_prefix[i+1], 'weight': weights[i],
                                      'minimum_s': lower[i], 'maximum_s': None if math.isinf(upper[i]) else upper[i],
                                      'mode': modes[i]} for i, (c, t) in enumerate(zip(geometry.cells, times))]}
    return result
