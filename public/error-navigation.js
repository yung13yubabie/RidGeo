import {terrainErrorActions,resolveTerrainAction,focusTerrainAction} from './terrain-guidance.mjs';
import {visibleTimeField,timeInputEditor} from './segmented-time-input.mjs';
export function focusErrorField(source,{activate=()=>{}}={}){if(!source)return false;const field=visibleTimeField(source);activate();for(let p=field.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;if(field.closest('[hidden]'))return false;const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;field.scrollIntoView?.({block:'center',inline:'nearest',behavior:reduced?'auto':'smooth'});field.focus?.({preventScroll:true});return true;}
/** Structured field links; only an explicit, guarded Apply can reformat entered time. */
export function errorFieldIds(error,mode='goal',timeKind='moving'){
 if(Array.isArray(error?.fieldIds))return error.fieldIds;
 const c=error?.code;
 const goal={hiking_consent_required:['hiking-consent'],infeasible_target:['target','@stops','max-speed','min-speed','walk-speed','walk-grade'],stops_exceed_target:['target','@stops'],invalid_target:['target'],invalid_fatigue:['fatigue'],invalid_speed:['max-speed','min-speed'],invalid_walk:['walk-grade','walk-speed','max-speed'],invalid_speed_bounds:['min-speed','walk-speed'],invalid_checkpoint_distance:['@distances'],invalid_stop:['@stops'],invalid_cutoff:['@cutoffs'],invalid_cutoff_kind:['@kinds']};
 if(mode==='goal')return goal[c]||[];
 if(mode==='ability')return {invalid_reference:['ability-history-time','ability-history-date','ability-target-date','ability-history-stops','ability-target-stops','ability-history-distance','ability-target-distance'],history_older_than_365_days:['ability-history-date','ability-target-date'],history_stops_required_to_change_stops:['ability-history-stops','ability-target-stops'],same_route_not_confirmed:['ability-same-confirm'],road_or_track_domain_required:['ability-sport','ability-history-distance','ability-target-distance']}[c]||[];
 const times=timeKind==='elapsed'?['prediction-history-time','prediction-history-stops','prediction-time-kind']:['prediction-history-time','prediction-time-kind'];
 const prediction={reference_stop_conflict:times,reference_time_conflict:times,reference_moving_unknown:times,prediction_date_order:['prediction-history-date','prediction-date'],reference_too_old:['prediction-history-date','prediction-date'],invalid_prediction_date:['prediction-history-date','prediction-date'],prediction_confirmation_required:['prediction-actual','prediction-comparable'],invalid_fatigue_scenario:['prediction-fatigue','prediction-slowdown'],invalid_cap_scenario:['prediction-up-grade','prediction-up-cap','prediction-down-grade','prediction-down-cap'],hybrid_reference_infeasible:[...times,'prediction-steep-up','prediction-steep-down','prediction-max-speed'],invalid_target_stops:['prediction-target-stops','@stops']};
 if(c==='invalid_prediction_number'){const keys={reference_moving_s:'prediction-history-time',reference_elapsed_s:'prediction-history-time',reference_stops_s:'prediction-history-stops',max_speed_m_s:'prediction-max-speed',uphill_cap_grade:'prediction-up-grade',uphill_cap_m_s:'prediction-up-cap',downhill_cap_grade:'prediction-down-grade',downhill_cap_m_s:'prediction-down-cap',target_stops_s:'prediction-target-stops'};return Object.entries(keys).filter(([k])=>String(error.message).includes(k)).map(([,v])=>v);}
 return prediction[c]||[];
}
export function goalBoundsText(details){
 if(details?.kind!=='goal_time_bounds'||![details.target_elapsed_s,details.stops_s,details.moving_s,details.minimum_moving_s].every(Number.isFinite))return '';
 const clock=s=>{const sign=s<0?'−':'',n=Math.round(Math.abs(s));return `${sign}${Math.floor(n/3600)}:${String(Math.floor(n/60)%60).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;};
 if(details.constraint_conflict===true||(Number.isFinite(details.maximum_moving_s)&&details.minimum_moving_s>details.maximum_moving_s))return '目前速度上下限互相衝突，請調整最低速度或徒步上限。';
 const upper=Number.isFinite(details.maximum_moving_s)?clock(details.maximum_moving_s):'不設上限';
 return `目前總時 ${clock(details.target_elapsed_s)} − 停留 ${clock(details.stops_s)} = 移動 ${clock(details.moving_s)}。目前速度設定允許移動 ${clock(details.minimum_moving_s)} 至 ${upper}。`;
}
export function createErrorNavigator({feedback,mode='goal',activate=()=>{},documentImpl=globalThis.document}){
 const doc=documentImpl,box=doc.createElement('div');box.className='error-navigation';box.hidden=true;feedback.insertAdjacentElement('afterend',box);let entries=[],serial=0,generation=0;
 const clear=()=>{generation++;for(const {field,note,oldInvalid} of entries){const ids=(field.getAttribute('aria-describedby')||'').split(/\s+/).filter(x=>x&&x!==note.id);if(ids.length)field.setAttribute('aria-describedby',ids.join(' '));else field.removeAttribute('aria-describedby');if(oldInvalid===null)field.removeAttribute('aria-invalid');else field.setAttribute('aria-invalid',oldInvalid);note.remove();}entries=[];box.replaceChildren();box.hidden=true;};
 const jump=source=>focusErrorField(source,{activate:()=>activate(mode)});
 function show(error,{form,fields=[],autofocus=true}={}){
  clear();const terrainActions=terrainErrorActions(error,mode),ids=errorFieldIds(error,mode,doc.getElementById('prediction-time-kind')?.value);const selectors={'@stops':'.cp-stop','@distances':'.cp-distance','@cutoffs':'.cp-cutoff','@kinds':'.cp-kind'};
  let candidates=[...fields,...(error?.fields||[]),...ids.flatMap(id=>selectors[id]?[...doc.querySelectorAll(selectors[id])]:[doc.getElementById(id)])].filter(Boolean);
  if(form)candidates.push(...[...form.querySelectorAll('input,select,textarea')].filter(f=>f.willValidate&&!f.checkValidity()));
  candidates=[...new Set(candidates.map(visibleTimeField))].filter(f=>!f.disabled&&(!f.closest('[hidden]')||['planner-form','ability-workspace'].includes(f.closest('[hidden]').id)));
  const context=goalBoundsText(error?.details);if(context){const p=doc.createElement('p');p.textContent=context;box.append(p);}
  const repairEditors=new Set(),token=generation;
  let firstTerrainAction=null;
  for(const action of terrainActions){if(!resolveTerrainAction(action,{documentImpl:doc}))continue;const button=doc.createElement('button');button.type='button';button.className='text-button';button.textContent=action.label;button.addEventListener('click',()=>{if(token===generation&&!box.hidden&&button.parentElement===box)focusTerrainAction(action,{documentImpl:doc,activate:()=>activate(mode)});});box.append(button);firstTerrainAction??=action;}

  for(const field of candidates){const label=field.getAttribute('aria-label')||field.labels?.[0]?.textContent?.trim()||field.name||field.id||'此欄位';const title=label.replace(/\s+/g,' ').slice(0,70);const value=field.type==='checkbox'?(field.checked?'已勾選':'未勾選'):field.value||'未填';const limits=[field.min!==''&&field.min!==undefined?`至少 ${field.min}`:'',field.max!==''&&field.max!==undefined?`至多 ${field.max}`:''].filter(Boolean).join('，');const note=doc.createElement('span');note.id=`field-error-${mode}-${++serial}`;note.className='field-error';note.textContent=`目前：${value}${limits?`；${limits}`:''}。`;const reason=doc.createElement('span');reason.className='sr-only';reason.textContent=error.message||'請確認此欄位。';note.append(reason);field.insertAdjacentElement('afterend',note);const oldInvalid=field.getAttribute('aria-invalid');field.setAttribute('aria-invalid','true');field.setAttribute('aria-describedby',[(field.getAttribute('aria-describedby')||''),note.id].filter(Boolean).join(' '));entries.push({field,note,oldInvalid});const button=doc.createElement('button');button.type='button';button.className='text-button';button.textContent=`修正：${title}`;button.addEventListener('click',()=>{if(token===generation)jump(field);});box.append(button);
   const editor=timeInputEditor(field),proposal=editor&&!repairEditors.has(editor)?editor.proposeRepair():null;
   if(proposal){repairEditors.add(editor);const repair=doc.createElement('div');repair.className='time-format-suggestion';const preview=doc.createElement('p');preview.textContent=`時間格式 ${proposal.before} → ${proposal.after}${proposal.width>editor.width?'（改用長時數）':''}。只整理已填數字，仍需重新計算確認。`;const apply=doc.createElement('button');apply.type='button';apply.className='text-button';apply.textContent='套用時間格式';apply.addEventListener('click',()=>{if(token!==generation||box.hidden||!repair.parentElement)return;if(editor.applyRepair(proposal)){clear();editor.validate(true);jump(editor.source);}else{preview.textContent='輸入已變更，請重新檢查。';apply.disabled=true;}});const cancel=doc.createElement('button');cancel.type='button';cancel.className='text-button';cancel.textContent='保留原值';cancel.addEventListener('click',()=>repair.remove());repair.append(preview,apply,cancel);box.append(repair);}
  }
  if(!candidates.length&&!context&&!firstTerrainAction){const p=doc.createElement('p');p.textContent='請確認路線來源與資料狀態，再重試；目前沒有可直接修正的欄位。';box.append(p);}box.hidden=false;const first=candidates[0];for(const field of candidates)for(let p=field.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;if(first&&autofocus)jump(first);else if(firstTerrainAction&&autofocus)focusTerrainAction(firstTerrainAction,{documentImpl:doc,activate:()=>activate(mode)});
 }
 function offer({label,onActivate}){
  clear();if(typeof label!=='string'||typeof onActivate!=='function')return;
  const token=generation,button=doc.createElement('button');button.type='button';button.className='text-button';button.textContent=label;
  button.addEventListener('click',()=>{if(token===generation&&!box.hidden&&button.parentElement===box)onActivate();});
  box.append(button);box.hidden=false;
 }
 return {show,offer,clear,jump,element:box};
}
