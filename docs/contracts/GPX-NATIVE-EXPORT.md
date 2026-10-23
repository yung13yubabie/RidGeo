# Native GPX checkpoint export policy

This isolated compatibility repair applies generically to GPX 1.0 and 1.1. It does not change source admission, the frozen core, any source registry or source retrieval permission, or the original-byte download.

## Decision

Keep each source's native namespace, root attributes and version-attribute presence/value. GPX 1.0 has root-level metadata and foreign-namespace wildcards at root/waypoint tails. GPX 1.1 has a metadata container and a canonical extensions container. Native enrichment therefore needs no source-version conversion and has the smallest preservation surface. A generated GPX 1.1 conversion was rejected for this scope because it would require transforming legacy metadata/links, schema-only fields and extension placements. No conversion is offered or implied.

- GPX 1.0 with version="1.0", or an absent version attribute already accepted by shared source admission: retain that exact shape, append a foreign RidGEQ ra:extensions container at the root tail and each newly generated waypoint tail. Do not invent a GPX-namespace extensions element.
- GPX 1.1 with version="1.1": retain the existing canonical extensions strategy.
- Conflicting/explicitly empty versions and namespace-free sources remain original-download-only for enrichment. Import support is independent.
- An absent-version 1.0 source and derivative are not claimed XSD-valid. This accepted legacy input is never silently corrected by adding a version attribute.
- The official 1.0 schema's wildcard defaults to strict validation. A validator needs a declaration for the RidGEQ extension namespace to validate a versioned enriched file; the unmodified base schema alone does not establish custom-extension validity. GPX 1.1 uses lax extension validation. Consumers that ignore extensions receive native route/waypoint geometry, not a promise to interpret stop/cutoff metadata.

Schema sources, read by ordinary anonymous GET:
https://www.topografix.com/GPX/1/0/gpx.xsd
https://www.topografix.com/GPX/1/1/gpx.xsd

## Preservation and identity

The original byte buffer and its download remain unchanged. The generated UTF-8 derivative is separate; its lexical serialization/encoding can differ, while original expanded-namespace trees, root attributes, route/track metadata, point order, coordinates, elevation, time, descriptions and original waypoint annotations remain unchanged. Source filename and catalog name are recorded separately from current user checkpoint names; filename generation retains the existing source stem and RidGEQ suffix.

Original native waypoint records remain untouched and distinct from generated planner checkpoint occurrences. Adopting a native waypoint can produce an original native waypoint plus a separate planner occurrence at the same coordinate, with source-index/name/hash/passage evidence in its mapping receipt. Only the planner occurrence carries the newly supplied dwell. Do not merge by coordinate or name. Stable UI occurrence IDs are exported; duplicate IDs within the current requested occurrence list fail closed. Repeated exports start from unchanged source bytes, so they do not accumulate waypoints or dwell. Shared Python details still treats extension contents as inert. After actual inspect/details admission, the browser can show an independently validated, untrusted imported checkpoint proposal. Nothing is automatically adopted or treated as an authenticated official station.

Unknown cutoff/official-service facts remain absent, not zero. Explicit zero dwell remains zero. No source coordinates, station locations or nearest-passage matches are invented. Existing, disclosed along-route estimation for manually positioned checkpoints remains unchanged. Source/output namespace and version-attribute state, original/current source hashes and generated export kind are recorded. Automatically generated provenance field names cannot be overridden by supplied provenance.

## Explicit enriched-file reread

The current export receipt records a versioned generation ID, actual source geometry SHA, native-waypoint count and added occurrence count. Each planner waypoint records its occurrence ID, current source geometry and, when explicitly associated with a native waypoint, the original source index, exact name/coordinate/elevation identity, claimed original-byte SHA and selected passage. First native adoption and later official-source adoption use the same identity receipt. The SHA is lineage, not proof of authenticity.

Only after real shared-engine inspection/details succeeds does a local, read-only helper inspect the exact namespace/container/versioned records. It compares geometry SHA to this actual parse, checks complete counts, scalar/duplicate/numeric/text limits, unique occurrence IDs, unique chainage and the current waypoint identities/candidates. Native and official-coordinate passages use strict individual passage matching; manually estimated positions instead recompute the declared existing linear estimator against actual raw source points and require exact coordinate/elevation/source-index equality. A spherical projection does not substitute for a manual coordinate binding.

The UI shows a short imported-proposal badge and expandable name/distance/stop/cutoff/source preview. “採用站點與停留” explicitly adds a new row, preserving current existing edits and sorting only the newly inserted row by its exact distance. Native source records and derived occurrences stay distinct; a verified same native passage points to its proposal or already adopted row. Different passages of one source waypoint remain separate occurrences. Imported source-kind/official claims never become catalog truth. Known75 seconds and deliberate0 are restored distinctly from absent/invalid stops; exact fractional minute inputs use step=any within the existing bounds. Cutoff values unsupported by the current whole-second clock UI, including fractional seconds, remain pending rather than rounded.

On the next export, preserved earlier records remain immutable source annotations. The final appended root receipt identifies the current generation; preceding generated waypoints are labelled historical, not current active checkpoint proposals. Only the new generation’s records are offered for adoption. This is a declared file-format convention, not a cryptographic authenticity claim. Repeated export/import/adopt cycles preserve source annotations without accumulating active CP/dwell or colliding stable occurrence IDs. This intentionally remains bounded by the existing200-waypoint and5MiB limits.

Invalid, old, partial, namespace-mismatched, forged-geometry or conflicting metadata cannot authorize CP changes or block otherwise legitimate raw GPX admission. Its pending status and any safely readable stored dwell remain visible; manual fallback starts with unknown blank dwell. A bad entry cannot be presented as a complete successful bundle. Native candidates stay visible. New route/reset/cancel and repair/revert use existing lifecycle boundaries; adoption buttons additionally bind exact current route/details/source/geometry and never revive old state. Same-route repair keeps user values but does not automatically reactivate a stale exported proposal.

## Security and resource boundary

Enrichment remains downstream of shared engine admission. Its DOM serializer additionally refuses DTD/entities, processing instructions, foreign canonical ancestors, nested captured scalars, duplicate captured fields, malformed coordinates/elevations, oversized names/metadata, depth/count/attribute/waypoint/byte limits and malformed UTF-16 decoding. It does not repair a rejected source or relax shared engine budgets. Output is checked against the same DOM bounds; real engine reread is tested independently. Decimal coordinate/elevation spellings never use exponent notation, and supplied nonfinite optional elevations are refused rather than dropped. ISO-8859-1 is decoded exactly byte-for-code-point; Windows-1252 uses its own published map and refuses undefined bytes. Both preserve admitted original text/tree semantics while producing a separate UTF-8 derivative. The exporter and proposal reader share that decoder, rather than using WHATWG aliases that change Latin1 C1 characters. Other unverified non-UTF encodings are explicitly refused for enrichment/proposal interpretation; existing source admission and original-byte download remain available. GPX1.1 newly generated longitude+180 is refused, while GPX1.0 permits its inclusive bound. XML text is encoded through DOM text nodes with namespace-aware elements; unknown extensions remain inert and preserved.

## Verification boundaries

The isolated author suite tests actual exporter code through an explicitly test-only stdlib-minidom DOM adapter, actual unchanged strict CPython reread/semantic tree comparisons, and actual bundled Pyodide under Node. It includes versioned/absent 1.0, 1.1, default/prefixed namespaces, prefix collisions, legacy metadata, original native annotations, positive encoding controls, hostile families, stable occurrence/dwell receipts and original bytes. Genuine public-source controls stay in their private research paths; no original GPX files are bundled by this change.

Synthetic DOM/Worker lifecycle tests, package/build gates, schema validation, actual public-source transport, real browser file downloads/adoption, mobile resource suitability and watch/device acceptance are separate evidence. Local exporter/runtime success does not complete the full ROUTE-IMPORT-ACCEPTANCE matrix or promise watch recognition of custom dwell. No publication, account operation or device upload is included.

DOM export and imported-checkpoint interpretation share a forward-only lexical screen before DOM parsing. Real DTD/entity declarations and non-declaration processing instructions are refused; declaration-looking literals in comments/CDATA remain inert and preserved. Incomplete comment/CDATA blocks are refused without a quadratic strip-regex scan. These helpers remain downstream of shared source admission; direct-helper tests are defense in depth, not evidence of an admitted-source exploit or native-browser memory guarantee.

## Active start-clock receipt

Route/CP enrichment is independent of an accepted pace result. It captures the active goal or prediction start clock once and derives official elapsed cutoffs using that same clock. Goal calculation reads remain explicitly goal-clock-owned and do not replace a prediction-relative visible cutoff. User-edited elapsed values are never recomputed from official absolute facts.

The root receipt's `start_local_time` and optional `start_local_date` describe that export context. A blank prediction date stays absent; only goal mode may record a known catalogue race day. An absolute official cutoff cannot be activated for an incompatible/unknown declared prediction date. The original local fact is retained, and the user can explicitly choose an appropriate manual elapsed value. Computed numeric cutoffs still obey the existing whole-second UI and 168h bound.

Start/date receipt values remain unverified informational lineage. Reread never silently applies them to the UI, changes source authority, or reinterprets an adopted manual elapsed cutoff. Earlier root receipts remain preserved annotations through subsequent generations.

## Bounded station-fact lineage

Exact-source checkpoint exports retain an allowlisted raw catalogue fact with its
catalogue occurrence ordinal and source edition/date caveats. The ordinal is
internal occurrence identity, not an invented official station ID. Raw source
names, services, reported distances, coordinates, cutoff semantics, explicit
null/false values and absent fields remain separate from the current planner
name, position, stop and elapsed cutoff. Mapping candidates and current user
inputs are excluded from this raw fact payload.

After explicit re-adoption, the fact and allowlisted original scalar lineage
remain bounded, flattened, unverified imported claims. They never populate the
official/context fact slots, establish source identity, adopt a source URL or
activate an official cutoff. The human disclosure uses compact labels; complete
receipts remain export metadata. Goal JSON checkpoint provenance also retains
these separately labelled imported claims. Malformed/unpreservable claims refuse
adoption while otherwise admitted raw GPX remains available.

Same-original source association keeps current row-confirmation ownership.
Accepted replacement retires that session even when the bytes are identical.
Waypoint/proposal controls additionally belong to their current render; returning
to original objects after repair/revert cannot revive a retired callback.

Maintained focused checks are in `checks/route-station-workflow/README.md`.
