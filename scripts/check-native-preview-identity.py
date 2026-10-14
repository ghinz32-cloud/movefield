"""Check exact manifest/signature outputs from one actual development-signed APK."""
import os
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

root = ET.parse(sys.argv[1]).getroot()
ns = '{http://schemas.android.com/apk/res/android}'
package = os.environ['NATIVE_EXPECTED_PACKAGE']
assert root.get('package') == package, 'Wrong native app identity'
versions = {
    'com.ghinz32.movefield': ('5', '0.1.4'),
    'com.ghinz32.grizzlyfitness.prototype': ('4', '0.1.3'),
}
assert package in versions, 'Unreviewed native identity'
version_code, version_name = versions[package]
assert root.get(ns + 'versionCode') == version_code, 'Unexpected native version code'
assert root.get(ns + 'versionName') == version_name, 'Unexpected native version name'
signature = Path(sys.argv[2]).read_text()
matches = re.findall(r'certificate SHA-256 digest: ([0-9a-fA-F]{64})', signature)
assert [x.lower() for x in matches] == ['fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c'], 'Historical preview signing certificate does not match'
print('PASS exact preview package, version code and historical test certificate')
