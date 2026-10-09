'use strict';

const assert = require('node:assert/strict');
const {evaluateDependencyReport, EXCEPTION_EXPIRES_AT} = require('./lib/dependency-policy.cjs');

const now = Date.parse('2026-10-09T15:00:00Z');
const braces = {name: 'braces', severity: 'high', url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm'};
const forge = {name: 'node-forge', severity: 'high', url: 'https://github.com/advisories/GHSA-86w9-cpqp-85rv'};
const summary = levels => ({info: 0, low: 0, moderate: 0, high: 0, critical: 0, ...levels});
function pnpm(issues) {
  const counts = summary({});
  for (const issue of issues) counts[issue.severity]++;
  return {advisories: Object.fromEntries(issues.map((issue, index) => [index, {...issue, module_name: issue.name}])), metadata: {vulnerabilities: counts}};
}
function npm(entries) {
  const counts = summary({});
  for (const entry of Object.values(entries)) counts[entry.severity]++;
  return {vulnerabilities: entries, metadata: {vulnerabilities: counts}};
}
const evaluate = (report, options = {}) => evaluateDependencyReport(report, {mode: 'ci', now, exitCode: 1, ...options});
let scenarios = 0;
function scenario(name, run) {
  run();
  scenarios++;
  console.log(`PASS ${name}`);
}

scenario('Known findings permit temporary CI work and always block release', () => {
  const report = pnpm([braces, forge]);
  assert.equal(evaluate(report).ok, true);
  assert.equal(evaluate(report).findings.length, 2);
  const release = evaluate(report, {mode: 'release'});
  assert.equal(release.ok, false);
  assert(release.findings.every(finding => !finding.allowed && finding.disposition === 'release-blocker'));
});

scenario('Temporary exception fails exactly at expiry and cannot return after it', () => {
  const report = pnpm([braces]);
  assert.equal(evaluate(report, {now: EXCEPTION_EXPIRES_AT - 1}).ok, true);
  for (const clock of [EXCEPTION_EXPIRES_AT, EXCEPTION_EXPIRES_AT + 1]) {
    const result = evaluate(report, {now: clock});
    assert.equal(result.ok, false);
    assert.equal(result.findings[0].disposition, 'expired-ci-exception');
  }
});

scenario('Additional high issue, critical escalation and lookalike identities fail CI', () => {
  for (const issue of [
    {...braces, url: 'https://github.com/advisories/GHSA-new-issue'},
    {...braces, severity: 'critical'},
    {...braces, name: 'different-package'},
    {...braces, url: `${braces.url}/`},
    {...braces, url: `${braces.url}?waiver=true`},
  ]) {
    const result = evaluate(pnpm([forge, issue]));
    assert.equal(result.ok, false);
    assert(result.findings.some(finding => !finding.allowed));
    assert.equal(evaluate(pnpm([issue]), {mode: 'release'}).ok, false);
  }
});

scenario('npm propagated framework entries retain only their exact advisory roots', () => {
  const entries = {
    braces: {severity: 'high', via: [braces]},
    'node-forge': {severity: 'high', via: [forge]},
    micromatch: {severity: 'high', via: ['braces']},
    'metro-file-map': {severity: 'high', via: ['micromatch']},
    '@expo/metro': {severity: 'high', via: ['metro-file-map']},
    '@expo/code-signing-certificates': {severity: 'high', via: ['node-forge']},
    '@expo/cli': {severity: 'high', via: ['node-forge', '@expo/code-signing-certificates']},
    expo: {severity: 'high', via: ['@expo/cli', '@expo/metro']},
  };
  const report = npm(entries);
  const ci = evaluate(report);
  assert.equal(ci.ok, true);
  assert.equal(ci.findings.length, 2);
  const release = evaluate(report, {mode: 'release'});
  assert.equal(release.ok, false);
  assert.equal(release.findings.length, 2);
  entries.expo.severity = 'critical';
  assert.equal(evaluate(npm(entries)).ok, false);
  entries.expo.severity = 'high';
  entries['@expo/cli'].via.push({name: '@expo/cli', severity: 'critical', url: 'https://github.com/advisories/GHSA-new-critical'});
  assert.equal(evaluate(npm(entries)).ok, false);
});

scenario('Both actual audit formats accept clean reports and preserve moderate threshold', () => {
  for (const report of [pnpm([]), npm({})]) {
    assert.equal(evaluate(report, {exitCode: 0}).ok, true);
    assert.equal(evaluate(report, {exitCode: 0, mode: 'release'}).ok, true);
    assert.equal(evaluate(report, {exitCode: 1}).ok, false);
  }
  const moderate = {...braces, severity: 'moderate', url: 'https://github.com/advisories/GHSA-moderate'};
  assert.equal(evaluate(pnpm([moderate]), {mode: 'release'}).ok, true);
  assert.equal(evaluate(npm({braces: {severity: 'moderate', via: [moderate]}}), {mode: 'release'}).ok, true);
});

scenario('Audit error, invalid report, broken chain and misleading counts fail closed', () => {
  const valid = pnpm([braces]);
  for (const report of [
    undefined, null, [], 'invalid', {},
    {...valid, error: {code: 'ENOAUDIT'}},
    {...valid, advisories: []},
    {...valid, metadata: {}},
    {...valid, metadata: {vulnerabilities: summary({high: 0})}},
    {...valid, advisories: {0: {...braces, severity: 'unrecognized'}}},
    {...valid, advisories: {0: {...braces, url: ''}}},
    npm({expo: {severity: 'high', via: ['absent']}}),
    npm({expo: {severity: 'high', via: ['metro']}, metro: {severity: 'high', via: ['expo']}}),
    npm({expo: {severity: 'high', via: [{...braces, severity: 'moderate'}]}}),
    npm({braces: {severity: 'high', via: [braces]}, hidden: {severity: 'high', via: []}}),
    npm({braces: {severity: 'high', via: [braces]}, hidden: {severity: 'high', via: 'braces'}}),
  ]) {
    const result = evaluate(report);
    assert.equal(result.ok, false);
    assert(result.errors.length > 0);
    assert.equal(evaluate(report, {mode: 'release'}).ok, false);
  }
});

scenario('Process failure, unknown mode and invalid clock cannot waive a finding', () => {
  const report = pnpm([braces]);
  for (const options of [{exitCode: null}, {exitCode: 2}, {mode: 'typo'}, {now: NaN}, {now: Infinity}]) {
    const result = evaluate(report, options);
    assert.equal(result.ok, false);
    assert(result.errors.length > 0);
  }
  assert.equal(evaluateDependencyReport(report).ok, false);
});

console.log(`${scenarios} dependency release-boundary scenarios passed.`);
