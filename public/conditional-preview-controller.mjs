/** Internal read-only ownership only. No acquisition UI, Apply, export or fitting. */
import {OWNER_SNAPSHOT_VERSION,boundedPlainTree,scalarUnicode} from './conditional-preview-receipt.mjs';
import {createConditionalPreviewOwner,beginConditionalPreview,prepareConditionalPreviewTicket,
  completeConditionalPreviewPreparation,bindConditionalPreviewDispatch,receiveConditionalPreview,
  receiveConditionalPreviewFailure,cancelConditionalPreview} from './conditional-preview-owner.mjs';
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const abortError=()=>new DOMException('Internal preview canceled.','AbortError');
const clone=x=>JSON.parse(JSON.stringify(x));
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){for(const v of Object.values(x))freeze(v);Object.freeze(x);}return x;};
const key=x=>JSON.stringify(x);
const digestText=async text=>{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');};
// Parsed data comparisons never rewrite the opaque artifact/request text.
function same(a,b){
  const stack=[[a,b]];let n=0;
  while(stack.length){if(++n>500000)return false;const [x,y]=stack.pop();if(x===y)continue;
    if(x===null||y===null||typeof x!==typeof y||typeof x!=='object')return false;
    if(Array.isArray(x)||Array.isArray(y)){if(!Array.isArray(x)||!Array.isArray(y)||x.length!==y.length)return false;for(let i=0;i<x.length;i++)stack.push([x[i],y[i]]);}
    else{const keys=Object.keys(x);if(keys.length!==Object.keys(y).length)return false;for(const k of keys){if(!Object.hasOwn(y,k))return false;stack.push([x[k],y[k]]);}}
  }return true;
}
function interrupted(promise,signal){
  if(signal.aborted)return Promise.reject(abortError());
  return new Promise((resolve,reject)=>{
    const cancel=()=>reject(abortError());signal.addEventListener('abort',cancel,{once:true});
    Promise.resolve(promise).then(resolve,reject).finally(()=>signal.removeEventListener('abort',cancel));
  });
}
export function createConditionalPreviewController({getContext,transport,onState=()=>{},onTargetRejected=()=>{},hashText=digestText,isReadOnlyDetailsPending=()=>false}={}){
  let sequence=0,active=null,readyContext=null,owner=null,closed=false;
  let state=freeze({status:'empty',generation:0,preview:null,error:null});
  const readContext=()=>{const c=getContext();if(!c||!c.plan||typeof c.signature!=='string'||typeof c.prepare?.gpx_b64!=='string')fail('preview_unavailable','A current accepted goal/manual owner is required.');return c;};
  const ownsTransport=op=>transport.pending?.signal===op.controller.signal;
  function isCurrent(op){
    if(closed||active!==op||op.controller.signal.aborted)return false;
    if(performance.now()>=op.deadline){cancel('timeout');return false;}
    const c=readContext();
    // Capture callbacks may synchronously cancel or replace this operation.
    return !closed&&active===op&&!op.controller.signal.aborted&&c.plan===op.context.plan&&c.signature===op.context.signature&&c.prepare.gpx_b64===op.context.prepare.gpx_b64&&(!transport.pending||ownsTransport(op));
  }
  const requireCurrent=op=>{if(!isCurrent(op))throw abortError();};
  function publish(status,op,error=null){
    if(op&&active!==op)return false;
    state=freeze({status,generation:sequence,preview:status==='ready'?owner.preview:null,error:error?{code:typeof error.code==='string'?error.code:'preview_failed'}:null});
    // Terminal observation occurs once, after this exact attempt releases its
    // active lock. Intermediate and cancellation notifications remain immediate.
    if(op&&['ready','error','unavailable'].includes(status)){op.terminalState=state;return !closed&&active===op;}
    try{onState(state);}catch{/* Cosmetic/private observation cannot grant ownership. */}
    return !closed&&(!op||active===op);
  }
  function cancel(status='canceled'){
    sequence++;const old=active;active=null;readyContext=null;owner=cancelConditionalPreview(owner);
    // The transport removes completed listeners. An old signal cannot cancel a
    // newer foreground operation, and no unowned global cancel is called here.
    old?.controller.abort();if(old)clearTimeout(old.timer);
    publish(status,null);
  }
  function validateReady(){
    if(!readyContext)return;
    const expected=readyContext,observed=state;
    let valid=false;try{
      const before=readContext(),pending=transport.pending,binding=pending?{operation:pending.operation,signal:pending.signal,requestId:pending.requestId,generation:transport.generation}:null;
      let allowed=!pending;
      // Only an already-ready receipt may survive this exact owned read-only
      // details scope. Active C12 dispatch/foreground priority remains unchanged.
      if(pending&&pending.operation==='details')allowed=isReadOnlyDetailsPending(pending)===true;
      const after=readContext();
      valid=allowed&&!closed&&state===observed&&readyContext===expected&&state.status==='ready'&&transport.pending===pending&&
        (!binding||pending.operation===binding.operation&&pending.signal===binding.signal&&binding.signal?.aborted!==true&&pending.requestId===binding.requestId&&transport.generation===binding.generation)&&
        before.plan===expected.plan&&before.signature===expected.signature&&before.prepare.gpx_b64===expected.prepare.gpx_b64&&
        after.plan===expected.plan&&after.signature===expected.signature&&after.prepare.gpx_b64===expected.prepare.gpx_b64;
    }catch{}
    if(!valid&&readyContext===expected&&state===observed)cancel('stale');
  }
  const getState=()=>{validateReady();return state;};
  function foregroundAccepted(operation,signal){
    if(['conditional_recovery_preview','timed_history_inspect','quality_inspect'].includes(operation))return;
    if(transport.pending?.operation===operation&&transport.pending.signal===signal&&(!active||!ownsTransport(active)))cancel('canceled');
  }
  async function dispatch(op,operation,payload,options={}){
    requireCurrent(op);
    // manual_pace_prepare is not advisory in the legacy transport. Fail closed
    // synchronously at the final boundary, without preempting any other work.
    if(transport.pending)fail('worker_busy','Other foreground/advisory work has priority.');
    const promise=transport.request(operation,payload,{signal:op.controller.signal,...options});
    return interrupted(promise,op.controller.signal);
  }
  async function preview(readOpaqueRequest,{timeoutMs=120000}={}){
    if(closed)fail('preview_disposed','This internal owner has been disposed.');
    if(!Number.isFinite(timeoutMs)||timeoutMs<=0||timeoutMs>120000)fail('invalid_preview_deadline','The total internal preview deadline must be in (0,120000] ms.');
    if(typeof readOpaqueRequest!=='function')fail('invalid_preview_request','An internal opaque request reader is required.');
    if(transport.pending&&(!active||!ownsTransport(active)))fail('worker_busy','Other foreground/advisory work has priority.');
    const old=active,op={generation:++sequence,controller:new AbortController(),context:null,timer:null,ticket:null,deadline:performance.now()+timeoutMs};
    active=op;readyContext=null;owner=cancelConditionalPreview(owner);
    old?.controller.abort();if(old)clearTimeout(old.timer);
    // A single deadline covers capture/read/preparation/hash/init/compute. It is
    // additional to each Worker's existing deadline and never resets on status.
    op.timer=setTimeout(()=>{if(active===op){op.timedOut=true;cancel('timeout');}},timeoutMs);
    const attempt=async()=>{try{
      op.context=readContext();requireCurrent(op);
      const input=freeze(clone(op.context.prepare));const locks=freeze(clone(op.context.locks||[]));
      if(input.raw_sections.length>3000||locks.length>256)fail('preview_resource_limit','Current conditional raw-section/lock allocation exceeds its existing supported bound.');
      if(!publish('preparing',op))throw abortError();requireCurrent(op);
      let prepared=op.context.prepared;
      if(!prepared)prepared=await dispatch(op,'manual_pace_prepare',input);
      requireCurrent(op);
      if(!/^[a-f0-9]{64}$/u.test(prepared?.binding)||!same(prepared.raw_sections,input.raw_sections)||!same(prepared.checkpoint_ids,input.checkpoint_ids)||prepared.owner_revision!==input.owner_revision||prepared.baseline_plan?.route?.route_sha256!==op.context.routeSha256||prepared.baseline_plan?.route?.geometry_sha256!==op.context.geometrySha256)fail('invalid_preview_preparation','Actual current Worker/manual preparation is required.');
      const source=freeze({...clone(input),expected_manual_binding:prepared.binding,locks});
      if(!publish('reading',op))throw abortError();requireCurrent(op);
      const read=readOpaqueRequest(source,op.controller.signal);requireCurrent(op);
      const text=await interrupted(read,op.controller.signal);requireCurrent(op);
      if(typeof text!=='string'||!scalarUnicode(text)||text.length>16*1024*1024||new TextEncoder().encode(text).length>16*1024*1024)fail('invalid_preview_request','Bounded original opaque UTF-8 request text is required.');
      const request=JSON.parse(text);boundedPlainTree(request,{maxBytes:16*1024*1024});
      if(request.schema_version!=='production-conditional-recovery-bridge/0.1'||request.mode!=='forward')fail('invalid_preview_request','This read-only milestone admits forward mode only.');
      if(!Array.isArray(request.scenarios)||request.scenarios.length<1||request.scenarios.length>2||input.raw_sections.length*request.scenarios.length>3000)fail('preview_resource_limit','One or two explicit scenarios must fit the existing raw-section allocation bound.');
      const target=request.target_source;
      if(!target||!same(Object.fromEntries(Object.keys(source).map(k=>[k,target[k]])),source)||target.start_at!==null)fail('stale_preview_source','Opaque request must match current source/settings/raw sections/CPs/applied locks.');
      if(!publish('hashing',op))throw abortError();requireCurrent(op);
      const [targetHash,signatureHash,requestHash]=await interrupted(Promise.all([hashText(source.gpx_b64),hashText(op.context.signature),hashText(text)]),op.controller.signal);requireCurrent(op);
      const snapshot={schema_version:OWNER_SNAPSHOT_VERSION,mode:'goal',plan_identity:op.context.planIdentity,route_sha256:op.context.routeSha256,geometry_sha256:op.context.geometrySha256,owner_revision:source.owner_revision,input_revision:op.context.inputRevision,raw_signature:signatureHash,target_gpx_b64_sha256:targetHash,checkpoint_ids:source.checkpoint_ids,raw_section_ids:source.raw_sections.map(r=>r.id),station_revision:op.context.stationRevision,context_revision:requestHash};
      owner=createConditionalPreviewOwner(snapshot);let started=beginConditionalPreview(owner,text,snapshot);owner=started.state;op.ticket=started.ticket;
      const ticket=await interrupted(prepareConditionalPreviewTicket(op.ticket),op.controller.signal);requireCurrent(op);
      started=completeConditionalPreviewPreparation(owner,op.ticket,ticket,snapshot);owner=started.state;op.ticket=started.ticket;
      if(!publish('computing',op))throw abortError();requireCurrent(op);
      const result=await dispatch(op,'conditional_recovery_preview',started.payload,{onDispatch:correlation=>{
        requireCurrent(op);const bound=bindConditionalPreviewDispatch(owner,op.ticket,correlation,snapshot);owner=bound.state;op.ticket=bound.ticket;requireCurrent(op);
      }});requireCurrent(op);
      owner=receiveConditionalPreview(owner,op.ticket,result,snapshot);readyContext=op.context;
      if(!publish('ready',op))throw abortError();requireCurrent(op);
      return getState();
    }catch(error){
      if(active!==op||op.controller.signal.aborted)return getState();
      if(!op.context){publish('unavailable',op,error);return getState();}
      let live=false;try{live=isCurrent(op);}catch{}
      if(!live){if(active===op)cancel('stale');return getState();}
      // No real dispatch correlation means no source-retirement authority.
      if(op.ticket?.correlation){
        try{owner=receiveConditionalPreviewFailure(owner,op.ticket,error,owner.snapshot);}catch(bindingError){error=bindingError;}
      }
      if(!publish('error',op,error))return getState();
      if(owner?.retirementIntent){requireCurrent(op);onTargetRejected(owner.retirementIntent,op.context);}
      return getState();
    }finally{
      clearTimeout(op.timer);
      if(active===op)active=null;
    }};
    await attempt();
    if(!closed&&!active&&sequence===op.generation&&state===op.terminalState){
      try{onState(state);}catch{/* Cosmetic/private observation cannot grant ownership. */}
    }
    // A terminal observer may synchronously cancel, replace or mutate context.
    // Never return the ready object captured before that observation.
    return getState();
  }
  return {preview,getState,cancel,invalidate:()=>cancel('stale'),foregroundAccepted,isPending:()=>!!active,
    dispose:()=>{if(closed)return;closed=true;cancel('disposed');}};
}
