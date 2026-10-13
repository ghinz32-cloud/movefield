"""Run the actual Pages preparer against isolated, synthetic Git repositories."""
import hashlib,json,pathlib,subprocess,tempfile
SCRIPT=pathlib.Path(__file__).with_name('prepare-shared-fitness-pages.py').read_bytes()
checks=[]
def digest(data):return hashlib.sha256(data).hexdigest()
with tempfile.TemporaryDirectory(prefix='grizzly-preview-ownership-') as directory:
 root=pathlib.Path(directory);(root/'scripts').mkdir();(root/'scripts/prepare-shared-fitness-pages.py').write_bytes(SCRIPT)
 runtime=root/'.sites-runtime';runtime.mkdir();(runtime/'candidate-receipt-current.json').write_text(json.dumps({'application_source_sha256':'a'*64}))
 (root/'index.html').write_text('Synthetic original app');(root/'pages-manifest.json').write_text(json.dumps({'assets':{'/movefield/index.html':digest((root/'index.html').read_bytes())}}))
 def git(*args):return subprocess.check_output(['git','-c','user.name=Synthetic test','-c','user.email=synthetic@example.invalid',*args],cwd=root,text=True).strip()
 def commit():git('add','scripts','index.html','pages-manifest.json','review','grizzly');git('commit','-qm','Synthetic owned artifact fixture');return git('rev-parse','HEAD')
 for folder in ['review','grizzly']:
  old=root/folder;old.mkdir();(old/'index.html').write_text('Synthetic old '+folder)
  manifest={'schema':1,'base':'/movefield/'+folder+'/','files':{'index.html':digest((old/'index.html').read_bytes())}}
  (old/(folder+'-manifest.json')).write_text(json.dumps(manifest))
  new=runtime/('github-pages-'+folder);new.mkdir();(new/'index.html').write_text('Synthetic new '+folder)
  (new/'brand').mkdir();(new/'brand/grizzly-fitness-logo.jpg').write_bytes(b'Synthetic asset bytes, never rendered')
 legacy='assets/earlier-A1234567.js';(root/'grizzly/assets').mkdir();(root/'grizzly'/legacy).write_text('Synthetic earlier compiled chunk')
 git('init','-q');base=commit()
 def prepare(ref):return subprocess.run(['python3','scripts/prepare-shared-fitness-pages.py','--base-commit',ref],cwd=root,capture_output=True,text=True)
 result=prepare(base);assert result.returncode==0,result.stderr
 candidate=runtime/'fitness-pages-candidate';m=json.loads((candidate/'grizzly/grizzly-manifest.json').read_text())
 assert m['retained_legacy_files']==[legacy];assert (candidate/'grizzly'/legacy).read_bytes()==(root/'grizzly'/legacy).read_bytes();assert (candidate/'index.html').read_bytes()==(root/'index.html').read_bytes()
 checks.append('Unmanifested hashed compiled asset is retained exactly; original-root bytes stay unchanged')
 # Turn the accepted candidate into the next synthetic Pages base.
 import shutil
 for folder in ['review','grizzly']:shutil.rmtree(root/folder);shutil.copytree(candidate/folder,root/folder)
 next_base=commit();result=prepare(next_base);assert result.returncode==0,result.stderr
 assert (candidate/'grizzly'/legacy).read_bytes()==(root/'grizzly'/legacy).read_bytes();checks.append('A manifested retained asset also survives the next publication')
 (root/'grizzly/unclaimed.json').write_text('{"synthetic":"unclaimed"}');bad=commit();result=prepare(bad);assert result.returncode!=0 and 'Unexpected noncompiled' in result.stderr;checks.append('Unexpected noncompiled paths still fail closed')
 (root/'grizzly/unclaimed.json').unlink();git('add','-u');git('commit','-qm','Remove synthetic unclaimed path')
 (root/'grizzly/index.html').write_text('Synthetic tampering');bad=commit();result=prepare(bad);assert result.returncode!=0 and 'Owned artifact differs' in result.stderr;checks.append('Changed bytes in an owned manifest still fail closed')
 (root/'grizzly/index.html').unlink();bad=commit();result=prepare(bad);assert result.returncode!=0 and 'Missing files' in result.stderr;checks.append('Missing owned paths still fail closed')
print('PASS: '+str(len(checks))+' actual preview-ownership scenarios')
for item in checks:print('PASS: '+item)
