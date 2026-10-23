"""Pure research-only pre-race baselines. Standard library, no network or Site imports."""
from collections import defaultdict
from datetime import date
import math
from statistics import median

MODEL_VERSION='prerace-fixed-riegel-research-v1'
REQUEST_FIELDS={'athlete_key','sport','gender','target_distance_m','forecast_as_of','target_start'}
RECORD_FIELDS={'result_key','athlete_key','meet_key','sport','gender','distance_m','finish_seconds','completed_on','available_on'}
DOMAINS={'Indoor Track':(1500.,10000.),'Outdoor Track':(1500.,10000.),'Road Race':(5000.,42195.)}
class ContractError(ValueError): pass

def _number(x, name):
    if isinstance(x,bool) or not isinstance(x,(float,int)) or not math.isfinite(x) or x<=0:raise ContractError(name+' must be positive finite SI value')
    return float(x)
def _day(x, name):
    if not isinstance(x,str):raise ContractError(name+' must be YYYY-MM-DD')
    try:d=date.fromisoformat(x)
    except ValueError:raise ContractError(name+' must be YYYY-MM-DD') from None
    if d.isoformat()!=x:raise ContractError(name+' must be YYYY-MM-DD')
    return d

def validate_request(q):
    if not isinstance(q,dict) or set(q)!=REQUEST_FIELDS:raise ContractError('request permits only pre-race fields; goals, outcomes, ranks and actual pace are prohibited')
    for key in ('athlete_key','sport','gender'):
        if not isinstance(q[key],str) or not q[key]:raise ContractError(key+' must be a nonempty string')
    _number(q['target_distance_m'],'target_distance_m')
    if _day(q['forecast_as_of'],'forecast_as_of')>_day(q['target_start'],'target_start'):raise ContractError('as-of is after start')

def validate_record(r):
    if not isinstance(r,dict) or set(r)!=RECORD_FIELDS:raise ContractError('historical record schema mismatch')
    for k in ('result_key','athlete_key','meet_key','sport','gender'):
        if not isinstance(r[k],str) or not r[k]:raise ContractError(k+' must be a nonempty string')
    _number(r['distance_m'],'distance_m');_number(r['finish_seconds'],'finish_seconds')
    end=_day(r['completed_on'],'completed_on')
    if r['available_on'] is not None and _day(r['available_on'],'available_on')<end:raise ContractError('published result predates completion')

def in_domain(sport,distance):
    return sport in DOMAINS and DOMAINS[sport][0]<=distance<=DOMAINS[sport][1]

def fit_population_prior(records, *, fit_as_of, source_version):
    cutoff=_day(fit_as_of,'fit_as_of');groups=defaultdict(list);unverified=0;seen=set()
    for r in records:
        validate_record(r)
        if r['result_key'] in seen:raise ContractError('duplicate history result key')
        seen.add(r['result_key'])
        if _day(r['completed_on'],'completed_on')>=cutoff:raise ContractError('training result crosses frozen cutoff')
        if r['available_on'] is not None and _day(r['available_on'],'available_on')>=cutoff:raise ContractError('training publication crosses frozen cutoff')
        if not in_domain(r['sport'],r['distance_m']):continue
        unverified+=r['available_on'] is None
        groups[(r['sport'],r['gender'],r['distance_m'])].append(r['finish_seconds'])
    return {'fit_as_of':fit_as_of,'source_version':source_version,'as_of_verification':'retrospective_event_date_only' if unverified else 'publication_checked',
            'groups':{k:{'central_seconds':median(v),'n':len(v)} for k,v in groups.items() if len(v)>=20}}

def predict(q, *, kind, prior=None, histories=()):
    validate_request(q)
    if kind not in ('population_prior','personal_fixed_riegel'):raise ContractError('unsupported estimator')
    out={'model_version':MODEL_VERSION,'estimator_kind':kind,'central_seconds':None,'status':'insufficient_evidence','uncertainty':{'kind':'not_calibrated','interval':None,'goal_probability':None},'domain':{'sport':q['sport'],'distance_m':q['target_distance_m'],'trail_validated':False},'warnings':[]}
    if not in_domain(q['sport'],q['target_distance_m']):out['status']='unsupported_domain';return out
    cutoff=_day(q['forecast_as_of'],'forecast_as_of');start=_day(q['target_start'],'target_start')
    if kind=='population_prior':
        if not prior:out['reason']='no_prior';return out
        if _day(prior['fit_as_of'],'fit_as_of')>cutoff:raise ContractError('prior was fit after request as-of')
        value=prior['groups'].get((q['sport'],q['gender'],q['target_distance_m']))
        if not value:out['reason']='population_stratum_less_than_20';return out
        out.update(status='estimated',central_seconds=value['central_seconds'],evidence_count=value['n'],source_version=prior['source_version'],as_of_verification=prior['as_of_verification'])
        out['warnings'].append('Population prior is not individual ability.')
        return out
    eligible={};excluded=defaultdict(int);seen=set()
    for r in histories:
        validate_record(r)
        if r['result_key'] in seen:raise ContractError('duplicate history result key')
        seen.add(r['result_key'])
        if (r['athlete_key'],r['sport'],r['gender'])!=(q['athlete_key'],q['sport'],q['gender']):excluded['different_person_or_stratum']+=1;continue
        end=_day(r['completed_on'],'completed_on')
        if end>=cutoff or end>=start:excluded['not_prior_to_cutoff_and_start']+=1;continue
        if r['available_on'] is not None and _day(r['available_on'],'available_on')>=cutoff:excluded['published_after_cutoff']+=1;continue
        if (start-end).days>365:excluded['history_older_than_365_days']+=1;continue
        if not in_domain(r['sport'],r['distance_m']):excluded['unsupported_history_distance']+=1;continue
        if r['distance_m']==q['target_distance_m']:excluded['same_distance_excluded_by_cross_distance_protocol']+=1;continue
        old=eligible.get(r['distance_m'])
        key=lambda rr:(rr['completed_on'],(0,int(rr['result_key'])) if rr['result_key'].isdigit() else (1,rr['result_key']))
        if old is None or key(r)>key(old):eligible[r['distance_m']]=r
    h=list(eligible.values());out['excluded_history_counts']=dict(excluded)
    if not h:out['reason']='no_eligible_cross_distance_history';return out
    b=1.06
    a=sum(math.log(r['finish_seconds'])-b*math.log(r['distance_m']/1000) for r in h)/len(h)
    pred=math.exp(a+b*math.log(q['target_distance_m']/1000))
    out.update(status='estimated',central_seconds=pred,evidence_count=len(h),exponent=b,exponent_source='fixed_historical_baseline_not_fitted_to_target',
        history_age_days={'min':min((start-_day(r['completed_on'],'completed_on')).days for r in h),'max':max((start-_day(r['completed_on'],'completed_on')).days for r in h)},
        as_of_verification='retrospective_event_date_only' if any(r['available_on'] is None for r in h) else 'publication_checked',
        history_distance_range_m=[min(eligible),max(eligible)],distance_extrapolation=not min(eligible)<=q['target_distance_m']<=max(eligible))
    out['warnings']+=['Historical comparable performance, not a measured physiological parameter.','No trail conversion, training effect or finish probability is implemented.']
    if len(h)==1:out['warnings'].append('One distance cannot identify a personal endurance exponent.')
    return out
