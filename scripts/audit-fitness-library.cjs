/* Row-by-row technical and source inventory, not independent clinical certification. */
const fs=require('node:fs'),path=require('node:path'),{load}=require('./domain-test-loader.cjs');
const T=load('lib/training.ts'),P=load('lib/program-catalog.ts'),S=load('lib/substitutions.ts'),E=load('lib/evidence-sources.ts');
const guides=JSON.parse(fs.readFileSync('public/exercise-guides.json')),media=JSON.parse(fs.readFileSync('public/exercise-content.json'));
const Fit=load('lib/plan-fit.ts'),ledger=JSON.parse(fs.readFileSync('docs/evidence-ledger.json'));
const stage=process.argv.includes('--baseline')?'baseline':'current',folder='docs/fitness-audit';fs.mkdirSync(folder,{recursive:true});
const urlOK=u=>{try{const v=new URL(u);return v.protocol==='https:'&&!v.username&&!v.password}catch{return false}};
const terms=['concentric','eccentric','supination','pronation','thoracic','ipsilateral','contralateral','abduction','adduction','dorsiflexion','plantarflexion','isometric'];
const programUse=new Map();for(const d of P.programCatalog)for(const slot of d.slots)for(const [id]of slot.items){const set=programUse.get(id)||new Set();set.add(d.id);programUse.set(id,set)}
const exerciseRows=T.exercises.map(e=>{
 const g=guides[e.id],m=media[e.id],flags=[];
 const missing=['summary','setup','execution','finish','breathing','commonErrors','easierOption','safety','loadConvention','sourceURLs'].filter(k=>!g?.[k]?.length);
 if(missing.length)flags.push('guide-fields-missing');
 if(!e.primaryMuscles?.length)flags.push(e.id==='skill'?'coach-selected-task-muscles-unknown':'target-muscles-not-mapped');
 if(!m?.sourceUrl&&!m?.videoUrl&&!g?.sourceURLs?.length)flags.push('no-prominent-form-resource');
 if(m?.videoUrl&&!urlOK(m.videoUrl))flags.push('unsafe-media-link');
 if((g?.sourceURLs||[]).some(u=>!urlOK(u)))flags.push('unsafe-source-link');
 if(/unconfirmed|unspecified/i.test(e.equipment))flags.push('equipment-unconfirmed');
 if(e.metric==='reps'&&e.loadTracked&&!(e.loadMultiplier>0)&&!/setup context.*not weight lifted/i.test(e.loadConvention||''))flags.push('load-convention-inconsistent');
 const copy=[g?.summary,...(g?.setup||[]),...(g?.execution||[]),...(g?.commonErrors||[])].filter(Boolean).join(' '),defined=(g?.terms||[]).map(x=>x.term.toLowerCase());
 const jargon=terms.filter(t=>new RegExp('\\b'+t+'\\b','i').test(copy)&&!defined.includes(t));if(jargon.length)flags.push('terms-need-plain-explanation');
 const substitutions=S.substitutionOptions(e.id);if(programUse.has(e.id)&&!substitutions.length&&e.metric==='reps')flags.push('recommended-movement-has-no-substitute');
 return {id:e.id,name:e.name,pattern:e.pattern,equipment:e.equipment,metric:e.metric,primaryMuscles:e.primaryMuscles||[],programs:[...(programUse.get(e.id)||[])],load:{tracked:!!e.loadTracked,multiplier:e.loadMultiplier||0,setupRequired:!!e.requiresSetup,convention:e.loadConvention||''},guide:{present:!!g,missing,sourceURLs:g?.sourceURLs||[],quickCueCount:g?.quickCues?.length||0,unexplainedTerms:jargon},media:{source:m?.sourceUrl||null,video:m?.videoUrl||null,photoCount:m?.images?.length||0,remoteAvailability:'not established by this script'},substitutionCount:substitutions.length,flags,reviewScope:'Individual structural/source/semantics inventory; no technique certification or new efficacy claim.'};
});
const programs=P.programCatalog.map(d=>{
 const profile={...T.blankProfile,age:28,goal:d.goal,experience:d.experience==='all'?'First time':'Experienced',establishedTraining:true,runBase:true,runDays:7,runMinutes:300,programId:d.id,days:[0,1,2,3,4,5,6],minutes:120,weeks:8,equipment:P.programEquipment(d),noFloor:!!d.noFloor};
 const r=T.buildPlan(profile),unresolved=[...new Set(d.slots.flatMap(s=>s.items.map(i=>i[0])).filter(id=>T.exFor(id).name==='Archived exercise'))];
 const estimates=d.slots.map(slot=>({title:slot.title,group:slot.group,workSets:slot.items.reduce((n,i)=>n+i[1],0),minutes:slot.items.length?T.estimateSessionMinutes(slot.items.map(([exerciseId,sets,lo,hi,rest])=>({exerciseId,sets,reps:lo,repMin:lo,repMax:hi,rest,kg:null})),!!d.brief):null}));
 const fit=r.plan?Fit.planFit(r.plan):null;const coreRegions=['Chest','Back','Quadriceps','Hamstrings','Glutes'];const gaps=fit?.regions.filter(x=>coreRegions.includes(x.name)&&x.days<2)||[];const limited=!!d.brief||d.goal==='running'||d.goal==='powerlifting';
 return {id:d.id,name:d.name,goal:d.goal,frequency:d.days,equipment:d.equipment,experience:d.experience,source:{id:d.source,url:E.evidenceLinks[d.source]?.url||null,scope:['PL-EXPERT','PB-EXPERT','HYP-EXPERT'].includes(d.source)?'Expert architecture/product source; does not validate numeric prescriptions':'Scientific/public-health reference; review depth recorded separately'},slots:estimates,unresolvedExercises:unresolved,build:{succeeds:!!r.plan,errors:r.errors},declaredMinutes:d.minutes,minimumEstimatedLiftingMinutes:Math.max(0,...estimates.map(x=>x.minutes||0)),requestedSixOrSevenDaysSupported:d.days>=6,weeklyFit:fit,goalReview:{scope:limited?'Specific practice, smaller dose or running pathway; review displayed limits':'Complete foundation coverage',majorRegionFrequencyGaps:gaps,coverageAccepted:limited||gaps.length===0,sourceReview:ledger.sources.find(s=>s.id===d.source)?.review_depth||'Linked reference only',exactDoseValidation:'Original app prescription; source principles and technical checks do not constitute an efficacy trial.'}};
});
const counts={};for(const e of exerciseRows)for(const flag of e.flags)counts[flag]=(counts[flag]||0)+1;
const report={checkedAt:new Date().toISOString(),stage,scope:'Complete per-ID technical inventory of all current exercises and program definitions. Scientific source review and programming decisions are separate. No person data or existing plan modified.',totals:{exercises:exerciseRows.length,programs:programs.length,recommendedExerciseIds:programUse.size,programsWithSixOrSevenDays:programs.filter(x=>x.frequency>=6).length,completeFoundationCoverageFailures:programs.filter(p=>!p.goalReview.coverageAccepted).map(p=>p.id),programBuildFailures:programs.filter(p=>!p.build.succeeds).map(p=>p.id),programTimingCardMismatches:programs.filter(p=>p.declaredMinutes<p.minimumEstimatedLiftingMinutes).map(p=>p.id),missingGuideIds:T.exercises.filter(e=>!guides[e.id]).map(e=>e.id),orphanMediaIds:Object.keys(media).filter(id=>!T.exercises.some(e=>e.id===id)),flags:counts},exercises:exerciseRows,programs};
fs.writeFileSync(path.join(folder,stage+'-audit.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.totals));
