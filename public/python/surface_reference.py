"""Explicit whole-provider-surface scenario from one pinned curated native grid.

No network, TIFF decoder, datum fit, partial splice, GPX mutation or model change.
"""
from decimal import Decimal, ROUND_FLOOR, localcontext
import hashlib
import copy
import json
import math
import struct
import xml.etree.ElementTree as ET
from trail_planner.gpx import InputError, parse_gpx
from trail_planner.geometry import build_geometry
from route_geometry_repair import _tree

VERSION='whole-provider-surface-reference/3'
MARKER_NS='https://ridgeq.run/schema/provider-surface-reference/1'
PACK_SHA='5fecaedb28c61d17dbde37f4c4200ccec209092375347b88e57053e7035aa5e9'
MAX_PACK_BYTES=65536
_PACK=None
# Standard GPX point position/accuracy fields describe the original GNSS fix,
# not a provider-surface replacement elevation. Keep them in immutable originals.
# GPX 1.1 wptType is shared by wpt/rtept/trkpt; these fields also exist in 1.0.
_POINT_MEASUREMENT_FIELDS=('geoidheight','fix','sat','hdop','vdop','pdop','ageofdgpsdata','dgpsid')

def fail(code,message):raise InputError(code,message)
def canonical(value):return json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False).encode()
def digest(value):return hashlib.sha256(value).hexdigest()
def finite(value):return type(value) in (float,int) and math.isfinite(value)

_HEADER=struct.Struct('<8sBBBBhhHHHHHHI')
_PIXEL=struct.Struct('<ffBBB')
_BINARY_LAYOUT={'format':'native-pixel-11-byte/1','byte_order':'little-endian','array_order':'row_major','header_bytes':32,'record_bytes':11,'fields':[{'band':'DEM','offset':0,'type':'Float32'},{'band':'HEM','offset':4,'type':'Float32'},{'band':'FLM','offset':8,'type':'UInt8'},{'band':'EDM','offset':9,'type':'UInt8'},{'band':'WBM','offset':10,'type':'UInt8'}],'NoData':{'DEM':None,'HEM':-32767},'value_transform':'none; nonfinite DEM refuses support, nonfinite or negative HEM remains unknown'}

def initialize_surface(manifest_bytes, assets):
    """Load the pinned complete binary field with compact immutable native bytes.

    All source metadata is descriptive and never fetched. The public APIs, native
    ownership, four-support closure, six-class policy and adoption are unchanged.
    """
    global _PACK
    if not isinstance(manifest_bytes,bytes) or len(manifest_bytes)>65536 or digest(manifest_bytes)!=PACK_SHA:
        fail('surface_source_integrity','地表參考資料版本不符，原始路線保持不變。')
    pack=json.loads(manifest_bytes)
    if pack.get('schema')!='curated-native-surface-bundle/3' or pack.get('band_order')!=['DEM','FLM','EDM','HEM','WBM'] or pack.get('binary_layout')!=_BINARY_LAYOUT:
        fail('surface_source_schema','地表參考資料格式不符。')
    shards=pack['shards'];limits=pack['limits']
    if limits!={'per_asset_bytes':300000,'aggregate_asset_bytes':6000000,'manifest_bytes':65536,'shard_count':64,'native_values_per_shard':40960}:
        fail('surface_source_schema','地表參考資料讀取界線不符。')
    if not isinstance(assets,dict) or set(assets)!={s['path'] for s in shards} or not 0<len(shards)<=64:
        fail('surface_source_schema','地表參考資料包不完整。')
    total=0;tiles={};windows={};native={}
    for tile in pack['native_tiles']:
        key=(tile['center_latitude_origin_integer'],tile['center_longitude_origin_integer'])
        if key in native or tile['id'] in tiles or tile['native_width']!=3600 or tile['native_height']!=3600:
            fail('surface_source_grid','地表參考原生網格不符。')
        native[key]=tile;tiles[tile['id']]=tile;windows[tile['id']]=[]
    for record in shards:
        raw=assets[record['path']]
        if not isinstance(raw,bytes) or not len(raw)==record['bytes']<=300000 or len(raw)<_HEADER.size or digest(raw)!=record['sha256']:
            fail('surface_source_integrity','地表參考資料版本不符，原始路線保持不變。')
        total+=len(raw)
        if total>6000000:fail('surface_source_schema','地表參考資料包超出讀取界線。')
        left,top,right,bottom=record['window_half_open'];width,height=right-left,bottom-top;count=width*height
        if record['tile'] not in tiles or not (0<=left<right<=3600 and 0<=top<bottom<=3600 and count<=8192):
            fail('surface_source_schema','地表參考網格不完整。')
        magic,version,header_size,layout,flags,south,west,hleft,htop,hwidth,hheight,record_bytes,reserved,payload_bytes=_HEADER.unpack_from(raw)
        tile=tiles[record['tile']]
        expected=(b'RGTNAT3\0',3,32,1,0,tile['center_latitude_origin_integer']-1,tile['center_longitude_origin_integer'],left,top,width,height,11,0,count*11)
        if (magic,version,header_size,layout,flags,south,west,hleft,htop,hwidth,hheight,record_bytes,reserved,payload_bytes)!=expected or len(raw)!=32+payload_bytes:
            fail('surface_source_schema','地表參考二進位網格格式不符。')
        for prior in windows[record['tile']]:
            a,b,c,d=prior['window_half_open']
            if max(left,a)<min(right,c) and max(top,b)<min(bottom,d):fail('surface_source_grid','地表參考矩形重疊。')
        # A read-only view owns the verified bytes. No per-pixel Python objects,
        # byteorder-dependent casts, scale, padding or decoder dependency exists.
        windows[record['tile']].append({'path':record['path'],'window_half_open':record['window_half_open'],'payload':memoryview(raw)[32:]})
    if total!=pack['aggregate_shard_bytes']:fail('surface_source_schema','地表參考資料包長度不符。')
    _PACK=(pack,{'native':native,'tiles':tiles,'windows':windows})

initialize_surface_bundle=initialize_surface

def _support_records(lat_text,lon_text):
    """Native owner is determined first, separately from rectangular asset ownership."""
    if _PACK is None:fail('surface_source_unavailable','地表參考資料尚未載入。')
    pack,index=_PACK
    with localcontext() as context:
        context.prec=50
        lat,lon=Decimal(lat_text),Decimal(lon_text)
        if not lat.is_finite() or not lon.is_finite():fail('surface_coverage','地表參考位置無效。')
        gx,gy=lon*3600,-lat*3600
        x,y=int(gx.to_integral_value(rounding=ROUND_FLOOR)),int(gy.to_integral_value(rounding=ROUND_FLOOR))
        fx,fy=gx-x,gy-y;records=[]
        for xx,yy,weight in [(x,y,(1-fx)*(1-fy)),(x+1,y,fx*(1-fy)),(x,y+1,(1-fx)*fy),(x+1,y+1,fx*fy)]:
            east,north=xx//3600,-(yy//3600)
            tile=index['native'].get((north,east))
            if tile is None:fail('surface_coverage','目前地表參考未完整涵蓋這條路線，保留原始資料。')
            col,row=xx-east*3600,yy+north*3600
            owners=[s for s in index['windows'][tile['id']] if s['window_half_open'][0]<=col<s['window_half_open'][2] and s['window_half_open'][1]<=row<s['window_half_open'][3]]
            if len(owners)!=1:fail('surface_coverage','目前地表參考未完整涵蓋這條路線，保留原始資料。')
            shard=owners[0];left,top,right,bottom=shard['window_half_open'];at=(row-top)*(right-left)+col-left
            dem,hem,flm,edm,wbm=_PIXEL.unpack_from(shard['payload'],at*11)
            raw={'DEM':dem,'FLM':flm,'EDM':edm,'HEM':hem,'WBM':wbm}
            records.append({'native_tile':tile['id'],'column':col,'row':row,'weight_decimal':str(weight),'asset_path':shard['path'],'values':raw})
        return records

def _sample(point,lat_text,lon_text):
    pack,index=_PACK
    records=_support_records(lat_text,lon_text);values=[];classes=[];unknown_hem=0;strict=True
    with localcontext() as context:
        context.prec=50
        for record in records:
            raw=record['values'];triple=[raw[key] for key in ('FLM','EDM','WBM')]
            if not finite(raw['DEM']) or triple not in pack['policy']['accepted_support_class_triples_flm_edm_wbm']:
                fail('surface_support_unknown','路線含未具備參考資格的來源像素，保留原始資料。')
            hem=raw['HEM'];unknown=not finite(hem) or hem<0 or hem==pack['policy']['HEM_NoData']
            unknown_hem+=int(unknown);strict=strict and triple==[2,1,0] and not unknown
            values.append(Decimal.from_float(float(raw['DEM']))*Decimal(record['weight_decimal']));classes.append(triple)
        z=float(sum(values))
    if not finite(z) or not -1000<=z<=10000:fail('surface_elevation','地表參考海拔超出既有路線輸入範圍。')
    return z,classes,unknown_hem,strict

def _derive(original_bytes):
    if _PACK is None:fail('surface_source_unavailable','地表參考資料尚未載入。')
    original=parse_gpx(original_bytes)
    if len(original.segments)!=1:fail('surface_segments','地表參考僅支援單一連續路線，不會連接斷段。')
    root,ns,nodes,_=_tree(original_bytes,original)
    heights=[];unknown_hem=0;strict_refused=0;classes={}
    for point,node in zip(original.segments[0],nodes):
        z,codes,hem,strict=_sample(point,node.attrib['lat'],node.attrib['lon']);heights.append(z);unknown_hem+=hem;strict_refused+=int(not strict)
        for code in codes:
            key=','.join(map(str,code));classes[key]=classes.get(key,0)+1
    removed={'timestamps':0,'extension_containers':0,'waypoint_elevations':0,
             'point_measurement_fields':{name:0 for name in _POINT_MEASUREMENT_FIELDS}}
    # Quarantine all activity/timing extensions; immutable originals retain them.
    for parent in list(root.iter()):
        for child in list(parent):
            local=child.tag.rsplit('}',1)[-1] if isinstance(child.tag,str) else ''
            if local in ('time','extensions'):
                removed['timestamps' if local=='time' else 'extension_containers']+=1;parent.remove(child)
            elif (parent.tag in (ns+'wpt',ns+'rtept',ns+'trkpt') and
                  child.tag in {ns+name for name in _POINT_MEASUREMENT_FIELDS}):
                removed['point_measurement_fields'][local]+=1;parent.remove(child)
    for waypoint in root.findall(ns+'wpt'):
        for ele in list(waypoint.findall(ns+'ele')):waypoint.remove(ele);removed['waypoint_elevations']+=1
    for node,z in zip(nodes,heights):
        ele=node.find(ns+'ele')
        if ele is None:ele=ET.Element(ns+'ele');node.insert(0,ele)
        ele.text=repr(z)
    pack=_PACK[0]
    provenance={'schema_version':VERSION,'derivation_kind':'whole_provider_surface',
        'original_sha256':original.sha256,'original_byte_count':original.byte_count,
        'original_point_count':original.point_count,'source_pack_sha256':PACK_SHA,
        'source_pack_id':pack['pack_id'],'source':copy.deepcopy(pack['source']),'policy':copy.deepcopy(pack['policy']),
        'identity_mapping':'same segment/local/global original occurrences; XY and order unchanged',
        'height_profile_sha256':digest(canonical(heights)),'removed_from_geometry_only_variant':removed,
        'licence':copy.deepcopy(pack['licence']),'requires_confirmation':True,
        'accuracy_claim':None,'official_identity_inherited':False,'original_bytes_modified':False,
        'support_summary':{'complete_original_occurrences':len(heights),'required_native_support_occurrences':4*len(heights),
             'class_triple_counts_flm_edm_wbm':classes,'unknown_HEM_support_occurrences':unknown_hem,
             'strict_C1_refused_occurrences':strict_refused,'strict_C1_policy_changed':False}}
    container=root if original.namespace=='http://www.topografix.com/GPX/1/0' else ET.SubElement(root,ns+'extensions')
    marker=ET.SubElement(container,'{'+MARKER_NS+'}whole-provider-surface-reference')
    marker.set('original-sha256',original.sha256);marker.set('source-pack-sha256',PACK_SHA)
    marker.set('status','DSM_surface_scenario_not_observed_trail_ground_or_activity')
    # Required notices travel with derived and later enriched exports.
    marker.text=json.dumps({'method':VERSION,'provider':pack['source']['provider'],'licence':pack['licence'],
        'height_unit':pack['source']['height_unit'],'vertical_reference':pack['source']['vertical_reference'],
        'surface_class':pack['source']['surface_class'],
        'point_measurement_metadata':'Original geoid separation and GNSS fix/accuracy fields are not transferred to provider-surface elevations; retained in the unchanged original GPX.',
        'attribution':'produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved',
        'liability':'The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the Copernicus WorldDEM-30',
        'endorsement':'No official endorsement is implied. Subsequent distribution must preserve the licence obligations.'},ensure_ascii=False,separators=(',',':'))
    derived=ET.tostring(root,encoding='utf-8',xml_declaration=True)
    checked=parse_gpx(derived)
    if checked.point_count!=original.point_count or len(checked.segments)!=1 or any(
        (a.lat,a.lon,z)!=(b.lat,b.lon,b.ele) for a,b,z in zip(original.segments[0],checked.segments[0],heights)):
        fail('surface_roundtrip','地表參考點位核對失敗，保留原始資料。')
    geometry=build_geometry(checked)
    provenance['summary']={'point_count':len(heights),'coverage_percent':100,'preview_core_blocked':geometry.blocked,
        'preview_has_out_of_domain':any(q['code']=='grade_out_of_domain' for q in geometry.quality),
        'original_missing_points':sum(p.ele is None for p in original.segments[0]),
        'original_distance_m':build_geometry(original).distance_m,'derived_distance_m':geometry.distance_m,
        'derived_ascent_m':geometry.ascent_m,'derived_descent_m':geometry.descent_m}
    provenance['derived_profile_sha256']=digest(canonical(provenance))
    return provenance,derived

def propose_surface_reference(original_bytes):return _derive(original_bytes)[0]

def materialize_surface_reference(original_bytes,proposal,*,confirmed=False):
    if confirmed is not True:fail('surface_confirmation_required','請先確認採用整條路線的地表參考版本。')
    expected,derived=_derive(original_bytes)
    if not isinstance(proposal,dict) or canonical(proposal)!=canonical(expected):
        fail('surface_proposal_changed','地表參考提案已變更，請重新檢查並確認。')
    if expected['summary']['preview_core_blocked']:fail('surface_geometry_blocked','參考版本未通過既有路線檢查，保留原始資料。')
    return derived
