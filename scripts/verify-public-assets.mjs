/** Reject generated caches before/after a build. Never deletes or rewrites files. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const cacheName=name=>['__pycache__','.pytest_cache','pytestcache'].includes(name.toLowerCase())||/\.(?:pyc|pyo)$/i.test(name);
export function verifyPublicAssets(directories){
 const violations=[];
 const scan=directory=>{
  for(const item of fs.readdirSync(directory,{withFileTypes:true})){
   const entry=path.join(directory,item.name);
   if(cacheName(item.name)){violations.push(entry);continue;}
   if(item.isSymbolicLink()){violations.push(entry+' (symlink)');continue;}
   if(item.isDirectory())scan(entry);
  }
 };
 for(const directory of directories){if(!fs.statSync(directory).isDirectory())throw new Error('Expected public asset directory: '+directory);scan(directory);}
 if(violations.length)throw new Error('Unapproved generated cache or link in public assets:\n'+violations.join('\n'));
 return {directories:directories.length,generatedCaches:0};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const directories=process.argv.slice(2);if(!directories.length)throw new Error('Provide public asset directories to verify.');
 verifyPublicAssets(directories);console.log('Public asset cache gate passed.');
}
