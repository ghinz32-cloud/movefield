import React,{useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,BackHandler,KeyboardAvoidingView,Platform,ScrollView,Text,View,findNodeHandle,useWindowDimensions,type StyleProp,type ViewStyle} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {GrizzlyPressable as Pressable} from './wild-interactions';
import {useNativeAppearance} from './appearance';
import {isGrizzly} from './shared/brand';
import {nativeWindowLayout} from './adaptive-layout';

export type NativePhoneAction={label:string;accessibilityLabel?:string;onPress:()=>void;disabled?:boolean};

/** One screen, one scrolling body. The app owns safe areas and keyboard movement
 * unless a standalone caller explicitly opts in. Footer actions never overlap it. */
export function NativeFlowScreen({title,compactTitle,compact,subtitle,scrollResetKey,onBack,backLabel='Back',compactBack=false,trailing,children,footer,sidePanel,sidePanelLabel='Workout exercises',onAvailableHeight,contentStyle,keyboardAvoiding=false,insetBottom=false,handleHardwareBack=false}:{
 title:string;compactTitle?:string;compact?:boolean;subtitle?:string;scrollResetKey?:string;onBack?:()=>void;backLabel?:string;compactBack?:boolean;trailing?:React.ReactNode;children?:React.ReactNode;footer?:React.ReactNode;sidePanel?:React.ReactNode;sidePanelLabel?:string;onAvailableHeight?:(height:number)=>void;contentStyle?:StyleProp<ViewStyle>;keyboardAvoiding?:boolean;insetBottom?:boolean;handleHardwareBack?:boolean;
}){
 const {colors:c,p,fonts,headingFamily}=useNativeAppearance(),insets=useSafeAreaInsets(),window=useWindowDimensions();
 const [available,setAvailable]=useState({width:window.width,height:window.height});
 const dimensions=nativeWindowLayout(available.width,window.height,p.textSize,window.fontScale),layout={...dimensions,compactHeight:compact??dimensions.compactHeight},expanded=!!sidePanel&&layout.expanded&&available.height>=480;
 const arrowOnly=compactBack||layout.compactHeight;
 const scroll=useRef<ScrollView>(null),heading=useRef<Text>(null),back=useRef(onBack),previousTitle=useRef<string|null>(null),hasBack=!!onBack;
 useEffect(()=>{back.current=onBack},[onBack]);
 useEffect(()=>{if(!hasBack||!handleHardwareBack)return;const listener=BackHandler.addEventListener('hardwareBackPress',()=>{back.current?.();return true});return()=>listener.remove()},[hasBack,handleHardwareBack]);
 useEffect(()=>{
  const changed=previousTitle.current!==title;previousTitle.current=title;
  if(!changed&&!scrollResetKey)return;
  scroll.current?.scrollTo({y:0,animated:false});let live=true;
  void AccessibilityInfo.isScreenReaderEnabled().then(enabled=>{if(!enabled||!live)return;const tag=findNodeHandle(heading.current);if(tag)AccessibilityInfo.setAccessibilityFocus(tag)}).catch(()=>{});
  return()=>{live=false};
 },[title,scrollResetKey]);
 const text={color:c.ink,fontFamily:fonts?'Inter':undefined,fontSize:16*p.textSize/100,lineHeight:23*p.textSize/100};
 return <KeyboardAvoidingView testID="native-flow-screen" onLayout={event=>{const {width,height}=event.nativeEvent.layout;if(width>0&&height>0){setAvailable(previous=>previous.width===width&&previous.height===height?previous:{width,height});onAvailableHeight?.(height)}}} style={{flex:1,minHeight:0,backgroundColor:c.bg,paddingBottom:insetBottom?insets.bottom:0}} enabled={keyboardAvoiding} behavior={Platform.OS==='ios'?'padding':undefined}>
  <View style={{borderBottomWidth:1,borderBottomColor:c.line,backgroundColor:c.white}}><View style={{width:'100%',maxWidth:expanded?1280:layout.readingWidth,alignSelf:'center',paddingHorizontal:18,paddingVertical:layout.compactHeight?4:10,gap:5}}>
   <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
    {onBack&&<Pressable accessibilityRole="button" accessibilityLabel={backLabel} onPress={onBack} style={{minHeight:48,minWidth:48,width:arrowOnly?48:undefined,justifyContent:'center',alignItems:arrowOnly?'center':undefined,paddingRight:arrowOnly?0:4}}><Text accessible={false} style={[text,{color:c.green,fontWeight:'700'},arrowOnly?{fontSize:28,lineHeight:34}:undefined]}>{arrowOnly?'‹':'‹ '+backLabel}</Text></Pressable>}
    <Text ref={heading} accessibilityRole="header" accessibilityLabel={title} style={{flex:1,flexShrink:1,color:c.ink,fontFamily:fonts?headingFamily:undefined,fontWeight:isGrizzly?'400':'700',fontSize:25*p.textSize/100,lineHeight:32*p.textSize/100}}>{layout.compactHeight&&compactTitle?compactTitle:title}</Text>
    {trailing}
   </View>
   {!!subtitle&&<Text style={[text,{color:c.muted}]}>{subtitle}</Text>}
  </View></View>
  <View style={{flex:1,minHeight:0,width:'100%',maxWidth:expanded?1280:layout.readingWidth,alignSelf:'center',flexDirection:'row'}}>
   <ScrollView key="context" accessibilityLabel={sidePanelLabel} accessibilityElementsHidden={!expanded} importantForAccessibility={expanded?'auto':'no-hide-descendants'} style={{display:expanded?'flex':'none',width:layout.listWidth,flexGrow:0,borderRightWidth:1,borderRightColor:c.line}} contentContainerStyle={{padding:16,gap:10}} keyboardShouldPersistTaps="handled">{sidePanel}</ScrollView>
   <View key="primary" style={{flex:1,minWidth:0,minHeight:0}}>
    <ScrollView ref={scroll} testID="native-flow-body" tabIndex={0} focusable style={{flex:1,minHeight:0}} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS==='web'?'none':'on-drag'} contentContainerStyle={[{padding:18,paddingBottom:24,gap:16},contentStyle]}>{children}</ScrollView>
    {footer}
   </View>
  </View>
 </KeyboardAvoidingView>;
}

export function NativeSection({title,description,children}:{title?:string;description?:string;children?:React.ReactNode}){
 const {colors:c,p,fonts}=useNativeAppearance();
 return <View style={{padding:16,gap:12,borderWidth:1,borderColor:c.line,borderRadius:16,backgroundColor:c.white}}>
  {!!title&&<Text accessibilityRole="header" style={{color:c.ink,fontFamily:fonts?'Inter':undefined,fontSize:17*p.textSize/100,lineHeight:24*p.textSize/100,fontWeight:'700'}}>{title}</Text>}
  {!!description&&<Text style={{color:c.muted,fontFamily:fonts?'Inter':undefined,fontSize:15*p.textSize/100,lineHeight:22*p.textSize/100}}>{description}</Text>}
  {children}
 </View>;
}

export function NativeSettingsRow({label,value,detail,onPress,selected,disabled=false,danger=false}:{label:string;value?:string;detail?:string;onPress:()=>void;selected?:boolean;disabled?:boolean;danger?:boolean}){
 const {colors:c,p,fonts}=useNativeAppearance(),color=danger?c.danger:c.ink;
 return <Pressable accessibilityRole="button" accessibilityLabel={[label,value,detail].filter(Boolean).join('. ')} accessibilityState={{selected,disabled}} disabled={disabled} onPress={onPress} style={{minHeight:60,flexDirection:'row',alignItems:'center',gap:14,padding:14,borderWidth:1,borderColor:selected?c.green:c.line,borderRadius:12,backgroundColor:selected?c.pale:c.white,opacity:disabled?.5:1}}>
  <View style={{flex:1,gap:3}}><Text style={{color,fontFamily:fonts?'Inter':undefined,fontSize:16*p.textSize/100,lineHeight:23*p.textSize/100,fontWeight:'600'}}>{label}</Text>{!!value&&<Text style={{color:c.muted,fontFamily:fonts?'Inter':undefined,fontSize:14*p.textSize/100,lineHeight:21*p.textSize/100}}>{value}</Text>}{!!detail&&<Text style={{color:c.muted,fontFamily:fonts?'Inter':undefined,fontSize:14*p.textSize/100,lineHeight:21*p.textSize/100}}>{detail}</Text>}</View>
  <Text accessible={false} style={{color:selected?c.green:c.muted,fontSize:22}}>{selected===undefined?'›':selected?'✓':'○'}</Text>
 </Pressable>;
}

export function NativeActionFooter({primary,secondary,children,insetBottom=false,compact}:{primary:NativePhoneAction;secondary?:NativePhoneAction;children?:React.ReactNode;insetBottom?:boolean;compact?:boolean}){
 const {colors:c,p,fonts}=useNativeAppearance(),insets=useSafeAreaInsets(),window=useWindowDimensions(),dimensions=nativeWindowLayout(window.width,window.height,p.textSize,window.fontScale),layout={...dimensions,compactHeight:compact??dimensions.compactHeight};
 const action=(item:NativePhoneAction,main:boolean)=><Pressable key={main?'primary':'secondary'} accessibilityRole="button" accessibilityLabel={item.accessibilityLabel||item.label} accessibilityState={{disabled:!!item.disabled}} disabled={item.disabled} onPress={item.onPress} style={{minHeight:50,paddingHorizontal:16,paddingVertical:13,justifyContent:'center',alignItems:'center',borderRadius:12,borderWidth:1,borderColor:main?c.green:c.line,backgroundColor:main?c.green:c.white,opacity:item.disabled?0.5:1}}><Text style={{color:main?c.onAccent:c.ink,fontFamily:fonts?'Inter':undefined,fontSize:16*p.textSize/100,lineHeight:23*p.textSize/100,fontWeight:'700',textAlign:'center'}}>{item.label}</Text></Pressable>;
 return <View style={{borderTopWidth:1,borderTopColor:c.line,backgroundColor:c.white}}><View style={{width:'100%',maxWidth:layout.readingWidth,alignSelf:'center',paddingHorizontal:18,paddingTop:layout.compactHeight?6:12,paddingBottom:Math.max(layout.compactHeight?6:12,insetBottom?insets.bottom:0),gap:10}}>{children}{action(primary,true)}{secondary&&action(secondary,false)}</View></View>;
}
