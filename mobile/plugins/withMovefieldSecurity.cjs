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
