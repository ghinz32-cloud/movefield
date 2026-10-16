import React,{useEffect,useState} from 'react';
import {View,Text,StyleSheet} from 'react-native';
import {todayView} from './shared/today-view';
import {niceDate,type State,type Session} from './shared/training';
import {sessionName,workoutName} from './shared/presentation';
import {durationText} from './shared/session-duration';
import {useNativeAppearance,useThemedStyles} from './appearance';
import {NativeAccountButton} from './account-button';
import {NativeBearDecoration,NativeGrizzlyPaw} from './bear-decoration';
import {isGrizzly} from './shared/brand';
import {getGrizzlyDailyMessage,grizzlyMessageContext,grizzlyLocalDayKey,millisecondsUntilNextLocalDay} from './shared/grizzly-messages';
const base=StyleSheet.create({body:{color:'#19362D',fontSize:16,lineHeight:23},title:{color:'#19362D',fontSize:26,fontWeight:'700',lineHeight:33},label:{color:'#19362D',fontSize:14,fontWeight:'700',lineHeight:21},small:{color:'#66746b',fontSize:14,lineHeight:21}});
export function NativeTodayHero({state:s,sample,busy=false,onStart,onPreview,onTargets,onPlan,onResume,onResetSampleHold}:{state:State;sample:boolean;busy?:boolean;onStart:(session:Session)=>void;onPreview:(session:Session)=>void;onTargets:(session:Session)=>void;onPlan:()=>void;onResume:()=>void;onCalendar?:()=>void;onResetSampleHold:()=>void}){
 const styles=useThemedStyles(base),{p,colors,active}=useNativeAppearance();
 const [messageDay,setMessageDay]=useState(()=>grizzlyLocalDayKey());
 useEffect(()=>{
  if(!active)return;
  let timer:ReturnType<typeof setTimeout>;
  const refresh=()=>{clearTimeout(timer);const now=new Date();setMessageDay(grizzlyLocalDayKey(now));timer=setTimeout(refresh,millisecondsUntilNextLocalDay(now)+25)};
  refresh();return()=>clearTimeout(timer);
 },[active]);
 const view=todayView(s,messageDay),session=view.session;
 const context=grizzlyMessageContext({active:!!s.active,hold:s.hold,paused:s.plan?.paused,action:view.action,issue:!!view.issue,overdue:view.overdue.length>0});
 const message=getGrizzlyDailyMessage(context,messageDay);
 const action=()=>{if(view.action==='resume')onResume();else if(view.action==='start'&&session)onStart(session);else if(view.action==='targets'&&session)onTargets(session);else if(view.action==='preview'&&session)onPreview(session);else onPlan()};
 return <View style={{padding:18,borderWidth:1,borderColor:colors.line,borderRadius:isGrizzly&&p.grizzlyStyle==='wild'?6:20,backgroundColor:colors.white,gap:12}}>
  <NativeBearDecoration/>
  <View style={{flexDirection:'row',alignItems:'center',gap:10}}><Text style={[styles.label,{flex:1,color:colors.muted}]}>{view.label}</Text><NativeGrizzlyPaw/></View>
  <View style={{gap:6}}>
   <Text accessibilityRole="header" style={styles.title}>{s.active?workoutName(s.active,s):session?sessionName(session,s.plan):s.plan?'Review this block':'Your first plan'}</Text>
   {session&&<Text style={styles.small}>{niceDate(s.active?.date||session.date)} · {durationText(session,s.custom)} · {session.items.length} exercises</Text>}
   {s.active&&<Text style={styles.body}>{s.active.sets.filter(x=>x.done).length} of {s.active.sets.length} sets/tasks logged</Text>}
  </View>
  {view.issue&&!s.active&&<Text style={styles.body}>{view.issue}</Text>}
  {s.hold&&<Text style={[styles.body,{color:colors.danger}]}>Stop the affected activity and seek appropriate guidance. Your logged work is kept.</Text>}
  {s.plan?.paused&&<Text style={styles.small}>Paused until you choose to resume.</Text>}
  <View style={{backgroundColor:colors.green,borderRadius:12}}><NativeAccountButton disabled={busy&&(view.action==='start'||view.action==='targets')} label={view.actionLabel} onPress={action} colors={{...colors,line:colors.green}} text={{...styles.body,color:colors.onAccent,fontWeight:'700',textAlign:'center'}}/></View>
  {view.overdue.length>0&&!s.active&&<Text style={styles.small}>{view.overdue.length} earlier workout{view.overdue.length===1?' needs':'s need'} review.</Text>}
  {view.calendar.events.length>0&&<Text style={styles.small}>{view.calendar.events.length} commitment{view.calendar.events.length===1?'':'s'} today · see Calendar</Text>}
  {isGrizzly&&<View style={{gap:4,paddingTop:10,borderTopWidth:1,borderTopColor:colors.line}}><Text style={styles.label}>{message.title}</Text><Text style={styles.small}>{message.body}</Text></View>}
  {s.hold&&sample&&<NativeAccountButton label="Reset simulated concern hold" onPress={onResetSampleHold} colors={colors} text={styles.small}/>}
 </View>;
}
