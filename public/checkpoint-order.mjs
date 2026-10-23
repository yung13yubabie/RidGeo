/** Pure order preview. No input coercion, row mutation, deduplication or stop validation. */
const fail=(message,ids=[])=>{throw Object.assign(Error(message),{code:'checkpoint_order_unavailable',rowIds:ids});};
export function previewCheckpointOrder(rows,distanceM){
 if(!Array.isArray(rows)||rows.length>100||!Number.isFinite(distanceM)||distanceM<=0)fail('請先導入可用的目前路線。');
 const seen=new Set(),positions=new Map(),entries=[];
 for(const [index,row]of rows.entries()){
  if(typeof row?.id!=='string'||!row.id||row.id.length>256||seen.has(row.id))fail('站點身分尚未確認，未更動順序。');seen.add(row.id);
  if(typeof row.locationPending!=='boolean'||row.locationPending||typeof row.distanceRaw!=='string'||!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/u.test(row.distanceRaw.trim())||row.distanceRaw.length>256||row.fieldValid!==true)fail('請先填寫並確認每站目前里程，再預覽順序。',[row.id]);
  const distance=Number(row.distanceRaw)*1000;
  if(!Number.isFinite(distance)||distance<=0||distance>distanceM)fail('站點里程須大於零且不超過目前路線終點。',[row.id]);
  if(positions.has(distance))fail('兩站目前里程相同；請確認經過位置，未合併或移除任何站點。',[positions.get(distance),row.id]);positions.set(distance,row.id);
  entries.push(Object.freeze({id:row.id,name:typeof row.name==='string'?row.name.slice(0,80):row.id,distanceM:distance,index}));
 }
 const ordered=[...entries].sort((a,b)=>a.distanceM-b.distanceM||a.index-b.index);
 return Object.freeze({changed:ordered.some((row,i)=>row.id!==entries[i].id),order:Object.freeze(ordered),originalIds:Object.freeze(entries.map(row=>row.id))});
}
