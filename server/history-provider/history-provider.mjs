/** Private host seam. No OAuth, credential store, account activation or browser-supplied session. */
import {createHistoryHandler} from './core/server.mjs';
import {HistoryError} from './core/normalize.mjs';
import {normalizedByteLength} from './core/provider-boundary.mjs';
import {parseProviderJson, exactFields, providerAssert} from '../../public/intervals-provider-contract.mjs';
const PREFIX='/api/history/intervals/';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private',Pragma:'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',Vary:'Cookie, Authorization'};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
const valid=s=>s&&typeof s.principalId==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(s.principalId)&&typeof s.sessionId==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(s.sessionId)&&typeof s.athleteId==='string'&&/^i?[0-9]{1,32}$/.test(s.athleteId)&&typeof s.accountNamespace==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(s.accountNamespace)&&Number.isSafeInteger(s.grantEpoch)&&s.grantEpoch>=0&&typeof s.authorization==='string'&&/^Bearer [A-Za-z0-9._~+\/-]{1,4096}={0,2}$/.test(s.authorization)&&Array.isArray(s.scopes)&&s.scopes.includes('ACTIVITY:READ');
const snapshot=s=>Object.freeze({...s,scopes:Object.freeze([...s.scopes])});
const same=(a,b)=>['principalId','sessionId','athleteId','accountNamespace','grantEpoch','authorization'].every(k=>a[k]===b[k])&&b.scopes.includes('ACTIVITY:READ');

async function boundedImportText(request,race,check){
 const declared=request.headers.get('content-length');if(!(declared===null||/^\d+$/.test(declared)&&Number(declared)<=4096)){try{void Promise.resolve(request.body?.cancel()).catch(()=>{});}catch{}providerAssert(false,'invalid_request');}providerAssert(request.body,'invalid_request');
 const reader=request.body.getReader(),bytes=new Uint8Array(4096);let length=0,batchChunks=0,yieldTimer;
 try{
  for(;;){
   check();const next=await race(reader.read());check();const done=next?.done;providerAssert(typeof done==='boolean','invalid_request');if(done)break;
   const value=next.value;providerAssert(value instanceof Uint8Array&&value.byteLength<=4096-length,'invalid_request');bytes.set(value,length);length+=value.byteLength;
   // Retain no per-chunk objects; even empty reads must let cancellation run.
   if(++batchChunks>=64){await race(new Promise(done=>{yieldTimer=setTimeout(()=>{yieldTimer=undefined;done();},0);}));check();batchChunks=0;}
  }
  check();return new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,length));
 }finally{clearTimeout(yieldTimer);try{void Promise.resolve(reader.cancel()).catch(()=>{});}catch{}try{reader.releaseLock();}catch{}}
}
/** Injection is trusted server-module configuration only. Defaults fail closed. */
export function createHistoryProviderRoutes({appOrigin=null,resolveSession=null,sourcePolicy=null,transport,now=Date.now,randomUUID=()=>crypto.randomUUID(),sleep,state=null}={}){
 if(state&&(state.schema_version!=='intervals-selected-capability-state/1'||['contextFor','beginOperation','checkpoint','prepareChoices','readChoices','commitChoices','readCommit','recordBackoff','finishOperation'].some(k=>typeof state[k]!=='function')))throw new HistoryError('history_state_not_configured',503);
 const contexts=new Map();let acquisition=0,resolving=0;
 const policy=()=>sourcePolicy?.zeppTransientPersonalUseReviewed===true&&typeof sourcePolicy.policyRevision==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(sourcePolicy.policyRevision);
 const inner=createHistoryHandler({appOrigin,resolveSession,sourcePolicy,transport,now,randomUUID,sleep,state});
 const key=async s=>JSON.stringify([s.principalId,s.sessionId,s.athleteId,s.accountNamespace,s.grantEpoch,sourcePolicy.policyRevision,Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s.authorization))),v=>v.toString(16).padStart(2,'0')).join('')]);
 async function context(s){for(const[k,row]of contexts)if(row.expires<=now())contexts.delete(k);const k=await key(s);let row=contexts.get(k);if(!row){if(contexts.size>=32)throw new HistoryError('session_capacity',429);const context_id=randomUUID();if(!/^[A-Za-z0-9_-]{16,96}$/.test(context_id))throw new HistoryError('hosting_session_unavailable',503);row={value:Object.freeze({schema_version:'intervals-host-context/0.1',context_id,account_namespace:s.accountNamespace,grant_epoch:s.grantEpoch,source_policy_revision:sourcePolicy.policyRevision}),expires:now()+600000};providerAssert(k.length+JSON.stringify(row).length<=4096,'provider_context_budget');contexts.set(k,row);}return row.value;}
 return async function handle(request){const url=new URL(request.url);if(!url.pathname.startsWith(PREFIX))return null;let held=false,resolveHeld=false,timer,controller,abort,streamOwns=false,reader=null,streamController=null,released=false,innerResponse=null,stateLease=null,stateBinding=null;
  const cleanup=()=>{if(released)return;released=true;clearTimeout(timer);if(abort)request.signal.removeEventListener('abort',abort);if(held)acquisition--;if(resolveHeld)resolving--;if(stateLease){const owned=stateLease;stateLease=null;try{void Promise.resolve(state.finishOperation(stateBinding,owned.lease_id)).catch(()=>{});}catch{}}};
  const cancelReader=()=>{try{void Promise.resolve(reader?.cancel()).catch(()=>{});}catch{}try{reader?.releaseLock();}catch{}};
  try{if(!appOrigin||typeof resolveSession!=='function')throw new HistoryError('hosting_session_not_configured',503);
   if(new URL(appOrigin).origin!==appOrigin||url.origin!==appOrigin||(request.headers.get('origin')&&request.headers.get('origin')!==appOrigin)||['same-site','cross-site'].includes(request.headers.get('sec-fetch-site')))throw new HistoryError('origin_denied',403);
   const kind=url.pathname===PREFIX+'context'?'context':url.pathname===PREFIX+'activities'?'list':url.pathname===PREFIX+'import'?'import':null;
   if(!kind)throw new HistoryError('not_found',404);
   if(request.method!==(kind==='import'?'POST':'GET'))throw new HistoryError('method_not_allowed',405);
   if(kind!=='list'&&url.search)throw new HistoryError('invalid_request',400);
   if(kind==='import'&&request.headers.get('origin')!==appOrigin)throw new HistoryError('origin_denied',403);
   if(!policy())throw new HistoryError('source_policy_not_configured',503);
   if(kind==='context'){if(resolving>=1)throw new HistoryError('history_busy',429);resolving++;resolveHeld=true;}
   else{if(acquisition>=1)throw new HistoryError('history_busy',429);acquisition++;held=true;}
   controller=new AbortController();const deadline=now()+15000;
   timer=setTimeout(()=>{controller.abort(new HistoryError('upstream_timeout',504));if(streamController){try{streamController.error(controller.signal.reason);}catch{}cancelReader();cleanup();}},15000);abort=()=>{controller.abort(new HistoryError('cancelled',499));if(streamController){try{streamController.error(controller.signal.reason);}catch{}cancelReader();cleanup();}};request.signal.addEventListener('abort',abort,{once:true});if(request.signal.aborted)abort();
   const check=()=>{if(controller.signal.aborted)throw controller.signal.reason;if(now()>=deadline)throw new HistoryError('upstream_timeout',504);};
   const race=async promise=>{check();let stop;try{return await Promise.race([promise,new Promise((_,reject)=>{stop=()=>reject(controller.signal.reason);controller.signal.addEventListener('abort',stop,{once:true});})]);}finally{controller.signal.removeEventListener('abort',stop);}};
   const storeCall=async(name,args)=>{try{return await race(Promise.resolve().then(()=>state[name](...args,{signal:controller.signal})));}catch(e){if(e instanceof HistoryError)throw e;check();throw new HistoryError('history_state_unavailable',503);}};
   const checkpointLease=async()=>{if(stateLease){await storeCall('checkpoint',[stateBinding,stateLease.lease_id]);check();}};
   let original;try{original=await race(Promise.resolve().then(()=>resolveSession(request)));}catch(e){if(e instanceof HistoryError)throw e;throw new HistoryError('hosting_session_unavailable',503);}check();if(!valid(original))throw new HistoryError('verified_session_required',401);original=snapshot(original);const revision=sourcePolicy.policyRevision;
   if(state)stateBinding={owner_key:JSON.stringify([original.principalId,original.sessionId,original.athleteId,original.accountNamespace,original.grantEpoch,revision]),authority_key:await race(key(original)),account_namespace:original.accountNamespace,grant_epoch:original.grantEpoch,source_policy_revision:revision};
   const host=state?await storeCall('contextFor',[stateBinding,randomUUID]):await race(context(original));check();
   if(state&&kind!=='context'){const pending=Promise.resolve().then(()=>state.beginOperation(stateBinding,Math.floor(deadline-now()),{signal:controller.signal}));void pending.then(late=>{if(controller.signal.aborted||released){try{void Promise.resolve(state.finishOperation(stateBinding,late.lease_id)).catch(()=>{});}catch{}}},()=>{});try{stateLease=await race(pending);}catch(e){if(e instanceof HistoryError)throw e;check();throw new HistoryError('history_state_unavailable',503);}check();}
   let importText=null,data;if(kind==='context')data={schema_version:'intervals-provider-context/0.1',host_context:host};
   else{if(kind==='import'){const text=await boundedImportText(request,race,check);importText=text;const input=parseProviderJson(text,{maxBytes:4096,maxNodes:100,maxDepth:4});exactFields(input,['selections']);providerAssert(Array.isArray(input.selections)&&input.selections.length>=1&&input.selections.length<=8,'invalid_request');for(const row of input.selections){exactFields(row,['choiceId']);providerAssert(typeof row.choiceId==='string'&&/^[A-Za-z0-9_-]{16,96}$/.test(row.choiceId),'invalid_request');}}
    const forwarded=new Request(request.url,{method:request.method,headers:request.headers,signal:controller.signal,...(kind==='import'?{body:importText}:{})});const pendingInner=Promise.resolve().then(()=>inner(forwarded,stateLease?{binding:stateBinding,lease_id:stateLease.lease_id}:null));void pendingInner.then(late=>{if(controller.signal.aborted||released){try{void Promise.resolve(late?.body?.cancel()).catch(()=>{});}catch{}}},()=>{});const response=await race(pendingInner);check();if(!response?.ok)return response;
    innerResponse=response;
   }
   await checkpointLease();let fresh;try{fresh=await race(Promise.resolve().then(()=>resolveSession(request)));}catch(e){if(e instanceof HistoryError)throw e;throw new HistoryError('hosting_session_unavailable',503);}check();if(!valid(fresh)||!same(original,fresh)||!policy()||sourcePolicy.policyRevision!==revision)throw new HistoryError('access_epoch_changed',403);
   if(innerResponse){
    providerAssert(innerResponse.body&&innerResponse.headers.get('content-type')?.split(';')[0].trim()==='application/json','provider_response_type');
    const encoder=new TextEncoder(),prefix=encoder.encode('{"schema_version":'+JSON.stringify(kind==='list'?'intervals-provider-list/0.1':'intervals-provider-import/0.1')+',"host_context":'+JSON.stringify(host)+','+JSON.stringify(kind==='list'?'list':'import_result')+':'),suffix=encoder.encode('}');let length=0,phase=0,terminal=false;reader=innerResponse.body.getReader();streamOwns=true;
    const fail=e=>{if(terminal)return;terminal=true;try{streamController.error(e);}catch{}cancelReader();cleanup();};
    const enqueue=chunk=>{check();providerAssert(chunk instanceof Uint8Array,'provider_response_type');providerAssert(length+chunk.byteLength<=16777216,'provider_response_budget');length+=chunk.byteLength;streamController.enqueue(chunk);};
    const body=new ReadableStream({start(c){streamController=c;},async pull(){if(terminal)return;try{check();if(phase===0){phase=1;enqueue(prefix);return;}const next=await race(reader.read());check();await checkpointLease();if(!next.done){enqueue(next.value);return;}let last;try{last=await race(Promise.resolve().then(()=>resolveSession(request)));}catch{throw new HistoryError('hosting_session_unavailable',503);}check();if(!valid(last)||!same(original,last)||!policy()||sourcePolicy.policyRevision!==revision)throw new HistoryError('access_epoch_changed',403);enqueue(suffix);terminal=true;streamController.close();cancelReader();cleanup();}catch(e){fail(e);}},cancel(){if(!terminal){terminal=true;controller.abort(new HistoryError('cancelled',499));cancelReader();cleanup();}}},{highWaterMark:0});
    return new Response(body,{status:200,headers});
   }
   normalizedByteLength(data,{check});check();return reply(data);
  }catch(e){const safe=e instanceof HistoryError?e:null;return reply({error:safe?.code||(/^[a-z0-9_]{1,96}$/.test(e?.code||'')?e.code:'history_unavailable')},safe?.status||400);}
  finally{if(!streamOwns){try{void Promise.resolve(innerResponse?.body?.cancel()).catch(()=>{});}catch{}cleanup();}}
 };
}
// Registration does not activate a service: no trusted hosting session/origin/policy exists here.
export const handleHistoryProviderRequest=createHistoryProviderRoutes();
