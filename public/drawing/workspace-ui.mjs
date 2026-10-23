import {createRouteDraft, mapLinesFromDetails} from './src/route-draft.mjs';
import {createTerraRouteController, createRouteDrawingModes} from './src/terra-route-controller.mjs';
import {createWrappedMapLibreAdapter, unwrapLineForDisplay} from './src/wrapped-map-adapter.mjs';
import {loadDrawingMap, fixedBasemapStyle} from './map-loader.mjs';

/** Owns only a local draft. The main workspace owns worker admission and route replacement. */
export function createRouteDrawingUI({document = globalThis.document, window = globalThis.window, inspectBytes, applyBytes, getWorkspace, isBusy, loadMap = loadDrawingMap, makeDraft = createRouteDraft}) {
  const $ = id => document.getElementById('drawing-'+id);
  if (!$('panel')) return null;
  let map=null, controller=null, draft=null, generation=0, pending=null, confirmation=null, loading=false, suspended=false, disposed=false, drawing=false, transient=false, completedInspection=null, mapReady=false, startupTimer=null, controlState=null, applying=null, controllerError=null;
  const urls=new Set(), timers=new Set(), listeners=[], mapListeners=[], rendererListeners=[];
  const on=(target,type,fn)=>{target.addEventListener(type,fn);listeners.push([target,type,fn]);};
  const status=(text,error=false)=>{$('status').textContent=text;$('status').className='feedback'+(error?' error':'');$('status').hidden=!text;};
  const onMap=(target,type,fn)=>{target.addEventListener(type,fn);mapListeners.push([target,type,fn]);};
  const onRenderer=(target,type,fn)=>{target.on(type,fn);rendererListeners.push([target,type,fn]);};
  const snapshot=()=>draft?.snapshot();
  const clearStartup=()=>{if(startupTimer!==null){clearTimeout(startupTimer);startupTimer=null;}};
  function releaseMap({preserveDraft=true}={}){
    clearStartup();for(const[target,type,fn]of mapListeners)target.removeEventListener?.(type,fn);mapListeners.length=0;for(const[target,type,fn]of rendererListeners)target.off?.(type,fn);rendererListeners.length=0;
    const oldController=controller,oldMap=map;controller=null;map=null;mapReady=false;loading=false;drawing=false;transient=false;controlState=null;controllerError=null;
    try{oldController?.dispose({preserveDraft});}catch{/* A lost renderer must not discard the committed local draft. */}
    try{oldMap?.remove();}catch{/* Already removed by the renderer. */}
    if(!preserveDraft){draft?.dispose();draft=null;}
  }
  function boundStartup(run){
    clearStartup();startupTimer=setTimeout(()=>{startupTimer=null;if(run!==generation||mapReady||suspended||disposed)return;cancelWork();status('底圖未能完成，可重試；草稿與目前路線仍保留。',true);render();},20000);
  }
  const sameWorkspace=(a,b)=>a?.revision===b?.revision && a?.routeSha256===b?.routeSha256 && a?.gpx===b?.gpx && a?.plan===b?.plan;
  function closeConfirmation(){confirmation=null;if($('confirm').open)$('confirm').close();}
  function render(){
    const s=snapshot(),ready=mapReady&&!!controller&&!suspended&&!disposed,active=ready&&!loading&&!applying;
    $('points').textContent=drawing?'繪製中':`${s?.pointCount||0} 點`;
    $('distance').textContent=!transient&&!drawing&&s?.inspection?`水平距離 ${(s.inspection.horizontalDistanceM/1000).toFixed(3)} km`:'距離 —';
    $('draw').disabled=!active||drawing||transient;$('draw').textContent=s?.pointCount?'重畫':'畫線';
    $('edit').disabled=!active||(!s?.canExport&&!drawing);
    $('undo').disabled=!active||!(controlState?.canUndo??s?.canUndo);$('redo').disabled=!active||!(controlState?.canRedo??s?.canRedo);
    $('finish').hidden=!drawing;$('finish').disabled=!active||!controlState?.canFinish;
    $('cancel').hidden=!drawing&&!transient;$('cancel').disabled=!active;
    $('reset').disabled=!active||(!s?.pointCount&&!drawing);
    $('check').disabled=!active||pending||drawing||transient||!s?.canExport||isBusy();
    $('download').disabled=suspended||disposed||drawing||transient||!s?.canExport;
    $('apply').disabled=!active||pending||drawing||transient||!s?.inspection||!completedInspection||isBusy();
    $('show-current').disabled=!active||!getWorkspace()?.details;
    $('enable').disabled=loading||suspended||disposed;$('enable').hidden=mapReady;
    $('map-wrap').hidden=!mapReady;
    $('draw').closest('.drawing-tools').hidden=!ready&&!s?.pointCount;
    $('points').closest('.drawing-summary').hidden=!ready&&!s?.pointCount;
    $('cancel-check').hidden=!pending&&!loading;$('cancel-check').textContent=loading?'取消開啟底圖':'取消檢查';
    $('confirm-apply').disabled=!confirmation||pending||applying||isBusy()||suspended||disposed;
    $('panel').setAttribute('aria-busy',String(loading||!!pending||!!applying));
  }
  function cancelWork(message=''){
    const wasWorking=loading||!!pending;generation++;clearStartup();if(loading&&!mapReady)releaseMap();const active=pending;pending=null;active?.abort();closeConfirmation();
    completedInspection=null;controllerError=null;draft?.invalidateTransient();if(message)status(message);else if(wasWorking)status('自畫路線操作已取消；草稿與目前路線仍保留。');render();
  }
  function newDraft(){draft=makeDraft({id:crypto.randomUUID()});drawing=false;transient=false;completedInspection=null;}
  function changed(event){
    controlState=event;drawing=event.drawing;transient=event.transient;
    if(controllerError && (drawing||transient||controllerError.revision!==event.draft.revision))controllerError=null;
    if(event.draft.revision!==completedInspection?.revision||drawing||transient){
      if(pending||confirmation)cancelWork();completedInspection=null;
      status(controllerError?.message||(drawing?'點最後一點或 Enter 完成；Esc 取消未完成部分。':transient?'正在編輯…':'草稿尚未檢查 · 未沿道路校正 · 海拔未知'),!!controllerError);
    }
    render();
  }
  async function enable(){
    if(loading||suspended||disposed||mapReady)return;
    if(map){loading=true;boundStartup(generation);map.resize?.();map.triggerRepaint?.();status('正在等候底圖恢復；目前草稿仍保留。');render();return;}
    loading=true;status('正在開啟公開底圖…');render();const run=++generation;boundStartup(run);
    try{
      const {maplibre,terra,Adapter}=await loadMap();if(run!==generation||suspended||disposed)return;
      maplibre.setWorkerUrl(new URL('./vendor/maplibre/maplibre-gl-worker.mjs',import.meta.url).href);
      maplibre.setWorkerCount?.(1);
      map=new maplibre.Map({container:$('map'),style:fixedBasemapStyle(),center:[121.5,25],zoom:11,maxZoom:18,attributionControl:false,renderWorldCopies:true,refreshExpiredTiles:false,maxTileCacheSize:128,transformRequest:request=>mapRequest(request),locale:{'NavigationControl.ZoomIn':'放大','NavigationControl.ZoomOut':'縮小','NavigationControl.ResetBearing':'指向北方'}});
      const currentMap=map;
      map.addControl(new maplibre.NavigationControl({showCompass:false}),'top-right');map.addControl(new maplibre.ScaleControl({unit:'metric'}),'bottom-left');
      onRenderer(map,'load',()=>{
        if(map!==currentMap||controller||run!==generation||disposed||suspended)return;
        let draw;
        try{
          if(!draft)newDraft();
          const modes=createRouteDrawingModes(terra,{autoSelectOnlyRoute:true});
          draw=new terra.TerraDraw({adapter:createWrappedMapLibreAdapter({Adapter,map,coordinatePrecision:9,ignoreMismatchedPointerEvents:true}),modes,undoRedo:{modeLevel:new terra.TerraDrawModeUndoRedo({maxStackSize:25})}});
          draw.start();controller=createTerraRouteController({draw,draft,autoSelectOnlyRoute:true,onChange:changed,onError:error=>{controllerError={message:error.message,revision:snapshot()?.revision};status(error.message,true);},finishLine:()=>modes.find(mode=>mode.mode==='linestring').onKeyUp({key:'Enter',heldKeys:[],preventDefault(){}})});controller.restore();status('正在確認底圖地理圖層…');render();map.resize?.();
        }catch(error){
          try{if(controller)controller.dispose({preserveDraft:true});else{try{draw?.clear();draw?.clearUndoRedoHistory();}finally{draw?.stop();}}}catch{/* Partial library initialization may not have started. */}
          releaseMap();generation++;
          status('繪圖元件未能啟動，可重新開啟底圖。'+error.message,true);render();
        }
      });
      onRenderer(map,'idle',()=>{if(map!==currentMap||!controller||mapReady||disposed||suspended)return;try{if(map.isSourceLoaded('openmaptiles')&&['water','transportation','place','landcover'].some(layer=>map.querySourceFeatures('openmaptiles',{sourceLayer:layer}).length>0)){clearStartup();loading=false;mapReady=true;status('草稿不會改動目前路線；檢查後可選擇套用。');render();map.resize?.();}}catch{/* A real geographic tile is required before drawing. */}});
      onRenderer(map,'error',()=>{if(map!==currentMap||disposed||suspended)return;if(loading&&!mapReady){cancelWork();}status('公開底圖或 WebGL 未完成。若缺少實際地理圖層，請勿依空白畫面畫線；可保留既有 GPX，稍後重新開啟。',true);});
      onMap(map.getCanvas(),'webglcontextlost',()=>{if(map!==currentMap)return;cancelWork();releaseMap();status('地圖顯示已中斷，可重新開啟；草稿與目前路線仍保留。',true);render();});
      onMap(map.getCanvas(),'webglcontextrestored',()=>{if(map!==currentMap||disposed||suspended)return;mapReady=false;loading=true;boundStartup(generation);controller?.restore();status('正在重新確認底圖地理圖層…');render();map?.triggerRepaint?.();});
    }catch(error){if(run===generation&&!disposed){releaseMap();status(/WebGL2/.test(String(error?.message))?'此瀏覽器暫時無法顯示地圖。原路線仍保留，可繼續使用 GPX。':/逾時/.test(String(error?.message))?`底圖載入逾時，可重試。重新載入頁面會清除未儲存設定${snapshot()?.canExport?'，請先匯出草稿':''}。`:'公開底圖未能開啟，請重試。',true);}}
    finally{if(run===generation){if(!map)loading=false;render();}}
  }
  async function check(){
    if(!mapReady||suspended||disposed||applying||pending||drawing||transient||!snapshot()?.canExport||isBusy())return;
    cancelWork();const run=generation, controller=new AbortController();pending=controller;status('正在以既有核心檢查草稿…');render();
    try{
      const job=await draft.prepareInspection();if(!job||run!==generation||pending!==controller)return;
      const {route,details}=await inspectBytes(job.bytes,controller.signal);
      if(run!==generation||pending!==controller||suspended||disposed)return;
      if(!draft.acceptInspection(job.ticket,route,details))return;
      completedInspection={revision:snapshot().revision,sha256:job.ticket.routeSha256,bytes:job.bytes.slice()};
      const formatNote=details.source.version==='1.0'?' · GPX1.0（保留 +180° 點位）':'';
      status((route.blocked?(route.quality.find(q=>q.severity==='error')?.message||'草稿待處理，可匯出原始草稿。'):'草稿已檢查 · 海拔未知 · 預估仍需原有確認')+formatNote,route.blocked);
    }catch(error){if(run===generation&&!suspended&&!disposed)status(error.name==='AbortError'?'草稿檢查已取消，可重試。':error.message,true);}
    finally{if(run===generation&&pending===controller){pending=null;render();}}
  }
  function reviewApply(){
    const s=snapshot();if(!mapReady||applying||!s?.inspection||!completedInspection||s.revision!==completedInspection.revision||pending||drawing||transient||isBusy()||suspended||disposed)return;
    confirmation={routeId:s.routeId,revision:s.revision,inspection:completedInspection,workspace:getWorkspace()};
    $('confirm-summary').textContent=`${s.pointCount} 點 · 水平距離 ${(s.inspection.horizontalDistanceM/1000).toFixed(3)} km · 海拔未知${s.inspection.blocked?' · 暫不可計算':''}`;
    $('confirm').showModal();render();$('confirm-cancel').focus();
  }
  async function confirmApply(){
    const c=confirmation,s=snapshot();
    if(!c||applying||isBusy()||pending||suspended||disposed)return;
    if(s?.routeId!==c.routeId||s.revision!==c.revision||completedInspection!==c.inspection||drawing||transient||!sameWorkspace(c.workspace,getWorkspace())){closeConfirmation();status('草稿或目前路線已變更，請重新檢查並確認。',true);render();return;}
    const bytes=c.inspection.bytes.slice(),provenance={kind:'drawn_unsnapped',sha256:c.inspection.sha256,point_count:s.pointCount,routing:'unverified_unsnapped',elevation:'unknown',navigation:'unverified'};
    const owner={};applying=owner;closeConfirmation();render();
    try{controller?.pause();await applyBytes(bytes,'地圖自畫路線.gpx',provenance);}
    catch(error){if(applying===owner&&!disposed){completedInspection=null;draft?.invalidateTransient();controllerError={message:error?.message||'自畫路線未能套用，請重新檢查後重試。',revision:snapshot()?.revision};status(controllerError.message,true);}}
    finally{if(applying===owner){applying=null;if(mapReady&&!suspended&&!disposed)controller?.restore();render();}}
  }
  function resetForSource(){
    applying=null;cancelWork();releaseMap({preserveDraft:false});
    for(const url of urls)URL.revokeObjectURL(url);urls.clear();for(const timer of timers)clearTimeout(timer);timers.clear();status('');render();
  }
  function download(){
    if(!snapshot()?.canExport||drawing||transient||suspended||disposed)return;
    try{const url=URL.createObjectURL(new Blob([draft.exportGpx()],{type:'application/gpx+xml'}));urls.add(url);const a=document.createElement('a');a.href=url;a.download='地圖自畫路線.gpx';a.click();const timer=setTimeout(()=>{URL.revokeObjectURL(url);urls.delete(url);timers.delete(timer);},1000);timers.add(timer);}catch(error){status(error.message,true);}
  }
  function showCurrent(){
    if(!mapReady||!map||suspended||disposed)return;
    try{const data=mapLinesFromDetails(getWorkspace()?.details),features=data.lines.filter(x=>x.points.length>=2).map(line=>({type:'Feature',properties:{segment:line.segmentIndex},geometry:{type:'LineString',coordinates:unwrapLineForDisplay(line.points.map(p=>[p.lon,p.lat]))}}));
      const source=map.getSource('current-route');if(source)source.setData({type:'FeatureCollection',features});else{map.addSource('current-route',{type:'geojson',data:{type:'FeatureCollection',features}});map.addLayer({id:'current-route-line',type:'line',source:'current-route',paint:{'line-color':'#846b9b','line-width':3,'line-opacity':0.7}});}
      const points=features.flatMap(f=>f.geometry.coordinates);if(points.length){const [lon,lat]=points[0];map.jumpTo({center:[lon,Math.max(-85,Math.min(85,lat))],zoom:12});}
      status('紫色為目前 GPX 的唯讀參考；各原始段分開顯示。自畫草稿不繼承海拔或補站。');
    }catch(error){status(error.message,true);}
  }
  function cancelGesture(){
    if(!mapReady||suspended||disposed||applying||(!drawing&&!transient))return;
    const restoreFocus=document.activeElement===$('cancel');
    cancelWork();controller?.cancelDrawing();status('已取消未完成編輯；保留上次完成的草稿。');render();
    if(restoreFocus)($('edit').disabled?$('draw'):$('edit')).focus({preventScroll:true});
  }
  on($('finish'),'click',()=>{if(!mapReady||suspended||disposed||applying)return;controller?.finishDrawing();render();if(!drawing)$('edit').focus({preventScroll:true});});
  on($('cancel'),'click',cancelGesture);
  on($('map'),'pointercancel',cancelGesture);
  on($('map'),'lostpointercapture',()=>{if(transient&&!drawing)cancelGesture();});
  on(window,'blur',cancelGesture);
  on($('enable'),'click',enable);on($('check'),'click',check);on($('cancel-check'),'click',()=>{const restoreFocus=document.activeElement===$('cancel-check');cancelWork('自畫路線操作已取消；草稿與目前路線仍保留。');if(restoreFocus){$('panel').open=true;const action=mapReady?$('check'):$('enable'),target=action.disabled?$('panel').querySelector('summary'):action;target.focus({preventScroll:true});}});
  on($('download'),'click',download);on($('apply'),'click',reviewApply);on($('confirm-apply'),'click',confirmApply);on($('confirm-cancel'),'click',()=>{closeConfirmation();render();});on($('confirm'),'cancel',()=>{confirmation=null;});
  on($('show-current'),'click',showCurrent);
  for(const [id,method]of[['draw','startDrawing'],['edit','edit'],['undo','undo'],['redo','redo'],['reset','clear']])on($(id),'click',()=>{if(!mapReady||suspended||disposed||applying)return;controllerError=null;closeConfirmation();controller?.[method]();if(id==='draw'||id==='edit')map?.getCanvas()?.focus?.();});
  on($('map'),'keydown',event=>{if(!mapReady||suspended||disposed||applying||event.target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(event.target?.tagName))return;if(event.key==='Escape'&&(drawing||transient)){event.preventDefault();event.stopPropagation?.();cancelGesture();}else if((event.ctrlKey||event.metaKey)&&event.key?.toLowerCase()==='z'){event.preventDefault();closeConfirmation();controller?.[event.shiftKey?'redo':'undo']();}});
  on($('panel'),'toggle',()=>{if(!$('panel').open){cancelWork();controller?.cancelDrawing();releaseMap({preserveDraft:true});render();}else map?.resize?.();});
  on(window,'pagehide',event=>{suspended=true;cancelWork();for(const url of urls)URL.revokeObjectURL(url);urls.clear();for(const timer of timers)clearTimeout(timer);timers.clear();controller?.cancelDrawing();if(!event?.persisted){disposed=true;resetForSource();}render();});
  on(window,'pageshow',event=>{if(!event?.persisted||disposed)return;suspended=false;map?.resize?.();controller?.restore();render();});
  render();
  return Object.freeze({cancelWork,resetForSource,refresh:render,dispose(){if(disposed)return;disposed=true;resetForSource();for(const[target,type,fn]of listeners)target.removeEventListener?.(type,fn);listeners.length=0;}});
}
/** Only the reviewed fixed provider receives basemap requests; no URL comes from GPX. */
export function mapRequest(request){
  const url=new URL(request);
  if(url.origin!=='https://tiles.openfreemap.org'||url.username||url.password||url.search||url.hash||!/^\/(?:planet(?:\/\d{8}_\d{6}_pt\/\d{1,2}\/\d+\/\d+\.pbf)?|fonts\/Noto%20Sans%20Regular\/\d+-\d+\.pbf)$/.test(url.pathname))throw new Error('底圖來源不在固定允許清單。');
  return {url:url.href,credentials:'same-origin',referrerPolicy:'no-referrer'};
}
