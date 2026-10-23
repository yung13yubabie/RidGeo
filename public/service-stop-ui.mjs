import {validateTemplateStore,encodeTemplateStore,decodeTemplateStore,createStopPreview,snapshotSignature,parseStopValue,sumCpStops} from './service-stop-drafts.mjs';
import {parseCpStopValue} from './cp-stop-seconds.mjs';

const STORAGE_KEY='ridgeq.service-stop-templates.v1';
const TASKS={water:'補水',food:'進食',gear:'整裝',clothes:'換裝',rest:'休息',other:'其他'};
const blankStore=()=>({version:1,templates:[],defaultTemplateId:null});
const showMinutes=(raw,parser=parseCpStopValue)=>{const value=parser(raw);return value.status==='known'?`${raw} 分`:value.status==='unknown'?'未填':'待確認';};

/** Local arrangement UI. Only an explicit guarded transaction writes CP stops. */
export function createServiceStopUI({getContext,isBusy,commitStops,storage}){
 const $=id=>document.getElementById(id),panel=$('service-stops');
 let editorErrorFields=[];
 let stationIdentities=new Map();
 const stationIdentity=row=>JSON.stringify([row.name,row.distanceRaw,row.kind,row.locationPending]);
 let store=blankStore(),choices=new Map(),preview=null,undo=null,editorId=null,sequence=0,rendered='',messageText='';
 let localStorage=null,storageProblem='';
 try{localStorage=storage===undefined?globalThis.localStorage:storage;const raw=localStorage?.getItem(STORAGE_KEY);if(raw){try{store=decodeTemplateStore(raw);}catch{storageProblem='已存組合無法讀取，可重新建立。';}}}catch{storageProblem='這次可用，尚未儲存。';}
 const message=(text,tone='neutral')=>{messageText=text;$('service-status').textContent=text;$('service-status').className=`status-tag ${tone}`;$('service-status').hidden=!text;};
 const option=(value,label)=>{const el=document.createElement('option');el.value=value;el.textContent=label;return el;};
 const currentChoice=id=>choices.get(id)||{templateId:'',selected:false,availableConfirmed:false};
 function input(){const context=getContext();return {...context,templates:store.templates,choices:context.rows.map(row=>{const c=currentChoice(row.id);return {id:row.id,templateId:c.templateId||store.defaultTemplateId||'',selected:c.selected,availableConfirmed:c.availableConfirmed};})};}
 function invalidatePreview(text=''){preview=null;$('service-preview').hidden=true;$('service-preview-rows').replaceChildren();$('service-apply').disabled=true;if(text)message(text,'warning');}
 function persist(){try{const encoded=encodeTemplateStore(store);if(typeof encoded!=='string')throw Error('invalid');if(!localStorage)throw Error('unavailable');localStorage.setItem(STORAGE_KEY,encoded);storageProblem='';}catch{storageProblem='這次可用，尚未儲存。';}$('service-storage-status').textContent=storageProblem||'儲存在此瀏覽器';}
 function fillTemplates(){
  const select=$('service-template');select.replaceChildren(option('','選組合'));for(const t of store.templates)select.append(option(t.id,t.name));select.value=store.defaultTemplateId||'';
  $('service-template-edit').disabled=!store.defaultTemplateId;$('service-template-delete').disabled=!store.defaultTemplateId;$('service-template-new').disabled=store.templates.length>=16;
  $('service-storage-status').textContent=storageProblem||'儲存在此瀏覽器';
 }
 function templateChanged(){for(const c of choices.values())c.availableConfirmed=false;invalidatePreview();rendered='';fillTemplates();refresh();}
 function clearEditorErrors(){for(const field of editorErrorFields){field.removeAttribute('aria-invalid');field.removeAttribute('aria-describedby');}editorErrorFields=[];}
 function editorError(text,id){clearEditorErrors();const field=$(id);field.setAttribute('aria-invalid','true');field.setAttribute('aria-describedby','service-status');editorErrorFields=[field];message(text,'warning');field.focus();}
 function openEditor(id=null){
  clearEditorErrors();invalidatePreview();
  editorId=id;const template=store.templates.find(t=>t.id===id);$('service-template-name').value=template?.name||'';$('service-template-minutes').value=template?.minutes||'';
  for(const key of Object.keys(TASKS))$(`service-task-${key}`).checked=!!template?.tasks.includes(key);
  $('service-template-editor').open=true;refresh();$('service-template-name').focus();
 }
 $('service-template-new').addEventListener('click',()=>openEditor());
 $('service-template-edit').addEventListener('click',()=>{if(store.defaultTemplateId)openEditor(store.defaultTemplateId);});
 $('service-template-cancel').addEventListener('click',()=>{$('service-template-editor').open=false;editorId=null;clearEditorErrors();refresh();});
 $('service-template-save').addEventListener('click',()=>{
  if(!$('service-template-minutes').checkValidity()){editorError('請填有效分鐘，未知時間可留空。','service-template-minutes');return;}
  const id=editorId||`template-${Date.now()}-${++sequence}`,template={id,name:$('service-template-name').value.trim(),tasks:Object.keys(TASKS).filter(key=>$(`service-task-${key}`).checked),minutes:$('service-template-minutes').value};
  const next={version:1,templates:[...store.templates.filter(t=>t.id!==id),template],defaultTemplateId:id};const valid=validateTemplateStore(next);
  if(!valid.ok){const error=valid.errors[0],duplicate=error.code==='duplicate_template_bundle',minutes=error.path?.includes('minutes'),tasks=error.path?.includes('tasks');editorError(duplicate?'此任務組合已存在，請編輯原組合。':minutes?'請填有效分鐘，未知時間可留空。':tasks?'請選擇這個組合的任務。':'請填組合名稱（最多 60 字）。',minutes?'service-template-minutes':tasks?'service-task-water':'service-template-name');return;}
  clearEditorErrors();
  store=valid.value;persist();templateChanged();$('service-template-editor').open=false;editorId=null;refresh();message(storageProblem||'組合已儲存');$('service-template').focus();
 });
 $('service-template-delete').addEventListener('click',()=>{
  const id=store.defaultTemplateId;if(!id)return;store={version:1,templates:store.templates.filter(t=>t.id!==id),defaultTemplateId:null};for(const c of choices.values())if(c.templateId===id)c.templateId='';persist();templateChanged();message('組合已刪除');
 });
 $('service-template-clear').addEventListener('click',()=>{store=blankStore();choices.clear();try{localStorage?.removeItem(STORAGE_KEY);storageProblem='';}catch{storageProblem='本機儲存無法清除，請檢查瀏覽器設定。';}templateChanged();$('service-template-editor').open=false;refresh();message(storageProblem||'已清除常用組合',storageProblem?'warning':'neutral');});
 $('service-template').addEventListener('change',()=>{store={...store,defaultTemplateId:$('service-template').value||null};persist();templateChanged();});
 function renderRows(context){
  const holder=$('service-stations');holder.replaceChildren();const ids=new Set(context.rows.map(row=>row.id));for(const id of choices.keys())if(!ids.has(id))choices.delete(id);
  for(const row of context.rows){
   const c={...currentChoice(row.id)};choices.set(row.id,c);const item=document.createElement('div');item.className='service-station';item.dataset.cpId=row.id;
   const label=document.createElement('label');label.className='service-station-select';const pick=document.createElement('input');pick.type='checkbox';pick.checked=c.selected;pick.className='service-station-pick';pick.setAttribute('aria-label',`套用到 ${row.name||'未命名補給站'}`);const name=document.createElement('span');name.textContent=row.name||'未命名補給站';label.append(pick,name);
   const current=document.createElement('span');current.className='service-current';current.textContent=`目前 ${showMinutes(row.rawStop)}`;
   const kind=row.kind==='timing_only'?'純計時站':row.kind==='finish'?'終點':null;pick.disabled=!!kind;if(kind){c.selected=false;const note=document.createElement('span');note.className='status-tag neutral';note.textContent=kind;item.append(label,current,note);holder.append(item);continue;}
   const selectLabel=document.createElement('label');selectLabel.className='service-bundle-label';const caption=document.createElement('span');caption.textContent='此站組合';const select=document.createElement('select');select.className='service-station-template';select.setAttribute('aria-label',`${row.name||'補給站'}的組合`);select.append(option('','依常用組合'));for(const t of store.templates)select.append(option(t.id,t.name));select.value=c.templateId;selectLabel.append(caption,select);
   const tasks=document.createElement('span');tasks.className='service-tasks';const showTasks=()=>{const t=store.templates.find(t=>t.id===(c.templateId||store.defaultTemplateId));tasks.textContent=t?`${t.tasks.map(key=>TASKS[key]).join(' · ')} · ${showMinutes(t.minutes,parseStopValue)}`:'尚未選組合';};showTasks();
   const available=document.createElement('label');available.className='service-available';const confirm=document.createElement('input');confirm.type='checkbox';confirm.className='service-station-available';confirm.setAttribute('aria-label',`確認 ${row.name||'未命名補給站'} 可完成此組合`);confirm.checked=c.availableConfirmed;const text=document.createElement('span');text.textContent='確認這站可完成此組合';available.append(confirm,text);
   const selected=()=>{c.selected=pick.checked;invalidatePreview();message('');};pick.addEventListener('change',selected);
   select.addEventListener('change',()=>{c.templateId=select.value;c.availableConfirmed=false;confirm.checked=false;showTasks();invalidatePreview();message('');});
   confirm.addEventListener('change',()=>{c.availableConfirmed=confirm.checked;invalidatePreview();message('');});
   item.append(label,current,selectLabel,tasks,available);holder.append(item);
  }
 }
 function refresh(){
  const context=getContext(),signature=JSON.stringify(context);for(const row of context.rows){const identity=JSON.stringify([context.routeRevision,context.mappingRevision,stationIdentity(row)]),previous=stationIdentities.get(row.id);if(previous!==undefined&&previous!==identity){const c=choices.get(row.id);if(c)c.availableConfirmed=false;}stationIdentities.set(row.id,identity);}for(const id of stationIdentities.keys())if(!context.rows.some(row=>row.id===id))stationIdentities.delete(id);if(signature!==rendered){if(preview)invalidatePreview('資料已變更，請重新預覽。');rendered=signature;renderRows(context);}
  const reason=!context.routeExists?'先選一條路線':!context.rows.length?'先新增補給站':!store.templates.length?'建立一組常用停留':'';
  $('service-empty').textContent=reason;$('service-empty').hidden=!reason;$('service-preview-button').disabled=!!reason||$('service-template-editor').open;
  $('service-apply').disabled=!preview||!preview.entries.some(row=>row.apply)||isBusy();$('service-undo').disabled=!undo||isBusy();$('service-undo').hidden=!undo;
  $('service-state').textContent=isBusy()?'計算中':preview?'待套用':undo?'已套用':'待安排';$('service-state').className=`status-tag ${isBusy()?'warning':'neutral'}`;
 }
 $('service-template-editor').addEventListener('toggle',()=>{if($('service-template-editor').open)invalidatePreview();refresh();});
 $('service-template-editor').addEventListener('input',()=>{invalidatePreview();refresh();});
 $('service-preview-button').addEventListener('click',()=>{
  if($('service-template-editor').open)return;
  try{refresh();const data=input();preview=createStopPreview(data);const selected=preview.entries.filter(row=>currentChoice(row.id).selected);const list=$('service-preview-rows');list.replaceChildren();
   if(!selected.length){invalidatePreview();message('先選要套用的站','warning');return;}
   for(const row of selected){const line=document.createElement('li');const source=data.rows.find(cp=>cp.id===row.id);line.textContent=`${source.name||'未命名補給站'} · ${showMinutes(row.currentRaw)} → ${row.eligible?showMinutes(row.proposedRaw):row.statusText}`;list.append(line);}
   const after=data.rows.map(row=>{const proposal=preview.entries.find(p=>p.id===row.id);return {...row,rawStop:proposal?.apply?proposal.proposedRaw:row.rawStop};});const total=sumCpStops(after,{routeExists:data.routeExists});
   $('service-total').textContent=total.status==='known'?`套用後合計 ${total.minutes} 分`:'合計待確認';const changed=preview.entries.filter(row=>row.apply).length;$('service-apply').textContent=`套用 ${changed} 站`;
   $('service-preview').hidden=false;message(selected.some(row=>!row.eligible)?'部分站點待確認':'');refresh();$('service-preview-heading').focus();
  }catch{invalidatePreview();message('請確認組合與補給站設定，再重新預覽。','warning');}
 });
 $('service-apply').addEventListener('click',()=>{
  if(isBusy()){message('計算中，完成後可套用。','warning');return;}if(!preview)return;
  try{const current=input();if(snapshotSignature(current)!==preview.signature){invalidatePreview('資料已變更，請重新預覽。');return;}
   const changes=preview.entries.filter(row=>row.apply).map(row=>({id:row.id,expectedRaw:row.currentRaw,expectedRevision:current.rows.find(cp=>cp.id===row.id).stopRevision,value:row.proposedRaw}));
   if(!changes.length)return;const result=commitStops(changes);if(!result?.ok){invalidatePreview('資料已變更，請重新預覽。');return;}
   undo={routeRevision:current.routeRevision,mappingRevision:current.mappingRevision,changes:result.changes.map(change=>({...change,stationIdentity:stationIdentity(current.rows.find(row=>row.id===change.id))}))};invalidatePreview();rendered='';refresh();message(`已更新 ${result.changes.length} 站 · 請重新計算`);$('service-undo').focus();
  }catch{invalidatePreview();message('未套用，請重新預覽。','warning');}
 });
 $('service-undo').addEventListener('click',()=>{
  if(isBusy()){message('計算中，完成後可撤銷。','warning');return;}if(!undo)return;
  const context=getContext();if(context.routeRevision!==undo.routeRevision||context.mappingRevision!==undo.mappingRevision){undo=null;refresh();message('路線已變更，保留目前設定。','warning');return;}
  const changes=[];let kept=0;for(const change of undo.changes){const row=context.rows.find(row=>row.id===change.id);if(row&&row.rawStop===change.afterRaw&&row.stopRevision===change.afterRevision&&stationIdentity(row)===change.stationIdentity)changes.push({id:row.id,expectedRaw:row.rawStop,expectedRevision:row.stopRevision,value:change.beforeRaw});else kept++;}
  if(changes.length){const result=commitStops(changes);if(!result?.ok){message('資料已變更，保留目前設定。','warning');return;}}
  undo=null;invalidatePreview();rendered='';refresh();message(`已撤銷 ${changes.length} 站${kept?` · ${kept} 站另行修改，保留目前值`:''}`);$('service-preview-button').focus();
 });
 panel.addEventListener('toggle',()=>{if(panel.open)refresh();});
 fillTemplates();refresh();
 return {refresh,resetRoute(){choices.clear();stationIdentities.clear();undo=null;invalidatePreview();panel.open=false;rendered='';message('');refresh();},invalidateMapping(){undo=null;invalidatePreview();rendered='';refresh();},getTemplateStore(){return structuredClone(store);}};
}
