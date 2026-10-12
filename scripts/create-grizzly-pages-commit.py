"""Create a Grizzly Pages commit with a temporary index; no push or history rewrite."""
import hashlib,json,os,pathlib,subprocess,tempfile
ROOT=pathlib.Path(__file__).resolve().parents[1];RUNTIME=ROOT/'.sites-runtime'
receipt=json.loads((RUNTIME/'grizzly-pages-candidate-receipt.json').read_text());candidate=RUNTIME/'grizzly-pages-candidate'
for name,expected in receipt['candidate_files'].items():
 path=candidate/name
 if path.is_symlink() or hashlib.sha256(path.read_bytes()).hexdigest()!=expected:raise RuntimeError('Reviewed candidate changed: '+name)
fd,index=tempfile.mkstemp(prefix='grizzly-pages-index-',dir=RUNTIME);os.close(fd);os.unlink(index)
task_env={**os.environ,'GIT_INDEX_FILE':index}
def git(args,env=None,input=None):return subprocess.check_output(['git',*args],cwd=ROOT,env=env,input=input).decode().strip()
try:
 git(['read-tree',receipt['base_pages_commit']],task_env)
 for name in receipt.get('deleted_files',[]):
  if not name.startswith('grizzly/'):raise RuntimeError('Deletion outside owned Grizzly directory')
  git(['update-index','--force-remove','--',name],task_env)
 for name in [*receipt['original_files_changed'],*[x for x in receipt['candidate_files'] if x.startswith('grizzly/')]]:
  blob=git(['hash-object','-w','--',str(candidate/name)]);git(['update-index','--add','--cacheinfo','100644',blob,name],task_env)
 tree=git(['write-tree'],task_env);commit=git(['commit-tree',tree,'-p',receipt['base_pages_commit']],input=('Add separate Grizzly Fitness preview from '+receipt['current_source_commit']+'\n\nPreserve both Movefield applications and their assets.\n').encode())
 for name in receipt['candidate_files']:
  if git(['rev-parse',commit+':'+name])!=git(['hash-object','--',str(candidate/name)]):raise RuntimeError('Created tree differs: '+name)
 if set(git(['ls-tree','-r','--name-only',commit]).splitlines())!=set(receipt['candidate_files']):raise RuntimeError('Created tree has stale or missing files')
 result={'pages_commit':commit,'base_pages_commit':receipt['base_pages_commit'],'source_commit':receipt['current_source_commit'],'application_source_sha256':receipt['application_source_sha256'],'preview_url':'https://ghinz32-cloud.github.io/movefield/grizzly/','pushed':False,'live_verified':False}
 (RUNTIME/'grizzly-pages-publication.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
finally:
 for path in [pathlib.Path(index),pathlib.Path(index+'.lock')]:
  if path.exists():path.unlink()
