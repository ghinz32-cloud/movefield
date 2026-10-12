import React from 'react';
import {View,Text,StyleSheet} from 'react-native';
import {todayView} from './shared/today-view';
import {niceDate,type State,type Session} from './shared/training';
import {sessionName,workoutName} from './shared/presentation';
import {durationText} from './shared/session-duration';
import {useNativeAppearance,useThemedStyles} from './appearance';
import {NativeAccountButton} from './account-button';
import {NativeBearDecoration,NativeGrizzlyPaw} from './bear-decoration';
const base=StyleSheet.create({body:{color:'#19362D',fontSize:16,lineHeight:24},title:{color:'#19362D',fontSize:30,fontWeight:'700',lineHeight:36},label:{color:'#19362D',fontSize:14,fontWeight:'700',lineHeight:20}});
export function NativeTodayHero({state:s,sample,busy=false,onStart,onPreview,onTargets,onPlan,onResume,onCalendar,onResetSampleHold}:{state:State;sample:boolean;busy?:boolean;onStart:(session:Session)=>void;onPreview:(session:Session)=>void;onTargets:(session:Session)=>void;onPlan:()=>void;onResume:()=>void;onCalendar:()=>void;onResetSampleHold:()=>void}){
 const styles=useThemedStyles(base),{colors}=useNativeAppearance(),view=todayView(s),session=view.session;
 const action=()=>{if(view.action==='resume')onResume();else if(view.action==='start'&&session)onStart(session);else if(view.action==='targets'&&session)onTargets(session);else if(view.action==='preview'&&session)onPreview(session);else onPlan()};
 return <View style={{padding:20,borderWidth:1,borderColor:colors.line,borderRadius:16,backgroundColor:colors.white,gap:14}}><NativeBearDecoration/><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}><Text style={[styles.label,{flex:1}]}>{view.label.toUpperCase()}</Text><NativeGrizzlyPaw/></View>
 {!s.active&&!view.scheduledToday.length&&<Text style={styles.body}>{view.calendar.label==='Rest day'?'Rest day · your next workout is below.':view.calendar.label==='Recorded training'?`${view.calendar.records.length} workout${view.calendar.records.length===1?'':'s'} recorded today.`:view.calendar.label==='Fixed commitment'?'A fixed commitment is on your calendar today.':view.calendar.label==='Skipped workout'?'Today’s planned workout is marked skipped.':session?'Today is unplanned · review your next workout below.':'Choose a plan when you’re ready to schedule training.'}</Text>}
 <Text accessibilityRole="header" style={styles.title}>{s.active?workoutName(s.active,s):session?sessionName(session,s.plan):s.plan?'Review this block':'Your first plan starts here'}</Text>
 {session&&<Text style={styles.body}>{niceDate(s.active?.date||session.date)} · {durationText(session,s.custom)} · {session.items.length} exercises</Text>}
 {s.active&&<Text style={styles.body}>{s.active.sets.filter(x=>x.done).length} of {s.active.sets.length} sets/tasks saved. Your workout and rest timer are kept.</Text>}
 {view.issue&&!s.active&&<Text style={styles.body}>{view.issue}</Text>}
 {view.overdue.length>0&&!s.active&&<Text style={styles.body}>{view.overdue.length} earlier workout{view.overdue.length===1?' needs':'s need'} review. Dates and logged work stay as recorded.</Text>}
 {view.calendar.events.length>0&&<Text style={styles.body}>{view.calendar.events.map(event=>event.name).join(' · ')}</Text>}
 <NativeAccountButton disabled={busy&&(view.action==='start'||view.action==='targets')} label={view.actionLabel} onPress={action} colors={colors} text={styles.body}/><NativeAccountButton label="Calendar and commitments" onPress={onCalendar} colors={colors} text={styles.body}/>
 {s.hold&&<><Text style={styles.body}>Stop the affected activity and seek appropriate guidance. Your logged work is kept.</Text>{sample&&<NativeAccountButton label="Reset simulated concern hold" onPress={onResetSampleHold} colors={colors} text={styles.body}/>}</>}
 {s.plan?.paused&&<Text style={styles.body}>Your plan stays paused until you choose to resume it.</Text>}
 </View>;
}
