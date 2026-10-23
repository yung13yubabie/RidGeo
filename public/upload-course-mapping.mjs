/** Checked numeric-equality reuse of trusted catalog coordinates. Never exact raw-source identity. */
import{browserSha256}from'./python-engine.mjs';
import{canonicalCourseStream,classifyCourseFingerprint,courseChoiceForKey,courseContextForChoice}from'./upload-course-context.mjs';
import{uploadedCourseStationFacts,courseStationFactKey}from'./upload-course-facts.mjs';
import{checkpointCoordinateCandidates}from'./checkpoint-coordinate-mapping.mjs';
const HASH=/^[a-f0-9]{64}$/u,MAX_BYTES=5*1024*1024,tickets=new WeakMap();
const fail=message=>{throw Object.assign(Error(message||'目前逐點資料或站點位置尚未完整確認；公布資料與編輯內容已保留。'),{code:'course_mapping_unavailable'});};
const clone=value=>JSON.parse(JSON.stringify(value));
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
function decode(value){if(typeof value!=='string'||!value||value.length>Math.ceil(MAX_BYTES/3)*4||value.length%4!==0||!/^[A-Za-z0-9+/]+={0,2}$/u.test(value))fail();let raw;try{raw=atob(value);}catch{fail();}if(!raw.length||raw.length>MAX_BYTES)fail();return Uint8Array.from(raw,c=>c.charCodeAt(0));}
function signature(input){return JSON.stringify([input.context,input.originalGpx,input.currentGpx,input.originalDetails,input.currentDetails,input.route]);}
function geometryOwner(details,route){
 const g=details?.canonical_geometry,q=details?.summary;
 if(!g||!q||route?.blocked!==false||g.blocked!==false||q.planning_blocked!==false||typeof route.route_sha256!=='string'||!HASH.test(route.route_sha256)||typeof route.geometry_sha256!=='string'||!HASH.test(route.geometry_sha256)||typeof route.geometry_version!=='string'||!route.geometry_version||g.route_sha256!==route.route_sha256||g.geometry_sha256!==route.geometry_sha256||g.geometry_version!==route.geometry_version||!Number.isFinite(route.distance_m)||route.distance_m<=0||g.distance_m!==route.distance_m||q.distance_m!==route.distance_m||g.source_points!==q.point_count||g.source_points!==route.source_points||g.segment_count!==q.segment_count||g.segment_count!==route.segment_count||g.segment_count!==1||!g.config||!route.config||!['grid_m','smoothing_window_m','max_raw_gap_m','max_route_m'].every(k=>Number.isFinite(g.config[k])&&g.config[k]===route.config[k]))fail();
 const points=details.raw_profile_segments[0].points;let canonical=-Infinity,horizontal=-Infinity;
 for(const point of points){if(!Number.isFinite(point.canonical_along_route_m)||point.canonical_along_route_m<0||point.canonical_along_route_m>route.distance_m||point.canonical_along_route_m<canonical||!Number.isFinite(point.horizontal_m)||point.horizontal_m<0||point.horizontal_m<horizontal)fail();canonical=point.canonical_along_route_m;horizontal=point.horizontal_m;}
}
function completeProjections(source,details,route){
 if(!Array.isArray(details.official_waypoints)||details.official_waypoints.length!==source.checkpoints.length)fail('官方座標候選尚未完整取得；請重新核對候選，未更動站點。');
 const count=details.raw_profile_segments[0].points.length;
 for(const [index,cp]of source.checkpoints.entries()){
  const record=details.official_waypoints[index],p=record?.projection;
  if(!record||record.index!==index||record.name!==cp.name||record.lat!==cp.lat||record.lon!==cp.lon||record.ele!==(cp.elevationM??null)||p?.advisory_only!==true||p.candidates_truncated!==false||!Number.isSafeInteger(p.candidate_count)||p.candidate_count<0||p.candidate_count>64||!Array.isArray(p.candidates)||p.candidate_count!==p.candidates.length||p.status!==(p.candidate_count===0?'off_route':p.candidate_count===1?'unique':'ambiguous'))fail('官方座標候選不完整或與來源不一致；未更動站點。');
  let previous=-Infinity;
  for(const c of p.candidates){if(!Number.isFinite(c.along_route_m)||c.along_route_m<0||c.along_route_m>route.distance_m||c.along_route_m<previous||!Number.isFinite(c.raw_horizontal_along_route_m)||c.raw_horizontal_along_route_m<0||!Number.isFinite(c.offset_m)||c.offset_m<0||c.offset_m>50||!Number.isSafeInteger(c.raw_edge_index)||c.raw_edge_index<0||c.raw_edge_index>=count-1)fail('官方座標經過位置無法完整確認；未更動站點。');previous=c.along_route_m;}
 }
}
export async function verifyUploadedCourseMapping(input){
 const {index,context,originalGpx,currentGpx,originalDetails,currentDetails,route}=input||{},choice=courseChoiceForKey(index,context?.choiceKey);
 const captured={index,context,originalGpx,currentGpx,originalDetails,currentDetails,route};
 if(!choice?.sourceChoice||!context?.source||context.source.mappingMode==='official_distance_only'||context.source.mappingMode==='official_station_facts_unknown')fail('這條路線沒有可沿用的已查核站點座標；請手填並確認目前里程。');
 const selected=courseContextForChoice(index,choice,{sha256:context.uploadedSha256,bytes:context.uploadedBytes,filename:context.uploadedFilename});
 if(selected.catalogSourceSha256!==context.catalogSourceSha256||selected.event.id!==context.event?.id||selected.source.id!==context.source.id||JSON.stringify(selected.source)!==JSON.stringify(context.source)||selected.group!==context.group)fail();
 const facts=uploadedCourseStationFacts(context),source=context.source;
 if(!facts.length||!Array.isArray(source.checkpoints)||source.checkpoints.length>100||source.checkpoints.some(cp=>!Number.isFinite(cp.lat)||Math.abs(cp.lat)>90||!Number.isFinite(cp.lon)||Math.abs(cp.lon)>180))fail('公布資料沒有完整查核座標；請手填並確認目前里程。');
 const originalBytes=decode(originalGpx),currentBytes=currentGpx===originalGpx?originalBytes:decode(currentGpx);
 if(originalBytes.length!==context.uploadedBytes||originalDetails?.source?.route_sha256!==context.uploadedSha256||originalDetails?.source?.byte_count!==originalBytes.length||currentDetails?.source?.route_sha256!==route?.route_sha256||currentDetails?.source?.byte_count!==currentBytes.length)fail();
 const original=canonicalCourseStream(originalDetails),current=currentDetails===originalDetails?original:canonicalCourseStream(currentDetails);geometryOwner(currentDetails,route);
 const before=signature(captured),originalSha=await browserSha256(originalBytes),currentSha=currentBytes===originalBytes?originalSha:await browserSha256(currentBytes),originalStreamSha=await browserSha256(original.bytes),currentStreamSha=current===original?originalStreamSha:await browserSha256(current.bytes);
 if(!Object.keys(captured).every(k=>input[k]===captured[k])||before!==signature(captured)||originalSha!==context.uploadedSha256||currentSha!==route.route_sha256||originalStreamSha!==currentStreamSha||!['version','pointCount','segmentCount','trackCount','routeCount'].every(k=>original[k]===current[k]))fail();
 const {bytes,...counts}=original,fingerprint=Object.freeze({...counts,sha256:originalStreamSha}),match=classifyCourseFingerprint(index,fingerprint);
 if(!match.choices.some(c=>c.key===choice.key))fail('目前逐點資料與所選查核路線不同或缺少查核指紋；請手填並確認里程。');
 if(source.mappingMode==='projected_official_coordinates')completeProjections(source,currentDetails,route);
 const records=checkpointCoordinateCandidates(source,currentDetails),evidence=freeze({schema:'uploaded-course-coordinate-mapping/1',association:'explicit_user_adopted_equal_numeric_catalog_coordinate',catalog_original_sha256:source.sha256,uploaded_original_sha256:originalSha,uploaded_original_bytes:originalBytes.length,current_calculation_sha256:currentSha,current_calculation_bytes:currentBytes.length,course_choice:context.choiceKey,course_id:source.id,edition:context.event.year,group:context.group,fingerprint,geometry_sha256:route.geometry_sha256,geometry_version:route.geometry_version});
 const stations=facts.map(fact=>{
  const record=records[fact.catalogIndex],candidates=(record?.candidates||[]).filter(c=>Number.isFinite(c.distance_m)&&c.distance_m>1e-6&&route.distance_m-c.distance_m>1e-6);
  return freeze({factKey:courseStationFactKey(fact),catalogIndex:fact.catalogIndex,name:fact.name,method:record?.mapping_method??null,explicitPassage:source.coordinateSelection==='explicit_official_passage',mappingConflict:record?.mapping_conflict===true,candidates:clone(candidates)});
 });
 const ticket=Object.freeze({evidence,stations:Object.freeze(stations)});tickets.set(ticket,{input:captured,signature:before});return ticket;
}
export function uploadedCourseMappingCurrent(ticket,input){
 const owned=tickets.get(ticket);if(!owned)return false;
 try{return ['index','context','originalGpx','currentGpx','originalDetails','currentDetails','route'].every(k=>owned.input[k]===input[k])&&owned.signature===signature(input);}catch{return false;}
}
export function uploadedCourseMappingChoice(ticket,factKey,passageIndex){
 if(!tickets.has(ticket)||typeof factKey!=='string'||!Number.isSafeInteger(passageIndex)||passageIndex<0)return null;
 const station=ticket.stations.find(s=>s.factKey===factKey),candidate=station?.candidates[passageIndex];
 if(!candidate)return null;return Object.freeze({station,candidate,passageIndex,evidence:ticket.evidence,identity:JSON.stringify([ticket.evidence,station.factKey,station.method,passageIndex,candidate])});
}
