// Exercise the installed Expo config plugins against fresh native templates.
// This does not compile native code, inspect a merged release APK/IPA, or submit
// to either store. No app records, credentials, devices, or weight files are used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {createRequire} = require('node:module');
const {createHash} = require('node:crypto');
const root = path.resolve(__dirname, '..');
const mobile = path.join(root, 'mobile');
const requireMobile = createRequire(path.join(mobile, 'package.json'));
const {parseStringPromise} = requireMobile('xml2js');
const plist = requireMobile('@expo/plist').default;
const domains = ['root', 'file', 'database', 'sharedpref', 'external',
  'device_root', 'device_file', 'device_database', 'device_sharedpref'];
const blocked = ['SYSTEM_ALERT_WINDOW', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE', 'RECORD_AUDIO', 'CAMERA'];
const expectedReasons = {
  NSPrivacyAccessedAPICategoryFileTimestamp: ['C617.1', '3B52.1'],
  NSPrivacyAccessedAPICategoryDiskSpace: ['E174.1'],
  NSPrivacyAccessedAPICategoryUserDefaults: ['CA92.1'],
  NSPrivacyAccessedAPICategorySystemBootTime: ['35F9.1'],
};
let checks = 0;
const equal = (actual, expected, reason) => {assert.deepEqual(actual, expected, reason); checks++;};
const read = (dir, relative) => fs.readFileSync(path.join(dir, relative), 'utf8');
const hash = text => createHash('sha256').update(text).digest('hex');
const json = relative => JSON.parse(read(mobile, relative));

async function inspect(dir) {
  const manifestText = read(dir, 'android/app/src/main/AndroidManifest.xml');
  const manifest = (await parseStringPromise(manifestText)).manifest;
  const app = manifest.application[0].$;
  equal(app['android:allowBackup'], 'false', 'Android app data must not be opted into automatic backup');
  equal(app['android:usesCleartextTraffic'], 'false', 'Release main manifest must deny cleartext');
  equal(app['android:fullBackupContent'], '@xml/movefield_backup_rules', 'Legacy backup rules must be linked');
  equal(app['android:dataExtractionRules'], '@xml/movefield_data_extraction_rules', 'Modern extraction rules must be linked');
  const permissions = manifest['uses-permission'] ?? [];
  for (const name of blocked) {
    const matches = permissions.filter(p => p.$['android:name'] === `android.permission.${name}`);
    equal(matches.length, 1, `${name} must have one explicit manifest merger removal`);
    equal(matches[0].$['tools:node'], 'remove', `${name} must not survive library manifest merging`);
  }
  equal(permissions.find(p => p.$['android:name'] === 'android.permission.CAMERA').$['tools:ignore'],
    'PermissionImpliesUnsupportedChromeOsHardware', 'Only the camera-removal lint false positive may be annotated');
  equal(permissions.filter(p => p.$['tools:ignore'] !== undefined).map(p => p.$),
    [{'android:name':'android.permission.CAMERA', 'tools:node':'remove',
      'tools:ignore':'PermissionImpliesUnsupportedChromeOsHardware'}],
    'The annotation must never apply to a granted permission or another removal marker');
  equal(manifest.$['tools:ignore'], undefined, 'Manifest-wide lint suppression is forbidden');
  equal(app['tools:ignore'], undefined, 'Application-wide lint suppression is forbidden');
  const annotations = value => value && typeof value === 'object' ? [
    ...(value.$?.['tools:ignore'] !== undefined ? [value.$] : []),
    ...Object.values(value).flatMap(annotations),
  ] : [];
  equal(annotations(manifest), [{'android:name':'android.permission.CAMERA', 'tools:node':'remove',
    'tools:ignore':'PermissionImpliesUnsupportedChromeOsHardware'}],
    'No other manifest XML element may inherit or introduce lint suppression');
  equal(permissions.filter(p => p.$['tools:node'] !== 'remove').map(p => p.$['android:name']).sort(),
    ['android.permission.INTERNET', 'android.permission.VIBRATE'], 'Main permissions must remain bounded');
  const legacyText = read(dir, 'android/app/src/main/res/xml/movefield_backup_rules.xml');
  const extractionText = read(dir, 'android/app/src/main/res/xml/movefield_data_extraction_rules.xml');
  const legacy = (await parseStringPromise(legacyText))['full-backup-content'];
  const extraction = (await parseStringPromise(extractionText))['data-extraction-rules'];
  const excluded = value => {
    equal(value.include, undefined, 'A deny policy must not introduce includes');
    equal(value.exclude.map(e => e.$).sort((a,b) => a.domain.localeCompare(b.domain)),
      domains.map(domain => ({domain, path: '.'})).sort((a,b) => a.domain.localeCompare(b.domain)),
      'Exclude every credential-protected, device-protected, and external domain');
  };
  excluded(legacy);
  equal(extraction['cloud-backup'].length, 1, 'Cloud backup must have explicit policy');
  equal(extraction['device-transfer'].length, 1, 'Device transfer must have explicit policy');
  excluded(extraction['cloud-backup'][0]); excluded(extraction['device-transfer'][0]);
  // Cross-platform transfer requires a real Apple team identity. Never invent it.
  equal(extraction['cross-platform-transfer'], undefined, 'Cross-platform OS transfer must remain unconfigured');
  const gradle = read(dir, 'android/gradle.properties');
  for (const [key,value] of [['minSdkVersion','24'], ['compileSdkVersion','36'], ['targetSdkVersion','36']]) {
    equal(gradle.split('\n').filter(line => line.startsWith(`android.${key}=`)),
      [`android.${key}=${value}`], 'Pin installed Expo/RN Android requirements without duplicate properties');
  }
  for (const key of ['expo.devlauncher.configureInRelease','expo.devmenu.configureInRelease']) {
    equal(gradle.split('\n').filter(line => line.startsWith(`${key}=`)), [`${key}=false`],
      'Development bundle loader/menu must remain disabled in Android release');
  }
  const debug = (await parseStringPromise(read(dir, 'android/app/src/debug/AndroidManifest.xml'))).manifest;
  equal(debug.application[0].$['android:usesCleartextTraffic'], 'true', 'Debug Metro exception must remain a debug overlay');
  const info = plist.parse(read(dir, 'ios/Movefield/Info.plist'));
  equal(info.NSAppTransportSecurity.NSAllowsArbitraryLoads, false, 'iOS must retain ATS for internet destinations');
  equal(info.CFBundleIdentifier, '$(PRODUCT_BUNDLE_IDENTIFIER)', 'iOS must use the target bundle identity');
  equal(info.NSFaceIDUsageDescription, undefined, 'Do not advertise biometric collection without an implemented biometric feature');
  equal(info.UIFileSharingEnabled === true, false, 'App Documents must not be exposed through file sharing');
  equal(info.LSSupportsOpeningDocumentsInPlace === true, false, 'Imports must remain reviewed app-private copies');
  equal(info.ITSAppUsesNonExemptEncryption, undefined, 'Custom encryption requires a real compliance determination');
  equal(json('app.json').expo.ios.bundleIdentifier, 'com.ghinz32.movefield', 'iOS identity must be explicit in source');
  const privacyText = read(dir, 'ios/Movefield/PrivacyInfo.xcprivacy');
  const privacy = plist.parse(privacyText);
  equal(privacy.NSPrivacyTracking, false, 'No tracking is implemented');
  equal(privacy.NSPrivacyTrackingDomains, [], 'No tracking domains are configured');
  equal(privacy.NSPrivacyCollectedDataTypes, [], 'This revision has no developer-operated collection endpoint');
  equal(Object.fromEntries(privacy.NSPrivacyAccessedAPITypes.map(p => [p.NSPrivacyAccessedAPIType,p.NSPrivacyAccessedAPITypeReasons])),
    expectedReasons, 'Declare scoped file/picker, preflight disk, local preferences and RN timing reasons');
  const podProps = JSON.parse(read(dir, 'ios/Podfile.properties.json'));
  equal(podProps['ios.deploymentTarget'], '16.4', 'Pin installed Expo iOS deployment floor');
  const xcode = read(dir, 'ios/Movefield.xcodeproj/project.pbxproj');
  const targets = [...xcode.matchAll(/IPHONEOS_DEPLOYMENT_TARGET = ([^;]+);/g)].map(match => match[1]);
  equal(targets.length > 0 && targets.every(value => value === '16.4'), true, 'Every generated Xcode build configuration must match the iOS floor');
  equal([...xcode.matchAll(/PRODUCT_BUNDLE_IDENTIFIER = "([^"]+)";/g)].map(match => match[1]),
    ['com.ghinz32.movefield', 'com.ghinz32.movefield'], 'Debug/release target identity must match source');
  equal(xcode.includes('[Expo Dev Launcher] Strip Local Network Keys for Release'), true,
    'Installed Dev Launcher must retain its production local-network permission stripping phase');
  return {manifest: hash(manifestText), legacyBackup: hash(legacyText), extraction: hash(extractionText), privacy: hash(privacyText)};
}

async function main() {
  const config = json('app.json').expo;
  equal(config.android.allowBackup, false, 'Source backup policy must be explicit');
  const secure = config.plugins.find(p => Array.isArray(p) && p[0] === 'expo-secure-store');
  equal(secure?.[1], {configureAndroidBackup: false, faceIDPermission: false}, 'Custom backup policy owns rules; no biometric permission requested');
  const eas = json('eas.json');
  for (const profile of ['development','preview','production']) {
    equal(eas.build[profile].android.image, 'ubuntu-26.04-jdk-17-ndk-r27b-sdk-57', 'Use a named supported SDK57 Android image');
    equal(eas.build[profile].ios.image, 'macos-tahoe-26.5-xcode-26.6', 'Use a named supported SDK57 iOS image');
  }
  for (const name of ['expo-dev-launcher','expo-dev-menu']) {
    equal(JSON.parse(read(mobile, `node_modules/${name}/expo-module.config.json`)).apple.debugOnly, true,
      'Installed Apple developer modules must only register in DEBUG builds');
    const build = read(mobile, `node_modules/${name}/android/build.gradle`);
    equal(build.includes('src/disableInRelease/java'), true,
      'Installed Android developer modules must retain their disabled release source set');
  }
  const autolinking = read(mobile, 'node_modules/expo-modules-autolinking/src/platforms/apple/apple.ts');
  equal(autolinking.includes('#if EXPO_CONFIGURATION_DEBUG'), true, 'Apple autolinker must emit compile guards for debug-only registration');
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--native-dir')) throw Error('Usage: node scripts/check-native-security-config.cjs [--native-dir /absolute/prebuilt/mobile]');
  if (args.length) {
    const files = await inspect(path.resolve(args[1]));
    console.log(JSON.stringify({ok:true, checks, kind:'generated-native-config', nativeCompilation:false, files}));
    return;
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'movefield-native-security-'));
  try {
    for (const name of ['app.json','package.json','package-lock.json','plugins','index.ts','App.tsx']) {
      fs.cpSync(path.join(mobile, name), path.join(dir, name), {recursive:true});
    }
    fs.mkdirSync(path.join(dir, 'assets'));
    for (const name of fs.readdirSync(path.join(mobile, 'assets')).filter(name => name.endsWith('.png'))) {
      fs.copyFileSync(path.join(mobile, 'assets', name), path.join(dir, 'assets', name));
    }
    fs.symlinkSync(path.join(mobile, 'node_modules'), path.join(dir, 'node_modules'), 'junction');
    const prebuild = () => execFileSync(process.execPath, [path.join(mobile, 'node_modules/expo/bin/cli'),
      'prebuild', '--no-install', '--platform', 'all'], {cwd:dir,
      env:{...process.env, CI:'1', EXPO_NO_TELEMETRY:'1'}, stdio:'pipe', timeout:120000});
    prebuild();
    const files = await inspect(dir);
    prebuild();
    equal(await inspect(dir), files, 'Repeated real Expo prebuild must leave security outputs unchanged');
    console.log(JSON.stringify({ok:true, checks, kind:'isolated-expo-prebuild', nativeCompilation:false,
      storeAcceptance:false, physicalDevices:false, files}));
  } finally { fs.rmSync(dir, {recursive:true, force:true}); }
}
main().catch(error => {console.error(error.stack ?? error); process.exitCode = 1;});
