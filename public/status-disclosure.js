import {terrainDiagnosticActions,resolveTerrainAction,focusTerrainAction} from './terrain-guidance.mjs';
/** Concise, text-labelled status disclosures. Model data and decisions are unchanged. */
const diagnosticCopy={
 namespace_missing:['GPX 格式提醒','route-details','查看 GPX'],
 activity_fields_ignored:['活動欄位未採用','route-details','查看 GPX'],
 disconnected_segments:['路線有斷段','route-details','查看分段'],
 short_segment:['軌跡點不足','route-details','查看分段'],
 vertical_jump:['海拔衝突','repair-panel','查看處理方式'],
 sparse_or_jump:['軌跡有缺口','route-details','查看分段'],
 duplicate_points:['重複座標','route-details','查看 GPX'],
 zero_length:['無有效里程','route-details','查看 GPX'],
 route_too_long:['超過 500 km','route-details','查看 GPX'],
 missing_elevation:['海拔缺漏','elevation-locator','定位缺點'],
 grade_out_of_domain:['超出跑步模型','source-quality','檢查來源'],
 cutoff_missed:['超過關門','plan-table-title','查看站間表']
};
export function routeStatus(route){
 if(route.blocked)return {label:'暫不可計算',tone:'error'};
 if(!route.elevation_complete)return {label:'海拔缺漏',tone:'warning'};
 if(route.quality?.some(q=>q.code==='grade_out_of_domain'))return {label:'超出跑步模型',tone:'warning'};
 return {label:'路線已讀取',tone:'neutral'};
}
const compactDiagnosticCopy={
 missing_elevation:'缺少海拔，坡度仍未知。',
 grade_out_of_domain:'先檢查來源，尚未確認是地形或海拔誤差。'
};
export function renderDiagnosticNotices(element,items,{documentImpl=element.ownerDocument||globalThis.document}={}){
 element.replaceChildren();element.classList.add('diagnostic-list');
 const groups=new Map();for(const item of items){const tone=item.severity||(item.code==='cutoff_missed'?'error':'neutral');const key=`${item.code||item.message}:${tone}`;if(!groups.has(key))groups.set(key,{item,tone,messages:[],count:0});const group=groups.get(key);group.count++;if(!group.messages.includes(item.message))group.messages.push(item.message);}
 for(const {item,tone,messages,count} of groups.values()){
  const [label,targetId,action]=Object.hasOwn(diagnosticCopy,item.code)?diagnosticCopy[item.code]:[tone==='error'?'資料待處理':tone==='warning'?'資料提醒':'資料備註',null,null];
  const essential=tone==='error'||tone==='warning';
  const li=documentImpl.createElement('li');li.className=`diagnostic-item${essential?' diagnostic-essential':''}`;li.setAttribute('data-tone',tone);
  const details=documentImpl.createElement(essential?'div':'details');details.className=essential?'diagnostic-callout':'status-disclosure';
  const summary=documentImpl.createElement(essential?'div':'summary');summary.className=`status-tag ${tone}`;
  const icon=documentImpl.createElement('span');icon.setAttribute('aria-hidden','true');icon.textContent=tone==='error'?'!':tone==='warning'?'△':'i';
  const text=documentImpl.createElement('span');text.textContent=label+(count>1?` ×${count}`:'');summary.append(icon,text);
  const body=documentImpl.createElement('div');body.className=essential?'status-detail diagnostic-message':'status-detail';
  const compact=essential&&Object.hasOwn(compactDiagnosticCopy,item.code)?compactDiagnosticCopy[item.code]:null;let evidence=null,messageBody=body;
  if(compact){const meaning=documentImpl.createElement('p');meaning.className='diagnostic-meaning';meaning.textContent=compact;body.append(meaning);evidence=documentImpl.createElement('details');evidence.className='compact-disclosure diagnostic-evidence';const title=documentImpl.createElement('summary');title.textContent=item.code==='grade_out_of_domain'?'模型限制與原始檢查':'原始檢查詳情';messageBody=documentImpl.createElement('div');messageBody.className='status-detail';evidence.append(title,messageBody);if(item.code==='grade_out_of_domain'){const qualification=documentImpl.createElement('p');qualification.textContent='來源坡度超出 Minetti 跑步參考 ±45%；可能是真實地形或高程誤差，尚未判定。';messageBody.append(qualification);}}
  for(const message of messages){const p=documentImpl.createElement('p');p.textContent=message;messageBody.append(p);}
  if(count>1&&messages.length===1){const p=documentImpl.createElement('p');p.textContent=`共 ${count} 處。`;messageBody.append(p);}
  const mode=()=>documentImpl.getElementById('ability-mode')?.getAttribute('aria-pressed')==='true'?'prediction':'goal';
  const terrainActions=terrainDiagnosticActions(item.code,mode());
  if(terrainActions.length){for(const [index,action] of terrainActions.entries()){const jump=documentImpl.createElement('button');jump.type='button';jump.className='text-button';jump.textContent=item.code==='grade_out_of_domain'&&index===1?'計算方式與限制':action.label;jump.addEventListener('click',()=>{if(li.parentElement!==element)return;const current=terrainDiagnosticActions(item.code,mode())[index];if(!current)return;if(resolveTerrainAction(current,{documentImpl})){focusTerrainAction(current,{documentImpl});return;}if(evidence){evidence.open=true;evidence.querySelector('summary')?.focus?.({preventScroll:true});}});body.append(jump);}}
  else if(targetId){const jump=documentImpl.createElement('button');jump.type='button';jump.className='text-button';jump.textContent=action;jump.addEventListener('click',()=>{if(li.parentElement!==element)return;let target=documentImpl.getElementById(targetId);if(targetId==='advanced'&&documentImpl.getElementById('ability-mode')?.getAttribute('aria-pressed')==='true'){target=documentImpl.getElementById(item.code==='grade_out_of_domain'?'prediction-hybrid':'repair-panel');if(item.code==='missing_elevation'&&target?.hidden)target=documentImpl.getElementById('route-details');}if(targetId==='elevation-locator'&&target?.hidden)target=documentImpl.getElementById('route-details');if(targetId==='repair-panel'&&target?.hidden)target=documentImpl.getElementById('route-details');if(!target||target.hidden)return;for(let parent=target;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;const focus=target.querySelector('summary')||target.querySelector('button')||target;if(!['SUMMARY','BUTTON','INPUT','SELECT','TEXTAREA','A'].includes(focus.tagName))focus.setAttribute('tabindex','-1');target.scrollIntoView?.({block:'center',behavior:'auto'});focus.focus?.({preventScroll:true});});body.append(jump);}
  if(evidence)body.append(evidence);
  details.append(summary,body);li.append(details);element.append(li);
 }
}
const disclosureBindings=new WeakMap();
/** One native key listener per document. Never intercept Escape owned by a modal. */
export function bindStatusDisclosures(documentImpl=globalThis.document){
 const existing=disclosureBindings.get(documentImpl);if(existing)return existing;
 const keydown=event=>{if(event.defaultPrevented||event.key!=='Escape')return;const details=event.target?.closest?.('details');if(details?.closest?.('dialog'))return;if(!details?.open||(!details.classList.contains('status-disclosure')&&!details.classList.contains('compact-disclosure')))return;event.preventDefault();event.stopPropagation?.();details.open=false;details.querySelector('summary')?.focus?.({preventScroll:true});};
 documentImpl.addEventListener('keydown',keydown);
 const dispose=()=>{if(disclosureBindings.get(documentImpl)!==dispose)return;documentImpl.removeEventListener('keydown',keydown);disclosureBindings.delete(documentImpl);};
 disclosureBindings.set(documentImpl,dispose);return dispose;
}
