/** Reviewed organizer snapshots; event facts only, never automatic planner stations. */
const freeze=v=>{if(v&&typeof v==="object"){for(const c of Object.values(v))freeze(c);Object.freeze(v);}return v;};
const TABLES=freeze([
  {
    "schema": "published-event-checkpoint-table/1",
    "id": "wufeng-trail-2026:lv4-30k",
    "eventId": "wufeng-trail-2026",
    "edition": 2026,
    "groupKey": "lv4-30k",
    "groupName": "30KM LV4",
    "reportedGroupLabel": "LV4 高手組",
    "nominalCategoryDistanceKm": "30",
    "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
    "sourceSha256": "0036a3626a7a309b6d671ecf9da705c1b399024d15e3391c5339a0feff20a623",
    "htmlTableOrdinal": 2,
    "rawTableSha256": "f2ade6747ecb5da5cacafaace3e0e6c2da0ba2f4706f0bfa37351e48fd92160f",
    "groupBinding": {
      "method": "immediately_preceding_group_description_table",
      "htmlTableOrdinal": 1,
      "headingText": "LV4 高手組(30KM) 爬升：2241m 限時 10小時 06：30 AM 起跑 UTMB index 50K ITRA 2點 GPX(依大會公告及手冊版本為準)",
      "reportedGroupLabel": "LV4 高手組",
      "nominalCategoryDistanceKm": "30"
    },
    "routeVersion": "current_page_snapshot_handbook_has_precedence",
    "routeOriginalSha256": null,
    "routeMappingStatus": "not_connected_to_admitted_GPX",
    "positionAuthority": "none",
    "cutoffRuleMeaning": "published_pass_through_rule_arrival_vs_departure_not_established",
    "derivedLegTotalKm": "29.8",
    "header": [
      "位置名稱",
      "CP",
      "關門時間",
      "醫護",
      "補給內容",
      "下站距離 單位 K公里",
      "爬升 單位 M公尺",
      "下降 單位 M公尺"
    ],
    "skippedRows": [],
    "rawGrid": [
      [
        {
          "row": 0,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "位置名稱",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "CP",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "關門時間",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "醫護",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "補給內容",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "下站距離 單位 K公里",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "爬升 單位 M公尺",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 7,
          "rawCellOrdinal": 7,
          "text": "下降 單位 M公尺",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 1,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "起點",
          "rowspan": 1,
          "colspan": 4
        },
        {
          "row": 1,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "起點",
          "rowspan": 1,
          "colspan": 4
        },
        {
          "row": 1,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "起點",
          "rowspan": 1,
          "colspan": 4
        },
        {
          "row": 1,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "起點",
          "rowspan": 1,
          "colspan": 4
        },
        {
          "row": 1,
          "column": 4,
          "rawCellOrdinal": 1,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 5,
          "rawCellOrdinal": 2,
          "text": "9.4",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 6,
          "rawCellOrdinal": 3,
          "text": "837",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 7,
          "rawCellOrdinal": 4,
          "text": "240",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 2,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "鵝公髻(去程)",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "CP0",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "10:30",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "V",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "水、舒跑、可樂、水果、乾糧、熟食",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "4.4",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "740",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 7,
          "rawCellOrdinal": 7,
          "text": "45",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 3,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "鵝公髻三角點",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "CP1",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "3.1",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "0",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 7,
          "rawCellOrdinal": 7,
          "text": "687",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 4,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "鵝公髻(回程)",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "CP0",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "13:30",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "V",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "水、舒跑、可樂、水果、乾糧、熟食",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "4.6",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "143",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 7,
          "rawCellOrdinal": 7,
          "text": "379",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 5,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "受北宮",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 5,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "CP3",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 5,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "15:30",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 5,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "V",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 5,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "水、舒跑、可樂、乾糧、熟食",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 5,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "6.5",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 5,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "42",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 5,
          "column": 7,
          "rawCellOrdinal": 7,
          "text": "336",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 6,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "上瑞社區",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 6,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "CP4",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 6,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 6,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 6,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "水、舒跑、可樂、水果、熟食",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 6,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "1.8",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 6,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "23",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 6,
          "column": 7,
          "rawCellOrdinal": 7,
          "text": "31",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 7,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 7,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 7,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 7,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 7,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 7,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 7,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 7,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        }
      ]
    ],
    "checkpoints": [
      {
        "id": "wufeng-trail-2026:lv4-30k:table-2:row-1",
        "name": "起點",
        "kind": "start",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "wufeng-trail-2026:lv4-30k:table-2:row-1",
          "sourceRow": 1,
          "kind": "start",
          "rawName": "起點",
          "reportedStationId": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "covered_by_another_cell"
          },
          "reportedNextLegDistanceKm": "9.4",
          "reportedNextLegDistanceSourceCell": {
            "row": 1,
            "column": 5,
            "rawCellOrdinal": 2
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "0",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": null,
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": null,
            "sourceCell": {
              "row": 1,
              "column": 4,
              "rawCellOrdinal": 1
            },
            "unknownReason": "blank_published_cell"
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "covered_by_another_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "wufeng-trail-2026:lv4-30k:table-2:row-2",
        "name": "鵝公髻(去程)",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": "10:30",
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "wufeng-trail-2026:lv4-30k:table-2:row-2",
          "sourceRow": 2,
          "kind": "checkpoint",
          "rawName": "鵝公髻(去程)",
          "reportedStationId": {
            "text": "CP0",
            "sourceCell": {
              "row": 2,
              "column": 1,
              "rawCellOrdinal": 1
            },
            "unknownReason": null
          },
          "reportedNextLegDistanceKm": "4.4",
          "reportedNextLegDistanceSourceCell": {
            "row": 2,
            "column": 5,
            "rawCellOrdinal": 5
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "9.4",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": "10:30",
          "cutoffSourceCell": {
            "row": 2,
            "column": 2,
            "rawCellOrdinal": 2
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": "水、舒跑、可樂、水果、乾糧、熟食",
            "sourceCell": {
              "row": 2,
              "column": 4,
              "rawCellOrdinal": 4
            },
            "unknownReason": null
          },
          "publishedMedicalMarker": {
            "text": "V",
            "sourceCell": {
              "row": 2,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": null
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "wufeng-trail-2026:lv4-30k:table-2:row-3",
        "name": "鵝公髻三角點",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "wufeng-trail-2026:lv4-30k:table-2:row-3",
          "sourceRow": 3,
          "kind": "checkpoint",
          "rawName": "鵝公髻三角點",
          "reportedStationId": {
            "text": "CP1",
            "sourceCell": {
              "row": 3,
              "column": 1,
              "rawCellOrdinal": 1
            },
            "unknownReason": null
          },
          "reportedNextLegDistanceKm": "3.1",
          "reportedNextLegDistanceSourceCell": {
            "row": 3,
            "column": 5,
            "rawCellOrdinal": 5
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "13.8",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": {
            "row": 3,
            "column": 2,
            "rawCellOrdinal": 2
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": null,
            "sourceCell": {
              "row": 3,
              "column": 4,
              "rawCellOrdinal": 4
            },
            "unknownReason": "blank_published_cell"
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": {
              "row": 3,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": "blank_published_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "wufeng-trail-2026:lv4-30k:table-2:row-4",
        "name": "鵝公髻(回程)",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": "13:30",
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "wufeng-trail-2026:lv4-30k:table-2:row-4",
          "sourceRow": 4,
          "kind": "checkpoint",
          "rawName": "鵝公髻(回程)",
          "reportedStationId": {
            "text": "CP0",
            "sourceCell": {
              "row": 4,
              "column": 1,
              "rawCellOrdinal": 1
            },
            "unknownReason": null
          },
          "reportedNextLegDistanceKm": "4.6",
          "reportedNextLegDistanceSourceCell": {
            "row": 4,
            "column": 5,
            "rawCellOrdinal": 5
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "16.9",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": "13:30",
          "cutoffSourceCell": {
            "row": 4,
            "column": 2,
            "rawCellOrdinal": 2
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": "水、舒跑、可樂、水果、乾糧、熟食",
            "sourceCell": {
              "row": 4,
              "column": 4,
              "rawCellOrdinal": 4
            },
            "unknownReason": null
          },
          "publishedMedicalMarker": {
            "text": "V",
            "sourceCell": {
              "row": 4,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": null
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "wufeng-trail-2026:lv4-30k:table-2:row-5",
        "name": "受北宮",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": "15:30",
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "wufeng-trail-2026:lv4-30k:table-2:row-5",
          "sourceRow": 5,
          "kind": "checkpoint",
          "rawName": "受北宮",
          "reportedStationId": {
            "text": "CP3",
            "sourceCell": {
              "row": 5,
              "column": 1,
              "rawCellOrdinal": 1
            },
            "unknownReason": null
          },
          "reportedNextLegDistanceKm": "6.5",
          "reportedNextLegDistanceSourceCell": {
            "row": 5,
            "column": 5,
            "rawCellOrdinal": 5
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "21.5",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": "15:30",
          "cutoffSourceCell": {
            "row": 5,
            "column": 2,
            "rawCellOrdinal": 2
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": "水、舒跑、可樂、乾糧、熟食",
            "sourceCell": {
              "row": 5,
              "column": 4,
              "rawCellOrdinal": 4
            },
            "unknownReason": null
          },
          "publishedMedicalMarker": {
            "text": "V",
            "sourceCell": {
              "row": 5,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": null
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "wufeng-trail-2026:lv4-30k:table-2:row-6",
        "name": "上瑞社區",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "wufeng-trail-2026:lv4-30k:table-2:row-6",
          "sourceRow": 6,
          "kind": "checkpoint",
          "rawName": "上瑞社區",
          "reportedStationId": {
            "text": "CP4",
            "sourceCell": {
              "row": 6,
              "column": 1,
              "rawCellOrdinal": 1
            },
            "unknownReason": null
          },
          "reportedNextLegDistanceKm": "1.8",
          "reportedNextLegDistanceSourceCell": {
            "row": 6,
            "column": 5,
            "rawCellOrdinal": 5
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "28",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": {
            "row": 6,
            "column": 2,
            "rawCellOrdinal": 2
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": "水、舒跑、可樂、水果、熟食",
            "sourceCell": {
              "row": 6,
              "column": 4,
              "rawCellOrdinal": 4
            },
            "unknownReason": null
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": {
              "row": 6,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": "blank_published_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "wufeng-trail-2026:lv4-30k:table-2:row-7",
        "name": "終點",
        "kind": "finish",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "wufeng-trail-2026:lv4-30k:table-2:row-7",
          "sourceRow": 7,
          "kind": "finish",
          "rawName": "終點",
          "reportedStationId": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "covered_by_another_cell"
          },
          "reportedNextLegDistanceKm": null,
          "reportedNextLegDistanceSourceCell": null,
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "29.8",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": null,
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "covered_by_another_cell"
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "covered_by_another_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      }
    ]
  },
  {
    "schema": "published-event-checkpoint-table/1",
    "id": "wufeng-trail-2026:lv3-28k",
    "eventId": "wufeng-trail-2026",
    "edition": 2026,
    "groupKey": "lv3-28k",
    "groupName": "28KM LV3",
    "reportedGroupLabel": "LV3 進階組",
    "nominalCategoryDistanceKm": "28",
    "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
    "sourceSha256": "0036a3626a7a309b6d671ecf9da705c1b399024d15e3391c5339a0feff20a623",
    "htmlTableOrdinal": 4,
    "rawTableSha256": "043852bef863df26a202eb7469d3872f81aa54412aba523a94c481cbb181f5b9",
    "groupBinding": {
      "method": "immediately_preceding_group_description_table",
      "htmlTableOrdinal": 3,
      "headingText": "LV3 進階組(28KM) 爬升：1755m 限時 9小時 07：00 AM 起跑 UTMB index 20K ITRA 1點 GPX(依大會公告及手冊版本為準)",
      "reportedGroupLabel": "LV3 進階組",
      "nominalCategoryDistanceKm": "28"
    },
    "routeVersion": "current_page_snapshot_handbook_has_precedence",
    "routeOriginalSha256": null,
    "routeMappingStatus": "not_connected_to_admitted_GPX",
    "positionAuthority": "none",
    "cutoffRuleMeaning": "published_pass_through_rule_arrival_vs_departure_not_established",
    "derivedLegTotalKm": "28.3",
    "header": [
      "位置名稱",
      "CP",
      "關門時間",
      "醫護",
      "補給內容",
      "下站距離 單位 K公里",
      "爬升 單位 M公尺",
      "下降 單位 M公尺"
    ],
    "skippedRows": [],
    "rawGrid": [
      [
        {
          "row": 0,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "位置名稱",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "CP",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "關門時間",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "醫護",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "補給內容",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "下站距離 單位 K公里",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "爬升 單位 M公尺",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 7,
          "rawCellOrdinal": 7,
          "text": "下降 單位 M公尺",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 1,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "起點",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "9.4",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "837",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 7,
          "rawCellOrdinal": 7,
          "text": "240",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 2,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "鵝公髻(去程)",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "CP0",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "11:00",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "V",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "水、舒跑、可樂、水果、乾糧、熟食",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "2.9",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "236",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 7,
          "rawCellOrdinal": 7,
          "text": "48",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 3,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "折返點",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "CP2",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "2.8",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "45",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 7,
          "rawCellOrdinal": 7,
          "text": "219",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 4,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "鵝公髻(回程)",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "CP0",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "13:00",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "V",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "水、舒跑、可樂、水果、乾糧、熟食",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "4.9",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "143",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 7,
          "rawCellOrdinal": 7,
          "text": "424",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 5,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "受北宮",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 5,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "CP3",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 5,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "15:00",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 5,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "V",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 5,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "水、舒跑、可樂、乾糧、熟食",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 5,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "6.5",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 5,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "42",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 5,
          "column": 7,
          "rawCellOrdinal": 7,
          "text": "336",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 6,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "上瑞社區",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 6,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "CP4",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 6,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 6,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 6,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "水、舒跑、可樂、水果、熟食",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 6,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "1.8",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 6,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "28",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 6,
          "column": 7,
          "rawCellOrdinal": 7,
          "text": "31",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 7,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 7,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 7,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 7,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 7,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 7,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 7,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 7,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        }
      ]
    ],
    "checkpoints": [
      {
        "id": "wufeng-trail-2026:lv3-28k:table-4:row-1",
        "name": "起點",
        "kind": "start",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "wufeng-trail-2026:lv3-28k:table-4:row-1",
          "sourceRow": 1,
          "kind": "start",
          "rawName": "起點",
          "reportedStationId": {
            "text": null,
            "sourceCell": {
              "row": 1,
              "column": 1,
              "rawCellOrdinal": 1
            },
            "unknownReason": "blank_published_cell"
          },
          "reportedNextLegDistanceKm": "9.4",
          "reportedNextLegDistanceSourceCell": {
            "row": 1,
            "column": 5,
            "rawCellOrdinal": 5
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "0",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": {
            "row": 1,
            "column": 2,
            "rawCellOrdinal": 2
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": null,
            "sourceCell": {
              "row": 1,
              "column": 4,
              "rawCellOrdinal": 4
            },
            "unknownReason": "blank_published_cell"
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": {
              "row": 1,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": "blank_published_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "wufeng-trail-2026:lv3-28k:table-4:row-2",
        "name": "鵝公髻(去程)",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": "11:00",
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "wufeng-trail-2026:lv3-28k:table-4:row-2",
          "sourceRow": 2,
          "kind": "checkpoint",
          "rawName": "鵝公髻(去程)",
          "reportedStationId": {
            "text": "CP0",
            "sourceCell": {
              "row": 2,
              "column": 1,
              "rawCellOrdinal": 1
            },
            "unknownReason": null
          },
          "reportedNextLegDistanceKm": "2.9",
          "reportedNextLegDistanceSourceCell": {
            "row": 2,
            "column": 5,
            "rawCellOrdinal": 5
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "9.4",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": "11:00",
          "cutoffSourceCell": {
            "row": 2,
            "column": 2,
            "rawCellOrdinal": 2
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": "水、舒跑、可樂、水果、乾糧、熟食",
            "sourceCell": {
              "row": 2,
              "column": 4,
              "rawCellOrdinal": 4
            },
            "unknownReason": null
          },
          "publishedMedicalMarker": {
            "text": "V",
            "sourceCell": {
              "row": 2,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": null
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "wufeng-trail-2026:lv3-28k:table-4:row-3",
        "name": "折返點",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "wufeng-trail-2026:lv3-28k:table-4:row-3",
          "sourceRow": 3,
          "kind": "checkpoint",
          "rawName": "折返點",
          "reportedStationId": {
            "text": "CP2",
            "sourceCell": {
              "row": 3,
              "column": 1,
              "rawCellOrdinal": 1
            },
            "unknownReason": null
          },
          "reportedNextLegDistanceKm": "2.8",
          "reportedNextLegDistanceSourceCell": {
            "row": 3,
            "column": 5,
            "rawCellOrdinal": 5
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "12.3",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": {
            "row": 3,
            "column": 2,
            "rawCellOrdinal": 2
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": null,
            "sourceCell": {
              "row": 3,
              "column": 4,
              "rawCellOrdinal": 4
            },
            "unknownReason": "blank_published_cell"
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": {
              "row": 3,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": "blank_published_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "wufeng-trail-2026:lv3-28k:table-4:row-4",
        "name": "鵝公髻(回程)",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": "13:00",
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "wufeng-trail-2026:lv3-28k:table-4:row-4",
          "sourceRow": 4,
          "kind": "checkpoint",
          "rawName": "鵝公髻(回程)",
          "reportedStationId": {
            "text": "CP0",
            "sourceCell": {
              "row": 4,
              "column": 1,
              "rawCellOrdinal": 1
            },
            "unknownReason": null
          },
          "reportedNextLegDistanceKm": "4.9",
          "reportedNextLegDistanceSourceCell": {
            "row": 4,
            "column": 5,
            "rawCellOrdinal": 5
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "15.1",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": "13:00",
          "cutoffSourceCell": {
            "row": 4,
            "column": 2,
            "rawCellOrdinal": 2
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": "水、舒跑、可樂、水果、乾糧、熟食",
            "sourceCell": {
              "row": 4,
              "column": 4,
              "rawCellOrdinal": 4
            },
            "unknownReason": null
          },
          "publishedMedicalMarker": {
            "text": "V",
            "sourceCell": {
              "row": 4,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": null
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "wufeng-trail-2026:lv3-28k:table-4:row-5",
        "name": "受北宮",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": "15:00",
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "wufeng-trail-2026:lv3-28k:table-4:row-5",
          "sourceRow": 5,
          "kind": "checkpoint",
          "rawName": "受北宮",
          "reportedStationId": {
            "text": "CP3",
            "sourceCell": {
              "row": 5,
              "column": 1,
              "rawCellOrdinal": 1
            },
            "unknownReason": null
          },
          "reportedNextLegDistanceKm": "6.5",
          "reportedNextLegDistanceSourceCell": {
            "row": 5,
            "column": 5,
            "rawCellOrdinal": 5
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "20",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": "15:00",
          "cutoffSourceCell": {
            "row": 5,
            "column": 2,
            "rawCellOrdinal": 2
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": "水、舒跑、可樂、乾糧、熟食",
            "sourceCell": {
              "row": 5,
              "column": 4,
              "rawCellOrdinal": 4
            },
            "unknownReason": null
          },
          "publishedMedicalMarker": {
            "text": "V",
            "sourceCell": {
              "row": 5,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": null
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "wufeng-trail-2026:lv3-28k:table-4:row-6",
        "name": "上瑞社區",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "wufeng-trail-2026:lv3-28k:table-4:row-6",
          "sourceRow": 6,
          "kind": "checkpoint",
          "rawName": "上瑞社區",
          "reportedStationId": {
            "text": "CP4",
            "sourceCell": {
              "row": 6,
              "column": 1,
              "rawCellOrdinal": 1
            },
            "unknownReason": null
          },
          "reportedNextLegDistanceKm": "1.8",
          "reportedNextLegDistanceSourceCell": {
            "row": 6,
            "column": 5,
            "rawCellOrdinal": 5
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "26.5",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": {
            "row": 6,
            "column": 2,
            "rawCellOrdinal": 2
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": "水、舒跑、可樂、水果、熟食",
            "sourceCell": {
              "row": 6,
              "column": 4,
              "rawCellOrdinal": 4
            },
            "unknownReason": null
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": {
              "row": 6,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": "blank_published_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "wufeng-trail-2026:lv3-28k:table-4:row-7",
        "name": "終點",
        "kind": "finish",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "wufeng-trail-2026:lv3-28k:table-4:row-7",
          "sourceRow": 7,
          "kind": "finish",
          "rawName": "終點",
          "reportedStationId": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "covered_by_another_cell"
          },
          "reportedNextLegDistanceKm": null,
          "reportedNextLegDistanceSourceCell": null,
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "28.3",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": null,
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "covered_by_another_cell"
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "covered_by_another_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      }
    ]
  },
  {
    "schema": "published-event-checkpoint-table/1",
    "id": "wufeng-trail-2026:lv2-19-3k",
    "eventId": "wufeng-trail-2026",
    "edition": 2026,
    "groupKey": "lv2-19-3k",
    "groupName": "19.3KM LV2",
    "reportedGroupLabel": "LV2 挑戰組",
    "nominalCategoryDistanceKm": "19.3",
    "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
    "sourceSha256": "0036a3626a7a309b6d671ecf9da705c1b399024d15e3391c5339a0feff20a623",
    "htmlTableOrdinal": 6,
    "rawTableSha256": "2cabde5c6ede6a481d447dadbc7aa93df3f5dcf62777a80cdbafa780e3af5c6a",
    "groupBinding": {
      "method": "immediately_preceding_group_description_table",
      "htmlTableOrdinal": 5,
      "headingText": "LV2 挑戰組(19.3KM) 爬升：1225M 限時 8小時 08：00 AM 起跑 UTMB index 20K GPX(依大會公告及手冊版本為準)",
      "reportedGroupLabel": "LV2 挑戰組",
      "nominalCategoryDistanceKm": "19.3"
    },
    "routeVersion": "current_page_snapshot_handbook_has_precedence",
    "routeOriginalSha256": null,
    "routeMappingStatus": "not_connected_to_admitted_GPX",
    "positionAuthority": "none",
    "cutoffRuleMeaning": "published_pass_through_rule_arrival_vs_departure_not_established",
    "derivedLegTotalKm": "19.3",
    "header": [
      "位置名稱",
      "CP",
      "關門時間",
      "醫護",
      "補給內容",
      "下站距離 單位 K公里",
      "爬升 單位 M公尺",
      "下降 單位 M公尺"
    ],
    "skippedRows": [
      {
        "sourceRow": 3,
        "reason": "all_cells_explicitly_blank"
      }
    ],
    "rawGrid": [
      [
        {
          "row": 0,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "位置名稱",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "CP",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "關門時間",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "醫護",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "補給內容",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "下站距離 單位 K公里",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "爬升 單位 M公尺",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 7,
          "rawCellOrdinal": 7,
          "text": "下降 單位 M公尺",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 1,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "起點",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "9.3",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "802",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 7,
          "rawCellOrdinal": 7,
          "text": "376",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 2,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "受北宮",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "CP3",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "13:30",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "水、舒跑、可樂、水果、乾糧、熟食",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "8.2",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "125",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 7,
          "rawCellOrdinal": 7,
          "text": "531",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 3,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 7,
          "rawCellOrdinal": 7,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 4,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "上瑞社區",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "CP4",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "水、舒跑、可樂、水果、熟食",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "1.8",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "28",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 7,
          "rawCellOrdinal": 7,
          "text": "31",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 5,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 5,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 5,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 5,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 5,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 5,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 5,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        },
        {
          "row": 5,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 8
        }
      ]
    ],
    "checkpoints": [
      {
        "id": "wufeng-trail-2026:lv2-19-3k:table-6:row-1",
        "name": "起點",
        "kind": "start",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "wufeng-trail-2026:lv2-19-3k:table-6:row-1",
          "sourceRow": 1,
          "kind": "start",
          "rawName": "起點",
          "reportedStationId": {
            "text": null,
            "sourceCell": {
              "row": 1,
              "column": 1,
              "rawCellOrdinal": 1
            },
            "unknownReason": "blank_published_cell"
          },
          "reportedNextLegDistanceKm": "9.3",
          "reportedNextLegDistanceSourceCell": {
            "row": 1,
            "column": 5,
            "rawCellOrdinal": 5
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "0",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": {
            "row": 1,
            "column": 2,
            "rawCellOrdinal": 2
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": null,
            "sourceCell": {
              "row": 1,
              "column": 4,
              "rawCellOrdinal": 4
            },
            "unknownReason": "blank_published_cell"
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": {
              "row": 1,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": "blank_published_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "wufeng-trail-2026:lv2-19-3k:table-6:row-2",
        "name": "受北宮",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": "13:30",
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "wufeng-trail-2026:lv2-19-3k:table-6:row-2",
          "sourceRow": 2,
          "kind": "checkpoint",
          "rawName": "受北宮",
          "reportedStationId": {
            "text": "CP3",
            "sourceCell": {
              "row": 2,
              "column": 1,
              "rawCellOrdinal": 1
            },
            "unknownReason": null
          },
          "reportedNextLegDistanceKm": "8.2",
          "reportedNextLegDistanceSourceCell": {
            "row": 2,
            "column": 5,
            "rawCellOrdinal": 5
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "9.3",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": "13:30",
          "cutoffSourceCell": {
            "row": 2,
            "column": 2,
            "rawCellOrdinal": 2
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": "水、舒跑、可樂、水果、乾糧、熟食",
            "sourceCell": {
              "row": 2,
              "column": 4,
              "rawCellOrdinal": 4
            },
            "unknownReason": null
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": {
              "row": 2,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": "blank_published_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "wufeng-trail-2026:lv2-19-3k:table-6:row-4",
        "name": "上瑞社區",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "wufeng-trail-2026:lv2-19-3k:table-6:row-4",
          "sourceRow": 4,
          "kind": "checkpoint",
          "rawName": "上瑞社區",
          "reportedStationId": {
            "text": "CP4",
            "sourceCell": {
              "row": 4,
              "column": 1,
              "rawCellOrdinal": 1
            },
            "unknownReason": null
          },
          "reportedNextLegDistanceKm": "1.8",
          "reportedNextLegDistanceSourceCell": {
            "row": 4,
            "column": 5,
            "rawCellOrdinal": 5
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "17.5",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": {
            "row": 4,
            "column": 2,
            "rawCellOrdinal": 2
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": "水、舒跑、可樂、水果、熟食",
            "sourceCell": {
              "row": 4,
              "column": 4,
              "rawCellOrdinal": 4
            },
            "unknownReason": null
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": {
              "row": 4,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": "blank_published_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "wufeng-trail-2026:lv2-19-3k:table-6:row-5",
        "name": "終點",
        "kind": "finish",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-wufong/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "wufeng-trail-2026:lv2-19-3k:table-6:row-5",
          "sourceRow": 5,
          "kind": "finish",
          "rawName": "終點",
          "reportedStationId": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "covered_by_another_cell"
          },
          "reportedNextLegDistanceKm": null,
          "reportedNextLegDistanceSourceCell": null,
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "19.3",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": null,
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "covered_by_another_cell"
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "covered_by_another_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      }
    ]
  },
  {
    "schema": "published-event-checkpoint-table/1",
    "id": "songhe-trail-2026:lv5-56k",
    "eventId": "songhe-trail-2026",
    "edition": 2026,
    "groupKey": "lv5-56k",
    "groupName": "56K LV5",
    "reportedGroupLabel": "LV5 硬陡組",
    "nominalCategoryDistanceKm": "56",
    "sourceUrl": "https://dtpwow.run/races/2026-%e6%9d%be%e9%b6%b4%e8%b6%8a%e9%87%8e/",
    "sourceSha256": "bda03ee73fc465e9df203b1d6cd1bb9ff7d9c74b2a9bef65a312f389192c2e4c",
    "htmlTableOrdinal": 2,
    "rawTableSha256": "c50f926780ad66d29413ccc668b8f96bec1fe9c9d653287677516d20d06f098a",
    "groupBinding": {
      "method": "immediately_preceding_group_description_table",
      "htmlTableOrdinal": 1,
      "headingText": "LV5 硬陡組 (56K) 爬升：3500m 限時14小時 AM 04：30起跑 最低平均EP：EP 6.5 報名限制：需符合下列一項完成任一場 DTP WOW系列 LV3完成越野賽25公里以上42公里跑步 5小時內完成路線連結： https://ridewithgps.com/routes/45158155",
      "reportedGroupLabel": "LV5 硬陡組",
      "nominalCategoryDistanceKm": "56"
    },
    "routeVersion": "current_page_snapshot_handbook_has_precedence",
    "routeOriginalSha256": null,
    "routeMappingStatus": "not_connected_to_admitted_GPX",
    "positionAuthority": "none",
    "cutoffRuleMeaning": "published_pass_through_rule_arrival_vs_departure_not_established",
    "derivedLegTotalKm": "56.2",
    "header": [
      "位置名稱",
      "關門時間",
      "醫護",
      "補給內容",
      "下站距離 單位 K公里",
      "爬升 單位 M公尺",
      "下降 單位 M公尺"
    ],
    "skippedRows": [],
    "rawGrid": [
      [
        {
          "row": 0,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "位置名稱",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "關門時間",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "醫護",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "補給內容",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "下站距離 單位 K公里",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "爬升 單位 M公尺",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "下降 單位 M公尺",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 1,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "起點",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "10",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "880",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "16",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 2,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "SP1",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "水、舒跑、可樂、水果、乾糧",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "15",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "616",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "903",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 3,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "SP2",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "水、舒跑、可樂、水果、乾糧",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "5.2",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "31",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "390",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 4,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "CP1",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "11:30",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "V",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "水、舒跑、可樂、水果、乾糧、熟食",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "6.5",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "936",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 4,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "463",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 5,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "CP2",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 5,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 5,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 5,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "水、舒跑、可樂、乾糧、熟食",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 5,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "7.9",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 5,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "550",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 5,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "658",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 6,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "SP3",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 6,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "16:50",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 6,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "V",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 6,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "水、舒跑、可樂、水果、熟食",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 6,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "5.7",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 6,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "4",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 6,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "535",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 7,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "CP3",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 7,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 7,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 7,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "水、舒跑、可樂、水果",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 7,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "5.9",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 7,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "94",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 7,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "148",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 8,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 7
        },
        {
          "row": 8,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 7
        },
        {
          "row": 8,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 7
        },
        {
          "row": 8,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 7
        },
        {
          "row": 8,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 7
        },
        {
          "row": 8,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 7
        },
        {
          "row": 8,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 7
        }
      ]
    ],
    "checkpoints": [
      {
        "id": "songhe-trail-2026:lv5-56k:table-2:row-1",
        "name": "起點",
        "kind": "start",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-%e6%9d%be%e9%b6%b4%e8%b6%8a%e9%87%8e/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "songhe-trail-2026:lv5-56k:table-2:row-1",
          "sourceRow": 1,
          "kind": "start",
          "rawName": "起點",
          "reportedStationId": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "column_not_published"
          },
          "reportedNextLegDistanceKm": "10",
          "reportedNextLegDistanceSourceCell": {
            "row": 1,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "0",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": {
            "row": 1,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": null,
            "sourceCell": {
              "row": 1,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": "blank_published_cell"
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": {
              "row": 1,
              "column": 2,
              "rawCellOrdinal": 2
            },
            "unknownReason": "blank_published_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "songhe-trail-2026:lv5-56k:table-2:row-2",
        "name": "SP1",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-%e6%9d%be%e9%b6%b4%e8%b6%8a%e9%87%8e/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "songhe-trail-2026:lv5-56k:table-2:row-2",
          "sourceRow": 2,
          "kind": "checkpoint",
          "rawName": "SP1",
          "reportedStationId": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "column_not_published"
          },
          "reportedNextLegDistanceKm": "15",
          "reportedNextLegDistanceSourceCell": {
            "row": 2,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "10",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": {
            "row": 2,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": "水、舒跑、可樂、水果、乾糧",
            "sourceCell": {
              "row": 2,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": null
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": {
              "row": 2,
              "column": 2,
              "rawCellOrdinal": 2
            },
            "unknownReason": "blank_published_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "songhe-trail-2026:lv5-56k:table-2:row-3",
        "name": "SP2",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-%e6%9d%be%e9%b6%b4%e8%b6%8a%e9%87%8e/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "songhe-trail-2026:lv5-56k:table-2:row-3",
          "sourceRow": 3,
          "kind": "checkpoint",
          "rawName": "SP2",
          "reportedStationId": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "column_not_published"
          },
          "reportedNextLegDistanceKm": "5.2",
          "reportedNextLegDistanceSourceCell": {
            "row": 3,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "25",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": {
            "row": 3,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": "水、舒跑、可樂、水果、乾糧",
            "sourceCell": {
              "row": 3,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": null
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": {
              "row": 3,
              "column": 2,
              "rawCellOrdinal": 2
            },
            "unknownReason": "blank_published_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "songhe-trail-2026:lv5-56k:table-2:row-4",
        "name": "CP1",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": "11:30",
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-%e6%9d%be%e9%b6%b4%e8%b6%8a%e9%87%8e/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "songhe-trail-2026:lv5-56k:table-2:row-4",
          "sourceRow": 4,
          "kind": "checkpoint",
          "rawName": "CP1",
          "reportedStationId": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "column_not_published"
          },
          "reportedNextLegDistanceKm": "6.5",
          "reportedNextLegDistanceSourceCell": {
            "row": 4,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "30.2",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": "11:30",
          "cutoffSourceCell": {
            "row": 4,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": "水、舒跑、可樂、水果、乾糧、熟食",
            "sourceCell": {
              "row": 4,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": null
          },
          "publishedMedicalMarker": {
            "text": "V",
            "sourceCell": {
              "row": 4,
              "column": 2,
              "rawCellOrdinal": 2
            },
            "unknownReason": null
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "songhe-trail-2026:lv5-56k:table-2:row-5",
        "name": "CP2",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-%e6%9d%be%e9%b6%b4%e8%b6%8a%e9%87%8e/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "songhe-trail-2026:lv5-56k:table-2:row-5",
          "sourceRow": 5,
          "kind": "checkpoint",
          "rawName": "CP2",
          "reportedStationId": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "column_not_published"
          },
          "reportedNextLegDistanceKm": "7.9",
          "reportedNextLegDistanceSourceCell": {
            "row": 5,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "36.7",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": {
            "row": 5,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": "水、舒跑、可樂、乾糧、熟食",
            "sourceCell": {
              "row": 5,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": null
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": {
              "row": 5,
              "column": 2,
              "rawCellOrdinal": 2
            },
            "unknownReason": "blank_published_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "songhe-trail-2026:lv5-56k:table-2:row-6",
        "name": "SP3",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": "16:50",
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-%e6%9d%be%e9%b6%b4%e8%b6%8a%e9%87%8e/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "songhe-trail-2026:lv5-56k:table-2:row-6",
          "sourceRow": 6,
          "kind": "checkpoint",
          "rawName": "SP3",
          "reportedStationId": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "column_not_published"
          },
          "reportedNextLegDistanceKm": "5.7",
          "reportedNextLegDistanceSourceCell": {
            "row": 6,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "44.6",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": "16:50",
          "cutoffSourceCell": {
            "row": 6,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": "水、舒跑、可樂、水果、熟食",
            "sourceCell": {
              "row": 6,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": null
          },
          "publishedMedicalMarker": {
            "text": "V",
            "sourceCell": {
              "row": 6,
              "column": 2,
              "rawCellOrdinal": 2
            },
            "unknownReason": null
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "songhe-trail-2026:lv5-56k:table-2:row-7",
        "name": "CP3",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-%e6%9d%be%e9%b6%b4%e8%b6%8a%e9%87%8e/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "songhe-trail-2026:lv5-56k:table-2:row-7",
          "sourceRow": 7,
          "kind": "checkpoint",
          "rawName": "CP3",
          "reportedStationId": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "column_not_published"
          },
          "reportedNextLegDistanceKm": "5.9",
          "reportedNextLegDistanceSourceCell": {
            "row": 7,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "50.3",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": {
            "row": 7,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": "水、舒跑、可樂、水果",
            "sourceCell": {
              "row": 7,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": null
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": {
              "row": 7,
              "column": 2,
              "rawCellOrdinal": 2
            },
            "unknownReason": "blank_published_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "songhe-trail-2026:lv5-56k:table-2:row-8",
        "name": "終點",
        "kind": "finish",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-%e6%9d%be%e9%b6%b4%e8%b6%8a%e9%87%8e/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "songhe-trail-2026:lv5-56k:table-2:row-8",
          "sourceRow": 8,
          "kind": "finish",
          "rawName": "終點",
          "reportedStationId": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "column_not_published"
          },
          "reportedNextLegDistanceKm": null,
          "reportedNextLegDistanceSourceCell": null,
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "56.2",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": null,
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "covered_by_another_cell"
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "covered_by_another_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      }
    ]
  },
  {
    "schema": "published-event-checkpoint-table/1",
    "id": "songhe-trail-2026:lv3-20k",
    "eventId": "songhe-trail-2026",
    "edition": 2026,
    "groupKey": "lv3-20k",
    "groupName": "20KM LV3",
    "reportedGroupLabel": "LV3 進階組",
    "nominalCategoryDistanceKm": "20",
    "sourceUrl": "https://dtpwow.run/races/2026-%e6%9d%be%e9%b6%b4%e8%b6%8a%e9%87%8e/",
    "sourceSha256": "bda03ee73fc465e9df203b1d6cd1bb9ff7d9c74b2a9bef65a312f389192c2e4c",
    "htmlTableOrdinal": 4,
    "rawTableSha256": "216a24e269b466bfb6490526904258e6a7801713f274068b87ccb1d834200687",
    "groupBinding": {
      "method": "immediately_preceding_group_description_table",
      "htmlTableOrdinal": 3,
      "headingText": "LV3 進階組(20KM) 爬升：835m 限時 7小時 AM08：00起跑 路線連結: https://ridewithgps.com/routes/45158197",
      "reportedGroupLabel": "LV3 進階組",
      "nominalCategoryDistanceKm": "20"
    },
    "routeVersion": "current_page_snapshot_handbook_has_precedence",
    "routeOriginalSha256": null,
    "routeMappingStatus": "not_connected_to_admitted_GPX",
    "positionAuthority": "none",
    "cutoffRuleMeaning": "published_pass_through_rule_arrival_vs_departure_not_established",
    "derivedLegTotalKm": "20.1",
    "header": [
      "位置名稱",
      "關門時間",
      "醫護",
      "補給內容",
      "下站距離 單位 K公里",
      "爬升 單位 M公尺",
      "下降 單位 M公尺"
    ],
    "skippedRows": [],
    "rawGrid": [
      [
        {
          "row": 0,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "位置名稱",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "關門時間",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "醫護",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "補給內容",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "下站距離 單位 K公里",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "爬升 單位 M公尺",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "下降 單位 M公尺",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 1,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "起點",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "8.5",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "659",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "98",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 2,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "SP3",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "12:00",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "V",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "水、舒跑、可樂、水果、熟食",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "5.7",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "4",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "535",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 3,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "CP3",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "水、舒跑、可樂、水果",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "5.9",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 5,
          "rawCellOrdinal": 5,
          "text": "94",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 3,
          "column": 6,
          "rawCellOrdinal": 6,
          "text": "148",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 4,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 7
        },
        {
          "row": 4,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 7
        },
        {
          "row": 4,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 7
        },
        {
          "row": 4,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 7
        },
        {
          "row": 4,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 7
        },
        {
          "row": 4,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 7
        },
        {
          "row": 4,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 7
        }
      ]
    ],
    "checkpoints": [
      {
        "id": "songhe-trail-2026:lv3-20k:table-4:row-1",
        "name": "起點",
        "kind": "start",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-%e6%9d%be%e9%b6%b4%e8%b6%8a%e9%87%8e/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "songhe-trail-2026:lv3-20k:table-4:row-1",
          "sourceRow": 1,
          "kind": "start",
          "rawName": "起點",
          "reportedStationId": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "column_not_published"
          },
          "reportedNextLegDistanceKm": "8.5",
          "reportedNextLegDistanceSourceCell": {
            "row": 1,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "0",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": {
            "row": 1,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": null,
            "sourceCell": {
              "row": 1,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": "blank_published_cell"
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": {
              "row": 1,
              "column": 2,
              "rawCellOrdinal": 2
            },
            "unknownReason": "blank_published_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "songhe-trail-2026:lv3-20k:table-4:row-2",
        "name": "SP3",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": "12:00",
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-%e6%9d%be%e9%b6%b4%e8%b6%8a%e9%87%8e/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "songhe-trail-2026:lv3-20k:table-4:row-2",
          "sourceRow": 2,
          "kind": "checkpoint",
          "rawName": "SP3",
          "reportedStationId": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "column_not_published"
          },
          "reportedNextLegDistanceKm": "5.7",
          "reportedNextLegDistanceSourceCell": {
            "row": 2,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "8.5",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": "12:00",
          "cutoffSourceCell": {
            "row": 2,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": "水、舒跑、可樂、水果、熟食",
            "sourceCell": {
              "row": 2,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": null
          },
          "publishedMedicalMarker": {
            "text": "V",
            "sourceCell": {
              "row": 2,
              "column": 2,
              "rawCellOrdinal": 2
            },
            "unknownReason": null
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "songhe-trail-2026:lv3-20k:table-4:row-3",
        "name": "CP3",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-%e6%9d%be%e9%b6%b4%e8%b6%8a%e9%87%8e/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "songhe-trail-2026:lv3-20k:table-4:row-3",
          "sourceRow": 3,
          "kind": "checkpoint",
          "rawName": "CP3",
          "reportedStationId": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "column_not_published"
          },
          "reportedNextLegDistanceKm": "5.9",
          "reportedNextLegDistanceSourceCell": {
            "row": 3,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "14.2",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": {
            "row": 3,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": "水、舒跑、可樂、水果",
            "sourceCell": {
              "row": 3,
              "column": 3,
              "rawCellOrdinal": 3
            },
            "unknownReason": null
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": {
              "row": 3,
              "column": 2,
              "rawCellOrdinal": 2
            },
            "unknownReason": "blank_published_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "songhe-trail-2026:lv3-20k:table-4:row-4",
        "name": "終點",
        "kind": "finish",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-%e6%9d%be%e9%b6%b4%e8%b6%8a%e9%87%8e/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "songhe-trail-2026:lv3-20k:table-4:row-4",
          "sourceRow": 4,
          "kind": "finish",
          "rawName": "終點",
          "reportedStationId": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "column_not_published"
          },
          "reportedNextLegDistanceKm": null,
          "reportedNextLegDistanceSourceCell": null,
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "20.1",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": null,
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "covered_by_another_cell"
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "covered_by_another_cell"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      }
    ]
  },
  {
    "schema": "published-event-checkpoint-table/1",
    "id": "songhe-trail-2026:lv2-13k",
    "eventId": "songhe-trail-2026",
    "edition": 2026,
    "groupKey": "lv2-13k",
    "groupName": "13KM LV2",
    "reportedGroupLabel": "LV2 挑戰組",
    "nominalCategoryDistanceKm": "13",
    "sourceUrl": "https://dtpwow.run/races/2026-%e6%9d%be%e9%b6%b4%e8%b6%8a%e9%87%8e/",
    "sourceSha256": "bda03ee73fc465e9df203b1d6cd1bb9ff7d9c74b2a9bef65a312f389192c2e4c",
    "htmlTableOrdinal": 6,
    "rawTableSha256": "ef7ec583542f955f2cf438abc98da5dcc1bbe5bf3614d195c83c8e6dcabaeed1",
    "groupBinding": {
      "method": "immediately_preceding_group_description_table",
      "htmlTableOrdinal": 5,
      "headingText": "LV2 挑戰組(13KM) 爬升：600m 限時 5小時 AM08：45起跑 路線連結: https://ridewithgps.com/routes/53563584",
      "reportedGroupLabel": "LV2 挑戰組",
      "nominalCategoryDistanceKm": "13"
    },
    "routeVersion": "current_page_snapshot_handbook_has_precedence",
    "routeOriginalSha256": null,
    "routeMappingStatus": "not_connected_to_admitted_GPX",
    "positionAuthority": "none",
    "cutoffRuleMeaning": "published_pass_through_rule_arrival_vs_departure_not_established",
    "derivedLegTotalKm": "14",
    "header": [
      "位置名稱",
      "補給內容",
      "下站距離 單位 K公里",
      "爬升 單位 M公尺",
      "下降 單位 M公尺"
    ],
    "skippedRows": [],
    "rawGrid": [
      [
        {
          "row": 0,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "位置名稱",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "補給內容",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "下站距離 單位 K公里",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "爬升 單位 M公尺",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 0,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "下降 單位 M公尺",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 1,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "起點",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "8.1",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "447",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 1,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "393",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 2,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "CP3",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 1,
          "rawCellOrdinal": 1,
          "text": "水、舒跑、可樂、水果",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 2,
          "rawCellOrdinal": 2,
          "text": "5.9",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 3,
          "rawCellOrdinal": 3,
          "text": "94",
          "rowspan": 1,
          "colspan": 1
        },
        {
          "row": 2,
          "column": 4,
          "rawCellOrdinal": 4,
          "text": "148",
          "rowspan": 1,
          "colspan": 1
        }
      ],
      [
        {
          "row": 3,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 5
        },
        {
          "row": 3,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 5
        },
        {
          "row": 3,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 5
        },
        {
          "row": 3,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 5
        },
        {
          "row": 3,
          "column": 0,
          "rawCellOrdinal": 0,
          "text": "終點",
          "rowspan": 1,
          "colspan": 5
        }
      ]
    ],
    "checkpoints": [
      {
        "id": "songhe-trail-2026:lv2-13k:table-6:row-1",
        "name": "起點",
        "kind": "start",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-%e6%9d%be%e9%b6%b4%e8%b6%8a%e9%87%8e/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "songhe-trail-2026:lv2-13k:table-6:row-1",
          "sourceRow": 1,
          "kind": "start",
          "rawName": "起點",
          "reportedStationId": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "column_not_published"
          },
          "reportedNextLegDistanceKm": "8.1",
          "reportedNextLegDistanceSourceCell": {
            "row": 1,
            "column": 2,
            "rawCellOrdinal": 2
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "0",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": null,
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": null,
            "sourceCell": {
              "row": 1,
              "column": 1,
              "rawCellOrdinal": 1
            },
            "unknownReason": "blank_published_cell"
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "column_not_published"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "songhe-trail-2026:lv2-13k:table-6:row-2",
        "name": "CP3",
        "kind": "checkpoint",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-%e6%9d%be%e9%b6%b4%e8%b6%8a%e9%87%8e/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "songhe-trail-2026:lv2-13k:table-6:row-2",
          "sourceRow": 2,
          "kind": "checkpoint",
          "rawName": "CP3",
          "reportedStationId": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "column_not_published"
          },
          "reportedNextLegDistanceKm": "5.9",
          "reportedNextLegDistanceSourceCell": {
            "row": 2,
            "column": 2,
            "rawCellOrdinal": 2
          },
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "8.1",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": null,
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": "水、舒跑、可樂、水果",
            "sourceCell": {
              "row": 2,
              "column": 1,
              "rawCellOrdinal": 1
            },
            "unknownReason": null
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "column_not_published"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      },
      {
        "id": "songhe-trail-2026:lv2-13k:table-6:row-3",
        "name": "終點",
        "kind": "finish",
        "officialDistanceM": null,
        "cutoffReported": null,
        "cutoffLocal": null,
        "cutoffKind": null,
        "sourceUrl": "https://dtpwow.run/races/2026-%e6%9d%be%e9%b6%b4%e8%b6%8a%e9%87%8e/",
        "lat": null,
        "lon": null,
        "currentRoutePositionM": null,
        "stopSeconds": null,
        "published": {
          "occurrenceKey": "songhe-trail-2026:lv2-13k:table-6:row-3",
          "sourceRow": 3,
          "kind": "finish",
          "rawName": "終點",
          "reportedStationId": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "column_not_published"
          },
          "reportedNextLegDistanceKm": null,
          "reportedNextLegDistanceSourceCell": null,
          "reportedCumulativeDistanceM": null,
          "derivedCumulativeDistanceKm": "14",
          "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
          "cutoffClockText": null,
          "cutoffSourceCell": null,
          "cutoffLocal": null,
          "cutoffKind": null,
          "publishedServices": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "covered_by_another_cell"
          },
          "publishedMedicalMarker": {
            "text": null,
            "sourceCell": null,
            "unknownReason": "column_not_published"
          },
          "currentRoutePositionM": null,
          "lat": null,
          "lon": null,
          "stopSeconds": null
        }
      }
    ]
  },
{
  "schema": "published-event-checkpoint-table/1",
  "id": "wufeng-trail-2025:lv4-30k",
  "eventId": "wufeng-trail-2025",
  "edition": 2025,
  "groupKey": "lv4-30k",
  "groupName": "30KM LV4",
  "reportedGroupLabel": "LV4 高手組",
  "nominalCategoryDistanceKm": "30",
  "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
  "sourceSha256": "ef94f9b40229ea6580c6d6d5bc6ae802162a87a51cecaa9e6928b74340b1e103",
  "htmlTableOrdinal": 2,
  "rawTableSha256": "4dd56103a7ff6548430dd31344322ed19949015bce4fd740211fca240ce5090b",
  "groupBinding": {
    "method": "immediately_preceding_group_description_table",
    "htmlTableOrdinal": 1,
    "headingText": "LV4 高手組(30KM) 爬升：2241m 限時 10小時 06：30 AM 起跑 已申請通過 UTMB index50K GPX (依大會公告及手冊版本為準)",
    "reportedGroupLabel": "LV4 高手組",
    "nominalCategoryDistanceKm": "30"
  },
  "routeVersion": "current_page_snapshot_handbook_has_precedence",
  "routeOriginalSha256": null,
  "routeMappingStatus": "not_connected_to_admitted_GPX",
  "positionAuthority": "none",
  "cutoffRuleMeaning": "published_pass_through_rule_arrival_vs_departure_not_established",
  "derivedLegTotalKm": "29.8",
  "header": [
    "位置名稱",
    "CP",
    "關門時間",
    "醫護",
    "補給內容",
    "下站距離 單位 K公里",
    "爬升 單位 M公尺",
    "下降 單位 M公尺"
  ],
  "skippedRows": [],
  "rawGrid": [
    [
      {
        "row": 0,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "位置名稱",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "CP",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "關門時間",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "醫護",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "補給內容",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "下站距離 單位 K公里",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "爬升 單位 M公尺",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "下降 單位 M公尺",
        "rowspan": 1,
        "colspan": 1
      }
    ],
    [
      {
        "row": 1,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "起點",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "9.4",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "837",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "240",
        "rowspan": 1,
        "colspan": 1
      }
    ],
    [
      {
        "row": 2,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "鵝公髻(去程)",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "10:30",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "V",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "水、舒跑、可樂、水果、乾糧、熟食",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "4.4",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "740",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "45",
        "rowspan": 1,
        "colspan": 1
      }
    ],
    [
      {
        "row": 3,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "鵝公髻三角點",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "CP1",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "3.1",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "0",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "687",
        "rowspan": 1,
        "colspan": 1
      }
    ],
    [
      {
        "row": 4,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "鵝公髻(回程)",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "13:30",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "V",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "水、舒跑、可樂、水果、乾糧、熟食",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "4.6",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "143",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "379",
        "rowspan": 1,
        "colspan": 1
      }
    ],
    [
      {
        "row": 5,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "受北宮",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "CP3",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "15:30",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "V",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "水、舒跑、可樂、熟食",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "6.5",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "42",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "336",
        "rowspan": 1,
        "colspan": 1
      }
    ],
    [
      {
        "row": 6,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "上瑞社區",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 6,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "CP4",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 6,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 6,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 6,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "水、舒跑、可樂、水果、熟食",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 6,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "1.8",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 6,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "23",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 6,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "31",
        "rowspan": 1,
        "colspan": 1
      }
    ],
    [
      {
        "row": 7,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "終點",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 7,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 7,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 7,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 7,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 7,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 7,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 7,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      }
    ]
  ],
  "checkpoints": [
    {
      "id": "wufeng-trail-2025:lv4-30k:table-2:row-1",
      "name": "起點",
      "kind": "start",
      "officialDistanceM": null,
      "cutoffReported": null,
      "cutoffLocal": null,
      "cutoffKind": null,
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "lat": null,
      "lon": null,
      "currentRoutePositionM": null,
      "stopSeconds": null,
      "published": {
        "occurrenceKey": "wufeng-trail-2025:lv4-30k:table-2:row-1",
        "sourceRow": 1,
        "kind": "start",
        "rawName": "起點",
        "reportedStationId": {
          "text": null,
          "sourceCell": {
            "row": 1,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "unknownReason": "blank_published_cell"
        },
        "reportedNextLegDistanceKm": "9.4",
        "reportedNextLegDistanceSourceCell": {
          "row": 1,
          "column": 5,
          "rawCellOrdinal": 5
        },
        "reportedCumulativeDistanceM": null,
        "derivedCumulativeDistanceKm": "0",
        "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
        "cutoffClockText": null,
        "cutoffSourceCell": {
          "row": 1,
          "column": 2,
          "rawCellOrdinal": 2
        },
        "cutoffLocal": null,
        "cutoffKind": null,
        "publishedServices": {
          "text": null,
          "sourceCell": {
            "row": 1,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "unknownReason": "blank_published_cell"
        },
        "publishedMedicalMarker": {
          "text": null,
          "sourceCell": {
            "row": 1,
            "column": 3,
            "rawCellOrdinal": 3
          },
          "unknownReason": "blank_published_cell"
        },
        "currentRoutePositionM": null,
        "lat": null,
        "lon": null,
        "stopSeconds": null
      }
    },
    {
      "id": "wufeng-trail-2025:lv4-30k:table-2:row-2",
      "name": "鵝公髻(去程)",
      "kind": "checkpoint",
      "officialDistanceM": null,
      "cutoffReported": "10:30",
      "cutoffLocal": null,
      "cutoffKind": null,
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "lat": null,
      "lon": null,
      "currentRoutePositionM": null,
      "stopSeconds": null,
      "published": {
        "occurrenceKey": "wufeng-trail-2025:lv4-30k:table-2:row-2",
        "sourceRow": 2,
        "kind": "checkpoint",
        "rawName": "鵝公髻(去程)",
        "reportedStationId": {
          "text": null,
          "sourceCell": {
            "row": 2,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "unknownReason": "blank_published_cell"
        },
        "reportedNextLegDistanceKm": "4.4",
        "reportedNextLegDistanceSourceCell": {
          "row": 2,
          "column": 5,
          "rawCellOrdinal": 5
        },
        "reportedCumulativeDistanceM": null,
        "derivedCumulativeDistanceKm": "9.4",
        "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
        "cutoffClockText": "10:30",
        "cutoffSourceCell": {
          "row": 2,
          "column": 2,
          "rawCellOrdinal": 2
        },
        "cutoffLocal": null,
        "cutoffKind": null,
        "publishedServices": {
          "text": "水、舒跑、可樂、水果、乾糧、熟食",
          "sourceCell": {
            "row": 2,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "unknownReason": null
        },
        "publishedMedicalMarker": {
          "text": "V",
          "sourceCell": {
            "row": 2,
            "column": 3,
            "rawCellOrdinal": 3
          },
          "unknownReason": null
        },
        "currentRoutePositionM": null,
        "lat": null,
        "lon": null,
        "stopSeconds": null
      }
    },
    {
      "id": "wufeng-trail-2025:lv4-30k:table-2:row-3",
      "name": "鵝公髻三角點",
      "kind": "checkpoint",
      "officialDistanceM": null,
      "cutoffReported": null,
      "cutoffLocal": null,
      "cutoffKind": null,
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "lat": null,
      "lon": null,
      "currentRoutePositionM": null,
      "stopSeconds": null,
      "published": {
        "occurrenceKey": "wufeng-trail-2025:lv4-30k:table-2:row-3",
        "sourceRow": 3,
        "kind": "checkpoint",
        "rawName": "鵝公髻三角點",
        "reportedStationId": {
          "text": "CP1",
          "sourceCell": {
            "row": 3,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "unknownReason": null
        },
        "reportedNextLegDistanceKm": "3.1",
        "reportedNextLegDistanceSourceCell": {
          "row": 3,
          "column": 5,
          "rawCellOrdinal": 5
        },
        "reportedCumulativeDistanceM": null,
        "derivedCumulativeDistanceKm": "13.8",
        "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
        "cutoffClockText": null,
        "cutoffSourceCell": {
          "row": 3,
          "column": 2,
          "rawCellOrdinal": 2
        },
        "cutoffLocal": null,
        "cutoffKind": null,
        "publishedServices": {
          "text": null,
          "sourceCell": {
            "row": 3,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "unknownReason": "blank_published_cell"
        },
        "publishedMedicalMarker": {
          "text": null,
          "sourceCell": {
            "row": 3,
            "column": 3,
            "rawCellOrdinal": 3
          },
          "unknownReason": "blank_published_cell"
        },
        "currentRoutePositionM": null,
        "lat": null,
        "lon": null,
        "stopSeconds": null
      }
    },
    {
      "id": "wufeng-trail-2025:lv4-30k:table-2:row-4",
      "name": "鵝公髻(回程)",
      "kind": "checkpoint",
      "officialDistanceM": null,
      "cutoffReported": "13:30",
      "cutoffLocal": null,
      "cutoffKind": null,
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "lat": null,
      "lon": null,
      "currentRoutePositionM": null,
      "stopSeconds": null,
      "published": {
        "occurrenceKey": "wufeng-trail-2025:lv4-30k:table-2:row-4",
        "sourceRow": 4,
        "kind": "checkpoint",
        "rawName": "鵝公髻(回程)",
        "reportedStationId": {
          "text": null,
          "sourceCell": {
            "row": 4,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "unknownReason": "blank_published_cell"
        },
        "reportedNextLegDistanceKm": "4.6",
        "reportedNextLegDistanceSourceCell": {
          "row": 4,
          "column": 5,
          "rawCellOrdinal": 5
        },
        "reportedCumulativeDistanceM": null,
        "derivedCumulativeDistanceKm": "16.9",
        "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
        "cutoffClockText": "13:30",
        "cutoffSourceCell": {
          "row": 4,
          "column": 2,
          "rawCellOrdinal": 2
        },
        "cutoffLocal": null,
        "cutoffKind": null,
        "publishedServices": {
          "text": "水、舒跑、可樂、水果、乾糧、熟食",
          "sourceCell": {
            "row": 4,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "unknownReason": null
        },
        "publishedMedicalMarker": {
          "text": "V",
          "sourceCell": {
            "row": 4,
            "column": 3,
            "rawCellOrdinal": 3
          },
          "unknownReason": null
        },
        "currentRoutePositionM": null,
        "lat": null,
        "lon": null,
        "stopSeconds": null
      }
    },
    {
      "id": "wufeng-trail-2025:lv4-30k:table-2:row-5",
      "name": "受北宮",
      "kind": "checkpoint",
      "officialDistanceM": null,
      "cutoffReported": "15:30",
      "cutoffLocal": null,
      "cutoffKind": null,
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "lat": null,
      "lon": null,
      "currentRoutePositionM": null,
      "stopSeconds": null,
      "published": {
        "occurrenceKey": "wufeng-trail-2025:lv4-30k:table-2:row-5",
        "sourceRow": 5,
        "kind": "checkpoint",
        "rawName": "受北宮",
        "reportedStationId": {
          "text": "CP3",
          "sourceCell": {
            "row": 5,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "unknownReason": null
        },
        "reportedNextLegDistanceKm": "6.5",
        "reportedNextLegDistanceSourceCell": {
          "row": 5,
          "column": 5,
          "rawCellOrdinal": 5
        },
        "reportedCumulativeDistanceM": null,
        "derivedCumulativeDistanceKm": "21.5",
        "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
        "cutoffClockText": "15:30",
        "cutoffSourceCell": {
          "row": 5,
          "column": 2,
          "rawCellOrdinal": 2
        },
        "cutoffLocal": null,
        "cutoffKind": null,
        "publishedServices": {
          "text": "水、舒跑、可樂、熟食",
          "sourceCell": {
            "row": 5,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "unknownReason": null
        },
        "publishedMedicalMarker": {
          "text": "V",
          "sourceCell": {
            "row": 5,
            "column": 3,
            "rawCellOrdinal": 3
          },
          "unknownReason": null
        },
        "currentRoutePositionM": null,
        "lat": null,
        "lon": null,
        "stopSeconds": null
      }
    },
    {
      "id": "wufeng-trail-2025:lv4-30k:table-2:row-6",
      "name": "上瑞社區",
      "kind": "checkpoint",
      "officialDistanceM": null,
      "cutoffReported": null,
      "cutoffLocal": null,
      "cutoffKind": null,
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "lat": null,
      "lon": null,
      "currentRoutePositionM": null,
      "stopSeconds": null,
      "published": {
        "occurrenceKey": "wufeng-trail-2025:lv4-30k:table-2:row-6",
        "sourceRow": 6,
        "kind": "checkpoint",
        "rawName": "上瑞社區",
        "reportedStationId": {
          "text": "CP4",
          "sourceCell": {
            "row": 6,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "unknownReason": null
        },
        "reportedNextLegDistanceKm": "1.8",
        "reportedNextLegDistanceSourceCell": {
          "row": 6,
          "column": 5,
          "rawCellOrdinal": 5
        },
        "reportedCumulativeDistanceM": null,
        "derivedCumulativeDistanceKm": "28",
        "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
        "cutoffClockText": null,
        "cutoffSourceCell": {
          "row": 6,
          "column": 2,
          "rawCellOrdinal": 2
        },
        "cutoffLocal": null,
        "cutoffKind": null,
        "publishedServices": {
          "text": "水、舒跑、可樂、水果、熟食",
          "sourceCell": {
            "row": 6,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "unknownReason": null
        },
        "publishedMedicalMarker": {
          "text": null,
          "sourceCell": {
            "row": 6,
            "column": 3,
            "rawCellOrdinal": 3
          },
          "unknownReason": "blank_published_cell"
        },
        "currentRoutePositionM": null,
        "lat": null,
        "lon": null,
        "stopSeconds": null
      }
    },
    {
      "id": "wufeng-trail-2025:lv4-30k:table-2:row-7",
      "name": "終點",
      "kind": "finish",
      "officialDistanceM": null,
      "cutoffReported": null,
      "cutoffLocal": null,
      "cutoffKind": null,
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "lat": null,
      "lon": null,
      "currentRoutePositionM": null,
      "stopSeconds": null,
      "published": {
        "occurrenceKey": "wufeng-trail-2025:lv4-30k:table-2:row-7",
        "sourceRow": 7,
        "kind": "finish",
        "rawName": "終點",
        "reportedStationId": {
          "text": null,
          "sourceCell": {
            "row": 7,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "unknownReason": "blank_published_cell"
        },
        "reportedNextLegDistanceKm": null,
        "reportedNextLegDistanceSourceCell": {
          "row": 7,
          "column": 5,
          "rawCellOrdinal": 5
        },
        "reportedCumulativeDistanceM": null,
        "derivedCumulativeDistanceKm": "29.8",
        "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
        "cutoffClockText": null,
        "cutoffSourceCell": {
          "row": 7,
          "column": 2,
          "rawCellOrdinal": 2
        },
        "cutoffLocal": null,
        "cutoffKind": null,
        "publishedServices": {
          "text": null,
          "sourceCell": {
            "row": 7,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "unknownReason": "blank_published_cell"
        },
        "publishedMedicalMarker": {
          "text": null,
          "sourceCell": {
            "row": 7,
            "column": 3,
            "rawCellOrdinal": 3
          },
          "unknownReason": "blank_published_cell"
        },
        "currentRoutePositionM": null,
        "lat": null,
        "lon": null,
        "stopSeconds": null
      }
    }
  ]
},
{
  "schema": "published-event-checkpoint-table/1",
  "id": "wufeng-trail-2025:lv3-28k",
  "eventId": "wufeng-trail-2025",
  "edition": 2025,
  "groupKey": "lv3-28k",
  "groupName": "28KM LV3",
  "reportedGroupLabel": "LV3 進階組",
  "nominalCategoryDistanceKm": "28",
  "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
  "sourceSha256": "ef94f9b40229ea6580c6d6d5bc6ae802162a87a51cecaa9e6928b74340b1e103",
  "htmlTableOrdinal": 4,
  "rawTableSha256": "ded7e6b94ec2eca2249ff83f67a6153a633029ede1cf5ebe1a87be6500327f09",
  "groupBinding": {
    "method": "immediately_preceding_group_description_table",
    "htmlTableOrdinal": 3,
    "headingText": "LV3 進階組(28KM) 爬升：1755m 限時 9小時 07：00 AM 起跑 UTMB index20K 已申請通過 GPX(依大會公告及手冊版本為準)",
    "reportedGroupLabel": "LV3 進階組",
    "nominalCategoryDistanceKm": "28"
  },
  "routeVersion": "current_page_snapshot_handbook_has_precedence",
  "routeOriginalSha256": null,
  "routeMappingStatus": "not_connected_to_admitted_GPX",
  "positionAuthority": "none",
  "cutoffRuleMeaning": "published_pass_through_rule_arrival_vs_departure_not_established",
  "derivedLegTotalKm": "28.3",
  "header": [
    "位置名稱",
    "CP",
    "關門時間",
    "醫護",
    "補給內容",
    "下站距離 單位 K公里",
    "爬升 單位 M公尺",
    "下降 單位 M公尺"
  ],
  "skippedRows": [],
  "rawGrid": [
    [
      {
        "row": 0,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "位置名稱",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "CP",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "關門時間",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "醫護",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "補給內容",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "下站距離 單位 K公里",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "爬升 單位 M公尺",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "下降 單位 M公尺",
        "rowspan": 1,
        "colspan": 1
      }
    ],
    [
      {
        "row": 1,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "起點",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "9.4",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "837",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "240",
        "rowspan": 1,
        "colspan": 1
      }
    ],
    [
      {
        "row": 2,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "鵝公髻(去程)",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "11:00",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "V",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "水、舒跑、可樂、水果、乾糧、熟食",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "2.9",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "236",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "48",
        "rowspan": 1,
        "colspan": 1
      }
    ],
    [
      {
        "row": 3,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "折返點",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "CP2",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "2.8",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "45",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "219",
        "rowspan": 1,
        "colspan": 1
      }
    ],
    [
      {
        "row": 4,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "鵝公髻(回程)",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "13:00",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "V",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "水、舒跑、可樂、水果、乾糧、熟食",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "4.9",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "143",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "424",
        "rowspan": 1,
        "colspan": 1
      }
    ],
    [
      {
        "row": 5,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "受北宮",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "CP3",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "15:00",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "V",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "水、舒跑、可樂、乾糧、熟食",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "6.5",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "42",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "336",
        "rowspan": 1,
        "colspan": 1
      }
    ],
    [
      {
        "row": 6,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "上瑞社區",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 6,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "CP4",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 6,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 6,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 6,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "水、舒跑、可樂、水果、熟食",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 6,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "1.8",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 6,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "28",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 6,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "31",
        "rowspan": 1,
        "colspan": 1
      }
    ],
    [
      {
        "row": 7,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "終點",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 7,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 7,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 7,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 7,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 7,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 7,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 7,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      }
    ]
  ],
  "checkpoints": [
    {
      "id": "wufeng-trail-2025:lv3-28k:table-4:row-1",
      "name": "起點",
      "kind": "start",
      "officialDistanceM": null,
      "cutoffReported": null,
      "cutoffLocal": null,
      "cutoffKind": null,
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "lat": null,
      "lon": null,
      "currentRoutePositionM": null,
      "stopSeconds": null,
      "published": {
        "occurrenceKey": "wufeng-trail-2025:lv3-28k:table-4:row-1",
        "sourceRow": 1,
        "kind": "start",
        "rawName": "起點",
        "reportedStationId": {
          "text": null,
          "sourceCell": {
            "row": 1,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "unknownReason": "blank_published_cell"
        },
        "reportedNextLegDistanceKm": "9.4",
        "reportedNextLegDistanceSourceCell": {
          "row": 1,
          "column": 5,
          "rawCellOrdinal": 5
        },
        "reportedCumulativeDistanceM": null,
        "derivedCumulativeDistanceKm": "0",
        "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
        "cutoffClockText": null,
        "cutoffSourceCell": {
          "row": 1,
          "column": 2,
          "rawCellOrdinal": 2
        },
        "cutoffLocal": null,
        "cutoffKind": null,
        "publishedServices": {
          "text": null,
          "sourceCell": {
            "row": 1,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "unknownReason": "blank_published_cell"
        },
        "publishedMedicalMarker": {
          "text": null,
          "sourceCell": {
            "row": 1,
            "column": 3,
            "rawCellOrdinal": 3
          },
          "unknownReason": "blank_published_cell"
        },
        "currentRoutePositionM": null,
        "lat": null,
        "lon": null,
        "stopSeconds": null
      }
    },
    {
      "id": "wufeng-trail-2025:lv3-28k:table-4:row-2",
      "name": "鵝公髻(去程)",
      "kind": "checkpoint",
      "officialDistanceM": null,
      "cutoffReported": "11:00",
      "cutoffLocal": null,
      "cutoffKind": null,
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "lat": null,
      "lon": null,
      "currentRoutePositionM": null,
      "stopSeconds": null,
      "published": {
        "occurrenceKey": "wufeng-trail-2025:lv3-28k:table-4:row-2",
        "sourceRow": 2,
        "kind": "checkpoint",
        "rawName": "鵝公髻(去程)",
        "reportedStationId": {
          "text": null,
          "sourceCell": {
            "row": 2,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "unknownReason": "blank_published_cell"
        },
        "reportedNextLegDistanceKm": "2.9",
        "reportedNextLegDistanceSourceCell": {
          "row": 2,
          "column": 5,
          "rawCellOrdinal": 5
        },
        "reportedCumulativeDistanceM": null,
        "derivedCumulativeDistanceKm": "9.4",
        "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
        "cutoffClockText": "11:00",
        "cutoffSourceCell": {
          "row": 2,
          "column": 2,
          "rawCellOrdinal": 2
        },
        "cutoffLocal": null,
        "cutoffKind": null,
        "publishedServices": {
          "text": "水、舒跑、可樂、水果、乾糧、熟食",
          "sourceCell": {
            "row": 2,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "unknownReason": null
        },
        "publishedMedicalMarker": {
          "text": "V",
          "sourceCell": {
            "row": 2,
            "column": 3,
            "rawCellOrdinal": 3
          },
          "unknownReason": null
        },
        "currentRoutePositionM": null,
        "lat": null,
        "lon": null,
        "stopSeconds": null
      }
    },
    {
      "id": "wufeng-trail-2025:lv3-28k:table-4:row-3",
      "name": "折返點",
      "kind": "checkpoint",
      "officialDistanceM": null,
      "cutoffReported": null,
      "cutoffLocal": null,
      "cutoffKind": null,
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "lat": null,
      "lon": null,
      "currentRoutePositionM": null,
      "stopSeconds": null,
      "published": {
        "occurrenceKey": "wufeng-trail-2025:lv3-28k:table-4:row-3",
        "sourceRow": 3,
        "kind": "checkpoint",
        "rawName": "折返點",
        "reportedStationId": {
          "text": "CP2",
          "sourceCell": {
            "row": 3,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "unknownReason": null
        },
        "reportedNextLegDistanceKm": "2.8",
        "reportedNextLegDistanceSourceCell": {
          "row": 3,
          "column": 5,
          "rawCellOrdinal": 5
        },
        "reportedCumulativeDistanceM": null,
        "derivedCumulativeDistanceKm": "12.3",
        "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
        "cutoffClockText": null,
        "cutoffSourceCell": {
          "row": 3,
          "column": 2,
          "rawCellOrdinal": 2
        },
        "cutoffLocal": null,
        "cutoffKind": null,
        "publishedServices": {
          "text": null,
          "sourceCell": {
            "row": 3,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "unknownReason": "blank_published_cell"
        },
        "publishedMedicalMarker": {
          "text": null,
          "sourceCell": {
            "row": 3,
            "column": 3,
            "rawCellOrdinal": 3
          },
          "unknownReason": "blank_published_cell"
        },
        "currentRoutePositionM": null,
        "lat": null,
        "lon": null,
        "stopSeconds": null
      }
    },
    {
      "id": "wufeng-trail-2025:lv3-28k:table-4:row-4",
      "name": "鵝公髻(回程)",
      "kind": "checkpoint",
      "officialDistanceM": null,
      "cutoffReported": "13:00",
      "cutoffLocal": null,
      "cutoffKind": null,
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "lat": null,
      "lon": null,
      "currentRoutePositionM": null,
      "stopSeconds": null,
      "published": {
        "occurrenceKey": "wufeng-trail-2025:lv3-28k:table-4:row-4",
        "sourceRow": 4,
        "kind": "checkpoint",
        "rawName": "鵝公髻(回程)",
        "reportedStationId": {
          "text": null,
          "sourceCell": {
            "row": 4,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "unknownReason": "blank_published_cell"
        },
        "reportedNextLegDistanceKm": "4.9",
        "reportedNextLegDistanceSourceCell": {
          "row": 4,
          "column": 5,
          "rawCellOrdinal": 5
        },
        "reportedCumulativeDistanceM": null,
        "derivedCumulativeDistanceKm": "15.1",
        "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
        "cutoffClockText": "13:00",
        "cutoffSourceCell": {
          "row": 4,
          "column": 2,
          "rawCellOrdinal": 2
        },
        "cutoffLocal": null,
        "cutoffKind": null,
        "publishedServices": {
          "text": "水、舒跑、可樂、水果、乾糧、熟食",
          "sourceCell": {
            "row": 4,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "unknownReason": null
        },
        "publishedMedicalMarker": {
          "text": "V",
          "sourceCell": {
            "row": 4,
            "column": 3,
            "rawCellOrdinal": 3
          },
          "unknownReason": null
        },
        "currentRoutePositionM": null,
        "lat": null,
        "lon": null,
        "stopSeconds": null
      }
    },
    {
      "id": "wufeng-trail-2025:lv3-28k:table-4:row-5",
      "name": "受北宮",
      "kind": "checkpoint",
      "officialDistanceM": null,
      "cutoffReported": "15:00",
      "cutoffLocal": null,
      "cutoffKind": null,
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "lat": null,
      "lon": null,
      "currentRoutePositionM": null,
      "stopSeconds": null,
      "published": {
        "occurrenceKey": "wufeng-trail-2025:lv3-28k:table-4:row-5",
        "sourceRow": 5,
        "kind": "checkpoint",
        "rawName": "受北宮",
        "reportedStationId": {
          "text": "CP3",
          "sourceCell": {
            "row": 5,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "unknownReason": null
        },
        "reportedNextLegDistanceKm": "6.5",
        "reportedNextLegDistanceSourceCell": {
          "row": 5,
          "column": 5,
          "rawCellOrdinal": 5
        },
        "reportedCumulativeDistanceM": null,
        "derivedCumulativeDistanceKm": "20",
        "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
        "cutoffClockText": "15:00",
        "cutoffSourceCell": {
          "row": 5,
          "column": 2,
          "rawCellOrdinal": 2
        },
        "cutoffLocal": null,
        "cutoffKind": null,
        "publishedServices": {
          "text": "水、舒跑、可樂、乾糧、熟食",
          "sourceCell": {
            "row": 5,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "unknownReason": null
        },
        "publishedMedicalMarker": {
          "text": "V",
          "sourceCell": {
            "row": 5,
            "column": 3,
            "rawCellOrdinal": 3
          },
          "unknownReason": null
        },
        "currentRoutePositionM": null,
        "lat": null,
        "lon": null,
        "stopSeconds": null
      }
    },
    {
      "id": "wufeng-trail-2025:lv3-28k:table-4:row-6",
      "name": "上瑞社區",
      "kind": "checkpoint",
      "officialDistanceM": null,
      "cutoffReported": null,
      "cutoffLocal": null,
      "cutoffKind": null,
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "lat": null,
      "lon": null,
      "currentRoutePositionM": null,
      "stopSeconds": null,
      "published": {
        "occurrenceKey": "wufeng-trail-2025:lv3-28k:table-4:row-6",
        "sourceRow": 6,
        "kind": "checkpoint",
        "rawName": "上瑞社區",
        "reportedStationId": {
          "text": "CP4",
          "sourceCell": {
            "row": 6,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "unknownReason": null
        },
        "reportedNextLegDistanceKm": "1.8",
        "reportedNextLegDistanceSourceCell": {
          "row": 6,
          "column": 5,
          "rawCellOrdinal": 5
        },
        "reportedCumulativeDistanceM": null,
        "derivedCumulativeDistanceKm": "26.5",
        "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
        "cutoffClockText": null,
        "cutoffSourceCell": {
          "row": 6,
          "column": 2,
          "rawCellOrdinal": 2
        },
        "cutoffLocal": null,
        "cutoffKind": null,
        "publishedServices": {
          "text": "水、舒跑、可樂、水果、熟食",
          "sourceCell": {
            "row": 6,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "unknownReason": null
        },
        "publishedMedicalMarker": {
          "text": null,
          "sourceCell": {
            "row": 6,
            "column": 3,
            "rawCellOrdinal": 3
          },
          "unknownReason": "blank_published_cell"
        },
        "currentRoutePositionM": null,
        "lat": null,
        "lon": null,
        "stopSeconds": null
      }
    },
    {
      "id": "wufeng-trail-2025:lv3-28k:table-4:row-7",
      "name": "終點",
      "kind": "finish",
      "officialDistanceM": null,
      "cutoffReported": null,
      "cutoffLocal": null,
      "cutoffKind": null,
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "lat": null,
      "lon": null,
      "currentRoutePositionM": null,
      "stopSeconds": null,
      "published": {
        "occurrenceKey": "wufeng-trail-2025:lv3-28k:table-4:row-7",
        "sourceRow": 7,
        "kind": "finish",
        "rawName": "終點",
        "reportedStationId": {
          "text": null,
          "sourceCell": {
            "row": 7,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "unknownReason": "blank_published_cell"
        },
        "reportedNextLegDistanceKm": null,
        "reportedNextLegDistanceSourceCell": {
          "row": 7,
          "column": 5,
          "rawCellOrdinal": 5
        },
        "reportedCumulativeDistanceM": null,
        "derivedCumulativeDistanceKm": "28.3",
        "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
        "cutoffClockText": null,
        "cutoffSourceCell": {
          "row": 7,
          "column": 2,
          "rawCellOrdinal": 2
        },
        "cutoffLocal": null,
        "cutoffKind": null,
        "publishedServices": {
          "text": null,
          "sourceCell": {
            "row": 7,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "unknownReason": "blank_published_cell"
        },
        "publishedMedicalMarker": {
          "text": null,
          "sourceCell": {
            "row": 7,
            "column": 3,
            "rawCellOrdinal": 3
          },
          "unknownReason": "blank_published_cell"
        },
        "currentRoutePositionM": null,
        "lat": null,
        "lon": null,
        "stopSeconds": null
      }
    }
  ]
},
{
  "schema": "published-event-checkpoint-table/1",
  "id": "wufeng-trail-2025:lv2-19-3k",
  "eventId": "wufeng-trail-2025",
  "edition": 2025,
  "groupKey": "lv2-19-3k",
  "groupName": "19.3KM LV2",
  "reportedGroupLabel": "LV2 挑戰組",
  "nominalCategoryDistanceKm": "19.3",
  "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
  "sourceSha256": "ef94f9b40229ea6580c6d6d5bc6ae802162a87a51cecaa9e6928b74340b1e103",
  "htmlTableOrdinal": 6,
  "rawTableSha256": "a2a3862c0634580c05da2d46b3d3961e0c0127c22b9d2bed2cda6aec578973b5",
  "groupBinding": {
    "method": "immediately_preceding_group_description_table",
    "htmlTableOrdinal": 5,
    "headingText": "LV2 挑戰組(19.3KM) 爬升：1225M 限時 8小時 08：00 AM 起跑 UTMB index20K 已申請通過 GPX(依大會公告及手冊版本為準)",
    "reportedGroupLabel": "LV2 挑戰組",
    "nominalCategoryDistanceKm": "19.3"
  },
  "routeVersion": "current_page_snapshot_handbook_has_precedence",
  "routeOriginalSha256": null,
  "routeMappingStatus": "not_connected_to_admitted_GPX",
  "positionAuthority": "none",
  "cutoffRuleMeaning": "published_pass_through_rule_arrival_vs_departure_not_established",
  "derivedLegTotalKm": "19.3",
  "header": [
    "位置名稱",
    "CP",
    "關門時間",
    "醫護",
    "補給內容",
    "下站距離 單位 K公里",
    "爬升 單位 M公尺",
    "下降 單位 M公尺"
  ],
  "skippedRows": [
    {
      "sourceRow": 3,
      "reason": "all_cells_explicitly_blank"
    }
  ],
  "rawGrid": [
    [
      {
        "row": 0,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "位置名稱",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "CP",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "關門時間",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "醫護",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "補給內容",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "下站距離 單位 K公里",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "爬升 單位 M公尺",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 0,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "下降 單位 M公尺",
        "rowspan": 1,
        "colspan": 1
      }
    ],
    [
      {
        "row": 1,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "起點",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "9.3",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "802",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 1,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "376",
        "rowspan": 1,
        "colspan": 1
      }
    ],
    [
      {
        "row": 2,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "受北宮",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "CP3",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "13:30",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "V",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "水、舒跑、可樂、水果、乾糧、熟食",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "8.2",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "125",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 2,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "531",
        "rowspan": 1,
        "colspan": 1
      }
    ],
    [
      {
        "row": 3,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 3,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      }
    ],
    [
      {
        "row": 4,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "上瑞社區",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "CP4",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "水、舒跑、可樂、水果、熟食",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "1.8",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "28",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 4,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "31",
        "rowspan": 1,
        "colspan": 1
      }
    ],
    [
      {
        "row": 5,
        "column": 0,
        "rawCellOrdinal": 0,
        "text": "終點",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 1,
        "rawCellOrdinal": 1,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 2,
        "rawCellOrdinal": 2,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 3,
        "rawCellOrdinal": 3,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 4,
        "rawCellOrdinal": 4,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 5,
        "rawCellOrdinal": 5,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 6,
        "rawCellOrdinal": 6,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      },
      {
        "row": 5,
        "column": 7,
        "rawCellOrdinal": 7,
        "text": "",
        "rowspan": 1,
        "colspan": 1
      }
    ]
  ],
  "checkpoints": [
    {
      "id": "wufeng-trail-2025:lv2-19-3k:table-6:row-1",
      "name": "起點",
      "kind": "start",
      "officialDistanceM": null,
      "cutoffReported": null,
      "cutoffLocal": null,
      "cutoffKind": null,
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "lat": null,
      "lon": null,
      "currentRoutePositionM": null,
      "stopSeconds": null,
      "published": {
        "occurrenceKey": "wufeng-trail-2025:lv2-19-3k:table-6:row-1",
        "sourceRow": 1,
        "kind": "start",
        "rawName": "起點",
        "reportedStationId": {
          "text": null,
          "sourceCell": {
            "row": 1,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "unknownReason": "blank_published_cell"
        },
        "reportedNextLegDistanceKm": "9.3",
        "reportedNextLegDistanceSourceCell": {
          "row": 1,
          "column": 5,
          "rawCellOrdinal": 5
        },
        "reportedCumulativeDistanceM": null,
        "derivedCumulativeDistanceKm": "0",
        "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
        "cutoffClockText": null,
        "cutoffSourceCell": {
          "row": 1,
          "column": 2,
          "rawCellOrdinal": 2
        },
        "cutoffLocal": null,
        "cutoffKind": null,
        "publishedServices": {
          "text": null,
          "sourceCell": {
            "row": 1,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "unknownReason": "blank_published_cell"
        },
        "publishedMedicalMarker": {
          "text": null,
          "sourceCell": {
            "row": 1,
            "column": 3,
            "rawCellOrdinal": 3
          },
          "unknownReason": "blank_published_cell"
        },
        "currentRoutePositionM": null,
        "lat": null,
        "lon": null,
        "stopSeconds": null
      }
    },
    {
      "id": "wufeng-trail-2025:lv2-19-3k:table-6:row-2",
      "name": "受北宮",
      "kind": "checkpoint",
      "officialDistanceM": null,
      "cutoffReported": "13:30",
      "cutoffLocal": null,
      "cutoffKind": null,
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "lat": null,
      "lon": null,
      "currentRoutePositionM": null,
      "stopSeconds": null,
      "published": {
        "occurrenceKey": "wufeng-trail-2025:lv2-19-3k:table-6:row-2",
        "sourceRow": 2,
        "kind": "checkpoint",
        "rawName": "受北宮",
        "reportedStationId": {
          "text": "CP3",
          "sourceCell": {
            "row": 2,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "unknownReason": null
        },
        "reportedNextLegDistanceKm": "8.2",
        "reportedNextLegDistanceSourceCell": {
          "row": 2,
          "column": 5,
          "rawCellOrdinal": 5
        },
        "reportedCumulativeDistanceM": null,
        "derivedCumulativeDistanceKm": "9.3",
        "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
        "cutoffClockText": "13:30",
        "cutoffSourceCell": {
          "row": 2,
          "column": 2,
          "rawCellOrdinal": 2
        },
        "cutoffLocal": null,
        "cutoffKind": null,
        "publishedServices": {
          "text": "水、舒跑、可樂、水果、乾糧、熟食",
          "sourceCell": {
            "row": 2,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "unknownReason": null
        },
        "publishedMedicalMarker": {
          "text": "V",
          "sourceCell": {
            "row": 2,
            "column": 3,
            "rawCellOrdinal": 3
          },
          "unknownReason": null
        },
        "currentRoutePositionM": null,
        "lat": null,
        "lon": null,
        "stopSeconds": null
      }
    },
    {
      "id": "wufeng-trail-2025:lv2-19-3k:table-6:row-4",
      "name": "上瑞社區",
      "kind": "checkpoint",
      "officialDistanceM": null,
      "cutoffReported": null,
      "cutoffLocal": null,
      "cutoffKind": null,
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "lat": null,
      "lon": null,
      "currentRoutePositionM": null,
      "stopSeconds": null,
      "published": {
        "occurrenceKey": "wufeng-trail-2025:lv2-19-3k:table-6:row-4",
        "sourceRow": 4,
        "kind": "checkpoint",
        "rawName": "上瑞社區",
        "reportedStationId": {
          "text": "CP4",
          "sourceCell": {
            "row": 4,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "unknownReason": null
        },
        "reportedNextLegDistanceKm": "1.8",
        "reportedNextLegDistanceSourceCell": {
          "row": 4,
          "column": 5,
          "rawCellOrdinal": 5
        },
        "reportedCumulativeDistanceM": null,
        "derivedCumulativeDistanceKm": "17.5",
        "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
        "cutoffClockText": null,
        "cutoffSourceCell": {
          "row": 4,
          "column": 2,
          "rawCellOrdinal": 2
        },
        "cutoffLocal": null,
        "cutoffKind": null,
        "publishedServices": {
          "text": "水、舒跑、可樂、水果、熟食",
          "sourceCell": {
            "row": 4,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "unknownReason": null
        },
        "publishedMedicalMarker": {
          "text": null,
          "sourceCell": {
            "row": 4,
            "column": 3,
            "rawCellOrdinal": 3
          },
          "unknownReason": "blank_published_cell"
        },
        "currentRoutePositionM": null,
        "lat": null,
        "lon": null,
        "stopSeconds": null
      }
    },
    {
      "id": "wufeng-trail-2025:lv2-19-3k:table-6:row-5",
      "name": "終點",
      "kind": "finish",
      "officialDistanceM": null,
      "cutoffReported": null,
      "cutoffLocal": null,
      "cutoffKind": null,
      "sourceUrl": "https://dtpwow.run/races/2025-%E4%BA%94%E5%B3%B0%E8%B6%8A%E9%87%8E/",
      "lat": null,
      "lon": null,
      "currentRoutePositionM": null,
      "stopSeconds": null,
      "published": {
        "occurrenceKey": "wufeng-trail-2025:lv2-19-3k:table-6:row-5",
        "sourceRow": 5,
        "kind": "finish",
        "rawName": "終點",
        "reportedStationId": {
          "text": null,
          "sourceCell": {
            "row": 5,
            "column": 1,
            "rawCellOrdinal": 1
          },
          "unknownReason": "blank_published_cell"
        },
        "reportedNextLegDistanceKm": null,
        "reportedNextLegDistanceSourceCell": {
          "row": 5,
          "column": 5,
          "rawCellOrdinal": 5
        },
        "reportedCumulativeDistanceM": null,
        "derivedCumulativeDistanceKm": "19.3",
        "derivedDistanceMethod": "exact_decimal_sum_of_preceding_reported_next_leg_distances",
        "cutoffClockText": null,
        "cutoffSourceCell": {
          "row": 5,
          "column": 2,
          "rawCellOrdinal": 2
        },
        "cutoffLocal": null,
        "cutoffKind": null,
        "publishedServices": {
          "text": null,
          "sourceCell": {
            "row": 5,
            "column": 4,
            "rawCellOrdinal": 4
          },
          "unknownReason": "blank_published_cell"
        },
        "publishedMedicalMarker": {
          "text": null,
          "sourceCell": {
            "row": 5,
            "column": 3,
            "rawCellOrdinal": 3
          },
          "unknownReason": "blank_published_cell"
        },
        "currentRoutePositionM": null,
        "lat": null,
        "lon": null,
        "stopSeconds": null
      }
    }
  ]
}
]);
export function reviewedGridMatches(id,grid){const pin=TABLES.find(t=>t.id===id);return !!pin&&JSON.stringify(grid)===JSON.stringify(pin.rawGrid); }
export function attachPublishedCheckpointTables(event){const tables=TABLES.filter(t=>t.eventId===event.id);if(!tables.length)return event;return {...event,routes:event.routes.map(route=>{const table=tables.find(t=>t.groupName===route.name);return table?{...route,publishedCheckpointTable:table}:route;})};}
