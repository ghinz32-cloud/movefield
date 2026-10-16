import React,{useState} from 'react';
import {StyleSheet,Text,View} from 'react-native';
import type {CoachingSummary} from './shared/workout-coaching';
import {useNativeAppearance,useThemedStyles} from './appearance';
import {GrizzlyPressable} from './wild-interactions';

const base=StyleSheet.create({
 card:{padding:16,borderWidth:1,borderColor:'#DCE1D7',borderRadius:12,backgroundColor:'#FFFFFF',gap:10},
 label:{fontSize:14,lineHeight:20,color:'#66746B',fontWeight:'700'},
 title:{fontSize:22,lineHeight:28,color:'#19362D',fontWeight:'700'},
 body:{fontSize:16,lineHeight:24,color:'#19362D'},
 button:{minHeight:48,padding:12,borderWidth:1,borderColor:'#DCE1D7',borderRadius:10,justifyContent:'center'},
});

/** Render the same bounded, local coaching facts as the web app. No targets are changed here. */
export function NativeWorkoutCoaching({summary,onOpenRecord}:{summary:CoachingSummary|null;onOpenRecord?:()=>void}){
 const styles=useThemedStyles(base),{colors}=useNativeAppearance(),[expandedKey,setExpandedKey]=useState<string|null>(null);
 if(!summary)return null;
 const expanded=expandedKey===summary.contextVersion,before=summary.phase==='before',detailLabel=before?'Why this pre-workout guidance':'Why this workout feedback';
 return <View style={styles.card}>
  <Text style={styles.label}>{before?'BEFORE YOUR WORKOUT':'AFTER YOUR WORKOUT'}</Text>
  <Text accessibilityRole="header" style={styles.title}>{summary.title}</Text>
  {summary.messages.map(message=><Text key={message.id} style={styles.body}>{message.text}</Text>)}
  {!!summary.details.length&&<>
   <GrizzlyPressable accessibilityRole="button" accessibilityLabel={detailLabel} accessibilityState={{expanded}} aria-expanded={expanded} onPress={()=>setExpandedKey(expanded?null:summary.contextVersion)} style={styles.button}><Text style={[styles.body,{color:colors.green}]}>{expanded?'Hide details':'Why this guidance'}</Text></GrizzlyPressable>
   {expanded&&<View style={{gap:8}}>{summary.details.map((detail,index)=><Text key={index} style={styles.body}>{detail}</Text>)}</View>}
  </>}
  {onOpenRecord&&<GrizzlyPressable accessibilityRole="button" onPress={onOpenRecord} style={styles.button}><Text style={[styles.body,{color:colors.green}]}>View saved workout</Text></GrizzlyPressable>}
 </View>;
}
