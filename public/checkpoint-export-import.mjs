/** Imported extension claims are proposals, never authenticated official facts.
 * Call only after the original raw bytes passed actual engine inspect/details.
 * This module does not fetch URLs, create CP rows or change any source bytes.
 */
import {estimatedCoordinate,decodeGpxXml,assertSafeGpxMarkup} from './gpx-export.js';
const EXT_NS='https://runart-trail-planner.brycelin.chatgpt.site/gpx/extensions/v1';
const GPX_10='http://www.topografix.com/GPX/1/0',GPX_11='http://www.topografix.com/GPX/1/1';
const finite=n=>typeof n==='number'&&Number.isFinite(n),sha=s=>typeof s==='string'&&/^[a-f0-9]{64}$/u.test(s);
const close=(a,b)=>finite(a)&&finite(b)&&Math.abs(a-b)<=1e-6;
const allowedFields=new Set(['checkpoint_record_version','export_generation_id','checkpoint_occurrence_id','parent_checkpoint_occurrence_id','imported_source_claims','source_checkpoint_id','source_station_id','source_map_feature_id','source_checked_at','original_gpx_sha256','mapping_gpx_sha256','source_kind','source_url','edition','official_distance_m','canonical_distance_m','coordinate_method','source_point_index','source_point_indices','mapping_choice','stop_s','cutoff_elapsed_s','cutoff_local','cutoff_kind','official_cutoff_reported','official_cutoff_kind','official_cutoff_reference','cutoff_time_user_edited','cutoff_kind_user_confirmed','source_waypoint_identity','source_waypoint_index','source_waypoint_origin_sha256','source_waypoint_name','source_waypoint_lat','source_waypoint_lon','source_waypoint_elevation_m','source_waypoint_selected_passage_m','source_geometry_sha256']);
// Raw published facts only. Current mapping candidates, route position and user
// inputs never enter this catalogue-fact payload.
const catalogFactFields=new Set(['id','name','kind','stationType','aidStationStatus','checkpointCode','publishedStationLabel','officialDistanceM','officialDistanceBasis','officialSegmentDistanceM','officialCumulativeAscentM','officialCumulativeDescentM','publishedSegmentAscentM','publishedSegmentDescentM','lat','lon','elevationM','cutoffLocal','cutoffKind','cutoffReference','cutoffReported','cutoffReportedHours','cutoffSource','cutoffStatus','reportedCutoffLocal','cutoffArrivalDepartureSemantics','cutoffElapsedReference','services','supportReported','sourceUrl','sourceCheckedAt','sourceEdition','sourceMapFeatureId','sourceRowOrdinal','sourceStationId','sourceTableRow','canonicalPositionConfirmed']);
const lineageFields=new Set(['source_checkpoint_id','source_station_id','source_map_feature_id','source_checked_at','original_gpx_sha256','mapping_gpx_sha256','source_kind','source_url','edition','official_distance_m','coordinate_method','mapping_choice','cutoff_local','official_cutoff_reported','official_cutoff_kind','official_cutoff_reference','cutoff_time_user_edited','cutoff_kind_user_confirmed','source_waypoint_identity']);
const catalogSourceFields=new Set(['id','name','edition','group','gpx_sha256','official_page','gpx_url','race_date','race_date_status','race_date_evidence','edition_note','edition_evidence']);
const claimFailure=()=>{throw Error('站點來源聲明無法完整保留；未採用此方案。');};
function boundedClaimCopy(value,depth=0,budget={nodes:0,text:0}){
 if(depth>12||++budget.nodes>512)claimFailure();if(value===null||typeof value==='boolean')return value;
 if(typeof value==='string'){budget.text+=value.length;if(budget.text>8192)claimFailure();return value;}
 if(typeof value==='number'){if(!Number.isFinite(value))claimFailure();return value;}
 if(!value||typeof value!=='object'||![Object.prototype,null,Array.prototype].includes(Object.getPrototypeOf(value)))claimFailure();
 if(Array.isArray(value)){if(value.length>100||Reflect.ownKeys(value).length!==value.length+1)claimFailure();for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))claimFailure();}return Array.from(value,v=>boundedClaimCopy(v,depth+1,budget));}
 const out={},keys=Reflect.ownKeys(value);if(keys.length>100)claimFailure();for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(typeof key!=='string'||!d?.enumerable||!Object.hasOwn(d,'value')||['__proto__','constructor','prototype'].includes(key))claimFailure();budget.text+=key.length;if(budget.text>8192)claimFailure();out[key]=boundedClaimCopy(d.value,depth+1,budget);}return out;
}
function claimData(record,key,optional=false){const d=record&&Object.getOwnPropertyDescriptor(record,key);if(!d){if(optional)return undefined;claimFailure();}if(!d.enumerable||!Object.hasOwn(d,'value'))claimFailure();return d.value;}
function catalogFactClaimCopy(value){
 const claim=boundedClaimCopy(value);
 if(!claim||Array.isArray(claim)||Object.keys(claim).sort().join(',')!=='catalog_index,fact,schema,source'||claim.schema!=='catalog-checkpoint-fact/1'||!Number.isSafeInteger(claim.catalog_index)||claim.catalog_index<0||claim.catalog_index>=100||!claim.source||Array.isArray(claim.source)||Object.keys(claim.source).some(k=>!catalogSourceFields.has(k))||typeof claim.source.id!=='string'||typeof claim.source.name!=='string'||!Number.isInteger(claim.source.edition)||!sha(claim.source.gpx_sha256)||!claim.fact||Array.isArray(claim.fact)||Object.keys(claim.fact).some(k=>!catalogFactFields.has(k))||claim.fact.kind!=='checkpoint'||typeof claim.fact.name!=='string')claimFailure();
 return claim;
}
/** Export the reviewed occurrence separately from its current planner row.
 * On reread this remains a claim, never a registry/source-authority input.
 */
export function catalogCheckpointSourceClaims(source,record){
 const index=claimData(record,'catalogIndex'),checkpoints=claimData(source,'checkpoints');
 if(!Number.isSafeInteger(index)||index<0||index>=100||!Array.isArray(checkpoints)||checkpoints.length>100)claimFailure();
 const raw=claimData(checkpoints,String(index)),sourceSha=claimData(source,'sha256'),sourceId=claimData(source,'id'),sourceName=claimData(source,'name'),edition=claimData(source,'edition');
 if(!sha(sourceSha)||typeof sourceId!=='string'||!/^[a-z0-9-]+$/u.test(sourceId)||typeof sourceName!=='string'||!sourceName||sourceName.length>1000||!Number.isInteger(edition)||edition<2000||edition>2100||claimData(raw,'kind')!=='checkpoint'||claimData(raw,'name')!==claimData(record,'name'))claimFailure();
 const fact={};for(const key of catalogFactFields)if(Object.hasOwn(raw,key)){const d=Object.getOwnPropertyDescriptor(raw,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))claimFailure();fact[key]=boundedClaimCopy(d.value);}
 const origin={id:sourceId,name:sourceName,edition,group:claimData(source,'officialGroup',true)??null,gpx_sha256:sourceSha,official_page:claimData(source,'officialPage',true)??null,gpx_url:claimData(source,'gpxUrl',true)??null,race_date:claimData(source,'raceDate',true)??null};
 for(const [field,key]of [['raceDateStatus','race_date_status'],['raceDateEvidence','race_date_evidence'],['editionNote','edition_note'],['editionEvidence','edition_evidence']])if(Object.hasOwn(source,field))origin[key]=boundedClaimCopy(claimData(source,field));
 const claims={catalog_checkpoint_fact:catalogFactClaimCopy({schema:'catalog-checkpoint-fact/1',source:origin,catalog_index:index,fact}),authenticity:'unverified_exported_catalog_reference'};
 if(JSON.stringify(claims).length>8192)claimFailure();return claims;
}
const direct=(parent,name,ns=EXT_NS)=>[...parent.children].filter(n=>n.localName===name&&(n.namespaceURI||'')===ns);
function fields(container,allowed=null){
 if(container.children.length>64)throw Error('匯出欄位數量超過限制');const result={};for(const n of container.children){if((n.namespaceURI||'')!==EXT_NS)continue;if(allowed&&!allowed.has(n.localName))throw Error('未知匯出站點欄位');if(n.children.length||Object.hasOwn(result,n.localName)||n.textContent.length>8192)throw Error('匯出站點欄位重複或格式不符');result[n.localName]=n.textContent;}return result;
}
function numberField(record,key,{optional=false,min=-Infinity,max=Infinity}={}){
 if(!Object.hasOwn(record,key)){if(optional)return null;throw Error(`缺少 ${key}`);}const text=record[key].trim(),match=/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:[eE][+-]?\d+)?$/u.exec(text),n=Number(text);if(!match||!Number.isFinite(n))throw Error(`${key} 不正確`);
 // A nonzero decimal too small for Number is unknown, never an explicit zero.
 // Inspect only the coefficient: literal zero stays valid with any exponent.
 if(n===0&&/[1-9]/u.test(match[1]))throw Error(`${key} 無法保留原數值`);
 if(n<min||n>max)throw Error(`${key} 超出範圍`);return n;
}
export function readExportCheckpointSuggestions({originalBytes,details,DOMParserImpl=globalThis.DOMParser}={}){
 const answer={status:'none',suggestions:[],issues:[],markedWaypointIndices:[],sourceClaims:null};
 if(!details?.source||!sha(details.source.route_sha256)||!details.canonical_geometry||!Array.isArray(details.waypoints))return answer;
 let root,ns,versionOK=false;
 try{const text=decodeGpxXml(originalBytes);assertSafeGpxMarkup(text);const doc=new DOMParserImpl().parseFromString(text,'application/xml');if(doc.doctype||doc.getElementsByTagName('parsererror').length)throw Error('XML 無法核對');root=doc.documentElement;ns=root.namespaceURI||'';if(root.localName!=='gpx'||![GPX_10,GPX_11].includes(ns)||ns!==details.source.namespace)return answer;const version=root.getAttribute('version'),present=[...root.attributes].some(a=>a.name==='version');versionOK=ns===GPX_10?(!present||version==='1.0'):version==='1.1';}catch(error){return {...answer,status:'unavailable',issues:[error.message]};}
 const containerNs=ns===GPX_10?EXT_NS:ns,rootContainers=direct(root,'extensions',containerNs),receipts=rootContainers.flatMap(n=>direct(n,'provenance'));
 const wpts=direct(root,'wpt',ns);if(wpts.length!==details.waypoints.length)return {...answer,status:'invalid',issues:['原始航點清單無法核對']};
 // Older exports lacking the explicit record version remain visible, with their
 // supplied stop text shown as unverified; they are never silently adopted.
 const plannerNodes=node=>{const found=[],pending=[...node.children];while(pending.length){const child=pending.pop();if((child.namespaceURI||'')===EXT_NS&&['checkpoint_record_version','checkpoint_occurrence_id','canonical_distance_m','stop_s'].includes(child.localName)){found.push(child);if(found.length>128)return found;}for(const nested of child.children)pending.push(nested);}return found;};
 const marked=[];for(let index=0;index<wpts.length;index++){const cs=direct(wpts[index],'extensions',containerNs),rs=cs.filter(c=>direct(c,'checkpoint_record_version').length||direct(c,'export_kind').length||direct(c,'canonical_distance_m').length&&direct(c,'stop_s').length&&direct(c,'source_kind').length),suspect=plannerNodes(wpts[index]);if(rs.length||suspect.length){const stops=suspect.filter(n=>n.localName==='stop_s'&&!n.children.length);marked.push({index,containers:suspect.length>128?[]:rs,reportedStopText:stops.length===1?stops[0].textContent:null});answer.markedWaypointIndices.push(index);}}
 if(!marked.length)return answer;answer.status='invalid';
 let receipt,generationId=null;answer.archivedWaypointIndices=[];
 try{if(!versionOK)throw Error('匯出 GPX 版本待核對');if(!receipts.length||receipts.length>200)throw Error('匯出來源標記缺少或超過限制');receipt=fields(receipts.at(-1));const versionState=[...root.attributes].some(a=>a.name==='version')?root.getAttribute('version'):'absent';if(receipt.source_namespace!==ns||receipt.output_namespace!==ns||receipt.source_version_attribute!==versionState||receipt.output_version_attribute!==versionState)throw Error('匯出命名空間或版本聲明不符');if(receipt.export_kind!=='derived_checkpoint_gpx'||receipt.checkpoint_record_version!=='1')throw Error('匯出標記版本待核對');if(receipt.source_geometry_sha256!==details.canonical_geometry.geometry_sha256)throw Error('匯出幾何與本次實際路線不符');generationId=receipt.export_generation_id;if(!sha(generationId)||generationId!==receipt.source_sha256)throw Error('匯出批次身分不符');if(!sha(receipt.source_sha256))throw Error('匯出來源 SHA 格式不符');const nativeCount=numberField(receipt,'native_waypoint_count',{min:0,max:200});if(!Number.isSafeInteger(nativeCount)||nativeCount>wpts.length)throw Error('原生／匯出航點數量無法核對');const activeCount=numberField(receipt,'added_checkpoint_count',{min:0,max:100});if(!Number.isSafeInteger(activeCount)||nativeCount+activeCount!==wpts.length)throw Error('本次匯出站點數量不符');answer.sourceClaims={generationId,activeCount,claimedSourceSha256:receipt.source_sha256,geometrySha256:receipt.source_geometry_sha256,nativeWaypointCount:nativeCount,claimedSourceFilename:receipt.source_filename||null,authenticity:'unverified_imported_claim'};}catch(error){answer.issues.push(error.message);}
 const ids=new Set();
 for(const {index,containers,reportedStopText}of marked){let record;
  try{if(containers.length!==1)throw Error('站點標記重複或容器命名空間不符');record=fields(containers[0],allowedFields);if(answer.sourceClaims&&index<answer.sourceClaims.nativeWaypointCount){answer.archivedWaypointIndices.push(index);continue;}if(record.export_generation_id!==generationId)throw Error('站點與本次匯出批次不符');const id=record.checkpoint_occurrence_id;if(record.checkpoint_record_version!=='1'||typeof id!=='string'||!id||id.length>256)throw Error('站點身分缺少或重複');if(ids.has(id)){for(const earlier of answer.suggestions)if(earlier.occurrenceId===id){earlier.status='unavailable';earlier.reason='站點身分重複';}throw Error('站點身分重複');}ids.add(id);
   if(!answer.sourceClaims)throw Error('匯出来源无法核对');if(record.source_geometry_sha256!==details.canonical_geometry.geometry_sha256)throw Error('站點幾何與本次路線不符');if(index<answer.sourceClaims.nativeWaypointCount)throw Error('匯出站點位置不符');
   const waypoint=details.waypoints[index],name=waypoint.name;if(typeof name!=='string'||!name.trim()||[...name].length>80)throw Error('站點名稱無法安全採用');
   const distanceM=numberField(record,'canonical_distance_m',{min:0,max:details.canonical_geometry.distance_m}),stopS=numberField(record,'stop_s',{min:0,max:86400});if(distanceM<=0.001||distanceM>=details.canonical_geometry.distance_m-0.001)throw Error('匯出站點須位於起終點之間');
   const estimated=record.coordinate_method==='estimated_linear_between_source_points';let candidates,sourcePointIndices=null;if(estimated){if(details.raw_profile_segments?.length!==1)throw Error('目前無法核對跨段估算位置');const expected=estimatedCoordinate(details.raw_profile_segments[0].points,distanceM);sourcePointIndices=JSON.parse(record.source_point_indices);if(!Array.isArray(sourcePointIndices)||sourcePointIndices.length!==2||!sourcePointIndices.every((n,i)=>Number.isSafeInteger(n)&&n===expected.source_point_indices[i])||waypoint.lat!==expected.lat||waypoint.lon!==expected.lon||waypoint.ele!==expected.ele)throw Error('匯出估算位置與本次原始點位不符');candidates=[{along_route_m:distanceM,source_point_indices:sourcePointIndices,coordinate_method:'validated_linear_between_source_points'}];}else{const projection=waypoint.projection;if(!projection||!['unique','ambiguous'].includes(projection.status)||!Array.isArray(projection.candidates)||projection.candidates.length>64)throw Error('目前無法核對沿線位置');candidates=projection.candidates.filter(c=>close(c.along_route_m,distanceM));if(candidates.length!==1)throw Error('匯出里程無法對上本次路線位置');}
   let cutoffElapsedS=numberField(record,'cutoff_elapsed_s',{optional:true,min:0,max:604800}),cutoffKind=record.cutoff_kind||null;if(cutoffKind!==null&&!['arrival','departure'].includes(cutoffKind))throw Error('匯出關門依據不正確');if(cutoffElapsedS!==null&&!Number.isInteger(cutoffElapsedS))throw Error('匯出關門的小數秒需自行核對');if(cutoffElapsedS!==null&&!['arrival','departure'].includes(cutoffKind))throw Error('匯出關門依據待核對');if(cutoffElapsedS===null)cutoffKind=null;
   let nativeWaypointIndex=null;if(Object.hasOwn(record,'source_waypoint_index')){const sourceIndex=numberField(record,'source_waypoint_index',{min:0,max:199});if(!Number.isSafeInteger(sourceIndex)||sourceIndex>=answer.sourceClaims.nativeWaypointCount||!sha(record.source_waypoint_origin_sha256))throw Error('原生航點來源索引不符');const native=details.waypoints[sourceIndex],identity=JSON.parse(record.source_waypoint_identity);if(JSON.stringify(identity)!==record.source_waypoint_identity)throw Error('原生航點身分 JSON 格式不符');if(!identity||typeof identity!=='object'||Array.isArray(identity)||Object.keys(identity).sort().join(',')!=='ele,index,lat,lon,name,origin_sha256'||identity.index!==sourceIndex||identity.origin_sha256!==record.source_waypoint_origin_sha256||identity.name!==native.name||identity.lat!==native.lat||identity.lon!==native.lon||identity.ele!==native.ele||native.lat!==waypoint.lat||native.lon!==waypoint.lon||native.ele!==waypoint.ele||!close(numberField(record,'source_waypoint_selected_passage_m'),distanceM))throw Error('原生航點身分或經過里程不符');if(native.projection?.candidates?.filter(c=>close(c.along_route_m,distanceM)).length!==1)throw Error('原生航點經過位置無法核對');nativeWaypointIndex=sourceIndex;}
   answer.suggestions.push({status:'ready',occurrenceId:id,waypointIndex:index,nativeWaypointIndex,name,distanceM,stopS,cutoffElapsedS,cutoffKind,candidate:{...candidates[0]},sourceRouteSha256:details.source.route_sha256,geometrySha256:details.canonical_geometry.geometry_sha256,coordinateMethod:record.coordinate_method,sourcePointIndices,coordinate:{lat:waypoint.lat,lon:waypoint.lon,ele:waypoint.ele},claimedSourceSha256:answer.sourceClaims.claimedSourceSha256,claimedSourceKind:record.source_kind||null,claimedLineage:{...record},authenticity:'unverified_imported_claim'});
  }catch(error){answer.suggestions.push({status:'unavailable',claimedOccurrenceId:record?.checkpoint_occurrence_id??null,waypointIndex:index,name:details.waypoints[index]?.name||`航點 ${index+1}`,reportedStopText:record?.stop_s??reportedStopText??null,reason:error.message});answer.issues.push(`航點 ${index+1}：${error.message}`);}
 }
 // Repeated claimed occurrence IDs invalidate all copies, not only the later one.
 const counts=new Map();for(const suggestion of answer.suggestions){const id=suggestion.occurrenceId||suggestion.claimedOccurrenceId;if(id)counts.set(id,(counts.get(id)||0)+1);}
 for(const suggestion of answer.suggestions)if(counts.get(suggestion.occurrenceId||suggestion.claimedOccurrenceId)>1){suggestion.status='unavailable';suggestion.reason='站點身分重複';}
 if(answer.sourceClaims&&answer.suggestions.length!==answer.sourceClaims.activeCount)answer.issues.push('本次匯出站點未完整');
 const readyByDistance=new Map();for(const suggestion of answer.suggestions){if(suggestion.status!=='ready')continue;const earlier=[...readyByDistance.values()].find(other=>close(other.distanceM,suggestion.distanceM));if(earlier){earlier.status='unavailable';earlier.reason='匯出經過里程重複';suggestion.status='unavailable';suggestion.reason='匯出經過里程重複';answer.issues.push('匯出經過里程重複');}else readyByDistance.set(suggestion.waypointIndex,suggestion);}
 answer.status=answer.suggestions.every(s=>s.status==='ready')&&!answer.issues.length?'ready':'partial';return answer;
}
export function exportSuggestionForNativePassage(result,waypointIndex,distanceM){return result?.suggestions?.find(s=>s.status==='ready'&&s.nativeWaypointIndex===waypointIndex&&close(s.distanceM,distanceM))||null;}
/** Keep bounded fact claims through explicit re-adoption, without granting source authority.
 * Flatten the prior fact payload rather than nesting a full export at each generation.
 */
export function unverifiedCheckpointSourceClaims(suggestion){
 const fail=claimFailure;
 const status=claimData(suggestion,'status'),sourceSha=claimData(suggestion,'claimedSourceSha256'),sourceKind=claimData(suggestion,'claimedSourceKind',true)??null,lineageRecord=claimData(suggestion,'claimedLineage',true)??{};
 if(status!=='ready'||!sha(sourceSha)||sourceKind!==null&&(typeof sourceKind!=='string'||sourceKind.length>256))fail();
 const text=claimData(lineageRecord,'imported_source_claims',true);let prior=null;
 if(text!==undefined){if(typeof text!=='string'||text.length>8192)fail();try{prior=boundedClaimCopy(JSON.parse(text));}catch{fail();}if(!prior||Array.isArray(prior)||typeof prior!=='object')fail();}
 const claims={claimed_source_sha256:sourceSha,claimed_source_kind:sourceKind,authenticity:'unverified_imported_claim'};
 if(prior&&Object.hasOwn(prior,'catalog_checkpoint_fact'))claims.catalog_checkpoint_fact=catalogFactClaimCopy(prior.catalog_checkpoint_fact);
 if(prior&&Object.hasOwn(prior,'checkpoint_lineage')&&(!prior.checkpoint_lineage||typeof prior.checkpoint_lineage!=='object'||Array.isArray(prior.checkpoint_lineage)||Object.keys(prior.checkpoint_lineage).some(k=>!lineageFields.has(k))))fail();
 const lineage={};for(const key of lineageFields)if(Object.hasOwn(prior?.checkpoint_lineage||{},key))lineage[key]=boundedClaimCopy(prior.checkpoint_lineage[key]);else if(!prior?.checkpoint_lineage&&Object.hasOwn(lineageRecord,key))lineage[key]=boundedClaimCopy(claimData(lineageRecord,key));
 if(Object.keys(lineage).length)claims.checkpoint_lineage=lineage;
 if(prior&&Object.hasOwn(prior,'course_context_fact')){
  // These are preserved claims only. Never put them in official/context row slots.
  claims.course_context_fact=prior.course_context_fact;claims.course_context_mapping=prior.course_context_mapping??null;
 }
 if(claims.catalog_checkpoint_fact||claims.course_context_fact||claims.checkpoint_lineage){claims.origin_claimed_source_sha256=sha(prior?.origin_claimed_source_sha256)?prior.origin_claimed_source_sha256:sha(prior?.claimed_source_sha256)?prior.claimed_source_sha256:sourceSha;claims.origin_claimed_source_kind=typeof prior?.origin_claimed_source_kind==='string'?prior.origin_claimed_source_kind:typeof prior?.claimed_source_kind==='string'?prior.claimed_source_kind:sourceKind;}
 if(JSON.stringify(claims).length>8192)fail();return claims;
}
