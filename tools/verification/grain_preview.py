"""Measure the served grain route against a committed Git snapshot."""

import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
from http.client import HTTPException
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import threading
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, ProxyHandler, Request, build_opener

ROOT = Path(__file__).resolve().parents[2]
ROUTE = "/library-v1/ports/grain/"
FILES = {
    "index.html": ("text/html",),
    "styles.css": ("text/css",),
    "app.mjs": ("text/javascript", "application/javascript"),
    "contract.mjs": ("text/javascript", "application/javascript"),
    "renderer.mjs": ("text/javascript", "application/javascript"),
    "shader.glsl": (),
    "reference/rough-paper.svg": ("image/svg+xml",),
    "provenance.json": ("application/json",),
}
MISSING = "__grain_probe_missing__.mjs"
TIMEOUT = 8
MAX_BYTES = 256 * 1024


def git(*args):
    return subprocess.run(
        ["git", "-C", str(ROOT), *args], check=True, capture_output=True,
    ).stdout


def expected_files(revision):
    return {
        name: hashlib.sha256(git("show", f"{revision}:{ROUTE[1:]}{name}")).hexdigest()
        for name in FILES
    }


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class LocalFiles(SimpleHTTPRequestHandler):
    # Keep module MIME stable across Python host MIME databases.
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".mjs": "text/javascript"}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, *args):
        pass


@contextmanager
def local_origin():
    with ThreadingHTTPServer(("127.0.0.1", 0), LocalFiles) as server:
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            yield f"http://127.0.0.1:{server.server_port}"
        finally:
            server.shutdown()
            thread.join()


def check_response(opener, url, expected_hash, accepted_types):
    started = time.monotonic()
    row = {"url": url, "expected_sha256": expected_hash}
    try:
        request = Request(url, headers={"Accept-Encoding": "identity", "Cache-Control": "no-cache"})
        try:
            response = opener.open(request, timeout=TIMEOUT)
        except HTTPError as error:
            response = error
        with response:
            status = response.code
            row.update(http_status=status, content_type=response.headers.get_content_type())
            if status in (401, 403, 429) or status >= 500:
                row.update(state="blocked", reason="Host access, rate limit, or service error")
            elif expected_hash is None:
                row.update(state="pass" if status == 404 else "fail", reason="Expected missing route (404)")
            elif status != 200:
                row.update(state="fail", reason="Expected a direct 200 response")
            else:
                body = response.read(MAX_BYTES + 1)
                row.update(bytes=len(body), sha256=hashlib.sha256(body).hexdigest())
                if len(body) > MAX_BYTES:
                    row.update(state="fail", reason="Response exceeds size limit")
                elif row["sha256"] != expected_hash:
                    row.update(state="fail", reason="Served bytes differ from the Git snapshot")
                elif accepted_types and row["content_type"] not in accepted_types:
                    row.update(state="fail", reason="Unexpected content type")
                else:
                    row.update(state="pass", reason="Git bytes and applicable content type match")
    except (URLError, OSError, HTTPException) as error:
        row.update(state="blocked", reason=f"{type(error).__name__}: {error}")
    row["elapsed_ms"] = round((time.monotonic() - started) * 1000, 1)
    return row


def measure(base, hashes, *, local):
    opener = build_opener(NoRedirect(), *([ProxyHandler({})] if local else []))
    route_url = base.rstrip("/") + ROUTE
    checks = {
        name: check_response(opener, route_url + ("" if name == "index.html" else name),
                             hashes[name], accepted)
        for name, accepted in FILES.items()
    }
    checks[MISSING] = check_response(opener, route_url + MISSING, None, ())
    return checks


def write_receipt(output, receipt):
    output.parent.mkdir(parents=True, exist_ok=True)
    # Exclusive creation preserves the prior receipt on repeat or concurrent runs.
    with output.open("x", encoding="utf-8") as stream:
        json.dump(receipt, stream, indent=2)
        stream.write("\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, required=True, help="new JSON receipt path")
    parser.add_argument("--revision", help="expected 40-character Git commit, defaults to HEAD")
    parser.add_argument("--base-url", help="existing HTTPS preview URL, including any mount prefix")
    parser.add_argument("--deployment-id", help="named deployment recorded by the reviewer")
    args = parser.parse_args()
    if bool(args.base_url) != bool(args.deployment_id):
        parser.error("--base-url and --deployment-id must be supplied together")
    if args.base_url:
        try:
            base = urlsplit(args.base_url)
        except ValueError:
            parser.error("--base-url is malformed")
        if (base.scheme != "https" or not base.hostname or base.username or base.password
                or base.query or base.fragment):
            parser.error("--base-url must be HTTPS without credentials, query, or fragment")
    if args.revision and not re.fullmatch("[0-9a-f]{40}", args.revision):
        parser.error("--revision must be a full lowercase Git SHA")
    if args.out.exists():
        parser.error("--out must be a new file")

    head = git("rev-parse", "HEAD").decode().strip()
    revision = args.revision or head
    try:
        hashes = expected_files(revision)
    except subprocess.CalledProcessError:
        parser.error("commit or a required grain route file is missing from Git")
    dirty = bool(git("status", "--porcelain", "--untracked-files=normal").strip())
    if args.base_url:
        target = args.base_url.rstrip("/")
        checks = measure(target, hashes, local=False)
    else:
        with local_origin() as target:
            checks = measure(target, hashes, local=True)
    counts = {state: sum(row["state"] == state for row in checks.values())
              for state in ("pass", "fail", "blocked")}
    result = "fail" if counts["fail"] else "blocked" if counts["blocked"] else "pass"
    receipt = {
        "schema_version": 1,
        "workflow": "svg-glsl-grain-route-evidence",
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "mode": "hosted" if args.base_url else "local",
        "base_url": target,
        "deployment_id_reported_by_reviewer": args.deployment_id,
        "expected_git_revision": revision,
        "checkout_head": head,
        "checkout_dirty_before_measurement": dirty,
        "python": sys.version.split()[0],
        "ci_run": os.getenv("GITHUB_RUN_ID"),
        "ci_run_attempt": os.getenv("GITHUB_RUN_ATTEMPT"),
        "counts": counts,
        "result": result,
        "checks": checks,
        "open_gates": [
            "Named review of grain scale, contrast, and material character",
            "Browser/GPU and real-device evidence for the target environment",
            "Hosted verification of this route" if not args.base_url or result != "pass"
            else "Deployment metadata verification for whole-commit identity",
        ],
    }
    write_receipt(args.out, receipt)
    print(f"{result}: {counts['pass']}/{len(checks)} checks passed; receipt {args.out}")
    return {"pass": 0, "fail": 1, "blocked": 2}[result]


if __name__ == "__main__":
    sys.exit(main())
