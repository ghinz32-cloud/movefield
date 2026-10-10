"""Skip only a proven native-input-unchanged pull_request synchronize update.

PR workflow path filters compare the cumulative PR diff. This gate instead uses
the event's exact before -> head tree diff, without API pagination or rename
heuristics. Unknown inputs/errors require compilation. This is an input-change
receipt, never a binary qualification or a substitute for a prior build result.
"""
import json
import os
from pathlib import Path
import re
import subprocess


EXACT_INPUTS = {
    b"public/exercise-guides.json",
    b"public/exercise-content.json",
    b"public/fitness-research.json",
    b"scripts/inspect-native-artifacts.py",
    b"scripts/test-native-artifact-inspector.py",
    b"scripts/extract-apk-rules.py",
    b"scripts/test-apk-rule-extractor.py",
    b"scripts/native-change-gate.py",
    b"scripts/test-native-change-gate.py",
    b"scripts/collect-native-build-evidence.py",
    b"scripts/test-native-build-evidence.py",
    b"scripts/check-native-build-evidence.cjs",
    b".github/workflows/native-builds.yml",
}


def valid_sha(value):
    return isinstance(value, str) and re.fullmatch(r"[0-9a-f]{40}", value) is not None


def native_input(path):
    # lib and the three public data files are canonical inputs copied by
    # mobile/scripts/sync-shared.mjs. Include them conservatively even if a
    # native snapshot was not updated yet; snapshot parity remains a quality
    # check. Copied documentation does not change the compiled app and stays
    # excluded, as do unrelated website files.
    return (
        path in EXACT_INPUTS
        or path.startswith(b"lib/")
        or (
            path.startswith(b"mobile/")
            and not path.startswith(b"mobile/docs/")
            and re.fullmatch(rb"mobile/[^/]+\.md", path) is None
        )
    )


def git(repo, *args):
    return subprocess.run(
        ["git", *args], cwd=repo, check=True, stdout=subprocess.PIPE,
        stderr=subprocess.PIPE, timeout=30,
    ).stdout


def decide(event_name, event, expected_head, repo):
    result = {"schema": 1, "compile": True, "reason": "forced-event"}
    if event_name != "pull_request" or not isinstance(event, dict) or event.get("action") != "synchronize":
        return result
    result["reason"] = "invalid-range"
    pr = event.get("pull_request")
    head = pr.get("head") if isinstance(pr, dict) else None
    head = head.get("sha") if isinstance(head, dict) else None
    before, after = event.get("before"), event.get("after")
    if not all(valid_sha(sha) for sha in (before, after, head, expected_head)) or after != head or expected_head != head:
        return result
    result.update({"before": before, "head": head})
    try:
        if git(repo, "rev-parse", "HEAD").decode("ascii").strip() != head:
            result["reason"] = "checkout-mismatch"
            return result
        result["sourceTree"] = git(repo, "rev-parse", "HEAD^{tree}").decode("ascii").strip()
    except (OSError, subprocess.SubprocessError, UnicodeError):
        result["reason"] = "checkout-unavailable"
        return result
    try:
        git(repo, "cat-file", "-e", before + "^{commit}")
    except (OSError, subprocess.SubprocessError):
        result["reason"] = "before-unavailable"
        return result
    try:
        raw = git(repo, "diff", "--name-only", "-z", "--no-renames", before, head, "--")
        # Require Git's complete NUL-delimited record stream before trusting it.
        if raw and not raw.endswith(b"\0"):
            raise ValueError("Incomplete changed-path output")
        paths = raw[:-1].split(b"\0") if raw else []
        if any(not path for path in paths):
            raise ValueError("Empty changed path")
    except (OSError, subprocess.SubprocessError, ValueError):
        result["reason"] = "comparison-failed"
        return result
    changed = [os.fsdecode(path) for path in paths if native_input(path)]
    result.update({
        "compile": bool(changed),
        "reason": "native-inputs-changed" if changed else "native-inputs-unchanged",
        "changedPathCount": len(paths),
        "nativeChangedPaths": changed,
    })
    return result


def main():
    try:
        event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
    except (KeyError, OSError, ValueError):
        result = {"schema": 1, "compile": True, "reason": "event-unavailable"}
    else:
        result = decide(os.environ.get("GITHUB_EVENT_NAME"), event,
                        os.environ.get("NATIVE_SOURCE_SHA"), Path.cwd())
    # A failed/missing output also compiles through the downstream job condition.
    output = os.environ.get("GITHUB_OUTPUT")
    if output:
        with open(output, "a", encoding="utf-8") as stream:
            stream.write("compile=" + str(result["compile"]).lower() + "\n")
    print(json.dumps(result, ensure_ascii=True, sort_keys=True, indent=2))


if __name__ == "__main__":
    main()
