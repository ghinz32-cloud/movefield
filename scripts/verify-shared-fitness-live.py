"""Check served preview artifacts and every preserved root file against the candidate."""
import argparse, concurrent.futures, datetime, hashlib, json, pathlib, time
import urllib.error, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--pages-commit', required=True)
parser.add_argument('--output', default='.sites-runtime/shared-fitness-live-current.json')
args = parser.parse_args()
receipt = json.loads((ROOT / '.sites-runtime/fitness-pages-candidate-receipt.json').read_text())
files = receipt['candidate_files']
tasks = {}
for name, digest in files.items():
    if not name.startswith(('review/', 'grizzly/')):
        tasks[name] = digest
        continue
    rel = name.split('/', 1)[1]
    if (rel in ['index.html', 'review-manifest.json', 'grizzly-manifest.json',
                'brand/grizzly-fitness-logo.jpg', 'exercise-guides.json', 'exercise-content.json',
                'downloads/movefield-native-current.zip', 'downloads/grizzly-fitness-native-source.zip']
            or rel.endswith('sw.js') or rel.startswith(('assets/', 'fonts/', 'brand/wilderness/'))):
        tasks[name] = digest

def check(task):
    name, expected = task
    url = ('https://ghinz32-cloud.github.io/movefield/' + urllib.parse.quote(name, safe='/')
           + '?release=' + args.pages_commit[:12])
    for attempt in range(1, 4):
        try:
            request = urllib.request.Request(url, headers={'Cache-Control': 'no-cache',
                'User-Agent': 'Movefield-release-verification'})
            with urllib.request.urlopen(request, timeout=25) as response:
                data = response.read(25 * 1024 * 1024)
            actual = hashlib.sha256(data).hexdigest()
            return {'path': name, 'expected_sha256': expected, 'actual_sha256': actual,
                    'bytes': len(data), 'attempts': attempt, 'passed': actual == expected}
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            if attempt == 3:
                return {'path': name, 'passed': False, 'attempts': attempt, 'error': str(error)}
            time.sleep(attempt)

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(check, tasks.items()))
report = {'checked_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'pages_commit': args.pages_commit, 'source_commit': receipt['current_source_commit'],
          'application_source_sha256': receipt['application_source_sha256'],
          'scope': 'HTTPS byte verification only; no browser or installed-device acceptance.',
          'root_files_checked': sum(not r['path'].startswith(('review/', 'grizzly/')) for r in results),
          'passed': all(r['passed'] for r in results), 'files': results}
destination = ROOT / args.output
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: report[k] for k in ['passed', 'root_files_checked', 'source_commit']}
                 | {'assets_checked': len(results), 'failures': [r for r in results if not r['passed']]}))
raise SystemExit(0 if report['passed'] else 1)
