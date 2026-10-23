"""Bounded LocalGPX selection adapter. All event/time/effort declarations remain unverified.
No account access, physiological defaults, pause/rest inference or source mutation.
"""
import base64
import hashlib
import json
import math
import re
from datetime import datetime, timezone
from time import monotonic
from xml.parsers import expat

SCHEMA='selected-history-worker-result/0.1'
REQUEST_SCHEMA='selected-history-request/0.1'
MAX_REQUEST_BYTES=17*1024*1024
MAX_OWNER_BYTES=128*1024
MAX_RESPONSE_BYTES=16*1024*1024
MAX_TARGET_CELLS=15000
MAX_NODES=10000
MAX_RESPONSE_NODES=1000000
_MODEL=None
_ADMISSION=None
_CORE_LOADER=None
_INTEGRITY=None
_MANIFEST_SHA=None
TIME_RE=re.compile(r'^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})$',re.ASCII)

def install(model, admission, core_loader, integrity, manifest_sha):
    global _MODEL,_ADMISSION,_CORE_LOADER,_INTEGRITY,_MANIFEST_SHA
    if _MODEL is not None:raise RuntimeError('History wrapper already installed.')
    _MODEL,_ADMISSION,_CORE_LOADER,_INTEGRITY,_MANIFEST_SHA=model,admission,core_loader,integrity,manifest_sha

class Refusal(ValueError):
    def __init__(self,code,message,role='request',selection_id=None,source_sha256=None,admission=False):
        super().__init__(message);self.code=code;self.role=role;self.selection_id=selection_id;self.source_sha256=source_sha256;self.admission=admission

def refuse(code,message,**kw):raise Refusal(code,message,**kw)
def sha(raw):return hashlib.sha256(raw).hexdigest()
def scalar(text,max_bytes):
    if type(text) is not str:refuse('history_request_invalid','Text must be an exact string.')
    try:raw=text.encode('utf-8')
    except UnicodeError:refuse('history_request_invalid','Non-scalar Unicode is invalid.')
    if len(raw)>max_bytes:refuse('history_request_too_large','UTF8 text exceeds its byte budget.')
    return raw

def fields(value,keys):
    if type(value) is not dict or len(value)!=len(keys):refuse('history_request_invalid','Exact bounded fields are required.')
    if any(type(k) is not str or k not in keys for k in value):refuse('history_request_invalid','Unexpected fields are invalid.')

def parse(text,limit,max_nodes=MAX_NODES):
    scalar(text,limit)
    def pairs(items):
        result={}
        for k,v in items:
            if k in result:refuse('history_request_invalid','Duplicate JSON fields are invalid.')
            result[k]=v
        return result
    try:root=json.loads(text,object_pairs_hook=pairs,parse_constant=lambda _:refuse('history_request_invalid','Nonfinite JSON is invalid.'))
    except Refusal:raise
    except (ValueError,TypeError,RecursionError):refuse('history_request_invalid','Malformed JSON is invalid.')
    budget=[0]
    def walk(v,depth):
        budget[0]+=1
        if budget[0]>max_nodes or depth>12:refuse('history_request_budget','JSON node/depth budget exceeded.')
        if type(v) is str:scalar(v,MAX_REQUEST_BYTES)
        elif v is None or type(v) is bool:pass
        elif type(v) in (int,float):
            try:valid=math.isfinite(v)
            except (OverflowError,TypeError):valid=False
            if not valid:refuse('history_request_invalid','Numbers must be finite.')
        elif type(v) is dict:
            for k,item in v.items():scalar(k,256);walk(item,depth+1)
        elif type(v) is list:
            for item in v:walk(item,depth+1)
        else:refuse('history_request_invalid','Built-in JSON data required.')
    walk(root,0);return root

def decode(value,expected,role,selection_id=None):
    if type(value) is not str or len(value)>6990508 or not value or len(value)%4:refuse('history_gpx_input_invalid','GPX base64 size/encoding is invalid.',role=role,selection_id=selection_id)
    try:raw=base64.b64decode(value,validate=True)
    except (ValueError,TypeError):refuse('history_gpx_input_invalid','GPX base64 encoding is invalid.',role=role,selection_id=selection_id)
    digest=sha(raw)
    if type(expected) is not str or len(expected)!=64 or any(c not in '0123456789abcdef' for c in expected) or digest!=expected:refuse('history_gpx_hash_mismatch','Exact GPX identity differs.',role=role,selection_id=selection_id,source_sha256=digest)
    if not 0<len(raw)<=5*1024*1024:refuse('history_gpx_bytes_exceeded','GPX exceeds5MiB.',role=role,selection_id=selection_id,source_sha256=digest)
    return raw

def admit(raw,role,selection_id=None):
    try:_ADMISSION.validate_gpx_admission(raw)
    except ValueError as e:
        if not hasattr(e,'code'):raise
        refuse(e.code,str(e),role=role,selection_id=selection_id,source_sha256=sha(raw),admission=True)

def inspect_timing(raw):
    """Original recorded instants only. Never compute moving/all-stop/rest time."""
    stack=[];state={'namespace':None,'point':None,'points':0,'valid':0,'first':None,'last':None,'bad':False,'present':False,'completed_local_date':None}
    parser=expat.ParserCreate(namespace_separator='}')
    def split(tag):return tuple(tag.rsplit('}',1)) if '}' in tag else ('',tag)
    def start(tag,attrs):
        ns,local=split(tag);stack.append((ns,local))
        if len(stack)==1:state['namespace']=ns
        path=tuple(local for ns,local in stack);same=all(ns==state['namespace'] for ns,local in stack)
        if same and path in [('gpx','trk','trkseg','trkpt'),('gpx','rte','rtept')]:
            state['points']+=1;state['point']={'path':path,'times':[]}
        if same and state['point'] and path==state['point']['path']+('time',):state['point']['times'].append([]);state['present']=True
        elif state['point'] and state['point']['times'] and len(path)>len(state['point']['path'])+1 and path[len(state['point']['path'])]=='time':state['bad']=True
    def chars(text):
        p=state['point']
        if p and p['times'] and all(ns==state['namespace'] for ns,local in stack) and tuple(local for ns,local in stack)==p['path']+('time',):
            buf=p['times'][-1]
            if sum(map(len,buf))+len(text)>128:state['bad']=True
            else:buf.append(text)
    def end(tag):
        p=state['point'];path=tuple(local for ns,local in stack)
        if p and path==p['path']:
            if len(p['times'])!=1:state['bad']=True
            else:
                text=''.join(p['times'][0]).strip()
                try:
                    match=TIME_RE.fullmatch(text)
                    if not match or (match[5] and len(match[5])>7):raise ValueError('Calendar timestamp/precision unsupported.')
                    offset=match[6]
                    if offset=='-00:00' or (offset!='Z' and (int(offset[1:3])>14 or int(offset[4:6])>59 or (int(offset[1:3])==14 and int(offset[4:6])!=0))):raise ValueError('Offset unknown/unsupported.')
                    instant=datetime.fromisoformat(text.replace('Z','+00:00'))
                    instant=instant.astimezone(timezone.utc)
                    if state['last'] is not None and instant<state['last']:raise ValueError('Nonmonotone time.')
                    if state['first'] is None:state['first']=instant
                    state['last']=instant;state['valid']+=1;state['completed_local_date']=text[:10]
                except (ValueError,OverflowError):state['bad']=True
            state['point']=None
        stack.pop()
    parser.StartElementHandler=start;parser.CharacterDataHandler=chars;parser.EndElementHandler=end;parser.Parse(raw,True)
    complete=not state['bad'] and state['points']>0 and state['valid']==state['points'] and state['last']>state['first']
    return dict(state='complete_offset_timed' if complete else 'partial_or_unqualified' if state['present'] else 'none',source_point_count=state['points'],valid_timestamp_count=state['valid'],first_utc=state['first'].isoformat() if complete else None,last_utc=state['last'].isoformat() if complete else None,moving_time_inferred=False,nonmoving_time_inferred=False,completed_local_date=state['completed_local_date'] if complete else None)

def activity_instant(text):
    if type(text) is not str or len(text)>40:refuse('history_activity_time_invalid','Supply a precise calendar timestamp with a known offset.')
    m=TIME_RE.fullmatch(text)
    if not m or (m[5] and len(m[5])>7):refuse('history_activity_time_invalid','Supply at most six fractional digits and a known offset.')
    off=m[6]
    if off=='-00:00' or (off!='Z' and (int(off[1:3])>14 or int(off[4:6])>59 or (int(off[1:3])==14 and int(off[4:6])!=0))):refuse('history_activity_time_invalid','Unknown or invalid timestamp offset.')
    try:value=datetime.fromisoformat(text.replace('Z','+00:00')).astimezone(timezone.utc)
    except (ValueError,OverflowError):refuse('history_activity_time_invalid','Invalid calendar timestamp.')
    return value

def calendar_date(text):
    try:
        if type(text) is not str or not re.fullmatch(r'\d{4}-\d{2}-\d{2}',text,re.ASCII):raise ValueError()
        value=datetime.fromisoformat(text)
    except (ValueError,OverflowError):refuse('history_activity_date_invalid','Supply the real completion calendar date.')
    return text

def activity_key(row):
    a=row.get('activity_identity')
    if a is None:return 'sha_'+row['gpx_sha256']
    fields(a,{'mode','started_at','ended_at'})
    if a['mode']!='declared_activity':refuse('history_activity_identity_invalid','Unknown activity identity mode.')
    if (a['started_at'] is None)!=(a['ended_at'] is None):refuse('history_activity_interval_incomplete','Supply both activity interval boundaries or leave both unknown.')
    if a['started_at'] is None:return 'route_'+row['gpx_sha256']+'_'+calendar_date(row['evidence']['reference_completed_on'])
    first,last=activity_instant(a['started_at']),activity_instant(a['ended_at'])
    if first>=last:refuse('history_activity_interval_invalid','Activity end must follow its start.')
    def key(t):return re.sub(r'[-:.+]','',t.isoformat(timespec='microseconds'))
    return 'interval_'+key(first)+'_'+key(last)

def validate_activity_rows(rows,timings):
    identities=[];intervals=[]
    for row,t in zip(rows,timings):
        try:
            completed=calendar_date(row['evidence']['reference_completed_on']);identity=activity_key(row);a=row.get('activity_identity');first=last=None
            if a is not None and t['state']!='none':refuse('history_timed_route_reuse_forbidden','A GPX containing recorded point times cannot be relabeled as another activity.')
            if a is not None and a['started_at'] is not None:
                first,last=activity_instant(a['started_at']),activity_instant(a['ended_at'])
                if a['ended_at'][:10]!=completed:refuse('history_activity_completion_mismatch','Completion date must equal the explicitly supplied local activity end date.')
            elif t['state']=='complete_offset_timed':
                first,last=activity_instant(t['first_utc']),activity_instant(t['last_utc'])
                if t['completed_local_date']!=completed:refuse('history_activity_completion_mismatch','Completion date contradicts the original recorded local end date.')
            if first is not None:
                span=(last-first).total_seconds()
                for k in ('reference_moving_s','reference_elapsed_s'):
                    if row['evidence'][k] is not None and row['evidence'][k]>span:refuse('history_activity_duration_conflict','Declared duration exceeds the known activity interval; unknown stops are never inferred.')
            identities.append(identity);intervals.append((first,last))
        except Refusal as e:
            e.role='history';e.selection_id=row['selection_id'];e.source_sha256=row['gpx_sha256'];raise
    for i in range(len(rows)):
        for j in range(i):
            if identities[i]==identities[j]:continue
            first,last=intervals[i];other_first,other_last=intervals[j]
            if first is not None and other_first is not None and max(first,other_first)<min(last,other_last):refuse('history_recorded_time_overlap','Selected known activity intervals overlap; a distinct declaration cannot waive this.',role='history',selection_id=rows[i]['selection_id'],source_sha256=rows[i]['gpx_sha256'])
            if rows[i]['gpx_sha256']==rows[j]['gpx_sha256'] and (rows[i].get('activity_identity') is not None or rows[j].get('activity_identity') is not None) and rows[i]['evidence']['reference_completed_on']==rows[j]['evidence']['reference_completed_on'] and (first is None or other_first is None):refuse('history_activity_same_day_ambiguous','Same-route activities on the same date require precise nonoverlapping intervals for both; otherwise keep one record.',role='history',selection_id=rows[i]['selection_id'],source_sha256=rows[i]['gpx_sha256'])
    return identities

def observation(value,source):return dict(state='null' if value is None else 'valid',value=value,source=source,invalid_reason=None)
def declared_record(row,raw,subject,request_sha):
    e=row['evidence'];q=row['qualification'];digest=sha(raw)
    snapshot=dict(gpx_sha256=digest,evidence=e,qualification=q,distinct_activity_confirmed=row['distinct_activity_confirmed'])
    snapshot_sha=request_sha # Exact original request text is the host-owned declaration snapshot; no cross-runtime numeric canonicalization.
    identity={'provider':'LocalGPX','activity_id':activity_key(row)}
    return dict(activity_key={**identity,'subject_namespace':subject},reference_gpx=raw,evidence=e,qualification=q,
        source_observations=dict(schema_version='offline-history-observations/0.1',identity=identity,source_snapshot_sha256=snapshot_sha,declared_gpx_sha256=digest,completed_on_source='Explicit user-declared completed calendar date; externally unverified',start_date_local=None,moving_time=observation(e.get('reference_moving_s'),'Explicit user-declared moving time; externally unverified'),elapsed_time=observation(e.get('reference_elapsed_s'),'Explicit user-declared elapsed time; externally unverified'),official_distance=observation(None,'No official source distance supplied'),recording_stops=dict(state='omitted',raw=None,source='No provider recording-stop observation supplied',interpretation='uninterpreted',invalid_reason=None),known_stops=None if e.get('reference_stops_s') is None else dict(duration_s=e['reference_stops_s'],source='Explicit user-declared all nonmoving time; not CP rest/service',evidence_sha256=snapshot_sha),pause_time_s=None),
        source_assessment=dict(schema_version='offline-history-assessment/0.1',kind='local_gpx_explicit',normalizer_schema_version=None,status='usable',upstream_source='LOCAL_GPX_USER_DECLARED',provenance_known=True,source_supported=True,historical_performance_eligible=True,rights_guarantee=False,quality=[],binding=dict(scope='whole_activity',gpx_sha256=digest,normalized_path_sha256=None,path_sample_binding_sha256=None)))

def encode(response):
    # The admitted target rows and<=8 forwards bound full construction; this is transfer/node admission.
    stack=[(response,0)];nodes=0
    while stack:
        value,depth=stack.pop();nodes+=1
        if nodes>MAX_RESPONSE_NODES or depth>32:refuse('history_response_budget','Response node/depth budget exceeded.')
        if type(value) is dict:stack.extend((v,depth+1) for v in value.values())
        elif type(value) is list:stack.extend((v,depth+1) for v in value)
    text=json.dumps(response,ensure_ascii=True,allow_nan=False,separators=(',',':'))
    if len(text.encode())>MAX_RESPONSE_BYTES:refuse('history_response_budget','Response UTF8 transfer budget exceeded.')
    return text

def handle_request(request_json,metadata_json):
    started=monotonic();request_hash=None;meta=None
    try:
        if _MODEL is None:raise RuntimeError('Trusted history runtime absent.')
        _INTEGRITY()
        request_hash=sha(scalar(request_json,MAX_REQUEST_BYTES));meta=parse(metadata_json,1024*1024)
        fields(meta,{'request_sha256','owner_snapshot_json','owner_snapshot_sha256','owner_generation','correlation','initialization_elapsed_s'})
        if meta['request_sha256']!=request_hash or sha(scalar(meta['owner_snapshot_json'],MAX_OWNER_BYTES))!=meta['owner_snapshot_sha256']:refuse('history_owner_binding_mismatch','Exact request/owner text differs.')
        parse(meta['owner_snapshot_json'],MAX_OWNER_BYTES,50000)
        fields(meta['correlation'],{'generation','request_id'})
        if any(type(v) is not int or v<=0 for v in [meta['owner_generation'],*meta['correlation'].values()]):refuse('history_owner_binding_mismatch','Positive owner/dispatch correlation required.')
        init=meta['initialization_elapsed_s']
        if type(init) not in (int,float) or not math.isfinite(init) or init<0:refuse('history_owner_binding_mismatch','Invalid initialization accounting.')
        request=parse(request_json,MAX_REQUEST_BYTES);fields(request,{'schema_version','subject_namespace','target_gpx_b64','target_sha256','records','assumptions','limits'}|({'identity_only'} if 'identity_only' in request else set()))
        if 'identity_only' in request and request['identity_only'] is not True:refuse('history_request_invalid','Identity-only mode must be exactly true.')
        if request['schema_version']!=REQUEST_SCHEMA:refuse('history_request_invalid','Unknown selected-history schema.')
        subject=request['subject_namespace']
        if type(subject) is not str or not 1<=len(subject)<=128 or any(c not in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-' for c in subject):refuse('history_request_invalid','Application subject namespace is invalid.')
        fields(request['limits'],{'max_wall_s'});wall=request['limits']['max_wall_s']
        if type(wall) not in (int,float) or not math.isfinite(wall) or not 0<wall<=120:refuse('history_deadline_invalid','Total deadline must be positive and<=120s.')
        def deadline():
            if monotonic()-started+init>=wall:refuse('history_deadline_exceeded','Initialization/admission/computation deadline expired.')
        deadline();rows=request['records']
        if type(rows) is not list or not 1<=len(rows)<=8:refuse('history_selection_too_large','Select1..8 supplied records; no truncation.')
        if request.get('identity_only') and len(rows)!=1:refuse('history_identity_singleton_required','Identity-only preflight is restricted to one selected activity.')
        target=decode(request['target_gpx_b64'],request['target_sha256'],'target');total=len(target);raws=[];ids=set()
        for row in rows:
            fields(row,{'selection_id','gpx_b64','gpx_sha256','evidence','qualification','distinct_activity_confirmed'}|({'activity_identity'} if 'activity_identity' in row else set()));sid=row['selection_id']
            if type(sid) is not str or not 1<=len(sid)<=96 or any(c not in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-' for c in sid) or sid in ids:refuse('history_selection_id_invalid','Unique application selection IDs required.')
            ids.add(sid)
            if type(row['distinct_activity_confirmed']) is not bool or (not row['distinct_activity_confirmed'] and not (request.get('identity_only') is True and len(rows)==1)):refuse('history_distinct_activity_unconfirmed','Declare distinct complete activities before multi aggregation.',role='history',selection_id=sid)
            # Exact qualification is a declaration, never derived from a label/file-load.
            fields(row['qualification'],{'original_classification','selected_classification','classification_source','high_effort_reference_confirmed','route_time_scope_confirmed'})
            e=row['evidence'];fields(e,{'reference_completed_on','forecast_as_of','target_start','reference_moving_s','reference_elapsed_s','reference_stops_s','reference_is_actual','comparable_conditions_confirmed'})
            for k in ('reference_completed_on','forecast_as_of','target_start'):
                if type(e[k]) is not str or len(e[k])!=10 or not re.fullmatch(r'\d{4}-\d{2}-\d{2}',e[k],re.ASCII):refuse('prediction_evidence_schema','Calendar date text required.',role='history',selection_id=sid)
            for k in ('reference_is_actual','comparable_conditions_confirmed'):
                if type(e[k]) is not bool:refuse('prediction_evidence_schema','Exact evidence booleans required.',role='history',selection_id=sid)
            for k in ('reference_moving_s','reference_elapsed_s','reference_stops_s'):
                if e[k] is not None and (type(e[k]) not in (int,float) or not math.isfinite(e[k]) or e[k]<0):refuse('prediction_evidence_schema','Finite nonnegative or unknown time required.',role='history',selection_id=sid)
            q=row['qualification']
            if q['selected_classification'] not in ('race','benchmark','easy','unclassified') or any(type(q[k]) is not bool for k in ('high_effort_reference_confirmed','route_time_scope_confirmed')):refuse('history_local_qualification_invalid','Exact classification/declaration types required.',role='history',selection_id=sid)
            if q['original_classification']!='unclassified' or q['classification_source']!='explicit_user_confirmation':refuse('history_local_qualification_invalid','Local original classification remains unclassified.',role='history',selection_id=sid)
            raw=decode(row['gpx_b64'],row['gpx_sha256'],'history',sid);total+=len(raw);raws.append(raw)
        if total>12*1024*1024:refuse('history_total_gpx_bytes_exceeded','All raw bytes including aliases/target exceed12MiB.')
        admit(target,'target');deadline();timings=[]
        for row,raw in zip(rows,raws):admit(raw,'history',row['selection_id']);timings.append(inspect_timing(raw));deadline()
        identities=validate_activity_rows(rows,timings)
        target_cells=0
        if not request.get('identity_only'):
            core=_CORE_LOADER();route=core.parse_gpx(target);geometry=core.build_geometry(route)
            if len(geometry.cells)>MAX_TARGET_CELLS:refuse('history_target_cell_budget','New selected-history response family permits<=15000target cells.',role='target',source_sha256=sha(target))
            target_cells=len(geometry.cells);del geometry,route
        deadline()
        records=[declared_record(row,raw,subject,request_hash) for row,raw in zip(rows,raws)]
        result=None if request.get('identity_only') else _MODEL.predict_multi_from_gpx(records,target,request['assumptions']);deadline();_INTEGRITY()
        envelope=dict(schema_version=SCHEMA,runtime_manifest_sha256=_MANIFEST_SHA,operation='selected_history_predict',request_sha256=request_hash,owner_snapshot_sha256=meta['owner_snapshot_sha256'],owner_generation=meta['owner_generation'],correlation=meta['correlation'],target_sha256=sha(target),selection=[dict(selection_id=row['selection_id'],gpx_sha256=sha(raw),timing=timing,activity_key=dict(provider='LocalGPX',subject_namespace=subject,activity_id=identity),activity_identity=row.get('activity_identity')) for row,raw,timing,identity in zip(rows,raws,timings,identities)],reference=result,capabilities=dict(application_binding='verified_exact_request_bytes',external_event_identity='unverified_user_declared',empirical_calibration=False,recovery_prediction=False,personal_best_rest=False),resources=dict(raw_gpx_bytes=total,target_cells=target_cells,max_target_cells=0 if request.get('identity_only') else MAX_TARGET_CELLS,max_response_bytes=MAX_RESPONSE_BYTES,max_wall_s=wall,initialization_elapsed_s=init,wrapper_elapsed_s=monotonic()-started))
        if request.get('identity_only'):envelope['identity_only']=True
        return encode({'ok':True,'result':envelope})
    except Refusal as e:
        return json.dumps({'ok':False,'error':{'code':e.code,'message':str(e),'admission_rejected':e.admission,'details':{'source_role':e.role,'selection_id':e.selection_id,'source_sha256':e.source_sha256,'request_sha256':request_hash,'owner_snapshot_sha256':None if type(meta) is not dict else meta.get('owner_snapshot_sha256'),'owner_generation':None if type(meta) is not dict else meta.get('owner_generation'),'correlation':None if type(meta) is not dict else meta.get('correlation')}}},ensure_ascii=True,separators=(',',':'))
