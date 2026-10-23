/** Read-only terrain navigation. A source clue never grants repair or scenario consent. */
const action=(label,...targets)=>({label,targets});
const source=()=>action('檢查來源','source-quality','route-details');
const history=()=>action('查看歷史 GPX','prediction-record-list','prediction-reference-name');
const local=()=>action('查看局部估算','repair-panel','source-quality','route-details');
const locate=()=>action('定位缺點','elevation-locator','source-quality','route-details');
// Focus the enabled check, never a disabled-only panel. Fallback remains read-only.
const surface=(target=false)=>action(target?'查看目標地表參考':'查看地表參考','surface-check','source-quality','route-details');
const scenario=mode=>mode==='goal'?action('計算情境','clamp-consent','advanced'):action('計算情境','prediction-hybrid');
export function terrainDiagnosticActions(code,mode='goal'){
 if(code==='missing_elevation')return [locate(),local(),surface()];
 if(code==='grade_out_of_domain')return [source(),scenario(mode)];
 if(['vertical_jump','sparse_or_jump','disconnected_segments'].includes(code))return [source(),local()];
 return [];
}
export function terrainErrorActions(error,mode='goal'){
 // Explicit caller-owned fields identify the record/role more precisely than a
 // generic two-route error. Preserve that navigation instead of guessing a source.
 if(error?.fieldIds?.length||error?.fields?.length)return [];
 if(mode==='goal'){
  if(error?.code==='hiking_missing_elevation')return [locate(),local(),surface()];
  if(error?.code==='hiking_grade_out_of_domain')return [source(),action('查看分配方式','allocation-model')];
  if(error?.code==='missing_elevation_consent')return [locate(),local(),surface(),action('查看平路情境','flat-consent','advanced')];
  if(error?.code==='grade_out_of_domain')return terrainDiagnosticActions(error.code,mode);
  if(error?.code==='route_blocked')return [source(),local()];
 }
 if(mode==='prediction'){
  if(error?.code==='prediction_grade_out_of_domain')return [action('檢查目標來源','source-quality','route-details'),history(),scenario(mode)];
  // A generic two-route failure does not identify the affected role. Name the
  // target reference explicitly and keep the separate history correction link.
  if(error?.code==='prediction_missing_elevation')return [action('檢查目標來源','source-quality','route-details'),history(),surface(true)];
  if(error?.code==='prediction_route_blocked')return [action('檢查目標來源','source-quality','route-details'),history()];
 }
 return [];
}
export function terrainErrorMessage(error,mode='goal'){
 if(mode!=='goal')return error?.message||'';
 if(error?.code==='grade_out_of_domain')return '部分坡段超出跑步參考範圍，需先核對。';
 if(error?.code==='missing_elevation_consent')return 'GPX 海拔缺漏，坡度未知。';
 return error?.message||'';
}
export function resolveTerrainAction(action,{documentImpl=globalThis.document}={}){
 for(const id of action?.targets||[]){const target=documentImpl.getElementById(id);if(target&&!target.closest?.('[hidden]')&&!target.disabled)return target;}
 return null;
}
export function focusTerrainAction(action,{documentImpl=globalThis.document,activate=()=>{}}={}){
 activate();const target=resolveTerrainAction(action,{documentImpl});if(!target)return false;
 for(let parent=target;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
 const candidates=target.tagName==='DETAILS'?target.querySelectorAll('summary'):target.querySelectorAll?.('button')||[];
 const focus=[...candidates].find(node=>!node.closest?.('[hidden]')&&!node.disabled)||target;
 if(!['SUMMARY','BUTTON','INPUT','SELECT','TEXTAREA','A'].includes(focus.tagName))focus.setAttribute('tabindex','-1');
 target.scrollIntoView?.({block:'center',behavior:'auto'});focus.focus?.({preventScroll:true});return true;
}
export function repairProposalStatus(summary){
 const q=summary||{};
 return [q.missing_elevations_filled?`可估算 ${q.missing_elevations_filled} 點海拔`:null,q.conflicting_coordinate_groups_merged?`可合併 ${q.conflicting_coordinate_groups_merged} 組重複座標`:null,q.preview_has_out_of_domain?'處理後仍超出跑步參考範圍':null].filter(Boolean).join(' · ');
}
