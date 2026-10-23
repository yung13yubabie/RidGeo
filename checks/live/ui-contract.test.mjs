import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {durationText,routeIdentity} from '../../public/live-ui.mjs';
test('duration formatting is a ledger representation, optional milliseconds',()=>{
 assert.equal(durationText(3600123),'01:00:00');assert.equal(durationText(3600123,true),'01:00:00.123');assert.equal(durationText(NaN),'—');assert.equal(durationText(-1),'—');
});
test('live context requires admitted original route with complete elevation and details',()=>{
 const context={route:{route_sha256:'raw',geometry_sha256:'geometry',elevation_complete:true,blocked:false},gpx_b64:'bytes',ready:true};
 assert.equal(routeIdentity(context),'raw:geometry');for(const change of [{ready:false},{gpx_b64:null},{route:{...context.route,blocked:true}},{route:{...context.route,elevation_complete:false}}])assert.equal(routeIdentity({...context,...change}),null);
});
test('integration source stays local and has no implicit location or persistence',()=>{
 const source=fs.readFileSync(new URL('../../public/live-ui.mjs',import.meta.url),'utf8');
 assert(!/localStorage|sessionStorage|indexedDB|fetch\(|sendBeacon/.test(source));
 assert(source.includes('owner_revision:String(owner)'));assert(source.includes('response.owner_revision!==String(owner)'));
 assert(source.includes("$('live-location').addEventListener('click'"));
 assert(!source.includes('if(timer)timer.setHidden(doc.hidden===true)'));
});
