'use client';
import {useEffect,useState,useSyncExternalStore} from 'react';
import {publicPath} from '@/lib/public-path';
import type {MovementGuide,ExerciseMedia} from './exercise-guide';
type Snapshot={guides:Record<string,MovementGuide>;media:Record<string,ExerciseMedia>;loading:boolean;error:string};

/** One request cache per mounted workspace; training records never enter it. */
class ExerciseContent {
 private snapshot:Snapshot={guides:{},media:{},loading:false,error:''};
 private listeners=new Set<()=>void>();
 private pending:Promise<void>|undefined;
 private controller:AbortController|undefined;
 private active=true;
 getSnapshot=()=>this.snapshot;
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener)}};
 activate=()=>{this.active=true};
 dispose=()=>{this.active=false;this.controller?.abort()};
 private publish(patch:Partial<Snapshot>){if(!this.active)return;this.snapshot={...this.snapshot,...patch};for(const listener of this.listeners)listener()}
 load=()=>{
  if(this.pending)return this.pending;
  if(Object.keys(this.snapshot.guides).length&&Object.keys(this.snapshot.media).length)return Promise.resolve();
  const controller=new AbortController();this.controller=controller;this.publish({loading:true,error:''});
  const read=async<T,>(path:string):Promise<Record<string,T>>=>{const response=await fetch(publicPath(path),{signal:controller.signal});if(!response.ok)throw Error('Reference unavailable');const value=await response.json();if(!value||typeof value!=='object'||Array.isArray(value)||!Object.keys(value).length)throw Error('Reference unavailable');return value as Record<string,T>};
  this.pending=Promise.allSettled([
   Object.keys(this.snapshot.guides).length?Promise.resolve():read<MovementGuide>('/exercise-guides.json').then(guides=>this.publish({guides})),
   Object.keys(this.snapshot.media).length?Promise.resolve():read<ExerciseMedia>('/exercise-content.json').then(media=>this.publish({media})),
  ]).then(results=>this.publish({loading:false,error:results.some(result=>result.status==='rejected')?'Some exercise instructions or photos could not load. Your workout is kept. Retry when connected.':''})).finally(()=>{this.pending=undefined});
  return this.pending;
 };
}
/** The guide action starts fetching; subscriptions only observe the immutable snapshot. */
export function useExerciseContent(){
 const [resource]=useState(()=>new ExerciseContent());
 const snapshot=useSyncExternalStore(resource.subscribe,resource.getSnapshot,resource.getSnapshot);
 useEffect(()=>{resource.activate();return resource.dispose},[resource]);
 return {...snapshot,load:resource.load};
}
