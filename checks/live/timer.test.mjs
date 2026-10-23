import test from 'node:test';
import assert from 'node:assert/strict';
import {HikingTimer,formatDuration} from '../../public/live-timer.mjs';
const degreesPerM=180/(Math.PI*6371000);
function harness(config={}) {
  let now=0;
  const t=new HikingTimer({clock:()=>now,config}); t.start();
  return {t,at(ms){now=ms;},fix(ms,x=0,y=0,extra={}){now=ms;return t.fix({timestampMs:ms,ageMs:0,lat:y*degreesPerM,lon:x*degreesPerM,accuracyM:0.3,speed:null,...extra});}};
}
function sumCheck(s) {
  assert.equal(s.elapsedMs,s.movingMs+s.stoppedMs+s.unknownMs+s.manualMs);
  let end=0;
  for(const i of s.intervals) { assert.equal(i.startMs,end); assert.ok(i.endMs>i.startMs); end=i.endMs; }
  assert.equal(end,s.elapsedMs);
}
test('stationary jitter only becomes stopped after repeated evidence and dwell',()=>{
 const h=harness(); for(let ms=0;ms<=30000;ms+=5000) h.fix(ms,(ms/5000%2)*0.1);
 assert.equal(h.t.state,'STOPPED'); assert.equal(h.t.snapshot().movingMs,0); sumCheck(h.t.snapshot());
});
test('slow uphill proxy at 0.2 m/s and null speed remains moving',()=>{
 const h=harness(); for(let ms=0;ms<=60000;ms+=5000) h.fix(ms,ms/1000*0.2);
 assert.equal(h.t.state,'MOVING'); assert.ok(h.t.snapshot().movingMs>0); assert.equal(h.t.snapshot().stoppedMs,0);
});
test('start, stop, and resume have conservative detection lag',()=>{
 const h=harness(); for(let ms=0;ms<=30000;ms+=5000) h.fix(ms,ms/1000);
 assert.equal(h.t.state,'MOVING');
 for(let ms=35000;ms<=70000;ms+=5000) h.fix(ms,30);
 assert.equal(h.t.state,'STOPPED');
 for(let ms=75000;ms<=110000;ms+=5000) h.fix(ms,30+(ms-70000)/1000);
 assert.equal(h.t.state,'MOVING'); sumCheck(h.t.snapshot());
});
test('poor accuracy and stale outage are unknown, never stopped',()=>{
 const h=harness(); for(let ms=0;ms<=20000;ms+=5000) h.fix(ms,ms/1000);
 assert.equal(h.t.state,'MOVING'); h.fix(25000,25,0,{accuracyM:100});
 assert.equal(h.t.state,'UNCERTAIN'); h.at(50000); const s=h.t.tick(); assert.equal(s.stoppedMs,0); assert.ok(s.unknownMs>=25000);
 assert.equal(h.fix(51000,51,0,{ageMs:12000}).accepted,false);
});
test('late callbacks split at freshness expiry, not at callback count',()=>{
 const h=harness(); for(let ms=0;ms<=20000;ms+=5000) h.fix(ms,ms/1000);
 h.at(100000); const s=h.t.tick(); assert.equal(s.elapsedMs,100000); assert.equal(s.movingMs,17000); assert.equal(s.unknownMs,83000);
 assert.deepEqual(h.t.tick(),s); h.at(99999); assert.throws(()=>h.t.tick(),/backwards/); sumCheck(s);
});
test('hidden gap is unknown and coordinates cannot bridge it',()=>{
 const h=harness(); for(let ms=0;ms<=20000;ms+=5000) h.fix(ms,ms/1000);
 h.t.setHidden(true); assert.equal(h.fix(25000,20000).reason,'inactive');
 h.at(100000); h.t.setHidden(false); assert.equal(h.t.state,'ACQUIRING');
 h.fix(100001,10000); assert.equal(h.t.state,'UNCERTAIN'); assert.equal(h.t.samples.length,1);
 assert.ok(h.t.snapshot().unknownMs>=80000); sumCheck(h.t.snapshot());
});
test('reload preserves ledger but resets clock and all coordinates',()=>{
 const h=harness(); h.fix(0); h.fix(5000); const saved=h.t.checkpoint();
 assert.equal(JSON.stringify(saved).includes('lat'),false);
 let now=0; const t=HikingTimer.restore(saved,{clock:()=>now,reloadGapMs:20000});
 assert.equal(t.state,'SUSPENDED'); assert.equal(t.samples.length,0); assert.equal(t.snapshot().elapsedMs,25000);
 now=1234.5; t.setHidden(false); assert.equal(t.snapshot().elapsedMs,26234); sumCheck(t.snapshot());
 assert.doesNotThrow(()=>HikingTimer.restore(t.checkpoint(),{clock:()=>0}));
});
test('manual pause never autoresumes; run is distinctly attributed and foreground only',()=>{
 const h=harness(); h.t.setOverride('pause'); for(let ms=0;ms<=30000;ms+=5000) h.fix(ms,ms/1000);
 assert.equal(h.t.state,'MOVING'); assert.equal(h.t.override,'pause'); assert.equal(h.t.snapshot().manualMs,30000); assert.equal(h.t.snapshot().movingMs,0);
 h.t.setOverride('run'); h.at(40000); h.t.tick(); assert.equal(h.t.snapshot().movingMs,10000);
 h.t.setHidden(true); h.at(50000); h.t.tick(); assert.equal(h.t.snapshot().unknownMs,10000); sumCheck(h.t.snapshot());
});
test('tight return path uses supported segments rather than net displacement',()=>{
 const h=harness(); const points=[[0,0],[1,0],[1,1],[0,1]];
 for(let i=0;i<=12;i++) h.fix(i*5000,...points[i%4]);
 assert.equal(h.t.state,'MOVING'); assert.equal(h.t.snapshot().stoppedMs,0);
});
test('duplicate, out of order and teleport fixes cannot refresh valid evidence',()=>{
 const h=harness(); h.fix(0); h.fix(5000,1);
 assert.equal(h.fix(6000,1,0,{timestampMs:5000}).reason,'duplicate-or-out-of-order');
 assert.equal(h.t.lastAt,5000);
 assert.equal(h.fix(7000,1,0,{timestampMs:4000}).accepted,false);
 assert.equal(h.fix(8000,1000).reason,'teleport'); assert.equal(h.t.state,'UNCERTAIN');
});
test('millisecond arithmetic and exactly additive intervals do not claim GPS precision',()=>{
 const h=harness(); h.at(123.456); h.t.setOverride('pause'); h.at(456.789); h.t.setOverride('run'); h.at(987.654); h.t.stop();
 const s=h.t.snapshot(); sumCheck(s); assert.equal(s.elapsedMs,987); assert.equal(formatDuration(987.654),'0.988 s');
 h.at(9999); assert.equal(h.t.tick().elapsedMs,987);
});

test('ambiguous slow motion with coarse accuracy is unknown, not stopped',()=>{
 const h=harness(); for(let ms=0;ms<=60000;ms+=5000) h.fix(ms,ms/1000*0.2,0,{accuracyM:12});
 assert.equal(h.t.state,'UNCERTAIN'); assert.equal(h.t.snapshot().stoppedMs,0);
});
test('many fractional callback times still have exactly additive integer-ms accounting',()=>{
 const h=harness(); for(let i=1;i<1000;i++){h.at(i*1.23456); h.t.setOverride(['auto','run','pause'][i%3]);}
 sumCheck(h.t.snapshot()); assert.equal(h.t.snapshot().elapsedMs,Math.floor(999*1.23456));
});

test('regression: continuous sub-threshold motion at 0.04 m/s remains unknown',()=>{
 const h=harness(); for(let ms=0;ms<=60000;ms+=5000) h.fix(ms,ms/1000*0.04,0,{accuracyM:2});
 assert.equal(h.t.state,'UNCERTAIN'); assert.equal(h.t.snapshot().stoppedMs,0);
});
test('regression: high callback frequency does not erase 0.2 m/s movement',()=>{
 const sparse=harness(),frequent=harness();
 for(let ms=0;ms<=60000;ms+=5000) sparse.fix(ms,ms/1000*0.2);
 for(let ms=0;ms<=60000;ms+=1000) frequent.fix(ms,ms/1000*0.2);
 assert.equal(sparse.t.state,'MOVING'); assert.equal(frequent.t.state,'MOVING');
 assert.equal(sparse.t.snapshot().movingMs,frequent.t.snapshot().movingMs);
});
test('regression: source-clock jumps cannot allow 1 km teleports',()=>{
 const h=harness(); h.fix(0); h.fix(5000); h.fix(10000);
 assert.equal(h.fix(15000,1000,0,{timestampMs:1015000}).reason,'source-clock-mismatch');
 assert.equal(h.fix(20000,0,0,{timestampMs:2020000}).accepted,false);
 assert.equal(h.t.state,'UNCERTAIN'); assert.equal(h.t.snapshot().movingMs,0);
 assert.equal(h.fix(25000,0).accepted,true);
});
test('regression: even a smaller coherent unresolved trend is not quiet',()=>{
 const h=harness(); for(let ms=0;ms<=60000;ms+=5000) h.fix(ms,ms/1000*0.01,0,{accuracyM:2});
 assert.equal(h.t.state,'UNCERTAIN'); assert.equal(h.t.snapshot().stoppedMs,0);
});

test('explicit stop/start safely reanchors a changed source clock and rejects queued old fixes',()=>{
 const h=harness(); h.fix(0); h.fix(5000); h.fix(10000);
 assert.equal(h.fix(15000,0,0,{timestampMs:25000}).reason,'source-clock-mismatch');
 h.t.start(); // Idempotent while active: cannot reanchor a clock jump.
 assert.equal(h.fix(16000,0,0,{timestampMs:26000}).reason,'source-clock-mismatch');
 h.t.stop(); h.at(20000); h.t.start();
 // Queued samples genuinely acquired before the fresh epoch cannot seed it.
 assert.equal(h.fix(21000,1000,0,{timestampMs:19000,ageMs:2000}).reason,'pre-session-fix');
 assert.equal(h.t.sourceAnchor,null); assert.equal(h.t.samples.length,0);
 for(let ms=22000;ms<=47000;ms+=5000) assert.equal(h.fix(ms,0,0,{timestampMs:ms+10000}).accepted,true);
 assert.equal(h.t.state,'STOPPED'); assert.equal(h.t.snapshot().movingMs,0); sumCheck(h.t.snapshot());
});
