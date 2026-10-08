"use client";
import {createContext,useContext,useEffect,useState,useRef,type ReactNode} from 'react';
import {defaultPreferences,readPreferences,preferenceKey,type AppPreferences,palettes,modelChoices} from '@/lib/app-preferences';
import {workoutReminders,reminderCalendar} from '@/lib/workout-reminders';
import type {State} from '@/lib/training';
import {brand} from '@/lib/brand';
import {BrandMark} from '@/components/brand-mark';
import {Button} from '@/components/ui/button';
import {Switch} from '@/components/ui/switch';
import {Input} from '@/components/ui/input';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Check,Palette,Sun,Moon,Monitor} from 'lucide-react';
import {toast} from 'sonner';
type PreferencesContext={p:AppPreferences;update:(patch:Partial<AppPreferences>)=>void;ready:boolean;saveError:string};
const Context=createContext<PreferencesContext>({p:defaultPreferences,update:()=>{},ready:false,saveError:''});
export const useAppPreferences=()=>useContext(Context);
export function AppPreferencesProvider({children}:{children:ReactNode}){
 const [p,setP]=useState(defaultPreferences),[ready,setReady]=useState(false),[saveError,setSaveError]=useState(''),current=useRef(defaultPreferences);
 // Browser storage is available after hydration; this synchronizes an external store once.
 useEffect(()=>{try{current.current=readPreferences(localStorage.getItem(preferenceKey));setP(current.current)}catch{setSaveError('Appearance changes can’t be saved in this browser.')}setReady(true);const listener=(e:StorageEvent)=>{if(e.key===preferenceKey){current.current=readPreferences(e.newValue);setP(current.current)}};window.addEventListener('storage',listener);return()=>window.removeEventListener('storage',listener)},[]);
 const update=(patch:Partial<AppPreferences>)=>{if(!ready)return;const next=readPreferences(JSON.stringify({...current.current,...patch}));current.current=next;setP(next);try{localStorage.setItem(preferenceKey,JSON.stringify(next));setSaveError('')}catch{setSaveError('Your changes apply here but could not be saved.')}};
 useEffect(()=>{if(!ready)return;const media=matchMedia('(prefers-color-scheme: dark)');const apply=()=>{const root=document.documentElement;const dark=p.mode==='dark'||p.mode==='system'&&media.matches;root.classList.toggle('dark',dark);root.dataset.mode=dark?'dark':'light';root.dataset.palette=p.palette;root.dataset.contrast=String(p.contrast);root.dataset.reduceMotion=String(p.reduceMotion);root.dataset.underlineLinks=String(p.underlineLinks);root.style.fontSize=p.textSize+'%';root.style.colorScheme=dark?'dark':'light'};apply();media.addEventListener('change',apply);return()=>media.removeEventListener('change',apply)},[p,ready]);
 return <Context.Provider value={{p,update,ready,saveError}}>{children}</Context.Provider>;
}
function Toggle({title,detail,checked,onChange}:{title:string;detail:string;checked:boolean;onChange:(v:boolean)=>void}){return <div className="switch-row"><div><b>{title}</b><p>{detail}</p></div><Switch aria-label={title} checked={checked} onCheckedChange={onChange}/></div>}
export function AppearanceSettings(){
 const {p,update,saveError}=useAppPreferences();
 return <><section className="card appearance-card"><div className="settings-heading"><div><p className="eyebrow">MAKE IT YOURS</p><h2>Appearance</h2></div><BrandMark/></div><div className="theme-preview"><BrandMark/><span className="brand-wordmark">{brand.name}</span><span className="theme-preview-caption">Your next strong day.</span></div><fieldset><legend className="field-label">Color theme</legend><div className="palette-grid">{palettes.map(color=><button key={color.id} type="button" className={'palette-choice '+(p.palette===color.id?'selected':'')} aria-pressed={p.palette===color.id} onClick={()=>update({palette:color.id})}><span className="palette-swatch" style={{background:`linear-gradient(120deg,${color.from},${color.to})`}}>{p.palette===color.id&&<Check size={20}/>}</span><span>{color.name}</span></button>)}</div></fieldset><fieldset><legend className="field-label">Display mode</legend><div className="mode-picker">{([['system','System',Monitor],['light','Light',Sun],['dark','Dark',Moon]] as const).map(([value,label,Icon])=><button key={value} aria-pressed={p.mode===value} className={p.mode===value?'selected':''} onClick={()=>update({mode:value})}><Icon size={18}/>{label}{p.mode===value&&<Check size={16}/>}</button>)}</div></fieldset><p className="small-copy">System follows your device’s light or dark appearance.</p></section><section className="card"><h2>Accessibility</h2><label className="field"><span>Text size</span><Select value={String(p.textSize)} onValueChange={v=>update({textSize:Number(v) as AppPreferences['textSize']})}><SelectTrigger aria-label="Text size"><SelectValue/></SelectTrigger><SelectContent>{[100,115,130].map(n=><SelectItem key={n} value={String(n)}>{n===100?'Standard':n===115?'Large':'Larger'} · {n}%</SelectItem>)}</SelectContent></Select></label><Toggle title="Higher contrast" detail="Stronger text, borders and control outlines." checked={p.contrast} onChange={contrast=>update({contrast})}/><Toggle title="Reduce motion" detail="Keep transitions and animations still. Your device preference is always respected." checked={p.reduceMotion} onChange={reduceMotion=>update({reduceMotion})}/><Toggle title="Underline text links" detail="Make links easier to distinguish from surrounding text." checked={p.underlineLinks} onChange={underlineLinks=>update({underlineLinks})}/><p className="small-copy">Keyboard navigation, visible focus, screen-reader labels and browser zoom are available in every theme.</p>{saveError&&<p role="alert" className="notice warning">{saveError}</p>}</section></>;
}
export function AppearanceShortcut(){const [open,setOpen]=useState(false);return <><Button className="appearance-shortcut" variant="outline" aria-label="Appearance and accessibility" onClick={()=>setOpen(true)}><Palette size={18}/><span>Appearance</span></Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="appearance-dialog"><DialogHeader><DialogTitle>Make yourself at home</DialogTitle><DialogDescription>Colors, display and reading preferences.</DialogDescription></DialogHeader><div className="appearance-dialog-body"><AppearanceSettings/></div></DialogContent></Dialog></>}
export function ModelSettings(){const {p,update}=useAppPreferences();return <section className="card"><p className="eyebrow">PHONE APP PREVIEW</p><h2>On-device assistant</h2><p className="muted">Choose a preference for the future phone assistant. No model is installed or running in this prototype.</p><label className="field"><span>Preferred model</span><Select value={p.model} onValueChange={model=>update({model:model as AppPreferences['model']})}><SelectTrigger aria-label="Preferred model"><SelectValue/></SelectTrigger><SelectContent>{modelChoices.map(([value,label])=><SelectItem value={value} key={value}>{label}</SelectItem>)}</SelectContent></Select></label><p>{modelChoices.find(x=>x[0]===p.model)?.[2]}</p><p className="small-copy">Automatic is planned to use Qwen3 4B on phones that pass device testing, with smaller options where needed. Download size is separate from working memory. You’ll confirm a download before it starts.</p><p className="small-copy">Your plans and workout records work without a language model.</p></section>}
export function WorkoutReminderSettings({state,disabled=false}:{state:State;disabled?:boolean}){
 const {p,update}=useAppPreferences();const [message,setMessage]=useState('');const reminders=workoutReminders(state,{...p,reminders:true});
 const enable=async()=>{if(p.reminders){update({reminders:false});setMessage('Workout reminders are off.');return}if(!('Notification' in window)){setMessage('This browser doesn’t support these alerts. You can add workouts to your calendar.');return}try{const permission=await Notification.requestPermission();if(permission==='granted'){update({reminders:true});setMessage('Browser reminders are on while this page is open.')}else setMessage('Notifications weren’t enabled. You can use a calendar reminder instead.')}catch{setMessage('Notifications aren’t available here. You can use a calendar reminder instead.')}};
 const calendar=()=>{const a=document.createElement('a');const url=URL.createObjectURL(new Blob([reminderCalendar(reminders,brand.name)],{type:'text/calendar;charset=utf-8'}));a.href=url;a.download='workout-reminders.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 return <section className="card"><h2>Workout reminders</h2><p className="muted">One reminder on each scheduled workout day. Rest days, skipped workouts and completed sessions are left out.</p><label className="field"><span>Reminder time · this device’s time zone</span><Input type="time" aria-label="Workout reminder time" value={p.reminderTime} disabled={disabled} onChange={e=>{if(e.target.value)update({reminderTime:e.target.value})}}/></label><div className="button-row"><Button variant="outline" disabled={disabled} onClick={()=>void enable()}>{p.reminders?'Turn off browser reminders':'Enable browser reminders'}</Button><Button variant="outline" disabled={disabled||!reminders.length} onClick={calendar}>Add next {reminders.length||''} workout days to calendar</Button></div><p className="small-copy">Web alerts require this page to stay open and may be delayed or missed in the background. Calendar alerts can work when it’s closed, depending on your calendar settings. Imported calendar entries won’t follow later plan edits; remove the old entries before importing again.</p>{!reminders.length&&<p className="small-copy">No upcoming workout reminders. Add or resume a plan to see them here.</p>}{disabled&&<p className="small-copy">Return to your own profile to set reminders.</p>}{message&&<p role="status" className="small-copy">{message}</p>}</section>;
}
export function useWorkoutReminders(state:State,enabled:boolean){
 const {p,ready}=useAppPreferences();
 useEffect(()=>{
  if(!ready||!enabled||!p.reminders)return;
  const show=()=>{
   const now=Date.now(),due=workoutReminders(state,p,now-60000,1)[0];
   if(!due||due.at>now)return;
   const key='training-studio:reminder-sent:'+due.date;
   try{if(localStorage.getItem(key))return}catch{return}
   // The in-page status still appears if the browser rejects its desktop
   // Notification constructor. Never suppress both after recording delivery.
   toast.info('Your workout is scheduled for today. Open Today when you’re ready.');
   try{if('Notification' in window&&Notification.permission==='granted')new Notification(brand.name+' · Workout reminder',{body:'Your training is scheduled for today. Open the app when you’re ready.',tag:due.id,icon:'/favicon.svg'})}catch{}
   try{localStorage.setItem(key,'yes')}catch{}
  };
  const tick=()=>{if(navigator.locks)void navigator.locks.request('training-workout-reminder',show).catch(()=>{});else show()};
  tick();const timer=setInterval(tick,15000);return()=>clearInterval(timer);
 },[ready,enabled,state,p]);
}
