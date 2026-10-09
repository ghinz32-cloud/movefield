const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createHookHarness,createTsxLoader}=require('./lib/component-hook-harness.cjs');
const repo=process.argv[2]||path.resolve(__dirname,'..'),settingsFile=path.join(repo,'mobile/src/settings.tsx'),appFile=path.join(repo,'mobile/App.tsx');
const status=(state)=>({state,pending:state==='pending'?1:0,preserved:state==='attention'?1:0,unreadable:state==='unavailable'?1:0});
const appearance={p:{textSize:100,font:'inter',reminderTime:'18:00',mode:'system',model:'off'},colors:{ink:'#123',green:'#234',white:'#fff',line:'#ddd',pale:'#eee'},fonts:false,ready:true,update:()=>{}};
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}}
let checks=0;const scenarios=[],failures=[];
const same=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++};
const ok=(actual,message)=>{assert.ok(actual,message);checks++};
async function scenario(name,run){scenarios.push(name);try{await run();console.log('PASS '+name)}catch(error){failures.push({name,error:error.message});console.error('FAIL '+name+': '+error.stack)}}
function stateCells(h){return h.cells.filter(cell=>cell?.kind==='state').map(cell=>structuredClone(cell.value))}
function action(h,label){const node=h.find(node=>node.props.accessibilityLabel===label&&typeof node.props.onPress==='function');assert.ok(node,'Actual rendered action: '+label);return node}
async function press(h,label){action(h,label).props.onPress();await h.settle()}
function settingsLoader(h,openURL=async()=>{}){
 return createTsxLoader(repo,{react:h.react,'react/jsx-runtime':h.runtime,'react-native':{View:'View',Text:'Text',Pressable:'Pressable',TextInput:'TextInput',Switch:'Switch',ScrollView:'ScrollView',Linking:{openURL}},'expo-linear-gradient':{LinearGradient:'LinearGradient'},'./appearance':{useNativeAppearance:()=>appearance,families:{}},'./workout-notifications':{enableWorkoutReminders:async()=>({enabled:false,message:''})},'./transfer':{NativeTransferMake:'NativeTransferMake',NativeTransferOpen:'NativeTransferOpen'},'./model-files':{NativeModelFiles:'NativeModelFiles'}}).load(settingsFile);
}
async function mountNotice(input={}){const h=createHookHarness(),calls=[];const component=settingsLoader(h).NativePrivacyNotice;let props={status:status('pending'),onRetry:async()=>{calls.push('retry')},...input};await h.mount(component,props);return {h,calls,set:async next=>{props={...props,...next};await h.mount(component,props)}}}
const helper=createTsxLoader(repo),initial=helper.load(path.join(repo,'mobile/src/mobile-engine.ts')).emptyDemo();
const backup=helper.load(path.join(repo,'mobile/src/shared/local-backup.ts'));
const normalize=helper.load(path.join(repo,'mobile/src/shared/workout-log.ts')).normalizeWorkoutRest;
const saved=helper.load(path.join(repo,'mobile/src/shared/saved-data.ts')).readSavedState;
const appSource=fs.readFileSync(appFile,'utf8').replace('  if (!state) return','  return {state,readError,saveStatus,saveFailure,privacyStatus,privacyBusy,localNotice,error,commit,replaceWith,reset,retryPrivacyCleanup,refreshPrivacyStatus};\n  if (!state) return')+'\nexport {TrainingApp};\n';
async function mountApp(options={}){
 const h=createHookHarness(),calls=[],writes=[],replaces=[];let privacy=status('clear');
 const store={
  readLocalState:async()=>{calls.push('read');if(options.readError)throw Error('Injected unreadable training');return options.readTask?options.readTask.promise:structuredClone(initial)},
  readLocalPrivacyStatus:async()=>{calls.push('privacy');if(options.privacyError)throw Error('Injected denied privacy read');return options.privacyRead?options.privacyRead(calls.filter(x=>x==='privacy').length):privacy},
  retryLocalPrivacyCleanup:async()=>{calls.push('retry');if(options.retryError)throw Error('Injected denied cleanup');return options.retryTask?options.retryTask.promise:status('clear')},
  saveLocalState:async s=>{writes.push(structuredClone(s));calls.push('save');if(options.saveError)throw Error('Injected save failure');return options.saveTask?options.saveTask.promise:undefined},
  replaceLocalState:async s=>{replaces.push(structuredClone(s));calls.push('replace');if(options.replaceError)throw Error('Injected restore failure');return options.replaceTask?options.replaceTask.promise:undefined},
  resetLocalState:async()=>{calls.push('reset');if(options.resetError)throw Error('Injected reset failure');privacy=options.resetStatus||status('clear');return options.resetTask?options.resetTask.promise:privacy},
 };
 const empty=new Proxy({}, {get:(_,name)=>name});
 const overrides={react:h.react,'react/jsx-runtime':h.runtime,'react-native':{StyleSheet:{create:value=>value},AccessibilityInfo:{announceForAccessibility:()=>{}}},'react-native-safe-area-context':empty,'expo-status-bar':empty,'expo-crypto':{getRandomBytes:n=>new Uint8Array(n)},'./src/appearance':{useThemedStyles:()=>({}),useNativeAppearance:()=>appearance},'./src/brand':{brand:{name:'Movefield'}},'./src/shared/brand':{brand:{name:'Movefield'}},'./src/storage':store,'./src/local-crypto':{LocalDataError:class LocalDataError extends Error{}},'./src/storage-capacity':{nativeSaveFailure:()=>({kind:'storage',message:'The latest open changes could not be saved.'})},'./src/shared/training':{day:()=>'2026-10-09',exercises:[],matchesExercise:()=>true},'./src/mobile-engine':{emptyDemo:()=>structuredClone(initial)},'./src/shared/workout-log':{normalizeWorkoutRest:normalize},'./src/shared/saved-data':{readSavedState:saved},'./src/shared/local-backup':backup,'./src/workout-notifications':{useNativeWorkoutReminders:()=>''},'./src/rest-alerts':{useNativeRestAlerts:()=>''},'./src/content':{guides:{},media:{}},'./src/shared/exercise-video':{firstTimeExerciseIds:()=>[]}};
 for(const match of appSource.matchAll(/from '([^']+)'/g))if(!(match[1] in overrides))overrides[match[1]]=empty;
 const component=createTsxLoader(repo,overrides,{[appFile]:appSource}).load(appFile).TrainingApp;
 await h.mount(component);return {h,calls,writes,replaces,setPrivacy:value=>{privacy=value}};
}

(async()=>{
 await scenario('Pending cleanup warning is independent and requires an explicit retry',async()=>{
  const f=await mountNotice();same(f.calls,[],'Rendering the warning performs no cleanup');ok(f.h.text().includes('New saves use encryption')&&f.h.text().includes('may be unencrypted'),'Warning distinguishes new encrypted saves from retained copies');ok(!/SQL|slot|fingerprint/.test(f.h.text()),'Storage implementation details stay out of the notice');await press(f.h,'Retry older-copy cleanup');same(f.calls,['retry'],'Only explicit retry invokes cleanup');f.h.unmount();
 });
 for(const state of ['clear','attention','unavailable'])await scenario(state+' status describes older copies honestly',async()=>{
  const f=await mountNotice({status:status(state)}),text=f.h.text();same(f.calls,[],'Status rendering never deletes copies');if(state==='clear'){ok(text.includes('No older local training copies were found'),'Clear status has narrow scope');ok(!f.h.find(n=>n.props.accessibilityLabel==='Retry older-copy cleanup'),'Clear status needs no destructive retry')}else if(state==='attention'){ok(text.includes('preserved')&&text.includes('safe removal could not be confirmed'),'Attention explains preservation');ok(text.includes('Changed or unreadable copies are kept rather than deleted automatically'),'Preserved copies are retained without promising export coverage')}else{ok(text.includes('could not be checked')&&text.includes('may remain'),'Unavailable status makes no complete-erasure claim')}f.h.unmount();
 });
 await scenario('Busy retry is disabled and guarded even through its retained callback',async()=>{
  const f=await mountNotice({busy:true}),node=action(f.h,'Retry older-copy cleanup');same(node.props.disabled,true,'Native button disabled');same(node.props.accessibilityState.disabled,true,'Disabled state exposed to assistive technology');node.props.onPress();await f.h.settle();same(f.calls,[],'Disabled callback cannot request cleanup');f.h.unmount();
 });
 await scenario('Compact global status exposes warnings and keeps clear status quiet',async()=>{
  const f=await mountNotice({compact:true});ok(f.h.text().includes('Settings'),'Global warning points to explicit cleanup controls');ok(!f.h.find(n=>n.props.onPress),'Compact warning performs no mutation');await f.set({status:status('clear')});same(f.h.tree,null,'Clear status does not occupy global space');f.h.unmount();
 });
 await scenario('Settings receives privacy status and links without changing it',async()=>{
  const h=createHookHarness(),components=settingsLoader(h),retry=async()=>{};await h.mount(components.NativeSettings,{reminderMessage:'',privacyStatus:status('attention'),privacyBusy:true,onRetryPrivacyCleanup:retry,onExport:async()=>'',onMakeTransfer:async()=>'',onOpenTransfer:async()=>''});const notice=h.find(n=>n.type===components.NativePrivacyNotice);same(notice.props.status,status('attention'),'Settings forwards preserved-copy status');same(notice.props.onRetry,retry,'Retry remains a supplied explicit callback');same(notice.props.busy,true,'Settings forwards busy state');ok(h.find(n=>n.type===components.NativePrivacySupport),'Settings renders privacy/support card');ok(h.text().includes('Newly saved training')&&!h.text().includes('Your training plan and history are encrypted'),'Transfer card does not claim every older copy is encrypted');h.unmount();
 });
 await scenario('Privacy and support links open only from accessible user actions',async()=>{
  const h=createHookHarness(),calls=[],components=settingsLoader(h,async url=>{calls.push(url)});await h.mount(components.NativePrivacySupport);same(calls,[],'Mounting Settings does not open or probe destinations');ok(h.text().includes('Do not post private backups or health data in public issues.'),'Public support privacy warning is visible');same(action(h,'Read the privacy policy').props.accessibilityRole,'link','Privacy action is exposed as a link');await press(h,'Read the privacy policy');await press(h,'Open public support issues');same(calls,['https://ghinz32-cloud.github.io/movefield/privacy.html','https://github.com/ghinz32-cloud/movefield/issues'],'Explicit actions use exact approved public destinations');h.unmount();
 });
 await scenario('Failed public link is visible, later link supersedes old failure, unmount suppresses results',async()=>{
  const h=createHookHarness(),old=deferred(),late=deferred();let count=0;const components=settingsLoader(h,()=>{count++;return count===1?Promise.reject(Error('Denied URL')):count===2?old.promise:count===4?late.promise:Promise.resolve()});await h.mount(components.NativePrivacySupport);await press(h,'Read the privacy policy');ok(h.text().includes('Could not open the link'),'Link failure is visible');action(h,'Read the privacy policy').props.onPress();await h.settle();await press(h,'Open public support issues');old.reject(Error('Stale link failure'));await h.settle();ok(!h.text().includes('Could not open the link'),'Older link failure cannot overwrite newer success');const stale=action(h,'Read the privacy policy').props.onPress;stale();await h.settle();h.unmount();const before=stateCells(h);late.reject(Error('Late failure'));await h.settle();same(stateCells(h),before,'Unmounted link failure cannot update visible state');stale();same(count,4,'Retained unmounted link callback cannot open a destination');
 });
 await scenario('Startup reads older-copy status even when saved training cannot open',async()=>{
  const f=await mountApp({readError:true,privacyRead:async()=>status('attention')});ok(f.h.tree.readError,'Training read failure remains visible');same(f.h.tree.privacyStatus,status('attention'),'Older-copy privacy is read independently after training failure');same(f.writes.length,0,'Failed startup does not replace records');same(f.calls.filter(x=>x==='retry').length,0,'Startup status does not request cleanup');f.h.unmount();
 });
 await scenario('Privacy read failure cannot change a durable save to failure',async()=>{
  const f=await mountApp({privacyError:true});f.h.tree.commit({...f.h.tree.state,profile:{...f.h.tree.state.profile,name:'Saved update'}});await f.h.settle();same(f.writes.length,1,'Actual save callback wrote one state');same(f.h.tree.saveStatus,'Saved on this device','Durable success remains success despite denied privacy read');same(f.h.tree.saveFailure,null,'No false save failure is installed');same(f.h.tree.privacyStatus.state,'unavailable','Separate privacy check reports unavailable');f.h.unmount();
 });
 await scenario('Save failure and privacy attention remain independent',async()=>{
  const f=await mountApp({saveError:true,privacyRead:async()=>status('attention')});f.h.tree.commit({...f.h.tree.state});await f.h.settle();ok(f.h.tree.saveStatus.startsWith('Save failed'),'Actual storage failure remains a save failure');same(f.h.tree.privacyStatus.state,'attention','Preserved-copy status does not erase save failure');f.h.unmount();
 });
 await scenario('Newer privacy status suppresses older pending read after a save',async()=>{
  const old=deferred(),f=await mountApp({privacyRead:async n=>n===1?old.promise:status('attention')});f.h.tree.commit({...f.h.tree.state});await f.h.settle();same(f.h.tree.privacyStatus.state,'attention','Post-save privacy status is installed');old.resolve(status('clear'));await f.h.settle();same(f.h.tree.privacyStatus.state,'attention','Older startup read cannot clear the new warning');f.h.unmount();
 });
 await scenario('Successful restore refreshes privacy without turning status failure into restore failure',async()=>{
  const f=await mountApp({privacyError:true}),incoming={...initial,profile:{...initial.profile,name:'Restored profile'}};await f.h.tree.replaceWith(incoming,backup.serializeBackup(f.h.tree.state));await f.h.settle();same(f.replaces.length,1,'Actual restore callback replaces once');same(f.h.tree.state.profile.name,'Restored profile','Restored state stays installed');same(f.h.tree.saveStatus,'Saved on this device','Privacy check failure preserves durable restore result');same(f.h.tree.error,'','Privacy failure is not a false restore error');same(f.h.tree.privacyStatus.state,'unavailable','Restore independently refreshes older-copy status');f.h.unmount();
 });
 for(const operation of ['stale restore','failed restore','failed reset'])for(const outcome of ['saved','failed'])await scenario(operation+' preserves a pending save '+outcome+' result',async()=>{
  const save=deferred(),f=await mountApp({saveTask:save,replaceError:operation==='failed restore',resetError:operation==='failed reset'});f.h.tree.commit({...f.h.tree.state});await f.h.settle();
  if(operation==='failed reset')await f.h.tree.reset();else await f.h.tree.replaceWith(structuredClone(initial),operation==='stale restore'?'stale preview':backup.serializeBackup(f.h.tree.state));
  await f.h.settle();if(outcome==='saved')save.resolve();else save.reject(Error('Pending save rejected'));await f.h.settle();
  if(outcome==='saved'){same(f.h.tree.saveStatus,'Saved on this device','Failed replacement/reset cannot hide durable save success');same(f.h.tree.saveFailure,null,'Successful pending save has no failure')}else{ok(f.h.tree.saveStatus.startsWith('Save failed'),'Failed replacement/reset cannot hide a rejected pending save');ok(f.h.tree.saveFailure,'Actual rejected pending save keeps recovery feedback')}f.h.unmount();
 });
 await scenario('Unmount suppresses rejected restore and never refreshes privacy afterward',async()=>{
  const task=deferred(),f=await mountApp({replaceTask:task});const request=f.h.tree.replaceWith(structuredClone(initial),backup.serializeBackup(f.h.tree.state));await f.h.settle();f.h.unmount();const before=stateCells(f.h),calls=[...f.calls];task.reject(Error('Late restore rejection'));await request;await f.h.settle();same(stateCells(f.h),before,'Unmounted restore rejection cannot set error state');same(f.calls,calls,'Unmounted restore cannot begin another privacy read');
 });
 await scenario('Reset preserves a truthful older-copy warning and saves an empty current state',async()=>{
  const f=await mountApp({resetStatus:status('attention')});await f.h.tree.reset();await f.h.settle();same(f.calls.filter(x=>x==='reset').length,1,'Reset executed once');same(f.writes.length,1,'Fresh empty state is saved after reset');same(f.h.tree.state.history,[],'Current history is empty');ok(f.h.tree.localNotice.includes('Current saved records were reset')&&f.h.tree.localNotice.includes('Older local copies may remain'),'Reset confirmation reports retired records separately from retained copies');same(f.h.tree.privacyStatus.state,'attention','Later save does not conceal preserved copies');f.h.unmount();
 });
 await scenario('Denied retry stays a privacy issue and cannot trigger a training save',async()=>{
  const f=await mountApp({retryError:true});await f.h.tree.retryPrivacyCleanup();await f.h.settle();same(f.h.tree.privacyStatus.state,'unavailable','Denied cleanup reports unavailable');same(f.h.tree.saveStatus,'Saved on this device','Cleanup failure leaves saved training status intact');same(f.writes.length,0,'Retry cannot write current training');same(f.h.tree.privacyBusy,false,'Failed retry exits busy state');f.h.unmount();
 });
 await scenario('Repeated retry clicks make one request and later save invalidates old cleanup status',async()=>{
  const task=deferred(),f=await mountApp({retryTask:task});f.h.tree.retryPrivacyCleanup();f.h.tree.retryPrivacyCleanup();await f.h.settle();same(f.calls.filter(x=>x==='retry').length,1,'Synchronous duplicate retry is suppressed');same(f.h.tree.privacyBusy,true,'Pending retry is visible');f.setPrivacy(status('attention'));f.h.tree.commit({...f.h.tree.state});await f.h.settle();task.resolve(status('clear'));await f.h.settle();same(f.h.tree.privacyStatus.state,'attention','Old cleanup result cannot replace a later save status');same(f.h.tree.privacyBusy,false,'Completed retry clears busy state');f.h.unmount();
 });
 await scenario('Unmount suppresses pending privacy, save and cleanup callbacks',async()=>{
  const read=deferred(),save=deferred(),retry=deferred(),f=await mountApp({privacyRead:async()=>read.promise,saveTask:save,retryTask:retry});f.h.tree.commit({...f.h.tree.state});f.h.tree.retryPrivacyCleanup();await f.h.settle();f.h.unmount();const before=stateCells(f.h),calls=[...f.calls];read.resolve(status('clear'));save.resolve();retry.resolve(status('clear'));await f.h.settle();same(stateCells(f.h),before,'Unmounted async operations never update state');same(f.calls,calls,'Late durable save completion cannot start a new privacy read');
 });
 console.log(`${failures.length?'FAIL':'PASS'} native privacy UI: ${scenarios.length-failures.length}/${scenarios.length} scenarios, ${checks} assertions (actual compiled TSX callbacks; mocked storage/native hooks, not physical-device acceptance)`);if(failures.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
