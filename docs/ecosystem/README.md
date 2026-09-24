# Ecosystem review surfaces

This directory contains static, browser-rendered views for reviewing the proposed federated shader and evidence-graph architecture.

- `index.html` visualizes bounded products, the Neo4j ingestion stages, shader G0–G9 gates, dependencies, and blocker paths.
- `dry-run.html` visualizes the sanitized attachment dry-run metrics captured in `../evidence/workspace-ingestion-dry-run-summary.json`.

These pages are **review interfaces**, not operational consoles. They use illustrative graph records and a sanitized external-workspace dry-run receipt. They do not connect to Neo4j, mutate repositories, execute shader code, or promote evidence.

When a live MCP-backed review canvas is implemented, its query results must preserve relation evidence state, provenance, traversal bounds, and unresolved identity warnings.
