import React,{forwardRef,useEffect,useRef,useState} from 'react';
import {Animated,Easing,Pressable,StyleSheet,View,type PressableProps,type ViewStyle} from 'react-native';
import {isGrizzly} from './shared/brand';
import {useNativeAppearance} from './appearance';

type PressableRef=React.ElementRef<typeof Pressable>;
const styles=StyleSheet.create({ring:{position:'absolute',left:'50%',top:'50%',marginLeft:-35,marginTop:-35,width:70,height:70,borderRadius:38,borderWidth:3,borderColor:'#e8c68a'},claw:{position:'absolute',left:'50%',top:'50%',width:3,height:78,marginTop:-40,backgroundColor:'#e5c182',borderRadius:2},paw:{position:'absolute',left:'50%',top:'50%',marginLeft:-17,marginTop:-11,width:34,height:28,borderRadius:16,backgroundColor:'#c5a56d'}});

function WildButton({forwardedRef,children,style,onPress,onPressIn,onPressOut,...props}:PressableProps&{forwardedRef:React.ForwardedRef<PressableRef>}){
 const {reduceMotion,p,active}=useNativeAppearance(),enabled=!reduceMotion&&!p.contrast&&active&&!props.disabled&&!props.accessibilityState?.disabled;
 const [pulse]=useState(()=>new Animated.Value(0)),[burst,setBurst]=useState(false),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;pulse.stopAnimation()}},[pulse]);
 useEffect(()=>{if(!enabled){pulse.stopAnimation();pulse.setValue(1)}},[enabled,pulse]);
 const strike=()=>{if(!enabled)return;pulse.stopAnimation();pulse.setValue(0);setBurst(true);Animated.timing(pulse,{toValue:1,duration:680,easing:Easing.out(Easing.cubic),useNativeDriver:true,isInteraction:false}).start(({finished})=>{if(finished&&mounted.current)setBurst(false)})};
 return <Pressable {...props} ref={forwardedRef} onPressIn={onPressIn} onPressOut={onPressOut} onPress={event=>{strike();onPress?.(event)}} style={state=>{
  const base=typeof style==='function'?style(state):style;
  const original=(StyleSheet.flatten(base) as ViewStyle|undefined)?.transform;
  const pressed:ViewStyle={transform:typeof original==='string'?original+' scale(0.94) rotate(-1deg)':[...(original||[]),{scale:.94},{rotate:'-1deg'}]};
  return [base,enabled&&state.pressed?pressed:null];
 }}>{state=><>{typeof children==='function'?children(state):children}{enabled&&burst&&<View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
  <Animated.View style={[styles.ring,{opacity:pulse.interpolate({inputRange:[0,.15,1],outputRange:[0,.7,0]}),transform:[{scale:pulse.interpolate({inputRange:[0,1],outputRange:[.45,2.2]})}]}]}/>
  <Animated.View style={[styles.paw,{opacity:pulse.interpolate({inputRange:[0,.2,1],outputRange:[0,.3,0]}),transform:[{scale:pulse.interpolate({inputRange:[0,1],outputRange:[.6,1.4]})},{rotate:'-15deg'}]}]}/>
  {[0,1,2,3,4].map(n=><Animated.View key={n} style={[styles.claw,{marginLeft:-24+n*12,opacity:pulse.interpolate({inputRange:[0,.13,.55,1],outputRange:[0,.8,.4,0]}),transform:[{rotate:'24deg'},{scaleY:pulse.interpolate({inputRange:[0,.35,1],outputRange:[.05,1.15,1]})},{translateY:pulse.interpolate({inputRange:[0,1],outputRange:[-20,15]})}]}]}/>)}
  {[0,1,2,3,4,5].map(n=><Animated.View key={'leaf'+n} style={{position:'absolute',left:'50%',top:'50%',width:n%2?4:7,height:n%2?4:12,borderRadius:n%2?2:4,backgroundColor:n%2?'#eac17b':'#a7b875',opacity:pulse.interpolate({inputRange:[0,.15,1],outputRange:[0,.85,0]}),transform:[{translateX:pulse.interpolate({inputRange:[0,1],outputRange:[0,Math.cos(n*Math.PI/3)*62]})},{translateY:pulse.interpolate({inputRange:[0,1],outputRange:[0,Math.sin(n*Math.PI/3)*40-12]})},{rotate:pulse.interpolate({inputRange:[0,1],outputRange:['0deg',`${n*50-100}deg`]})}]}}/>)}
 </View>}</>}</Pressable>;
}
/** Clean/Movefield uses the original primitive. All callbacks and roles remain intact. */
export const GrizzlyPressable=forwardRef<PressableRef,PressableProps>(function GrizzlyPressable(props,ref){
 const {p}=useNativeAppearance();return isGrizzly&&p.grizzlyStyle==='wild'?<WildButton {...props} forwardedRef={ref}/>:<Pressable {...props} ref={ref}/>;
});

export function NativeWildReveal({children,sceneKey,style}:{children:React.ReactNode;sceneKey?:string;style?:ViewStyle}){
 const {p,reduceMotion,active}=useNativeAppearance(),[value]=useState(()=>new Animated.Value(1));
 const enabled=isGrizzly&&p.grizzlyStyle==='wild'&&!p.contrast&&!reduceMotion&&active;
 useEffect(()=>{value.stopAnimation();if(!enabled){value.setValue(1);return}value.setValue(0);Animated.timing(value,{toValue:1,duration:540,easing:Easing.out(Easing.back(1.2)),useNativeDriver:true,isInteraction:false}).start();return()=>value.stopAnimation()},[value,enabled,sceneKey]);
 return <Animated.View style={[style,{opacity:value.interpolate({inputRange:[0,.3,1],outputRange:[0,1,1],extrapolate:'clamp'}),transform:[{translateY:value.interpolate({inputRange:[0,1],outputRange:[22,0]})},{rotate:value.interpolate({inputRange:[0,1],outputRange:['-.6deg','0deg']})}]}]}>{children}</Animated.View>;
}
