import {durationWidthForDistance} from './duration-width-policy.mjs';
/** Fixed unit editors over the existing raw input contract. No model/default changes. */
const editors=new WeakMap();
const segmentSources=new WeakMap();
let serial=0;
const units={duration:['時','分','秒'],pace:['分','秒'],wallclock:['時','分']};
export const normalizeTimeCharacters=value=>String(value).replace(/[０-９]/gu,c=>String(c.charCodeAt(0)-0xff10)).replace(/[：﹕]/gu,':').replace(/　/gu,' ');
export function validateTimeParts(parts,{kind='duration',width=2,required=true,positive=false,maxSeconds=null}={}){
  if(parts.every(x=>x===''))return required?{ok:false,index:0,message:'請填完整時間。'}:{ok:true,empty:true,seconds:null};
  for(let i=0;i<parts.length;i++){
    const text=parts[i],digits=i===0?width:2;
    if(!text)return {ok:false,index:i,message:`請填${units[kind][i]}。`};
    if(!/^\d+$/u.test(text))return {ok:false,index:i,message:`${units[kind][i]}請填數字。`};
    if(text.length>digits)return {ok:false,index:i,message:i===0&&kind!=='wallclock'?'請先選長時數／長配速，或修正此欄。':`${units[kind][i]}最多 ${digits} 位。`};
    if((i>0||kind==='wallclock')&&Number(text)>(i===0&&kind==='wallclock'?23:59))return {ok:false,index:i,message:`${units[kind][i]}須為 0–${i===0&&kind==='wallclock'?23:59}。`};
  }
  const n=parts.map(Number),seconds=kind==='pace'?n[0]*60+n[1]:kind==='wallclock'?n[0]*3600+n[1]*60:n[0]*3600+n[1]*60+n[2];
  if(positive&&seconds<=0)return {ok:false,index:0,message:'時間須大於 0。'};
  if(maxSeconds!==null&&seconds>maxSeconds)return {ok:false,index:0,message:'超出目前模型支援的 168 小時（7 天）；原值已保留。'};
  return {ok:true,empty:false,seconds};
}
function interceptProperty(element,key,onSet){
  let object=element,descriptor;
  while(object&&!descriptor){descriptor=Object.getOwnPropertyDescriptor(object,key);object=Object.getPrototypeOf(object);}
  let stored=element[key];
  const read=descriptor?.get?()=>descriptor.get.call(element):()=>stored;
  const write=descriptor?.set?value=>descriptor.set.call(element,value):value=>{stored=value;};
  Object.defineProperty(element,key,{configurable:true,enumerable:true,get:read,set(value){write(value);onSet();}});
  return {read,write};
}
export function timeInputEditor(source){return editors.get(source)||editors.get(segmentSources.get(source))||null;}
export function visibleTimeField(source){const editor=editors.get(source);return editor?editor.firstInvalid():source;}
export function readTimeInput(source,label='時間'){
  const editor=editors.get(source);if(!editor)return source.value;
  const checked=editor.validate(true);
  if(!checked.ok)throw Object.assign(new Error(`${label}：${checked.message}`),{fields:[editor.segments[checked.index]]});
  return source.value;
}
export function bindSegmentedTimeInput(source,{kind='duration',required=source.required===true,positive=false,maxSeconds=null,label=null,documentImpl=source.ownerDocument||globalThis.document}={}){
  if(editors.has(source))return editors.get(source);
  const doc=documentImpl,id=source.id||`time-input-${++serial}`;if(!source.id)source.id=id;
  const originalValue=source.value,originalLabels=[...(source.labels||[])],implicit=originalLabels.find(el=>el===source.parentElement);
  let caption;
  // Replace implicit labels: a label must not contain several independently named controls.
  if(implicit){
    const wrapper=doc.createElement('div');wrapper.className='segmented-time-field';
    caption=doc.createElement('span');caption.id=`${id}-label`;caption.className='segmented-time-caption';
    // Moving native child nodes preserves the dynamic prediction-time label.
    if(implicit.childNodes){for(const node of [...implicit.childNodes])if(node!==source)caption.append(node);}
    else{caption.textContent=implicit._text||'';for(const node of [...implicit.children])if(node!==source)caption.append(node);}
    implicit.insertAdjacentElement('afterend',wrapper);wrapper.append(caption,source);implicit.remove();
  }else{
    caption=originalLabels[0];if(caption&&!caption.id)caption.id=`${id}-label`;
  }
  const root=doc.createElement('div');root.id=`${id}-editor`;root.className='segmented-time';root.setAttribute('role','group');
  if(caption)root.setAttribute('aria-labelledby',caption.id);else root.setAttribute('aria-label',label||source.getAttribute('aria-label')||'時間');
  const line=doc.createElement('div');line.className='segmented-time-units';
  const segments=units[kind].map((unit,i)=>{
    const wrap=doc.createElement('label');wrap.className='segmented-time-unit';
    const field=doc.createElement('input');field.id=`${id}-${(kind==='pace'?['minutes','seconds']:['hours','minutes','seconds'])[i]}`;field.setAttribute('data-time-segment',id);
    field.type='text';field.inputMode='numeric';field.setAttribute('inputmode','numeric');field.autocomplete='off';field.spellcheck=false;
    field.setAttribute('aria-label',`${label||caption?.textContent.trim()||source.getAttribute('aria-label')||'時間'}，${unit}`);
    const suffix=doc.createElement('span');suffix.textContent=unit;suffix.setAttribute('aria-hidden','true');wrap.append(field,suffix);line.append(wrap);if(i<units[kind].length-1){const colon=doc.createElement('span');colon.className='segmented-time-colon';colon.textContent=':';colon.setAttribute('aria-hidden','true');line.append(colon);}return field;
  });
  if(caption?.tagName==='LABEL')caption.setAttribute('for',segments[0].id);
  root.append(line);
  const widthChoice=kind!=='wallclock'?doc.createElement('select'):null;
  if(widthChoice){
    widthChoice.id=`${id}-width`;widthChoice.setAttribute('data-time-width',id);widthChoice.className='segmented-time-width';widthChoice.setAttribute('aria-label',kind==='pace'?'移動配速分鐘範圍':'時間小時範圍');
    for(const [value,text] of kind==='pace'?[[2,'一般配速'],[3,'100 分以上'],[4,'1000 分以上']]:[[2,'一般時數'],[3,'100 小時以上']]){const option=doc.createElement('option');option.value=String(value);option.textContent=text;widthChoice.append(option);}
    root.append(widthChoice);
  }
  const hint=doc.createElement('span');hint.id=`${id}-entry-help`;hint.className='sr-only';
  hint.textContent='填滿自動跳下一格；Tab 也可換格。';root.append(hint);
  const note=doc.createElement('span');note.id=`${id}-input-error`;note.className='segmented-time-error';note.setAttribute('aria-live','polite');note.hidden=true;root.append(note);
  source.insertAdjacentElement('afterend',root);source.hidden=true;source.type='hidden';source.tabIndex=-1;
  // The old target wrapper's text-format suffix is superseded by fixed unit labels.
  if(source.parentElement.classList?.contains('time-input'))for(const child of [...source.parentElement.children])if(child!==source&&child!==root)child.hidden=true;
  let width=2,defaultWidth=2,widthOverride=null,routeIdentity=null,raw=null,composing=false,compositionDuplicate=null,emitting=false,syncing=false,revision=0;
  const repairs=new WeakMap();
  const options=()=>({kind,width,required,positive,maxSeconds});
  const check=()=>validateTimeParts(segments.map(e=>e.value),options());
  function show(checked,force=false){
    const has=segments.some(e=>e.value!==''),bad=segments.some(e=>e.value&&!/^\d+$/u.test(e.value)||e.value.length>(e===segments[0]?width:2)),completeError=!checked.ok&&segments[checked.index].value.length>=(checked.index===0?width:2),visible=!checked.ok&&(force||has&&(bad||completeError));
    line.dataset.invalid=String(visible);note.textContent=visible?checked.message:'';note.hidden=!visible;
    for(const [i,field] of segments.entries()){field.setCustomValidity?.(!checked.ok&&i===checked.index?checked.message:'');if(visible&&!checked.ok&&i===checked.index)field.setAttribute('aria-invalid','true');else field.removeAttribute('aria-invalid');}
    return checked;
  }
  function attributes(){
    for(const field of segments){field.disabled=source.disabled;field.readOnly=source.readOnly===true;field.required=required;field.setAttribute('aria-describedby',[source.getAttribute('aria-describedby')||'',hint.id,note.id].filter(Boolean).join(' '));}
    if(widthChoice)widthChoice.disabled=source.disabled||source.readOnly===true;
  }
  function applyWidth(next){width=next;if(widthChoice)widthChoice.value=String(next);segments[0].setAttribute('size',String(next));segments[0].setAttribute('data-digits',String(next));for(const [i,field] of segments.entries())field.placeholder='0'.repeat(i===0?next:2);hint.textContent=`填滿自動跳下一格；Tab 也可換格。${next>2?(kind==='pace'?' 分':' 時')+`填 ${next} 位，位數不足可先填 0。`:''}`;}
  function synchronize(){
    if(syncing)return;syncing=true;revision++;
    try{
      const text=raw?.read()??originalValue;
      if(text===''){applyWidth(widthOverride??defaultWidth);for(const field of segments)field.value='';}
      else{
        const parts=text.split(':');
        // A programmatic canonical value chooses sufficient width, without modifying its bytes.
        const first=parts[0]||'',limit=kind==='pace'?4:kind==='duration'?3:2,representable=kind!=='wallclock'&&/^\d+$/u.test(first)&&first.length<=limit,needed=Math.max(2,representable?String(Number(first)).length:first.length);
        applyWidth(Math.min(kind==='pace'?4:kind==='duration'?3:2,Math.max(widthOverride??defaultWidth,needed)));
        for(const [i,field] of segments.entries())field.value=parts.length===segments.length?(parts[i]||''):(i===0?text:'');
        if(parts.length===segments.length&&/^\d+$/u.test(first)&&first.length<=limit&&String(Number(first)).length<=width)segments[0].value=String(Number(first)).padStart(width,'0');
      }
      attributes();show(check());
    }finally{syncing=false;}
  }
  function publish(force=false){
    if(source.disabled||source.readOnly)return;
    const parts=segments.map((e,i)=>(i>0||kind==='wallclock')&&/^\d{1,2}$/u.test(e.value)?e.value.padStart(2,'0'):e.value),next=parts.every(x=>x==='')?'':parts.join(':');
    if(!force&&next===raw.read())return;
    revision++;
    raw.write(next);emitting=true;
    try{source.dispatchEvent(new Event('input',{bubbles:true}));}finally{emitting=false;}
  }
  function normalizeKnown(force=false){
    if(composing||source.disabled||source.readOnly)return;
    for(const [i,field] of segments.entries())if(/^\d+$/u.test(field.value)&&field.value.length<=(i===0?width:2))field.value=field.value.padStart(i===0?width:2,'0');
    publish(force);
  }
  function focusAt(index,select=true){const field=segments[index];if(!field||field.disabled)return;field.focus();if(select)field.select?.();}
  function advance(index){const field=segments[index],valid=validateTimeParts(segments.map((e,i)=>i===index?e.value:'0'),{kind,width,required:true});if(index<segments.length-1&&/^\d+$/u.test(field.value)&&field.value.length===(index===0?width:2)&&valid.ok)focusAt(index+1);}
  for(const [index,field] of segments.entries()){
    field.addEventListener('compositionstart',()=>{composing=true;compositionDuplicate=null;});
    field.addEventListener('compositionend',event=>{event.stopPropagation();composing=false;if(source.disabled||source.readOnly)return;field.value=normalizeTimeCharacters(field.value);publish();compositionDuplicate={field,value:field.value};show(check());advance(index);});
    field.addEventListener('input',event=>{event.stopPropagation();if(source.disabled||source.readOnly)return;if(!composing&&!event.isComposing)field.value=normalizeTimeCharacters(field.value);const duplicate=compositionDuplicate?.field===field&&compositionDuplicate.value===field.value;compositionDuplicate=null;publish(!duplicate);show(check());if(!composing&&!event.isComposing&&(!event.inputType||event.inputType.startsWith('insert')))advance(index);});
    field.addEventListener('blur',()=>{if(source.disabled||source.readOnly)return;normalizeKnown();show(check(),true);});
    field.addEventListener('keydown',event=>{
      compositionDuplicate=null;
      if(composing||event.isComposing||source.disabled||source.readOnly||event.altKey||event.ctrlKey||event.metaKey)return;
      const start=field.selectionStart,end=field.selectionEnd;
      if(event.key==='Backspace'&&index>0&&field.value===''&&(start===0||start===null||start===undefined)){event.preventDefault();focusAt(index-1,false);const previous=segments[index-1];previous.setSelectionRange?.(previous.value.length,previous.value.length);}
      else if(event.key==='ArrowLeft'&&index>0&&start===0&&end===0){event.preventDefault();focusAt(index-1,false);segments[index-1].setSelectionRange?.(segments[index-1].value.length,segments[index-1].value.length);}
      else if(event.key==='ArrowRight'&&index<segments.length-1&&start===field.value.length&&end===start){event.preventDefault();focusAt(index+1,false);segments[index+1].setSelectionRange?.(0,0);}
      else if(event.key===':'){event.preventDefault();normalizeKnown();advance(index);}
      // Enter and Tab retain their native form/navigation behavior.
    });
    field.addEventListener('paste',event=>{
      compositionDuplicate=null;
      if(source.disabled||source.readOnly||composing)return;
      const text=normalizeTimeCharacters(event.clipboardData?.getData('text')||'').trim();
      if(!text.includes(':'))return; // Digit-only paste belongs to the focused segment, never guessed as a whole duration.
      event.preventDefault();event.stopPropagation();
      const parts=text.split(':').map(part=>part.trim());
      if(parts.length!==segments.length){field.value=text;publish(true);show(check(),true);focusAt(index,false);return;}
      const needed=Math.max(2,parts[0].length);applyWidth(Math.min(kind==='pace'?4:kind==='duration'?3:2,Math.max(widthOverride??defaultWidth,needed)));
      for(const [i,segment] of segments.entries())segment.value=parts[i];normalizeKnown(true);const checked=show(check(),true);focusAt(checked.ok?segments.length-1:checked.index,false);
    });
  }
  widthChoice?.addEventListener('change',event=>{event.stopPropagation();if(source.disabled||source.readOnly)return;widthOverride=Number(widthChoice.value);applyWidth(widthOverride);const first=segments[0];if(/^\d+$/u.test(first.value)&&String(Number(first.value)).length<=width)first.value=String(Number(first.value)).padStart(width,'0');publish(true);show(check(),true);});
  // Native .value writes do not emit input. Keep that contract for suggestion apply,
  // rollback, source imports, manual row selection and history reset.
  raw=interceptProperty(source,'value',synchronize);
  interceptProperty(source,'disabled',attributes);interceptProperty(source,'readOnly',attributes);
  source.addEventListener('input',()=>{if(!emitting)synchronize();});
  if(globalThis.MutationObserver){const observer=new MutationObserver(attributes);observer.observe(source,{attributes:true,attributeFilter:['disabled','readonly','aria-describedby']});}
  const repairSignature=()=>JSON.stringify([raw.read(),segments.map(field=>field.value),width,defaultWidth,widthOverride]);
  // A repair may only reformat complete, already entered numeric units. It
  // cannot fill unknowns, carry invalid minutes, wrap wall clocks or clamp a cap.
  function proposeRepair(){
    if(source.disabled||source.readOnly||composing)return null;
    const parts=segments.map(field=>normalizeTimeCharacters(field.value).trim());
    if(parts.some(part=>!/^\d+$/u.test(part)))return null;
    const limit=kind==='pace'?4:kind==='duration'?3:2;
    if(parts[0].length>limit||parts.slice(1).some(part=>part.length>2))return null;
    const nextWidth=Math.max(width,String(Number(parts[0])).length);
    if(nextWidth>limit||!validateTimeParts(parts,{...options(),width:nextWidth}).ok)return null;
    const syntax=kind==='duration'?/^\d{1,3}:[0-5]\d:[0-5]\d$/u:kind==='pace'?/^\d{1,4}:[0-5]\d$/u:/^([01]\d|2[0-3]):[0-5]\d$/u;
    if(check().ok&&syntax.test(raw.read()))return null;
    const after=parts.map((part,index)=>String(Number(part)).padStart(index===0?nextWidth:2,'0')).join(':');
    const proposal=Object.freeze({before:raw.read(),after,width:nextWidth,kind});
    repairs.set(proposal,{revision,signature:repairSignature(),routeIdentity,ownerDocument:source.ownerDocument||doc});
    return proposal;
  }
  function applyRepair(proposal){
    const captured=repairs.get(proposal),currentDocument=source.ownerDocument||doc;
    // A cloned template control is bound in its inert ownerDocument, then
    // adopted into the live document. Verify the current document, and bind
    // each proposal to the document in which it was actually shown.
    if(!captured||source.disabled||source.readOnly||composing||source.isConnected===false||root.isConnected===false||captured.revision!==revision||captured.signature!==repairSignature()||captured.routeIdentity!==routeIdentity||captured.ownerDocument!==currentDocument||root.ownerDocument&&root.ownerDocument!==currentDocument||currentDocument.getElementById(id)!==source||currentDocument.getElementById(root.id)!==root||root.closest('[hidden]'))return false;
    const current=proposeRepair();
    if(!current||current.before!==proposal.before||current.after!==proposal.after||current.width!==proposal.width)return false;
    repairs.delete(proposal);widthOverride=proposal.width;applyWidth(proposal.width);
    for(const [index,field] of segments.entries())field.value=proposal.after.split(':')[index];
    show(check());publish(true);return true;
  }
  const editor={source,root,segments,widthChoice,sync:synchronize,normalizeKnown,proposeRepair,applyRepair,validate:(force=false)=>show(check(),force),firstInvalid:()=>segments[check().ok?0:check().index],get width(){return width;},get defaultWidth(){return defaultWidth;},setRouteDistance({distanceM,routeIdentity:identity,policy}={}){if(kind!=='duration')return;if(identity!==undefined&&identity!==routeIdentity){routeIdentity=identity;widthOverride=null;}defaultWidth=durationWidthForDistance(distanceM,policy);synchronize();},setLabel(text){root.removeAttribute('aria-labelledby');root.setAttribute('aria-label',text);for(const [i,field] of segments.entries())field.setAttribute('aria-label',`${text}，${units[kind][i]}`);}};
  for(const field of segments)segmentSources.set(field,source);
  editors.set(source,editor);applyWidth(2);synchronize();return editor;
}
export function initializeSegmentedTimeInputs(documentImpl=globalThis.document){
  for(const [id,options] of [['target',{positive:true,maxSeconds:604800}],['prediction-history-time',{positive:true}],['ability-history-time',{positive:true}],['start-time',{kind:'wallclock'}],['prediction-start-time',{kind:'wallclock'}],['manual-pace-value',{kind:'pace',required:true,positive:true}]]){
    const source=documentImpl.getElementById(id);if(source)bindSegmentedTimeInput(source,{...options,documentImpl});
  }
}
