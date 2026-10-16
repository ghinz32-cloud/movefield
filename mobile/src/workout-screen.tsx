import React,{useState} from 'react';
import {Text,TextInput,View,useWindowDimensions,type LayoutChangeEvent} from 'react-native';
import {GrizzlyPressable as Pressable} from './wild-interactions';
import {useNativeAppearance} from './appearance';
import {NativeNumericInput} from './numeric-input';
import {NativeSetMetrics} from './set-metrics';
import {NativeSetRir} from './set-rir';
import {displayLoad,exFor,isLoadTracked,loadSuggestion,targetText,toKg,type Exercise,type SetLog,type State,type Workout} from './shared/training';
import {completedSetError} from './shared/rest-timer';
import {workoutExercises} from './shared/workout-flow';
import {trainingCopy} from './shared/presentation';
import {sessionGuide} from './shared/session-guide';
import {NativeActionFooter,NativeFlowScreen,NativeSettingsRow} from './phone-ui';
import {nativeWindowLayout} from './adaptive-layout';

export type NativeWorkoutScreenProps={
 state:State;
 focusedExercise:string|null;
 busy:boolean;
 remaining:number|null;
 restMessage?:string;
 compact?:boolean;
 onAvailableHeight?:(height:number)=>void;
 sampleMode?:boolean;
 saveStatus?:string;
 saveError?:string;
 onRetrySave?:()=>void;
 onFocusExercise:(id:string|null)=>void;
 onChangeSet:(index:number,patch:Partial<SetLog>)=>void;
 onLogSet:(index:number,restSeconds:number)=>Promise<boolean>;
 onChangeSetup:(exerciseId:string,text:string)=>void;
 onOpenGuide:(exercise:Exercise)=>void;
 onSubstitute:(exerciseId:string)=>void;
 onChangeFeedback:(patch:Partial<Pick<Workout,'effort'|'symptom'|'supervisorConfirmed'>>)=>void;
 onPauseRest:()=>void;
 onExtendRest:()=>void;
 onEndRest:()=>void;
 onToggleRestAlerts:()=>void;
 onFinish:()=>void;
 onDiscard:()=>void;
 onExit:()=>void;
 onLayout?:(event:LayoutChangeEvent)=>void;
};

type Route='set'|'list'|'options'|'sets'|'details'|'timer'|'instructions'|'guidance'|'effort'|'concern'|'finish';

/** Presentation only: durable logging, paired-set routing and confirmations stay in App. */
export function NativeWorkoutScreen(props:NativeWorkoutScreenProps){
 const {state,focusedExercise,busy,remaining}=props,{colors:c,p}=useNativeAppearance(),window=useWindowDimensions();
 const [route,setRoute]=useState<Route>(focusedExercise?'set':'list'),[selectedSet,setSelectedSet]=useState<number|null>(null),[pending,setPending]=useState(false),[error,setError]=useState('');
 const active=state.active;
 const [viewIdentity,setViewIdentity]=useState({workoutId:active?.id,exerciseId:focusedExercise});
 if(viewIdentity.workoutId!==active?.id||viewIdentity.exerciseId!==focusedExercise){
  setViewIdentity({workoutId:active?.id,exerciseId:focusedExercise});
  setRoute(focusedExercise?'set':'list');setSelectedSet(null);setError('');
 }
 if(!active)return null;
 const disabled=busy||pending,rows=workoutExercises(state),done=active.sets.filter(x=>x.done).length,total=active.sets.length;
 const target=rows.find(row=>row.target.exerciseId===focusedExercise)?.target,exercise=target?exFor(target.exerciseId,state.custom):undefined;
 const sets=active.sets.map((set,index)=>({set,index})).filter(row=>row.set.exerciseId===focusedExercise);
 const current=sets.find(row=>row.index===selectedSet)??sets.find(row=>!row.set.done)??sets[sets.length-1];
 const session=state.plan?.sessions.find(s=>s.id===active.sessionId),scale=p.textSize/100;
 const dimensions=nativeWindowLayout(window.width,window.height,p.textSize,window.fontScale),layout={...dimensions,compactHeight:props.compact??dimensions.compactHeight};
 const text={fontSize:16*scale,lineHeight:23*scale,color:c.ink},small={fontSize:14*scale,lineHeight:20*scale,color:c.muted};
 const stacked=window.width<300||scale>1.25||window.fontScale>1.25;
 const button=(label:string,onPress:()=>void,selected?:boolean)=><Pressable accessibilityRole="button" accessibilityState={{disabled,selected}} disabled={disabled} onPress={onPress} style={{minHeight:48,padding:12,borderRadius:12,borderWidth:1,borderColor:c.line,backgroundColor:selected?c.green:c.white,justifyContent:'center'}}><Text style={{...text,color:selected?c.onAccent:c.ink}}>{label}</Text></Pressable>;
 const choice=(label:string,onPress:()=>void,selected?:boolean)=><NativeSettingsRow label={label} disabled={disabled} selected={selected} onPress={onPress}/>;
 const focus=(id:string|null)=>{setSelectedSet(null);setError('');setRoute(id?'set':'list');props.onFocusExercise(id)};
 const go=(next:Route)=>{setRoute(next);setError('')};
 const optionsButton=layout.compactHeight?<Pressable accessibilityRole="button" accessibilityLabel="Options" accessibilityState={{disabled}} disabled={disabled} onPress={()=>go('options')} style={{width:48,minHeight:48,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:c.line,borderRadius:12}}><Text accessible={false} style={{fontSize:28,lineHeight:34,color:c.ink}}>⋯</Text></Pressable>:button('Options',()=>go('options'));
 const back=()=>{
  if(disabled)return;
  if(route==='list'){props.onExit();return}
  if(route==='set'){focus(null);return}
  if(route==='finish'){go('concern');return}
  if(route==='concern'){go('effort');return}
  if(route==='effort'){go(target?'set':'list');return}
  if(route==='options'){go(target?'set':'list');return}
  go('options');
 };
 const restLabel=remaining===null?'':remaining===0?'Rest complete · continue when ready':`Rest ${state.restTimer?.pausedSeconds!==null?'paused · ':''}${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`;
 const concern=state.hold||['yes','unsure'].includes(active.symptom||'');
 const notice=concern?<Text accessibilityRole="alert" style={{...small,color:c.danger}}>A concern is recorded. Stop the affected activity; recording and partial save remain available.</Text>:null;
 const footer=(label:string,onPress:()=>void,blocked=false,accessibilityLabel?:string)=><NativeActionFooter compact={layout.compactHeight} primary={{label,onPress,disabled:disabled||blocked,...(accessibilityLabel?{accessibilityLabel}:{})}}>{!!restLabel&&!layout.compactHeight&&<Text style={small}>{restLabel}</Text>}</NativeActionFooter>;
 const exerciseList=<><Text accessibilityRole="header" style={{...text,fontWeight:'700'}}>Workout exercises</Text><Text style={small}>{done} of {total} entries logged</Text>{rows.map(({target:row,done:count,total:expected,complete},index)=><NativeSettingsRow key={row.exerciseId} label={`${index+1}. ${exFor(row.exerciseId,state.custom).name}`} value={`${count}/${expected} logged${complete?' · Complete':''}`} selected={row.exerciseId===focusedExercise} onPress={()=>focus(row.exerciseId)} disabled={disabled}/>)}</>;
 const screen=(title:string,children:React.ReactNode,action:React.ReactNode,options:{subtitle?:string;trailing?:React.ReactNode;backLabel?:string;compactBack?:boolean;compactTitle?:string}={})=><NativeFlowScreen title={title} compactTitle={options.compactTitle} compact={layout.compactHeight} onAvailableHeight={props.onAvailableHeight} subtitle={[layout.compactHeight&&props.sampleMode?'Sample workout':undefined,options.subtitle].filter(Boolean).join(' · ')||undefined} onBack={back} backLabel={options.backLabel??'Back'} compactBack={options.compactBack} trailing={options.trailing} handleHardwareBack footer={action} sidePanel={route==='set'&&target?exerciseList:undefined}><View onLayout={props.onLayout} style={{gap:16}}>
  {layout.compactHeight&&!!props.saveError&&<Text accessibilityRole="alert" style={{...text,color:c.danger}}>{props.saveError}</Text>}
  {layout.compactHeight&&props.saveStatus?.startsWith('Save failed')&&<>{<Text accessibilityRole="alert" style={{...small,color:c.danger}}>{props.saveStatus}</Text>}{props.onRetrySave&&button('Retry saving on this device',props.onRetrySave)}</>}
  {children}
 </View></NativeFlowScreen>;
 const feedback=(patch:Partial<Pick<Workout,'effort'|'symptom'|'supervisorConfirmed'>>)=>props.onChangeFeedback(patch);

 if(route==='effort')return screen('How did it feel?',<>
  <Text style={small}>Optional · 1 of 3</Text>
  {choice('Easier',()=>feedback({effort:'easier'}),active.effort==='easier')}
  {choice('About right',()=>feedback({effort:'right'}),active.effort==='right')}
  {choice('Harder',()=>feedback({effort:'harder'}),active.effort==='harder')}
  {choice('Skip effort',()=>feedback({effort:'unsure'}),(active.effort||'unsure')==='unsure')}
 </>,footer('Continue',()=>go('concern')));

 if(route==='concern')return screen('Any pain or concern?',<>
  <Text style={small}>Optional · 2 of 3</Text>
  {choice('No',()=>feedback({symptom:'no'}),active.symptom==='no')}
  {choice('Yes',()=>feedback({symptom:'yes'}),active.symptom==='yes')}
  {choice('Unsure',()=>feedback({symptom:'unsure'}),active.symptom==='unsure')}
  {choice('Skip concern',()=>feedback({symptom:'skip'}),(active.symptom||'skip')==='skip')}
  {notice}
 </>,footer('Review save',()=>go('finish')));

 if(route==='finish')return screen('Save workout',<>
  <Text style={{...text,fontSize:26*scale,lineHeight:32*scale,fontWeight:'700'}}>{done} of {total} entries logged</Text>
  <Text style={text}>{done<total?'Save the work you did as a partial workout.':'Your logged work is ready to save to history.'}</Text>
  <Text style={small}>Effort: {({easier:'easier',right:'about right',harder:'harder'} as Record<string,string>)[active.effort||'']??'not recorded'} · Concern: {({no:'no',yes:'yes',unsure:'unsure'} as Record<string,string>)[active.symptom||'']??'not recorded'}</Text>
  {notice}
  {state.profile.age<18&&choice(active.supervisorConfirmed?'Supervision recorded':'Confirm qualified supervision today',()=>feedback({supervisorConfirmed:!active.supervisorConfirmed}),!!active.supervisorConfirmed)}
  {choice('Back to workout',()=>go(target?'set':'list'))}
 </>,footer('Finish & save workout',props.onFinish));

 if(route==='options')return screen('Workout options',<>
  {target&&exercise&&<><NativeSettingsRow label="Exercise guide" onPress={()=>props.onOpenGuide(exercise)} disabled={disabled}/>{exercise.metric==='reps'&&<NativeSettingsRow label="Substitute exercise" onPress={()=>props.onSubstitute(exercise.id)} disabled={disabled}/>}<NativeSettingsRow label="Set details" detail="Reps left, measurements and notes" onPress={()=>go('details')} disabled={disabled}/><NativeSettingsRow label="Sets / edit previous" onPress={()=>go('sets')} disabled={disabled}/><NativeSettingsRow label="Plan instructions" onPress={()=>go('instructions')} disabled={disabled}/></>}
  <NativeSettingsRow label="Workout guidance" detail="Warm-up, effort, order and progression" onPress={()=>go('guidance')} disabled={disabled}/>
  <NativeSettingsRow label="Rest timer and alerts" value={restLabel||'No rest running'} onPress={()=>go('timer')} disabled={disabled}/>
  <NativeSettingsRow label="Discard this workout" danger onPress={props.onDiscard} disabled={disabled}/>
 </>,footer('Review finish',()=>go('effort')));

 if(route==='guidance'){
  const guide=state.plan&&session?sessionGuide(state.plan,session):null;
  const section=(title:string,lines:string[])=>lines.length>0&&<View style={{gap:8}}><Text accessibilityRole="header" style={{...text,fontWeight:'700'}}>{title}</Text>{lines.map((line,index)=><Text key={index} style={text}>{line}</Text>)}</View>;
  return screen('Workout guidance',guide?<>
   {section('Warm-up',guide.warmup)}
   {section('Effort',[guide.effort])}
   {section('Exercise order',guide.order)}
   {section('Progression',guide.progression)}
   {section('Finish',[guide.finish])}
  </>:<Text style={text}>This saved workout is not linked to a current plan session. Follow the guidance from your own plan or coach.</Text>,footer('Back to workout',()=>go(target?'set':'list')));
 }

 if(route==='timer')return screen('Rest timer',<>
  <Text style={{...text,fontSize:24*scale,lineHeight:30*scale,fontWeight:'700'}}>{restLabel||'No rest running'}</Text>
  {state.restTimer&&<>{choice(state.restTimer.pausedSeconds!==null?'Resume':'Pause',props.onPauseRest)}{choice('+30 sec',props.onExtendRest)}{choice('End rest',props.onEndRest)}</>}
  {choice(state.restAlerts?'Turn off rest alerts':'Enable rest alerts',props.onToggleRestAlerts)}
  <Text style={small}>Take more rest when needed. Phone settings may delay alerts.</Text>
  {!!props.restMessage&&<Text accessibilityLiveRegion="polite" style={small}>{props.restMessage}</Text>}
 </>,footer('Back to workout',()=>go(target?'set':'list')));

 if(!target||!exercise||route==='list')return screen('Your workout',<>
  <Text style={small}>{done} of {total} sets or activity entries logged</Text>
  {rows.map(({target:row,done:count,total:expected,complete},index)=><NativeSettingsRow key={row.exerciseId} label={`${index+1}. ${exFor(row.exerciseId,state.custom).name}`} value={`${count}/${expected} logged${complete?' · Complete':''}`} onPress={()=>focus(row.exerciseId)} disabled={disabled}/>)}
 </>,done===total?footer('Review finish',()=>go('effort')):footer('Continue next exercise',()=>{const next=rows.find(row=>!row.complete);if(next)focus(next.target.exerciseId)},!rows.some(row=>!row.complete)),{backLabel:'Today',trailing:optionsButton});

 const tracked=isLoadTracked(exercise);
 if(route==='sets')return screen('Sets / edit previous',<>
  <Text style={text}>{exercise.name}</Text>
  {sets.map(({set,index})=><NativeSettingsRow key={index} label={`Set ${set.set}`} value={set.done?'Saved':'Not logged'} selected={current?.index===index} onPress={()=>{setSelectedSet(index);go('set')}} disabled={disabled}/>)}
 </>,footer('Back to current set',()=>{setSelectedSet(null);go('set')}));

 if(route==='details')return screen('Set details',current?<>
  <Text style={text}>{exercise.name} · set {current.set.set}</Text>
  {exercise.metric==='reps'&&<NativeSetRir name={exercise.name} set={current.set.set} value={current.set.rir} disabled={disabled} onChange={rir=>props.onChangeSet(current.index,{rir})}/>}
  <NativeSetMetrics name={exercise.name} set={current.set.set} value={current.set.metrics} disabled={disabled} onChange={metrics=>props.onChangeSet(current.index,{metrics})}/>
  {current.set.done&&choice(`Undo saved set ${current.set.set}`,()=>props.onChangeSet(current.index,{done:false}))}
 </>:<Text style={text}>No set entry is available.</Text>,footer('Back to current set',()=>go('set')));

 if(route==='instructions'){
  const suggestion=tracked?loadSuggestion({...state,loadContext:{...state.loadContext,...active.loadContext}},target):undefined;
  return screen('Plan instructions',<>
   <Text style={{...text,fontWeight:'700'}}>{exercise.name}</Text><Text style={text}>{target.sets} × {targetText(target)} {exercise.metric} · {target.rest}s rest</Text>
   {!!target.loadRole&&<Text style={small}>Load role: {trainingCopy(target.loadRole)}</Text>}
   {!!target.note&&<Text style={text}>{trainingCopy(target.note)}</Text>}
   {suggestion&&<Text style={text}>{suggestion.kg===null?'Choose a manageable available load.':displayLoad(suggestion.kg,state.profile.units)} {suggestion.reason}</Text>}
   {session?.runSteps&&<View style={{gap:8}}><Text style={{...text,fontWeight:'700'}}>Run / walk sequence</Text>{session.runSteps.map((step,index)=><Text key={index} style={text}>{index+1}. {step.label} · {step.seconds/60} min</Text>)}</View>}
  </>,footer('Back to current set',()=>go('set')));
 }

 const log=async()=>{
  if(!current||current.set.done||disabled)return;
  const invalid=completedSetError(current.set.reps,current.set.kg,exercise.metric);
  if(invalid){setError(invalid);return}
  setPending(true);setError('');
  try{if(await props.onLogSet(current.index,target.rest))setSelectedSet(null);else setError('This set could not be saved. Your entries are kept; try again.')}catch(cause){setError(cause instanceof Error?cause.message:'This set could not be saved. Try again.')}finally{setPending(false)}
 };
 return screen(current?`Set ${current.set.set} of ${sets.length}`:'Workout set',<>
  <View style={{gap:6}}><Text style={small}>Exercise {rows.findIndex(row=>row.target.exerciseId===focusedExercise)+1} of {rows.length}</Text><Text accessibilityRole="header" style={{...text,fontSize:25*scale,lineHeight:31*scale,fontWeight:'700'}}>{exercise.name}</Text><Text style={text}>{targetText(target)} {exercise.metric} · {target.rest}s rest</Text></View>
  {layout.compactHeight&&!!restLabel&&<Text accessibilityLiveRegion="none" style={small}>{restLabel} · controls in Options</Text>}
  {notice}
  {exercise.requiresSetup&&<View style={{gap:6}}><Text style={small}>Machine / attachment / seat setting</Text><TextInput style={{...text,minHeight:48,padding:12,borderWidth:1,borderColor:c.line,borderRadius:10}} accessibilityLabel={`${exercise.name} machine setup`} placeholder="Your machine setup" placeholderTextColor={c.muted} value={active.loadContext?.[exercise.id]??''} maxLength={200} editable={!disabled&&!active.sets.some(x=>x.exerciseId===exercise.id&&x.done)} onChangeText={value=>props.onChangeSetup(exercise.id,value)}/></View>}
  {current?<View key={active.id+':'+current.index} style={{gap:12}}>
   <View style={{flexDirection:stacked?'column':'row',gap:12}}><View style={{flex:1,gap:6}}><Text style={small}>Actual {exercise.metric}</Text><NativeNumericInput style={{...text,fontSize:24*scale,lineHeight:30*scale,minHeight:58,padding:12,borderWidth:1,borderColor:c.line,borderRadius:10}} accessibilityLabel={`${exercise.name} set ${current.set.set} actual ${exercise.metric}`} value={current.set.reps} nullable={false} max={9999} editable={!disabled} selectTextOnFocus onValueChange={value=>props.onChangeSet(current.index,{reps:value??0,done:false})}/></View>{tracked&&<View style={{flex:1,gap:6}}><Text style={small}>Load ({state.profile.units})</Text><NativeNumericInput style={{...text,fontSize:24*scale,lineHeight:30*scale,minHeight:58,padding:12,borderWidth:1,borderColor:c.line,borderRadius:10}} accessibilityLabel={`${exercise.name} set ${current.set.set} actual load ${state.profile.units}`} value={current.set.kg===null?null:Math.round(current.set.kg*(state.profile.units==='lb'?2.2046226218:1)*100)/100} nullable max={state.profile.units==='lb'?3306:1500} editable={!disabled} placeholder="Unknown" placeholderTextColor={c.muted} selectTextOnFocus onValueChange={value=>props.onChangeSet(current.index,{kg:value===null?null:toKg(value,state.profile.units),done:false})}/></View>}</View>
   {tracked&&<Text style={small}>{exercise.loadConvention||'Use this exercise’s load convention.'} Blank means unknown.</Text>}
   {exercise.metric==='reps'&&button(`Reps left: ${current.set.rir==null?'not recorded':current.set.rir===5?'5+':current.set.rir}`,()=>go('details'))}
   {current.set.done&&button(`Undo saved set ${current.set.set}`,()=>props.onChangeSet(current.index,{done:false}))}
  </View>:<Text style={text}>No set entries are available. Review the remaining workout.</Text>}
  {error&&<Text accessibilityRole="alert" style={{...text,color:c.danger}}>{error}</Text>}
 </>,footer(current?.set.done?'Saved':pending?'Saving…':'Log set',()=>{void log()},!current||!!current.set.done,current?`${current.set.done?'Saved':'Log'} ${exercise.name} set ${current.set.set}`:undefined),{backLabel:'Workout',compactBack:true,compactTitle:current?`Set ${current.set.set}`:undefined,trailing:optionsButton});
}

