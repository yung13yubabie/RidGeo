import {validProviderPayload} from './intervals-provider-receipt.mjs';
import {validHistoryPayload} from './history-selection-contract.mjs';
import {validConditionalPayload} from './conditional-preview-receipt.mjs';
/** Data transport only. Mathematical/business logic stays in Python. */
export class TransportError extends Error {
  constructor(message, code='transport_error',details=null,admissionRejected=false) { super(message); this.name='TransportError'; this.code=code; this.details=details&&typeof details==='object'&&!Array.isArray(details)?details:null; this.admissionRejected=admissionRejected===true; }
}
function abortError() { return new DOMException('已取消這次計算。','AbortError'); }
export class HttpDevelopmentTransport {
  async request(operation,payload,{signal}={}) {
    if(!['inspect','plan','details','reference','predict','hybrid','repair_propose','repair_apply'].includes(operation)) throw new TransportError('不支援的計算操作。','invalid_operation');
    const response=await fetch(`/api/${operation}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal});
    let data;try{data=await response.json();}catch{throw new TransportError('計算回應格式有誤，請重試。','invalid_response');}
    if(!response.ok)throw new TransportError(data.error?.message||'計算未完成，請重試。',data.error?.code,data.error?.details,data.error?.admission_rejected);
    return data;
  }
  cancel() {} // The per-request AbortSignal stops the HTTP client. It does not stop server CPU.
  dispose() { this.cancel(); }
}
export class PythonWorkerTransport {
  constructor({workerFactory,timeoutMs=120000}={}) {
    this.workerFactory=workerFactory||(()=>new Worker(new URL('./engine-worker.js',import.meta.url),{type:'module',name:'trail-goal-engine'}));
    this.timeoutMs=timeoutMs;this.worker=null;this.pending=null;this.generation=0;this.sequence=0;
  }
  _finish(error,result) {
    const pending=this.pending;if(!pending)return;
    this.pending=null;clearTimeout(pending.timer);
    pending.signal?.removeEventListener('abort',pending.abortListener);
    if(error)pending.reject(error);else pending.resolve(result);
  }
  _terminate() {
    const worker=this.worker;this.worker=null;this.generation++;
    if(worker) {try{worker.terminate();}catch{/* Already terminated. */}}
  }
  // Ordinary UI cancellation also runs after completed work. Keep the verified
  // idle runtime; only active synchronous Python work requires termination.
  cancel() {if(!this.pending)return;this._finish(abortError());this._terminate();}
  dispose() {this.cancel();if(this.worker)this._terminate();}
  _createWorker() {
    const generation=++this.generation;const worker=this.workerFactory();this.worker=worker;
    worker.onmessage=(event)=>{
      const message=event.data;const pending=this.pending;
      if(this.worker!==worker||!pending||!message||message.generation!==generation||message.requestId!==pending.requestId)return;
      if(message.type==='status') {try{pending.onStatus?.(message.status);}catch{/* Progress is cosmetic. */}return;}
      if(message.type!=='result')return;
      if(message.ok===true&&message.result&&typeof message.result==='object'&&!Array.isArray(message.result))this._finish(null,message.result);
      else {
        if(message.ok===true){this._finish(new TransportError('背景計算回應格式有誤，請重試。','invalid_response'));this._terminate();return;}
        const error=new TransportError(message.error?.message||'背景計算未完成，請重試。',message.error?.code||'worker_error',message.error?.details,message.error?.admission_rejected);
        this._finish(error);if(message.fatal)this._terminate();
      }
    };
    worker.onerror=()=>{if(this.worker!==worker)return;this._finish(new TransportError('背景執行環境未能啟動或已停止，請重試。','worker_failed'));this._terminate();};
    worker.onmessageerror=()=>{if(this.worker!==worker)return;this._finish(new TransportError('背景計算傳輸失敗，請重試。','message_error'));this._terminate();};
    return worker;
  }
  request(operation,payload,{signal,onStatus,onDispatch}={}) {
    if(!['inspect','plan','details','reference','predict','hybrid','repair_propose','repair_apply','surface_propose','surface_apply','timed_history_inspect','manual_pace_prepare','manual_pace_recalculate','quality_inspect','live_eta','conditional_recovery_preview','selected_history_predict','intervals_history_predict'].includes(operation))return Promise.reject(new TransportError('不支援的計算操作。','invalid_operation'));
    if(signal?.aborted)return Promise.reject(abortError());
    // Advisory work never preempts an existing request. Admission is synchronous.
    if(operation==='intervals_history_predict'&&!validProviderPayload(payload))return Promise.reject(new TransportError('平台歷史資料格式或容量有誤。','invalid_provider_request'));
    if(operation==='selected_history_predict'&&!validHistoryPayload(payload))return Promise.reject(new TransportError('歷史選擇資料格式或上限有誤。','invalid_selected_history_request'));
    if(['selected_history_predict','intervals_history_predict'].includes(operation)&&JSON.parse(payload.request_json).limits.max_wall_s*1000>Math.min(this.timeoutMs,120000))return Promise.reject(new TransportError('歷史計算期限超出背景傳輸上限。','history_deadline_invalid'));
    if(operation==='conditional_recovery_preview'&&!validConditionalPayload(payload))return Promise.reject(new TransportError('Conditional preview data is invalid or exceeds its explicit deadline cap.','invalid_preview_request'));
    if(operation==='conditional_recovery_preview'&&JSON.parse(payload.request_json).limits.max_wall_s*1000>Math.min(this.timeoutMs,120000))return Promise.reject(new TransportError('Requested preview deadline exceeds this transport timeout.','invalid_preview_request'));
    if(operation==='conditional_recovery_preview'&&this.pending&&this.pending.operation!=='conditional_recovery_preview')return Promise.reject(new TransportError('Foreground or other advisory work has priority.','worker_busy'));
    if(['timed_history_inspect','quality_inspect','live_eta'].includes(operation)&&this.pending)return Promise.reject(new TransportError('目前忙碌，稍後再分析。','worker_busy'));
    if(this.pending)this.cancel(); // Newer request owns the result. No overlapping Python execution.
    let worker;try{worker=this.worker||this._createWorker();}catch{this._terminate();return Promise.reject(new TransportError('此瀏覽器無法建立背景計算，請使用支援 WebWorker 的瀏覽器。','worker_unavailable'));}
    const requestId=++this.sequence;const generation=this.generation;
    return new Promise((resolve,reject)=>{
      const abortListener=()=>{if(this.pending?.generation===generation&&this.pending?.requestId===requestId)this.cancel();};
      const timer=setTimeout(()=>{
        if(this.pending?.requestId!==requestId)return;
        this._finish(new TransportError('執行環境載入或計算逾時，請重試。','worker_timeout'));this._terminate();
      },['conditional_recovery_preview','selected_history_predict','intervals_history_predict'].includes(operation)?Math.min(JSON.parse(payload.request_json).limits.max_wall_s*1000,this.timeoutMs,120000):this.timeoutMs);
      this.pending={generation,requestId,operation,resolve,reject,timer,signal,abortListener,onStatus};signal?.addEventListener('abort',abortListener,{once:true});
      if(['conditional_recovery_preview','selected_history_predict','intervals_history_predict'].includes(operation)&&onDispatch){try{onDispatch({generation,requestId});}catch{this._finish(new TransportError('Preview owner dispatch failed.','invalid_preview_owner'));this._terminate();return;}}
      try{worker.postMessage({type:'request',generation,requestId,operation,payload});}
      catch{this._finish(new TransportError('無法傳送背景計算，請重試。','message_error'));this._terminate();}
    });
  }
}
export function createTransport(mode) {
  if(mode==='webworker')return new PythonWorkerTransport();
  if(mode==='http-dev')return new HttpDevelopmentTransport();
  throw new TransportError('未設定有效的計算執行環境。','invalid_transport_mode');
}
