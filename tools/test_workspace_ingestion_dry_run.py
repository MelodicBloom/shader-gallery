import json
import tempfile
import unittest
import zipfile
from pathlib import Path

from tools.workspace_ingestion_dry_run import scan_workspace


class WorkspaceIngestionDryRunTests(unittest.TestCase):
    def test_redacts_credentials_and_rejects_secret_bearing_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            secret = "sk-" + "test_abcdefghijklmnopqrstuvwxyz123456"
            (root / "safe.md").write_text("safe evidence\n", encoding="utf-8")
            (root / "credential.txt").write_text(f"API_KEY={secret}\n", encoding="utf-8")

            report = scan_workspace(root)

            self.assertEqual(report["metrics"]["inputFiles"], 2)
            self.assertEqual(report["metrics"]["credentialFiles"], 1)
            self.assertEqual(report["metrics"]["acceptedForGraphWrite"], 1)
            self.assertEqual(report["metrics"]["rejectedOrQuarantined"], 1)
            serialized = json.dumps(report)
            self.assertNotIn(secret, serialized)
            finding = report["credentialFindings"][0]
            self.assertEqual(finding["file"], "credential.txt")
            self.assertEqual(finding["findings"][0]["type"], "openai_api_key")

    def test_collapses_identical_content_into_duplicate_aliases(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "a.md").write_text("same\n", encoding="utf-8")
            (root / "b.md").write_text("same\n", encoding="utf-8")

            report = scan_workspace(root)

            self.assertEqual(report["metrics"]["inputFiles"], 2)
            self.assertEqual(report["metrics"]["uniqueContentObjects"], 1)
            self.assertEqual(report["metrics"]["duplicateAliases"], 1)

    def test_flags_archive_path_traversal_without_extracting(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            archive = root / "unsafe.zip"
            with zipfile.ZipFile(archive, "w") as bundle:
                bundle.writestr("../escape.txt", "unsafe")
                bundle.writestr("safe/file.txt", "safe")

            report = scan_workspace(root)

            self.assertEqual(report["metrics"]["unsafeArchives"], 1)
            self.assertEqual(report["metrics"]["acceptedForGraphWrite"], 0)
            self.assertIn("SEC-004:unsafe-archive-member", report["files"][0]["errors"])

    def test_emits_schema_valid_artifact_records_with_zero_mutations(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "shader.glsl").write_text("#version 300 es\nvoid main() {}\n", encoding="utf-8")

            report = scan_workspace(root)

            self.assertEqual(report["metrics"]["schemaInvalidRecords"], 0)
            self.assertEqual(report["metrics"]["neo4jMutationCount"], 0)
            record = report["files"][0]["record"]
            self.assertEqual(record["kind"], "artifact")
            self.assertEqual(record["status"], "proposed")
            self.assertRegex(record["provenance"]["contentHash"], r"^sha256:[a-f0-9]{64}$")
            self.assertEqual(record["provenance"]["actor"], "neo4j-mcp-dry-run")

    def test_excludes_repository_metadata_dependencies_and_generated_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "kept.md").write_text("kept\n", encoding="utf-8")
            ignored = [
                root / ".git" / "config",
                root / "node_modules" / "dependency.js",
                root / "__pycache__" / "scanner.pyc",
                root / "artifacts" / "evidence-graph" / "previous.json",
            ]
            for path in ignored:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("ignored\n", encoding="utf-8")

            report = scan_workspace(root)

            self.assertEqual(report["metrics"]["inputFiles"], 1)
            self.assertEqual(report["files"][0]["file"], "kept.md")


if __name__ == "__main__":
    unittest.main()
