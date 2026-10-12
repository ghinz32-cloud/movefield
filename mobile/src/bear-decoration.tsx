import React from 'react';
import {View} from 'react-native';
import {isGrizzly} from './shared/brand';
import {useNativeAppearance} from './appearance';
export function NativeBearDecoration(){
 const {p,colors}=useNativeAppearance();if(!isGrizzly||p.grizzlyStyle!=='wild')return null;
 return <><View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={{position:'absolute',right:14,top:10,width:36,height:26,opacity:.35}}>{[0,1,2].map(n=><View key={n} style={{position:'absolute',left:5+n*10,top:1+n*2,width:3,height:24-n*2,backgroundColor:colors.from,transform:[{rotate:'24deg'}]}}/>)}</View><View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={{position:'absolute',bottom:-1,left:0,right:0,height:7,flexDirection:'row',justifyContent:'space-between'}}>{Array.from({length:14},(_,n)=><View key={n} style={{width:0,height:0,borderLeftWidth:7,borderRightWidth:7,borderBottomWidth:n%3===0?7:4,borderLeftColor:'transparent',borderRightColor:'transparent',borderBottomColor:colors.bg}}/>)}</View></>;
}
