"""Real Git history fixtures for native CI input decisions; no native build claim."""
import ast
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/native-change-gate.py"
spec = importlib.util.spec_from_file_location("native_change_gate", SCRIPT)
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class Histories(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name)
        self.git("init", "--quiet", "--initial-branch=fixture")
        self.git("config", "user.name", "Native CI test fixture")
        self.git("config", "user.email", "fixture@example.invalid")
        for path in ["mobile/src/engine.ts", "mobile/docs/README.md", "mobile/README.md", "docs/base.md"]:
            self.write(path, "baseline\n")
        self.before = self.commit()

    def git(self, *args):
        return subprocess.check_output(
            ["git", "-c", "commit.gpgsign=false", *args], cwd=self.repo,
            stderr=subprocess.PIPE, text=True,
            env={**os.environ, "GIT_CONFIG_NOSYSTEM": "1", "GIT_CONFIG_GLOBAL": os.devnull},
        ).strip()

    def write(self, path, contents="changed\n"):
        file = self.repo / path
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text(contents)

    def commit(self):
        self.git("add", "--all")
        self.git("commit", "--quiet", "--message", "Isolated test history")
        return self.git("rev-parse", "HEAD")

    def event(self, before=None, head=None, action="synchronize"):
        head = head or self.git("rev-parse", "HEAD")
        return {"action": action, "before": before or self.before, "after": head,
                "pull_request": {"head": {"sha": head}}}

    def decision(self, event=None, expected=None, name="pull_request"):
        return gate.decide(name, event if event is not None else self.event(),
                           expected or self.git("rev-parse", "HEAD"), self.repo)

    def assert_compile(self, result, required):
        self.assertIs(result["compile"], required, result)

    def test_website_and_root_docs_update_skips(self):
        for path in ["HANDOFF.md", "TASKS.md", "docs/review.md", "scripts/build-pages.mjs", "static-web/sw-template.js"]:
            self.write(path)
        self.commit()
        result = self.decision()
        self.assert_compile(result, False)
        self.assertEqual(result["changedPathCount"], 5)
        self.assertEqual(result["nativeChangedPaths"], [])

    def test_mobile_copied_docs_and_top_level_markdown_skip(self):
        for path in ["mobile/docs/README.md", "mobile/docs/nested/review.json", "mobile/README.md", "docs/exercise-library-LICENSE.txt"]:
            self.write(path)
        self.commit()
        self.assert_compile(self.decision(), False)

    def test_source_lock_plugin_and_nested_markdown_compile(self):
        # Nested Markdown may be imported as application content; only the
        # deliberately excluded top-level mobile documentation is skipped.
        for path in ["mobile/src/engine.ts", "mobile/package-lock.json", "mobile/plugins/security.cjs", "mobile/src/content.md"]:
            with self.subTest(path=path):
                before = self.git("rev-parse", "HEAD")
                self.write(path)
                self.commit()
                self.assert_compile(self.decision(self.event(before)), True)

    def test_canonical_shared_module_and_public_snapshot_data_compile(self):
        for path in ["lib/training.ts", "lib/new-shared-data.json", "public/exercise-guides.json", "public/exercise-content.json", "public/fitness-research.json"]:
            with self.subTest(path=path):
                before = self.git("rev-parse", "HEAD")
                self.write(path)
                self.commit()
                self.assert_compile(self.decision(self.event(before)), True)

    def test_inspection_and_gate_policy_changes_compile(self):
        for path in ["scripts/inspect-native-artifacts.py", "scripts/test-native-artifact-inspector.py", "scripts/extract-apk-rules.py", "scripts/test-apk-rule-extractor.py", "scripts/native-change-gate.py", "scripts/test-native-change-gate.py", "scripts/collect-native-build-evidence.py", "scripts/test-native-build-evidence.py", "scripts/check-native-build-evidence.cjs", ".github/workflows/native-builds.yml"]:
            with self.subTest(path=path):
                before = self.git("rev-parse", "HEAD")
                self.write(path)
                self.commit()
                self.assert_compile(self.decision(self.event(before)), True)

    def test_empty_tree_update_skips(self):
        result = self.decision()
        self.assert_compile(result, False)
        self.assertEqual(result["changedPathCount"], 0)

    def test_deleting_native_source_compiles(self):
        (self.repo / "mobile/src/engine.ts").unlink()
        self.commit()
        self.assert_compile(self.decision(), True)

    def test_native_file_mode_change_compiles(self):
        file = self.repo / "mobile/src/engine.ts"
        file.chmod(file.stat().st_mode | 0o111)
        self.commit()
        self.assert_compile(self.decision(), True)

    def test_moving_native_source_outside_mobile_compiles(self):
        self.git("mv", "mobile/src/engine.ts", "docs/engine.ts")
        self.commit()
        result = self.decision()
        self.assert_compile(result, True)
        self.assertIn("mobile/src/engine.ts", result["nativeChangedPaths"])

    def test_moving_documentation_into_native_source_compiles(self):
        self.git("mv", "docs/base.md", "mobile/src/imported.ts")
        self.commit()
        self.assert_compile(self.decision(), True)

    def test_documentation_rename_and_delete_skip(self):
        self.git("mv", "docs/base.md", "docs/renamed.md")
        (self.repo / "mobile/docs/README.md").unlink()
        self.commit()
        self.assert_compile(self.decision(), False)

    def test_multi_commit_update_sees_native_change_before_final_docs_commit(self):
        self.write("mobile/src/engine.ts", "first native edit\n")
        self.commit()
        self.write("docs/last.md")
        self.commit()
        self.assert_compile(self.decision(), True)

    def test_native_change_reverted_in_same_update_is_input_unchanged(self):
        self.write("mobile/src/engine.ts", "temporary native edit\n")
        self.commit()
        self.write("mobile/src/engine.ts", "baseline\n")
        self.write("docs/last.md")
        self.commit()
        self.assert_compile(self.decision(), False)

    def test_force_push_removing_native_change_compiles(self):
        self.write("mobile/src/engine.ts", "old branch native edit\n")
        old_head = self.commit()
        self.git("checkout", "--quiet", "--detach", self.before)
        self.write("docs/new-branch.md")
        new_head = self.commit()
        self.assert_compile(self.decision(self.event(old_head, new_head)), True)

    def test_force_push_unchanged_native_tree_skips(self):
        self.write("docs/old-branch.md")
        old_head = self.commit()
        self.git("checkout", "--quiet", "--detach", self.before)
        self.write("docs/new-branch.md")
        new_head = self.commit()
        self.assert_compile(self.decision(self.event(old_head, new_head)), False)

    def test_more_than_3000_paths_do_not_hide_last_native_input(self):
        for number in range(3101):
            self.write(f"docs/bulk/{number:04}.md")
        self.write("mobile/src/engine.ts")
        self.commit()
        result = self.decision()
        self.assert_compile(result, True)
        self.assertEqual(result["changedPathCount"], 3102)

    def test_unusual_newline_and_nonascii_paths_are_nul_delimited(self):
        self.write("mobile/src/line\nbreak-Ω.ts")
        self.commit()
        result = self.decision()
        self.assert_compile(result, True)
        self.assertEqual(result["nativeChangedPaths"], ["mobile/src/line\nbreak-Ω.ts"])

    def test_invalid_utf8_native_path_is_detected_and_receipt_safe(self):
        path = os.fsencode(self.repo) + b"/mobile/src/bad-\xff.ts"
        with open(path, "wb") as stream:
            stream.write(b"fixture\n")
        self.commit()
        result = self.decision()
        self.assert_compile(result, True)
        receipt = json.dumps(result, ensure_ascii=True)
        self.assertIn("\\udcff", receipt)
        self.assertEqual(json.loads(receipt), result)

    def test_open_reopen_and_manual_always_compile_without_range(self):
        for name, event in [("pull_request", {"action": "opened"}), ("pull_request", {"action": "reopened"}), ("workflow_dispatch", {})]:
            with self.subTest(name=name, event=event):
                self.assert_compile(self.decision(event, name=name), True)

    def test_missing_event_structure_and_range_fields_compile(self):
        for event in [None, [], {}, {"action": "synchronize"}, {**self.event(), "pull_request": []}]:
            with self.subTest(event=event):
                self.assert_compile(gate.decide("pull_request", event, self.before, self.repo), True)
        for key in ["before", "after", "pull_request"]:
            event = self.event()
            del event[key]
            self.assert_compile(self.decision(event), True)

    def test_invalid_sha_or_mismatched_after_compile(self):
        for value in ["--help", "a" * 39, "a" * 41, "x" * 40, "a\n" + "a" * 38, None, 1]:
            event = {**self.event(), "before": value}
            self.assert_compile(self.decision(event), True)
        self.assert_compile(self.decision({**self.event(), "after": "a" * 40}), True)
        self.assert_compile(self.decision(expected="a" * 40), True)

    def test_exact_checkout_mismatch_compiles(self):
        self.write("docs/update.md")
        head = self.commit()
        event = self.event(head=head)
        self.git("checkout", "--quiet", "--detach", self.before)
        result = self.decision(event, expected=head)
        self.assert_compile(result, True)
        self.assertEqual(result["reason"], "checkout-mismatch")

    def test_unknown_before_or_blob_before_compiles(self):
        for before in ["0" * 40, self.git("hash-object", "docs/base.md")]:
            self.assert_compile(self.decision(self.event(before)), True)

    def test_missing_repository_compiles(self):
        self.assert_compile(gate.decide("pull_request", self.event(), self.before, self.repo / "absent"), True)

    def test_failed_or_incomplete_diff_cannot_skip(self):
        actual_git = gate.git
        for failure in [subprocess.CalledProcessError(1, ["git", "diff"]), subprocess.TimeoutExpired(["git", "diff"], 30), b"docs/incomplete", b"\0", b"docs/one\0\0"]:
            def fault(repo, *args):
                if args[0] == "diff":
                    if isinstance(failure, Exception):
                        raise failure
                    return failure
                return actual_git(repo, *args)
            with self.subTest(failure=failure), patch.object(gate, "git", fault):
                result = self.decision()
                self.assert_compile(result, True)
                self.assertEqual(result["reason"], "comparison-failed")

    def test_cli_writes_only_boolean_output_and_json_receipt(self):
        self.write("docs/update.md")
        head = self.commit()
        event_file, output_file = self.repo / "event.json", self.repo / "output.txt"
        event_file.write_text(json.dumps(self.event()))
        env = {**os.environ, "GITHUB_EVENT_PATH": str(event_file), "GITHUB_EVENT_NAME": "pull_request",
               "NATIVE_SOURCE_SHA": head, "GITHUB_OUTPUT": str(output_file)}
        receipt = json.loads(subprocess.check_output([sys.executable, str(SCRIPT)], cwd=self.repo, env=env, text=True))
        self.assert_compile(receipt, False)
        self.assertEqual(receipt["head"], head)
        self.assertEqual(receipt["sourceTree"], self.git("rev-parse", "HEAD^{tree}"))
        self.assertEqual(output_file.read_text(), "compile=false\n")
        event_file.write_text("not JSON")
        receipt = json.loads(subprocess.check_output([sys.executable, str(SCRIPT)], cwd=self.repo, env=env, text=True))
        self.assert_compile(receipt, True)
        self.assertEqual(output_file.read_text(), "compile=false\ncompile=true\n")


class RepositoryContract(unittest.TestCase):
    def test_actual_workflow_condition_preserves_failure_and_missing_output_fallback(self):
        workflow = (ROOT / ".github/workflows/native-builds.yml").read_text()
        guards = re.findall(r"(?m)^    if: \$\{\{ (.+) \}\}$", workflow)
        self.assertEqual(len(guards), 2)
        for guard in guards:
            # Evaluate only this small Boolean expression subset, never execute
            # arbitrary expressions from the workflow or allow calls/attributes.
            expression = guard.replace("cancelled()", "cancelled").replace("needs.native_changes.result", "result").replace("needs.native_changes.outputs.compile", "output").replace("&&", "and").replace("||", "or").replace("!cancelled", "not cancelled")
            tree = ast.parse(expression, mode="eval")
            allowed = (ast.Expression, ast.BoolOp, ast.And, ast.Or, ast.UnaryOp, ast.Not, ast.Compare, ast.NotEq, ast.Constant, ast.Name, ast.Load)
            self.assertTrue(all(isinstance(node, allowed) for node in ast.walk(tree)))
            self.assertTrue(all(node.id in {"cancelled", "result", "output"} for node in ast.walk(tree) if isinstance(node, ast.Name)))
            for result, output, cancelled, expected in [
                ("success", "false", False, False),
                ("success", "true", False, True),
                ("success", "", False, True),
                ("success", None, False, True),
                ("success", "unknown", False, True),
                ("failure", "false", False, True),
                ("failure", "", False, True),
                ("skipped", "", False, True),
                ("success", "true", True, False),
                ("failure", "", True, False),
            ]:
                with self.subTest(result=result, output=output, cancelled=cancelled):
                    actual = eval(compile(tree, "<restricted-workflow-guard>", "eval"), {"__builtins__": {}}, {"result": result, "output": output, "cancelled": cancelled})
                    self.assertIs(actual, expected)

    def test_observed_page2_range_skips_when_history_available(self):
        before = "06ca10f536397bb845dd1fdea08b179818e898b2"
        head = "d740c61084f44505273e900f7672ac92bae1a218"
        try:
            subprocess.run(["git", "cat-file", "-e", before + "^{commit}"], cwd=ROOT, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            subprocess.run(["git", "cat-file", "-e", head + "^{commit}"], cwd=ROOT, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except subprocess.CalledProcessError:
            self.skipTest("Historical production commits unavailable in this checkout; synthetic Git fixtures still run")
        # Override only the current checkout receipt so the real historical
        # before/head trees are compared without changing the shared worktree.
        actual_git = gate.git
        def historical_checkout(repo, *args):
            if args == ("rev-parse", "HEAD"):
                return (head + "\n").encode()
            if args == ("rev-parse", "HEAD^{tree}"):
                return actual_git(repo, "rev-parse", head + "^{tree}")
            return actual_git(repo, *args)
        event = {"action": "synchronize", "before": before, "after": head, "pull_request": {"head": {"sha": head}}}
        with patch.object(gate, "git", historical_checkout):
            result = gate.decide("pull_request", event, head, ROOT)
        self.assertIs(result["compile"], False, result)
        self.assertEqual(result["changedPathCount"], 9)

    def test_workflow_guards_gate_and_exact_source_without_cancellation(self):
        workflow = (ROOT / ".github/workflows/native-builds.yml").read_text()
        self.assertNotRegex(workflow, r"(?m)^\s*(?:concurrency|cancel-in-progress|paths|paths-ignore):")
        self.assertIn("types: [opened, reopened, synchronize]", workflow)
        self.assertIn("fetch-depth: 0", workflow)
        self.assertIn("compile: ${{ steps.gate.outputs.compile }}", workflow)
        guard = "if: ${{ !cancelled() && (needs.native_changes.result != 'success' || needs.native_changes.outputs.compile != 'false') }}"
        for job in ["android", "ios"]:
            body = re.search(r"(?ms)^  " + job + r":\n(.*?)(?=^  \w+:|\Z)", workflow).group(1)
            self.assertIn("needs: native_changes", body)
            self.assertIn(guard, body)
            self.assertIn("ref: ${{ github.event.pull_request.head.sha || github.sha }}", body)
            self.assertIn("persist-credentials: false", body)
        self.assertIn("python3 scripts/test-native-change-gate.py", (ROOT / ".github/workflows/quality.yml").read_text())


if __name__ == "__main__":
    unittest.main(verbosity=2)
