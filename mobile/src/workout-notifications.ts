import {useEffect,useState} from 'react';
import {AppState,Platform} from 'react-native';
import * as Notifications from 'expo-notifications';
import type {State} from './shared/training';
import type {AppPreferences} from './shared/app-preferences';
import {workoutReminders,workoutReminderKind} from './shared/workout-reminders';
import {brand} from './shared/brand';
let allowedIds=new Set<string>();
export const isWorkoutNotificationAllowed=(id:string)=>allowedIds.has(id);
let serial:Promise<unknown>=Promise.resolve();
let generation=0;
export const hasNotificationPermission=(p:Notifications.NotificationPermissionsStatus)=>p.granted||p.ios?.status===Notifications.IosAuthorizationStatus.PROVISIONAL;
async function channel(){if(Platform.OS==='android')await Notifications.setNotificationChannelAsync(workoutReminderKind,{name:'Workout reminders',importance:Notifications.AndroidImportance.DEFAULT,lockscreenVisibility:Notifications.AndroidNotificationVisibility.PRIVATE})}
export async function enableWorkoutReminders(){
 if(Platform.OS==='web')return {enabled:false,message:'Phone notifications are available in the iOS or Android app.'};
 try{await channel();let permission=await Notifications.getPermissionsAsync();if(!hasNotificationPermission(permission))permission=await Notifications.requestPermissionsAsync({ios:{allowAlert:true,allowSound:true,allowBadge:false}});return {enabled:hasNotificationPermission(permission),message:hasNotificationPermission(permission)?'Permission enabled. Scheduling status appears below.':'Notifications are off in phone settings.'}}catch{return {enabled:false,message:'Notifications could not be enabled. Try phone settings.'}}
}
export function useNativeWorkoutReminders(state:State|null,p:AppPreferences,ready:boolean){
 const [message,setMessage]=useState(''),[wake,setWake]=useState(0);
 useEffect(()=>{const subscription=AppState.addEventListener('change',s=>{if(s==='active')setWake(x=>x+1)});return()=>subscription.remove()},[]);
 // Reconcile only for schedule-related changes, not each saved repetition.
 const signature=JSON.stringify({plan:state?.plan?.id,paused:state?.plan?.paused,hold:state?.hold,sessions:state?.plan?.sessions.map(s=>[s.id,s.date,s.status]),finished:state?.history.filter(w=>w.finishedAt).map(w=>w.sessionId),active:state?.active?.sessionId,events:state?.events.map(e=>e.date),enabled:p.reminders,time:p.reminderTime,zone:Intl.DateTimeFormat().resolvedOptions().timeZone});
 useEffect(()=>{
  if(!ready||!state||Platform.OS==='web')return;
  let live=true;const version=++generation;const desired=workoutReminders(state,p);allowedIds=new Set(desired.map(x=>x.id));
  const task=serial.catch(()=>{}).then(async()=>{
   if(version!==generation)return;
   const [scheduled,shown]=await Promise.all([Notifications.getAllScheduledNotificationsAsync(),Notifications.getPresentedNotificationsAsync()]);
   for(const item of scheduled.filter(x=>x.content.data?.kind===workoutReminderKind))await Notifications.cancelScheduledNotificationAsync(item.identifier);
   for(const item of shown.filter(x=>x.request.content.data?.kind===workoutReminderKind))await Notifications.dismissNotificationAsync(item.request.identifier);
   if(version!==generation)return;
   if(!p.reminders){if(live)setMessage('Workout reminders are off.');return;}
   const permission=await Notifications.getPermissionsAsync();if(version!==generation)return;
   if(!hasNotificationPermission(permission)){allowedIds.clear();if(live)setMessage('Notifications are off in phone settings.');return;}
   await channel();if(version!==generation)return;allowedIds=new Set(desired.map(x=>x.id));
   for(const reminder of desired){if(version!==generation)return;await Notifications.scheduleNotificationAsync({identifier:reminder.id,content:{title:brand.name+' · Workout reminder',body:'Your training is scheduled for today. Open the app when you’re ready.',sound:'default',data:{kind:workoutReminderKind,date:reminder.date}},trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:new Date(reminder.at),channelId:workoutReminderKind}})}
   if(live)setMessage(desired.length?`${desired.length} workout days scheduled. Open the app after travel or plan changes to refresh reminders.`:'No upcoming workout days to remind you about.');
  });serial=task;
  void task.catch(()=>{if(live)setMessage('Some reminders could not be updated. Check phone notification settings and reopen the app. Older alerts may remain scheduled.')});
  return()=>{live=false};
 // signature covers every schedule input; set edits and appearance must not reschedule OS alerts.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[signature,ready,wake]);
 return message;
}
