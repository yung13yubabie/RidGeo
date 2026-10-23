// Fixed same-origin renderer libraries. Public tiles are requested only after explicit Enable.
let assets, drawingAssets;
function script(src){return new Promise((resolve,reject)=>{
  const element=document.createElement('script');let settled=false;
  const finish=error=>{if(settled)return;settled=true;clearTimeout(timer);element.onload=null;element.onerror=null;element.remove();error?reject(error):resolve();};
  const timer=setTimeout(()=>finish(new Error('固定地圖元件逾時，請重試。')),8000);
  element.src=new URL(src,import.meta.url).href;element.onload=()=>finish();element.onerror=()=>finish(new Error('固定地圖元件未完成。'));
  try{document.head.append(element);}catch(error){finish(error);}
});}
function boundedAssets(work){return new Promise((resolve,reject)=>{
  let settled=false;const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve(value);};
  const timer=setTimeout(()=>finish(new Error('地圖元件載入逾時，請重試。')),18000);
  Promise.resolve(work).then(value=>finish(null,value),error=>finish(error));
});}
function loadDrawingLibraries(){
  if(!drawingAssets)drawingAssets=(async()=>{
    // Renderer failure must not start a competing classic-script/global flight.
    const previousTerra=globalThis.terraDraw;
    await script('./vendor/terra-draw.js');
    const terra=globalThis.terraDraw;
    if(terra===previousTerra||typeof terra?.TerraDraw!=='function'||typeof terra?.TerraDrawExtend?.TerraDrawBaseAdapter!=='function'||typeof terra?.TerraDrawLineStringMode!=='function'||typeof terra?.TerraDrawSelectMode!=='function'||typeof terra?.TerraDrawModeUndoRedo!=='function')throw new Error('繪圖元件載入不完整，請重試。');
    const previousAdapter=globalThis.terraDrawMaplibreGlAdapter;
    await script('./vendor/terra-adapter.js');
    const adapterModule=globalThis.terraDrawMaplibreGlAdapter;
    const Adapter=adapterModule?.TerraDrawMapLibreGLAdapter;
    if(adapterModule===previousAdapter||typeof Adapter!=='function'||Object.getPrototypeOf(Adapter.prototype)!==terra.TerraDrawExtend.TerraDrawBaseAdapter.prototype)throw new Error('繪圖連接元件載入不完整，請重試。');
    return {terra,Adapter};
  })().catch(error=>{drawingAssets=null;throw error;});
  return drawingAssets;
}
export function loadDrawingMap(){
  if(!assets)assets=boundedAssets(Promise.all([import('./vendor/maplibre/maplibre-gl.mjs'),loadDrawingLibraries()])).then(([maplibre,drawing])=>({maplibre,...drawing})).catch(error=>{assets=null;throw error;});
  return assets;
}
export function fixedBasemapStyle(){return {
 version:8,name:'RidGEQ fixed OpenFreeMap context',glyphs:'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
 sources:{openmaptiles:{type:'vector',url:'https://tiles.openfreemap.org/planet',attribution:'© OpenFreeMap · © OpenMapTiles · © OpenStreetMap contributors'}},
 layers:[
  {id:'background',type:'background',paint:{'background-color':'#f2f2ea'}},
  {id:'landcover',type:'fill',source:'openmaptiles','source-layer':'landcover',paint:{'fill-color':'#dbe6cc','fill-opacity':0.65}},
  {id:'park',type:'fill',source:'openmaptiles','source-layer':'park',paint:{'fill-color':'#d2e3c2','fill-opacity':0.65}},
  {id:'water',type:'fill',source:'openmaptiles','source-layer':'water',paint:{'fill-color':'#b8d7e7'}},
  {id:'waterway',type:'line',source:'openmaptiles','source-layer':'waterway',paint:{'line-color':'#a9cfe2','line-width':1}},
  {id:'paths',type:'line',source:'openmaptiles','source-layer':'transportation',filter:['all',['==','$type','LineString'],['in','class','path','track']],paint:{'line-color':'#b3a28e','line-width':1.5,'line-dasharray':[2,2]}},
  {id:'roads',type:'line',source:'openmaptiles','source-layer':'transportation',filter:['all',['==','$type','LineString'],['!in','class','path','track','rail','aerialway','ferry']],paint:{'line-color':'#fff','line-width':['interpolate',['linear'],['zoom'],5,1,15,4]}},
  {id:'road-labels',type:'symbol',source:'openmaptiles','source-layer':'transportation_name',minzoom:12,layout:{'symbol-placement':'line','text-field':['coalesce',['get','name:zh-Hant'],['get','name:zh'],['get','name'],['get','name:latin']], 'text-font':['Noto Sans Regular'],'text-size':11},paint:{'text-color':'#62675b','text-halo-color':'#fff','text-halo-width':1}},
  {id:'place-labels',type:'symbol',source:'openmaptiles','source-layer':'place',layout:{'text-field':['coalesce',['get','name:zh-Hant'],['get','name:zh'],['get','name'],['get','name:latin']], 'text-font':['Noto Sans Regular'],'text-size':12},paint:{'text-color':'#3f5347','text-halo-color':'#fff','text-halo-width':1}}
 ]
};}
