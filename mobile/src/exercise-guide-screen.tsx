import React,{useCallback,useEffect,useState,type ReactNode} from 'react';
import {Text,View,type TextStyle} from 'react-native';
import {useNativeAppearance} from './appearance';
import {safeWebUrl,type Guide} from './content';
import {NativeActionFooter,NativeFlowScreen,NativeSection,NativeSettingsRow} from './phone-ui';
import {GrizzlyPressable as Pressable} from './wild-interactions';
import type {Exercise} from './shared/training';

type ExerciseMedia=(typeof import('./content').media)[string];
type Page='overview'|'steps'|'equipment'|'sources'|'terms';
export type NativeExerciseGuideScreenProps={
 exercise:Exercise;
 guide?:Guide;
 media?:ExerciseMedia;
 equipmentSettings?:ReactNode;
 onOpenUrl:(url:string)=>void;
 linkError?:string;
 onRegisterBack?:(handler:(()=>boolean)|null)=>void;
};

/** Presentation only. Guide text, equipment changes and external-link handling
 * remain owned by their existing content and App boundaries. Mount without an
 * outer ScrollView: NativeFlowScreen supplies the one scrolling body. */
export function NativeExerciseGuideScreen(props:NativeExerciseGuideScreenProps){
 return <ExerciseGuidePages key={props.exercise.id} {...props}/>;
}

function ExerciseGuidePages({exercise,guide,media,equipmentSettings,onOpenUrl,linkError,onRegisterBack}:NativeExerciseGuideScreenProps){
 const {colors:c,p,fonts}=useNativeAppearance();
 const [page,setPage]=useState<Page>('overview'),[step,setStep]=useState(0),[equipmentVisited,setEquipmentVisited]=useState(false);
 const back=useCallback(()=>{
  if(page==='overview')return false;
  if(page==='steps'&&step>0)setStep(step-1);
  else setPage(page==='terms'?'sources':'overview');
  return true;
 },[page,step]);
 useEffect(()=>{onRegisterBack?.(back);return()=>onRegisterBack?.(null)},[back,onRegisterBack]);

 const scale=p.textSize/100;
 const text:TextStyle={color:c.ink,fontFamily:fonts?'Inter':undefined,fontSize:16*scale,lineHeight:24*scale};
 const small:TextStyle={...text,color:c.muted,fontSize:14*scale,lineHeight:21*scale};
 const steps=guide?[
  {title:'Equipment',lines:guide.equipment},
  {title:'Set up',lines:guide.setup},
  {title:'Perform the movement',lines:guide.execution},
  {title:'Finish safely',lines:guide.finish},
  {title:'Breathing',lines:guide.breathing},
  {title:'Common errors & fixes',lines:guide.commonErrors},
  {title:'Make it easier',lines:guide.easierOption?[guide.easierOption]:[]},
 ]:[];
 const currentStep=Math.min(step,Math.max(0,steps.length-1));
 const current=steps[currentStep];
 const loadConvention=guide?.loadConvention??exercise.loadConvention??'Record the actual amount; no automatic load progression is configured.';
 const sourceNote=guide?.sourceNote??'These cues have not been independently reviewed by a trainer.';
 const capability=guide?.capability??'Instruction only; the app cannot assess your form.';
 const cues=guide?.quickCues??exercise.cues;
 const numbered=(lines:string[])=>lines.length?lines.map((line,index)=><Text key={index} style={text}>{index+1}. {line}</Text>):<Text style={small}>No instructions are recorded for this section.</Text>;
 const toOverview=()=>setPage('overview');
 const openEquipment=()=>{setEquipmentVisited(true);setPage('equipment')};
 const footer=(label:string,onPress:()=>void)=><NativeActionFooter primary={{label,onPress}}/>;
 const links:{label:string;url:string}[]=[];
 const addLink=(label:string,raw?:string|null)=>{
  const url=safeWebUrl(raw);
  if(url&&!links.some(link=>link.url===url))links.push({label,url});
 };
 addLink('Open video reference',media?.videoUrl);
 addLink('Open form reference',media?.sourceUrl);
 for(const url of guide?.sourceURLs??[])addLink(`Source ${links.length+1}`,url);
 addLink('Exercise source',exercise.source);
 const open=(url:string)=>{const safe=safeWebUrl(url);if(safe)onOpenUrl(safe)};
 let title=exercise.name,subtitle=`${exercise.equipment} · ${exercise.pattern}`,body:ReactNode,action:ReactNode;

 if(page==='steps'&&current){
  title=current.title;subtitle=`${exercise.name} · Step ${currentStep+1} of ${steps.length}`;
  body=<View style={{gap:16}}>{numbered(current.lines)}</View>;
  action=currentStep<steps.length-1?footer('Next section',()=>setStep(currentStep+1)):footer('Back to overview',toOverview);
 }else if(page==='equipment'){
  title='Equipment & logging';subtitle=exercise.name;
  body=<>
   <NativeSection title="How to log it"><Text style={text}>{loadConvention}</Text></NativeSection>
  </>;
  action=footer('Back to guide',toOverview);
 }else if(page==='sources'){
  title='Sources & details';subtitle=exercise.name;
  body=<>
   <Text style={text}>{sourceNote}</Text>
   <Text style={text}>{capability}</Text>
   {!!media?.referenceScope&&<Text style={text}>Reference: {media.referenceScope}. Follow this variation’s written steps.</Text>}
   {!!media?.verification&&<Text style={small}>{media.verification}</Text>}
   {!!guide?.reviewedAt&&<Text style={small}>Recorded review date: {guide.reviewedAt}</Text>}
   {!!guide?.terms?.length&&<NativeSettingsRow label="Workout terms" onPress={()=>setPage('terms')}/>}
   {links.map(link=><Pressable key={link.url} accessibilityRole="link" accessibilityLabel={`${link.label}. ${link.url}`} onPress={()=>open(link.url)} style={{minHeight:48,padding:14,gap:6,borderWidth:1,borderColor:c.line,borderRadius:12,backgroundColor:c.white}}>
    <Text style={[text,{color:c.green,fontWeight:'600'}]}>{link.label} ↗</Text>
    <Text style={[small,{flexShrink:1}]}>{link.url}</Text>
   </Pressable>)}
   {!links.length&&<Text style={small}>No web reference is available for this exercise.</Text>}
  </>;
  action=footer('Back to guide',toOverview);
 }else if(page==='terms'){
  title='Workout terms';subtitle=exercise.name;
  body=<View style={{gap:16}}>{guide?.terms?.map((item,index)=><View key={index} style={{gap:4}}><Text accessibilityRole="header" style={[text,{fontWeight:'700'}]}>{item.term}</Text><Text style={text}>{item.meaning}</Text></View>)}</View>;
  action=footer('Back to sources',()=>setPage('sources'));
 }else{
  body=<>
   <Text style={text}>{guide?.summary??'A full guide is not available yet. These are the saved movement cues.'}</Text>
   <NativeSection title={guide?'Quick cues':'Movement cues'}>{cues.map((cue,index)=><Text key={index} style={text}>• {cue}</Text>)}</NativeSection>
   {!!guide?.safety&&<NativeSection title="Safety"><Text style={text}>{guide.safety}</Text></NativeSection>}
   <NativeSettingsRow label="Equipment & logging" onPress={openEquipment}/>
   <NativeSettingsRow label="Sources & details" onPress={()=>setPage('sources')}/>
  </>;
  action=steps.length?footer('Learn the movement',()=>{setStep(0);setPage('steps')}):undefined;
 }
 return <NativeFlowScreen title={title} subtitle={subtitle} onBack={page==='overview'?undefined:back} handleHardwareBack={!onRegisterBack&&page!=='overview'} footer={action}>
  {!!linkError&&<Text accessibilityRole="alert" style={[text,{color:c.danger}]}>{linkError}</Text>}
  {body}
  {equipmentVisited&&equipmentSettings&&<View key={exercise.id} style={{display:page==='equipment'?'flex':'none'}} accessibilityElementsHidden={page!=='equipment'} importantForAccessibility={page==='equipment'?'auto':'no-hide-descendants'}>{equipmentSettings}</View>}
 </NativeFlowScreen>;
}
