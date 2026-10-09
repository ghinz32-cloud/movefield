'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const repo = path.resolve(__dirname, '..');
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'movefield-starter-test-'));
const results = [];
function write(name, value) { const file = path.join(fixture, name); fs.mkdirSync(path.dirname(file), {recursive: true}); fs.writeFileSync(file, value); }
function command(name, args, expected = 0) { const result = spawnSync(name, args, {cwd: fixture, encoding: 'utf8'}); assert.equal(result.status, expected, result.stderr || result.stdout); return result; }
function git(...args) { return command('git', args); }
const target = path.join(fixture, 'public/downloads/movefield-mobile-r14.zip');
function build(expected = 0) { return command('python3', ['scripts/package-mobile.py'], expected); }
function entries() {
  return JSON.parse(command('python3', ['-c', 'import json,zipfile; z=zipfile.ZipFile("public/downloads/movefield-mobile-r14.zip"); print(json.dumps({n:z.read(n).decode("utf-8") for n in z.namelist()}))']).stdout);
}
function scenario(name, run) { run(); results.push({name, passed: true}); console.log(`PASS ${name}`); }
try {
  write('scripts/package-mobile.py', fs.readFileSync(path.join(repo, 'scripts/package-mobile.py')));
  git('init', '--quiet');
  for (const name of ['App.tsx', 'app.json', 'index.ts', 'package.json', 'package-lock.json', 'tsconfig.json']) write(`mobile/${name}`, 'original source');
  const appConfig = JSON.stringify({expo: {plugins: ['./plugins/withSecurity.cjs']}});
  write('mobile/app.json', appConfig);
  write('mobile/plugins/withSecurity.cjs', 'module.exports = config => config;');
  write('mobile/LICENSE', 'license fixture');
  write('mobile/START-HERE.md', 'starter instructions fixture');
  write('mobile/src/nested/tool.ts', 'export const tool = true;');
  write('mobile/assets/icon.svg', '<svg/>');
  write('mobile/.gitignore', 'android/\nios/\n.env*\n');
  git('add', '--', 'mobile');

  scenario('Current tracked working-tree source ships without requiring a commit', () => {
    write('mobile/App.tsx', 'updated and validated working-tree source');
    build();
    const data = entries();
    assert.equal(data['training-studio-mobile/App.tsx'], 'updated and validated working-tree source');
    assert.equal(data['training-studio-mobile/src/nested/tool.ts'], 'export const tool = true;');
    assert.equal(data['training-studio-mobile/plugins/withSecurity.cjs'], 'module.exports = config => config;');
    assert.equal(data['training-studio-mobile/LICENSE'], 'license fixture');
    assert.equal(data['training-studio-mobile/START-HERE.md'], 'starter instructions fixture');
  });

  scenario('Untracked source, native output, photos and credentials never enter the public starter', () => {
    for (const name of ['src/untracked.ts', 'android/app/build/output.apk', 'ios/Pods/generated.m', 'android/app/release.keystore', 'ios/signing.p12', '.env.production', '.npmrc', 'credentials.json', 'service-account.json', 'exercise-photos/private.jpg', 'assets/untracked-photo.jpg']) write(`mobile/${name}`, 'untracked private sentinel');
    write('public/exercise-photos/private.jpg', 'public photo sentinel');
    build();
    const data = entries();
    assert.equal(Object.keys(data).length, 12);
    assert(Object.keys(data).every(name => name.startsWith('training-studio-mobile/')));
    assert(Object.values(data).every(value => !value.includes('sentinel')));
  });

  scenario('Repeated packaging is byte-identical', () => {
    const before = fs.readFileSync(target); build(); assert.deepEqual(fs.readFileSync(target), before);
  });

  scenario('A referenced local Expo plugin must be tracked and packaged', () => {
    const before = fs.readFileSync(target);
    git('rm', '--cached', '--quiet', '--', 'mobile/plugins/withSecurity.cjs');
    build(1); assert.deepEqual(fs.readFileSync(target), before);
    git('add', '--', 'mobile/plugins/withSecurity.cjs'); build();
    assert.equal(entries()['training-studio-mobile/plugins/withSecurity.cjs'], 'module.exports = config => config;');
  });

  scenario('Local plugin traversal, absolute paths and untracked references fail closed', () => {
    const before = fs.readFileSync(target);
    for (const plugin of ['./plugins/../outside.cjs', '../outside.cjs', '/private/outside.cjs', './plugins\\outside.cjs', './plugins/untracked.cjs']) {
      write('mobile/app.json', JSON.stringify({expo: {plugins: [[plugin, {}]]}}));
      write('mobile/plugins/untracked.cjs', 'untracked plugin sentinel');
      build(1); assert.deepEqual(fs.readFileSync(target), before);
    }
    write('mobile/app.json', appConfig);
  });

  scenario('Tracked generated native output and photo directories remain excluded', () => {
    const names = ['mobile/android/app/build/tracked.apk', 'mobile/ios/build/tracked.txt', 'mobile/assets/exercise-photos/tracked.jpg'];
    for (const name of names) { write(name, 'tracked generated sentinel'); git('add', '-f', '--', name); }
    build(); assert(Object.values(entries()).every(value => !value.includes('generated sentinel')));
    for (const name of names) { git('rm', '--cached', '--quiet', '--', name); fs.rmSync(path.join(fixture, name)); }
  });

  scenario('Accidentally tracked credential filenames fail closed and preserve the prior archive', () => {
    const before = fs.readFileSync(target);
    for (const name of ['credentials.json', 'src/nested/serviceAccount.json', '.env.production', '.npmrc', 'assets/release.keystore', 'android/signing.jks', 'ios/signing.p12', 'assets/private.key', 'assets/signing.p8', 'assets/profile.mobileprovision']) {
      const file = `mobile/${name}`; write(file, 'credential fixture without actual secrets'); git('add', '-f', '--', file);
      build(1); assert.deepEqual(fs.readFileSync(target), before);
      git('rm', '--cached', '--quiet', '--', file); fs.rmSync(path.join(fixture, file));
    }
  });

  scenario('Credential content hidden in a tracked source file fails without replacing the archive', () => {
    const before = fs.readFileSync(target);
    for (const content of ['-----BEGIN PRIVATE KEY-----\nsynthetic\n-----END PRIVATE KEY-----', `const token = "ghp_${'X'.repeat(36)}";`]) {
      write('mobile/App.tsx', content); const failed = build(1);
      assert(!failed.stderr.includes(content)); assert.deepEqual(fs.readFileSync(target), before);
    }
    write('mobile/App.tsx', 'updated and validated working-tree source');
  });

  scenario('Tracked source symlinks cannot expose a file outside the starter', () => {
    const link = 'mobile/src/outside.ts';
    write('private-outside.ts', 'private outside sentinel'); fs.symlinkSync(path.join(fixture, 'private-outside.ts'), path.join(fixture, link));
    git('add', '--', link); const before = fs.readFileSync(target); build(1); assert.deepEqual(fs.readFileSync(target), before);
    git('rm', '--cached', '--quiet', '--', link); fs.rmSync(path.join(fixture, link));
  });

  scenario('Replacing a tracked source directory with a symlink fails closed', () => {
    const folder = path.join(fixture, 'mobile/src/nested'), before = fs.readFileSync(target);
    fs.rmSync(folder, {recursive: true}); write('outside/tool.ts', 'outside private sentinel');
    fs.symlinkSync(path.join(fixture, 'outside'), folder); build(1); assert.deepEqual(fs.readFileSync(target), before);
    fs.rmSync(folder); write('mobile/src/nested/tool.ts', 'export const tool = true;');
  });

  scenario('Missing required tracked source fails and keeps the last usable download', () => {
    const before = fs.readFileSync(target); fs.rmSync(path.join(fixture, 'mobile/app.json')); build(1); assert.deepEqual(fs.readFileSync(target), before);
    write('mobile/app.json', appConfig);
    assert(fs.readdirSync(path.dirname(target)).every(name => !name.startsWith('.movefield-mobile-')));
  });

  scenario('A source copy without its Git index cannot silently fall back to scanning local files', () => {
    const before = fs.readFileSync(target); fs.renameSync(path.join(fixture, '.git'), path.join(fixture, 'saved-git'));
    build(1); assert.deepEqual(fs.readFileSync(target), before);
  });
} finally {
  fs.rmSync(fixture, {recursive: true, force: true});
}
fs.mkdirSync(path.join(repo, '.sites-runtime'), {recursive: true});
fs.writeFileSync(path.join(repo, '.sites-runtime/mobile-package-check-results.json'), JSON.stringify({passed: results.length, total: results.length, results}, null, 2) + '\n');
console.log(`${results.length} mobile source packaging security scenarios passed.`);
