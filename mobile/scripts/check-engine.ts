import assert from 'node:assert/strict';
import { adoptPlan, editSet, emptyDemo, finishWorkout, FOUNDATION, RUN_WALK, SPORT_FOUNDATION, previewPlan, startWorkout } from '../src/mobile-engine';
import { programCatalog } from '../src/shared/program-catalog';
import { readSavedState } from '../src/shared/saved-data';
import { addDays, day, exercises, type State } from '../src/shared/training';
import { guides, safeWebUrl } from '../src/content';

import {applySubstitution} from '../src/shared/substitutions';

assert.equal(previewPlan('missing-program').plan,null);
const choices = [FOUNDATION, RUN_WALK, SPORT_FOUNDATION, ...programCatalog.map(x => x.id)];
for (const id of choices) for (let offset = 0; offset < 7; offset++) {
  const start = addDays(day(), offset);
  // Exercise the same public preview entry point as the native button, including its sample prerequisites.
  const result = previewPlan(id, start);
  assert.ok(result.plan, `${id}: ${result.errors.join(' ')}`);
  assert.ok(result.plan!.sessions.length > 0);
  assert.equal(result.plan!.sessions[0].date, start, `${id}: first session must be available today`);
  const definition = programCatalog.find(choice => choice.id === id);
  if (definition?.fixedDose) {
    assert.equal(result.plan!.profile.trainingDays, definition.days, `${id}: sample preserves the requested training frequency`);
    for (let week = 1; week <= 4; week++) assert.equal(result.plan!.sessions.filter(session => session.week === week).length, definition.days, `${id}: available days must not become extra workouts`);
    assert.ok(result.plan!.sessions.every(session => session.minutes <= definition.minutes), `${id}: sample keeps the selected variant's duration ceiling`);
  }
  readSavedState(JSON.stringify(adoptPlan(emptyDemo(), result.plan!)));
}
for (const id of choices) {
  let current = adoptPlan(emptyDemo(), previewPlan(id).plan!);
  current = startWorkout(current, current.plan!.sessions[0].id, true);
  const targets = current.active!.targets!;
  for (let index = 0; index < current.active!.sets.length; index++) {
    const set = current.active!.sets[index], target = targets.find(item=>item.exerciseId===set.exerciseId)!;
    const exercise = exercises.find(item=>item.id===set.exerciseId)!;
    current = editSet(current,index,{reps:target.reps,kg:exercise.loadTracked?10:null,rir:exercise.metric==='reps'?2:undefined,done:true});
  }
  current = readSavedState(JSON.stringify(finishWorkout(current)));
  assert.equal(current.active,null,id+': finishing clears active logging');
  assert.equal(current.history.length,1,id+': first session can be saved and reloaded');
  assert.equal(current.history[0].partial,false,id+': every required set was logged');
  for (const set of current.history[0].sets) if(exercises.find(item=>item.id===set.exerciseId)?.metric==='reps') assert.equal(set.rir,2,id+': each set retains RIR');
}
console.log(`PASS: native actual preview→start→log every required set→finish→reload for ${choices.length} catalog/shortcut plans; original targets and individual-set RIR retained.`);
let state: State = adoptPlan(emptyDemo(), previewPlan(FOUNDATION).plan!);
state = startWorkout(state, state.plan!.sessions[0].id);
assert.equal(state.active!.demo, false, 'A private workout must not be tagged as sample data');
const samplePlan=previewPlan(FOUNDATION).plan!;
assert.equal(startWorkout(adoptPlan(emptyDemo(),samplePlan),samplePlan.sessions[0].id,true).active!.demo,true,'Sample provenance must be explicit');
assert.equal(state.active!.sets[0].reps, 0, 'Do not prefill actual reps from targets');
assert.throws(() => editSet(state, 0, { done: true }), /actual/);
assert.throws(() => editSet(state, 0, { kg: -1 }), /load/);
assert.throws(() => editSet(state, 0, { metrics: { distanceM: -1 } }), /measurements/);
state = editSet(state, 0, { reps: 8, kg: 10, done: true, metrics: { distanceM: 50, durationSeconds: 30, notes: 'Controlled practice' } });
state = finishWorkout(state);
assert.equal(state.history.length, 1);
assert.equal(state.history[0].partial, true);
assert.equal(state.active, null);
const restored = readSavedState(JSON.stringify(state));
assert.equal(restored.history[0].sets[0].kg, 10);
assert.deepEqual(restored.history[0].sets[0].metrics, { distanceM: 50, durationSeconds: 30, notes: 'Controlled practice' }, 'Optional measurements must survive save and reload');
const replaced = adoptPlan(state, previewPlan('PL3').plan!);
assert.equal(replaced.history.length, 1, 'Plan replacement must preserve history');
assert.throws(() => readSavedState('{"schema":2}'));
assert.throws(() => readSavedState('{"__proto__":{}}'));
assert.equal(safeWebUrl('javascript:alert(1)'), null);
assert.equal(safeWebUrl('https://user:password@example.com'), null);
assert.ok(safeWebUrl('https://docs.expo.dev/'));
assert.equal(new Set(exercises.map(x => x.id)).size, exercises.length, 'Catalog IDs must be unique');
assert.equal(Object.keys(guides).length, exercises.length, 'Every exercise must have a detailed guide');
for (const exercise of exercises) assert.ok(guides[exercise.id], `Missing guide ${exercise.id}`);
for (const [id, guide] of Object.entries(guides)) {
  assert.ok(exercises.some(x => x.id === id), `Orphan guide ${id}`);
  for (const key of ['equipment', 'setup', 'execution', 'finish', 'breathing', 'commonErrors'] as const) assert.ok(Array.isArray(guide[key]) && guide[key].length && guide[key].every(x => typeof x === 'string'), `Invalid native-rendered ${key} in ${id}`);
  for (const key of ['summary', 'easierOption', 'safety', 'loadConvention', 'sourceNote'] as const) assert.equal(typeof guide[key], 'string', `Invalid ${key} in ${id}`);
  assert.ok(Array.isArray(guide.sourceURLs), `Invalid source URLs in ${id}`);
}
console.log(`PASS: ${choices.length} plans across all 7 starting weekdays, workout validation, partial save, optional measurements round-trip, retained history, unsafe read/link rejection, ${exercises.length} exercises and ${Object.keys(guides).length} guides.`);

// Deep-audit regressions: date approval, partial recovery, and immutable boundaries.
import { makeMoveProposal, makeProposal, applyProposal } from '../src/shared/training';
let overdue=adoptPlan(emptyDemo(),previewPlan(FOUNDATION,addDays(day(),-7)).plan!);
assert.throws(()=>startWorkout(overdue,overdue.plan!.sessions[0].id),/Review moving/);
const move=makeMoveProposal(overdue,overdue.plan!.sessions[0].id,day(),true);assert.ok(move.proposal,move.error);
overdue={...overdue,proposals:[move.proposal!]};overdue=applyProposal(overdue,move.proposal!.id).state;
overdue=startWorkout(overdue,overdue.plan!.sessions[0].id);
assert.throws(()=>editSet(overdue,0,{reps:1.5}),/whole-number/);
overdue=editSet(overdue,0,{reps:8,kg:10,done:true});overdue=finishWorkout(overdue);
const returnPlan=makeProposal(overdue,'return');assert.ok(returnPlan);
overdue={...overdue,proposals:[returnPlan!]};const returned=applyProposal(overdue,returnPlan!.id);assert.equal(returned.error,undefined);assert.equal(returned.state.history.length,1);
const held={...emptyDemo(),hold:true,events:[{id:'off',name:'Vacation',date:addDays(day(),100),kind:'Vacation',priority:'Normal',minutes:1440,provisional:false}]};
const retained=adoptPlan(held,previewPlan(FOUNDATION).plan!);assert.equal(retained.hold,true);assert.deepEqual(retained.events,held.events);
assert.throws(()=>adoptPlan({...held,events:[{...held.events[0],date:day()}]},previewPlan(FOUNDATION).plan!),/conflicts/);

let swapState=adoptPlan(emptyDemo(),previewPlan('PL3').plan!);swapState=startWorkout(swapState,swapState.plan!.sessions[0].id);const swap=applySubstitution(swapState,{sessionId:swapState.active!.sessionId,from:'bench',to:'lib-db-flat-bench-press',all:false,setup:'',allowLonger:true,acknowledgeSpecificity:true,planId:swapState.plan!.id,version:swapState.plan!.version,historyCount:0});assert.equal(swap.error,undefined);assert.ok(readSavedState(JSON.stringify(swap.state)).active!.targets!.some(x=>x.exerciseId==='lib-db-flat-bench-press'));console.log('PASS: native substitution survives validated save/reload; invalid program IDs are rejected.');

// Preserve old sample archives and saved setup context through the native journey.
const many={...replaced,saved:Array.from({length:25},(_,i)=>({...replaced.plan!,id:'old-'+i}))};
assert.equal(adoptPlan(many,previewPlan(FOUNDATION).plan!).saved.length,26);
assert.throws(()=>adoptPlan({...many,saved:Array.from({length:100},(_,i)=>({...replaced.plan!,id:'full-'+i}))},previewPlan(FOUNDATION).plan!),/100 archived/);
let machine=adoptPlan(emptyDemo(),previewPlan(FOUNDATION).plan!);machine=startWorkout(machine,machine.plan!.sessions[0].id);machine={...machine,active:{...machine.active!,loadContext:{pulldown:'machine-A'}}};machine=editSet(machine,0,{reps:8,kg:10,done:true});machine=finishWorkout(machine);assert.equal(machine.loadContext!.pulldown,'machine-A');assert.equal(machine.restTimer,null);
console.log('PASS: native plan archives are retained and guarded; saved machine context carries forward without changing history.');
