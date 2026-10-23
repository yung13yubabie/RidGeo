/** Pure preview ownership. No plan/stop mutation, Apply or export operation. */
import {validateOwnerSnapshot,validConditionalPayload,validateConditionalPreviewReceipt,boundedPlainTree,scalarUnicode} from './conditional-preview-receipt.mjs';
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const clone=x=>JSON.parse(JSON.stringify(x));
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){for(const v of Object.values(x))freeze(v);Object.freeze(x);}return x;};
async function sha(text){const bytes=new TextEncoder().encode(text),digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function current(state,snapshot){validateOwnerSnapshot(snapshot);if(!state||!same(state.snapshot,snapshot))fail('stale_preview_owner','Preview owner changed.');}
export function createConditionalPreviewOwner(snapshot){validateOwnerSnapshot(snapshot);return freeze({snapshot:clone(snapshot),generation:0,pending:null,preview:null,error:null,retirementIntent:null});}
export function beginConditionalPreview(state,requestJson,snapshot){
  current(state,snapshot);const owner_snapshot_json=JSON.stringify(snapshot),generation=state.generation+1;
  if(typeof requestJson!=='string'||!scalarUnicode(requestJson)||new TextEncoder().encode(requestJson).length>16*1024*1024)fail('invalid_preview_request','Bounded original preview request required.');
  const ticket=freeze({generation,request_json:requestJson,owner_snapshot_json,payload:null,correlation:null});
  return {state:freeze({...state,generation,pending:ticket,preview:null,error:null,retirementIntent:null}),ticket};
}
export async function prepareConditionalPreviewTicket(ticket){
  const payload={request_json:ticket.request_json,request_sha256:await sha(ticket.request_json),owner_snapshot_json:ticket.owner_snapshot_json,owner_snapshot_sha256:await sha(ticket.owner_snapshot_json),owner_generation:ticket.generation};
  if(!validConditionalPayload(payload))fail('invalid_preview_request','Invalid bounded original preview request.');
  return freeze({...ticket,payload});
}
export function completeConditionalPreviewPreparation(state,ticket,prepared,snapshot){
  current(state,snapshot);if(state.pending!==ticket||ticket.generation!==state.generation||prepared.generation!==ticket.generation||prepared.correlation!==null||ticket.request_json!==prepared.request_json||ticket.owner_snapshot_json!==prepared.owner_snapshot_json||prepared.payload?.request_json!==ticket.request_json||prepared.payload?.owner_snapshot_json!==ticket.owner_snapshot_json||prepared.payload?.owner_generation!==ticket.generation||!validConditionalPayload(prepared.payload))fail('stale_preview_preparation','Canceled, replaced or swapped preparation cannot install its ticket.');
  return {state:freeze({...state,pending:prepared}),ticket:prepared,payload:prepared.payload};
}
export function bindConditionalPreviewDispatch(state,ticket,correlation,snapshot){
  current(state,snapshot);if(state.pending!==ticket||ticket.generation!==state.generation||!Number.isSafeInteger(correlation?.generation)||!Number.isSafeInteger(correlation?.requestId)||correlation.generation<=0||correlation.requestId<=0)fail('stale_preview_ticket','Preview dispatch is stale.');
  const bound=freeze({...ticket,correlation:clone(correlation)});return {state:freeze({...state,pending:bound}),ticket:bound};
}
export function receiveConditionalPreview(state,ticket,receipt,snapshot){
  current(state,snapshot);if(state.pending!==ticket||ticket.generation!==state.generation)fail('stale_preview_ticket','Preview was canceled or replaced.');
  validateConditionalPreviewReceipt(receipt,{ticket});return freeze({...state,pending:null,preview:clone(receipt),error:null,retirementIntent:null});
}
export function cancelConditionalPreview(state){return state?freeze({...state,generation:state.generation+1,pending:null,preview:null,error:null,retirementIntent:null}):null;}
export function invalidateConditionalPreview(state,snapshot){validateOwnerSnapshot(snapshot);return freeze({snapshot:clone(snapshot),generation:(state?.generation||0)+1,pending:null,preview:null,error:null,retirementIntent:null});}
export function receiveConditionalPreviewFailure(state,ticket,error,snapshot){
  current(state,snapshot);if(state.pending!==ticket||ticket.generation!==state.generation)fail('stale_preview_ticket','Preview failure was canceled or replaced.');
  if(!Number.isSafeInteger(ticket.correlation?.generation)||!Number.isSafeInteger(ticket.correlation?.requestId)||ticket.correlation.generation<=0||ticket.correlation.requestId<=0)fail('unbound_preview_failure','Source-attributed failures require a dispatched ticket.');
  const details=error?.details;
  if(details){boundedPlainTree(details,{maxNodes:4096,maxBytes:65536});if(details.request_sha256!==ticket.payload.request_sha256||details.owner_snapshot_sha256!==ticket.payload.owner_snapshot_sha256||details.owner_generation!==ticket.generation||details.correlation?.generation!==ticket.correlation?.generation||details.correlation?.request_id!==ticket.correlation?.requestId)fail('stale_preview_failure','Failure is not bound to this exact request.');}
  const retirementIntent=error?.admissionRejected===true&&details?.source_role==='target'&&details.scenario_id===null&&details.source_id===null&&details.source_b64_sha256===snapshot.target_gpx_b64_sha256?
    {source_role:'target',request_sha256:ticket.payload.request_sha256,owner_snapshot_sha256:ticket.payload.owner_snapshot_sha256,owner_generation:ticket.generation,source_b64_sha256:details.source_b64_sha256,code:error.code}:null;
  return freeze({...state,pending:null,preview:null,error:{code:typeof error?.code==='string'?error.code:'preview_failed'},retirementIntent});
}
