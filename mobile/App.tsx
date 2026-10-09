import {NativeAppearanceProvider,useNativeAppearance,useThemedStyles} from './src/appearance';
import {NativePrivacyNotice,NativeSettings} from './src/settings';
import {NativeResearchLibrary} from './src/research-library';
import {shareBackup} from './src/backup';
import {restoreBackup,serializeBackup} from './src/shared/local-backup';
import {metricFields,metricSummary} from './src/shared/set-metrics';
import {useNativeWorkoutReminders} from './src/workout-notifications';
import {planName,sessionName,workoutName,trainingCopy} from './src/shared/presentation';
import {brand} from './src/shared/brand';
import {normalizeWorkoutRest,changeWorkoutSet,logWorkoutSet,workoutSetReference,type WorkoutSetReference,setExerciseNotes} from './src/shared/workout-log';
import {PlanSetup} from './src/plan-setup';
import {SessionEditor} from './src/session-editor';
import {applyTrackingEdit} from './src/shared/tracking';
import {acceptSetup} from './src/shared/onboarding';
import {enableRestAlerts,useNativeRestAlerts} from './src/rest-alerts';
import {restSeconds,pauseRest,resumeRest,extendRest,completedSetError,type RestTimer} from './src/shared/rest-timer';
import {readStoredSavedState} from './src/shared/storage-capacity';
import {sessionGuide} from './src/shared/session-guide';
import {reviewWorkout} from './src/shared/workout-review';
import {trainingDay,trainingWeekDates} from './src/shared/training-day';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AccessibilityInfo, AppState, ActivityIndicator, FlatList, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { setEquipmentLimit, loadSuggestion, makeLoadProposal, applyProposal, makeProposal, makeContinuationReview, makeMoveProposal, matchesExercise, addDays, day, displayLoad, eligibility, exFor, exercises, isLoadTracked, niceDate, sortWorkoutHistory, nextSession, targetText, toKg, weekdays, goals, type Exercise, type Plan, type Proposal, type SetLog, type SetMetrics, type State, type Workout } from './src/shared/training';
import { programCatalog,programReferences,programEquipment,referenceMatchesGoal,referenceEquipment } from './src/shared/program-catalog';
import {substitutionOptions,previewSubstitution,applySubstitution,type Substitution} from './src/shared/substitutions';
import { guides, media, safeWebUrl, loadNativeContent } from './src/content';
import { adoptPlan, emptyDemo, RUN_WALK, SPORT_FOUNDATION, previewPlan, startWorkout, setPlanPaused, workoutCheckin, completeWorkoutCheckin, type WorkoutCheckin } from './src/mobile-engine';
import { readLocalPrivacyStatus, readLocalRaw, readLocalState, replaceLocalState, resetLocalState, retryLocalPrivacyCleanup, saveLocalState, type NativePrivacyStatus } from './src/storage';
import { LocalDataError } from './src/local-crypto';
import { nativeSaveFailure, type NativeSaveFailure } from './src/storage-capacity';
import { NativeTransferOpen } from './src/transfer';
import { createTransferFile, isTransferFile, openTransferFile, TransferError } from './src/shared/transfer-bundle';
import { getRandomBytes } from 'expo-crypto';
import { NativeTrainingTools, NativeWeeklyReview } from './src/tools';
import { demoLink, firstTimeExerciseIds } from './src/shared/exercise-video';
import { AI_DISCLAIMER, SEEK_CARE_TEXT } from './src/shared/safety-copy';

type Tab = 'Today' | 'Plan' | 'Library' | 'History' | 'Settings';
type Confirmation = { title: string; message: string; label: string; action: () => void };
const COLORS = { bg: '#F6F5EF', ink: '#19362D', muted: '#66746B', green: '#214D3A', line: '#DCE1D7', pale: '#E6EDDD', orange: '#E6AB74', white: '#FFFFFF', onAccent:'#FFFFFF', danger: '#933C2D' };

function Button({ label, onPress, secondary = false, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) { const styles=useThemedStyles(baseStyles),{colors:COLORS}=useNativeAppearance();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, secondary && styles.secondaryButton, disabled && { opacity: 0.4 }, pressed && { opacity: 0.78 }]}><Text style={[styles.buttonText, secondary && { color: COLORS.ink }]}>{label}</Text></Pressable>;
}
function Pill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { const styles=useThemedStyles(baseStyles),{colors:COLORS}=useNativeAppearance();
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.pill, selected && styles.pillSelected]}><Text style={[styles.pillText, selected && { color: COLORS.onAccent }]}>{label}</Text></Pressable>;
}
function Card({ children, dark = false, grow = false }: { children: React.ReactNode; dark?: boolean; grow?: boolean }) { const styles=useThemedStyles(baseStyles); return <View style={[styles.card, dark && styles.darkCard, grow && styles.flex]}>{children}</View>; }
function Heading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) { const styles=useThemedStyles(baseStyles);
  return <View style={styles.heading}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text>{detail && <Text style={styles.body}>{detail}</Text>}</View>;
}
function Disclosure({label,children}:{label:string;children:React.ReactNode}){const [open,setOpen]=useState(false),styles=useThemedStyles(baseStyles);return <View><Pressable accessibilityRole="button" accessibilityState={{expanded:open}} onPress={()=>setOpen(v=>!v)} style={styles.detailsToggle}><Text style={styles.link}>{open?'−':'+'} {label}</Text></Pressable>{open&&<View style={{gap:10}}>{children}</View>}</View>}
function NumericField({ value, onChange, label, max, min=0, nullable = false, integer = false, placeholder }: { value: number | null; onChange: (n: number | null) => void; label: string; max: number; min?: number; nullable?: boolean;integer?:boolean;placeholder?:string }) { const styles=useThemedStyles(baseStyles),{colors:COLORS}=useNativeAppearance();
  const format=(n:number|null)=>n===null||(!nullable&&n===0)?'':String(Math.round(n*100)/100);
  const [draft,setDraft]=useState({value,nullable,text:format(value)});
  if(!Object.is(draft.value,value)||draft.nullable!==nullable)setDraft({value,nullable,text:format(value)});
  const text=draft.text;
  return <TextInput accessibilityLabel={label} placeholder={placeholder??(nullable ? '—' : '0')} placeholderTextColor={COLORS.muted} keyboardType={min<0?(Platform.OS==='ios'?'numbers-and-punctuation':'default'):'decimal-pad'} selectTextOnFocus style={styles.numberInput} value={text} onChangeText={next => {
    const normalized = next.replace(',', '.');
    if (integer&&normalized.includes('.'))return;
    if (!(min<0?/^-?\d{0,7}(\.\d{0,2})?$/:/^\d{0,7}(\.\d{0,2})?$/).test(normalized)) return;
    const n = normalized === '' || normalized === '.' || normalized === '-' || normalized === '-.' ? (nullable ? null : 0) : Number(normalized);
    if (n !== null && (!Number.isFinite(n) || n > max || n < min)) return;
    setDraft({value:n,nullable,text:next}); onChange(n);
  }} />;
}
function OptionalSetDetails({ set, name, metric, onChange }: { set: SetLog; name: string; metric: string; onChange: (metrics: SetMetrics) => void }) { const styles=useThemedStyles(baseStyles),{colors:COLORS}=useNativeAppearance();
  const [open,setOpen]=useState(!!set.metrics&&Object.keys(set.metrics).length>0),[visible,setVisible]=useState<string[]>(()=>[...new Set(['distanceM','durationSeconds',...Object.keys(set.metrics||{})])]);
  const patch=(next:Partial<SetMetrics>)=>onChange({...set.metrics,...next});
  return <View style={{gap:10}}><Pressable accessibilityRole="button" accessibilityLabel={`${name} set ${set.set} optional details`} accessibilityState={{expanded:open}} onPress={()=>setOpen(!open)} style={styles.detailsToggle}><Text style={styles.link}>{open?'Hide':'Add'} set measurements and notes</Text></Pressable>{open&&<View style={styles.optionalFields}><Text style={styles.small}>Enter actual {metric} above. Optional measurements keep the units shown and do not replace that amount.</Text>
  {metricFields.filter(f=>visible.includes(f.key)).map(f=><View key={f.key} style={{gap:6}}><Text style={styles.small}>{f.label}</Text><NumericField label={`${name} set ${set.set} ${f.label}`} nullable min={f.min} max={f.max} value={set.metrics?.[f.key]??null} onChange={n=>patch({[f.key]:n??undefined})}/></View>)}
  <View style={[styles.row,{flexWrap:'wrap'}]}>{metricFields.filter(f=>!visible.includes(f.key)).map(f=><Pill key={f.key} label={`Add ${f.label}`} selected={false} onPress={()=>setVisible(v=>[...v,f.key])}/>)}</View>
  <Text style={styles.small}>Tempo</Text><TextInput accessibilityLabel={`${name} set ${set.set} tempo`} style={styles.input} maxLength={200} placeholder="e.g. 3–1–1" placeholderTextColor={COLORS.muted} value={set.metrics?.tempo||''} onChangeText={tempo=>patch({tempo:tempo||undefined})}/>
  <Text style={styles.small}>Side · assistance and one-sided work stay separate from strength estimates</Text><View style={[styles.row,{flexWrap:'wrap'}]}>{['Not recorded','Both','Left','Right','Alternating'].map(side=><Pill key={side} label={side} selected={side==='Not recorded'?!set.metrics?.side:set.metrics?.side===side} onPress={()=>patch({side:side==='Not recorded'?undefined:side})}/>)}</View>
  <TextInput accessibilityLabel={`${name} set ${set.set} notes`} style={[styles.input,{minHeight:80,textAlignVertical:'top'}]} placeholder="Optional set notes" placeholderTextColor={COLORS.muted} multiline maxLength={6000} value={set.metrics?.notes??''} onChangeText={notes=>patch({notes:notes||undefined})}/></View>}</View>;
}
function RecordedMetrics({metrics}:{metrics?:SetMetrics}){const styles=useThemedStyles(baseStyles),summary=metricSummary(metrics);return summary?<Text style={styles.small}>{summary}</Text>:null}
function NativeRestClock({timer,compact=false}:{timer:RestTimer|null|undefined;compact?:boolean}){
 const styles=useThemedStyles(baseStyles),[now,setNow]=useState(()=>Date.now());
 useEffect(()=>{const endAt=timer?.endAt;if(!endAt)return;let interval:ReturnType<typeof setInterval>|undefined;const tick=()=>{const time=Date.now();setNow(time);if(time>=endAt)clearInterval(interval)};if(endAt>Date.now())interval=setInterval(tick,1000);tick();const subscription=AppState.addEventListener('change',s=>{if(s==='active')tick()});return()=>{clearInterval(interval);subscription.remove()}},[timer?.endAt]);
 const left=timer?restSeconds(timer,now):null;
 return <Text style={compact?styles.small:styles.sectionTitle}>{left===null?'Rest timer':left===0?'Rest is over. Start when ready.':`Rest ${timer?.pausedSeconds!==null?'paused · ':''}${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`}</Text>;
}
function ModalFrame({ visible, close, title, children, scrollRef }: { visible: boolean; close: () => void; title: string; children: React.ReactNode; scrollRef?:React.RefObject<ScrollView|null> }) { const styles=useThemedStyles(baseStyles),{reduceMotion}=useNativeAppearance();
  return <Modal visible={visible} animationType={reduceMotion?"none":"slide"} onRequestClose={close} presentationStyle="pageSheet"><SafeAreaView style={styles.safe}><View style={styles.modalHeader}><Text style={styles.modalTitle}>{title}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Close ${title}`} onPress={close} style={styles.inlineAction}><Text style={styles.link}>Close</Text></Pressable></View><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.content}>{children}</ScrollView></KeyboardAvoidingView></SafeAreaView></Modal>;
}
function NativeEquipmentLimit({state,exercise,onSave}:{state:State;exercise?:Exercise;onSave:(f:(s:State)=>State)=>boolean}){ const styles=useThemedStyles(baseStyles);
 const setup=exercise?.requiresSetup?state.loadContext?.[exercise.id]||'':'';
 const cap=exercise?state.equipmentCaps?.find(c=>c.exerciseId===exercise.id&&c.setup===setup)?.maxKg:state.profile.dumbbellMaxKg;
 const step=exercise?state.incrementKg?.[exercise.id]:undefined;
 const [draft,setDraft]=useState(''),[increment,setIncrement]=useState(''),[setupDraft,setSetupDraft]=useState(setup),[message,setMessage]=useState('');
 // Changing the selected equipment/setup/units starts a different editing context.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{const factor=state.profile.units==='lb'?2.2046226218:1;setDraft(cap===undefined?'':String(Math.round(cap*factor*100)/100));setIncrement(step?String(Math.round(step*factor*100)/100):'');setSetupDraft(setup);setMessage('')},[cap,step,setup,exercise?.id,state.profile.units]);
 const disabled=!!state.active;
 return <Card><Text style={styles.sectionTitle}>{exercise?'Equipment and progression':'Your dumbbell limit'}</Text><Text style={styles.small}>{exercise?.loadConvention||'Enter the weight of ONE dumbbell, not the pair.'} Blank means unknown. Zero means unavailable. Changes never rewrite history.</Text>
 {exercise?.requiresSetup&&<><Text style={styles.body}>Machine, attachment and setup</Text><TextInput accessibilityLabel="Equipment setup label" editable={!disabled} value={setupDraft} onChangeText={v=>{setSetupDraft(v);setDraft('');setIncrement('')}} maxLength={200} style={styles.input}/><Text style={styles.small}>A changed setup needs its own limit and comparable history.</Text></>}
 <Text style={styles.body}>Maximum available ({state.profile.units})</Text><TextInput accessibilityLabel={exercise?'Maximum available exercise load':'Maximum single dumbbell weight'} editable={!disabled} value={draft} onChangeText={setDraft} keyboardType="decimal-pad" maxLength={12} style={styles.input}/>
 {exercise&&<><Text style={styles.body}>Smallest available increase ({state.profile.units})</Text><TextInput accessibilityLabel="Smallest equipment load increase" editable={!disabled} value={increment} onChangeText={setIncrement} keyboardType="decimal-pad" maxLength={12} style={styles.input}/><Text style={styles.small}>Use this exercise’s load convention. For a barbell, include both sides. Blank or zero holds increases until you know the available step.</Text></>}
 <Button secondary disabled={disabled} label="Save equipment settings" onPress={()=>{const parse=(v:string)=>v.trim()===''?undefined:toKg(Number(v.trim().replace(',','.')),state.profile.units);const kg=parse(draft),increase=parse(increment);if(kg!==undefined&&(!Number.isFinite(kg)||kg<0||kg>(exercise?1500:500))||increase!==undefined&&(!Number.isFinite(increase)||increase<0||increase>100)){setMessage('Enter valid nonnegative equipment weights, or leave unknown values blank.');return}
 const saved=onSave(s=>{let next={...s,proposals:s.proposals.map(p=>p.status==='pending'||p.status==='queued'?{...p,status:'stale' as const}:p)};if(exercise){next={...next,loadContext:exercise.requiresSetup?{...next.loadContext,[exercise.id]:setupDraft.trim()}:next.loadContext,incrementKg:{...next.incrementKg,[exercise.id]:increase||0}};const r=setEquipmentLimit(next,exercise.id,kg);if(r.error)throw Error(r.error);return r.state}return {...next,profile:{...next.profile,dumbbellMaxKg:kg}};});setMessage(saved?'Equipment settings saved.':'Equipment settings could not be saved. Check the error above.');}}/>{disabled&&<Text style={styles.small}>Finish or save the active workout first.</Text>}{message&&<Text accessibilityLiveRegion="polite" style={styles.small}>{message}</Text>}</Card>;
}
function TrainingApp() {
 const styles=useThemedStyles(baseStyles),appearance=useNativeAppearance(),COLORS=appearance.colors;
  const [state, setState] = useState<State | null>(null);
  const [nativeContentReady,setNativeContentReady]=useState(false);
  // Asked once per exercise in a workout, before its first set, and only for exercises never logged on this phone.
  const [askedDemo, setAskedDemo] = useState<string[]>([]);

  const [readError, setReadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState('Loading local data…');
  const [saveFailure, setSaveFailure] = useState<NativeSaveFailure | null>(null);
  const [privacyStatus,setPrivacyStatus]=useState<NativePrivacyStatus|null>(null);
  const [privacyBusy,setPrivacyBusy]=useState(false);
  const [localNotice,setLocalNotice]=useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('Today');
  const [researchOpen,setResearchOpen]=useState(false);
  const [showRestOptions,setShowRestOptions]=useState(false),[workoutExerciseIndex,setWorkoutExerciseIndex]=useState(0);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [historyItem, setHistoryItem] = useState<Workout | null>(null);
  const [calendarReference,setCalendarReference]=useState(()=>day());
  const [calendarDate,setCalendarDate]=useState<string|null>(null);
  const [confirm, setConfirm] = useState<Confirmation | null>(null);
  const [checkin, setCheckin] = useState<WorkoutCheckin | null>(null);
  const [changePreview, setChangePreview] = useState<Proposal | null>(null);
  const [moveDate, setMoveDate] = useState(day());
  const [linkError, setLinkError] = useState('');
  const [resetting, setResetting] = useState(false);
  const stateRef = useRef<State | null>(null);
  const resettingRef = useRef(false),restoringRef=useRef(false),writeVersion=useRef(0);
  const mountedRef=useRef(true),privacyGeneration=useRef(0),privacyBusyRef=useRef(false);
  const unavailablePrivacy:NativePrivacyStatus={state:'unavailable',pending:0,preserved:0,unreadable:0};
  const refreshPrivacyStatus=async()=>{
    if(!mountedRef.current)return;
    const generation=++privacyGeneration.current;
    let status:NativePrivacyStatus;
    try{status=await readLocalPrivacyStatus()}catch{status=unavailablePrivacy}
    if(mountedRef.current&&generation===privacyGeneration.current)setPrivacyStatus(status);
  };
  const retryPrivacyCleanup=async()=>{
    if(!mountedRef.current||privacyBusyRef.current||resettingRef.current||restoringRef.current)return;
    privacyBusyRef.current=true;setPrivacyBusy(true);
    const generation=++privacyGeneration.current;
    try{
      let status:NativePrivacyStatus;
      try{status=await retryLocalPrivacyCleanup()}catch{status=unavailablePrivacy}
      if(mountedRef.current&&generation===privacyGeneration.current)setPrivacyStatus(status);
    }finally{
      privacyBusyRef.current=false;
      if(mountedRef.current)setPrivacyBusy(false);
    }
  };
  // Revoke the latest operation tokens at unmount, rather than a token captured at mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{mountedRef.current=true;return()=>{mountedRef.current=false;privacyGeneration.current++;writeVersion.current++}},[]);
  // Backup: share the saved data as text (save it to Files, Notes or email). Restore: paste it back, validated first.
  const exportBackup = async (): Promise<string> => {
    if (!stateRef.current) return 'Nothing to back up yet.';
    try { await shareBackup(serializeBackup(stateRef.current)); return ''; }
    catch { return 'The backup could not be shared. Try again.'; }
  };
  // Transfer files: one password seals the data for a new phone. Opening one asks for confirmation before anything changes.
  const makeTransfer = async (password: string): Promise<string> => {
    if (!stateRef.current) return 'Nothing to protect yet.';
    try {
      const file = await createTransferFile(serializeBackup(stateRef.current), password, { source: 'phone', random: getRandomBytes });
      await shareBackup(file);
      return '';
    } catch (e) { return e instanceof TransferError ? e.message : 'The transfer file could not be made. Your data is unchanged.'; }
  };
  const openTransfer = async (raw: string, password: string): Promise<string> => {
    if(resettingRef.current||restoringRef.current)return 'A storage change is already in progress.';
    if(stateRef.current?.active)return 'Finish or discard the current workout before restoring another backup.';
    const expected=stateRef.current?serializeBackup(stateRef.current):null;
    let plain: string;
    try { plain = isTransferFile(raw) ? await openTransferFile(raw, password) : raw; }
    catch (e) { return e instanceof TransferError ? e.message : 'That file could not be opened. Nothing was replaced.'; }
    let parsed: State;
    try { parsed = readStoredSavedState(plain.trim()) as State; }
    catch { return 'That is not a valid Movefield transfer file or backup. Nothing was replaced.'; }
    const here = stateRef.current;
    const plural = (n: number) => `${n} recorded workout${n === 1 ? '' : 's'}`;
    setConfirm({ title: 'Replace data on this phone?', message: `This phone has ${plural(here?.history.length ?? 0)}${here?.plan ? ' and a current plan' : ''}. The file has ${plural(parsed.history.length)}${parsed.plan ? ' and a plan' : ''}. Replacing saves the file and removes what is here now. Make a transfer file first if you want to keep it.`, label: 'Replace with this file', action: () => { void replaceWith(parsed,expected); } });
    return '';
  };
  // Writes the opened data under a new key. The old record is replaced only after the new key and record are in place.
  const replaceWith = async (parsed: State,expected:string|null) => {
    if(!mountedRef.current||resettingRef.current||restoringRef.current)return;
    restoringRef.current=true;
    privacyGeneration.current++;
    try{
    // Check the state that will be shown before anything is stored, so a later failure cannot be mistaken for a failed save.
    let checked: State;
    try {
      const here=stateRef.current;
      if(expected===null&&here)throw Error('Your records changed after this preview. Choose the backup again.');
      checked=here?restoreBackup(here,parsed,expected!):{...parsed,restTimer:null,restAlerts:false,simulatedOffline:false,proposals:parsed.proposals.map(p=>p.status==='pending'||p.status==='queued'?{...p,status:'stale'}:p)};
      readStoredSavedState(JSON.stringify(checked));
    } catch(e) { setError(e instanceof Error?e.message:'This backup could not be restored. Nothing was replaced.');return; }
    try {
      await replaceLocalState(checked);
    } catch (e) { if(mountedRef.current)setError(e instanceof LocalDataError ? e.message : 'The file opened, but this phone could not save it. Nothing was replaced.'); return; }
    if(!mountedRef.current)return;
    setReadError(null); setError('');setLocalNotice('');
    stateRef.current=checked;setState(checked);writeVersion.current++;setSaveFailure(null);setSaveStatus('Saved on this device');setTab('Today');setCheckin(null);setChangePreview(null);
    }finally{restoringRef.current=false;if(mountedRef.current)void refreshPrivacyStatus()}
  };
  const commit = (next: State) => {
    if(!mountedRef.current)return;
    const checked=normalizeWorkoutRest(next);readStoredSavedState(JSON.stringify(checked));
    stateRef.current=checked;setState(checked);const version=++writeVersion.current;
    privacyGeneration.current++;
    setSaveStatus('Saving on this device…');
    const attempt=(n:number):void=>{
      if(!mountedRef.current||version!==writeVersion.current)return;
      void saveLocalState(checked).then(()=>{
        if(mountedRef.current&&version===writeVersion.current){setSaveFailure(null);setSaveStatus('Saved on this device');void refreshPrivacyStatus()}
      }).catch(error=>{
        if(!mountedRef.current||version!==writeVersion.current)return;
        const failure=nativeSaveFailure(error);
        if(failure.kind==='save'&&n<3){setSaveStatus('Retrying local save…');setTimeout(()=>attempt(n+1),n*1000);return;}
        setSaveFailure(failure);setSaveStatus('Save failed · export before closing or retry in Settings');void refreshPrivacyStatus();
      });
    };
    attempt(1);
  };
  const [personalSetup,setPersonalSetup]=useState(false),[setupProgramId,setSetupProgramId]=useState<string|undefined>();
  const [trackingSession,setTrackingSession]=useState('');
  const [preview, setPreview] = useState<Plan | null>(null);
  const [planGoal,setPlanGoal]=useState('powerlifting');
  const [selectedPlan,setSelectedPlan]=useState<string|null>(null);
  const planScroll=useRef<ScrollView>(null),trainingStyleY=useRef(0),planCardY=useRef<Record<string,number>>({}),setupScroll=useRef<ScrollView>(null);
  const [substitution,setSubstitution]=useState<Substitution|null>(null);
  const [subEquipment,setSubEquipment]=useState('All');
  const [search, setSearch] = useState('');
  const [equipment, setEquipment] = useState('All');


  // Startup runs once; storage completion callbacks use refs to suppress stale results.
  useEffect(() => { let mounted = true; readLocalState().then(s => {
    if (!mounted) return;
    if(s){const checked=normalizeWorkoutRest(s);stateRef.current=checked;setState(checked);setSaveStatus('Saved on this device');}
    else commit(emptyDemo());
  }).catch(e => { if (mounted) setReadError(e instanceof LocalDataError ? e.message : 'We could not open your saved training. It has not been replaced.'); }).finally(()=>{if(mounted)void refreshPrivacyStatus()}); return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const workoutReminderMessage=useNativeWorkoutReminders(state,appearance.p,appearance.ready);
  const restAlertMessage=useNativeRestAlerts(state?.restTimer,state?.active?.id,!!state?.restAlerts,!!state);
  const [alertMessage,setAlertMessage]=useState('');
  const library = useMemo(() => [...exercises, ...(state?.custom ?? [])], [state?.custom]);
  const equipmentOptions = useMemo(() => ['All', ...Array.from(new Set(library.map(x => x.equipment))).sort()], [library]);
  const filtered = useMemo(() => library.filter(x => (equipment === 'All' || x.equipment === equipment) && matchesExercise(x,search)), [library,search,equipment]);
  const modify = (fn: (s: State) => State) => { if (resettingRef.current || restoringRef.current || !stateRef.current) return false; try { commit(fn(stateRef.current)); setError(''); return true; } catch (e) { setError(e instanceof Error ? e.message : 'This action could not be completed.'); return false; } };
  // Prompt once per new exercise, using current state only in the response callback.
  useEffect(() => {
    const w = state?.active;
    if (!state || !w || tab !== 'Today') return;
    const planSession = state.plan?.sessions.find(x => x.id === w.sessionId);
    const selected = (w.targets || planSession?.items || [])[workoutExerciseIndex];
    if (!selected) return;
    const ids = firstTimeExerciseIds([...state.history,w], [selected.exerciseId], state.videoPromptsAnswered)
      .filter(id => demoLink(id, media) && !askedDemo.includes(`${w.id}:${id}`));
    const id = ids[0];
    if (!id) return;
    const link = demoLink(id, media);
    const mark = () => setAskedDemo(v => [...v, `${w.id}:${id}`]);
    const buttons: { text: string; style?: 'cancel'; onPress?: () => void }[] = [];
    if (link) buttons.push({ text: link.kind === 'video' ? 'Watch a demonstration' : 'Open the source page', onPress: () => { mark(); void Linking.openURL(link.url).catch(() => setError('Could not open the demonstration. Check your connection or use the exercise guide.')); } });
    buttons.push({ text: 'Not now', style: 'cancel', onPress: mark });
    buttons.push({ text: 'Don’t ask about this one', onPress: () => { mark();modify(v=>v.active?.id===w.id?{...v,videoPromptsAnswered:[...new Set([...(v.videoPromptsAnswered||[]),id])]}:v); } });
    Alert.alert(`New exercise: ${exFor(id, state.custom).name}`, 'Would you like to see a demonstration before your first set? Links open in your browser. Movefield does not play video itself.', buttons);
  // Only exercise transitions trigger a prompt; responses read the current state through modify.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.active?.id, workoutExerciseIndex, askedDemo, tab]);
  useEffect(()=>{if(error) AccessibilityInfo.announceForAccessibility(error);},[error]);
  useEffect(()=>{if(saveStatus.startsWith('Save failed')) AccessibilityInfo.announceForAccessibility(saveStatus);},[saveStatus]);
  const stageChange=(proposal:Proposal)=>{if(modify(s=>({...s,proposals:[proposal,...s.proposals]})))setChangePreview(proposal);};
  const openUrl = async (candidate?: string | null) => { const url = safeWebUrl(candidate); setLinkError(''); if (!url) { setLinkError('This reference is not an available web link.'); return; } try { await Linking.openURL(url); } catch { setLinkError('Could not open the link. Check your connection and try again.'); } };
  const openSubstitute=(sessionId:string,from:string)=>{const s=stateRef.current!;setError('');setSubEquipment('All');setSubstitution({sessionId,from,to:'',all:false,setup:'',allowLonger:false,acknowledgeSpecificity:false,planId:s.plan!.id,version:s.plan!.version,historyCount:s.history.length});};
  const openPreview = (id: string) => { const result = previewPlan(id); if (result.plan) setPreview(result.plan); else setError(result.errors.join(' ')); };
  const reset = async () => {
    if(!mountedRef.current||resettingRef.current||restoringRef.current)return;
    resettingRef.current=true;setResetting(true);privacyGeneration.current++;
    try{
      const privacy=await resetLocalState();
      if(!mountedRef.current)return;
      setPrivacyStatus(privacy);setReadError(null);setLocalNotice(privacy.state==='clear'?'Current saved records were reset.':'Current saved records were reset. Older local copies may remain.');
      commit(emptyDemo());setError('');setTab('Today');
    }catch{
      if(mountedRef.current){setError('Local storage could not be reset.');void refreshPrivacyStatus()}
    }finally{resettingRef.current=false;if(mountedRef.current)setResetting(false)}
  };

  useEffect(()=>{if(!exercise&&tab!=='Library')return;let alive=true;void loadNativeContent().then(()=>{if(alive)setNativeContentReady(true)}).catch(()=>{if(alive)setError('The detailed exercise guide could not load. Your workout is kept. Try opening it again.')});return()=>{alive=false}},[exercise,tab]);
  if (!state) return <SafeAreaView style={styles.safe}><View style={styles.content}><Heading eyebrow={brand.name.toUpperCase()} title={readError ? 'Saved data needs attention' : 'Opening your training'} />{readError ? <><Text style={styles.body}>{readError}</Text><Text style={styles.body}>Try reopening the app first. Reset retires this mobile demo’s current saved records. Older local copies may remain if safe removal cannot be confirmed.</Text><NativePrivacyNotice status={privacyStatus} busy={privacyBusy} onRetry={retryPrivacyCleanup}/><NativeTransferOpen onOpen={openTransfer}/><Text style={styles.small}>A recovery copy keeps available records in their current format. Older records may be unencrypted; keep this copy private. Use a transfer file to restore training.</Text><Button label="Export recovery copy" secondary onPress={()=>{void readLocalRaw().then(raw=>{if(raw===null)throw Error("No saved file was found.");return shareBackup(raw)}).catch(e=>setError(e instanceof Error?e.message:"The saved file could not be exported."))}}/>{error&&<Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}<Button label={resetting?'Resetting…':'Reset this demo'} disabled={resetting} onPress={() => setConfirm({ title: 'Reset local data?', message: 'This retires the mobile demo’s current saved plan and workouts. Older local copies may remain when safe removal cannot be confirmed. Export a recovery copy first if you need those records.', label: 'Reset current saved records', action: () => { void reset(); } })} /></> : <ActivityIndicator color={COLORS.green} />}<ModalFrame visible={!!confirm} close={() => setConfirm(null)} title={confirm?.title ?? ''}><Text style={styles.body}>{confirm?.message}</Text><Button label={confirm?.label ?? 'Continue'} onPress={() => { const action = confirm?.action; setConfirm(null); action?.(); }} /></ModalFrame></View></SafeAreaView>;

  const next = nextSession(state);
  const blocked = next ? eligibility(state, next) : null;
  const active = state.active;
  const todayDate=day(),calendarDates=trainingWeekDates(calendarReference);
  const dayDetails=!active&&calendarDate&&calendarDate!==todayDate?trainingDay(state,calendarDate,todayDate):null;
  const guide = exercise ? guides[exercise.id] : undefined;
  const externalMedia = exercise ? media[exercise.id] : undefined;
  const substitutionPreview=substitution?.to?previewSubstitution(state,substitution):null;

  const requestFinish = () => {
    const current = stateRef.current;
    if (current) setCheckin(workoutCheckin(current));
  };
  const saveCheckin = () => {
    if (!checkin || !checkin.symptom) return;
    if (modify(current => completeWorkoutCheckin(current, checkin))) setCheckin(null);
  };
  const updateSet = (index:WorkoutSetReference,patch:Partial<SetLog>)=>modify(s=>changeWorkoutSet(s,index,patch));
  const todayView = <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    {!active&&<><Heading eyebrow={(dayDetails?.dateLabel??niceDate(todayDate)).toUpperCase()} title={dayDetails?.heading??'Today'} />
      <Card><View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous calendar week" style={styles.inlineAction} onPress={()=>setCalendarReference(current=>addDays(current,-7))}><Text style={styles.link}>←</Text></Pressable>
        <Text style={[styles.small,{flex:1,textAlign:'center'}]}>{niceDate(calendarDates[0])} – {niceDate(calendarDates[6])}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next calendar week" style={styles.inlineAction} onPress={()=>setCalendarReference(current=>addDays(current,7))}><Text style={styles.link}>→</Text></Pressable>
      </View><View style={styles.calendarDates}>{calendarDates.map((date,index)=>{
        const selected=date===(dayDetails?.date??todayDate),recorded=state.history.some(workout=>workout.date===date&&workout.finishedAt!==undefined),scheduled=state.plan?.sessions.some(session=>session.date===date);
        return <Pressable key={date} accessibilityRole="button" accessibilityLabel={`${niceDate(date)}${date===todayDate?', Today':''}${recorded?', recorded workout':scheduled?', scheduled workout':''}`} accessibilityState={{selected}} onPress={()=>setCalendarDate(date===todayDate?null:date)} style={[styles.calendarDate,selected&&styles.pillSelected]}>
          <Text style={[styles.calendarWeekday,selected&&{color:COLORS.onAccent}]}>{weekdays[(index+1)%7]}</Text>
          <Text style={[styles.calendarNumber,selected&&{color:COLORS.onAccent}]}>{Number(date.slice(-2))}</Text>
          <Text style={[styles.calendarMark,selected&&{color:COLORS.onAccent}]}>{recorded?'●':scheduled?'○':' '}</Text>
        </Pressable>;
      })}</View></Card>
    </>}
    {dayDetails?<><Button label="Back to Today" secondary onPress={()=>{setCalendarDate(null);setCalendarReference(todayDate)}}/>
      {dayDetails.status==='rest'&&<Card><Text style={styles.sectionTitle}>Day off</Text><Text style={styles.body}>No workout is scheduled or recorded for this date.</Text></Card>}
      {dayDetails.workouts.map(record=><Card key={record.workout.id}>
        <Text style={styles.eyebrow}>RECORDED WORKOUT</Text><Text style={styles.sectionTitle}>{record.title}</Text>
        <Text style={styles.small}>{record.partial?'Partial workout':'Completed workout'} · {record.loggedSets} logged sets{record.elapsedMinutes!==null?` · ${record.elapsedMinutes} min`:''}</Text>
        {record.exercises.map(entry=><View key={entry.id} style={styles.setBlock}><Text style={styles.rowTitle}>{entry.name}</Text>
          {entry.sets.map(set=><View key={set.number} style={{gap:4}}><Text style={styles.body}>Set {set.number}: {set.amountText} · {set.load}</Text><Text style={styles.small}>Reps left (RIR): {set.rir}</Text>{!!set.details&&<Text style={styles.small}>{set.details}</Text>}</View>)}
          {!!entry.setup&&<Text style={styles.small}>Setup: {entry.setup}</Text>}{!!entry.notes&&<Text style={styles.small}>Notes: {entry.notes}</Text>}
        </View>)}
        {!record.loggedSets&&<Text style={styles.body}>No completed sets were logged in this saved workout.</Text>}
      </Card>)}
      {dayDetails.sessions.filter(entry=>!entry.recorded).map(entry=><Card key={`${entry.plan.id}-${entry.session.id}`}>
        <Text style={styles.eyebrow}>{dayDetails.relation==='future'?'SCHEDULED WORKOUT':'PLANNED WORKOUT'}</Text><Text style={styles.sectionTitle}>{entry.title}</Text>
        <Text style={styles.small}>{entry.session.minutes} min · {entry.archived?'Previous plan':'Current plan'}</Text>
        <Text style={styles.body}>{entry.session.status==='missed'?'Marked as skipped.':dayDetails.relation==='past'?'No saved workout was logged for this session.':'No workout has been logged for this session.'}</Text>
        {entry.targets.map(target=><View key={target.exerciseId} style={{gap:4}}><Text style={styles.body}>{target.name} · {target.target}</Text><Text style={styles.small}>{target.restSeconds}s rest{target.note?` · ${target.note}`:''}</Text></View>)}
      </Card>)}
      {!!dayDetails.events.length&&<Card><Text style={styles.sectionTitle}>Other commitments</Text>{dayDetails.events.map(event=><Text key={event.id} style={styles.body}>{event.name} · {event.minutes} min</Text>)}</Card>}
    </>:<>
    {state.hold&&<Card><Text style={styles.sectionTitle}>Recommendations are on hold</Text><Text style={styles.body}>You reported pain or an uncertain concern. Stop the affected activity and seek appropriate guidance. Your recorded work is kept.</Text><Text style={[styles.body, { fontWeight: '700' }]}>{SEEK_CARE_TEXT}</Text></Card>}
    {!state.plan && <><Card dark><Text style={styles.darkEyebrow}>START HERE</Text><Text style={styles.darkTitle}>Build your first plan.</Text><Text style={styles.darkBody}>Choose your goal, time and equipment. Review your own plan before starting.</Text><Button label="Build my plan" onPress={() => setPersonalSetup(true)} secondary /></Card><Text style={styles.body}>Personal plans are saved on this device. Real sign-in and website sync are not connected yet.</Text></>}
    {state.plan && !active && <><Card dark><Text style={styles.darkEyebrow}>{next ? (next.date === day() ? 'TODAY’S SESSION' : 'NEXT SESSION') : 'SCHEDULE FINISHED'}</Text><Text style={styles.darkTitle}>{next?sessionName(next,state.plan):'Review this block.'}</Text><Text style={styles.darkBody}>{next ? `${niceDate(next.date)} · ${next.minutes} min · Week ${next.week}` : `${state.plan.sessions.filter(x=>x.status==='completed').length} completed · ${state.plan.sessions.filter(x=>x.status==='partial').length} partial · ${state.plan.sessions.filter(x=>x.status==='missed').length} skipped. Your history is kept.`}</Text>{next && <><Text style={styles.darkBody}>{next.items.length} exercises · {next.items.reduce((n, x) => n + x.sets, 0)} working sets</Text><Button label={next.date > day() ? `Scheduled ${niceDate(next.date)}` : next.date < day() ? 'Review moving to today' : 'Start workout →'} disabled={next.date < day() ? state.plan.paused : !!blocked || next.date > day()} secondary onPress={() => {if(next.date < day()){const result=makeMoveProposal(stateRef.current!,next.id,day(),true);if(result.proposal)stageChange(result.proposal);else setError(result.error||'This move is unavailable.');return}setWorkoutExerciseIndex(0);modify(s => startWorkout(s, next.id))}} /></>}</Card>{blocked && <Card><Text style={styles.sectionTitle}>Review before continuing</Text><Text style={styles.body}>{blocked}</Text>{state.plan.paused&&<Button label="Resume plan" onPress={()=>modify(current=>setPlanPaused(current,state.plan!.id,state.plan!.version,false))}/>}<Text style={styles.small}>Review a shorter remaining block with the same dates. This does not provide medical return-to-training clearance.</Text>{next?.needsReview&&<Button label="Review displayed targets" secondary disabled={!makeContinuationReview(state,next.id)} onPress={()=>{const p=makeContinuationReview(stateRef.current!,next.id);if(p)stageChange(p);else setError('Complete this workout’s prerequisites before reviewing its unchanged targets.');}} />}<Button label="Review a shorter return block" secondary disabled={state.hold||state.plan.paused} onPress={()=>{const p=makeProposal(stateRef.current!,'return');if(p)stageChange(p);else setError('No recovery change is available.');}} /></Card>}{next && <Disclosure label="Move this workout"><Card><Text style={styles.sectionTitle}>Change a workout date</Text><Text style={styles.body}>Move this and later unstarted workouts together. Review every date before accepting.</Text><TextInput accessibilityLabel="New workout date YYYY-MM-DD" style={styles.input} value={moveDate} onChangeText={setMoveDate} placeholder="YYYY-MM-DD" autoCapitalize="none" maxLength={10}/><Button label="Preview date changes" secondary onPress={()=>{const r=makeMoveProposal(stateRef.current!,next.id,moveDate,true);if(r.proposal)stageChange(r.proposal);else setError(r.error||'This move is unavailable.');}} /></Card></Disclosure>}{next&&<Disclosure label="Warm-up & exercise preview"><Card><Text style={styles.sectionTitle}>Warm-up, effort & finish</Text>{sessionGuide(state.plan,next).warmup.map((line,i)=><Text style={styles.body} key={i}>{i+1}. {line}</Text>)}<Text style={styles.body}>{sessionGuide(state.plan,next).effort}</Text><Text style={styles.small}>{sessionGuide(state.plan,next).finish}</Text></Card>{next?.items.map(i => { const e = exFor(i.exerciseId,state.custom); return <View key={i.exerciseId}><Pressable accessibilityRole="button" onPress={() => setExercise(e)} style={styles.exerciseRow}><View style={styles.flex}><Text style={styles.rowTitle}>{e.name}</Text><Text style={styles.small}>{i.sets} × {targetText(i)} {e.metric} · {i.rest}s rest</Text></View><Text style={styles.link}>Guide</Text></Pressable>{substitutionOptions(e.id).length>0&&<Button label="Choose a substitute" secondary onPress={()=>openSubstitute(next.id,e.id)}/>}</View>; })}</Disclosure>}{!next && <Button label="Choose another block" onPress={() => setTab('Plan')} />}</>}
    {next&&state.plan?.profile.mode!=='app'&&!active&&<Card><Text style={styles.sectionTitle}>Your workout targets</Text><Text style={styles.body}>Enter or edit your coach’s or your own exercises before starting. No app-written progression is added.</Text><Button label={next.items.length?'Edit workout targets':'Add workout targets'} onPress={()=>setTrackingSession(next.id)}/></Card>}
    {state.plan?.profile.mode==='app'&&!active&&!state.hold&&<Disclosure label="Review progression"><Card><Text style={styles.sectionTitle}>Review progression</Text><Text style={styles.body}>Load changes need your approval. Enter available increments in an exercise guide. Equipment limits may offer a wider rep range for eligible muscle-focused work.</Text><Button secondary label="Preview a load or rep-range change" onPress={()=>{const r=makeLoadProposal(stateRef.current!);if(r.proposal)stageChange(r.proposal);else setError(r.error||'No change is ready.');}}/></Card></Disclosure>}
    {!active&&[...state.history].filter(w=>w.finishedAt).sort((a,b)=>(b.finishedAt||0)-(a.finishedAt||0)).slice(0,1).map(w=>{const r=reviewWorkout(state,w.id);return r?<Disclosure label="Last workout summary"><Card key={w.id}><Text style={styles.eyebrow}>WORKOUT SUMMARY</Text><Text style={styles.sectionTitle}>{r.summary}</Text><Text style={styles.small}>{AI_DISCLAIMER}</Text>{r.facts.map(f=><Text style={styles.body} key={f.id}>{f.text}</Text>)}<Text style={styles.body}>Next step: {r.next}</Text><Text style={styles.small}>This summary uses your saved workout and the app’s training rules. No AI model is connected and nothing is sent to an AI service.</Text></Card></Disclosure>:null})}
    {active && <>
      <Card dark><Text style={styles.darkEyebrow}>WORKOUT IN PROGRESS</Text><Text style={styles.darkTitle}>{workoutName(active,state)}</Text><Text style={styles.darkBody}>{active.sets.filter(x => x.done).length} / {active.sets.length} sets saved · enter what you completed</Text></Card>
      <Button label={showRestOptions?"Hide rest options":"Rest alerts & options"} secondary onPress={()=>setShowRestOptions(v=>!v)}/>{showRestOptions&&<Card><NativeRestClock timer={state.restTimer}/><Text style={styles.small}>Tap Log set after you finish. Rest starts right away.</Text>{state.restTimer&&<View style={[styles.row,{flexWrap:'wrap',rowGap:8,columnGap:8}]}><Button label={state.restTimer.pausedSeconds!==null?'Resume':'Pause'} secondary onPress={()=>modify(s=>({...s,restTimer:s.restTimer?(s.restTimer.pausedSeconds!==null?resumeRest(s.restTimer):pauseRest(s.restTimer)):null}))}/><Button label="+30 sec" secondary onPress={()=>modify(s=>({...s,restTimer:s.restTimer?extendRest(s.restTimer):null}))}/><Button label="End rest" secondary onPress={()=>modify(s=>({...s,restTimer:null}))}/></View>}<Button label={state.restAlerts?'Turn off rest alerts':'Enable rest alerts'} secondary onPress={()=>{if(state.restAlerts){modify(s=>({...s,restAlerts:false}));setAlertMessage('Rest alerts are off.')}else void enableRestAlerts().then(r=>{modify(s=>({...s,restAlerts:r.enabled}));setAlertMessage(r.message)})}}/>{(restAlertMessage||alertMessage)&&<Text accessibilityLiveRegion="polite" style={styles.small}>{restAlertMessage||alertMessage}</Text>}<Text style={styles.small}>Phone settings may silence or delay alerts. You can take more rest.</Text></Card>}
      {state.plan?.sessions.find(x => x.id === active.sessionId)?.runSteps && <Card><Text style={styles.sectionTitle}>Run / walk sequence</Text>{state.plan.sessions.find(x => x.id === active.sessionId)!.runSteps!.map((step, i) => <Text key={i} style={styles.body}>{i + 1}. {step.label} · {step.seconds / 60} min</Text>)}</Card>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>{(active.targets ?? state.plan?.sessions.find(x=>x.id===active.sessionId)?.items ?? []).map((target,i)=><Pill key={target.exerciseId} label={`${i+1}. ${exFor(target.exerciseId,state.custom).name}`} selected={i===workoutExerciseIndex} onPress={()=>setWorkoutExerciseIndex(i)}/>)}</ScrollView>
      {(active.targets ?? state.plan?.sessions.find(x=>x.id===active.sessionId)?.items ?? []).map((target,exerciseIndex) => {if(exerciseIndex!==workoutExerciseIndex)return null;
        const e = exFor(target.exerciseId,state.custom); const tracked = isLoadTracked(e);
        return <Card key={target.exerciseId}><View style={styles.row}><Text style={[styles.sectionTitle, styles.flex]}>{e.name}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Open ${e.name} guide`} onPress={() => setExercise(e)} style={styles.inlineAction}><Text style={styles.link}>Guide</Text></Pressable></View><Text style={styles.body}>Target: {target.sets} × {targetText(target)} {e.metric} · rest {target.rest}s</Text><Text style={styles.small}>{e.loadConvention}</Text>
          {isLoadTracked(e)&&<Text style={styles.small}>{(()=>{const a=loadSuggestion({...state,loadContext:{...state.loadContext,...active.loadContext}},target);return (a.kg===null?'Choose a manageable available load. ':displayLoad(a.kg,state.profile.units)+' · ')+a.reason})()}</Text>}{e.requiresSetup && <TextInput style={styles.input} placeholder="Machine / attachment / seat setting" placeholderTextColor={COLORS.muted} accessibilityLabel={`${e.name} machine setup`} value={active.loadContext?.[e.id] ?? ''} maxLength={200} editable={!active.sets.some(x=>x.exerciseId===e.id&&x.done)} onChangeText={text => modify(s => ({ ...s, incrementKg:{...s.incrementKg,[e.id]:0}, active: { ...s.active!, loadContext: { ...s.active!.loadContext, [e.id]: text } } }))} />}
          <Text style={styles.small}>Record each completed set. Reps left (RIR) is optional: 0 means none left with good form.</Text>
          {active.sets.map((set,index)=>set.exerciseId===e.id&&<View key={`${active.id}-${index}`} style={styles.setBlock}>
          <Text style={styles.rowTitle}>Set {set.set}</Text><View style={styles.setFields}>
          <View style={styles.setField}><Text style={styles.small}>Actual {e.metric}</Text><NumericField label={`${e.name} set ${set.set} actual ${e.metric}`} value={set.reps} max={9999} placeholder={e.metric === 'reps' ? targetText(target) : undefined} onChange={n => updateSet(workoutSetReference(active,set), { reps: n ?? 0, done: false })} /></View>{tracked && <View style={styles.setField}><Text style={styles.small}>Load ({state.profile.units})</Text><NumericField label={`${e.name} set ${set.set} actual load ${state.profile.units}`} nullable value={set.kg === null ? null : set.kg * (state.profile.units === 'lb' ? 2.2046226218 : 1)} max={state.profile.units === 'lb' ? 3306 : 1500} onChange={n => updateSet(workoutSetReference(active,set), { kg: n === null ? null : toKg(n, state.profile.units), done: false })} /></View>}<View style={styles.setField}><Text style={styles.small}>Reps left · 0–5</Text><NumericField label={`${e.name} set ${set.set} reps left, RIR 0 to 5`} nullable integer max={5} value={set.rir ?? null} placeholder="RIR" onChange={n => updateSet(workoutSetReference(active,set), { rir: n ?? undefined })} /></View></View><Pressable accessibilityRole="button" disabled={set.done} accessibilityState={{disabled:set.done}} accessibilityLabel={`${set.done?'Saved':'Log'} ${e.name} set ${set.set}`} onPress={()=>{if(set.done)return;const error=completedSetError(set.reps,set.kg,e.metric);if(error){setError(error);return}modify(s=>logWorkoutSet(s,workoutSetReference(active,set),target.rest));}} style={[styles.check,styles.setLogAction,set.done&&styles.checkDone]}><Text style={{color:set.done?COLORS.onAccent:COLORS.green,fontSize:14,fontWeight:'700'}}>{set.done?`Set ${set.set} saved`:`Log set ${set.set}`}</Text></Pressable>{set.done&&<Button secondary label={`Undo saved set ${set.set}`} onPress={()=>updateSet(workoutSetReference(active,set),{done:false})}/>}<OptionalSetDetails set={set} name={e.name} metric={e.metric} onChange={metrics => updateSet(workoutSetReference(active,set), { metrics })} /></View>)}
          <View style={{ gap: 6 }}><Text style={styles.small}>Notes for {e.name}</Text><TextInput accessibilityLabel={`${e.name} notes`} style={[styles.input, { minHeight: 64, textAlignVertical: 'top' }]} placeholder="Setup, how it felt, or anything to check next time" placeholderTextColor={COLORS.muted} multiline maxLength={1000} value={active.details?.[e.id]?.notes ?? ''} onChangeText={notes => modify(s => setExerciseNotes(s, e.id, notes))} /></View>
          {target.note && <Text style={styles.small}>{trainingCopy(target.note)}</Text>}{substitutionOptions(e.id).length>0&&<Button label="Choose a substitute" secondary onPress={()=>openSubstitute(active.sessionId,e.id)}/>}
        </Card>;
      })}
      <Card><Text style={styles.sectionTitle}>Quick check-in</Text><Text style={styles.body}>How did this workout feel?</Text><View style={[styles.row,{flexWrap:'wrap',rowGap:8,columnGap:8}]}>{[['unsure','Skip'],['easier','Easier'],['right','About right'],['harder','Harder']].map(([value,label])=><Pill key={value} label={label} selected={(active.effort||'unsure')===value} onPress={()=>modify(s=>({...s,active:{...s.active!,effort:value}}))}/>)}</View><Text style={styles.body}>Any pain or concern?</Text><View style={[styles.row,{flexWrap:'wrap',rowGap:8,columnGap:8}]}>{[['skip','Skip'],['no','No'],['yes','Yes'],['unsure','Unsure']].map(([value,label])=><Pill key={value} label={label} selected={(active.symptom||'skip')===value} onPress={()=>modify(s=>({...s,hold:value==='yes'||value==='unsure'?true:s.hold,active:{...s.active!,symptom:value}}))}/>)}</View>{state.profile.age<18&&<Button secondary label={active.supervisorConfirmed?'Supervision recorded':'Confirm qualified supervision today'} onPress={()=>modify(s=>({...s,active:{...s.active!,supervisorConfirmed:!s.active!.supervisorConfirmed}}))}/>}<Text style={styles.small}>A concern pauses automatic changes. You can save a partial workout.</Text></Card>
      <Button label="Discard this workout" secondary onPress={() => setConfirm({ title: 'Discard current workout?', message: 'The active set entries will be removed. Existing history is kept, and this session stays scheduled.', label: 'Discard workout', action: () => { modify(s=>({...s,active:null,restTimer:null})); } })} />
    </>}
    </>}
    <Text style={styles.footnote}>Local demo · No account or website sync. Data stays in this app’s local storage.</Text>
  </ScrollView>;

  const planView = <ScrollView ref={planScroll} contentContainerStyle={styles.content}><Heading eyebrow="FIND YOUR FOCUS" title="Find your next plan." detail="See the workouts, equipment and experience needed before choosing a plan." />
    {state.plan && <Card><Text style={styles.eyebrow}>YOUR CURRENT BLOCK</Text><Text style={styles.sectionTitle}>{planName(state.plan)}</Text><Text style={styles.body}>{state.plan.profile.days.map(x => weekdays[x]).join(' · ')} · {state.plan.sessions.length} sessions</Text><Text style={styles.small}>{trainingCopy(state.plan.progression)}</Text><Button label={state.plan.paused?'Resume plan':'Pause plan'} secondary disabled={!!active} onPress={()=>modify(current=>setPlanPaused(current,state.plan!.id,state.plan!.version,!state.plan!.paused))}/><Text style={styles.small}>Pausing keeps your dates and history. After resuming, review moving any overdue workout before starting.</Text>{active&&<Text style={styles.small}>Finish or discard your active workout before pausing.</Text>}</Card>}
    <Button label="Build a plan for my goals" onPress={()=>setPersonalSetup(true)}/><Text style={styles.body}>Below are four-week adult sample plans, not a personalized prescription. Experience, equipment, and running readiness shown below are assumptions to review.</Text>
    <Text onLayout={e=>{trainingStyleY.current=e.nativeEvent.layout.y}} style={styles.sectionTitle}>Training style</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>{goals.map(([id,label])=><Pill key={id} label={label} selected={planGoal===id} onPress={()=>{setPlanGoal(id);setSelectedPlan(null);setPreview(null);setError('');planScroll.current?.scrollTo({y:Math.max(0,trainingStyleY.current-8),animated:false});}}/>)}</ScrollView>
    {planGoal==='running'&&<Card><Text style={styles.sectionTitle}>NHS Couch to 5K · run/walk plan</Text><Text style={styles.body}>Start with the NHS run/walk sequence. Three separated days. This preview covers its first four weeks.</Text><Button label="Preview beginner run/walk" secondary onPress={()=>openPreview(RUN_WALK)}/></Card>}
    {planGoal==='sport'&&<Card><Text style={styles.sectionTitle}>Sport · General strength foundation</Text><Text style={styles.body}>General strength only. Position-specific drills and sport-specific competition plans are not available in this starter.</Text><Button label="Preview general sport foundation" secondary onPress={()=>openPreview(SPORT_FOUNDATION)}/></Card>}
    {programCatalog.filter(p=>p.goal===planGoal).map(p => { const isSel = selectedPlan === p.id; return <View key={p.id} style={{ gap: 8 }} onLayout={e => { planCardY.current[p.id] = e.nativeEvent.layout.y; }}><Pressable accessibilityRole="radio" accessibilityState={{ selected: isSel }} accessibilityLabel={`${p.name}. ${p.days} days.`} onPress={() => { setSelectedPlan(p.id); planScroll.current?.scrollTo({ y: Math.max(0, (planCardY.current[p.id] ?? 0) - 8), animated: false }); }} style={isSel ? { borderWidth: 2, borderColor: COLORS.green, borderRadius: 18 } : undefined}><Card><Text style={styles.sectionTitle}>{p.name}</Text><Text style={styles.small}>{p.days} days · up to {Math.max(...(previewPlan(p.id).plan?.sessions.map(x=>x.minutes)||[p.minutes]))} min · {p.goal==='running'?'Run route':p.equipment==='flexible'?'Gym or dumbbells':programEquipment(p)} · {p.experience==='all'?'Beginner-friendly':p.experience==='some'?'Some experience':'Advanced'}</Text>{isSel && <Text style={[styles.small, { color: COLORS.green, fontWeight: '700' }]}>Selected</Text>}</Card></Pressable>{isSel && <Button label={`Review and confirm ${p.name}`} onPress={() => openPreview(p.id)} />}</View>; })}
    {!selectedPlan && programCatalog.some(p => p.goal === planGoal) && <Text style={styles.small}>Choose a plan to see its workouts and confirm it.</Text>}
    {programReferences.some(p=>p.goal===planGoal)&&<Disclosure label="Programs from their authors"><Text style={styles.sectionTitle}>Named routines from their authors</Text><Text style={styles.body}>Prefilled routines use manual loads and progression. Other sources open an empty tracking calendar. Review required supports and any variations.</Text>{programReferences.filter(p=>referenceMatchesGoal(p,planGoal)).sort((a,b)=>Number(!!b.workouts)-Number(!!a.workouts)).map(p=><Card key={p.id}><Text style={styles.sectionTitle}>{p.name}</Text><Text style={styles.body}>{p.author} · {p.days} days/week · {p.weeks?p.weeks+' weeks':'ongoing'}</Text><Text style={styles.body}>{p.description}</Text><Text style={styles.small}>{p.experience} · {referenceEquipment(p)} · source checked {p.checked}</Text><Button label="View original program" secondary onPress={()=>{void openUrl(p.url);}}/><Button label={p.workouts?"Review source template":"Track my copy"} onPress={()=>{setSetupProgramId(p.id);setPersonalSetup(true)}}/></Card>)}</Disclosure>}{linkError&&<Text accessibilityRole="alert" style={styles.errorText}>{linkError}</Text>}

  </ScrollView>;

  const libraryView = <View style={styles.flex}><View style={[styles.content, { paddingBottom: 0 }]}><Heading eyebrow="EXERCISE LIBRARY" title="Exercise library." detail="Search by name, movement or muscle. Equipment filters match the listed equipment." /><TextInput accessibilityLabel="Search exercise library" style={styles.input} placeholder="Search exercises…" placeholderTextColor={COLORS.muted} value={search} onChangeText={setSearch} autoCapitalize="none" autoCorrect={false} clearButtonMode="while-editing" /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>{equipmentOptions.map(e => <Pill key={e} label={e} selected={equipment === e} onPress={() => setEquipment(e)} />)}</ScrollView><Button label="Search research papers" secondary onPress={()=>setResearchOpen(true)}/><Text style={styles.small}>{filtered.length} of {library.length} exercises · {nativeContentReady?Object.keys(guides).length:'On-demand'} detailed guides</Text></View>
    <FlatList data={filtered} keyExtractor={x => x.id} contentContainerStyle={[styles.content, { paddingTop: 4 }]} keyboardShouldPersistTaps="handled" ListHeaderComponent={<View style={{ marginBottom: 16 }}><Disclosure label="Plate calculator & warm-up loads"><NativeTrainingTools units={state.profile.units} adult={state.profile.age >= 18} /></Disclosure></View>} initialNumToRender={15} ListEmptyComponent={<Card><Text style={styles.sectionTitle}>No matches yet.</Text><Text style={styles.body}>Try a shorter name or choose All equipment.</Text><Button label="Clear filters" secondary onPress={() => { setSearch(''); setEquipment('All'); }} /></Card>} renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.name} guide`} onPress={() => setExercise(item)} style={styles.exerciseRow}><View style={styles.flex}><Text style={styles.rowTitle}>{item.name}</Text><Text style={styles.small}>{item.equipment} · {item.pattern}</Text><Text style={styles.guideLabel}>{guides[item.id] ? 'STEP-BY-STEP GUIDE' : 'QUICK CUES'}</Text></View><Text style={styles.arrow}>↗</Text></Pressable>} />
  </View>;

  const historyView = <ScrollView contentContainerStyle={styles.content}><Heading eyebrow="YOUR WORK, RECORDED" title="Look how far you’ve come." detail="Review the workouts and sets you have saved." /><View style={styles.stats}><Card grow><Text style={styles.statNumber}>{state.history.length}</Text><Text style={styles.small}>saved workouts</Text></Card><Card grow><Text style={styles.statNumber}>{state.history.reduce((n, w) => n + w.sets.filter(x => x.done).length, 0)}</Text><Text style={styles.small}>completed sets</Text></Card></View>
    <NativeWeeklyReview state={state} today={day()} units={state.profile.units} />
    {!state.history.length && <Card><Text style={styles.sectionTitle}>Your story starts with one session.</Text><Text style={styles.body}>Choose a plan, enter what you actually do, and save your first workout.</Text><Button label="Back to Today" onPress={() => setTab('Today')} /></Card>}
    {sortWorkoutHistory(state.history).map(w => <Pressable accessibilityRole="button" key={w.id} style={styles.exerciseRow} onPress={() => setHistoryItem(w)}><View style={styles.flex}><Text style={styles.rowTitle}>{workoutName(w,state)}</Text><Text style={styles.small}>{niceDate(w.date)} · {w.sets.filter(x => x.done).length} sets · {w.partial ? 'Partial' : 'Completed'}</Text></View><Text style={styles.link}>View</Text></Pressable>)}
    <NativeEquipmentLimit state={state} onSave={modify}/><Card><Text style={styles.sectionTitle}>Your local demo</Text><Text style={styles.body}>There is no sign-in or cloud backup in this starter. This phone and the website keep separate data.</Text><Text style={styles.small}>Choose pounds or kilograms. Finish or discard your active workout before changing units.</Text><View style={styles.pills}>{(['lb', 'kg'] as const).map(unit => <Pill key={unit} label={unit} selected={state.profile.units === unit} onPress={() => active ? setError('Finish or discard the workout before changing units.') : modify(s => ({ ...s, profile: { ...s.profile, units: unit } }))} />)}</View><Button label="Reset local demo data" secondary onPress={() => setConfirm({ title: 'Reset this device’s demo data?', message: 'This retires the current saved plan, workout history and active workout. Older local copies may remain when safe removal cannot be confirmed. Export a recovery copy first if needed. The website is unaffected.', label: 'Reset current saved records', action: () => { void reset(); } })} /></Card>
  </ScrollView>;

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}><StatusBar style={appearance.dark?"light":"dark"} /><View style={styles.brandBar}><View><Text style={styles.brand}>{brand.name}</Text><Text style={styles.brandSub}>{brand.tagline}</Text></View><View style={styles.demoBadge}><Text style={styles.demoText}>LOCAL DEMO</Text></View></View>
    {error ? <Pressable accessibilityRole="button" onPress={() => setError('')} style={styles.error}><Text style={styles.errorText}>{error}</Text><Text style={styles.small}>Tap to dismiss</Text></Pressable> : null}
    {resetting&&<Text accessibilityLiveRegion="polite" style={styles.body}>Resetting local data…</Text>}{localNotice&&<Text accessibilityLiveRegion="polite" style={styles.body}>{localNotice}</Text>}<KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{tab === 'Today' ? todayView : tab === 'Plan' ? planView : tab === 'Library' ? libraryView : tab === 'Settings' ? <NativeSettings reminderMessage={workoutReminderMessage} recoveryMessage={saveFailure?.message} privacyStatus={privacyStatus} privacyBusy={privacyBusy||resetting} onRetryPrivacyCleanup={retryPrivacyCleanup} onExport={exportBackup} onMakeTransfer={makeTransfer} onOpenTransfer={openTransfer}/> : historyView}
    {active&&tab==='Today'&&<View style={styles.workoutBar}>
      <View style={styles.workoutRestRow}><Text style={styles.small}>{active.sets.filter(x=>x.done).length}/{active.sets.length} logged</Text><NativeRestClock timer={state.restTimer} compact/>{state.restTimer&&<><Pill label={state.restTimer.pausedSeconds!==null?'Resume rest':'Pause rest'} selected={false} onPress={()=>modify(s=>({...s,restTimer:s.restTimer?(s.restTimer.pausedSeconds!==null?resumeRest(s.restTimer):pauseRest(s.restTimer)):null}))}/><Pill label="+30 sec" selected={false} onPress={()=>modify(s=>({...s,restTimer:s.restTimer?extendRest(s.restTimer):null}))}/></>}</View>
      <Button label="Finish & save workout" onPress={requestFinish}/>
    </View>}
    </KeyboardAvoidingView>
    {saveFailure?<View style={styles.saveRecovery}>
      <Text accessibilityRole="alert" style={styles.errorText}>{saveFailure.kind==='capacity'?'Local save limit reached':'Your latest changes need saving'}</Text>
      <Text style={styles.small}>{saveFailure.message}</Text>
      <View style={styles.saveRecoveryActions}>
        {saveFailure.kind!=='capacity'&&<Button label="Retry save" secondary onPress={()=>modify(s=>({...s}))}/>}
        <Button label="Export current records" secondary onPress={()=>{setTab('Settings');setError('');}}/>
      </View>
    </View>:<Text accessibilityLiveRegion="polite" style={styles.saveStatus}>{saveStatus}</Text>}
    {tab!=='Settings'&&<NativePrivacyNotice status={privacyStatus} compact/>}
    <NativeResearchLibrary visible={researchOpen} close={()=>setResearchOpen(false)}/><View style={styles.tabs}>{(['Today', 'Plan', 'Library', 'History', 'Settings'] as const).map((label, i) => <Pressable accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: tab === label }} key={label} onPress={() => { setTab(label); setError(''); }} style={[styles.tab, tab === label && styles.activeTab]}><Text style={[styles.tabIcon, tab === label && { color: COLORS.green }]}>{['◉', '▤', '⌕', '◷', '⚙'][i]}</Text><Text style={[styles.tabLabel, tab === label && { color: COLORS.green, fontWeight: '800' }]}>{label}</Text></Pressable>)}</View>

    <ModalFrame visible={!!trackingSession} close={()=>setTrackingSession('')} title="Workout targets">{trackingSession&&state.plan?.sessions.some(x=>x.id===trackingSession)&&<SessionEditor key={trackingSession} state={state} sessionId={trackingSession} onSave={edit=>{const r=applyTrackingEdit(stateRef.current!,edit);if(r.error)return r.error;if(modify(()=>r.state)){setTrackingSession('');return}return 'This workout could not be saved.';}}/>}</ModalFrame>
    <ModalFrame visible={personalSetup} close={()=>{setPersonalSetup(false);setSetupProgramId(undefined)}} title="Your plan setup" scrollRef={setupScroll}>{personalSetup&&<PlanSetup state={state} scrollRef={setupScroll} initialProgramId={setupProgramId} onAccept={(profile,plan,events)=>{const r=acceptSetup(stateRef.current!,profile,plan,events);if(r.error)return r.error;if(modify(()=>r.state)){setPersonalSetup(false);setSetupProgramId(undefined);setTab('Today');return}return 'This plan could not be saved. Check your entries.';}}/>}</ModalFrame>
    <ModalFrame visible={!!exercise} close={() => setExercise(null)} title="Exercise guide">
      {linkError&&<Text accessibilityRole="alert" style={styles.errorText}>{linkError}</Text>}{exercise && <><Text style={styles.eyebrow}>{exercise.equipment} · {exercise.pattern}</Text><Text style={styles.title}>{exercise.name}</Text><Text style={styles.body}>{guide?.summary ?? 'A full guide is not available yet. These are the saved movement cues.'}</Text><Card><Text style={styles.sectionTitle}>{guide ? 'Quick cues' : 'Movement cues'}</Text>{(guide?.quickCues ?? exercise.cues).map((cue, i) => <Text key={i} style={styles.body}>• {cue}</Text>)}</Card>
        {exercise&&isLoadTracked(exercise)&&<NativeEquipmentLimit state={state} exercise={exercise} onSave={modify}/>} {guide && <>{[['Equipment', guide.equipment], ['Set up', guide.setup], ['Perform the movement', guide.execution], ['Finish safely', guide.finish], ['Breathing', guide.breathing], ['Common errors & fixes', guide.commonErrors]].map(([title, lines]) => <Card key={title as string}><Text style={styles.sectionTitle}>{title as string}</Text>{(lines as string[]).map((line, i) => <Text key={i} style={styles.body}>{i + 1}. {line}</Text>)}</Card>)}<Card><Text style={styles.sectionTitle}>Make it easier</Text><Text style={styles.body}>{guide.easierOption}</Text><Text style={styles.sectionTitle}>Safety</Text><Text style={styles.body}>{guide.safety}</Text></Card>{!!guide.terms?.length && <Card><Text style={styles.sectionTitle}>Workout terms</Text>{guide.terms.map(t => <Text key={t.term} style={styles.body}><Text style={{ fontWeight: '700' }}>{t.term}: </Text>{t.meaning}</Text>)}</Card>}</>}
        <Card><Text style={styles.sectionTitle}>How to log it</Text><Text style={styles.body}>{guide?.loadConvention ?? exercise.loadConvention ?? 'Record the actual amount; no automatic load progression is configured.'}</Text></Card>
        {!!externalMedia?.hasVideo && !!safeWebUrl(externalMedia.videoUrl) && <Button label="Open reference video ↗" secondary onPress={() => { void openUrl(externalMedia.videoUrl); }} />}
        <Text style={styles.small}>{guide?.sourceNote ?? 'These cues have not been independently reviewed by a trainer.'}</Text><Text style={styles.small}>{guide?.capability ?? 'Instruction only; the app cannot assess your form.'}</Text>
        {(guide?.sourceURLs ?? [externalMedia?.sourceUrl, exercise.source].filter((x): x is string => !!x)).filter(url => safeWebUrl(url)).map((url, i) => <Pressable accessibilityRole="link" key={`${url}-${i}`} onPress={() => { void openUrl(url); }} style={styles.source}><Text style={styles.link}>Source {i + 1} ↗</Text><Text style={styles.small}>{url}</Text></Pressable>)}
      </>}
    </ModalFrame>
    <ModalFrame visible={!!preview} close={() => setPreview(null)} title="Plan preview">
      {preview && <><Text style={styles.title}>{planName(preview)}</Text><Text style={styles.body}>{preview.sessions.length} sessions · 4 weeks · {preview.profile.days.map(x => weekdays[x]).join(' / ')}</Text><Card><Text style={styles.sectionTitle}>Review the sample assumptions</Text><Text style={styles.body}>Adult age 28 · {preview.profile.experience} · {preview.profile.equipment} · up to {preview.profile.minutes} minutes</Text>{preview.profile.runBase && <Text style={styles.body}>An existing comfortable 30-minute running base is assumed.</Text>}<Text style={styles.small}>The app has not assessed your readiness. These values are a demo configuration; Use Build my plan to enter your own choices.</Text></Card>{preview.notes.map((note, i) => <Text key={i} style={styles.body}>{note}</Text>)}<Text style={styles.sectionTitle}>Week one</Text>{preview.sessions.filter(s => s.week === 1).map(s => <Card key={s.id}><Text style={styles.sectionTitle}>{sessionName(s,preview)}</Text><Text style={styles.small}>{niceDate(s.date)} · {s.minutes} minutes</Text>{s.items.map(item => <Text key={item.exerciseId} style={styles.body}>{exFor(item.exerciseId,state.custom).name} · {item.sets} × {targetText(item)} {exFor(item.exerciseId,state.custom).metric}</Text>)}</Card>)}<Text style={styles.body}>{trainingCopy(preview.progression)}</Text><Button disabled={!!active} label={state.plan ? 'Use this sample plan · keep history' : 'Use this sample plan'} onPress={() => { if(modify(s => adoptPlan(s, preview))){setPreview(null);setTab('Today');} }} />{active && <Text style={styles.small}>Finish or discard your active workout first.</Text>}</>}
    </ModalFrame>
    <ModalFrame visible={!!historyItem} close={() => setHistoryItem(null)} title="Workout record">
      {historyItem && <><Text style={styles.title}>{workoutName(historyItem,state)}</Text><Text style={styles.body}>{niceDate(historyItem.date)} · {historyItem.partial ? 'Partial workout' : 'Completed workout'}</Text><Text style={styles.small}>Saved on this device. The app cannot assess your form or fitness from this record.</Text>{Array.from(new Set(historyItem.sets.map(x => x.exerciseId))).map(id => <Card key={id}><Text style={styles.sectionTitle}>{exFor(id,state.custom).name}</Text>{historyItem.sets.filter(x => x.exerciseId === id).map(x => <View key={x.set} style={{ gap: 5 }}><Text style={styles.body}>Set {x.set}: {x.done ? `${x.reps} ${exFor(id,state.custom).metric}${isLoadTracked(exFor(id,state.custom)) ? ` · ${x.kg === null ? 'Load unknown' : displayLoad(x.kg, state.profile.units)}` : ''}` : 'Not completed'}</Text><RecordedMetrics metrics={x.metrics} />{x.rir !== undefined && <Text style={styles.small}>Reps left (RIR): {x.rir ?? 'unsure'}</Text>}</View>)}{historyItem.loadContext?.[id] && <Text style={styles.small}>Setup: {historyItem.loadContext[id]}</Text>}{historyItem.details?.[id]?.notes && <Text style={styles.small}>Notes: {historyItem.details[id]?.notes}</Text>}</Card>)}</>}
    </ModalFrame>
    <ModalFrame visible={!!changePreview} close={()=>setChangePreview(null)} title="Review proposed change">
      {changePreview&&<><Text style={styles.sectionTitle}>{changePreview.title}</Text><Text style={styles.body}>{changePreview.reason}</Text><Text style={styles.body}>Current: {changePreview.before}</Text><Text style={styles.body}>Proposed: {changePreview.after}</Text>{changePreview.changes?.map(c=><View key={c.sessionId}><Text style={styles.body}>{niceDate(state.plan!.sessions.find(x=>x.id===c.sessionId)!.date)}{c.patch.date?' → '+niceDate(c.patch.date):''}{c.patch.minutes?' · '+c.patch.minutes+' min':''}</Text>{c.patch.items?.map(i=><Text style={styles.small} key={i.exerciseId}>{exFor(i.exerciseId,state.custom).name} · {i.sets} × {targetText(i)}</Text>)}</View>)}{changePreview.warnings?.map((w,i)=><Text key={i} style={styles.body}>{w}</Text>)}{error&&<Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}<Button label="Accept change" onPress={()=>{if(modify(s=>{const r=applyProposal(s,changePreview.id);if(r.error)throw new Error(r.error);return r.state;}))setChangePreview(null);}}/><Button label="Decline change" secondary onPress={()=>{if(modify(s=>({...s,proposals:s.proposals.map(p=>p.id===changePreview.id?{...p,status:'declined'}:p)})))setChangePreview(null);}}/></>}
    </ModalFrame>
    <ModalFrame visible={!!substitution} close={()=>setSubstitution(null)} title="Choose a substitute">
      {substitution&&<><Text style={styles.sectionTitle}>{exFor(substitution.from,state.custom).name}</Text>{!substitution.to?<><Text style={styles.body}>Choose available equipment. These are practical alternatives; loads and results stay separate.</Text><ScrollView horizontal contentContainerStyle={styles.pills}>{['All',...new Set(substitutionOptions(substitution.from).map(e=>e.equipment))].map(eq=><Pill key={eq} label={eq} selected={subEquipment===eq} onPress={()=>setSubEquipment(eq)}/>)}</ScrollView>{substitutionOptions(substitution.from).filter(e=>subEquipment==='All'||e.equipment===subEquipment).map(e=><Button key={e.id} secondary label={e.name+' · '+e.equipment} onPress={()=>{setError('');setSubstitution({...substitution,to:e.id,setup:'',acknowledgeSpecificity:false,allowLonger:false});}}/>)}</>:<><Text style={styles.sectionTitle}>Proposed: {exFor(substitution.to,state.custom).name}</Text><Text style={styles.body}>Record: {exFor(substitution.to,state.custom).loadConvention}</Text>{substitutionPreview?.changes.map(c=><Text style={styles.body} key={c.sessionId}>{niceDate(c.date)} · {c.item.sets} × {targetText(c.item)} {exFor(substitution.to,state.custom).metric} · {c.item.rest}s rest · {c.before} to {c.after} minutes</Text>)}{exFor(substitution.to,state.custom).requiresSetup&&<TextInput style={styles.input} accessibilityLabel="Substitute machine setup" placeholder="Machine, attachment and settings" maxLength={200} value={substitution.setup} onChangeText={setup=>setSubstitution({...substitution,setup})}/>}<Button secondary label={substitution.all?'Scope: future repeats of this workout':'Scope: this workout only'} onPress={()=>setSubstitution({...substitution,all:!substitution.all})}/>{substitutionPreview?.warnings.map(w=><Text key={w} style={styles.body}>{w}</Text>)}{substitutionPreview?.specificity&&<Button secondary label={substitution.acknowledgeSpecificity?'Confirmed: competition practice is replaced':'Confirm competition practice is replaced'} onPress={()=>setSubstitution({...substitution,acknowledgeSpecificity:!substitution.acknowledgeSpecificity})}/>}<Button secondary label={substitution.allowLonger?'Extra time allowed':'Allow extra session time if needed'} onPress={()=>setSubstitution({...substitution,allowLonger:!substitution.allowLonger})}/>{error&&<Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}<Button label="Accept substitute" onPress={()=>{if(modify(s=>{const r=applySubstitution(s,substitution);if(r.error)throw new Error(r.error);return r.state;}))setSubstitution(null);}}/><Button secondary label="Choose another" onPress={()=>{setError('');setSubstitution({...substitution,to:''});}}/></>}</>}
    </ModalFrame>
    <ModalFrame visible={!!checkin} close={() => setCheckin(null)} title="Quick check-in">
      <Text style={styles.body}>Before saving, tell us how you feel. Your answer decides whether automated recommendations stay on.</Text>
      <Text style={styles.sectionTitle}>Any pain or concerning symptoms? (required)</Text>
      {([['no', 'No'], ['yes', 'Yes'], ['unsure', 'Not sure']] as const).map(([value, label]) => <Button key={value} label={(checkin?.symptom === value ? '✓ ' : '') + label} secondary={checkin?.symptom !== value} onPress={() => setCheckin(c => c && { ...c, symptom: value })} />)}
      {(checkin?.symptom === 'yes' || checkin?.symptom === 'unsure') && <Text style={styles.body}>Automated recommendations will be held. Stop the affected activity and seek qualified guidance. Your logged work is kept.</Text>}
      {(checkin?.symptom === 'yes' || checkin?.symptom === 'unsure') && <Text style={[styles.body, { fontWeight: '700' }]}>{SEEK_CARE_TEXT}</Text>}
      <Text style={styles.sectionTitle}>How did the effort feel? (optional)</Text>
      {([['easier', 'Easier than expected'], ['right', 'About right'], ['harder', 'Harder than expected'], ['', 'Skip']] as const).map(([value, label]) => <Button key={label} label={(checkin?.effort === value && value !== '' ? '✓ ' : '') + label} secondary={checkin?.effort !== value} onPress={() => setCheckin(c => c && { ...c, effort: value })} />)}
      <Button label="Save workout" disabled={!checkin?.symptom} onPress={saveCheckin} />
      <Button label="Keep editing" secondary onPress={() => setCheckin(null)} />
    </ModalFrame>
    <ModalFrame visible={!!confirm} close={() => setConfirm(null)} title={confirm?.title ?? ''}><Text style={styles.body}>{confirm?.message}</Text><Button label={confirm?.label ?? 'Continue'} onPress={() => { const action = confirm?.action; setConfirm(null); action?.(); }} /><Button label="Keep editing" secondary onPress={() => setConfirm(null)} /></ModalFrame>
  </SafeAreaView>;
}
export default function App() { return <SafeAreaProvider><NativeAppearanceProvider><TrainingApp /></NativeAppearanceProvider></SafeAreaProvider>; }

const baseStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg }, flex: { flex: 1 }, content: { padding: 16, gap: 12, paddingBottom: 24 },
  brandBar: { paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomColor: COLORS.line, borderBottomWidth: 1 },
  brand: { color: COLORS.ink, fontSize: 11, letterSpacing: 2.5, fontWeight: '800' }, brandSub: { color: COLORS.ink, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }, demoBadge: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: COLORS.pale, borderRadius: 20 }, demoText: { fontSize: 12, letterSpacing: 0.8, color: COLORS.green, fontWeight: '800' },
  heading: { gap: 6, marginTop: 4, marginBottom: 0 }, eyebrow: { color: COLORS.green, fontSize: 12, letterSpacing: 1.7, fontWeight: '800' }, title: { fontSize: 26, lineHeight: 31, color: COLORS.ink, fontWeight: '800', letterSpacing: -1.1 }, body: { color: COLORS.ink, fontSize: 15, lineHeight: 22 }, small: { color: COLORS.muted, fontSize: 14, lineHeight: 21 }, footnote: { color: COLORS.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  card: { minWidth:0, backgroundColor: COLORS.white, padding: 12, gap: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.line }, darkCard: { backgroundColor: COLORS.green, borderColor: COLORS.green, padding: 14 }, darkEyebrow: { color: '#D4E3C6', fontSize: 12, letterSpacing: 1.8, fontWeight: '800' }, darkTitle: { fontSize: 23, lineHeight: 28, fontWeight: '800', color: COLORS.onAccent, letterSpacing: -0.7 }, darkBody: { color: '#E5ECDC', fontSize: 14, lineHeight: 22 }, sectionTitle: { fontSize: 19, lineHeight: 25, fontWeight: '700', color: COLORS.ink },
  button: { backgroundColor: COLORS.green, paddingHorizontal: 18, paddingVertical: 11, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }, secondaryButton: { backgroundColor: COLORS.pale }, buttonText: { color: COLORS.onAccent, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, exerciseRow: { paddingVertical: 12, paddingHorizontal: 4, flexDirection: 'row', gap: 14, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.line }, rowTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22, color: COLORS.ink, marginBottom: 4 }, link: { color: COLORS.green, fontSize: 14, fontWeight: '700' }, arrow: { fontSize: 26, color: COLORS.green }, guideLabel: { marginTop: 6, fontSize: 12, letterSpacing: 1, color: COLORS.green, fontWeight: '700' },
  input: { paddingHorizontal: 16, paddingVertical: 10, minHeight: 44, color: COLORS.ink, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, fontSize: 15 }, pills: { flexDirection: 'row', gap: 7, paddingVertical: 4 }, pill: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: COLORS.pale, minHeight: 44 }, pillSelected: { backgroundColor: COLORS.green }, pillText: { color: COLORS.green, fontSize: 14, fontWeight: '700' },
  calendarDates: { flexDirection: 'row', gap: 5 }, calendarDate: { flex: 1, minWidth: 0, minHeight: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: COLORS.pale }, calendarWeekday: { color: COLORS.green, fontSize: 11, fontWeight: '700' }, calendarNumber: { color: COLORS.green, fontSize: 18, fontWeight: '800' }, calendarMark: { color: COLORS.green, fontSize: 10 },
  workoutBar: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.line }, workoutRestRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }, setFields: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, setField: { flex: 1, minWidth: 100, gap: 6 }, setLogAction: { alignSelf: 'stretch', marginTop: 4 },
  setBlock: { gap: 10, paddingVertical: 12, borderBottomColor: COLORS.line, borderBottomWidth: 1 }, detailsToggle: { minHeight: 48, justifyContent: 'center' }, optionalFields: { gap: 12, padding: 12, borderRadius: 10, backgroundColor: COLORS.bg }, setHeader: { flexDirection: 'row', gap: 10, marginTop: 6 }, setRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }, numberInput: { flex: 1, minWidth: 54, minHeight: 48, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.bg, borderRadius: 9, color: COLORS.ink, fontSize: 17, textAlign: 'center', padding: 8 }, check: { minWidth: 64, minHeight: 48, padding: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.pale, borderRadius: 9 }, checkDone: { backgroundColor: COLORS.green },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.line, paddingHorizontal: 10, paddingTop: 6, paddingBottom: 4, backgroundColor: COLORS.white }, tab: { flex: 1, minWidth:0, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 13 }, activeTab: { backgroundColor: '#EFF3E8' }, tabIcon: { fontSize: 21, color: COLORS.muted }, tabLabel: { fontSize: 12, color: COLORS.muted }, saveStatus: { color: COLORS.muted, fontSize: 12, textAlign: 'center', paddingVertical: 4 },
  saveRecovery: { padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: COLORS.line, backgroundColor: COLORS.white },
  saveRecoveryActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  inlineAction: { minHeight: 44, minWidth: 44, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  modalHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20 }, modalTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.ink }, source: { paddingVertical: 10, gap: 5 }, stats: { flexDirection: 'row', gap: 12 }, statNumber: { fontSize: 36, fontWeight: '800', color: COLORS.green }, error: { paddingHorizontal: 22, paddingVertical: 12, backgroundColor: '#F6E3DC' }, errorText: { color: COLORS.danger, fontSize: 13, lineHeight: 18 }
});
