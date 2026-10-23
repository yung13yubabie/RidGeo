/** Synthetic-only foreground movement experiment. Every threshold is provisional. */
export const DEFAULTS = Object.freeze({
  maxAccuracyM: 12, maxStationaryAccuracyM: 2, staleMs: 12000, windowMs: 30000,
  moveDwellMs: 10000, stopDwellMs: 20000, minFixes: 4, minMoveSegments: 2,
  noiseFactor: 0.5, minStepM: 0.15, moveSpeedMps: 0.08,
  stationaryRadiusM: 0.5, teleportSpeedMps: 12,
  evidenceStepMs: 5000, sourceClockToleranceMs: 2000,
  trendMinDisplacementM: 0.15, trendMinEfficiency: 0.8,
});
const STATES = new Set(['IDLE', 'ACQUIRING', 'MOVING', 'STOPPED', 'UNCERTAIN', 'SUSPENDED']);
const BUCKETS = ['moving', 'stopped', 'unknown', 'manual'];
function distance(a, b) {
  const rad = Math.PI / 180, p = (b.lat-a.lat)*rad, q=(b.lon-a.lon)*rad;
  const h=Math.sin(p/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(q/2)**2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1,h)));
}
export class HikingTimer {
  constructor({clock, config={}}={}) {
    if (typeof clock !== 'function') throw new TypeError('Inject a monotonic millisecond clock');
    this.clock=clock; this.config={...DEFAULTS,...config};
    for (const [key,value] of Object.entries(this.config)) {
      if (!(key in DEFAULTS) || !Number.isFinite(value) || value < 0) throw new TypeError(`Invalid threshold: ${key}`);
    }
    for (const key of ['staleMs','windowMs','moveDwellMs','stopDwellMs','minFixes','minMoveSegments','evidenceStepMs','sourceClockToleranceMs']) {
      if (!Number.isSafeInteger(this.config[key])) throw new TypeError(`${key} must be an integer`);
    }
    for (const key of ['staleMs','windowMs','minFixes','minMoveSegments','teleportSpeedMps','evidenceStepMs']) {
      if (this.config[key] <= 0) throw new TypeError(`${key} must be positive`);
    }
    this.state='IDLE'; this.override='auto'; this.hidden=false; this.running=false;
    this.lastTimestamp=null; this.sourceAnchor=null; this.sessionStartedAt=null; this.cursor=this.now(); this.intervals=[]; this.elapsedMs=0; this.resetEvidence();
  }
  now() { const n=this.clock(); if (!Number.isFinite(n) || n<0 || !Number.isSafeInteger(Math.floor(n))) throw new TypeError('Invalid clock'); return Math.floor(n); }
  resetEvidence() { this.samples=[]; this.lastFix=null; this.lastAt=null; }
  bucket() {
    if (this.override==='pause') return 'manual';
    if (this.hidden) return 'unknown';
    if (this.override==='run') return 'moving';
    return this.state==='MOVING'?'moving':this.state==='STOPPED'?'stopped':'unknown';
  }
  append(ms,bucket,source=this.override) {
    if (ms<=0) return;
    const previous=this.intervals.at(-1), startMs=this.elapsedMs;
    this.elapsedMs+=ms;
    if (previous && previous.bucket===bucket && previous.source===source) previous.endMs=this.elapsedMs;
    else this.intervals.push({startMs,endMs:this.elapsedMs,bucket,source});
  }
  advance() {
    const now=this.now(); if (now<this.cursor) throw new RangeError('Monotonic clock moved backwards');
    if (this.running) {
      const expiry=this.lastAt===null?this.cursor:this.lastAt+this.config.staleMs;
      if (!this.hidden && this.lastAt!==null && now>=expiry) {
        const boundary=Math.max(this.cursor,expiry);
        this.append(boundary-this.cursor,this.bucket());
        this.state='UNCERTAIN'; this.resetEvidence();
        this.append(now-boundary,this.bucket());
      } else this.append(now-this.cursor,this.bucket());
    }
    this.cursor=now; return now;
  }
  start() {
    const now=this.advance();
    if (!this.running) {
      // Explicit stopped -> running lifecycle starts a fresh acquisition epoch.
      // Repeated start() while running cannot silently trust a changed source clock.
      this.running=true; this.sessionStartedAt=now;
      this.lastTimestamp=null; this.sourceAnchor=null;
      this.state=this.hidden?'SUSPENDED':'ACQUIRING'; this.resetEvidence();
    }
    return this.snapshot();
  }
  stop() { this.advance(); this.running=false; this.state='IDLE'; this.resetEvidence(); return this.snapshot(); }
  tick() { this.advance(); return this.snapshot(); }
  setHidden(hidden) {
    this.advance(); this.hidden=Boolean(hidden); this.resetEvidence();
    this.state=this.running?(this.hidden?'SUSPENDED':'ACQUIRING'):'IDLE'; return this.snapshot();
  }
  setOverride(mode) {
    if (!['auto','pause','run'].includes(mode)) throw new TypeError('Override must be auto, pause, or run');
    this.advance(); this.override=mode; return this.snapshot();
  }
  fix(fix) {
    const now=this.advance();
    if (!this.running || this.hidden) return {accepted:false,reason:'inactive'};
    const f={...fix};
    const valid=Number.isFinite(f.lat)&&Math.abs(f.lat)<=90&&Number.isFinite(f.lon)&&Math.abs(f.lon)<=180&&Number.isFinite(f.accuracyM)&&f.accuracyM>=0&&Number.isFinite(f.timestampMs)&&Number.isFinite(f.ageMs)&&f.ageMs>=0;
    if (!valid || f.accuracyM>this.config.maxAccuracyM || f.ageMs>=this.config.staleMs) {
      this.state='UNCERTAIN'; this.resetEvidence(); return {accepted:false,reason:'bad-or-stale-fix'};
    }
    if (this.sessionStartedAt!==null && now-f.ageMs<this.sessionStartedAt) return {accepted:false,reason:'pre-session-fix'};
    f.ageMs=Math.floor(f.ageMs);
    if ((this.lastTimestamp!==null && f.timestampMs<=this.lastTimestamp) || (this.lastAt!==null && now-f.ageMs<=this.lastAt)) return {accepted:false,reason:'duplicate-or-out-of-order'};
    const at=now-f.ageMs;
    if (this.sourceAnchor && Math.abs((f.timestampMs-this.sourceAnchor.timestampMs)-(at-this.sourceAnchor.at))>this.config.sourceClockToleranceMs) {
      this.state='UNCERTAIN'; this.resetEvidence(); return {accepted:false,reason:'source-clock-mismatch'};
    }
    if (this.lastFix) {
      const dt=(at-this.lastAt)/1000;
      if (Math.max(0,distance(f,this.lastFix)-f.accuracyM-this.lastFix.accuracyM)/dt>this.config.teleportSpeedMps) {
        this.state='UNCERTAIN'; this.resetEvidence(); return {accepted:false,reason:'teleport'};
      }
    }
    // ageMs is supplied by the adapter; GPS epoch timestamps are never the timer clock.
    this.sourceAnchor ??= {timestampMs:f.timestampMs,at};
    this.lastTimestamp=f.timestampMs; this.lastFix=f; this.lastAt=at;
    this.samples.push({...f,at:now-f.ageMs});
    this.samples=this.samples.filter(s=>s.at>=now-this.config.windowMs);
    const s=this.samples;
    // Fixed-time evidence anchors avoid charging accuracy noise on every callback.
    // No interpolation: unresolved sub-anchor motion remains unknown.
    const anchors=[];
    for(const sample of s) if(!anchors.length || sample.at-anchors.at(-1).at>=this.config.evidenceStepMs) anchors.push(sample);
    const duration=anchors.length>1?anchors.at(-1).at-anchors[0].at:0;
    let supportedPath=0, movingSegments=0, diameter=0, rawPath=0;
    for(let i=1;i<anchors.length;i++) {
      const d=distance(anchors[i-1],anchors[i]);
      const support=Math.max(0,d-this.config.noiseFactor*(anchors[i-1].accuracyM+anchors[i].accuracyM)-this.config.minStepM);
      if(support>0) { supportedPath+=support; movingSegments++; }
    }
    for(let i=1;i<s.length;i++) {
      rawPath+=distance(s[i-1],s[i]);
      for(let j=0;j<i;j++) diameter=Math.max(diameter,distance(s[i],s[j]));
    }
    const net=s.length>1?distance(s[0],s.at(-1)):0;
    const unresolvedTrend=net>=this.config.trendMinDisplacementM&&rawPath>0&&net/rawPath>=this.config.trendMinEfficiency;
    const enough=anchors.length>=this.config.minFixes;
    const move=enough&&duration>=this.config.moveDwellMs&&movingSegments>=this.config.minMoveSegments&&supportedPath/(duration/1000)>=this.config.moveSpeedMps;
    // Never inflate the quiet radius with uncertainty: coarse or trending fixes
    // cannot establish stopping merely because each individual step is small.
    const quiet=enough&&s.every(f=>f.accuracyM<=this.config.maxStationaryAccuracyM)&&duration>=this.config.stopDwellMs&&movingSegments===0&&!unresolvedTrend&&diameter<=this.config.stationaryRadiusM;
    if(move) this.state='MOVING';
    else if(quiet) this.state='STOPPED';
    else this.state='UNCERTAIN';
    return {accepted:true,state:this.state,evidence:{durationMs:duration,supportedPathM:supportedPath,movingSegments,diameterM:diameter}};
  }
  snapshot() {
    const totals=Object.fromEntries(BUCKETS.map(k=>[`${k}Ms`,0]));
    for(const i of this.intervals) totals[`${i.bucket}Ms`]+=i.endMs-i.startMs;
    return {state:this.state,override:this.override,running:this.running,hidden:this.hidden,elapsedMs:this.elapsedMs,...totals,intervals:this.intervals.map(i=>({...i}))};
  }
  checkpoint() { this.advance(); return {version:1,...this.snapshot()}; }
  static restore(saved,{clock,config,reloadGapMs=0}={}) {
    if(saved?.version!==1||!Array.isArray(saved.intervals)||!STATES.has(saved.state)||!Number.isSafeInteger(reloadGapMs)||reloadGapMs<0) throw new TypeError('Invalid checkpoint or reload gap');
    const timer=new HikingTimer({clock,config});
    for(const i of saved.intervals) {
      if(i.startMs!==timer.elapsedMs||!Number.isSafeInteger(i.endMs)||i.endMs<=i.startMs||!BUCKETS.includes(i.bucket)||!['auto','pause','run','reload'].includes(i.source)) throw new TypeError('Invalid ledger');
      timer.append(i.endMs-i.startMs,i.bucket,i.source);
    }
    if(timer.elapsedMs!==saved.elapsedMs||!['auto','pause','run'].includes(saved.override)) throw new TypeError('Invalid totals or override');
    timer.override=saved.override; timer.running=Boolean(saved.running); timer.hidden=true;
    timer.sessionStartedAt=timer.cursor;
    timer.state=timer.running?'SUSPENDED':'IDLE';
    if(timer.running) timer.append(reloadGapMs,'unknown','reload');
    return timer;
  }
}
export function formatDuration(ms) {
  if(!Number.isFinite(ms)||ms<0) throw new TypeError('Invalid duration');
  return (ms/1000).toFixed(3)+' s';
}
