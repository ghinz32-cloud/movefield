"""Restore only source assets matching the original handoff's size and SHA256."""
import concurrent.futures, hashlib, json, pathlib, urllib.parse, urllib.request
ROOT = pathlib.Path(__file__).resolve().parents[1]
REVISION = 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5'
SOURCE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/' + REVISION
LICENSE_SHA256 = '6b0382b16279f26ff69014300541967a356a666eb0b91b422f6862f6b7dad17e'

def fetch(path, limit):
    with urllib.request.urlopen(SOURCE + '/' + urllib.parse.quote(path, safe='/'), timeout=20) as response:
        return response.read(limit + 1)

license_bytes = fetch('LICENSE.md', 20_000)
if hashlib.sha256(license_bytes).hexdigest() != LICENSE_SHA256:
    raise RuntimeError('Source license has changed; do not download assets.')
entries = [e for e in json.loads((ROOT / 'HANDOFF_MANIFEST.json').read_text())['files'] if e['path'].startswith('public/exercise-photos/')]

def recover(entry):
    target = (ROOT / entry['path']).resolve()
    if not target.is_relative_to(ROOT / 'public/exercise-photos') or entry['bytes'] > 2_000_000:
        raise RuntimeError('Unexpected source path or image size')
    if target.exists():
        data = target.read_bytes()
        if hashlib.sha256(data).hexdigest() != entry['sha256']:
            raise RuntimeError('Existing photo differs; preserving it: ' + entry['path'])
        return 'present'
    data = fetch('exercises/' + entry['path'].removeprefix('public/exercise-photos/'), entry['bytes'])
    if len(data) != entry['bytes'] or hashlib.sha256(data).hexdigest() != entry['sha256']:
        raise RuntimeError('Source image differs from original: ' + entry['path'])
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open('xb') as output:
        output.write(data)
    return 'restored'

counts = {'present': 0, 'restored': 0, 'failed': 0}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as workers:
    tasks = {workers.submit(recover, e): e for e in entries}
    for index, task in enumerate(concurrent.futures.as_completed(tasks), 1):
        try:
            counts[task.result()] += 1
        except Exception as error:
            counts['failed'] += 1
            print('FAIL', tasks[task]['path'], str(error), flush=True)
        if index % 200 == 0:
            print(index, counts, flush=True)
print(json.dumps({'revision': REVISION, 'license_sha256': LICENSE_SHA256, **counts}), flush=True)
if counts['failed']:
    raise SystemExit(1)
