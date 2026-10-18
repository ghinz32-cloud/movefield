import React from 'react';
import {Image,Modal,Platform,ScrollView,Text,View,useWindowDimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {GrizzlyPressable as Pressable} from './wild-interactions';
import {useNativeAppearance} from './appearance';
import {brand,isGrizzly} from './shared/brand';
import {planName} from './shared/presentation';
import {niceDate,type State} from './shared/training';

export type NativeDestination='today'|'calendar'|'plans'|'exercises'|'progress'|'coaching'|'sources'|'history'|'settings'|'workout';
const destinations:{id:NativeDestination;label:string;symbol:string}[]=[
 {id:'today',label:'Today',symbol:'◉'},{id:'calendar',label:'Calendar',symbol:'▦'},
 {id:'plans',label:'Plans',symbol:'▤'},{id:'exercises',label:'Exercises',symbol:'◇'},
 {id:'progress',label:'Progress',symbol:'▥'},{id:'coaching',label:'Coaching',symbol:'◌'},
 {id:'sources',label:'Sources',symbol:'≡'},{id:'history',label:'Session history',symbol:'◷'},
 {id:'settings',label:'Profile & settings',symbol:'☷'},
];

export function NativeWorkspaceHeader({title,sample,onMenu}:{title:string;sample:boolean;onMenu:()=>void}){
 const {colors:c,p,fonts}=useNativeAppearance();
 return <View style={{flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:12,paddingVertical:4,borderBottomWidth:1,borderBottomColor:c.line,backgroundColor:c.white}}>
  <Pressable accessibilityRole="button" accessibilityLabel="Open navigation menu" onPress={onMenu} style={{width:48,minHeight:48,alignItems:'center',justifyContent:'center',gap:5}}>
   {[0,1,2].map(n=><View key={n} accessible={false} style={{height:2,width:20,backgroundColor:c.ink,borderRadius:1}}/>)}
  </Pressable>
  <Text style={{flex:1,color:c.ink,fontFamily:fonts?'Inter':undefined,fontSize:15*p.textSize/100,lineHeight:22*p.textSize/100}}>Workspace / {title}</Text>
  {sample&&<Text style={{color:c.green,fontFamily:fonts?'Inter':undefined,fontSize:12*p.textSize/100,lineHeight:18*p.textSize/100,fontWeight:'700'}}>SAMPLE</Text>}
 </View>;
}

/** Presentation only. The App owns guarded navigation after native dismissal. */
export function NativeWorkspaceMenu({visible,onClose,onDismiss,onSelect,selected,state,sample}:{visible:boolean;onClose:()=>void;onDismiss:()=>void;onSelect:(destination:NativeDestination)=>void;selected:NativeDestination;state:State;sample:boolean}){
 const {colors:c,p,fonts,headingFamily,reduceMotion}=useNativeAppearance(),window=useWindowDimensions();
 const text={color:c.ink,fontFamily:fonts?'Inter':undefined,fontSize:16*p.textSize/100,lineHeight:23*p.textSize/100};
 const pending=state.proposals.filter(proposal=>proposal.status==='pending').length;
 return <Modal visible={visible} transparent presentationStyle="overFullScreen" animationType={reduceMotion?'none':'fade'} onRequestClose={onClose} onDismiss={onDismiss}>
  <View style={{flex:1,flexDirection:'row',backgroundColor:'#0008'}}>
   <SafeAreaView testID="native-workspace-menu" accessibilityViewIsModal style={{width:Math.min(360,window.width-24),maxWidth:'100%',backgroundColor:c.white}}>
    <View style={{paddingHorizontal:16,paddingVertical:6,flexDirection:'row',alignItems:'center',gap:8,borderBottomWidth:1,borderBottomColor:c.line}}>
     {isGrizzly&&<Image alt="" accessible={false} source={require('../assets/grizzly-fitness-logo.jpg')} resizeMode="contain" style={{width:50,height:45,backgroundColor:'#000',borderRadius:6}}/>}
     <Text accessibilityRole="header" style={{flex:1,color:c.ink,fontFamily:fonts?headingFamily:undefined,fontSize:25*p.textSize/100,lineHeight:32*p.textSize/100}}>{brand.name}</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="Close navigation" onPress={onClose} style={{minWidth:48,minHeight:48,justifyContent:'center',alignItems:'center'}}><Text accessible={false} style={{...text,fontSize:28}}>×</Text></Pressable>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:16,gap:6}}>
     {state.active&&<Pressable accessibilityRole="button" onPress={()=>onSelect('workout')} style={{padding:14,minHeight:48,borderRadius:10,backgroundColor:c.green,marginBottom:8}}><Text style={{...text,color:c.onAccent,fontWeight:'700'}}>Resume workout</Text></Pressable>}
     {destinations.map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{selected:selected===item.id}} {...(Platform.OS==='web'?{'aria-current':selected===item.id?'page':undefined}:{})} onPress={()=>onSelect(item.id)} style={{minHeight:52,paddingHorizontal:12,paddingVertical:12,flexDirection:'row',alignItems:'center',gap:12,borderRadius:10,backgroundColor:selected===item.id?c.pale:undefined}}>
      <Text accessible={false} style={{...text,width:24,textAlign:'center',color:selected===item.id?c.green:c.muted}}>{item.symbol}</Text>
      <Text style={{...text,flex:1,fontWeight:selected===item.id?'700':'500',color:selected===item.id?c.green:c.ink}}>{item.label}</Text>
      {item.id==='coaching'&&pending>0&&<Text accessibilityLabel={`${pending} changes to review`} style={{...text,color:c.green,fontWeight:'700'}}>{pending}</Text>}
     </Pressable>)}
     {state.plan&&<View style={{marginTop:12,paddingTop:16,borderTopWidth:1,borderTopColor:c.line,gap:6}}><Text style={{...text,color:c.muted,fontSize:13*p.textSize/100}}>CURRENT PLAN</Text><Text style={{...text,fontWeight:'700'}}>{planName(state.plan)}</Text><Text style={{...text,color:c.muted,fontSize:14*p.textSize/100}}>{niceDate(state.plan.sessions[0]?.date||state.plan.profile.start)} – {niceDate(state.plan.sessions.at(-1)?.date||state.plan.profile.start)}</Text></View>}
     <View style={{marginTop:12,paddingTop:16,borderTopWidth:1,borderTopColor:c.line,gap:4}}><Text style={{...text,fontWeight:'600'}}>{sample?'Sample training':state.profile.name||'Your profile'}</Text><Text style={{...text,color:c.muted,fontSize:14*p.textSize/100}}>{sample?'Synthetic records · personal profile stays separate':'Saved on this device'}</Text></View>
    </ScrollView>
   </SafeAreaView>
   <Pressable accessible={false} onPress={onClose} style={{flex:1}}/>
  </View>
 </Modal>;
}
