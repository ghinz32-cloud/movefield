"""Create and verify the two-preview Pages draft with an isolated index; never push."""
import hashlib,json,os,pathlib,subprocess,tempfile
ROOT=pathlib.Path(__file__).resolve().parents[1];RUNTIME=ROOT/'.sites-runtime';candidate=RUNTIME/'fitness-pages-candidate'
r=json.loads((RUNTIME/'fitness-pages-candidate-receipt.json').read_text())
for name,expected in r['candidate_files'].items():
 p=candidate/name
 if p.is_symlink() or not p.resolve().is_relative_to(candidate.resolve()) or hashlib.sha256(p.read_bytes()).hexdigest()!=expected:raise RuntimeError('Reviewed candidate differs: '+name)
scratch=tempfile.TemporaryDirectory(prefix='fitness-pages-index-',dir=RUNTIME);index=str(pathlib.Path(scratch.name)/'index');task_env={**os.environ,'GIT_INDEX_FILE':index}
def git(args,env=None,input=None):return subprocess.check_output(['git',*args],cwd=ROOT,env=env,input=input).decode().strip()
def entries(ref):
 result={}
 for record in subprocess.check_output(['git','ls-tree','-rz','--full-tree',ref],cwd=ROOT).split(b'\0'):
  if not record:continue
  header,path=record.split(b'\t',1);mode,kind,sha=header.split(b' ')
  if kind!=b'blob':raise RuntimeError('Only ordinary files may be published.')
  result[path.decode()]=(mode.decode(),sha.decode())
 return result
try:
 names=list(r['candidate_files']);paths=[str(candidate/name) for name in names]
 if any('\n' in p or '\r' in p or '"' in p or '\\' in p for p in paths):raise RuntimeError('Unsupported candidate path.')
 hashes=git(['hash-object','-w','--no-filters','--stdin-paths'],input=('\n'.join(paths)+'\n').encode()).splitlines()
 if len(hashes)!=len(names):raise RuntimeError('Candidate blob count differs.')
 blobs=dict(zip(names,hashes));base=entries(r['base_pages_commit']);git(['read-tree',r['base_pages_commit']],task_env);updates=[]
 for name in r['deleted_files']:
  if not name.startswith(('review/','grizzly/')):raise RuntimeError('Deletion outside owned apps.')
  updates.append('0 '+'0'*40+'\t'+name+'\0')
 for name in names:
  if name.startswith(('review/','grizzly/')):updates.append('100644 '+blobs[name]+'\t'+name+'\0')
 git(['update-index','-z','--index-info'],task_env,input=''.join(updates).encode());tree=git(['write-tree'],task_env);actual=entries(tree)
 if set(actual)!=set(names) or any(actual[n][1]!=blobs[n] for n in names):raise RuntimeError('Created tree differs.')
 preserved={n:v for n,v in base.items() if not n.startswith(('review/','grizzly/'))}
 if any(actual.get(n)!=v for n,v in preserved.items()):raise RuntimeError('Original file content or mode changed.')
 commit=git(['commit-tree',tree,'-p',r['base_pages_commit']],input=('Publish shared fitness review for Movefield and Grizzly\n\nSource '+r['current_source_commit']+'. Preserve the original app.\n').encode());result={'pages_commit':commit,'base_pages_commit':r['base_pages_commit'],'source_commit':r['current_source_commit'],'application_source_sha256':r['application_source_sha256'],'preserved_original_files':len(preserved),'verified_candidate_files':len(actual),'pushed':False,'live_verified':False};(RUNTIME/'fitness-pages-publication.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
finally:scratch.cleanup()
