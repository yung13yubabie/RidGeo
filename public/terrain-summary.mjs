/**
 * Display-only, nested aggregation of existing terrain rows.
 * No geometry, timing curve, target allocation, CP, or raw row is modified.
 * Thresholds are provisional display design choices, not physiological grades.
 * CP stops belong to the row/group that ENDS at the CP, once only.
 */
export const TERRAIN_SUMMARY_VERSION = 'bounded-reversal-display-v2';
export const TERRAIN_SUMMARY_LEVELS = Object.freeze({
  raw: Object.freeze({key: 'raw', label: '原始分段', reverse_relief_m: 0, bridge_distance_m: 0}),
  detailed: Object.freeze({key: 'detailed', label: '詳細', reverse_relief_m: 6, bridge_distance_m: 150}),
  standard: Object.freeze({key: 'standard', label: '標準', reverse_relief_m: 20, bridge_distance_m: 500}),
  overview: Object.freeze({key: 'overview', label: '概覽', reverse_relief_m: 100, bridge_distance_m: 1500}),
});
const DOMINANT_RATIO = 0.6;
const METRICS = ['distance_m', 'gain_m', 'loss_m', 'up_distance_m', 'down_distance_m',
  'flat_distance_m', 'unknown_distance_m', 'moving_s', 'stops_s', 'elapsed_s'];
const DIRECTIONS = ['up', 'down', 'flat', 'unknown'];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const finite = (value, name) => {
  assert(typeof value === 'number' && Number.isFinite(value), `${name} must be finite`);
  return value;
};
const near = (a, b) => Math.abs(a - b) <= Math.max(1e-7, 1e-9 * Math.max(Math.abs(a), Math.abs(b)));
const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0);
const explicitGap = row => row.kind === 'gap' || row.gap === true;
const opaque = row => explicitGap(row) || row.kind === 'unknown' || row.unknown_distance_m > 0 ||
  row.gain_m === null || row.loss_m === null;
const endsBoundary = row => row.checkpoint != null || row.stops_s > 0 || row.break_after === true;
const startsBoundary = row => row.break_before === true;

function validateRows(rows) {
  assert(Array.isArray(rows), 'terrain rows must be an array');
  let previous = null;
  for (const row of rows) {
    assert(row && typeof row === 'object', 'terrain row must be an object');
    for (const key of ['start_m', 'end_m', 'start_elapsed_s', 'arrival_elapsed_s', 'departure_elapsed_s']) {
      finite(row[key], key);
    }
    assert(row.start_m >= 0 && row.end_m > row.start_m, 'invalid terrain interval');
    for (const key of METRICS) {
      if ((key === 'gain_m' || key === 'loss_m') && row[key] === null) continue;
      assert(finite(row[key], key) >= 0, `negative ${key}`);
    }
    assert(near(row.distance_m, row.end_m - row.start_m), 'terrain distance mismatch');
    assert(near(DIRECTIONS.reduce((value, key) => value + row[`${key}_distance_m`], 0), row.distance_m),
      'terrain direction distances must cover row');
    assert(near(row.arrival_elapsed_s - row.start_elapsed_s, row.moving_s), 'terrain moving clock mismatch');
    assert(near(row.departure_elapsed_s - row.arrival_elapsed_s, row.stops_s), 'terrain stop clock mismatch');
    assert(near(row.elapsed_s, row.moving_s + row.stops_s), 'terrain elapsed mismatch');
    if (previous) {
      assert(previous.end_m <= row.start_m, 'terrain rows must be ordered and nonoverlapping');
      if (previous.end_m === row.start_m) {
        assert(near(previous.departure_elapsed_s, row.start_elapsed_s), 'terrain clocks must be contiguous');
      }
    }
    previous = row;
  }
}

/** Label only from summed direction distances, never from net height. */
function describe(row) {
  const ratios = Object.fromEntries(DIRECTIONS.map(key => [key, row[`${key}_distance_m`] / row.distance_m]));
  const {up, down, flat, unknown} = ratios;
  if (unknown > 0) return {kind: 'unknown', label: unknown >= 1 - 1e-12 ? '地形未知' : '部分地形未知', ratios};
  if (up > 1e-12 && down > 1e-12) {
    if (up >= DOMINANT_RATIO) return {kind: 'uphill_rolling', label: '上坡為主起伏', ratios};
    if (down >= DOMINANT_RATIO) return {kind: 'downhill_rolling', label: '下坡為主起伏', ratios};
    if (flat >= DOMINANT_RATIO) return {kind: 'flat_rolling', label: '平緩為主起伏', ratios};
    return {kind: 'rolling', label: '起伏', ratios};
  }
  if (up >= 1 - 1e-12) return {kind: 'uphill', label: '上坡', ratios};
  if (down >= 1 - 1e-12) return {kind: 'downhill', label: '下坡', ratios};
  if (flat >= 1 - 1e-12) return {kind: 'flat', label: '平緩', ratios};
  if (up >= DOMINANT_RATIO) return {kind: 'uphill_mixed', label: '上坡為主', ratios};
  if (down >= DOMINANT_RATIO) return {kind: 'downhill_mixed', label: '下坡為主', ratios};
  if (flat >= DOMINANT_RATIO) return {kind: 'flat_mixed', label: '平緩為主', ratios};
  if (up > 0) return {kind: 'uphill_flat_mixed', label: '上坡與平緩混合', ratios};
  return {kind: 'downhill_flat_mixed', label: '下坡與平緩混合', ratios};
}

function direction(row) {
  if (opaque(row)) return null;
  return ['up', 'down', 'flat'].find(key => row[`${key}_distance_m`] / row.distance_m >= DOMINANT_RATIO) ?? null;
}
function reverseRelief(rows, trend) {
  if (trend === 'up') return sum(rows, 'loss_m');
  if (trend === 'down') return sum(rows, 'gain_m');
  return sum(rows, 'gain_m') + sum(rows, 'loss_m');
}

/**
 * Return {version, policy, levels:{raw,detailed,standard,overview}}.
 * `raw` is the exact input array; all original objects stay unchanged.
 * A merged node's children are original or finer-level nodes, in source order.
 * source_start_index/source_end_index describe the original half-open range.
 * No synthetic rows fill a gap. Unknown/gap rows remain the original singleton.
 * Endpoints always identify the same covered raw range at every display level.
 */
export function buildTerrainHierarchy(terrainRows) {
  validateRows(terrainRows);
  const ranges = new WeakMap(terrainRows.map((row, index) => [row, [index, index + 1]]));
  const levels = {raw: terrainRows};
  // Current-level source ranges are constant-size merge metadata. Children are
  // sliced once for final nodes, never repeatedly flattened while extending or
  // prepending a long bridge. All final sums retain finer-source order.
  let levelInput, localRanges, pending;

  function aggregate(nodes, policy, reason, trend = null) {
    const first = nodes[0], last = nodes.at(-1);
    const values = Object.fromEntries(METRICS.map(key => [key, sum(nodes, key)]));
    const startIndex = ranges.get(first)[0], endIndex = ranges.get(last)[1];
    const movingPace = values.moving_s / values.distance_m * 1000;
    const elapsedPace = values.elapsed_s / values.distance_m * 1000;
    const node = {
      classification_version: first.classification_version,
      aggregation_version: TERRAIN_SUMMARY_VERSION, aggregation_level: policy.key,
      aggregation_reason: reason, aggregation_trend: trend,
      source_start_index: startIndex, source_end_index: endIndex,
      start_m: first.start_m, end_m: last.end_m, ...values, ...describe(values),
      pace_s_per_km: movingPace, moving_pace_s_per_km: movingPace,
      elapsed_pace_s_per_km: elapsedPace, pace_basis: 'moving_excluding_stops',
      start_elapsed_s: first.start_elapsed_s, arrival_elapsed_s: last.arrival_elapsed_s,
      departure_elapsed_s: last.departure_elapsed_s, checkpoint: last.checkpoint ?? null,
      ...(first.break_before === true ? {break_before: true} : {}),
      ...(last.break_after === true ? {break_after: true} : {}),
    };
    ranges.set(node, [startIndex, endIndex]);
    localRanges.set(node, [localRanges.get(first)[0], localRanges.get(last)[1]]);
    pending.add(node);
    return node;
  }

  function materialize(node) {
    if (!pending.has(node)) return node;
    const [first, end] = localRanges.get(node), children = levelInput.slice(first, end);
    const values = Object.fromEntries(METRICS.map(key => [key, sum(children, key)]));
    const result = {...node, ...values, ...describe(values),
      pace_s_per_km: values.moving_s / values.distance_m * 1000,
      moving_pace_s_per_km: values.moving_s / values.distance_m * 1000,
      elapsed_pace_s_per_km: values.elapsed_s / values.distance_m * 1000, children};
    ranges.set(result, ranges.get(node));
    return result;
  }

  function canBridge(a, b, c, policy) {
    const trend = direction(a);
    if (!trend || trend !== direction(c) || b.distance_m > policy.bridge_distance_m) return null;
    const nodes = [a, b, c];
    // A limit on the COMPLETE candidate's reverse accumulation prevents each
    // individually tiny reversal from greedily chaining an unlimited landscape.
    if (reverseRelief(nodes, trend) > policy.reverse_relief_m) return null;
    if (sum(nodes, `${trend}_distance_m`) / sum(nodes, 'distance_m') < DOMINANT_RATIO) return null;
    return trend;
  }

  function mergeBlock(input, policy) {
    let result = input;
    for (;;) {
      const bridged = [];
      for (const node of result) {
        bridged.push(node);
        while (bridged.length >= 3) {
          const nodes = bridged.slice(-3), trend = canBridge(...nodes, policy);
          if (!trend) break;
          bridged.splice(-3, 3, aggregate(nodes, policy, 'bounded_same_trend_bridge', trend));
        }
      }
      const micro = [];
      for (const node of bridged) {
        micro.push(node);
        while (micro.length >= 2) {
          const nodes = micro.slice(-2);
          // Entire micro-cluster must fit BOTH bounds. A small trailing piece
          // is never a reason to absorb an already large neighboring section.
          if (sum(nodes, 'distance_m') > policy.bridge_distance_m ||
              reverseRelief(nodes, 'flat') > policy.reverse_relief_m) break;
          micro.splice(-2, 2, aggregate(nodes, policy, 'bounded_micro_cluster'));
        }
      }
      if (micro.length === result.length) return micro;
      result = micro;
    }
  }

  function buildLevel(input, policy) {
    levelInput = input;
    localRanges = new WeakMap(input.map((row, index) => [row, [index, index + 1]]));
    pending = new WeakSet();
    const output = [], block = [];
    const flush = () => { if (block.length) output.push(...mergeBlock(block, policy)); block.length = 0; };
    for (const row of input) {
      if (opaque(row)) { flush(); output.push(row); continue; }
      if (startsBoundary(row) || (block.length && block.at(-1).end_m !== row.start_m)) flush();
      block.push(row);
      if (endsBoundary(row)) flush();
    }
    flush();
    return output.map(materialize);
  }

  let previous = terrainRows;
  for (const key of ['detailed', 'standard', 'overview']) {
    levels[key] = buildLevel(previous, TERRAIN_SUMMARY_LEVELS[key]);
    previous = levels[key];
  }
  return {version: TERRAIN_SUMMARY_VERSION, policy: TERRAIN_SUMMARY_LEVELS, levels};
}

/** Convenient selection. For a UI dropdown, build once and reuse levels. */
export function selectTerrainLevel(hierarchy, level = 'standard') {
  assert(Object.hasOwn(TERRAIN_SUMMARY_LEVELS, level), 'unknown terrain display level');
  assert(hierarchy?.version === TERRAIN_SUMMARY_VERSION && Array.isArray(hierarchy.levels?.[level]),
    'invalid terrain hierarchy');
  return hierarchy.levels[level];
}
