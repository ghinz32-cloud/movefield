import React,{useState} from 'react';
import {Text,TextInput,View} from 'react-native';
import {GrizzlyPressable as Pressable} from './wild-interactions';
import {useNativeAppearance} from './appearance';
import {NativeNumericInput} from './numeric-input';
import {SET_METRIC_FIELDS} from './shared/set-metric-fields';
import {type SetMetrics} from './shared/training';
export function NativeSetMetrics({name,set,value={},onChange,disabled=false}:{name:string;set:number;value?:SetMetrics;onChange:(metrics:SetMetrics)=>void;disabled?:boolean}){
 const {colors:c,p}=useNativeAppearance(),[open,setOpen]=useState(false);
 const patch=(key:string,next:number|string|undefined)=>{const metrics={...value,[key]:next};if(next===undefined)delete metrics[key as keyof SetMetrics];onChange(metrics)};
 const text={fontSize:16*p.textSize/100,lineHeight:24*p.textSize/100,color:c.ink};
 const input={...text,minHeight:48,borderWidth:1,borderColor:c.line,padding:12};
 return <View style={{gap:8}}><Pressable accessibilityRole="button" accessibilityState={{expanded:open}} onPress={()=>setOpen(!open)} style={{minHeight:48,padding:12}}><Text style={text}>Set {set}: optional measurements and notes {open?'−':'+'}</Text></Pressable>{open&&<><Text style={text}>These actual measurements stay in history. Assistance is separate from lifted weight; they do not change your plan.</Text>{SET_METRIC_FIELDS.map(field=><View key={field.key}><Text style={text}>{field.label}</Text><NativeNumericInput accessibilityLabel={`${name} set ${set} ${field.label}`} style={input} editable={!disabled} value={value[field.key]??null} min={'min' in field?field.min:0} max={field.max} onValueChange={amount=>patch(field.key,amount??undefined)}/></View>)}<Text style={text}>Tempo</Text><TextInput accessibilityLabel={`${name} set ${set} tempo`} style={input} maxLength={100} editable={!disabled} value={value.tempo||''} onChangeText={text=>patch('tempo',text||undefined)}/><Text style={text}>Side</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{['Not recorded','Both','Left','Right','Alternating'].map(side=><Pressable key={side} accessibilityRole="button" accessibilityState={{selected:(value.side||'Not recorded')===side,disabled}} disabled={disabled} onPress={()=>patch('side',side==='Not recorded'?undefined:side)} style={{minHeight:48,padding:12,borderWidth:1,borderColor:c.line}}><Text style={text}>{side}</Text></Pressable>)}</View><Text style={text}>Notes</Text><TextInput accessibilityLabel={`${name} set ${set} notes`} multiline style={input} maxLength={6000} editable={!disabled} value={value.notes||''} onChangeText={text=>patch('notes',text||undefined)}/></>}</View>
}
