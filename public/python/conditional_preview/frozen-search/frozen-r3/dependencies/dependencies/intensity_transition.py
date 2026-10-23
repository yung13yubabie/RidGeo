"""Conditional external-intensity response hypothesis. No personal defaults.

This is a research transition kernel, not a physiological calibration or product
adapter. Every coefficient and support envelope must be explicitly supplied.
"""
from __future__ import annotations
from dataclasses import dataclass, asdict, fields
import math
import sys
from fractions import Fraction

VERSION = 'intensity-response-research/0.2-numerical-conditioning'
NUMERICAL_RELATIVE_TOLERANCE = 1e-8
NUMERICAL_ABSOLUTE_TOLERANCE = 1e-10
# Conservative operation/libm allowance per transition; numerical, not athlete data.
ROUNDING_ALLOWANCE = (128 * sys.float_info.epsilon)/(1-128*sys.float_info.epsilon)
MAX_EVENTS = 4096
MAX_LOG_DEFICIT = 50.0  # numerical support, not physiology
MAX_ABS_ELASTICITY = 16.0  # numerical support, not a biological prior


class ModelError(ValueError):
    def __init__(self, code, message):
        self.code = code
        super().__init__(message)


def fail(code, message):
    raise ModelError(code, message)


def num(x, name, *, positive=False, signed=False):
    if isinstance(x, bool) or not isinstance(x, (int, float)):
        fail('invalid_number', name)
    try:
        y = float(x)
    except (OverflowError, ValueError):
        fail('numeric_support', name)
    if not math.isfinite(y):
        fail('numeric_support', name)
    if (not signed and y < 0) or (positive and y <= 0):
        fail('invalid_number', name)
    return y


def finite(x, name):
    return num(x, name)


def add(*xs):
    try:
        return finite(math.fsum(xs), 'derived sum')
    except (OverflowError, ValueError) as ex:
        if isinstance(ex, ModelError):
            raise
        fail('numeric_support', 'derived sum')


def exp(x):
    try:
        y = math.exp(x)
    except OverflowError:
        fail('numeric_support', 'derived exponential')
    if not math.isfinite(y) or y == 0:
        fail('numeric_support', 'derived exponential under/overflow')
    return y


def exprel(x):
    if x == 0:
        return 1.0
    try:
        return finite(math.expm1(x)/x, 'exponential integral factor')
    except OverflowError:
        fail('numeric_support', 'exponential integral factor')


def label(x, name):
    if not isinstance(x, str) or not x.strip() or len(x) > 2048:
        fail('invalid_schema', name)
    return x


@dataclass(frozen=True)
class Parameters:
    scale_s_per_j_kg: float
    accrual_per_j_kg: float
    elasticity: float
    fast_fraction: float
    recovery_rate_per_s: float
    ratio_min: float
    ratio_max: float
    max_cumulative_effort_j_kg: float
    max_cumulative_moving_s: float
    source_kind: str
    source_ref: str

    def __post_init__(self):
        for name in ('scale_s_per_j_kg', 'ratio_min', 'ratio_max',
                     'max_cumulative_effort_j_kg', 'max_cumulative_moving_s'):
            object.__setattr__(self, name, num(getattr(self, name), name, positive=True))
        for name in ('accrual_per_j_kg', 'fast_fraction', 'recovery_rate_per_s'):
            object.__setattr__(self, name, num(getattr(self, name), name))
        object.__setattr__(self, 'elasticity', num(self.elasticity, 'elasticity', signed=True))
        if self.fast_fraction > 1 or self.ratio_min > self.ratio_max:
            fail('invalid_number', 'fraction or support interval')
        if abs(self.elasticity) > MAX_ABS_ELASTICITY:
            fail('numeric_support', 'elasticity outside numerical support')
        if self.source_kind not in ('synthetic_test', 'explicit_scenario', 'estimate_declared'):
            fail('invalid_schema', 'unsupported source kind')
        label(self.source_ref, 'source_ref')


def parse_parameters(raw):
    names = {f.name for f in fields(Parameters)}
    if raw is None:
        return None, sorted(names)
    if not isinstance(raw, dict) or set(raw) != names:
        fail('invalid_schema', 'parameter fields')
    missing = [n for n in names if raw[n] is None or
               (n in ('source_ref', 'source_kind') and isinstance(raw[n], str) and not raw[n].strip())]
    # Reject malformed known values even when a different coefficient is missing.
    for name in names-set(missing)-{'source_kind','source_ref'}:
        v = num(raw[name], name, positive=name in ('scale_s_per_j_kg','ratio_min','ratio_max',
                     'max_cumulative_effort_j_kg','max_cumulative_moving_s'), signed=name=='elasticity')
        if (name=='fast_fraction' and v>1) or (name=='elasticity' and abs(v)>MAX_ABS_ELASTICITY):
            fail('invalid_number', name)
    if 'source_kind' not in missing and raw['source_kind'] not in ('synthetic_test','explicit_scenario','estimate_declared'):
        fail('invalid_schema','source_kind')
    if 'source_ref' not in missing:
        label(raw['source_ref'],'source_ref')
    if 'ratio_min' not in missing and 'ratio_max' not in missing and raw['ratio_min']>raw['ratio_max']:
        fail('invalid_number','support interval')
    if missing:
        return None, sorted(missing)
    return Parameters(**raw), []


@dataclass(frozen=True)
class State:
    fast: float
    persistent: float
    effort_j_kg: float
    moving_s: float
    stopped_s: float
    deficit_roundoff_bound: float = 0.0
    moving_roundoff_bound_s: float = 0.0

    def __post_init__(self):
        for f in fields(self):
            object.__setattr__(self, f.name, num(getattr(self, f.name), f.name))
        if add(self.fast, self.persistent) > MAX_LOG_DEFICIT:
            fail('numeric_support', 'combined deficit exceeds supported range')
        add(self.moving_s, self.stopped_s)


def support_state(s, p):
    if not isinstance(s, State) or not isinstance(p, Parameters):
        fail('invalid_schema', 'State and Parameters required')
    if s.effort_j_kg > p.max_cumulative_effort_j_kg or s.moving_s > p.max_cumulative_moving_s:
        fail('outside_declared_domain', 'cumulative exposure outside supplied support')


def support_ratio(lo, hi, p):
    if lo < p.ratio_min or hi > p.ratio_max:
        fail('outside_declared_domain', 'external intensity proxy outside supplied support')


def _precision_limit(value):
    return NUMERICAL_ABSOLUTE_TOLERANCE + NUMERICAL_RELATIVE_TOLERANCE*abs(value)


def _move_roundoff(s, increment, seconds, p, locked_ratio=None):
    """Propagate a conservative binary64 perturbation allowance.

    The allowance is computational bookkeeping, never physiological uncertainty.
    Near a negative-beta singularity use a finite perturbation denominator, not
    a first-order estimate evaluated at the already ill-conditioned midpoint.
    """
    z = add(s.fast, s.persistent)
    incoming = add(s.deficit_roundoff_bound, math.ulp(z))
    b = abs(p.elasticity)
    rho = ROUNDING_ALLOWANCE*(1+b*z+b*increment)
    if locked_ratio is not None:
        # A fixed control has state-independent accrual; no singular amplifier.
        rho += ROUNDING_ALLOWANCE*b*abs(math.log(locked_ratio))
        deficit_error = add(incoming, finite(rho*increment, 'locked roundoff'))
        time_error = 0.0  # locked_s itself is an exact supplied binary value
    elif p.elasticity < -1e-8 and increment:
        margin = exp(-b*increment)
        lost = -math.expm1(-b*increment)
        try:
            perturbation = (math.expm1(b*incoming)+lost*rho)/margin
        except OverflowError:
            fail('numeric_support','accumulated state uncertainty reaches singular surface')
        if not math.isfinite(perturbation) or perturbation >= 1:
            fail('numeric_support','insufficient numerical conditioning near response singularity')
        deficit_error = finite(-math.log1p(-perturbation)/b, 'conditioned deficit roundoff')
        try:
            time_error = finite(seconds*(math.expm1(deficit_error)+rho), 'conditioned time roundoff')
        except OverflowError:
            fail('numeric_support','conditioned time roundoff overflow')
    else:
        # For beta>=0 the scalar flow contracts; componentwise F/P bounds may
        # still expand by at most 2. Tiny negative beta has at most exp(b*dZ)
        # amplification over the supported Z<=50 range.
        gain = (2.0-math.exp(-b*increment) if p.elasticity>0 else math.exp(b*increment))
        deficit_error = add(finite(gain*incoming,'incoming roundoff'), finite(rho*increment,'local roundoff'))
        try:
            time_error = finite(seconds*(math.expm1(deficit_error)+rho), 'time roundoff')
        except OverflowError:
            fail('numeric_support','time roundoff overflow')
    deficit_error = add(deficit_error, math.ulp(add(z,increment))*4)
    moving_error = add(s.moving_roundoff_bound_s,time_error,math.ulp(add(s.moving_s,seconds)))
    if deficit_error > _precision_limit(add(z,increment)) or moving_error > _precision_limit(add(s.moving_s,seconds)):
        fail('numeric_support','requested binary64 precision cannot be supported; refine precision, not physiology')
    return deficit_error, moving_error


def advance(s, increment, effort, seconds, p, locked_ratio=None):
    inc = finite(increment, 'deficit increment')
    zerr,terr = _move_roundoff(s,inc,seconds,p,locked_ratio)
    result = State(add(s.fast, finite(p.fast_fraction*inc, 'fast accrual')),
                   add(s.persistent, finite((1-p.fast_fraction)*inc, 'persistent accrual')),
                   add(s.effort_j_kg, effort), add(s.moving_s, seconds), s.stopped_s, zerr, terr)
    support_state(result, p)
    return result


def _free_uncapped(z, effort, p):
    """Exact integration of dZ/dE=a exp(-beta Z), dt/dE=s exp(Z)."""
    a, beta = p.accrual_per_j_kg, p.elasticity
    if a == 0:
        return 0.0, finite(p.scale_s_per_j_kg*effort*exp(z), 'free time')
    amount = finite(a*effort, 'accrual amount')
    if beta == 0:
        delta = amount
        factor = exprel(delta)
    else:
        exposure = finite(amount*exp(-beta*z), 'intensity weighted exposure')
        x = beta*exposure
        if not math.isfinite(x) or x <= -1:
            fail('numeric_support', 'response singularity or overflow within fragment')
        log_term = math.log1p(x)
        delta = finite(exposure if x == 0 else log_term/beta, 'free deficit increment')
        factor = finite(exprel((beta+1)*delta)*(1.0 if x == 0 else log_term/x), 'free integral factor')
    if add(z, delta) > MAX_LOG_DEFICIT:
        fail('numeric_support', 'free deficit exceeds numerical support')
    return delta, finite(p.scale_s_per_j_kg*effort*exp(z)*factor, 'free time')


def move(s, effort_j_kg, cap_floor_s, locked_s, p):
    """One homogeneous route fragment. locked_s is constant local speed.

    None selects the fixed-scale forward controller. No fitted scale or target
    total is re-estimated. cap_floor_s is supplied by the unchanged route core.
    """
    support_state(s, p)
    effort = num(effort_j_kg, 'effort_j_kg', positive=True)
    floor = num(cap_floor_s, 'cap_floor_s')
    if add(s.effort_j_kg, effort) > p.max_cumulative_effort_j_kg:
        fail('outside_declared_domain', 'cumulative effort outside supplied support')
    z = add(s.fast, s.persistent)
    if locked_s is not None:
        seconds = num(locked_s, 'locked_s', positive=True)
        if seconds < floor:
            fail('locked_pace_violates_cap', 'locked time cannot be silently clipped or redistributed')
        ratio = finite(p.scale_s_per_j_kg*effort/seconds, 'locked proxy ratio')
        if ratio == 0:
            fail('numeric_support', 'locked proxy ratio underflow')
        support_ratio(ratio, ratio, p)
        increment = finite(p.accrual_per_j_kg*effort*exp(p.elasticity*math.log(ratio)), 'locked accrual')
        out = advance(s, increment, effort, seconds, p, locked_ratio=ratio)
        return {'state': out, 'moving_s': seconds, 'deficit_added': increment,
                'ratio_min': ratio, 'ratio_max': ratio, 'locked': True,
                'cap_effort_j_kg': 0.0, 'cap_feasible': True,
                'physiological_feasibility_identified': False}
    # Constant cap density within this fragment. At most one crossing because
    # all supported moving accrual is nonnegative (including negative beta).
    c = finite(floor/effort, 'cap density')
    free_density = finite(p.scale_s_per_j_kg*exp(z), 'initial free density')
    consumed = seconds = increment = 0.0
    ratio_start = min(exp(-z), p.scale_s_per_j_kg/c) if c else exp(-z)
    support_ratio(ratio_start, ratio_start, p)
    if c > free_density:
        cap_ratio = num(p.scale_s_per_j_kg/c, 'cap proxy ratio', positive=True)
        growth = finite(p.accrual_per_j_kg*exp(p.elasticity*math.log(cap_ratio)), 'cap accrual')
        # The branch already establishes c > the current rounded free density.
        # An exact binary ratio keeps its log positive even one ulp above the
        # crossing; subtracting log(c)-log(scale)-z can instead round negative.
        log_gap = _log_fraction(Fraction.from_float(c) / Fraction.from_float(free_density))
        crossing = math.inf if growth == 0 else log_gap/growth
        consumed = min(effort, crossing)
        increment = finite(growth*consumed, 'cap deficit increment')
        seconds = finite(c*consumed, 'cap time')
    remaining = max(0.0, effort-consumed)
    if remaining:
        free_inc, free_seconds = _free_uncapped(add(z, increment), remaining, p)
        increment = add(increment, free_inc)
        seconds = add(seconds, free_seconds)
    zend = add(z, increment)
    ratio_end = min(exp(-zend), p.scale_s_per_j_kg/c) if c else exp(-zend)
    support_ratio(ratio_end, ratio_start, p)
    num(seconds, 'derived moving duration', positive=True)
    out = advance(s, increment, effort, seconds, p)
    return {'state': out, 'moving_s': seconds, 'deficit_added': increment,
            'ratio_min': ratio_end, 'ratio_max': ratio_start, 'locked': False,
            'cap_effort_j_kg': consumed, 'cap_feasible': True,
            'physiological_feasibility_identified': False}


def stop(s, service_s, extra_s, service_exposure_fraction, p):
    support_state(s, p)
    service = num(service_s, 'service_s')
    extra = num(extra_s, 'extra_s')
    rho = num(service_exposure_fraction, 'service_exposure_fraction')
    if rho > 1:
        fail('invalid_number', 'service exposure fraction')
    dwell = add(service, extra)
    exposure = add(finite(rho*service, 'service exposure'), extra)
    exponent = finite(p.recovery_rate_per_s*exposure, 'recovery exponent')
    # A vanishing positive fast component may underflow to zero after long rest;
    # this is the defined limiting response, not missing data imputation.
    if dwell == 0:
        return {'state':s,'stop_s':0.0,'exposure_s':0.0}
    fast = finite(s.fast*math.exp(-exponent), 'post-stop fast')
    local_error = finite(ROUNDING_ALLOWANCE*fast*(1+exponent),'stop roundoff') if exponent and s.fast else 0.0
    zerr = add(s.deficit_roundoff_bound,local_error)
    if zerr > _precision_limit(fast+s.persistent):
        fail('numeric_support','post-stop numerical precision cannot be supported')
    out = State(fast, s.persistent, s.effort_j_kg, s.moving_s, add(s.stopped_s, dwell), zerr, s.moving_roundoff_bound_s)
    return {'state': out, 'stop_s': dwell, 'exposure_s': exposure}


def replay(events, raw_parameters, initial_state):
    """Bounded pure research ledger; no CP/cutoff/UI or optimizer claims."""
    if not isinstance(events, (list, tuple)) or len(events) > MAX_EVENTS:
        fail('resource_limit', 'events must be a bounded list')
    p, missing = parse_parameters(raw_parameters)
    if missing:
        return {'status': 'not_estimable', 'missing': missing,
                'personal_causal_effect_identified': False, 'recommended_plan': None}
    if initial_state is None:
        return {'status': 'not_estimable', 'missing': ['initial_state'],
                'personal_causal_effect_identified': False, 'recommended_plan': None}
    s = initial_state
    support_state(s, p)
    seen, rows = set(), []
    for event in events:
        if not isinstance(event, dict) or 'id' not in event or 'kind' not in event:
            fail('invalid_schema', 'event')
        ident = label(event['id'], 'event.id')
        if ident in seen:
            fail('invalid_schema', 'duplicate event occurrence ID')
        seen.add(ident)
        if event['kind'] == 'move':
            if set(event) != {'id','kind','effort_j_kg','cap_floor_s','locked_s'}:
                fail('invalid_schema', 'move event')
            result = move(s, event['effort_j_kg'], event['cap_floor_s'], event['locked_s'], p)
        elif event['kind'] == 'stop':
            if set(event) != {'id','kind','service_s','extra_s','service_exposure_fraction'}:
                fail('invalid_schema', 'stop event')
            result = stop(s, event['service_s'], event['extra_s'], event['service_exposure_fraction'], p)
        else:
            fail('invalid_schema', 'event kind')
        s = result['state']
        rows.append(dict(id=ident, kind=event['kind'], **{k:v for k,v in result.items() if k != 'state'},
                         state=asdict(s), elapsed_s=add(s.moving_s,s.stopped_s)))
    return {'status':'conditional_scenario', 'schema':VERSION, 'events':rows,
            'final_state':asdict(s), 'finish_elapsed_s':add(s.moving_s,s.stopped_s),
            'parameters':asdict(p), 'personal_causal_effect_identified':False,
            'relative_physiological_intensity_identified':False, 'recommended_plan':None,
            'mutates_input':False}


def ideal_two_level_fit(effort_1, seconds_1, deficit_gain_1,
                        effort_2, seconds_2, deficit_gain_2, scale):
    """Algebraic structural-identifiability demonstration, NOT a data fitter.

    Requires independently observed exact positive total log-deficit gains,
    constant local power, no stops, and valid common observation/control model.
    Natural self-selected pace alone supplies no such gains.
    """
    e1,e2,t1,t2,y1,y2,s = (num(v, 'ideal fit input', positive=True) for v in
        (effort_1,effort_2,seconds_1,seconds_2,deficit_gain_1,deficit_gain_2,scale))
    # Exact binary rationals: detect proportionality before taking any logs.
    fe1,ft1,fy1,fe2,ft2,fy2,fs = map(Fraction.from_float,(e1,t1,y1,e2,t2,y2,s))
    contrast_ratio = (fe2*ft1)/(ft2*fe1)
    if contrast_ratio == 1:
        return {'status':'not_identified', 'reason':'no_distinct_intensity_contrast',
                'structurally_distinct':False,'personal_causal_effect_identified':False,
                'sampling_uncertainty_estimated':False}
    contrast = _log_fraction(contrast_ratio)
    gain_contrast = _log_fraction((fy2*fe1)/(fe2*fy1))
    contrast_abs = abs(contrast)
    perturbation = 16*sys.float_info.epsilon
    conditioning = {'absolute_log_intensity_contrast':contrast_abs,
                    'contrast_amplification':num(1/contrast_abs,'contrast amplification') if contrast_abs else None,
                    'log_contrast_roundoff_allowance':perturbation,
                    'precision_relative_tolerance':NUMERICAL_RELATIVE_TOLERANCE,
                    'precision_absolute_tolerance':NUMERICAL_ABSOLUTE_TOLERANCE}
    unresolved={'status':'not_estimable','reason':'ill_conditioned_intensity_contrast',
                'structurally_distinct':True,'conditioning':conditioning,
                'personal_causal_effect_identified':False,'sampling_uncertainty_estimated':False}
    if contrast_abs <= perturbation:
        return unresolved
    beta = num(gain_contrast/contrast,'fit beta',signed=True)
    beta_error = (perturbation+abs(beta)*perturbation)/(contrast_abs-perturbation)
    lr1 = _log_fraction(fs*fe1/ft1)
    log_a_error = perturbation*(1+abs(beta))+abs(lr1)*beta_error
    conditioning.update(elasticity_roundoff_bound=beta_error,log_accrual_roundoff_bound=log_a_error)
    if beta_error > _precision_limit(beta) or log_a_error > NUMERICAL_RELATIVE_TOLERANCE:
        return unresolved
    a = exp(_log_fraction(fy1/fe1)-beta*lr1)
    return {'status':'ideal_structural_solution','accrual_per_j_kg':a,'elasticity':beta,
            'structurally_distinct':True,'conditioning':conditioning,
            'personal_causal_effect_identified':False,'sampling_uncertainty_estimated':False}


def _log_fraction(value):
    """Stable log of a positive exact ratio without float cross-products."""
    if Fraction(1,2) <= value <= 2:
        return math.log1p(float(value-1))
    n,d=value.numerator,value.denominator
    shift=n.bit_length()-d.bit_length()
    normalized=Fraction(n,d<<shift) if shift>=0 else Fraction(n<<(-shift),d)
    return math.log(float(normalized))+shift*math.log(2.0)
