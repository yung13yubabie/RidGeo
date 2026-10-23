"""After review, update live hiking/manual pins without touching frozen capsules."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public/python'
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
core = json.loads((PUBLIC / 'core-manifest.json').read_text())
for name, digest in core['files'].items():
    assert sha(PUBLIC / 'trail_planner' / name) == digest, name
hiking_path, manual_path = PUBLIC / 'hiking-reference-manifest.json', PUBLIC / 'manual-pace-manifest.json'
hiking, manual = json.loads(hiking_path.read_text()), json.loads(manual_path.read_text())
assert hiking['schema_version'] == 'hiking-reference/1.0'
assert hiking['file'] == 'hiking_reference.py'
assert hiking['model_version'] == 'campbell2022-hiking-reference-goal-v1'
assert hiking['requires_existing_core'] == manual['requires_existing_core'] == core['files']
assert manual['schema_version'] == 'manual-moving-pace-clock/1.0'
assert manual['file'] == 'manual_pace_adapter.py'
assert b'from hiking_reference import' in (PUBLIC / 'manual_pace_adapter.py').read_bytes()
admission = json.loads((PUBLIC / 'gpx-admission-manifest.json').read_text())
assert manual['requires_gpx_admission_sha256'] == admission['sha256'] == sha(PUBLIC / 'gpx_admission.py')
hiking['sha256'] = sha(PUBLIC / 'hiking_reference.py')
manual['sha256'] = sha(PUBLIC / 'manual_pace_adapter.py')
manual['requires_hiking_reference_sha256'] = hiking['sha256']
for path, value in ((hiking_path, hiking), (manual_path, manual)):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'hiking_sha256': hiking['sha256'], 'manual_sha256': manual['sha256'], 'frozen_capsules_changed': False}))
