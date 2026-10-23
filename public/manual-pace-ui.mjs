import {readTimeInput,visibleTimeField} from './segmented-time-input.mjs';
import {buildTerrainSegments} from './terrain-segments.mjs';
import {buildCheckpointGroups} from './checkpoint-groups.mjs';
import {checkpointTimeText} from './checkpoint-time.mjs';
import {checkpointDeadline,assessDeadline} from './cutoff-view.js';
import {createManualPaceState,previewManualPace,previewManualUnlock,receiveManualPacePreview,
  applyManualPacePreview,cancelManualPacePreview,resetManualPaceState,undoManualPaceState,manualChildIds,restoreVerifiedManualPaceState} from './manual-pace-state.mjs';
/** Select displayed terrain or a whole exact CP leg, never an elapsed-pace row.
 * Both paths resolve to the same immutable raw IDs at the owner boundary. */
export function manualPaceChoices(plan,terrainRows){
  const summary=buildCheckpointGroups(plan,terrainRows),groups=summary.mode==='checkpoints'?summary.groups:[{...summary.totals,start_m:0,end_m:summary.totals.distance_m,label:'起點 → 終點',children:terrainRows}];
  return [...groups.map(row=>({...row,manualChoice:'checkpoint',unknown_distance_m:row.children.reduce((total,child)=>total+(child.unknown_distance_m??0),0)})),...terrainRows];
}
const choiceKey=row=>`${row.manualChoice==='checkpoint'?'cp:':''}${row.start_m}:${row.end_m}`;
/** Compact, explicit clock-only editor. Never supplies physiological defaults. */
export function createManualPaceUI({getContext,getRows,request,cancelWorker,applyResult,onAdmissionRejected,onBusyChange=()=>{},isReadOnlyBusy=()=>false,isReadBlocked=()=>false,clockAdapter=null,getClockView=()=>({}),onStale=()=>{},documentImpl=globalThis.document}){
  const doc=documentImpl,$=id=>doc.getElementById(id);let session=null,visiblePlan=null,controller=null,generation=0,rows=[],paceDraft=false,paceDraftPlan=null;
  const key=value=>JSON.stringify(value),same=(a,b)=>key(a)===key(b);
  const duration=value=>{const n=Math.floor(value+.5);return `${Math.floor(n/3600)}:${String(Math.floor(n/60)%60).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;};
  const paceText=value=>{const n=Math.floor(value+.5);return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;};
  const status=text=>{$('manual-pace-status').textContent=text;$('manual-pace-status').hidden=!text;};
  const current=()=>{const ctx=getContext();return ctx&&(ctx.clockFamily==='A'||!session||same(ctx.snapshot,session.snapshot)&&ctx.plan===visiblePlan)?ctx:null;};
  const rowKey=choiceKey;
  function clockPreview(ctx,a){
    const holder=$('manual-pace-clock-preview'),list=$('manual-pace-clock-lines');if(!holder||!list)return '';
    const next=a?(a.previewKind==='manual'&&a.hasPreview?a.preview?.plan:null):session?.preview?.result;
    holder.hidden=!ctx||!next;list.replaceChildren();if(!ctx||!next)return '';
    const {startTime,deadlineContext}=getClockView(),deadline=cp=>deadlineContext?checkpointDeadline(cp,deadlineContext):assessDeadline({cutoffElapsed:cp.cutoff_elapsed_s??null,kind:cp.cutoff_kind,arrival:cp.arrival_elapsed_s,departure:cp.departure_elapsed_s});
    let missed=0;
    for(const [index,cp]of next.checkpoints.entries()){
      const before=ctx.plan.checkpoints[index],prior=deadline(before),after=deadline(cp),item=doc.createElement('li'),name=doc.createElement('strong');item.dataset.occurrenceIndex=String(index);name.textContent=`${index+1}. ${cp.name} · ${(cp.distance_m/1000).toFixed(3)} km`;
      const line=(text,className='')=>{const node=doc.createElement('span');node.textContent=text;node.className=className;item.append(node);};item.append(name);
      line(`目前 到 ${checkpointTimeText(before.arrival_elapsed_s,startTime)} · 離 ${checkpointTimeText(before.departure_elapsed_s,startTime)}`);
      line(`預覽 到 ${checkpointTimeText(cp.arrival_elapsed_s,startTime)} · 離 ${checkpointTimeText(cp.departure_elapsed_s,startTime)}`);
      const kind=after.kind??prior.kind,kindText=kind==='departure'?'離站':kind==='arrival'?'到站':after.status==='unknown'&&prior.status==='unknown'?'':'依據待核';line(`關門${kindText?`（${kindText}）`:''} ${prior.label} → ${after.label}`,`manual-preview-cutoff ${after.status}`);if(after.status==='missed')missed++;list.append(item);
    }
    return missed?` ${missed} 站預覽超過關門，請查看到離站與關門。`:'';
  }
  function controls(){
    if(isReadBlocked())return;
    const ctx=current(),a=ctx?.clockFamily==='A'?clockAdapter?.getState():null,working=!!controller||isReadOnlyBusy()===true||!!a?.working,has=!!ctx,editable=rows.some(row=>!(row.unknown_distance_m>0)),locks=a?(ctx.clockLocks??[]):session?.locks??[];
    for(const id of ['manual-pace-section','manual-pace-value','manual-pace-preview'])$(id).disabled=working||!has||!editable;
    const terrainLevel=$('manual-terrain-level');if(terrainLevel)terrainLevel.disabled=working||!has;
    $('manual-pace-apply').disabled=working||!has||(a?!(a.hasPreview&&a.previewKind==='manual'):!session?.preview);
    $('manual-pace-cancel').disabled=a?!paceDraft&&!a.working&&a.previewKind!=='manual':!paceDraft&&!working&&!session?.preview&&!session?.pending;
    $('manual-pace-reset').disabled=working||!locks.length||!has;
    $('manual-pace-undo').disabled=working||!has||(a?!a.canUndo:!session?.undo);
    $('manual-pace-unlock').disabled=working||!locks.length||!has;
    $('manual-pace-lock').disabled=working||!locks.length||!has;
    clockPreview(ctx,a);$('manual-pace-panel').removeAttribute('aria-busy');$('manual-pace-section').closest('.field-grid')?.setAttribute('aria-busy',String(working));$('manual-pace-locks').setAttribute('aria-busy',String(working));onBusyChange(working);
  }
  function selectPace(){const row=rows.find(row=>rowKey(row)===$('manual-pace-section').value);if(row)$('manual-pace-value').value=paceText(row.moving_s/(row.end_m-row.start_m)*1000);}
  function refresh(){
    if(isReadBlocked())return;
    const ctx=getContext();if(paceDraft&&ctx?.plan!==paceDraftPlan){paceDraft=false;paceDraftPlan=null;}if(session&&(!ctx||!same(ctx.snapshot,session.snapshot)||ctx.plan!==visiblePlan)){session=null;visiblePlan=null;generation++;controller?.abort();controller=null;}
    $('manual-pace-panel').hidden=!ctx;
    const chosen=$('manual-pace-section').value,previous=$('manual-pace-lock').value;
    rows=ctx?manualPaceChoices(ctx.plan,getRows(ctx.plan)):[];$('manual-pace-section').replaceChildren();
    for(const row of rows){const option=doc.createElement('option');option.value=rowKey(row);option.textContent=`${row.manualChoice==='checkpoint'?'補站區間 · ':''}${row.label} · ${(row.start_m/1000).toFixed(3)}–${(row.end_m/1000).toFixed(3)} km`;if(row.unknown_distance_m>0)option.disabled=true;$('manual-pace-section').append(option);}
    if(rows.some(row=>rowKey(row)===chosen))$('manual-pace-section').value=chosen;
    else{if(chosen&&(controller||session?.pending||session?.preview))cancel();paceDraft=false;paceDraftPlan=null;const initial=rows.find(row=>!row.manualChoice&&!(row.unknown_distance_m>0))??rows.find(row=>!(row.unknown_distance_m>0));if(initial)$('manual-pace-section').value=rowKey(initial);selectPace();}
    const locks=ctx?.clockFamily==='A'?(ctx.clockLocks??[]):session?.locks??[],raw=ctx?.clockFamily==='A'?(ctx.clockRawSections??[]):session?.prepared.raw_sections??[];
    const childById=new Map(raw.map(row=>[row.id,row]));
    $('manual-pace-lock').replaceChildren();for(const lock of locks){const option=doc.createElement('option');option.value=lock.id;const first=childById.get(lock.child_ids[0]),last=childById.get(lock.child_ids.at(-1));option.textContent=`${(first.start_m/1000).toFixed(3)}–${(last.end_m/1000).toFixed(3)} km · ${paceText(lock.moving_pace_s_per_km)}/km`;$('manual-pace-lock').append(option);}
    if(locks.some(lock=>lock.id===previous))$('manual-pace-lock').value=previous;
    $('manual-pace-locks').hidden=!locks.length;if(ctx&&!rows.some(row=>!(row.unknown_distance_m>0)))status('缺海拔，暫無可調整坡段。請先確認路線資料。');controls();
  }
  function restoreCancelFocus(focused){if(!focused)return;const target=!$('manual-pace-preview').disabled?$('manual-pace-preview'):$('manual-pace-panel').querySelector('summary');if(target?.isConnected!==false)target?.focus({preventScroll:true});}
  function cancel(){if(isReadOnlyBusy()===true&&!controller)return;const focused=doc.activeElement===$('manual-pace-cancel');generation++;paceDraft=false;paceDraftPlan=null;if(getContext()?.clockFamily==='A'){clockAdapter?.cancel();status('已取消配速預覽，目前完整方案保持不變。');controls();restoreCancelFocus(focused);return;}controller?.abort();controller=null;cancelWorker?.();session=cancelManualPacePreview(session);status('已取消預覽，目前配速表保持不變。');controls();restoreCancelFocus(focused);}
  function invalidate(){paceDraft=false;paceDraftPlan=null;generation++;controller?.abort();controller=null;session=null;visiblePlan=null;status('');refresh();}
  async function preview(unlock=false){
    if(controller||isReadOnlyBusy()===true)return;const ctx=current();if(!ctx){invalidate();onStale();return;}
    const selected=rows.find(row=>rowKey(row)===$('manual-pace-section').value);if(!unlock&&(!selected||selected.unknown_distance_m>0)){status('目前沒有可鎖定區間，請先確認路線海拔或選擇可用坡段。');return;}
    let paceValue;try{paceValue=unlock?$('manual-pace-value').value:readTimeInput($('manual-pace-value'),'移動配速');}catch(error){status(error.message);visibleTimeField($('manual-pace-value')).focus();return;}
    const row=rows.find(row=>rowKey(row)===$('manual-pace-section').value),paceMatch=/^(\d{1,4}):([0-5]\d)$/.exec(paceValue.trim());
    if(!unlock&&(!row||!paceMatch)){status('移動配速請填分:秒，例如 08:30。');return;}
    const pace=paceMatch?Number(paceMatch[1])*60+Number(paceMatch[2]):null;
    if(ctx.clockFamily==='A'){
      try{const childIds=unlock?null:manualChildIds({prepared:{raw_sections:ctx.clockRawSections}},row);await runClock(()=>clockAdapter.preview(unlock?{kind:'manual_unlock',lockId:$('manual-pace-lock').value}:{kind:'manual_lock',childIds,pace}),'preview');}catch(error){clockAdapter?.cancel();status(error.message||'配速預覽未完成。');controls();}return;
    }
    const token=++generation;controller=new AbortController();const running=controller;
    const initiator=doc.activeElement,restoreFrom=initiator===$(unlock?'manual-pace-unlock':'manual-pace-preview')?initiator:null;let focusMoved=false,focusOutcome=null;
    const trackFocus=event=>{if(event.target!==restoreFrom&&event.target!==doc.body)focusMoved=true;};
    const trackIntent=()=>{focusMoved=true;};
    if(restoreFrom){doc.addEventListener('focusin',trackFocus,true);doc.addEventListener('pointerdown',trackIntent,true);doc.addEventListener('keydown',trackIntent,true);}
    controls();status('正在核對配速與速度限制…');
    try{
      if(!session){
        const raw_sections=buildTerrainSegments(ctx.plan).map((row,index)=>({id:`raw-${index}`,start_m:row.start_m,end_m:row.end_m}));
        const payload={gpx_b64:ctx.gpx_b64,settings:ctx.settings,raw_sections,checkpoint_ids:ctx.checkpointIds,owner_revision:ctx.ownerRevision};
        const prepared=await request('manual_pace_prepare',payload,running);
        const live=getContext();if(token!==generation||running.signal.aborted||!live||!same(ctx.snapshot,live.snapshot))return;
        session=createManualPaceState({prepared,request:payload,snapshot:ctx.snapshot});visiblePlan=ctx.plan;
      }
      const started=unlock?previewManualUnlock(session,$('manual-pace-lock').value,ctx.snapshot):previewManualPace(session,{childIds:manualChildIds(session,row),pace},ctx.snapshot);
      session=started.state;
      const result=await request('manual_pace_recalculate',started.payload,running);
      const live=getContext();if(token!==generation||running.signal.aborted||!live||!same(ctx.snapshot,live.snapshot))return;
      session=receiveManualPacePreview(session,started.ticket,result,live.snapshot);focusOutcome='ready';
      status(`原目標 ${duration(session.prepared.baseline_plan.target_elapsed_s)}；目前表 ${duration(session.current.target_elapsed_s)} → 預覽完賽 ${duration(result.revised_finish_elapsed_s)}。停留不變；尚未估疲勞連動。尚未套用。${clockPreview(ctx,null)}`);
    }catch(error){if(token===generation&&!running.signal.aborted){
      // Source admission is independent of pace/model eligibility. Only the
      // parent can retire its current source; late/canceled work never calls it.
      if(error.admissionRejected===true){onAdmissionRejected?.(error,ctx);return;}
      session=cancelManualPacePreview(session);focusOutcome='error';status(error.message||'配速預覽未完成，目前配速表保持不變。');
    }}
    finally{
      if(restoreFrom){doc.removeEventListener('focusin',trackFocus,true);doc.removeEventListener('pointerdown',trackIntent,true);doc.removeEventListener('keydown',trackIntent,true);}
      if(token===generation){controller=null;controls();const live=current();if(focusOutcome&&restoreFrom&&!focusMoved&&live&&same(ctx.snapshot,live.snapshot)&&(doc.activeElement===doc.body||doc.activeElement===restoreFrom)){const destination=focusOutcome==='ready'?$('manual-pace-apply'):visibleTimeField($('manual-pace-value'));if(!destination.disabled)destination.focus({preventScroll:true});}}
    }
  }
  async function runClock(action,mode='apply'){
    const ctx=current();if(ctx?.clockFamily!=='A'||!clockAdapter)return;const token=++generation;
    status('正在核對目前移動配速與停留…');
    try{const result=await action();if(token!==generation)return;const plan=result?.plan??result;if(mode!=='preview'){paceDraft=false;paceDraftPlan=null;}
      if(plan?.clock_transaction)status(`目前完賽 ${duration(plan.clock_transaction.prior.finishElapsedS)} → ${mode==='preview'?'預覽':'重算'} ${duration(plan.target_elapsed_s)}。沿用目前已套用停留；未估疲勞連動。${mode==='preview'?'尚未套用。':''}${mode==='preview'?clockPreview(ctx,clockAdapter.getState()):''}`);
      else status('已還原完整方案。');
    }catch(error){if(token===generation)status(error.message||'配速操作未完成，目前方案保持不變。');}
    finally{if(token===generation)refresh();}
  }
  function commit(action){
    if(controller||isReadOnlyBusy()===true)return;const ctx=current();if(!ctx){invalidate();onStale();return;}if(ctx.clockFamily==='A'){const actionA=action===applyManualPacePreview?()=>clockAdapter.apply():action===resetManualPaceState?()=>clockAdapter.reset():()=>clockAdapter.undo();return runClock(actionA);}if(!ctx||!session)return;const before=session;
    try{
      const next=action(session,ctx.snapshot);session=next;visiblePlan=next.current;
      try{applyResult(next.current);}catch(error){session=before;visiblePlan=before.current;applyResult(before.current);throw error;}
      status(next.current.purpose==='manual_pace_clock_preview'?`已套用。原目標 ${duration(next.prepared.baseline_plan.target_elapsed_s)}；重算完賽 ${duration(next.current.target_elapsed_s)}。`:'已還原初始目標配速。');refresh();
    }catch(error){status(error.message||'配速操作未完成。');controls();}
  }
  $('manual-pace-section').addEventListener('change',()=>{generation++;paceDraft=false;paceDraftPlan=null;if(getContext()?.clockFamily==='A')clockAdapter?.cancel();session=cancelManualPacePreview(session);status('');selectPace();controls();});
  $('manual-pace-value').addEventListener('input',()=>{if(getContext()?.clockFamily==='A'){generation++;paceDraft=true;paceDraftPlan=getContext()?.plan??null;clockAdapter?.cancel();status('');controls();return;}if(controller)cancel();else{session=cancelManualPacePreview(session);status('');}paceDraft=true;paceDraftPlan=getContext()?.plan??null;controls();});
  $('manual-pace-preview').addEventListener('click',()=>preview(false));
  $('manual-pace-unlock').addEventListener('click',()=>preview(true));
  $('manual-pace-apply').addEventListener('click',()=>commit(applyManualPacePreview));
  $('manual-pace-cancel').addEventListener('click',cancel);
  $('manual-pace-reset').addEventListener('click',()=>commit(resetManualPaceState));
  $('manual-pace-undo').addEventListener('click',()=>commit(undoManualPaceState));
  refresh();return {refresh,invalidate,cancel,isBusy:()=>!!controller,getState:()=>isReadBlocked()?null:session,hasDraft:()=>paceDraft,
    restoreVerified(value){paceDraft=false;paceDraftPlan=null;generation++;controller?.abort();controller=null;session=restoreVerifiedManualPaceState({...value,generation:Math.max(generation,value.generation??0)+1});visiblePlan=value.result;return session;}};
}
