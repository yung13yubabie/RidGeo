import {assertSafeGpxMarkup} from '../../public/gpx-xml-markup.mjs';
import {OFFICIAL_HOSTS, OFFICIAL_PAGE_HOSTS, FIXED_GOOGLE_URLS, SOURCE_CANDIDATES} from './route-sources.mjs';

export const MAX_ROUTE_BYTES = 5 * 1024 * 1024;
const API_PREFIX = '/api/routes/';
const HASH = /^[a-f0-9]{64}$/;
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const ALLOWED_MIME = new Set(['application/gpx+xml','application/xml','text/xml','application/octet-stream','binary/octet-stream']);
const COMMON_HEADERS = Object.freeze({
  'Cache-Control':'no-store, private',
  'Pragma':'no-cache',
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
  'Cross-Origin-Resource-Policy':'same-origin',
});
export class BridgeError extends Error {
  constructor(code, status, message) { super(message); this.name='BridgeError'; this.code=code; this.status=status; }
}
const fail=(code,status,message)=>{throw new BridgeError(code,status,message);};
const json=(status, data, headers={})=>new Response(JSON.stringify(data),{status,headers:{...COMMON_HEADERS,'Content-Type':'application/json; charset=utf-8',...headers}});
const safeCancel=(reader)=>{if(reader){try {void reader.cancel().catch(()=>{});} catch {} try {reader.releaseLock();} catch {}}};
const safeCancelBody=(response)=>{try {void response?.body?.cancel().catch(()=>{});} catch {}};
const monotonicNow=()=>globalThis.performance?.now?.()??Date.now();

const GOOGLE_URLS=new Set(FIXED_GOOGLE_URLS);
/** Fixed sources only. Google query is accepted solely as one of the reviewed exact complete URLs. */
export function assertSourceURL(input) {
  if(typeof input==='string'&&GOOGLE_URLS.has(input))return new URL(input);
  if(typeof input!=='string'||input.length>2048||input.includes('?')||input.includes('#')) fail('source_configuration',503,'路線來源設定尚未核實。');
  let url; try {url=new URL(input);}catch{fail('source_configuration',503,'路線來源設定尚未核實。');}
  if(url.protocol!=='https:'||url.port||url.username||url.password||url.hash||url.search||
    url.href!==input||!OFFICIAL_HOSTS.includes(url.hostname)||!url.pathname.endsWith('.gpx'))
    fail('source_configuration',503,'路線來源設定尚未核實。');
  return url;
}

const isSpace=char=>char===' '||char==='\n'||char==='\r'||char==='\t';
function hasGpxOpening(xml) {
  // Linear bounded scanner: repeated comments must never enter nested regex quantifiers.
  const limit=Math.min(xml.length,16384);let p=xml.charCodeAt(0)===0xfeff?1:0;
  const whitespace=()=>{while(p<limit&&isSpace(xml[p]))p++;};
  whitespace();
  if(xml.startsWith('<?xml',p)&&isSpace(xml[p+5])){
    const end=xml.indexOf('?>',p+5);if(end<0||end+2>limit)return false;p=end+2;whitespace();
  }
  while(xml.startsWith('<!--',p)){
    const end=xml.indexOf('-->',p+4);if(end<0||end+3>limit)return false;p=end+3;whitespace();
  }
  if(!xml.startsWith('<gpx',p)||!(isSpace(xml[p+4])||xml[p+4]==='>'))return false;
  const end=xml.indexOf('>',p+4);return end>=0&&end<limit;
}
function hasGpxClosing(xml) {
  const limit=Math.max(0,xml.length-16384);let p=xml.length;
  const whitespace=()=>{while(p>limit&&isSpace(xml[p-1]))p--;};
  whitespace();
  while(p>=3&&xml.slice(p-3,p)==='-->'){
    const start=xml.lastIndexOf('<!--',p-3);if(start<limit)return false;p=start;whitespace();
  }
  return p-6>=limit&&xml.slice(p-6,p)==='</gpx>';
}
function hasPointEnvelope(xml) {
  // Only transport-sniff the first 256 KiB. Full GPX parsing stays in the browser.
  const limit=Math.min(xml.length,256*1024);let p=0;
  while(p<limit){
    const start=xml.indexOf('<',p);if(start<0||start>=limit)return false;
    const end=xml.indexOf('>',start+1);if(end<0||end>=limit)return false;
    if(end-start<=4096){
      const tag=xml.slice(start,end+1);
      if(/^<(?:trkpt|rtept|wpt)\s/.test(tag)&&/\blat\s*=/.test(tag))return true;
    }
    p=end+1;
  }
  return false;
}
/** Transport sniff, not a complete GPX parser. Browser Python parser remains authoritative. */
export function inspectGpxEnvelope(bytes) {
  let xml;try{xml=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{fail('invalid_gpx',502,'官方檔案不是支援的 UTF-8 GPX。');}
  if(/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(xml))
    fail('invalid_gpx',502,'官方檔案含不支援的 XML 宣告。');
  try{assertSafeGpxMarkup(xml);}catch{fail('invalid_gpx',502,'官方檔案含不支援的 XML 宣告。');}
  if(!hasGpxOpening(xml)||!hasGpxClosing(xml)||!hasPointEnvelope(xml))
    fail('invalid_gpx',502,'官方連結沒有回傳 GPX，可能是登入或下載確認頁。');
  return {validation:'gpx-envelope-only'};
}

/**
 * Returns null for non-API paths, allowing existing same-origin assets to pass through.
 * fetchImpl/platformGuard are trusted dependency injection seams for offline tests.
 * Production must retain default global fetch and actual Cloudflare strictly-public flag.
 */
export function createRouteBridge({
  sources=SOURCE_CANDIDATES,
  fetchImpl=globalThis.fetch,
  platformGuard=()=>globalThis.Cloudflare?.compatibilityFlags?.global_fetch_strictly_public===true,
  digest=async(bytes)=>new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
  timeoutMs=15000,
  maxBytes=MAX_ROUTE_BYTES,
  maxParallel=2,
  cooldownMs=5000,
  clock=()=>Date.now(),
}={}) {
  if(!Number.isInteger(maxBytes)||maxBytes<1||maxBytes>MAX_ROUTE_BYTES||
     !Number.isInteger(maxParallel)||maxParallel<1||maxParallel>2||
     !Number.isFinite(timeoutMs)||timeoutMs<1||timeoutMs>30000||
     !Number.isFinite(cooldownMs)||cooldownMs<0)
    throw new TypeError('Invalid bounded bridge configuration');
  const catalog=new Map();
  for(const original of sources){
    const source=Object.freeze({...original});
    if(!ID.test(source.id)||catalog.has(source.id))throw new TypeError('Invalid or duplicate server source ID');
    assertSourceURL(source.url);
    const page=new URL(source.officialPage);
    if(page.protocol!=='https:'||!OFFICIAL_PAGE_HOSTS.includes(page.hostname)||page.username||page.password||page.port||page.hash)
      throw new TypeError('Invalid official provenance URL');
    if(source.enabled&&(!HASH.test(source.reviewedSha256||'')||!source.reviewedAt||source.rightsStatus!=='reviewed_transient_personal_use'))
      throw new TypeError('Enabled source lacks byte baseline and transient-use review');
    catalog.set(source.id,source);
  }
  let active=0;
  const nextAllowed=new Map(); // Only timestamps keyed by fixed source IDs. No user data or GPX cache.

  return async function handle(request) {
    let requestURL;
    try {requestURL=new URL(request.url);}catch{return json(400,{error:'invalid_request',message:'請求格式不正確。'});}
    if(!requestURL.pathname.startsWith(API_PREFIX)) return null;
    const method=request.method;
    if(method!=='GET')return json(405,{error:'method_not_allowed',message:'路線轉接只支援讀取。'},{Allow:'GET'});
    const id=requestURL.pathname.slice(API_PREFIX.length);
    if(!ID.test(id)||request.url.includes('?')||request.url.includes('#'))return json(400,{error:'invalid_source_id',message:'請用路線庫中的來源編號。'});
    const source=catalog.get(id);
    if(!source)return json(404,{error:'unknown_source',message:'找不到已核實的路線來源。'});
    const origin=request.headers.get('Origin');
    if((origin&&origin!==requestURL.origin)||request.headers.get('Sec-Fetch-Site')==='cross-site')
      return json(403,{error:'same_origin_only',message:'請從本站的路線庫導入。'});
    const acceptedHash=request.headers.get('X-Route-Accept-Sha256');
    if(acceptedHash!==null&&!HASH.test(acceptedHash))return json(400,{error:'invalid_revision',message:'路線版本格式不正確。'});
    if(!source.enabled)return json(503,{error:'source_review_pending',message:'此官方來源尚待轉接查核。請先使用官方下載。',officialPage:source.officialPage});
    if(!platformGuard())return json(503,{error:'platform_guard_missing',message:'安全的公開網路出口尚未啟用，轉接暫不可用。'});
    if(request.signal?.aborted)return json(499,{error:'cancelled',message:'已取消導入。'});
    if(active>=maxParallel||clock()<(nextAllowed.get(id)||0))
      return json(429,{error:'bridge_busy',message:'路線轉接忙碌，請稍後重試。'},{'Retry-After':String(Math.max(1,Math.ceil(cooldownMs/1000)))});
    active++;
    // Reserve immediately, so a second click cannot queue duplicate upstream reads.
    nextAllowed.set(id,clock()+cooldownMs);
    const controller=new AbortController();
    let reader, response, timedOut=false, timer, yieldTimer, abortReject, interruption;
    let hashing=false, terminal=false, released=false;
    const release=()=>{if(released)return;released=true;active--;};
    const deadline=monotonicNow()+timeoutMs;
    const abortPromise=new Promise((_,reject)=>{abortReject=reject;});
    void abortPromise.catch(()=>{});
    const abort=()=>{if(interruption)return;interruption=new BridgeError(timedOut?'timeout':'cancelled',timedOut?504:499,timedOut?'官方路線下載逾時，請稍後重試。':'已取消導入。');controller.abort();abortReject(interruption);};
    const onClientAbort=()=>abort();
    request.signal?.addEventListener('abort',onClientAbort,{once:true});
    timer=setTimeout(()=>{timedOut=true;abort();},timeoutMs);
    // Every awaited network/body/hash operation has a total-timeout and cancellation race.
    // Fulfilled reads can starve timer callbacks, so also check an absolute deadline.
    const checkActive=()=>{if(request.signal?.aborted)abort();if(!interruption&&monotonicNow()>=deadline){timedOut=true;abort();}if(interruption)throw interruption;};
    const bounded=async(operation)=>{const value=await Promise.race([operation,abortPromise]);checkActive();return value;};
    try {
      checkActive();
      assertSourceURL(source.url);
      const pending=Promise.resolve().then(()=>{checkActive();return fetchImpl(source.url,{
        method:'GET',redirect:'manual',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',
        headers:{Accept:'application/gpx+xml, application/xml, text/xml, application/octet-stream;q=0.8'},
        signal:controller.signal,
      });});
      // If an injected/non-conforming fetch ignores abort, discard its eventual body.
      void pending.then(r=>{if(controller.signal.aborted)safeCancelBody(r);else response=r;},()=>{});
      response=await bounded(pending);
      if(response.status>=300&&response.status<400)
        fail('source_redirected',502,'官方下載位置已變更，請查看官方來源；轉接不跟隨重新導向。');
      if(response.status===401||response.status===403)
        fail('upstream_access_denied',502,'官方來源要求登入或拒絕讀取。請直接使用官方下載。');
      if(response.status!==200)
        fail('upstream_http_error',502,`官方 GPX 暫時無法讀取（${response.status}）。`);
      if(response.redirected||(response.url&&response.url!==source.url))
        fail('source_changed',502,'官方下載位置與查核來源不同。');
      const length=response.headers.get('Content-Length');
      if(length!==null&&(!/^\d+$/.test(length)||Number(length)>maxBytes))
        fail('file_too_large',502,'官方 GPX 超過 5 MiB 或大小宣告不正確。');
      // Fetch may decode gzip/Brotli while Content-Length still describes the
      // encoded transfer. Only an identity length can size/check decoded bytes.
      const encoding=(response.headers.get('Content-Encoding')||'identity').trim().toLowerCase();
      const declared=length===null||encoding!=='identity'?null:Number(length);
      const mime=(response.headers.get('Content-Type')||'').split(';')[0].trim().toLowerCase();
      if(!ALLOWED_MIME.has(mime))fail('invalid_content_type',502,'官方連結回傳網頁或不支援的檔案類型，未取得 GPX。');
      if(!response.body)fail('empty_file',502,'官方 GPX 沒有內容。');
      reader=response.body.getReader();
      // Copy each view immediately into one bounded container. A tiny/empty chunk
      // cannot add a retained object, and reused upstream buffers cannot alter it.
      const buffer=new Uint8Array(declared===null?maxBytes:declared);
      let total=0,batchChunks=0,batchBytes=0;
      while(true){
        checkActive();
        const part=await bounded(reader.read());
        const done=part?.done;
        if(typeof done!=='boolean')fail('invalid_file',502,'官方檔案內容格式不正確。');
        if(done)break;
        const value=part.value;
        if(!(value instanceof Uint8Array))fail('invalid_file',502,'官方檔案內容格式不正確。');
        const count=value.byteLength;
        total+=count;
        if(total>maxBytes)fail('file_too_large',502,'官方 GPX 超過 5 MiB。');
        if(declared!==null&&total>declared)fail('length_mismatch',502,'官方 GPX 內容與宣告大小不同。');
        if(count)buffer.set(value,total-count);
        batchChunks++;batchBytes+=count;
        if(batchChunks>=64||batchBytes>=262144){
          // Let queued client cancellation and timers run, even on empty reads.
          await bounded(new Promise(resolve=>{yieldTimer=setTimeout(()=>{yieldTimer=undefined;resolve();},0);}));
          batchChunks=0;batchBytes=0;
        }
      }
      if(!total)fail('empty_file',502,'官方 GPX 沒有內容。');
      if(declared!==null&&total!==declared)fail('length_mismatch',502,'官方 GPX 下載不完整或大小已變更。');
      const bytes=total===buffer.byteLength?buffer:buffer.slice(0,total);
      checkActive();
      inspectGpxEnvelope(bytes);
      checkActive();
      // Native hashing cannot be aborted. A canceled request keeps its bounded
      // reservation until the actual digest settles, so retries cannot overlap
      // uncounted native work or the source bytes it still owns.
      hashing=true;
      const pendingDigest=Promise.resolve().then(()=>{checkActive();return digest(bytes);});
      const digestSettled=()=>{hashing=false;if(terminal)release();};
      void pendingDigest.then(digestSettled,digestSettled);
      const hashed=await bounded(pendingDigest);
      const observedSha256=[...hashed].map(n=>n.toString(16).padStart(2,'0')).join('');
      if(!HASH.test(observedSha256))fail('digest_failed',502,'無法核對路線版本。');
      const changed=observedSha256!==source.reviewedSha256;
      const revision={sourceId:id,edition:source.edition,reviewedSha256:source.reviewedSha256,observedSha256,reviewedAt:source.reviewedAt,officialPage:source.officialPage};
      if(acceptedHash&&acceptedHash!==observedSha256)
        return json(409,{error:'revision_changed_again',message:'官方 GPX 已再次更新，請重新檢查最新版本。',...revision});
      if(changed&&!acceptedHash)
        return json(409,{error:'route_updated',message:'官方 GPX 已更新。檢查官方來源後可導入這個新版；舊版 CP 或關門資料不得自動套用。',...revision,canAcknowledgeRevision:true});
      // No upstream Set-Cookie, Location, credentials or identifying request headers are forwarded.
      return new Response(bytes,{status:200,headers:{
        ...COMMON_HEADERS,'Content-Type':'application/gpx+xml; charset=utf-8','Content-Length':String(total),
        'Content-Disposition':`attachment; filename="${id}.gpx"`,
        'X-Route-Source-Id':id,'X-Route-Official-Page':source.officialPage,'X-Route-Sha256':observedSha256,'X-Route-Reviewed-Sha256':source.reviewedSha256,
        'X-Route-Review-Status':changed?'source_changed_unreviewed':'catalog_reviewed',
        'X-Route-Validation':'gpx-envelope-only',
      }});
    } catch(error) {
      const e=error instanceof BridgeError?error:new BridgeError('upstream_unavailable',502,'目前無法連到官方 GPX。請稍後重試或使用官方下載。');
      return json(e.status,{error:e.code,message:e.message,officialPage:source.officialPage});
    } finally {
      clearTimeout(timer);clearTimeout(yieldTimer);request.signal?.removeEventListener('abort',onClientAbort);
      controller.abort();safeCancel(reader);if(!reader)safeCancelBody(response);
      terminal=true;if(!hashing)release();
    }
  };
}

export const handleRouteRequest=createRouteBridge();
