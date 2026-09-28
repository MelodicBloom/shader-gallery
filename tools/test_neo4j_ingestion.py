import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from tools.neo4j_ingest import IngestionError, build_run_key, ingest_manifest, validate_envelope


class Neo4jIngestionTests(unittest.TestCase):
    def envelope(self):
        return {
            "schemaVersion": "ProjectBoundaryEvidence/0.1.0",
            "run": {
                "id": "run:test:001",
                "idempotencyKey": "sha256:" + "a" * 64,
                "mode": "dry-run",
                "startedAt": "2026-09-28T20:00:00Z",
                "sourceRef": "main@" + "b" * 40,
                "configVersion": "Neo4jIngestionConfig/0.1.0",
            },
            "projects": [{
                "id": "project:test",
                "name": "Test",
                "status": "observed",
                "scope": {"projectId": "project:test", "authority": {
                    "repository": "example/test", "ref": "main", "sha": "b" * 40}},
                "platformRole": "library",
            }],
            "repositories": [{
                "id": "repo:example/test",
                "name": "example/test",
                "status": "observed",
                "projectId": "project:test",
                "authority": {"repository": "example/test", "ref": "main", "sha": "b" * 40},
                "sourceClass": "owned",
                "observedFiles": ["README.md"],
            }],
            "evidence": [],
            "relations": [],
        }

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
            "authority": {"repository": "example/test", "ref": "main", "sha": "b" * 40, "path": "README.md"},
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


if __name__ == "__main__":
    unittest.main()
