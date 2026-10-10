const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
const root=path.resolve(process.argv[2]||path.resolve(__dirname,'..')),req=createRequire(path.join(root,'package.json')),ts=req('typescript');
const source=ts.transpileModule(fs.readFileSync(path.join(root,'mobile/src/workout-notifications.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const results=[];
async function scenario({failCancel=false,failListShown=false,enabled=false}={}){
 const attempts=[],messages=[],newSchedules=[];
 const scheduled=['old1','old2','old3'].map(identifier=>({identifier,content:{data:{kind:'training-workout'}}})).concat({identifier:'unrelated',content:{data:{kind:'another-feature'}}});
 const shown=['visible1','visible2'].map(identifier=>({request:{identifier,content:{data:{kind:'training-workout'}}}})).concat({request:{identifier:'visible-unrelated',content:{data:{kind:'another-feature'}}}});
 const notify={getAllScheduledNotificationsAsync:async()=>scheduled,getPresentedNotificationsAsync:async()=>{if(failListShown)throw Error('list shown refused');return shown},cancelScheduledNotificationAsync:async id=>{attempts.push('cancel:'+id);if(failCancel&&id==='old1')throw Error('one cancellation refused')},dismissNotificationAsync:async id=>{attempts.push('dismiss:'+id)},getPermissionsAsync:async()=>({granted:true}),setNotificationChannelAsync:async()=>{},scheduleNotificationAsync:async value=>{newSchedules.push(value)},AndroidImportance:{DEFAULT:3},AndroidNotificationVisibility:{PRIVATE:0},SchedulableTriggerInputTypes:{DATE:'date'},IosAuthorizationStatus:{PROVISIONAL:3}};
 const native={Platform:{OS:'android'},AppState:{addEventListener:()=>({remove(){}})}};
 const hooks={useState:()=>['',value=>messages.push(value)],useEffect:fn=>fn()};
 const m={exports:{}};new Function('require','module','exports',source)(s=>s==='react'?hooks:s==='react-native'?native:s==='expo-notifications'?notify:s.endsWith('workout-reminders')?{workoutReminderKind:'training-workout',workoutReminders:()=>enabled?[{id:'new-day',date:'2026-10-20',at:Date.now()+100000}]:[]}:s.endsWith('brand')?{brand:{name:'Movefield'}}:req(s),m,m.exports);
 m.exports.useNativeWorkoutReminders({plan:null,history:[],events:[],active:null},{reminders:enabled,reminderTime:'18:00'},true);
 for(let i=0;i<10;i++)await new Promise(resolve=>setImmediate(resolve));
 return {attempts,messages,newSchedules,allowed:m.exports.isWorkoutNotificationAllowed('new-day')};
}
async function test(name,fn){try{await fn();results.push({name,pass:true})}catch(e){results.push({name,pass:false,error:e.message})}}
(async()=>{
 await test('Off attempts every owned cancellation and dismissal even if the first fails',async()=>{const x=await scenario({failCancel:true});assert.deepEqual(x.attempts.filter(s=>s.startsWith('cancel:')).sort(),['cancel:old1','cancel:old2','cancel:old3']);assert.deepEqual(x.attempts.filter(s=>s.startsWith('dismiss:')).sort(),['dismiss:visible1','dismiss:visible2']);assert.ok(!x.attempts.some(s=>s.includes('unrelated')));assert.equal(x.newSchedules.length,0);assert.ok(x.messages.some(s=>/could not|unable|older|remain|failed/i.test(s)))});
 await test('A presented-alert enumeration failure still cancels all known scheduled alerts',async()=>{const x=await scenario({failListShown:true});assert.deepEqual(x.attempts.filter(s=>s.startsWith('cancel:')).sort(),['cancel:old1','cancel:old2','cancel:old3']);assert.equal(x.newSchedules.length,0)});
 await test('Failed cleanup does not create additional schedules or foreground authorization',async()=>{const x=await scenario({enabled:true,failCancel:true});assert.equal(x.newSchedules.length,0);assert.equal(x.allowed,false)});
 await test('Successful cleanup refreshes the selected day and reports true schedule status',async()=>{const x=await scenario({enabled:true});assert.equal(x.newSchedules.length,1);assert.equal(x.newSchedules[0].identifier,'new-day');assert.equal(x.allowed,true);assert.ok(x.messages.some(s=>/1 workout days scheduled/.test(s)))});
 console.log(JSON.stringify({passed:results.filter(x=>x.pass).length,total:results.length,results},null,2));if(results.some(x=>!x.pass))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
