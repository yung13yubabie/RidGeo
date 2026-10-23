import {courseDateQualification,eventDateQualification,MAX_COURSE_CONTEXT_JSON} from './catalog-dates.mjs';
/** Explicit uploaded course context. This never establishes exact original-source identity. */
import {createSourceIdentityIndex,sourceForExactChoice} from './upload-source-identity.mjs';
import {uploadedCoursePublishedTableSnapshot} from './upload-course-facts.mjs';
export const COURSE_STREAM_VERSION='ridgeq-upload-point-stream/1';
const HASH=/^[a-f0-9]{64}$/u,MAX_POINTS=50000,MAX_SEGMENTS=2000,MAX_CHOICES=40;
const indexes=new WeakSet(),registries=new WeakMap(),choices=new WeakSet(),headers=new TextEncoder().encode(COURSE_STREAM_VERSION+'\0');
const uint=(n,max)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
const fail=()=>{throw Error('Course point/topology evidence unavailable');};
export function canonicalCourseStream(details){
 const q=details?.summary,segments=details?.segments,profiles=details?.raw_profile_segments;
 if(details?.detail_schema_version!=='trail-details/1.0'||!details?.source||typeof details.source.route_sha256!=='string'||!HASH.test(details.source.route_sha256)||!uint(details.source.byte_count,5*1024*1024)||!details.source.byte_count||!q||!uint(q.point_count,MAX_POINTS)||q.point_count<2||!uint(q.segment_count,MAX_SEGMENTS)||!q.segment_count||!uint(q.track_count,MAX_SEGMENTS)||!uint(q.route_count,MAX_SEGMENTS)||q.track_count+q.route_count<1||q.track_count+q.route_count>q.segment_count||!Array.isArray(segments)||!Array.isArray(profiles)||segments.length!==q.segment_count||profiles.length!==q.segment_count)fail();
 const tracks=new Set(),routes=new Set();let offset=0,lastTrack=-1,lastRoute=-1,lastTrackSegment=-1,lastKind=null;
 const size=headers.length+16+17*q.segment_count+25*q.point_count,bytes=new Uint8Array(size),view=new DataView(bytes.buffer);bytes.set(headers);let cursor=headers.length;
 const u=n=>{view.setUint32(cursor,n,false);cursor+=4;},f=n=>{view.setFloat64(cursor,Object.is(n,-0)?0:n,false);cursor+=8;};
 for(const n of [q.point_count,q.segment_count,q.track_count,q.route_count])u(n);
 for(let i=0;i<segments.length;i++){
  const s=segments[i],p=profiles[i];if(!s||s.index!==i||!p||p.segment_index!==i||!Array.isArray(p.points)||s.point_count!==p.points.length||!uint(s.point_count,MAX_POINTS)||offset+s.point_count>q.point_count||!uint(s.segment_index,MAX_SEGMENTS))fail();
  if(s.kind==='track'){
   if(!uint(s.track_index,q.track_count-1)||s.route_index!==null)fail();
   if(s.track_index===lastTrack&&lastKind==='route')fail();
   if(s.track_index!==lastTrack){if(s.track_index!==lastTrack+1||s.segment_index!==0)fail();lastTrack=s.track_index;lastTrackSegment=-1;}
   if(s.segment_index!==lastTrackSegment+1)fail();lastTrackSegment=s.segment_index;tracks.add(s.track_index);
  }else if(s.kind==='route'){
   if(s.track_index!==null||!uint(s.route_index,q.route_count-1)||s.route_index!==lastRoute+1||s.segment_index!==0)fail();lastRoute=s.route_index;routes.add(s.route_index);
  }else fail();
  lastKind=s.kind;
  bytes[cursor++]=s.kind==='track'?1:2;u(s.track_index===null?0:s.track_index+1);u(s.route_index===null?0:s.route_index+1);u(s.segment_index);u(s.point_count);
  for(const point of p.points){if(!point||point.source_point_index!==offset++||!Number.isFinite(point.lat)||Math.abs(point.lat)>90||!Number.isFinite(point.lon)||Math.abs(point.lon)>180||point.ele!==null&&(!Number.isFinite(point.ele)||point.ele< -1000||point.ele>10000))fail();f(point.lat);f(point.lon);bytes[cursor++]=point.ele===null?0:1;f(point.ele===null?0:point.ele);}
 }
 // Empty tracks lack location descriptors. Reject instead of collapsing their root order.
 if(offset!==q.point_count||tracks.size!==q.track_count||routes.size!==q.route_count||cursor!==size)fail();
 return Object.freeze({version:COURSE_STREAM_VERSION,bytes,pointCount:q.point_count,segmentCount:q.segment_count,trackCount:q.track_count,routeCount:q.route_count});
}
export function createCourseContextIndex(events,sources,pins){
 if(!Array.isArray(events)||events.length>2000||!Array.isArray(pins)||pins.length>2000)throw Error('Invalid reviewed course context registry');
 const identity=createSourceIdentityIndex(sources),sourceChoices=new Map();for(const c of Object.values(identity).flat())sourceChoices.set(c.key,c);
 const sourceMap=new Map(sources.map(s=>[s.id,s])),eventIds=new Set(),entries=[],byEvent=new Map(),byKey=new Map(),sourceEvents=new Map();
 for(const event of events){if(!event||typeof event.id!=='string'||eventIds.has(event.id)||typeof event.name!=='string'||!event.name||!Number.isInteger(event.year)||!Array.isArray(event.routeIds)||!Array.isArray(event.routes))throw Error('Invalid reviewed event context');eventDateQualification(event);eventIds.add(event.id);
  const list=[],add=(key,label,sourceChoice=null,group=null)=>{if(byKey.has(key))throw Error('Duplicate course context choice');const c=Object.freeze({key,label,event,sourceChoice,group});choices.add(c);list.push(c);entries.push(c);byKey.set(key,c);};
  add(event.id+':event',event.name+' · '+event.year+' · 組別未選');
  if(event.routeIds.length){for(const id of event.routeIds){const s=sourceMap.get(id);if(!s||s.edition!==event.year||sourceEvents.has(id))throw Error('Course context edition/source conflict');sourceEvents.set(id,event.id);for(const c of sourceChoices.values())if(c.source.id===id)add(event.id+':source:'+c.key,c.label,c);}}
  else {const labels=[...new Set([...event.routes.map(r=>r.name),...(event.distanceLabels||[])].filter(v=>typeof v==='string'&&v.trim()))];if(labels.length>80)throw Error('Too many event group labels');for(const [i,label] of labels.entries())add(event.id+':group:'+i,event.name+' · '+event.year+' · '+label,null,label);}
  byEvent.set(event.id,Object.freeze(list));
 }
 const pinMap=new Map(),fingerprints=new Map();for(const pin of pins){const source=sourceMap.get(pin?.id);if(!source||!sourceEvents.has(source.id)||pinMap.has(source.id)||pin.sourceSha256!==source.sha256||pin.sourceBytes!==source.bytes||pin.version!==COURSE_STREAM_VERSION||typeof pin.fingerprintSha256!=='string'||!HASH.test(pin.fingerprintSha256)||!uint(pin.pointCount,MAX_POINTS)||pin.pointCount<2||!uint(pin.segmentCount,MAX_SEGMENTS)||!pin.segmentCount||!uint(pin.trackCount,MAX_SEGMENTS)||!uint(pin.routeCount,MAX_SEGMENTS)||pin.trackCount+pin.routeCount<1||pin.trackCount+pin.routeCount>pin.segmentCount)throw Error('Invalid reviewed course fingerprint pin');pinMap.set(source.id,Object.freeze({...pin}));(fingerprints.get(pin.fingerprintSha256)||fingerprints.set(pin.fingerprintSha256,[]).get(pin.fingerprintSha256)).push(pin.id);}
 const index=Object.freeze({events:Object.freeze([...events]),entries:Object.freeze(entries)});indexes.add(index);registries.set(index,{byEvent,byKey,pinMap,fingerprints});return index;
}
export function classifyCourseFingerprint(index,fingerprint){
 if(!indexes.has(index)||!fingerprint||fingerprint.version!==COURSE_STREAM_VERSION||typeof fingerprint.sha256!=='string'||!HASH.test(fingerprint.sha256)||!uint(fingerprint.pointCount,MAX_POINTS)||fingerprint.pointCount<2||!uint(fingerprint.segmentCount,MAX_SEGMENTS)||!fingerprint.segmentCount||!uint(fingerprint.trackCount,MAX_SEGMENTS)||!uint(fingerprint.routeCount,MAX_SEGMENTS)||fingerprint.trackCount+fingerprint.routeCount<1||fingerprint.trackCount+fingerprint.routeCount>fingerprint.segmentCount)throw Error('Invalid course fingerprint');
 const registry=registries.get(index),ids=(registry.fingerprints.get(fingerprint.sha256)||[]).filter(id=>{const p=registry.pinMap.get(id);return ['pointCount','segmentCount','trackCount','routeCount'].every(k=>p[k]===fingerprint[k]);}),all=index.entries.filter(c=>ids.includes(c.sourceChoice?.source.id));
 return Object.freeze({status:all.length>MAX_CHOICES?'too_many':all.length?'choose':'unmatched',totalChoices:all.length,choices:Object.freeze(all.length>MAX_CHOICES?[]:all)});
}
export function courseContextForChoice(index,choice,upload,fingerprint=null){
 if(!indexes.has(index)||!choices.has(choice)||registries.get(index).byKey.get(choice.key)!==choice||!upload||typeof upload.sha256!=='string'||!HASH.test(upload.sha256)||!uint(upload.bytes,5*1024*1024)||!upload.bytes||typeof upload.filename!=='string'||!upload.filename||upload.filename.length>512)throw Error('Invalid uploaded course context choice');
 if(fingerprint!==null)classifyCourseFingerprint(index,fingerprint);
 const source=choice.sourceChoice?sourceForExactChoice(choice.sourceChoice):null,pin=source?registries.get(index).pinMap.get(source.id):null,matched=pin&&fingerprint?fingerprint.sha256===pin.fingerprintSha256&&['pointCount','segmentCount','trackCount','routeCount'].every(k=>pin[k]===fingerprint[k]):null;
 const context=Object.freeze({choiceKey:choice.key,event:choice.event,source,group:source?.officialGroup||choice.group||null,uploadedSha256:upload.sha256,uploadedBytes:upload.bytes,uploadedFilename:upload.filename,evidence:matched?'explicit_confirmed_numeric_course_match':'explicit_user_asserted_course_context',numericCourseMatch:matched,catalogSourceSha256:source?.sha256??null,fingerprint:matched?Object.freeze({...fingerprint}):null,factsImported:false});
 if(courseDateQualification(context))courseContextSnapshot(context);return context;
}
export function courseContextSnapshot(context){if(!context)return null;const date=courseDateQualification(context);let publishedTable=null;try{publishedTable=uploadedCoursePublishedTableSnapshot(context);}catch{/* Optional table failure cannot prevent ordinary context/export. */}const snapshot={schema:'uploaded-course-context/1',association:context.evidence,authenticity:'user_confirmed_context_not_original_source_identity',event_id:context.event.id,event_name:context.event.name,edition:context.event.year,group:context.group,course_id:context.source?.id??null,official_page:context.source?.officialPage||context.event.officialPage,catalog_original_sha256:context.catalogSourceSha256,uploaded_original_sha256:context.uploadedSha256,uploaded_original_bytes:context.uploadedBytes,uploaded_filename:context.uploadedFilename,numeric_course_match:context.numericCourseMatch,fingerprint:context.fingerprint,official_facts_imported:context.factsImported,...(publishedTable?{published_checkpoint_table:publishedTable}:{}),...(context.source?.editionEvidence?{edition_evidence:context.source.editionEvidence}:{}),...(context.source?.editionNote?{edition_note:context.source.editionNote}:{}),...(date?{source_date:date}:{})};if(JSON.stringify(snapshot).length>MAX_COURSE_CONTEXT_JSON)throw Error('賽事背景資料超過可回讀限制；請先保留目前路線。');return snapshot;}

export function courseChoicesForEvent(index,eventId){if(!indexes.has(index))throw Error('Invalid reviewed course context registry');return registries.get(index).byEvent.get(eventId)||Object.freeze([]);}
export function courseChoiceForKey(index,key){if(!indexes.has(index))throw Error('Invalid reviewed course context registry');return registries.get(index).byKey.get(key)||null;}
