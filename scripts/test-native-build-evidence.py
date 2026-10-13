"""Synthetic reader fixtures; no actual native compilation or runtime claim."""
import copy
import importlib.util
import json
from pathlib import Path
import plistlib
import shlex
import subprocess
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).with_name('collect-native-build-evidence.py')
SPEC = importlib.util.spec_from_file_location('native_build_evidence', SCRIPT)
reader = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(reader)
FLAG = '-DSQLITE_DEFAULT_SYNCHRONOUS=3'


class Evidence(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix='native-evidence-reader-')
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.repo, self.out = self.root / 'source with spaces', self.root / 'evidence'
        self.out.mkdir()
        self.module = self.repo / 'mobile/node_modules/expo-sqlite'
        self.write(self.module / 'package.json', json.dumps({'name': 'expo-sqlite', 'version': '57.0.4'}))
        self.sqlite = self.module / 'vendor/sqlite3/sqlite3.c'
        self.cipher = self.module / 'vendor/sqlcipher/sqlite3.c'
        self.write(self.sqlite, '/* Synthetic SQLite C fixture */')
        self.write(self.cipher, '/* Synthetic SQLCipher C fixture */')
        self.build = self.module / 'android/.cxx/RelWithDebInfo/current/arm64-v8a'
        self.write(self.build / 'CMakeCache.txt', 'CMAKE_BUILD_TYPE:STRING=RelWithDebInfo\nANDROID_ABI:STRING=arm64-v8a\n')
        self.object = self.build / 'CMakeFiles/expo-sqlite.dir/vendor/sqlite3.c.o'
        self.write(self.object, 'Synthetic nonempty compiled object fixture')
        self.entry = {'directory': str(self.build), 'file': str(self.sqlite),
                      'command': f'clang {FLAG} -o {shlex.quote(str(self.object))} -c {shlex.quote(str(self.sqlite))}'}
        self.save_entry()
        self.classpath = self.repo / 'mobile/android/build/release-runtime-classpath.raw.txt'
        self.write(self.classpath, 'releaseRuntimeClasspath - Resolved release fixture\n+--- project :expo-sqlite\n')
        self.xcconfig = self.repo / 'mobile/ios/Pods/Target Support Files/ExpoSQLite/ExpoSQLite.release.xcconfig'
        self.write(self.xcconfig, f'OTHER_CFLAGS = $(inherited) {FLAG}\n')
        self.write(self.module / 'ios/sqlite3.c', self.sqlite.read_text())
        self.ios_object = self.repo / 'mobile/ios/build/Build/Intermediates.noindex/Pods.build/Release-iphonesimulator/ExpoSQLite.build/Objects-normal/arm64/sqlite3.o'
        self.write(self.ios_object, 'Synthetic nonempty iOS object fixture')
        self.app = self.repo / 'mobile/ios/build/Build/Products/Release-iphonesimulator/Movefield.app'
        self.plist(self.app / 'Info.plist', {'CFBundleIdentifier': 'com.ghinz32.movefield'})
        for relative in ('PrivacyInfo.xcprivacy', 'Frameworks/Example.framework/Resources/Example.bundle/PrivacyInfo.xcprivacy'):
            self.plist(self.app / relative, {'NSPrivacyTracking': False})
        self.inspect_receipt()
        self.settings = [{'target': 'ExpoSQLite', 'buildSettings': {
            'TARGET_NAME': 'ExpoSQLite', 'CONFIGURATION': 'Release', 'PLATFORM_NAME': 'iphonesimulator',
            'SDKROOT': 'iphonesimulator', 'OTHER_CFLAGS': FLAG, 'GCC_PREPROCESSOR_DEFINITIONS': 'COCOAPODS=1',
            'UNRETAINED_ENVIRONMENT_SECRET': 'SYNTHETIC_VALUE_NEVER_RETAINED',
        }}]

    def write(self, path, data):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(data)

    def plist(self, path, data):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(plistlib.dumps(data))

    def save_entry(self):
        self.write(self.build / 'compile_commands.json', json.dumps([self.entry]))

    def inspect_receipt(self):
        rows = [{'path': file.relative_to(self.app).as_posix(), 'sha256': reader.digest(file)}
                for file in sorted(self.app.rglob('PrivacyInfo.xcprivacy'))]
        self.write(self.out / 'inspection.json', json.dumps({'passed': True, 'infoSHA256': reader.digest(self.app / 'Info.plist'), 'privacyManifests': rows}))

    def ios(self):
        completed = subprocess.CompletedProcess(['xcodebuild'], 0, json.dumps(self.settings).encode(), b'')
        with patch.object(reader.subprocess, 'run', return_value=completed) as run:
            result = reader.ios(self.repo, self.out)
        self.assertIn('-showBuildSettings', run.call_args.args[0])
        return result

    def test_exact_macro_spellings_and_distinct_prefix(self):
        for tokens in ([FLAG], ['-D', 'SQLITE_DEFAULT_SYNCHRONOUS=3'], [FLAG, '-DSQLITE_DEFAULT_SYNCHRONOUS_OTHER=2']):
            with self.subTest(tokens=tokens):
                reader.synchronous_three(tokens)

    def test_missing_conflicting_duplicate_or_response_flags_refused(self):
        for tokens in ([], ['-DSQLITE_DEFAULT_SYNCHRONOUS=2'], ['-DSQLITE_DEFAULT_SYNCHRONOUS'],
                       [FLAG, FLAG], [FLAG, '-USQLITE_DEFAULT_SYNCHRONOUS'],
                       [FLAG, '-D', 'SQLITE_DEFAULT_SYNCHRONOUS=1'], [FLAG, '@unknown.rsp'],
                       [FLAG, '-Wp,-USQLITE_DEFAULT_SYNCHRONOUS']):
            with self.subTest(tokens=tokens), self.assertRaises(ValueError):
                reader.synchronous_three(tokens)

    def test_android_positive_relwithdebinfo_source_object_and_dependency_receipts(self):
        result = reader.android(self.repo, self.out)
        self.assertEqual(result['synchronousMacro'], 3)
        self.assertEqual(result['sqliteCompileEntries'][0]['sourceSHA256'], reader.digest(self.sqlite))
        self.assertEqual(result['sqliteCompileEntries'][0]['objectSHA256'], reader.digest(self.object))
        self.assertEqual((self.out / 'release-runtime-classpath.txt').read_bytes(), self.classpath.read_bytes())
        self.assertIn('not complete binary SCA', result['scope'])

    def test_android_argument_vector_supported_and_metadata_not_retained(self):
        self.entry['arguments'] = shlex.split(self.entry.pop('command'))
        self.entry['unretained_environment_secret'] = 'SYNTHETIC_NOT_REAL'
        self.entry['command'] = 'unchecked shadow command https://example.invalid/?sig=SYNTHETIC'
        self.entry['output'] = 'unvalidated shadow object'
        self.save_entry()
        result = reader.android(self.repo, self.out)
        self.assertNotIn('unretained_environment_secret', result['sqliteCompileEntries'][0]['entry'])
        self.assertNotIn('command', result['sqliteCompileEntries'][0]['entry'])
        self.assertEqual(result['sqliteCompileEntries'][0]['entry']['output'], str(self.object))

    def test_android_sqlcipher_vendor_route_supported_without_invented_codec_claim(self):
        self.entry['file'] = str(self.cipher)
        self.entry['command'] = self.entry['command'].replace(shlex.quote(str(self.sqlite)), shlex.quote(str(self.cipher)))
        self.save_entry()
        self.assertEqual(reader.android(self.repo, self.out)['sqliteCompileEntries'][0]['vendor'], 'sqlcipher')

    def test_android_debug_only_and_wrong_or_conflicting_abi_refused(self):
        for cache in ('CMAKE_BUILD_TYPE:STRING=Debug\nANDROID_ABI:STRING=arm64-v8a\n',
                      'CMAKE_BUILD_TYPE:STRING=Release\nANDROID_ABI:STRING=x86_64\n',
                      'CMAKE_BUILD_TYPE:STRING=Release\nANDROID_ABI:STRING=arm64-v8a\nCMAKE_ANDROID_ARCH_ABI:STRING=x86_64\n'):
            self.write(self.build / 'CMakeCache.txt', cache)
            with self.subTest(cache=cache), self.assertRaises(ValueError):
                reader.android(self.repo, self.out)

    def test_android_cpp_entry_or_mismatched_actual_c_input_refused(self):
        baseline = copy.deepcopy(self.entry)
        for field, value in [('file', str(self.module / 'android/Wrapper.cpp')), ('command', f'clang {FLAG} -o {shlex.quote(str(self.object))} -c other.c')]:
            self.entry = {**baseline, field: value}
            self.save_entry()
            with self.subTest(field=field), self.assertRaises(ValueError):
                reader.android(self.repo, self.out)

    def test_android_missing_empty_or_outside_object_refused(self):
        self.object.unlink()
        with self.assertRaisesRegex(ValueError, 'object'):
            reader.android(self.repo, self.out)
        self.write(self.object, '')
        with self.assertRaisesRegex(ValueError, 'object'):
            reader.android(self.repo, self.out)
        outside = self.root / 'outside.o'
        self.write(outside, 'not a CMake build object')
        self.entry['command'] = f'clang {FLAG} -o {outside} -c {shlex.quote(str(self.sqlite))}'
        self.save_entry()
        with self.assertRaisesRegex(ValueError, 'outside'):
            reader.android(self.repo, self.out)

    def test_android_duplicate_release_databases_refused(self):
        other = self.module / 'android/.cxx/Release/stale/arm64-v8a'
        self.write(other / 'CMakeCache.txt', 'CMAKE_BUILD_TYPE:STRING=Release\nANDROID_ABI:STRING=arm64-v8a\n')
        output = other / 'sqlite3.o'
        self.write(output, 'synthetic stale object')
        self.write(other / 'compile_commands.json', json.dumps([{**self.entry, 'directory': str(other), 'command': f'clang {FLAG} -o {shlex.quote(str(output))} -c {shlex.quote(str(self.sqlite))}'}]))
        with self.assertRaisesRegex(ValueError, 'unambiguous'):
            reader.android(self.repo, self.out)

    def test_android_unresolved_empty_or_signed_dependency_receipts_refused_and_not_copied(self):
        for text in ('releaseRuntimeClasspath\nNo dependencies', 'releaseRuntimeClasspath\n+--- unresolved FAILED',
                     'releaseRuntimeClasspath\n+--- fixture https://example.invalid/artifact?sig=SYNTHETIC'):
            self.write(self.classpath, text)
            with self.subTest(text=text), self.assertRaises(ValueError):
                reader.android(self.repo, self.out)
            self.assertFalse((self.out / 'release-runtime-classpath.txt').exists())

    def test_ios_positive_filtered_flags_objects_and_complete_privacy_locations(self):
        result = self.ios()
        self.assertEqual(result['vendor'], 'sqlite3')
        self.assertEqual(result['synchronousMacro'], 3)
        self.assertEqual(len(result['builtAppPrivacyReplay']), 3)
        self.assertEqual(result['sqliteCObjects'][0]['sha256'], reader.digest(self.ios_object))
        self.assertNotIn('UNRETAINED_ENVIRONMENT_SECRET', result['releaseBuildSettings'])
        self.assertNotIn('SYNTHETIC_VALUE_NEVER_RETAINED', (self.out / 'ExpoSQLite.release-build-settings.json').read_text())
        self.assertEqual((self.out / 'built-app/Frameworks/Example.framework/Resources/Example.bundle/PrivacyInfo.xcprivacy').read_bytes(), (self.app / 'Frameworks/Example.framework/Resources/Example.bundle/PrivacyInfo.xcprivacy').read_bytes())
        self.assertIn('not captured per-file invocation', result['scope'])

    def test_ios_string_or_array_flags_are_supported_without_mutating_input(self):
        self.settings[0]['buildSettings']['OTHER_CFLAGS'] = ['$(inherited)', FLAG]
        before = copy.deepcopy(self.settings)
        result = reader.ios_settings(self.settings)
        self.assertEqual(self.settings, before)
        self.assertEqual(result['OTHER_CFLAGS'], before[0]['buildSettings']['OTHER_CFLAGS'])

    def test_ios_wrong_target_configuration_platform_or_duplicate_target_refused(self):
        for key, value in [('TARGET_NAME', 'Other'), ('CONFIGURATION', 'Debug'), ('PLATFORM_NAME', 'iphoneos')]:
            rows = copy.deepcopy(self.settings)
            rows[0]['buildSettings'][key] = value
            with self.subTest(key=key), self.assertRaises(ValueError):
                reader.ios_settings(rows)
        with self.assertRaises(ValueError):
            reader.ios_settings(self.settings + self.settings)

    def test_ios_xcconfig_or_gcc_definition_conflicts_refused(self):
        self.write(self.xcconfig, 'OTHER_CFLAGS = -DSQLITE_DEFAULT_SYNCHRONOUS=2\n')
        with self.assertRaises(ValueError):
            self.ios()
        self.settings[0]['buildSettings']['GCC_PREPROCESSOR_DEFINITIONS'] = 'SQLITE_DEFAULT_SYNCHRONOUS=2'
        with self.assertRaises(ValueError):
            reader.ios_settings(self.settings)

    def test_ios_copied_source_or_release_object_absence_refused(self):
        self.write(self.module / 'ios/sqlite3.c', 'unrelated copied source')
        with self.assertRaisesRegex(ValueError, 'match installed vendor'):
            self.ios()
        self.write(self.module / 'ios/sqlite3.c', self.sqlite.read_text())
        self.ios_object.unlink()
        with self.assertRaisesRegex(ValueError, 'object absent'):
            self.ios()

    def test_ios_original_info_or_privacy_inspection_hash_mismatch_refused(self):
        self.plist(self.app / 'Info.plist', {'Changed': 'fixture'})
        with self.assertRaisesRegex(ValueError, 'Info.plist differs'):
            self.ios()
        self.inspect_receipt()
        self.plist(self.app / 'PrivacyInfo.xcprivacy', {'Changed': 'fixture'})
        with self.assertRaisesRegex(ValueError, 'Privacy replay differs'):
            self.ios()

    def test_privacy_only_traversed_symlinks_refused_unrelated_code_link_allowed(self):
        (self.app / 'UnrelatedCodeLink').symlink_to(self.module / 'package.json')
        (self.app / 'InternalFrameworkAlias').symlink_to(self.app / 'Frameworks')
        reader.privacy_tree(self.app, self.out / 'replay')
        linked = self.app / 'PrivacyInfo.xcprivacy'
        linked.unlink()
        linked.symlink_to(self.out / 'replay/PrivacyInfo.xcprivacy')
        with self.assertRaises(ValueError):
            reader.privacy_tree(self.app, self.out / 'other-replay')

    def test_privacy_directory_link_cannot_hide_external_sdk_manifest(self):
        hidden = self.root / 'external-sdk'
        self.plist(hidden / 'PrivacyInfo.xcprivacy', {'NSPrivacyTracking': True})
        (self.app / 'ExternalSDKLink').symlink_to(hidden)
        with self.assertRaisesRegex(ValueError, 'directory symlink escapes'):
            reader.privacy_tree(self.app, self.out / 'replay')

    def test_privacy_replay_destination_must_be_fresh(self):
        destination = self.out / 'replay'
        destination.mkdir()
        with self.assertRaisesRegex(ValueError, 'must be fresh'):
            reader.privacy_tree(self.app, destination)

    def aggregate_database(self, entry=None):
        database = self.build.parent / 'compile_commands.json'
        self.write(database, json.dumps([self.entry if entry is None else entry]))
        return database

    def test_android_aggregate_and_per_abi_copies_bind_one_actual_cache_and_object(self):
        aggregate = self.aggregate_database()
        self.assertFalse((aggregate.parent / 'CMakeCache.txt').exists())
        result = reader.android(self.repo, self.out)
        row = result['sqliteCompileEntries'][0]
        self.assertEqual(len(result['sqliteCompileEntries']), 1)
        self.assertEqual(len(row['compileDatabases']), 2)
        self.assertEqual(row['cmakeCache'], str((self.build / 'CMakeCache.txt').relative_to(self.module)))
        self.assertEqual(row['objectSHA256'], reader.digest(self.object))

    def test_android_aggregate_only_binds_actual_entry_directory_cache(self):
        aggregate = self.aggregate_database()
        (self.build / 'compile_commands.json').unlink()
        result = reader.android(self.repo, self.out)
        row = result['sqliteCompileEntries'][0]
        self.assertEqual(row['compileDatabase'], str(aggregate.relative_to(self.module)))
        self.assertEqual(row['entry']['directory'], str(self.build.resolve()))
        self.assertEqual(row['cmakeCacheSHA256'], reader.digest(self.build / 'CMakeCache.txt'))

    def test_android_identical_repeated_invocation_rows_deduplicate(self):
        self.write(self.build / 'compile_commands.json', json.dumps([self.entry, copy.deepcopy(self.entry)]))
        row = reader.android(self.repo, self.out)['sqliteCompileEntries'][0]
        self.assertEqual(len(row['compileDatabases']), 1)
        self.assertEqual(row['objectSHA256'], reader.digest(self.object))

    def test_android_conflicting_aggregate_macro_is_not_ignored_or_deduplicated(self):
        conflicting = {**self.entry, 'command': self.entry['command'].replace(FLAG, '-DSQLITE_DEFAULT_SYNCHRONOUS=2')}
        self.aggregate_database(conflicting)
        with self.assertRaisesRegex(ValueError, 'Conflicting SQLite synchronous'):
            reader.android(self.repo, self.out)

    def test_android_same_object_different_valid_invocations_refused(self):
        different = {**self.entry, 'command': self.entry['command'].replace(FLAG, FLAG + ' -DUNRELATED_FIXTURE=1')}
        self.aggregate_database(different)
        with self.assertRaisesRegex(ValueError, 'Conflicting SQLite compiler invocations'):
            reader.android(self.repo, self.out)

    def test_android_missing_actual_cache_cannot_use_aggregate_parent_cache(self):
        aggregate = self.aggregate_database()
        cache = (self.build / 'CMakeCache.txt').read_text()
        self.write(aggregate.parent / 'CMakeCache.txt', cache)
        (self.build / 'CMakeCache.txt').unlink()
        with self.assertRaisesRegex(ValueError, 'CMake cache'):
            reader.android(self.repo, self.out)

    def test_android_declared_cache_home_and_cache_directory_bind_exact_module(self):
        cache = 'CMAKE_BUILD_TYPE:STRING=RelWithDebInfo\nANDROID_ABI:STRING=arm64-v8a\n'
        self.write(self.build / 'CMakeCache.txt', cache +
                   f'CMAKE_HOME_DIRECTORY:INTERNAL={self.module / "android"}\n' +
                   f'CMAKE_CACHEFILE_DIR:INTERNAL={self.build}\n')
        reader.android(self.repo, self.out)
        for extra, message in [
            (f'CMAKE_HOME_DIRECTORY:INTERNAL={self.root / "unrelated-source"}\n', 'cache home'),
            (f'CMAKE_CACHEFILE_DIR:INTERNAL={self.root / "unrelated-build"}\n', 'cache directory'),
        ]:
            self.write(self.build / 'CMakeCache.txt', cache + extra)
            with self.subTest(extra=extra), self.assertRaisesRegex(ValueError, message):
                reader.android(self.repo, self.out)

    def test_android_entry_directory_outside_module_staging_refused(self):
        outside = self.root / 'unrelated-build'
        output = outside / 'sqlite3.o'
        self.write(outside / 'CMakeCache.txt', 'CMAKE_BUILD_TYPE:STRING=Release\nANDROID_ABI:STRING=arm64-v8a\n')
        self.write(output, 'Synthetic unrelated output object')
        self.aggregate_database({**self.entry, 'directory': str(outside),
                                 'command': f'clang {FLAG} -o {shlex.quote(str(output))} -c {shlex.quote(str(self.sqlite))}'})
        with self.assertRaisesRegex(ValueError, 'outside its ExpoSQLite'):
            reader.android(self.repo, self.out)

    def test_android_aggregate_actual_source_and_output_checks_remain_strict(self):
        outside = self.root / 'outside.o'
        self.write(outside, 'Synthetic unrelated object')
        cases = [
            (f'clang {FLAG} -o {shlex.quote(str(self.object))} -c other.c', 'source field'),
            (f'clang {FLAG} -o {shlex.quote(str(outside))} -c {shlex.quote(str(self.sqlite))}', 'outside'),
        ]
        for command, message in cases:
            self.aggregate_database({**self.entry, 'command': command})
            with self.subTest(command=command), self.assertRaisesRegex(ValueError, message):
                reader.android(self.repo, self.out)

    def test_android_multiple_distinct_release_objects_in_one_cache_refused(self):
        other = self.build / 'different-sqlite3.o'
        self.write(other, 'Synthetic distinct release object')
        second = {**self.entry, 'command': self.entry['command'].replace(shlex.quote(str(self.object)), shlex.quote(str(other)))}
        self.write(self.build / 'compile_commands.json', json.dumps([self.entry, second]))
        with self.assertRaisesRegex(ValueError, 'unambiguous'):
            reader.android(self.repo, self.out)

    def test_android_aggregate_wrong_actual_cache_abi_refused(self):
        self.aggregate_database()
        self.write(self.build / 'CMakeCache.txt', 'CMAKE_BUILD_TYPE:STRING=Release\nANDROID_ABI:STRING=x86_64\n')
        with self.assertRaisesRegex(ValueError, 'release ABI'):
            reader.android(self.repo, self.out)

    def test_source_identity_requires_exact_commit_tree_receipt(self):
        values = ['a' * 40, 'b' * 40]
        self.write(self.out / 'source.txt', '\n'.join(values) + '\n')
        completed = subprocess.CompletedProcess(['git'], 0, ('\n'.join(values) + '\n').encode())
        with patch.object(reader.subprocess, 'run', return_value=completed):
            self.assertEqual(reader.source_identity(self.repo, self.out), dict(commit=values[0], tree=values[1]))
            self.write(self.out / 'source.txt', 'a' * 40 + '\n' + 'c' * 40 + '\n')
            with self.assertRaisesRegex(ValueError, 'source receipt'):
                reader.source_identity(self.repo, self.out)


if __name__ == '__main__':
    unittest.main(verbosity=2)
