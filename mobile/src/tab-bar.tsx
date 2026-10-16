import React,{useEffect,useRef,useState} from 'react';
import {ScrollView,Text,View,useWindowDimensions,type ViewStyle} from 'react-native';
import {GrizzlyPressable} from './wild-interactions';
import {useNativeAppearance} from './appearance';
const tabs=['Today','Plan','Library','History','Settings'] as const;
type Tab=typeof tabs[number];
function TabIcon({tab,color}:{tab:Tab;color:string}){
 const line:ViewStyle={position:'absolute',backgroundColor:color,borderRadius:2};
 return <View accessible={false} importantForAccessibility="no-hide-descendants" style={{width:24,height:24}}>
  {tab==='Today'?<><View style={{position:'absolute',left:3,top:3,width:18,height:18,borderRadius:9,borderWidth:2,borderColor:color}}/><View style={[line,{left:9,top:9,width:6,height:6,borderRadius:3}]}/></>:
   tab==='Plan'?<>{[5,11,17].map(y=><React.Fragment key={y}><View style={[line,{left:2,top:y,width:3,height:3}]}/><View style={[line,{left:8,top:y,width:14,height:2}]}/></React.Fragment>)}</>:
   tab==='Library'?<><View style={{position:'absolute',left:2,top:4,width:20,height:17,borderWidth:2,borderColor:color,borderRadius:3}}/><View style={[line,{left:11,top:5,width:2,height:15}]}/></>:
   tab==='History'?<><View style={{position:'absolute',left:2,top:2,width:20,height:20,borderRadius:10,borderWidth:2,borderColor:color}}/><View style={[line,{left:11,top:6,width:2,height:7}]}/><View style={[line,{left:11,top:11,width:6,height:2}]}/></>:
   <>{[5,12,19].map((x,n)=><React.Fragment key={x}><View style={[line,{left:x,top:3,width:2,height:18}]}/><View style={[line,{left:x-3,top:n===1?13:7,width:8,height:4}]}/></React.Fragment>)}</>}
 </View>;
}
/** Five destinations stay visible at ordinary text sizes. Enlarged labels retain
 * their full names in a bounded, selected-tab-following horizontal surface. */
export function NativeTabBar({selected,onSelect}:{selected:Tab;onSelect:(tab:Tab)=>void}){
 const {colors:c,p,fonts}=useNativeAppearance(),viewport=useWindowDimensions(),scroll=useRef<ScrollView>(null);
 const [available,setAvailable]=useState(viewport.width);
 const width=Math.max(available,16+tabs.length*58*p.textSize/100*viewport.fontScale),cell=(width-16)/tabs.length,overflow=width>available+1;
 useEffect(()=>{const index=tabs.indexOf(selected);scroll.current?.scrollTo({x:Math.max(0,(index+1)*cell+8-available),animated:false})},[selected,cell,available]);
 return <View onLayout={event=>{const next=event.nativeEvent.layout.width;if(next>0)setAvailable(next)}} style={{flexShrink:0,backgroundColor:c.white,borderTopWidth:1,borderTopColor:c.line}}>
  <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator={overflow} keyboardShouldPersistTaps="handled" style={{flexGrow:0,flexShrink:0}}>
   <View accessibilityRole="tablist" accessibilityLabel="Main navigation" style={{width,flexDirection:'row',paddingHorizontal:8,paddingTop:7,paddingBottom:6}}>
    {tabs.map(tab=>{const active=selected===tab,color=active?c.green:c.muted;return <GrizzlyPressable key={tab} accessibilityRole="tab" accessibilityLabel={tab} accessibilityState={{selected:active}} onPress={()=>onSelect(tab)} style={{width:cell,minHeight:60,paddingVertical:6,paddingHorizontal:2,alignItems:'center',justifyContent:'center',gap:5,borderRadius:14,backgroundColor:active?c.pale:undefined}}>
     <TabIcon tab={tab} color={color}/>
     <Text accessible={false} style={{fontSize:14*p.textSize/100,lineHeight:19*p.textSize/100,fontFamily:fonts?'Inter':undefined,color,fontWeight:active?'700':'500',textAlign:'center'}}>{tab}</Text>
    </GrizzlyPressable>})}
   </View>
  </ScrollView>
 </View>;
}
