"""Opt-in bounded derived route repair: isolated ele fill then exact-XY groups.

No network or core edits. Median elevation represents a declared local scenario,
not a recovered measurement. Every original point maps to a final derived point.
"""
from dataclasses import replace
import hashlib,json,math,statistics
import xml.etree.ElementTree as ET
from trail_planner.gpx import InputError,parse_gpx
from trail_planner.geometry import haversine,build_geometry
from local_elevation_gap import propose_local_gap,materialize_local_gap

SCHEMA_VERSION='route-geometry-repair/1.0'
MODEL_VERSION='local-gap-then-small-exact-xy-median-v1'
POLICY=dict(max_conflict_group_points=3,max_conflict_groups=8,max_group_elevation_span_m=3.0,max_neighbor_horizontal_m=20.0,max_neighbor_horizontal_sum_m=25.0,merge_only_exact_adjacent_coordinates=True,endpoint_group_merge=False,same_elevation_groups_merged=False,representative='first_original_source_index',elevation_rule='median_of_all_group_elevations_after_explicit_local_gap',scope='conservative_engineering_policy_not_measurement_accuracy_or_user_approval')
MARKER_NS='https://runart.local/schema/route-geometry-repair/1'

def _fail(code,message):raise InputError(code,message)
def _canonical(x):
    try:return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False).encode('utf-8')
    except (ValueError,TypeError,OverflowError):_fail('repair_proposal_invalid','路線處理提案格式無效。')
def _sha(x):return hashlib.sha256(x).hexdigest()
def _tree(raw,route):
    # Caller must first pass the existing bounded GPX parser (DTD/entities denied).
    parser=ET.XMLParser(target=ET.TreeBuilder(insert_comments=True,insert_pis=True))
    try:root=ET.fromstring(raw,parser=parser)
    except ET.ParseError:_fail('repair_invalid_xml','GPX無法安全重建。')
    ns='{'+route.namespace+'}' if route.namespace else '';nodes=[];parents=[]
    for child in root:
        if child.tag==ns+'trk':
            for seg in child:
                if seg.tag==ns+'trkseg':
                    for node in seg:
                        if node.tag==ns+'trkpt':nodes.append(node);parents.append(seg)
        elif child.tag==ns+'rte':
            for node in child:
                if node.tag==ns+'rtept':nodes.append(node);parents.append(child)
    if len(nodes)!=route.point_count:_fail('repair_point_mapping','原始點位對應不完整。')
    return root,ns,nodes,parents

def _snapshot_geometry(route):
    g=build_geometry(route)
    return dict(blocked=g.blocked,elevation_complete=g.elevation_complete,horizontal_distance_m=g.horizontal_distance_m,distance_m=g.distance_m,ascent_m=g.ascent_m,descent_m=g.descent_m,geometry_sha256=g.geometry_sha256,quality=[q for q in g.quality if q['code']!='activity_fields_ignored'])

def _raw_statistics(points):
    known=all(p.ele is not None for p in points)
    return dict(horizontal_distance_m=math.fsum(haversine(a,b) for a,b in zip(points,points[1:])),raw_positive_delta_elevation_m=math.fsum(max(0,b.ele-a.ele) for a,b in zip(points,points[1:])) if known else None,raw_negative_delta_elevation_m=math.fsum(max(0,a.ele-b.ele) for a,b in zip(points,points[1:])) if known else None,caution='Raw adjacent elevation sums are not smoothed ascent/descent or evidence of terrain accuracy.')

def propose_route_repairs(original_bytes):
    """Pure proposal in original index space. No GPX materialization or approval."""
    route=parse_gpx(original_bytes)
    if len(route.segments)!=1:_fail('repair_multiple_segments','本處理僅支援單一連續軌跡，不跨段合併。')
    original=list(route.segments[0]);points=list(original);local_gap=None
    if any(p.ele is None for p in points):
        local_gap=propose_local_gap(original_bytes)
        patch=local_gap['patches'][0];i=patch['source_index'];points[i]=replace(points[i],ele=patch['derived_elevation_m'])
    _,_,nodes,_=_tree(original_bytes,route)
    groups=[];i=0
    while i<len(points):
        j=i+1
        # Maximal raw consecutive group, including equal-height duplicates. Do not
        # pre-deduplicate to sneak a larger group under the policy's three points.
        while j<len(points) and (points[j].lat,points[j].lon)==(points[i].lat,points[i].lon):j+=1
        elevations=[p.ele for p in points[i:j]]
        if j-i>1 and len(set(elevations))>1:
            if j-i>POLICY['max_conflict_group_points']:_fail('repair_duplicate_group_too_long','相同座標衝突群超過3點，不在此處理範圍。')
            if i==0 or j==len(points):_fail('repair_duplicate_endpoint','不合併起終點的海拔衝突群。')
            if any(z is None or not math.isfinite(z) for z in elevations):_fail('repair_duplicate_missing_elevation','衝突群仍有缺海拔，不能計算中位數。')
            span=max(elevations)-min(elevations)
            if span>POLICY['max_group_elevation_span_m']:_fail('repair_duplicate_span','同座標海拔差超過3公尺，不在此處理範圍。')
            previous,after=points[i-1],points[j]
            if any(p.ele is None or not math.isfinite(p.ele) for p in (previous,after)):_fail('repair_duplicate_invalid_neighbors','衝突群兩側需要有效有限海拔。')
            left=haversine(previous,points[i]);right=haversine(points[j-1],after);width=math.fsum((left,right))
            if not all(math.isfinite(v) and v>1e-6 for v in (left,right)) or max(left,right)>POLICY['max_neighbor_horizontal_m'] or width>POLICY['max_neighbor_horizontal_sum_m']:
                _fail('repair_duplicate_sparse_neighbors','衝突群兩側距離超出本處理範圍。')
            median=statistics.median(elevations)
            records=[]
            for index in range(i,j):
                p=original[index]
                # Prefix rewriting gives unqualified lat/lon attributes an
                # illegal xmlns:n0="" declaration in ElementTree. Preserve the
                # serializer's valid namespace bindings in standalone C14N.
                xml=ET.canonicalize(ET.tostring(nodes[index],encoding='unicode'),with_comments=True,rewrite_prefixes=False)
                records.append(dict(segment_index=0,source_index=index,lat=p.lat,lon=p.lon,original_elevation_m=p.ele,elevation_after_local_gap_m=points[index].ele,source_point_xml_c14n=xml))
            groups.append(dict(segment_index=0,source_indices=list(range(i,j)),representative_source_index=i,removed_source_indices=list(range(i+1,j)),lat=points[i].lat,lon=points[i].lon,original_representative_elevation_m=original[i].ele,derived_representative_elevation_m=median,method='median_estimate_of_all_original_group_points',all_group_elevations_after_local_gap_m=elevations,elevation_span_m=span,previous_distinct_source_index=i-1,next_distinct_source_index=j,previous_horizontal_m=left,next_horizontal_m=right,neighbor_horizontal_sum_m=width,source_points=records,uncertainty_m=None,accuracy_status='explicit_derived_scenario_not_a_recovered_measurement'))
        i=j
    if len(groups)>POLICY['max_conflict_groups']:_fail('repair_too_many_duplicate_groups','同座標衝突群超過8組，不在此處理範圍。')
    if local_gap is None and not groups:_fail('repair_not_needed','沒有符合此版本範圍的待處理缺點或重複座標衝突。')
    by_start={g['representative_source_index']:g for g in groups};mapping=[];new=[];i=0
    while i<len(points):
        g=by_start.get(i);end=g['source_indices'][-1]+1 if g else i+1
        representative=replace(points[i],ele=g['derived_representative_elevation_m']) if g else points[i]
        derived_index=len(new);new.append(representative);mapping.extend([derived_index]*(end-i));i=end
    diagnostic_route=replace(route,segments=(tuple(new),),point_count=len(new))
    before_stats=_raw_statistics(points);after_stats=_raw_statistics(new)
    before_geometry=_snapshot_geometry(route);after_geometry=_snapshot_geometry(diagnostic_route)
    summary=dict(missing_elevations_filled=1 if local_gap else 0,conflicting_coordinate_groups_merged=len(groups),duplicate_points_removed=len(points)-len(new),original_point_count=len(points),derived_point_count=len(new),horizontal_distance_change_m=after_stats['horizontal_distance_m']-before_stats['horizontal_distance_m'],raw_gain_change_from_post_gap_m=after_stats['raw_positive_delta_elevation_m']-before_stats['raw_positive_delta_elevation_m'],raw_loss_change_from_post_gap_m=after_stats['raw_negative_delta_elevation_m']-before_stats['raw_negative_delta_elevation_m'],preview_core_blocked=after_geometry['blocked'],preview_has_out_of_domain=any(q['code']=='grade_out_of_domain' for q in after_geometry['quality']))
    result=dict(schema_version=SCHEMA_VERSION,model_version=MODEL_VERSION,original_sha256=route.sha256,original_byte_count=route.byte_count,original_point_count=route.point_count,original_namespace=route.namespace,policy=dict(POLICY),requires_confirmation=True,operation_order=['local_elevation_gap_if_present','exact_adjacent_coordinate_conflict_median_if_present'],local_gap=local_gap,duplicate_groups=groups,source_index_to_derived_index=mapping,summary=summary,original_geometry=before_geometry,derived_geometry_preview=after_geometry,raw_stats_after_only_local_gap=before_stats,raw_stats_after_all_repairs=after_stats,provenance=dict(original_bytes_modified=False,external_elevation_source=None,vertical_datum='same_as_original_unknown',accuracy_claim=None,comparison_basis='Raw elevation-change delta compares after any local-gap fill and before/after duplicate merge; smoothed original geometry may be blocked.',materialization_chain=['original_bytes','optional_local_gap_derived_bytes','final_repair_derived_bytes'],source_point_metadata_rule='Retain representative first point metadata; removed point XML and mapping remain in sidecar, original file remains available.',cp_rule='Reinspect final derived bytes and recompute CP mapping/timelines; never reuse old point indices or CP times.'))
    result['derived_profile_sha256']=_sha(_canonical(result))
    return result

def materialize_route_repairs(original_bytes,proposal,*,confirmed=False):
    """Materialize exactly the approved proposal and preserve complete hash lineage."""
    if confirmed is not True:_fail('repair_confirmation_required','請確認套用列出的衍生路線處理。')
    expected=propose_route_repairs(original_bytes)
    if not isinstance(proposal,dict) or _canonical(proposal)!=_canonical(expected):_fail('repair_proposal_mismatch','此提案與原始GPX或處理規則不相符，請重新分析。')
    intermediate=materialize_local_gap(original_bytes,expected['local_gap'],confirmed=True) if expected['local_gap'] is not None else original_bytes
    route=parse_gpx(intermediate);root,ns,nodes,parents=_tree(intermediate,route)
    for g in expected['duplicate_groups']:
        index=g['representative_source_index'];node=nodes[index];ele=node.find(ns+'ele')
        if ele is None:_fail('repair_duplicate_missing_elevation','代表點海拔缺失，不能合併。')
        ele.text=repr(g['derived_representative_elevation_m'])
        for removed in g['removed_source_indices']:parents[removed].remove(nodes[removed])
    if route.namespace=='http://www.topografix.com/GPX/1/0':extensions=root
    else:
        extensions=root.find(ns+'extensions')
        if extensions is None:extensions=ET.SubElement(root,ns+'extensions')
    marker=ET.SubElement(extensions,'{'+MARKER_NS+'}derived-route-repair')
    marker.set('method-version',MODEL_VERSION);marker.set('original-sha256',expected['original_sha256']);marker.set('input-before-merge-sha256',_sha(intermediate));marker.set('profile-sha256',expected['derived_profile_sha256']);marker.set('status','explicit-local-derived-scenario')
    if expected['local_gap'] is not None:marker.set('parent-local-gap-profile-sha256',expected['local_gap']['derived_profile_sha256'])
    # Full provenance stays in the approved proposal / exported JSON sidecar.
    # Inlining its full point mapping/XML exceeds the bounded details parser's
    # per-element text limit even for ordinary public routes. Keep a compact,
    # hash-linked marker; never relax that parser limit or truncate provenance.
    marker.set('provenance-format','sidecar-hash-v1')
    marker.set('sidecar-schema',SCHEMA_VERSION)
    marker.set('sidecar-required','true')
    data=ET.tostring(root,encoding='utf-8',xml_declaration=True);parsed=parse_gpx(data)
    if len(parsed.segments)!=1 or parsed.point_count!=expected['summary']['derived_point_count']:_fail('repair_roundtrip_failed','衍生GPX點數或段數不符合提案。')
    transformed=list(parse_gpx(original_bytes).segments[0]);gap=expected['local_gap']
    if gap is not None:
        p=gap['patches'][0];transformed[p['source_index']]=replace(transformed[p['source_index']],ele=p['derived_elevation_m'])
    for g in expected['duplicate_groups']:
        for index in g['source_indices']:transformed[index]=replace(transformed[index],ele=g['derived_representative_elevation_m'])
    for source_index,derived_index in enumerate(expected['source_index_to_derived_index']):
        if transformed[source_index]!=parsed.segments[0][derived_index]:_fail('repair_roundtrip_failed','衍生GPX改變了提案以外的點位。')
    actual_geometry=_snapshot_geometry(parsed)
    if actual_geometry!=expected['derived_geometry_preview']:_fail('repair_roundtrip_failed','衍生GPX幾何與預覽不一致。')
    return data
