import {GOOGLE_BRIDGED_SOURCES} from './google-route-sources.mjs';
/** Dependency-free, fixed-source browser transport. No parsing, storage or revision acceptance. */
export const MAX_ROUTE_BYTES = 5 * 1024 * 1024;
export const MAX_ERROR_BYTES = 16 * 1024;
export const DEFAULT_TIMEOUT_MS = 15000;
export const MAX_TIMEOUT_MS = 30000;

// Fixed 2027 Maokong entries from reviewed public originals; no new public asset.
export const ACTIONASIA_MAOKONG_SOURCES = Object.freeze([
  {
    "sourceId": "aa-maokong-2027-25k",
    "endpoint": "/api/routes/aa-maokong-2027-25k",
    "officialPage": "https://actionasiaevents.com/2027-action-asia-x-trail-taiwan/",
    "officialURL": "https://actionasiaevents.com/wp-content/uploads/2026/09/Action-Asia-X-Trail-Maokong-Taipei-25km-newcp3.gpx",
    "originalDownloadUrl": "https://actionasiaevents.com/wp-content/uploads/2026/09/Action-Asia-X-Trail-Maokong-Taipei-25km-newcp3.gpx",
    "sourceFilename": "Action-Asia-X-Trail-Maokong-Taipei-25km-newcp3.gpx",
    "edition": 2027,
    "reviewedSha256": "ac78b0fbea5814dc1f4a6ed353a8682f0a483be9419ea1228b4459c5472c401b",
    "reviewedAt": "2026-10-15T02:56:19Z",
    "expectedBytes": 113962,
    "officialCheckpointStatus": "published_distance_facts_only",
    "officialCheckpointCount": 4,
    "officialAidStationCount": null
  },
  {
    "sourceId": "aa-maokong-2027-18k",
    "endpoint": "/api/routes/aa-maokong-2027-18k",
    "officialPage": "https://actionasiaevents.com/2027-action-asia-x-trail-taiwan/",
    "officialURL": "https://actionasiaevents.com/wp-content/uploads/2026/09/18kmAction-Asia-X-Trail-Maokong-Taiwan-new18km-old-17.gpx",
    "originalDownloadUrl": "https://actionasiaevents.com/wp-content/uploads/2026/09/18kmAction-Asia-X-Trail-Maokong-Taiwan-new18km-old-17.gpx",
    "sourceFilename": "18kmAction-Asia-X-Trail-Maokong-Taiwan-new18km-old-17.gpx",
    "edition": 2027,
    "reviewedSha256": "52f795d42116f980165aaeb70930745da7264c65780eefe6b129c0f08a13b452",
    "reviewedAt": "2026-10-15T02:56:19Z",
    "expectedBytes": 90461,
    "officialCheckpointStatus": "published_distance_facts_only",
    "officialCheckpointCount": 3,
    "officialAidStationCount": null
  },
  {
    "sourceId": "aa-maokong-2027-10k",
    "endpoint": "/api/routes/aa-maokong-2027-10k",
    "officialPage": "https://actionasiaevents.com/2027-action-asia-x-trail-taiwan/",
    "officialURL": "https://actionasiaevents.com/wp-content/uploads/2026/09/Action-Asia-X-Trail-Maokong-Taiwan-new10k-old9km.gpx",
    "originalDownloadUrl": "https://actionasiaevents.com/wp-content/uploads/2026/09/Action-Asia-X-Trail-Maokong-Taiwan-new10k-old9km.gpx",
    "sourceFilename": "Action-Asia-X-Trail-Maokong-Taiwan-new10k-old9km.gpx",
    "edition": 2027,
    "reviewedSha256": "e57423702bef8a97d18892d96216592e5cbbd1e52b8e7233d6dffcdd4bd8a412",
    "reviewedAt": "2026-10-15T02:56:19Z",
    "expectedBytes": 53627,
    "officialCheckpointStatus": "published_distance_facts_only",
    "officialCheckpointCount": 2,
    "officialAidStationCount": null
  }
].map(Object.freeze));
export const ACTIONASIA_MAOKONG_IDENTITIES = Object.freeze(Object.fromEntries(Object.entries({
  "aa-maokong-2027-25k": {
    "name": "Action Asia X-Trail 貓空 25K",
    "rowName": "25K",
    "distance": 25,
    "eventId": "aa-maokong-2027",
    "eventOfficialPage": "https://actionasiaevents.com/2027-action-asia-x-trail-taiwan/",
    "eventMetadataSource": "https://actionasiaevents.com/2027-action-asia-x-trail-taiwan/",
    "eventCorsStatus": "not_tested"
  },
  "aa-maokong-2027-18k": {
    "name": "Action Asia X-Trail 貓空 18K",
    "rowName": "18K",
    "distance": 18,
    "eventId": "aa-maokong-2027",
    "eventOfficialPage": "https://actionasiaevents.com/2027-action-asia-x-trail-taiwan/",
    "eventMetadataSource": "https://actionasiaevents.com/2027-action-asia-x-trail-taiwan/",
    "eventCorsStatus": "not_tested"
  },
  "aa-maokong-2027-10k": {
    "name": "Action Asia X-Trail 貓空 10K",
    "rowName": "10K",
    "distance": 10,
    "eventId": "aa-maokong-2027",
    "eventOfficialPage": "https://actionasiaevents.com/2027-action-asia-x-trail-taiwan/",
    "eventMetadataSource": "https://actionasiaevents.com/2027-action-asia-x-trail-taiwan/",
    "eventCorsStatus": "not_tested"
  }
}).map(([id,record])=>[id,Object.freeze(record)])));

// Copied from the reviewed server catalog. Do not derive these values from a response.
export const BRIDGED_SOURCES = Object.freeze([Object.freeze({
  sourceId: 'taiwan-action-asia-2026-50km',
  endpoint: '/api/routes/taiwan-action-asia-2026-50km',
  officialPage: 'https://actionasiaevents.com/2026-taiwan-action-asia-50-shihmen-reservoir/',
  officialURL: 'https://actionasiaevents.com/wp-content/uploads/2026/07/TWAA50.gpx',
  edition: 2026,
  reviewedSha256: '13662c94c91da42580d0cfb7c8e0a70781cb9e67c2265180e33eaaee2a6d700c',
  reviewedAt: '2026-10-13T14:03:23.743738Z',
  expectedBytes: 194612,
}), Object.freeze({
  sourceId: 'taiwan-action-asia-2026-26km',
  endpoint: '/api/routes/taiwan-action-asia-2026-26km',
  officialPage: 'https://actionasiaevents.com/2026-taiwan-action-asia-50-shihmen-reservoir/',
  officialURL: 'https://actionasiaevents.com/wp-content/uploads/2026/06/26km-NEW-Taiwan-Action-Asia-50-Taiwan-Shihmen-Reservoir.gpx',
  edition: 2026,
  reviewedSha256: 'cc1b1d611b720ec964acfe9b5390c7a83209505c4630463911b5b8563a2dacb2',
  reviewedAt: '2026-10-13T18:37:58Z',
  expectedBytes: 85282,
}), Object.freeze({
  sourceId: 'taiwan-action-asia-2026-12km',
  endpoint: '/api/routes/taiwan-action-asia-2026-12km',
  officialPage: 'https://actionasiaevents.com/2026-taiwan-action-asia-50-shihmen-reservoir/',
  officialURL: 'https://actionasiaevents.com/wp-content/uploads/2026/06/12-km-Taiwan-Action-Asia-50-Shihmen.gpx',
  edition: 2026,
  reviewedSha256: 'dec270e17cc0c2528af01e212c8429fc895384482573e1baa792bf5f9b265592',
  reviewedAt: '2026-10-13T18:38:02Z',
  expectedBytes: 42392,
}), ...ACTIONASIA_MAOKONG_SOURCES, ...GOOGLE_BRIDGED_SOURCES]);

// Keys and records are fixed here. Neither caller options nor responses can add sources.
const SOURCE_BY_ID = Object.freeze(Object.assign(Object.create(null),
  Object.fromEntries(BRIDGED_SOURCES.map(source => [source.sourceId, source]))));
export function getBridgedSource(sourceId) {
  return typeof sourceId === 'string' && Object.hasOwn(SOURCE_BY_ID, sourceId)
    ? SOURCE_BY_ID[sourceId] : null;
}
// Preserve the original 50 km export for existing callers.
export const BRIDGED_SOURCE = getBridgedSource('taiwan-action-asia-2026-50km');

const MESSAGES = Object.freeze({
  unknown_source: 'This route source is not supported.',
  invalid_options: 'The route download options are invalid.',
  invalid_origin: 'Open this route from the planner site.',
  unavailable_environment: 'This browser cannot verify the route download.',
  cancelled: 'Route import was cancelled.',
  timeout: 'The route download timed out. Try again later.',
  network_error: 'The route could not be downloaded. Use the official source or try again later.',
  invalid_response: 'The route service returned an invalid response.',
  unexpected_url: 'The route download address did not match the planner site.',
  invalid_status: 'The route service did not return a complete download.',
  invalid_content_type: 'The route service did not return a GPX file.',
  invalid_provenance: 'The route source or review information could not be verified.',
  invalid_length: 'The route download size declaration could not be verified.',
  length_mismatch: 'The route download was incomplete or its size changed.',
  file_too_large: 'The route download exceeds the 5 MiB limit.',
  empty_body: 'The route service returned no file.',
  invalid_body: 'The route download could not be read.',
  error_body_too_large: 'The route service returned an oversized error response.',
  invalid_error_body: 'The route service returned an unreadable error response.',
  digest_failed: 'The route file could not be checked.',
  hash_mismatch: 'The route file differs from the reviewed version. Check the official source.',
  route_changed: 'The official route has changed. Check the official source before starting a new import.',
  bridge_busy: 'The route service is busy. Try again later.',
  unavailable: 'The route service is temporarily unavailable. Use the official source.',
  access_denied: 'The route service refused the download. Use the official source.',
});
const HASH = /^[a-f0-9]{64}$/;
const OPTION_KEYS = new Set(['signal', 'timeoutMs', 'fetchImpl', 'digest', 'baseOrigin']);
const MIME = response => (response.headers.get('Content-Type') || '').split(';', 1)[0].trim().toLowerCase();
const monotonicNow = () => globalThis.performance?.now?.() ?? Date.now();

/** All displayed text and provenance come from this module, never from server HTML/JSON. */
export class RouteBridgeClientError extends Error {
  constructor(code, {status = null, observedSha256 = null, sourceId = null} = {}) {
    super(MESSAGES[code] || MESSAGES.invalid_response);
    this.name = 'RouteBridgeClientError';
    this.code = Object.hasOwn(MESSAGES, code) ? code : 'invalid_response';
    this.status = Number.isInteger(status) && status >= 0 && status <= 599 ? status : null;
    this.provenance = getBridgedSource(sourceId);
    this.officialPage = this.provenance?.officialPage ?? null;
    this.officialURL = this.provenance?.officialURL ?? null;
    this.observedSha256 = typeof observedSha256 === 'string' && HASH.test(observedSha256) ? observedSha256 : null;
    this.invalidatePriorMetadata = this.code === 'route_changed' || this.code === 'hash_mismatch';
  }
}
const fail = (code, detail) => { throw new RouteBridgeClientError(code, detail); };
function cancelBody(response) {
  try { void Promise.resolve(response?.body?.cancel()).catch(() => {}); } catch {}
}
function cancelAndRelease(reader) {
  if (!reader) return;
  try { void Promise.resolve(reader.cancel()).catch(() => {}); } catch {}
  // Do not await an uncooperative stream's cancellation before releasing or returning.
  try { reader.releaseLock(); } catch {}
}
function declaredLength(response, limit, required, oversizeCode) {
  const header = response.headers.get('Content-Length');
  if (header === null) {
    if (required) fail('invalid_length');
    return null;
  }
  if (!/^(0|[1-9][0-9]*)$/.test(header) || header.length > 16) fail('invalid_length');
  const value = Number(header);
  if (!Number.isSafeInteger(value)) fail('invalid_length');
  if (value > limit) fail(oversizeCode);
  return value;
}
function resolveOrigin(baseOrigin, fetchImpl) {
  const browserOrigin = globalThis.location?.origin;
  const origin = baseOrigin ?? browserOrigin;
  let url;
  try { url = new URL(origin); } catch { fail('invalid_origin'); }
  if (typeof origin !== 'string' || !['http:', 'https:'].includes(url.protocol) || url.origin !== origin)
    fail('invalid_origin');
  if (browserOrigin !== undefined && origin !== browserOrigin) fail('invalid_origin');
  // Outside a browser, baseOrigin is allowed only with an explicit offline fetch implementation.
  // The default transport cannot turn baseOrigin into a general remote-fetch API.
  if (browserOrigin === undefined && fetchImpl === globalThis.fetch) fail('unavailable_environment');
  return origin;
}
async function defaultDigest(bytes) {
  if (typeof globalThis.crypto?.subtle?.digest !== 'function') fail('unavailable_environment');
  return globalThis.crypto.subtle.digest('SHA-256', bytes);
}
function requireEnvironment(fetchImpl, digest) {
  // Missing cancellation support must fail closed, never fall back to unbounded fetch.
  const required = ['AbortController', 'AbortSignal', 'URL', 'TextDecoder',
    'Uint8Array', 'ArrayBuffer', 'setTimeout', 'clearTimeout'];
  if (required.some(name => typeof globalThis[name] !== 'function') ||
      !globalThis.AbortSignal.prototype ||
      typeof globalThis.AbortSignal.prototype.addEventListener !== 'function' ||
      typeof globalThis.AbortSignal.prototype.removeEventListener !== 'function' ||
      typeof globalThis.AbortController.prototype?.abort !== 'function' ||
      fetchImpl === undefined ||
      (digest === defaultDigest && typeof globalThis.crypto?.subtle?.digest !== 'function'))
    fail('unavailable_environment');
}
function hashHex(value) {
  let bytes;
  if (value instanceof Uint8Array) bytes = value;
  else if (value instanceof ArrayBuffer) bytes = new Uint8Array(value);
  else fail('digest_failed');
  if (bytes.byteLength !== 32) fail('digest_failed');
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Resolves to Uint8Array with a read-only, frozen .provenance property.
 * Throws RouteBridgeClientError; no file bytes escape on any failed check.
 * fetchImpl/digest/baseOrigin are trusted offline-test seams, not visitor inputs.
 */
export async function downloadBridgedRoute(sourceId, options = {}) {
  const source = getBridgedSource(sourceId);
  if (!source) fail('unknown_source');
  try {
    return await downloadFixedSource(source, options);
  } catch (error) {
    // Bind every failure, including helper/preflight/abort failures, to this request.
    // Do not inherit identity from an injected transport error or response fields.
    throw new RouteBridgeClientError(
      error instanceof RouteBridgeClientError ? error.code : 'invalid_response', {
        status: error instanceof RouteBridgeClientError ? error.status : null,
        observedSha256: error instanceof RouteBridgeClientError ? error.observedSha256 : null,
        sourceId: source.sourceId,
      });
  }
}

async function downloadFixedSource(source, options) {
  if (!options || typeof options !== 'object' || Array.isArray(options) ||
      Object.keys(options).some(key => !OPTION_KEYS.has(key))) fail('invalid_options');
  const {
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fetchImpl = globalThis.fetch,
    digest = defaultDigest,
    baseOrigin,
  } = options;
  requireEnvironment(fetchImpl, digest);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MAX_TIMEOUT_MS ||
      typeof fetchImpl !== 'function' || typeof digest !== 'function' ||
      (signal !== undefined && !(signal instanceof AbortSignal))) fail('invalid_options');
  const origin = resolveOrigin(baseOrigin, fetchImpl);
  const expectedURL = origin + source.endpoint;
  if (signal?.aborted) fail('cancelled');

  let controller;
  try { controller = new AbortController(); }
  catch { fail('unavailable_environment'); }
  if (!(controller.signal instanceof AbortSignal)) fail('unavailable_environment');
  const deadline = monotonicNow() + timeoutMs;
  let response, reader, timer, yieldTimer, abortError, abortReject;
  const interrupted = new Promise((_, reject) => { abortReject = reject; });
  // A synchronous early failure must not create an unhandled rejection on later abort.
  void interrupted.catch(() => {});
  const stop = code => {
    if (abortError) return;
    abortError = new RouteBridgeClientError(code);
    controller.abort();
    abortReject(abortError);
  };
  const onAbort = () => stop('cancelled');
  const checkActive = () => {
    if (signal?.aborted) stop('cancelled');
    // Also enforce the deadline when immediately resolved reads starve timer callbacks.
    if (!abortError && monotonicNow() >= deadline) stop('timeout');
    if (abortError) throw abortError;
  };
  const bounded = async promise => {
    const result = await Promise.race([promise, interrupted]);
    checkActive();
    return result;
  };
  async function readBounded(limit, length, oversizeCode) {
    if (!response.body) fail('empty_body');
    try { reader = response.body.getReader(); } catch { fail('invalid_body'); }
    let total = 0, batchChunks = 0, batchBytes = 0;
    // Own one bounded container, regardless of how the stream partitions its chunks.
    const bytes = new Uint8Array(length === null ? limit : length);
    while (true) {
      checkActive();
      let part;
      try { part = await bounded(reader.read()); }
      catch (error) {
        if (error instanceof RouteBridgeClientError) throw error;
        fail('invalid_body');
      }
      if (!part) fail('invalid_body');
      const done = part.done;
      if (typeof done !== 'boolean') fail('invalid_body');
      if (done) break; // A terminal result's unused value must not be read.
      const value = part.value;
      if (!(value instanceof Uint8Array)) fail('invalid_body');
      const count = value.byteLength;
      total += count;
      if (total > limit) fail(oversizeCode);
      if (length !== null && total > length) fail('length_mismatch');
      if (count) bytes.set(value, total - count);
      batchChunks++; batchBytes += count;
      if (batchChunks >= 64 || batchBytes >= 262144) {
        // Fulfilled reads only yield microtasks. Let queued abort/deadline tasks run.
        checkActive();
        await bounded(new Promise(resolve => {
          yieldTimer = setTimeout(() => { yieldTimer = undefined; resolve(); }, 0);
        }));
        checkActive();
        batchChunks = 0; batchBytes = 0;
      }
    }
    if (length !== null && total !== length) fail('length_mismatch');
    checkActive();
    return total === bytes.byteLength ? bytes : bytes.slice(0, total);
  }
  async function errorResponse() {
    const status = response.status;
    let data = null;
    try {
      if (MIME(response) !== 'application/json') fail('invalid_error_body');
      const length = declaredLength(response, MAX_ERROR_BYTES, false, 'error_body_too_large');
      const bytes = await readBounded(MAX_ERROR_BYTES, length, 'error_body_too_large');
      try { data = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes)); }
      catch { fail('invalid_error_body'); }
      if (!data || typeof data !== 'object' || Array.isArray(data)) fail('invalid_error_body');
    } catch (error) {
      // Every 409 stays fail-closed, including malformed/oversized revision JSON.
      if (error?.code === 'cancelled' || error?.code === 'timeout') throw error;
      if (status !== 409) throw error;
    }
    if (status === 409) fail('route_changed', {status, observedSha256: data?.observedSha256});
    // Codes are an allowlist; neither server messages nor URLs enter the returned error.
    if (status === 502 && data?.error === 'upstream_access_denied') fail('access_denied', {status});
    if (status === 504 && data?.error === 'timeout') fail('timeout', {status});
    if (status === 502 && data?.error === 'upstream_unavailable') fail('unavailable', {status});
    if (status === 429 && data?.error === 'bridge_busy') fail('bridge_busy', {status});
    if (status === 503) fail('unavailable', {status});
    if (status === 403) fail('access_denied', {status});
    fail('invalid_status', {status});
  }

  try {
    signal?.addEventListener('abort', onAbort, {once: true});
    timer = setTimeout(() => stop('timeout'), timeoutMs);
    checkActive();
    const pending = Promise.resolve().then(() => {
      checkActive();
      return fetchImpl(expectedURL, {
        method: 'GET', mode: 'same-origin', credentials: 'omit',
        referrer: '', referrerPolicy: 'no-referrer', cache: 'no-store', redirect: 'error',
        headers: {Accept: 'application/gpx+xml'}, signal: controller.signal,
      });
    });
    // A nonconforming injected fetch may resolve after cancellation. Discard its body.
    void pending.then(late => {
      if (controller.signal.aborted) cancelBody(late);
      else response = late; // Own the body before the await can lose an abort race.
    }, () => {});
    try { response = await bounded(pending); }
    catch (error) {
      if (error instanceof RouteBridgeClientError) throw error;
      fail('network_error');
    }
    if (!response || !Number.isInteger(response.status) || typeof response.headers?.get !== 'function')
      fail('invalid_response');
    if (response.redirected || response.url !== expectedURL) fail('unexpected_url');
    if (response.status !== 200) {
      if (response.status >= 400 && response.status <= 599) await errorResponse();
      fail('invalid_status', {status: response.status});
    }
    if (MIME(response) !== 'application/gpx+xml') fail('invalid_content_type');
    const requiredHeaders = {
      'X-Route-Source-Id': source.sourceId,
      'X-Route-Official-Page': source.officialPage,
      'X-Route-Sha256': source.reviewedSha256,
      'X-Route-Reviewed-Sha256': source.reviewedSha256,
      'X-Route-Review-Status': 'catalog_reviewed',
      'X-Route-Validation': 'gpx-envelope-only',
    };
    for (const [name, value] of Object.entries(requiredHeaders)) {
      if (response.headers.get(name) !== value) fail('invalid_provenance');
    }
    const length = declaredLength(response, MAX_ROUTE_BYTES, true, 'file_too_large');
    if (length !== source.expectedBytes) fail('invalid_length');
    const bytes = await readBounded(MAX_ROUTE_BYTES, length, 'file_too_large');
    let observedSha256;
    try {
      checkActive();
      const pendingDigest = Promise.resolve().then(() => { checkActive(); return digest(bytes); });
      observedSha256 = hashHex(await bounded(pendingDigest));
    } catch (error) {
      if (error instanceof RouteBridgeClientError) throw error;
      fail('digest_failed');
    }
    // The post-digest check prevents a stale result winning an abort/deadline race.
    checkActive();
    if (observedSha256 !== source.reviewedSha256) fail('hash_mismatch', {observedSha256});
    Object.defineProperty(bytes, 'provenance', {
      value: Object.freeze({...source, observedSha256, byteLength: bytes.byteLength,
        reviewStatus: 'catalog_reviewed', validation: 'gpx-envelope-only'}),
      enumerable: false, writable: false, configurable: false,
    });
    checkActive();
    return bytes;
  } catch (error) {
    checkActive();
    if (error instanceof RouteBridgeClientError) throw error;
    fail('invalid_response');
  } finally {
    clearTimeout(timer);
    clearTimeout(yieldTimer);
    signal?.removeEventListener('abort', onAbort);
    controller.abort();
    if (reader) cancelAndRelease(reader);
    else cancelBody(response);
  }
}
