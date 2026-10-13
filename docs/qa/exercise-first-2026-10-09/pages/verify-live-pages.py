"""Verify exact generated public files and downloadable committed source.

HTTP byte verification only: no browser, service-worker execution or GPU claim.
"""
from pathlib import Path
import argparse
import concurrent.futures
import hashlib
import importlib.util
import json
import subprocess
import urllib.error
import urllib.request
import zipfile


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, file, code, message, headers, new_url):
        raise urllib.error.HTTPError(request.full_url, code, "Redirect refused", headers, file)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkout", required=True)
    parser.add_argument("--inventory", required=True)
    parser.add_argument("--evidence", required=True)
    parser.add_argument("--pages-commit", required=True)
    args = parser.parse_args()
    root, evidence = Path(args.checkout), Path(args.evidence)
    inventory = json.loads(Path(args.inventory).read_text())
    assert subprocess.check_output(["git", "rev-parse", inventory["sourceCommit"]], cwd=root, text=True).strip() == inventory["sourceCommit"]
    assert subprocess.check_output(["git", "rev-parse", inventory["sourceCommit"]+"^{tree}"], cwd=root, text=True).strip() == inventory["sourceTree"]
    subprocess.run(["git", "diff", "--quiet", inventory["sourceCommit"], "--", "app", "components", "lib", "mobile", "scripts", "public", "static-web", "package.json"], cwd=root, check=True)
    live = evidence / "live-files"
    live.mkdir(parents=True, exist_ok=True)
    origin = "https://ghinz32-cloud.github.io/movefield/"

    def check(row):
        url = origin + row["path"]
        result = {"path": row["path"], "url": url, "expectedBytes": row["bytes"], "expectedSha256": row["sha256"], "expectedGitBlob": row["blob"]}
        try:
            request = urllib.request.Request(url, headers={"Cache-Control": "no-cache", "Accept-Encoding": "identity"})
            with urllib.request.build_opener(NoRedirect).open(request, timeout=45) as response:
                body = response.read(row["bytes"] + 1)
                result.update(status=response.status, finalUrl=response.url, bytes=len(body), sha256=hashlib.sha256(body).hexdigest(), gitBlob=hashlib.sha1(b"blob " + str(len(body)).encode() + b"\0" + body).hexdigest(), headers={key: response.headers.get(key) for key in ["Content-Type", "Content-Security-Policy", "Cache-Control", "Last-Modified", "X-Movefield-Pages-Version", "X-Movefield-Asset-SHA256"]})
            result["passed"] = result["status"] == 200 and result["finalUrl"] == url and result["bytes"] == row["bytes"] and result["sha256"] == row["sha256"] and result["gitBlob"] == row["blob"]
            if result["passed"]:
                file = live / row["path"]
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_bytes(body)
        except Exception as error:
            result.update(passed=False, error=str(error))
        return result

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        rows = list(executor.map(check, inventory["files"]))
    passed = all(row["passed"] for row in rows)
    report = {"schema": 1, "site": origin, "sourceCommit": inventory["sourceCommit"], "publishedSourceCommit": "9cdcec081bee3525838ac334da1bb48de6690f13", "sourceTree": inventory["sourceTree"], "pagesCommit": args.pages_commit, "manifestVersion": inventory["manifestVersion"], "allPassed": passed, "files": rows, "limits": ["Normal HTTPS response bytes; redirects refused. No browser or GPU execution.", "Pages worker CSP is injected only by the verified service worker, not ordinary host HTTP. Its execution is covered by the separate VM/runtime harness."]}
    (evidence / "live-readback.json").write_text(json.dumps(report, indent=2) + "\n")
    if not passed:
        print(json.dumps({"passed": False, "matched": sum(row["passed"] for row in rows), "total": len(rows), "failed": [{"path": row["path"], "error": row.get("error"), "sha256": row.get("sha256")} for row in rows if not row["passed"]]}, indent=2))
        raise SystemExit(1)

    actual_manifest = json.loads((live / "pages-manifest.json").read_text())
    local_manifest = json.loads((root / "dist-pages/pages-manifest.json").read_text())
    assert actual_manifest == local_manifest
    assert actual_manifest["version"] == inventory["manifestVersion"]
    worker = (live / "sw.js").read_bytes()
    assert worker == (root / "dist-pages/sw.js").read_bytes()
    template = (root / "static-web/sw-template.js").read_text()
    assert "headers.set('Content-Security-Policy',MANIFEST.coachingWorker.csp)" in template
    assert "if(digest!==entries[key])throw" in template
    assert actual_manifest["coachingWorker"] == json.loads((root / "lib/workout-coaching-worker-policy.json").read_text())
    assert actual_manifest["coachingWorker"]["csp"].startswith("default-src 'none';")
    assert "connect-src 'none'" in actual_manifest["coachingWorker"]["csp"]

    spec = importlib.util.spec_from_file_location("package_mobile", root / "scripts/package-mobile.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    selected = dict(module.source_files(root))
    prefix = "training-studio-mobile/"
    archive = live / "downloads/movefield-mobile-r14.zip"
    source_rows = []
    with zipfile.ZipFile(archive) as bundle:
        assert bundle.testzip() is None
        names = bundle.namelist()
        assert len(names) == len(set(names))
        assert set(names) == {prefix + name for name in selected}
        for name, source in selected.items():
            actual = bundle.read(prefix + name)
            committed = subprocess.check_output(["git", "show", inventory["sourceCommit"] + ":mobile/" + name], cwd=root)
            assert actual == source == committed
            source_rows.append({"path": name, "bytes": len(actual), "sha256": hashlib.sha256(actual).hexdigest(), "matchesCommittedSource": True})
    source_report = {"schema": 1, "sourceCommit": inventory["sourceCommit"], "pagesCommit": args.pages_commit, "archiveBytes": archive.stat().st_size, "archiveSha256": hashlib.sha256(archive.read_bytes()).hexdigest(), "crcPassed": True, "allMembersMatch": True, "files": source_rows}
    (evidence / "native-starter-readback.json").write_text(json.dumps(source_report, indent=2) + "\n")
    print(json.dumps({"passed": True, "files": len(rows), "bytes": sum(row["bytes"] for row in rows), "sourceMembers": len(source_rows), "version": actual_manifest["version"], "source": inventory["sourceCommit"], "pages": args.pages_commit, "browserExecuted": False, "gpuInferenceExecuted": False}, indent=2))


if __name__ == "__main__":
    main()
