'use client';
import {rirText} from '@/lib/training';

export function HistorySetRir({name,set,value,disabled,onChange}:{name:string;set:number;value?:number|null;disabled?:boolean;onChange:(n:number|null)=>void}) {
 const options: (number|null)[] = [null,0,1,2,3,4,5];
 // Keep a valid older exact rating visible until the owner chooses a correction.
 if(value != null && !options.includes(value)) options.push(value);
 return <label className="field"><span>Good reps left · set {set}</span><select aria-label={`Edit ${name} set ${set} reps left`} disabled={disabled} value={value??''} onChange={e=>onChange(e.target.value===''?null:Number(e.target.value))}>{options.map(n=><option key={String(n)} value={n??''}>{n===null?'Not recorded':rirText(n)}</option>)}</select></label>;
}
