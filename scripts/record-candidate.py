"""Record the local source/artifact identity and a finite credential-pattern scan.

Run after builds, exports and checks. This receipt is evidence of file identity,
not proof of correctness, deployability, billing eligibility or device behavior.
"""
import datetime,hashlib,json,pathlib,re,subprocess,zipfile,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
RUNTIME=ROOT/'.sites-runtime'
PREVIEWS_ONLY='--previews-only' in sys.argv
paths=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=ROOT).decode().split('\0')
prefixes=('grizzly/','github-pages/','app/','build/','components/','lib/','scripts/','db/','drizzle/','public/','mobile/src/','mobile/scripts/','mobile/assets/','mobile/plugins/','.github/')
configs={'vite.grizzly.config.ts','eslint.config.mjs','.gitignore','components.json','package.json','pnpm-lock.yaml','tsconfig.json','vite.config.ts','cloudflare-env.d.ts','drizzle.config.ts','wrangler.cloud.example.jsonc','wrangler.workers-dev.example.jsonc','wrangler.pages.example.jsonc','vite.github-pages.config.ts'}
def source(path):
    if path.startswith(prefixes):return True
    if path in configs:return True
    return path.startswith('mobile/') and path.count('/')==1 and pathlib.Path(path).suffix in {'.json','.ts','.tsx','.js','.cjs','.mjs'}
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def tree(records):return hashlib.sha256(''.join(path+'\0'+sha+'\n' for path,sha in sorted(records.items())).encode()).hexdigest()
files={p:digest(ROOT/p) for p in sorted(set(paths)) if p and source(p) and (ROOT/p).is_file()}
web={} if PREVIEWS_ONLY else {str(p.relative_to(ROOT)):digest(p) for p in sorted((ROOT/'dist').rglob('*')) if p.is_file()}
artifact_paths=([] if PREVIEWS_ONLY else ['dist/server/index.js','dist/client/movefield-sw.js'])+['public/downloads/movefield-native-current.zip','public/downloads/grizzly-fitness-native-source.zip']
artifacts={p:digest(ROOT/p) for p in artifact_paths if (ROOT/p).is_file()}
review={str(p.relative_to(ROOT)):digest(p) for p in sorted((RUNTIME/'github-pages-review').rglob('*')) if p.is_file()}
web.update(review)
web.update({str(p.relative_to(ROOT)):digest(p) for p in sorted((RUNTIME/'github-pages-grizzly').rglob('*')) if p.is_file()})
# Expo may leave older output files. Bind the receipt to each current metadata
# entry rather than labeling every remaining bundle as a current export.
for name in ['dist-mobile','dist-grizzly']:
    native=ROOT/'mobile'/name
    if not native.exists():continue
    metadata=json.loads((native/'metadata.json').read_text())
    for platform in ['android','ios']:
        p=(native/metadata['fileMetadata'][platform]['bundle']).resolve()
        if not p.is_relative_to(native.resolve()) or p.suffix!='.hbc':raise RuntimeError('Unexpected native export path')
        artifacts[str(p.relative_to(ROOT))]=digest(p)
patterns=[rb'\bgh[pousr]_[A-Za-z0-9]{30,}\b',rb'\bAKIA[A-Z0-9]{16}\b',rb'\bAIza[A-Za-z0-9_-]{30,}\b',rb'\bsk-(?:proj-|live_)[A-Za-z0-9_-]{20,}\b',b'-----BEGIN '+b'(?:RSA |EC |OPENSSH )?'+b'PRIVATE KEY-----']
compiled=[re.compile(p) for p in patterns];scanned=set();matches=[];zip_members=0
for name in sorted(set(files)|set(web)|set(artifacts)):
    scanned.add(name);path=ROOT/name;data=path.read_bytes()
    if any(pattern.search(data) for pattern in compiled):matches.append(name)
    # APK tail fragments may contain ZIP end markers without the full archive.
    # Scan every file above; enumerate members only for complete ZIP/APK files.
    if path.suffix.lower() in {'.zip','.apk'} and zipfile.is_zipfile(path):
        with zipfile.ZipFile(path) as archive:
            for member in archive.infolist():
                if member.is_dir():continue
                zip_members+=1
                if any(pattern.search(archive.read(member)) for pattern in compiled):matches.append(name+':'+member.filename)
RUNTIME.mkdir(exist_ok=True)
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
scan={'ran_at':now,'scope':'Finite recognizable credential patterns in selected source, built artifacts and ZIP members; excludes ignored runtime/cache/configuration and is not an absence-of-secrets guarantee. No matched contents are printed.','files':len(scanned),'zip_members':zip_members,'matches':matches}
(RUNTIME/'secret-scan-current.json').write_text(json.dumps(scan,indent=2)+'\n')
receipt={'ran_at':now,'application_source_sha256':tree(files),'hash_method':'SHA256 of sorted relative path + NUL + content SHA256 + newline; application code/tests/config/static/native assets and ZIP. Documentation outside the ZIP and ignored runtime/credentials excluded.','source_files':files,'artifact_sha256':artifacts,'web_artifact_tree_sha256':tree(web),'not_qualified':['Full six-prompt completion','Live Cloudflare/Google/provider/privacy/$0 budget qualification or deployment','Automatic per-record/background sync, stronger factor enrollment or general AI coaching','Physical native keychain/callback/install/erase/performance qualification','Independent security/crypto, evidence/rights and comprehensive accessibility/update acceptance','Native upstream tooling advisory remediation']}
receipt['web_scope']='Current static Movefield and Grizzly previews only; older production server output excluded.' if PREVIEWS_ONLY else 'Production server/client and static previews when present.'
(RUNTIME/'candidate-receipt-current.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'application_source_sha256':receipt['application_source_sha256'],'source_files':len(files),'web_artifact_tree_sha256':receipt['web_artifact_tree_sha256'],'scan_files':len(scanned),'zip_members':zip_members,'scan_matches':len(matches)}))
if matches:raise SystemExit('Credential-pattern scan found candidate files; inspect locally without printing secret values.')
