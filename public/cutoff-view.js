import {sourceDateQualification} from './catalog-dates.mjs';
/** Deadline display is separate from pacing. Fixed official clocks never move with user start. */
function validLocal(text){if(typeof text!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(text))throw new Error('關門日期尚未確認。');const n=Date.parse(text+'Z');if(!Number.isFinite(n)||new Date(n).toISOString().slice(0,19)!==text)throw new Error('關門日期不是有效日期。');return text;}
export function deadlineElapsed(race,cutoffLocal,startClock){
 if(!cutoffLocal)return null;
 if(!race||race.utcOffset!=='+08:00'||!['Asia/Hong_Kong','Asia/Taipei'].includes(race.timezone)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(startClock))throw new Error('關門時區或起跑時間尚未確認。');
 if(sourceDateQualification(race))throw new Error('官方賽日待核，無法換算絕對關門。');
 if(!Number.isInteger(race.edition)||!race.raceDate?.startsWith(String(race.edition)+'-'))throw new Error('關門屆別尚未確認。');
 const start=validLocal(race.raceDate+'T'+startClock+':00'),end=validLocal(cutoffLocal);if(Math.abs(Date.parse(end+'Z')-Date.parse(start+'Z'))>31*86400000)throw new Error('關門屆別尚未確認。');
 return (Date.parse(end+race.utcOffset)-Date.parse(start+race.utcOffset))/1000;
}
export function marginLabel(margin){if(!Number.isFinite(margin))return '截止待核';const amount=Math.abs(margin);if(amount<60)return `${margin<0?'逾時':'剩餘'} ${amount===0?'0':'<1'} 分`;return `${margin<0?'逾時':'剩餘'} ${margin<0?Math.ceil(amount/60):Math.floor(amount/60)} 分`;}
export function assessDeadline({race,startClock,cutoffLocal=null,cutoffElapsed=null,kind,arrival,departure,needsConfirmation=false}){
 if(needsConfirmation)return {status:'unconfirmed',label:'截止待核',margin_s:null};
 if(cutoffLocal===null&&cutoffElapsed===null)return {status:'unknown',label:'未提供',margin_s:null};
 if(!['arrival','departure'].includes(kind))return {status:'unconfirmed',label:'截止依據待核',margin_s:null};
 let deadline;try{deadline=cutoffLocal?deadlineElapsed(race,cutoffLocal,startClock):cutoffElapsed;}catch(error){return {status:'unconfirmed',label:error.message,margin_s:null};}
 const time=kind==='arrival'?arrival:departure;if(!Number.isFinite(deadline)||!Number.isFinite(time))return {status:'unconfirmed',label:'截止待核',margin_s:null};
 const margin=deadline-time;return {status:margin<0?'missed':'within',label:deadline<0?'起跑前已關門':marginLabel(margin),margin_s:margin,deadline_elapsed_s:deadline,kind,official_local:cutoffLocal};
}
export function checkpointDeadline(cp,context){
 if(context?.dateMismatch)return {status:'unconfirmed',label:'日期與賽事不同',margin_s:null};
 if(!context)return {status:'unknown',label:'未提供',margin_s:null};
 const finish=Math.abs(cp.distance_m-context.distance_m)<1e-5;
 const record=finish?context.finish:context.checkpoints.find(x=>Math.abs(x.distance_m-cp.distance_m)<1e-5&&x.name===cp.name);
 return assessDeadline({race:context.race,startClock:context.startClock,cutoffLocal:record?.cutoffLocal??null,cutoffElapsed:record?.cutoffElapsed??null,kind:record?record.kind:'arrival',arrival:cp.arrival_elapsed_s,departure:cp.departure_elapsed_s,needsConfirmation:!!record?.needsConfirmation});
}
