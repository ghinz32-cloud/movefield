const fs = require('node:fs/promises');
const path = require('node:path');
const {AndroidConfig, withAndroidManifest, withDangerousMod, withGradleProperties,
  withPodfileProperties, withXcodeProject} = require('expo/config-plugins');

// Device-bound encryption keys cannot accompany an OS backup. Manual, reviewed
// password-protected transfers are the supported way to move training records.
// Exclude complete domains, including legacy plaintext and device-protected
// storage, rather than relying only on allowBackup (some OEM D2D ignores it).
const DOMAINS = ['root', 'file', 'database', 'sharedpref', 'external',
  'device_root', 'device_file', 'device_database', 'device_sharedpref'];
// The actual NATIVE3 lint report treats these eight intentional removal markers
// as class registrations. Suppress only that source-node diagnostic. The ninth
// removal (ExpoFirebaseMessagingService) had no error and stays unannotated.
const MISSING_CLASS_REMOVALS = new Set([
  'com.google.firebase.messaging.FirebaseMessagingService',
  'com.google.firebase.components.ComponentDiscoveryService',
  'com.google.android.datatransport.runtime.backends.TransportBackendDiscovery',
  'com.google.android.datatransport.runtime.scheduling.jobscheduling.JobInfoSchedulerService',
  'com.google.firebase.iid.FirebaseInstanceIdReceiver',
  'com.google.android.datatransport.runtime.scheduling.jobscheduling.AlarmManagerSchedulerBroadcastReceiver',
  'com.google.android.gms.common.api.GoogleApiActivity',
  'com.google.firebase.provider.FirebaseInitProvider',
]);
const exclusions = (indent) => DOMAINS.map(domain => `${indent}<exclude domain="${domain}" path="."/>`).join('\n');
const legacyRules = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
${exclusions('  ')}
</full-backup-content>
`;
const extractionRules = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
  <cloud-backup>
${exclusions('    ')}
  </cloud-backup>
  <device-transfer>
${exclusions('    ')}
  </device-transfer>
</data-extraction-rules>
`;

module.exports = function withMovefieldSecurity(config) {
  config = withAndroidManifest(config, mod => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
    app.$['android:allowBackup'] = 'false';
    app.$['android:fullBackupContent'] = '@xml/movefield_backup_rules';
    app.$['android:dataExtractionRules'] = '@xml/movefield_data_extraction_rules';
    // The development template's debug overlay deliberately overrides this for
    // local Metro. Release builds must retain the main manifest's denial.
    app.$['android:usesCleartextTraffic'] = 'false';
    // This app schedules local alerts only. Do not auto-start optional remote
    // messaging/installation services bundled transitively by the SDK.
    for (const [tag, names] of Object.entries({
      service: ['expo.modules.notifications.service.ExpoFirebaseMessagingService',
        'com.google.firebase.messaging.FirebaseMessagingService',
        'com.google.firebase.components.ComponentDiscoveryService',
        'com.google.android.datatransport.runtime.backends.TransportBackendDiscovery',
        'com.google.android.datatransport.runtime.scheduling.jobscheduling.JobInfoSchedulerService'],
      receiver: ['com.google.firebase.iid.FirebaseInstanceIdReceiver',
        'com.google.android.datatransport.runtime.scheduling.jobscheduling.AlarmManagerSchedulerBroadcastReceiver'],
      activity: ['com.google.android.gms.common.api.GoogleApiActivity'],
      provider: ['com.google.firebase.provider.FirebaseInitProvider'],
    })) {
      app[tag] ??= [];
      for (const name of names) {
        app[tag] = app[tag].filter(node => node.$['android:name'] !== name);
        const marker = {'android:name': name, 'tools:node': 'remove'};
        if (MISSING_CLASS_REMOVALS.has(name)) marker['tools:ignore'] = 'MissingClass';
        app[tag].push({$: marker});
      }
    }
    for (const name of ['firebase_messaging_auto_init_enabled', 'firebase_analytics_collection_enabled']) {
      AndroidConfig.Manifest.addMetaDataItemToMainApplication(app, name, 'false');
    }

    // Lint reads this merger-removal marker as a camera request. Annotate only
    // that source-node diagnostic; CAMERA must still be absent from the APK.
    for (const permission of mod.modResults.manifest['uses-permission'] ?? []) {
      if (permission.$['android:name'] === 'android.permission.CAMERA'
        && permission.$['tools:node'] === 'remove') {
        permission.$['tools:ignore'] = 'PermissionImpliesUnsupportedChromeOsHardware';
      }
    }
    return mod;
  });
  config = withDangerousMod(config, ['android', async mod => {
    const dir = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res/xml');
    await fs.mkdir(dir, {recursive: true});
    await fs.writeFile(path.join(dir, 'movefield_backup_rules.xml'), legacyRules);
    await fs.writeFile(path.join(dir, 'movefield_data_extraction_rules.xml'), extractionRules);
    return mod;
  }]);
  // These are the installed Expo 57 / React Native 0.86 floors, not runtime
  // qualification. Keep them explicit when template defaults change.
  config = withGradleProperties(config, mod => {
    for (const [key, value] of Object.entries({'android.minSdkVersion': '24',
      'android.compileSdkVersion': '36', 'android.targetSdkVersion': '36',
      'expo.devlauncher.configureInRelease': 'false', 'expo.devmenu.configureInRelease': 'false'})) {
      mod.modResults = mod.modResults.filter(item => item.type !== 'property' || item.key !== key);
      mod.modResults.push({type: 'property', key, value});
    }
    return mod;
  });
  config = withPodfileProperties(config, mod => {
    mod.modResults['ios.deploymentTarget'] = '16.4';
    return mod;
  });
  config = withXcodeProject(config, mod => {
    for (const entry of Object.values(mod.modResults.pbxXCBuildConfigurationSection())) {
      if (entry && typeof entry === 'object' && entry.buildSettings?.IPHONEOS_DEPLOYMENT_TARGET) {
        entry.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = '16.4';
      }
    }
    return mod;
  });
  return config;
};
