import React,{useEffect,useState} from 'react';
import {Animated,Easing,View} from 'react-native';
import {useNativeAppearance} from './appearance';

/** Decorative native shapes keep the original bear palette crisp at every scale. */
export function NativeOGBear({size=144}:{size?:number}){
 const {dark,colors,p,reduceMotion,active}=useNativeAppearance(),[breath]=useState(()=>new Animated.Value(0));
 const enabled=!reduceMotion&&!p.contrast&&active;
 useEffect(()=>{breath.stopAnimation();if(!enabled){breath.setValue(0);return}const loop=Animated.loop(Animated.sequence([Animated.timing(breath,{toValue:1,duration:3200,easing:Easing.inOut(Easing.sin),useNativeDriver:true,isInteraction:false}),Animated.timing(breath,{toValue:0,duration:3200,easing:Easing.inOut(Easing.sin),useNativeDriver:true,isInteraction:false})]));loop.start();return()=>{loop.stop();breath.stopAnimation()}},[breath,enabled]);
 const fur=dark?'#f5f5f5':'#151515',detail=dark?'#151515':'#f5f5f5';
 return <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={{width:size,height:size,overflow:'hidden'}}>
  <Animated.View style={{width:144,height:144,transform:[{scale:size/144},{translateY:breath.interpolate({inputRange:[0,1],outputRange:[1,-1]})}],transformOrigin:'top left'}}>
   <View style={{position:'absolute',left:9,bottom:-9,width:126,height:63,borderTopLeftRadius:62,borderTopRightRadius:62,backgroundColor:fur}}/>
   {[18,96].map(left=><View key={left} style={{position:'absolute',left,top:17,width:31,height:34,borderRadius:18,backgroundColor:fur,transform:[{rotate:left===18?'-14deg':'14deg'}]}}><View style={{position:'absolute',left:8,top:8,width:16,height:18,borderRadius:10,backgroundColor:detail}}/></View>)}
   <View style={{position:'absolute',left:27,top:24,width:91,height:90,borderTopLeftRadius:39,borderTopRightRadius:39,borderBottomLeftRadius:34,borderBottomRightRadius:34,backgroundColor:fur}}/>
   {[46,87].map(left=><View key={left} style={{position:'absolute',left,top:55,width:12,height:7,borderRadius:5,backgroundColor:detail,transform:[{rotate:left===46?'10deg':'-10deg'}]}}/>)}
   <View style={{position:'absolute',left:53,top:69,width:38,height:32,borderRadius:19,backgroundColor:detail}}/>
   <View style={{position:'absolute',left:62,top:72,width:20,height:11,borderTopLeftRadius:8,borderTopRightRadius:8,borderBottomLeftRadius:10,borderBottomRightRadius:10,backgroundColor:fur}}/>
   <View style={{position:'absolute',left:71,top:82,width:2,height:10,borderRadius:1,backgroundColor:fur}}/>
   <View style={{position:'absolute',left:62,top:89,width:20,height:4,borderBottomWidth:2,borderBottomColor:fur,borderBottomLeftRadius:9,borderBottomRightRadius:9}}/>
   {[0,1,2].map(n=><View key={n} style={{position:'absolute',left:57+n*11,top:119,width:3,height:19-n*2,borderRadius:2,backgroundColor:p.contrast?detail:colors.effect,transform:[{rotate:'24deg'}]}}/>)}
  </Animated.View>
 </View>;
}
