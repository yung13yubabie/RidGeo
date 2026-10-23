"""Maintained executable/schema capsule verifier for a trusted Worker host.

No historical test/evidence file is a runtime dependency. Assets are byte-verified
before this guard is executed. This guards reachable import/cache collisions; it
is not attestation of a compromised interpreter or arbitrary hostile Python code.
"""
from __future__ import annotations
import hashlib
import importlib
import importlib.machinery
import json
from pathlib import Path
import sys
from types import MappingProxyType

PROFILE = 'conditional-runtime-capsule/1.0'
ROOT = Path(__file__).resolve().parent
SOURCE_BASE = '5d2a8fcede539551d4d62f6ac3a469b8106f34db'
INTEGRATION_BASE = 'd3f68a7f8f4adf10b1d6b25f9d9ac39ace545253'
FILES ={'frozen-search/conditional_stop_search.py': {'sha256': '1861e7f1a38bce441ee4680edc82ee1f5727cc38cf3343691bbf928c4b8a597b', 'bytes': 34539}, 'frozen-search/frozen-r3/artifact-template.json': {'sha256': 'e9e55ba9060fa676edf3ceeec2371682ff2d67bb171853ce90fe363f6746e200', 'bytes': 3990}, 'frozen-search/frozen-r3/conditional_adapter.py': {'sha256': '8d1112d6807abe08d4ccd9294c99d33be0298f709786d623882e98b188c50024', 'bytes': 58645}, 'frozen-search/frozen-r3/dependencies/cross_trail_predictor.py': {'sha256': '2f91c50c176c626acd2665f1d229f4baeb394e01d7ed1e1f37ad52bca74c0be3', 'bytes': 20843}, 'frozen-search/frozen-r3/dependencies/dependencies/intensity_transition.py': {'sha256': 'f6b9f0a4d768e838e40de8320d225615339291ce8ce82915334e4189bc7c22ed', 'bytes': 20592}, 'frozen-search/frozen-r3/dependencies/trail_planner/__init__.py': {'sha256': '06096ad97f2c6ce19894e9686fe836cd438309522d0781bf9a9bf263c41b15f3', 'bytes': 363}, 'frozen-search/frozen-r3/dependencies/trail_planner/geometry.py': {'sha256': '8a527265f1f890f913c4cc33e513afb7cb61cd14150e6155e9d9fcfe2d37bd25', 'bytes': 7831}, 'frozen-search/frozen-r3/dependencies/trail_planner/gpx.py': {'sha256': '734e1aae59de0b4775d74257c767de9e5f4648b69247988b1087ec27fa18fe6f', 'bytes': 5651}, 'frozen-search/frozen-r3/dependencies/trail_planner/planning.py': {'sha256': '219bdcc59fea3d2ec581bd45adad0d8162e789d367437f1bec79d2066d276080', 'bytes': 20211}, 'frozen-search/frozen-r3/dependencies/variable_transition.py': {'sha256': '95b6ad84d3cc19e4d8758c08a92669ad82eca956e9ddbb07db1b8a22529c08fd', 'bytes': 15073}, 'production/gpx_admission.py': {'sha256': '3b66d3b9334cb80a85e6f3c2bbd1154cbdaed4e455076a50cc169ef83aa94912', 'bytes': 13294}, 'production/manual_pace_adapter.py': {'sha256': '596475dd924ec78ce1aef115e339cb14ecbc2fd97aad930858b078ae3e255c0f', 'bytes': 21094}, 'production_recovery_bridge.py': {'sha256': '33ec21c1c2c5368c8d8c92955b706ae1ac5122bbc1deb2e43adb62392de7fd0c', 'bytes': 17409}, 'worker_adapter.py': {'sha256': '9ce707507b51c923bc5b450d9b61021a2a3d2001a6a8dbdad3da36807b4a92b4', 'bytes': 15751}}  # Fixed byte/hash map; no caller override.
ALIASES = {
 'trail_planner':'frozen-search/frozen-r3/dependencies/trail_planner/__init__.py',
 'trail_planner.gpx':'frozen-search/frozen-r3/dependencies/trail_planner/gpx.py',
 'trail_planner.geometry':'frozen-search/frozen-r3/dependencies/trail_planner/geometry.py',
 'trail_planner.planning':'frozen-search/frozen-r3/dependencies/trail_planner/planning.py',
 'gpx_admission':'production/gpx_admission.py',
 'manual_pace_adapter':'production/manual_pace_adapter.py',
 'cross_trail_predictor':'frozen-search/frozen-r3/dependencies/cross_trail_predictor.py',
 'dependencies.intensity_transition':'frozen-search/frozen-r3/dependencies/dependencies/intensity_transition.py',
 'variable_transition':'frozen-search/frozen-r3/dependencies/variable_transition.py',
 'conditional_adapter':'frozen-search/frozen-r3/conditional_adapter.py',
 'conditional_stop_search':'frozen-search/conditional_stop_search.py',
 'production_recovery_bridge':'production_recovery_bridge.py',
 'worker_adapter':'worker_adapter.py',
}
SHARED = frozenset(('trail_planner','trail_planner.gpx','trail_planner.geometry','trail_planner.planning','gpx_admission','manual_pace_adapter','cross_trail_predictor'))
_started = False
_installed = False
_modules = {}
_identity = None
_guard_sha = None


def refuse():
    # No private absolute path, caller data or source content leaks through errors.
    raise RuntimeError('Conditional runtime capsule integrity/import mismatch.')


def file_bytes(name):
    spec=FILES[name]
    path=ROOT/name
    try:
        if path.stat().st_size!=spec['bytes']:refuse()
        data=path.read_bytes()
    except OSError:
        refuse()
    if len(data)!=spec['bytes'] or hashlib.sha256(data).hexdigest()!=spec['sha256']:refuse()
    return data


def origin(module,name):
    expected=FILES[ALIASES[name]]['sha256']
    try:
        path=Path(module.__file__).resolve()
        spec=module.__spec__
        if not spec or not spec.origin or Path(spec.origin).resolve()!=path:refuse()
        permitted={ROOT/ALIASES[name]}
        if name in SHARED:
            base=ROOT.parent
            permitted.add(base/('trail_planner/__init__.py' if name=='trail_planner' else name.replace('.','/')+'.py'))
        if path not in permitted or hashlib.sha256(path.read_bytes()).hexdigest()!=expected:refuse()
    except (AttributeError,OSError,TypeError,ValueError):
        refuse()


def namespace(module):
    try:
        locations=tuple(Path(x).resolve() for x in module.__path__)
        if set(locations)!={ROOT/'frozen-search/frozen-r3/dependencies',ROOT/'frozen-search/frozen-r3/dependencies/dependencies'}:refuse()
        if module.__spec__.origin is not None:refuse()
    except (AttributeError,TypeError,ValueError):refuse()


def ensure_installed():
    if not _installed:refuse()
    if sys.modules.get('runtime_integrity') is not sys.modules.get(__name__):refuse()
    for name,module in _modules.items():
        if sys.modules.get(name) is not module:refuse()
        if name=='dependencies':namespace(module)
        else:origin(module,name)


def verify_runtime(budget):
    ensure_installed()
    for name in FILES:
        budget.take()
        file_bytes(name)
    budget.take()
    if hashlib.sha256(Path(__file__).read_bytes()).hexdigest()!=_guard_sha:refuse()


def installed_identity():
    ensure_installed()
    return dict(_identity)


def bootstrap(verified_shared):
    """One-shot trusted-host entry, never reachable through request JSON."""
    global _started,_installed,_modules,_identity,_guard_sha
    if _started:refuse()
    _started=True
    if type(verified_shared) is not dict or len(verified_shared)>len(SHARED) or set(verified_shared)-SHARED:refuse()
    if 'runtime_integrity' in sys.modules:refuse()
    for name in FILES:file_bytes(name)
    # Reject every preloaded collision before any capsule import executes.
    for name in ALIASES:
        if name in sys.modules:
            if name not in SHARED or verified_shared.get(name) is not sys.modules[name]:refuse()
            origin(sys.modules[name],name)
    if 'dependencies' in sys.modules:refuse()
    roots=[str(ROOT),str(ROOT/'production'),str(ROOT/'frozen-search'),str(ROOT/'frozen-search/frozen-r3'),str(ROOT/'frozen-search/frozen-r3/dependencies')]
    sys.path[:0]=roots
    # Check resolution for new aliases without importing any nonstdlib parent.
    for name,rel in ALIASES.items():
        if name in sys.modules:continue
        parent=ROOT/rel
        if '.' in name:
            paths=[str(parent.parent)]
        else:paths=sys.path
        spec=importlib.machinery.PathFinder.find_spec(name,paths)
        if not spec or not spec.origin or Path(spec.origin).resolve()!=parent:refuse()
    spec=importlib.machinery.PathFinder.find_spec('dependencies',sys.path)
    if not spec or spec.origin is not None or set(Path(x).resolve() for x in spec.submodule_search_locations)!={ROOT/'frozen-search/frozen-r3/dependencies',ROOT/'frozen-search/frozen-r3/dependencies/dependencies'}:refuse()
    sys.modules['runtime_integrity']=sys.modules[__name__]
    # All imports below have admitted byte identities and fixed resolution.
    module=importlib.import_module('worker_adapter')
    _modules={name:sys.modules[name] for name in ALIASES}
    _modules['dependencies']=sys.modules['dependencies']
    _guard_sha=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    _identity=MappingProxyType(dict(profile=PROFILE,member_set_sha256=hashlib.sha256(json.dumps(FILES,sort_keys=True,separators=(',',':')).encode()).hexdigest(),guard_sha256=_guard_sha,
        bridge_module_sha256=FILES['production_recovery_bridge.py']['sha256'],search_module_sha256=FILES['frozen-search/conditional_stop_search.py']['sha256'],wrapper_module_sha256=FILES['worker_adapter.py']['sha256']))
    _installed=True
    ensure_installed()
    return module.handle_request
