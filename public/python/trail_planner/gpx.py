"""Bounded, namespace-aware GPX reader. DTDs and entities are forbidden."""
from dataclasses import dataclass
import hashlib
import math
from xml.parsers import expat

MAX_BYTES = 5 * 1024 * 1024
MAX_POINTS = 50_000
MAX_DEPTH = 32
NAMESPACES = {'', 'http://www.topografix.com/GPX/1/1', 'http://www.topografix.com/GPX/1/0'}

class InputError(ValueError):
    def __init__(self, code, message):
        super().__init__(message)
        self.code = code

@dataclass(frozen=True)
class Point:
    lat: float
    lon: float
    ele: float | None

@dataclass(frozen=True)
class Route:
    segments: tuple[tuple[Point, ...], ...]
    sha256: str
    byte_count: int
    point_count: int
    namespace: str
    ignored_activity_fields: bool

def finite_number(value, label):
    try:
        number = float(value)
    except (ValueError, TypeError, OverflowError):
        raise InputError('invalid_number', f'{label}必須是有限數字。') from None
    if not math.isfinite(number):
        raise InputError('invalid_number', f'{label}不能是 NaN 或無限值。')
    return number

def parse_gpx(data: bytes, *, max_bytes=MAX_BYTES, max_points=MAX_POINTS) -> Route:
    if not isinstance(data, bytes):
        raise InputError('invalid_file', '請提供 GPX 檔案。')
    if not data.strip():
        raise InputError('empty_file', 'GPX 檔案是空的。')
    if len(data) > max_bytes:
        raise InputError('file_too_large', 'GPX 檔案超過 5 MiB 限制。')
    stack, segments = [], []
    state = {'root': False, 'namespace': '', 'point': None, 'ele': None,
             'count': 0, 'activity': False, 'segment': None}
    parser = expat.ParserCreate(namespace_separator='}')
    parser.buffer_text = True

    def split(tag):
        return tag.rsplit('}', 1) if '}' in tag else ('', tag)

    def forbid(*args):
        raise InputError('unsafe_xml', 'GPX 不接受 DTD、實體或外部 XML 資源。')

    def start(tag, attrs):
        ns, local = split(tag)
        stack.append((ns, local))
        if len(stack) > MAX_DEPTH:
            raise InputError('xml_too_deep', 'XML 巢狀層數超過限制。')
        if len(stack) == 1:
            if local != 'gpx' or ns not in NAMESPACES:
                raise InputError('invalid_gpx', '檔案根節點必須是 GPX 1.0／1.1。')
            state['root'], state['namespace'] = True, ns
        if ns != state['namespace']:
            return
        path = [part[1] for part in stack]
        if path in (['gpx', 'trk', 'trkseg'], ['gpx', 'rte']):
            state['segment'] = []
        if path in (['gpx', 'trk', 'trkseg', 'trkpt'], ['gpx', 'rte', 'rtept']):
            state['count'] += 1
            if state['count'] > max_points:
                raise InputError('too_many_points', 'GPX 軌跡點超過 50,000 點限制。')
            if 'lat' not in attrs or 'lon' not in attrs:
                raise InputError('missing_coordinate', '每個軌跡點都需要緯度與經度。')
            lat, lon = finite_number(attrs['lat'], '緯度'), finite_number(attrs['lon'], '經度')
            if not -90 <= lat <= 90 or not -180 <= lon <= 180:
                raise InputError('invalid_coordinate', '緯度須在 −90 至 90，經度須在 −180 至 180。')
            state['point'] = [lat, lon, None]
        if state['point'] is not None and local in {'time', 'extensions'}:
            state['activity'] = True
        if state['point'] is not None and path[-1] == 'ele' and path[-2] in {'trkpt', 'rtept'}:
            if state['point'][2] is not None:
                raise InputError('duplicate_elevation', '同一軌跡點有重複海拔欄位。')
            state['ele'] = ''

    def chars(value):
        if state['ele'] is not None:
            state['ele'] += value
            if len(state['ele']) > 128:
                raise InputError('invalid_elevation', '海拔欄位過長。')

    def end(tag):
        ns, local = split(tag)
        path = [part[1] for part in stack]
        if ns == state['namespace']:
            if state['ele'] is not None and path[-1] == 'ele' and path[-2] in {'trkpt', 'rtept'}:
                ele = finite_number(state['ele'], '海拔')
                if not -1000 <= ele <= 10000:
                    raise InputError('invalid_elevation', '海拔超出 −1,000 至 10,000 公尺的輸入範圍。')
                state['point'][2], state['ele'] = ele, None
            if path in (['gpx', 'trk', 'trkseg', 'trkpt'], ['gpx', 'rte', 'rtept']):
                state['segment'].append(Point(*state['point']))
                state['point'] = None
            if path in (['gpx', 'trk', 'trkseg'], ['gpx', 'rte']):
                segments.append(tuple(state['segment']))
                state['segment'] = None
        stack.pop()

    parser.StartElementHandler, parser.EndElementHandler = start, end
    parser.CharacterDataHandler = chars
    parser.StartDoctypeDeclHandler = forbid
    parser.EntityDeclHandler = forbid
    parser.ExternalEntityRefHandler = forbid
    parser.SetParamEntityParsing(expat.XML_PARAM_ENTITY_PARSING_NEVER)
    try:
        parser.Parse(data, True)
    except InputError:
        raise
    except (expat.ExpatError, ValueError, TypeError, IndexError):
        raise InputError('invalid_xml', 'GPX XML 格式不完整或欄位結構有誤。') from None
    if not state['root'] or not segments or state['count'] < 2:
        raise InputError('no_route', '至少需要兩個軌跡點；不使用獨立路標代替路線。')
    return Route(tuple(segments), hashlib.sha256(data).hexdigest(), len(data),
                 state['count'], state['namespace'], state['activity'])
