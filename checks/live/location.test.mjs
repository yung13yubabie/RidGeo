import test from 'node:test';
import assert from 'node:assert/strict';
import {LocationProvider} from '../../public/live-location.mjs';

function harness(options = {}) {
  let mono = 100, wall = 1700000000000;
  const watches = [], cleared = [], states = [], fixes = [];
  const listeners = new Set();
  const document = {hidden: false,
    addEventListener: (type, listener) => listeners.add(listener),
    removeEventListener: (type, listener) => listeners.delete(listener)};
  const geolocation = {watchPosition(success, error, config) {
    watches.push({success, error, config}); return watches.length - 1;
  }, clearWatch: id => cleared.push(id)};
  const provider = new LocationProvider({geolocation, document, monotonicNow: () => mono,
    wallNow: () => wall, onFix: fix => fixes.push(fix), onState: state => states.push(state), ...options});
  return {provider, watches, cleared, states, fixes, document, listeners,
    advance(ms) {mono += ms; wall += ms;}, jump(ms) {wall += ms;},
    hide(hidden = true) {document.hidden = hidden; for (const listener of listeners) listener();},
    fix({timestamp = wall, coords = {}, index = watches.length - 1} = {}) {
      watches[index].success({timestamp, coords: {latitude: 25, longitude: 121, accuracy: 3, ...coords}});
    }, get wall() {return wall;}, set mono(value) {mono = value;}};
}
test('construction does not request permission; start is explicit and repeated starts are idempotent', () => {
  const h = harness(); assert.equal(h.watches.length, 0);
  assert.equal(h.provider.start(), true); h.provider.start(); h.provider.resume();
  assert.equal(h.watches.length, 1);
  assert.deepEqual(h.watches[0].config, {enableHighAccuracy: true, maximumAge: 0, timeout: 15000});
  h.advance(1000); h.fix({timestamp: h.wall - 50});
  assert.deepEqual(h.fixes[0], {lat: 25, lon: 121, accuracyM: 3, timestampMs: h.wall - 50, ageMs: 50});
});
test('hidden clears watch, old callbacks are ignored, visibility needs explicit resume', () => {
  const h = harness(); h.provider.start(); h.hide();
  assert.equal(h.provider.state, 'hidden'); assert.deepEqual(h.cleared, [0]);
  h.fix(); h.watches[0].error({code: 1}); assert.equal(h.fixes.length, 0);
  assert.equal(h.provider.start(), false);
  h.hide(false); assert.equal(h.provider.state, 'idle'); assert.equal(h.watches.length, 1);
  h.advance(1000); h.provider.resume(); assert.equal(h.watches.length, 2);
  h.fix({index: 0}); assert.equal(h.fixes.length, 0); h.fix(); assert.equal(h.fixes.length, 1);
});
test('visibility is emitted even before location starts', () => {
  const h = harness(); h.hide(); assert.equal(h.provider.state, 'hidden');
  h.hide(false); assert.equal(h.provider.state, 'idle'); assert.equal(h.watches.length, 0);
});
test('denial, timeout, and unavailable errors end watch and ignore late callbacks', () => {
  for (const code of [1, 2, 3]) {
    const h = harness(); h.provider.start(); h.watches[0].error({code});
    assert.equal(h.provider.state, code === 1 ? 'denied' : 'error');
    assert.equal(h.provider.watchId, null); assert.equal(h.provider.watching, false);
    assert.deepEqual(h.cleared, [0]); h.fix(); assert.equal(h.fixes.length, 0);
  }
});
test('stop and destroy clear state; destroy removes listener and prevents restart', () => {
  const h = harness(); h.provider.start(); h.provider.stop(); h.fix();
  assert.equal(h.fixes.length, 0); assert.equal(h.provider.watchId, null);
  h.provider.resume(); h.provider.destroy(); h.fix();
  assert.equal(h.listeners.size, 0); assert.equal(h.provider.start(), false);
  assert.deepEqual(h.cleared, [0, 1]);
});
test('cached, stale, future and nonfinite timestamps fail closed', () => {
  for (const kind of ['cached', 'stale', 'future', 'nan', 'infinity']) {
    const h = harness(); h.provider.start(); const start = h.wall; h.advance(20000);
    const timestamp = {cached: start - 1, stale: start + 8000, future: h.wall + 1, nan: NaN, infinity: Infinity}[kind];
    h.fix({timestamp}); assert.equal(h.fixes.length, 0, kind); assert.equal(h.provider.state, 'error', kind);
    assert.deepEqual(h.cleared, [0]);
  }
});
test('wall-clock discontinuities in either direction stop acquisition', () => {
  for (const delta of [-10000, 10000]) {
    const h = harness(); h.provider.start(); h.advance(1000); h.fix();
    h.advance(1000); h.jump(delta); h.fix();
    assert.equal(h.fixes.length, 1); assert.equal(h.states.at(-1).reason, 'wall-clock-discontinuity');
    assert.deepEqual(h.cleared, [0]);
    h.provider.resume(); h.fix(); assert.equal(h.fixes.length, 2);
  }
});
test('small wall drift does not corrupt monotonic-derived age', () => {
  const h = harness(); h.provider.start(); h.advance(1000); h.jump(100);
  h.fix({timestamp: h.wall - 150}); assert.equal(h.fixes[0].ageMs, 50);
});
test('duplicate timestamps and invalid coordinates are rejected', () => {
  const h = harness(); h.provider.start(); h.fix(); h.fix();
  assert.equal(h.fixes.length, 1); assert.equal(h.states.at(-1).reason, 'duplicate-or-out-of-order');
  for (const coords of [{latitude: 91}, {longitude: Infinity}, {accuracy: -1}]) {
    const x = harness(); x.provider.start(); x.fix({coords}); assert.equal(x.fixes.length, 0);
  }
});
test('a synchronous error before watch id returns still clears the returned id', () => {
  const cleared = [];
  const h = harness({geolocation: {watchPosition(ok, fail) {fail({code: 1}); return 7;}, clearWatch(id) {cleared.push(id);}}});
  assert.equal(h.provider.start(), false); assert.equal(h.provider.state, 'denied');
  assert.deepEqual(cleared, [7]); assert.equal(h.provider.watchId, null);
});
test('clearWatch exceptions do not retain state or permit old callbacks', () => {
  const h = harness(); h.provider.geolocation.clearWatch = () => {throw Error('clear failed');};
  h.provider.start(); h.provider.stop(); h.fix();
  assert.equal(h.provider.watching, false); assert.equal(h.provider.watchId, null); assert.equal(h.fixes.length, 0);
});
test('unsupported, throwing watch, and backwards monotonic clock fail safely', () => {
  const unsupported = harness({geolocation: null}); assert.equal(unsupported.provider.start(), false);
  assert.equal(unsupported.provider.state, 'unsupported');
  const thrown = harness({geolocation: {watchPosition() {throw Error('no');}, clearWatch() {}}});
  assert.equal(thrown.provider.start(), false); assert.equal(thrown.provider.watching, false);
  const h = harness(); h.provider.start(); h.mono = 0; h.fix();
  assert.equal(h.states.at(-1).reason, 'invalid-clock'); assert.deepEqual(h.cleared, [0]);
});
test('permission retry is explicit and failed-watch callbacks cannot affect a new watch', () => {
  const h = harness(); h.provider.start(); h.watches[0].error({code: 1});
  assert.equal(h.watches.length, 1); h.provider.resume();
  h.watches[0].error({code: 1}); h.fix({index: 0});
  assert.equal(h.provider.state, 'acquiring'); assert.equal(h.fixes.length, 0);
  h.fix(); assert.equal(h.fixes.length, 1); assert.equal(h.provider.state, 'active');
});
test('callback checks hidden flag even before visibility event dispatch', () => {
  const h = harness(); h.provider.start(); h.document.hidden = true; h.fix();
  assert.equal(h.provider.state, 'hidden'); assert.equal(h.fixes.length, 0);
  assert.deepEqual(h.cleared, [0]);
});
test('synchronous success followed by consumer stop cannot leak the new watcher', () => {
  const cleared = [];
  let provider;
  provider = new LocationProvider({document: null, monotonicNow: () => 10, wallNow: () => 1000,
    geolocation: {watchPosition(ok) {ok({timestamp: 1000, coords: {latitude: 0, longitude: 0, accuracy: 1}}); return 2;},
      clearWatch(id) {cleared.push(id);}}, onFix: () => provider.stop()});
  assert.equal(provider.start(), false); assert.deepEqual(cleared, [2]); assert.equal(provider.watchId, null);
});
