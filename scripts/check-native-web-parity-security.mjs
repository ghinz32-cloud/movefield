import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {createServer} from 'node:http';
import {chromium} from 'playwright-core';

const require=createRequire(import.meta.url),{load,workoutFixture}=require('./domain-test-loader.cjs');
const T=load('lib/training.ts'),S=load('lib/saved-data.ts');
const mobile=createRequire(resolve('mobile/package.json')),{build}=createRequire(import.meta.resolve('wrangler'))('esbuild');
const original=workoutFixture();
original.active.sets[0].metrics={notes:'Synthetic set note retained through navigation'};
original.history=[{...structuredClone(original.active),id:'focused-prior-workout',sessionId:'focused-prior-session',date:T.addDays(T.day(),-7),startedAt:Date.now()-8*86400000,finishedAt:Date.now()-7*86400000,sets:original.active.sets.map(set=>({...set,done:true,reps:8,kg:null})),partial:false,effort:'right',symptom:'no'}];
const fixture=S.readSavedState(JSON.stringify(original)),sample=structuredClone(fixture);
sample.active=null;sample.history=[];sample.plan.id='sample-'+sample.plan.id;sample.plan.sessions=sample.plan.sessions.map(session=>({...session,id:'sample-'+session.id,dependsOn:session.dependsOn?.map(id=>'sample-'+id)}));
const out=resolve('.sites-runtime/native-web-parity-2026-10-18/security');await mkdir(out,{recursive:true});
const results=[],errors=[];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceHashes=Object.fromEntries(await Promise.all(['mobile/App-runtime.js','mobile/src/workspace-navigation.tsx','mobile/src/workout-screen.tsx','mobile/src/phone-ui.tsx','mobile/src/plan-setup-runtime.js','mobile/src/settings.tsx','mobile/src/appearance.tsx','mobile/src/exercise-guide-screen.tsx','lib/interface-theme.ts','mobile/src/shared/interface-theme.ts','mobile/src/set-metrics.tsx','mobile/src/set-rir.tsx'].map(async file=>[file,sha(await readFile(file))])));
const canonical=value=>JSON.stringify((function sort(x){return Array.isArray(x)?x.map(sort):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(key=>[key,sort(x[key])])):x})(value));
const equal=(actual,expected,message)=>assert.equal(canonical(actual),canonical(expected),message);
let browser,complete=false;

function storageMock(){return `
import {readSavedState,readSetupDraft} from ${JSON.stringify(resolve('mobile/src/shared/saved-data.ts'))};
const initial=[${JSON.stringify(fixture)},${JSON.stringify(sample)}],prefix='synthetic-focused-v1:';
window.nativeFocusedConfig={failWrite:false,failSetup:false,failRead:false};
const key=sample=>prefix+(sample?'sample':'personal');
function state(sample=false){const raw=localStorage.getItem(key(sample));return raw===null?structuredClone(initial[Number(sample)]):readSavedState(raw)}
window.nativeFocusedSaved=state;window.nativeFocusedSeed=(value,sample=false)=>localStorage.setItem(key(sample),JSON.stringify(value));
window.nativeFocusedDraft=(sample=false)=>{const raw=localStorage.getItem(key(sample)+':draft');return raw===null?null:readSetupDraft(raw)};
window.nativeFocusedWriteCount=()=>Number(localStorage.getItem(prefix+'writes')||0);
export async function readLocalState(sample=false){if(window.nativeFocusedConfig.failRead||localStorage.getItem(prefix+'fail-read')==='1')throw Error('Synthetic preserved profile read failure');return state(sample)}
export async function saveLocalState(next,sample=false){readSavedState(JSON.stringify(next));if(window.nativeFocusedConfig.failWrite)throw Error('Synthetic focused save failure');localStorage.setItem(key(sample),JSON.stringify(next));localStorage.setItem(prefix+'writes',String(window.nativeFocusedWriteCount()+1))}
let setupTail=Promise.resolve();
export async function readLocalSetup(sample=false){await setupTail.catch(()=>{});return window.nativeFocusedDraft(sample)}
export async function saveLocalSetup(draft,sample=false){readSetupDraft(JSON.stringify(draft));const task=setupTail.catch(()=>{}).then(()=>{if(window.nativeFocusedConfig.failSetup)throw Error('Synthetic setup save failure');localStorage.setItem(key(sample)+':draft',JSON.stringify(draft))});setupTail=task;return task}
export async function flushLocalSetup(){await setupTail}
export async function clearLocalSetup(sample=false){await setupTail.catch(()=>{});localStorage.removeItem(key(sample)+':draft')}
export const nativeOutbox={read:async()=>null};export const originalSavedFile=async()=>null,resetLocalState=async()=>{},localRecoveryKey=async()=>'',encryptedLocalBackup=async()=>null,restoreDeviceKey=async()=>{},previewLocalBackup=async()=>{},restoreLocalBackup=async()=>{},erasePrivateProfile=async()=>{},encryptedStateBackup=async()=>'',restorePasswordTransfer=async()=>{};
`;}
const modalBoundary=`import React,{forwardRef} from 'react';import * as RN from ${JSON.stringify(mobile.resolve('react-native-web'))};export * from ${JSON.stringify(mobile.resolve('react-native-web'))};export const Modal=forwardRef((props,ref)=><RN.Modal {...props} ref={ref} onDismiss={()=>{if(window.nativeFocusedHoldDismiss){window.nativeFocusedPendingDismiss??=[];window.nativeFocusedPendingDismiss.push(props.onDismiss)}else props.onDismiss?.()}}/>);`;
const entry=`
import React from 'react';import {createRoot} from 'react-dom/client';import {BackHandler,Modal,Platform} from 'react-native';import App from './mobile/App';
Platform.OS=new URLSearchParams(location.search).get('os')==='ios'?'ios':'android';
const back=[];BackHandler.addEventListener=(_event,fn)=>{back.push(fn);return {remove(){const index=back.indexOf(fn);if(index>=0)back.splice(index,1)}}};
window.nativeFocusedModalType=Modal;
window.nativeFocusedOrdinaryBack=()=>{for(const fn of back.slice().reverse())if(fn())return true;return false};
window.nativeFocusedVisibleModals=()=>{const el=document.getElementById('root').querySelector('*');if(!el)return [];let root=el[Object.keys(el).find(key=>key.startsWith('__reactFiber$'))];if(!root)return [];while(root.return)root=root.return;const queue=[root.stateNode.current],found=[];while(queue.length){const fiber=queue.pop();if(fiber.sibling)queue.push(fiber.sibling);if(fiber.child)queue.push(fiber.child);if(fiber.type===Modal&&fiber.memoizedProps.visible)found.push(fiber.memoizedProps)}return found};
createRoot(document.getElementById('root')).render(<App/>);
`;
async function buildApp(variant){
 const dir=resolve(out,variant);await mkdir(dir,{recursive:true});
 const mocks={storage:storageMock(),'file-transfer':"export const shareJsonFile=async()=>{},pickJsonFile=async()=>null,cleanExportFiles=async()=>{};",'rest-alerts':"export const enableRestAlerts=async()=>({enabled:false,message:'OS notification boundary mocked'}),useNativeRestAlerts=()=>'';",'workout-notifications':"export const useNativeWorkoutReminders=()=>'',enableWorkoutReminders=async()=>({enabled:false,message:'OS notification boundary mocked'});",'cloud-account':"export const NativeCloudAccount=()=>null;"};
 await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'browser',format:'esm',outfile:resolve(dir,'app.js'),jsx:'automatic',resolveExtensions:['.web.tsx','.web.ts','.web.js','.tsx','.ts','.jsx','.js','.json'],define:{global:'globalThis',__DEV__:'false',__MOVEFIELD_APP_VARIANT__:JSON.stringify(variant),'process.env.NODE_ENV':'"production"','process.env.EXPO_PUBLIC_APP_VARIANT':JSON.stringify(variant)},alias:{'react':dirname(mobile.resolve('react/package.json')),'react-dom':dirname(mobile.resolve('react-dom/package.json'))},loader:{'.ttf':'file','.png':'file','.jpg':'file'},plugins:[{name:'documented-focused-test-boundaries',setup(b){b.onResolve({filter:/^react-native$/},()=>({path:'rn',namespace:'focused-rn'}));b.onLoad({filter:/.*/,namespace:'focused-rn'},()=>({contents:modalBoundary,loader:'tsx',resolveDir:process.cwd()}));b.onResolve({filter:/\/(storage|file-transfer|rest-alerts|workout-notifications|cloud-account)$/},args=>({path:args.path.split('/').pop(),namespace:'native-boundary'}));b.onLoad({filter:/.*/,namespace:'native-boundary'},args=>({contents:mocks[args.path],resolveDir:process.cwd()}));b.onResolve({filter:/^expo-(font|status-bar)$/},args=>({path:args.path,namespace:'expo-boundary'}));b.onLoad({filter:/.*/,namespace:'expo-boundary'},args=>({contents:args.path==='expo-font'?"export const useFonts=()=>[false];export async function loadAsync(){}":"export const StatusBar=()=>null;"}));}}],logLevel:'warning'});
 await writeFile(resolve(dir,'index.html'),'<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;width:100%;margin:0}#root{display:flex}</style><div id="root"></div><script type="module" src="/app.js"></script></html>');
 const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://local').pathname,file=resolve(dir,'.'+(path==='/'?'/index.html':path));if(!file.startsWith(dir+'/'))throw Error();const bytes=await readFile(file);res.writeHead(200,{'Content-Type':extname(file)==='.js'?'text/javascript':extname(file)==='.html'?'text/html':'application/octet-stream','Cache-Control':'no-store'});res.end(bytes)}catch{res.writeHead(404);res.end()}});await new Promise(done=>server.listen(0,'127.0.0.1',done));
 return {dir,server,url:'http://127.0.0.1:'+server.address().port,bundleSHA256:sha(await readFile(resolve(dir,'app.js')))};
}
const button=(page,label)=>page.getByRole('button',{name:label,exact:true});
const menuButton=(page,label)=>page.getByRole('dialog').filter({has:button(page,'Close navigation')}).getByRole('button',{name:label,exact:true});
const saved=(page,sample=false)=>page.evaluate(sample=>window.nativeFocusedSaved(sample),sample);
const modalCount=page=>page.evaluate(()=>window.nativeFocusedVisibleModals().length);
const releaseDismiss=page=>page.evaluate(()=>{window.nativeFocusedHoldDismiss=false;for(const callback of window.nativeFocusedPendingDismiss?.splice(0)||[])callback?.()});
async function openMenu(page){await button(page,'Open navigation menu').click();await button(page,'Close navigation').waitFor();assert.equal(await modalCount(page),1,'Only the menu is open')}
async function menuTo(page,label){await openMenu(page);await menuButton(page,label).click()}
async function datasetAction(page,label){
 const name=new RegExp('^'+label+'(?:\\.|$)');
 let action=page.getByRole('button',{name});
 if(!await action.count()){
  const category=page.getByRole('button',{name:/^Profile & equipment(?:\.|$)/});if(await category.count())await category.click();
  action=page.getByRole('button',{name});
 }
 await action.click();
}
async function scenario(page,variant){
 await button(page,'Open navigation menu').waitFor();
 const personal=await saved(page),sampleBefore=await saved(page,true),writes=await page.evaluate(()=>window.nativeFocusedWriteCount());
 await page.evaluate(()=>{window.nativeFocusedModalCounts=[];new MutationObserver(()=>window.nativeFocusedModalCounts.push(window.nativeFocusedVisibleModals().length)).observe(document.body,{attributes:true,childList:true,subtree:true})});
 // Normal menu cancellation must not queue a destination or change a record.
 await openMenu(page);await button(page,'Close navigation').click();await button(page,'Open navigation menu').waitFor();assert.equal(await modalCount(page),0);equal(await saved(page),personal);
 await openMenu(page);await page.evaluate(()=>{const modal=window.nativeFocusedVisibleModals()[0];if(typeof modal?.onRequestClose!=='function')throw Error('Menu must expose a close request');modal.onRequestClose()});await button(page,'Open navigation menu').waitFor();assert.equal(await modalCount(page),0,'Modal close request does not navigate');equal(await saved(page),personal);
 for(const [destination,close]of [['Calendar','Close Calendar and commitments'],['Sources','Close Science and sources']]){
  await openMenu(page);await page.evaluate(()=>window.nativeFocusedHoldDismiss=true);await menuButton(page,destination).click();await page.waitForFunction(()=>window.nativeFocusedPendingDismiss?.length>0);
  assert.equal(await modalCount(page),0,destination+' waits for the menu dismissal boundary');assert.equal(await button(page,close).count(),0,'Destination is absent before dismissal');
  await releaseDismiss(page);await button(page,close).waitFor();assert.equal(await modalCount(page),1,'Exactly one destination sheet opens');await releaseDismiss(page);assert.equal(await modalCount(page),1,'Repeated boundary does not replay or duplicate navigation');
  await button(page,close).click();await button(page,'Open navigation menu').waitFor();assert.equal(await modalCount(page),0);equal(await saved(page),personal,destination+' navigation preserves exact records');
 }
 // Begin from Settings: once the menu visually closes, an owner can choose a
 // different profile while the simulated OS dismissal is still delayed.
 await menuTo(page,'Profile & settings');await page.getByRole('heading',{name:'Settings',exact:true}).waitFor();
 await page.getByRole('tab',{name:'Profile & data',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:/^Backup & data(?:\.|$)/}).count(),1,'Personal profile can reach its backup section');
 const profileCategory=page.getByRole('button',{name:/^Profile & equipment(?:\.|$)/});
 await profileCategory.click();assert.equal(await page.evaluate(()=>window.nativeFocusedOrdinaryBack()),true,'Profile settings handles its local Back callback');await page.getByRole('heading',{name:'Settings',exact:true}).waitFor();equal(await saved(page),personal,'Settings Back leaves personal records unchanged');await profileCategory.click();
 await openMenu(page);await page.evaluate(()=>window.nativeFocusedHoldDismiss=true);await menuButton(page,'Calendar').click();await page.waitForFunction(()=>window.nativeFocusedPendingDismiss?.length>0);assert.equal(await modalCount(page),0);
 await datasetAction(page,'Explore a sample plan');await page.getByRole('heading',{name:'Today',exact:true}).waitFor();await releaseDismiss(page);assert.equal(await modalCount(page),0,'A queued personal destination cannot open in sample');assert.equal(await button(page,'Close Calendar and commitments').count(),0);
 equal(await saved(page),personal,'Switching after a delayed dismissal preserves personal records');equal(await saved(page,true),sampleBefore,'Navigation does not mutate sample data');assert.equal(await page.evaluate(()=>window.nativeFocusedWriteCount()),writes,'Read/navigation/profile switch does not write workout state');
 await menuTo(page,'Profile & settings');await page.getByRole('heading',{name:'Settings',exact:true}).waitFor();await page.getByRole('tab',{name:'Profile & data',exact:true}).click();assert.equal(await page.getByRole('button',{name:/^Backup & data(?:\.|$)/}).count(),0,'Private backup section is unavailable in sample');assert.equal(await page.getByRole('button',{name:/^Account(?:\.|$)/}).count(),0,'Private account section is unavailable in sample');assert.equal(await button(page,'Show recovery key').count(),0);assert.equal(await button(page,'Replace private profile with this backup').count(),0);
 await datasetAction(page,'Return to my profile');await page.getByRole('heading',{name:'Today',exact:true}).waitFor();await button(page,'Resume workout').click();await button(page,'Options').waitFor();
 equal(await saved(page),personal,'Returning to and resuming personal workout retains its complete saved record');equal(await saved(page,true),sampleBefore,'Returning from sample leaves sample records unchanged');assert.equal(await page.evaluate(()=>window.nativeFocusedWriteCount()),writes,'Round-trip profile navigation and resume do not write workout state');
 const counts=await page.evaluate(()=>window.nativeFocusedModalCounts);assert.ok(counts.length);assert.ok(Math.max(...counts)<=1,'Never more than one visible native Modal');
 results.push({variant,passed:true,checks:['menu Close and Modal close-request cancellation','Calendar waits for dismissal','Sources waits for dismissal','duplicate dismissal does not replay','Settings profile Back preserves records','profile switch cancels old destination','full personal/sample state and write count preserved','private backup unavailable in sample','return to personal and resume without writes'],visibleModalCounts:[...new Set(counts)]});
}
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',chromiumSandbox:true,args:['--disable-setuid-sandbox'],env:{...process.env,XDG_CONFIG_HOME:resolve('.sites-runtime/config'),XDG_CACHE_HOME:resolve('.sites-runtime/cache')}});
 for(const variant of ['movefield','grizzly']){
  const app=await buildApp(variant),context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',error=>errors.push({variant,message:error.stack||error.message}));
  try{await page.goto(app.url+'?os=ios');await scenario(page,variant);results.at(-1).bundleSHA256=app.bundleSHA256;console.log('PASS '+variant+' native menu and settings preservation boundary')}
  catch(error){await page.screenshot({path:resolve(app.dir,'failure.png'),fullPage:true});await writeFile(resolve(app.dir,'failure.json'),JSON.stringify({error:String(error),body:await page.locator('body').innerText(),errors},null,2));throw error}
  finally{await context.close();await new Promise(done=>app.server.close(done))}
 }
 assert.deepEqual(errors,[]);for(const [file,hash]of Object.entries(sourceHashes))assert.equal(sha(await readFile(file)),hash,'Source changed during qualification: '+file);complete=true;
}finally{
 await browser?.close();await writeFile(resolve(out,'results.json'),JSON.stringify({checkedAt:new Date().toISOString(),complete,scope:'Actual native App callbacks through RNWeb, Platform.OS=ios with delayed Modal.onDismiss. Synthetic persistent storage plus real saved-data/durable-state validation; crypto/file/notification/font/service boundaries mocked. No UIKit, native OS, physical-device or installed-update claim.',sourceHashes,results,errors},null,2)+'\n');
}
