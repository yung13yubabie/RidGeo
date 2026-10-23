import {deadlineElapsed} from './cutoff-view.js';
import {checkpointCoordinateCandidates} from './checkpoint-coordinate-mapping.mjs';
/** Catalog facts are independent of optional GPX details, but belong to one admitted source. */
export function officialCheckpointFacts(race,route){
  if(!race?.checkpoints?.length)return [];
  if(!Number.isInteger(race.edition)||race.checkpoints.length>100)throw new Error('官方補給站資料格式不正確。');
  if(typeof race.sha256!=='string'||!/^[a-f0-9]{64}$/u.test(race.sha256)||route?.route_sha256!==race.sha256)throw new Error('官方補給站與 GPX 查核版本不一致。');
  const method=race.mappingMode==='official_distance_only'?'official_distance_only_requires_user_position':race.mappingMode==='projected_official_coordinates'?'projected_official_coordinate_with_ordered_passages':'exact_official_coordinate_with_ordered_passages';
  return race.checkpoints.map(cp=>({...cp,status:'unavailable',candidates:[],mapping_method:method}));
}
export function mapOfficialCheckpoints(race,details){
  if(!race?.checkpoints?.length)return [];
  if(details?.source?.route_sha256!==race.sha256)throw new Error('官方補給站與 GPX 查核版本不一致。');
  if(!Number.isInteger(race.edition)||race.checkpoints.length>100)throw new Error('官方補給站資料格式不正確。');
  return checkpointCoordinateCandidates(race,details);
}
export function officialCutoffElapsed(race,cutoffLocal,startClock){
  const seconds=deadlineElapsed(race,cutoffLocal,startClock);
  if(seconds!==null&&seconds<0)throw Object.assign(new Error('官方關門早於你設定的起跑時間，請確認起跑時刻。'),{code:'official_cutoff_before_start'});
  return seconds;
}
