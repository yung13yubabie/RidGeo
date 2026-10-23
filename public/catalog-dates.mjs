/** Reviewed catalogue dates only. No imported metadata, date inference or I/O. */
export const SOURCE_DATE_SCHEMA='catalog-source-date/1';
export const MAX_SOURCE_DATE_JSON=4096,MAX_COURSE_CONTEXT_JSON=8192;
const own=(v,k)=>Object.hasOwn(v,k),fail=()=>{throw Error('Invalid reviewed catalog date qualification');};
export const validCatalogDay=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/u.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
const dayInEdition=(value,edition)=>validCatalogDay(value)&&Number(value.slice(0,4))===edition;
const plain=value=>{if(!value||typeof value!=='object'||Array.isArray(value))return false;const p=Object.getPrototypeOf(value);return (p===Object.prototype||p===null)&&Reflect.ownKeys(value).every(k=>typeof k==='string'&&own(Object.getOwnPropertyDescriptor(value,k),'value'));};
const publicURL=value=>{if(typeof value!=='string'||value.length>2048)return false;try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
const strings=value=>Array.isArray(value)&&Reflect.ownKeys(value).length===value.length+1&&Array.from({length:value.length},(_,i)=>Object.getOwnPropertyDescriptor(value,String(i))).every(d=>d&&own(d,'value')&&typeof d.value==='string');
const timestamp=value=>{if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{3})?Z$/u.test(value))return false;const n=Date.parse(value);return Number.isFinite(n)&&new Date(n).toISOString()===(value.includes('.')?value:value.slice(0,-1)+'.000Z');};
function unknownQualification(record,scope,status,evidence){
 const edition=scope==='source'?record.edition:record.year;
 if(!plain(record)||!Number.isInteger(edition)||edition<2000||edition>2100||typeof record.id!=='string'||!/^[a-z0-9-]+$/u.test(record.id)||!['unverified','conflict'].includes(status)||!publicURL(record.officialPage)||!plain(evidence))fail();
 const keys=Object.keys(evidence);if(keys.length!==(own(evidence,'note')?5:4)||keys.some(k=>!['schema','sourceUrls','candidateDays','checkedAt','note'].includes(k))||evidence.schema!=='catalog-date-evidence/1'||!strings(evidence.sourceUrls)||evidence.sourceUrls.length<1||evidence.sourceUrls.length>10||!evidence.sourceUrls.every(publicURL)||new Set(evidence.sourceUrls).size!==evidence.sourceUrls.length||!evidence.sourceUrls.includes(record.officialPage)||!strings(evidence.candidateDays)||evidence.candidateDays.length>16||!evidence.candidateDays.every(day=>dayInEdition(day,edition))||new Set(evidence.candidateDays).size!==evidence.candidateDays.length||status==='conflict'&&evidence.candidateDays.length<2||status==='unverified'&&evidence.candidateDays.length>1||!timestamp(evidence.checkedAt)||own(evidence,'note')&&(typeof evidence.note!=='string'||evidence.note.length>500))fail();
 const snapshot={schema:evidence.schema,sourceUrls:[...evidence.sourceUrls],candidateDays:[...evidence.candidateDays],checkedAt:evidence.checkedAt,...(own(evidence,'note')?{note:evidence.note}:{})};
 const result={schema:SOURCE_DATE_SCHEMA,scope,record_id:record.id,edition,date:null,status,evidence:snapshot},json=JSON.stringify(result);
 if(json.length>MAX_SOURCE_DATE_JSON||new TextEncoder().encode(json).length>MAX_SOURCE_DATE_JSON)fail();
 Object.freeze(snapshot.sourceUrls);Object.freeze(snapshot.candidateDays);Object.freeze(snapshot);return Object.freeze(result);
}
export function validateSourceDate(source){
 if(!source||!Number.isInteger(source.edition)||source.edition<2000||source.edition>2100)fail();
 if(source.raceDate!==null){if(!dayInEdition(source.raceDate,source.edition)||own(source,'raceDateStatus')||source.raceDateEvidence?.schema==='catalog-date-evidence/1')fail();return null;}
 if(!own(source,'raceDate')||!own(source,'raceDateStatus')||!own(source,'raceDateEvidence')||!own(source,'startLocal')||source.startLocal!==null||!own(source,'finishCutoffLocal')||source.finishCutoffLocal!==null)fail();
 if(source.checkpoints!==undefined&&(!Array.isArray(source.checkpoints)||source.checkpoints.some(cp=>!cp||cp.cutoffLocal!==undefined&&cp.cutoffLocal!==null)))fail();
 return unknownQualification(source,'source',source.raceDateStatus,source.raceDateEvidence);
}
export function validateEventDates(event){
 if(!event||!Number.isInteger(event.year)||event.year<2000||event.year>2100||event.edition!==event.year)fail();
 if(event.dateStart!==null&&event.dateEnd!==null&&event.date!==null){if(!dayInEdition(event.dateStart,event.year)||!dayInEdition(event.dateEnd,event.year)||event.dateEnd<event.dateStart||own(event,'dateStatus')||event.dateEvidence?.schema==='catalog-date-evidence/1')fail();return null;}
 if(!['date','dateStart','dateEnd'].every(k=>own(event,k)&&event[k]===null)||!own(event,'dateStatus')||!own(event,'dateEvidence'))fail();
 return unknownQualification(event,'event',event.dateStatus,event.dateEvidence);
}
// Known owners keep their historical serialized shape. Only explicit unresolved
// fields invoke new validation here; full registry admission always validates.
export function sourceDateQualification(source){return source&&(source.raceDate===null||own(source,'raceDateStatus')||own(source,'raceDateEvidence'))?validateSourceDate(source):null;}
export function eventDateQualification(event){return event&&(event.date===null||event.dateStart===null||event.dateEnd===null||own(event,'dateStatus')||own(event,'dateEvidence'))?validateEventDates(event):null;}
export function courseDateQualification(context){return context?(context.source?sourceDateQualification(context.source):eventDateQualification(context.event)):null;}
