/** Names only: never parses, translates, or rewrites original GPX bytes. */
export const MAX_GPX_FILENAME_BYTES=240;
const SITE_SUFFIX='_RidGEQ.gpx';
const REPAIR_SUFFIX='_修復版';
const reserved=/^(?:con|prn|aux|nul|conin\$|conout\$|clock\$|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i;
const encoder=new TextEncoder();
function cleanStem(value){
  if(typeof value!=='string')return '';
  // Keep valid Unicode (including Chinese and emoji); discard isolated surrogates.
  let text=Array.from(value,char=>{const n=char.codePointAt(0);return n>=0xd800&&n<=0xdfff?'':char;}).join('').normalize('NFC');
  text=text.replace(/[\u0000-\u001f\u007f-\u009f\u061c\u200b\ufeff\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,'')
    .replace(/[<>:"/\\|?*]/g,'_').trim().replace(/[. ]+$/g,'');
  // Remove only trailing GPX extensions and our own generated suffix, not identifiers.
  let before;do{before=text;text=text.replace(/(?:\.gpx)+$/i,'').replace(/(?:_RidGEQ)+$/i,'').trim().replace(/[. ]+$/g,'');}while(text!==before);
  text=text.replace(/^[. ]+/g,'').replace(/[. ]+$/g,'');
  if(!text||/^[\s._-]+$/u.test(text))return '';
  return reserved.test(text)?'_'+text:text;
}
function sourceFilename(source){
  // A Google opaque download ID is not a filename. Only a literal GPX URL basename qualifies.
  try{const url=new URL(source?.gpxUrl);if(url.protocol!=='https:'||url.username||url.password)return '';const leaf=decodeURIComponent(url.pathname.split('/').at(-1));return /\.gpx$/i.test(leaf)?leaf:'';}catch{return '';}
}
function sourceName(source){
  if(!source)return '';
  const name=typeof source.name==='string'?source.name:'';
  // Source is the current validated catalog entry. No automatic translation or added year.
  if(/\p{Script=Han}/u.test(name))return name;
  return sourceFilename(source)||name;
}
function bytePrefix(value,limit){let bytes=0,result='';for(const char of value){const size=encoder.encode(char).length;if(bytes+size>limit)break;result+=char;bytes+=size;}return result;}
export function checkpointGpxFilename({source=null,originalFileName='',details=null,repaired=false,surfaceReference=false}={}){
  // Catalog GPX titles can contain a previous edition or another distance. Until independently
  // verified against the current group, they never override a known source filename/catalog name.
  const candidates=source?[sourceName(source)]:[originalFileName,...(Array.isArray(details?.segments)?details.segments.map(s=>s?.name):[]),details?.metadata?.name];
  let stem=candidates.map(cleanStem).find(Boolean)||'路線';
  if(repaired)stem=stem.replace(/(?:_修復版)+$/u,'')||'路線';
  const suffix=(surfaceReference?'_地表參考':repaired?REPAIR_SUFFIX:'')+SITE_SUFFIX;
  stem=bytePrefix(stem,MAX_GPX_FILENAME_BYTES-encoder.encode(suffix).length).replace(/[. ]+$/g,'')||'路線';
  return stem+suffix;
}


/** Bare repaired route and checkpoint-enriched GPX are separate download types. */
export function derivedGpxFilename({source=null,originalFileName='',details=null,surfaceReference=false}={}){
  // Reuse the existing source selection and sanitization without changing its
  // original/enriched policies. Reserve the entire type marker before shortening.
  const generated=checkpointGpxFilename({source,originalFileName,details});
  let stem=generated.slice(0,-SITE_SUFFIX.length).replace(/(?:_修復版(?:_純路線)?)+$/u,'')||'路線';
  const suffix=(surfaceReference?'_地表參考':REPAIR_SUFFIX)+'_純路線'+SITE_SUFFIX;
  stem=bytePrefix(stem,MAX_GPX_FILENAME_BYTES-encoder.encode(suffix).length).replace(/[. ]+$/g,'')||'路線';
  return stem+suffix;
}

function safeOriginalFilename(value){
  if(typeof value!=='string')return '';
  // An actual safe basename retains its Unicode spelling and extension case. Unlike a
  // generated enriched name, an original download does not normalize or translate it.
  let name=Array.from(value,char=>{const n=char.codePointAt(0);return n>=0xd800&&n<=0xdfff?'':char;}).join('')
    .replace(/[\u0000-\u001f\u007f-\u009f\u061c\u200b\ufeff\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,'')
    .replace(/[<>:"/\\|?*]/g,'_').trim().replace(/[. ]+$/g,'');
  if(!name||/^[\s._-]+$/u.test(name)||/^(?:\.gpx)+$/i.test(name))return '';
  if(reserved.test(name))name='_'+name;
  // Reserve a known terminal GPX extension when shortening a long original basename.
  // No extension or title is extracted from opaque URL parameters.
  const extension=/\.gpx$/i.exec(name)?.[0]||'';
  const stem=extension?name.slice(0,-extension.length):name;
  let shortened=bytePrefix(stem,MAX_GPX_FILENAME_BYTES-encoder.encode(extension).length);
  if(!extension)shortened=shortened.replace(/[. ]+$/g,'');
  return shortened?shortened+extension:'';
}

export function originalGpxFilename({source=null,originalFileName='',details=null,preferUploadedName=false}={}){
  if(preferUploadedName===true){const uploaded=safeOriginalFilename(originalFileName);if(uploaded)return uploaded;}
  // A catalog source owns its name: a previous upload or an unverified XML title must
  // never rename it. A usable reviewed filename remains the first choice.
  const original=safeOriginalFilename(source?source.sourceFilename:originalFileName);
  if(original)return original;
  return checkpointGpxFilename({source,originalFileName:'',details});
}
