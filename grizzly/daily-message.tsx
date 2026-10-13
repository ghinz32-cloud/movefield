'use client';
import {useEffect,useState} from 'react';
import {getGrizzlyDailyMessage,grizzlyLocalDayKey,millisecondsUntilNextLocalDay,type GrizzlyMessageContext} from '../lib/grizzly-messages';

/** Refresh at midnight and when returning to the app, without render-time randomness. */
export function useGrizzlyLocalDay(){
 const [dayKey,setDayKey]=useState(()=>grizzlyLocalDayKey());
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>;
  const refresh=()=>{
   clearTimeout(timer);
   const now=new Date();setDayKey(grizzlyLocalDayKey(now));
   timer=setTimeout(refresh,millisecondsUntilNextLocalDay(now)+25);
  };
  const foreground=()=>{if(!document.hidden)refresh()};
  refresh();document.addEventListener('visibilitychange',foreground);window.addEventListener('focus',foreground);window.addEventListener('pageshow',foreground);
  return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',foreground);window.removeEventListener('focus',foreground);window.removeEventListener('pageshow',foreground)};
 },[]);
 return dayKey;
}

export function GrizzlyDailyMessage({context,dayKey}:{context:GrizzlyMessageContext;dayKey:string}){
 const message=getGrizzlyDailyMessage(context,dayKey);
 return <div className="grizzly-daily-message" data-message-id={message.id} data-message-context={context}>
  <p className="grizzly-daily-message-title">{message.title}</p><p className="grizzly-daily-message-body">{message.body}</p>
 </div>;
}
