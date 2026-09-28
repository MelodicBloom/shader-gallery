# Specification: Federated Neo4j Evidence Ingestion

## Objective

Provide a deterministic, idempotent, provenance-preserving Python ingestion writer for the project-boundary/evidence envelope. It must validate records, quarantine unsafe input, support dry-run by default, write only with an explicit flag, and create a single Neo4j logical graph with a bounded vector index over redacted evidence text.

## Capability map

| Module | Responsibility | Depends on |
|---|---|---|
| envelope-validation | JSON Schema and cross-record validation | existing schemas |
| graph-bootstrap | constraints, indexes, full-text index, vector index | Neo4j |
| ingestion-writer | idempotent runs, nodes, relations, receipts | validation, bootstrap |
| vector-projection | chunked evidence text and embedding metadata | validation, ingestion |
| assessment-ledger | repository/project disposition and provenance | envelope-validation |

Build order: envelope-validation → graph-bootstrap → ingestion-writer → vector-projection → assessment-ledger.

## Commands

```bash
python3 -m unittest tools.test_neo4j_ingestion
python3 tools/neo4j_ingest.py --manifest artifacts/ingestion/project-boundary-evidence.json --dry-run --receipt artifacts/ingestion/runs/dry-run.json
INGESTION_ALLOW_WRITE=true NEO4J_URI=... NEO4J_USERNAME=... NEO4J_PASSWORD=... python3 tools/neo4j_ingest.py --manifest ... --write
```

## Boundaries

- **Always:** validate JSON Schema, verify IDs and endpoints, preserve authority/ref/SHA, redact secrets, write a receipt, use parameterized Cypher.
- **Ask first:** enabling remote write access, changing Neo4j schema, adding a new repository family, promoting an evidence claim to canonical.
- **Never:** execute uploaded code, extract unsafe archives, accept arbitrary Cypher from agents, delete graph data, overwrite an existing record by changing its content hash, or vectorize secrets/private data.

## Graph model

Primary labels: `Project`, `Repository`, `Run`, `Evidence`, `Artifact`, `RelationEvidence`, `EvidenceText`, `Assessment`.

Every ingestible node has a stable `id`. Every imported record retains `projectId`, `sourceRef`, `authorityRepository`, `authorityRef`, `authoritySha`, `observedAt`, `rightsStatus`, `sourceClass`, and `ingestionRunId` where applicable.

Relationships use a stable `relationKey` and generic `RELATED` type with a constrained `type` property. This avoids dynamically interpolating relationship types while retaining the controlled vocabulary in the envelope schema.

## Vector policy

Create a Neo4j vector index over `EvidenceText.embedding` only. The writer never calls an embedding provider. It accepts precomputed embeddings only when dimensions match the configured index and the source text is already redacted. An embedding record must include `embeddingModel`, `embeddingDimensions`, `sourceTextHash`, `redactionVersion`, and `sourceEvidenceId`.

## Success criteria

- malformed records fail before any Neo4j mutation;
- dry-run performs zero mutations;
- write mode requires `INGESTION_ALLOW_WRITE=true`;
- rerunning the same manifest produces no duplicate nodes or relationships;
- relation endpoints must resolve;
- rejected-rights and credential-bearing records are quarantined;
- vector index creation is explicit and dimension-checked;
- receipts include counts, run idempotency key, source ref, and mutation count.
