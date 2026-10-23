import {buildTerrainSegments} from './terrain-segments.mjs';
import {buildCheckpointGroups,checkpointRowDisplay} from './checkpoint-groups.mjs';
import {buildTerrainHierarchy,selectTerrainLevel,TERRAIN_SUMMARY_LEVELS} from './terrain-summary.mjs';
import {checkpointDeadline} from './cutoff-view.js';
import {appendCheckpointTime,formatElapsedDuration} from './checkpoint-time.mjs';
/** Read-only projections of the original core prefix timeline. Never edits plan or CP inputs. */
const cache=new WeakMap(),renderedPlans=new WeakMap();
export function planDisplay(plan){
  if(!cache.has(plan)){const raw=buildTerrainSegments(plan);cache.set(plan,{raw,summary:buildCheckpointGroups(plan,raw),hierarchy:buildTerrainHierarchy(raw)});}
  return cache.get(plan);
}
export function displayTerrain(plan,level='standard'){return selectTerrainLevel(planDisplay(plan).hierarchy,level);}
export function terrainPolicyText(level){const p=TERRAIN_SUMMARY_LEVELS[level]||TERRAIN_SUMMARY_LEVELS.standard;return level==='raw'?'保留原始地形分段。':`合併較小的反向起伏：累積反向高差最多 ${p.reverse_relief_m} m，跨接距離最多 ${p.bridge_distance_m} m。`;}
const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
const finite=n=>typeof n==='number'&&Number.isFinite(n);
export const movingPaceText=seconds=>{if(!finite(seconds)||seconds<0)return '未知';const n=Math.round(seconds);return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;};
const metres=n=>finite(n)?`${Math.round(n)} m`:'未知';
const km=n=>finite(n)?(n/1000).toFixed(3):'未知';
const detail=(label,value,cls='')=>{const box=node('div','schedule-metric '+cls);box.append(node('span','schedule-caption',label),node('strong','',value));return box;};
function timeDetail(label,seconds,start){const box=node('div','schedule-time');box.append(node('span','schedule-caption',label));const clock=node('div','');appendCheckpointTime(clock,seconds,start);box.append(clock);return box;}
export function renderTerrainList(container,rows,{startTime='00:00',deadlineContext,checkpoints=[]}={}){
  container.replaceChildren();container.className='terrain-list';
  const cpAt=new Map(checkpoints.map(cp=>[cp.distance_m,cp]));
  for(const [index,row]of rows.entries()){
    const shown=[row.start_elapsed_s,row.arrival_elapsed_s,row.departure_elapsed_s].every(finite)?checkpointRowDisplay(row):{moving_s:null,stops_s:null,arrival_elapsed_s:null,departure_elapsed_s:null},item=node('li','terrain-detail-row');item.dataset.startM=String(row.start_m);item.dataset.endM=String(row.end_m);
    const head=node('div','terrain-row-heading');head.append(node('strong','',`${index+1} · ${row.label}${row.checkpoint?' · '+row.checkpoint.name:''}`),node('span','',`${km(row.start_m)}–${km(row.end_m)} km`));
    const facts=node('div','terrain-row-facts');const length=row.end_m-row.start_m;facts.append(detail('段長',!finite(length)||length<0?'未知':length>0&&length<1?'<1 m':length<1000?`${Math.round(length)} m`:`${km(length)} km`),detail('平均移動配速',movingPaceText(row.pace_s_per_km)+' /km'),detail('區間移動',formatElapsedDuration(shown.moving_s)),detail('停留',formatElapsedDuration(shown.stops_s)),detail('上升／下降',`${metres(row.gain_m)} / ${metres(row.loss_m)}`));
    const clocks=node('div','schedule-clocks');clocks.append(timeDetail('到站',shown.arrival_elapsed_s,startTime),timeDetail('離站',shown.departure_elapsed_s,startTime));
    item.append(head,facts,clocks);if(deadlineContext&&(row.checkpoint||row.end_m===deadlineContext.distance_m)){const endpoint=cpAt.get(row.end_m)||{name:row.checkpoint?.name||'終點',distance_m:row.end_m,arrival_elapsed_s:row.arrival_elapsed_s,departure_elapsed_s:row.departure_elapsed_s};const deadline=checkpointDeadline(endpoint,deadlineContext);item.append(node('span','schedule-cutoff '+deadline.status,deadline.label));}container.append(item);
  }
}
export function renderCheckpointSchedule(container,plan,{startTime='00:00',deadlineContext,level='standard',expanded=new Set(),selectedIndex=0,onSelect=()=>{}}={}){
  const {summary}=planDisplay(plan),terrain=displayTerrain(plan,level);
  // Native toggle events are queued. Snapshot current open state before replacing rows,
  // and never let a detached old disclosure alter the replacement's state.
  if(renderedPlans.get(container)===plan)for(const station of container.querySelectorAll('.schedule-station')){const index=Number(station.dataset.stationIndex);if(station.querySelector('.station-terrain')?.open)expanded.add(index);else expanded.delete(index);}
  renderedPlans.set(container,plan);container.replaceChildren();container.className='checkpoint-schedule';
  if(summary.mode!=='checkpoints'){const list=node('ol','terrain-list');renderTerrainList(list,terrain,{startTime,deadlineContext,checkpoints:plan.checkpoints});container.append(list);return summary;}
  for(const [index,group]of summary.groups.entries()){
    const shown=group.display,cp=group.checkpoint,station=node('article','schedule-station');station.dataset.stationIndex=String(index);station.dataset.distanceM=String(group.end_m);station.className+=''+(index===selectedIndex?' selected':'');
    const heading=node('div','schedule-station-heading'),pick=node('button','station-select');pick.type='button';pick.setAttribute('aria-pressed',String(index===selectedIndex));pick.setAttribute('aria-label',`在剖面查看 ${group.end_name}`);pick.append(node('span','station-number',index===summary.groups.length-1&&group.end_m===summary.totals.distance_m?'終':String(index+1).padStart(2,'0')),node('strong','',group.end_name));pick.addEventListener('click',()=>onSelect(index));
    const endpoint=cp||{name:group.end_name,distance_m:group.end_m,arrival_elapsed_s:group.arrival_elapsed_s,departure_elapsed_s:group.departure_elapsed_s};const deadline=deadlineContext?checkpointDeadline(endpoint,deadlineContext):{label:'關門待核',status:'unknown'};heading.append(pick,node('span','schedule-cutoff '+deadline.status,deadline.label));
    const distance=node('p','schedule-distance',`累積 ${km(group.end_m)} km`),clocks=node('div','schedule-clocks');
    // Only exact raw zero permits the shared arrival/departure presentation.
    const rawStop=cp?cp.stop_s:group.end_m===summary.totals.distance_m?0:null;
    if(rawStop===0){const zero=detail('本站停留','0 分','zero-stop');zero.append(node('small','schedule-caption','到站即離站'));clocks.append(timeDetail('到／離站',shown.arrival_elapsed_s,startTime),zero);}
    else clocks.append(timeDetail('到站',shown.arrival_elapsed_s,startTime),timeDetail('離站',shown.departure_elapsed_s,startTime));
    const facts=node('div','schedule-facts');facts.append(detail('本段',km(group.distance_m)+' km'),detail('移動配速',movingPaceText(group.moving_pace_s_per_km)+' /km'),detail('站間移動',formatElapsedDuration(shown.moving_s)),detail('停留',formatElapsedDuration(shown.stops_s)));
    const section=node('details','station-terrain');section.open=expanded.has(index);const children=terrain.filter(r=>r.start_m>=group.start_m&&r.end_m<=group.end_m),label=node('summary','',`細分地形 · ${children.length} 段`),context=node('p','schedule-range',`${group.start_name} → ${group.end_name} · ${km(group.start_m)}–${km(group.end_m)} km · ↑${metres(group.gain_m)} / ↓${metres(group.loss_m)} · 含停留配速 ${movingPaceText(group.elapsed_pace_s_per_km)} /km`),list=node('ol','terrain-list');renderTerrainList(list,children,{startTime,deadlineContext,checkpoints:plan.checkpoints});section.append(label,context,list);section.addEventListener('toggle',()=>{if(station.parentElement!==container)return;if(section.open)expanded.add(index);else expanded.delete(index);});
    station.append(heading,distance,clocks,facts,section);container.append(station);
  }
  return summary;
}
export function markSelectedStation(container,index){for(const row of container.querySelectorAll('.schedule-station')){const selected=Number(row.dataset.stationIndex)===index;row.className='schedule-station'+(selected?' selected':'');row.querySelector('.station-select')?.setAttribute('aria-pressed',String(selected));}}
