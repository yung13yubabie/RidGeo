import {HISTORY_MANIFEST_SHA256,HISTORY_CAPS,HISTORY_METHOD,validHistoryPayload,historyFields,historyAssert} from './history-selection-contract.mjs';
const FAMILY={'core_snapshot/cross_trail_predictor.py':'python/cross_trail_predictor.py','core_snapshot/trail_planner/__init__.py':'python/trail_planner/__init__.py','core_snapshot/trail_planner/gpx.py':'python/trail_planner/gpx.py','core_snapshot/trail_planner/geometry.py':'python/trail_planner/geometry.py','core_snapshot/trail_planner/planning.py':'python/trail_planner/planning.py','production/gpx_admission.py':'python/gpx_admission.py','multi_history_reference.py':'python/history_selection/multi_history_reference.py','worker_adapter.py':'python/history_selection/worker_adapter.py','runtime_integrity.py':'python/history_selection/runtime_integrity.py'};
export function createHistorySelectionEngine({baseEngine,readAsset,sha256,onStatus=()=>{}}){
let initialization=null,pyodide=null;
async function initialize(){
  pyodide=await baseEngine.getVerifiedRuntime();const bytes=await readAsset('python/history-selection-manifest.json',65536);
  historyAssert(await sha256(bytes)===HISTORY_MANIFEST_SHA256,'history_manifest_integrity');
  const manifest=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  historyFields(manifest,['schema_version','runtime_version','integrity_profile','source_model_sha256','method_version','files','total_bytes','scope']);
  historyAssert(manifest.schema_version==='selected-history-runtime/0.1'&&manifest.runtime_version==='314.0.7'&&manifest.integrity_profile==='local-history-source-boundary/0.1'&&manifest.source_model_sha256==='b7959c04ea437bc46ae58d3d1e4cf62b0ed0b613697bdd52f04cd7dbb640f345'&&manifest.method_version===HISTORY_METHOD&&Number.isSafeInteger(manifest.total_bytes)&&manifest.total_bytes>0&&manifest.total_bytes<262144);
  historyFields(manifest.files,Object.keys(FAMILY));let total=0;
  for(const [name,source]of Object.entries(FAMILY)){
    const row=manifest.files[name];historyFields(row,['source','bytes','sha256']);
    historyAssert(row.source===source&&Number.isSafeInteger(row.bytes)&&row.bytes>0&&row.bytes<=65536&&/^[a-f0-9]{64}$/u.test(row.sha256));
    const raw=await readAsset(source,row.bytes);historyAssert(raw.length===row.bytes&&await sha256(raw)===row.sha256,'history_member_integrity');total+=raw.length;
    const destination='/trail_runtime/history_selection/'+name;pyodide.FS.mkdirTree(destination.slice(0,destination.lastIndexOf('/')));pyodide.FS.writeFile(destination,raw);
  }
  historyAssert(total===manifest.total_bytes,'history_runtime_length');
  await pyodide.runPythonAsync("import importlib.util\nif '_ridgeq_history_runtime_guard' in sys.modules:raise RuntimeError('History already initialized.')\n_history_spec=importlib.util.spec_from_file_location('_ridgeq_history_runtime_guard','/trail_runtime/history_selection/runtime_integrity.py')\n_history_guard=importlib.util.module_from_spec(_history_spec)\nsys.modules['_ridgeq_history_runtime_guard']=_history_guard\n_history_spec.loader.exec_module(_history_guard)\n_history_selection_handle=_history_guard.bootstrap(_trail_verified_shared_modules,'/trail_runtime/gpx_admission.py','"+HISTORY_MANIFEST_SHA256+"')\n");
}
async function request(payload,correlation){
  const started=performance.now();
  if(!validHistoryPayload(payload)||!correlation||!Number.isSafeInteger(correlation.generation)||!Number.isSafeInteger(correlation.requestId)||correlation.generation<=0||correlation.requestId<=0)return{ok:false,error:{code:'invalid_selected_history_request',message:'歷史選擇資料格式或資源上限有誤。'}};
  if(!initialization)initialization=initialize();await initialization;
  const meta={request_sha256:payload.request_sha256,owner_snapshot_json:payload.owner_snapshot_json,owner_snapshot_sha256:payload.owner_snapshot_sha256,owner_generation:payload.owner_generation,correlation:{generation:correlation.generation,request_id:correlation.requestId},initialization_elapsed_s:(performance.now()-started)/1000};
  let handle;
  try{await pyodide.runPythonAsync('_history_guard.verify()');onStatus('history_computing');handle=pyodide.globals.get('_history_selection_handle');const text=handle(payload.request_json,JSON.stringify(meta));historyAssert(typeof text==='string'&&new TextEncoder().encode(text).length<=HISTORY_CAPS.responseBytes,'history_response_budget');return JSON.parse(text);}
  finally{handle?.destroy();}
}
return{request};
}
