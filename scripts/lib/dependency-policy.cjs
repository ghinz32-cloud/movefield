'use strict';

// These are CI exceptions, never release waivers. Published fixes remain pending.
const EXCEPTION_EXPIRES_AT = Date.parse('2026-11-08T00:00:00Z');
const CI_EXCEPTIONS = Object.freeze({
  'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm': 'braces',
  'https://github.com/advisories/GHSA-86w9-cpqp-85rv': 'node-forge',
});
const SEVERITIES = ['info', 'low', 'moderate', 'high', 'critical'];
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isHigh = severity => severity === 'high' || severity === 'critical';

/**
 * Evaluate an npm v2 / pnpm audit report without starting commands or writing files.
 * Callers supply a clock and the audit process status. Malformed/incomplete reports
 * fail closed; propagated npm findings must resolve to an actual advisory root.
 */
function evaluateDependencyReport(report, {mode = 'ci', now, exitCode} = {}) {
  const errors = [];
  const findings = [];
  const finish = () => ({
    ok: errors.length === 0 && findings.every(finding => finding.allowed),
    mode,
    exceptionExpiresAt: new Date(EXCEPTION_EXPIRES_AT).toISOString(),
    findings,
    errors,
  });
  if (mode !== 'ci' && mode !== 'release') errors.push('Unknown dependency policy mode.');
  if (!Number.isFinite(now)) errors.push('Dependency policy requires a finite audit timestamp.');
  if (exitCode !== 0 && exitCode !== 1) errors.push('Audit process did not complete with a supported status.');
  if (!isRecord(report)) {
    errors.push('Audit report must be an object.');
    return finish();
  }
  if (report.error !== undefined && report.error !== null) errors.push('Audit service returned an error.');
  const summary = report.metadata?.vulnerabilities;
  if (!isRecord(summary) || SEVERITIES.some(level => !Number.isSafeInteger(summary[level]) || summary[level] < 0)) {
    errors.push('Audit vulnerability summary is missing or invalid.');
  }

  const roots = [];
  const observed = Object.fromEntries(SEVERITIES.map(level => [level, 0]));
  function advisory(value) {
    if (!isRecord(value) || !SEVERITIES.includes(value.severity)) {
      errors.push('Audit advisory has an invalid severity or shape.');
      return null;
    }
    const name = value.name || value.module_name;
    if (typeof name !== 'string' || !name || typeof value.url !== 'string' || !value.url) {
      errors.push('Audit advisory is missing its package or URL.');
      return null;
    }
    return {name, severity: value.severity, url: value.url};
  }

  if (Object.hasOwn(report, 'advisories')) {
    if (!isRecord(report.advisories)) {
      errors.push('pnpm audit advisory collection is invalid.');
    } else {
      for (const value of Object.values(report.advisories)) {
        const root = advisory(value);
        if (!root) continue;
        observed[root.severity]++;
        if (isHigh(root.severity)) roots.push(root);
      }
    }
  } else if (Object.hasOwn(report, 'vulnerabilities')) {
    if (!isRecord(report.vulnerabilities)) {
      errors.push('npm audit vulnerability collection is invalid.');
    } else {
      const entries = report.vulnerabilities;
      const directRoots = new Map();
      for (const [name, entry] of Object.entries(entries)) {
        if (!isRecord(entry) || !SEVERITIES.includes(entry.severity) || !Array.isArray(entry.via)) {
          errors.push('npm audit vulnerability has an invalid severity or dependency chain.');
          continue;
        }
        observed[entry.severity]++;
        if (entry.severity === 'critical') errors.push('Critical npm vulnerability cannot inherit a temporary high-severity exception.');
        const direct = [];
        for (const via of entry.via) {
          if (typeof via === 'string') {
            if (!Object.hasOwn(entries, via)) errors.push('npm audit chain refers to a missing vulnerability.');
          } else {
            const root = advisory(via);
            if (root && isHigh(root.severity)) direct.push(root);
          }
        }
        directRoots.set(name, direct);
        roots.push(...direct);
      }
      // A propagated high entry cannot disappear into a string-only, broken or
      // cyclic chain; otherwise an unrelated issue could inherit an exception.
      function hasHighRoot(name, visiting = new Set()) {
        if (visiting.has(name)) return false;
        if (directRoots.get(name)?.length) return true;
        const entry = entries[name];
        if (!Array.isArray(entry?.via)) return false;
        const next = new Set(visiting).add(name);
        return entry.via.some(via => typeof via === 'string' && hasHighRoot(via, next));
      }
      for (const [name, entry] of Object.entries(entries)) {
        if (isHigh(entry?.severity) && !hasHighRoot(name)) errors.push('High npm vulnerability has no verifiable advisory root.');
      }
    }
  } else {
    errors.push('Audit report contains no recognized advisory collection.');
  }

  if (isRecord(summary)) {
    for (const level of SEVERITIES) {
      if (summary[level] !== observed[level]) errors.push(`Audit ${level} count does not match the vulnerability collection.`);
    }
  }
  if (exitCode === 1 && Object.values(observed).every(count => count === 0)) {
    errors.push('Audit failed without reporting any vulnerabilities.');
  }

  const seen = new Set();
  for (const root of roots) {
    const key = JSON.stringify(root);
    if (seen.has(key)) continue;
    seen.add(key);
    // Match package, exact URL and existing high severity. A future escalation
    // to critical must not silently inherit the temporary high-severity waiver.
    const known = Object.hasOwn(CI_EXCEPTIONS, root.url) && CI_EXCEPTIONS[root.url] === root.name && root.severity === 'high';
    const allowed = mode === 'ci' && known && now < EXCEPTION_EXPIRES_AT;
    const disposition = mode === 'release' ? 'release-blocker' : allowed ? 'temporary-ci-exception' : known ? 'expired-ci-exception' : 'unaccepted-advisory';
    findings.push({...root, allowed, disposition});
  }
  return finish();
}

module.exports = {CI_EXCEPTIONS, EXCEPTION_EXPIRES_AT, evaluateDependencyReport};
