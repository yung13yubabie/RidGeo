# Optional whole-route hiking-reference goal allocation

## Scope and meaning

The running method stays the default, with the unchanged frozen Minetti core and
its existing admission rules. Selecting `campbell2022-hiking-reference-v1` and
explicitly confirming an on-trail hiking scenario enables a separate goal allocator.
It distributes the user's chosen elapsed target; it does not estimate personal
ability, a population-median finish, target feasibility or a success probability.
There is no automatic fallback, grade splice or new personal predictor.

Campbell, Dennison and Thompson (2022), [Eq.1/Table A3 p50](https://doi.org/10.1016/j.compenvurbsys.2022.101866):

- a=-1.4579, b=22.0787, c=76.3271, d=0.0525, e=-0.00032002
- theta=atan(rise/horizontal_distance) in signed degrees
- rate=c/(pi*b*(1+((theta-a)/b)^2))+d+e*theta, in horizontal metres/second
- reference weight=horizontal_distance/rate, in seconds

Every cell of the current canonical geometry must be within the closed angular
support −30° through +30°, checked as grade ±tan(30°) without an admission epsilon.
Immediate neighboring out-of-domain floats, unknown and nonfinite grades are
refused. There is no clipping or extrapolation. Geometry must be complete and
unblocked; flat consent cannot supply missing hiking grades.

The source study's LiDAR/snapped-trail preprocessing differs from the current
25 m horizontal grid and 50 m smoothing. Coarse cells can hide short extremes;
source heights and the actual trail remain uncertain. The observed approximately
2.8–17.9 km trail lengths are empirical coverage, not an input-domain gate.
Longer/shorter routes remain mathematically available with a visible coverage
warning. Technical surface, load, weather, fatigue and individual endurance have
not been validated. The paper and figures are not redistributed.

## Request, result and integrity

The existing `plan` operation dispatches only the exact selector to the separately
manifest-pinned `hiking_reference.py`. The frozen core files are untouched.
Hiking accepts only:

- allocation_model, hiking_consent=true, target_elapsed_s
- checkpoints, each with an explicitly known stop_s (including explicit zero)
- optional max_speed_m_s (null/unset means unlimited) and min_speed_m_s (0/unset
  means unlimited)

Legacy running fatigue, walk caps, flat substitution and grade-clamp fields are
rejected. Target and CP/cutoff bounds remain consistent with existing goal
workflows. Unknown stops are never defaulted to zero; finish stop must be zero.
An automatic zero-stop finish remains a generated boundary, not an unknown CP.

The moving budget is target minus separately declared stops. It must be positive.
With no user speed bounds, times are proportional to whole-route reference
weights. Optional user bounds use three-dimensional along-route speed, exactly
like displayed pace and manual locks; they do not reinterpret Campbell's
horizontal rate as along-slope speed and do not certify hiking feasibility.
The existing bounded allocator has beta=0, so there is no inherited running
fatigue. Stops are added once. Mid-cell CPs integrate the same cell curve at the
current three-dimensional chainage; adding a CP does not change the geometry or
whole-route allocation.

The result retains the standard goal envelope and complete canonical timeline,
with model_version `campbell2022-hiking-reference-goal-v1`, an explicit model
registry, on-trail choice, original current route hash, geometry hash/version,
reference weight total, coverage and representation limitations in reference_basis.
That reference total is explicitly not a finish prediction. New presentation and
export consumers validate paired model/input/reference identities.

The model file has its own core-bound integrity manifest. The manual adapter
manifest binds this new dependency. After reviewed source changes,
`scripts/repin-hiking-reference.py` updates live-only pins. The old capsule-copy
helper refuses the hiking-aware adapter instead of rewriting the frozen package. The shared verified runtime does not replace
frozen planning functions or modules. The live manual adapter loads under a private
alias, retaining isolation from the separately pinned conditional-runtime capsule.
Hiking is not admitted to that recovery/prediction seam.

## Manual pace and station consumers

Manual preparation reconstructs the same hiking baseline and its whole-route
reference curve; all locked and unlocked fragments retain beta=0. The lock target
uses only explicitly chosen generic speed bounds. Unlocked intervals retain the
initial hiking curve; manual edits may change the finish, without silently
rebalancing the target. Manual JSON, Apply/Undo/Reset, station comparisons and
workout conversion retain model_registry/reference_basis and original goal input.
The manual receipt accepts minimum_s=0 only for the explicitly identified,
consented hiking model with no maximum-speed bound. All running bound checks
remain unchanged.

Station comparisons preserve the accepted moving ledger and separately replace
dwell composition. The dedicated station export retains allocation_model,
hiking_consent and full hiking provenance. No rest benefit or best-rest model is
introduced.

## UI and owner lifecycle

Running is primary. The auxiliary selector is initially collapsed under「輔助參考（選用）」inside the existing goal settings. Ordinary running requires no reference selection, consent or extra step. If selected, the complete hiking-reference scenario remains auxiliary, not a mixed run/walk correction or a prerequisite for running. Its identity and required consent are visible outside the collapsed auxiliary selector. Consent
is unchecked initially and resets on model change, new source, geometry repair and
revert. Neither a selection nor an error link checks it. Required consent and
empirical-length coverage warnings remain outside folded limitations. Folded goal
summary, accepted result and workout dialog preserve visible hiking identity.
Running-only advanced fields are hidden, preserved, and never sent as hiking
settings. Optional hiking speed fields start blank and are not copied from running.

A model switch cancels pending work and invalidates accepted plans, manual/station
previews and all exports, while preserving the unchanged source/CP geometry.
Hiking has an independent exact pending-request snapshot containing mode/input,
raw field signature, revision and source/geometry identity. Silent edits while
pending cannot bless an old response. It does not reuse the running-specific goal
suggestion math. Existing owner checks apply again at every export action,
including an already-open workout dialog.

Model-only changes preserve CP facts, names, occurrence identity and current
positions. Existing explicit local repair and revert retain their original-byte
preservation, position-ticket retirement and CP re-confirmation requirements.
Hiking does not authorize a repair or convert an estimated profile into ground
truth. Generic angular admission also applies to a confirmed derived geometry;
there is no route-name allowlist.

## Export provenance

- Goal/manual JSON retains full model and geometry provenance plus the existing
  source/repair and CP fact lineage.
- Station-clock JSON explicitly carries the same hiking provenance.
- Enriched GPX remains a route/CP export. When a current accepted hiking result
  exists, it records that separate goal-reference provenance; it does not export
  timestamps as a validated hike or preserve stale scenario permission.
- Workout TXT keeps the existing step-only syntax, uses a hiking-specific filename
  and is visibly labeled in the dialog. The TXT itself is not a provenance packet.
- A separately guarded `hiking-workout-reference/1.0` JSON download preserves the
  exact generated TXT, result basis, source/repair hashes, totals, limitations and
  compatibility verification flags. It requires the same current accepted owner.
  Platform parsing and real-device compatibility remain unverified.

## DSM scope boundary

No new DSM acquisition, registry, source replacement or admission exception is
included here. A retained whole-profile surface-reference proposal requires its
own trusted asset/provenance package, separate per-route UI consent, complete
coverage checks and source-bound apply/revert lifecycle. Existing strict-ground
refusals remain unchanged. Research sidecars are not runtime authority. The generic
hiking method works on existing explicitly adopted local-repair geometries without
needing this separate DSM product path.
