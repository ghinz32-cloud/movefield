import {useState} from 'react';
import {AppearanceSettings,useAppPreferences} from '../components/app-preferences';
import {Button} from '../components/ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '../components/ui/dialog';
import {GrizzlyMark} from './grizzly-mark';
export function GrizzlyCustomize(){
 const [open,setOpen]=useState(false),{p}=useAppPreferences();
 return <><Button className="grizzly-customize-button" variant="outline" aria-label="Customize Grizzly appearance" onClick={()=>setOpen(true)}>Customize</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="appearance-dialog grizzly-customize-dialog"><DialogHeader><DialogTitle>Make it yours</DialogTitle><DialogDescription>Bear style, heading fonts, colors and reading preferences.</DialogDescription></DialogHeader><div className="appearance-dialog-body"><AppearanceSettings/><details className="grizzly-about"><summary>About this version</summary><GrizzlyMark className="grizzly-logo-full"/><p>Grizzly Fitness logo supplied for this preview. Separate saved profile with shared training features. {p.grizzlyStyle==='wild'?'Claws, rips and frost are custom app styling.':'The clean style keeps your chosen colors.'}</p><a href="https://www.fitnessgrizzly.com/" target="_blank" rel="noopener noreferrer">Visit the gym website</a><a href="/movefield/review/">Open Movefield</a></details></div></DialogContent></Dialog></>;
}
