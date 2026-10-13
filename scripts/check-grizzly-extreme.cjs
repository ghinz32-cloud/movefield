const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),ts=require('typescript');
const {load}=require('./domain-test-loader.cjs');
const P=load('lib/app-preferences.ts'),policy=load('grizzly/interaction-policy.ts'),receipt=JSON.parse(fs.readFileSync('docs/grizzly-extreme-fonts-2026-10-13.json'));
const cases=[];function test(name,fn){fn();cases.push(name);console.log('PASS '+name)}
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
test('35 unique choices retain all 15 older persisted font IDs',()=>{
 assert.equal(P.headingFonts.length,35);assert.equal(P.extremeHeadingFonts.length,20);assert.equal(P.headingFonts.filter(f=>f.group==='wild').length,30);
 assert.equal(new Set(P.headingFonts.map(f=>f.id)).size,35);
 for(const font of P.headingFonts)assert.equal(P.readPreferences(JSON.stringify({headingFont:font.id,headingFontVersion:2})).headingFont,font.id);
 assert.equal(P.readPreferences('{"headingFont":"beast"}').headingFont,process.env.EXPO_PUBLIC_APP_VARIANT==='grizzly'?'metal':'barlow');
 assert.equal(P.defaultPreferences.headingFont,process.env.EXPO_PUBLIC_APP_VARIANT==='grizzly'?'frijole':'barlow');
});
test('Every new face is pinned, licensed, and byte-identical on web and native',()=>{
 assert.equal(receipt.fonts.length,20);for(const font of receipt.fonts){
  assert.match(font.repository_revision,/^[a-f0-9]{40}$/);assert.ok(font.font_url.includes(font.repository_revision));
  const web=fs.readFileSync('public/fonts/'+font.file),native=fs.readFileSync('mobile/assets/fonts/'+font.file),license=fs.readFileSync('public/fonts/'+font.notice);
  assert.deepEqual(web,native);assert.equal(web.length,font.bytes);assert.equal(sha(web),font.sha256);assert.equal(sha(license),font.license_sha256);assert.match(license.toString(),/SIL OPEN FONT LICENSE/);
  assert.deepEqual(license,fs.readFileSync('mobile/assets/fonts/'+font.notice));
 }
});
test('Wild and OG respect quiet styles, both motion preferences, contrast and hidden state',()=>{
 for(const style of ['wild','og','clean','unknown'])for(const reduce of [false,true])for(const contrast of [false,true])for(const system of [false,true])for(const hidden of [false,true])assert.equal(policy.wildMotionAllowed(style,reduce,contrast,system,hidden),['wild','og'].includes(style)&&!reduce&&!contrast&&!system&&!hidden);
 assert.deepEqual(policy.impactPoint(-1,999,320,600),{x:0,y:600});assert.deepEqual(policy.impactPoint(NaN,Infinity,320,600),{x:160,y:300});
 assert.equal(policy.impactParticles.length,10);assert.ok(policy.impactParticles.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<100&&Math.abs(p.y)<100));
});
function compile(file,mocks){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;new Function('require','module','exports',code)(name=>name in mocks?mocks[name]:require(name),module,module.exports);return module.exports}
test('Actual delegated controller caps effects, skips disabled/repeated actions and releases listeners',()=>{
 const original=new Map(['document','matchMedia','Element','PointerEvent','KeyboardEvent','innerWidth','innerHeight'].map(k=>[k,global[k]]));
 const listeners=new Map(),mediaListeners=new Map(),cleanups=[],animations=[];let impacts=[],system=false;
 class Element{constructor(disabled=false){this.disabled=disabled}closest(selector){return selector.includes('[disabled]')?(this.disabled?this:null):this}getBoundingClientRect(){return {left:40,top:60,width:100,height:44}}animate(){const animation={cancelled:false,cancel(){this.cancelled=true},finished:new Promise(()=>{})};animations.push(animation);return animation}}
 class PointerEvent{constructor(target,isPrimary=true){Object.assign(this,{target,isPrimary,clientX:80,clientY:82})}}
 class KeyboardEvent{constructor(target,key,repeat=false){Object.assign(this,{target,key,repeat})}}
 const media={get matches(){return system},addEventListener:(n,fn)=>mediaListeners.set(n,fn),removeEventListener:(n,fn)=>{assert.equal(mediaListeners.get(n),fn);mediaListeners.delete(n)}};
 try{
  Object.assign(global,{Element,PointerEvent,KeyboardEvent,innerWidth:320,innerHeight:600,document:{hidden:false,addEventListener:(n,fn)=>listeners.set(n,fn),removeEventListener:(n,fn)=>{assert.equal(listeners.get(n),fn);listeners.delete(n)},querySelector:()=>new Element()},matchMedia:()=>media});
  const R={useRef:value=>({current:value}),useState:()=>[[],value=>impacts=typeof value==='function'?value(impacts):value],useEffect:fn=>cleanups.push(fn())};
  const C=compile('grizzly/interactions.tsx',{'react':R,'../components/app-preferences':{useAppPreferences:()=>({ready:true,p:{grizzlyStyle:'wild',reduceMotion:false,contrast:false}})},'./grizzly-mark':{GrizzlyPaw:()=>null},'./interaction-policy':policy});C.GrizzlyInteractions();
  assert.equal(listeners.size,3);const pointer=listeners.get('pointerdown'),keyboard=listeners.get('keydown');
  pointer(new PointerEvent(new Element(true)));pointer(new PointerEvent(new Element(),false));keyboard(new KeyboardEvent(new Element(),'Enter',true));keyboard(new KeyboardEvent(new Element(),'ArrowDown'));assert.equal(impacts.length,0);
  for(let n=0;n<8;n++)pointer(new PointerEvent(new Element()));assert.equal(impacts.length,3);assert.equal(animations.length,16);
  keyboard(new KeyboardEvent(new Element(),' '));assert.equal(impacts.length,3);
  system=true;mediaListeners.get('change')();assert.equal(impacts.length,0);assert.ok(animations.every(a=>a.cancelled));
  pointer(new PointerEvent(new Element()));assert.equal(impacts.length,0);for(const cleanup of cleanups)cleanup();assert.equal(listeners.size,0);assert.equal(mediaListeners.size,0);
 }finally{for(const [key,value] of original){if(value===undefined)delete global[key];else global[key]=value}}
});
test('Actual native Wild and OG wrappers preserve actions, transforms, ref, roles and quiet paths',()=>{
 let appearance={p:{grizzlyStyle:'wild',contrast:false},reduceMotion:false,active:true,colors:{effect:'#b20f25'}},calls=[],timings=[];
 class Value{constructor(value){this.value=value}stopAnimation(){}setValue(value){this.value=value}interpolate(){return 1}}
 const Native={Pressable:'NativePressable',View:'NativeView',StyleSheet:{create:v=>v,absoluteFill:{position:'absolute'},flatten:v=>Array.isArray(v)?Object.assign({},...v):v},Animated:{Value,View:'AnimatedView',timing:(v,opts)=>{timings.push(opts);return {start:()=>{}}}},Easing:{out:v=>v,cubic:()=>{},back:()=>{}}};
 const R={__esModule:true,default:{},forwardRef:fn=>fn,useRef:v=>({current:v}),useState:v=>[typeof v==='function'?v():v,()=>{}],useEffect:fn=>fn()};
 const C=compile('mobile/src/wild-interactions.tsx',{'react':R,'react-native':Native,'./shared/brand':{isGrizzly:true},'./appearance':{useNativeAppearance:()=>appearance}});
 const event={nativeEvent:{locationX:10,locationY:12}},ref={current:null},press=e=>calls.push(e),pressIn=()=>{},pressOut=()=>{};
 const style={transform:[{translateX:7}],padding:12};
 for(const grizzlyStyle of ['wild','og']){
  appearance={...appearance,p:{grizzlyStyle,contrast:false},reduceMotion:false,active:true};
  const outer=C.GrizzlyPressable({onPress:press,onPressIn:pressIn,onPressOut:pressOut,style,accessibilityRole:'button',children:'Save'},ref),inner=outer.type(outer.props);
  assert.equal(inner.props.ref,ref);assert.equal(inner.props.accessibilityRole,'button');assert.equal(inner.props.onPressIn,pressIn);assert.equal(inner.props.onPressOut,pressOut);
  const before=calls.length;inner.props.onPress(event);assert.equal(calls.length,before+1);assert.equal(calls.at(-1),event);
  assert.equal(timings.at(-1).useNativeDriver,true);assert.equal(timings.at(-1).isInteraction,false);
  const pressed=inner.props.style({pressed:true});assert.equal(pressed[0],style);assert.deepEqual(pressed[1].transform[0],{translateX:7});assert.deepEqual(style,{transform:[{translateX:7}],padding:12});
  for(const quiet of [{reduceMotion:true},{active:false},{p:{grizzlyStyle,contrast:true}}]){
   const base=appearance;appearance={...base,...quiet};const count=timings.length,actionCount=calls.length;
   const quietOuter=C.GrizzlyPressable({onPress:press,style},ref),quietInner=quietOuter.type(quietOuter.props);quietInner.props.onPress(event);
   assert.equal(timings.length,count);assert.equal(calls.length,actionCount+1);assert.equal(quietInner.props.style({pressed:true})[1],null);appearance=base;
  }
  for(const props of [{disabled:true},{accessibilityState:{disabled:true}}]){
   const count=timings.length,disabled=C.GrizzlyPressable({...props,onPress:press},ref);disabled.type(disabled.props).props.onPress(event);assert.equal(timings.length,count);
  }
 }
 assert.equal(timings.length,2);assert.ok(timings[1].duration<timings[0].duration,'OG uses a shorter impact than Wild');
 appearance={...appearance,p:{grizzlyStyle:'clean',contrast:false}};const clean=C.GrizzlyPressable({onPress:press},ref);assert.equal(clean.type,'NativePressable');assert.equal(clean.props.onPress,press);
 const move=compile('mobile/src/wild-interactions.tsx',{'react':R,'react-native':Native,'./shared/brand':{isGrizzly:false},'./appearance':{useNativeAppearance:()=>({...appearance,p:{grizzlyStyle:'og',contrast:false}})}}).GrizzlyPressable({onPress:press,accessibilityRole:'button'},ref);assert.equal(move.type,'NativePressable');assert.equal(move.props.ref,ref);assert.equal(move.props.onPress,press);
});
fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync('.sites-runtime/grizzly-extreme-checks.json',JSON.stringify({checkedAt:new Date().toISOString(),scope:'Actual shared policy/controller/native wrapper with synthetic DOM and OS/animation boundaries; immutable font/license bytes. No browser layout, physical phone, screen-reader or battery qualification.',cases},null,2)+'\n');console.log('PASS '+cases.length+' extreme Grizzly groups');
