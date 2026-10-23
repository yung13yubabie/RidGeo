/** Read-only formatting of existing elapsed prefixes. No model or date arithmetic. */
const rounded = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && Number.isSafeInteger(Math.floor(value + 0.5)) ? Math.floor(value + 0.5) : null;
const duration = seconds => `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export function formatElapsedDuration(seconds) {
  const value = rounded(seconds);
  return value === null ? '待計算' : duration(value);
}

export function checkpointTime(seconds, startClock) {
  const value = rounded(seconds);
  if (value === null) return {clock: '待計算', elapsed: '待計算'};
  const elapsed = duration(value);
  if (typeof startClock !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startClock)) return {clock: '時刻待設定', elapsed};
  const [hours, minutes] = startClock.split(':').map(Number);
  const total = value + hours * 3600 + minutes * 60;
  if (!Number.isSafeInteger(total)) return {clock: '時刻待設定', elapsed};
  const days = Math.floor(total / 86400);
  return {clock: duration(total % 86400) + (days ? ` +${days}天` : ''), elapsed};
}

export function checkpointTimeText(seconds, startClock) {
  const value = checkpointTime(seconds, startClock);
  return value.elapsed === '待計算' ? '待計算' : `${value.clock}（累計 ${value.elapsed}）`;
}

export function appendCheckpointTime(cell, seconds, startClock, doc = document) {
  const value = checkpointTime(seconds, startClock);
  const main = doc.createElement('span'), sub = doc.createElement('small');
  main.className = 'checkpoint-clock'; main.textContent = value.clock;
  sub.className = 'checkpoint-elapsed'; sub.textContent = value.elapsed === '待計算' ? '累計待計算' : `累計 ${value.elapsed}`;
  cell.replaceChildren(main, sub);
  return cell;
}
