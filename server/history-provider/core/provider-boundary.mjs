import { HistoryError, classifyActivity } from './normalize.mjs';

export const PROVIDER_LIMITS = Object.freeze({ maxNormalizedBytes: 16 * 1024 * 1024, maxNormalizedNodes: 1_500_000 });
export const DETAIL_BINDING_FIELDS = Object.freeze(['id', 'icu_athlete_id', 'source', 'type', 'start_date',
  'start_date_local', 'timezone', 'distance', 'moving_time', 'elapsed_time', 'race', 'sub_type',
  'device_name', 'icu_ignore_time', 'ignore_pace', 'recording_stops', 'stream_types']);
export const SUMMARY_OBSERVATION_FIELDS = Object.freeze(['start_date', 'start_date_local', 'timezone', 'elapsed_time',
  'moving_time', 'icu_ignore_time', 'ignore_pace', 'race', 'sub_type']);
const stringFields = new Set(['id', 'icu_athlete_id', 'source', 'type', 'name', 'start_date', 'start_date_local', 'timezone', 'sub_type', 'device_name']);
const boolFields = new Set(['race', 'icu_ignore_time', 'ignore_pace']);
const encoder = new TextEncoder();
const firstSupportedInstant = -62_135_596_800_000_000n; // 0001-01-01T00:00:00Z
const afterLastSupportedInstant = 253_402_300_800_000_000n; // 10000-01-01T00:00:00Z
export async function digestBytes(bytes) {
  if (!(bytes instanceof Uint8Array) || !globalThis.crypto?.subtle) throw new HistoryError('integrity_runtime_unavailable', 503);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(v => v.toString(16).padStart(2, '0')).join('');
}
/** Bounded field observations, preserving omitted/null and never traversing unknown objects. */
export function observeFields(activity, fields) {
  const out = {};
  for (const key of fields) {
    if (!Object.hasOwn(activity, key)) { out[key] = { state: 'omitted', value: null }; continue; }
    const value = activity[key];
    if (value === null) { out[key] = { state: 'null', value: null }; continue; }
    let valid = stringFields.has(key) ? typeof value === 'string' && value.length <= 4096 :
      boolFields.has(key) ? typeof value === 'boolean' : typeof value === 'number' && Number.isFinite(value);
    let copied = value;
    if (key === 'stream_types' || key === 'recording_stops') {
      const maximum = key === 'stream_types' ? 128 : 50_000;
      valid = Array.isArray(value) && value.length <= maximum;
      copied = [];
      if (valid) for (let i = 0; i < value.length; i++) {
        const item = Object.getOwnPropertyDescriptor(value, String(i));
        if (!item || !Object.hasOwn(item, 'value') || (key === 'stream_types' ?
          typeof item.value !== 'string' || item.value.length > 128 : typeof item.value !== 'number' || !Number.isFinite(item.value))) { valid = false; break; }
        copied.push(item.value);
      }
    }
    out[key] = valid ? { state: 'valid', value: copied } : { state: 'invalid', value: null, invalidType: typeof value };
  }
  return out;
}
export const sameObservations = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function utcStart(value) {
  if (typeof value !== 'string' || value.length > 128) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})$/u.exec(value);
  if (!m || m[8] === '-00:00') return null;
  const [year, month, day, hour, minute, second] = m.slice(1, 7).map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return null;
  const d = new Date(0); d.setUTCFullYear(year, month - 1, day); d.setUTCHours(hour, minute, second, 0);
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  let offset = 0;
  if (m[8] !== 'Z') {
    const h = Number(m[8].slice(1, 3)), n = Number(m[8].slice(4));
    if (h > 14 || n > 59 || h === 14 && n !== 0) return null;
    offset = (m[8][0] === '-' ? -1 : 1) * (h * 60 + n);
  }
  return BigInt(d.getTime()) * 1000n + BigInt((m[7] || '').padEnd(6, '0') || '0') - BigInt(offset) * 60_000_000n;
}
function utcText(microseconds) {
  const remainder = microseconds % 1_000_000n;
  // Supported calendar years start at 1, so this branch also handles pre-1970 instants.
  const second = microseconds >= 0n || remainder === 0n ? microseconds - remainder : microseconds - remainder - 1_000_000n;
  const fraction = microseconds - second;
  return new Date(Number(second / 1000n)).toISOString().replace(/\.000Z$/u, '.' + String(fraction).padStart(6, '0') + 'Z');
}
function observedMicroseconds(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  const m = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/u.exec(String(value));
  if (!m) return null;
  const scale = (m[2] || '').length - Number(m[3] || 0);
  if (scale > 6 || scale < -308) return null;
  return BigInt(m[1] + (m[2] || '')) * 10n ** BigInt(6 - scale);
}
export function coverageFor(activity, normalized) {
  const samples = normalized.samples, elapsed = normalized.metadata.elapsedTimeS;
  const first = samples[0]?.elapsedS ?? null, last = samples.at(-1)?.elapsedS ?? null;
  const known = typeof elapsed === 'number' && Number.isFinite(elapsed);
  const exact = known && samples.length >= 2 && first === 0 && last === elapsed;
  const temporalBlocks = normalized.quality.filter(q => q.blocksFitness &&
    /time|recording|stream|gps|disconnected|started|ended/iu.test(q.code)).map(q => q.code);
  const complete = exact && temporalBlocks.length === 0;
  const start = utcStart(activity.start_date);
  const firstMicros = observedMicroseconds(first), lastMicros = observedMicroseconds(last);
  // Preserve a positively known observed span even when a declared tail is missing.
  // This span does not fill the tail or prove complete whole-activity timing.
  const observedStart = start !== null && firstMicros !== null ? start + firstMicros : null;
  const observedEnd = start !== null && lastMicros !== null ? start + lastMicros : null;
  const interval = observedStart !== null && observedEnd !== null && observedEnd > observedStart &&
    observedStart >= firstSupportedInstant && observedEnd < afterLastSupportedInstant ?
    { start: observedStart, end: observedEnd } : null;
  return { public: {
    timeState: !known || first === null ? 'unknown' : complete ? 'complete_exact_endpoints' : 'partial_or_conflicting',
    elapsedSummaryS: elapsed, firstObservedElapsedS: first, lastObservedElapsedS: last,
    missingHeadS: first, missingTailS: known && last !== null ? elapsed - last : null,
    temporalBlockingCodes: temporalBlocks, wholeRouteTimeScopeConfirmed: false,
    routeState: normalized.path === null ? 'unavailable' : normalized.path.segments.length === 1 ? 'single_recorded_segment' : 'disconnected_recorded_segments',
    intervalState: interval ? 'known_observed_recorded_span' : 'unknown',
    firstUtc: interval ? utcText(interval.start) : null, lastUtc: interval ? utcText(interval.end) : null,
    intervalBasis: 'Activity.start_date plus observed first/last time samples, at supported microsecond precision',
    fullActivityIntervalVerified: complete && interval !== null,
    movingTimeInferred: false, cpRestInferred: false,
  }, interval, structurallyEligible: normalized.eligibility.historicalPerformance && complete };
}
export function selectionAssessment(activities, coverages) {
  const reasons = [];
  for (let i = 0; i < activities.length; i++) if (!coverages[i].structurallyEligible) reasons.push({ code: 'record_not_structurally_complete', occurrenceIndices: [i] });
  for (let i = 0; i < activities.length; i++) for (let j = i + 1; j < activities.length; j++) {
    const a = coverages[i].interval, b = coverages[j].interval;
    if (a && b && a.start < b.end && b.start < a.end) reasons.push({ code: 'recorded_intervals_overlap', occurrenceIndices: [i, j] });
  }
  return { schemaVersion: 'intervals-selected-set-assessment-v1', uniqueActivityCount: activities.length,
    structuralMultipleReferenceEligibility: reasons.length === 0, reasons,
    unknownIntervalOccurrences: coverages.flatMap((c, i) => c.interval === null ? [i] : []),
    qualification: 'not_evaluated', performanceModelReady: false, abilityCoefficient: null,
    individualNormalizationPreserved: true };
}
export function classificationFor(activity, override) {
  return { originalClassification: classifyActivity(activity), selectedClassification: classifyActivity(activity, override),
    classificationSource: override === null ? 'upstream' : 'explicit_user_confirmation',
    highEffortReferenceConfirmed: false, wholeRouteTimeScopeConfirmed: false };
}
/** Exact JSON UTF-8 size before allocating a full serialized envelope; no truncation/projection. */
export function normalizedResourceUsage(value, { maxBytes = PROVIDER_LIMITS.maxNormalizedBytes, maxNodes = PROVIDER_LIMITS.maxNormalizedNodes, check = () => {} } = {}) {
  const stack = [value], seen = new Set(); let bytes = 0, nodes = 0;
  const charge = n => { bytes += n; if (bytes > maxBytes) throw new HistoryError('normalized_response_too_large', 413); };
  while (stack.length) {
    if (++nodes > maxNodes) throw new HistoryError('normalized_response_node_limit', 413);
    if ((nodes & 255) === 0) check();
    const v = stack.pop();
    if (v === null || typeof v === 'boolean' || typeof v === 'string' || typeof v === 'number') {
      if (typeof v === 'number' && !Number.isFinite(v)) throw new HistoryError('normalized_nonfinite_value', 502);
      charge(encoder.encode(JSON.stringify(v)).byteLength); continue;
    }
    if (!v || typeof v !== 'object' || seen.has(v)) throw new HistoryError('normalized_shape_invalid', 502);
    seen.add(v);
    if (Array.isArray(v)) {
      charge(2 + Math.max(0, v.length - 1));
      for (let i = 0; i < v.length; i++) { const d = Object.getOwnPropertyDescriptor(v, String(i)); if (!d || !Object.hasOwn(d, 'value')) throw new HistoryError('normalized_shape_invalid', 502); stack.push(d.value); }
    } else {
      if (Object.getPrototypeOf(v) !== Object.prototype && Object.getPrototypeOf(v) !== null) throw new HistoryError('normalized_shape_invalid', 502);
      const keys = Object.keys(v); charge(2 + Math.max(0, keys.length - 1));
      for (const k of keys) { const d = Object.getOwnPropertyDescriptor(v, k); if (!d || !Object.hasOwn(d, 'value')) throw new HistoryError('normalized_shape_invalid', 502); charge(encoder.encode(JSON.stringify(k)).byteLength + 1); stack.push(d.value); }
    }
  }
  check(); return { bytes, nodes };
}
export function normalizedByteLength(value, options) { return normalizedResourceUsage(value, options).bytes; }
