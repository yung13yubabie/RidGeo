"""Geometry is independent of checkpoints, target time and activity timestamps."""
from bisect import bisect_right
from dataclasses import dataclass, asdict
import hashlib
import json
import math
from .gpx import Route, InputError

EARTH_RADIUS_M = 6371008.8
GEOMETRY_VERSION = 'sphere-box50-grid25-v1'

@dataclass(frozen=True)
class GeometryConfig:
    grid_m: float = 25.0
    smoothing_window_m: float = 50.0
    max_raw_gap_m: float = 2000.0
    max_route_m: float = 500_000.0

@dataclass(frozen=True)
class Cell:
    start_m: float
    end_m: float
    horizontal_m: float
    elevation_start_m: float | None
    elevation_end_m: float | None
    grade: float | None

    @property
    def distance_m(self):
        return self.end_m - self.start_m

@dataclass(frozen=True)
class Geometry:
    cells: tuple[Cell, ...]
    horizontal_distance_m: float
    distance_m: float
    ascent_m: float | None
    descent_m: float | None
    elevation_complete: bool
    quality: tuple[dict, ...]
    blocked: bool
    route_sha256: str
    geometry_sha256: str
    config: GeometryConfig
    source_points: int
    segment_count: int

    def summary(self):
        return {'geometry_version': GEOMETRY_VERSION, 'geometry_sha256': self.geometry_sha256,
                'route_sha256': self.route_sha256, 'distance_m': self.distance_m,
                'horizontal_distance_m': self.horizontal_distance_m,
                'ascent_m': self.ascent_m, 'descent_m': self.descent_m,
                'elevation_complete': self.elevation_complete, 'blocked': self.blocked,
                'quality': list(self.quality), 'source_points': self.source_points,
                'segment_count': self.segment_count, 'config': asdict(self.config),
                'profile': [[0, self.cells[0].elevation_start_m]] +
                    [[c.end_m, c.elevation_end_m] for c in self.cells] if self.cells else []}

def haversine(a, b):
    p1, p2 = math.radians(a.lat), math.radians(b.lat)
    dp, dl = p2 - p1, math.radians(b.lon - a.lon)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(min(1.0, max(0.0, h))))

def build_geometry(route: Route, config: GeometryConfig | None = None) -> Geometry:
    config = config or GeometryConfig()
    for value in (config.grid_m, config.max_raw_gap_m, config.max_route_m):
        if not math.isfinite(value) or value <= 0:
            raise InputError('invalid_geometry_config', '幾何參數必須是正有限數字。')
    if config.grid_m < 1 or config.grid_m > 1000 or not 0 <= config.smoothing_window_m <= 1000:
        raise InputError('invalid_geometry_config', '網格須為 1 至 1,000 公尺，平滑視窗須為 0 至 1,000 公尺。')
    quality = []
    def note(code, severity, message, **detail):
        quality.append({'code': code, 'severity': severity, 'message': message, **detail})
    if route.namespace == '':
        note('namespace_missing', 'warning', 'GPX 沒有標準命名空間，已依 GPX 結構讀取。')
    if route.ignored_activity_fields:
        note('activity_fields_ignored', 'info', '檔案中的活動時間與延伸活動資料不參與計算。')
    if len(route.segments) != 1:
        note('disconnected_segments', 'error', 'GPX 有多段軌跡，未自動連接缺口。請先確認並提供連續路線。',
             segments=len(route.segments))
    points = route.segments[0]
    if len(points) < 2:
        note('short_segment', 'error', '第一軌跡段不足兩點。')
    xs, zs = [0.0], [points[0].ele if points else None]
    duplicates = 0
    for a, b in zip(points, points[1:]):
        d = haversine(a, b)
        if d < 1e-6:
            if a.ele is not None and b.ele is not None and abs(a.ele - b.ele) > 1e-6:
                note('vertical_jump', 'error', '同一水平位置出現不同海拔，無法建立有限坡度。')
            duplicates += 1
            continue
        if d > config.max_raw_gap_m:
            note('sparse_or_jump', 'error', '相鄰軌跡點相距超過 2 公里，可能是跳點或過疏路線；未自行補線。',
                 gap_m=d)
        xs.append(xs[-1] + d)
        zs.append(b.ele)
    if duplicates:
        note('duplicate_points', 'info', '重複水平座標未增加路程。', count=duplicates)
    length = xs[-1]
    if length <= 1e-6:
        note('zero_length', 'error', '路線沒有可計算的水平距離。')
    if length > config.max_route_m:
        note('route_too_long', 'error', '本版路線上限為 500 公里。')
    complete = all(p.ele is not None for p in points)
    if not complete:
        note('missing_elevation', 'warning', '部分或全部軌跡點沒有海拔。坡度、爬升與下降未知；只有明確同意平路假設才可計畫。',
             missing_points=sum(p.ele is None for p in points))
    blocked = any(q['severity'] == 'error' for q in quality)
    if blocked:
        return Geometry((), length, length, None, None, complete, tuple(quality), True,
                        route.sha256, '', config, route.point_count, len(route.segments))

    # Exact integration of the piecewise-linear raw elevation makes smoothing
    # invariant to inserting collinear intermediate GPX points.
    prefix = [0.0]
    if complete:
        for i in range(len(xs) - 1):
            prefix.append(prefix[-1] + (zs[i] + zs[i + 1]) * .5 * (xs[i + 1] - xs[i]))
    def elevation(x):
        i = min(len(xs) - 2, max(0, bisect_right(xs, x) - 1))
        f = (x - xs[i]) / (xs[i + 1] - xs[i])
        return zs[i] + f * (zs[i + 1] - zs[i])
    def integral(x):
        i = min(len(xs) - 2, max(0, bisect_right(xs, x) - 1))
        return prefix[i] + (zs[i] + elevation(x)) * .5 * (x - xs[i])
    def smoothed(x):
        if not complete:
            return None
        half = config.smoothing_window_m * .5
        # Endpoint-preserving symmetric windows avoid introducing an artificial
        # endpoint climb and preserve reversal symmetry.
        half = min(half, x, length - x)
        if half <= 1e-7:
            return elevation(x)
        return (integral(x + half) - integral(x - half)) / (2 * half)
    n = math.ceil(length / config.grid_m)
    if n > 100_000:
        raise InputError('geometry_too_dense', '幾何網格超過資源限制。')
    # Equal cells are tied only to geometry, never checkpoints. Equal partition
    # also preserves exact route-reversal symmetry.
    sample = [length * i / n for i in range(n + 1)]
    heights = [smoothed(x) for x in sample]
    cells, travel, ascent, descent = [], 0.0, 0.0, 0.0
    outdomain = 0
    for i in range(n):
        dx = sample[i + 1] - sample[i]
        dz = heights[i + 1] - heights[i] if complete else 0.0
        ds = math.hypot(dx, dz)
        grade = dz / dx if complete else None
        cells.append(Cell(travel, travel + ds, dx, heights[i], heights[i + 1], grade))
        travel += ds
        ascent += max(0, dz)
        descent += max(0, -dz)
        if grade is not None and abs(grade) > .45 + 1e-10:
            outdomain += 1
    if outdomain:
        note('grade_out_of_domain', 'warning', '部分坡度超出跑台研究的 ±45% 範圍。預設拒絕分配；進階可明示採截斷情境。', cells=outdomain)
    payload = {'version': GEOMETRY_VERSION, 'config': asdict(config),
               'cells': [asdict(c) for c in cells]}
    geometry_hash = hashlib.sha256(json.dumps(payload, sort_keys=True, allow_nan=False,
                                              separators=(',', ':')).encode()).hexdigest()
    return Geometry(tuple(cells), length, travel, ascent if complete else None,
                    descent if complete else None, complete, tuple(quality), False,
                    route.sha256, geometry_hash, config, route.point_count, len(route.segments))
