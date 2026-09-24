#!/usr/bin/env python3
"""Read-only workspace inventory for the federated evidence graph.

The scanner hashes files, inspects archive member names without extracting them,
validates generated artifact records, and reports credential-pattern findings
without serializing matched values. It never writes to Neo4j or executes input.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import re
import tarfile
import zipfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SECRET_PATTERNS = (
    ("openai_api_key", re.compile(r"\bsk-[A-Za-z0-9_-]{20,}")),
    ("github_token", re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{20,}")),
    ("aws_access_key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("private_key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")),
    ("bearer_token", re.compile(r"(?i)\bBearer\s+[A-Za-z0-9._~-]{20,}")),
    (
        "generic_secret_assignment",
        re.compile(
            r"(?i)\b(api[_-]?key|secret|token|password)\s*[:=]\s*[\"']?[A-Za-z0-9_./+=-]{16,}"
        ),
    ),
)

DEFAULT_SCHEMA = Path(__file__).resolve().parents[1] / "schemas" / "ecosystem-graph-record.schema.json"
IGNORED_DIRECTORY_NAMES = {".git", "node_modules", "__pycache__", ".venv", "venv"}
IGNORED_RELATIVE_PREFIXES = {("artifacts", "evidence-graph")}


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return "sha256:" + digest.hexdigest()


def _text_sample(path: Path, limit: int = 4 * 1024 * 1024) -> str:
    try:
        with path.open("rb") as stream:
            raw = stream.read(limit)
        if b"\x00" in raw[:4096]:
            return ""
        return raw.decode("utf-8", errors="ignore")
    except OSError:
        return ""


def _credential_findings(path: Path) -> list[dict[str, Any]]:
    text = _text_sample(path)
    findings: list[dict[str, Any]] = []
    if not text:
        return findings
    for finding_type, pattern in SECRET_PATTERNS:
        match = pattern.search(text)
        if match:
            findings.append(
                {
                    "type": finding_type,
                    "line": text.count("\n", 0, match.start()) + 1,
                }
            )
    return findings


def _archive_findings(path: Path) -> dict[str, Any] | None:
    lower = path.name.lower()
    if path.suffix.lower() not in {".zip", ".tar", ".gz", ".tgz"} and not lower.endswith(".tar.gz"):
        return None
    result: dict[str, Any] = {"members": 0, "unsafeMembers": [], "encrypted": False, "error": None}
    try:
        if path.suffix.lower() == ".zip":
            with zipfile.ZipFile(path) as archive:
                members = archive.infolist()
                result["members"] = len(members)
                result["encrypted"] = any(item.flag_bits & 0x1 for item in members)
                for item in members:
                    name = item.filename.replace("\\", "/")
                    if name.startswith("/") or ".." in Path(name).parts:
                        result["unsafeMembers"].append(name[:240])
        else:
            with tarfile.open(path, "r:*") as archive:
                members = archive.getmembers()
                result["members"] = len(members)
                for item in members:
                    name = item.name.replace("\\", "/")
                    if name.startswith("/") or ".." in Path(name).parts or item.issym() or item.islnk():
                        result["unsafeMembers"].append(name[:240])
    except (OSError, tarfile.TarError, zipfile.BadZipFile) as error:
        result["error"] = type(error).__name__
    return result


def _json_type_matches(value: Any, expected: str) -> bool:
    return {
        "object": isinstance(value, dict),
        "array": isinstance(value, list),
        "string": isinstance(value, str),
        "number": isinstance(value, (int, float)) and not isinstance(value, bool),
        "integer": isinstance(value, int) and not isinstance(value, bool),
        "boolean": isinstance(value, bool),
        "null": value is None,
    }.get(expected, True)


def _validate_schema_value(value: Any, schema: dict[str, Any], path: str = "$") -> list[str]:
    """Validate the JSON Schema features used by the graph-record contract.

    This intentionally has no third-party dependency so the dry-run remains
    runnable in the same minimal Python environment as the GitHub workflow.
    Unsupported schema keywords are not silently treated as assertions; the
    contract currently uses only the keywords implemented below.
    """
    errors: list[str] = []
    expected_type = schema.get("type")
    if expected_type and not _json_type_matches(value, expected_type):
        errors.append(f"{path}:type:{expected_type}")
        return errors
    if "const" in schema and value != schema["const"]:
        errors.append(f"{path}:const")
    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{path}:enum")
    if isinstance(value, str):
        if len(value) < schema.get("minLength", 0):
            errors.append(f"{path}:minLength")
        if "pattern" in schema and not re.search(schema["pattern"], value):
            errors.append(f"{path}:pattern")
        if schema.get("format") == "date-time":
            try:
                datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                errors.append(f"{path}:format:date-time")
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if value < schema.get("minimum", value):
            errors.append(f"{path}:minimum")
        if value > schema.get("maximum", value):
            errors.append(f"{path}:maximum")
    if isinstance(value, list):
        if len(value) < schema.get("minItems", 0):
            errors.append(f"{path}:minItems")
        if "maxItems" in schema and len(value) > schema["maxItems"]:
            errors.append(f"{path}:maxItems")
        if schema.get("uniqueItems"):
            canonical = [json.dumps(item, sort_keys=True, separators=(",", ":")) for item in value]
            if len(canonical) != len(set(canonical)):
                errors.append(f"{path}:uniqueItems")
        item_schema = schema.get("items")
        if isinstance(item_schema, dict):
            for index, item in enumerate(value):
                errors.extend(_validate_schema_value(item, item_schema, f"{path}[{index}]"))
    if isinstance(value, dict):
        for field in schema.get("required", []):
            if field not in value:
                errors.append(f"{path}:required:{field}")
        properties = schema.get("properties", {})
        if schema.get("additionalProperties") is False:
            for field in value:
                if field not in properties:
                    errors.append(f"{path}:additionalProperties:{field}")
        for field, field_schema in properties.items():
            if field in value:
                errors.extend(_validate_schema_value(value[field], field_schema, f"{path}.{field}"))
    return errors


def _validate_record(record: dict[str, Any], schema: dict[str, Any]) -> list[str]:
    return _validate_schema_value(record, schema)


def _is_ignored(path: Path, root: Path) -> bool:
    relative_parts = path.relative_to(root).parts
    if any(part in IGNORED_DIRECTORY_NAMES for part in relative_parts):
        return True
    return any(relative_parts[: len(prefix)] == prefix for prefix in IGNORED_RELATIVE_PREFIXES)


def scan_workspace(root: Path, schema_path: Path = DEFAULT_SCHEMA) -> dict[str, Any]:
    root = root.resolve()
    schema_path = schema_path.resolve()
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    observed_at = _utc_now()
    files = sorted(path for path in root.rglob("*") if path.is_file() and not _is_ignored(path, root))
    seen_hashes: dict[str, str] = {}
    rows: list[dict[str, Any]] = []
    credential_files: list[dict[str, Any]] = []
    unsafe_archives: list[dict[str, Any]] = []
    error_families: Counter[str] = Counter()
    file_types: Counter[str] = Counter()

    for path in files:
        relative = path.relative_to(root).as_posix()
        content_hash = _sha256(path)
        file_types[path.suffix.lower() or "[none]"] += 1
        findings = _credential_findings(path)
        archive = _archive_findings(path)
        errors: list[str] = []
        if findings:
            credential_files.append({"file": relative, "findings": findings})
            errors.append("SEC-001:credential-pattern-detected")
        if archive and archive["unsafeMembers"]:
            unsafe_archives.append({"file": relative, "members": archive["unsafeMembers"]})
            errors.append("SEC-004:unsafe-archive-member")

        duplicate_of = seen_hashes.get(content_hash)
        if duplicate_of is None:
            seen_hashes[content_hash] = relative

        record = {
            "id": f"artifact:workspace/{relative}@{content_hash}",
            "kind": "artifact",
            "version": "0.1.0",
            "status": "rejected" if errors else "proposed",
            "evidenceClass": "EMPIRICAL",
            "provenance": {
                "contentHash": content_hash,
                "observedAt": observed_at,
                "actor": "neo4j-mcp-dry-run",
                "sourceFiles": [relative],
                "toolVersions": ["workspace-ingestion-dry-run/0.1.0"],
                "rightsStatus": "rejected" if errors else "unknown",
            },
            "relations": (
                [
                    {
                        "type": "derived_from",
                        "target": f"artifact:workspace/{duplicate_of}@{content_hash}",
                        "evidenceState": "observed",
                        "confidence": 1.0,
                    }
                ]
                if duplicate_of
                else []
            ),
            "unknowns": ["repository authority", "license"],
        }
        schema_errors = _validate_record(record, schema)
        errors.extend(schema_errors)
        for error in errors:
            error_families[error.split(":", 1)[0]] += 1
        rows.append(
            {
                "file": relative,
                "bytes": path.stat().st_size,
                "extension": path.suffix.lower() or "[none]",
                "mime": mimetypes.guess_type(path.name)[0] or "application/octet-stream",
                "hash": content_hash,
                "duplicateOf": duplicate_of,
                "status": record["status"],
                "schemaValid": not schema_errors,
                "ingestEligible": not errors,
                "errors": errors,
                "secretFindingTypes": [item["type"] for item in findings],
                "archive": archive,
                "record": record,
            }
        )

    accepted = sum(1 for row in rows if row["ingestEligible"])
    rejected = len(rows) - accepted
    return {
        "metrics": {
            "runId": "run:dry-run:" + observed_at,
            "mode": "read-only; no Neo4j writes; no archive extraction; no uploaded code execution",
            "observedAt": observed_at,
            "inputFiles": len(files),
            "uniqueContentObjects": len(seen_hashes),
            "duplicateAliases": len(files) - len(seen_hashes),
            "acceptedForGraphWrite": accepted,
            "rejectedOrQuarantined": rejected,
            "schemaValidRecords": sum(1 for row in rows if row["schemaValid"]),
            "schemaInvalidRecords": sum(1 for row in rows if not row["schemaValid"]),
            "credentialFiles": len(credential_files),
            "unsafeArchives": len(unsafe_archives),
            "archiveCount": sum(1 for row in rows if row["archive"] is not None),
            "archiveMembersInspected": sum((row["archive"] or {}).get("members", 0) for row in rows),
            "errorFamilies": dict(error_families),
            "fileTypes": dict(file_types),
            "schemaPath": (
                schema_path.relative_to(root).as_posix()
                if schema_path.is_relative_to(root)
                else schema_path.name
            ),
            "credentialPolicy": "patterns detected; secret values never serialized",
            "neo4jMutationCount": 0,
        },
        "credentialFindings": credential_files,
        "unsafeArchiveFindings": unsafe_archives,
        "files": rows,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path, help="workspace directory to scan")
    parser.add_argument("--schema", type=Path, default=DEFAULT_SCHEMA)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    report = scan_workspace(args.root, args.schema)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report["metrics"], indent=2))


if __name__ == "__main__":
    main()
