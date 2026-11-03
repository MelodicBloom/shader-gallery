# Neo4j MCP boundary

## Decision

**Enable the official Neo4j MCP server for the ingestion writer service, but keep the three Aura Agent imports private and read-only while the graph contract is being proven.**

These are separate controls:

| Control | Purpose | Initial state |
|---|---|---|
| Neo4j MCP server | Programmatic database access for schema inspection, reads, bootstrap, and guarded idempotent writes | Enabled for the writer service only |
| Aura Agent `is_mcp_enabled` | Makes an Aura Agent externally available through MCP | Disabled during validation |
| Agent `cypherTemplate` tools | Bounded read queries exposed to an agent | Enabled, read-only |
| Writer `mode` | Controls ingestion behavior | `dry-run` by default |
| Writer `INGESTION_ALLOW_WRITE` | Explicit mutation guard | Required for `write` mode |

## Why not expose write tools to agents yet?

The current graph has multiple evidence classes and several source-specific ontologies. Read-only agents can review scope, provenance, and relationships without creating unreviewed claims. The writer must remain a separate service because it can change database state, requires idempotency and quarantine, and must report a durable run receipt.

## Recommended rollout

1. Configure the official Neo4j MCP server with `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, and `NEO4J_DATABASE` from a secret manager.
2. Use `get-neo4j-schema` and a read-only query to verify the target database.
3. Apply constraints and indexes to a disposable development database.
4. Run the writer with `mode=dry-run` and inspect its receipt.
5. Enable write mode only with `INGESTION_ALLOW_WRITE=true`, an explicit source ref, and a human-reviewed manifest.
6. Keep Aura Agent imports private until three clean write/audit cycles and review of graph cardinality.
7. If external agent access is later needed, enable `is_mcp_enabled` per agent only after read scopes and rate limits are defined.

## Non-negotiable boundaries

- No arbitrary Cypher from an agent or uploaded document.
- No delete, drop, or schema-destructive operations.
- No promotion from `proposed` to `canonical` during ingestion.
- No secrets, private session rows, or unredacted credentials in the graph.
- Every write must reference one `Run`, one source ref, and one deterministic idempotency key.
