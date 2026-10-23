import {validateCompositeClock} from './manual-station-clock.mjs';
import {clockContentKey} from './station-clock-comparison.mjs';

// Trusted app owners issue these capabilities. Route/plan/export JSON cannot
// manufacture one. This is an object-identity boundary, not a sandbox against
// arbitrary privileged JavaScript calling the trusted issuer itself.
const sources=new WeakMap();
const fail=()=>{throw Object.assign(new Error('A current accepted station-clock source is required.'),{code:'stale_result'});};
export function issueStationClockWorkoutSource(plan,request,isCurrent){
 validateCompositeClock(plan,request);
 if(plan.purpose!=='station_clock_comparison'||typeof isCurrent!=='function')fail();
 const token=Object.freeze({schema_version:'station-clock-workout-source/1'});
 sources.set(token,{plan,request,isCurrent,requestContent:clockContentKey(request)});
 return token;
}
/** Cheap live-owner check, usable before allocating terrain or downloading. */
export function stationClockWorkoutSourceCurrent(token,plan){
 try{const source=sources.get(token);return !!source&&source.plan===plan&&source.isCurrent()===true;}catch{return false;}
}
/** Rebuild the complete accepted clock ledger; return only public metadata. */
export function validateStationClockWorkoutSource(token,plan){
 if(!stationClockWorkoutSourceCurrent(token,plan))fail();
 const source=sources.get(token);
 if(clockContentKey(source.request)!==source.requestContent)fail();
 validateCompositeClock(plan,source.request);
 if(!stationClockWorkoutSourceCurrent(token,plan))fail();
 const occurrences=plan.station_clock.stations.map((station,i)=>{
  if(station.id!==plan.checkpoints[i].id)fail();
  return {id:station.id==='automatic-finish'?null:station.id,generated:station.id==='automatic-finish'};
 });
 return {occurrences,basis:{initial_target_elapsed_s:plan.initial_target_elapsed_s,revised_finish_elapsed_s:plan.revised_finish_elapsed_s,downstream_response_status:'not_estimable',station_clock:{schema_version:plan.station_clock_version,clock_only:true,moving_source_kind:plan.clock_transaction.movingSource.kind,physiological_state:false,recovery_benefit:false,target_rebalanced:false}}};
}
