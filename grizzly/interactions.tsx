'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {useAppPreferences} from '../components/app-preferences';
import {GrizzlyPaw} from './grizzly-mark';
import {wildMotionAllowed,impactPoint,impactParticles} from './interaction-policy';
type Impact={id:number;x:number;y:number};

/** One delegated listener, at most three short effects, and no action interception. */
export function GrizzlyInteractions(){
 const {p,ready}=useAppPreferences(),[impacts,setImpacts]=useState<Impact[]>([]),serial=useRef(0);
 useEffect(()=>{
  if(!ready)return;
  const media=matchMedia('(prefers-reduced-motion: reduce)'),animations=new Set<Animation>();
  const allowed=()=>wildMotionAllowed(p.grizzlyStyle,p.reduceMotion,p.contrast,media.matches,document.hidden);
  const clear=()=>{setImpacts([]);for(const animation of animations)animation.cancel();animations.clear()};
  const play=(target:Element,frames:Keyframe[],options:KeyframeAnimationOptions)=>{
   if(typeof target.animate!=='function')return;
   const animation=target.animate(frames,options);animations.add(animation);animation.finished.then(()=>animations.delete(animation)).catch(()=>animations.delete(animation));
  };
  const strike=(event:PointerEvent|KeyboardEvent)=>{
   if(!allowed()||!(event.target instanceof Element))return;
   if(event instanceof KeyboardEvent&&(event.repeat||!['Enter',' '].includes(event.key)))return;
   if(event instanceof PointerEvent&&!event.isPrimary)return;
   const target=event.target.closest('button,[role="button"],summary,[role="tab"],[role="menuitem"]');
   if(!target||target.closest('[disabled],[aria-disabled="true"],fieldset[disabled]'))return;
   const rect=target.getBoundingClientRect();if(!rect.width||!rect.height)return;
   const point=event instanceof PointerEvent?impactPoint(event.clientX,event.clientY,innerWidth,innerHeight):impactPoint(rect.left+rect.width/2,rect.top+rect.height/2,innerWidth,innerHeight);
   setImpacts(old=>[...old.slice(-2),{id:++serial.current,...point}]);
   play(target,[{scale:'1',rotate:'0deg'},{scale:'.91',rotate:'-1.8deg',offset:.18},{scale:'1.045',rotate:'.8deg',offset:.52},{scale:'1',rotate:'0deg'}],{duration:460,easing:'cubic-bezier(.2,.85,.25,1)'});
   const forest=document.querySelector('.grizzly-forest-image');if(forest)play(forest,[{translate:'0 0'},{translate:'-4px 2px',offset:.18},{translate:'3px -1px',offset:.4},{translate:'0 0'}],{duration:360,easing:'ease-out'});
  };
  const visibility=()=>{if(!allowed())clear()};
  document.addEventListener('pointerdown',strike,true);document.addEventListener('keydown',strike,true);
  document.addEventListener('visibilitychange',visibility);media.addEventListener('change',visibility);
  return()=>{document.removeEventListener('pointerdown',strike,true);document.removeEventListener('keydown',strike,true);document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',visibility);clear()};
 },[ready,p.grizzlyStyle,p.reduceMotion,p.contrast]);
 return <div className="grizzly-impact-layer" data-impact-style={p.grizzlyStyle} aria-hidden="true">{impacts.map(impact=><div className="grizzly-impact" key={impact.id} style={{left:impact.x,top:impact.y}} onAnimationEnd={event=>{if(event.target===event.currentTarget)setImpacts(old=>old.filter(x=>x.id!==impact.id))}}>
  <div className="grizzly-impact-ring"/><div className="grizzly-impact-paw"><GrizzlyPaw/></div>
  <svg className="grizzly-impact-rake" viewBox="0 0 160 150" fill="none">{[0,1,2,3,4].map(n=><path key={n} d={`M${32+n*22} 9 Q${15+n*22} 61 ${18+n*19} 141`} stroke="currentColor" strokeWidth={5-n*.4} strokeLinecap="round" pathLength="1"/>)}</svg>
  {impactParticles.map((particle,n)=><i key={n} className={particle.leaf?'grizzly-impact-leaf':'grizzly-impact-ember'} style={{'--burst-x':particle.x+'px','--burst-y':particle.y+'px','--burst-turn':particle.turn+'deg'} as CSSProperties}/>)}
 </div>)}</div>;
}
