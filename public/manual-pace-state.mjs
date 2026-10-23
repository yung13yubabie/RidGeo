/** Pure owner transactions. Python owns all pacing arithmetic. */
import {validateManualClockReceipt} from './manual-clock-receipt.mjs';
export const MANUAL_PACE_ALLOCATION='preserve_baseline_cost_shape';
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const clone=value=>JSON.parse(JSON.stringify(value));
const key=value=>JSON.stringify(value);
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const same=(a,b)=>key(a)===key(b);
const assert=(ok,code,message)=>{if(!ok)fail(code,message);};
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const near=(a,b)=>finite(a)&&finite(b)&&Math.abs(a-b)<=Math.max(1e-7,1e-9*Math.max(Math.abs(a),Math.abs(b)));
const lockProjection=lock=>({id:lock.id,child_ids:lock.child_ids,moving_pace_s_per_km:lock.moving_pace_s_per_km,allocation:lock.allocation});

export function createManualPaceState({prepared,request,snapshot}){
  assert(prepared?.version==='manual-moving-pace-clock/1.0'&&typeof prepared.binding==='string'&&prepared.binding.length===64,'invalid_manual_session','人工配速計畫未通過核對。');
  assert(prepared.baseline_plan?.purpose==='goal_scenario_allocation'&&Array.isArray(prepared.raw_sections)&&same(prepared.raw_sections,request?.raw_sections)&&same(prepared.checkpoint_ids,request?.checkpoint_ids)&&prepared.owner_revision===request?.owner_revision,'invalid_manual_session','人工配速來源不一致。');
  assert(snapshot&&typeof snapshot==='object'&&!Array.isArray(snapshot),'invalid_manual_session','缺少目前路線版本。');
  const preparedCopy=clone(prepared);
  return freeze({prepared:preparedCopy,request:clone(request),snapshot:clone(snapshot),
    current:preparedCopy.baseline_plan,locks:[],pending:null,preview:null,undo:null,generation:0,nextId:1});
}

/** Fresh authority after verified whole-family restoration; no old ticket/Undo. */
export function restoreVerifiedManualPaceState({prepared,request,snapshot,result,locks,generation,nextId=1}){
  const state=createManualPaceState({prepared,request,snapshot});
  assert(Number.isSafeInteger(generation)&&generation>0&&Number.isSafeInteger(nextId)&&nextId>0,'invalid_manual_session','人工配速還原版本有誤。');
  assert(result?.manual_session?.binding===prepared.binding,'invalid_manual_session','人工配速還原來源已變更。');
  validateManualClockReceipt(result,{baseline:prepared.baseline_plan,request,locks});
  return freeze({...state,current:clone(result),locks:clone(locks),generation,nextId});
}

function verifyCurrent(state,snapshot){assert(state&&same(state.snapshot,snapshot),'stale_manual_session','路線、站點或設定已變更，請重新計算。');}
function requestTicket(state,locks,snapshot){
  verifyCurrent(state,snapshot);
  const ticket={generation:state.generation+1,binding:state.prepared.binding,snapshot:clone(snapshot),locks:clone(locks)};
  const next=freeze({...state,generation:ticket.generation,pending:ticket,preview:null});
  return {state:next,ticket:next.pending,payload:{...clone(state.request),expected_binding:state.prepared.binding,locks:clone(locks)}};
}

export function previewManualPace(state,{childIds,pace},snapshot){
  verifyCurrent(state,snapshot);
  assert(Array.isArray(childIds)&&childIds.length>0&&finite(pace)&&pace>0,'invalid_manual_pace','請填有效移動配速。');
  const positions=new Map(state.prepared.raw_sections.map((row,index)=>[row.id,index])),indexes=childIds.map(id=>positions.get(id)??-1),selection=new Set(childIds),selectedKey=key(childIds);
  assert(indexes.every((value,i)=>value>=0&&(i===0||value===indexes[i-1]+1)),'stale_manual_section','原始地形分段已變更，請重新選擇。');
  const exact=state.locks.find(lock=>key(lock.child_ids)===selectedKey);
  assert(!state.locks.some(lock=>lock!==exact&&lock.child_ids.some(id=>selection.has(id))),'overlapping_manual_lock','此區間與已鎖定配速重疊。請先解除原鎖定。');
  const lock={id:exact?.id??`manual-${state.nextId}`,child_ids:[...childIds],moving_pace_s_per_km:pace,allocation:MANUAL_PACE_ALLOCATION};
  const locks=state.locks.filter(item=>item!==exact).concat(lock).sort((a,b)=>positions.get(a.child_ids[0])-positions.get(b.child_ids[0]));
  const result=requestTicket(state,locks,snapshot);
  return {...result,state:freeze({...result.state,nextId:exact?state.nextId:state.nextId+1})};
}

export function previewManualUnlock(state,lockId,snapshot){
  verifyCurrent(state,snapshot);
  assert(state.locks.some(lock=>lock.id===lockId),'stale_manual_section','此配速鎖定已變更。');
  return requestTicket(state,state.locks.filter(lock=>lock.id!==lockId),snapshot);
}

export function receiveManualPacePreview(state,ticket,result,snapshot){
  verifyCurrent(state,snapshot);
  assert(state.pending&&ticket.generation===state.generation&&same(ticket,state.pending)&&same(ticket.snapshot,snapshot),'stale_manual_preview','配速預覽已取消或更新。');
  const session=result?.manual_session,base=state.prepared.baseline_plan;
  assert(session?.binding===state.prepared.binding,'invalid_manual_preview','配速預覽來源不一致。');
  validateManualClockReceipt(result,{baseline:base,request:state.request,locks:ticket.locks});
  return freeze({...state,pending:null,preview:{generation:ticket.generation,result:clone(result),locks:clone(ticket.locks),snapshot:clone(snapshot)}});
}

export function applyManualPacePreview(state,snapshot){
  verifyCurrent(state,snapshot);
  assert(state.preview&&state.preview.generation===state.generation&&same(state.preview.snapshot,snapshot),'stale_manual_preview','請先產生目前區間的配速預覽。');
  return freeze({...state,current:state.preview.result,locks:state.preview.locks,preview:null,pending:null,
    undo:{current:state.current,locks:state.locks,afterCurrent:state.preview.result}});
}

export function cancelManualPacePreview(state){
  return state?freeze({...state,generation:state.generation+1,pending:null,preview:null}):null;
}

export function resetManualPaceState(state,snapshot){
  verifyCurrent(state,snapshot);
  return freeze({...state,generation:state.generation+1,current:state.prepared.baseline_plan,locks:[],pending:null,preview:null,
    undo:{current:state.current,locks:state.locks,afterCurrent:state.prepared.baseline_plan}});
}

export function undoManualPaceState(state,snapshot){
  verifyCurrent(state,snapshot);
  assert(state.undo&&state.undo.afterCurrent===state.current,'stale_manual_undo','目前結果已變更，不能還原這次配速操作。');
  return freeze({...state,generation:state.generation+1,current:state.undo.current,locks:state.undo.locks,pending:null,preview:null,undo:null});
}

/** Bind a displayed merged node back to exact immutable raw child identities. */
export function manualChildIds(state,row){
  assert(row&&finite(row.start_m)&&finite(row.end_m)&&row.end_m>row.start_m,'stale_manual_section','分段範圍有誤。');
  const selected=state.prepared.raw_sections.filter(child=>child.start_m>=row.start_m&&child.end_m<=row.end_m);
  assert(selected.length&&selected[0].start_m===row.start_m&&selected.at(-1).end_m===row.end_m,'stale_manual_section','合併分段未對應原始地形。');
  return selected.map(child=>child.id);
}
