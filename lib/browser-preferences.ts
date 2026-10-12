import {defaultPreferences,readPreferences,preferenceKey,type AppPreferences} from './app-preferences';

type Snapshot={p:AppPreferences;ready:boolean;saveError:string};
export const serverPreferences:Snapshot={p:defaultPreferences,ready:false,saveError:''};
let snapshot=serverPreferences,lastRaw:string|null|undefined,readFailed=false;
const listeners=new Set<()=>void>();
const notify=()=>{for(const listener of listeners)listener()};
const storageChanged=(event:StorageEvent)=>{if(event.key===preferenceKey||event.key===null)notify()};

export function subscribePreferences(listener:()=>void){
 listeners.add(listener);if(listeners.size===1)window.addEventListener('storage',storageChanged);
 return ()=>{listeners.delete(listener);if(!listeners.size)window.removeEventListener('storage',storageChanged)};
}
export function browserPreferences():Snapshot{
 if(typeof window==='undefined')return serverPreferences;
 try{
  const raw=localStorage.getItem(preferenceKey);
  if(!snapshot.ready||raw!==lastRaw||readFailed){lastRaw=raw;readFailed=false;snapshot={p:readPreferences(raw),ready:true,saveError:''}}
 }catch{
  if(!snapshot.ready||!readFailed)snapshot={...snapshot,ready:true,saveError:'Appearance changes can’t be saved in this browser.'};
  readFailed=true;
 }
 return snapshot;
}
export function updateBrowserPreferences(patch:Partial<AppPreferences>){
 const p=readPreferences(JSON.stringify({...browserPreferences().p,...patch})),raw=JSON.stringify(p);
 try{localStorage.setItem(preferenceKey,raw);lastRaw=raw;readFailed=false;snapshot={p,ready:true,saveError:''}}
 catch{snapshot={p,ready:true,saveError:'Your changes apply here but could not be saved.'}}
 notify();
}
