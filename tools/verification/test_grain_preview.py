"""Controls for the grain evidence gate using a real loopback HTTP server."""

from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import hashlib
import json
from pathlib import Path
import tempfile
import threading
import unittest

import grain_preview as gate


@contextmanager
def fixture(responses):
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            name = self.path.removeprefix(gate.ROUTE) or "index.html"
            status, mime, body = responses.get(name, (404, "text/plain", b"missing"))
            self.send_response(status)
            self.send_header("Content-Type", mime)
            if status == 302:
                self.send_header("Location", gate.ROUTE)
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *args):
            pass

    with ThreadingHTTPServer(("127.0.0.1", 0), Handler) as server:
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            yield f"http://127.0.0.1:{server.server_port}"
        finally:
            server.shutdown()
            thread.join()


class GateTests(unittest.TestCase):
    def setUp(self):
        self.responses = {
            name: (200, types[0] if types else "text/plain", name.encode())
            for name, types in gate.FILES.items()
        }
        self.hashes = {
            name: hashlib.sha256(body).hexdigest()
            for name, (_, _, body) in self.responses.items()
        }

    def probe(self):
        with fixture(self.responses) as base:
            return gate.measure(base, self.hashes, local=True)

    def test_complete_match(self):
        checks = self.probe()
        self.assertEqual(set(checks), set(gate.FILES) | {gate.MISSING})
        self.assertTrue(all(row["state"] == "pass" for row in checks.values()))

    def test_wrong_bytes_and_mime_are_independent_failures(self):
        self.responses["app.mjs"] = 200, "text/javascript", b"stale source"
        self.responses["contract.mjs"] = 200, "text/html", b"contract.mjs"
        rows = self.probe()
        self.assertIn("differ", rows["app.mjs"]["reason"])
        self.assertIn("content type", rows["contract.mjs"]["reason"])
        self.assertEqual([rows[name]["state"] for name in ("app.mjs", "contract.mjs")],
                         ["fail", "fail"])

    def test_missing_asset_and_soft_404_fail(self):
        del self.responses["renderer.mjs"]
        self.responses[gate.MISSING] = 200, "text/html", b"soft 404"
        rows = self.probe()
        self.assertEqual(rows["renderer.mjs"]["http_status"], 404)
        self.assertEqual(rows["renderer.mjs"]["state"], "fail")
        self.assertEqual(rows[gate.MISSING]["state"], "fail")

    def test_access_denial_is_blocked_and_redirect_is_not_followed(self):
        self.responses["app.mjs"] = 401, "text/html", b"protected"
        self.responses["contract.mjs"] = 302, "text/html", b"redirect"
        rows = self.probe()
        self.assertEqual(rows["app.mjs"]["state"], "blocked")
        self.assertEqual(rows["contract.mjs"]["http_status"], 302)
        self.assertEqual(rows["contract.mjs"]["state"], "fail")

    def test_receipt_cannot_overwrite_prior_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "receipt.json"
            gate.write_receipt(output, {"result": "pass"})
            with self.assertRaises(FileExistsError):
                gate.write_receipt(output, {"result": "fail"})
            self.assertEqual(json.loads(output.read_text()), {"result": "pass"})


if __name__ == "__main__":
    unittest.main()
