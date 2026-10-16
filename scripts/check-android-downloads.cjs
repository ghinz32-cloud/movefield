const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve('public/downloads'),manifest=JSON.parse(fs.readFileSync(path.join(root,'android-installers.json'),'utf8'));
const code=fs.readFileSync(path.join(root,'android-download.js'),'utf8'),digest=raw=>crypto.createHash('sha256').update(raw).digest('hex');
const html=fs.readFileSync(path.join(root,'android.html'),'utf8');
function verifyDirectLinks(page){
 assert.match(manifest.sourceCommit,/^[a-f0-9]{40}$/,'Download source must identify a full commit');
 for(const app of manifest.apps){
  assert.equal(app.sourceCommit,manifest.sourceCommit);assert.match(app.versionName,/^\d+\.\d+\.\d+$/);
  const basename={movefield:'movefield',grizzly:'grizzly-fitness'}[app.app];assert.ok(basename,'Review the release filename for a new app');
  const card=[...page.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/g)].find(row=>row[1].includes('data-app="'+app.app+'"'));assert.ok(card,'Missing app download card');
  const primary=[...card[2].matchAll(/<a\b([^>]*\bdata-direct\b[^>]*)>([\s\S]*?)<\/a>/g)];assert.equal(primary.length,1,'One ordinary primary download link per app');
  const href=primary[0][1].match(/\bhref="([^"]+)"/);assert.ok(href,'Primary download must work without JavaScript');
  const expected='https://github.com/ghinz32-cloud/movefield/releases/download/android-ux-preview-'+manifest.sourceCommit.slice(0,12)+'/'+basename+'-'+app.versionName+'-arm64.apk';
  assert.equal(href[1],expected,'Primary APK must match the manifest release source and version');
  assert.doesNotMatch(primary[0][1],/\s(?:onclick|hidden|download)(?:\s*=|\s|$)/,'Use the release server’s ordinary attachment response');
  assert.ok(card[2].indexOf('data-direct')<card[2].indexOf('data-download'),'Direct download is the first action');
  assert.match(card[2],/<details class="checked-download">[\s\S]*data-download=/,'Browser preparation remains an optional collapsed alternative');
 }
}
function element(){return {hidden:true,disabled:false,value:0,href:'',textContent:'',listeners:{},addEventListener(name,fn){this.listeners[name]=fn},focus(){this.focused=true}}}
function harness({corrupt=false,cancel=false,invalid=false,focus=''}={}){
 const cards=manifest.apps.map(item=>{const fields={};for(const name of ['[data-direct]','[data-download]','.cancel','progress','.status','.save'])fields[name]=element();return {dataset:{app:item.app},fields,querySelector:name=>fields[name]}}),blobs=[],listeners={},requests=[];let startedResolve;
 const started=new Promise(r=>startedResolve=r),payload=structuredClone(manifest);if(invalid)payload.apps[0].parts[0].file='https://unexpected.example/app.bin';
 const context={crypto:crypto.webcrypto,Uint8Array,Blob,AbortController,DOMException,URLSearchParams,location:{pathname:'/movefield/review/downloads/android.html',search:focus?'?app='+focus:''},URL:{createObjectURL:blob=>{blobs.push(blob);return 'blob:synthetic-'+blobs.length},revokeObjectURL:()=>{}},addEventListener:(name,fn)=>listeners[name]=fn,document:{querySelectorAll:()=>cards,getElementById:()=>element()},fetch:async(url,options={})=>{
  requests.push(url);
  if(url==='android-installers.json')return {ok:true,json:async()=>payload};
  assert.match(url,/^native\/(movefield|grizzly)\/part-[0-7]\.bin$/);
  if(cancel){startedResolve();return new Promise((_r,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Cancelled','AbortError'))))}
  const bytes=Buffer.from(fs.readFileSync(path.join(root,url)));if(corrupt)bytes[0]^=1;return {ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
 }};
 Object.defineProperty(context,'localStorage',{get(){assert.fail('Downloader must not read private profile storage')}});Object.defineProperty(context.document,'cookie',{get(){assert.fail('Downloader must not read account cookies')}});
 vm.runInNewContext(code,context);return {cards,blobs,started,requests};
}
(async()=>{
 verifyDirectLinks(html);
 const release='android-ux-preview-'+manifest.sourceCommit.slice(0,12);assert.throws(()=>verifyDirectLinks(html.replace(release,'android-ux-preview-000000000000')),/manifest release source and version/,'A stale release URL must fail qualification');
 const first=manifest.apps[0],current={movefield:'movefield',grizzly:'grizzly-fitness'}[first.app]+'-'+first.versionName+'-arm64.apk';assert.throws(()=>verifyDirectLinks(html.replace(current,current.replace(first.versionName,'0.0.0'))),/manifest release source and version/,'A stale APK version must fail qualification');
 for(const app of manifest.apps){const h=harness({focus:app.app}),card=h.cards.find(c=>c.dataset.app===app.app);assert.equal(card.fields['[data-direct]'].focused,true);assert.equal(card.fields['[data-download]'].focused,undefined);assert.equal(card.fields['[data-direct]'].listeners.click,undefined);assert.equal(h.requests.length,0,'Focusing the primary link must not start an assembler or download')}
 for(const app of manifest.apps){const h=harness(),card=h.cards.find(c=>c.dataset.app===app.app);await card.fields['[data-download]'].listeners.click();assert.equal(card.fields['.save'].hidden,false);assert.equal(card.fields['.save'].download,app.filename);assert.equal(h.blobs.length,1);const raw=Buffer.from(await h.blobs[0].arrayBuffer());assert.equal(raw.length,app.bytes);assert.equal(digest(raw),app.sha256);assert.equal(card.fields['[data-download]'].disabled,false)}
 for(const options of [{corrupt:true},{invalid:true}]){const h=harness(options),card=h.cards[0];await card.fields['[data-download]'].listeners.click();assert.equal(card.fields['.save'].hidden,true);assert.equal(h.blobs.length,0);assert.ok(card.fields['.status'].textContent.includes('invalid')||card.fields['.status'].textContent.includes('file check'));assert.equal(card.fields['[data-download]'].disabled,false)}
 const h=harness({cancel:true}),card=h.cards[0],task=card.fields['[data-download]'].listeners.click();await h.started;card.fields['.cancel'].listeners.click();await task;assert.equal(card.fields['.status'].textContent,'Download cancelled.');assert.equal(h.blobs.length,0);assert.equal(card.fields['[data-download]'].disabled,false);
 console.log('PASS current-version ordinary primary links, stale source/version rejection and primary-link focus without automatic download. Both exact compiled APKs reconstruct and match SHA256; altered data, external part URLs and cancellation cannot produce a download; no account/profile storage is read. Browser download/save UI remains separately checked.');
})().catch(error=>{console.error(error);process.exitCode=1});
