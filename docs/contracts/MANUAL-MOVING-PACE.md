# Manual moving-pace clock accounting

Isolated owner candidate based on v0.5.22 source 9ea78046173cb7722868942f9410e4dd412cf5a8. No publication or claim of personal physiological propagation.

## What works

The unchanged target allocator generates the initial plan. Users select a displayed raw or merged terrain interval, enter its moving pace, preview, then explicitly apply a lock. Parent pace is sum(moving seconds)/sum(distance); mixed terrain retains its original pre-clipped Minetti cost × whole-route distance-fatigue shape under pointwise speed bounds. Group-local allocation uses the existing Python continuous allocator. It does not flatten child paces, reset cumulative q, scale the already-clipped baseline curve, or normalize the whole route back to the old target.

Locks bind stable raw child IDs and exact chainage ranges. Only consecutive existing children may be selected, with no overlap between separate locks. Every CP is a barrier, including zero-minute timing points. Unknown terrain is refused. Infeasible pace rejects the whole preview; no other lock or free segment is changed to compensate.

Cap-equal manual pace uses one representable comparison: exact binary64 endpoint/cap ratios form the distance-weighted fastest mean pace, rounded once into the input pace representation; the minimum-speed mean pace is treated the same way. Adjacent representable outside paces are refused without an epsilon. Once admitted, only the solver target's rounding is reconciled with the unchanged summed fragment bounds. This avoids false rejection when a CP splits a canonical cell, including 6 km/h converted to m/s with 10:00/km. Original requested pace/time metadata stays intact. Contiguous equal-cap fragments are grouped before rational arithmetic; traversal is linear in covered fragments and exact arithmetic in cap runs. No allocator curve, speed cap, core source or physiology equation is changed.

Outside selected locks, the initial exact moving-time curve is unchanged. CP arrivals/departures, cutoff margins, canonical cell totals, raw child times and revised finish come from one ledger. CP stops are counted once and remain separate from moving pace. The original target is kept both in the untouched form and initial_target_elapsed_s; revised finish is clearly labelled 重算完賽時間.

Preview changes no displayed plan. Apply and manual workout export use the same read-only receipt validator for schema/status, geometry, route, normalized input, CP identity/metadata/stops, exact timeline/display conservation, every raw child moving time and locked totals/ranges before enabling the action. Each raw child time is checked against exact canonical/CP prefix samples. Arbitrary boundaries lacking such exact samples are explicitly refused at the owner boundary; no distance-linear time sample is invented. The numerical comparison uses the existing shared display tolerance (1e-7 seconds or 1e-9 relative), matching the core allocator's relative conservation target. A stale raw field or route/CP revision rejects the action. Delayed canceled results cannot apply. Reset restores the initial plan; Undo restores the prior immutable current plan only while the one transaction still owns the result. Changing display level retains applied physical locks, and cancels a pending/ready preview if the selected interval disappears. New route, repair, true mode change, settings or CP edits discard the session. A current fatal GPX admission marker retires only that active target source's trusted geometry/details/GPX/result and export state, with visible re-import recovery. Ordinary pace/cap failures retain the last valid plan. Canceled or obsolete source responses cannot clear a newer target.

JSON preserves manual-clock purpose and metadata. The separate local workout exporter explicitly validates manual schema, original geometry/time/CP provenance, raw section identities, locked totals and stop placement. Its moving-only text keeps stops separate and labels the basis 人工配速時間表 · 未估疲勞連動. Original goal/prediction export paths remain legitimate and tested. Local text roundtrip is not real Intervals/Zepp/watch acceptance.

## CP-leg editing and detached clock preview candidate

The compact interval selector also offers every complete CP-to-CP leg, including
zero-stop timing points and the full route when there is no intermediate CP.
These choices use distinct `cp:start:end` display keys and lead the list for
long-route discoverability; the existing first-terrain default remains unchanged.
The input pace is moving seconds divided by distance, never the parent's elapsed
pace including stops. Every selection resolves to the same immutable raw child
IDs. Mixed terrain retains the existing cost shape and speed bounds; unknown
terrain disables its affected whole-leg choice. Display-level changes retain a
selected CP leg without changing its physical identity or the accepted plan.

A detached disclosure compares current and candidate exact CP arrival/departure
samples, with wall clocks and cumulative duration. It reads the returned complete
manual or composed station-clock candidate, including the currently accepted stop
ledger. It does not derive new times from the rounded pace prefill. The shared
contextual cutoff evaluator preserves arrival/departure basis, unknown cutoffs,
unconfirmed official facts and date qualification. Missed candidate cutoff count
stays visible beside Preview; the accepted table remains unchanged until Apply.

The ordinary manual entry now uses the same accepted raw-input, route/source and
plan-content guard as accepted export. An observed stale Preview/Apply retires
its detached intent, hides the comparison and gives a concise recalculation path.
Normal input events retain their existing complete invalidation/recalculation
flow. Apply, workout, Undo and station composition remain the existing verified
ledger path; this candidate adds no physiological coefficients or recovery claim.

See `checks/pace-workflow/README.md` for separate CPython, protected Worker and
native-browser evidence scopes. The 100-hour metadata case on a small route is
not the same as an end-to-end 300 km capacity acceptance.

## Still open

The active input schema contains no coherent validated intensity/recovery parameter artifact, independent same-law ability anchor, initial latent state, support domain or identified service/rest composition. Every manual result therefore has downstream_response.status=not_estimable and lists those missing inputs. No F/P or invented coefficient is returned. An ordinary goal is not ability evidence, and a single GPX plus finish cannot identify elasticity or recovery.

The original distance-fatigue scenario is retained only as the initial allocation curve. Keeping it fixed outside locks is clock accounting, not the user's requested causal downstream fatigue response. The reviewed constant-control r2 transition is not run with averaged fragment times: that would change nonlinear dose when CP/display fragments are split. A separate variable-control and calibrated-parameter integration remains necessary. No clinical, personal-best or forecast-accuracy claim is made.

## Resource and verification boundaries

Python boundary: at most 25,000 canonical cells/raw sections, 1,000 nonoverlapping locks and 101 total CP IDs. Existing 5 MiB raw-GPX admission remains shared. Worker envelope additionally bounds goal settings to 65,536 JSON code units (covering 100 legal 80-character CP names, including JSON-escaped controls), raw/lock metadata to 4,194,304 JSON code units each, and strictly checks operation keys, ID lengths and binding format before serialization. Microscopic ranges/cancellation-scale time differences receive manual_numeric_support. O(N) compensated prefixes and indexed child identity lookup avoid quadratic work. Maximum-route browser/mobile memory and performance remain unverified.

Author checks: 25 CPython and 25 actual bundled Pyodide core tests; 29 new-engine adapter/display checks; pure owner/export tampering and transaction checks; 16 actual complete application/HTML + bundled-WASM scenarios in a simulated DOM/Worker; the original 21 goal-target-suggestion full-module cases and original workout UI/runtime regressions; supported Sites build and public cache gate. Independent review binds separate immutable snapshots. Native desktop UI, mobile/touch/zoom, real watch/platform export and personal model accuracy are separate pending gates.

No original core, runtime binary, original GPX bytes, predictor, source catalog or route export is altered by this slice. Changes are confined to the isolated manual adapter/manifest, explicit engine/transport operations, owner controls/transactions, dedicated workout support and documents.
