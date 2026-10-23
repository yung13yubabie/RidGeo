# Foreground live development candidate, 2026-10-23

This is a deliberately new, reviewed development baseline, not a claim that the
original public-release application bytes remain unchanged. It has not been
published, pushed or deployed. `PUBLIC-BUILD-CONTRACT.md` describes the original
323-asset baseline; the counts and reviewed changes below describe this candidate.

## Integrity boundary

The contract schema remains `ridgegeo-public-release-integrity/1`. The runtime
build identity remains
`ridgeq-314.0.7-cpython3.14.8-expat2.9.0-rebuild-r2`; this is runtime identity, not a
new application version or proof of field validation. The active and rollback
runtime distributions, upstream notices, source maps, strict lock schema and
WASM header assertions remain unchanged.

The reviewed candidate contract SHA-256 is:

`1ebe9c06e4b1cda263003f59192b7d66a01133943c91ffb0c3c14634053e07cb`

Both verifier anchors use this exact digest. There is no build-time repinning.
The exact public inventory has 328 files. The Python graph grows from 65 members
and 49 Python sources to 67 members and 50 Python sources. The added members are
`python/live_eta.py` and its digest manifest. Runtime/API identity is unchanged.
The exact source/build/check inventory has 73 files. Existing source roots,
root-config coverage and the only three self-pin exclusions are unchanged.
All four protected entrypoints and their non-shadowing rules remain enforced.

Intentional public changes are `app.js`, `python-engine.mjs` and `transport.js`,
plus new `live-ui.mjs`, `live-location.mjs`, `live-timer.mjs` and the two Python
graph members. The protected HTML and engine-worker entrypoints change and have
updated manifest pins. The remaining public asset bytes retain original pins.
New executable tests are included in the exact source closure, not excluded.
No CSP, security-header, API-routing, runtime-asset or outbound-denial assertion
has been relaxed. No geolocation Permissions-Policy restriction was removed.

## Implemented scope and limits

- Foreground-only, explicitly started location acquisition. Hiding the page
  clears its watch; returning requires explicit resume. No background navigation,
  installability, service-worker/offline cache or offline map claim is made.
- Coordinates are ephemeral input to timer evidence. No coordinate upload or
  persistent coordinate storage is added; timer snapshots omit positions.
- Conservative monotonic millisecond accounting keeps moving, stopped, unknown
  and manual-pause durations separate. Millisecond display is formatting, not GPS
  accuracy. Thresholds are synthetic-test parameters, not field calibration.
- GPX route and geometry identities bind the session and response. A changed or
  unavailable route stops the session and invalidates late estimates. Only the
  admitted original route with complete elevation is exposed by this UI.
- Progress is explicitly entered as canonical along-route distance. GPS is not
  snapped to the route. Loops and out-and-back progress require user confirmation.
- Python integrates only the selected canonical interval. EP is the engineering
  convention distance in km plus ascent in metres divided by 100. It is not a
  physiological law. GPX activity timestamps do not become observed moving time.
- Same-trip, same-start and same-cutoff moving-time alignment is user-confirmed.
  Unknown future stops suppress arrival time. Tiny baselines, missing measurements
  and invalid/passed targets suppress estimates. No fatigue percentage is inferred.
- Any unknown timer duration prevents using that ledger as a complete moving-time
  baseline. Normal automatic startup has acquisition uncertainty, so manual
  same-segment time is usually required. This is deliberate suppression, not a
  claim that elapsed time equals moving time. Reload loses the live UI session.

Review found and corrected two integration defects before pinning: numeric owner
revisions were incompatible with the strict string bridge; repeated fresh-fix
state notifications reset timer evidence. The final source preserves string
revisions and allows successive active fixes to accumulate evidence.
A further independent review found fractional-metre targets were unreachable
through a metre-step input and ending a session left an obsolete ETA visible.
Progress now accepts explicit finer precision; a separate user-confirmed reached
selection uses the exact selected target without rounding, snapping or clamping.
Manual editing clears that choice and new sessions reset it. Ending a session
expires its displayed ETA and rejects late responses. Four minimal-DOM regression
tests cover these cases; they are not browser execution evidence.

## Evidence and remaining validation

All 58 local JavaScript tests and all 12 Python tests pass.
The local JavaScript tests cover timer evidence/accounting, location lifecycle,
transport/admission/digest failures and selected UI contracts. Python tests cover
canonical intervals, route binding, source timestamp independence, target state,
unknown stops, baseline suppression and invalid inputs. Test doubles and source
assertions are not a substitute for executing the complete UI.

Source closure, protected manifest and nine fail-closed mutation cases pass.
The full `npm run build` passes, including compilation, exact generated graph,
actual generated Worker with real ASSETS HTTP checks, nine source mutation cases
and four generated-graph mutation cases. The first build correctly rejected
noncanonical manifest keys caused by a dependency symlink. Copying the same
trusted installed dependencies into a real local `node_modules` fixed path
identity without weakening any gate. This does not establish a fresh dependency
installation. The local dependency copy is not part of the source release.

The additional `node checks/live-eta/runtime.mjs` executes the actual bundled
Pyodide/WASM under Node, not a Python mock: synthetic GPX inspection and details,
canonical-interval ETA, unknown-stop suppression, explicit-stop arrival time,
owner echo and wrong-geometry rejection pass. The test records zero calls to its
blocked global fetch hook. This is real runtime evidence, not browser UI evidence.

Browser integration is **NOT RUN / blocked**, not passed. The synthetic browser
harness is provided under `checks/live/`; native Chromium could not start in the
available execution sandbox and the separate supported browser could not reach
that local harness across network namespaces. No security setting was disabled
or access restriction bypassed to obtain a test result. Consequently actual
browser Python/WASM execution, UI event behavior and mobile location workflows
remain unverified in this candidate.

Run `node --test checks/live/*.test.mjs checks/live-eta/*.test.mjs` and
`PYTHONDONTWRITEBYTECODE=1 python3 -B -m unittest discover -s checks/live-eta` for
local tests. In a compatible browser environment, use
`node checks/live/run-browser.mjs` or its `--serve-only` mode. Run `npm run build`
for the original complete compiler/source/generated-Worker/HTTP integrity chain.
Do not interpret a local pass as production deployment, publisher provenance,
independent runtime recompilation, phone GPS field validation or safe-navigation
acceptance. Authenticate the release commit/tag or record this digest externally
before treating the repository as an independently trusted release.
