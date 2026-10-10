"use client";
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';

// Shown instead of the workspace when saved data cannot be opened in this browser. Nothing is replaced from here
// unless the person confirms it.
export function SavedDataRecovery({keyMissing,unavailable=false,detail,onExport,onRestore,onReset,onSample}:{keyMissing:boolean;unavailable?:boolean;detail?:string;onExport?:()=>void;onRestore:()=>void;onReset:()=>void;onSample:()=>void}){
  const [confirm,setConfirm]=useState(false);
  return <main className="recovery-page"><section className="card">
    {unavailable?<>
      <p className="eyebrow">SAVED STORAGE IS UNAVAILABLE</p>
      <h1>We could not check your saved training.</h1>
      <p>Nothing has been replaced. Close older tabs and reopen the app to retry. You can explore sample training while saving is unavailable.</p>
      <p>Keep a transfer file before replacing a profile. A saved copy may still be in this browser even when it cannot be opened.</p>
    </>:keyMissing?<>
      <p className="eyebrow">THIS SAVED TRAINING IS ON ANOTHER DEVICE</p>
      <h1>This browser does not have the key for your saved training.</h1>
      <p>Your training was saved here, but the key that opens it is not in this browser. This happens after a new phone, a new browser or cleared site data. Nothing has been replaced.</p>
      <p>Restore a transfer file made on your other device, or start a fresh profile here. The other device keeps its own copy.</p>
    </>:<>
      <p className="eyebrow">YOUR SAVED DATA IS STILL HERE</p>
      <h1>We could not open this saved profile.</h1>
      <p>The file may be damaged or from a newer version. We have not replaced it.</p>
      <p>Keep a copy before you try a fresh profile. You can also explore sample training without changing this file.</p>
    </>}
    {detail&&!keyMissing&&<p role="alert" className="notice warning">{detail}</p>}
    <div className="button-row">
      <Button onClick={onRestore}>Restore a transfer file</Button>
      {!keyMissing&&onExport&&<Button variant="outline" onClick={onExport}>Keep a copy of the locked file</Button>}
      <Button variant="outline" onClick={onSample}>Explore sample training</Button>
      <Button variant="ghost" onClick={()=>setConfirm(true)}>Start a fresh profile</Button>
    </div>
  </section>
  <AlertDialog open={confirm} onOpenChange={setConfirm}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Replace this browser’s saved profile?</AlertDialogTitle><AlertDialogDescription>This erases the saved training this browser cannot open. Restore a transfer file first if you want to keep it.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep saved file</AlertDialogCancel><AlertDialogAction onClick={onReset}>Replace with a fresh profile</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main>;
}
