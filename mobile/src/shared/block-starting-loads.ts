import {type State,type Plan,type Item,type Exercise,exFor,isLoadTracked,requiresSetup,equipmentLimit,comparableSet,day,dayDistance,validDay} from './training';
import {equipmentFit} from './equipment';

export type StartingLoadChoice={sessionId:string;exerciseId:string;kg:number|null;setup?:string};
export type StartingLoadDraft=Record<string,{value:string;setup:string}>;
export type StartingLoadRow={key:string;sessionId:string;date:string;item:Item;exercise:Exercise;setup:string;limitKg?:number;recent?:{workoutId:string;date:string;kg:number};reason:string};

const roleKey=(i:Item)=>JSON.stringify([i.exerciseId,i.loadRole||'',i.sourceRule?.kind||'']);
const sourceKey=(i:Item)=>JSON.stringify(i.sourceRule?[i.sourceRule.kind,i.sourceRule.stage??0,!!i.sourceRule.amrapLast,i.sourceRule.minRir??null]:null);
const sameTarget=(a:Item,b:Item)=>a.exerciseId===b.exerciseId&&(a.loadRole||'')===(b.loadRole||'')&&a.sets===b.sets&&(a.repMin??a.reps)===(b.repMin??b.reps)&&a.repMax===b.repMax&&sourceKey(a)===sourceKey(b);

/** The first exposure to each exercise/role only. Later targets and source stages are retained. */
export function blockStartingLoadRows(s:State,plan:Plan,choices:StartingLoadChoice[]=[]):StartingLoadRow[]{
 const seen=new Set<string>(),rows:StartingLoadRow[]=[];
 for(const session of [...plan.sessions].sort((a,b)=>a.date.localeCompare(b.date))){
  for(const item of session.items){
   const exercise=exFor(item.exerciseId,s.custom),role=roleKey(item);
   if(seen.has(role)||!isLoadTracked(exercise)||exercise.metric!=='reps')continue;
   seen.add(role);
   const choice=choices.find(c=>c.sessionId===session.id&&c.exerciseId===item.exerciseId);
   const setup=requiresSetup(exercise)?choice?.setup??s.loadContext?.[item.exerciseId]??'':'';
   const contextState={...s,loadContext:{...s.loadContext,[item.exerciseId]:setup}},limitKg=equipmentLimit(contextState,item.exerciseId);
   const row:StartingLoadRow={key:session.id+':'+item.exerciseId,sessionId:session.id,date:session.date,item,exercise,setup,limitKg,reason:'Choose a weight during practice, or leave it blank until the workout.'};
   rows.push(row);
   if(requiresSetup(exercise)&&!setup.trim()){row.reason='Label the machine and setup before choosing a weight.';continue}
   if(plan.profile.mode!=='app'||s.hold||plan.profile.age<18){row.reason=plan.profile.age<18?'Your qualified supervisor chooses the starting weight.':plan.profile.mode==='coach'?'Choose a starting weight with your coach.':'Choose your own starting weight; no automatic increase is applied.';continue}
   const w=s.history.filter(w=>w.finishedAt&&!w.demo&&w.targets?.some(t=>sameTarget(t,item))&&(!requiresSetup(exercise)||w.loadContext?.[item.exerciseId]===setup)).sort((a,b)=>b.date.localeCompare(a.date)||(b.finishedAt||0)-(a.finishedAt||0))[0];
   if(!w)continue;
   const sets=w.sets.filter(x=>x.exerciseId===item.exerciseId).sort((a,b)=>a.set-b.set),kg=sets[0]?.kg;
   // The existing five-week window is a product review policy, not a physiological cutoff.
   if(!validDay(w.date)||dayDistance(w.date,day())<0||dayDistance(w.date,day())>35||dayDistance(w.date,session.date)>35){row.reason='Matching history is too old for this opening date. Check a manageable weight during practice.';continue}
   if(w.partial||w.symptom!=='no'||w.effort==='harder'||sets.length!==item.sets||kg==null||kg<=0||!Number.isFinite(kg)||sets.some((x,n)=>!x.done||x.set!==n+1||x.kg!==kg||!Number.isInteger(x.reps)||x.reps<(item.repMin??item.reps)||!comparableSet(x))){row.reason='The latest matching workout is incomplete or needs reassessment. Choose a weight during practice.';continue}
   if(limitKg!==undefined&&(limitKg===0||kg>limitKg+1e-6)){row.reason='The recorded weight exceeds the available equipment. Choose an available weight.';continue}
   row.recent={workoutId:w.id,date:w.date,kg};row.reason='Actual weight from the latest matching workout. Review it for this opening target; no increase is inferred.';
  }
 }
 return rows;
}

/** Apply only explicitly reviewed inputs; blank remains unknown, including later exposures. */
export function reviewBlockStartingLoads(s:State,plan:Plan,choices:StartingLoadChoice[]){
 if(!Array.isArray(choices)||choices.some(c=>!c||typeof c.sessionId!=='string'||typeof c.exerciseId!=='string'||c.setup!==undefined&&typeof c.setup!=='string'))throw Error('Review valid starting weights and machine labels.');
 const rows=blockStartingLoadRows(s,plan,choices),selected=new Map<string,StartingLoadChoice>(),loadContext={...s.loadContext};
 const setups=new Map<string,string>();
 for(const choice of choices){
  if(!choice||Object.keys(choice).some(k=>!['sessionId','exerciseId','kg','setup'].includes(k)))throw Error('Review valid starting-weight fields.');
  const key=choice.sessionId+':'+choice.exerciseId,row=rows.find(r=>r.key===key);
  if(!row||selected.has(key))throw Error('Choose each starting weight once, for its first exercise exposure.');
  if(choice.kg!==null&&(!Number.isFinite(choice.kg)||choice.kg<0||choice.kg>1500))throw Error('Enter a weight from 0 to 1,500 kg, or leave it blank.');
  if(s.hold&&choice.kg!==null)throw Error('Starting weights wait until the current training hold is resolved. Leave them blank for now.');
  const setup=requiresSetup(row.exercise)?choice.setup??s.loadContext?.[choice.exerciseId]??'':'';
  if(typeof setup!=='string'||setup.length>200||choice.kg!==null&&requiresSetup(row.exercise)&&!setup.trim())throw Error('Add the exact machine and setup label before selecting its starting weight.');
  if(requiresSetup(row.exercise)){
   if(setups.has(choice.exerciseId)&&setups.get(choice.exerciseId)!==setup)throw Error('Use the same current machine and setup label for this exercise in the new block.');
   setups.set(choice.exerciseId,setup);loadContext[choice.exerciseId]=setup;
  }else if(choice.setup)throw Error('This exercise does not use a machine setup label.');
  const fit=equipmentFit(row.exercise,s.profile),limit=equipmentLimit({...s,loadContext},choice.exerciseId);
  if(choice.kg!==null&&s.profile.inventory?.confirmed&&!fit.available)throw Error(row.exercise.name+': '+fit.reason);
  if(choice.kg!==null&&limit!==undefined&&(limit===0||choice.kg>limit+1e-6))throw Error(row.exercise.name+': this starting weight exceeds your available equipment.');
  selected.set(key,{sessionId:choice.sessionId,exerciseId:choice.exerciseId,kg:choice.kg,...(requiresSetup(row.exercise)?{setup}:{})});
 }
 const sessions=plan.sessions.map(session=>({...session,items:session.items.map(i=>{
  const choice=selected.get(session.id+':'+i.exerciseId);
  return {...i,kg:choice?.kg??null,...(choice&&requiresSetup(exFor(i.exerciseId,s.custom))?{loadContext:choice.setup}:{})};
 })}));
 return {plan:{...plan,sessions},choices:[...selected.values()],loadContext};
}

/** Preserve typed decimal input until review; a blank never becomes zero. */
export function startingLoadValue(value:string,units:'kg'|'lb'){
 if(!value.trim())return null;
 if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim()))throw Error('Enter a nonnegative weight, or leave it blank.');
 const amount=Number(value),kg=units==='lb'?amount/2.2046226218:amount;
 if(!Number.isFinite(kg)||kg>1500)throw Error('Enter a weight up to 1,500 kg.');
 return kg;
}

export const startingWeightInput=(kg:number,units:'kg'|'lb')=>String(Math.round(kg*(units==='lb'?2.2046226218:1)*100000)/100000);
export function startingLoadDraftRows(s:State,plan:Plan,draft:StartingLoadDraft){
 const rows=blockStartingLoadRows(s,plan);
 return blockStartingLoadRows(s,plan,rows.filter(r=>draft[r.key]).map(r=>({sessionId:r.sessionId,exerciseId:r.exercise.id,kg:null,...(requiresSetup(r.exercise)?{setup:draft[r.key].setup}:{})})));
}
export function editStartingLoadDraft(s:State,plan:Plan,draft:StartingLoadDraft,key:string,patch:{value?:string;setup?:string}):StartingLoadDraft{
 const rows=blockStartingLoadRows(s,plan),row=rows.find(r=>r.key===key);
 if(!row)throw Error('Reopen this starting-weight review.');
 const next={...draft};
 if(patch.setup!==undefined){
  // A changed machine label never carries an earlier machine's chosen weight with it.
  for(const r of rows.filter(r=>r.exercise.id===row.exercise.id))next[r.key]={value:'',setup:patch.setup};
 }else next[key]={value:patch.value??draft[key]?.value??'',setup:draft[key]?.setup??row.setup};
 return next;
}
export function startingLoadDraftChoices(s:State,plan:Plan,draft:StartingLoadDraft):StartingLoadChoice[]{
 const rows=blockStartingLoadRows(s,plan);
 if(Object.keys(draft).some(key=>!rows.some(r=>r.key===key)))throw Error('Reopen this starting-weight review.');
 return rows.filter(r=>draft[r.key]).map(r=>({sessionId:r.sessionId,exerciseId:r.exercise.id,kg:startingLoadValue(draft[r.key].value,s.profile.units),...(requiresSetup(r.exercise)?{setup:draft[r.key].setup}:{})}));
}
