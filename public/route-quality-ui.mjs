/** Read-only original-source evidence. It owns no route, CP, consent or plan. */
const PAGE_SIZE=25,MAX_FINDINGS=10000;
const count=n=>Number.isSafeInteger(n)&&n>=0;
const hash=s=>typeof s==='string'&&/^[a-f0-9]{64}$/u.test(s);
const labels={missing_elevation_runs:'缺海拔',exact_coordinate_conflicts:'相同座標海拔不同',horizontal_gap_candidates:'軌跡間隔較大',core_vertical_discontinuities:'相近位置海拔不同',vertical_reversal_candidates:'海拔折返待核',canonical_steep_runs:'來源坡度超出模型範圍'};
const rawFamilies=Object.keys(labels).filter(k=>k!=='canonical_steep_runs');
const fail=()=>{throw new Error('來源檢查回應無法核對，請重試。');};
const close=(a,b)=>Math.abs(a-b)<=1e-7*Math.max(1,Math.abs(a),Math.abs(b));
const finite=n=>typeof n==='number'&&Number.isFinite(n);
// Existing core: at most 500 km horizontal, 25 m grid (20,000 cells),
// and each smoothed elevation stays inside the admitted -1,000..10,000 m.
// ds <= dx + |dz| provides a conservative numerical envelope, not a new gate.
const MAX_CANONICAL_DISTANCE_M=500000+20000*11000;
function validateGradeEvidence(row,canonical,summary){
 const e=row.grade_evidence;
 if(row.family!=='canonical_steep_runs'){if(e!==undefined)fail();return;}
 if(!e||e.schema_version!=='canonical-steep-source-support/1.0'||e.terrain_truth!=='not_independently_verified'||!['steep_up','steep_down'].includes(e.kind)||!['start_m','end_m','horizontal_m','distance_m','signed_vertical_difference_m','min_grade','max_grade'].every(k=>finite(e[k]))||e.start_m<0||e.end_m<=e.start_m||e.end_m>canonical.route_distance_m+1e-7*Math.max(1,canonical.route_distance_m)||e.horizontal_m<=0||e.distance_m<=0||!close(e.end_m-e.start_m,e.distance_m)||e.distance_m+1e-7<e.horizontal_m||e.min_grade>e.max_grade||!count(e.consecutive_cells)||e.consecutive_cells<1||e.consecutive_cells>canonical.out_of_domain_cells||!count(e.overlapping_raw_reversal_candidates)||e.overlapping_raw_reversal_candidates>summary.vertical_reversal_candidates)fail();
 const up=e.kind==='steep_up',average=e.signed_vertical_difference_m/e.horizontal_m;
 if(up?e.min_grade<=.45+1e-10||e.signed_vertical_difference_m<=0:e.max_grade>=-.45-1e-10||e.signed_vertical_difference_m>=0)fail();
 if(average<e.min_grade-1e-7||average>e.max_grade+1e-7||e.distance_m+1e-7<Math.hypot(e.horizontal_m,e.signed_vertical_difference_m)||e.distance_m>canonical.out_of_domain_distance_m+1e-7*Math.max(1,canonical.out_of_domain_distance_m)||Math.abs(e.signed_vertical_difference_m)>canonical.out_of_domain_absolute_vertical_m+1e-7*Math.max(1,canonical.out_of_domain_absolute_vertical_m))fail();
 const arcUpper=e.horizontal_m*Math.hypot(1,Math.max(Math.abs(e.min_grade),Math.abs(e.max_grade)));
 if(!finite(arcUpper)||e.distance_m>arcUpper+1e-7*Math.max(1,arcUpper))fail();
 if(e.consecutive_cells>(up?canonical.up_cells:canonical.down_cells))fail();
}
export function validateQualityResult(result,context,pageIndex=0){
 if(!result||new TextEncoder().encode(JSON.stringify(result)).length>65536||result.schema_version!=='route-quality-page/1.0'||!hash(context?.sha256)||result.source?.route_version_sha256!==context.sha256||result.source.original_bytes_modified!==false||result.source.derived_gpx_created!==false||result.source.point_index_base!==0||result.source.range_endpoints!=='inclusive'||!count(result.source.point_count)||result.source.point_count<2||result.source.point_count>50000||!count(result.source.segment_count)||result.source.segment_count<1||result.source.segment_count>2000||!count(result.source.byte_count)||result.source.byte_count>5242880)fail();
 const r=result.readiness,s=result.summary,c=result.canonical_domain,core=result.core,t=result.finding_totals,p=result.page;
 if(!r||!['core_blocked','elevation_complete','canonical_grade_assessable','raw_review_recommended'].every(k=>typeof r[k]==='boolean')||!s||!['missing_elevation_points','exact_coordinate_conflict_groups','core_vertical_discontinuities','horizontal_gap_candidates','vertical_reversal_candidates'].every(k=>count(s[k]))||!c||!core||r.core_blocked!==core.blocked||typeof core.elevation_complete!=='boolean'||!t||!rawFamilies.every(k=>count(t[k])))fail();
 if(s.missing_elevation_points>result.source.point_count)fail();
 if(r.elevation_complete!==(s.missing_elevation_points===0)||t.missing_elevation_runs>s.missing_elevation_points||(t.missing_elevation_runs===0)!==(s.missing_elevation_points===0)||t.exact_coordinate_conflicts!==s.exact_coordinate_conflict_groups||t.core_vertical_discontinuities!==s.core_vertical_discontinuities||t.horizontal_gap_candidates!==s.horizontal_gap_candidates||t.vertical_reversal_candidates!==s.vertical_reversal_candidates)fail();
 const rawReview=!!(s.exact_coordinate_conflict_groups||s.core_vertical_discontinuities||s.horizontal_gap_candidates||s.vertical_reversal_candidates);
 if(r.raw_review_recommended!==rawReview||r.canonical_grade_assessable!==(!r.core_blocked&&r.elevation_complete&&result.source.segment_count===1))fail();
 if(r.canonical_grade_assessable){if(c.status!=='available'||!core.elevation_complete||!hash(core.geometry_sha256)||!count(c.out_of_domain_cells)||!count(c.up_cells)||!count(c.down_cells)||c.up_cells+c.down_cells!==c.out_of_domain_cells||!count(c.run_count)||c.run_count!==t.canonical_steep_runs||(c.run_count===0)!==(c.out_of_domain_cells===0)||c.run_count>c.out_of_domain_cells||!['out_of_domain_horizontal_m','out_of_domain_distance_m','out_of_domain_absolute_vertical_m'].every(k=>Number.isFinite(c[k])&&c[k]>=0)||r.steep_scenario_needed!==(c.out_of_domain_cells>0))fail();if(c.out_of_domain_cells===0&&!['out_of_domain_horizontal_m','out_of_domain_distance_m','out_of_domain_absolute_vertical_m'].every(k=>c[k]===0))fail();if(c.out_of_domain_cells>0&&!['out_of_domain_horizontal_m','out_of_domain_distance_m','out_of_domain_absolute_vertical_m'].every(k=>c[k]>0))fail();}
 else if(c.status!=='unknown'||!['out_of_domain_cells','out_of_domain_horizontal_m','out_of_domain_distance_m','out_of_domain_absolute_vertical_m','up_cells','down_cells','run_count'].every(k=>c[k]===null)||t.canonical_steep_runs!==null||r.steep_scenario_needed!==null)fail();
 const expectedStatus=r.core_blocked?'core_geometry_blocked':!r.elevation_complete?'elevation_unknown':rawReview?'review_raw_candidates':c.out_of_domain_cells?'beyond_current_grade_domain':'within_current_grade_domain';if(r.status!==expectedStatus)fail();
 if(core.blocked&&core.geometry_sha256!==null)fail();
 // The frozen core excludes each raw edge below 1e-6 m; raw source distance
 // still includes it. This is an existing skip envelope, not looser geometry.
 const skippedHorizontalEnvelope=(result.source.point_count-1)*1e-6;
 if(JSON.stringify(c.grade_domain)!=='[-0.45,0.45]'||(r.canonical_grade_assessable?(!finite(c.route_distance_m)||c.route_distance_m<=0||c.route_distance_m>MAX_CANONICAL_DISTANCE_M+1||c.route_distance_m+1e-7*Math.max(1,c.route_distance_m)<c.out_of_domain_distance_m||!finite(s.raw_horizontal_m)||s.raw_horizontal_m<0||s.raw_horizontal_m>500000+skippedHorizontalEnvelope+1e-7||c.route_distance_m+skippedHorizontalEnvelope+1e-7*Math.max(1,s.raw_horizontal_m)<s.raw_horizontal_m||c.out_of_domain_horizontal_m>s.raw_horizontal_m+1e-7*Math.max(1,s.raw_horizontal_m)||c.out_of_domain_absolute_vertical_m>c.out_of_domain_distance_m+1e-7*Math.max(1,c.out_of_domain_distance_m)):c.route_distance_m!==null)||result.terrain_truth!=='not_independently_verified'||result.scope!=='original_source_readonly_not_repair_consent_or_prediction_validation')fail();
 const total=Object.values(t).reduce((n,v)=>n+(v===null?0:v),0);if(Object.keys(t).sort().join(',')!==Object.keys(labels).sort().join(',')||!count(total)||total>MAX_FINDINGS||!p||p.index!==pageIndex||p.size!==PAGE_SIZE||p.total_findings!==total||p.index>=Math.max(1,Math.ceil(total/PAGE_SIZE))||p.has_previous!==(pageIndex>0)||p.has_next!==((pageIndex+1)*PAGE_SIZE<total)||!Array.isArray(p.rows)||p.rows.length!==Math.min(PAGE_SIZE,Math.max(0,total-pageIndex*PAGE_SIZE)))fail();
 const seen={};let previousRunEnd=null;for(const [i,row] of p.rows.entries()){const range=row.source_point_range,segmentRange=row.segment_source_point_range;if(!Array.isArray(segmentRange)||segmentRange.length!==2||!segmentRange.every(count)||segmentRange[0]>segmentRange[1]||segmentRange[1]>=result.source.point_count||!Array.isArray(range)||range[0]<segmentRange[0]||range[1]>segmentRange[1])fail();if(context.segmentRanges&&(context.segmentRanges.length!==result.source.segment_count||JSON.stringify(context.segmentRanges[row.segment_index])!==JSON.stringify(segmentRange)))fail();if(row.ordinal!==pageIndex*PAGE_SIZE+i||!Object.hasOwn(labels,row.family)||!Array.isArray(range)||range.length!==2||!range.every(count)||range[0]>range[1]||range[1]>=result.source.point_count||!count(row.segment_index)||row.segment_index>=result.source.segment_count)fail();seen[row.family]=(seen[row.family]||0)+1;if(seen[row.family]>t[row.family])fail();validateGradeEvidence(row,c,s);if(row.grade_evidence){if(previousRunEnd!==null&&row.grade_evidence.start_m<previousRunEnd-1e-7)fail();previousRunEnd=row.grade_evidence.end_m;}}
 const evidence=p.rows.filter(row=>row.grade_evidence).map(row=>row.grade_evidence);
 if(evidence.length){const sums={out_of_domain_horizontal_m:evidence.reduce((n,e)=>n+e.horizontal_m,0),out_of_domain_distance_m:evidence.reduce((n,e)=>n+e.distance_m,0),out_of_domain_absolute_vertical_m:evidence.reduce((n,e)=>n+Math.abs(e.signed_vertical_difference_m),0),out_of_domain_cells:evidence.reduce((n,e)=>n+e.consecutive_cells,0),up_cells:evidence.filter(e=>e.kind==='steep_up').reduce((n,e)=>n+e.consecutive_cells,0),down_cells:evidence.filter(e=>e.kind==='steep_down').reduce((n,e)=>n+e.consecutive_cells,0)};for(const [key,sum]of Object.entries(sums)){if(sum>c[key]+1e-7*Math.max(1,c[key])||(evidence.length===c.run_count&&!close(sum,c[key])))fail();}}
 return result;
}
const metres=n=>n<1?n.toFixed(1):Math.round(n).toLocaleString('zh-TW');
const signed=n=>(n>0?'+':'')+n.toFixed(1);
export function qualityFindingText(row){
 const source=`${labels[row.family]} · 第 ${row.segment_index+1} 段原始點 ${row.source_point_range[0]}${row.source_point_range[1]!==row.source_point_range[0]?'–'+row.source_point_range[1]:''}`;
 const e=row.grade_evidence;if(!e)return source;
 return `${e.kind==='steep_up'?'上坡':'下坡'} · 計算路程 ${(e.start_m/1000).toFixed(2)}–${(e.end_m/1000).toFixed(2)} km · ${metres(e.distance_m)} m · ${signed(e.min_grade*100)}%～${signed(e.max_grade*100)}%`;
}
export function qualityFindingDetailText(row){
 const e=row.grade_evidence;if(!e)return '';
 return `原始 GPX 第 ${row.segment_index+1} 段點 ${row.source_point_range[0]}–${row.source_point_range[1]}，為含平滑範圍及相鄰點的保守定位。沿坡 ${metres(e.distance_m)} m、水平 ${metres(e.horizontal_m)} m、高差 ${signed(e.signed_vertical_difference_m)} m；模型坡度為升高／水平距離。${e.consecutive_cells} 個連續計算格，來源範圍內有 ${e.overlapping_raw_reversal_candidates} 處海拔折返線索。這些數值由來源計算，連續格數與沒有折返均不能確認地形或高程正確。`;
}
export function qualityDomainText(result){
 const c=result.canonical_domain;
 if(c.status==='unknown')return '目前無法判定整條路線坡度；未知不能視為零。先處理缺海拔或軌跡品質問題，再核對模型適用範圍。';
 if(!c.out_of_domain_cells)return '來源坡度在目前模型範圍內；這不代表來源精確或完賽預估已驗證。';
 return `Minetti 跑步模型限 ±45%（不是角度）。${c.run_count} 處、沿坡約 ${metres(c.out_of_domain_distance_m)} m 超域，真實地形與高程誤差仍未知。請核對原始點及獨立高程；一般計算維持原有門檻，混合情境需自填適用速率並確認，缺值保持未知。`;
}
export function qualityStatus(result){
 const s=result.summary,parts=[];
 if(s.missing_elevation_points)parts.push(`缺海拔 ${s.missing_elevation_points} 點`);
 if(s.exact_coordinate_conflict_groups)parts.push(`海拔衝突 ${s.exact_coordinate_conflict_groups} 組`);
 const other=s.horizontal_gap_candidates+s.vertical_reversal_candidates+(s.exact_coordinate_conflict_groups?0:s.core_vertical_discontinuities);
 if(other)parts.push(`來源待核 ${other} 處`);
 if(result.canonical_domain.out_of_domain_cells)parts.push(`模型範圍外 ${result.canonical_domain.run_count} 處 · 約 ${metres(result.canonical_domain.out_of_domain_distance_m)} m`);
 if(!result.readiness.canonical_grade_assessable)parts.push('坡度未判定');
 return parts.join(' · ')||'未見本次檢查項目';
}
export function createRouteQualityUI({getContext,isBusy,request,onAdmissionRejected,documentImpl=globalThis.document}){
 const $=id=>documentImpl.getElementById(id),panel=$('source-quality'),status=$('source-quality-status'),check=$('source-quality-check'),details=$('source-quality-details'),basis=$('source-quality-basis'),domain=$('source-quality-domain'),list=$('source-quality-findings'),pageStatus=$('source-quality-page'),previous=$('source-quality-prev'),next=$('source-quality-next');
 let checked=null,controller=null,revision=0;
 const same=(a,b)=>!!a&&!!b&&a.gpx_b64===b.gpx_b64&&a.sha256===b.sha256;
 function renderPage(){list.replaceChildren();const p=checked.result.page;for(const row of p.rows){const li=documentImpl.createElement('li');li.textContent=qualityFindingText(row);if(row.grade_evidence){const detail=documentImpl.createElement('details'),summary=documentImpl.createElement('summary'),text=documentImpl.createElement('p');summary.textContent='來源與計算細節';text.textContent=qualityFindingDetailText(row);detail.append(summary,text);li.append(detail);}list.append(li);}pageStatus.textContent=p.total_findings?`${p.index*PAGE_SIZE+1}–${p.index*PAGE_SIZE+p.rows.length} / ${p.total_findings} 項`:'沒有本次定位項目';previous.disabled=!!controller||!p.has_previous;next.disabled=!!controller||!p.has_next;}
 function refresh(){const context=getContext();panel.hidden=!context;check.disabled=!context||isBusy()||!!controller;if(!context)return;if(checked&&!same(checked.context,context)){checked=null;details.hidden=true;list.replaceChildren();}basis.textContent=context.derived?'原始 GPX 檢查；處理後計算版本另行核對。':'原始 GPX 檢查；點位編號從 0 起算。';if(checked){if(!controller)status.textContent=qualityStatus(checked.result);check.textContent='重新檢查';previous.disabled=isBusy()||!!controller||!checked.result.page.has_previous;next.disabled=isBusy()||!!controller||!checked.result.page.has_next;}else if(!controller){status.textContent='來源待檢查';check.textContent='檢查來源';}}
 function cancel(){revision++;controller?.abort();controller=null;refresh();}
 function reset(){cancel();checked=null;details.hidden=true;details.open=false;list.replaceChildren();domain.textContent='';pageStatus.textContent='';status.textContent='來源待檢查';previous.disabled=true;next.disabled=true;refresh();}
 async function inspectPage(pageIndex){const context=getContext();if(!context||isBusy()||controller)return;const own=++revision,c=new AbortController();controller=c;check.disabled=true;previous.disabled=true;next.disabled=true;status.textContent=pageIndex?'正在讀取來源位置…':'正在檢查來源…';try{const result=await request({gpx_b64:context.gpx_b64,...(pageIndex?{page:pageIndex}:{})},c.signal);if(own!==revision||c.signal.aborted||!same(context,getContext()))return;checked={result:validateQualityResult(result,context,pageIndex),context};domain.textContent=qualityDomainText(result);details.hidden=false;renderPage();}
 catch(error){if(own!==revision||!same(context,getContext()))return;if(error.admissionRejected){onAdmissionRejected(error,context);return;}if(error.name!=='AbortError'){checked=null;details.hidden=true;list.replaceChildren();previous.disabled=true;next.disabled=true;status.textContent=error.message||'來源檢查未完成，可重試。';}}
 finally{if(own===revision){controller=null;const failed=!checked?status.textContent:null;refresh();if(failed)status.textContent=failed;}}}
 check.addEventListener('click',()=>inspectPage(0));previous.addEventListener('click',()=>{if(checked?.result.page.has_previous)return inspectPage(checked.result.page.index-1);});next.addEventListener('click',()=>{if(checked?.result.page.has_next)return inspectPage(checked.result.page.index+1);});
 refresh();return {refresh,cancel,reset,isBusy:()=>!!controller};
}
