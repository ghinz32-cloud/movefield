"""Publish verified existing Android test APKs; never compile or publish iOS/store apps."""
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import urllib.error
import urllib.parse
import urllib.request
import zipfile

REPOSITORY = 'ghinz32-cloud/movefield'
API = 'https://api.github.com/repos/' + REPOSITORY
SOURCE = os.environ['NATIVE_PUBLISH_SOURCE']
RUN = os.environ['NATIVE_PUBLISH_RUN']
TOKEN = os.environ['NATIVE_PUBLISH_TOKEN']
assert re.fullmatch(r'[a-f0-9]{40}', SOURCE), 'Use an exact reviewed source commit'
assert re.fullmatch(r'[0-9]+', RUN), 'Use a numeric successful workflow run'
TAG = 'android-ux-preview-' + SOURCE[:12]
CERTIFICATE = 'fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c'
ROOT = Path.cwd()
DESTINATION = ROOT / '.sites-runtime/native-release'
DESTINATION.mkdir(parents=True, exist_ok=True)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def request_json(endpoint, payload=None, method=None):
    request = urllib.request.Request(API + endpoint,
        data=None if payload is None else json.dumps(payload).encode(),
        headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json',
                 'Accept': 'application/vnd.github+json'}, method=method)
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)


run = request_json('/actions/runs/' + RUN)
assert run['conclusion'] == 'success' and run['workflow_id'] == 383503934
assert run['repository']['full_name'] == REPOSITORY
jobs = request_json('/actions/runs/' + RUN + '/jobs')['jobs']
assert {j['name'] for j in jobs} == {'android (movefield)', 'android (grizzly)'}
assert all(j['conclusion'] == 'success' for j in jobs)
artifacts = request_json('/actions/runs/' + RUN + '/artifacts')['artifacts']
sdk = Path(os.environ['ANDROID_HOME'])
records = []
for app, package, version, code, filename in [
    ('movefield', 'com.ghinz32.movefield', '0.1.4', 5, 'movefield-0.1.4-arm64.apk'),
    ('grizzly', 'com.ghinz32.grizzlyfitness.prototype', '0.1.3', 4, 'grizzly-fitness-0.1.3-arm64.apk'),
]:
    artifact = next(a for a in artifacts if a['name'] == app + '-arm64-current-test-only')
    assert not artifact['expired']
    api_request = urllib.request.Request(API + '/actions/artifacts/' + str(artifact['id']) + '/zip',
        headers={'Authorization': 'Bearer ' + TOKEN})
    try:
        urllib.request.build_opener(NoRedirect()).open(api_request, timeout=60)
    except urllib.error.HTTPError as error:
        assert error.code == 302
        location = error.headers['Location']
    else:
        raise RuntimeError('Expected an authenticated GitHub artifact redirect')
    url = urllib.parse.urlsplit(location)
    assert url.scheme == 'https' and not url.username and not url.password
    assert url.hostname and url.hostname.endswith('.blob.core.windows.net')
    # The GitHub token is never forwarded to the signed artifact-storage URL.
    with urllib.request.urlopen(location, timeout=90) as response:
        raw = response.read(80 * 1024 * 1024)
    assert len(raw) < 80 * 1024 * 1024
    archive_sha = hashlib.sha256(raw).hexdigest()
    assert artifact['digest'] == 'sha256:' + archive_sha
    directory = DESTINATION / app
    directory.mkdir(exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        for info in archive.infolist():
            path = PurePosixPath(info.filename)
            assert not path.is_absolute() and '..' not in path.parts
            assert (info.external_attr >> 16) & 0o170000 != 0o120000
            if info.is_dir():
                continue
            assert info.file_size < 65 * 1024 * 1024
            target = directory / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.read(info))
    source = (directory / 'evidence/source.txt').read_text().splitlines()
    assert source[0] == SOURCE and len(source) == 2
    assert source[1] == request_json('/git/commits/' + SOURCE)['tree']['sha']
    original = directory / (app + '-arm64-test.apk')
    apk_sha = hashlib.sha256(original.read_bytes()).hexdigest()
    assert (directory / 'SHA256SUMS').read_text().split() == [apk_sha, original.name]
    evidence = directory / 'actual-inspection'
    evidence.mkdir(exist_ok=True)
    app_env = {**os.environ, 'NATIVE_EXPECTED_PACKAGE': package}

    def output(name, command):
        with (evidence / name).open('wb') as stream:
            subprocess.run([str(x) for x in command], env=app_env, stdout=stream, check=True)

    analyzer = sdk / 'cmdline-tools/latest/bin/apkanalyzer'
    output('manifest.xml', [analyzer, 'manifest', 'print', original])
    output('resources.txt', [sdk / 'build-tools/36.0.0/aapt2', 'dump', 'resources', original])
    output('signing.txt', [sdk / 'build-tools/36.0.0/apksigner', 'verify', '--print-certs', original])
    subprocess.run(['python3', 'scripts/extract-apk-rules.py', str(original),
                    str(evidence / 'manifest.xml'), str(evidence / 'resources.txt'),
                    str(analyzer), str(evidence)], env=app_env, check=True)
    output('inspection.json', ['python3', 'scripts/inspect-native-artifacts.py', 'android',
                              evidence / 'manifest.xml', evidence / 'backup.xml',
                              evidence / 'extraction.xml', evidence / 'resources.txt'])
    subprocess.run(['python3', 'scripts/check-native-preview-identity.py',
                    str(evidence / 'manifest.xml'), str(evidence / 'signing.txt')],
                   env=app_env, check=True)
    with zipfile.ZipFile(original) as archive:
        architectures = {n.split('/')[1] for n in archive.namelist()
                         if n.startswith('lib/') and n.endswith('.so')}
        assert architectures == {'arm64-v8a'}
        bundle_sha = hashlib.sha256(archive.read('assets/index.android.bundle')).hexdigest()
    published = DESTINATION / filename
    published.write_bytes(original.read_bytes())
    records.append({'app': app, 'filename': filename, 'artifactId': artifact['id'],
        'archiveSHA256': archive_sha, 'sourceCommit': SOURCE, 'sourceTree': source[1],
        'package': package, 'versionName': version, 'versionCode': code,
        'bytes': published.stat().st_size, 'sha256': apk_sha, 'architecture': 'arm64-v8a',
        'applicationBundleSHA256': bundle_sha,
        'signingCertificateSHA256': CERTIFICATE,
        'inspection': json.loads((evidence / 'inspection.json').read_text())})

# A new immutable-source tag only: existing releases/assets are never overwritten.
try:
    request_json('/releases/tags/' + TAG)
except urllib.error.HTTPError as error:
    assert error.code == 404
else:
    raise RuntimeError('Release already exists; inspect it instead of replacing files')
notes = ('Current audited Android test apps: Movefield 0.1.4 (5) and Grizzly Fitness 0.1.3 (4).\n\n'
    'Includes the latest native UI/callback/keyboard/numeric-entry/large-text fixes and shared training. '
    'ARM64 phones, Android 7.0+. Development-signed; physical-device acceptance and store release remain pending. '
    'Back up records and update over the existing app.\n\n'
    'No signed iPhone installer is included; Apple signing/build access is still required.\n\n'
    'Exact compiled source: ' + SOURCE + '.\nBuild: ' + run['html_url'] + '.\n'
    'Both APK signatures, identities, transport and backup rules were rechecked before publication. '
    'Checksums and source evidence accompany the downloads.')
release = request_json('/releases', {'tag_name': TAG, 'target_commitish': SOURCE,
    'name': 'Movefield & Grizzly — current Android test apps', 'body': notes,
    'draft': True, 'prerelease': True, 'make_latest': 'false'}, 'POST')
receipt = {'format': 'fitness-native-release-v1', 'workflowRun': int(RUN),
    'sourceCommit': SOURCE, 'sourceTree': records[0]['sourceTree'], 'apps': records,
    'scope': 'Verified development-signed Android APK delivery; no iPhone/store/physical-device qualification.'}
(DESTINATION / 'native-build-evidence.json').write_text(json.dumps(receipt, indent=2) + '\n')
(DESTINATION / 'SHA256SUMS').write_text(''.join(r['sha256'] + '  ' + r['filename'] + '\n' for r in records))
for filename in [r['filename'] for r in records] + ['native-build-evidence.json', 'SHA256SUMS']:
    data = (DESTINATION / filename).read_bytes()
    upload = 'https://uploads.github.com/repos/' + REPOSITORY + '/releases/' + str(release['id']) + '/assets?name=' + urllib.parse.quote(filename)
    request = urllib.request.Request(upload, data=data, method='POST',
        headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/octet-stream'})
    with urllib.request.urlopen(request, timeout=120) as response:
        asset = json.load(response)
    assert asset['size'] == len(data)
    assert asset['digest'] == 'sha256:' + hashlib.sha256(data).hexdigest()
release = request_json('/releases/' + str(release['id']), {'draft': False}, 'PATCH')
print(json.dumps({'published': release['html_url'], 'sourceCommit': SOURCE,
                  'apps': [{k: r[k] for k in ['app', 'versionName', 'versionCode', 'sha256']} for r in records]}))
