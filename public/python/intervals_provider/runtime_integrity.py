"""Trusted fixed-bootstrap guard for Intervals provider; bounded collisions, not hostile-interpreter attestation."""
import hashlib
import builtins
import types
import importlib.util
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parent
EXPECTED={'core_snapshot/cross_trail_predictor.py': '2f91c50c176c626acd2665f1d229f4baeb394e01d7ed1e1f37ad52bca74c0be3', 'core_snapshot/trail_planner/__init__.py': '06096ad97f2c6ce19894e9686fe836cd438309522d0781bf9a9bf263c41b15f3', 'core_snapshot/trail_planner/gpx.py': '734e1aae59de0b4775d74257c767de9e5f4648b69247988b1087ec27fa18fe6f', 'core_snapshot/trail_planner/geometry.py': '8a527265f1f890f913c4cc33e513afb7cb61cd14150e6155e9d9fcfe2d37bd25', 'core_snapshot/trail_planner/planning.py': '219bdcc59fea3d2ec581bd45adad0d8162e789d367437f1bec79d2066d276080', 'production/gpx_admission.py': '3b66d3b9334cb80a85e6f3c2bbd1154cbdaed4e455076a50cc169ef83aa94912', 'multi_history_reference.py': '1454417fb0d214fc6c7773ee9d32b699720c652acd4b5f8fb23f511d4357a0e6', 'worker_adapter.py': '2702837b780c48cb28fcb1fb4b741df6bdda59f53ee2f14a268ee9d94844b244', 'hybrid_trail_scenario.py': '02010a8b177d2c83ea68ab0a206f60c0ee5d3242bb8248f4c08a608580ceac66'}
_INSTALLED=False
_REGISTRY={}
_CORE_REGISTRY=None
_MODEL=None
_ADAPTER=None
_GUARD_SHA=None
_ADMISSION_BINDING=None


def _sha(raw):return hashlib.sha256(raw).hexdigest()
def _check_files():
    for name,digest in EXPECTED.items():
        path=ROOT/name
        if not path.is_file() or _sha(path.read_bytes())!=digest:raise RuntimeError('Provider pinned runtime dependency differs.')
    if _GUARD_SHA is not None and _sha(Path(__file__).read_bytes())!=_GUARD_SHA:raise RuntimeError('Provider guard file differs.')

def _origin(module):
    # Synthetic package modules deliberately have absent __file__/__spec__.
    file=getattr(module,'__file__',None);spec=getattr(module,'__spec__',None)
    return (None if file is None else str(Path(file).resolve()),spec,getattr(spec,'origin',None),getattr(module,'__package__',None),None if not hasattr(module,'__path__') else tuple(module.__path__))
def _capture(module):return (module,_origin(module))
def _same(name,binding):
    module,origin=binding
    return sys.modules.get(name) is module and _origin(module)==origin

def _load(name,path):
    if name in sys.modules:raise RuntimeError('Provider private runtime alias collision.')
    spec=importlib.util.spec_from_file_location(name,path)
    module=importlib.util.module_from_spec(spec);sys.modules[name]=module;spec.loader.exec_module(module)
    _REGISTRY[name]=_capture(module)
    return module

def _core_prefix():return '_multi_history_frozen_'+_sha(str(ROOT/'core_snapshot').encode())[:16]
def verify():
    if not _INSTALLED:raise RuntimeError('Provider host binding absent.')
    _check_files()
    if _MODEL.CORE_ROOT!=ROOT/'core_snapshot':raise RuntimeError('Provider core path differs.')
    if any(not _same(name,binding) for name,binding in _REGISTRY.items()):raise RuntimeError('Provider loaded module binding differs.')
    if not _same('gpx_admission',_ADMISSION_BINDING) or _sha(Path(_ADMISSION_BINDING[0].__file__).read_bytes())!=EXPECTED['production/gpx_admission.py']:raise RuntimeError('Provider shared admission origin differs.')
    prefix=_core_prefix();loaded={name:obj for name,obj in sys.modules.items() if name==prefix or name.startswith(prefix+'.')}
    if _CORE_REGISTRY is None:
        if loaded:raise RuntimeError('Provider private core alias occupied before trusted load.')
    elif set(loaded)!=set(_CORE_REGISTRY) or any(not _same(n,binding) for n,binding in _CORE_REGISTRY.items()) or _MODEL._CORE is not _CORE_REGISTRY[prefix+'.cross_trail_predictor'][0]:
        raise RuntimeError('Provider loaded private model registry differs.')

def load_core():
    global _CORE_REGISTRY
    verify();core=_MODEL._load_core()
    if _CORE_REGISTRY is None:
        prefix=_core_prefix();loaded={name:obj for name,obj in sys.modules.items() if name==prefix or name.startswith(prefix+'.')}
        expected={prefix:None,prefix+'.trail_planner':str(ROOT/'core_snapshot/trail_planner/__init__.py'),prefix+'.trail_planner.gpx':str(ROOT/'core_snapshot/trail_planner/gpx.py'),prefix+'.trail_planner.geometry':str(ROOT/'core_snapshot/trail_planner/geometry.py'),prefix+'.trail_planner.planning':str(ROOT/'core_snapshot/trail_planner/planning.py'),prefix+'.cross_trail_predictor':str(ROOT/'core_snapshot/cross_trail_predictor.py')}
        if set(loaded)!=set(expected) or loaded[prefix+'.cross_trail_predictor'] is not core:raise RuntimeError('Provider trusted core load family differs.')
        for name,obj in loaded.items():
            file=getattr(obj,'__file__',None)
            if file!=expected[name] or getattr(obj,'__spec__',None) is not None:raise RuntimeError('Provider trusted core origin differs.')
        _CORE_REGISTRY={name:_capture(obj) for name,obj in loaded.items()}
    verify();return core

def bootstrap(shared_modules,shared_admission_path,manifest_sha):
    """Path is a fixed trusted-host argument, never a field in request data."""
    global _INSTALLED,_MODEL,_ADAPTER,_GUARD_SHA,_ADMISSION_BINDING
    if _INSTALLED:raise RuntimeError('Provider one-shot host binding already installed.')
    if type(manifest_sha) is not str or len(manifest_sha)!=64 or any(c not in '0123456789abcdef' for c in manifest_sha):raise RuntimeError('Trusted fixed manifest binding absent.')
    if type(shared_modules) is not dict or type(shared_admission_path) is not str:raise RuntimeError('Trusted shared registry absent.')
    admission=shared_modules.get('gpx_admission')
    if admission is None or sys.modules.get('gpx_admission') is not admission or str(Path(admission.__file__).resolve())!=shared_admission_path or getattr(admission,'__spec__',None) is None or str(Path(admission.__spec__.origin).resolve())!=shared_admission_path or _sha(Path(admission.__file__).read_bytes())!=EXPECTED['production/gpx_admission.py']:raise RuntimeError('Provider trusted shared admission differs.')
    prefix=_core_prefix()
    if any(name==prefix or name.startswith(prefix+'.') for name in sys.modules):raise RuntimeError('Provider private core alias occupied before bootstrap.')
    if any(name in sys.modules for name in ['_ridgeq_provider_history_model','_ridgeq_provider_history_adapter']):raise RuntimeError('Provider private bootstrap alias occupied.')
    _check_files();_GUARD_SHA=_sha(Path(__file__).read_bytes());_ADMISSION_BINDING=_capture(admission)
    _MODEL=_load('_ridgeq_provider_history_model',ROOT/'multi_history_reference.py')
    _ADAPTER=_load('_ridgeq_provider_history_adapter',ROOT/'worker_adapter.py')
    if _MODEL.CORE_ROOT!=ROOT/'core_snapshot':raise RuntimeError('Provider core path differs.')
    _INSTALLED=True;verify();_ADAPTER.install(_MODEL,admission,load_core,verify,manifest_sha,load_hybrid)
    return _ADAPTER.handle_request

_HYBRID=None
def load_hybrid():
    global _HYBRID
    core=load_core();verify()
    if _HYBRID is None:
        name='_ridgeq_provider_history_hybrid'
        if name in sys.modules:raise RuntimeError('Provider private hybrid alias occupied.')
        module=types.ModuleType(name);module.__file__=str(ROOT/'hybrid_trail_scenario.py');module.__package__=''
        package=sys.modules[_core_prefix()+'.trail_planner']
        def private_import(name,globals=None,locals=None,fromlist=(),level=0):
            if level==0 and name=='cross_trail_predictor':return core
            if level==0 and (name=='trail_planner' or name.startswith('trail_planner.')):
                return sys.modules[_core_prefix()+'.'+name] if fromlist else package
            return builtins.__import__(name,globals,locals,fromlist,level)
        module.__dict__['__builtins__']={**vars(builtins),'__import__':private_import}
        sys.modules[module.__name__]=module
        exec(compile((ROOT/'hybrid_trail_scenario.py').read_bytes(),module.__file__,'exec'),module.__dict__)
        _HYBRID=module;_REGISTRY[module.__name__]=_capture(module)
    verify();return _HYBRID
