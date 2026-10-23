// Pure, bounded normalization. No I/O, credentials, fitness model or GPX rewrite.
export const LIMITS = Object.freeze({ maxPoints: 50_000, maxStreams: 12, maxElapsedSeconds: 259_200, maxDistanceM: 500_000, maxRecordingStops: 50_000 });
export const CLASSIFICATIONS = Object.freeze(['race', 'benchmark', 'easy', 'unclassified']);
export const SUPPORTED_SOURCE = 'ZEPP';
export class HistoryError extends Error {
  constructor(code, status = 422, retryAfter = null) {
    super(code); this.name = 'HistoryError'; this.code = code; this.status = status; this.retryAfter = retryAfter;
  }
}
export function validActivityId(id) { return typeof id === 'string' && /^[A-Za-z0-9_-]{1,96}$/.test(id); }
export function sourceVerdict(activity) {
  if (!activity || typeof activity !== 'object' || Array.isArray(activity)) return { allowed: false, reason: 'invalid_activity' };
  if (!activity.source) return { allowed: false, reason: 'unknown_provenance' };
  if (activity.source === 'STRAVA') return { allowed: false, reason: 'strava_restricted' };
  if (activity.source !== SUPPORTED_SOURCE) return { allowed: false, reason: 'source_not_enabled' };
  // Official terms identify Garmin-origin recordings through device_name, including uploaded files.
  if (typeof activity.device_name === 'string' && /garmin/i.test(activity.device_name)) return { allowed: false, reason: 'original_device_source_restricted' };
  if (!validActivityId(activity.id)) return { allowed: false, reason: 'invalid_activity_id' };
  if (!['Run', 'TrailRun'].includes(activity.type)) return { allowed: false, reason: 'unsupported_sport' };
  return { allowed: true, reason: null };
}
const finite = value => typeof value === 'number' && Number.isFinite(value);
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const label = value => typeof value === 'string' ? value.slice(0, 200) : null;
function observeSourceFields(activity) {
  const distance = Object.hasOwn(activity, 'distance') ? activity.distance : undefined;
  const stops = Object.hasOwn(activity, 'recording_stops') ? activity.recording_stops : undefined;
  const officialSummaryDistance = { state: distance === undefined ? 'omitted' : distance === null ? 'null' : 'valid',
    valueM: null, source: 'Activity.distance', invalidReason: null };
  if (officialSummaryDistance.state === 'valid') {
    if (!finite(distance)) officialSummaryDistance.invalidReason = 'not_finite_number';
    else if (distance < 0 || distance > LIMITS.maxDistanceM) officialSummaryDistance.invalidReason = 'out_of_bounds';
    else officialSummaryDistance.valueM = distance;
    if (officialSummaryDistance.invalidReason) officialSummaryDistance.state = 'invalid';
  }
  const recordingStops = { state: stops === undefined ? 'omitted' : stops === null ? 'null' : 'valid',
    raw: null, source: 'Activity.recording_stops', interpretation: 'uninterpreted', invalidReason: null };
  if (recordingStops.state === 'valid') {
    if (!Array.isArray(stops)) recordingStops.invalidReason = 'not_numeric_list';
    else if (stops.length > LIMITS.maxRecordingStops) recordingStops.invalidReason = 'too_many_values';
    else {
      const raw = [];
      for (let i = 0; i < stops.length; i++) {
        // Only own numeric data elements; no holes, inherited elements, getters or nested copying.
        const element = Object.getOwnPropertyDescriptor(stops, i);
        if (!element || !finite(element.value)) { recordingStops.invalidReason = 'not_finite_number'; break; }
        raw.push(element.value);
      }
      if (!recordingStops.invalidReason) recordingStops.raw = raw;
    }
    if (recordingStops.invalidReason) recordingStops.state = 'invalid';
  }
  return { schemaVersion: 'intervals-history-source-observations-v1', provider: 'Intervals.icu',
    officialSummaryDistance, recordingStops, knownStops: null,
    identity: { provider: 'Intervals.icu', activityId: validActivityId(activity.id) ? activity.id : null,
      verification: 'not_verified_by_normalizer' } };
}
export function classifyActivity(activity, override = null) {
  if (override !== null && !CLASSIFICATIONS.includes(override)) throw new HistoryError('invalid_classification', 400);
  return override ?? ((activity.race === true || activity.sub_type === 'RACE') ? 'race' : 'unclassified');
}
export function normalizeActivity(activity, streams, { classification = null } = {}) {
  const quality = [];
  const note = (code, severity, blocksFitness = false, detail = {}) => quality.push({ code, severity, blocksFitness, ...detail });
  if (!record(activity)) throw new HistoryError('invalid_activity');
  const provenance = sourceVerdict(activity);
  const result = {
    schemaVersion: 'intervals-history-v1', status: 'rejected',
    metadata: { name: label(activity.name), sport: label(activity.type), startDateLocal: label(activity.start_date_local),
      classification: classifyActivity(activity, classification), elapsedTimeS: null, movingTimeS: null, pauseTimeS: null },
    provenance: { provider: 'Intervals.icu', upstreamSource: label(activity.source), known: Boolean(activity.source),
      supported: provenance.allowed, rightsGuarantee: false },
    quality, samples: [], path: null,
    eligibility: { routeGeometry: false, historicalPerformance: false, fitnessCoefficient: false },
    sourceObservations: observeSourceFields(activity),
  };
  if (!provenance.allowed) { note(provenance.reason, 'error', true); return result; }
  for (const [field, target] of [['elapsed_time', 'elapsedTimeS'], ['moving_time', 'movingTimeS']]) {
    if (activity[field] == null) note(`missing_${field}`, 'warning', true);
    else if (!finite(activity[field]) || activity[field] < 0 || activity[field] > LIMITS.maxElapsedSeconds) note(`invalid_${field}`, 'error', true);
    else result.metadata[target] = activity[field];
  }
  const { elapsedTimeS, movingTimeS } = result.metadata;
  if (elapsedTimeS !== null && movingTimeS !== null) {
    if (movingTimeS > elapsedTimeS) note('moving_exceeds_elapsed', 'error', true);
    else result.metadata.pauseTimeS = elapsedTimeS - movingTimeS;
  }
  if (activity.icu_ignore_time === true || activity.ignore_pace === true) note('activity_time_or_pace_ignored', 'warning', true);
  const stopsObservation = result.sourceObservations.recordingStops;
  if (stopsObservation.state === 'invalid') note('invalid_recording_stops', 'warning', true);
  else if (stopsObservation.raw?.length) note('recording_stops_present_uninterpreted', 'warning', true);
  if (!Array.isArray(streams)) { note('missing_streams', 'error', true); return result; }
  if (streams.length > LIMITS.maxStreams) throw new HistoryError('too_many_streams');
  const selected = new Map();
  const wanted = new Set(['time', 'latlng', 'distance', 'altitude', 'moving']);
  for (const stream of streams) {
    if (!record(stream) || typeof stream.type !== 'string') throw new HistoryError('invalid_stream_shape');
    // Duplicates fail closed even if the duplicated stream was not requested.
    if (selected.has(stream.type)) { note('duplicate_stream_type', 'error', true, { stream: label(stream.type) }); return result; }
    selected.set(stream.type, stream);
    if (Array.isArray(stream.data) && stream.data.length > LIMITS.maxPoints || Array.isArray(stream.data2) && stream.data2.length > LIMITS.maxPoints)
      throw new HistoryError('invalid_or_oversize_stream');
    if (!wanted.has(stream.type)) continue;
    if (stream.valueTypeIsArray === true) { note('unsupported_array_valued_stream', 'error', true, { stream: stream.type }); return result; }
    if (stream.allNull === true && stream.data == null) continue;
    if (!Array.isArray(stream.data) || stream.data.length > LIMITS.maxPoints) throw new HistoryError('invalid_or_oversize_stream');
    if (stream.type === 'latlng' && (!Array.isArray(stream.data2) || stream.data2.length > LIMITS.maxPoints)) {
      note('missing_longitude_stream', 'error', true); return result;
    }
    if (Array.isArray(stream.anomalies) && stream.anomalies.length) note('upstream_stream_repaired', 'warning', true, { stream: stream.type });
  }
  const data = type => selected.get(type)?.data;
  const time = data('time'), lat = data('latlng'), lon = selected.get('latlng')?.data2;
  const distance = data('distance'), altitude = data('altitude'), moving = data('moving');
  for (const [type, values] of [['time', time], ['latlng', lat], ['distance', distance]]) {
    if (!Array.isArray(values) || values.length < 2) note(`missing_${type}_stream`, 'error', true);
  }
  if (quality.some(q => q.severity === 'error')) return result;
  const count = time.length;
  for (const [type, values] of [['latitude', lat], ['longitude', lon], ['distance', distance], ['altitude', altitude], ['moving', moving]]) {
    if (values != null && (!Array.isArray(values) || values.length !== count)) note('stream_length_mismatch', 'error', true, { stream: type });
  }
  if (quality.some(q => q.severity === 'error')) return result;
  let previous = null, duplicateCount = 0, irregularCount = 0, missingCoordinates = 0, missingAltitude = 0, gapCount = 0;
  let segment = [], segments = [];
  const flush = () => { if (segment.length) segments.push(segment); segment = []; };
  for (let i = 0; i < count; i++) {
    const t = time[i], d = distance[i], a = altitude?.[i] ?? null, m = moving?.[i] ?? null;
    if (!finite(t) || t < 0 || t > LIMITS.maxElapsedSeconds || !finite(d) || d < 0 || d > LIMITS.maxDistanceM) {
      note('invalid_time_or_distance', 'error', true, { index: i }); break;
    }
    if (a !== null && (!finite(a) || a < -1000 || a > 10000)) { note('invalid_altitude', 'error', true, { index: i }); break; }
    if (m !== null && typeof m !== 'boolean') { note('invalid_moving_flag', 'error', true, { index: i }); break; }
    const coordinatesMissing = lat[i] == null || lon[i] == null;
    if (lat[i] != null && (!finite(lat[i]) || lat[i] < -90 || lat[i] > 90) || lon[i] != null && (!finite(lon[i]) || lon[i] < -180 || lon[i] > 180)) {
      note('invalid_coordinate', 'error', true, { index: i }); break;
    }
    const sample = { elapsedS: t, distanceM: d, lat: coordinatesMissing ? null : lat[i], lon: coordinatesMissing ? null : lon[i], ele: a, moving: m };
    if (previous) {
      if (t < previous.elapsedS) { note('time_decreases', 'error', true, { index: i }); break; }
      if (d < previous.distanceM) { note('distance_decreases', 'error', true, { index: i }); break; }
      if (t === previous.elapsedS) {
        if (Object.keys(sample).every(key => sample[key] === previous[key])) { duplicateCount++; continue; }
        note('conflicting_duplicate_time', 'error', true, { index: i }); break;
      }
      if (t - previous.elapsedS !== 1) irregularCount++;
      // Preserve pauses and gaps. Never interpolate a missing GPS fix or invent elapsed time.
      if (t - previous.elapsedS > 30) { gapCount++; flush(); }
    }
    result.samples.push(sample);
    if (coordinatesMissing) { missingCoordinates++; flush(); }
    else segment.push({ lat: sample.lat, lon: sample.lon, ele: sample.ele });
    if (a === null) missingAltitude++;
    previous = sample;
  }
  flush();
  if (quality.some(q => q.severity === 'error')) { result.samples = []; return result; }
  if (duplicateCount) note('identical_samples_deduplicated', 'info', false, { count: duplicateCount });
  if (irregularCount) note('non_1hz_sampling', 'info', false, { count: irregularCount });
  if (gapCount) note('recording_time_gaps', 'warning', true, { count: gapCount });
  if (missingCoordinates) note('missing_gps_fixes', 'warning', true, { count: missingCoordinates });
  if (missingAltitude) note('missing_elevation', 'warning', true, { count: missingAltitude });
  if (!moving) note('missing_moving_stream', 'info');
  if (result.samples.length < 2) { note('insufficient_unique_samples', 'error', true); result.samples = []; return result; }
  if (result.samples[0].elapsedS !== 0) note('recording_started_late', 'warning', true);
  if (result.samples[0].distanceM !== 0) note('distance_has_nonzero_origin', 'warning', true);
  const last = result.samples.at(-1);
  if (elapsedTimeS !== null && last.elapsedS > elapsedTimeS) note('stream_exceeds_elapsed_summary', 'error', true);
  if (elapsedTimeS !== null && elapsedTimeS - last.elapsedS > Math.max(5, elapsedTimeS * .02)) note('recording_ended_early', 'warning', true);
  if (activity.distance != null && (!finite(activity.distance) || activity.distance < 0 || activity.distance > LIMITS.maxDistanceM)) note('invalid_distance_summary', 'error', true);
  if (finite(activity.distance) && Math.abs(activity.distance - last.distanceM) > Math.max(50, activity.distance * .02)) note('distance_summary_mismatch', 'warning', true);
  const distinctCoordinates = result.samples.some((s, i) => i && s.lat !== null && result.samples[i - 1].lat !== null &&
    (s.lat !== result.samples[i - 1].lat || s.lon !== result.samples[i - 1].lon));
  if (last.distanceM <= result.samples[0].distanceM || !distinctCoordinates) note('zero_length_activity', 'error', true);
  if (segments.length > 1) note('disconnected_path_segments', 'warning', true, { count: segments.length });
  result.path = { format: 'route-points-v1', segments, pointCount: segments.reduce((n, s) => n + s.length, 0) };
  result.eligibility.routeGeometry = !quality.some(q => q.severity === 'error') && segments.length === 1 && segments[0].length >= 2;
  result.eligibility.historicalPerformance = result.eligibility.routeGeometry && !quality.some(q => q.blocksFitness);
  result.status = quality.some(q => q.severity === 'error') ? 'rejected' : result.eligibility.historicalPerformance ? 'usable' : 'limited';
  if (result.status === 'rejected') { result.samples = []; result.path = null; }
  // Nothing in this adapter estimates/averages a fitness or ability coefficient.
  return result;
}
