import {hikingReferenceProvenance} from './hiking-reference.mjs';
import {buildTerrainSegments} from './terrain-segments.mjs';
import {buildCheckpointGroups} from './checkpoint-groups.mjs';
/** Shared read-only receipt preflight for owner Apply and manual workout export.
 * Uses exact canonical/CP time samples; never interpolates a moving-time curve.
 * Tolerance matches existing shared display (1e-7 s or 1e-9 relative) and the
 * unchanged continuous allocator's 1e-9 relative conservation target.
 */
export const MANUAL_CLOCK_RECEIPT_VERSION='manual-clock-receipt/1.0';
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const near=(a,b)=>finite(a)&&finite(b)&&Math.abs(a-b)<=Math.max(1e-7,1e-9*Math.max(Math.abs(a),Math.abs(b)));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const label=value=>typeof value==='string'&&value.trim().length>0&&value.length<=256;
const fail=message=>{throw Object.assign(new Error(message),{code:'invalid_manual_preview'});};
const assert=(ok,message)=>{if(!ok)fail(message);};
const sum=values=>{let total=0,correction=0;for(const value of values){const y=value-correction,next=total+y;correction=(next-total)-y;total=next;}return total;};
const lockProjection=lock=>({id:lock.id,child_ids:lock.child_ids,moving_pace_s_per_km:lock.moving_pace_s_per_km,allocation:lock.allocation});

export function validateManualClockReceipt(plan,{baseline=null,request=null,locks=null}={}){
  hikingReferenceProvenance(plan);
  const session=plan?.manual_session;
  assert(plan?.purpose==='manual_pace_clock_preview'&&plan.schema_version==='trail-manual-clock/1.0'&&plan.manual_version==='manual-moving-pace-clock/1.0','人工配速結果版本未通過核對。');
  assert(plan.status===undefined&&plan.downstream_response?.status==='not_estimable'&&plan.downstream_response.personal_model_calibrated===false&&plan.ability_prediction==='not_implemented','人工配速時間表不得宣稱個人生理預估。');
  assert(session&&typeof session.binding==='string'&&/^[a-f0-9]{64}$/u.test(session.binding)&&label(session.owner_revision)&&session.target_rebalanced===false&&session.parameter_refit===false&&session.mutates_input===false,'人工配速來源或計算旗標未通過核對。');
  assert(finite(plan.initial_target_elapsed_s)&&plan.initial_target_elapsed_s>0&&plan.input?.target_elapsed_s===plan.initial_target_elapsed_s&&finite(plan.revised_finish_elapsed_s)&&plan.revised_finish_elapsed_s===plan.target_elapsed_s&&near(plan.moving_s+plan.stops_s,plan.target_elapsed_s),'原目標與重算完賽時間未通過核對。');
  assert(Array.isArray(plan.checkpoints)&&Array.isArray(session.checkpoint_ids)&&session.checkpoint_ids.length<=101&&same(session.checkpoint_ids,plan.checkpoints.map(cp=>cp.id))&&session.checkpoint_ids.every(label)&&new Set(session.checkpoint_ids).size===session.checkpoint_ids.length,'站點識別已變更或重複。');
  if(request){assert(session.owner_revision===request.owner_revision&&same(session.checkpoint_ids,request.checkpoint_ids)&&same(session.raw_sections,request.raw_sections),'原始站點或地形識別已變更。');}
  if(baseline){
    assert(plan.route?.route_sha256===baseline.route.route_sha256&&plan.route?.geometry_sha256===baseline.route.geometry_sha256&&same(plan.geometry_snapshot,baseline.geometry_snapshot)&&same(plan.input,baseline.input)&&plan.model_version===baseline.model_version&&plan.geometry_version===baseline.geometry_version&&plan.initial_target_elapsed_s===baseline.target_elapsed_s&&plan.stops_s===baseline.stops_s,'路線、模型或原始設定已變更。');
    assert(plan.checkpoints.length===baseline.checkpoints.length,'站點清單已變更。');
    for(let i=0;i<baseline.checkpoints.length;i++)for(const name of ['name','distance_m','stop_s','cutoff_elapsed_s','cutoff_kind'])assert(plan.checkpoints[i][name]===baseline.checkpoints[i][name],'原始站點、停留或關門資料被變更。');
  }
  let terrainRows,summary;
  try{terrainRows=buildTerrainSegments(plan);summary=buildCheckpointGroups(plan,terrainRows);}catch{fail('配速時間與站點前綴未通過核對。');}
  for(const row of plan.canonical_timeline){
    assert(row.moving_s>0&&finite(row.minimum_s)&&(row.minimum_s>0||row.minimum_s===0&&plan.model_version==='campbell2022-hiking-reference-goal-v1'&&plan.input?.allocation_model==='campbell2022-hiking-reference-v1'&&plan.input?.hiking_consent===true&&plan.input.max_speed_m_s===null)&&(row.moving_s>=row.minimum_s||near(row.moving_s,row.minimum_s)),'原始格移動時間違反最快速度限制。');
    assert(row.maximum_s===null||finite(row.maximum_s)&&row.maximum_s>=row.minimum_s&&(row.moving_s<=row.maximum_s||near(row.moving_s,row.maximum_s)),'原始格移動時間違反最低速度限制。');
  }
  // These are the authoritative samples used by the existing display/export.
  // Unsupported arbitrary raw boundaries are refused, not linearly filled.
  const prefixes=new Map([[0,0]]);let cumulative=0,priorStops=0;
  for(const row of plan.canonical_timeline){cumulative+=row.moving_s;prefixes.set(row.end_m,cumulative);}
  for(const cp of plan.checkpoints){const moving=cp.arrival_elapsed_s-priorStops;if(prefixes.has(cp.distance_m))assert(near(prefixes.get(cp.distance_m),moving),'站點前綴與原始格時間不一致。');prefixes.set(cp.distance_m,moving);priorStops+=cp.stop_s;}
  const source=session.raw_sections,reported=plan.raw_section_times;
  assert(Array.isArray(source)&&Array.isArray(reported)&&source.length>0&&source.length<=25000&&source.length===reported.length,'原始地形時間不完整。');
  const byId=new Map(),rawEnds=new Set();let previous=0;
  for(let i=0;i<source.length;i++){
    const raw=source[i],time=reported[i];
    assert(raw&&time&&label(raw.id)&&!byId.has(raw.id)&&raw.start_m===previous&&finite(raw.end_m)&&raw.end_m>raw.start_m&&raw.end_m<=plan.route.distance_m&&time.id===raw.id&&time.start_m===raw.start_m&&time.end_m===raw.end_m&&finite(time.moving_s)&&time.moving_s>0,'原始地形識別、範圍或時間被變更。');
    assert(prefixes.has(raw.start_m)&&prefixes.has(raw.end_m),'此原始分段缺少精確格／站點時間，不能套用。');
    assert(near(time.moving_s,prefixes.get(raw.end_m)-prefixes.get(raw.start_m)),'原始地形時間與精確前綴不一致。');
    byId.set(raw.id,{...raw,moving_s:time.moving_s,index:i});rawEnds.add(raw.end_m);previous=raw.end_m;
  }
  assert(previous===plan.route.distance_m&&plan.checkpoints.every(cp=>rawEnds.has(cp.distance_m)),'原始地形覆蓋或站點邊界被變更。');
  assert(Array.isArray(session.locks)&&session.locks.length<=1000,'鎖定清單有誤。');
  if(locks)assert(same(session.locks.map(lockProjection),locks),'配速鎖定預覽不一致。');
  const used=new Set(),lockIds=new Set();let previousLockEnd=0;
  for(const lock of session.locks){
    assert(lock&&label(lock.id)&&!lockIds.has(lock.id)&&lock.allocation==='preserve_baseline_cost_shape'&&Array.isArray(lock.child_ids)&&lock.child_ids.length>0,'鎖定識別或分配方式有誤。');
    const children=lock.child_ids.map(id=>byId.get(id));
    assert(children.every((row,i)=>row&&!used.has(row.id)&&(i===0||row.index===children[i-1].index+1)),'鎖定須保留連續且不重疊的原始地形識別。');
    const first=children[0],last=children.at(-1),distance=last.end_m-first.start_m;
    assert(lock.start_m===first.start_m&&lock.end_m===last.end_m&&lock.start_m>=previousLockEnd&&!plan.checkpoints.some(cp=>first.start_m<cp.distance_m&&cp.distance_m<last.end_m),'鎖定範圍被變更或跨越站點。');
    assert(finite(lock.moving_pace_s_per_km)&&lock.moving_pace_s_per_km>0&&near(lock.requested_moving_s,lock.moving_pace_s_per_km*distance/1000)&&near(sum(children.map(row=>row.moving_s)),lock.requested_moving_s),'鎖定區間移動時間不一致。');
    for(const row of children)used.add(row.id);lockIds.add(lock.id);previousLockEnd=last.end_m;
  }
  if(baseline){
    // Clock-only editing has no downstream response. Internal conservation is
    // insufficient: a coherent but changed free curve must not acquire Apply
    // authority merely by rebuilding its CP/finish clocks to match.
    const originalPrefixes=new Map([[0,0]]);let originalMoving=0,originalStops=0;
    for(const row of baseline.canonical_timeline){originalMoving+=row.moving_s;originalPrefixes.set(row.end_m,originalMoving);}
    for(const cp of baseline.checkpoints){originalPrefixes.set(cp.distance_m,cp.arrival_elapsed_s-originalStops);originalStops+=cp.stop_s;}
    for(const row of byId.values())if(!used.has(row.id)){
      assert(originalPrefixes.has(row.start_m)&&originalPrefixes.has(row.end_m),'未鎖定原始分段缺少原始精確時間。');
      assert(near(row.moving_s,originalPrefixes.get(row.end_m)-originalPrefixes.get(row.start_m)),'未鎖定原始分段的移動時間被變更。');
    }
    const fixedShape=row=>Object.fromEntries(Object.keys(row).filter(k=>!['moving_s','cumulative_moving_s'].includes(k)).sort().map(k=>[k,row[k]]));
    let lockIndex=0;
    for(let i=0;i<plan.canonical_timeline.length;i++){
      const row=plan.canonical_timeline[i],original=baseline.canonical_timeline[i];
      assert(same(fixedShape(row),fixedShape(original)),'原始格的地形或速度限制被變更。');
      while(lockIndex<session.locks.length&&session.locks[lockIndex].end_m<=row.start_m)lockIndex++;
      const lock=session.locks[lockIndex],intersects=lock&&lock.start_m<row.end_m;
      if(!intersects)assert(near(row.moving_s,original.moving_s),'未鎖定原始格的移動時間被變更。');
    }
  }
  return {terrainRows,summary,prefixes};
}
