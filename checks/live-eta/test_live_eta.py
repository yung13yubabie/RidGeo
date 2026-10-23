"""Synthetic canonical route adapter checks; no personal activity data."""
import base64
import copy
import json
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'public/python'))
from live_eta import handle_request
from trail_planner import build_geometry, parse_gpx


def gpx(times=False, elevation=True):
    points = ''.join(f'<trkpt lat="{25+i*.001}" lon="121">' +
                     (f'<ele>{100+i*10}</ele>' if elevation else '') +
                     ('<time>2000-01-01T00:00:00Z</time>' if times else '') + '</trkpt>' for i in range(11))
    return ('<gpx version="1.1" creator="synthetic-test" xmlns="http://www.topografix.com/GPX/1/1"><trk><trkseg>'+points+'</trkseg></trk></gpx>').encode()


class LiveEtaTests(unittest.TestCase):
    def setUp(self):
        self.data = gpx()
        self.geometry = build_geometry(parse_gpx(self.data))
        self.request = {'gpx_b64': base64.b64encode(self.data).decode(), 'owner_revision': 'route-1/session-1', 'settings': {
            'geometry_sha256': self.geometry.geometry_sha256, 'start_distance_m': 0,
            'progress_distance_m': 500, 'target_distance_m': 1000, 'target_id': 'cp-1',
            'moving_seconds': 1800, 'elapsed_seconds': 2400, 'moving_source': 'manual',
            'future_stop_seconds': None, 'slowdown_factor': 1, 'now_utc': '2026-10-23T04:00:00Z'}}

    def run_request(self):
        return json.loads(handle_request(json.dumps(self.request)))

    def result(self):
        response = self.run_request()
        self.assertTrue(response['ok'], response)
        return response['result']

    def test_equal_halves_and_unknown_stops(self):
        r = self.result()
        self.assertEqual(r['quality'], 'unvalidated')
        self.assertAlmostEqual(r['remaining_moving_seconds'], 1800, places=5)
        self.assertIsNone(r['remaining_elapsed_seconds'])
        self.assertIsNone(r['arrival_utc'])
        self.assertEqual(r['owner_revision'], 'route-1/session-1')

    def test_explicit_stops_and_slowdown(self):
        self.request['settings'].update(future_stop_seconds=600, slowdown_factor=2)
        r = self.result()
        self.assertAlmostEqual(r['remaining_moving_seconds'], 3600, places=5)
        self.assertAlmostEqual(r['remaining_elapsed_seconds'], 4200, places=5)
        self.assertTrue(r['arrival_utc'].startswith('2026-10-23T05:10:'))

    def test_start_offset(self):
        self.request['settings'].update(start_distance_m=250, progress_distance_m=500, target_distance_m=750)
        self.assertAlmostEqual(self.result()['remaining_moving_seconds'], 1800, places=5)

    def test_target_reached_and_passed(self):
        self.request['settings']['target_distance_m'] = 500
        self.assertEqual(self.result()['quality'], 'finished')
        self.request['settings']['target_distance_m'] = 499
        self.assertEqual(self.result()['suppression'], 'destination_passed')

    def test_route_binding(self):
        self.request['settings']['geometry_sha256'] = '0'*64
        self.assertEqual(self.run_request()['error']['code'], 'live_eta_route_changed')

    def test_timestamp_discard(self):
        before = self.result()
        self.request['gpx_b64'] = base64.b64encode(gpx(times=True)).decode()
        self.assertEqual(self.result(), before)

    def test_missing_elevation(self):
        data = gpx(elevation=False)
        self.request['gpx_b64'] = base64.b64encode(data).decode()
        self.request['settings']['geometry_sha256'] = build_geometry(parse_gpx(data)).geometry_sha256
        self.assertEqual(self.result()['suppression'], 'missing_measurement')

    def test_thresholds(self):
        self.request['settings']['moving_seconds'] = 59
        self.assertEqual(self.result()['suppression'], 'insufficient_baseline')
        self.request['settings'].update(moving_seconds=1800, progress_distance_m=24)
        self.assertEqual(self.result()['suppression'], 'insufficient_baseline')

    def test_moving_not_elapsed(self):
        self.request['settings']['moving_seconds'] = None
        self.assertEqual(self.result()['suppression'], 'missing_measurement')
        self.request['settings']['moving_seconds'] = 2401
        self.assertEqual(self.result()['suppression'], 'invalid_input')

    def test_invalid_numbers_and_ranges(self):
        for key,value in [('progress_distance_m', True), ('moving_seconds', -1), ('target_distance_m', 99999),
                          ('progress_distance_m', float('nan')), ('slowdown_factor', 0.5)]:
            with self.subTest(key=key,value=value):
                original = copy.deepcopy(self.request)
                self.request['settings'][key] = value
                self.assertFalse(self.run_request()['ok'])
                self.request = original

    def test_strict_request(self):
        self.request['settings']['gps'] = {'lat':25, 'lon':121}
        self.assertFalse(self.run_request()['ok'])

    def test_admission_rejects_xml_entity(self):
        self.request['gpx_b64'] = base64.b64encode(b'<!DOCTYPE gpx [<!ENTITY x "boom">]><gpx/>').decode()
        self.assertFalse(self.run_request()['ok'])


if __name__ == '__main__':
    unittest.main()
