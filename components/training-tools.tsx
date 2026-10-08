"use client";
import {useState} from 'react';
import {Check} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {barWeights,personalBests,platesForLoad,warmupLadder,weeklyReview,type LoadUnit,type PlateResult} from '@/lib/training-tools';
import {displayLoad,niceDate,type State} from '@/lib/training';

const parse=(value:string):number|null=>value.trim()===''?null:Number(value);
const fmt=(n:number)=>String(Math.round(n*100)/100);

function Choice<T extends string|number>({label,options,value,onChange,render}:{label:string;options:readonly T[];value:T;onChange:(v:T)=>void;render:(v:T)=>string}){
 return <fieldset><legend className="field-label">{label}</legend><div className="mode-picker">{options.map(option=><button key={String(option)} type="button" aria-pressed={option===value} className={option===value?'selected':''} onClick={()=>onChange(option)}>{render(option)}{option===value&&<Check size={16}/>}</button>)}</div></fieldset>;
}

function PlateSummary({result}:{result:PlateResult}){
 if(result.status==='unknown')return <p className="muted">Enter a total load to see the plates for each side.</p>;
 if(result.status==='error')return <p role="alert" className="notice warning">{result.message}</p>;
 const perSide=result.perSide.length?result.perSide.map(p=>`${p.count} × ${fmt(p.weight)} ${result.unit}`).join(' + '):'No plates. The bar alone.';
 return <div className="plate-result" aria-live="polite"><p><b>Per side:</b> {perSide}</p>{result.exact?<p>Exact total: <b>{fmt(result.achieved)} {result.unit}</b>.</p>:<p>Highest loadable total at or below your entry: <b>{fmt(result.achieved)} {result.unit}</b>, which is {fmt(result.shortBy)} {result.unit} less.</p>}<p className="small-copy">Uses standard plates. Collars and clips are not counted; weigh the bar if it matters.</p></div>;
}

// Plate calculator and warm-up ladder. Both calculate from the numbers entered here. They do not change the workout log.
export function TrainingTools({units,adult}:{units:LoadUnit;adult:boolean}){
 const [total,setTotal]=useState(''),[bar,setBar]=useState<number|null>(null),[working,setWorking]=useState(''),[kind,setKind]=useState<'barbell'|'dumbbell'>('barbell');
 const bars=barWeights[units];
 const barValue=bar!==null&&bars.includes(bar)?bar:bars[0];
 const plates=platesForLoad(parse(total),units,barValue);
 const warm=warmupLadder(parse(working),{unit:units,kind,bar:kind==='barbell'?barValue:0,adult});
 return <section className="card training-tools" aria-labelledby="training-tools-heading"><p className="eyebrow">LOADING</p><h2 id="training-tools-heading">Plate calculator</h2><p className="muted">Work out the plates for a barbell load. Enter the total, including the bar.</p>
  <div className="field-grid"><label className="field"><span>Total load · {units}</span><Input inputMode="decimal" aria-label={`Total barbell load in ${units}`} value={total} onChange={e=>setTotal(e.target.value)} placeholder={units==='kg'?'e.g. 100':'e.g. 225'}/></label>
  <Choice label="Bar" options={bars} value={barValue} onChange={setBar} render={b=>`${b} ${units}`}/></div>
  <PlateSummary result={plates}/>
  <h2 className="tools-subheading">Warm-up ladder</h2>
  {!adult?<p className="notice blue">For people under 18, your supervisor chooses warm-up loads. Use the warm-up in your plan.</p>:<>
   <p className="muted">Four sets at 40%, 60%, 75% and 85% of your working load, rounded to loadable steps.</p>
   <div className="field-grid"><label className="field"><span>Working load · {units}{kind==='dumbbell'?' per hand':''}</span><Input inputMode="decimal" aria-label={`Working load in ${units}`} value={working} onChange={e=>setWorking(e.target.value)} placeholder={units==='kg'?'e.g. 100':'e.g. 225'}/></label>
   <Choice label="Equipment" options={['barbell','dumbbell'] as const} value={kind} onChange={setKind} render={k=>k==='barbell'?'Barbell':'Dumbbell'}/></div>
   {warm.status==='unknown'&&<p className="muted">Enter your working load to see the warm-up sets.</p>}
   {warm.status==='error'&&<p role="alert" className="notice warning">{warm.message}</p>}
   {warm.status==='ok'&&<div className="tool-rows" aria-live="polite">{warm.rows.map(row=><div key={row.percent}><span>{row.percent}% × {row.reps} {row.reps===1?'rep':'reps'}</span><b>{fmt(row.load)} {warm.unit}{kind==='dumbbell'?' each hand':''}{row.barOnly?' · bar only':''}</b></div>)}<p className="small-copy">Steps of {fmt(warm.step)} {warm.unit}.</p></div>}
  </>}
 </section>;
}

// The last seven days from the active plan, plus new estimated bests from those days. Counts only; it changes nothing.
export function WeeklyReview({state,today,units}:{state:State;today:string;units:LoadUnit}){
 const review=weeklyReview(state,today);
 const bests=review?state.history.filter(w=>w.finishedAt&&w.date>=review.start&&w.date<=review.end).flatMap(w=>personalBests(state,w.id)):[];
 return <section className="card weekly-review" aria-labelledby="weekly-review-heading"><div className="split"><div><p className="eyebrow">LAST 7 DAYS</p><h2 id="weekly-review-heading">Weekly review</h2></div>{review&&<span className="pill">{niceDate(review.start)} – {niceDate(review.end)}</span>}</div>
  {!review?<p className="muted">Choose a plan to see planned, completed and missed sessions here.</p>:<>
   <div className="mini-stats"><div><strong>{review.completed}</strong><span>of {review.planned} planned sessions done</span></div><div><strong>{review.missed}</strong><span>{review.paused?'missed (plan paused)':'missed'}</span></div><div><strong>{review.setsLogged}</strong><span>sets logged</span></div></div>
   <p className="small-copy">{review.partial?`${review.partial} partial. `:''}{review.otherWorkouts?`${review.otherWorkouts} logged outside this plan. `:''}{review.streak===null?'Your plan is paused, so no streak is counted.':`Planned sessions in a row: ${review.streak}.`}</p>
   {bests.length>0&&<div className="tool-rows" aria-label="New estimated bests">{bests.slice(0,4).map(b=><div key={b.workoutId+b.exerciseId}><span>New estimated best · {b.name}</span><b>{displayLoad(b.estimate,units)} <span className="small-copy">was {displayLoad(b.previous,units)}</span></b></div>)}<p className="small-copy">Estimates come from rated sets. They are approximate, not tested maximums.</p></div>}
  </>}
 </section>;
}
