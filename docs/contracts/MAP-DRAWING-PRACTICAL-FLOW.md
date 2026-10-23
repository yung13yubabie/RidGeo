# Practical map-drawing workflow candidate

Baseline: v0.5.43 / `981fa7d`. This is a source candidate, not a native-WebGL or publication acceptance record. The existing fixed public-basemap terms, privacy disclosure, local renderer assets, request allowlist and original numerical core remain unchanged. No DEM, routing, snapping, account, dependency or service is added.

## Ownership and lifecycle

- `workspace-ui.mjs` owns the panel, renderer, local draft, advisory inspect/details requests and explicit replacement dialog. Only the existing application route-import transaction may replace the accepted route, checkpoint nodes, plan or consents.
- `route-draft.mjs` owns original-order coordinate-only GPX bytes, bounded committed undo/redo and revision/hash inspection tickets. `terra-route-controller.mjs` owns the separate in-progress gesture and the renderer's selection/edit state. World-copy transformations remain display/input-only.
- Starting a redraw no longer clears committed coordinates or adds an intermediate empty history entry. The blank armed mode is already an unfinished gesture, so checking and exporting are disabled until it finishes or cancels. Valid completion replaces the draft in one undo step.
- Escape, the explicit Cancel action, Edit during an unfinished redraw, pointer cancellation, interrupted drag capture, blur and panel close restore the last committed draft. Undoing a working line to zero points retains Terra's redo stack; it is distinct from Escape. Canceled gestures never add committed history or revive old inspection authority.
- The two compact Finish/Cancel controls provide a keyboard-free path. Finish invokes the pinned Terra line mode's existing Enter completion semantics; it does not read the rendered map or create synthetic points. A too-short line stays unfinished. Tool state retains Terra's working undo/redo across unrelated renders. The 50,000 committed-point limit permits the renderer's one transient preview point, without enlarging finished-draft admission.
- Deferred finish/cancel work is bound to a gesture epoch. A later gesture, restoration, pause or disposal fences old work. Closing/reopening and renderer failure preserve committed draft bytes and history; new map readiness and a new check are required before Apply.
- Confirmed Apply temporarily puts Terra in its built-in static mode. Canvas gestures, map-scoped shortcuts and duplicate Apply cannot revise or resubmit a replacement while its existing route-import transaction is pending. Rejected admission restores the committed draft and accepted workspace, and requires another check. Renderer loss/close during admission still releases map resources.
- Rejected edits restore the committed draft before reporting their specific error. Subsequent library history notifications no longer overwrite that error with a generic unchecked message.

## Inspection and replacement gates

Draft admission now rejects malformed or sparse quality records, contradictory blocking status, disagreement between inspect and details canonical geometry, wrong GPX version, inconsistent source-point/segment counts and invalid canonical along-route positions. Distances from the two unchanged core operations must agree exactly. Original coordinates, point order, hashes, unknown elevation and revision/request identities remain mandatory. A blocked route remains exportable and visibly non-calculable; its raw points have unknown canonical positions, as produced by the unchanged core.

The parent integration additionally checks the second route-import inspection against the approved drawn provenance hash before committing. A failed second admission retains the previously accepted route, raw CP fields and result; final acceptance still follows `loadBytes`. No flat-elevation assumption is selected automatically.

## Evidence and limits

`checks/map-drawing-workflow/flow.mjs` exercises actual application modules/HTML and the shipped Terra library with modeled DOM/map/pointer/core delivery. `inspection.mjs` exercises the production draft validator with deliberately synthetic response mutations and the registered pinned line mode's point budget. Their scope is software state and admission, not numerical-model efficacy or GPU/device acceptance.

- 15 practical workflow cases pass, including redraw/cancel/finish/edit/undo/redo, held inspection, failed replacement, readonly segment/dateline display, stale confirmation, focus, exact draft export and source teardown.
- 21 draft-admission/mode-budget cases pass. The baseline draft accepted 18 newly rejected malformed/mismatched response cases; baseline-only results are retained separately.
- Existing six renderer lifecycle and five independent transition/request-boundary cases pass against the candidate, using modeled surfaces.
- The old `route-ui-workflows/profile-layout.mjs` passes its two application-profile cases but fails its obsolete CSS-marker assertion against unchanged `workspace.css`; it is not counted as a passing maintained UI gate. No stylesheet was edited here.
- Independent end-to-end actual-app/Terra/bundled-WASM replay and direct ordinary/blocked-draft checks passed; the final source review and independent lightweight rerun passed all 15 + 21 cases.
- Final exact-source bundled-WASM application replay passes 3/3 cases with `sourcesStable: true`, including preserved manual plan/75-second CP, cancellation/reentry and exact confirmed replacement. The sequential official-schema/core suite passes 10/10: GPX1.1/1.0, +180°, dateline loop, tiny/subnormal values, polar blocked geometry and +180° enrichment/reread with an exact 75-second checkpoint. Reports are in `checks/map-drawing-workflow/actual-drawing-results.json` and `gpx-schema-results.json`.
- Final tested map source hashes: workspace UI `7f5e379460812073576c26c51d63b19a6ea406772dcf9c7ec30d6f3aa6dc42a2`; draft `74a179aaa36542b8dab251024044cee88cb32edfff7e913646a8dee5144cd861`; controller `d397eab0eb691f48fd811bcc7da6b0f4bc2aa3fd6f718b3d1c6701ece055a0c9`. The full application/HTML graph is recorded in the actual-app report; final combined release remains the parent integration gate.

Native cloud Chromium still reaches the truthful WebGL2-unavailable fallback while preserving the accepted workspace. Positive native rendering, GPU tiles/glyphs, touch, actual BFCache, full network metadata inspection and physical large-route responsiveness remain open under R19. Modeled map tests must not be described as native acceptance.
