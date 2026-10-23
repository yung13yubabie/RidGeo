/** Build-only projection of reviewed provider schemas; never resolves a browser sourceRef. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const REPOSITORY=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SOURCE='docs/contracts/INTERVALS-PROVIDER-SCHEMA.json';
const STRUCTURAL='docs/contracts/INTERVALS-STRUCTURAL-TYPES.d.ts';
const OUTPUT='public/intervals-provider-schema.mjs';
const SOURCE_SHA256='ccee8d2c89471b810dcfbca8649bd0b526db6ab74313bb9885062ecbe0654742';
const STRUCTURAL_SHA256='883be9b9ffc0e41cb60af66587b4887162c2de7fc6d95d3868bb2cf1c6fb6a9d';
const TYPES=Object.freeze({acceptedSelectionListResult:'SelectionListResult',acceptedImportResult:'ImportResult',acceptedObservedSnapshot:'ObservedProviderSnapshot',acceptedCoverageAssessment:'CoverageAssessment'});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const refuse=code=>{throw Object.assign(new Error(code),{code});};

function localFile(root,relative,{allowMissing=false}={}){
  root=path.resolve(root);
  if(fs.lstatSync(root).isSymbolicLink()||fs.realpathSync(root)!==root)refuse('provider_schema_symlink');
  let current=root;
  const parts=relative.split('/');
  for(let i=0;i<parts.length;i++){
    current=path.join(current,parts[i]);
    let stat;
    try{stat=fs.lstatSync(current);}catch(error){if(allowMissing&&i===parts.length-1&&error.code==='ENOENT')return current;throw error;}
    if(stat.isSymbolicLink())refuse('provider_schema_symlink');
    if(i<parts.length-1?!stat.isDirectory():!stat.isFile())refuse('provider_schema_not_regular');
  }
  return current;
}

export function deriveProviderSchema(root=REPOSITORY){
  const sourceBytes=fs.readFileSync(localFile(root,SOURCE));
  if(sha(sourceBytes)!==SOURCE_SHA256)refuse('provider_schema_source_hash');
  const schemas=JSON.parse(sourceBytes.toString('utf8'));
  const structuralBytes=fs.readFileSync(localFile(root,STRUCTURAL));
  if(sha(structuralBytes)!==STRUCTURAL_SHA256)refuse('provider_schema_structural_hash');
  const declarations=structuralBytes.toString('utf8');
  const pinned=Object.entries(schemas).filter(([,value])=>Object.hasOwn(value,'pinnedStructuralType'));
  if(pinned.length!==4)refuse('provider_schema_type_count');
  for(const[key,type]of Object.entries(TYPES)){
    const ref=schemas[key]?.pinnedStructuralType;
    if(!ref||Object.keys(ref).join(',')!=='sourceRef,type,sha256'||ref.sourceRef!=='intervals-history-provider/contracts-v2'||ref.type!==type||ref.sha256!==STRUCTURAL_SHA256)refuse('provider_schema_type_binding');
    if(!new RegExp('^export interface '+type+' \\{','m').test(declarations))refuse('provider_schema_type_missing');
  }
  // Retain the accepted generator's ASCII escaping, changing only provenance annotations.
  const serialized=JSON.stringify(schemas).replace(/[^\x00-\x7f]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
  const bytes=Buffer.from('export const PROVIDER_SCHEMAS='+serialized+';\n');
  return {bytes,source_sha256:SOURCE_SHA256,structural_sha256:STRUCTURAL_SHA256,output_sha256:sha(bytes),types:Object.values(TYPES)};
}

export function pinProviderSchema({root=REPOSITORY,check=false}={}){
  const result=deriveProviderSchema(root);
  const output=localFile(root,OUTPUT,{allowMissing:!check});
  if(check){if(!fs.readFileSync(output).equals(result.bytes))refuse('provider_schema_output_drift');}
  else{
    const staged=output+'.stage-'+randomUUID();
    try{fs.writeFileSync(staged,result.bytes,{flag:'wx'});fs.renameSync(staged,output);}finally{try{fs.unlinkSync(staged);}catch(error){if(error.code!=='ENOENT')throw error;}}
  }
  return {source_sha256:result.source_sha256,structural_sha256:result.structural_sha256,output_sha256:result.output_sha256,types:result.types,check};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);
  if(args.length>1||(args.length===1&&args[0]!=='--check'))refuse('provider_schema_invalid_option');
  console.log(JSON.stringify(pinProviderSchema({check:args[0]==='--check'})));
}
