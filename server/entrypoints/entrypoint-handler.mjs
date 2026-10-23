import {protectAssetResponse} from '../asset-security/asset-security.mjs';
const definitions=Object.freeze({home:{source:'/index.html',type:'text/html; charset=utf-8'},notices:{source:'/notices/index.html',type:'text/html; charset=utf-8'},sqlite:{source:'/notices/SQLITE-COPYRIGHT.html',type:'text/html; charset=utf-8'},engine:{source:'/engine-worker.js',type:'text/javascript; charset=utf-8'}});
const canonical=Object.freeze({'/':'home','/notices/':'notices','/notices/SQLITE-COPYRIGHT':'sqlite','/engine-worker.js':'engine'});
const redirects=Object.freeze({'/index':'/','/index.html':'/','/notices':'/notices/','/notices/index':'/notices/','/notices/index.html':'/notices/','/notices/SQLITE-COPYRIGHT.html':'/notices/SQLITE-COPYRIGHT','/engine-worker.js/':'/engine-worker.js','/notices/SQLITE-COPYRIGHT/':'/notices/SQLITE-COPYRIGHT'});
export function createEntrypointHandler(contents, manifest){
 const entries={};for(const [key,def] of Object.entries(definitions)){const item=manifest.find(x=>x.path===def.source);if(!item||typeof contents[key]!=='string'||new TextEncoder().encode(contents[key]).length!==item.bytes||!/^[a-f0-9]{64}$/.test(item.sha256))throw Error('Invalid protected entrypoint');entries[key]={...def,text:contents[key],bytes:item.bytes,etag:'"sha256-'+item.sha256+'"'};}
 return function handleEntrypoint(request){
  const original=new URL(request.url).pathname;let path;try{path=decodeURIComponent(original).replace(/\/{2,}/g,'/');}catch{return null;}
  const redirect=Object.hasOwn(redirects,path)?redirects[path]:null;const key=Object.hasOwn(canonical,path)?canonical[path]:null;if(!redirect&&!key)return null;
  if(!['GET','HEAD'].includes(request.method))return protectAssetResponse(new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD','Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}}),request);
  if(redirect||path!==original)return protectAssetResponse(new Response(null,{status:307,headers:{Location:redirect||path}}),request);
  const entry=entries[key];const headers=new Headers({'Content-Type':entry.type,'ETag':entry.etag,'Cache-Control':'no-cache'});
  const matches=(request.headers.get('If-None-Match')||'').split(',').some(x=>x.trim()==='*'||x.trim().replace(/^W\//,'')===entry.etag);
  if(matches)return protectAssetResponse(new Response(null,{status:304,headers}),request);
  return protectAssetResponse(new Response(request.method==='HEAD'?null:entry.text,{status:200,headers}),request);
 };
}
