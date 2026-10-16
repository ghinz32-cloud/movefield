import React,{useState} from 'react';
import {Text,View} from 'react-native';
import {GrizzlyPressable as Pressable} from './wild-interactions';
import {equipmentChoices,defaultInventory,type EquipmentInventory} from './shared/equipment';
import type {Profile} from './shared/training';
import {useNativeAppearance} from './appearance';

/** Focused sections reuse the same inventory and confirmation rules as the full
 * survey. Editing anything always invalidates the previous confirmation. */
export function NativeEquipmentSurvey({profile,onChange,section='all'}:{profile:Profile;onChange:(v:EquipmentInventory)=>void;section?:'all'|'dumbbells'|'equipment'}){
 const v=profile.inventory||defaultInventory(profile.equipment),{colors:c,p,fonts}=useNativeAppearance();
 const [open,setOpen]=useState(''),[page,setPage]=useState(0),[bulk,setBulk]=useState(false);
 const edit=(patch:Partial<EquipmentInventory>)=>onChange({...v,...patch,confirmed:false});
 const text={fontFamily:fonts?'Inter':undefined,fontSize:16*p.textSize/100,lineHeight:24*p.textSize/100,color:c.ink};
 const button=(label:string,selected:boolean|undefined,onPress:()=>void,disabled=false)=><Pressable key={label} accessibilityRole="button" accessibilityState={{selected,disabled}} disabled={disabled} onPress={onPress} style={{minHeight:52,borderWidth:1,borderColor:c.green,borderRadius:12,padding:14,opacity:disabled?.5:1,backgroundColor:selected?c.green:c.white}}><Text style={[text,{color:selected?c.onAccent:c.ink}]}>{label}</Text></Pressable>;
 const groups=[...new Set(equipmentChoices.map(x=>x[2]))];
 const groupItems=equipmentChoices.filter(x=>x[2]===open),pages=Math.ceil(groupItems.length/6);
 return <View style={{gap:14}}>
  {section!=='equipment'&&<>
   <Text style={text}>Dumbbells available</Text>
   {([['none','None'],['single','One dumbbell'],['pair','Two equal dumbbells / matching pairs']] as const).map(([id,label])=>button(label,v.dumbbells===id,()=>edit({dumbbells:id})))}
   {v.dumbbells!=='none'&&<>
    <Text style={text}>Can you change the weight?</Text>
    {button('Fixed weight — no heavier option',v.dumbbellLoading==='fixed',()=>edit({dumbbellLoading:'fixed'}))}
    {button('Adjustable or a range of weights',v.dumbbellLoading==='adjustable',()=>edit({dumbbellLoading:'adjustable'}))}
   </>}
  </>}
  {section!=='dumbbells'&&<>
   {!open?<>
    <Text style={text}>Check each group, remove unavailable items, then confirm your list.</Text>
    {groups.map(group=>button(`${group} · ${equipmentChoices.filter(x=>x[2]===group&&v.items.includes(x[0])).length} selected`,undefined,()=>{setOpen(group);setPage(0)}))}
    {button(v.confirmed?'Equipment list confirmed':'Confirm this equipment list',v.confirmed,()=>onChange({...v,confirmed:!v.confirmed}))}
    <Text style={text}>{v.confirmed?'This is the equipment you can reliably use here.':'Presets are suggestions. Confirm only equipment you can reliably use here.'}</Text>
    {button(bulk?'Hide list shortcuts':'Equipment list shortcuts',undefined,()=>setBulk(!bulk))}
    {bulk&&<>
     {button('Select all equipment',false,()=>onChange({...defaultInventory(),confirmed:false}))}
     {button('Clear equipment',false,()=>edit({items:[],dumbbells:'none'}))}
    </>}
   </>:<>
    {button('Back to equipment groups',undefined,()=>setOpen(''))}
    <Text accessibilityRole="header" style={[text,{fontWeight:'700'}]}>{open}{pages>1?` · page ${page+1} of ${pages}`:''}</Text>
    {groupItems.slice(page*6,page*6+6).map(([key,label])=>button(label,v.items.includes(key),()=>edit({items:v.items.includes(key)?v.items.filter(x=>x!==key):[...v.items,key]})))}
    {pages>1&&<View style={{gap:10}}>
     {button('Previous equipment',undefined,()=>setPage(page-1),page===0)}
     {button('More equipment',undefined,()=>setPage(page+1),page>=pages-1)}
    </View>}
   </>}
  </>}
 </View>;
}
