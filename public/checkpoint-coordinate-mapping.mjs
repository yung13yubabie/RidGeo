/** Untrusted coordinate candidate math only; callers must establish source/current ownership. */
export function checkpointCoordinateCandidates(race,details){
  const segments=details.raw_profile_segments||[];if(segments.length!==1||details.summary?.planning_blocked)return race.checkpoints.map(cp=>({...cp,status:'unavailable',candidates:[]}));
  if(race.mappingMode==='official_distance_only')return race.checkpoints.map(cp=>({...cp,status:'unmapped',candidates:[],mapping_method:'official_distance_only_requires_user_position'}));
  const points=segments[0].points;const rows=race.checkpoints.map((cp,index)=>{
    if(race.mappingMode==='projected_official_coordinates'){
      const projected=details.official_waypoints?.[index];
      if(!projected||projected.name!==cp.name||projected.lat!==cp.lat||projected.lon!==cp.lon)throw new Error('官方補給站投影與來源座標不一致。');
      if(projected.projection?.candidates_truncated)return {...cp,candidates:[],projection_incomplete:true};
      return {...cp,candidates:(projected.projection?.candidates||[]).map(c=>({distance_m:c.along_route_m,raw_horizontal_m:c.raw_horizontal_along_route_m,raw_edge_index:c.raw_edge_index,offset_m:c.offset_m,lat:cp.lat,lon:cp.lon,ele:cp.elevationM??null}))};
    }
    const candidates=points.filter(p=>Math.abs(p.lat-cp.lat)<=1e-10&&Math.abs(p.lon-cp.lon)<=1e-10&&Number.isFinite(p.canonical_along_route_m)).map(p=>({source_point_index:p.source_point_index,distance_m:p.canonical_along_route_m,raw_horizontal_m:p.horizontal_m,lat:p.lat,lon:p.lon,ele:p.ele}));
    return {...cp,candidates:candidates.filter((p,i,a)=>i===0||Math.abs(p.distance_m-a[i-1].distance_m)>1e-6)};
  });
  // A candidate is retained only if it lies on a complete ordered sequence of
  // official stations. No official-km ratio is used to manufacture a position.
  const orderedRows=rows.filter(r=>r.candidates.length);
  if(orderedRows.length){
    const forward=orderedRows.map(r=>r.candidates.map(()=>false)),backward=orderedRows.map(r=>r.candidates.map(()=>false));forward[0].fill(true);backward.at(-1).fill(true);
    for(let i=1;i<orderedRows.length;i++)orderedRows[i].candidates.forEach((c,k)=>{forward[i][k]=orderedRows[i-1].candidates.some((p,j)=>forward[i-1][j]&&p.distance_m<c.distance_m);});
    for(let i=orderedRows.length-2;i>=0;i--)orderedRows[i].candidates.forEach((c,k)=>{backward[i][k]=orderedRows[i+1].candidates.some((p,j)=>backward[i+1][j]&&p.distance_m>c.distance_m);});
    orderedRows.forEach((r,i)=>{r.candidates=r.candidates.filter((c,k)=>forward[i][k]&&backward[i][k]);if(!r.candidates.length)r.mapping_conflict=true;});
  }
  return rows.map(r=>({...r,status:r.candidates.length===1?'unique':r.candidates.length>1?'ambiguous':'unmapped',mapping_method:race.mappingMode==='projected_official_coordinates'?'projected_official_coordinate_with_ordered_passages':'exact_official_coordinate_with_ordered_passages'}));
}
