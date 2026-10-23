"""Data-free, browser-local historical performance references; not a trail model.

Deploy beside the unchanged research ``ability_adapter.py``. No I/O, network,
training data, optional dependency, goal time, or state is used by this module.
"""
import math
from ability_adapter import ContractError, predict, in_domain, _day, _number

VERSION = 'manual-performance-reference-v1'
COMMON = {'mode', 'forecast_as_of', 'target_start', 'history_completed_on',
          'history_elapsed_s'}
FLAT = COMMON | {'sport', 'history_distance_m', 'target_distance_m'}
SAME_ROUTE = COMMON | {'same_route_confirmed', 'history_stops_s', 'target_stops_s'}


def _nonnegative(value, name):
    if value == 0 and not isinstance(value, bool):
        return 0.0
    return _number(value, name)


def _out(mode):
    return {
        'interface_version': VERSION, 'mode': mode,
        'purpose': 'historical_performance_reference',
        'status': 'insufficient_evidence', 'central_seconds': None,
        'moving_seconds': None, 'stops_seconds': None,
        'uncertainty': {'kind': 'not_calibrated', 'interval': None,
                        'goal_probability': None},
        'trail_validated': False,
        'warnings': [
            'Reference assumes comparable fitness, effort, weather and conditions.',
            'This interface has no calibrated prediction interval or accuracy claim.',
            'A completed historical result is required; a planned goal is not evidence.'
        ],
    }


def estimate_reference(request):
    """Return a JSON-serializable reference from ONE user-entered completed race.

    Unsupported/insufficient evidence returns a status and no time. Malformed,
    extra, future-history, or impossible input raises ContractError. All durations
    are seconds; distances are metres; dates are strict YYYY-MM-DD.
    """
    if not isinstance(request, dict):
        raise ContractError('request must be an object')
    mode = request.get('mode')
    expected = FLAT if mode == 'flat_reference' else SAME_ROUTE if mode == 'same_route_reference' else None
    if expected is None:
        raise ContractError('unknown reference mode')
    if set(request) != expected:
        raise ContractError('reference schema mismatch; target times and extra fields are prohibited')
    asof = _day(request['forecast_as_of'], 'forecast_as_of')
    start = _day(request['target_start'], 'target_start')
    completed = _day(request['history_completed_on'], 'history_completed_on')
    elapsed = _number(request['history_elapsed_s'], 'history_elapsed_s')
    if asof > start:
        raise ContractError('forecast_as_of is after target_start')
    if completed >= asof or completed >= start:
        raise ContractError('history must be completed before forecast_as_of and target_start')
    age = (start - completed).days
    out = _out(mode)
    out.update(history_age_days=age, history_evidence_count=1,
               as_of_verification='user_attested_historical_result')
    # This is a transparent eligibility policy, not a fitted physiological decay.
    if mode == 'flat_reference':
        sport = request['sport']
        if not isinstance(sport, str) or not sport:
            raise ContractError('sport must be a nonempty string')
        d1 = _number(request['history_distance_m'], 'history_distance_m')
        d2 = _number(request['target_distance_m'], 'target_distance_m')
        out['domain'] = {'sport': sport, 'target_distance_m': d2}
        if age > 365:
            out['reason'] = 'history_older_than_365_days'
            return out
        if not in_domain(sport, d1) or not in_domain(sport, d2):
            out.update(status='unsupported_domain', reason='road_or_track_domain_required')
            return out
        if d1 == d2:
            # Explicit separate naïve carry-forward; the frozen cross-distance
            # research protocol deliberately excludes same-distance histories.
            out.update(status='reference_available', central_seconds=elapsed,
                       model='same_distance_carry_forward_unvalidated',
                       distance_extrapolation=False)
            out['warnings'].append('Same-distance carry-forward was not evaluated by the cross-distance benchmark.')
        else:
            q = dict(athlete_key='manual-self', sport=sport, gender='not_used',
                     target_distance_m=d2, forecast_as_of=request['forecast_as_of'],
                     target_start=request['target_start'])
            record = dict(result_key='manual-one', athlete_key='manual-self',
                          meet_key='manual-past', sport=sport, gender='not_used',
                          distance_m=d1, finish_seconds=elapsed,
                          completed_on=request['history_completed_on'], available_on=None)
            try:
                p = predict(q, kind='personal_fixed_riegel', histories=[record])
            except OverflowError:
                raise ContractError('duration calculation exceeds supported numeric range') from None
            if p['status'] != 'estimated':
                out.update(status=p['status'], reason=p.get('reason', 'no_reference'))
                return out
            if not math.isfinite(p['central_seconds']):
                raise ContractError('duration calculation exceeds supported numeric range')
            out['warnings'].append('Riegel exponent 1.06 is a fixed baseline, not your measured endurance.')
            out.update(status='reference_available', central_seconds=p['central_seconds'],
                       model=p['model_version'], exponent=p['exponent'],
                       distance_extrapolation=p['distance_extrapolation'])
        out['warnings'] += [
            'Do not use this flat-surface reference as the current GPX trail finish forecast.'
        ]
        return out

    if not isinstance(request['same_route_confirmed'], bool):
        raise ContractError('same_route_confirmed must be a boolean')
    old_stops = request['history_stops_s']
    new_stops = request['target_stops_s']
    if old_stops is not None:
        old_stops = _nonnegative(old_stops, 'history_stops_s')
        if old_stops >= elapsed:
            raise ContractError('history_stops_s must be less than history_elapsed_s')
    if new_stops is not None:
        new_stops = _nonnegative(new_stops, 'target_stops_s')
    if age > 365:
        out['reason'] = 'history_older_than_365_days'
        return out
    if not request['same_route_confirmed']:
        out['reason'] = 'same_route_not_confirmed'
        return out
    if old_stops is None and new_stops is not None:
        out['reason'] = 'history_stops_required_to_change_stops'
        return out
    moving = elapsed - old_stops if old_stops is not None else None
    projected_stops = new_stops if new_stops is not None else old_stops
    central = moving + projected_stops if moving is not None else elapsed
    if not math.isfinite(central):
        raise ContractError('duration calculation exceeds supported numeric range')
    out.update(status='reference_available', model='same_route_carry_forward_unvalidated',
               central_seconds=central, moving_seconds=moving,
               stops_seconds=projected_stops,
               route_match='user_confirmed_not_geometrically_verified',
               stop_handling='known_moving_plus_selected_stops' if moving is not None else 'historical_elapsed_already_includes_stops')
    out['warnings'] += [
        'Same route, direction and comparable conditions are user-confirmed, not verified by this function.',
        'This carries forward a past result; it does not model physiological fitness changes or a different trail.',
        'Do not add aid-station stops again to central_seconds.'
    ]
    return out
