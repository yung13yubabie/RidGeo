import {ACTIONASIA_MAOKONG_SOURCES} from '../../public/route-bridge-client.mjs';
import {GOOGLE_BRIDGED_SOURCES} from '../../public/google-route-sources.mjs';
// Candidates are server configuration, never supplied by a visitor.
// Action Asia and reviewed public Google downloads are visitor-triggered and transient. HK100 is disabled.
export const OFFICIAL_HOSTS = Object.freeze(['hk100ultra.com', 'actionasiaevents.com']);
export const OFFICIAL_PAGE_HOSTS=Object.freeze([...OFFICIAL_HOSTS,'www.twttra.com','formosatrail.com','www.bao-ming.com','backyard.run','www.runningstream.run','formosaxtri.com','www.galerdo.net']);
export const FIXED_GOOGLE_URLS=Object.freeze(GOOGLE_BRIDGED_SOURCES.map(source=>source.officialURL));
export const SOURCE_CANDIDATES = Object.freeze([
  Object.freeze({
    id: 'hk100-2027-full',
    officialPage: 'https://hk100ultra.com/hk100/',
    url: 'https://hk100ultra.com/wp-content/uploads/2026/06/HK100-Full-2027.gpx',
    edition: 2027,
    enabled: false,
    rightsStatus: 'review_pending',
    reviewedSha256: null,
    reviewedAt: null,
    note: 'Official anonymous download; no CORS. Third-party relay permission is not explicitly stated; do not claim a redistribution license.',
  }),
  Object.freeze({
    id: 'taiwan-action-asia-2026-50km',
    officialPage: 'https://actionasiaevents.com/2026-taiwan-action-asia-50-shihmen-reservoir/',
    url: 'https://actionasiaevents.com/wp-content/uploads/2026/07/TWAA50.gpx',
    edition: 2026,
    enabled: true,
    rightsStatus: 'reviewed_transient_personal_use',
    reviewedSha256: '13662c94c91da42580d0cfb7c8e0a70781cb9e67c2265180e33eaaee2a6d700c',
    reviewedAt: '2026-10-13T14:03:23.743738Z',
    rightsReviewAt: '2026-10-13T14:14:50Z',
    rightsNote: 'Official public GPX DOWNLOAD and visible event terms reviewed; no proxy/reuse prohibition found in that scope. Explicit third-party relay or mirror license not established. Only visitor-initiated transient personal analysis, source attribution, no storage or bulk mirror.',
    note: 'Anonymous HTTP200 GPX verified live twice without CORS. This source is active only behind the actual Workers public-egress guard.',
  }),
  Object.freeze({
    id: 'taiwan-action-asia-2026-26km',
    officialPage: 'https://actionasiaevents.com/2026-taiwan-action-asia-50-shihmen-reservoir/',
    url: 'https://actionasiaevents.com/wp-content/uploads/2026/06/26km-NEW-Taiwan-Action-Asia-50-Taiwan-Shihmen-Reservoir.gpx',
    edition: 2026,
    enabled: true,
    rightsStatus: 'reviewed_transient_personal_use',
    reviewedSha256: 'cc1b1d611b720ec964acfe9b5390c7a83209505c4630463911b5b8563a2dacb2',
    reviewedAt: '2026-10-13T18:37:58Z',
    rightsReviewAt: '2026-10-13T18:37:51Z',
    rightsNote: 'Same official 2026 GPX DOWNLOAD page and visible event terms reviewed. No proxy/reuse prohibition found in that bounded scope; no general relay or mirror license established. Visitor-triggered transient personal analysis only, original notices preserved, no storage or bulk mirror.',
    note: 'Anonymous HTTP200 GPX, complete elevations, no CORS. Active only behind actual Workers public-egress guard. Steep-terrain model limits still apply.',
  }),
  Object.freeze({
    id: 'taiwan-action-asia-2026-12km',
    officialPage: 'https://actionasiaevents.com/2026-taiwan-action-asia-50-shihmen-reservoir/',
    url: 'https://actionasiaevents.com/wp-content/uploads/2026/06/12-km-Taiwan-Action-Asia-50-Shihmen.gpx',
    edition: 2026,
    enabled: true,
    rightsStatus: 'reviewed_transient_personal_use',
    reviewedSha256: 'dec270e17cc0c2528af01e212c8429fc895384482573e1baa792bf5f9b265592',
    reviewedAt: '2026-10-13T18:38:02Z',
    rightsReviewAt: '2026-10-13T18:37:51Z',
    rightsNote: 'Same official 2026 GPX DOWNLOAD page and visible event terms reviewed. No proxy/reuse prohibition found in that bounded scope; no general relay or mirror license established. Visitor-triggered transient personal analysis only, original notices preserved, no storage or bulk mirror.',
    note: 'Anonymous HTTP200 GPX, complete elevations, no CORS. Active only behind actual Workers public-egress guard. Steep-terrain model limits still apply.',
  }),
  ...ACTIONASIA_MAOKONG_SOURCES.map(source=>Object.freeze({
    id:source.sourceId,officialPage:source.officialPage,url:source.officialURL,edition:source.edition,enabled:true,
    rightsStatus:'reviewed_transient_personal_use',reviewedSha256:source.reviewedSha256,reviewedAt:source.reviewedAt,rightsReviewAt:source.reviewedAt,
    rightsNote:'Exact public originals and 2027 organizer link chain independently reviewed. General redistribution permission is not established. Visitor-triggered transient personal analysis only; preserve attribution and original bytes, no storage or bulk mirror.',
    note:'Fixed ActionAsia source; no CORS claim, arbitrary URL, alternate endpoint or denial bypass. Ordinary model remains grade_out_of_domain.',
  })),
  ...GOOGLE_BRIDGED_SOURCES.map(source=>Object.freeze({
    id:source.sourceId,officialPage:source.officialPage,url:source.officialURL,edition:source.edition,
    enabled:true,rightsStatus:'reviewed_transient_personal_use',reviewedSha256:source.reviewedSha256,reviewedAt:source.reviewedAt,
    rightsReviewAt:source.rightsReviewAt||'2026-10-13T21:44:20Z',
    rightsNote:source.rightsNote||'Official organizers publicly link GPX downloads. Normal anonymous exact-URL server downloads verified; no login, token, cookie, spoofed Fetch Metadata or alternate endpoint. Google public-download documentation and visible organizer pages reviewed; no specific transient relay prohibition found in that bounded scope. No general redistribution license established. Visitor-triggered personal analysis only; no cache or mirror.',
    note:source.browserDirectStatus==='not_tested'?'Exact normal anonymous server retrieval verified; direct browser CORS and Fetch Metadata behavior have not been tested for this source. The fixed bridge stops on any upstream denial and preserves original link and bytes.':'Browser cross-site fetch is refused by Fetch Metadata policy. This bridge uses a normal credential-free server GET and stops on any upstream denial. Original official link and exact byte identity preserved.',
  })),
]);
