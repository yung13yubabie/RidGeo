# Quantified terrain-source evidence, without a domain unlock

## Scientific decision

The current ordinary allocation and history prediction use the unchanged Minetti
running-cost polynomial within rise/horizontal grade −0.45 through +0.45. The
[original study](https://doi.org/10.1152/japplphysiol.01177.2001) measured ten runners
on treadmills across that interval. It does not validate polynomial extrapolation,
technical downhill speed, personal endurance, recovery or race-time accuracy.

There is locomotion research beyond that interval. The primary
[Giovanelli et al. 2016 study](https://doi.org/10.1152/japplphysiol.00546.2015), also
available from the [author's site](https://nicolagiovanelli.com/wp-content/uploads/2022/01/fbe28-vertical-km-giovanelli2016.pdf),
tested fifteen mountain runners in five-minute uphill walking/running trials at
9.4–39.2 degrees and a fixed 0.35 m/s vertical speed. Those observations do not
qualify the existing polynomial beyond its measured domain, downhill use, mixed
technical races or individual ultra-duration time prediction. The authors themselves
explain why extrapolating the earlier data is questionable. A future extension needs
a separately identified model, gait/speed/source qualification and appropriate
out-of-sample evidence; neither paper supplies a general correction for GPX noise.

The engineering decision is therefore to retain all existing model and source
quality gates. There is no clamp, new smoother, guessed elevation, source exception,
automatically fitted steep rate or new calibration claim.

## Shared user workflow

The existing optional original-source check now carries quantitative canonical
steep-run evidence through its bounded page instead of discarding it. The collapsed
source-quality disclosure shows run count and total along-slope length. Each run
has a compact direction/calculated-route-kilometer/length/grade summary, with native
keyboard-accessible details for the conservative original point support, horizontal
length, signed vertical displacement, consecutive cells and raw reversal clues.

Calculated route kilometers are along the unchanged canonical 3-D profile. Grades
are rise/horizontal distance, not degrees. Original point ranges include smoothing
support and bracketing points; they are not exact steep-run endpoints. Adjacent
canonical cells and absence of a raw reversal do not independently establish terrain
truth or accurate elevation. A raw reversal remains an unconfirmed review clue.
No total or null is used as a source-accuracy verdict.

Users can locate the affected original points, compare independently qualified
elevation, or use the existing explicitly confirmed mixed scenario with suitable
user-supplied direction rates. Unknown rates remain unknown and cannot produce a
whole-route finish time. The latter remains a scenario, not a newly validated
prediction or a source-elevation repair. The source check grants no consent.

## Contract, integrity and resources

- The existing `route-quality-page/1.0` envelope is additive. `diagnostic_version`
  advances to `raw-structure-canonical-support-v2`.
- Available canonical summaries include explicit `grade_domain` and
  `route_distance_m`; the latter remains null when the whole canonical grade is
  unknown. The existing missing-elevation/blocked/multi-segment semantics remain.
- Canonical steep rows add `grade_evidence` with version
  `canonical-steep-source-support/1.0`. Values come directly from the already
  computed frozen-core run, never a second smoother. Raw finding rows gain no
  fabricated quantitative steep evidence.
- Validation binds source SHA, segment/source ranges, finite signed direction,
  route location, grade interval, horizontal/vertical/arc relationships, page
  aggregates and whole-page equality where all runs are present. A conservative
  maximum route-distance envelope follows from existing 500 km/25 m grid and
  −1,000..10,000 m admitted elevations; it is not a new route admission rule.
- At most 25 rows and 64 KiB per successful response remain unchanged. Full source
  evidence remains a one-source worker cache. The changed Python module retains
  manifest SHA integrity and unchanged pinned dependencies.
- Old/malformed optional evidence fails locally and retains trusted route,
  checkpoint edits, accepted result and original download. It does not become a
  fatal GPX admission rejection or grant repair/model consent. A mixed static
  generation may require a fresh page; it is never accepted as current evidence.
- Production assets are served through the existing protected no-cache response;
  no persistent diagnostic cache, service worker or new endpoint is introduced.

## Acceptance boundaries

`checks/terrain-model-coverage` tests synthetic mathematical invariants, hostile
evidence mutations, all 31 exact-source ordinary gates and 13 grade-refused app
journeys against the independently implemented reviewer oracle. The actual-WASM
test uses the real app graph while DOM, outer Worker and downloads are modeled.
Original source SHA/size, source download, CP state, unknown mixed results and the
unchanged refusal are explicit checks. Fixture GPX and derivatives stay outside the
repository. Native-browser layout/interaction and physical devices are separate
acceptance gates. Source evidence does not establish real terrain or prediction
accuracy, and passing a correct refusal is not a route unlock.
