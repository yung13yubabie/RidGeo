import test from 'node:test';
import assert from 'node:assert/strict';
import { HikingTimer } from '../../public/live-timer.mjs';
const deg=180/(Math.PI*6371000);
function harness(){let now=0;const t=new HikingTimer({clock:()=>now});t.start();return {t,at(ms){now=ms;},fix(ms,x=0,extra={}){now=ms;return t.fix({lat:0,lon:x*deg,accuracyM:0.3,timestampMs:ms,ageMs:0,...extra});}};}
// Revised acceptance tests; pre-fix reproduction assertions are archived separately.
test('FIXED: slow continuous motion 0.04 m/s, 2 m accuracy stays unknown',()=>{
 const h=harness();for(let ms=0;ms<=60000;ms+=5000)h.fix(ms,ms/1000*0.04,{accuracyM:2});
 assert.equal(h.t.state,'UNCERTAIN');assert.equal(h.t.snapshot().stoppedMs,0);
});
test('FIXED: source timestamp jump is rejected',()=>{
 const h=harness();h.fix(0);h.fix(5000);h.fix(10000);
 const jump=h.fix(15000,1000,{timestampMs:1_015_000});
 assert.equal(jump.accepted,false);assert.equal(jump.reason,'source-clock-mismatch');
 const back=h.fix(20000,0,{timestampMs:2_020_000});
 assert.equal(back.accepted,false);assert.equal(h.t.state,'UNCERTAIN');assert.equal(h.t.snapshot().movingMs,0);
});
test('FIXED: same 0.2 m/s walk is moving at both fix rates',()=>{
 const sparse=harness(),frequent=harness();
 for(let ms=0;ms<=60000;ms+=5000)sparse.fix(ms,ms/1000*0.2);
 for(let ms=0;ms<=60000;ms+=1000)frequent.fix(ms,ms/1000*0.2);
 assert.equal(sparse.t.state,'MOVING');assert.equal(frequent.t.state,'MOVING');assert.equal(frequent.t.snapshot().movingMs,sparse.t.snapshot().movingMs);
});
test('PASS: manual pause remains effective through hidden gaps and reacquisition',()=>{
 const h=harness();h.t.setOverride('pause');h.at(10000);h.t.setHidden(true);
 h.at(30000);h.t.setHidden(false);for(let ms=30000;ms<=60000;ms+=5000)h.fix(ms,ms/1000);
 assert.equal(h.t.override,'pause');assert.equal(h.t.snapshot().manualMs,60000);assert.equal(h.t.snapshot().movingMs,0);
});
test('PASS: repeated out of order fixes do not extend stopped freshness',()=>{
 const h=harness();for(let ms=0;ms<=20000;ms+=5000)h.fix(ms);
 assert.equal(h.t.state,'STOPPED');
 for(let ms=21000;ms<=40000;ms+=1000)assert.equal(h.fix(ms,0,{timestampMs:19000}).accepted,false);
 const s=h.t.snapshot();assert.equal(s.state,'UNCERTAIN');assert.equal(s.stoppedMs,12000);assert.equal(s.unknownMs,28000);
});
test('PASS: stop/start excludes idle interval and rejects hidden fixes',()=>{
 const h=harness();h.at(1234);h.t.stop();h.at(9000);h.t.start();h.at(10000);h.t.setHidden(true);
 assert.equal(h.fix(15000,100).reason,'inactive');h.at(20000);const s=h.t.tick();
 assert.equal(s.elapsedMs,12234);assert.equal(s.unknownMs,12234);assert.equal(h.t.samples.length,0);
});
test('PASS: snapshots and checkpoints omit coordinate evidence',()=>{
 const h=harness();h.fix(0,123);h.fix(5000,124);
 for(const output of [h.t.snapshot(),h.t.checkpoint()]){
 const serialized=JSON.stringify(output);for(const key of ['lat','lon','accuracyM','timestampMs','samples','lastFix'])assert.equal(serialized.includes('"'+key+'"'),false);
 }
});
test('PASS: bad fix, hidden gap and stale outage never bridge evidence',()=>{
 const h=harness();for(let ms=0;ms<=20000;ms+=1000)h.fix(ms,ms/1000);
 h.fix(21000,21,{accuracyM:100});assert.equal(h.t.state,'UNCERTAIN');assert.equal(h.t.samples.length,0);
 h.fix(22000,22);h.t.setHidden(true);h.at(100000);h.t.setHidden(false);h.fix(100000,100);
 assert.equal(h.t.samples.length,1);assert.equal(h.t.state,'UNCERTAIN');h.at(120000);h.t.tick();
 assert.equal(h.t.samples.length,0);assert.equal(h.t.snapshot().stoppedMs,0);
});
test('PASS: delayed fixes use acquisition age without false clock mismatch',()=>{
 const h=harness();for(let ms=0;ms<=60000;ms+=1000)h.fix(ms+250,ms/1000*0.2,{timestampMs:ms,ageMs:250});
 assert.equal(h.t.state,'MOVING');assert.equal(h.t.snapshot().stoppedMs,0);
});
test('PASS: monotonic teleport test rejects jump even within source tolerance',()=>{
 const h=harness();h.fix(0);h.fix(5000);
 assert.equal(h.fix(6000,100,{timestampMs:8000}).reason,'teleport');assert.equal(h.t.state,'UNCERTAIN');
});
test('PASS: only explicit stop/start recovers a shifted source clock with fresh evidence',()=>{
 const h=harness();h.fix(0);h.fix(5000);
 for(let ms=10000;ms<=60000;ms+=5000)assert.equal(h.fix(ms,ms/1000,{timestampMs:ms+10000}).reason,'source-clock-mismatch');
 h.t.start();assert.equal(h.fix(61000,61,{timestampMs:71000}).reason,'source-clock-mismatch');
 h.t.stop();h.at(62000);h.t.start();
 assert.equal(h.fix(63000,999,{timestampMs:71000,ageMs:2000}).reason,'pre-session-fix');assert.equal(h.t.sourceAnchor,null);
 assert.equal(h.fix(65000,65,{timestampMs:75000}).accepted,true);
 assert.equal(h.t.state,'UNCERTAIN');assert.equal(h.t.snapshot().movingMs,0);
 for(let ms=70000;ms<=90000;ms+=5000)assert.equal(h.fix(ms,ms/1000,{timestampMs:ms+10000}).accepted,true);
 assert.equal(h.t.state,'MOVING');
 const v=h.t.snapshot();assert.equal(v.elapsedMs,89000);assert.equal(v.elapsedMs,v.movingMs+v.stoppedMs+v.unknownMs+v.manualMs);
});
test('PASS: restore rejects pre-restore acquisition without seeding source anchor',()=>{
 const h=harness();h.fix(0);h.at(5000);const saved=h.t.checkpoint();let now=10000;
 const t=HikingTimer.restore(saved,{clock:()=>now});t.setHidden(false);now=11000;
 assert.equal(t.fix({lat:0,lon:0,accuracyM:0.3,timestampMs:9000,ageMs:2000}).reason,'pre-session-fix');
 assert.equal(t.sourceAnchor,null);assert.equal(t.samples.length,0);
 assert.equal(t.fix({lat:0,lon:0,accuracyM:0.3,timestampMs:11000,ageMs:0}).accepted,true);assert.equal(t.state,'UNCERTAIN');
});
