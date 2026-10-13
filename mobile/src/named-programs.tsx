import React,{useState} from 'react';
import {Linking,Pressable,Text,TextInput,View,StyleSheet} from 'react-native';
import {useNativeAppearance,useThemedStyles} from './appearance';
import {programReferences,referenceMatchesGoal,referenceEquipment} from './shared/program-catalog';
import {referenceOption,type PlanOption} from './shared/onboarding';
import type {Profile,Event} from './shared/training';

const baseStyles=StyleSheet.create({body:{fontSize:15,lineHeight:22,color:'#19362D'},title:{fontSize:20,fontWeight:'700',color:'#19362D'},card:{borderWidth:1,borderColor:'#DCE1D7',borderRadius:12,padding:12,gap:10},button:{minHeight:48,padding:12,borderWidth:1,borderColor:'#214D3A',borderRadius:8,justifyContent:'center'}});
export function NamedPrograms({profile,events,selectedId,onSelect}:{profile:Profile;events:Event[];selectedId?:string;onSelect:(o:PlanOption)=>void}){
 const styles=useThemedStyles(baseStyles),{colors}=useNativeAppearance(),[open,setOpen]=useState(false),[details,setDetails]=useState<string|null>(null),[error,setError]=useState(''),[query,setQuery]=useState(''),[more,setMore]=useState(false);
 const references=programReferences.filter(r=>referenceMatchesGoal(r,profile.goal));
 const matches=references.filter(r=>`${r.name} ${r.author} ${referenceEquipment(r)} ${r.days}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a,b)=>Number(!!b.workouts)-Number(!!a.workouts));
 if(!references.length)return null;
 const button=(label:string,press:()=>void,selected=false)=><Pressable accessibilityRole="button" accessibilityState={{selected}} onPress={press} style={[styles.button,selected&&{backgroundColor:colors.green}]}><Text style={[styles.body,selected&&{color:colors.onAccent}]}>{label}</Text></Pressable>;
 return <View style={{gap:12}}>{button(open?'Hide named programs':`Named programs · ${references.length} choices`,()=>setOpen(!open))}
  {open&&<><Text style={styles.body}>Prefilled templates use manual loads and progression. Source calendars need targets from your own copy. Source review does not establish clinical validation or individual suitability.</Text>
   <TextInput accessibilityLabel="Find a named program" value={query} maxLength={100} placeholder="Name, author, equipment or days" placeholderTextColor={colors.muted} onChangeText={v=>{setQuery(v);setMore(false)}} style={[styles.button,styles.body]}/>
   {!matches.length&&<Text accessibilityLiveRegion="polite" style={styles.body}>No named programs match this search for your goal.</Text>}
   {matches.filter((r,i)=>more||i<3||r.id===selectedId).map(r=><View key={r.id} style={styles.card}><Text style={styles.title}>{r.name}</Text><Text style={styles.body}>{r.author} · {r.days} days/week · {r.weeks?r.weeks+' weeks':'ongoing'}</Text><Text style={styles.body}>{r.workouts?'Prefilled · manual progression':'Source copy · enter targets'}</Text><Text style={styles.body}>{r.description}</Text>
    {button(details===r.id?'Hide equipment and scope':'Equipment, scope and progression',()=>setDetails(details===r.id?null:r.id))}
    {details===r.id&&<><Text style={styles.body}>{r.experience} · {referenceEquipment(r)} · checked {r.checked}</Text>{r.requirements?.map(n=><Text key={n} style={styles.body}>Required: {n}</Text>)}{r.scope?.map(n=><Text key={n} style={styles.body}>{n}</Text>)}<Text style={styles.body}>{r.progression||'Enter targets and progression from your source copy.'}</Text></>}
    {button('View original program',()=>{void Linking.openURL(r.url).catch(()=>setError('The source link could not be opened. Try again.'))})}
    {button(selectedId===r.id?'Selected':r.workouts?'Review this template':'Track my source copy',()=>onSelect(referenceOption(profile,events,r.id)),selectedId===r.id)}
   </View>)}
   {matches.length>3&&button(more?'Show fewer named programs':`See all ${matches.length} matches`,()=>setMore(!more))}
  </>}{!!error&&<Text accessibilityRole="alert" style={styles.body}>{error}</Text>}
 </View>;
}
