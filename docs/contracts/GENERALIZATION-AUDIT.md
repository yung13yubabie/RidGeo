# Generalization audit matrix

Requested 2026-10-14. R2 evidence remains archived; the r3 caller fix below is the first bounded implementation from this audit. An example becomes a retained regression, not a race-ID-specific algorithm. Per-source facts, reviewed downloads and security allowlists remain source-specific where required. Do not generalize by weakening validation, guessing missing data, or accepting arbitrary proxy URLs.

## Classification for each audit item

Record the product entrypoint and every caller; hardcoded condition or field; whether it represents a platform invariant, source fact, security allowlist or accidental example-specific behavior; existing evidence; required counterexamples; and terminal status. Use VERIFIED, OPEN, BLOCKED or NOT APPLICABLE. A reusable helper alone does not prove every caller/source is connected.

## Matrix

| Area | Shared mechanism to trace | Required diversity | Source-specific limits that must remain | Initial status |
|---|---|---|---|---|
| Race import | catalog → loader/bridge → original bytes → inspect/details → main CP list | different editions/groups, direct and fixed same-origin sources, raw-only and missing links | exact reviewed URLs/hashes/edition attribution; denied source remains denied | OPEN per-route matrix |
| Checkpoint sources | original wpt, official facts, manual occurrence IDs and explicit association | GPX0 with catalogCP>0; waypoint-only; coordinates known/unknown; same name and repeat passage | official kilometres/cutoff statements are reference facts, not inferred canonical mapping | R3 native/local caller mechanism under review; source coverage OPEN |
| Repair | proposal/apply/revert lifecycle and current-route identity | missing altitude, short permissible gap, duplicate XY jump, steep out-of-domain, disconnected segments, all-missing | existing short-gap/candidate rules and explicit consent; no new interpolation/model tolerance | Shared CP regression verified; route-specific cases OPEN |
| Reconfirmation and duplicates | numeric confirmation versus current source adoption | official9/native6 decimals, source index/hash mismatch, same rendered distance, edited-away-and-back, deleted CP | uncertain source hint is not a proven duplicate or automatic merge | r3 shared candidate under independent/hosted gates |
| Calculation | canonical geometry, model admission, moving-prefix integration, stop once, downstream schedule | arbitrary route length/terrain, zero/manual/unknown stops, loop occurrences, finish, >24h and multi-day cutoffs | model domain and7-day input limit remain until separately reviewed | Existing numerical scope verified; broader actual-course accuracy OPEN |
| Display grouping | terrain children and four-level summary callers | any segment lengths, repeated small reversals, CP/gap/unknown barriers, long chains | summary pace=sum moving/time distance, no reallocation to fixed target; preserve children | Pure candidate reviewed, live integration OPEN |
| Manual pace and recovery | locked override → intensity/load state → downstream unlocked moving and station recovery | arbitrary chosen segment/merged parent, forward effect and restore, stop placement, actual load history | unknown intensity/recovery response not guessed; no double core-decay application | Research/adapter prerequisites only |
| Field errors and suggestions | every validator → error location → candidate → real-core preflight → explicit apply | empty/invalid formats, numbers at float bounds, no integer solution, stale route/CP/constraints, unknown fields | preserve bounds and consents; target suggestion is computability, not personal capacity | Pure reviewed helper; UI integration OPEN |
| Layout/accessibility | shared controls, labels, disclosures, focus, wrap and result tables | long Chinese/Latin names, all sections expanded, keyboard/touch, desktop/narrow/zoom | source/static checks are not native mobile proof; no clipped numeric data as a layout workaround | Two independent layout candidates pending |
| Exports/reread | original bytes, enriched GPX, JSON and workout output | original Chinese filename, renamedCP/source-name collision, UTF encodings, repeated stations, manual/unknown fields | preserve original namespace compatibility/provenance, no fake fitness or station data | Scoped checks verified; every new route matrix OPEN |
| History/accounts/devices | local file lifecycle, actual references, supported Intervals and watch path | true records, selected multis, canceled/replaced files, unsupported or incomplete provider data | real account permissions and device capabilities must be verified, no credential or pending-file-action bypass | Partial local feature; true account/device/file flow OPEN |

## Required next audit pass

Start from app.js, catalog/loader/bridge modules, official-checkpoints.js, checkpoint-waypoint-choices.mjs, transport/Worker adapters, route repair and planning entrypoints, prediction-table/profile modules, error-navigation, gpx export/filename and workout code. Enumerate their caller conditions and tests. In particular, review whether `waypointSelection` is an explicit source capability or unnecessarily prevents another eligible official-distance-only source from using the generic association UI. Do not simply delete the gate without source/identity/resource tests.

The route-specific end-to-end checklist is ROUTE-IMPORT-ACCEPTANCE.md. Keep source-only audit evidence separate from runtime and label every blocked/not-run cell. Global completion requires evidence across the intended domain; one example or HTTP200 is insufficient.

## R3 focused caller correction

Native add and retained native re-adoption now share one validated choice builder across catalog and local GPX. The official arbitrary-point capability remains source-specific. Retained native selectors filter original SHA/index/XY, bound each to64 choices, and expose partial list completeness and a manual location route. Original audit evidence is retained outside the product tree; only bounded formal regression fixtures/contracts are included here. Hosted verification remains a separate gate.
