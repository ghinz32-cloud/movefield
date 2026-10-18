import React,{useEffect,useState} from 'react';
import {ScrollView,View,Text,TextInput,Switch,Platform,type TextStyle} from 'react-native';
import {GrizzlyPressable as Pressable} from './wild-interactions';
import {LinearGradient} from 'expo-linear-gradient';
import {useNativeAppearance} from './appearance';
import {palettes,modelChoices,headingFonts} from './shared/app-preferences';
import {brand,isGrizzly} from './shared/brand';
import {loadGrizzlyFontGallery} from './grizzly-font-assets';
import {enableWorkoutReminders} from './workout-notifications';
import {NativeButton,NativeChoiceButton,NativeFlowScreen,NativeSection,NativeSettingsRow,NativeActionFooter} from './phone-ui';

type Page='home'|'profile'|'appearance'|'style'|'palette'|'fonts'|'display'|'accessibility'|'reminders'|'coaching'|'assistant'|'account'|'backup';
const titles:Record<Page,string>={home:'Settings',profile:'Profile & equipment',appearance:'Appearance',style:'Bear style',palette:'Color palette',fonts:'Heading font',display:'Display mode',accessibility:'Accessibility',reminders:'Workout reminders',coaching:'Workout coaching',assistant:'On-device assistant',account:'Account',backup:'Backup & data'};
const appearancePages=new Set<Page>(['style','palette','fonts','display']);

export function NativeSettings({reminderMessage,children,footer,profile,onBack,notificationSettings}:{reminderMessage:string;children?:React.ReactNode;footer?:React.ReactNode;profile?:React.ReactNode;onBack?:()=>void;notificationSettings?:React.ReactNode}){
 const {p,update,colors:c,error,fonts,ready,headingFamily,preferencesError,retryPreferences}=useNativeAppearance();
 const [page,setPage]=useState<Page>('home'),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[time,setTime]=useState(p.reminderTime);
 const [section,setSection]=useState<'appearance'|'training'|'profile'>('appearance');
 const [galleryReady,setGalleryReady]=useState(false),[galleryError,setGalleryError]=useState(''),[fontSearch,setFontSearch]=useState('');
 const [fontGroup,setFontGroup]=useState<'readable'|'wild'>(()=>headingFonts.find(f=>f.id===p.headingFont)!.group);
 const [savedTime,setSavedTime]=useState(p.reminderTime);
 if(savedTime!==p.reminderTime){setSavedTime(p.reminderTime);setTime(p.reminderTime)}
 useEffect(()=>{
  if(page!=='fonts'||galleryReady)return;let live=true;
  loadGrizzlyFontGallery().then(()=>{if(live)setGalleryReady(true)}).catch(()=>{if(live)setGalleryError('Previews could not open. You can still choose a font by name.')});
  return()=>{live=false};
 },[page,galleryReady]);
 const text:TextStyle={color:c.ink,fontSize:16*p.textSize/100,lineHeight:23*p.textSize/100,fontFamily:fonts?'Inter':undefined};
 const muted:TextStyle={...text,color:c.muted,fontSize:14*p.textSize/100,lineHeight:21*p.textSize/100};
 const input:TextStyle={...text,minHeight:50,borderWidth:1,borderColor:c.inputBorder,borderRadius:10,padding:14,backgroundColor:c.white};
 const go=(next:Page)=>{setPage(next);setMessage('');if(next==='fonts')setGalleryError('')};
 const back=page==='home'?onBack:()=>go('home');
 const option=(label:string,selected:boolean,action:()=>void,detail?:string)=><NativeChoiceButton key={label} label={label} detail={detail} selected={selected} onPress={action}/>;
 const toggle=(label:string,checked:boolean,action:(value:boolean)=>void)=><View style={{flexDirection:'row',alignItems:'center',gap:14,minHeight:48}}><Text style={[text,{flex:1}]}>{label}</Text><Switch accessibilityLabel={label} value={checked} onValueChange={action}/></View>;
 const row=(destination:Page,value?:string)=><NativeSettingsRow key={destination} label={titles[destination]} value={value} onPress={()=>go(destination)}/>;
 const saveTime=()=>{if(/^([01]\d|2[0-3]):[0-5]\d$/.test(time)){update({reminderTime:time});setMessage('Reminder time saved.')}else setMessage('Use a time such as 07:30 or 18:00.')};
 const reminderAction=()=>{
  if(busy)return;
  if(p.reminders){update({reminders:false});setMessage('Workout reminders are off.');return}
  setBusy(true);void enableWorkoutReminders().then(result=>{update({reminders:result.enabled});setMessage(result.message)}).finally(()=>setBusy(false));
 };
 const palette=palettes.find(x=>x.id===p.palette)!,font=headingFonts.find(x=>x.id===p.headingFont)!;
 const matches=headingFonts.filter(f=>fontSearch.trim()?`${f.name} ${'vibe' in f?f.vibe:''}`.toLowerCase().includes(fontSearch.trim().toLowerCase()):f.group===fontGroup);
 const appearance=<>
  <LinearGradient colors={p.contrast?[c.from,c.from]:[c.from,c.to]} start={{x:0,y:0}} end={{x:1,y:1}} style={{padding:22,borderRadius:16,gap:8}}><Text accessibilityRole="header" style={{fontSize:28*p.textSize/100,lineHeight:36*p.textSize/100,fontFamily:fonts?headingFamily:undefined,color:'#132325'}}>{brand.name}</Text><Text style={[muted,{color:'#132325'}]}>Your next strong day.</Text></LinearGradient>
  <NativeSection title="Make it yours">
   {isGrizzly&&row('style',p.grizzlyStyle==='wild'?'Wild Grizzly':'Clean & readable')}
   {row('palette',palette.name)}
   {isGrizzly&&row('fonts',font.name)}
   <Text style={[text,{fontWeight:'600'}]}>Display mode</Text>
   <View accessibilityRole="radiogroup" accessibilityLabel="Display mode" style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{(['system','light','dark'] as const).map(mode=><NativeChoiceButton key={mode} label={mode==='system'?'System':mode==='dark'?'Dark':'Light'} selected={p.mode===mode} onPress={()=>update({mode})} compact/>)}</View>
   <Text style={muted}>System follows your phone’s appearance.</Text>
  </NativeSection>
  <NativeSection title="Reading preferences">
   <View accessibilityRole="radiogroup" accessibilityLabel="Text size" style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{([100,115,130] as const).map(n=><NativeChoiceButton key={n} compact label={n===100?'Standard':n===115?'Large':'Larger'} selected={p.textSize===n} onPress={()=>update({textSize:n})}/>)}</View>
   {row('accessibility',p.contrast?'Higher contrast on':p.reduceMotion?'Reduced motion on':'Contrast, motion and text links')}
  </NativeSection>
 </>;
 const coaching=<>
  <Text style={muted}>Uses your saved training, works offline, and leaves plan changes for your review.</Text>
  {option('Automatic coaching popups',p.coaching==='auto',()=>update({coaching:'auto'}),'Before you start and after you save.')}
  {option('Open coaching when I choose',p.coaching==='manual',()=>update({coaching:'manual'}))}
  {option('Workout coaching off',p.coaching==='off',()=>update({coaching:'off'}))}
 </>;
 if(!ready)return <NativeFlowScreen title={page==='home'?'Settings':titles[page]} onBack={back} handleHardwareBack={page!=='home'}>
  {preferencesError?<><Text accessibilityRole="alert" style={text}>{preferencesError}</Text><NativeButton label="Retry opening preferences" onPress={retryPreferences}/></>:<Text style={text}>Opening your preferences…</Text>}
  {page==='home'&&preferencesError&&<NativeSection title="Your saved data">{!!profile&&row('profile')}{!!children&&row('account')}{!!footer&&row('backup')}</NativeSection>}
  {page==='profile'&&profile}{page==='account'&&children}{page==='backup'&&footer}
 </NativeFlowScreen>;
 return <NativeFlowScreen title={titles[page]} onBack={back} handleHardwareBack={page!=='home'} footer={page==='reminders'?<NativeActionFooter primary={{label:'Save reminder time',onPress:saveTime}}/>:appearancePages.has(page)?<NativeActionFooter primary={{label:'Done',onPress:back!}}/>:undefined}>
  {page==='home'&&<>
   <ScrollView horizontal showsHorizontalScrollIndicator keyboardShouldPersistTaps="handled" style={{flexGrow:0}} contentContainerStyle={{gap:8,paddingBottom:4}}><View accessibilityRole="tablist" accessibilityLabel="Settings sections" style={{flexDirection:'row',gap:8}}>{([['appearance','Appearance'],['training','Training'],['profile','Profile & data']] as const).map(([key,label])=><Pressable key={key} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{selected:section===key}} aria-selected={section===key} onPress={()=>setSection(key)} style={{minHeight:48,paddingHorizontal:14,paddingVertical:12,borderRadius:10,borderWidth:1,borderColor:section===key?c.green:c.line,backgroundColor:section===key?c.soft:c.white,justifyContent:'center'}}><Text style={[text,{fontWeight:section===key?'700':'500'}]}>{label}</Text></Pressable>)}</View></ScrollView>
   {section==='appearance'&&appearance}
   {section==='training'&&<><NativeSection title="Workout coaching">{coaching}</NativeSection><NativeSection title="Reminders">{row('reminders',p.reminders?p.reminderTime:'Off')}</NativeSection>{row('assistant','Future preference')}</>}
   {section==='profile'&&<>
    {!!profile&&<NativeSection title="Your profile">{row('profile','Equipment, starting weights and sample training')}</NativeSection>}
    {!!children&&<NativeSection title="Account">{row('account','Optional connected services')}</NativeSection>}
    {!!footer&&<NativeSection title="Backup & data">{row('backup','Export, restore or manage this device’s records')}</NativeSection>}
   </>}
  </>}
  {page==='profile'&&profile}
  {page==='account'&&children}
  {page==='backup'&&footer}
  {page==='appearance'&&appearance}
  {page==='style'&&<>
   {option('Wild Grizzly',p.grizzlyStyle==='wild',()=>update({grizzlyStyle:'wild',headingFont:'frijole',mode:'dark',palette:'pine'}),'Forest, claws and bold headings.')}
   {option('Clean & readable',p.grizzlyStyle==='clean',()=>update({grizzlyStyle:'clean',headingFont:'inter',mode:'system'}),'Quiet surfaces and clear lettering.')}
  </>}
  {page==='palette'&&<View accessibilityRole="radiogroup" accessibilityLabel="Color palette" style={{gap:12}}>{palettes.map(x=><Pressable key={x.id} accessibilityRole="radio" accessibilityLabel={x.name} accessibilityState={{checked:p.palette===x.id}} aria-checked={p.palette===x.id} onPress={()=>update({palette:x.id})} style={{minHeight:76,flexDirection:'row',alignItems:'center',gap:14,borderWidth:p.palette===x.id?2:1,borderColor:p.palette===x.id?c.green:c.line,borderRadius:12,padding:14,backgroundColor:p.palette===x.id?c.soft:c.white}}><LinearGradient colors={[x.from,x.to]} style={{width:48,height:44,borderRadius:8,alignItems:'center',justifyContent:'center'}}>{p.palette===x.id&&<Text accessible={false} style={{color:'#132325',fontSize:22}}>✓</Text>}</LinearGradient><Text style={[text,{flex:1}]}>{x.name}</Text></Pressable>)}</View>}
  {page==='display'&&(['system','light','dark'] as const).map(mode=>option(mode==='system'?'Follow phone':mode==='dark'?'Dark':'Light',p.mode===mode,()=>update({mode})))}
  {page==='fonts'&&<>
   <TextInput accessibilityLabel="Find a heading font" placeholder="Find a font" placeholderTextColor={c.muted} value={fontSearch} onChangeText={setFontSearch} autoCorrect={false} style={input}/>
   {!fontSearch.trim()&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>{(['readable','wild'] as const).map(group=><View key={group} style={{flex:1,minWidth:120}}>{option(group==='readable'?'Readable':'Wild',fontGroup===group,()=>setFontGroup(group))}</View>)}</View>}
   {!galleryReady&&<Text style={muted}>{galleryError||'Loading font previews…'}</Text>}
   {matches.map(choice=><Pressable key={choice.id} accessibilityRole="button" accessibilityLabel={'Use '+choice.name} accessibilityState={{selected:p.headingFont===choice.id}} {...(Platform.OS==='web'?{'aria-pressed':p.headingFont===choice.id}:{})} onPress={()=>update({headingFont:choice.id})} style={{padding:16,minHeight:80,borderWidth:1,borderColor:p.headingFont===choice.id?c.green:c.line,backgroundColor:p.headingFont===choice.id?c.pale:c.white,borderRadius:12,gap:8}}>
    <Text accessible={false} style={{...text,fontSize:25*p.textSize/100,lineHeight:35*p.textSize/100,fontFamily:galleryReady?choice.family:undefined,fontWeight:String(Math.round(choice.weight/100)*100) as TextStyle['fontWeight']}}>Grizzly</Text>
    <Text style={text}>{p.headingFont===choice.id?'✓ ':''}{choice.name}</Text>
    {'vibe' in choice&&<Text style={muted}>{choice.vibe}</Text>}
   </Pressable>)}
   {matches.length===0&&<Text style={text}>No fonts match. Try another name.</Text>}
  </>}
  {page==='accessibility'&&<>
   <NativeSection title="Text size" description="Also follows your phone’s text size.">{([100,115,130] as const).map(n=>option(`${n}%`,p.textSize===n,()=>update({textSize:n})))}</NativeSection>
   <NativeSection>{toggle('Higher contrast',p.contrast,contrast=>update({contrast}))}{toggle('Reduce motion',p.reduceMotion,reduceMotion=>update({reduceMotion}))}{toggle('Underline text links',p.underlineLinks,underlineLinks=>update({underlineLinks}))}</NativeSection>
   <Text style={muted}>Your phone’s reduced motion and screen-reader preferences are respected.</Text>
  </>}
  {page==='reminders'&&<>
   <NativeSettingsRow label={busy?'Checking permission…':p.reminders?'Turn off reminders':'Enable workout reminders'} value={p.reminders?'On':'Off'} disabled={busy} onPress={reminderAction}/>
   <NativeSection title="Reminder time" description="Local time · 24-hour HH:MM"><TextInput accessibilityLabel="Workout reminder time" placeholder="18:00" placeholderTextColor={c.muted} maxLength={5} value={time} onChangeText={setTime} autoCorrect={false} style={input}/></NativeSection>
   <Text style={muted}>One alert per workout day. The next 30 workout days refresh when you open the app. Phone settings may delay or silence alerts.</Text>
   {!!reminderMessage&&<Text accessibilityLiveRegion="polite" style={muted}>{reminderMessage}</Text>}
   {!!message&&<Text accessibilityLiveRegion="polite" style={text}>{message}</Text>}
   {notificationSettings}
  </>}
  {page==='coaching'&&coaching}
  {page==='assistant'&&<>
   <Text style={muted}>Future preference only. No model is installed or running.</Text>
   {modelChoices.map(([value,label,detail])=>option(label,p.model===value,()=>update({model:value}),detail))}
   <Text style={muted}>Automatic prefers Qwen3 4B only on tested phones. Downloads are optional; workouts work without a model.</Text>
  </>}
  {!!error&&<Text accessibilityRole="alert" style={[text,{color:c.danger}]}>{error}</Text>}
 </NativeFlowScreen>;
}
