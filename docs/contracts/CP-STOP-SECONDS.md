# Raw checkpoint stop durations

Raw CP minutes use one decimal-to-seconds parser across goal, prediction, profile,
service current-stop preview, manual pace context and enriched export. Fractional
seconds are legal when the existing backend admits them. Each CP keeps its original
raw spelling; no duration rounding or quantization is introduced.

- Blank is unknown; explicit signed/exponent zero is known zero.
- Accept bounded decimal/exponent strings, not partial parses or other Number()
  syntax. Negative nonzero, nonfinite, nonrepresentable positive seconds and exact
  source values outside 0–1440 minutes are invalid. Validate decimal range before
  float conversion. Scale the decimal by 60 before converting to numeric seconds.
- Distinct occurrences count once each. Unknown/invalid values produce a null
  aggregate. Finite seconds use compensated summation. Legacy integer tenths is
  available only when every CP duration has that representation; seconds is always
  the authoritative known total.
- Explicit enriched-CP adoption formats numeric seconds back to raw minutes only
  when the shared parser reproduces the identical seconds. Friendly decimal text
  is attempted first; a bounded exact IEEE-rational decimal fallback preserves
  subnormal values. A new imported occurrence need not retain the prior typed
  spelling, but it cannot lose or change its duration. This formats already
  validated numeric proposal seconds; the GPX metadata parser is unchanged.
- Service templates retain their separate exact-tenths parser/storage policy and
  explicit Apply/Undo ownership. Existing raw CP 75s is valid even though a template
  duration of 1.25 minutes remains invalid. Undo restores raw spelling and duration.
- Initialized CP inputs retain min 0 / max 1440 / step any. Template inputs retain step 0.1.
  Long target/cutoff hours, source facts, position gates and route/model/repair
  consent are unchanged. Existing table/clock display rounding is separate from
  authoritative duration values.

See `checks/cp-stop-seconds/README.md`. Calculations/re-read use actual pinned WASM;
DOM/Worker delivery is simulated. Native browser/mobile/filesystem acceptance is
separate.
