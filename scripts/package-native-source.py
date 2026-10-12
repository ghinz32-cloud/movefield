"""Package current native source only; exclude runtime state, credentials and build caches."""
import hashlib,json,pathlib,sys,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
MOBILE=ROOT/'mobile'
EXCLUDED={'node_modules','.expo','.git','.sites-runtime','dist-mobile','dist-web','dist-grizzly','coverage','.wrangler','android','ios','build'}
ALLOWED={'.ts','.tsx','.js','.mjs','.cjs','.json','.md','.txt','.png','.ttf','.jpg','.svg'}
GRIZZLY='--grizzly' in sys.argv
OUTPUT=ROOT/('public/downloads/grizzly-fitness-native-source.zip' if GRIZZLY else 'public/downloads/movefield-native-current.zip')
FILES=[]
for path in sorted(MOBILE.rglob('*')):
    rel=path.relative_to(MOBILE)
    if not path.is_file() or any(part in EXCLUDED for part in rel.parts) or any(part.startswith(('.env','.dev.vars')) for part in rel.parts):continue
    if path.suffix in ALLOWED or rel.as_posix()=='.gitignore':FILES.append(path)
OUTPUT.parent.mkdir(parents=True,exist_ok=True)
records=[]
with zipfile.ZipFile(OUTPUT,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
    for path in FILES:
        data=path.read_bytes();name='mobile/'+path.relative_to(MOBILE).as_posix()
        info=zipfile.ZipInfo(name,date_time=(2026,10,11,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o644<<16
        archive.writestr(info,data)
        records.append({'path':name,'sha256':hashlib.sha256(data).hexdigest()})
    info=zipfile.ZipInfo('SOURCE_MANIFEST.json',date_time=(2026,10,11,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED
    archive.writestr(info,json.dumps({'scope':'Current native source; JS exports are separately qualified; no APK/IPA or installed-device claim.','entry_instructions':'mobile/GRIZZLY.md' if GRIZZLY else 'mobile/START-HERE.md','files':records},indent=2)+'\n')
with zipfile.ZipFile(OUTPUT) as archive:
    for record in records:
        if hashlib.sha256(archive.read(record['path'])).hexdigest()!=record['sha256']:raise RuntimeError('Archive verification failed')
print(json.dumps({'files':len(records),'bytes':OUTPUT.stat().st_size,'sha256':hashlib.sha256(OUTPUT.read_bytes()).hexdigest()}))
