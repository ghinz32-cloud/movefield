const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const moduleUnderTest = {exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('lib/offline-registration.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(moduleUnderTest,moduleUnderTest.exports);
const {watchOfflineApp}=moduleUnderTest.exports;
class Worker extends EventTarget { constructor(state){super();this.state=state;} change(state){this.state=state;this.dispatchEvent(new Event('statechange'));} }
class Registration extends EventTarget {active=null;waiting=null;installing=null;}
class Container extends EventTarget {constructor(registration){super();this.registration=registration;}async register(url,options){assert.equal(url,'/grizzly/movefield-sw.js');assert.deepEqual(options,{updateViaCache:'none'});return this.registration;}}
async function start(registration){const states=[],container=new Container(registration);let ready=0,errors=0;const stop=watchOfflineApp(container,'/grizzly/movefield-sw.js',{onReady:()=>ready++,onUpdateWaiting:value=>states.push(value),onError:()=>errors++});await Promise.resolve();return {container,states,stop,get ready(){return ready;},get errors(){return errors;}};}
(async()=>{
 const registration=new Registration(),initial=new Worker('installing');registration.installing=initial;const first=await start(registration);assert.deepEqual(first.states,[false]);assert.equal(first.ready,0);
 registration.installing=null;registration.waiting=initial;initial.change('installed');assert.equal(first.states.at(-1),false);
 registration.waiting=null;registration.active=initial;initial.change('activating');assert.equal(first.states.at(-1),false);assert.equal(first.ready,0);initial.change('activated');assert.equal(first.ready,1);assert.equal(first.states.at(-1),false);
 const replacement=new Worker('installing');registration.installing=replacement;registration.dispatchEvent(new Event('updatefound'));assert.equal(first.states.at(-1),false);registration.installing=null;registration.waiting=replacement;replacement.change('installed');assert.equal(first.states.at(-1),true);
 registration.waiting=null;registration.active=replacement;replacement.change('activated');first.container.dispatchEvent(new Event('controllerchange'));assert.equal(first.states.at(-1),false,'An activated update must clear the stale notice');assert.equal(first.ready,1);
 const length=first.states.length;first.stop();replacement.change('redundant');first.container.dispatchEvent(new Event('controllerchange'));assert.equal(first.states.length,length,'Unmount removes lifecycle listeners');
 const failed=new Registration(),badWorker=new Worker('installing');failed.installing=badWorker;const failure=await start(failed);failed.installing=null;badWorker.change('redundant');assert.equal(failure.errors,1);assert.equal(failure.ready,0);failure.stop();
 const existing=new Registration();existing.active=new Worker('activated');existing.waiting=new Worker('installed');const pending=await start(existing);assert.equal(pending.states.at(-1),true);assert.equal(pending.ready,1);pending.stop();
 let resolve;const late=new Container(new Promise(r=>resolve=r)),calls=[];const dispose=watchOfflineApp(late,'/grizzly/movefield-sw.js',{onReady:()=>calls.push('ready'),onUpdateWaiting:()=>calls.push('update'),onError:()=>calls.push('error')});dispose();resolve(existing);await Promise.resolve();await Promise.resolve();assert.deepEqual(calls,[],'A registration resolving after unmount must not notify');
 console.log('PASS offline lifecycle: initial installation, exact-registration readiness, waiting update, activation clears notice, failed installation, pending update, and listener/late-resolution cleanup');
})().catch(error=>{console.error(error);process.exitCode=1});
