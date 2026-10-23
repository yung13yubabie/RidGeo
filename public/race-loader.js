import {downloadBridgedRoute,BRIDGED_SOURCES,getBridgedSource} from './route-bridge-client.mjs';
import {isVerifiedGoogleGpxEndpoint} from './source-endpoints.js';
import {RACES} from './catalog-data.js';
export const MAX_ROUTE_BYTES=5*1024*1024;
const origins=new Set(['https://pdf.utmb.world','https://46eaea7aca.clvaw-cdnwnd.com']);
export class RouteDownloadError extends Error {constructor(code,message){super(message);this.name='RouteDownloadError';this.code=code;}}
let catalogDigestJob=null;
export function assertRouteDownloadAvailable(){if(catalogDigestJob)throw new RouteDownloadError('download_busy','上一份路線仍在結束核對，請稍後重試。');}
function catalogDigest(bytes,digest){
  if(catalogDigestJob)throw new RouteDownloadError('download_busy','上一份路線仍在結束核對，請稍後重試。');
  const job={};catalogDigestJob=job;const release=()=>{if(catalogDigestJob===job)catalogDigestJob=null;};
  let promise;try{promise=Promise.resolve(digest(bytes));}catch(error){release();throw error;}
  void promise.then(release,release);return promise;
}
function cancelBody(response){try{void Promise.resolve(response?.body?.cancel()).catch(()=>{});}catch{}}
function cancelReader(reader){try{void Promise.resolve(reader.cancel()).catch(()=>{});}catch{}try{reader.releaseLock();}catch{}}

export async function downloadRaceRoute(id,{signal,fetchImpl=globalThis.fetch,timeoutMs=30000,baseOrigin,digest=async(bytes)=>new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))}={}) {
  const race=RACES.find(r=>r.id===id);
  if(!race)throw new RouteDownloadError('unknown_race','找不到這條已核實的路線。請重新選擇。');
  if(signal?.aborted)throw new DOMException('已取消導入。','AbortError');
  assertRouteDownloadAvailable();
  const guardedDigest=bytes=>catalogDigest(bytes,digest);
  const source=getBridgedSource(race.id);
  if(source||race.transport==='same_origin_bridge'||Object.hasOwn(race,'bridgeSourceId')||Object.hasOwn(race,'bridgeEndpoint')||BRIDGED_SOURCES.some(known=>known.officialURL===race.gpxUrl)){
    if(!source||race.transport!=='same_origin_bridge'||race.directFetch!==false||race.bridgeEndpoint!==source.endpoint||race.officialPage!==source.officialPage||race.bridgeSourceId!==source.sourceId||race.gpxUrl!==source.officialURL||race.sha256!==source.reviewedSha256||race.edition!==source.edition||race.bytes!==source.expectedBytes||race.verifiedAt!==source.reviewedAt)throw new RouteDownloadError('invalid_source','路線來源設定不正確。');
    try{return await downloadBridgedRoute(race.bridgeSourceId,{signal,fetchImpl,timeoutMs,digest:guardedDigest,...(baseOrigin===undefined?{}:{baseOrigin})});}
    catch(error){
      if(error.code==='cancelled'||signal?.aborted)throw new DOMException('已取消導入。','AbortError');
      const messages={route_changed:'官方 GPX 已更新，請查看官方來源，待路線庫核實後再導入。',hash_mismatch:'官方 GPX 與已核實版本不同，請查看官方來源。',timeout:'官方路線讀取逾時，請重試。',bridge_busy:'目前讀取人數較多，請稍後重試。',unavailable_environment:'此瀏覽器無法核對路線檔案，請使用新版瀏覽器。',file_too_large:'官方檔案超過 5 MiB，暫時無法導入。',access_denied:'官方來源暫時不允許讀取，請查看官方下載連結。'};
      throw new RouteDownloadError(error.code||'network_error',messages[error.code]||'官方 GPX 暫時無法完成核對。請重試，或查看官方下載連結。');
    }
  }
  const url=new URL(race.gpxUrl);
  if(url.protocol!=='https:'||!(origins.has(url.origin)||isVerifiedGoogleGpxEndpoint(race.gpxUrl))||url.username||url.password||url.hash)throw new RouteDownloadError('invalid_source','路線來源設定不正確。');
  if(signal?.aborted)throw new DOMException('已取消導入。','AbortError');
  if(!Number.isFinite(timeoutMs)||timeoutMs<=0)throw new RouteDownloadError('invalid_timeout','讀取期限設定有誤。');
  const controller=new AbortController(),deadline=performance.now()+timeoutMs;let reader,response,interruption,rejectInterrupted;
  const interrupted=new Promise((_,reject)=>{rejectInterrupted=reject;});void interrupted.catch(()=>{});
  const stop=timeout=>{if(interruption)return;interruption=timeout?new RouteDownloadError('timeout','官方路線下載逾時，請重試或使用官方下載連結。'):new DOMException('已取消導入。','AbortError');rejectInterrupted(interruption);controller.abort();};
  const check=()=>{if(signal?.aborted)stop(false);if(!interruption&&performance.now()>=deadline)stop(true);if(interruption)throw interruption;};
  const bounded=async value=>{const result=await Promise.race([value,interrupted]);check();return result;};
  const onAbort=()=>stop(false);signal?.addEventListener('abort',onAbort,{once:true});
  const timer=setTimeout(()=>stop(true),timeoutMs);
  try {
    check();
    const pending=Promise.resolve().then(()=>{check();return fetchImpl(race.gpxUrl,{method:'GET',mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',cache:'no-store',signal:controller.signal});});
    void pending.then(late=>{if(controller.signal.aborted)cancelBody(late);else response=late;},()=>{});
    response=await bounded(pending);
    if(!response||typeof response.headers?.get!=='function'||!Number.isInteger(response.status))throw new RouteDownloadError('invalid_response','官方 GPX 回應格式有誤。');
    if(!response.ok)throw new RouteDownloadError('http_error',`官方 GPX 暫時無法讀取（${response.status}）。請稍後重試。`);
    if(response.redirected||(response.url&&response.url!==race.gpxUrl))throw new RouteDownloadError('source_changed','官方下載位置已變更，請先查看官方賽事頁。');
    const length=response.headers.get('content-length');
    if(length!==null&&(!/^\d+$/.test(length)||Number(length)>MAX_ROUTE_BYTES))throw new RouteDownloadError('file_too_large','官方檔案超過 5 MiB，暫時無法導入。');
    // Fetch exposes decoded bytes, but a transfer length can describe gzip/br.
    // CORS may hide Content-Encoding entirely, so absence on a CORS response
    // does not prove identity. Actual bytes and the reviewed digest stay binding.
    const encoding=response.headers.get('content-encoding');
    const identityLength=encoding===null?response.type!=='cors':encoding.trim().toLowerCase()==='identity';
    const declared=length===null||!identityLength?null:Number(length);
    const contentType=(response.headers.get('content-type')||'').toLowerCase();
    if(contentType.includes('text/html'))throw new RouteDownloadError('invalid_file','官方連結回傳網頁，沒有取得 GPX。');
    if(!response.body||typeof response.body.getReader!=='function')throw new RouteDownloadError('empty_file','官方 GPX 沒有內容，請稍後重試。');
    reader=response.body.getReader();let buffer=new Uint8Array(declared??MAX_ROUTE_BYTES),total=0,yieldChunks=0,yieldBytes=0;
    while(true){
      check();const part=await bounded(reader.read());check();
      if(!part||typeof part.done!=='boolean')throw new RouteDownloadError('invalid_file','官方 GPX 回應格式有誤。');
      if(part.done)break;const value=part.value;
      if(!(value instanceof Uint8Array))throw new RouteDownloadError('invalid_file','官方 GPX 回應格式有誤。');
      if(value.byteLength>MAX_ROUTE_BYTES-total)throw new RouteDownloadError('file_too_large','官方檔案超過 5 MiB，暫時無法導入。');
      if(value.byteLength>buffer.length-total)throw new RouteDownloadError('length_mismatch','官方 GPX 長度與回應聲明不符。');
      buffer.set(value,total);total+=value.byteLength;yieldChunks++;yieldBytes+=value.byteLength;
      // A stream of already-resolved reads must let queued UI cancel/timer tasks run.
      if(yieldChunks>=64||yieldBytes>=262144){yieldChunks=0;yieldBytes=0;await bounded(new Promise(done=>setTimeout(done,0)));check();}
    }
    check();
    if(declared!==null&&total!==declared)throw new RouteDownloadError('length_mismatch','官方 GPX 長度與回應聲明不符。');
    if(!total)throw new RouteDownloadError('empty_file','官方 GPX 沒有內容，請稍後重試。');
    const bytes=total===buffer.length?buffer:buffer.slice(0,total);buffer=null;check();
    const pendingDigest=Promise.resolve().then(()=>{check();return guardedDigest(bytes);});
    const hash=[...await bounded(pendingDigest)].map(v=>v.toString(16).padStart(2,'0')).join('');check();
    if(hash!==race.sha256)throw new RouteDownloadError('route_changed','官方 GPX 已更新，與目前查核版本不同。請查看官方來源，待路線庫更新後再導入。');
    return bytes;
  }catch(error){
    check();
    if(error?.name==='AbortError')throw new DOMException('已取消導入。','AbortError');
    if(error instanceof RouteDownloadError)throw error;
    throw new RouteDownloadError('network_error','連不到官方 GPX。請重試，或使用官方下載連結。');
  }finally{clearTimeout(timer);signal?.removeEventListener('abort',onAbort);controller.abort();if(reader)cancelReader(reader);else cancelBody(response);}
}
