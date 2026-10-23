import {createLiveUI} from './live-ui.mjs';
import {routeChoicePresentation,routeNoticeText,appendRouteChoiceNotes,selectedRouteVersionLabel} from './route-library-copy.mjs';
import {hikingReferenceProvenance} from './hiking-reference.mjs';
import {terrainErrorMessage,repairProposalStatus} from './terrain-guidance.mjs';
import {publishedStationServiceEntries,publishedStationObservationSnapshot,publishedStationDisclosureLabels} from './published-station-services.mjs';
import {appendPublishedCheckpointTables} from './published-checkpoint-tables.mjs';
import {sourceDateQualification,eventDateQualification,courseDateQualification} from './catalog-dates.mjs';
'use strict';
import {checkpointDeadline} from './cutoff-view.js';
import {collectWaypointChoices,waypointCandidateCoverage,sameWaypointOccurrence,waypointReconfirmationHint} from './checkpoint-waypoint-choices.mjs';
import {appendCheckpointTime} from './checkpoint-time.mjs';
import {planDisplay,displayTerrain,terrainPolicyText,renderTerrainList,renderCheckpointSchedule,markSelectedStation} from './schedule-view.mjs';
import {renderPredictionTable} from './prediction-table.js';
import {createGuidedTour} from './guided-tour.js';
import {createTransport} from './transport.js';
import {createRouteDrawingUI} from './drawing/workspace-ui.mjs';
import {RACES} from './catalog-data.js';
import {createSourceIdentityIndex,sourceForExactChoice} from './upload-source-identity.mjs';
import {createOptionalUploadOnlyIndex,classifyUploadWithOptionalSources} from './upload-only-source-data.mjs';
import {browserSha256} from './python-engine.mjs';
import {canonicalCourseStream,createCourseContextIndex,classifyCourseFingerprint,courseContextForChoice,courseContextSnapshot,courseChoicesForEvent,courseChoiceForKey} from './upload-course-context.mjs';
import {COURSE_FINGERPRINTS} from './upload-course-fingerprints.mjs';
import {uploadedCourseStationFacts,courseStationFactKey} from './upload-course-facts.mjs';
import {verifyUploadedCourseMapping,uploadedCourseMappingCurrent,uploadedCourseMappingChoice} from './upload-course-mapping.mjs';
import {previewCheckpointOrder} from './checkpoint-order.mjs';
import {EVENT_FACTS} from './global-catalog-data.js';
import {REGION_LABELS,validateEventCatalog,eventBadge,filterEvents} from './event-catalog.js';
import {downloadRaceRoute,assertRouteDownloadAvailable} from './race-loader.js';
import {readGpxFile,gpxAcquisitionMessage} from './gpx-file-acquisition.mjs';
import {buildTerrainSegments} from './terrain-segments.mjs';
import {buildCheckpointGroups,checkpointRowDisplay} from './checkpoint-groups.mjs';
import {mapOfficialCheckpoints,officialCutoffElapsed,officialCheckpointFacts} from './official-checkpoints.js';
import {collectOfficialCoordinateChoices,sameOfficialCoordinateOccurrence} from './official-coordinate-choices.mjs';
import {enrichGpx,estimatedCoordinate} from './gpx-export.js';
import {readExportCheckpointSuggestions,exportSuggestionForNativePassage,unverifiedCheckpointSourceClaims,catalogCheckpointSourceClaims} from './checkpoint-export-import.mjs';
import {createElevationLocator} from './elevation-locator.mjs';
import {createRouteQualityUI} from './route-quality-ui.mjs';
import {checkpointGpxFilename,originalGpxFilename,derivedGpxFilename} from './gpx-filename.mjs';
import {createServiceStopUI} from './service-stop-ui.mjs';
import {sumCpStops} from './service-stop-drafts.mjs';
import {parseCpStopValue,formatCpStopMinutes} from './cp-stop-seconds.mjs';
import {createAbilityUI} from './ability-ui.js';
import {createPredictionUI} from './prediction-ui.js';
import {profileMarkerCoordinate} from './profile-coordinate.js';
import {checkpointProfileInfo} from './profile-checkpoints.js';
import {createErrorNavigator,errorFieldIds,focusErrorField} from './error-navigation.js';
import {captureGoalSnapshot,prepareGoalTargetApplication,validateGoalTargetCandidate} from './goal-target-suggestions.mjs';
import {createGoalTargetSuggestionUI,sameGoalRequest} from './goal-target-suggestion-ui.mjs';
import {createWorkoutUI} from './workout-ui.js';
import {createManualPaceUI} from './manual-pace-ui.mjs';
import {createConditionalPreviewController} from './conditional-preview-controller.mjs';
import {createStationClockUI} from './station-clock-ui.mjs';
import {clockContentKey,preflightClockData} from './station-clock-comparison.mjs';
import {validateManualClockReceipt} from './manual-clock-receipt.mjs';
import {assertMovingMirror,assertOriginalMovingReference,validateNativeMovingProof,projectManualLocks} from './manual-station-clock.mjs';
import {restoreVerifiedManualPaceState,previewManualPace,previewManualUnlock} from './manual-pace-state.mjs';
import {initializeSegmentedTimeInputs,bindSegmentedTimeInput,readTimeInput,timeInputEditor,validateTimeParts} from './segmented-time-input.mjs';
initializeSegmentedTimeInputs();
import {durationDistanceForSelection} from './duration-width-policy.mjs';
import {renderDiagnosticNotices,routeStatus,bindStatusDisclosures} from './status-disclosure.js';
bindStatusDisclosures();
let abilityUI=null,predictionUI=null,workoutUI=null,serviceStopUI=null,goalSuggestionUI=null,manualPaceUI=null,drawingUI=null,routeQualityUI=null,conditionalPreview=null,stationClockUI=null;
let stationClockBarrier=false;
const stationClockAcceptedContents=new WeakMap(),stationClockAcceptedSources=new WeakMap();
const originalPlanExportLabel=document.getElementById('export').textContent;
const conditionalAcceptedSignatures=new WeakMap(),conditionalPlanIds=new WeakMap(),planCatalogDates=new WeakMap();let conditionalPlanSequence=0,predictionDateAdmission=null;
let goalInputRevision=0,goalApplication=null;
const transportMode=document.documentElement.dataset.transport;
const transport=createTransport(transportMode);
const $ = (id) => document.getElementById(id);
const goalErrors=createErrorNavigator({feedback:$('feedback'),mode:'goal',activate:()=>{if($('goal-mode').getAttribute('aria-pressed')!=='true')$('goal-mode').click();}});
const state = {courseUpload:null,courseContext:null,uploadIdentity:null,sourceProjectionPending:false,originalFileName:'',gpx: null, route: null, plan: null, request: null, requestKind: null, token: 0, cpCount: 0, cpIdentity: 0, originalRoute: null, source:null,drawnProvenance:null, calculationGpx:null, calculationDetails:null, repairProposal:null, surfaceProposal:null, repairApplied:null, profilePrediction:null, details:null, detailStatus:null, comparisons:[], tableView:'checkpoints', expandedGroups:new Set(), terrainLevel:'standard',selectedCheckpoint:0, startTime:"08:00"};
let serviceRouteRevision=0,serviceMappingRevision=0,serviceMainBusy=false;
let pendingRouteImport=null,routeRetrySource=null;
let courseMappingRequest=null,courseMappingPreview=null,checkpointOrderPreview=null,courseRowsRevision=0;
let checkpointStopSourceOwner=Object.freeze({});
const checkpointNoStopActions=new WeakMap();
const courseMappingAdoptions=new WeakMap();
const courseRowsObserver=typeof MutationObserver==='function'?new MutationObserver(()=>{courseRowsRevision++;}):null;courseRowsObserver?.observe($('cp-list'),{childList:true});
const MAX_BYTES = 5 * 1024 * 1024;
let EVENTS=[],catalogIssue='',sourceIdentityIndex=null;try{EVENTS=validateEventCatalog(EVENT_FACTS,RACES);sourceIdentityIndex=createSourceIdentityIndex(RACES);}catch{catalogIssue='賽事庫資料暫時無法確認。仍可使用自己的 GPX。';}
let uploadOnlyIdentityIndex=null;try{if(sourceIdentityIndex)uploadOnlyIdentityIndex=createOptionalUploadOnlyIndex(RACES);}catch{/* Optional manual-source data cannot disable existing source matches. */}
let courseContextIndex=null;try{if(sourceIdentityIndex)courseContextIndex=createCourseContextIndex(EVENTS,RACES,COURSE_FINGERPRINTS);}catch{/* Optional course context cannot disable ordinary upload. */}
function base64(bytes) {
  let raw = '';
  for (let i=0;i<bytes.length;i+=8192) raw += String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(raw);
}
function clock(seconds) {
  const n = Math.max(0, Math.floor(seconds+.5));
  return `${String(Math.floor(n/3600)).padStart(2,'0')}:${String(Math.floor(n/60)%60).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
}
function parseClock(text, label,field=null) {
  if(field)text=readTimeInput(field,label);
  const m = /^(\d{1,3}):([0-5]\d):([0-5]\d)$/.exec(text.trim());
  if (!m) throw Object.assign(new Error(`${label}請填「時:分:秒」，例如 06:30:00。`),{fields:field?[field]:[]});
  return Number(m[1])*3600+Number(m[2])*60+Number(m[3]);
}
function number(input, label) {
  if (!input.value.trim() || !Number.isFinite(Number(input.value))) throw Object.assign(new Error(`${label}需要有限數字。`),{fields:[input]});
  if (!input.checkValidity()) throw Object.assign(new Error(`${label}超出允許範圍，請確認欄位的單位與限制。`),{fields:[input]});
  return Number(input.value);
}
function checkpointStopSeconds(input){
  const parsed=parseCpStopValue(input.value);
  if(parsed.status!=='known'||!input.checkValidity())throw Object.assign(new Error(parsed.status==='unknown'?'請填停留分鐘；未填不能視為零。':'停留分鐘超出允許範圍或無法辨識。'),{code:'invalid_target_stops',fields:[input]});
  return parsed.seconds;
}
function feedback(text, kind='') {
  goalSuggestionUI?.clear();goalErrors.clear();
  $('feedback').textContent=text; $('feedback').className=`feedback ${kind}`; $('feedback').hidden=!text;
}
function invalidate(message=true) {
  if(stationClockBarrier)throw new Error('完整方案正在套用。');
  stationClockUI?.invalidate();
  clearCourseWorkflowPreviews();
  conditionalPreview?.invalidate();
  goalInputRevision++;goalSuggestionUI?.clear();
  // Clear result ownership before callbacks can redraw a partially failed render.
  state.plan=null;$('result-mode-status').textContent='';$('assumptions').replaceChildren();$('result-basis').open=false;manualPaceUI?.invalidate();state.comparisons=[];state.expandedGroups.clear();$('comparison').hidden=true;$('plan-result').hidden=true;$('export').disabled=true;
  refreshCheckpointLocations();
  serviceStopUI?.refresh();predictionUI?.refreshStops();refreshWaypointControls();
  workoutUI?.invalidate();
  predictionUI?.cancel();
  $('cp-count').textContent=`${$('cp-list').children.length} 站`;
  workoutUI?.refresh();if(state.route)profile(state.route);
  renderTerrainOverview();refreshSettingsSummary();
  if(message && state.route) feedback('設定已變更，請重新計算。');
}
function busy(on) {
  $('surface-panel').hidden=transportMode!=='webworker'||!state.gpx||!state.route;$('surface-check').disabled=on||!!state.calculationGpx||!state.details;$('surface-apply').disabled=on||!!state.calculationGpx||!state.details;
  serviceMainBusy=on;refreshSettingsSummary();routeQualityUI?.refresh();
  refreshCheckpointLocations(on);refreshCourseWorkflowControls();
  serviceStopUI?.refresh();predictionUI?.refreshStops();refreshWaypointControls();
  workoutUI?.refresh();
  predictionUI?.refreshTarget?.();$('repair-check').disabled=on;$('repair-apply').disabled=on||!state.details;$('repair-revert').disabled=on;$('download-derived').disabled=on;$('download-repair-record').disabled=on;
  $('cp-count').textContent=`${$('cp-list').children.length} 站`;
  $('planner-form').setAttribute('aria-busy',String(on));
  $('details-retry').disabled=on||!state.gpx||!state.route||!!state.calculationGpx;
  $('download-original').disabled=on||!state.gpx;
  $('download-enriched').disabled=on||!state.details||!state.route||state.route.blocked||checkpointPositionsPending();
  $('calculate').disabled=on || !state.route || state.route.blocked;
  $('add-cp').disabled=on || !state.route || state.route.blocked;
  $('cancel').hidden=!on;drawingUI?.refresh();
  $('example').disabled=on;
  // Accepted version only; pending proposals never own the selected-row label.
  refreshCatalogRouteSelection();
  // File changes remain available and abort an older request.
}
function stopRequest({preserveGoalInputRevision=false,preserveAcceptedResults=false}={}) {
  if(stationClockBarrier)return;
  if(!preserveAcceptedResults||stationClockUI?.isBusy())stationClockUI?.cancel();
  cancelCourseMappingVerification();
  conditionalPreview?.cancel();
  routeQualityUI?.cancel();
  drawingUI?.cancelWork();
  if(!preserveAcceptedResults||manualPaceUI?.isBusy())manualPaceUI?.cancel();
  const restoredGoal=rollbackGoalApplication();
  // Idle pagehide cancels transient work without changing accepted input ownership.
  if(!preserveGoalInputRevision||restoredGoal)goalInputRevision++;
  goalSuggestionUI?.clear();
  if(!preserveAcceptedResults)workoutUI?.invalidate();
  if(state.requestKind?.startsWith('repair-surface'))$('surface-status').textContent='檢查已取消，原始資料保持不變。';
  if(state.requestKind?.startsWith('repair'))$('repair-status').textContent='處理已取消，可重新檢查。';
  if(preserveAcceptedResults){abilityUI?.cancelPending();predictionUI?.cancelPending();}
  else {abilityUI?.cancel();predictionUI?.cancel();}
  if(!pendingRouteImport&&['details','details-retry'].includes(state.requestKind)&&(!state.details||state.sourceProjectionPending)){state.detailStatus='原始軌跡詳細資料已暫停';$('detail-status').textContent='詳細資料已暫停，已知站點保留，可重試。';$('detail-status').hidden=false;$('details-retry').hidden=false;if(state.route)profile(state.route);}
  state.token++;
  pendingRouteImport=null;
  if(state.request) state.request.abort();
  transport.cancel();state.request=null; state.requestKind=null; busy(false);
}
async function api(path,payload,controller) {
  const operation=path==='/api/inspect'?'inspect':path==='/api/details'?'details':'plan';
  const requested=transport.request(operation,payload,{signal:controller.signal,onStatus:(status)=>{
    if(controller.signal.aborted)return;
    const text={runtime_loading:'首次準備計算環境…',core_loading:'正在準備路線…',ready:'計算環境已就緒…',computing:'正在計算…'}[status];
    if(text)feedback(text,'busy');
  }});
  conditionalPreview?.foregroundAccepted(operation,controller.signal);return requested;
}

function notices(element, items) { renderDiagnosticNotices(element,items); }

function svgElement(tag, attrs) {
  const el=document.createElementNS('http://www.w3.org/2000/svg',tag);
  for(const [key,value] of Object.entries(attrs)) el.setAttribute(key,value);
  return el;
}
function profile(route,checkpoints=null) {
  const active=state.profilePrediction?.prediction||state.plan;
  const mode=state.profilePrediction?'prediction':state.plan?'goal':'pending';
  const clockValue=state.profilePrediction?.start_local_time||state.startTime;
  checkpoints=checkpoints??active?.checkpoints??[...$('cp-list').children].map(cp=>({name:cp.querySelector('.cp-name').value.trim(),distance_m:cp.dataset.locationPending!=='true'&&cp.querySelector('.cp-distance').value.trim()?Number(cp.querySelector('.cp-distance').value)*1000:null,stop_s:parseCpStopValue(cp.querySelector('.cp-stop').value).seconds}));
  const selector=$('profile-cp-select'),readout=$('profile-cp-detail');selector.replaceChildren();selector.onchange=null;readout.textContent='';$('profile-checkpoints').hidden=!checkpoints.length;
  const showCp=i=>{const cp=checkpoints[i];if(!cp)return;state.selectedCheckpoint=i;markSelectedStation($('plan-station-rows'),i);markSelectedStation($('prediction-table'),i);for(const marker of $('profile').querySelectorAll('.profile-cp-button'))marker.setAttribute('aria-pressed',String(Number(marker.dataset.stationIndex)===i));selector.value=String(i);const info=checkpointProfileInfo(cp,{mode,startClock:clockValue});readout.textContent=info.mode==='待計算'?info.distance:`到站 ${info.arrival} · 離站 ${info.departure} · 停留 ${info.stop}`;};
  checkpoints.forEach((cp,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=cp.name+(Number.isFinite(cp.distance_m)?` · ${(cp.distance_m/1000).toFixed(3)} km`:' · 里程待確認');selector.append(o);});selector.onchange=()=>showCp(Number(selector.value));if(checkpoints.length)showCp(Math.min(state.selectedCheckpoint,checkpoints.length-1));
  const el=$('profile');el.onpointermove=null;el.replaceChildren();$('profile-cursor').disabled=true;$('profile-readout').textContent='—';
  const chartDetails=$('profile-layer').value==='derived'&&state.calculationDetails?state.calculationDetails:state.details;const derivedChart=chartDetails===state.calculationDetails&&!!state.calculationDetails;const segments=chartDetails?.raw_profile_segments||[];let offset=0;const points=[];for(const segment of segments){for(const [i,p] of segment.points.entries())points.push({...p,canonical_along_route_m:state.calculationGpx&&!derivedChart?null:p.canonical_along_route_m,x:offset+p.horizontal_m,breakBefore:i===0});offset+=segment.points.at(-1)?.horizontal_m||0;}
  const heights=points.filter(p=>Number.isFinite(p.ele)).map(p=>p.ele);
  if(!points.length||!heights.length||offset<=0){const t=svgElement('text',{x:400,y:125,'text-anchor':'middle'});t.textContent=!points.length?(state.detailStatus||'正在讀取原始 GPX 軌跡…'):'GPX 缺少海拔，沒有可繪製的海拔曲線';el.append(t);paintElevationLocation();return;}
  const min=Math.min(...heights),max=Math.max(...heights);const niceStep=span=>{const raw=Math.max(span,1)/4,power=10**Math.floor(Math.log10(raw)),v=raw/power;return (v<=1?1:v<=2?2:v<=5?5:10)*power;};
  const step=niceStep(max-min),lo=Math.floor(min/step)*step,hi=Math.max(lo+step,Math.ceil(max/step)*step),left=58,right=780,top=34,bottom=233;const px=m=>left+m/offset*(right-left),py=h=>bottom-(h-lo)/(hi-lo)*(bottom-top);
  for(let h=lo;h<=hi+step*.01;h+=step){const y=py(h);el.append(svgElement('line',{x1:left,y1:y,x2:right,y2:y,class:'chart-grid'}));const t=svgElement('text',{x:left-10,y:y+4,'text-anchor':'end'});t.textContent=String(Math.round(h*100)/100);el.append(t);}
  const xStep=niceStep(offset/1000),distances=[];for(let km=0;km<offset/1000;km+=xStep){if(offset/1000-km<xStep*.6&&km>0)continue;distances.push(km*1000);}distances.push(offset);
  for(const m of distances){const x=px(m);el.append(svgElement('line',{x1:x,y1:top,x2:x,y2:bottom,class:'chart-grid'}));const t=svgElement('text',{x,y:bottom+20,'text-anchor':m===0?'start':m===offset?'end':'middle'});t.textContent=(m/1000).toFixed(m===offset?Math.max(2,Math.min(4,-Math.floor(Math.log10(xStep)))):Math.max(0,Math.min(4,-Math.floor(Math.log10(xStep)))));el.append(t);}
  for(const [x,y,label,anchor] of [[left,17,derivedChart?'處理後海拔（m）':'GPX 原始海拔（m）','start'],[right,276,'GPX 水平累距（km）','end']]){const t=svgElement('text',{x,y,'text-anchor':anchor});t.textContent=label;el.append(t);}
  let part=[];const draw=()=>{if(!part.length)return;const path=part.map((p,i)=>`${i?'L':'M'}${px(p.x).toFixed(3)},${py(p.ele).toFixed(3)}`).join(' ');if(part.length>1)el.append(svgElement('path',{d:`${path} L${px(part.at(-1).x)},${bottom} L${px(part[0].x)},${bottom} Z`,class:'profile-fill'}));el.append(svgElement('path',{d:path,class:'profile-line'}));part=[];};
  for(const p of points){if(p.breakBefore)draw();if(!Number.isFinite(p.ele)){draw();continue;}part.push(p);}draw();
  if(segments.length===1){for(const [i,cp] of checkpoints.entries()){const p=profileMarkerCoordinate(points,active?.geometry_snapshot||state.calculationDetails?.profile_geometry||state.details?.profile_geometry,cp.distance_m);if(!p||!Number.isFinite(p.ele))continue;const x=px(p.horizontal_m),y=py(p.ele);el.append(svgElement('line',{x1:x,x2:x,y1:top,y2:bottom,class:'profile-marker'}));const group=svgElement('g',{class:'profile-cp-button',role:'button',tabindex:0,'aria-label':`${cp.name}，${(cp.distance_m/1000).toFixed(3)}公里，查看到離站時間`});group.dataset.stationIndex=String(i);group.setAttribute('aria-pressed',String(i===state.selectedCheckpoint));const hit=svgElement('circle',{cx:x,cy:y,r:16,class:'profile-cp-hit'});const c=svgElement('circle',{cx:x,cy:y,r:5,class:'profile-cp'});const title=svgElement('title',{});title.textContent=cp.name+(p.interpolated?' · 原始折線內插位置':' · 原始 GPX 點');group.append(title,hit,c);group.addEventListener('click',()=>showCp(i));group.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();showCp(i);}});el.append(group);const t=svgElement('text',{x,y:27-(i%2)*12,'text-anchor':x>730?'end':'middle'});t.textContent=Math.abs(cp.distance_m-route.distance_m)<.001?'終點':`CP${i+1}`;el.append(t);}}
  const cursor=svgElement('circle',{cx:left,cy:py(heights[0]),r:4,class:'profile-cursor'});el.append(cursor);const input=$('profile-cursor');input.disabled=false;input.max=String(offset);input.value='0';
  const inspect=m=>{const point=points.reduce((a,p)=>Math.abs(p.x-m)<Math.abs(a.x-m)?p:a,points[0]);const known=Number.isFinite(point.ele);cursor.setAttribute('visibility',known?'visible':'hidden');if(known){cursor.setAttribute('cx',px(point.x));cursor.setAttribute('cy',py(point.ele));}const text=`${(point.x/1000).toFixed(3)} km · ${profileElevationLabel(point.ele)}${derivedChart?' · 處理後資料':''}`;$('profile-readout').textContent=text;input.setAttribute('aria-valuetext',`${text}，${derivedChart?'處理後點':'原始點'} ${point.source_point_index+1}`);};
  input.oninput=()=>inspect(Number(input.value));el.onpointermove=event=>{const box=el.getBoundingClientRect();if(!box.width)return;const m=Math.max(0,Math.min(offset,((event.clientX-box.left)/box.width*800-left)/(right-left)*offset));input.value=String(m);inspect(m);};inspect(0);paintElevationLocation();
}
let elevationLocator=null,elevationOriginal=null,elevationScan=null,elevationSummary=null,elevationPage=0,elevationCursors=[null],elevationSelection=null;
function resetElevationLocator(){
  elevationScan?.abort();elevationScan=null;elevationLocator?.dispose();elevationLocator=null;elevationOriginal=null;elevationSummary=null;elevationPage=0;elevationCursors=[null];elevationSelection=null;
  $('elevation-locator').hidden=true;$('elevation-locator').open=false;$('elevation-locator').setAttribute('aria-busy','false');$('elevation-locations').replaceChildren();$('elevation-page-status').textContent='';$('elevation-selection').textContent='';$('elevation-prev').disabled=true;$('elevation-next').disabled=true;
}
function prepareElevationLocator(){
  if(elevationOriginal===state.details)return;
  resetElevationLocator();
  if(!state.details?.summary?.missing_elevation_point_count)return;
  try{elevationLocator=createElevationLocator(state.details);elevationOriginal=state.details;$('elevation-locator').hidden=false;$('elevation-locator-label').textContent=`定位缺海拔 · ${state.details.summary.missing_elevation_point_count.toLocaleString()} 點`;}
  catch{$('detail-status').hidden=false;$('detail-status').textContent='缺海拔位置未完成，請重新導入。';}
}
function elevationPointLabel(row){const [a,b]=row.source_point_range;return `第 ${row.segment_index+1} 段 · 原始點 ${a+1}${a===b?'':`–${b+1}`}`;}
function elevationRangeLabel(row){const [a,b]=row.profile_horizontal_range_m;return `${(a/1000).toFixed(3)}${a===b?'':`–${(b/1000).toFixed(3)}`} km`;}
function paintElevationLocation(){
  for(const old of $('profile').querySelectorAll('.elevation-location-overlay'))old.remove();
  const row=elevationSelection;
  if(!row||row.route_sha256!==state.details?.source?.route_sha256||$('profile-layer').value==='derived')return;
  const length=state.details.summary.raw_horizontal_distance_m;
  if(!Number.isFinite(length))return;
  const px=x=>58+(length>0?x/length:0)*722;
  const g=svgElement('g',{class:'elevation-location-overlay','aria-label':`${elevationPointLabel(row)}，${elevationRangeLabel(row)}，海拔未知`});
  const [a,b]=row.affected_profile_horizontal_range_m,[first,last]=row.profile_horizontal_range_m;
  g.append(svgElement('rect',{x:px(a),y:34,width:Math.max(2,px(b)-px(a)),height:199,class:'elevation-location-band'}));
  for(const x of first===last?[first]:[first,last])g.append(svgElement('line',{x1:px(x),x2:px(x),y1:34,y2:233,class:'elevation-location-line'}));
  const title=svgElement('title',{});title.textContent='原始缺海拔位置與相鄰邊 · 海拔未知';g.append(title);$('profile').append(g);
}
async function loadElevationPage(index=elevationPage){
  const locator=elevationLocator,original=elevationOriginal;if(!locator||!$('elevation-locator').open||!Number.isInteger(index)||index<0||index>=elevationCursors.length)return;
  elevationScan?.abort();const controller=new AbortController();elevationScan=controller;
  const current=()=>elevationScan===controller&&elevationLocator===locator&&state.details===original&&!controller.signal.aborted;
  $('elevation-locator').setAttribute('aria-busy','true');$('elevation-page-status').textContent='正在定位…';$('elevation-prev').disabled=true;$('elevation-next').disabled=true;
  try{
    const summary=elevationSummary||await locator.summarize({signal:controller.signal});if(!current())return;
    const page=await locator.page(elevationCursors[index],{signal:controller.signal});if(!current())return;
    elevationSummary=summary;elevationPage=index;if(page.next)elevationCursors[index+1]=page.next;else elevationCursors.length=index+1;
    $('elevation-locations').replaceChildren();
    for(const row of page.rows){
      const li=document.createElement('li'),button=document.createElement('button'),title=document.createElement('span'),anchors=document.createElement('span');
      button.type='button';button.className='elevation-location-button';button.dataset.sourceStart=String(row.source_point_range[0]);button.dataset.segmentIndex=String(row.segment_index);button.setAttribute('aria-pressed',String(elevationSelection?.source_point_range[0]===row.source_point_range[0]&&elevationSelection?.route_sha256===row.route_sha256));
      title.textContent=`${elevationPointLabel(row)} · ${elevationRangeLabel(row)}`;anchors.className='elevation-location-anchors';anchors.textContent=`前 ${row.left_anchor?row.left_anchor.elevation_m+' m':'未知'} · 後 ${row.right_anchor?row.right_anchor.elevation_m+' m':'未知'}`;
      button.append(title,anchors);button.addEventListener('click',()=>{
        if(elevationLocator!==locator||state.details!==original)return;
        elevationSelection=row;for(const b of $('elevation-locations').querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===button));
        const anchorText=(label,anchor,metres)=>`${label}：${anchor?`原始點 ${anchor.source_point_index+1} · ${(metres/1000).toFixed(3)} km · ${anchor.elevation_m} m`:'未知'}`;
        $('elevation-selection').textContent=`${elevationPointLabel(row)} · ${elevationRangeLabel(row)} · 海拔未知\n${anchorText('前',row.left_anchor,row.affected_profile_horizontal_range_m[0])}\n${anchorText('後',row.right_anchor,row.affected_profile_horizontal_range_m[1])}`;
        if($('profile-layer').value!=='original'){$('profile-layer').value='original';if(state.route)profile(state.route);}else paintElevationLocation();
      });li.append(button);$('elevation-locations').append(li);
    }
    $('elevation-page-status').textContent=`共 ${summary.missing_points.toLocaleString()} 點 · ${summary.total_runs.toLocaleString()} 處${summary.total_runs?`｜${page.first_ordinal}–${page.first_ordinal+page.rows.length-1}`:''}`;
    $('elevation-prev').disabled=index===0;$('elevation-next').disabled=!page.next;
  }catch(error){if(current())$('elevation-page-status').textContent=error.name==='AbortError'?'已暫停':'定位未完成，請重新展開。';}
  finally{if(current()){$('elevation-locator').setAttribute('aria-busy','false');elevationScan=null;}}
}
$('elevation-locator').addEventListener('toggle',()=>{if($('elevation-locator').open)loadElevationPage();else{elevationScan?.abort();elevationScan=null;$('elevation-locator').setAttribute('aria-busy','false');}});
$('elevation-prev').addEventListener('click',()=>loadElevationPage(elevationPage-1));
$('elevation-next').addEventListener('click',()=>loadElevationPage(elevationPage+1));

function routeDurationDistance(){
  // A confirmed group controls input presentation even when the uploaded GPX
  // is only associated context. It never gains original-source authority.
  const upload=state.courseUpload,context=state.courseContext;
  const selectedGroup=upload&&upload.gpx===state.gpx&&context?.uploadedSha256===upload.sha256?context.source:null;
  return durationDistanceForSelection(state.source||selectedGroup,state.route);
}
function synchronizeRouteDurationWidths(){const options={distanceM:routeDurationDistance(),routeIdentity:serviceRouteRevision};timeInputEditor($('target'))?.setRouteDistance(options);for(const cp of $('cp-list').children)timeInputEditor(cp.querySelector('.cp-cutoff'))?.setRouteDistance(options);}
function renderRoute(route) {
  state.route=route;synchronizeRouteDurationWidths();$('distance-label').textContent=route.blocked?'原始水平里程':'配速計算里程';
  $('route-ready').hidden=route.blocked; $('route-empty').hidden=!route.blocked;
  const status=routeStatus(route);$('route-state').textContent=status.label;
  $('route-state').className=`status-pill ${status.tone}`;
  $('distance').textContent=`${(route.distance_m/1000).toFixed(3)} km`;
  $('ascent').textContent=route.ascent_m===null?'未知':`${Math.round(route.ascent_m)} m`;
  $('descent').textContent=route.descent_m===null?'未知':`${Math.round(route.descent_m)} m`;
  profile(route); notices($('quality'),route.quality);
  busy(false);
  if(route.blocked) feedback('路線待處理，暫不可計算。','error');
  else if(!route.elevation_complete) feedback('海拔缺漏，請先定位缺點。','warning');
  else if(route.quality.some(q=>q.code==='grade_out_of_domain')) feedback('部分坡段超出跑步參考範圍，需先核對。','warning');
  else feedback('路線已讀取。');
}
function clearRouteDisplay(status='等待路線') {
  clearDetails();
  $('route-ready').hidden=true; $('route-empty').hidden=false; $('route-state').textContent=status; $('route-state').className='status-pill';
  for(const id of ['distance','ascent','descent']) $(id).textContent='—';
  $('profile').replaceChildren();notices($('quality'),[]);refreshCatalogRouteSelection();
}
// A candidate owns only transient work until raw admission has succeeded. The
// accepted route, source, checkpoint nodes, inputs and results stay in place.
function beginRouteImport(controller,kind) {
  stopRequest({preserveGoalInputRevision:true,preserveAcceptedResults:true});
  const owner={controller,token:state.token};pendingRouteImport=owner;
  state.request=controller;state.requestKind=kind;routeRetrySource=null;$('route-retry').hidden=true;
  if(!state.route)clearRouteDisplay('正在讀取');
  busy(true);return owner;
}
function currentRouteImport(owner){return !!owner&&pendingRouteImport===owner&&owner.token===state.token&&state.request===owner.controller&&!owner.controller.signal.aborted;}
function routeImportFailure(error,name,source=null) {
  $('gpx-file').value='';routeRetrySource=source;
  if(!state.route){clearRouteDisplay('無法讀取');$('route-state').className='status-pill error';}
  $('route-retry').hidden=!source||source.transport==='user_upload_only';
  if(error.name!=='AbortError')feedback(`無法導入「${name}」：${error.message}${state.route?' 目前路線與結果已保留。':source?.transport==='user_upload_only'?' 請重新選擇原始 GPX 檔案。':''}`,'error');
}
async function loadBytes(bytes, name, source=null, drawnProvenance=null, preparedFile=null) {if(stationClockBarrier)throw new Error('完整方案正在套用。');
  if(preparedFile&&(bytes!==null||source||drawnProvenance||!Object.isFrozen(preparedFile)||Object.keys(preparedFile).sort().join(',')!=='byteLength,gpx_b64,sha256'))throw new Error('檔案核對資料無法使用。');
  const sourceBytes=preparedFile?preparedFile.byteLength:bytes.length;
  const controller=new AbortController(),owner=beginRouteImport(controller,'inspect'),token=owner.token;
  let committing=false;
  feedback('正在讀取路線與檢查資料品質…','busy');
  try {
    if(sourceBytes>MAX_BYTES) throw new Error('GPX 超過 5 MiB，請使用較精簡的路線檔案。');
    if(drawnProvenance){
      const p=drawnProvenance;
      if(source||p.kind!=='drawn_unsnapped'||typeof p.sha256!=='string'||! /^[a-f0-9]{64}$/.test(p.sha256)||!Number.isSafeInteger(p.point_count)||p.point_count<2||p.point_count>50000||p.routing!=='unverified_unsnapped'||p.elevation!=='unknown'||p.navigation!=='unverified')throw new Error('自畫路線核對資料不一致，請重新檢查草稿。');
      drawnProvenance=Object.freeze({kind:p.kind,sha256:p.sha256,point_count:p.point_count,routing:p.routing,elevation:p.elevation,navigation:p.navigation});
      bytes=Uint8Array.from(bytes);
      const hash=await browserSha256(bytes);if(!currentRouteImport(owner))return;
      if(hash!==drawnProvenance.sha256)throw new Error('自畫路線與已檢查的草稿不一致，請重新檢查。');
    }
    const gpx=preparedFile?preparedFile.gpx_b64:base64(bytes);
    let uploadIdentity=null,candidateSource=source;
    if(!source&&!drawnProvenance&&sourceIdentityIndex){
      let match=null;try{const hash=preparedFile?preparedFile.sha256:await browserSha256(bytes);if(!currentRouteImport(owner))return;match=classifyUploadWithOptionalSources(sourceIdentityIndex,uploadOnlyIdentityIndex,hash,sourceBytes);}catch{if(!currentRouteImport(owner))return;}
      if(match){const choice=match.status==='unique'?match.choices[0]:null;uploadIdentity=Object.freeze({match,gpx,filename:name,selectedChoice:choice?.key??null,selection:choice?'automatic_unique':null,ignored:false});if(choice)candidateSource=sourceForExactChoice(choice);}
    }
    const route=await api('/api/inspect',{gpx_b64:gpx},controller);
    if(!currentRouteImport(owner))return;
    if(!route||typeof route!=='object'||!Number.isFinite(route.distance_m)||route.distance_m<0||!Array.isArray(route.quality)||route.quality.some(q=>!q||typeof q!=='object')||typeof route.blocked!=='boolean'||typeof route.elevation_complete!=='boolean')throw new Error('GPX 路線檢查結果格式不一致。');
    if(preparedFile&&route.route_sha256!==preparedFile.sha256)throw new Error('GPX 檢查結果與上傳原檔不一致。');
    if(uploadIdentity?.match&&route.route_sha256!==uploadIdentity.match.sha256)throw new Error('GPX 檢查結果與上傳原檔不一致。');
    if(drawnProvenance&&route.route_sha256!==drawnProvenance.sha256)throw new Error('自畫路線檢查結果與草稿不一致。');
    if(drawnProvenance&&(route.source_points!==drawnProvenance.point_count||route.segment_count!==1||route.elevation_complete!==false||route.ascent_m!==null||route.descent_m!==null))throw new Error('自畫路線幾何資料與草稿不一致。');
    // Optional detail/runtime failures still admit an inspected route; a raw
    // admission rejection must never replace the previously accepted target.
    let details=null,detailsError=null;state.requestKind='details';
    try{details=await api('/api/details',detailsPayload(gpx,candidateSource),controller);}
    catch(error){if(!currentRouteImport(owner))return;if(error.admissionRejected||error.name==='AbortError')throw error;detailsError=error;}
    if(!currentRouteImport(owner))return;
    if(details)validateOriginalDetails(details,route.route_sha256,candidateSource);
    if(drawnProvenance&&details&&(!details.canonical_geometry||['route_sha256','geometry_sha256','distance_m','horizontal_distance_m','elevation_complete','ascent_m','descent_m','blocked','geometry_version','source_points','segment_count'].some(key=>details.canonical_geometry[key]!==route[key])||details.summary.point_count!==drawnProvenance.point_count))throw new Error('自畫路線兩次檢查的幾何資料不一致。');
    committing=true;pendingRouteImport=null;
    state.originalFileName=source?'':(typeof name==='string'?name:'');
    setSource(candidateSource,name,{uploadIdentity});state.drawnProvenance=drawnProvenance;
    if(drawnProvenance){$('selected-edition').textContent='地圖自畫';$('selected-source').textContent='未沿道路校正 · 海拔未知 · 非導航資料';}
    invalidate(false);state.route=null;state.gpx=gpx;$('cp-list').replaceChildren();state.cpCount=0;clearRouteDisplay('正在讀取');
    $('file-name').textContent=name;$('gpx-file').value='';renderRoute(route);
    if(!state.source&&!drawnProvenance&&(!state.uploadIdentity||state.uploadIdentity.match.status==='unmatched')){state.courseUpload=Object.freeze({gpx,sha256:route.route_sha256,bytes:sourceBytes,filename:name,fingerprint:null,fingerprintStatus:'unavailable',match:null,ignored:false});renderUploadedCourseContext();}
    applyOfficialCheckpoints();busy(true);$('route-details').hidden=false;
    if(detailsError)showOptionalDetailsFailure(detailsError);
    else {
      installOriginalDetails(details);if(route.blocked||!route.elevation_complete)await prepareRepair(controller,token);if(token!==state.token)return;
      const status=routeStatus(route);feedback(status.tone==='neutral'?'':status.tone==='error'?'路線待處理，暫不可計算。':!route.elevation_complete?'海拔缺漏，請先定位缺點。':'部分坡段超出跑步參考範圍，需先核對。',status.tone==='neutral'?'':status.tone);
    }
  } catch(error) {
    if(token!==state.token)return;
    if(committing){state.gpx=null;state.route=null;$('cp-list').replaceChildren();state.cpCount=0;clearRouteDisplay('無法讀取');$('route-state').className='status-pill error';}
    routeImportFailure(error,name,source);
  } finally {if(token===state.token){if(pendingRouteImport===owner)pendingRouteImport=null;state.request=null;state.requestKind=null;busy(false);}}
}
$('gpx-file').addEventListener('change',async(event)=>{
  const file=event.target.files[0];if(!file)return;
  const controller=new AbortController();let owner=null;
  try{
    const pending=readGpxFile(file,{signal:controller.signal,replaceRead:true,beforeRead:()=>{
      owner=beginRouteImport(controller,'file-read');feedback('正在讀取與核對 GPX 檔案…','busy');if(document.activeElement===event.target)focusRouteHeading();
    }});
    const prepared=await pending;if(!currentRouteImport(owner))return;
    await loadBytes(null,file.name,null,null,prepared);
  }catch(error){
    if(!owner){event.target.value='';if(error.name!=='AbortError')feedback(gpxAcquisitionMessage(error),'error');return;}
    if(!currentRouteImport(owner))return;
    if(error.name!=='AbortError')routeImportFailure(Object.assign(new Error(gpxAcquisitionMessage(error)),{name:error.name}),file.name);
  }finally{if(state.request===controller){if(pendingRouteImport===owner)pendingRouteImport=null;state.request=null;state.requestKind=null;busy(false);}}
});
$('example').addEventListener('click',()=>{
  const pts=[];for(let i=0;i<=20;i++){const ele=100+70*Math.sin(i*Math.PI/20)+30*Math.sin(i*Math.PI/10);pts.push(`<trkpt lat="25" lon="${121+i*.005}"><ele>${ele.toFixed(5)}</ele></trkpt>`);}
  const text=`<gpx version="1.1" creator="Trail Planner synthetic example" xmlns="http://www.topografix.com/GPX/1/1"><trk><trkseg>${pts.join('')}</trkseg></trk></gpx>`;
  if(document.activeElement===$('example'))focusRouteHeading();$('gpx-file').value='';loadBytes(new TextEncoder().encode(text),'合成範例：10 公里起伏路線（非真實賽事）');
});
$('reset').addEventListener('click',()=>{
  stopRequest();routeRetrySource=null;transport.dispose();state.originalFileName='';state.gpx=null;state.route=null;invalidate(false);$('gpx-file').value='';$('cp-list').replaceChildren();state.cpCount=0;
  $('file-name').textContent='尚未選擇路線。';setSource(null);$('route-retry').hidden=true;clearRouteDisplay();feedback('');busy(false);
});
function focusAfterGlobalCancel(kind){
  const preferred=kind==='quality_inspect'?'source-quality-check':kind==='drawing-inspect'?'drawing-check':kind?.startsWith('manual_pace_')?'manual-pace-preview':kind?.startsWith('repair')?'repair-check':kind==='details-retry'?'details-retry':'calculate';
  for(const id of [...new Set([preferred,'calculate','gpx-file'])]){const target=$(id);if(!target||target.disabled||target.closest('[hidden]'))continue;for(let parent=target.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;if(!target.getClientRects().length)continue;target.focus({preventScroll:true});return;}
}
$('cancel').addEventListener('click',()=>{
  const restoreFocus=document.activeElement===$('cancel'),canceledKind=state.requestKind;
  try{
  if(stationClockBarrier)return;
  if(pendingRouteImport){stopRequest({preserveGoalInputRevision:true,preserveAcceptedResults:true});$('gpx-file').value='';if(!state.route){clearRouteDisplay('已取消讀取');$('file-name').textContent='讀取已取消，請重新選擇 GPX，也可重選同一個檔案。';}feedback(state.route?'已取消導入，目前路線與結果已保留。':'已取消導入。可重新選擇賽事或重試。');return;}
  const stationClockPending=stationClockUI?.isBusy();stationClockUI?.cancel();
  if(stationClockPending&&!state.requestKind||['station_clock_restore','station_clock_manual','station_clock_forward'].includes(state.requestKind)){stopRequest({preserveGoalInputRevision:true});stationClockUI?.refresh();feedback('已取消配速／停留操作，目前完整方案保持不變。');return;}
  if(cancelDetailsRetry())return;
  if(state.requestKind==='quality_inspect'){routeQualityUI?.cancel();state.request=null;state.requestKind=null;busy(false);return;}
  if(state.requestKind==='drawing-inspect'){drawingUI?.cancelWork('草稿檢查已取消。原工作台仍保留。');return;}
  if(state.requestKind?.startsWith('manual_pace_')){manualPaceUI?.cancel();return;}
  if(state.requestKind?.startsWith('repair')){stopRequest({preserveGoalInputRevision:true,preserveAcceptedResults:true});manualPaceUI?.refresh();feedback('已取消路線處理，目前路線與結果保持不變。');return;}
  const wasInspect=['inspect','download','file-read'].includes(state.requestKind);stopRequest();invalidate(false);
  if(wasInspect){state.gpx=null;state.route=null;$('gpx-file').value='';clearRouteDisplay('已取消讀取');$('file-name').textContent='讀取已取消，請重新選擇 GPX，也可重選同一個檔案。';feedback('已取消導入。可重新選擇賽事或重試。');$('route-retry').hidden=!state.source||state.source.transport==='user_upload_only';}
  else {if(!state.details&&state.route){state.detailStatus='原始軌跡讀取已取消，請重新導入';profile(state.route);$('detail-status').hidden=false;$('detail-status').textContent='詳細資料讀取已取消。重新導入或選擇檔案可重試。';}feedback('已取消這次計算。確認設定後可以重新產生。');}
  busy(false);
  }finally{if(restoreFocus&&!stationClockBarrier)focusAfterGlobalCancel(canceledKind);}
});
$('add-cp').addEventListener('click',()=>{
  if(!state.route||state.route.blocked||state.request)return;
  cancelCourseMappingVerification();
  if($('cp-list').children.length>=100){feedback('最多 100 個補給站。','error');return;}
  const cp=$('cp-template').content.firstElementChild.cloneNode(true);state.cpCount++;prepareCheckpointRow(cp);
  cp.querySelector('legend').textContent=`補給站 ${state.cpCount}`;cp.querySelector('.cp-name').value=`補給站 ${state.cpCount}`;
  const existing=[...$('cp-list').querySelectorAll('.cp-distance')].map(i=>Number(i.value));const last=existing.length?existing.at(-1)*1000:0;
  cp.querySelector('.cp-distance').value=((last+state.route.distance_m)/2000).toFixed(3);
  cp.querySelector('.remove-cp').addEventListener('click',()=>{stopRequest();removeCheckpointRow(cp);});
  $('cp-list').append(cp);invalidate();$('checkpoints-panel').open=true;cp.querySelector('.cp-distance').focus();
});
function removeCheckpointRow(cp){
 if(cp.parentElement!==$('cp-list'))return;
 const restoreFocus=document.activeElement?.closest?.('.cp-item')===cp;
 const rows=[...$('cp-list').children],index=rows.indexOf(cp),nearby=[...rows.slice(index+1),...rows.slice(0,index).reverse()];
 cp.remove();invalidate();
 if(restoreFocus){for(const target of [...nearby.flatMap(row=>[row.querySelector('.cp-distance'),row.querySelector('.remove-cp')]),$('add-cp'),$('checkpoints-panel').querySelector('summary')]){if(!target?.isConnected||target.disabled||target.closest('[hidden]')||!target.getClientRects().length)continue;target.focus({preventScroll:true});break;}}
}
function cutoffKindKnown(kind){return ['arrival','departure'].includes(kind);}
// Row identity and user-entered values belong to this route, not to a repair pass.
function checkpointPositionsPending(){return [...$('cp-list').children].some(cp=>cp.dataset.locationPending==='true');}
function refreshCheckpointLocations(on=!!state.request){
  const pending=[...$('cp-list').children].filter(cp=>cp.dataset.locationPending==='true');
  $('cp-position-note').hidden=!pending.length;
  $('cp-position-note').textContent=pending.length?`${pending.length} 站位置待核對`:'';
  for(const cp of $('cp-list').children){const button=cp.querySelector('.confirm-cp-location');if(button)button.disabled=on||!state.route||state.route.blocked;}
  $('download-enriched').disabled=on||!state.details||!state.route||state.route.blocked||!!pending.length;
}
function requireCheckpointLocations(){
  const pending=[...$('cp-list').children].filter(cp=>cp.dataset.locationPending==='true');
  if(pending.length)throw Object.assign(new Error('請逐站確認補站里程，再計算或匯出。'),{code:'checkpoint_location_pending',fields:pending.map(cp=>cp.querySelector('.cp-distance'))});
}
function prepareCheckpointRow(cp){
  cp.dataset.cpId=`checkpoint-${++state.cpIdentity}`;cp.dataset.stopRevision='0';cp.querySelector('.cp-stop').step='any';
  const rowId=cp.dataset.cpId,rowGpx=state.gpx;
  const stopOwner=checkpointStopSourceOwner,stopField=cp.querySelector('.cp-stop'),noStop=document.createElement('button');
  stopField.setAttribute('placeholder','待填，或選不停留');noStop.type='button';noStop.className='cp-no-stop text-button';noStop.textContent='不停留';stopField.parentElement.parentElement.append(noStop);
  const isCurrent=()=>cp.parentElement===$('cp-list')&&cp.dataset.cpId===rowId&&checkpointStopSourceOwner===stopOwner;
  const isEnabled=()=>{const parsed=parseCpStopValue(stopField.value);return isCurrent()&&!!state.route&&!state.route.blocked&&!courseWorkflowBusy()&&!(parsed.status==='known'&&parsed.seconds===0);};
  checkpointNoStopActions.set(cp,{isCurrent,isEnabled});
  noStop.addEventListener('click',()=>{
    if(!isEnabled())return;
    stopField.value='0';stopField.dispatchEvent(new Event('input',{bubbles:true}));
    if(isCurrent())stopField.focus({preventScroll:true});
  });
  bindSegmentedTimeInput(cp.querySelector('.cp-cutoff'),{required:false,maxSeconds:604800}).setRouteDistance({distanceM:routeDurationDistance(),routeIdentity:serviceRouteRevision});
  const note=document.createElement('p');note.className='cp-location-note status-pill warning';note.hidden=true;
  const button=document.createElement('button');button.type='button';button.className='confirm-cp-location secondary';button.textContent='確認里程';button.hidden=true;
  button.addEventListener('click',()=>{
    if(!isCurrent()||state.gpx!==rowGpx||!state.route||state.route.blocked||state.request||cp.dataset.locationPending!=='true')return;
    try{const field=cp.querySelector('.cp-distance'),distance=number(field,'補給站里程')*1000;if(distance<=1e-6||state.route.distance_m-distance<=1e-6)throw Object.assign(new Error('補站里程須位於目前路線的起終點之間。'),{fields:[field]});
      cp.dataset.locationPending='false';cp.dataset.locationReconfirmed='true';cp.querySelector('.cp-position-actions').hidden=true;note.hidden=true;button.hidden=true;cp.querySelector('.cp-location-help').hidden=true;invalidate(false);feedback(checkpointPositionsPending()?'此站里程已確認，請繼續確認其餘補站。':'所有補站里程已確認，可以重新計算。');
    }catch(error){feedback(error.message,'error');goalErrors.show(error,{fields:error.fields});}
  });
  const help=document.createElement('details');help.className='cp-location-help';help.hidden=true;const summary=document.createElement('summary');summary.textContent='為什麼需核對？';const reason=document.createElement('p');reason.className='hint';reason.textContent='套用或復原可能改變里程。其他設定已保留，請核對目前路線上的位置。';help.append(summary,reason);
  const actions=document.createElement('div');actions.className='cp-position-actions';actions.hidden=true;actions.append(note,button,help);cp.append(actions);
}
function markCheckpointLocationsPending(){
  officialPositionGeneration++;serviceMappingRevision++;serviceStopUI?.invalidateMapping();
  for(const cp of $('cp-list').children){
    // Keep origin and edit flags, but never reuse an old route-point index.
    if(cp.dataset.mapping)cp.dataset.previousMapping=cp.dataset.mapping;
    delete cp.dataset.mapping;delete cp.dataset.mappingRouteSha;cp.dataset.locationPending='true';cp.dataset.locationReconfirmed='false';
    const select=cp.querySelector('.official-pass');if(select)select.disabled=true;
    cp.querySelector('.cp-position-actions').hidden=false;const note=cp.querySelector('.cp-location-note');note.textContent='位置待核對';note.hidden=false;cp.querySelector('.confirm-cp-location').hidden=false;cp.querySelector('.cp-location-help').hidden=false;
  }
  if($('cp-list').children.length)$('checkpoints-panel').open=true;
  refreshCheckpointLocations();
}
function settingsEdited(event){
  if(stationClockBarrier)return;
  cancelCourseMappingVerification();
  if(event.target.id==='gpx-file'||event.target.closest?.('#service-stops')||event.target.closest?.('.official-waypoint-choice')||event.target.closest?.('.official-coordinate-choice'))return;
  if(event.target.id==='start-time')updateOfficialCutoffs($('start-time').value);
  const cp=event.target.closest?.('.cp-item');if(cp&&event.target.classList?.contains('cp-stop'))cp.dataset.stopRevision=String(Number(cp.dataset.stopRevision||0)+1);if(cp&&(event.target.classList?.contains('cp-cutoff')||event.target.classList?.contains('cp-kind'))){const official=cp.dataset.official?JSON.parse(cp.dataset.official):null;const kindOnly=event.target.classList?.contains('cp-kind')&&!!official;if(kindOnly)cp.dataset.cutoffKindConfirmed=cutoffKindKnown(event.target.value)?'true':'false';else cp.dataset.cutoffEdited='true';const note=cp.querySelector('.official-cp-note');if(note)note.textContent=officialCpNote(official)+(kindOnly?' · 關門依據為自行確認':' · 已改用手動關門時間');}if(cp&&event.target.classList?.contains('cp-distance'))cp.dataset.positionEdited='true';
  if(state.requestKind){
    const wasImport=!!pendingRouteImport||['inspect','download','file-read'].includes(state.requestKind);
    stopRequest();
    if(wasImport){
      $('gpx-file').value='';invalidate(false);
      if(!state.route)clearRouteDisplay('讀取已取消');
      feedback(state.route?'讀取已取消；目前路線與修改已保留，請重新計算。':'讀取已取消，請重新選擇路線。');
      return;
    }
  }invalidate();
}
$('planner-form').addEventListener('input',settingsEdited);
$('checkpoints-panel').addEventListener('input',settingsEdited);
/** Route/CP export uses the same station validation without a goal-time assumption. */
function readCheckpointSettings(startInput=$('start-time'),startDateInput=null) {
  requireCheckpointLocations();
  const startClock=readTimeInput(startInput,'起跑時間');
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(startClock))throw Object.assign(new Error('請填有效的起跑時間。'),{fields:[startInput]});
  updateOfficialCutoffs();
  return [...$('cp-list').children].map(cp=>{
    const name=cp.querySelector('.cp-name').value.trim();if(!name)throw Object.assign(new Error('補給站名稱不能空白。'),{fields:[cp.querySelector('.cp-name')]});
    const cutoffField=cp.querySelector('.cp-cutoff');let cutoffText=cutoffField.value,absoluteCutoff=false;
    if(cp.dataset.official&&cp.dataset.cutoffEdited!=='true'){const official=JSON.parse(cp.dataset.official);if(official.cutoffLocal){absoluteCutoff=true;if(startDateInput&&startDateInput.value!==state.source?.raceDate)throw Object.assign(new Error('本次日期與官方賽日不同，無法套用絕對關門；請確認本次日期。'),{fields:[startDateInput]});try{cutoffText=clock(officialCutoffElapsed(state.source,official.cutoffLocal,startClock));}catch(error){if(error?.code==='official_cutoff_before_start')throw Object.assign(error,{fields:[startInput]});cutoffText='';}}}
    const kind=cp.querySelector('.cp-kind').value;if(cutoffText.trim()&&!cutoffKindKnown(kind)){const error=new Error(`${name}：請選擇到站或離站作為關門依據。`);error.code='invalid_cutoff_kind';error.fields=[cp.querySelector('.cp-kind')];throw error;}
    let cutoffSeconds=null;
    if(cutoffText.trim()){
      // The visible official duration belongs to the active mode. Derive this
      // consumer's value from its own clock without replacing that display.
      if(absoluteCutoff){const checked=validateTimeParts(cutoffText.split(':'),{width:3,maxSeconds:604800});if(!checked.ok)throw Object.assign(new Error(`${name}的關門時間：${checked.message}`),{fields:[cutoffField]});cutoffSeconds=checked.seconds;}
      else cutoffSeconds=parseClock(cutoffText,`${name}的關門時間`,cutoffField);
    }
    return {name,distance_m:number(cp.querySelector('.cp-distance'),'補給站里程')*1000,stop_s:checkpointStopSeconds(cp.querySelector('.cp-stop')),
      cutoff_elapsed_s:cutoffSeconds,cutoff_kind:cutoffKindKnown(kind)?kind:'departure'};
  });
}
const HIKING_ALLOCATION='campbell2022-hiking-reference-v1';
function hikingSelected(){return $('allocation-model').value===HIKING_ALLOCATION;}
function refreshAllocationMode(){
 const hiking=hikingSelected();$('hiking-settings').hidden=!hiking;$('advanced').hidden=hiking;$('allocation-reference-summary').textContent=hiking?'輔助參考 · 全程徒步已選用':'輔助參考（選用）';
 const length=state.route?.horizontal_distance_m;$('hiking-coverage-note').hidden=!hiking||!Number.isFinite(length)||(length>=2824&&length<=17882);
}
$('allocation-model').addEventListener('change',()=>{if(stationClockBarrier)return;stopRequest();$('hiking-consent').checked=false;refreshAllocationMode();invalidate();});
function settings() {
  requireCheckpointLocations();
  if(!['running',HIKING_ALLOCATION].includes($('allocation-model').value))throw Object.assign(new Error('請選擇有效的分配方式。'),{fields:[$('allocation-model')]});
  const target=parseClock($('target').value,'目標完賽時間',$('target'));
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(readTimeInput($('start-time'),'起跑時間')))throw Object.assign(new Error('請填有效的起跑時間。'),{fields:[$('start-time')]});
  if(document.querySelectorAll('.compare-target:checked').length>2)throw new Error('比較目標最多加選 2 組。');
  const cps=readCheckpointSettings();
  if(hikingSelected()){
    if(!$('hiking-consent').checked)throw Object.assign(new Error('請確認採用全程步道徒步參考分配。'),{code:'hiking_consent_required',fields:[$('hiking-consent')]});
    return {allocation_model:HIKING_ALLOCATION,hiking_consent:true,target_elapsed_s:target,max_speed_m_s:$('hiking-max-speed').value.trim()?number($('hiking-max-speed'),'最高速度')/3.6:null,min_speed_m_s:$('hiking-min-speed').value.trim()?number($('hiking-min-speed'),'最低速度')/3.6:0,checkpoints:cps};
  }
  return {target_elapsed_s:target,fatigue_end_multiplier:Number($('fatigue').value),max_speed_m_s:number($('max-speed'),'最快移動速度')/3.6,min_speed_m_s:number($('min-speed'),'最低移動速度')/3.6,
    walk_uphill_grade:number($('walk-grade'),'徒步坡度門檻')/100,walk_max_speed_m_s:number($('walk-speed'),'徒步速度上限')/3.6,
    allow_flat_missing_elevation:$('flat-consent').checked,allow_grade_clamp:$('clamp-consent').checked,checkpoints:cps};
}
function finishDeadlineFacts(source){
 const finish=source?.checkpoints?.find(cp=>cp.kind==='finish'),publishedClock=source?.finishCutoffLocal??finish?.cutoffLocal??null;
 const sourceClock=source?.finishCutoffStatus==='verified_absolute'?source.finishCutoffLocal:null;
 const recordClock=finish?.cutoffStatus==='official_valid'&&cutoffKindKnown(finish.cutoffKind)?finish.cutoffLocal:null;
 const conflict=!!sourceClock&&!!recordClock&&sourceClock!==recordClock;
 const activeClock=conflict?null:sourceClock||recordClock||null;
 const unconfirmed=conflict||!!publishedClock&&!activeClock||['finish_banner_conflict','conflict','semantics_unconfirmed'].includes(source?.finishCutoffStatus)||['finish_banner_conflict','conflict','semantics_unconfirmed'].includes(finish?.cutoffStatus);
 return {publishedClock,unconfirmed,activeClock:unconfirmed?null:activeClock,kind:unconfirmed||!activeClock?null:sourceClock?'arrival':finish.cutoffKind};
}
function getDeadlineContext(startClock,startDate){
 const source=state.source;const checkpoints=[...$('cp-list').children].map(cp=>{const official=cp.dataset.official?JSON.parse(cp.dataset.official):null;const useOfficial=!!official&&cp.dataset.cutoffEdited!=='true';const text=cp.querySelector('.cp-cutoff').value.trim();return {name:cp.querySelector('.cp-name').value.trim(),distance_m:Number(cp.querySelector('.cp-distance').value)*1000,kind:useOfficial?(cp.dataset.cutoffKindConfirmed==='true'?cp.querySelector('.cp-kind').value:cutoffKindKnown(official.cutoffKind)?official.cutoffKind:null):cp.querySelector('.cp-kind').value,cutoffLocal:useOfficial?official.cutoffLocal:null,cutoffElapsed:useOfficial?null:text?parseClock(text,'關門時間',cp.querySelector('.cp-cutoff')):null,needsConfirmation:useOfficial&&(['edition_year_mismatch','finish_banner_conflict','conflict','semantics_unconfirmed'].includes(official.cutoffStatus))};});
 const finish=finishDeadlineFacts(source);return {race:source,startClock,dateMismatch:!!(source?.raceDate&&startDate&&source.raceDate!==startDate),distance_m:state.route?.distance_m,checkpoints,finish:{kind:finish.kind,cutoffLocal:finish.activeClock,...(finish.unconfirmed?{publishedCutoffLocal:finish.publishedClock}:{}),cutoffElapsed:null,needsConfirmation:finish.unconfirmed}};
}
function goalDeadline(cp){return cp?checkpointDeadline(cp,getDeadlineContext(state.startTime)):{label:'—',status:'unknown'};}
function paceText(seconds){const n=Math.round(seconds);return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;}
function terrainRow(segment,includeCutoff=true){
  const row=document.createElement('tr'),shown=checkpointRowDisplay(segment),cp=segment.checkpoint;const values=[segment.label+(cp?` · ${cp.name}`:''),`${(segment.start_m/1000).toFixed(3)}–${(segment.end_m/1000).toFixed(3)} km`,`${formatMeters(segment.gain_m)} / ${formatMeters(segment.loss_m)}`,paceText(segment.pace_s_per_km),clock(shown.moving_s),clock(shown.stops_s),shown.arrival_elapsed_s,shown.departure_elapsed_s];
  if(includeCutoff){values.push(cp?goalDeadline(cp).label:'—');}
  for(const [i,text] of values.entries()){const td=document.createElement('td');td.textContent=text;td.dataset.label=['地形／段尾站點','里程／段長','上升／下降','移動配速 /km','區間移動','停留','到站','離站','關門餘裕'][i];if(i===6||i===7)appendCheckpointTime(td,text,state.startTime);if(i===1){const length=segment.end_m-segment.start_m,detail=document.createElement('small');detail.className='segment-length';detail.textContent=!Number.isFinite(length)||length<0?'段長未知':length>0&&length<1?'段長 <1 m':length<1000?`段長 ${Math.round(length)} m`:`段長 ${(length/1000).toFixed(3)} km`;td.append(detail);}if(i===8&&cp&&goalDeadline(cp).status==='missed')td.className='missed';row.append(td);}return row;
}
function terrainHead(){const tr=document.createElement('tr');for(const label of ['地形／段尾站點','里程／段長','上升／下降','移動配速 /km','區間移動','停留','到站','離站']){const th=document.createElement('th');th.scope='col';th.textContent=label;tr.append(th);}return tr;}
function selectResultCheckpoint(index){state.selectedCheckpoint=index;const selector=$('profile-cp-select');if(selector.children[index]){selector.value=String(index);selector.onchange?.();}markSelectedStation($('plan-station-rows'),index);markSelectedStation($('prediction-table'),index);}
function displayOptions(){return {level:state.terrainLevel,selectedIndex:state.selectedCheckpoint,onSelect:selectResultCheckpoint};}
function renderTerrainOverview(){const prediction=state.profilePrediction?.prediction,active=prediction?.status==='hybrid_scenario_partial'?null:prediction||state.plan;$('terrain-controls').hidden=!active;if(!active){$('terrain-content').replaceChildren();$('terrain-count').textContent='';return;}const rows=displayTerrain(active,state.terrainLevel);$('terrain-count').textContent=`${rows.length} 段`;$('terrain-policy').textContent=terrainPolicyText(state.terrainLevel);renderTerrainList($('terrain-content'),rows,{startTime:state.profilePrediction?.start_local_time||state.startTime,deadlineContext:state.profilePrediction?.deadline_context||getDeadlineContext(state.startTime),checkpoints:active.checkpoints});}
function changeTerrainLevel(level,{reveal=true}={}){if(!['raw','detailed','standard','overview'].includes(level))return;state.terrainLevel=level;for(const input of document.querySelectorAll('input[name="terrain-level"]'))input.checked=input.value===level;for(const id of ['manual-terrain-level','plan-terrain-level'])$(id).value=level;if(reveal)$('terrain-view').open=true;renderTerrainOverview();if(state.plan)renderPlanTable(state.plan);manualPaceUI?.refresh();if(state.profilePrediction&&state.profilePrediction.prediction.status!=='hybrid_scenario_partial'){const p=state.profilePrediction;renderPredictionTable($('prediction-table'),p.prediction,p.start_local_time,p.deadline_context,displayOptions());}}
for(const input of document.querySelectorAll('input[name="terrain-level"]')){input.addEventListener('click',()=>changeTerrainLevel(input.value));input.addEventListener('change',()=>changeTerrainLevel(input.value));}
// Keep display aggregation within reach of the section it controls.
function appendTerrainLevelSelect(container,id){
  const label=document.createElement('label');label.className='terrain-level-select';label.textContent='地形合併';
  const select=document.createElement('select');select.id=id;
  for(const [value,text] of [['raw','原始分段'],['detailed','詳細'],['standard','標準'],['overview','概覽']]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}
  select.value=state.terrainLevel;select.addEventListener('change',()=>changeTerrainLevel(select.value,{reveal:false}));label.append(select);container.append(label);
}
appendTerrainLevelSelect($('manual-pace-section').closest('.field-grid'),'manual-terrain-level');
appendTerrainLevelSelect($('table-view').closest('.table-toolbar'),'plan-terrain-level');
function renderPlanTable(plan){
  const {summary}=planDisplay(plan),cpView=summary.mode==='checkpoints'&&state.tableView==='checkpoints';
  $('table-view').value=cpView?'checkpoints':'terrain';$('table-view').querySelector('option[value="checkpoints"]').disabled=summary.mode!=='checkpoints';
  $('plan-table-title').textContent=cpView?'補站配速':'地形分段';$('table-view-note').textContent='移動配速依實際區間移動時間與距離計算；停留另列。';
  $('plan-rows').replaceChildren();$('plan-table-head').replaceChildren();$('plan-station-rows').hidden=!cpView;$('plan-terrain-view').hidden=cpView;
  if(cpView)renderCheckpointSchedule($('plan-station-rows'),plan,{startTime:state.startTime,deadlineContext:getDeadlineContext(state.startTime),expanded:state.expandedGroups,...displayOptions()});
  else renderTerrainList($('plan-terrain-rows'),displayTerrain(plan,state.terrainLevel),{startTime:state.startTime,deadlineContext:getDeadlineContext(state.startTime),checkpoints:plan.checkpoints});
}

function renderPlan(plan) {
  hikingReferenceProvenance(plan);
  capturePlanCatalogDate(plan);
  const hiking=plan.model_version==='campbell2022-hiking-reference-goal-v1';
  const stationClock=plan.purpose==='station_clock_comparison',clockOnly=stationClock||plan.purpose==='manual_pace_clock_preview';
  state.plan=plan;$('plan-result').hidden=false;$('export').disabled=false;
  $('result-target').textContent=clock(plan.display_target_elapsed_s);
  $('result-target-label').textContent=clockOnly?'重算完賽時間':'完賽目標';
  $('manual-initial-target').hidden=!clockOnly;
  $('manual-initial-target').textContent=clockOnly?`原目標 ${clock(plan.initial_target_elapsed_s)}`:'';
  const shown=planDisplay(plan).summary.totals.display;
  $('result-moving').textContent=clock(shown.moving_s);$('result-stops').textContent=clock(shown.stops_s);
  notices($('plan-warnings'),plan.warnings);$('plan-rows').replaceChildren();
  renderPlanTable(plan);renderTerrainOverview();
  $('result-mode-status').textContent=(hiking?'徒步參考分配 · ':'')+(stationClock?'僅計時比較 · 未估疲勞連動':clockOnly?'時間重算 · 未估疲勞連動':'目標分配 · 能力未驗證');
  $('manual-pace-on-a').hidden=!stationClock;if(stationClock)$('manual-pace-on-a').textContent='人工配速沿用目前已套用停留；還原上次方案會一起還原該次配速與停留。';
  $('export').textContent=stationClock?'保存停留計時方案':originalPlanExportLabel;
  $('manual-pace-limit').hidden=plan.purpose==='manual_pace_clock_preview';
  $('assumptions').replaceChildren();$('versions').replaceChildren();
  const budget=document.createElement('li');budget.textContent=clockOnly?`原目標 ${clock(plan.initial_target_elapsed_s)}；重算 ${clock(plan.target_elapsed_s)}。`:`目標 ${clock(plan.target_elapsed_s)}＝移動 ${clock(plan.moving_s)}＋停留 ${clock(plan.stops_s)}。`;$('assumptions').append(budget);
  const basis=document.createElement('li');basis.textContent=stationClock?'未鎖定區間沿用原始移動曲線；停留調整保留目前配速與鎖定。':clockOnly?'未鎖定區間沿用初始移動配速。':hiking?'Campbell 2022 全程徒步參考；沒有加入跑步衰退或個人能力校準。':`最快速度 ${Number((plan.input.max_speed_m_s*3.6).toFixed(1))} km/h；後程設定不代表實際首尾配速比。`;$('assumptions').append(basis);
  if(hiking)for(const assumption of plan.assumptions){const li=document.createElement('li');li.textContent=assumption;$('assumptions').append(li);}
  if(stationClock&&!hiking)for(const assumption of plan.station_clock.movingBasis.assumptions){const li=document.createElement('li');li.textContent=assumption;$('assumptions').append(li);}
  renderPaceChart(plan);profile(plan.route,plan.checkpoints);renderComparisons();
  $('time-mode-note').textContent=`起跑 ${state.startTime}。到離站同時顯示當地時刻與累計；+N 天表示跨日。`;
  if(state.source){for(const [label,value] of [['賽事來源',state.source.name+' · '+state.source.edition],['GPX 查核日期',state.source.verifiedAt.slice(0,10)]]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;$('versions').append(dt,dd);}}
  feedback(plan.warnings.length?'計畫已產生，有站點可能超過關門。':stationClock?'停留計時方案已更新。':plan.purpose==='manual_pace_clock_preview'?'人工配速時間表已更新。':'配速計畫已產生。',plan.warnings.length?'error':'');
  // A display-only redraw of the same plan cannot re-authorize silent edits.
  if(!conditionalAcceptedSignatures.has(plan))conditionalAcceptedSignatures.set(plan,goalRawSignature());
  if(!conditionalPlanIds.has(plan))conditionalPlanIds.set(plan,`app-plan-${++conditionalPlanSequence}`);
  if(!stationClockAcceptedContents.has(plan))stationClockAcceptedContents.set(plan,clockContentKey(plan));
  if(!stationClockAcceptedSources.has(plan))stationClockAcceptedSources.set(plan,stationClockSourceIdentity());
  manualPaceUI?.refresh();workoutUI?.refresh();stationClockUI?.refresh();
}
// Bind validated request data and live canonical raw fields before core work.
// Service-template/selection controls are unapplied drafts, just as in settingsEdited.
// Applying them writes canonical CP fields and invalidates through the normal path.
function goalRawSignature(){
  const fields=[...$('planner-form').querySelectorAll('input,select,textarea'),...$('checkpoints-panel').querySelectorAll('input,select,textarea')].filter(field=>!field.closest('#service-stops'));
  return JSON.stringify({fields:fields.map(f=>[f.id,f.className,f.value,f.checked===true]),checkpoints:[...$('cp-list').children].map(cp=>Object.entries(cp.dataset).sort(([a],[b])=>a.localeCompare(b))),...activeCatalogDateFields()});
}
function captureGoalRequest(input=null){
  if(stationClockBarrier)return null;
  try{
    if($('goal-mode').getAttribute('aria-pressed')!=='true'||!state.route||state.route.blocked||!state.gpx)return null;
    if(hikingSelected()){const snapshot={mode:'goal',route:{route_sha256:state.route.route_sha256,geometry_sha256:state.route.geometry_sha256},revision:goalInputRevision,targetText:$('target').value,settings:input??settings()};return {snapshot,gpx_b64:calculationGpx(),rawSignature:goalRawSignature()};}
    const snapshot=captureGoalSnapshot({mode:'goal',route:{route_sha256:state.route.route_sha256,geometry_sha256:state.route.geometry_sha256},revisions:{route:goalInputRevision,settings:goalInputRevision,checkpoints:goalInputRevision},targetText:$('target').value,settings:input??settings()});
    return snapshot?{snapshot,gpx_b64:calculationGpx(),rawSignature:goalRawSignature()}:null;
  }catch{return null;}
}
function rollbackGoalApplication(){
  const applied=goalApplication;goalApplication=null;if(!applied)return false;
  if(state.route!==applied.route||calculationGpx()!==applied.gpx||goalRawSignature()!==applied.rawSignature)return false;
  $('target').value=applied.before;return true;
}
async function calculateGoal(application=null){
  if(stationClockBarrier)return;
  if(!state.route||!state.gpx||state.route.blocked||state.request)return;
  cancelCourseMappingVerification();
  goalSuggestionUI?.clear();
  if(application){
    const live=captureGoalRequest();if(!sameGoalRequest(application.captured,live))return;
    const ready=prepareGoalTargetApplication(application.proposal,live.snapshot);if(ready.status!=='ready')return;
    const before=$('target').value;$('target').value=ready.targetText;
    goalApplication={before,route:state.route,gpx:calculationGpx(),rawSignature:goalRawSignature()};
  }
  let input;try{input=settings();}catch(error){rollbackGoalApplication();feedback(error.message,'error');goalErrors.show(error,{form:$('planner-form')});return;}
  invalidate(false);busy(true);feedback('正在分配移動時間並檢查速度與關門…','busy');const token=++state.token;const controller=new AbortController();state.request=controller;state.requestKind='plan';
  const captured=captureGoalRequest(input),gpx=calculationGpx(),dateOwner=captureCatalogDateOwner();let failedSuggestion=null;
  try{
    state.startTime=$('start-time').value;const plan=await api('/api/plan',{gpx_b64:gpx,settings:input},controller);if(token!==state.token)return;
    if(!catalogDateOwnerCurrent(dateOwner)||captured&&!sameGoalRequest(captured,captureGoalRequest())){rollbackGoalApplication();invalidate(false);feedback('設定或路線已變更，請重新計算。');return;}
    if(application){const candidate=application.proposal.candidate;const verified=validateGoalTargetCandidate(candidate,candidate.snapshot,{candidateKey:candidate.key,response:{ok:true,result:plan}});if(verified.status!=='proposal')throw Object.assign(new Error('重新計算未通過核對，請重新確認目標。'),{code:'suggestion_recalculation_mismatch',fieldIds:['target']});}
    const comparisons=[];const failures=[];const extra=[...document.querySelectorAll('.compare-target:checked')].map(c=>Number(c.value)).filter(t=>t!==input.target_elapsed_s);
    for(const target of extra){try{const alternate=await api('/api/plan',{gpx_b64:gpx,settings:{...input,target_elapsed_s:target}},controller);if(token!==state.token)return;comparisons.push(alternate);}catch(error){if(error.name==='AbortError'||token!==state.token)return;failures.push(`${clock(target)}：${error.message}`);}}
    if(token!==state.token)return;if(!catalogDateOwnerCurrent(dateOwner)||captured&&!sameGoalRequest(captured,captureGoalRequest())){rollbackGoalApplication();invalidate(false);feedback('設定或路線已變更，請重新計算。');return;}
    if(!planCatalogDates.has(plan))planCatalogDates.set(plan,dateOwner);state.comparisons=comparisons;renderPlan(plan);goalApplication=null;if(failures.length)feedback(`主計畫已產生；部分比較目標無法分配。${failures.join(' ')}`,'error');
  }catch(error){
    if(token!==state.token)return;
    const stale=captured&&!sameGoalRequest(captured,captureGoalRequest());const restored=rollbackGoalApplication();if(application||state.plan||stale)invalidate(false);
    if(stale){feedback('設定或路線已變更，請重新計算。');return;}
    if(error.name!=='AbortError'){if(hikingSelected()&&['infeasible_target','invalid_speed','invalid_speed_bounds'].includes(error.code))error.fieldIds=['target','hiking-max-speed','hiking-min-speed'];feedback(`${terrainErrorMessage(error)}${restored?' 已還原原目標。':''}`,'error');goalErrors.show(error,{form:$('planner-form')});if(!application&&captured)failedSuggestion={error,captured};}
  }finally{if(token===state.token){state.request=null;state.requestKind=null;busy(false);manualPaceUI?.refresh();}}
  // Advisory work owns no foreground state and is canceled by any new work.
  if(failedSuggestion&&!hikingSelected())void goalSuggestionUI?.offer(failedSuggestion.error,failedSuggestion.captured);
}
$('planner-form').addEventListener('submit',event=>{event.preventDefault();return calculateGoal();});
$('export').addEventListener('click',async()=>{
  if(stationClockBarrier||!state.plan)return;
  if(!acceptedGoalResultCurrent()){feedback('設定、路線或結果已改變，請重新計算後下載。','error');return;}
  if(state.plan.purpose==='station_clock_comparison'){try{const exported=await stationClockUI.export();downloadOwnedStationClock(exported.value,()=>stationClockUI.exportCurrent(exported.ticket));}catch(error){feedback(error.message,'error');}return;}
  const blob=new Blob([JSON.stringify({...state.plan,calculation_provenance:calculationProvenance(),original_gpx_sha256:(state.originalRoute||state.route).route_sha256,...(state.drawnProvenance?{drawn_route:state.drawnProvenance}:{}),...(state.source?{source_provenance:sourceSnapshot(state.source)}:{}),...(uploadedCourseContextSnapshot()?{course_context:uploadedCourseContextSnapshot()}:{}),display_start_local_time:state.startTime,deadline_context:getDeadlineContext(state.startTime),deadline_assessments:state.plan.checkpoints.map(cp=>({name:cp.name,...goalDeadline(cp)})),terrain_segments:buildTerrainSegments(state.plan),checkpoint_summary:buildCheckpointGroups(state.plan,buildTerrainSegments(state.plan)),gpx_detail_summary:state.details?.summary||null,checkpoint_provenance:[...$('cp-list').children].map(cp=>({imported_source_claims:cp.dataset.importedSourceClaims?JSON.parse(cp.dataset.importedSourceClaims):null,course_context_fact:cp.dataset.courseContextFact?JSON.parse(cp.dataset.courseContextFact):null,official:cp.dataset.official?JSON.parse(cp.dataset.official):null,mapping:cp.dataset.mapping?JSON.parse(cp.dataset.mapping):null,course_context_mapping:cp.dataset.courseContextMapping?{...JSON.parse(cp.dataset.courseContextMapping),mapping_current:!!trustedCourseMapping(cp)}:null,position_edited:cp.dataset.positionEdited==='true',cutoff_edited:cp.dataset.cutoffEdited==='true',cutoff_kind_confirmed:cp.dataset.cutoffKindConfirmed==='true'})),comparison_plans:state.comparisons},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='trail-goal-plan-v1.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});

window.addEventListener('pagehide',event=>{if(pendingRouteImport){if(event?.persisted)predictionUI?.suspend({preserveLocalResult:true});else predictionUI?.dispose();stopRequest({preserveGoalInputRevision:true,preserveAcceptedResults:true});$('gpx-file').value='';if(!state.route)clearRouteDisplay('讀取已中止');feedback(state.route?'導入已中止，目前路線與結果已保留。':'導入已中止，可以重新操作。');transport.dispose();return;}if(state.requestKind?.startsWith('repair')){if(event?.persisted)predictionUI?.suspend({preserveLocalResult:true});else predictionUI?.dispose();stopRequest({preserveGoalInputRevision:true,preserveAcceptedResults:true});feedback('路線處理已中止，目前路線與結果保持不變。');transport.dispose();return;}if(event?.persisted)predictionUI?.suspend({preserveLocalResult:['details-retry','quality_inspect','drawing-inspect'].includes(state.requestKind)});else predictionUI?.dispose();stationClockUI?.cancel();conditionalPreview?.cancel();if(cancelDetailsRetry()){transport.dispose();return;}if(state.requestKind==='quality_inspect'){routeQualityUI?.cancel();state.request=null;state.requestKind=null;busy(false);transport.dispose();return;}if(state.requestKind==='drawing-inspect'){drawingUI?.cancelWork();transport.dispose();return;}const pending=state.requestKind;stopRequest({preserveGoalInputRevision:!pending||['station_clock_restore','station_clock_manual','station_clock_forward'].includes(pending)});if(['inspect','download','file-read'].includes(pending)){state.route=null;state.gpx=null;clearRouteDisplay('讀取已中止');}if(pending&&!['station_clock_restore','station_clock_manual','station_clock_forward'].includes(pending)){invalidate(false);feedback('計算已中止，可以重新操作。');}transport.dispose();});
$('transport-note').textContent=transportMode==='webworker'?'瀏覽器背景計算：GPX 留在這個頁面，不上傳伺服器。首次需載入約 13 MB 固定版本執行環境。':'本機開發模式：GPX 只傳到同電腦的計算介面，不保存內容。';


function catalogSourceDateFields(source){const date=sourceDateQualification(source);return date?{source_date:date}:{};}
function activeCatalogDateFields(){const date=state.source?sourceDateQualification(state.source):state.courseContext&&state.courseUpload?.gpx===state.gpx?courseDateQualification(state.courseContext):null;return date?{source_date:date}:{};}
function captureCatalogDateOwner(){const date=activeCatalogDateFields().source_date??null;return {json:JSON.stringify(date),source:date?state.source:null,context:date&&!state.source?state.courseContext:null,retired:false};}
function catalogDateOwnerCurrent(owner){if(!owner||owner.retired)return false;try{const now=captureCatalogDateOwner();if(owner.json===now.json&&owner.source===now.source&&owner.context===now.context)return true;}catch{/* Invalid or changed qualification retires this accepted owner. */}owner.retired=true;return false;}
async function requestWithCatalogDate(operation,payload,signal,options){predictionDateAdmission=null;const owner=captureCatalogDateOwner(),value=await serviceAwareRequest(operation,payload,signal,options);if(!catalogDateOwnerCurrent(owner))throw Object.assign(new Error('賽日來源資料已改變，請重新計算。'),{code:'stale_source_date'});const plan=['selected_history_predict','intervals_history_predict'].includes(operation)?value?.reference?.target_prediction:value;predictionDateAdmission={operation,plan,response:value,owner};return value;}
function acceptPredictionCatalogDate(wrapper){
 const admission=predictionDateAdmission;predictionDateAdmission=null;const plan=wrapper?.prediction;
 if(!admission||!plan||typeof plan!=='object'||!catalogDateOwnerCurrent(admission.owner))return false;
 if(admission.operation==='selected_history_predict'){
  // Only the validated, frozen clone issued by the existing selected-history UI
  // may receive this one-shot admission; imported/public JSON cannot call it.
  const receipt=wrapper.selected_history_receipt,raw=admission.response;
  if(!receipt||!Object.isFrozen(receipt)||!Object.isFrozen(plan)||receipt.reference?.target_prediction!==plan||raw?.operation!=='selected_history_predict'||['schema_version','runtime_manifest_sha256','operation','request_sha256','owner_snapshot_sha256','owner_generation','target_sha256'].some(k=>receipt[k]!==raw[k])||receipt.correlation?.generation!==raw.correlation?.generation||receipt.correlation?.request_id!==raw.correlation?.request_id)return false;
 }else if(plan!==admission.plan)return false;
 if(!planCatalogDates.has(plan))planCatalogDates.set(plan,admission.owner);return planCatalogDateCurrent(plan);
}
function capturePlanCatalogDate(plan){if(!planCatalogDates.has(plan))planCatalogDates.set(plan,captureCatalogDateOwner());}
function planCatalogDateCurrent(plan){const owner=planCatalogDates.get(plan);if(owner)return catalogDateOwnerCurrent(owner);try{return activeCatalogDateFields().source_date===undefined;}catch{return false;}}
const sourceDateHints=new Map();
function refreshSourceDateHints(){
 const unknown=!!activeCatalogDateFields().source_date;
 for(const id of ['prediction-date','ability-target-date']){const input=$(id),label=input?.labels?.[0];if(!input||!label)continue;let hint=sourceDateHints.get(input);
  if(unknown){if(!hint){hint=document.createElement('span');hint.id=id+'-official-day-hint';hint.className='hint';hint.textContent=' 此日期為計算目標；官方賽日待核';sourceDateHints.set(input,hint);}if(hint.parentElement!==label)label.append(hint);const ids=(input.getAttribute('aria-describedby')||'').split(/\s+/u).filter(Boolean);if(!ids.includes(hint.id))input.setAttribute('aria-describedby',[...ids,hint.id].join(' '));}
  else if(hint){hint.remove();const ids=(input.getAttribute('aria-describedby')||'').split(/\s+/u).filter(v=>v&&v!==hint.id);if(ids.length)input.setAttribute('aria-describedby',ids.join(' '));else input.removeAttribute('aria-describedby');}
 }
}
function sourceSnapshot(race){const observations=publishedStationObservationSnapshot(race);return {...(observations?{published_station_observations:observations}:{}),...calculationProvenance(),race_id:race.id,name:race.name,edition:race.edition,region:race.region,official_page:race.officialPage,original_gpx_url:race.gpxUrl,...(race.sourceFilename?{original_download_entry:race.originalDownloadUrl||race.gpxUrl,source_filename:race.sourceFilename,official_checkpoint_count:race.officialCheckpointCount??null,official_aid_station_count:race.officialAidStationCount??null}:{}),gpx_sha256:race.sha256,verified_at:race.verifiedAt,published_at:race.publishedAt,official_distance_km:race.nominalDistanceKm,official_ascent_m:race.nominalAscentM,route_import:uploadImportEvidence()?.route_import||(race.transport==='user_upload_only'?'user_upload_only':race.transport==='same_origin_bridge'?'same_origin_fixed_source_bridge':'direct_official_url'),...(uploadImportEvidence()?{upload_source_match:uploadImportEvidence(),reviewed_catalog_transport:race.transport==='user_upload_only'?'user_upload_only':race.transport==='same_origin_bridge'?'same_origin_fixed_source_bridge':'direct_official_url'}:{}),...(race.bridgeSourceId?{bridge_source_id:race.bridgeSourceId}:{}),official_checkpoint_table:race.checkpoints??[],official_checkpoints_imported:[...$('cp-list').children].filter(cp=>cp.dataset.official).length,...catalogSourceDateFields(race)};}
// Published service text stays informational, separate from dwell/model inputs.
function renderPublishedStationServices(source){
  $('source-details').querySelector('#official-station-services')?.remove();
  const rows=publishedStationServiceEntries(source);if(!rows.length)return;
  const labels=publishedStationDisclosureLabels(source),details=document.createElement('details');details.id='official-station-services';details.className='official-station-services';const summary=document.createElement('summary');summary.textContent=labels.summary;details.append(summary);
  const notice=document.createElement('p');notice.textContent=labels.notice;details.append(notice);const list=document.createElement('ul');
  for(const {record,sourceUrl,description} of rows){const item=document.createElement('li');item.className='official-station-service';const name=document.createElement('span');name.className='official-station-service-name';name.textContent=record.name+' · ';const facts=document.createElement('span');facts.className='official-station-service-facts';facts.textContent=description+' · ';const sourceLink=document.createElement('a');sourceLink.textContent='官方來源';sourceLink.href=sourceUrl;sourceLink.target='_blank';sourceLink.rel='noopener noreferrer';item.append(name,facts,sourceLink);list.append(item);}
  details.append(list);$('source-details').append(details);
}
function refreshCatalogRouteSelection(){
  for(const button of $('race-list').querySelectorAll('button[data-race-id]')){
    const source=RACES.find(row=>row.id===button.dataset.raceId),event=EVENTS.find(row=>row.id===button.closest('article')?.dataset.eventId);
    const selected=source?.id===state.source?.id,current=selectedRouteVersionLabel(source,event,state),label=button.querySelector('.race-select-state');
    button.setAttribute('aria-pressed',String(selected));label.textContent=current||routeChoicePresentation(source,{selected}).action;
    if(current)label.setAttribute('data-current-version','true');else label.removeAttribute('data-current-version');
    button.setAttribute('aria-label',current?`${source.name}；${current}；重新導入路線`:`導入路線：${source?.name||''}`);
  }
}
function setSource(source,name='',{associationOnly=false,uploadIdentity=null}={}) {
  if(stationClockBarrier)throw new Error('完整方案正在套用。');
  if(!associationOnly)checkpointStopSourceOwner=Object.freeze({});
  state.courseUpload=null;state.courseContext=null;state.uploadIdentity=uploadIdentity;state.sourceProjectionPending=false;
  if(!associationOnly){drawingUI?.resetForSource();state.drawnProvenance=null;}
  serviceRouteRevision++;serviceMappingRevision++;if(!associationOnly)serviceStopUI?.resetRoute();
  state.source=source;synchronizeRouteDurationWidths();const finish=finishDeadlineFacts(source);state.selectedCheckpoint=0;$('route-entry-details').open=!source&&!name;
  // These opt-ins belong to this target route, not a newly selected source.
  if(!associationOnly){$('flat-consent').checked=false;$('clamp-consent').checked=false;}
  $('race-cutoff-summary').hidden=!source;
  $('race-cutoff-summary').className=`source-line status-tag ${finish.activeClock?'neutral':'warning'}`;
  $('race-cutoff-summary').textContent=source?[source.officialMaxHours?`限時 ${source.officialMaxHours} 小時`:null,finish.activeClock?`終點 ${finish.activeClock.slice(5,16).replace('T',' ')}`:finish.publishedClock?'終點判定待核':'終點關門待核'].filter(Boolean).join(' · '):'';
  $('source-details').hidden=!source;$('source-details').open=false;renderPublishedStationServices(source);
  $('source-provenance').textContent=source?`GPX 查核 ${source.verifiedAt.slice(0,10)}${source.sourceFilename?' · 原檔 '+source.sourceFilename:''}${source.editionNote?' · '+source.editionNote:''}`:'';
  $('source-cutoff-detail').textContent=source?[finish.activeClock?`終點關門 ${finish.activeClock.replace('T',' ')}`:finish.publishedClock?`官方公布時刻 ${finish.publishedClock.replace('T',' ')}（截止判定待核）`:'終點截止待核',source.cutoffNotice,source.waveNotice].filter(Boolean).join(' · '):'';
  if(!associationOnly){abilityUI?.resetRoute(source);predictionUI?.resetRoute(source,name);if(source?.startLocal)$('start-time').value=source.startLocal.slice(11,16);}
  $('selected-title').textContent=source?source.name:(name||'你的配速工作台');
  $('selected-edition').textContent=source?`${source.regionLabel} · ${source.edition} 屆 · ${sourceDateQualification(source)?'日期待核':source.raceDate}`:(name?'自選路線':'尚未選擇賽事');
  $('selected-source').textContent=source?`官方 ${source.distanceLabel||source.nominalDistanceKm+" km"} · ${Number.isFinite(source.nominalAscentM)?`爬升 ${Math.round(source.nominalAscentM).toLocaleString()} m`:"官方爬升未提供"}`:(name?'自選 GPX':'從賽事庫選一條官方路線。');
  for(const [id,key] of [['official-page','officialPage'],['download-gpx','gpxUrl']]){const a=$(id);a.hidden=!source;if(source)a.href=source[key];else a.removeAttribute('href');}
  refreshCatalogRouteSelection();
  renderUploadSourceMatch();renderUploadedCourseContext();
}
function uploadImportEvidence(){
  const owner=state.uploadIdentity;if(!owner?.selectedChoice||owner.gpx!==state.gpx||state.source?.sha256!==owner.match.sha256)return null;
  return {route_import:'uploaded_exact_original',uploaded_sha256:owner.match.sha256,uploaded_bytes:owner.match.bytes,uploaded_filename:owner.filename,selection:owner.selection,source_choice:owner.selectedChoice,...(state.source.selectedOfficialCategory?{category:state.source.selectedOfficialCategory}:{})};
}
function missingSourceProjections(source,details){return source?.mappingMode==='projected_official_coordinates'&&(!Array.isArray(details?.official_waypoints)||source.checkpoints.some((cp,i)=>{const p=details.official_waypoints[i];return !p||p.name!==cp.name||p.lat!==cp.lat||p.lon!==cp.lon;}));}
function renderSelectedOption(select){
 const preview=$(select.id+'-preview');if(!preview)return;
 const option=[...select.querySelectorAll('option')].find(option=>option.value===select.value);
 preview.hidden=!select.value||select.hidden||!option;preview.textContent=preview.hidden?'':`已選：${option.textContent}`;
 const described=(select.getAttribute('aria-describedby')||'').split(/\s+/u).filter(id=>id&&id!==preview.id);
 if(!preview.hidden)described.push(preview.id);if(described.length)select.setAttribute('aria-describedby',described.join(' '));else select.removeAttribute('aria-describedby');
}
let uploadChoiceGeneration=0,renderedUploadOwner=null;
function renderUploadSourceMatch(){
  const owner=state.uploadIdentity,box=$('upload-source-match'),actions=$('upload-source-actions'),select=$('upload-source-choice'),apply=$('upload-source-apply'),ignore=$('upload-source-ignore'),generation=++uploadChoiceGeneration,sameOwner=renderedUploadOwner===owner;renderedUploadOwner=owner;
  box.hidden=!owner||owner.ignored||owner.match.status==='unmatched';actions.hidden=true;apply.onclick=ignore.onclick=null;select.onchange=null;
  if(box.hidden)return;
  if(owner.selectedChoice){$('upload-source-note').textContent=state.sourceProjectionPending?state.calculationGpx?'官方站點已保留；可手動定位，或返回原始版本後補讀來源位置。':'已識別官方原檔；可重試詳細資料，補讀站點位置。':'已識別已查核的官方原檔。';return;}
  if(owner.match.status==='too_many'){$('upload-source-note').textContent='原檔有多個賽事版本，暫保留自選 GPX。';return;}
  $('upload-source-note').textContent='這份原檔對應多個賽事／組別，請選擇；尚未加入官方站點。';actions.hidden=false;
  const value=sameOwner?select.value:'';select.replaceChildren();const empty=document.createElement('option');empty.value='';empty.textContent='選擇賽事與組別';select.append(empty);for(const c of owner.match.choices){const option=document.createElement('option');option.value=c.key;option.textContent=c.label;select.append(option);}select.value=owner.match.choices.some(c=>c.key===value)?value:'';
  const current=()=>state.uploadIdentity===owner&&uploadChoiceGeneration===generation&&owner.gpx===state.gpx&&(state.originalRoute||state.route)?.route_sha256===owner.match.sha256&&!serviceBusy()&&!manualPaceUI?.isBusy()&&!goalSuggestionUI?.pending;
  const update=()=>{select.disabled=!current();apply.disabled=select.disabled||!select.value;ignore.disabled=select.disabled;renderSelectedOption(select);};select.onchange=update;update();
  ignore.onclick=()=>{if(!current())return;state.uploadIdentity=Object.freeze({...owner,ignored:true});renderUploadSourceMatch();};
  apply.onclick=()=>{if(!current())return;const choice=owner.match.choices.find(c=>c.key===select.value);if(!choice)return;try{
    const source=sourceForExactChoice(choice),facts=officialCheckpointFacts(source,state.originalRoute||state.route).filter(p=>p.kind==='checkpoint');
    if($('cp-list').children.length+facts.length>100){feedback(`目前 ${$('cp-list').children.length} 站，官方另有 ${facts.length} 站；最多 100 站，請先移除不需要的站點。`,'error');return;}
    stopRequest();invalidate(false);const committed=Object.freeze({...owner,selectedChoice:choice.key,selection:'explicit'});setSource(source,owner.filename,{associationOnly:true,uploadIdentity:committed});state.sourceProjectionPending=missingSourceProjections(source,state.calculationDetails||state.details);
    applyOfficialCheckpoints({factsOnly:state.sourceProjectionPending});if(state.details)renderDetails({...state.details,...(state.calculationDetails?{waypoints:state.calculationDetails.waypoints}:{})});
    if(state.sourceProjectionPending){$('details-retry').hidden=false;$('detail-status').hidden=false;$('detail-status').textContent=state.calculationGpx?'官方站點已保留，計算版本的位置待核；可手動定位或返回原始版本。':'官方站點已保留，可重試詳細資料補讀來源位置。';}
    busy(false);feedback('已採用賽事資料，原檔與自行編輯的站點已保留。');
  }catch(error){feedback(error.message,'error');}};
}
let courseChoiceGeneration=0,renderedCourseOwner=null;
function uploadedCourseContextSnapshot(){return state.courseContext&&state.courseUpload?.gpx===state.gpx?courseContextSnapshot(state.courseContext):null;}
async function refreshUploadedCourseFingerprint(details){
 const owner=state.courseUpload,token=state.token;if(!owner||state.courseContext||state.source||owner.gpx!==state.gpx||details.source?.route_sha256!==owner.sha256||details.source?.byte_count!==owner.bytes)return;
 try{const stream=canonicalCourseStream(details),sha256=await browserSha256(stream.bytes);if(state.courseUpload!==owner||state.token!==token||state.details!==details||state.courseContext)return;const {bytes,...counts}=stream,fingerprint=Object.freeze({...counts,sha256}),match=classifyCourseFingerprint(courseContextIndex,fingerprint);state.courseUpload=Object.freeze({...owner,fingerprint,match,fingerprintStatus:'known'});}
 catch{if(state.courseUpload!==owner||state.token!==token||state.details!==details||state.courseContext)return;state.courseUpload=Object.freeze({...owner,fingerprintStatus:'unavailable'});}
 renderUploadedCourseContext();
}
function renderUploadedCourseContext(){
 refreshSourceDateHints();refreshCourseWorkflowControls();
 const owner=state.courseUpload,panel=$('upload-course-context'),actions=$('upload-course-actions'),candidate=$('upload-course-candidate'),eventSelect=$('upload-course-event'),groupSelect=$('upload-course-group'),apply=$('upload-course-apply'),ignore=$('upload-course-ignore'),generation=++courseChoiceGeneration,sameOwner=renderedCourseOwner===owner;renderedCourseOwner=owner;
 panel.hidden=!courseContextIndex||!owner||owner.ignored||!!state.source;actions.hidden=true;const importButton=$('upload-course-import-facts');importButton.hidden=true;importButton.onclick=null;apply.onclick=ignore.onclick=null;candidate.onchange=eventSelect.onchange=groupSelect.onchange=null;$('upload-course-facts').replaceChildren();
 if(panel.hidden)return;
 const current=()=>state.courseUpload===owner&&courseChoiceGeneration===generation&&owner.gpx===state.gpx&&(state.originalRoute||state.route)?.route_sha256===owner.sha256&&!state.source&&!serviceBusy()&&!manualPaceUI?.isBusy()&&!goalSuggestionUI?.pending;
 const context=state.courseContext;
 if(context){$('upload-course-note').textContent=`已自行確認 ${context.event.name} · ${context.event.year}${courseDateQualification(context)?' · 日期待核':''}${context.source?' · '+context.source.name:context.group?' · '+context.group:''}。${context.numericCourseMatch===true?'逐點座標、海拔與分段相同；仍不是官方原檔身分。':context.numericCourseMatch===false?'逐點資料與此路線不同；只記錄你選擇的賽事背景。':'逐點身分未確認；只記錄你選擇的賽事背景。'}${context.source?.editionNote?' '+context.source.editionNote:''}${typeof context.source?.editionEvidence?.caveat==='string'?' '+context.source.editionEvidence.caveat:''}`;
  let facts=null;try{facts=uploadedCourseStationFacts(context);}catch{/* A malformed optional catalog fact never mutates editable rows. */}if(Array.isArray(facts)&&facts.length){for(const fact of facts){const p=document.createElement('p');p.className='hint';p.textContent=`${fact.name} · ${officialDistanceText(fact)}${fact.publishedTable?' · 官表分段加總 '+fact.published.derivedCumulativeDistanceKm+' km（推導值，非目前位置）':''} · 目前路線位置需另行確認`;$('upload-course-facts').append(p);}}else{const p=document.createElement('p');p.className='hint';p.textContent=context.source?context.source.officialCheckpointCount===0?'官方公布零個途中檢查點。':facts===null?'公布站點資料尚未確認，未加入任何站點。':'官方站點資料待核，不能視為零站。':'這是賽事背景，沒有已連結的官方路線或站點。';$('upload-course-facts').append(p);}renderUploadedCourseFactImport(current,context);return;
 }
 $('upload-course-note').textContent=owner.match?.totalChoices?`逐點資料有 ${owner.match.totalChoices} 個已查核路線／組別候選。請自行確認屆別與組別；尚未加入站點。`:owner.fingerprintStatus==='known'?'未找到相同逐點資料。仍可手動選擇賽事背景。':'逐點身分尚未確認。仍可手動選擇賽事背景。';actions.hidden=false;
 const selectedCandidate=sameOwner?candidate.value:'',selectedEvent=sameOwner?eventSelect.value:'',selectedGroup=sameOwner?groupSelect.value:'';candidate.replaceChildren();const option=(select,value,label)=>{const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o);};option(candidate,'','選擇逐點相同的候選（不自動認定）');for(const c of owner.match?.choices||[])option(candidate,c.key,c.label);candidate.value=owner.match?.choices.some(c=>c.key===selectedCandidate)?selectedCandidate:'';candidate.hidden=!owner.match?.choices.length;candidate.closest('.source-choice-field').hidden=candidate.hidden;
 eventSelect.replaceChildren();option(eventSelect,'','或手動選擇賽事與屆別');for(const e of courseContextIndex.events)option(eventSelect,e.id,`${e.name} · ${e.year} · ${e.country}`);eventSelect.value=courseContextIndex.events.some(e=>e.id===selectedEvent)?selectedEvent:'';
 const populateGroups=value=>{groupSelect.replaceChildren();option(groupSelect,'','選擇已公布組別或保留未知');for(const c of courseChoicesForEvent(courseContextIndex,eventSelect.value))option(groupSelect,c.key,c.label+(c.group&&c.event.routes.some(r=>r.name===c.group&&r.publishedCheckpointTable)?' · 有官表':''));groupSelect.value=courseChoicesForEvent(courseContextIndex,eventSelect.value).some(c=>c.key===value)?value:'';};populateGroups(selectedGroup);
 const selected=()=>courseChoiceForKey(courseContextIndex,candidate.value||groupSelect.value),update=()=>{candidate.disabled=eventSelect.disabled=!current();groupSelect.disabled=!current()||!eventSelect.value;apply.disabled=!current()||!selected();ignore.disabled=!current();for(const select of [candidate,eventSelect,groupSelect])renderSelectedOption(select);};candidate.onchange=()=>{if(candidate.value){eventSelect.value='';populateGroups('');}update();};eventSelect.onchange=()=>{candidate.value='';populateGroups('');update();};groupSelect.onchange=()=>{candidate.value='';update();};update();
 ignore.onclick=()=>{if(!current())return;state.courseUpload=Object.freeze({...owner,ignored:true});renderUploadedCourseContext();};
 apply.onclick=()=>{if(!current()||state.courseContext)return;const choice=selected();if(!choice)return;try{const context=courseContextForChoice(courseContextIndex,choice,{sha256:owner.sha256,bytes:owner.bytes,filename:owner.filename},owner.fingerprint);stopRequest();invalidate(false);state.courseContext=context;serviceRouteRevision++;serviceMappingRevision++;synchronizeRouteDurationWidths();renderUploadedCourseContext();busy(false);feedback('已記錄自行確認的賽事背景；原檔、路線位置與編輯內容已保留。');}catch(error){feedback(error.message,'error');}};
}
function renderUploadedCourseFactImport(current,context){
 const button=$('upload-course-import-facts');button.hidden=true;button.onclick=null;
 if(context.factsImported)return;let records;try{records=uploadedCourseStationFacts(context);}catch{return;}
 if(!records.length)return;button.hidden=false;button.textContent=`加入 ${records.length} 個公布站點，位置需另行確認`;button.disabled=!current()||state.route?.blocked;
 button.onclick=()=>{
  if(!current()||state.courseContext!==context||context.factsImported||!state.route||state.route.blocked)return;
  const raw=state.gpx,source=state.source,oldCount=state.cpCount,oldIdentity=state.cpIdentity;
  try{const facts=uploadedCourseStationFacts(context);if($('cp-list').children.length+facts.length>100){feedback(`目前 ${$('cp-list').children.length} 站，公布資料另有 ${facts.length} 站；最多 100 站，請先移除不需要的站點。`,'error');return;}
   // Validate the complete bounded fact set before allocating any row identity.
   const nodes=facts.map(record=>{const cp=$('cp-template').content.firstElementChild.cloneNode(true);for(const selector of ['legend','.cp-name','.cp-distance','.cp-stop','.cp-cutoff','.cp-kind','.remove-cp'])if(!cp.querySelector(selector))throw Error('站點欄位未完成，未加入任何站點。');return {cp,record};});
   for(const {cp,record} of nodes){state.cpCount++;prepareCheckpointRow(cp);cp.querySelector('legend').textContent=`${record.stationType==='timing_only_checkpoint'?'計時站':'檢查點'} ${state.cpCount}`;cp.querySelector('.cp-name').value=record.name.slice(0,80);cp.querySelector('.cp-distance').value='';cp.querySelector('.cp-distance').step='any';cp.querySelector('.cp-stop').value='';cp.querySelector('.cp-cutoff').value='';const kind=document.createElement('option');kind.value='unknown';kind.textContent='尚未確認';cp.querySelector('.cp-kind').append(kind);cp.querySelector('.cp-kind').value='unknown';
    cp.dataset.courseContextFact=JSON.stringify(record);cp.dataset.courseContextFactKey=courseStationFactKey(record);cp.dataset.courseContextOwner=JSON.stringify({choice:context.choiceKey,uploadedSha256:context.uploadedSha256,catalogSha256:context.catalogSourceSha256});cp.dataset.locationPending='true';cp.dataset.positionEdited='false';cp.dataset.locationReconfirmed='false';
    const note=document.createElement('p');note.className='course-context-cp-note';note.textContent=officialCpNote(record)+' · 自行確認的賽事資料；目前路線位置、停留與關門需另行確認';if(record.publishedTable){const details=document.createElement('details'),summary=document.createElement('summary');details.className='official-cp-source';summary.className='official-source-summary';summary.textContent='官表資料 · 位置與關門待核';const link=document.createElement('a');link.textContent='官方官表來源';link.href=record.sourceUrl;link.target='_blank';link.rel='noopener noreferrer';details.append(summary,note,link);cp.append(details);}else cp.append(note);cp.querySelector('.cp-position-actions').hidden=false;cp.querySelector('.cp-location-note').textContent='位置待核對';cp.querySelector('.cp-location-note').hidden=false;cp.querySelector('.confirm-cp-location').hidden=false;cp.querySelector('.cp-location-help').hidden=false;cp.querySelector('.cp-location-help').querySelector('p').textContent='官方公布里程是獨立資料。請自行填寫並確認此檔目前沿線位置；選擇賽事背景不會證明站點位於這條路線。';
    const rowId=cp.dataset.cpId;cp.querySelector('.remove-cp').addEventListener('click',()=>{if(cp.parentElement!==$('cp-list')||cp.dataset.cpId!==rowId||state.gpx!==raw||state.source!==source)return;stopRequest();removeCheckpointRow(cp);});
   }
   stopRequest();state.courseContext=Object.freeze({...context,factsImported:true});for(const {cp} of nodes)$('cp-list').append(cp);serviceMappingRevision++;serviceStopUI?.invalidateMapping();invalidate(false);$('checkpoints-panel').open=true;renderUploadedCourseContext();busy(false);feedback('已加入公布站點資料。請逐站填寫並確認目前路線位置、停留與關門。');
  }catch(error){state.cpCount=oldCount;state.cpIdentity=oldIdentity;feedback(error.message,'error');}
 };
}


// Detached verification reads actual current bytes without changing result/input ownership.
function drainCourseRowChanges(){if(courseRowsObserver?.takeRecords().length)courseRowsRevision++;}
function courseRowSignature(){return JSON.stringify([...$('cp-list').children].map(cp=>({id:cp.dataset.cpId,data:Object.entries(cp.dataset).sort(([a],[b])=>a.localeCompare(b)),fields:[...cp.querySelectorAll('input,select,textarea')].map(f=>[f.id,f.className,f.value,f.checked===true])})));}
function captureCourseWorkflow(){drainCourseRowChanges();return {context:state.courseContext,upload:state.courseUpload,source:state.source,originalGpx:state.gpx,currentGpx:calculationGpx(),originalDetails:state.details,currentDetails:state.calculationDetails||state.details,route:state.route,originalRoute:state.originalRoute,token:state.token,inputRevision:goalInputRevision,routeRevision:serviceRouteRevision,mappingRevision:serviceMappingRevision,rowRevision:courseRowsRevision,goalSignature:goalRawSignature(),rowSignature:courseRowSignature(),nodes:[...$('cp-list').children]};}
function courseWorkflowCurrent(owner){try{const now=captureCourseWorkflow();return owner&&Object.keys(now).filter(k=>k!=='nodes').every(k=>now[k]===owner[k])&&now.nodes.length===owner.nodes.length&&now.nodes.every((node,i)=>node===owner.nodes[i]&&node.parentElement===$('cp-list'));}catch{return false;}}
function courseMappingInput(details=state.calculationDetails||state.details){return {index:courseContextIndex,context:state.courseContext,originalGpx:state.gpx,currentGpx:calculationGpx(),originalDetails:state.details,currentDetails:details,route:state.route};}
function courseReadOnlyBusy(){return !!courseMappingRequest;}
function courseWorkflowBusy(){return serviceBusy()||!!manualPaceUI?.isBusy()||!!goalSuggestionUI?.pending||!!conditionalPreview?.isPending();}
function courseReadOnlyPending(pending){const op=courseMappingRequest;return !!(op&&op.pending===pending&&pending===transport.pending&&pending.operation==='details'&&pending.signal===op.controller.signal&&pending.requestId===op.requestId&&transport.generation===op.transportGeneration&&!op.controller.signal.aborted&&courseWorkflowCurrent(op.owner));}
function cancelCourseMappingVerification(){const op=courseMappingRequest;if(!op)return false;courseMappingRequest=null;op.controller.abort();clearTimeout(op.timer);$('upload-course-mapping-status').textContent='位置核對已取消；站點與目前結果已保留。';refreshCourseWorkflowControls();manualPaceUI?.refresh();return true;}
function clearCourseWorkflowPreviews(){$('upload-course-mapping-status').textContent='';courseMappingPreview=null;checkpointOrderPreview=null;$('upload-course-mapping-preview').replaceChildren();$('upload-course-adopt-unique').hidden=true;$('upload-course-adopt-unique').onclick=null;$('cp-order-list').replaceChildren();$('cp-order-apply').hidden=true;$('cp-order-apply').onclick=null;}
function courseWorkflowError(error){feedback(error.message,'error');const ids=error.rowIds||[],fields=ids.map(id=>{const cp=[...$('cp-list').children].find(cp=>cp.dataset.cpId===id),field=cp?.querySelector('.cp-distance');if(field)field.setAttribute('aria-label',`${cp.querySelector('.cp-name').value} (${id})的目前里程 km`);return field;}).filter(Boolean);if(fields.length)goalErrors.show(error,{fields});}
function eligibleCoursePosition(cp,context){
 if(cp.parentElement!==$('cp-list')||cp.dataset.locationPending!=='true'||cp.querySelector('.cp-distance').value.trim()||cp.dataset.positionEdited==='true'||cp.dataset.locationReconfirmed==='true'||cp.dataset.mapping||cp.dataset.previousMapping||cp.dataset.courseContextMapping||cp.dataset.waypointAssociation||cp.dataset.officialAssociation)return false;
 try{const owner=JSON.parse(cp.dataset.courseContextOwner||'null'),fact=JSON.parse(cp.dataset.courseContextFact||'null');return owner?.choice===context.choiceKey&&owner.uploadedSha256===context.uploadedSha256&&owner.catalogSha256===context.catalogSourceSha256&&cp.dataset.courseContextFactKey===courseStationFactKey(fact);}catch{return false;}
}
function currentCourseMappingPreview(preview){return !!(preview&&courseMappingPreview===preview&&!courseReadOnlyBusy()&&!courseWorkflowBusy()&&courseWorkflowCurrent(preview.owner)&&uploadedCourseMappingCurrent(preview.ticket,preview.input));}
function prepareCoursePositionChanges(preview,choices){
 if(!currentCourseMappingPreview(preview))throw Error('位置或設定已變更，請重新核對候選。');
 const rows=[...$('cp-list').children],prepared=[],positions=new Map();
 for(const row of rows){const raw=row.querySelector('.cp-distance').value;if(row.dataset.locationPending!=='true'&&raw.trim()&&Number.isFinite(Number(raw)))positions.set(Number(raw)*1000,row);}
 for(const {cp,choice}of choices){if(!eligibleCoursePosition(cp,state.courseContext)||!choice||choice.station.factKey!==cp.dataset.courseContextFactKey)throw Error('此站位置已編輯或重新確認，保留目前內容。');const raw=String(choice.candidate.distance_m/1000),field=cp.querySelector('.cp-distance'),probe=field.cloneNode(false);probe.value=raw;if(!probe.checkValidity())throw Object.assign(Error('候選位置超出此站欄位範圍，請手填並確認。'),{rowIds:[cp.dataset.cpId]});const metres=Number(raw)*1000,conflict=positions.get(metres);if(conflict&&conflict!==cp)throw Object.assign(Error(`「${cp.querySelector('.cp-name').value}」與「${conflict.querySelector('.cp-name').value}」目前里程相同；請確認經過位置。`),{rowIds:[cp.dataset.cpId,conflict.dataset.cpId]});positions.set(metres,cp);const mapping={...choice.evidence,catalog_occurrence_key:choice.station.factKey,catalog_index:choice.station.catalogIndex,mapping_method:choice.station.method,selected_passage_index:choice.passageIndex,selected_candidate:choice.candidate,selected_identity:choice.identity,distance_raw:raw};prepared.push({cp,raw,candidate:choice.candidate,mapping});}
 const occurrences=rows.flatMap(cp=>{const mapping=trustedCourseMapping(cp);return mapping&&mapping.course_choice===state.courseContext.choiceKey?[{cp,index:mapping.catalog_index,distance:Number(cp.querySelector('.cp-distance').value)*1000}]:[];}).concat(prepared.map(change=>({cp:change.cp,index:change.mapping.catalog_index,distance:Number(change.raw)*1000})));
 for(let i=0;i<occurrences.length;i++)for(let j=i+1;j<occurrences.length;j++){const a=occurrences[i],b=occurrences[j];if(a.index===b.index||a.index<b.index&&a.distance>=b.distance||a.index>b.index&&a.distance<=b.distance)throw Object.assign(Error('所選經過位置與已採用的公布站序衝突；請核對兩站位置。'),{rowIds:[a.cp.dataset.cpId,b.cp.dataset.cpId]});}
 return prepared;
}
function commitCoursePositionChanges(preview,choices){
 try{const changes=prepareCoursePositionChanges(preview,choices);if(!changes.length)return;const before=changes.map(({cp})=>({cp,distance:cp.querySelector('.cp-distance').value,data:{...cp.dataset}}));
  try{for(const {cp,raw,candidate,mapping}of changes){cp.querySelector('.cp-distance').value=raw;cp.dataset.mapping=JSON.stringify(candidate);cp.dataset.mappingRouteSha=preview.ticket.evidence.current_calculation_sha256;cp.dataset.courseContextMapping=JSON.stringify(mapping);cp.dataset.positionEdited='false';cp.dataset.locationPending='false';cp.dataset.locationReconfirmed='false';}}
  catch(error){for(const row of before){row.cp.querySelector('.cp-distance').value=row.distance;for(const key of Object.keys(row.cp.dataset))if(!Object.hasOwn(row.data,key))delete row.cp.dataset[key];Object.assign(row.cp.dataset,row.data);}throw error;}
  for(const change of changes)courseMappingAdoptions.set(change.cp,{ticket:preview.ticket,input:preview.input,owner:preview.owner,mapping:JSON.stringify(change.mapping)});
  stopRequest();serviceMappingRevision++;serviceStopUI?.invalidateMapping();invalidate(false);for(const {cp}of changes){cp.querySelector('.cp-position-actions').hidden=true;cp.querySelector('.cp-location-note').hidden=true;cp.querySelector('.confirm-cp-location').hidden=true;cp.querySelector('.cp-location-help').hidden=true;}clearCourseWorkflowPreviews();refreshCourseWorkflowControls();feedback(`已採用 ${changes.length} 站目前位置；名稱、停留與關門已保留。請另行預覽沿線順序。`);
 }catch(error){courseWorkflowError(error);}
}
function trustedCourseMapping(cp){
 const adopted=courseMappingAdoptions.get(cp);if(!adopted||cp.dataset.courseContextMapping!==adopted.mapping||cp.dataset.locationPending==='true'||cp.dataset.positionEdited==='true'||cp.dataset.locationReconfirmed==='true'||cp.dataset.mappingRouteSha!==state.route?.route_sha256)return null;
 try{const mapping=JSON.parse(adopted.mapping),owner=adopted.owner;if(owner.context!==state.courseContext||owner.source!==state.source||owner.originalGpx!==state.gpx||owner.currentGpx!==calculationGpx()||owner.originalDetails!==state.details||owner.currentDetails!==(state.calculationDetails||state.details)||owner.route!==state.route||mapping.distance_raw!==cp.querySelector('.cp-distance').value||JSON.stringify(mapping.selected_candidate)!==cp.dataset.mapping||!uploadedCourseMappingCurrent(adopted.ticket,adopted.input))return null;return mapping;}catch{return null;}
}
function renderCourseMappingPreview(preview){
 const box=$('upload-course-mapping-preview'),bulk=$('upload-course-adopt-unique');box.replaceChildren();bulk.hidden=true;bulk.onclick=null;const unique=[];
 for(const cp of [...$('cp-list').children]){const station=preview.ticket.stations.find(s=>s.factKey===cp.dataset.courseContextFactKey);if(!station)continue;const item=document.createElement('p');item.className='hint';const name=cp.querySelector('.cp-name').value,eligible=eligibleCoursePosition(cp,state.courseContext);item.textContent=`${name} · 公布資料站序 ${station.catalogIndex+1} · ${station.candidates.length?station.candidates.length+' 個核對候選':'仍待定位'}${eligible?'':' · 目前位置已填或確認，保留編輯'}`;
  if(eligible&&station.candidates.length===1&&!station.explicitPassage){const choice=uploadedCourseMappingChoice(preview.ticket,station.factKey,0);unique.push({cp,choice});item.textContent+=` · 可明確採用 ${(choice.candidate.distance_m/1000).toFixed(6)} km`;}
  else if(eligible&&station.candidates.length){const controls=document.createElement('span');controls.className='course-coordinate-choice';const select=document.createElement('select');select.setAttribute('aria-label',`${name} (${cp.dataset.cpId})的公布座標經過位置`);const empty=document.createElement('option');empty.value='';empty.textContent='選擇經過位置';select.append(empty);station.candidates.forEach((candidate,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent=`第 ${index+1} 處 · ${(candidate.distance_m/1000).toFixed(6)} km${Number.isFinite(candidate.offset_m)?' · 距路線 '+candidate.offset_m.toFixed(2)+' m':''}`;select.append(option);});const adopt=document.createElement('button');adopt.type='button';adopt.className='secondary';adopt.textContent='採用此位置';adopt.disabled=true;select.onchange=()=>{adopt.disabled=!currentCourseMappingPreview(preview)||select.value==='';};adopt.onclick=()=>{if(!currentCourseMappingPreview(preview)||select.value==='')return;const choice=uploadedCourseMappingChoice(preview.ticket,station.factKey,Number(select.value));commitCoursePositionChanges(preview,[{cp,choice}]);};controls.append(select,adopt);item.append(controls);}box.append(item);
 }
 if(unique.length){bulk.hidden=false;bulk.textContent=`採用上列 ${unique.length} 站唯一位置（不排序）`;bulk.disabled=!currentCourseMappingPreview(preview);bulk.onclick=()=>{if(!currentCourseMappingPreview(preview))return;commitCoursePositionChanges(preview,unique);};}
 $('upload-course-mapping-status').textContent='候選已核對，尚未更動站點。依有候選的公布站序核對經過位置；其餘站點仍待定位。';
}
async function verifyCurrentCoursePositions(){
 if(courseReadOnlyBusy()||courseWorkflowBusy()||!state.courseContext?.source||!state.details||!state.route||state.route.blocked)return;
 clearCourseWorkflowPreviews();const op={owner:captureCourseWorkflow(),controller:new AbortController(),pending:null,requestId:null,transportGeneration:null,timer:null};courseMappingRequest=op;refreshCourseWorkflowControls();manualPaceUI?.refresh();$('upload-course-mapping-status').textContent='正在核對逐點身分與公布座標；站點與目前結果保留。';
 op.timer=setTimeout(()=>{if(courseMappingRequest===op)cancelCourseMappingVerification();},120000);
 try{let details=state.calculationDetails||state.details;const source=state.courseContext.source;if(source.mappingMode==='projected_official_coordinates'){
   if(transport.pending)throw Error('目前有其他計算，請稍後核對。');const promise=transport.request('details',detailsPayload(calculationGpx(),source,surfaceApplied()),{signal:op.controller.signal});op.pending=transport.pending;op.requestId=op.pending?.requestId;op.transportGeneration=transport.generation;details=await promise;
  }
  if(courseMappingRequest!==op||op.controller.signal.aborted||!courseWorkflowCurrent(op.owner))return;
  const input=courseMappingInput(details),ticket=await verifyUploadedCourseMapping(input);if(courseMappingRequest!==op||op.controller.signal.aborted||!courseWorkflowCurrent(op.owner))return;
  courseMappingRequest=null;clearTimeout(op.timer);courseMappingPreview={owner:op.owner,input,ticket};renderCourseMappingPreview(courseMappingPreview);
 }catch(error){if(courseMappingRequest!==op||op.controller.signal.aborted||!courseWorkflowCurrent(op.owner))return;if(error.admissionRejected===true){courseMappingRequest=null;stopRequest();state.gpx=null;state.route=null;state.originalFileName='';$('gpx-file').value='';$('cp-list').replaceChildren();state.cpCount=0;invalidate(false);clearRouteDisplay('來源未通過檢查');feedback('原始資料未通過檢查，請重新導入路線。','error');}else $('upload-course-mapping-status').textContent=error.message||'位置候選未完成；站點與目前結果已保留。';}
 finally{if(courseMappingRequest===op)courseMappingRequest=null;clearTimeout(op.timer);refreshCourseWorkflowControls();manualPaceUI?.refresh();}
}
function refreshCourseWorkflowControls(){
 refreshCheckpointNoStopControls();
 const mapping=$('upload-course-mapping'),verify=$('upload-course-verify-mapping'),cancel=$('upload-course-cancel-mapping'),busy=courseWorkflowBusy();mapping.hidden=!state.courseContext?.source||!state.courseUpload||!!state.source;$('upload-course-operation').hidden=mapping.hidden;verify.disabled=busy||!state.details||!state.route||state.route.blocked;cancel.hidden=!courseReadOnlyBusy();cancel.disabled=!courseReadOnlyBusy();$('cp-order-preview').disabled=busy||!state.route||state.route.blocked||!$('cp-list').children.length;
 if(courseMappingPreview&&!currentCourseMappingPreview(courseMappingPreview)&&!courseReadOnlyBusy()){courseMappingPreview=null;$('upload-course-mapping-preview').replaceChildren();$('upload-course-adopt-unique').hidden=true;$('upload-course-adopt-unique').onclick=null;}
 if(checkpointOrderPreview&&!courseWorkflowCurrent(checkpointOrderPreview.owner)){checkpointOrderPreview=null;$('cp-order-list').replaceChildren();$('cp-order-apply').hidden=true;$('cp-order-apply').onclick=null;}
 $('upload-course-adopt-unique').disabled=busy;$('cp-order-apply').disabled=busy;for(const box of $('upload-course-mapping-preview').querySelectorAll('.course-coordinate-choice')){const select=box.querySelector('select'),button=box.querySelector('button');select.disabled=busy;button.disabled=busy||select.value==='';}
 let orderError=null;try{if(state.route&&!state.route.blocked)previewCheckpointOrder([...$('cp-list').children].map(cp=>({id:cp.dataset.cpId,name:cp.querySelector('.cp-name').value,distanceRaw:cp.querySelector('.cp-distance').value,locationPending:cp.dataset.locationPending==='true',fieldValid:cp.querySelector('.cp-distance').checkValidity()})),state.route.distance_m);else orderError=Error('請先導入可用路線。');}catch(error){orderError=error;}const locate=$('cp-order-locate');locate.hidden=!orderError||!$('cp-list').children.length;locate.disabled=busy;locate.onclick=orderError?()=>{if(!serviceBusy())courseWorkflowError(orderError);}:null;if(orderError){$('cp-order-preview').disabled=true;if(!checkpointOrderPreview)$('cp-order-status').textContent=orderError.message;}
}
function previewCurrentCheckpointOrder(){
 if(courseReadOnlyBusy()||courseWorkflowBusy()||!state.route||state.route.blocked)return;
 const owner=captureCourseWorkflow();try{const order=previewCheckpointOrder(owner.nodes.map(cp=>({id:cp.dataset.cpId,name:cp.querySelector('.cp-name').value,distanceRaw:cp.querySelector('.cp-distance').value,locationPending:cp.dataset.locationPending==='true',fieldValid:cp.querySelector('.cp-distance').checkValidity()})),state.route.distance_m),preview={owner,order};checkpointOrderPreview=preview;$('cp-order-list').replaceChildren();for(const row of order.order){const li=document.createElement('li');li.textContent=`${row.name} · ${(row.distanceM/1000).toFixed(6)} km`;li.dataset.cpId=row.id;$('cp-order-list').append(li);}$('cp-order-status').textContent=order.changed?'確認上列順序後再套用；尚未更動任何站點。':'目前已按沿線里程排列；套用不會改動結果。';const apply=$('cp-order-apply');apply.hidden=false;apply.disabled=false;apply.onclick=()=>{
   if(checkpointOrderPreview!==preview||courseReadOnlyBusy()||courseWorkflowBusy()||!courseWorkflowCurrent(owner))return;
   if(!order.changed){$('cp-order-status').textContent='順序保持不變，目前結果已保留。';return;}
   const list=$('cp-list'),nodes=order.order.map(row=>owner.nodes.find(cp=>cp.dataset.cpId===row.id));try{list.replaceChildren(...nodes);}catch(error){list.replaceChildren(...owner.nodes);courseWorkflowError(error);return;}stopRequest();serviceMappingRevision++;serviceStopUI?.invalidateMapping();invalidate(false);clearCourseWorkflowPreviews();refreshCourseWorkflowControls();$('cp-order-status').textContent='已按目前里程排列；所有站點原值保留，請重新計算。';
  };
 }catch(error){checkpointOrderPreview=null;$('cp-order-list').replaceChildren();$('cp-order-apply').hidden=true;$('cp-order-apply').onclick=null;$('cp-order-status').textContent=error.message;courseWorkflowError(error);}
}
$('upload-course-verify-mapping').addEventListener('click',verifyCurrentCoursePositions);$('upload-course-cancel-mapping').addEventListener('click',()=>{const restoreFocus=document.activeElement===$('upload-course-cancel-mapping');cancelCourseMappingVerification();if(restoreFocus&&!$('upload-course-context').hidden){$('upload-course-context').open=true;const target=$('upload-course-verify-mapping').disabled?$('upload-course-context').querySelector('summary'):$('upload-course-verify-mapping');target.focus({preventScroll:true});}});$('cp-order-preview').addEventListener('click',previewCurrentCheckpointOrder);

function catalogLink(label,url){const a=document.createElement('a');a.className='secondary';a.textContent=label;a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function renderCatalog(){
  $('catalog-error').textContent=catalogIssue;$('catalog-error').hidden=!catalogIssue;$('catalog-retry').hidden=!catalogIssue;
  const events=filterEvents(EVENTS,RACES,{query:$('race-search').value,country:$('race-region').value,year:$('race-year').value,distance:$('race-distance').value,availability:$('race-availability').value}).sort((a,b)=>{const rank=e=>e.country==='台灣'?0:e.region==='Asia'?1:2;return rank(a)-rank(b)||b.year-a.year||a.name.localeCompare(b.name,'zh-Hant');});
  $('race-list').replaceChildren();
  for(const event of events){
    const card=document.createElement('article');card.className='race-card event-card';card.dataset.eventId=event.id;
    const location=document.createElement('div');location.className='race-location';const label=document.createElement('span');label.textContent=`${event.country} · ${event.year}`;const badge=document.createElement('span');badge.className=`event-badge ${['direct_verified','bridge_verified'].includes(event.importability)?'available':''}`;badge.textContent=eventBadge(event);location.append(label,badge);
    const title=document.createElement('h3');title.className='race-name';title.textContent=event.name;const date=document.createElement('p');date.className='event-date';date.textContent=eventDateQualification(event)?'日期待核':event.dateStart===event.dateEnd?event.dateStart:`${event.dateStart}–${event.dateEnd}`;
    const actions=document.createElement('div');actions.className='event-actions';const official=catalogLink('官方賽事頁',event.officialPage);official.classList.add('event-official-page');actions.append(official);
    if(['direct_verified','bridge_verified'].includes(event.importability)){
      for(const id of event.routeIds){
        const race=RACES.find(r=>r.id===id),selected=state.source?.id===id,presentation=routeChoicePresentation(race,{selected});
        const b=document.createElement('button');b.type='button';b.className='event-import';b.dataset.raceId=id;b.setAttribute('aria-pressed',String(selected));b.setAttribute('aria-label',`導入路線：${presentation.name}`);
        const name=document.createElement('span');name.className='route-choice-name';name.textContent=presentation.name;
        const status=document.createElement('span');status.className='race-select-state';status.textContent=presentation.action;b.append(name,status);
        b.addEventListener('click',()=>{closeLibrary({restoreFocus:false});focusRouteHeading();loadRace(id);});
        const pair=document.createElement('div');pair.className='event-route-actions';
        const original=catalogLink('官方原 GPX',race.gpxUrl);original.classList.add('event-original-gpx');original.dataset.routeDownloadId=id;original.setAttribute('aria-label',`${race.name} 官方原始 GPX 下載`);pair.append(b,original);
        if(race.originalDownloadUrl)pair.append(catalogLink('原檔入口',race.originalDownloadUrl));
        if(presentation.qualification){const note=document.createElement('span');note.className=`route-choice-status status-pill ${presentation.qualification.tone}`;note.id=`route-choice-status-${event.id}-${id}`;note.textContent=presentation.qualification.label;b.setAttribute('aria-describedby',note.id);pair.append(note);}
        actions.append(pair);
      }
    }
    if(event.importability==='download_only'||event.importability==='bridge_verified'){
      const previous=event.routeEditionMatchesEvent===false;const linked=new Set(event.routeIds.map(id=>RACES.find(r=>r.id===id)?.gpxUrl).filter(Boolean));
      for(const r of event.routes){if(!r.gpxDownloadUrl||linked.has(r.gpxDownloadUrl))continue;linked.add(r.gpxDownloadUrl);actions.append(catalogLink(`${previous?event.routeYear+' 前屆 ':''}${r.name||'官方'} GPX${event.gpxLinkType==='official_download_page'||r.downloadKind==='google_drive_file_page'?' 入口':''}`,r.gpxDownloadUrl));}
      if(event.officialDownloadPageUrl)actions.append(catalogLink('官方 GPX 入口',event.officialDownloadPageUrl));
      if(event.gpxDownloadUrl&&!linked.has(event.gpxDownloadUrl))actions.append(catalogLink(previous?`${event.routeYear} 前屆 GPX 參考`:event.gpxAvailability==='official_download_page_verified'?'官方 GPX 入口':'官方 GPX 下載',event.gpxDownloadUrl));
    }
    for(const blocked of event.blockedDownloads||[]){actions.append(catalogLink(`${blocked.name} GPX（${blocked.reason}）`,blocked.url));}if(event.gpxCreatedYear){const note=document.createElement('p');note.className='event-warning';note.textContent=`${event.year} 官頁提供，GPX 檔於 ${event.gpxCreatedYear} 建立。`;card.append(note);}
    if(event.routeEditionMatchesEvent===false){const warning=document.createElement('p');warning.className='event-warning';warning.textContent=`連結為 ${event.routeYear} 前屆路線，不代表 ${event.year} 定稿。`;card.append(warning);}
    const detail=document.createElement('details');detail.className='event-source';const summary=document.createElement('summary');summary.textContent='組別、來源與導入狀態';const reason=document.createElement('p');reason.textContent=routeNoticeText(event.importabilityReason);const checked=document.createElement('p');checked.textContent=`官方資料查核 ${event.metadata.verifiedAt.slice(0,10)}；日期為活動期間，各組起跑另依官網。`;const source=catalogLink('查閱資料來源',event.metadata.source);detail.append(summary);if(event.distanceLabels?.length){const distances=document.createElement('p');distances.textContent=event.distanceLabels.join(' · ');detail.append(distances);}if(event.routePageUrl)detail.append(catalogLink('官方路線資訊（GPX 匯出尚未核實）',event.routePageUrl));for(const route of event.routes){if(route.routePageUrl)detail.append(catalogLink(`${route.name||'官方'}路線資訊（GPX 匯出尚未核實）`,route.routePageUrl));}if(event.gpxFilenameYear&&event.gpxFilenameYear!==event.year){const note=document.createElement('p');note.textContent=`官方頁標示 ${event.year} 路線，檔名含 ${event.gpxFilenameYear}；未以檔名推定路線屆別。`;detail.append(note);}detail.append(reason,checked,source);appendRouteChoiceNotes(detail,event.routeIds.map(id=>RACES.find(r=>r.id===id)),document);appendPublishedCheckpointTables(detail,event,document);
    card.prepend(location,title,date);card.append(actions,detail);$('race-list').append(card);
  }
  const countries=new Set(EVENTS.map(e=>e.country));$('catalog-count').textContent=`${EVENTS.length} 屆賽事 · ${countries.size} 個地區 · ${RACES.length} 條可導入 GPX`;$('catalog-empty').hidden=events.length>0||!!catalogIssue;$('catalog-filter-status').textContent=catalogIssue?'路線庫暫不可用；仍可上傳自己的 GPX。':`符合 ${events.length} / ${EVENTS.length} 屆賽事`;$('catalog-clear-filters').hidden=!['race-search','race-region','race-year','race-distance','race-availability'].some(id=>$(id).value);
  refreshCatalogRouteSelection();
}
async function loadRace(id){
  const race=RACES.find(r=>r.id===id);if(!race)return;
  try{assertRouteDownloadAvailable();}catch(error){feedback(error.message,'error');return;}
  $('selected-title').scrollIntoView?.({block:'start',behavior:'auto'});
  const controller=new AbortController(),owner=beginRouteImport(controller,'download'),token=owner.token;
  $('gpx-file').value='';feedback('正在從官方下載 GPX…','busy');
  try{const bytes=await downloadRaceRoute(id,{signal:controller.signal});if(!currentRouteImport(owner))return;await loadBytes(bytes,`${race.name} · ${race.edition} · 官方 GPX`,race);}
  catch(error){if(token!==state.token)return;routeImportFailure(error,race.name,race);}
  finally{if(token===state.token){if(pendingRouteImport===owner)pendingRouteImport=null;state.request=null;state.requestKind=null;busy(false);}}
}
function renderPaceChart(plan){
  const svg=$('pace-chart');svg.replaceChildren();const groups=buildTerrainSegments(plan).map(s=>({start:s.start_m,end:s.end_m,pace:s.pace_s_per_km,label:s.label}));
  if(!groups.length)return;
  const paceLabel=p=>{const n=Math.round(p);return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;};
  const min=Math.min(...groups.map(g=>g.pace)),max=Math.max(...groups.map(g=>g.pace));const low=Math.max(0,Math.floor(min/60)*60-60),high=Math.ceil(max/60)*60+60;const x=m=>48+m/plan.route.distance_m*734;const y=p=>27+(p-low)/Math.max(60,high-low)*142;
  for(let i=0;i<4;i++){const pace=low+(high-low)*i/3;const yy=y(pace);svg.append(svgElement('line',{x1:48,y1:yy,x2:782,y2:yy,class:'pace-grid'}));const t=svgElement('text',{x:40,y:yy+4,'text-anchor':'end'});t.textContent=paceLabel(pace);svg.append(t);}
  let path='';groups.forEach((g,i)=>{const yy=y(g.pace);path+=`${i?'L':'M'}${x(g.start)},${yy} L${x(g.end)},${yy}`;});svg.append(svgElement('path',{d:`${path} L782,177 L48,177 Z`,class:'pace-area'}));svg.append(svgElement('path',{d:path,class:'pace-line'}));
  for(const g of groups){const title=svgElement('title',{});title.textContent=`${(g.start/1000).toFixed(1)}–${(g.end/1000).toFixed(1)} km：${paceLabel(g.pace)}／km`;const hit=svgElement('rect',{x:x(g.start),y:20,width:Math.max(1,x(g.end)-x(g.start)),height:157,fill:'transparent'});hit.append(title);svg.append(hit);}
  for(let i=0;i<=4;i++){const m=plan.route.distance_m*i/4;const t=svgElement('text',{x:x(m),y:199,'text-anchor':i===0?'start':i===4?'end':'middle'});t.textContent=`${(m/1000).toFixed(1)} km`;svg.append(t);}
}
for(const id of ['race-search','race-region','race-year','race-distance','race-availability'])$(id).addEventListener('input',renderCatalog);
$('catalog-clear-filters').addEventListener('click',()=>{const restoreFocus=document.activeElement===$('catalog-clear-filters');for(const id of ['race-search','race-region','race-year','race-distance','race-availability'])$(id).value='';renderCatalog();if(restoreFocus)$('race-search').focus({preventScroll:true});});
$('catalog-retry').addEventListener('click',()=>{try{const events=validateEventCatalog(EVENT_FACTS,RACES),identity=createSourceIdentityIndex(RACES);let optional=null,context=null;try{optional=createOptionalUploadOnlyIndex(RACES);}catch{}try{context=createCourseContextIndex(events,RACES,COURSE_FINGERPRINTS);}catch{}EVENTS=events;sourceIdentityIndex=identity;uploadOnlyIdentityIndex=optional;courseContextIndex=context;catalogIssue='';}catch{catalogIssue='賽事庫資料暫時無法確認。仍可使用自己的 GPX。';}const restoreFocus=document.activeElement===$('catalog-retry');renderCatalog();if(restoreFocus&&$('catalog-retry').hidden)$('race-search').focus({preventScroll:true});});
for(const [id,values] of [['race-region',[...new Set(EVENTS.map(e=>e.country))].sort((a,b)=>a.localeCompare(b,'zh-Hant')).map(c=>[c,c])],['race-year',[...new Set(EVENTS.map(e=>e.year))].sort((a,b)=>b-a).map(y=>[String(y),String(y)])]]){for(const [value,label] of values){const option=document.createElement('option');option.value=value;option.textContent=label;$(id).append(option);}}
$('route-retry').addEventListener('click',()=>{const source=routeRetrySource||state.source;if(source&&source.transport!=='user_upload_only')loadRace(source.id);});
renderCatalog();

function renderComparisons(){
  const plans=[state.plan,...state.comparisons].filter(Boolean).sort((a,b)=>a.target_elapsed_s-b.target_elapsed_s);$('comparison').hidden=plans.length<2;if(plans.length<2)return;
  const summaries=plans.map(p=>buildCheckpointGroups(p,buildTerrainSegments(p)));const rows=summaries[0].rows;
  $('compare-head').replaceChildren();$('compare-rows').replaceChildren();const tr=document.createElement('tr');for(const text of ['區間',...plans.map(p=>clock(p.target_elapsed_s))]){const th=document.createElement('th');th.scope='col';th.textContent=text;tr.append(th);}$('compare-head').append(tr);
  rows.forEach((segment,i)=>{const row=document.createElement('tr');const name=document.createElement('td');name.dataset.label='區間';name.textContent=summaries[0].mode==='checkpoints'?`${segment.start_name} → ${segment.end_name}`:`${segment.label} ${(segment.start_m/1000).toFixed(2)}–${(segment.end_m/1000).toFixed(2)} km`;row.append(name);for(const summary of summaries){const data=summary.rows[i],shown=checkpointRowDisplay(data);const td=document.createElement('td');td.dataset.label=clock(plans[summaries.indexOf(summary)].target_elapsed_s);appendCheckpointTime(td,shown.departure_elapsed_s,state.startTime);const sub=document.createElement('small');sub.textContent=`${paceText(data.elapsed_s/data.distance_m*1000)}／km · 含停留`;td.append(sub);if(data.checkpoint?.cutoff_status==='missed')td.className='missed';row.append(td);}$('compare-rows').append(row);});
}
$('table-view').addEventListener('change',()=>{state.tableView=$('table-view').value;if(state.plan)renderPlan(state.plan);});

function clearDetails(){$('hiking-consent').checked=false;cancelCourseMappingVerification();clearCourseWorkflowPreviews();state.courseUpload=null;state.courseContext=null;renderUploadedCourseContext();officialFactOwner=null;officialPositionGeneration++;$('details-retry').hidden=true;routeQualityUI?.reset();resetElevationLocator();state.originalRoute=null;state.calculationGpx=null;state.calculationDetails=null;state.repairProposal=null;state.surfaceProposal=null;$('surface-apply').hidden=true;$('surface-panel').hidden=true;$('surface-panel').open=false;$('surface-status').textContent='僅整條路線皆有資料時提供參考。';$('profile-derived-label').textContent='處理後資料';state.repairApplied=null;$('repair-panel').hidden=true;$('repair-check').hidden=false;$('repair-status').textContent='';$('repair-apply').hidden=true;$('repair-consent-note').hidden=true;$('download-derived').hidden=true;$('download-repair-record').hidden=true;$('repair-revert').hidden=true;$('profile-layer-label').hidden=true;$('profile-layer').value='original';$('profile-checkpoints').hidden=true;$('profile-cp-select').replaceChildren();$('profile-cp-select').onchange=null;$('profile-cp-detail').textContent='';state.details=null;state.detailStatus=null;$('profile-cursor').disabled=true;$('profile-cursor').oninput=null;$('profile-readout').textContent='—';$('profile').onpointermove=null;$('download-enriched').disabled=true;$('download-original').disabled=true;$('cp-source-note').textContent=state.source?.mappingMode==='official_station_facts_unknown'?'官方站點待核 · 不能視為零站':'可自行加入補給站與停留。';$('route-details').hidden=true;$('detail-content').hidden=true;$('detail-status').hidden=true;$('detail-counts').textContent='';$('elevation-range').textContent='—';$('gpx-metadata').replaceChildren();$('segment-rows').replaceChildren();$('waypoint-list').replaceChildren();}
function formatMeters(value){return Number.isFinite(value)?`${Math.round(value).toLocaleString()} m`:'未知';}
let exportSuggestionCache=null,waypointRenderGeneration=0;
function currentExportSuggestions(){
  if(!state.gpx||!state.details)return {status:'none',suggestions:[],issues:[],markedWaypointIndices:[],archivedWaypointIndices:[]};
  if(exportSuggestionCache?.details!==state.details||exportSuggestionCache?.gpx!==state.gpx)exportSuggestionCache={details:state.details,gpx:state.gpx,result:readExportCheckpointSuggestions({originalBytes:originalBytes(),details:state.details})};
  return exportSuggestionCache.result;
}
function appendUnverifiedCheckpointFacts(parent,claims){
  const fact=claims.catalog_checkpoint_fact?.fact||claims.course_context_fact,lineage=claims.checkpoint_lineage;
  if(!fact&&!lineage)return;
  const text=value=>typeof value==='string'&&value.trim()?value:null,origin=claims.catalog_checkpoint_fact?.source,parts=[];
  const name=text(fact?.name),sourceName=text(origin?.name),edition=origin?.edition??fact?.contextEdition;
  if(sourceName)parts.push(`來源：${sourceName}`);if(name)parts.push(`原站名：${name}`);if(Number.isInteger(edition)&&edition>=2000&&edition<=2100)parts.push(`屆別：${edition}`);
  const distance=fact?.officialDistanceM;parts.push(`公布里程：${Number.isFinite(distance)&&distance>=0?distance/1000+' km':'待核'}`);
  const cutoff=text(fact?.cutoffReported)||text(fact?.reportedCutoffLocal)||text(fact?.cutoffLocal)||text(lineage?.official_cutoff_reported)||text(lineage?.cutoff_local),kind=fact?.cutoffKind??lineage?.official_cutoff_kind;
  parts.push(fact?.cutoffStatus==='no_station_cutoff_reported'?'公布關門：本站不設關門':`公布關門：${cutoff||'待核'}${cutoff?'（'+(kind==='arrival'?'到站':kind==='departure'?'離站':'計時依據待核')+'）':''}`);
  const services=fact?.services,serviceParts=[],flag=value=>value===true?'有':value===false?'無':text(value)||'待核';
  if(services&&typeof services==='object'&&!Array.isArray(services)){for(const [key,label]of [['drink','飲水'],['water','飲水'],['food','飲食']])if(Object.hasOwn(services,key))serviceParts.push(label+'：'+flag(services[key]));for(const key of ['reported','reportedDrink','reportedFood','suppliesLabel','notes'])if(text(services[key]))serviceParts.push(text(services[key]));}
  const publishedServices=text(fact?.published?.publishedServices?.text);if(publishedServices)serviceParts.push(publishedServices);parts.push(`公布補給：${serviceParts.join('；')||'待核'}`);
  if(text(origin?.edition_note))parts.push(origin.edition_note);if(origin?.race_date===null)parts.push('日期待核');
  const disclosure=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('p');
  disclosure.className='export-checkpoint-source-facts';summary.textContent='檔案內站點資料（來源未驗證）';body.className='hint';body.setAttribute('style','overflow-wrap:anywhere');
  body.textContent=parts.join(' · ');
  disclosure.append(summary,body);parent.append(disclosure);
}
function appendExportSuggestion(item,suggestion,renderedOriginal,renderedCalculation,renderedGeneration){
  const note=document.createElement('p');note.className='waypoint-status export-checkpoint-status';
  const reported=suggestion.reportedStopText,reportedStop=typeof reported==='string'&&reported.trim()&&Number.isFinite(Number(reported))&&Number(reported)>=0&&Number(reported)<=86400?`檔案標示停留 ${Number(reported)} 秒（待核）`:reported===null||reported===undefined?'停留未提供':'停留格式待核';
  note.textContent=suggestion.status==='ready'?`匯出站點方案 · ${(suggestion.distanceM/1000).toFixed(6)} km · 停留 ${suggestion.stopS} 秒`:`匯出站點待核對 · ${reportedStop} · ${suggestion.reason}`;item.append(note);
  const details=document.createElement('details'),summary=document.createElement('summary'),preview=document.createElement('p');summary.textContent='核對方案與來源';preview.className='hint';
  preview.textContent=suggestion.status==='ready'?`新增「${suggestion.name}」，里程 ${(suggestion.distanceM/1000).toFixed(9)} km，停留 ${suggestion.stopS} 秒${suggestion.cutoffElapsedS===null?'；關門未知':`；關門 ${clock(suggestion.cutoffElapsedS)}，${suggestion.cutoffKind==='arrival'?'到站':'離站'}判定`}。檔案來源標記未驗證，不自動認定官方站點。`:'原始路線仍可使用。此站點方案未套用；若手動加入候選，停留需自行填寫。';details.append(summary,preview);item.append(details);
  if(suggestion.status!=='ready')return;
  try{appendUnverifiedCheckpointFacts(details,unverifiedCheckpointSourceClaims(suggestion));}catch{/* Adoption reports an unpreservable claim without blocking raw-route viewing. */}
  const button=document.createElement('button');button.type='button';button.className='secondary export-checkpoint-adopt';button.textContent='採用站點與停留';button.dataset.exportReady='true';button.dataset.sourceRouteSha=suggestion.sourceRouteSha256;button.dataset.geometrySha=suggestion.geometrySha256;button.dataset.waypointIndex=String(suggestion.waypointIndex);
  button.addEventListener('click',()=>{
    if(waypointRenderGeneration!==renderedGeneration||item.parentElement!==$('waypoint-list')||button.parentElement!==item||state.details!==renderedOriginal||state.calculationDetails!==renderedCalculation||serviceBusy()||!state.route||state.route.blocked||state.route.geometry_sha256!==suggestion.geometrySha256||state.route.route_sha256!==suggestion.sourceRouteSha256||(state.calculationDetails||state.details).source.route_sha256!==suggestion.sourceRouteSha256)return;
    const existing=[...$('cp-list').children].find(cp=>cp.dataset.importedOccurrenceId===suggestion.occurrenceId&&cp.dataset.importedSourceSha===suggestion.sourceRouteSha256);if(existing){feedback(`此方案已在「${existing.querySelector('.cp-name').value}」，保留目前設定。`);focusErrorField(existing.querySelector('.cp-stop'));return;}
    const sameDistance=[...$('cp-list').children].find(cp=>cp.querySelector('.cp-distance').value.trim()&&Math.abs(Number(cp.querySelector('.cp-distance').value)*1000-suggestion.distanceM)<=1e-6);if(sameDistance){feedback(`此里程已在「${sameDistance.querySelector('.cp-name').value}」，請核對該站；匯出方案未套用。`,'error');focusErrorField(sameDistance.querySelector('.cp-stop'));return;}
    if($('cp-list').children.length>=100){feedback('最多 100 個補給站。','error');return;}
    const estimated=suggestion.coordinateMethod==='estimated_linear_between_source_points',sourceIndex=suggestion.nativeWaypointIndex??suggestion.waypointIndex,choice=estimated?null:currentWaypointChoices().find(c=>c.waypoint.index===sourceIndex&&Math.abs(c.distanceM-suggestion.distanceM)<=1e-6);if(!estimated&&!choice){feedback('位置已變更，請重新核對匯出方案。','error');return;}
    let rawStop,sourceClaims;try{rawStop=formatCpStopMinutes(suggestion.stopS);sourceClaims=unverifiedCheckpointSourceClaims(suggestion);}catch(error){feedback(error.message||'停留時間無法轉換，保留目前站點設定。','error');return;}
    const cp=$('cp-template').content.firstElementChild.cloneNode(true);state.cpCount++;prepareCheckpointRow(cp);cp.querySelector('legend').textContent=`補給站 ${state.cpCount}`;cp.querySelector('.cp-name').value=suggestion.name;cp.querySelector('.cp-distance').value=(suggestion.distanceM/1000).toFixed(9);cp.querySelector('.cp-distance').step='any';cp.querySelector('.cp-stop').value=rawStop;cp.querySelector('.cp-stop').step='any';const kind=cp.querySelector('.cp-kind');if(![...kind.children].some(option=>option.value==='unknown')){const option=document.createElement('option');option.value='unknown';option.textContent='未知';kind.append(option);}cp.querySelector('.cp-cutoff').value=suggestion.cutoffElapsedS===null?'':clock(suggestion.cutoffElapsedS);cp.querySelector('.cp-kind').value=suggestion.cutoffKind||'unknown';
    if(choice){cp.dataset.waypoint=JSON.stringify(choice.waypoint);cp.dataset.waypointAssociation='explicit_user_selected';cp.dataset.mapping=JSON.stringify(choice.candidate);cp.dataset.mappingRouteSha=choice.routeSha;}cp.dataset.importedOccurrenceId=suggestion.occurrenceId;cp.dataset.importedSourceSha=suggestion.sourceRouteSha256;cp.dataset.exportOccurrenceId=`imported-${suggestion.sourceRouteSha256}-${suggestion.waypointIndex}`;cp.dataset.importedSourceClaims=JSON.stringify(sourceClaims);cp.dataset.positionEdited='false';cp.dataset.locationPending='false';
    appendUnverifiedCheckpointFacts(cp,sourceClaims);
    cp.querySelector('.remove-cp').addEventListener('click',()=>{stopRequest();removeCheckpointRow(cp);});const before=[...$('cp-list').children].find(row=>row.querySelector('.cp-distance').value.trim()&&Number(row.querySelector('.cp-distance').value)*1000>suggestion.distanceM);$('cp-list').insertBefore(cp,before||null);serviceMappingRevision++;serviceStopUI?.invalidateMapping();refreshOfficialWaypointChoices();invalidate(false);$('checkpoints-panel').open=true;feedback(`已採用「${suggestion.name}」與 ${suggestion.stopS} 秒停留；來源標記仍待核對。`);
  });item.append(button);
}
function renderDetails(details){
  prepareElevationLocator();refreshOfficialWaypointChoices();refreshOfficialCoordinateChoices();
  const renderedOriginal=state.details,renderedCalculation=state.calculationDetails,renderedGeneration=++waypointRenderGeneration;
  $('route-details').hidden=false;$('detail-content').hidden=false;$('detail-status').hidden=true;
  const summary=details.summary;profile(state.route);if(details.raw_profile_segments?.some(s=>s.points.length)){$('route-ready').hidden=false;$('route-empty').hidden=true;}
  $('detail-counts').textContent=`${summary.point_count.toLocaleString()} 個軌跡點 · ${summary.segment_count} 段 · ${summary.waypoint_count} 個航點`;
  $('elevation-range').textContent=Number.isFinite(summary.elevation_min_m)&&Number.isFinite(summary.elevation_max_m)?`${Math.round(summary.elevation_min_m)}–${Math.round(summary.elevation_max_m)} m`:'未知';
  $('gpx-metadata').replaceChildren();const entries=[['GPX 路線名',details.metadata?.name||'未提供'],['原始描述',details.metadata?.desc||'未提供'],['檔案時間',details.metadata?.time||'未提供'],['原始航點',`${summary.waypoint_count} 個（不自動認定補給站）`],...(state.source?.mappingMode==='official_station_facts_unknown'?[['官方站點','站名、數量與補給服務尚未核實；原始航點只是檔內標記，沒有航點也不能視為零站。']]:[]),['GPX 原始水平累距',Number.isFinite(summary.raw_horizontal_distance_m)?`${(summary.raw_horizontal_distance_m/1000).toFixed(3)} km`:'未知'],['原始爬升／下降',`${formatMeters(summary.raw_ascent_m)} / ${formatMeters(summary.raw_descent_m)}`],['距離說明','圖表顯示原始水平距離；配速距離另計坡面長度。']];
  if(summary.metric_scope)entries.push(['距離範圍',summary.segment_count>1?'各原始路段分開計算，不連接斷段。':'單一路段的沿線距離。']);
  for(const [name,value] of entries){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=name;dd.textContent=value;$('gpx-metadata').append(dt,dd);}
  $('segment-rows').replaceChildren();for(const segment of details.segments){const tr=document.createElement('tr');const values=[segment.name||`路段 ${segment.index+1}`,Number.isFinite(segment.distance_m)?`${(segment.distance_m/1000).toFixed(3)} km`:'未知',formatMeters(segment.ascent_m),formatMeters(segment.descent_m),Number.isFinite(segment.elevation_min_m)&&Number.isFinite(segment.elevation_max_m)?`${Math.round(segment.elevation_min_m)}–${Math.round(segment.elevation_max_m)} m`:'未知',String(segment.point_count)];for(const value of values){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('segment-rows').append(tr);}
  const renderedChoices=currentWaypointChoices(),exportSuggestions=currentExportSuggestions();
  $('waypoint-list').replaceChildren();if(exportSuggestions.issues?.length){const note=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('p');note.className='export-checkpoint-warning';summary.textContent='匯出站點部分待核對';body.textContent=exportSuggestions.issues.join('；');note.append(summary,body);$('waypoint-list').append(note);}if(!details.waypoints.length){const p=document.createElement('p');p.className='hint';p.textContent=state.source?.checkpoints?.length?'這份 GPX 沒有原始航點；官方檢查點另列在站點區，位置需確認。':'這份 GPX 沒有獨立航點。可在「補給站與停留」手動新增。';$('waypoint-list').append(p);return;}
  for(const point of details.waypoints){const item=document.createElement('div');item.className='waypoint-item';const title=document.createElement('div');title.className='waypoint-title';title.textContent=point.name||`未命名航點 ${point.index+1}`;const location=document.createElement('p');location.className='waypoint-position';location.textContent=`${Number(point.lat).toFixed(6)}, ${Number(point.lon).toFixed(6)} · 海拔 ${formatMeters(point.ele)}`;item.append(title,location);
    if(point.desc){const d=document.createElement('details');const sm=document.createElement('summary');sm.textContent='查看原始描述';const p=document.createElement('p');p.className='waypoint-description';p.textContent=point.desc;d.append(sm,p);item.append(d);}
    const exportSuggestion=exportSuggestions.suggestions.find(c=>c.waypointIndex===point.index),isArchived=exportSuggestions.archivedWaypointIndices?.includes(point.index);if(exportSuggestion){appendExportSuggestion(item,exportSuggestion,renderedOriginal,renderedCalculation,renderedGeneration);if(exportSuggestion.status==='ready'){$('waypoint-list').append(item);continue;}}if(isArchived){const archived=document.createElement('p');archived.className='waypoint-status export-checkpoint-archived';archived.textContent='歷次匯出站點 · 非本次方案，停留需另行核對。';item.append(archived);}
    const projection=point.projection,choices=renderedChoices.filter(c=>c.waypoint.index===point.index),coverage=waypointCandidateCoverage(projection);const status=document.createElement('p');status.className='waypoint-status';const statusText={unique:'找到一個沿線位置，請確認後再加入。',ambiguous:'路線在此重複經過，請選擇正確里程。',off_route:'航點離路線較遠，未自動匹配。',unavailable:'這條路線目前不能匹配航點。'};status.textContent=coverage.partial?partialWaypointText(coverage,choices.length):statusText[projection?.status]||'尚未匹配。';item.append(status);
    if(choices.length){const controls=document.createElement('div');controls.className='waypoint-choice';const select=document.createElement('select');select.setAttribute('aria-label',`${point.name||'航點'}的沿線位置`);const blank=document.createElement('option');blank.value='';blank.textContent='選擇沿線里程';select.append(blank);choices.forEach(choice=>{const option=document.createElement('option');option.value=String(choice.passageIndex);option.textContent=`第 ${choice.passageIndex+1} 次 · ${(choice.distanceM/1000).toFixed(6)} km · 距路線 ${Math.round(choice.candidate.offset_m)} m`;select.append(option);});select.value=projection.status==='unique'&&!coverage.partial&&choices.length===1?String(choices[0].passageIndex):'';
      const add=document.createElement('button');add.type='button';add.className='secondary';add.textContent=exportSuggestion||isArchived||exportSuggestions.status==='unavailable'?'手動加入候選，停留待填':'加入補給站';const selected=()=>choices.find(c=>String(c.passageIndex)===select.value);const valid=()=>!!state.route&&!state.route.blocked&&!!selected();const update=()=>{add.disabled=!valid();};select.addEventListener('change',update);update();
      add.addEventListener('click',()=>{if(waypointRenderGeneration!==renderedGeneration||item.parentElement!==$('waypoint-list')||state.details!==renderedOriginal||state.calculationDetails!==renderedCalculation||!state.route||state.route.blocked||serviceBusy()||!valid())return;if($('cp-list').children.length>=100){feedback('最多 100 個補給站。','error');return;}const choice=selected(),linkedProposal=exportSuggestionForNativePassage(currentExportSuggestions(),point.index,choice.distanceM);if(linkedProposal){feedback('此原生經過位置已有匯出站點方案，請核對名稱、里程與停留後採用。');$('waypoint-list').querySelectorAll('.export-checkpoint-adopt').forEach(b=>{if(b.dataset.waypointIndex===String(linkedProposal.waypointIndex))b.focus();});return;}const fresh=currentWaypointChoices().find(x=>x.key===choice.key);if(!fresh||fresh.identity!==choice.identity){status.textContent='位置已變更，請重新選擇。';return;}const conflict=waypointConflict(choice);if(conflict){feedback(`此經過位置已在「${conflict.querySelector('.cp-name').value}」，保留原設定。`,'error');return;}const potential=waypointPotentialConflict(choice);if(potential){feedback(`請回「${potential.querySelector('.cp-name').value}」重新採用來源位置，再加入航點。`,'error');focusWaypointSource(potential);return;}const cp=$('cp-template').content.firstElementChild.cloneNode(true);state.cpCount++;prepareCheckpointRow(cp);cp.querySelector('legend').textContent=`補給站 ${state.cpCount}`;cp.querySelector('.cp-name').value=(point.name||`航點 ${point.index+1}`).slice(0,80);cp.querySelector('.cp-distance').value=(choice.distanceM/1000).toFixed(9);cp.querySelector('.cp-distance').step='any';cp.dataset.waypoint=JSON.stringify(choice.waypoint);cp.dataset.waypointAssociation='explicit_user_selected';cp.dataset.mapping=JSON.stringify(choice.candidate);cp.dataset.mappingRouteSha=choice.routeSha;cp.querySelector('.cp-stop').value='';cp.querySelector('.cp-cutoff').value='';cp.querySelector('.remove-cp').addEventListener('click',()=>{stopRequest();removeCheckpointRow(cp);});$('cp-list').append(cp);refreshOfficialWaypointChoices();invalidate();$('checkpoints-panel').open=true;feedback('已加入候選位置，請確認里程、停留與關門。');});controls.append(select,add);item.append(controls);}
    if(coverage.partial){const manual=document.createElement('button');manual.type='button';manual.className='secondary waypoint-manual-position';manual.textContent='手填其他位置';manual.addEventListener('click',()=>{if(waypointRenderGeneration!==renderedGeneration||item.parentElement!==$('waypoint-list')||state.details!==renderedOriginal||state.calculationDetails!==renderedCalculation)return;$('checkpoints-panel').open=true;$('add-cp').scrollIntoView?.({block:'center'});$('add-cp').focus();feedback('請新增補給站，自行填寫並確認沿線里程。');});item.append(manual);}
    $('waypoint-list').append(item);
  }
  refreshWaypointControls();
}

function currentWaypointChoices(){return collectWaypointChoices(state.details,state.calculationDetails||state.details,state.route,{allowPartial:true});}
function partialWaypointText(coverage,eligible){return coverage.total===null?`候選未完整 · 可選 ${eligible} 處，總數未知`:`候選未完整 · 可選 ${eligible} 處（來源 ${coverage.listed}/${coverage.total}）`;}
function retainedWaypointChoice(point,choice){return !!point&&point.origin_sha256===choice.waypoint.origin_sha256&&point.index===choice.waypoint.index&&point.lat===choice.waypoint.lat&&point.lon===choice.waypoint.lon;}
function officialDistanceText(cp){return Number.isFinite(cp.officialDistanceM)?`官方 ${(cp.officialDistanceM/1000).toFixed(3)} km`:'官方里程未公布';}
function updateOfficialCutoffs(startClock=$($('ability-mode').getAttribute('aria-pressed')==='true'?'prediction-start-time':'start-time').value){
  if(!state.source)return;
  for(const cp of $('cp-list').children){if(!cp.dataset.official||cp.dataset.cutoffEdited==='true')continue;const official=JSON.parse(cp.dataset.official);if(!official.cutoffLocal)continue;try{const seconds=officialCutoffElapsed(state.source,official.cutoffLocal,startClock);cp.querySelector('.cp-cutoff').value=clock(seconds);if(cp.dataset.cutoffConflict){const note=cp.querySelector('.official-cp-note');if(note)note.textContent=officialCpNote(official)+(cp.dataset.cutoffKindConfirmed==='true'?' · 關門依據為自行確認':'');}delete cp.dataset.cutoffConflict;}catch(error){cp.querySelector('.cp-cutoff').value='';cp.dataset.cutoffConflict='true';const note=cp.querySelector('.official-cp-note');if(note)note.textContent=`官方截止 ${official.cutoffLocal.replace('T',' ')} · 起跑設定與截止衝突，請確認`; }if(cp.dataset.cutoffKindConfirmed!=='true')cp.querySelector('.cp-kind').value=cutoffKindKnown(official.cutoffKind)?official.cutoffKind:'unknown';}
}
function waypointRowSnapshot(cp){
  return {waypoint:cp.dataset.waypoint?JSON.parse(cp.dataset.waypoint):null,mapping:cp.dataset.mapping?JSON.parse(cp.dataset.mapping):null,mappingRouteSha:cp.dataset.mappingRouteSha,locationPending:cp.dataset.locationPending==='true',positionEdited:cp.dataset.positionEdited==='true',locationReconfirmed:cp.dataset.locationReconfirmed==='true',distanceRaw:cp.querySelector('.cp-distance').value};
}
function waypointConflict(choice,except=null){return [...$('cp-list').children].find(cp=>cp!==except&&sameWaypointOccurrence(waypointRowSnapshot(cp),choice));}
function waypointPotentialConflict(choice,except=null){return [...$('cp-list').children].find(cp=>cp!==except&&waypointReconfirmationHint(waypointRowSnapshot(cp),choice));}
function focusWaypointSource(cp){focusErrorField(cp.querySelector('.official-waypoint-select')||cp.querySelector('.cp-distance'));}
function officialSourceSummary(cp,record){const distance=Number.isFinite(record.officialDistanceM)?`官方 ${record.officialDistanceM/1000} km`:'官方里程未公布';return `${distance} · ${cp.dataset.cutoffEdited==='true'?(cp.querySelector('.cp-cutoff').value.trim()?'已用手填關門':'關門未填'):record.cutoffStatus==='no_station_cutoff_reported'?'不設本站關門':'關門待核'}`;}
function refreshCheckpointNoStopControls(){
  for(const cp of $('cp-list').children){const noStop=cp.querySelector('.cp-no-stop');if(noStop){noStop.disabled=checkpointNoStopActions.get(cp)?.isEnabled()!==true;noStop.setAttribute('aria-label',`${cp.querySelector('.cp-name').value||'補給站'}：不停留（0 分鐘）`);}}
}
function refreshWaypointControls(){
  refreshCheckpointNoStopControls();
  renderUploadSourceMatch();renderUploadedCourseContext();
  refreshOfficialCoordinateControls();
  const busy=serviceBusy();
  for(const button of $('waypoint-list').querySelectorAll('.export-checkpoint-adopt'))button.disabled=busy||!state.route||state.route.blocked||button.dataset.geometrySha!==state.route.geometry_sha256||button.dataset.sourceRouteSha!==state.route.route_sha256||button.dataset.sourceRouteSha!==(state.calculationDetails||state.details)?.source.route_sha256;
  if(state.source?.waypointSelection==='explicit_gpx_passage'){const rows=[...$('cp-list').children].filter(cp=>cp.dataset.official),pending=rows.filter(cp=>cp.dataset.locationPending==='true'||!cp.querySelector('.cp-distance').value.trim()).length;$('cp-source-note').textContent=`同屆官方 ${state.source.checkpoints.length} 站 · 已加入 ${rows.length} 站${pending?` · ${pending} 站待定位`:rows.length?' · 位置已確認':''}`;}
  for(const cp of $('cp-list').children){const pass=cp.querySelector('.official-pass');if(pass)pass.disabled=busy||pass.hidden||!state.route||state.route.blocked||pass.dataset.hasCandidates!=='true'||pass.dataset.positionGeneration!==String(officialPositionGeneration);timeInputEditor(cp.querySelector('.cp-cutoff'))?.setLabel(`${cp.querySelector('.cp-name').value}，關門時間（起跑後）`);const rowSummary=cp.querySelector('.cp-row-summary');if(rowSummary){const raw=cp.querySelector('.cp-stop').value;rowSummary.textContent=`${cp.querySelector('.cp-name').value} · ${parseCpStopValue(raw).status==='known'?'停留 '+raw+' 分':'停留待確認'}`;}const box=cp.querySelector('.official-waypoint-choice');if(!box||box.classList.contains('official-coordinate-choice'))continue;const select=box.querySelector('select'),button=box.querySelector('button');select.setAttribute('aria-label',`${cp.querySelector('.cp-name').value}的 GPX 經過位置`);select.disabled=busy||!state.route||state.route.blocked||box.dataset.hasChoices!=='true';button.disabled=select.disabled||select.value==='';const point=cp.dataset.waypoint?JSON.parse(cp.dataset.waypoint):null,status=box.querySelector('.official-waypoint-status'),signature=JSON.stringify([cp.dataset.mapping,cp.dataset.mappingRouteSha,cp.dataset.locationPending,cp.dataset.positionEdited,cp.dataset.locationReconfirmed]);if(box.dataset.sourceStatus!==signature){box.dataset.sourceStatus=signature;const trusted=!!point&&cp.dataset.mappingRouteSha===(state.calculationDetails||state.details)?.source?.route_sha256&&cp.dataset.mapping&&cp.dataset.locationPending!=='true'&&cp.dataset.positionEdited!=='true';status.textContent=point?trusted?`已採用 ${point.name||'未命名航點'} · ${Number(cp.querySelector('.cp-distance').value).toFixed(3)} km`:`來源待重新確認：${point.name||'未命名航點'}`:'';status.hidden=!point;status.className='hint official-waypoint-status'+(point&&!trusted?' source-unconfirmed':'');}const summary=cp.querySelector('.official-source-summary');if(summary&&cp.dataset.official)summary.textContent=officialSourceSummary(cp,JSON.parse(cp.dataset.official));}
}
function refreshOfficialWaypointChoices(){
  const original=state.details,current=state.calculationDetails||original,route=state.route,source=state.source;
  const allChoices=currentWaypointChoices();
  for(const cp of $('cp-list').children){
    const official=cp.dataset.official?JSON.parse(cp.dataset.official):null,retained=cp.dataset.waypoint?JSON.parse(cp.dataset.waypoint):null,arbitrary=!!official&&source?.waypointSelection==='explicit_gpx_passage'&&source.checkpoints.some(p=>p.id===official.id);if(!arbitrary&&(!retained||retained.origin_sha256!==original?.source?.route_sha256))continue;
    const choices=arbitrary?allChoices:allChoices.filter(c=>retainedWaypointChoice(retained,c));
    cp.querySelector('.official-waypoint-choice')?.remove();const obsolete=cp.querySelector('.official-pass');if(obsolete){obsolete.hidden=true;obsolete.disabled=true;}
    const box=document.createElement('div');box.className='official-waypoint-choice';box.dataset.hasChoices=String(choices.length>0);
    const label=document.createElement('label'),caption=document.createElement('span'),select=document.createElement('select');caption.textContent='GPX 經過位置';select.className='official-waypoint-select';select.setAttribute('aria-label',`${cp.querySelector('.cp-name').value}的 GPX 經過位置`);const blank=document.createElement('option');blank.value='';blank.textContent=choices.length?'請自行對應航點與里程':route?.blocked?'處理路線後可選位置':'目前無可用位置';select.append(blank);
    for(const choice of choices){const option=document.createElement('option');option.value=choice.key;option.textContent=choice.label;select.append(option);}select.value='';label.append(caption,select);
    const button=document.createElement('button');button.type='button';button.className='secondary official-waypoint-adopt';button.textContent='採用位置';button.disabled=true;
    const note=document.createElement('p');note.className='hint official-waypoint-status';note.setAttribute('role','status');note.textContent='';note.hidden=true;
    const rowId=cp.dataset.cpId;select.addEventListener('change',()=>{box.dataset.sourceStatus='';refreshWaypointControls();if(select.value){note.textContent='確認後只更新此站位置。';note.hidden=false;}});
    button.addEventListener('click',()=>{
      if(serviceBusy()||state.source!==source||state.details!==original||(state.calculationDetails||state.details)!==current||state.route!==route||cp.parentElement!==$('cp-list')||cp.dataset.cpId!==rowId)return;
      const choice=choices.find(c=>c.key===select.value),fresh=currentWaypointChoices().find(c=>c.key===select.value);
      if(!choice||!fresh||choice.identity!==fresh.identity){note.textContent='位置已變更，請重新選擇。';return;}
      if(sameWaypointOccurrence(waypointRowSnapshot(cp),choice)){note.textContent=`已採用 ${choice.label}`;return;}
      const conflict=waypointConflict(choice,cp);if(conflict){note.hidden=false;note.textContent=`此經過位置已在「${conflict.querySelector('.cp-name').value}」，保留原設定。`;return;}const potential=waypointPotentialConflict(choice,cp);if(potential){note.hidden=false;note.textContent=`請回「${potential.querySelector('.cp-name').value}」重新採用來源位置。`;focusWaypointSource(potential);return;}
      serviceMappingRevision++;serviceStopUI?.invalidateMapping();
      cp.querySelector('.cp-distance').value=(choice.distanceM/1000).toFixed(9);cp.dataset.mapping=JSON.stringify(choice.candidate);cp.dataset.mappingRouteSha=choice.routeSha;cp.dataset.waypoint=JSON.stringify(choice.waypoint);cp.dataset.waypointAssociation='explicit_user_selected';cp.dataset.positionEdited='false';cp.dataset.locationPending='false';cp.dataset.locationReconfirmed='false';cp.querySelector('.cp-position-actions').hidden=true;cp.querySelector('.cp-location-note').hidden=true;cp.querySelector('.confirm-cp-location').hidden=true;cp.querySelector('.cp-location-help').hidden=true;
      note.textContent=`已採用 ${choice.label}`;invalidate(false);feedback('此站位置已更新，其他設定已保留。');cp.querySelector('.cp-distance').focus();
    });box.append(label,button,note);const partialPoints=(current?.waypoints||[]).filter(p=>p.projection?.candidates_truncated===true&&(arbitrary||retained&&p.index===retained.index&&p.lat===retained.lat&&p.lon===retained.lon));if(partialPoints.length){const partial=document.createElement('p');partial.className='hint waypoint-partial-status';partial.textContent=partialPoints.map(p=>`${p.name||'航點'} · ${partialWaypointText(waypointCandidateCoverage(p.projection),choices.filter(c=>c.waypoint.index===p.index).length)}`).join('；');const manual=document.createElement('button');manual.type='button';manual.className='secondary waypoint-manual-position';manual.textContent='手填其他位置';manual.addEventListener('click',()=>{if(state.details!==original||(state.calculationDetails||state.details)!==current||cp.parentElement!==$('cp-list'))return;cp.querySelector('.cp-distance').focus();});box.append(partial,manual);}cp.append(box);
  }
  refreshWaypointControls();
}
function currentOfficialCoordinateChoices(){return collectOfficialCoordinateChoices(state.source,state.details,state.calculationDetails||state.details,state.route);}
function officialCoordinateRow(cp){return {official:cp.dataset.official?JSON.parse(cp.dataset.official):null,mapping:cp.dataset.mapping?JSON.parse(cp.dataset.mapping):null,mappingRouteSha:cp.dataset.mappingRouteSha,association:cp.dataset.officialAssociation,locationPending:cp.dataset.locationPending==='true',positionEdited:cp.dataset.positionEdited==='true',locationReconfirmed:cp.dataset.locationReconfirmed==='true',distanceRaw:cp.querySelector('.cp-distance').value};}
function refreshOfficialCoordinateControls(){
  const busy=serviceBusy(),rows=[...$('cp-list').children].filter(cp=>cp.dataset.official);
  if(state.source?.coordinateSelection==='explicit_official_passage'){$('cp-source-note').textContent=`官方 ${state.source.officialCheckpointCount} 個檢查點 · 已加入 ${rows.length} 站 · ${rows.filter(cp=>cp.dataset.locationPending==='true').length} 站待定位 · 補給服務與關門待核`;}
  for(const cp of rows){const box=cp.querySelector('.official-coordinate-choice');if(!box)continue;const select=box.querySelector('select'),button=box.querySelector('button'),status=box.querySelector('.official-coordinate-status');select.setAttribute('aria-label',`${cp.querySelector('.cp-name').value}的官方座標經過位置`);select.disabled=busy||!state.route||state.route.blocked||box.dataset.hasChoices!=='true';button.disabled=select.disabled||select.value==='';const trusted=currentOfficialCoordinateChoices().some(choice=>sameOfficialCoordinateOccurrence(officialCoordinateRow(cp),choice));if(cp.dataset.officialAssociation){status.textContent=trusted?'已採用官方座標經過位置':'來源待重新確認；手填確認不會採用官方座標';status.hidden=false;} }
}
function refreshOfficialCoordinateChoices(){
  if(state.source?.coordinateSelection!=='explicit_official_passage')return;
  const source=state.source,original=state.details,current=state.calculationDetails||original,route=state.route,all=currentOfficialCoordinateChoices();
  for(const cp of $('cp-list').children){const official=cp.dataset.official?JSON.parse(cp.dataset.official):null;if(!source.checkpoints.some(item=>item.id===official?.id))continue;
    cp.querySelector('.official-coordinate-choice')?.remove();const old=cp.querySelector('.official-pass');if(old){old.hidden=true;old.disabled=true;}
    const box=document.createElement('div');box.className='official-coordinate-choice official-waypoint-choice';const choices=all.filter(choice=>choice.checkpointId===official.id);box.dataset.hasChoices=String(choices.length>0);
    const label=document.createElement('label'),caption=document.createElement('span'),select=document.createElement('select');caption.textContent='官方座標經過位置';select.className='official-coordinate-select';const blank=document.createElement('option');blank.value='';blank.textContent=choices.length?'請選擇位置，再按採用':'目前無完整可用候選，請手填並確認';select.append(blank);
    for(const choice of choices){const option=document.createElement('option');option.value=choice.key;option.textContent=choice.label;select.append(option);}select.value='';label.append(caption,select);
    const button=document.createElement('button');button.type='button';button.className='secondary official-coordinate-adopt';button.textContent='採用位置';button.disabled=true;
    const note=document.createElement('p');note.className='hint official-coordinate-status';note.setAttribute('role','status');note.hidden=true;
    const rowId=cp.dataset.cpId;select.addEventListener('change',()=>{refreshOfficialCoordinateControls();if(select.value){note.textContent='座標沿原始路線估算；採用後只更新此站位置。';note.hidden=false;}});
    button.addEventListener('click',()=>{
      if(serviceBusy()||state.source!==source||state.details!==original||(state.calculationDetails||state.details)!==current||state.route!==route||cp.parentElement!==$('cp-list')||cp.dataset.cpId!==rowId||cp.querySelector('.official-coordinate-choice')!==box)return;
      const selected=choices.find(choice=>choice.key===select.value),fresh=currentOfficialCoordinateChoices().find(choice=>choice.key===select.value);if(!selected||!fresh||selected.identity!==fresh.identity){note.textContent='位置已變更，請重新選擇。';note.hidden=false;return;}
      if(sameOfficialCoordinateOccurrence(officialCoordinateRow(cp),fresh))return;
      serviceMappingRevision++;serviceStopUI?.invalidateMapping();cp.querySelector('.cp-distance').value=(fresh.distanceM/1000).toFixed(9);cp.dataset.mapping=JSON.stringify(fresh.candidate);cp.dataset.mappingRouteSha=fresh.routeSha;cp.dataset.officialAssociation='explicit_user_selected_official_pin';cp.dataset.positionEdited='false';cp.dataset.locationPending='false';cp.dataset.locationReconfirmed='false';cp.querySelector('.cp-position-actions').hidden=true;cp.querySelector('.cp-location-note').hidden=true;cp.querySelector('.confirm-cp-location').hidden=true;cp.querySelector('.cp-location-help').hidden=true;
      invalidate(false);feedback('此站位置已採用，名稱、停留與關門已保留。');cp.querySelector('.cp-distance').focus();
    });box.append(label,button,note);cp.append(box);
  }refreshOfficialCoordinateControls();
}
function officialCpNote(record){if(!record)return '';const parts=[officialDistanceText(record)];if(record.stationType==='timing_only_checkpoint')parts.push('僅計時站');if(record.stationType==='official_checkpoint_services_unverified')parts.push('檢查點 · 補給服務待核');if(record.cutoffStatus==='no_station_cutoff_reported')parts.push('官方不設本站關門');else if(record.cutoffReported)parts.push(`官表關門 ${record.cutoffReported}（計時基準、到離站待確認）`);else if(record.cutoffLocal)parts.push(`${record.cutoffKind==='arrival'?'到站':record.cutoffKind==='departure'?'離站':'依據待確認'}截止 ${record.cutoffLocal.replace('T',' ')}`);else parts.push(['edition_year_mismatch','finish_banner_conflict','conflict'].includes(record.cutoffStatus)?'官方截止待核':'未提供關門');if(record.publishedTable){const p=record.published;if(p?.derivedCumulativeDistanceKm!==undefined)parts.push(`官表分段加總 ${p.derivedCumulativeDistanceKm} km（推導值，非目前位置）`);if(p?.reportedNextLegDistanceKm!==null&&p?.reportedNextLegDistanceKm!==undefined)parts.push(`公布下站 ${p.reportedNextLegDistanceKm} km`);if(p?.reportedStationId?.text)parts.push(`官表代號 ${p.reportedStationId.text}`);if(p?.publishedServices?.text)parts.push(`公布補給 ${p.publishedServices.text}`);if(p?.publishedMedicalMarker?.text)parts.push(`醫護欄 ${p.publishedMedicalMarker.text}`);}if(record.mapping_method==='official_distance_only_requires_user_position')parts.push('請確認沿線里程');return parts.join(' · ');}
let officialFactOwner=null,officialPositionGeneration=0;
function configureOfficialPosition(cp,record){
  cp.dataset.official=JSON.stringify(record);
  const field=cp.querySelector('.cp-distance'),untouched=cp.dataset.locationPending!=='true'&&!field.value.trim()&&cp.dataset.positionEdited!=='true'&&cp.dataset.locationReconfirmed!=='true'&&!cp.dataset.mapping&&!cp.dataset.waypoint&&!cp.dataset.officialAssociation;
  const source=state.source,raw=state.gpx,details=state.calculationDetails||state.details,route=state.route,rowId=cp.dataset.cpId,generation=officialPositionGeneration;
  cp.querySelector('.official-pass')?.remove();
  const setCandidate=c=>{field.value=(c.distance_m/1000).toFixed(9);cp.dataset.mapping=JSON.stringify(c);cp.dataset.mappingRouteSha=details?.source?.route_sha256||'';cp.dataset.positionEdited='false';if(source?.coordinateSelection!=='explicit_official_passage'&&source?.waypointSelection!=='explicit_gpx_passage'){cp.dataset.locationPending='false';cp.dataset.locationReconfirmed='false';cp.querySelector('.cp-position-actions').hidden=true;cp.querySelector('.cp-location-note').hidden=true;cp.querySelector('.confirm-cp-location').hidden=true;cp.querySelector('.cp-location-help').hidden=true;}};
  if(record.status==='unique'&&source?.coordinateSelection!=='explicit_official_passage'&&source?.waypointSelection!=='explicit_gpx_passage'&&untouched){
    setCandidate(record.candidates[0]);
  }else{
    const select=document.createElement('select');select.className='official-pass';select.dataset.positionGeneration=String(generation);select.dataset.hasCandidates=String(record.candidates.length>0);select.setAttribute('aria-label',`${record.name}選擇經過里程`);const blank=document.createElement('option');blank.value='';blank.textContent=record.mapping_conflict?'官方站序與路線位置不一致，請確認':record.status==='ambiguous'?'同座標重複經過，請選擇里程':record.mapping_method==='official_distance_only_requires_user_position'?'請在沿線里程欄確認位置':'尚無可確認的GPX位置';select.append(blank);record.candidates.forEach((c,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=`${(c.distance_m/1000).toFixed(3)} km${Number.isFinite(c.offset_m)?`（距路線 ${Math.round(c.offset_m)} m）`:`（原始點 ${c.source_point_index+1}）`}`;select.append(o);});
    select.addEventListener('change',()=>{if(select.disabled||source?.coordinateSelection==='explicit_official_passage'||source?.waypointSelection==='explicit_gpx_passage'||serviceBusy()||officialPositionGeneration!==generation||state.source!==source||state.gpx!==raw||(state.calculationDetails||state.details)!==details||state.route!==route||cp.parentElement!==$('cp-list')||cp.dataset.cpId!==rowId||cp.querySelector('.official-pass')!==select)return;const candidate=record.candidates[Number(select.value)];if(select.value!==''&&!candidate)return;stopRequest();if(select.value!=='')setCandidate(candidate);else{field.value='';delete cp.dataset.mapping;delete cp.dataset.mappingRouteSha;}invalidate();});cp.append(select);
  }
}
function createOfficialCp(record){
  const cp=$('cp-template').content.firstElementChild.cloneNode(true);state.cpCount++;prepareCheckpointRow(cp);cp.querySelector('legend').textContent=`${record.stationType==='timing_only_checkpoint'?'計時站':record.stationType==='official_checkpoint_services_unverified'?'檢查點':'補給站'} ${state.cpCount}`;cp.querySelector('.cp-name').value=record.name.slice(0,80);cp.querySelector('.cp-stop').value='';cp.querySelector('.cp-distance').step='any';
  const note=document.createElement('p');note.className='official-cp-note';note.textContent=officialCpNote(record);if(record.mapping_method==='projected_official_coordinate_with_ordered_passages')note.textContent+=' · 位置沿原始路線估算';if(state.source?.waypointSelection==='explicit_gpx_passage'&&record.cutoffStatus!=='no_station_cutoff_reported'){const detail=document.createElement('details');detail.className='official-cp-source';const summary=document.createElement('summary');summary.className='official-source-summary';summary.textContent=officialSourceSummary(cp,record);detail.append(summary,note);cp.append(detail);}else cp.append(note);
  if(!cutoffKindKnown(record.cutoffKind)){const option=document.createElement('option');option.value='unknown';option.textContent='尚未確認';cp.querySelector('.cp-kind').append(option);cp.querySelector('.cp-kind').value='unknown';}
  configureOfficialPosition(cp,record);
  if(state.source?.waypointSelection==='explicit_gpx_passage'||state.source?.coordinateSelection==='explicit_official_passage'){cp.querySelector('.cp-position-actions').hidden=false;cp.dataset.locationPending='true';const pending=cp.querySelector('.cp-location-note');pending.textContent='待定位';pending.hidden=false;cp.querySelector('.confirm-cp-location').hidden=false;cp.querySelector('.cp-location-help').hidden=false;cp.querySelector('.cp-location-help').querySelector('p').textContent=state.source?.coordinateSelection==='explicit_official_passage'?'官方座標只是候選位置。請選擇並採用正確經過位置，或手填並確認沿線里程。':'官方里程供核對。請選擇 GPX 經過位置，或自行填寫並確認沿線里程。';}
  const rowSource=state.source,rowGpx=state.gpx,rowId=cp.dataset.cpId;cp.querySelector('.remove-cp').addEventListener('click',()=>{if(cp.parentElement!==$('cp-list')||cp.dataset.cpId!==rowId||state.source!==rowSource||state.gpx!==rowGpx)return;stopRequest();removeCheckpointRow(cp);});$('cp-list').append(cp);return cp;
}
function applyOfficialCheckpoints({factsOnly=false}={}){
  const source=state.source;if(!source?.checkpoints?.length){$('cp-source-note').textContent=source?.mappingMode==='official_station_facts_unknown'?'官方站點待核 · 不能視為零站':'可自行加入補給站與停留。';return;}if(!state.route)return;
  const facts=officialCheckpointFacts(source,state.originalRoute||state.route),mappingDetails=factsOnly||state.sourceProjectionPending&&missingSourceProjections(source,state.calculationDetails||state.details)?null:state.calculationDetails||state.details,mappingSource=state.repairApplied?{...source,sha256:state.repairApplied.derived_sha256}:source;
  const records=(mappingDetails?mapOfficialCheckpoints(mappingSource,mappingDetails):facts).map((r,index)=>({...r,catalogIndex:index,mapping_gpx_sha256:mappingDetails?.source?.route_sha256||null,original_gpx_sha256:source.sha256,derived_mapping:!!state.repairApplied})).filter(r=>r.kind==='checkpoint');
  const initial=officialFactOwner?.source!==source||officialFactOwner?.gpx!==state.gpx;if(initial)officialFactOwner={source,gpx:state.gpx};
  for(const record of records){const key=JSON.stringify([source.id,source.sha256,record.catalogIndex]);let cp=[...$('cp-list').children].find(row=>row.dataset.officialFactKey===key);if(!cp){if(!initial)continue;cp=createOfficialCp(record);cp.dataset.officialFactKey=key;}else{configureOfficialPosition(cp,record);const note=cp.querySelector('.official-cp-note');if(note)note.textContent=officialCpNote(record)+(record.mapping_method==='projected_official_coordinate_with_ordered_passages'?' · 位置沿原始路線估算':'');}}
  const rows=[...$('cp-list').children].filter(cp=>cp.dataset.officialFactKey&&cp.dataset.official),pending=rows.filter(cp=>cp.dataset.locationPending==='true'||!cp.querySelector('.cp-distance').value.trim()).length;
  $('cp-source-note').textContent=`同屆官方 ${records.length} 站 · 已加入 ${rows.length} 站${pending?` · ${pending} 站待定位`:''}`;$('cp-count').textContent=`${$('cp-list').children.length} 站`;if(pending)$('checkpoints-panel').open=true;updateOfficialCutoffs();refreshOfficialWaypointChoices();refreshOfficialCoordinateChoices();profile(state.route);
}
function validateOriginalDetails(details,expected,source){
  const record=value=>!!value&&typeof value==='object'&&!Array.isArray(value),count=(value,max)=>Number.isSafeInteger(value)&&value>=0&&value<=max;
  const fail=()=>{throw new Error('詳細資料與目前 GPX 版本不一致。');};
  if(!record(details)||!record(details.source)||details.source.route_sha256!==expected||!record(details.summary)||!Array.isArray(details.raw_profile_segments)||!Array.isArray(details.segments)||!Array.isArray(details.waypoints))fail();
  // Check the nested containers consumed by profile/details rendering before
  // any accepted state is replaced. This adds no new GPX parsing authority.
  const summary=details.summary;
  if(!count(summary.point_count,50000)||!count(summary.segment_count,2000)||!count(summary.waypoint_count,200)||!count(summary.missing_elevation_point_count,50000)||details.raw_profile_segments.length>2000||details.segments.length>2000||details.waypoints.length>200)fail();
  let points=0;
  for(const segment of details.raw_profile_segments){
    if(!record(segment)||!Array.isArray(segment.points)||(points+=segment.points.length)>50000)fail();
    for(const point of segment.points)if(!record(point)||!Number.isFinite(point.lat)||!Number.isFinite(point.lon)||!Number.isFinite(point.horizontal_m)||!(point.ele===null||Number.isFinite(point.ele)))fail();
  }
  if(details.segments.some(segment=>!record(segment))||details.profile_geometry!==undefined&&details.profile_geometry!==null&&(!Array.isArray(details.profile_geometry)||details.profile_geometry.some(cell=>!record(cell))))fail();
  for(const point of [...details.waypoints,...(details.official_waypoints??[])]){
    if(!record(point)||!Number.isFinite(point.lat)||!Number.isFinite(point.lon)||point.name!==undefined&&point.name!==null&&typeof point.name!=='string')fail();
    const projection=point.projection;if(projection!==undefined&&projection!==null&&(!record(projection)||projection.candidates!==undefined&&(!Array.isArray(projection.candidates)||projection.candidates.some(candidate=>!record(candidate)))))fail();
  }
  if(source?.checkpoints?.length)mapOfficialCheckpoints(source,details);
}
function installOriginalDetails(details){
  validateOriginalDetails(details,(state.originalRoute||state.route)?.route_sha256,state.source);
  const previous=state.details;state.details=details;
  try{renderDetails(details);applyOfficialCheckpoints();state.detailStatus=null;$('details-retry').hidden=true;void refreshUploadedCourseFingerprint(details);}
  catch(error){state.details=previous;throw error;}
}
function showOptionalDetailsFailure(error){
  state.detailStatus='原始軌跡詳細資料未完成';profile(state.route);$('detail-content').hidden=!state.details;$('detail-status').textContent=`詳細資料未完成：${error.message}`;$('detail-status').hidden=false;$('details-retry').hidden=false;feedback('路線與已知站點已保留，可重試詳細資料。','error');
}
// A fatal recheck retires only the exact accepted raw source. Candidate-derived
// failures and stale/canceled callbacks must keep the still-admitted source.
function rejectAcceptedRawSource(error,raw){
  if(error?.admissionRejected!==true||!raw||state.gpx!==raw)return false;
  stopRequest();state.gpx=null;state.route=null;state.originalFileName='';$('gpx-file').value='';$('cp-list').replaceChildren();state.cpCount=0;
  invalidate(false);clearRouteDisplay('來源未通過檢查');$('route-state').className='status-pill error';$('file-name').textContent='來源未通過檢查，請重新導入路線。';$('route-retry').hidden=!state.source||state.source.transport==='user_upload_only';
  feedback(`${error.message} 請重新導入路線。`,'error');busy(false);return true;
}
function cancelDetailsRetry(){
  if(state.requestKind!=='details-retry')return false;
  state.token++;state.request?.abort();transport.cancel();state.request=null;state.requestKind=null;showOptionalDetailsFailure(new Error('已取消'));busy(false);return true;
}
$('details-retry').addEventListener('click',async()=>{
  if(!state.gpx||!state.route||state.details&&!state.sourceProjectionPending||state.calculationGpx||serviceBusy())return;
  const raw=state.gpx,source=state.source,route=state.route,token=++state.token,controller=new AbortController();state.request=controller;state.requestKind='details-retry';busy(true);$('detail-status').textContent='正在重試詳細資料…';
  try{const details=await api('/api/details',detailsPayload(raw),controller);if(token!==state.token||state.gpx!==raw||state.source!==source||state.route!==route)return;installOriginalDetails(details);state.sourceProjectionPending=false;renderUploadSourceMatch();feedback('詳細資料已讀取，站點設定已保留。');}
  catch(error){if(token!==state.token||state.gpx!==raw||state.source!==source)return;if(!rejectAcceptedRawSource(error,raw))showOptionalDetailsFailure(error);}
  finally{if(token===state.token){state.request=null;state.requestKind=null;busy(false);}}
});
function profileElevationLabel(value){return Number.isFinite(value)?`${Number(value.toFixed(1))} m`:'海拔缺失';}
function calculationGpx(){return state.calculationGpx||state.gpx;}
function decodeGpx(value){const raw=atob(value);return Uint8Array.from(raw,c=>c.charCodeAt(0));}
function surfaceApplied(){return state.repairApplied?.proposal?.derivation_kind==='whole_provider_surface';}
function surfaceProposalStatus(summary,originalRoute){
 const ascent=Number.isFinite(summary.derived_ascent_m)?`參考爬升 ${Math.round(summary.derived_ascent_m)} m`:'參考爬升未知';
 const coverage=`涵蓋 ${summary.point_count}／${summary.point_count} 點 · ${ascent}`;
 if(summary.preview_core_blocked)return coverage+' · 參考版未通過路線檢查';
 if(!summary.preview_has_out_of_domain)return coverage;
 const originalRunningEligible=originalRoute?.blocked===false&&originalRoute.elevation_complete===true&&Array.isArray(originalRoute.quality)&&!originalRoute.quality.some(item=>item.code==='grade_out_of_domain');
 return coverage+(originalRunningEligible?' · 原始跑步可用，參考版超域':' · 參考版超出跑步範圍');
}
function calculationProvenance(){return state.repairApplied?{calculation_source:surfaceApplied()?'explicit_provider_surface_reference':'explicit_derived_route',original_sha256:state.repairApplied.proposal.original_sha256,derived_sha256:state.repairApplied.derived_sha256,repair_profile:state.repairApplied.proposal}: {calculation_source:'original_gpx',...(state.drawnProvenance?{drawn_route:state.drawnProvenance}:{})};}
function detailsPayload(gpx,source=state.source,surfaceReference=false){return {gpx_b64:gpx,...(source?.mappingMode==='projected_official_coordinates'?{official_waypoints:source.checkpoints.map(cp=>({name:cp.name,lat:cp.lat,lon:cp.lon,ele:surfaceReference?null:cp.elevationM??null}))}:{})};}
function localRepairEligible(proposal){const q=proposal?.summary;return !!(q&&!q.preview_core_blocked&&(q.missing_elevations_filled||q.conflicting_coordinate_groups_merged));}
async function prepareRepair(controller,token){
 const raw=state.gpx,route=state.route,current=()=>token===state.token&&state.request===controller&&!controller.signal.aborted&&state.gpx===raw&&state.route===route;
 $('repair-panel').hidden=false;$('repair-status').textContent='正在檢查可處理的局部資料…';$('repair-apply').hidden=true;$('repair-consent-note').hidden=true;state.requestKind='repair-propose';
 try{const proposal=await transport.request('repair_propose',{gpx_b64:raw},{signal:controller.signal});if(!current())return;state.repairProposal=proposal;const q=proposal.summary;const allowed=localRepairEligible(proposal);$('repair-status').textContent=allowed?repairProposalStatus(q):'目前資料不適合局部處理，可先檢視原始軌跡。';$('repair-apply').hidden=!allowed;$('repair-consent-note').hidden=!allowed;}
 catch(error){if(!current())return;if(rejectAcceptedRawSource(error,raw))return;state.repairProposal=null;$('repair-status').textContent=error.name==='AbortError'?'檢查已取消。':`暫無可套用的處理：${error.message}`;}
}
$('repair-check').addEventListener('click',async()=>{if(!state.gpx||!state.route||state.request||state.calculationGpx)return;stopRequest({preserveGoalInputRevision:true,preserveAcceptedResults:true});const token=state.token,controller=new AbortController();state.request=controller;state.requestKind='repair-propose';busy(true);try{await prepareRepair(controller,token);}finally{if(token===state.token){state.request=null;state.requestKind=null;busy(false);}}});
$('surface-check').addEventListener('click',async()=>{
 if(!state.gpx||!state.route||!state.details||state.request||state.calculationGpx)return;
 stopRequest({preserveGoalInputRevision:true,preserveAcceptedResults:true});const raw=state.gpx,route=state.route,token=state.token,controller=new AbortController();state.request=controller;state.requestKind='repair-surface-propose';state.surfaceProposal=null;$('surface-apply').hidden=true;$('surface-status').textContent='正在核對整條路線的來源支持…';busy(true);
 const current=()=>token===state.token&&state.request===controller&&!controller.signal.aborted&&state.gpx===raw&&state.route===route;
 try{const proposal=await transport.request('surface_propose',{gpx_b64:raw},{signal:controller.signal});if(!current())return;if(proposal.original_sha256!==state.details.source.route_sha256||proposal.derivation_kind!=='whole_provider_surface'||proposal.summary.coverage_percent!==100)throw Error('地表參考提案與原始路線不符。');state.surfaceProposal=proposal;const q=proposal.summary;$('surface-status').textContent=surfaceProposalStatus(q,route);$('surface-apply').hidden=q.preview_core_blocked;}
 catch(error){if(!current())return;if(rejectAcceptedRawSource(error,raw))return;state.surfaceProposal=null;$('surface-status').textContent=error.message;}
 finally{if(token===state.token){state.request=null;state.requestKind=null;busy(false);}}
});
async function applyDerivedProposal(proposal,isSurface=false){if(!state.details){feedback('請先重試詳細資料，再套用處理。','error');return;}
 if(!state.gpx||!proposal||state.request||state.calculationGpx)return;
 const proposalKey=isSurface?'surfaceProposal':'repairProposal',approved=proposal.derived_profile_sha256,originalRoute=state.route,originalDetails=state.details,acceptedPlan=state.plan;
 // Building and inspecting a candidate does not replace the accepted route/result.
 // Keep input ownership until the verified derived route reaches its commit point.
 stopRequest({preserveGoalInputRevision:true,preserveAcceptedResults:true});const token=state.token,controller=new AbortController();state.request=controller;state.requestKind=isSurface?'repair-surface-apply':'repair-apply';
 const owner=captureCourseWorkflow(),source=stationClockSourceIdentity();
 const current=()=>{try{if(token!==state.token||state.request!==controller||controller.signal.aborted||state[proposalKey]!==proposal||!courseWorkflowCurrent(owner))return false;const now=stationClockSourceIdentity();return Object.entries(source).every(([key,value])=>now[key]===value);}catch{return false;}};
 const stagedCurrent=()=>{if(current())return true;if(token===state.token&&state.plan===acceptedPlan){invalidate(false);feedback('設定或路線已變更，請重新檢查處理提案。');}return false;};
 let checkingOriginal=true,committing=false;busy(true);$('repair-status').textContent='正在建立計算用版本並重新檢查…';
 try{
  const applied=await transport.request(isSurface?'surface_apply':'repair_apply',{gpx_b64:owner.originalGpx,approved_profile_sha256:approved,confirmed:true},{signal:controller.signal});if(!stagedCurrent())return;
  checkingOriginal=false;const route=await api('/api/inspect',{gpx_b64:applied.derived_gpx_b64},controller);if(!stagedCurrent())return;
  const details=await api('/api/details',detailsPayload(applied.derived_gpx_b64,state.source,isSurface),controller);if(!stagedCurrent())return;
  if(route.blocked||route.route_sha256!==applied.derived_sha256||details.source.route_sha256!==applied.derived_sha256||applied.proposal.original_sha256!==originalDetails.source.route_sha256||applied.proposal.derived_profile_sha256!==approved||(isSurface&&(applied.proposal.derivation_kind!=='whole_provider_surface'||applied.proposal.source_pack_sha256!==proposal.source_pack_sha256)))throw new Error('處理後路線未通過檢查，保留原始資料。');
  committing=true;invalidate(false);$('hiking-consent').checked=false;state.originalRoute=originalRoute;state.calculationGpx=applied.derived_gpx_b64;state.calculationDetails=details;state.repairApplied=applied;if(isSurface){state.surfaceProposal=null;$('surface-apply').hidden=true;$('profile-derived-label').textContent='地表海拔參考';$('surface-status').textContent='已採用整條地表參考 · 可切換原始／參考剖面';}$('profile-layer').value='original';$('profile-layer-label').hidden=false;markCheckpointLocationsPending();renderRoute(route);renderDetails({...state.details,waypoints:details.waypoints});applyOfficialCheckpoints();$('repair-panel').hidden=false;$('repair-status').textContent=(isSurface?'已套用地表參考 · 原檔已保留':'已套用局部估算 · 原檔已保留')+(applied.proposal.summary.preview_has_out_of_domain?(isSurface?' · 參考版超出跑步範圍':' · 仍超出跑步參考範圍'):'');$('repair-apply').hidden=true;$('repair-check').hidden=true;$('repair-consent-note').hidden=true;$('download-derived').hidden=false;$('download-repair-record').hidden=false;$('repair-revert').hidden=false;if(!isSurface)$('surface-status').textContent='目前採用局部估算；還原後可檢查地表參考。';feedback('已套用，請核對補站位置。');
 }catch(error){
  if(token!==state.token)return;
  if(!committing&&!stagedCurrent())return;
  if(checkingOriginal&&rejectAcceptedRawSource(error,owner.originalGpx))return;
  if(error.name!=='AbortError'){
   // A rendering failure after commit started must leave no result authorized
   // for partially changed geometry. Preserved CP locations still require review.
   if(committing){if(isSurface){state.surfaceProposal=null;$('surface-apply').hidden=true;$('surface-status').textContent='地表參考未完成，原始資料保持不變。';$('profile-derived-label').textContent='處理後資料';}state.originalRoute=null;state.calculationGpx=null;state.calculationDetails=null;state.repairApplied=null;state.route=originalRoute;$('profile-layer').value='original';$('profile-layer-label').hidden=true;$('download-derived').hidden=true;$('download-repair-record').hidden=true;$('repair-revert').hidden=true;renderRoute(originalRoute);renderDetails(originalDetails);}
   $('repair-status').textContent=error.message;feedback('處理未完成，原始路線保持不變。','error');
  }
 }finally{if(token===state.token){state.request=null;state.requestKind=null;busy(false);manualPaceUI?.refresh();}}
}
$('repair-apply').addEventListener('click',()=>applyDerivedProposal(state.repairProposal));
$('surface-apply').addEventListener('click',()=>applyDerivedProposal(state.surfaceProposal,true));
$('download-derived').addEventListener('click',()=>{if(state.calculationGpx)downloadBlob(decodeGpx(state.calculationGpx),'application/gpx+xml',derivedGpxFilename({source:state.source,originalFileName:state.originalFileName,details:state.details,surfaceReference:surfaceApplied()}));});
$('download-repair-record').addEventListener('click',()=>{if(state.repairApplied)downloadBlob(JSON.stringify({schema_version:'route-repair-record/1.0',original_sha256:state.repairApplied.proposal.original_sha256,derived_sha256:state.repairApplied.derived_sha256,proposal:state.repairApplied.proposal},null,2),'application/json',surfaceApplied()?'surface-reference-record.json':'route-repair-record.json');});
$('repair-revert').addEventListener('click',()=>{
  if(!state.gpx||state.request||!state.calculationGpx||!state.originalRoute)return;
  const route=state.originalRoute;stopRequest();invalidate(false);
  $('hiking-consent').checked=false;state.originalRoute=null;state.calculationGpx=null;state.calculationDetails=null;state.repairApplied=null;state.surfaceProposal=null;$('surface-apply').hidden=true;$('surface-status').textContent='已改回原始資料；採用地表參考前請重新檢查。';$('profile-derived-label').textContent='處理後資料';
  $('profile-layer').value='original';$('profile-layer-label').hidden=true;markCheckpointLocationsPending();renderRoute(route);renderDetails(state.details);applyOfficialCheckpoints();
  $('repair-panel').hidden=false;$('repair-status').textContent='已改回原始資料 · 補站已保留';$('repair-check').hidden=false;const allowed=localRepairEligible(state.repairProposal);$('repair-apply').hidden=!allowed;$('repair-consent-note').hidden=!allowed;$('download-derived').hidden=true;$('download-repair-record').hidden=true;$('repair-revert').hidden=true;
  busy(false);feedback('已復原，請核對補站位置。');
});
$('profile-layer').addEventListener('change',()=>{if(state.route)profile(state.route);});
function originalBytes(){const raw=atob(state.gpx);return Uint8Array.from(raw,c=>c.charCodeAt(0));}
function downloadBlob(bytes,type,filename){const url=URL.createObjectURL(new Blob([bytes],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('download-original').addEventListener('click',()=>{if(state.gpx)downloadBlob(originalBytes(),'application/gpx+xml',originalGpxFilename({source:state.source,originalFileName:state.originalFileName,details:state.details,preferUploadedName:!!state.uploadIdentity}));});
$('download-enriched').addEventListener('click',()=>{
  if(!state.gpx||!state.details||!state.route||state.route.blocked)return;
  try{
    const predictionMode=$('ability-mode').getAttribute('aria-pressed')==='true',startInput=$(predictionMode?'prediction-start-time':'start-time'),startDateInput=predictionMode?$('prediction-date'):null,input={checkpoints:readCheckpointSettings(startInput,startDateInput)},startClock=startInput.value,startDate=predictionMode?(startDateInput.value||null):(state.source?.raceDate||null),points=(state.calculationDetails||state.details).raw_profile_segments[0].points;let previousDistance=0;for(const [index,cp]of input.checkpoints.entries()){if(cp.distance_m<=previousDistance||cp.distance_m<=1e-6||state.route.distance_m-cp.distance_m<=1e-6)throw Object.assign(new Error('補給站須按沿線里程遞增，且位於起終點之間。'),{fields:[$('cp-list').children[index].querySelector('.cp-distance')]});previousDistance=cp.distance_m;}const checkpoints=[...$('cp-list').children].map((node,i)=>{const cp=input.checkpoints[i];const official=node.dataset.official?JSON.parse(node.dataset.official):null,contextFact=node.dataset.courseContextFact?JSON.parse(node.dataset.courseContextFact):null;const match=node.dataset.mapping?JSON.parse(node.dataset.mapping):null,contextMapping=trustedCourseMapping(node);const waypoint=node.dataset.waypoint?JSON.parse(node.dataset.waypoint):null;const trustedWaypoint=!surfaceApplied()&&!!waypoint&&!!match&&node.dataset.mappingRouteSha===(state.calculationDetails||state.details).source.route_sha256&&node.dataset.positionEdited!=='true'&&node.dataset.locationReconfirmed!=='true'&&node.dataset.locationPending!=='true';const coordinate=waypoint&&node.dataset.positionEdited!=='true'&&node.dataset.locationReconfirmed!=='true'?{...waypoint,method:'original_gpx_waypoint'}:official&&match&&Number.isFinite(official.lat)&&Number.isFinite(official.lon)&&node.dataset.positionEdited!=='true'&&node.dataset.locationReconfirmed!=='true'?{lat:official.lat,lon:official.lon,ele:official.elevationM,method:official.mapping_method==='projected_official_coordinate_with_ordered_passages'?'official_coordinate_projected_route':'official_coordinate_exact_gpx_match',source_point_index:match.source_point_index??null,raw_edge_index:match.raw_edge_index??null,offset_m:match.offset_m??null}:contextMapping?{lat:contextMapping.selected_candidate.lat,lon:contextMapping.selected_candidate.lon,ele:contextMapping.selected_candidate.ele,method:contextMapping.mapping_method==='projected_official_coordinate_with_ordered_passages'?'user_confirmed_catalog_coordinate_projected_current_route':'user_confirmed_catalog_coordinate_exact_current_route',source_point_index:contextMapping.selected_candidate.source_point_index??null,raw_edge_index:contextMapping.selected_candidate.raw_edge_index??null,offset_m:contextMapping.selected_candidate.offset_m??null}:estimatedCoordinate(points,cp.distance_m);if(surfaceApplied()&&coordinate.method!=='estimated_linear_between_source_points')coordinate.ele=null;return {...coordinate,name:cp.name,checkpoint_occurrence_id:node.dataset.exportOccurrenceId||node.dataset.cpId,parent_checkpoint_occurrence_id:node.dataset.importedOccurrenceId||null,...(trustedWaypoint?{source_waypoint_identity:{index:waypoint.index,name:waypoint.name,lat:waypoint.lat,lon:waypoint.lon,ele:waypoint.ele,origin_sha256:waypoint.origin_sha256},source_waypoint_index:waypoint.index,source_waypoint_origin_sha256:waypoint.origin_sha256,source_waypoint_name:waypoint.name,source_waypoint_lat:waypoint.lat,source_waypoint_lon:waypoint.lon,source_waypoint_elevation_m:waypoint.ele,source_waypoint_selected_passage_m:match.along_route_m??match.distance_m}:{}),...(official?.sourceMapFeatureId?{source_checkpoint_id:official.id,source_station_id:official.sourceStationId,source_map_feature_id:official.sourceMapFeatureId,source_checked_at:official.sourceCheckedAt||null,original_gpx_sha256:state.source?.sha256||null,mapping_gpx_sha256:match?node.dataset.mappingRouteSha||(state.calculationDetails||state.details).source.route_sha256:null}:{}),imported_source_claims:node.dataset.importedSourceClaims?JSON.parse(node.dataset.importedSourceClaims):official?catalogCheckpointSourceClaims(state.source,official):null,source_kind:node.dataset.importedOccurrenceId?'imported_checkpoint_proposal':contextFact?contextFact.publishedTable?'user_confirmed_published_table_checkpoint_fact':'user_confirmed_catalog_checkpoint_fact':official?'official_checkpoint':waypoint?'original_gpx_waypoint':'user_checkpoint',source_url:official?.sourceUrl||contextFact?.sourceUrl||null,edition:state.source?.edition||contextFact?.contextEdition||null,official_distance_m:official?.officialDistanceM??contextFact?.officialDistanceM??null,...(contextFact?{source_checkpoint_id:contextFact.publishedTable?contextFact.id:String(contextFact.catalogIndex),original_gpx_sha256:contextFact.catalogOriginalSha256,mapping_gpx_sha256:contextMapping?.current_calculation_sha256??null,imported_source_claims:{course_context_fact:contextFact,course_context_mapping:node.dataset.courseContextMapping?{...JSON.parse(node.dataset.courseContextMapping),mapping_current:!!contextMapping}:null,authenticity:contextFact.publishedTable?'user_confirmed_published_table_reference_not_original_identity':'user_confirmed_catalog_reference_not_original_identity'}}:{}),canonical_distance_m:cp.distance_m,coordinate_method:coordinate.method,mapping_choice:match?{source_point_index:match.source_point_index,...(contextMapping?{association:contextMapping.association,catalog_original_sha256:contextMapping.catalog_original_sha256,uploaded_original_sha256:contextMapping.uploaded_original_sha256,current_calculation_sha256:contextMapping.current_calculation_sha256,fingerprint:contextMapping.fingerprint,catalog_occurrence_key:contextMapping.catalog_occurrence_key,mapping_method:contextMapping.mapping_method,selected_passage_index:contextMapping.selected_passage_index,selected_candidate:contextMapping.selected_candidate}:{}),...(node.dataset.officialAssociation==='explicit_user_selected_official_pin'?{association:'explicit_user_selected_official_pin',source_checkpoint_id:official?.id,source_station_id:official?.sourceStationId,source_map_feature_id:official?.sourceMapFeatureId,original_sha256:state.source?.sha256,route_sha256:node.dataset.mappingRouteSha,raw_edge_index:match.raw_edge_index,offset_m:match.offset_m,distance_m:match.distance_m}:{}),position_edited:node.dataset.positionEdited==='true',...(trustedWaypoint?{association:'explicit_user_selected_gpx_waypoint',waypoint_index:waypoint?.index,waypoint_name:waypoint?.name,route_sha256:node.dataset.mappingRouteSha,along_route_m:match.along_route_m}:{} )}:null,stop_s:cp.stop_s,cutoff_elapsed_s:cp.cutoff_elapsed_s,cutoff_local:node.dataset.cutoffEdited==='true'?null:official?.cutoffLocal||null,cutoff_kind:cutoffKindKnown(node.querySelector('.cp-kind').value)?node.querySelector('.cp-kind').value:null,official_cutoff_reported:official?.cutoffReported??contextFact?.cutoffReported??null,official_cutoff_kind:official?.cutoffKind??contextFact?.cutoffKind??null,official_cutoff_reference:official?.cutoffReference??contextFact?.cutoffReference??null,cutoff_time_user_edited:node.dataset.cutoffEdited==='true',cutoff_kind_user_confirmed:node.dataset.cutoffKindConfirmed==='true'};});
    const xml=enrichGpx({originalBytes:state.calculationGpx?decodeGpx(state.calculationGpx):originalBytes(),checkpoints,provenance:{source_geometry_sha256:state.route.geometry_sha256,source_filename:state.originalFileName||state.source?.sourceFilename||null,route_import:uploadImportEvidence()?.route_import||null,upload_source_match:uploadImportEvidence(),course_context:uploadedCourseContextSnapshot(),source_name:state.source?.name||null,source_sha256:(state.calculationDetails||state.details).source.route_sha256,original_source_sha256:state.details.source.route_sha256,derived_repair:state.repairApplied?{profile_sha256:state.repairApplied.proposal.derived_profile_sha256,derived_sha256:state.repairApplied.derived_sha256,derivation_kind:state.repairApplied.proposal.derivation_kind||'local_repair',source_pack_sha256:state.repairApplied.proposal.source_pack_sha256||null}:null,source_url:state.source?.gpxUrl||null,source_edition:state.source?.edition||null,source_page:state.source?.officialPage||null,official_total_limit_hours:state.source?.officialMaxHours??null,official_finish_distance_m:state.source?.checkpoints?.find(cp=>cp.kind==='finish')?.officialDistanceM??null,official_finish_cutoff_reported:state.source?.checkpoints?.find(cp=>cp.kind==='finish')?.cutoffReported??null,exporter:'RidGEQ independent planner',start_local_time:startClock,start_local_date:startDate,...(state.plan&&acceptedGoalResultCurrent()?{goal_reference:hikingReferenceProvenance(state.plan)}:{}),coordinate_notice:'User-added positions may be estimated between original route points; official coordinates and mapping choices are recorded per waypoint.',...activeCatalogDateFields()}});downloadBlob(xml,'application/gpx+xml',checkpointGpxFilename({source:state.source,originalFileName:state.originalFileName,details:state.details,repaired:!!state.calculationGpx,surfaceReference:surfaceApplied()}));feedback('已下載含補給站 GPX，版本與原檔相同；原檔保持不變。');
  }catch(error){feedback(error.message,'error');if(error.fields?.length)focusErrorField(error.fields[0]);}
});

abilityUI=createAbilityUI({request:(payload,signal)=>{predictionUI?.cancel();return serviceAwareRequest('reference',payload,signal);},cancelWorker:()=>transport.cancel(),onModeChange:(mode)=>{stopRequest();predictionUI?.resetMode();invalidate(false);feedback('');updateOfficialCutoffs($(mode==='ability'?'prediction-start-time':'start-time').value);},getRoute:()=>state.route&&!state.route.blocked?state.route:null});

function serviceContext(){return {routeExists:!!state.route,routeRevision:serviceRouteRevision,mappingRevision:serviceMappingRevision,rows:[...$('cp-list').children].map(cp=>{const official=cp.dataset.official?JSON.parse(cp.dataset.official):cp.dataset.courseContextFact?JSON.parse(cp.dataset.courseContextFact):null;return {id:cp.dataset.cpId,name:cp.querySelector('.cp-name').value,rawStop:cp.querySelector('.cp-stop').value,distanceRaw:cp.querySelector('.cp-distance').value,kind:official?.kind==='finish'||(cp.querySelector('.cp-distance').value.trim()&&Number.isFinite(Number(cp.querySelector('.cp-distance').value))&&(Number(cp.querySelector('.cp-distance').value)*1000===state.route?.distance_m||Number(cp.querySelector('.cp-distance').value)===state.route?.distance_m/1000))?'finish':official?.stationType==='timing_only_checkpoint'?'timing_only':'service',locationPending:cp.dataset.locationPending==='true',stopRevision:Number(cp.dataset.stopRevision||0)};})};}
function serviceAwareRequest(operation,payload,signal,options={}){goalSuggestionUI?.clear();const promise=transport.request(operation,payload,{signal,...options});conditionalPreview?.foregroundAccepted(operation,signal);serviceStopUI?.refresh();refreshWaypointControls();return promise.finally(()=>{serviceStopUI?.refresh();refreshWaypointControls();});}
function serviceBusy(){return !!(stationClockBarrier||stationClockUI?.isBusy()||courseReadOnlyBusy()||serviceMainBusy||state.request||state.requestKind||(transport.pending&&!goalSuggestionUI?.pending)||$('prediction-form').getAttribute('aria-busy')==='true');}
function commitServiceStops(changes){
 if(stationClockBarrier||serviceBusy()||!state.route||!changes.length)return {ok:false};const rows=[...$('cp-list').children],prepared=[];
 for(const change of changes){const cp=rows.find(cp=>cp.dataset.cpId===change.id),field=cp?.querySelector('.cp-stop');if(!cp||field.value!==change.expectedRaw||Number(cp.dataset.stopRevision||0)!==change.expectedRevision)return {ok:false};prepared.push({cp,field,change});}
 const written=[];for(const {cp,field,change} of prepared){const beforeRaw=field.value;field.value=change.value;cp.dataset.stopRevision=String(Number(cp.dataset.stopRevision||0)+1);written.push({id:change.id,beforeRaw,afterRaw:field.value,afterRevision:Number(cp.dataset.stopRevision)});}
 invalidate(false);return {ok:true,changes:written};
}
serviceStopUI=createServiceStopUI({getContext:serviceContext,isBusy:serviceBusy,commitStops:commitServiceStops});
predictionUI=createPredictionUI({onResultAccepted:acceptPredictionCatalogDate,isResultCurrent:wrapper=>!!wrapper?.prediction&&planCatalogDateCurrent(wrapper.prediction),getDisplayOptions:displayOptions,onBusyChange:()=>{serviceStopUI?.refresh();refreshWaypointControls();drawingUI?.refresh();},requestObservation:(payload,signal)=>{goalSuggestionUI?.clear();if(transportMode!=='webworker')return Promise.reject(Object.assign(new Error('Local analysis only'),{code:'local_only'}));if(state.request||state.requestKind)return Promise.reject(Object.assign(new Error('Worker busy'),{code:'worker_busy'}));return serviceAwareRequest('timed_history_inspect',payload,signal);},onSelectedTargetRejected:(intent,targetB64)=>{if(intent?.kind!=='target_raw_admission_rejected'||calculationGpx()!==targetB64)return;state.gpx=null;state.route=null;state.originalFileName='';$('gpx-file').value='';$('cp-list').replaceChildren();state.cpCount=0;invalidate(false);clearRouteDisplay('來源未通過檢查');$('route-state').className='status-pill error';$('file-name').textContent='來源未通過檢查，請重新導入路線。';$('route-retry').hidden=!state.source||state.source.transport==='user_upload_only';feedback('目標原始資料未通過檢查，請重新導入路線。','error');},requestProviderHistory:(payload,signal,onDispatch)=>{if(transportMode!=='webworker')return Promise.reject(Object.assign(new Error('平台參考需要本機背景計算。'),{code:'local_only'}));return requestWithCatalogDate('intervals_history_predict',payload,signal,{onDispatch});},requestSelectedHistory:(payload,signal,onDispatch)=>{if(transportMode!=='webworker')return Promise.reject(Object.assign(new Error('多筆參考需要本機背景計算。'),{code:'local_only'}));return requestWithCatalogDate('selected_history_predict',payload,signal,{onDispatch});},request:(payload,signal,operation='predict')=>requestWithCatalogDate(operation,payload,signal),cancelWorker:()=>transport.cancel(),beforeWork:()=>stopRequest(),getTarget:()=>state.route&&!state.route.blocked&&state.gpx?{gpx_b64:calculationGpx(),route:state.route,provenance:calculationProvenance()}:null,getHistoryContext:()=>({mode:$('ability-mode').getAttribute('aria-pressed')==='true'?'prediction':'goal',route_revision:serviceRouteRevision,input_revision:goalInputRevision,geometry_sha256:state.route?.geometry_sha256||null,original_gpx_sha256:state.details?.source?.route_sha256||state.originalRoute?.route_sha256||state.route?.route_sha256||null,source:state.source?{id:state.source.id,sha256:state.source.sha256,mapping_mode:state.source.mappingMode??null}:null,calculation_provenance:calculationProvenance(),raw_checkpoints:[...$('cp-list').children].map(cp=>({id:cp.dataset.cpId,fields:[...cp.querySelectorAll('input,select,textarea')].map(f=>[f.id||'',f.className||'',f.value,f.checked===true]),source_binding:Object.entries(cp.dataset).sort(([a],[b])=>a.localeCompare(b))})),...activeCatalogDateFields()}),getCheckpoints:()=>{if(!state.route)throw new Error('請先導入目標路線。');requireCheckpointLocations();return [...$('cp-list').children].map(cp=>({name:cp.querySelector('.cp-name').value.trim(),distance_m:number(cp.querySelector('.cp-distance'),'補給站里程')*1000,stop_s:checkpointStopSeconds(cp.querySelector('.cp-stop'))}));},getDeadlineContext:(startClock,startDate)=>getDeadlineContext(startClock,startDate),onStartTimeChange:(clock)=>updateOfficialCutoffs(clock),onResultChange:(result)=>{if(result?.prediction)capturePlanCatalogDate(result.prediction);const had=state.profilePrediction;if(!had&&!result)return;state.profilePrediction=result;workoutUI?.invalidate();if(state.route&&(result||had))profile(state.route);renderTerrainOverview();},getPlannedStops:()=>{const total=sumCpStops(serviceContext().rows,{routeExists:!!state.route});if(total.status!=='known')throw Object.assign(new Error(total.status==='no_route'?'請先導入目標路線。':'請確認每站停留分鐘；未填不能視為零。'),{code:total.status==='no_route'?'no_route':'invalid_target_stops',fieldIds:total.status==='no_route'?[]:['@stops']});return total.seconds;}});

goalSuggestionUI=createGoalTargetSuggestionUI({container:goalErrors.element,getCurrent:()=>captureGoalRequest(),isForegroundBusy:()=>!!(state.request||state.requestKind||$('prediction-form').getAttribute('aria-busy')==='true'),request:(payload,signal)=>{if(state.request||state.requestKind||transport.pending)throw Object.assign(new Error('目前忙碌，請稍後重試。'),{code:'worker_busy'});return transport.request('plan',payload,{signal});},onApply:application=>calculateGoal(application),onRejected:(error,original)=>{if(error.code==='invalid_speed_bounds')goalErrors.show({...original,fieldIds:[...new Set([...errorFieldIds(original),...errorFieldIds(error)])]},{form:$('planner-form')});},onPendingChange:()=>{serviceStopUI?.refresh();refreshWaypointControls();}});

manualPaceUI=createManualPaceUI({
  onStale:()=>feedback('設定已變更，請重新計算後調整配速。','error'),
  getClockView:()=>({startTime:state.startTime,deadlineContext:getDeadlineContext(state.startTime)}),
  isReadOnlyBusy:courseReadOnlyBusy,
  isReadBlocked:()=>stationClockBarrier,
  clockAdapter:{getState:()=>stationClockUI?.getState(),preview:action=>stationClockUI.previewManual(action),apply:()=>stationClockUI.applyManual(),reset:()=>stationClockUI.resetManual(),undo:()=>stationClockUI.undo(),cancel:()=>stationClockUI?.cancel()},
  onBusyChange:()=>{refreshCheckpointNoStopControls();drawingUI?.refresh();renderUploadSourceMatch();renderUploadedCourseContext();},
  getContext:()=>{if(stationClockBarrier)return null;if(state.plan?.purpose==='station_clock_comparison'){const c=captureStationClockContext(),summary=stationClockUI?.referenceSummary();return c&&summary?{plan:c.plan,clockFamily:'A',clockLocks:summary.locks,clockRawSections:summary.rawSections,snapshot:{signature:c.signature}}:null;}if(!state.plan||!acceptedGoalResultCurrent(state.plan)||!state.route||state.route.blocked||!state.gpx||$('goal-mode').getAttribute('aria-pressed')!=='true'||state.requestKind&&state.requestKind!=='drawing-inspect'&&!state.requestKind.startsWith('manual_pace_'))return null;try{const input=settings(),checkpointIds=[...$('cp-list').children].map(cp=>cp.dataset.cpId);if(checkpointIds.length<state.plan.checkpoints.length)checkpointIds.push('automatic-finish');return {plan:state.plan,gpx_b64:calculationGpx(),settings:input,checkpointIds,ownerRevision:String(goalInputRevision),snapshot:{route_sha256:state.route.route_sha256,geometry_sha256:state.route.geometry_sha256,inputRevision:goalInputRevision,rawSignature:goalRawSignature(),mode:'goal'}};}catch{return null;}},
  getRows:plan=>displayTerrain(plan,state.terrainLevel),
  request:async(operation,payload,controller)=>{conditionalPreview?.cancel();drawingUI?.cancelWork();goalSuggestionUI?.clear();workoutUI?.invalidate();const token=++state.token;state.request=controller;state.requestKind=operation;busy(true);try{return await transport.request(operation,payload,{signal:controller.signal});}finally{if(token===state.token&&state.request===controller){state.request=null;state.requestKind=null;busy(false);}}},
  cancelWorker:()=>transport.cancel(),
  onAdmissionRejected:(error,captured)=>{
    if(!state.route||calculationGpx()!==captured.gpx_b64||String(goalInputRevision)!==captured.ownerRevision||state.route.route_sha256!==captured.snapshot.route_sha256||state.route.geometry_sha256!==captured.snapshot.geometry_sha256)return;
    stopRequest();state.gpx=null;state.route=null;state.originalFileName='';$('cp-list').replaceChildren();state.cpCount=0;$('gpx-file').value='';invalidate(false);clearRouteDisplay('來源未通過檢查');$('route-state').className='status-pill error';$('file-name').textContent='來源未通過檢查，請重新導入路線。';$('route-retry').hidden=!state.source||state.source.transport==='user_upload_only';feedback(`${error.message} 請重新導入路線。`,'error');busy(false);
  },
  applyResult:plan=>{planDisplay(plan);conditionalPreview?.invalidate();const previous=state.plan,comparisons=state.comparisons;workoutUI?.invalidate();state.comparisons=[];try{renderPlan(plan);}catch(error){state.plan=previous;state.comparisons=comparisons;throw error;}}
});
// Internal C12 ownership seam. No UI, defaults, Apply/export or test exposure.
function captureConditionalContext(){
  if(state.plan?.model_version==='campbell2022-hiking-reference-goal-v1')return null;
  if(stationClockBarrier||state.plan?.purpose==='station_clock_comparison'||state.plan&&!planCatalogDateCurrent(state.plan))return null;
  if(transportMode!=='webworker'||!state.plan||!state.route||state.route.blocked||!state.gpx||state.request||state.requestKind||manualPaceUI?.isBusy()||$('prediction-form').getAttribute('aria-busy')==='true'||$('goal-mode').getAttribute('aria-pressed')!=='true')return null;
  try{
    const rawSignature=goalRawSignature();if(conditionalAcceptedSignatures.get(state.plan)!==rawSignature)return null;
    // settings()/readCheckpointSettings() refresh official cutoffs and validation
    // markers. A read-only advisory must never invoke those mutating readers.
    const checkpointIds=[...$('cp-list').children].map(cp=>cp.dataset.cpId);
    // Core normalization includes its automatic finish. It is not an extra raw
    // user CP and must not replace the original manual request's input shape.
    const input={...state.plan.input,checkpoints:state.plan.input.checkpoints.slice(0,checkpointIds.length)};
    if(checkpointIds.length<state.plan.checkpoints.length)checkpointIds.push('automatic-finish');
    const dataKey=value=>JSON.stringify(value,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
    const session=manualPaceUI?.getState(),gpx_b64=calculationGpx(),owner_revision=String(goalInputRevision);
    const validSession=session&&session.request.gpx_b64===gpx_b64&&session.request.owner_revision===owner_revision&&dataKey(session.request.settings)===dataKey(input)&&JSON.stringify(session.request.checkpoint_ids)===JSON.stringify(checkpointIds)&&session.snapshot.rawSignature===rawSignature&&session.prepared.baseline_plan.route.geometry_sha256===state.route.geometry_sha256;
    if(state.plan.purpose==='manual_pace_clock_preview'&&!validSession)return null;
    const prepare=validSession?session.request:{gpx_b64,settings:input,raw_sections:buildTerrainSegments(state.plan).map((row,index)=>({id:`raw-${index}`,start_m:row.start_m,end_m:row.end_m})),checkpoint_ids:checkpointIds,owner_revision};
    const locks=validSession?session.locks.map(({id,child_ids,moving_pace_s_per_km,allocation})=>({id,child_ids,moving_pace_s_per_km,allocation})):[];
    const {gpx_b64:_opaqueGpx,...preparationIdentity}=prepare;
    const signature=JSON.stringify({rawSignature,planIdentity:conditionalPlanIds.get(state.plan),route:state.route.route_sha256,geometry:state.route.geometry_sha256,source:state.source?sourceSnapshot(state.source):null,repair:state.repairApplied,calculation:calculationProvenance(),prepare:preparationIdentity,locks,stationRevision:[serviceRouteRevision,serviceMappingRevision]});
    return {plan:state.plan,planIdentity:conditionalPlanIds.get(state.plan),signature,prepare,locks,prepared:validSession?session.prepared:null,routeSha256:state.route.route_sha256,geometrySha256:state.route.geometry_sha256,inputRevision:String(goalInputRevision),stationRevision:`${serviceRouteRevision}:${serviceMappingRevision}`};
  }catch{return null;}
}
conditionalPreview=createConditionalPreviewController({getContext:captureConditionalContext,transport,isReadOnlyDetailsPending:courseReadOnlyPending,onState:()=>refreshCourseWorkflowControls(),onTargetRejected:(intent,captured)=>{
  const live=captureConditionalContext();if(!live||live.plan!==captured.plan||live.signature!==captured.signature||live.prepare.gpx_b64!==captured.prepare.gpx_b64||intent.source_role!=='target')return;
  stopRequest();state.gpx=null;state.route=null;state.originalFileName='';$('cp-list').replaceChildren();state.cpCount=0;$('gpx-file').value='';invalidate(false);clearRouteDisplay('來源未通過檢查');$('route-state').className='status-pill error';$('file-name').textContent='來源未通過檢查，請重新導入路線。';$('route-retry').hidden=!state.source||state.source.transport==='user_upload_only';feedback('目標原始資料未通過檢查，請重新導入路線。','error');busy(false);
}});
const cloneStationClockContent=value=>JSON.parse(JSON.stringify(value));
function stationClockSourceIdentity(){
  // References preserve ownership; immutable scalar snapshots detect mutation
  // inside an otherwise identical route/source object. state.route is the
  // inspected calculation route, including an explicitly applied derived GPX.
  return {route:state.route,gpx:state.gpx,calculationGpx:calculationGpx(),source:state.source,repair:state.repairApplied,originalRoute:state.originalRoute,drawn:state.drawnProvenance,routeSha256:state.route?.route_sha256,geometrySha256:state.route?.geometry_sha256,distanceM:state.route?.distance_m,originalRouteSha256:state.originalRoute?.route_sha256??null,originalGeometrySha256:state.originalRoute?.geometry_sha256??null,sourceScalars:JSON.stringify({source:state.source?sourceSnapshot(state.source):null,calculation:calculationProvenance()})};
}
// Export only the accepted result bound to the still-current raw inputs and source.
// A detached manual preview does not replace this accepted result.
function acceptedGoalResultCurrent(plan=state.plan){
  if(stationClockBarrier||!plan||plan!==state.plan||!state.route||state.route.blocked||!state.gpx||!planCatalogDateCurrent(plan))return false;
  try{const source=stationClockAcceptedSources.get(plan),now=stationClockSourceIdentity();return plan.route?.route_sha256===now.routeSha256&&plan.route?.geometry_sha256===now.geometrySha256&&plan.route?.distance_m===now.distanceM&&conditionalAcceptedSignatures.get(plan)===goalRawSignature()&&stationClockAcceptedContents.get(plan)===clockContentKey(plan)&&!!source&&!Object.keys(source).some(k=>source[k]!==now[k]);}catch{return false;}
}
function captureStationClockContext({allowBarrier=false,revision=goalInputRevision,manualOverride=null}={}){
  if(stationClockBarrier&&!allowBarrier||!state.plan||!planCatalogDateCurrent(state.plan)||!state.route||state.route.blocked||!state.gpx||$('goal-mode').getAttribute('aria-pressed')!=='true'||manualPaceUI?.isBusy())return null;
  try{
    const rawSignature=goalRawSignature(),plan=state.plan,source=stationClockAcceptedSources.get(plan),now=stationClockSourceIdentity();
    preflightClockData(plan);
    if(plan.route?.route_sha256!==now.routeSha256||plan.route?.geometry_sha256!==now.geometrySha256||plan.route?.distance_m!==now.distanceM||conditionalAcceptedSignatures.get(plan)!==rawSignature||stationClockAcceptedContents.get(plan)!==clockContentKey(plan)||!source||Object.keys(source).some(k=>source[k]!==now[k]))return null;
    const session=manualOverride??manualPaceUI?.getState();if(session?.pending||session?.preview)return null;
    if(plan.purpose==='manual_pace_clock_preview'&&(!session||clockContentKey(session.current)!==clockContentKey(plan)))return null;
    const rows=serviceContext().rows,nodes=[...$('cp-list').children];
    const stationRows=plan.checkpoints.map((cp,i)=>{const row=rows[i];return {id:row?.id??'automatic-finish',name:cp.name,distanceM:cp.distance_m,kind:row?.kind??'finish',rawStop:row?.rawStop??'0'};});
    if(nodes.length>stationRows.length||stationRows.length>nodes.length+1)return null;
    const planIdentity=conditionalPlanIds.get(plan),signature=JSON.stringify({rawSignature,revision,planIdentity,routeSha256:now.routeSha256,geometrySha256:now.geometrySha256,routeDistanceM:now.distanceM,sourceScalars:now.sourceScalars,routeRevision:serviceRouteRevision,mappingRevision:serviceMappingRevision,source:state.source?sourceSnapshot(state.source):null,repair:state.repairApplied,calculation:calculationProvenance()});
    return {plan,planIdentity,signature,stationRows,entryData:{manualSession:session?cloneStationClockContent(session):null,source:now}};
  }catch{return null;}
}
function stationClockDomSnapshot(){
  const records=[],seen=new Set();
  function visit(node){if(!node||seen.has(node))return;seen.add(node);const children=[...(node.childNodes??node.children??[])];records.push({node,children,text:children.length?null:node.textContent,classAttribute:node.getAttribute?.('class')??null,properties:Object.fromEntries(['hidden','disabled','open','value','checked','className'].filter(k=>k in node&&['string','boolean'].includes(typeof node[k])).map(k=>[k,node[k]]))});for(const child of children)visit(child);}
  for(const id of ['plan-result','route-preview','feedback','goal-settings-summary','goal-workout','workout-dialog'])visit($(id));
  return ()=>{for(const r of records.slice().reverse()){if(typeof r.node.replaceChildren==='function')r.node.replaceChildren(...r.children);if(r.text!==null)r.node.textContent=r.text;for(const [k,v]of Object.entries(r.properties))r.node[k]=v;if(r.node.setAttribute){if(r.classAttribute===null)r.node.removeAttribute('class');else r.node.setAttribute('class',r.classAttribute);}}};
}
function commitStationClock({plan,rawValues,restoration,expected,publish}){
  if(stationClockBarrier)return {ok:false};const live=captureStationClockContext();
  if(!live||live.plan!==expected.plan||live.signature!==expected.signature||clockContentKey(live.plan)!==expected.content)return {ok:false};
  const rows=[...$('cp-list').children],writes=rawValues.filter(r=>r.id!=='automatic-finish').map(r=>({cp:rows.find(cp=>cp.dataset.cpId===r.id),value:r.value}));
  if(writes.length!==rows.length||writes.some(w=>!w.cp||parseCpStopValue(w.value).status!=='known'))return {ok:false};
  const nextRevision=goalInputRevision+1;if(restoration&&(restoration.expectedInputRevision!==goalInputRevision||restoration.nextRevision!==nextRevision))return {ok:false};
  const prior={plan:state.plan,comparisons:state.comparisons,expanded:new Set(state.expandedGroups),manual:manualPaceUI?.getState(),raw:rows.map(cp=>({cp,value:cp.querySelector('.cp-stop').value,revision:Number(cp.dataset.stopRevision||0)}))},restoreDom=stationClockDomSnapshot();
  conditionalPreview?.invalidate();goalSuggestionUI?.clear();
  const checked=captureStationClockContext();if(!checked||checked.plan!==expected.plan||checked.signature!==expected.signature)return {ok:false};
  stationClockBarrier=true;
  try{
    for(const w of writes){const input=w.cp.querySelector('.cp-stop');if(input.value!==w.value){input.value=w.value;w.cp.dataset.stopRevision=String(Number(w.cp.dataset.stopRevision||0)+1);}}
    state.comparisons=[];workoutUI?.invalidate();renderPlan(plan);
    let restoredManual=null;
    if(restoration?.manual){const snapshot={route_sha256:state.route.route_sha256,geometry_sha256:state.route.geometry_sha256,inputRevision:nextRevision,rawSignature:goalRawSignature(),mode:'goal'};restoredManual=manualPaceUI.restoreVerified({...restoration.manual,snapshot,result:plan});}
    conditionalAcceptedSignatures.set(plan,goalRawSignature());stationClockAcceptedContents.set(plan,clockContentKey(plan));stationClockAcceptedSources.set(plan,stationClockSourceIdentity());
    const ctx=captureStationClockContext({allowBarrier:true,revision:nextRevision,manualOverride:restoredManual});if(!ctx)throw new Error('完整停留方案來源未通過核對。');
    publish(ctx);goalInputRevision=nextRevision;return {ok:true};
  }catch(error){
    state.plan=prior.plan;state.comparisons=prior.comparisons;state.expandedGroups=prior.expanded;
    for(const r of prior.raw){r.cp.querySelector('.cp-stop').value=r.value;r.cp.dataset.stopRevision=String(Math.max(r.revision,Number(r.cp.dataset.stopRevision||0))+1);}
    if(prior.manual&&prior.plan.purpose==='manual_pace_clock_preview'){const snapshot={...prior.manual.snapshot,inputRevision:goalInputRevision,rawSignature:goalRawSignature()};manualPaceUI.restoreVerified({prepared:prior.manual.prepared,request:prior.manual.request,snapshot,result:prior.plan,locks:prior.manual.locks,nextId:prior.manual.nextId,generation:prior.manual.generation});}else manualPaceUI?.invalidate();
    conditionalAcceptedSignatures.set(prior.plan,goalRawSignature());stationClockAcceptedContents.set(prior.plan,clockContentKey(prior.plan));stationClockAcceptedSources.set(prior.plan,stationClockSourceIdentity());restoreDom();throw error;
  }finally{stationClockBarrier=false;const settledPlan=state.plan,settledRevision=goalInputRevision;Promise.resolve().then(()=>{if(state.plan!==settledPlan||goalInputRevision!==settledRevision||conditionalAcceptedSignatures.get(settledPlan)!==goalRawSignature())return;manualPaceUI?.refresh();workoutUI?.refresh();stationClockUI?.refresh();serviceStopUI?.refresh();refreshSettingsSummary();}).catch(()=>{});}
}
async function prepareStationClockExit(capsule,{signal}){
  const expected=captureStationClockContext();if(!expected||transport.pending)throw new Error('目前忙碌或來源已變更，保留停留方案。');
  const nextRevision=goalInputRevision+1,expectedInputRevision=goalInputRevision;
  if(capsule.plan.purpose!=='manual_pace_clock_preview')return {plan:cloneStationClockContent(capsule.plan),expectedInputRevision,nextRevision};
  const prior=capsule.entryData.manualSession;if(!prior||capsule.entryData.source.gpx!==state.gpx||capsule.entryData.source.calculationGpx!==calculationGpx())throw new Error('原配速來源已變更，不能取消停留方案。');
  const request={...cloneStationClockContent(prior.request),owner_revision:String(nextRevision)},controller=new AbortController(),abort=()=>controller.abort();signal.addEventListener('abort',abort,{once:true});if(signal.aborted)controller.abort();
  const token=++state.token;state.request=controller;state.requestKind='station_clock_restore';busy(true);
  try{
    conditionalPreview?.cancel();goalSuggestionUI?.clear();
    const current=()=>{const c=captureStationClockContext();return !signal.aborted&&!controller.signal.aborted&&c?.plan===expected.plan&&c.signature===expected.signature;};
    if(!current())throw new DOMException('停留還原已取消。','AbortError');
    const preparing=transport.request('manual_pace_prepare',request,{signal:controller.signal});conditionalPreview?.foregroundAccepted('manual_pace_prepare',controller.signal);const prepared=await preparing;if(!current())throw new DOMException('停留還原已取消。','AbortError');
    const recalculating=transport.request('manual_pace_recalculate',{...request,expected_binding:prepared.binding,locks:cloneStationClockContent(prior.locks)},{signal:controller.signal});conditionalPreview?.foregroundAccepted('manual_pace_recalculate',controller.signal);const result=await recalculating;if(!current())throw new DOMException('停留還原已取消。','AbortError');
    if(result?.manual_session?.binding!==prepared.binding)throw new Error('原配速還原來源已變更，保留停留方案。');
    validateManualClockReceipt(result,{baseline:prepared.baseline_plan,request,locks:prior.locks});
    const physical=p=>{const x=cloneStationClockContent(p);delete x.manual_session.binding;delete x.manual_session.owner_revision;return clockContentKey(x);};
    if(physical(result)!==physical(capsule.plan))throw new Error('原配速的完整移動時間帳未重現，保留停留方案。');
    return {plan:result,expectedInputRevision,nextRevision,manual:{prepared,request,locks:cloneStationClockContent(prior.locks),nextId:prior.nextId,generation:prior.generation}};
  }catch(error){
    const current=captureStationClockContext();if(error.admissionRejected===true&&!controller.signal.aborted&&current?.plan===expected.plan&&current.signature===expected.signature&&calculationGpx()===request.gpx_b64){stopRequest();state.gpx=null;state.route=null;state.originalFileName='';$('cp-list').replaceChildren();state.cpCount=0;$('gpx-file').value='';invalidate(false);clearRouteDisplay('來源未通過檢查');feedback('目標原始資料未通過檢查，請重新導入路線。','error');}
    throw error;
  }finally{signal.removeEventListener('abort',abort);if(token===state.token&&state.request===controller){state.request=null;state.requestKind=null;busy(false);stationClockUI?.refresh();}}
}
/** Reuse the accepted native manual operations against the fixed unlocked entry. */
async function stationClockNativeWork(expected,signal,work,{forwardReadOnly=false}={}){
  if(!expected||transport.pending||state.request||state.requestKind)throw new Error('目前忙碌，保留完整方案。');
  const controller=new AbortController(),abort=()=>controller.abort();signal.addEventListener('abort',abort,{once:true});if(signal.aborted)controller.abort();
  const token=++state.token;state.request=controller;state.requestKind=forwardReadOnly?'station_clock_forward':'station_clock_manual';busy(true);let targetAdmissionError=null;
  const current=()=>{const c=captureStationClockContext();return !signal.aborted&&!controller.signal.aborted&&c?.plan===expected.plan&&c.signature===expected.signature&&clockContentKey(c.plan)===expected.content;};
  const request=async(operation,payload)=>{if(!current())throw new DOMException('人工配速已取消。','AbortError');const pending=transport.request(operation,payload,{signal:controller.signal});conditionalPreview?.foregroundAccepted(operation,controller.signal);let result;try{result=await pending;}catch(error){if(forwardReadOnly&&error.admissionRejected===true&&operation==='manual_pace_prepare'&&payload.gpx_b64===calculationGpx()&&current())targetAdmissionError=error;throw error;}if(!current())throw new DOMException('人工配速已取消。','AbortError');return result;};
  try{conditionalPreview?.cancel();goalSuggestionUI?.clear();return await work(request);}
  catch(error){const c=captureStationClockContext();if(error.admissionRejected===true&&(!forwardReadOnly||error===targetAdmissionError)&&!controller.signal.aborted&&c?.plan===expected.plan&&c.signature===expected.signature){stopRequest();state.gpx=null;state.route=null;state.originalFileName='';$('cp-list').replaceChildren();state.cpCount=0;$('gpx-file').value='';invalidate(false);clearRouteDisplay('來源未通過檢查');feedback('目標原始資料未通過檢查，請重新導入路線。','error');}throw error;}
  finally{signal.removeEventListener('abort',abort);if(token===state.token&&state.request===controller){state.request=null;state.requestKind=null;busy(false);stationClockUI?.refresh();}}
}
/** Fixed entry preparation only: no goal reallocation, manual candidate or state installation. */
function stationClockFixedManualRequest(entry){
  const original=entry.entryData.manualSession,reference=original?.prepared.baseline_plan??entry.plan;
  if(entry.entryData.source.gpx!==state.gpx||entry.entryData.source.calculationGpx!==calculationGpx())throw new Error('原始移動來源已變更。');
  const inputRows=entry.stationRows.filter(r=>r.id!=='automatic-finish');
  const request=original?{...cloneStationClockContent(original.request),owner_revision:String(goalInputRevision)}:{gpx_b64:calculationGpx(),settings:{...cloneStationClockContent(reference.input),checkpoints:cloneStationClockContent(reference.input.checkpoints.slice(0,inputRows.length))},raw_sections:buildTerrainSegments(reference).map((r,i)=>({id:`raw-${i}`,start_m:r.start_m,end_m:r.end_m})),checkpoint_ids:entry.stationRows.map(r=>r.id),owner_revision:String(goalInputRevision)};
  return {reference,request};
}
async function prepareStationClockForwardSource({entry,current},{signal}){
  const {reference,request}=stationClockFixedManualRequest(entry);
  return stationClockNativeWork(current,signal,async send=>{const prepared=await send('manual_pace_prepare',request);assertOriginalMovingReference(reference,prepared);return {request,prepared};},{forwardReadOnly:true});
}
async function prepareStationClockManual({entry,current,action,nextId},{signal,generation}){
  preflightClockData(action);const allowed=action.kind==='manual_lock'?['kind','childIds','pace']:action.kind==='manual_unlock'?['kind','lockId']:action.kind==='manual_reset'?['kind']:[];
  if(!allowed.length||Object.keys(action).sort().join('|')!==allowed.sort().join('|'))throw new Error('人工配速操作欄位有誤。');
  const {reference,request}=stationClockFixedManualRequest(entry);
  const locks=projectManualLocks(current.plan.station_clock.locks);
  return stationClockNativeWork(current,signal,async send=>{
    const prepared=await send('manual_pace_prepare',request);assertOriginalMovingReference(reference,prepared);
    const result=await send('manual_pace_recalculate',{...request,expected_binding:prepared.binding,locks});
    validateNativeMovingProof({prepared,request,result,locks},reference);assertMovingMirror(current.plan,result,{locks});
    const snapshot={signature:current.signature},state=restoreVerifiedManualPaceState({prepared,request,snapshot,result,locks,generation,nextId});
    const started=action.kind==='manual_lock'?previewManualPace(state,{childIds:action.childIds,pace:action.pace},snapshot):action.kind==='manual_unlock'?previewManualUnlock(state,action.lockId,snapshot):{state,payload:{...request,expected_binding:prepared.binding,locks:[]}};
    const candidate=await send('manual_pace_recalculate',started.payload),proof={prepared,request,result:candidate,locks:projectManualLocks(started.payload.locks)};validateNativeMovingProof(proof,reference);
    return {proof,nextId:started.state.nextId};
  });
}
async function repeatStationClockManual(proof,{current,signal}){
  preflightClockData(proof);if(proof.request.owner_revision!==String(goalInputRevision))throw new Error('人工配速來源已變更。');
  return stationClockNativeWork(current,signal,async send=>{const result=await send('manual_pace_recalculate',{...cloneStationClockContent(proof.request),expected_binding:proof.prepared.binding,locks:cloneStationClockContent(proof.locks)}),fresh={...cloneStationClockContent(proof),result};validateNativeMovingProof(fresh,proof.prepared.baseline_plan);return fresh;});
}
function downloadOwnedStationClock(value,isCurrent){
  if(stationClockBarrier||!isCurrent())throw new Error('停留方案已變更，未匯出。');let url=null;
  try{const blob=new Blob([JSON.stringify({...value,calculation_provenance:calculationProvenance(),original_gpx_sha256:(state.originalRoute||state.route).route_sha256},null,2)],{type:'application/json'});if(!isCurrent())throw new Error('停留方案已變更，未匯出。');url=URL.createObjectURL(blob);if(!isCurrent())throw new Error('停留方案已變更，未匯出。');const link=document.createElement('a');link.href=url;link.download='ridgeq-station-clock-manual-v1.json';if(!isCurrent())throw new Error('停留方案已變更，未匯出。');link.click();}finally{if(url)setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
stationClockUI=createStationClockUI({getContext:captureStationClockContext,hash:text=>browserSha256(new TextEncoder().encode(text)),commit:commitStationClock,prepareExit:prepareStationClockExit,prepareManual:prepareStationClockManual,repeatManual:repeatStationClockManual,forwardRead:{prepareFixedSource:prepareStationClockForwardSource},hasDetachedDraft:()=>manualPaceUI?.hasDraft()===true,onFamilyChange:()=>{refreshCheckpointNoStopControls();manualPaceUI?.refresh();routeQualityUI?.refresh();refreshCourseWorkflowControls();},isBusy:()=>serviceBusy()||!!manualPaceUI?.isBusy(),isReadBlocked:()=>stationClockBarrier,download:downloadOwnedStationClock});
// A synchronous transaction admits no reentrant user writer or reader action.
for(const type of ['click','input','change','submit'])document.addEventListener(type,event=>{if(stationClockBarrier){event.preventDefault();event.stopImmediatePropagation?.();}},true);

workoutUI=createWorkoutUI({getCurrentResult:mode=>{if(stationClockBarrier||state.request||!state.route||state.route.blocked)return null;const active=$('ability-mode').getAttribute('aria-pressed')==='true'?'prediction':'goal';if(mode!==active)return null;const wrapper=mode==='prediction'?state.profilePrediction:null,plan=wrapper?.prediction??(mode==='goal'?state.plan:null);if(wrapper&&wrapper.source_kind!=='intervals_provider'&&!predictionUI?.isCurrentLocalResult(wrapper))return null;if(!plan||!planCatalogDateCurrent(plan)||plan.status==='hybrid_scenario_partial'||mode==='goal'&&!acceptedGoalResultCurrent(plan))return null;const historySelection=wrapper?.selected_history_receipt?predictionUI?.getHistoryWorkoutContext(wrapper):null;if(wrapper?.selected_history_receipt&&!historySelection)return null;const providerHistory=wrapper?.source_kind==='intervals_provider'?predictionUI?.getProviderWorkoutContext(wrapper):null;if(wrapper?.source_kind==='intervals_provider'&&!providerHistory)return null;if(plan.status==='experimental_historical_reference'&&!historySelection&&!providerHistory)return null;const stationClockContext=plan.purpose==='station_clock_comparison'?stationClockUI?.getWorkoutContext(plan):null;if(plan.purpose==='station_clock_comparison'&&!stationClockContext)return null;return {plan,route:state.route,current:true,...(plan.model_version==='campbell2022-hiking-reference-goal-v1'?{referenceProvenance:{calculation:calculationProvenance(),source:state.source?sourceSnapshot(state.source):null,original_sha256:(state.originalRoute||state.route).route_sha256}}:{}),...(stationClockContext?{stationClockContext}:{}),...(historySelection?{historySelection}:{}),...(providerHistory?{providerHistory,revalidate:()=>predictionUI.revalidateProviderExport(wrapper)}:{})};}});

routeQualityUI=createRouteQualityUI({
  getContext:()=>state.gpx&&state.route?{gpx_b64:state.gpx,sha256:state.details?.source?.route_sha256||(state.originalRoute||state.route).route_sha256,derived:!!state.calculationGpx,segmentRanges:state.details?.raw_profile_segments?.map(segment=>[segment.points[0]?.source_point_index,segment.points.at(-1)?.source_point_index])}:null,
  isBusy:()=>serviceBusy()||!!manualPaceUI?.isBusy()||transportMode!=='webworker',
  request:async(payload,signal)=>{if(serviceBusy()||transport.pending)throw Object.assign(new Error('目前忙碌，請稍後檢查。'),{code:'worker_busy'});const token=state.token,requestOwner={abort:()=>routeQualityUI?.cancel()};state.request=requestOwner;state.requestKind='quality_inspect';busy(true);try{return await transport.request('quality_inspect',payload,{signal});}finally{if(token===state.token&&state.request===requestOwner){state.request=null;state.requestKind=null;busy(false);}}},
  onAdmissionRejected:(error,context)=>{if(state.gpx!==context.gpx_b64)return;stopRequest();state.gpx=null;state.route=null;state.originalFileName='';$('cp-list').replaceChildren();state.cpCount=0;$('gpx-file').value='';invalidate(false);clearRouteDisplay('來源未通過檢查');$('route-state').className='status-pill error';$('file-name').textContent='來源未通過檢查，請重新導入路線。';$('route-retry').hidden=!state.source||state.source.transport==='user_upload_only';feedback(`${error.message} 請重新導入路線。`,'error');busy(false);}
});

// Workspace navigation is visual only; no reset/cancel/compute side effects.
const libraryScrim=document.createElement('button');libraryScrim.id='library-scrim';libraryScrim.className='library-scrim';libraryScrim.type='button';libraryScrim.hidden=true;libraryScrim.setAttribute('aria-label','關閉賽事庫');document.body.append(libraryScrim);
let libraryReturnFocus=null,tour=null,tourLibraryWasOpen=false,tourLibraryReturnFocus=null;
const libraryInertOwners=new Map();
function setLibraryModal(active){
 const library=$('race-library');
 if(active){
  library.setAttribute('role','dialog');library.setAttribute('aria-modal','true');
  for(const node of [document.querySelector('.site-header'),$('workbench'),document.querySelector('footer'),document.querySelector('.skip-link')])if(node&&!libraryInertOwners.has(node)){libraryInertOwners.set(node,node.inert);node.inert=true;}
 }else{
  library.removeAttribute('role');library.removeAttribute('aria-modal');
  for(const [node,inert]of libraryInertOwners)node.inert=inert;libraryInertOwners.clear();
 }
}
function focusRouteHeading(){const heading=$('selected-title');heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
function closeLibrary({restoreFocus=true}={}){
 const wasOpen=$('race-library').classList.contains('library-open'),returnFocus=libraryReturnFocus;
 $('race-library').classList.remove('library-open');$('library-toggle').setAttribute('aria-expanded','false');libraryScrim.hidden=true;setLibraryModal(false);libraryReturnFocus=null;
 if(restoreFocus&&wasOpen&&!tour?.isOpen){for(const target of [returnFocus,$('library-toggle'),$('selected-title')]){if(!target?.isConnected||target.disabled||target.closest('[hidden]')||target.closest('[inert]')||!target.getClientRects().length)continue;if(target===$('selected-title'))target.setAttribute('tabindex','-1');target.focus({preventScroll:true});break;}}
}
function openLibrary({forTour=false,focus=true}={}){
 const wasOpen=$('race-library').classList.contains('library-open');if(!wasOpen&&!forTour)libraryReturnFocus=document.activeElement;
 $('race-library').classList.add('library-open');$('library-toggle').setAttribute('aria-expanded','true');libraryScrim.hidden=forTour;setLibraryModal(!forTour);
 if(!forTour&&focus&&!wasOpen)$('library-close').focus({preventScroll:true});
}
$('browse-races').addEventListener('click',()=>{openLibrary();if(!matchMedia('(max-width:900px)').matches)$('race-search').focus({preventScroll:true});});
$('library-toggle').addEventListener('click',()=>{$('race-library').classList.contains('library-open')?closeLibrary():openLibrary();});$('library-close').addEventListener('click',closeLibrary);libraryScrim.addEventListener('click',closeLibrary);
document.addEventListener('keydown',event=>{
 if(event.defaultPrevented||tour?.isOpen||!$('race-library').classList.contains('library-open'))return;
 if(event.key==='Escape'){event.preventDefault();closeLibrary();return;}
 if(event.key==='Tab'){
  const list=[...$('race-library').querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],summary')].filter(e=>!e.closest('[hidden]')&&e.getClientRects().length);
  if(!list.length){event.preventDefault();$('library-close').focus();return;}
  const first=list[0],last=list.at(-1),inside=list.includes(document.activeElement);
  if(event.shiftKey&&(!inside||document.activeElement===first)){event.preventDefault();last.focus();}else if(!event.shiftKey&&(!inside||document.activeElement===last)){event.preventDefault();first.focus();}
 }
});
const routeReady=()=>!!state.route&&!state.route.blocked;
const stepsByMode={goal:[
 {title:'選擇目標配速',target:'#goal-mode',copy:'你決定完賽目標，配速表會把停留一起算進總時間。'},
 {title:'導入目標路線',target:'#race-library',copy:'找到賽事後按「導入路線」。自己的 GPX 也能使用。'},
 {title:'確認路線',target:'#route-preview',copy:'海拔圖來自 GPX。先看看距離、爬升與缺資料提醒。',ready:routeReady,pending:'還沒導入目標路線；此步先介紹路線檢查。'},
 {title:'設定完賽目標',target:'#goal-settings',copy:'填總完賽時間與起跑時間。需要時再調整速度限制或比較其他目標。'},
 {title:'補给站與停留',target:'#checkpoints-panel',copy:'確認各站里程、停留與官方關門。需要選擇重複經過的位置時，請先確認。',ready:routeReady},
 {title:'產生與查看配速表',target:'#calculate',copy:'由你按「產生配速表」。主表是補站到補站，展開才看上下坡和平路。',ready:routeReady},
 {title:'調整移動配速',target:'#manual-pace-panel',copy:'選區間與移動配速，先預覽，再由你套用鎖定。取消預覽會保留目前結果。',ready:()=>!!state.plan,pending:'目前還沒有配速表。導覽不會自動替你計算。'},
 {title:'比較補站停留',target:'#station-clock-panel',copy:'保留目前移動配速，預覽不同停留安排。套用後可還原上次方案。',ready:()=>!!state.plan},
 {title:'保存結果',target:'#plan-result',copy:'下載目前計畫 JSON，或開啟分段課程後複製、下載文字。原始與含補給站的 GPX 在路線工具列。',ready:()=>!!state.plan,pending:'目前還沒有配速表。導覽不會自動替你計算。'}
],prediction:[
 {title:'選擇完賽預估',target:'#ability-mode',copy:'以過去實際表現推估這場需要多久，不需要填目標完賽時間。'},
 {title:'導入這次的路線',target:'#race-library',copy:'這條是要預估的目標路線。找賽事後按「導入路線」，或使用自己的 GPX。'},
 {title:'提供過去完成的路線',target:'#prediction-reference',copy:'需要另一份你曾跑完的 GPX，才能比較兩條路線。只會在你的瀏覽器計算。'},
 {title:'填那次的真實時間',target:'#prediction-history-time-editor',copy:'填移動時間；若只有總完賽時間，也須知道當時停留多久。未知不能填 0。'},
 {title:'確認本次停留與起跑',target:'#checkpoints-panel',copy:'設定每個補站停留，預估區會同步各站停留總和。起跑時間用來顯示沿途時刻。',ready:routeReady},
 {title:'預估完賽與到站',target:'#prediction-calculate',copy:'確認兩次條件可比，再由你按計算。結果仍是未校準的實驗估算。',ready:routeReady},
 {title:'查看每站時間',target:'#prediction-result',copy:'主表列各站到達、離開與含停留配速。展開可看地形分段。',ready:()=>!$('prediction-result').hidden,pending:'目前尚無預估結果。可以先看完導覽，再填資料。'}
]};
tour=createGuidedTour({launcher:$('tour-open'),stepsByMode,getMode:()=>$('ability-mode').getAttribute('aria-pressed')==='true'?'prediction':'goal',prepare:()=>{tourLibraryWasOpen=$('race-library').classList.contains('library-open');tourLibraryReturnFocus=libraryReturnFocus;},reveal:target=>{if(target==='#race-library')openLibrary({forTour:true});else closeLibrary({restoreFocus:false});},restore:()=>{if(tourLibraryWasOpen){openLibrary({focus:false});libraryReturnFocus=tourLibraryReturnFocus;return $('library-close');}closeLibrary({restoreFocus:false});return null;}});

function refreshSettingsSummary(){refreshAllocationMode();const total=sumCpStops(serviceContext().rows,{routeExists:!!state.route});$('goal-settings-summary').textContent=`${hikingSelected()?'徒步參考 · ':''}目標 ${$('target').value||'待填'} · ${$('start-time').value||'待填'} 起跑 · ${total.status==='known'?'停留 '+Number((total.seconds/60).toFixed(3))+' 分':'停留待確認'}`;}

refreshSettingsSummary();

// Map draft validation shares the original worker; it never preempts foreground work.
async function inspectDrawingBytes(bytes,signal){
  if(state.request||state.requestKind||transport.pending||$('prediction-form').getAttribute('aria-busy')==='true')throw Object.assign(new Error('工作台正在計算，請稍後檢查草稿。'),{code:'worker_busy'});
  const token=state.token,controller=new AbortController();
  const abort=()=>controller.abort();signal.addEventListener('abort',abort,{once:true});if(signal.aborted)controller.abort();
  state.requestKind='drawing-inspect';serviceStopUI?.refresh();refreshWaypointControls();drawingUI?.refresh();
  try{const payload={gpx_b64:base64(bytes)};const route=await transport.request('inspect',payload,{signal:controller.signal});if(token!==state.token||controller.signal.aborted)throw new DOMException('草稿已取消','AbortError');const details=await transport.request('details',payload,{signal:controller.signal});if(token!==state.token||controller.signal.aborted)throw new DOMException('草稿已取消','AbortError');return {route,details};}
  finally{signal.removeEventListener('abort',abort);if(token===state.token&&state.requestKind==='drawing-inspect'){state.requestKind=null;serviceStopUI?.refresh();refreshWaypointControls();drawingUI?.refresh();}}
}
drawingUI=createRouteDrawingUI({inspectBytes:inspectDrawingBytes,applyBytes:(bytes,name,provenance)=>loadBytes(bytes,name,null,provenance),getWorkspace:()=>({revision:`${state.token}:${goalInputRevision}`,plan:state.plan,routeSha256:state.details?.source?.route_sha256||null,gpx:state.gpx,details:state.details}),isBusy:()=>!!(manualPaceUI?.isBusy()||serviceMainBusy||state.request||state.requestKind||transport.pending||$('prediction-form').getAttribute('aria-busy')==='true')});

// Foreground experiment is isolated from planning and never owns a route import.
createLiveUI({root:$('live-panel'),getContext:()=>({route:state.route,gpx_b64:state.gpx,ready:transportMode==='webworker'&&!pendingRouteImport&&!state.calculationGpx&&!!state.details&&state.details.source?.route_sha256===state.route?.route_sha256,checkpoints:[...$('cp-list').children].filter(cp=>cp.dataset.locationPending!=='true').map(cp=>({id:cp.dataset.cpId,name:cp.querySelector('.cp-name').value.trim(),distance_m:Number(cp.querySelector('.cp-distance').value)*1000}))}),request:(payload,signal)=>{if(transportMode!=='webworker')return Promise.reject(new Error('行進中估算僅支援裝置內計算。'));if(state.request||state.requestKind||transport.pending)return Promise.reject(new Error('目前正在規劃或讀取路線，請稍後再估算。'));return transport.request('live_eta',payload,{signal});}});
