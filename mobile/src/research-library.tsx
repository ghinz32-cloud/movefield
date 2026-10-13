import React,{useMemo,useState} from 'react';
import {FlatList,Linking,Modal,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import data from '../assets/content/fitness-research.json';
import {searchResearch,type ResearchArchive} from './shared/research-library';
import {useNativeAppearance,useThemedStyles} from './appearance';
const archive=data as unknown as ResearchArchive;
export function NativeResearchLibrary({visible,close}:{visible:boolean;close:()=>void}){
 const styles=useThemedStyles(base),{colors,reduceMotion}=useNativeAppearance();
 const [query,setQuery]=useState(''),[topic,setTopic]=useState('All'),[recent,setRecent]=useState(false),[error,setError]=useState('');
 const found=useMemo(()=>searchResearch(archive.papers,query,topic,recent),[query,topic,recent]);
 return <Modal visible={visible} onRequestClose={close} animationType={reduceMotion?'none':'slide'} presentationStyle="pageSheet"><SafeAreaView style={styles.safe}>
 <View style={styles.header}><Text style={styles.title}>Research papers</Text><Pressable accessibilityRole="button" accessibilityLabel="Close research papers" onPress={close} style={styles.control}><Text style={styles.link}>Close</Text></Pressable></View>
 <FlatList data={found} keyExtractor={p=>p.id} initialNumToRender={10} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.list}
 ListHeaderComponent={<View style={styles.filters}><Text style={styles.small}>{archive.papers.length} indexed papers through {archive.cutoff}. Records are separate from reviewed plan guidance.</Text>
 <TextInput accessibilityLabel="Search research papers" placeholder="Title, author, DOI or study type" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} maxLength={200} style={styles.input} autoCapitalize="none" autoCorrect={false}/>
 <ScrollView horizontal contentContainerStyle={styles.topics}>{['All',...archive.queries.map(q=>q.topic)].map(t=><Pressable key={t} accessibilityRole="button" accessibilityState={{selected:topic===t}} onPress={()=>setTopic(t)} style={[styles.control,topic===t&&styles.selected]}><Text style={styles.text}>{t}</Text></Pressable>)}</ScrollView>
 <Pressable accessibilityRole="checkbox" accessibilityState={{checked:recent}} onPress={()=>setRecent(v=>!v)} style={styles.control}><Text style={styles.text}>{recent?'✓ ':''}2025–2026 first publications</Text></Pressable>
 <Text accessibilityLiveRegion="polite" style={styles.small}>{found.length} matching records{error?` · ${error}`:''}</Text></View>}
 ListEmptyComponent={<Text style={styles.text}>No records match. Try a shorter search or another topic.</Text>}
 renderItem={({item:p})=><View style={styles.record}><Pressable accessibilityRole="link" accessibilityLabel={`Open paper: ${p.title}`} style={styles.control} onPress={()=>{void Linking.openURL(p.url).catch(()=>setError('The paper link could not open.'))}}><Text style={styles.recordTitle}>{p.title}</Text></Pressable><Text style={styles.small}>{p.authors||'Authors not indexed'} · {p.year} · {p.journal}</Text><Text style={styles.small}>PMID {p.pmid} · {p.reviewLevel==='selected-abstract-reviewed'?'Selected abstract reviewed':'Search record; applicability review pending'}</Text>{p.screeningFlags.map(flag=><Text key={flag} style={styles.small}>{flag}</Text>)}</View>}/>
 </SafeAreaView></Modal>;
}
const base=StyleSheet.create({safe:{flex:1,backgroundColor:'#F6F5EF'},header:{paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},title:{fontSize:22,fontWeight:'700',color:'#19362D',flex:1},list:{padding:16,gap:12},filters:{gap:8,marginBottom:12},topics:{gap:6},control:{minHeight:44,paddingVertical:10,paddingHorizontal:8,justifyContent:'center'},selected:{backgroundColor:'#E6EDDD',borderRadius:10},link:{fontSize:15,fontWeight:'600',color:'#214D3A'},text:{fontSize:15,color:'#19362D'},small:{fontSize:13,lineHeight:19,color:'#66746B'},input:{minHeight:44,borderWidth:1,borderColor:'#DCE1D7',borderRadius:10,padding:10,color:'#19362D',fontSize:15},record:{padding:12,borderWidth:1,borderColor:'#DCE1D7',borderRadius:12,gap:6},recordTitle:{fontSize:16,fontWeight:'600',color:'#19362D'}});
