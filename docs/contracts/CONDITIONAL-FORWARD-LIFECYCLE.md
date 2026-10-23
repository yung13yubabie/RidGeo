# Conditional forward lifecycle and remaining gates

Source-only candidate on `1230c25f494d9165ddaa693024c10a45a957ce9e`.
This change hardens the existing internal read-only forward reservation. It does
not activate a personal model, a user-facing scenario panel, conditional Apply,
Undo or full-state export. The production JS and Python pack resolvers remain
empty. A successful isolated mechanical receipt still has
`production_admission=false`, `ui_apply_admitted=false`,
`user_export_admitted=false`, and no rest recommendation or accuracy claim.

## Current chain

1. A bounded plain-data request is checked before any resolver call or replacement
   of an existing ready ticket. The request has only explicit qualification,
   context, service-bundle, proposed-control and resource-limit fields. A selected
   pack needs an exact artifact hash and nonempty pack/review identities. Explicit
   scale has no anchor; independent scale requires both anchor identities.
2. Current A-owner bookkeeping is checked before reservation: the raw identities
   cover this exact route; prescribed children are known, contiguous and disjoint;
   locks do not cross any CP; the inherited clock limit remains; station patches
   name known occurrences; bundles name service occurrences; known sequential or
   containing service/rest declarations and applied service minima are preserved.
   These checks do not solve the physiological equations or qualify a pack.
3. Only a clean, current accepted A owner can reserve. Unsaved manual/stop/minimum
   drafts, an A preview, foreground work and read/write barriers keep their prior
   behavior. A malformed or locally known-invalid request preserves the previous
   ready ticket and never consumes the resolver or native preparation.
4. The trusted resolver result is bounded, checked against the exact requested
   selection and cloned immediately. A provider retaining its original object
   cannot switch the consumed artifact or review during a later await.
5. Fixed original-source preparation uses the existing accepted native operation.
   It does not solve the old goal again. The full detached input is rebuilt and
   checked against the original prepared geometry, settings, raw/CP identities,
   current A clock and manual binding. Source admission failure remains attributed
   by the existing current-target operation; history/model/local failure cannot
   retire the target.
6. Qualification is checked at admission, preparation, immediately before compute,
   after compute, settlement and every ready read. The same exact consumed
   selection is used at each check. Revocation consumes the old ownership; later
   re-admission cannot revive that old ticket.
7. Complete private output is detached from producer aliases and compared with the
   public receipt. The existing strict receipt validates complete event/state,
   prescribed-profile, canonical/raw/CP, service/rest and three-clock accounting.
   The old A-to-scenario basis gap is separate from the same-scenario edit delta.
   A schedule projection never grants Apply or export authority.
8. One initialization-inclusive monotonic deadline spans request checks, resolver,
   preparation, hashes, compute and settlement. The existing wall-clock expiry
   remains in the detached receipt. A wall-clock backstep cannot extend the local
   lifetime. Ready revalidation checks both clocks, including after callbacks.
   Ready expiry retires its retained result and subscription.
9. Cancel, source/settings/CP/draft changes, A writes/export/Undo, replacement,
   expiry and qualification revocation retire only their owned result/attempt.
   A late output or stale notification cannot replace or cancel a newer owner.
   Ordinary A Apply/Undo/export and their rollback contract remain separate.

## Optional qualification-change source

An internal trusted `forwardRead` adapter may supply
`subscribe(selected, notify)`, returning a synchronous cleanup function. It also
supplies the existing synchronous `isCurrent(selected)` check. `selected` is a
detached copy of `{status: 'admitted', qualification: ...}`. Notification payloads
are ignored: the exact originally consumed identity is rechecked; no replacement
artifact or approval is installed from an event.

Notifications can abort a held preparation/hash/compute immediately. Ready
revocation is one-way. The listener is released once on cancellation, failure,
replacement, revocation, A transition or expiry. Synchronous notification during
subscription is supported, including cleanup returned after revocation. Cleanup
and owned abort listeners run behind a retirement read/write barrier, so a stale
disposer cannot start a new transaction, invalidate A or cancel a newer operation.
Context is rechecked after cleanup before a new reservation is installed.

Without this optional source, qualification is checked at the explicit boundaries
above; no automatic observation between calls is claimed. The shipped app still
has no admitted pack/provider and therefore installs no such subscription.

## R11/R12 requirement matrix

| Requirement | Current implementation | Hard remaining condition |
| --- | --- | --- |
| R11 manual moving pace and CP clock ledger | Existing clock-only Preview/Apply/Undo/reset/export; unlocked motion retains the original curve | This is not a downstream physiological response |
| R11 chronological fatigue/recovery continuation | Existing byte-verified Python law, fixed scale/state, exact prescribed controls and carried states; synthetic law/Worker tests | Evidence-qualified parameters, initial state, support and service exposure for actual use |
| R11 current source/control handoff | Internal original-source preparation, bound A baseline and proposed controls, strict complete receipt and three-clock attribution | Production runtime/qualification admission and coherent complete receipt purpose |
| R11 request, selection, revocation and result lifecycle | This candidate adds closed local and route-aware admission, immutable consumed qualification, live optional revocation, cancellation/deadlines/expiry and callback fences | Native browser, Back/BFCache, mobile/touch and realistic-route resource acceptance remain separate |
| R11 public scenario acquisition/status | Existing private ownership seams only; no raw coefficient or JSON upload is presented as qualification | Lossless nontechnical selection/acquisition from an actually reviewed source; explicit assumptions and concise uncalibrated status |
| R11 conditional Apply/rollback/Undo | Existing A transaction is retained; C results cannot enter it | Separately accepted conditional plan purpose/receipt; atomic plan/CP/locks/identity commit, rendering rollback and full prior snapshot restore |
| R11 conditional full-state export/reread | Complete private ledger is retained; no user C export | New closed export/import receipt preserving selected scenario, all seven states, exact CP prefixes, finish-arrival semantics, service composition, provenance and revocation; existing GPX/workout projections are insufficient |
| R12 minimum service and total dwell | Existing user-declared minima and supported sequential/containing accounting; unknowns refuse; dwell counted once | Service minimum is a user constraint, not a learned recovery optimum |
| R12 finite-policy stop search | Existing frozen internal bounded explicit-scenario search with synthetic tests | Current-source/qualification/control ownership and separately accepted search receipt/UI/transaction path; supported policy candidates and constraints |
| R12 personal best-stop advice | No production estimate or recommendation | Identifiable recovery/service-effect evidence, independent ability scale/state/support and intervention/policy validation; a GPX, finish time or goal cannot identify these jointly |

Personal and population evidence admission is itself an implementation/review
gate. Hashes, provenance labels, complete-looking files and synthetic successes
cannot authorize that gate. No target-time fitting, guessed recovery coefficient,
new service/account, persistent access, or named-race exception is introduced.
No claim of a true optimum is supported by the currently available inputs.

## Reproducible checks

Use a small output directory outside `public/`; do not write Python bytecode into
runtime assets. From the repository root:

1. `python -B checks/conditional-forward/fixture.py > "$OUT/fixture.json"`
2. `node checks/conditional-forward/build-input.mjs "$OUT/fixture.json" "$OUT/input.json"`
3. `python -B checks/conditional-forward/test.py "$OUT/input.json" "$OUT"`
4. `node checks/conditional-forward/test.mjs "$OUT"`
5. `WORKOUT_CANDIDATE="$PWD" node checks/live-forward-reservation/owner.mjs "$OUT"`
6. `WORKOUT_CANDIDATE="$PWD" node checks/live-forward-reservation/admission.mjs "$OUT"`
7. `WORKOUT_CANDIDATE="$PWD" node --experimental-vm-modules checks/live-forward-reservation/app-flows.mjs "$OUT"`

The optional `FORWARD_RESERVATION_NATIVE=1` app run uses the protected Worker/WASM
for the accepted source/manual operation and the existing CPython synthetic law
for full replay. It must share the single native lane with other resource-heavy
checks. DOM/Worker-delivery simulation, native/WASM execution, actual browser
interaction and empirical accuracy are different evidence scopes.

The new admission regression first reproduced three defects on the unmodified
base: malformed inner input consumed/replaced ownership, provider aliases switched
the consumed selection, and a wall-clock backstep extended the deadline. Its
additional cases cover known-invalid current controls/minima, pre-compute
revocation, prompt subscription cancellation, one-way ready retirement and
cleanup/expiry. Independent real-law result checks are maintained separately.
