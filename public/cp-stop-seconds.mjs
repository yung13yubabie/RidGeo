/** Raw checkpoint minutes -> seconds. No duration quantization or draft mutation. */
export const MAX_CP_STOP_MINUTES = 1440;
export const MAX_CP_STOP_RAW_CHARACTERS = 64;

export function parseCpStopValue(raw) {
  const result = (status, code, seconds = null, tenths = null) => Object.freeze({
    raw: typeof raw === 'string' ? raw : null, status, code, tenths,
    minutes: seconds === null ? null : seconds / 60, seconds,
  });
  if (typeof raw !== 'string' || raw.length > MAX_CP_STOP_RAW_CHARACTERS) return result('invalid', 'stop_value_invalid');
  const text = raw.trim();
  if (!text) return result('unknown', 'stop_value_unknown');
  const match = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/.exec(text);
  if (!match) return result('invalid', 'stop_value_invalid');
  const fraction = match[3] ?? match[4] ?? '';
  let digits = `${match[2] ?? ''}${fraction}`.replace(/^0+/, '');
  // Literal signed zero is known; nonzero overflow/underflow cannot become zero.
  if (!digits) return result('known', 'stop_value_known', 0, 0);
  if (match[1] === '-') return result('invalid', 'stop_out_of_range');
  const exponentDigits = (match[5] ?? '0').replace(/^[+-]/, '').replace(/^0+/, '') || '0';
  if (exponentDigits.length > 4) return result('invalid', 'stop_exponent_budget');
  const trailing = digits.length - digits.replace(/0+$/, '').length;
  digits = digits.slice(0, digits.length - trailing);
  const scale = Number(match[5] ?? '0') - fraction.length + trailing;
  const order = digits.length + scale;
  const whole = digits.slice(0, 4).padEnd(4, '0');
  if (order > 4 || order === 4 && (whole > '1440' || whole === '1440' && digits.length > 4)) {
    return result('invalid', 'stop_out_of_range');
  }
  // Scale the decimal coefficient before converting to the backend's Number
  // representation. This avoids intermediate minute rounding and quantization.
  const seconds = Number(`${BigInt(digits) * 60n}e${scale}`);
  if (!Number.isFinite(seconds) || seconds <= 0) return result('invalid', 'stop_unrepresentable');
  const tenthScale = scale + 1;
  const tenths = tenthScale >= 0 ? Number(digits + '0'.repeat(tenthScale)) : null;
  return result('known', 'stop_value_known', seconds, tenths);
}

/** New imported occurrence: choose raw minutes that preserve the numeric seconds. */
export function formatCpStopMinutes(seconds) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0 || seconds > MAX_CP_STOP_MINUTES * 60) {
    throw new RangeError('Invalid checkpoint seconds');
  }
  if (seconds === 0) return '0';
  const matches = raw => raw.length <= MAX_CP_STOP_RAW_CHARACTERS && parseCpStopValue(raw).seconds === seconds;
  const minutes = seconds / 60, ordinary = String(minutes);
  if (matches(ordinary)) return ordinary;
  // Presentation-friendly alternatives are allowed only with exact roundtrip.
  for (let precision = 1; precision <= 17; precision++) {
    const candidate = minutes.toPrecision(precision);
    if (matches(candidate)) return candidate;
  }
  // Exact binary rational seconds / 60, including subnormals. Approximate its
  // decimal text at 24 significant digits, well inside the original float's
  // rounding interval, then verify identity. No duration is changed or clipped.
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, seconds, false);
  const bits = view.getBigUint64(0, false), exponent = Number(bits >> 52n & 2047n);
  let numerator = bits & ((1n << 52n) - 1n), denominator = 60n;
  if (exponent) numerator += 1n << 52n;
  const binaryScale = exponent ? exponent - 1023 - 52 : -1074;
  if (binaryScale >= 0) numerator <<= BigInt(binaryScale);
  else denominator <<= BigInt(-binaryScale);
  let order = numerator.toString().length - denominator.toString().length;
  if (order >= 0 ? numerator < denominator * 10n ** BigInt(order) : numerator * 10n ** BigInt(-order) < denominator) order--;
  const decimalPlaces = 23 - order;
  let digits = (numerator * 10n ** BigInt(decimalPlaces) / denominator).toString(), scale = -decimalPlaces;
  const trailing = digits.length - digits.replace(/0+$/, '').length;
  digits = digits.slice(0, digits.length - trailing);scale += trailing;
  const candidate = `${digits}e${scale}`;
  if (!matches(candidate)) throw new RangeError('Checkpoint seconds cannot roundtrip');
  return candidate;
}

/** Compensated finite seconds; the same individual values go to the model. */
export function sumStopSeconds(values) {
  // Match the existing service-row budget; never execute a supplied iterator.
  if (!Array.isArray(values) || values.length > 1000) throw new TypeError('Invalid checkpoint seconds list');
  let total = 0, correction = 0;
  for (let i = 0; i < values.length; i++) {
    const descriptor = Object.getOwnPropertyDescriptor(values, String(i));
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) throw new TypeError('Invalid checkpoint seconds list');
    const value = descriptor.value;
    if (!Number.isFinite(value) || value < 0) throw new TypeError('Invalid checkpoint seconds');
    const next = total + value;
    correction += total >= value ? total - next + value : value - next + total;
    total = next;
  }
  const result = total + correction;
  if (!Number.isFinite(result)) throw new TypeError('Checkpoint seconds overflow');
  return result;
}
