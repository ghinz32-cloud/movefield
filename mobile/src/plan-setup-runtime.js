import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Alert,Keyboard,StyleSheet,Text,TextInput,View} from 'react-native';
import {GrizzlyPressable} from './wild-interactions';
import {NativeFlowScreen,NativeActionFooter} from './phone-ui';
import {NativeEquipmentSurvey} from './equipment-survey';
import {useThemedStyles,useNativeAppearance} from './appearance';
import {programCatalog} from './shared/program-catalog';
import {sourceProgram} from './shared/source-programs';
import {defaultInventory,inventoryErrors} from './shared/equipment';
import {hydrateSetupProfile,planOptions,setupErrors} from './shared/onboarding';
import {day,validDay,goals,weekdays,niceDate,exFor,targetText,toKg} from './shared/training';
import {focusChoices} from './shared/training-focus';
import {planName,sessionName,trainingCopy} from './shared/presentation';
import {durationText} from './shared/session-duration';
import {sessionGuide} from './shared/session-guide';
import {planFit} from './shared/plan-fit';
import {NativePlanEvidence} from './science';
import {readLocalSetup,saveLocalSetup,clearLocalSetup} from './storage';

// Keep the public contract in plan-setup-runtime.d.ts. Persisted draft positions
// remain the original four coarse sections; screen IDs are presentation only.
const baseStyles=StyleSheet.create({
 body:{fontSize:16,lineHeight:24,color:'#19362D'},
 heading:{fontSize:20,lineHeight:28,fontWeight:'700',color:'#19362D'},
 row:{flexDirection:'row',flexWrap:'wrap',gap:10},
 stack:{gap:14},
 input:{fontSize:16,minHeight:52,borderWidth:1,borderColor:'#DCE1D7',borderRadius:12,padding:14},
 button:{minHeight:52,padding:14,borderWidth:1,borderColor:'#214D3A',borderRadius:12,justifyContent:'center'},
 card:{borderWidth:1,borderColor:'#DCE1D7',borderRadius:16,padding:16,gap:14}
});
function Choice({label,selected,onPress,disabled=false,expanded}){
 const styles=useThemedStyles(baseStyles),{colors:c}=useNativeAppearance();
 return React.createElement(GrizzlyPressable,{accessibilityRole:'button',accessibilityState:{selected,disabled,...(expanded===undefined?{}:{expanded})},disabled,onPress,style:[styles.button,selected&&{backgroundColor:c.green}]},React.createElement(Text,{style:[styles.body,selected&&{color:c.onAccent}]},label));
}
function Field({label,value,onChange,numeric=false}){
 const styles=useThemedStyles(baseStyles);
 return React.createElement(View,{style:{gap:8}},React.createElement(Text,{style:styles.body},label),React.createElement(TextInput,{accessibilityLabel:label,value,onChangeText:onChange,maxLength:100,keyboardType:numeric?'decimal-pad':'default',style:styles.input}));
}
function Details({label,children}){
 const [open,setOpen]=useState(false);
 return React.createElement(View,{style:{gap:12}},React.createElement(Choice,{label,expanded:open,onPress:()=>setOpen(!open)}),open&&children);
}
function sourcePatch(sourceChoice){return sourceChoice?{goal:sourceChoice.goal,mode:'app',programId:sourceChoice.id||undefined,trainingDays:sourceProgram(sourceChoice.id)?.days??programCatalog.find(x=>x.id===sourceChoice.id)?.days}:{}}
function PlanSetup({state,onAccept,sample=false,sourceChoice,onRegisterBack}){
 const styles=useThemedStyles(baseStyles),{colors:c}=useNativeAppearance();
 const [origin]=useState(()=>({sample,sourceChoice,basePlanId:state.plan?.id||null,baseEvents:JSON.stringify(state.events)}));
 const [p,setP]=useState(()=>({...state.profile,start:day(),programId:undefined,inventory:hydrateSetupProfile(state.profile).inventory,name:state.profile.name==='Local demo'?'':state.profile.name,...sourcePatch(sourceChoice)}));
 const [screen,setScreen]=useState('about'),[selected,setSelected]=useState(null),[candidate,setCandidate]=useState(0),[error,setError]=useState('');
 const [loaded,setLoaded]=useState(false),[saveNote,setSaveNote]=useState('Opening saved setup…'),[draftBlocked,setDraftBlocked]=useState(false),[readAttempt,setReadAttempt]=useState(0),[saving,setSaving]=useState(false);
 const accepted=useRef(false),accepting=useRef(false),write=useRef(0);
 const steps=[['about','About you',0],['goal','Your goal',0],...(p.goal==='sport'?[['sport','Your sport',0]]:[]),['experience','Training experience',0],['authority','Who leads training?',0],['days','Your available days',1],['frequency','Days per week',1],['time','Time per workout',1],['dates','Your training block',1],['location','Your training space',2],['dumbbells','Your dumbbells',2],['inventory','Your equipment',2],['access','Movement preferences',2],['extras','Optional extra work',2],...(p.age<18||p.goal==='sport'||p.focuses?.includes('jumping')?[['readiness','Training readiness',2]]:[]),...(['running','hybrid'].includes(p.goal)?[['running','Your running base',2]]:[]),['choose','Choose your plan',3],['review','Review your plan',3]];
 const index=Math.max(0,steps.findIndex(x=>x[0]===screen)),current=steps[index],coarse=current[2];
 useEffect(()=>{
  let live=true;
  readLocalSetup(origin.sample).then(d=>{
   if(!live)return;
   if(d&&d.basePlanId===origin.basePlanId){
    setP({...hydrateSetupProfile(d.profile),...sourcePatch(origin.sourceChoice)});
    const position=origin.sourceChoice?0:d.profile.mode==='app'&&!d.profile.inventory?Math.min(2,d.step):d.baseEvents===origin.baseEvents?Math.min(3,d.step):1;
    setScreen(['about','days','location','choose'][position]);
    setSaveNote('Saved choices restored.');
   }else setSaveNote('Saved on this device.');
   setDraftBlocked(false);
  }).catch(()=>{if(live){setDraftBlocked(true);setSaveNote('Your saved setup could not be opened. Retry before continuing.');}}).finally(()=>{if(live)setLoaded(true)});
  return()=>{live=false};
 },[readAttempt,origin]);
 useEffect(()=>{
  if(!loaded||accepted.current||draftBlocked)return;
  const version=++write.current;let live=true;
  Promise.resolve().then(()=>saveLocalSetup({schema:1,basePlanId:state.plan?.id||null,baseEvents:JSON.stringify(state.events),profile:p,events:state.events,step:coarse},sample)).then(()=>{if(live&&version===write.current)setSaveNote('Saved on this device.')}).catch(()=>{if(live&&version===write.current)setSaveNote('Setup could not be saved. Keep it open and retry.');});
  return()=>{live=false};
 },[p,coarse,loaded,state.plan?.id,state.events,draftBlocked,sample]);
 const planStep=screen==='choose'||screen==='review';
 const options=useMemo(()=>planStep?planOptions(p,state.events).sort((a,b)=>Number(!!sourceChoice&&b.id===sourceChoice.id&&p.goal===sourceChoice.goal)-Number(!!sourceChoice&&a.id===sourceChoice.id&&p.goal===sourceChoice.goal)):[],[planStep,p,state.events,sourceChoice]);
 const available=options.filter(o=>o.plan),option=available[Math.min(candidate,Math.max(0,available.length-1))];
 const update=(key,value)=>{setP(v=>({...v,[key]:value,programId:undefined}));setSelected(null);setCandidate(0);setError('')};
 const go=(id)=>{Keyboard.dismiss();setError('');setScreen(id)};
 const back=()=>{if(saving||accepting.current)return true;if(index===0)return false;go(steps[index-1][0]);return true};
 useEffect(()=>{onRegisterBack?.(back);return()=>onRegisterBack?.(null)});
 const allErrors=()=>[0,2,3,4].flatMap(n=>setupErrors(p,n));
 const stepErrors=()=>{
  if(screen==='about')return setupErrors(p,0);
  if(screen==='days')return p.days.length?[]:['Choose at least one available day.'];
  if(screen==='frequency')return p.trainingDays!==undefined&&(!Number.isInteger(p.trainingDays)||p.trainingDays<2||p.trainingDays>7||p.trainingDays>p.days.length)?['Choose 2–7 training days within your available weekdays.']:[];
  if(screen==='time')return Number.isInteger(p.minutes)&&p.minutes>=15&&p.minutes<=120?[]:['Choose 15–120 minutes per session.'];
  if(screen==='dates')return [...(!validDay(p.start)||p.start<day()?['Choose today or a future start date.']:[]),...(!Number.isInteger(p.weeks)||p.weeks<2||p.weeks>12?['Choose 2–12 weeks.']:[])];
  if(screen==='dumbbells')return p.dumbbellMaxKg!==undefined&&(!Number.isFinite(p.dumbbellMaxKg)||p.dumbbellMaxKg<0||p.dumbbellMaxKg>500)?['Enter a valid weight for one dumbbell, or leave it blank.']:[];
  if(screen==='inventory')return inventoryErrors(p);
  if(screen==='running')return (!Number.isInteger(p.runDays??0)||(p.runDays??0)<0||(p.runDays??0)>7||!Number.isFinite(p.runMinutes??0)||(p.runMinutes??0)<0||(p.runMinutes??0)>1500)?['Use 0–7 running days and 0–1500 weekly minutes.']:[];
  return [];
 };
 const next=()=>{
  const nextScreen=steps[index+1]?.[0],errors=[...stepErrors(),...(nextScreen==='choose'?allErrors():[])];
  if(errors.length){setError(errors[0]);return}
  if(nextScreen)go(nextScreen);
 };
 const start=async()=>{
  if(accepting.current||accepted.current||!selected?.plan)return;
  if(draftBlocked){setError('Retry opening your saved setup first.');return}
  const errors=allErrors();if(errors.length){setError(errors[0]);return}
  accepting.current=true;setSaving(true);
  try{
   const message=await onAccept(selected.profile,selected.plan,state.events);
   if(message)setError(message);else{accepted.current=true;await clearLocalSetup(sample)}
  }catch(e){setError(accepted.current?'Your plan is saved, but its setup draft could not be cleared. Your workouts are kept.':e instanceof Error?e.message:'This plan could not be saved. Your setup is kept for retry.')}
  finally{accepting.current=false;setSaving(false)}
 };
 const text=(value,key=value)=>React.createElement(Text,{key,style:styles.body},value);
 const field=(label,key,numeric=false)=>React.createElement(Field,{key,label,value:String(p[key]??''),numeric,onChange:v=>update(key,numeric?Number(v):v)});
 const choice=(label,selected,onPress,key=label)=>React.createElement(Choice,{key,label,selected,onPress});
 const choices=(values,key)=>values.map(v=>choice(v,p[key]===v,()=>update(key,v)));
 let body;
 switch(screen){
  case 'about':body=[field('Profile name','name'),field('Age','age',true),text('Weight units'),React.createElement(View,{key:'units',style:styles.row},choices(['lb','kg'],'units'))];break;
  case 'goal':body=goals.map(([id,label])=>choice(label,p.goal===id,()=>update('goal',id)));break;
  case 'sport':body=[field('Sport','sport'),field('Position or event','position'),text('Sport plans build general foundations; they are not position-specific.')];break;
  case 'experience':body=[...choices(['First time','Some experience','Experienced'],'experience'),p.experience==='Experienced'&&choice('I have at least 8 recent weeks of steady training',!!p.establishedTraining,()=>update('establishedTraining',!p.establishedTraining))];break;
  case 'authority':body=[...([['app','Guide me with a plan'],['coach','Track my coach’s plan'],['manual','Write my own plan']].map(([id,label])=>choice(label,p.mode===id,()=>update('mode',id)))),text(p.mode==='app'?'Review a plan matched to your choices.':'You or your coach chooses exercises and targets. The app records them.')];break;
  case 'days':body=[text('Select every day you could train.'),React.createElement(View,{key:'days',style:styles.row},weekdays.map((label,i)=>choice(label,p.days.includes(i),()=>update('days',p.days.includes(i)?p.days.filter(d=>d!==i):[...p.days,i].sort()))))];break;
  case 'frequency':body=[choice('Recommend a frequency',p.trainingDays===undefined,()=>update('trainingDays',undefined)),React.createElement(View,{key:'frequency',style:styles.row},[2,3,4,5,6,7].map(n=>choice(`${n} days`,p.trainingDays===n,()=>update('trainingDays',n)))),text(`${p.days.length} available days. Seven-day plans include an easy activity day.`)];break;
  case 'time':body=[field('Minutes per session · 15–120','minutes',true),React.createElement(View,{key:'time',style:styles.row},[20,30,45,60,90].map(n=>choice(`${n} min`,p.minutes===n,()=>update('minutes',n)))),text('Include warm-up, rest and any extra work.')];break;
  case 'dates':body=[field('Start date · YYYY-MM-DD','start'),field('Training weeks · 2–12','weeks',true),text(state.events.length?'Your saved commitments will be included in the preview.':'You can add time off later in Calendar.')];break;
  case 'location':body=[text('Choose a starting equipment list. You’ll check the exact items next.'),...['Full gym','Dumbbells','Bodyweight + band','No equipment'].map(x=>choice(x,p.equipment===x,()=>{update('equipment',x);update('inventory',defaultInventory(x))}))];break;
  case 'dumbbells':body=[React.createElement(NativeEquipmentSurvey,{key:'dumbbells',profile:p,section:'dumbbells',onChange:v=>update('inventory',v)}),p.inventory?.dumbbells!=='none'&&React.createElement(Field,{key:'max',label:`Heaviest ONE dumbbell (${p.units}) · optional`,numeric:true,value:p.dumbbellMaxKg===undefined?'':String(Math.round(p.dumbbellMaxKg*(p.units==='lb'?2.2046226218:1)*100)/100),onChange:v=>update('dumbbellMaxKg',v===''?undefined:toKg(Number(v),p.units))})];break;
  case 'inventory':body=React.createElement(NativeEquipmentSurvey,{profile:p,section:'equipment',onChange:v=>update('inventory',v)});break;
  case 'access':body=[choice('Standing or seated exercises only',!!p.noFloor,()=>update('noFloor',!p.noFloor)),text('Leave this off if floor exercises are comfortable for you.')];break;
  case 'extras':body=[text('Optional. You can continue without adding anything.'),...focusChoices.map(f=>choice(f.title,!!p.focuses?.includes(f.id),()=>update('focuses',p.focuses?.includes(f.id)?p.focuses.filter(x=>x!==f.id):[...(p.focuses||[]),f.id]))),React.createElement(Details,{key:'focus-help',label:'What do these add?'},focusChoices.map(f=>text(`${f.title}: ${f.description}`,f.id)))];break;
  case 'readiness':body=[(p.age<18||p.focuses?.includes('jumping'))&&choice('Qualified supervision is available',!!p.supervision,()=>update('supervision',!p.supervision)),(p.focuses?.includes('jumping')||p.goal==='sport')&&choice('Clear landing area and comfortable landing skill',!!p.jumpReady,()=>update('jumpReady',!p.jumpReady)),p.goal==='sport'&&text('Your season'),p.goal==='sport'&&choices(['Off-season','Preseason','In-season','Transition / recovery'],'season'),text('Plan matching checks age, supervision and recovery needs.')];break;
  case 'running':body=[choice('I already run 30 minutes comfortably',!!p.runBase,()=>update('runBase',!p.runBase)),field('Recent running days each week','runDays',true),field('Recent easy running minutes each week','runMinutes',true)];break;
  case 'choose':body=[!options.some(o=>o.plan&&o.profile.mode===p.mode&&o.profile.goal===p.goal)&&React.createElement(View,{key:'no-match',style:styles.stack},text('No guided plan fits all these choices. Go back to adjust them, or review the tracking option.'),[...new Set(options.filter(o=>!o.plan&&o.profile.mode===p.mode&&o.profile.goal===p.goal).flatMap(o=>o.errors))].slice(0,3).map(e=>text(e,e))),option&&React.createElement(View,{key:option.id,style:styles.card},text(`Option ${Math.min(candidate+1,available.length)} of ${available.length}${option.recommended?' · Recommended':''}`),React.createElement(Text,{style:styles.heading},planName(option.plan)),text(`${option.plan.sessions.length} workouts · ends ${niceDate(option.plan.sessions.at(-1).date)}`),React.createElement(Details,{label:'About this plan'},text(option.description))),available.length>1&&React.createElement(View,{key:'browse',style:styles.row},React.createElement(Choice,{label:'Previous plan',disabled:candidate===0,onPress:()=>setCandidate(candidate-1)}),React.createElement(Choice,{label:'Next plan',disabled:candidate>=available.length-1,onPress:()=>setCandidate(candidate+1)}))];break;
  case 'review':{
   if(!selected?.plan){body=text('Choose a plan to review.');break}
   const plan=selected.plan,fit=planFit(plan);
   const sessions=list=>list.map(x=>React.createElement(View,{key:x.id,style:styles.stack},React.createElement(Text,{style:[styles.body,{fontWeight:'700'}]},`${niceDate(x.date)} · ${sessionName(x,plan)} · ${durationText(x,state.custom)}`),...x.items.map(i=>text(`${exFor(i.exerciseId).name} · ${i.sets} × ${targetText(i)} · ${i.rest}s rest`,`${x.id}-${i.exerciseId}`))));
   body=[React.createElement(Text,{key:'name',style:styles.heading},planName(plan)),text(`${plan.sessions.length} workouts · ${niceDate(plan.sessions[0].date)} to ${niceDate(plan.sessions.at(-1).date)}`),text(`${fit.strengthDays} strength days · ${fit.runningDays} running days · ${fit.easyDays} easy days in week ${fit.week}. Combined workouts count in both categories.`),React.createElement(Details,{key:'week',label:'View first week'},sessions(plan.sessions.filter(x=>x.week===1))),React.createElement(Details,{key:'all',label:'View all workouts'},sessions(plan.sessions)),React.createElement(Details,{key:'notes',label:'Instructions, notes and evidence'},React.createElement(Choice,{label:'Workout instructions and progression',onPress:()=>{const x=plan.sessions[0],guide=sessionGuide(plan,x);Alert.alert(sessionName(x,plan),[...guide.warmup,guide.effort,...guide.order,...guide.progression,guide.finish].join('\n\n'))}}),text(trainingCopy(plan.progression)),...plan.notes.filter(n=>n.startsWith('[Focus]')||n.startsWith('Days off')||n.startsWith('Competition')).map(n=>text(n,n)),React.createElement(Choice,{label:'Show regional work counts',onPress:()=>Alert.alert('Planned weekly work',fit.regions.map(r=>`${r.name}: ${r.sets} sets involving this region across ${r.days} days`).join('\n')+'\nCompound work can appear in multiple regions. These are planned counts, not equivalent isolation sets or guaranteed results.')}),React.createElement(NativePlanEvidence,{plan,key:plan.id})),React.createElement(Choice,{key:'another',label:'Choose another plan',onPress:()=>go('choose')})];break;
  }
 }
 if(!loaded)return React.createElement(Text,{style:styles.body},'Opening saved setup…');
 const nextNames={goal:'goal',sport:'sport',experience:'experience',authority:'guidance',days:'availability',frequency:'frequency',time:'workout time',dates:'training dates',location:'equipment',dumbbells:'dumbbells',inventory:'equipment list',access:'movement',extras:'extras',readiness:'readiness',running:'running base'};
 const primary=screen==='review'?{label:saving?'Saving plan…':'Start this plan',onPress:start,disabled:saving||draftBlocked||!selected}:screen==='choose'?{label:'Review this plan',disabled:!option||draftBlocked,onPress:()=>{const errors=allErrors();if(errors.length){setError(errors[0]);return}setSelected(option);go('review')}}:{label:steps[index+1]?.[0]==='choose'?'See my plans':`Continue to ${nextNames[steps[index+1]?.[0]]}`,onPress:next,disabled:draftBlocked};
 return React.createElement(NativeFlowScreen,{title:current[1],subtitle:`Step ${index+1} of ${steps.length}`,onBack:index>0?back:undefined,footer:React.createElement(NativeActionFooter,{primary},!!error&&React.createElement(Text,{accessibilityRole:'alert',style:[styles.body,{color:c.danger}]},error))},draftBlocked?React.createElement(View,{style:styles.stack},text(saveNote),React.createElement(Choice,{label:'Retry saved setup',onPress:()=>{setLoaded(false);setReadAttempt(readAttempt+1)}})):React.createElement(View,{style:styles.stack},body,(error||planStep)&&React.createElement(Details,{label:'Edit setup choices'},steps.filter(s=>s[2]<3).map(([id,label])=>React.createElement(Choice,{key:id,label,onPress:()=>go(id)})))),React.createElement(Text,{accessibilityLiveRegion:'polite',style:[styles.body,{color:c.muted}]},saveNote));
}
export {PlanSetup};
