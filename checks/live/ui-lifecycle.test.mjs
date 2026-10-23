/** Minimal DOM double. Event/ownership regressions, not browser validation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createLiveUI} from '../../public/live-ui.mjs';
class Element {
 constructor(id=''){Object.assign(this,{id,value:'',checked:false,disabled:false,dataset:{},listeners:{},options:[],textContent:'',step:null});}
 addEventListener(kind,fn){(this.listeners[kind]??=[]).push(fn);}
 async fire(kind){for(const fn of this.listeners[kind]||[])await fn({target:this});}
 replaceChildren(){this.options=[];this.value='';}
 append(option){this.options.push(option);if(!this.value)this.value=option.value;}
 get selectedOptions(){return this.options.filter(option=>option.value===this.value);}
 checkValidity(){const value=Number(this.value);return Number.isFinite(value)&&value>=0&&(!this.step||this.step==='any'||Math.abs(value/Number(this.step)-Math.round(value/Number(this.step)))<1e-7);}
 closest(){return {};}
}
function harness({pending=false}={}){
 const elements={},root=new Element();root.querySelector=selector=>elements[selector.slice(1)]??=new Element(selector.slice(1));
 Object.defineProperty(root,'innerHTML',{set(html){for(const match of html.matchAll(/<(?:input|select|button|fieldset|p)[^>]*id="([^"]+)"[^>]*>/g)){const element=root.querySelector('#'+match[1]);element.step=/step="([^"]+)"/.exec(match[0])?.[1]||null;element.value=/value="([^"]*)"/.exec(match[0])?.[1]||'';}}});
 const doc={hidden:false,createElement:()=>new Element(),addEventListener(){},removeEventListener(){}};
 const route={route_sha256:'raw',geometry_sha256:'geometry',blocked:false,elevation_complete:true,distance_m:2223.898532891};
 let requests=[],resolve,lastSignal;
 const ui=createLiveUI({root,document:doc,getContext:()=>({route,gpx_b64:'synthetic',ready:true}),clock:()=>0,wallNow:()=>Date.parse('2026-10-23T00:00:00Z'),providerFactory:()=>({start(){},stop(){},destroy(){}}),request:(payload,signal)=>{
  requests.push(payload);lastSignal=signal;
  const response={owner_revision:payload.owner_revision,geometry_sha256:'geometry',quality:payload.settings.progress_distance_m===route.distance_m?'finished':'unvalidated',remaining_moving_seconds:1200,remaining_elapsed_seconds:null};
  return pending?new Promise(done=>{resolve=()=>done(response);}):Promise.resolve(response);
 }});
 const e=id=>elements['live-'+id];const click=id=>e(id).fire('click');
 async function start(){e('start-km').value='0';e('trailhead').value='Synthetic';e('start-time').value='2026-10-23T00:00';await click('start');e('time-source').value='manual';e('aligned').checked=true;e('moving').value='10';e('elapsed').value='15';}
 return {ui,e,click,start,route,requests,resolve:()=>resolve(),signal:()=>lastSignal};
}
test('fractional-metre finish accepts exact manual precision; no silent bounds clamp',async()=>{
 const h=harness();try{await h.start();assert.equal(h.e('progress').step,'any');h.e('progress').value=String(h.route.distance_m/1000);await h.click('estimate');assert.equal(h.requests.length,1);assert.match(h.e('result').textContent,/已到達選定目標/);
 h.e('progress').value='2.224';await h.click('estimate');assert.equal(h.requests.length,1);assert.match(h.e('result').textContent,/目前里程超出/);
 }finally{h.ui.destroy();}
});
test('explicit reached-target selection uses exact selected target, not rounded text or GPS',async()=>{
 const h=harness();try{await h.start();h.e('progress').value='999';h.e('at-target').checked=true;await h.e('at-target').fire('change');assert.equal(h.e('progress').disabled,true);await h.click('estimate');assert.equal(h.requests[0].settings.progress_distance_m,h.route.distance_m);assert.match(h.e('result').textContent,/已到達選定目標/);
 await h.e('progress').fire('input');assert.equal(h.e('at-target').checked,false);assert.equal(h.e('progress').disabled,false);await h.click('estimate');assert.equal(h.requests.length,1);assert.match(h.e('result').textContent,/目前里程超出/);
 }finally{h.ui.destroy();}
});
test('explicit End expires prior ETA and starting anew clears reached-target choice',async()=>{
 const h=harness();try{await h.start();h.e('progress').value='0.5';await h.click('estimate');assert.match(h.e('result').textContent,/分鐘移動/);h.e('at-target').checked=true;await h.click('end');assert.match(h.e('result').textContent,/先前 ETA／到達時刻已失效/);assert.doesNotMatch(h.e('result').textContent,/分鐘移動/);await h.start();assert.equal(h.e('at-target').checked,false);assert.equal(h.e('progress').disabled,false);
 }finally{h.ui.destroy();}
});
test('End aborts pending estimate and late resolution cannot revive arrival',async()=>{
 const h=harness({pending:true});try{await h.start();h.e('progress').value='0.5';const estimating=h.click('estimate');await h.click('end');assert.equal(h.signal().aborted,true);h.resolve();await estimating;assert.match(h.e('result').textContent,/先前 ETA／到達時刻已失效/);
 }finally{h.ui.destroy();}
});
