"""Pure, conservative route-work ETA. No GPS matching, persistence, or I/O."""
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from math import isfinite
from numbers import Real
from typing import Optional

MODEL_VERSION = "ridgeq-route-ep/1"
ALLOWED_TIME_SOURCES = {"manual", "watch", "mobile", "timer"}


def _number(value, name, *, minimum=0):
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{name}: expected a real number, not bool")
    if not isfinite(value) or value < minimum:
        raise ValueError(f"{name}: must be finite and >= {minimum}")
    return float(value)


def milliseconds_to_seconds(milliseconds):
    """Explicit timer boundary: 3_600_000 ms is one moving hour."""
    return _number(milliseconds, "milliseconds") / 1000.0


@dataclass(frozen=True)
class RouteProgress:
    """Canonical along-route measurements, never raw GPS displacement."""
    distance_km: Optional[float]
    ascent_m: Optional[float]
    provenance: str = "canonical_route"


@dataclass(frozen=True)
class Destination:
    """Remaining route segment to the selected destination, not route maximum."""
    identifier: str
    distance_km: Optional[float]
    ascent_m: Optional[float]
    descent_m: Optional[float]
    status: str = "ahead"  # ahead, reached, passed
    provenance: str = "canonical_route"


@dataclass(frozen=True)
class MovingObservation:
    seconds: Optional[float]
    source: str  # manual, watch, mobile, timer
    elapsed_seconds: Optional[float] = None  # consistency check only, never a substitute

    @classmethod
    def from_timer_ms(cls, milliseconds, *, elapsed_ms=None):
        return cls(milliseconds_to_seconds(milliseconds), "timer",
                   None if elapsed_ms is None else milliseconds_to_seconds(elapsed_ms))


@dataclass(frozen=True)
class Scenario:
    slowdown_factor: float = 1.0  # explicit neutral baseline, not calibrated fatigue
    future_stop_seconds: Optional[float] = None  # None means unknown, not zero


@dataclass(frozen=True)
class Estimate:
    quality: str
    suppression: Optional[str]
    reasons: tuple
    eph: Optional[float] = None
    remaining_moving_seconds: Optional[float] = None
    remaining_elapsed_seconds: Optional[float] = None
    arrival_utc: Optional[str] = None
    metadata: dict = field(default_factory=dict)


def estimate(progress: RouteProgress, destination: Destination,
             moving: MovingObservation, *, scenario=None, now=None):
    """Return a fail-closed Estimate. All durations and the clock refer to now forward.

    Caller guarantees progress and moving observation cover the same current trip,
    trailhead, and measurement cutoff. This function cannot verify that alignment.
    """
    scenario = Scenario() if scenario is None else scenario
    metadata = {
        "model_version": MODEL_VERSION,
        "convention": "EP = canonical distance_km + ascent_m / 100; EPH = EP / moving_hours",
        "engineering_convention_not_physiological_law": True,
        "descent_model": "validated and recorded; no additional descent cost in version 1",
        "field_validated": False,
        "assumptions": ["same trip and cutoff for route progress and observed moving time",
                        "remaining route follows the selected destination segment",
                        "past moving EPH represents future moving EPH before user scenario"],
    }

    def suppressed(code, reason):
        return Estimate("suppressed", code, (reason,), metadata=metadata)

    try:
        if not isinstance(progress, RouteProgress) or not isinstance(destination, Destination):
            raise ValueError("expected RouteProgress and Destination inputs")
        if not isinstance(moving, MovingObservation) or not isinstance(scenario, Scenario):
            raise ValueError("expected MovingObservation and Scenario inputs")
        if progress.provenance != "canonical_route" or destination.provenance != "canonical_route":
            raise ValueError("route inputs must be canonical_route, not raw horizontal observations")
        if not isinstance(destination.identifier, str) or not destination.identifier.strip():
            raise ValueError("selected destination identifier is required")
        if destination.status not in ("ahead", "reached", "passed"):
            raise ValueError("unknown destination status")
        if moving.source not in ALLOWED_TIME_SOURCES:
            raise ValueError("unknown moving-time source")
        slowdown = _number(scenario.slowdown_factor, "slowdown_factor", minimum=1)
        stops = None if scenario.future_stop_seconds is None else _number(scenario.future_stop_seconds, "future_stop_seconds")
        values = {}
        for name, value in (("done_km", progress.distance_km), ("done_ascent_m", progress.ascent_m),
                            ("remaining_km", destination.distance_km), ("remaining_ascent_m", destination.ascent_m),
                            ("remaining_descent_m", destination.descent_m), ("moving_seconds", moving.seconds),
                            ("observed_elapsed_seconds", moving.elapsed_seconds)):
            values[name] = None if value is None else _number(value, name)
        if now is not None:
            if not isinstance(now, datetime) or now.tzinfo is None or now.utcoffset() is None:
                raise ValueError("now must be a timezone-aware datetime")
            now = now.astimezone(timezone.utc)
        elapsed = values["observed_elapsed_seconds"]
        seconds = values["moving_seconds"]
        if elapsed is not None and seconds is not None and seconds > elapsed:
            raise ValueError("moving time cannot exceed observed elapsed time")
        metadata.update({"route_derived": {"progress": {"distance_km": values["done_km"], "ascent_m": values["done_ascent_m"]},
                                               "destination": {"id": destination.identifier, "status": destination.status,
                                                               "distance_km": values["remaining_km"], "ascent_m": values["remaining_ascent_m"],
                                                               "descent_m": values["remaining_descent_m"]},
                                               "provenance": "canonical_route"},
                         "observed": {"moving_seconds": seconds, "source": moving.source, "elapsed_seconds": elapsed},
                         "scenario": {"slowdown_factor": slowdown, "future_stop_seconds": stops}})
        if destination.status == "passed":
            return suppressed("destination_passed", "Selected destination is already passed; select another destination.")
        if destination.status == "reached":
            if any(values[k] != 0 for k in ("remaining_km", "remaining_ascent_m", "remaining_descent_m")):
                raise ValueError("reached destination requires explicitly zero remaining route measurements")
            return Estimate("finished", None, ("Selected destination is reached; future stops are not applied.",),
                            remaining_moving_seconds=0.0, remaining_elapsed_seconds=0.0,
                            arrival_utc=None if now is None else now.isoformat(), metadata=metadata)
        if any(values[k] is None for k in ("done_km", "done_ascent_m", "remaining_km", "remaining_ascent_m", "remaining_descent_m", "moving_seconds")):
            return suppressed("missing_measurement", "Canonical route distance/elevation and observed moving time are required; unknown is not zero.")
        done_ep = values["done_km"] + values["done_ascent_m"] / 100.0
        remaining_ep = values["remaining_km"] + values["remaining_ascent_m"] / 100.0
        if not isfinite(done_ep) or not isfinite(remaining_ep):
            raise ValueError("route work overflow")
        if seconds == 0:
            if done_ep > 0:
                raise ValueError("positive progress with zero moving time is impossible")
            return suppressed("insufficient_progress", "No moving-time or route-work baseline yet.")
        if done_ep == 0:
            return suppressed("insufficient_progress", "Positive canonical route work is required to estimate EPH.")
        if remaining_ep == 0:
            raise ValueError("ahead destination must have positive remaining route work; confirm reached status")
        eph = done_ep / (seconds / 3600.0)
        duration = remaining_ep / eph * 3600.0 * slowdown
        elapsed_remaining = None if stops is None else duration + stops
        if not isfinite(eph) or eph <= 0 or not isfinite(duration) or duration <= 0:
            raise ValueError("calculated EPH or duration is not finite and positive")
        if elapsed_remaining is not None and not isfinite(elapsed_remaining):
            raise ValueError("elapsed duration overflow")
        arrival = None
        if elapsed_remaining is not None and now is not None:
            arrival = (now + timedelta(seconds=elapsed_remaining)).isoformat()
        reasons = ["Unvalidated engineering estimate, not a safety guarantee."]
        if stops is None:
            reasons.append("Future stops unknown: moving duration only; elapsed duration and arrival suppressed.")
        elif now is None:
            reasons.append("Current timestamp absent: arrival clock suppressed.")
        return Estimate("unvalidated", None, tuple(reasons), eph, duration, elapsed_remaining, arrival, metadata)
    except (ValueError, TypeError, OverflowError, ZeroDivisionError) as exc:
        return suppressed("invalid_input", str(exc))


# Foreground-only browser adapter. Raw GPX crosses the existing admission gate;
# no source timestamps, GPS observations, or network/persistence are used here.
def estimate_request(request):
    import base64
    from dataclasses import asdict
    from trail_planner import parse_gpx, build_geometry, InputError
    from gpx_admission import validate_gpx_admission

    expected = {'geometry_sha256', 'start_distance_m', 'progress_distance_m',
                'target_distance_m', 'target_id', 'moving_seconds', 'elapsed_seconds',
                'moving_source', 'future_stop_seconds', 'slowdown_factor', 'now_utc'}
    if (not isinstance(request, dict) or set(request) != {'gpx_b64', 'owner_revision', 'settings'}
            or not isinstance(request['gpx_b64'], str) or len(request['gpx_b64']) > 6990508
            or not isinstance(request['owner_revision'], str) or not 1 <= len(request['owner_revision']) <= 256
            or not isinstance(request['settings'], dict) or set(request['settings']) != expected):
        raise InputError('invalid_live_eta_request', '即時估時請求格式有誤。')
    s = request['settings']
    data = base64.b64decode(request['gpx_b64'], validate=True)
    validate_gpx_admission(data)
    geometry = build_geometry(parse_gpx(data))
    if geometry.blocked or not geometry.cells:
        raise InputError('live_eta_geometry_blocked', '路線幾何不可用，無法即時估時。')
    if s['geometry_sha256'] != geometry.geometry_sha256:
        raise InputError('live_eta_route_changed', '路線已變更，請重新確認進度與目的地。')
    start = _number(s['start_distance_m'], 'start_distance_m')
    progress = _number(s['progress_distance_m'], 'progress_distance_m')
    target = _number(s['target_distance_m'], 'target_distance_m')
    if not (start <= progress <= geometry.distance_m and start <= target <= geometry.distance_m):
        raise InputError('invalid_live_eta_progress', '進度與目的地必須位於同一條路線的起算點之後。')
    if not isinstance(s['target_id'], str) or not 1 <= len(s['target_id'].strip()) <= 256:
        raise InputError('invalid_live_eta_request', '請明確選擇目的地。')
    for key in ('moving_seconds', 'elapsed_seconds', 'future_stop_seconds'):
        if s[key] is not None and _number(s[key], key) > 2592000:
            raise InputError('invalid_live_eta_request', '時間不可超過 30 天。')
    slowdown = _number(s['slowdown_factor'], 'slowdown_factor', minimum=1)
    if slowdown > 10:
        raise InputError('invalid_live_eta_request', '放慢倍率須為 1 至 10。')
    now = s['now_utc']
    if now is not None:
        if not isinstance(now, str) or len(now) > 64:
            raise InputError('invalid_live_eta_request', '目前時間格式有誤。')
        now = datetime.fromisoformat(now.replace('Z', '+00:00'))

    def segment(a, b):
        # Only integrate the selected canonical interval. No nearest-point search.
        if not geometry.elevation_complete:
            return (b - a) / 1000, None, None
        ascent, descent = [], []
        for cell in geometry.cells:
            overlap = max(0.0, min(b, cell.end_m) - max(a, cell.start_m))
            if overlap:
                change = (cell.elevation_end_m - cell.elevation_start_m) * overlap / cell.distance_m
                ascent.append(max(0.0, change))
                descent.append(max(0.0, -change))
        from math import fsum
        return (b - a) / 1000, fsum(ascent), fsum(descent)

    done = segment(start, progress)
    status = 'passed' if target < progress else 'reached' if target == progress else 'ahead'
    remaining = (0.0, 0.0, 0.0) if status != 'ahead' else segment(progress, target)
    result = asdict(estimate(RouteProgress(done[0], done[1]),
                            Destination(s['target_id'], *remaining, status=status),
                            MovingObservation(s['moving_seconds'], s['moving_source'], s['elapsed_seconds']),
                            scenario=Scenario(slowdown, s['future_stop_seconds']), now=now))
    if result['quality'] == 'unvalidated' and (progress - start < 25 or s['moving_seconds'] < 60):
        result.update(quality='suppressed', suppression='insufficient_baseline',
                      reasons=['至少累積 25 公尺路線進度與 60 秒移動時間後再估時；此為工程顯示門檻，並非實地驗證標準。'],
                      eph=None, remaining_moving_seconds=None, remaining_elapsed_seconds=None, arrival_utc=None)
    result.update(owner_revision=request['owner_revision'], geometry_sha256=geometry.geometry_sha256)
    result['metadata'].update({
        'progress_source': 'manual_canonical_distance', 'source_activity_timestamps_used': False,
        'start_distance_m': start, 'progress_distance_m': progress, 'target_distance_m': target,
        'foreground_only': True, 'gps_snapping': False,
    })
    return result


def handle_request(request_json):
    import json
    from trail_planner import InputError
    try:
        if not isinstance(request_json, str) or len(request_json) > 7000000:
            raise InputError('invalid_live_eta_request', '即時估時請求過大。')
        result = estimate_request(json.loads(request_json))
        return json.dumps({'ok': True, 'result': result}, ensure_ascii=False, allow_nan=False, separators=(',', ':'))
    except InputError as error:
        return json.dumps({'ok': False, 'error': {'code': error.code, 'message': str(error)}}, ensure_ascii=False)
    except (ValueError, TypeError, OverflowError, KeyError):
        return json.dumps({'ok': False, 'error': {'code': 'invalid_live_eta_request', 'message': '即時估時資料格式有誤。'}}, ensure_ascii=False)
