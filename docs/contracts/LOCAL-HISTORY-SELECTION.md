# Local GPX single and multiple history selection

This is an additional local-file workflow on the existing historical prediction page.
It does not expose Intervals account/full-stream access or estimate recovery, physiological
power, current maximal ability or personally optimal CP rest. No API keys are requested.

## Visible workflow

The reference file picker retains up to eight files. A compact row selects, activates or
removes each original file. Existing time kind, exact clock, completion date and actual/
comparable confirmations belong to the active record; switching preserves other records.
No record is selected automatically after the user deselects every record.

Every singleton first uses the bounded identity-only preflight. That preflight admits the original bytes and clocks without constructing target geometry or imposing the multi-path 15000-cell limit; its target cell counters are zero because none were constructed. It then continues through the existing `predict`/`hybrid` operations and
keeps constant-rate, explicitly supplied cumulative-effort slowdown and existing partial
hybrid semantics. The added multi path requires constant-rate/null slowdown and explicit
race/benchmark, complete whole-route/time, high-effort and different-activity declarations.
It never changes the selected mode silently. Qualification is user-declared and still
subject to validation; it is not externally authenticated. Short missing states and a
current, bound offending filename/row are visible. Editing invalidates prior error markers.

Multiple qualified distinct records fit historical effective-rate P individually, take
the equal-weight arithmetic mean of P, then run the target once with its actual speed caps
and CP stops. This is not an average of target finish clocks. Every selected record must
qualify; none is silently dropped. Display: `多筆平均參考 · 未校準`. Selected spread is
only descriptive, never a confidence interval. JSON export retains the strict receipt and exact per-selection activity declaration, date and original-file SHA. Singleton JSON includes its identity-only receipt without the private request or owner bytes. Complete local multi results may use the owned
workout path in `HISTORY-WORKOUT.md`, with the original private receipt/request/correlation
and current result still required. They do not enter the goal/manual ManualClockReceipt
transaction.

## Identity and clocks

Original imports retain literal `LocalGPX` identity from the host session namespace and
exact original-byte SHA256. Merely importing identical bytes again cannot create another
activity weight; identical declarations collapse and conflicting declarations block.

The explicit “同路線新增活動” action creates an independent local record from the unchanged
GPX bytes. Its clock, completion date, classifications and confirmations start empty.
The source bytes remain exact, bounded and separately charged. A reused route must contain
no recorded point-time element: complete, partial and invalid point timestamps cannot be
relabeled as a different event. Removing an original record does not erase a declared
activity created from it; importing again does not recover or invent past event evidence.

A date-only declaration has stable identity `route_<raw SHA>_<real completion date>`.
Two date-only declarations of the same source on the same date cannot gain separate weights.
For multiple activities on one date the user supplies both start and end through native
local date/time fields and visible editable UTC-offset selectors. Both dates/times stay blank
until entered. The initially displayed +08:00 is an editable input choice, not a detected
activity location. The wire format retains precise known-offset ISO timestamps, at most six
fractional digits. Exact interval identity is normalized UTC start/end, independent of raw
GPX SHA. Equivalent offset spellings identify the same event; incompatible bytes, clocks,
qualifications or completion declarations for that identity block the aggregate.

An original-file/date-only/precise mixed pair with the same source and completion date is
ambiguous if either has no exact interval and must be reduced to one record or given precise
intervals for both. Exact intervals must be positive, both-or-neither, valid calendar dates
and known offsets; -00:00 and unsupported precision refuse. The declared completion date
must match the explicitly supplied local end date. A complete original recording retains
its original local end date and cannot be moved to another date. Declared moving/elapsed
durations cannot exceed a known complete interval. No interval derives unknown moving or
nonmoving time. No arbitrary generated record ID grants another event weight.

Only known complete recorded or explicitly declared UTC interval overlaps are detected.
Date-only declarations do not establish nonoverlap, including long activities completed on
adjacent dates. Distinct-activity confirmation remains externally unverified user evidence. Differently serialized untimed files or incorrect declared dates cannot be authenticated as the same or different real-world event; this is not universal deduplication or proof of nonoverlap.
The mean uses one equal P weight per admitted activity; a weighted model is not added.
Original classification remains unclassified. Provider normalization, external athlete
identity, official distance and recording-stop observations remain absent.

A supplied moving clock is not replaced by timestamps. Elapsed clock can identify moving
clock only with explicitly supplied all-nonmoving time. Blank is unknown, `0` is known zero,
and positive numeric underflow refuses. Valid local duration preserves 1–3 digit hours,
including >72 hours; known all-nonmoving input uses the existing 0–14400 minute family.
No pause summary, moving flag, planned CP stop or task-template total identifies observed
CP rest/service, recovery coefficients or an initial physiological state.

Complete calendar timestamps with known offsets may detect a known whole-activity UTC
interval overlap, even if different activities are declared. Partial/non-scalar timestamps,
ISO week dates, unknown `-00:00` offset or >6 fractional digits remain unqualified. Sibling
extensions are legal. Timestamp diagnostics never infer moving or nonmoving duration.

## Runtime and ownership

`selected_history_predict` is an additional foreground Worker operation. The five existing
model sources stay byte-exact. Six reversible schema/provider/receipt substitutions extend
the accepted multi-history identity branch; mathematical executable source is unchanged.
Nine runtime members are verified behind the fixed manifest SHA256
`11650cc70fa3290445fdd7c2dae66398dcbe3f9956429d0cff7d0deb16a817f5`.
Bounded pre-import/reuse collision checks preserve the actual shared module registry,
file/spec origin and core root; threat model is trusted Worker/bootstrap/interpreter with
untrusted route/request data, not compromised-interpreter attestation.

Opaque request and owner JSON text, exact text hashes, synchronous reservations and actual
Worker generation/request ID bind every dispatch. Owner includes current source/calculation
provenance, geometry/mode, raw CP text and occurrence identity as well as actual numeric
controls. Success and error revalidate them even without an input event. File/hash callbacks
cannot revive canceled state. Target changes retain files but revoke comparability.
View-only record activation preserves a result. All local JSON/workout paths check current immutable records, active visible evidence/interval, current global controls and wrapper content; singleton preflight ownership is checked again after the legacy calculation completes. Incomplete native interval drafts remain editable and invalidate old results; full validation occurs at submission.
Only exact, bound target raw-admission failure may request target retirement; history failure
keeps the target. Predispatch/busy failures cannot retire a source. Cancellation aborts only
that operation's controller; stale callbacks cannot terminate a newer foreground owner.

## Receipt clock and refusal bookkeeping

The authoritative finish CP must equal the model's final moving and elapsed clocks exactly.
The canonical timeline instead retains sequential positive-duration additions, while the
model finish uses `math.fsum`. Only the finish-to-canonical-prefix comparison uses a derived
binary64 allowance: k=n-1 actual additions, u=2^-53, gamma_k=k*u/(1-k*u), with a subnormal
additive guard and one conservative terminal fsum ULP. From the carried sequential total A,
its true positive sum S is bounded by (A+k*MIN_VALUE)/(1-gamma_k), so the sequential error is
bounded by (gamma_k*A+k*MIN_VALUE)/(1-gamma_k). Each bound operation rounds outward.
One carried term is exact. Interior CP bounds/equalities retain their original local checks;
there is no global tolerance increase or mathematical engine change. Exact-dyadic tests cover
one/two/13201/15000 terms, both error signs, subnormals and perturbations just outside the bound.

Every history error must own its exact occurrence and match the global history-error multiset.
Non-history request/target/aggregation errors retain null occurrence indices. Fitted or duplicate
rows cannot carry errors. This consistency is required before a filename/row consumes blame.
A real early points/cells resource refusal can leave geometry absent only for invalid,
null-diagnostics rows at or after its resource-stop occurrence; processed earlier geometry and
all complete-success geometry remain mandatory. These are explicit refusal diagnostics, not a
truncated successful target plan. R1 source was not accepted; R2 repairs these receipt-only cases.

## Explicit engineering family

- At most eight supplied records before deduplication; 5 MiB per GPX.
- 12 MiB aggregate raw target plus every supplied history, including aliases.
- 50000 historical source points, 50000 target points, 100000 aggregate constructed cells.
- 15000 target cells before per-history forward ledgers; at most 100 target CP controls.
- Request UTF-8 <=17 MiB, 10000 nodes, depth 12.
- Owner UTF-8 <=128 KiB, 50000 nodes, depth 12; metadata UTF-8 <=1 MiB.
- Full response UTF-8 <=16 MiB, 1000000 nodes, depth 32. Transfer bound is not a peak-memory claim.
- Requested positive total deadline <=120 seconds includes initialization; parent termination
  uses the smaller explicit request/transport limit.
- Existing core route/grade/cap/date policies remain unchanged, including 500 km and +/-45%
  supported grade. Refusals are explicit; no valid singleton mode is silently removed.

Dense synthetic ~330 km/13201-cell and >72-hour tests establish software support within
this family, not real-ultra predictive accuracy or conditional-recovery ultradistance support.
Real activities, empirical validation, native-browser/device evidence and full-stream provider
account integration remain outside this source slice. Automatic best-rest is still unidentified
under available inputs and the current qualification; no parameters or arbitrary presets were added.
