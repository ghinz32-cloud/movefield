"""Run the actual Pages preparer against isolated, synthetic Git repositories."""
import hashlib,json,pathlib,subprocess,tempfile
SCRIPT=pathlib.Path(__file__).with_name('prepare-shared-fitness-pages.py').read_bytes()
HELPER=pathlib.Path(__file__).with_name('materialize_pages_apk.py').read_bytes()
checks=[]
def digest(data):return hashlib.sha256(data).hexdigest()
with tempfile.TemporaryDirectory(prefix='grizzly-preview-ownership-') as directory:
 root=pathlib.Path(directory);(root/'scripts').mkdir();(root/'scripts/prepare-shared-fitness-pages.py').write_bytes(SCRIPT)
 (root/'scripts/materialize_pages_apk.py').write_bytes(HELPER)
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
 owned='assets/current-B1234567.js';(root/'grizzly'/owned).write_text('Synthetic current compiled chunk')
 m=json.loads((root/'grizzly/grizzly-manifest.json').read_text());m['files'][owned]=digest((root/'grizzly'/owned).read_bytes());(root/'grizzly/grizzly-manifest.json').write_text(json.dumps(m))
 git('init','-q');base=commit()
 def prepare(ref):return subprocess.run(['python3','scripts/prepare-shared-fitness-pages.py','--base-commit',ref],cwd=root,capture_output=True,text=True)
 result=prepare(base);assert result.returncode==0,result.stderr
 candidate=runtime/'fitness-pages-candidate';m=json.loads((candidate/'grizzly/grizzly-manifest.json').read_text())
 assert m['retained_legacy_files']==sorted([legacy,owned]);assert (candidate/'grizzly'/owned).read_bytes()==(root/'grizzly'/owned).read_bytes();assert (candidate/'grizzly'/legacy).read_bytes()==(root/'grizzly'/legacy).read_bytes();assert (candidate/'index.html').read_bytes()==(root/'index.html').read_bytes()
 checks.append('Previously current and unmanifested hashed chunks survive exactly for open windows; original-root bytes stay unchanged')
 # Turn the accepted candidate into the next synthetic Pages base.
 import shutil
 for folder in ['review','grizzly']:shutil.rmtree(root/folder);shutil.copytree(candidate/folder,root/folder)
 next_base=commit();result=prepare(next_base);assert result.returncode==0,result.stderr
 assert (candidate/'grizzly'/legacy).read_bytes()==(root/'grizzly'/legacy).read_bytes();checks.append('A manifested retained asset also survives the next publication')
 # Small synthetic distributions exercise the real preparer, not a native build.
 source='d'*40
 payloads={app:[('Synthetic '+app+' part '+str(n)).encode() for n in range(2)] for app in ['movefield','grizzly']}
 distribution={'format':'fitness-android-downloads-v1','sourceCommit':source,'sourceTree':'e'*40,'signingCertificateSHA256':'f'*64,'apps':[]}
 for app,package,version in [('movefield','com.ghinz32.movefield','0.1.6'),('grizzly','com.ghinz32.grizzlyfitness.prototype','0.1.5')]:
  raw=b''.join(payloads[app]);distribution['apps'].append({'app':app,'package':package,'architecture':'arm64-v8a','versionName':version,'versionCode':7,'filename':app+'-arm64-current-test.apk','sourceCommit':source,'bytes':len(raw),'sha256':digest(raw),'parts':[{'file':f'native/{app}/part-{n}.bin','bytes':len(part),'sha256':digest(part)} for n,part in enumerate(payloads[app])]})
 def reset_downloads():
  for folder in ['review','grizzly']:
   downloads=runtime/('github-pages-'+folder)/'downloads'
   if downloads.exists():shutil.rmtree(downloads)
   downloads.mkdir();(downloads/'android.html').write_text('Synthetic Android download page')
   (downloads/'android-installers.json').write_text(json.dumps(distribution))
   for app,parts in payloads.items():
    (downloads/'native'/app).mkdir(parents=True)
    for n,part in enumerate(parts):(downloads/f'native/{app}/part-{n}.bin').write_bytes(part)
 def mutate_manifest(fn):
  path=runtime/'github-pages-review/downloads/android-installers.json';value=json.loads(path.read_text());fn(value);path.write_text(json.dumps(value))
 def rejects(name,change,reason):
  reset_downloads();change();failure=prepare(next_base);assert failure.returncode!=0 and reason in failure.stderr,(name,failure.stderr)
  assert (candidate/'index.html').read_bytes()==(root/'index.html').read_bytes()
  assert not list((runtime/'github-pages-review').rglob('*.apk')) or name=='Full APK in static input is rejected'
  checks.append(name)
 reset_downloads();result=prepare(next_base);assert result.returncode==0,result.stderr
 for folder,app,filename in [('review','movefield','movefield-0.1.6-arm64.apk'),('grizzly','grizzly','grizzly-fitness-0.1.5-arm64.apk')]:
  manifest=json.loads((candidate/folder/(folder+'-manifest.json')).read_text());path='downloads/'+filename
  assert (candidate/folder/path).read_bytes()==b''.join(payloads[app]);assert manifest['files'][path]==digest(b''.join(payloads[app]))
  assert manifest['android_download']['source_commit']==source and manifest['android_download']['file']==path
  assert len(list((candidate/folder).rglob('*.apk')))==1
  assert not list((runtime/('github-pages-'+folder)).rglob('*.apk'))
 assert (candidate/'index.html').read_bytes()==(root/'index.html').read_bytes()
 checks.append('Both exact APKs assemble only into their owned Pages folder and ownership manifest; static input and original root stay unchanged')
 for folder in ['review','grizzly']:shutil.rmtree(root/folder);shutil.copytree(candidate/folder,root/folder)
 next_base=commit();result=prepare(next_base);assert result.returncode==0,result.stderr
 assert len(list(candidate.rglob('*.apk')))==2
 checks.append('A subsequent publication verifies and replaces its already-owned APKs without accumulating files')
 download=runtime/'github-pages-review/downloads'
 rejects('Download page without manifest fails closed',lambda:(download/'android-installers.json').unlink(),'missing download file')
 rejects('Unexpected manifest format fails closed',lambda:mutate_manifest(lambda m:m.update(format='unreviewed-v2')),'unexpected manifest format')
 rejects('Missing APK part fails closed',lambda:(download/'native/movefield/part-1.bin').unlink(),'missing download file')
 rejects('Corrupted part bytes fail their SHA256',lambda:(download/'native/movefield/part-0.bin').write_bytes(b'X'*len(payloads['movefield'][0])),'part SHA256')
 rejects('A mislabeled complete SHA256 cannot publish a file',lambda:mutate_manifest(lambda m:m['apps'][0].update(sha256='0'*64)),'complete APK SHA256')
 rejects('A truncated part cannot publish a file',lambda:(download/'native/movefield/part-0.bin').write_bytes(b'x'),'part size mismatch')
 rejects('Source commit mismatch fails identity validation',lambda:mutate_manifest(lambda m:m['apps'][0].update(sourceCommit='0'*40)),'source commit identity')
 rejects('App filename mismatch fails identity validation',lambda:mutate_manifest(lambda m:m['apps'][0].update(filename='grizzly-arm64-current-test.apk')),'filename identity')
 rejects('A misidentified package fails validation',lambda:mutate_manifest(lambda m:m['apps'][0].update(package='example.other')),'package or architecture')
 rejects('Unsafe version names fail validation',lambda:mutate_manifest(lambda m:m['apps'][0].update(versionName='../outside')),'invalid app version')
 rejects('Oversized APK metadata fails before allocation',lambda:mutate_manifest(lambda m:m['apps'][0].update(bytes=60*1024*1024+1)),'invalid APK size')
 rejects('Oversized part metadata fails before reading',lambda:mutate_manifest(lambda m:m['apps'][0]['parts'][0].update(bytes=10*1024*1024+1)),'invalid part size')
 rejects('Incorrect total part bytes fail before assembly',lambda:mutate_manifest(lambda m:m['apps'][0].update(bytes=m['apps'][0]['bytes']+1)),'part byte total mismatch')
 rejects('Part traversal cannot read or write outside ownership',lambda:mutate_manifest(lambda m:m['apps'][0]['parts'][0].update(file='../../index.html')),'part path or order')
 rejects('Duplicate or reordered parts fail identity validation',lambda:mutate_manifest(lambda m:m['apps'][0]['parts'].reverse()),'part path or order')
 def symlink_part():
  path=download/'native/movefield/part-0.bin';path.unlink();path.symlink_to(root/'index.html')
 rejects('A static-input symlink is rejected before copy',symlink_part,'Static input contains a symlink')
 rejects('Full APK in static input is rejected',lambda:(download/'unexpected.apk').write_bytes(b'Unowned APK'),'Full APKs belong only')
 reset_downloads()
 outside=subprocess.run(['python3','-c',"import sys;sys.path.insert(0,'scripts');from materialize_pages_apk import materialize;materialize('.sites-runtime/fitness-pages-candidate','../outside')"],cwd=root,capture_output=True,text=True)
 assert outside.returncode!=0 and 'outside owned brand directories' in outside.stderr
 assert not (runtime/'outside').exists();checks.append('Assembler refuses a destination outside the two owned brand folders')
 (root/'grizzly/unclaimed.json').write_text('{"synthetic":"unclaimed"}');bad=commit();result=prepare(bad);assert result.returncode!=0 and 'Unexpected noncompiled' in result.stderr;checks.append('Unexpected noncompiled paths still fail closed')
 (root/'grizzly/unclaimed.json').unlink();git('add','-u');git('commit','-qm','Remove synthetic unclaimed path')
 (root/'grizzly/index.html').write_text('Synthetic tampering');bad=commit();result=prepare(bad);assert result.returncode!=0 and 'Owned artifact differs' in result.stderr;checks.append('Changed bytes in an owned manifest still fail closed')
 (root/'grizzly/index.html').unlink();bad=commit();result=prepare(bad);assert result.returncode!=0 and 'Missing files' in result.stderr;checks.append('Missing owned paths still fail closed')
print('PASS: '+str(len(checks))+' actual preview-ownership scenarios')
for item in checks:print('PASS: '+item)
