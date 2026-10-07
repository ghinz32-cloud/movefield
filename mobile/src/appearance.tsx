import React,{createContext,useContext,useEffect,useMemo,useRef,useState} from 'react';
import {AccessibilityInfo,useColorScheme} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFonts} from 'expo-font';
import {defaultPreferences,palettes,preferenceKey,readPreferences,type AppPreferences} from './shared/app-preferences';
const Context=createContext({p:defaultPreferences,ready:false,update:(_patch:Partial<AppPreferences>)=>{},error:'',dark:false,reduceMotion:false,fonts:false});
export function NativeAppearanceProvider({children}:{children:React.ReactNode}){
 const [p,setP]=useState(defaultPreferences),[ready,setReady]=useState(false),[error,setError]=useState(''),[systemReduce,setSystemReduce]=useState(false);
 const current=useRef(p),writes=useRef(Promise.resolve()),scheme=useColorScheme();
 const [fonts]=useFonts({Inter:require('../assets/fonts/inter-variable.ttf'),'Barlow Condensed':require('../assets/fonts/barlow-condensed-semibold.ttf'),'Oswald':require('../assets/fonts/Oswald_600SemiBold.ttf'),'Oswald Bold':require('../assets/fonts/Oswald_700Bold.ttf'),'Atkinson Hyperlegible':require('../assets/fonts/AtkinsonHyperlegible_400Regular.ttf'),'Atkinson Hyperlegible Bold':require('../assets/fonts/AtkinsonHyperlegible_700Bold.ttf')});
 useEffect(()=>{let live=true;AsyncStorage.getItem(preferenceKey).then(raw=>{if(live){current.current=readPreferences(raw);setP(current.current)}}).catch(()=>{if(live)setError('Your preferences could not be opened. Try reopening the app.')}).finally(()=>{if(live)setReady(true)});AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(live)setSystemReduce(v)});const listener=AccessibilityInfo.addEventListener('reduceMotionChanged',setSystemReduce);return()=>{live=false;listener.remove()}},[]);
 const update=(patch:Partial<AppPreferences>)=>{const next=readPreferences(JSON.stringify({...current.current,...patch}));current.current=next;setP(next);writes.current=writes.current.catch(()=>{}).then(()=>AsyncStorage.setItem(preferenceKey,JSON.stringify(next))).then(()=>setError('')).catch(()=>setError('Preferences apply now but could not be saved.'))};
 return <Context.Provider value={{p,ready,error,update,dark:p.mode==='dark'||p.mode==='system'&&scheme==='dark',reduceMotion:p.reduceMotion||systemReduce,fonts}}>{children}</Context.Provider>;
}
export function useNativeAppearance(){
 const context=useContext(Context),{dark,p}=context;
 const palette=palettes.find(x=>x.id===p.palette)!;
 const colors={bg:dark?'#10191d':'#f4f6f7',ink:dark?'#edf3f5':'#192b30',muted:p.contrast?(dark?'#e4eef3':'#253b44'):(dark?'#b4c7cf':'#4c616a'),green:dark?palette.from:palette.strong,line:p.contrast?(dark?'#a4bbc6':'#637982'):(dark?'#7d949e':'#71858e'),pale:dark?'#293c44':'#e8edef',white:dark?'#19262c':'#ffffff',danger:dark?'#ffadb6':'#b62d3b',onAccent:dark?'#132325':'#ffffff',from:palette.from,to:palette.to};
 return {...context,colors};
}
export const families:Record<string,{heading:string;body:string}>={
 athletic:{heading:'Barlow Condensed',body:'Inter'},
 bold:{heading:'Oswald',body:'Inter'},
 easy:{heading:'Atkinson Hyperlegible',body:'Atkinson Hyperlegible'},
 classic:{heading:'Inter',body:'Inter'},
};
export function useThemedStyles<T extends Record<string,any>>(base:T):T{
 const {p,dark,fonts,colors:c}=useNativeAppearance();
 return useMemo(()=>{
  const mapping:Record<string,string>={'#f6f5ef':c.bg,'#19362d':c.ink,'#66746b':c.muted,'#214d3a':c.green,'#dce1d7':c.line,'#e6eddd':c.pale,'#933c2d':c.danger,'#eff3e8':c.pale,'#f6e3dc':dark?'#39262b':'#fff0ef'};
  const result:Record<string,any>={};
  for(const [key,value] of Object.entries(base)){
   const style={...value};
   for(const [prop,v] of Object.entries(style))if(typeof v==='string'){
    const lower=v.toLowerCase();if(lower==='#ffffff')style[prop]=prop==='color'?c.onAccent:c.white;else if(lower==='#d4e3c6'||lower==='#e5ecdc')style[prop]=c.onAccent;else if(mapping[lower])style[prop]=mapping[lower];
   }
   if(style.fontSize){style.fontSize=Math.max(14,style.fontSize)*(p.textSize/100);if(fonts)style.fontFamily=['title','darkTitle','brandSub'].includes(key)?families[p.font].heading:families[p.font].body;}
   if(style.lineHeight)style.lineHeight*=p.textSize/100;
   if(key==='input'&&!style.color)style.color=c.ink;
   result[key]=style;
  }
  return result as T;
 },[base,p.textSize,p.palette,p.contrast,dark,fonts,p.font]);
}
