import React,{useCallback,useEffect,useRef,useState} from 'react';
import {AppState,Linking,Platform,Text,View} from 'react-native';
import * as Notifications from 'expo-notifications';
import {useNativeAppearance} from './appearance';
import {NativeButton} from './phone-ui';
import {hasNotificationPermission} from './workout-notifications';

type PermissionState='checking'|'allowed'|'requestable'|'denied'|'blocked'|'unknown';
/** Reads permission only. Enabling either alert preference stays an explicit action. */
export function NativeNotificationSettings(){
 const {colors:c,p,fonts}=useNativeAppearance();
 const [permission,setPermission]=useState<PermissionState>('checking'),[message,setMessage]=useState(''),[opening,setOpening]=useState(false);
 const live=useRef(true),generation=useRef(0),opened=useRef(false);
 const check=useCallback(async()=>{
  if(Platform.OS==='web'||!live.current)return;
  const request=++generation.current;
  try{
   const value=await Notifications.getPermissionsAsync();
   if(!live.current||request!==generation.current)return;
   const next:PermissionState=hasNotificationPermission(value)?'allowed':value.canAskAgain===false?'blocked':value.status===Notifications.PermissionStatus.DENIED?'denied':value.status===Notifications.PermissionStatus.UNDETERMINED?'requestable':'unknown';
   setPermission(next);
   if(opened.current)setMessage(next==='allowed'?'Phone permission is available. Your alert choices have not changed.':next==='blocked'||next==='denied'?'Notifications are still off in phone settings.':'Phone permission could not be confirmed. Try checking again.');
  }catch{if(live.current&&request===generation.current){setPermission('unknown');setMessage('Phone notification permission could not be checked.')}}
 },[]);
 const invalidate=useCallback(()=>{live.current=false;generation.current++},[]);
 useEffect(()=>{live.current=true;void Promise.resolve().then(check);const subscription=AppState.addEventListener('change',state=>{if(state==='active')void check()});return()=>{invalidate();subscription.remove()}},[check,invalidate]);
 const open=async()=>{
  if(opening||!live.current)return;
  setOpening(true);opened.current=true;
  try{await Linking.openSettings();if(live.current)setMessage('Return here after changing phone notification settings.')}catch{if(live.current)setMessage('Phone settings could not be opened. Open this app’s notification settings from your phone.')}finally{if(live.current)setOpening(false)}
 };
 if(Platform.OS==='web'||permission==='checking'||permission==='requestable'||permission==='allowed'&&!message)return null;
 const style={color:c.muted,fontFamily:fonts?'Inter':undefined,fontSize:14*p.textSize/100,lineHeight:21*p.textSize/100};
 return <View style={{gap:10}}>
  {!!message&&<Text accessibilityLiveRegion="polite" style={style}>{message}</Text>}
  {permission==='blocked'&&!message&&<Text style={style}>Allow notifications in phone settings to use alerts.</Text>}
  {(permission==='blocked'||permission==='denied')&&<NativeButton label={opening?'Opening phone settings…':'Open phone settings'} variant="outline" onPress={()=>{void open()}} disabled={opening}/>}
  {permission==='unknown'&&<NativeButton label="Check phone permission" variant="outline" onPress={()=>{void check()}}/>}
 </View>;
}
