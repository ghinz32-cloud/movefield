"""Retain bounded native build-route and privacy evidence after successful builds.

This verifies SQLite C macro declarations and existing compiled objects, not
complete binary SCA, instruction-level macro recovery, runtime PRAGMAs or devices.
"""
import argparse
import hashlib
import json
from pathlib import Path
import plistlib
import re
import shlex
import shutil
import subprocess
from urllib.parse import parse_qsl, urlsplit


MACRO = 'SQLITE_DEFAULT_SYNCHRONOUS'
RELEASE_TYPES = {'Release', 'RelWithDebInfo'}
SETTING_KEYS = {'TARGET_NAME', 'CONFIGURATION', 'PLATFORM_NAME', 'SDKROOT',
                'PRODUCT_NAME', 'OTHER_CFLAGS', 'GCC_PREPROCESSOR_DEFINITIONS'}


def public_text(text):
    require(not re.search(r'\b(?:GITHUB_TOKEN|GH_TOKEN|AWS_SECRET_ACCESS_KEY|ACCESS_TOKEN|API_KEY|CLIENT_SECRET|PASSWORD)\s*[=:]', text, re.I),
            'Credential-like value in public build evidence')
    for url in re.findall(r'https?://[^\s\"\'<>]+', text):
        parsed = urlsplit(url)
        require(not parsed.username and not parsed.password and not any(
            key.lower() in {'sig', 'signature', 'token', 'access_token', 'auth', 'authorization', 'api_key',
                            'x-amz-signature', 'x-amz-credential', 'x-goog-signature', 'x-goog-credential'}
            for key, _ in parse_qsl(parsed.query)), 'Credential or signed URL in public build evidence')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def regular(path, label):
    require(path.is_file() and not path.is_symlink() and path.stat().st_size > 0,
            'Missing, empty or symlinked ' + label)
    return path


def words(value):
    require(isinstance(value, str) or (isinstance(value, list) and
            all(isinstance(item, str) for item in value)), 'Malformed compiler flags')
    return shlex.split(value) if isinstance(value, str) else list(value)


def synchronous_three(tokens):
    """Require one explicit, unconflicted C macro; never substring-match flags."""
    values, index = [], 0
    while index < len(tokens):
        token = tokens[index]
        require(not token.startswith('@'), 'Unexpanded compiler response file')
        if token in {'-D', '-U'}:
            index += 1
            require(index < len(tokens), 'Incomplete preprocessor option')
            token += tokens[index]
        if re.match(r'^-[DU]' + MACRO + r'(?:=|$)', token):
            require(token == '-D' + MACRO + '=3', 'Conflicting SQLite synchronous macro')
            values.append(token)
        elif re.search(r'(?:-D|-U|(?<![A-Za-z0-9_]))' + MACRO + r'(?![A-Za-z0-9_])', token):
            raise ValueError('Indirect or unreviewed SQLite synchronous compiler flag')
        index += 1
    require(len(values) == 1, 'SQLite synchronous macro must be explicitly defined once as 3')


def source_identity(repo, out):
    expected = regular(out / 'source.txt', 'source receipt').read_text().splitlines()
    actual = subprocess.run(['git', 'rev-parse', 'HEAD', 'HEAD^{tree}'], cwd=repo,
                            check=True, stdout=subprocess.PIPE, timeout=30).stdout.decode().splitlines()
    require(len(expected) == 2 and expected == actual and
            all(re.fullmatch(r'[0-9a-f]{40}', value) for value in expected),
            'Build source receipt does not match checked-out commit and tree')
    return {'commit': expected[0], 'tree': expected[1]}


def module_sources(repo):
    module = (repo / 'mobile/node_modules/expo-sqlite').resolve()
    package_path = regular(module / 'package.json', 'installed ExpoSQLite package')
    package = json.loads(package_path.read_text())
    require(package.get('name') == 'expo-sqlite' and isinstance(package.get('version'), str),
            'Unexpected installed SQLite package')
    vendors = {regular(module / 'vendor' / name / 'sqlite3.c', 'vendored SQLite C source').resolve(): name
               for name in ('sqlite3', 'sqlcipher')}
    return module, vendors, {'name': package['name'], 'version': package['version'],
                             'packageJSONSHA256': digest(package_path)}


def cache_values(path):
    result = {}
    for line in regular(path, 'CMake cache').read_text().splitlines():
        match = re.fullmatch(r'([^#/:=]+):[^=]+=(.*)', line)
        if match:
            require(match[1] not in result, 'Duplicate CMake cache variable')
            result[match[1]] = match[2]
    return result


def option(tokens, name):
    positions = [index for index, token in enumerate(tokens) if token == name]
    require(len(positions) == 1 and positions[0] + 1 < len(tokens), 'Missing or ambiguous compiler ' + name)
    return tokens[positions[0] + 1]


def android(repo, out):
    module, vendors, package = module_sources(repo)
    classpath = regular(repo / 'mobile/android/build/release-runtime-classpath.raw.txt', 'resolved release runtime classpath')
    dependency_text = classpath.read_text()
    public_text(dependency_text)
    require('releaseRuntimeClasspath' in dependency_text and
            ('+---' in dependency_text or '\\---' in dependency_text) and
            not re.search(r'\bFAILED\b', dependency_text),
            'Wrong, empty or unresolved Gradle dependency configuration receipt')
    records = []
    for database in sorted((module / 'android/.cxx').rglob('compile_commands.json')):
        cache = cache_values(database.parent / 'CMakeCache.txt')
        if cache.get('CMAKE_BUILD_TYPE') not in RELEASE_TYPES:
            continue
        abis = {cache[key] for key in ('ANDROID_ABI', 'CMAKE_ANDROID_ARCH_ABI') if cache.get(key)}
        require(abis == {'arm64-v8a'}, 'Unexpected ExpoSQLite release ABI')
        abi = 'arm64-v8a'
        rows = json.loads(regular(database, 'CMake compile database').read_text())
        require(isinstance(rows, list), 'CMake compile database must be an array')
        matches = []
        for entry in rows:
            require(isinstance(entry, dict) and isinstance(entry.get('file'), str) and
                    isinstance(entry.get('directory'), str), 'Malformed CMake compile record')
            directory = Path(entry['directory']).resolve()
            file = (directory / entry['file']).resolve()
            if file in vendors:
                tokens = words(entry['arguments'] if 'arguments' in entry else entry.get('command'))
                public_text(json.dumps(tokens))
                synchronous_three(tokens)
                require((directory / option(tokens, '-c')).resolve() == file,
                        'SQLite source field does not match actual C compiler input')
                output = (directory / option(tokens, '-o')).resolve()
                require(output.is_relative_to(database.parent.resolve()), 'SQLite object is outside its CMake build')
                regular(output, 'built SQLite C object')
                # Retain only the selected validated invocation and actual -o.
                # A shadow command/output field must not smuggle unchecked data.
                retained = {'directory': str(directory), 'file': str(file),
                            'arguments': tokens, 'output': str(output)}
                matches.append({'entry': retained, 'vendor': vendors[file], 'sourceSHA256': digest(file),
                                'objectSHA256': digest(output), 'objectBytes': output.stat().st_size})
        require(len(matches) == 1, 'Release compile database must contain one installed SQLite C entry')
        records.append({'compileDatabase': str(database.relative_to(module)),
                        'compileDatabaseSHA256': digest(database), 'cmakeCacheSHA256': digest(database.parent / 'CMakeCache.txt'),
                        'buildType': cache['CMAKE_BUILD_TYPE'], 'abi': abi, **matches[0]})
    require(len(records) == 1, 'Expected one unambiguous current release SQLite compile database')
    shutil.copyfile(classpath, out / 'release-runtime-classpath.txt')
    (out / 'sqlite-release-compile-entry.json').write_text(json.dumps(records, indent=2) + '\n')
    return {'package': package, 'synchronousMacro': 3, 'releaseRuntimeClasspathSHA256': digest(classpath),
            'sqliteCompileEntries': records,
            'scope': 'Resolved Gradle report and generated SQLite C compile invocation with nonempty output object; not complete binary SCA or runtime proof'}


def ios_settings(rows):
    require(isinstance(rows, list), 'Xcode build settings must be an array')
    matches = [row for row in rows if isinstance(row, dict) and row.get('target') == 'ExpoSQLite']
    require(len(matches) == 1 and isinstance(matches[0].get('buildSettings'), dict), 'Missing or ambiguous ExpoSQLite target settings')
    settings = matches[0]['buildSettings']
    require(settings.get('TARGET_NAME') == 'ExpoSQLite' and settings.get('CONFIGURATION') == 'Release' and
            settings.get('PLATFORM_NAME') == 'iphonesimulator', 'Wrong SQLite target, configuration or platform')
    flags = words(settings.get('OTHER_CFLAGS'))
    definitions = words(settings.get('GCC_PREPROCESSOR_DEFINITIONS', ''))
    flags += ['-D' + value for value in definitions if value != '$(inherited)']
    synchronous_three(flags)
    public_text(json.dumps(flags))
    # Never retain the complete build-settings/environment dictionary.
    return {key: settings[key] for key in sorted(SETTING_KEYS) if key in settings}


def privacy_tree(app, target):
    regular(app / 'Info.plist', 'built app Info.plist')
    paths = sorted(app.rglob('PrivacyInfo.xcprivacy'))
    require(app / 'PrivacyInfo.xcprivacy' in paths, 'Built root privacy manifest absent')
    for entry in app.rglob('*'):
        if entry.is_symlink() and entry.is_dir():
            # Internal framework aliases cannot hide new physical files from
            # the canonical tree walk. External directories could hide SDK
            # privacy manifests and must not silently disappear from replay.
            require(entry.resolve().is_relative_to(app.resolve()),
                    'Built app directory symlink escapes privacy evidence tree')
    require(not target.exists(), 'Built privacy replay destination must be fresh')
    records = []
    for file in [app / 'Info.plist', *paths]:
        require(not any(part.is_symlink() for part in [file, *file.parents] if part == app or app in part.parents),
                'Built plist/privacy path must not traverse symlinks')
        regular(file, 'built plist/privacy manifest')
        with file.open('rb') as stream:
            require(isinstance(plistlib.load(stream), dict), 'Malformed built plist/privacy manifest')
        relative = file.relative_to(app)
        destination = target / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(file, destination)
        records.append({'path': relative.as_posix(), 'sha256': digest(file), 'bytes': file.stat().st_size})
    return records


def ios(repo, out):
    module, vendors, package = module_sources(repo)
    copied = regular(module / 'ios/sqlite3.c', 'CocoaPods copied SQLite source')
    matches = [name for file, name in vendors.items() if digest(file) == digest(copied)]
    require(len(matches) == 1, 'Copied iOS SQLite source does not uniquely match installed vendor')
    xcconfig = regular(repo / 'mobile/ios/Pods/Target Support Files/ExpoSQLite/ExpoSQLite.release.xcconfig', 'SQLite Release xcconfig')
    cflags = re.findall(r'^OTHER_CFLAGS\s*=\s*(.*)$', xcconfig.read_text(), re.M)
    require(len(cflags) == 1, 'Missing or ambiguous SQLite xcconfig C flags')
    synchronous_three(words(cflags[0]))
    public_text(xcconfig.read_text())
    command = ['xcodebuild', '-project', str(repo / 'mobile/ios/Pods/Pods.xcodeproj'), '-target', 'ExpoSQLite',
               '-configuration', 'Release', '-sdk', 'iphonesimulator', '-showBuildSettings', '-json', 'CODE_SIGNING_ALLOWED=NO']
    completed = subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
    settings = ios_settings(json.loads(completed.stdout))
    objects = sorted((repo / 'mobile/ios/build/Build/Intermediates.noindex/Pods.build/Release-iphonesimulator/ExpoSQLite.build/Objects-normal').glob('*/sqlite3.o'))
    require(objects, 'Built Release SQLite C object absent')
    object_records = []
    for file in objects:
        regular(file, 'built Release SQLite C object')
        object_records.append({'architecture': file.parent.name, 'sha256': digest(file), 'bytes': file.stat().st_size})
    app = repo / 'mobile/ios/build/Build/Products/Release-iphonesimulator/Movefield.app'
    inspection = json.loads(regular(out / 'inspection.json', 'original built app inspection').read_text())
    require(inspection.get('passed') is True and inspection.get('infoSHA256') == digest(regular(app / 'Info.plist', 'built app Info.plist')),
            'Built Info.plist differs from original inspection')
    privacy = privacy_tree(app, out / 'built-app')
    actual_manifests = {row['path']: row['sha256'] for row in privacy if row['path'].endswith('PrivacyInfo.xcprivacy')}
    inspected_manifests = {row['path']: row['sha256'] for row in inspection.get('privacyManifests', [])}
    require(actual_manifests == inspected_manifests,
            'Privacy replay differs from original full built app inspection')
    shutil.copyfile(xcconfig, out / 'ExpoSQLite.release.xcconfig')
    (out / 'ExpoSQLite.release-build-settings.json').write_text(json.dumps({'target': 'ExpoSQLite', 'buildSettings': settings}, indent=2) + '\n')
    return {'package': package, 'synchronousMacro': 3, 'vendor': matches[0], 'copiedSQLiteSourceSHA256': digest(copied),
            'releaseXcconfigSHA256': digest(xcconfig), 'releaseBuildSettings': settings,
            'sqliteCObjects': object_records, 'builtAppPrivacyReplay': privacy,
            'scope': 'Resolved Release pod flags/source identity and nonempty C objects plus complete built plist/privacy replay; not captured per-file invocation, complete binary SCA or runtime proof'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('platform', choices=('android', 'ios'))
    parser.add_argument('repo', type=Path)
    parser.add_argument('out', type=Path)
    args = parser.parse_args()
    repo, out = args.repo.resolve(), args.out.resolve()
    out.mkdir(parents=True, exist_ok=True)
    identity = source_identity(repo, out)
    result = android(repo, out) if args.platform == 'android' else ios(repo, out)
    (out / 'build-route-evidence.json').write_text(json.dumps({'schema': 1, 'platform': args.platform,
        'source': identity, 'passed': True, **result}, indent=2) + '\n')


if __name__ == '__main__':
    main()
