# Historical prediction workflow and recovery readiness

Audited 2026-10-16 against the v0.5.42 checkout. This is an unpublished workflow candidate, not a new prediction model or a live-provider activation.

## Inventory and implemented slice

| Observed omission | Candidate correction | Evidence boundary |
| --- | --- | --- |
| A row could say “可作參考” with an impossible calendar date, invalid/nonpositive all-nonmoving relationship or incomplete/conflicting declared interval | One `validateHistoryRecordInput` helper now serves row readiness and request construction, using the existing exact duration/nonmoving/calendar/instant parsers. Preflight focuses the offending record and field before dispatch. The unchanged native evidence law remains final authority. | Source GPX timing, deduplication, cross-activity overlap, geometry, model-domain and provider-source checks still occur in the Worker. Individually ready rows are not proof of aggregate admission or empirical qualification. |
| The existing result disclosure left its basis empty and suppressed most local model warnings | It now shows captured forecast/target dates, per-record exact observed/declared clocks, classifications and qualification flags, activity intervals when known, specified fatigue/cap/hybrid assumptions, separately counted planned stops and method limitations. Every model warning remains available. | All added detail stays in the existing collapsed disclosure. No inferred rest, confidence interval, maximum fitness or numerical accuracy claim is added. |
| Two selected aliases of one event could be labeled a multi-event average | The result distinguishes one unique event after duplicate collapse from a genuine multi-event reference. It shows the occurrence mapping and preserves one weight per unique activity. | Untimed-file activity declarations remain externally unverified. Different serialization cannot authenticate event identity. |
| Local evidence was not completely readable in singleton exported provenance | Each local `reference_activities` entry now captures its exact evidence, qualification and distinct-activity declaration alongside the original SHA/timing/identity. | Private request and owner bytes remain private. JSON is bound to the current accepted wrapper and inputs. |
| Provider shared fields could display old local dates/consents with no imported provider record, and calculation was enabled | No-record provider state clears/disables that shared editor and Calculate. In-flight API state and final settlement update busy controls. The explicit local return restores its retained record/evidence. | The deployed service is still unconfigured. A fictional trusted source is used only in software tests. No credential, authorization grant or account setup occurred. |
| Model-order provider records could be mistaken for selection-order records | Per-name disclosure matches the exact provider activity ID and account namespace, rather than indexing the sorted model records. Validated descriptive spread is carried in the public provider projection. | This does not expose credentials, source response bodies or private owner/request text. |
| Complete provider hybrid omitted category accounting | The existing scenario disclosure shows known ordinary/steep component times for complete and partial hybrid results. | A partial result still has no complete finish/arrival schedule or workout capability. |

The local singleton retains its existing constant-rate, explicitly supplied cumulative-effort and hybrid paths. Multiple selected local records still require the existing explicit qualifications and constant-rate/no-hybrid assumptions; no mode is silently changed. Source-recency checks retain the existing calendar-day rule: reference before forecast/target, forecast no later than target, and age at target at most 365 days. This is an engineering data-use policy, not a biological claim.

Local partial-hybrid JSON retains the pre-existing diagnostic export behavior. Provider partial JSON remains disabled, and neither partial family receives a complete workout capability. This slice does not relabel a partial diagnostic as a complete plan.

## Source-based recovery parameter audit

Current production admission is deliberately empty:

- `public/conditional-forward-input.mjs:resolveQualifiedForwardPack` returns `qualified_pack_resolver_empty` with `production_admission:false`.
- `public/python/conditional_forward/forward_adapter.py:resolve_qualified_pack` returns `None`; its public `execute` returns `not_estimable`, `recommended_rest_s:null` and no Apply/export admission.
- `public/conditional-forward-receipt.mjs` refuses positive personal calibration, causal recovery, physiological feasibility, recommendation or accuracy claims in the isolated mechanical receipt family.
- `docs/contracts/CONDITIONAL-FORWARD-LIFECYCLE.md` separately lists the missing production source/qualification, complete plan transaction, rollback and lossless full-state export gates.

| Available evidence | What it supports | Missing evidence before use for recovery advice |
| --- | --- | --- |
| Local GPX geometry and explicit moving time, or elapsed minus explicitly known *all* nonmoving time | Conditional historical effective-rate fitting under the declared route/conditions assumptions | Neither station-specific service/rest exposure nor a recovery law's parameters or initial state is identified by this input. |
| Original point timestamps and declared UTC activity intervals | Read-only elapsed observation and some exact interval/identity checks | Elapsed time includes unknown movement/station components; timestamps do not supply causal rest benefit. |
| Provider moving/elapsed observations | Exact source-owned fractional clocks after source/rights/access and numerical admission | Their difference is not an observation of CP service or restorative rest. Live account integration remains unqualified. |
| Equal-P multi-history reference and selected scenario spread | The stated provisional aggregation and a descriptive comparison of selected conditional projections | No confidence/prediction interval, intervention response, independent recovery parameter fit or personal optimum follows. |
| Existing frozen recovery law and isolated synthetic replay/search tests | Software invariants under explicitly supplied, fixed parameters/state/support, and mechanical event accounting | A reviewed admissible artifact, its state and support, independently justified scale/anchor, service/rest exposure definition, qualification/revocation and end-to-end runtime/transaction acceptance remain required. |
| Retained real-race total-time benchmarks described in OPEN-REQUIREMENTS R15 | Their documented total-elapsed baseline on the stated retained sample and holdout design | They do not qualify this product's recovery coefficients or identify a personal rest intervention. No coefficients are extracted or guessed here. |

Consequently this slice leaves R11/R12 physiological continuation and personally optimal stops open. It does not fit a recovery coefficient to a target finish time, reuse a clock-only service minimum as an optimum, activate a provider, or manufacture an artifact identity. The useful next qualification gate is an explicitly reviewed source artifact with identifiable parameter/state/scale/support and service/rest exposure evidence, followed by the existing complete replay and transaction gates. This is a repository readiness audit, not a claim that all possible external scientific sources have been exhausted.

## Reproducible validation

- `node --test checks/prediction-workflow/pure.mjs`: 31 input/readiness/native-law boundary cases.
- `NODE_OPTIONS=--max-old-space-size=512 PYTHONDONTWRITEBYTECODE=1 node --experimental-vm-modules checks/prediction-workflow/actual-app.mjs`: 9 actual-app/pinned-WASM cases, including exact 1.5-second nonmoving subtraction, JSON evidence, aliases, true multi-history, provider 503 return, reversed provider order and complete hybrid.
- `node --test checks/history-selection/pure.mjs`: existing 20 state/binding cases.
- `node --experimental-vm-modules checks/history-workflow-guards/runtime.mjs`: existing 15 actual-app/pinned-WASM currentness/cancellation/export cases.
- `node --experimental-vm-modules checks/history-workflow-guards/ui-preservation.mjs`: existing 4 long-clock/display/interval cases.
- Provider pure and status suites: existing 10 and 11 checks.

The WASM suites were run sequentially with the bounded heap. No new dependencies or copied repository were used. The application DOM, FileReader, outer Worker delivery and focus are modeled; the model/runtime itself is the pinned bundled WASM. These checks do not qualify native browser layout/focus, physical devices, real provider accounts, physiological recovery or prediction accuracy. Existing narrow layout baseline is preserved; the only shared CSS addition wraps the basis's long source names inside its existing disclosure.
