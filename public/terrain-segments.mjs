/** Display-only terrain segmentation. Never recomputes cost, ability or pacing. */
export const TERRAIN_DISPLAY_VERSION = 'distance-zones-hysteresis-bridge-v1';
export const TERRAIN_DISPLAY_DEFAULTS = Object.freeze({flatGrade:0.03,hysteresisGrade:0.01,minimumSectionM:75,preserveReliefM:4,dominantRatio:0.6});
const finite = (x,name) => { if(typeof x!=='number'||!Number.isFinite(x)) throw new Error(`${name} must be finite`); return x; };
const near = (a,b) => Math.abs(a-b)<=Math.max(1e-7,1e-9*Math.max(Math.abs(a),Math.abs(b)));
const assert = (condition,message) => { if(!condition) throw new Error(message); };
const keys=['gain_m','loss_m','up_distance_m','down_distance_m','flat_distance_m','unknown_distance_m'];
const zero=()=>Object.fromEntries(keys.map(k=>[k,0]));

export function buildTerrainSegments(plan, options={}) {
  const o={...TERRAIN_DISPLAY_DEFAULTS,...options};
  assert(Object.keys(options).every(k=>k in TERRAIN_DISPLAY_DEFAULTS),'unknown display option');
  for(const [k,v] of Object.entries(o)) finite(v,k);
  assert(o.flatGrade>0&&o.flatGrade<=0.45&&o.hysteresisGrade>=0&&o.hysteresisGrade<o.flatGrade,'invalid grade display thresholds');
  assert(o.minimumSectionM>=0&&o.preserveReliefM>=0&&o.dominantRatio>0.5&&o.dominantRatio<=1,'invalid display merge thresholds');
  const cells=plan?.geometry_snapshot, timeline=plan?.canonical_timeline, cps=plan?.checkpoints||[];
  assert(Array.isArray(cells)&&cells.length>0&&Array.isArray(timeline)&&cells.length===timeline.length,'geometry/timeline mismatch');
  assert(Array.isArray(cps),'checkpoints must be an array');
  const timeAt=new Map([[0,0]]), cumulative=[zero()], runs=[];
  let prevEnd=0, time=0, state='flat';
  for(let i=0;i<cells.length;i++) {
    const c=cells[i],t=timeline[i],start=finite(c.start_m,'cell start'),end=finite(c.end_m,'cell end');
    assert(start===prevEnd&&end>start,'canonical cells must be exactly contiguous');
    assert(t.start_m===start&&t.end_m===end,'timeline boundaries differ from geometry');
    const duration=finite(t.moving_s,'cell moving');assert(duration>=0,'negative cell time');
    time+=duration;
    if(t.cumulative_moving_s!==undefined) assert(near(finite(t.cumulative_moving_s,'cumulative moving'),time),'inconsistent canonical prefix');
    timeAt.set(end,time);prevEnd=end;
    const g=c.grade;
    if(g===null||g===undefined) state='unknown';
    else {
      finite(g,'grade');
      if(g>=o.flatGrade)state='up';
      else if(g<=-o.flatGrade)state='down';
      else if(state==='up'&&g>o.flatGrade-o.hysteresisGrade)state='up';
      else if(state==='down'&&g<-(o.flatGrade-o.hysteresisGrade))state='down';
      else state='flat';
    }
    const d=end-start,v=zero();v[`${state}_distance_m`]=d;
    const heightsKnown=Number.isFinite(c.elevation_start_m)&&Number.isFinite(c.elevation_end_m);
    assert(state==='unknown'||heightsKnown,'known grade requires canonical elevations');
    if(heightsKnown) {const dz=c.elevation_end_m-c.elevation_start_m;v.gain_m=Math.max(0,dz);v.loss_m=Math.max(0,-dz);}
    const last=cumulative.at(-1);cumulative.push(Object.fromEntries(keys.map(k=>[k,last[k]+v[k]])));
    const lastRun=runs.at(-1);
    if(lastRun&&lastRun.kind===state){lastRun.end=end;lastRun.last=i+1;}
    else runs.push({start,end,first:i,last:i+1,kind:state});
  }
  const total=prevEnd;
  if(plan.moving_s!==undefined)assert(near(finite(plan.moving_s,'plan moving'),time),'plan moving total mismatch');
  // Classification and bridge grouping occur BEFORE CP slicing, so adding a CP
  // cannot alter the underlying grade-zone decisions or micro-run merge policy.
  const merged=[];
  for(const run of runs){
    merged.push({...run});
    while(merged.length>=3){
      const [a,b,c]=merged.slice(-3),relief=(cumulative[b.last].gain_m-cumulative[b.first].gain_m)+(cumulative[b.last].loss_m-cumulative[b.first].loss_m);
      if(a.kind!==c.kind||a.kind==='unknown'||b.kind==='unknown'||b.end-b.start>=o.minimumSectionM||relief>=o.preserveReliefM)break;
      merged.splice(-3,3,{start:a.start,end:c.end,first:a.first,last:c.last,kind:a.kind});
    }
  }
  const cpAt=new Map(), stopsPrefix=[];let previousCP=0, stops=0;
  for(const cp of cps){
    const d=finite(cp.distance_m,'CP distance'),stop=finite(cp.stop_s,'CP stop'),arrival=finite(cp.arrival_elapsed_s,'CP arrival'),departure=finite(cp.departure_elapsed_s,'CP departure');
    assert(d>previousCP&&d<=total&&stop>=0,'invalid CP order/location/stop');
    assert(near(departure,arrival+stop),'inconsistent CP arrival/departure');
    const moving=arrival-stops;
    assert(moving>=-1e-7&&moving<=time+Math.max(1e-7,Math.abs(time)*1e-9),'CP moving outside route timeline');
    if(timeAt.has(d))assert(near(timeAt.get(d),moving),'CP and canonical prefix disagree');
    // This is an exact time sample from the original continuous planning curve.
    // In particular, it is NOT distance-linear interpolation inside a cell.
    timeAt.set(d,moving);cpAt.set(d,{...cp});stops+=stop;stopsPrefix.push({d,total:stops});previousCP=d;
  }
  if(plan.stops_s!==undefined)assert(near(finite(plan.stops_s,'plan stops'),stops),'plan stop total mismatch');
  const cutpoints=[...new Set([0,total,...merged.flatMap(r=>[r.start,r.end]),...cpAt.keys()])].sort((a,b)=>a-b);
  const allTimePoints=[...timeAt].sort((a,b)=>a[0]-b[0]);
  for(let i=1;i<allTimePoints.length;i++)assert(allTimePoints[i][1]>=allTimePoints[i-1][1]-1e-7,'CP time contradicts canonical prefix');
  function cumulativeGeometry(d){
    if(d===0)return zero();if(d===total)return {...cumulative.at(-1)};
    let lo=0,hi=cells.length;
    while(lo<hi){const m=(lo+hi)>>1;if(cells[m].end_m<=d)lo=m+1;else hi=m;}
    const c=cells[lo],f=(d-c.start_m)/(c.end_m-c.start_m),a=cumulative[lo],b=cumulative[lo+1];
    return Object.fromEntries(keys.map(k=>[k,a[k]+(b[k]-a[k])*f]));
  }
  function stopSum(d,inclusive){let lo=0,hi=stopsPrefix.length;while(lo<hi){const m=(lo+hi)>>1;if(stopsPrefix[m].d<d||(inclusive&&stopsPrefix[m].d===d))lo=m+1;else hi=m;}return lo?stopsPrefix[lo-1].total:0;}
  function describe(v,d){
    const up=v.up_distance_m/d,down=v.down_distance_m/d,flat=v.flat_distance_m/d,unknown=v.unknown_distance_m/d;
    const ratios={up,down,flat,unknown};
    if(unknown>1e-12)return {kind:'unknown',label:unknown>=1-1e-12?'地形未知':'部分地形未知',ratios};
    const rolling=up>1e-12&&down>1e-12;
    if(rolling){if(down>=o.dominantRatio)return {kind:'downhill_rolling',label:'下坡為主起伏',ratios};if(up>=o.dominantRatio)return {kind:'uphill_rolling',label:'上坡為主起伏',ratios};return {kind:'rolling',label:'起伏',ratios};}
    if(up>=1-1e-12)return {kind:'uphill',label:'上坡',ratios};
    if(down>=1-1e-12)return {kind:'downhill',label:'下坡',ratios};
    if(flat>=1-1e-12)return {kind:'flat',label:'平緩',ratios};
    if(up>=o.dominantRatio)return {kind:'uphill_mixed',label:'上坡為主',ratios};
    if(down>=o.dominantRatio)return {kind:'downhill_mixed',label:'下坡為主',ratios};
    return {kind:'flat_mixed',label:'平緩為主',ratios};
  }
  return cutpoints.slice(1).map((end,i)=>{
    const start=cutpoints[i],d=end-start,a=cumulativeGeometry(start),b=cumulativeGeometry(end);
    const v=Object.fromEntries(keys.map(k=>[k,Math.max(0,b[k]-a[k])])),moving=timeAt.get(end)-timeAt.get(start),stopBeforeEnd=stopSum(end,false),stopThroughStart=stopSum(start,true),stopThroughEnd=stopSum(end,true);
    assert(Number.isFinite(moving)&&moving>=-1e-7,'missing or negative exact view duration');
    const arrival=timeAt.get(end)+stopBeforeEnd,departure=timeAt.get(end)+stopThroughEnd;
    const unknown=v.unknown_distance_m>1e-12;
    return {classification_version:TERRAIN_DISPLAY_VERSION,start_m:start,end_m:end,distance_m:d,...v,gain_m:unknown?null:v.gain_m,loss_m:unknown?null:v.loss_m,...describe(v,d),
      moving_s:Math.max(0,moving),pace_s_per_km:Math.max(0,moving)/d*1000,
      start_elapsed_s:timeAt.get(start)+stopThroughStart,arrival_elapsed_s:arrival,departure_elapsed_s:departure,
      stops_s:stopThroughEnd-stopThroughStart,elapsed_s:departure-(timeAt.get(start)+stopThroughStart),
      checkpoint:cpAt.has(end)?{name:cpAt.get(end).name??'',cutoff_status:cpAt.get(end).cutoff_status??'not_provided',cutoff_margin_s:cpAt.get(end).cutoff_margin_s??null}:null};
  });
}
