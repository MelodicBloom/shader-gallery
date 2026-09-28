# Neo4j Aura Agent starter set

These files use the documented Aura Agent import shape: `name`, `description`, `system_prompt`, visibility flags, and `tools` with `cypherTemplate` definitions. Each agent is private, read-only, and uses bounded parameterized Cypher. The system prompts are intentionally below 2,000 characters so they can also be pasted into a prompt field.

## Agents

1. `shader-evidence-auditor.json` — shader artifacts, lineage, and receipts.
2. `ecosystem-boundary-planner.json` — project boundaries, ownership, and integration paths.
3. `ingestion-provenance-reviewer.json` — run metrics, quarantine, duplicates, and provenance.

## Bounded compatibility patch

The agents remain private, read-only, and below the 2,000-character prompt limit. The compatibility patch aligns their queries with the federated writer contract:

- accepts both legacy `Artifact` and new `Evidence` labels;
- reads relationship semantics from `rel.type` with a fallback to Neo4j's physical relationship type;
- uses `ingestionRunId` for quarantine review;
- exposes run mode, source ref, config version, and finalization metrics;
- avoids arbitrary Cypher and does not add mutation tools.

The ingestion configuration is validated separately by [`schemas/neo4j-ingestion.config.schema.json`](../../schemas/neo4j-ingestion.config.schema.json). The record envelope is defined by [`schemas/project-boundary-evidence.schema.json`](../../schemas/project-boundary-evidence.schema.json).

## Operator references

- [Federated Neo4j topology](../../docs/architecture/federated-neo4j-topology.mmd)
- [Neo4j agent and ingestion operator guide](../../docs/architecture/neo4j-agent-and-ingestion-operator-guide.md)

The operator guide distinguishes Aura Agent JSON import, Cypher schema bootstrap, repository-derived manifest ingestion, and optional official Neo4j MCP server setup. It also lists every agent tool and parameter.

## Vector similarity recommendation

**Enable vector capability on the instance if the planned graph will contain searchable document or evidence text, but do not make vector search the foundation of the model.** Use a hybrid retrieval pattern:

1. exact filters for `projectId`, `repository`, `status`, `evidenceClass`, `authority`, and time;
2. full-text search for identifiers, shader names, commit refs, file paths, and exact terms;
3. vector search for semantic discovery of notes, claims, receipts, research briefs, and design rationale;
4. graph traversal for provenance, ownership, dependencies, contradictions, and consequences.

Do not create a vector index until the embedding provider and dimensions are fixed. Store the embedding model, dimensions, source text hash, and generated-at timestamp on the embedded record. Never embed secrets, raw credentials, or unrestricted binary payloads. Start with one index on a dedicated `DocumentChunk` or `EvidenceText` label, not every node type. Keep `topK` small (10–25) and pre-filter by project/authority where possible.

For this corpus, vector search is useful for finding related research and rationale; it is not authoritative for shader validation, release gates, ownership, or causal claims.

## One graph or many?

Start with **one database and one federated logical graph**, with explicit scope fields:

- `projectId`: stable bounded project identity;
- `authority.repository`, `authority.ref`, and `authority.sha`: source authority;
- `owner`: responsible person/team/platform;
- `visibility` and `rightsStatus`: access and reuse boundary;
- `status`: lifecycle state;
- `runId` and `observedAt`: ingestion/audit context.

Use separate databases only when there is a real isolation requirement: different credentials or tenants, incompatible retention, legal/privacy boundaries, independent backup/restore, or operational load that must not contend. Do not create separate databases merely because the projects have different brands. A logical project boundary preserves cross-project relations while keeping each platform responsible for its own artifacts and actions.

Recommended initial scopes:

- `shader-gallery`: published shader packages, previews, runtime contracts, CI receipts;
- `shadergrammar`: grammar, token definitions, parser rules, shader-language lineage;
- `seed-loom`: generative production recipes, prompts, assets, and build outputs;
- `observation`: observation protocols, experiments, measurements, temporal/projection evidence;
- `melodyfire`: music/audio assets, releases, rights, and production lineage;
- `agent-orchestration`: agent definitions, tool policies, runs, evaluations, and handoffs.

Cross-project edges should be explicit and evidence-bearing: `CONSUMES`, `PRODUCES`, `IMPLEMENTS`, `TESTS`, `SUPPORTS_CLAIM`, `PUBLISHES_TO`, `BLOCKED_BY`, or `OWNED_BY`. A project may publish an artifact to another project without surrendering ownership.

## Upload and model sequence

1. Upload schemas and platform/project identity records.
2. Upload repository manifests, commit/ref authority, and ownership records.
3. Upload artifacts and text chunks with hashes and rights status.
4. Upload receipts and experiment runs.
5. Create only observed relationships first; mark inferred links separately.
6. Run the provenance reviewer before enabling downstream agents.
7. Add vector embeddings after chunking, redaction, and model selection are fixed.

These agents are intentionally read-only. The eventual ingestion writer should remain a separate service with dry-run, idempotency key, quarantine, audit receipt, and explicit promotion gates.

The official Neo4j MCP server is enabled for the writer configuration, while Aura Agent MCP exposure remains disabled until the graph has passed validation and replay tests.
