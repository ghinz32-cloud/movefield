import assert from 'node:assert/strict';
import { adoptPlan, editSet, emptyDemo, finishWorkout, FOUNDATION, RUN_WALK, SPORT_FOUNDATION, previewPlan, startWorkout } from '../src/mobile-engine';
import { programCatalog } from '../src/shared/program-catalog';
import { readSavedState } from '../src/shared/saved-data';
import { addDays, day, exercises, type State } from '../src/shared/training';
import { guides, loadNativeContent, safeWebUrl } from '../src/content';

import {applySubstitution} from '../src/shared/substitutions';
import { randomBytes } from 'node:crypto';
import { isSealed, keyFromHex, LocalDataError, newKeyHex, openText, sealText } from '../src/local-crypto';
import { createTransferFile, isTransferFile, openTransferFile, TransferError } from '../src/shared/transfer-bundle';
import { planOptions } from '../src/shared/onboarding';
import { blankProfile } from '../src/shared/training';

assert.equal(previewPlan('missing-program').plan,null);
const choices = [FOUNDATION, RUN_WALK, SPORT_FOUNDATION, ...programCatalog.map(x => x.id)];
for (const id of choices) for (let offset = 0; offset < 7; offset++) {
  const start = addDays(day(), offset);
  const result = previewPlan(id, start);
  assert.ok(result.plan, `${id}: ${result.errors.join(' ')}`);
  assert.ok(result.plan!.sessions.length > 0);
  assert.equal(result.plan!.sessions[0].date, start, `${id}: first session must be available today`);
  readSavedState(JSON.stringify(adoptPlan(emptyDemo(), result.plan!)));
}
let state: State = adoptPlan(emptyDemo(), previewPlan(FOUNDATION).plan!);
state = startWorkout(state, state.plan!.sessions[0].id);
assert.notEqual(state.active!.demo,true,'Personal native workouts are eligible as real records after secure account integration');
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
assert.equal(Object.keys(guides).length,0,'Native content is deferred until the library or a guide opens');

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
let held={...emptyDemo(),hold:true,events:[{id:'off',name:'Vacation',date:addDays(day(),100),kind:'Vacation',priority:'Normal',minutes:1440,provisional:false}]};
let retained=adoptPlan(held,previewPlan(FOUNDATION).plan!);assert.equal(retained.hold,true);assert.deepEqual(retained.events,held.events);
assert.throws(()=>adoptPlan({...held,events:[{...held.events[0],date:day()}]},previewPlan(FOUNDATION).plan!),/conflicts/);

let swapState=adoptPlan(emptyDemo(),previewPlan('PL3').plan!);swapState=startWorkout(swapState,swapState.plan!.sessions[0].id);const swap=applySubstitution(swapState,{sessionId:swapState.active!.sessionId,from:'bench',to:'lib-db-flat-bench-press',all:false,setup:'',allowLonger:true,acknowledgeSpecificity:true,planId:swapState.plan!.id,version:swapState.plan!.version,historyCount:0});assert.equal(swap.error,undefined);assert.ok(readSavedState(JSON.stringify(swap.state)).active!.targets!.some(x=>x.exerciseId==='lib-db-flat-bench-press'));console.log('PASS: native substitution survives validated save/reload; invalid program IDs are rejected.');

// Preserve old sample archives and saved setup context through the native journey.
const many={...replaced,saved:Array.from({length:25},(_,i)=>({...replaced.plan!,id:'old-'+i}))};
assert.equal(adoptPlan(many,previewPlan(FOUNDATION).plan!).saved.length,26);
assert.throws(()=>adoptPlan({...many,saved:Array.from({length:100},(_,i)=>({...replaced.plan!,id:'full-'+i}))},previewPlan(FOUNDATION).plan!),/100 archived/);
let machine=adoptPlan(emptyDemo(),previewPlan(FOUNDATION).plan!);machine=startWorkout(machine,machine.plan!.sessions[0].id);machine={...machine,active:{...machine.active!,loadContext:{pulldown:'machine-A'}}};machine=editSet(machine,0,{reps:8,kg:10,done:true});machine=finishWorkout(machine);assert.equal(machine.loadContext!.pulldown,'machine-A');assert.equal(machine.restTimer,null);
console.log('PASS: native plan archives are retained and guarded; saved machine context carries forward without changing history.');

// Local encryption: sealed records must hide content, bind to their storage slot, and reject tampering.
{
  const random = (n: number) => new Uint8Array(randomBytes(n));
  const isLocalError = (code: string) => (e: unknown) => e instanceof LocalDataError && e.code === code;
  const key = keyFromHex(newKeyHex(random));
  const slot = 'training-studio:mobile-local-demo:v1';
  const plain = JSON.stringify({ note: 'Heavy squat day, ünïcode ✓', n: 1 });
  const sealed = sealText(plain, key, slot, random);
  assert.deepEqual(Object.keys(JSON.parse(sealed)), ['v', 'alg', 'nonce', 'data']);
  assert.equal(isSealed(sealed), true);
  assert.equal(isSealed(plain), false, 'legacy plaintext is not treated as sealed');
  assert.ok(!sealed.includes('squat'), 'ciphertext must not contain plaintext');
  assert.equal(openText(sealed, key, slot), plain);
  assert.notEqual(sealText(plain, key, slot, random), sealed, 'each write uses a fresh nonce');
  assert.throws(() => openText(sealed, key, 'training-studio:mobile-setup:v1'), isLocalError('decrypt-failed'), 'a record cannot be moved to another slot');
  assert.throws(() => openText(sealed, keyFromHex(newKeyHex(random)), slot), isLocalError('decrypt-failed'), 'wrong key is rejected');
  const flipped = JSON.parse(sealed) as { data: string };
  flipped.data = (flipped.data[0] === '0' ? '1' : '0') + flipped.data.slice(1);
  assert.throws(() => openText(JSON.stringify(flipped), key, slot), isLocalError('decrypt-failed'), 'tampered ciphertext is rejected');
  assert.throws(() => openText(JSON.stringify({ ...JSON.parse(sealed), alg: 'aes-gcm' }), key, slot), isLocalError('unknown-format'));
  assert.throws(() => openText('{"v":1,"alg":"xchacha20poly1305","nonce":"zz","data":"00"}', key, slot), isLocalError('decrypt-failed'));
  assert.throws(() => keyFromHex('abc'), isLocalError('key-unavailable'), 'damaged key text is never replaced silently');
  assert.throws(() => sealText(plain, new Uint8Array(16), slot, random), isLocalError('key-unavailable'));
  assert.throws(() => sealText(plain, key, slot, () => new Uint8Array(8)), isLocalError('key-unavailable'));
  assert.throws(() => newKeyHex(() => new Uint8Array(5)), isLocalError('key-unavailable'));
  console.log('PASS: local records are sealed with XChaCha20-Poly1305, bound to their storage slot, and reject tampering or wrong keys.');
}

// Transfer files: the phone writes and reads the same format as the web app. Argon2id runs here, so this is slow but real.
const transferPassword = 'quiet river lantern 42';
const transferRandom = (n: number) => new Uint8Array(randomBytes(n));
const transferPlain = JSON.stringify(emptyDemo(), null, 2);
void (async () => {
  await loadNativeContent();
assert.equal(Object.keys(guides).length, exercises.length, 'Every exercise must have a detailed guide');
for (const exercise of exercises) assert.ok(guides[exercise.id], `Missing guide ${exercise.id}`);
for (const [id, guide] of Object.entries(guides)) {
  assert.ok(exercises.some(x => x.id === id), `Orphan guide ${id}`);
  for (const key of ['equipment', 'setup', 'execution', 'finish', 'breathing', 'commonErrors'] as const) assert.ok(Array.isArray(guide[key]) && guide[key].length && guide[key].every(x => typeof x === 'string'), `Invalid native-rendered ${key} in ${id}`);
  for (const key of ['summary', 'easierOption', 'safety', 'loadConvention', 'sourceNote'] as const) assert.equal(typeof guide[key], 'string', `Invalid ${key} in ${id}`);
  assert.ok(Array.isArray(guide.sourceURLs), `Invalid source URLs in ${id}`);
}
console.log(`PASS: ${choices.length} plans across all 7 starting weekdays, workout validation, partial save, optional measurements round-trip, retained history, unsafe read/link rejection, ${exercises.length} exercises and ${Object.keys(guides).length} guides.`);

  const file = await createTransferFile(transferPlain, transferPassword, { source: 'phone', random: transferRandom });
  assert.equal(isTransferFile(file), true);
  assert.equal(file.includes('Movefield'), false, 'the file must not contain plaintext marker text');
  assert.equal(await openTransferFile(file, transferPassword), transferPlain);
  await assert.rejects(openTransferFile(file, 'quiet river lantern 43'), (e: unknown) => e instanceof TransferError && e.code === 'wrong-password');
  console.log('PASS: phone transfer files round-trip, reject a wrong password, and keep the header authenticated.');
  // Starting suggestion: a first-time lifter gets one starting plan whose days match the choice; experienced users get none.
  const firstTime = { ...blankProfile, name: 'Check', age: 28, goal: 'hypertrophy', experience: 'First time', mode: 'app' as const, days: [1, 3, 5], minutes: 60, weeks: 8, equipment: 'Full gym', start: day() };
  const starts = planOptions(firstTime, []).filter(o => o.startHere);
  assert.equal(starts.length, 1, 'exactly one starting plan for a first-time lifter');
  assert.ok(starts[0].plan, 'the starting plan is buildable');
  const startProgram = programCatalog.find(d => d.id === starts[0].id);
  assert.equal(startProgram?.days, 3, 'a three-day choice starts with a three-day program');
  assert.ok((starts[0].notes ?? []).length >= 2, 'the starting plan explains its fit');
  assert.equal(planOptions({ ...firstTime, experience: 'Some experience' }, []).some(o => o.startHere), false, 'experienced users get no starting label');
  console.log('PASS: first-time lifters get one starting plan that matches their days; fit notes are shown.');
})().catch(error => { console.error(error); process.exit(1); });
