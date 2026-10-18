"""Record an actual Gradle task outcome and JUnit files; never invent test passes."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET


TASK = ':app:testReleaseUnitTest'
TASK_LINE = re.compile(r'^> Task ' + re.escape(TASK) + r'(?: (NO-SOURCE|SKIPPED|UP-TO-DATE|FROM-CACHE|FAILED))?\s*$')


def collect(log, results, gradle_exit):
    problems = []
    observations = []
    log_bytes = log.read_bytes() if log.is_file() else None
    if log_bytes is None:
        problems.append('Gradle plain log is missing')
    else:
        for number, line in enumerate(log_bytes.decode('utf-8', errors='replace').splitlines(), 1):
            match = TASK_LINE.fullmatch(line)
            if match:
                observations.append({'line': number, 'statusToken': match.group(1)})
    tokens = [row['statusToken'] for row in observations]
    # A task may print its start and then its FAILED terminal line. Refuse
    # unrelated repeated executions or conflicting terminal outcomes.
    if len(tokens) > 1 and tokens != [None, 'FAILED']:
        problems.append('Ambiguous repeated app unit-task outcomes')
    token = tokens[-1] if tokens else None
    outcome = token or ('SUCCESS' if observations and gradle_exit == 0 else
                        'EXECUTED_OUTCOME_UNCONFIRMED' if observations else 'NOT_OBSERVED')
    if not observations and gradle_exit == 0:
        problems.append('Successful Gradle command did not report the requested app unit task')
    if token == 'FAILED' and gradle_exit == 0:
        problems.append('Failed unit task conflicts with successful Gradle exit')

    reports = []
    totals = {'tests': 0, 'failures': 0, 'errors': 0, 'skipped': 0}
    report_paths = sorted(results.glob('TEST-*.xml')) if results.is_dir() else []
    for path in report_paths:
        if path.is_symlink() or not path.is_file():
            problems.append('JUnit report must be a regular file: ' + path.name)
            continue
        raw = path.read_bytes()
        try:
            document = ET.fromstring(raw)
            if document.tag not in ('testsuite', 'testsuites'):
                raise ValueError('Unexpected JUnit root')
            cases = list(document.iter('testcase'))
            counts = {'tests': len(cases),
                      **{kind: sum(case.find(kind[:-1] if kind != 'skipped' else kind) is not None for case in cases)
                         for kind in ('failures', 'errors', 'skipped')}}
            for key in totals:
                totals[key] += counts[key]
            reports.append({'file': path.name, 'sha256': hashlib.sha256(raw).hexdigest(), **counts})
        except (ET.ParseError, ValueError):
            problems.append('Malformed JUnit report: ' + path.name)
    if outcome in ('NO-SOURCE', 'SKIPPED') and reports:
        problems.append('Nonexecuted unit task has unexpected JUnit files; possible stale reports')
    if gradle_exit == 0 and (totals['failures'] or totals['errors']):
        problems.append('Successful Gradle command conflicts with failed JUnit cases')
    if outcome in ('NO-SOURCE', 'SKIPPED'):
        execution = 'no_tests_executed'
    elif outcome in ('UP-TO-DATE', 'FROM-CACHE'):
        execution = 'not_executed_this_invocation_reports_may_be_reused'
    elif outcome == 'SUCCESS' and totals['tests'] > 0 and not problems:
        execution = 'successful_task_with_actual_junit_cases'
    elif outcome == 'SUCCESS':
        execution = 'no_test_cases_observed'
    else:
        execution = 'not_confirmed_by_successful_task'
    return {'format': 'native-unit-task-evidence-v1', 'task': TASK,
            'gradleExitCode': gradle_exit, 'plainLogPresent': log_bytes is not None,
            'plainLogSHA256': hashlib.sha256(log_bytes).hexdigest() if log_bytes is not None else None,
            'taskLogObservations': observations, 'taskOutcome': outcome,
            'outcomeBasis': 'explicit Gradle status token' if token else
                            'bare task line plus overall Gradle exit' if observations else 'no matching task line',
            'junit': {'directoryPresent': results.is_dir(), 'fileCount': len(report_paths),
                      'parsedFileCount': len(reports), 'noFiles': len(report_paths) == 0,
                      'countsFromActualTestcaseElements': totals, 'files': reports},
            'executionClaim': execution, 'evidenceValid': not problems, 'problems': problems,
            'scope': 'Exact app Gradle unit-task log and actual JUnit XML counts. No Android instrumentation, installed-device or iOS test claim. Zero files/cases are never a passing test suite.'}


def validate_bound_evidence(record, observed, app, source, tree):
    """Recompute log/XML facts, then bind them to independently verified archive provenance."""
    if app not in ('movefield', 'grizzly') or not all(re.fullmatch('[a-f0-9]{40}', value or '') for value in (source, tree)):
        raise ValueError('Invalid unit-evidence provenance')
    if observed.get('evidenceValid') is not True or observed.get('gradleExitCode') != 0:
        raise ValueError('Unit evidence is inconsistent or belongs to a failed Gradle command')
    expected = {**observed, 'app': app, 'sourceCommit': source, 'sourceTree': tree}
    if record != expected:
        raise ValueError('Unit evidence differs from independently inspected log/XML/provenance')
    return record


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--log', type=Path, required=True)
    parser.add_argument('--results', type=Path, required=True)
    parser.add_argument('--gradle-exit-code', type=int, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--app', choices=('movefield', 'grizzly'), required=True)
    parser.add_argument('--source-file', type=Path, required=True)
    args = parser.parse_args()
    if not 0 <= args.gradle_exit_code <= 255:
        parser.error('Gradle exit code must be between 0 and 255')
    report = collect(args.log, args.results, args.gradle_exit_code)
    source = args.source_file.read_text().splitlines()
    if len(source) != 2 or not all(re.fullmatch('[a-f0-9]{40}', value) for value in source):
        parser.error('Source evidence must contain exact commit and tree hashes')
    report.update(app=args.app, sourceCommit=source[0], sourceTree=source[1])
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'taskOutcome': report['taskOutcome'], 'junitFiles': report['junit']['fileCount'],
                      'counts': report['junit']['countsFromActualTestcaseElements'],
                      'executionClaim': report['executionClaim'], 'evidenceValid': report['evidenceValid']}))
    return 0 if report['evidenceValid'] else 1


if __name__ == '__main__':
    sys.exit(main())
