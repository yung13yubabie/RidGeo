/** Thin, testable adapter around the exact frozen Python modules. */
const CORE_FILES=['__init__.py','gpx.py','geometry.py','planning.py'];
const RUNTIME_VERSION='314.0.7';
const BRIDGE = `
import base64, binascii, json, sys, pyexpat, math
from trail_planner import parse_gpx, build_geometry, create_plan, InputError
from gpx_admission import validate_gpx_admission

def _trail_admission_handle(operation, request_json):
    # Common raw-byte boundary. Optional details/schema/projection and geometry
    # model eligibility are separate from fatal source admission rejection.
    try:
        request=json.loads(request_json)
        keys=("reference_gpx_b64", "target_gpx_b64") if operation in {"predict", "hybrid"} else ("gpx_b64",)
        if not isinstance(request,dict) or any(not isinstance(request.get(key),str) for key in keys):
            raise InputError("invalid_request","GPX 請求格式有誤。")
        for key in keys:
            try:
                data=base64.b64decode(request[key],validate=True)
            except (ValueError,TypeError,binascii.Error):
                raise InputError("invalid_file","GPX 傳輸編碼有誤。")
            validate_gpx_admission(data)
        return json.dumps({"ok":True},ensure_ascii=False,allow_nan=False)
    except InputError as error:
        return json.dumps({"ok":False,"error":{"code":error.code,"message":str(error),"admission_rejected":True}},ensure_ascii=False,allow_nan=False)
    except (ValueError,TypeError,UnicodeError):
        return json.dumps({"ok":False,"error":{"code":"invalid_request","message":"GPX 請求格式有誤。","admission_rejected":True}},ensure_ascii=False,allow_nan=False)

def _trail_runtime_info():
    return json.dumps({"python":sys.version.split()[0],"expat":pyexpat.EXPAT_VERSION})

def _trail_goal_error_context(geometry, settings, code):
    # Display-only bounds from the exact frozen geometry and validated settings.
    # Never allocates or changes any plan time or model parameter.
    if isinstance(settings,dict) and "allocation_model" in settings:
        return None
    if code not in {"infeasible_target", "stops_exceed_target", "invalid_speed_bounds"}:
        return None
    try:
        from trail_planner.planning import _number
        target = _number(settings, "target_elapsed_s")
        stops = math.fsum(_number(cp, "stop_s", 0) for cp in settings.get("checkpoints", []))
        maximum = _number(settings, "max_speed_m_s", 6.0)
        minimum = _number(settings, "min_speed_m_s", 0.0)
        threshold = _number(settings, "walk_uphill_grade", .15)
        walk_cap = _number(settings, "walk_max_speed_m_s", 1.0)
        if maximum <= 0 or walk_cap <= 0 or minimum < 0 or not geometry.cells:
            return None
        lower = math.fsum(c.distance_m / (min(maximum, walk_cap) if c.grade is not None and c.grade >= threshold - 1e-10 else maximum) for c in geometry.cells)
        upper = math.fsum(c.distance_m / minimum for c in geometry.cells) if minimum > 0 else None
        if not all(math.isfinite(v) for v in [target,stops,target-stops,lower]+([upper] if upper is not None else [])):
            return None
        return {"kind":"goal_time_bounds", "constraint_conflict":code == "invalid_speed_bounds", "target_elapsed_s":target, "stops_s":stops,
                "moving_s":target-stops, "minimum_moving_s":lower, "maximum_moving_s":upper,
                "minimum_target_s":lower+stops, "maximum_target_s":upper+stops if upper is not None else None}
    except (InputError, ValueError, TypeError, OverflowError, ZeroDivisionError):
        return None

def _trail_handle(operation, request_json):
    try:
        request=json.loads(request_json)
        if not isinstance(request,dict) or set(request)-{"gpx_b64","settings"} or not isinstance(request.get("gpx_b64"),str):
            raise InputError("invalid_request","請求須含 Base64 編碼的原始 GPX。")
        try:
            data=base64.b64decode(request["gpx_b64"],validate=True)
        except (ValueError,TypeError,binascii.Error):
            raise InputError("invalid_file","GPX 傳輸編碼有誤。")
        geometry=build_geometry(parse_gpx(data))
        if operation=="inspect":
            result=geometry.summary()
        elif operation=="plan":
            result=_trail_hiking_create_plan(geometry,request.get("settings")) if isinstance(request.get("settings"),dict) and request["settings"].get("allocation_model") == "campbell2022-hiking-reference-v1" else create_plan(geometry,request.get("settings"))
        else:
            raise InputError("invalid_operation","不支援的計算操作。")
        return json.dumps({"ok":True,"result":result},ensure_ascii=False,allow_nan=False,separators=(",",":"))
    except InputError as error:
        detail = _trail_goal_error_context(geometry, request.get("settings"), error.code) if operation == "plan" and "geometry" in locals() else None
        return json.dumps({"ok":False,"error":{"code":error.code,"message":str(error),"details":detail}},ensure_ascii=False,allow_nan=False)
    except (ValueError,TypeError,UnicodeError):
        return json.dumps({"ok":False,"error":{"code":"invalid_json","message":"請求格式有誤。"}},ensure_ascii=False)
`;
function hex(buffer) {return [...new Uint8Array(buffer)].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function createPythonEngine({loadPyodide,indexURL,readAsset,sha256,onStatus=()=>{}}) {
  let initPromise=null,pyodide=null,runtimeInfo=null,detailsPromise=null,abilityPromise=null,predictionPromise=null,hybridPromise=null,repairPromise=null,surfacePromise=null,timedHistoryPromise=null,manualPacePromise=null,hikingPromise=null,hikingSourceSha256=null,qualityPromise=null,liveEtaPromise=null,predictionManifest=null,hybridManifest=null,coreManifest=null,admissionManifest=null;
  async function initialize() {
    onStatus('runtime_loading');
    const runtime=await loadPyodide({indexURL,stdout:()=>{},stderr:()=>{}});
    if(runtime.version!==RUNTIME_VERSION)throw new Error('Runtime version mismatch.');
    onStatus('core_loading');
    const manifest=JSON.parse(new TextDecoder().decode(await readAsset('python/core-manifest.json')));
    if(manifest.runtime_version!==RUNTIME_VERSION||!manifest.files||Object.keys(manifest.files).sort().join(',')!==[...CORE_FILES].sort().join(','))throw new Error('Core manifest mismatch.');
    coreManifest=manifest;
    runtime.FS.mkdirTree('/trail_runtime/trail_planner');
    for(const name of CORE_FILES) {
      const bytes=await readAsset(`python/trail_planner/${name}`);
      const actual=await sha256(bytes);
      if(actual!==manifest.files[name])throw new Error('Core integrity mismatch.');
      runtime.FS.writeFile(`/trail_runtime/trail_planner/${name}`,bytes);
    }
    await runtime.runPythonAsync("import sys\nsys.path.insert(0,'/trail_runtime')\n");
    admissionManifest=JSON.parse(new TextDecoder().decode(await readAsset('python/gpx-admission-manifest.json')));
    if(admissionManifest.schema_version!=='gpx-admission/1.0'||admissionManifest.file!=='gpx_admission.py'||typeof admissionManifest.sha256!=='string')throw new Error('Admission manifest mismatch.');
    const admissionBytes=await readAsset('python/gpx_admission.py');
    if(await sha256(admissionBytes)!==admissionManifest.sha256)throw new Error('Admission integrity mismatch.');
    runtime.FS.writeFile('/trail_runtime/gpx_admission.py',admissionBytes);
    await runtime.runPythonAsync(BRIDGE);
    await runtime.runPythonAsync("_trail_verified_shared_modules={name:sys.modules[name] for name in ('trail_planner','trail_planner.gpx','trail_planner.geometry','trail_planner.planning','gpx_admission')}\n");
    let info;
    try{info=runtime.globals.get('_trail_runtime_info');runtimeInfo=JSON.parse(info());}finally{info?.destroy();}
    if(runtimeInfo.python!=='3.14.8'||runtimeInfo.expat!=='expat_2.9.0')throw new Error('Python/XML runtime version mismatch.');
    pyodide=runtime;onStatus('ready');return runtime;
  }
  async function initializeDetails() {
    const manifest=JSON.parse(new TextDecoder().decode(await readAsset('python/details-manifest.json')));
    if(manifest.schema_version!=='trail-details/1.0'||manifest.file!=='details.py'||typeof manifest.sha256!=='string')throw new Error('Detail manifest mismatch.');
    const bytes=await readAsset('python/details.py');if(await sha256(bytes)!==manifest.sha256)throw new Error('Detail integrity mismatch.');
    pyodide.FS.writeFile('/trail_runtime/trail_details.py',bytes);
    await pyodide.runPythonAsync(`
from trail_details import inspect_details

def _trail_detail_handle(request_json):
    try:
        request=json.loads(request_json)
        if not isinstance(request,dict) or set(request)-{"gpx_b64","official_waypoints"} or not isinstance(request.get("gpx_b64"),str):
            raise InputError("invalid_request","詳細資料請求格式有誤。")
        try:
            data=base64.b64decode(request["gpx_b64"],validate=True)
        except (ValueError,TypeError,binascii.Error):
            raise InputError("invalid_file","GPX 傳輸編碼有誤。")
        return json.dumps({"ok":True,"result":inspect_details(data,request.get("official_waypoints"))},ensure_ascii=False,allow_nan=False,separators=(",",":"))
    except InputError as error:
        return json.dumps({"ok":False,"error":{"code":error.code,"message":str(error)}},ensure_ascii=False)
    except (ValueError,TypeError,UnicodeError):
        return json.dumps({"ok":False,"error":{"code":"invalid_json","message":"詳細資料格式有誤。"}},ensure_ascii=False)
`);
  }
  async function initializeAbility() {
    const manifest=JSON.parse(new TextDecoder().decode(await readAsset('python/ability-manifest.json')));
    const names=['ability_adapter.py','ability_reference.py'];
    if(manifest.schema_version!=='manual-performance-reference-v1'||!manifest.files||Object.keys(manifest.files).sort().join(',')!==names.join(','))throw new Error('Ability manifest mismatch.');
    for(const name of names){const bytes=await readAsset(`python/${name}`);if(await sha256(bytes)!==manifest.files[name])throw new Error('Ability integrity mismatch.');pyodide.FS.writeFile(`/trail_runtime/${name}`,bytes);}
    await pyodide.runPythonAsync(`
from ability_reference import estimate_reference
from ability_adapter import ContractError

def _trail_reference_handle(request_json):
    try:
        request=json.loads(request_json)
        if not isinstance(request,dict) or set(request)!={"reference"}:
            raise ContractError("reference request schema mismatch")
        return json.dumps({"ok":True,"result":estimate_reference(request["reference"])},ensure_ascii=False,allow_nan=False,separators=(",",":"))
    except (ContractError,ValueError,TypeError,UnicodeError):
        return json.dumps({"ok":False,"error":{"code":"invalid_reference","message":"請確認真實成績、日期、距離與停站：歷史須早於今天與目標日期，停站須少於完賽時間。"}},ensure_ascii=False)
`);
  }
  async function initializePrediction(){
    const manifest=JSON.parse(new TextDecoder().decode(await readAsset('python/prediction-manifest.json')));
    if(manifest.schema_version!=='cross-trail-prediction/1.0'||!manifest.files||Object.keys(manifest.files).join(',')!=='cross_trail_predictor.py'||!CORE_FILES.every(name=>manifest.requires_existing_core?.[name]===coreManifest.files[name]))throw new Error('Prediction manifest mismatch.');
    predictionManifest=manifest;
    const bytes=await readAsset('python/cross_trail_predictor.py');if(await sha256(bytes)!==manifest.files['cross_trail_predictor.py'])throw new Error('Prediction integrity mismatch.');pyodide.FS.writeFile('/trail_runtime/cross_trail_predictor.py',bytes);
    await pyodide.runPythonAsync(`
from cross_trail_predictor import predict_from_gpx
_trail_verified_shared_modules['cross_trail_predictor']=sys.modules['cross_trail_predictor']

def _trail_prediction_handle(request_json):
    try:
        request=json.loads(request_json)
        if not isinstance(request,dict) or set(request)!={"reference_gpx_b64","target_gpx_b64","evidence","assumptions"}:
            raise InputError("invalid_prediction_request","跨路線預估請求格式有誤。")
        try:
            reference=base64.b64decode(request["reference_gpx_b64"],validate=True)
            target=base64.b64decode(request["target_gpx_b64"],validate=True)
        except (ValueError,TypeError,binascii.Error):
            raise InputError("invalid_file","GPX 傳輸編碼有誤。")
        result=predict_from_gpx(reference,target,request["evidence"],request["assumptions"])
        return json.dumps({"ok":True,"result":result},ensure_ascii=False,allow_nan=False,separators=(",",":"))
    except InputError as error:
        return json.dumps({"ok":False,"error":{"code":error.code,"message":str(error)}},ensure_ascii=False)
    except (ValueError,TypeError,UnicodeError):
        return json.dumps({"ok":False,"error":{"code":"invalid_prediction_request","message":"跨路線預估資料格式有誤。"}},ensure_ascii=False)
`);
  }
  async function initializeHybrid(){
    if(!predictionPromise)predictionPromise=initializePrediction();await predictionPromise;
    const manifest=JSON.parse(new TextDecoder().decode(await readAsset('python/hybrid-manifest.json')));
    if(manifest.schema_version!=='hybrid-trail-scenario/1.0'||!manifest.files||Object.keys(manifest.files).join(',')!=='hybrid_trail_scenario.py'||manifest.requires_cross_trail_predictor_sha256!==predictionManifest.files['cross_trail_predictor.py']||!CORE_FILES.every(name=>manifest.requires_existing_core?.[name]===coreManifest.files[name]))throw new Error('Prediction manifest mismatch.');
    hybridManifest=manifest;
    const bytes=await readAsset('python/hybrid_trail_scenario.py');if(await sha256(bytes)!==manifest.files['hybrid_trail_scenario.py'])throw new Error('Prediction integrity mismatch.');pyodide.FS.writeFile('/trail_runtime/hybrid_trail_scenario.py',bytes);
    await pyodide.runPythonAsync(`
from hybrid_trail_scenario import predict_from_gpx as predict_hybrid_from_gpx

def _trail_hybrid_handle(request_json):
    try:
        request=json.loads(request_json)
        if not isinstance(request,dict) or set(request)!={"reference_gpx_b64","target_gpx_b64","evidence","assumptions"}:
            raise InputError("invalid_prediction_request","跨路線預估請求格式有誤。")
        try:
            reference=base64.b64decode(request["reference_gpx_b64"],validate=True)
            target=base64.b64decode(request["target_gpx_b64"],validate=True)
        except (ValueError,TypeError,binascii.Error):
            raise InputError("invalid_file","GPX 傳輸編碼有誤。")
        result=predict_hybrid_from_gpx(reference,target,request["evidence"],request["assumptions"])
        return json.dumps({"ok":True,"result":result},ensure_ascii=False,allow_nan=False,separators=(",",":"))
    except InputError as error:
        return json.dumps({"ok":False,"error":{"code":error.code,"message":str(error)}},ensure_ascii=False)
    except (ValueError,TypeError,UnicodeError):
        return json.dumps({"ok":False,"error":{"code":"invalid_prediction_request","message":"跨路線預估資料格式有誤。"}},ensure_ascii=False)
`);
  }
  async function initializeRepair(){
    const manifest=JSON.parse(new TextDecoder().decode(await readAsset('python/route-repair-manifest.json')));
    const names=['local_elevation_gap.py','route_geometry_repair.py'];
    if(manifest.schema_version!=='route-geometry-repair/1.0'||!manifest.files||Object.keys(manifest.files).sort().join(',')!==names.join(',')||JSON.stringify(manifest.requires_existing_core)!==JSON.stringify(coreManifest.files))throw new Error('Repair manifest mismatch.');
    for(const name of names){const bytes=await readAsset(`python/${name}`);if(await sha256(bytes)!==manifest.files[name])throw new Error('Repair integrity mismatch.');pyodide.FS.writeFile(`/trail_runtime/${name}`,bytes);}
    await pyodide.runPythonAsync(`
from route_geometry_repair import propose_route_repairs, materialize_route_repairs
import hashlib

def _trail_repair_handle(operation, request_json):
    try:
        request=json.loads(request_json)
        expected={"gpx_b64"} if operation=="repair_propose" else {"gpx_b64","approved_profile_sha256","confirmed"}
        if not isinstance(request,dict) or set(request)!=expected or not isinstance(request.get("gpx_b64"),str):
            raise InputError("invalid_repair_request","路線處理請求格式有誤。")
        try:
            data=base64.b64decode(request["gpx_b64"],validate=True)
        except (ValueError,TypeError,binascii.Error):
            raise InputError("invalid_file","GPX 傳輸編碼有誤。")
        proposal=propose_route_repairs(data)
        if operation=="repair_propose":
            result=proposal
        else:
            if request["confirmed"] is not True or request["approved_profile_sha256"]!=proposal["derived_profile_sha256"]:
                raise InputError("repair_confirmation_required","處理提案已變更，請重新確認。")
            summary=proposal["summary"]
            if summary["preview_core_blocked"] or not (summary["missing_elevations_filled"] or summary["conflicting_coordinate_groups_merged"]):
                raise InputError("repair_not_available","目前沒有可安全套用的局部處理。")
            derived=materialize_route_repairs(data,proposal,confirmed=True)
            result={"derived_gpx_b64":base64.b64encode(derived).decode("ascii"),"derived_sha256":hashlib.sha256(derived).hexdigest(),"proposal":proposal}
        return json.dumps({"ok":True,"result":result},ensure_ascii=False,allow_nan=False,separators=(",",":"))
    except InputError as error:
        return json.dumps({"ok":False,"error":{"code":error.code,"message":str(error)}},ensure_ascii=False)
    except (ValueError,TypeError,UnicodeError):
        return json.dumps({"ok":False,"error":{"code":"invalid_repair_request","message":"路線處理資料格式有誤。"}},ensure_ascii=False)
`);
  }
  async function ensureRepair(){
    if(!repairPromise)repairPromise=initializeRepair().catch(error=>{repairPromise=null;throw error;});
    await repairPromise;
  }
  async function initializeSurface(){
    await ensureRepair();
    const manifest=JSON.parse(new TextDecoder().decode(await readAsset('python/surface-reference-manifest.json',65536)));
    if(manifest.schema_version!=='whole-provider-surface-reference/3'||manifest.file!=='surface_reference.py'||manifest.pack_path!=='terrain-reference/terrain-bundle.json'||manifest.pack_maximum_bytes!==65536||manifest.asset_prefix!=='terrain-reference/'||manifest.asset_maximum_bytes!==300000||manifest.bundle_maximum_bytes!==6000000||manifest.asset_maximum_count!==64||JSON.stringify(manifest.requires_existing_core)!==JSON.stringify(coreManifest.files))throw new Error('Surface reference manifest mismatch.');
    const bytes=await readAsset('python/surface_reference.py',65536),pack=await readAsset(manifest.pack_path,manifest.pack_maximum_bytes);
    if(await sha256(bytes)!==manifest.sha256||await sha256(pack)!==manifest.pack_sha256)throw new Error('Surface reference integrity mismatch.');
    const bundle=JSON.parse(new TextDecoder().decode(pack));
    if(bundle.schema!=='curated-native-surface-bundle/3'||!Array.isArray(bundle.shards)||!bundle.shards.length||bundle.shards.length>manifest.asset_maximum_count)throw new Error('Surface bundle mismatch.');
    const names=new Set();let total=0;
    for(const record of bundle.shards){
      if(!/^shards\/N[0-9]{2}E[0-9]{3}-[0-9]+-[0-9]+-[0-9]+-[0-9]+\.bin$/.test(record.path)||names.has(record.path)||!Number.isSafeInteger(record.bytes)||record.bytes<=0||record.bytes>manifest.asset_maximum_bytes||!/^[0-9a-f]{64}$/.test(record.sha256))throw new Error('Surface asset metadata mismatch.');
      names.add(record.path);total+=record.bytes;
      if(total>manifest.bundle_maximum_bytes)throw new Error('Surface bundle exceeds bounded asset envelope.');
    }
    if(total!==bundle.aggregate_shard_bytes)throw new Error('Surface bundle byte count mismatch.');
    pyodide.FS.writeFile('/trail_runtime/surface_reference.py',bytes);
    const transient=[];
    try{
      pyodide.FS.writeFile('/trail_runtime/surface_bundle.json',pack);transient.push('/trail_runtime/surface_bundle.json');
      // Sequential same-origin reads keep at most one asset request active.
      // Source URL metadata is never fetched and GPX coordinates never leave here.
      for(let index=0;index<bundle.shards.length;index++){
        const record=bundle.shards[index],raw=await readAsset(manifest.asset_prefix+record.path,manifest.asset_maximum_bytes);
        if(raw.byteLength!==record.bytes||await sha256(raw)!==record.sha256)throw new Error('Surface asset integrity mismatch.');
        const filename=`/trail_runtime/surface_asset_${index}.bin`;pyodide.FS.writeFile(filename,raw);transient.push(filename);
      }
      await pyodide.runPythonAsync(`
from surface_reference import initialize_surface, propose_surface_reference, materialize_surface_reference
with open('/trail_runtime/surface_bundle.json','rb') as _surface_stream:
    _surface_manifest_bytes=_surface_stream.read()
_surface_asset_bytes={}
try:
    _surface_bundle_manifest=json.loads(_surface_manifest_bytes)
    for _surface_index,_surface_record in enumerate(_surface_bundle_manifest['shards']):
        with open('/trail_runtime/surface_asset_'+str(_surface_index)+'.bin','rb') as _surface_stream:
            _surface_asset_bytes[_surface_record['path']]=_surface_stream.read()
    initialize_surface(_surface_manifest_bytes,_surface_asset_bytes)
finally:
    for _surface_temp in ('_surface_asset_bytes','_surface_manifest_bytes','_surface_bundle_manifest','_surface_stream','_surface_index','_surface_record'):
        globals().pop(_surface_temp,None)
    del _surface_temp

def _trail_surface_handle(operation, request_json):
    try:
        request=json.loads(request_json)
        expected={"gpx_b64"} if operation=="surface_propose" else {"gpx_b64","approved_profile_sha256","confirmed"}
        if not isinstance(request,dict) or set(request)!=expected or not isinstance(request.get("gpx_b64"),str):
            raise InputError("invalid_surface_request","地表參考請求格式有誤。")
        try:
            data=base64.b64decode(request["gpx_b64"],validate=True)
        except (ValueError,TypeError,binascii.Error):
            raise InputError("invalid_file","GPX 傳輸編碼有誤。")
        proposal=propose_surface_reference(data)
        if operation=="surface_propose":result=proposal
        else:
            if request["confirmed"] is not True or request["approved_profile_sha256"]!=proposal["derived_profile_sha256"]:
                raise InputError("surface_confirmation_required","地表參考提案已變更，請重新檢查並確認。")
            derived=materialize_surface_reference(data,proposal,confirmed=True)
            result={"derived_gpx_b64":base64.b64encode(derived).decode("ascii"),"derived_sha256":hashlib.sha256(derived).hexdigest(),"proposal":proposal}
        return json.dumps({"ok":True,"result":result},ensure_ascii=False,allow_nan=False,separators=(",",":"))
    except InputError as error:
        return json.dumps({"ok":False,"error":{"code":error.code,"message":str(error)}},ensure_ascii=False)
    except (ValueError,TypeError,UnicodeError):
        return json.dumps({"ok":False,"error":{"code":"invalid_surface_request","message":"地表參考資料格式有誤。"}},ensure_ascii=False)
`);
    }finally{
      let cleanupError;
      for(const filename of transient){try{pyodide.FS.unlink(filename);}catch(error){cleanupError??=error;}}
      if(cleanupError)throw cleanupError;
    }
  }
  async function initializeQuality(){
    if(!hybridPromise)hybridPromise=initializeHybrid();await hybridPromise;
    const manifest=JSON.parse(new TextDecoder().decode(await readAsset('python/route-quality-manifest.json')));
    if(manifest.schema_version!=='route-quality-diagnostics/1.0'||manifest.file!=='route_quality_diagnostics.py'||!CORE_FILES.every(name=>manifest.requires_existing_core?.[name]===coreManifest.files[name])||manifest.requires_gpx_admission_sha256!==admissionManifest.sha256||manifest.requires_cross_trail_predictor_sha256!==predictionManifest.files['cross_trail_predictor.py']||manifest.requires_hybrid_trail_scenario_sha256!==hybridManifest.files['hybrid_trail_scenario.py'])throw new Error('Route quality manifest mismatch.');
    const bytes=await readAsset('python/route_quality_diagnostics.py');if(await sha256(bytes)!==manifest.sha256)throw new Error('Route quality integrity mismatch.');
    pyodide.FS.writeFile('/trail_runtime/route_quality_diagnostics.py',bytes);
    await pyodide.runPythonAsync(`
from route_quality_diagnostics import diagnose_route, compact_diagnosis
import hashlib
_trail_quality_cache=None

def _trail_quality_handle(request_json):
    global _trail_quality_cache
    try:
        request=json.loads(request_json)
        if not isinstance(request,dict) or set(request)-{"gpx_b64","page"} or not isinstance(request.get("gpx_b64"),str):
            raise InputError("invalid_quality_request","來源檢查請求格式有誤。")
        try:
            data=base64.b64decode(request["gpx_b64"],validate=True)
        except (ValueError,TypeError,binascii.Error):
            raise InputError("invalid_file","GPX 傳輸編碼有誤。")
        page=request.get("page",0)
        if isinstance(page,bool) or not isinstance(page,int) or not 0<=page<400:
            raise InputError("invalid_quality_page","來源檢查頁碼有誤。")
        source_hash=hashlib.sha256(data).hexdigest()
        if _trail_quality_cache is None or _trail_quality_cache[0]!=source_hash:
            _trail_quality_cache=None
            _trail_quality_cache=(source_hash,diagnose_route(data))
        result=compact_diagnosis(_trail_quality_cache[1],page)
        response=json.dumps({"ok":True,"result":result},ensure_ascii=False,allow_nan=False,separators=(",",":"))
        if len(response.encode("utf-8"))>65536:
            raise InputError("quality_response_too_large","來源檢查回應超過上限，未回傳不完整結果。")
        return response
    except InputError as error:
        return json.dumps({"ok":False,"error":{"code":error.code,"message":str(error)}},ensure_ascii=False,allow_nan=False)
    except (ValueError,TypeError,UnicodeError):
        return json.dumps({"ok":False,"error":{"code":"invalid_quality_request","message":"來源檢查資料格式有誤。"}},ensure_ascii=False,allow_nan=False)
`);
  }
  async function initializeTimedHistory(){
    const manifest=JSON.parse(new TextDecoder().decode(await readAsset('python/timed-history-manifest.json')));
    const names=['compact_observation.py','dependencies/geometry.py','dependencies/gpx.py','dependencies/steep_history_observations.py','timed_gpx_producer.py'];
    if(manifest.schema_version!=='timed-history-runtime/1.0'||!manifest.files||Object.keys(manifest.files).sort().join(',')!==names.join(',')||!['gpx.py','geometry.py'].every(name=>manifest.requires_existing_core?.[name]===coreManifest.files[name]))throw new Error('Timed history manifest mismatch.');
    pyodide.FS.mkdirTree('/trail_runtime/timed_history/dependencies');
    for(const name of names){const bytes=await readAsset(`python/timed_history/${name}`);if(await sha256(bytes)!==manifest.files[name])throw new Error('Timed history integrity mismatch.');pyodide.FS.writeFile(`/trail_runtime/timed_history/${name}`,bytes);}
    await pyodide.runPythonAsync(`
from timed_history.compact_observation import inspect_compact_timed_gpx

def _trail_timed_history_handle(request_json):
    try:
        request=json.loads(request_json)
        if not isinstance(request,dict) or set(request)!={"gpx_b64","forecast_as_of"} or not isinstance(request["gpx_b64"],str) or not isinstance(request["forecast_as_of"],str) or len(request["forecast_as_of"])>128:
            raise InputError("invalid_timed_history_request","觀測請求格式有誤。")
        try:
            data=base64.b64decode(request["gpx_b64"],validate=True)
        except (ValueError,TypeError,binascii.Error):
            raise InputError("invalid_file","GPX 傳輸編碼有誤。")
        result=inspect_compact_timed_gpx(data,forecast_as_of=request["forecast_as_of"])
        return json.dumps({"ok":True,"result":result},ensure_ascii=True,allow_nan=False,separators=(",",":"))
    except InputError as error:
        return json.dumps({"ok":False,"error":{"code":error.code,"message":str(error)}},ensure_ascii=True)
    except (ValueError,TypeError,UnicodeError):
        return json.dumps({"ok":False,"error":{"code":"invalid_timed_history_request","message":"觀測資料格式有誤。"}},ensure_ascii=True)
`);
  }
  async function initializeHiking(){
    const manifest=JSON.parse(new TextDecoder().decode(await readAsset('python/hiking-reference-manifest.json')));
    if(manifest.schema_version!=='hiking-reference/1.0'||manifest.model_version!=='campbell2022-hiking-reference-goal-v1'||manifest.file!=='hiking_reference.py'||!CORE_FILES.every(name=>manifest.requires_existing_core?.[name]===coreManifest.files[name]))throw new Error('Hiking reference manifest mismatch.');
    const bytes=await readAsset('python/hiking_reference.py');
    if(await sha256(bytes)!==manifest.sha256)throw new Error('Hiking reference integrity mismatch.');
    pyodide.FS.writeFile('/trail_runtime/hiking_reference.py',bytes);
    await pyodide.runPythonAsync('from hiking_reference import create_hiking_plan as _trail_hiking_create_plan');
    hikingSourceSha256=manifest.sha256;
  }
  async function initializeManualPace(){
    if(!hikingPromise)hikingPromise=initializeHiking();await hikingPromise;
    const manifest=JSON.parse(new TextDecoder().decode(await readAsset('python/manual-pace-manifest.json')));
    if(manifest.schema_version!=='manual-moving-pace-clock/1.0'||manifest.file!=='manual_pace_adapter.py'||!CORE_FILES.every(name=>manifest.requires_existing_core?.[name]===coreManifest.files[name])||manifest.requires_gpx_admission_sha256!==admissionManifest.sha256||manifest.requires_hiking_reference_sha256!==hikingSourceSha256)throw new Error('Manual pace manifest mismatch.');
    const bytes=await readAsset('python/manual_pace_adapter.py');
    if(await sha256(bytes)!==manifest.sha256)throw new Error('Manual pace integrity mismatch.');
    pyodide.FS.writeFile('/trail_runtime/manual_pace_adapter.py',bytes);
    await pyodide.runPythonAsync("import importlib.util\n_goal_manual_spec=importlib.util.spec_from_file_location('_ridgeq_goal_manual_adapter','/trail_runtime/manual_pace_adapter.py')\n_goal_manual_module=importlib.util.module_from_spec(_goal_manual_spec)\nsys.modules['_ridgeq_goal_manual_adapter']=_goal_manual_module\n_goal_manual_spec.loader.exec_module(_goal_manual_module)\n_trail_manual_pace_handle=_goal_manual_module.handle_request");
  }
  async function initializeLiveEta(){
    const manifest=JSON.parse(new TextDecoder().decode(await readAsset('python/live-eta-manifest.json',65536)));
    if(manifest.schema_version!=='live-route-eta/1'||manifest.file!=='live_eta.py'||typeof manifest.sha256!=='string')throw new Error('Live ETA manifest mismatch.');
    const bytes=await readAsset('python/live_eta.py',65536);
    if(await sha256(bytes)!==manifest.sha256)throw new Error('Live ETA integrity mismatch.');
    pyodide.FS.writeFile('/trail_runtime/live_eta.py',bytes);
    await pyodide.runPythonAsync('from live_eta import handle_request as _trail_live_eta_handle');
  }
  function validPayload(operation,payload){
    if(!payload||typeof payload!=='object'||Array.isArray(payload))return false;
    if(operation==='live_eta')return Object.keys(payload).sort().join(',')==='gpx_b64,owner_revision,settings'&&typeof payload.gpx_b64==='string'&&payload.gpx_b64.length<=6990508&&typeof payload.owner_revision==='string'&&payload.owner_revision.length>0&&payload.owner_revision.length<=256&&payload.settings&&typeof payload.settings==='object'&&!Array.isArray(payload.settings)&&JSON.stringify(payload.settings).length<=4096;
    if(operation==='quality_inspect')return ['gpx_b64','gpx_b64,page'].includes(Object.keys(payload).sort().join(','))&&typeof payload.gpx_b64==='string'&&payload.gpx_b64.length<=6990508&&(payload.page===undefined||Number.isSafeInteger(payload.page)&&payload.page>=0&&payload.page<400);
    if(operation==='timed_history_inspect')return Object.keys(payload).sort().join(',')==='forecast_as_of,gpx_b64'&&typeof payload.gpx_b64==='string'&&payload.gpx_b64.length<=6990508&&typeof payload.forecast_as_of==='string'&&payload.forecast_as_of.length<=128;
    if(operation==='reference')return Object.keys(payload).join(',')==='reference'&&payload.reference&&typeof payload.reference==='object'&&!Array.isArray(payload.reference)&&JSON.stringify(payload).length<=16384;
    if(['manual_pace_prepare','manual_pace_recalculate'].includes(operation)){
      const expected=operation==='manual_pace_prepare'?'checkpoint_ids,gpx_b64,owner_revision,raw_sections,settings':'checkpoint_ids,expected_binding,gpx_b64,locks,owner_revision,raw_sections,settings';
      if(Object.keys(payload).sort().join(',')!==expected||typeof payload.gpx_b64!=='string'||payload.gpx_b64.length>6990508||!Array.isArray(payload.raw_sections)||payload.raw_sections.length>25000||!Array.isArray(payload.checkpoint_ids)||payload.checkpoint_ids.length>101||!payload.checkpoint_ids.every(id=>typeof id==='string'&&id.length<=256)||typeof payload.owner_revision!=='string'||payload.owner_revision.length>256||!payload.settings||typeof payload.settings!=='object'||Array.isArray(payload.settings))return false;
      if(operation==='manual_pace_recalculate'&&(typeof payload.expected_binding!=='string'||!/^[a-f0-9]{64}$/u.test(payload.expected_binding)||!Array.isArray(payload.locks)||payload.locks.length>1000))return false;
      return JSON.stringify(payload.settings).length<=65536&&JSON.stringify(payload.raw_sections).length<=4194304&&(operation==='manual_pace_prepare'||JSON.stringify(payload.locks).length<=4194304);
    }
    if(['predict','hybrid'].includes(operation))return Object.keys(payload).sort().join(',')==='assumptions,evidence,reference_gpx_b64,target_gpx_b64'&&['reference_gpx_b64','target_gpx_b64'].every(k=>typeof payload[k]==='string'&&payload[k].length<=6990508)&&['evidence','assumptions'].every(k=>payload[k]&&typeof payload[k]==='object'&&!Array.isArray(payload[k])&&JSON.stringify(payload[k]).length<=16384);
    return typeof payload.gpx_b64==='string'&&payload.gpx_b64.length<=6990508;
  }
  async function request(operation,payload) {
    if(!['inspect','plan','details','reference','predict','hybrid','repair_propose','repair_apply','surface_propose','surface_apply','timed_history_inspect','manual_pace_prepare','manual_pace_recalculate','quality_inspect','live_eta'].includes(operation))return {ok:false,error:{code:'invalid_operation',message:'不支援的計算操作。'}};
    if(!validPayload(operation,payload))
      return {ok:false,error:{code:'invalid_request',message:['manual_pace_prepare','manual_pace_recalculate'].includes(operation)?'人工配速請求資料過多或格式有誤。':'請求須含不超過 5 MiB 的原始 GPX。'}};
    if(!initPromise)initPromise=initialize();
    await initPromise;onStatus('computing');
    if(operation!=='reference'){
      let admission;
      try{admission=pyodide.globals.get('_trail_admission_handle');const value=admission(operation,JSON.stringify(payload));if(typeof value!=='string')throw new Error('Admission response was not JSON text.');const result=JSON.parse(value);if(result.ok!==true)return result;}
      finally{admission?.destroy();}
    }
    if(operation==='plan'&&payload.settings?.allocation_model==='campbell2022-hiking-reference-v1'){if(!hikingPromise)hikingPromise=initializeHiking();await hikingPromise;}
    if(operation==='live_eta'){if(!liveEtaPromise)liveEtaPromise=initializeLiveEta().catch(error=>{liveEtaPromise=null;throw error;});await liveEtaPromise;}
    if(operation==='quality_inspect'){if(!qualityPromise)qualityPromise=initializeQuality();await qualityPromise;}
    if(operation==='details'){if(!detailsPromise)detailsPromise=initializeDetails();await detailsPromise;}
    if(operation==='reference'){if(!abilityPromise)abilityPromise=initializeAbility();await abilityPromise;}
    if(operation==='predict'){if(!predictionPromise)predictionPromise=initializePrediction();await predictionPromise;}
    if(operation==='hybrid'){if(!hybridPromise)hybridPromise=initializeHybrid();await hybridPromise;}
    if(['repair_propose','repair_apply'].includes(operation))await ensureRepair();
    if(['surface_propose','surface_apply'].includes(operation)){if(!surfacePromise)surfacePromise=initializeSurface().catch(error=>{surfacePromise=null;throw error;});await surfacePromise;}
    if(operation==='timed_history_inspect'){if(!timedHistoryPromise)timedHistoryPromise=initializeTimedHistory();await timedHistoryPromise;}
    if(['manual_pace_prepare','manual_pace_recalculate'].includes(operation)){if(!manualPacePromise)manualPacePromise=initializeManualPace();await manualPacePromise;}
    let handler;
    try {handler=pyodide.globals.get(operation==='live_eta'?'_trail_live_eta_handle':['manual_pace_prepare','manual_pace_recalculate'].includes(operation)?'_trail_manual_pace_handle':operation==='quality_inspect'?'_trail_quality_handle':operation==='timed_history_inspect'?'_trail_timed_history_handle':operation==='details'?'_trail_detail_handle':operation==='reference'?'_trail_reference_handle':operation==='predict'?'_trail_prediction_handle':operation==='hybrid'?'_trail_hybrid_handle':['surface_propose','surface_apply'].includes(operation)?'_trail_surface_handle':['repair_propose','repair_apply'].includes(operation)?'_trail_repair_handle':'_trail_handle');const value=['details','reference','predict','hybrid','timed_history_inspect','quality_inspect','live_eta'].includes(operation)?handler(JSON.stringify(payload)):handler(operation,JSON.stringify(payload));if(typeof value!=='string')throw new Error('Python response was not JSON text.');return JSON.parse(value);}
    finally {handler?.destroy();}
  }
  return {request,getRuntimeInfo:()=>runtimeInfo,getVerifiedRuntime:async()=>{if(!initPromise)initPromise=initialize();await initPromise;return pyodide;}};
}
export async function browserSha256(bytes) {
  if(!globalThis.crypto?.subtle)throw new Error('Secure context is required for core integrity verification.');
  return hex(await crypto.subtle.digest('SHA-256',bytes));
}
