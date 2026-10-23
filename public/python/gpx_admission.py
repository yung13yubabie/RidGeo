"""Shared bounded GPX admission, independent of geometry and projection.

This is the existing details XML validator, used before every engine operation
that consumes raw GPX bytes. No filesystem, network or executable-content use.
Unknown extensions remain bounded and ignored; original bytes are never changed.
"""
from xml.parsers import expat
import re
from trail_planner.gpx import (
    InputError, MAX_BYTES, MAX_DEPTH, MAX_POINTS, NAMESPACES,
    finite_number, parse_gpx,
)

ADMISSION_SCHEMA_VERSION = "gpx-admission/1.0"
MAX_WAYPOINTS = 200
MAX_SEGMENTS = 2000
MAX_ELEMENTS = 250_000
MAX_TEXT_CHARS = 2 * 1024 * 1024
MAX_NODE_TEXT_CHARS = 8192
MAX_ATTRIBUTES = 32
MAX_ATTRIBUTE_CHARS = 4096
MAX_NAME_CHARS = 256
MAX_DESCRIPTION_CHARS = 4096


def _split(tag):
    return tuple(tag.rsplit("}", 1)) if "}" in tag else ("", tag)


def _error(code, message):
    raise InputError(code, message)


def _bounded_text(value, maximum, field):
    if len(value) > maximum:
        _error("detail_text_too_long", f"{field} 超過 {maximum} 字元限制。")
    return value


def _elevation(text):
    value = finite_number(text, "海拔")
    if not -1000 <= value <= 10000:
        _error("invalid_elevation", "海拔超出 −1,000 至 10,000 公尺的輸入範圍。")
    return value


def _validate_xml_encoding(data):
    """Reject malformed UTF-16 before Expat can reinterpret invalid surrogates.

    XML autodetection uses a byte-order mark or the initial XML byte pattern.
    Decode solely for validity; never pass decoded/transcoded text to consumers.
    Other XML encodings retain the existing Expat acceptance behavior.
    """
    encoding = None
    if data.startswith(b"\xff\xfe"):
        encoding = "utf-16-le"
    elif data.startswith(b"\xfe\xff"):
        encoding = "utf-16-be"
    elif data[:2] in (b"<\x00", b" \x00", b"\t\x00", b"\r\x00", b"\n\x00"):
        encoding = "utf-16-le"
    elif data[:2] in (b"\x00<", b"\x00 ", b"\x00\t", b"\x00\r", b"\x00\n"):
        encoding = "utf-16-be"
    if encoding is not None:
        try:
            data.decode(encoding, errors="strict")
        except UnicodeError:
            _error("invalid_xml_encoding", "GPX UTF-16 位元組編碼有誤。")


def _read_annotations(data):
    """Validate the complete XML before the frozen core reader sees it.

    This is not a second geometry implementation. Structural validation also
    prevents a foreign-namespace ancestor from masquerading as a core route.
    Unknown extensions are bounded and ignored, and can never add waypoints.
    """
    if not isinstance(data, bytes):
        _error("invalid_file", "請提供 GPX 位元組資料。")
    if len(data) > MAX_BYTES:
        _error("file_too_large", "GPX 檔案超過 5 MiB 限制。")
    if not data.strip():
        _error("empty_file", "GPX 檔案是空的。")
    _validate_xml_encoding(data)
    stack, tracks, segments, waypoints = [], [], [], []
    metadata = {key: None for key in ("name", "desc", "time", "keywords", "author")}
    source = {}
    state = {"namespace": None, "elements": 0, "text": 0,
             "points": 0, "route_count": 0, "track": None,
             "route": None, "waypoint": None}
    parser = expat.ParserCreate(namespace_separator="}")
    parser.buffer_text = True
    pending_namespace_attributes = 0

    def namespace_start(prefix, uri):
        # Expat omits xmlns declarations from StartElementHandler's attrs.
        # Charge only declarations on the next element, including xmlns="".
        nonlocal pending_namespace_attributes
        pending_namespace_attributes += 1
        name = "xmlns" if prefix is None else "xmlns:" + prefix
        if (pending_namespace_attributes > MAX_ATTRIBUTES or len(name) > 512
                or len(uri or "") > MAX_ATTRIBUTE_CHARS):
            _error("detail_xml_limit", "XML 命名空間宣告數量或長度超過限制。")

    def xml_declaration(version, encoding, standalone):
        # Match XML VersionNum and the upstream 2.8.5 declaration fix. The old
        # bundled parser accepts empty/arbitrary versions; never repair them.
        if re.fullmatch(r"1\.[0-9]+", version) is None:
            _error("invalid_xml", "GPX XML 宣告版本有誤。")

    def forbid(*_):
        _error("unsafe_xml", "GPX 不接受 DTD、實體、外部 XML 或處理指令。")

    def capture(frame, target, key, limit):
        if key in target and target[key] is not None:
            _error("duplicate_detail_field", f"GPX 的 {key} 欄位重複。")
        frame.update(target=target, key=key, limit=limit, pieces=[])

    def start(tag, attrs):
        nonlocal pending_namespace_attributes
        attribute_count = len(attrs) + pending_namespace_attributes
        pending_namespace_attributes = 0
        if stack and "pieces" in stack[-1]:
            _error("invalid_detail_structure", "GPX 名稱、說明與數值欄位不能包含子節點。")
        ns, local = _split(tag)
        if len(tag) > 512 or attribute_count > MAX_ATTRIBUTES:
            _error("detail_xml_limit", "XML 標籤或屬性數量超過限制。")
        for key, value in attrs.items():
            if len(key) > 512 or len(value) > MAX_ATTRIBUTE_CHARS:
                _error("detail_xml_limit", "XML 屬性長度超過限制。")
        state["elements"] += 1
        if state["elements"] > MAX_ELEMENTS:
            _error("detail_xml_limit", "XML 節點數量超過限制。")
        frame = {"ns": ns, "local": local, "text_length": 0}
        stack.append(frame)
        if len(stack) > MAX_DEPTH:
            _error("xml_too_deep", "XML 巢狀層數超過限制。")
        if len(stack) == 1:
            if local != "gpx" or ns not in NAMESPACES:
                _error("invalid_gpx", "檔案根節點必須是 GPX 1.0／1.1。")
            state["namespace"] = ns
            source.update(namespace=ns,
                          version=_bounded_text(attrs.get("version", ""), 32, "version"),
                          creator=_bounded_text(attrs.get("creator", ""), 512, "creator"))
        if ns != state["namespace"]:
            return
        path = tuple(f["local"] for f in stack)
        canonical_path = all(f["ns"] == state["namespace"] for f in stack)
        allowed = {
            "trk": {("gpx", "trk")},
            "trkseg": {("gpx", "trk", "trkseg")},
            "trkpt": {("gpx", "trk", "trkseg", "trkpt")},
            "rte": {("gpx", "rte")},
            "rtept": {("gpx", "rte", "rtept")},
            "wpt": {("gpx", "wpt")},
        }
        if local in allowed and (not canonical_path or path not in allowed[local]):
            _error("invalid_detail_structure", "GPX 軌跡／路標節點的位置或命名空間有誤。")
        if not canonical_path:
            # The frozen parser only checks a leaf namespace. Refuse canonical
            # elevation under a foreign ancestor instead of letting it alter a point.
            if local == "ele" and state["points"]:
                _error("invalid_detail_structure", "海拔節點的命名空間層級有誤。")
            return
        if path == ("gpx", "trk"):
            state["track"] = {"name": None, "desc": None, "segment_count": 0,
                              "track_index": len(tracks)}
            tracks.append(state["track"])
        elif path == ("gpx", "rte"):
            state["route"] = {"name": None, "desc": None,
                              "route_index": state["route_count"]}
            state["route_count"] += 1
            segments.append({"kind": "route", "track_index": None,
                             "route_index": state["route"]["route_index"],
                             "segment_index": 0, "annotation": state["route"]})
        elif path == ("gpx", "trk", "trkseg"):
            track = state["track"]
            segments.append({"kind": "track", "track_index": track["track_index"],
                             "route_index": None, "segment_index": track["segment_count"],
                             "annotation": track})
            track["segment_count"] += 1
        elif path == ("gpx", "wpt"):
            if len(waypoints) >= MAX_WAYPOINTS:
                _error("too_many_waypoints", f"GPX 獨立路標超過 {MAX_WAYPOINTS} 個限制。")
            if "lat" not in attrs or "lon" not in attrs:
                _error("missing_coordinate", "每個路標都需要緯度與經度。")
            lat = finite_number(attrs["lat"], "路標緯度")
            lon = finite_number(attrs["lon"], "路標經度")
            if not -90 <= lat <= 90 or not -180 <= lon <= 180:
                _error("invalid_coordinate", "路標緯度須在 −90 至 90，經度須在 −180 至 180。")
            state["waypoint"] = {"index": len(waypoints), "name": None, "desc": None,
                                 "lat": lat, "lon": lon, "ele": None}
            waypoints.append(state["waypoint"])
        if len(segments) > MAX_SEGMENTS:
            _error("too_many_segments", f"GPX 軌跡段超過 {MAX_SEGMENTS} 段限制。")
        if path in (("gpx", "trk", "trkseg", "trkpt"), ("gpx", "rte", "rtept")):
            state["points"] += 1
            if state["points"] > MAX_POINTS:
                _error("too_many_points", "GPX 軌跡點超過 50,000 點限制。")
        if local == "ele":
            valid_ele = path in (("gpx", "wpt", "ele"),
                                 ("gpx", "trk", "trkseg", "trkpt", "ele"),
                                 ("gpx", "rte", "rtept", "ele"))
            if not valid_ele:
                _error("invalid_detail_structure", "海拔欄位必須直接位於軌跡點或路標內。")
            target = state["waypoint"] if path == ("gpx", "wpt", "ele") else {}
            capture(frame, target, "ele", 128)
        elif path in (("gpx", "wpt", "name"), ("gpx", "wpt", "desc")):
            capture(frame, state["waypoint"], local,
                    MAX_NAME_CHARS if local == "name" else MAX_DESCRIPTION_CHARS)
        elif len(path) == 3 and path[:2] in (("gpx", "trk"), ("gpx", "rte")) and local in ("name", "desc"):
            target = state["track"] if path[1] == "trk" else state["route"]
            capture(frame, target, local, MAX_NAME_CHARS if local == "name" else MAX_DESCRIPTION_CHARS)
        elif path in (("gpx", "metadata", "author", "name"), ("gpx", "author")):
            capture(frame, metadata, "author", MAX_NAME_CHARS)
        elif (path[:-1] in (("gpx", "metadata"), ("gpx",))
              and local in ("name", "desc", "time", "keywords")):
            limit = {"name": MAX_NAME_CHARS, "desc": MAX_DESCRIPTION_CHARS,
                     "time": 128, "keywords": 1024}[local]
            capture(frame, metadata, local, limit)

    def chars(value):
        state["text"] += len(value)
        if state["text"] > MAX_TEXT_CHARS:
            _error("detail_text_too_long", "GPX XML 文字總量超過限制。")
        if not stack:
            return
        frame = stack[-1]
        # Pretty-printed large tracks can contain more than 8 KiB of direct
        # indentation at trkseg level. Bound that by the whole-document text
        # budget, not the scalar-field budget; retain captured whitespace exactly.
        if "pieces" not in frame and value.isspace():
            return
        frame["text_length"] += len(value)
        maximum = frame.get("limit", MAX_NODE_TEXT_CHARS)
        if frame["text_length"] > maximum:
            _error("detail_text_too_long", f"GPX {frame['local']} 文字超過 {maximum} 字元限制。")
        if "pieces" in frame:
            frame["pieces"].append(value)

    def end(tag):
        frame = stack.pop()
        if "pieces" in frame:
            text = "".join(frame["pieces"])
            frame["target"][frame["key"]] = _elevation(text) if frame["key"] == "ele" else text
        if frame["ns"] == state["namespace"]:
            path = tuple(f["local"] for f in stack) + (frame["local"],)
            if path == ("gpx", "wpt"):
                state["waypoint"] = None
            elif path == ("gpx", "trk"):
                state["track"] = None
            elif path == ("gpx", "rte"):
                state["route"] = None

    parser.XmlDeclHandler = xml_declaration
    parser.StartNamespaceDeclHandler = namespace_start
    parser.StartElementHandler = start
    parser.CharacterDataHandler = chars
    parser.EndElementHandler = end
    parser.StartDoctypeDeclHandler = forbid
    parser.EntityDeclHandler = forbid
    parser.ExternalEntityRefHandler = forbid
    parser.ProcessingInstructionHandler = forbid
    parser.SetParamEntityParsing(expat.XML_PARAM_ENTITY_PARSING_NEVER)
    try:
        parser.Parse(data, True)
    except InputError:
        raise
    except (expat.ExpatError, ValueError, TypeError, IndexError, KeyError):
        _error("invalid_xml", "GPX XML 格式不完整或欄位結構有誤。")
    return source, metadata, segments, waypoints, len(tracks), state["route_count"]



def validate_gpx_admission(data):
    """Validate raw XML structure/budgets and existing core numeric/route rules.

    No geometry/model admission or external waypoint projection is performed.
    Returns no transformed bytes, allowing consumers to retain exact source SHA.
    """
    _read_annotations(data)
    parse_gpx(data)
