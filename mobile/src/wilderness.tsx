import React,{useEffect,useState} from 'react';
import {Animated,Image,StyleSheet,Text,View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {isGrizzly} from './shared/brand';
import {useNativeAppearance} from './appearance';
import heroArt from '../assets/wilderness/grizzly-hero-v1.jpg';
import forestArt from '../assets/wilderness/grizzly-forest-v1.jpg';
import {NativeWildReveal} from './wild-interactions';
import {NativeOGBear} from './og-bear';

/** One native-driver loop; stop it when hidden, reduced-motion, or Clean. */
function useForestDrift(enabled:boolean){
 const [drift]=useState(()=>new Animated.Value(0)),{active}=useNativeAppearance();
 useEffect(()=>{if(!enabled||!active){drift.stopAnimation();drift.setValue(0);return}const loop=Animated.loop(Animated.sequence([Animated.timing(drift,{toValue:1,duration:14000,useNativeDriver:true,isInteraction:false}),Animated.timing(drift,{toValue:0,duration:14000,useNativeDriver:true,isInteraction:false})]));loop.start();return()=>{loop.stop();drift.stopAnimation()}},[drift,enabled,active]);
 return drift;
}
export function NativeWildernessShell({children,sceneKey}:{children:React.ReactNode;sceneKey?:string}){
 const {p,colors,dark,reduceMotion}=useNativeAppearance(),wild=isGrizzly&&p.grizzlyStyle==='wild'&&!p.contrast,og=isGrizzly&&p.grizzlyStyle==='og';
 const drift=useForestDrift(wild&&!reduceMotion);
 if(og)return <View style={{flex:1,backgroundColor:colors.bg}}><NativeWildReveal style={{flex:1}} sceneKey={sceneKey}>{children}</NativeWildReveal></View>;
 if(!wild)return <View style={{flex:1,backgroundColor:colors.bg}}>{children}</View>;
 return <View style={{flex:1,backgroundColor:colors.bg}}>
  <View style={StyleSheet.absoluteFill} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
   <Image source={forestArt} resizeMode="cover" style={[StyleSheet.absoluteFill,{opacity:dark?.65:.3}]} accessible={false}/>
   <View style={[StyleSheet.absoluteFill,{backgroundColor:colors.bg,opacity:dark?.5:.68}]}/>
   <Animated.View style={{position:'absolute',left:-40,right:-40,bottom:'12%',height:210,opacity:drift.interpolate({inputRange:[0,1],outputRange:[.08,.2]}),transform:[{translateX:drift.interpolate({inputRange:[0,1],outputRange:[-24,24]})}]}}>
    <LinearGradient colors={['transparent','#c0c9a850','transparent']} style={{flex:1,borderRadius:120}}/>
   </Animated.View>
   {[0,1,2,3,4].map(n=><Animated.View key={n} style={{position:'absolute',left:`${12+n*18}%`,bottom:'18%',width:3,height:3,borderRadius:2,backgroundColor:'#d5b777',opacity:drift.interpolate({inputRange:[0,.5,1],outputRange:[0,.65,0]}),transform:[{translateY:drift.interpolate({inputRange:[0,1],outputRange:[20,-240-n*28]})}]}}/>)}
  </View>
  <NativeWildReveal style={{flex:1}} sceneKey={sceneKey}>{children}</NativeWildReveal>
 </View>;
}
export function NativeDenHero({compact=false,message}:{compact?:boolean;message?:{title:string;body:string}}){
 const {p,fonts,headingFamily,colors}=useNativeAppearance();
 if(!isGrizzly||p.grizzlyStyle==='clean')return null;
 const copy=message||{title:'Wake the grizzly.',body:'Your den. Your discipline. Your next strong day.'};
 if(p.grizzlyStyle==='og')return <View style={{backgroundColor:colors.white,borderWidth:1,borderColor:colors.line,borderRadius:20,overflow:'hidden'}}>
  <View style={{paddingHorizontal:20,paddingTop:16,height:compact?132:152,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8}}>
   <View style={{flex:1,gap:10}}><Text style={{color:colors.muted,fontFamily:fonts?'Inter':undefined,fontSize:12*p.textSize/100,lineHeight:18*p.textSize/100,letterSpacing:1.6,fontWeight:'700'}}>ORIGINAL INSTINCT.</Text><View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={{flexDirection:'row',gap:7,height:32}}>{[0,1,2].map(n=><View key={n} style={{width:3,height:28-n*3,borderRadius:2,backgroundColor:p.contrast?colors.ink:colors.effect,transform:[{rotate:'24deg'}]}}/>)}</View></View>
   <NativeOGBear size={compact?116:140}/>
  </View>
  <View style={{padding:20,paddingTop:4,gap:10}}><Text accessibilityRole="header" style={{fontFamily:fonts?headingFamily:undefined,fontWeight:fonts?'400':'700',color:colors.ink,fontSize:(compact?28:34)*p.textSize/100,lineHeight:(compact?36:44)*p.textSize/100}}>{copy.title}</Text>{!compact&&<Text style={{fontFamily:fonts?'Inter':undefined,color:colors.muted,fontSize:15*p.textSize/100,lineHeight:23*p.textSize/100}}>{copy.body}</Text>}<View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={{height:2,backgroundColor:colors.line,marginTop:8}}><View style={{width:48,height:2,backgroundColor:p.contrast?colors.ink:colors.effect}}/></View></View>
 </View>;
 return <View style={{backgroundColor:'#0d2116',borderWidth:1,borderColor:'#aa915e',borderTopWidth:4,borderTopColor:'#d6b77c',borderRadius:5,overflow:'hidden'}}>
  <View style={{height:compact?168:230}} accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none">
   <Image source={heroArt} resizeMode="cover" style={StyleSheet.absoluteFill} accessible={false}/>
   <LinearGradient colors={['#05120a00','#0d211611','#0d2116']} locations={[0,.5,1]} style={StyleSheet.absoluteFill}/>
   <Text style={{position:'absolute',top:18,left:18,right:18,color:'#f1dfb4',fontSize:11,letterSpacing:2,fontWeight:'700',textShadowColor:'#000',textShadowOffset:{width:1,height:2},textShadowRadius:3}}>GRIZZLY TERRITORY</Text>
  </View>
  <View style={{paddingHorizontal:20,paddingBottom:20,gap:8}}>
   <Text accessibilityRole="header" style={{fontFamily:fonts?headingFamily:undefined,fontWeight:fonts?'400':'700',color:'#f4e4bf',fontSize:(compact?30:40)*p.textSize/100,lineHeight:(compact?38:48)*p.textSize/100}}>{copy.title}</Text>
   {!compact&&<Text style={{fontFamily:fonts?'Inter':undefined,color:'#d0d8c2',fontSize:15*p.textSize/100,lineHeight:23*p.textSize/100}}>{copy.body}</Text>}
   <View style={{height:3,backgroundColor:'#b99b6144',marginTop:8,flexDirection:'row',gap:5}}>{[0,1,2,3,4].map(n=><View key={n} style={{width:16,height:3,backgroundColor:'#d6b77c',transform:[{skewX:'-25deg'}]}}/>)}</View>
  </View>
 </View>;
}
