"""Isolated offline equal-weight mean-P historical reference.

All demonstrations/tests are synthetic. This is a conditional historical
reference, not measured physiological power or a validated fitness estimate.
Only verified copies of the frozen core are loaded, under a private namespace.
"""
import builtins
from copy import deepcopy
from dataclasses import asdict
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import re
import sys
import types

os.environ['PYTHONDONTWRITEBYTECODE'] = '1'
sys.dont_write_bytecode = True
SCHEMA_VERSION = 'multi-history-reference/0.2-local-source'
METHOD_VERSION = 'equal-weight-mean-effective-rate-constant-v1'
CALIBRATION_STATUS = 'historical_scales_fitted_aggregation_rule_provisional_not_externally_validated'
MAX_RECORDS = 8
MAX_TOTAL_GPX_BYTES = 12 * 1024 * 1024
MAX_HISTORY_POINTS = 50_000
MAX_TOTAL_CELLS = 100_000
MAX_METADATA_BYTES = 16 * 1024
CORE_HASHES = {
    'cross_trail_predictor.py': '2f91c50c176c626acd2665f1d229f4baeb394e01d7ed1e1f37ad52bca74c0be3',
    'trail_planner/geometry.py': '8a527265f1f890f913c4cc33e513afb7cb61cd14150e6155e9d9fcfe2d37bd25',
    'trail_planner/planning.py': '219bdcc59fea3d2ec581bd45adad0d8162e789d367437f1bec79d2066d276080',
    'trail_planner/gpx.py': '734e1aae59de0b4775d74257c767de9e5f4648b69247988b1087ec27fa18fe6f',
    'trail_planner/__init__.py': '06096ad97f2c6ce19894e9686fe836cd438309522d0781bf9a9bf263c41b15f3',
}
CORE_ROOT = Path(__file__).resolve().parent / 'core_snapshot'
_CORE = None
RECORD_KEYS = {'activity_key', 'reference_gpx', 'evidence', 'qualification', 'source_observations', 'source_assessment'}
EVIDENCE_KEYS = {'reference_completed_on', 'forecast_as_of', 'target_start', 'reference_moving_s', 'reference_elapsed_s', 'reference_stops_s', 'reference_is_actual', 'comparable_conditions_confirmed'}
ASSUMPTION_KEYS = {'fatigue_model', 'reference_end_slowdown', 'max_speed_m_s', 'uphill_cap_grade', 'uphill_cap_m_s', 'downhill_cap_grade', 'downhill_cap_m_s', 'target_stops_s'}
CLASSIFICATIONS = {'race', 'benchmark', 'easy', 'unclassified'}
STATES = {'omitted', 'null', 'invalid', 'valid'}
PROVISIONAL_WARNINGS = [
    '多筆平均參考是所選歷史有效速率P的等權算術平均；規則暫定，尚未外部驗證。',
    '所選歷史的情境差異範圍只是描述，並非信賴區間、預測區間或預測不確定性。',
    '增加歷史筆數不會驗證生理功率、最大能力或當前體能推論。',
    '來源及路線對應收據為主機提供的證據；本離線模組不驗證帳戶擁有權或缺席的來源快照。',
]
INSUFFICIENT_CODES = {'selection_empty', 'history_qualification_insufficient', 'prediction_confirmation_required', 'reference_moving_unknown', 'reference_scale_unidentifiable'}


class ContractError(ValueError):
    def __init__(self, code, message):
        super().__init__(message)
        self.code = code


def _fail(code, message):
    raise ContractError(code, message)


def _sha(raw):
    return hashlib.sha256(raw).hexdigest()


def _canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=True, allow_nan=False, separators=(',', ':'))


def _copy_metadata(value, code='history_schema_invalid'):
    """Bounded built-in-only snapshot: no custom objects, cycles or output aliases."""
    budget = [0]
    active = set()
    def add(n):
        budget[0] += n
        if budget[0] > MAX_METADATA_BYTES:
            _fail('history_metadata_too_large' if code == 'history_schema_invalid' else 'common_metadata_too_large', 'Metadata exceeds 16 KiB; it is not truncated.')
    def clone(v, depth):
        if depth > 8:
            _fail(code, 'Metadata nesting exceeds the bounded schema.')
        t = type(v)
        if v is None or t in (str, bool, int, float):
            if t in (int, float):
                try:
                    finite = math.isfinite(v)
                except (OverflowError, TypeError):
                    finite = False
                if not finite:
                    _fail(code, 'Metadata numbers must be finite built-in numbers.')
            add(len(_canonical(v).encode('utf-8')))
            return v
        if t not in (dict, list):
            _fail(code, 'Metadata must contain only exact built-in dictionaries, lists and scalars.')
        if id(v) in active:
            _fail(code, 'Cyclic metadata is invalid.')
        active.add(id(v))
        try:
            if t is dict:
                add(2 + max(0, len(v) - 1))
                out = {}
                for k, item in v.items():
                    if type(k) is not str:
                        _fail(code, 'Metadata keys must be built-in strings.')
                    add(len(_canonical(k).encode('utf-8')) + 1)
                    out[k] = clone(item, depth + 1)
                return out
            add(2 + max(0, len(v) - 1))
            return [clone(item, depth + 1) for item in v]
        finally:
            active.remove(id(v))
    return clone(value, 0)


def _keys(v, keys):
    if type(v) is not dict or set(v) != set(keys):
        _fail('history_schema_invalid', 'Missing, extra or invalid receipt fields.')


def _string(v, maximum=200, *, empty=False, machine=False):
    if type(v) is not str or len(v) > maximum or (not empty and not v.strip()):
        _fail('history_schema_invalid', 'A bounded provenance string is required.')
    if machine and not re.fullmatch(r'[A-Za-z0-9_.:-]+', v, flags=re.ASCII):
        _fail('history_schema_invalid', 'A bounded machine code is required.')


def _enum(v, choices):
    if type(v) is not str or v not in choices:
        _fail('history_schema_invalid', 'Invalid literal enum.')


def _bool(v):
    if type(v) is not bool:
        _fail('history_schema_invalid', 'A strict boolean is required.')


def _number(v, *, negative=False):
    try:
        valid = type(v) in (int, float) and math.isfinite(v) and (negative or v >= 0)
    except (OverflowError, TypeError):
        valid = False
    if not valid:
        _fail('history_schema_invalid', 'A finite built-in nonnegative number is required.')


def _digest(v):
    if type(v) is not str or not re.fullmatch(r'[0-9a-f]{64}', v, flags=re.ASCII):
        _fail('history_schema_invalid', 'A lowercase SHA-256 receipt is required.')


def _observation(v, recording=False):
    _keys(v, {'state', 'raw', 'source', 'interpretation', 'invalid_reason'} if recording else {'state', 'value', 'source', 'invalid_reason'})
    _enum(v['state'], STATES)
    _string(v['source'])
    val = v['raw' if recording else 'value']
    if recording and v['interpretation'] != 'uninterpreted':
        _fail('history_schema_invalid', 'Recording stops must remain uninterpreted.')
    if v['state'] == 'valid':
        if v['invalid_reason'] is not None:
            _fail('history_schema_invalid', 'Valid observations cannot have an invalid reason.')
        if recording:
            if type(val) is not list or len(val) > 50_000:
                _fail('history_schema_invalid', 'Recording stops require a bounded dense list.')
            for item in val:
                _number(item, negative=True)
        else:
            _number(val)
    elif v['state'] == 'invalid':
        if val is not None:
            _fail('history_schema_invalid', 'Invalid observations must retain null values.')
        _string(v['invalid_reason'], 96, machine=True)
    elif val is not None or v['invalid_reason'] is not None:
        _fail('history_schema_invalid', 'Unknown observations must retain null values and reasons.')


def _record_schema(raw):
    _keys(raw, RECORD_KEYS)
    if type(raw['reference_gpx']) is not bytes:
        _fail('history_schema_invalid', 'reference_gpx must be actual immutable bytes.')
    r = _copy_metadata({k: raw[k] for k in sorted(RECORD_KEYS - {'reference_gpx'})})
    r['reference_gpx'] = raw['reference_gpx']
    k, e, q, o, a = (r[x] for x in ('activity_key', 'evidence', 'qualification', 'source_observations', 'source_assessment'))
    _keys(k, {'provider', 'subject_namespace', 'activity_id'})
    _enum(k['provider'], {'Synthetic', 'Intervals.icu', 'LocalGPX'})
    for field, maximum in (('subject_namespace', 128), ('activity_id', 96)):
        if type(k[field]) is not str or not re.fullmatch(r'[A-Za-z0-9_-]{1,' + str(maximum) + '}', k[field], flags=re.ASCII):
            _fail('history_schema_invalid', 'Stable activity identity is missing or malformed.')
    _keys(e, EVIDENCE_KEYS)
    for field in ('reference_completed_on', 'forecast_as_of', 'target_start'):
        _string(e[field], 10)
    for field in ('reference_is_actual', 'comparable_conditions_confirmed'):
        _bool(e[field])
    for field in ('reference_moving_s', 'reference_elapsed_s', 'reference_stops_s'):
        if e[field] is not None:
            _number(e[field])
    _keys(q, {'original_classification', 'selected_classification', 'classification_source', 'high_effort_reference_confirmed', 'route_time_scope_confirmed'})
    for field in ('original_classification', 'selected_classification'):
        _enum(q[field], CLASSIFICATIONS)
    _enum(q['classification_source'], {'upstream', 'explicit_user_confirmation'})
    for field in ('high_effort_reference_confirmed', 'route_time_scope_confirmed'):
        _bool(q[field])
    _keys(o, {'schema_version', 'identity', 'source_snapshot_sha256', 'declared_gpx_sha256', 'completed_on_source', 'start_date_local', 'moving_time', 'elapsed_time', 'official_distance', 'recording_stops', 'known_stops', 'pause_time_s'})
    if o['schema_version'] != 'offline-history-observations/0.1':
        _fail('history_schema_invalid', 'Unsupported observation receipt version.')
    _keys(o['identity'], {'provider', 'activity_id'})
    _enum(o['identity']['provider'], {'Synthetic', 'Intervals.icu', 'LocalGPX'})
    _string(o['identity']['activity_id'], 96)
    for field in ('source_snapshot_sha256', 'declared_gpx_sha256'):
        _digest(o[field])
    _string(o['completed_on_source'])
    if o['start_date_local'] is not None:
        _string(o['start_date_local'], empty=True)
    for field in ('moving_time', 'elapsed_time', 'official_distance'):
        _observation(o[field])
    _observation(o['recording_stops'], True)
    if o['known_stops'] is not None:
        _keys(o['known_stops'], {'duration_s', 'source', 'evidence_sha256'})
        _number(o['known_stops']['duration_s'])
        _string(o['known_stops']['source'])
        _digest(o['known_stops']['evidence_sha256'])
    if o['pause_time_s'] is not None:
        _number(o['pause_time_s'])
    _keys(a, {'schema_version', 'kind', 'normalizer_schema_version', 'status', 'upstream_source', 'provenance_known', 'source_supported', 'historical_performance_eligible', 'rights_guarantee', 'quality', 'binding'})
    if a['schema_version'] != 'offline-history-assessment/0.1':
        _fail('history_schema_invalid', 'Unsupported assessment receipt version.')
    _enum(a['kind'], {'normalized_history', 'synthetic_explicit', 'local_gpx_explicit'})
    expected = 'intervals-history-v1' if a['kind'] == 'normalized_history' else None
    if a['normalizer_schema_version'] != expected:
        _fail('history_schema_invalid', 'Assessment normalizer version does not match its kind.')
    _enum(a['status'], {'usable', 'limited', 'rejected'})
    if a['upstream_source'] is not None:
        _string(a['upstream_source'])
    for field in ('provenance_known', 'source_supported', 'historical_performance_eligible', 'rights_guarantee'):
        _bool(a[field])
    if a['rights_guarantee'] is not False:
        _fail('history_schema_invalid', 'Source acceptance cannot guarantee rights.')
    if type(a['quality']) is not list or len(a['quality']) > 128:
        _fail('history_schema_invalid', 'Quality receipts require a bounded list.')
    for reason in a['quality']:
        _keys(reason, {'code', 'severity', 'blocksFitness'})
        _string(reason['code'], 96, machine=True)
        _enum(reason['severity'], {'info', 'warning', 'error'})
        _bool(reason['blocksFitness'])
    b = a['binding']
    _keys(b, {'scope', 'gpx_sha256', 'normalized_path_sha256', 'path_sample_binding_sha256'})
    if b['scope'] != 'whole_activity':
        _fail('history_schema_invalid', 'Binding must cover the whole activity.')
    _digest(b['gpx_sha256'])
    for field in ('normalized_path_sha256', 'path_sample_binding_sha256'):
        if a['kind'] == 'normalized_history':
            _digest(b[field])
        elif b[field] is not None:
            _fail('history_schema_invalid', 'Explicit file receipts have no provider-normalized path binding.')
    return r


def _receipt_errors(r):
    """Collect all independent qualification/source mismatches; never waive them."""
    result = []
    def add(code, message):
        result.append(ContractError(code, message))
    k, e, q, o, a = (r[x] for x in ('activity_key', 'evidence', 'qualification', 'source_observations', 'source_assessment'))
    if o['identity'] != {'provider': k['provider'], 'activity_id': k['activity_id']}:
        add('history_source_identity_mismatch', 'Source identity and selected activity identity disagree.')
    actual = _sha(r['reference_gpx'])
    if actual != o['declared_gpx_sha256'] or actual != a['binding']['gpx_sha256']:
        add('history_gpx_hash_mismatch', 'Actual GPX bytes and source/binding receipts disagree.')
    if q['classification_source'] == 'upstream' and q['selected_classification'] != q['original_classification']:
        add('history_qualification_insufficient', 'An upstream classification cannot be changed without explicit override provenance.')
    if q['selected_classification'] not in {'race', 'benchmark'} or not q['high_effort_reference_confirmed'] or not q['route_time_scope_confirmed']:
        add('history_qualification_insufficient', 'Selected history lacks explicit high-effort and whole-route/time-scope qualification.')
    source_bad = (a['status'] != 'usable' or not a['provenance_known'] or not a['source_supported'] or not a['historical_performance_eligible'] or any(x['severity'] == 'error' or x['blocksFitness'] for x in a['quality']))
    source_bad |= k['provider'] == 'Intervals.icu' and (a['kind'] != 'normalized_history' or a['upstream_source'] != 'ZEPP')
    source_bad |= k['provider'] == 'Synthetic' and a['upstream_source'] != 'SYNTHETIC'
    source_bad |= k['provider'] == 'LocalGPX' and (a['kind'] != 'local_gpx_explicit' or a['upstream_source'] != 'LOCAL_GPX_USER_DECLARED')
    if source_bad:
        add('history_source_ineligible', 'Original source status, provenance, eligibility or quality blocks this history; original reasons are retained.')
    if any(o[field]['state'] == 'invalid' for field in ('moving_time', 'elapsed_time', 'official_distance', 'recording_stops')):
        add('history_source_observation_invalid', 'An original source observation is invalid and cannot be waived.')
    if o['recording_stops']['state'] == 'valid' and o['recording_stops']['raw']:
        add('history_recording_stops_uninterpreted', 'Nonempty recording stops remain uninterpreted and blocking.')
    for field, evidence_field in (('moving_time', 'reference_moving_s'), ('elapsed_time', 'reference_elapsed_s')):
        observed, supplied = o[field], e[evidence_field]
        if ((observed['state'] == 'valid' and supplied != observed['value']) or (supplied is not None and (observed['state'] != 'valid' or supplied != observed['value']))):
            add('history_source_time_mismatch', 'Source summary time must be copied exactly; unknowns cannot be filled.')
    known = o['known_stops']
    if (known is None and e['reference_stops_s'] is not None) or (known is not None and e['reference_stops_s'] != known['duration_s']):
        add('history_known_stops_mismatch', 'All-stop evidence and known-stop receipt must agree exactly.')
    if o['pause_time_s'] is not None:
        m, el = o['moving_time'], o['elapsed_time']
        if m['state'] != 'valid' or el['state'] != 'valid' or o['pause_time_s'] != el['value'] - m['value']:
            add('history_source_pause_mismatch', 'Derived pause summary must equal the unchanged elapsed-minus-moving values.')
    return result


def _verified_sources():
    sources = {}
    for relative, expected in CORE_HASHES.items():
        path = CORE_ROOT / relative
        try:
            raw = path.read_bytes()
        except OSError:
            _fail('dependency_integrity_mismatch', 'A pinned isolated dependency is missing or unreadable.')
        if _sha(raw) != expected:
            _fail('dependency_integrity_mismatch', 'Pinned isolated dependency bytes changed: ' + relative)
        sources[relative] = raw
    return sources


def _load_core():
    """No product sys.path, native product import or trail_planner name pollution."""
    global _CORE
    sources = _verified_sources()  # checked on every public call, including cache hits
    if _CORE is not None:
        return _CORE
    namespace = '_multi_history_frozen_' + _sha(str(CORE_ROOT).encode())[:16]
    parent = types.ModuleType(namespace)
    parent.__path__ = [str(CORE_ROOT)]
    sys.modules[namespace] = parent
    package_name = namespace + '.trail_planner'
    package = types.ModuleType(package_name)
    package.__path__ = [str(CORE_ROOT / 'trail_planner')]
    package.__package__ = package_name
    sys.modules[package_name] = package
    def load(relative, name, package_context):
        module = types.ModuleType(name)
        module.__file__ = str(CORE_ROOT / relative)
        module.__package__ = package_context
        sys.modules[name] = module
        exec(compile(sources[relative], module.__file__, 'exec'), module.__dict__)
        return module
    for short in ('gpx', 'geometry', 'planning'):
        module = load('trail_planner/' + short + '.py', package_name + '.' + short, package_name)
        setattr(package, short, module)
    package.__file__ = str(CORE_ROOT / 'trail_planner/__init__.py')
    exec(compile(sources['trail_planner/__init__.py'], package.__file__, 'exec'), package.__dict__)
    name = namespace + '.cross_trail_predictor'
    predictor = types.ModuleType(name)
    predictor.__file__ = str(CORE_ROOT / 'cross_trail_predictor.py')
    predictor.__package__ = namespace
    def private_import(name, globals=None, locals=None, fromlist=(), level=0):
        if level == 0 and (name == 'trail_planner' or name.startswith('trail_planner.')):
            redirected = package_name + name[len('trail_planner'):]
            return sys.modules[redirected] if fromlist else package
        return builtins.__import__(name, globals, locals, fromlist, level)
    predictor.__dict__['__builtins__'] = {**vars(builtins), '__import__': private_import}
    sys.modules[name] = predictor
    exec(compile(sources['cross_trail_predictor.py'], predictor.__file__, 'exec'), predictor.__dict__)
    _CORE = predictor
    return predictor


def _stable_mean_p(values):
    if not values or len(values) > MAX_RECORDS:
        _fail('aggregation_numeric_range', 'Aggregation requires one to eight finite positive rates.')
    for value in values:
        try:
            valid = type(value) in (int, float) and math.isfinite(value) and value > 0 and math.isfinite(1 / value) and 1 / value > 0
        except (OverflowError, ZeroDivisionError):
            valid = False
        if not valid:
            _fail('aggregation_numeric_range', 'Each fitted P and reciprocal must be finite positive.')
    if len(values) == 1:
        return values[0]
    maximum = max(values)
    try:
        mean = maximum * (math.fsum(sorted(v / maximum for v in values)) / len(values))
        reciprocal = 1 / mean
    except (OverflowError, ZeroDivisionError, ValueError):
        _fail('aggregation_numeric_range', 'Mean P cannot be represented as a finite positive rate.')
    if not math.isfinite(mean) or mean <= 0 or not math.isfinite(reciprocal) or reciprocal <= 0:
        _fail('aggregation_numeric_range', 'Mean P or reciprocal is outside finite positive range.')
    tolerance = 1e-12 * maximum
    if mean < min(values) - tolerance or mean > maximum + tolerance:
        _fail('aggregation_numeric_range', 'Mean P failed its selected-rate range invariant; it is not clamped.')
    return mean


def _aggregate_forward(core, target, assumptions, rate, warnings):
    _, caps, stops = core._validate_assumptions(assumptions)
    rows, effort = core._route_data(target, caps)
    prepared = core._prepared(rows, 0.)
    specs, stops, placement = core._checkpoint_specs(assumptions, target.distance_m, stops)
    scale = 1 / rate
    times = core._times(prepared, scale)
    moving = core._sum(times)
    elapsed = core._sum((moving, stops))
    if moving <= 0 or elapsed <= 0:
        _fail('prediction_numeric_range', 'Aggregate target totals must be finite positive.')
    cumulative, timeline = 0., []
    for row, duration in zip(prepared, times):
        c, energy, lower, cap, *_ = row
        cumulative += duration
        timeline.append({'start_m': c.start_m, 'end_m': c.end_m, 'moving_s': duration, 'cumulative_moving_s': cumulative, 'effort_j_kg': energy, 'grade': c.grade, 'speed_cap_m_s': cap, 'fatigue_multiplier_start': 1., 'fatigue_multiplier_end': 1.})
    return {
        'schema_version': SCHEMA_VERSION, 'model_version': core.MODEL_VERSION,
        'method_version': METHOD_VERSION, 'status': 'experimental_historical_reference',
        'purpose': 'conditional_historical_reference_forward', 'calibration_status': CALIBRATION_STATUS,
        'moving_s': moving, 'stops_s': stops, 'elapsed_s': elapsed,
        'target': core._provenance(target, effort), 'effective_rate_scale_j_kg_s': rate,
        'assumptions': deepcopy(assumptions), 'decay_per_j_kg': 0., 'target_end_slowdown': 1.,
        'canonical_timeline': timeline, 'geometry_snapshot': [asdict(c) for c in target.cells],
        'checkpoints': core._checkpoint_times(prepared, times, scale, specs, placement, stops),
        'checkpoint_query_version': 'analytic-prefix-v1', 'checkpoint_stop_placement': placement,
        'terrain_display_compatible': placement == 'explicit_checkpoints' or stops == 0,
        'warnings': list(warnings),
        'provenance': {'cost_core_version': core.COST_CORE_VERSION, 'cost_source': 'https://doi.org/10.1152/japplphysiol.01177.2001', 'cost_function': 'unchanged trail_planner.planning.running_cost', 'grade_domain': [-.45, .45], 'reference_recency_policy_days': 365},
    }


def _base(count):
    return {
        'schema_version': SCHEMA_VERSION, 'method_version': METHOD_VERSION,
        'status': 'insufficient_data', 'calibration_status': None,
        'selected_occurrence_count': count, 'unique_activity_count': 0,
        'duplicate_mapping': [], 'supplied_occurrences': [], 'ordered_unique_keys': [],
        'dependencies': {'sha256': dict(CORE_HASHES), 'model_version': 'anchor-minetti-effort-forward-v1', 'geometry_version': 'sphere-box50-grid25-v1', 'cost_core_version': 'minetti-running-goal-f1-cap-v1', 'private_helper_dependency_pinned': True},
        'aggregation_method': 'equal_weight_arithmetic_mean_P', 'P_unit': 'J/(kg*s)',
        'P_meaning': 'conditional historical effective-rate scale; not measured physiological power',
        'assumptions': None, 'common_dates': None, 'records': [], 'errors': [],
        'aggregate_P': None, 'aggregate_scale_s_per_j_kg': None, 'equal_weights': [],
        'descriptive_spread': None, 'target_prediction': None, 'warnings': list(PROVISIONAL_WARNINGS),
        'diagnostics_kind': 'partial_diagnostics_no_aggregate',
    }


def _append_error(out, error, scope, index=None):
    result = {'code': error.code, 'scope': scope, 'occurrence_index': index, 'message': str(error)}
    out['errors'].append(result)
    return result


def _finish_failure(out):
    if out['errors']:
        codes = [x['code'] for x in out['errors']]
        precedence = ('dependency_integrity_mismatch', 'history_selection_too_large', 'history_total_gpx_bytes_exceeded', 'history_total_points_exceeded', 'history_total_cells_exceeded', 'activity_identity_conflict', 'history_subject_mismatch', 'history_common_dates_mismatch')
        out['status'] = next((x for x in precedence if x in codes), None)
        if out['status'] is None:
            out['status'] = 'insufficient_data' if all(x in INSUFFICIENT_CODES for x in codes) else next(x for x in codes if x not in INSUFFICIENT_CODES)
    return out


def predict_multi_from_gpx(histories, target_gpx, assumptions):
    """Return a bounded, stateless envelope; never filter invalid selected records.

    histories is an exact list/tuple of six-field records, raw GPX is bytes.
    No source/authentication/ownership validation is claimed for supplied receipts.
    """
    count = len(histories) if type(histories) in (list, tuple) else 0
    out = _base(count)
    if type(histories) not in (list, tuple):
        _append_error(out, ContractError('history_schema_invalid', 'Selections must be an exact list or tuple.'), 'selection')
        return _finish_failure(out)
    if count > MAX_RECORDS:
        _append_error(out, ContractError('history_selection_too_large', 'At most eight supplied occurrences are allowed; no truncation.'), 'selection')
        return _finish_failure(out)
    if count == 0:
        _append_error(out, ContractError('selection_empty', 'No historical reference is selected.'), 'selection')
        return out
    supplied_bytes = len(target_gpx) if type(target_gpx) is bytes else 0
    for raw in histories:
        if type(raw) is dict and type(raw.get('reference_gpx')) is bytes:
            supplied_bytes += len(raw['reference_gpx'])
    if supplied_bytes > MAX_TOTAL_GPX_BYTES:
        _append_error(out, ContractError('history_total_gpx_bytes_exceeded', 'Supplied GPX bytes including duplicates and target exceed 12 MiB.'), 'selection')
        return _finish_failure(out)
    states = []
    for index, raw in enumerate(histories):
        evaluation = {'occurrence_index': index, 'activity_key': None, 'status': 'invalid', 'errors': [], 'diagnostics': None}
        state = {'evaluation': evaluation, 'record': None, 'geometry': None, 'key': None, 'fingerprint': None}
        try:
            record = _record_schema(raw)
            state['record'] = record
            state['key'] = tuple(record['activity_key'][x] for x in ('provider', 'subject_namespace', 'activity_id'))
            state['fingerprint'] = _sha(_canonical({k: v for k, v in record.items() if k != 'reference_gpx'}).encode() + b'\0' + _sha(record['reference_gpx']).encode())
            evaluation['activity_key'] = deepcopy(record['activity_key'])
            evaluation['receipt'] = deepcopy({k: v for k, v in record.items() if k != 'reference_gpx'})
            for error in _receipt_errors(record):
                evaluation['errors'].append(_append_error(out, error, 'history', index))
        except ContractError as error:
            evaluation['errors'].append(_append_error(out, error, 'history', index))
        states.append(state)
        out['supplied_occurrences'].append(evaluation)
    try:
        core = _load_core()
        if type(target_gpx) is not bytes:
            _fail('target_schema_invalid', 'target_gpx must be actual immutable bytes.')
        a = _copy_metadata(assumptions, 'prediction_assumption_schema')
        if type(a) is not dict or not ASSUMPTION_KEYS <= set(a) or set(a) - ASSUMPTION_KEYS - {'target_checkpoints'}:
            _fail('prediction_assumption_schema', 'Common assumptions must satisfy the original exact schema.')
        core._validate_assumptions(a)
        if a['fatigue_model'] != 'constant_rate' or a['reference_end_slowdown'] is not None:
            _fail('multi_history_fatigue_unsupported', 'This isolated slice requires constant_rate and null reference slowdown.')
        out['assumptions'] = a
        total_bytes = len(target_gpx)
        for raw in histories:
            if type(raw) is dict and type(raw.get('reference_gpx')) is bytes:
                total_bytes += len(raw['reference_gpx'])
        if total_bytes > MAX_TOTAL_GPX_BYTES:
            _fail('history_total_gpx_bytes_exceeded', 'Supplied GPX bytes including duplicates and target exceed 12 MiB.')
    except (ContractError, ValueError) as error:
        if not hasattr(error, 'code'):
            raise
        _append_error(out, error, 'request')
        return _finish_failure(out)
    valid_states = [s for s in states if s['record'] is not None]
    groups = {}
    for state in valid_states:
        groups.setdefault(state['key'], []).append(state)
    ordered = sorted(groups)
    out['unique_activity_count'] = len(ordered)
    out['ordered_unique_keys'] = [deepcopy(groups[key][0]['record']['activity_key']) for key in ordered]
    out['records'] = [groups[key][0]['evaluation'] for key in ordered] + [s['evaluation'] for s in states if s['record'] is None]
    subjects = {s['record']['activity_key']['subject_namespace'] for s in valid_states}
    dates = {(s['record']['evidence']['forecast_as_of'], s['record']['evidence']['target_start']) for s in valid_states}
    if len(subjects) > 1:
        for s in valid_states:
            s['evaluation']['errors'].append(_append_error(out, ContractError('history_subject_mismatch', 'Selected histories have different subject/dataset namespaces.'), 'history', s['evaluation']['occurrence_index']))
    if len(dates) > 1:
        for s in valid_states:
            s['evaluation']['errors'].append(_append_error(out, ContractError('history_common_dates_mismatch', 'All selected histories require identical forecast and target dates.'), 'history', s['evaluation']['occurrence_index']))
    elif dates:
        asof, target_date = next(iter(dates))
        out['common_dates'] = {'forecast_as_of': asof, 'target_start': target_date}
    try:
        _copy_metadata({'assumptions': a, 'common_dates': out['common_dates']}, 'prediction_assumption_schema')
    except ContractError as error:
        _append_error(out, error, 'request')
        return _finish_failure(out)
    for key in ordered:
        members = groups[key]
        if len({s['fingerprint'] for s in members}) > 1:
            for s in members:
                s['evaluation']['errors'].append(_append_error(out, ContractError('activity_identity_conflict', 'One stable activity identity has conflicting snapshots; none is chosen.'), 'history', s['evaluation']['occurrence_index']))
        else:
            for duplicate in members[1:]:
                first = members[0]['evaluation']['occurrence_index']
                duplicate['evaluation']['duplicate_of'] = first
                out['duplicate_mapping'].append({'occurrence_index': duplicate['evaluation']['occurrence_index'], 'duplicate_of': first, 'activity_key': deepcopy(duplicate['record']['activity_key'])})
    history_points, total_cells = 0, 0
    for state in states:
        r = state['record']
        if r is None:
            continue
        evaluation = state['evaluation']
        try:
            route = core.parse_gpx(r['reference_gpx'])
            history_points += route.point_count
            if history_points > MAX_HISTORY_POINTS:
                _fail('history_total_points_exceeded', 'Historical source points including duplicates exceed 50,000.')
            geometry = core.build_geometry(route)
            total_cells += len(geometry.cells)
            if total_cells > MAX_TOTAL_CELLS:
                _fail('history_total_cells_exceeded', 'Constructed cells including duplicates and target exceed 100,000.')
            state['geometry'] = geometry
            evaluation['geometry'] = {'raw_gpx_sha256': route.sha256, 'geometry_sha256': geometry.geometry_sha256, 'geometry_version': core.GEOMETRY_VERSION, 'config': asdict(geometry.config), 'source_points': route.point_count, 'cells': len(geometry.cells), 'core_horizontal_distance_m': geometry.horizontal_distance_m, 'smoothed_3d_distance_m': geometry.distance_m, 'quality': deepcopy(list(geometry.quality))}
            core._validate_evidence(r['evidence'])
            core._route_data(geometry, core._validate_assumptions(a)[1])
        except (ContractError, ValueError) as error:
            if not hasattr(error, 'code'):
                raise
            evaluation['errors'].append(_append_error(out, error, 'history', evaluation['occurrence_index']))
            if error.code in {'history_total_points_exceeded', 'history_total_cells_exceeded'}:
                return _finish_failure(out)
    try:
        target_route = core.parse_gpx(target_gpx)
        target = core.build_geometry(target_route)
        total_cells += len(target.cells)
        if total_cells > MAX_TOTAL_CELLS:
            _fail('history_total_cells_exceeded', 'Constructed cells including duplicates and target exceed 100,000.')
        _, caps, stops = core._validate_assumptions(a)
        core._route_data(target, caps)
        core._checkpoint_specs(a, target.distance_m, stops)
        if any(s['geometry'] is not None and s['geometry'].config != target.config for s in states):
            _fail('prediction_geometry_config_mismatch', 'All reference and target geometries must have identical config.')
    except (ContractError, ValueError) as error:
        if not hasattr(error, 'code'):
            raise
        _append_error(out, error, 'target')
        return _finish_failure(out)
    singleton_prediction = None
    warnings = []
    rates, projections = [], []
    for key in ordered:
        members = groups[key]
        state, evaluation = members[0], members[0]['evaluation']
        if any(s['evaluation']['errors'] for s in members):
            continue
        try:
            prediction = core.predict_geometries(state['geometry'], target, state['record']['evidence'], a)
            p = prediction['effective_rate_scale_j_kg_s']
            _stable_mean_p([p])
            evaluation['status'] = 'fitted_partial_diagnostic'
            evaluation['diagnostics'] = {
                'reference': deepcopy(prediction['reference']), 'reference_age_days': prediction['reference_age_days'],
                'reference_moving_s': prediction['reference_moving_s'], 'fitted_P': p, 'scale_s_per_j_kg': 1 / p,
                'anchor_fit_residual_s': prediction['anchor_fit_residual_s'],
                'same_target_projection_moving_s': prediction['moving_s'], 'same_target_projection_elapsed_s': prediction['elapsed_s'],
                'effort_ratio': prediction['effort_ratio'], 'distance_ratio': prediction['distance_ratio'],
                'target_effort_exceeds_reference': prediction['target']['effort_j_kg'] > prediction['reference']['effort_j_kg'],
                'warnings': list(prediction['warnings']),
            }
            if len(ordered) == 1:
                singleton_prediction = prediction  # preserve the complete original dictionary unchanged
            for warning in prediction['warnings']:
                if warning not in warnings:
                    warnings.append(warning)
            rates.append(p)
            projections.append((prediction['moving_s'], prediction['elapsed_s']))
            for duplicate in members[1:]:
                duplicate['evaluation']['status'] = 'duplicate_collapsed'
                duplicate['evaluation']['diagnostics'] = deepcopy(evaluation['diagnostics'])
        except (ContractError, ValueError) as error:
            if not hasattr(error, 'code'):
                raise
            evaluation['errors'].append(_append_error(out, error, 'history', evaluation['occurrence_index']))
            for duplicate in members[1:]:
                duplicate['evaluation']['errors'].append(_append_error(out, error, 'history', duplicate['evaluation']['occurrence_index']))
    out['warnings'] = warnings + list(PROVISIONAL_WARNINGS)
    if out['errors']:
        return _finish_failure(out)
    try:
        mean = _stable_mean_p(rates)
        aggregate = singleton_prediction if len(ordered) == 1 else _aggregate_forward(core, target, a, mean, out['warnings'])
        lower = min(v[0] for v in projections)
        upper = max(v[0] for v in projections)
        tolerance = 1e-9 * max(1., upper)
        if not lower - tolerance <= aggregate['moving_s'] <= upper + tolerance:
            _fail('aggregation_numeric_range', 'Aggregate target projection failed selected-anchor forward bounds.')
        out.update(status='experimental_historical_reference', calibration_status=CALIBRATION_STATUS,
                   aggregate_P=mean, aggregate_scale_s_per_j_kg=1 / mean, target_prediction=aggregate,
                   diagnostics_kind='selected_history_scenario_diagnostics',
                   equal_weights=[{'activity_key': deepcopy(groups[key][0]['record']['activity_key']), 'weight': 1 / len(ordered)} for key in ordered],
                   descriptive_spread={'kind': 'descriptive_selected_history_scenario_spread', 'interpretation': 'neither confidence/prediction interval nor forecast uncertainty', 'historical_P_min': min(rates), 'historical_P_max': max(rates), 'historical_P_range': max(rates) - min(rates), 'same_target_moving_min_s': lower, 'same_target_moving_max_s': upper, 'same_target_elapsed_min_s': min(v[1] for v in projections), 'same_target_elapsed_max_s': max(v[1] for v in projections)})
        for record in out['records']:
            record['status'] = 'qualified_fitted'
        return out
    except (ContractError, ValueError) as error:
        if not hasattr(error, 'code'):
            raise
        _append_error(out, error, 'aggregation')
        return _finish_failure(out)
