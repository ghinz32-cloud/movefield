"use client";
import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Switch} from '@/components/ui/switch';
import {type RestTimer,restSeconds,pauseRest,resumeRest,extendRest} from '@/lib/rest-timer';
let audio:AudioContext|undefined;
export function prepareRestSound(){try{audio??=new AudioContext();void audio.resume().catch(()=>{})}catch{}}
function chime(){try{if(!audio||audio.state!=='running')return;for(const offset of [0,.24,.48]){const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.frequency.value=660;g.gain.setValueAtTime(.12,audio.currentTime+offset);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+offset+.18);o.start(audio.currentTime+offset);o.stop(audio.currentTime+offset+.2)}}catch{}}
/** Only the visible clock ticks. An idle or paused timer schedules no work. */
function useRestClock(timer:RestTimer|null|undefined){
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{
  const endAt=timer?.endAt;
  if(!endAt||timer?.alerted)return;
  let interval:ReturnType<typeof setInterval>|undefined;
  const tick=()=>{const time=Date.now();setNow(time);if(time>=endAt)clearInterval(interval)};
  if(endAt>Date.now())interval=setInterval(tick,1000);
  tick();document.addEventListener('visibilitychange',tick);
  return()=>{clearInterval(interval);document.removeEventListener('visibilitychange',tick)};
 },[timer?.endAt,timer?.alerted]);
 return now;
}
/** A compact clock stays beside the user's work on narrow screens. */
export function RestStatus({timer,onTimer}:{timer:RestTimer|null|undefined;onTimer:(t:RestTimer|null)=>void}){
 const now=useRestClock(timer);
 if(!timer)return null;
 const left=restSeconds(timer,now),paused=timer.pausedSeconds!==null;
 return <div className="rest-status"><div><span>{paused?'Rest paused':left?'Rest':'Rest finished'}</span><strong aria-label={`${left} seconds remaining`}>{Math.floor(left/60)}:{String(left%60).padStart(2,'0')}</strong></div><Button variant="outline" disabled={!left&&!paused} onClick={()=>{prepareRestSound();onTimer(paused?resumeRest(timer):pauseRest(timer))}}>{paused?'Resume':'Pause'}</Button><Button variant="outline" onClick={()=>{prepareRestSound();onTimer(extendRest(timer))}}>+30 sec</Button></div>
}
export function RestCard({timer,sound=true,alerts=false,onTimer,onSound,onAlerts}:{timer:RestTimer|null|undefined;sound?:boolean;alerts?:boolean;onTimer:(t:RestTimer|null)=>void;onSound:(v:boolean)=>void;onAlerts:(v:boolean)=>void}){
 const now=useRestClock(timer),[message,setMessage]=useState('');
 const left=restSeconds(timer,now),paused=timer?.pausedSeconds!==null&&timer?.pausedSeconds!==undefined;
 async function enable(){prepareRestSound();if(!('Notification'in window)){setMessage('Browser alerts are not available here. Sound works while this page is open.');return}try{const result=await Notification.requestPermission();onAlerts(result==='granted');setMessage(result==='granted'?'Browser alerts are on. Keep this page open.':'Rest alerts are off. The timer still works here.')}catch{setMessage('Browser alerts are unavailable. The timer still works here.')}}
 return <section className="card rest-card"><p className="eyebrow">REST TIMER</p><strong aria-label={`${left} seconds remaining`}>{String(Math.floor(left/60)).padStart(2,'0')}:{String(left%60).padStart(2,'0')}</strong><p className="muted" role="status">{paused?'Rest paused':timer&&left===0?'Rest is over. Start when you’re ready.':timer?'Set saved. Take more time if you need it.':'Log a set to start rest.'}</p><div className="button-row"><Button variant="outline" disabled={!timer||left===0&&!paused} onClick={()=>{prepareRestSound();if(timer)onTimer(paused?resumeRest(timer):pauseRest(timer))}}>{paused?'Resume':'Pause'}</Button><Button variant="outline" disabled={!timer} onClick={()=>{prepareRestSound();if(timer)onTimer(extendRest(timer))}}>+30 sec</Button><Button variant="ghost" disabled={!timer} onClick={()=>onTimer(null)}>End rest</Button></div><label className="check-line"><Switch aria-label="Rest timer sound" checked={sound} onCheckedChange={v=>{prepareRestSound();onSound(v)}}/>Sound</label><Button variant="outline" size="sm" onClick={()=>alerts?onAlerts(false):void enable()}>{alerts?'Turn off browser alerts':'Enable browser alerts'}</Button>{message&&<p role="status" className="small-copy">{message}</p>}<p className="small-copy">Keep this page open for sound. Background browser alerts may be late. Phone settings can silence alerts.</p></section>
}

export function useRestAlarm(timer:RestTimer|null|undefined,sound:boolean,alerts:boolean,active:boolean,onTimer:(t:RestTimer|null)=>void){
 const fired=useRef('');
 useEffect(()=>{
  if(!active||!timer?.endAt||timer.alerted)return;
  const endAt=timer.endAt,key=timer.id+':'+endAt;
  const fire=()=>{
   if(Date.now()<endAt||fired.current===key)return;
   fired.current=key;onTimer({...timer,alerted:true});
   if(Date.now()-endAt>10000)return;
   if(sound)chime();
   if(alerts&&document.hidden&&'Notification'in window&&Notification.permission==='granted')try{const n=new Notification('Rest is over',{body:'Start your next set when you’re ready.',tag:'training-rest'});setTimeout(()=>n.close(),10000)}catch{}
  };
  const timeout=setTimeout(fire,Math.max(0,endAt-Date.now()));
  document.addEventListener('visibilitychange',fire);
  return()=>{clearTimeout(timeout);document.removeEventListener('visibilitychange',fire)};
 },[timer,active,sound,alerts,onTimer]);
}
