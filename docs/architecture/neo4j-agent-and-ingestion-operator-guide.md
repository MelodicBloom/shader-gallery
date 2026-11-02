# Neo4j Agent and Federated Ingestion Operator Guide

This guide separates three different actions that are easy to confuse:

1. **Importing an Aura Agent JSON file** — configures a read-only agent and its tools.
2. **Applying the graph schema/index Cypher** — creates constraints and the vector index in Neo4j.
3. **Ingesting repository-derived records** — writes validated project, repository, evidence, and relationship records through the Python writer.

Do not upload the source repositories as substitutes for the manifest. The graph should receive **selected, rights-cleared evidence records** with authority metadata and hashes. Keep the original repositories as the authority source; ingest their commit/ref/SHA and selected files or receipts.

## A. What to upload, and in what order

| Order | Upload or run | Purpose | Upload raw repository? |
|---:|---|---|---:|
| 1 | `schemas/project-boundary-evidence.schema.json` | Validate the envelope | No; keep in the ingestion project |
| 2 | `schemas/neo4j-ingestion.config.json` + its schema | Validate writer policy | No; keep versioned with the writer |
| 3 | `schemas/neo4j-evidence-graph.cypher` | Create graph constraints/indexes | No; paste/run in Neo4j Query/Data Explorer |
| 4 | `docs/evidence/neo4j-ingestion-manifest.example.json` | Safe example of project/repository/evidence records | No; use as a manifest template |
| 5 | Selected source files, receipts, and research notes | Produce evidence records | Only selected files, and only when rights-cleared |
| 6 | `agents/neo4j/*.json` | Import the three read-only Aura Agents | No; upload each agent JSON separately |
| 7 | Precomputed redacted embeddings | Populate `EvidenceText.embedding` | Only after model/dimensions are fixed |

**Important:** the schemas and agent JSONs are configuration artifacts. They are not evidence by themselves. Repository-derived evidence should include `authority.repository`, `authority.ref`, `authority.sha`, `sourceFiles`, `contentHash`, `observedAt`, and `rightsStatus`.

## B. Screen-by-screen: create or select the Aura instance

Neo4j labels may change slightly between Console revisions; use the closest equivalent label if the wording differs.

1. Open **Neo4j Aura Console** and sign in.
2. In the project/tenant view, click **Create instance** or click the existing development instance.
3. Choose a development-tier instance first. Do not use production credentials for the first dry-run.
4. Give it a clear name such as `federated-evidence-dev`.
5. Set the region and version according to your deployment requirements.
6. If the creation form offers **vector optimization**, enable it only if you plan to use the `EvidenceText` vector index. It is not required for ordinary graph storage.
7. Click **Create** and wait until the instance status is **Running**.
8. Open **Connect** and record the connection URI. Do not paste the password into chat, Git, an agent prompt, or a manifest.

## C. Screen-by-screen: apply constraints and the vector index

1. Open the running instance.
2. Click **Query**, **Query console**, or **Data Explorer** in the instance navigation.
3. Open `schemas/neo4j-evidence-graph.cypher` locally.
4. Copy the Cypher into the query editor. This is the one place where the schema bootstrap is pasted as Cypher.
5. Click **Run**.
6. If Neo4j reports that an object already exists, confirm that the existing object has the intended name and definition. Do not drop indexes or constraints to force a match.
7. In a new query tab, run:

```cypher
SHOW CONSTRAINTS;
SHOW INDEXES;
SHOW VECTOR INDEXES;
```

8. Confirm `evidence_text_embedding` appears with:
   - label `EvidenceText`
   - property `embedding`
   - dimensions `1536`
   - similarity function `cosine`
9. Wait until the vector index state is **ONLINE** and population is complete before adding embeddings or using Similarity Search.

The vector index is intentionally only on `EvidenceText`. Do not create separate indexes for every project or every node label at this stage.

## D. Screen-by-screen: run the repository ingestion

The writer is run from a terminal, not by uploading an entire repository into the Aura Agent screen.

### 1. Dry-run first

From the repository root:

```bash
python3 tools/neo4j_ingest.py \
  --manifest docs/evidence/neo4j-ingestion-manifest.example.json \
  --dry-run \
  --receipt artifacts/ingestion/runs/example-dry-run.json
```

2. Open the receipt file.
3. Confirm:
   - `status` is `dry-run-complete`
   - `neo4jMutationCount` is `0`
   - errors are empty
   - project/repository/evidence/relation counts are expected
4. For a real workspace, run the existing scanner first:

```bash
python3 tools/workspace_ingestion_dry_run.py /path/to/workspace \
  --output artifacts/ingestion/workspace-dry-run.json
```

5. Review credential findings, unsafe archives, duplicate aliases, rights status, and unresolved authority before preparing a write manifest.

### 2. Configure the writer locally

Set credentials in the terminal environment or a secret manager. Never place them in the JSON manifest:

```bash
export NEO4J_URI='neo4j+s://your-instance.databases.neo4j.io'
export NEO4J_USERNAME='neo4j'
export NEO4J_PASSWORD='use-your-secret-manager'
export NEO4J_DATABASE='neo4j'
export NEO4J_VECTOR_DIMENSIONS='1536'
```

3. Review the exact manifest and confirm its source refs and SHAs.
4. Run the writer with the explicit write gate:

```bash
export INGESTION_ALLOW_WRITE=true
python3 tools/neo4j_ingest.py \
  --manifest path/to/approved-manifest.json \
  --write \
  --receipt artifacts/ingestion/runs/approved-write.json
```

5. Open the receipt and confirm the mutation count, run idempotency key, and final status.
6. If the receipt is quarantined, stop. Fix the manifest or source policy; do not bypass validation.
7. Re-running the same manifest is intended to be idempotent. A changed content hash or authority SHA should produce a new evidence identity rather than silently overwrite an old one.

## E. Screen-by-screen: import each Aura Agent JSON

Neo4j's documented flow is **Agents → Import agent → select instance → browse or paste JSON**. Import the files one at a time.

### Agent 1 — Shader Evidence Auditor

1. In the Aura Console, click **Agents** in the left-hand menu.
2. Click **Import agent**.
3. Select the same `federated-evidence-dev` instance.
4. Choose **Browse** and select `agents/neo4j/shader-evidence-auditor.json`, or open the file and paste its JSON into the import field.
5. Click **Import** / **Create**.
6. Open the imported agent and confirm:
   - **Private/internal** is enabled.
   - **MCP exposure** is disabled.
   - all three tools are enabled.
7. Save the agent.
8. Test with an exact artifact id or repository name.

### Agent 2 — Ecosystem Boundary Planner

Repeat the same sequence with `agents/neo4j/ecosystem-boundary-planner.json`.

### Agent 3 — Ingestion Provenance Reviewer

Repeat the same sequence with `agents/neo4j/ingestion-provenance-reviewer.json`.

Keep all three agents private during testing. Neo4j documents that internal/private agents cannot be enabled as MCP servers. These agents are intentionally read-only; do not change them into write-capable agents during this phase.

## F. Agent requirements and tool parameters

### Shared requirements for all three agents

- JSON import shape: `name`, `description`, `system_prompt`, `is_private`, `is_mcp_enabled`, `tools`.
- `system_prompt` remains below 2,000 characters.
- `is_private: true`.
- `is_mcp_enabled: false`.
- Tools are `cypherTemplate` only.
- No arbitrary Cypher input.
- No mutation tools.
- Return graph evidence with authority, status, evidence class, source files, and confidence where available.
- Treat `observed`, `derived`, `inferred`, `proposed`, and `unknown` as different evidence states.

### Shader Evidence Auditor

| Tool | Required parameters | Use |
|---|---|---|
| `Find Shader Artifacts` | `repository: string`, `status: string`, `evidenceClass: string`, `tag: string` | Filter shader artifacts or evidence |
| `Trace Evidence Lineage` | `recordId: string` | Traverse up to three hops around an artifact/receipt |
| `Compare Validation Receipts` | `artifactId: string` | Compare related validation receipts without binary data |

### Ecosystem Boundary Planner

| Tool | Required parameters | Use |
|---|---|---|
| `Project Inventory` | `projectId: string`, `owner: string` | List project/platform scope and authority |
| `Boundary Relationship Map` | `projectId: string` | Inspect bounded relationships |
| `Ownership Gaps` | `projectId: string` | Find records missing owner or authority |

### Ingestion Provenance Reviewer

| Tool | Required parameters | Use |
|---|---|---|
| `Run Summary` | `runId: string` | Inspect quantitative run metrics |
| `Quarantine Findings` | `runId: string` | Review rejected/blocked records |
| `Duplicate Content Review` | none | Find repeated content hashes |

## G. What to ingest from each verified project

### Shader Gallery

Upload or generate records for:

- package manifests
- shader metadata
- compile/link/render receipts
- deterministic preview metadata
- release manifests
- evidence gate decisions

Do not treat generated preview binaries as primary evidence.

### Shader Grammar

Use the pinned package ref/tag:

```text
shader-grammar-v0.1.0-prototype
fbec8af6e261ad7e12c58fefe177e559cbfbdf38
```

Ingest ontology descriptions, recipe summaries, validation reports, and provenance manifests. Keep exact schema data available through structured graph properties; use embeddings only for semantic summaries.

### Seed-Loom

Ingest shared entity, relationship, observation, and run schemas as reference vocabulary. Do not duplicate its ontology into a second incompatible graph model.

### Melodyfire

Ingest public product/portfolio architecture and explicit artifact lineage. Do not ingest private Supabase rows, credentials, or personal/customer data without a separate rights policy.

### Nacre

Ingest as a gated experiment under Shader Gallery. Do not create a separate repository node or promote a recipe/name to a production material claim without its causal apparatus, null suite, replay metric, and performance receipt.

### SVG Filter Lab

Do not create a repository node yet. The repository identity is unresolved. Ingest only the architectural boundary note as `PROJECT_INTERPRETATION` evidence and mark the project as assessment-pending.

## H. Optional official Neo4j MCP server

The Aura Agent import is not the same thing as installing the official Neo4j MCP server.

The official Neo4j MCP server is a separate local/server process that supports schema inspection and read/write Cypher through MCP. Configure it only after the database, schema, and dry-run are validated. Start with read-only behavior where your host supports it; keep database credentials in the MCP host's secret configuration.

Do not enable the agent-facing MCP switch for these three private agents during the initial validation cycle.

## I. Final acceptance checklist

- [ ] Instance is development-scoped and running.
- [ ] Schema bootstrap ran without destructive drops.
- [ ] `SHOW VECTOR INDEXES` reports `evidence_text_embedding` as `ONLINE`.
- [ ] Example manifest validates against the envelope schema.
- [ ] Dry-run receipt reports zero mutations.
- [ ] Credentials and private files are absent from manifests.
- [ ] Agent imports are private and read-only.
- [ ] Provenance reviewer has reviewed the first run.
- [ ] Only then are downstream agents or MCP exposure considered.

## Official references

- [Neo4j Aura Agent — create and import agents](https://neo4j.com/docs/aura/aura-agent/)
- [Neo4j Cypher Manual — vector indexes](https://neo4j.com/docs/cypher-manual/current/indexes/semantic-indexes/vector-indexes/)
- [Neo4j official MCP integrations](https://neo4j.com/developer/genai-ecosystem/model-context-protocol-mcp/)
