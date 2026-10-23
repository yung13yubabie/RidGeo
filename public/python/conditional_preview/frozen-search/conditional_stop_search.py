"""Isolated finite joint-rest comparison over the exact accepted frozen r3.

No fitted coefficients, product defaults, pruning, medical recommendation, or UI.
All route simulations replay the seven-field state from the declared reference.
"""
from __future__ import annotations
from dataclasses import asdict
from pathlib import Path
import copy
import hashlib
import itertools
import json
import math
import sys
import runtime_integrity as integrity
import time

HERE = Path(__file__).resolve().parent
ENGINE = HERE / 'frozen-r3'
sys.path.insert(0, str(ENGINE))
import conditional_adapter as ca

VERSION = 'conditional-joint-stop-search/0.1-exhaustive'
ENGINE_SHA = '8d1112d6807abe08d4ccd9294c99d33be0298f709786d623882e98b188c50024'
ENGINE_MANIFEST_SHA = '8b11968d04e3815aadb978f6c93218c108a2faa4a0e3777813cdb68e2363aea8'
PLAN_FIELDS = ('g','caps','sections','locks','cps','binding','context','shape_end_multiplier','start_at')
MAX_POLICIES = 4096
MAX_SCENARIOS = 32
MAX_POLICY_SCENARIO_PAIRS = 16384
MAX_GRID_VALUES = 64
CONSTRAINT_FIELDS = ('mandatory_rest_min_extra_s','station_windows','inventory','unmodeled_constraints')
INVENTORY_MODEL = 'fixed-acquisition-at-arrival-elapsed-depletion/v1'


def fail(code, message):
    ca.fail(code, message)


def strict_fields(value,names,name):
    # Length admission precedes key-set construction and any copying.
    if type(value) is not dict or len(value)!=len(names):fail('invalid_schema',name+' fields')
    return ca.strict(value,names,name)


def geometry_admission(g,name):
    if not isinstance(g,ca.Geometry):fail('invalid_schema',name+' requires frozen core Geometry')
    if len(g.cells)>ca.MAX_CELLS:fail('resource_limit',name+' cell count')


def number(value, name, *, positive=False):
    return ca.kernel.num(value, name, positive=positive)


def verify_engine(budget):
    """Verify the maintained executable/schema capsule, not historical evidence."""
    integrity.verify_runtime(budget)
    ca.verify_dependencies()


class SharedWorkBudget(ca.WorkBudget):
    """One request ceiling and deadline across admission, anchors and every policy.

    r3's immutable public anchor owns internal counters. It receives only the
    remaining allowances and our deadline callback, and its consumed counters
    are charged once here before any target replay. No trial/policy allowance
    is replenished. This is accounting composition, not an r3 monkey patch.
    """
    def __init__(self,max_work,max_events,max_pieces,cancelled,max_wall_s):
        super().__init__(max_work,cancelled,max_wall_s)
        self.primitives=ca.AggregatePrimitiveBudget(max_events,max_pieces,self.cancellation_check)
        self.anchors=0
        self.accounting_complete=True

    def remaining_wall(self):
        self.primitives.check()
        val=self.deadline-time.perf_counter()
        if val<=0:
            self.timed_out=True
            fail('time_limit','shared request wall-time exhausted')
        return val

    def charge_anchor(self, resources):
        # Charge work already performed before consulting a now-true cancel.
        if resources is None:
            fail('invalid_schema','complete anchor did not supply resource receipt')
        work,events,pieces=(resources[k] for k in ('adapter_work','events','pieces'))
        if any(isinstance(v,bool) or not isinstance(v,int) or v<0 for v in (work,events,pieces)):fail('invalid_schema','anchor resource receipt')
        if self.work+work>self.max_work or self.primitives.events+events>self.primitives.max_events or self.primitives.pieces+pieces>self.primitives.max_pieces:
            fail('resource_limit','anchor exceeded shared remaining allowance')
        self.work+=work
        self.primitives.events+=events
        self.primitives.pieces+=pieces
        self.anchors+=1
        self.primitives.check()

    def snapshot(self):
        return dict(super().snapshot(),anchors=self.anchors,usage_accounting_complete=self.accounting_complete,
            usage_meaning='actual_consumed' if self.accounting_complete else 'known_consumed_lower_bound_anchor_failure_omitted_usage_receipt',
            aggregate_scope='entire_request_admission_all_anchors_all_policies_and_deliverable_replays')


def unavailable(status,reason,budget=None,**details):
    return dict(schema_version=VERSION,status=status,reason=reason,complete=False,
        final_state=None,finish_elapsed_s=None,best_conditional_grid_policy=None,
        recommended_rest_s=None,personal_causal_effect_identified=False,
        physiological_feasibility_identified=False,accuracy_claim=None,mutates_input=False,
        resources=budget.snapshot() if budget else None,**details)


def plan_json(plan):
    return {k:v for k,v in plan.items() if k!='g'}


def validate_constraints(constraints,cp_ids,service_ids,budget):
    ca.strict(constraints,CONSTRAINT_FIELDS,'constraint declaration')
    unknown=[]
    minima=constraints['mandatory_rest_min_extra_s']
    if minima is None:unknown.append('mandatory_rest')
    else:
        if type(minima) is not dict or set(minima)-set(service_ids):fail('invalid_schema','mandatory rest occurrence IDs')
        for ident,val in minima.items():budget.take();number(val,'mandatory extra rest')
    windows=constraints['station_windows']
    if windows is None:unknown.append('station_hours_and_additional_clock_windows')
    else:
        seen=set()
        for row in ca.sequence(windows,ca.MAX_CP,'station windows'):
            budget.take()
            ca.strict(row,('id','arrival_open_elapsed_s','arrival_close_elapsed_s','departure_open_elapsed_s','departure_close_elapsed_s'),'station window')
            if row['id'] not in cp_ids or row['id'] in seen:fail('invalid_schema','station window occurrence IDs')
            seen.add(row['id'])
            for kind in ('arrival','departure'):
                low,high=(row[kind+'_'+edge+'_elapsed_s'] for edge in ('open','close'))
                if low is not None:number(low,'window lower')
                if high is not None:number(high,'window upper')
                if low is not None and high is not None and low>high:fail('invalid_schema','station window reversed')
    inv=constraints['inventory']
    if inv is None:unknown.append('inventory_and_intake_coverage')
    else:
        ca.strict(inv,('model','items','station_additions'),'inventory')
        if inv['model']!=INVENTORY_MODEL:fail('not_estimable','inventory model not supported')
        item_ids=set()
        for row in ca.sequence(inv['items'],64,'inventory items'):
            budget.take()
            ca.strict(row,('id','initial_quantity','capacity','consumption_per_elapsed_s','minimum_finish_quantity'),'inventory item')
            ident=ca.label(row['id'],'inventory item id')
            if ident in item_ids:fail('invalid_schema','duplicate inventory item')
            item_ids.add(ident)
            for key in ('initial_quantity','capacity','consumption_per_elapsed_s','minimum_finish_quantity'):number(row[key],'inventory '+key)
            if row['initial_quantity']>row['capacity'] or row['minimum_finish_quantity']>row['capacity']:fail('invalid_schema','inventory initial/finish exceeds capacity')
        adds=inv['station_additions']
        if type(adds) is not dict or set(adds)-set(service_ids):fail('invalid_schema','inventory acquisition occurrence IDs')
        for ident,items in adds.items():
            budget.take()
            if type(items) is not dict or set(items)-item_ids:fail('invalid_schema','inventory addition item IDs')
            for value in items.values():budget.take();number(value,'inventory addition')
    for name in ca.sequence(constraints['unmodeled_constraints'],64,'unmodeled constraints'):
        budget.take();ca.label(name,'unmodeled constraint');unknown.append(name)
    return sorted(set(unknown))


def elapsed_bounds(state,stop_count):
    """Carried r3 moving allowance plus conservative positive stop-clock sums.

    r3 has no stopped-clock history field. This wrapper accounts for repeated
    dwell additions and final clock addition separately, without altering its
    seven-field state. This remains an engineering binary64 envelope.
    """
    val=state['moving_s']+state['stopped_s']
    n=2*stop_count+2;eps=sys.float_info.epsilon
    stopped_error=(n*eps/(1-n*eps))*abs(state['stopped_s'])
    error=state['moving_roundoff_bound_s']+stopped_error+2*math.ulp(val)
    return [math.nextafter(val-error,-math.inf),math.nextafter(val+error,math.inf)]


def comparison(bounds,threshold,kind):
    low,high=bounds
    if kind=='maximum':
        if high<=threshold:return 'pass'
        if low>threshold:return 'fail'
    else:
        if low>=threshold:return 'pass'
        if high<threshold:return 'fail'
    return 'numerically_ambiguous'


def feasibility(result,cps,constraints,policy,initial,budget):
    rows=result['checkpoints'];declared={cp['id']:cp for cp in cps};issues=[];counts={'pass':0,'fail':0,'numerically_ambiguous':0}
    def check(name,bounds,value,kind):
        budget.take()
        status=comparison(bounds,value,kind);counts[status]+=1
        if status!='pass' and len(issues)<32:issues.append(dict(constraint=name,status=status,bounds=bounds,threshold=value))
    if constraints['mandatory_rest_min_extra_s'] is not None:
        for ident,minimum in constraints['mandatory_rest_min_extra_s'].items():
            # Rest-grid inputs are exact declared binary64 quantities.
            check('mandatory_rest:'+ident,[policy[ident],policy[ident]],minimum,'minimum')
    windows={r['id']:r for r in (constraints['station_windows'] or [])}
    inv=constraints['inventory'];adds={} if inv is None else inv['station_additions']
    cumulative={} if inv is None else {item['id']:0. for item in inv['items']}
    initial_clock=initial.moving_s+initial.stopped_s
    for index,row in enumerate(rows):
        budget.take();ident=row['id'];arrival=elapsed_bounds(row['arrival_state'],index)
        departure=elapsed_bounds(row['departure_state'],index+1)
        cp=declared[ident];cutoff=cp['cutoff']
        if cutoff is not None:check('cutoff:'+ident+':'+cutoff['kind'],arrival if cutoff['kind']=='arrival' else departure,cutoff['elapsed_s'],'maximum')
        if ident in windows:
            win=windows[ident]
            if row['kind']=='finish' and (win['departure_open_elapsed_s'] is not None or win['departure_close_elapsed_s'] is not None):fail('invalid_schema','finish has no departure window')
            for kind,bounds in (('arrival',arrival),('departure',departure)):
                for edge,comparison_kind in (('open','minimum'),('close','maximum')):
                    value=win[kind+'_'+edge+'_elapsed_s']
                    if value is not None:check('window:'+ident+':'+kind+':'+edge,bounds,value,comparison_kind)
        if inv is not None:
            for item in inv['items']:
                budget.take();itemid=item['id'];rate=item['consumption_per_elapsed_s']
                def quantity_bounds(clock,acquired):
                    low_t,high_t=clock[0]-initial_clock,clock[1]-initial_clock
                    base=item['initial_quantity']+acquired
                    n=2*index+16;eps=sys.float_info.epsilon
                    error=(n*eps/(1-n*eps))*(abs(base)+abs(rate*high_t)+1.)+rate*2*math.ulp(initial_clock)
                    lower=ca.kernel.num(base-rate*high_t-error,'inventory lower quantity',signed=True)
                    upper=ca.kernel.num(base-rate*low_t+error,'inventory upper quantity',signed=True)
                    return [ca.kernel.num(math.nextafter(lower,-math.inf),'inventory lower outward bound',signed=True),ca.kernel.num(math.nextafter(upper,math.inf),'inventory upper outward bound',signed=True)]
                check('inventory:'+itemid+':'+ident+':arrival',quantity_bounds(arrival,cumulative[itemid]),0.,'minimum')
                addition=adds.get(ident,{}).get(itemid,0.)
                cumulative[itemid]=math.fsum([cumulative[itemid],addition])
                check('inventory:'+itemid+':'+ident+':capacity',quantity_bounds(arrival,cumulative[itemid]),item['capacity'],'maximum')
                check('inventory:'+itemid+':'+ident+':departure',quantity_bounds(departure,cumulative[itemid]),item['minimum_finish_quantity'] if row['kind']=='finish' else 0.,'minimum')
    status='infeasible' if counts['fail'] else ('numerically_ambiguous' if counts['numerically_ambiguous'] else 'feasible_for_provided_constraints')
    return dict(status=status,counts=counts,issues=issues,issue_list_truncated=sum(counts[k] for k in ('fail','numerically_ambiguous'))>len(issues))


def policy_prepared(prepared,policy,plan,artifact,budget):
    cps=[];original=[]
    for cp in prepared['cps']:
        budget.take();row=dict(cp)
        if row['kind']=='service':
            extra=policy[row['id']];service=row['service_makespan_s']
            rest=extra if row['composition']=='sequential_service_then_rest' else service+extra
            dwell=service+extra
            for value,name in ((extra,'extra_rest_range_s'),(dwell,'total_dwell_range_s')):
                if not artifact['support'][name][0]<=value<=artifact['support'][name][1]:fail('outside_declared_domain','policy '+name)
            row.update(rest_s=rest,extra_rest_s=extra,total_dwell_s=dwell)
        cps.append(row)
        original.append({key:row[key] for key in ('id','name','distance_m','kind','service','rest_s','composition','bundle_id','cutoff')})
    # Only immutable geometry/profile material is reused. No F/P/state is cached.
    return dict(prepared,cps=cps,control_hash=ca.digest(dict(sections=prepared['sections'],locks=plan['locks'],cps=original,shape=plan['shape_end_multiplier'],caps=plan['caps']))),original


def replay(plan,admitted,prepared,policy,constraints,budget):
    compiled,cps=policy_prepared(prepared,policy,plan,admitted['artifact'],budget)
    budget.take()
    result=ca.forward_geometry(plan['g'],plan['caps'],plan['sections'],plan['locks'],cps,plan['binding'],plan['context'],admitted,budget,
        shape_end_multiplier=plan['shape_end_multiplier'],start_at=plan['start_at'],prepared=compiled)
    feas=feasibility(result,cps,constraints,policy,admitted['initial'],budget)
    interval=elapsed_bounds(result['final_state'],len(cps))
    return result,dict(finish_elapsed_s=result['finish_elapsed_s'],elapsed_numerical_bounds_s=interval,
        feasibility=feas,final_state=result['final_state'],control_binding_sha256=result['control_binding_sha256'])


def prepare_scenarios(scenarios,plan,budget,isolated_test,policy_count,constraints):
    compiled=[];ids=set();anchor_records=[]
    for scenario in ca.sequence(scenarios,MAX_SCENARIOS,'scenarios'):
        budget.take();ca.strict(scenario,('id','envelope','provenance','anchor'),'scenario')
        ident=ca.label(scenario['id'],'scenario id')
        if ident in ids:fail('invalid_schema','duplicate scenario ID')
        ids.add(ident)
        allow_missing=scenario['anchor'] is not None
        status,admitted=ca.admit(scenario['envelope'],scenario['provenance'],isolated_test=isolated_test,allow_missing_scale=allow_missing)
        if admitted is None:return None,unavailable(status['status'],status.get('reason','scenario admission refused'),budget,scenario_id=ident,missing=status.get('missing',[]))
        target_prepared=ca.prepare_route(plan['g'],plan['caps'],plan['sections'],plan['locks'],plan['cps'],plan['binding'],plan['context'],admitted['artifact'],budget,plan['shape_end_multiplier'])
        anchor=scenario['anchor']
        if anchor is not None:
            ca.strict(anchor,('history_plan','history','config'),'anchor request')
            hp=anchor['history_plan'];ca.strict(hp,PLAN_FIELDS,'history plan')
            if hp['start_at'] is not None:fail('invalid_schema','historical anchor start_at must be None (r3 anchor does not use it)')
            config=copy.deepcopy(anchor['config'])
            required={'scale_bounds_s_per_j_kg','max_evaluations','residual_tolerance_s','max_relative_scale_span'}
            optional={'max_primitive_events','max_primitive_pieces'}
            if type(config) is not dict or not required<=set(config) or set(config)-required-optional:fail('invalid_schema','anchor configuration')
            if bool(set(config)&optional) and not optional<=set(config):fail('invalid_schema','anchor aggregate fields must be paired')
            for key,maximum in (('max_primitive_events',ca.HARD_MAX_AGGREGATE_EVENTS),('max_primitive_pieces',ca.HARD_MAX_AGGREGATE_PIECES)):
                if key in config and (isinstance(config[key],bool) or not isinstance(config[key],int) or not 0<=config[key]<=maximum):fail('resource_limit','anchor aggregate ceiling')
            remaining_events=budget.primitives.max_events-budget.primitives.events
            remaining_pieces=budget.primitives.max_pieces-budget.primitives.pieces
            if 'max_primitive_events' in config:
                remaining_events=min(remaining_events,config['max_primitive_events'])
            if 'max_primitive_pieces' in config:
                remaining_pieces=min(remaining_pieces,config['max_primitive_pieces'])
            config.update(max_primitive_events=remaining_events,max_primitive_pieces=remaining_pieces)
            result=ca.calibrate_scale(scenario['envelope'],scenario['provenance'],**{k:v for k,v in hp.items() if k!='start_at'},history=anchor['history'],config=config,
                max_work=budget.max_work-budget.work,cancelled=budget.cancellation_check,isolated_test=isolated_test,max_wall_s=budget.remaining_wall())
            if result['status']!='conditional_scale_identified':
                if result.get('resources') is not None:budget.charge_anchor(result['resources'])
                else:
                    # Some accepted-r3 identifiability refusals omit counters.
                    # Stop atomically and label our known usage as incomplete.
                    budget.accounting_complete=False;budget.anchors+=1
                return None,unavailable('time_limit' if budget.timed_out else result['status'],result.get('reason','same-law anchor refused'),budget,scenario_id=ident,anchor_failure=result)
            budget.charge_anchor(result['resources'])
            admitted=dict(admitted,values=dict(admitted['values'],scale_s_per_j_kg=result['scale_s_per_j_kg']))
            admitted['parameters']=ca.parameters(admitted['values'],admitted['artifact']['support'],admitted['artifact']['artifact_id'])
            anchor_records.append(dict(scenario_id=ident,receipt=result))
        compiled.append(dict(id=ident,admitted=admitted,prepared=target_prepared,artifact_sha256=scenario['envelope']['sha256'],provenance_authenticity=status['provenance_authenticity'],anchor=anchor is not None))
    if not compiled:fail('invalid_schema','at least one scenario required')
    return compiled,anchor_records


def reserve_search(compiled,policy_count,constraints,budget):
    """Conservative finite event/piece reserve; no lower bound or pruning."""
    events=pieces=work=0
    for item in compiled:
        p=item['prepared'];nfrag=len(p['boundaries'])-1;ncp=len(p['cps']);nlocked=0;li=0
        for left in p['boundaries'][:-1]:
            budget.take()
            while li<len(p['lock_rows']) and p['lock_rows'][li]['end_m']<=left:li+=1
            if li<len(p['lock_rows']) and p['lock_rows'][li]['start_m']<=left:nlocked+=1
        # A clipped exponential has at most three pieces. Frozen free calls use
        # one piece unit. Each replay has one event per fragment and CP.
        repetitions=policy_count+2
        events+=repetitions*(nfrag+ncp)
        pieces+=repetitions*(nfrag+2*nlocked)
        nitems=len(constraints['inventory']['items']) if constraints['inventory'] is not None else 0
        nmin=len(constraints['mandatory_rest_min_extra_s'] or {})
        # Wrapper cp compilation, simulation, feasibility and all constraint
        # comparisons. Extra 16 per CP dominates window/cutoff accounting.
        work+=repetitions*(nfrag+ncp*(16+5*nitems)+nmin+2)
    if events+budget.primitives.events>budget.primitives.max_events or pieces+budget.primitives.pieces>budget.primitives.max_pieces or work+budget.work>budget.max_work:
        fail('resource_limit','declared full-grid plus two deliverable replays exceed remaining shared aggregate budget')
    return dict(events_upper_bound=events,pieces_upper_bound=pieces,additional_adapter_work_upper_bound=work,deliverable_replays_reserved=2*len(compiled))


def search(scenarios,target_plan,rest_grid,baseline_policy,constraints,*,max_policies,max_work,
        max_primitive_events,max_primitive_pieces,near_equivalent_s=0.,max_wall_s=300.,cancelled=None,isolated_test=False):
    """Enumerate a bounded common Cartesian EXTRA-rest grid at fixed controls.

    Objective: minimum worst-case elapsed across declared scenarios, with no
    probabilities. Scenario oracle minima are separately labeled. This produces
    conditional grid comparisons only, never a personal/medical recommendation.
    """
    budget=None
    try:
        budget=SharedWorkBudget(max_work,max_primitive_events,max_primitive_pieces,cancelled,max_wall_s)
        verify_engine(budget)
        strict_fields(target_plan,PLAN_FIELDS,'target plan')
        geometry_admission(target_plan['g'],'target geometry')
        ca.bounded_input([scenarios_without_geometry(scenarios),plan_json(target_plan),rest_grid,baseline_policy,constraints],budget)
        if isinstance(max_policies,bool) or not isinstance(max_policies,int) or not 1<=max_policies<=MAX_POLICIES:fail('resource_limit','max_policies must be 1..4096')
        near=number(near_equivalent_s,'near-equivalent threshold')
        cps=ca.sequence(target_plan['cps'],ca.MAX_CP,'checkpoints')
        service_ids=[cp['id'] for cp in cps if cp.get('kind')=='service'];cp_ids=[cp['id'] for cp in cps]
        if type(rest_grid) is not dict or type(baseline_policy) is not dict or set(rest_grid)!=set(service_ids) or set(baseline_policy)!=set(service_ids):fail('invalid_schema','grid and baseline must contain every service occurrence exactly')
        grids=[];count=1
        for ident in service_ids:
            budget.take();values=ca.sequence(rest_grid[ident],MAX_GRID_VALUES,'station rest grid')
            if not values:fail('invalid_schema','empty station rest grid')
            values=[number(v,'grid extra rest') for v in values]
            if len(set(values))!=len(values):fail('invalid_schema','duplicate grid value')
            baseline=number(baseline_policy[ident],'baseline extra rest')
            if baseline not in values:fail('invalid_schema','baseline must be part of the common grid')
            count*=len(values)
            if count>max_policies:fail('resource_limit','Cartesian policy count exceeds declared bound')
            grids.append(sorted(values))
        if count*len(scenarios)>MAX_POLICY_SCENARIO_PAIRS:fail('resource_limit','policy by scenario pair bound')
        unknown=validate_constraints(constraints,cp_ids,service_ids,budget)
        compiled,anchor_records=prepare_scenarios(scenarios,target_plan,budget,isolated_test,count,constraints)
        if compiled is None:return anchor_records
        for item in compiled:
            for cp in item['prepared']['cps']:
                if cp['kind']=='service' and cp['extra_rest_s']!=baseline_policy[cp['id']]:fail('invalid_schema','baseline differs from target declared extra rest')
            for values in itertools.product(*grids):
                policy_prepared(item['prepared'],dict(zip(service_ids,values)),target_plan,item['admitted']['artifact'],budget)
        reserve=reserve_search(compiled,count,constraints,budget)
        policies=[];baseline_id=None
        for index,values in enumerate(itertools.product(*grids)):
            budget.take();policy=dict(zip(service_ids,values));ident='policy-'+str(index)
            outcomes={}
            for item in compiled:
                _,outcomes[item['id']]=replay(target_plan,item['admitted'],item['prepared'],policy,constraints,budget)
            statuses=[v['feasibility']['status'] for v in outcomes.values()]
            common='infeasible' if 'infeasible' in statuses else ('numerically_ambiguous' if 'numerically_ambiguous' in statuses else 'feasible_for_provided_constraints')
            point=max(v['finish_elapsed_s'] for v in outcomes.values())
            lower=max(v['elapsed_numerical_bounds_s'][0] for v in outcomes.values());upper=max(v['elapsed_numerical_bounds_s'][1] for v in outcomes.values())
            policies.append(dict(id=ident,extra_rest_s=policy,common_feasibility=common,scenario_outcomes=outcomes,
                worst_case_elapsed_s=point,worst_case_numerical_bounds_s=[lower,upper]))
            if policy==baseline_policy:baseline_id=ident
        eligible=[p for p in policies if p['common_feasibility']=='feasible_for_provided_constraints']
        ambiguous=[p for p in policies if p['common_feasibility']=='numerically_ambiguous']
        baseline=next(p for p in policies if p['id']==baseline_id)
        best=min(eligible,key=lambda p:(p['worst_case_elapsed_s'],p['id'])) if eligible else None
        near_rows=[];selection='no_certified_common_feasible_policy';numeric_gap=None
        if best is not None:
            bl,bu=best['worst_case_numerical_bounds_s']
            possible=[p for p in eligible if p['worst_case_numerical_bounds_s'][0]<=math.nextafter(bu+near,math.inf)]
            for p in possible:
                near_rows.append(dict(policy_id=p['id'],extra_rest_s=p['extra_rest_s'],worst_case_elapsed_s=p['worst_case_elapsed_s'],
                    worst_case_numerical_bounds_s=p['worst_case_numerical_bounds_s'],
                    near_equivalent_status='guaranteed_within_threshold' if p['id']==best['id'] or p['worst_case_numerical_bounds_s'][1]<=math.nextafter(bl+near,-math.inf) else 'possibly_within_threshold'))
            threats=[p['id'] for p in policies if p['id']!=best['id'] and p['common_feasibility']!='infeasible' and p['worst_case_numerical_bounds_s'][0]<=bu]
            selection='numerically_separated_on_common_grid' if not threats else 'numerically_ambiguous'
            raw_gap=bu-min(p['worst_case_numerical_bounds_s'][0] for p in eligible+ambiguous)
            numeric_gap=math.nextafter(raw_gap,math.inf) if raw_gap>0 else 0.
        oracles=[]
        for item in compiled:
            sid=item['id'];choices=[p for p in policies if p['scenario_outcomes'][sid]['feasibility']['status']=='feasible_for_provided_constraints']
            point_best=min(choices,key=lambda p:(p['scenario_outcomes'][sid]['finish_elapsed_s'],p['id'])) if choices else None
            oracles.append(dict(scenario_id=sid,policy_id=point_best['id'] if point_best else None,extra_rest_s=point_best['extra_rest_s'] if point_best else None,
                finish_elapsed_s=point_best['scenario_outcomes'][sid]['finish_elapsed_s'] if point_best else None,
                elapsed_numerical_bounds_s=point_best['scenario_outcomes'][sid]['elapsed_numerical_bounds_s'] if point_best else None,
                selection_status=('numerically_ambiguous' if point_best and any(p['id']!=point_best['id'] and p['scenario_outcomes'][sid]['feasibility']['status']!='infeasible' and p['scenario_outcomes'][sid]['elapsed_numerical_bounds_s'][0]<=point_best['scenario_outcomes'][sid]['elapsed_numerical_bounds_s'][1] for p in policies) else 'numerically_separated' if point_best else 'no_certified_feasible_policy'),
                meaning='scenario_specific_point_grid_oracle_not_a_common_policy_or_recommendation'))
        ledgers={};savings=[]
        for label,chosen in (('baseline',baseline),('best_conditional_grid',best)):
            if chosen is None:continue
            ledgers[label]={}
            for item in compiled:
                ledger,score=replay(target_plan,item['admitted'],item['prepared'],chosen['extra_rest_s'],constraints,budget)
                prior=chosen['scenario_outcomes'][item['id']]
                if score!=prior:fail('numeric_support','deterministic policy replay changed')
                ledger.update(scenario_id=item['id'],artifact_sha256=item['artifact_sha256'],provenance_authenticity=item['provenance_authenticity'],
                    point_scale_s_per_j_kg=item['admitted']['values']['scale_s_per_j_kg'],
                    scale_source='same_law_independent_history_fixed_theta_and_reference_state' if item['anchor'] else 'explicit_assumption')
                if item['anchor']:
                    fit=next(row['receipt'] for row in anchor_records if row['scenario_id']==item['id'])
                    ledger['capabilities']['anchor_status']='conditional_same_law_identified'
                    ledger['anchor_receipt_scenario_id']=item['id']
                    ledger['uncertainty'].update(anchor_scale_support_s_per_j_kg=fit['scale_support_s_per_j_kg'],
                        anchor_support_meaning=fit['scale_support_meaning'],anchor_scale_support_propagated_to_target_clock=False,
                        numerical_bound_scope='conditional_on_returned_point_scale_fixed_theta_state_and_controls_only')
                ledgers[label][item['id']]=ledger
        if best is not None:
            for item in compiled:
                sid=item['id'];base=baseline['scenario_outcomes'][sid];selected=best['scenario_outcomes'][sid]
                l0,u0=base['elapsed_numerical_bounds_s'];l1,u1=selected['elapsed_numerical_bounds_s']
                savings.append(dict(scenario_id=sid,point_elapsed_savings_s=base['finish_elapsed_s']-selected['finish_elapsed_s'],
                    numerical_savings_bounds_s=([0.,0.] if baseline['id']==best['id'] else [math.nextafter(l0-u1,-math.inf),math.nextafter(u0-l1,math.inf)]),
                    baseline_feasibility=base['feasibility']['status']))
        budget.primitives.check()
        caps=ca.capabilities(anchor='conditional_same_law_identified' if any(x['anchor'] for x in compiled) else 'explicit_assumption')
        caps.update(search_status='exhaustive_conditional_common_grid_complete',policy_validation_status='not_validated')
        return dict(schema_version=VERSION,status='conditional_grid_complete',complete=True,final_state=None,finish_elapsed_s=None,
            objective=dict(kind='minimax_elapsed_s',meaning='minimum worst-case elapsed over declared nonprobabilistic scenarios at fixed manual controls and free scale'),
            baseline=baseline,best_conditional_grid_policy=best,selection_status=selection,near_equivalent_policies=near_rows,
            near_equivalent_threshold_s=near,scenario_specific_oracles=oracles,baseline_comparisons=savings,
            policy_results=policies,route_ledgers=ledgers,anchors=anchor_records,
            scenario_receipts=[dict(id=item['id'],artifact_sha256=item['artifact_sha256'],
                declared_model_identity=copy.deepcopy(item['admitted']['artifact']['model']),
                declared_parameter_values={name:row['value'] for name,row in item['admitted']['artifact']['parameters'].items()},initial_reference_protocol=item['admitted']['artifact']['state_reference']['protocol_id'],
                point_scale_s_per_j_kg=item['admitted']['values']['scale_s_per_j_kg'],
                scale_source='same_law_independent_history_fixed_theta_and_reference_state' if item['anchor'] else 'explicit_assumption',
                provenance_authenticity=item['provenance_authenticity']) for item in compiled],
            search=dict(method='exhaustive_cartesian_no_pruning',policy_count=count,evaluated_policy_scenario_pairs=count*len(compiled),
                common_feasible_policy_count=len(eligible),numerically_ambiguous_feasibility_count=len(ambiguous),
                enumeration_complete=True,grid_enumeration_gap_s=0.,numerical_selection_gap_upper_s=numeric_gap,
                continuous_optimality_gap_s=None,pruning_enabled=False,resource_reserve=reserve),
            constraint_completeness='unknown' if unknown else 'caller_declared_complete_not_independently_verified',unknown_constraints=unknown,
            uncertainty=dict(kind='scenario_envelope_not_confidence_interval',probabilities_supplied=False,
                numerical_error_kind='carried_engineering_binary64_plus_stop_clock_allowance_not_formal_interval',
                model_uncertainty='only_declared_scenarios_no_personal_population_or_measurement_coverage',
                anchor_support_propagated_to_target=False,continuous_grid_discretization_error_s=None),
            capabilities=caps,resources=budget.snapshot(),engine_sha256=ENGINE_SHA,engine_manifest_sha256=ENGINE_MANIFEST_SHA,
            recommended_rest_s=None,accuracy_claim=None,physiological_feasibility_identified=False,personal_causal_effect_identified=False,
            target_rebalanced=False,parameter_refit=False,mutates_input=False,
            warnings=['Conditional clock grid comparisons are not rest, medical, nutrition or safety recommendations.',
                'Missing constraints remain unknown. A provided-constraint feasible policy is not established as safe.',
                'Timing-only and finish occurrences retain zero dwell. Required service and selected manual controls are fixed.',
                'Grid completeness, numerical ambiguity, model uncertainty and continuous-policy optimality are separate.'])
    except (ca.kernel.ModelError,ca.InputError) as ex:
        return unavailable('time_limit' if budget and budget.timed_out else ex.code,str(ex),budget)
    except (ValueError,TypeError,KeyError,IndexError,AttributeError,OverflowError,RecursionError):
        return unavailable('invalid_schema','malformed or unsupported search input',budget)


def scenarios_without_geometry(scenarios):
    """Only bounded built-in sequences; remove typed geometry before JSON guard."""
    if type(scenarios) not in (list,tuple) or len(scenarios)>MAX_SCENARIOS:fail('resource_limit','bounded scenario sequence required')
    result=[]
    for row in scenarios:
        strict_fields(row,('id','envelope','provenance','anchor'),'scenario')
        out=dict(row)
        anchor=row.get('anchor')
        if anchor is not None:
            strict_fields(anchor,('history_plan','history','config'),'anchor request')
            hp=strict_fields(anchor['history_plan'],PLAN_FIELDS,'history plan')
            geometry_admission(hp['g'],'history geometry')
            out['anchor']=dict(anchor)
            out['anchor']['history_plan']=plan_json(hp)
        result.append(out)
    return result
