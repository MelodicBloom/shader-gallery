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

try:
    from jsonschema import Draft202012Validator
except ImportError:  # pragma: no cover - useful error is emitted at validation time
    Draft202012Validator = None

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SCHEMA = ROOT / "schemas" / "project-boundary-evidence.schema.json"
DEFAULT_VECTOR_DIMENSIONS = 1536
ALLOWED_VECTOR_MODELS = {"text-embedding-3-small", "text-embedding-3-large", "gemini-embedding-001", "test"}
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


def validate_envelope(envelope: dict[str, Any], schema_path: Path = DEFAULT_SCHEMA, vector_dimensions: int = DEFAULT_VECTOR_DIMENSIONS) -> list[str]:
    errors: list[str] = []
    schema = load_json(schema_path)
    if Draft202012Validator is None:
        raise IngestionError("jsonschema is required for envelope validation; install jsonschema")
    errors.extend(error.message for error in Draft202012Validator(schema).iter_errors(envelope))

    ids: dict[str, str] = {}
    for collection in ("projects", "repositories", "evidence", "relations"):
        for record in envelope.get(collection, []):
            record_id = record.get("id")
            if record_id in ids:
                errors.append(f"duplicate id: {record_id}")
            elif record_id:
                ids[record_id] = collection

    project_ids = {item.get("id") for item in envelope.get("projects", [])}
    repository_ids = {item.get("id") for item in envelope.get("repositories", [])}
    evidence_ids = {item.get("id") for item in envelope.get("evidence", [])}
    for repository in envelope.get("repositories", []):
        if repository.get("projectId") not in project_ids:
            errors.append(f"repository project endpoint unresolved: {repository.get('id')}")
    for evidence in envelope.get("evidence", []):
        if evidence.get("projectId") not in project_ids:
            errors.append(f"evidence project endpoint unresolved: {evidence.get('id')}")
        vector = evidence.get("vector")
        if vector:
            dimensions = vector.get("embeddingDimensions")
            embedding = vector.get("embedding")
            if dimensions != vector_dimensions:
                errors.append(f"vector dimensions mismatch for {evidence.get('id')}: {dimensions} != {vector_dimensions}")
            if not isinstance(embedding, list) or len(embedding) != dimensions:
                errors.append(f"vector embedding length mismatch for {evidence.get('id')}")
            if vector.get("embeddingModel") not in ALLOWED_VECTOR_MODELS:
                errors.append(f"vector model not allowlisted for {evidence.get('id')}")
    for relation in envelope.get("relations", []):
        source = relation.get("sourceId")
        target = relation.get("targetId")
        if source not in ids and source not in project_ids | repository_ids | evidence_ids:
            errors.append(f"relation endpoint unresolved: source={source}")
        if target not in ids and target not in project_ids | repository_ids | evidence_ids:
            errors.append(f"relation endpoint unresolved: target={target}")
        if relation.get("evidenceState") == "observed" and relation.get("confidence") is not None and relation["confidence"] < 0:
            errors.append(f"invalid observed relation confidence: {relation.get('id')}")
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
    authority = record.get("authority", {})
    return {
        **record,
        "authorityRepository": authority.get("repository"),
        "authorityRef": authority.get("ref"),
        "authoritySha": authority.get("sha"),
        "authorityPath": authority.get("path"),
        "ingestionRunId": run["id"],
        "sourceRef": run["sourceRef"],
    }


def ingest_manifest(envelope: dict[str, Any], mode: str = "dry-run", driver: Any = None,
                    database: str = "neo4j", vector_dimensions: int = DEFAULT_VECTOR_DIMENSIONS) -> dict[str, Any]:
    if mode not in {"dry-run", "write"}:
        raise IngestionError(f"unsupported mode: {mode}")
    errors = validate_envelope(envelope, vector_dimensions=vector_dimensions)
    findings = credential_findings(envelope)
    if findings:
        errors.extend("credential finding detected" for _ in findings)
    if errors:
        return {"status": "quarantined", "errors": errors, "metrics": {"neo4jMutationCount": 0}}
    if mode == "write":
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
            driver = GraphDatabase.driver(uri, auth=(username, password))

    mutations = 0
    if mode == "write":
        run = envelope["run"]
        with driver.session(database=database) as session:
            for statement in cypher_statements(vector_dimensions):
                session.run(statement).consume()
                mutations += 1
            session.run(
                "MERGE (r:Run {idempotencyKey:$idempotencyKey}) ON CREATE SET r.id=$id, r.startedAt=$startedAt, r.mode=$mode, r.status='started', r.sourceRef=$sourceRef, r.configVersion=$configVersion ON MATCH SET r.lastSeenAt=$observedAt",
                idempotencyKey=run["idempotencyKey"], id=run["id"], startedAt=run["startedAt"], mode=mode,
                sourceRef=run["sourceRef"], configVersion=run["configVersion"], observedAt=now_utc()).consume()
            mutations += 1
            for collection, label in (("projects", "Project"), ("repositories", "Repository"), ("evidence", "Evidence")):
                for record in envelope.get(collection, []):
                    params = node_parameters(record, run)
                    session.run(f"MERGE (n:{label} {{id:$id}}) SET n += $props", id=record["id"], props=params).consume()
                    mutations += 1
                    vector = record.get("vector")
                    if vector:
                        text_id = f"evidence-text:{record['id']}"
                        session.run("MERGE (t:EvidenceText {id:$id}) SET t += $props", id=text_id, props={**vector, "sourceEvidenceId": record["id"], "projectId": record["projectId"], "ingestionRunId": run["id"]}).consume()
                        session.run("MATCH (e:Evidence {id:$evidenceId}), (t:EvidenceText {id:$textId}) MERGE (e)-[:HAS_TEXT]->(t)", evidenceId=record["id"], textId=text_id).consume()
                        mutations += 2
            for relation in envelope.get("relations", []):
                relation_key = relation.get("relationKey") or sha256_text("|".join((relation["sourceId"], relation["type"], relation["targetId"], relation.get("observedAt", ""))))
                session.run("MATCH (s {id:$sourceId}), (t {id:$targetId}) MERGE (s)-[r:RELATED {relationKey:$relationKey}]->(t) SET r += $props", sourceId=relation["sourceId"], targetId=relation["targetId"], relationKey=relation_key, props={**relation, "relationKey": relation_key, "ingestionRunId": run["id"]}).consume()
                mutations += 1
            session.run("MATCH (r:Run {idempotencyKey:$key}) SET r.status='written', r.finishedAt=$finishedAt, r.neo4jMutationCount=$count", key=run["idempotencyKey"], finishedAt=now_utc(), count=mutations).consume()
            mutations += 1
        driver.close()
    return {"status": "written" if mode == "write" else "dry-run-complete", "errors": [], "metrics": {"neo4jMutationCount": mutations, "projects": len(envelope.get("projects", [])), "repositories": len(envelope.get("repositories", [])), "evidence": len(envelope.get("evidence", [])), "relations": len(envelope.get("relations", []))}}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--schema", type=Path, default=DEFAULT_SCHEMA)
    parser.add_argument("--database", default=os.getenv("NEO4J_DATABASE", "neo4j"))
    parser.add_argument("--vector-dimensions", type=int, default=int(os.getenv("NEO4J_VECTOR_DIMENSIONS", DEFAULT_VECTOR_DIMENSIONS)))
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--receipt", type=Path, required=True)
    args = parser.parse_args()
    if args.dry_run == args.write:
        parser.error("choose exactly one of --dry-run or --write")
    envelope = load_json(args.manifest)
    result = ingest_manifest(envelope, mode="write" if args.write else "dry-run", database=args.database, vector_dimensions=args.vector_dimensions)
    args.receipt.parent.mkdir(parents=True, exist_ok=True)
    args.receipt.write_text(json.dumps({"schemaVersion": "Neo4jIngestionReceipt/0.1.0", "observedAt": now_utc(), **result}, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    if result["status"] == "quarantined":
        raise SystemExit(2)

if __name__ == "__main__":
    main()
