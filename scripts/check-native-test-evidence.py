"""Exercise real task/XML reporting and shell exit preservation without Gradle."""
import importlib.util
import json
import os
from copy import deepcopy
from pathlib import Path
import subprocess
import tempfile
import zipfile

SCRIPTS = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('native_test_evidence', SCRIPTS / 'record-native-test-evidence.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
cases = 0
LINE = '> Task :app:testReleaseUnitTest'


def check(log, files=None, exit_code=0, valid=True, outcome=None, counts=None, claim=None):
    global cases
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        if log is not None:
            (root / 'gradle.log').write_text(log)
        results = root / 'results'
        if files is not None:
            results.mkdir()
            for name, xml in files.items():
                (results / name).write_text(xml)
        result = module.collect(root / 'gradle.log', results, exit_code)
        assert result['evidenceValid'] is valid, result
        if outcome is not None:
            assert result['taskOutcome'] == outcome, result
        if counts is not None:
            assert result['junit']['countsFromActualTestcaseElements'] == counts, result
        if claim is not None:
            assert result['executionClaim'] == claim, result
        assert result['junit']['noFiles'] == (not files), result
        assert result['junit']['fileCount'] == len(files or {}), result
        cases += 1


empty = {'tests': 0, 'failures': 0, 'errors': 0, 'skipped': 0}
passing = '<testsuite tests="999"><testcase name="a"/><testcase name="b"><skipped/></testcase></testsuite>'
failed = '<testsuites><testsuite><testcase name="a"><failure/></testcase><testcase name="b"><error/></testcase></testsuite></testsuites>'
files = {'TEST-synthetic.xml': passing}
check(LINE + ' NO-SOURCE\n', outcome='NO-SOURCE', counts=empty, claim='no_tests_executed')
check(LINE + ' NO-SOURCE\n', files={}, outcome='NO-SOURCE', counts=empty)
check(LINE + ' SKIPPED\n', outcome='SKIPPED', claim='no_tests_executed')
check(LINE + '\nBUILD SUCCESSFUL\n', files=files, outcome='SUCCESS', counts={'tests': 2, 'failures': 0, 'errors': 0, 'skipped': 1}, claim='successful_task_with_actual_junit_cases')
check(LINE + '\n', files={'TEST-one.xml': passing, 'TEST-two.xml': passing}, counts={'tests': 4, 'failures': 0, 'errors': 0, 'skipped': 2})
check(LINE + '\n', files={}, outcome='SUCCESS', counts=empty, claim='no_test_cases_observed')
check(LINE + '\n', files={'TEST-empty.xml': '<testsuite tests="0"/>'}, counts=empty, claim='no_test_cases_observed')
for token in ('UP-TO-DATE', 'FROM-CACHE'):
    check(LINE + ' ' + token, files=files, outcome=token, claim='not_executed_this_invocation_reports_may_be_reused')
    check(LINE + ' ' + token, outcome=token, counts=empty)
    check(LINE + ' ' + token, files={'TEST-failed.xml': failed}, valid=False)
check(LINE + ' FAILED\n', files={'TEST-failed.xml': failed}, exit_code=7, outcome='FAILED', counts={'tests': 2, 'failures': 1, 'errors': 1, 'skipped': 0})
check(LINE + '\n' + LINE + ' FAILED\n', exit_code=7, outcome='FAILED')
check(LINE + '\n', exit_code=7, outcome='EXECUTED_OUTCOME_UNCONFIRMED')
check('Earlier compilation failed\n', exit_code=9, outcome='NOT_OBSERVED')
check(None, exit_code=9, valid=False, outcome='NOT_OBSERVED')
check('BUILD SUCCESSFUL\n', valid=False, outcome='NOT_OBSERVED')
check('> Task :library:testReleaseUnitTest\n', valid=False, outcome='NOT_OBSERVED')
check(LINE + ' FAILED\n', valid=False, outcome='FAILED')
check(LINE + '\n', files={'TEST-bad.xml': '<testsuite>'}, valid=False)
check(LINE + '\n', files={'TEST-bad.xml': '<unrelated/>'}, valid=False)
check(LINE + '\n', files={'TEST-failed.xml': failed}, valid=False)
for token in ('NO-SOURCE', 'SKIPPED'):
    check(LINE + ' ' + token, files=files, valid=False)
check(LINE + '\n' + LINE + '\n', valid=False)
check(LINE + ' NO-SOURCE\n' + LINE + ' FROM-CACHE\n', valid=False)

# Actual bash runner with a bounded local fake Gradle executable. This verifies
# that tee/reporting cannot turn a real Gradle failure into a successful step.
for output, gradle_exit, expected_exit, expected_outcome, xml in [
    (LINE + ' NO-SOURCE', 0, 0, 'NO-SOURCE', None),
    (LINE + ' FAILED', 37, 37, 'FAILED', None),
    ('Failed before app tests', 42, 42, 'NOT_OBSERVED', None),
    ('BUILD SUCCESSFUL', 0, 1, 'NOT_OBSERVED', None),
    (LINE, 0, 0, 'SUCCESS', passing),
    (LINE + ' FAILED', 37, 37, 'FAILED', failed),
]:
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        android = root / 'mobile/android'
        android.mkdir(parents=True)
        evidence = root / 'native-preview/evidence'
        evidence.mkdir(parents=True)
        (evidence / 'source.txt').write_text('a' * 40 + '\n' + 'b' * 40 + '\n')
        gradle = android / 'gradlew'
        write_xml = '' if xml is None else "mkdir -p app/build/test-results/testReleaseUnitTest\ncat > app/build/test-results/testReleaseUnitTest/TEST-shell.xml <<'SYNTHETIC_XML'\n" + xml + '\nSYNTHETIC_XML\n'
        gradle.write_text('#!/usr/bin/env bash\n' + write_xml + 'printf \'%s\\n\' ' + repr(output) + '\nexit ' + str(gradle_exit) + '\n')
        gradle.chmod(0o755)
        result = subprocess.run(['bash', str(SCRIPTS / 'run-native-release-checks.sh')], cwd=android, capture_output=True, text=True, env={**os.environ, 'EXPO_PUBLIC_APP_VARIANT': 'movefield'})
        assert result.returncode == expected_exit, (result.returncode, result.stdout, result.stderr)
        record = json.loads((evidence / 'native-test-evidence.json').read_text())
        assert record['gradleExitCode'] == gradle_exit and record['taskOutcome'] == expected_outcome
        assert (evidence / 'gradle-release-exit-code.txt').read_text().strip() == str(gradle_exit)
        assert output in (evidence / 'gradle-release.log').read_text()
        # Reproduce Actions' file-only ZIP transport, which does not retain an
        # empty directory. Zero XML reports must remain exactly reproducible.
        archive_path = root / 'artifact.zip'
        with zipfile.ZipFile(archive_path, 'w') as archive:
            for path in evidence.rglob('*'):
                if path.is_file():
                    archive.write(path, str(path.relative_to(evidence)))
        copied = root / 'unzipped'
        with zipfile.ZipFile(archive_path) as archive:
            archive.extractall(copied)
        transported = module.collect(copied / 'gradle-release.log', copied / 'unit-test-results', gradle_exit)
        assert record == {**transported, 'app': 'movefield', 'sourceCommit': 'a' * 40, 'sourceTree': 'b' * 40}
        cases += 1
        if xml is not None:
            assert (evidence / 'unit-test-results/TEST-shell.xml').read_text().strip() == xml
            assert record['junit']['fileCount'] == 1
            assert record['junit']['countsFromActualTestcaseElements']['tests'] == 2
            observed = module.collect(evidence / 'gradle-release.log', evidence / 'unit-test-results', gradle_exit)
            assert record == {**observed, 'app': 'movefield', 'sourceCommit': 'a' * 40, 'sourceTree': 'b' * 40}
        cases += 1

with tempfile.TemporaryDirectory() as directory:
    root = Path(directory)
    log = root / 'gradle.log'
    log.write_text(LINE + ' NO-SOURCE\n')
    observed = module.collect(log, root / 'results', 0)
    bound = {**observed, 'app': 'movefield', 'sourceCommit': 'a' * 40, 'sourceTree': 'b' * 40}
    assert module.validate_bound_evidence(bound, observed, 'movefield', 'a' * 40, 'b' * 40) == bound
    cases += 1
    for key, value in [('app', 'grizzly'), ('sourceCommit', 'c' * 40), ('sourceTree', 'c' * 40),
                       ('task', ':other:test'), ('plainLogSHA256', 'c' * 64), ('gradleExitCode', 1),
                       ('taskOutcome', 'SUCCESS'), ('executionClaim', 'successful_task_with_actual_junit_cases'),
                       ('evidenceValid', False), ('problems', ['synthetic']), ('extra', True)]:
        altered = {**bound, key: value}
        try:
            module.validate_bound_evidence(altered, observed, 'movefield', 'a' * 40, 'b' * 40)
        except ValueError:
            pass
        else:
            raise AssertionError('Tampered unit evidence accepted: ' + key)
        cases += 1
    for key, value in [('fileCount', 1), ('noFiles', False), ('countsFromActualTestcaseElements', {'tests': 99})]:
        altered = deepcopy(bound)
        altered['junit'][key] = value
        try:
            module.validate_bound_evidence(altered, observed, 'movefield', 'a' * 40, 'b' * 40)
        except ValueError:
            pass
        else:
            raise AssertionError('Tampered JUnit counts accepted')
        cases += 1
    for invalid in [{**observed, 'evidenceValid': False}, {**observed, 'gradleExitCode': 7}]:
        try:
            module.validate_bound_evidence({**invalid, 'app': 'movefield', 'sourceCommit': 'a' * 40, 'sourceTree': 'b' * 40}, invalid, 'movefield', 'a' * 40, 'b' * 40)
        except ValueError:
            pass
        else:
            raise AssertionError('Failed or invalid unit evidence accepted for publication')
        cases += 1

print(f'PASS {cases} native unit-evidence cases; synthetic XML/task logs and actual shell exit preservation, no Gradle build or device tests')
