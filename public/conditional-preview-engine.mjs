/** Maintained byte-pinned capsule: no historical test/provenance data. */
import {validConditionalPayload} from './conditional-preview-receipt.mjs';
export const CONDITIONAL_MANIFEST_SHA256="3293cb360820d8cb56a979ace8f2ea84f1b696da19c3f4120af690ce4ca9d8fe";
const FILES=["frozen-search/conditional_stop_search.py", "frozen-search/frozen-r3/artifact-template.json", "frozen-search/frozen-r3/conditional_adapter.py", "frozen-search/frozen-r3/dependencies/cross_trail_predictor.py", "frozen-search/frozen-r3/dependencies/dependencies/intensity_transition.py", "frozen-search/frozen-r3/dependencies/trail_planner/__init__.py", "frozen-search/frozen-r3/dependencies/trail_planner/geometry.py", "frozen-search/frozen-r3/dependencies/trail_planner/gpx.py", "frozen-search/frozen-r3/dependencies/trail_planner/planning.py", "frozen-search/frozen-r3/dependencies/variable_transition.py", "production/gpx_admission.py", "production/manual_pace_adapter.py", "production_recovery_bridge.py", "runtime_integrity.py", "worker_adapter.py"];
const MANIFEST_FIELDS=["apply_admitted", "export_admitted", "files", "integration_base_commit", "integrity_profile", "model_source_base_commit", "requires_admission_manifest_sha256", "requires_core_manifest_sha256", "requires_existing_core", "requires_gpx_admission_sha256", "runtime_version", "schema_version", "source_bridge_freeze_manifest_sha256", "source_bridge_module_sha256", "total_bytes"];
const equalKeys=(value,keys)=>value&&Object.getPrototypeOf(value)===Object.prototype&&Object.keys(value).sort().join(',')===keys.join(',');
export function createConditionalPreviewEngine({baseEngine,readAsset,sha256,onStatus=()=>{}}){
  let initialized=null,pyodide=null;
  async function initialize(){
    pyodide=await baseEngine.getVerifiedRuntime();
    const bytes=await readAsset('python/conditional-preview-manifest.json',65536);
    if(bytes.length>65536||await sha256(bytes)!==CONDITIONAL_MANIFEST_SHA256)throw Error('Conditional manifest integrity mismatch.');
    const manifest=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    if(!equalKeys(manifest,MANIFEST_FIELDS)||manifest.integration_base_commit!=='d3f68a7f8f4adf10b1d6b25f9d9ac39ace545253'||manifest.model_source_base_commit!=='5d2a8fcede539551d4d62f6ac3a469b8106f34db'||manifest.schema_version!=='conditional-preview-runtime/0.2-capsule'||manifest.integrity_profile!=='conditional-runtime-capsule/1.0'||manifest.runtime_version!=='314.0.7'||manifest.apply_admitted!==false||manifest.export_admitted!==false||!equalKeys(manifest.files,FILES)||!Number.isSafeInteger(manifest.total_bytes)||manifest.total_bytes<1||manifest.total_bytes>1048576)throw Error('Conditional manifest schema mismatch.');
    const coreBytes=await readAsset('python/core-manifest.json',65536),admissionBytes=await readAsset('python/gpx-admission-manifest.json',65536);
    if(await sha256(coreBytes)!==manifest.requires_core_manifest_sha256||await sha256(admissionBytes)!==manifest.requires_admission_manifest_sha256)throw Error('Conditional base manifest integrity mismatch.');
    const core=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(coreBytes)),admission=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(admissionBytes));
    if(JSON.stringify(manifest.requires_existing_core)!==JSON.stringify(core.files)||manifest.requires_gpx_admission_sha256!==admission.sha256)throw Error('Conditional core/admission binding mismatch.');
    let total=0;pyodide.FS.mkdirTree('/trail_runtime/conditional_preview');
    for(const name of FILES){
      const spec=manifest.files[name];
      if(!equalKeys(spec,['bytes','sha256'])||!Number.isSafeInteger(spec.bytes)||spec.bytes<1||spec.bytes>1048576||!/^([a-f0-9]{64})$/u.test(spec.sha256))throw Error('Conditional member schema.');
      const data=await readAsset('python/conditional_preview/'+name,spec.bytes);total+=data.length;
      if(data.length!==spec.bytes||total>1048576||await sha256(data)!==spec.sha256)throw Error('Conditional member integrity mismatch.');
      const destination='/trail_runtime/conditional_preview/'+name;pyodide.FS.mkdirTree(destination.slice(0,destination.lastIndexOf('/')));pyodide.FS.writeFile(destination,data);
    }
    if(total!==manifest.total_bytes)throw Error('Conditional total asset bytes mismatch.');
    // Fixed absolute bootstrap; neither payload nor Python sys.path supplies it.
    await pyodide.runPythonAsync("import importlib.util\nif '_ridgeq_conditional_runtime_guard' in sys.modules: raise RuntimeError('Conditional runtime already initialized.')\n_capsule_spec=importlib.util.spec_from_file_location('_ridgeq_conditional_runtime_guard','/trail_runtime/conditional_preview/runtime_integrity.py')\n_capsule_guard=importlib.util.module_from_spec(_capsule_spec)\nsys.modules['_ridgeq_conditional_runtime_guard']=_capsule_guard\n_capsule_spec.loader.exec_module(_capsule_guard)\n_conditional_preview_handle=_capsule_guard.bootstrap(_trail_verified_shared_modules)\n");
    return pyodide;
  }
  async function request(payload,correlation){
    const started=performance.now();
    if(!validConditionalPayload(payload)||!correlation||!Number.isSafeInteger(correlation.generation)||!Number.isSafeInteger(correlation.requestId)||correlation.generation<=0||correlation.requestId<=0)return {ok:false,error:{code:'invalid_preview_request',message:'Conditional preview payload or correlation is invalid.'}};
    if(!initialized)initialized=initialize();await initialized;
    const metadata={request_sha256:payload.request_sha256,owner_snapshot_json:payload.owner_snapshot_json,owner_snapshot_sha256:payload.owner_snapshot_sha256,owner_generation:payload.owner_generation,correlation:{generation:correlation.generation,request_id:correlation.requestId},initialization_elapsed_s:(performance.now()-started)/1000};
    let handle;onStatus('conditional_computing');
    try{handle=pyodide.globals.get('_conditional_preview_handle');const text=handle(payload.request_json,JSON.stringify(metadata));if(typeof text!=='string'||new TextEncoder().encode(text).length>8*1024*1024)throw Error('Conditional response transfer bound.');return JSON.parse(text);}
    finally{handle?.destroy();}
  }
  return {request};
}
