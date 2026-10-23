import {attachPublishedCheckpointTables} from './published-checkpoint-table-data.mjs';
/* Verified public event facts; GPX bytes are never mirrored. */
export const EVENT_FACTS=[
  {
    "id": "translantau-2026",
    "name": "TransLantau by UTMB",
    "country": "香港",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-11-13 / 2026-11-15",
    "dateStart": "2026-11-13",
    "dateEnd": "2026-11-15",
    "status": "announced",
    "officialPage": "https://translantau.utmb.world/",
    "metadata": {
      "verifiedAt": "2026-10-13T10:55:00Z",
      "source": "https://translantau.utmb.world/",
      "dateEvidence": "Official event homepage or race page explicitly displays this edition and date range.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "verified_public",
    "importability": "direct_verified",
    "importabilityReason": "已驗證官方 GPX 可直接載入；包含 25／50／100 三組。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Direct official fetch only, no mirrored GPX; local event terms reviewed.",
      "termsUrl": "https://translantau.utmb.world/terms-and-conditions"
    },
    "cors": {
      "status": "verified_allowed",
      "evidence": "Official CDN GET returned Access-Control-Allow-Origin:* for all three routes, 2026-10-13."
    },
    "routes": [
      {
        "routeId": "translantau-2026-tl25",
        "name": "TransLantau25",
        "gpxDownloadUrl": "https://pdf.utmb.world/raw/upload/v1774020140/translantau/Races/TL%202026/TL_27k_1100_19_03_1_e0185671d2.gpx",
        "officialPage": "https://translantau.utmb.world/races/tl25",
        "sha256": "d356233fb0d9bc89514625965c77f6544fd4c259f5e7a2d0272540f0b95e3594"
      },
      {
        "routeId": "translantau-2026-tl50",
        "name": "TransLantau50",
        "gpxDownloadUrl": "https://pdf.utmb.world/raw/upload/v1791442115/translantau/Races/TL%202026/TL_45k_2100_3009_new_ff21562854.gpx",
        "officialPage": "https://translantau.utmb.world/races/tl50",
        "sha256": "6c9dbdd4bcab9548431afe70f8f46443983d621243587b2275f5d3bdeb2b3a97"
      },
      {
        "routeId": "translantau-2026-tl100",
        "name": "TransLantau100",
        "gpxDownloadUrl": "https://pdf.utmb.world/raw/upload/v1791442138/translantau/Races/TL%202026/TL_103k_4600_3009_new_6a88075557.gpx",
        "officialPage": "https://translantau.utmb.world/races/tl100",
        "sha256": "1f81592b5e2b516bc35fc11e10d2ea8916beaa344caf3e872e982f02d7049d7a"
      }
    ],
    "routeIds": [
      "translantau-2026-tl25",
      "translantau-2026-tl50",
      "translantau-2026-tl100"
    ]
  },
  {
    "id": "hk100-2027",
    "name": "Hong Kong 100 Ultra",
    "country": "香港",
    "region": "Asia",
    "year": 2027,
    "edition": 2027,
    "date": "2027-01-21 / 2027-01-24",
    "dateStart": "2027-01-21",
    "dateEnd": "2027-01-24",
    "status": "announced",
    "officialPage": "https://hk100ultra.com/",
    "metadata": {
      "verifiedAt": "2026-10-13T10:55:00Z",
      "source": "https://hk100ultra.com/hk100/",
      "dateEvidence": "Official homepage lists 21–24 January 2027 festival and route pages explicitly identify 2027.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": "https://hk100ultra.com/wp-content/uploads/2026/06/HK100-Full-2027.gpx",
    "gpxAvailability": "verified_public",
    "importability": "download_only",
    "importabilityReason": "官方本屆 GPX 已公布，伺服器未提供跨站 CORS；可開啟官方下載。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Only minimal factual event metadata retained; no GPX redistribution permission implied."
    },
    "cors": {
      "status": "verified_no_cors",
      "evidence": "HTTP200 GPX GET has no Access-Control-Allow-Origin header, 2026-10-13."
    },
    "routes": [
      {
        "name": "HK100 100K",
        "gpxDownloadUrl": "https://hk100ultra.com/wp-content/uploads/2026/06/HK100-Full-2027.gpx"
      },
      {
        "name": "The Half 53K",
        "gpxDownloadUrl": "https://hk100ultra.com/wp-content/uploads/2026/06/HK100-The-Half-2027.gpx"
      },
      {
        "name": "The Third 34K",
        "gpxDownloadUrl": "https://hk100ultra.com/wp-content/uploads/2026/06/HK100-The-Third-2027.gpx"
      }
    ],
    "routeIds": []
  },
  {
    "id": "skyhunter-shilin-2026",
    "name": "SKYHUNTER 士林越野",
    "country": "台灣",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-11-08",
    "dateStart": "2026-11-08",
    "dateEnd": "2026-11-08",
    "status": "announced",
    "officialPage": "https://www.twttra.com/posts/2026-skyhunter-shilin-trail",
    "metadata": {
      "verifiedAt": "2026-10-13T10:55:00Z",
      "source": "https://www.twttra.com/posts/2026-skyhunter-shilin-trail",
      "dateEvidence": "Official event homepage or race page explicitly displays this edition and date range.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxAvailability": "verified_public",
    "importability": "bridge_verified",
    "importabilityReason": "3K、8K 可規劃；50K 含陡坡；24K 可檢視原始路線，計算待修復。 官方原始 GPX 保留獨立下載；導入經固定來源轉接。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Only minimal factual event metadata retained; no GPX redistribution permission implied."
    },
    "cors": {
      "status": "browser_cross_site_blocked",
      "evidence": "Browser import reproduced a fetch failure. Same exact public URL with browser Fetch Metadata returned403 without ACAO; normal anonymous server GET returned200 and reviewed bytes. Import uses bounded same-origin fixed-source bridge."
    },
    "routes": [
      {
        "routeId": "skyhunter-shilin-2026-3k",
        "name": "士林越野 3K",
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=1z8-JyHyiEFInO4aXO42eL-fpSk1BZz-p&export=download",
        "sha256": "b8f25e442ac037d657a72010ad13fd0bfb8ae85705779e01f3b4f6741867cbbc",
        "downloadKind": "verified_bridge_endpoint",
        "bridgeSourceId": "skyhunter-shilin-2026-3k",
        "bridgeEndpoint": "/api/routes/skyhunter-shilin-2026-3k",
        "transport": "same_origin_bridge",
        "officialPage": "https://www.twttra.com/posts/2026-skyhunter-shilin-trail",
        "bytes": 15696,
        "edition": 2026,
        "availability": "verified_public"
      },
      {
        "routeId": "skyhunter-shilin-2026-8k",
        "name": "士林越野 8K",
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=1KOYYz5ujl6hpE7xyqaJZFklmXm5ESP13&export=download",
        "sha256": "868b9938af8ca589f4180399eddfb4f8ca754a2a047e44f3c402eceacf703634",
        "downloadKind": "verified_bridge_endpoint",
        "bridgeSourceId": "skyhunter-shilin-2026-8k",
        "bridgeEndpoint": "/api/routes/skyhunter-shilin-2026-8k",
        "transport": "same_origin_bridge",
        "officialPage": "https://www.twttra.com/posts/2026-skyhunter-shilin-trail",
        "bytes": 39758,
        "edition": 2026,
        "availability": "verified_public"
      },
      {
        "routeId": "skyhunter-shilin-2026-50k",
        "name": "士林越野 50K",
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=1opWQvt5jfcWsFyFUru38Fr1LR4GBNNso&export=download",
        "sha256": "3c1418187ef8b59df5ae7af72a9e551dbe1c6c7504a0e83d87202ea0feca4e05",
        "downloadKind": "verified_bridge_endpoint",
        "bridgeSourceId": "skyhunter-shilin-2026-50k",
        "bridgeEndpoint": "/api/routes/skyhunter-shilin-2026-50k",
        "transport": "same_origin_bridge",
        "officialPage": "https://www.twttra.com/posts/2026-skyhunter-shilin-trail",
        "bytes": 261289,
        "edition": 2026,
        "availability": "verified_public"
      },
      {
        "routeId": "skyhunter-shilin-2026-24k",
        "name": "士林越野 24K",
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=1lXuGlKFIVXIltM9H5IiZJLcDYAoPYEIY&export=download",
        "sha256": "9fd013b6a0b26dc135056e0f785444c2d8500b66d7c51b034d870dd26bbac6a1",
        "downloadKind": "verified_bridge_endpoint",
        "bridgeSourceId": "skyhunter-shilin-2026-24k",
        "bridgeEndpoint": "/api/routes/skyhunter-shilin-2026-24k",
        "transport": "same_origin_bridge",
        "officialPage": "https://www.twttra.com/posts/2026-skyhunter-shilin-trail",
        "bytes": 131014,
        "edition": 2026,
        "availability": "verified_public"
      }
    ],
    "routeIds": [
      "skyhunter-shilin-2026-3k",
      "skyhunter-shilin-2026-8k",
      "skyhunter-shilin-2026-50k",
      "skyhunter-shilin-2026-24k"
    ],
    "gpxSourcePage": "https://drive.google.com/drive/folders/1kWS2MoB8YjOC6u_fkAUJwo9l33fxsnly?usp=share_link"
  },
  {
    "id": "bennachie-ultra-trail-2026",
    "name": "Bennachie Ultra Trail",
    "country": "英國",
    "region": "Europe",
    "year": 2026,
    "edition": 2026,
    "date": "2026-10-10",
    "dateStart": "2026-10-10",
    "dateEnd": "2026-10-10",
    "status": "past",
    "officialPage": "https://www.cgm-ultra.co.uk/trail/",
    "metadata": {
      "verifiedAt": "2026-10-13T10:55:00Z",
      "source": "https://www.cgm-ultra.co.uk/trail/",
      "dateEvidence": "Official event homepage or race page explicitly displays this edition and date range.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": "https://46eaea7aca.clvaw-cdnwnd.com/00cf0245506feae90a4b8a3356ed41dc/200000214-52b7352b74/onthegomap-17-mi-route%20%281%29.gpx?ph=46eaea7aca",
    "gpxAvailability": "verified_public_no_elevation",
    "importability": "direct_verified",
    "importabilityReason": "官方 GPX 可直接載入，但沒有海拔；2026 官頁提供 2025 年建立路線。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Only minimal factual event metadata retained; no GPX redistribution permission implied."
    },
    "cors": {
      "status": "verified_allowed",
      "evidence": "HTTP200 with Access-Control-Allow-Origin:*, 888 points, 0 elevation points."
    },
    "routes": [
      {
        "routeId": "bennachie-ultra-trail-2026",
        "name": "Bennachie Ultra Trail",
        "gpxDownloadUrl": "https://46eaea7aca.clvaw-cdnwnd.com/00cf0245506feae90a4b8a3356ed41dc/200000214-52b7352b74/onthegomap-17-mi-route%20%281%29.gpx?ph=46eaea7aca",
        "sha256": "a694d8a1b28a7b901cdd5725065ce653711fbc326ea91e655ce4141a1209f654"
      }
    ],
    "routeIds": [
      "bennachie-ultra-trail-2026"
    ],
    "gpxCreatedYear": 2025,
    "gpxCreatedAt": "2025-09-28T12:55:11.912Z"
  },
  {
    "id": "chiltern-ridge-winter-2026",
    "name": "Chiltern Ridge Winter 50K",
    "country": "英國",
    "region": "Europe",
    "year": 2026,
    "edition": 2026,
    "date": "2026-10-31",
    "dateStart": "2026-10-31",
    "dateEnd": "2026-10-31",
    "status": "announced",
    "officialPage": "https://runawayracing.com/races/chiltern-ridge-ultra-winter-50k/",
    "metadata": {
      "verifiedAt": "2026-10-13T10:55:00Z",
      "source": "https://runawayracing.com/races/chiltern-ridge-ultra-winter-50k/",
      "dateEvidence": "Official event homepage or race page explicitly displays this edition and date range.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": "https://runawayracing.com/resources/races/chiltern-ridge-winter/Chiltern-Ridge-Winter-V4.gpx",
    "gpxAvailability": "verified_public",
    "importability": "download_only",
    "importabilityReason": "官方 GPX 可下載，未提供跨站 CORS。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Only minimal factual event metadata retained; no GPX redistribution permission implied."
    },
    "cors": {
      "status": "verified_no_cors",
      "evidence": "HTTP200, 192409 bytes, no ACAO header."
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "hardrock-2026",
    "name": "Hardrock Hundred Mile Endurance Run",
    "country": "美國",
    "region": "North America",
    "year": 2026,
    "edition": 2026,
    "date": "2026-07-10 / 2026-07-12",
    "dateStart": "2026-07-10",
    "dateEnd": "2026-07-12",
    "status": "past",
    "officialPage": "https://www.hardrock100.com/hardrock-course.php",
    "metadata": {
      "verifiedAt": "2026-10-13T10:55:00Z",
      "source": "https://www.hardrock100.com/files/bod/HR100-2026-Board-Elections.pdf",
      "dateEvidence": "Official 2026 board document gives July 10–12 event dates; official course page labels GPX Clockwise 2026, updated July 5.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": "https://www.hardrock100.com/files/course/HR100-Course-Clockwise.gpx",
    "gpxAvailability": "verified_public",
    "importability": "download_only",
    "importabilityReason": "2026 順時針官方 GPX 可下載，未提供跨站 CORS。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Only minimal factual event metadata retained; no GPX redistribution permission implied."
    },
    "cors": {
      "status": "verified_no_cors",
      "evidence": "HTTP200, 214277 bytes, no ACAO header."
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "kodiak-2026",
    "name": "HOKA Kodiak Ultra Marathons",
    "country": "美國",
    "region": "North America",
    "year": 2026,
    "edition": 2026,
    "date": "2026-10-08 / 2026-10-11",
    "dateStart": "2026-10-08",
    "dateEnd": "2026-10-11",
    "status": "past",
    "officialPage": "https://kodiak.utmb.world/",
    "metadata": {
      "verifiedAt": "2026-10-13T10:55:00Z",
      "source": "https://kodiak.utmb.world/",
      "dateEvidence": "Official event date range on homepage; specific GPX source https://kodiak.utmb.world/races/10K",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": "https://pdf.utmb.world/raw/upload/v1791089368/kodiak/GPX%20FILES/2026/2026_Kodiak_10_K_Official_Final_Course_Map_a5ef94a74a.gpx",
    "gpxAvailability": "official_download_link_verified",
    "importability": "download_only",
    "importabilityReason": "官方已公開 GPX 連結；此環境無法完成檔案／CORS 驗證，僅提供官方下載。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Only minimal factual event metadata retained; no GPX redistribution permission implied."
    },
    "cors": {
      "status": "verification_blocked",
      "evidence": "Execution network returned blocked-by-allowlist; no bypass attempted."
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "kosci-2026",
    "name": "Ultra-Trail Kosciuszko by UTMB",
    "country": "澳洲",
    "region": "Oceania",
    "year": 2026,
    "edition": 2026,
    "date": "2026-11-26 / 2026-11-28",
    "dateStart": "2026-11-26",
    "dateEnd": "2026-11-28",
    "status": "announced",
    "officialPage": "https://kosciuszko.utmb.world/",
    "metadata": {
      "verifiedAt": "2026-10-13T10:55:00Z",
      "source": "https://kosciuszko.utmb.world/",
      "dateEvidence": "Official event date range on homepage; specific GPX source https://kosciuszko.utmb.world/races/kosci-100",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": "https://pdf.utmb.world/raw/upload/v1790565020/kosciuszko/Races/2026%20Race%20Alignment%20GPX/2026_UTK_by_UTMB_100km_28092026v5_5287ddf0e7.gpx",
    "gpxAvailability": "official_download_link_verified",
    "importability": "download_only",
    "importabilityReason": "官方已公開 GPX 連結；此環境無法完成檔案／CORS 驗證，僅提供官方下載。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Only minimal factual event metadata retained; no GPX redistribution permission implied."
    },
    "cors": {
      "status": "verification_blocked",
      "evidence": "Execution network returned blocked-by-allowlist; no bypass attempted."
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "bariloche-2026",
    "name": "Patagonia Bariloche by UTMB",
    "country": "阿根廷",
    "region": "South America",
    "year": 2026,
    "edition": 2026,
    "date": "2026-11-18 / 2026-11-22",
    "dateStart": "2026-11-18",
    "dateEnd": "2026-11-22",
    "status": "announced",
    "officialPage": "https://bariloche.utmb.world/",
    "metadata": {
      "verifiedAt": "2026-10-13T10:55:00Z",
      "source": "https://bariloche.utmb.world/",
      "dateEvidence": "Official event homepage or race page explicitly displays this edition and date range.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "本屆官方 GPX 尚未核實；可先查看官方賽事資訊。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Only minimal factual event metadata retained; no GPX redistribution permission implied."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "jujuy-2027",
    "name": "Jujuy Fuerza Sagrada by UTMB",
    "country": "阿根廷",
    "region": "South America",
    "year": 2027,
    "edition": 2027,
    "date": "2027-03-31 / 2027-04-04",
    "dateStart": "2027-03-31",
    "dateEnd": "2027-04-04",
    "status": "announced",
    "officialPage": "https://jujuy.utmb.world/",
    "metadata": {
      "verifiedAt": "2026-10-13T10:55:00Z",
      "source": "https://jujuy.utmb.world/",
      "dateEvidence": "Official event homepage or race page explicitly displays this edition and date range.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "本屆官方 GPX 尚未核實；可先查看官方賽事資訊。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Only minimal factual event metadata retained; no GPX redistribution permission implied."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "mut-2027",
    "name": "Mountain Ultra Trail by UTMB",
    "country": "南非",
    "region": "Africa",
    "year": 2027,
    "edition": 2027,
    "date": "2027-05-27 / 2027-05-30",
    "dateStart": "2027-05-27",
    "dateEnd": "2027-05-30",
    "status": "announced",
    "officialPage": "https://mut.utmb.world/",
    "metadata": {
      "verifiedAt": "2026-10-13T10:55:00Z",
      "source": "https://mut.utmb.world/",
      "dateEvidence": "Official event homepage or race page explicitly displays this edition and date range.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": "https://pdf.utmb.world/raw/upload/v1777636844/mut/GPX%20files/2026%20GPX/100_KM_2026_ffa7c0daa2.gpx",
    "gpxAvailability": "official_previous_edition_reference",
    "importability": "download_only",
    "importabilityReason": "2027 官頁目前連到標示 2026 的 GPX；僅供前屆參考，不代表 2027 定稿路線。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Only minimal factual event metadata retained; no GPX redistribution permission implied."
    },
    "cors": {
      "status": "not_tested",
      "evidence": "URL verified from visible official GPX export; no raw download or cross-origin test for this candidate."
    },
    "routes": [],
    "routeYear": 2026,
    "routeEditionMatchesEvent": false,
    "gpxSourcePage": "https://mut.utmb.world/races/mut100",
    "routeVersionEvidence": "Public GPX export link on the 2027 page explicitly contains 2026 in filename/path; do not relabel as 2027.",
    "routeIds": []
  },
  {
    "id": "tarawera-2027",
    "name": "Tarawera Ultra-Trail by UTMB",
    "country": "紐西蘭",
    "region": "Oceania",
    "year": 2027,
    "edition": 2027,
    "date": "2027-02-13 / 2027-02-14",
    "dateStart": "2027-02-13",
    "dateEnd": "2027-02-14",
    "status": "announced",
    "officialPage": "https://tarawera.utmb.world/",
    "metadata": {
      "verifiedAt": "2026-10-13T10:55:00Z",
      "source": "https://tarawera.utmb.world/",
      "dateEvidence": "Official event homepage or race page explicitly displays this edition and date range.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": "https://pdf.utmb.world/raw/upload/v1769551549/tarawera/Races/2026_Tarawera_Ultra_Trail_102km_V6_5835fdbbe0.gpx",
    "gpxAvailability": "official_previous_edition_reference",
    "importability": "download_only",
    "importabilityReason": "2027 官頁目前連到標示 2026 的 GPX；僅供前屆參考，不代表 2027 定稿路線。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Only minimal factual event metadata retained; no GPX redistribution permission implied."
    },
    "cors": {
      "status": "not_tested",
      "evidence": "URL verified from visible official GPX export; no raw download or cross-origin test for this candidate."
    },
    "routes": [],
    "routeYear": 2026,
    "routeEditionMatchesEvent": false,
    "gpxSourcePage": "https://tarawera.utmb.world/races/t-102",
    "routeVersionEvidence": "Public GPX export link on the 2027 page explicitly contains 2026 in filename/path; do not relabel as 2027.",
    "routeIds": []
  },
  {
    "id": "arcofattrition-2027",
    "name": "Arc of Attrition by UTMB",
    "country": "英國",
    "region": "Europe",
    "year": 2027,
    "edition": 2027,
    "date": "2027-01-22 / 2027-01-24",
    "dateStart": "2027-01-22",
    "dateEnd": "2027-01-24",
    "status": "announced",
    "officialPage": "https://arcofattrition.utmb.world/",
    "metadata": {
      "verifiedAt": "2026-10-13T10:55:00Z",
      "source": "https://arcofattrition.utmb.world/",
      "dateEvidence": "Official event homepage or race page explicitly displays this edition and date range.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "本屆官方 GPX 尚未核實；可先查看官方賽事資訊。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Only minimal factual event metadata retained; no GPX redistribution permission implied."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "canyons-2027",
    "name": "The Canyons Endurance Runs by UTMB",
    "country": "美國",
    "region": "North America",
    "year": 2027,
    "edition": 2027,
    "date": "2027-04-22 / 2027-04-25",
    "dateStart": "2027-04-22",
    "dateEnd": "2027-04-25",
    "status": "announced",
    "officialPage": "https://canyons.utmb.world/",
    "metadata": {
      "verifiedAt": "2026-10-13T10:55:00Z",
      "source": "https://canyons.utmb.world/",
      "dateEvidence": "Official event homepage or race page explicitly displays this edition and date range.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "本屆官方 GPX 尚未核實；可先查看官方賽事資訊。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Only minimal factual event metadata retained; no GPX redistribution permission implied."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "vietnamhighlands-2027",
    "name": "Vietnam Highlands Trail by UTMB",
    "country": "越南",
    "region": "Asia",
    "year": 2027,
    "edition": 2027,
    "date": "2027-01-08 / 2027-01-10",
    "dateStart": "2027-01-08",
    "dateEnd": "2027-01-10",
    "status": "announced",
    "officialPage": "https://vietnamhighlands.utmb.world/",
    "metadata": {
      "verifiedAt": "2026-10-13T10:55:00Z",
      "source": "https://vietnamhighlands.utmb.world/",
      "dateEvidence": "Official event homepage or race page explicitly displays this edition and date range.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "本屆官方 GPX 尚未核實；可先查看官方賽事資訊。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Only minimal factual event metadata retained; no GPX redistribution permission implied."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "montblanc-2026",
    "name": "HOKA UTMB Mont-Blanc",
    "country": "法國／義大利／瑞士",
    "region": "Europe",
    "year": 2026,
    "edition": 2026,
    "date": "2026-08-24 / 2026-08-30",
    "dateStart": "2026-08-24",
    "dateEnd": "2026-08-30",
    "status": "past",
    "officialPage": "https://montblanc.utmb.world/",
    "metadata": {
      "verifiedAt": "2026-10-13T10:55:00Z",
      "source": "https://montblanc.utmb.world/",
      "dateEvidence": "Official event homepage or race page explicitly displays this edition and date range.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "本屆官方 GPX 尚未核實；可先查看官方賽事資訊。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Only minimal factual event metadata retained; no GPX redistribution permission implied."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "lavaredo-2027",
    "name": "La Sportiva Lavaredo Ultra Trail by UTMB",
    "country": "義大利",
    "region": "Europe",
    "year": 2027,
    "edition": 2027,
    "date": "2027-06-23 / 2027-06-27",
    "dateStart": "2027-06-23",
    "dateEnd": "2027-06-27",
    "status": "announced",
    "officialPage": "https://lavaredo.utmb.world/",
    "metadata": {
      "verifiedAt": "2026-10-13T10:55:00Z",
      "source": "https://lavaredo.utmb.world/",
      "dateEvidence": "Official event homepage or race page explicitly displays this edition and date range.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "本屆官方 GPX 尚未核實；可先查看官方賽事資訊。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Only minimal factual event metadata retained; no GPX redistribution permission implied."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "puerto-vallarta-2027",
    "name": "Puerto Vallarta by UTMB",
    "country": "墨西哥",
    "region": "North America",
    "year": 2027,
    "edition": 2027,
    "date": "2027-03-04 / 2027-03-06",
    "dateStart": "2027-03-04",
    "dateEnd": "2027-03-06",
    "status": "announced",
    "officialPage": "https://puerto-vallarta.utmb.world/",
    "metadata": {
      "verifiedAt": "2026-10-13T10:55:00Z",
      "source": "https://puerto-vallarta.utmb.world/",
      "dateEvidence": "Official event homepage or race page explicitly displays this edition and date range.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "本屆官方 GPX 尚未核實；可先查看官方賽事資訊。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Only minimal factual event metadata retained; no GPX redistribution permission implied."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "transjeju-2026",
    "name": "TransJeju by UTMB",
    "country": "韓國",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-10-02 / 2026-10-04",
    "dateStart": "2026-10-02",
    "dateEnd": "2026-10-04",
    "status": "past",
    "officialPage": "https://transjeju.utmb.world/",
    "metadata": {
      "verifiedAt": "2026-10-13T10:55:00Z",
      "source": "https://transjeju.utmb.world/",
      "dateEvidence": "Official event homepage or race page explicitly displays this edition and date range.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "本屆官方 GPX 尚未核實；可先查看官方賽事資訊。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Only minimal factual event metadata retained; no GPX redistribution permission implied."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "chiangmai-2026",
    "name": "Chiangmai Thailand by UTMB",
    "country": "泰國",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-11-27 / 2026-12-06",
    "dateStart": "2026-11-27",
    "dateEnd": "2026-12-06",
    "status": "announced",
    "officialPage": "https://chiangmai.utmb.world/",
    "metadata": {
      "verifiedAt": "2026-10-13T10:55:00Z",
      "source": "https://chiangmai.utmb.world/",
      "dateEvidence": "Official event homepage or race page explicitly displays this edition and date range.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "本屆官方 GPX 尚未核實；可先查看官方賽事資訊。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Only minimal factual event metadata retained; no GPX redistribution permission implied."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "western-states-2025",
    "name": "Western States 100-Mile Endurance Run",
    "country": "美國",
    "region": "North America",
    "year": 2025,
    "edition": 2025,
    "editionLabel": "52nd edition",
    "date": "2025-06-28 / 2025-06-29",
    "dateStart": "2025-06-28",
    "dateEnd": "2025-06-29",
    "status": "past",
    "officialPage": "https://www.wser.org/results/2025-results/",
    "metadata": {
      "verifiedAt": "2026-10-13T10:57:00Z",
      "source": "https://www.wser.org/2025/06/25/2025-ws-100-media-release/",
      "dateEvidence": "Organizer's 2025 media release identifies the 52nd race, starting 28 June 2025 at 05:00 and continuing through 29 June at 11:00. The separate 2025 results page confirms the edition took place.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "歷史屆別與日期已由官方來源核實；尚未核實該屆 GPX。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Minimal factual event metadata and official source links only; no GPX reuse or redistribution claim."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "montblanc-2025",
    "name": "HOKA UTMB Mont-Blanc",
    "country": "法國／義大利／瑞士",
    "region": "Europe",
    "year": 2025,
    "edition": 2025,
    "editionLabel": "22nd edition",
    "date": "2025-08-25 / 2025-08-31",
    "dateStart": "2025-08-25",
    "dateEnd": "2025-08-31",
    "status": "past",
    "officialPage": "https://res.cloudinary.com/utmb-world/image/upload/v1756230438/worldseries/press/Press%20releases/EN/mb-2025-08-22-en_lz609n.pdf",
    "metadata": {
      "verifiedAt": "2026-10-13T10:57:00Z",
      "source": "https://res.cloudinary.com/utmb-world/image/upload/v1756230438/worldseries/press/Press%20releases/EN/mb-2025-08-22-en_lz609n.pdf",
      "dateEvidence": "Official press release dated 22 August 2025 states the 22nd edition runs 25–31 August. The official press archive also contains closing reports dated 30 and 31 August 2025. Dates represent the full event week, not only the UTMB-distance race.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "歷史屆別與日期已由官方來源核實；尚未核實該屆 GPX。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Minimal factual event metadata and official source links only; no GPX reuse or redistribution claim."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "mtfuji100-2025",
    "name": "Mt.FUJI 100",
    "country": "日本",
    "region": "Asia",
    "year": 2025,
    "edition": 2025,
    "editionLabel": "13th edition",
    "date": "2025-04-25 / 2025-04-27",
    "dateStart": "2025-04-25",
    "dateEnd": "2025-04-27",
    "status": "past",
    "officialPage": "https://en.mtfuji100.com/about/results/result2025/",
    "metadata": {
      "verifiedAt": "2026-10-13T10:57:00Z",
      "source": "https://mtfuji100.com/wp-content/themes/utmf/pdf/2025Mt.FUJI100_information_EN_05.pdf",
      "dateEvidence": "Page 1 of the organizer's 2025 racer information identifies the 13th edition and explicitly lists 25–27 April 2025. The edition-specific official results page contains finishers for FUJI100mi, KAI70k and ASUMI40k.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "歷史屆別與日期已由官方來源核實；尚未核實該屆 GPX。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Minimal factual event metadata and official source links only; no GPX reuse or redistribution claim."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "tarawera-2025",
    "name": "Tarawera Ultra-Trail by UTMB",
    "country": "紐西蘭",
    "region": "Oceania",
    "year": 2025,
    "edition": 2025,
    "editionLabel": "2025 edition",
    "date": "2025-02-15 / 2025-02-16",
    "dateStart": "2025-02-15",
    "dateEnd": "2025-02-16",
    "status": "past",
    "officialPage": "https://utmb.world/utmb-index/races/11949.taraweraultra-trailbyutmb-tmiler.2025",
    "metadata": {
      "verifiedAt": "2026-10-13T10:57:00Z",
      "source": "https://res.cloudinary.com/utmb-world/image/upload/v1752746408/kat/2025/Runner%20guide/RUNNER_GUIDE_BY_UTMB_2025_version_17_07_2025_klein_a6b0994682.pdf.pdf",
      "dateEvidence": "The UTMB World Series 2025 calendar on PDF page 6 (printed pages 7–8) lists Tarawera on 15–16 February in New Zealand. The organizer's 2025 TMiler result archive independently gives the 15 February start and completed results.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "歷史屆別與日期已由官方來源核實；尚未核實該屆 GPX。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Minimal factual event metadata and official source links only; no GPX reuse or redistribution claim."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "mut-2025",
    "name": "Mountain Ultra Trail by UTMB",
    "country": "南非",
    "region": "Africa",
    "year": 2025,
    "edition": 2025,
    "editionLabel": "2025 edition",
    "date": "2025-05-22 / 2025-05-25",
    "dateStart": "2025-05-22",
    "dateEnd": "2025-05-25",
    "status": "past",
    "officialPage": "https://live.utmb.world/mountainultratrail/2025",
    "metadata": {
      "verifiedAt": "2026-10-13T10:57:00Z",
      "source": "https://res.cloudinary.com/utmb-world/image/upload/v1752746408/kat/2025/Runner%20guide/RUNNER_GUIDE_BY_UTMB_2025_version_17_07_2025_klein_a6b0994682.pdf.pdf",
      "dateEvidence": "The UTMB World Series 2025 calendar on PDF page 6 (printed pages 7–8) lists Mountain Ultra Trail on 22–25 May in South Africa. These are full-event dates; the official 2025 Miler result archive gives its race start as 23 May, and the 2025 live archive marks races finished.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "歷史屆別與日期已由官方來源核實；尚未核實該屆 GPX。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Minimal factual event metadata and official source links only; no GPX reuse or redistribution claim."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "bariloche-2025",
    "name": "Patagonia Bariloche by UTMB",
    "country": "阿根廷",
    "region": "South America",
    "year": 2025,
    "edition": 2025,
    "editionLabel": "1st edition",
    "date": "2025-11-18 / 2025-11-22",
    "dateStart": "2025-11-18",
    "dateEnd": "2025-11-22",
    "status": "past",
    "officialPage": "https://utmb.world/utmb-index/races/52670.barilochepatagoniabyutmbtronador130k.2025",
    "metadata": {
      "verifiedAt": "2026-10-13T10:57:00Z",
      "source": "https://utmb.world/news/events-november-2025",
      "dateEvidence": "The organizer's November 2025 preview explicitly gives 18–22 November 2025 for the inaugural event in San Carlos de Bariloche, Argentina. These are full-event dates; the edition-specific TRONADOR result archive gives 20 November as that race's start and includes completed results.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "歷史屆別與日期已由官方來源核實；尚未核實該屆 GPX。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Minimal factual event metadata and official source links only; no GPX reuse or redistribution claim."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "mount-yun-2026",
    "name": "Ultra-Trail Mount Yun by UTMB®",
    "country": "中國",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-10-16 / 2026-10-18",
    "dateStart": "2026-10-16",
    "dateEnd": "2026-10-18",
    "status": "announced",
    "officialPage": "https://mount-yun.utmb.world/",
    "distanceLabels": [
      "UMY 100M (166 km)",
      "DMY 100K (97 km)",
      "MMY 50K (48 km)",
      "EMY 20K (22 km)"
    ],
    "metadata": {
      "verifiedAt": "2026-10-13T11:36:00Z",
      "source": "https://mount-yun.utmb.world/",
      "dateEvidence": "Official homepage header 16 - 18 October 2026; visible race cards provide the distance/category labels. Exact distance may differ from category name.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "官方賽事資料已核實；本屆 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Public source facts and links only; no GPX reuse or redistribution permission claimed."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "distanceSources": [
      {
        "name": "UMY 100M",
        "distanceKm": 166,
        "officialPage": "https://mount-yun.utmb.world/races/100M",
        "dateLabel": "16th October 2026"
      },
      {
        "name": "DMY 100K",
        "distanceKm": 97,
        "officialPage": "https://mount-yun.utmb.world/races/100K",
        "dateLabel": "16th October 2026"
      },
      {
        "name": "MMY 50K",
        "distanceKm": 48,
        "officialPage": "https://mount-yun.utmb.world/races/50K",
        "dateLabel": "17th October 2026"
      },
      {
        "name": "EMY 20K",
        "distanceKm": 22,
        "officialPage": "https://mount-yun.utmb.world/races/20K",
        "dateLabel": "18th October 2026"
      }
    ],
    "location": "Mount Yun"
  },
  {
    "id": "shudao-2026",
    "name": "Ultra-Trail Shudao by UTMB®",
    "country": "中國",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-11-06 / 2026-11-08",
    "dateStart": "2026-11-06",
    "dateEnd": "2026-11-08",
    "status": "announced",
    "officialPage": "https://shudao.utmb.world/",
    "distanceLabels": [
      "DSD 100K (104 km)",
      "CSD 70K (70.5 km)",
      "MSD 50K (42 km)",
      "ESD 20K (21.5 km)"
    ],
    "metadata": {
      "verifiedAt": "2026-10-13T11:36:00Z",
      "source": "https://shudao.utmb.world/",
      "dateEvidence": "Official homepage header 06 - 08 November 2026; visible race cards provide the distance/category labels. Exact distance may differ from category name.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "官方賽事資料已核實；本屆 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Public source facts and links only; no GPX reuse or redistribution permission claimed."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "distanceSources": [
      {
        "name": "DSD 100K",
        "distanceKm": 104,
        "officialPage": "https://shudao.utmb.world/races/100K",
        "dateLabel": "6th November 2026"
      },
      {
        "name": "CSD 70K",
        "distanceKm": 70.5,
        "officialPage": "https://shudao.utmb.world/races/70K",
        "dateLabel": "7th November 2026"
      },
      {
        "name": "MSD 50K",
        "distanceKm": 42,
        "officialPage": "https://shudao.utmb.world/races/50K",
        "dateLabel": "7th November 2026"
      },
      {
        "name": "ESD 20K",
        "distanceKm": 21.5,
        "officialPage": "https://shudao.utmb.world/races/20K",
        "dateLabel": "8th November 2026"
      }
    ],
    "location": "Guangyuan"
  },
  {
    "id": "oman-2026",
    "name": "Oman by UTMB®",
    "country": "阿曼",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-12-10 / 2026-12-12",
    "dateStart": "2026-12-10",
    "dateEnd": "2026-12-12",
    "status": "announced",
    "officialPage": "https://oman.utmb.world/",
    "distanceLabels": [
      "HAJAR ULTRA (154 km)",
      "JABAL CLASSIC (103 km)",
      "SKYWARD CANYON (50 km)",
      "OLD CAPITAL TRAIL (32 km)",
      "SCENIC ASCENT (21.5 km)"
    ],
    "metadata": {
      "verifiedAt": "2026-10-13T11:36:00Z",
      "source": "https://oman.utmb.world/",
      "dateEvidence": "Official homepage header 10 - 12 December 2026; visible race cards provide the distance/category labels. Exact distance may differ from category name.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "官方賽事資料已核實；本屆 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Public source facts and links only; no GPX reuse or redistribution permission claimed."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "distanceSources": [
      {
        "name": "HAJAR ULTRA",
        "distanceKm": 154,
        "officialPage": "https://oman.utmb.world/races/HAJ",
        "dateLabel": "10th December 2026"
      },
      {
        "name": "JABAL CLASSIC",
        "distanceKm": 103,
        "officialPage": "https://oman.utmb.world/races/JAC",
        "dateLabel": "10th December 2026"
      },
      {
        "name": "SKYWARD CANYON",
        "distanceKm": 50,
        "officialPage": "https://oman.utmb.world/races/SKY",
        "dateLabel": "11th December 2026"
      },
      {
        "name": "OLD CAPITAL TRAIL",
        "distanceKm": 32,
        "officialPage": "https://oman.utmb.world/races/OCT",
        "dateLabel": "12th December 2026"
      },
      {
        "name": "SCENIC ASCENT",
        "distanceKm": 21.5,
        "officialPage": "https://oman.utmb.world/races/SAS",
        "dateLabel": "12th December 2026"
      }
    ],
    "location": "Oman"
  },
  {
    "id": "xtrail-2027",
    "name": "Xtrail by UTMB®",
    "country": "台灣",
    "region": "Asia",
    "year": 2027,
    "edition": 2027,
    "date": "2027-03-05 / 2027-03-07",
    "dateStart": "2027-03-05",
    "dateEnd": "2027-03-07",
    "status": "announced",
    "officialPage": "https://xtrail.utmb.world/",
    "distanceLabels": [
      "Xtrail 100K (98 km)",
      "Xtrail 50K (50 km)",
      "Xtrail 25K (26 km)",
      "Xtrail 10K (11 km)",
      "Xtrail Kids Family Run (2 km)"
    ],
    "metadata": {
      "verifiedAt": "2026-10-13T11:36:00Z",
      "source": "https://xtrail.utmb.world/",
      "dateEvidence": "Official homepage header 05 - 07 March 2027; visible race cards provide the distance/category labels. Exact distance may differ from category name.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "verified_public",
    "importability": "direct_verified",
    "importabilityReason": "五組官方 GPX 可直接導入；部分關門資料需向主辦確認。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Public source facts and links only; no GPX reuse or redistribution permission claimed."
    },
    "cors": {
      "status": "verified_allowed",
      "evidence": "Official GPX GET200 and Access-Control-Allow-Origin:*; exact bytes/hash verified."
    },
    "routes": [
      {
        "routeId": "xtrail-2027-top-100k",
        "name": "Xtrail 100K",
        "gpxDownloadUrl": "https://pdf.utmb.world/raw/upload/v1779934971/xtrail/2027%20%E5%BB%BA%E7%BD%AE/GPX/%E7%B8%BD%E9%83%A8%E6%8F%90%E4%BE%9B/Kenting_98k_3300_2605_2ebd00856a.gpx",
        "sha256": "6d045d90b008f28e5bac7741020a322fa28800d1df874552d1e9119ca551d946"
      },
      {
        "routeId": "xtrail-2027-top-50k",
        "name": "Xtrail 50K",
        "gpxDownloadUrl": "https://pdf.utmb.world/raw/upload/v1779934969/xtrail/2027%20%E5%BB%BA%E7%BD%AE/GPX/%E7%B8%BD%E9%83%A8%E6%8F%90%E4%BE%9B/Kenting_51k_1500_2605_d3096953a5.gpx",
        "sha256": "1f0c9f431d25553f1ce5e04aecaf68fcd8a7029812d37b4139e0aae17fe4a6e2"
      },
      {
        "routeId": "xtrail-2027-top-25k",
        "name": "Xtrail 25K",
        "gpxDownloadUrl": "https://pdf.utmb.world/raw/upload/v1779934966/xtrail/2027%20%E5%BB%BA%E7%BD%AE/GPX/%E7%B8%BD%E9%83%A8%E6%8F%90%E4%BE%9B/Kenting_26k_600_2605_4a7645b980.gpx",
        "sha256": "cc9475f372e0324d8fb4aecf3b54f44e0f8af9b26e4d87682611281a98d0ef20"
      },
      {
        "routeId": "xtrail-2027-top-10k",
        "name": "Xtrail 10K",
        "gpxDownloadUrl": "https://pdf.utmb.world/raw/upload/v1779934965/xtrail/2027%20%E5%BB%BA%E7%BD%AE/GPX/%E7%B8%BD%E9%83%A8%E6%8F%90%E4%BE%9B/Kenting_11k_300_2605_0553286663.gpx",
        "sha256": "a29ffcaf50edebd1e849b58494d3de601a6d63c9cef043014fb98aa63e23e271"
      },
      {
        "routeId": "xtrail-2027-top-2k",
        "name": "Xtrail 2K",
        "gpxDownloadUrl": "https://pdf.utmb.world/raw/upload/v1782460067/xtrail/2027%20%E5%BB%BA%E7%BD%AE/GPX/Xtrail_2_K_2_Kids_ba5ed259dd.gpx",
        "sha256": "966434f5922832796adeaaf646361863fe7d6b4f19952ae6c0f183552a2839e7"
      }
    ],
    "routeIds": [
      "xtrail-2027-top-100k",
      "xtrail-2027-top-50k",
      "xtrail-2027-top-25k",
      "xtrail-2027-top-10k",
      "xtrail-2027-top-2k"
    ],
    "distanceSources": [
      {
        "name": "Xtrail 100K",
        "distanceKm": 98,
        "officialPage": "https://xtrail.utmb.world/races/Top-100K",
        "dateLabel": "6th March 2027"
      },
      {
        "name": "Xtrail 50K",
        "distanceKm": 50,
        "officialPage": "https://xtrail.utmb.world/races/Top-50K",
        "dateLabel": "6th March 2027"
      },
      {
        "name": "Xtrail 25K",
        "distanceKm": 26,
        "officialPage": "https://xtrail.utmb.world/races/Top-25K",
        "dateLabel": "7th March 2027"
      },
      {
        "name": "Xtrail 10K",
        "distanceKm": 11,
        "officialPage": "https://xtrail.utmb.world/races/Top-10K",
        "dateLabel": "7th March 2027"
      },
      {
        "name": "Xtrail Kids Family Run",
        "distanceKm": 2,
        "officialPage": "https://xtrail.utmb.world/races/Top-2K",
        "dateLabel": "7th March 2027"
      }
    ],
    "location": "Kenting"
  },
  {
    "id": "hiroshima-2027",
    "name": "Hiroshima Ultra-Trail by UTMB®",
    "country": "日本",
    "region": "Asia",
    "year": 2027,
    "edition": 2027,
    "date": "2027-04-09 / 2027-04-11",
    "dateStart": "2027-04-09",
    "dateEnd": "2027-04-11",
    "status": "announced",
    "officialPage": "https://hiroshima.utmb.world/",
    "distanceLabels": [
      "HIROSHIMA 100K",
      "HIROSHIMA 50K",
      "HIROSHIMA 25K"
    ],
    "metadata": {
      "verifiedAt": "2026-10-13T11:36:00Z",
      "source": "https://hiroshima.utmb.world/",
      "dateEvidence": "Official homepage header 09 - 11 April 2027; visible race cards provide the distance/category labels. Exact distance may differ from category name.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "官方賽事資料已核實；本屆 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Public source facts and links only; no GPX reuse or redistribution permission claimed."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "distanceSources": [
      {
        "name": "HIROSHIMA 100K",
        "distanceKm": null,
        "officialPage": "https://hiroshima.utmb.world/races/HIROSHIMA100K",
        "dateLabel": "10th April 2027"
      },
      {
        "name": "HIROSHIMA 50K",
        "distanceKm": null,
        "officialPage": "https://hiroshima.utmb.world/races/HIROSHIMA50K",
        "dateLabel": "10th April 2027"
      },
      {
        "name": "HIROSHIMA 25K",
        "distanceKm": null,
        "officialPage": "https://hiroshima.utmb.world/races/HIROSHIMA25K",
        "dateLabel": "11th April 2027"
      }
    ],
    "location": "Hiroshima"
  },
  {
    "id": "amazean-2027",
    "name": "Amazean Jungle Thailand by UTMB",
    "country": "泰國",
    "region": "Asia",
    "year": 2027,
    "edition": 2027,
    "date": "2027-04-29 / 2027-05-02",
    "dateStart": "2027-04-29",
    "dateEnd": "2027-05-02",
    "status": "announced",
    "officialPage": "https://amazean.utmb.world/",
    "distanceLabels": [
      "BETONG 100M (115 km)",
      "TUNNEL 100K (91 km)",
      "JUNGLE 50K (56 km)",
      "MIST 20K (26 km)",
      "FLOWER 20K (17 km)",
      "SAT NIGHT RUN (4 km)"
    ],
    "metadata": {
      "verifiedAt": "2026-10-13T11:36:00Z",
      "source": "https://amazean.utmb.world/",
      "dateEvidence": "Official homepage header 29 April - 02 May 2027; visible race cards provide the distance/category labels. Exact distance may differ from category name.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "官方賽事資料已核實；本屆 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Public source facts and links only; no GPX reuse or redistribution permission claimed."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "distanceSources": [
      {
        "name": "BETONG 100M",
        "distanceKm": 115,
        "officialPage": "https://amazean.utmb.world/races/Betong100M",
        "dateLabel": "30th April 2027"
      },
      {
        "name": "TUNNEL 100K",
        "distanceKm": 91,
        "officialPage": "https://amazean.utmb.world/races/TUNNEL100K",
        "dateLabel": "1st May 2027"
      },
      {
        "name": "JUNGLE 50K",
        "distanceKm": 56,
        "officialPage": "https://amazean.utmb.world/races/JUNGLE50K",
        "dateLabel": "1st May 2027"
      },
      {
        "name": "MIST 20K",
        "distanceKm": 26,
        "officialPage": "https://amazean.utmb.world/races/MIST20K",
        "dateLabel": "2nd May 2027"
      },
      {
        "name": "FLOWER 20K",
        "distanceKm": 17,
        "officialPage": "https://amazean.utmb.world/races/FLOWER20K",
        "dateLabel": "2nd May 2027"
      },
      {
        "name": "SAT NIGHT RUN",
        "distanceKm": 4,
        "officialPage": "https://amazean.utmb.world/races/SAT",
        "dateLabel": "1st May 2027"
      }
    ],
    "location": "Betong",
    "cautions": [
      "Official BETONG 100M category currently lists 115 km on the 2027 race page; category name must not be converted to 160.9 km. See https://amazean.utmb.world/races/Betong100M"
    ]
  },
  {
    "id": "laketoba-2027",
    "name": "Trail of the Kings - Lake Toba by UTMB",
    "country": "印尼",
    "region": "Asia",
    "year": 2027,
    "edition": 2027,
    "date": "2027-06-11 / 2027-06-13",
    "dateStart": "2027-06-11",
    "dateEnd": "2027-06-13",
    "status": "announced",
    "officialPage": "https://laketoba.utmb.world/",
    "distanceLabels": [
      "Caldera Crown 100K",
      "Ultimate Expedition 60K",
      "King's Ascent 28K",
      "Legacy Dash 17K",
      "Kids"
    ],
    "metadata": {
      "verifiedAt": "2026-10-13T11:36:00Z",
      "source": "https://laketoba.utmb.world/",
      "dateEvidence": "Official homepage header 11 - 13 June 2027; visible race cards provide the distance/category labels. Exact distance may differ from category name.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "官方賽事資料已核實；本屆 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Public source facts and links only; no GPX reuse or redistribution permission claimed."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "distanceSources": [
      {
        "name": "Caldera Crown 100K",
        "distanceKm": null,
        "officialPage": "https://laketoba.utmb.world/races/calderacrown100K",
        "dateLabel": "12th June 2027"
      },
      {
        "name": "Ultimate Expedition 60K",
        "distanceKm": null,
        "officialPage": "https://laketoba.utmb.world/races/ultimateexpedition60K",
        "dateLabel": "12th June 2027"
      },
      {
        "name": "King's Ascent 28K",
        "distanceKm": null,
        "officialPage": "https://laketoba.utmb.world/races/kingsascent28k",
        "dateLabel": "12th June 2027"
      },
      {
        "name": "Legacy Dash 17K",
        "distanceKm": null,
        "officialPage": "https://laketoba.utmb.world/races/legacydash17k",
        "dateLabel": "13th June 2027"
      },
      {
        "name": "Kids",
        "distanceKm": null,
        "officialPage": "https://laketoba.utmb.world/races/kids",
        "dateLabel": "13th June 2027"
      }
    ],
    "location": "Samosir, Lake Toba"
  },
  {
    "id": "kagaspa-2027",
    "name": "Kagaspa Trail Endurance 100 by UTMB",
    "country": "日本",
    "region": "Asia",
    "year": 2027,
    "edition": 2027,
    "date": "2027-06-17 / 2027-06-20",
    "dateStart": "2027-06-17",
    "dateEnd": "2027-06-20",
    "status": "announced",
    "officialPage": "https://kagaspa.utmb.world/",
    "distanceLabels": [
      "2027 KAGASPA 100K",
      "2027 KAGASPA 50K",
      "2027 KAGASPA 20K"
    ],
    "metadata": {
      "verifiedAt": "2026-10-13T11:36:00Z",
      "source": "https://kagaspa.utmb.world/",
      "dateEvidence": "Official homepage header 17 - 20 June 2027; visible race cards provide the distance/category labels. Exact distance may differ from category name.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "官方賽事資料已核實；本屆 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Public source facts and links only; no GPX reuse or redistribution permission claimed."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "distanceSources": [
      {
        "name": "2027 KAGASPA 100K",
        "distanceKm": null,
        "officialPage": "https://kagaspa.utmb.world/races/kagaspa100",
        "dateLabel": "19th June 2027"
      },
      {
        "name": "2027 KAGASPA 50K",
        "distanceKm": null,
        "officialPage": "https://kagaspa.utmb.world/races/kagaspa50",
        "dateLabel": "20th June 2027"
      },
      {
        "name": "2027 KAGASPA 20K",
        "distanceKm": null,
        "officialPage": "https://kagaspa.utmb.world/races/kagaspa20",
        "dateLabel": "19th June 2027"
      }
    ],
    "location": "Yamanaka Onsen, Yamanaka-za"
  },
  {
    "id": "dajingmen-2026",
    "name": "JD Ultra-Trail Great Wall by UTMB®",
    "country": "中國",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-09-11 / 2026-09-13",
    "dateStart": "2026-09-11",
    "dateEnd": "2026-09-13",
    "status": "past",
    "officialPage": "https://dajingmen.utmb.world/",
    "distanceLabels": [
      "DGW100 (100 km)",
      "CGW70 (68 km)",
      "MGW50 (52 km)",
      "NGW30 (31 km)"
    ],
    "metadata": {
      "verifiedAt": "2026-10-13T11:36:00Z",
      "source": "https://dajingmen.utmb.world/",
      "dateEvidence": "Official homepage header 11 - 13 September 2026; visible race cards provide the distance/category labels. Exact distance may differ from category name.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "官方賽事資料已核實；本屆 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Public source facts and links only; no GPX reuse or redistribution permission claimed."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "distanceSources": [
      {
        "name": "DGW100",
        "distanceKm": 100,
        "officialPage": "https://dajingmen.utmb.world/races/DGW100",
        "dateLabel": "11th September 2026"
      },
      {
        "name": "CGW70",
        "distanceKm": 68,
        "officialPage": "https://dajingmen.utmb.world/races/CGW70",
        "dateLabel": "11th September 2026"
      },
      {
        "name": "MGW50",
        "distanceKm": 52,
        "officialPage": "https://dajingmen.utmb.world/races/MGW50",
        "dateLabel": "12th September 2026"
      },
      {
        "name": "NGW30",
        "distanceKm": 31,
        "officialPage": "https://dajingmen.utmb.world/races/NGW30",
        "dateLabel": "13th September 2026"
      }
    ],
    "location": "Dajingmen"
  },
  {
    "id": "mogan-2026",
    "name": "Ultra-Trail Mogan by UTMB®",
    "country": "中國",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-04-10 / 2026-04-12",
    "dateStart": "2026-04-10",
    "dateEnd": "2026-04-12",
    "status": "past",
    "officialPage": "https://mogan.utmb.world/",
    "distanceLabels": [
      "DMG (114 km)",
      "CMG (81 km)",
      "MMG (48 km)",
      "EMG (25 km)"
    ],
    "metadata": {
      "verifiedAt": "2026-10-13T11:36:00Z",
      "source": "https://mogan.utmb.world/",
      "dateEvidence": "Official homepage header 10 - 12 April 2026; visible race cards provide the distance/category labels. Exact distance may differ from category name.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "官方賽事資料已核實；本屆 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Public source facts and links only; no GPX reuse or redistribution permission claimed."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "distanceSources": [
      {
        "name": "DMG",
        "distanceKm": 114,
        "officialPage": "https://mogan.utmb.world/races/DMG",
        "dateLabel": "10th April 2026"
      },
      {
        "name": "CMG",
        "distanceKm": 81,
        "officialPage": "https://mogan.utmb.world/races/CMG",
        "dateLabel": "10th April 2026"
      },
      {
        "name": "MMG",
        "distanceKm": 48,
        "officialPage": "https://mogan.utmb.world/races/MMG",
        "dateLabel": "11th April 2026"
      },
      {
        "name": "EMG",
        "distanceKm": 25,
        "officialPage": "https://mogan.utmb.world/races/EMG",
        "dateLabel": "12th April 2026"
      }
    ],
    "location": "Deqing"
  },
  {
    "id": "xiamen-2026",
    "name": "2026 Warhorse Ultra-Trail Xiamen by UTMB®",
    "country": "中國",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-03-14 / 2026-03-15",
    "dateStart": "2026-03-14",
    "dateEnd": "2026-03-15",
    "status": "past",
    "officialPage": "https://xiamen.utmb.world/",
    "distanceLabels": [
      "LXM 100K (96.4 km)",
      "MXM 50K (53 km)",
      "SXM 20K (28.9 km)",
      "EXM 10K (10.3 km)"
    ],
    "metadata": {
      "verifiedAt": "2026-10-13T11:36:00Z",
      "source": "https://xiamen.utmb.world/",
      "dateEvidence": "Official homepage header 14 - 15 March 2026; visible race cards provide the distance/category labels. Exact distance may differ from category name.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "官方賽事資料已核實；本屆 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Public source facts and links only; no GPX reuse or redistribution permission claimed."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "distanceSources": [
      {
        "name": "LXM 100K",
        "distanceKm": 96.4,
        "officialPage": "https://xiamen.utmb.world/races/100K",
        "dateLabel": "14th March 2026"
      },
      {
        "name": "MXM 50K",
        "distanceKm": 53,
        "officialPage": "https://xiamen.utmb.world/races/50K",
        "dateLabel": "14th March 2026"
      },
      {
        "name": "SXM 20K",
        "distanceKm": 28.9,
        "officialPage": "https://xiamen.utmb.world/races/20K",
        "dateLabel": "15th March 2026"
      },
      {
        "name": "EXM 10K",
        "distanceKm": 10.3,
        "officialPage": "https://xiamen.utmb.world/races/10K",
        "dateLabel": "15th March 2026"
      }
    ],
    "location": "Xiamen"
  },
  {
    "id": "9dragons-2027",
    "name": "The 9 Dragons",
    "country": "香港",
    "region": "Asia",
    "year": 2027,
    "edition": 2027,
    "date": "2027-02-27 / 2027-02-28",
    "dateStart": "2027-02-27",
    "dateEnd": "2027-02-28",
    "status": "announced",
    "officialPage": "https://www.the9dragons.asia/",
    "distanceLabels": [
      "50/50 (138.1 km, two days)",
      "50 Miles (84.7 km)",
      "50 km (53.4 km)",
      "25 km (25.4 km)",
      "Kids (4 km)"
    ],
    "metadata": {
      "verifiedAt": "2026-10-13T11:36:00Z",
      "source": "https://www.the9dragons.asia/",
      "dateEvidence": "Official event page explicitly supplies edition and dates.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "官方賽事資料已核實；本屆 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Public source facts and links only; no GPX reuse or redistribution permission claimed."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "cautions": [
      "2027 route and checkpoint timetable provisional, subject to permits. Official public map exists; GPX download not verified."
    ]
  },
  {
    "id": "vietnam-trail-marathon-2027",
    "name": "Vietnam Trail Marathon",
    "country": "越南",
    "region": "Asia",
    "year": 2027,
    "edition": 2027,
    "date": "2027-01-16",
    "dateStart": "2027-01-16",
    "dateEnd": "2027-01-16",
    "status": "announced",
    "officialPage": "https://vietnamtrailseries.com/trail-marathon/",
    "distanceLabels": [
      "5 km",
      "10 km",
      "21 km",
      "50 km",
      "70 km"
    ],
    "metadata": {
      "verifiedAt": "2026-10-13T11:36:00Z",
      "source": "https://vietnamtrailseries.com/trail-marathon/",
      "dateEvidence": "Official event page explicitly supplies edition and dates.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "官方賽事資料已核實；本屆 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Public source facts and links only; no GPX reuse or redistribution permission claimed."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "mtfuji100-2026",
    "name": "Mt.FUJI 100",
    "country": "日本",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-04-24 / 2026-04-26",
    "dateStart": "2026-04-24",
    "dateEnd": "2026-04-26",
    "status": "past",
    "officialPage": "https://past.mtfuji100.com/2026/about/information/",
    "distanceLabels": [
      "FUJI100mi (167.0 km)",
      "KAI70k (70.2 km)",
      "ASUMI40k (38.5 km)",
      "SAKUYA (8.6 km)",
      "SAKUYA U20 (5.7 km)",
      "Mt.FUJI100 mini"
    ],
    "metadata": {
      "verifiedAt": "2026-10-13T11:36:00Z",
      "source": "https://past.mtfuji100.com/2026/about/information/",
      "dateEvidence": "Official event page explicitly supplies edition and dates.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period"
    },
    "gpxDownloadUrl": "https://past.mtfuji100.com/2026/wp-content/themes/utmf/img/course/26FUJI100mi_ver.1.5.gpx",
    "gpxAvailability": "official_download_link_verified",
    "importability": "download_only",
    "importabilityReason": "2026 官方存檔提供 GPX 下載；尚未驗證檔案／CORS。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Public source facts and links only; no GPX reuse or redistribution permission claimed."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "gpxSourcePage": "https://past.mtfuji100.com/2026/racers/course/",
    "routeEdition": 2026,
    "cautions": [
      "Course page labels FUJI/KAI/ASUMI maps current as of 2026-04-17. Some trails are permitted only during the event; this is not permission to reconnoitre private/restricted land."
    ]
  },
  {
    "id": "korea50k-ddc-2026",
    "name": "KOREA 50K Dongducheon (DDC)",
    "country": "韓國",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-04-25",
    "dateStart": "2026-04-25",
    "dateEnd": "2026-04-25",
    "status": "past",
    "officialPage": "https://www.korea50k.com/info",
    "distanceLabels": [
      "DDC50",
      "DDC20",
      "DDC10"
    ],
    "metadata": {
      "verifiedAt": "2026-10-13T11:36:00Z",
      "source": "https://korea50k.com/?bmode=view&idx=170645886&q=YToyOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjtzOjQ6InBhZ2UiO2k6Njt9&t=board",
      "dateEvidence": "Official 2026 DDC finisher-medal announcement gives April 25, 2026; official info page names DDC50/DDC20/DDC10.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "race_day"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "官方賽事資料已核實；本屆 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Public source facts and links only; no GPX reuse or redistribution permission claimed."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "western-states-2026",
    "name": "Western States 100-Mile Endurance Run",
    "country": "美國",
    "region": "North America",
    "year": 2026,
    "edition": 2026,
    "date": "2026-06-27 / 2026-06-28",
    "dateStart": "2026-06-27",
    "dateEnd": "2026-06-28",
    "status": "past",
    "officialPage": "https://www.wser.org/participant-guide/",
    "distanceLabels": [
      "100 mile"
    ],
    "metadata": {
      "verifiedAt": "2026-10-13T11:36:00Z",
      "source": "https://www.wser.org/participant-guide/",
      "dateEvidence": "Official event page explicitly supplies edition and dates.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period"
    },
    "gpxDownloadUrl": "https://www.wser.org/wp-content/uploads/gpx/WSER2025welev.gpx",
    "gpxAvailability": "official_download_link_verified",
    "importability": "download_only",
    "importabilityReason": "官方 GPS 頁標示為 2026 路線含補給站；檔名含 2025，尚未驗證檔案内容與 CORS。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Public source facts and links only; no GPX reuse or redistribution permission claimed."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "gpxSourcePage": "https://www.wser.org/gps-info/",
    "gpxFilenameYear": 2025,
    "cautions": [
      "Official GPS page labels linked file 2026 while filename contains 2025; filename year is not sufficient to establish a route edition. Retain discrepancy instead of relabeling the event."
    ]
  },
  {
    "id": "tor330-2026",
    "name": "TOR330 – Tor des Géants",
    "country": "義大利",
    "region": "Europe",
    "year": 2026,
    "edition": 2026,
    "date": "2026-09-13 / 2026-09-19",
    "dateStart": "2026-09-13",
    "dateEnd": "2026-09-19",
    "status": "past",
    "officialPage": "https://www.torxtrail.com/it/tor330-tor-des-geants/",
    "distanceLabels": [
      "330 km"
    ],
    "metadata": {
      "verifiedAt": "2026-10-13T11:36:00Z",
      "source": "https://www.torxtrail.com/it/tor330-tor-des-geants/",
      "dateEvidence": "Official event page explicitly supplies edition and dates.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period"
    },
    "gpxDownloadUrl": "https://torxtrail.com/wp-content/uploads/2026/08/TOR330-CERT-2026.gpx",
    "gpxAvailability": "official_download_link_verified",
    "importability": "download_only",
    "importabilityReason": "官方頁提供 Full Track 及分段 GPX；尚未驗證檔案／CORS。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Public source facts and links only; no GPX reuse or redistribution permission claimed."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "gpxSourcePage": "https://www.torxtrail.com/it/tor330-tor-des-geants/",
    "gpxLinkType": "raw_gpx",
    "routeEdition": 2026
  },
  {
    "id": "grand-raid-reunion-2026",
    "name": "Grand Raid de la Réunion – Diagonale des Fous",
    "country": "法國（留尼旺）",
    "region": "Africa",
    "year": 2026,
    "edition": 2026,
    "date": "2026-10-15 / 2026-10-18",
    "dateStart": "2026-10-15",
    "dateEnd": "2026-10-18",
    "status": "announced",
    "officialPage": "https://www.grandraid-reunion.com/fr/les-courses/la-diagonale-des-fous",
    "distanceLabels": [
      "Diagonale des Fous (約 180 km)"
    ],
    "metadata": {
      "verifiedAt": "2026-10-13T11:36:00Z",
      "source": "https://www.grandraid-reunion.com/fr/les-courses/la-diagonale-des-fous",
      "dateEvidence": "Official event page explicitly supplies edition and dates.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "官方賽事資料已核實；本屆 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Public source facts and links only; no GPX reuse or redistribution permission claimed."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "distanceCoverage": "flagship_only",
    "cautions": [
      "Only the flagship distance was checked for this entry; do not imply all five Grand Raid events were enumerated. Reconnaissance between Bassin Plat and Piton Sec is prohibited on private land."
    ]
  },
  {
    "id": "explore-your-backyard-2026",
    "name": "Explore Your Backyard 探索後花園",
    "country": "台灣",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-02-07",
    "dateStart": "2026-02-07",
    "dateEnd": "2026-02-07",
    "status": "past",
    "location": "新北市土城",
    "distanceLabels": [
      "31KM",
      "21KM",
      "13KM",
      "7KM"
    ],
    "officialPage": "https://backyard.run/",
    "metadata": {
      "verifiedAt": "2026-10-13T11:38:00Z",
      "source": "https://backyard.run/",
      "dateEvidence": "官方首頁標明 2026 年 2 月 7 日；RACE DAY 同日列出 31、21、13、7KM 四組起跑。",
      "verificationLevel": "official_source_checked",
      "sourceType": "organizer_official_site",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxAvailability": "verified_public",
    "cors": {
      "status": "not_tested",
      "evidence": "普通匿名伺服器下載及精確原始位元組已核對；這兩個來源尚未測試瀏覽器跨站直接讀取。導入使用既有同源固定來源轉接，不宣稱直接 CORS 可用。"
    },
    "license": {
      "redistribution": "not_verified",
      "evidence": "未找到明確授權本 catalog 重新散布 GPX 的條款；公開入口不等於再散布授權。僅記錄官方來源連結及最少賽事事實。"
    },
    "routes": [
      {
        "name": "13KM疾速山徑組",
        "officialPage": "https://backyard.run/",
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=1AviXiCA4S-nSkBWLOCm9EvbIfbR401Xj&export=download",
        "originalDownloadUrl": "https://drive.google.com/file/d/1AviXiCA4S-nSkBWLOCm9EvbIfbR401Xj/view?usp=drivesdk",
        "routeId": "explore-your-backyard-2026-13k",
        "transport": "same_origin_bridge",
        "downloadKind": "verified_bridge_endpoint",
        "bridgeSourceId": "explore-your-backyard-2026-13k",
        "bridgeEndpoint": "/api/routes/explore-your-backyard-2026-13k",
        "sha256": "8efb3134ba7ee83f1c6cc5a58e2e34fa5b49028c6430d10ec8e942e35e8c652a",
        "bytes": 142529,
        "edition": 2026,
        "availability": "verified_public",
        "nominalDistanceKm": 13
      }
    ],
    "routeIds": [
      "explore-your-backyard-2026-13k"
    ],
    "notes": [
      "主辦為 Runivore 與 Beast Runners。",
      "官方提示 21KM、31KM 賽道小幅調整，應使用最新 GPX。公開資料夾 HTTP 200，列出 EYB2026 32km、22km、13km、7k 及 7km alt 檔名；catalog 保留官方報名組別 31KM/21KM，不把檔名改當賽事距離或拆成新屆別。",
      "13KM 精確檔案已核對；7K 一般／alternative 的比賽採用版本仍待核。22/32K 檔名與21/31KM組別的對應未明，不提供猜測導入。",
      "13KM 官方圖確認 CP-A→CP-C，補給服務與關門未核；每個投影位置均需自行確認。"
    ],
    "importability": "bridge_verified",
    "importabilityReason": "已核對本組官方 GPX；依固定來源暫時讀取並在瀏覽器分析。其餘組別仍保留官方入口，未列為已接通。",
    "gpxSourcePage": "https://backyard.run/",
    "officialDownloadPageUrl": "https://drive.google.com/drive/folders/1xOI4Bqul82d3bzWCpafBbO_q7BGX29MD?usp=drive_link"
  },
  {
    "id": "superace-night-trail-2026",
    "name": "SUPERACE NIGHT TRAIL 秋夜野馬",
    "country": "台灣",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-09-05",
    "dateStart": "2026-09-05",
    "dateEnd": "2026-09-05",
    "status": "past",
    "location": "台北市士林區至善國民中學",
    "distanceLabels": [
      "18K RUSH",
      "10K SWIFT",
      "6K LITE",
      "4K PONY"
    ],
    "officialPage": "https://www.superace-sport.com/superace/article/8",
    "metadata": {
      "verifiedAt": "2026-10-13T11:38:00Z",
      "source": "https://www.superace-sport.com/superace/article/8",
      "dateEvidence": "官方 Event Overview 明列 Saturday, September 5th, 2026，13:00–23:00。",
      "verificationLevel": "official_source_checked",
      "sourceType": "organizer_official_site",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxAvailability": "not_checked",
    "gpxDownloadUrl": null,
    "cors": {
      "status": "not_tested",
      "evidence": "未測試瀏覽器跨來源載入。頁面或檔案可由研究工具讀取，不代表產品可跨站匯入。"
    },
    "license": {
      "redistribution": "not_verified",
      "evidence": "未找到明確授權本 catalog 重新散布 GPX 的條款；公開入口不等於再散布授權。僅記錄官方來源連結及最少賽事事實。"
    },
    "routes": [
      {
        "name": "18K RUSH",
        "gpxDownloadUrl": null
      },
      {
        "name": "10K SWIFT",
        "gpxDownloadUrl": null
      },
      {
        "name": "6K LITE",
        "gpxDownloadUrl": null
      },
      {
        "name": "4K PONY",
        "gpxDownloadUrl": null
      }
    ],
    "routeIds": [],
    "notes": [
      "官方 Route Link 為 https://reurl.cc/X2RYz0 ，工具辨識為 2026 SUPERACE 秋夜野馬 Google 我的地圖。",
      "官方文字稱完整 GPX 會於賽前公布；本次未核實 raw GPX 或實際 GPX 下載入口，因此 availability 保持 not_checked。"
    ],
    "importability": "no_gpx",
    "importabilityReason": "官方賽事資料已核實；本屆 GPX 尚未核實。",
    "gpxSourcePage": "https://www.superace-sport.com/superace/article/8"
  },
  {
    "id": "superace-new-taipei-tk-2027",
    "name": "SUPERACE NEW TAIPEI CITY TK／春林野馬",
    "country": "台灣",
    "region": "Asia",
    "year": 2027,
    "edition": 2027,
    "date": "2027-03-26 / 2027-03-28",
    "dateStart": "2027-03-26",
    "dateEnd": "2027-03-28",
    "status": "announced",
    "location": "新北市福隆至新店",
    "distanceLabels": [
      "109K（三日菁英個人／雙人團體／輕裝）",
      "20K（春林野馬單日）"
    ],
    "officialPage": "https://www.superace-sport.com/superace/race/24",
    "metadata": {
      "verifiedAt": "2026-10-13T11:38:00Z",
      "source": "https://www.superace-sport.com/superace/race/24",
      "dateEvidence": "官方主頁逐日列 2027 年 3 月 26、27、28 日；官方簡章明列 109K 三日賽 3/26–28、20K 單日賽 3/28。",
      "verificationLevel": "official_source_checked",
      "sourceType": "organizer_official_site",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxAvailability": "not_checked",
    "gpxDownloadUrl": null,
    "cors": {
      "status": "not_tested",
      "evidence": "未測試瀏覽器跨來源載入。頁面或檔案可由研究工具讀取，不代表產品可跨站匯入。"
    },
    "license": {
      "redistribution": "not_verified",
      "evidence": "未找到明確授權本 catalog 重新散布 GPX 的條款；公開入口不等於再散布授權。僅記錄官方來源連結及最少賽事事實。"
    },
    "routes": [
      {
        "name": "109K 三日賽",
        "gpxDownloadUrl": null,
        "stageDistances": [
          "Day 1: 35km",
          "Day 2: 54km",
          "Day 3: 20km"
        ]
      },
      {
        "name": "20K 春林野馬",
        "gpxDownloadUrl": null,
        "raceDate": "2027-03-28"
      }
    ],
    "routeIds": [],
    "notes": [
      "日期交叉核對官方簡章 https://www.superace-sport.com/superace/article/14?brochure= 。3/25 為報到與裝備檢查，不列作 race dateStart。",
      "官方路線入口 https://pse.is/7pg4hp ；尚未核實 GPX 下載。簡章稱詳細路線於賽前兩個月公布，故不能把現有地圖視為最終 2027 GPX。"
    ],
    "importability": "no_gpx",
    "importabilityReason": "官方賽事資料已核實；本屆 GPX 尚未核實。",
    "gpxSourcePage": "https://www.superace-sport.com/superace/race/24"
  },
  {
    "id": "formosa-trail-2026",
    "name": "Formosa Trail 福爾摩沙古道越野賽",
    "country": "台灣",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-11-20 / 2026-11-22",
    "dateStart": "2026-11-20",
    "dateEnd": "2026-11-22",
    "status": "announced",
    "location": "南投縣埔里鎮",
    "distanceLabels": [
      "104km",
      "75km",
      "54km",
      "40km",
      "18km",
      "10km"
    ],
    "officialPage": "https://formosatrail.com/zh/",
    "metadata": {
      "verifiedAt": "2026-10-13T11:38:00Z",
      "source": "https://formosatrail.com/zh/",
      "dateEvidence": "官方首頁明列 FORMOSA TRAIL 2026、NOVEMBER 20th–21st–22nd；此為完整活動窗。賽道頁列競賽於星期六開始、104km 最晚星期日 08:00 結束。",
      "verificationLevel": "official_source_checked",
      "sourceType": "organizer_official_site",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxAvailability": "verified_public",
    "cors": {
      "status": "browser_cross_site_blocked",
      "evidence": "Browser import reproduced a fetch failure. Same exact public URL with browser Fetch Metadata returned403 without ACAO; normal anonymous server GET returned200 and reviewed bytes. Import uses bounded same-origin fixed-source bridge."
    },
    "license": {
      "redistribution": "not_verified",
      "evidence": "未找到明確授權本 catalog 重新散布 GPX 的條款；公開入口不等於再散布授權。僅記錄官方來源連結及最少賽事事實。"
    },
    "routes": [
      {
        "routeId": "formosa-trail-2026-10k",
        "name": "Formosa Trail 10K",
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=1ZAIv9f7CBQW2DOUTh9iGnhm40vIjEIev&export=download",
        "sha256": "0549cefe00a1ea25a34308f1a7011dbb1739e5290cec4b7783422cfca2bf1e61",
        "downloadKind": "verified_bridge_endpoint",
        "bridgeSourceId": "formosa-trail-2026-10k",
        "bridgeEndpoint": "/api/routes/formosa-trail-2026-10k",
        "transport": "same_origin_bridge",
        "officialPage": "https://formosatrail.com/zh/course/",
        "bytes": 105364,
        "edition": 2026,
        "availability": "verified_public"
      },
      {
        "routeId": "formosa-trail-2026-18k",
        "name": "Formosa Trail 18K",
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=1Qx_t0uo3-dkQV0LCVP5G8ImyJIpo1Pac&export=download",
        "sha256": "ee20f1397ff78d355d581f5657498f437d15efab6ed4e4f1ea35c95283c7d106",
        "downloadKind": "verified_bridge_endpoint",
        "bridgeSourceId": "formosa-trail-2026-18k",
        "bridgeEndpoint": "/api/routes/formosa-trail-2026-18k",
        "transport": "same_origin_bridge",
        "officialPage": "https://formosatrail.com/zh/course/",
        "bytes": 188375,
        "edition": 2026,
        "availability": "verified_public"
      },
      {
        "routeId": "formosa-trail-2026-40k",
        "name": "Formosa Trail 40K",
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=1eEuglVNUf_KmeBBPUeOS5mjH_t07YB0G&export=download",
        "sha256": "e8883da6487a4f095fdf625bf1cb9f7f9a3d32c8c9a194cf411729ec2914bf4d",
        "downloadKind": "verified_bridge_endpoint",
        "bridgeSourceId": "formosa-trail-2026-40k",
        "bridgeEndpoint": "/api/routes/formosa-trail-2026-40k",
        "transport": "same_origin_bridge",
        "officialPage": "https://formosatrail.com/zh/course/",
        "bytes": 313657,
        "edition": 2026,
        "availability": "verified_public"
      },
      {
        "routeId": "formosa-trail-2026-54k",
        "name": "Formosa Trail 54K",
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=1r-ZiQhDeo2HJvHZV1ENVWra64EuaAA6R&export=download",
        "sha256": "202bcdcbafca7d9b2a66b22a97a1f3b0634b88fff20b38f4eca62ef71ef7dd79",
        "downloadKind": "verified_bridge_endpoint",
        "bridgeSourceId": "formosa-trail-2026-54k",
        "bridgeEndpoint": "/api/routes/formosa-trail-2026-54k",
        "transport": "same_origin_bridge",
        "officialPage": "https://formosatrail.com/zh/course/",
        "bytes": 520680,
        "edition": 2026,
        "availability": "verified_public"
      },
      {
        "routeId": "formosa-trail-2026-75k",
        "name": "Formosa Trail 75K",
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=1SqI276YkvpIPSPIEo5WZu5Z3Pgi_Wdyn&export=download",
        "sha256": "376bda98fd3da357c7710ac4cdc1f3ee7b75a3177a0ec0b972e06ee6a2a28988",
        "downloadKind": "verified_bridge_endpoint",
        "bridgeSourceId": "formosa-trail-2026-75k",
        "bridgeEndpoint": "/api/routes/formosa-trail-2026-75k",
        "transport": "same_origin_bridge",
        "officialPage": "https://formosatrail.com/zh/course/",
        "bytes": 590500,
        "edition": 2026,
        "availability": "verified_public"
      },
      {
        "routeId": "formosa-trail-2026-104k",
        "name": "Formosa Trail 104K",
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=1gAaEVFBVtVScNfmcooEdidLJFBMtFte1&export=download",
        "sha256": "b8ce9b9e109a4d914f6fbd2e047640f45a0cb62cf74187d00033704eda2ed04d",
        "downloadKind": "verified_bridge_endpoint",
        "bridgeSourceId": "formosa-trail-2026-104k",
        "bridgeEndpoint": "/api/routes/formosa-trail-2026-104k",
        "transport": "same_origin_bridge",
        "officialPage": "https://formosatrail.com/zh/course/",
        "bytes": 903828,
        "edition": 2026,
        "availability": "verified_public"
      }
    ],
    "routeIds": [
      "formosa-trail-2026-10k",
      "formosa-trail-2026-18k",
      "formosa-trail-2026-40k",
      "formosa-trail-2026-54k",
      "formosa-trail-2026-75k",
      "formosa-trail-2026-104k"
    ],
    "notes": [
      "所有組別依官方賽道頁 https://formosatrail.com/zh/course/ 與報名頁 https://formosatrail.com/zh/registration/ 。首頁 banner 漏列新增 54km；兩個專門頁均明列六組。",
      "競賽實際起跑日為 2026-11-21；dateStart 2026-11-20 保留官方完整活動窗，勿誤當所有組別起跑日。",
      "官方 .gpx files DOWNLOAD 連至 tinyurl；實際公開轉址 HTTP 200 為 https://drive.google.com/drive/folders/1pbTQfHVKJ1hHXkJ82kFYRCAe00LwpiRg?usp=sharing 。未認證每一檔是否為最終 2026 版本。"
    ],
    "importability": "bridge_verified",
    "importabilityReason": "六組可導入檢視。部分路線高度待修復或含陡坡，依檢查結果選擇處理。 官方原始 GPX 保留獨立下載；導入經固定來源轉接。",
    "gpxSourcePage": "https://formosatrail.com/zh/"
  },
  {
    "id": "taiwan-action-asia-50-2026",
    "name": "Taiwan Action Asia 50 – Shihmen Reservoir",
    "country": "台灣",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-12-12",
    "dateStart": "2026-12-12",
    "dateEnd": "2026-12-12",
    "status": "announced",
    "location": "桃園市石門水庫",
    "distanceLabels": [
      "50km",
      "26km",
      "12km"
    ],
    "officialPage": "https://actionasiaevents.com/2026-taiwan-action-asia-50-shihmen-reservoir/",
    "metadata": {
      "verifiedAt": "2026-10-13T11:38:00Z",
      "source": "https://actionasiaevents.com/2026-taiwan-action-asia-50-shihmen-reservoir/",
      "dateEvidence": "官方 2026 edition 頁明列 Saturday Dec 12, 2026；同頁日程 50km 05:00、26km/12km 06:15 起跑。",
      "verificationLevel": "official_source_checked",
      "sourceType": "organizer_official_site",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxAvailability": "verified_public",
    "gpxDownloadUrl": "https://actionasiaevents.com/wp-content/uploads/2026/07/TWAA50.gpx",
    "cors": {
      "status": "not_tested",
      "evidence": "未測試瀏覽器跨來源載入。頁面或檔案可由研究工具讀取，不代表產品可跨站匯入。"
    },
    "license": {
      "redistribution": "not_verified",
      "evidence": "未找到明確授權本 catalog 重新散布 GPX 的條款；公開入口不等於再散布授權。僅記錄官方來源連結及最少賽事事實。"
    },
    "routes": [
      {
        "name": "50km",
        "officialPage": "https://actionasiaevents.com/2026-taiwan-action-asia-50-shihmen-reservoir/",
        "gpxDownloadUrl": "https://actionasiaevents.com/wp-content/uploads/2026/07/TWAA50.gpx",
        "availability": "verified_public",
        "validation": {
          "httpStatus": 200,
          "contentType": "application/gpx+xml",
          "trackpoints": 1675,
          "elevationPoints": 1675,
          "bytes": 194612,
          "checkedAt": "2026-10-13T11:38:00Z"
        },
        "routeId": "taiwan-action-asia-2026-50km",
        "transport": "same_origin_bridge",
        "bridgeSourceId": "taiwan-action-asia-2026-50km",
        "bridgeEndpoint": "/api/routes/taiwan-action-asia-2026-50km",
        "edition": 2026,
        "sha256": "13662c94c91da42580d0cfb7c8e0a70781cb9e67c2265180e33eaaee2a6d700c",
        "bytes": 194612,
        "downloadKind": "verified_bridge_endpoint"
      },
      {
        "name": "26km",
        "officialPage": "https://actionasiaevents.com/2026-taiwan-action-asia-50-shihmen-reservoir/",
        "gpxDownloadUrl": "https://actionasiaevents.com/wp-content/uploads/2026/06/26km-NEW-Taiwan-Action-Asia-50-Taiwan-Shihmen-Reservoir.gpx",
        "availability": "verified_public",
        "validation": {
          "httpStatus": 200,
          "contentType": "application/gpx+xml",
          "trackpoints": 905,
          "elevationPoints": 905,
          "bytes": 85282,
          "checkedAt": "2026-10-13T18:37:58Z"
        },
        "routeId": "taiwan-action-asia-2026-26km",
        "transport": "same_origin_bridge",
        "bridgeSourceId": "taiwan-action-asia-2026-26km",
        "bridgeEndpoint": "/api/routes/taiwan-action-asia-2026-26km",
        "edition": 2026,
        "sha256": "cc1b1d611b720ec964acfe9b5390c7a83209505c4630463911b5b8563a2dacb2",
        "bytes": 85282,
        "downloadKind": "verified_bridge_endpoint"
      },
      {
        "name": "12km",
        "officialPage": "https://actionasiaevents.com/2026-taiwan-action-asia-50-shihmen-reservoir/",
        "gpxDownloadUrl": "https://actionasiaevents.com/wp-content/uploads/2026/06/12-km-Taiwan-Action-Asia-50-Shihmen.gpx",
        "availability": "verified_public",
        "validation": {
          "httpStatus": 200,
          "contentType": "application/gpx+xml",
          "trackpoints": 445,
          "elevationPoints": 445,
          "bytes": 42392,
          "checkedAt": "2026-10-13T18:38:02Z"
        },
        "routeId": "taiwan-action-asia-2026-12km",
        "transport": "same_origin_bridge",
        "bridgeSourceId": "taiwan-action-asia-2026-12km",
        "bridgeEndpoint": "/api/routes/taiwan-action-asia-2026-12km",
        "edition": 2026,
        "sha256": "dec270e17cc0c2528af01e212c8429fc895384482573e1baa792bf5f9b265592",
        "bytes": 42392,
        "downloadKind": "verified_bridge_endpoint"
      }
    ],
    "routeIds": [
      "taiwan-action-asia-2026-50km",
      "taiwan-action-asia-2026-26km",
      "taiwan-action-asia-2026-12km"
    ],
    "notes": [
      "三個 URL 均從本屆官方 GPX DOWNLOAD 錨點取得，GET HTTP 200 且成功解析 XML。50km／26km／12km 已核對同站來源橋接與各自固定版本雜湊；保留官方下載連結。未宣稱官方來源可跨站直接載入。",
      "官網組別是 26km，部分彙整網站的 25km 不採用。GPX 網址的上傳年月不被用作屆別依據；屆別來自 2026 官方賽事頁。",
      "50km 海拔完整且未被資料檢查封鎖；坡度網格有 16 格超出模型範圍，需明確設定陡坡情境。未核實補給站座標與關門時間。",
      "26km／12km 海拔完整且未被資料檢查封鎖；坡度網格分別有 12／6 格超出模型範圍，需明確設定陡坡情境。未核實補給站座標與絕對關門時間。",
      "26km／12km 官方起跑時間為 06:15，總限時分別為 8／5 小時；不由總限時推算絕對終點關門時間。12km 檔內保留 2024 路線說明，仍是 2026 官頁目前提供的檔案。"
    ],
    "importability": "bridge_verified",
    "importabilityReason": "50km／26km／12km 可導入 GPX，陡坡需情境設定；另提供官方下載連結。",
    "gpxSourcePage": "https://actionasiaevents.com/2026-taiwan-action-asia-50-shihmen-reservoir/"
  },
  {
    "id": "beat-the-sunset-2026",
    "name": "Beat the Sunset 跑過夕陽",
    "country": "台灣",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-11-07",
    "dateStart": "2026-11-07",
    "dateEnd": "2026-11-07",
    "status": "announced",
    "location": "新北市土城區妙覺禪寺",
    "distanceLabels": [
      "2.9km／圈（個人、雙人、四人限時賽）"
    ],
    "officialPage": "https://beatthesunset.run/",
    "metadata": {
      "verifiedAt": "2026-10-13T11:38:00Z",
      "source": "https://beatthesunset.run/",
      "dateEvidence": "官方首頁與頁尾明列 2026 年 11 月 7 日；賽程 12:00 至 17:29。",
      "verificationLevel": "official_source_checked",
      "sourceType": "organizer_official_site",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxAvailability": "official_download_page_verified",
    "gpxDownloadUrl": "https://drive.google.com/file/d/1A-UM80KUtwDXd7PG2MZs6XX5s1htUuv3/view?usp=sharing",
    "cors": {
      "status": "not_tested",
      "evidence": "未測試瀏覽器跨來源載入。頁面或檔案可由研究工具讀取，不代表產品可跨站匯入。"
    },
    "license": {
      "redistribution": "not_verified",
      "evidence": "未找到明確授權本 catalog 重新散布 GPX 的條款；公開入口不等於再散布授權。僅記錄官方來源連結及最少賽事事實。"
    },
    "routes": [
      {
        "name": "2.9km 循環路線",
        "officialPage": "https://beatthesunset.run/",
        "gpxDownloadUrl": "https://drive.google.com/file/d/1A-UM80KUtwDXd7PG2MZs6XX5s1htUuv3/view?usp=sharing",
        "downloadKind": "google_drive_file_page"
      }
    ],
    "routeIds": [],
    "notes": [
      "沒有固定總距離；2.9km 是每圈長度。組別為末日單匹狼、默契雙人組、超級四人組，不拆成不同 event editions。",
      "官方下載 GPX 連至 BTS-Official Course.gpx 公開 Drive 預覽；尚未下載或測試 raw GPX。"
    ],
    "importability": "download_only",
    "importabilityReason": "官方提供 GPX 下載入口；未驗證跨來源直接匯入／再散布授權。",
    "gpxLinkType": "official_download_page",
    "gpxSourcePage": "https://beatthesunset.run/"
  },
  {
    "id": "mountain-antelope-hutoushan-2026",
    "name": "山羚羊越野～虎頭山站",
    "country": "台灣",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-09-06",
    "dateStart": "2026-09-06",
    "dateEnd": "2026-09-06",
    "status": "past",
    "location": "桃園市立桃園高級中等學校／虎頭山",
    "distanceLabels": [
      "25km",
      "18km（山羌／EMBA）",
      "10km",
      "5km"
    ],
    "officialPage": "https://www.bao-ming.com/eb/content/6957",
    "metadata": {
      "verifiedAt": "2026-10-13T11:38:00Z",
      "source": "https://www.bao-ming.com/eb/content/6957",
      "dateEvidence": "主辦鉑金運動行銷於伊貝特官方報名頁明列 2026 年 9 月 6 日，內文民國 115 年 9 月 6 日相符。",
      "verificationLevel": "official_source_checked",
      "sourceType": "organizer_authorized_registration_page",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxAvailability": "verified_public",
    "cors": {
      "status": "not_tested",
      "evidence": "普通匿名伺服器下載及精確原始位元組已核對；這兩個來源尚未測試瀏覽器跨站直接讀取。導入使用既有同源固定來源轉接，不宣稱直接 CORS 可用。"
    },
    "license": {
      "redistribution": "not_verified",
      "evidence": "未找到明確授權本 catalog 重新散布 GPX 的條款；公開入口不等於再散布授權。僅記錄官方來源連結及最少賽事事實。"
    },
    "routes": [
      {
        "name": "25km 羚羊組",
        "officialPage": "https://www.bao-ming.com/eb/content/6957",
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=1RJcJtw7SWLPRWYsXHgdyUYYSyyPbZ8nH&export=download",
        "downloadKind": "verified_bridge_endpoint",
        "originalDownloadUrl": "https://drive.google.com/file/d/1RJcJtw7SWLPRWYsXHgdyUYYSyyPbZ8nH/view?usp=drive_link",
        "routeId": "mountain-antelope-hutoushan-2026-25k",
        "transport": "same_origin_bridge",
        "bridgeSourceId": "mountain-antelope-hutoushan-2026-25k",
        "bridgeEndpoint": "/api/routes/mountain-antelope-hutoushan-2026-25k",
        "sha256": "1562c1f0128d1a13aa0f330fcd6fad3195adb67c992285269bf9bcbcbcd9b1c0",
        "bytes": 872541,
        "edition": 2026,
        "availability": "verified_public",
        "nominalDistanceKm": 25
      },
      {
        "name": "18km 山羌組／EMBA卓越組",
        "officialPage": "https://www.bao-ming.com/eb/content/6957",
        "gpxDownloadUrl": "https://drive.google.com/file/d/1A2dmVb-kcw23-TApyfvUiXbL2pHwRCSV/view?usp=sharing",
        "downloadKind": "google_drive_file_page"
      },
      {
        "name": "10km 野兔組",
        "officialPage": "https://www.bao-ming.com/eb/content/6957",
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=15D_-DBB-7ERQ9y-Z2NVBt1RfTsfWcOB2&export=download",
        "downloadKind": "verified_bridge_endpoint",
        "originalDownloadUrl": "https://drive.google.com/file/d/15D_-DBB-7ERQ9y-Z2NVBt1RfTsfWcOB2/view?usp=drive_link",
        "routeId": "mountain-antelope-hutoushan-2026-10k",
        "transport": "same_origin_bridge",
        "bridgeSourceId": "mountain-antelope-hutoushan-2026-10k",
        "bridgeEndpoint": "/api/routes/mountain-antelope-hutoushan-2026-10k",
        "sha256": "7d4def26b7ca8db5f11318e2a4e57ef481fa4679e6f459ca6cc95ce308ec9622",
        "bytes": 1492025,
        "edition": 2026,
        "availability": "verified_public",
        "nominalDistanceKm": 10
      },
      {
        "name": "5km 親子組",
        "officialPage": "https://www.bao-ming.com/eb/content/6957",
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=1woooEIpLrnHHrZ0tjgG-C5EL5qydBgti&export=download",
        "originalDownloadUrl": "https://drive.google.com/file/d/1woooEIpLrnHHrZ0tjgG-C5EL5qydBgti/view?usp=drive_link",
        "routeId": "mountain-antelope-hutoushan-2026-5k",
        "transport": "same_origin_bridge",
        "downloadKind": "verified_bridge_endpoint",
        "bridgeSourceId": "mountain-antelope-hutoushan-2026-5k",
        "bridgeEndpoint": "/api/routes/mountain-antelope-hutoushan-2026-5k",
        "sha256": "e8d63dbababe801f4873fad66f94295c9e7f98c66f5b40ead7f347a96a4f14fe",
        "bytes": 26781,
        "edition": 2026,
        "availability": "verified_public",
        "nominalDistanceKm": 5
      }
    ],
    "routeIds": [
      "mountain-antelope-hutoushan-2026-5k",
      "mountain-antelope-hutoushan-2026-10k",
      "mountain-antelope-hutoushan-2026-25k"
    ],
    "notes": [
      "官方路線段落為四條路線逐一提供 GPX 路線下載；18km 為山羌及 EMBA 共用。",
      "伊貝特網頁由網頁工具讀取成功；獨立 HTTP 抓取返回 403，未繞過限制。未主張 GPX 可跨站直接匯入。",
      "5K 原始 GPX 已核對；沒有原始航點。官方站名與數量待核，不能解讀為零站。",
      "10K／25K 原始 GPX 已獨立核對；皆無原始航點。官方站名、數量、補給及關門語義待核，不能視為零站。兩組各有真實陡坡格，普通模型仍有範圍限制。"
    ],
    "importability": "bridge_verified",
    "importabilityReason": "已核對 5K／10K／25K 官方連結原始 GPX，使用固定來源暫時讀取並在瀏覽器分析；18K 保留官方入口。模型與官方站點資料仍各自受限。",
    "gpxSourcePage": "https://www.bao-ming.com/eb/content/6957",
    "officialDownloadPageUrl": "https://www.bao-ming.com/eb/content/6957"
  },
  {
    "id": "mingfeng-trail-2027",
    "name": "鳴鳳越野",
    "country": "台灣",
    "region": "Asia",
    "year": 2027,
    "edition": 2027,
    "date": "2027-03-21",
    "dateStart": "2027-03-21",
    "dateEnd": "2027-03-21",
    "status": "announced",
    "location": "苗栗縣獅潭義民廟",
    "distanceLabels": [
      "20KM",
      "12KM",
      "5K（路線段落 5.1KM）",
      "LV0 尋寶組（未公告固定距離）"
    ],
    "officialPage": "https://dtpwow.run/races/2027mingfeng/",
    "metadata": {
      "verifiedAt": "2026-10-13T11:38:00Z",
      "source": "https://dtpwow.run/races/2027mingfeng/",
      "dateEvidence": "主辦台灣龍虎鳳越野協會之 DTP WOW 官方 2027 專頁明列 2027 年 3 月 21 日，07:00–15:00。",
      "verificationLevel": "official_source_checked",
      "sourceType": "organizer_official_site",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxAvailability": "not_checked",
    "gpxDownloadUrl": null,
    "cors": {
      "status": "not_tested",
      "evidence": "未測試瀏覽器跨來源載入。頁面或檔案可由研究工具讀取，不代表產品可跨站匯入。"
    },
    "license": {
      "redistribution": "not_verified",
      "evidence": "未找到明確授權本 catalog 重新散布 GPX 的條款；公開入口不等於再散布授權。僅記錄官方來源連結及最少賽事事實。"
    },
    "routes": [
      {
        "name": "20KM LV3",
        "officialPage": "https://dtpwow.run/races/2027mingfeng/",
        "downloadKind": "organizer_linked_route_page",
        "routePageUrl": "https://ridewithgps.com/routes/40250369",
        "gpxDownloadUrl": null
      },
      {
        "name": "12KM LV2",
        "officialPage": "https://dtpwow.run/races/2027mingfeng/",
        "downloadKind": "organizer_linked_route_page",
        "routePageUrl": "https://ridewithgps.com/routes/40197456",
        "gpxDownloadUrl": null
      },
      {
        "name": "5.1KM LV1",
        "officialPage": "https://dtpwow.run/races/2027mingfeng/",
        "downloadKind": "organizer_linked_route_page",
        "routePageUrl": "https://ridewithgps.com/routes/40197475",
        "gpxDownloadUrl": null
      }
    ],
    "routeIds": [],
    "notes": [
      "官方以 GPX 標示三個 Ride with GPS 路線連結；未驗證 raw GPX 匯出是否需登入，未繞過登入。",
      "官方同页組別總覽為 5K，詳段為 5.1KM，原樣標註此差異；LV0 為定向尋寶，未捏造距離。路線仍以賽前最終公告為準。"
    ],
    "importability": "no_gpx",
    "importabilityReason": "官方提供路線頁；GPX 匯出是否可公開下載尚未核實。",
    "gpxSourcePage": "https://dtpwow.run/races/2027mingfeng/"
  },
  {
    "id": "wufeng-trail-2026",
    "name": "五峰越野",
    "country": "台灣",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-10-18",
    "dateStart": "2026-10-18",
    "dateEnd": "2026-10-18",
    "status": "announced",
    "location": "新竹縣竹東鎮夢幻溪谷露營區",
    "distanceLabels": [
      "30KM",
      "28KM",
      "19.3KM"
    ],
    "officialPage": "https://dtpwow.run/races/2026-wufong/",
    "metadata": {
      "verifiedAt": "2026-10-13T11:38:00Z",
      "source": "https://dtpwow.run/races/2026-wufong/",
      "dateEvidence": "DTP WOW 官方 2026 五峰專頁的活動日期、活動時間均明列 2026 年 10 月 18 日。",
      "verificationLevel": "official_source_checked",
      "sourceType": "organizer_official_site",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxAvailability": "not_checked",
    "gpxDownloadUrl": null,
    "cors": {
      "status": "not_tested",
      "evidence": "未測試瀏覽器跨來源載入。頁面或檔案可由研究工具讀取，不代表產品可跨站匯入。"
    },
    "license": {
      "redistribution": "not_verified",
      "evidence": "未找到明確授權本 catalog 重新散布 GPX 的條款；公開入口不等於再散布授權。僅記錄官方來源連結及最少賽事事實。"
    },
    "routes": [
      {
        "name": "30KM LV4",
        "officialPage": "https://dtpwow.run/races/2026-wufong/",
        "downloadKind": "organizer_linked_route_page",
        "routePageUrl": "https://ridewithgps.com/routes/46676445",
        "gpxDownloadUrl": null
      },
      {
        "name": "28KM LV3",
        "officialPage": "https://dtpwow.run/races/2026-wufong/",
        "downloadKind": "organizer_linked_route_page",
        "routePageUrl": "https://ridewithgps.com/routes/55325799",
        "gpxDownloadUrl": null
      },
      {
        "name": "19.3KM LV2",
        "officialPage": "https://dtpwow.run/races/2026-wufong/",
        "downloadKind": "organizer_linked_route_page",
        "routePageUrl": "https://ridewithgps.com/routes/46676464",
        "gpxDownloadUrl": null
      }
    ],
    "routeIds": [],
    "notes": [
      "官方 GPX 錨點通往三個 Ride with GPS 路線頁，三頁标题已核實；未下載 raw GPX、未測試匯出是否需登入。",
      "日期來自明確 2026 賽事頁，未按 Ride with GPS 路線建立年份推定屆別。官方仍要求以大會公告與手冊版本為準。"
    ],
    "importability": "no_gpx",
    "importabilityReason": "官方提供路線頁；GPX 匯出是否可公開下載尚未核實。",
    "gpxSourcePage": "https://dtpwow.run/races/2026-wufong/"
  },
  {
    "id": "songhe-trail-2026",
    "name": "松鶴越野",
    "country": "台灣",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-05-17",
    "dateStart": "2026-05-17",
    "dateEnd": "2026-05-17",
    "status": "past",
    "location": "南投縣泰雅渡假村",
    "distanceLabels": [
      "56K",
      "20KM",
      "13KM",
      "7KM"
    ],
    "officialPage": "https://dtpwow.run/races/2026-%E6%9D%BE%E9%B6%B4%E8%B6%8A%E9%87%8E/",
    "metadata": {
      "verifiedAt": "2026-10-13T11:38:00Z",
      "source": "https://dtpwow.run/races/2026-%E6%9D%BE%E9%B6%B4%E8%B6%8A%E9%87%8E/",
      "dateEvidence": "DTP WOW 官方 2026 松鶴專頁活動日期與活動時間均明列 2026 年 5 月 17 日。",
      "verificationLevel": "official_source_checked",
      "sourceType": "organizer_official_site",
      "eventDateScope": "event_period_not_all_distance_start_times"
    },
    "gpxAvailability": "not_checked",
    "gpxDownloadUrl": null,
    "cors": {
      "status": "not_tested",
      "evidence": "未測試瀏覽器跨來源載入。頁面或檔案可由研究工具讀取，不代表產品可跨站匯入。"
    },
    "license": {
      "redistribution": "not_verified",
      "evidence": "未找到明確授權本 catalog 重新散布 GPX 的條款；公開入口不等於再散布授權。僅記錄官方來源連結及最少賽事事實。"
    },
    "routes": [
      {
        "name": "56K LV5",
        "officialPage": "https://dtpwow.run/races/2026-%E6%9D%BE%E9%B6%B4%E8%B6%8A%E9%87%8E/",
        "routePageUrl": "https://ridewithgps.com/routes/45158155",
        "gpxDownloadUrl": null
      },
      {
        "name": "20KM LV3",
        "officialPage": "https://dtpwow.run/races/2026-%E6%9D%BE%E9%B6%B4%E8%B6%8A%E9%87%8E/",
        "routePageUrl": "https://ridewithgps.com/routes/45158197",
        "gpxDownloadUrl": null
      },
      {
        "name": "13KM LV2",
        "officialPage": "https://dtpwow.run/races/2026-%E6%9D%BE%E9%B6%B4%E8%B6%8A%E9%87%8E/",
        "routePageUrl": "https://ridewithgps.com/routes/53563584",
        "gpxDownloadUrl": null
      },
      {
        "name": "7KM LV1",
        "officialPage": "https://dtpwow.run/races/2026-%E6%9D%BE%E9%B6%B4%E8%B6%8A%E9%87%8E/",
        "routePageUrl": "https://ridewithgps.com/routes/53569902",
        "gpxDownloadUrl": null
      }
    ],
    "routeIds": [],
    "notes": [
      "官方提供四個 Ride with GPS「路線連結」，沒有明確 GPX 下載錨點；故只存 routePageUrl、availability 為 not_checked。",
      "官方本屆主會場為南投泰雅渡假村。里程依競賽路線段落四組標籤，不以地名或往屆路線推定。"
    ],
    "importability": "no_gpx",
    "importabilityReason": "官方賽事資料已核實；本屆 GPX 尚未核實。",
    "gpxSourcePage": "https://dtpwow.run/races/2026-%E6%9D%BE%E9%B6%B4%E8%B6%8A%E9%87%8E/"
  },
  {
    "id": "skyhunter-qiyan-2026",
    "name": "SKY HUNTER 奇岩連峰越野挑戰賽",
    "country": "台灣",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-04-11",
    "dateStart": "2026-04-11",
    "dateEnd": "2026-04-11",
    "status": "past",
    "officialPage": "https://www.twttra.com/pages/26-skyhuntertrail",
    "metadata": {
      "verifiedAt": "2026-10-14T06:37:37.751485+00:00",
      "source": "https://www.twttra.com/pages/26-skyhuntertrail",
      "dateEvidence": "Current primary event page explicitly publishes 2026/04/11, group labels, nominal distances/ascent, starts and time limits, and links the exact observed Drive folder.",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_date_and_selected_group_start_times"
    },
    "gpxAvailability": "verified_public",
    "importability": "bridge_verified",
    "importabilityReason": "4K、13K、6K共用單圈可導入；30K可檢查原始檔，原始跳點阻擋計算。官方站點與關門待核。",
    "officialDownloadPageUrl": "https://drive.google.com/drive/folders/1gP7EOZwvA6TipYGrr8eo2f17HFQobJ4I?usp=share_link",
    "routeEditionMatchesEvent": true,
    "routeYear": 2026,
    "license": {
      "redistribution": "not_verified",
      "evidence": "Minimal source facts and visitor-triggered transient original-byte analysis only. No GPX mirror or general redistribution license established."
    },
    "cors": {
      "status": "not_tested",
      "evidence": "Normal anonymous server GET returned exact reviewed bytes. Direct browser CORS/Fetch Metadata and deployed transport acceptance remain separately untested."
    },
    "routes": [
      {
        "routeId": "skyhunter-qiyan-2026-4k",
        "name": "4K 親子組",
        "nominalDistanceKm": 4,
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=1KkEdQYxzotCGBlOBrl_cEJackaEwrC0G&export=download",
        "originalDownloadUrl": "https://drive.google.com/file/d/1KkEdQYxzotCGBlOBrl_cEJackaEwrC0G/view?usp=drivesdk",
        "officialDownloadPageUrl": "https://drive.google.com/drive/folders/1gP7EOZwvA6TipYGrr8eo2f17HFQobJ4I?usp=share_link",
        "originalOfficialDownloadEntry": "https://drive.google.com/drive/folders/1gP7EOZwvA6TipYGrr8eo2f17HFQobJ4I?usp=share_link",
        "sha256": "493290d157a33df69090106b32f4b8ac1df75497b88f205079e7133bb65ce874",
        "downloadKind": "verified_bridge_endpoint",
        "bridgeSourceId": "skyhunter-qiyan-2026-4k",
        "bridgeEndpoint": "/api/routes/skyhunter-qiyan-2026-4k",
        "transport": "same_origin_bridge",
        "officialPage": "https://www.twttra.com/pages/26-skyhuntertrail",
        "bytes": 34143,
        "edition": 2026,
        "availability": "verified_public"
      },
      {
        "routeId": "skyhunter-qiyan-2026-13k",
        "name": "13K 體驗組",
        "nominalDistanceKm": 13,
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=1Wh5ky4uNLcoKfHwPLFdHrm8n-bUmcm0A&export=download",
        "originalDownloadUrl": "https://drive.google.com/file/d/1Wh5ky4uNLcoKfHwPLFdHrm8n-bUmcm0A/view?usp=drivesdk",
        "officialDownloadPageUrl": "https://drive.google.com/drive/folders/1gP7EOZwvA6TipYGrr8eo2f17HFQobJ4I?usp=share_link",
        "originalOfficialDownloadEntry": "https://drive.google.com/drive/folders/1gP7EOZwvA6TipYGrr8eo2f17HFQobJ4I?usp=share_link",
        "sha256": "5c82c53c8f761f827cb6a6d1d8efb02ff492856115b20fc39c4349e4d7cbf255",
        "downloadKind": "verified_bridge_endpoint",
        "bridgeSourceId": "skyhunter-qiyan-2026-13k",
        "bridgeEndpoint": "/api/routes/skyhunter-qiyan-2026-13k",
        "transport": "same_origin_bridge",
        "officialPage": "https://www.twttra.com/pages/26-skyhuntertrail",
        "bytes": 88053,
        "edition": 2026,
        "availability": "verified_public"
      },
      {
        "routeId": "skyhunter-qiyan-2026-6k",
        "name": "6K 休閒／接力共用（單圈）",
        "nominalDistanceKm": 6,
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=1OHtSJ2DF4BP6U5tKhg1VLCQocWvZG9Ua&export=download",
        "originalDownloadUrl": "https://drive.google.com/file/d/1OHtSJ2DF4BP6U5tKhg1VLCQocWvZG9Ua/view?usp=drivesdk",
        "officialDownloadPageUrl": "https://drive.google.com/drive/folders/1gP7EOZwvA6TipYGrr8eo2f17HFQobJ4I?usp=share_link",
        "originalOfficialDownloadEntry": "https://drive.google.com/drive/folders/1gP7EOZwvA6TipYGrr8eo2f17HFQobJ4I?usp=share_link",
        "sha256": "4dcee2cedee883cb0e72911863eac4df4a39b4bd0e2c1835ef0f53a77cee6676",
        "downloadKind": "verified_bridge_endpoint",
        "bridgeSourceId": "skyhunter-qiyan-2026-6k",
        "bridgeEndpoint": "/api/routes/skyhunter-qiyan-2026-6k",
        "transport": "same_origin_bridge",
        "officialPage": "https://www.twttra.com/pages/26-skyhuntertrail",
        "bytes": 46422,
        "edition": 2026,
        "availability": "verified_public"
      },
      {
        "routeId": "skyhunter-qiyan-2026-30k",
        "name": "30K 挑戰組",
        "nominalDistanceKm": 30,
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=18ca6LOP85FCBlmS6OdTYwTcsE0m4WjiL&export=download",
        "originalDownloadUrl": "https://drive.google.com/file/d/18ca6LOP85FCBlmS6OdTYwTcsE0m4WjiL/view?usp=drivesdk",
        "officialDownloadPageUrl": "https://drive.google.com/drive/folders/1gP7EOZwvA6TipYGrr8eo2f17HFQobJ4I?usp=share_link",
        "originalOfficialDownloadEntry": "https://drive.google.com/drive/folders/1gP7EOZwvA6TipYGrr8eo2f17HFQobJ4I?usp=share_link",
        "sha256": "28b83bdac9366635958ec031f237bc30a41784e503cd7d353ebe9383baf6e44b",
        "downloadKind": "verified_bridge_endpoint",
        "bridgeSourceId": "skyhunter-qiyan-2026-30k",
        "bridgeEndpoint": "/api/routes/skyhunter-qiyan-2026-30k",
        "transport": "same_origin_bridge",
        "officialPage": "https://www.twttra.com/pages/26-skyhuntertrail",
        "bytes": 5145297,
        "edition": 2026,
        "availability": "verified_public"
      }
    ],
    "routeIds": [
      "skyhunter-qiyan-2026-4k",
      "skyhunter-qiyan-2026-13k",
      "skyhunter-qiyan-2026-6k",
      "skyhunter-qiyan-2026-30k"
    ],
    "notes": [
      "6K休閒／四人接力共用一份單圈原始GPX，起跑與限時分組不同；不串接成24K或增加接力路線數。",
      "30K原始檔有62個垂直跳點，計算及含站匯出仍阻擋；07:00／8小時與活動14:00結束衝突，未推算關門時刻。"
    ]
  },
  {
    "country": "台灣",
    "region": "Asia",
    "status": "announced",
    "gpxAvailability": "not_checked",
    "gpxDownloadUrl": null,
    "importability": "no_gpx",
    "routeIds": [],
    "cors": {
      "status": "not_tested",
      "evidence": "No original GPX bytes or browser route transport verified."
    },
    "license": {
      "redistribution": "not_verified",
      "evidence": "Minimal public event/course facts and official links only; no GPX bytes copied or mirrored."
    },
    "id": "tur-jinshuiying-2026",
    "name": "TUR 制霸浸水營",
    "year": 2026,
    "edition": 2026,
    "date": "2026-12-05",
    "dateStart": "2026-12-05",
    "dateEnd": "2026-12-05",
    "location": "枋寮火車站／大武車站",
    "officialPage": "https://800heroes.com/races/Fangliao-2026",
    "distanceLabels": [
      "115KM 制霸組",
      "53KM 挑戰-古道組(枋寮車站出發)",
      "62KM 挑戰-南迴組(大武車站出發)",
      "53KM 制霸團體組-古道組",
      "62KM 制霸團體組-南迴組"
    ],
    "metadata": {
      "verifiedAt": "2026-10-14T12:44:05Z",
      "source": "https://800heroes.com/races/Fangliao-2026",
      "dateEvidence": "Same-edition official event page explicitly displays this date. Web-reader evidence was obtained before the later ordinary anonymous GET403; crawl freshness and access caveat are retained separately.",
      "verificationLevel": "official_web_reader_checked_normal_http_blocked",
      "sourceType": "organizer_official_site",
      "eventDateScope": "event_date_not_shared_category_start",
      "webReaderCrawl": "today",
      "normalHttpCheckedAt": "2026-10-14T12:45:25.823470+00:00",
      "normalHttpStatus": 403
    },
    "routes": [
      {
        "name": "115KM 制霸組",
        "courseKey": "conquest115",
        "routePageUrl": "https://ridewithgps.com/routes/52465060",
        "officialPage": "https://800heroes.com/races/Fangliao-2026",
        "downloadKind": "organizer_linked_route_page",
        "gpxDownloadUrl": null
      },
      {
        "name": "53KM 古道（挑戰／團體共用）",
        "courseKey": "ancient53",
        "routePageUrl": "https://ridewithgps.com/routes/52465180",
        "officialPage": "https://800heroes.com/races/Fangliao-2026",
        "downloadKind": "organizer_linked_route_page",
        "gpxDownloadUrl": null
      },
      {
        "name": "62KM 南迴（挑戰／團體共用）",
        "courseKey": "south62",
        "routePageUrl": "https://ridewithgps.com/routes/52465002",
        "officialPage": "https://800heroes.com/races/Fangliao-2026",
        "downloadKind": "organizer_linked_route_page",
        "gpxDownloadUrl": null
      }
    ],
    "publishedCategoryFacts": [
      {
        "name": "制霸組",
        "nominalDistanceKm": 115,
        "nominalAscentM": 2912,
        "startClock": "04:00",
        "finishCutoffClock": "20:30",
        "courseKey": "conquest115",
        "sourceUrl": "https://800heroes.com/races/Fangliao-2026",
        "timezone": "Asia/Taipei",
        "timingStatus": "published_category_clocks_not_planner_mapping"
      },
      {
        "name": "挑戰-古道組(枋寮車站出發)",
        "nominalDistanceKm": 53,
        "nominalAscentM": 1984,
        "startClock": "05:00",
        "finishCutoffClock": "15:00",
        "courseKey": "ancient53",
        "sourceUrl": "https://800heroes.com/races/Fangliao-2026",
        "timezone": "Asia/Taipei",
        "timingStatus": "published_category_clocks_not_planner_mapping"
      },
      {
        "name": "挑戰-南迴組(大武車站出發)",
        "nominalDistanceKm": 62,
        "nominalAscentM": 972,
        "startClock": "11:30",
        "finishCutoffClock": "20:30",
        "courseKey": "south62",
        "sourceUrl": "https://800heroes.com/races/Fangliao-2026",
        "timezone": "Asia/Taipei",
        "timingStatus": "published_category_clocks_not_planner_mapping"
      },
      {
        "name": "制霸團體組-古道組",
        "nominalDistanceKm": 53,
        "nominalAscentM": 1984,
        "startClock": "04:00",
        "finishCutoffClock": "15:00",
        "courseKey": "ancient53",
        "sourceUrl": "https://800heroes.com/races/Fangliao-2026",
        "timezone": "Asia/Taipei",
        "timingStatus": "published_category_clocks_not_planner_mapping"
      },
      {
        "name": "制霸團體組-南迴組",
        "nominalDistanceKm": 62,
        "nominalAscentM": 972,
        "startClock": "11:30",
        "finishCutoffClock": "20:30",
        "courseKey": "south62",
        "sourceUrl": "https://800heroes.com/races/Fangliao-2026",
        "timezone": "Asia/Taipei",
        "timingStatus": "published_category_clocks_not_planner_mapping"
      }
    ],
    "officialCheckpointStatus": "not_announced",
    "officialCheckpointCount": null,
    "officialAidStationCount": null,
    "importabilityReason": "官方有路線頁；已檢查的53KM路線頁要求帳號匯出。尚未核得公開原始GPX，不能直接導入。",
    "notes": [
      "補給站路線尚未公告，站名、數量、座標與途中關門保持未核。",
      "官方提醒賽前7–10日重新下載最新路線；滾動路線頁不代表固定的最終賽日GPX。",
      "官方頁網頁工具可讀；普通匿名HTTP返回403，已停止，沒有登入或其他繞過。",
      "分類採各組具體資料；不以頁尾100／50KM模板或系列名稱推定路面比例。"
    ]
  },
  {
    "country": "台灣",
    "region": "Asia",
    "status": "announced",
    "gpxAvailability": "not_checked",
    "gpxDownloadUrl": null,
    "importability": "no_gpx",
    "routeIds": [],
    "cors": {
      "status": "not_tested",
      "evidence": "No original GPX bytes or browser route transport verified."
    },
    "license": {
      "redistribution": "not_verified",
      "evidence": "Minimal public event/course facts and official links only; no GPX bytes copied or mirrored."
    },
    "id": "tur-xuejian-2027",
    "name": "TUR 制霸雪見",
    "year": 2027,
    "edition": 2027,
    "date": "2027-01-17",
    "dateStart": "2027-01-17",
    "dateEnd": "2027-01-17",
    "location": "都瑪斯民宿",
    "officialPage": "https://800heroes.com/races/Xuejian-2027",
    "distanceLabels": [
      "100KM 制霸組",
      "54KM 挑戰組"
    ],
    "metadata": {
      "verifiedAt": "2026-10-14T12:44:05Z",
      "source": "https://800heroes.com/races/Xuejian-2027",
      "dateEvidence": "Same-edition official event page explicitly displays this date. Web-reader evidence was obtained before the later ordinary anonymous GET403; crawl freshness and access caveat are retained separately.",
      "verificationLevel": "official_web_reader_checked_normal_http_blocked",
      "sourceType": "organizer_official_site",
      "eventDateScope": "event_date_not_shared_category_start",
      "webReaderCrawl": "five_days_ago",
      "normalHttpCheckedAt": "2026-10-14T12:45:32.903193+00:00",
      "normalHttpStatus": 403
    },
    "routes": [
      {
        "name": "100KM 制霸組",
        "courseKey": "conquest100",
        "routePageUrl": "https://ridewithgps.com/routes/56804636",
        "officialPage": "https://800heroes.com/races/Xuejian-2027",
        "downloadKind": "organizer_linked_route_page",
        "gpxDownloadUrl": null
      },
      {
        "name": "54KM 挑戰組",
        "courseKey": "challenge54",
        "routePageUrl": "https://ridewithgps.com/routes/56804777",
        "officialPage": "https://800heroes.com/races/Xuejian-2027",
        "downloadKind": "organizer_linked_route_page",
        "gpxDownloadUrl": null
      }
    ],
    "publishedCategoryFacts": [
      {
        "name": "制霸組",
        "nominalDistanceKm": 100,
        "nominalAscentM": 3500,
        "startClock": "04:30",
        "finishCutoffClock": "21:00",
        "courseKey": "conquest100",
        "sourceUrl": "https://800heroes.com/races/Xuejian-2027",
        "timezone": "Asia/Taipei",
        "timingStatus": "published_category_clocks_not_planner_mapping"
      },
      {
        "name": "挑戰組",
        "nominalDistanceKm": 54,
        "nominalAscentM": 2142,
        "startClock": "04:30",
        "finishCutoffClock": "15:30",
        "courseKey": "challenge54",
        "sourceUrl": "https://800heroes.com/races/Xuejian-2027",
        "timezone": "Asia/Taipei",
        "timingStatus": "published_category_clocks_not_planner_mapping"
      }
    ],
    "officialCheckpointStatus": "not_announced",
    "officialCheckpointCount": null,
    "officialAidStationCount": null,
    "importabilityReason": "官方有路線頁；已檢查的54KM路線頁要求帳號匯出。尚未核得公開原始GPX，不能直接導入。",
    "notes": [
      "補給站路線尚未公告，站名、數量、座標與途中關門保持未核。",
      "官方提醒賽前7–10日重新下載最新路線；滾動路線頁不代表固定的最終賽日GPX。",
      "官方頁網頁工具可讀；普通匿名HTTP返回403，已停止，沒有登入或其他繞過。",
      "分類採各組具體資料；不以頁尾100／50KM模板或系列名稱推定路面比例。"
    ]
  },
  {
    "id": "runningstream-dadu-2026",
    "name": "Trail M.t Dadu 大肚山越野",
    "country": "台灣",
    "region": "Asia",
    "year": 2026,
    "edition": 2026,
    "date": "2026-02-01",
    "dateStart": "2026-02-01",
    "dateEnd": "2026-02-01",
    "status": "past",
    "officialPage": "https://www.runningstream.run/tmd/t-m-d-course/t-m-d-12k",
    "metadata": {
      "verifiedAt": "2026-10-15T01:59:18Z",
      "source": "https://www.runningstream.run/tmd/t-m-d-course/t-m-d-12k",
      "verificationLevel": "official_gpx_link_and_secondary_corroborated_date",
      "dateEvidence": "2026/2/1由運動筆記採訪主辦的日程與平台賽事頁交叉佐證；未取得當下可讀官方簡章日期。",
      "dateEvidenceSource": "https://running.biji.co/index.php?act=info&id=113405&q=news",
      "eventDateScope": "reported_event_date_not_verified_group_start_time"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "verified_public",
    "importability": "bridge_verified",
    "importabilityReason": "12K官方原始GPX可讀取與保真下載；原檔23處垂直跳點阻擋計算。其他組別尚未核得可導入原檔。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Retained2026 organizer page publicly links this exact GPX. Exact anonymous Drive wrapper, observed same-host303 and final200 bytes checked. Existing visitor-triggered transient personal analysis only; no storage, mirror or general redistribution licence. Current ordinary course-page GET404 is recorded separately from the preserved official-reader evidence; no denial workaround."
    },
    "cors": {
      "status": "not_tested",
      "evidence": "Normal server GET observesCORS*; no native-browser qualification. Existing fixed bridge used."
    },
    "routes": [
      {
        "routeId": "runningstream-dadu-2026-12k",
        "name": "12K（原檔待處理）",
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=1UGvSAdhVVpmE6VROjhOdXGLW_kLb8wN6&export=download",
        "officialPage": "https://www.runningstream.run/tmd/t-m-d-course/t-m-d-12k",
        "sha256": "5d8eb4265ca601da9240ccc65b1d71f05b1f797b43c0200ef87b0fc095a8aa6e",
        "bytes": 716808,
        "edition": 2026,
        "availability": "verified_public",
        "transport": "same_origin_bridge",
        "downloadKind": "verified_bridge_endpoint",
        "bridgeSourceId": "runningstream-dadu-2026-12k",
        "bridgeEndpoint": "/api/routes/runningstream-dadu-2026-12k",
        "originalDownloadUrl": "https://drive.google.com/file/d/1UGvSAdhVVpmE6VROjhOdXGLW_kLb8wN6/view?usp=drive_link",
        "nominalDistanceKm": 12,
        "validation": {
          "bytes": 716808,
          "rawPoints": 8285,
          "model": "blocked_original_vertical_jumps"
        }
      }
    ],
    "routeIds": [
      "runningstream-dadu-2026-12k"
    ],
    "notes": [
      "官方GPX連結以2026 12K標示；沒有以檔案建立年份推定屆別。",
      "CP1官表6km、終點12.8km；位置、停留與截止未知。",
      "原始8285點保留，沒有去重、補高程或平坦化以迎合模型。",
      "官方課程頁reader歷史內容可讀，但當下普通HTTP404；保留兩層證據。",
      "4K/18K/30K只是其他公布組別，不列作已接通來源。"
    ]
  },
  {
    "id": "formosa-xtri-2026",
    "name": "Formosa Xtreme Triathlon（三鐵跑步段）",
    "country": "台灣",
    "region": "Asia",
    "eventType": "triathlon_run_leg",
    "year": 2026,
    "edition": 2026,
    "date": "2026-11-13",
    "dateStart": "2026-11-13",
    "dateEnd": "2026-11-13",
    "status": "announced",
    "officialPage": "https://formosaxtri.com/",
    "metadata": {
      "verifiedAt": "2026-10-15T02:34:00Z",
      "source": "https://formosaxtri.com/",
      "verificationLevel": "official_run_gpx_original_and_current_model_domain_checked",
      "eventDateScope": "announced_triathlon_date_individual_run_start_unknown"
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "verified_public",
    "importability": "bridge_verified",
    "importabilityReason": "官方RUN原始GPX已核；僅跑步段可作指定目標配速分配，不含泳段、自行車或全程三鐵能力預測。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Official2026 homepage links the RUN GPX separately from BIKE. Exact anonymous public Drive wrapper, observed same-host303 and final200 original verified. Existing visitor-triggered transient personal analysis only; no raw storage/mirror or general redistribution licence. No credentials or denied-content workaround."
    },
    "cors": {
      "status": "not_tested",
      "evidence": "Server GET observesCORS*; native-browser not qualified. Existing same-origin fixed bridge."
    },
    "routes": [
      {
        "routeId": "formosa-xtri-2026-run-42k",
        "name": "三鐵跑步段42K",
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=1wa0mx_RxR4tOB1spF0Ld3iLG9lVXBIhe&export=download",
        "officialPage": "https://formosaxtri.com/",
        "sha256": "83ab5c4a139c1a1bfa0c3a08393f922e2847d9f43583aa2706a2592348a52cda",
        "bytes": 137874,
        "edition": 2026,
        "availability": "verified_public",
        "transport": "same_origin_bridge",
        "downloadKind": "verified_bridge_endpoint",
        "bridgeSourceId": "formosa-xtri-2026-run-42k",
        "bridgeEndpoint": "/api/routes/formosa-xtri-2026-run-42k",
        "originalDownloadUrl": "https://drive.google.com/file/d/1wa0mx_RxR4tOB1spF0Ld3iLG9lVXBIhe/view?usp=sharing",
        "nominalDistanceKm": 42,
        "validation": {
          "bytes": 137874,
          "rawPoints": 1468,
          "model": "current_goal_grade_domain_in_domain",
          "accuracyValidated": false
        }
      }
    ],
    "routeIds": [
      "formosa-xtri-2026-run-42k"
    ],
    "notes": [
      "僅2026官方RUN路段，不是Formosa Trail，也不是完整242km三鐵路線。",
      "需自填個別T2實際出發時刻；未以泳段起跑或自行車截止推算。",
      "官方截止表仍為更新中的參考資料，未作確定站點、位置或elapsed cutoff。",
      "原始無WPT，官方補站數未知；沒有當成零站。",
      "模型通域僅表示現有數值條件可計算，未證明三鐵後段能力或配速準確度。"
    ]
  },
  {
    "id": "aa-maokong-2027",
    "name": "Action Asia X-Trail Taiwan 貓空",
    "country": "台灣",
    "region": "Asia",
    "year": 2027,
    "edition": 2027,
    "date": null,
    "dateStart": null,
    "dateEnd": null,
    "dateStatus": "conflict",
    "dateEvidence": {
      "schema": "catalog-date-evidence/1",
      "sourceUrls": [
        "https://actionasiaevents.com/2027-action-asia-x-trail-taiwan/"
      ],
      "candidateDays": [
        "2027-03-21",
        "2027-03-14"
      ],
      "checkedAt": "2026-10-15T02:56:19Z",
      "note": "主標題與日程為03/21，費用段為03/14；尚未核定賽日，不由起跑原文推定日期。"
    },
    "status": "announced",
    "location": "台北市貓空",
    "distanceLabels": [
      "25K",
      "18K",
      "10K"
    ],
    "officialPage": "https://actionasiaevents.com/2027-action-asia-x-trail-taiwan/",
    "metadata": {
      "verifiedAt": "2026-10-15T02:56:19Z",
      "source": "https://actionasiaevents.com/2027-action-asia-x-trail-taiwan/",
      "dateEvidence": "主標題與日程03/21、費用段03/14衝突；未選定生效日期。",
      "verificationLevel": "official_source_checked",
      "sourceType": "organizer_official_site",
      "eventDateScope": "date_conflict_no_operative_start_clocks"
    },
    "gpxAvailability": "verified_public",
    "cors": {
      "status": "not_tested",
      "evidence": "原檔匿名讀取與離線橋接身份已核對；未驗證瀏覽器跨站CORS或此候選實際部署。"
    },
    "license": {
      "redistribution": "not_verified",
      "evidence": "公開GPX下載鏈已核對；未建立一般再散布授權。僅使用者主動、暫態個人分析，不鏡像或保存第三方原檔。"
    },
    "routes": [
      {
        "name": "25K",
        "officialPage": "https://actionasiaevents.com/2027-action-asia-x-trail-taiwan/",
        "gpxDownloadUrl": "https://actionasiaevents.com/wp-content/uploads/2026/09/Action-Asia-X-Trail-Maokong-Taipei-25km-newcp3.gpx",
        "originalDownloadUrl": "https://actionasiaevents.com/wp-content/uploads/2026/09/Action-Asia-X-Trail-Maokong-Taipei-25km-newcp3.gpx",
        "availability": "verified_public",
        "validation": {
          "httpStatus": 200,
          "contentType": "application/gpx+xml",
          "trackpoints": 1225,
          "elevationPoints": 1225,
          "bytes": 113962,
          "checkedAt": "2026-10-15T02:56:19Z"
        },
        "routeId": "aa-maokong-2027-25k",
        "transport": "same_origin_bridge",
        "bridgeSourceId": "aa-maokong-2027-25k",
        "bridgeEndpoint": "/api/routes/aa-maokong-2027-25k",
        "edition": 2027,
        "sha256": "ac78b0fbea5814dc1f4a6ed353a8682f0a483be9419ea1228b4459c5472c401b",
        "bytes": 113962,
        "downloadKind": "verified_bridge_endpoint",
        "nominalDistanceKm": 25
      },
      {
        "name": "18K",
        "officialPage": "https://actionasiaevents.com/2027-action-asia-x-trail-taiwan/",
        "gpxDownloadUrl": "https://actionasiaevents.com/wp-content/uploads/2026/09/18kmAction-Asia-X-Trail-Maokong-Taiwan-new18km-old-17.gpx",
        "originalDownloadUrl": "https://actionasiaevents.com/wp-content/uploads/2026/09/18kmAction-Asia-X-Trail-Maokong-Taiwan-new18km-old-17.gpx",
        "availability": "verified_public",
        "validation": {
          "httpStatus": 200,
          "contentType": "application/gpx+xml",
          "trackpoints": 964,
          "elevationPoints": 964,
          "bytes": 90461,
          "checkedAt": "2026-10-15T02:56:19Z"
        },
        "routeId": "aa-maokong-2027-18k",
        "transport": "same_origin_bridge",
        "bridgeSourceId": "aa-maokong-2027-18k",
        "bridgeEndpoint": "/api/routes/aa-maokong-2027-18k",
        "edition": 2027,
        "sha256": "52f795d42116f980165aaeb70930745da7264c65780eefe6b129c0f08a13b452",
        "bytes": 90461,
        "downloadKind": "verified_bridge_endpoint",
        "nominalDistanceKm": 18
      },
      {
        "name": "10K",
        "officialPage": "https://actionasiaevents.com/2027-action-asia-x-trail-taiwan/",
        "gpxDownloadUrl": "https://actionasiaevents.com/wp-content/uploads/2026/09/Action-Asia-X-Trail-Maokong-Taiwan-new10k-old9km.gpx",
        "originalDownloadUrl": "https://actionasiaevents.com/wp-content/uploads/2026/09/Action-Asia-X-Trail-Maokong-Taiwan-new10k-old9km.gpx",
        "availability": "verified_public",
        "validation": {
          "httpStatus": 200,
          "contentType": "application/gpx+xml",
          "trackpoints": 565,
          "elevationPoints": 565,
          "bytes": 53627,
          "checkedAt": "2026-10-15T02:56:19Z"
        },
        "routeId": "aa-maokong-2027-10k",
        "transport": "same_origin_bridge",
        "bridgeSourceId": "aa-maokong-2027-10k",
        "bridgeEndpoint": "/api/routes/aa-maokong-2027-10k",
        "edition": 2027,
        "sha256": "e57423702bef8a97d18892d96216592e5cbbd1e52b8e7233d6dffcdd4bd8a412",
        "bytes": 53627,
        "downloadKind": "verified_bridge_endpoint",
        "nominalDistanceKm": 10
      }
    ],
    "routeIds": [
      "aa-maokong-2027-25k",
      "aa-maokong-2027-18k",
      "aa-maokong-2027-10k"
    ],
    "notes": [
      "25K／18K／10K分別保留固定官方下載及同站橋接入口，原始檔名不作屆別推定。",
      "三路線皆可讀取，但普通模型仍因grade_out_of_domain拒絕；未宣稱可完整預測。",
      "官方站表僅保留公布公里、名稱與Cut-off原文；未自動定位、加入停留或推定絕對關門。",
      "日期待核；2027屆別由本屆官方下載頁確認，並非由上傳年月或舊檔名推定。"
    ],
    "importability": "bridge_verified",
    "importabilityReason": "25K／18K／10K可導入檢視與官方下載；陡坡、賽日與補站位置限制保留。",
    "gpxSourcePage": "https://actionasiaevents.com/2027-action-asia-x-trail-taiwan/"
  }
,
  {
    "id": "galerdo-trail-carnival-2025",
    "name": "Galerdo 卡洛動越野嘉年華",
    "country": "台灣",
    "region": "Asia",
    "year": 2025,
    "edition": 2025,
    "date": "2025-06-14",
    "dateStart": "2025-06-14",
    "dateEnd": "2025-06-14",
    "status": "past",
    "location": "新北市瑞芳區金瓜石",
    "distanceLabels": [
      "7.6K活力組",
      "18K菁英組"
    ],
    "officialPage": "https://www.galerdo.net/post/%E5%8D%A1%E6%B4%9B%E5%8B%95%E5%98%89%E5%B9%B4%E8%8F%AF%E9%81%B8%E6%89%8B%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A0%85%E6%89%8B%E5%86%8A",
    "metadata": {
      "verifiedAt": "2026-10-15T12:18:55.795Z",
      "source": "https://www.galerdo.net/post/%E5%8D%A1%E6%B4%9B%E5%8B%95%E5%98%89%E5%B9%B4%E8%8F%AF%E9%81%B8%E6%89%8B%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A0%85%E6%89%8B%E5%86%8A",
      "dateEvidence": "2025-06-04官方選手手冊明列2025-06-14活動日期，並分別連結7.6K及18K GPX。",
      "verificationLevel": "official_source_checked",
      "sourceType": "organizer_official_site",
      "eventDateScope": "historical_event_date_current_linked_file_revision_not_final_race_day_proof"
    },
    "gpxAvailability": "verified_public",
    "cors": {
      "status": "not_tested",
      "evidence": "正常匿名官方鏈與原檔HTTP200已核對；瀏覽器跨站CORS未測，使用固定同站橋接。"
    },
    "license": {
      "redistribution": "not_verified",
      "evidence": "僅使用者主動暫態個人分析；未宣稱一般再散布授權，不鏡像GPX。"
    },
    "routes": [
      {
        "name": "7.6K活力組（2025現提供8km更新檔）",
        "officialPage": "https://www.galerdo.net/post/%E5%8D%A1%E6%B4%9B%E5%8B%95%E5%98%89%E5%B9%B4%E8%8F%AF%E9%81%B8%E6%89%8B%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A0%85%E6%89%8B%E5%86%8A",
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=1spe3MaBHvuNOpms6qaMxUYNDRXHoDhIw&export=download",
        "originalDownloadUrl": "https://drive.google.com/file/d/1spe3MaBHvuNOpms6qaMxUYNDRXHoDhIw/view?usp=sharing",
        "originalOfficialDownloadEntry": "https://www.galerdo.net/post/%E5%8D%A1%E6%B4%9B%E5%8B%95%E5%98%89%E5%B9%B4%E8%8F%AF%E9%81%B8%E6%89%8B%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A0%85%E6%89%8B%E5%86%8A",
        "officialDownloadPageUrl": "https://www.galerdo.net/post/%E5%8D%A1%E6%B4%9B%E5%8B%95%E5%98%89%E5%B9%B4%E8%8F%AF%E9%81%B8%E6%89%8B%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A0%85%E6%89%8B%E5%86%8A",
        "availability": "verified_public",
        "validation": {
          "httpStatus": 200,
          "contentType": "application/octet-stream",
          "routepoints": 496,
          "waypoints": 17,
          "bytes": 51895,
          "checkedAt": "2026-10-15T12:18:47.545742+00:00"
        },
        "routeId": "galerdo-trail-carnival-2025-7p6k",
        "transport": "same_origin_bridge",
        "bridgeSourceId": "galerdo-trail-carnival-2025-7p6k",
        "bridgeEndpoint": "/api/routes/galerdo-trail-carnival-2025-7p6k",
        "edition": 2025,
        "sha256": "5a8752665feffe95940b9d637cb7bfa22ed67e1c0c2799122a6cded1e6f2e0f0",
        "bytes": 51895,
        "downloadKind": "verified_bridge_endpoint",
        "nominalDistanceKm": 7.6
      },
      {
        "name": "18K菁英組（2025現提供檔）",
        "officialPage": "https://www.galerdo.net/post/%E5%8D%A1%E6%B4%9B%E5%8B%95%E5%98%89%E5%B9%B4%E8%8F%AF%E9%81%B8%E6%89%8B%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A0%85%E6%89%8B%E5%86%8A",
        "gpxDownloadUrl": "https://drive.usercontent.google.com/download?id=1H04CyUCQcf7waZcX8zFBtu-QS_FGq2h4&export=download",
        "originalDownloadUrl": "https://drive.google.com/file/d/1H04CyUCQcf7waZcX8zFBtu-QS_FGq2h4/view?usp=sharing",
        "originalOfficialDownloadEntry": "https://www.galerdo.net/post/%E5%8D%A1%E6%B4%9B%E5%8B%95%E5%98%89%E5%B9%B4%E8%8F%AF%E9%81%B8%E6%89%8B%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A0%85%E6%89%8B%E5%86%8A",
        "officialDownloadPageUrl": "https://www.galerdo.net/post/%E5%8D%A1%E6%B4%9B%E5%8B%95%E5%98%89%E5%B9%B4%E8%8F%AF%E9%81%B8%E6%89%8B%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A0%85%E6%89%8B%E5%86%8A",
        "availability": "verified_public",
        "validation": {
          "httpStatus": 200,
          "contentType": "application/octet-stream",
          "routepoints": 898,
          "waypoints": 31,
          "bytes": 93189,
          "checkedAt": "2026-10-15T12:18:55.795717+00:00"
        },
        "routeId": "galerdo-trail-carnival-2025-18k",
        "transport": "same_origin_bridge",
        "bridgeSourceId": "galerdo-trail-carnival-2025-18k",
        "bridgeEndpoint": "/api/routes/galerdo-trail-carnival-2025-18k",
        "edition": 2025,
        "sha256": "2307e754c835f93915187886221b3ddc3549a931e3790d952b79f9ebf318c339",
        "bytes": 93189,
        "downloadKind": "verified_bridge_endpoint",
        "nominalDistanceKm": 18
      }
    ],
    "routeIds": [
      "galerdo-trail-carnival-2025-7p6k",
      "galerdo-trail-carnival-2025-18k"
    ],
    "notes": [
      "2025官方手冊目前提供的兩份檔案；不保證為賽日最終版，不與2026/27屆別合併。",
      "7.6K活力組仍保留官方7.6K／500m；目前原檔名8km更新，計算幾何另列。",
      "原生航點為觀光地標資料，官方CP完整表、服務、關門及停留仍未知。",
      "兩份GPX逐點規劃時間不作真實成績或能力參考。",
      "另有定向越野；此處只提供兩條固定越野路線。雙人最後完賽者計時不代表接力或串接兩圈。"
    ],
    "importability": "bridge_verified",
    "importabilityReason": "可導入2025官方目前提供檔及下載原檔；普通模型仍因陡坡拒絕。",
    "gpxSourcePage": "https://www.galerdo.net/post/%E5%8D%A1%E6%B4%9B%E5%8B%95%E5%98%89%E5%B9%B4%E8%8F%AF%E9%81%B8%E6%89%8B%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A0%85%E6%89%8B%E5%86%8A",
    "officialDownloadPageUrl": "https://www.galerdo.net/post/%E5%8D%A1%E6%B4%9B%E5%8B%95%E5%98%89%E5%B9%B4%E8%8F%AF%E9%81%B8%E6%89%8B%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A0%85%E6%89%8B%E5%86%8A"
  }
,
{
  "id": "taoyuan-half-marathon-2023",
  "name": "桃園半程馬拉松暨12K輕越野（2023）",
  "country": "台灣",
  "region": "Asia",
  "year": 2023,
  "edition": 2023,
  "date": "2023-12-23",
  "dateStart": "2023-12-23",
  "dateEnd": "2023-12-23",
  "status": "past",
  "officialPage": "https://lohasnet.tw/Taoyuan2023/",
  "metadata": {
    "verifiedAt": "2026-10-15T12:56:09.499053+00:00",
    "source": "https://lohasnet.tw/Taoyuan2023/",
    "dateEvidence": "2023官方活動頁明列2023-12-23；目前所連結GPX為1221版本。",
    "verificationLevel": "official_source_and_exact_original_checked",
    "eventDateScope": "historical_event_date_current_file_revision_not_final_race_day_proof"
  },
  "distanceLabels": [
    "12K輕越野挑戰組"
  ],
  "gpxDownloadUrl": null,
  "gpxAvailability": "official_download_link_verified",
  "cors": {
    "status": "not_tested",
    "evidence": "This source adds no automatic cross-site or server fetch. User opens the official download entry and selects a local file."
  },
  "license": {
    "redistribution": "not_verified",
    "evidence": "Organizer-linked public original and exact private source pins. Official links and user-selected local-file analysis only; no new automated upstream fetch or server registration. Googleusercontent robots Disallow:/ and provider terms boundary are retained; no redistribution licence or automation exception claimed."
  },
  "routes": [
    {
      "name": "12K輕越野挑戰組（2023現提供1221版本）",
      "gpxDownloadUrl": "https://drive.google.com/file/d/1Pxh0t3EYKXp-si4FvpLi7VtIuZy-uVIx/view?usp=drivesdk",
      "downloadKind": "google_drive_file_page",
      "officialPage": "https://lohasnet.tw/Taoyuan2023/",
      "routePageUrl": "https://lohasnet.tw/Taoyuan2023/"
    }
  ],
  "routeIds": [],
  "notes": [
    "只納入12K輕越野挑戰組，不含同賽事21K公路組或4K體驗組。",
    "目前官方連結為1221版本；賽日最終修訂與英文手冊地圖是否一致仍待核。",
    "原檔無WPT不代表無補站；官方完整站表、位置、服務、停留及截止待核。",
    "GPX逐點時間是來源規劃註記，不作比賽成績、訓練活動或能力依據。",
    "下載後上傳原檔，即可辨識此版本；修改過的檔案需另行確認。"
  ],
  "importability": "download_only",
  "importabilityReason": "開啟官方原檔入口下載後上傳；精確原檔可辨識2023版本，本來源不提供自動抓取。",
  "gpxSourcePage": "https://lohasnet.tw/Taoyuan2023/",
  "officialDownloadPageUrl": "https://lohasnet.tw/Taoyuan2023/"
},
{
  "id": "gold-trail-2026",
  "name": "淘金越野 GOLD TRAIL",
  "country": "台灣",
  "region": "Asia",
  "year": 2026,
  "edition": 2026,
  "date": "2026-09-20",
  "dateStart": "2026-09-20",
  "dateEnd": "2026-09-20",
  "status": "past",
  "officialPage": "https://www.4come.com/blogs/gold-trail-%E6%B7%98%E9%87%91%E8%B6%8A%E9%87%8E/2026-gold-rush-trail-run-athlete-guide",
  "metadata": {
    "verifiedAt": "2026-10-15T13:24:30.944285+00:00",
    "source": "https://www.4come.com/blogs/gold-trail-%E6%B7%98%E9%87%91%E8%B6%8A%E9%87%8E/2026-gold-rush-trail-run-athlete-guide",
    "dateEvidence": "2026官方電子手冊第8頁明列2026/9/20；不以GPX檔案日期推定賽日。",
    "verificationLevel": "official_handbook_and_exact_original_checked",
    "eventDateScope": "event_day_not_all_group_start_times"
  },
  "distanceLabels": [
    "GT20K 越野挑戰組",
    "GT30K 越野競賽組",
    "GT10K 定向越野組"
  ],
  "gpxDownloadUrl": null,
  "gpxAvailability": "official_download_page_verified",
  "gpxLinkType": "official_download_page",
  "cors": {
    "status": "not_tested",
    "evidence": "Official links and user-selected local originals only; no new browser fetch or automated upstream relay."
  },
  "license": {
    "redistribution": "not_verified",
    "evidence": "Official organizer-linked public download entry and user-selected local-file analysis only. COROS Terms section4 restricts automated access without express written permission; no new upstream fetch, server registration, storage, mirror or redistribution licence is claimed."
  },
  "routes": [
    {
      "name": "GT20K（現提供0928版本）",
      "gpxDownloadUrl": "https://api.coros.com/coros/data/share-track/v1?regionId=1&id=470329909552840704",
      "officialPage": "https://www.4come.com/blogs/gold-trail-%E6%B7%98%E9%87%91%E8%B6%8A%E9%87%8E/2026-gold-rush-trail-run-athlete-guide"
    },
    {
      "name": "GT30K",
      "gpxDownloadUrl": "https://api.coros.com/coros/data/share-track?regionId=1&id=480028770909257728",
      "officialPage": "https://www.4come.com/blogs/gold-trail-%E6%B7%98%E9%87%91%E8%B6%8A%E9%87%8E/2026-gold-rush-trail-run-athlete-guide"
    }
  ],
  "routeIds": [],
  "notes": [
    "GT10K為定向組，未取得或推定GPX。",
    "精確原檔上傳可辨識；修改後檔案不自動取得官方身份。"
  ],
  "importability": "download_only",
  "importabilityReason": "開啟官方入口下載後上傳，即可辨識已查核的原檔版本。",
  "gpxSourcePage": "https://www.4come.com/blogs/gold-trail-%E6%B7%98%E9%87%91%E8%B6%8A%E9%87%8E/2026-gold-rush-trail-run-athlete-guide"
},
{
    "id": "trail-far-far-away-2025",
    "name": "越野・發發爾衛 Trail Far Far Away",
    "country": "台灣",
    "region": "Asia",
    "year": 2025,
    "edition": 2025,
    "date": "2025-03-01 / 2025-03-02",
    "dateStart": "2025-03-01",
    "dateEnd": "2025-03-02",
    "status": "past",
    "officialPage": "https://www.ctau.org.tw/%E8%B3%BD%E4%BA%8B%E8%88%87%E8%A8%93%E7%B7%B4/%E8%B3%BD%E4%BA%8B%E8%A1%8C%E4%BA%8B%E6%9B%86/%E5%9C%8B%E5%85%A7%E8%B3%BD%E4%BA%8B%E8%A1%8C%E4%BA%8B%E6%9B%86/",
    "metadata": {
      "verifiedAt": "2026-10-15T15:24:00Z",
      "source": "https://www.ctau.org.tw/%E8%B3%BD%E4%BA%8B%E8%88%87%E8%A8%93%E7%B7%B4/%E8%B3%BD%E4%BA%8B%E8%A1%8C%E4%BA%8B%E6%9B%86/%E5%9C%8B%E5%85%A7%E8%B3%BD%E4%BA%8B%E8%A1%8C%E4%BA%8B%E6%9B%86/",
      "verificationLevel": "official_calendar_checked",
      "eventDateScope": "event_period_not_all_distance_start_times",
      "dateEvidence": "CTAU2025 calendar explicitly lists March1–2 and three participation labels; no distances inferred."
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "CTAU 行事曆列三組，完整組別與里程待核；本屆 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Minimal public event facts only; no GPX download, reuse or redistribution permission established."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "distanceLabels": [
      "Far Far Away 組",
      "Far Away 組",
      "Vertical 坡津加登高賽"
    ]
  },
  {
    "id": "donut-2025",
    "name": "火炎山甜甜圈賽",
    "country": "台灣",
    "region": "Asia",
    "year": 2025,
    "edition": 2025,
    "date": "2025-03-22",
    "dateStart": "2025-03-22",
    "dateEnd": "2025-03-22",
    "status": "past",
    "officialPage": "https://www.ctau.org.tw/%E8%B3%BD%E4%BA%8B%E8%88%87%E8%A8%93%E7%B7%B4/%E8%B3%BD%E4%BA%8B%E8%A1%8C%E4%BA%8B%E6%9B%86/%E5%9C%8B%E5%85%A7%E8%B3%BD%E4%BA%8B%E8%A1%8C%E4%BA%8B%E6%9B%86/",
    "metadata": {
      "verifiedAt": "2026-10-15T15:24:00Z",
      "source": "https://www.ctau.org.tw/%E8%B3%BD%E4%BA%8B%E8%88%87%E8%A8%93%E7%B7%B4/%E8%B3%BD%E4%BA%8B%E8%A1%8C%E4%BA%8B%E6%9B%86/%E5%9C%8B%E5%85%A7%E8%B3%BD%E4%BA%8B%E8%A1%8C%E4%BA%8B%E6%9B%86/",
      "verificationLevel": "official_calendar_checked",
      "eventDateScope": "event_period_not_all_distance_start_times",
      "dateEvidence": "CTAU2025 calendar explicitly lists March22 andVertical火炎山登高賽."
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "僅核實 2025 行事曆的登高賽；本屆 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Minimal public event facts only; no GPX download, reuse or redistribution permission established."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "distanceLabels": [
      "Vertical 火炎山登高賽（2025 世錦賽遴選）"
    ]
  },
  {
    "id": "aa-maokong-2025",
    "name": "Action Asia X-Trail Maokong 貓空",
    "country": "台灣",
    "region": "Asia",
    "year": 2025,
    "edition": 2025,
    "date": "2025-03-08",
    "dateStart": "2025-03-08",
    "dateEnd": "2025-03-08",
    "status": "past",
    "officialPage": "https://www.actionasiaevents.com/assets/images/Events/Overseas_Taiwan/2025/Taiwan%20top5_V5.pdf",
    "metadata": {
      "verifiedAt": "2026-10-15T15:24:00Z",
      "source": "https://www.actionasiaevents.com/assets/images/Events/Overseas_Taiwan/2025/Taiwan%209km_fullresult.pdf",
      "verificationLevel": "cached_official_results_index_only_current_9km_source_unavailable",
      "eventDateScope": "event_period_not_all_distance_start_times",
      "supportingSources": [
        "https://www.actionasiaevents.com/assets/images/Events/Overseas_Taiwan/2025/Taiwan%20top5.pdf",
        "https://www.actionasiaevents.com/assets/images/Events/Overseas_Taiwan/2025/Taiwan%209km_fullresult.pdf"
      ],
      "groupCompleteness": "not_established",
      "sourceAccess": {
        "entryStatus": 301,
        "observedRedirectStatus": 404,
        "checkedAt": "2026-10-15T15:45:03.214463+00:00",
        "qualification": "Exact9km file is currently unreadable; no PDF body acquired."
      },
      "historicalSourceQualification": "Retained official-result search indexing identifiesMarch8,2025 and25/9km. Same top5 URL also indexes17km; combined sections versus stale indexing is unresolved, and no group replacement is inferred."
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "歷史官表索引列 25／9km，完整組別待核；9km 來源目前無法讀取。本屆 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Minimal public event facts only; no GPX download, reuse or redistribution permission established."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "distanceLabels": [
      "25km Individual（歷史官表索引）",
      "9km Individual（歷史官表索引）"
    ],
    "distanceSources": [
      {
        "name": "25km Individual",
        "distanceKm": 25,
        "officialPage": "https://www.actionasiaevents.com/assets/images/Events/Overseas_Taiwan/2025/Taiwan%20top5_V5.pdf"
      },
      {
        "name": "9km Individual",
        "distanceKm": 9,
        "officialPage": "https://www.actionasiaevents.com/assets/images/Events/Overseas_Taiwan/2025/Taiwan%209km_fullresult.pdf"
      }
    ]
  },
  {
    "id": "fongshan-2025",
    "name": "鳳山跑三校越野馬拉松",
    "country": "台灣",
    "region": "Asia",
    "year": 2025,
    "edition": 2025,
    "date": "2025-03-16",
    "dateStart": "2025-03-16",
    "dateEnd": "2025-03-16",
    "status": "past",
    "officialPage": "https://www.joinnow.com.tw/about.php?cnt_id=105&type=1",
    "metadata": {
      "verifiedAt": "2026-10-15T15:24:00Z",
      "source": "https://www.joinnow.com.tw/about.php?cnt_id=105&type=1",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times",
      "surfaceEvidence": "Official42.195km and10km itineraries explicitly usePhoenixMountain tank paths.23km/3km are not established trail routes."
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "各組路面不同；本屆 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Minimal public event facts only; no GPX download, reuse or redistribution permission established."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "distanceLabels": [
      "驍勇善戰 42.195 公里組（含戰車步道）",
      "親愛精誠 23 公里組（路面待核）",
      "臨陣當先 10 公里組（含戰車步道）",
      "敦親睦鄰 3 公里組（校園體驗、無晶片）"
    ],
    "distanceSources": [
      {
        "name": "驍勇善戰 42.195 公里組（含戰車步道）",
        "distanceKm": 42.195,
        "officialPage": "https://www.joinnow.com.tw/about.php?cnt_id=105&type=1"
      },
      {
        "name": "親愛精誠 23 公里組（路面待核）",
        "distanceKm": 23,
        "officialPage": "https://www.joinnow.com.tw/about.php?cnt_id=105&type=1"
      },
      {
        "name": "臨陣當先 10 公里組（含戰車步道）",
        "distanceKm": 10,
        "officialPage": "https://www.joinnow.com.tw/about.php?cnt_id=105&type=1"
      },
      {
        "name": "敦親睦鄰 3 公里組（校園體驗、無晶片）",
        "distanceKm": 3,
        "officialPage": "https://www.joinnow.com.tw/about.php?cnt_id=105&type=1"
      }
    ]
  },
  {
    "id": "songhe-trail-2025",
    "name": "松鶴越野跑",
    "country": "台灣",
    "region": "Asia",
    "year": 2025,
    "edition": 2025,
    "date": "2025-05-18",
    "dateStart": "2025-05-18",
    "dateEnd": "2025-05-18",
    "status": "past",
    "officialPage": "https://irunner.biji.co/DTPwowSong2025",
    "metadata": {
      "verifiedAt": "2026-10-15T15:24:00Z",
      "source": "https://irunner.biji.co/DTPwowSong2025",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times",
      "groupQualification": "Official summary does not establish detailed group names or distances."
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "官方摘要未列完整組別與里程；本屆 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Minimal public event facts only; no GPX download, reuse or redistribution permission established."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": []
  },
  {
    "id": "tnf-taipei-2025",
    "name": "The North Face 100 臺北越野跑挑戰賽",
    "country": "台灣",
    "region": "Asia",
    "year": 2025,
    "edition": 2025,
    "date": "2025-05-10 / 2025-05-11",
    "dateStart": "2025-05-10",
    "dateEnd": "2025-05-11",
    "status": "past",
    "officialPage": "https://www.bao-ming.com/eb/Upload/activity/6427-9f3d5224fdaad56426d937cb4a02e57b/activity_content/files/20250203-093253-e55de83d7107d22325ab79e1dda88b4d.pdf",
    "metadata": {
      "verifiedAt": "2026-10-15T15:24:00Z",
      "source": "https://running.biji.co/index.php?act=info&id=112146&label=22145&q=news&subtitle=%E3%80%90%E8%B3%BD%E4%BA%8B%E3%80%912025+TNF100+%E8%87%BA%E5%8C%97%E8%B6%8A%E9%87%8E%E8%B7%91%E6%8C%91%E6%88%B0%E8%B3%BD%E6%96%BC%E8%B2%A2%E5%AF%AE%E7%92%B0%E4%BF%9D%E5%85%AC%E5%9C%92%E8%B5%B7%E8%B7%91+%E6%B1%9F%E6%99%8F%E6%85%B6%E5%A5%AA+60K+%E7%B5%84%E5%86%A0%E8%BB%8D",
      "verificationLevel": "official_pdf_reader_and_brand_report_checked",
      "eventDateScope": "event_period_not_all_distance_start_times",
      "supportingSources": [
        "https://running.biji.co/index.php?act=info&id=112146&label=22145&q=news&subtitle=%E3%80%90%E8%B3%BD%E4%BA%8B%E3%80%912025+TNF100+%E8%87%BA%E5%8C%97%E8%B6%8A%E9%87%8E%E8%B7%91%E6%8C%91%E6%88%B0%E8%B3%BD%E6%96%BC%E8%B2%A2%E5%AF%AE%E7%92%B0%E4%BF%9D%E5%85%AC%E5%9C%92%E8%B5%B7%E8%B7%91+%E6%B1%9F%E6%99%8F%E6%85%B6%E5%A5%AA+60K+%E7%B5%84%E5%86%A0%E8%BB%8D"
      ],
      "categoryDistanceScope": "Advertised category labels are not final race-day distances; brand report identifies60Kindividual→42K and42Kindividual→21K."
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "因雨改線：60K／42K 個人組實跑 42K／21K；其餘最終路線與 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Minimal public event facts only; no GPX download, reuse or redistribution permission established."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "distanceLabels": [
      "賽前公告 60KM 個人",
      "賽前公告 60KM 雙人（各跑全程）",
      "賽前公告 42KM 個人",
      "賽前公告 42KM 雙人（各跑全程）",
      "15KM 個人（A/B 起跑波次）",
      "6KM 三人接力（每人一圈，非連續 18KM）",
      "TNF Kids 1.3KM"
    ],
    "publishedCategoryFacts": [
      {
        "name": "賽前公告 60KM 個人",
        "sourceUrl": "https://www.bao-ming.com/eb/Upload/activity/6427-9f3d5224fdaad56426d937cb4a02e57b/activity_content/files/20250203-093253-e55de83d7107d22325ab79e1dda88b4d.pdf",
        "qualification": "advertised_pre_race_format_not_final_geometry"
      },
      {
        "name": "賽前公告 60KM 雙人（各跑全程）",
        "sourceUrl": "https://www.bao-ming.com/eb/Upload/activity/6427-9f3d5224fdaad56426d937cb4a02e57b/activity_content/files/20250203-093253-e55de83d7107d22325ab79e1dda88b4d.pdf",
        "qualification": "advertised_pre_race_format_not_final_geometry"
      },
      {
        "name": "賽前公告 42KM 個人",
        "sourceUrl": "https://www.bao-ming.com/eb/Upload/activity/6427-9f3d5224fdaad56426d937cb4a02e57b/activity_content/files/20250203-093253-e55de83d7107d22325ab79e1dda88b4d.pdf",
        "qualification": "advertised_pre_race_format_not_final_geometry"
      },
      {
        "name": "賽前公告 42KM 雙人（各跑全程）",
        "sourceUrl": "https://www.bao-ming.com/eb/Upload/activity/6427-9f3d5224fdaad56426d937cb4a02e57b/activity_content/files/20250203-093253-e55de83d7107d22325ab79e1dda88b4d.pdf",
        "qualification": "advertised_pre_race_format_not_final_geometry"
      },
      {
        "name": "15KM 個人（A/B 起跑波次）",
        "sourceUrl": "https://www.bao-ming.com/eb/Upload/activity/6427-9f3d5224fdaad56426d937cb4a02e57b/activity_content/files/20250203-093253-e55de83d7107d22325ab79e1dda88b4d.pdf",
        "qualification": "advertised_pre_race_format_not_final_geometry"
      },
      {
        "name": "6KM 三人接力（每人一圈，非連續 18KM）",
        "sourceUrl": "https://www.bao-ming.com/eb/Upload/activity/6427-9f3d5224fdaad56426d937cb4a02e57b/activity_content/files/20250203-093253-e55de83d7107d22325ab79e1dda88b4d.pdf",
        "qualification": "advertised_pre_race_format_not_final_geometry"
      },
      {
        "name": "TNF Kids 1.3KM",
        "sourceUrl": "https://www.bao-ming.com/eb/Upload/activity/6427-9f3d5224fdaad56426d937cb4a02e57b/activity_content/files/20250203-093253-e55de83d7107d22325ab79e1dda88b4d.pdf",
        "qualification": "advertised_pre_race_format_not_final_geometry"
      }
    ],
    "reportedRaceDayFacts": [
      {
        "advertisedCategory": "60K individual",
        "reportedActualDistanceKm": 42,
        "sourceUrl": "https://running.biji.co/index.php?act=info&id=112146&label=22145&q=news&subtitle=%E3%80%90%E8%B3%BD%E4%BA%8B%E3%80%912025+TNF100+%E8%87%BA%E5%8C%97%E8%B6%8A%E9%87%8E%E8%B7%91%E6%8C%91%E6%88%B0%E8%B3%BD%E6%96%BC%E8%B2%A2%E5%AF%AE%E7%92%B0%E4%BF%9D%E5%85%AC%E5%9C%92%E8%B5%B7%E8%B7%91+%E6%B1%9F%E6%99%8F%E6%85%B6%E5%A5%AA+60K+%E7%B5%84%E5%86%A0%E8%BB%8D"
      },
      {
        "advertisedCategory": "42K individual",
        "reportedActualDistanceKm": 21,
        "sourceUrl": "https://running.biji.co/index.php?act=info&id=112146&label=22145&q=news&subtitle=%E3%80%90%E8%B3%BD%E4%BA%8B%E3%80%912025+TNF100+%E8%87%BA%E5%8C%97%E8%B6%8A%E9%87%8E%E8%B7%91%E6%8C%91%E6%88%B0%E8%B3%BD%E6%96%BC%E8%B2%A2%E5%AF%AE%E7%92%B0%E4%BF%9D%E5%85%AC%E5%9C%92%E8%B5%B7%E8%B7%91+%E6%B1%9F%E6%99%8F%E6%85%B6%E5%A5%AA+60K+%E7%B5%84%E5%86%A0%E8%BB%8D"
      }
    ]
  },
  {
    "id": "hehuanshan-2025",
    "name": "合歡山馬拉松",
    "country": "台灣",
    "region": "Asia",
    "year": 2025,
    "edition": 2025,
    "date": null,
    "dateStart": null,
    "dateEnd": null,
    "status": "past",
    "officialPage": "https://irunner.biji.co/2025Hehuanshan",
    "metadata": {
      "verifiedAt": "2026-10-15T15:24:00Z",
      "source": "https://irunner.biji.co/2025Hehuanshan?page=3666",
      "verificationLevel": "official_source_checked",
      "eventDateScope": "event_period_not_all_distance_start_times",
      "supportingSources": [
        "https://irunner.biji.co/2025Hehuanshan?page=3666"
      ]
    },
    "gpxDownloadUrl": null,
    "gpxAvailability": "not_checked",
    "importability": "no_gpx",
    "importabilityReason": "9/5 改期公告與 7 月舊簡章未一致；本屆 GPX 尚未核實。",
    "license": {
      "redistribution": "not_verified",
      "evidence": "Minimal public event facts only; no GPX download, reuse or redistribution permission established."
    },
    "cors": {
      "status": "not_tested",
      "evidence": null
    },
    "routes": [],
    "routeIds": [],
    "distanceLabels": [
      "超全馬 45.26K（山峰＋公路，定稿待核）",
      "超半馬 26K（公路型）",
      "健康 7.5K（公路型）"
    ],
    "dateStatus": "conflict",
    "dateEvidence": {
      "schema": "catalog-date-evidence/1",
      "sourceUrls": [
        "https://irunner.biji.co/2025Hehuanshan",
        "https://irunner.biji.co/2025Hehuanshan?page=3666"
      ],
      "candidateDays": [
        "2025-09-05",
        "2025-07-04"
      ],
      "checkedAt": "2026-10-15T15:24:00Z",
      "note": "Homepage revision saysSeptember5; detailed brief retainsJuly3/4schedule. Race-day date is not independently established; no operational clock is assigned."
    }
  },
{
  "id": "wufeng-trail-2025",
  "name": "五峰越野（2025）",
  "country": "台灣",
  "region": "Asia",
  "year": 2025,
  "edition": 2025,
  "date": "2025-10-26",
  "dateStart": "2025-10-26",
  "dateEnd": "2025-10-26",
  "status": "past",
  "officialPage": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
  "metadata": {
    "verifiedAt": "2026-10-16T00:13:00Z",
    "source": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
    "dateEvidence": "Exact official edition page and organizer race index explicitly give this date. Public source facts only; final race-day revision is not established.",
    "verificationLevel": "official_source_checked",
    "eventDateScope": "event_period_not_all_distance_start_times",
    "sourceSha256": "ef94f9b40229ea6580c6d6d5bc6ae802162a87a51cecaa9e6928b74340b1e103"
  },
  "gpxDownloadUrl": null,
  "gpxAvailability": "not_checked",
  "importability": "no_gpx",
  "importabilityReason": "2025 三組官方路線頁與補站官表已核對；尚無該屆 GPX 原檔。官表分段是 Ride 參考，實際路線及關門以當屆手冊為準；不套用 2026 站號、位置或版本。",
  "license": {
    "redistribution": "not_verified",
    "evidence": "Minimal organizer-published factual metadata and public source links only. No provider original, mirror, account access or redistribution license established."
  },
  "cors": {
    "status": "not_tested",
    "evidence": "No raw GPX or anonymous export qualified; public route information does not establish browser import."
  },
  "distanceLabels": [
    "30KM",
    "28KM",
    "19.3KM（單人／雙人共用）"
  ],
  "distanceSources": [
    {
      "name": "30KM",
      "officialPage": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/"
    },
    {
      "name": "28KM",
      "officialPage": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/"
    },
    {
      "name": "19.3KM（單人／雙人共用）",
      "officialPage": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/"
    }
  ],
  "routes": [
    {
      "name": "30KM LV4",
      "routePageUrl": "https://www.strava.com/routes/3208337828718674382",
      "gpxDownloadUrl": null,
      "officialPage": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "downloadKind": "organizer_linked_route_page",
      "availability": "official_route_page_only"
    },
    {
      "name": "28KM LV3",
      "routePageUrl": "https://www.strava.com/routes/3208272265429019086",
      "gpxDownloadUrl": null,
      "officialPage": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "downloadKind": "organizer_linked_route_page",
      "availability": "official_route_page_only"
    },
    {
      "name": "19.3KM LV2",
      "routePageUrl": "https://www.strava.com/routes/3208337614315463118",
      "gpxDownloadUrl": null,
      "officialPage": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "downloadKind": "organizer_linked_route_page",
      "availability": "official_route_page_only"
    }
  ],
  "routeIds": [],
  "officialCheckpointCount": null,
  "officialAidStationCount": null,
  "publishedCategoryFacts": [
    {
      "name": "LV4 高手組",
      "nominalDistanceKm": 30,
      "nominalAscentM": 2241,
      "startClock": "06:30",
      "officialMaxHours": 10,
      "finishCutoffClock": null,
      "timezone": "Asia/Taipei",
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "timingStatus": "published_category_clocks_not_planner_mapping"
    },
    {
      "name": "LV3 進階組",
      "nominalDistanceKm": 28,
      "nominalAscentM": 1755,
      "startClock": "07:00",
      "officialMaxHours": 9,
      "finishCutoffClock": null,
      "timezone": "Asia/Taipei",
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "timingStatus": "published_category_clocks_not_planner_mapping"
    },
    {
      "name": "LV2 挑戰組",
      "nominalDistanceKm": 19.3,
      "nominalAscentM": 1225,
      "startClock": "08:00",
      "officialMaxHours": 8,
      "finishCutoffClock": null,
      "timezone": "Asia/Taipei",
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "timingStatus": "published_category_clocks_not_planner_mapping"
    }
  ]
},
{
  "id": "mingfeng-trail-2026",
  "name": "鳴鳳越野（2026）",
  "country": "台灣",
  "region": "Asia",
  "year": 2026,
  "edition": 2026,
  "date": "2026-03-22",
  "dateStart": "2026-03-22",
  "dateEnd": "2026-03-22",
  "status": "past",
  "officialPage": "https://dtpwow.run/races/2026-%E9%B3%B4%E9%B3%B3%E8%B6%8A%E9%87%8E/",
  "metadata": {
    "verifiedAt": "2026-10-16T00:13:00Z",
    "source": "https://dtpwow.run/races/2026-%E9%B3%B4%E9%B3%B3%E8%B6%8A%E9%87%8E/",
    "dateEvidence": "Exact official edition page and organizer race index explicitly give this date. Public source facts only; final race-day revision is not established.",
    "verificationLevel": "official_source_checked",
    "eventDateScope": "event_period_not_all_distance_start_times",
    "sourceSha256": "8f4e3c7d8d90838fe616d8587d11d54ace744e2615eac1dbfe6f3929ad4f2373"
  },
  "gpxDownloadUrl": null,
  "gpxAvailability": "not_checked",
  "importability": "no_gpx",
  "importabilityReason": "2026 官頁提供 Strava 路線資訊；GPX 原檔與賽日最終版本尚未核實。20K 敘述含雲洞宮去回、CPA 番子寮山及 CPB 明德水庫；12K 含雲洞宮去回與番子寮折返。公開站點公里、位置、補給內容與關門待核，不沿用 2027 路線。",
  "license": {
    "redistribution": "not_verified",
    "evidence": "Minimal organizer-published factual metadata and public source links only. No provider original, mirror, account access or redistribution license established."
  },
  "cors": {
    "status": "not_tested",
    "evidence": "No raw GPX or anonymous export qualified; public route information does not establish browser import."
  },
  "distanceLabels": [
    "20KM LV3",
    "12KM LV2",
    "5K LV1（路線段落 5.1KM）",
    "LV0 尋寶組（非固定距離）"
  ],
  "distanceSources": [
    {
      "name": "20KM LV3",
      "officialPage": "https://dtpwow.run/races/2026-%E9%B3%B4%E9%B3%B3%E8%B6%8A%E9%87%8E/"
    },
    {
      "name": "12KM LV2",
      "officialPage": "https://dtpwow.run/races/2026-%E9%B3%B4%E9%B3%B3%E8%B6%8A%E9%87%8E/"
    },
    {
      "name": "5K LV1（路線段落 5.1KM）",
      "officialPage": "https://dtpwow.run/races/2026-%E9%B3%B4%E9%B3%B3%E8%B6%8A%E9%87%8E/"
    },
    {
      "name": "LV0 尋寶組（非固定距離）",
      "officialPage": "https://dtpwow.run/races/2026-%E9%B3%B4%E9%B3%B3%E8%B6%8A%E9%87%8E/"
    }
  ],
  "routes": [
    {
      "name": "20KM LV3",
      "routePageUrl": "https://www.strava.com/routes/3226476038148012268",
      "gpxDownloadUrl": null,
      "officialPage": "https://dtpwow.run/races/2026-%E9%B3%B4%E9%B3%B3%E8%B6%8A%E9%87%8E/",
      "downloadKind": "organizer_linked_route_page",
      "availability": "official_route_page_only"
    },
    {
      "name": "12KM LV2",
      "routePageUrl": "https://www.strava.com/routes/3226477146128597414",
      "gpxDownloadUrl": null,
      "officialPage": "https://dtpwow.run/races/2026-%E9%B3%B4%E9%B3%B3%E8%B6%8A%E9%87%8E/",
      "downloadKind": "organizer_linked_route_page",
      "availability": "official_route_page_only"
    },
    {
      "name": "5.1KM LV1",
      "routePageUrl": "https://www.strava.com/routes/3226478271371269582",
      "gpxDownloadUrl": null,
      "officialPage": "https://dtpwow.run/races/2026-%E9%B3%B4%E9%B3%B3%E8%B6%8A%E9%87%8E/",
      "downloadKind": "organizer_linked_route_page",
      "availability": "official_route_page_only"
    }
  ],
  "routeIds": [],
  "officialCheckpointCount": null,
  "officialAidStationCount": null
},
{
  "id": "hotdog-trail-2026",
  "name": "HOT DOG Trail 台中熱血接力（2026）",
  "country": "台灣",
  "region": "Asia",
  "year": 2026,
  "edition": 2026,
  "date": "2026-08-30",
  "dateStart": "2026-08-30",
  "dateEnd": "2026-08-30",
  "status": "past",
  "officialPage": "https://dtpwow.run/races/2026-hot-dog-trail/",
  "metadata": {
    "verifiedAt": "2026-10-16T00:13:00Z",
    "source": "https://dtpwow.run/races/2026-hot-dog-trail/",
    "dateEvidence": "Exact official edition page and organizer race index explicitly give this date. Public source facts only; final race-day revision is not established.",
    "verificationLevel": "official_source_checked",
    "eventDateScope": "event_period_not_all_distance_start_times",
    "sourceSha256": "fa8ba533329aa505e7f2becf71dd27db592d8a96637c20f9f688c05cd2034ea8"
  },
  "gpxDownloadUrl": null,
  "gpxAvailability": "not_checked",
  "importability": "no_gpx",
  "importabilityReason": "官方公布每棒 4.5km／爬升170m，補給站在該棒 2.6km；接力組別與每棒路線分開。GPX 原檔、定位、停留、關門及完整站數尚未核實；14:00 是活動結束，未當作各組官方關門。",
  "license": {
    "redistribution": "not_verified",
    "evidence": "Minimal organizer-published factual metadata and public source links only. No provider original, mirror, account access or redistribution license established."
  },
  "cors": {
    "status": "not_tested",
    "evidence": "No raw GPX or anonymous export qualified; public route information does not establish browser import."
  },
  "distanceLabels": [
    "每棒 4.5KM／爬升 170m（接力，非連續全馬軌跡）",
    "EP全馬組／EP半馬組／EP健跑"
  ],
  "distanceSources": [
    {
      "name": "每棒 4.5KM／爬升 170m（接力，非連續全馬軌跡）",
      "officialPage": "https://dtpwow.run/races/2026-hot-dog-trail/"
    },
    {
      "name": "EP全馬組／EP半馬組／EP健跑",
      "officialPage": "https://dtpwow.run/races/2026-hot-dog-trail/"
    }
  ],
  "routes": [
    {
      "name": "每棒 4.5KM",
      "routePageUrl": "https://ridewithgps.com/routes/54387630",
      "gpxDownloadUrl": null,
      "officialPage": "https://dtpwow.run/races/2026-hot-dog-trail/",
      "downloadKind": "organizer_linked_route_page",
      "availability": "official_route_page_only"
    }
  ],
  "routeIds": [],
  "officialCheckpointCount": null,
  "officialAidStationCount": null,
  "courseStructure": "relay_legs_not_continuous_marathon",
  "publishedLegFacts": {
    "nominalLegDistanceKm": 4.5,
    "nominalLegAscentM": 170,
    "reportedAidStationDistanceM": 2600,
    "distanceScope": "one_relay_leg_not_team_cumulative",
    "sourceUrl": "https://dtpwow.run/races/2026-hot-dog-trail/",
    "currentRoutePositionM": null,
    "lat": null,
    "lon": null,
    "stopSeconds": null,
    "cutoffLocal": null,
    "cutoffKind": null,
    "completeStationListVerified": false
  }
}
].map(attachPublishedCheckpointTables);
