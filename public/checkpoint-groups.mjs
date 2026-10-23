/**
 * Display-only CP-to-CP aggregation of buildTerrainSegments output.
 * Never resegments terrain, interpolates a time, or changes the planning model.
 * Parent/total primary pace is elapsed/distance, including the ending CP stop.
 * moving_pace_s_per_km is separate. Children retain their original moving-only
 * pace_s_per_km and separate stops_s; no stop is spread into running speed.
 * A parent's children are the original row objects; do not add parent and child
 * values together. Stops belong to the leg that ARRIVES at the checkpoint.
 */
export const CHECKPOINT_DISPLAY_VERSION = 'cp-terrain-aggregation-v1';
export const ELAPSED_PACE_LABEL = '含停留配速';
export const MOVING_PACE_LABEL = '平均移動配速（不含停站）';
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const finite = (value, name) => {
  assert(typeof value === 'number' && Number.isFinite(value), `${name} must be finite`);
  return value;
};
const near = (a, b) => Math.abs(a - b) <= Math.max(1e-7, 1e-9 * Math.max(Math.abs(a), Math.abs(b)));
const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0);
const relief = (rows, key) => rows.some(row => row[key] === null) ? null : sum(rows, key);
const seconds = value => Math.floor(value + 0.5);

/** Round cumulative clocks before subtraction so expanded display seconds sum. */
export function checkpointRowDisplay(row) {
  const start = seconds(finite(row.start_elapsed_s, 'start elapsed'));
  const arrival = seconds(finite(row.arrival_elapsed_s, 'arrival elapsed'));
  const departure = seconds(finite(row.departure_elapsed_s, 'departure elapsed'));
  return {moving_s: arrival - start, stops_s: departure - arrival,
    elapsed_s: departure - start, start_elapsed_s: start,
    arrival_elapsed_s: arrival, departure_elapsed_s: departure};
}

/**
 * Returns {mode, rows, groups, totals, pace_basis, pace_label, display_version}.
 * mode='terrain': no intermediate CP; rows is the input array, groups is empty.
 * mode='checkpoints': rows===groups; expand each group's children in input order.
 * Parent moving_s/stops_s/elapsed_s are sums of unchanged children. Raw floating
 * sums are checked with the existing terrain helper's tolerance; authoritative
 * plan totals are returned verbatim, never redistributed into child durations.
 */
export function buildCheckpointGroups(plan, terrainRows) {
  assert(plan && typeof plan === 'object', 'plan is required');
  assert(Array.isArray(terrainRows) && terrainRows.length > 0, 'terrain rows must be nonempty');
  const cps = plan.checkpoints ?? [];
  assert(Array.isArray(cps), 'checkpoints must be an array');
  const last = terrainRows.at(-1), totalDistance = finite(last.end_m, 'route end');
  assert(totalDistance > 0, 'route distance must be positive');
  const cpAt = new Map();
  let previousCP = 0;
  for (const cp of cps) {
    const distance = finite(cp.distance_m, 'CP distance');
    const stop = finite(cp.stop_s, 'CP stop');
    const arrival = finite(cp.arrival_elapsed_s, 'CP arrival');
    const departure = finite(cp.departure_elapsed_s, 'CP departure');
    assert(distance > previousCP && distance <= totalDistance && stop >= 0, 'invalid CP order/location/stop');
    assert(near(departure, arrival + stop), 'inconsistent CP arrival/departure');
    assert(distance !== totalDistance || stop === 0, 'finish cannot include a stop');
    cpAt.set(distance, cp);
    previousCP = distance;
  }
  let previousEnd = 0, previousDeparture = 0;
  const byEnd = new Map();
  for (const row of terrainRows) {
    for (const key of ['start_m', 'end_m', 'distance_m', 'moving_s', 'stops_s', 'elapsed_s',
      'start_elapsed_s', 'arrival_elapsed_s', 'departure_elapsed_s']) finite(row[key], key);
    assert(row.start_m === previousEnd && row.end_m > row.start_m, 'terrain rows must be exactly contiguous');
    assert(near(row.distance_m, row.end_m - row.start_m), 'terrain distance mismatch');
    assert(row.moving_s >= 0 && row.stops_s >= 0 && row.elapsed_s >= 0, 'negative terrain duration');
    assert(near(row.start_elapsed_s, previousDeparture), 'terrain clocks must be contiguous');
    assert(near(row.arrival_elapsed_s - row.start_elapsed_s, row.moving_s), 'terrain moving clock mismatch');
    assert(near(row.departure_elapsed_s - row.arrival_elapsed_s, row.stops_s), 'terrain stop clock mismatch');
    assert(near(row.elapsed_s, row.moving_s + row.stops_s), 'terrain elapsed mismatch');
    for (const key of ['gain_m', 'loss_m']) {
      assert(row[key] === null || finite(row[key], key) >= 0, `invalid ${key}`);
    }
    const cp = cpAt.get(row.end_m);
    assert(near(row.stops_s, cp?.stop_s ?? 0), 'terrain stop must belong to its ending CP');
    if (cp) {
      assert(near(row.arrival_elapsed_s, cp.arrival_elapsed_s) && near(row.departure_elapsed_s, cp.departure_elapsed_s),
        'terrain and CP clocks disagree');
    }
    byEnd.set(row.end_m, row);
    previousEnd = row.end_m;
    previousDeparture = row.departure_elapsed_s;
  }
  // No fallback split is permitted: the existing terrain helper must supply each
  // CP boundary and its exact sample from the continuous core timeline.
  for (const cp of cps) assert(byEnd.has(cp.distance_m), 'CP must be an exact existing terrain boundary');
  if (plan.route?.distance_m !== undefined) {
    assert(near(totalDistance, finite(plan.route.distance_m, 'plan distance')), 'plan distance mismatch');
  }
  const rawMoving = sum(terrainRows, 'moving_s'), rawStops = sum(terrainRows, 'stops_s');
  const rawElapsed = sum(terrainRows, 'elapsed_s');
  const authoritative = (key, value) => {
    if (plan[key] === undefined) return value;
    const expected = finite(plan[key], `plan ${key}`);
    assert(near(expected, value), `plan ${key} mismatch`);
    return expected;
  };
  const moving = authoritative('moving_s', rawMoving), stops = authoritative('stops_s', rawStops);
  const elapsed = authoritative('target_elapsed_s', rawElapsed);
  assert(near(moving + stops, elapsed), 'plan total conservation mismatch');
  const displays = terrainRows.map(checkpointRowDisplay);
  const totals = {distance_m: plan.route?.distance_m ?? totalDistance,
    gain_m: relief(terrainRows, 'gain_m'), loss_m: relief(terrainRows, 'loss_m'),
    moving_s: moving, stops_s: stops, elapsed_s: elapsed, target_elapsed_s: elapsed,
    pace_s_per_km: elapsed / totalDistance * 1000, elapsed_pace_s_per_km: elapsed / totalDistance * 1000,
    moving_pace_s_per_km: moving / totalDistance * 1000, pace_basis: 'elapsed_including_stops',
    start_elapsed_s: terrainRows[0].start_elapsed_s,
    arrival_elapsed_s: last.arrival_elapsed_s, departure_elapsed_s: last.departure_elapsed_s,
    display: {...checkpointRowDisplay({start_elapsed_s: terrainRows[0].start_elapsed_s,
      arrival_elapsed_s: last.arrival_elapsed_s, departure_elapsed_s: last.departure_elapsed_s}),
      moving_s: sum(displays, 'moving_s'), stops_s: sum(displays, 'stops_s')}};
  if (plan.display_target_elapsed_s !== undefined) {
    assert(totals.display.elapsed_s === plan.display_target_elapsed_s, 'plan display target mismatch');
  }
  const common = {totals, pace_basis: 'elapsed_including_stops', pace_label: ELAPSED_PACE_LABEL,
    moving_pace_label: MOVING_PACE_LABEL,
    display_version: CHECKPOINT_DISPLAY_VERSION};
  if (!cps.some(cp => cp.distance_m < totalDistance)) {
    return {...common, mode: 'terrain', rows: terrainRows, groups: []};
  }
  const groups = [];
  let firstIndex = 0, startCheckpoint = null;
  for (let index = 0; index < terrainRows.length; index++) {
    const row = terrainRows[index], endpoint = cpAt.get(row.end_m);
    if (!endpoint && row.end_m !== totalDistance) continue;
    const children = terrainRows.slice(firstIndex, index + 1), first = children[0];
    const startName = startCheckpoint?.name ?? '起點', endName = endpoint?.name ?? '終點';
    const groupMoving = sum(children, 'moving_s'), groupDistance = sum(children, 'distance_m');
    const groupElapsed = sum(children, 'elapsed_s');
    const group = {kind: 'checkpoint', start_name: startName, end_name: endName,
      label: `${startName} → ${endName}`, start_m: first.start_m, end_m: row.end_m,
      distance_m: groupDistance, gain_m: relief(children, 'gain_m'), loss_m: relief(children, 'loss_m'),
      moving_s: groupMoving, stops_s: sum(children, 'stops_s'), elapsed_s: groupElapsed,
      pace_s_per_km: groupElapsed / groupDistance * 1000, elapsed_pace_s_per_km: groupElapsed / groupDistance * 1000,
      moving_pace_s_per_km: groupMoving / groupDistance * 1000, pace_basis: 'elapsed_including_stops',
      start_elapsed_s: first.start_elapsed_s, arrival_elapsed_s: row.arrival_elapsed_s,
      departure_elapsed_s: row.departure_elapsed_s, start_checkpoint: startCheckpoint,
      checkpoint: endpoint ?? null, children};
    group.display = checkpointRowDisplay(group);
    const childDisplays = children.map(checkpointRowDisplay);
    for (const key of ['moving_s', 'stops_s', 'elapsed_s']) {
      assert(group.display[key] === sum(childDisplays, key), 'rounded child seconds must conserve parent');
    }
    if (endpoint?.moving_s !== undefined) assert(near(group.moving_s, finite(endpoint.moving_s, 'CP moving')), 'CP leg moving mismatch');
    if (endpoint?.leg_distance_m !== undefined) assert(near(group.distance_m, finite(endpoint.leg_distance_m, 'CP leg distance')), 'CP leg distance mismatch');
    groups.push(group);
    startCheckpoint = endpoint ?? null;
    firstIndex = index + 1;
  }
  return {...common, mode: 'checkpoints', rows: groups, groups};
}
