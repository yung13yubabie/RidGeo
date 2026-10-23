import { HistoryError, normalizeActivity, sourceVerdict, validActivityId, CLASSIFICATIONS } from './normalize.mjs';
import { PROVIDER_LIMITS, DETAIL_BINDING_FIELDS, SUMMARY_OBSERVATION_FIELDS, digestBytes, observeFields, sameObservations, coverageFor, selectionAssessment, classificationFor, normalizedByteLength, normalizedResourceUsage } from './provider-boundary.mjs';

const ORIGIN = 'https://intervals.icu';
const API = `${ORIGIN}/api/v1`;
const STREAM_TYPES = 'time,latlng,distance,altitude,moving';
const LIST_FIELDS = 'id,icu_athlete_id,source,type,name,start_date_local,distance,moving_time,elapsed_time,race,sub_type,stream_types,device_name,start_date,timezone,icu_ignore_time,ignore_pace';
export const SERVER_LIMITS = Object.freeze({ maxWindowDays: 31, pageSize: 200, maxListRequests: 8, maxActivities: 1000,
  maxSelection: 8, maxResponseBytes: 8 * 1024 * 1024, maxImportBytes: 4 * 1024, timeoutMs: 15_000,
  maxAggregatePoints: 50_000, maxAggregateBytes: 12 * 1024 * 1024,
  maxImportAttempts: 48, maxNormalizedBytes: PROVIDER_LIMITS.maxNormalizedBytes, maxNormalizedNodes: PROVIDER_LIMITS.maxNormalizedNodes,
  maxRetainedChoiceBytes: 4 * 1024 * 1024, maxRetainedChoiceNodes: 250_000,
  maxListAggregateBytes: 12 * 1024 * 1024, maxConcurrent: 1, minRequestIntervalMs: 1000, choiceTtlMs: 5 * 60_000, maxSessions: 32, maxChoices: 4000, maxRateRetries: 1 });
const noStoreHeaders = { 'Cache-Control': 'no-store, private', Pragma: 'no-cache', 'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer', 'Content-Type': 'application/json; charset=utf-8', Vary: 'Cookie, Authorization' };
function json(data, status = 200, retryAfter = null) {
  return new Response(JSON.stringify(data), { status, headers: { ...noStoreHeaders,
    ...(retryAfter !== null ? { 'Retry-After': String(retryAfter) } : {}) } });
}
const timeout = () => new HistoryError('upstream_timeout', 504);
function checkpoint(signal) { if (signal.aborted) throw signal.reason instanceof HistoryError ? signal.reason : new HistoryError('cancelled', 499); }
async function raceSignal(promise, signal) {
  checkpoint(signal);
  let abort;
  const interruption = new Promise((_, reject) => { abort = () => reject(signal.reason instanceof HistoryError ? signal.reason : new HistoryError('cancelled', 499)); signal.addEventListener('abort', abort, { once: true }); });
  try { return await Promise.race([promise, interruption]); } finally { signal.removeEventListener('abort', abort); }
}
async function boundedJson(response, signal, maxBytes, budget = null, capture = false, deadline = Infinity, now = Date.now) {
  const mime = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (mime !== 'application/json') { void response.body?.cancel().catch(() => {}); throw new HistoryError('unexpected_content_type', 502); }
  const declared = response.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) { void response.body?.cancel().catch(() => {}); throw new HistoryError('upstream_response_too_large', 502); }
  if (!response.body) throw new HistoryError('empty_upstream_body', 502);
  const reader = response.body.getReader();
  const check = () => { checkpoint(signal); if (now() >= deadline) throw timeout(); };
  let length = 0, batchChunks = 0, yieldTimer;
  try {
    check();
    const bytes = new Uint8Array(maxBytes);
    for (;;) {
      check();
      const next = await raceSignal(reader.read(), signal);
      check();
      const done = next?.done;
      if (typeof done !== 'boolean') throw new HistoryError('invalid_upstream_body', 502);
      if (done) break;
      const value = next.value;
      if (!(value instanceof Uint8Array)) throw new HistoryError('invalid_upstream_body', 502);
      const size = value.byteLength;
      if (size > maxBytes - length) throw new HistoryError('upstream_response_too_large', 502);
      if (budget) { budget.remaining -= size; if (budget.remaining < 0) throw new HistoryError('aggregate_response_too_large', 422); }
      bytes.set(value, length); length += size;
      // Retain no per-chunk objects; even empty reads must let cancellation run.
      if (++batchChunks >= 64) {
        await raceSignal(new Promise(resolve => { yieldTimer = setTimeout(() => { yieldTimer = undefined; resolve(); }, 0); }), signal);
        check(); batchChunks = 0;
      }
    }
    check();
    const capturedBytes = bytes.subarray(0, length);
    let parsed;
    try { parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(capturedBytes)); }
    catch { throw new HistoryError('invalid_upstream_json', 502); }
    check();
    if (!capture) return parsed;
    const sha256 = await raceSignal(digestBytes(capturedBytes), signal); check();
    return { data: parsed, sha256, bytes: length };
  } finally { clearTimeout(yieldTimer); try { void Promise.resolve(reader.cancel()).catch(() => {}); } catch {} try { reader.releaseLock(); } catch {} }
}
function validatedFixedUrl(url) {
  const u = new URL(url);
  if (u.origin !== ORIGIN || u.username || u.password || u.hash || u.port) throw new HistoryError('fixed_endpoint_required', 503);
  if ([...u.searchParams.keys()].some(key => u.searchParams.getAll(key).length !== 1)) throw new HistoryError('fixed_endpoint_required', 503);
  if (u.pathname === '/api/v1/athlete/0/activities') {
    if ([...u.searchParams.keys()].some(k => !['oldest', 'newest', 'limit', 'fields'].includes(k)) ||
      u.searchParams.get('fields') !== LIST_FIELDS || u.searchParams.get('limit') !== String(SERVER_LIMITS.pageSize) ||
      !/^\d{4}-\d{2}-\d{2}T00:00:00$/.test(u.searchParams.get('oldest') ?? '') ||
      !/^\d{4}-\d{2}-\d{2}T23:59:59$/.test(u.searchParams.get('newest') ?? '')) throw new HistoryError('fixed_endpoint_required', 503);
  } else if (/^\/api\/v1\/activity\/[A-Za-z0-9_-]{1,96}(?:\/streams)?$/.test(u.pathname)) {
    if (u.pathname.endsWith('/streams')) {
      if ([...u.searchParams.keys()].some(k => !['types', 'includeDefaults'].includes(k)) ||
        u.searchParams.get('types') !== STREAM_TYPES || u.searchParams.get('includeDefaults') !== 'false') throw new HistoryError('fixed_endpoint_required', 503);
    } else if ([...u.searchParams.keys()].length !== 1 || u.searchParams.get('intervals') !== 'false') throw new HistoryError('fixed_endpoint_required', 503);
  } else throw new HistoryError('fixed_endpoint_required', 503);
  return u;
}
/** Native server transport. It refuses real egress unless the actual runtime guard is present.
 * Injection is for controlled tests or an owner-verified equivalent public-egress platform. */
export function createFixedIntervalsTransport({ fetchImpl = globalThis.fetch, publicEgressGuard = () =>
  globalThis.Cloudflare?.compatibilityFlags?.global_fetch_strictly_public === true } = {}) {
  return async ({ url, authorization, signal }) => {
    validatedFixedUrl(url);
    if (!publicEgressGuard()) throw new HistoryError('public_egress_guard_missing', 503);
    // No inbound Cookie, Authorization, IP, Origin, Referer or other headers are forwarded.
    return fetchImpl(url, { method: 'GET', headers: { Accept: 'application/json', Authorization: authorization },
      redirect: 'manual', cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal });
  };
}
function parseDay(day) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new HistoryError('invalid_date_window', 400);
  const value = Date.parse(`${day}T00:00:00Z`);
  if (!Number.isFinite(value) || new Date(value).toISOString().slice(0, 10) !== day) throw new HistoryError('invalid_date_window', 400);
  return value;
}
export function validateDateWindow(oldest, newest) {
  const from = parseDay(oldest), to = parseDay(newest);
  if (from > to || (to - from) / 86_400_000 + 1 > SERVER_LIMITS.maxWindowDays) throw new HistoryError('invalid_date_window', 400);
  return { from, to };
}
const dayString = day => new Date(day).toISOString().slice(0, 10);
function validSession(session) {
  return session && typeof session.principalId === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(session.principalId) &&
    typeof session.athleteId === 'string' && /^i?[0-9]{1,32}$/.test(session.athleteId) &&
    typeof session.authorization === 'string' && /^Bearer [A-Za-z0-9._~+\/-]{1,4096}={0,2}$/.test(session.authorization) &&
    Array.isArray(session.scopes) && session.scopes.includes('ACTIVITY:READ') &&
    typeof session.sessionId === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(session.sessionId) &&
    typeof session.accountNamespace === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(session.accountNamespace) &&
    Number.isSafeInteger(session.grantEpoch) && session.grantEpoch >= 0;
}
function retrySeconds(response, now) {
  const value = response.headers.get('retry-after');
  if (value && /^\d{1,9}$/.test(value.trim())) return Math.max(1, Number(value));
  const absolute = value && /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(value) ? Date.parse(value) : NaN;
  return Number.isFinite(absolute) ? Math.max(1, Math.ceil((absolute - now) / 1000)) : 60;
}
const delay = (ms, signal) => new Promise((resolve, reject) => {
  checkpoint(signal);
  const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
  const abort = () => { clearTimeout(timer); reject(signal.reason ?? new HistoryError('cancelled', 499)); };
  signal.addEventListener('abort', abort, { once: true });
});
const safeString = value => typeof value === 'string' ? value.slice(0, 200) : null;
/** No login/token issuance/storage service is implemented here. resolveSession must be backed by
 * the host's real server-side verified session and athlete-bound OAuth grant. */
export function createHistoryHandler({ appOrigin = null, resolveSession = null, transport = createFixedIntervalsTransport(),
  sourcePolicy = null, now = Date.now, randomUUID = () => globalThis.crypto.randomUUID(), sleep = delay, state = null } = {}) {
  if(state && (state.schema_version!=='intervals-selected-capability-state/1'||['contextFor','beginOperation','checkpoint','prepareChoices','readChoices','commitChoices','readCommit','recordBackoff','finishOperation'].some(k=>typeof state[k]!=='function'))) throw new HistoryError('history_state_not_configured',503);
  const choices = new Map(), users = new Map(); let active = 0, retainedChoiceBytes = 0, retainedChoiceNodes = 0;
  const keyOf = s => JSON.stringify([s.principalId, s.sessionId, s.athleteId, s.accountNamespace, s.grantEpoch, sourcePolicy?.policyRevision]);
  const cleanup = () => {
    const current = now();
    for (const [key, choice] of choices) if (choice.expires <= current) {
      choices.delete(key); retainedChoiceBytes -= choice.resources.bytes; retainedChoiceNodes -= choice.resources.nodes;
    }
    for (const [key, user] of users) if (user.expires <= current && user.blockedUntil <= current && !user.busy) users.delete(key);
  };
  const bindingFor=async s=>{const owner_key=keyOf(s);return {owner_key,authority_key:JSON.stringify([...JSON.parse(owner_key),await digestBytes(new TextEncoder().encode(s.authorization))]),account_namespace:s.accountNamespace,grant_epoch:s.grantEpoch,source_policy_revision:sourcePolicy.policyRevision};};
  async function storeCall(name,args,signal){try{return await raceSignal(Promise.resolve().then(()=>state[name](...args,{signal})),signal);}catch(e){if(e instanceof HistoryError)throw e;checkpoint(signal);throw new HistoryError('history_state_unavailable',503);}}
  async function upstream(url, session, signal, deadline, budget = null, attempts = null, capture = false, stateScope = null) {
    validatedFixedUrl(url);
    for (let attempt = 0; ; attempt++) {
      checkpoint(signal);
      if (attempts) { if (attempts.remaining <= 0) throw new HistoryError(attempts.error, 422); attempts.remaining--; }
      let response;
      try {
        const pending = Promise.resolve().then(() => transport({ url, authorization: session.authorization, signal }));
        // Even a nonconforming injected transport's late body is discarded after cancellation.
        void pending.then(late => { if (signal.aborted && late instanceof Response) void late.body?.cancel().catch(() => {}); }, () => {});
        response = await raceSignal(pending, signal);
      }
      catch (error) { if (error instanceof HistoryError) throw error; checkpoint(signal); throw new HistoryError('upstream_unavailable', 502); }
      if (!(response instanceof Response)) throw new HistoryError('invalid_transport_response', 502);
      // A custom transport cannot silently hand back a redirected or substituted result.
      if (response.redirected || (response.url && response.url !== url)) { void response.body?.cancel().catch(() => {}); throw new HistoryError('upstream_redirected', 502); }
      if (response.status === 429) {
        const seconds = retrySeconds(response, now());
        void response.body?.cancel().catch(() => {});
        if(stateScope) await storeCall('recordBackoff',[stateScope.binding,stateScope.lease_id,seconds],signal);
        else { const key = keyOf(session), user = users.get(key); if (user) user.blockedUntil = Math.max(user.blockedUntil, now() + seconds * 1000); }
        if (attempt >= SERVER_LIMITS.maxRateRetries || now() + seconds * 1000 + 1000 >= deadline) throw new HistoryError('upstream_rate_limited', 429, seconds);
        await raceSignal(sleep(seconds * 1000, signal), signal); continue;
      }
      if (response.status !== 200) {
        void response.body?.cancel().catch(() => {});
        if (response.status === 401) throw new HistoryError('intervals_authorization_expired', 401);
        if (response.status === 403) throw new HistoryError('intervals_access_denied', 403);
        if (response.status === 404) throw new HistoryError('activity_unavailable', 404);
        throw new HistoryError(response.status >= 300 && response.status < 400 ? 'upstream_redirected' : 'upstream_http_error', 502);
      }
      return boundedJson(response, signal, SERVER_LIMITS.maxResponseBytes, budget, capture, deadline, now);
    }
  }
  async function list(session, window, signal, deadline, stateScope = null) {
    const pending = [[window.from, window.to]], found = new Map(); let requests = 0, duplicates = 0, stubs = 0;
    const attempts = { remaining: SERVER_LIMITS.maxListRequests, error: 'date_window_request_limit' };
    const budget = { remaining: SERVER_LIMITS.maxListAggregateBytes };
    while (pending.length) {
      if (++requests > SERVER_LIMITS.maxListRequests) throw new HistoryError('date_window_request_limit', 422);
      const [from, to] = pending.shift();
      const url = new URL(`${API}/athlete/0/activities`);
      url.searchParams.set('oldest', `${dayString(from)}T00:00:00`); url.searchParams.set('newest', `${dayString(to)}T23:59:59`);
      url.searchParams.set('limit', String(SERVER_LIMITS.pageSize)); url.searchParams.set('fields', LIST_FIELDS);
      const items = await upstream(url.href, session, signal, deadline, budget, attempts, false, stateScope);
      if (!Array.isArray(items) || items.length > SERVER_LIMITS.pageSize) throw new HistoryError('invalid_activity_list', 502);
      if (items.length === SERVER_LIMITS.pageSize) {
        // Descending timestamps are not unique. Bisection avoids skip-at-boundary pagination.
        // A saturated single day cannot be declared complete with this endpoint.
        if (from === to) throw new HistoryError('single_day_list_saturated', 422);
        const middle = from + Math.floor((to - from) / 86_400_000 / 2) * 86_400_000;
        pending.push([middle + 86_400_000, to], [from, middle]); continue;
      }
      for (const item of items) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw new HistoryError('invalid_activity_list', 502);
        if (!validActivityId(item.id)) { if (!Object.keys(item).length) { stubs++; continue; } throw new HistoryError('invalid_activity_list', 502); }
        // API credential may have coach/shared access. Require this activity's explicit athlete owner.
        if (item.icu_athlete_id !== session.athleteId) throw new HistoryError('activity_ownership_unverified', 403);
        if (typeof item.start_date_local !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(item.start_date_local)) throw new HistoryError('invalid_activity_date', 502);
        const activityDay = parseDay(item.start_date_local.slice(0, 10));
        if (activityDay < from || activityDay > to) throw new HistoryError('out_of_window_activity', 502);
        if (found.has(item.id)) {
          const previous = found.get(item.id);
          if (LIST_FIELDS.split(',').some(field => JSON.stringify(previous[field] ?? null) !== JSON.stringify(item[field] ?? null)))
            throw new HistoryError('conflicting_duplicate_activity', 502);
          duplicates++; continue;
        }
        found.set(item.id, item); if (found.size > SERVER_LIMITS.maxActivities) throw new HistoryError('too_many_activities', 422);
      }
    }
    cleanup();
    const entries = [...found.values()].sort((a, b) => b.start_date_local.localeCompare(a.start_date_local) || a.id.localeCompare(b.id));
    if (!stateScope && choices.size + entries.length > SERVER_LIMITS.maxChoices) throw new HistoryError('selection_capacity', 429, 60);
    const prepared=stateScope?await storeCall('prepareChoices',[stateScope.binding,stateScope.lease_id,entries.length],signal):null;
    const owner = keyOf(session), expires = prepared?prepared.expires_ms:now() + SERVER_LIMITS.choiceTtlMs;
    const stagedChoices = new Map(); let stagedBytes = 0, stagedNodes = 0;
    const result = entries.map(activity => {
      const verdict = sourceVerdict(activity); let choiceId = null;
      if (verdict.allowed) {
        choiceId = randomUUID();
        if (!/^[a-zA-Z0-9_-]{16,96}$/.test(choiceId) || choices.has(choiceId) || stagedChoices.has(choiceId)) throw new HistoryError('selection_identifier_unavailable', 503);
        const captured = { owner, expires, activity: { id: activity.id, source: activity.source },
          listing: observeFields(activity, LIST_FIELDS.split(',')), window: { from: window.from, to: window.to } };
        const resources = normalizedResourceUsage(captured, { maxBytes: SERVER_LIMITS.maxRetainedChoiceBytes, maxNodes: SERVER_LIMITS.maxRetainedChoiceNodes });
        stagedBytes += resources.bytes; stagedNodes += resources.nodes;
        if (retainedChoiceBytes + stagedBytes > SERVER_LIMITS.maxRetainedChoiceBytes ||
          retainedChoiceNodes + stagedNodes > SERVER_LIMITS.maxRetainedChoiceNodes) throw new HistoryError('selection_observation_capacity', 429, 60);
        stagedChoices.set(choiceId, { ...captured, resources });
      }
      return { choiceId, name: safeString(activity.name), sport: safeString(activity.type), startDateLocal: activity.start_date_local,
        source: safeString(activity.source), selectable: verdict.allowed, unavailableReason: verdict.reason,
        classification: activity.race === true || activity.sub_type === 'RACE' ? 'race' : 'unclassified',
        distanceM: typeof activity.distance === 'number' && Number.isFinite(activity.distance) ? activity.distance : null,
        elapsedTimeS: typeof activity.elapsed_time === 'number' && Number.isFinite(activity.elapsed_time) ? activity.elapsed_time : null };
    });
    const data = { schemaVersion: 'intervals-history-selection-v1', complete: true, entries: result,
      quality: { duplicateActivities: duplicates, inaccessibleStubs: stubs },
      availabilityState: stubs ? result.length ? 'accessible_and_inaccessible' : 'inaccessible_only' : result.length ? 'accessible_entries' : 'empty_complete_window',
      completeQueryTraversal: true, noInaccessibleStubsObserved: stubs === 0, selectionExpiresAt: new Date(expires).toISOString(),
      aggregation: 'individual-activities-only', rightsGuarantee: false,
      resources: { upstreamBytes: SERVER_LIMITS.maxListAggregateBytes - budget.remaining,
        maxListAggregateBytes: SERVER_LIMITS.maxListAggregateBytes, maxRetainedChoiceBytes: SERVER_LIMITS.maxRetainedChoiceBytes,
        maxRetainedChoiceNodes: SERVER_LIMITS.maxRetainedChoiceNodes } };
    return { data, install() {
      if(stateScope) return (async()=>{const rows=[...stagedChoices].map(([choice_id,c])=>{const {resources,...captured}=c;return{choice_id,captured,resources};});const digest=await raceSignal(digestBytes(new TextEncoder().encode(JSON.stringify(rows))),signal);checkpoint(signal);try{return await storeCall('commitChoices',[stateScope.binding,stateScope.lease_id,rows],signal);}catch(e){checkpoint(signal);if(e instanceof HistoryError&&e.code!=='history_state_unavailable')throw e;try{const read=await storeCall('readCommit',[stateScope.binding,stateScope.lease_id,digest],signal);if(read.state==='committed')return read;}catch{}checkpoint(signal);throw new HistoryError('history_state_unavailable',503);}})();
      // Legacy admission before response creation; private shared admission is owner-bound even after delivery loss.
      cleanup();
      if (choices.size + stagedChoices.size > SERVER_LIMITS.maxChoices ||
        retainedChoiceBytes + stagedBytes > SERVER_LIMITS.maxRetainedChoiceBytes ||
        retainedChoiceNodes + stagedNodes > SERVER_LIMITS.maxRetainedChoiceNodes) throw new HistoryError('selection_observation_capacity', 429, 60);
      for (const [id, choice] of stagedChoices) choices.set(id, choice);
      retainedChoiceBytes += stagedBytes; retainedChoiceNodes += stagedNodes;
    } };
  }
  async function importSelection(request, session, signal, deadline, stateScope = null) {
    let parsed;
    try { parsed = await boundedJson(request, signal, SERVER_LIMITS.maxImportBytes, null, false, deadline, now); }
    catch (error) {
      if (error instanceof HistoryError) {
        if (error.code === 'upstream_response_too_large') throw new HistoryError('selection_body_too_large', 413);
        if (error.code === 'unexpected_content_type') throw new HistoryError('selection_content_type_required', 415);
        if (['empty_upstream_body', 'invalid_upstream_json'].includes(error.code)) throw new HistoryError('invalid_selection_json', 400);
      }
      throw error;
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || Object.keys(parsed).some(k => k !== 'selections') ||
      !Array.isArray(parsed.selections) || parsed.selections.length < 1 || parsed.selections.length > SERVER_LIMITS.maxSelection) throw new HistoryError('invalid_selection', 400);
    cleanup(); const owner = keyOf(session), selected = new Map();
    for (const entry of parsed.selections) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry) || Object.keys(entry).some(k => !['choiceId', 'classification'].includes(k)) ||
        typeof entry.choiceId !== 'string' || !/^[a-zA-Z0-9_-]{16,96}$/.test(entry.choiceId) ||
        (entry.classification !== undefined && !CLASSIFICATIONS.includes(entry.classification))) throw new HistoryError('invalid_selection', 400);
      const choice = stateScope?(await storeCall('readChoices',[stateScope.binding,stateScope.lease_id,[entry.choiceId]],signal)).choices[0]:choices.get(entry.choiceId), classification = entry.classification ?? null;
      if (!choice || choice.owner !== owner || choice.expires <= now()) throw new HistoryError('selection_unavailable', 403);
      const previous = selected.get(choice.activity.id);
      if (previous) {
        if (previous.classification !== classification) throw new HistoryError('selection_classification_conflict', 422);
        if (!sameObservations(previous.listing, choice.listing)) throw new HistoryError('activity_selection_snapshot_conflict', 422);
        previous.choiceIds.push(entry.choiceId); continue;
      }
      selected.set(choice.activity.id, { ...choice, choiceIds: [entry.choiceId], classification });
    }
    const activities = [], coverages = [], budget = { remaining: SERVER_LIMITS.maxAggregateBytes };
    const attempts = { remaining: SERVER_LIMITS.maxImportAttempts, error: 'import_request_limit' }; let points = 0, readOrder = 0;
    const requireOwned = (activity, choice) => {
      if (!activity || activity.id !== choice.activity.id || activity.icu_athlete_id !== session.athleteId) throw new HistoryError('activity_ownership_changed', 403);
      if (!sourceVerdict(activity).allowed || activity.source !== choice.activity.source) throw new HistoryError('activity_source_changed', 403);
      if (!sameObservations(observeFields(activity, LIST_FIELDS.split(',')), choice.listing)) throw new HistoryError('activity_list_snapshot_changed', 409);
      const day = parseDay(activity.start_date_local.slice(0, 10));
      if (day < choice.window.from || day > choice.window.to) throw new HistoryError('activity_list_snapshot_changed', 409);
    };
    for (const choice of selected.values()) {
      const id = choice.activity.id;
      const before = await upstream(`${API}/activity/${id}?intervals=false`, session, signal, deadline, budget, attempts, true, stateScope);
      requireOwned(before.data, choice); const beforeOrder = ++readOrder;
      const beforeFields = observeFields(before.data, DETAIL_BINDING_FIELDS);
      const stream = await upstream(`${API}/activity/${id}/streams?types=${STREAM_TYPES}&includeDefaults=false`, session, signal, deadline, budget, attempts, true, stateScope);
      const streamOrder = ++readOrder;
      const incomingPoints = Array.isArray(stream.data) ? stream.data.reduce((sum, row) =>
        sum + (row?.type === 'time' && Array.isArray(row.data) ? row.data.length : 0), 0) : 0;
      if (incomingPoints + points > SERVER_LIMITS.maxAggregatePoints) throw new HistoryError('aggregate_point_limit', 422);
      points += incomingPoints;
      const after = await upstream(`${API}/activity/${id}?intervals=false`, session, signal, deadline, budget, attempts, true, stateScope);
      requireOwned(after.data, choice); const afterOrder = ++readOrder;
      if (!sameObservations(beforeFields, observeFields(after.data, DETAIL_BINDING_FIELDS))) throw new HistoryError('activity_observed_snapshot_changed', 409);
      const normalized = normalizeActivity(before.data, stream.data, { classification: choice.classification });
      const coverage = coverageFor(before.data, normalized); coverages.push(coverage);
      activities.push({ choiceId: choice.choiceIds[0], choiceAliases: [...choice.choiceIds], ...normalized,
        providerIdentity: { provider: 'Intervals.icu', accountNamespace: session.accountNamespace, activityId: id },
        classificationEvidence: classificationFor(before.data, choice.classification), coverage: coverage.public,
        sourceSummaryObservations: { schemaVersion: 'intervals-provider-summary-observations-v1',
          source: 'selected_activity_detail_before', fields: observeFields(before.data, SUMMARY_OBSERVATION_FIELDS) },
        providerReferenceEligibility: { structurallyComplete: coverage.structurallyEligible, qualification: 'not_evaluated', performanceModelReady: false },
        observedSnapshot: { schemaVersion: 'intervals-observed-snapshot-v1', atomicRevisionVerified: false,
          provenanceBasis: 'trusted_server_owned_selected_GETs', relevantDetailUnchanged: true,
          detailBefore: { sha256: before.sha256, bytes: before.bytes, readOrder: beforeOrder },
          streams: { sha256: stream.sha256, bytes: stream.bytes, readOrder: streamOrder },
          detailAfter: { sha256: after.sha256, bytes: after.bytes, readOrder: afterOrder },
          streamEditDetection: 'Unchanged detail does not detect every edit to stream content.' } });
    }
    return { schemaVersion: 'intervals-history-import-v2', mode: activities.length === 1 ? 'single' : 'multiple', activities,
      suppliedSelectionCount: parsed.selections.length, uniqueActivityCount: activities.length,
      aggregation: 'individual-activities-only', abilityCoefficient: null,
      selectionAssessment: selectionAssessment(activities, coverages),
      accessBinding: { accountNamespace: session.accountNamespace, grantEpoch: session.grantEpoch, sourcePolicyRevision: sourcePolicy.policyRevision,
        verification: 'trusted_server_session_resolver', normalizedClientDocumentsAccepted: false },
      resources: { upstreamBytes: SERVER_LIMITS.maxAggregateBytes - budget.remaining, originalSamples: points,
        attemptedGETs: SERVER_LIMITS.maxImportAttempts - attempts.remaining, maxGETAttempts: SERVER_LIMITS.maxImportAttempts,
        maxNormalizedBytes: SERVER_LIMITS.maxNormalizedBytes, maxNormalizedNodes: SERVER_LIMITS.maxNormalizedNodes },
      integrationStatus: 'normalized-only-gpx-core-not-connected' };
  }

  return async function handle(request, trustedScope = null) {
    const url = new URL(request.url);
    const requestStarted = now();
    let slotHeld = false;
    if (!url.pathname.startsWith('/api/history/intervals/')) return null;
    try {
      if (!appOrigin || !resolveSession) throw new HistoryError('hosting_session_not_configured', 503);
      if (new URL(appOrigin).origin !== appOrigin || url.origin !== appOrigin) throw new HistoryError('origin_denied', 403);
      if (request.headers.get('origin') && request.headers.get('origin') !== appOrigin) throw new HistoryError('origin_denied', 403);
      if (['cross-site', 'same-site'].includes(request.headers.get('sec-fetch-site'))) throw new HistoryError('origin_denied', 403);
      if (url.pathname === '/api/history/intervals/activities') {
        if (request.method !== 'GET') throw new HistoryError('method_not_allowed', 405);
        if ([...url.searchParams.keys()].some(k => !['oldest', 'newest'].includes(k)) || url.searchParams.getAll('oldest').length !== 1 || url.searchParams.getAll('newest').length !== 1) throw new HistoryError('invalid_request', 400);
      } else if (url.pathname === '/api/history/intervals/import') {
        if (request.method !== 'POST') throw new HistoryError('method_not_allowed', 405);
        if (url.search || request.headers.get('origin') !== appOrigin) throw new HistoryError('invalid_request', 400);
      } else throw new HistoryError('not_found', 404);
      const window = request.method === 'GET' ? validateDateWindow(url.searchParams.get('oldest'), url.searchParams.get('newest')) : null;
      // Reserve the isolate slot before invoking any asynchronous hosting-session resolver.
      if (active >= SERVER_LIMITS.maxConcurrent) throw new HistoryError('history_busy', 429, 1);
      active++; slotHeld = true;
      let session;
      const authController = new AbortController();
      const authTimer = setTimeout(() => authController.abort(timeout()), SERVER_LIMITS.timeoutMs);
      const authAbort = () => authController.abort(new HistoryError('cancelled', 499));
      request.signal.addEventListener('abort', authAbort, { once: true }); if (request.signal.aborted) authAbort();
      try { session = await raceSignal(Promise.resolve().then(() => resolveSession(request)), authController.signal); }
      catch (error) { if (error instanceof HistoryError) throw error; throw new HistoryError('hosting_session_unavailable', 503); }
      finally { clearTimeout(authTimer); request.signal.removeEventListener('abort', authAbort); }
      if (!validSession(session)) throw new HistoryError('verified_session_required', 401);
      // The host may mutate its own session object during awaits; preserve the admitted epoch.
      session = Object.freeze({ ...session, scopes: Object.freeze([...session.scopes]) });
      if (sourcePolicy?.zeppTransientPersonalUseReviewed !== true || typeof sourcePolicy.policyRevision !== 'string' ||
        !/^[A-Za-z0-9_-]{1,128}$/.test(sourcePolicy.policyRevision)) throw new HistoryError('source_policy_not_configured', 503);
      cleanup(); const key = keyOf(session), current = now();let stateScope=null,user=null;
      if(state){if(!trustedScope||Object.keys(trustedScope).sort().join(',')!=='binding,lease_id')throw new HistoryError('history_state_scope_required',503);const binding=await raceSignal(bindingFor(session),request.signal);if(Object.keys(binding).some(k=>trustedScope.binding?.[k]!==binding[k])||Object.keys(trustedScope.binding||{}).sort().join(',')!==Object.keys(binding).sort().join(','))throw new HistoryError('access_epoch_changed',403);stateScope={binding,lease_id:trustedScope.lease_id};await storeCall('checkpoint',[binding,stateScope.lease_id],request.signal);}
      else {if (!users.has(key)) { if (users.size >= SERVER_LIMITS.maxSessions) throw new HistoryError('session_capacity', 429, 60); users.set(key, { next: 0, blockedUntil: 0, busy: false, expires: 0 }); }
      user = users.get(key); user.expires = current + SERVER_LIMITS.choiceTtlMs;
      if (user.busy) throw new HistoryError('history_busy', 429, 1);
      if (current < Math.max(user.next, user.blockedUntil)) throw new HistoryError('history_rate_limited', 429, Math.max(1, Math.ceil((Math.max(user.next, user.blockedUntil) - current) / 1000)));
      user.next = current + SERVER_LIMITS.minRequestIntervalMs; user.busy = true;}
      const controller = new AbortController(), deadline = requestStarted + SERVER_LIMITS.timeoutMs;
      const timer = setTimeout(() => controller.abort(timeout()), Math.max(0, deadline - now()));
      const abort = () => controller.abort(new HistoryError('cancelled', 499)); request.signal.addEventListener('abort', abort, { once: true });
      if (request.signal.aborted) abort();
      try {
        const listed = window ? await list(session, window, controller.signal, deadline,stateScope) : null;
        const data = listed ? listed.data : await importSelection(request, session, controller.signal, deadline,stateScope);
        checkpoint(controller.signal);
        const fresh = await raceSignal(Promise.resolve().then(() => resolveSession(request)), controller.signal);
        if (!validSession(fresh) || keyOf(fresh) !== key || fresh.authorization !== session.authorization || sourcePolicy?.zeppTransientPersonalUseReviewed !== true) throw new HistoryError('access_epoch_changed', 403);
        normalizedByteLength(data, { check() { checkpoint(controller.signal); if (now() >= deadline) throw timeout(); } });
        checkpoint(controller.signal);if(stateScope)await storeCall('checkpoint',[stateScope.binding,stateScope.lease_id],controller.signal); if (listed) {if(stateScope)await listed.install();else listed.install();}checkpoint(controller.signal);return json(data);
      } finally { clearTimeout(timer); request.signal.removeEventListener('abort', abort); if(user)user.busy = false; }
    } catch (error) {
      // No errors, upstream text, GPS, activity IDs, session IDs or credentials are logged.
      const safe = error instanceof HistoryError ? error : new HistoryError('history_unavailable', 503);
      return json({ error: safe.code }, safe.status, safe.retryAfter);
    } finally { if (slotHeld) active--; }
  };
}
