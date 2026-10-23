/** Trusted catalog identities only. No XML, filename inference, URL fetch or geometry guess. */
import {validateSourceDate} from './catalog-dates.mjs';
export const MAX_EXACT_SOURCE_CHOICES=40;
const HASH=/^[a-f0-9]{64}$/u,ID=/^[a-z0-9-]+$/u,MAX_BYTES=5*1024*1024;
const indexes=new WeakSet(),choices=new WeakSet();
const validDay=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/u.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
const validLocal=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/u.test(value)&&validDay(value.slice(0,10));
const fail=()=>{throw new Error('Invalid reviewed source identity registry');};
const reviewedDate=source=>{try{validateSourceDate(source);return true;}catch{return false;}};
const publicURL=value=>{try{const u=new URL(value);return typeof value==='string'&&u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
export function createSourceIdentityIndex(sources){
  if(!Array.isArray(sources)||sources.length>2000)fail();
  const index=Object.create(null),ids=new Set();
  for(const source of sources){
    if(!source||typeof source.id!=='string'||!ID.test(source.id)||ids.has(source.id)||typeof source.name!=='string'||!source.name||source.name.length>1000||typeof source.sha256!=='string'||!HASH.test(source.sha256)||!Number.isSafeInteger(source.bytes)||source.bytes<1||source.bytes>MAX_BYTES||!Number.isInteger(source.edition)||source.edition<2000||source.edition>2100||!reviewedDate(source)||!publicURL(source.officialPage)||!publicURL(source.gpxUrl))fail();
    ids.add(source.id);
    const variants=source.officialCategoryVariants;
    if(variants!==undefined&&(!Array.isArray(variants)||!variants.length||variants.length>40))fail();
    const entries=Array.from(variants||[null]).map((variant,variantIndex)=>{
      if(variants!==undefined&&(!variant||typeof variant!=='object'||Array.isArray(variant)))fail();
      if(variant&&(typeof variant.group!=='string'||!variant.group||variant.group.length>200||!Number.isFinite(variant.limitHours)||variant.limitHours<=0||(source.raceDate===null?(!Object.hasOwn(variant,'startLocal')||variant.startLocal!==null||!Object.hasOwn(variant,'finishCutoffLocal')||variant.finishCutoffLocal!==null):(!validLocal(variant.startLocal)||variant.startLocal.slice(0,10)!==source.raceDate))))fail();
      const key=source.id+(variant?':category:'+variantIndex:'');
      const entry=Object.freeze({key,source,variantIndex:variant?variantIndex:null,label:source.name+' · '+source.edition+(variant?' · '+variant.group:'')});choices.add(entry);return entry;
    });
    (index[source.sha256]??=[]).push(...entries);
  }
  for(const hash of Object.keys(index))Object.freeze(index[hash]);
  Object.freeze(index);indexes.add(index);return index;
}
export function classifyExactUpload(index,hash,bytes){
  if(!index||!indexes.has(index)||typeof hash!=='string'||!HASH.test(hash)||!Number.isSafeInteger(bytes)||bytes<1||bytes>MAX_BYTES)throw new Error('Invalid uploaded original identity');
  const all=Object.hasOwn(index,hash)?index[hash].filter(c=>c.source.bytes===bytes):[];
  const status=all.length===0?'unmatched':all.length===1?'unique':all.length>MAX_EXACT_SOURCE_CHOICES?'too_many':'choose';
  return Object.freeze({status,sha256:hash,bytes,totalChoices:all.length,choices:Object.freeze(status==='too_many'?[]:[...all])});
}
export function sourceForExactChoice(choice){
  if(!choice||!choices.has(choice))throw new Error('Invalid exact source choice');
  if(choice.variantIndex===null)return choice.source;
  const v=choice.source.officialCategoryVariants?.[choice.variantIndex];
  if(!v||choice.key!==choice.source.id+':category:'+choice.variantIndex)throw new Error('Invalid exact category choice');
  return Object.freeze({...choice.source,name:choice.source.name+' · '+v.group,officialGroup:v.group,startLocal:v.startLocal,officialMaxHours:v.limitHours,finishCutoffLocal:v.finishCutoffLocal??null,selectedOfficialCategory:Object.freeze({index:choice.variantIndex,...v})});
}
