import {parseCpStopValue} from './cp-stop-seconds.mjs';
import {composeStationDwell,preflightClockData} from './station-clock-comparison.mjs';

/** Optional planning constraints, not service prescriptions or physiological data. */
export const SERVICE_REQUIREMENTS_VERSION='station-service-minimum/1';
const fail=message=>{throw Object.assign(new Error(message),{code:'invalid_service_requirement'});};
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join('|')===keys.slice().sort().join('|');
const label=x=>typeof x==='string'&&x.length>0&&x.length<=256;

export function projectServiceRequirements(records,stationRows){
  preflightClockData(records,{maxBytes:256*1024,maxNodes:20000});preflightClockData(stationRows,{maxBytes:256*1024,maxNodes:20000});
  if(!Array.isArray(records)||records.length>100||!Array.isArray(stationRows)||stationRows.length>101)fail('最低補給時間清單有誤。');
  const ids=new Set(stationRows.map(r=>r.id)),service=new Set(stationRows.filter(r=>r.kind==='service').map(r=>r.id)),seen=new Set();
  if(ids.size!==stationRows.length||stationRows.some(r=>!label(r.id)))fail('站點識別有誤。');
  return records.map(r=>{
    if(!exact(r,['id','minimumRaw','origin','provenance'])||!label(r.id)||seen.has(r.id)||!service.has(r.id))fail('最低補給時間站點重複或已變更。');
    seen.add(r.id);
    // Verified rules need separate source admission. Caller labels cannot grant it.
    if(r.origin!=='user_declared'||r.provenance!==null)fail('此處只接受自行設定的最低補給時間。');
    if(parseCpStopValue(r.minimumRaw).status==='invalid')fail('請確認最低補給時間。');
    return {id:r.id,minimumRaw:r.minimumRaw,origin:r.origin,provenance:null};
  }).sort((a,b)=>stationRows.findIndex(r=>r.id===a.id)-stationRows.findIndex(r=>r.id===b.id));
}

export function qualifyServiceRequirements(records,stations){
  preflightClockData(stations,{maxBytes:256*1024,maxNodes:20000});
  if(!Array.isArray(stations)||stations.some(r=>!exact(r,['id','kind','composition'])))fail('最低補給時間的停留依據有誤。');
  const projected=projectServiceRequirements(records,stations),byId=new Map(stations.map(r=>[r.id,r]));
  const rows=projected.map(r=>{
    const minimum=parseCpStopValue(r.minimumRaw),composition=composeStationDwell(byId.get(r.id).composition);
    if(composition.status==='invalid')fail('請確認補給與休息安排。');
    const status=minimum.status==='unknown'?'unknown_minimum':composition.status!=='known'?'unknown_dwell':minimum.seconds===0?'satisfied':composition.serviceS===null?'unknown_service_duration':composition.serviceS>=minimum.seconds?'satisfied':'violated';
    return {id:r.id,minimumRaw:r.minimumRaw,minimumS:minimum.seconds,serviceS:composition.status==='known'?composition.serviceS:null,totalDwellS:composition.status==='known'?composition.totalS:null,status};
  });
  const status=!rows.length?'not_declared':rows.some(r=>r.status==='violated')?'violated':rows.some(r=>r.status!=='satisfied')?'unknown':'satisfied_for_declared_service_times';
  return {version:SERVICE_REQUIREMENTS_VERSION,status,records:projected,rows,canApply:status==='not_declared'||status==='satisfied_for_declared_service_times',physiologicalFeasibilityIdentified:false};
}
