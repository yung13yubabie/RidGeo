"""Bounded UI projection of the frozen timed-GPX producer, never a new model.

The producer still constructs its full result in Python. This adapter reads it
without copying its source series or receipt trees and serializes only the
allowlisted compact projection when checking the transfer budget. No timestamps,
geometry, elapsed durations, vertical rates, or moving classifications are
computed here. All arithmetic below is limited to bookkeeping counts.
"""
from __future__ import annotations

import json
import math

from .timed_gpx_producer import inspect_timed_gpx

COMPACT_SCHEMA_VERSION = "timed-gpx-compact-observation/0.1"
MAX_GROUP_DETAILS = 64
MAX_DIAGNOSTIC_DETAILS = 128
MAX_COMPACT_JSON_BYTES = 256 * 1024


class CompactProjectionError(ValueError):
    """A bounded fail-closed error; never include source data in its message."""

    def __init__(self, code):
        super().__init__(code)
        self.code = code


def _clone(value):
    """Clone only a previously allowlisted small tree, checking JSON finiteness."""
    if value is None or type(value) in (str, bool, int):
        return value
    if type(value) is float:
        if not math.isfinite(value):
            raise CompactProjectionError("compact_nonfinite_value")
        return value
    if type(value) is list:
        return [_clone(item) for item in value]
    if type(value) is dict and all(type(k) is str for k in value):
        return {key: _clone(item) for key, item in value.items()}
    raise CompactProjectionError("compact_schema_invalid")


def _fields(value, names):
    return {key: _clone(value[key]) for key in names.split() if key in value}


def _require_safe(value, fields):
    for key, expected in fields.items():
        if key not in value or value[key] is not expected:
            raise CompactProjectionError("compact_model_invariant_violation")


def _bounded_details(rows, fields, *, prefix, limit=MAX_DIAGNOSTIC_DETAILS):
    """Detail omission is explicit; this is never used to truncate group rows."""
    total = len(rows)
    detail = [_fields(row, fields) for row in rows[:limit]]
    return detail, {
        prefix + "occurrence_count": total,
        prefix + "detail_count": len(detail),
        prefix + "omitted_count": total - len(detail),
        prefix + "detail_limit": limit,
        prefix + "truncated": total > len(detail),
    }


def _geometry(source):
    if source is None:
        return None
    result = _fields(source, "geometry_version geometry_sha256 route_sha256 distance_m "
                     "horizontal_distance_m ascent_m descent_m elevation_complete "
                     "blocked source_points segment_count config")
    result["quality"], counts = _bounded_details(
        source["quality"], "code severity message segments gap_m count missing_points cells",
        prefix="quality_")
    result.update(counts)
    return result


def _observation_summary(source):
    if source is None:
        return None
    _require_safe(source, {"candidate_rates_m_h": None, "usable_by_hybrid": False})
    result = _fields(source, "schema_version method_version status trust_status "
                     "usable_by_hybrid scenario_confirmation calibration_status "
                     "aggregation_policy candidate_rates_m_h forecast_as_of "
                     "required_directions uncertainty_interval accuracy_claim warnings "
                     "supplied_occurrence_count unique_segment_count")
    result["record_count"] = len(source["records"])
    result["activity_count"] = len(source["activities"])
    result["duplicate_count"] = len(source["duplicates"])
    result["errors"], counts = _bounded_details(
        source["errors"], "code occurrence_index other_occurrence direction reasons",
        prefix="error_")
    result.update(counts)
    return result


def _observation_record(source):
    if source is None:
        return None
    _require_safe(source, {"observed_moving_rate_m_h": None,
                          "structural_candidate_eligible": False})
    if source.get("moving_s") is not None:
        raise CompactProjectionError("compact_model_invariant_violation")
    result = _fields(source, "occurrence_index direction absolute_start absolute_end "
                     "original_sample_bounds original_elapsed_bounds_s input_sample_count "
                     "unique_time_sample_count elapsed_s moving_s signed_net_vertical_m "
                     "directional_net_vertical_m raw_endpoint_vertical_m canonical_horizontal_m "
                     "canonical_distance_m steep_direction_distance_m "
                     "steep_direction_distance_fraction observed_elapsed_rate_m_h "
                     "observed_moving_rate_m_h measurement_kind structural_candidate_eligible "
                     "exclusions warnings")
    result["duplicate_sample_count"] = len(source.get("duplicate_sample_indices", ()))
    return result


def _group(source, records, times):
    result = _fields(source, "group_index direction first_cell last_cell start_horizontal_m "
                     "end_horizontal_m original_sample_bounds covered_horizontal_m "
                     "uncovered_horizontal_m receipt_index exclusions boundary_time_convention "
                     "exact_elapsed_s")
    bounds = source["original_sample_bounds"]
    result["original_time_bounds"] = None
    if bounds is not None:
        if (type(bounds) is not list or len(bounds) != 2 or
                any(type(index) is not int or not 0 <= index < len(times) for index in bounds)):
            raise CompactProjectionError("compact_source_bounds_invalid")
        # Select only the two already-parsed source instants. Never parse, adjust,
        # interpolate, or serialize a source time object or its raw text.
        result["original_time_bounds"] = {
            "first": times[bounds[0]]["time"]["utc"],
            "last": times[bounds[1]]["time"]["utc"],
        }
    result["observation"] = _observation_record(records.get(source["receipt_index"]))
    return result


def _json_size(value):
    # This receives only the already-projected compact tree, never the producer.
    # Use these serialization settings at the transport boundary too.
    return len(json.dumps(value, ensure_ascii=True, allow_nan=False,
                          separators=(",", ":")).encode("ascii"))


def _withhold_details(result):
    """Make transfer failure explicit, preserving complete totals and null safety."""
    result["status"] = "source_diagnostics_only"
    result["projection_status"] = "response_budget_exceeded"
    result["error_code"] = "compact_response_budget_exceeded"
    result["steep_groups"] = []
    result["displayed_group_count"] = 0
    result["omitted_group_count"] = result["group_count"]
    result["displayable_elapsed_rate_count"] = 0
    result["diagnostics"] = []
    result["diagnostic_detail_count"] = 0
    result["diagnostic_omitted_count"] = result["diagnostic_occurrence_count"]
    result["diagnostics_truncated"] = result["diagnostic_occurrence_count"] > 0
    for container, name, prefix in ((result["geometry"], "quality", "quality_"),
                                     (result["observations"], "errors", "error_")):
        if container is not None:
            container[name] = []
            container[prefix + "detail_count"] = 0
            container[prefix + "omitted_count"] = container[prefix + "occurrence_count"]
            container[prefix + "truncated"] = container[prefix + "occurrence_count"] > 0
    return result


def _project_timed_gpx(source):
    """Internal, pure projection; useful for checking the original-result contract."""
    _require_safe(source, {"moving_time_s": None, "actual_history_confirmed": False,
                          "historical_calibration_ready": False, "usable_by_hybrid": False,
                          "candidate_rates_m_h": None, "recording_identity": None})
    result = _fields(source, "schema_version status error_code source_sha256 source_kind "
                     "dependency_hashes time_basis moving_time_s actual_history_confirmed "
                     "historical_calibration_ready usable_by_hybrid candidate_rates_m_h "
                     "recording_identity warnings")
    result.update(compact_schema_version=COMPACT_SCHEMA_VERSION,
                  producer_status=source["status"], producer_error_code=source["error_code"],
                  projection_status="complete", json_byte_limit=MAX_COMPACT_JSON_BYTES)
    bounds = source["observed_file_time_bounds"]
    result["observed_file_time_bounds"] = None if bounds is None else _fields(
        bounds, "first last elapsed_s scope")
    # Iterate the original list without constructing another list of samples.
    times = source["original_time_series"]
    counts = dict(total=len(times), valid=0, omitted=0, invalid=0,
                  elapsed_encoded=0, elapsed_unknown=0)
    for row in times:
        state = row["time"]["state"]
        if state not in ("valid", "omitted", "invalid"):
            raise CompactProjectionError("compact_time_state_invalid")
        counts[state] += 1
        counts["elapsed_unknown" if row["elapsed_s"] is None else "elapsed_encoded"] += 1
    result["time_counts"] = counts
    result["geometry"] = _geometry(source["geometry"])
    result["diagnostics"] = [_fields(row, "code severity blocks_candidate source_index")
                             for row in source["diagnostics"][:MAX_DIAGNOSTIC_DETAILS]]
    total = source["diagnostic_occurrence_count"]
    result.update(diagnostic_occurrence_count=total,
                  diagnostic_detail_count=len(result["diagnostics"]),
                  diagnostic_omitted_count=total-len(result["diagnostics"]),
                  diagnostic_detail_limit=MAX_DIAGNOSTIC_DETAILS,
                  diagnostics_truncated=source["diagnostics_truncated"] or
                  total > len(result["diagnostics"]))
    observation = source["observations"]
    result["observations"] = _observation_summary(observation)
    rows = [] if observation is None else observation["records"]
    record_map = {}
    for row in rows:
        index = row["occurrence_index"]
        if (type(index) is not int or not 0 <= index < len(source["receipts"]) or
                index in record_map):
            raise CompactProjectionError("compact_occurrence_mapping_invalid")
        record_map[index] = row
    group_count = len(source["steep_groups"])
    result.update(group_count=group_count, group_detail_limit=MAX_GROUP_DETAILS,
                  group_budget_exceeded=group_count > MAX_GROUP_DETAILS,
                  receipt_count=len(source["receipts"]), observation_record_count=len(rows))
    if group_count > MAX_GROUP_DETAILS:
        # r2's group-budget branch can retain a full diagnostic-only group list.
        # Its true total is preserved; none is represented as a partial success.
        result["projection_status"] = "group_budget_exceeded"
        result["steep_groups"] = []
    else:
        result["steep_groups"] = [_group(group, record_map, times)
                                  for group in source["steep_groups"]]
    result["displayed_group_count"] = len(result["steep_groups"])
    result["omitted_group_count"] = group_count - result["displayed_group_count"]
    result["displayable_elapsed_rate_count"] = sum(
        group["observation"] is not None and
        type(group["observation"].get("observed_elapsed_rate_m_h")) in (int, float)
        for group in result["steep_groups"])
    if _json_size(result) > MAX_COMPACT_JSON_BYTES:
        _withhold_details(result)
        if _json_size(result) > MAX_COMPACT_JSON_BYTES:
            # An unexpected dependency contract expansion must not leak an
            # unbounded response; the runtime can show this stable error code.
            raise CompactProjectionError("compact_response_budget_exceeded")
    return result


def inspect_compact_timed_gpx(data: bytes, *, forecast_as_of: str) -> dict:
    """Call frozen r2, then discard its full trees before any JSON transfer.

    Only GPX bytes and an explicit as-of instant are accepted. Request-envelope
    key, Base64 and byte-budget validation belongs to the caller; r2 independently
    validates the bytes and as-of. Unknown keyword arguments fail as TypeError.
    """
    source = inspect_timed_gpx(data, forecast_as_of=forecast_as_of)
    return _project_timed_gpx(source)
