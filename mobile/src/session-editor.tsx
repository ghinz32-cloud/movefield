import {useThemedStyles} from './appearance';
import {sessionName} from './shared/presentation';
import React,{useRef,useState} from 'react';
import {View,Text,TextInput,Pressable,StyleSheet} from 'react-native';
import {type State,type Item,exercises,exFor,matchesExercise,niceDate,targetText} from './shared/training';
import {type TrackingEdit,previewTrackingEdit} from './shared/tracking';
import {userTargetError} from './shared/customize';

const baseStyles=StyleSheet.create({body:{fontSize:16,lineHeight:24,color:'#19362D'},input:{fontSize:16,padding:12,minHeight:48,borderWidth:1,borderColor:'#DCE1D7',borderRadius:8},button:{padding:12,minHeight:48,borderRadius:8,backgroundColor:'#E6EDDD',justifyContent:'center'},row:{flexDirection:'row',flexWrap:'wrap',gap:8},card:{gap:8,padding:12,borderWidth:1,borderColor:'#DCE1D7',borderRadius:10}});
function Button({label,onPress,disabled=false}:{label:string;onPress:()=>void;disabled?:boolean}){
 const styles=useThemedStyles(baseStyles),lastPress=useRef(-Infinity);
 return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} style={[styles.button,disabled&&{opacity:.4}]} onPress={()=>{const now=Date.now();if(now-lastPress.current<300)return;lastPress.current=now;onPress()}}><Text style={styles.body}>{label}</Text></Pressable>;
}
export function SessionEditor({state,sessionId,onSave}:{state:State;sessionId:string;onSave:(edit:TrackingEdit)=>string|undefined}){
 const styles=useThemedStyles(baseStyles),session=state.plan?.sessions.find(x=>x.id===sessionId);
 const [base]=useState({planId:state.plan?.id||'',version:state.plan?.version||0,sessionId});
 const [items,setItems]=useState<Item[]>(()=>session?.items.map(i=>({...i}))||[]),[search,setSearch]=useState(''),[exercise,setExercise]=useState(''),[sets,setSets]=useState('2'),[amount,setAmount]=useState('8'),[maximum,setMaximum]=useState('12'),[rest,setRest]=useState('90'),[editingId,setEditingId]=useState<string|null>(null),[repeatWeekday,setRepeatWeekday]=useState(false),[allowLonger,setAllowLonger]=useState(false),[message,setMessage]=useState(''),[saved,setSaved]=useState(false);
 const saveStarted=useRef(false),keepStarted=useRef(false),draftItems=useRef(items);
 const setDraftItems=(value:Item[])=>{draftItems.current=value;setItems(value)};
 const stale=!session||!state.plan||state.plan.id!==base.planId||state.plan.version!==base.version;
 const library=[...exercises,...state.custom],edit:TrackingEdit={...base,items,allowLonger,repeatWeekday},preview=previewTrackingEdit(state,edit),selected=library.find(x=>x.id===exercise);
 const cancelExercise=()=>{setExercise('');setEditingId(null);keepStarted.current=false};
 const add=()=>{
  if(stale||keepStarted.current)return;
  if(!selected){setMessage('Choose an exercise first.');return}
  const prior=editingId?draftItems.current.find(i=>i.exerciseId===editingId):undefined;
  if(editingId&&!prior){setMessage('That exercise changed. Cancel this edit and select it again.');return}
  const item:Item={...prior,exerciseId:exercise,sets:Number(sets),reps:Number(amount),...(selected.metric==='reps'?{repMin:Number(amount),repMax:Number(maximum)}:{repMin:undefined,repMax:undefined}),rest:Number(rest),kg:null};
  const problem=userTargetError(item,selected.metric,'tracking');if(problem){setMessage(problem);return}
  if(draftItems.current.some(i=>i.exerciseId!==editingId&&i.exerciseId===exercise)){setMessage('This exercise is already listed. Edit its targets instead.');return}
  if(draftItems.current.length>=100&&editingId===null){setMessage('This workout already has 100 exercises.');return}
  keepStarted.current=true;
  setDraftItems(editingId===null?[...draftItems.current,item]:draftItems.current.map(x=>x.exerciseId===editingId?item:x));
  setExercise('');setEditingId(null);setMessage('');
 };
 const move=(id:string,delta:number)=>{
  const next=draftItems.current.slice(),n=next.findIndex(i=>i.exerciseId===id);
  if(stale||n<0||n+delta<0||n+delta>=next.length)return;
  [next[n],next[n+delta]]=[next[n+delta],next[n]];setDraftItems(next);
 };
 const save=()=>{
  if(stale||saveStarted.current)return;
  if(exercise){setMessage('Keep or cancel your exercise edit before saving the workout.');return}
  if(preview.errors.length){setMessage(preview.errors.join(' '));return}
  saveStarted.current=true;
  try{const result=onSave({...edit,items:draftItems.current});if(result){saveStarted.current=false;setMessage(result)}else{setSaved(true);setMessage('Workout targets saved.')}}catch(error){saveStarted.current=false;setMessage(error instanceof Error?error.message:'The changes could not be saved. Your targets remain open.')}
 };
 if(stale||!state.plan)return <View style={{gap:16}}><Text accessibilityRole="alert" style={styles.body}>The plan changed while this editor was open. Close and reopen this workout to review its current targets.</Text></View>;
 const currentPlan=state.plan;
 return <View style={{gap:16}}>
  <Text style={styles.body}>Enter the exercises and targets from your plan or coach. Dates and saved workouts stay the same.</Text>
  {items.map((i,n)=><View key={i.exerciseId} style={styles.card}>
   <Text style={styles.body}>{n+1}. {exFor(i.exerciseId,state.custom).name} · {i.sets} × {targetText(i)} {exFor(i.exerciseId,state.custom).metric} · {i.rest}s rest</Text>
   <View style={styles.row}>
    <Button disabled={saved} label="Edit" onPress={()=>{setEditingId(i.exerciseId);setExercise(i.exerciseId);setSets(String(i.sets));setAmount(String(i.repMin??i.reps));setMaximum(String(i.repMax??i.reps));setRest(String(i.rest));keepStarted.current=false;setMessage('')}}/>
    <Button disabled={saved} label="Remove" onPress={()=>{setDraftItems(draftItems.current.filter(x=>x.exerciseId!==i.exerciseId));if(editingId===i.exerciseId)cancelExercise()}}/>
    {n>0&&<Button disabled={saved} label="Move up" onPress={()=>move(i.exerciseId,-1)}/>}
    {n<items.length-1&&<Button disabled={saved} label="Move down" onPress={()=>move(i.exerciseId,1)}/>}
   </View>
  </View>)}
  {!saved&&<>
   <Text style={styles.body}>{editingId===null?'Add an exercise':'Edit targets'}</Text>
   <TextInput accessibilityLabel="Find an exercise for this workout" style={styles.input} placeholder="Search name or movement" value={search} onChangeText={setSearch} maxLength={200}/>
   {!exercise&&library.filter(e=>matchesExercise(e,search)).slice(0,12).map(e=><Button key={e.id} label={e.name+' · '+e.equipment} onPress={()=>{setExercise(e.id);setAmount(e.metric==='reps'?'8':e.metric==='seconds'?'30':'10');setMaximum('12');setEditingId(null);keepStarted.current=false}}/>)}
   {selected&&<>
    <Text style={styles.body}>{selected.name} · {selected.loadConvention}</Text>
    {[{label:'Sets',value:sets,set:setSets},{label:selected.metric==='reps'?'Minimum reps':`Target ${selected.metric}`,value:amount,set:setAmount},...(selected.metric==='reps'?[{label:'Maximum reps',value:maximum,set:setMaximum}]:[]),{label:'Rest seconds',value:rest,set:setRest}].map(field=><View key={field.label}><Text style={styles.body}>{field.label}</Text><TextInput accessibilityLabel={field.label} style={styles.input} keyboardType="decimal-pad" value={field.value} onChangeText={field.set} maxLength={8}/></View>)}
    <Button label={editingId===null?'Add these targets':'Keep edited targets'} onPress={add}/>
    <Button label="Cancel exercise edit" onPress={cancelExercise}/>
   </>}
   <Text style={styles.body}>Estimated session: {preview.minutes} min · available: {currentPlan.profile.minutes} min</Text>
   {preview.minutes>currentPlan.profile.minutes&&<Button label={allowLonger?'Extra time accepted':'Accept this longer session'} onPress={()=>setAllowLonger(!allowLonger)}/>}
   <Button label={repeatWeekday?(currentPlan.profile.programId?.startsWith('ref-')?'Scope: this and future repetitions of this source workout':'Scope: this and future workouts on the same weekday'):'Scope: this workout only'} onPress={()=>setRepeatWeekday(!repeatWeekday)}/>
   <Text style={styles.body}>{preview.sessions.length} workouts will use these targets:</Text>
   {preview.sessions.map(s=><Text key={s.id} style={styles.body}>{niceDate(s.date)} · {sessionName(s,currentPlan)}</Text>)}
   <Button label="Save workout targets" onPress={save}/>
  </>}
  {!!message&&<Text accessibilityRole="alert" style={styles.body}>{message}</Text>}
 </View>;
}
