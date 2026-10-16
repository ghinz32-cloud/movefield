import React,{useState} from 'react';
import {Text,View} from 'react-native';
import {GrizzlyPressable as Pressable} from './wild-interactions';
import {useNativeAppearance} from './appearance';
import type {Plan,Session} from './shared/training';
import {niceDate} from './shared/training';
import {sessionName} from './shared/presentation';
import {sessionGuide} from './shared/session-guide';

/** Read the selected prescription only; this never starts or records a workout. */
export function NativeSessionInstructions({plan,session}:{plan:Plan;session:Session}){
 const {colors:c,p}=useNativeAppearance(),text={fontSize:16*p.textSize/100,lineHeight:24*p.textSize/100};
 const [openKey,setOpenKey]=useState('');
 const key=JSON.stringify([plan.id,plan.version,plan.profile.mode,plan.progression,session]);
 const open=openKey===key,guide=sessionGuide(plan,session),hasSteps=!!session.runSteps?.length;
 const line=(value:string,id:string)=><Text key={id} style={{...text,color:c.ink}}>{value}</Text>;
 return <View style={{gap:10}}>
  <Pressable accessibilityRole="button" accessibilityLabel={`Workout instructions: ${sessionName(session,plan)}, ${niceDate(session.date)}`} accessibilityState={{expanded:open}} onPress={()=>setOpenKey(open?'':key)} style={{minHeight:48,padding:12,borderWidth:1,borderColor:c.line,borderRadius:8,justifyContent:'center'}}><Text style={{...text,color:c.ink}}>{open?'Hide workout instructions':'Workout instructions'}</Text></Pressable>
  {open&&<View style={{gap:10}}>
   {hasSteps&&<><Text accessibilityRole="header" style={{...text,color:c.ink,fontWeight:'700'}}>Planned run / walk sequence</Text>{session.runSteps!.map((step,index)=>line(`${index+1}. ${step.label} · ${step.seconds} seconds`,'step-'+index))}{line('These are planned steps. Log only the time and work you actually perform.','planned')}</>}
   {(!hasSteps||plan.profile.mode!=='app')&&guide.warmup.map((value,index)=>line(value,'warmup-'+index))}
   {line(guide.effort,'effort')}{guide.order.map((value,index)=>line(value,'order-'+index))}
   {session.items.map((item,index)=>item.note?line(item.note,'note-'+index):null)}
   {session.progressionStep&&line(session.progressionStep,'stage')}
   {guide.progression.map((value,index)=>line(value,'progression-'+index))}{line(guide.finish,'finish')}
  </View>}
 </View>;
}
