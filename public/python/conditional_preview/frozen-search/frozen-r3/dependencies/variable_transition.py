"""Bounded prescribed clipped-exponential control, isolated research only.

No athlete coefficients, model fitting, optimizer, geometry mutation or UI.
Uses the exact reviewed r2 state/parameter types and free/rest transitions.
"""
from __future__ import annotations
from dataclasses import asdict, dataclass, fields
from fractions import Fraction
import math
import sys
from dependencies import intensity_transition as r2

VERSION = 'prescribed-variable-intensity-research/0.1'
State, Parameters, ModelError = r2.State, r2.Parameters, r2.ModelError
HARD_MAX_EVENTS = 100000
HARD_MAX_PIECES = 300000
GAMMA = r2.ROUNDING_ALLOWANCE


def checked_exp(x):
    return r2.exp(x)


def stable_log_ratio(a, b):
    return r2._log_fraction(Fraction.from_float(a) / Fraction.from_float(b))


@dataclass(frozen=True)
class Profile:
    """Immutable original-cell coordinates, all supplied floats exact inputs.

    h(E) = clip(density_start * exp(rate_per_effort * E), lower, upper).
    E and effort_j_kg are J/kg, density is s/(J/kg), rate is (J/kg)^-1.
    None means no upper bound. rate*effort <= 50 is numerical support only.
    """
    effort_j_kg: float
    density_start: float
    rate_per_effort: float
    lower_density: float
    upper_density: float | None

    def __post_init__(self):
        for n in ('effort_j_kg', 'density_start'):
            object.__setattr__(self, n, r2.num(getattr(self, n), n, positive=True))
        for n in ('rate_per_effort', 'lower_density'):
            object.__setattr__(self, n, r2.num(getattr(self, n), n))
        if self.upper_density is not None:
            object.__setattr__(self, 'upper_density', r2.num(self.upper_density, 'upper_density', positive=True))
            if self.lower_density > self.upper_density:
                r2.fail('invalid_number', 'profile speed bounds are reversed')
        end = self.rate_per_effort * self.effort_j_kg
        if not math.isfinite(end) or end > 50:
            r2.fail('numeric_support', 'profile exponent exceeds bounded numerical support')


class Budget:
    """Explicit, mutable accounting; no state is committed by these counters."""
    def __init__(self, max_events, max_pieces, cancelled=None):
        for n, v, hi in (('max_events', max_events, HARD_MAX_EVENTS),
                          ('max_pieces', max_pieces, HARD_MAX_PIECES)):
            if isinstance(v, bool) or not isinstance(v, int) or not 0 <= v <= hi:
                r2.fail('invalid_number', n)
        if cancelled is not None and not callable(cancelled):
            r2.fail('invalid_schema', 'cancelled must be a callback or None')
        self.max_events, self.max_pieces = max_events, max_pieces
        self.events = self.pieces = 0
        self.cancelled = cancelled

    def check(self):
        if self.cancelled is not None:
            try:
                cancel = self.cancelled()
            except Exception:
                r2.fail('cancel_check_failed', 'cancellation callback failed; no result committed')
            if not isinstance(cancel, bool):
                r2.fail('cancel_check_failed', 'cancellation callback must return bool')
            if cancel:
                r2.fail('cancelled', 'calculation cancelled; no result committed')

    def event(self):
        self.check()
        if self.events >= self.max_events:
            r2.fail('resource_limit', 'event budget exhausted')
        self.events += 1

    def piece(self):
        self.check()
        if self.pieces >= self.max_pieces:
            r2.fail('resource_limit', 'analytic-piece budget exhausted')
        self.pieces += 1

    def snapshot(self):
        return dict(events=self.events, pieces=self.pieces,
                    max_events=self.max_events, max_pieces=self.max_pieces,
                    accounting_unit='prescribed_piece_or_frozen_free_call')


def _log_density(profile, e):
    value = math.fsum((math.log(profile.density_start), profile.rate_per_effort * e))
    if profile.lower_density:
        value = max(value, math.log(profile.lower_density))
    if profile.upper_density is not None:
        value = min(value, math.log(profile.upper_density))
    return value


def _integral(log_start, delta, width):
    """Exact exponential integral evaluated from larger endpoint (no cancellation)."""
    if not width:
        return 0.0
    magnitude = abs(delta)
    factor = 1.0 if magnitude == 0 else -math.expm1(-magnitude) / magnitude
    # Log product avoids overflow in an intermediate density when integral fits.
    log_value = math.fsum((math.log(width), log_start, max(0.0, delta), math.log(factor)))
    return checked_exp(log_value)


def _pieces(profile, start, end):
    points = [start, end]
    if profile.rate_per_effort:
        for cap in (profile.lower_density, profile.upper_density):
            if cap is not None and cap > 0:
                crossing = stable_log_ratio(cap, profile.density_start) / profile.rate_per_effort
                if start < crossing < end:
                    points.append(crossing)
    points = sorted(set(points))
    for lo, hi in zip(points, points[1:]):
        mid = lo + (hi - lo) * .5
        raw = math.fsum((math.log(profile.density_start), profile.rate_per_effort * mid))
        if profile.lower_density and raw <= math.log(profile.lower_density):
            yield lo, hi, math.log(profile.lower_density), 0.0, 'lower'
        elif profile.upper_density is not None and raw >= math.log(profile.upper_density):
            yield lo, hi, math.log(profile.upper_density), 0.0, 'upper'
        else:
            yield lo, hi, math.fsum((math.log(profile.density_start), profile.rate_per_effort * lo)), profile.rate_per_effort * (hi - lo), 'exponential'


def _slice(profile, start, end):
    if not isinstance(profile, Profile):
        r2.fail('invalid_schema', 'Profile required')
    start, end = r2.num(start, 'start_effort'), r2.num(end, 'end_effort')
    if not 0 <= start <= end <= profile.effort_j_kg:
        r2.fail('invalid_number', 'slice outside original cell coordinates')
    return start, end, end - start


def integrate(profile, start, end, p, budget):
    """Time and intensity-weighted effort for one original-profile slice.

    Error envelopes are conservative engineering binary64 allowances under the
    same bounded-libm assumption as r2, NOT interval-arithmetic certificates.
    """
    start, end, effort = _slice(profile, start, end)
    if not isinstance(p, Parameters) or not isinstance(budget, Budget):
        r2.fail('invalid_schema', 'Parameters and Budget required')
    budget.check()
    if not effort:
        return dict(effort_j_kg=0., moving_s=0., dose_j_kg=0.,
                    moving_error_bound_s=0., dose_error_bound_j_kg=0.,
                    ratio_min=None, ratio_max=None, analytic_pieces=0,
                    density_log_error_allowance=0.)
    logs = (_log_density(profile, start), _log_density(profile, end))
    log_s = math.log(p.scale_s_per_j_kg)
    rlo, rhi = checked_exp(log_s - logs[1]), checked_exp(log_s - logs[0])
    r2.support_ratio(rlo, rhi, p)
    # This explicitly includes scale, cap, log, multiplication, crossing and
    # endpoint evaluation conditioning; clamp is 1-Lipschitz in log density.
    scale = 1 + abs(math.log(profile.density_start)) + abs(log_s)
    scale += abs(profile.rate_per_effort * start) + abs(profile.rate_per_effort * end)
    scale += sum(abs(math.log(c)) for c in (profile.lower_density, profile.upper_density) if c is not None and c > 0)
    density_error = GAMMA * scale
    times, doses, count = [], [], 0
    for lo, hi, logh, delta, _ in _pieces(profile, start, end):
        budget.piece()
        width = hi - lo
        times.append(_integral(logh, delta, width))
        doses.append(width if p.elasticity == 0 else _integral(p.elasticity * (log_s - logh), -p.elasticity * delta, width))
        count += 1
        budget.check()
    seconds = r2.add(*times)
    dose = effort if p.elasticity == 0 else r2.add(*doses)
    operation_scale = 1 + abs(math.log(effort)) + abs(math.log(seconds)) + abs(math.log(dose))
    time_log_bound = density_error + GAMMA * operation_scale
    dose_log_bound = abs(p.elasticity) * density_error + GAMMA * (operation_scale + abs(p.elasticity) * (1 + max(abs(log_s - l) for l in logs)))
    try:
        time_error = r2.add(seconds * math.expm1(time_log_bound), 4 * math.ulp(seconds))
        width_residual = abs(Fraction.from_float(end) - Fraction.from_float(start) - Fraction.from_float(effort))
        width_error = math.nextafter(float(width_residual), math.inf) if width_residual else 0.0
        dose_error = width_error if p.elasticity == 0 else r2.add(dose * math.expm1(dose_log_bound), 4 * math.ulp(dose))
    except OverflowError:
        r2.fail('numeric_support', 'integral error allowance overflow')
    if time_error > r2._precision_limit(seconds) or dose_error > r2._precision_limit(dose):
        r2.fail('numeric_support', 'integral conditioning exceeds precision contract')
    budget.check()
    return dict(effort_j_kg=effort, moving_s=seconds, dose_j_kg=dose,
                moving_error_bound_s=time_error, dose_error_bound_j_kg=dose_error,
                ratio_min=rlo, ratio_max=rhi, analytic_pieces=count,
                density_log_error_allowance=density_error)


def move_profile(s, profile, start, end, p, budget):
    """Atomic prescribed-control event; incoming F/P do not redefine the lock."""
    r2.support_state(s, p)
    if not isinstance(budget, Budget):
        r2.fail('invalid_schema', 'Budget required')
    budget.event()
    _, _, effort = _slice(profile, start, end)
    if r2.add(s.effort_j_kg, effort) > p.max_cumulative_effort_j_kg:
        r2.fail('outside_declared_domain', 'cumulative effort outside supplied support')
    val = integrate(profile, start, end, p, budget)
    if not effort:
        budget.check()
        return dict(val, state=s, deficit_added=0., deficit_added_error_bound=0., locked=True)
    inc = r2.finite(p.accrual_per_j_kg * val['dose_j_kg'], 'deficit increment')
    inc_error = r2.add(p.accrual_per_j_kg * val['dose_error_bound_j_kg'], GAMMA * inc, 4 * math.ulp(inc))
    z = r2.add(s.fast, s.persistent, inc)
    zerr = r2.add(s.deficit_roundoff_bound, inc_error, GAMMA * z, 4 * math.ulp(z))
    moving = r2.add(s.moving_s, val['moving_s'])
    terr = r2.add(s.moving_roundoff_bound_s, val['moving_error_bound_s'], math.ulp(moving))
    if zerr > r2._precision_limit(z) or terr > r2._precision_limit(moving):
        r2.fail('numeric_support', 'accumulated numerical history exceeds precision contract')
    out = State(r2.add(s.fast, p.fast_fraction * inc),
                r2.add(s.persistent, (1 - p.fast_fraction) * inc),
                r2.add(s.effort_j_kg, effort), moving, s.stopped_s, zerr, terr)
    r2.support_state(out, p)
    budget.check()
    return dict(val, state=out, deficit_added=inc, deficit_added_error_bound=inc_error,
                locked=True, cap_feasible=True, physiological_feasibility_identified=False)


def move_free(s, effort, cap_floor_s, p, budget):
    if not isinstance(budget, Budget):
        r2.fail('invalid_schema', 'Budget required')
    budget.event()
    budget.piece()
    result = r2.move(s, effort, cap_floor_s, None, p)
    budget.check()
    return result


def stop(s, service_s, extra_s, service_exposure_fraction, p, budget):
    if not isinstance(budget, Budget):
        r2.fail('invalid_schema', 'Budget required')
    budget.event()
    result = r2.stop(s, service_s, extra_s, service_exposure_fraction, p)
    budget.check()
    return result


def replay(events, raw_parameters, initial_state, budget):
    """All-or-nothing bounded scenario, no partial prefix passed off as finish.

    Events use strict schemas: prescribed(id, profile, start, end),
    free(id, effort_j_kg, cap_floor_s), stop(id, service_s, extra_s, rho).
    Profile may be its dataclass or its exact-field dictionary.
    """
    completed = 0
    try:
        if not isinstance(events, (list, tuple)) or len(events) > HARD_MAX_EVENTS or not isinstance(budget, Budget):
            r2.fail('resource_limit', 'bounded event list and Budget required')
        p, missing = r2.parse_parameters(raw_parameters)
        if initial_state is None:
            missing.append('initial_state')
        if missing:
            return dict(status='not_estimable', missing=sorted(missing), complete=False,
                        final_state=None, personal_causal_effect_identified=False)
        s = initial_state
        r2.support_state(s, p)
        seen, rows = set(), []
        for event in events:
            budget.check()
            if not isinstance(event, dict):
                r2.fail('invalid_schema', 'event')
            ident = r2.label(event.get('id'), 'event.id')
            if ident in seen:
                r2.fail('invalid_schema', 'duplicate occurrence ID')
            seen.add(ident)
            kind = event.get('kind')
            if kind == 'prescribed':
                if set(event) != {'id', 'kind', 'profile', 'start', 'end'}:
                    r2.fail('invalid_schema', 'prescribed event fields')
                profile = event['profile']
                if isinstance(profile, dict):
                    if set(profile) != {f.name for f in fields(Profile)}:
                        r2.fail('invalid_schema', 'profile fields')
                    profile = Profile(**profile)
                val = move_profile(s, profile, event['start'], event['end'], p, budget)
            elif kind == 'free':
                if set(event) != {'id', 'kind', 'effort_j_kg', 'cap_floor_s'}:
                    r2.fail('invalid_schema', 'free event fields')
                val = move_free(s, event['effort_j_kg'], event['cap_floor_s'], p, budget)
            elif kind == 'stop':
                if set(event) != {'id', 'kind', 'service_s', 'extra_s', 'rho'}:
                    r2.fail('invalid_schema', 'stop event fields')
                val = stop(s, event['service_s'], event['extra_s'], event['rho'], p, budget)
            else:
                r2.fail('invalid_schema', 'event kind')
            s = val['state']
            rows.append(dict(id=ident, kind=kind, **{k: v for k, v in val.items() if k != 'state'}, state=asdict(s)))
            completed += 1
        budget.check()
        return dict(status='conditional_scenario', schema=VERSION, complete=True,
                    events=rows, final_state=asdict(s), finish_elapsed_s=r2.add(s.moving_s, s.stopped_s),
                    resources=budget.snapshot(), personal_causal_effect_identified=False,
                    physiological_feasibility_identified=False, mutates_input=False,
                    numerical_error_kind='engineering_binary64_envelope_not_formal_interval')
    except ModelError as exc:
        return dict(status=exc.code, message=str(exc), complete=False, final_state=None,
                    completed_event_count=completed, resources=budget.snapshot() if isinstance(budget, Budget) else None,
                    personal_causal_effect_identified=False)
