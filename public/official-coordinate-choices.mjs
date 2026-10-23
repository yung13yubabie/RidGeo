import {mapOfficialCheckpoints} from './official-checkpoints.js';
const finite=Number.isFinite;
const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
/** Advisory official pins are a different source channel from native GPX waypoints. */
export function collectOfficialCoordinateChoices(source,original,current,route){
  if(source?.coordinateSelection!=='explicit_official_passage'||!hash(source.sha256)||
    original?.source?.route_sha256!==source.sha256||!hash(current?.source?.route_sha256)||
    route?.route_sha256!==current.source.route_sha256||route.blocked||!finite(route.distance_m)||route.distance_m<=0)return [];
  const segments=current.raw_profile_segments||[];
  if(segments.length!==1||!Array.isArray(segments[0].points))return [];
  let records;try{records=mapOfficialCheckpoints({...source,sha256:current.source.route_sha256},current);}catch{return [];}
  return records.flatMap((record,index)=>{
    const projection=current.official_waypoints?.[index]?.projection;
    // A partial or unknown list must not masquerade as complete passage evidence.
    if(record.kind!=='checkpoint'||!record.id||!record.sourceStationId||!record.sourceMapFeatureId||
      projection?.advisory_only!==true||projection.candidates_truncated!==false||
      !Number.isInteger(projection.candidate_count)||projection.candidate_count!==projection.candidates?.length||
      projection.candidate_count>64||!['unique','ambiguous'].includes(projection.status))return [];
    return record.candidates.flatMap((candidate,passageIndex)=>{
      if(!finite(candidate.distance_m)||candidate.distance_m<=1e-6||route.distance_m-candidate.distance_m<=1e-6||
        !finite(candidate.raw_horizontal_m)||candidate.raw_horizontal_m<0||
        !finite(candidate.offset_m)||candidate.offset_m<0||candidate.offset_m>50||
        !Number.isInteger(candidate.raw_edge_index)||candidate.raw_edge_index<0||candidate.raw_edge_index>=segments[0].points.length-1)return [];
      const identity=JSON.stringify([source.id,source.sha256,record.id,record.sourceStationId,record.sourceMapFeatureId,record.lat,record.lon,current.source.route_sha256,candidate]);
      return [{key:`official-${index}-passage-${passageIndex}`,identity,checkpointId:record.id,stationId:record.sourceStationId,featureId:record.sourceMapFeatureId,originalSha:source.sha256,routeSha:current.source.route_sha256,candidate,record,passageIndex,distanceM:candidate.distance_m,label:`第 ${passageIndex+1} 處 · ${(candidate.distance_m/1000).toFixed(6)} km · 距路線 ${candidate.offset_m.toFixed(2)} m`}];
    });
  });
}
export function sameOfficialCoordinateOccurrence(row,choice){
  if(!row||!choice||row.locationPending||row.positionEdited||row.locationReconfirmed||row.association!=='explicit_user_selected_official_pin'||row.mappingRouteSha!==choice.routeSha||row.official?.id!==choice.checkpointId||row.official?.sourceStationId!==choice.stationId||row.official?.sourceMapFeatureId!==choice.featureId)return false;
  const current=row.mapping,wanted=choice.candidate;
  return !!current&&['distance_m','raw_horizontal_m','raw_edge_index','offset_m','lat','lon','ele'].every(key=>current[key]===wanted[key])&&row.distanceRaw===(choice.distanceM/1000).toFixed(9);
}
