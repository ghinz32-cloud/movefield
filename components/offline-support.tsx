"use client";
import {useEffect} from 'react';

// Registers the offline shell (public/sw.js) in production builds only. The service worker stores the app's own
// files, never training records. Those stay in this browser's encrypted storage.
export function OfflineSupport(){
 useEffect(()=>{
  if(!import.meta.env.PROD||!('serviceWorker' in navigator))return;
  void navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>undefined);
 },[]);
 return null;
}
