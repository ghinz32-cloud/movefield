"""Regression against actual CI metadata plus rejected component/permission changes."""
import importlib.util
import json
from pathlib import Path
import tempfile
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('native_inspector',ROOT/'scripts/inspect-native-artifacts.py')
inspector=importlib.util.module_from_spec(spec);spec.loader.exec_module(inspector)
fixture=ROOT/'scripts/fixtures/native-preview-metadata'
ns='{http://schemas.android.com/apk/res/android}'
original=ET.parse(fixture/'manifest.xml')
# This golden compilation belongs to Movefield regardless of the CI flavor.
# The separate actual-APK inspector still uses NATIVE_EXPECTED_PACKAGE.
assert original.getroot().get('package')=='com.ghinz32.movefield'
inspector.PACKAGE='com.ghinz32.movefield'
with tempfile.TemporaryDirectory() as directory:
 path=Path(directory)/'manifest.xml'
 def inspect(tree):
  tree.write(path,encoding='utf-8');return inspector.android(path,fixture/'backup.xml',fixture/'extraction.xml',fixture/'resources.txt')
 try:inspect(original)
 except ValueError as error:assert 'ACCESS_WIFI_STATE' in str(error)
 else:raise AssertionError('Original compiled APK must fail for unused Wi-Fi permission')
 fixed=ET.parse(fixture/'manifest.xml')
 for node in list(fixed.getroot()):
  if node.get(ns+'name')=='android.permission.ACCESS_WIFI_STATE':fixed.getroot().remove(node)
 assert inspect(fixed)['internalBrowserProxyChecked']
 failures=0
 for change in ('exported','disabled','filter','launch','affinity','duplicate','unknown','wifi'):
  tree=ET.ElementTree(ET.fromstring(ET.tostring(fixed.getroot())))
  app=tree.getroot().find('application');proxy=next(node for node in app if node.get(ns+'name')==inspector.WEB_BROWSER_PROXY)
  if change=='exported':proxy.set(ns+'exported','true')
  elif change=='disabled':proxy.set(ns+'enabled','false')
  elif change=='filter':ET.SubElement(proxy,'intent-filter')
  elif change=='launch':proxy.set(ns+'launchMode','2')
  elif change=='affinity':proxy.set(ns+'taskAffinity','unreviewed.external.task')
  elif change=='duplicate':app.append(ET.fromstring(ET.tostring(proxy)))
  elif change=='unknown':ET.SubElement(app,'activity',{ns+'name':'unreviewed.Activity',ns+'exported':'false'})
  else:ET.SubElement(tree.getroot(),'uses-permission',{ns+'name':'android.permission.ACCESS_WIFI_STATE'})
  try:inspect(tree)
  except ValueError:failures+=1
  else:raise AssertionError('Inspector accepted '+change)
 assert failures==8
print('PASS compiled-metadata inspection: internal Expo browser task accepted; unused Wi-Fi permission and eight component/permission regressions rejected. New compiled APK inspection remains separate.')
