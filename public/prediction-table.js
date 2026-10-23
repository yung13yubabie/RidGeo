import {renderCheckpointSchedule} from './schedule-view.mjs';
const views=new WeakMap();
/** Read-only view state; no input/transport/model changes when displaying another terrain level. */
export function renderPredictionTable(container,prediction,startTime,deadlineContext,options={}){
  if(!prediction.terrain_display_compatible)throw new Error('停留位置尚未指定，無法顯示逐站預估。');
  let state=views.get(container);if(!state||state.prediction!==prediction){state={prediction,expanded:new Set()};views.set(container,state);}
  return renderCheckpointSchedule(container,prediction,{startTime,deadlineContext,expanded:state.expanded,...options});
}
