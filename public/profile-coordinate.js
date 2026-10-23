/** Display coordinate conversion only; never changes route points or timing. */
export function profileMarkerCoordinate(points,cells,distanceM){
  if(!Array.isArray(points)||!points.length||!Number.isFinite(distanceM))return null;
  const exact=points.find(p=>Number.isFinite(p.canonical_along_route_m)&&Math.abs(p.canonical_along_route_m-distanceM)<=1e-7);
  if(exact)return {horizontal_m:exact.horizontal_m,ele:exact.ele,interpolated:false,source_point_indices:[exact.source_point_index]};
  if(!Array.isArray(cells)||!cells.length)return null;
  let horizontal=0,position=null;
  for(const c of cells){
    if(![c.start_m,c.end_m,c.horizontal_m].every(Number.isFinite)||c.end_m<=c.start_m||c.horizontal_m<=0)return null;
    if(distanceM>=c.start_m&&distanceM<=c.end_m){position=horizontal+c.horizontal_m*(distanceM-c.start_m)/(c.end_m-c.start_m);break;}
    horizontal+=c.horizontal_m;
  }
  if(position===null||position<points[0].horizontal_m-1e-7||position>points.at(-1).horizontal_m+1e-7)return null;
  const i=points.findIndex(p=>p.horizontal_m>=position-1e-7);if(i<0)return null;const b=points[i];
  if(Math.abs(b.horizontal_m-position)<=1e-7)return {horizontal_m:b.horizontal_m,ele:b.ele,interpolated:false,source_point_indices:[b.source_point_index]};
  if(i===0)return null;const a=points[i-1],span=b.horizontal_m-a.horizontal_m;if(span<=0)return null;
  const f=(position-a.horizontal_m)/span;
  return {horizontal_m:position,ele:Number.isFinite(a.ele)&&Number.isFinite(b.ele)?a.ele+(b.ele-a.ele)*f:null,interpolated:true,source_point_indices:[a.source_point_index,b.source_point_index]};
}
