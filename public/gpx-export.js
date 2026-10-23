import {assertSafeGpxMarkup} from './gpx-xml-markup.mjs';
export {assertSafeGpxMarkup} from './gpx-xml-markup.mjs';
function xmlText(value){const text=String(value);for(const char of text){const n=char.codePointAt(0);if(!(n===9||n===10||n===13||(n>=32&&n<=0xd7ff)||(n>=0xe000&&n<=0xfffd)||(n>=0x10000&&n<=0x10ffff)))throw new Error('補給站或來源文字含 XML 不接受的控制字元。');}return text;}
// GPX coordinate/elevation fields are xs:decimal, which forbids exponent form.
// Expand the exact shortest JS number spelling without rounding the value.
function decimalText(value){
  const text=String(value);if(!/[eE]/.test(text))return text;
  const [mantissa,exponent]=text.toLowerCase().split('e'),negative=mantissa.startsWith('-'),unsigned=negative?mantissa.slice(1):mantissa,[integer,fraction='']=unsigned.split('.'),digits=integer+fraction,position=integer.length+Number(exponent);
  return (negative?'-':'')+(position<=0?'0.'+'0'.repeat(-position)+digits:position>=digits.length?digits+'0'.repeat(position-digits.length):digits.slice(0,position)+'.'+digits.slice(position));
}
const GPX_10='http://www.topografix.com/GPX/1/0';
const GPX_11='http://www.topografix.com/GPX/1/1';
const MAX_BYTES=5*1024*1024;
const EXT_NS='https://runart-trail-planner.brycelin.chatgpt.site/gpx/extensions/v1';
// XML ISO-8859-1 is byte-for-code-point, unlike WHATWG's Windows-1252 alias.
// CP1252's five undefined bytes are errors, matching strict source admission.
// Mapping: https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP1252.TXT
const CP1252_C1=[0x20ac,null,0x201a,0x0192,0x201e,0x2026,0x2020,0x2021,0x02c6,0x2030,0x0160,0x2039,0x0152,null,0x017d,null,null,0x2018,0x2019,0x201c,0x201d,0x2022,0x2013,0x2014,0x02dc,0x2122,0x0161,0x203a,0x0153,null,0x017e,0x0178];
const XML_ENCODINGS=new Set(['utf-8','utf8','utf-16','utf-16le','utf-16be','iso-8859-1','windows-1252']);
const declaredEncoding=text=>/^\s*<\?xml[^>]*encoding\s*=\s*["']([^"']+)["']/i.exec(text)?.[1]?.toLowerCase();
export function decodeGpxXml(bytes){
  if(!(bytes instanceof Uint8Array)||!bytes.length)throw new Error('沒有可匯出的原始 GPX。');
  if(bytes.length>MAX_BYTES)throw new Error('GPX 檔案超過 5 MiB 限制。');
  try{
    let encoding='utf-8',utf16=false;
    if((bytes[0]===0xff&&bytes[1]===0xfe)||([0x3c,0x20,0x09,0x0a,0x0d].includes(bytes[0])&&bytes[1]===0)){encoding='utf-16le';utf16=true;}
    else if((bytes[0]===0xfe&&bytes[1]===0xff)||(bytes[0]===0&&[0x3c,0x20,0x09,0x0a,0x0d].includes(bytes[1]))){encoding='utf-16be';utf16=true;}
    else{const end=bytes.indexOf(0x3e),head=new TextDecoder('utf-8').decode(bytes.subarray(0,end<0?bytes.length:end+1));encoding=declaredEncoding(head)||encoding;}
    if(!XML_ENCODINGS.has(encoding))throw Error('unsupported_encoding');
    let decoded;
    if(encoding==='iso-8859-1'||encoding==='windows-1252'){
      const chunks=[];const content=bytes[0]===0xef&&bytes[1]===0xbb&&bytes[2]===0xbf?bytes.subarray(3):bytes;for(let start=0;start<content.length;start+=8192){let chunk='';for(const byte of content.subarray(start,start+8192)){const code=encoding==='windows-1252'&&byte>=0x80&&byte<0xa0?CP1252_C1[byte-0x80]:byte;if(code===null)throw Error('invalid_cp1252_byte');chunk+=String.fromCharCode(code);}chunks.push(chunk);}decoded=chunks.join('');
    }else decoded=new TextDecoder(encoding,{fatal:true}).decode(bytes);
    const declared=declaredEncoding(decoded);if(declared&&(!XML_ENCODINGS.has(declared)||utf16&&declared!=='utf-16'&&declared!==encoding))throw Error('unsupported_encoding');
    return decoded;
  }catch{throw new Error('這份 GPX 的文字編碼暫時無法安全匯出。原檔仍可保留。');}
}
export function estimatedCoordinate(points,distanceM){
  if(!Array.isArray(points)||points.length<2||!Number.isFinite(distanceM))throw new Error('沒有可用的沿線位置。');
  if(!Number.isFinite(points[0].canonical_along_route_m)||!Number.isFinite(points.at(-1).canonical_along_route_m)||distanceM<points[0].canonical_along_route_m||distanceM>points.at(-1).canonical_along_route_m)throw new Error('補給站里程超出原始路線範圍。');
  let i=points.findIndex(p=>p.canonical_along_route_m>=distanceM);if(i<0)i=points.length-1;if(i===0)i=1;
  const a=points[i-1],b=points[i];if(!Number.isFinite(a.canonical_along_route_m)||!Number.isFinite(b.canonical_along_route_m))throw new Error('此路線無法推算補給站位置。');
  const span=b.canonical_along_route_m-a.canonical_along_route_m,f=span>0?Math.max(0,Math.min(1,(distanceM-a.canonical_along_route_m)/span)):0;
  const delta=((b.lon-a.lon+540)%360)-180;const lon=((a.lon+f*delta+540)%360)-180;return {lat:a.lat+(b.lat-a.lat)*f,lon,ele:Number.isFinite(a.ele)&&Number.isFinite(b.ele)?a.ele+(b.ele-a.ele)*f:null,method:'estimated_linear_between_source_points',source_point_indices:[a.source_point_index,b.source_point_index]};
}
// Export is downstream of the shared engine admission. Recheck the bounded
// source tree here too: DOM serialization must not launder rejected XML into a
// new apparently trusted source. This validates structure, not geometry/model
// eligibility, and never changes or repairs the input.
function validateExportTree(root,ns){
  const allowed={trk:'gpx/trk',trkseg:'gpx/trk/trkseg',trkpt:'gpx/trk/trkseg/trkpt',rte:'gpx/rte',rtept:'gpx/rte/rtept',wpt:'gpx/wpt'};
  let elements=0,totalText=0,points=0,segments=0,waypoints=0;
  const captured=new Map();
  const length=value=>[...value].length;
  const visit=(node,ancestors)=>{
    const path=[...ancestors,node],canonical=path.every(n=>(n.namespaceURI||'')===ns),key=path.map(n=>n.localName).join('/'),local=node.localName;
    if(++elements>250000||path.length>32||length((node.namespaceURI||'')+'}'+local)>512)throw new Error('GPX XML 節點或巢狀層數超過限制。');
    const attributes=[...node.attributes];if(attributes.length>32||attributes.some(a=>length(a.name)>512||length(a.value)>4096))throw new Error('GPX XML 屬性超過限制。');
    if((node.namespaceURI||'')===ns&&allowed[local]&&(!canonical||key!==allowed[local]))throw new Error('GPX 軌跡／路標節點的位置或命名空間有誤。');
    if((node.namespaceURI||'')===ns&&local==='ele'&&(!canonical||!['gpx/wpt/ele','gpx/trk/trkseg/trkpt/ele','gpx/rte/rtept/ele'].includes(key)))throw new Error('GPX 海拔欄位位置或命名空間有誤。');
    let limit=8192,scalar=false;
    if(canonical){
      if(['gpx/trk/trkseg','gpx/rte'].includes(key)&&++segments>2000)throw new Error('GPX 軌跡段超過限制。');
      if(['gpx/trk/trkseg/trkpt','gpx/rte/rtept','gpx/wpt'].includes(key)){
        if(local==='wpt'){if(++waypoints>200)throw new Error('GPX 路標超過限制。');}else if(++points>50000)throw new Error('GPX 軌跡點超過限制。');
        for(const [attribute,bound] of [['lat',90],['lon',180]]){const value=node.getAttribute(attribute);if(value===null||!value.trim()||!Number.isFinite(Number(value))||Math.abs(Number(value))>bound)throw new Error('GPX 座標不正確。');}
        const elevations=[...node.children].filter(n=>(n.namespaceURI||'')===ns&&n.localName==='ele');if(elevations.length>1)throw new Error('GPX 海拔欄位重複。');
      }
      if(local==='ele'){scalar=true;limit=128;const value=node.textContent;if(!value.trim()||!Number.isFinite(Number(value))||Number(value)<-1000||Number(value)>10000)throw new Error('GPX 海拔不正確。');}
      if((['name','desc'].includes(local)&&['gpx','gpx/metadata','gpx/wpt','gpx/trk','gpx/rte'].includes(key.slice(0,key.lastIndexOf('/'))))||['gpx/author','gpx/metadata/author/name'].includes(key)){scalar=true;limit=local==='desc'?4096:256;}
      if(['time','keywords'].includes(local)&&['gpx','gpx/metadata'].includes(key.slice(0,key.lastIndexOf('/')))){scalar=true;limit=local==='time'?128:1024;}
      if(scalar){const target=['gpx','gpx/metadata','gpx/author','gpx/metadata/author/name'].includes(key)||['gpx','gpx/metadata'].includes(key.slice(0,key.lastIndexOf('/')))?root:ancestors.at(-1);const field=['gpx/author','gpx/metadata/author/name'].includes(key)?'author':local;const fields=captured.get(target)||new Set();if(fields.has(field))throw new Error('GPX 名稱、說明與數值欄位重複。');fields.add(field);captured.set(target,fields);}
      if(scalar&&node.children.length)throw new Error('GPX 名稱、說明與數值欄位不能包含子節點。');
    }
    let directText=0;for(const child of node.childNodes){if(child.nodeType===7)throw new Error('GPX 不接受 XML 處理指令。');if(child.nodeType===3||child.nodeType===4){const n=length(child.nodeValue||'');totalText+=n;if(scalar||/\S/u.test(child.nodeValue||''))directText+=n;}}
    if(totalText>2*1024*1024||directText>limit)throw new Error('GPX XML 文字超過限制。');
    for(const child of node.children)visit(child,path);
  };
  visit(root,[]);if(points<2||!segments)throw new Error('GPX 至少需要兩個軌跡點。');
}
export function enrichGpx({originalBytes,checkpoints,provenance,DOMParserImpl=globalThis.DOMParser,XMLSerializerImpl=globalThis.XMLSerializer}){
  if(!Array.isArray(checkpoints)||checkpoints.length>100)throw new Error('補給站資料超過匯出限制。');
  const text=decodeGpxXml(originalBytes);assertSafeGpxMarkup(text);
  const document=new DOMParserImpl().parseFromString(text,'application/xml');if(document.doctype||document.getElementsByTagName('parsererror').length)throw new Error('原始 GPX 無法安全解析。');
  const root=document.documentElement,ns=root.namespaceURI||'';if(root.localName!=='gpx'||!['','http://www.topografix.com/GPX/1/0','http://www.topografix.com/GPX/1/1'].includes(ns))throw new Error('不是支援的 GPX 格式。');
  if((root.getAttribute('creator')||'').length>512)throw new Error('GPX creator 欄位超過限制。');
  const version=root.getAttribute('version'),versionPresent=[...root.attributes].some(a=>a.name==='version');
  if(!((ns===GPX_11&&version==='1.1')||(ns===GPX_10&&(!versionPresent||version==='1.0'))))throw new Error('含補給站匯出支援原生 GPX 1.0／1.1；這份檔案請使用「下載原始 GPX」。');
  validateExportTree(root,ns);
  const existing=[...root.children].filter(n=>n.localName==='wpt'&&(n.namespaceURI||'')===ns);if(existing.length+checkpoints.length>200)throw new Error('匯出後航點超過 200 個，請減少補給站再試。');
  const make=(name,value)=>{const el=document.createElementNS(ns,name);el.textContent=xmlText(value);return el;};
  const extField=(parent,name,value)=>{if(value===null||value===undefined||value==='')return;const el=document.createElementNS(EXT_NS,`ra:${name}`);el.textContent=xmlText(typeof value==='object'?JSON.stringify(value):value);parent.appendChild(el);};
  // GPX 1.0 uses ##other at root/waypoint tails, not a GPX extensions element.
  const extensionContainer=()=>ns===GPX_10?document.createElementNS(EXT_NS,'ra:extensions'):document.createElementNS(ns,'extensions');
  const insertBefore=[...root.children].find(n=>(n.namespaceURI||'')===ns&&['rte','trk','extensions'].includes(n.localName)||(ns===GPX_10&&(n.namespaceURI||'')!==ns))||null;
  const seenOccurrences=new Set();
  for(const cp of checkpoints){
    if(cp.checkpoint_occurrence_id!==undefined&&cp.checkpoint_occurrence_id!==null){if(typeof cp.checkpoint_occurrence_id!=='string'||!cp.checkpoint_occurrence_id||cp.checkpoint_occurrence_id.length>256||seenOccurrences.has(cp.checkpoint_occurrence_id))throw new Error('補給站身分重複或不正確。');seenOccurrences.add(cp.checkpoint_occurrence_id);} 
    if(!Number.isFinite(cp.lat)||!Number.isFinite(cp.lon)||(cp.ele!==null&&cp.ele!==undefined&&!Number.isFinite(cp.ele))||Math.abs(cp.lat)>90||Math.abs(cp.lon)>180||(ns===GPX_11&&cp.lon===180)||typeof cp.name!=='string'||cp.name.length>200)throw new Error('補給站名稱或座標不正確。');
    const wpt=document.createElementNS(ns,'wpt');wpt.setAttribute('lat',decimalText(cp.lat));wpt.setAttribute('lon',decimalText(cp.lon));if(Number.isFinite(cp.ele))wpt.appendChild(make('ele',decimalText(cp.ele))); wpt.appendChild(make('name',cp.name));
    const ex=extensionContainer();extField(ex,'checkpoint_record_version','1');extField(ex,'export_generation_id',provenance?.source_sha256);extField(ex,'source_geometry_sha256',provenance?.source_geometry_sha256);for(const key of ['checkpoint_occurrence_id','parent_checkpoint_occurrence_id','imported_source_claims','source_waypoint_identity','source_waypoint_index','source_waypoint_origin_sha256','source_waypoint_name','source_waypoint_lat','source_waypoint_lon','source_waypoint_elevation_m','source_waypoint_selected_passage_m','source_checkpoint_id','source_station_id','source_map_feature_id','source_checked_at','original_gpx_sha256','mapping_gpx_sha256','source_kind','source_url','edition','official_distance_m','canonical_distance_m','coordinate_method','source_point_index','source_point_indices','mapping_choice','stop_s','cutoff_elapsed_s','cutoff_local','cutoff_kind','official_cutoff_reported','official_cutoff_kind','official_cutoff_reference','cutoff_time_user_edited','cutoff_kind_user_confirmed'])extField(ex,key,cp[key]);wpt.appendChild(ex);root.insertBefore(wpt,insertBefore);
  }
  let ex=ns===GPX_10?null:[...root.children].find(n=>n.localName==='extensions'&&(n.namespaceURI||'')===ns);if(!ex){ex=extensionContainer();root.appendChild(ex);}
  const reservedFields=new Set(['source_namespace','source_version_attribute','output_namespace','output_version_attribute','native_format_preserved','export_kind','route_points_preserved','checkpoint_record_version','export_generation_id','native_waypoint_count','added_checkpoint_count']);
  const p=document.createElementNS(EXT_NS,'ra:provenance');for(const [key,value] of Object.entries(provenance||{})){if(!/^[a-z][a-z0-9_]*$/.test(key)||reservedFields.has(key))throw new Error('來源欄位不正確。');extField(p,key,value);}extField(p,'checkpoint_record_version','1');extField(p,'export_generation_id',provenance?.source_sha256);extField(p,'native_waypoint_count',existing.length);extField(p,'added_checkpoint_count',checkpoints.length);extField(p,'source_namespace',ns);extField(p,'source_version_attribute',versionPresent?version:'absent');extField(p,'output_namespace',ns);extField(p,'output_version_attribute',versionPresent?version:'absent');extField(p,'native_format_preserved',true);extField(p,'export_kind','derived_checkpoint_gpx');extField(p,'route_points_preserved',true);ex.appendChild(p);
  const output='<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializerImpl().serializeToString(root);
  if(new TextEncoder().encode(output).length>MAX_BYTES)throw new Error('含補給站 GPX 超過 5 MiB 限制，請減少資料後再試。');
  validateExportTree(root,ns);return output;
}
