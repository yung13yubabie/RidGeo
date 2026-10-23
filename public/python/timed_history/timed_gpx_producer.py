"""Local-only timed GPX producer. Time means elapsed, never moving.

Unchanged, checksum-pinned route parser/geometry and r2 observation dependencies.
No network, source authentication, current-fitness inference or product mutation.
"""
from __future__ import annotations

from bisect import bisect_left, bisect_right
from copy import deepcopy
from dataclasses import asdict
from datetime import datetime, timezone, timedelta
import hashlib
import importlib.util
import math
from pathlib import Path
import re
import sys
import types
from xml.parsers import expat

SCHEMA_VERSION = "timed-gpx-observation-producer/0.1"
MAX_BYTES = 5 * 1024 * 1024
MAX_POINTS = 50000
MAX_GROUPS = 64
MAX_DEPTH = 32
MAX_TIME_TEXT = 128
DEPENDENCY_HASHES = {
    "gpx.py": "734e1aae59de0b4775d74257c767de9e5f4648b69247988b1087ec27fa18fe6f",
    "geometry.py": "8a527265f1f890f913c4cc33e513afb7cb61cd14150e6155e9d9fcfe2d37bd25",
    "steep_history_observations.py": "816edec0170b2aadc67c5f3ec1b1dc0be0a4b1be3df4ac35d7541db39b089f2f",
}
_DEPS = None
_ROOT = Path(__file__).resolve().parent / "dependencies"
# These two explicit engineering policies reproduce existing source boundaries.
# They do NOT describe device accuracy or a scientifically minimum useful sample.
DEFAULT_QUALITY_POLICY = {
    "minimum_horizontal_support_m": 1e-6,
    "max_recording_gap_s": 30.,
    "source": "existing geometry duplicate horizontal epsilon 1e-6 m and history normalizer gap policy 30 s; engineering only",
}
_TIME_RE = re.compile(r"^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})$")
_POINT_PATHS = (("gpx", "trk", "trkseg", "trkpt"), ("gpx", "rte", "rtept"))
_SEGMENT_PATHS = (("gpx", "trk", "trkseg"), ("gpx", "rte"))


class ProducerError(ValueError):
    def __init__(self, code):
        super().__init__(code)
        self.code = code


def _sha(data):
    return hashlib.sha256(data).hexdigest()


def _microseconds(delta):
    """Exact integer arithmetic, including large or negative datetime spans."""
    return (delta.days * 86400 + delta.seconds) * 1000000 + delta.microseconds


def _seconds(microseconds):
    # Retain integral seconds as Python ints. Float only when actually fractional.
    return microseconds // 1000000 if microseconds % 1000000 == 0 else microseconds / 1000000


def _dependencies():
    global _DEPS
    for name, pinned in DEPENDENCY_HASHES.items():
        try:
            actual = _sha((_ROOT / name).read_bytes())
        except OSError:
            raise ProducerError("dependency_unavailable") from None
        if actual != pinned:
            raise ProducerError("dependency_integrity_mismatch")
    if _DEPS is None:
        prefix = "_timed_gpx_producer_frozen_816edec0170b"
        package = types.ModuleType(prefix)
        package.__path__ = [str(_ROOT)]
        sys.modules[prefix] = package
        loaded = []
        for name in ("gpx", "geometry", "steep_history_observations"):
            spec = importlib.util.spec_from_file_location(prefix + "." + name, _ROOT / (name + ".py"))
            module = importlib.util.module_from_spec(spec)
            sys.modules[spec.name] = module
            # Execute pinned source without producing any .pyc cache files.
            exec(compile((_ROOT / (name + ".py")).read_bytes(), str(_ROOT / (name + ".py")), "exec"), module.__dict__)
            loaded.append(module)
        _DEPS = tuple(loaded)
    return _DEPS


def _time(text):
    """Return exact representable instant or a named unknown, never truncate."""
    if text is None:
        return {"state": "omitted", "raw_text": None, "utc": None, "reason": "point_time_missing"}, None
    raw = text
    text = text.strip()
    if not text:
        return {"state": "invalid", "raw_text": raw, "utc": None, "reason": "point_time_empty"}, None
    m = _TIME_RE.fullmatch(text)
    if not m:
        return {"state": "invalid", "raw_text": raw, "utc": None, "reason": "point_time_timezone_or_format_unknown"}, None
    if m[5] and len(m[5]) > 7:
        return {"state": "invalid", "raw_text": raw, "utc": None, "reason": "point_time_precision_unsupported"}, None
    offset = m[6]
    if offset == "-00:00":
        return {"state": "invalid", "raw_text": raw, "utc": None, "reason": "point_time_offset_unknown"}, None
    if offset != "Z" and (int(offset[1:3]) > 14 or int(offset[4:6]) > 59 or (int(offset[1:3]) == 14 and int(offset[4:6]) != 0)):
        return {"state": "invalid", "raw_text": raw, "utc": None, "reason": "point_time_offset_invalid"}, None
    try:
        dt = datetime.fromisoformat(text.replace("Z", "+00:00")).astimezone(timezone.utc)
    except (ValueError, OverflowError):
        return {"state": "invalid", "raw_text": raw, "utc": None, "reason": "point_time_invalid_calendar_or_clock"}, None
    return {"state": "valid", "raw_text": raw, "utc": dt.isoformat(), "reason": None}, dt


def _time_sidecar(data, namespace):
    """Read only direct point/time nodes, matching the exact parser's points."""
    stack, segments, current, active, depth = [], [], None, None, None
    parser = expat.ParserCreate(namespace_separator="}")
    parser.buffer_text = True
    def split(tag):
        return tuple(tag.rsplit("}", 1)) if "}" in tag else ("", tag)
    def forbid(*args):
        raise ProducerError("unsafe_xml")
    def start(tag, attrs):
        nonlocal current, active, depth
        ns, name = split(tag)
        stack.append((ns, name))
        if len(stack) > MAX_DEPTH:
            raise ProducerError("xml_too_deep")
        path = tuple(n for _, n in stack)
        if depth is not None and len(stack) > depth:
            current["invalid"] = "point_time_not_scalar"
        if ns != namespace:
            return
        if path in (*_SEGMENT_PATHS, *_POINT_PATHS) and any(ancestor_ns != namespace for ancestor_ns,_ in stack):
            raise ProducerError("foreign_namespace_route_ancestor")
        if path in _SEGMENT_PATHS:
            active = []
        elif path in _POINT_PATHS:
            current = {"raw": None, "seen": 0, "invalid": None}
        elif current is not None and path[:-1] in _POINT_PATHS and name == "time":
            current["seen"] += 1
            if current["seen"] > 1:
                current["invalid"] = "duplicate_point_time"
            current["raw"] = ""
            depth = len(stack)
    def chars(text):
        if depth is not None:
            current["raw"] += text
            if len(current["raw"]) > MAX_TIME_TEXT:
                raise ProducerError("point_time_text_too_long")
    def end(tag):
        nonlocal current, active, depth
        ns, name = split(tag)
        path = tuple(n for _, n in stack)
        if depth is not None and len(stack) == depth:
            depth = None
        if ns == namespace:
            if path in _POINT_PATHS:
                active.append(current)
                current = None
            elif path in _SEGMENT_PATHS:
                segments.append(active)
                active = None
        stack.pop()
    parser.StartElementHandler = start
    parser.CharacterDataHandler = chars
    parser.EndElementHandler = end
    parser.StartDoctypeDeclHandler = forbid
    parser.EntityDeclHandler = forbid
    parser.ExternalEntityRefHandler = forbid
    parser.SetParamEntityParsing(expat.XML_PARAM_ENTITY_PARSING_NEVER)
    try:
        parser.Parse(data, True)
    except ProducerError:
        raise
    except (expat.ExpatError, ValueError, TypeError, IndexError, AttributeError):
        raise ProducerError("timing_xml_invalid") from None
    return segments


def _canonical_cells(geometry):
    n, length = len(geometry.cells), geometry.horizontal_distance_m
    return [dict(start_horizontal_m=length*i/n, end_horizontal_m=length*(i+1)/n,
                 elevation_start_m=c.elevation_start_m, elevation_end_m=c.elevation_end_m)
            for i, c in enumerate(geometry.cells)]


def _slice_cells(cells, first, last, start, end):
    result = []
    for c in cells[first:last+1]:
        left, right = max(start,c["start_horizontal_m"]), min(end,c["end_horizontal_m"])
        if right <= left:
            continue
        def height(x):
            if x == c["start_horizontal_m"]:
                return c["elevation_start_m"]
            if x == c["end_horizontal_m"]:
                return c["elevation_end_m"]
            f = (x-c["start_horizontal_m"])/(c["end_horizontal_m"]-c["start_horizontal_m"])
            return c["elevation_start_m"] + f*(c["elevation_end_m"]-c["elevation_start_m"])
        result.append(dict(start_horizontal_m=left, end_horizontal_m=right,
                           elevation_start_m=height(left), elevation_end_m=height(right)))
    return result


def _groups(geometry, cells):
    result = []
    for index, (c, original) in enumerate(zip(cells, geometry.cells)):
        if original.grade is None or abs(original.grade) <= .45 + 1e-10:
            continue
        direction = "up" if original.grade > 0 else "down"
        if result and result[-1]["direction"] == direction and result[-1]["last_cell"] == index-1:
            result[-1]["last_cell"] = index
            result[-1]["end_horizontal_m"] = c["end_horizontal_m"]
        else:
            result.append(dict(group_index=len(result), direction=direction, first_cell=index, last_cell=index,
                               start_horizontal_m=c["start_horizontal_m"], end_horizontal_m=c["end_horizontal_m"]))
    return result


def inspect_timed_gpx(data: bytes, *, forecast_as_of: str) -> dict:
    """Produce local descriptive observations; this API cannot accept moving data.

    Original timestamps may describe a planned, edited or partial recording.
    They cannot independently establish actual history, effort, identity or stops.
    """
    output = dict(schema_version=SCHEMA_VERSION, status="unavailable", error_code=None,source_sha256=None,
        source_kind="local_user_selected_gpx_not_authenticated", dependency_hashes=deepcopy(DEPENDENCY_HASHES),
        time_basis="elapsed_only_including_logged_stationary_and_pause_intervals",
        moving_time_s=None, actual_history_confirmed=False, historical_calibration_ready=False,
        usable_by_hybrid=False, candidate_rates_m_h=None, original_time_series=[],
        geometry=None, steep_groups=[], receipts=[], observations=None, diagnostics=[],
        diagnostic_occurrence_count=0,diagnostic_detail_limit=128,diagnostics_truncated=False,
        recording_identity=None, observed_file_time_bounds=None,
        warnings=["GPX time is elapsed, not moving. No pause or effort is inferred.",
                  "File bounds do not establish complete activity bounds or original recording identity.",
                  "Only exact original sample timestamps bound observed steep spans; uncovered canonical edges remain unknown.",
                  "Raw input, coordinates and times stay local; no provider connection or network transmission occurs."])
    try:
        if type(data) is not bytes or not data or len(data) > MAX_BYTES:
            raise ProducerError("invalid_file_or_byte_budget")
        output["source_sha256"] = _sha(data)
        asof, _ = _time(forecast_as_of) if type(forecast_as_of) is str and len(forecast_as_of)<=MAX_TIME_TEXT else ({"state":"invalid"},None)
        if asof["state"] != "valid":
            raise ProducerError("forecast_as_of_invalid")
        gpx, geom, obs = _dependencies()
        try:
            route = gpx.parse_gpx(data)
        except AttributeError:
            # Known original-parser malformed-ancestor case: no segment object
            # exists for a same-namespace point under foreign track ancestors.
            # Keep the core frozen and expose a bounded input rejection.
            raise ProducerError("invalid_route_structure") from None
        geometry = geom.build_geometry(route)
        # No profile duplication: group cells and exact source mappings suffice.
        summary = geometry.summary()
        summary.pop("profile",None)
        output["geometry"] = summary
        meta_segments = _time_sidecar(data, route.namespace)
        if len(meta_segments) != len(route.segments) or any(len(a) != len(b) for a,b in zip(meta_segments,route.segments)):
            raise ProducerError("point_time_geometry_index_mismatch")
        quality = []
        def note(code, *, index=None, severity="warning", blocking=True):
            entry = dict(code=code,severity=severity,blocks_candidate=blocking)
            output["diagnostic_occurrence_count"]+=1
            # Compact quality codes are deduplicated; every point has its state.
            if entry not in quality:
                quality.append(entry)
            if len(output["diagnostics"]) < 128:
                output["diagnostics"].append(dict(entry,source_index=index))
            else:
                output["diagnostics_truncated"]=True
        flat_times, flat_points, chainages = [], [], []
        source_index = 0
        previous_time = previous_point = None
        for segment_index,(points,metas) in enumerate(zip(route.segments,meta_segments)):
            horizontal=0.
            for point_index,(p,meta) in enumerate(zip(points,metas)):
                if point_index:
                    step=geom.haversine(points[point_index-1],p)
                    if step >= 1e-6:
                        horizontal += step
                if meta["invalid"]:
                    time = dict(state="invalid",raw_text=None,utc=None,reason=meta["invalid"])
                    instant = None
                else:
                    time,instant = _time(meta["raw"])
                if instant is None:
                    note(time["reason"],index=source_index)
                elif previous_time is not None:
                    dt=(instant-previous_time).total_seconds()
                    if dt < 0:
                        note("timestamps_out_of_order",index=source_index)
                    elif dt == 0:
                        if p != previous_point:
                            note("conflicting_duplicate_timestamp",index=source_index)
                        else:
                            note("identical_timestamp_point_preserved",index=source_index,severity="info",blocking=False)
                    elif dt > DEFAULT_QUALITY_POLICY["max_recording_gap_s"]:
                        note("recording_gap_exceeds_declared_policy",index=source_index)
                output["original_time_series"].append(dict(source_index=source_index,segment_index=segment_index,
                    segment_point_index=point_index,horizontal_m=horizontal,raw_elevation_m=p.ele,
                    time=time,elapsed_s=None,elapsed_us_from_file_origin=None))
                flat_times.append(instant);flat_points.append(p);chainages.append(horizontal)
                if instant is not None:
                    previous_time,previous_point=instant,p
                source_index+=1
        all_times = all(t is not None for t in flat_times)
        if flat_times and flat_times[0] is not None:
            origin=flat_times[0]
            for row,t in zip(output["original_time_series"],flat_times):
                if t is None:
                    continue
                us=_microseconds(t-origin)
                value=_seconds(us)
                row["elapsed_us_from_file_origin"]=str(us)
                try:
                    round_trip=origin+timedelta(seconds=value)
                except (OverflowError,ValueError):
                    round_trip=None
                if round_trip != t:
                    note("source_elapsed_float_precision_limited",index=row["source_index"])
                else:
                    row["elapsed_s"]=value
        if all_times:
            output["observed_file_time_bounds"]=dict(first=flat_times[0].isoformat(),last=flat_times[-1].isoformat(),
                elapsed_s=output["original_time_series"][-1]["elapsed_s"],
                elapsed_us=str(_microseconds(flat_times[-1]-flat_times[0])),
                scope="file_first_and_last_points_only_not_whole_activity")
        if len(route.segments)!=1:
            note("disconnected_segments_not_bridged")
        if geometry.blocked:
            note("core_geometry_blocked")
        if not geometry.elevation_complete:
            note("canonical_elevation_unknown")
        # Preserve the complete time sidecar even when no receipt can be made.
        timing_invalid = not all_times or any(q["code"] in ("timestamps_out_of_order","conflicting_duplicate_timestamp") for q in quality)
        if not geometry.blocked and geometry.elevation_complete and len(route.segments)==1:
            cells=_canonical_cells(geometry)
            groups=_groups(geometry,cells)
            output["steep_groups"]=groups
            for group in groups:
                group.update(original_sample_bounds=None,covered_horizontal_m=0.,uncovered_horizontal_m=group["end_horizontal_m"]-group["start_horizontal_m"],receipt_index=None,exclusions=[])
            if len(groups)>MAX_GROUPS:
                note("steep_group_budget_exceeded")
                output["status"]="source_diagnostics_only"
                return output
        if timing_invalid or geometry.blocked or not geometry.elevation_complete or len(route.segments)!=1:
            for group in output["steep_groups"]:
                group["exclusions"].append("original_timing_incomplete_or_invalid")
            output["status"]="source_diagnostics_only"
            return output
        if flat_times[-1] <= flat_times[0]:
            note("nonpositive_elapsed_span")
            output["status"]="source_diagnostics_only"
            return output
        if chainages[-1] != geometry.horizontal_distance_m:
            raise ProducerError("source_canonical_chainage_mismatch")
        receipt_sample_count=0
        for group in groups:
            left=bisect_left(chainages,group["start_horizontal_m"])
            right=bisect_right(chainages,group["end_horizontal_m"])-1
            group.update(original_sample_bounds=None,covered_horizontal_m=0.,uncovered_horizontal_m=group["end_horizontal_m"]-group["start_horizontal_m"],receipt_index=None,exclusions=[])
            if right <= left or chainages[right] <= chainages[left]:
                group["exclusions"].append("fewer_than_two_exact_original_time_boundaries")
                continue
            if flat_times[right] <= flat_times[left]:
                group["exclusions"].append("nonpositive_selected_elapsed_span")
                continue
            exact_us=_microseconds(flat_times[right]-flat_times[left])
            exact_seconds=_seconds(exact_us)
            group.update(original_sample_bounds=[left,right],exact_elapsed_us=str(exact_us),exact_elapsed_s=exact_seconds)
            encoded=[output["original_time_series"][i]["elapsed_s"] for i in range(left,right+1)]
            if any(value is None for value in encoded):
                group["exclusions"].append("source_elapsed_float_precision_limited")
                continue
            # r2 uses these file-relative values. Require its actual subtraction
            # to match the independently computed original timestamp span, with
            # no absolute or relative tolerance that could hide a short-span error.
            if encoded[-1]-encoded[0] != exact_seconds:
                group["exclusions"].append("segment_elapsed_float_precision_limited")
                note("segment_elapsed_float_precision_limited",index=left)
                continue
            receipt_sample_count+=right-left+1
            if receipt_sample_count>MAX_POINTS:
                note("producer_aggregate_sample_budget_exceeded")
                for item in groups:
                    item["receipt_index"]=None
                    item["exclusions"].append("producer_aggregate_sample_budget_exceeded")
                output["receipts"]=[]
                output["status"]="source_diagnostics_only"
                return output
            selected_cells=_slice_cells(cells,group["first_cell"],group["last_cell"],chainages[left],chainages[right])
            samples=[dict(source_index=i,elapsed_s=output["original_time_series"][i]["elapsed_s"],horizontal_m=chainages[i],raw_elevation_m=flat_points[i].ele) for i in range(left,right+1)]
            binding=dict(source_sha256=route.sha256,whole_geometry_sha256=geometry.geometry_sha256,
                segment_index=0,original_sample_bounds=[left,right],selected_sample_payload_sha256=obs.payload_sha256(samples),
                selected_cell_payload_sha256=obs.payload_sha256(selected_cells),boundary_policy="first_and_last_original_samples_inside_steep_group_including_stationary_boundary_samples")
            receipt=dict(identity=dict(provider="LocalGPX",subject_namespace="local_upload_unverified",recording_key=None,export_id=route.sha256),
                recording_started_at=flat_times[0].isoformat(),recording_completed_at=flat_times[-1].isoformat(),
                direction=group["direction"],samples=samples,cells=selected_cells,
                moving_evidence=dict(kind="unknown",duration_s=None,scope=None,source=None,evidence_sha256=None),
                qualification=dict(original_classification="unclassified",selected_classification="unclassified",classification_source="upstream",high_effort_reference_confirmed=False,actual_history_confirmed=False),
                source_assessment=dict(kind="local_timed_gpx",status="limited",upstream_source="LOCAL_USER_SELECTED_GPX_UNAUTHENTICATED",normalizer_schema=None,source_snapshot_sha256=route.sha256,path_sample_binding_sha256=obs.payload_sha256(binding),historical_performance_eligible=False,quality=deepcopy(quality)),
                geometry_receipt=dict(version=geom.GEOMETRY_VERSION,config=asdict(geometry.config),whole_geometry_sha256=geometry.geometry_sha256,
                    sample_payload_sha256=obs.payload_sha256(samples),cell_payload_sha256=obs.payload_sha256(selected_cells),
                    scope_mapping_evidence_sha256=obs.payload_sha256(binding),processing="unchanged_whole_route_canonical_slice"),
                quality_policy=deepcopy(DEFAULT_QUALITY_POLICY),terrain_context=dict(surface=None,technicity=None,gait="unknown",source=None))
            group.update(original_sample_bounds=[left,right],covered_horizontal_m=chainages[right]-chainages[left],
                uncovered_horizontal_m=(chainages[left]-group["start_horizontal_m"])+(group["end_horizontal_m"]-chainages[right]),
                receipt_index=len(output["receipts"]),binding=binding,
                boundary_time_convention="first_start_last_end_including_logged_stationary_boundary_samples_not_stop_allocation")
            output["receipts"].append(receipt)
        if output["receipts"]:
            directions=tuple(d for d in ("up","down") if any(r["direction"]==d for r in output["receipts"]))
            output["observations"]=obs.observe_selected_segments(output["receipts"],forecast_as_of=asof["utc"],required_directions=directions)
            # This producer must not become a back door to model-ready numbers.
            if output["observations"]["candidate_rates_m_h"] is not None or output["observations"]["usable_by_hybrid"]:
                raise ProducerError("unexpected_model_ready_observation")
            for error in output["observations"]["errors"]:
                if error["code"] != "selected_segment_ineligible":
                    note("observation_"+error["code"])
        rows=(output["observations"] or {}).get("records",[])
        has_rate=any(type(row.get("observed_elapsed_rate_m_h")) in (int,float) and math.isfinite(row["observed_elapsed_rate_m_h"]) for row in rows)
        precision_limited=any(any("precision_limited" in code for code in g["exclusions"]) for g in groups)
        output["status"]="descriptive_elapsed_observations" if has_rate else ("source_diagnostics_only" if output["observations"] or precision_limited else "no_timed_steep_observation")
        return output
    except ProducerError as e:
        output["status"]="input_rejected"
        output["error_code"]=e.code
        output["diagnostic_occurrence_count"]+=1
        if len(output["diagnostics"])<output["diagnostic_detail_limit"]:
            output["diagnostics"].append(dict(code=e.code,severity="error",blocks_candidate=True,source_index=None))
        else:
            output["diagnostics_truncated"]=True
        output["receipts"]=[];output["observations"]=None
        return output
    except Exception as e:
        # The exact core reports InputError with a code. Do not expose raw input,
        # coordinates or arbitrary exception strings in a transport response.
        if hasattr(e,"code") and type(e.code) is str:
            output["status"]="input_rejected"
            output["error_code"]=e.code
            output["diagnostic_occurrence_count"]+=1
            if len(output["diagnostics"])<output["diagnostic_detail_limit"]:
                output["diagnostics"].append(dict(code=e.code,severity="error",blocks_candidate=True,source_index=None))
            else:
                output["diagnostics_truncated"]=True
            output["receipts"]=[];output["observations"]=None
            return output
        raise
