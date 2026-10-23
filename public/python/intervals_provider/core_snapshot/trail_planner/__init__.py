"""Reproducible goal-time planning, not athlete ability prediction."""
from .gpx import parse_gpx, Route, InputError
from .geometry import build_geometry, GeometryConfig, Geometry
from .planning import create_plan, allocate_bounded

__all__ = ['parse_gpx', 'Route', 'InputError', 'build_geometry', 'GeometryConfig', 'Geometry', 'create_plan', 'allocate_bounded']
