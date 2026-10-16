import React,{useEffect,useState} from 'react';
import {View,Text,TextInput,Switch,type TextStyle} from 'react-native';
import {GrizzlyPressable as Pressable} from './wild-interactions';
import {LinearGradient} from 'expo-linear-gradient';
import {useNativeAppearance} from './appearance';
import {palettes,modelChoices,headingFonts} from './shared/app-preferences';
import {brand,isGrizzly} from './shared/brand';
import {loadGrizzlyFontGallery} from './grizzly-font-assets';
import {enableWorkoutReminders} from './workout-notifications';
import {NativeFlowScreen,NativeSection,NativeSettingsRow,NativeActionFooter} from './phone-ui';

type Page='home'|'profile'|'appearance'|'style'|'palette'|'fonts'|'display'|'accessibility'|'reminders'|'coaching'|'assistant'|'account'|'backup';
const titles:Record<Page,string>={home:'Settings',profile:'Profile & equipment',appearance:'Appearance',style:'Bear style',palette:'Color palette',fonts:'Heading font',display:'Display mode',accessibility:'Accessibility',reminders:'Workout reminders',coaching:'Workout coaching',assistant:'On-device assistant',account:'Account',backup:'Backup & data'};
const appearancePages=new Set<Page>(['style','palette','fonts','display']);

export function NativeSettings({reminderMessage,children,footer,profile,onBack}:{reminderMessage:string;children?:React.ReactNode;footer?:React.ReactNode;profile?:React.ReactNode;onBack?:()=>void}){
 const {p,update,colors:c,error,fonts,ready,headingFamily}=useNativeAppearance();
 const [page,setPage]=useState<Page>('home'),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[time,setTime]=useState(p.reminderTime);
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
 const input:TextStyle={...text,minHeight:50,borderWidth:1,borderColor:c.line,borderRadius:12,padding:14,backgroundColor:c.white};
 const go=(next:Page)=>{setPage(next);setMessage('');if(next==='fonts')setGalleryError('')};
 const back=page==='home'?onBack:()=>go(appearancePages.has(page)?'appearance':'home');
 const option=(label:string,selected:boolean,action:()=>void,detail?:string)=><NativeSettingsRow key={label} label={label} detail={detail} selected={selected} onPress={action}/>;
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
 if(!ready)return <NativeFlowScreen title="Settings" onBack={onBack}><Text style={text}>Opening your preferences…</Text></NativeFlowScreen>;
 return <NativeFlowScreen title={titles[page]} onBack={back} handleHardwareBack={page!=='home'} footer={page==='reminders'?<NativeActionFooter primary={{label:'Save reminder time',onPress:saveTime}}/>:undefined}>
  {page==='home'&&<View style={{gap:10}}>
   {!!profile&&row('profile')}
   {row('appearance',isGrizzly?`${p.grizzlyStyle==='wild'?'Wild Grizzly':'Clean'} · ${palette.name}`:palette.name)}
   {row('accessibility',`${p.textSize}% text`)}
   {row('coaching',p.coaching==='auto'?'Before and after workouts':p.coaching==='manual'?'On request':'Off')}
   {row('reminders',p.reminders?p.reminderTime:'Off')}
   {!!children&&row('account')}
   {!!footer&&row('backup')}
   {row('assistant','Future preference')}
  </View>}
  {page==='profile'&&profile}
  {page==='account'&&children}
  {page==='backup'&&footer}
  {page==='appearance'&&<>
   <LinearGradient colors={p.contrast?[c.from,c.from]:[c.from,c.to]} start={{x:0,y:0}} end={{x:1,y:1}} style={{padding:18,borderRadius:16}}><Text accessibilityRole="header" style={{fontSize:28*p.textSize/100,lineHeight:36*p.textSize/100,fontFamily:fonts?headingFamily:undefined,color:'#132325'}}>{brand.name}</Text><Text style={[muted,{color:'#132325'}]}>Your appearance preview</Text></LinearGradient>
   {isGrizzly&&row('style',p.grizzlyStyle==='wild'?'Wild Grizzly':'Clean & readable')}
   {row('palette',palette.name)}
   {isGrizzly&&row('fonts',font.name)}
   {row('display',p.mode==='system'?'Follow phone':p.mode==='dark'?'Dark':'Light')}
  </>}
  {page==='style'&&<>
   {option('Wild Grizzly',p.grizzlyStyle==='wild',()=>update({grizzlyStyle:'wild',headingFont:'frijole',mode:'dark',palette:'pine'}),'Forest, claws and bold headings.')}
   {option('Clean & readable',p.grizzlyStyle==='clean',()=>update({grizzlyStyle:'clean',headingFont:'inter',mode:'system'}),'Quiet surfaces and clear lettering.')}
  </>}
  {page==='palette'&&palettes.map(x=><View key={x.id} style={{gap:5}}><LinearGradient colors={[x.from,x.to]} style={{height:8,borderRadius:4}}/>{option(x.name,p.palette===x.id,()=>update({palette:x.id}))}</View>)}
  {page==='display'&&(['system','light','dark'] as const).map(mode=>option(mode==='system'?'Follow phone':mode==='dark'?'Dark':'Light',p.mode===mode,()=>update({mode})))}
  {page==='fonts'&&<>
   <TextInput accessibilityLabel="Find a heading font" placeholder="Find a font" placeholderTextColor={c.muted} value={fontSearch} onChangeText={setFontSearch} autoCorrect={false} style={input}/>
   {!fontSearch.trim()&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>{(['readable','wild'] as const).map(group=><View key={group} style={{flex:1,minWidth:120}}>{option(group==='readable'?'Readable':'Wild',fontGroup===group,()=>setFontGroup(group))}</View>)}</View>}
   {!galleryReady&&<Text style={muted}>{galleryError||'Loading font previews…'}</Text>}
   {matches.map(choice=><Pressable key={choice.id} accessibilityRole="button" accessibilityLabel={'Use '+choice.name} accessibilityState={{selected:p.headingFont===choice.id}} onPress={()=>update({headingFont:choice.id})} style={{padding:16,minHeight:80,borderWidth:1,borderColor:p.headingFont===choice.id?c.green:c.line,backgroundColor:p.headingFont===choice.id?c.pale:c.white,borderRadius:12,gap:8}}>
    <Text accessible={false} style={{...text,fontSize:25*p.textSize/100,lineHeight:35*p.textSize/100,fontFamily:galleryReady?choice.family:undefined,fontWeight:String(Math.round(choice.weight/100)*100) as TextStyle['fontWeight']}}>Grizzly</Text>
    <Text style={text}>{p.headingFont===choice.id?'✓ ':''}{choice.name}</Text>
    {'vibe' in choice&&<Text style={muted}>{choice.vibe}</Text>}
   </Pressable>)}
   {matches.length===0&&<Text style={text}>No fonts match. Try another name.</Text>}
  </>}
  {page==='accessibility'&&<>
   <NativeSection title="Text size" description="Also follows your phone’s text size.">{([100,115,130] as const).map(n=>option(`${n}%`,p.textSize===n,()=>update({textSize:n})))}</NativeSection>
   <NativeSection>{toggle('Higher contrast',p.contrast,contrast=>update({contrast}))}{toggle('Reduce motion',p.reduceMotion,reduceMotion=>update({reduceMotion}))}</NativeSection>
   <Text style={muted}>Your phone’s reduced motion and screen-reader preferences are respected.</Text>
  </>}
  {page==='reminders'&&<>
   <NativeSettingsRow label={busy?'Checking permission…':p.reminders?'Turn off reminders':'Enable workout reminders'} value={p.reminders?'On':'Off'} disabled={busy} onPress={reminderAction}/>
   <NativeSection title="Reminder time" description="Local time · 24-hour HH:MM"><TextInput accessibilityLabel="Workout reminder time" placeholder="18:00" placeholderTextColor={c.muted} maxLength={5} value={time} onChangeText={setTime} autoCorrect={false} style={input}/></NativeSection>
   <Text style={muted}>One alert per workout day. The next 30 workout days refresh when you open the app. Phone settings may delay or silence alerts.</Text>
   {!!reminderMessage&&<Text accessibilityLiveRegion="polite" style={muted}>{reminderMessage}</Text>}
   {!!message&&<Text accessibilityLiveRegion="polite" style={text}>{message}</Text>}
  </>}
  {page==='coaching'&&<>
   <Text style={muted}>Uses your saved training, works offline, and leaves plan changes for your review.</Text>
   {option('Automatic coaching popups',p.coaching==='auto',()=>update({coaching:'auto'}),'Before you start and after you save.')}
   {option('Open coaching when I choose',p.coaching==='manual',()=>update({coaching:'manual'}))}
   {option('Workout coaching off',p.coaching==='off',()=>update({coaching:'off'}))}
  </>}
  {page==='assistant'&&<>
   <Text style={muted}>Future preference only. No model is installed or running.</Text>
   {modelChoices.map(([value,label,detail])=>option(label,p.model===value,()=>update({model:value}),detail))}
   <Text style={muted}>Automatic prefers Qwen3 4B only on tested phones. Downloads are optional; workouts work without a model.</Text>
  </>}
  {!!error&&<Text accessibilityRole="alert" style={[text,{color:c.danger}]}>{error}</Text>}
 </NativeFlowScreen>;
}
