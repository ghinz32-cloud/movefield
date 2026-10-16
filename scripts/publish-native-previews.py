"""Publish verified existing Android test APKs; never compile or publish iOS/store apps."""
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
import traceback
import urllib.error
import urllib.parse
import urllib.request
import zipfile


def report_failure(kind, error, trace):
    # Actions annotations remain readable when the log storage is unavailable.
    # Include only our filename/line and exception class, never signed URLs,
    # request headers, environment variables or arbitrary exception messages.
    frames = [frame for frame in traceback.extract_tb(trace)
              if Path(frame.filename).name == Path(__file__).name]
    line = frames[-1].lineno if frames else 1
    print(f'::error file=scripts/publish-native-previews.py,line={line}::'
          f'Android publisher stopped: {kind.__name__} at source line {line}.', flush=True)
    sys.__excepthook__(kind, error, trace)


sys.excepthook = report_failure

REPOSITORY = 'ghinz32-cloud/movefield'
API = 'https://api.github.com/repos/' + REPOSITORY
SOURCE = os.environ['NATIVE_PUBLISH_SOURCE']
RUN = os.environ['NATIVE_PUBLISH_RUN']
TOKEN = os.environ['NATIVE_PUBLISH_TOKEN']
DRAFT = os.environ.get('NATIVE_PUBLISH_DRAFT', '')
assert re.fullmatch(r'[a-f0-9]{40}', SOURCE), 'Use an exact reviewed source commit'
assert re.fullmatch(r'[0-9]+', RUN), 'Use a numeric successful workflow run'
assert not DRAFT or re.fullmatch(r'[1-9][0-9]*', DRAFT), 'Use an explicit positive draft release ID'
TAG = 'android-ux-preview-' + SOURCE[:12]
CERTIFICATE = 'fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c'
ROOT = Path.cwd()
DESTINATION = ROOT / '.sites-runtime/native-release'
DESTINATION.mkdir(parents=True, exist_ok=True)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def classify_api_failure(message):
    """Return only known safe labels, never the provider's arbitrary message."""
    text = message.lower() if isinstance(message, str) else ''
    if 'resource not accessible by integration' in text:
        return 'integration permission denied'
    if 'rate limit' in text or 'abuse detection' in text:
        return 'provider rate limit'
    if 'bad credentials' in text or 'requires authentication' in text:
        return 'authentication rejected'
    if 'repository rule' in text or 'protected tag' in text:
        return 'repository rule restriction'
    return 'unclassified provider refusal'


def report_api_failure(error, operation):
    try:
        message = json.loads(error.read(4096)).get('message')
    except (ValueError, AttributeError):
        message = None
    print(f'::error::GitHub API {operation}: HTTP {error.code}; '
          f'{classify_api_failure(message)}', flush=True)


def request_json(endpoint, payload=None, method=None):
    request = urllib.request.Request(API + endpoint,
        data=None if payload is None else json.dumps(payload).encode(),
        headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json',
                 'Accept': 'application/vnd.github+json'}, method=method)
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        # Emit only our fixed API path, numeric status and a safe label. Never
        # print provider bodies, request headers or signed storage URLs.
        if error.code != 404:
            report_api_failure(error, (method or 'GET') + ' ' + endpoint)
        raise


def verify_android_build_jobs(jobs, run_id, workflow_head, run_attempt):
    """Require the latest attempt of each app; an older green job cannot win."""
    expected = ('android (movefield)', 'android (grizzly)')
    if type(run_attempt) is not int or run_attempt < 1:
        raise ValueError('Invalid workflow run attempt')
    seen, job_ids, latest = set(), set(), {}
    for job in jobs:
        name, attempt, job_id = job.get('name'), job.get('run_attempt'), job.get('id')
        if name not in (*expected, 'publish_android'):
            raise ValueError('Unexpected installer workflow job: ' + str(name))
        if job.get('run_id') != run_id or job.get('head_sha') != workflow_head:
            raise ValueError('Installer job belongs to a different run or workflow head')
        if type(attempt) is not int or not 1 <= attempt <= run_attempt:
            raise ValueError('Installer job attempt is outside the verified run')
        if type(job_id) is not int or job_id < 1 or job_id in job_ids:
            raise ValueError('Invalid or duplicate installer job ID')
        job_ids.add(job_id)
        if (name, attempt) in seen:
            raise ValueError('Duplicate installer job within one attempt: ' + name)
        seen.add((name, attempt))
        if name in expected:
            if name not in latest or attempt > latest[name]['run_attempt']:
                latest[name] = job
        elif job.get('status') != 'completed' or job.get('conclusion') != 'skipped':
            raise ValueError('The source build run must not execute its publisher')
    if set(latest) != set(expected):
        raise ValueError('Both Android installer jobs are required')
    selected = [latest[name] for name in expected]
    if max(job['run_attempt'] for job in selected) != run_attempt:
        raise ValueError('Latest workflow attempt is missing from the job list')
    for job in selected:
        if job.get('status') != 'completed' or job.get('conclusion') != 'success':
            raise ValueError('Latest Android installer job did not succeed: ' + job['name'])
    return selected


def verify_apk_artifacts(artifacts):
    selected = {}
    for app in ('movefield', 'grizzly'):
        matches = [a for a in artifacts if a.get('name') == app + '-arm64-current-test-only']
        if len(matches) != 1 or matches[0].get('expired') is not False:
            raise ValueError('Expected exactly one available APK artifact for ' + app)
        selected[app] = matches[0]
    return selected


def verify_supplied_draft(release, draft_id, tag, source, tag_ref):
    """Resume only the explicitly supplied, empty draft at the immutable source."""
    if type(draft_id) is not int or draft_id < 1 or type(release.get('id')) is not int or release['id'] != draft_id:
        raise ValueError('The supplied draft release ID does not match')
    if release.get('draft') is not True or release.get('prerelease') is not True or release.get('published_at') is not None:
        raise ValueError('Only an unpublished prerelease draft may be supplied')
    if release.get('tag_name') != tag or release.get('target_commitish') != source:
        raise ValueError('The supplied draft has a different tag or source')
    if release.get('assets') != []:
        raise ValueError('The supplied draft must have no assets; nothing may be overwritten')
    target = tag_ref.get('object', {})
    if tag_ref.get('ref') != 'refs/tags/' + tag or target.get('type') != 'commit' or target.get('sha') != source:
        raise ValueError('The remote lightweight tag must point at the exact reviewed source')
    return release


run = request_json('/actions/runs/' + RUN)
assert run['status'] == 'completed' and run['conclusion'] == 'success' and run['workflow_id'] == 383503934
assert run['repository']['full_name'] == REPOSITORY
assert run['id'] == int(RUN) and re.fullmatch(r'[a-f0-9]{40}', run['head_sha'])
job_list = request_json('/actions/runs/' + RUN + '/jobs?filter=all&per_page=100')
assert job_list['total_count'] == len(job_list['jobs']), 'Incomplete installer job listing'
# Workflow execution can check out a separate reviewed source_ref. Job heads
# bind the workflow snapshot; each APK's source.txt independently binds SOURCE.
selected_jobs = verify_android_build_jobs(job_list['jobs'], int(RUN), run['head_sha'], run['run_attempt'])
artifact_list = request_json('/actions/runs/' + RUN + '/artifacts?per_page=100')
assert artifact_list['total_count'] == len(artifact_list['artifacts']), 'Incomplete installer artifact listing'
artifacts = verify_apk_artifacts(artifact_list['artifacts'])
sdk = Path(os.environ['ANDROID_HOME'])
records = []
for app, package, version, code, filename in [
    ('movefield', 'com.ghinz32.movefield', '0.1.5', 6, 'movefield-0.1.5-arm64.apk'),
    ('grizzly', 'com.ghinz32.grizzlyfitness.prototype', '0.1.4', 5, 'grizzly-fitness-0.1.4-arm64.apk'),
]:
    artifact = artifacts[app]
    build_job = next(job for job in selected_jobs if job['name'] == 'android (' + app + ')')
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
        'verifiedJobId': build_job['id'], 'verifiedJobAttempt': build_job['run_attempt'],
        'artifactCreatedAt': artifact['created_at'],
        'archiveSHA256': archive_sha, 'sourceCommit': SOURCE, 'sourceTree': source[1],
        'package': package, 'versionName': version, 'versionCode': code,
        'bytes': published.stat().st_size, 'sha256': apk_sha, 'architecture': 'arm64-v8a',
        'applicationBundleSHA256': bundle_sha,
        'signingCertificateSHA256': CERTIFICATE,
        'inspection': json.loads((evidence / 'inspection.json').read_text())})

# Existing releases/assets remain protected. An operator may explicitly supply
# one reviewed empty draft when the workflow cannot create releases itself.
if DRAFT:
    release = verify_supplied_draft(request_json('/releases/' + DRAFT), int(DRAFT), TAG, SOURCE,
                                    request_json('/git/ref/tags/' + TAG))
else:
    try:
        request_json('/releases/tags/' + TAG)
    except urllib.error.HTTPError as error:
        assert error.code == 404
    else:
        raise RuntimeError('Release already exists; inspect it instead of replacing files')
notes = ('Current audited Android test apps: Movefield 0.1.5 (6) and Grizzly Fitness 0.1.4 (5).\n\n'
    'Includes the reviewed routine library, equipment and exercise-substitution corrections, '
    'and current web/native interface fixes in the shared training code. '
    'ARM64 phones, Android 7.0+. Development-signed; physical-device acceptance and store release remain pending. '
    'Back up records and update over the existing app.\n\n'
    'No signed iPhone installer is included; Apple signing/build access is still required.\n\n'
    'Exact compiled source: ' + SOURCE + '.\nBuild: ' + run['html_url'] + '.\n'
    'Both APK signatures, identities, transport and backup rules were rechecked before publication. '
    'Checksums and source evidence accompany the downloads.')
if not DRAFT:
    release = request_json('/releases', {'tag_name': TAG, 'target_commitish': SOURCE,
        'name': 'Movefield & Grizzly — current Android test apps', 'body': notes,
        'draft': True, 'prerelease': True, 'make_latest': 'false'}, 'POST')
receipt = {'format': 'fitness-native-release-v1', 'workflowRun': int(RUN),
    'explicitDraftReleaseId': int(DRAFT) if DRAFT else None,
    'workflowRunAttempt': run['run_attempt'],
    'workflowHeadCommit': run['head_sha'],
    'selectedJobOutcomes': [{key: job[key] for key in
                            ['id', 'name', 'run_attempt', 'head_sha', 'started_at', 'completed_at']}
                           for job in selected_jobs],
    'jobOutcomeScope': 'GitHub may carry a successful execution into a later run attempt. '
        'Verified job attempts identify accepted API outcomes, not necessarily a new compilation. '
        'Artifact creation times, archive digests and independently checked source/tree IDs identify the delivered bytes.',
    'sourceCommit': SOURCE, 'sourceTree': records[0]['sourceTree'], 'apps': records,
    'scope': 'Verified development-signed Android APK delivery; no iPhone/store/physical-device qualification.'}
(DESTINATION / 'native-build-evidence.json').write_text(json.dumps(receipt, indent=2) + '\n')
(DESTINATION / 'SHA256SUMS').write_text(''.join(r['sha256'] + '  ' + r['filename'] + '\n' for r in records))
for filename in [r['filename'] for r in records] + ['native-build-evidence.json', 'SHA256SUMS']:
    data = (DESTINATION / filename).read_bytes()
    upload = 'https://uploads.github.com/repos/' + REPOSITORY + '/releases/' + str(release['id']) + '/assets?name=' + urllib.parse.quote(filename)
    request = urllib.request.Request(upload, data=data, method='POST',
        headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/octet-stream'})
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            asset = json.load(response)
    except urllib.error.HTTPError as error:
        report_api_failure(error, 'POST release asset ' + filename)
        raise
    assert asset['size'] == len(data)
    assert asset['digest'] == 'sha256:' + hashlib.sha256(data).hexdigest()
release = request_json('/releases/' + str(release['id']), {'draft': False}, 'PATCH')
print(json.dumps({'published': release['html_url'], 'sourceCommit': SOURCE,
                  'apps': [{k: r[k] for k in ['app', 'versionName', 'versionCode', 'sha256']} for r in records]}))
