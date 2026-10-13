const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const {load}=require('./domain-test-loader.cjs');
const P=load('lib/app-preferences.ts'),B=load('lib/brand.ts'),policy=load('grizzly/interaction-policy.ts');
const cases=[],contrast=[];let displayedFilesChecked=0;
function test(name,fn){fn();cases.push(name);console.log('PASS '+name)}
function compile(file,mocks){const module={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(name=>name in mocks?mocks[name]:require(name),module,module.exports);return module.exports}

test('Saved styles remain explicit and older automatic fonts retain their existing migration',()=>{
 assert.equal(P.defaultPreferences.grizzlyStyle,B.isGrizzly?'wild':'clean');
 assert.equal(P.defaultPreferences.headingFont,B.isGrizzly?'frijole':'barlow');
 for(const style of ['wild','clean']){
  const saved={...P.defaultPreferences,grizzlyStyle:style,headingFont:'rocker',headingFontVersion:2,palette:'rose',mode:'light',textSize:130,reduceMotion:true};
  assert.deepEqual(P.readPreferences(JSON.stringify(saved)),saved);
 }
 assert.equal(P.readPreferences('{"headingFont":"rocker"}').headingFont,B.isGrizzly?'metal':'rocker');
 assert.equal(P.readPreferences('{"headingFont":"beast"}').headingFont,B.isGrizzly?'metal':'barlow');
 assert.equal(P.readPreferences('{"grizzlyStyle":"invalid"}').grizzlyStyle,P.defaultPreferences.grizzlyStyle);
 assert.deepEqual(P.readPreferences(null),P.defaultPreferences);
 for(const mode of ['light','dark','system']){
  const saved={...P.defaultPreferences,grizzlyStyle:'og',headingFont:'bungee',palette:'og',mode};
  const reopened=P.readPreferences(JSON.stringify(saved));
  assert.equal(reopened.grizzlyStyle,B.isGrizzly?'og':P.defaultPreferences.grizzlyStyle);
  assert.equal(reopened.palette,B.isGrizzly?'og':P.defaultPreferences.palette);
  assert.equal(reopened.headingFont,'bungee');assert.equal(reopened.mode,mode);
 }
 assert.equal(P.palettes.some(p=>p.id==='og'),B.isGrizzly,'OG palette is confined to Grizzly');
});

test('Actual appearance actions persist through the browser helper without touching training or other profiles',()=>{
 const originals=new Map(['window','localStorage'].map(key=>[key,global[key]])),events=new Map();
 const values=new Map([
  ['training-studio-v2','Synthetic original training and timer'],['grizzly-training-studio-v2','Synthetic Grizzly training and timer'],
  ['movefield-review-training-studio-v2','Synthetic review training and timer'],['movefield-review-training-studio:preferences:v1','Synthetic review appearance'],
  [B.isGrizzly?'training-studio:preferences:v1':'grizzly-fitness:preferences:v1','Synthetic other-brand appearance'],
 ]),untouched=new Map(values);
 let failWrite=false,notifications=0;
 try{
  global.window={addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:(name,fn)=>{assert.equal(events.get(name),fn);events.delete(name)}};
  global.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>{if(failWrite)throw Error('Synthetic quota failure');values.set(key,value)}};
  const helper=load('lib/browser-preferences.ts');assert.deepEqual(helper.browserPreferences().p,P.defaultPreferences);
  const stop=helper.subscribePreferences(()=>{notifications++});assert.equal(events.size,1);
  if(B.isGrizzly){
   const buttonNames=['OG Grizzly','Wild Grizzly','Clean & readable'];
   const controls=compile('grizzly/style-controls.tsx',{'../lib/app-preferences':P,'../components/ui/button':{Button:'Button'},'../components/ui/select':Object.fromEntries(['Select','SelectTrigger','SelectValue','SelectContent','SelectItem','SelectGroup','SelectLabel'].map(name=>[name,name]))});
   const nodes=[];const visit=node=>{if(Array.isArray(node))return node.forEach(visit);if(node&&typeof node==='object'){nodes.push(node);visit(node.props?.children)}};
   visit(controls.GrizzlyStyleControls({p:helper.browserPreferences().p,update:helper.updateBrowserPreferences}));
   for(const name of buttonNames){
    const button=nodes.find(node=>node.type==='Button'&&node.props['aria-label']===name);assert.ok(button,'Missing actual preset '+name);button.props.onClick();
    const stored=P.readPreferences(values.get(P.preferenceKey));assert.deepEqual(helper.browserPreferences().p,stored);
    assert.equal(stored.grizzlyStyle,name==='OG Grizzly'?'og':name==='Wild Grizzly'?'wild':'clean');
    if(name==='OG Grizzly'){assert.equal(stored.palette,'og');assert.equal(stored.headingFont,'bungee');assert.equal(stored.mode,'dark');}
    if(name==='Wild Grizzly'){assert.equal(stored.palette,'pine');assert.equal(stored.headingFont,'frijole');assert.equal(stored.mode,'dark');}
   }
   nodes.find(node=>node.type==='Button'&&node.props['aria-label']==='OG Grizzly').props.onClick();
   nodes.find(node=>node.type==='Button'&&node.props['aria-label']==='Clean & readable').props.onClick();
   assert.equal(helper.browserPreferences().p.grizzlyStyle,'clean');
   assert.equal(helper.browserPreferences().p.palette,'og','Clean retains the selected monochrome palette');
   const palette=P.palettes.find(color=>color.id==='og');
   const rule=fs.readFileSync('grizzly/grizzly.css','utf8').match(/:root\[data-brand=grizzly\]\[data-palette=og\]\{([^}]+)\}/);
   assert.ok(rule,'The retained/selectable OG palette needs an actual browser token rule');
   const tokens=Object.fromEntries([...rule[1].matchAll(/--([\w-]+):([^;{}]+)/g)].map(match=>[match[1],match[2]]));
   assert.deepEqual(tokens,{'brand-from':palette.from,'brand-to':palette.to,'brand-deep':palette.strong},'Browser and native palette values agree outside the fixed OG preset');
   nodes.find(node=>node.type==='Button'&&node.props['aria-label']==='OG Grizzly').props.onClick();
  }else{
   helper.updateBrowserPreferences({grizzlyStyle:'og',palette:'og'});assert.equal(helper.browserPreferences().p.grizzlyStyle,'clean');assert.equal(helper.browserPreferences().p.palette,'green');
  }
  const storedRaw=values.get(P.preferenceKey),stored=P.readPreferences(storedRaw);
  helper.updateBrowserPreferences({textSize:130,mode:'light'});assert.equal(P.readPreferences(values.get(P.preferenceKey)).textSize,130);
  if(B.isGrizzly)assert.equal(helper.browserPreferences().p.grizzlyStyle,'og');
  const beforeFailure=values.get(P.preferenceKey);failWrite=true;helper.updateBrowserPreferences({mode:'dark'});
  assert.equal(values.get(P.preferenceKey),beforeFailure);assert.equal(helper.browserPreferences().p.mode,'dark');assert.ok(helper.browserPreferences().saveError);
  failWrite=false;helper.updateBrowserPreferences({mode:'system'});assert.equal(helper.browserPreferences().saveError,'');
  values.set(P.preferenceKey,storedRaw);const before=notifications;events.get('storage')({key:'Unrelated synthetic key'});assert.equal(notifications,before);
  events.get('storage')({key:P.preferenceKey});assert.equal(notifications,before+1);assert.deepEqual(helper.browserPreferences().p,stored);
  values.delete(P.preferenceKey);events.get('storage')({key:P.preferenceKey});assert.deepEqual(helper.browserPreferences().p,P.defaultPreferences);
  for(const [key,value] of untouched)assert.equal(values.get(key),value,'Appearance altered another record: '+key);
  stop();assert.equal(events.size,0);
 }finally{for(const [key,value] of originals){if(value===undefined)delete global[key];else global[key]=value}}
});

function rgb(hex){assert.match(hex,/^#(?:[\da-f]{3}|[\da-f]{6})$/i);const raw=hex.slice(1);return (raw.length===3?[...raw].map(x=>x+x).join(''):raw).match(/../g).map(x=>parseInt(x,16))}
function luminance(hex){return rgb(hex).map(value=>{const v=value/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0)}
function ratio(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
test('Actual OG root tokens stay grayscale and meet text, control and focus contrast in four states',()=>{
 const css=fs.readFileSync('grizzly/og-grizzly.css','utf8').replace(/\/\*[\s\S]*?\*\//g,''),root=':root[data-brand=grizzly][data-grizzly-style=og]';
 const rules=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(match=>({selector:match[1].trim(),body:match[2]})).filter(rule=>[root,root+'.dark',root+'[data-contrast=true]',root+'.dark[data-contrast=true]'].includes(rule.selector));
 assert.equal(rules.length,4,'Expected separate base, dark and both higher-contrast root token rules');
 const grayscale=['brand-from','brand-to','brand-deep','background','foreground','ink','card','muted','secondary','muted-foreground','border','input','primary','primary-foreground','accent','accent-strong','soft-accent','warning-bg','warning-text','sidebar','sidebar-foreground','sidebar-accent','sidebar-accent-foreground','sidebar-border','sidebar-primary','sidebar-primary-foreground','sidebar-ring','lime','blue','chart-1','chart-2','chart-3','chart-5'];
 const pairs=[['foreground','background',4.5],['foreground','card',4.5],['muted-foreground','background',4.5],['muted-foreground','card',4.5],['primary-foreground','primary',4.5],['sidebar-foreground','sidebar',4.5],['sidebar-accent-foreground','sidebar-accent',4.5],['warning-text','warning-bg',4.5],['destructive','card',4.5],['input','card',3],['border','card',3],['ring','background',3],['ring','card',3]];
 for(const dark of [false,true])for(const highContrast of [false,true]){
  const tokens={};for(const rule of rules){if(rule.selector.includes('.dark')&&!dark||rule.selector.includes('[data-contrast=true]')&&!highContrast)continue;for(const declaration of rule.body.matchAll(/--([\w-]+)\s*:\s*(#[\da-f]+)\s*(?:;|$)/gi))tokens[declaration[1]]=declaration[2];}
  for(const token of grayscale){assert.ok(tokens[token],'Missing grayscale token '+token);const channels=rgb(tokens[token]);assert.ok(channels.every(x=>x===channels[0]),'Color leaked into surface/text token '+token);}
  for(const [foreground,background,min] of pairs){const actual=ratio(tokens[foreground],tokens[background]);contrast.push({mode:dark?'dark':'light',highContrast,foreground,background,ratio:+actual.toFixed(3),required:min});assert.ok(actual>=min,`${dark?'dark':'light'} contrast=${highContrast}: ${foreground}/${background} ${actual.toFixed(3)} < ${min}`);}
 }
});

test('Actual OG delegated effects leave actions untouched, skip forest shake and stop at quiet boundaries',()=>{
 const originals=new Map(['document','matchMedia','Element','PointerEvent','KeyboardEvent','innerWidth','innerHeight'].map(key=>[key,global[key]]));
 const listeners=new Map(),mediaListeners=new Map(),cleanups=[],animations=[];let impacts=[],systemReduce=false,forestLookups=0,actions=0;
 class Element{
  constructor(disabled=false){this.disabled=disabled}closest(selector){return selector.includes('[disabled]')?(this.disabled?this:null):this}
  getBoundingClientRect(){return {left:40,top:60,width:100,height:44}}
  animate(frames,options){const animation={target:this,frames,options,cancelled:false,cancel(){this.cancelled=true},finished:new Promise(()=>{})};animations.push(animation);return animation}
 }
 class PointerEvent{constructor(target,isPrimary=true){Object.assign(this,{target,isPrimary,clientX:80,clientY:82})}preventDefault(){assert.fail('Decoration prevented an action')}stopPropagation(){assert.fail('Decoration intercepted an action')}stopImmediatePropagation(){assert.fail('Decoration intercepted an action')}}
 class KeyboardEvent{constructor(target,key,repeat=false){Object.assign(this,{target,key,repeat})}preventDefault(){assert.fail('Decoration prevented a keyboard action')}stopPropagation(){assert.fail('Decoration intercepted a keyboard action')}stopImmediatePropagation(){assert.fail('Decoration intercepted a keyboard action')}}
 const media={get matches(){return systemReduce},addEventListener:(name,fn)=>mediaListeners.set(name,fn),removeEventListener:(name,fn)=>{assert.equal(mediaListeners.get(name),fn);mediaListeners.delete(name)}};
 try{
  global.Element=Element;global.PointerEvent=PointerEvent;global.KeyboardEvent=KeyboardEvent;global.innerWidth=320;global.innerHeight=600;global.matchMedia=()=>media;
  global.document={hidden:false,addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:(name,fn)=>{assert.equal(listeners.get(name),fn);listeners.delete(name)},querySelector:()=>{forestLookups++;return new Element()}};
  const R={useRef:value=>({current:value}),useState:()=>[[],value=>impacts=typeof value==='function'?value(impacts):value],useEffect:fn=>cleanups.push(fn())};
  const controller=compile('grizzly/interactions.tsx',{'react':R,'../components/app-preferences':{useAppPreferences:()=>({ready:true,p:{grizzlyStyle:'og',reduceMotion:false,contrast:false}})},'./grizzly-mark':{GrizzlyPaw:()=>null},'./interaction-policy':policy});
  const layer=controller.GrizzlyInteractions();assert.equal(layer.props['aria-hidden'],'true');assert.equal(layer.props['data-impact-style'],'og');
  assert.deepEqual([...listeners.keys()].sort(),['keydown','pointerdown','visibilitychange']);
  const target=new Element(),pointer=listeners.get('pointerdown'),keyboard=listeners.get('keydown');
  const dispatch=event=>{pointer(event);actions++};dispatch(new PointerEvent(target));assert.equal(actions,1);assert.equal(animations.length,1);assert.equal(animations[0].target,target);assert.ok(animations[0].options.duration<350);assert.equal(forestLookups,0);
  for(let index=0;index<8;index++)dispatch(new PointerEvent(target));assert.equal(actions,9);assert.equal(impacts.length,3);assert.equal(forestLookups,0);
  const before=animations.length;pointer(new PointerEvent(new Element(true)));pointer(new PointerEvent(target,false));keyboard(new KeyboardEvent(target,'Enter',true));keyboard(new KeyboardEvent(target,'ArrowDown'));assert.equal(animations.length,before);
  keyboard(new KeyboardEvent(target,'Enter'));actions++;assert.equal(actions,10);assert.equal(animations.length,before+1);assert.equal(impacts.length,3);
  document.hidden=true;listeners.get('visibilitychange')();assert.equal(impacts.length,0);assert.ok(animations.every(animation=>animation.cancelled));
  const hiddenCount=animations.length;dispatch(new PointerEvent(target));assert.equal(actions,11);assert.equal(animations.length,hiddenCount);
  document.hidden=false;systemReduce=true;mediaListeners.get('change')();dispatch(new PointerEvent(target));assert.equal(actions,12);assert.equal(animations.length,hiddenCount);
  for(const cleanup of cleanups)cleanup();assert.equal(listeners.size,0);assert.equal(mediaListeners.size,0);
 }finally{for(const [key,value] of originals){if(value===undefined)delete global[key];else global[key]=value}}
});

test('Displayed app names and current frontend sources no longer name one gym location',()=>{
 assert.equal(B.brand.name,B.isGrizzly?'Grizzly Fitness':'Movefield');
 const roots=['app','components','grizzly','github-pages','lib','mobile/src'];
 const walk=directory=>{for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if(entry.isDirectory())walk(file);else if(entry.isFile()&&/\.(?:tsx?|jsx?|css|html|svg)$/.test(file)){displayedFilesChecked++;assert.doesNotMatch(fs.readFileSync(file,'utf8'),/wautoma/i,'Location-specific current frontend source '+file);}}};
 roots.filter(root=>fs.existsSync(root)).forEach(walk);
 const config=require('../mobile/app.config.js')({config:require('../mobile/app.json').expo});assert.doesNotMatch(config.name,/wautoma/i);
 // The preexisting Expo slug is an internal project identity. It is deliberately
 // retained, as are package IDs/storage keys; none is a displayed location label.
});

fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync(`.sites-runtime/og-grizzly-checks-${B.isGrizzly?'grizzly':'movefield'}.json`,JSON.stringify({checkedAt:new Date().toISOString(),brand:B.brand.name,scope:'Actual preference parser/browser persistence helper, preset callbacks and delegated interaction controller with synthetic storage/DOM; extracted CSS token calculations. No rendered/browser, installed-device, pixel contrast or assistive-technology acceptance.',cases,contrast,displayedFilesChecked,identityException:'The existing internal Expo slug is retained. Displayed app names and current frontend source contain no single-location branding.'},null,2)+'\n');console.log('PASS '+cases.length+' OG Grizzly groups');
