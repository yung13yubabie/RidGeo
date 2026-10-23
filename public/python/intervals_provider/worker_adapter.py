"""Intervals source family. Derived GPX is internal geometry, never original/local activity evidence."""
import base64,hashlib,json,math,re,struct
from decimal import Decimal
from datetime import datetime,timezone,timedelta
from time import monotonic
_MODEL=_ADMISSION=_CORE_LOADER=_INTEGRITY=_MANIFEST_SHA=_HYBRID_LOADER=None
ACTIVITY_FIELDS={'schemaVersion','status','metadata','provenance','quality','samples','path','eligibility','sourceObservations','choiceId','choiceAliases','providerIdentity','classificationEvidence','sourceSummaryObservations','coverage','providerReferenceEligibility','observedSnapshot'}
QUAL_FIELDS={'completed_on','actual','comparable','whole_route_confirmed','high_effort_confirmed','reference_kind','classification_overridden','distinct_activity_confirmed'}
HOST_FIELDS={'schema_version','context_id','account_namespace','grant_epoch','source_policy_revision'}
NUMBER_RE=re.compile(r'(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)',re.ASCII)
CLASSES={'race','benchmark','easy','unclassified'}
class Refusal(ValueError):
 def __init__(self,code,role='request',selection_id=None,source_sha256=None,admission=False):super().__init__(code);self.code=code;self.role=role;self.selection_id=selection_id;self.source_sha256=source_sha256;self.admission=admission

def require(ok,code='invalid_provider_data',**kw):
 if not ok:raise Refusal(code,**kw)
def fields(v,keys):require(type(v) is dict and set(v)==set(keys))
def sha(raw):return hashlib.sha256(raw).hexdigest()
def finite(v):return type(v) in (int,float) and math.isfinite(v)
def machine(v,maxlen=128,minlen=1):return type(v) is str and re.fullmatch(r'[A-Za-z0-9_-]{'+str(minlen)+','+str(maxlen)+'}',v,re.ASCII) is not None
def digest(v):return type(v) is str and re.fullmatch(r'[a-f0-9]{64}',v,re.ASCII) is not None
def scalar(v,cap):
 require(type(v) is str);require(len(v)<=cap,'provider_representation_budget')
 try:raw=v.encode('utf-8')
 except UnicodeError:raise Refusal('provider_unicode_invalid')
 require(len(raw)<=cap,'provider_representation_budget');return raw

def parse(text,cap=33554432,nodes=10000,depth=12):
 scalar(text,cap);i=0;count=0;decoder=json.JSONDecoder();n=len(text)
 def ws():
  nonlocal i
  while i<n and text[i] in ' \n\r\t':i+=1
 def string():
  nonlocal i
  require(i<n and text[i]=='"','provider_json_invalid')
  try:v,end=decoder.raw_decode(text,i)
  except (ValueError,RecursionError):raise Refusal('provider_json_invalid')
  require(type(v) is str,'provider_json_invalid');scalar(v,cap);i=end;return v
 def value(d):
  nonlocal i,count
  count+=1;require(count<=nodes and d<=depth,'provider_node_budget');ws();require(i<n,'provider_json_invalid');c=text[i]
  if c=='"':return string()
  if c in '{[':
   i+=1;out={} if c=='{' else [];ws();end='}' if c=='{' else ']'
   if i<n and text[i]!=end:
    while True:
     if c=='{':
      ws();key=string();require(key not in out,'provider_duplicate_field');ws();require(i<n and text[i]==':','provider_json_invalid');i+=1;out[key]=value(d+1)
     else:out.append(value(d+1))
     ws()
     if i>=n or text[i]!=',':break
     i+=1
   require(i<n and text[i]==end,'provider_json_invalid');i+=1;return out
  m=NUMBER_RE.match(text,i);require(m is not None,'provider_json_invalid');token=m[0];i+=len(token)
  if token=='-0':return -0.0
  out=json.loads(token);require(type(out) not in (int,float) or finite(out),'provider_number_invalid');return out
 root=value(0);ws();require(i==n,'provider_json_invalid');return root,count

def install(model,admission,core_loader,integrity,manifest_sha,hybrid_loader):
 global _MODEL,_ADMISSION,_CORE_LOADER,_INTEGRITY,_MANIFEST_SHA,_HYBRID_LOADER
 require(_MODEL is None);_MODEL,_ADMISSION,_CORE_LOADER,_INTEGRITY,_MANIFEST_SHA,_HYBRID_LOADER=model,admission,core_loader,integrity,manifest_sha,hybrid_loader

def decode(value,expected,role,sid=None):
 require(type(value) is str and 0<len(value)<=6990508 and len(value)%4==0,'provider_gpx_input',role=role,selection_id=sid)
 try:raw=base64.b64decode(value,validate=True)
 except ValueError:raise Refusal('provider_gpx_input',role,sid)
 require(len(raw)<=5242880 and sha(raw)==expected,'provider_gpx_hash_mismatch',role=role,selection_id=sid,source_sha256=sha(raw));return raw

def admit(raw,role,sid=None):
 try:_ADMISSION.validate_gpx_admission(raw)
 except ValueError as e:
  if not hasattr(e,'code'):raise
  raise Refusal(e.code,role,sid,sha(raw),True)

def observation(o):
 fields(o,{'state','value'}|({'invalidType'} if 'invalidType' in o else set()));require(o['state'] in {'valid','null','omitted','invalid'});require(o['state']=='valid' or o['value'] is None)

def host(v):
 fields(v,HOST_FIELDS);require(v['schema_version']=='intervals-host-context/0.1' and machine(v['context_id'],96,16) and machine(v['account_namespace']) and machine(v['source_policy_revision']) and type(v['grant_epoch']) is int and 0<=v['grant_epoch']<=9007199254740991)

def validate_activity(a,h):
 fields(a,ACTIVITY_FIELDS);require(a['schemaVersion']=='intervals-history-v1' and a['status'] in {'usable','limited','rejected'})
 fields(a['metadata'],{'name','sport','startDateLocal','classification','elapsedTimeS','movingTimeS','pauseTimeS'});require(a['metadata']['classification'] in CLASSES)
 for k in ['elapsedTimeS','movingTimeS','pauseTimeS']:require(a['metadata'][k] is None or finite(a['metadata'][k]) and 0<=a['metadata'][k]<=259200)
 fields(a['provenance'],{'provider','upstreamSource','known','supported','rightsGuarantee'});require(a['provenance']['provider']=='Intervals.icu' and a['provenance']['rightsGuarantee'] is False)
 fields(a['providerIdentity'],{'provider','accountNamespace','activityId'});require(a['providerIdentity']['provider']=='Intervals.icu' and a['providerIdentity']['accountNamespace']==h['account_namespace'] and machine(a['providerIdentity']['activityId'],96))
 require(machine(a['choiceId'],96,16) and type(a['choiceAliases']) is list and 1<=len(a['choiceAliases'])<=8 and a['choiceAliases'][0]==a['choiceId'] and all(machine(v,96,16) for v in a['choiceAliases']))
 fields(a['eligibility'],{'routeGeometry','historicalPerformance','fitnessCoefficient'});require(a['eligibility']['fitnessCoefficient'] is False)
 require(type(a['quality']) is list and len(a['quality'])<=1000)
 for q in a['quality']:
  fields(q,{'code','severity','blocksFitness'}|set(q)&{'index','count','stream'});require(machine(q['code'],96) and q['severity'] in {'info','warning','error'} and type(q['blocksFitness']) is bool)
 fields(a['sourceSummaryObservations'],{'schemaVersion','source','fields'});ss=a['sourceSummaryObservations'];require(ss['schemaVersion']=='intervals-provider-summary-observations-v1' and ss['source']=='selected_activity_detail_before');fields(ss['fields'],{'start_date','start_date_local','timezone','elapsed_time','moving_time','icu_ignore_time','ignore_pace','race','sub_type'})
 for o in ss['fields'].values():observation(o)
 fields(a['classificationEvidence'],{'originalClassification','selectedClassification','classificationSource','highEffortReferenceConfirmed','wholeRouteTimeScopeConfirmed'});c=a['classificationEvidence'];require(c['originalClassification'] in CLASSES and c['selectedClassification'] in CLASSES and c['classificationSource'] in {'upstream','explicit_user_confirmation'} and c['highEffortReferenceConfirmed'] is False and c['wholeRouteTimeScopeConfirmed'] is False and c['selectedClassification']==a['metadata']['classification'])
 fields(a['sourceObservations'],{'schemaVersion','provider','officialSummaryDistance','recordingStops','knownStops','identity'});o=a['sourceObservations'];require(o['schemaVersion']=='intervals-history-source-observations-v1' and o['provider']=='Intervals.icu' and o['knownStops'] is None);fields(o['identity'],{'provider','activityId','verification'});require(o['identity']=={'provider':'Intervals.icu','activityId':a['providerIdentity']['activityId'],'verification':'not_verified_by_normalizer'})
 fields(o['officialSummaryDistance'],{'state','valueM','source','invalidReason'});fields(o['recordingStops'],{'state','raw','source','interpretation','invalidReason'});require(o['recordingStops']['interpretation']=='uninterpreted')
 for v,key in [(o['officialSummaryDistance'],'valueM'),(o['recordingStops'],'raw')]:require(v['state'] in {'valid','null','omitted','invalid'} and (v['state']=='valid' or v[key] is None))
 fields(a['providerReferenceEligibility'],{'structurallyComplete','qualification','performanceModelReady'});require(a['providerReferenceEligibility']['qualification']=='not_evaluated' and a['providerReferenceEligibility']['performanceModelReady'] is False)
 fields(a['coverage'],{'timeState','elapsedSummaryS','firstObservedElapsedS','lastObservedElapsedS','missingHeadS','missingTailS','temporalBlockingCodes','wholeRouteTimeScopeConfirmed','routeState','intervalState','firstUtc','lastUtc','intervalBasis','fullActivityIntervalVerified','movingTimeInferred','cpRestInferred'})
 s=a['observedSnapshot'];fields(s,{'schemaVersion','atomicRevisionVerified','provenanceBasis','relevantDetailUnchanged','detailBefore','streams','detailAfter','streamEditDetection'});require(s['schemaVersion']=='intervals-observed-snapshot-v1' and s['atomicRevisionVerified'] is False and s['provenanceBasis']=='trusted_server_owned_selected_GETs' and s['relevantDetailUnchanged'] is True)
 order=0
 for k in ['detailBefore','streams','detailAfter']:
  fields(s[k],{'sha256','bytes','readOrder'});require(digest(s[k]['sha256']) and type(s[k]['bytes']) is int and 1<=s[k]['bytes']<=8388608 and type(s[k]['readOrder']) is int and order<s[k]['readOrder']<=48);order=s[k]['readOrder']
 require(type(a['samples']) is list and len(a['samples'])<=50000)
 for p in a['samples']:
  fields(p,{'elapsedS','distanceM','lat','lon','ele','moving'});require(finite(p['elapsedS']) and 0<=p['elapsedS']<=259200 and finite(p['distanceM']) and 0<=p['distanceM']<=500000 and (type(p['moving']) is bool or p['moving'] is None))
  for k,low,high in [('lat',-90,90),('lon',-180,180),('ele',-1000,10000)]:require(p[k] is None or finite(p[k]) and low<=p[k]<=high)
 if a['path'] is not None:
  p=a['path'];fields(p,{'format','segments','pointCount'});require(p['format']=='route-points-v1' and type(p['segments']) is list and len(p['segments'])<=50000 and type(p['pointCount']) is int and 0<=p['pointCount']<=50000);count=0
  for seg in p['segments']:
   require(type(seg) is list and 1<=len(seg)<=50000)
   for v in seg:
    fields(v,{'lat','lon','ele'});count+=1
    for k,lo,hi in [('lat',-90,90),('lon',-180,180),('ele',-1000,10000)]:require(v[k] is None and k=='ele' or finite(v[k]) and lo<=v[k]<=hi)
  require(count==p['pointCount'])

def same_number(a,b):return a==b and (a!=0 or math.copysign(1,a)==math.copysign(1,b))
def replay(a):
 samples=a['samples'];segments=[];segment=[];indices=[];previous=None
 def flush():
  nonlocal segment
  if segment:segments.append(segment)
  segment=[]
 for i,s in enumerate(samples):
  require((s['lat'] is None)==(s['lon'] is None),'provider_sample_invalid')
  if previous:
   require(s['elapsedS']>previous['elapsedS'] and s['distanceM']>=previous['distanceM'],'provider_sample_order')
   if s['elapsedS']-previous['elapsedS']>30:flush()
  if s['lat'] is None:flush()
  else:segment.append({k:s[k] for k in ['lat','lon','ele']});indices.append(i)
  previous=s
 flush();p=a['path'];require(p is not None and p['pointCount']==len(indices) and len(p['segments'])==len(segments),'provider_path_mismatch')
 for x,y in zip(p['segments'],segments):
  require(len(x)==len(y),'provider_path_mismatch')
  for v,w in zip(x,y):
   for k in ['lat','lon','ele']:require(v[k] is None and w[k] is None or v[k] is not None and w[k] is not None and same_number(v[k],w[k]),'provider_path_mismatch')
 require(len(samples)>=2 and len(segments)==1 and len(indices)==len(samples) and all(s['ele'] is not None for s in samples) and samples[0]['elapsedS']==0 and samples[0]['distanceM']==0 and samples[-1]['distanceM']>0 and any(i and (s['lat']!=samples[i-1]['lat'] or s['lon']!=samples[i-1]['lon']) for i,s in enumerate(samples)),'provider_source_ineligible')
 require(a['status']=='usable' and a['provenance']['known'] is True and a['provenance']['supported'] is True and a['provenance']['upstreamSource']=='ZEPP' and a['eligibility']['historicalPerformance'] is True and not any(q['blocksFitness'] or q['severity']=='error' for q in a['quality']),'provider_source_ineligible')
 obs=a['sourceSummaryObservations']['fields'];el=obs['elapsed_time'];mv=obs['moving_time'];require(el['state']=='valid' and mv['state']=='valid' and finite(el['value']) and finite(mv['value']) and 0<mv['value']<=el['value']<=259200 and samples[-1]['elapsedS']==el['value'] and a['metadata']['elapsedTimeS']==el['value'] and a['metadata']['movingTimeS']==mv['value'] and a['metadata']['pauseTimeS']==el['value']-mv['value'],'provider_source_clock')
 require(not any(obs[k]['state']=='valid' and obs[k]['value'] is True for k in ['icu_ignore_time','ignore_pace']),'provider_source_ineligible')
 o=a['sourceObservations'];require(o['recordingStops']['state']!='invalid' and not o['recordingStops']['raw'] and o['officialSummaryDistance']['state']!='invalid','provider_source_ineligible');d=o['officialSummaryDistance']
 if d['state']=='valid':require(finite(d['valueM']) and 0<=d['valueM']<=500000 and abs(d['valueM']-samples[-1]['distanceM'])<=max(50,d['valueM']*.02),'provider_source_ineligible')
 c=a['coverage'];require(c['timeState']=='complete_exact_endpoints' and c['elapsedSummaryS']==el['value'] and c['firstObservedElapsedS']==0 and c['lastObservedElapsedS']==el['value'] and c['missingHeadS']==0 and c['missingTailS']==0 and c['temporalBlockingCodes']==[] and c['routeState']=='single_recorded_segment' and c['movingTimeInferred'] is False and c['cpRestInferred'] is False and c['wholeRouteTimeScopeConfirmed'] is False,'provider_coverage_mismatch')
 interval=observed_interval(obs['start_date'],samples[0]['elapsedS'],samples[-1]['elapsedS'])
 require(c['intervalState']==('known_observed_recorded_span' if interval else 'unknown') and c['firstUtc']==(interval[2] if interval else None) and c['lastUtc']==(interval[3] if interval else None) and c['fullActivityIntervalVerified']==(interval is not None),'provider_coverage_mismatch')
 u=lambda n:struct.pack('>I',n);f=lambda x:struct.pack('>d',x);nb=lambda x:b'\0' if x is None else b'\1'+f(x)
 path=b'ridgeq-intervals-path-v1\0'+u(len(segments))+b''.join(u(len(seg))+b''.join(f(p['lat'])+f(p['lon'])+nb(p['ele']) for p in seg) for seg in segments);path_hash=sha(path)
 binding=b'ridgeq-intervals-path-samples-v1\0'+bytes.fromhex(path_hash)+u(len(samples))+b''.join(f(s['elapsedS'])+f(s['distanceM'])+nb(s['lat'])+nb(s['lon'])+nb(s['ele'])+bytes([0 if s['moving'] is None else 2 if s['moving'] else 1]) for s in samples)+u(len(indices))+b''.join(u(i) for i in indices)
 # Fixed internal carrier. No user names, time synthesis, downsampling or service/rest inference.
 xml=['<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="RidGEQ Intervals derived geometry" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>Intervals derived geometry</name>']
 for seg in segments:
  xml.append('<trkseg>')
  for p in seg:xml.append('<trkpt lat="'+repr(float(p['lat']))+'" lon="'+repr(float(p['lon']))+'">'+('' if p['ele'] is None else '<ele>'+repr(float(p['ele']))+'</ele>')+'</trkpt>')
  xml.append('</trkseg>')
 xml.append('</trk></gpx>');raw=''.join(xml).encode();require(len(raw)<=5242880,'provider_derived_gpx_budget')
 return raw,dict(kind='derived_gpx_geometry_not_original_activity_file',schema_version='intervals-derived-gpx/0.1',sha256=sha(raw),bytes=len(raw),path_sha256=path_hash,path_sample_binding_sha256=sha(binding),path_points=len(indices),samples=len(samples),segments=len(segments)),interval

def observed_interval(obs,first,last):
 try:
  require(obs['state']=='valid' and type(obs['value']) is str);v=obs['value'];m=re.fullmatch(r'(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})',v,re.ASCII);require(m is not None);z=m[6];require(z!='-00:00' and (z=='Z' or int(z[1:3])<=14 and int(z[4:6])<=59 and (int(z[1:3])!=14 or int(z[4:6])==0)))
  start=datetime.fromisoformat(v.replace('Z','+00:00')).astimezone(timezone.utc);require(start.year>=1);fm=Decimal(str(first))*1000000;lm=Decimal(str(last))*1000000;require(fm==fm.to_integral() and lm==lm.to_integral());a=start+timedelta(microseconds=int(fm));b=start+timedelta(microseconds=int(lm));require(a<b and a.year>=1 and b.year<=9999)
  def text(x):return x.isoformat(timespec='microseconds').replace('+00:00','Z')
  return a,b,text(a),text(b)
 except (Refusal,ValueError,OverflowError):return None

def source_record(a,q,raw,binding,request_hash,dates):
 fields(q,QUAL_FIELDS);require(q['reference_kind'] in CLASSES and type(q['completed_on']) is str)
 for k in QUAL_FIELDS-{'reference_kind','completed_on'}:require(type(q[k]) is bool)
 c=a['classificationEvidence'];require(q['classification_overridden'] or q['reference_kind']==c['selectedClassification'],'provider_classification_mismatch')
 audit=dict(original_classification=c['originalClassification'],import_selected_classification=c['selectedClassification'],import_classification_source=c['classificationSource'],current_selected_classification=q['reference_kind'],current_classification_source='explicit_user_confirmation' if q['classification_overridden'] else c['classificationSource'])
 identity={'provider':'Intervals.icu','activity_id':a['providerIdentity']['activityId']};s=a['sourceSummaryObservations']['fields'];o=a['sourceObservations']
 def clock(k):v=s[k];return dict(state=v['state'],value=v['value'] if v['state']=='valid' else None,source='Activity.'+k,invalid_reason=None if v['state']!='invalid' else 'invalid_source_type')
 d=o['officialSummaryDistance'];rs=o['recordingStops'];e=dict(reference_completed_on=q['completed_on'],forecast_as_of=dates['forecast_as_of'],target_start=dates['target_start'],reference_moving_s=s['moving_time']['value'] if s['moving_time']['state']=='valid' else None,reference_elapsed_s=s['elapsed_time']['value'] if s['elapsed_time']['state']=='valid' else None,reference_stops_s=None,reference_is_actual=q['actual'],comparable_conditions_confirmed=q['comparable'])
 r=dict(activity_key={**identity,'subject_namespace':a['providerIdentity']['accountNamespace']},reference_gpx=raw,evidence=e,qualification=dict(original_classification=c['originalClassification'],selected_classification=q['reference_kind'],classification_source=audit['current_classification_source'],high_effort_reference_confirmed=q['high_effort_confirmed'],route_time_scope_confirmed=q['whole_route_confirmed']),source_observations=dict(schema_version='offline-history-observations/0.1',identity=identity,source_snapshot_sha256=request_hash,declared_gpx_sha256=sha(raw),completed_on_source='Explicit user-declared completion calendar date; externally unverified',start_date_local=a['metadata']['startDateLocal'],moving_time=clock('moving_time'),elapsed_time=clock('elapsed_time'),official_distance=dict(state=d['state'],value=d['valueM'],source=d['source'],invalid_reason=d['invalidReason']),recording_stops=dict(state=rs['state'],raw=rs['raw'],source=rs['source'],interpretation=rs['interpretation'],invalid_reason=rs['invalidReason']),known_stops=None,pause_time_s=a['metadata']['pauseTimeS']),source_assessment=dict(schema_version='offline-history-assessment/0.1',kind='normalized_history',normalizer_schema_version='intervals-history-v1',status=a['status'],upstream_source=a['provenance']['upstreamSource'],provenance_known=a['provenance']['known'],source_supported=a['provenance']['supported'],historical_performance_eligible=a['eligibility']['historicalPerformance'],rights_guarantee=False,quality=[{k:v[k] for k in ['code','severity','blocksFitness']} for v in a['quality']],binding=dict(scope='whole_activity',gpx_sha256=sha(raw),normalized_path_sha256=binding['path_sha256'],path_sample_binding_sha256=binding['path_sample_binding_sha256'])))
 return r,audit

def encode(value):
 text=json.dumps(value,ensure_ascii=True,allow_nan=False,separators=(',',':'));parse(text,16777216,1000000,32);return text

def handle_request(request_json,metadata_json):
 started=monotonic();meta=None;request_hash=None
 try:
  require(_MODEL is not None);_INTEGRITY();request_hash=sha(scalar(request_json,33554432));meta,_=parse(metadata_json,1048576,50000,16);fields(meta,{'request_sha256','owner_snapshot_json','owner_snapshot_sha256','owner_generation','correlation','initialization_elapsed_s'});require(meta['request_sha256']==request_hash and sha(scalar(meta['owner_snapshot_json'],131072))==meta['owner_snapshot_sha256'],'provider_owner_binding');owner,_=parse(meta['owner_snapshot_json'],131072,50000,32);fields(owner,{'schema_version','target_sha256','forecast_as_of','target_start','start_local_time','assumptions','input_revision','control_signature','target_context','provider_generation','provider_revision','host_context','import_response_sha256','records','active_record_id','visible_evidence_signature'});require(owner['schema_version']=='intervals-provider-owner/0.1');fields(meta['correlation'],{'generation','request_id'});require(all(type(v) is int and 0<v<=9007199254740991 for v in [meta['owner_generation'],*meta['correlation'].values()]),'provider_owner_binding');init=meta['initialization_elapsed_s'];require(finite(init) and init>=0)
  r,_=parse(request_json);fields(r,{'schema_version','source_kind','import_response_json','import_response_sha256','target_gpx_b64','target_sha256','records','dates','assumptions','limits'});require(r['schema_version']=='intervals-provider-request/0.1' and r['source_kind']=='intervals_provider');require(owner['target_sha256']==r['target_sha256'] and owner['import_response_sha256']==r['import_response_sha256'] and owner['assumptions']==r['assumptions'] and owner['forecast_as_of']==r['dates']['forecast_as_of'] and owner['target_start']==r['dates']['target_start'],'provider_owner_binding');require(type(owner['records']) is list and len(owner['records'])==len(r['records']),'provider_owner_binding');
  for saved,row in zip(owner['records'],r['records']):
   fields(saved,{'selection_id','activity_index','evidence_revision','user_qualification'});require({k:v for k,v in saved.items() if k!='evidence_revision'}==row and type(saved['evidence_revision']) is int and saved['evidence_revision']>=0,'provider_owner_binding')
  fields(r['limits'],{'max_wall_s'});wall=r['limits']['max_wall_s'];require(finite(wall) and 0<wall<=120,'provider_deadline_invalid')
  def deadline():require(monotonic()-started+init<=wall,'provider_deadline_exceeded')
  deadline();require(sha(scalar(r['import_response_json'],16777216))==r['import_response_sha256'],'provider_response_hash');imp,nodes=parse(r['import_response_json'],16777216,1500000,32);fields(imp,{'schema_version','host_context','import_result'});require(imp['schema_version']=='intervals-provider-import/0.1');host(imp['host_context']);require(owner['host_context']==imp['host_context'],'provider_access_binding');b=imp['import_result'];fields(b,{'schemaVersion','mode','activities','suppliedSelectionCount','uniqueActivityCount','aggregation','abilityCoefficient','selectionAssessment','accessBinding','resources','integrationStatus'});activities=b['activities'];require(type(activities) is list and 1<=len(activities)<=8 and b['uniqueActivityCount']==len(activities) and b['schemaVersion']=='intervals-history-import-v2' and b['mode']==('single' if len(activities)==1 else 'multiple') and b['aggregation']=='individual-activities-only' and b['abilityCoefficient'] is None and b['integrationStatus']=='normalized-only-gpx-core-not-connected');fields(b['accessBinding'],{'accountNamespace','grantEpoch','sourcePolicyRevision','verification','normalizedClientDocumentsAccepted'});access=b['accessBinding'];require(access==dict(accountNamespace=imp['host_context']['account_namespace'],grantEpoch=imp['host_context']['grant_epoch'],sourcePolicyRevision=imp['host_context']['source_policy_revision'],verification='trusted_server_session_resolver',normalizedClientDocumentsAccepted=False),'provider_access_binding')
  ids=set();aliases={};supplied=0;sample_count=0;point_count=0
  for a in activities:
   validate_activity(a,imp['host_context']);aid=a['providerIdentity']['activityId'];require(aid not in ids,'provider_activity_duplicate');ids.add(aid);supplied+=len(a['choiceAliases']);sample_count+=len(a['samples']);point_count+=a['path']['pointCount'] if a['path'] else 0
   for alias in a['choiceAliases']:require(alias not in aliases or aliases[alias]==aid,'provider_alias_duplicate');aliases[alias]=aid
  require(supplied==b['suppliedSelectionCount'] and supplied<=8 and sample_count<=50000 and point_count<=50000,'provider_source_budget');fields(b['resources'],{'upstreamBytes','originalSamples','attemptedGETs','maxGETAttempts','maxNormalizedBytes','maxNormalizedNodes'});require(sample_count<=b['resources']['originalSamples']<=50000 and 0<b['resources']['upstreamBytes']<=12582912 and 3*len(activities)<=b['resources']['attemptedGETs']<=48 and b['resources']['maxGETAttempts']==48 and b['resources']['maxNormalizedBytes']==16777216 and b['resources']['maxNormalizedNodes']==1500000)
  records=r['records'];require(type(records) is list and 1<=len(records)<=8);sids=set();indices=set();derived=[];selection=[];model_records=[];intervals=[];alias_charge=0
  fields(r['dates'],{'forecast_as_of','target_start'});target=decode(r['target_gpx_b64'],r['target_sha256'],'target');admit(target,'target');total=len(target)
  for row in records:
   fields(row,{'selection_id','activity_index','user_qualification'});sid=row['selection_id'];idx=row['activity_index'];require(machine(sid,96) and sid not in sids and type(idx) is int and 0<=idx<len(activities) and idx not in indices,'provider_selection_invalid');sids.add(sid);indices.add(idx);a=activities[idx];raw,binding,interval=replay(a);admit(raw,'history',sid);record,audit=source_record(a,row['user_qualification'],raw,binding,r['import_response_sha256'],r['dates']);require(row['user_qualification']['whole_route_confirmed'] is True,'provider_scope_unconfirmed');derived.append(raw);model_records.append(record);intervals.append(interval);total+=len(raw)*len(a['choiceAliases']);alias_charge+=len(a['choiceAliases']);selection.append(dict(selection_id=sid,activity_index=idx,provider_identity=a['providerIdentity'],derived_geometry=binding,source_response_sha256=r['import_response_sha256'],observed_snapshot=a['observedSnapshot'],coverage=a['coverage'],classification_audit=audit));deadline()
  require(total<=12582912,'provider_total_gpx_budget')
  for i,a in enumerate(intervals):
   for b in intervals[:i]:require(not(a and b and a[0]<b[1] and b[0]<a[1]),'provider_recorded_time_overlap')
  core=_CORE_LOADER();tg=core.build_geometry(core.parse_gpx(target));target_cells=len(tg.cells);require(target_cells<=15000,'provider_target_cell_budget',role='target',source_sha256=sha(target));require(target_cells+sum(len(core.build_geometry(core.parse_gpx(raw)).cells) for raw in derived)<=100000,'provider_total_cell_budget');del tg
  assumptions=r['assumptions'];require(type(assumptions) is dict and len(assumptions.get('target_checkpoints',[]))<=100)
  if len(records)>1:
   require(assumptions['fatigue_model']=='constant_rate' and assumptions['reference_end_slowdown'] is None and not any(k.startswith('steep_') for k in assumptions),'provider_multiple_mode');require(all(row['user_qualification']['distinct_activity_confirmed'] for row in records),'provider_distinct_activity_unconfirmed');reference=_MODEL.predict_multi_from_gpx(model_records,target,assumptions);mode='multi_mean'
  else:
   record=model_records[0];q=records[0]['user_qualification'];require(q['actual'] and q['comparable'],'prediction_confirmation_required');hybrid=any(k.startswith('steep_') for k in assumptions);plan=(_HYBRID_LOADER() if hybrid else core).predict_from_gpx(derived[0],target,record['evidence'],assumptions);mode='single_hybrid' if hybrid else 'single_predict';reference=dict(schema_version='intervals-single-reference/0.1',status='experimental_single_reference',unique_activity_count=1,records=[{k:v for k,v in record.items() if k!='reference_gpx'}],target_prediction=plan,errors=[])
  plan=reference.get('target_prediction');require(type(plan) is dict,'provider_model_refused');plan['source_kind']='intervals_provider';deadline();_INTEGRITY();resources=dict(normalized_response_bytes=len(r['import_response_json'].encode()),normalized_response_nodes=nodes,normalized_samples=sample_count,path_points=point_count,derived_gpx_bytes=sum(map(len,derived)),total_gpx_bytes=total,target_cells=target_cells,max_target_cells=15000,max_response_bytes=16777216,max_wall_s=wall,requested_checkpoint_count=len(assumptions.get('target_checkpoints',[])),initialization_elapsed_s=init,wrapper_elapsed_s=monotonic()-started,selected_normalized_samples=sum(v['derived_geometry']['samples'] for v in selection),selected_path_points=sum(v['derived_geometry']['path_points'] for v in selection),charged_selected_aliases=alias_charge)
  envelope=dict(schema_version='intervals-provider-result/0.1',runtime_manifest_sha256=_MANIFEST_SHA,operation='intervals_history_predict',source_kind='intervals_provider',request_sha256=request_hash,owner_snapshot_sha256=meta['owner_snapshot_sha256'],owner_generation=meta['owner_generation'],correlation=meta['correlation'],target_sha256=sha(target),import_response_sha256=r['import_response_sha256'],host_context=imp['host_context'],selection=selection,model_mode=mode,reference=reference,capabilities=dict(application_binding='verified_exact_provider_request_bytes',external_event_identity='trusted_host_account_activity_identity_not_empirical_authentication',source_kind='intervals_provider',account_calls_in_worker=False,empirical_calibration=False,recovery_prediction=False,personal_best_rest=False),resources=resources);return encode(dict(ok=True,result=envelope))
 except Refusal as e:return json.dumps(dict(ok=False,error=dict(code=e.code,message='平台歷史資料或資格未通過，請檢查所選紀錄。',admission_rejected=e.admission,details=dict(source_role=e.role,selection_id=e.selection_id,source_sha256=e.source_sha256,request_sha256=request_hash,owner_snapshot_sha256=meta.get('owner_snapshot_sha256') if type(meta) is dict else None,owner_generation=meta.get('owner_generation') if type(meta) is dict else None,correlation=meta.get('correlation') if type(meta) is dict else None))),separators=(',',':'))
 except (ValueError,TypeError,KeyError,IndexError,OverflowError) as e:
  code=getattr(e,'code','provider_model_refused');return json.dumps(dict(ok=False,error=dict(code=code,message='所選歷史或模型條件無法產生完整預估。',admission_rejected=False,details=dict(source_role='history',selection_id=None,source_sha256=None,request_sha256=request_hash,owner_snapshot_sha256=meta.get('owner_snapshot_sha256') if type(meta) is dict else None,owner_generation=meta.get('owner_generation') if type(meta) is dict else None,correlation=meta.get('correlation') if type(meta) is dict else None))),separators=(',',':'))
