"""Reject reused Metro outputs when exporting different app identities."""
import datetime,hashlib,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1];results={}
for flavor,directory in [('movefield','dist-mobile'),('grizzly','dist-grizzly')]:
 root=ROOT/'mobile'/directory;metadata=json.loads((root/'metadata.json').read_text());files={}
 for platform in ['android','ios']:
  name=metadata['fileMetadata'][platform]['bundle'];path=(root/name).resolve()
  if not path.is_relative_to(root.resolve()) or path.suffix!='.hbc':raise RuntimeError('Unexpected native export path')
  files[platform]={'path':name,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
 results[flavor]=files
for platform in ['android','ios']:
 if results['movefield'][platform]['sha256']==results['grizzly'][platform]['sha256']:raise RuntimeError('Flavors reused an identical '+platform+' bundle. Clear Metro and re-export both.')
receipt={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Distinct cleared-cache Hermes exports, paired with native identity/module checks; no installed-device claim.','flavors':results}
(ROOT/'.sites-runtime/native-flavor-exports.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
