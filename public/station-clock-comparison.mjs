import {hikingReferenceProvenance} from './hiking-reference.mjs';
import {parseCpStopValue,formatCpStopMinutes,sumStopSeconds} from './cp-stop-seconds.mjs';
import {planDisplay} from './schedule-view.mjs';
import {validateManualClockReceipt} from './manual-clock-receipt.mjs';

/** A fixed-moving-ledger clock comparison. No physiological state or coefficients. */
export const STATION_CLOCK_VERSION='station-clock-comparison/1';
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const near=(a,b)=>finite(a)&&finite(b)&&Math.abs(a-b)<=Math.max(1e-7,1e-9*Math.max(Math.abs(a),Math.abs(b)));
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const assert=(ok,message)=>{if(!ok)fail('invalid_station_clock',message);};
const rounded=n=>Math.floor(n+.5);
const clone=x=>JSON.parse(JSON.stringify(x));
export const clockContentKey=x=>JSON.stringify(x);
const label=x=>typeof x==='string'&&x.length>0&&x.length<=256;
const exactKeys=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join('|')===keys.slice().sort().join('|');

/** Refuse accessors/cycles/oversize input before serialization or clone allocation. */
export function preflightClockData(value,{maxBytes=8*1024*1024,maxNodes=500000,maxDepth=32}={}){
  let nodes=0,bytes=0;const active=new Set();
  const add=n=>{bytes+=n;if(bytes>maxBytes)fail('station_clock_resource_limit','停留方案超出完整資料上限。');};
  function stringBytes(s){
    add(2);
    for(let i=0;i<s.length;i++){
      const c=s.charCodeAt(i);
      if(c<32)add(6);else if(c===34||c===92)add(2);else if(c<128)add(1);else if(c<2048)add(2);
      else if(c>=0xd800&&c<=0xdbff){const d=s.charCodeAt(i+1);if(d>=0xdc00&&d<=0xdfff){add(4);i++;}else add(6);}
      else if(c>=0xdc00&&c<=0xdfff)add(6);else add(3);
    }
  }
  function walk(x,depth){
    if(++nodes>maxNodes||depth>maxDepth)fail('station_clock_resource_limit','停留方案超出完整資料上限。');
    if(x===null||typeof x==='boolean'){add(x===false?5:4);return;}
    // Scalar JSON conversion is bounded and cannot invoke a user toJSON hook.
    // Keep the existing string upper bound and every tree/resource ceiling.
    if(typeof x==='number'){assert(Number.isFinite(x),'停留方案含無效數值。');add(JSON.stringify(x).length);return;}
    if(typeof x==='string'){stringBytes(x);return;}
    assert(x&&typeof x==='object'&&!active.has(x),'停留方案資料有誤。');
    const array=Array.isArray(x),proto=Object.getPrototypeOf(x);assert(array?proto===Array.prototype:proto===Object.prototype||proto===null,'停留方案資料型別有誤。');
    const own=Reflect.ownKeys(x);assert(own.every(k=>typeof k==='string'),'停留方案不得含隱藏欄位。');
    const names=Object.keys(x);
    if(array){
      if(x.length>maxNodes-nodes)fail('station_clock_resource_limit','停留方案超出完整資料上限。');
      assert(own.length===x.length+1&&names.length===x.length&&own.includes('length'),'停留方案陣列須完整且不能含額外欄位。');
      for(let i=0;i<x.length;i++)assert(Object.prototype.hasOwnProperty.call(x,String(i)),'停留方案不得含稀疏陣列。');
    }else assert(own.length===names.length,'停留方案不得含隱藏欄位。');
    active.add(x);add(2+Math.max(0,names.length-1));
    for(const key of names){const d=Object.getOwnPropertyDescriptor(x,key);assert(d&&d.enumerable&&'value' in d,'停留方案不得含執行欄位。');if(!array){stringBytes(key);add(1);}walk(d.value,depth+1);}
    active.delete(x);
  }
  walk(value,0);return {nodes,estimatedBytes:bytes};
}

/** Minutes stay lossless declarations; sequential, containing and overlap differ. */
export function composeStationDwell(declaration){
  const fields={total:['mode','totalRaw'],sequential:['mode','serviceRaw','restRaw'],contains:['mode','serviceRaw','totalRaw'],concurrent:['mode','serviceRaw','restRaw']};
  if(!fields[declaration?.mode]||!exactKeys(declaration,fields[declaration.mode]))return {status:'invalid',code:'invalid_station_composition'};
  const parsed=Object.fromEntries(fields[declaration.mode].filter(k=>k!=='mode').map(k=>[k,parseCpStopValue(declaration[k])]));
  if(Object.values(parsed).some(x=>x.status==='invalid'))return {status:'invalid',code:'invalid_station_duration',declaration:clone(declaration)};
  if(Object.values(parsed).some(x=>x.status==='unknown'))return {status:'unknown',code:'station_duration_unknown',declaration:clone(declaration)};
  const service=parsed.serviceRaw?.seconds??null,rest=parsed.restRaw?.seconds??null;
  let total=parsed.totalRaw?.seconds;
  if(declaration.mode==='sequential')total=sumStopSeconds([service,rest]);
  if(declaration.mode==='concurrent')total=Math.max(service,rest);
  if(declaration.mode==='contains'&&total<service)return {status:'invalid',code:'total_shorter_than_service',declaration:clone(declaration)};
  let raw;try{raw=declaration.mode==='total'||declaration.mode==='contains'?declaration.totalRaw:formatCpStopMinutes(total);}catch{return {status:'invalid',code:'station_duration_out_of_range',declaration:clone(declaration)};}
  return {status:'known',totalS:total,totalRaw:raw,serviceS:service,restS:rest,extraRestS:declaration.mode==='contains'?total-service:declaration.mode==='sequential'?rest:null,declaration:clone(declaration)};
}

function checkBasis(basePlan,stationRows){
  hikingReferenceProvenance(basePlan);
  preflightClockData(basePlan);preflightClockData(stationRows,{maxBytes:256*1024,maxNodes:20000});
  assert(['goal_scenario_allocation','manual_pace_clock_preview','station_clock_comparison'].includes(basePlan?.purpose),'目前結果不能作為停留方案來源。');
  if(basePlan.purpose==='manual_pace_clock_preview')validateManualClockReceipt(basePlan);
  assert(basePlan.route&&label(basePlan.route.route_sha256)&&label(basePlan.route.geometry_sha256),'目前路線識別不完整。');
  assert(Array.isArray(stationRows)&&stationRows.length===basePlan.checkpoints?.length&&stationRows.length<=101,'站點清單已變更。');
  assert(new Set(stationRows.map(r=>r.id)).size===stationRows.length&&stationRows.every(r=>label(r.id)),'站點識別有誤。');
  planDisplay(basePlan);const prefixes=[];let before=0;
  for(let i=0;i<stationRows.length;i++){
    const row=stationRows[i],cp=basePlan.checkpoints[i],stop=parseCpStopValue(row.rawStop);
    assert(row.name===cp.name&&row.distanceM===cp.distance_m&&stop.status==='known'&&stop.seconds===cp.stop_s,'目前站點或原始停留值與計畫不一致。');
    assert(['service','timing_only','finish'].includes(row.kind)&&(!['timing_only','finish'].includes(row.kind)||stop.seconds===0),'計時站或終點停留有衝突。');
    if(basePlan.purpose==='station_clock_comparison'||basePlan.purpose==='manual_pace_clock_preview')assert(cp.id===row.id,'站點發生次序已變更。');
    const moving=cp.arrival_elapsed_s-before;assert(finite(moving)&&moving>=0&&near(cp.departure_elapsed_s,cp.arrival_elapsed_s+cp.stop_s),'站點精確時間不完整。');
    prefixes.push(moving);before=sumStopSeconds(stationRows.slice(0,i+1).map(r=>parseCpStopValue(r.rawStop).seconds));
  }
  assert(near(before,basePlan.stops_s)&&near(basePlan.moving_s+basePlan.stops_s,basePlan.target_elapsed_s),'目前完整時間帳未通過核對。');
  return prefixes;
}

/** basePlan/rows are accepted content; binding is supplied by the app's live owner. */
function composeClockTransaction({basePlan,stationRows,patch,binding},carry=null){
  const prefixes=checkBasis(basePlan,stationRows);
  preflightClockData(patch,{maxBytes:256*1024,maxNodes:20000});preflightClockData(binding,{maxBytes:256*1024,maxNodes:20000});
  assert(exactKeys(patch,['entries'])&&Array.isArray(patch.entries)&&(carry!==null?patch.entries.length===0:patch.entries.length>0)&&patch.entries.length<=100,'停留比較只接受站點變更；配速變更請先用人工配速套用。');
  assert(binding&&label(binding.baseIdentity)&&label(binding.transactionIdentity)&&typeof binding.baseDigest==='string'&&/^[a-f0-9]{64}$/u.test(binding.baseDigest),'停留方案來源未通過核對。');
  const changes=new Map();
  for(const e of patch.entries){assert(exactKeys(e,['id','composition'])&&label(e.id)&&!changes.has(e.id)&&stationRows.some(r=>r.id===e.id),'停留方案站點重複或已變更。');changes.set(e.id,composeStationDwell(e.composition));}
  assert(![...changes.values()].some(x=>x.status==='invalid'),'請確認整段停留、補給與休息時間。');
  if(carry!==null){preflightClockData(carry,{maxBytes:256*1024,maxNodes:20000});assert(Array.isArray(carry)&&carry.length===stationRows.length&&carry.every((r,i)=>exactKeys(r,['id','composition'])&&r.id===stationRows[i].id),'目前停留安排已變更。');}
  const compositions=stationRows.map((row,i)=>changes.get(row.id)||composeStationDwell(carry!==null?carry[i].composition:{mode:'total',totalRaw:row.rawStop}));
  if(carry!==null)assert(compositions.every((c,i)=>c.status==='known'&&c.totalRaw===stationRows[i].rawStop),'目前停留原始值未重現。');
  for(let i=0;i<stationRows.length;i++)assert(stationRows[i].kind==='service'||compositions[i].status==='known'&&compositions[i].totalS===0,'計時站與終點不能加入停留。');
  if(compositions.some(x=>x.status==='unknown'))return {status:'unknown',reason:'total_dwell_unknown',compositions};
  const plan=clone(basePlan);delete plan.manual_session;delete plan.manual_version;delete plan.station_clock;
  // A new arithmetic result cannot inherit a previous minimum qualification.
  if(Object.prototype.hasOwnProperty.call(plan,'service_requirements')){delete plan.service_requirements;delete plan.clock_transaction;}
  const stops=sumStopSeconds(compositions.map(x=>x.totalS)),elapsed=basePlan.moving_s+stops;
  assert(finite(elapsed)&&elapsed>0,'停留方案時間超出範圍。');
  const warnings=[];let priorDisplay=0;
  plan.checkpoints=basePlan.checkpoints.map((cp,i)=>{
    const before=sumStopSeconds(compositions.slice(0,i).map(x=>x.totalS)),stop=compositions[i].totalS;
    const arrival=prefixes[i]+before,departure=arrival+stop,ad=rounded(arrival),dd=rounded(departure);
    const margin=cp.cutoff_elapsed_s===null?null:cp.cutoff_elapsed_s-(cp.cutoff_kind==='arrival'?arrival:departure);
    if(margin!==null&&margin<0)warnings.push({code:'cutoff_missed',checkpoint:cp.name,message:`${cp.name} 的停留方案晚於關門。`,margin_s:margin});
    const moving=prefixes[i]-(i?prefixes[i-1]:0),distance=cp.distance_m-(i?basePlan.checkpoints[i-1].distance_m:0);
    const out={...cp,id:stationRows[i].id,stop_s:stop,leg_distance_m:distance,moving_s:moving,pace_s_per_km:moving/distance*1000,arrival_elapsed_s:arrival,departure_elapsed_s:departure,cutoff_margin_s:margin,cutoff_status:margin===null?'not_provided':margin<0?'missed':'within_plan',display:{moving_s:ad-priorDisplay,stop_s:dd-ad,arrival_elapsed_s:ad,departure_elapsed_s:dd}};priorDisplay=dd;return out;
  });
  const initial=basePlan.initial_target_elapsed_s??basePlan.target_elapsed_s;
  const movingBasis=basePlan.purpose==='station_clock_comparison'?clone(basePlan.station_clock.movingBasis):{purpose:basePlan.purpose,assumptions:clone(basePlan.assumptions??[]),inputConditions:Object.fromEntries(['allocation_model','hiking_consent','allow_flat_missing_elevation','allow_grade_clamp','max_speed_m_s','min_speed_m_s','walk_uphill_grade','walk_max_speed_m_s','fatigue_end_multiplier'].filter(k=>basePlan.input?.[k]!==undefined).map(k=>[k,basePlan.input[k]]))};
  plan.input=clone(basePlan.input);plan.input.checkpoints=plan.input.checkpoints.map((cp,i)=>({...cp,stop_s:compositions[i].totalS}));
  Object.assign(plan,{schema_version:STATION_CLOCK_VERSION,purpose:'station_clock_comparison',station_clock_version:STATION_CLOCK_VERSION,initial_target_elapsed_s:initial,target_elapsed_s:elapsed,revised_finish_elapsed_s:elapsed,display_target_elapsed_s:rounded(elapsed),moving_s:basePlan.moving_s,stops_s:stops,exact_conservation_error_s:0,warnings,ability_prediction:'not_implemented',downstream_response:{status:'not_estimable',personal_model_calibrated:false,unlocked_movement:'accepted_moving_ledger_unchanged'},assumptions:['僅計時比較 · 未估疲勞連動。','保留目前移動配速與鎖定；新增停留不自動重配回原目標。',...movingBasis.assumptions]});
  plan.constraints={...plan.constraints,all_provided_cutoffs_within_plan:plan.checkpoints.some(cp=>cp.cutoff_elapsed_s!==null)?warnings.length===0:null,cutoff_guarantee:false};
  const delta=stops-basePlan.stops_s;
  plan.station_clock={version:STATION_CLOCK_VERSION,movingBasis,binding:clone(binding),baseline:{purpose:basePlan.purpose,finishElapsedS:basePlan.target_elapsed_s,movingS:basePlan.moving_s,totalDwellS:basePlan.stops_s},netTotalDwellDeltaS:delta,requiredMovingSavingS:Math.max(0,delta),breakEvenMovingChangeS:-delta,physiologicalStateEstimated:false,recoveryBenefitEstimated:false,targetRebalanced:false,parameterRefit:false,locks:clone(basePlan.manual_session?.locks??basePlan.station_clock?.locks??[]),stations:stationRows.map((row,i)=>({id:row.id,name:row.name,distanceM:row.distanceM,kind:row.kind,currentRaw:row.rawStop,proposedRaw:compositions[i].totalRaw,composition:compositions[i]}))};
  planDisplay(plan);preflightClockData(plan);return {status:'ready',plan};
}

export function createClockComparison(request){return composeClockTransaction(request);}

/** Explicit unchanged-clock path; never fabricates a user stop patch. Owner authenticates its accepted source. */
export function carryStationClock(request){
  preflightClockData(request);assert(exactKeys(request,['basePlan','stationRows','declarations','binding']),'目前計時保留請求有誤。');
  const expected=request.basePlan?.station_clock?request.basePlan.station_clock.stations.map(r=>({id:r.id,composition:r.composition.declaration})):request.stationRows.map(r=>({id:r.id,composition:{mode:'total',totalRaw:r.rawStop}}));
  assert(clockContentKey(request.declarations)===clockContentKey(expected),'目前停留安排不能在保留計時時重解釋。');
  return composeClockTransaction({basePlan:request.basePlan,stationRows:request.stationRows,patch:{entries:[]},binding:request.binding},request.declarations);
}

/** Reconstruct from authenticated private basis, never trust visible/exported flags. */
export function validateClockComparison(plan,request){
  preflightClockData(plan);const expected=Object.prototype.hasOwnProperty.call(request,'declarations')?carryStationClock(request):createClockComparison(request);
  assert(expected.status==='ready'&&clockContentKey(plan)===clockContentKey(expected.plan),'停留方案完整時間帳或來源已變更。');return planDisplay(plan);
}

/** Minimal local export: no GPX/history/health/account/private proof paths. */
export function createClockExport(plan,request,{generation,entryDigest}={}){
  validateClockComparison(plan,request);assert(Number.isSafeInteger(generation)&&generation>0&&typeof entryDigest==='string'&&/^[a-f0-9]{64}$/u.test(entryDigest),'停留方案已失效。');
  const c=plan.station_clock;
  const assumptions=c.movingBasis.assumptions;assert(Array.isArray(assumptions)&&assumptions.length<=100&&assumptions.every(x=>typeof x==='string'&&x.length<=2048),'移動配速的原始條件不完整。');
  const rawSections=(plan.raw_section_times??[]).map(row=>{assert(label(row.id)&&[row.start_m,row.end_m,row.moving_s].every(finite),'原始分段時間有誤。');return {id:row.id,start_m:row.start_m,end_m:row.end_m,moving_s:row.moving_s};});
  const locks=c.locks.map(row=>{assert(label(row.id)&&Array.isArray(row.child_ids)&&row.child_ids.every(label)&&finite(row.moving_pace_s_per_km)&&row.allocation==='preserve_baseline_cost_shape','原始配速鎖定有誤。');return Object.fromEntries(['id','child_ids','moving_pace_s_per_km','allocation','start_m','end_m','requested_moving_s'].filter(k=>row[k]!==undefined).map(k=>[k,clone(row[k])]));});
  const exported={...(hikingReferenceProvenance(plan)?{hiking_reference:hikingReferenceProvenance(plan)}:{}),schema_version:STATION_CLOCK_VERSION,purpose:'station_clock_comparison',capabilities:{clock_only:true,physiological_state:false,recovery_benefit:false,personally_optimal_rest:false,trusted_reimport:false},generation,route:{route_sha256:plan.route.route_sha256,geometry_sha256:plan.route.geometry_sha256,distance_m:plan.route.distance_m},source_versions:{model:plan.model_version,geometry:plan.geometry_version},moving_ledger_basis:{purpose:c.movingBasis.purpose,assumptions:clone(assumptions),input_conditions:clone(c.movingBasis.inputConditions)},reference:{initial_goal_elapsed_s:plan.initial_target_elapsed_s,entry_content_digest:entryDigest,base_content_digest:c.binding.baseDigest},totals:{moving_s:plan.moving_s,total_dwell_s:plan.stops_s,finish_elapsed_s:plan.target_elapsed_s,net_total_dwell_delta_s:c.netTotalDwellDeltaS,required_moving_saving_s:c.requiredMovingSavingS},moving_ledger:plan.canonical_timeline.map(row=>({start_m:row.start_m,end_m:row.end_m,moving_s:row.moving_s,cumulative_moving_s:row.cumulative_moving_s})),raw_section_times:rawSections,locks,stations:c.stations.map((row,i)=>({...clone(row),arrival_elapsed_s:plan.checkpoints[i].arrival_elapsed_s,departure_elapsed_s:plan.checkpoints[i].departure_elapsed_s,cutoff_elapsed_s:plan.checkpoints[i].cutoff_elapsed_s,cutoff_kind:plan.checkpoints[i].cutoff_kind,cutoff_status:plan.checkpoints[i].cutoff_status})),limitations:['僅計時比較；移動時間固定，未估疲勞或休息效益。','此檔案不能直接匯入或重新套用可信計畫。']};
  preflightClockData(exported);return exported;
}
