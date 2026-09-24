// Federated Evidence Graph bootstrap v0.2.0
// Apply only to a disposable development database until migration review.

CREATE CONSTRAINT artifact_id IF NOT EXISTS FOR (n:Artifact) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT claim_id IF NOT EXISTS FOR (n:Claim) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT experiment_id IF NOT EXISTS FOR (n:Experiment) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT snapshot_id IF NOT EXISTS FOR (n:Snapshot) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT receipt_id IF NOT EXISTS FOR (n:Receipt) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT token_id IF NOT EXISTS FOR (n:Token) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT platform_id IF NOT EXISTS FOR (n:Platform) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT review_id IF NOT EXISTS FOR (n:Review) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT run_id IF NOT EXISTS FOR (n:Run) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT project_id IF NOT EXISTS FOR (n:Project) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT source_id IF NOT EXISTS FOR (n:Source) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT policy_id IF NOT EXISTS FOR (n:Policy) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT run_idempotency IF NOT EXISTS FOR (n:Run) REQUIRE n.idempotencyKey IS UNIQUE;
CREATE CONSTRAINT artifact_hash IF NOT EXISTS FOR (n:Artifact) REQUIRE n.contentHash IS UNIQUE;
CREATE CONSTRAINT artifact_hash_exists IF NOT EXISTS FOR (n:Artifact) REQUIRE n.contentHash IS NOT NULL;
CREATE CONSTRAINT artifact_observed_exists IF NOT EXISTS FOR (n:Artifact) REQUIRE n.observedAt IS NOT NULL;
CREATE CONSTRAINT artifact_actor_exists IF NOT EXISTS FOR (n:Artifact) REQUIRE n.actor IS NOT NULL;
CREATE CONSTRAINT receipt_status_exists IF NOT EXISTS FOR (n:Receipt) REQUIRE n.status IS NOT NULL;

CREATE INDEX artifact_status IF NOT EXISTS FOR (n:Artifact) ON (n.status);
CREATE INDEX artifact_kind IF NOT EXISTS FOR (n:Artifact) ON (n.kind);
CREATE INDEX artifact_evidence IF NOT EXISTS FOR (n:Artifact) ON (n.evidenceClass);
CREATE INDEX artifact_observed IF NOT EXISTS FOR (n:Artifact) ON (n.observedAt);
CREATE INDEX artifact_ingested IF NOT EXISTS FOR (n:Artifact) ON (n.ingestedAt);
CREATE INDEX claim_status IF NOT EXISTS FOR (n:Claim) ON (n.status);
CREATE INDEX receipt_status IF NOT EXISTS FOR (n:Receipt) ON (n.status);
CREATE INDEX receipt_type IF NOT EXISTS FOR (n:Receipt) ON (n.receiptType);
CREATE INDEX run_started IF NOT EXISTS FOR (n:Run) ON (n.startedAt);
CREATE INDEX review_status IF NOT EXISTS FOR (n:Review) ON (n.status);
CREATE INDEX artifact_kind_status IF NOT EXISTS FOR (n:Artifact) ON (n.kind, n.status);
CREATE INDEX claim_class_status IF NOT EXISTS FOR (n:Claim) ON (n.evidenceClass, n.status);

CREATE FULLTEXT INDEX ecosystem_text IF NOT EXISTS
FOR (n:Artifact|Claim|Experiment|Receipt|Token|Project)
ON EACH [n.name, n.title, n.description, n.tagsText, n.summary];

// The writer computes relationKey before MERGE:
// sha256(sourceArtifactId + '|' + relationType + '|' + targetId + '|' + observedAt)
// Agent-facing tools never accept arbitrary Cypher.
