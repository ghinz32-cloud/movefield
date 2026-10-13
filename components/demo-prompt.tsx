"use client";
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {demoLink,type DemoMedia} from '@/lib/exercise-video';

// Asked once per workout, before the first set of an exercise the person has never logged.
export function FirstTimeDemoPrompt({open,exercises,media,onNotNow,onNeverAsk}:{open:boolean;exercises:{id:string;name:string}[];media:DemoMedia;onNotNow:()=>void;onNeverAsk:()=>void}){
 return <Dialog open={open} onOpenChange={v=>{if(!v)onNotNow()}}><DialogContent>
  <DialogHeader><DialogTitle>New exercise in this workout</DialogTitle><DialogDescription>Would you like to see a demonstration before your first set? Links open in a new tab. Movefield does not play video itself.</DialogDescription></DialogHeader>
  <ul className="demo-list">{exercises.map(ex=>{const link=demoLink(ex.id,media);return <li key={ex.id}><b>{ex.name}</b>{link?<Button variant="outline" size="sm" asChild><a href={link.url} target="_blank" rel="noopener noreferrer">{link.kind==='video'?'Watch a demonstration':'Open the source page'}</a></Button>:null}</li>})}</ul>
  <p className="small-copy">Demonstration pages are not checked by Movefield. Follow your own coach’s cues if they differ.</p>
  <div className="button-row"><Button variant="outline" onClick={onNotNow}>Not now</Button><Button variant="outline" onClick={onNeverAsk}>Don’t ask about these</Button></div>
 </DialogContent></Dialog>;
}
