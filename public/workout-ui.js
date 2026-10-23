import {validateStationClockWorkoutSource} from './station-clock-workout-source.mjs';
import {providerReceiptLedger} from './intervals-provider-receipt.mjs';
import {measureProviderData} from './intervals-provider-contract.mjs';
import {buildDistanceWorkout,checkWorkoutResourceBounds} from './intervals-workout-export.mjs';
import {buildTerrainSegments} from './terrain-segments.mjs';
import {focusErrorField} from './error-navigation.js';
import {parseCpStopValue} from './cp-stop-seconds.mjs';
const FALLBACK='這份結果暫時無法匯出，請重新計算或保留原配速表。';
// Only familiar formatting/device context is optional; source and unknown warnings stay visible.
const OPTIONAL_WORKOUT_ADVISORIES=new Set(['distance_is_not_navigation','watch_and_server_unverified','step_limit_unknown','pace_rounding','planned_stop_quantization','stops_omitted','explicit_flat_merge']);
const ERROR_MESSAGES=Object.freeze(Object.assign(Object.create(null),{
 stale_result:'結果已更新，請重新開啟課程。',blocked_route:'路線仍有待處理資料，暫時不能匯出課程。',
 partial_result:'還有區段時間未確定，暫時不能匯出完整課程。',incomplete_result:'結果尚未完整，請重新計算後匯出。',
 unrepresentable_distance:'有路段過短，無法保留為整公尺；請保留原配速表。',unrepresentable_pace:'有配速超出文字格式範圍，請調整計畫。',
 no_result:'請先產生完整的配速表或完賽預估。',no_rows:'缺少完整地形分段，請重新計算。',not_terrain_rows:'分段資料無法確認，請重新計算。',
 unrepresentable_stop:'補站停留無法以整秒保留，請檢查停留或取消加入計畫停留。',
 invalid_history_receipt:'所選歷史來源確認已失效，請重新計算。',history_plan_identity:'結果已被替換，請重新計算。',
 history_receipt_required:'缺少所選歷史來源確認，請重新計算。',history_checkpoint_identity:'補站與原結果不一致，請重新計算。',
 resource_limit:'結果超出已確認的課程轉換範圍。',inconsistent_result:'結果資料不一致，請重新計算或保留原配速表。',
 invalid_number:'結果含無法確認的數值，請重新計算。',negative_value:'結果時間或距離無法確認，請重新計算。',
 nonpositive_movement:'移動時間或距離無法匯出，請重新計算。',numeric_range:'結果數值超出文字格式範圍，請保留原配速表。',
 invalid_options:'匯出設定無法確認，請重新開啟課程。',invalid_text:'課程文字無法確認，請重新開啟課程。',
 unsupported_text:'課程文字格式無法確認，請重新開啟課程。',rounding_conservation:'取整後的總時間或距離不一致，請保留原配速表。',
 local_roundtrip:'課程文字檢查未通過，請保留原配速表。',
}));
const ownData=(object,key)=>{const d=object&&typeof object==='object'?Object.getOwnPropertyDescriptor(object,key):null;return d&&Object.hasOwn(d,'value')?d.value:undefined;};
function diagnostic(error){try{
 if(!error||typeof error!=='object')return null;
 for(const key of ['code','message','details']){const d=Object.getOwnPropertyDescriptor(error,key);if(d&&!Object.hasOwn(d,'value'))return null;}
 const code=ownData(error,'code');if(typeof code!=='string'||!Object.hasOwn(ERROR_MESSAGES,code))return null;
 const raw=ownData(error,'details');let details=null;
 if(raw!==undefined){if(code!=='unrepresentable_stop'||!raw||typeof raw!=='object'||Array.isArray(raw)||![Object.prototype,null].includes(Object.getPrototypeOf(raw)))return null;
  const keys=Reflect.ownKeys(raw);if(keys.length!==4||keys.some(k=>typeof k!=='string'||!['schema_version','occurrence_index','app_occurrence_id','reason'].includes(k)))return null;
  for(const key of keys){const d=Object.getOwnPropertyDescriptor(raw,key);if(!d||!d.enumerable||!Object.hasOwn(d,'value'))return null;}
  const index=ownData(raw,'occurrence_index'),id=ownData(raw,'app_occurrence_id'),reason=ownData(raw,'reason');
  if(ownData(raw,'schema_version')!=='workout-checkpoint-error/1'||!Number.isSafeInteger(index)||index<0||index>100||!(id===null||typeof id==='string'&&id.length>0&&id.length<=128)||!['authoritative_prefix','whole_second_precision'].includes(reason))return null;
  details={occurrence_index:index,app_occurrence_id:id};
 }
 return {code,details};
 }catch{return null;}}
/** Closed user text: diagnostics and input contents are never interpolated. */
export function workoutErrorMessage(error,{showOccurrence=false}={}){const d=diagnostic(error);if(!d)return FALLBACK;return showOccurrence===true&&d.details?`第${d.details.occurrence_index+1}個補站停留無法以整秒保留，請檢查該站或取消加入計畫停留。`:ERROR_MESSAGES[d.code];}
function captureNavigation(doc,input){try{
 const rows=[...(doc.querySelectorAll?.('.cp-item')??[])],cps=ownData(input.plan,'checkpoints');
 if(rows.length>100||!Array.isArray(cps)||cps.length>101)return null;
 let bytes=0;const encoder=new TextEncoder(),text=(s,max)=>{if(typeof s!=='string'||s.length>max)throw Error();bytes+=encoder.encode(s).length;if(bytes>131072)throw Error();return s;};
 const ids=new Set(),controls=rows.map(row=>{const id=text(row.dataset?.cpId,128);if(!id||ids.has(id))throw Error();ids.add(id);const fields=['.cp-name','.cp-distance','.cp-stop'].map(c=>row.querySelector(c));if(fields.some(f=>!f))throw Error();return {row,id,fields,values:fields.map((f,i)=>text(f.value,i===0?80:1024))};});
 const checkpoints=[];for(let i=0;i<cps.length;i++){const cp=ownData(cps,String(i)),name=text(ownData(cp,'name'),80),distance=ownData(cp,'distance_m'),stop=ownData(cp,'stop_s');if(!Number.isFinite(distance)||!Number.isFinite(stop))throw Error();checkpoints.push({cp,name,distance,stop});}
 const route=input.route,routeValues=['distance_m','geometry_sha256','route_sha256'].map(k=>ownData(route,k));
 return {controls,cps,checkpoints,route,routeValues};
 }catch{return null;}}
function navigationField(doc,input,snapshot,details){try{
 if(!snapshot||!details)return null;const {controls,cps,checkpoints,route,routeValues}=snapshot;
 if(input.route!==route||['distance_m','geometry_sha256','route_sha256'].some((k,i)=>!Object.is(ownData(route,k),routeValues[i]))||ownData(input.plan,'checkpoints')!==cps||cps.length!==checkpoints.length)return null;
 const rows=[...(doc.querySelectorAll?.('.cp-item')??[])];if(rows.length!==controls.length)return null;
 for(let i=0;i<controls.length;i++){const c=controls[i];if(rows[i]!==c.row||c.row.isConnected===false||c.row.dataset?.cpId!==c.id||['.cp-name','.cp-distance','.cp-stop'].some((key,j)=>c.row.querySelector(key)!==c.fields[j]||c.fields[j].isConnected===false||c.fields[j].value!==c.values[j]))return null;}
 for(let i=0;i<checkpoints.length;i++){const c=checkpoints[i];if(ownData(cps,String(i))!==c.cp||ownData(c.cp,'name')!==c.name||!Object.is(ownData(c.cp,'distance_m'),c.distance)||!Object.is(ownData(c.cp,'stop_s'),c.stop))return null;}
 const index=details.occurrence_index,c=controls[index],cp=checkpoints[index];if(!c||!cp||c.values[1].trim()===''||Number(c.values[1])*1000!==cp.distance||parseCpStopValue(c.values[2]).seconds!==cp.stop)return null;
 const context=input.providerHistory??input.historySelection;
 if(context){const child=context.receipt?.reference?.target_prediction,requested=child?.assumptions?.target_checkpoints,r=requested?.[index];if(child!==input.plan||details.app_occurrence_id!==c.id||!Array.isArray(requested)||!r||r.distance_m!==cp.distance||r.stop_s!==cp.stop)return null;}
 else if(input.stationClockContext){const station=validateStationClockWorkoutSource(input.stationClockContext,input.plan);if(details.app_occurrence_id!==c.id||station.occurrences[index]?.id!==c.id)return null;}
 else if(details.app_occurrence_id!==null)return null;
 return c.fields[2];
 }catch{return null;}}
/** Local export of an existing result. Never calculates a model or calls an account API. */
export function createWorkoutUI({getCurrentResult,documentImpl=globalThis.document,clipboard=globalThis.navigator?.clipboard,urlAPI=globalThis.URL,BlobImpl=globalThis.Blob,schedule=globalThis.setTimeout}){
 const doc=documentImpl,$=id=>doc.getElementById(id),dialog=$('workout-dialog');let mode=null,capture=null,built=null,generation=0,launcher=null,outputLease=null,outputLedger=null,failure=null,handledCloses=0,settledCloseGeneration=null;
 const duration=s=>{const n=Math.round(s);return `${Math.floor(n/3600)}:${String(Math.floor(n/60)%60).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;};
 const pace=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
 const status=text=>{$('workout-status').textContent=text;$('workout-status').hidden=!text;};
 const inputCurrent=input=>{try{const now=mode&&getCurrentResult(mode);return !!(input&&now&&now.current===true&&now.plan===input.plan&&now.route===input.route&&now.historySelection===input.historySelection&&now.providerHistory===input.providerHistory&&now.stationClockContext===input.stationClockContext);}catch{return false;}};
 const current=()=>inputCurrent(capture);
 const owns=(token,input,output)=>token===generation&&capture===input&&built===output;
 function clear(){$('workout-content').setAttribute?.('aria-busy','false');$('workout-basis').textContent='';outputLedger?.release(outputLease);outputLease=null;outputLedger=null;generation++;settledCloseGeneration=null;capture=null;built=null;failure=null;if($('workout-error-locate'))$('workout-error-locate').hidden=true;$('workout-download').disabled=true;$('workout-copy').disabled=true;if($('workout-reference-download')){$('workout-reference-download').disabled=true;$('workout-reference-download').hidden=true;}$('workout-content').hidden=true;$('workout-text').value='';$('workout-rows').replaceChildren();$('workout-warnings').replaceChildren();$('workout-advisories')?.replaceChildren();}
 function refresh(){for(const [id,m] of [['goal-workout','goal'],['prediction-workout','prediction']])$(id).disabled=!getCurrentResult(m);}
 function invalidate(){clear();if(dialog.open)status('設定或路線已改變，請重新計算後開啟課程。');refresh();}

 async function render(){
  clear();status('');const input=getCurrentResult(mode);if(!input||input.current!==true){status('請先產生目前路線的完整結果。');return;}
  const token=generation,renderMode=mode,snapshot=captureNavigation(doc,input);$('workout-content').setAttribute?.('aria-busy','true');if(input.providerHistory)status('正在核對目前結果…');let terrainLease=null,tempLedger=null;try{
   if(input.providerHistory){await input.revalidate();if(token!==generation||mode!==renderMode||!inputCurrent(input))return;}
   checkWorkoutResourceBounds(input);
   if(input.providerHistory){tempLedger=providerReceiptLedger(input.providerHistory.receipt);if(!tempLedger)throw Object.assign(new Error('provider_context_missing'),{code:'invalid_history_receipt'});terrainLease=tempLedger.reserve('workout-terrain-build',{bytes:16777216,nodes:1000000});outputLedger=tempLedger;outputLease=tempLedger.reserve('workout-output-build',{bytes:16777216,nodes:1000000});}
   const output=buildDistanceWorkout({...input,terrainRows:buildTerrainSegments(input.plan)},{mode:$('workout-format').value,paceToleranceSeconds:0,mergeSmallFlatSegments:false,stopMode:$('workout-planned-stops')?.checked?'planned-duration':'omit'});
   if(outputLease)outputLedger.settle(outputLease,measureProviderData(output,{maxBytes:16777216,maxNodes:1000000,maxDepth:32}));capture=input;built=output;$('workout-basis').textContent=(input.plan.model_version==='campbell2022-hiking-reference-goal-v1'?'徒步參考分配 · ':'')+(mode==='prediction'?(input.plan.status==='experimental_historical_reference'?'多筆平均參考 · 未校準':'依目前完賽預估 · 情境未校準'):input.stationClockContext?'依已套用人工配速與停留計時帳 · 未估疲勞連動':input.plan.purpose==='manual_pace_clock_preview'?'依人工配速時間表 · 未估疲勞連動':'依目前目標配速');
   const t=output.totals;$('workout-distance').textContent=`${(t.export_distance_m/1000).toFixed(3)} km`;$('workout-moving').textContent=duration(t.source_moving_s);$('workout-stops').textContent=duration(output.stop_mode==='planned-duration'?t.exported_stops_s:t.omitted_stops_s);
   const timed=output.stop_mode==='planned-duration';if($('workout-stops-label'))$('workout-stops-label').textContent=timed?'匯出計畫停留':'停留另計';if($('workout-stop-state'))$('workout-stop-state').textContent=timed?'計畫停留整秒 · 裝置待驗':'僅移動段 · 停留另計 · 依里程換段';if($('workout-stop-note'))$('workout-stop-note').textContent=timed?'補站停留以指定整秒步驟匯出；不保證原地停留、恢復或等候按鍵。依手錶里程換段，不以抵達補站觸發。':'課程只含移動段；補站停留請依原配速表安排。依手錶里程換段，不以抵達補站觸發。';$('workout-count').textContent=String(t.step_count);
   $('workout-rounding').textContent=`文字配速取整秒／公里，換算移動時間差 ${t.nominal_moving_delta_s>=0?'+':''}${t.nominal_moving_delta_s.toFixed(1)} 秒。${timed?` 停留取整差 ${t.stop_rounding_delta_s.toFixed(1)} 秒；移動與停留分別取整的合計較整秒原總時間差 ${t.display_elapsed_delta_s} 秒。`:''}`;
   for(const step of output.steps){const tr=doc.createElement('tr');for(const text of step.kind==='planned_stop'?[String(step.index),`${step.export_duration_s} s`,'計畫停留','—',duration(step.export_duration_s),step.source_checkpoint.name||'CP']:[String(step.index),`${step.export_distance_m} m`,step.label,`${pace(step.target_fast_s_per_km)}／km`,duration(step.display_moving_s),step.end_checkpoint?.name||'—']){const td=doc.createElement('td');td.textContent=text;tr.append(td);}$('workout-rows').append(tr);}
   for(const warning of output.warnings||[]){const message=typeof warning==='string'?warning:typeof warning?.message==='string'?warning.message:null;if(message){const li=doc.createElement('li');li.textContent=message;const holder=OPTIONAL_WORKOUT_ADVISORIES.has(warning?.code)?$('workout-advisories')??$('workout-warnings'):$('workout-warnings');holder.append(li);}}
   status('');$('workout-text').value=output.text;$('workout-content').hidden=false;$('workout-download').disabled=false;$('workout-copy').disabled=false;if($('workout-reference-download')){$('workout-reference-download').hidden=!output.result_basis?.hiking_reference;$('workout-reference-download').disabled=!output.result_basis?.hiking_reference;}
  }catch(error){if(token!==generation||mode!==renderMode)return;clear();const info=diagnostic(error);failure={input,token:generation,mode:renderMode,snapshot,details:info?.details??null};const field=inputCurrent(input)?navigationField(doc,input,snapshot,info?.details):null;status(workoutErrorMessage(error,{showOccurrence:!!field}));const locate=$('workout-error-locate');if(locate&&info?.code==='unrepresentable_stop'){locate.textContent=field?'檢查這個補站停留':'檢查加入計畫停留';locate.hidden=false;}}finally{tempLedger?.release(terrainLease);if(token===generation)$('workout-content').setAttribute?.('aria-busy','false');}
 }
 function open(m,button){mode=m;launcher=button;render();if(!dialog.open)dialog.showModal();$('workout-close').focus({preventScroll:true});}
 function focusLauncher(){const target=launcher?.isConnected&&!launcher.disabled?launcher:$('gpx-file');target?.focus?.({preventScroll:true});}
 function closeTo(ticket=null,field=null){if(!dialog.open)return;clear();status('');const closedGeneration=generation;settledCloseGeneration=closedGeneration;handledCloses++;dialog.close();if(generation!==closedGeneration||dialog.open)return;if(ticket&&field&&ticket.mode===mode&&inputCurrent(ticket.input)&&navigationField(doc,ticket.input,ticket.snapshot,ticket.details)===field)focusErrorField(field);else focusLauncher();}
 function close(){closeTo();}
 dialog.addEventListener('close',()=>{if(handledCloses>0){handledCloses--;return;}if(dialog.open||settledCloseGeneration===generation)return;clear();status('');focusLauncher();});
 $('workout-error-locate')?.addEventListener('click',()=>{const ticket=failure;if(!ticket||ticket.token!==generation||ticket.mode!==mode||!inputCurrent(ticket.input)){if(ticket?.token===generation){status('結果已更新，請重新開啟課程。');$('workout-error-locate').hidden=true;}return;}const field=navigationField(doc,ticket.input,ticket.snapshot,ticket.details);if(field)closeTo(ticket,field);else{status(ERROR_MESSAGES.unrepresentable_stop);focusErrorField($('workout-planned-stops'));}});
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 $('workout-close').addEventListener('click',close);
 $('goal-workout').addEventListener('click',()=>open('goal',$('goal-workout')));$('prediction-workout').addEventListener('click',()=>open('prediction',$('prediction-workout')));
 $('workout-format').addEventListener('change',render);$('workout-planned-stops')?.addEventListener('change',render);
 $('workout-download').addEventListener('click',async()=>{
  if(!built||!current()){invalidate();return;}const token=generation,input=capture,captured=built;try{if(input.providerHistory){await input.revalidate();if(!owns(token,input,captured)||!current())return;}}catch{if(!owns(token,input,captured))return;invalidate();status('平台存取無法確認，未產生下載。');return;}
  let url=null;try{url=urlAPI.createObjectURL(new BlobImpl([built.text],{type:built.mime_type}));const link=doc.createElement('a');link.href=url;link.download=built.filename;doc.body.append(link);try{link.click();}finally{link.remove();}status('已向瀏覽器請求下載文字檔。');}catch{status('下載未完成，請重試或複製下方文字。');}finally{if(url)schedule(()=>urlAPI.revokeObjectURL(url),1000);}
 });
 $('workout-reference-download')?.addEventListener('click',()=>{
  if(!built||!current()||!built.result_basis?.hiking_reference){invalidate();return;}
  const sidecar={schema_version:'hiking-workout-reference/1.0',workout_filename:built.filename,workout_text:built.text,result_basis:built.result_basis,route_provenance:capture.referenceProvenance??null,totals:built.totals,warnings:built.warnings,verification:built.verification,notice:'文字檔只含課程步驟；此依據檔保留參考模型與來源，不保證裝置相容或個人達標。'};
  let url=null;try{url=urlAPI.createObjectURL(new BlobImpl([JSON.stringify(sidecar,null,2)],{type:'application/json'}));const link=doc.createElement('a');link.href=url;link.download='hiking-workout-reference.json';doc.body.append(link);try{link.click();}finally{link.remove();}status('已向瀏覽器請求下載徒步參考依據；課程文字需另行下載。');}catch{status('依據檔下載未完成，請重試。');}finally{if(url)schedule(()=>urlAPI.revokeObjectURL(url),1000);}
 });
 $('workout-copy').addEventListener('click',async()=>{
  if(!built||!current()){invalidate();return;}const token=generation,input=capture,captured=built,text=captured.text;let accessReady=!input.providerHistory;
  try{if(input.providerHistory){await input.revalidate();if(!owns(token,input,captured)||!current())return;accessReady=true;}if(typeof clipboard?.writeText!=='function')throw new Error('unavailable');await clipboard.writeText(text);if(owns(token,input,captured)&&current())status('已複製課程文字。');}
  catch{if(!owns(token,input,captured))return;if(!accessReady){invalidate();status('平台存取無法確認，未複製課程。');return;}if(token!==generation||!current())return;$('workout-code').open=true;$('workout-text').focus({preventScroll:true});$('workout-text').select?.();status('無法自動複製。已選取文字，可手動複製或下載檔案。');}
 });
 refresh();return {refresh,invalidate,open,close};
}
