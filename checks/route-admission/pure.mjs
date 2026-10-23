/** Portable configuration admission and reviewed semantic regression. No network or raw GPX. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {EVENT_FACTS} from '../../public/global-catalog-data.js';
import {RACES} from '../../public/catalog-data.js';
import {validateEventCatalog} from '../../public/event-catalog.js';
import {createSourceIdentityIndex} from '../../public/upload-source-identity.mjs';
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const sha=value=>createHash('sha256').update(value).digest('hex');
const pins=JSON.parse(fs.readFileSync(new URL('../taiwan-source-adapter/fixture-pins.json',import.meta.url)));
function assertPinnedFacts(sources){
 const routes=sources.filter(source=>source.countryCode==='TW');
 assert.equal(new Set(routes.map(route=>route.id)).size,routes.length);
 assert.deepEqual(routes.map(route=>route.id).sort(),pins.records.map(pin=>pin.id).sort());
 for(const route of routes){const pin=pins.records.find(pin=>pin.id===route.id);assert.equal(sha(JSON.stringify(canonical(route))),pin.catalogFactsSha256,route.id+' all source/CP/category facts');}
}
function fixture(){
 const source={...structuredClone(RACES.find(source=>source.directFetch===true)),id:'generated-admission-2026',name:'Generated source',edition:2026,raceDate:'2026-01-01',startLocal:'2026-01-01T08:00:00',finishCutoffLocal:null,sha256:'a'.repeat(64),bytes:123,nominalDistanceKm:10,officialPage:'https://example.invalid/course',gpxUrl:'https://pdf.utmb.world/generated-admission.gpx',checkpoints:[]};
 const event={...structuredClone(EVENT_FACTS.find(event=>event.importability==='direct_verified')),id:'generated-event-2026',name:'Generated event',year:2026,edition:2026,date:'2026-01-01',dateStart:'2026-01-01',dateEnd:'2026-01-01',officialPage:'https://example.invalid/event',routeIds:[source.id],routes:[{routeId:source.id,name:'Reviewed group display alias',gpxDownloadUrl:source.gpxUrl,sha256:source.sha256}],metadata:{source:'https://example.invalid/event',verifiedAt:'2026-10-17T00:00:00Z'}};
 return {source,event,row:event.routes[0]};
}
const admit=({source,event})=>validateEventCatalog([event],[source]);
test('Current complete catalogue and exact source identity index admit unchanged',()=>{assert.equal(validateEventCatalog(EVENT_FACTS,RACES).length,EVENT_FACTS.length);assert(createSourceIdentityIndex(RACES));});
test('All current Taiwan source/CP/category facts match the independently reviewed existing pins',()=>assertPinnedFacts(RACES));
test('New generic direct source and reviewed display alias require no hard-coded event ID',()=>{const f=fixture();assert.equal(admit(f)[0].routes[0].name,'Reviewed group display alias');});
test('Matching optional numeric claims admit',()=>{const f=fixture();Object.assign(f.row,{edition:f.source.edition,bytes:f.source.bytes,nominalDistanceKm:f.source.nominalDistanceKm,validation:{bytes:f.source.bytes}});admit(f);});
test('Absent and explicitly null optional direct numeric facts remain unknown',()=>{admit(fixture());const f=fixture();Object.assign(f.row,{edition:null,bytes:null,nominalDistanceKm:null,officialPage:null,validation:{bytes:null}});admit(f);});
test('Direct row event landing page may differ from the reviewed course page',()=>{const f=fixture();f.row.officialPage=f.event.officialPage;admit(f);});
test('Extra information-only row remains legal without an import identity',()=>{const f=fixture();f.event.routes.push({name:'Organizer course description',routePageUrl:'https://example.invalid/description',downloadKind:'organizer_linked_route_page'});admit(f);});
for(const [key,value] of [['edition',2025],['bytes',124],['nominalDistanceKm',12]])test('Conflicting declared direct '+key+' is rejected',()=>{const f=fixture();f.row[key]=value;assert.throws(()=>admit(f));});
test('Conflicting declared nested validation bytes are rejected',()=>{const f=fixture();f.row.validation={bytes:124};assert.throws(()=>admit(f));});
test('Unknown extra direct reference is rejected',()=>{const f=fixture();f.event.routes.push({...f.row,routeId:'unreviewed-source-2026'});assert.throws(()=>admit(f));});
test('Known but unselected source reference is rejected',()=>{const f=fixture();const other={...f.source,id:'unselected-source-2026'};f.event.routes.push({...f.row,routeId:other.id});assert.throws(()=>validateEventCatalog([f.event],[f.source,other]));});
test('Duplicate selected reference is rejected',()=>{const f=fixture();f.event.routes.push({...f.row});assert.throws(()=>admit(f));});
test('Selected source missing its reference is rejected',()=>{const f=fixture();f.event.routes=[];assert.throws(()=>admit(f));});
for(const key of ['edition','gpxDownloadUrl','sha256'])test('Mandatory source binding '+key+' cannot be bypassed',()=>{const f=fixture();if(key==='edition')f.source.edition=2025;else f.row[key]=key==='sha256'?'b'.repeat(64):'https://pdf.utmb.world/other.gpx';assert.throws(()=>admit(f));});
test('Previous-edition download-only references remain legitimate without import IDs',()=>{const events=EVENT_FACTS.filter(event=>event.routeEditionMatchesEvent===false);assert(events.length>0);for(const event of events){assert.equal(event.importability,'download_only');assert.deepEqual(event.routeIds,[]);}validateEventCatalog(EVENT_FACTS,RACES);});
test('Bridge page identity and required edition remain bound to its fixed registry',()=>{for(const mutate of [row=>row.officialPage='https://example.invalid/other',row=>row.edition=null]){const facts=structuredClone(EVENT_FACTS);const event=facts.find(event=>event.importability==='bridge_verified');mutate(event.routes.find(row=>row.routeId));assert.throws(()=>validateEventCatalog(facts,RACES));}});
for(const id of ['xtrail-2027-top-10k','skyhunter-shilin-2026-24k'])test('Reviewed station-fact pin rejects dropped occurrences for '+id,()=>{const routes=structuredClone(RACES);routes.find(route=>route.id===id).checkpoints=[];assert.throws(()=>assertPinnedFacts(routes));});
test('Reviewed station-fact pin rejects same-length wrong-kind station collection',()=>{const routes=structuredClone(RACES);routes.find(route=>route.id==='aa-maokong-2027-25k').checkpoints.forEach(cp=>cp.kind='finish');assert.throws(()=>assertPinnedFacts(routes));});
