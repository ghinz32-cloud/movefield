import React,{createContext,useContext,useEffect,useMemo,useRef,useState} from 'react';
import {AccessibilityInfo,useColorScheme,type ViewStyle,type TextStyle,type ImageStyle} from 'react-native';
import interFont from '../assets/fonts/inter-variable.ttf';
import headingFont from '../assets/fonts/barlow-condensed-semibold.ttf';
import grizzlyHeadingFont from '../assets/fonts/bungee-regular.ttf';
import oswaldFont from '../assets/fonts/oswald-heading.ttf';
import bitterFont from '../assets/fonts/bitter-heading.ttf';
import rajdhaniFont from '../assets/fonts/rajdhani-heading.ttf';
import newrockerFont from '../assets/fonts/newrocker-heading.ttf';
import blackopsoneFont from '../assets/fonts/blackopsone-heading.ttf';
import sairastenciloneFont from '../assets/fonts/sairastencilone-heading.ttf';
import stardosstencilFont from '../assets/fonts/stardosstencil-heading.ttf';
import pirataoneFont from '../assets/fonts/pirataone-heading.ttf';
import eaterFont from '../assets/fonts/eater-heading.ttf';
import nosiferFont from '../assets/fonts/nosifer-heading.ttf';
import rubikdirtFont from '../assets/fonts/rubikdirt-heading.ttf';
import metalFont from '../assets/fonts/metal-mania-regular.ttf';
import {isGrizzly} from './shared/brand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFonts} from 'expo-font';
import {defaultPreferences,palettes,headingFonts,preferenceKey,readPreferences,type AppPreferences} from './shared/app-preferences';
const Context=createContext({p:defaultPreferences,ready:false,update:(_patch:Partial<AppPreferences>)=>{},error:'',dark:false,reduceMotion:false,fonts:false});
export function NativeAppearanceProvider({children}:{children:React.ReactNode}){
 const [p,setP]=useState(defaultPreferences),[ready,setReady]=useState(false),[error,setError]=useState(''),[systemReduce,setSystemReduce]=useState(false);
 const current=useRef(p),writes=useRef(Promise.resolve()),scheme=useColorScheme();
 const [fonts]=useFonts({Inter:interFont,'Barlow Condensed':headingFont,...(isGrizzly?{Bungee:grizzlyHeadingFont,'Metal Mania':metalFont,'Oswald':oswaldFont,'Bitter':bitterFont,'Rajdhani':rajdhaniFont,'New Rocker':newrockerFont,'Black Ops One':blackopsoneFont,'Saira Stencil One':sairastenciloneFont,'Stardos Stencil':stardosstencilFont,'Pirata One':pirataoneFont,'Eater':eaterFont,'Nosifer':nosiferFont,'Rubik Dirt':rubikdirtFont}:{})});
 useEffect(()=>{let live=true;AsyncStorage.getItem(preferenceKey).then(raw=>{if(live){current.current=readPreferences(raw);setP(current.current)}}).catch(()=>{if(live)setError('Your preferences could not be opened. Try reopening the app.')}).finally(()=>{if(live)setReady(true)});AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(live)setSystemReduce(v)});const listener=AccessibilityInfo.addEventListener('reduceMotionChanged',setSystemReduce);return()=>{live=false;listener.remove()}},[]);
 const update=(patch:Partial<AppPreferences>)=>{const next=readPreferences(JSON.stringify({...current.current,...patch}));current.current=next;setP(next);writes.current=writes.current.catch(()=>{}).then(()=>AsyncStorage.setItem(preferenceKey,JSON.stringify(next))).then(()=>setError('')).catch(()=>setError('Preferences apply now but could not be saved.'))};
 return <Context.Provider value={{p,ready,error,update,dark:p.mode==='dark'||p.mode==='system'&&scheme==='dark',reduceMotion:p.reduceMotion||systemReduce,fonts}}>{children}</Context.Provider>;
}
export function useNativeAppearance(){
 const context=useContext(Context),{dark,p}=context;
 const palette=palettes.find(x=>x.id===p.palette)!;
 const colors={bg:isGrizzly?(dark?'#171a16':'#f6f3ec'):(dark?'#10191d':'#f4f6f7'),ink:dark?'#edf3f5':'#192b30',muted:p.contrast?(dark?'#e4eef3':'#253b44'):(dark?'#b4c7cf':'#4c616a'),green:dark?palette.from:palette.strong,line:p.contrast?(dark?'#a4bbc6':'#637982'):(dark?'#7d949e':'#71858e'),pale:dark?'#293c44':'#e8edef',white:isGrizzly?(dark?'#232820':'#fffefa'):(dark?'#19262c':'#ffffff'),danger:dark?'#ffadb6':'#b62d3b',onAccent:dark?'#132325':'#ffffff',from:palette.from,to:palette.to};
 if(isGrizzly&&p.grizzlyStyle==='wild'){colors.bg=dark?'#080e14':'#eef3f5';colors.white=dark?'#141f29':'#f9fcfd';colors.pale=dark?'#263746':'#dbe5ea';}
 return {...context,colors,headingFamily:isGrizzly?headingFonts.find(x=>x.id===p.headingFont)!.family:'Barlow Condensed'};
}
export function useThemedStyles<T extends Record<string,ViewStyle|TextStyle|ImageStyle>>(base:T):T{
 const {p,dark,fonts,colors:c,headingFamily}=useNativeAppearance();
 return useMemo(()=>{
  const mapping:Record<string,string>={'#f6f5ef':c.bg,'#19362d':c.ink,'#66746b':c.muted,'#214d3a':c.green,'#dce1d7':c.line,'#e6eddd':c.pale,'#933c2d':c.danger,'#eff3e8':c.pale,'#f6e3dc':dark?'#39262b':'#fff0ef'};
  const result:Record<string,ViewStyle|TextStyle|ImageStyle>={};
  for(const [key,value] of Object.entries(base)){
   const style=Object.fromEntries(Object.entries(value).map(([prop,v])=>{
    if(typeof v!=='string')return [prop,v];
    const lower=v.toLowerCase();return [prop,lower==='#ffffff'?(prop==='color'?c.onAccent:c.white):lower==='#d4e3c6'||lower==='#e5ecdc'?c.onAccent:mapping[lower]||v];
   })) as ViewStyle&TextStyle&ImageStyle;
   if(style.fontSize){style.fontSize=Math.max(14,style.fontSize)*(p.textSize/100);if(fonts)style.fontFamily=(isGrizzly?['title','darkTitle','brand']:['title','darkTitle','brandSub']).includes(key)?headingFamily:'Inter';}
   if(isGrizzly&&['title','darkTitle','brand'].includes(key)){style.fontWeight=String(Math.round(headingFonts.find(x=>x.id===p.headingFont)!.weight/100)*100) as TextStyle['fontWeight'];}
   if(isGrizzly&&p.grizzlyStyle==='wild'&&['card','darkCard'].includes(key)){style.borderRadius=4;style.borderTopWidth=3;style.borderTopColor=c.from;}
   if(isGrizzly&&key==='brand'){style.fontSize=16*(p.textSize/100);style.letterSpacing=0;style.fontWeight='400';}
   if(style.lineHeight)style.lineHeight*=p.textSize/100;
   if(key==='input'&&!style.color)style.color=c.ink;
   result[key]=style;
  }
  return result as T;
 },[base,p.textSize,p.palette,p.contrast,p.grizzlyStyle,p.headingFont,dark,fonts,headingFamily]);
}
