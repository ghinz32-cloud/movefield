import type {ProgramDefinition, ProgramSlot, RunStage} from './program-catalog';

// Original prescriptions. Evidence supports the training principles, not these exact recipes.
const lift = (title:string, group:ProgramSlot['group'], items:ProgramSlot['items']):ProgramSlot => ({title,group,items});
const step = (label:string, seconds:number) => ({label,seconds});
const easy = (minutes:number):RunStage => [step('Warm-up walk',300),step('Conversational easy run',minutes*60),step('Cool-down walk',300)];
const intervals = (seconds:number, recovery:number, repeats:number, moderate=false):RunStage => [
  step('Warm-up walk',300), ...(moderate ? [step('Conversational easy run',300)] : []),
  ...Array.from({length:repeats},()=>[step(moderate ? 'Controlled moderate run · short phrases, never all-out' : 'Conversational jog (or walk)',seconds),step(moderate ? 'Easy walk or jog recovery' : 'Recovery walk',recovery)]).flat(),
  step('Cool-down walk',300),
];
const timed = (title:string, stages:RunStage[], intensity:'easy'|'moderate'='easy'):ProgramSlot => ({title,group:'run',kind:'timed-run',runStages:stages,runIntensity:intensity,items:[]});
const sbd = ['Barbell, plates, rack with safeties and flat bench','Dumbbells or the listed assistance machines'];
const route = ['Suitable walking/running route or familiar treadmill'];
const running = (id:string,name:string,description:string,slots:ProgramSlot[],base?:[number,number]):ProgramDefinition => ({
  id,goal:'running',name:'Running · '+name,description,days:slots.length,minutes:Math.ceil(Math.max(...slots.flatMap(s=>s.runStages!.map(t=>t.reduce((n,x)=>n+x.seconds,0))))/60)+5,
  experience:'all',level:base?'build':'foundation',equipment:'none',source:'WHO-ACTIVITY',requirements:route,
  runBase:!!base,runMinimumDays:base?.[0],runMinimumMinutes:base?.[1],
  evidenceSources:base?['ENDURANCE-DISTRIBUTION','RUNNING-TID-TRIAL']:['WHO-ACTIVITY'],
  allowAdjacentEasyRuns:id==='RNEASYREC4',
  rationale:base?'Choose this arrangement only when it fits your recent running. Controlled moderate work is optional; no race pace, laboratory zone or universal intensity ratio is inferred.':'Walking recovery makes this a different introduction from a continuous run. The staged durations are app choices; repeat comfortable stages rather than forcing calendar progression.',
  slots,
});

export const researchedPrograms:ProgramDefinition[] = [
  {id:'PLCOMPACT2',goal:'powerlifting',name:'Powerlifting · Compact SBD 2',description:'Two complete barbell sessions: three sets of the main lower lift, bench on both days, and one pulling movement. Less assistance than the full foundation; all three competition lifts remain.',days:2,minutes:60,experience:'some',level:'build',equipment:'gym',source:'PL-EXPERT',requirements:sbd,evidenceSources:['RT-PRESCRIPTION','EQUIPMENT-SPECIFICITY'],rationale:'Competition-lift practice stays specific when weekly time is limited. Lower assistance volume is a scope tradeoff, not a claim of equal results.',slots:[
    lift('Compact SBD · squat and bench','full',[['bar-squat',3,3,5,210],['bench',3,4,6,180],['row',2,6,10,120]]),
    lift('Compact SBD · deadlift and bench','full',[['deadlift',3,3,5,210],['bench',3,6,8,150],['pulldown',2,6,10,120]]),
  ]},
  {id:'PLBENCH3',goal:'powerlifting',name:'Powerlifting · Bench emphasis 3',description:'Bench practice on all three days with heavier, moderate and lighter ranges. Squat and deadlift remain on two days each. An experienced development option with fewer isolation exercises.',days:3,minutes:90,experience:'some',level:'build',equipment:'gym',source:'PL-EXPERT',requirements:sbd,evidenceSources:['PERIODIZATION','AUTOREGULATION'],rationale:'Distribute the target lift across different rep ranges. The evidence does not validate a guaranteed bench advantage or this exact emphasis dose.',slots:[
    lift('Bench emphasis · heavier','full',[['bench',4,3,5,210],['bar-squat',3,4,6,180],['row',2,8,12,120]]),
    lift('Bench emphasis · moderate','full',[['deadlift',3,3,5,210],['bench',3,6,8,150],['pulldown',2,8,12,120]]),
    lift('Bench emphasis · controlled practice','full',[['bench',3,8,10,150],['bar-squat',2,5,7,180],['deadlift',2,5,7,180],['deadbug',2,6,10,60]]),
  ]},
  {id:'PLINTVOL4',goal:'powerlifting',name:'Powerlifting · Intensity and volume 4',description:'Separate lower and upper days distinguish low-rep competition work from moderate-rep volume. No automatic max testing, meet taper or calculated percentage loads.',days:4,minutes:75,experience:'some',level:'build',equipment:'gym',source:'PL-EXPERT',requirements:sbd,evidenceSources:['PERIODIZATION','SPLIT-FULLBODY'],rationale:'Use distinct practice contexts for low-rep and volume work. Volume-equated periodization evidence concerns averages; your actual load and recovery still determine reviewed changes.',slots:[
    lift('SBD lower · low reps','lower',[['bar-squat',4,2,4,240],['deadlift',2,3,5,210],['leg-curl',2,8,12,90]]),
    lift('SBD upper · low reps','upper',[['bench',4,2,4,240],['row',3,6,10,120],['triceps',2,8,12,90]]),
    lift('SBD lower · volume','lower',[['deadlift',3,4,6,210],['bar-squat',3,6,8,180],['calf',2,10,15,60]]),
    lift('SBD upper · volume','upper',[['bench',4,6,8,180],['pulldown',3,8,12,120],['lateral',2,10,15,90]]),
  ]},
  {id:'PLDISTRIBUTED4',goal:'powerlifting',name:'Powerlifting · Four focused practice days',description:'Two upper and two lower sessions use smaller competition-lift doses and only one assistance movement each. A distinct moderate-volume alternative when a long SBD day does not fit.',days:4,minutes:50,experience:'some',level:'build',equipment:'gym',source:'PL-EXPERT',requirements:sbd,evidenceSources:['TIME-EFFICIENT','SPLIT-FULLBODY'],rationale:'Frequency distributes a smaller amount of work. More days alone do not certify a better strength result.',slots:[
    lift('Focused squat','lower',[['bar-squat',3,4,6,180],['deadlift',1,5,7,180],['leg-curl',2,10,15,90]]),
    lift('Focused bench · A','upper',[['bench',3,4,6,180],['row',2,8,12,120]]),
    lift('Focused deadlift','lower',[['deadlift',3,3,5,210],['bar-squat',1,6,8,150],['calf',2,10,15,60]]),
    lift('Focused bench · B','upper',[['bench',3,6,8,150],['pulldown',2,8,12,120]]),
  ]},
  {id:'SPUNILATERAL2',goal:'sport',name:'Sport preparation · Unilateral strength 2',description:'Two strength sessions put controlled split squats and a hip hinge alongside pushing, pulling and trunk control. General preparation; it does not teach cutting or predict injury prevention.',days:2,minutes:70,experience:'some',level:'build',equipment:'dumbbells',source:'ACSM-2026',evidenceSources:['EQUIPMENT-SPECIFICITY'],requirements:['Matching dumbbells, stable push-up support and floor space'],rationale:'Train a broad strength base with per-leg work and enough recovery. Sport skills and field loading still need their own coach-directed practice.',slots:[
    lift('Unilateral sport strength · A','full',[['split',3,6,10,150],['rdl',3,6,10,150],['lib-db-floor-press',3,6,10,120],['row',3,6,10,120],['deadbug',2,6,10,60]]),
    lift('Unilateral sport strength · B','full',[['split',2,8,12,120],['rdl',2,8,12,120],['ohp',3,6,10,120],['row',3,8,12,120],['pushup',2,6,12,120],['calf',2,10,15,60]]),
  ]},
  {id:'SPBAR3',goal:'sport',name:'Sport preparation · Barbell strength 3',description:'Three full-body days alternate squat, hinge and press emphasis. Repeated broad strength work for adults already familiar with lifting; field sessions and season demands must be reviewed separately.',days:3,minutes:75,experience:'some',level:'build',equipment:'gym',source:'ACSM-2026',requirements:sbd,evidenceSources:['RT-PRESCRIPTION','PERIODIZATION'],rationale:'Heavier controlled resistance supports strength. General strength transfer does not establish a specific sprint, jump or position outcome.',slots:[
    lift('Sport barbell · squat emphasis','full',[['bar-squat',3,4,6,180],['bench',2,6,8,150],['row',3,6,10,120],['leg-curl',2,8,12,90],['deadbug',2,6,10,60]]),
    lift('Sport barbell · hinge emphasis','full',[['deadlift',2,3,5,210],['ohp',3,5,8,150],['pulldown',3,6,10,120],['split',2,8,12,120]]),
    lift('Sport barbell · press emphasis','full',[['bench',3,4,6,180],['bar-squat',2,6,8,150],['rdl',2,8,12,120],['row',2,8,12,120],['calf',2,10,15,60]]),
  ]},
  {id:'SPMACHINE3',goal:'sport',name:'Sport preparation · Machine strength 3',description:'Three controlled sessions use supported leg and upper-body machines with calf and trunk work. An equipment preference for broad strength, with no competition-barbell or field-skill equivalence claim.',days:3,minutes:60,experience:'all',level:'foundation',equipment:'gym',source:'ACSM-2026',evidenceSources:['EQUIPMENT-SPECIFICITY','SPLIT-FULLBODY'],requirements:['Selectorized leg press, chest press and leg curl','Cable row, pulldown and floor space'],rationale:'Supported resistance training can fit equipment preferences. Adaptations remain specific to the movements practiced.',slots:[
    lift('Supported sport strength · A','full',[['lib-stack-leg-press',3,6,10,150],['lib-stack-chest-press',2,6,10,120],['lib-cable-seated-row',2,8,12,120],['lib-stack-seated-leg-curl',2,8,12,90],['calf',2,10,15,60]]),
    lift('Supported sport strength · B','full',[['lib-stack-leg-press',2,8,12,120],['lib-stack-chest-press',3,6,10,150],['pulldown',2,8,12,120],['lib-stack-seated-leg-curl',2,8,12,90],['deadbug',2,6,10,60]]),
    lift('Supported sport strength · C','full',[['lib-stack-leg-press',2,8,12,120],['lib-stack-chest-press',2,8,12,120],['lib-cable-seated-row',3,6,10,150],['lib-stack-seated-leg-curl',3,8,12,90],['calf',2,10,15,60]]),
  ]},
  {id:'SPJUMP2',goal:'sport',name:'Sport preparation · Landing practice + strength 2',description:'Two dumbbell strength days. The first adds six small reset jumps before lifting; the second stays strength-only. Requires comfortable landing skill and clear space. This is skill practice, not an advanced plyometric or injury-prevention program.',days:2,minutes:70,experience:'some',level:'build',equipment:'dumbbells',source:'ACSM-2026',jumpPractice:true,evidenceSources:['PLYOMETRIC-REVIEW'],requirements:['Matching dumbbells, floor space and stable support','Clear landing area and already comfortable landing skill'],rationale:'Power practice belongs before fatiguing strength work. The tiny fixed jump dose is an app learning choice, not the athletic programs tested in the review.',slots:[
    lift('Landing reset + strength · A','full',[['lib-small-jump-reset',2,3,3,120],['squat',3,6,10,150],['rdl',2,8,12,120],['pushup',3,6,12,120],['row',3,8,12,120]]),
    lift('Strength without jumps · B','full',[['split',2,8,12,120],['rdl',3,6,10,150],['lib-db-floor-press',3,6,10,120],['row',3,8,12,120],['deadbug',2,6,10,60]]),
  ]},
  running('RNRECOVERY2','Short walk–run recovery','Two repeatable introductions with 45-second conversational jogging and 75-second walking recoveries. Fixed duration; walking throughout is allowed.',[timed('Short walk–run · A',[intervals(45,75,6)]),timed('Short walk–run · B',[intervals(45,75,6)])]),
  running('RNGRADUAL3','Gradual walk–run intervals','Three separated sessions progress every two weeks from short jogging bouts to longer bouts while retaining walking recovery. App-authored eight-week stages, distinct from NHS Couch to 5K.',[0,1,2].map(n=>timed('Gradual walk–run · '+(n+1),[intervals(60,90,6),intervals(90,90,6),intervals(120,90,5),intervals(180,90,4)]))),
  running('RNLONGBOUT2','Build longer walk–run bouts','Two separated sessions start with three one-minute easy jogging bouts and two-minute walking breaks. Over four two-week stages the bouts can reach two, three and four minutes after comfortable completed work. Repeat a stage or walk throughout when needed; these are app-authored steps, not a fixed weekly increase rule.',[timed('Longer-bout walk–run · A',[60,120,180,240].map(seconds=>intervals(seconds,120,3))),timed('Longer-bout walk–run · B',[60,120,180,240].map(seconds=>intervals(seconds,120,3)))]),
  running('RNEASY2','Two short continuous runs','Two 15-minute easy runs with opening and closing walks. A reduced running-frequency option for an established runner who wants a small repeatable block.',[timed('Short continuous run · A',[easy(15)]),timed('Short continuous run · B',[easy(15)])],[2,40]),
  running('RNVARY3','Easy short / medium / longer','Three conversational runs of 20, 30 and 40 minutes. The longest session stays within your time window; no mileage or pace is calculated.',[timed('Short easy run',[easy(20)]),timed('Medium easy run',[easy(30)]),timed('Longer easy base run',[easy(40)])],[3,90]),
  running('RNFARTLEK3','Controlled one-minute changes','Two 20-minute easy runs and one session of six controlled moderate one-minute bouts with two-minute easy recoveries. An established-base option with one quality day; never an all-out sprint.',[timed('Easy run before quality',[easy(20)]),timed('Controlled one-minute changes',[intervals(60,120,6,true)],'moderate'),timed('Easy run after quality',[easy(20)])],[3,90]),
  running('RNCRUISE3','Controlled five-minute bouts','Two easy runs and one session of three controlled moderate five-minute bouts, each followed by two easy minutes. Short-phrase effort is a practical cue, not a measured lactate threshold.',[timed('Easy cruise support · A',[easy(20)]),timed('Controlled five-minute bouts',[intervals(300,120,3,true)],'moderate'),timed('Easy cruise support · B',[easy(30)])],[3,100]),
  running('RNSTEADY3','Easy / steady / easy','Two conversational runs and one continuous 30-minute run containing a 12-minute controlled moderate middle section. This differs from interval work; no race pace or automatic intensity progression.',[timed('Easy steady support · A',[easy(20)]),timed('Continuous controlled middle',[ [step('Warm-up walk',300),step('Conversational easy run',600),step('Controlled moderate run · short phrases, never all-out',720),step('Conversational easy run',480),step('Cool-down walk',300)] ],'moderate'),timed('Easy steady support · B',[easy(25)])],[3,100]),
  running('RNEASYREC4','Four easy runs with a short recovery day','Conversational 15-, 25-, 30- and 40-minute runs. Adjacent days are allowed only for this explicitly easy base arrangement; no adjacent quality days are introduced.',[timed('Short recovery run',[easy(15)]),timed('Easy base · A',[easy(25)]),timed('Easy base · B',[easy(30)]),timed('Longer easy base',[easy(40)])],[4,110]),
  {id:'HYBAR3BASE',goal:'hybrid',name:'Hybrid · Two barbell days + one easy run',description:'Two moderate-volume barbell strength sessions and one fixed 25-minute conversational run. A strength-priority option for an existing runner with three training days.',days:3,minutes:70,experience:'some',level:'build',equipment:'gym',source:'CONCURRENT',runBase:true,runMinimumDays:2,runMinimumMinutes:50,evidenceSources:['RUNNING-STRENGTH'],requirements:[...sbd,...route],rationale:'Separate strength and endurance days retain the selected strength priority. One run is a modest base dose, not a race-development guarantee.',slots:[
    lift('Strength priority · A','full',[['bar-squat',3,4,6,180],['bench',3,4,6,180],['row',3,6,10,120],['leg-curl',2,8,12,90]]),
    timed('Fixed easy run',[easy(25)]),
    lift('Strength priority · B','full',[['deadlift',2,3,5,210],['bench',2,6,8,150],['split',2,8,12,120],['pulldown',3,6,10,120],['deadbug',2,6,10,60]]),
  ]},
  {id:'HYDB5BASE',goal:'hybrid',name:'Hybrid · Dumbbell strength + three easy runs',description:'Two complete dumbbell sessions plus 20-, 25- and 35-minute conversational runs. For adults with an established running base who prefer home strength equipment.',days:5,minutes:70,experience:'all',level:'build',equipment:'dumbbells',source:'CONCURRENT',runBase:true,runMinimumDays:3,runMinimumMinutes:80,evidenceSources:['RUNNING-STRENGTH','EQUIPMENT-SPECIFICITY'],requirements:['Matching dumbbells, stable support and floor space',...route],rationale:'A moderate strength dose leaves room for running practice. Equipment and recent running determine fit; this block does not establish an individual interference-free training ratio.',slots:[
    lift('Home concurrent strength · A','full',[['squat',2,6,10,150],['rdl',2,8,12,120],['lib-db-floor-press',2,6,10,120],['row',2,8,12,120],['calf',2,10,15,60]]),
    timed('Home concurrent easy · A',[easy(20)]),
    lift('Home concurrent strength · B','full',[['split',2,8,12,120],['rdl',2,6,10,150],['pushup',2,6,12,120],['row',2,8,12,120],['ohp',2,6,10,120],['deadbug',2,6,10,60]]),
    timed('Home concurrent easy · B',[easy(25)]),timed('Home concurrent longer easy',[easy(35)]),
  ]},
  {id:'CALUL4',goal:'calisthenics',name:'Calisthenics · Upper/lower band assistance 4',description:'Four sessions separate bodyweight pushing and band pulling from lower-body work. Controlled rep ranges and straight-set recovery; no muscle-up, handstand or weighted skill claims.',days:4,minutes:55,experience:'some',level:'build',equipment:'bodyweight-band',source:'ACSM-2026',evidenceSources:['SPLIT-FULLBODY','REP-PROGRESSION'],requirements:['Resistance band and purpose-built secure row anchor','Stable push-up support and floor space'],rationale:'Split practice can fit four available days without repeating the same whole-body session. A leverage or band change needs review and retains separate history.',slots:[
    lift('Bodyweight upper · A','upper',[['pushup',4,6,12,120],['lib-band-standing-row',4,8,15,120],['deadbug',2,6,10,60]]),
    lift('Bodyweight lower · A','lower',[['bw-squat',3,10,15,90],['ref-Band_Good_Morning',3,8,15,90],['calf',3,10,20,60]]),
    lift('Bodyweight upper · B','upper',[['pushup',3,8,15,120],['lib-band-standing-row',3,10,15,120],['ref-Shoulder_Press_-_With_Bands',2,8,12,90]]),
    lift('Bodyweight lower · B','lower',[['split',3,8,12,120],['ref-Band_Good_Morning',3,10,15,90],['calf',2,12,20,60],['deadbug',2,6,10,60]]),
  ]},
];
