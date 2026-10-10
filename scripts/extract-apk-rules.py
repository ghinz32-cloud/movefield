"""Decode the security rules referenced by the actual optimized APK table.

Requires official Android apkanalyzer; no guessed names or shell execution.
This emits metadata only, not the APK. The independent inspector still checks
all XML contents, permission/transport policy and linked resource identities.
"""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import zipfile

spec = importlib.util.spec_from_file_location('inspector', Path(__file__).with_name('inspect-native-artifacts.py'))
inspector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inspector)


def extract(apk, manifest, resources, analyzer, out, run=subprocess.run):
    out.mkdir(parents=True, exist_ok=True)
    (out / 'rule-paths.json').unlink(missing_ok=True)
    records = inspector.resource_rule_records(resources)
    ns = '{http://schemas.android.com/apk/res/android}'
    apps = inspector.xml(manifest).findall('application')
    inspector.check(len(apps) == 1, 'Expected one APK application')
    ids = {name: record['identifier'] for name, record in records.items()}
    for attribute, name in zip(('fullBackupContent', 'dataExtractionRules'), inspector.RULE_NAMES):
        inspector.linked_rule(apps[0].get(ns + attribute), name, ids)
    decoded = []
    with zipfile.ZipFile(apk) as archive:
        for name, target in zip(inspector.RULE_NAMES, ('backup.xml', 'extraction.xml')):
            record = records[name]
            matches = [item for item in archive.infolist() if item.filename == record['file']]
            inspector.check(len(matches) == 1 and not matches[0].is_dir(), 'Missing/duplicate APK rules file')
            inspector.check(0 < matches[0].file_size <= 65536, 'Unbounded binary rules XML')
            # Reading checks archive CRC before asking the SDK to decode that exact entry.
            archive.read(matches[0])
            result = run([str(analyzer), 'resources', 'xml', '--file', '/' + record['file'], str(apk)],
                         check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
            inspector.check(0 < len(result.stdout) <= 65536, 'Unbounded decoded rules XML')
            path = out / target
            path.write_bytes(result.stdout)
            inspector.xml(path)
            decoded.append({'name': name, **record, 'decodedFile': target,
                            'decodedSHA256': inspector.sha(path)})
    inspector.backup_rules(out / 'backup.xml', out / 'extraction.xml')
    result = {'apkSHA256': inspector.sha(apk), 'manifestSHA256': inspector.sha(manifest),
              'resourceTableSHA256': inspector.sha(resources), 'rules': decoded}
    (out / 'rule-paths.json').write_text(json.dumps(result, indent=2) + '\n')
    return result


if __name__ == '__main__':
    inspector.check(len(sys.argv) == 6, 'Usage: extract-apk-rules.py APK MANIFEST RESOURCES APKANALYZER OUTPUT')
    print(json.dumps(extract(*map(Path, sys.argv[1:])), indent=2))
