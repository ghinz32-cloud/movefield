"""Export current git-listed source to an ignored, manifest-verified handoff ZIP.

Runtime state, credentials, dependencies, native projects and Git history are
excluded. The required hosting file is replaced in the archive by neutral null
bindings; the owner's existing file is never read or changed.
"""
import hashlib,json,pathlib,subprocess,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUTPUT=ROOT/'.sites-runtime/movefield-continuation-source.zip'
names=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=ROOT).decode().split('\0')
excluded={'.git','.openai','.sites-runtime','.agents','.codex','.aws','node_modules','.expo','dist','dist-mobile','dist-web','.wrangler','coverage'}
records=[]
OUTPUT.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(OUTPUT,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
 def add(name,data):
  info=zipfile.ZipInfo('movefield/'+name,date_time=(2026,10,12,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o644<<16
  archive.writestr(info,data);records.append({'path':name,'sha256':hashlib.sha256(data).hexdigest()})
 for name in sorted(set(names)):
  relative=pathlib.PurePosixPath(name)
  if not name or any(part in excluded or part.startswith(('.env','.dev.vars')) for part in relative.parts):continue
  if name.startswith(('mobile/android/','mobile/ios/')) or name.endswith(('.tsbuildinfo','.local.jsonc','.pem','.key','.p12','.jks','.keystore')):continue
  path=ROOT/name
  if not path.is_file() or path.is_symlink():continue
  add(name,path.read_bytes())
 add('.openai/hosting.json',b'{"d1":null,"r2":null}\n')
 manifest=json.dumps({'scope':'Current source only; no owner runtime credentials/private training/Git history/native binaries. Neutral hosting bindings supplied. No full six-prompt or release qualification claim.','files':records},indent=2)+'\n'
 info=zipfile.ZipInfo('movefield/SOURCE_MANIFEST.json',date_time=(2026,10,12,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;archive.writestr(info,manifest)
with zipfile.ZipFile(OUTPUT) as archive:
 for item in records:
  assert hashlib.sha256(archive.read('movefield/'+item['path'])).hexdigest()==item['sha256'],item['path']
receipt={'path':str(OUTPUT),'files':len(records),'bytes':OUTPUT.stat().st_size,'sha256':hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),'scope':'Manifest verification of source-only ZIP; a finite credential scan of the current application is separately recorded and is not an absence-of-secrets guarantee.'}
(ROOT/'.sites-runtime/source-checkpoint-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt))
