import {useEffect,useState} from 'react';
import {AppState,Platform} from 'react-native';
import * as Notifications from 'expo-notifications';
import {createRestAlertQueue,type RestTimer,validRest} from './shared/rest-timer';
import {isWorkoutNotificationAllowed,hasNotificationPermission} from './workout-notifications';
const CHANNEL='training-rest';
let currentId:string|null=null;
if(Platform.OS!=='web')Notifications.setNotificationHandler({handleNotification:async notification=>{
 const allowed=notification.request.identifier===currentId||notification.request.content.data?.kind==='training-workout'&&isWorkoutNotificationAllowed(notification.request.identifier);
 return {shouldShowBanner:allowed,shouldShowList:allowed,shouldPlaySound:allowed,shouldSetBadge:false};
}});
const queue=createRestAlertQueue({
 list:async()=>{const [scheduled,shown]=await Promise.all([Notifications.getAllScheduledNotificationsAsync(),Notifications.getPresentedNotificationsAsync()]);return [...new Set([...scheduled.filter(x=>x.content.data?.kind===CHANNEL).map(x=>x.identifier),...shown.filter(x=>x.request.content.data?.kind===CHANNEL).map(x=>x.request.identifier)])]},
 cancel:async id=>{const results=await Promise.allSettled([Notifications.cancelScheduledNotificationAsync(id),Notifications.dismissNotificationAsync(id)]);const failed=results.find(r=>r.status==='rejected');if(failed?.status==='rejected')throw failed.reason},
 schedule:async t=>Notifications.scheduleNotificationAsync({identifier:'rest-'+t.id+'-'+t.endAt,content:{title:'Rest is over',body:'Start your next set when you’re ready.',sound:'default',data:{kind:CHANNEL}},trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:new Date(t.endAt!),channelId:CHANNEL}})
});
async function channel(){if(Platform.OS==='android')await Notifications.setNotificationChannelAsync(CHANNEL,{name:'Rest timer',importance:Notifications.AndroidImportance.HIGH,vibrationPattern:[0,200,150,200],lockscreenVisibility:Notifications.AndroidNotificationVisibility.PRIVATE})}
export async function enableRestAlerts():Promise<{enabled:boolean;message:string}>{
 if(Platform.OS==='web')return {enabled:false,message:'Use the iOS or Android app for phone rest alerts.'};
 try{await channel();let p=await Notifications.getPermissionsAsync();if(!hasNotificationPermission(p))p=await Notifications.requestPermissionsAsync({ios:{allowAlert:true,allowSound:true,allowBadge:false}});const audible=p.granted&&p.ios?.status!==Notifications.IosAuthorizationStatus.PROVISIONAL;return {enabled:hasNotificationPermission(p),message:hasNotificationPermission(p)?(audible?'Rest alerts are on. Phone settings may silence or delay them.':'Quiet alerts are allowed. Turn on sound in phone settings for an audible alert.'):'Rest alerts are off. The timer still works here.'}}catch{return {enabled:false,message:'Rest alerts could not be enabled. The timer still works here.'}}
}
export function useNativeRestAlerts(timer:RestTimer|null|undefined,workoutId:string|undefined,enabled:boolean,ready:boolean){
 const [message,setMessage]=useState(''),[wake,setWake]=useState(0);
 useEffect(()=>{const subscription=AppState.addEventListener('change',s=>{if(s==='active')setWake(x=>x+1)});return()=>subscription.remove()},[]);
 useEffect(()=>{if(!ready||Platform.OS==='web')return;let live=true;void queue.replace(null).catch(()=>{if(live)setMessage('Could not cancel an old rest alert. Check phone notification settings.')});const current=validRest(timer,workoutId);currentId=enabled&&current?.endAt&&current.endAt>Date.now()&&!current.alerted?'rest-'+current.id+'-'+current.endAt:null;
 void (async()=>{try{const permission=enabled?await Notifications.getPermissionsAsync():null;if(!live)return;await channel();if(!live)return;await queue.replace(enabled&&permission&&hasNotificationPermission(permission)?current:null);if(live)setMessage(enabled&&permission&&!hasNotificationPermission(permission)?'Rest alerts are off in phone settings. The timer still works here.':'')}catch{if(live)setMessage('The phone alert could not be scheduled. Keep the app open and check notification settings.')}})();
 return()=>{live=false;currentId=null;void queue.replace(null).catch(()=>{})};
 },[timer?.id,timer?.endAt,timer?.pausedSeconds,workoutId,enabled,ready,wake]);
 return message;
}
