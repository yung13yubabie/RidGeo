import {HikingTimer} from './live-timer.mjs';
import {LocationProvider} from './live-location.mjs';

// Presentation/session ownership only. Route work and ETA remain in Python.
export function durationText(ms, milliseconds=false) {
  if(!Number.isFinite(ms)||ms<0)return '—';
  const seconds=Math.floor(ms/1000);
  return `${String(Math.floor(seconds/3600)).padStart(2,'0')}:${String(Math.floor(seconds/60)%60).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}${milliseconds?'.'+String(Math.floor(ms)%1000).padStart(3,'0'):''}`;
}
export function routeIdentity(context) {
  return context?.route&&!context.route.blocked&&context.route.elevation_complete&&context.gpx_b64&&context.ready
    ? `${context.route.route_sha256}:${context.route.geometry_sha256}` : null;
}
export function createLiveUI({root,getContext,request,document:doc=globalThis.document,clock=()=>performance.now(),wallNow=()=>Date.now(),providerFactory=options=>new LocationProvider(options)}) {
  root.innerHTML=`<details><summary><strong>行進中</strong> · 前景實驗</summary>
  <p class="hint">保留原規劃功能。先確認 GPX，再明確設定登山口、出發時間與目標。定位只在此頁可見且你按啟用後運作；切換頁面即停止定位，返回後須再按啟用。不是背景導航。</p>
  <p id="live-route" role="status">請先導入通過檢查且海拔完整的 GPX。</p>
  <fieldset id="live-setup"><legend>本次行程</legend><div class="field-grid">
  <label>登山口／起點名稱<input id="live-trailhead" type="text" maxlength="80" placeholder="請填本次起點"></label>
  <label>起點沿線里程（km）<input id="live-start-km" type="number" min="0" step="0.001" value="0"></label>
  <label>出發日期與時間（本機時區）<input id="live-start-time" type="datetime-local"></label><button id="live-now" type="button" class="secondary">填入現在</button>
  <label>目標<select id="live-target"></select></label><label>自訂山頂／CP 名稱<input id="live-target-name" maxlength="80" placeholder="僅自訂目標需要"></label>
  <label>自訂目標沿線里程（km）<input id="live-target-km" type="number" min="0" step="0.001"></label></div>
  <button id="live-start" type="button">開始本次前景計時</button></fieldset>
  <p id="live-session" class="hint">尚未開始。出發時刻僅作行程標記，不會把之前未觀察的時間假稱移動或停止。</p>
  <div class="actions"><button id="live-location" type="button" class="secondary" disabled>啟用／恢復前景定位</button><button id="live-location-stop" type="button" class="secondary" disabled>關閉定位</button><button id="live-end" type="button" class="secondary" disabled>結束本次計時</button></div>
  <p id="live-location-state" role="status" aria-live="polite">定位未啟用；座標不會上傳或保存。</p>
  <label>計時判定<select id="live-override" disabled><option value="auto">自動判定（證據不足為未知）</option><option value="pause">手動暫停（不自動恢復）</option><option value="run">手動指定移動（僅前景）</option></select></label>
  <label class="check-option"><input id="live-ms" type="checkbox">顯示毫秒（帳本格式，不代表 GPS 精度）</label>
  <p id="live-timer">尚未計時。</p><p class="hint">停止須有足夠靜止證據。訊號差、過期、跳點或頁面隱藏均記為未知，不會當成休息。自動判定閾值尚未手機實測校準；重新整理會遺失本次帳本。</p>
  <fieldset id="live-estimate-fields" disabled><legend>手動確認進度與 ETA</legend><p class="hint">自動定位初始等待通常會累積未知時間，因此完整路段 ETA 通常仍需手動確認移動時間。此階段尚未自動貼合路線。請依 GPX 沿線里程填入目前進度，迴圈／折返須確認正確經過位置。GPS 只供計時判定，不會偷用最近點猜進度。</p><div class="field-grid">
  <label>目前沿線里程（km）<input id="live-progress" type="number" min="0" step="any"></label>
  <label>時間來源<select id="live-time-source"><option value="manual">手動確認同段時間</option><option value="timer">本次前景帳本（不含未知，須從起點開始）</option></select></label>
  <label>同段累計經過時間（分鐘）<input id="live-elapsed" type="number" min="0" step="0.01"></label>
  <label>其中移動時間（分鐘）<input id="live-moving" type="number" min="0" step="0.01"></label>
  <label>未來停留（分鐘；未知留空）<input id="live-stops" type="number" min="0" step="0.1"></label></div>
  <label class="check-option"><input id="live-at-target" type="checkbox">我已到達所選目標（直接採用該目標的已核對沿線里程，不以 GPS 判定；不把手填值自動夾到終點）</label>
  <label class="check-option"><input id="live-aligned" type="checkbox">我確認進度與時間涵蓋同一次行程、同一起點至目前位置；若用帳本，開始計時前沒有未記錄的路段。</label>
  <button id="live-estimate" type="button">估算至選定目標</button></fieldset>
  <p id="live-result" role="status" aria-live="polite">EP = 距離 km + 爬升 m / 100，僅工程比較指標，不是生理定律。未套用疲勞百分比；未來停留未知時不給到達時刻。</p>
  <p class="hint">開發候選：尚未可安裝／離線驗證，不保證離線地圖。請保留可靠導航與緊急備援。</p></details>`;
  const $=id=>root.querySelector('#'+id);
  let timer=null,session=null,revision=0,pending=null,lastRoute=null,targetSignature='',disposed=false;
  const result=text=>{$('live-result').textContent=text;};
  const fail=error=>result(error?.message||'無法完成，請核對資料後再試。');
  const provider=providerFactory({document:doc,monotonicNow:clock,wallNow,onFix:fix=>{if(session&&timer?.snapshot().running){timer.fix(fix);renderTimer();}},onState:status=>{
    const names={idle:'定位未啟用',acquiring:'正在取得前景定位',active:'前景定位中',hidden:'頁面已隱藏，定位已關閉',denied:'未允許定位，可改用手動時間',error:'定位不可用，計時保留未知',unsupported:'裝置未提供定位'};
    $('live-location-state').textContent=(names[status.state]||'定位未啟用')+'；不保存或上傳座標。'+(status.reason==='wall-clock-discontinuity'?' 裝置時鐘變動，請結束計時後重新開始。':'');
    if(timer&&(timer.snapshot().hidden!==(doc.hidden===true)||['idle','error','denied','unsupported','acquiring'].includes(status.state)))timer.setHidden(doc.hidden===true);renderTimer();
  }});
  function renderTimer(){
    if(!timer)return;
    const view=timer.tick(),ms=$('live-ms').checked;
    const stateNames={IDLE:'已結束',ACQUIRING:'等待證據',MOVING:'移動',STOPPED:'靜止',UNCERTAIN:'未知',SUSPENDED:'頁面隱藏'};
    $('live-timer').textContent=`${stateNames[view.state]||'未知'}${view.override==='auto'?'':view.override==='pause'?' · 手動暫停':' · 手動移動'}｜經過 ${durationText(view.elapsedMs,ms)} · 移動 ${durationText(view.movingMs,ms)} · 自動靜止 ${durationText(view.stoppedMs,ms)} · 手動暫停 ${durationText(view.manualMs,ms)} · 未知 ${durationText(view.unknownMs,ms)}`;
  }
  function end(message='本次計時已結束。可開始新行程；舊帳本不會接到新路線。'){
    revision++;pending?.abort();pending=null;provider.stop();timer?.stop();session=null;
    $('live-setup').disabled=!routeIdentity(getContext());$('live-estimate-fields').disabled=true;
    for(const id of ['live-location','live-location-stop','live-end','live-override'])$(id).disabled=true;
    $('live-session').textContent=message;result('本次計時已結束，先前 ETA／到達時刻已失效。請開始新行程後重新估算。');renderTimer();
  }
  function refresh(){
    if(disposed)return;
    const context=getContext(),identity=routeIdentity(context);
    if(session&&identity!==session.identity){end('路線已改變或不再符合條件，已停止本次定位與計時。請重新確認行程。');result('原 ETA 已失效，請重新開始行程。');}
    $('live-setup').disabled=!!session||!identity;
    if(identity!==lastRoute){lastRoute=identity;targetSignature='';$('live-route').textContent=identity?`已核對路線 · ${(context.route.distance_m/1000).toFixed(2)} km。僅採目前未修正的原始路線。`:'請先導入通過檢查、海拔完整且詳細資料已核對的原始 GPX。';}
    if(identity&&!session){
      const targets=[{id:'finish',name:'GPX 終點',distance_m:context.route.distance_m},...(context.checkpoints||[]).filter(cp=>Number.isFinite(cp.distance_m)&&cp.distance_m>0&&cp.distance_m<=context.route.distance_m)];
      const signature=JSON.stringify(targets);
      if(signature!==targetSignature){targetSignature=signature;const selected=$('live-target').value;$('live-target').replaceChildren();for(const target of [...targets,{id:'custom',name:'自訂山頂／CP'}]){const option=doc.createElement('option');option.value=target.id;option.textContent=target.name+(target.distance_m==null?'':` · ${(target.distance_m/1000).toFixed(2)} km`);if(target.distance_m!=null)option.dataset.distance=String(target.distance_m);$('live-target').append(option);}if([...$('live-target').options].some(o=>o.value===selected))$('live-target').value=selected;}
    }
    renderTimer();
  }
  const number=(id,label)=>{const input=$(id),value=Number(input.value);if(!input.value.trim()||!Number.isFinite(value)||!input.checkValidity())throw new Error(`請確認${label}。`);return value;};
  $('live-now').addEventListener('click',()=>{const date=new Date(wallNow());date.setMinutes(date.getMinutes()-date.getTimezoneOffset());$('live-start-time').value=date.toISOString().slice(0,16);});
  $('live-start').addEventListener('click',()=>{try{
    const context=getContext(),identity=routeIdentity(context);if(!identity)throw new Error('請先完成 GPX 檢查。');
    const trailhead=$('live-trailhead').value.trim(),start=number('live-start-km','起點里程')*1000;
    const startTime=new Date($('live-start-time').value).getTime();if(!trailhead||!Number.isFinite(startTime)||startTime>wallNow()+60000)throw new Error('請填起點名稱與有效、非未來的出發時間。');
    const option=$('live-target').selectedOptions[0],custom=option?.value==='custom';
    const target=custom?number('live-target-km','目標里程')*1000:Number(option?.dataset.distance);
    const targetName=custom?$('live-target-name').value.trim():option?.textContent;
    if(!targetName||!Number.isFinite(target)||target<=start||target>context.route.distance_m)throw new Error('目標須在起點之後、GPX 終點之前或等於終點。');
    pending?.abort();revision++;timer=new HikingTimer({clock});timer.setHidden(doc.hidden===true);timer.start();
    session={identity,gpx_b64:context.gpx_b64,geometry:context.route.geometry_sha256,start,target,targetName,trailhead,startTime,revision};
    $('live-setup').disabled=true;$('live-estimate-fields').disabled=false;$('live-progress').value='';$('live-progress').disabled=false;$('live-at-target').checked=false;$('live-aligned').checked=false;
    for(const id of ['live-location','live-location-stop','live-end','live-override'])$(id).disabled=false;
    $('live-override').value='auto';$('live-session').textContent=`${trailhead} → ${targetName}；出發標記 ${new Date(startTime).toLocaleString()}。帳本從按下開始時計算，之前時間未補算。`;
    result('已開始前景計時。尚未啟用定位；無證據的時間為未知。');renderTimer();
  }catch(error){fail(error);}});
  $('live-location').addEventListener('click',()=>{if(session){timer.setHidden(doc.hidden===true);provider.start();}});
  $('live-location-stop').addEventListener('click',()=>provider.stop());
  $('live-end').addEventListener('click',()=>end());
  $('live-override').addEventListener('change',()=>{timer?.setOverride($('live-override').value);renderTimer();});
  $('live-ms').addEventListener('change',renderTimer);
  $('live-at-target').addEventListener('change',()=>{$('live-progress').disabled=$('live-at-target').checked;});
  $('live-progress').addEventListener('input',()=>{$('live-at-target').checked=false;$('live-progress').disabled=false;});
  root.addEventListener('input',event=>{if(event.target.closest('#live-estimate-fields')){revision++;pending?.abort();pending=null;result('輸入已改變，請重新估算。');}});
  $('live-estimate').addEventListener('click',async()=>{let controller;try{
    refresh();if(!session)throw new Error('請先開始本次行程。');if(!$('live-aligned').checked)throw new Error('請先確認進度與時間使用同一起點、同段行程。');
    const progress=$('live-at-target').checked?session.target:number('live-progress','目前里程')*1000;if(progress<session.start||progress>getContext().route.distance_m)throw new Error('目前里程超出本次路線。');
    const source=$('live-time-source').value,view=timer.tick();let moving,elapsed;
    if(source==='timer'){if(view.unknownMs>0)throw new Error('帳本含未知時間，不能推定完整移動基準。請改填手動確認的同段時間。');moving=view.movingMs/1000;elapsed=view.elapsedMs/1000;}
    else{moving=number('live-moving','移動時間')*60;elapsed=number('live-elapsed','經過時間')*60;}
    if(moving>elapsed)throw new Error('移動時間不能大於經過時間。');
    const stops=$('live-stops').value.trim()?number('live-stops','未來停留')*60:null;
    pending?.abort();controller=new AbortController();pending=controller;const owner=++revision,identity=session.identity;
    result('正在此裝置計算，不上傳路線或定位。');
    const response=await request({gpx_b64:session.gpx_b64,owner_revision:String(owner),settings:{geometry_sha256:session.geometry,start_distance_m:session.start,progress_distance_m:progress,target_distance_m:session.target,target_id:session.targetName,moving_seconds:moving,elapsed_seconds:elapsed,moving_source:source,future_stop_seconds:stops,slowdown_factor:1,now_utc:new Date(wallNow()).toISOString()}},controller.signal);
    if(disposed||controller.signal.aborted||owner!==revision||identity!==routeIdentity(getContext())||!session)return;
    if(response.owner_revision!==String(owner)||response.geometry_sha256!==session.geometry)throw new Error('計算回應不屬於目前路線，已拒絕。');
    const estimate=response.estimate||response;
    if(estimate.suppression){const reasons={insufficient_baseline:'尚未達顯示門檻（25 公尺進度與 60 秒移動；非生理標準）',insufficient_progress:'尚無足夠的正值進度與移動時間',destination_passed:'已經超過選定目標，請開始新的目標行程',missing_measurement:'路線／時間資料不足',invalid_input:'輸入資料不符合估算條件'};result(`暫不提供 ETA：${reasons[estimate.suppression]||'資料未通過核對'}。`);return;}
    if(estimate.quality==='finished'){result('依你確認的沿線里程，已到達選定目標。這不是 GPS 抵達判定。');return;}
    const minutes=value=>Math.ceil(value/60);
    let text=`至 ${session.targetName}：約需 ${minutes(estimate.remaining_moving_seconds)} 分鐘移動。`;
    if(estimate.remaining_elapsed_seconds==null)text+=' 未來停留未知，不提供總剩餘時間或到達時刻。';
    else{text+=` 含你指定的停留約 ${minutes(estimate.remaining_elapsed_seconds)} 分鐘。`;if(estimate.arrival_utc)text+=` 約 ${new Date(estimate.arrival_utc).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} 抵達（本機時區）。`;}
    result(text+' 未校準的工程估算；依已完成路段 EP 速率外推，不保證安全或準時。');
  }catch(error){if(error?.name!=='AbortError')fail(error);}finally{if(pending===controller)pending=null;}});
  const visibility=()=>{timer?.setHidden(doc.hidden===true);renderTimer();};doc.addEventListener('visibilitychange',visibility);
  const interval=setInterval(refresh,500);refresh();
  return {refresh,destroy(){disposed=true;end();provider.destroy();clearInterval(interval);doc.removeEventListener('visibilitychange',visibility);}};
}
