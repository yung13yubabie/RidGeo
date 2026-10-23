/**
 * Pure, bounded service-stop proposals. No DOM, storage, network, route timeline,
 * fatigue/recovery model, or mutations. See CONTRACT.md for owner obligations.
 */
import {parseCpStopValue, sumStopSeconds} from './cp-stop-seconds.mjs';
export const SCHEMA_VERSION = 1;
export const MAX_TEMPLATES = 16;
export const MAX_ROWS = 1000;
export const MAX_MINUTES = 1440;
export const MAX_STORE_CHARACTERS = 32768;
export const TASKS = Object.freeze(['water', 'food', 'gear', 'clothes', 'rest', 'other']);
export const STATUS_TEXT = Object.freeze({
  no_route: '尚未載入路線',
  timing_only: '僅計時站',
  finish: '終點不適用',
  template_not_selected: '未選組合',
  availability_unconfirmed: '待確認服務',
  template_duration_unknown: '時間未定',
  not_selected: '未勾選',
  unchanged: '維持原值',
  ready: '可套用',
});

export class ServiceStopInputError extends TypeError {
  constructor(code, path = '') {
    super(code);
    this.name = 'ServiceStopInputError';
    this.code = code;
    this.path = path;
  }
}

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
function fail(code, path) { throw new ServiceStopInputError(code, path); }
function plain(value) {
  return value !== null && typeof value === 'object' &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
function object(value, keys, path) {
  if (!plain(value)) fail('object_required', path);
  const actual = Reflect.ownKeys(value);
  if (actual.length !== keys.length || actual.some(key => typeof key !== 'string' || !keys.includes(key))) {
    fail('unexpected_or_missing_field', path);
  }
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !own(descriptor, 'value') || !descriptor.enumerable) fail('plain_data_required', `${path}.${key}`);
  }
}
function array(value, max, path) {
  if (!Array.isArray(value) || value.length > max) fail('array_budget', path);
  // Sparse arrays, accessors and attached properties are not JSON input data.
  if (Reflect.ownKeys(value).length !== value.length + 1) fail('plain_array_required', path);
  for (let i = 0; i < value.length; i++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
    if (!descriptor || !own(descriptor, 'value') || !descriptor.enumerable) fail('plain_array_required', path);
  }
}
function string(value, max, path, { nonblank = false, trimmed = false } = {}) {
  if (typeof value !== 'string' || value.length > max ||
      (nonblank && !value.trim()) || (trimmed && value !== value.trim())) fail('string_invalid', path);
}
function boolean(value, path) {
  if (typeof value !== 'boolean') fail('boolean_required', path);
}
function freeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Blank is unknown. Exact tenths only; no Number('') or floating rounding. */
export function parseStopValue(raw) {
  const result = (status, code, tenths = null) => freeze({
    raw: typeof raw === 'string' ? raw : null, status, code, tenths,
    minutes: tenths === null ? null : tenths / 10,
    seconds: tenths === null ? null : tenths * 6,
  });
  if (typeof raw !== 'string' || raw.length > 64) return result('invalid', 'stop_value_invalid');
  const text = raw.trim();
  if (!text) return result('unknown', 'stop_value_unknown');
  const match = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/.exec(text);
  if (!match) return result('invalid', 'stop_value_invalid');
  const fraction = match[3] ?? match[4] ?? '';
  let digits = `${match[2] ?? ''}${fraction}`.replace(/^0+/, '');
  // An explicitly zero coefficient is exact even for -0.0e2 or 0e999.
  // Check it before rejecting a negative sign: signed zero is a legal raw CP
  // value. No exponent expansion, float underflow or overflow may turn NONzero
  // into zero, and every negative nonzero coefficient remains invalid below.
  if (!digits) return result('known', 'stop_value_known', 0);
  if (match[1] === '-') return result('invalid', 'stop_out_of_range');
  const exponentText = (match[5] ?? '0').replace(/^[+-]/, '').replace(/^0+/, '') || '0';
  if (exponentText.length > 4) return result('invalid', 'stop_exponent_budget');
  const exponent = Number(match[5] ?? '0');
  const trailingZeroes = digits.length - digits.replace(/0+$/, '').length;
  digits = digits.slice(0, digits.length - trailingZeroes);
  const shift = exponent - fraction.length + 1 + trailingZeroes;
  if (shift < 0) return result('invalid', 'stop_precision_invalid');
  if (digits.length + shift > 5) return result('invalid', 'stop_out_of_range');
  const tenths = Number(digits + '0'.repeat(shift));
  if (tenths > MAX_MINUTES * 10) return result('invalid', 'stop_out_of_range');
  return result('known', 'stop_value_known', tenths);
}

function rawFromTenths(tenths) {
  return `${Math.floor(tenths / 10)}${tenths % 10 ? `.${tenths % 10}` : ''}`;
}
function templatesCopy(templates, path = 'templates') {
  array(templates, MAX_TEMPLATES, path);
  const ids = new Set(), bundles = new Set();
  return templates.map((template, i) => {
    const p = `${path}[${i}]`;
    object(template, ['id', 'name', 'tasks', 'minutes'], p);
    string(template.id, 60, `${p}.id`, { nonblank: true, trimmed: true });
    string(template.name, 60, `${p}.name`, { nonblank: true });
    if (ids.has(template.id)) fail('duplicate_template_id', `${p}.id`);
    ids.add(template.id);
    array(template.tasks, TASKS.length, `${p}.tasks`);
    if (!template.tasks.length || template.tasks.some(task => !TASKS.includes(task)) ||
        new Set(template.tasks).size !== template.tasks.length) fail('template_tasks_invalid', `${p}.tasks`);
    const bundle = [...template.tasks].sort().join('|');
    if (bundles.has(bundle)) fail('duplicate_template_bundle', `${p}.tasks`);
    bundles.add(bundle);
    const duration = parseStopValue(template.minutes);
    if (duration.status === 'invalid') fail(duration.code, `${p}.minutes`);
    return { id: template.id, name: template.name, tasks: [...template.tasks], minutes: template.minutes };
  });
}
function storeCopy(value) {
  object(value, ['version', 'templates', 'defaultTemplateId'], 'store');
  if (value.version !== SCHEMA_VERSION) fail('schema_version_invalid', 'store.version');
  const templates = templatesCopy(value.templates, 'store.templates');
  if (value.defaultTemplateId !== null && !templates.some(t => t.id === value.defaultTemplateId)) {
    fail('default_template_missing', 'store.defaultTemplateId');
  }
  return { version: SCHEMA_VERSION, templates, defaultTemplateId: value.defaultTemplateId };
}

export function validateTemplateStore(value) {
  try { return freeze({ ok: true, value: storeCopy(value), errors: [] }); }
  catch (error) {
    if (!(error instanceof ServiceStopInputError)) throw error;
    return freeze({ ok: false, value: null, errors: [{ code: error.code, path: error.path }] });
  }
}

/** Returns JSON only. Calling localStorage belongs to the explicit owner action. */
export function encodeTemplateStore(value) {
  const text = JSON.stringify(storeCopy(value));
  if (text.length > MAX_STORE_CHARACTERS) fail('store_budget', 'store');
  return text;
}

/** Invalid/corrupted/oversized data is rejected; there is no silent fallback. */
export function decodeTemplateStore(text) {
  if (typeof text !== 'string' || text.length > MAX_STORE_CHARACTERS) fail('store_budget', 'store');
  let value;
  try { value = JSON.parse(text); }
  catch { fail('store_json_invalid', 'store'); }
  return freeze(storeCopy(value));
}

const ROW_KEYS = ['id', 'name', 'rawStop', 'distanceRaw', 'kind', 'locationPending', 'stopRevision'];
const SNAPSHOT_KEYS = ['routeExists', 'routeRevision', 'mappingRevision', 'rows', 'templates', 'choices'];
function revision(value, path) {
  if (typeof value === 'string') string(value, 2048, path, { nonblank: true });
  else if (!Number.isSafeInteger(value) || value < 0 || Object.is(value, -0)) fail('revision_invalid', path);
}
function rowsCopy(rows) {
  array(rows, MAX_ROWS, 'rows');
  const ids = new Set();
  return rows.map((row, i) => {
    const p = `rows[${i}]`;
    object(row, ROW_KEYS, p);
    string(row.id, 160, `${p}.id`, { nonblank: true, trimmed: true });
    if (ids.has(row.id)) fail('duplicate_row_id', `${p}.id`);
    ids.add(row.id);
    string(row.name, 240, `${p}.name`);
    // Preserve even malformed user-entered values. The parser reports status.
    string(row.rawStop, 4096, `${p}.rawStop`);
    string(row.distanceRaw, 4096, `${p}.distanceRaw`);
    if (!['service', 'timing_only', 'finish'].includes(row.kind)) fail('row_kind_invalid', `${p}.kind`);
    boolean(row.locationPending, `${p}.locationPending`);
    if (!Number.isSafeInteger(row.stopRevision) || row.stopRevision < 0 || Object.is(row.stopRevision, -0)) {
      fail('stop_revision_invalid', `${p}.stopRevision`);
    }
    return Object.fromEntries(ROW_KEYS.map(key => [key, row[key]]));
  });
}
function snapshotCopy(input) {
  object(input, SNAPSHOT_KEYS, 'snapshot');
  boolean(input.routeExists, 'routeExists');
  revision(input.routeRevision, 'routeRevision');
  revision(input.mappingRevision, 'mappingRevision');
  const rows = rowsCopy(input.rows), templates = templatesCopy(input.templates);
  array(input.choices, MAX_ROWS, 'choices');
  const ids = new Set(), rowIds = new Set(rows.map(row => row.id)), templateIds = new Set(templates.map(t => t.id));
  const choices = input.choices.map((choice, i) => {
    const p = `choices[${i}]`;
    object(choice, ['id', 'templateId', 'selected', 'availableConfirmed'], p);
    if (!rowIds.has(choice.id)) fail('choice_row_missing', `${p}.id`);
    if (ids.has(choice.id)) fail('duplicate_choice_id', `${p}.id`);
    ids.add(choice.id);
    if (choice.templateId !== null && choice.templateId !== '' && !templateIds.has(choice.templateId)) {
      fail('choice_template_missing', `${p}.templateId`);
    }
    boolean(choice.selected, `${p}.selected`);
    boolean(choice.availableConfirmed, `${p}.availableConfirmed`);
    return { id: choice.id, templateId: choice.templateId, selected: choice.selected, availableConfirmed: choice.availableConfirmed };
  });
  return { routeExists: input.routeExists, routeRevision: input.routeRevision,
    mappingRevision: input.mappingRevision, rows, templates, choices };
}

/** Stable canonical JSON, not a cryptographic hash or persisted route record. */
export function snapshotSignature(input) {
  return JSON.stringify({ schema: 'service-stop-preview/1', ...snapshotCopy(input) });
}

/**
 * Sum authoritative raw stops only. All supplied occurrences count separately.
 * No route -> null; unknown or invalid input -> null, never a zero-filled total.
 */
export function sumCpStops(rows, options = {}) {
  object(options, ['routeExists'], 'sumOptions');
  const { routeExists } = options;
  boolean(routeExists, 'routeExists');
  const copied = rowsCopy(rows);
  const unknownIds = [], invalidIds = [];
  let knownTenths = 0, exactTenths = true;
  const knownSeconds = [];
  for (const row of copied) {
    const parsed = parseCpStopValue(row.rawStop);
    if (parsed.status === 'known') {
      knownSeconds.push(parsed.seconds);
      if (parsed.tenths === null) exactTenths = false;
      else knownTenths += parsed.tenths;
    }
    else (parsed.status === 'unknown' ? unknownIds : invalidIds).push(row.id);
  }
  const status = !routeExists ? 'no_route' : invalidIds.length ? 'invalid' : unknownIds.length ? 'unknown' : 'known';
  const tenths = status === 'known' && exactTenths ? knownTenths : null;
  const seconds = status === 'known' ? sumStopSeconds(knownSeconds) : null;
  return freeze({ status, tenths, minutes: seconds === null ? null : seconds / 60,
    seconds, unknownIds, invalidIds });
}

/** Does not write anything: resultRaw is a proposal for the owner's Apply step. */
export function createStopPreview(input) {
  const snapshot = snapshotCopy(input);
  const signature = snapshotSignature(snapshot);
  const byTemplate = new Map(snapshot.templates.map(t => [t.id, t]));
  const byChoice = new Map(snapshot.choices.map(c => [c.id, c]));
  const entries = snapshot.rows.map(row => {
    const choice = byChoice.get(row.id);
    const selected = choice?.selected === true;
    const availableConfirmed = choice?.availableConfirmed === true;
    const template = byTemplate.get(choice?.templateId);
    const duration = template ? parseStopValue(template.minutes) : null;
    const blockedCode = !snapshot.routeExists ? 'no_route' : row.kind !== 'service' ? row.kind :
      !template ? 'template_not_selected' : !availableConfirmed ? 'availability_unconfirmed' :
      duration.status !== 'known' ? 'template_duration_unknown' : null;
    const eligible = blockedCode === null;
    const proposedRaw = eligible ? rawFromTenths(duration.tenths) : null;
    const apply = selected && eligible && proposedRaw !== row.rawStop;
    const statusCode = blockedCode || (!selected ? 'not_selected' : apply ? 'ready' : 'unchanged');
    return { id: row.id, name: row.name, currentRaw: row.rawStop,
      proposedRaw, resultRaw: apply ? proposedRaw : row.rawStop,
      currentStop: parseCpStopValue(row.rawStop), proposedMinutes: eligible ? duration.minutes : null,
      eligible, apply, selected, availableConfirmed, templateId: template?.id ?? null,
      tasks: template ? [...template.tasks] : [], statusCode, statusText: STATUS_TEXT[statusCode] };
  });
  const resultRows = snapshot.rows.map((row, i) => ({ ...row, rawStop: entries[i].resultRaw }));
  return freeze({ schemaVersion: SCHEMA_VERSION, signature, snapshot, entries,
    canApply: entries.some(entry => entry.apply),
    applyIds: entries.filter(entry => entry.apply).map(entry => entry.id),
    currentTotal: sumCpStops(snapshot.rows, { routeExists: snapshot.routeExists }),
    resultTotal: sumCpStops(resultRows, { routeExists: snapshot.routeExists }),
    mutatesInput: false });
}
