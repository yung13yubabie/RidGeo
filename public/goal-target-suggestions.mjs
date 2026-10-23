/**
 * Pure, DOM-free goal-target suggestions. No state mutation or core replacement.
 * A numeric bounds candidate is NOT an actionable proposal: the caller must run
 * the unchanged core and supply its response to validateGoalTargetCandidate.
 */
export const UI_MAX_TARGET_S = 999 * 3600 + 59 * 60 + 59;
export const CORE_MAX_TARGET_S = 7 * 86400;
const SCHEMA = 'ridgeq-goal-target-suggestion/1';
const CORE_VERSIONS = Object.freeze({schema_version: 'trail-plan/1.0',
  model_version: 'minetti-running-goal-f1-cap-v1', geometry_version: 'sphere-box50-grid25-v1'});
const NUMERIC_SETTINGS = ['target_elapsed_s', 'fatigue_end_multiplier',
  'max_speed_m_s', 'min_speed_m_s', 'walk_uphill_grade', 'walk_max_speed_m_s'];
const CONSENTS = ['allow_flat_missing_elevation', 'allow_grade_clamp'];
const SETTING_KEYS = [...NUMERIC_SETTINGS, ...CONSENTS, 'checkpoints'].sort();
const CP_KEYS = ['name', 'distance_m', 'stop_s', 'cutoff_elapsed_s', 'cutoff_kind'].sort();
const CELL_KEYS = ['start_m', 'end_m', 'horizontal_m', 'elevation_start_m', 'elevation_end_m', 'grade'].sort();
const TIMELINE_KEYS = ['start_m', 'end_m', 'moving_s', 'cumulative_moving_s', 'weight', 'minimum_s', 'maximum_s', 'mode'].sort();
const reject = reason => ({status: 'unavailable', reason});
const finite = Number.isFinite;
const own = (x, key) => Object.hasOwn(x, key);
const same = (a, b) => canonical(a) === canonical(b);

// Stable value identity, not a security hash. Route digests come from the core.
function canonical(value, seen = new Set()) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && finite(value)) return Object.is(value, -0) ? '-0' : String(value);
  if (typeof value !== 'object' || seen.has(value)) throw new TypeError('Only finite JSON data is supported.');
  const proto = Object.getPrototypeOf(value);
  if ((!Array.isArray(value) && proto !== Object.prototype && proto !== null) || Object.getOwnPropertySymbols(value).length) throw new TypeError('Plain data required.');
  seen.add(value);
  const result = Array.isArray(value)
    ? '[' + Array.from(value, v => canonical(v, seen)).join(',') + ']'
    : '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k], seen)).join(',') + '}';
  seen.delete(value);
  return result;
}
const copy = value => JSON.parse(canonical(value));
function frozen(value) {
  for (const child of Object.values(value)) if (child !== null && typeof child === 'object') frozen(child);
  return Object.freeze(value);
}
const revision = value => (Number.isSafeInteger(value) && value >= 0) || (typeof value === 'string' && value.length > 0 && value.length <= 200);
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

export function parseGoalClock(text) {
  if (typeof text !== 'string') return null;
  const match = /^(\d{1,3}):([0-5]\d):([0-5]\d)$/.exec(text.trim());
  return match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) : null;
}
export function formatGoalClock(seconds) {
  if (!Number.isSafeInteger(seconds) || seconds < 0 || seconds > UI_MAX_TARGET_S) return null;
  return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function completeSettings(settings) {
  if (!settings || !same(Object.keys(settings).sort(), SETTING_KEYS)) return false;
  if (!NUMERIC_SETTINGS.every(k => finite(settings[k])) || !CONSENTS.every(k => typeof settings[k] === 'boolean')) return false;
  if (!Array.isArray(settings.checkpoints) || settings.checkpoints.length > 100) return false;
  return settings.checkpoints.every(cp => cp && same(Object.keys(cp).sort(), CP_KEYS)
    && typeof cp.name === 'string' && cp.name.trim().length > 0
    && finite(cp.distance_m) && finite(cp.stop_s) && cp.stop_s >= 0
    && (cp.cutoff_elapsed_s === null || finite(cp.cutoff_elapsed_s))
    && ['arrival', 'departure'].includes(cp.cutoff_kind));
}

/** Capture this BEFORE the failing core request, not when its response arrives. */
export function captureGoalSnapshot(input) {
  try {
    const x = copy(input);
    if (x.mode !== 'goal' || !digest(x.route?.route_sha256) || !digest(x.route?.geometry_sha256)
      || !['route', 'settings', 'checkpoints'].every(k => revision(x.revisions?.[k]))
      || !completeSettings(x.settings)
      || parseGoalClock(x.targetText) !== x.settings.target_elapsed_s) return null;
    return frozen({schema: SCHEMA, mode: 'goal', route: x.route, revisions: x.revisions,
      targetText: x.targetText, settings: x.settings});
  } catch { return null; }
}

function currentMatches(snapshot, current) {
  const original = captureGoalSnapshot(snapshot), live = captureGoalSnapshot(current);
  return original !== null && live !== null && same(original, live);
}

function numericBounds(error, snapshot) {
  const d = error?.details;
  if (!['infeasible_target', 'stops_exceed_target'].includes(error?.code)) return reject('unsupported_error');
  if (d?.constraint_conflict === true) return reject('constraint_conflict');
  if (d?.kind !== 'goal_time_bounds' || d.constraint_conflict !== false
    || !['target_elapsed_s', 'stops_s', 'moving_s', 'minimum_moving_s', 'minimum_target_s'].every(k => finite(d[k]))
    || !own(d, 'maximum_moving_s') || !own(d, 'maximum_target_s')) return reject('bounds_missing_or_invalid');
  const {target_elapsed_s: target, stops_s: stops, moving_s: moving,
    minimum_moving_s: lower, maximum_moving_s: upper} = d;
  if (target <= 0 || target > CORE_MAX_TARGET_S || stops < 0 || lower <= 0
    || (upper !== null && (!finite(upper) || upper <= 0 || !finite(d.maximum_target_s)))) return reject('bounds_missing_or_invalid');
  if (upper !== null && lower > upper) return reject('constraint_conflict');
  if (target !== snapshot.settings.target_elapsed_s || moving !== target - stops
    || d.minimum_target_s !== lower + stops
    || (upper === null ? d.maximum_target_s !== null : d.maximum_target_s !== upper + stops)) return reject('bounds_mismatch');
  if (error.code === 'stops_exceed_target' ? moving > 0 : !(moving > 0 && (moving < lower || (upper !== null && moving > upper)))) return reject('error_bounds_mismatch');
  return {status: 'bounds', details: copy(d)};
}

/** Produce only a candidate. No promise of success is made from rounded bounds. */
export function createGoalTargetCandidate({error, snapshot} = {}, current) {
  try {
    if (!currentMatches(snapshot, current)) return reject('stale_or_missing_snapshot');
    const checked = numericBounds(error, snapshot);
    if (checked.status !== 'bounds') return checked;
    const d = checked.details;
    let first = Math.max(1, Math.ceil(d.minimum_target_s));
    let last = Math.min(CORE_MAX_TARGET_S, UI_MAX_TARGET_S,
      d.maximum_target_s === null ? CORE_MAX_TARGET_S : Math.floor(d.maximum_target_s));
    // Add/subtract are not inverse at an IEEE-754 boundary. Retest the exact
    // expression consumed by create_plan; never add tolerance to a core bound.
    while (first <= last && (!(first - d.stops_s > 0) || first - d.stops_s < d.minimum_moving_s)) first += 1;
    while (last >= first && d.maximum_moving_s !== null && last - d.stops_s > d.maximum_moving_s) last -= 1;
    if (first > last) return reject('no_representable_integer_target');
    const after = Math.min(last, Math.max(first, snapshot.settings.target_elapsed_s));
    const moving = after - d.stops_s;
    if (!Number.isSafeInteger(after) || !(moving > 0) || moving < d.minimum_moving_s
      || (d.maximum_moving_s !== null && moving > d.maximum_moving_s)
      || after === snapshot.settings.target_elapsed_s) return reject('no_valid_change');
    const candidate = {schema: SCHEMA, snapshot: copy(snapshot),
      failure: {code: error.code, details: d},
      change: {field: 'target', setting: 'target_elapsed_s', before: snapshot.targetText,
        beforeSeconds: snapshot.settings.target_elapsed_s, after: formatGoalClock(after), afterSeconds: after},
      settings: {...copy(snapshot.settings), target_elapsed_s: after},
      interval: {firstSeconds: first, lastSeconds: last},
      verification: 'requires_exact_core_preflight'};
    candidate.key = canonical(candidate);
    return frozen({status: 'candidate', candidate});
  } catch { return reject('invalid_input'); }
}

function authenticCandidate(candidate, current) {
  if (!candidate?.snapshot || !candidate?.failure) return null;
  const generated = createGoalTargetCandidate({error: candidate.failure, snapshot: candidate.snapshot}, current);
  return generated.status === 'candidate' && same(generated.candidate, candidate) ? generated.candidate : null;
}

function matchesCoreInput(settings, input, routeDistance) {
  if (!input || !same(Object.keys(input).sort(), SETTING_KEYS)
    || !NUMERIC_SETTINGS.every(k => input[k] === settings[k])
    || !CONSENTS.every(k => input[k] === settings[k]) || !Array.isArray(input.checkpoints)) return false;
  const cps = settings.checkpoints.map(cp => ({...cp, name: cp.name.trim()}));
  if (!cps.length || cps.at(-1).distance_m !== routeDistance) cps.push({name: '終點', distance_m: routeDistance,
    stop_s: 0, cutoff_elapsed_s: null, cutoff_kind: 'arrival'});
  return same(input.checkpoints, cps);
}

// A compensated sum only checks receipt conservation. It is not an allocator
// or a replacement for the Python core's math.fsum or exact speed-bound checks.
function checkedSum(values) {
  let sum = 0, correction = 0;
  for (const value of values) {
    const next = sum + value;
    correction += Math.abs(sum) >= Math.abs(value) ? (sum - next) + value : (value - next) + sum;
    sum = next;
  }
  return sum + correction;
}

function matchesCoreEvidence(p) {
  if (!Object.entries(CORE_VERSIONS).every(([key, version]) => p[key] === version)
    || p.route?.geometry_version !== CORE_VERSIONS.geometry_version
    || !finite(p.route.distance_m) || p.route.distance_m <= 0
    || !finite(p.exact_conservation_error_s)
    || !Array.isArray(p.canonical_timeline) || !p.canonical_timeline.length
    || p.canonical_timeline.length > 100000 || !Array.isArray(p.geometry_snapshot)
    || p.geometry_snapshot.length !== p.canonical_timeline.length) return false;
  const times = [], lower = [], upper = [];
  let previousEnd = 0, previousCumulative = 0;
  for (let i = 0; i < p.canonical_timeline.length; i++) {
    const t = p.canonical_timeline[i], g = p.geometry_snapshot[i];
    if (!t || !g || !same(Object.keys(t).sort(), TIMELINE_KEYS) || !same(Object.keys(g).sort(), CELL_KEYS)
      || !['start_m', 'end_m', 'moving_s', 'cumulative_moving_s', 'weight', 'minimum_s'].every(k => finite(t[k]))
      || !['start_m', 'end_m', 'horizontal_m'].every(k => finite(g[k]))
      || !['grade', 'elevation_start_m', 'elevation_end_m'].every(k => g[k] === null || finite(g[k]))
      || t.start_m !== previousEnd || !(t.end_m > t.start_m)
      || g.start_m !== t.start_m || g.end_m !== t.end_m || !(g.horizontal_m > 0)
      || !(t.moving_s > 0) || !(t.weight > 0) || t.minimum_s < 0 || t.moving_s < t.minimum_s
      || (t.maximum_s !== null && (!finite(t.maximum_s) || t.maximum_s < t.minimum_s || t.moving_s > t.maximum_s))
      || (t.maximum_s === null) !== (p.constraints.maximum_moving_s === null)
      || t.cumulative_moving_s !== previousCumulative + t.moving_s
      || !['walk_cap_scenario', 'run_scenario'].includes(t.mode)) return false;
    times.push(t.moving_s); lower.push(t.minimum_s);
    if (t.maximum_s !== null) upper.push(t.maximum_s);
    previousEnd = t.end_m; previousCumulative = t.cumulative_moving_s;
  }
  if (previousEnd !== p.route.distance_m) return false;
  // The production continuous solver permits a 1e-9 relative moving-time
  // residue. Addition of stops introduces ordinary double rounding; neither
  // tolerance is ever applied to individual or candidate speed bounds.
  const rounding = 8 * Number.EPSILON * Math.max(1, p.target_elapsed_s, p.stops_s);
  const conservationLimit = 1e-9 * Math.max(1, p.moving_s) + rounding;
  const total = checkedSum(times), residue = total + p.stops_s - p.target_elapsed_s;
  if (![total, residue].every(finite)
    || Math.abs(total - p.moving_s) > conservationLimit
    || Math.abs(p.exact_conservation_error_s) > conservationLimit
    || Math.abs(residue - p.exact_conservation_error_s) > rounding) return false;
  const agrees = (values, expected) => Math.abs(checkedSum(values) - expected)
    <= 8 * Number.EPSILON * Math.max(1, Math.abs(expected));
  return agrees(lower, p.constraints.minimum_moving_s)
    && (p.constraints.maximum_moving_s === null || agrees(upper, p.constraints.maximum_moving_s));
}

/**
 * Caller runs engine.request('plan', {gpx_b64: unchangedRoute, settings: candidate.settings}).
 * Keep candidate.key beside that specific in-flight request. Never attach a new
 * key to an old response. Re-capture current before calling this pure validator.
 */
export function validateGoalTargetCandidate(candidate, current, receipt) {
  try {
    if (!authenticCandidate(candidate, current)) return reject('stale_or_changed_candidate');
    if (receipt?.candidateKey !== candidate.key) return reject('wrong_core_request');
    if (receipt.response?.ok !== true) return reject(receipt.response?.error?.code === 'invalid_speed_bounds'
      ? 'constraint_conflict' : 'core_rejected_candidate');
    const p = receipt.response.result, d = candidate.failure.details;
    if (!p || p.purpose !== 'goal_scenario_allocation' || p.ability_prediction !== 'not_implemented'
      || p.route?.route_sha256 !== candidate.snapshot.route.route_sha256
      || p.route?.geometry_sha256 !== candidate.snapshot.route.geometry_sha256
      || p.target_elapsed_s !== candidate.change.afterSeconds || p.stops_s !== d.stops_s
      || p.moving_s !== candidate.change.afterSeconds - d.stops_s
      || p.constraints?.minimum_moving_s !== d.minimum_moving_s
      || p.constraints?.maximum_moving_s !== d.maximum_moving_s
      || p.constraints?.exact_bounds_satisfied !== true
      || p.constraints?.continuous_speed_bounds_satisfied !== true
      || p.constraints?.cutoff_guarantee !== false
      || !matchesCoreInput(candidate.settings, p.input, p.route.distance_m)
      || !matchesCoreEvidence(p)
      || !Array.isArray(p.warnings)) return reject('core_result_mismatch');
    // Retain only the matching response fields needed for an apply-time check.
    // This is an in-memory consistency receipt, not an external trust boundary.
    const coreResult = Object.fromEntries(['purpose', 'ability_prediction', 'target_elapsed_s',
      'stops_s', 'moving_s', 'input', 'constraints', 'warnings', ...Object.keys(CORE_VERSIONS),
      'exact_conservation_error_s', 'canonical_timeline', 'geometry_snapshot'].map(k => [k, copy(p[k])]));
    coreResult.route = {route_sha256: p.route.route_sha256,
      geometry_sha256: p.route.geometry_sha256, distance_m: p.route.distance_m,
      geometry_version: p.route.geometry_version};
    const proposal = {schema: SCHEMA, candidate: copy(candidate), verification: 'exact_core_preflight_passed',
      coreReceipt: {candidateKey: candidate.key, response: {ok: true, result: coreResult}},
      label: '帶入可計算目標',
      explanation: '已確認此目標可在目前速度限制下分配時間；這不是個人能力預測，也不保證每站通過關門。',
      warnings: copy(p.warnings), requiresCoreRecalculation: true};
    return frozen({status: 'proposal', proposal});
  } catch { return reject('invalid_core_receipt'); }
}

/** Called only from the user's explicit Apply action. Returns new data only. */
export function prepareGoalTargetApplication(proposal, current) {
  try {
    if (proposal?.schema !== SCHEMA || proposal.verification !== 'exact_core_preflight_passed'
      || proposal.requiresCoreRecalculation !== true || !authenticCandidate(proposal.candidate, current)) return reject('stale_or_invalid_proposal');
    const verified = validateGoalTargetCandidate(proposal.candidate, current, proposal.coreReceipt);
    if (verified.status !== 'proposal' || !same(verified.proposal, proposal)) return reject('missing_or_changed_core_verification');
    return frozen({status: 'ready', targetText: proposal.candidate.change.after,
      settings: copy(proposal.candidate.settings), requiresCoreRecalculation: true});
  } catch { return reject('invalid_proposal'); }
}
