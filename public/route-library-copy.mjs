/** Presentation only. Import availability never establishes model qualification. */
export function routeNoticeText(value=''){
 return String(value).replace(/陡坡需情境設定|需陡坡設定/gu,'坡度待核，請先檢查來源');
}

export function routeChoicePresentation(source,{selected=false}={}){
 const notice=routeNoticeText(source?.planningNotice||'');
 const qualifications=[];let recognized=false;
 const add=(label,tone='warning')=>{qualifications.push({label,tone});recognized=true;};
 if(source?.sourceGeometryStatus==='grade_out_of_domain')add('原檔跑步受限');
 else if(source?.sourceGeometryStatus?.startsWith('blocked_'))add('原檔待處理');
 else if(source?.rawOnly)add('原檔計算受限');
 else if(/缺.*海拔|海拔.*缺/u.test(notice))add('原檔海拔缺漏');
 else if(/陡坡|坡度待核/u.test(notice))add('原檔坡度待核');
 if(source?.courseScope==='run_leg_only')add('僅跑步段','neutral');
 if(Array.isArray(source?.officialCategoryVariants)&&source.officialCategoryVariants.length>1)add('起跑分組','neutral');
 if(notice&&!recognized)add(notice,'neutral');
 const qualification=qualifications.length?{label:qualifications.map(row=>row.label).join(' · '),tone:qualifications.some(row=>row.tone==='warning')?'warning':'neutral'}:null;
 return {name:source?.name||'',action:selected?'已選擇':'導入路線',qualification,notice};
}

/** Full per-route qualifications live once in the existing source disclosure. */
export function appendRouteChoiceNotes(element,sources,documentImpl=element.ownerDocument||globalThis.document){
 const notes=sources.map(source=>({source,presentation:routeChoicePresentation(source)})).filter(row=>row.presentation.notice);
 if(!notes.length)return;
 const list=documentImpl.createElement('ul');list.className='route-source-notes';
 for(const {source,presentation} of notes){
  const item=documentImpl.createElement('li');const name=documentImpl.createElement('strong');name.textContent=source.name;
  const notice=documentImpl.createElement('p');notice.className='route-choice-notice';notice.textContent=presentation.notice;
  item.append(name,notice);list.append(item);
 }
 element.append(list);
}

/** Display-only accepted version identity. This never claims model eligibility. */
export function selectedRouteVersionLabel(source,event,state){
 const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/u.test(value);
 if(!source||!state?.gpx||!state.route||state.source?.id!==source.id||
    !hash(source.sha256)||state.source.sha256!==source.sha256||
    !event||!['direct_verified','bridge_verified'].includes(event.importability)||
    event.routeEditionMatchesEvent===false||!event.routeIds?.includes(source.id)||
    !event.routes?.some(row=>row.routeId===source.id))return null;
 const original=state.originalRoute||state.route;
 if(original.route_sha256!==source.sha256)return null;
 if(!state.calculationGpx){
  if(state.originalRoute||state.repairApplied||state.calculationDetails)return null;
  return '目前採用：原檔';
 }
 const applied=state.repairApplied,proposal=applied?.proposal;
 if(!state.originalRoute||!hash(applied?.derived_sha256)||
    applied.derived_gpx_b64!==state.calculationGpx||
    state.route.route_sha256!==applied.derived_sha256||
    state.calculationDetails?.source?.route_sha256!==applied.derived_sha256||
    state.details?.source?.route_sha256!==source.sha256||
    proposal?.original_sha256!==source.sha256)return null;
 if(proposal.derivation_kind==='whole_provider_surface'&&hash(proposal.source_pack_sha256))return '目前採用：地表參考';
 if(!proposal.derivation_kind&&proposal.schema_version==='route-geometry-repair/1.0')return '目前採用：局部估算';
 return null;
}
