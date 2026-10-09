import {fitnessReferences} from './fitness-grounding';
import {REVIEW_POLICY,type ReviewContext} from './workout-review';

export const QWEN_DEMO_TOPICS=[
 'How do heavy loads relate to strength and muscle growth?',
 'What do rest intervals change between sets?',
 'What changes with weekly sets and diminishing returns?',
] as const;
// No profile, saved history or imported text enters the demo worker.
export function qwenDemoContext():ReviewContext{return {
 policy:REVIEW_POLICY,workoutId:'qwen-sample-adult-completed',status:'reviewed',summary:'Fictional completed workout',
 facts:[{id:'logged',text:'The fictional adult completed 12 work sets across 3 exercises.'},{id:'effort',text:'The fictional adult marked the workout about right.'}],
 next:'Keep the accepted targets.',proposalIds:[],evidenceIds:fitnessReferences.filter(n=>n.enabled&&n.audiences.includes('adult')).map(n=>n.evidenceId),aiEligible:true,
};}
