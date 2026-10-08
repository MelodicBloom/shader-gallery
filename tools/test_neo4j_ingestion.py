import json
import os
import unittest
from unittest.mock import patch

from tools.neo4j_ingest import IngestionError, build_run_key, ingest_manifest, manifest_digest, node_parameters, validate_envelope


class Neo4jIngestionTests(unittest.TestCase):
    def envelope(self):
        return {
            "schemaVersion": "ProjectBoundaryEvidence/0.1.0",
            "run": {
                "id": "run:test:001",
                "idempotencyKey": "sha256:" + "a" * 64,
                "mode": "dry-run",
                "startedAt": "2026-09-28T20:00:00Z",
                "sourceRef": "main@" + "b" * 20 + "c" * 20,
                "configVersion": "Neo4jIngestionConfig/0.1.0",
            },
            "projects": [{
                "id": "project:test",
                "name": "Test",
                "status": "observed",
                "scope": {"projectId": "project:test", "authority": {
                    "repository": "example/test", "ref": "main", "sha": "b" * 20 + "c" * 20}},
                "platformRole": "library",
            }],
            "repositories": [{
                "id": "repo:example/test",
                "name": "example/test",
                "status": "observed",
                "projectId": "project:test",
                "authority": {"repository": "example/test", "ref": "main", "sha": "b" * 20 + "c" * 20},
                "sourceClass": "owned",
                "observedFiles": ["README.md"],
            }],
            "evidence": [],
            "relations": [],
        }
        envelope["run"]["idempotencyKey"] = build_run_key(
            envelope["run"]["configVersion"],
            "neo4j",
            envelope["run"]["sourceRef"],
            manifest_digest(envelope),
        )
        return envelope

    def test_validates_cross_record_identity_and_rejects_unknown_endpoint(self):
        envelope = self.envelope()
        envelope["relations"] = [{
            "id": "rel:test",
            "type": "CONTAINS",
            "sourceId": "project:test",
            "targetId": "evidence:missing",
            "projectId": "project:test",
            "evidenceState": "observed",
        }]
        errors = validate_envelope(envelope)
        self.assertTrue(any("endpoint" in error for error in errors))

    def test_dry_run_never_constructs_a_driver_or_mutates(self):
        envelope = self.envelope()
        with patch.dict(os.environ, {"INGESTION_ALLOW_WRITE": "false"}, clear=False):
            result = ingest_manifest(envelope, mode="dry-run")
        self.assertEqual(result["metrics"]["neo4jMutationCount"], 0)
        self.assertEqual(result["status"], "dry-run-complete")

    def test_write_requires_explicit_environment_gate(self):
        with self.assertRaises(IngestionError):
            ingest_manifest(self.envelope(), mode="write")

    def test_run_key_is_deterministic(self):
        first = build_run_key("Neo4jIngestionConfig/0.1.0", "neo4j", "main@abc", "manifest-hash")
        second = build_run_key("Neo4jIngestionConfig/0.1.0", "neo4j", "main@abc", "manifest-hash")
        self.assertEqual(first, second)
        self.assertRegex(first, r"^sha256:[a-f0-9]{64}$")

    def test_vector_dimensions_are_checked(self):
        envelope = self.envelope()
        envelope["evidence"] = [{
            "id": "evidence:test",
            "name": "Text",
            "status": "observed",
            "projectId": "project:test",
            "authority": {"repository": "example/test", "ref": "main", "sha": "b" * 20 + "c" * 20, "path": "README.md"},
            "evidenceClass": "EMPIRICAL",
            "contentHash": "sha256:" + "c" * 64,
            "sourceFiles": ["README.md"],
            "observedAt": "2026-09-28T20:00:00Z",
            "rightsStatus": "known",
            "vector": {"embedding": [0.1, 0.2], "embeddingModel": "test", "embeddingDimensions": 2,
                       "sourceTextHash": "sha256:" + "d" * 64, "redactionVersion": "r1"}
        }]
        errors = validate_envelope(envelope, vector_dimensions=3)
        self.assertTrue(any("dimensions" in error for error in errors))

    def test_node_parameters_flatten_nested_authority_and_scope(self):
        record = self.envelope()["projects"][0]
        props = node_parameters(record, self.envelope()["run"])
        self.assertNotIn("authority", props)
        self.assertNotIn("scope", props)
        self.assertEqual(props["authorityRepository"], "example/test")
        self.assertEqual(props["authoritySha"], "b" * 20 + "c" * 20)
        self.assertEqual(props["scopeProjectId"], "project:test")
        self.assertEqual(props["scopeAuthoritySha"], "b" * 20 + "c" * 20)
        self.assertTrue(all(not isinstance(value, dict) for value in props.values()))

    def test_canonical_evidence_is_rejected_without_promotion(self):
        envelope = self.envelope()
        envelope["evidence"] = [{
            "id": "evidence:canonical",
            "name": "Canonical claim",
            "status": "canonical",
            "projectId": "project:test",
            "authority": {"repository": "example/test", "ref": "main", "sha": "b" * 20 + "c" * 20},
            "evidenceClass": "PROJECT_INTERPRETATION",
            "contentHash": "sha256:" + "c" * 64,
            "sourceFiles": ["README.md"],
            "rightsStatus": "known",
        }]
        errors = validate_envelope(envelope)
        self.assertTrue(any("canonical" in error.lower() for error in errors))

    def test_rejected_rights_are_not_ingestable(self):
        envelope = self.envelope()
        envelope["evidence"] = [{
            "id": "evidence:rights",
            "name": "Rights rejected",
            "status": "observed",
            "projectId": "project:test",
            "authority": {"repository": "example/test", "ref": "main", "sha": "b" * 20 + "c" * 20},
            "evidenceClass": "EMPIRICAL",
            "contentHash": "sha256:" + "c" * 64,
            "sourceFiles": ["README.md"],
            "rightsStatus": "rejected",
        }]
        errors = validate_envelope(envelope)
        self.assertTrue(any("rights" in error.lower() and "rejected" in error.lower() for error in errors))

    def test_invalid_datetime_format_is_rejected(self):
        envelope = self.envelope()
        envelope["run"]["startedAt"] = "not-a-date"
        errors = validate_envelope(envelope)
        self.assertTrue(any("date" in error.lower() or "format" in error.lower() for error in errors))

    def test_placeholder_authority_sha_is_rejected(self):
        envelope = self.envelope()
        envelope["projects"][0]["scope"]["authority"]["sha"] = "a" * 40
        errors = validate_envelope(envelope)
        self.assertTrue(any("placeholder" in error.lower() or "authority" in error.lower() for error in errors))

    def test_relation_ids_are_not_relation_endpoints(self):
        envelope = self.envelope()
        envelope["relations"] = [{
            "id": "rel:source",
            "type": "CONTAINS",
            "sourceId": "rel:target",
            "targetId": "project:test",
            "projectId": "project:test",
            "evidenceState": "observed",
        }, {
            "id": "rel:target",
            "type": "CONTAINS",
            "sourceId": "project:test",
            "targetId": "repo:example/test",
            "projectId": "project:test",
            "evidenceState": "observed",
        }]
        errors = validate_envelope(envelope)
        self.assertTrue(any("rel:target" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
