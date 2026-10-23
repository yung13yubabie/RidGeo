"""Read-only route-quality diagnosis; no repair, terrain truth or prediction.

Import alongside the hash-verified shared admission and frozen core. All distances
and canonical cells come from that core. A record always refers to the supplied
byte hash and source indices, never to a silently cleaned or joined GPX.
"""
from bisect import bisect_left, bisect_right
from dataclasses import asdict
import math

from gpx_admission import _read_annotations
from trail_planner.gpx import InputError, parse_gpx
from trail_planner.geometry import GEOMETRY_VERSION, build_geometry, haversine
from hybrid_trail_scenario import analyze_geometry

SCHEMA_VERSION = "route-quality-diagnostics/1.0"
DIAGNOSTIC_VERSION = "raw-structure-canonical-support-v2"
DOMAIN = 0.45
CORE_ZERO_HORIZONTAL_M = 1e-6
MAX_DIAGNOSTIC_RECORDS = 10_000
PAGE_SIZE = 25


def compact_diagnosis(diagnosis: dict, page: int = 0) -> dict:
    """Bound the engine response without hiding or truncating complete totals.

    Full evidence remains only in the local Python worker. Rows are source-index
    clues, not recovered measurements. One page never copies route polylines.
    """
    if isinstance(page, bool) or not isinstance(page, int) or page < 0:
        raise InputError("invalid_quality_page", "來源檢查頁碼有誤。")
    families = ("missing_elevation_runs", "exact_coordinate_conflicts",
                "horizontal_gap_candidates", "core_vertical_discontinuities",
                "vertical_reversal_candidates")
    totals = {family: sum(len(segment[family]) for segment in diagnosis["segments"])
              for family in families}
    totals["canonical_steep_runs"] = (len(diagnosis["canonical_domain"]["runs"])
                                       if diagnosis["canonical_domain"]["runs"] is not None else None)
    total = sum(value for value in totals.values() if value is not None)
    if total > MAX_DIAGNOSTIC_RECORDS:
        raise InputError("diagnostic_too_many_findings", "來源檢查項目超過上限，未回傳不完整結果。")
    if page >= max(1, math.ceil(total / PAGE_SIZE)):
        raise InputError("quality_page_out_of_range", "來源檢查頁碼超出範圍。")
    start, stop, rows, ordinal = page * PAGE_SIZE, (page + 1) * PAGE_SIZE, [], 0

    def take(family, item, source_range, segment):
        nonlocal ordinal
        if start <= ordinal < stop:
            row = {"ordinal": ordinal, "family": family,
                   "segment_index": item["segment_index"],
                   "source_point_range": source_range,
                   "segment_source_point_range": [segment["source_point_offset"],
                                                  segment["source_point_offset"] + segment["point_count"] - 1]}
            if family == "canonical_steep_runs":
                # Preserve the existing core's quantitative evidence in the
                # bounded page. These are modeled source grades, not measured
                # terrain, a repair proposal, or an independent noise verdict.
                row["grade_evidence"] = {
                    "schema_version": "canonical-steep-source-support/1.0",
                    **{key: item[key] for key in (
                        "kind", "start_m", "end_m", "horizontal_m", "distance_m",
                        "signed_vertical_difference_m", "min_grade", "max_grade",
                        "consecutive_cells", "overlapping_raw_reversal_candidates")},
                    "terrain_truth": "not_independently_verified"}
            rows.append(row)
        ordinal += 1

    for segment in diagnosis["segments"]:
        for family in families:
            for finding in segment[family]:
                take(family, finding, finding["source_point_range"], segment)
    for run in diagnosis["canonical_domain"]["runs"] or []:
        take("canonical_steep_runs", run, run["source_support"]["source_point_range"], diagnosis["segments"][0])
    assert ordinal == total
    canonical = {key: value for key, value in diagnosis["canonical_domain"].items() if key != "runs"}
    canonical["run_count"] = totals["canonical_steep_runs"]
    return {"schema_version": "route-quality-page/1.0",
            "diagnostic_version": diagnosis["diagnostic_version"],
            "source": diagnosis["source"], "readiness": diagnosis["readiness"],
            "summary": diagnosis["summary"], "canonical_domain": canonical,
            "core": {key: diagnosis["core"][key] for key in
                     ("geometry_version", "geometry_sha256", "blocked", "elevation_complete")},
            "finding_totals": totals,
            "page": {"index": page, "size": PAGE_SIZE, "total_findings": total,
                     "has_previous": page > 0, "has_next": stop < total, "rows": rows},
            "terrain_truth": "not_independently_verified",
            "scope": "original_source_readonly_not_repair_consent_or_prediction_validation"}


def diagnose_route(original_bytes: bytes) -> dict:
    """Return deterministic JSON-safe evidence, or the existing InputError.

    Missing elevation makes the whole current canonical route grade unknown.
    Multiple track segments remain disconnected and cannot produce route-level
    canonical grades. Raw findings still cover every segment, independently.
    """
    _, _, descriptors, _, _, _ = _read_annotations(original_bytes)
    route = parse_gpx(original_bytes)
    if len(descriptors) != len(route.segments):
        raise InputError("invalid_detail_structure", "軌跡段與來源描述不一致。")
    geometry = build_geometry(route)
    record_count = 0

    def add(rows, row):
        nonlocal record_count
        record_count += 1
        if record_count > MAX_DIAGNOSTIC_RECORDS:
            raise InputError("diagnostic_too_many_findings", "診斷記錄超過資源上限，未回傳不完整結果。")
        rows.append(row)

    segments, offset, all_missing, all_conflicts, all_gaps, all_reversals = [], 0, 0, 0, 0, 0
    all_vertical_discontinuities = 0
    raw_total = 0.0
    first_retained_x, first_retained_indices = [], []
    first_reversal_indices = []
    for segment_index, (points, descriptor) in enumerate(zip(route.segments, descriptors)):
        edges, raw_x, core_x, retained_x, retained_indices = [], [0.0], 0.0, [0.0], [0]
        for i, (a, b) in enumerate(zip(points, points[1:])):
            dx = haversine(a, b)
            dz = None if a.ele is None or b.ele is None else b.ele - a.ele
            grade = dz / dx if dz is not None and dx >= CORE_ZERO_HORIZONTAL_M else None
            edges.append((dx, dz, grade))
            raw_x.append(raw_x[-1] + dx)
            if dx >= CORE_ZERO_HORIZONTAL_M:
                core_x += dx
                retained_x.append(core_x)
                retained_indices.append(i + 1)

        def location(first, last):
            return {"segment_index": segment_index,
                    "segment_point_range": [first, last],
                    "source_point_range": [offset + first, offset + last],
                    "raw_horizontal_range_m": [raw_x[first], raw_x[last]],
                    "start_coordinate": [points[first].lat, points[first].lon],
                    "end_coordinate": [points[last].lat, points[last].lon]}

        missing, conflicts, gaps, reversals, coincident = [], [], [], [], []
        i = 0
        while i < len(points):
            if points[i].ele is not None:
                i += 1
                continue
            end = i + 1
            while end < len(points) and points[end].ele is None:
                end += 1
            left, right = max(0, i - 1), min(len(points) - 1, end)
            bracket_dz = (points[right].ele - points[left].ele
                          if points[left].ele is not None and points[right].ele is not None else None)
            def anchor(index):
                p = points[index]
                return {"segment_index": segment_index, "segment_point_index": index,
                        "source_point_index": offset + index, "lat": p.lat, "lon": p.lon,
                        "elevation_m": p.ele, "raw_horizontal_m": raw_x[index]}
            add(missing, {**location(i, end - 1), "missing_points": end - i,
                          "affected_edge_point_range": [left, right],
                          "affected_horizontal_m": raw_x[right] - raw_x[left],
                          "vertical_difference_m": None,
                          "known_anchor_vertical_difference_m": bracket_dz,
                          "left_anchor": anchor(i - 1) if i > 0 else None,
                          "right_anchor": anchor(end) if end < len(points) else None,
                          "anchor_horizontal_m": raw_x[right] - raw_x[left] if bracket_dz is not None else None,
                          "left_anchor_to_first_missing_horizontal_m": raw_x[i] - raw_x[left] if i > 0 else None,
                          "last_missing_to_right_anchor_horizontal_m": raw_x[right] - raw_x[end - 1] if end < len(points) else None,
                          "endpoint_missing": i == 0 or end == len(points)})
            all_missing += end - i
            i = end
        i = 0
        while i < len(points):
            end = i + 1
            while end < len(points) and (points[end].lat, points[end].lon) == (points[i].lat, points[i].lon):
                end += 1
            known = [p.ele for p in points[i:end] if p.ele is not None]
            if len(known) > 1 and min(known) != max(known):
                add(conflicts, {**location(i, end - 1), "point_count": end - i,
                                "horizontal_m": 0.0, "known_elevation_points": len(known),
                                "elevation_min_m": min(known), "elevation_max_m": max(known),
                                "elevation_span_m": max(known) - min(known),
                                "first_to_last_vertical_difference_m": (
                                    points[end - 1].ele - points[i].ele
                                    if points[end - 1].ele is not None and points[i].ele is not None else None),
                                "missing_points_in_group": end - i - len(known),
                                "interpretation": "adjacent_exact_coordinate_group_with_conflicting_recorded_heights"})
            i = end
        for i, (dx, dz, grade) in enumerate(edges):
            if dx > geometry.config.max_raw_gap_m:
                add(gaps, {**location(i, i + 1), "horizontal_m": dx,
                           "vertical_difference_m": dz,
                           "interpretation": "sparse_or_jump_candidate_existing_core_policy"})
            if dx < CORE_ZERO_HORIZONTAL_M and dz is not None and abs(dz) > 1e-6:
                add(coincident, {**location(i, i + 1), "horizontal_m": dx,
                                 "vertical_difference_m": dz,
                                 "exact_coordinates": (points[i].lat, points[i].lon) == (
                                     points[i + 1].lat, points[i + 1].lon),
                                 "interpretation": "existing_core_vertical_jump_condition"})
        for i in range(1, len(points) - 1):
            left, right = edges[i - 1], edges[i]
            if (left[2] is not None and right[2] is not None
                    and left[2] * right[2] < 0
                    and abs(left[2]) > DOMAIN + 1e-10 and abs(right[2]) > DOMAIN + 1e-10):
                width = left[0] + right[0]
                interpolated_anchor = points[i - 1].ele + (points[i + 1].ele - points[i - 1].ele) * left[0] / width
                add(reversals, {**location(i - 1, i + 1), "apex_segment_point_index": i,
                                "apex_source_point_index": offset + i,
                                "horizontal_m": width, "left_grade": left[2], "right_grade": right[2],
                                "left_vertical_difference_m": left[1], "right_vertical_difference_m": right[1],
                                "anchor_vertical_difference_m": points[i + 1].ele - points[i - 1].ele,
                                "apex_deviation_from_anchor_line_m": points[i].ele - interpolated_anchor,
                                "interpretation": "structural_reversal_candidate_not_confirmed_elevation_error"})
        if segment_index == 0:
            first_retained_x, first_retained_indices = retained_x, retained_indices
            first_reversal_indices = [r["apex_segment_point_index"] for r in reversals]
        all_conflicts += len(conflicts)
        all_gaps += len(gaps)
        all_reversals += len(reversals)
        all_vertical_discontinuities += len(coincident)
        segment_length = raw_x[-1] if points else 0.0
        raw_total += segment_length
        segments.append({"segment_index": segment_index,
                         "identity": {k: descriptor[k] for k in ("kind", "track_index", "route_index", "segment_index")},
                         "source_point_offset": offset, "point_count": len(points),
                         "raw_horizontal_m": segment_length,
                         "missing_elevation_runs": missing, "exact_coordinate_conflicts": conflicts,
                         "horizontal_gap_candidates": gaps, "core_vertical_discontinuities": coincident,
                         "vertical_reversal_candidates": reversals})
        offset += len(points)

    domain_available = not geometry.blocked and bool(geometry.cells) and geometry.elevation_complete
    canonical = {"status": "available" if domain_available else "unknown",
                 "unavailable_reason": ("core_geometry_blocked" if geometry.blocked else
                                        "missing_elevation_whole_route" if not geometry.elevation_complete else
                                        "no_canonical_cells" if not geometry.cells else None),
                 "scope": "unchanged_whole_route_core_no_partial_known_elevation_reconstruction",
                 "grade_domain": [-DOMAIN, DOMAIN],
                 "route_distance_m": geometry.distance_m if domain_available else None,
                 "out_of_domain_cells": None, "out_of_domain_horizontal_m": None,
                 "out_of_domain_distance_m": None, "out_of_domain_absolute_vertical_m": None,
                 "up_cells": None, "down_cells": None, "runs": None}
    if domain_available:
        # Reuse existing canonical classifications and run boundaries, not a
        # second smoother or polynomial. Point mapping is a conservative envelope.
        analysis = analyze_geometry(geometry)
        boundaries, x = [0.0], 0.0
        for cell in geometry.cells:
            x += cell.horizontal_m
            boundaries.append(x)
        steep_cells = [c for c in geometry.cells if abs(c.grade) > DOMAIN + 1e-10]
        runs = []
        for group in analysis["groups"]:
            first, last = group["first_cell"], group["last_cell"]
            start, end = boundaries[first], boundaries[last + 1]
            half_start = min(geometry.config.smoothing_window_m / 2, start, x - start)
            half_end = min(geometry.config.smoothing_window_m / 2, end, x - end)
            support_start, support_end = max(0.0, start - half_start), min(x, end + half_end)
            a = max(0, bisect_left(first_retained_x, support_start) - 1)
            b = min(len(first_retained_x) - 1, bisect_right(first_retained_x, support_end))
            source_a, source_b = first_retained_indices[a], first_retained_indices[b]
            n_reversals = (bisect_right(first_reversal_indices, source_b)
                           - bisect_left(first_reversal_indices, source_a))
            cells = geometry.cells[first:last + 1]
            add(runs, {**group, "segment_index": 0, "consecutive_cells": last - first + 1,
                       "multiple_adjacent_cells": last > first, "horizontal_m": end - start,
                       "distance_m": group["end_m"] - group["start_m"],
                       "signed_vertical_difference_m": cells[-1].elevation_end_m - cells[0].elevation_start_m,
                       "min_grade": min(c.grade for c in cells), "max_grade": max(c.grade for c in cells),
                       "source_support": {"kind": "conservative_envelope_not_unique_original_point",
                                          "segment_point_range": [source_a, source_b],
                                          "source_point_range": [source_a, source_b],
                                          "core_horizontal_range_m": [support_start, support_end],
                                          "includes_bracketing_points_and_skipped_duplicates": True},
                       "overlapping_raw_reversal_candidates": n_reversals,
                       "terrain_truth": "not_independently_verified"})
        canonical.update(out_of_domain_cells=len(steep_cells),
                         out_of_domain_horizontal_m=math.fsum(c.horizontal_m for c in steep_cells),
                         out_of_domain_distance_m=math.fsum(c.distance_m for c in steep_cells),
                         out_of_domain_absolute_vertical_m=math.fsum(abs(c.elevation_end_m - c.elevation_start_m) for c in steep_cells),
                         up_cells=analysis["categories"]["steep_up"]["cells"],
                         down_cells=analysis["categories"]["steep_down"]["cells"], runs=runs)
    quality_codes = sorted({q["code"] for q in geometry.quality})
    needs_review = bool(all_conflicts or all_gaps or all_reversals or all_vertical_discontinuities)
    status = ("core_geometry_blocked" if geometry.blocked else
              "elevation_unknown" if not geometry.elevation_complete else
              "review_raw_candidates" if needs_review else
              "beyond_current_grade_domain" if canonical["out_of_domain_cells"] else
              "within_current_grade_domain")
    return {"schema_version": SCHEMA_VERSION, "diagnostic_version": DIAGNOSTIC_VERSION,
            "source": {"route_version_sha256": route.sha256, "byte_count": route.byte_count,
                       "point_count": route.point_count, "segment_count": len(route.segments),
                       "point_index_base": 0, "range_endpoints": "inclusive",
                       "original_bytes_modified": False, "derived_gpx_created": False},
            "policy": {"grade_domain": [-DOMAIN, DOMAIN], "grade_unit": "rise_per_horizontal_m_not_degrees",
                       "horizontal_gap_m": geometry.config.max_raw_gap_m,
                       "horizontal_gap_basis": "existing_core_engineering_policy_not_accuracy_threshold",
                       "vertical_reversal_basis": "opposing_adjacent_raw_grades_both_beyond_model_domain_review_only",
                       "vertical_error_threshold_m": None,
                       "persistence_basis": "consecutive_same_direction_canonical_cells_not_terrain_validation",
                       "max_diagnostic_records": MAX_DIAGNOSTIC_RECORDS,
                       "external_elevation_source": None, "accuracy_claim": None},
            "readiness": {"status": status, "core_blocked": geometry.blocked,
                          "elevation_complete": all_missing == 0,
                          "canonical_grade_assessable": domain_available,
                          "raw_review_recommended": needs_review,
                          "steep_scenario_needed": bool(canonical["out_of_domain_cells"]) if domain_available else None,
                          "quality_codes": quality_codes,
                          "meaning": "data_and_model_domain_readiness_only_not_safety_or_prediction_validation"},
            "summary": {"raw_horizontal_m": raw_total, "missing_elevation_points": all_missing,
                        "exact_coordinate_conflict_groups": all_conflicts,
                        "core_vertical_discontinuities": all_vertical_discontinuities,
                        "horizontal_gap_candidates": all_gaps, "vertical_reversal_candidates": all_reversals},
            "core": {"geometry_version": GEOMETRY_VERSION, "geometry_sha256": geometry.geometry_sha256 or None,
                     "config": asdict(geometry.config), "blocked": geometry.blocked,
                     "elevation_complete": geometry.elevation_complete,
                     "cell_count": len(geometry.cells), "known_grade_cells": sum(c.grade is not None for c in geometry.cells),
                     "unknown_grade_cells": sum(c.grade is None for c in geometry.cells)},
            "segments": segments, "canonical_domain": canonical}
