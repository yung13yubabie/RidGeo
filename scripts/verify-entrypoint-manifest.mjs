/** Fail closed when any fixed protected source changes without its manifest. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const paths=Object.freeze(['/index.html','/notices/index.html','/notices/SQLITE-COPYRIGHT.html','/engine-worker.js']);
export function verifyEntrypointManifest(root=process.cwd()){
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'server/entrypoints/manifest.json'),'utf8'));
  if(!Array.isArray(manifest)||manifest.length!==paths.length||new Set(manifest.map(row=>row?.path)).size!==paths.length||manifest.some(row=>!paths.includes(row?.path)))throw Error('Protected entrypoint manifest must contain the exact four fixed paths.');
  for(const row of manifest){
    if(Object.keys(row).sort().join(',')!=='bytes,path,sha256'||!Number.isSafeInteger(row.bytes)||row.bytes<1||typeof row.sha256!=='string'||!/^[a-f0-9]{64}$/u.test(row.sha256))throw Error('Invalid protected entrypoint manifest row.');
    const source=fs.readFileSync(path.join(root,'server/entrypoints',row.path.slice(1)));
    if(source.length!==row.bytes||crypto.createHash('sha256').update(source).digest('hex')!==row.sha256)throw Error(`Protected entrypoint manifest mismatch: ${row.path}`);
    if(fs.existsSync(path.join(root,'public',row.path.slice(1))))throw Error(`Protected entrypoint shadows a public asset: ${row.path}`);
  }
  return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  verifyEntrypointManifest();console.log('Protected entrypoint manifest gate passed.');
}
