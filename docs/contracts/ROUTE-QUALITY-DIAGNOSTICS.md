# Read-only original-source diagnostics

Candidate based on d3f68a7f8f4adf10b1d6b25f9d9ac39ace545253. This contract adds source evidence and a compact disclosure; it does not extend model eligibility, repair limits or official station facts.

## Boundary and identity

- WebWorker operation `quality_inspect` accepts only `{gpx_b64, page?}`. Page is an integer 0–399, default 0. The unchanged shared GPX admission runs before each request, including cached pages.
- `route-quality-manifest.json` verifies the new module and its actual dependency closure: the existing core, shared admission, cross-route module and hybrid geometry classifier. Their numerical files remain unchanged. The new module imports the shared admission reader directly; no old details validator is shipped.
- Source identity is the SHA-256 of exact original bytes. Runtime-generated geometry hashes stay bound to the pinned Python/WASM runtime. Cross-runtime near-equal floating-point values do not authorize relaxing a same-runtime geometry hash check.
- Original indices are zero based, ranges inclusive, and every finding is bound to its source segment. Adjacent exactly equal coordinates are distinguished from later loop revisits. No segment joining, coordinate scaling, station matching or elevation invention occurs.

## Evidence and unknowns

The existing readonly diagnostic is reused to find missing-height runs, maximal exact-coordinate groups with different known heights, existing-core horizontal gap candidates, existing near-zero vertical discontinuities, and narrowly defined opposing raw-slope review candidates. Canonical steep runs and conservative source-support envelopes reuse the unchanged core and hybrid classifier.

A raw review candidate is an unconfirmed source clue. Source-reported slope outside the current model domain proves neither real terrain steepness nor an elevation defect. Consecutive canonical cells are not independent terrain confirmation. No finding, or a within-domain grade, establishes source accuracy, route safety, athlete capability or prediction validation.

If any source elevation is missing, or original geometry is blocked/disconnected, whole-route canonical steep count, lengths, vertical sums, direction counts and run count are null. Partial favorable reconstruction is not attempted. Readiness flags coexist: source review and beyond-domain slope can both be true. Later-segment raw findings remain visible even if the frozen core only reports its first segment.

## Summary-first resources

The engine returns `route-quality-page/1.0`, containing summary/independent readiness flags, complete per-family totals and at most 25 compact source-index rows. The maximum successful serialized UTF-8 response envelope is 64 KiB. Each page reports its index, size, exact total, previous/next availability and deterministic row ordinals. No full polyline or complete evidence list crosses the Worker boundary.

The full readonly diagnosis is retained only as a one-source, SHA-bound Python-worker cache. A different source clears it before diagnosis; terminating the worker discards it. Existing input limits remain 5 MiB/50,000 points/depth32/2,000 segments with existing XML limits. More than 10,000 findings is an explicit `diagnostic_too_many_findings` failure, never a silently truncated success. An unavailable page is `quality_page_out_of_range`. There is no new source, geometry or repair threshold.

The UI retains one page and renders at most 25 rows. Compact response size is not a bound on Python/WASM intermediate memory or a mobile hardware guarantee. Resource timing, process RSS, traced Python memory and WASM heap capacity are measured separately.

## UI and lifecycle

The action is explicit and optional: `檢查來源`, then a short source-quality status. Counts and source-index clues are behind a closed `查看來源問題` disclosure. The labels refer to original GPX; an approved derived calculation version is identified separately. No diagnostic approval or automatic repair/flat/clamp consent exists.

- The action never preempts foreground or advisory Worker work. A newer foreground request can cancel it. Generation, request owner, original byte string and source SHA prevent late results/pages from attaching to another source.
- Cancel or pagehide during diagnosis preserves accepted CP rows, raw user values, route, plan and export ownership. Optional diagnosis/schema/budget failure likewise preserves otherwise legal work.
- A current typed fatal shared-admission rejection retires trusted route/profile/CP/result/export state coherently. A stale rejected request cannot unload a newer source.
- Repair/revert keeps original diagnostics distinct from derived geometry, with existing CP preservation and individual position reconfirmation unchanged. Checking source evidence does not waive any model-domain or location gate.
- This optional action is exposed in the WebWorker build. HTTP development imports retain their prior legal operations; no new server GPX endpoint is added.

## Review gates

Evidence separates host CPython, actual pinned WASM, actual app modules in a simulated DOM/Worker, protected Worker build/runtime checks, and native-browser/hardware acceptance. Native acceptance and publication remain separate gates. QA source files and enriched derivatives stay private; no raw GPX is added to public assets.
