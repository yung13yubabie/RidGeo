/** Conditional assets alone opt into a bounded streaming acquisition. */
export async function boundedResponseBytes(response,maximumBytes,{signal}={}){
 let reader=null,onAbort=null,interruption=null,rejectInterrupted=null;
 const cancel=()=>{try{void Promise.resolve(reader?reader.cancel():response?.body?.cancel()).catch(()=>{});}catch{}};
 try{
  if(!Number.isSafeInteger(maximumBytes)||maximumBytes<1||maximumBytes>1048576)throw Error('Invalid conditional asset byte ceiling.');
  const interrupted=new Promise((_,reject)=>{rejectInterrupted=reject;});void interrupted.catch(()=>{});
  onAbort=()=>{if(interruption)return;interruption=new DOMException('Asset acquisition cancelled.','AbortError');rejectInterrupted(interruption);cancel();};
  const check=()=>{if(signal?.aborted)onAbort();if(interruption)throw interruption;};
  const bounded=async value=>{const result=await Promise.race([value,interrupted]);check();return result;};
  signal?.addEventListener('abort',onAbort,{once:true});check();
  const declared=response.headers?.get('content-length');
  if(declared!==null&&declared!==undefined&&/^\d+$/u.test(declared)&&Number(declared)>maximumBytes)throw Error('Conditional asset exceeds declared byte ceiling.');
  if(!response.body||typeof response.body.getReader!=='function')throw Error('Bounded conditional asset streaming unavailable.');
  reader=response.body.getReader();const bytes=new Uint8Array(maximumBytes);let total=0;
  while(true){check();const part=await bounded(reader.read());check();if(!part||typeof part.done!=='boolean')throw Error('Conditional asset stream invalid.');if(part.done)break;const value=part.value;if(!(value instanceof Uint8Array)||value.length>maximumBytes-total)throw Error('Conditional asset acquisition exceeds byte ceiling.');bytes.set(value,total);total+=value.length;}
  return total===maximumBytes?bytes:bytes.slice(0,total);
 }catch(error){cancel();throw error;}
 finally{if(onAbort)signal?.removeEventListener('abort',onAbort);if(reader){try{reader.releaseLock();}catch{/* Cancellation/closed stream may already own cleanup. */}}}
}
