"""Create the verified two-preview Pages commit with an isolated index; no push."""
import hashlib,json,os,pathlib,subprocess,tempfile
ROOT=pathlib.Path(__file__).resolve().parents[1];RUNTIME=ROOT/'.sites-runtime';candidate=RUNTIME/'fitness-pages-candidate'
r=json.loads((RUNTIME/'fitness-pages-candidate-receipt.json').read_text())
for name,expected in r['candidate_files'].items():
 p=candidate/name
 if p.is_symlink() or hashlib.sha256(p.read_bytes()).hexdigest()!=expected:raise RuntimeError('Reviewed candidate differs: '+name)
fd,index=tempfile.mkstemp(prefix='fitness-pages-index-',dir=RUNTIME);os.close(fd);os.unlink(index);task_env={**os.environ,'GIT_INDEX_FILE':index}
def git(args,env=None,input=None):return subprocess.check_output(['git',*args],cwd=ROOT,env=env,input=input).decode().strip()
try:
 git(['read-tree',r['base_pages_commit']],task_env)
 for name in r['deleted_files']:
  if not name.startswith(('review/','grizzly/')):raise RuntimeError('Deletion outside owned apps.')
  git(['update-index','--force-remove','--',name],task_env)
 for name in r['candidate_files']:
  if name.startswith(('review/','grizzly/')):git(['update-index','--add','--cacheinfo','100644',git(['hash-object','-w','--',str(candidate/name)]),name],task_env)
 tree=git(['write-tree'],task_env);commit=git(['commit-tree',tree,'-p',r['base_pages_commit']],input=('Publish shared fitness audit for Movefield and Grizzly\n\nSource '+r['current_source_commit']+'. Preserve the original Movefield app and its pinned assets.\n').encode())
 if set(git(['ls-tree','-r','--name-only',commit]).splitlines())!=set(r['candidate_files']):raise RuntimeError('Created tree has stale or missing files.')
 for name in r['candidate_files']:
  if git(['rev-parse',commit+':'+name])!=git(['hash-object','--',str(candidate/name)]):raise RuntimeError('Created tree differs: '+name)
 result={'pages_commit':commit,'base_pages_commit':r['base_pages_commit'],'source_commit':r['current_source_commit'],'application_source_sha256':r['application_source_sha256'],'urls':['https://ghinz32-cloud.github.io/movefield/review/','https://ghinz32-cloud.github.io/movefield/grizzly/'],'pushed':False,'live_verified':False}
 (RUNTIME/'fitness-pages-publication.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
finally:
 for p in [pathlib.Path(index),pathlib.Path(index+'.lock')]:
  if p.exists():p.unlink()
