#!/usr/bin/env python3
"""Validated, idempotent Neo4j evidence-envelope writer.

Default mode is dry-run. The writer never executes uploaded source files and
never accepts arbitrary Cypher from agents. Neo4j is imported lazily so dry-run
works without the neo4j Python dependency.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

try:
    from jsonschema import Draft202012Validator, FormatChecker
except ImportError:  # pragma: no cover - useful error is emitted at validation time
    Draft202012Validator = None

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SCHEMA = ROOT / "schemas" / "project-boundary-evidence.schema.json"
DEFAULT_VECTOR_DIMENSIONS = 1536
ALLOWED_VECTOR_MODELS = {"text-embedding-3-small", "text-embedding-3-large", "gemini-embedding-001", "test"}
NODE_LABELS = {"project": "Project", "repo": "Repository", "evidence": "Evidence"}
SECRET_PATTERNS = (
    re.compile(r"\bsk-[A-Za-z0-9_-]{20,}"),
    re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{20,}"),
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"(?i)\bBearer\s+[A-Za-z0-9._~-]{20,}"),
)

class IngestionError(RuntimeError):
    pass


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def sha256_text(value: str) -> str:
    return "sha256:" + hashlib.sha256(value.encode("utf-8")).hexdigest()


def build_run_key(config_version: str, database: str, source_ref: str, manifest_hash: str) -> str:
    return sha256_text("|".join((config_version, database, source_ref, manifest_hash)))


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _records(envelope: dict[str, Any], collection: str) -> list[dict[str, Any]]:
    """Return only structurally traversable records; schema validation remains authoritative."""
    value = envelope.get(collection) if isinstance(envelope, dict) else None
    if not isinstance(value, list):
        return []
    return [record for record in value if isinstance(record, dict)]


def _authority(record: dict[str, Any]) -> dict[str, Any]:
    value = record.get("authority")
    return value if isinstance(value, dict) else {}


def _is_placeholder_sha(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    return value in {"0" * len(value), "a" * len(value)}


def validate_envelope(
    envelope: dict[str, Any],
    schema_path: Path = DEFAULT_SCHEMA,
    vector_dimensions: int = DEFAULT_VECTOR_DIMENSIONS,
    allow_canonical: bool = False,
) -> list[str]:
    errors: list[str] = []
    if vector_dimensions <= 0:
        errors.append("vector dimensions must be positive")
    if not isinstance(envelope, dict):
        return ["manifest root must be an object"]
    if Draft202012Validator is None or FormatChecker is None:
        raise IngestionError("jsonschema with format checking is required for envelope validation")
    schema = load_json(schema_path)
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    errors.extend(error.message for error in validator.iter_errors(envelope))

    for collection in ("projects", "repositories", "evidence", "relations"):
        value = envelope.get(collection)
        if not isinstance(value, list):
            errors.append(f"{collection} must be an array")
            continue
        for index, record in enumerate(value):
            if not isinstance(record, dict):
                errors.append(f"{collection}[{index}] must be an object")

    all_ids: dict[str, str] = {}
    node_ids: set[str] = set()
    for collection in ("projects", "repositories", "evidence", "relations"):
        for record in _records(envelope, collection):
            record_id = record.get("id")
            if record_id in all_ids and record_id:
                errors.append(f"duplicate id: {record_id}")
            elif record_id:
                all_ids[record_id] = collection
            if collection != "relations" and record_id:
                node_ids.add(record_id)

    projects = _records(envelope, "projects")
    repositories = _records(envelope, "repositories")
    evidence_records = _records(envelope, "evidence")
    relations = _records(envelope, "relations")

    project_ids = {item.get("id") for item in projects if item.get("id")}
    project_for_id: dict[str, str] = {item["id"]: item["id"] for item in projects if item.get("id")}
    for repository in repositories:
        rid = repository.get("id")
        pid = repository.get("projectId")
        if pid not in project_ids:
            errors.append(f"repository project endpoint unresolved: {rid}")
        elif rid:
            project_for_id[rid] = pid
    for evidence in evidence_records:
        eid = evidence.get("id")
        pid = evidence.get("projectId")
        if pid not in project_ids:
            errors.append(f"evidence project endpoint unresolved: {eid}")
        elif eid:
            project_for_id[eid] = pid

    for collection, records in (("projects", projects), ("repositories", repositories), ("evidence", evidence_records)):
        for record in records:
            rights = record.get("rightsStatus")
            if rights == "rejected":
                errors.append(f"rightsStatus=rejected is not ingestible: {record.get('id')}")
            status = record.get("status")
            if collection == "evidence" and status == "canonical" and not allow_canonical:
                errors.append(f"canonical evidence requires explicit promotion authorization: {record.get('id')}")
            sha = _authority(record).get("sha")
            if _is_placeholder_sha(sha):
                errors.append(f"placeholder authority SHA is not accepted: {record.get('id')}")

            if collection == "evidence":
                vector = record.get("vector")
                if vector:
                    dimensions = vector.get("embeddingDimensions")
                    embedding = vector.get("embedding")
                    if dimensions != vector_dimensions:
                        errors.append(
                            f"vector dimensions mismatch for {record.get('id')}: {dimensions} != {vector_dimensions}"
                        )
                    if not isinstance(embedding, list) or len(embedding) != dimensions:
                        errors.append(f"vector embedding length mismatch for {record.get('id')}")
                    if vector.get("embeddingModel") not in ALLOWED_VECTOR_MODELS:
                        errors.append(f"vector model not allowlisted for {record.get('id')}")

    for relation in relations:
        source = relation.get("sourceId")
        target = relation.get("targetId")
        for side, endpoint in (("source", source), ("target", target)):
            if endpoint not in node_ids:
                if not isinstance(endpoint, str) or not endpoint or endpoint.split(":", 1)[0] not in NODE_LABELS:
                    errors.append(f"relation endpoint unresolved: {side}={endpoint}")
        relation_project = relation.get("projectId")
        if relation.get("evidenceState") != "proposed":
            known_projects = {project_for_id.get(source), project_for_id.get(target)}
            if relation_project not in {p for p in known_projects if p}:
                if source in project_for_id or target in project_for_id:
                    errors.append(
                        f"relation project boundary violation: {relation.get('id')} -> {relation_project}"
                    )
    return errors


def credential_findings(envelope: dict[str, Any]) -> list[str]:
    serialized = json.dumps(envelope, sort_keys=True)
    return [pattern.pattern for pattern in SECRET_PATTERNS if pattern.search(serialized)]


def cypher_statements(vector_dimensions: int = DEFAULT_VECTOR_DIMENSIONS) -> list[str]:
    return [
        "CREATE CONSTRAINT project_id IF NOT EXISTS FOR (n:Project) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT repository_id IF NOT EXISTS FOR (n:Repository) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT run_id IF NOT EXISTS FOR (n:Run) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT run_idempotency IF NOT EXISTS FOR (n:Run) REQUIRE n.idempotencyKey IS UNIQUE",
        "CREATE CONSTRAINT evidence_id IF NOT EXISTS FOR (n:Evidence) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT evidence_text_id IF NOT EXISTS FOR (n:EvidenceText) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT relation_key IF NOT EXISTS FOR ()-[r:RELATED]-() REQUIRE r.relationKey IS UNIQUE",
        "CREATE INDEX repository_project IF NOT EXISTS FOR (n:Repository) ON (n.projectId)",
        "CREATE INDEX evidence_project IF NOT EXISTS FOR (n:Evidence) ON (n.projectId)",
        "CREATE INDEX evidence_observed IF NOT EXISTS FOR (n:Evidence) ON (n.observedAt)",
        "CREATE FULLTEXT INDEX evidence_text_search IF NOT EXISTS FOR (n:Evidence|EvidenceText|Project|Repository) ON EACH [n.name, n.title, n.summary, n.text, n.tagsText]",
        f"CREATE VECTOR INDEX evidence_text_embedding IF NOT EXISTS FOR (n:EvidenceText) ON n.embedding OPTIONS {{indexConfig: {{`vector.dimensions`: {vector_dimensions}, `vector.similarity_function`: 'cosine'}}}}",
    ]


def node_parameters(record: dict[str, Any], run: dict[str, Any]) -> dict[str, Any]:
    scope = record.get("scope", {}) if isinstance(record.get("scope", {}), dict) else {}
    authority = _authority(record)
    props = {
        key: value
        for key, value in record.items()
        if key not in {"authority", "scope", "vector"} and not isinstance(value, dict)
    }
    props.update({
        "scopeProjectId": scope.get("projectId"),
        "scopeParentProjectId": scope.get("parentProjectId"),
        "scopeSourceClass": scope.get("sourceClass"),
        "scopeAuthorityRepository": (scope.get("authority") or {}).get("repository") if isinstance(scope.get("authority"), dict) else None,
        "scopeAuthorityRef": (scope.get("authority") or {}).get("ref") if isinstance(scope.get("authority"), dict) else None,
        "scopeAuthoritySha": (scope.get("authority") or {}).get("sha") if isinstance(scope.get("authority"), dict) else None,
        "authorityRepository": authority.get("repository"),
        "authorityRef": authority.get("ref"),
        "authoritySha": authority.get("sha"),
        "authorityPath": authority.get("path"),
        "ingestionRunId": run["id"],
        "sourceRef": run["sourceRef"],
    })
    return {k: v for k, v in props.items() if v is not None}


def _label_for_id(record_id: str) -> str:
    prefix = record_id.split(":", 1)[0] if ":" in record_id else ""
    if prefix not in NODE_LABELS:
        raise IngestionError(f"unsupported relation endpoint id prefix: {record_id}")
    return NODE_LABELS[prefix]


def _result_single(result: Any) -> Any:
    if hasattr(result, "single"):
        return result.single()
    try:
        return next(iter(result), None)
    except TypeError:
        return None


def _preflight_immutable_records(tx: Any, envelope: dict[str, Any]) -> None:
    for collection, label in (("projects", "Project"), ("repositories", "Repository"), ("evidence", "Evidence")):
        for record in _records(envelope, collection):
            existing = _result_single(
                tx.run(
                    f"MATCH (n:{label} {{id:$id}}) RETURN n.contentHash AS contentHash, n.authoritySha AS authoritySha LIMIT 1",
                    id=record["id"],
                )
            )
            if not existing:
                continue
            incoming_hash = record.get("contentHash")
            incoming_sha = _authority(record).get("sha")
            existing_hash = existing.get("contentHash") if hasattr(existing, "get") else existing["contentHash"]
            existing_sha = existing.get("authoritySha") if hasattr(existing, "get") else existing["authoritySha"]
            if incoming_hash and existing_hash and incoming_hash != existing_hash:
                raise IngestionError(f"immutable record conflict: contentHash changed for {record['id']}")
            if incoming_sha and existing_sha and incoming_sha != existing_sha:
                raise IngestionError(f"immutable record conflict: authority SHA changed for {record['id']}")


def _preflight_relation_endpoints(tx: Any, envelope: dict[str, Any]) -> None:
    node_ids = {
        record.get("id")
        for collection in ("projects", "repositories", "evidence")
        for record in _records(envelope, collection)
        if record.get("id")
    }
    project_for_id = {
        record["id"]: record["id"]
        for record in _records(envelope, "projects")
        if record.get("id")
    }
    for collection in ("repositories", "evidence"):
        for record in _records(envelope, collection):
            if record.get("id") and record.get("projectId"):
                project_for_id[record["id"]] = record["projectId"]

    for relation in _records(envelope, "relations"):
        resolved_projects: dict[str, str | None] = {}
        for side in ("sourceId", "targetId"):
            endpoint = relation.get(side)
            if endpoint in node_ids:
                resolved_projects[endpoint] = project_for_id.get(endpoint)
                continue
            label = _label_for_id(endpoint)
            row = _result_single(
                tx.run(
                    f"MATCH (n:{label} {{id:$id}}) RETURN n.projectId AS projectId, n.id AS id LIMIT 1",
                    id=endpoint,
                )
            )
            if not row:
                raise IngestionError(f"relation endpoint missing from envelope and database: {endpoint}")
            project_id = row.get("projectId") if hasattr(row, "get") else row["projectId"]
            resolved_projects[endpoint] = project_id or (endpoint if label == "Project" else None)

        if relation.get("evidenceState") != "proposed":
            relation_project = relation.get("projectId")
            if relation_project not in {p for p in resolved_projects.values() if p}:
                raise IngestionError(f"relation project boundary violation: {relation['id']}")


def _write_node(tx: Any, label: str, record: dict[str, Any], run: dict[str, Any]) -> int:
    props = node_parameters(record, run)
    result = tx.run(
        f"MERGE (n:{label} {{id:$id}}) ON CREATE SET n += $props RETURN n.id AS id",
        id=record["id"],
        props=props,
    )
    result.consume() if hasattr(result, "consume") else None
    return 1


def _write_relation(tx: Any, relation: dict[str, Any], run: dict[str, Any]) -> int:
    source_id = relation["sourceId"]
    target_id = relation["targetId"]
    source_label = _label_for_id(source_id)
    target_label = _label_for_id(target_id)
    relation_key = relation.get("relationKey") or sha256_text("|".join((
        source_id, relation["type"], target_id, relation.get("observedAt", "")
    )))
    props = {key: value for key, value in relation.items() if not isinstance(value, dict)}
    props["relationKey"] = relation_key
    props["ingestionRunId"] = run["id"]
    result = tx.run(
        f"MATCH (s:{source_label} {{id:$sourceId}}), (t:{target_label} {{id:$targetId}}) "
        "MERGE (s)-[r:RELATED {relationKey:$relationKey}]->(t) ON CREATE SET r += $props",
        sourceId=source_id,
        targetId=target_id,
        relationKey=relation_key,
        props=props,
    )
    result.consume() if hasattr(result, "consume") else None
    return 1


def _uri_is_remote(uri: str) -> bool:
    parsed = urlparse(uri)
    host = (parsed.hostname or "").lower()
    return host not in {"", "localhost", "127.0.0.1", "::1"}


def _validate_neo4j_uri(uri: str, require_tls_for_remote: bool = True) -> None:
    parsed = urlparse(uri)
    if parsed.scheme not in {"neo4j", "neo4j+s", "neo4j+ssc", "bolt", "bolt+s", "bolt+ssc"}:
        raise IngestionError(f"unsupported Neo4j URI scheme: {parsed.scheme}")
    if require_tls_for_remote and _uri_is_remote(uri) and parsed.scheme in {"neo4j", "bolt"}:
        raise IngestionError("remote Neo4j connections require TLS (neo4j+s, neo4j+ssc, bolt+s, or bolt+ssc)")


def _run_metadata(envelope: dict[str, Any], database: str) -> dict[str, Any]:
    run = envelope.get("run", {})
    return {
        "id": run.get("id"),
        "idempotencyKey": run.get("idempotencyKey"),
        "mode": run.get("mode"),
        "startedAt": run.get("startedAt"),
        "sourceRef": run.get("sourceRef"),
        "configVersion": run.get("configVersion"),
        "operator": run.get("operator"),
        "database": database,
    }


def manifest_digest(envelope: dict[str, Any]) -> str:
    normalized = json.loads(json.dumps(envelope, sort_keys=True))
    run = normalized.get("run")
    if isinstance(run, dict):
        run.pop("idempotencyKey", None)
    return sha256_text(json.dumps(normalized, sort_keys=True, separators=(",", ":")))


def _total_records(envelope: dict[str, Any]) -> int:
    return sum(len(_records(envelope, c)) for c in ("projects", "repositories", "evidence", "relations"))


def ingest_manifest(
    envelope: dict[str, Any],
    mode: str = "dry-run",
    driver: Any = None,
    database: str = "neo4j",
    vector_dimensions: int = DEFAULT_VECTOR_DIMENSIONS,
    schema_path: Path = DEFAULT_SCHEMA,
) -> dict[str, Any]:
    if mode not in {"dry-run", "write"}:
        raise IngestionError(f"unsupported mode: {mode}")
    if vector_dimensions <= 0:
        raise IngestionError("vector dimensions must be positive")

    errors = validate_envelope(
        envelope,
        schema_path=schema_path,
        vector_dimensions=vector_dimensions,
        allow_canonical=False,
    )
    findings = credential_findings(envelope)
    if findings:
        errors.extend("credential finding detected" for _ in findings)

    run = envelope.get("run", {}) if isinstance(envelope, dict) else {}
    source_ref = run.get("sourceRef")
    config_version = run.get("configVersion")
    supplied_key = run.get("idempotencyKey")
    expected_key = (
        build_run_key(config_version, database, source_ref, manifest_digest(envelope))
        if config_version and source_ref and supplied_key
        else None
    )
    if expected_key and supplied_key != expected_key:
        errors.append("idempotencyKey does not match the deterministic manifest-derived run key")

    if errors:
        return {
            "status": "quarantined",
            "errors": errors,
            "metrics": {
                "neo4jMutationCount": 0,
                "acceptedCount": 0,
                "rejectedCount": _total_records(envelope),
                "schemaInvalidCount": len(errors),
                "credentialCount": len(findings),
                "unsafeArchiveCount": 0,
            },
            "run": _run_metadata(envelope, database),
        }

    if mode == "dry-run":
        return {
            "status": "dry-run-complete",
            "errors": [],
            "metrics": {
                "neo4jMutationCount": 0,
                "acceptedCount": _total_records(envelope),
                "rejectedCount": 0,
                "schemaInvalidCount": 0,
                "credentialCount": 0,
                "unsafeArchiveCount": 0,
            },
            "run": _run_metadata(envelope, database),
        }

    if os.getenv("INGESTION_ALLOW_WRITE", "false").lower() != "true":
        raise IngestionError("write mode requires INGESTION_ALLOW_WRITE=true")
    if driver is None:
        try:
            from neo4j import GraphDatabase
        except ImportError as exc:
            raise IngestionError("neo4j package required for write mode") from exc
        uri = os.environ.get("NEO4J_URI")
        username = os.environ.get("NEO4J_USERNAME")
        password = os.environ.get("NEO4J_PASSWORD")
        if not all((uri, username, password)):
            raise IngestionError("NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD are required")
        _validate_neo4j_uri(uri, require_tls_for_remote=True)
        driver = GraphDatabase.driver(uri, auth=(username, password))

    run_meta = _run_metadata(envelope, database)
    mutations = 0
    try:
        with driver.session(database=database) as session:
            existing_run = _result_single(
                session.run(
                    "MATCH (r:Run {idempotencyKey:$idempotencyKey}) RETURN r.id AS id, r.status AS status LIMIT 1",
                    idempotencyKey=run["idempotencyKey"],
                )
            )
            if existing_run:
                existing_id = existing_run.get("id") if hasattr(existing_run, "get") else existing_run["id"]
                existing_status = existing_run.get("status") if hasattr(existing_run, "get") else existing_run["status"]
                if existing_id != run["id"]:
                    raise IngestionError("run id conflicts with existing idempotency key")
                if existing_status == "written":
                    return {
                        "status": "already-written",
                        "errors": [],
                        "metrics": {
                            "neo4jMutationCount": 0,
                            "acceptedCount": _total_records(envelope),
                            "rejectedCount": 0,
                            "schemaInvalidCount": 0,
                            "credentialCount": 0,
                            "unsafeArchiveCount": 0,
                        },
                        "run": run_meta,
                    }
                raise IngestionError(f"existing run is not safely replayable: {existing_status}")

            tx = session.begin_transaction()
            try:
                for statement in cypher_statements(vector_dimensions):
                    result = tx.run(statement)
                    result.consume() if hasattr(result, "consume") else None
                    mutations += 1

                _preflight_relation_endpoints(tx, envelope)
                _preflight_immutable_records(tx, envelope)

                tx.run(
                    "CREATE (r:Run {id:$id, idempotencyKey:$idempotencyKey, startedAt:$startedAt, "
                    "mode:$mode, status:'started', sourceRef:$sourceRef, configVersion:$configVersion, operator:$operator})",
                    id=run["id"],
                    idempotencyKey=run["idempotencyKey"],
                    startedAt=run["startedAt"],
                    mode=mode,
                    sourceRef=run["sourceRef"],
                    configVersion=run["configVersion"],
                    operator=run.get("operator"),
                ).consume()

                for collection, label in (("projects", "Project"), ("repositories", "Repository"), ("evidence", "Evidence")):
                    for record in _records(envelope, collection):
                        mutations += _write_node(tx, label, record, run)

                for relation in _records(envelope, "relations"):
                    mutations += _write_relation(tx, relation, run)

                accepted = _total_records(envelope)
                tx.run(
                    "MATCH (r:Run {idempotencyKey:$key}) "
                    "SET r.status='written', r.finishedAt=$finishedAt, r.acceptedCount=$acceptedCount, "
                    "r.rejectedCount=0, r.schemaInvalidCount=0, r.credentialCount=0, "
                    "r.unsafeArchiveCount=0, r.neo4jMutationCount=$count, r.summary=$summary",
                    key=run["idempotencyKey"],
                    finishedAt=now_utc(),
                    acceptedCount=accepted,
                    count=mutations + 1,
                    summary=f"Ingested {accepted} records with zero validation, credential, and archive findings.",
                ).consume()
                mutations += 1
                tx.commit()
            except Exception:
                try:
                    tx.rollback()
                finally:
                    raise
    finally:
        driver.close()

    return {
        "status": "written",
        "errors": [],
        "metrics": {
            "neo4jMutationCount": mutations,
            "acceptedCount": _total_records(envelope),
            "rejectedCount": 0,
            "schemaInvalidCount": 0,
            "credentialCount": 0,
            "unsafeArchiveCount": 0,
        },
        "run": run_meta,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--schema", type=Path, default=DEFAULT_SCHEMA)
    parser.add_argument("--database", default=os.getenv("NEO4J_DATABASE", "neo4j"))
    parser.add_argument("--vector-dimensions", type=int, default=int(os.getenv("NEO4J_VECTOR_DIMENSIONS", DEFAULT_VECTOR_DIMENSIONS)))
    parser.add_argument("--dry-run", action="store_true", help="Run validation without Neo4j mutations (default).")
    parser.add_argument("--write", action="store_true", help="Enable explicit Neo4j writes.")
    parser.add_argument("--receipt", type=Path, required=True)
    args = parser.parse_args()
    if args.dry_run and args.write:
        parser.error("choose at most one of --dry-run or --write")
    if args.vector_dimensions <= 0:
        parser.error("--vector-dimensions must be a positive integer")
    envelope = load_json(args.manifest)
    mode = "write" if args.write else "dry-run"
    try:
        result = ingest_manifest(
            envelope,
            mode=mode,
            database=args.database,
            vector_dimensions=args.vector_dimensions,
            schema_path=args.schema,
        )
    except Exception as exc:
        result = {
            "status": "failed",
            "errors": [str(exc)],
            "metrics": {
                "neo4jMutationCount": 0,
                "acceptedCount": 0,
                "rejectedCount": _total_records(envelope),
                "schemaInvalidCount": 0,
                "credentialCount": len(credential_findings(envelope)),
                "unsafeArchiveCount": 0,
            },
            "run": _run_metadata(envelope, args.database),
        }
    args.receipt.parent.mkdir(parents=True, exist_ok=True)
    args.receipt.write_text(
        json.dumps(
            {"schemaVersion": "Neo4jIngestionReceipt/0.1.0", "observedAt": now_utc(), **result},
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(result, indent=2))
    if result["status"] in {"quarantined", "failed"}:
        raise SystemExit(2)

if __name__ == "__main__":
    main()
