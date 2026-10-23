/** Optional exact-core preflight. Original errors remain usable until explicit Apply. */
import {createGoalTargetCandidate,validateGoalTargetCandidate,prepareGoalTargetApplication} from './goal-target-suggestions.mjs';

export function sameGoalRequest(before,current){
  return !!before?.snapshot&&!!current?.snapshot&&before.gpx_b64===current.gpx_b64
    &&before.rawSignature===current.rawSignature
    &&JSON.stringify(before.snapshot)===JSON.stringify(current.snapshot);
}
export function createGoalTargetSuggestionUI({container,getCurrent,request,isForegroundBusy,onApply,onRejected=()=>{},onPendingChange=()=>{},documentImpl=globalThis.document}){
  const doc=documentImpl;let generation=0,controller=null,box=null,active=null;
  const current=()=>{try{return getCurrent();}catch{return null;}};
  function clear(){generation++;active=null;const pending=controller;controller=null;if(pending)pending.abort();box?.remove();box=null;onPendingChange();}
  async function offer(error,captured){
    clear();const live=current();if(isForegroundBusy()||!sameGoalRequest(captured,live))return;
    const created=createGoalTargetCandidate({error,snapshot:captured.snapshot},live.snapshot);
    if(created.status!=='candidate')return;
    const candidate=created.candidate,token=generation,abort=new AbortController();controller=abort;
    box=doc.createElement('div');box.className='goal-target-suggestion';box.setAttribute('role','status');
    const note=doc.createElement('p');note.textContent='正在核對可計算目標…';
    const cancel=doc.createElement('button');cancel.type='button';cancel.className='text-button';cancel.textContent='取消建議';cancel.addEventListener('click',clear);box.append(note,cancel);container.append(box);onPendingChange();
    try{
      const result=await request({gpx_b64:captured.gpx_b64,settings:candidate.settings},abort.signal);
      if(token!==generation||abort.signal.aborted)return;
      controller=null;onPendingChange();
      const fresh=current();if(isForegroundBusy()||!sameGoalRequest(captured,fresh)){clear();return;}
      const checked=validateGoalTargetCandidate(candidate,fresh.snapshot,{candidateKey:candidate.key,response:{ok:true,result}});
      if(checked.status!=='proposal'){clear();return;}
      const proposal=checked.proposal;active={proposal,captured};box.replaceChildren();
      const preview=doc.createElement('p');preview.className='suggestion-value';preview.textContent=`完賽時間 ${candidate.change.before} → ${candidate.change.after}`;
      const meaning=doc.createElement('p');meaning.className='hint';meaning.textContent='目前限速可分配；非能力預測，不保證關門。';box.append(preview,meaning);
      for(const warning of proposal.warnings){const p=doc.createElement('p');p.className='hint warning';p.textContent=typeof warning?.message==='string'?warning.message:'此目標仍有計算提醒。';box.append(p);}
      const apply=doc.createElement('button');apply.type='button';apply.className='secondary';apply.textContent='套用並重新計算';
      apply.addEventListener('click',async()=>{
        if(token!==generation||active?.proposal!==proposal||isForegroundBusy())return;
        const live=current();if(!sameGoalRequest(captured,live)){clear();return;}
        const ready=prepareGoalTargetApplication(proposal,live.snapshot);if(ready.status!=='ready'){clear();return;}
        apply.disabled=true;
        try{await onApply({proposal,captured});}finally{if(token===generation)clear();}
      });
      const dismiss=doc.createElement('button');dismiss.type='button';dismiss.className='text-button';dismiss.textContent='保留原值';dismiss.addEventListener('click',clear);box.append(apply,dismiss);
    }catch(failure){
      if(token!==generation||abort.signal.aborted)return;
      controller=null;clear();
      if(failure.name!=='AbortError'&&sameGoalRequest(captured,current()))onRejected(failure,error);
    }finally{if(token===generation){controller=null;onPendingChange();}}
  }
  return {offer,clear,get pending(){return controller!==null;}};
}
