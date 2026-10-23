/** Detached mechanical input only. No live A getter, C owner, fitting or production pack. */
import {preflightClockData,composeStationDwell,clockContentKey} from './station-clock-comparison.mjs';
import {validateCompositeClock,assertOriginalMovingReference,projectManualLocks} from './manual-station-clock.mjs';
import {qualifyServiceRequirements} from './station-service-requirements.mjs';
export const FORWARD_INPUT_VERSION='conditional-forward-input/1';
const exact=(x,k)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join('|')===k.slice().sort().join('|');
const clone=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>clockContentKey(a)===clockContentKey(b),hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/u.test(x),label=x=>typeof x==='string'&&x.length>0&&x.length<=256;
const assert=(v,m)=>{if(!v)throw Object.assign(new Error(m),{code:'invalid_conditional_forward_input'});};
function selection(value){
 assert(exact(value,['packId','reviewGeneration','artifactSha256','scaleStrategy','anchorId','anchorRevision'])&&[value.packId,value.reviewGeneration].every(label)&&hash(value.artifactSha256)&&['explicit_scale','independent_anchor'].includes(value.scaleStrategy),'Exact selected pack/review/artifact identity required.');
 assert(value.scaleStrategy==='independent_anchor'?[value.anchorId,value.anchorRevision].every(label):value.anchorId===null&&value.anchorRevision===null,'Selected scale strategy and anchor identity differ.');
}
function boundedLimits(limits){
 assert(exact(limits,['max_work','max_primitive_events','max_primitive_pieces','max_wall_s','max_response_bytes'])&&['max_work','max_primitive_events','max_primitive_pieces'].every(k=>Number.isSafeInteger(limits[k])&&limits[k]>0&&limits[k]<=({max_work:10000000,max_primitive_events:100000,max_primitive_pieces:300000}[k]))&&Number.isFinite(limits.max_wall_s)&&limits.max_wall_s>0&&limits.max_wall_s<=120&&Number.isSafeInteger(limits.max_response_bytes)&&limits.max_response_bytes>0&&limits.max_response_bytes<=8*1024*1024,'Existing bounded limits required.');
}
function proposedShape(value){
 assert(exact(value,['locks','stationPatch'])&&Array.isArray(value.locks)&&value.locks.length<=256&&exact(value.stationPatch,['entries'])&&Array.isArray(value.stationPatch.entries)&&value.stationPatch.entries.length<=100,'Closed bounded proposed controls required.');
 const locks=new Set(),children=new Set(),stations=new Set();
 for(const row of value.locks){
  assert(exact(row,['id','child_ids','moving_pace_s_per_km','allocation'])&&label(row.id)&&!locks.has(row.id)&&Array.isArray(row.child_ids)&&row.child_ids.length>0&&row.child_ids.length<=1500&&Number.isFinite(row.moving_pace_s_per_km)&&row.moving_pace_s_per_km>0&&row.allocation==='preserve_baseline_cost_shape','Closed prescribed lock required.');locks.add(row.id);
  for(const id of row.child_ids){assert(label(id)&&!children.has(id),'Prescribed raw children must be unique and disjoint.');children.add(id);}
 }
 for(const row of value.stationPatch.entries){
  assert(exact(row,['id','composition'])&&label(row.id)&&!stations.has(row.id),'Closed unique station declaration required.');stations.add(row.id);
  const c=composeStationDwell(row.composition);
  assert(c.status==='known'&&(['sequential','contains'].includes(row.composition.mode)||row.composition.mode==='total'&&c.totalS===0),'Complete supported service/rest composition required.');
 }
}
/** Local shape admission only. It cannot qualify an artifact or call a provider. */
export function validateConditionalForwardReadRequest(value){
 preflightClockData(value,{maxBytes:256*1024,maxNodes:20000});
 assert(exact(value,['bundleIds','context','limits','proposed','selection']),'Closed forward read request required.');
 selection(value.selection);boundedLimits(value.limits);proposedShape(value.proposed);
 assert(exact(value.context,['exercise_mode','gait','surface','technicality','environment_label'])&&Object.values(value.context).every(label),'Complete explicit route context required.');
 const bundles=value.bundleIds;
 assert(bundles&&typeof bundles==='object'&&!Array.isArray(bundles)&&Object.keys(bundles).length<=100&&Object.entries(bundles).every(([id,bundle])=>label(id)&&label(bundle)),'Closed bounded service bundle identities required.');
 return true;
}
function convert(rows,patch,requirements){
 assert(exact(patch,['entries'])&&Array.isArray(patch.entries)&&patch.entries.length<=100,'Explicit station patch required.');
 const changed=new Map();for(const p of patch.entries){assert(exact(p,['id','composition'])&&label(p.id)&&rows.some(r=>r.id===p.id)&&!changed.has(p.id),'Station patch occurrence mismatch.');changed.set(p.id,p.composition);}
 const all=rows.map(r=>({...r,composition:changed.get(r.id)??r.composition}));
 const q=qualifyServiceRequirements(requirements,all.map(r=>({id:r.id,kind:r.kind,composition:r.composition})));assert(q.canApply,'Service minimum is unknown or violated.');
 const stations=all.map(r=>{const c=composeStationDwell(r.composition);assert(c.status==='known','Complete dwell required.');
  if(r.kind!=='service'){assert(c.totalS===0,'Timing/finish dwell must remain zero.');return{id:r.id,name:r.name,distance_m:r.distanceM,kind:r.kind,service:null,rest_s:0,composition:'none',bundle_id:null,cutoff:r.cutoff};}
  assert(['sequential','contains'].includes(r.composition.mode),'C exposure composition unsupported; retain current A.');
  return{id:r.id,name:r.name,distance_m:r.distanceM,kind:r.kind,service:{duration_s:c.serviceS,tasks:null},rest_s:r.composition.mode==='contains'?c.totalS:c.restS,composition:r.composition.mode==='contains'?'rest_contains_all_service':'sequential_service_then_rest',bundle_id:r.bundleId,cutoff:r.cutoff};});
 return{stations,declarations:all.map(r=>({id:r.id,composition:clone(r.composition)})),requirements:q};
}
/** Current-route bookkeeping admission before a resolver/preparation can run. */
export function qualifyConditionalForwardControls({plan,rawSections:raw,proposed:p,bundleIds}){
 preflightClockData({plan,raw,p,bundleIds},{maxBytes:16*1024*1024,maxNodes:500000});proposedShape(p);
 assert(Array.isArray(raw)&&raw.length>0&&raw.length<=1500&&Array.isArray(plan?.geometry_snapshot)&&plan.geometry_snapshot.length*2<=15000&&Array.isArray(plan.station_clock?.stations)&&plan.station_clock.stations.length===plan.checkpoints?.length,'Complete bounded current route/station allocation required.');
 let end=0;const rawIds=new Set();for(const row of raw){assert(exact(row,['id','start_m','end_m'])&&label(row.id)&&!rawIds.has(row.id)&&row.start_m===end&&Number.isFinite(row.end_m)&&row.end_m>row.start_m,'Exact contiguous current raw-section identities required.');rawIds.add(row.id);end=row.end_m;}
 assert(end===plan.route?.distance_m,'Raw-section route coverage differs.');
 const locks=projectManualLocks(p.locks),covered=new Set();
 for(const lock of locks){const indices=lock.child_ids.map(id=>raw.findIndex(r=>r.id===id));assert(indices.every((v,i)=>v>=0&&v===indices[0]+i&&!covered.has(v)),'Lock children must be current, contiguous and disjoint.');const start=raw[indices[0]].start_m,finish=raw[indices.at(-1)].end_m;assert(lock.moving_pace_s_per_km*(finish-start)/1000<=604800&&!plan.checkpoints.some(cp=>start<cp.distance_m&&cp.distance_m<finish),'Lock crosses CP or exceeds inherited clock support.');indices.forEach(v=>covered.add(v));}
 assert(bundleIds&&typeof bundleIds==='object'&&!Array.isArray(bundleIds)&&Object.keys(bundleIds).length<=100,'Explicit bounded service bundle map required.');
 const rows=plan.station_clock.stations.map((r,i)=>({id:r.id,name:r.name,distanceM:r.distanceM,kind:r.kind,composition:clone(r.composition.declaration),bundleId:Object.hasOwn(bundleIds,r.id)?bundleIds[r.id]:null,cutoff:plan.checkpoints[i].cutoff_elapsed_s===null?null:{kind:plan.checkpoints[i].cutoff_kind,elapsed_s:plan.checkpoints[i].cutoff_elapsed_s}}));
 assert(Object.keys(bundleIds).every(id=>rows.some(r=>r.id===id&&r.kind==='service'))&&Object.values(bundleIds).every(label),'Exact service bundle declarations required.');
 const requirements=plan.service_requirements?.records??[],baseline=convert(rows,{entries:[]},requirements),proposed=convert(rows,p.stationPatch,requirements);
 return {locks,baseline,proposed};
}
export function createConditionalForwardInput(value){
 preflightClockData(value,{maxBytes:16*1024*1024,maxNodes:500000});
 assert(exact(value,['fixedSource','current','proposed','context','qualification','lifetime','limits']),'Closed detached input required.');
 const {fixedSource:f,current:c,proposed:p,qualification:q,lifetime:l,limits}=value;
 assert(exact(f,['request','prepared'])&&exact(f.request,['gpx_b64','settings','raw_sections','checkpoint_ids','owner_revision']),'Fixed original source required.');
 assert(typeof f.request.gpx_b64==='string'&&f.request.gpx_b64.length>0&&f.request.gpx_b64.length<=6990508&&hash(f.prepared?.binding),'Original source encoding/binding required.');
 assert(exact(c,['plan','request','bundleIds'])&&exact(p,['locks','stationPatch']),'Detached current/proposed shape required.');
 const rebuilt=validateCompositeClock(c.plan,c.request),reference=c.request.sourceProof.referencePlan;
 assertOriginalMovingReference(reference,f.prepared);assert(same(f.prepared.raw_sections,f.request.raw_sections)&&same(f.prepared.checkpoint_ids,f.request.checkpoint_ids)&&f.prepared.owner_revision===f.request.owner_revision,'Fixed preparation identity mismatch.');
 const original=f.prepared.baseline_plan.input,requested=f.request.settings,cps=requested.checkpoints;
 assert(Array.isArray(cps)&&original.checkpoints.length-cps.length>=0&&original.checkpoints.length-cps.length<=1&&same(cps,original.checkpoints.slice(0,cps.length))&&same({...requested,checkpoints:original.checkpoints},original),'Fixed original settings mismatch.');
 selection(q);proposedShape(p);
 assert(exact(l,['reservationId','generation','currentDigest','patchDigest','expiresAtMs'])&&label(l.reservationId)&&Number.isSafeInteger(l.generation)&&l.generation>0&&hash(l.currentDigest)&&hash(l.patchDigest)&&Number.isFinite(l.expiresAtMs),'Detached lifetime required.');
 boundedLimits(limits);
 const {locks,baseline,proposed}=qualifyConditionalForwardControls({plan:c.plan,rawSections:f.request.raw_sections,proposed:p,bundleIds:c.bundleIds});
 const currentClock={moving_s:c.plan.moving_s,dwell_s:c.plan.stops_s,finish_s:c.plan.target_elapsed_s,locks:projectManualLocks(rebuilt.mathPlan.station_clock.locks),declarations:baseline.declarations,requirements:baseline.requirements,canonical_cell_moving_s:c.plan.canonical_timeline.map(r=>r.moving_s),raw_section_times:clone(c.plan.raw_section_times??[]),checkpoints:c.plan.checkpoints.map(r=>({id:r.id,distance_m:r.distance_m,arrival_elapsed_s:r.arrival_elapsed_s,departure_elapsed_s:r.departure_elapsed_s,stop_s:r.stop_s}))};
 const out={schema_version:FORWARD_INPUT_VERSION,fixed_source:{...clone(f.request),expected_manual_binding:f.prepared.binding},current_A_clock:currentClock,baseline:{locks:currentClock.locks,stations:baseline.stations,declarations:baseline.declarations},proposed:{locks,stations:proposed.stations,declarations:proposed.declarations},geometry_snapshot:clone(reference.geometry_snapshot),route:clone(reference.route),context:clone(value.context),qualification:clone(q),lifetime:clone(l),limits:clone(limits),production_admission:false,ui_apply_admitted:false,user_export_admitted:false};
 preflightClockData(out,{maxBytes:16*1024*1024});return out;
}
/** Pure detached-token check; does not claim access to a production owner. */
export function validateConditionalForwardLifetime(input,live,nowMs){preflightClockData(input);preflightClockData(live);assert(exact(live,['reservationId','generation','currentDigest','patchDigest','expiresAtMs'])&&same(input.lifetime,live)&&Number.isFinite(nowMs)&&nowMs<live.expiresAtMs,'Detached snapshot is canceled/stale/expired.');return true;}
/** No caller can add a reviewed production pack through this module. */
export function resolveQualifiedForwardPack(){return{status:'not_estimable',reason:'qualified_pack_resolver_empty',production_admission:false};}
