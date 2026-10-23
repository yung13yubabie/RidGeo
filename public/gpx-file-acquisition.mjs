/** One page-local file acquisition, not a general memory or parser authority. */
import {browserSha256} from './python-engine.mjs';
const MAX_BYTES=5*1024*1024;
const abortError=()=>new DOMException('檔案讀取已取消。','AbortError');
const failure=code=>Object.assign(new Error(code),{code});
const busyError=()=>failure('gpx_acquisition_busy');
export function createGpxFileAcquirer({FileReaderImpl,sha256=browserSha256}={}){
 let active=null;
 const status=()=>active?.phase==='setup'?'read':active?.phase||'idle';
 function read(file,{signal,beforeRead,replaceRead=false}={}){
  if(signal?.aborted)throw abortError();
  const size=file?.size;
  if(!Number.isSafeInteger(size)||size<1||size>MAX_BYTES)throw failure('gpx_file_size');
  if(beforeRead!==undefined&&typeof beforeRead!=='function')throw failure('gpx_file_setup');
  if(active){if(replaceRead===true&&active.phase==='read'&&!active.quarantined)active.cancel();if(active)throw busyError();}
  const job={phase:'setup',reader:null,quarantined:false,cancelled:false,settled:false,bytes:null,cancel:null};active=job;
  let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
  const settle=(error,value)=>{if(job.settled)return;job.settled=true;if(error)reject(error);else resolve(value);resolve=null;reject=null;};
  const detachReader=()=>{const r=job.reader;if(r){r.onload=null;r.onerror=null;r.onabort=null;r.onloadend=null;}job.reader=null;};
  const release=()=>{job.phase='done';detachReader();signal?.removeEventListener('abort',job.cancel);job.bytes=null;if(active===job)active=null;};
  const terminal=error=>{settle(error);release();};
  const check=()=>{if(job.cancelled||signal?.aborted)throw abortError();};
  job.cancel=()=>{
   if(job.cancelled)return;job.cancelled=true;settle(abortError());
   if(job.phase==='setup'){release();return;}
   if(job.phase!=='read')return; // The actual hash/encoder still owns its slot.
   const reader=job.reader;
   if(!reader){release();return;}
   try{reader.abort();}catch{/* A loading reader is quarantined below. */}
   if(job.reader!==reader)return; // Its synchronous terminal event already cleaned up.
   if(reader.readyState===1){job.quarantined=true;return;}
   release();
  };
  signal?.addEventListener('abort',job.cancel,{once:true});
  const onTerminal=error=>{
   if(job.phase!=='read')return;
   if(job.reader?.readyState===1){job.quarantined=true;job.cancelled=true;settle(error);return;}
   terminal(error);
  };
  async function hashAndEncode(){
   try{
    check();job.phase='hash';const sha=await sha256(job.bytes);check();
    if(typeof sha!=='string'||!/^[a-f0-9]{64}$/u.test(sha))throw failure('gpx_file_hash');
    job.phase='encode';const pieces=[];
    // Multiples of three preserve exact Base64 across chunks, without a full binary string.
    for(let offset=0;offset<job.bytes.length;offset+=12288){
     check();pieces.push(btoa(String.fromCharCode(...job.bytes.subarray(offset,offset+12288))));
     if(offset&&offset%393216===0){await new Promise(done=>setTimeout(done,0));check();}
    }
    const gpx_b64=pieces.join('');pieces.length=0;check();
    settle(null,Object.freeze({gpx_b64,sha256:sha,byteLength:size}));
   }catch(error){settle(error?.name==='AbortError'?abortError():failure(error?.code==='gpx_file_hash'?'gpx_file_hash':'gpx_file_read'));}
   finally{release();}
  }
  try{
   beforeRead?.();check();
   const Reader=FileReaderImpl??globalThis.FileReader;if(typeof Reader!=='function')throw failure('gpx_reader_unavailable');
   const reader=new Reader();job.reader=reader;job.phase='read';
   reader.onload=()=>{
    if(job.phase!=='read')return;
    if(job.cancelled){onTerminal(abortError());return;}
    if(reader.readyState===1){onTerminal(failure('gpx_file_read'));return;}
    const buffer=reader.result;
    if(!(buffer instanceof ArrayBuffer)||buffer.byteLength!==size){onTerminal(failure('gpx_file_changed'));return;}
    // Native FileReader owns this fresh buffer; no raw view escapes this private closure.
    job.bytes=new Uint8Array(buffer);detachReader();void hashAndEncode();
   };
   reader.onerror=()=>onTerminal(failure('gpx_file_read'));
   reader.onabort=()=>onTerminal(abortError());
   reader.onloadend=()=>onTerminal(job.cancelled?abortError():failure('gpx_file_read'));
   check();reader.readAsArrayBuffer(file);
  }catch(error){
   settle(error?.name==='AbortError'?abortError():failure(error?.code||'gpx_file_read'));
   if(job.reader?.readyState===1){job.cancelled=true;try{job.reader.abort();}catch{}if(job.reader?.readyState===1)job.quarantined=true;else release();}
   else release();
  }
  return promise;
 }
 return Object.freeze({read,status});
}
const pageAcquirer=createGpxFileAcquirer();
export const readGpxFile=(file,options)=>pageAcquirer.read(file,options);
export const gpxFileAcquisitionStatus=()=>pageAcquirer.status();
export function gpxAcquisitionMessage(error){return error?.code==='gpx_acquisition_busy'?'上一份檔案仍在結束核對，請稍後重試。':error?.code==='gpx_file_size'?'GPX 須為 1 byte 至 5 MiB。':error?.code==='gpx_reader_unavailable'?'此瀏覽器無法安全讀取檔案，請使用新版瀏覽器。':'檔案讀取未完成，請重新選擇。';}
