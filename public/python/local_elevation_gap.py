"""Bounded, opt-in local elevation-gap derivation. No network and no core edits.

This is interpolation from same-file anchors, not a measured height or a DEM.
Fixed 10 m policies are engineering scope limits, not scientific accuracy limits.
Original bytes are never edited; materialization produces a separate GPX artifact.
"""
import hashlib
import json
import math
import xml.etree.ElementTree as ET
from trail_planner.gpx import InputError, parse_gpx
from trail_planner.geometry import haversine, GEOMETRY_VERSION, EARTH_RADIUS_M

MODEL_VERSION='internal-single-ele-gap-horizontal-v1'
SCHEMA_VERSION='local-elevation-gap/1.0'
POLICY={
    'max_missing_points':1,
    'max_consecutive_missing':1,
    'max_bracket_horizontal_m':10.0,
    'max_anchor_elevation_difference_m':10.0,
    'endpoint_fill':False,
    'cross_segment_fill':False,
    'scope':'conservative_engineering_policy_not_accuracy_or_user_approval',
}
MARKER_NS='https://runart.local/schema/local-elevation-gap/1'

def _fail(code,message):raise InputError(code,message)
def _canonical(value):
    try:return json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False).encode('utf-8')
    except (TypeError,ValueError,OverflowError):_fail('local_gap_overlay_invalid','海拔補值資料格式無效。')
def _sha(data):return hashlib.sha256(data).hexdigest()
def _finite(v):
    try:return not isinstance(v,bool) and isinstance(v,(int,float)) and math.isfinite(v)
    except (TypeError,OverflowError):return False

def propose_local_gap(original_bytes):
    """Return a deterministic auditable proposal; do not write or materialize data.

    Only one missing point in one continuous segment is accepted in this version.
    Existing valid GPX coordinates and elevations stay exact. Unsupported inputs
    raise InputError rather than extending the interpolation scope implicitly.
    """
    route=parse_gpx(original_bytes)
    if len(route.segments)!=1:
        _fail('local_gap_multiple_segments','此補值僅支援單一連續軌跡，不能跨段補點。')
    points=route.segments[0]
    missing=[i for i,p in enumerate(points) if p.ele is None]
    if not missing:_fail('local_gap_not_needed','原始路線海拔完整，不需要補值。')
    if len(missing)>POLICY['max_missing_points']:
        _fail('local_gap_too_many_missing','此版本只補一個內部缺海拔點，不補連續或多處缺點。')
    index=missing[0]
    if index==0 or index==len(points)-1:
        _fail('local_gap_endpoint','端點缺海拔沒有左右參考，不能補值。')
    before,point,after=points[index-1:index+2]
    if not all(_finite(p.ele) for p in (before,after)):
        _fail('local_gap_invalid_anchors','補值需要兩側有限有效的原始海拔。')
    left=haversine(before,point);right=haversine(point,after)
    total=math.fsum((left,right));difference=after.ele-before.ele
    if not all(_finite(v) and v>=0 for v in (left,right,total)):
        _fail('local_gap_invalid_distance','缺點附近的水平距離無效。')
    if total>POLICY['max_bracket_horizontal_m']:
        _fail('local_gap_too_wide','缺點兩側沿線距離超過此版本10公尺補值範圍。')
    if abs(difference)>POLICY['max_anchor_elevation_difference_m']:
        _fail('local_gap_elevation_discontinuity','兩側海拔差超過此版本10公尺補值範圍。')
    anchors_same_xy=(before.lat,before.lon)==(after.lat,after.lon)
    if anchors_same_xy and before.ele!=after.ele:
        _fail('local_gap_conflicting_duplicate','相同座標的參考海拔互相矛盾，不能補值。')
    if total==0.0:
        # All three points coincide. Two identical observed heights identify the
        # duplicate height without an undefined 0/0 interpolation fraction.
        if before.ele!=after.ele:
            _fail('local_gap_conflicting_duplicate','零水平距離的參考海拔互相矛盾。')
        fraction=None;derived=before.ele;method='coincident_equal_anchors'
    else:
        fraction=left/total
        if left==0.0:derived=before.ele;method='coincident_previous_anchor'
        elif right==0.0:derived=after.ele;method='coincident_next_anchor'
        else:
            derived=before.ele+difference*fraction
            method='horizontal_chainage_linear_interpolation'
    if not _finite(derived) or not -1000<=derived<=10000:
        _fail('local_gap_invalid_derived','衍生海拔不是有效有限值。')
    # No value can overshoot its observed anchors.
    if not min(before.ele,after.ele)<=derived<=max(before.ele,after.ele):
        _fail('local_gap_numeric_range','補值超出兩側原始海拔範圍。')
    def anchor(i,p):return dict(segment_index=0,source_index=i,lat=p.lat,lon=p.lon,elevation_m=p.ele)
    patch=dict(segment_index=0,source_index=index,lat=point.lat,lon=point.lon,original_elevation_m=None,derived_elevation_m=derived,method=method,previous_anchor=anchor(index-1,before),next_anchor=anchor(index+1,after),previous_to_missing_horizontal_m=left,missing_to_next_horizontal_m=right,bracket_horizontal_m=total,distance_fraction_from_previous=fraction,source='original_gpx_neighbor_elevations',vertical_datum='same_as_original_unknown',uncertainty_m=None,accuracy_status='not_measured_or_independently_validated')
    proposal=dict(schema_version=SCHEMA_VERSION,model_version=MODEL_VERSION,original_sha256=route.sha256,original_byte_count=route.byte_count,original_point_count=route.point_count,original_namespace=route.namespace,policy=dict(POLICY),horizontal_distance_method=dict(version=GEOMETRY_VERSION,function='unchanged trail_planner.geometry.haversine',earth_radius_m=EARTH_RADIUS_M),missing_points_before=1,missing_points_after=0,requires_confirmation=True,patches=[patch],provenance=dict(input_kind='same_original_gpx',external_elevation_source=None,raw_bytes_modified=False,original_heights_modified=False,assumption='Linear height change over the small internal horizontal-chainage gap; duplicate coordinates use consistent original anchor height.',accuracy_claim=None,geometry_validity='not_evaluated_by_local_gap_adapter',calculation_ready_claim=None))
    proposal['derived_profile_sha256']=_sha(_canonical(proposal))
    return proposal

def materialize_local_gap(original_bytes,proposal,*,confirmed=False):
    """Return separate derived GPX bytes only after explicit Boolean confirmation.

    Recompute the whole proposal and compare canonical types/values, so a public
    content hash is never treated as an authentication signature or sufficient
    semantic validation. Preserve original point order and XML metadata.
    """
    if confirmed is not True:
        _fail('local_gap_confirmation_required','請確認補齊這1點海拔後再使用衍生路線。')
    expected=propose_local_gap(original_bytes)
    if not isinstance(proposal,dict) or _canonical(proposal)!=_canonical(expected):
        _fail('local_gap_overlay_mismatch','補值提案與此原始GPX不相符，請重新分析。')
    route=parse_gpx(original_bytes) # bounded core rejects DTD/entities before ET
    try:
        parser=ET.XMLParser(target=ET.TreeBuilder(insert_comments=True,insert_pis=True))
        root=ET.fromstring(original_bytes,parser=parser)
    except ET.ParseError:
        _fail('local_gap_invalid_xml','原始GPX XML無法安全重建。')
    ns='{'+route.namespace+'}' if route.namespace else ''
    nodes=[]
    for child in root:
        if child.tag==ns+'trk':
            for seg in child:
                if seg.tag==ns+'trkseg':nodes.extend(p for p in seg if p.tag==ns+'trkpt')
        elif child.tag==ns+'rte':nodes.extend(p for p in child if p.tag==ns+'rtept')
    if len(nodes)!=route.point_count:
        _fail('local_gap_point_mapping','原始GPX點位對應不完整。')
    patch=expected['patches'][0];node=nodes[patch['source_index']]
    if node.find(ns+'ele') is not None:
        _fail('local_gap_existing_elevation','不能覆寫原始已有海拔。')
    ele=ET.Element(ns+'ele');ele.text=repr(patch['derived_elevation_m']);node.insert(0,ele)
    if route.namespace=='http://www.topografix.com/GPX/1/0':extensions=root
    else:
        extensions=root.find(ns+'extensions')
        if extensions is None:extensions=ET.SubElement(root,ns+'extensions')
    marker=ET.SubElement(extensions,'{'+MARKER_NS+'}derived-elevation')
    marker.set('method-version',MODEL_VERSION);marker.set('original-sha256',route.sha256);marker.set('profile-sha256',expected['derived_profile_sha256']);marker.set('status','local-interpolation-estimate')
    marker.text=json.dumps(patch,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False)
    data=ET.tostring(root,encoding='utf-8',xml_declaration=True)
    derived=parse_gpx(data)
    if len(derived.segments)!=len(route.segments) or derived.point_count!=route.point_count:
        _fail('local_gap_roundtrip_failed','衍生檔案點數或軌跡段有變動。')
    for i,(original,new) in enumerate(zip(route.segments[0],derived.segments[0])):
        expected_height=patch['derived_elevation_m'] if i==patch['source_index'] else original.ele
        if (original.lat,original.lon)!=(new.lat,new.lon) or new.ele!=expected_height:
            _fail('local_gap_roundtrip_failed','衍生檔案變更了補值範圍以外的資料。')
    return data
