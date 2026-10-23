/** User-selected default: groups/routes of300km or longer start with three hour digits. */
export const DURATION_WIDTH_POLICY=Object.freeze({ultraDistanceMinM:300000});
export function durationWidthForDistance(distanceM,policy=DURATION_WIDTH_POLICY){
  const boundary=policy.ultraDistanceMinM;
  return Number.isFinite(distanceM)&&distanceM>=0&&Number.isFinite(boundary)&&boundary>0&&distanceM>=boundary?3:2;
}
/** Explicit catalogue kilometre metadata wins over GPX sampling and free-text names. */
export function durationDistanceForSelection(source,route){
  if(Number.isFinite(source?.nominalDistanceKm)&&source.nominalDistanceKm>0)return source.nominalDistanceKm*1000;
  return Number.isFinite(route?.distance_m)&&route.distance_m>0?route.distance_m:null;
}
