import {providerSha256} from './intervals-provider-sha256.mjs';
/** Informational published facts only. Never supplies duration, location or gates. */
const text=value=>typeof value==='string'&&value.trim().length>0&&value.length<=512;
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const flags=Object.freeze(['hasRest','hasToilets','hasBus','hasShower','hasPower','hasBag','hasMedical','hasNaak']);
const supplyLabels=Object.freeze({food:'Aid-station',hotFood:'Aid-station with warm meal',drink:'Drink supply'});
const supplyDisplay=Object.freeze({food:'補給站',hotFood:'熱食補給站',drink:'飲品補給'});
const facilityDisplay=Object.freeze({hasRest:'休息區',hasToilets:'廁所',hasBus:'大會巴士',hasShower:'淋浴',hasPower:'電源',hasBag:'備用袋',hasMedical:'救護服務',hasNaak:'Näak®產品'});
const facilityLabels=Object.freeze({hasRest:'Rest area',hasToilets:'WC',hasBus:'Organisation bus',hasShower:'Shower',hasPower:'Power supply',hasBag:'Spare bag',hasMedical:'Emergency',hasNaak:'Näak® products'});
function sourceUrl(value){if(typeof value!=='string'||value.length>2048)return null;try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}}
function elevationText(record){
  const valid=value=>Number.isFinite(value)&&value>=0;
  if(valid(record.publishedSegmentAscentM)&&valid(record.publishedSegmentDescentM))return `本段爬升／下降 ${record.publishedSegmentAscentM}／${record.publishedSegmentDescentM} m`;
  if(valid(record.officialCumulativeAscentM)&&valid(record.officialCumulativeDescentM))return `累積爬升／下降 ${record.officialCumulativeAscentM}／${record.officialCumulativeDescentM} m`;
  return null;
}
export function publishedStationServiceEntries(source){
  if(!Array.isArray(source?.checkpoints))return [];
  const services=source.checkpoints.flatMap(record=>{
    const value=record?.services;if(value?.schema!=='published-station-services/1'||!text(record.name))return [];
    const url=sourceUrl(value.sourceUrl);if(!url||!['drink','food'].every(k=>own(value,k)&&(value[k]===null||text(value[k]))))return [];
    if(own(value,'notes')&&(!Array.isArray(value.notes)||value.notes.length>4||!value.notes.every(text)))return [];
    const parts=[];
    if(value.status==='published_source_text'){
      if(own(value,'timingOnlyReported')&&value.timingOnlyReported!==true)return [];
      if(value.timingOnlyReported===true){
        if(value.drink!==null||value.food!==null||value.reportedDrink!=='Timing only'||value.reportedFood!=='Timing only')return [];
        parts.push('僅計時');
      }else{
        if(own(value,'reportedDrink')||own(value,'reportedFood'))return [];
        if(value.drink===null&&value.food===null)return [];
        parts.push(value.drink===null?'飲品未公布':'飲品：'+value.drink,value.food===null?'食品未公布':'食品：'+value.food);
      }
    }else if(value.status==='published_structured_flags'){
      if(own(value,'timingOnlyReported')||own(value,'reportedDrink')||own(value,'reportedFood'))return [];
      if(value.drink!==null||value.food!==null||!['none','food','hotFood','drink'].includes(value.suppliesReported))return [];
      if(!value.facilitiesReported||!value.facilityLabels||Object.keys(value.facilitiesReported).length!==flags.length||Object.keys(value.facilityLabels).length!==flags.length||!flags.every(k=>own(value.facilitiesReported,k)&&(value.facilitiesReported[k]===null||typeof value.facilitiesReported[k]==='boolean')&&value.facilityLabels[k]===facilityLabels[k]))return [];
      if(value.suppliesReported==='none'){if(value.suppliesLabel!==null)return [];}
      else{if(value.suppliesLabel!==supplyLabels[value.suppliesReported])return [];parts.push(supplyDisplay[value.suppliesReported]);}
      for(const key of flags)if(value.facilitiesReported[key]===true)parts.push(facilityDisplay[key]);
      if(!parts.length)return [];
    }else return [];
    const elevation=elevationText(record);if(elevation)parts.push(elevation);
    return [{record,sourceUrl:url,description:parts.join(' · ')}];
  });
  return services.concat(publishedStationObservationEntries(source));
}

/** Partial source observations remain outside planner arrays and all numerical inputs. */
const OBSERVATION_PINS={
  "taoyuan-half-marathon-2023-12k": {
    "edition": 2023,
    "originalSha256": "210760f34c04bac680a47463b8843c16cbb7df0e8692fb3187720e89549c791f",
    "officialPage": "https://lohasnet.tw/Taoyuan2023/",
    "officialGroup": "12K輕越野挑戰組",
    "factsSha256": "3a2df91e6ba9551cee0464198d0bc923306b1932e21cd83e107a65dc3985fb0f"
  },
  "gold-trail-2026-20k": {
    "edition": 2026,
    "originalSha256": "608809d380e3aa36913184ec9d5e80dc7fd99374b249d4544df233f59f45cc4d",
    "officialPage": "https://www.4come.com/blogs/gold-trail-%E6%B7%98%E9%87%91%E8%B6%8A%E9%87%8E/2026-gold-rush-trail-run-athlete-guide",
    "officialGroup": "GT20K 越野挑戰組",
    "factsSha256": "188009ef270cd46b8a7e19238d951bf62f63c09739acb5423489c61817e8d76b"
  },
  "gold-trail-2026-30k": {
    "edition": 2026,
    "originalSha256": "a1fb46efb5eb7bbbf1139f7536f631cfd4341e243c980f661149ec77abc42352",
    "officialPage": "https://www.4come.com/blogs/gold-trail-%E6%B7%98%E9%87%91%E8%B6%8A%E9%87%8E/2026-gold-rush-trail-run-athlete-guide",
    "officialGroup": "GT30K 越野競賽組",
    "factsSha256": "248f3a8546ce2cd8824e670d40759088372e3450e4d83c8d8dc0abafc0139de2"
  }
};
function observationSnapshot(value,depth=0,budget={nodes:0}){
  if(depth>8||++budget.nodes>2000)throw Error('Invalid observation');
  if(value===null||typeof value==='boolean')return value;
  if(typeof value==='number'){if(!Number.isFinite(value))throw Error('Invalid observation');return value;}
  if(typeof value==='string'){if(value.length>2048)throw Error('Invalid observation');return value;}
  if(!value||typeof value!=='object'||![Object.prototype,null,Array.prototype].includes(Object.getPrototypeOf(value)))throw Error('Invalid observation');
  const keys=Reflect.ownKeys(value);if(keys.length>80)throw Error('Invalid observation');const output=Array.isArray(value)?[]:{};
  if(Array.isArray(value)&&keys.length!==value.length+1)throw Error('Invalid observation');
  for(const key of keys){if(Array.isArray(value)&&key==='length')continue;const d=Object.getOwnPropertyDescriptor(value,key);if(typeof key!=='string'||!d?.enumerable||!Object.hasOwn(d,'value')||['__proto__','constructor','prototype'].includes(key))throw Error('Invalid observation');output[key]=observationSnapshot(d.value,depth+1,budget);}
  return output;
}
const observedOwn=(source,key)=>{const d=Object.getOwnPropertyDescriptor(source,key);return d&&Object.hasOwn(d,'value')?d.value:undefined;};
const canonicalObservation=value=>Array.isArray(value)?value.map(canonicalObservation):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonicalObservation(value[key])])):value;
const freezeObservation=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freezeObservation(child);Object.freeze(value);}return value;};
export function publishedStationObservationSnapshot(source){
  try{
    if(!source||typeof source!=='object')return null;
    const id=observedOwn(source,'id');if(typeof id!=='string'||!Object.hasOwn(OBSERVATION_PINS,id))return null;
    const pin=OBSERVATION_PINS[id];for(const [key,value]of [['edition',pin.edition],['sha256',pin.originalSha256],['officialPage',pin.officialPage],['officialGroup',pin.officialGroup]])if(observedOwn(source,key)!==value)return null;
    const facts=observationSnapshot(observedOwn(source,'publishedStationObservations')),encoded=new TextEncoder().encode(JSON.stringify(canonicalObservation(facts)));
    if(encoded.length>32768||providerSha256(encoded)!==pin.factsSha256)return null;
    if(facts.groupTiming)for(const key of ['startLocal','finishCutoffLocal','officialMaxHours','finishCutoffStatus'])if(observedOwn(source,key)!==facts.groupTiming[key])return null;
    return freezeObservation(facts);
  }catch{return null;}
}
export function publishedStationDisclosureLabels(source){
  return publishedStationObservationSnapshot(source)?{summary:'公開補給資料（未定位）',notice:'官表或地圖原文；完整站表、沿線位置及到／離站判定待核。'}:{summary:'官表補給',notice:'公布品項；供應量與停留時間待確認。'};
}
export function publishedStationObservationEntries(source){
  try{
    const facts=publishedStationObservationSnapshot(source);if(!facts)return [];
    const rows=facts.rows.map(record=>{
      const parts=[];if(record.reportedCumulativeDistanceKm!==null)parts.push(`${facts.sourceKind==='official_handbook_partial_table'?'官表':'地圖'} ${record.reportedCumulativeDistanceKm} km（非沿線定位）`);
      if(record.reportedNextLegDistanceKm!==null)parts.push(`下站 ${record.reportedNextLegDistanceKm} km`);
      if(record.reportedStationType!==null)parts.push(record.reportedStationType+'（品項未公布）');
      if(record.waterReported===true)parts.push('水站');if(record.toiletReported===true)parts.push('廁所');if(record.medicalReported===true)parts.push('醫護圖示');if(record.ambulanceReported===true)parts.push('救護車');
      if(record.reportedClosingClock!==null)parts.push(`公布關門 ${record.reportedClosingClock}（到／離站待核）`);
      return {record:{...record,name:record.name+(record.code==='X'||record.kind==='published_map_marker'?'':'（'+record.code+'）')},sourceUrl:facts.sourceUrl,description:parts.join(' · ')};
    });
    rows.push({record:{id:facts.sourceId+':source-limits',name:'來源限制'},sourceUrl:facts.sourceUrl,description:[...facts.conflicts,...facts.limitations].join(' ')});
    return rows;
  }catch{return [];}
}
