import React,{useEffect,useRef} from 'react';
import {ScrollView,Text,View,useWindowDimensions} from 'react-native';
import {GrizzlyPressable} from './wild-interactions';
import {useNativeAppearance} from './appearance';
const tabs=['Today','Plan','Library','History','Settings'] as const;
type Tab=typeof tabs[number];
/** Preserve readable labels at larger phone text sizes inside a bounded scroll surface. */
export function NativeTabBar({selected,onSelect}:{selected:Tab;onSelect:(tab:Tab)=>void}){
 const {colors:c,p,fonts}=useNativeAppearance(),viewport=useWindowDimensions(),scroll=useRef<ScrollView>(null);
 const width=Math.max(viewport.width,20+tabs.length*60*p.textSize/100*viewport.fontScale),cell=(width-20)/tabs.length;
 useEffect(()=>{const index=tabs.indexOf(selected);scroll.current?.scrollTo({x:Math.max(0,(index+1)*cell+10-viewport.width),animated:false})},[selected,cell,viewport.width]);
 return <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator style={{flexGrow:0,flexShrink:0,backgroundColor:c.white}}><View accessibilityRole="tablist" accessibilityLabel="Main navigation" style={{width,flexDirection:'row',borderTopWidth:1,borderTopColor:c.line,paddingHorizontal:10,paddingTop:6,paddingBottom:4}}>{tabs.map((tab,index)=><GrizzlyPressable key={tab} accessibilityRole="tab" accessibilityLabel={tab} accessibilityState={{selected:selected===tab}} onPress={()=>onSelect(tab)} style={{width:cell,minHeight:55,alignItems:'center',justifyContent:'center',gap:3,borderRadius:13,backgroundColor:selected===tab?c.pale:undefined}}><Text accessible={false} style={{fontSize:21*p.textSize/100,color:selected===tab?c.green:c.muted}}>{['◉','▤','⌕','◷','⚙'][index]}</Text><Text style={{fontSize:14*p.textSize/100,fontFamily:fonts?'Inter':undefined,color:selected===tab?c.green:c.muted,fontWeight:selected===tab?'800':undefined,textAlign:'center'}}>{tab}</Text></GrizzlyPressable>)}</View></ScrollView>;
}
