"""Create a reviewed Pages commit with a separate temporary index; do not push."""
import hashlib,json,os,pathlib,subprocess,tempfile
ROOT=pathlib.Path(__file__).resolve().parents[1];RUNTIME=ROOT/'.sites-runtime'
receipt=json.loads((RUNTIME/'github-pages-candidate-receipt.json').read_text());candidate=RUNTIME/'github-pages-candidate'
for name,expected in receipt['candidate_files'].items():
 path=candidate/name
 if path.is_symlink() or hashlib.sha256(path.read_bytes()).hexdigest()!=expected:raise RuntimeError('The reviewed candidate changed: '+name)
fd,index=tempfile.mkstemp(prefix='pages-index-',dir=RUNTIME);os.close(fd);os.unlink(index)
task_env={**os.environ,'GIT_INDEX_FILE':index}
def git(args,env=None,input=None):return subprocess.check_output(['git',*args],cwd=ROOT,env=env,input=input).decode().strip()
try:
 git(['read-tree',receipt['base_pages_commit']],task_env)
 for name in ['index.html','pages-manifest.json','sw.js',*[x for x in receipt['candidate_files'] if x.startswith('review/')]]:
  blob=git(['hash-object','-w','--',str(candidate/name)])
  git(['update-index','--add','--cacheinfo','100644',blob,name],task_env)
 tree=git(['write-tree'],task_env)
 message='Publish linked Movefield review from '+receipt['current_source_commit']+'\n\nPreserve the current app and its pinned assets. Add a separate, tested review profile at /movefield/review/.\n'
 commit=git(['commit-tree',tree,'-p',receipt['base_pages_commit']],input=message.encode())
 actual={name:git(['rev-parse',commit+':'+name]) for name in receipt['candidate_files']}
 for name,blob in actual.items():
  if blob!=git(['hash-object','--',str(candidate/name)]):raise RuntimeError('Created tree differs: '+name)
 result={'pages_commit':commit,'base_pages_commit':receipt['base_pages_commit'],'source_commit':receipt['current_source_commit'],'application_source_sha256':receipt['application_source_sha256'],'candidate_file_count':len(actual),'review_url':'https://ghinz32-cloud.github.io/movefield/review/','pushed':False,'live_verified':False}
 (RUNTIME/'github-pages-publication.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
finally:
 for path in [pathlib.Path(index),pathlib.Path(index+'.lock')]:
  if path.exists():path.unlink()
