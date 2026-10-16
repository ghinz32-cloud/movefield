/* Inbound file preparation only. No profile, account or workout data is read. */
(function(){
'use strict';
const hex=bytes=>Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');
const digest=async bytes=>hex(await crypto.subtle.digest('SHA-256',bytes));
const items=new Map();let manifestPromise;
function loadManifest(){return manifestPromise??=fetch('android-installers.json',{cache:'no-store'}).then(async response=>{if(!response.ok)throw Error('Download information is unavailable.');const value=await response.json();if(value.format!=='fitness-android-downloads-v1'||!Array.isArray(value.apps))throw Error('Download information could not be verified.');return value}).catch(error=>{manifestPromise=null;throw error})}
for(const card of document.querySelectorAll('[data-app]')){
 const app=card.dataset.app,button=card.querySelector('[data-download]'),direct=card.querySelector('[data-direct]'),cancel=card.querySelector('.cancel'),progress=card.querySelector('progress'),status=card.querySelector('.status'),save=card.querySelector('.save');let controller=null,url=null;
 items.set(app,{card,button,direct,status});
 cancel.addEventListener('click',()=>controller?.abort());
 button.addEventListener('click',async()=>{
  if(controller)return;controller=new AbortController();const signal=controller.signal;button.disabled=true;cancel.hidden=false;progress.hidden=false;progress.value=0;save.hidden=true;if(url){URL.revokeObjectURL(url);url=null}status.textContent='Preparing your Android app…';
  try{
   const manifest=await loadManifest(),item=manifest.apps.find(x=>x.app===app);
   if(!item||!Number.isSafeInteger(item.bytes)||item.bytes<1||item.bytes>60*1024*1024||!Array.isArray(item.parts)||item.parts.length<1||item.parts.length>8||!/^[a-f0-9]{64}$/.test(item.sha256)||!new RegExp('^'+app+'-arm64-current-test\\.apk$').test(item.filename))throw Error('This app download is not available.');
   const bytes=new Uint8Array(item.bytes);let position=0;
   for(const part of item.parts){
    if(signal.aborted)throw new DOMException('Cancelled','AbortError');
    if(typeof part.file!=='string'||!new RegExp('^native/'+app+'/part-[0-7]\\.bin$').test(part.file)||!Number.isSafeInteger(part.bytes)||part.bytes<1||part.bytes>10*1024*1024||position+part.bytes>bytes.length||!/^[a-f0-9]{64}$/.test(part.sha256))throw Error('Download information is invalid.');
    const response=await fetch(part.file,{signal,cache:'no-store'});if(!response.ok)throw Error('The download was interrupted. Please retry.');
    const data=new Uint8Array(await response.arrayBuffer());if(data.byteLength!==part.bytes||await digest(data)!==part.sha256)throw Error('The download did not pass its file check. Please retry.');
    bytes.set(data,position);position+=data.byteLength;progress.value=Math.round(position/bytes.length*100);status.textContent='Preparing app · '+progress.value+'%';
   }
   if(signal.aborted)throw new DOMException('Cancelled','AbortError');
   if(position!==bytes.length||await digest(bytes)!==item.sha256)throw Error('The completed app did not pass its file check.');
   if(signal.aborted)throw new DOMException('Cancelled','AbortError');
   url=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.android.package-archive'}));save.href=url;save.download=item.filename;save.textContent='Save '+item.name+' APK';save.hidden=false;status.textContent='File checked. Tap Save to download your app.';save.focus();
  }catch(error){status.textContent=error.name==='AbortError'?'Download cancelled.':error.message||'The app could not be downloaded.'}
  finally{controller=null;button.disabled=false;cancel.hidden=true;progress.hidden=true}
 });
}
const focus=new URLSearchParams(location.search).get('app');if(items.has(focus))(items.get(focus).direct||items.get(focus).button).focus();
const grizzly=location.pathname.includes('/grizzly/');if(grizzly){document.getElementById('web-grizzly').href='../index.html';document.getElementById('web-movefield').href='../../review/'}
addEventListener('pagehide',()=>{for(const card of document.querySelectorAll('[data-app]')){const save=card.querySelector('.save');if(save.href.startsWith('blob:'))URL.revokeObjectURL(save.href)}});
})();
