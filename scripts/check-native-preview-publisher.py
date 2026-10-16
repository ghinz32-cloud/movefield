"""Exercise actual publisher gates without credentials, API calls or publication."""
import ast
from copy import deepcopy
from pathlib import Path

source = Path(__file__).with_name('publish-native-previews.py')
tree = ast.parse(source.read_text(), filename=str(source))
names = {'verify_android_build_jobs', 'verify_apk_artifacts', 'verify_supplied_draft', 'classify_api_failure'}
gates = [node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name in names]
assert {gate.name for gate in gates} == names
# Importing the publisher executes authenticated requests. Load only its actual
# pure gates so these regression fixtures cannot contact a provider or publish.
namespace = {}
exec(compile(ast.Module(body=gates, type_ignores=[]), str(source), 'exec'), namespace)
verify, verify_artifacts = namespace['verify_android_build_jobs'], namespace['verify_apk_artifacts']
RUN, WORKFLOW_HEAD = 42, 'a' * 40
cases = 0


def job(name, attempt=1, **patch):
    number = {'android (movefield)': 1, 'android (grizzly)': 2, 'publish_android': 3}[name]
    return {'id': attempt * 10 + number, 'name': name, 'run_id': RUN, 'head_sha': WORKFLOW_HEAD,
            'run_attempt': attempt, 'status': 'completed',
            'conclusion': 'skipped' if name == 'publish_android' else 'success', **patch}


android = [job('android (' + app + ')') for app in ['movefield', 'grizzly']]
skipped = job('publish_android')


def check(jobs, accepts, attempt=1, selected_attempts=None):
    global cases
    try:
        selected = verify(jobs, RUN, WORKFLOW_HEAD, attempt)
    except ValueError:
        assert not accepts, 'Valid build jobs were refused'
    else:
        assert accepts, 'Invalid build jobs were accepted'
        if selected_attempts is not None:
            assert [j['run_attempt'] for j in selected] == selected_attempts
            assert [j['name'] for j in selected] == ['android (movefield)', 'android (grizzly)']
    cases += 1


check(android, True, selected_attempts=[1, 1])
check(android + [skipped], True)
check([skipped] + list(reversed(android)), True)
check([], False)
check(android[:1], False)
check([android[1], skipped], False)
check(android + [android[0]], False)
check(android + [{**android[0], 'id': 999}], False)
check(android + [skipped, skipped], False)
check(android + [{**skipped, 'name': 'unreviewed build'}], False)
check(android + [{**skipped, 'name': None}], False)
for position in range(2):
    for conclusion in ['failure', 'cancelled', 'timed_out', 'skipped', None]:
        jobs = deepcopy(android)
        jobs[position]['conclusion'] = conclusion
        check(jobs, False)
    for status in ['queued', 'in_progress', None]:
        jobs = deepcopy(android)
        jobs[position]['status'] = status
        check(jobs, False)
for conclusion in ['success', 'failure', 'cancelled', None]:
    check(android + [{**skipped, 'conclusion': conclusion}], False)
for status in ['queued', 'in_progress', None]:
    check(android + [{**skipped, 'status': status}], False)

# A failed-only retry preserves Grizzly's successful first attempt. The source
# workflow head and run must match for every job, including superseded ones.
retry = [{**android[0], 'conclusion': 'failure'}, android[1], skipped,
         job('android (movefield)', 2), job('publish_android', 2)]
check(retry, True, attempt=2, selected_attempts=[2, 1])
check(list(reversed(retry)), True, attempt=2, selected_attempts=[2, 1])
check([{**j, 'conclusion': 'failure'} for j in android] +
      [job('android (movefield)', 2), job('android (grizzly)', 2)],
      True, attempt=2, selected_attempts=[2, 2])
for patch in [{'conclusion': 'failure'}, {'conclusion': 'cancelled'},
              {'conclusion': 'skipped'}, {'status': 'in_progress'}, {'status': 'queued'}]:
    check(android + [job('android (movefield)', 2, **patch)], False, attempt=2)
check(retry + [job('android (movefield)', 2, id=999)], False, attempt=2)
check(retry + [job('android (movefield)', 3)], False, attempt=2)
check(android, False, attempt=2)  # incomplete listing must not hide the retry
check(retry, False, attempt=1)
check(retry + [job('android (movefield)', 3, conclusion='failure')], False, attempt=3)
check(retry + [job('android (movefield)', 3)], True, attempt=3, selected_attempts=[3, 1])
for patch in [{'head_sha': 'b' * 40}, {'head_sha': None}, {'run_id': RUN + 1},
              {'run_attempt': 0}, {'run_attempt': '1'}, {'run_attempt': True},
              {'run_attempt': None}, {'id': None}, {'id': android[0]['id']}]:
    altered = deepcopy(retry)
    altered[1].update(patch)
    check(altered, False, attempt=2)
check([{**retry[0], 'head_sha': 'b' * 40}] + retry[1:], False, attempt=2)
check([*retry[:2], {**skipped, 'conclusion': 'success'}, *retry[3:]], False, attempt=2)
for attempt in [0, None, True, '2']:
    check(retry, False, attempt=attempt)

artifacts = [{'id': i, 'name': app + '-arm64-current-test-only', 'expired': False}
             for i, app in enumerate(['movefield', 'grizzly'], 1)]


def check_artifacts(values, accepts):
    global cases
    try:
        selected = verify_artifacts(values)
    except ValueError:
        assert not accepts, 'Valid APK artifacts were refused'
    else:
        assert accepts, 'Ambiguous or unavailable APK artifacts were accepted'
        assert set(selected) == {'movefield', 'grizzly'}
    cases += 1


check_artifacts(artifacts, True)
check_artifacts(artifacts + [{'name': 'movefield-compile-evidence'},
                             {'name': 'grizzly-compile-evidence'}], True)
check_artifacts([], False)
check_artifacts(artifacts[:1], False)
check_artifacts(artifacts[1:], False)
for index in range(2):
    check_artifacts(artifacts + [{**artifacts[index], 'id': 100}], False)
    check_artifacts(artifacts + [{**artifacts[index], 'id': 100, 'expired': True}], False)
    for expired in [True, None, 0]:
        changed = deepcopy(artifacts)
        changed[index]['expired'] = expired
        check_artifacts(changed, False)
draft = {'id': 81, 'draft': True, 'prerelease': True, 'published_at': None,
         'tag_name': 'android-ux-preview-' + WORKFLOW_HEAD[:12],
         'target_commitish': WORKFLOW_HEAD, 'assets': []}
tag_ref = {'ref': 'refs/tags/' + draft['tag_name'], 'object': {'type': 'commit', 'sha': WORKFLOW_HEAD}}


def check_draft(value, reference, accepts, supplied=81):
    global cases
    try:
        selected = namespace['verify_supplied_draft'](value, supplied, draft['tag_name'], WORKFLOW_HEAD, reference)
    except ValueError:
        assert not accepts, 'The exact supplied empty draft was refused'
    else:
        assert accepts, 'An unsafe existing release or wrong remote tag was accepted'
        assert selected is value
    cases += 1


check_draft(draft, tag_ref, True)
for patch in [{'id': 82}, {'id': '81'}, {'id': True}, {'draft': False}, {'draft': 1},
              {'prerelease': False}, {'prerelease': 1}, {'published_at': '2026-10-16T12:00:00Z'},
              {'tag_name': 'other-tag'}, {'target_commitish': 'main'},
              {'target_commitish': 'b' * 40}, {'assets': [{'name': 'existing.apk'}]},
              {'assets': None}]:
    check_draft({**draft, **patch}, tag_ref, False)
for supplied in [None, 0, True, '81', 82]:
    check_draft(draft, tag_ref, False, supplied=supplied)
for key in ['id', 'draft', 'prerelease', 'tag_name', 'target_commitish', 'assets']:
    missing = deepcopy(draft)
    del missing[key]
    check_draft(missing, tag_ref, False)
for reference in [{}, {**tag_ref, 'ref': 'refs/tags/other-tag'},
                  {**tag_ref, 'object': {'type': 'tag', 'sha': WORKFLOW_HEAD}},
                  {**tag_ref, 'object': {'type': 'commit', 'sha': 'b' * 40}}]:
    check_draft(draft, reference, False)
for message, label in [
    ('Resource not accessible by integration', 'integration permission denied'),
    ('You have exceeded a secondary rate limit', 'provider rate limit'),
    ('Bad credentials', 'authentication rejected'),
    ('Repository rules prevent this operation', 'repository rule restriction'),
    ('unexpected message with a sensitive-looking token', 'unclassified provider refusal'),
    (None, 'unclassified provider refusal'),
]:
    assert namespace['classify_api_failure'](message) == label
    cases += 1
print('PASS ' + str(cases) + ' publisher job/artifact/draft gate cases; no API, credentials or publication')
