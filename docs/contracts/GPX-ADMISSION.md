# Shared GPX source-admission contract

Applies to every GPX-consuming engine operation and every official/local source. This is independent of any particular event or catalog row.

## Source trust boundary

Use the same bounded raw XML admission before inspect, details, plan, repair, timed-history inspection and either target/reference GPX in forward prediction. An operation without GPX input uses its separate request contract. Do not broaden or bypass a failed admission because another operation needs less metadata.

Keep source admission distinct from mathematical eligibility, details projection, missing elevation, steep scenarios and checkpoint association. Passing source admission does not prove a race edition, waypoint meaning, station location, service availability, cutoff semantics or model suitability. Download/envelope/hash/provenance checks retain their existing responsibilities.

Supported source text must decode strictly before validation. Preserve approved positive encoding/whitespace controls alongside malformed-byte tests. Bound bytes, element depth/count, points, segments, waypoints, attributes and metadata text without silently truncating or repairing source bytes. Ignore only explicitly supported bounded extensions; never execute GPX content or use it to choose arbitrary filesystem/network targets.

## Reviewed resource and encoding policy

Fatal raw admission covers the existing 5 MiB, 50,000-point, depth 32, 2,000-segment, 200-waypoint, 250,000-element, 2 MiB total-text, 8,192-character uncaptured node, 32-attribute/4,096-character attribute limits; captured names remain limited to 256 characters and descriptions to 4,096. DTDs, declared/external entities, processing instructions, invalid scalar children and foreign canonical ancestors remain rejected. Existing core finite-number, coordinate, elevation, duplicate-elevation and minimum-route rules also apply before operation-specific work.

Strict Unicode decoding validates identified UTF-16 LE/BE bytes before Expat, rejecting malformed surrogate sequences that the pinned parser can otherwise reinterpret. BOM and BOMless XML byte signatures, including legal leading XML whitespace, are supported. Decoding is validity-only; source bytes are neither normalized nor transcoded. Other XML encodings retain the existing Expat behavior. This is a scoped integrity mitigation, not a runtime upgrade or a claim of complete dependency-vulnerability remediation.

XML declarations, when present, must use the XML VersionNum spelling `1.[0-9]+`. A declaration callback refuses the empty/arbitrary versions accepted by the old bundled parser. This is an input-layer correctness check, not a replacement for the upstream runtime update. GPX 1.0/1.1 namespaces and supported encodings retain their own existing rules.

## Errors and lifecycle

A fatal raw-source rejection carries an explicit admission marker across engine and transport. The UI retires that source's trusted route, details, profile, result clocks and export availability, clears the failed selected-file state and provides visible recovery. A late response cannot revive old state. Starting another source or cancelling retains existing token/reset rules.

An optional details failure remains distinguishable from fatal admission. It cannot suppress an admission marker. Unknown or pending station facts stay visible without inventing values. Source-change behavior differs from same-route repair/revert and an empty file-picker dismissal; tests must cover those distinctions.

## Required tests

- Every relevant hostile family through all GPX-consuming operations, with the same fatal admission result
- Valid bounded equivalents for UTF-8 and supported UTF-16 encodings, including legal leading whitespace, metadata and ignored extensions
- Genuine official/local source controls, unchanged inspection/details/geometry and complete/partial CP provenance receipts
- Missing elevation, steep terrain, disconnected/repairable geometry and known model limitations separately from raw-source rejection
- Original-byte download and enriched export reread, without modifying original route geometry or waypoint provenance
- Fatal initial and late details failures clear trusted UI state; optional failures preserve only the state explicitly allowed by their contract
- Busy/cancel/new-source/pagehide and late-result guards, plus exact protected core/source/build bindings

All reports identify real bundled Python/Pyodide execution, synthetic UI/Worker stubs and actual browser checks separately. A fixture or successful fetch cannot substitute for a route's required connected-flow matrix. See ROUTE-IMPORT-ACCEPTANCE.md.

## Runtime boundary

The current pinned Expat 2.7.3 binary is unchanged. Strict decoding is a scoped mitigation for the demonstrated malformed UTF-16 input path. A separately reviewed runtime upgrade remains open; parser-input tests are not a blanket security approval.
