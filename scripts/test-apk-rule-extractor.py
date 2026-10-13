"""Real ZIP fixtures and a recording fake SDK decoder; not actual APK evidence."""
import importlib.util
import subprocess
import tempfile
from pathlib import Path
import unittest
import zipfile

spec=importlib.util.spec_from_file_location('extractor',Path(__file__).with_name('extract-apk-rules.py'))
e=importlib.util.module_from_spec(spec);spec.loader.exec_module(e)
spec=importlib.util.spec_from_file_location('fixtures',Path(__file__).with_name('test-native-artifact-inspector.py'))
f=importlib.util.module_from_spec(spec);spec.loader.exec_module(f)

class ExtractionTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
        self.apk=self.root/'compiled.apk';self.manifest=self.root/'manifest.xml';self.resources=self.root/'resources.txt'
        self.manifest.write_text(f.MANIFEST)
        self.resources.write_text(f.RESOURCES.replace('res/xml/movefield_backup_rules.xml','res/aB.xml').replace('res/xml/movefield_data_extraction_rules.xml','res/z_9.xml'))
        self.out=self.root/'out';self.calls=[];self.write_zip()
    def tearDown(self):self.temp.cleanup()
    def write_zip(self,missing=False,oversize=False):
        with zipfile.ZipFile(self.apk,'w') as z:
            z.writestr('res/aB.xml',b'x'*65537 if oversize else b'binary-backup')
            if not missing:z.writestr('res/z_9.xml',b'binary-extraction')
    def decode(self,args,**kwargs):
        self.calls.append((args,kwargs))
        self.assertEqual(args[:4],['/sdk/apkanalyzer','resources','xml','--file'])
        self.assertEqual(args[-1],str(self.apk));self.assertTrue(kwargs['check']);self.assertEqual(kwargs['timeout'],60)
        self.assertNotIn('shell',kwargs)
        return subprocess.CompletedProcess(args,0,stdout=(f.BACKUP if args[4]=='/res/aB.xml' else f.EXTRACTION).encode())
    def extract(self,run=None):return e.extract(self.apk,self.manifest,self.resources,Path('/sdk/apkanalyzer'),self.out,run or self.decode)
    def test_actual_paths_and_receipt(self):
        result=self.extract();self.assertEqual([c[0][4] for c in self.calls],['/res/aB.xml','/res/z_9.xml'])
        self.assertEqual(result['apkSHA256'],e.inspector.sha(self.apk));self.assertTrue((self.out/'rule-paths.json').exists())
        self.assertTrue(e.inspector.android(self.manifest,self.out/'backup.xml',self.out/'extraction.xml',self.resources)['backupRulesLinked'])
    def test_stale_receipt_cleared_on_failure(self):
        self.out.mkdir();(self.out/'rule-paths.json').write_text('stale success')
        self.manifest.write_text(f.MANIFEST.replace('0x7f130001','0x7f130000'))
        with self.assertRaises(ValueError):self.extract()
        self.assertFalse((self.out/'rule-paths.json').exists())

    def test_wrong_manifest_id_before_decoder(self):
        self.manifest.write_text(f.MANIFEST.replace('0x7f130001','0x7f130000'))
        with self.assertRaises(ValueError):self.extract()
        self.assertEqual(self.calls,[])
    def test_missing_entry(self):
        self.write_zip(missing=True)
        with self.assertRaisesRegex(ValueError,'Missing/duplicate'):self.extract()
        self.assertFalse((self.out/'rule-paths.json').exists())
    def test_oversized_entry_before_decoder(self):
        self.write_zip(oversize=True)
        with self.assertRaisesRegex(ValueError,'Unbounded binary'):self.extract()
        self.assertEqual(self.calls,[])
    def test_decoder_failure_no_receipt(self):
        def fail(*args,**kwargs):raise subprocess.CalledProcessError(1,args[0])
        with self.assertRaises(subprocess.CalledProcessError):self.extract(fail)
        self.assertFalse((self.out/'rule-paths.json').exists())
    def test_poisoned_decoded_rules(self):
        def poisoned(args,**kwargs):return subprocess.CompletedProcess(args,0,stdout=b'<full-backup-content><include domain="root" path="."/></full-backup-content>')
        with self.assertRaisesRegex(ValueError,'exclusions only'):self.extract(poisoned)
        self.assertFalse((self.out/'rule-paths.json').exists())
    def test_oversized_decoded_xml(self):
        def large(args,**kwargs):return subprocess.CompletedProcess(args,0,stdout=b'x'*65537)
        with self.assertRaisesRegex(ValueError,'Unbounded decoded'):self.extract(large)
    def test_alias_refused_before_decoder(self):
        self.resources.write_text(self.resources.read_text().replace('() (file) res/aB.xml type=XML','() @xml/unrelated'))
        with self.assertRaisesRegex(ValueError,'one default'):self.extract()
        self.assertEqual(self.calls,[])

if __name__=='__main__':unittest.main()
