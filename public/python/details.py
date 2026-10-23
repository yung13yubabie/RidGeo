"""Bounded GPX details and advisory waypoint projections, independent of planning.

Standard library only. No network or filesystem calls. Import alongside the
unchanged trail_planner package. Strings are original XML-decoded text, never
HTML; the caller must render them with textContent (or equivalent escaping).
"""
from bisect import bisect_right
from dataclasses import replace
import math

from trail_planner.gpx import (
    InputError, Point, finite_number, parse_gpx,
)
from trail_planner.geometry import EARTH_RADIUS_M, build_geometry, haversine

from gpx_admission import (
    MAX_WAYPOINTS, MAX_NAME_CHARS, MAX_DESCRIPTION_CHARS,
    _read_annotations, _bounded_text, _elevation, _error,
)

DETAIL_SCHEMA_VERSION = "trail-details/1.0"
MAX_CANDIDATES = 64
PROJECTION_TOLERANCE_M = 50.0
# Only numerical duplicates at one along-route position are coalesced. In
# particular the beginning and end of a closed loop remain separate passages.
PASSAGE_MERGE_EPSILON_M = 1e-5
_ENDPOINT_EPSILON_M = 1e-6



def _elevation_stats(points):
    elevations = [p.ele for p in points if p.ele is not None]
    return {"elevation_min_m": min(elevations) if elevations else None,
            "elevation_max_m": max(elevations) if elevations else None,
            "elevation_complete": bool(points) and len(elevations) == len(points),
            "elevation_point_count": len(elevations),
            "missing_elevation_point_count": len(points) - len(elevations)}


def _segment_detail(index, descriptor, points, geometry):
    complete = bool(points) and all(p.ele is not None for p in points)
    annotation = descriptor["annotation"]
    result = {"index": index, **{k: v for k, v in descriptor.items() if k != "annotation"},
              "name": annotation["name"], "desc": annotation["desc"],
              "point_count": len(points),
              "distance_m": None if geometry.blocked else geometry.distance_m,
              "horizontal_distance_m": geometry.horizontal_distance_m,
              "ascent_m": geometry.ascent_m, "descent_m": geometry.descent_m,
              "blocked": geometry.blocked, "quality": list(geometry.quality),
              **_elevation_stats(points)}
    # Explicitly labeled unsmoothed reference values. Never used by planning.
    result["raw_ascent_m"] = sum(max(0.0, b.ele - a.ele) for a, b in zip(points, points[1:])) if complete else None
    result["raw_descent_m"] = sum(max(0.0, a.ele - b.ele) for a, b in zip(points, points[1:])) if complete else None
    return result


def _vector(lat, lon):
    lat, lon = math.radians(lat), math.radians(lon)
    cos_lat = math.cos(lat)
    return (cos_lat * math.cos(lon), cos_lat * math.sin(lon), math.sin(lat))


def _dot(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def _cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def _norm(a):
    return math.sqrt(_dot(a, a))


def _angle(a, b):
    return math.atan2(_norm(_cross(a, b)), max(-1.0, min(1.0, _dot(a, b))))


def _prepare_edges(points):
    edges, x, raw_x = [], 0.0, 0.0
    for i, (a, b) in enumerate(zip(points, points[1:])):
        distance = haversine(a, b)
        # Match the frozen core's treatment of coincident horizontal points.
        if distance < 1e-6:
            raw_x += distance
            continue
        av, bv = _vector(a.lat, a.lon), _vector(b.lat, b.lon)
        normal = _cross(av, bv)
        magnitude = _norm(normal)
        if magnitude < 1e-14:
            _error("projection_geometry", "路線幾何無法安全投影路標。")
        normal = tuple(v / magnitude for v in normal)
        tangent = _cross(normal, av)
        theta = _angle(av, bv)
        midpoint = tuple(a + b for a, b in zip(av, bv))
        midpoint_norm = _norm(midpoint)
        midpoint = tuple(v / midpoint_norm for v in midpoint)
        edges.append({"a": av, "b": bv, "normal": normal, "tangent": tangent,
                      "theta": theta, "horizontal_m": distance, "x": x, "raw_x": raw_x,
                      "index": i, "midpoint": midpoint,
                      "cos_half": math.cos(theta / 2), "sin_half": math.sin(theta / 2)})
        x += distance
        raw_x += distance
    return edges


def _project_edge(p, edge):
    """Closest point on a minor great-circle arc; stable at poles/dateline."""
    # atan2 directly gives the coordinate on the edge's great circle. A point
    # near its normal has no stable foot, so compare endpoints conservatively.
    pa, pt = _dot(p, edge["a"]), _dot(p, edge["tangent"])
    if math.hypot(pa, pt) > 1e-14:
        angle = math.atan2(pt, pa)
        if 0.0 < angle < edge["theta"]:
            fraction = angle / edge["theta"]
            q = tuple(math.cos(angle) * a + math.sin(angle) * t
                      for a, t in zip(edge["a"], edge["tangent"]))
            return fraction, EARTH_RADIUS_M * _angle(p, q)
    left, right = _angle(p, edge["a"]), _angle(p, edge["b"])
    return (0.0, EARTH_RADIUS_M * left) if left <= right else (1.0, EARTH_RADIUS_M * right)


def _canonical_mapper(geometry):
    """Convert cumulative raw horizontal metres via actual core cells."""
    ends, x = [], 0.0
    for cell in geometry.cells:
        x += cell.horizontal_m
        ends.append(x)

    def convert(horizontal_m):
        if horizontal_m <= _ENDPOINT_EPSILON_M:
            return 0.0
        if geometry.horizontal_distance_m - horizontal_m <= _ENDPOINT_EPSILON_M:
            return geometry.distance_m
        i = min(len(ends) - 1, bisect_right(ends, horizontal_m))
        start = ends[i - 1] if i else 0.0
        cell = geometry.cells[i]
        fraction = min(1.0, max(0.0, (horizontal_m - start) / cell.horizontal_m))
        return cell.start_m + fraction * cell.distance_m
    return convert


def _projection(waypoint, edges, geometry, convert):
    p = _vector(waypoint["lat"], waypoint["lon"])
    projections = [None] * len(edges)
    nearest = math.pi * EARTH_RADIUS_M
    cutoff_cos, cutoff_sin = -1.0, 0.0
    for i, edge in enumerate(edges):
        # The spherical triangle inequality gives a cheap safe lower bound.
        # Never prune a possible within-tolerance passage, even if another is closer.
        if nearest < math.pi * EARTH_RADIUS_M / 2:
            boundary = cutoff_cos * edge["cos_half"] - cutoff_sin * edge["sin_half"]
            if _dot(p, edge["midpoint"]) < boundary - 1e-14:
                continue
        fraction, offset = _project_edge(p, edge)
        projections[i] = (fraction, offset)
        if offset < nearest:
            nearest = offset
            cutoff = max(nearest, PROJECTION_TOLERANCE_M + 1e-5) / EARTH_RADIUS_M
            cutoff_cos, cutoff_sin = math.cos(cutoff), math.sin(cutoff)

    candidates = []
    for i, value in enumerate(projections):
        if value is None:
            continue
        fraction, offset = value
        if offset > PROJECTION_TOLERANCE_M + 1e-7:
            continue
        edge = edges[i]
        position = fraction * edge["horizontal_m"]
        at_start = position <= _ENDPOINT_EPSILON_M
        at_end = edge["horizontal_m"] - position <= _ENDPOINT_EPSILON_M
        # Edge-clamped points are candidates only at a local minimum of the
        # *polyline*, not every neighboring vertex within the tolerance radius.
        if at_start and i:
            previous = projections[i - 1]
            if previous is None or (1.0 - previous[0]) * edges[i - 1]["horizontal_m"] > _ENDPOINT_EPSILON_M:
                continue
        if at_end and i + 1 < len(edges):
            following = projections[i + 1]
            if following is None or following[0] * edges[i + 1]["horizontal_m"] > _ENDPOINT_EPSILON_M:
                continue
        horizontal = edge["x"] + position
        candidate = {"along_route_m": convert(horizontal),
                     "horizontal_along_route_m": horizontal,
                     "raw_horizontal_along_route_m": edge["raw_x"] + position,
                     "offset_m": offset, "raw_edge_index": edge["index"]}
        if candidates and abs(horizontal - candidates[-1]["horizontal_along_route_m"]) <= PASSAGE_MERGE_EPSILON_M:
            if offset < candidates[-1]["offset_m"]:
                candidates[-1] = candidate
        else:
            candidates.append(candidate)

    count = len(candidates)
    status = "unique" if count == 1 else "ambiguous" if count > 1 else "off_route"
    return {"status": status,
            "reason": {"unique": "one_local_minimum_within_tolerance",
                       "ambiguous": "multiple_route_passages_within_tolerance",
                       "off_route": "no_route_passage_within_tolerance"}[status],
            "advisory_only": True, "tolerance_m": PROJECTION_TOLERANCE_M,
            "nearest_offset_m": nearest, "candidate_count": count,
            "candidates_truncated": count > MAX_CANDIDATES,
            "candidates": candidates[:MAX_CANDIDATES]}


def project_waypoints(route, geometry, points) -> list[dict]:
    """Project <=200 externally supplied coordinate candidates onto this route.

    ``route`` and ``geometry`` must come from the frozen core for the same GPX.
    ``points`` is a list/tuple of dictionaries with lat/lon and optional
    name/desc/ele. Extra input fields are not copied; attach provenance outside
    this function. Returns new dictionaries, never mutates inputs. No station,
    edition, timing or ordering inference is performed.
    """
    if geometry.route_sha256 != route.sha256 or geometry.source_points != route.point_count or geometry.segment_count != len(route.segments):
        _error("detail_route_mismatch", "路標投影的 GPX 與計算幾何不一致。")
    if not isinstance(points, (list, tuple)):
        _error("invalid_waypoints", "路標候選必須是清單。")
    if len(points) > MAX_WAYPOINTS:
        _error("too_many_waypoints", f"路標候選超過 {MAX_WAYPOINTS} 個限制。")
    waypoints = []
    for index, point in enumerate(points):
        if not isinstance(point, dict) or "lat" not in point or "lon" not in point:
            _error("missing_coordinate", "每個路標候選都需要緯度與經度。")
        if isinstance(point["lat"], bool) or isinstance(point["lon"], bool):
            _error("invalid_coordinate", "路標座標不接受布林值。")
        lat, lon = finite_number(point["lat"], "路標緯度"), finite_number(point["lon"], "路標經度")
        if not -90 <= lat <= 90 or not -180 <= lon <= 180:
            _error("invalid_coordinate", "路標緯度須在 −90 至 90，經度須在 −180 至 180。")
        waypoint = {"index": index, "lat": lat, "lon": lon}
        for key, limit in (("name", MAX_NAME_CHARS), ("desc", MAX_DESCRIPTION_CHARS)):
            value = point.get(key)
            if value is not None and not isinstance(value, str):
                _error("invalid_waypoints", "路標名稱與說明必須是文字。")
            waypoint[key] = _bounded_text(value, limit, key) if value is not None else None
        elevation = point.get("ele")
        if isinstance(elevation, bool):
            _error("invalid_elevation", "路標海拔不接受布林值。")
        waypoint["ele"] = _elevation(elevation) if elevation is not None else None
        waypoints.append(waypoint)
    reason = None
    if len(route.segments) != 1:
        reason = "multiple_segments"
    elif geometry.blocked or not geometry.cells:
        reason = "blocked_geometry"
    if not reason and waypoints:
        try:
            edges = _prepare_edges(route.segments[0])
        except InputError as exc:
            if exc.code != "projection_geometry":
                raise
            reason = "numerically_unstable_geometry"
    if reason:
        for waypoint in waypoints:
            waypoint["projection"] = {"status": "unavailable", "reason": reason,
                                      "advisory_only": True, "tolerance_m": PROJECTION_TOLERANCE_M,
                                      "nearest_offset_m": None, "candidate_count": 0,
                                      "candidates_truncated": False, "candidates": []}
    elif waypoints:
        convert = _canonical_mapper(geometry)
        for waypoint in waypoints:
            waypoint["projection"] = _projection(waypoint, edges, geometry, convert)
    return waypoints


def _raw_profiles(route, geometry):
    """Keep every source position/height, including duplicates and nulls."""
    profiles, source_index = [], 0
    convert = _canonical_mapper(geometry) if not geometry.blocked and len(route.segments) == 1 and geometry.cells else None
    for segment_index, points in enumerate(route.segments):
        profile, horizontal, canonical_horizontal = [], 0.0, 0.0
        previous = None
        for point in points:
            if previous is not None:
                step = haversine(previous, point)
                horizontal += step
                if step >= 1e-6:
                    canonical_horizontal += step
            profile.append({"source_point_index": source_index,
                            "lat": point.lat, "lon": point.lon, "ele": point.ele,
                            "horizontal_m": horizontal,
                            "canonical_along_route_m": convert(canonical_horizontal) if convert else None})
            previous = point
            source_index += 1
        profiles.append({"segment_index": segment_index, "points": profile})
    return profiles


def inspect_details(data: bytes, external_waypoints=None) -> dict:
    """Return JSON-safe detailed GPX information, or raise core InputError.

    No race metadata, aid-station classification, stop duration, cutoff or
    checkpoint is inferred. Projections require explicit user selection.
    """
    if external_waypoints is not None and (not isinstance(external_waypoints, list) or len(external_waypoints) > 100):
        _error("invalid_official_waypoints", "官方補給站候選須為最多 100 個座標。")
    source, metadata, descriptors, waypoints, track_count, route_count = _read_annotations(data)
    route = parse_gpx(data)
    geometry = build_geometry(route)
    if len(descriptors) != len(route.segments):
        _error("invalid_detail_structure", "GPX 軌跡段結構與核心解析不一致。")
    source.update(route_sha256=route.sha256, byte_count=route.byte_count)
    segments = []
    for i, (points, descriptor) in enumerate(zip(route.segments, descriptors)):
        segment_route = replace(route, segments=(points,), point_count=len(points))
        segment_geometry = geometry if len(route.segments) == 1 else build_geometry(segment_route)
        segments.append(_segment_detail(i, descriptor, points, segment_geometry))
    all_points = [p for segment in route.segments for p in segment]
    def total(key):
        values = [segment[key] for segment in segments]
        return None if any(value is None for value in values) else sum(values)
    summary = {"metric_scope": "sum_of_segments_no_gap_bridging",
               "distance_basis": "canonical_geometry_cells",
               "distance_m": total("distance_m"),
               "horizontal_distance_m": total("horizontal_distance_m"),
               "ascent_m": total("ascent_m"), "descent_m": total("descent_m"),
               "raw_ascent_m": total("raw_ascent_m"), "raw_descent_m": total("raw_descent_m"),
               "point_count": route.point_count, "segment_count": len(route.segments),
               "track_count": track_count, "route_count": route_count,
               "waypoint_count": len(waypoints), "planning_blocked": geometry.blocked,
               **_elevation_stats(all_points)}
    canonical = geometry.summary()
    canonical.pop("profile", None)
    waypoints = project_waypoints(route, geometry, waypoints)
    raw_profiles = _raw_profiles(route, geometry)
    summary["raw_horizontal_distance_m"] = sum(profile["points"][-1]["horizontal_m"] for profile in raw_profiles if profile["points"])
    return {"detail_schema_version": DETAIL_SCHEMA_VERSION,
            "source": source, "metadata": metadata, "summary": summary,
            "canonical_geometry": canonical, "profile_geometry": [{"start_m": c.start_m, "end_m": c.end_m, "horizontal_m": c.horizontal_m} for c in geometry.cells], "segments": segments, "waypoints": waypoints,
            "raw_profile_segments": raw_profiles, "official_waypoints": project_waypoints(route, geometry, external_waypoints) if external_waypoints is not None else []}
