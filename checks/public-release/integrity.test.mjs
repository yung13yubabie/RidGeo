/** Synthetic negative tests of the public release integrity boundary. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyRuntimeAssets} from '../../scripts/verify-runtime-assets.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'ridgegeo-integrity-'));
const copy=path.join(temporary,'source');
assert(process.argv.slice(2).every(arg=>arg==='--built'),'Only --built is supported');
const built=process.argv.includes('--built');
try {
 fs.cpSync(root,copy,{recursive:true,filter:file=>!['node_modules','dist','.wrangler','.git','.vinext'].some(name=>path.relative(root,file).split(path.sep)[0]===name)});
 await verifyRuntimeAssets(copy);
 const cases=[
  ['contract byte tamper','checks/public-release/integrity.json'],
  ['public runtime byte tamper','public/runtime/pyodide/ridgeq-314.0.7-cpython3.14.8-expat2.9.0-rebuild-r2/pyodide.asm.wasm'],
  ['API implementation tamper','server/history-provider/core/server.mjs'],
  ['build routing tamper','vite.config.ts'],
  ['protected entrypoint tamper','server/entrypoints/engine-worker.js'],
 ];
 for(const [label,name] of cases){const file=path.join(copy,name),raw=fs.readFileSync(file);try{fs.appendFileSync(file,'\n');await assert.rejects(()=>verifyRuntimeAssets(copy),undefined,label);}finally{fs.writeFileSync(file,raw);}console.log('PASS rejects '+label);}
 for(const name of ['public/unreviewed.js','server/unreviewed.mjs','public/index.html']){const file=path.join(copy,name);try{fs.writeFileSync(file,'synthetic');await assert.rejects(()=>verifyRuntimeAssets(copy),undefined,name);}finally{fs.unlinkSync(file);}console.log('PASS rejects '+name);}
 const link=path.join(copy,'public/unreviewed-link');try{fs.symlinkSync('app.js',link);await assert.rejects(()=>verifyRuntimeAssets(copy),undefined,'symlink');}finally{fs.unlinkSync(link);}console.log('PASS rejects symlink');
 await verifyRuntimeAssets(copy);
 console.log('PASS public-release baseline plus 9 fail-closed negative cases');
 if(built){
  const distRoot=path.join(copy,'dist/client');
  fs.cpSync(path.join(root,'dist/client'),distRoot,{recursive:true});
  await verifyRuntimeAssets(copy,{distRoot});
  for(const name of ['assets/unreviewed.js','.vite/unreviewed.json']){
   const file=path.join(distRoot,name),parent=path.dirname(file),existed=fs.existsSync(parent);
   try{fs.mkdirSync(parent,{recursive:true});fs.writeFileSync(file,'synthetic');await assert.rejects(()=>verifyRuntimeAssets(copy,{distRoot}),undefined,name);}
   finally{fs.unlinkSync(file);if(!existed)fs.rmdirSync(parent);}console.log('PASS rejects generated '+name);
  }
  const manifest=JSON.parse(fs.readFileSync(path.join(distRoot,'.vite/manifest.json'),'utf8'));
  const chunk=path.join(distRoot,Object.values(manifest)[0].file),raw=fs.readFileSync(chunk);
  try{fs.unlinkSync(chunk);await assert.rejects(()=>verifyRuntimeAssets(copy,{distRoot}),undefined,'missing generated chunk');}finally{fs.writeFileSync(chunk,raw);}
  console.log('PASS rejects missing generated chunk');
  const metadata=path.join(distRoot,'vinext-client-entry-manifest.json'),original=fs.readFileSync(metadata);
  try{fs.writeFileSync(metadata,'{}');await assert.rejects(()=>verifyRuntimeAssets(copy,{distRoot}),undefined,'altered generated entry metadata');}finally{fs.writeFileSync(metadata,original);}
  console.log('PASS rejects altered generated entry metadata');
  await verifyRuntimeAssets(copy,{distRoot});
  console.log('PASS built public-release baseline plus 4 generated-graph negative cases');
 }

}finally{fs.rmSync(temporary,{recursive:true,force:true});}
