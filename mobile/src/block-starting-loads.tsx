import React,{useState} from 'react';
import {View,Text,TextInput,StyleSheet} from 'react-native';
import {GrizzlyPressable as Pressable} from './wild-interactions';
import {useThemedStyles} from './appearance';
import {startingLoadDraftRows,startingWeightInput,type StartingLoadDraft} from './shared/block-starting-loads';
import {niceDate,targetText,displayLoad,requiresSetup,type State,type Plan} from './shared/training';
const base=StyleSheet.create({body:{fontSize:14,lineHeight:20,color:'#19362D'},title:{fontSize:16,fontWeight:'700',color:'#19362D'},row:{gap:6,paddingVertical:10,borderBottomWidth:1,borderColor:'#DCE1D7'},input:{minHeight:44,borderWidth:1,borderColor:'#DCE1D7',borderRadius:8,paddingHorizontal:10,fontSize:16,color:'#19362D'},button:{minHeight:44,borderWidth:1,borderColor:'#DCE1D7',borderRadius:8,padding:10,justifyContent:'center'},controls:{flexDirection:'row',flexWrap:'wrap',gap:8,alignItems:'flex-end'}});
export function NativeBlockStartingLoads({state,plan,draft,chosen,busy,onEdit}:{state:State;plan:Plan;draft:StartingLoadDraft;chosen:number;busy:boolean;onEdit:(key:string,patch:{value?:string;setup?:string})=>void}){
 const styles=useThemedStyles(base),[open,setOpen]=useState(false),rows=startingLoadDraftRows(state,plan,draft);
 if(!rows.length)return null;
 return <View style={{gap:8}}><Pressable accessibilityRole="button" accessibilityState={{expanded:open,disabled:busy}} disabled={busy} style={styles.button} onPress={()=>setOpen(!open)}><Text style={styles.title}>Starting weights · {chosen} chosen {open?'−':'+'}</Text></Pressable>{open&&<>
  <Text style={styles.body}>Optional. Each weight applies to its first exercise exposure. Later workouts keep the plan’s progression rules. Blank means unknown.</Text>
  {rows.map(row=><View style={styles.row} key={row.key}><Text style={styles.title}>{row.exercise.name}</Text><Text style={styles.body}>{row.item.sets} × {targetText(row.item)} · {niceDate(row.date)}</Text><Text style={styles.body}>{row.exercise.loadConvention}</Text>
   {requiresSetup(row.exercise)&&<><Text style={styles.body}>Machine and setup</Text><TextInput accessibilityLabel={`Starting setup for ${row.exercise.name} on ${niceDate(row.date)}`} value={draft[row.key]?.setup??row.setup} editable={!busy} maxLength={200} style={styles.input} onChangeText={setup=>onEdit(row.key,{setup})}/></>}
   <View style={styles.controls}><View style={{flexGrow:1,minWidth:100,gap:4}}><Text style={styles.body}>Weight ({state.profile.units})</Text><TextInput accessibilityLabel={`Starting weight for ${row.exercise.name} on ${niceDate(row.date)}`} value={draft[row.key]?.value??''} placeholder="Unknown" keyboardType="decimal-pad" editable={!busy} maxLength={20} style={styles.input} onChangeText={value=>onEdit(row.key,{value})}/></View>
    {row.recent&&<Pressable accessibilityRole="button" accessibilityLabel={`Use recorded ${displayLoad(row.recent.kg,state.profile.units)} for ${row.exercise.name} on ${niceDate(row.date)}`} accessibilityState={{disabled:busy}} disabled={busy} style={styles.button} onPress={()=>onEdit(row.key,{value:startingWeightInput(row.recent!.kg,state.profile.units)})}><Text style={styles.body}>Use recorded {displayLoad(row.recent.kg,state.profile.units)}</Text></Pressable>}
   </View><Text style={styles.body}>{row.recent?niceDate(row.recent.date)+'. ':''}{row.reason}{row.limitKg!==undefined?' Available maximum: '+displayLoad(row.limitKg,state.profile.units)+'.':''}</Text>
  </View>)}
 </>}</View>;
}
