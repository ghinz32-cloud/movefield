"""Focused reader fixtures, not compiled APK/.app or physical-device proof.

The tests write decoded XML/aapt2 text and real binary/XML plists, then call the
actual inspector and CLI. Native CI supplies the actual compiled artifacts.
"""
import copy
import importlib.util
import json
from pathlib import Path
import plistlib
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('inspect-native-artifacts.py')
sys.dont_write_bytecode = True
SPEC = importlib.util.spec_from_file_location('artifact_inspector', SCRIPT)
INSPECTOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(INSPECTOR)
NS = '{http://schemas.android.com/apk/res/android}'
DOMAINS = ('root', 'file', 'database', 'sharedpref', 'external',
           'device_root', 'device_file', 'device_database', 'device_sharedpref')
EXCLUDES = ''.join('<exclude domain="' + name + '" path="."/>' for name in DOMAINS)
BACKUP = '<full-backup-content>' + EXCLUDES + '</full-backup-content>'
EXTRACTION = ('<data-extraction-rules><cloud-backup>' + EXCLUDES +
              '</cloud-backup><device-transfer>' + EXCLUDES +
              '</device-transfer></data-extraction-rules>')
MANIFEST = """<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.ghinz32.movefield">
<uses-sdk android:minSdkVersion="24" android:targetSdkVersion="36"/>
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.VIBRATE"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<application android:debuggable="false" android:allowBackup="false" android:usesCleartextTraffic="false"
 android:fullBackupContent="@ref/0x7f130001" android:dataExtractionRules="@ref/0x7f130002">
<activity android:name="com.ghinz32.movefield.MainActivity" android:exported="true"/>
<meta-data android:name="firebase_messaging_auto_init_enabled" android:value="false"/>
<meta-data android:name="firebase_analytics_collection_enabled" android:value="false"/>
</application>
</manifest>"""
RESOURCES = """Package name=com.ghinz32.movefield id=7f
  type xml id=13 entryCount=3
    resource 0x7f130000 xml/unrelated
      () (file) res/xml/unrelated.xml type=XML
    resource 0x7f130001 xml/movefield_backup_rules
      () (file) res/xml/movefield_backup_rules.xml type=XML
    resource 0x7f130002 xml/movefield_data_extraction_rules
      () (file) res/xml/movefield_data_extraction_rules.xml type=XML
"""
ROOT_PRIVACY = {
    'NSPrivacyTracking': False, 'NSPrivacyTrackingDomains': [], 'NSPrivacyCollectedDataTypes': [],
    'NSPrivacyAccessedAPITypes': [
        {'NSPrivacyAccessedAPIType': 'NSPrivacyAccessedAPICategory' + category,
         'NSPrivacyAccessedAPITypeReasons': reasons}
        for category, reasons in [('FileTimestamp', ['C617.1', '3B52.1']),
                                  ('DiskSpace', ['E174.1']), ('UserDefaults', ['CA92.1']),
                                  ('SystemBootTime', ['35F9.1'])]
    ],
}
INFO = {'CFBundleIdentifier': 'com.ghinz32.movefield', 'MinimumOSVersion': '16.4',
        'NSAppTransportSecurity': {'NSAllowsArbitraryLoads': False, 'NSAllowsLocalNetworking': True}}


class Fixtures(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='movefield-artifact-inspector-')
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.paths = [self.root / name for name in ('manifest.xml', 'backup.xml', 'extraction.xml', 'resources.txt')]
        for path, text in zip(self.paths, (MANIFEST, BACKUP, EXTRACTION, RESOURCES)):
            path.write_text(text, encoding='utf-8')
        self.app = self.root / 'Movefield.app'
        self.app.mkdir()
        self.info = copy.deepcopy(INFO)
        self.root_privacy = copy.deepcopy(ROOT_PRIVACY)
        self.sdk_path = self.app / 'Frameworks' / 'Example.framework' / 'PrivacyInfo.xcprivacy'
        self.sdk_path.parent.mkdir(parents=True)
        self.write_plist(self.sdk_path, {'NSPrivacyTracking': False, 'NSPrivacyAccessedAPITypes': []})
        self.save_ios()

    def write_plist(self, path, value, binary=True):
        path.write_bytes(plistlib.dumps(value, fmt=plistlib.FMT_BINARY if binary else plistlib.FMT_XML))

    def save_ios(self):
        self.write_plist(self.app / 'Info.plist', self.info)
        self.write_plist(self.app / 'PrivacyInfo.xcprivacy', self.root_privacy)

    def android(self):
        return INSPECTOR.android(*self.paths)

    def ios(self):
        self.save_ios()
        return INSPECTOR.ios(self.app)

    def change(self, index, before, after):
        path = self.paths[index]
        text = path.read_text()
        self.assertIn(before, text)
        path.write_text(text.replace(before, after), encoding='utf-8')

    def rejects_android(self, text):
        with self.assertRaisesRegex(ValueError, text):
            self.android()

    def rejects_ios(self, text):
        with self.assertRaisesRegex(ValueError, text):
            self.ios()

    def test_android_numeric_links_read_rules_and_hashes(self):
        result = self.android()
        self.assertEqual(result['backupDomainsExcluded'], sorted(DOMAINS))
        self.assertTrue(result['cloudBackupAndDeviceTransferExcluded'])
        self.assertEqual(result['resourceTableSHA256'], INSPECTOR.sha(self.paths[3]))
        self.assertIn('uninspected', result['signing'])
        self.assertFalse(result['physicalDeviceTested'])

    def test_named_and_package_qualified_links(self):
        self.change(0, '@ref/0x7f130001', '@xml/movefield_backup_rules')
        self.change(0, '@ref/0x7f130002', '@com.ghinz32.movefield:xml/movefield_data_extraction_rules')
        self.assertTrue(self.android()['backupRulesLinked'])

    def test_decimal_and_hex_reference_forms(self):
        self.change(0, '@ref/0x7f130001', '@' + str(0x7f130001))
        self.change(0, '@ref/0x7f130002', '@0x7f130002')
        self.assertTrue(self.android()['backupRulesLinked'])

    def test_package_qualified_aapt_rows(self):
        self.change(3, ' xml/movefield_', ' com.ghinz32.movefield:xml/movefield_')
        self.assertTrue(self.android()['backupRulesLinked'])

    def test_remote_sdk_components_refused(self):
        for name in ['expo.modules.notifications.service.ExpoFirebaseMessagingService',
                     'com.google.firebase.messaging.FirebaseMessagingService',
                     'com.google.firebase.components.ComponentDiscoveryService',
                     'com.google.firebase.iid.FirebaseInstanceIdReceiver',
                     'com.google.firebase.provider.FirebaseInitProvider']:
            self.paths[0].write_text(MANIFEST.replace('</application>', '<service android:name="'+name+'"/></application>'))
            self.rejects_android('remote SDK startup')

    def test_unreviewed_exported_component_refused(self):
        self.change(0, '</application>', '<service android:name="other.Exported" android:exported="true"/></application>')
        self.rejects_android('Unreviewed')

    def test_exported_file_provider_refused(self):
        self.change(0, '</application>', '<provider android:name="expo.modules.sharing.SharingFileProvider" android:exported="true"/></application>')
        self.rejects_android('must not be exported')

    def test_profile_receiver_without_system_permission_refused(self):
        self.change(0, '</application>', '<receiver android:name="androidx.profileinstaller.ProfileInstallReceiver" android:exported="true"/></application>')
        self.rejects_android('system DUMP')

    def test_profile_system_tool_receiver_accepted(self):
        self.change(0, '</application>', '<receiver android:name="androidx.profileinstaller.ProfileInstallReceiver" android:exported="true" android:permission="android.permission.DUMP"/></application>')
        self.assertTrue(self.android()['componentBoundariesChecked'])

    def test_remote_auto_init_enabled_refused(self):
        self.change(0, 'firebase_messaging_auto_init_enabled" android:value="false"', 'firebase_messaging_auto_init_enabled" android:value="true"')
        self.rejects_android('explicitly disabled')

    def test_remote_init_declaration_missing_refused(self):
        self.change(0, '<meta-data android:name="firebase_messaging_auto_init_enabled" android:value="false"/>', '')
        self.rejects_android('explicitly disabled')

    def test_remote_collection_enabled_refused(self):
        self.change(0, 'firebase_analytics_collection_enabled" android:value="false"', 'firebase_analytics_collection_enabled" android:value="true"')
        self.rejects_android('explicitly disabled')

    def test_wrong_manifest_resource_id(self):
        self.change(0, '@ref/0x7f130001', '@ref/0x7f130000')
        self.rejects_android('wrong packaged')

    def test_wrong_named_link(self):
        self.change(0, '@ref/0x7f130001', '@xml/unrelated')
        self.rejects_android('Unexpected manifest')

    def test_missing_link_is_refused(self):
        self.change(0, ' android:fullBackupContent="@ref/0x7f130001"', '')
        self.rejects_android('must link')

    def test_table_wrong_package(self):
        self.change(3, 'Package name=com.ghinz32.movefield', 'Package name=other.app')
        self.rejects_android('Missing or ambiguous')

    def test_resource_identity_collision(self):
        self.paths[3].write_text(RESOURCES + 'resource 0x7f130001 xml/replacement\n')
        self.rejects_android('Duplicate or ambiguous')

    def test_missing_resource_payload(self):
        self.change(3, '      () (file) res/xml/movefield_backup_rules.xml type=XML\n', '')
        self.rejects_android('one default')

    def test_alias_resource_refused(self):
        self.change(3, '() (file) res/xml/movefield_backup_rules.xml type=XML', '() @xml/unrelated')
        self.rejects_android('one default')

    def test_alternate_os_rules_refused(self):
        self.change(3, 'resource 0x7f130002', '(v31) (file) res/xml-v31/movefield_backup_rules.xml type=XML\n    resource 0x7f130002')
        self.rejects_android('one default')

    def test_flag_disabled_variant_refused(self):
        self.change(3, 'resource 0x7f130002', 'Flag disabled values:\n      () (file) res/xml/movefield_backup_rules.xml type=XML\n    resource 0x7f130002')
        self.rejects_android('one default')

    def test_mismatched_payload_path(self):
        self.change(3, 'res/xml/movefield_backup_rules.xml', 'res/xml/unrelated.xml')
        self.rejects_android('one default')

    def test_optimized_resource_paths(self):
        self.change(3, 'res/xml/movefield_backup_rules.xml', 'res/aB.xml')
        self.change(3, 'res/xml/movefield_data_extraction_rules.xml', 'res/z_9.xml')
        self.assertTrue(self.android()['backupRulesLinked'])

    def test_optimized_path_traversal_refused(self):
        self.change(3, 'res/xml/movefield_backup_rules.xml', 'res/../a.xml')
        self.rejects_android('one default')

    def test_shared_rule_path_refused(self):
        self.change(3, 'res/xml/movefield_backup_rules.xml', 'res/a.xml')
        self.change(3, 'res/xml/movefield_data_extraction_rules.xml', 'res/a.xml')
        self.rejects_android('must be distinct')

    def test_malformed_resource_row(self):
        self.change(3, 'resource 0x7f130001', 'resource invalid-id')
        self.rejects_android('Malformed aapt2')

    def test_poisoned_legacy_backup_missing_domain(self):
        self.change(1, '<exclude domain="database" path="."/>', '')
        self.rejects_android('All nine')

    def test_poisoned_device_transfer_missing_domain(self):
        self.change(2, '<device-transfer>' + EXCLUDES, '<device-transfer>' + EXCLUDES.replace('<exclude domain="device_database" path="."/>', ''))
        self.rejects_android('All nine')

    def test_cloud_section_is_required(self):
        self.change(2, '<cloud-backup>' + EXCLUDES + '</cloud-backup>', '')
        self.rejects_android('Both cloud')

    def test_duplicate_extraction_section_refused(self):
        self.change(2, 'device-transfer', 'cloud-backup')
        self.rejects_android('Both cloud')

    def test_backup_includes_refused_even_with_all_exclusions(self):
        self.change(1, '</full-backup-content>', '<include domain="database" path="."/></full-backup-content>')
        self.rejects_android('never includes')

    def test_nested_include_refused(self):
        self.change(2, '<exclude domain="root" path="."/>', '<exclude domain="root" path="."><include domain="root" path="."/></exclude>')
        self.rejects_android('empty elements')

    def test_narrowed_exclusion_refused(self):
        self.change(1, 'path="."', 'path="records"')
        self.rejects_android('complete domain')

    def test_duplicate_or_unknown_domain_refused(self):
        self.change(1, 'domain="device_root"', 'domain="root"')
        self.rejects_android('Unknown or duplicate')

    def test_backup_unreviewed_attribute_refused(self):
        self.change(1, 'domain="root" path="."', 'domain="root" path="." requireFlags="clientSideEncryption"')
        self.rejects_android('complete domain')

    def test_xml_entity_declaration_refused(self):
        self.paths[1].write_text('<!DOCTYPE rules [<!ENTITY content "poison">]>' + BACKUP)
        self.rejects_android('DTD/entity')

    def test_malformed_xml_is_not_success(self):
        self.paths[1].write_text('<full-backup-content>')
        with self.assertRaises(INSPECTOR.ET.ParseError):
            self.android()

    def test_unreviewed_network_config_cannot_override_denial(self):
        self.change(0, '<application ', '<application android:networkSecurityConfig="@xml/unrelated" ')
        self.rejects_android('override cleartext')

    def test_debuggable_release_refused(self):
        self.change(0, 'android:debuggable="false"', 'android:debuggable="true"')
        self.rejects_android('debuggable')

    def test_unexpected_permission_refused(self):
        self.change(0, 'android.permission.VIBRATE', 'android.permission.CAMERA')
        self.rejects_android('Unexpected merged')

    def test_expired_required_permission_refused(self):
        self.change(0, 'android:name="android.permission.INTERNET"', 'android:name="android.permission.INTERNET" android:maxSdkVersion="28"')
        self.rejects_android('expires')

    def test_unknown_permission_tag_cannot_satisfy_required_permission(self):
        self.change(0, '<uses-permission android:name="android.permission.INTERNET"',
                    '<uses-permission-invalid android:name="android.permission.INTERNET"')
        self.rejects_android('declaration tag')

    def test_sdk23_permission_tag_supported_above_minimum_os(self):
        self.change(0, '<uses-permission android:name="android.permission.INTERNET"',
                    '<uses-permission-sdk-23 android:name="android.permission.INTERNET"')
        self.assertIn('android.permission.INTERNET', self.android()['permissions'])

    def test_malformed_permission_name_refused(self):
        self.change(0, 'android:name="android.permission.INTERNET"', 'android:name=""')
        self.rejects_android('Malformed APK permission')

    def test_duplicate_application_refused(self):
        self.change(0, '</manifest>', '<application/></manifest>')
        self.rejects_android('exactly one')

    def test_ios_real_binary_plists_truthful_scope(self):
        result = self.ios()
        self.assertTrue(result['transport']['localNetworkingAllowed'])
        self.assertEqual(len(result['privacyManifests']), 2)
        self.assertIn('reachability not verified', result['privacyInspectionScope'])
        self.assertIn('uninspected', result['signing'])
        self.assertFalse(result['storeAccepted'])

    def test_secure_domain_exception_and_xml_sdk_accepted(self):
        self.info['NSAppTransportSecurity']['NSExceptionDomains'] = {
            'models.example.org': {'NSExceptionAllowsInsecureHTTPLoads': False,
                                   'NSExceptionMinimumTLSVersion': 'TLSv1.3',
                                   'NSExceptionRequiresForwardSecrecy': True,
                                   'NSIncludesSubdomains': True}}
        self.write_plist(self.sdk_path, {'NSPrivacyTracking': False}, binary=False)
        self.assertEqual(self.ios()['transport']['reviewedSecureExceptionDomains'], ['models.example.org'])

    def test_global_arbitrary_transport_flags_refused(self):
        for key in ('NSAllowsArbitraryLoads', 'NSAllowsArbitraryLoadsForMedia', 'NSAllowsArbitraryLoadsInWebContent'):
            with self.subTest(key=key):
                self.info = copy.deepcopy(INFO)
                self.info['NSAppTransportSecurity'][key] = True
                self.rejects_ios('must deny')

    def test_domain_insecure_http_aliases_refused(self):
        for key in ('NSExceptionAllowsInsecureHTTPLoads', 'NSTemporaryExceptionAllowsInsecureHTTPLoads',
                    'NSThirdPartyExceptionAllowsInsecureHTTPLoads'):
            with self.subTest(key=key):
                self.info['NSAppTransportSecurity']['NSExceptionDomains'] = {'example.org': {key: True}}
                self.rejects_ios('insecure HTTP')

    def test_domain_tls_downgrade_refused(self):
        self.info['NSAppTransportSecurity']['NSExceptionDomains'] = {'example.org': {'NSExceptionMinimumTLSVersion': 'TLSv1.0'}}
        self.rejects_ios('lower TLS')

    def test_domain_forward_secrecy_downgrade_refused(self):
        self.info['NSAppTransportSecurity']['NSExceptionDomains'] = {'example.org': {'NSExceptionRequiresForwardSecrecy': False}}
        self.rejects_ios('retain forward')

    def test_malformed_transport_shapes_refused(self):
        for value in ([], False, 'false'):
            with self.subTest(value=value):
                self.info['NSAppTransportSecurity'] = value
                self.rejects_ios('dictionary')

    def test_malformed_boolean_transport_flag_refused(self):
        self.info['NSAppTransportSecurity']['NSAllowsArbitraryLoads'] = 0
        self.rejects_ios('Malformed boolean')

    def test_malformed_domain_config_refused(self):
        for value in ([], False, {'example.org': []}):
            with self.subTest(value=value):
                self.info['NSAppTransportSecurity']['NSExceptionDomains'] = value
                self.rejects_ios('dictionary')

    def test_unknown_transport_key_refused(self):
        self.info['NSAppTransportSecurity']['NSAllowsUnreviewedTraffic'] = True
        self.rejects_ios('Unreviewed ATS')

    def test_release_bonjour_declaration_refused(self):
        self.info['NSBonjourServices'] = ['_expo._tcp']
        self.rejects_ios('Development network')

    def test_root_tracking_refused(self):
        self.root_privacy['NSPrivacyTracking'] = True
        self.rejects_ios('tracking')

    def test_sdk_tracking_and_collection_refused(self):
        for value in ({'NSPrivacyTracking': True},
                      {'NSPrivacyTrackingDomains': ['tracker.example.org']},
                      {'NSPrivacyCollectedDataTypes': [{'NSPrivacyCollectedDataType': 'NSPrivacyCollectedDataTypeName'}]}):
            with self.subTest(value=value):
                self.write_plist(self.sdk_path, value)
                self.rejects_ios('tracking|NSPrivacy')

    def test_malformed_privacy_shapes_refused(self):
        for key, value in (('NSPrivacyTracking', 0), ('NSPrivacyTrackingDomains', False),
                           ('NSPrivacyCollectedDataTypes', {}), ('NSPrivacyAccessedAPITypes', {})):
            with self.subTest(key=key):
                self.root_privacy = copy.deepcopy(ROOT_PRIVACY)
                self.root_privacy[key] = value
                self.rejects_ios('Malformed|malformed|must be an array')

    def test_malformed_reason_rows_refused(self):
        for row in ({'NSPrivacyAccessedAPIType': 'NSPrivacyAccessedAPICategoryFileTimestamp'},
                    {'NSPrivacyAccessedAPIType': 'NSPrivacyAccessedAPICategoryFileTimestamp',
                     'NSPrivacyAccessedAPITypeReasons': 'C617.1'},
                    {'NSPrivacyAccessedAPIType': 'NSPrivacyAccessedAPICategoryFileTimestamp',
                     'NSPrivacyAccessedAPITypeReasons': ['unreviewed-string']}):
            with self.subTest(row=row):
                self.root_privacy = copy.deepcopy(ROOT_PRIVACY)
                self.root_privacy['NSPrivacyAccessedAPITypes'][0] = row
                self.rejects_ios('Malformed')

    def test_missing_required_reason_refused(self):
        self.root_privacy['NSPrivacyAccessedAPITypes'][0]['NSPrivacyAccessedAPITypeReasons'] = ['C617.1']
        self.rejects_ios('Missing built app')

    def test_privacy_root_not_dictionary_refused(self):
        self.write_plist(self.sdk_path, [])
        self.rejects_ios('root must be')

    def test_cli_requires_all_decoded_android_inputs(self):
        result = subprocess.run([sys.executable, str(SCRIPT), 'android', str(self.paths[0])],
                                capture_output=True, text=True, check=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn('"passed": true', result.stdout)

    def test_cli_success_and_poison_failure(self):
        command = [sys.executable, str(SCRIPT), 'android', *map(str, self.paths)]
        result = subprocess.run(command, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue(json.loads(result.stdout)['passed'])
        self.change(1, '<exclude domain="database" path="."/>', '')
        result = subprocess.run(command, capture_output=True, text=True, check=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn('"passed": true', result.stdout)

    def test_ios_cli_success(self):
        result = subprocess.run([sys.executable, str(SCRIPT), 'ios', str(self.app)],
                                capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue(json.loads(result.stdout)['transport']['localNetworkingAllowed'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
