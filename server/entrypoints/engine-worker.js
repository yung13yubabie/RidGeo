import {loadPyodide} from './runtime/pyodide/ridgeq-314.0.7-cpython3.14.8-expat2.9.0-rebuild-r2/pyodide.mjs';
import {createPythonEngine,browserSha256} from './python-engine.mjs';
import {createIntervalsProviderEngine} from './intervals-provider-engine.mjs';
import {createHistorySelectionEngine} from './history-selection-engine.mjs';
import {createConditionalPreviewEngine} from './conditional-preview-engine.mjs';
import {boundedResponseBytes} from './bounded-asset-reader.mjs';
let active=null;
const readAsset=async(path,maximumBytes=null)=>{const response=await fetch(new URL(`./${path}`,import.meta.url));if(!response.ok)throw new Error('Runtime asset unavailable.');return maximumBytes===null?new Uint8Array(await response.arrayBuffer()):boundedResponseBytes(response,maximumBytes);};
const engine=createPythonEngine({
  loadPyodide,indexURL:new URL('./runtime/pyodide/ridgeq-314.0.7-cpython3.14.8-expat2.9.0-rebuild-r2/',import.meta.url).href,
  readAsset,
  sha256:browserSha256,
  onStatus:(status)=>{if(active)self.postMessage({type:'status',...active,status});}
});
const conditional=createConditionalPreviewEngine({baseEngine:engine,readAsset,sha256:browserSha256,onStatus:status=>{if(active)self.postMessage({type:'status',...active,status});}});
const selectedHistory=createHistorySelectionEngine({baseEngine:engine,readAsset,sha256:browserSha256,onStatus:status=>{if(active)self.postMessage({type:'status',...active,status});}});
const providerHistory=createIntervalsProviderEngine({baseEngine:engine,readAsset,sha256:browserSha256,onStatus:status=>{if(active)self.postMessage({type:'status',...active,status});}});
self.onmessage=async(event)=>{
  const message=event.data;
  if(!message||message.type!=='request'||!Number.isSafeInteger(message.generation)||!Number.isSafeInteger(message.requestId)||!['inspect','plan','details','reference','predict','hybrid','repair_propose','repair_apply','surface_propose','surface_apply','timed_history_inspect','manual_pace_prepare','manual_pace_recalculate','quality_inspect','live_eta','conditional_recovery_preview','selected_history_predict','intervals_history_predict'].includes(message.operation))return;
  if(active){self.postMessage({type:'result',generation:message.generation,requestId:message.requestId,ok:false,error:{code:'worker_busy',message:'上一個計算仍在進行。'},fatal:false});return;}
  active={generation:message.generation,requestId:message.requestId};
  try{
    const result=message.operation==='intervals_history_predict'?await providerHistory.request(message.payload,active):message.operation==='selected_history_predict'?await selectedHistory.request(message.payload,active):message.operation==='conditional_recovery_preview'?await conditional.request(message.payload,active):await engine.request(message.operation,message.payload);
    self.postMessage({type:'result',...active,...result,fatal:false});
  }catch{
    self.postMessage({type:'result',...active,ok:false,error:{code:'runtime_failed',message:'背景執行環境或計算未能完成，請重試。'},fatal:true});
  }finally{active=null;}
};
