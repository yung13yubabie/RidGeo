/** Execute the complete generated Worker in Wrangler's pinned workerd simulator. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {Miniflare} from 'miniflare';
import {verifyEntrypointManifest} from './verify-entrypoint-manifest.mjs';
import {CONTENT_SECURITY_POLICY} from '../server/asset-security/asset-security.mjs';

const root=process.cwd(),manifest=verifyEntrypointManifest(root),built=path.join(root,'dist/server');
const config=JSON.parse(fs.readFileSync(path.join(built,'wrangler.json'),'utf8'));
assert.equal(config.main,'index.js');
assert.equal(config.assets.binding,'ASSETS');
assert.deepEqual(config.assets.run_worker_first,['/api/routes/*']);
const scan=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(row=>{
  assert(!row.isSymbolicLink(),'Built Worker modules cannot be symlinks.');
  const file=path.join(dir,row.name);return row.isDirectory()?scan(file):/\.m?js$/u.test(row.name)?[file]:[];
});
const entry=path.resolve(built,config.main),modules=[entry,...scan(built).filter(file=>file!==entry)].map(file=>({type:'ESModule',path:file}));
// Explicit modules preserve the actual generated dynamic-import module set.
// No stubbed source handler, mocked Worker or external service is used.
let outboundCalls=0;
const worker=new Miniflare({modules,modulesRoot:built,compatibilityDate:config.compatibility_date,compatibilityFlags:config.compatibility_flags,cf:false,outboundService:()=>{outboundCalls++;return new Response('Outbound denied in build verification',{status:403});}});
const secure=response=>{
  assert.equal(response.headers.get('content-security-policy'),CONTENT_SECURITY_POLICY);
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  assert.equal(response.headers.get('referrer-policy'),'no-referrer');
};
let checks=0;
try{
  for(const row of manifest){
    const endpoint=row.path==='/index.html'?'/':row.path==='/notices/index.html'?'/notices/':row.path==='/notices/SQLITE-COPYRIGHT.html'?'/notices/SQLITE-COPYRIGHT':row.path;
    assert(!fs.existsSync(path.join(root,'dist/client',row.path.slice(1))),'Protected entrypoint cannot have a public asset shadow.');
    const get=await worker.dispatchFetch(new URL(endpoint,'https://worker.test/'));assert.equal(get.status,200);secure(get);
    const bytes=Buffer.from(await get.arrayBuffer());assert.equal(bytes.length,row.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),row.sha256);assert.equal(get.headers.get('etag'),`"sha256-${row.sha256}"`);checks++;
    const head=await worker.dispatchFetch(new URL(endpoint,'https://worker.test/'),{method:'HEAD'});assert.equal(head.status,200);secure(head);assert.equal((await head.arrayBuffer()).byteLength,0);checks++;
    const cached=await worker.dispatchFetch(new URL(endpoint,'https://worker.test/'),{headers:{'If-None-Match':get.headers.get('etag')}});assert.equal(cached.status,304);secure(cached);assert.equal((await cached.arrayBuffer()).byteLength,0);checks++;
    const post=await worker.dispatchFetch(new URL(endpoint,'https://worker.test/'),{method:'POST'});assert.equal(post.status,405);secure(post);assert.equal(post.headers.get('allow'),'GET, HEAD');await post.body?.cancel();checks++;
  }
  for(const [from,to] of [['/index.html','/'],['/notices/index.html','/notices/'],['/notices/SQLITE-COPYRIGHT.html','/notices/SQLITE-COPYRIGHT'],['/engine-worker.js/','/engine-worker.js'],['/%65ngine-worker.js','/engine-worker.js']]){
    const response=await worker.dispatchFetch(new URL(from,'https://worker.test/'),{redirect:'manual'});assert.equal(response.status,307);secure(response);assert.equal(response.headers.get('location'),to);await response.body?.cancel();checks++;
  }
  assert.equal(outboundCalls,0,'Protected-entrypoint startup/checks must not contact an external service.');
  console.log(`Built Worker initialization and ${checks} protected-entrypoint runtime checks passed; no outbound requests.`);
}finally{await worker.dispose();}
