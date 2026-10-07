"use client";
import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Switch} from '@/components/ui/switch';
import {type RestTimer,restSeconds,pauseRest,resumeRest,extendRest} from '@/lib/rest-timer';
let audio:AudioContext|undefined;
export function prepareRestSound(){try{audio??=new AudioContext();void audio.resume().catch(()=>{})}catch{}}
function chime(){try{if(!audio||audio.state!=='running')return;for(const offset of [0,.24,.48]){const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.frequency.value=660;g.gain.setValueAtTime(.12,audio.currentTime+offset);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+offset+.18);o.start(audio.currentTime+offset);o.stop(audio.currentTime+offset+.2)}}catch{}}
/** A compact clock stays beside the user's work on narrow screens. */
export function RestStatus({timer,onTimer}:{timer:RestTimer|null|undefined;onTimer:(t:RestTimer|null)=>void}){
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const tick=()=>setNow(Date.now());tick();const id=setInterval(tick,500);document.addEventListener('visibilitychange',tick);return()=>{clearInterval(id);document.removeEventListener('visibilitychange',tick)}},[]);
 if(!timer)return null;
 const left=restSeconds(timer,now),paused=timer.pausedSeconds!==null;
 return <div className="rest-status"><div><span>{paused?'Rest paused':left?'Rest':'Rest finished'}</span><strong aria-label={`${left} seconds remaining`}>{Math.floor(left/60)}:{String(left%60).padStart(2,'0')}</strong></div><Button variant="outline" disabled={!left&&!paused} onClick={()=>{prepareRestSound();onTimer(paused?resumeRest(timer):pauseRest(timer))}}>{paused?'Resume':'Pause'}</Button><Button variant="outline" onClick={()=>{prepareRestSound();onTimer(extendRest(timer))}}>+30 sec</Button></div>
}
export function RestCard({timer,sound=true,alerts=false,onTimer,onSound,onAlerts}:{timer:RestTimer|null|undefined;sound?:boolean;alerts?:boolean;onTimer:(t:RestTimer|null)=>void;onSound:(v:boolean)=>void;onAlerts:(v:boolean)=>void}){
 const [now,setNow]=useState(Date.now()),[message,setMessage]=useState('');
 const left=restSeconds(timer,now),paused=timer?.pausedSeconds!==null&&timer?.pausedSeconds!==undefined;
 useEffect(()=>{const tick=()=>setNow(Date.now());tick();const h=setInterval(tick,250);document.addEventListener('visibilitychange',tick);return()=>{clearInterval(h);document.removeEventListener('visibilitychange',tick)}},[]);
 async function enable(){prepareRestSound();if(!('Notification'in window)){setMessage('Browser alerts are not available here. Sound works while this page is open.');return}try{const result=await Notification.requestPermission();onAlerts(result==='granted');setMessage(result==='granted'?'Browser alerts are on. Keep this page open.':'Rest alerts are off. The timer still works here.')}catch{setMessage('Browser alerts are unavailable. The timer still works here.')}}
 return <section className="card rest-card"><p className="eyebrow">REST TIMER</p><strong aria-label={`${left} seconds remaining`}>{String(Math.floor(left/60)).padStart(2,'0')}:{String(left%60).padStart(2,'0')}</strong><p className="muted" role="status">{paused?'Rest paused':timer&&left===0?'Rest is over. Start when you’re ready.':timer?'Set saved. Take more time if you need it.':'Log a set to start rest.'}</p><div className="button-row"><Button variant="outline" disabled={!timer||left===0&&!paused} onClick={()=>{prepareRestSound();if(timer)onTimer(paused?resumeRest(timer):pauseRest(timer))}}>{paused?'Resume':'Pause'}</Button><Button variant="outline" disabled={!timer} onClick={()=>{prepareRestSound();if(timer)onTimer(extendRest(timer))}}>+30 sec</Button><Button variant="ghost" disabled={!timer} onClick={()=>onTimer(null)}>End rest</Button></div><label className="check-line"><Switch checked={sound} onCheckedChange={v=>{prepareRestSound();onSound(v)}}/>Sound</label><Button variant="outline" size="sm" onClick={()=>alerts?onAlerts(false):void enable()}>{alerts?'Turn off browser alerts':'Enable browser alerts'}</Button>{message&&<p role="status" className="small-copy">{message}</p>}<p className="small-copy">Keep this page open for sound. Background browser alerts may be late. Phone settings can silence alerts.</p></section>
}

export function useRestAlarm(timer:RestTimer|null|undefined,sound:boolean,alerts:boolean,active:boolean,onTimer:(t:RestTimer|null)=>void){
 const [now,setNow]=useState(Date.now());const fired=useRef('');const left=restSeconds(timer,now);
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(t)},[]);
 useEffect(()=>{if(!active||!timer?.endAt||timer.alerted||left>0||fired.current===timer.id+':'+timer.endAt)return;fired.current=timer.id+':'+timer.endAt;onTimer({...timer,alerted:true});if(Date.now()-timer.endAt>10000)return;if(sound)chime();if(alerts&&document.hidden&&'Notification'in window&&Notification.permission==='granted')try{const n=new Notification('Rest is over',{body:'Start your next set when you’re ready.',tag:'training-rest'});setTimeout(()=>n.close(),10000)}catch{}},[left,timer,active,sound,alerts,onTimer]);
}
