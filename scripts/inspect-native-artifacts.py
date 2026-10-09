"""Fail closed on the final APK XML or built simulator .app security metadata.

Compilation/manifest inspection is not device testing, code signing, store
acceptance, or a complete binary reachability analysis.
"""
import hashlib
import json
from pathlib import Path
import plistlib
import sys
import xml.etree.ElementTree as ET


def check(condition, message):
    if not condition:
        raise ValueError(message)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def android(path):
    root = ET.parse(path).getroot()
    ns = '{http://schemas.android.com/apk/res/android}'
    app = root.find('application')
    check(app is not None, 'Missing APK application manifest')
    check(root.get('package') == 'com.ghinz32.movefield', 'Unexpected APK application identity')
    check(app.get(ns + 'debuggable', 'false') == 'false', 'Release APK must not be debuggable')
    for attribute in ('allowBackup', 'usesCleartextTraffic'):
        check(app.get(ns + attribute) == 'false', 'APK must deny ' + attribute)
    for attribute in ('fullBackupContent', 'dataExtractionRules'):
        value = app.get(ns + attribute)
        check(value is not None and value.startswith('@'), 'APK must link ' + attribute)
    permissions = sorted({node.get(ns + 'name') for node in root if node.tag.startswith('uses-permission')})
    allowed = {'android.permission.INTERNET', 'android.permission.VIBRATE',
               'android.permission.POST_NOTIFICATIONS', 'android.permission.RECEIVE_BOOT_COMPLETED',
               'com.ghinz32.movefield.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'}
    check(set(permissions).issubset(allowed), 'Unexpected merged APK permissions: ' + str(set(permissions) - allowed))
    check({'android.permission.INTERNET', 'android.permission.VIBRATE', 'android.permission.POST_NOTIFICATIONS'}.issubset(permissions), 'Required model/reminder permissions are absent from the APK')
    sdk = root.find('uses-sdk')
    check(sdk is not None and sdk.get(ns + 'minSdkVersion') == '24' and sdk.get(ns + 'targetSdkVersion') == '36', 'Unexpected APK OS requirements')
    return {'platform': 'android', 'package': root.get('package'), 'permissions': permissions,
            'manifestSHA256': sha(path), 'backupRulesLinked': True, 'cleartextDenied': True,
            'signing': 'CI template debug signing; not store distribution',
            'physicalDeviceTested': False, 'storeAccepted': False}


def ios(app):
    def read(path):
        with path.open('rb') as file:
            return plistlib.load(file)
    info = read(app / 'Info.plist')
    check(info.get('CFBundleIdentifier') == 'com.ghinz32.movefield', 'Unexpected iOS bundle identity')
    check(info.get('MinimumOSVersion') == '16.4', 'Unexpected iOS deployment floor')
    ats = info.get('NSAppTransportSecurity', {})
    check(ats.get('NSAllowsArbitraryLoads', False) is False, 'Built app must deny arbitrary internet loads')
    check(not info.get('NSBonjourServices') and not info.get('NSLocalNetworkUsageDescription'), 'Development network declarations must be stripped from Release app')
    root_manifest = read(app / 'PrivacyInfo.xcprivacy')
    reasons = {row['NSPrivacyAccessedAPIType']: set(row['NSPrivacyAccessedAPITypeReasons'])
               for row in root_manifest.get('NSPrivacyAccessedAPITypes', [])}
    for category, expected in {
        'FileTimestamp': {'C617.1', '3B52.1'}, 'DiskSpace': {'E174.1'},
        'UserDefaults': {'CA92.1'}, 'SystemBootTime': {'35F9.1'},
    }.items():
        check(expected.issubset(reasons.get('NSPrivacyAccessedAPICategory' + category, set())), 'Missing built app API reasons: ' + category)
    manifests = []
    for path in sorted(app.rglob('PrivacyInfo.xcprivacy')):
        data = read(path)
        check(data.get('NSPrivacyTracking', False) is False and not data.get('NSPrivacyTrackingDomains'), 'Unexpected built SDK tracking declaration: ' + str(path.relative_to(app)))
        check(not data.get('NSPrivacyCollectedDataTypes'), 'Unexpected built SDK collection declaration requiring review: ' + str(path.relative_to(app)))
        manifests.append({'path': path.relative_to(app).as_posix(), 'sha256': sha(path),
                          'accessedAPIs': data.get('NSPrivacyAccessedAPITypes', [])})
    return {'platform': 'ios', 'bundleIdentifier': info['CFBundleIdentifier'],
            'infoSHA256': sha(app / 'Info.plist'), 'privacyManifests': manifests,
            'signing': 'unsigned simulator Release; not physical iPhone distribution',
            'physicalDeviceTested': False, 'storeAccepted': False}


if __name__ == '__main__':
    check(len(sys.argv) == 3 and sys.argv[1] in {'android', 'ios'},
          'Usage: inspect-native-artifacts.py android merged-manifest.xml | ios built.app')
    result = android(Path(sys.argv[2])) if sys.argv[1] == 'android' else ios(Path(sys.argv[2]))
    print(json.dumps({'passed': True, **result}, indent=2))
