# Connected-route acceptance contract

Updated 2026-10-14. Applies to every new connected route and source refresh, not only the reported Shilin case. A successful HTTP fetch or unchanged raw waypoint list alone is insufficient.

## Shared source admission

Every raw-GPX engine operation must pass the same bounded source-admission contract before its geometry/details/model work. Typed fatal admission rejection clears trusted route/profile/result/export state. Optional details failure, missing elevation, steep terrain and repairable geometry retain their separate explicit eligibility rules. Passing admission does not prove source edition, waypoint meaning or official station association. Malicious inputs must be paired with legitimate original/enriched controls across entry paths. See GPX-ADMISSION.md.

## Separate identities and unknowns

Track raw GPX waypoints, same-edition official catalog stations and user-created checkpoint occurrences separately. Zero GPX waypoints do not imply zero official aid stations. Preserve each source name/ID/provenance and the user's current row name/raw stop/cutoff/edit revision. Never match by name, nearest official kilometre or distance ratio. Unknown station services, coordinates, cutoff clock/reference/arrival-versus-departure semantics and elevation remain unknown until evidence or explicit user confirmation is supplied.

Official and native waypoint association must be explicit when unproved. Existing manual rows must not be silently overwritten, deleted or merged. Potential same-source duplicate clues may require returning to an existing row for explicit source adoption; they must not restore stale mappings. Deleted occurrences stay deleted through same-route transformations.

## Native checkpoint-export policy

Enriched GPX retains the source’s native 1.0/1.1 namespace and version-attribute shape, with version-specific foreign-extension placement. Original downloads stay byte-exact. Absent-version legacy files are not claimed XSD-valid; custom stop metadata is not a watch-acceptance claim. See GPX-NATIVE-EXPORT.md for identity, schema and reread boundaries.

## Required route-specific matrix

Record route ID, edition/group, exact bytes/SHA, source URLs, original waypoint count, official checkpoint count, mapping mode and any unresolved source semantics before testing.

1. **Download.** Exact authorized public source and expected response/envelope/hash. Confirm race/edition/group, not just HTTP200. A denied source stays blocked; no header/proxy bypass.
2. **Import.** Actual parse/inspect/details, geometry and point/segment identities. Main checkpoint list represents available official facts even when canonical positions are pending. Native waypoints remain discoverable. Missing facts are visibly distinct from a deliberate no-station course.
3. **Source association.** Current real candidate passages, explicit choices where ambiguous, original source identity, stable CP occurrence ID, complete or honestly bounded candidates. No first-nearest/name guess, automatic official-km scaling or inferred station services. Native and official duplicate paths and source-reconfirmation recovery are tested.
4. **Repair and revert.** Only permitted existing repair transformations. Before/after exact row identity/order and raw user values; original bytes/source names retained; old location mappings invalidated; explicit source re-adoption versus numeric-only confirmation distinguished. Deleted stations do not return. Cancellation, late results and stale controls cannot modify a newer source.
5. **New route and clear.** Previous checkpoint collection, results, mappings, choices and route-specific acknowledgements do not attach to the new route. Empty file-picker dismissal preserves legitimate existing work. A real selected-file failure/cancel follows a coherent whole-route state policy.
6. **Calculation.** Real current goal/prediction model admission, canonical distances and strict occurrence order, stops counted once, unknown-location/time gates, true arrival/departure cutoff semantics and zero finish stop. Available calculation versus raw-only/blocked geometry are recorded separately.
7. **Exports and reread.** Original download byte hash unchanged. Enriched GPX preserves raw route geometry and existing original waypoints; added rows use current user/official names with separate source provenance. Reparse with actual engine, check coordinates/chainage/stop/cutoff metadata and unchanged model result where mathematically applicable. Filename/source names remain intact. JSON/workout changes, if any, need their own exact contract.
8. **Actual UI.** Published source/version pinned; at least the reachable import/association/repair/new-route path exercised in the designated real browser. Label browser file actions, native desktop, headless viewport, mobile hardware and simulated DOM separately. Pending file permissions are not bypassed by fixture injection.

Each cell is PASS, FAIL, BLOCKED, NOT RUN or explicitly NOT APPLICABLE with evidence and reason. A route is not declared fully connected while a required cell is unknown. An empty raw waypoint preservation comparison must not substitute for official checkpoint UI tests. Source-only contracts and reviewed prototypes do not count as deployed functionality.

## Regression priorities

Include no-waypoint GPX with nonempty official station catalog; original-waypoint-only source; official kilometre-only source; repeated coordinates and same-name occurrences; user manual zero/blank/invalid stops; numeric reconfirmation without source re-adoption; six/nine-decimal representations; candidate collisions at displayed precision; repair/revert cycles; deletion; new route/failed import; and actual enriched export reinspection. Bound option/DOM volume and preserve honest complete totals where paginated.
