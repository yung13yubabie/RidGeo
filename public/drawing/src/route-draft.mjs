/** Local drawing contract. Geometry/planning remains owned by the existing Python core. */
export const MAX_DRAW_POINTS = 50_000;
export const MAX_GPX_BYTES = 5 * 1024 * 1024;
export const DRAWING_NOTICE = '未沿道路校正 · 海拔未知';
export class DraftError extends Error {
  constructor(code, message) { super(message); this.name = 'DraftError'; this.code = code; }
}
const fail = (code, message) => { throw new DraftError(code, message); };
const clone = value => structuredClone(value);
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
function text(value, label, max = 200) {
  if (typeof value !== 'string' || value.length > max || /[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/u.test(value)) fail('invalid_text', `${label}格式不正確。`);
  return value;
}
const escapeXml = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function denseArray(value, maximum, code, message) {
  if (!Array.isArray(value) || value.length > maximum) fail(code, message);
  for (let i = 0; i < value.length; i++) if (!Object.hasOwn(value, i)) fail(code, message);
  return value;
}
export function validateCoordinates(value) {
  denseArray(value, MAX_DRAW_POINTS, 'point_limit', '路線須為完整點列，最多 50,000 點。');
  const checked = [];
  for (let i = 0; i < value.length; i++) {
    const position = value[i];
    if (!Array.isArray(position) || position.length !== 2 || !Object.hasOwn(position, 0) || !Object.hasOwn(position, 1) || !Number.isFinite(position[0]) || !Number.isFinite(position[1]) || Math.abs(position[0]) > 180 || Math.abs(position[1]) > 90) fail('invalid_coordinate', '每點須為有效的經度、緯度；不能缺項或附帶海拔、時間。');
    checked.push([Object.is(position[0], -0) ? 0 : position[0], Object.is(position[1], -0) ? 0 : position[1]]);
  }
  return checked;
}
export function coordinatesFromFeature(feature) {
  if (feature?.type !== 'Feature' || feature.geometry?.type !== 'LineString') fail('single_line_required', '請使用一條連續折線；不會自動合併多段。');
  return validateCoordinates(feature.geometry.coordinates);
}
/** Expand the shortest round-trip Number spelling to XML Schema decimal syntax. */
function coordinateDecimal(value) {
  const literal = String(value);
  if (!/[eE]/u.test(literal)) return literal;
  const [mantissa, exponentText] = literal.toLowerCase().split('e');
  const negative = mantissa.startsWith('-'), unsigned = negative ? mantissa.slice(1) : mantissa;
  const [integer, fraction = ''] = unsigned.split('.'), digits = integer + fraction;
  const position = integer.length + Number(exponentText);
  const decimal = position <= 0 ? '0.' + '0'.repeat(-position) + digits :
    position >= digits.length ? digits + '0'.repeat(position - digits.length) :
      digits.slice(0, position) + '.' + digits.slice(position);
  const result = (negative ? '-' : '') + decimal;
  if (Number(result) !== value) fail('coordinate_serialization', '點位無法無損轉成 GPX。');
  return result;
}
export function drawnGpx(coordinates, name = '地圖自畫路線') {
  const points = validateCoordinates(coordinates);
  if (points.length < 2) fail('too_few_points', '至少畫兩個點。');
  text(name, '路線名稱');
  // GPX1.1 excludes +180 longitude; GPX1.0 preserves that legal core boundary.
  const version = points.some(([lon]) => lon === 180) ? '1.0' : '1.1';
  // No rounding, reordering, deduplication, resampling, fabricated elevation or timestamps.
  const result = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    `<gpx version="${version}" creator="RidGEQ local route drawing" xmlns="http://www.topografix.com/GPX/1/${version === '1.0' ? '0' : '1'}">` +
    `<trk><name>${escapeXml(name)}</name><desc>地圖自畫；未沿道路校正；海拔未知；非導航資料。</desc><trkseg>` +
    points.map(([lon, lat]) => `<trkpt lat="${coordinateDecimal(lat)}" lon="${coordinateDecimal(lon)}"/>`).join('') +
    '</trkseg></trk></gpx>';
  if (new TextEncoder().encode(result).byteLength > MAX_GPX_BYTES) fail('file_limit', 'GPX 超過 5 MiB 限制。');
  return result;
}
export async function sha256(bytes) {
  const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}
const sameCoordinates = (a, b) => a.length === b.length && a.every((p, i) => p[0] === b[i][0] && p[1] === b[i][1]);
const validHash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const validDistance = value => Number.isFinite(value) && value >= 0;

/** Map display is fed by the same validated details response as the existing raw profile. */
export function mapLinesFromDetails(details) {
  if (details?.detail_schema_version !== 'trail-details/1.0' || !validHash(details.source?.route_sha256) || !Array.isArray(details.raw_profile_segments)) fail('invalid_details', '原始路線資料尚未驗證。');
  denseArray(details.raw_profile_segments, 2000, 'invalid_details', '原始路線段必須完整。');
  let count = 0;
  const lines = details.raw_profile_segments.map((segment, segmentIndex) => {
    if (!segment || segment.segment_index !== segmentIndex || !Array.isArray(segment.points)) fail('invalid_order', '原始路線段順序不一致。');
    denseArray(segment.points, MAX_DRAW_POINTS, 'invalid_details', '原始路線點必須完整。');
    const points = segment.points.map(point => {
      if (!point || point.source_point_index !== count++) fail('invalid_order', '原始路線點順序不一致。');
      validateCoordinates([[point.lon, point.lat]]);
      if (!(point.ele === null || (Number.isFinite(point.ele) && point.ele >= -1000 && point.ele <= 10000))) fail('invalid_elevation', '海拔資料不正確。');
      if (!(point.canonical_along_route_m === null || validDistance(point.canonical_along_route_m))) fail('invalid_distance', '原始路線里程不正確。');
      return {sourcePointIndex: point.source_point_index, lat: point.lat, lon: point.lon, elevationM: point.ele, canonicalAlongRouteM: point.canonical_along_route_m};
    });
    return {segmentIndex, points};
  });
  if (count > MAX_DRAW_POINTS || count !== details.summary?.point_count) fail('invalid_details', '原始路線點數不一致。');
  return freeze({routeSha256: details.source.route_sha256, lines});
}

export function createRouteDraft({id, name = '地圖自畫路線', historyLimit = 25, historyPointLimit = 100_000, onInvalidate = () => {}}) {
  text(id, '路線識別', 128); if (!id) fail('invalid_id', '需要路線識別。'); text(name, '路線名稱');
  if (!Number.isInteger(historyLimit) || historyLimit < 1 || historyLimit > 100 || !Number.isInteger(historyPointLimit) || historyPointLimit < MAX_DRAW_POINTS || historyPointLimit > 1_000_000) fail('invalid_history_limit', '復原設定不正確。');
  let coordinates = [], revision = 0, requestId = 0, history = [], future = [], inspection = null, pending = null, disposed = false;
  const active = () => { if (disposed) fail('disposed', '此繪圖工作已結束。'); };
  function invalidate(reason) {
    revision++; requestId++; pending = null; inspection = null;
    onInvalidate(freeze({routeId: id, revision, reason, clearResults: true, clearCheckpoints: true, clearRouteConsent: true}));
  }
  function trimHistory() {
    let size = history.reduce((n, entry) => n + entry.coordinates.length, 0);
    while (history.length > historyLimit || size > historyPointLimit) size -= history.shift().coordinates.length;
  }
  function snapshot() {
    return freeze({schema: 'ridgeq-drawn-route/1', routeId: id, revision, name, sourceKind: 'drawn_unsnapped', coordinates: clone(coordinates), pointCount: coordinates.length, routing: 'unverified_unsnapped', elevation: 'unknown', navigation: 'unverified', canExport: coordinates.length >= 2, canUndo: history.length > 0, canRedo: future.length > 0, inspection: clone(inspection)});
  }
  function replace(next, reason = 'edit') {
    active(); const checked = validateCoordinates(next);
    if (sameCoordinates(coordinates, checked)) return false;
    history.push({coordinates, contentRevision: revision}); trimHistory(); future = []; coordinates = checked; invalidate(reason); return true;
  }
  function historyMove(from, to, reason) {
    active(); if (!from.length) return false;
    const previous = from.pop(); to.push({coordinates, contentRevision: revision}); coordinates = previous.coordinates;
    // A monotonic revision blocks late asynchronous work even when content is restored.
    invalidate(reason); return true;
  }
  return Object.freeze({
    snapshot,
    setCoordinates: next => replace(next),
    setFeature: feature => replace(coordinatesFromFeature(feature)),
    clear: () => replace([], 'clear'),
    undo: () => historyMove(history, future, 'undo'),
    redo: () => { const result = historyMove(future, history, 'redo'); trimHistory(); return result; },
    /** Transient dragging must invalidate displayed calculations before finish. Does not change committed geometry. */
    invalidateTransient() { active(); requestId++; pending = null; inspection = null; },
    exportGpx() { active(); return drawnGpx(coordinates, name); },
    async prepareInspection() {
      active(); const capturedRevision = revision, capturedRequest = ++requestId;
      // Supersede the old ticket synchronously, before the digest yields.
      pending = null; inspection = null;
      const bytes = new TextEncoder().encode(drawnGpx(coordinates, name));
      const digest = await sha256(bytes);
      if (disposed || capturedRevision !== revision || capturedRequest !== requestId) return null;
      pending = freeze({routeId: id, revision, requestId: capturedRequest, routeSha256: digest});
      return {ticket: pending, bytes};
    },
    acceptInspection(ticket, route, details) {
      active();
      if (!pending || !ticket || ['routeId','revision','requestId','routeSha256'].some(key => ticket[key] !== pending[key]) || ticket.revision !== revision || ticket.requestId !== requestId) return false;
      if (route?.route_sha256 !== ticket.routeSha256 || details?.source?.route_sha256 !== ticket.routeSha256 || details?.canonical_geometry?.route_sha256 !== ticket.routeSha256 || details?.canonical_geometry?.geometry_sha256 !== route.geometry_sha256) fail('identity_mismatch', '路線檢查結果不屬於目前草稿。');
      const mapped = mapLinesFromDetails(details), points = mapped.lines[0]?.points;
      if (mapped.lines.length !== 1 || points.length !== coordinates.length || !points.every((p, i) => p.lon === coordinates[i][0] && p.lat === coordinates[i][1] && p.elevationM === null)) fail('order_mismatch', '檢查結果與草稿點位不一致。');
      const canonical=details.canonical_geometry;
      const qualityValid=value=>{
        denseArray(value,MAX_DRAW_POINTS+10,'invalid_inspection','路線檢查結果格式不正確。');
        return value.every(issue=>issue && typeof issue==='object' && typeof issue.code==='string' && issue.code.length>0 && typeof issue.message==='string' && issue.message.length>0 && ['info','warning','error'].includes(issue.severity));
      };
      if (route.elevation_complete !== false || route.ascent_m !== null || route.descent_m !== null || !validDistance(route.horizontal_distance_m) || !validDistance(route.distance_m) || typeof route.blocked !== 'boolean' || !qualityValid(route.quality) || !qualityValid(canonical.quality) || route.blocked!==route.quality.some(issue=>issue.severity==='error')) fail('invalid_inspection', '路線檢查結果格式不正確。');
      if (route.blocked ? route.geometry_sha256 !== '' : !validHash(route.geometry_sha256)) fail('invalid_inspection', '幾何識別不正確。');
      // Inspect and details come from the same unchanged core. Their canonical
      // geometry fields must agree exactly, rather than choosing one distance.
      if (['distance_m','horizontal_distance_m','elevation_complete','ascent_m','descent_m','blocked','geometry_version','source_points','segment_count'].some(key=>route[key]!==canonical[key]) || route.source_points!==coordinates.length || route.segment_count!==1 || typeof route.geometry_version!=='string' || !route.geometry_version || details.source.version!==(coordinates.some(([lon])=>lon===180)?'1.0':'1.1') || route.quality.length!==canonical.quality.length || route.quality.some((issue,i)=>['code','severity','message'].some(key=>issue[key]!==canonical.quality[i][key]))) fail('geometry_mismatch', '草稿兩次檢查的幾何資料不一致，請重新檢查。');
      if (route.blocked ? points.some(p=>p.canonicalAlongRouteM!==null) : points[0].canonicalAlongRouteM!==0 || points.at(-1).canonicalAlongRouteM!==route.distance_m || points.some((p,i)=>p.canonicalAlongRouteM===null || p.canonicalAlongRouteM>route.distance_m || i>0 && p.canonicalAlongRouteM<points[i-1].canonicalAlongRouteM)) fail('geometry_mismatch', '草稿點位里程與檢查結果不一致。');
      inspection = freeze({routeSha256: ticket.routeSha256, geometrySha256: route.geometry_sha256, distanceM: route.distance_m, horizontalDistanceM: route.horizontal_distance_m, elevation: 'unknown', ascentM: null, descentM: null, blocked: route.blocked, quality: clone(route.quality), mapLines: mapped.lines});
      pending = null;
      return true;
    },
    dispose() { disposed = true; requestId++; pending = null; inspection = null; history = []; future = []; coordinates = []; },
  });
}
