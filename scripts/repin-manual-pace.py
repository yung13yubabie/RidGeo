"""Explicit reviewed-source pin generation. Read-only checks are separate.

Run only after reviewing manual_pace_adapter.py. This does not change core/model
sources, weaken a runtime verifier, or qualify individual recovery parameters.
"""
from pathlib import Path
import ast
import hashlib
import json
import re
ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'
def sha(data):return hashlib.sha256(data).hexdigest()
def write_json(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def replace_one(path,pattern,replacement):
    result,n=re.subn(pattern,replacement,path.read_text())
    assert n==1,(path,n)
    path.write_text(result)

core=json.loads((PUBLIC/'python/core-manifest.json').read_text())
for name,digest in core['files'].items():assert sha((PUBLIC/'python/trail_planner'/name).read_bytes())==digest
source=(PUBLIC/'python/manual_pace_adapter.py').read_bytes()
# The live adapter now has a separately qualified optional hiking dependency.
# The legacy capsule remains its independently pinned running-only snapshot.
if b'from hiking_reference import' in source:
    raise SystemExit('Refusing to copy the live hiking-aware manual adapter into the frozen conditional capsule. Review the live sources, then use python scripts/repin-hiking-reference.py for live-only pins. Capsule changes require a separate reviewed integration.')
manual={'sha256':sha(source),'bytes':len(source)}
mp=PUBLIC/'python/manual-pace-manifest.json'
m=json.loads(mp.read_text());assert m['requires_existing_core']==core['files'];m['sha256']=manual['sha256'];write_json(mp,m)
(PUBLIC/'python/conditional_preview/production/manual_pace_adapter.py').write_bytes(source)
guard=PUBLIC/'python/conditional_preview/runtime_integrity.py'
replace_one(guard,r"'production/manual_pace_adapter.py': \{'sha256': '[0-9a-f]{64}', 'bytes': \d+\}","'production/manual_pace_adapter.py': "+repr(manual))
files=next(ast.literal_eval(s.value) for s in ast.parse(guard.read_text()).body if isinstance(s,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='FILES' for t in s.targets))
for name,spec in files.items():
    data=(guard.parent/name).read_bytes();assert spec=={'sha256':sha(data),'bytes':len(data)},name
member_sha=sha(json.dumps(files,sort_keys=True,separators=(',',':')).encode());guard_sha=sha(guard.read_bytes())
cm=PUBLIC/'python/conditional-preview-manifest.json'
c=json.loads(cm.read_text());assert c['requires_existing_core']==core['files'];c['files']={**files,'runtime_integrity.py':{'sha256':guard_sha,'bytes':guard.stat().st_size}};c['files']=dict(sorted(c['files'].items()));c['total_bytes']=sum(x['bytes'] for x in c['files'].values());write_json(cm,c)
manifest_sha=sha(cm.read_bytes())
replace_one(PUBLIC/'conditional-preview-engine.mjs',r'(CONDITIONAL_MANIFEST_SHA256=")[a-f0-9]{64}(";)',r'\g<1>'+manifest_sha+r'\2')
rp=PUBLIC/'conditional-preview-receipt.mjs';text=rp.read_text();match=re.search(r'const INSTALLED_CAPSULE=(\{.*?\});',text);assert match
installed=json.loads(match.group(1));installed.update(member_set_sha256=member_sha,guard_sha256=guard_sha)
replace_one(rp,r'const INSTALLED_CAPSULE=\{.*?\};','const INSTALLED_CAPSULE='+json.dumps(installed,separators=(',',':'))+';')
replace_one(PUBLIC/'conditional-forward-receipt.mjs',r"(b.runtime_guard_sha256===')[a-f0-9]{64}(')",r'\g<1>'+guard_sha+r'\2')
replace_one(PUBLIC/'python/conditional_forward/forward_adapter.py',r"(GUARD_SHA = ')[a-f0-9]{64}(')",r'\g<1>'+guard_sha+r'\2')
replace_one(ROOT/'checks/conditional-runtime/native-bootstrap.py',r"(EXPECTED_MANIFEST_SHA256=')[a-f0-9]{64}(')",r'\g<1>'+manifest_sha+r'\2')
print(json.dumps(dict(manual=manual,guard_sha256=guard_sha,manifest_sha256=manifest_sha,member_set_sha256=member_sha)))
