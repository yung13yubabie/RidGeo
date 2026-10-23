import {readTimeInput} from './segmented-time-input.mjs';
import {createErrorNavigator} from './error-navigation.js';
/** Separate historical-reference UI. No goal-field reads and no network storage. */
export function createAbilityUI({request,cancelWorker,onModeChange,getRoute}){
  const $=id=>document.getElementById(id);let controller=null,generation=0;
  const errors=createErrorNavigator({feedback:$('ability-feedback'),mode:'ability'});
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const format=s=>{const n=Math.round(s);return `${String(Math.floor(n/3600)).padStart(2,'0')}:${String(Math.floor(n/60)%60).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;};
  const fieldError=(id,text)=>Object.assign(new Error(text),{fieldIds:[id]});
  const day=(id,label)=>{const value=$(id).value,parsed=/^\d{4}-\d{2}-\d{2}$/u.test(value)&&!value.startsWith('0000')?Date.parse(value+'T00:00:00Z'):NaN;if(!Number.isFinite(parsed)||new Date(parsed).toISOString().slice(0,10)!==value)throw fieldError(id,`請確認${label}。`);return value;};
  const duration=(id,label)=>{const m=/^(\d{1,3}):([0-5]\d):([0-5]\d)$/.exec(readTimeInput($(id),label).trim());if(!m)throw Object.assign(new Error(`${label}請填時:分:秒。`),{fields:[$(id)]});return +m[1]*3600 + +m[2]*60 + +m[3];};
  const num=(id,label)=>{const e=$(id);if(!e.value.trim()||!Number.isFinite(Number(e.value))||!e.checkValidity())throw fieldError(id,`請確認${label}。`);return Number(e.value);};
  const message=(text,error=false)=>{errors.clear();$('ability-feedback').textContent=text;$('ability-feedback').className=`feedback ${error?'error':''}`;$('ability-feedback').hidden=!text;};
  const clear=()=>{$('ability-result').hidden=true;$('ability-value').textContent='—';};
  function cancel(){generation++;if(controller){controller.abort();cancelWorker();controller=null;}$('ability-calculate').disabled=false;$('ability-cancel').hidden=true;clear();}
  const reset=()=>{cancel();message('');};
  const method=()=>{reset();const same=$('ability-method').value==='same_route_reference';$('ability-same-fields').hidden=!same;$('ability-flat-fields').hidden=same;$('ability-same-confirm').checked=false;};
  $('ability-target-date').value=today();
  for(const [id,mode] of [['goal-mode','goal'],['ability-mode','ability']])$(id).addEventListener('click',()=>{if($(id).getAttribute('aria-pressed')==='true')return;reset();onModeChange(mode);$('planner-form').hidden=mode!=='goal';$('ability-workspace').hidden=mode!=='ability';$('goal-mode').setAttribute('aria-pressed',String(mode==='goal'));$('ability-mode').setAttribute('aria-pressed',String(mode==='ability'));$('ability-same-confirm').checked=false;});
  $('ability-method').addEventListener('change',method);
  $('ability-panel').addEventListener('input',reset);
  $('ability-cancel').addEventListener('click',()=>{const restoreFocus=document.activeElement===$('ability-cancel');cancel();message('已取消，可以重新計算。');if(restoreFocus&&!$('ability-calculate').closest('[hidden]'))$('ability-calculate').focus({preventScroll:true});});
  $('ability-panel').addEventListener('submit',async event=>{
    event.preventDefault();reset();let reference;
    try{
      const mode=$('ability-method').value;reference={mode,history_elapsed_s:duration('ability-history-time','已完成總時間'),history_completed_on:day('ability-history-date','該次完成日期'),forecast_as_of:today(),target_start:day('ability-target-date','本次目標日期')};
      if(reference.target_start<reference.forecast_as_of)throw fieldError('ability-target-date','本次目標日期不能早於今天。');
      if(reference.history_completed_on>=reference.forecast_as_of||reference.history_completed_on>=reference.target_start)throw fieldError('ability-history-date','歷史完成日期須早於今天與本次目標日期。');
      if(mode==='same_route_reference'){
        if(!getRoute())throw new Error('請先導入本次要重跑的路線。');
        if(!$('ability-same-confirm').checked)throw fieldError('ability-same-confirm','請先確認這筆成績是同一路線、同方向。');
        const old=$('ability-history-stops').value.trim(),next=$('ability-target-stops').value.trim();
        reference={...reference,same_route_confirmed:true,history_stops_s:old?num('ability-history-stops','過去停站分鐘')*60:null,target_stops_s:next?num('ability-target-stops','本次停站分鐘')*60:null};
        if(reference.history_stops_s!==null&&reference.history_stops_s>=reference.history_elapsed_s)throw fieldError('ability-history-stops','過去停站須少於已完成總時間。');
      }else reference={...reference,sport:$('ability-sport').value,history_distance_m:num('ability-history-distance','過去距離')*1000,target_distance_m:num('ability-target-distance','參考距離')*1000};
    }catch(error){message(error.message,true);errors.show(error,{form:$('ability-panel')});return;}
    const token=++generation;controller=new AbortController();$('ability-calculate').disabled=true;$('ability-cancel').hidden=false;message('正在計算歷史表現參考…');
    try{
      const result=await request({reference},controller.signal);if(token!==generation)return;
      if(result.status!=='reference_available'){const reasons={history_older_than_365_days:'這筆成績距離目標日期超過一年，請提供較近期實績。',history_stops_required_to_change_stops:'要調整停站，須先提供過去停站時間。',same_route_not_confirmed:'請確認同一路線與方向。',road_or_track_domain_required:'公路支援 5–42.195 km；田徑支援 1.5–10 km。不同越野路線尚無可用校準。'};const text=reasons[result.reason]||'目前資料不足以提供參考。';message(text,true);errors.show({code:result.reason,message:text},{form:$('ability-panel')});return;}
      $('ability-value').textContent=format(result.central_seconds);const same=result.mode==='same_route_reference';$('ability-result-title').textContent=same?'同路線重跑參考':'公路／田徑距離參考';$('ability-result-note').textContent=same?(result.moving_seconds===null?'沿用已完成總時間，已含歷史停站。':'歷史移動 '+format(result.moving_seconds)+' ＋本次停站 '+format(result.stops_seconds)):'依已完成實績作固定指數 1.06 距離換算；不含越野坡度。';$('ability-model-note').textContent=same?'假設體能、努力程度、天候與路況相近；尚未校準變化或預測區間。':result.model==='same_distance_carry_forward_unvalidated'?'相同距離沿用上次成績，尚未校準預測區間。':'固定耐力指數不是個人量測值，尚未校準預測區間。';$('ability-result').hidden=false;message('');
    }catch(error){if(token===generation&&error.name!=='AbortError'){message(error.message,true);errors.show(error,{form:$('ability-panel')});}}
    finally{if(token===generation){controller=null;$('ability-calculate').disabled=false;$('ability-cancel').hidden=true;}}
  });
  return {cancel,cancelPending(){if(controller)cancel();},resetRoute(source){reset();$('ability-same-confirm').checked=false;$('ability-target-date').value=source?.raceDate||today();}};
}
