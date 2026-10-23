import {hikingReferenceProvenance} from './hiking-reference.mjs';
import {stationClockWorkoutSourceCurrent,validateStationClockWorkoutSource} from './station-clock-workout-source.mjs';
import {validateProviderReceipt} from './intervals-provider-receipt.mjs';
import {validateHistorySelectionReceipt} from './history-selection-receipt.mjs';
import {parseHistoryJson,HISTORY_CAPS} from './history-selection-contract.mjs';
import {parseCpStopValue} from './cp-stop-seconds.mjs';
import {validateManualClockReceipt} from './manual-clock-receipt.mjs';
/**
 * Pure, read-only conversion of an existing complete planning result.
 * Internal units: meters and seconds; targets use MOVING time only.
 * No model calculation, HTTP, storage, clipboard or download side effects.
 */
export const WORKOUT_EXPORT_VERSION = 'intervals-distance-workout/1.0';
export const WORKOUT_SYNTAX_SOURCES = Object.freeze([
  'https://forum.intervals.icu/t/workout-builder/1163',
  'https://forum.intervals.icu/t/distanced-based-workouts-supported/9973',
  'https://forum.intervals.icu/t/specify-workouts-using-absolute-pace/115846',
]);
const near = (a, b) => Math.abs(a - b) <= Math.max(1e-7, 1e-9 * Math.max(Math.abs(a), Math.abs(b)));
export class WorkoutExportError extends Error {
  constructor(code, message, details) { super(message); this.name = 'WorkoutExportError'; this.code = code; if(details) this.details = Object.freeze(details); }
}
const requireThat = (ok, code, message) => { if (!ok) throw new WorkoutExportError(code, message); };
const finite = (value, name) => {
  requireThat(typeof value === 'number' && Number.isFinite(value), 'invalid_number', `${name} must be finite.`);
  return value;
};
const positive = (value, name) => {
  finite(value, name); requireThat(value > 0, 'nonpositive_movement', `${name} must be positive.`); return value;
};
const nonnegative = (value, name) => {
  finite(value, name); requireThat(value >= 0, 'negative_value', `${name} cannot be negative.`); return value;
};
const rounded = (value, name) => {
  const n = Math.round(finite(value, name));
  requireThat(Number.isSafeInteger(n), 'numeric_range', `${name} cannot be represented safely.`);
  return n;
};
const sameNumber = (actual, expected, name) => {
  finite(actual, name); requireThat(near(actual, expected), 'inconsistent_result', `${name} disagrees with the complete result.`);
};
const humanText = (value) => String(value ?? '').replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/gu, ' ').replace(/\s+/gu, ' ').trim();
const paceText = n => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
const clock = value => {
  const n = rounded(value, 'display duration');
  return `${Math.floor(n / 3600)}:${String(Math.floor(n / 60) % 60).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
};
const compensatedSum = values => {
  let total = 0, correction = 0;
  for (const value of values) { const y = value - correction, next = total + y; correction = (next - total) - y; total = next; }
  return total;
};

function optionsFor(options) {
  requireThat(options && typeof options === 'object' && !Array.isArray(options), 'invalid_options', 'Options must be an object.');
  requireThat(Object.keys(options).every(key => ['mode', 'paceToleranceSeconds', 'mergeSmallFlatSegments','stopMode'].includes(key)), 'invalid_options', 'Unknown export option.');
  const mode = options.mode ?? 'terrain';
  requireThat(['terrain', 'checkpoint-sections'].includes(mode), 'invalid_options', 'Use terrain or checkpoint-sections mode.');
  const tolerance = options.paceToleranceSeconds ?? 0;
  requireThat(Number.isSafeInteger(tolerance) && tolerance >= 0, 'invalid_options', 'Pace tolerance must be a nonnegative integer in seconds per km.');
  const merge = options.mergeSmallFlatSegments ?? false;
  if (merge !== false) {
    requireThat(merge && typeof merge === 'object' && !Array.isArray(merge), 'invalid_options', 'Flat merging requires an explicit policy object.');
    requireThat(Object.keys(merge).sort().join(',') === ['maximumMergedM', 'maximumPaceDeltaSecondsPerKm', 'smallSegmentM'].sort().join(','), 'invalid_options', 'Specify all three flat-merge thresholds; unknown fields are not accepted.');
    for (const [key, value] of Object.entries(merge)) nonnegative(value, key);
    requireThat(merge.smallSegmentM > 0 && merge.maximumMergedM >= merge.smallSegmentM, 'invalid_options', 'Merge distances must be positive and consistent.');
  }
  const stopMode=options.stopMode===undefined?'omit':options.stopMode;
  requireThat(['omit','planned-duration'].includes(stopMode),'invalid_options','Use omit or planned-duration stops.');
  return { mode, tolerance, merge, stopMode };
}

function validateInput(input) {
  requireThat(input && typeof input === 'object', 'no_result', 'A completed result is required.');
  checkWorkoutResourceBounds(input);
  const { plan, terrainRows, route, current } = input;
  hikingReferenceProvenance(plan);
  const selected=validateSelectedSource(input);
  const station=plan?.purpose==='station_clock_comparison'?validateStationClockWorkoutSource(input.stationClockContext,plan):null;
  requireThat(current === true, 'stale_result', 'The owner must confirm this result is still current after all edits.');
  requireThat(plan && typeof plan === 'object', 'no_result', 'A completed plan or prediction is required.');
  requireThat(route && route.blocked === false, 'blocked_route', 'A current, unblocked route is required; raw-only routes cannot be exported.');
  requireThat(plan.route?.blocked !== true && plan.target?.blocked !== true && plan.blocked !== true, 'blocked_route', 'The result contains a blocked route.');
  for (const candidate of [route, plan.route, plan.target, plan]) {
    if (candidate?.quality !== undefined) {
      requireThat(Array.isArray(candidate.quality), 'inconsistent_result', 'Route quality must be an array.');
      requireThat(!candidate.quality.some(issue => issue?.severity === 'error'), 'blocked_route', 'Route quality contains an unresolved error.');
    }
  }
  requireThat(plan.complete !== false && plan.status !== 'hybrid_scenario_partial', 'partial_result', 'Partial predictions cannot be exported.');
  if (plan.unresolved_distance_m !== undefined) requireThat(nonnegative(plan.unresolved_distance_m, 'unresolved distance') === 0, 'partial_result', 'Unresolved distance cannot be exported.');
  if(station){
    requireThat(!selected,'inconsistent_result','Station-clock and selected-history sources cannot be combined.');
  } else if (plan.status !== undefined) {
    requireThat(['experimental_prediction', 'hybrid_scenario_complete', 'experimental_historical_reference'].includes(plan.status), 'incomplete_result', 'This prediction status is not a completed exportable result.');
    if (plan.status === 'hybrid_scenario_complete') requireThat(plan.complete === true, 'incomplete_result', 'A hybrid result must explicitly be complete.');
    requireThat(plan.terrain_display_compatible === true, 'incomplete_result', 'Prediction checkpoint placement must support an exact terrain timeline.');
  } else if(plan.purpose === 'manual_pace_clock_preview') {
    try{validateManualClockReceipt(plan);}catch(error){throw new WorkoutExportError('inconsistent_result',error.message);}
  } else requireThat(plan.purpose === 'goal_scenario_allocation', 'incomplete_result', 'Use a completed goal scenario, manual clock result or supported complete prediction.');
  const resultRoute = plan.route ?? plan.target;
  requireThat(resultRoute && typeof resultRoute === 'object', 'no_result', 'Result route provenance is required.');
  if(plan.status==='experimental_historical_reference')requireThat(selected&&['route_sha256','geometry_sha256'].every(key=>typeof route[key]==='string'&&route[key].length>0&&route[key]===resultRoute[key]),'stale_result','True multi requires complete current route and geometry hash pairing.');
  const sourceDistance = positive(resultRoute.distance_m, 'result route distance');
  sameNumber(positive(route.distance_m, 'current route distance'), sourceDistance, 'current route distance');
  for (const key of ['route_sha256', 'geometry_sha256']) {
    if (route[key] !== undefined && resultRoute[key] !== undefined) requireThat(typeof route[key] === 'string' && route[key].length > 0 && route[key] === resultRoute[key], 'stale_result', `Current route ${key} differs from the result.`);
  }
  const cells = plan.geometry_snapshot, timeline = plan.canonical_timeline;
  requireThat(Array.isArray(cells) && cells.length > 0 && Array.isArray(timeline) && cells.length === timeline.length, 'inconsistent_result', 'A complete canonical geometry/timeline is required.');
  const timeAt = new Map([[0, 0]]);
  let previousEnd = 0, runningTime = 0;
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i], time = timeline[i];
    requireThat(cell && time, 'inconsistent_result', 'Canonical cells cannot be missing.');
    finite(cell.start_m, 'cell start'); positive(cell.end_m, 'cell end');
    requireThat(cell.start_m === previousEnd && cell.end_m > cell.start_m && time.start_m === cell.start_m && time.end_m === cell.end_m, 'inconsistent_result', 'Canonical geometry/timeline must be exactly contiguous.');
    positive(time.moving_s, 'canonical moving time');
    runningTime += time.moving_s; finite(runningTime, 'canonical moving total');
    if (time.cumulative_moving_s !== undefined) sameNumber(time.cumulative_moving_s, runningTime, 'canonical moving prefix');
    if (cell.grade !== null && cell.grade !== undefined) finite(cell.grade, 'grade');
    previousEnd = cell.end_m; timeAt.set(previousEnd, runningTime);
  }
  sameNumber(previousEnd, sourceDistance, 'canonical route distance');
  const sourceMoving = positive(plan.moving_s, 'result moving time');
  sameNumber(sourceMoving, compensatedSum(timeline.map(row => row.moving_s)), 'result moving total');
  const sourceStops = nonnegative(plan.stops_s, 'result stop time');
  const sourceElapsed = positive(plan.target_elapsed_s ?? plan.elapsed_s, 'result elapsed time');
  sameNumber(sourceElapsed, sourceMoving + sourceStops, 'result elapsed total');
  if (plan.target_elapsed_s !== undefined && plan.elapsed_s !== undefined) sameNumber(plan.elapsed_s, sourceElapsed, 'result elapsed time');
  const cps = plan.checkpoints;
  requireThat(Array.isArray(cps), 'inconsistent_result', 'Checkpoint placement is required.');
  const cpAt = new Map(); let previousCP = 0, priorStops = 0;
  for (const cp of cps) {
    requireThat(cp && typeof cp === 'object', 'inconsistent_result', 'Checkpoint data is invalid.');
    const distance = positive(cp.distance_m, 'checkpoint distance'), stop = nonnegative(cp.stop_s, 'checkpoint stop');
    const arrival = nonnegative(cp.arrival_elapsed_s, 'checkpoint arrival'), departure = nonnegative(cp.departure_elapsed_s, 'checkpoint departure');
    requireThat(distance > previousCP && distance <= previousEnd, 'inconsistent_result', 'Checkpoints must be ordered within the route.');
    requireThat(distance !== previousEnd || stop === 0, 'inconsistent_result', 'A finish checkpoint cannot include a stop.');
    sameNumber(departure, arrival + stop, 'checkpoint departure');
    const movingPrefix = arrival - priorStops;
    requireThat(movingPrefix > 0 && movingPrefix <= sourceMoving + Math.max(1e-7, sourceMoving * 1e-9), 'inconsistent_result', 'Checkpoint moving prefix is outside the route.');
    if (timeAt.has(distance)) sameNumber(timeAt.get(distance), movingPrefix, 'checkpoint exact moving prefix');
    else timeAt.set(distance, movingPrefix); // Exact sample supplied by the model; never distance-interpolate time.
    cpAt.set(distance, cp); previousCP = distance; priorStops += stop;
  }
  sameNumber(priorStops, sourceStops, 'checkpoint stop total');
  const times = [...timeAt].sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < times.length; i++) requireThat(times[i][1] > times[i - 1][1], 'inconsistent_result', 'Canonical/checkpoint moving prefixes must strictly increase.');
  requireThat(Array.isArray(terrainRows) && terrainRows.length > 0, 'no_rows', 'Exact terrain rows are required.');
  let end = 0, departure = 0, leg = 0, cellIndex = 0;
  const rows = terrainRows.map((row, index) => {
    requireThat(row && typeof row === 'object' && !Array.isArray(row.children), 'not_terrain_rows', 'Pass original terrain rows, never checkpoint parents with elapsed pace.');
    finite(row.start_m, 'row start'); positive(row.end_m, 'row end');
    requireThat(row.start_m === end && row.end_m > row.start_m, 'inconsistent_result', 'Terrain rows must be exactly contiguous.');
    sameNumber(positive(row.distance_m, 'row distance'), row.end_m - row.start_m, 'terrain distance');
    requireThat(timeAt.has(row.start_m) && timeAt.has(row.end_m), 'inconsistent_result', 'Terrain boundaries must have exact canonical or checkpoint time samples.');
    const moving = timeAt.get(row.end_m) - timeAt.get(row.start_m);
    sameNumber(positive(row.moving_s, 'row moving time'), moving, 'terrain moving time');
    const cp = cpAt.get(row.end_m), stop = cp?.stop_s ?? 0;
    sameNumber(nonnegative(row.stops_s, 'row stop time'), stop, 'terrain stop placement');
    sameNumber(nonnegative(row.start_elapsed_s, 'row start elapsed'), departure, 'terrain start clock');
    sameNumber(nonnegative(row.arrival_elapsed_s, 'row arrival'), departure + moving, 'terrain arrival clock');
    sameNumber(nonnegative(row.departure_elapsed_s, 'row departure'), departure + moving + stop, 'terrain departure clock');
    sameNumber(nonnegative(row.elapsed_s, 'row elapsed'), moving + stop, 'terrain elapsed');
    requireThat(['uphill', 'downhill', 'flat', 'unknown', 'rolling', 'downhill_rolling', 'uphill_rolling', 'uphill_mixed', 'downhill_mixed', 'flat_mixed'].includes(row.kind) && row.pace_basis !== 'elapsed_including_stops', 'not_terrain_rows', 'Use an original terrain kind, never a checkpoint parent or elapsed-pace row.');
    const cpDistances = cps.filter(point => point.distance_m > row.start_m && point.distance_m < row.end_m);
    requireThat(cpDistances.length === 0, 'inconsistent_result', 'A terrain row cannot cross a checkpoint.');
    while (cellIndex < cells.length && cells[cellIndex].end_m <= row.start_m) cellIndex++;
    let relief = 0, flat = row.kind === 'flat', gradeMin = Infinity, gradeMax = -Infinity;
    for (let j = cellIndex; j < cells.length && cells[j].start_m < row.end_m; j++) {
      const cell = cells[j], g = cell.grade;
      const overlap = Math.min(row.end_m, cell.end_m) - Math.max(row.start_m, cell.start_m);
      if (!Number.isFinite(g) || Math.abs(g) >= 0.03 || !Number.isFinite(cell.elevation_start_m) || !Number.isFinite(cell.elevation_end_m)) flat = false;
      if (Number.isFinite(g)) { gradeMin = Math.min(gradeMin, g); gradeMax = Math.max(gradeMax, g); }
      if (Number.isFinite(cell.elevation_start_m) && Number.isFinite(cell.elevation_end_m)) relief += Math.abs(cell.elevation_end_m - cell.elevation_start_m) * overlap / (cell.end_m - cell.start_m);
      else relief = Infinity;
    }
    const normalized = {start_m: row.start_m, end_m: row.end_m, distance_m: row.end_m - row.start_m, moving_s: moving,
      leg_index: leg, end_checkpoint: cp ? {name: humanText(cp.name), distance_m: cp.distance_m, stop_s: cp.stop_s} : null,
      kind: row.kind, label: humanText(row.label ?? row.kind), source_row_indices: [index], flat_merge_eligible: flat,
      relief_m: relief, grade_min: Number.isFinite(gradeMin) ? gradeMin : null, grade_max: Number.isFinite(gradeMax) ? gradeMax : null,
      source_pace_min: moving / (row.end_m - row.start_m) * 1000, source_pace_max: moving / (row.end_m - row.start_m) * 1000};
    end = row.end_m; departure = row.departure_elapsed_s; if (cp) leg++;
    return normalized;
  });
  sameNumber(end, sourceDistance, 'terrain route distance');
  sameNumber(compensatedSum(rows.map(row => row.moving_s)), sourceMoving, 'terrain total moving');
  sameNumber(departure, sourceElapsed, 'terrain final departure');
  for (const cp of cps) requireThat(rows.some(row => row.end_m === cp.distance_m), 'inconsistent_result', 'Every checkpoint must be an exact terrain boundary.');
  return { rows, sourceDistance, sourceMoving, sourceStops, sourceElapsed, timeAt, selected, station,
    routeIdentity: ['route_sha256', 'geometry_sha256'].every(key => typeof route[key] === 'string' && typeof resultRoute[key] === 'string') ? 'hashes_and_current_assertion' : 'distance_and_current_assertion' };
}

function mergeRows(rows, policy) {
  if (policy === false) return {rows, merges: []};
  const output = [], merges = [];
  for (const source of rows) {
    const previous = output.at(-1);
    const combinedDistance = (previous?.distance_m ?? 0) + source.distance_m;
    const combinedPaceMin = Math.min(previous?.source_pace_min ?? Infinity, source.source_pace_min), combinedPaceMax = Math.max(previous?.source_pace_max ?? -Infinity, source.source_pace_max);
    const canMerge = previous && previous.leg_index === source.leg_index && previous.end_checkpoint === null && previous.flat_merge_eligible && source.flat_merge_eligible &&
      (previous.distance_m <= policy.smallSegmentM || source.distance_m <= policy.smallSegmentM) && combinedDistance <= policy.maximumMergedM &&
      previous.relief_m + source.relief_m < 4 && combinedPaceMax - combinedPaceMin <= policy.maximumPaceDeltaSecondsPerKm;
    if (!canMerge) { output.push({...source, source_row_indices: [...source.source_row_indices]}); continue; }
    const merged = {...previous, end_m: source.end_m, distance_m: source.end_m - previous.start_m, moving_s: previous.moving_s + source.moving_s,
      end_checkpoint: source.end_checkpoint, source_row_indices: [...previous.source_row_indices, ...source.source_row_indices],
      relief_m: previous.relief_m + source.relief_m, grade_min: Math.min(previous.grade_min, source.grade_min), grade_max: Math.max(previous.grade_max, source.grade_max),
      source_pace_min: combinedPaceMin, source_pace_max: combinedPaceMax};
    output[output.length - 1] = merged;
    merges.push({source_row_indices: [...merged.source_row_indices], start_m: merged.start_m, end_m: merged.end_m, reason: 'explicit_small_flat_policy'});
  }
  return {rows: output, merges};
}

/**
 * input = {plan, terrainRows, route, current:true}; pass an unwrapped prediction.
 * mode='checkpoint-sections' adds generic CP headings, retaining terrain steps.
 * Small-flat merging is opt-in and never crosses a CP or a non-flat/unknown cell.
 */
export function buildDistanceWorkout(input, options = {}) {
  const config = optionsFor(options), valid = validateInput(input), merged = mergeRows(valid.rows, config.merge);
  const totalDistance = rounded(valid.sourceDistance, 'total route meters');
  requireThat(totalDistance > 0, 'unrepresentable_distance', 'The route rounds to zero meters; no step was removed.');
  const totalMoving = rounded(valid.sourceMoving, 'total moving seconds');
  let previousDistance = 0, previousMoving = 0;
  const steps = merged.rows.map((row, index) => {
    const last = index === merged.rows.length - 1;
    const endDistance = last ? totalDistance : rounded(row.end_m, 'cumulative meters');
    const distance = endDistance - previousDistance;
    requireThat(distance > 0, 'unrepresentable_distance', `Terrain row ${row.source_row_indices[0] + 1} rounds to zero meters; export was stopped without dropping it. An explicit safe flat merge may help, otherwise preserve the detailed plan.`);
    const endMoving = last ? totalMoving : rounded(valid.timeAt.get(row.end_m), 'cumulative moving seconds');
    const displayMoving = endMoving - previousMoving;
    requireThat(displayMoving >= 0, 'inconsistent_result', 'Rounded moving prefixes cannot decrease.');
    const rawPace = positive(row.moving_s / row.distance_m * 1000, 'moving pace');
    const center = rounded(rawPace, 'pace seconds per km');
    const fast = center - config.tolerance, slow = center + config.tolerance;
    requireThat(Number.isSafeInteger(slow) && fast > 0, 'unrepresentable_pace', 'A positive, safe whole-second pace target is required. Reduce the requested pace tolerance.');
    const pace = config.tolerance ? `${paceText(slow)}-${paceText(fast)}` : paceText(center);
    const step = {index: index + 1, source_row_indices: [...row.source_row_indices], start_m: row.start_m, end_m: row.end_m,
      source_distance_m: row.distance_m, export_start_m: previousDistance, export_end_m: endDistance, export_distance_m: distance,
      moving_s: row.moving_s, display_moving_s: displayMoving, pace_s_per_km: rawPace,
      target_fast_s_per_km: fast, target_slow_s_per_km: slow, nominal_export_moving_s: distance / 1000 * center,
      leg_index: row.leg_index, terrain_kind: row.kind, label: row.label, end_checkpoint: row.end_checkpoint,
      line: `- ${distance}mtr ${pace}/km Pace`};
    previousDistance = endDistance; previousMoving = endMoving; return step;
  });
  requireThat(steps.reduce((sum, step) => sum + step.export_distance_m, 0) === totalDistance && steps.reduce((sum, step) => sum + step.display_moving_s, 0) === totalMoving, 'rounding_conservation', 'Rounded step totals must conserve distance and planned moving display seconds.');
  const lines = []; let previousLeg = -1;
  for (const step of steps) {
    if (config.mode === 'checkpoint-sections' && step.leg_index !== previousLeg) { if (lines.length) lines.push(''); lines.push(`Checkpoint segment ${step.leg_index + 1}`); previousLeg = step.leg_index; }
    lines.push(step.line);
  }
  if(config.stopMode==='planned-duration'||input.plan.status==='experimental_historical_reference'||valid.station)return buildExtendedWorkout(input,config,valid,merged,steps,totalDistance,totalMoving);
  const text = `${lines.join('\n')}\n`, parsed = parseDistanceWorkoutText(text);
  requireThat(parsed.length === steps.length && parsed.reduce((sum, step) => sum + step.distance_m, 0) === totalDistance, 'local_roundtrip', 'Generated text failed its local strict-subset roundtrip.');
  const nominal = compensatedSum(steps.map(step => step.nominal_export_moving_s));
  const totals = {source_distance_m: valid.sourceDistance, export_distance_m: totalDistance,
    distance_rounding_delta_m: totalDistance - valid.sourceDistance, source_moving_s: valid.sourceMoving,
    display_moving_s: totalMoving, omitted_stops_s: valid.sourceStops, source_elapsed_s: valid.sourceElapsed,
    nominal_export_moving_s: nominal, nominal_moving_delta_s: nominal - valid.sourceMoving, step_count: steps.length};
  const warnings = [
    {code: 'distance_is_not_navigation', message: '距離步驟依手錶量測里程切換，不是導航抵達 CP 觸發。'},
    {code: 'watch_and_server_unverified', message: '文字依官方語法產生；尚未送入真實 Intervals.icu 解析，也未在 T-Rex 3 實測。'},
    {code: 'step_limit_unknown', message: 'Intervals.icu、Zepp Bridge 與 T-Rex 3 的可用步驟上限未查證；全部步驟保留，不自動截斷。'},
    {code: 'pace_rounding', message: `距離與配速分別取整公尺、整秒/km。匯出中心配速推回移動時間差 ${totals.nominal_moving_delta_s.toFixed(3)} 秒；原計畫與匯出預覽時間分列。`},
  ];
  if (input.plan.warnings !== undefined) {
    requireThat(Array.isArray(input.plan.warnings), 'inconsistent_result', 'Result warnings must be an array.');
    for (const warning of input.plan.warnings) {
      const readable = typeof warning === 'string' ? warning : warning && typeof warning.message === 'string' ? warning.message : '';
      const message = humanText(readable);
      if (message) warnings.push({code: 'source_model_warning', message});
    }
  }
  if (valid.sourceStops > 0) warnings.push({code: 'stops_omitted', message: `CP 停留合計 ${clock(valid.sourceStops)} 未生成課程步驟。Zepp 等待按鍵語意未核實；請依原計畫另行管理停留。`});
  if(hikingReferenceProvenance(input.plan))warnings.push({code:'hiking_reference_only',message:'Campbell 2022 全程徒步參考分配；不是個人能力預估，來源高程與短陡坡仍有不確定性。'});
 if(input.plan.purpose==='manual_pace_clock_preview')warnings.push({code:'manual_clock_only',message:'人工配速時間重算；未估配速對後段疲勞或停站恢復的影響。原完賽目標未重新分配。'});
  if (valid.routeIdentity === 'distance_and_current_assertion') warnings.push({code: 'route_identity_limited', message: '缺少完整路線雜湊配對；呼叫端須用 current:true 確認這是目前路線的有效結果。'});
  if (merged.merges.length) warnings.push({code: 'explicit_flat_merge', message: `已依明選政策合併 ${valid.rows.length - steps.length} 個小平緩分段。只合併同 CP 腿、全程坡度小於 3%、合計起伏小於 4 m 且配速接近的相鄰段。`});
  const previewLines = [
    'Intervals.icu 距離／移動配速課程預覽',
    `${steps.length} 步驟 · 原始里程 ${(valid.sourceDistance / 1000).toFixed(6)} km · 匯出 ${totalDistance} m`,
    `原計畫移動 ${clock(valid.sourceMoving)} · CP 停留另計 ${clock(valid.sourceStops)} · 原計畫總時間 ${clock(valid.sourceElapsed)}`,
    `匯出中心配速推算移動 ${clock(nominal)}（差 ${totals.nominal_moving_delta_s.toFixed(3)} 秒；非保證手錶完成時間）`,
    '',
    ...steps.map(step => `${step.index}. ${(step.start_m / 1000).toFixed(3)}–${(step.end_m / 1000).toFixed(3)} km · ${step.export_distance_m} m · ${step.label} · ${step.target_slow_s_per_km === step.target_fast_s_per_km ? paceText(step.target_fast_s_per_km) : `${paceText(step.target_slow_s_per_km)}–${paceText(step.target_fast_s_per_km)}`}/km · 計畫移動 ${clock(step.display_moving_s)}${step.end_checkpoint ? ` · 段尾 ${step.end_checkpoint.name || 'CP'}（停留另計 ${clock(step.end_checkpoint.stop_s)}）` : ''}`),
    '', ...warnings.map(warning => warning.message),
  ];
  return {schema_version: WORKOUT_EXPORT_VERSION, format: 'intervals.icu-plain-text', pace_basis: 'moving_excluding_stops',
    mode: config.mode, text, preview: previewLines.join('\n'), filename: hikingReferenceProvenance(input.plan)?'hiking-reference-distance-pace-intervals.txt':'trail-distance-pace-intervals.txt', mime_type: 'text/plain;charset=utf-8',
    steps, totals, merge_policy: config.merge === false ? null : {...config.merge}, merges: merged.merges, warnings,
    verification: {syntax_sources_read_on: '2026-10-13', local_strict_subset_roundtrip: true,
      intervals_server_parsed: false, zepp_bridge_parsed: false, t_rex_3_tested: false, step_limit_verified: false,
      route_identity: valid.routeIdentity},
    result_basis: {purpose: input.plan.purpose ?? null, status: input.plan.status ?? null,
      ...(input.plan.purpose==='manual_pace_clock_preview'?{initial_target_elapsed_s:input.plan.initial_target_elapsed_s,revised_finish_elapsed_s:input.plan.revised_finish_elapsed_s,downstream_response_status:'not_estimable'}:{}),
      ...(hikingReferenceProvenance(input.plan)?{hiking_reference:hikingReferenceProvenance(input.plan)}:{}),model_version: input.plan.model_version ?? null, calibration_status: input.plan.calibration_status ?? null},
    sources: [...WORKOUT_SYNTAX_SOURCES]};
}

/** Local verifier for ONLY the emitted distance/absolute-pace subset, not the Intervals.icu parser. */
export function parseDistanceWorkoutText(text) {
  requireThat(typeof text === 'string', 'invalid_text', 'Workout text must be a string.');
  const steps = [];
  for (const line of text.split(/\r?\n/u)) {
    if (!line.trim()) continue;
    if (/^Checkpoint segment [1-9]\d*$/u.test(line)) continue;
    // Official distance units include km, mtr and meters. Bare m is MINUTES.
    const match = /^- (\d+(?:\.\d+)?)(mtr|meters|km) (\d+):([0-5]\d)(?:-(\d+):([0-5]\d))?\/km Pace$/u.exec(line);
    requireThat(match, 'unsupported_text', 'Not a supported distance/absolute-pace line. Bare m means minutes and is deliberately rejected.');
    const distance = positive(Number(match[1]) * (match[2] === 'km' ? 1000 : 1), 'parsed distance');
    const first = Number(match[3]) * 60 + Number(match[4]);
    const second = match[5] === undefined ? first : Number(match[5]) * 60 + Number(match[6]);
    requireThat(Number.isSafeInteger(first) && Number.isSafeInteger(second) && first >= second && second > 0, 'unsupported_text', 'Use a positive whole-second pace or slow-to-fast range.');
    steps.push({distance_m: distance, target_fast_s_per_km: second, target_slow_s_per_km: first});
  }
  requireThat(steps.length > 0, 'invalid_text', 'Workout text has no movement steps.');
  return steps;
}


/** Cheap carried-count admission, called before terrain allocation by the UI. Not a watch limit. */
export function checkWorkoutResourceBounds(input){
 const plan=input?.plan,context=input?.providerHistory??input?.historySelection;
 if(plan?.source_kind==='intervals_provider'||plan?.status==='experimental_historical_reference')requireThat(context,'history_receipt_required','A bound selected-history source is required.');
 if(plan?.purpose==='station_clock_comparison'){
  requireThat(stationClockWorkoutSourceCurrent(input.stationClockContext,plan),'stale_result','A current private station-clock owner is required.');
  const n=plan.geometry_snapshot?.length,c=plan.checkpoints?.length;
  requireThat(Number.isSafeInteger(n)&&n>0&&plan.canonical_timeline?.length===n&&Number.isSafeInteger(c)&&c<=101,'resource_limit','Station target counts exceed their admitted bounds.');
  if(input.terrainRows!==undefined)requireThat(Array.isArray(input.terrainRows)&&input.terrainRows.length<=n+c,'resource_limit','Station terrain output exceeds admitted counts.');
 }
 if(!context)return;
 requireThat(context&&typeof context==='object'&&Object.keys(context).sort().join(',')===(input.providerHistory?'correlation,payload,receipt,source_kind':'correlation,payload,receipt'),'history_receipt_required','Use the exact receipt/payload/correlation context.');
 const requested=context.receipt?.reference?.target_prediction?.assumptions?.target_checkpoints??context.receipt?.reference?.assumptions?.target_checkpoints;
 requireThat(requested===undefined||Array.isArray(requested)&&requested.length<=100,'resource_limit','Requested checkpoint count exceeds its carried bound.');
 const n=plan?.geometry_snapshot?.length,c=plan?.checkpoints?.length;
 requireThat(Number.isSafeInteger(n)&&n>0&&n<=15000&&plan.canonical_timeline?.length===n&&Number.isSafeInteger(c)&&c<=101,'resource_limit','Selected target counts exceed their admitted bounds.');
 if(input.terrainRows!==undefined)requireThat(Array.isArray(input.terrainRows)&&input.terrainRows.length<=n+c,'resource_limit','Terrain output exceeds admitted cell/checkpoint counts.');
}
function validateSelectedSource(input){
 const context=input.providerHistory??input.historySelection;if(!context)return null;
 const {receipt,payload,correlation}=context;let verified=null;try{
 requireThat(receipt?.reference?.target_prediction===input.plan,'history_plan_identity','The plan must be the original admitted receipt child.');
 try{if(input.providerHistory){requireThat(context.source_kind==='intervals_provider'&&input.plan.source_kind==='intervals_provider','invalid_history_receipt','Provider source kind differs.');verified=validateProviderReceipt(receipt,payload,correlation);}else validateHistorySelectionReceipt(receipt,{payload,correlation});}catch(error){throw new WorkoutExportError('invalid_history_receipt',error.message);}
 requireThat(['experimental_historical_reference',...(input.providerHistory?['experimental_single_reference']:[])].includes(receipt.reference.status)&&receipt.reference.unique_activity_count>=1,'partial_result','Only a complete selected-history result can be exported.');
 if(input.plan.status==='experimental_historical_reference')requireThat(receipt.reference.unique_activity_count>1,'invalid_history_receipt','True multi requires more than one unique activity.');
 const request=verified?.request??parseHistoryJson(payload.request_json),owner=verified?.owner??parseHistoryJson(payload.owner_snapshot_json,HISTORY_CAPS.ownerBytes,HISTORY_CAPS.ownerNodes),requested=request.assumptions.target_checkpoints??[];
 requireThat(requested.length<=100,'resource_limit','Requested checkpoint count exceeds its admitted bound.');
 const raw=owner.target_context?.raw_checkpoints;
 requireThat(Array.isArray(raw)&&raw.length===requested.length,'history_checkpoint_identity','An exact captured checkpoint occurrence list is required.');
 const ids=new Set(),occurrences=requested.map((cp,i)=>{
  const r=raw[i];requireThat(r&&typeof r.id==='string'&&r.id.length>0&&!ids.has(r.id)&&Array.isArray(r.fields),'history_checkpoint_identity','Checkpoint occurrence identities must be unique.');ids.add(r.id);
  const value=cls=>{const fields=r.fields.filter(f=>Array.isArray(f)&&typeof f[1]==='string'&&f[1].split(/\s+/u).includes(cls));requireThat(fields.length===1&&typeof fields[0][2]==='string','history_checkpoint_identity','Raw checkpoint fields must be exact.');return fields[0][2];};
  requireThat(value('cp-name').trim()===cp.name&&value('cp-distance').trim()!==''&&Number(value('cp-distance'))*1000===cp.distance_m&&parseCpStopValue(value('cp-stop')).seconds===cp.stop_s,'history_checkpoint_identity','Raw checkpoint controls differ from their canonical request.');
  // Existing receipt validation owns Python-compatible canonical name stripping.
  const source=input.plan.checkpoints[i];requireThat(source&&source.distance_m===cp.distance_m&&source.stop_s===cp.stop_s,'history_checkpoint_identity','Ordered canonical checkpoint occurrence differs.');
  return {id:r.id};
 });
 return {receipt,occurrences};}finally{verified?.release();}
}
function copyData(value,seen=new Set()){
 if(typeof value==='number'){requireThat(Number.isFinite(value),'inconsistent_result','Checkpoint metadata numbers must be finite.');return value;}
 if(value===null||['string','boolean'].includes(typeof value))return value;
 requireThat(value&&typeof value==='object'&&!seen.has(value),'inconsistent_result','Checkpoint metadata must be acyclic plain data.');
 const array=Array.isArray(value);requireThat(array||Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null,'inconsistent_result','Checkpoint metadata must be plain data.');seen.add(value);
 const out=array?[]:{};
 for(const key of Reflect.ownKeys(value)){
  if(array&&key==='length')continue;
  const d=Object.getOwnPropertyDescriptor(value,key);requireThat(typeof key==='string'&&d&&Object.hasOwn(d,'value')&&d.enumerable,'inconsistent_result','Checkpoint metadata must have plain data fields.');
  Object.defineProperty(out,key,{value:copyData(d.value,seen),enumerable:true,writable:true,configurable:true});
 }
 if(array)requireThat(out.length===value.length&&Object.keys(out).length===value.length,'inconsistent_result','Checkpoint metadata arrays must be dense.');seen.delete(value);return out;
}
const ordinal=index=>{let n=index+1,out='';while(n>0){n--;out=String.fromCharCode(65+n%26)+out;n=Math.floor(n/26);}return out;};
function selectedBasis(valid,plan){
 const basis={...(hikingReferenceProvenance(plan)?{hiking_reference:hikingReferenceProvenance(plan)}:{}),purpose:plan.purpose??null,status:plan.status??null,model_version:plan.model_version??null,calibration_status:plan.calibration_status??null};
 if(plan.purpose==='manual_pace_clock_preview')Object.assign(basis,{initial_target_elapsed_s:plan.initial_target_elapsed_s,revised_finish_elapsed_s:plan.revised_finish_elapsed_s,downstream_response_status:'not_estimable'});
 if(valid.station)Object.assign(basis,valid.station.basis);
 if(valid.selected){const x=valid.selected.receipt,r=x.reference;if(r.schema_version==='intervals-single-reference/0.1'){basis.provider_history=copyData({source_kind:'intervals_provider',schema_version:x.schema_version,runtime_manifest_sha256:x.runtime_manifest_sha256,request_sha256:x.request_sha256,model_mode:x.model_mode,unique_activity_count:1,selected:x.selection.map(s=>({selection_id:s.selection_id,provider_identity:s.provider_identity,derived_geometry:s.derived_geometry})),external_event_identity:x.capabilities.external_event_identity,empirical_calibration:false});}else basis.history_selection=copyData({schema_version:x.schema_version,runtime_manifest_sha256:x.runtime_manifest_sha256,request_sha256:x.request_sha256,owner_snapshot_sha256:x.owner_snapshot_sha256,owner_generation:x.owner_generation,correlation:x.correlation,target_sha256:x.target_sha256,method_version:r.method_version,aggregation_method:r.aggregation_method,aggregate_P:r.aggregate_P,aggregate_scale_s_per_j_kg:r.aggregate_scale_s_per_j_kg,unique_activity_count:r.unique_activity_count,ordered_unique_keys:r.ordered_unique_keys,duplicate_mapping:r.duplicate_mapping,external_event_identity:x.capabilities.external_event_identity,empirical_calibration:false});}
 return basis;
}
function stopFailure(valid,index,reason,message){
 const id=(valid.station??valid.selected)?.occurrences[index]?.id??null;
 const details=Number.isSafeInteger(index)&&index>=0&&index<=100&&(id===null||typeof id==='string'&&id.length<=128)?{schema_version:'workout-checkpoint-error/1',occurrence_index:index,app_occurrence_id:id,reason}:undefined;
 throw new WorkoutExportError('unrepresentable_stop',message,details);
}
function buildExtendedWorkout(input,config,valid,merged,movements,totalDistance,totalMoving){
 const timed=config.stopMode==='planned-duration',cps=input.plan.checkpoints;
 if(valid.selected)requireThat(movements.length+cps.filter(c=>c.stop_s>0).length<=input.plan.geometry_snapshot.length+2*cps.length,'resource_limit','Mixed step count exceeds admitted counts.');
 let sourcePrefix=0,roundedPrefix=0;
 const boundaries=cps.map((cp,i)=>{
  const previousSource=sourcePrefix,sequential=sourcePrefix+cp.stop_s;requireThat(Number.isFinite(sequential)&&sequential>=sourcePrefix,'inconsistent_result','Stop prefixes cannot decrease.');
  sourcePrefix=i===cps.length-1?valid.sourceStops:sequential;
  if(timed&&sourcePrefix<previousSource)stopFailure(valid,i,'authoritative_prefix',`Checkpoint occurrence ${i+1} has an inconsistent authoritative stop prefix.`);
  const next=timed?rounded(sourcePrefix,'cumulative stop seconds'):0,exported=next-roundedPrefix;
  if(timed&&!(exported>=0&&(cp.stop_s>0?exported>=1:exported===0)))stopFailure(valid,i,'whole_second_precision',`Checkpoint occurrence ${i+1} cannot preserve its dwell at whole-second precision.`);
  const boundary={occurrence_index:i,app_occurrence_id:(valid.station??valid.selected)?.occurrences[i]?.id??null,source_type:valid.station?.occurrences[i]?.generated||valid.selected&&!valid.selected.occurrences[i]?'generated_finish':'result_checkpoint',source_checkpoint:copyData(cp),preceding_movement_index:null,planned_stop_index:null,controlled_ordinal:ordinal(i),source_stop_prefix_s:sourcePrefix,export_stop_prefix_s:next,export_stop_s:exported,stop_rounding_delta_s:exported-cp.stop_s};roundedPrefix=next;return boundary;
 });
 const at=new Map(boundaries.map(b=>[b.source_checkpoint.distance_m,b])),steps=[];
 for(const [i,m] of movements.entries()){
  const before=at.get(m.start_m),boundaryPrompt=timed&&before&&before.source_checkpoint.stop_s===0?before.controlled_ordinal:null;
  const move={...m,index:steps.length+1,kind:'movement',movement_index:i+1,checkpoint_boundary_before:boundaryPrompt,line:boundaryPrompt?m.line.replace('- ',`- CP boundary ${boundaryPrompt} `):m.line};steps.push(move);
  const end=at.get(m.end_m);if(!end)continue;end.preceding_movement_index=move.index;
  if(timed&&end.export_stop_s>0){end.planned_stop_index=steps.length+1;const prompt=`CP stop ${end.controlled_ordinal}`;steps.push({index:steps.length+1,kind:'planned_stop',source_checkpoint_index:end.occurrence_index,app_occurrence_id:end.app_occurrence_id,source_checkpoint:copyData(end.source_checkpoint),source_stop_prefix_s:end.source_stop_prefix_s,export_stop_prefix_s:end.export_stop_prefix_s,export_duration_s:end.export_stop_s,stop_rounding_delta_s:end.stop_rounding_delta_s,preceding_movement_index:move.index,prompt,line:`- ${prompt} ${end.export_stop_s}s intensity=rest`});}
 }
 requireThat(boundaries.every(b=>b.preceding_movement_index!==null),'inconsistent_result','Every checkpoint must retain its exact movement boundary.');
 const exportedStops=steps.reduce((n,s)=>n+(s.kind==='planned_stop'?s.export_duration_s:0),0);
 requireThat(exportedStops===(timed?rounded(valid.sourceStops,'total stop seconds'):0),'rounding_conservation','Rounded planned stop steps must conserve authoritative dwell total.');
 const lines=[];let leg=-1;for(const step of steps){if(config.mode==='checkpoint-sections'&&step.kind==='movement'&&step.leg_index!==leg){if(lines.length)lines.push('');lines.push(`Checkpoint segment ${step.leg_index+1}`);leg=step.leg_index;}lines.push(step.line);}
 const text=lines.join('\n')+'\n',parsed=parseMixedWorkoutText(text);
 requireThat(parsed.length===steps.length&&parsed.every((p,i)=>{const s=steps[i];return p.kind===s.kind&&(p.kind==='movement'?p.distance_m===s.export_distance_m&&p.target_fast_s_per_km===s.target_fast_s_per_km&&p.target_slow_s_per_km===s.target_slow_s_per_km&&p.checkpoint_boundary_before===s.checkpoint_boundary_before:p.duration_s===s.export_duration_s&&p.controlled_ordinal===boundaries[s.source_checkpoint_index].controlled_ordinal);}),'local_roundtrip','Generated mixed text failed its exact local strict-subset roundtrip.');
 const nominal=compensatedSum(movements.map(s=>s.nominal_export_moving_s)),display=totalMoving+exportedStops;
 const totals={source_distance_m:valid.sourceDistance,export_distance_m:totalDistance,distance_rounding_delta_m:totalDistance-valid.sourceDistance,source_moving_s:valid.sourceMoving,source_stops_s:valid.sourceStops,display_moving_s:totalMoving,omitted_stops_s:timed?0:valid.sourceStops,source_elapsed_s:valid.sourceElapsed,nominal_export_moving_s:nominal,nominal_moving_delta_s:nominal-valid.sourceMoving,step_count:steps.length,exported_stops_s:exportedStops,stop_rounding_delta_s:exportedStops-valid.sourceStops,display_elapsed_s:display,rounded_source_elapsed_s:rounded(valid.sourceElapsed,'rounded source elapsed'),display_elapsed_delta_s:display-rounded(valid.sourceElapsed,'rounded source elapsed'),nominal_export_elapsed_s:nominal+exportedStops,nominal_elapsed_delta_s:nominal+exportedStops-valid.sourceElapsed,movement_step_count:movements.length,planned_stop_step_count:steps.length-movements.length};
 const warnings=[{code:'distance_is_not_navigation',message:'距離步驟依手錶量測里程切換，不是導航抵達 CP 觸發。'},{code:'watch_and_server_unverified',message:'文字依官方語法產生；尚未送入真實 Intervals.icu 解析，也未在 T-Rex 3 實測。'},{code:'step_limit_unknown',message:'Intervals.icu、Zepp Bridge 與 T-Rex 3 的可用步驟上限未查證；全部步驟保留，不自動截斷。'},{code:'pace_rounding',message:`距離取整公尺、配速取整秒/km；中心配速推回移動時間差 ${totals.nominal_moving_delta_s.toFixed(3)} 秒。`}];
 if(timed)warnings.push({code:'planned_stop_quantization',message:`計畫停留取整秒，合計差 ${totals.stop_rounding_delta_s.toFixed(3)} 秒；分別取整的移動與停留合計較整秒原總時間差 ${totals.display_elapsed_delta_s} 秒。`},{code:'planned_stop_execution_unverified',message:'停留步驟是指定時長，不保證原地停留、恢復效果或等候按鍵。下游格式可能省略無配速目標的停留步驟，裝置尚待實測。'});
 else if(valid.sourceStops>0)warnings.push({code:'stops_omitted',message:`CP 停留合計 ${clock(valid.sourceStops)} 未生成課程步驟；請依原計畫另行管理停留。`});
 requireThat(input.plan.warnings===undefined||Array.isArray(input.plan.warnings),'inconsistent_result','Result warnings must be an array.');for(const warning of input.plan.warnings??[]){const message=humanText(typeof warning==='string'?warning:warning?.message??'');if(message)warnings.push({code:'source_model_warning',message});}
 if(hikingReferenceProvenance(input.plan))warnings.push({code:'hiking_reference_only',message:'Campbell 2022 全程徒步參考分配；不是個人能力預估，來源高程與短陡坡仍有不確定性。'});
 if(input.plan.purpose==='manual_pace_clock_preview')warnings.push({code:'manual_clock_only',message:'人工配速時間重算；未估配速對後段疲勞或停站恢復的影響。原完賽目標未重新分配。'});
 if(valid.station)warnings.push({code:'station_clock_only',message:'依目前已套用人工配速與整段停留的完整計時帳；未估疲勞連動、休息效益或最佳停留。原完賽目標未重新分配。'});
 if(valid.routeIdentity==='distance_and_current_assertion')warnings.push({code:'route_identity_limited',message:'缺少完整路線雜湊配對；呼叫端須確認結果仍屬目前路線。'});
 if(merged.merges.length)warnings.push({code:'explicit_flat_merge',message:`已依明選政策合併 ${valid.rows.length-movements.length} 個小平緩分段；所有 CP 分界保留。`});
 const preview=['Intervals.icu 分段課程預覽',`${steps.length} 步驟 · 匯出 ${totalDistance} m`,`原計畫移動 ${clock(valid.sourceMoving)} · 停留 ${clock(valid.sourceStops)} · 總時間 ${clock(valid.sourceElapsed)}`,timed?`匯出停留 ${exportedStops} 秒 · 整秒移動與停留合計 ${display} 秒（與整秒原總時間差 ${totals.display_elapsed_delta_s} 秒）`:'僅移動段 · 停留另計',`匯出中心配速推算含匯出停留 ${clock(totals.nominal_export_elapsed_s)}（與原總時間差 ${totals.nominal_elapsed_delta_s.toFixed(3)} 秒；非保證手錶完成時間）`,'',...steps.map(s=>s.kind==='planned_stop'?`${s.index}. 計畫停留 · ${humanText(s.source_checkpoint.name)} · 匯出 ${s.export_duration_s} 秒 · 原指定 ${s.source_checkpoint.stop_s} 秒`:`${s.index}. ${s.export_distance_m} m · ${s.label} · ${paceText(s.target_fast_s_per_km)}/km · 計畫移動 ${clock(s.display_moving_s)}${s.end_checkpoint?` · 段尾 ${s.end_checkpoint.name||'CP'}（原停留 ${s.end_checkpoint.stop_s} 秒）`:''}`),'',...warnings.map(w=>w.message)].join('\n');
 return {schema_version:'intervals-distance-workout/1.1',format:'intervals.icu-plain-text',pace_basis:'moving_excluding_stops',mode:config.mode,stop_mode:config.stopMode,text,preview,filename:hikingReferenceProvenance(input.plan)?'hiking-reference-distance-pace-intervals.txt':'trail-distance-pace-intervals.txt',mime_type:'text/plain;charset=utf-8',steps,checkpoint_boundaries:boundaries,totals,merge_policy:config.merge===false?null:{...config.merge},merges:merged.merges,warnings,verification:{syntax_sources_read_on:'2026-10-14',local_strict_subset_roundtrip:true,intervals_server_parsed:false,zepp_bridge_parsed:false,t_rex_3_tested:false,step_limit_verified:false,route_identity:valid.routeIdentity},result_basis:selectedBasis(valid,input.plan),sources:[...WORKOUT_SYNTAX_SOURCES,...(timed?['https://forum.intervals.icu/t/workout-builder/1163/733','https://forum.intervals.icu/t/workout-builder/1163?page=49','https://forum.intervals.icu/t/huawei-support-available/120529']:[])]};
}
/** Local verifier for exactly generated movement/controlled CP/timed-stop lines. No server claim. */
export function parseMixedWorkoutText(text){
 requireThat(typeof text==='string','invalid_text','Workout text must be a string.');const steps=[];let lastOrdinal=-1,header=0,pendingHeader=false;
 const ordinalIndex=value=>{let n=0;for(const c of value){n=n*26+c.charCodeAt(0)-64;requireThat(Number.isSafeInteger(n),'unsupported_text','Unsafe CP ordinal.');}return n-1;};
 const consumeOrdinal=value=>{const n=ordinalIndex(value);requireThat(n>lastOrdinal,'unsupported_text','CP ordinals must strictly increase without duplication.');lastOrdinal=n;};
 for(const line of text.split(/\r?\n/u)){
  if(!line.trim())continue;
  const section=/^Checkpoint segment ([1-9]\d*)$/u.exec(line);if(section){requireThat((header>0||steps.length===0)&&!pendingHeader&&Number(section[1])===header+1&&(!steps.length||steps.at(-1).kind==='movement'||steps.at(-1).kind==='planned_stop'),'unsupported_text','Section headers must be consecutive and precede movement.');header++;pendingHeader=true;continue;}
  const stop=/^- CP stop ([A-Z]+) ([1-9]\d*)s intensity=rest$/u.exec(line);
  if(stop){const duration=Number(stop[2]);requireThat(!pendingHeader&&steps.at(-1)?.kind==='movement'&&Number.isSafeInteger(duration),'unsupported_text','A safe timed stop must follow movement.');consumeOrdinal(stop[1]);steps.push({kind:'planned_stop',duration_s:duration,controlled_ordinal:stop[1]});continue;}
  const match=/^- (?:CP boundary ([A-Z]+) )?([1-9]\d*)mtr (\d+):([0-5]\d)(?:-(\d+):([0-5]\d))?\/km Pace$/u.exec(line);
  requireThat(match,'unsupported_text','Not a generated mixed workout line.');const distance=Number(match[2]),slow=Number(match[3])*60+Number(match[4]),fast=match[5]===undefined?slow:Number(match[5])*60+Number(match[6]);
  requireThat(Number.isSafeInteger(distance)&&Number.isSafeInteger(slow)&&Number.isSafeInteger(fast)&&slow>=fast&&fast>0,'unsupported_text','Movement targets must be positive safe integers.');
  if(match[1]){requireThat(steps.length>0&&steps.at(-1).kind==='movement','unsupported_text','Zero-stop CP prompt must follow movement.');consumeOrdinal(match[1]);}
  steps.push({kind:'movement',distance_m:distance,target_fast_s_per_km:fast,target_slow_s_per_km:slow,checkpoint_boundary_before:match[1]??null});pendingHeader=false;
 }
 requireThat(steps.some(s=>s.kind==='movement')&&steps.at(-1)?.kind==='movement'&&!pendingHeader,'invalid_text','Mixed text requires movement and cannot end in a stop or header.');return steps;
}
