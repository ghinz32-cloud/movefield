import {File,Directory,Paths} from 'expo-file-system';
import {getDocumentAsync} from 'expo-document-picker';
import {isAvailableAsync,shareAsync} from 'expo-sharing';
import {randomUUID} from 'expo-crypto';
const prefix='movefield-export-';
export async function cleanExportFiles(all=false){for(const item of new Directory(Paths.cache).list())if(item instanceof File&&item.name.startsWith(prefix)&&item.name.endsWith('.json')&&(all||item.modificationTime!==null&&Date.now()-item.modificationTime>86_400_000))item.delete();}
/** Owner selects a destination; use a file URI rather than a large IPC message. */
export async function shareJsonFile(raw:string,label:'encrypted-backup'|'plaintext-plan'|'original-saved-file',current:()=>boolean=()=>true){
 if(raw.length>32*1024*1024||new TextEncoder().encode(raw).length>32*1024*1024)throw Error('This export exceeds the supported file size.');
 if(!await isAvailableAsync())throw Error('File sharing is unavailable on this device.');
 await cleanExportFiles();if(!current())throw Error('Your profile changed while preparing this export. Retry from the current profile.');
 const file=new File(Paths.cache,prefix+label+'-'+randomUUID()+'.json');file.create({overwrite:false});file.write(raw);
 try{await shareAsync(file.uri,{mimeType:'application/json',dialogTitle:'Movefield '+label,UTI:'public.json'})}catch{if(file.exists)file.delete();throw Error('The file could not be shared. Your saved profile is kept.');}
 // Recipients may read after the sheet closes. Expire owned cache files later.
}
export async function pickJsonFile(maxBytes:number):Promise<string|null>{
 const result=await getDocumentAsync({type:['application/json','text/plain'],multiple:false,copyToCacheDirectory:true});if(result.canceled)return null;
 const asset=result.assets[0],file=new File(asset.uri);
 try{if(!file.exists||file.size>maxBytes)throw Error('The selected file is unavailable or exceeds the supported size.');const raw=await file.text();if(raw.length>maxBytes||new TextEncoder().encode(raw).length>maxBytes)throw Error('The selected file exceeds the supported size.');return raw}
 finally{if(file.uri.startsWith(Paths.cache.uri)&&file.exists)file.delete();}
}
