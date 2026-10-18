#!/usr/bin/env python3
"""Stdlib-only tests for reproducibility, map contract, and parameter safety."""
import hashlib
import json
from pathlib import Path
import struct
import tempfile
import unittest
from generate_maps import produce, field


class GeoTileTests(unittest.TestCase):
    def test_repeatable_bytes_and_seed_sensitivity(self):
        with tempfile.TemporaryDirectory() as td:
            a, b, c = (Path(td) / name for name in ('a', 'b', 'c'))
            ra = produce(64, 6, 42, .4, a)
            rb = produce(64, 6, 42, .4, b)
            rc = produce(64, 6, 43, .4, c)
            self.assertEqual(ra['sha256'], rb['sha256'])
            self.assertNotEqual(ra['sha256']['height.png'], rc['sha256']['height.png'])
            self.assertGreater(ra['metrics']['height_stddev'], .025)
            self.assertEqual(set(ra['sha256']), set(rc['sha256']))
            for file, sha in ra['sha256'].items():
                data = (a / file).read_bytes()
                self.assertEqual(hashlib.sha256(data).hexdigest(), sha)
                self.assertTrue(data.startswith(b'\x89PNG\r\n\x1a\n'))
                self.assertEqual(struct.unpack('>II', data[16:24]), (64, 64))
            self.assertEqual(json.loads((a/'receipt.json').read_text())['inputs']['seed'], 42)

    def test_parity_and_wear_controls(self):
        p = field(.15, .23, 6, 42, .4)
        mirrored = field((1 + .85)/6, (1 + .77)/6, 6, 42, .4)
        self.assertTrue(0 <= p[0] <= 1 and 0 <= mirrored[0] <= 1)
        no_wear = field(.15, .23, 6, 42, 0)
        self.assertEqual(no_wear[4], 0)
        self.assertTrue(all(0 <= value <= 255 for value in p[3]))


if __name__ == '__main__':
    unittest.main()
