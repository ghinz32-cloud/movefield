import React,{useState} from 'react';
import {Platform,Pressable,Text,View} from 'react-native';
import {File,Paths} from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {useNativeAppearance} from './appearance';
import {maxBackupBytes,previewBackup,serializeBackup} from './shared/local-backup';
import type {State} from './shared/training';

export async function shareBackup(raw:string){
 if(!await Sharing.isAvailableAsync())throw Error('File sharing is not available on this device.');
 const file=new File(Paths.cache,`movefield-backup-${Date.now()}.json`);
 try{file.create();file.write(raw);await Sharing.shareAsync(file.uri,{mimeType:'application/json',UTI:'public.json',dialogTitle:'Save a private training backup'});}
 finally{try{if(file.exists)file.delete()}catch{/* The OS may still hold the temporary file; its cache can reclaim it. */}}
}
export async function pickBackupText():Promise<string|null>{
 const result=await DocumentPicker.getDocumentAsync({type:['application/json','text/plain'],copyToCacheDirectory:true,multiple:false});
 if(result.canceled)return null;
 const asset=result.assets[0],file=new File(asset.uri);
 try{
  if((asset.size??file.size)>30_000_000)throw Error('This backup is too large to open here.');
  return await file.text();
 }finally{
  try{const prefix=Paths.cache.uri.replace(/\/?$/,'/');if(file.uri.startsWith(prefix)&&file.exists)file.delete()}catch{/* The OS can reclaim this import cache. */}
 }
}
type Preview=ReturnType<typeof previewBackup> & {expected:string};
export function NativeBackup({state,onRestore}:{state:State;onRestore:(incoming:State,expected:string)=>string|undefined}){
 const {colors:c,p,fonts}=useNativeAppearance(),[preview,setPreview]=useState<Preview|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const text={fontSize:16*p.textSize/100,lineHeight:24*p.textSize/100,color:c.ink,fontFamily:fonts?'Inter':undefined};
 const button=(label:string,action:()=>void,disabled=false)=><Pressable accessibilityRole="button" accessibilityState={{disabled:disabled||busy}} disabled={disabled||busy} onPress={action} style={{minHeight:48,padding:12,borderWidth:1,borderColor:c.line,borderRadius:10,opacity:(disabled||busy)?0.5:1}}><Text style={text}>{label}</Text></Pressable>;
 const exportRecords=async()=>{setBusy(true);setError('');try{await shareBackup(serializeBackup(state));setMessage('Share sheet closed. Check that your backup was saved before deleting any records.')}catch(e){setError(e instanceof Error?e.message:'The backup could not be exported.')}finally{setBusy(false)}};
 const choose=async()=>{setBusy(true);setError('');try{
  const expected=serializeBackup(state),result=await DocumentPicker.getDocumentAsync({type:['application/json','text/plain'],copyToCacheDirectory:true,multiple:false});
  if(result.canceled)return;
  const asset=result.assets[0],file=new File(asset.uri);
  try{if((asset.size??file.size)>maxBackupBytes)throw Error('This backup is too large to open here.');setPreview({...previewBackup(await file.text()),expected});}
  finally{try{const prefix=Paths.cache.uri.replace(/\/?$/,'/');if(file.uri.startsWith(prefix)&&file.exists)file.delete()}catch{/* OS-managed import cache can reclaim the copy. */}}
 }catch(e){setError(e instanceof Error?e.message:'The backup could not be opened.')}finally{setBusy(false)}};
 return <View style={{gap:12,padding:20,borderWidth:1,borderColor:c.line,borderRadius:16,backgroundColor:c.white}}><Text accessibilityRole="header" style={[text,{fontWeight:'700',fontSize:22*p.textSize/100}]}>Backup and restore</Text><Text style={text}>Keep a private copy of your profile and workout notes. Compatible phone and website backups can be transferred manually. This does not enable automatic sync.</Text>{button('Export backup',()=>void exportRecords(),Platform.OS==='web')}{button('Choose backup to review',()=>void choose(),!!state.active||Platform.OS==='web')}{state.active&&<Text style={text}>Finish or discard the current workout before restoring another backup.</Text>}{preview&&<View style={{gap:12}}><Text accessibilityRole="header" style={[text,{fontWeight:'700'}]}>Replace this device’s records?</Text><Text style={text}>{preview.name||'Unnamed profile'} · {preview.workouts} workouts · {preview.sets} logged sets · {preview.plans} plans. {preview.active?'The unfinished workout can be resumed. ':''}Your current {state.history.length} workouts and plan will be replaced. Export them first. Other devices are unaffected.</Text>{button('Replace with this backup',()=>{const problem=onRestore(preview.state,preview.expected);if(problem)setError(problem);else{setPreview(null);setMessage('Backup opened. Check the save status before closing the app.')}})}{button('Keep current records',()=>setPreview(null))}</View>}{busy&&<Text accessibilityLiveRegion="polite" style={text}>Preparing backup…</Text>}{!!message&&<Text accessibilityLiveRegion="polite" style={text}>{message}</Text>}{!!error&&<Text accessibilityRole="alert" style={[text,{color:c.danger}]}>{error}</Text>}</View>;
}
