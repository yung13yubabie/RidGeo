/** Local, read-only elapsed observations. Never writes prediction inputs or model settings. */
const PAGE_SIZE=25,SCHEMA='timed-gpx-compact-observation/0.1';
const reasonCopy={
 "point_time_missing": "缺少逐點時間",
 "point_time_empty": "時間欄位空白",
 "point_time_timezone_or_format_unknown": "時間格式或時區待核",
 "point_time_precision_unsupported": "時間精度暫不支援",
 "point_time_offset_unknown": "記錄時區未知",
 "point_time_offset_invalid": "記錄時區無效",
 "point_time_invalid_calendar_or_clock": "日期或時間無效",
 "point_time_not_scalar": "時間欄位格式待核",
 "point_time_duplicate": "同一軌跡點有多個時間",
 "duplicate_point_time": "同一軌跡點有多個時間",
 "point_time_text_too_long": "時間欄位過長",
 "point_time_geometry_index_mismatch": "時間與軌跡點對應待核",
 "timestamps_out_of_order": "時間順序待核",
 "conflicting_duplicate_timestamp": "同時間的軌跡點衝突",
 "identical_timestamp_point_preserved": "同時間重複點已保留",
 "recording_gap_exceeds_declared_policy": "記錄時間有缺口",
 "disconnected_segments_not_bridged": "分段記錄不跨接",
 "core_geometry_blocked": "路線幾何待處理",
 "canonical_elevation_unknown": "海拔缺漏",
 "fewer_than_two_exact_original_time_boundaries": "這段時間邊界不足",
 "original_timing_incomplete_or_invalid": "逐點時間不完整",
 "source_elapsed_float_precision_limited": "時間精度待核",
 "segment_elapsed_float_precision_limited": "這段時間精度待核",
 "producer_aggregate_sample_budget_exceeded": "超出觀測樣本上限",
 "steep_group_budget_exceeded": "超出 64 段觀測上限",
 "segment_moving_time_unknown": "尚未分離停留",
 "segment_moving_time_conflict": "移動時間與記錄不符",
 "source_assessment_ineligible": "來源尚未驗證",
 "stable_recording_identity_unknown": "原始活動身分未知",
 "actual_history_unconfirmed": "實績尚未確認",
 "effort_not_qualified_benchmark": "努力程度未知",
 "source_quality_blocks_candidate": "來源品質待核",
 "recording_not_before_as_of": "記錄時間晚於現在",
 "nonpositive_elapsed_span": "時間長度待核",
 "nonpositive_selected_elapsed_span": "這段時間長度待核",
 "nonpositive_elapsed_duration": "時間長度待核",
 "dependency_integrity_mismatch": "分析元件待核，請重新載入",
 "dependency_unavailable": "分析元件未載入，請重試",
 "forecast_as_of_invalid": "請確認裝置日期與時間",
 "foreign_namespace_route_ancestor": "軌跡檔案結構待核",
 "invalid_file_or_byte_budget": "檔案空白或超過 5 MiB",
 "invalid_route_structure": "軌跡檔案結構待核",
 "source_canonical_chainage_mismatch": "原始點與里程對應待核",
 "timing_xml_invalid": "時間欄位格式待核",
 "unexpected_model_ready_observation": "觀測結果待核，暫不採用",
 "unsafe_xml": "檔案含不支援的內容",
 "xml_too_deep": "檔案結構過於複雜",
 "compact_model_invariant_violation": "觀測結果待核，暫不採用",
 "compact_nonfinite_value": "觀測數值無效",
 "compact_occurrence_mapping_invalid": "坡段與觀測對應待核",
 "compact_response_budget_exceeded": "觀測資料超出上限",
 "compact_schema_invalid": "觀測資料格式待核",
 "compact_source_bounds_invalid": "原始點範圍待核",
 "compact_time_state_invalid": "時間狀態待核",
 "adjacent_segments_boundary_conflict": "相鄰坡段邊界衝突",
 "canonical_cells_discontinuous": "坡段幾何不連續",
 "canonical_geometry_version_or_config_mismatch": "路線幾何版本待核",
 "cell_horizontal_support_insufficient": "水平距離資料不足",
 "duplicate_segment_conflict": "重複坡段資料衝突",
 "existing_intervals_source_policy_not_met": "歷史來源尚未通過查核",
 "geometry_not_unchanged_canonical_slice": "坡段與原始路線不符",
 "grade_not_finite": "坡度未知",
 "mixed_or_wrong_direction": "坡段方向不一致",
 "mixed_subjects": "記錄來源不一致",
 "nonpositive_directional_vertical": "缺少有效方向高差",
 "nonpositive_or_out_of_range_cell_horizontal": "水平距離無效",
 "not_entirely_steep": "並非完整陡坡區間",
 "original_source_samples_missing": "原始軌跡點不足",
 "payload_checksum_mismatch": "來源資料核對不符",
 "possible_same_recording_different_identity": "可能是同一活動的不同記錄",
 "possible_same_recording_overlapping_full_intervals": "活動時間可能重疊",
 "required_direction_missing": "缺少所需方向的觀測",
 "same_recording_geometry_or_completion_conflict": "同一活動的路線或時間不一致",
 "same_recording_identity_conflicting_start": "同一活動的起始時間衝突",
 "same_recording_same_segment_export_alias": "同一坡段的重複匯出",
 "same_recording_segment_order_conflict": "同一活動的坡段順序衝突",
 "segment_after_recording_completion": "坡段時間超出記錄範圍",
 "selected_segment_ineligible": "這段資料尚不足以採用",
 "source_chainage_out_of_order": "原始里程順序待核",
 "source_indices_not_strictly_ordered": "原始軌跡點順序待核",
 "time_geometry_boundary_not_exact": "時間與坡段邊界無法精確對應",
 "vertical_change_without_horizontal_support": "同位置有不同海拔",
 "activity_fields_ignored": "活動摘要欄位未採用",
 "disconnected_segments": "路線有斷段",
 "duplicate_points": "含重複座標",
 "geometry_too_dense": "幾何資料超出上限",
 "grade_out_of_domain": "坡度待確認",
 "invalid_geometry_config": "幾何設定待核",
 "missing_elevation": "海拔缺漏",
 "namespace_missing": "軌跡格式提醒",
 "route_too_long": "路線超過長度上限",
 "short_segment": "軌跡點不足",
 "sparse_or_jump": "軌跡有缺口",
 "vertical_jump": "海拔衝突",
 "zero_length": "沒有有效里程",
 "duplicate_elevation": "同一軌跡點有多個海拔",
 "empty_file": "檔案空白",
 "file_too_large": "檔案超過 5 MiB",
 "invalid_coordinate": "座標格式待核",
 "invalid_elevation": "海拔格式待核",
 "invalid_file": "請選擇有效的 GPX",
 "invalid_gpx": "不是可讀取的 GPX",
 "invalid_number": "軌跡數值無效",
 "invalid_xml": "軌跡檔案格式待核",
 "missing_coordinate": "缺少座標",
 "no_route": "檔案沒有可讀取的軌跡",
 "too_many_points": "軌跡點超過上限",
 "aggregate_sample_or_cell_budget": "超出觀測樣本上限",
 "boolean_invalid": "確認資料格式待核",
 "cell_budget_or_count": "坡段資料量超出上限",
 "classification_conflict": "活動分類資料衝突",
 "digest_invalid": "來源核對資料無效",
 "empty_selection": "沒有可用觀測坡段",
 "enum_invalid": "資料選項格式待核",
 "geometry_range": "坡段幾何範圍待核",
 "nonpositive_duration": "時間長度待核",
 "number_invalid": "觀測數值無效",
 "numeric_range": "觀測數值超出範圍",
 "payload_invalid": "觀測資料無效",
 "quality_budget": "品質明細超出上限",
 "recording_date_order": "活動日期順序待核",
 "required_directions_invalid": "觀測方向設定待核",
 "sample_budget_or_count": "原始點數超出觀測上限",
 "schema_invalid": "觀測資料格式待核",
 "segment_budget": "坡段數超出觀測上限",
 "source_index_invalid": "原始點編號無效",
 "source_range": "原始點範圍待核",
 "text_invalid": "記錄文字格式待核",
 "timestamp_invalid": "記錄時間無效",
 "timestamp_range": "記錄時間超出範圍",
 "timezone_required": "記錄缺少時區",
 "unknown_moving_schema": "移動時間依據未知",
 "overlapping_selected_segments": "選取坡段的時間重疊",
 "possible_same_recording_overlapping_absolute_times": "可能是同一活動的重疊坡段"
};
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const number=n=>finite(n)?new Intl.NumberFormat('zh-TW',{maximumSignificantDigits:8}).format(n):'未知';
const bounds=value=>Array.isArray(value)&&value.length===2&&value.every(Number.isSafeInteger)?`原始點 ${value[0]+1}–${value[1]+1}`:'原始點待核';
const reason=code=>{const key=typeof code==='string'&&code.startsWith('observation_')?code.slice(12):code;return typeof key==='string'&&Object.hasOwn(reasonCopy,key)?reasonCopy[key]:'資料待核，請核對原始記錄。';};
export function createTimedHistoryUI({request,documentImpl=globalThis.document}){
 const $=id=>documentImpl.getElementById(id),panel=$('timed-history');
 let reference=null,generation=0,controller=null,result=null,page=0;
 function status(text,tone='neutral'){$('timed-history-status').textContent=text;$('timed-history-status').className=`status-tag ${tone}`;}
 function controls(){const busy=!!controller;panel.setAttribute('aria-busy',String(busy));$('timed-history-analyze').disabled=busy||!reference;$('timed-history-cancel').hidden=!busy;}
 function clear(){result=null;page=0;$('timed-history-rows').replaceChildren();$('timed-history-diagnostics').replaceChildren();$('timed-history-count').textContent='';$('timed-history-pages').hidden=true;$('timed-history-note').hidden=true;}
 function invalidate(){generation++;const previous=controller;controller=null;previous?.abort();clear();status(reference?'待分析':'先選歷史 GPX');controls();}
 function setReference(gpx,name){reference=gpx?Object.freeze({gpx,name}):null;invalidate();panel.open=false;$('timed-history-file').textContent=reference?.name||'';}
 function diagnosticList(value){
  const target=$('timed-history-diagnostics'),codes=[...new Set([value.error_code,...value.diagnostics.map(x=>x.code),...(value.geometry?.quality||[]).map(x=>x.code)].filter(Boolean))];
  for(const code of codes){const li=documentImpl.createElement('li');li.textContent=reason(code);target.append(li);}
  const omitted=(value.diagnostic_omitted_count||0)+(value.geometry?.quality_omitted_count||0);if(omitted){const li=documentImpl.createElement('li');li.textContent=`另有 ${omitted.toLocaleString()} 筆重複或省略明細`;target.append(li);}
 }
 function renderPage(){
  const list=$('timed-history-rows');list.replaceChildren();const groups=result?.steep_groups||[],start=page*PAGE_SIZE;
  for(const group of groups.slice(start,start+PAGE_SIZE)){
   const li=documentImpl.createElement('li'),detail=documentImpl.createElement('details'),summary=documentImpl.createElement('summary');detail.className='compact-disclosure';
   const o=group.observation,hasRate=finite(o?.observed_elapsed_rate_m_h),direction=group.direction==='up'?'上坡':'下坡';
   summary.textContent=`${direction} · ${bounds(group.original_sample_bounds)} · ${hasRate?number(o.observed_elapsed_rate_m_h)+' m/h（含停留）':'資料不足'}`;
   const p=documentImpl.createElement('p');p.textContent=`${hasRate?'經過 '+number(o.elapsed_s)+' 秒 · 淨高差 '+number(o.directional_net_vertical_m)+' m\n':''}涵蓋 ${number(group.covered_horizontal_m)} m · 未涵蓋 ${number(group.uncovered_horizontal_m)} m`;
   const t=documentImpl.createElement('p');const time=group.original_time_bounds;t.textContent=time?.first&&time?.last?`${time.first} → ${time.last}`:'時間邊界未知';
   const notes=documentImpl.createElement('ul');for(const code of [...new Set([...(group.exclusions||[]),...(o?.exclusions||[])])]){const n=documentImpl.createElement('li');n.textContent=reason(code);notes.append(n);}
   detail.append(summary,p,t,notes);li.append(detail);list.append(li);
  }
  $('timed-history-pages').hidden=groups.length<=PAGE_SIZE;$('timed-history-prev').disabled=page===0;$('timed-history-next').disabled=start+PAGE_SIZE>=groups.length;
  $('timed-history-page').textContent=groups.length?`${start+1}–${Math.min(start+PAGE_SIZE,groups.length)}／${groups.length}`:'';
 }
 function valid(value){
  return value&&value.compact_schema_version===SCHEMA&&value.usable_by_hybrid===false&&value.historical_calibration_ready===false&&value.moving_time_s===null&&value.candidate_rates_m_h===null&&(value.source_sha256===null&&value.status==='input_rejected'||typeof value.source_sha256==='string'&&/^[a-f0-9]{64}$/.test(value.source_sha256))&&Array.isArray(value.steep_groups)&&value.steep_groups.length<=64&&Array.isArray(value.diagnostics)&&value.diagnostics.length<=128&&value.time_counts&&['total','valid','omitted','invalid'].every(k=>Number.isSafeInteger(value.time_counts[k])&&value.time_counts[k]>=0)&&Number.isSafeInteger(value.displayable_elapsed_rate_count)&&Number.isSafeInteger(value.group_count)&&value.group_count>=value.steep_groups.length&&!('original_time_series'in value)&&!('receipts'in value)&&JSON.stringify(value).length<=262144&&value.steep_groups.every(g=>g&&['up','down'].includes(g.direction)&&(!g.observation||g.observation.moving_s===null&&g.observation.observed_moving_rate_m_h===null&&['elapsed_s','directional_net_vertical_m','observed_elapsed_rate_m_h'].every(k=>g.observation[k]===null||finite(g.observation[k]))));
 }
 async function analyze(){
  if(!reference||controller)return;const identity=reference,token=++generation;controller=new AbortController();const own=controller;clear();controls();status('分析中','neutral');
  try{
   const value=await request({gpx_b64:identity.gpx,forecast_as_of:new Date().toISOString()},own.signal);
   if(token!==generation||reference!==identity)return;
   if(!valid(value))throw new Error('觀測回應待核。');result=value;
   const limited=value.projection_status!=='complete';const noTime=value.time_counts.valid===0&&value.time_counts.omitted>0&&value.time_counts.invalid===0;
   status(limited?'超出觀測上限':value.status==='input_rejected'?'檔案待核':value.displayable_elapsed_rate_count>0?'含停留':noTime?'缺時間':value.status==='no_timed_steep_observation'&&value.group_count===0?'沒有陡坡':'資料待核',limited||value.status==='input_rejected'?'error':value.displayable_elapsed_rate_count>0||noTime||value.status==='source_diagnostics_only'?'warning':'neutral');
   $('timed-history-count').textContent=`${value.time_counts.total.toLocaleString()} 點 · ${value.group_count.toLocaleString()} 段${limited?' · 未列明細':''}`;
   $('timed-history-note').hidden=value.displayable_elapsed_rate_count===0;diagnosticList(value);renderPage();
  }catch(error){if(token!==generation||reference!==identity)return;status(error.name==='AbortError'?'已取消':error.code==='worker_busy'?'目前忙碌':error.code==='local_only'?'僅支援本機分析':'分析未完成',error.name==='AbortError'?'neutral':'warning');}
  finally{if(token===generation&&controller===own){controller=null;controls();}}
 }
 $('timed-history-analyze').addEventListener('click',analyze);
 $('timed-history-cancel').addEventListener('click',()=>{invalidate();status('已取消');});
 $('timed-history-prev').addEventListener('click',()=>{if(!result||page===0)return;page--;renderPage();});
 $('timed-history-next').addEventListener('click',()=>{if(!result||(page+1)*PAGE_SIZE>=result.steep_groups.length)return;page++;renderPage();});
 setReference(null,'');
 return {setReference,invalidate,dispose(){invalidate();panel.open=false;}};
}
