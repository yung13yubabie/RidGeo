import { DraftError, coordinatesFromFeature } from './route-draft.mjs';
import { canonicalLongitude } from './wrapped-map-adapter.mjs';

const samePoint = (a,b) => Array.isArray(a) && Array.isArray(b) && a.length===2 && b.length===2 && a[0]===b[0] && a[1]===b[1];
const samePoints = (a,b) => a.length===b.length && a.every((p,i)=>samePoint(p,b[i]));

/** Only recognize an exact one-point insertion from Terra's current midpoint helper. */
function generatedMidpointInsertion(feature, helpers, snapshot) {
  const before=snapshot.coordinates, after=feature.geometry.coordinates;
  if(after.length!==before.length+1)return null;
  let index=0;
  while(index<before.length && samePoint(before[index],after[index]))index++;
  if(index===0 || index===before.length || !samePoints(before.slice(index),after.slice(index+1)))return null;
  const point=after[index];
  if(!Array.isArray(point) || point.length!==2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1]) || Math.abs(point[1])>90 || Math.abs(point[0])<=180)return null;
  const helper=helpers.find(f=>f.geometry?.type==='Point' && f.properties?.mode==='select' && f.properties.midPoint===true && f.properties.midPointFeatureId===feature.id && f.properties.midPointSegment===index-1 && samePoint(f.geometry.coordinates,point));
  if(!helper)return null;
  // Preserve the generated helper's decimal precision when modulo arithmetic
  // introduces binary residue (e.g. 180.000499996 -> -179.99950000399997).
  // The pinned adapter generates nine decimals; source endpoints are untouched.
  const decimals=(String(point[0]).split('.')[1]||'').length;
  const longitude=Number(canonicalLongitude(point[0]).toFixed(decimals));
  const coordinates=after.map(p=>[...p]);coordinates[index]=[longitude,point[1]];
  return {id:feature.id,revision:snapshot.revision,raw:after.map(p=>[...p]),coordinates};
}

/** Glue for a real TerraDraw instance. Never reads map-rendered/simplified geometry. */
export function createTerraRouteController({draw, draft, onChange = () => {}, onError = () => {}, autoSelectOnlyRoute = false, finishLine = () => {}}) {
  let restoring = false, disposed = false, drafting = false, paused = false, epoch = 0, knownRouteIds = new Set(), generatedInsertion = null;
  const selectRoute = () => {
    if (!autoSelectOnlyRoute) return;
    const lines=routeFeatures();
    if(lines.length===1 && !lines[0].properties.currentlyDrawing)draw.selectFeature(lines[0].id);
  };
  const enterEdit = () => {draw.setMode('select');selectRoute();};
  const routeFeatures = () => draw.getSnapshot().filter(f => f.geometry?.type === 'LineString' && f.properties?.mode === 'linestring');
  const drawing = () => drafting || routeFeatures().some(f => f.properties.currentlyDrawing === true);
  const drawingHistory = () => drafting && draw.getMode() === 'linestring';
  const changed = (transient = false) => { if (!disposed) {
    const working=routeFeatures().find(f=>f.properties.currentlyDrawing === true);
    onChange({draft: draft.snapshot(), drawing: drawing(), transient, canFinish: drafting && (working?.geometry.coordinates.length || 0) >= 3, canUndo: drawingHistory() ? draw.canUndo() : draft.snapshot().canUndo, canRedo: drawingHistory() ? draw.canRedo() : draft.snapshot().canRedo});
  } };
  function restore() {
    epoch++;paused=false;drafting=false;generatedInsertion=null;
    restoring = true;
    try {
      draw.setMode('select'); draw.clear(); draw.clearUndoRedoHistory();
      const coordinates = draft.snapshot().coordinates;
      if (coordinates.length >= 2) {
        const [result] = draw.addFeatures([{type:'Feature', geometry:{type:'LineString', coordinates}, properties:{mode:'linestring'}}]);
        if (!result?.valid) throw new DraftError('restore_failed', '無法還原繪圖，請保留草稿 GPX。');
      }
      selectRoute();
    } finally { restoring = false; }
    changed();
  }
  function commit(id, context) {
    if (restoring || disposed || paused) return;
    try {
      const features = routeFeatures();
      if (features.length > 1) throw new DraftError('single_line_required', '一次只保留一條路線；不會自動合併。');
      if (routeFeatures().some(f => f.properties.currentlyDrawing === true)) { draft.invalidateTransient(); changed(true); return; }
      if (features.length) {
        let feature=features[0];
        const insertion=generatedInsertion;generatedInsertion=null;
        // The public finish action, unchanged original sequence and observed helper
        // must all agree. API/import/malformed coordinates never receive wrapping.
        if(context?.mode==='select' && context.action==='insertMidpoint' && insertion?.id===id && feature.id===id && insertion.revision===draft.snapshot().revision && samePoints(insertion.raw,feature.geometry.coordinates)) {
          const corrected={...feature,geometry:{type:'LineString',coordinates:insertion.coordinates}};
          coordinatesFromFeature(corrected); // Keep the canonical validator strict.
          restoring=true;
          try {draw.updateFeatureGeometry(id,corrected.geometry);} finally {restoring=false;}
          feature=corrected;
        }
        draft.setCoordinates(coordinatesFromFeature(feature));
      }
      else draft.clear();
      changed();
    } catch (error) {
      try { restore(); } catch (restoreError) { onError(restoreError); return; }
      onError(error);
    }
  }
  function finish(id, context) {
    if (restoring || disposed || paused) return;
    if(context?.mode==='linestring' && context.action==='draw')drafting=false;
    const finishedEpoch=++epoch;commit(id,context);
    // Do not change mode inside Terra's finishing operation or a newer gesture.
    queueMicrotask(() => { if (!disposed && epoch===finishedEpoch && !drafting) { enterEdit(); changed(); } });
  }
  function change(ids, type, context) {
    const currentIds = new Set(routeFeatures().map(f => f.id));
    const touchesRoute = ids.some(id => currentIds.has(id) || knownRouteIds.has(id));
    knownRouteIds = currentIds;
    if (restoring || disposed || paused || !touchesRoute || type === 'styling' || context?.target === 'properties') return;
    generatedInsertion=null;
    if(type==='update' && context?.target==='geometry' && context?.origin!=='api') {
      const snapshot=draw.getSnapshot(),feature=snapshot.find(f=>ids.includes(f.id) && f.geometry?.type==='LineString');
      if(feature)generatedInsertion=generatedMidpointInsertion(feature,snapshot,draft.snapshot());
    }
    draft.invalidateTransient(); changed(true);
    // Feature delete has no finish event. Coordinate edits use Terra Draw's finish event.
    if (type === 'delete' && drafting) {
      // Escape clears Terra's unfinished feature and history. Undo to an empty
      // working line retains its redo stack and remains an unfinished gesture.
      const capturedEpoch=epoch;
      queueMicrotask(()=>{if(!disposed && !restoring && drafting && epoch===capturedEpoch && !routeFeatures().length && !draw.canRedo())restore();});
    } else if (type === 'delete' && !drawing()) commit();
  }
  const historyChanged = () => changed(drawing());
  draw.on('finish', finish); draw.on('change', change); draw.on('history', historyChanged);
  return Object.freeze({
    startDrawing() {
      if (disposed || paused) return;
      restoring = true;
      try { epoch++;drafting=false;draft.invalidateTransient();draw.setMode('select'); draw.clear(); draw.clearUndoRedoHistory(); drafting=true;draw.setMode('linestring'); }
      finally { restoring = false; }
      changed();
    },
    edit() { if (!disposed && !paused) restore(); },
    pause() {
      if (disposed || paused) return;
      epoch++;paused=true;drafting=false;generatedInsertion=null;restoring=true;
      try { draw.setMode('static'); } finally { restoring=false; }
      changed();
    },
    finishDrawing() { if (disposed || paused || !drafting) return false; finishLine(); changed(drawing()); return !drafting; },
    undo() { if (disposed || paused) return false; if (drawingHistory()) { const result = draw.undo(); changed(true); return result; } const result = draft.undo(); if (result) restore(); return result; },
    redo() { if (disposed || paused) return false; if (drawingHistory()) { const result = draw.redo(); changed(true); return result; } const result = draft.redo(); if (result) restore(); return result; },
    clear() { if (disposed || paused) return; draft.clear(); restore(); },
    cancelDrawing() { if (disposed || paused) return; restore(); },
    restore,
    dispose({preserveDraft = false} = {}) {
      if (disposed) return;
      disposed = true;
      draw.off('finish', finish); draw.off('change', change); draw.off('history', historyChanged);
      // TerraDraw.stop() unregisters but does not erase store/history. Clear while enabled.
      try { draw.clear(); draw.clearUndoRedoHistory(); }
      finally { try { draw.stop(); } finally { if (!preserveDraft) draft.dispose(); } }
    },
  });
}

/** Dependency injection avoids a second bundle or a dependency on CDN globals. */
export function createRouteDrawingModes(terra, {autoSelectOnlyRoute = false} = {}) {
  return [new terra.TerraDrawLineStringMode({showCoordinatePoints:true, styles:{lineStringColor:'#136757', lineStringWidth:4}, validation: feature => ({valid: feature.geometry.coordinates.length <= 50_000+(feature.properties.currentlyDrawing===true?1:0), reason:'最多 50,000 點'})}),
    // The built-in globe midpoint takes the short dateline crossing; projected averaging does not.
    new terra.TerraDrawSelectMode({projection:'globe',allowManualSelection:!autoSelectOnlyRoute,allowManualDeselection:!autoSelectOnlyRoute,flags:{linestring:{feature:{selfIntersectable:true,coordinates:{draggable:true, deletable:true, midpoints:true}}}}})];
}
