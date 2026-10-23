/** Read-only exact source/runtime closure. No Python, WASM, subprocess or network execution.
 * Public release gate: fixed contract SHA is anchored in reviewed verifier source.
 * A coordinated edit of the gate and contract is outside this local integrity check.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const CONTRACT_SHA = '1ebe9c06e4b1cda263003f59192b7d66a01133943c91ffb0c3c14634053e07cb';
const CONTRACT = 'checks/public-release/integrity.json';
const BUILD = 'ridgeq-314.0.7-cpython3.14.8-expat2.9.0-rebuild-r2';
const BASE = 'runtime/pyodide/' + BUILD + '/';
const OLD = 'runtime/pyodide/314.0.7/';
const PRIMARY = ['pyodide.mjs','pyodide.asm.mjs','pyodide.asm.wasm','python_stdlib.zip','pyodide-lock.json'];
const COMPANIONS = ['package.json','pyodide.js','pyodide.js.map','pyodide.mjs.map'];
const CAP = 256 * 1024 * 1024, MEMBERS = 8192, DEPTH = 48;
const hash = raw => crypto.createHash('sha256').update(raw).digest('hex');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const pin = row => object(row) && Object.keys(row).sort().join(',') === 'bytes,sha256' && Number.isSafeInteger(row.bytes) && row.bytes >= 0 && /^[a-f0-9]{64}$/u.test(row.sha256);
const safe = name => {assert(typeof name === 'string' && name.length > 0 && name.length <= 512 && !/[\\\x00-\x1f%?#:]/u.test(name) && !name.startsWith('/') && name.split('/').every(x => x && x !== '.' && x !== '..'), 'Unsafe relative path'); return name;};
function noLinks(file) {
  let next=path.resolve(file);
  for (;;) {const st=fs.lstatSync(next); assert(!st.isSymbolicLink(),'Symlink refused: '+next); const parent=path.dirname(next); if(parent===next) break; next=parent;}
}
const signature = st => [st.dev,st.ino,st.mode,st.size,st.mtimeMs,st.ctimeMs].join(':');
function read(file) {
  noLinks(file); const before=fs.lstatSync(file); assert(before.isFile() && before.size<=CAP,'Unexpected file/size: '+file);
  const fd=fs.openSync(file,fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {assert.equal(signature(fs.fstatSync(fd)),signature(before),'Changed before read'); const raw=fs.readFileSync(fd); assert.equal(signature(fs.fstatSync(fd)),signature(before),'Changed during read'); assert.equal(signature(fs.lstatSync(file)),signature(before),'Replaced during read'); assert.equal(raw.length,before.size); return raw;} finally {fs.closeSync(fd);}
}
function inventory(base) {
  noLinks(base); assert(fs.lstatSync(base).isDirectory(),'Inventory root is not a directory');
  const files={}, directories=[], names=new Set(); let members=0, bytes=0;
  function visit(dir,relative,depth) {
    assert(depth<=DEPTH,'Depth limit');
    for(const name of fs.readdirSync(dir).sort()) {
      const rel=safe(relative ? relative+'/'+name : name); assert(++members<=MEMBERS,'Member limit');
      assert(!names.has(rel.toLowerCase()),'Case-colliding member'); names.add(rel.toLowerCase());
      const file=path.join(dir,name); noLinks(file); const st=fs.lstatSync(file);
      assert(!['__pycache__','.pytest_cache','pytestcache'].includes(name.toLowerCase()) && !/\.(?:pyc|pyo)$/iu.test(name),'Generated cache');
      if(st.isDirectory()){directories.push(rel); visit(file,rel,depth+1);} else {assert(st.isFile(),'Special file'); const raw=read(file); bytes+=raw.length; assert(bytes<=CAP,'Aggregate byte limit'); files[rel]={bytes:raw.length,sha256:hash(raw)};}
    }
  }
  visit(base,'',0); return {files,directories};
}
function validateMap(map) {
  assert(object(map) && Object.keys(map).length<=MEMBERS,'Invalid finite pin map');
  const seen=new Set(); for(const [name,row] of Object.entries(map)){safe(name); assert(pin(row),'Invalid byte/SHA pin'); assert(!seen.has(name.toLowerCase()),'Contract case collision'); seen.add(name.toLowerCase());}
}
function sameInventory(actual,expected,label) {
  validateMap(expected); assert.deepEqual(actual.files,expected,label+' exact file closure');
  for(const dir of actual.directories) assert(Object.keys(expected).some(name=>name.startsWith(dir+'/')),label+' unexpected empty directory');
}
function checkFile(root,name,row) {safe(name);assert(pin(row),'Invalid pin'); const raw=read(path.join(root,name)); assert.equal(raw.length,row.bytes,name+' bytes'); assert.equal(hash(raw),row.sha256,name+' SHA256'); return raw;}
function json(raw) {return JSON.parse(raw.toString('utf8'));} // raw contract/manifest bytes are independently SHA-anchored before parsing
// BEGIN EXACT GENERATED CLIENT GRAPH
function validateGeneratedClientFiles(files, publicFiles, manifestText, entryText) {
  const fixed = {
    '.assetsignore': {bytes:30,sha256:'14ce8d5101f6d8f172242053466d44f5e2cd622dee81db53c14bd445c25d1942'},
    '_ssgManifest.js': {bytes:76,sha256:'653f3e53e89b4f8548ff86c19e92bb3c6b84b6be7485a320b1e00893ed877479'},
    '_buildManifest.js': {bytes:159,sha256:'47f02b34be6dc481257b6efce4c19e19111f37ef5c437f8ffed44f0da97fa9bb'}
  };
  assert.deepEqual(files['.assetsignore'],fixed['.assetsignore'],'Exact generated .assetsignore is mandatory');
  assert(typeof manifestText==='string' && manifestText.length<=1024*1024,'Finite Vite manifest');
  assert(typeof entryText==='string' && entryText.length<=512,'Finite client-entry manifest');
  const manifest=JSON.parse(manifestText), entry=JSON.parse(entryText);
  assert(object(manifest) && Object.keys(manifest).length===6,'Exactly six generated manifest entries');
  assert.equal(manifestText,JSON.stringify(manifest,null,2),'Canonical Vite JSON, no duplicate keys');
  const spec={
    framework:{imports:['rolldown-runtime']},
    'rolldown-runtime':{},
    'app-route-prefetch-policy':{key:'node_modules/vinext/dist/shims/internal/app-route-prefetch-policy.js',dynamic:true,imports:['index']},
    'layout-segment-context':{key:'node_modules/vinext/dist/shims/layout-segment-context.js',dynamic:true,imports:['rolldown-runtime','index','framework']},
    'streamed-icons':{key:'node_modules/vinext/dist/shims/streamed-icons.js',dynamic:true,imports:['rolldown-runtime','framework']},
    index:{key:'virtual:vinext-app-browser-entry',entry:true,imports:['rolldown-runtime','framework'],dynamicImports:['app-route-prefetch-policy','index','layout-segment-context','streamed-icons']}
  };
  const roles=new Map();
  for(const [key,row] of Object.entries(manifest)) {
    assert(object(row) && Object.hasOwn(spec,row.name) && !roles.has(row.name),'Unknown or duplicate chunk role');
    assert(typeof row.file==='string' && new RegExp('^_next/static/chunks/'+row.name+'-[A-Za-z0-9_-]{8}\\.js$','u').test(row.file),'Canonical generated chunk file');
    const role=spec[row.name],expectedKey=role.key||'_'+row.file.slice('_next/static/chunks/'.length);
    assert.equal(key,expectedKey,'Generated manifest key/role differs');roles.set(row.name,{key,row});
  }
  assert.deepEqual([...roles.keys()].sort(),Object.keys(spec).sort(),'Generated role closure');
  const allowed=new Set(['.assetsignore','.vite/manifest.json','vinext-client-entry-manifest.json']);
  for(const [name,{key,row}] of roles) {
    const role=spec[name],expected={file:row.file,name};
    if(role.key) expected.src=key;
    if(role.dynamic) expected.isDynamicEntry=true;
    if(role.entry) expected.isEntry=true;
    if(role.imports) expected.imports=role.imports.map(value=>roles.get(value).key);
    if(role.dynamicImports) expected.dynamicImports=role.dynamicImports.map(value=>roles.get(value).key);
    assert.deepEqual(row,expected,'Closed generated imports/dynamicImports and fields');
    assert(pin(files[row.file]) && files[row.file].bytes>0,'Generated manifest chunk missing');
    assert(!allowed.has(row.file),'Duplicate generated file');allowed.add(row.file);
  }
  const expectedEntry={appBrowserEntry:roles.get('index').row.file};
  assert.deepEqual(entry,expectedEntry,'Single designated client entry');
  assert.equal(entryText,JSON.stringify(expectedEntry,null,2)+'\n','Exact canonical client-entry metadata');
  assert(pin(files['vinext-client-entry-manifest.json']),'Missing client-entry metadata');
  const runtimeNames=Object.keys(files).filter(name=>name.startsWith('_next/') && !allowed.has(name));
  assert.equal(runtimeNames.length,2,'Exactly two remaining generated runtime manifests');
  let buildId=null;const seen=new Set();
  for(const name of runtimeNames) {
    const match=/^_next\/static\/([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12})\/(_ssgManifest\.js|_buildManifest\.js)$/u.exec(name);
    assert(match && !seen.has(match[2]),'Canonical single-UUID runtime manifest pair');
    if(buildId===null) buildId=match[1];else assert.equal(match[1],buildId,'Inconsistent generated build UUID');
    assert.deepEqual(files[name],fixed[match[2]],'Runtime manifest fixed bytes changed');
    seen.add(match[2]);allowed.add(name);
  }
  assert.equal(seen.size,2,'Both fixed runtime manifests required');
  for(const name of Object.keys(files)) if(!Object.hasOwn(publicFiles,name)) assert(allowed.has(name),'Unexpected built addition outside closed generated graph: '+name);
  return allowed;
}
// END EXACT GENERATED CLIENT GRAPH

export async function verifyRuntimeAssets(root,{distRoot=null}={}) {
  root=path.resolve(root); noLinks(root);
  const raw=read(path.join(root,CONTRACT)); assert.equal(hash(raw),CONTRACT_SHA,'Externally anchored integrity contract changed');
  const expected=json(raw);
  assert.equal(expected.schema,'ridgegeo-public-release-integrity/1'); assert.equal(expected.build_id,BUILD);
  validateMap(expected.public_files); validateMap(expected.critical_source_files);
  assert.deepEqual(expected.source_roots,['app','build','lib','server','scripts','checks'],'Reviewed source roots');
  assert.deepEqual(expected.source_exclusions,['checks/public-release/integrity.json','scripts/verify-runtime-assets.mjs','scripts/verify-built-runtime-assets.mjs'],'Only contract and its two anchors are excluded from self-pinning');
  assert.deepEqual(expected.source_root_files,['.openai/hosting.json','package.json','package-lock.json','vite.config.ts','next.config.ts','postcss.config.mjs','tsconfig.json','cloudflare-env.d.ts','.npmrc'],'Reviewed build/config roots');
  const sourcePaths=[...expected.source_root_files];
  for(const dir of expected.source_roots) for(const name of Object.keys(inventory(path.join(root,dir)).files)) sourcePaths.push(dir+'/'+name);
  assert.deepEqual(sourcePaths.filter(name=>!expected.source_exclusions.includes(name)).sort(),Object.keys(expected.critical_source_files).sort(),'Exact executable source/build/check closure');
  const source=inventory(path.join(root,'public')); sameInventory(source,expected.public_files,'Source public');
  for(const [name,row] of Object.entries(expected.critical_source_files)) checkFile(root,name,row);
  assert(Array.isArray(expected.protected_entrypoints) && expected.protected_entrypoints.length===4,'Protected entrypoint set');
  const protectedPaths=['/index.html','/engine-worker.js','/notices/index.html','/notices/SQLITE-COPYRIGHT.html'];
  assert.deepEqual(expected.protected_entrypoints.map(row=>row.path).sort(),protectedPaths.sort());
  assert.deepEqual(json(read(path.join(root,'server/entrypoints/manifest.json'))),expected.protected_entrypoints,'Protected manifest changed');
  const protectedTree=inventory(path.join(root,'server/entrypoints'));
  assert.deepEqual(Object.keys(protectedTree.files).sort(),expected.protected_source_paths.slice().sort(),'Protected source closed set');
  for(const row of expected.protected_entrypoints){const rel=row.path.slice(1);checkFile(root,'server/entrypoints/'+rel,{bytes:row.bytes,sha256:row.sha256});assert(!Object.hasOwn(source.files,rel),'Protected public shadow');}
  const apiFiles=expected.api_manifest_paths; assert(Array.isArray(apiFiles)&&apiFiles.length===4);
  for(const file of apiFiles) assert.equal(json(read(path.join(root,'public',safe(file)))).runtime_version,'314.0.7','Module API identity');
  assert.equal(expected.python_graph_members,67); assert.equal(expected.python_source_files,50);
  const python=Object.keys(source.files).filter(name=>name.startsWith('python/'));
  assert.equal(python.length,67);assert.equal(python.filter(name=>name.endsWith('.py')).length,50);
  assert.equal(source.files['app.js'].sha256,expected.selected_app_sha256,'Public application source identity');
  const runtime=json(read(path.join(root,'public/notices/runtime-assets-manifest.json')));
  assert.equal(runtime.schema,'ridgeq-runtime-assets/2');assert.equal(runtime.build_id,BUILD);assert.equal(runtime.base_url,'/'+BASE);
  assert.equal(runtime.version,'314.0.7');assert.equal(runtime.artifact_kind,'locally-compiled-derivative');
  assert.deepEqual(runtime.runtime_identity,{api:'314.0.7',python:'3.14.8',expat:'2.9.0',abi:'2026_0',emscripten:'5.0.3',arch:'wasm32',pointer_bytes:4});
  assert.deepEqual(Object.keys(runtime.primary_assets).sort(),PRIMARY.slice().sort());assert.deepEqual(Object.keys(runtime.public_companions).sort(),COMPANIONS.slice().sort());
  assert.equal(runtime.rollback.base_url,'/'+OLD);assert.deepEqual(Object.keys(runtime.rollback.primary_assets).sort(),PRIMARY.slice().sort());
  for(const [prefix,rows] of [[BASE,{...runtime.primary_assets,...runtime.public_companions}],[OLD,runtime.rollback.primary_assets]]) {
    assert.deepEqual(Object.keys(source.files).filter(name=>name.startsWith(prefix)).map(name=>name.slice(prefix.length)).sort(),Object.keys(rows).sort(),'Runtime closed set');
    for(const [name,row] of Object.entries(rows)) assert.deepEqual(source.files[prefix+safe(name)],row,'Pinned active/rollback asset');
  }
  const lock=json(read(path.join(root,'public',BASE,'pyodide-lock.json')));
  assert.deepEqual(lock,{info:{python:'3.14.8',abi_version:'2026_0',arch:'wasm32',platform:'emscripten_5_0_3'},packages:{},tool:{}},'Strict official empty-package lock schema');
  assert.equal(json(read(path.join(root,'public',BASE,'package.json'))).version,'314.0.7');
  const wasm=read(path.join(root,'public',BASE,'pyodide.asm.wasm'));assert(wasm.subarray(0,8).equals(Buffer.from([0,97,115,109,1,0,0,0])),'WASM header');
  for(const name of [...PRIMARY,...COMPANIONS].filter(name=>/\.m?js$/u.test(name))) {
    const code=read(path.join(root,'public',BASE,name)).toString('utf8');
    for(const match of code.matchAll(/[#@] sourceMappingURL=([^\s]+)/gu)){const ref=safe(match[1]);assert(Object.hasOwn(source.files,BASE+ref),'Missing bundled source map');}
  }
  if(distRoot!==null) {
    distRoot=path.resolve(distRoot);assert.equal(distRoot,path.join(root,'dist/client'),'Only local built client accepted');
    const built=inventory(distRoot);
    for(const [name,row] of Object.entries(expected.public_files)) assert.deepEqual(built.files[name],row,'Built public bytes changed: '+name);
    validateGeneratedClientFiles(built.files,expected.public_files,read(path.join(distRoot,'.vite/manifest.json')).toString('utf8'),read(path.join(distRoot,'vinext-client-entry-manifest.json')).toString('utf8'));
    for(const rel of protectedPaths) assert(!Object.hasOwn(built.files,rel.slice(1)),'Built protected shadow');
    for(const prefix of ['runtime/','python/','notices/']) assert.deepEqual(Object.keys(built.files).filter(name=>name.startsWith(prefix)).sort(),Object.keys(expected.public_files).filter(name=>name.startsWith(prefix)).sort(),'Built protected namespace differs');
  }
  // Whole-file pins, not searches for a strict-gate string, bind the actual engine/Worker path.
  sameInventory(inventory(path.join(root,'public')),expected.public_files,'Final source public');
  for(const [name,row] of Object.entries(expected.critical_source_files)) checkFile(root,name,row);
  return expected;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
    const args=process.argv.slice(2);assert(args.length<=1,'Usage: verify-runtime-assets.mjs [public|dist/client]');
    const selected=args[0]||'public';assert(['public','dist/client'].includes(selected),'Unsupported verifier target');
    await verifyRuntimeAssets(root,{distRoot:selected==='dist/client'?path.join(root,selected):null});
    console.log(JSON.stringify({status:'SOURCE_IDENTITY_PASS',build_id:BUILD,dist_checked:selected==='dist/client',runtime_executed:false}));
  } catch(error){console.error(JSON.stringify({status:'BLOCKED',reason:error.message,runtime_executed:false}));process.exitCode=2;}
}
