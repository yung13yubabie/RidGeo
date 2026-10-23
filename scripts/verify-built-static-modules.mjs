/** Verify the real generated Worker with its local asset binding. Not hosted evidence. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {Miniflare} from 'miniflare';
const root=process.cwd(),built=path.join(root,'dist/server'),client=path.join(root,'dist/client');
const config=JSON.parse(fs.readFileSync(path.join(built,'wrangler.json'),'utf8'));
assert.equal(config.assets.binding,'ASSETS');
assert.equal(config.assets.not_found_handling,'none','Static module gate requires missing assets to return 404');
assert.equal(config.assets.html_handling,undefined,'Review HTML handling before expanding the static gate');
assert.equal(path.resolve(built,config.assets.directory),client);
const files=directory=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(row=>{
  assert(!row.isSymbolicLink(),'Static module verification does not follow symlinks');
  const file=path.join(directory,row.name);return row.isDirectory()?files(file):[file];
});
const entry=path.join(built,config.main),modules=[entry,...files(built).filter(file=>file!==entry&&/\.m?js$/u.test(file))].map(file=>({type:'ESModule',path:file}));
const publicRoot=path.join(root,'public');
const expected=files(publicRoot).filter(file=>/\.m?js$/u.test(file)).map(file=>({file,relative:path.relative(publicRoot,file)}));
let outbound=0,passed=0;
const worker=new Miniflare({modules,modulesRoot:built,compatibilityDate:config.compatibility_date,
  compatibilityFlags:config.compatibility_flags,cf:false,
  assets:{directory:client,binding:'ASSETS',routerConfig:{has_user_worker:true,static_routing:{user_worker:config.assets.run_worker_first}},assetConfig:{not_found_handling:config.assets.not_found_handling}},
  outboundService:()=>{outbound++;return new Response('Outbound denied',{status:403});}});
try{
  for(const {file,relative} of expected){
    const disk=path.join(client,relative);assert(fs.existsSync(disk),'Missing built module '+relative);
    const source=fs.readFileSync(file);assert.deepEqual(fs.readFileSync(disk),source,'Build changed public module '+relative);
    const response=await worker.dispatchFetch(new URL('/'+relative.split(path.sep).map(encodeURIComponent).join('/'),'https://static.test'));
    assert.equal(response.status,200,'Static module HTTP '+relative);
    assert.match(response.headers.get('content-type')||'',/^(?:application|text)\/(?:javascript|ecmascript)(?:;|$)/i,'Static module MIME '+relative);
    const bytes=Buffer.from(await response.arrayBuffer());assert.deepEqual(bytes,source,'Static module bytes '+relative);passed++;
  }
  const missing=await worker.dispatchFetch('https://static.test/__nonexistent_module_verification__.mjs');assert.equal(missing.status,404);await missing.body?.cancel();
  assert.equal(outbound,0);
  console.log(JSON.stringify({passed,missingModuleStatus:404,outbound,scope:'Generated Worker plus local static-assets binding; not production deployment or browser execution',catalogDateSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(client,'catalog-dates.mjs'))).digest('hex')}));
}finally{await worker.dispose();}
