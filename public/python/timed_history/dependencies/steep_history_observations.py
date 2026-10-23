"""Offline, pure, receipt-based historical vertical-rate observations.

No account access, GPX parsing, target prediction, fitted physiology or implicit
trust grant. A successful result is a STRUCTURAL candidate, never authorization
to use client-supplied evidence in a production prediction.
"""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone, timedelta
import hashlib
import json
import math
import re
from typing import Literal, TypedDict

SCHEMA_VERSION = "steep-history-observations/0.1"
METHOD_VERSION = "activity-pooled-then-equal-mean-vertical-rate-v1"
GEOMETRY_VERSION = "sphere-box50-grid25-v1"
GEOMETRY_CONFIG = {"grid_m": 25.0, "smoothing_window_m": 50.0,
                   "max_raw_gap_m": 2000.0, "max_route_m": 500000.0}
DOMAIN = .45
# Resource limits, not scientific reliability thresholds.
MAX_SEGMENTS, MAX_SAMPLES, MAX_CELLS = 64, 50000, 100000


class Sample(TypedDict):
    source_index: int
    elapsed_s: float
    horizontal_m: float
    raw_elevation_m: float


class Cell(TypedDict):
    start_horizontal_m: float
    end_horizontal_m: float
    elevation_start_m: float
    elevation_end_m: float


class MovingEvidence(TypedDict):
    kind: Literal["unknown", "segment_moving", "segment_all_stops"]
    duration_s: float | None
    scope: Literal["this_exact_segment"] | None
    source: str | None
    evidence_sha256: str | None


class SegmentReceipt(TypedDict):
    identity: dict
    recording_started_at: str
    recording_completed_at: str
    direction: Literal["up", "down"]
    samples: list[Sample]
    cells: list[Cell]
    moving_evidence: MovingEvidence
    qualification: dict
    source_assessment: dict
    geometry_receipt: dict
    quality_policy: dict
    terrain_context: dict


class ContractError(ValueError):
    def __init__(self, code: str):
        super().__init__(code)
        self.code = code


def _fail(code):
    raise ContractError(code)


def _keys(value, expected):
    if type(value) is not dict or set(value) != set(expected.split()):
        _fail("schema_invalid")


def _text(value, *, optional=False, limit=256):
    if value is None and optional:
        return
    if type(value) is not str or not value.strip() or len(value) > limit:
        _fail("text_invalid")


def _enum(value, allowed):
    if type(value) is not str or value not in allowed:
        _fail("enum_invalid")


def _bool(value):
    if type(value) is not bool:
        _fail("boolean_invalid")


def _number(value, *, nonnegative=True, positive=False):
    try:
        good = type(value) in (int, float) and math.isfinite(value)
    except (OverflowError, TypeError):
        good = False
    if not good or (nonnegative and value < 0) or (positive and value <= 0):
        _fail("number_invalid")
    return float(value)


def _digest(value):
    if type(value) is not str or re.fullmatch(r"[0-9a-f]{64}", value) is None:
        _fail("digest_invalid")


def _instant(value):
    _text(value, limit=40)
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if "T" not in value or dt.tzinfo is None or dt.utcoffset() is None:
            _fail("timezone_required")
        return dt.astimezone(timezone.utc)
    except (ValueError, OverflowError):
        _fail("timestamp_invalid")


def payload_sha256(value):
    """Checksum encoding for this Python-only receipt, NOT a trust signature."""
    try:
        return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"),
                                          allow_nan=False).encode()).hexdigest()
    except (ValueError, TypeError, OverflowError, RecursionError):
        _fail("payload_invalid")


def _sum(values):
    try:
        result = math.fsum(values)
    except (ValueError, OverflowError):
        _fail("numeric_range")
    if not math.isfinite(result):
        _fail("numeric_range")
    return result


def _rate(vertical, duration):
    if duration <= 0:
        _fail("nonpositive_duration")
    result = (vertical / duration) * 3600.0
    if not math.isfinite(result) or result <= 0:
        _fail("numeric_range")
    return result


def _validate(r):
    _keys(r, "identity recording_started_at recording_completed_at direction samples cells "
             "moving_evidence qualification source_assessment geometry_receipt quality_policy terrain_context")
    i = r["identity"]
    _keys(i, "provider subject_namespace recording_key export_id")
    for k in ("provider", "subject_namespace", "export_id"):
        _text(i[k], limit=128)
    _text(i["recording_key"], optional=True, limit=128)
    _enum(r["direction"], ("up", "down"))
    start, end = _instant(r["recording_started_at"]), _instant(r["recording_completed_at"])
    if end <= start:
        _fail("recording_date_order")
    if type(r["samples"]) is not list or not 2 <= len(r["samples"]) <= MAX_SAMPLES:
        _fail("sample_budget_or_count")
    if type(r["cells"]) is not list or not 1 <= len(r["cells"]) <= MAX_CELLS:
        _fail("cell_budget_or_count")
    for s in r["samples"]:
        _keys(s, "source_index elapsed_s horizontal_m raw_elevation_m")
        if type(s["source_index"]) is not int or not 0 <= s["source_index"] < MAX_SAMPLES:
            _fail("source_index_invalid")
        for k in ("elapsed_s", "horizontal_m"):
            _number(s[k])
        z = _number(s["raw_elevation_m"], nonnegative=False)
        if not -1000 <= z <= 10000 or s["horizontal_m"] > GEOMETRY_CONFIG["max_route_m"]:
            _fail("source_range")
    for c in r["cells"]:
        _keys(c, "start_horizontal_m end_horizontal_m elevation_start_m elevation_end_m")
        for k in ("start_horizontal_m", "end_horizontal_m"):
            _number(c[k])
        for k in ("elevation_start_m", "elevation_end_m"):
            if not -1000 <= _number(c[k], nonnegative=False) <= 10000:
                _fail("geometry_range")
    m = r["moving_evidence"]
    _keys(m, "kind duration_s scope source evidence_sha256")
    _enum(m["kind"], ("unknown", "segment_moving", "segment_all_stops"))
    if m["kind"] == "unknown":
        if any(m[k] is not None for k in ("duration_s", "scope", "source", "evidence_sha256")):
            _fail("unknown_moving_schema")
    else:
        _number(m["duration_s"])
        _enum(m["scope"], ("this_exact_segment",))
        _text(m["source"])
        _digest(m["evidence_sha256"])
    q = r["qualification"]
    _keys(q, "original_classification selected_classification classification_source "
             "high_effort_reference_confirmed actual_history_confirmed")
    for k in ("original_classification", "selected_classification"):
        _enum(q[k], ("race", "benchmark", "easy", "unclassified"))
    _enum(q["classification_source"], ("upstream", "explicit_user_confirmation"))
    for k in ("high_effort_reference_confirmed", "actual_history_confirmed"):
        _bool(q[k])
    if q["classification_source"] == "upstream" and q["original_classification"] != q["selected_classification"]:
        _fail("classification_conflict")
    a = r["source_assessment"]
    _keys(a, "kind status upstream_source normalizer_schema source_snapshot_sha256 "
             "path_sample_binding_sha256 historical_performance_eligible quality")
    _enum(a["kind"], ("synthetic", "normalized_history", "local_timed_gpx"))
    _enum(a["status"], ("usable", "limited", "rejected"))
    _text(a["upstream_source"], optional=True)
    _text(a["normalizer_schema"], optional=True)
    _digest(a["source_snapshot_sha256"])
    _digest(a["path_sample_binding_sha256"])
    _bool(a["historical_performance_eligible"])
    if type(a["quality"]) is not list or len(a["quality"]) > 128:
        _fail("quality_budget")
    for item in a["quality"]:
        _keys(item, "code severity blocks_candidate")
        _text(item["code"], limit=96)
        _enum(item["severity"], ("info", "warning", "error"))
        _bool(item["blocks_candidate"])
    g = r["geometry_receipt"]
    _keys(g, "version config whole_geometry_sha256 sample_payload_sha256 cell_payload_sha256 "
             "scope_mapping_evidence_sha256 processing")
    _text(g["version"])
    _keys(g["config"], "grid_m smoothing_window_m max_raw_gap_m max_route_m")
    for v in g["config"].values():
        _number(v)
    for k in ("whole_geometry_sha256", "sample_payload_sha256", "cell_payload_sha256", "scope_mapping_evidence_sha256"):
        _digest(g[k])
    _enum(g["processing"], ("unchanged_whole_route_canonical_slice", "repaired_or_unknown"))
    p = r["quality_policy"]
    _keys(p, "minimum_horizontal_support_m max_recording_gap_s source")
    _number(p["minimum_horizontal_support_m"], positive=True)
    _number(p["max_recording_gap_s"], positive=True)
    _text(p["source"])
    t = r["terrain_context"]
    _keys(t, "surface technicity gait source")
    for k in ("surface", "technicity", "source"):
        _text(t[k], optional=True)
    _enum(t["gait"], ("walk", "run", "mixed", "unknown"))
    return start, end


def _observe(r, asof, occurrence):
    start, completed = _validate(r)
    reasons, warnings, samples = [], [], []
    def exclude(code):
        if code not in reasons:
            reasons.append(code)
    raw = r["samples"]
    duplicates = []
    previous = None
    for s in raw:
        if previous is not None:
            if s["source_index"] <= previous["source_index"]:
                exclude("source_indices_not_strictly_ordered")
            elif s["source_index"] != previous["source_index"] + 1:
                exclude("original_source_samples_missing")
            if s["elapsed_s"] < previous["elapsed_s"]:
                exclude("timestamps_out_of_order")
            if s["horizontal_m"] < previous["horizontal_m"]:
                exclude("source_chainage_out_of_order")
            if s["elapsed_s"] == previous["elapsed_s"]:
                if all(s[k] == previous[k] for k in ("horizontal_m", "raw_elevation_m")):
                    duplicates.append(s["source_index"])
                    previous = s
                    continue
                exclude("conflicting_duplicate_timestamp")
            dt = s["elapsed_s"] - previous["elapsed_s"]
            dx = s["horizontal_m"] - previous["horizontal_m"]
            dz = s["raw_elevation_m"] - previous["raw_elevation_m"]
            if dt > r["quality_policy"]["max_recording_gap_s"]:
                exclude("recording_gap_exceeds_declared_policy")
            if dx <= r["quality_policy"]["minimum_horizontal_support_m"] and dz != 0:
                exclude("vertical_change_without_horizontal_support")
        samples.append(s)
        previous = s
    elapsed = raw[-1]["elapsed_s"] - raw[0]["elapsed_s"]
    if elapsed <= 0:
        exclude("nonpositive_elapsed_duration")
    try:
        abs_start = start + timedelta(seconds=raw[0]["elapsed_s"])
        abs_end = start + timedelta(seconds=raw[-1]["elapsed_s"])
    except (OverflowError, ValueError):
        _fail("timestamp_range")
    if abs_end > completed:
        exclude("segment_after_recording_completion")
    if completed >= asof:
        exclude("recording_not_before_as_of")
    g = r["geometry_receipt"]
    if g["version"] != GEOMETRY_VERSION or g["config"] != GEOMETRY_CONFIG:
        exclude("canonical_geometry_version_or_config_mismatch")
    if g["processing"] != "unchanged_whole_route_canonical_slice":
        exclude("geometry_not_unchanged_canonical_slice")
    if g["sample_payload_sha256"] != payload_sha256(raw) or g["cell_payload_sha256"] != payload_sha256(r["cells"]):
        exclude("payload_checksum_mismatch")
    cells = r["cells"]
    exact_boundaries = (cells[0]["start_horizontal_m"] == raw[0]["horizontal_m"] and
                        cells[-1]["end_horizontal_m"] == raw[-1]["horizontal_m"])
    if not exact_boundaries:
        exclude("time_geometry_boundary_not_exact")
    direction = 1 if r["direction"] == "up" else -1
    horizontal, distance, steep_distance, previous_cell = [], [], [], None
    geometry_valid = True
    signed_deltas = []
    for c in cells:
        dx = c["end_horizontal_m"] - c["start_horizontal_m"]
        dz = c["elevation_end_m"] - c["elevation_start_m"]
        if dx <= 0 or c["end_horizontal_m"] > GEOMETRY_CONFIG["max_route_m"]:
            exclude("nonpositive_or_out_of_range_cell_horizontal")
            geometry_valid = False
            continue
        if previous_cell is not None and (previous_cell["end_horizontal_m"] != c["start_horizontal_m"] or
                                          previous_cell["elevation_end_m"] != c["elevation_start_m"]):
            exclude("canonical_cells_discontinuous")
            geometry_valid = False
        if dx <= r["quality_policy"]["minimum_horizontal_support_m"]:
            exclude("cell_horizontal_support_insufficient")
        grade = dz / dx
        if not math.isfinite(grade):
            exclude("grade_not_finite")
            geometry_valid = False
        elif grade * direction <= 0:
            exclude("mixed_or_wrong_direction")
        elif grade * direction <= DOMAIN + 1e-10:
            exclude("not_entirely_steep")
        ds = math.hypot(dx, dz)
        horizontal.append(dx)
        distance.append(ds)
        signed_deltas.append(dz)
        if math.isfinite(grade) and grade * direction > DOMAIN + 1e-10:
            steep_distance.append(ds)
        previous_cell = c
    net = cells[-1]["elevation_end_m"] - cells[0]["elevation_start_m"]
    vertical = net * direction
    if vertical <= 0:
        exclude("nonpositive_directional_vertical")
    moving = None
    m = r["moving_evidence"]
    if m["kind"] == "unknown":
        exclude("segment_moving_time_unknown")
    elif elapsed > 0:
        moving = m["duration_s"] if m["kind"] == "segment_moving" else elapsed - m["duration_s"]
        if moving <= 0 or moving > elapsed:
            exclude("segment_moving_time_conflict")
            moving = None
    timing_sound = not any(x in reasons for x in ("source_indices_not_strictly_ordered", "timestamps_out_of_order",
                           "source_chainage_out_of_order", "conflicting_duplicate_timestamp", "nonpositive_elapsed_duration",
                           "segment_after_recording_completion"))
    measurement_sound = timing_sound and geometry_valid and exact_boundaries and vertical > 0 and "payload_checksum_mismatch" not in reasons
    elapsed_rate = _rate(vertical, elapsed) if measurement_sound else None
    moving_rate = _rate(vertical, moving) if measurement_sound and moving is not None else None
    a = r["source_assessment"]
    if a["status"] != "usable" or not a["historical_performance_eligible"] or a["upstream_source"] is None:
        exclude("source_assessment_ineligible")
    if any(q["severity"] == "error" or q["blocks_candidate"] for q in a["quality"]):
        exclude("source_quality_blocks_candidate")
    if r["identity"]["provider"] == "Intervals.icu" and (a["kind"] != "normalized_history" or a["upstream_source"] != "ZEPP" or a["normalizer_schema"] != "intervals-history-v1"):
        exclude("existing_intervals_source_policy_not_met")
    if r["identity"]["recording_key"] is None:
        exclude("stable_recording_identity_unknown")
    q = r["qualification"]
    if q["selected_classification"] not in ("race", "benchmark") or not q["high_effort_reference_confirmed"]:
        exclude("effort_not_qualified_benchmark")
    if not q["actual_history_confirmed"]:
        exclude("actual_history_unconfirmed")
    if r["direction"] == "down" and r["terrain_context"]["technicity"] is None:
        warnings.append("downhill_technicity_unknown_no_target_transfer_validation")
    if duplicates:
        warnings.append("identical_time_samples_deduplicated_for_diagnostics")
    d = _sum(distance)
    return dict(occurrence_index=occurrence, identity=deepcopy(r["identity"]),
                direction=r["direction"], absolute_start=abs_start.isoformat(), absolute_end=abs_end.isoformat(),
                original_sample_bounds=[raw[0]["source_index"], raw[-1]["source_index"]],
                original_elapsed_bounds_s=[raw[0]["elapsed_s"], raw[-1]["elapsed_s"]],
                input_sample_count=len(raw), unique_time_sample_count=len(samples), duplicate_sample_indices=duplicates,
                elapsed_s=elapsed if elapsed > 0 else None, moving_s=moving, signed_net_vertical_m=net,
                directional_net_vertical_m=vertical, raw_endpoint_vertical_m=raw[-1]["raw_elevation_m"]-raw[0]["raw_elevation_m"],
                canonical_horizontal_m=_sum(horizontal), canonical_distance_m=d,
                steep_direction_distance_m=_sum(steep_distance),
                steep_direction_distance_fraction=_sum(steep_distance)/d if d > 0 else None,
                observed_elapsed_rate_m_h=elapsed_rate, observed_moving_rate_m_h=moving_rate,
                measurement_kind="canonical_net_vertical_over_exact_original_time_bounds",
                structural_candidate_eligible=not reasons, exclusions=reasons, warnings=warnings,
                qualification=deepcopy(q), moving_evidence=deepcopy(m), terrain_context=deepcopy(r["terrain_context"]),
                source_assessment=deepcopy(a), geometry_receipt=deepcopy(g), quality_policy=deepcopy(r["quality_policy"]))


def _semantic_digest(r):
    v = deepcopy(r)
    # Export aliases must not get independent votes. Retain numerical values,
    # source assessment, qualification and evidence semantics in conflict checks.
    del v["identity"]["export_id"]
    del v["source_assessment"]["source_snapshot_sha256"]
    return payload_sha256(v)


def observe_selected_segments(records: list[SegmentReceipt], *, forecast_as_of: str,
                              required_directions: tuple[str, ...]) -> dict:
    """All supplied records are explicitly selected. Any failure blocks the mean.

    Pool nonoverlapping segments within recording/direction by Σvertical/Σmoving,
    then arithmetic-mean the recording rates with equal recording weights.
    """
    base = dict(schema_version=SCHEMA_VERSION, method_version=METHOD_VERSION,
                status="insufficient_data", trust_status="caller_supplied_receipts_not_authenticated",
                usable_by_hybrid=False, scenario_confirmation=None,
                calibration_status="historical_observations_only_not_current_race_ability_not_externally_validated",
                aggregation_policy="within_recording_ratio_of_sums_then_equal_weight_arithmetic_mean_across_recordings",
                candidate_rates_m_h=None, records=[], activities=[], duplicates=[], errors=[],
                forecast_as_of=forecast_as_of, required_directions=list(required_directions) if type(required_directions) is tuple else [],
                uncertainty_interval=None, accuracy_claim=None,
                warnings=["Checksums verify supplied payload consistency, not ownership, terrain, effort or rights.",
                          "No target, speed cap, fatigue, sleep, recency or default vertical-rate coefficient is fitted.",
                          "Production use requires a trusted source adapter, source/geometry review and explicit target-scenario confirmation.",
                          "Arithmetic aggregation is a transparent provisional statistical policy, not an empirically validated estimator."])
    try:
        asof = _instant(forecast_as_of)
        if type(required_directions) is not tuple or not required_directions or len(required_directions) > 2:
            _fail("required_directions_invalid")
        for direction in required_directions:
            _enum(direction, ("up", "down"))
        if len(set(required_directions)) != len(required_directions):
            _fail("required_directions_invalid")
        if type(records) is not list or len(records) > MAX_SEGMENTS:
            _fail("segment_budget")
        if not records:
            _fail("empty_selection")
        count_samples = count_cells = 0
        for r in records:
            if type(r) is not dict or type(r.get("samples")) is not list or type(r.get("cells")) is not list:
                _fail("schema_invalid")
            count_samples += len(r["samples"])
            count_cells += len(r["cells"])
        if count_samples > MAX_SAMPLES or count_cells > MAX_CELLS:
            _fail("aggregate_sample_or_cell_budget")
        for index, r in enumerate(records):
            try:
                observation = _observe(r, asof, index)
                base["records"].append(observation)
            except ContractError as e:
                base["records"].append(dict(occurrence_index=index, structural_candidate_eligible=False,
                                            exclusions=[e.code], observed_elapsed_rate_m_h=None, observed_moving_rate_m_h=None))
        base["supplied_occurrence_count"] = len(records)
        observations = base["records"]
        unique = []
        by_bounds, recording_starts, starts_to_keys, recording_geometry, recording_intervals = {}, {}, {}, {}, {}
        subjects = set()
        for index, o in enumerate(observations):
            if "identity" not in o:
                continue
            r, i = records[index], o["identity"]
            subjects.add(i["subject_namespace"])
            key = (i["provider"], i["subject_namespace"], i["recording_key"])
            start = _instant(r["recording_started_at"]).isoformat()
            if key in recording_starts and recording_starts[key] != start:
                base["errors"].append(dict(code="same_recording_identity_conflicting_start", occurrence_index=index))
            recording_starts[key] = start
            geometry_identity = (r["geometry_receipt"]["whole_geometry_sha256"],
                                 _instant(r["recording_completed_at"]).isoformat())
            if key in recording_geometry and recording_geometry[key] != geometry_identity:
                base["errors"].append(dict(code="same_recording_geometry_or_completion_conflict", occurrence_index=index))
            recording_geometry[key] = geometry_identity
            completion = geometry_identity[1]
            for other_key, (other_start, other_completion) in recording_intervals.items():
                if key != other_key and key[1] == other_key[1] and start < other_completion and other_start < completion:
                    base["errors"].append(dict(code="possible_same_recording_overlapping_full_intervals", occurrence_index=index))
            recording_intervals[key] = (start, completion)
            alias_key = (i["subject_namespace"], start)
            if alias_key in starts_to_keys and starts_to_keys[alias_key] != key:
                base["errors"].append(dict(code="possible_same_recording_different_identity", occurrence_index=index))
            starts_to_keys[alias_key] = key
            bounds = (key, o["absolute_start"], o["absolute_end"])
            semantic = _semantic_digest(r)
            if bounds in by_bounds:
                old_index, old_semantic = by_bounds[bounds]
                if old_semantic != semantic:
                    base["errors"].append(dict(code="duplicate_segment_conflict", occurrence_index=index, other_occurrence=old_index))
                else:
                    base["duplicates"].append(dict(occurrence_index=index, duplicate_of=old_index,
                                                   reason="same_recording_same_segment_export_alias"))
                continue
            by_bounds[bounds] = (index, semantic)
            for other_index, other_key in unique:
                other = observations[other_index]
                overlaps = o["absolute_start"] < other["absolute_end"] and other["absolute_start"] < o["absolute_end"]
                if key[1] == other_key[1] and overlaps:
                    code = "overlapping_selected_segments" if key == other_key else "possible_same_recording_overlapping_absolute_times"
                    base["errors"].append(dict(code=code, occurrence_index=index, other_occurrence=other_index))
                elif key == other_key:
                    earlier_index, later_index = (other_index, index) if other["absolute_end"] <= o["absolute_start"] else (index, other_index)
                    earlier, later = records[earlier_index], records[later_index]
                    a, b = earlier["samples"][-1], later["samples"][0]
                    if a["horizontal_m"] > b["horizontal_m"] or a["source_index"] > b["source_index"]:
                        base["errors"].append(dict(code="same_recording_segment_order_conflict", occurrence_index=index, other_occurrence=other_index))
                    if observations[earlier_index]["absolute_end"] == observations[later_index]["absolute_start"]:
                        if a != b or earlier["cells"][-1]["elevation_end_m"] != later["cells"][0]["elevation_start_m"]:
                            base["errors"].append(dict(code="adjacent_segments_boundary_conflict", occurrence_index=index, other_occurrence=other_index))
            unique.append((index, key))
        if len(subjects) > 1:
            base["errors"].append(dict(code="mixed_subjects"))
        for o in observations:
            if not o["structural_candidate_eligible"]:
                base["errors"].append(dict(code="selected_segment_ineligible", occurrence_index=o["occurrence_index"], reasons=o["exclusions"]))
        base["unique_segment_count"] = len(unique)
        groups = {}
        for index, key in unique:
            o = observations[index]
            if o["structural_candidate_eligible"]:
                groups.setdefault((key, o["direction"]), []).append(o)
        # Per-recording outputs are partial diagnostics until the entire selected
        # set passes. They never imply that ineligible selections were dropped.
        for (key, direction), rows in sorted(groups.items(), key=lambda item: str(item[0])):
            vertical = _sum(o["directional_net_vertical_m"] for o in rows)
            moving = _sum(o["moving_s"] for o in rows)
            base["activities"].append(dict(recording_key=list(key), direction=direction,
                segment_occurrences=[o["occurrence_index"] for o in rows], selected_vertical_m=vertical,
                selected_moving_s=moving, selected_elapsed_s=_sum(o["elapsed_s"] for o in rows),
                selected_horizontal_m=_sum(o["canonical_horizontal_m"] for o in rows),
                selected_distance_m=_sum(o["canonical_distance_m"] for o in rows),
                rate_m_h=_rate(vertical, moving), role="partial_diagnostic_until_all_selected_pass",
                whole_activity_direction_coverage_fraction=None))
        for direction in required_directions:
            if not any(a["direction"] == direction for a in base["activities"]):
                base["errors"].append(dict(code="required_direction_missing", direction=direction))
        if base["errors"]:
            return base
        rates = {"up": None, "down": None}
        for direction in ("up", "down"):
            rows = [a for a in base["activities"] if a["direction"] == direction]
            if rows:
                n = len(rows)
                rates[direction] = _sum(a["rate_m_h"] / n for a in rows)
                if rates[direction] <= 0:
                    _fail("numeric_range")
                for a in rows:
                    a["equal_activity_weight"] = 1 / n
                    a["role"] = "candidate_contributor_not_authorized_for_model_use"
        base["candidate_rates_m_h"] = rates
        base["status"] = "structural_candidate_only"
        return base
    except ContractError as e:
        base["errors"].append(dict(code=e.code))
        base["candidate_rates_m_h"] = None
        return base
