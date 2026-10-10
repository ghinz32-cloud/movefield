const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createHookHarness,createTsxLoader}=require('./lib/component-hook-harness.cjs');
const repo=path.resolve(__dirname,'..'),page=path.join(repo,'app/page.tsx');
// Execute the real hydration/autosave/restore callbacks. Only the large UI tree
// is replaced in this compiled test copy; app source exports remain unchanged.
const source=fs.readFileSync(page,'utf8').replace(' const transferDialogs=', ' return {s,setS,ready,restoreFromText,storageConflict,storageBlocked,storageUnavailable,rawSaved,exploreSample,exitSample,resetProfile};\n const transferDialogs=');
const helper=createTsxLoader(repo),O=helper.load(path.join(repo,'lib/onboarding.ts')),B=helper.load(path.join(repo,'lib/local-backup.ts'));
const initial=O.freshState();let checks=0;
async function mount({raw='database-ciphertext',readError=false,rawError=false,migrating=false}={}){
 const h=createHookHarness(),writes=[],replaces=[],listeners=new Map(),channels=[];let stored=raw,state=structuredClone(initial);
 const vault={writerId:'this-tab',raw:async()=>{if(rawError)throw Error('Injected unavailable database');return stored},readSnapshot:async()=>{if(migrating){stored='migrated-ciphertext';channels[0]?.onmessage?.({data:{writerId:'this-tab'}})}if(readError)throw Error('Injected unreadable record');return {raw:stored,text:JSON.stringify(state)}},
  write:async(slot,text,expected)=>{assert.equal(expected,stored);writes.push({slot,text,expected});stored='committed-'+writes.length;state=JSON.parse(text);return stored},
  discard:async()=>{},reset:async()=>{stored=null},replace:async(slot,text,expected)=>{assert.equal(expected,stored);replaces.push({slot,text,expected});stored='restored';state=JSON.parse(text);return stored}};
 global.window={scrollTo:()=>{},addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:()=>{}};
 global.document={querySelector:()=>null};global.navigator={locks:{request:async(name,fn)=>fn()}};
 global.localStorage={getItem:()=>{throw Error('Training must use the vault, not localStorage');},setItem:()=>{}};
 global.BroadcastChannel=class {constructor(){channels.push(this)}close(){ }};
 const proxy=new Proxy({}, {get:(_,name)=>String(name)});
 const overrides={react:{...h.react,lazy:()=> 'Lazy',Suspense:'Suspense'},'react/jsx-runtime':h.runtime,
  'lucide-react':proxy,sonner:{Toaster:'Toaster',toast:new Proxy({}, {get:()=>()=>{}})},
  '@/lib/browser-vault':{getVault:()=>vault,VaultError:helper.load(path.join(repo,'lib/browser-vault.ts')).VaultError}};
 for(const match of source.matchAll(/from '(@\/components\/[^']+)'/g))overrides[match[1]]=proxy;
 overrides['@/components/app-preferences']={...proxy,useWorkoutReminders:()=>{}};
 overrides['@/components/rest-timer']={...proxy,useRestAlarm:()=>{}};
 const loader=createTsxLoader(repo,overrides,{[page]:source});await h.mount(loader.load(page).default);
 return {h,writes,replaces,listeners,setStored:value=>{stored=value},get stored(){return stored}};
}
(async()=>{
 const saved=await mount();assert.equal(saved.h.tree.storageBlocked,false);assert.equal(saved.writes[0].expected,'database-ciphertext');checks++;
 saved.h.tree.setS(s=>({...s,profile:{...s.profile,name:'Updated profile'}}));await saved.h.settle();
 assert.equal(JSON.parse(saved.writes.at(-1).text).profile.name,'Updated profile');assert.equal(saved.h.tree.rawSaved.current,saved.stored);checks++;
 const incoming={...initial,profile:{...initial.profile,name:'Restored profile'}};
 await saved.h.tree.restoreFromText(JSON.stringify(incoming),B.serializeBackup(saved.h.tree.s));await saved.h.settle();
 assert.equal(saved.replaces.length,1);assert.equal(saved.h.tree.s.profile.name,'Restored profile');assert.equal(saved.h.tree.rawSaved.current,saved.stored);checks++;
 const writes=saved.writes.length;saved.setStored('other-tab-ciphertext');await saved.listeners.get('focus')();await saved.h.settle();
 assert.equal(saved.h.tree.storageConflict,true);saved.h.tree.setS(s=>({...s,profile:{...s.profile,name:'Must not save'}}));await saved.h.settle();assert.equal(saved.writes.length,writes);checks++;
 saved.h.unmount();
 const sample=await mount();const realRaw=sample.stored;sample.h.tree.exploreSample();await sample.h.settle();await sample.h.tree.resetProfile();await sample.h.settle();assert.equal(sample.stored,realRaw);assert.equal(sample.h.tree.rawSaved.current,realRaw);sample.h.tree.exitSample();await sample.h.settle();assert.equal(sample.h.tree.storageConflict,false);checks++;sample.h.unmount();
 const migrated=await mount({migrating:true});assert.equal(migrated.h.tree.storageConflict,false);assert.equal(migrated.writes[0].expected,'migrated-ciphertext');checks++;migrated.h.unmount();
 const unavailable=await mount({rawError:true});assert.equal(unavailable.h.tree.storageBlocked,true);assert.equal(unavailable.h.tree.storageUnavailable,true);assert.equal(unavailable.writes.length,0);checks++;unavailable.h.unmount();
 const broken=await mount({readError:true});assert.equal(broken.h.tree.storageBlocked,true);assert.equal(broken.writes.length,0);checks++;broken.h.unmount();
 console.log(`PASS browser storage UI: ${checks} real compiled callback scenarios (simulated hooks/DOM and vault, not browser acceptance)`);
})().catch(error=>{console.error(error);process.exitCode=1});
