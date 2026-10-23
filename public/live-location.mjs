/** Foreground-only location adapter. No storage/network access or implicit watch. */
export class LocationProvider {
  constructor({
    geolocation = globalThis.navigator?.geolocation,
    document = globalThis.document,
    monotonicNow = () => globalThis.performance.now(),
    wallNow = () => Date.now(),
    onFix = () => {}, onState = () => {}, staleMs = 12000, clockToleranceMs = 2000,
  } = {}) {
    if (typeof monotonicNow !== 'function' || typeof wallNow !== 'function' ||
        typeof onFix !== 'function' || typeof onState !== 'function' ||
        !Number.isFinite(staleMs) || staleMs <= 0 ||
        !Number.isFinite(clockToleranceMs) || clockToleranceMs < 0) {
      throw new TypeError('Invalid LocationProvider options');
    }
    Object.assign(this, {geolocation, document, monotonicNow, wallNow, onFix, onState, staleMs, clockToleranceMs});
    this.state = 'idle'; this.watchId = null; this.watching = false;
    this.generation = 0; this.destroyed = false; this.anchor = null;
    this.lastTimestamp = null; this.lastMono = null;
    this.visibilityListener = () => {
      if (this.document?.hidden) this._end('hidden', 'document-hidden');
      else this._emit('idle', 'visible-explicit-resume-required');
    };
    this.document?.addEventListener?.('visibilitychange', this.visibilityListener);
  }
  _emit(state, reason) {
    this.state = state;
    this.onState({state, reason});
  }
  _clear(id) {
    if (id !== null && id !== undefined) {
      // Invalidate our callbacks even when an implementation fails to clear.
      try { this.geolocation?.clearWatch(id); } catch { /* generation is authoritative */ }
    }
  }
  _end(state, reason) {
    this.generation++;
    this.watching = false;
    const id = this.watchId;
    this.watchId = null;
    this.anchor = null;
    this._clear(id);
    this._emit(state, reason);
  }
  start() {
    if (this.destroyed) return false;
    if (this.document?.hidden) {
      this._end('hidden', 'explicit-start-while-hidden');
      return false;
    }
    if (this.watching) return true;
    if (typeof this.geolocation?.watchPosition !== 'function' || typeof this.geolocation?.clearWatch !== 'function') {
      this._end('unsupported', 'geolocation-unavailable');
      return false;
    }
    const mono = this.monotonicNow(), wall = this.wallNow();
    if (!Number.isFinite(mono) || mono < 0 || !Number.isFinite(wall)) {
      this._end('error', 'invalid-clock');
      return false;
    }
    const generation = ++this.generation;
    this.anchor = {mono, wall}; this.lastMono = mono; this.lastTimestamp = null;
    this.watching = true;
    this._emit('acquiring', 'explicit-start');
    // A consumer may synchronously stop in onState.
    if (generation !== this.generation || !this.watching) return false;
    try {
      const id = this.geolocation.watchPosition(
        position => this._position(position, generation),
        error => {
          if (generation !== this.generation || !this.watching) return;
          this._end(error?.code === 1 ? 'denied' : 'error',
            error?.code === 1 ? 'permission-denied' : error?.code === 3 ? 'location-timeout' : 'position-unavailable');
        },
        {enableHighAccuracy: true, maximumAge: 0, timeout: 15000},
      );
      // Some test doubles/platforms invoke callbacks before returning the id.
      if (generation !== this.generation || !this.watching) this._clear(id);
      else this.watchId = id;
    } catch {
      if (generation === this.generation && this.watching) this._end('error', 'watch-start-failed');
      return false;
    }
    return this.watching;
  }
  resume() { return this.start(); }
  stop() { this._end('idle', 'explicit-stop'); }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.document?.removeEventListener?.('visibilitychange', this.visibilityListener);
    this._end('idle', 'destroyed');
  }
  _position(position, generation) {
    if (generation !== this.generation || !this.watching) return;
    if (this.document?.hidden) { this._end('hidden', 'document-hidden'); return; }
    const mono = this.monotonicNow(), wall = this.wallNow();
    const anchor = this.anchor;
    if (!Number.isFinite(mono) || !Number.isFinite(wall) || mono < this.lastMono) {
      this._end('error', 'invalid-clock'); return;
    }
    this.lastMono = mono;
    const expectedWall = anchor.wall + (mono - anchor.mono);
    if (!Number.isFinite(expectedWall) || Math.abs(wall - expectedWall) > this.clockToleranceMs) {
      this._end('error', 'wall-clock-discontinuity'); return;
    }
    const timestampMs = position?.timestamp;
    // Use the monotonic anchor, not a possibly changed Date.now(), for age.
    // Never clamp a future timestamp to zero or silently accept cached fixes.
    const ageMs = expectedWall - timestampMs;
    const coords = position?.coords;
    if (!Number.isFinite(timestampMs) || !Number.isFinite(ageMs) || ageMs < 0 || timestampMs > wall ||
        ageMs >= this.staleMs || timestampMs < anchor.wall ||
        !Number.isFinite(coords?.latitude) || Math.abs(coords.latitude) > 90 ||
        !Number.isFinite(coords?.longitude) || Math.abs(coords.longitude) > 180 ||
        !Number.isFinite(coords?.accuracy) || coords.accuracy < 0) {
      this._end('error', 'bad-or-stale-fix'); return;
    }
    if (this.lastTimestamp !== null && timestampMs <= this.lastTimestamp) {
      this._end('error', 'duplicate-or-out-of-order'); return;
    }
    this.lastTimestamp = timestampMs;
    this._emit('active', 'fresh-fix');
    if (generation !== this.generation || !this.watching) return;
    this.onFix({lat: coords.latitude, lon: coords.longitude, accuracyM: coords.accuracy, timestampMs, ageMs});
  }
}
