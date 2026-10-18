import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Alert,Keyboard,StyleSheet,Text,TextInput,View,ScrollView,useWindowDimensions} from 'react-native';
import {NativeFlowScreen,NativeActionFooter,NativeChoiceButton} from './phone-ui';
import {NativeEquipmentSurvey} from './equipment-survey';
import {NativeNumericInput} from './numeric-input';
import {NativeSessionInstructions} from './session-instructions';
import {useThemedStyles,useNativeAppearance} from './appearance';
import {programCatalog} from './shared/program-catalog';
import {sourceProgram} from './shared/source-programs';
import {defaultInventory,inventoryErrors} from './shared/equipment';
import {hydrateSetupProfile,planOptions,setupErrors} from './shared/onboarding';
import {day,validDay,goals,weekdays,niceDate,exFor,targetText,toKg} from './shared/training';
import {focusChoices} from './shared/training-focus';
import {planName,sessionName,trainingCopy} from './shared/presentation';
import {durationText} from './shared/session-duration';
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
const nativeSetupSections=['Profile','Schedule','Equipment','Plan'];
/** Display-only: section numbers keep the existing persisted draft contract. */
function NativeSetupProgress({section}){
 const {colors:c,p,fonts}=useNativeAppearance(),progress=useRef(null);
 const reveal=useCallback(()=>{if(section>=2)progress.current?.scrollToEnd({animated:false});else progress.current?.scrollTo({x:0,animated:false})},[section]);
 useEffect(reveal,[reveal,p.textSize]);
 return React.createElement(ScrollView,{ref:progress,horizontal:true,showsHorizontalScrollIndicator:false,tabIndex:0,focusable:true,onContentSizeChange:reveal,accessibilityLabel:'Setup sections',contentContainerStyle:{gap:8,paddingVertical:2},style:{flexGrow:0}},nativeSetupSections.map((label,index)=>React.createElement(View,{key:label,style:{paddingHorizontal:10,paddingVertical:7,borderRadius:10,backgroundColor:index===section?c.pale:c.white,borderWidth:1,borderColor:index===section?c.green:c.line}},React.createElement(Text,{accessibilityLabel:`${label}, section ${index+1} of 4${index===section?', current':''}`,style:{color:index===section?c.green:c.muted,fontFamily:fonts?'Inter':undefined,fontSize:14*p.textSize/100,lineHeight:20*p.textSize/100,fontWeight:index===section?'700':'400'}},`${index+1} ${label}`))));
}
function setupSummary(profile){
 return [
  [profile.name,profile.age?`Age ${profile.age}`:null,profile.units].filter(Boolean).join(' · '),
  `${goals.find(([id])=>id===profile.goal)?.[1]||profile.goal} · ${profile.mode==='app'?'App proposed':profile.mode==='coach'?'Coach directed':'Your own targets'}`,
  `${profile.days.length?profile.days.map(day=>weekdays[day]).join(' / '):'Choose available days'} · ${profile.trainingDays===undefined?'Recommend frequency':`${profile.trainingDays} days per week`}`,
  `${profile.minutes} minutes available · ${profile.weeks} weeks`,
  `${profile.equipment} · ${profile.inventory?.confirmed?'Equipment confirmed':'Check exact equipment'}`
 ];
}

function Choice(props){return React.createElement(NativeChoiceButton,props)}
function Field({label,value,onChange,numeric=false,nullable=false,max=9999}){
 const styles=useThemedStyles(baseStyles);
 return React.createElement(View,{style:{gap:8}},React.createElement(Text,{style:styles.body},label),numeric?React.createElement(NativeNumericInput,{accessibilityLabel:label,value,onValueChange:onChange,nullable,max,style:styles.input}):React.createElement(TextInput,{accessibilityLabel:label,value,onChangeText:onChange,maxLength:100,style:styles.input}));
}
function Details({label,children}){
 const [open,setOpen]=useState(false);
 return React.createElement(View,{style:{gap:12}},React.createElement(Choice,{label,expanded:open,onPress:()=>setOpen(!open)}),open&&children);
}
function sourcePatch(sourceChoice){return sourceChoice?{goal:sourceChoice.goal,mode:'app',programId:sourceChoice.id||undefined,trainingDays:sourceProgram(sourceChoice.id)?.days??programCatalog.find(x=>x.id===sourceChoice.id)?.days}:{}}
function PlanSetup({state,onAccept,sample=false,sourceChoice,onRegisterBack}){
 const styles=useThemedStyles(baseStyles),{colors:c}=useNativeAppearance(),viewport=useWindowDimensions();
 const [availableHeight,setAvailableHeight]=useState(null),compact=viewport.height<500||availableHeight!==null&&availableHeight<420;
 const [origin]=useState(()=>({sample,sourceChoice,basePlanId:state.plan?.id||null,baseEvents:JSON.stringify(state.events)}));
 const [p,setP]=useState(()=>({...state.profile,start:day(),programId:undefined,inventory:hydrateSetupProfile(state.profile).inventory,name:state.profile.name==='Local demo'?'':state.profile.name,...sourcePatch(sourceChoice)}));
 const [screen,setScreen]=useState('about'),[selected,setSelected]=useState(null),[candidate,setCandidate]=useState(0),[error,setError]=useState('');
 const [showOtherPlans,setShowOtherPlans]=useState(false),[otherPage,setOtherPage]=useState(0),[showUnavailable,setShowUnavailable]=useState(false),[unavailablePage,setUnavailablePage]=useState(0);
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
 const update=(key,value)=>{setP(v=>({...v,[key]:value,programId:undefined}));setSelected(null);setCandidate(0);setShowOtherPlans(false);setOtherPage(0);setShowUnavailable(false);setUnavailablePage(0);setError('')};
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
 const field=(label,key,numeric=false)=>React.createElement(Field,{key,label,value:numeric?p[key]??0:String(p[key]??''),numeric,onChange:v=>update(key,v)});
 const choice=(label,selected,onPress,key=label,extra={})=>React.createElement(Choice,{key,label,selected,onPress,...extra});
 const choices=(values,key,extra={})=>values.map(v=>choice(v,p[key]===v,()=>update(key,v),v,extra));
 const reviewOption=o=>{const errors=allErrors();if(errors.length){setError(errors[0]);return}setSelected(o);go('review')};
 const pickCandidate=i=>{setCandidate(i);setShowOtherPlans(false);setError('')};
 const planFacts=o=>`${o.plan.profile.days.map(d=>weekdays[d]).join(' / ')} · ${o.plan.sessions.length} workouts · up to ${Math.max(...o.plan.sessions.map(s=>s.minutes))} min`;
 const goalDetails={strength:'Build strength with repeatable lifting practice.',hypertrophy:'Build muscle with planned work and recovery.',powerbuilding:'Combine strength practice and muscle-building work.',hybrid:'Include strength and running in the same block.',running:'Choose a running or run/walk starting point.',sport:'General strength preparation with sport and season context.',general:'Build a repeatable all-round training habit.',calisthenics:'Build a foundation in bodyweight strength.',powerlifting:'Focus on the squat, bench press and deadlift.'};
 let body;
 switch(screen){
  case 'about':body=[field('Profile name','name'),field('Age','age',true),text('Weight units'),React.createElement(View,{key:'units',style:styles.row},choices(['lb','kg'],'units',{compact:true})),React.createElement(Details,{key:'optional-profile',label:'Optional profile detail'},text('Sex does not determine your starting weights or available goals.'),...([['unspecified','Prefer not to say'],['female','Female'],['male','Male'],['intersex','Intersex']].map(([id,label])=>choice(label,(p.sex||'unspecified')===id,()=>update('sex',id)))))];break;
  case 'goal':body=[text('Choose one main goal for this block.'),...goals.map(([id,label])=>choice(label,p.goal===id,()=>update('goal',id),id,{detail:goalDetails[id]}))];break;
  case 'sport':body=[field('Sport','sport'),field('Position or event','position'),text('Sport plans build general foundations; they are not position-specific.')];break;
  case 'experience':body=[...choices(['First time','Some experience','Experienced'],'experience'),p.experience==='Experienced'&&choice('I have at least 8 recent weeks of steady training',!!p.establishedTraining,()=>update('establishedTraining',!p.establishedTraining),'established',{multiple:true,detail:'Only choose this if the main lifts are familiar and controlled.'})];break;
  case 'authority':body=[...([['app','Guide me with a plan','Choose a matching block and review proposed changes.'],['coach','Track my coach’s plan','Your coach chooses the exercises, targets and progression.'],['manual','Write my own plan','Enter your own exercises and targets after creating the schedule.']].map(([id,label,detail])=>choice(label,p.mode===id,()=>update('mode',id),id,{detail}))),text(p.mode==='app'?'Review a plan matched to your choices.':'You or your coach chooses exercises and targets. The app records them.')];break;
  case 'days':body=[text('Select every day you could train.'),React.createElement(View,{key:'days',style:styles.row},weekdays.map((label,i)=>choice(label,p.days.includes(i),()=>update('days',p.days.includes(i)?p.days.filter(d=>d!==i):[...p.days,i].sort()),label,{compact:true,multiple:true})))];break;
  case 'frequency':body=[choice('Recommend a frequency',p.trainingDays===undefined,()=>update('trainingDays',undefined)),React.createElement(View,{key:'frequency',style:styles.row},[2,3,4,5,6,7].map(n=>choice(`${n} days`,p.trainingDays===n,()=>update('trainingDays',n),n,{compact:true}))),text(`${p.days.length} available days. Higher-frequency plans may spread work across shorter sessions or include easy activity. Review the actual schedule.`)];break;
  case 'time':body=[field('Minutes per session · 15–120','minutes',true),React.createElement(View,{key:'time',style:styles.row},[20,30,45,60,90].map(n=>choice(`${n} min`,p.minutes===n,()=>update('minutes',n),n,{compact:true}))),text('Include warm-up, rest and any extra work.')];break;
  case 'dates':body=[field('Start date · YYYY-MM-DD','start'),field('Training weeks · 2–12','weeks',true),text(state.events.length?'Your saved commitments will be included in the preview.':'Add fixed time off in Calendar before accepting a plan if it affects your availability.'),state.events.length>0&&React.createElement(Details,{key:'commitments',label:`Review ${state.events.length} saved commitments`},state.events.map(e=>text(`${niceDate(e.date)} · ${e.name} · ${e.kind}`,e.id)))];break;
  case 'location':body=[text('Choose a starting equipment list. You’ll check the exact items next.'),...['Full gym','Dumbbells','Bodyweight + band','No equipment'].map(x=>choice(x,p.equipment===x,()=>{update('equipment',x);update('inventory',defaultInventory(x))}))];break;
  case 'dumbbells':body=[React.createElement(NativeEquipmentSurvey,{key:'dumbbells',profile:p,section:'dumbbells',onChange:v=>update('inventory',v)}),p.inventory?.dumbbells!=='none'&&React.createElement(Field,{key:'max',label:`Heaviest ONE dumbbell (${p.units}) · optional`,numeric:true,nullable:true,max:500*(p.units==='lb'?2.2046226218:1),value:p.dumbbellMaxKg===undefined?null:Math.round(p.dumbbellMaxKg*(p.units==='lb'?2.2046226218:1)*100)/100,onChange:v=>update('dumbbellMaxKg',v===null?undefined:toKg(v,p.units))})];break;
  case 'inventory':body=React.createElement(NativeEquipmentSurvey,{profile:p,section:'equipment',onChange:v=>update('inventory',v)});break;
  case 'access':body=[choice('Standing or seated exercises only',!!p.noFloor,()=>update('noFloor',!p.noFloor),'no-floor',{multiple:true}),text('Leave this off if floor exercises are comfortable for you.')];break;
  case 'extras':body=[text('Optional. You can continue without adding anything.'),...focusChoices.map(f=>choice(f.title,!!p.focuses?.includes(f.id),()=>update('focuses',p.focuses?.includes(f.id)?p.focuses.filter(x=>x!==f.id):[...(p.focuses||[]),f.id]),f.id,{multiple:true,detail:f.description})),React.createElement(Details,{key:'focus-help',label:'What do these add?'},focusChoices.map(f=>text(`${f.title}: ${f.description}`,f.id)))];break;
  case 'readiness':body=[(p.age<18||p.focuses?.includes('jumping'))&&choice('Qualified supervision is available',!!p.supervision,()=>update('supervision',!p.supervision),'supervision',{multiple:true}),(p.focuses?.includes('jumping')||p.goal==='sport')&&choice('Clear landing area and comfortable landing skill',!!p.jumpReady,()=>update('jumpReady',!p.jumpReady),'jump-ready',{multiple:true}),p.goal==='sport'&&text('Your season'),p.goal==='sport'&&choices(['Off-season','Preseason','In-season','Transition / recovery'],'season'),text('Plan matching checks age, supervision and recovery needs.')];break;
  case 'running':body=[text('Use your recent routine, not the amount you hope to do. This helps check which running plans fit.'),choice('I already run 30 minutes comfortably',!!p.runBase,()=>update('runBase',!p.runBase),'running-base',{multiple:true}),field('Recent running days each week','runDays',true),field('Recent easy running minutes each week','runMinutes',true)];break;
  case 'choose':{
   const alternatives=available.map((o,i)=>({o,i})).filter(({i})=>i!==Math.min(candidate,available.length-1)),unavailable=options.filter(o=>!o.plan),fit=option?planFit(option.plan):null;
   const page=alternatives.slice(otherPage*3,otherPage*3+3),unavailableRows=unavailable.slice(unavailablePage*3,unavailablePage*3+3);
   body=[
    !options.some(o=>o.plan&&o.profile.mode===p.mode&&o.profile.goal===p.goal)&&React.createElement(View,{key:'no-match',style:styles.stack},text('No guided plan fits all these choices. Keep your goal and adjust your schedule or equipment, or review the tracking option.'),[...new Set(options.filter(o=>!o.plan&&o.profile.mode===p.mode&&o.profile.goal===p.goal).flatMap(o=>o.errors))].slice(0,3).map(e=>text(e,e))),
    option&&React.createElement(View,{key:option.id,style:[styles.card,{backgroundColor:c.white,borderColor:c.green}]},
     text(option.recommended?'Fits your setup · Recommended':option.id===sourceChoice?.id?'Your selected program':'Your selected option'),
     React.createElement(Text,{accessibilityRole:'header',style:styles.heading},planName(option.plan)),
     text(option.description),text(planFacts(option)),
     text(option.profile.mode==='app'?'App proposed · review changes before accepting them':option.profile.mode==='coach'?'Coach directed · enter your coach’s exercises and targets':'Tracking schedule · enter your own exercises and targets'),
     React.createElement(Details,{label:'How this plan fits'},text(`${fit.strengthDays} strength days · ${fit.runningDays} running days · ${fit.easyDays} easy days in week ${fit.week}. Combined workouts count in both categories.`),text(`${niceDate(option.plan.sessions[0].date)} to ${niceDate(option.plan.sessions.at(-1).date)}`),text(trainingCopy(option.plan.progression))),
     React.createElement(Choice,{label:'Review this plan',onPress:()=>reviewOption(option)})),
    alternatives.length>0&&React.createElement(Choice,{key:'other-toggle',label:showOtherPlans?'Hide other plans':`Show other plans · ${alternatives.length}`,expanded:showOtherPlans,onPress:()=>{setShowOtherPlans(!showOtherPlans);setOtherPage(0)}}),
    showOtherPlans&&React.createElement(View,{key:'other-plans',style:styles.stack},text(`Other plans ${otherPage*3+1}–${Math.min(otherPage*3+3,alternatives.length)} of ${alternatives.length}`),...page.map(({o,i})=>React.createElement(View,{key:o.id,style:[styles.card,{backgroundColor:c.white}]},React.createElement(Choice,{label:planName(o.plan),detail:[o.recommended?'Recommended':null,planFacts(o)].filter(Boolean).join(' · '),selected:false,onPress:()=>pickCandidate(i)}),React.createElement(Details,{label:`About ${planName(o.plan)}`},text(o.description),text(trainingCopy(o.plan.progression))),React.createElement(Choice,{label:`Review ${planName(o.plan)}`,onPress:()=>{setCandidate(i);reviewOption(o)}}))),alternatives.length>3&&React.createElement(View,{style:styles.row},React.createElement(Choice,{label:'Previous choices',disabled:otherPage===0,onPress:()=>setOtherPage(otherPage-1)}),React.createElement(Choice,{label:'More choices',disabled:(otherPage+1)*3>=alternatives.length,onPress:()=>setOtherPage(otherPage+1)}))),
    unavailable.length>0&&React.createElement(Choice,{key:'unavailable-toggle',label:showUnavailable?'Hide plans that need a change':`Plans that need a change · ${unavailable.length}`,expanded:showUnavailable,onPress:()=>{setShowUnavailable(!showUnavailable);setUnavailablePage(0)}}),
    showUnavailable&&React.createElement(View,{key:'unavailable-plans',style:styles.stack},text(`Needs a change: ${unavailablePage*3+1}–${Math.min(unavailablePage*3+3,unavailable.length)} of ${unavailable.length}`),...unavailableRows.map(o=>React.createElement(View,{key:o.id,style:styles.card},React.createElement(Text,{style:styles.heading},o.title),...o.errors.map((e,n)=>text(e,`${o.id}-${n}`)))),unavailable.length>3&&React.createElement(View,{style:styles.row},React.createElement(Choice,{label:'Previous unavailable plans',disabled:unavailablePage===0,onPress:()=>setUnavailablePage(unavailablePage-1)}),React.createElement(Choice,{label:'More unavailable plans',disabled:(unavailablePage+1)*3>=unavailable.length,onPress:()=>setUnavailablePage(unavailablePage+1)}))),
    React.createElement(View,{key:'adjust-fit',style:styles.row},React.createElement(Choice,{label:'Edit days and time',onPress:()=>go('days')}),React.createElement(Choice,{label:'Edit equipment',onPress:()=>go('location')}))
   ];break;
  }
  case 'review':{
   if(!selected?.plan){body=text('Choose a plan to review.');break}
   const plan=selected.plan,fit=planFit(plan);
   const sessions=list=>list.map(x=>React.createElement(View,{key:x.id,style:styles.stack},
    React.createElement(Text,{style:[styles.body,{fontWeight:'700'}]},`${niceDate(x.date)} · ${sessionName(x,plan)} · ${durationText(x,state.custom)}`),
    ...x.items.map(i=>text(`${exFor(i.exerciseId,state.custom).name} · ${i.sets} × ${targetText(i)} ${exFor(i.exerciseId,state.custom).metric} · ${i.rest}s rest`,`${x.id}-${i.exerciseId}`)),
    React.createElement(NativeSessionInstructions,{plan,session:x})));
   body=[React.createElement(Text,{key:'name',style:styles.heading},planName(plan)),text(`${plan.sessions.length} workouts · ${niceDate(plan.sessions[0].date)} to ${niceDate(plan.sessions.at(-1).date)}`),text(`${fit.strengthDays} strength days · ${fit.runningDays} running days · ${fit.easyDays} easy days in week ${fit.week}. Combined workouts count in both categories.`),React.createElement(Details,{key:'week',label:'View first week'},sessions(plan.sessions.filter(x=>x.week===1))),React.createElement(Details,{key:'all',label:'View all workouts'},sessions(plan.sessions)),React.createElement(Details,{key:'phases',label:'Training phases'},plan.phases.map(phase=>React.createElement(View,{key:phase.name,style:styles.stack},text(`${phase.name} · weeks ${phase.weeks}`,phase.name),text(trainingCopy(phase.description),phase.description)))),React.createElement(Details,{key:'notes',label:'Instructions, notes and evidence'},text(trainingCopy(plan.progression)),...plan.notes.map(n=>text(trainingCopy(n),n)),React.createElement(Choice,{label:'Show regional work counts',onPress:()=>Alert.alert('Planned weekly work',fit.regions.map(r=>`${r.name}: ${r.sets} sets involving this region across ${r.days} days`).join('\n')+'\nCompound work can appear in multiple regions. These are planned counts, not equivalent isolation sets or guaranteed results.')}),React.createElement(NativePlanEvidence,{plan,key:plan.id})),text('Accepting starts this reviewed schedule. Your previous plan is archived and completed workouts are kept.','acceptance'),React.createElement(Choice,{key:'another',label:'Choose another plan',onPress:()=>go('choose')})];break;
  }
 }
 if(!loaded)return React.createElement(Text,{style:styles.body},'Opening saved setup…');
 const nextNames={goal:'goal',sport:'sport',experience:'experience',authority:'guidance',days:'availability',frequency:'frequency',time:'workout time',dates:'training dates',location:'equipment',dumbbells:'dumbbells',inventory:'equipment list',access:'movement',extras:'extras',readiness:'readiness',running:'running base'};
 const primary=screen==='review'?{label:saving?'Saving plan…':'Start this plan',onPress:start,disabled:saving||draftBlocked||!selected}:screen==='choose'?{label:'Review this plan',disabled:!option||draftBlocked,onPress:()=>reviewOption(option)}:{label:steps[index+1]?.[0]==='choose'?'See my plans':`Continue to ${nextNames[steps[index+1]?.[0]]}`,onPress:next,disabled:draftBlocked};
 return React.createElement(NativeFlowScreen,{title:current[1],compact,compactTitle:'Setup',onAvailableHeight:setAvailableHeight,scrollResetKey:compact&&error?error:screen==='choose'?`${option?.id}-${showOtherPlans}-${otherPage}-${showUnavailable}-${unavailablePage}`:undefined,subtitle:compact?undefined:`Step ${index+1} of ${steps.length}`,onBack:index>0?back:undefined,footer:React.createElement(NativeActionFooter,{primary,compact},!compact&&!!error&&React.createElement(Text,{accessibilityRole:'alert',style:[styles.body,{color:c.danger}]},error))},draftBlocked?React.createElement(View,{style:styles.stack},text(saveNote),React.createElement(Choice,{label:'Retry saved setup',onPress:()=>{setLoaded(false);setReadAttempt(readAttempt+1)}})):React.createElement(View,{style:styles.stack},compact&&!!error&&React.createElement(Text,{accessibilityRole:'alert',style:[styles.body,{color:c.danger}]},error),compact&&text(`Step ${index+1} of ${steps.length} · ${current[1]}`,'step-progress'),React.createElement(NativeSetupProgress,{key:'section-progress',section:coarse}),screen!=='about'&&React.createElement(Details,{key:'summary',label:'Your setup summary'},setupSummary(p).map((line,n)=>text(line,`summary-${n}`)),text(`Section ${coarse+1} of 4 · ${nativeSetupSections[coarse]}`)),body,(error||planStep)&&React.createElement(Details,{label:'Edit setup choices'},steps.filter(s=>s[2]<3).map(([id,label])=>React.createElement(Choice,{key:id,label,onPress:()=>go(id)})))),React.createElement(Text,{accessibilityLiveRegion:'polite',style:[styles.body,{color:c.muted}]},saveNote));
}
export {PlanSetup};
