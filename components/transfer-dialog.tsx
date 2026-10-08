"use client";
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {createTransferFile,isTransferFile,openTransferFile,passwordProblem,TransferError,TRANSFER_MIN_PASSWORD} from '@/lib/transfer-bundle';
import {readSavedState} from '@/lib/saved-data';

const randomBytes=(n:number)=>globalThis.crypto.getRandomValues(new Uint8Array(n));
const fileName=()=>`movefield-transfer-${new Date().toISOString().slice(0,10)}.json`;
const MAX_FILE_CHARS=30_000_000;

export function downloadText(name:string,text:string){
  const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download=name;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

// Makes a password-protected transfer file from the current data. The password is never stored.
export function ExportTransferDialog({open,onOpenChange,plaintext}:{open:boolean;onOpenChange:(open:boolean)=>void;plaintext:()=>string}){
  const [password,setPassword]=useState(''),[again,setAgain]=useState(''),[show,setShow]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
  const close=(value:boolean)=>{if(!value){setPassword('');setAgain('');setShow(false);setError('');setDone(false)}onOpenChange(value)};
  async function make(){
    if(password!==again){setError('The two passwords do not match.');return}
    const problem=passwordProblem(password);
    if(problem){setError(problem.message);return}
    setBusy(true);setError('');
    try{
      const file=await createTransferFile(plaintext(),password,{source:'web',random:randomBytes});
      downloadText(fileName(),file);
      setPassword('');setAgain('');setDone(true);
    }catch{
      setError('The file could not be made in this browser. Your data is unchanged.');
    }finally{setBusy(false)}
  }
  return <Dialog open={open} onOpenChange={close}><DialogContent>
    <DialogHeader><DialogTitle>{done?'Transfer file downloaded':'Make a transfer file'}</DialogTitle>
      <DialogDescription>{done?'Open Movefield on your new device, choose Restore a transfer file, and enter the password you just used.':`The file is encrypted with a password you choose, at least ${TRANSFER_MIN_PASSWORD} characters. Anyone with the file and the password can read your training, so keep both private. If the password is lost, the file cannot be opened, and we cannot reset it.`}</DialogDescription>
    </DialogHeader>
    {!done&&<form className="field-grid" onSubmit={e=>{e.preventDefault();void make()}}>
      <label className="field"><span>Password</span><Input type={show?'text':'password'} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} aria-describedby="transfer-password-help"/></label>
      <label className="field"><span>Type the password again</span><Input type={show?'text':'password'} autoComplete="new-password" value={again} onChange={e=>setAgain(e.target.value)}/></label>
      <p id="transfer-password-help" className="small-copy">Use a phrase of four or five words you can remember.</p>
      <Button type="button" variant="ghost" aria-pressed={show} onClick={()=>setShow(v=>!v)}>{show?'Hide passwords':'Show passwords'}</Button>
      {error&&<p role="alert" className="notice warning">{error}</p>}
      {busy&&<p aria-live="polite" className="muted">Protecting the file. This takes a few seconds.</p>}
      <DialogFooter><Button type="button" variant="outline" onClick={()=>close(false)}>Cancel</Button><Button type="submit" disabled={busy||!password||!again}>Make transfer file</Button></DialogFooter>
    </form>}
    {done&&<DialogFooter><Button onClick={()=>close(false)}>Done</Button></DialogFooter>}
  </DialogContent></Dialog>;
}

type RestoreStep='pick'|'password'|'confirm';
// Reads a transfer file or a plain backup, asks for the password when needed, and confirms before anything is replaced.
export function RestoreTransferDialog({open,onOpenChange,onRestore}:{open:boolean;onOpenChange:(open:boolean)=>void;onRestore:(plaintext:string)=>Promise<void>}){
  const [raw,setRaw]=useState<string|null>(null),[name,setName]=useState(''),[password,setPassword]=useState(''),[step,setStep]=useState<RestoreStep>('pick'),[error,setError]=useState(''),[busy,setBusy]=useState(false),[plain,setPlain]=useState<string|null>(null);
  const close=(value:boolean)=>{if(!value){setRaw(null);setName('');setPassword('');setStep('pick');setError('');setPlain(null)}onOpenChange(value)};
  async function choose(file:File){
    setError('');
    if(file.size>MAX_FILE_CHARS){setError('That file is too large to open here.');return}
    try{
      const text=await file.text();
      setRaw(text);setName(file.name);
      if(isTransferFile(text)){setStep('password')}
      else{setPlain(text);setStep('confirm')}
    }catch{setError('That file could not be read.')}
  }
  async function unlock(){
    if(!raw)return;
    setBusy(true);setError('');
    try{
      const text=await openTransferFile(raw,password);
      readSavedState(text);
      setPlain(text);setPassword('');setStep('confirm');
    }catch(e){
      setError(e instanceof TransferError?e.message:'That file is not a valid Movefield backup. Nothing was replaced.');
    }finally{setBusy(false)}
  }
  async function replace(){
    if(!plain)return;
    setBusy(true);
    try{
      await onRestore(plain);
      close(false);
    }catch{
      setError('The restored data could not be saved in this browser. Nothing was replaced.');
    }finally{setBusy(false)}
  }
  return <Dialog open={open} onOpenChange={close}><DialogContent>
    <DialogHeader><DialogTitle>Restore a transfer file</DialogTitle><DialogDescription>{step==='pick'&&'Choose the transfer file from your other device, or a plain backup file.'}{step==='password'&&`Enter the password for ${name}. Nothing is replaced until the file opens.`}{step==='confirm'&&'The file opened. Replacing the data here cannot be undone, so export anything you want to keep first.'}</DialogDescription></DialogHeader>
    {step==='pick'&&<label className="button-like"><span>Choose a file</span><input type="file" accept="application/json,.json" aria-label="Choose a transfer file or plain backup" onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(f)void choose(f)}}/></label>}
    {step==='password'&&<form className="field-grid" onSubmit={e=>{e.preventDefault();void unlock()}}>
      <label className="field"><span>Password for this file</span><Input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
      {error&&<p role="alert" className="notice warning">{error}</p>}
      <DialogFooter><Button type="button" variant="outline" onClick={()=>close(false)}>Cancel</Button><Button type="submit" disabled={busy||!password}>Open file</Button></DialogFooter>
    </form>}
    {step==='confirm'&&<>
      {error&&<p role="alert" className="notice warning">{error}</p>}
      <DialogFooter><Button variant="outline" onClick={()=>close(false)}>Keep the data here</Button><Button disabled={busy} onClick={()=>void replace()}>Replace the data in this browser</Button></DialogFooter>
    </>}
    {step==='pick'&&error&&<p role="alert" className="notice warning">{error}</p>}
  </DialogContent></Dialog>;
}
