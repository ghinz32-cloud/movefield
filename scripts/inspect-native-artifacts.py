"""Inspect decoded metadata extracted from one APK or a built simulator .app.

Android inputs are the manifest, both named rules decoded with apkanalyzer, and
aapt2 dump resources from the same APK. The resource table binds links to files.
This is not signature verification, device testing, store acceptance, or a
complete binary/native API reachability analysis.
"""
import hashlib
import json
from pathlib import Path
import plistlib
import re
import sys
import xml.etree.ElementTree as ET

PACKAGE = 'com.ghinz32.movefield'
DOMAINS = {'root', 'file', 'database', 'sharedpref', 'external',
           'device_root', 'device_file', 'device_database', 'device_sharedpref'}
RULE_NAMES = ('movefield_backup_rules', 'movefield_data_extraction_rules')
NOTIFICATION_RECEIVER = 'expo.modules.notifications.service.NotificationsService'
NOTIFICATION_FORWARDER = 'expo.modules.notifications.service.NotificationForwarderActivity'
NOTIFICATION_ACTIONS = {
    'expo.modules.notifications.NOTIFICATION_EVENT',
    'android.intent.action.BOOT_COMPLETED', 'android.intent.action.REBOOT',
    'android.intent.action.QUICKBOOT_POWERON', 'com.htc.intent.action.QUICKBOOT_POWERON',
    'android.intent.action.MY_PACKAGE_REPLACED',
}
STARTUP_PROVIDER = 'androidx.startup.InitializationProvider'
# Reviewed installed initializers from the exact-source NATIVE2 APK receipt.
# This bounds their manifest registration, not their binary implementation.
STARTUP_INITIALIZERS = {
    'androidx.emoji2.text.EmojiCompatInitializer',
    'androidx.lifecycle.ProcessLifecycleInitializer',
    'androidx.profileinstaller.ProfileInstallerInitializer',
}


def check(condition, message):
    if not condition:
        raise ValueError(message)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def xml(path):
    text = path.read_text(encoding='utf-8')
    check(not re.search(r'<!\s*(?:DOCTYPE|ENTITY)\b', text, re.I),
          'Decoded Android XML must not contain DTD/entity declarations')
    return ET.fromstring(text)


def resource_rule_records(path):
    """Bind stable resource identities to one default original/optimized APK path."""
    package, current = None, None
    records, identities = {}, set()
    expected_names = {'xml/' + name for name in RULE_NAMES}
    for line in path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        match = re.fullmatch(r'Package name=([^\s]+)(?:\s+id=[0-9a-fA-F]{2})?', line)
        if match:
            package, current = match[1], None
            continue
        if line.startswith('resource '):
            match = re.fullmatch(r'resource (0x[0-9a-fA-F]{8}) ([^\s]+)(?:\s+.*)?', line)
            check(match is not None, 'Malformed aapt2 resource row')
            qualified = match[2].split(':', 1)
            owner, name = qualified if len(qualified) == 2 else (package, qualified[0])
            check(owner is not None, 'Missing resource package context')
            identifier = int(match[1], 16)
            check(identifier not in records and (owner, name) not in identities,
                  'Duplicate or ambiguous aapt2 resource identity')
            current = {'package': owner, 'name': name, 'values': []}
            records[identifier] = current
            identities.add((owner, name))
            continue
        if current and current['name'] in expected_names and line.startswith('('):
            current['values'].append(line)
    result = {}
    for name in RULE_NAMES:
        matches = [(identifier, record) for identifier, record in records.items()
                   if record['package'] == PACKAGE and record['name'] == 'xml/' + name]
        check(len(matches) == 1, 'Missing or ambiguous packaged security resource: ' + name)
        identifier, record = matches[0]
        expected = (r'\(\) \(file\) (res/(?:xml/' + re.escape(name) +
                    r'\.xml|[A-Za-z0-9_-]{1,32}\.xml))(?: type=XML)?')
        match = re.fullmatch(expected, record['values'][0]) if len(record['values']) == 1 else None
        check(match is not None,
              'Security resource must have one default original/optimized file value, without aliases/variants: ' + name)
        result[name] = {'identifier': identifier, 'file': match[1]}
    check(len({record['file'] for record in result.values()}) == len(RULE_NAMES),
          'Security resource payload files must be distinct')
    return result


def resource_rules(path):
    return {name: record['identifier'] for name, record in resource_rule_records(path).items()}


def linked_rule(value, name, identifiers):
    check(isinstance(value, str), 'APK must link ' + name)
    if value in {'@xml/' + name, '@' + PACKAGE + ':xml/' + name}:
        return
    match = re.fullmatch(r'@(?:ref/)?(0x[0-9a-fA-F]{8}|[0-9]+|[0-9a-fA-F]{8})', value)
    check(match is not None, 'Unexpected manifest security resource link: ' + value)
    token = match[1]
    base = 16 if token.startswith('0x') or re.search('[a-fA-F]', token) else 10
    check(int(token, base) == identifiers[name], 'Manifest links wrong packaged rules: ' + name)


def exclusions(container):
    check(not (container.text or '').strip(), 'Unexpected text in backup rules')
    found = set()
    for node in container:
        check(node.tag == 'exclude', 'Backup rules must contain exclusions only, never includes')
        check(set(node.attrib) == {'domain', 'path'} and node.get('path') == '.',
              'Backup exclusions must cover the complete domain')
        domain = node.get('domain')
        check(domain in DOMAINS and domain not in found, 'Unknown or duplicate backup domain')
        check(not list(node) and not (node.text or '').strip() and not (node.tail or '').strip(),
              'Backup exclusions must be empty elements')
        found.add(domain)
    check(found == DOMAINS, 'All nine credential/data backup domains must be excluded')


def backup_rules(backup, extraction):
    legacy = xml(backup)
    check(legacy.tag == 'full-backup-content' and not legacy.attrib, 'Unexpected legacy backup rules root')
    exclusions(legacy)
    modern = xml(extraction)
    check(modern.tag == 'data-extraction-rules' and not modern.attrib and not (modern.text or '').strip(),
          'Unexpected data extraction rules root')
    sections = list(modern)
    check(len(sections) == 2 and {node.tag for node in sections} == {'cloud-backup', 'device-transfer'},
          'Both cloud backup and device transfer must have complete exclusions')
    for node in sections:
        allowed = {'disableIfNoEncryptionCapabilities'} if node.tag == 'cloud-backup' else set()
        check(set(node.attrib).issubset(allowed) and
              node.get('disableIfNoEncryptionCapabilities', 'false') in {'true', 'false'},
              'Unexpected extraction rules section attributes')
        check(not (node.tail or '').strip(), 'Unexpected text in extraction rules')
        exclusions(node)


def intent_entries(container, ns, label):
    """Read the reviewed action/category topology without duplicate aliases."""
    entries = set()
    for node in container:
        check(node.tag in {'action', 'category'} and set(node.attrib) == {ns + 'name'} and
              not list(node) and not (node.text or '').strip(),
              'Unexpected intent entry in ' + label)
        entry = (node.tag, node.get(ns + 'name'))
        check(entry[1] and entry not in entries, 'Missing or duplicate intent entry in ' + label)
        entries.add(entry)
    return entries


def android(path, backup, extraction, resources):
    root = xml(path)
    ns = '{http://schemas.android.com/apk/res/android}'
    check(root.tag == 'manifest' and root.get('package') == PACKAGE, 'Unexpected APK application identity')
    applications = root.findall('application')
    check(len(applications) == 1, 'APK must have exactly one application manifest')
    app = applications[0]
    check(app.get(ns + 'debuggable', 'false') == 'false', 'Release APK must not be debuggable')
    check(app.get(ns + 'enabled', 'true') == 'true', 'Application must be enabled')
    for attribute in ('allowBackup', 'usesCleartextTraffic'):
        check(app.get(ns + attribute) == 'false', 'APK must deny ' + attribute)
    check(ns + 'networkSecurityConfig' not in app.attrib,
          'Unreviewed network security configuration may override cleartext denial')
    remote_components = {
        'expo.modules.notifications.service.ExpoFirebaseMessagingService',
        'com.google.firebase.messaging.FirebaseMessagingService',
        'com.google.firebase.components.ComponentDiscoveryService',
        'com.google.firebase.iid.FirebaseInstanceIdReceiver',
        'com.google.firebase.provider.FirebaseInitProvider',
        'com.google.android.datatransport.runtime.backends.TransportBackendDiscovery',
        'com.google.android.datatransport.runtime.scheduling.jobscheduling.JobInfoSchedulerService',
        'com.google.android.datatransport.runtime.scheduling.jobscheduling.AlarmManagerSchedulerBroadcastReceiver',
        'com.google.android.gms.common.api.GoogleApiActivity',
    }
    check(not any(node.get(ns + 'name') in remote_components for node in app),
          'Unused remote SDK startup components must be absent from the APK')
    allowed_components = {
        PACKAGE + '.MainActivity': 'activity',
        'expo.modules.filesystem.FileSystemFileProvider': 'provider',
        'expo.modules.sharing.SharingFileProvider': 'provider',
        NOTIFICATION_RECEIVER: 'receiver',
        NOTIFICATION_FORWARDER: 'activity',
        STARTUP_PROVIDER: 'provider',
        'androidx.profileinstaller.ProfileInstallReceiver': 'receiver',
    }
    components = {}
    for node in app:
        if node.tag not in {'activity', 'activity-alias', 'service', 'receiver', 'provider'}:
            continue
        name = node.get(ns + 'name')
        check(name in allowed_components and allowed_components[name] == node.tag and name not in components,
              'Unreviewed or duplicate APK component: ' + str(name))
        components[name] = node
        exported = node.get(ns + 'exported')
        if name == PACKAGE + '.MainActivity':
            check(exported == 'true', 'Launcher must have its explicit exported boundary')
        elif name == 'androidx.profileinstaller.ProfileInstallReceiver':
            check(exported == 'true' and node.get(ns + 'permission') == 'android.permission.DUMP',
                  'Profile tooling receiver requires the system DUMP permission')
        else:
            check(exported == 'false', 'Internal components must not be exported: ' + str(name))
    for name in (PACKAGE + '.MainActivity', NOTIFICATION_RECEIVER, NOTIFICATION_FORWARDER):
        check(name in components, 'Required launcher/reminder component absent: ' + name)
        check(components[name].get(ns + 'enabled', 'true') == 'true',
              'Required launcher/reminder component must be enabled: ' + name)
    launcher = components[PACKAGE + '.MainActivity']
    launcher_filters = [node for node in launcher.findall('intent-filter') if any(
        (entry.tag == 'action' and entry.get(ns + 'name') == 'android.intent.action.MAIN') or
        (entry.tag == 'category' and entry.get(ns + 'name') == 'android.intent.category.LAUNCHER')
        for entry in node)]
    check(len(launcher_filters) == 1, 'Launcher must have one MAIN/LAUNCHER intent filter')
    check(intent_entries(launcher_filters[0], ns, 'launcher') == {
        ('action', 'android.intent.action.MAIN'), ('category', 'android.intent.category.LAUNCHER')},
        'Launcher must retain its MAIN/LAUNCHER intent topology')
    reminder_filters = components[NOTIFICATION_RECEIVER].findall('intent-filter')
    check(len(reminder_filters) == 1, 'Local reminder receiver must have one reviewed intent filter')
    check(intent_entries(reminder_filters[0], ns, 'local reminders') == {
        ('action', name) for name in NOTIFICATION_ACTIONS},
        'Local reminder receiver must retain notification/boot/update intent topology')
    check(not components[NOTIFICATION_FORWARDER].findall('intent-filter'),
          'Internal notification forwarder must not gain intent filters')
    initializers = set()
    if STARTUP_PROVIDER in components:
        provider = components[STARTUP_PROVIDER]
        check(provider.get(ns + 'authorities') == PACKAGE + '.androidx-startup',
              'Unexpected AndroidX startup provider authority')
        for node in provider:
            name = node.get(ns + 'name')
            check(node.tag == 'meta-data' and set(node.attrib) == {ns + 'name', ns + 'value'} and
                  name in STARTUP_INITIALIZERS and node.get(ns + 'value') == 'androidx.startup' and
                  not list(node) and not (node.text or '').strip(),
                  'Unreviewed AndroidX startup initializer declaration')
            check(name not in initializers, 'Duplicate AndroidX startup initializer declaration')
            initializers.add(name)
    for name in ('firebase_messaging_auto_init_enabled', 'firebase_analytics_collection_enabled'):
        declarations = [node for node in app.findall('meta-data') if node.get(ns + 'name') == name]
        check(len(declarations) == 1 and declarations[0].get(ns + 'value') == 'false' and
              ns + 'resource' not in declarations[0].attrib,
              'Remote SDK initialization/collection must be explicitly disabled: ' + name)
    identifiers = resource_rules(resources)
    for attribute, name in zip(('fullBackupContent', 'dataExtractionRules'), RULE_NAMES):
        linked_rule(app.get(ns + attribute), name, identifiers)
    backup_rules(backup, extraction)
    permission_tags = {'uses-permission', 'uses-permission-sdk-23'}
    check(all(node.tag in permission_tags for node in root if node.tag.startswith('uses-permission')),
          'Unreviewed APK permission declaration tag')
    rows = [node for node in root if node.tag in permission_tags]
    names = [node.get(ns + 'name') for node in rows]
    check(all(isinstance(name, str) and name for name in names), 'Malformed APK permission declaration')
    permissions = sorted(set(names))
    allowed = {'android.permission.INTERNET', 'android.permission.VIBRATE',
               'android.permission.POST_NOTIFICATIONS', 'android.permission.RECEIVE_BOOT_COMPLETED',
               PACKAGE + '.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'}
    required = {'android.permission.INTERNET', 'android.permission.VIBRATE',
                'android.permission.POST_NOTIFICATIONS', 'android.permission.RECEIVE_BOOT_COMPLETED'}
    check(set(permissions).issubset(allowed), 'Unexpected merged APK permissions: ' + str(set(permissions) - allowed))
    check(required.issubset(permissions), 'Required model/reminder permissions are absent from the APK')
    for node in rows:
        maximum = node.get(ns + 'maxSdkVersion')
        if node.get(ns + 'name') in required and maximum is not None:
            check(maximum.isdecimal() and int(maximum) >= 36, 'Required APK permission expires before target OS')
    sdks = root.findall('uses-sdk')
    check(len(sdks) == 1 and sdks[0].get(ns + 'minSdkVersion') == '24' and
          sdks[0].get(ns + 'targetSdkVersion') == '36', 'Unexpected APK OS requirements')
    return {'platform': 'android', 'package': PACKAGE, 'permissions': permissions,
            'manifestSHA256': sha(path), 'backupRulesLinked': True, 'backupDomainsExcluded': sorted(DOMAINS),
            'cloudBackupAndDeviceTransferExcluded': True, 'backupRulesSHA256': sha(backup),
            'extractionRulesSHA256': sha(extraction), 'resourceTableSHA256': sha(resources),
            'cleartextDenied': True, 'remoteSdkStartupDisabled': True, 'componentBoundariesChecked': True,
            'localReminderDeclarationsChecked': True, 'reviewedStartupInitializers': sorted(initializers),
            'reminderInspectionScope': 'manifest components/intent topology/permissions; native delivery and lifecycle not verified',
            'signing': 'uninspected; inspect the APK certificate separately',
            'physicalDeviceTested': False, 'storeAccepted': False}


def plist(path):
    with path.open('rb') as file:
        value = plistlib.load(file)
    check(isinstance(value, dict), 'Plist root must be a dictionary: ' + str(path))
    return value


def boolean(data, key, default=False):
    value = data.get(key, default)
    check(type(value) is bool, 'Malformed boolean declaration: ' + key)
    return value


def transport(info):
    ats = info.get('NSAppTransportSecurity', {})
    check(isinstance(ats, dict), 'ATS configuration must be a dictionary')
    allowed = {'NSAllowsArbitraryLoads', 'NSAllowsArbitraryLoadsForMedia',
               'NSAllowsArbitraryLoadsInWebContent', 'NSAllowsLocalNetworking',
               'NSExceptionDomains', 'NSRequiresCertificateTransparency'}
    check(set(ats).issubset(allowed), 'Unreviewed ATS configuration keys')
    for key in ('NSAllowsArbitraryLoads', 'NSAllowsArbitraryLoadsForMedia', 'NSAllowsArbitraryLoadsInWebContent'):
        check(not boolean(ats, key), 'Built app must deny ' + key)
    local = boolean(ats, 'NSAllowsLocalNetworking')
    boolean(ats, 'NSRequiresCertificateTransparency')
    domains = ats.get('NSExceptionDomains', {})
    check(isinstance(domains, dict), 'ATS exception domains must be a dictionary')
    for domain, options in domains.items():
        check(isinstance(domain, str) and re.fullmatch(r'[a-z0-9]+(?:[.-][a-z0-9]+)*', domain),
              'Malformed ATS exception domain')
        check(isinstance(options, dict), 'ATS domain configuration must be a dictionary')
        insecure = {'NSExceptionAllowsInsecureHTTPLoads', 'NSTemporaryExceptionAllowsInsecureHTTPLoads',
                    'NSThirdPartyExceptionAllowsInsecureHTTPLoads'}
        tls = {'NSExceptionMinimumTLSVersion', 'NSTemporaryExceptionMinimumTLSVersion',
               'NSThirdPartyExceptionMinimumTLSVersion'}
        secrecy = {'NSExceptionRequiresForwardSecrecy', 'NSTemporaryExceptionRequiresForwardSecrecy',
                   'NSThirdPartyExceptionRequiresForwardSecrecy'}
        check(set(options).issubset(insecure | tls | secrecy | {'NSIncludesSubdomains', 'NSRequiresCertificateTransparency'}),
              'Unreviewed ATS exception domain keys: ' + domain)
        for key in insecure:
            check(not boolean(options, key), 'ATS must not allow insecure HTTP: ' + domain)
        for key in tls:
            check(options.get(key, 'TLSv1.2') in {'TLSv1.2', 'TLSv1.3'}, 'ATS must not lower TLS requirements: ' + domain)
        for key in secrecy:
            check(boolean(options, key, True), 'ATS must retain forward secrecy: ' + domain)
        boolean(options, 'NSIncludesSubdomains')
        boolean(options, 'NSRequiresCertificateTransparency')
    return {'arbitraryInternetMediaAndWebLoadsDenied': True, 'localNetworkingAllowed': local,
            'reviewedSecureExceptionDomains': sorted(domains),
            'scope': 'ATS plist declarations; local networking is explicit, not blanket cleartext denial'}


def privacy(data, label):
    check(set(data).issubset({'NSPrivacyTracking', 'NSPrivacyTrackingDomains',
                            'NSPrivacyCollectedDataTypes', 'NSPrivacyAccessedAPITypes'}),
          'Unreviewed privacy manifest keys: ' + label)
    check(not boolean(data, 'NSPrivacyTracking'), 'Unexpected tracking declaration: ' + label)
    for key in ('NSPrivacyTrackingDomains', 'NSPrivacyCollectedDataTypes'):
        value = data.get(key, [])
        check(isinstance(value, list) and not value, 'Unexpected or malformed ' + key + ': ' + label)
    rows = data.get('NSPrivacyAccessedAPITypes', [])
    check(isinstance(rows, list), 'Privacy accessed APIs must be an array: ' + label)
    reasons = {}
    categories = {'NSPrivacyAccessedAPICategory' + name for name in
                  ('FileTimestamp', 'DiskSpace', 'UserDefaults', 'SystemBootTime', 'ActiveKeyboards')}
    for row in rows:
        check(isinstance(row, dict) and set(row) == {'NSPrivacyAccessedAPIType', 'NSPrivacyAccessedAPITypeReasons'},
              'Malformed accessed API declaration: ' + label)
        category, values = row['NSPrivacyAccessedAPIType'], row['NSPrivacyAccessedAPITypeReasons']
        check(isinstance(category, str) and category in categories, 'Unreviewed accessed API category: ' + label)
        check(isinstance(values, list) and values and
              all(isinstance(value, str) and re.fullmatch(r'[0-9A-F]{4}\.[0-9]+', value) for value in values),
              'Malformed accessed API reasons: ' + label)
        reasons.setdefault(category, set()).update(values)
    return reasons


def ios(app):
    info = plist(app / 'Info.plist')
    check(info.get('CFBundleIdentifier') == PACKAGE, 'Unexpected iOS bundle identity')
    check(info.get('MinimumOSVersion') == '16.4', 'Unexpected iOS deployment floor')
    check('NSFaceIDUsageDescription' not in info, 'Unimplemented biometric usage declaration must be absent')
    for key in ('UIFileSharingEnabled', 'LSSupportsOpeningDocumentsInPlace'):
        check(not boolean(info, key), 'Built app must deny direct Documents exposure: ' + key)
    ats = transport(info)
    services, description = info.get('NSBonjourServices', []), info.get('NSLocalNetworkUsageDescription', '')
    check(isinstance(services, list) and not services and isinstance(description, str) and not description,
          'Development network declarations must be stripped from Release app')
    reasons = privacy(plist(app / 'PrivacyInfo.xcprivacy'), 'PrivacyInfo.xcprivacy')
    for category, expected in {
        'FileTimestamp': {'C617.1', '3B52.1'}, 'DiskSpace': {'E174.1'},
        'UserDefaults': {'CA92.1'}, 'SystemBootTime': {'35F9.1'},
    }.items():
        check(expected.issubset(reasons.get('NSPrivacyAccessedAPICategory' + category, set())),
              'Missing built app API reasons: ' + category)
    manifests = []
    for path in sorted(app.rglob('PrivacyInfo.xcprivacy')):
        data = plist(path)
        privacy(data, path.relative_to(app).as_posix())
        manifests.append({'path': path.relative_to(app).as_posix(), 'sha256': sha(path),
                          'accessedAPIs': data.get('NSPrivacyAccessedAPITypes', [])})
    return {'platform': 'ios', 'bundleIdentifier': info['CFBundleIdentifier'],
            'infoSHA256': sha(app / 'Info.plist'), 'transport': ats, 'privacyManifests': manifests,
            'privacyInspectionScope': 'required app reasons present; no SDK-declared collection/tracking; native API reachability not verified',
            'sourceCapabilityDeclarationsChecked': True,
            'capabilityInspectionScope': 'biometric description absent and direct Documents exposure denied; native API reachability not verified',
            'signing': 'uninspected; CI configuration builds an unsigned simulator application',
            'physicalDeviceTested': False, 'storeAccepted': False}


def main(arguments):
    usage = ('Usage: inspect-native-artifacts.py android MANIFEST.xml BACKUP.xml EXTRACTION.xml RESOURCES.txt'
             ' | ios BUILT.app')
    check(bool(arguments) and arguments[0] in {'android', 'ios'}, usage)
    check(len(arguments) == (5 if arguments[0] == 'android' else 2), usage)
    result = android(*map(Path, arguments[1:])) if arguments[0] == 'android' else ios(Path(arguments[1]))
    print(json.dumps({'passed': True, **result}, indent=2))


if __name__ == '__main__':
    main(sys.argv[1:])
