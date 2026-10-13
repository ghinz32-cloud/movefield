'use client';
import {useEffect,useState} from 'react';
import {publicPath} from '../lib/public-path';
import {GrizzlyMark,GrizzlyPaw,GrizzlyClaws} from './grizzly-mark';
import {useAppPreferences} from '../components/app-preferences';
import {OgGrizzlyBear} from './og-bear';

/** Atmospheric artwork is separate from the unchanged gym logo and from records. */
export function GrizzlyEnvironment(){
 const {p}=useAppPreferences();
 const [paused,setPaused]=useState(true);
 useEffect(()=>{const apply=()=>setPaused(document.hidden);apply();document.addEventListener('visibilitychange',apply);return()=>document.removeEventListener('visibilitychange',apply)},[]);
 if(p.grizzlyStyle!=='wild')return null;
 return <div className="grizzly-environment" data-paused={paused} aria-hidden="true">
  <img className="grizzly-forest-image" src={publicPath('/brand/wilderness/grizzly-forest-v1.jpg')} alt="" width="1024" height="1536" decoding="async"/>
  <div className="grizzly-forest-shade"/><div className="grizzly-fog grizzly-fog-back"/><div className="grizzly-fog grizzly-fog-front"/>
  <div className="grizzly-embers">{Array.from({length:12},(_,n)=><i key={n} style={{left:`${5+n*8}%`,animationDelay:`${-n*1.8}s`,animationDuration:`${18+n%4*3}s`}}/>)}</div>
 </div>;
}
export function GrizzlyHeroArt(){const {p}=useAppPreferences();return <div className="grizzly-hero-art" aria-hidden="true">{p.grizzlyStyle==='wild'&&<><img src={publicPath('/brand/wilderness/grizzly-hero-v1.jpg')} alt="" width="1536" height="1024" fetchPriority="high"/><span/></>}{p.grizzlyStyle==='og'&&<div className="grizzly-og-art"><GrizzlyClaws/><OgGrizzlyBear/><div className="grizzly-og-badge"><GrizzlyMark/><i/></div><div className="grizzly-og-paw-stamp"><GrizzlyPaw/></div></div>}</div>}
export function GrizzlyDenHero(){
 return <section className="grizzly-den-hero" aria-label="Welcome to Grizzly Fitness">
  <GrizzlyHeroArt/><div className="grizzly-den-copy"><span className="grizzly-expedition-label">GRIZZLY FITNESS · EVERY LOCATION. ONE PACK.</span><h2>Wake the <br/><em>grizzly.</em></h2><p>Your den. Your discipline.<br/>Your next strong day.</p><div className="grizzly-den-seal"><GrizzlyPaw/><span>BUILT FOR<br/><b>THE LONG HAUL</b></span></div></div>
  <div className="grizzly-den-foot"><span>STRENGTH / MUSCLE / MOMENTUM</span><span>EST. EVERY DAY</span></div>
 </section>;
}
