import React from 'react';
import {ScrollView,Text,TextInput,View} from 'react-native';
import {GrizzlyPressable} from './wild-interactions';
import {useNativeAppearance} from './appearance';

type SearchableProgram={name:string;days:number;description?:string;creator?:string;author?:string;scope?:string;equipment?:string;requirements?:string[]};
export function matchesProgram(program:SearchableProgram,query:string,days:number){
 const text=[program.name,program.description,program.creator,program.author,program.scope,program.equipment,...program.requirements||[]].filter(Boolean).join(' ').toLocaleLowerCase();
 return (!days||program.days===days)&&query.trim().toLocaleLowerCase().split(/\s+/).every(word=>text.includes(word));
}

/** Filter names/authors and frequency before constructing any sample workouts. */
export function NativeProgramFilters({query,days,onQuery,onDays,shown,total,onClear}:{query:string;days:number;onQuery:(value:string)=>void;onDays:(value:number)=>void;shown:number;total:number;onClear:()=>void}){
 const {colors:c,p,fonts}=useNativeAppearance(),text={fontSize:16*p.textSize/100,lineHeight:24*p.textSize/100,color:c.ink,fontFamily:fonts?'Inter':undefined};
 return <View style={{gap:8}}>
  <TextInput accessibilityLabel="Search plans and authors" placeholder="Find a plan or author…" placeholderTextColor={c.muted} value={query} onChangeText={onQuery} autoCapitalize="none" autoCorrect={false} clearButtonMode="while-editing" style={[text,{minHeight:48,padding:12,borderWidth:1,borderColor:c.line,borderRadius:12,backgroundColor:c.white}]}/>
  <ScrollView horizontal showsHorizontalScrollIndicator keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:8}}>{[0,2,3,4,5,6,7].map(value=><GrizzlyPressable key={value} accessibilityRole="button" accessibilityState={{selected:days===value}} accessibilityLabel={value?`Plans for ${value} days per week`:'Plans for any frequency'} onPress={()=>onDays(value)} style={{minHeight:48,padding:12,borderRadius:12,backgroundColor:days===value?c.green:c.pale,justifyContent:'center'}}><Text style={[text,{color:days===value?c.onAccent:c.ink}]}>{value?`${value} days`:'Any frequency'}</Text></GrizzlyPressable>)}</ScrollView>
  <Text accessibilityLiveRegion="polite" style={text}>{total?`Showing ${shown} of ${total} matching plans and references.`:'No plans match these filters. Try another training style, name or frequency.'}</Text>
  {(query!==''||days!==0)&&<GrizzlyPressable accessibilityRole="button" onPress={onClear} style={{minHeight:48,padding:12,justifyContent:'center'}}><Text style={[text,{color:c.green}]}>Clear plan filters</Text></GrizzlyPressable>}
 </View>;
}
