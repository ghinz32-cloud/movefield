import React,{useState} from 'react';
import {Text,View} from 'react-native';
import {GrizzlyPressable as Pressable} from './wild-interactions';
import {equipmentChoices,defaultInventory,type EquipmentInventory} from './shared/equipment';
import type {Profile} from './shared/training';
import {useNativeAppearance} from './appearance';
export function NativeEquipmentSurvey({profile,onChange}:{profile:Profile;onChange:(v:EquipmentInventory)=>void}){
 const v=profile.inventory||defaultInventory(profile.equipment),{colors:c}=useNativeAppearance(),[open,setOpen]=useState<string>('Basics');
 const edit=(patch:Partial<EquipmentInventory>)=>onChange({...v,...patch,confirmed:false});
 const button=(label:string,selected:boolean,onPress:()=>void)=><Pressable key={label} accessibilityRole="button" accessibilityState={{selected}} onPress={onPress} style={{minHeight:48,borderWidth:1,borderColor:c.green,borderRadius:8,padding:12,backgroundColor:selected?c.green:c.bg}}><Text style={{fontSize:16,lineHeight:24,color:selected?c.onAccent:c.ink}}>{label}</Text></Pressable>;
 return <View style={{gap:12}}><Text style={{fontSize:20,color:c.ink}}>What can you actually use?</Text><Text style={{fontSize:16,lineHeight:24,color:c.ink}}>All equipment starts selected. Remove what is unavailable, then confirm this location.</Text>
 <View style={{gap:8}}>{button('Select all equipment',false,()=>onChange({...defaultInventory(),confirmed:false}))}{button('Clear equipment',false,()=>edit({items:[],dumbbells:'none'}))}</View><Text style={{fontSize:16,color:c.ink}}>Dumbbells available</Text>{([['none','None'],['single','One dumbbell'],['pair','Two equal dumbbells / matching pairs']] as const).map(([id,label])=>button(label,v.dumbbells===id,()=>edit({dumbbells:id})))}
 {v.dumbbells!=='none'&&<>{button('Fixed weight — no heavier option',v.dumbbellLoading==='fixed',()=>edit({dumbbellLoading:'fixed'}))}{button('Adjustable or a range of weights',v.dumbbellLoading==='adjustable',()=>edit({dumbbellLoading:'adjustable'}))}</>}
 {[...new Set(equipmentChoices.map(x=>x[2]))].map(group=><View key={group} style={{gap:8}}>{button(`${group} · ${equipmentChoices.filter(x=>x[2]===group&&v.items.includes(x[0])).length} selected`,open===group,()=>setOpen(open===group?'':group))}{open===group&&equipmentChoices.filter(x=>x[2]===group).map(([key,label])=>button(label,v.items.includes(key),()=>edit({items:v.items.includes(key)?v.items.filter(x=>x!==key):[...v.items,key]})))}</View>)}
 {button('This list matches equipment I can reliably use here',v.confirmed,()=>onChange({...v,confirmed:!v.confirmed}))}</View>;
}
