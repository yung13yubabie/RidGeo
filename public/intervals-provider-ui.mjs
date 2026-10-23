import {providerMessage} from './intervals-provider-controller.mjs';
/** Bounded compact selection controls. Provider clocks remain source-owned fractional seconds. */
export function createIntervalsProviderUI({controller,documentImpl=globalThis.document,onSourceChange=()=>{},onEvidenceChange=()=>{}}){
 const $=id=>documentImpl.getElementById(id);let shownId=null,uiGeneration=0,pending=null;const chosen=new Set();
 const active=()=>$('prediction-history-source').value==='intervals_provider';
 function qualification(){const v=controller.view(),row=v.records.find(r=>r.id===v.active_record_id);return row?{...row.qualification,completed_on:$('prediction-history-date').value,actual:$('prediction-actual').checked,comparable:$('prediction-comparable').checked,whole_route_confirmed:$('prediction-record-scope').checked,high_effort_confirmed:$('prediction-record-scope').checked,reference_kind:$('prediction-record-kind').value,distinct_activity_confirmed:$('prediction-record-distinct').checked}:null;}
 function save(){if(!active()||!shownId)return;const q=qualification();if(q)controller.updateQualification(shownId,q);}
 function importEnabled(v){return !(v.busy||pending)&&v.list.some(e=>e.selectable&&chosen.has(e.choiceId));}
 function render(){
  const v=controller.view(),is=active(),panel=$('provider-history-panel'),focused=documentImpl.activeElement,focusId=focused&&[...panel.querySelectorAll('input,button')].includes(focused)?focused.id:null;
  panel.hidden=!is;$('prediction-local-history').hidden=is;$('prediction-local-time').hidden=is;
  const row=v.records.find(r=>r.id===v.active_record_id),editable=!is||!!row;
  for(const id of ['prediction-history-date','prediction-actual','prediction-comparable','prediction-record-kind','prediction-record-scope','prediction-record-distinct'])$(id).disabled=!editable;
  for(const id of ['prediction-reference','prediction-time-kind','prediction-history-time','prediction-history-stops'])$(id).disabled=is;
  for(const id of ['prediction-reference-name','prediction-record-list','prediction-add-activity','timed-history'])$(id).hidden=is;
  $('prediction-history-stops-field').hidden=is||$('prediction-time-kind').value==='moving';
  if(is)$('prediction-activity-interval').hidden=true;
  if(!is){shownId=null;return;}
  const busy=v.busy||!!pending,choices=$('provider-history-choices');choices.replaceChildren();
  for(const id of [...chosen])if(!v.list.some(e=>e.choiceId===id&&e.selectable))chosen.delete(id);
  for(const e of v.list){
   const li=documentImpl.createElement('li'),label=documentImpl.createElement('label'),input=documentImpl.createElement('input'),text=documentImpl.createElement('span');
   li.className='provider-history-choice';label.className='check-option';input.type='checkbox';input.id='provider-history-choice-'+(e.choiceId||'unavailable-'+v.list.indexOf(e));input.value=e.choiceId||'';input.disabled=busy||!e.selectable;input.checked=chosen.has(e.choiceId);input.setAttribute('aria-label','匯入 '+(e.name||'未命名活動'));
   input.addEventListener('change',()=>{if(input.checked)chosen.add(e.choiceId);else chosen.delete(e.choiceId);$('provider-history-import').disabled=!importEnabled(controller.view());});
   text.textContent=(e.name||'未命名活動')+' · '+e.startDateLocal+(e.selectable?'':' · 無法讀取');label.append(input,text);li.append(label);choices.append(li);
  }
  const rows=$('provider-history-records');rows.replaceChildren();
  for(const r of v.records){
   const li=documentImpl.createElement('li'),selectLabel=documentImpl.createElement('label'),box=documentImpl.createElement('input'),selectText=documentImpl.createElement('span'),button=documentImpl.createElement('button'),state=documentImpl.createElement('span');
   li.className='history-record provider-history-record';li.dataset.active=String(r.id===v.active_record_id);li.dataset.selected=String(r.selected);
   box.type='checkbox';box.id='provider-history-select-'+r.id;box.checked=r.selected;box.setAttribute('aria-label','選用 '+r.name);selectLabel.className='history-record-select';selectText.textContent='選用';selectLabel.append(box,selectText);
   box.addEventListener('change',()=>{save();controller.select(r.id,box.checked);onEvidenceChange();});
   button.type='button';button.id='provider-history-record-'+r.id;button.className='secondary history-record-edit';button.textContent=r.name;button.setAttribute('aria-pressed',String(r.id===v.active_record_id));button.setAttribute('aria-label','編輯 '+r.name);button.addEventListener('click',()=>{save();controller.activate(r.id);});
   state.id='provider-history-state-'+r.id;state.className='hint history-record-state';state.textContent=r.status==='usable'?'來源完整，資格待確認':'來源有缺口，不可作參考';button.setAttribute('aria-describedby',state.id);li.append(selectLabel,button,state);rows.append(li);
  }
  $('prediction-record-qualification').hidden=!row;
  if(row){
   const q=row.qualification;$('prediction-history-date').value=q.completed_on;$('prediction-actual').checked=q.actual;$('prediction-comparable').checked=q.comparable;$('prediction-record-kind').value=q.reference_kind;$('prediction-record-scope').checked=q.whole_route_confirmed&&q.high_effort_confirmed;$('prediction-record-distinct').checked=q.distinct_activity_confirmed;shownId=row.id;
   $('prediction-editor-name').textContent='正在編輯：'+row.name+(row.selected?'':'（未選用）');
   $('provider-history-summary').textContent='已選 '+v.records.filter(r=>r.selected).length+'／'+v.records.length+' 筆 · 平台移動 '+(row.moving_s===null?'未知':String(row.moving_s)+' 秒')+'；總時間 '+(row.elapsed_s===null?'未知':String(row.elapsed_s)+' 秒')+'。差值不視為補站停留。';
  }else{shownId=null;$('prediction-history-date').value='';for(const id of ['prediction-actual','prediction-comparable','prediction-record-scope','prediction-record-distinct'])$(id).checked=false;$('prediction-record-kind').value='unclassified';$('prediction-editor-name').textContent='先匯入平台活動，再逐筆確認';$('provider-history-summary').textContent=v.list.length?'先勾選活動，再匯入原始紀錄。':'請先讀取活動清單並匯入；尚無可用平台歷史。';}
  $('provider-history-list').disabled=busy;$('provider-history-import').disabled=!importEnabled(v);
  if(focusId){const next=$(focusId);if(next&&[...panel.querySelectorAll('input,button')].includes(next)&&!next.disabled)next.focus({preventScroll:true});}
 }
 function changeSource(){uiGeneration++;pending=null;chosen.clear();save();onSourceChange(active());controller.setActive(active());if(active())$('provider-history-status').textContent='平台存取尚未確認，請讀取活動清單。';render();}
 $('prediction-history-source').addEventListener('change',changeSource);
 $('provider-history-local').addEventListener('click',()=>{const restoreFocus=documentImpl.activeElement===$('provider-history-local');$('prediction-history-source').value='local_gpx';changeSource();if(restoreFocus&&!$('prediction-reference').disabled)$('prediction-reference').focus({preventScroll:true});});
 async function run(kind,action,success){
  if(pending)return;const owner={generation:uiGeneration,kind};pending=owner;save();render();$('provider-history-status').textContent=kind==='list'?'正在確認平台存取並讀取清單…':'正在匯入所選原始紀錄…';
  try{await action();if(pending!==owner||uiGeneration!==owner.generation||!active())return;if(kind==='import')shownId=null;$('provider-history-status').textContent=success;}
  catch(e){if(pending===owner&&uiGeneration===owner.generation&&active())$('provider-history-status').textContent=e.name==='AbortError'?'已取消，可重新讀取活動。':providerMessage(e);}
  finally{if(pending===owner){pending=null;render();}}
 }
 $('provider-history-list').addEventListener('click',()=>{chosen.clear();return run('list',()=>controller.list($('provider-history-oldest').value,$('provider-history-newest').value),'活動清單已讀取；尚未匯入。');});
 $('provider-history-import').addEventListener('click',()=>{const choices=[...$('provider-history-choices').querySelectorAll('input')].filter(i=>i.checked&&!i.disabled).map(i=>i.value);return run('import',()=>controller.importChoices(choices),'已匯入原始平台紀錄，請逐筆確認資格。');});
 const newest=new Date(),oldest=new Date(newest);oldest.setDate(oldest.getDate()-30);const day=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;$('provider-history-oldest').value=day(oldest);$('provider-history-newest').value=day(newest);render();return{active,save,render,qualification};
}
