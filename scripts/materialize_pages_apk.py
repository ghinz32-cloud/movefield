"""Reassemble already verified APK bytes only inside an owned Pages candidate.

This checks distribution identity and byte integrity, not Android signatures.
Public/Worker builds retain bounded parts; they never receive the full APK.
"""
import hashlib
import json
import pathlib
import re
import tempfile

APPS = {
    'review': ('movefield', 'movefield', 'com.ghinz32.movefield'),
    'grizzly': ('grizzly', 'grizzly-fitness', 'com.ghinz32.grizzlyfitness.prototype'),
}
MAX_APK = 60 * 1024 * 1024
MAX_PART = 10 * 1024 * 1024


def require(value, message):
    if not value:
        raise RuntimeError('Pages APK: ' + message)


def matches(pattern, value):
    return isinstance(value, str) and re.fullmatch(pattern, value) is not None


def size(value, limit):
    return type(value) is int and 0 < value <= limit


def confined_file(directory, relative):
    path = pathlib.PurePosixPath(relative)
    require(not path.is_absolute() and '..' not in path.parts and '\\' not in relative,
            'file path escapes owned downloads')
    file = directory.joinpath(*path.parts)
    require(file.resolve().is_relative_to(directory.resolve()), 'file path escapes owned downloads')
    require(not any(p.is_symlink() for p in [file, *file.parents] if p != directory.parent),
            'symlink in download path')
    require(file.is_file(), 'missing download file: ' + relative)
    return file


def materialize(candidate, folder):
    """Return the exact generated receipt, or None for old fixtures without downloads."""
    require(folder in APPS, 'destination is outside owned brand directories')
    candidate = pathlib.Path(candidate)
    target = candidate / folder
    require(not candidate.is_symlink() and not target.is_symlink() and
            target.resolve().parent == candidate.resolve(), 'destination escapes Pages ownership')
    downloads = target / 'downloads'
    page, manifest = downloads / 'android.html', downloads / 'android-installers.json'
    if not page.exists() and not manifest.exists():
        return None
    confined_file(target, 'downloads/android.html')
    manifest = confined_file(target, 'downloads/android-installers.json')
    require(manifest.stat().st_size <= 128 * 1024, 'manifest exceeds size limit')
    data = json.loads(manifest.read_text())
    require(isinstance(data, dict) and data.get('format') == 'fitness-android-downloads-v1',
            'unexpected manifest format')
    require(matches(r'[a-f0-9]{40}', data.get('sourceCommit')), 'invalid source commit')
    require(matches(r'[a-f0-9]{40}', data.get('sourceTree')), 'invalid source tree')
    require(matches(r'[a-f0-9]{64}', data.get('signingCertificateSHA256')), 'invalid signing identity')
    apps = data.get('apps')
    require(isinstance(apps, list) and len(apps) == 2 and
            all(isinstance(a, dict) for a in apps) and
            sorted(a.get('app', '') for a in apps) == ['grizzly', 'movefield'], 'unexpected app identities')
    for app, basename, package in APPS.values():
        entry = next(a for a in apps if a['app'] == app)
        require(entry.get('package') == package and entry.get('architecture') == 'arm64-v8a',
                'package or architecture identity mismatch')
        require(entry.get('sourceCommit') == data['sourceCommit'], 'source commit identity mismatch')
        require(matches(r'\d+\.\d+\.\d+', entry.get('versionName')) and
                size(entry.get('versionCode'), 2147483647), 'invalid app version')
        require(entry.get('filename') == app + '-arm64-current-test.apk', 'filename identity mismatch')
        require(size(entry.get('bytes'), MAX_APK) and matches(r'[a-f0-9]{64}', entry.get('sha256')),
                'invalid APK size or SHA256')
        parts = entry.get('parts')
        require(isinstance(parts, list) and 1 <= len(parts) <= 8, 'invalid part count')
        for n, part in enumerate(parts):
            require(isinstance(part, dict) and part.get('file') == f'native/{app}/part-{n}.bin',
                    'part path or order escapes app identity')
            require(size(part.get('bytes'), MAX_PART) and matches(r'[a-f0-9]{64}', part.get('sha256')),
                    'invalid part size or SHA256')
        require(sum(p['bytes'] for p in parts) == entry['bytes'], 'part byte total mismatch')
    app, basename, _ = APPS[folder]
    entry = next(a for a in apps if a['app'] == app)
    filename = f"{basename}-{entry['versionName']}-arm64.apk"
    output = downloads / filename
    require(not output.exists() and not output.is_symlink(), 'full APK must not come from static input')
    complete = hashlib.sha256()
    total = 0
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=downloads, prefix='.pages-apk-', delete=False) as stream:
            temporary = pathlib.Path(stream.name)
            for part in entry['parts']:
                source = confined_file(downloads, part['file'])
                require(source.stat().st_size == part['bytes'], 'part size mismatch')
                partial = hashlib.sha256()
                part_bytes = 0
                with source.open('rb') as source_stream:
                    while chunk := source_stream.read(1024 * 1024):
                        part_bytes += len(chunk)
                        total += len(chunk)
                        require(part_bytes <= part['bytes'] and total <= MAX_APK, 'part grew beyond bound')
                        partial.update(chunk)
                        complete.update(chunk)
                        stream.write(chunk)
                require(part_bytes == part['bytes'] and partial.hexdigest() == part['sha256'],
                        'part SHA256 or size mismatch')
        require(total == entry['bytes'] and complete.hexdigest() == entry['sha256'],
                'complete APK SHA256 or size mismatch')
        temporary.replace(output)
        temporary = None
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    return {'file': 'downloads/' + filename, 'app': app, 'source_commit': entry['sourceCommit'],
            'version_name': entry['versionName'], 'version_code': entry['versionCode'],
            'bytes': total, 'sha256': complete.hexdigest()}
