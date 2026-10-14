// Execute native controls with deterministic hook/OS boundaries; no installed-device claim.
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const {harness}=require('./check-native-interactions.cjs');
async function numericJourney(){
 const values=[],props={value:null,min:-100,max:100,onValueChange:value=>{values.push(value);props.value=value}};
 const control=harness('mobile/src/numeric-input.tsx',props);await control.flush();
 const input=()=>control.find(node=>node.type==='TextInput');
 const type=async text=>{input().props.onChangeText(text);await control.flush()};
 await type('-');assert.equal(input().props.value,'-');assert.deepEqual(values,[],'A sign draft cannot become an actual measurement');
 await type('-1');await type('-1.');assert.equal(input().props.value,'-1.','Decimal point must survive a controlled rerender');
 await type('-1.5');assert.equal(props.value,-1.5);await type('-1,75');assert.equal(props.value,-1.75);
 await type('-101');assert.equal(props.value,-1.75,'Out-of-range drafts cannot overwrite valid measurements');
 await type('');assert.equal(props.value,null,'Unknown remains distinct from zero');await type('0');assert.equal(props.value,0);
 props.value=20;control.render();await control.flush();assert.equal(input().props.value,'20','External replacements update the draft');
 const positive={value:8,nullable:false,max:9999,onValueChange:value=>{positive.value=value}};
 const amount=harness('mobile/src/numeric-input.tsx',positive);await amount.flush();
 amount.find(node=>node.type==='TextInput').props.onChangeText('');await amount.flush();assert.equal(positive.value,0);assert.equal(amount.find(node=>node.type==='TextInput').props.value,'');
 amount.find(node=>node.type==='TextInput').props.onChangeText('-');await amount.flush();assert.equal(positive.value,0,'Unsigned amounts reject negative drafts');
}
async function accountJourney(){
 for(const [name,callback] of [['Movefield','movefield://'],['Grizzly Fitness','grizzlyfitness://']]){
  const calls=[];const account=harness('mobile/src/cloud-account.tsx',{state:{profile:{age:28}},onRestore:async()=>false},{
   'expo-constants':{default:{executionEnvironment:'standalone'},__esModule:true},'expo-crypto':{randomUUID:()=> 'synthetic'},
   './shared/brand':{brand:{name}},'./cloud-client':{nativeAuthEnabled:true,nativeCallbackURL:callback,nativeCloudRequest:async()=>({accounts:true}),nativeAuth:()=>({getSession:async()=>({data:{user:null}}),signIn:{social:async options=>{calls.push(options);return {}}}})},
   './appearance':{useNativeAppearance:()=>({p:{textSize:100},colors:{ink:'#111',line:'#aaa',danger:'#900'}})},
   './storage':{nativeOutbox:{read:async()=>null}},'./cloud-vault':{},'./cloud-highlights':{NativeCloudHighlights:'Highlights'},'./account-sessions':{NativeAccountSessions:'Sessions'},'./account-button':{NativeAccountButton:'AccountButton'},
  });
  await account.flush();await account.press('Sign in with Google');assert.deepEqual(calls,[{provider:'google',callbackURL:callback}],name+' must request its own callback');
 }
}
function keyboardJourney(){
 const source=ts.createSourceFile('App-runtime.js',fs.readFileSync('mobile/App-runtime.js','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),nodes=[];
 function visit(node){nodes.push(node);ts.forEachChild(node,visit)}visit(source);
 const modal=nodes.find(node=>ts.isFunctionDeclaration(node)&&node.name.text==='ModalFrame');
 const jsx=(type,props)=>({type,props});
 for(const os of ['ios','android']){
  const frame=new Function('_reactNative','_reactJsxRuntime','_srcAppearance','_reactNativeSafeAreaContext','baseStyles','GrizzlyPressable','return ('+modal.getText(source)+')')(
   {Modal:'Modal',View:'View',Text:'Text',ScrollView:'ScrollView',KeyboardAvoidingView:'KeyboardAvoidingView',Platform:{OS:os}},
   {jsx,jsxs:jsx},{useThemedStyles:()=>({flex:{flex:1}}),useNativeAppearance:()=>({colors:{},reduceMotion:true})},{SafeAreaView:'SafeAreaView'},{},'Pressable');
  const tree=frame({visible:true,close(){},title:'Edit workout',children:'form'}),header=tree.props.children.props.children,keyboard=header[1];
  assert.equal(keyboard.type,'KeyboardAvoidingView');assert.equal(keyboard.props.behavior,os==='ios'?'padding':undefined);
  assert.equal(keyboard.props.children.props.keyboardShouldPersistTaps,'handled');assert.equal(header[0].props.children[1].props.style.minHeight,48);
 }
}
(async()=>{await numericJourney();await accountJourney();keyboardJourney();console.log('PASS native decimal/sign drafts, null/zero and bounds, both sign-in callbacks, and iOS modal keyboard configuration. Hook/OS boundaries mocked; no device claim.');})().catch(error=>{console.error(error);process.exitCode=1});
