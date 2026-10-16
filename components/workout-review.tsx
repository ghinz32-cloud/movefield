'use client';
import {afterWorkoutCoaching} from '@/lib/workout-coaching';
import {reviewWorkout} from '@/lib/workout-review';
import {type State} from '@/lib/training';
import {isGrizzly} from '@/lib/brand';
import {useAppPreferences} from '@/components/app-preferences';
import {CoachingMessages} from '@/components/workout-coaching';
export function WorkoutReview({state,workoutId,requested=false}:{state:State;workoutId?:string;requested?:boolean}){
 const {p}=useAppPreferences();
 const latest=workoutId||[...state.history].filter(w=>w.finishedAt).sort((a,b)=>(b.finishedAt||0)-(a.finishedAt||0))[0]?.id;
 const summary=latest?afterWorkoutCoaching(state,latest,{brand:isGrizzly?'grizzly':'movefield'}):null;
 const review=latest?reviewWorkout(state,latest):null;
 if(p.coaching==='off'||p.coaching==='manual'&&!requested&&!workoutId)return null;
 if(!summary)return <section className="card workout-review"><p className="eyebrow">AFTER YOUR WORKOUT</p><h3>Your workout review</h3><p>Save a workout to see what you logged and what to consider next.</p></section>;
 return <section className="card workout-review" aria-label="Workout review"><p className="eyebrow">AFTER YOUR WORKOUT</p><h3>{summary.title}</h3><CoachingMessages summary={summary}/>{review&&<details><summary>Training-rule review</summary><p>{review.summary}</p><ul>{review.facts.map(f=><li key={f.id}>{f.text}</li>)}</ul><p><b>Next step:</b> {review.next}</p></details>}</section>;
}
