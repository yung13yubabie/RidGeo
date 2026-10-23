# Known official checkpoint facts and optional route details

After successful source-matched route inspection, reviewed catalog checkpoint
facts are available independently of optional profile/waypoint details. An
official reported distance or cutoff remains a source fact; it does not establish
a current calculation position, stop duration or cutoff interpretation.

## Ownership and hydration

- Create intermediate checkpoint rows once per accepted original/source session.
  Bind each occurrence to the original hash and catalog entry ordinal. The ordinal
  is internal row identity, not an invented official station ID. Equal names and
  missing station IDs never merge occurrences.
- Matching details hydrate existing rows. Preserve row identity, raw name, stop,
  cutoff, kind and manually entered position. Do not restore user-deleted rows or
  replace manually added rows.
- Only an untouched blank position may acquire an already-supported unique
  mapping. Ambiguous passages need a selection. Explicit waypoint/coordinate
  capabilities retain their dedicated adoption or manual-confirmation gate.
  Hidden legacy selectors cannot bypass those gates.
- A selector is bound to the current source, original bytes, details, route and
  position generation. Repair/revert invalidates old selectors even when the same
  original objects are restored. Retired mappings cannot be revived by stale UI.

## Failure and recovery

Optional details failure or cancellation retains known facts, user drafts, the
admitted route and exact original download. A short explicit retry uses the
current original without resetting the route. It has normal foreground ownership;
no unsolicited retry or automatic repair occurs. CP edits still cancel pending
details work. Retry success, nonfatal failure and cancellation preserve accepted
plan/prediction/export ownership.

Blank generic positions still fail normal calculation/export validation. Manual
entry stays manual. A facts-only route does not gain unsupported geometry, model,
waypoint or export capability.

Current fatal shared-admission rejection retires trusted route, checkpoint,
result and export state. Stale responses cannot hydrate or retire a replacement
source. Original details cannot replace the active derived calculation route.
Repair requires original details and explicit existing consent; repair/revert
preserves occurrence drafts and requires current-route position confirmation.

## Maintained checks

See `checks/official-cp-facts/README.md`. Generated fixtures exercise the real app
graph and pinned WASM engine with simulated DOM/Worker delivery. They cover
facts-only import, duplicate/no-ID occurrences, hydration, edit/deletion ownership,
retry, cancel/pagehide, wrong-source/fatal responses, replacement, ambiguity and
repair/revert. Native browser, mobile and production delivery acceptance remain
separate.
