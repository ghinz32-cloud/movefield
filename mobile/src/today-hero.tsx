import React,{useEffect,useState} from 'react';
import {View,Text,StyleSheet,Image} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {todayView} from './shared/today-view';
import {niceDate,type State,type Session} from './shared/training';
import {sessionName,workoutName} from './shared/presentation';
import {durationText} from './shared/session-duration';
import {useNativeAppearance,useThemedStyles} from './appearance';
import {GrizzlyPressable as Pressable} from './wild-interactions';
import {NativeBearDecoration,NativeGrizzlyPaw} from './bear-decoration';
import {isGrizzly} from './shared/brand';
import {getGrizzlyDailyMessage,grizzlyMessageContext,grizzlyLocalDayKey,millisecondsUntilNextLocalDay} from './shared/grizzly-messages';
import heroArt from '../assets/wilderness/grizzly-hero-v1.jpg';
const base=StyleSheet.create({body:{color:'#19362D',fontSize:16,lineHeight:24},title:{color:'#19362D',fontSize:33,fontWeight:'700',lineHeight:39},label:{color:'#19362D',fontSize:14,fontWeight:'700',lineHeight:21},small:{color:'#66746b',fontSize:14,lineHeight:21}});
export function NativeTodayHero({state:s,sample,busy=false,onStart,onPreview,onTargets,onPlan,onResume,onCalendar,onResetSampleHold}:{state:State;sample:boolean;busy?:boolean;onStart:(session:Session)=>void;onPreview:(session:Session)=>void;onTargets:(session:Session)=>void;onPlan:()=>void;onResume:()=>void;onCalendar:()=>void;onResetSampleHold:()=>void}){
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
 const wild=isGrizzly&&p.grizzlyStyle==='wild',rest=!s.active&&!view.scheduledToday.length&&['Rest day','Unplanned day','Recorded training','Fixed commitment','Skipped workout'].includes(view.calendar.label);
 const button=(label:string,onPress:()=>void,primary=false,disabled=false)=><Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={{minHeight:48,minWidth:120,flexGrow:1,flexBasis:primary?'100%':0,padding:13,justifyContent:'center',alignItems:'center',borderRadius:wild?6:10,borderWidth:1,borderColor:primary?colors.heroButton:colors.heroBorder,backgroundColor:primary?colors.heroButton:'transparent',opacity:disabled?.5:1}}><Text style={[styles.body,{color:primary?colors.heroOnButton:colors.heroInk,fontWeight:'700',textAlign:'center'}]}>{label}</Text></Pressable>;
 return <LinearGradient colors={[colors.heroFrom,colors.heroTo]} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderWidth:wild?1:0,borderColor:colors.heroBorder,borderTopWidth:wild?3:0,borderRadius:wild?6:20,overflow:'hidden'}}>
  {wild&&!p.contrast&&<View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none" style={{height:145}}><Image alt="" accessible={false} source={heroArt} resizeMode="cover" style={StyleSheet.absoluteFill}/><LinearGradient colors={['transparent',colors.heroFrom]} style={StyleSheet.absoluteFill}/></View>}
  <View style={{padding:18,paddingTop:wild&&!p.contrast?8:18,gap:14}}>
  <NativeBearDecoration/>
  <View style={{flexDirection:'row',alignItems:'center',gap:10}}><Text style={[styles.label,{flex:1,color:colors.heroMuted}]}>{view.label.toUpperCase()}</Text><NativeGrizzlyPaw/></View>
  {isGrizzly&&<View style={{gap:4}}><Text style={[styles.label,{color:colors.heroInk}]}>{message.title}</Text><Text style={[styles.small,{color:colors.heroMuted}]}>{message.body}</Text></View>}
  {rest&&<Text style={[styles.small,{color:colors.heroMuted}]}>{view.calendar.label==='Recorded training'?`${view.calendar.records.length} workout${view.calendar.records.length===1?'':'s'} recorded today.`:view.calendar.label==='Fixed commitment'?'A fixed commitment is on your calendar today.':view.calendar.label==='Skipped workout'?'Today’s planned workout is marked skipped.':view.calendar.label==='Rest day'?'Rest day · your next workout is below.':session?'Today is unplanned · review your next workout below.':'Choose a plan when you’re ready to schedule training.'}</Text>}
  <View style={{gap:6}}>
   <Text accessibilityRole="header" style={[styles.title,{color:colors.heroInk}]}>{s.active?workoutName(s.active,s):session?sessionName(session,s.plan):s.plan?'Review this block':'Your first plan starts here'}</Text>
   {session&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{[durationText(session,s.custom),`${session.items.length} exercises`,niceDate(s.active?.date||session.date)].map(metric=><Text key={metric} style={[styles.small,{color:colors.heroMuted}]}>{metric}</Text>)}</View>}
   {s.active&&<Text style={[styles.body,{color:colors.heroInk}]}>{s.active.sets.filter(x=>x.done).length} of {s.active.sets.length} sets/tasks logged</Text>}
  </View>
  {view.issue&&!s.active&&<Text style={[styles.body,{color:colors.heroInk}]}>{view.issue}</Text>}
  {view.overdue.length>0&&!s.active&&<Text style={[styles.small,{color:colors.heroMuted}]}>{view.overdue.length} earlier workout{view.overdue.length===1?' needs':'s need'} review. Dates and logged work stay as recorded.</Text>}
  {view.calendar.events.length>0&&<Text style={[styles.small,{color:colors.heroInk}]}>{view.calendar.events.map(event=>event.name).join(' · ')}</Text>}
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>{button(view.actionLabel,action,true,busy&&(view.action==='start'||view.action==='targets'))}{session&&!s.active&&view.action==='start'&&button('Session details',()=>onPreview(session))}{button('Calendar',onCalendar)}</View>
  <Text style={[styles.small,{paddingTop:12,borderTopWidth:1,borderTopColor:colors.heroBorder,color:colors.heroMuted}]}>{s.hold?'A reported concern is on hold. Stop the affected activity and seek appropriate guidance. Your logged work is kept.':s.plan?.paused?'Your plan stays paused until you choose to resume it.':s.plan?.profile.mode==='app'?'Your accepted plan · proposed changes need your approval':s.plan?'Your tracking copy · your coach’s or your own targets':'Choose your goal, equipment and available time.'}</Text>
  {s.hold&&sample&&button('Reset simulated concern hold',onResetSampleHold)}
  </View>
 </LinearGradient>;
}
