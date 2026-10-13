import React from 'react';
import {View,Image} from 'react-native';
import {isGrizzly} from './shared/brand';
import {useNativeAppearance} from './appearance';
export function NativeBearDecoration(){
 const {p,colors}=useNativeAppearance();if(!isGrizzly||p.grizzlyStyle!=='wild')return null;
 return <><View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={{position:'absolute',right:14,top:10,width:56,height:36,opacity:.65}}>{[0,1,2].map(n=><View key={n} style={{position:'absolute',left:5+n*10,top:1+n*2,width:3,height:24-n*2,backgroundColor:p.grizzlyStyle==='wild'?'#c4aa76':colors.from,transform:[{rotate:'24deg'}]}}/>)}</View><View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={{position:'absolute',bottom:-1,left:0,right:0,height:7,flexDirection:'row',justifyContent:'space-between'}}>{Array.from({length:14},(_,n)=><View key={n} style={{width:0,height:0,borderLeftWidth:7,borderRightWidth:7,borderBottomWidth:n%3===0?7:4,borderLeftColor:'transparent',borderRightColor:'transparent',borderBottomColor:colors.bg}}/>)}</View></>;
}

export function NativeGrizzlyPaw(){
 const {p,colors}=useNativeAppearance();if(!isGrizzly)return null;
 return <View accessible={false} pointerEvents="none"><Image accessible={false} source={require('../assets/grizzly-paw.png')} style={{width:p.grizzlyStyle==='wild'?62:36,height:p.grizzlyStyle==='wild'?70:40,tintColor:colors.green,transform:[{rotate:'-12deg'}]}}/></View>;
}
