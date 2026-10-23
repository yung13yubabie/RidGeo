/** Explicit source-point choices only. Official kilometres never create a position. */
const finite = n => typeof n === 'number' && Number.isFinite(n);
export function waypointCandidateCoverage(projection) {
  const listed = Array.isArray(projection?.candidates) ? projection.candidates.length : 0;
  const partial = projection?.candidates_truncated === true;
  return {partial,listed,total:Number.isSafeInteger(projection?.candidate_count) && projection.candidate_count >= listed && (!partial || projection.candidate_count > listed) ? projection.candidate_count : null};
}
export function collectWaypointChoices(original, current, route, {allowPartial = false} = {}) {
  if (!original?.source?.route_sha256 || !current?.source?.route_sha256 || !route || route.blocked || route.route_sha256 !== current.source.route_sha256 || !finite(route.distance_m)) return [];
  if (!Array.isArray(original.waypoints) || !Array.isArray(current.waypoints)) return [];
  const choices = [];
  for (const point of current.waypoints) {
    if (!Number.isSafeInteger(point.index) || point.index < 0) continue;
    const source = original.waypoints.find(p => p.index === point.index);
    if (!source || source.lat !== point.lat || source.lon !== point.lon || source.name !== point.name || source.ele !== point.ele || !finite(point.lat) || !finite(point.lon)) continue;
    const projection = point.projection;
    if (!projection || (projection.candidates_truncated !== undefined && typeof projection.candidates_truncated !== 'boolean') || (projection.candidates_truncated && !allowPartial) || !['unique','ambiguous'].includes(projection.status) || !Array.isArray(projection.candidates) || projection.candidates.length > 64) continue;
    const coverage = waypointCandidateCoverage(projection);
    projection.candidates.forEach((candidate, passageIndex) => {
      if (!finite(candidate.along_route_m) || candidate.along_route_m <= 0.001 || candidate.along_route_m >= route.distance_m - 0.001 || !finite(candidate.offset_m) || candidate.offset_m < 0) return;
      const waypoint = {index:source.index,lat:source.lat,lon:source.lon,ele:source.ele,name:source.name,origin_sha256:original.source.route_sha256};
      const identity = JSON.stringify([original.source.route_sha256,current.source.route_sha256,source.index,source.lat,source.lon,candidate.along_route_m,candidate.raw_edge_index??null]);
      choices.push({passageIndex,coverage,key:`waypoint-${source.index}-passage-${passageIndex}`,identity,routeSha:current.source.route_sha256,waypoint,candidate:{...candidate},distanceM:candidate.along_route_m,label:`${source.name||`航點 ${source.index+1}`} · 第 ${passageIndex+1} 次 · ${(candidate.along_route_m/1000).toFixed(6)} km`});
    });
  }
  return choices;
}

/** Known same-source occurrence only. Never merge by station name or proximity. */
export function sameWaypointOccurrence(row, choice) {
  if (!row || row.locationPending || row.positionEdited || row.mappingRouteSha !== choice.routeSha) return false;
  const point = row.waypoint, mapping = row.mapping;
  return !!point && !!mapping && point.origin_sha256 === choice.waypoint.origin_sha256 && point.index === choice.waypoint.index && point.lat === choice.waypoint.lat && point.lon === choice.waypoint.lon && (mapping.along_route_m ?? mapping.distance_m) === choice.distanceM;
}

/** A retained source clue is not a trusted mapping. Request explicit re-adoption only. */
export function waypointReconfirmationHint(row, choice) {
  if (!choice?.waypoint || !finite(choice.distanceM) || choice.distanceM <= 0) return false;
  if (!row || row.mapping || row.positionEdited || (!row.locationPending && !row.locationReconfirmed) || typeof row.distanceRaw !== 'string') return false;
  const point = row.waypoint;
  if (!point || point.origin_sha256 !== choice.waypoint.origin_sha256 || point.index !== choice.waypoint.index || point.lat !== choice.waypoint.lat || point.lon !== choice.waypoint.lon) return false;
  // These are the two exact input encodings written by our source-adoption paths,
  // not a distance tolerance or a restoration of a stale raw-point mapping.
  return row.distanceRaw === (choice.distanceM / 1000).toFixed(9) || row.distanceRaw === (choice.distanceM / 1000).toFixed(6);
}
