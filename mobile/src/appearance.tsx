import React,{createContext,useContext,useEffect,useMemo,useRef,useState} from 'react';
import {AccessibilityInfo,useColorScheme,type ViewStyle,type TextStyle,type ImageStyle} from 'react-native';
import {isGrizzly} from './shared/brand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFonts,loadAsync} from 'expo-font';
import {grizzlyFontAssets} from './grizzly-font-assets';
import {AppState} from 'react-native';
import {defaultPreferences,palettes,headingFonts,preferenceKey,readPreferences,type AppPreferences} from './shared/app-preferences';
const Context=createContext({p:defaultPreferences,ready:false,update:(_patch:Partial<AppPreferences>)=>{},error:'',dark:false,reduceMotion:false,fonts:false,active:true,loadedHeading:''});
export function NativeAppearanceProvider({children}:{children:React.ReactNode}){
 const [p,setP]=useState(defaultPreferences),[ready,setReady]=useState(false),[error,setError]=useState(''),[systemReduce,setSystemReduce]=useState(false);
 const current=useRef(p),writes=useRef(Promise.resolve()),scheme=useColorScheme();
 const [active,setActive]=useState(AppState.currentState!=='background'&&AppState.currentState!=='inactive');
 useEffect(()=>{const listener=AppState.addEventListener('change',state=>setActive(state==='active'));return()=>listener.remove()},[]);
 const [fonts]=useFonts({Inter:grizzlyFontAssets.Inter,'Barlow Condensed':grizzlyFontAssets['Barlow Condensed']});
 const [loadedHeading,setLoadedHeading]=useState(''),[fontError,setFontError]=useState('');
 useEffect(()=>{if(!isGrizzly)return;let live=true;const family=headingFonts.find(f=>f.id===p.headingFont)!.family;
  loadAsync({[family]:grizzlyFontAssets[family as keyof typeof grizzlyFontAssets]}).then(()=>{if(live){setLoadedHeading(family);setFontError('')}}).catch(()=>{if(live)setFontError('The heading font could not be opened. Clear lettering stays available. Choose another font or reopen the app.')});
  return()=>{live=false};
 },[p.headingFont]);
 useEffect(()=>{let live=true;AsyncStorage.getItem(preferenceKey).then(raw=>{if(live){current.current=readPreferences(raw);setP(current.current)}}).catch(()=>{if(live)setError('Your preferences could not be opened. Try reopening the app.')}).finally(()=>{if(live)setReady(true)});AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(live)setSystemReduce(v)});const listener=AccessibilityInfo.addEventListener('reduceMotionChanged',setSystemReduce);return()=>{live=false;listener.remove()}},[]);
 const update=(patch:Partial<AppPreferences>)=>{const next=readPreferences(JSON.stringify({...current.current,...patch}));current.current=next;setP(next);writes.current=writes.current.catch(()=>{}).then(()=>AsyncStorage.setItem(preferenceKey,JSON.stringify(next))).then(()=>setError('')).catch(()=>setError('Preferences apply now but could not be saved.'))};
 return <Context.Provider value={{p,ready,error:fontError||error,update,dark:p.mode==='dark'||p.mode==='system'&&scheme==='dark',reduceMotion:p.reduceMotion||systemReduce,fonts,active,loadedHeading}}>{children}</Context.Provider>;
}
export function useNativeAppearance(){
 const context=useContext(Context),{dark,p}=context;
 const palette=palettes.find(x=>x.id===p.palette)!;
 const colors={bg:isGrizzly?(dark?'#171a16':'#f6f3ec'):(dark?'#10191d':'#f4f6f7'),ink:dark?'#edf3f5':'#192b30',muted:p.contrast?(dark?'#e4eef3':'#253b44'):(dark?'#b4c7cf':'#4c616a'),green:(dark?palette.from:palette.strong) as string,line:p.contrast?(dark?'#a4bbc6':'#637982'):(dark?'#7d949e':'#71858e'),pale:dark?'#293c44':'#e8edef',white:isGrizzly?(dark?'#232820':'#fffefa'):(dark?'#19262c':'#ffffff'),danger:dark?'#ffadb6':'#b62d3b',onAccent:dark?'#132325':'#ffffff',from:palette.from as string,to:palette.to as string,effect:'#d6b77c'};
 if(isGrizzly&&p.grizzlyStyle==='wild'){colors.bg=dark?'#07130e':'#f6f0e3';colors.white=dark?'#132219':'#fffaf0';colors.pale=dark?'#293a2b':'#e6e9d5';colors.ink=dark?'#f5f1e3':'#263626';colors.muted=p.contrast?(dark?'#f5f1e3':'#243122'):(dark?'#c0cbb7':'#4d6049');colors.line=p.contrast?(dark?'#d4d9bc':'#56603b'):(dark?'#9e956c':'#82724c');}
 return {...context,colors,headingFamily:isGrizzly&&context.loadedHeading===headingFonts.find(x=>x.id===p.headingFont)!.family?context.loadedHeading:'Barlow Condensed'};
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
   if(isGrizzly&&p.grizzlyStyle==='wild'&&['card','darkCard'].includes(key)){style.borderRadius=5;style.borderTopWidth=3;style.borderTopColor='#af9761';style.borderColor=c.line;style.shadowColor='#000000';style.shadowOffset={width:3,height:5};style.shadowOpacity=.22;style.shadowRadius=8;style.elevation=3;}
   if(isGrizzly&&p.grizzlyStyle==='wild'&&['button','secondaryButton'].includes(key)){style.borderRadius=5;style.borderBottomWidth=3;style.borderBottomColor=key==='button'?'#64754b':c.line;}
   if(isGrizzly&&key==='brand'){style.fontSize=16*(p.textSize/100);style.letterSpacing=0;style.fontWeight='400';}
   if(style.lineHeight)style.lineHeight*=p.textSize/100;
   if(key==='input'&&!style.color)style.color=c.ink;
   result[key]=style;
  }
  return result as T;
 },[base,p.textSize,p.palette,p.contrast,p.grizzlyStyle,p.headingFont,dark,fonts,headingFamily]);
}
