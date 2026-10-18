// Actual settings callbacks with synthetic preference/OS boundaries. Theme
// checks cover every shipped palette; no installed-device qualification.
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),crypto=require('node:crypto');
const {harness}=require('./check-native-interactions.cjs');
const compile=(file,mocks)=>{const module={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(name=>{assert.ok(name in mocks,'Unexpected dependency '+name);return mocks[name]},module,module.exports);return module.exports};
const luminance=hex=>{const channels=[1,3,5].map(n=>parseInt(hex.slice(n,n+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const cases=[];let pairs=0;
function brand(variant){const B={isGrizzly:variant==='grizzly',brand:{name:variant==='grizzly'?'Grizzly Fitness':'Movefield'}},P=compile('lib/app-preferences.ts',{'./brand':B}),C=compile('lib/interface-theme.ts',{'./brand':B,'./app-preferences':P});return {B,P,C}}
function settings(variant,privateProfile=true){
 const {B,P,C}=brand(variant);let p={...P.defaultPreferences},permissionReads=0;const updates=[],sentinel=name=>({type:name,props:{}});
 const h=harness('mobile/src/settings.tsx',{reminderMessage:'',profile:sentinel('ProfileSentinel'),children:privateProfile?sentinel('AccountSentinel'):false,footer:privateProfile?sentinel('BackupSentinel'):false},{
  './appearance':{useNativeAppearance:()=>({p,ready:true,fonts:true,headingFamily:'Inter',error:'',colors:C.interfaceColors(p,p.mode==='dark'),update:patch=>{updates.push(patch);p=P.readPreferences(JSON.stringify({...p,...patch}))}})},
  './phone-ui':{NativeFlowScreen:'FlowScreen',NativeSection:'Section',NativeSettingsRow:'Row',NativeActionFooter:'ActionFooter',NativeChoiceButton:'Choice'},
  './shared/app-preferences':P,'./shared/brand':B,'expo-linear-gradient':{LinearGradient:'Gradient'},'./grizzly-font-assets':{loadGrizzlyFontGallery:async()=>{}},
  './workout-notifications':{enableWorkoutReminders:async()=>{permissionReads++;return {enabled:false,message:'Synthetic denied permission'}}},
 });
 const invoke=async node=>{assert.ok(node,'Expected a reachable control');await node.props.onPress();h.render();await h.flush()};
 return {h,get p(){return p},updates,get permissionReads(){return permissionReads},invoke,async press(label){await h.press(label);h.render();await h.flush()},tab:label=>invoke(h.find(n=>n.props.accessibilityRole==='tab'&&n.props.accessibilityLabel===label))};
}
async function test(name,fn){await fn();cases.push(name);console.log('PASS '+name)}
(async()=>{
 await test('Every palette keeps normal reading, selected controls and hero text legible in both modes/styles',()=>{
  for(const variant of ['movefield','grizzly']){const {P,C}=brand(variant);for(const palette of P.palettes)for(const dark of [false,true])for(const grizzlyStyle of ['clean','wild'])for(const high of [false,true]){
   const p={...P.defaultPreferences,palette:palette.id,grizzlyStyle,contrast:high},before=JSON.stringify(p),c=C.interfaceColors(p,dark);
   for(const [ink,surface] of [['ink','bg'],['ink','white'],['muted','white'],['ink','soft'],['onAccent','green'],['heroInk','heroFrom'],['heroInk','heroTo'],['heroMuted','heroFrom'],['heroMuted','heroTo'],['heroOnButton','heroButton']]){assert.ok(contrast(c[ink],c[surface])>=4.5,`${variant}/${palette.id}/${dark}/${grizzlyStyle}/${high}: ${ink}/${surface}`);pairs++}
   assert.equal(JSON.stringify(p),before);if(high)assert.equal(c.heroFrom,c.heroTo,'Higher contrast removes hero gradient');
  }}
 });
 await test('Appearance is immediately available; display, text, palette and font choices return with Done',async()=>{
  for(const variant of ['movefield','grizzly']){const f=settings(variant);await f.h.flush();assert.equal(f.h.find(n=>n.type==='FlowScreen').props.title,'Settings');assert.ok(f.h.find(n=>n.props.label==='Color palette'));assert.ok(f.h.find(n=>n.props.label==='Standard'));assert.equal(f.h.all(n=>['AccountSentinel','BackupSentinel','ProfileSentinel'].includes(n.type)).length,0);
   await f.press('Dark');assert.equal(f.p.mode,'dark');await f.press('Larger');assert.equal(f.p.textSize,130);await f.press('Color palette');const choice=f.h.find(n=>n.props.accessibilityRole==='radio'&&n.props.accessibilityLabel==='Ocean blue');await f.invoke(choice);assert.equal(f.p.palette,'ocean');await f.press('Done');assert.equal(f.h.find(n=>n.type==='FlowScreen').props.title,'Settings');
   if(variant==='grizzly'){await f.press('Heading font');await f.press('Readable');await f.invoke(f.h.find(n=>n.props.accessibilityLabel==='Use Inter'));assert.equal(f.p.headingFont,'inter');await f.press('Done');assert.equal(f.h.find(n=>n.type==='FlowScreen').props.title,'Settings')}
   assert.equal(f.permissionReads,0,'Appearance never requests OS permission');
  }
 });
 await test('Account and backup children mount only on their explicit private route; sample excludes them',async()=>{
  for(const variant of ['movefield','grizzly'])for(const privateProfile of [false,true]){const f=settings(variant,privateProfile);await f.h.flush();await f.tab('Profile & data');assert.equal(!!f.h.find(n=>n.props.label==='Account'),privateProfile);assert.equal(!!f.h.find(n=>n.props.label==='Backup & data'),privateProfile);assert.equal(f.h.all(n=>['AccountSentinel','BackupSentinel'].includes(n.type)).length,0);
   if(privateProfile){await f.press('Account');assert.equal(f.h.all(n=>n.type==='AccountSentinel').length,1);assert.equal(f.h.all(n=>n.type==='BackupSentinel').length,0);await f.press('Back');await f.press('Backup & data');assert.equal(f.h.all(n=>n.type==='BackupSentinel').length,1);assert.equal(f.h.all(n=>n.type==='AccountSentinel').length,0)}
   assert.equal(f.updates.length,0,'Browsing records/account routes changes no preferences');
  }
 });
 await test('Training choices preserve authority; reminders request permission only on enable and validate local time',async()=>{
  for(const variant of ['movefield','grizzly']){const f=settings(variant);await f.h.flush();await f.tab('Training');await f.press('Open coaching when I choose');assert.equal(f.p.coaching,'manual');assert.equal(f.permissionReads,0);await f.press('Workout reminders');await f.press('Enable workout reminders');assert.equal(f.permissionReads,1);assert.equal(f.p.reminders,false);assert.match(f.h.text(),/Synthetic denied permission/);
   f.h.find(n=>n.props.accessibilityLabel==='Workout reminder time').props.onChangeText('25:99');await f.h.flush();const before=f.p.reminderTime;await f.press('Save reminder time');assert.equal(f.p.reminderTime,before);assert.match(f.h.text(),/Use a time such as/);f.h.find(n=>n.props.accessibilityLabel==='Workout reminder time').props.onChangeText('07:30');await f.h.flush();await f.press('Save reminder time');assert.equal(f.p.reminderTime,'07:30');
  }
 });
 const sourceFiles=['lib/interface-theme.ts','mobile/src/appearance.tsx','mobile/src/phone-ui.tsx','mobile/src/settings.tsx','mobile/src/exercise-guide-screen.tsx','mobile/src/science-runtime.js','scripts/check-native-settings-web-parity.cjs'];
 fs.mkdirSync('.sites-runtime/native-web-parity-2026-10-18',{recursive:true});fs.writeFileSync('.sites-runtime/native-web-parity-2026-10-18/settings-callbacks.json',JSON.stringify({checkedAt:new Date().toISOString(),cases,contrastPairs:pairs,sourceHashes:Object.fromEntries(sourceFiles.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),scope:'Actual Settings JSX callbacks with mocked native preferences and permission boundary; canonical palette/reading contrast checks. No device, OS permission delivery, rendered-layout or cross-client sync qualification.'},null,2)+'\n');console.log(`PASS ${cases.length} settings groups and ${pairs} theme contrast pairs`);
})().catch(error=>{console.error(error);process.exitCode=1});
