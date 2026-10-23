/** Catalog station facts for an explicitly user-confirmed context; no source-position authority. */
import {validatePublishedCheckpointTable} from './published-checkpoint-tables.mjs';
const HASH=/^[a-f0-9]{64}$/u;
function fail(){throw Error('公布站點資料尚未確認，未加入任何站點。');}
function copy(value,depth=0){
 if(depth>8)fail();if(value===null||typeof value==='boolean')return value;
 if(typeof value==='string'){if(value.length>8192)fail();return value;}
 if(typeof value==='number'){if(!Number.isFinite(value))fail();return value;}
 if(Array.isArray(value)){if(value.length>100||Reflect.ownKeys(value).length!==value.length+1)fail();for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();}return Object.freeze(Array.from(value,v=>copy(v,depth+1)));}
 if(!value||typeof value!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail();
 const out={};for(const key of Reflect.ownKeys(value)){const d=Object.getOwnPropertyDescriptor(value,key);if(typeof key!=='string'||!d?.enumerable||!Object.hasOwn(d,'value')||['__proto__','constructor','prototype'].includes(key))fail();out[key]=copy(d.value,depth+1);}return Object.freeze(out);
}
function publicURL(value){if(typeof value!=='string')return false;try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}}
function publishedTable(context){
 if(context?.source||!context?.group)return null;
 if(!context.event||!Array.isArray(context.event.routes)||typeof context.group!=='string'||context.catalogSourceSha256!==null||context.numericCourseMatch!==null||typeof context.uploadedSha256!=='string'||!HASH.test(context.uploadedSha256))fail();
 const references=context.event.routes.filter(reference=>reference?.name===context.group);
 if(!references.length)return null;if(references.length!==1)fail();const reference=references[0],descriptor=Object.getOwnPropertyDescriptor(reference,'publishedCheckpointTable');
 if(Object.hasOwn(reference,'publishedCheckpointTableStatus'))fail();
 if(!descriptor)return null;if(!Object.hasOwn(descriptor,'value'))fail();
 try{return validatePublishedCheckpointTable(descriptor.value,context.event,reference);}catch{fail();}
}
export function uploadedCoursePublishedTableSnapshot(context){
 const table=publishedTable(context);if(!table)return null;
 return Object.freeze({schema:table.schema,id:table.id,event_id:table.eventId,edition:table.edition,group_key:table.groupKey,group_name:table.groupName,source_url:table.sourceUrl,source_sha256:table.sourceSha256,html_table_ordinal:table.htmlTableOrdinal,raw_table_sha256:table.rawTableSha256,route_original_sha256:null,position_authority:'none',route_mapping_status:table.routeMappingStatus,cutoff_rule_meaning:table.cutoffRuleMeaning,derived_leg_total_km:table.derivedLegTotalKm,route_version:table.routeVersion});
}
export function uploadedCourseStationFacts(context){
 const s=context?.source;if(!s){
  const table=publishedTable(context);if(!table)return Object.freeze([]);const snapshot=uploadedCoursePublishedTableSnapshot(context);
  return Object.freeze(table.checkpoints.map((raw,catalogIndex)=>Object.freeze({...copy(raw),catalogIndex,contextEdition:table.edition,courseId:null,catalogOriginalSha256:null,uploadedOriginalSha256:context.uploadedSha256,associationEvidence:context.evidence,positionAuthority:'none_user_confirmed_published_table_reference',publishedTable:snapshot})).filter(record=>record.kind==='checkpoint'));
 }
 if(typeof s.id!=='string'||typeof s.sha256!=='string'||!HASH.test(s.sha256)||s.sha256!==context.catalogSourceSha256||typeof context.uploadedSha256!=='string'||!HASH.test(context.uploadedSha256)||!Number.isInteger(s.edition)||s.edition!==context.event?.year||!Array.isArray(s.checkpoints)||s.checkpoints.length>100||Reflect.ownKeys(s.checkpoints).length!==s.checkpoints.length+1)fail();
 for(let i=0;i<s.checkpoints.length;i++){const d=Object.getOwnPropertyDescriptor(s.checkpoints,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail();}
 const records=s.checkpoints.map((raw,catalogIndex)=>{const record=copy(raw);if(typeof record.name!=='string'||!record.name.trim()||record.name.length>256||!['start','checkpoint','finish'].includes(record.kind)||record.officialDistanceM!==null&&(!Number.isFinite(record.officialDistanceM)||record.officialDistanceM<0||record.officialDistanceM>2000000)||record.sourceUrl!==undefined&&!publicURL(record.sourceUrl)||JSON.stringify(record).length>32768)fail();return Object.freeze({...record,catalogIndex,contextEdition:s.edition,courseId:s.id,catalogOriginalSha256:s.sha256,uploadedOriginalSha256:context.uploadedSha256,associationEvidence:context.evidence,positionAuthority:'none_user_confirmed_catalog_reference'});});
 return Object.freeze(records.filter(record=>record.kind==='checkpoint'));
}
export const courseStationFactKey=record=>record.publishedTable?JSON.stringify(['published-table',record.publishedTable.id,record.publishedTable.source_sha256,record.publishedTable.raw_table_sha256,record.id]):JSON.stringify([record.courseId,record.catalogOriginalSha256,record.catalogIndex]);
