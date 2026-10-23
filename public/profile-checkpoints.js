import {checkpointRowDisplay} from './checkpoint-groups.mjs';
import {formatElapsedDuration,checkpointTimeText} from './checkpoint-time.mjs';
/** Presentation uses the same rounded prefix clocks as CP tables. No timing model. */
export function checkpointProfileInfo(cp,{mode='pending',startClock=''}={}){
 const duration=formatElapsedDuration;
 const name=String(cp.name||'補給站'),distance=Number.isFinite(cp.distance_m)?`${(cp.distance_m/1000).toFixed(3)} km`:'里程待確認';
 if(mode==='pending'||![cp.arrival_elapsed_s,cp.departure_elapsed_s].every(Number.isFinite))return {name,distance,arrival:'待計算',departure:'待計算',stop:Number.isFinite(cp.stop_s)?duration(cp.stop_s):'待設定',mode:'待計算'};
 const shown=checkpointRowDisplay({start_elapsed_s:cp.start_elapsed_s??0,arrival_elapsed_s:cp.arrival_elapsed_s,departure_elapsed_s:cp.departure_elapsed_s});
 const show=s=>checkpointTimeText(s,startClock);
 return {name,distance,arrival:show(shown.arrival_elapsed_s),departure:show(shown.departure_elapsed_s),stop:duration(shown.stops_s),mode:mode==='prediction'?'完賽預估':'目標配速'};
}
