import {quarantinePublishedCheckpointTables} from './published-checkpoint-tables.mjs';
import {validateEventDates} from './catalog-dates.mjs';
import {GOOGLE_BRIDGE_IDENTITIES} from './google-route-sources.mjs';
import {isVerifiedGoogleGpxEndpoint} from './source-endpoints.js';
import {BRIDGED_SOURCE,BRIDGED_SOURCES,getBridgedSource,ACTIONASIA_MAOKONG_IDENTITIES} from './route-bridge-client.mjs';
/** Public event facts are distinct from verified downloadable route bytes. */
export const REGION_LABELS=Object.freeze({Asia:'亞洲',Europe:'歐洲','North America':'北美洲','South America':'南美洲',Africa:'非洲',Oceania:'大洋洲'});
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
function publicUrl(value){assert(typeof value==='string','Missing public source URL');const u=new URL(value);assert(u.protocol==='https:'&&!u.username&&!u.password,'Unsafe public source URL');return value;}
function day(value){assert(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value),'Invalid event date');const n=Date.parse(value+'T00:00:00Z');assert(Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===value,'Invalid event calendar date');}
function freeze(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}
const BRIDGE_EVENT_ID='taiwan-action-asia-50-2026';
// Only these reviewed event groups may use the bridge. The client registry supplies
// each group's fixed URL, endpoint and reviewed byte identity, never response data.
const BRIDGE_IDENTITIES=Object.freeze({...GOOGLE_BRIDGE_IDENTITIES,...ACTIONASIA_MAOKONG_IDENTITIES,...Object.fromEntries([50,26,12].map(distance=>[
  `taiwan-action-asia-2026-${distance}km`,
  Object.freeze({name:`Taiwan Action Asia ${distance}km`,rowName:`${distance}km`,distance,eventId:BRIDGE_EVENT_ID,eventOfficialPage:BRIDGED_SOURCE.officialPage,eventMetadataSource:BRIDGED_SOURCE.officialPage}),
]))});
const bridgeIdentity=id=>Object.hasOwn(BRIDGE_IDENTITIES,id)?BRIDGE_IDENTITIES[id]:null;
const hasBridgeFields=value=>Object.hasOwn(value,'bridgeSourceId')||Object.hasOwn(value,'bridgeEndpoint')||value.transport==='same_origin_bridge'||value.downloadKind==='verified_bridge_endpoint';
const isBridgeURL=url=>BRIDGED_SOURCES.some(source=>source.officialURL===url);
// Bind every declared import row to the selected reviewed source, independently
// of its transport. Optional facts cannot contradict the source merely because
// this provider does not use the fixed-source bridge registry.
function validateImportReference(event,reference,routeMap){
  if(reference.routeId===undefined)return;
  const route=routeMap.get(reference.routeId);
  assert(route&&event.routeIds.includes(reference.routeId),'Import row must name a selected reviewed route');
  assert(route.edition===event.year&&reference.gpxDownloadUrl===route.gpxUrl&&reference.sha256===route.sha256,'Import row source identity must match reviewed route');
  if(reference.edition!==undefined&&reference.edition!==null)assert(reference.edition===route.edition,'Import row edition does not match reviewed route');
  if(reference.bytes!==undefined&&reference.bytes!==null)assert(reference.bytes===route.bytes,'Import row bytes do not match reviewed route');
  if(reference.nominalDistanceKm!==undefined&&reference.nominalDistanceKm!==null)assert(reference.nominalDistanceKm===route.nominalDistanceKm,'Import row distance does not match reviewed route');
  if(reference.validation?.bytes!==undefined&&reference.validation.bytes!==null)assert(reference.validation.bytes===route.bytes,'Import row validation bytes do not match reviewed route');
}
function validateBridgeRoute(route){
  const source=getBridgedSource(route?.id),identity=bridgeIdentity(route?.id);
  assert(source&&identity&&route.transport==='same_origin_bridge'&&route.directFetch===false&&route.bridgeSourceId===source.sourceId&&route.bridgeEndpoint===source.endpoint&&route.gpxUrl===source.officialURL&&route.officialPage===source.officialPage&&route.sha256===source.reviewedSha256&&route.bytes===source.expectedBytes&&route.edition===source.edition&&route.verifiedAt===source.reviewedAt&&route.name===identity.name&&route.nominalDistanceKm===identity.distance,'Unverified fixed bridge route identity');
  if(source.originalDownloadUrl)assert(route.originalDownloadUrl===source.originalDownloadUrl&&route.sourceFilename===source.sourceFilename,'Reviewed source filename or original entry changed');
  if(source.originalOfficialDownloadEntry)assert(route.originalOfficialDownloadEntry===source.originalOfficialDownloadEntry&&route.officialDownloadPageUrl===source.originalOfficialDownloadEntry,'Original official source folder changed');
  if(source.coordinateSelection)assert(route.coordinateSelection===source.coordinateSelection&&route.mappingMode==='projected_official_coordinates','Explicit official coordinate capability changed');
  if(Object.hasOwn(source,'officialCheckpointCount'))assert(route.officialCheckpointStatus===source.officialCheckpointStatus&&route.officialCheckpointCount===source.officialCheckpointCount&&route.officialAidStationCount===source.officialAidStationCount&&Array.isArray(route.checkpoints)&&(source.officialCheckpointCount===null?route.checkpoints.length===0:route.checkpoints.length===source.officialCheckpointCount),'Official station facts or unknown count changed');
}
function validateBridgeReference(event,reference,routeMap){
  const source=getBridgedSource(reference?.routeId),identity=bridgeIdentity(reference?.routeId);
  assert(source&&identity,'Unknown fixed bridge row identity');
  assert(event.importability==='bridge_verified'&&event.id===identity.eventId&&event.year===source.edition&&event.edition===source.edition&&event.officialPage===identity.eventOfficialPage&&event.metadata.source===identity.eventMetadataSource,'Bridge source cannot be assigned to another event');
  assert(reference.name===identity.rowName&&reference.bridgeSourceId===source.sourceId&&reference.bridgeEndpoint===source.endpoint&&reference.transport==='same_origin_bridge'&&reference.downloadKind==='verified_bridge_endpoint'&&reference.gpxDownloadUrl===source.officialURL&&reference.officialPage===source.officialPage&&reference.sha256===source.reviewedSha256&&reference.bytes===source.expectedBytes&&reference.edition===source.edition&&reference.availability==='verified_public'&&event.routeIds.includes(reference.routeId),'Unverified fixed bridge row identity');
  if(source.originalDownloadUrl)assert(reference.originalDownloadUrl===source.originalDownloadUrl,'Original source entry changed');
  if(source.originalOfficialDownloadEntry)assert(reference.originalOfficialDownloadEntry===source.originalOfficialDownloadEntry&&reference.officialDownloadPageUrl===source.originalOfficialDownloadEntry&&event.officialDownloadPageUrl===source.originalOfficialDownloadEntry,'Original official event source folder changed');
  if(reference.nominalDistanceKm!==undefined&&reference.nominalDistanceKm!==null)assert(reference.nominalDistanceKm===identity.distance,'Bridge row distance does not match source');
  if(reference.validation?.bytes!==undefined&&reference.validation.bytes!==null)assert(reference.validation.bytes===source.expectedBytes,'Bridge validation bytes do not match source');
  validateBridgeRoute(routeMap.get(reference.routeId));
}
export function validateEventCatalog(facts,routes){
  assert(Array.isArray(facts)&&facts.length>0&&facts.length<=2000,'Invalid event catalog');assert(Array.isArray(routes)&&new Set(routes.map(r=>r.id)).size===routes.length,'Invalid or duplicate route catalog');facts=facts.map(quarantinePublishedCheckpointTables);const ids=new Set(),routeMap=new Map(routes.map(r=>[r.id,r]));
  for(const route of routes)if(hasBridgeFields(route)||bridgeIdentity(route.id)||isBridgeURL(route.gpxUrl))validateBridgeRoute(route);
  for(const e of facts){
    assert(typeof e.id==='string'&&/^[a-z0-9-]+$/.test(e.id)&&!ids.has(e.id),'Duplicate or invalid event ID');ids.add(e.id);
    for(const field of ['name','country','region','importabilityReason'])assert(typeof e[field]==='string'&&e[field].length>0&&e[field].length<=1000,'Invalid event text');
    assert(Object.hasOwn(REGION_LABELS,e.region)&&Number.isInteger(e.year)&&e.year>=2000&&e.year<=2100&&e.edition===e.year,'Invalid event edition or region');if(e.date===null||e.dateStart===null||e.dateEnd===null||Object.hasOwn(e,'dateStatus')||Object.hasOwn(e,'dateEvidence'))validateEventDates(e);else{day(e.dateStart);day(e.dateEnd);assert(e.dateEnd>=e.dateStart,'Reversed event date range');assert(Number(e.dateStart.slice(0,4))===e.year&&Number(e.dateEnd.slice(0,4))===e.year,'Event dates must match stated edition');}assert(['announced','past'].includes(e.status),'Unknown event status');assert(['verified_public','verified_public_no_elevation','official_download_page_verified','official_download_link_verified','not_checked','official_previous_edition_reference'].includes(e.gpxAvailability),'Unknown GPX availability');
    publicUrl(e.officialPage);publicUrl(e.metadata?.source);assert(typeof e.metadata?.verifiedAt==='string'&&Number.isFinite(Date.parse(e.metadata.verifiedAt)),'Unverified event metadata');
    assert(['direct_verified','bridge_verified','download_only','no_gpx','blocked'].includes(e.importability),'Unknown import state');assert(Array.isArray(e.routes)&&Array.isArray(e.routeIds),'Invalid event route references');
    if(e.blockedDownloads!==undefined){assert(Array.isArray(e.blockedDownloads)&&e.blockedDownloads.length<=10,'Invalid unavailable routes');for(const r of e.blockedDownloads){assert(typeof r.name==='string'&&r.name.length>0&&r.name.length<=100&&typeof r.reason==='string'&&r.reason.length>0&&r.reason.length<=200,'Invalid unavailable route text');assert(isVerifiedGoogleGpxEndpoint(r.url)&&!e.routes.some(v=>v.gpxDownloadUrl===r.url),'Unavailable download must be a separate verified endpoint');}}if(e.routePageUrl)publicUrl(e.routePageUrl);
    if(e.gpxLinkType!==undefined)assert(['raw_gpx','official_download_page'].includes(e.gpxLinkType),'Unknown GPX link type');
    if(e.gpxLinkType==='raw_gpx')assert(e.importability==='download_only'&&e.gpxAvailability!=='official_download_page_verified','Raw file label conflicts with source tier');
    if(e.gpxLinkType==='official_download_page')assert(e.importability==='download_only'&&e.gpxAvailability==='official_download_page_verified','Download entry is not a verified raw file');
    if(e.gpxFilenameYear!==undefined)assert(Number.isInteger(e.gpxFilenameYear)&&e.gpxFilenameYear>=2000&&e.gpxFilenameYear<=2100,'Invalid filename year');
    if(e.distanceLabels!==undefined)assert(Array.isArray(e.distanceLabels)&&e.distanceLabels.length<=40&&e.distanceLabels.every(x=>typeof x==='string'&&x.length>0&&x.length<=200),'Invalid official distance labels');
    if(e.distanceSources!==undefined){assert(Array.isArray(e.distanceSources)&&e.distanceSources.length<=40,'Invalid distance sources');for(const source of e.distanceSources){publicUrl(source.officialPage);assert(typeof source.name==='string'&&source.name.length>0&&source.name.length<=200,'Invalid distance source name');if(source.distanceKm!==undefined&&source.distanceKm!==null)assert(typeof source.distanceKm==='number'&&Number.isFinite(source.distanceKm)&&source.distanceKm>0&&source.distanceKm<=2000,'Invalid official distance');}}
    const infoPages=new Set([e.routePageUrl,...e.routes.map(r=>r.routePageUrl)].filter(Boolean));
    const downloadLinks=[e.gpxDownloadUrl,...e.routes.map(r=>r.gpxDownloadUrl)].filter(Boolean);
    for(const link of downloadLinks){publicUrl(link);assert(!infoPages.has(link),'A route information URL cannot become a GPX download');const endpoint=isVerifiedGoogleGpxEndpoint(link)&&['direct_verified','bridge_verified'].includes(e.importability)&&e.routes.some(r=>['verified_gpx_endpoint','verified_bridge_endpoint'].includes(r.downloadKind)&&r.gpxDownloadUrl===link&&e.routeIds.includes(r.routeId)&&routeMap.get(r.routeId)?.gpxUrl===link&&routeMap.get(r.routeId)?.sha256===r.sha256);const raw=/\.gpx$/i.test(new URL(link).pathname)||endpoint;const entry=e.routes.some(r=>r.gpxDownloadUrl===link&&r.downloadKind==='google_drive_file_page');assert((entry||e.gpxAvailability==='official_download_page_verified')?!raw:raw,'GPX link shape conflicts with file versus entry-page tier');}
    if(e.officialDownloadPageUrl)publicUrl(e.officialDownloadPageUrl);if(e.gpxDownloadUrl)publicUrl(e.gpxDownloadUrl);if(e.gpxSourcePage)publicUrl(e.gpxSourcePage);
    const referencedRouteIds=e.routes.filter(r=>r.routeId!==undefined).map(r=>r.routeId);assert(new Set(referencedRouteIds).size===referencedRouteIds.length,'Duplicate route row identity');for(const r of e.routes){validateImportReference(e,r,routeMap);if(hasBridgeFields(r)||bridgeIdentity(r.routeId)||isBridgeURL(r.gpxDownloadUrl))validateBridgeReference(e,r,routeMap);if(r.routePageUrl)publicUrl(r.routePageUrl);if(r.downloadKind!==undefined){assert(['google_drive_file_page','organizer_linked_route_page','raw_gpx','verified_gpx_endpoint','verified_bridge_endpoint'].includes(r.downloadKind),'Unknown route download kind');if(r.downloadKind==='verified_gpx_endpoint'){const verified=routeMap.get(r.routeId);assert(e.importability==='direct_verified'&&isVerifiedGoogleGpxEndpoint(r.gpxDownloadUrl)&&e.routeIds.includes(r.routeId)&&verified&&verified.gpxUrl===r.gpxDownloadUrl&&verified.sha256===r.sha256,'Unverified raw endpoint identity');}if(r.downloadKind==='organizer_linked_route_page')assert(!r.gpxDownloadUrl&&r.routePageUrl,'Route information page is not a GPX download');if(r.downloadKind==='google_drive_file_page'){assert(!r.routeId&&/^https:\/\/drive\.google\.com\/file\/d\/[^/]+\/view(?:\?|$)/.test(r.gpxDownloadUrl),'Drive entry page cannot claim verified route bytes');}}if(r.originalDownloadUrl)publicUrl(r.originalDownloadUrl);if(r.gpxDownloadUrl)publicUrl(r.gpxDownloadUrl);if(r.officialPage)publicUrl(r.officialPage);}
    assert(new Set(e.routeIds).size===e.routeIds.length,'Duplicate import route reference');
    if(e.gpxAvailability==='official_previous_edition_reference')assert(e.routeEditionMatchesEvent===false,'Prior edition GPX must be marked explicitly');
    if(e.routeEditionMatchesEvent===false){assert(Number.isInteger(e.routeYear)&&e.routeYear>=2000&&e.routeYear<e.year&&e.importability==='download_only'&&e.gpxAvailability==='official_previous_edition_reference'&&(e.gpxDownloadUrl||e.routes.some(r=>r.gpxDownloadUrl)),'Historical GPX requires a verified previous-edition download');}else if(e.routeYear!==undefined)assert(e.routeYear===e.year,'A different route year must be explicitly marked as historical');
    if(e.gpxCreatedYear!==undefined){assert(Number.isInteger(e.gpxCreatedYear)&&typeof e.gpxCreatedAt==='string'&&Number.isFinite(Date.parse(e.gpxCreatedAt))&&Number(e.gpxCreatedAt.slice(0,4))===e.gpxCreatedYear,'Invalid GPX creation metadata');}
    if(e.importability==='direct_verified'){
      assert(e.routeIds.length>0&&referencedRouteIds.length===e.routeIds.length&&e.cors?.status==='verified_allowed','Direct import needs its selected reviewed route rows and verified CORS');
      for(const id of e.routeIds){const route=routeMap.get(id),reference=e.routes.find(r=>r.routeId===id);assert(route&&reference&&route.edition===e.year&&reference.gpxDownloadUrl===route.gpxUrl&&reference.sha256===route.sha256,'Direct route identity must match verified bytes');}
    }else if(e.importability==='bridge_verified'){
      assert(e.routeIds.length>0&&e.routeIds.length<=Object.keys(BRIDGE_IDENTITIES).length&&referencedRouteIds.length===e.routeIds.length&&e.routeIds.every(id=>bridgeIdentity(id)?.eventId===e.id),'Bridge import needs its reviewed fixed sources');
      if(e.id===BRIDGE_EVENT_ID)assert(e.routeIds.includes(BRIDGED_SOURCE.sourceId)&&e.gpxDownloadUrl===BRIDGED_SOURCE.officialURL&&e.cors?.status==='not_tested','Action Asia bridge provenance changed');
      else if(Object.values(ACTIONASIA_MAOKONG_IDENTITIES).some(identity=>identity.eventId===e.id))assert(e.cors?.status==='not_tested'&&!e.gpxDownloadUrl,'Action Asia Maokong bridge provenance changed');
      else assert(Object.values(GOOGLE_BRIDGE_IDENTITIES).some(identity=>identity.eventId===e.id)&&e.cors?.status===(GOOGLE_BRIDGE_IDENTITIES[e.routeIds[0]]?.eventCorsStatus||'browser_cross_site_blocked')&&!e.gpxDownloadUrl,'Google bridge must not claim working browser CORS');
      for(const id of e.routeIds){assert(getBridgedSource(id)&&bridgeIdentity(id),'Unknown bridge import route reference');validateBridgeReference(e,e.routes.find(r=>r.routeId===id),routeMap);}
    }else assert(e.routeIds.length===0,'Non-importable event cannot expose import route IDs');
    if(e.importability==='download_only')assert(e.gpxDownloadUrl||e.routes.some(r=>r.gpxDownloadUrl),'Download state needs an official link');
    const allowedAvailability={direct_verified:['verified_public','verified_public_no_elevation'],bridge_verified:['verified_public'],download_only:['verified_public','official_download_page_verified','official_download_link_verified','official_previous_edition_reference'],no_gpx:['not_checked'],blocked:['not_checked']};
    assert(allowedAvailability[e.importability].includes(e.gpxAvailability),'GPX availability and import state conflict');
    if(e.gpxAvailability==='not_checked')assert(!e.gpxDownloadUrl&&!e.routes.some(r=>r.gpxDownloadUrl||r.routeId)&&e.routeIds.length===0,'Unverified GPX cannot be shown as available');
  }
  return freeze(facts);
}
export function eventBadge(event){
  if(event.routeEditionMatchesEvent===false)return `${event.routeYear} 前屆 GPX 參考`;
  if(event.importability==='direct_verified')return '可直接導入 GPX';
  if(event.importability==='bridge_verified')return '可導入 GPX';
  if(event.importability==='download_only')return event.gpxAvailability==='official_download_page_verified'?'官方 GPX 入口':'官方 GPX 連結';
  return 'GPX 尚未核實';
}
export function filterEvents(events,routes,{query='',country='',year='',distance='',availability=''}={}){
  const q=query.trim().toLocaleLowerCase();const routeMap=new Map(routes.map(r=>[r.id,r]));
  const importable=e=>e.importability==='direct_verified'||e.importability==='bridge_verified';
  return events.filter(e=>(!q||[e.name,e.country,REGION_LABELS[e.region],e.region,e.year].join(' ').toLocaleLowerCase().includes(q))&&(!country||e.country===country)&&(!year||String(e.year)===year)&&(!availability||(availability==='direct'?importable(e):importable(e)||e.importability==='download_only'))&&(!distance||e.routeIds.some(id=>{const d=routeMap.get(id)?.nominalDistanceKm;return Number.isFinite(d)&&(distance==='short'?d<30:distance==='medium'?d>=30&&d<=80:d>80);})));
}
