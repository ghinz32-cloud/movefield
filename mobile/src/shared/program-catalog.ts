export type ProgramSlot={title:string;group:'full'|'upper'|'lower'|'run'|'push'|'pull'|'legs'|'chestback'|'shouldersarms';kind?:'walkrun'|'easy'|'brief-run';conditioning?:'walkrun';items:[string,number,number,number,number][]};
export type ProgramDefinition={id:string;goal:string;name:string;description:string;days:number;minutes:number;experience:'all'|'some'|'advanced';level?:'foundation'|'build'|'advanced';requirements?:string[];wave?:boolean;noFloor?:boolean;brief?:boolean;youth?:boolean;rotation?:'rolling-ab';equipment:'gym'|'dumbbells'|'bodyweight-band'|'flexible'|'none';runBase?:boolean;source:string;slots:ProgramSlot[]};
export const weightGoals=['strength','hypertrophy','powerbuilding','powerlifting','calisthenics'];
export function goalForCategory(current:string,category:string){return category==='weights'?(weightGoals.includes(current)?current:'strength'):category;}
export const programEquipment=(p:ProgramDefinition)=>p.equipment==='none'?'No equipment':p.equipment==='gym'?'Full gym':p.equipment==='bodyweight-band'?'Bodyweight + band':'Dumbbells';
// Original Training Studio prescriptions. Source principles are not branded-program licenses.
const lift=(title:string,group:ProgramSlot['group'],items:ProgramSlot['items']):ProgramSlot=>({title,group,items});
const run=(title:string,kind:'walkrun'|'easy'):ProgramSlot=>({title,group:'run',kind,items:[]});
export const programCatalog:ProgramDefinition[]=[
 {id:'PL3',goal:'powerlifting',name:'Powerlifting · SBD foundation',description:'Three days devoted to practicing and strengthening the barbell squat, bench press and deadlift. No running or mixed athletic circuit.',days:3,minutes:65,experience:'all',equipment:'gym',source:'PL-EXPERT',slots:[
 lift('Squat + bench','full',[['bar-squat',3,4,6,180],['bench',3,4,6,180],['row',2,8,12,120],['leg-curl',2,10,15,90],['deadbug',2,6,10,60]]),
 lift('Deadlift + bench practice','full',[['deadlift',2,3,5,180],['bench',3,5,8,150],['split',2,8,12,90],['pulldown',2,8,12,120],['calf',2,10,15,60]]),
 lift('Squat + bench + deadlift practice','full',[['bar-squat',2,5,8,150],['bench',3,4,6,180],['deadlift',2,4,6,180],['pulldown',2,8,12,120],['deadbug',2,6,10,60]])]},
 {id:'PL4',goal:'powerlifting',name:'Powerlifting · SBD strength',description:'Four days separating squat/deadlift and bench work. Repeated competition-lift practice with limited assistance.',days:4,minutes:65,experience:'some',equipment:'gym',source:'PL-EXPERT',slots:[
 lift('Squat emphasis','lower',[['bar-squat',3,3,5,210],['deadlift',2,4,6,180],['leg-curl',2,8,12,90],['calf',2,10,15,60],['deadbug',2,8,12,60]]),
 lift('Bench emphasis','upper',[['bench',3,3,5,210],['row',3,6,10,120],['pulldown',2,8,12,120],['triceps',2,10,15,90],['lateral',2,10,15,90]]),
 lift('Deadlift emphasis','lower',[['deadlift',3,3,5,210],['bar-squat',2,4,6,180],['leg-curl',2,8,12,90],['calf',2,10,15,60],['deadbug',2,8,12,60]]),
 lift('Bench volume','upper',[['bench',4,4,6,180],['pulldown',3,6,10,120],['ohp',2,8,12,90],['curl',2,10,15,90],['triceps',2,10,15,90]])]},
 {id:'PB3',goal:'powerbuilding',name:'Powerbuilding · Full body 3',description:'Start each workout with a main strength lift, then train the other muscle groups.',days:3,minutes:75,experience:'some',equipment:'gym',source:'PB-EXPERT',slots:[
 lift('Squat strength + muscle','full',[['bar-squat',3,3,6,180],['bench',3,6,10,150],['row',3,6,10,120],['leg-curl',4,10,15,90],['curl',3,10,15,90],['triceps',3,10,15,90]]),
 lift('Deadlift strength + muscle','full',[['deadlift',2,3,5,210],['incline-press',4,6,10,120],['pulldown',3,8,12,120],['lateral',3,10,15,90],['leg-extension',3,10,15,90],['curl',3,10,15,90],['deadbug',2,8,12,60]]),
 lift('Bench strength + muscle','full',[['bench',3,3,6,180],['bar-squat',4,6,10,150],['rdl',4,8,12,120],['row',2,8,12,120],['lateral',3,10,15,90],['triceps',2,10,15,90]])]},
 {id:'PB4',goal:'powerbuilding',name:'Powerbuilding · Upper/lower 4',description:'Heavy lower and upper sessions plus dedicated muscle-building work across four days.',days:4,minutes:70,experience:'some',equipment:'gym',source:'PB-EXPERT',slots:[
 lift('Lower · squat strength','lower',[['bar-squat',3,3,6,180],['rdl',3,6,10,150],['leg-extension',2,10,15,90],['leg-curl',2,10,15,90],['calf',3,10,15,60]]),
 lift('Upper · bench strength','upper',[['bench',3,3,6,180],['row',3,6,10,120],['ohp',3,6,10,120],['curl',3,10,15,90],['triceps',2,10,15,90],['lateral',2,10,15,90]]),
 lift('Lower · deadlift strength','lower',[['deadlift',2,3,5,210],['bar-squat',3,6,10,150],['leg-curl',3,10,15,90],['leg-extension',2,10,15,90],['deadbug',2,8,12,60]]),
 lift('Upper · muscle emphasis','upper',[['incline-press',4,8,12,120],['pulldown',3,8,12,120],['row',2,8,12,120],['lateral',3,10,15,90],['curl',3,10,15,90],['triceps',3,10,15,90],['pushup',3,10,15,60]])]},
 {id:'BB3',goal:'hypertrophy',name:'Bodybuilding · Full body 3',description:'Three muscle-growth sessions with broad coverage. Start with fewer sets while learning the exercises. No maximum-strength test is required.',days:3,minutes:70,experience:'all',equipment:'gym',source:'HYP-EXPERT',slots:[
 lift('Full body · A','full',[['bar-squat',3,8,12,150],['bench',4,8,12,150],['row',3,8,12,120],['leg-curl',3,10,15,90],['curl',3,10,15,90],['triceps',2,10,15,90]]),
 lift('Full body · B','full',[['squat',4,8,12,150],['incline-press',3,8,12,120],['pulldown',4,8,12,120],['rdl',3,8,12,120],['lateral',3,10,15,90],['triceps',3,10,15,90]]),
 lift('Full body · C','full',[['split',3,8,12,120],['incline-press',3,8,12,120],['row',3,8,12,120],['leg-curl',4,10,15,90],['curl',3,10,15,90],['lateral',4,10,15,90]])]},
 {id:'BB4',goal:'hypertrophy',name:'Bodybuilding · Upper/lower 4',description:'Upper/lower muscle-growth sessions with extra work for individual muscles, training each group more than once a week.',days:4,minutes:75,experience:'some',equipment:'gym',source:'HYP-EXPERT',slots:[
 lift('Upper growth · A','upper',[['bench',4,6,10,150],['row',3,8,12,120],['pulldown',2,8,12,120],['ohp',3,8,12,120],['lateral',3,10,15,90],['curl',3,10,15,90],['triceps',2,10,15,90]]),
 lift('Lower growth · A','lower',[['bar-squat',3,6,10,150],['rdl',3,8,12,150],['leg-extension',2,10,15,90],['leg-curl',2,10,15,90],['calf',3,10,15,60],['deadbug',2,8,12,60]]),
 lift('Upper growth · B','upper',[['incline-press',4,8,12,120],['pulldown',3,8,12,120],['row',2,8,12,120],['lateral',4,10,15,90],['curl',2,10,15,90],['triceps',3,10,15,90],['pushup',2,10,15,60]]),
 lift('Lower growth · B','lower',[['squat',3,8,12,150],['rdl',2,8,12,120],['split',2,8,12,120],['leg-curl',3,10,15,90],['calf',3,10,15,60],['deadbug',2,8,12,60]])]},
 {id:'HY4',goal:'hybrid',name:'Hybrid · Lift + run base',description:'Two full-body strength sessions and two easy walk–runs on separate days. A base block for new runners, not a race plan.',days:4,minutes:45,experience:'all',equipment:'dumbbells',source:'CONCURRENT',slots:[
 lift('Hybrid strength · A','full',[['squat',2,8,12,120],['pushup',2,6,12,120],['row',2,8,12,120],['calf',2,10,15,60],['deadbug',2,6,10,60]]),run('Easy walk–run · A','walkrun'),
 lift('Hybrid strength · B','full',[['rdl',2,8,12,120],['split',2,8,12,120],['row',2,8,12,120],['ohp',2,8,12,120],['deadbug',2,6,10,60]]),run('Easy walk–run · B','walkrun')]},
 {id:'HY5',goal:'hybrid',name:'Hybrid · Strength + running',description:'Two strength days and three conversational runs for someone already running comfortably for 30 minutes. Maintain a running base alongside lifting.',days:5,minutes:60,experience:'some',equipment:'gym',runBase:true,source:'CONCURRENT',slots:[
 lift('Hybrid strength · A','full',[['bar-squat',3,3,5,180],['bench',3,4,6,180],['row',2,6,10,120]]),run('Easy run · A','easy'),
 lift('Hybrid strength · B','full',[['deadlift',2,3,5,180],['ohp',3,4,6,150],['pulldown',2,6,10,120],['deadbug',2,8,12,60]]),run('Easy run · B','easy'),run('Longer easy run','easy')]},
 {id:'BBPPL6',goal:'hypertrophy',name:'Bodybuilding · Push, pull, legs 6',description:'Push, pull and leg days twice a week, so each muscle is trained two times a week. Use it when you can train six days and want high weekly volume.',days:6,minutes:70,experience:'some',equipment:'gym',source:'PPL-METHOD',slots:[
 lift('Push A · chest and shoulders','push',[['bench',4,6,10,150],['incline-press',3,8,12,120],['ohp',3,8,12,120],['lateral',3,10,15,90],['triceps',3,10,15,90]]),
 lift('Pull A · back and biceps','pull',[['row',4,6,10,120],['pulldown',3,8,12,120],['curl',3,10,15,90]]),
 lift('Legs A · squat focus','legs',[['bar-squat',4,6,10,150],['rdl',3,8,12,120],['leg-extension',3,10,15,90],['leg-curl',3,10,15,90],['calf',3,10,15,60]]),
 lift('Push B · chest and shoulders','push',[['incline-press',4,8,12,120],['bench',3,8,12,120],['lateral',4,10,15,90],['triceps',3,10,15,90],['pushup',2,8,15,60]]),
 lift('Pull B · back and biceps','pull',[['pulldown',4,8,12,120],['row',3,8,12,120],['curl',3,10,15,90]]),
 lift('Legs B · hinge focus','legs',[['deadlift',3,4,6,180],['split',3,8,12,120],['leg-curl',3,10,15,90],['leg-extension',2,12,15,90],['calf',4,10,15,60],['deadbug',2,8,12,60]])]},
 {id:'BBARN6',goal:'hypertrophy',name:'Bodybuilding · Arnold-style split 6',description:'Chest and back, then shoulders and arms, then legs, done twice a week. A six-day split built on a well-known bodybuilding routine. Sessions run long.',days:6,minutes:80,experience:'advanced',equipment:'gym',source:'ARNOLD-SPLIT',slots:[
 lift('Chest and back · A','chestback',[['bench',4,6,10,150],['incline-press',3,8,12,120],['row',3,8,12,120],['pulldown',3,8,12,120],['deadbug',2,8,12,60]]),
 lift('Shoulders and arms · A','shouldersarms',[['ohp',4,6,10,150],['lateral',3,10,15,90],['curl',3,8,12,90],['triceps',3,8,12,90]]),
 lift('Legs · A','lower',[['bar-squat',4,6,10,150],['split',3,8,12,120],['leg-curl',4,10,15,90],['calf',4,10,15,60]]),
 lift('Chest and back · B','chestback',[['incline-press',4,8,12,120],['bench',3,6,10,150],['pulldown',4,8,12,120],['row',3,8,12,120]]),
 lift('Shoulders and arms · B','shouldersarms',[['lateral',4,10,15,90],['ohp',3,8,12,120],['curl',3,8,12,90],['triceps',3,8,12,90]]),
 lift('Legs · B','lower',[['deadlift',3,4,6,180],['rdl',3,8,12,120],['leg-extension',3,10,15,90],['calf',4,10,15,60]])]},
 {id:'PLTX3',goal:'powerlifting',name:'Powerlifting · Texas Method-style 3',description:'Three days a week: a volume day of five sets of five, a lighter recovery day, and an intensity day with a heavy set of five. Built around squat, bench and deadlift.',days:3,minutes:70,experience:'some',equipment:'gym',source:'TEXAS-METHOD',slots:[
 lift('Volume · squat and bench','full',[['bar-squat',5,5,5,180],['bench',5,5,5,180],['row',3,8,10,120],['leg-curl',2,10,12,90]]),
 lift('Recovery · squat and press','full',[['bar-squat',3,8,8,120],['ohp',3,8,10,120],['pulldown',3,8,10,120],['deadbug',2,8,12,60]]),
 lift('Intensity · heavy five','full',[['bar-squat',1,5,5,240],['bench',1,5,5,240],['deadlift',1,5,5,240],['row',2,8,10,120]])]},
 {id:'PLSL3',goal:'powerlifting',name:'Powerlifting · Beginner 5×5 (StrongLifts-style)',description:'Two full-body workouts keep alternating A/B across weeks. Squat every session, with bench or overhead press, and a row or deadlift. Later sets are preplanned; new lifters begin with fewer sets. Load increases need your approval after two comparable upper-target sessions, at least two reps left, no reported symptoms and an available step no larger than 5%. These are app rules, not the source’s automatic progression.',days:3,minutes:65,experience:'all',equipment:'gym',rotation:'rolling-ab',source:'STRONGLIFTS-5X5',slots:[
 lift('Workout A · squat, bench, row','full',[['bar-squat',5,5,5,180],['bench',5,5,5,180],['row',5,5,5,120],['deadbug',2,8,12,60]]),
 lift('Workout B · squat, press, deadlift','full',[['bar-squat',5,5,5,180],['ohp',5,5,5,180],['deadlift',1,5,5,240],['calf',2,10,15,60]]),
 lift('Workout A · squat, bench, row','full',[['bar-squat',5,5,5,180],['bench',5,5,5,180],['row',5,5,5,120],['deadbug',2,8,12,60]])]}
];
programCatalog.push(
 {id:'PLU3',goal:'powerlifting',name:'Powerlifting · Undulating SBD 3',description:'Three full-body days with distinct squat, bench and deadlift rep ranges. Competition lifts stay central; assistance is limited.',days:3,minutes:80,experience:'some',equipment:'gym',source:'PL-EXPERT',slots:[
 lift('SBD · squat emphasis','full',[['bar-squat',4,3,5,210],['bench',3,6,8,150],['row',2,8,12,90]]),
 lift('SBD · deadlift emphasis','full',[['deadlift',3,3,5,210],['bench',3,4,6,180],['deadbug',2,8,12,60]]),
 lift('SBD · bench emphasis','full',[['bench',4,3,5,210],['bar-squat',3,5,7,180],['deadlift',2,5,7,180]])]},
 {id:'PBPH4',goal:'powerbuilding',name:'Powerbuilding · Power + hypertrophy 4',description:'Two strength-focused days, then two muscle-focused days. The upper/lower split separates heavier work from higher-rep work.',days:4,minutes:90,experience:'some',equipment:'gym',source:'PB-EXPERT',slots:[
 lift('Upper · power','upper',[['bench',3,3,5,210],['row',3,5,8,150],['ohp',3,5,8,120],['curl',3,8,12,90],['lateral',2,10,15,90]]),
 lift('Lower · power','lower',[['bar-squat',3,3,5,210],['deadlift',2,3,5,210],['leg-curl',3,8,12,90],['leg-extension',2,10,15,90]]),
 lift('Upper · hypertrophy','upper',[['incline-press',4,8,12,120],['pulldown',3,8,12,120],['row',2,8,12,120],['lateral',3,10,15,90],['curl',3,10,15,90],['triceps',4,10,15,90],['pushup',3,10,15,60]]),
 lift('Lower · hypertrophy','lower',[['bar-squat',3,8,10,150],['rdl',3,8,12,120],['leg-extension',2,10,15,90],['leg-curl',2,10,15,90],['calf',3,10,15,60],['deadbug',2,8,12,60]])]},
 {id:'PBT4',goal:'powerbuilding',name:'Powerbuilding · Tiered strength + size 4',description:'Each session starts with one heavier lift, adds a moderate-rep compound, and finishes with smaller muscle work. No rep-max testing.',days:4,minutes:75,experience:'some',equipment:'gym',source:'PB-EXPERT',slots:[
 lift('Tiered lower · squat','lower',[['bar-squat',3,3,5,210],['rdl',3,6,10,150],['leg-extension',4,10,15,90],['leg-curl',2,10,15,90],['calf',2,10,15,60]]),
 lift('Tiered upper · bench','upper',[['bench',3,3,5,210],['row',3,6,10,150],['lateral',3,10,15,90],['triceps',3,10,15,90],['lib-stack-chest-press',3,8,12,120],['curl',3,10,15,90]]),
 lift('Tiered lower · deadlift','lower',[['deadlift',3,3,5,210],['bar-squat',3,6,10,150],['leg-curl',3,10,15,90],['rdl',2,8,12,120],['deadbug',2,8,12,60]]),
 lift('Tiered upper · press','upper',[['ohp',3,4,6,180],['incline-press',4,6,10,150],['pulldown',4,8,12,120],['curl',4,10,15,90],['triceps',2,10,15,90]])]},
 {id:'ST2',goal:'strength',name:'Strength · Dumbbell foundation 2',description:'Two separated full-body days for general strength. Uses dumbbells and a stable elevated support; no competition-lift claims.',days:2,minutes:55,experience:'all',equipment:'dumbbells',source:'ACSM-2026',slots:[
 lift('Strength foundation · A','full',[['squat',2,6,10,150],['rdl',2,6,10,150],['pushup',2,6,12,120],['row',2,6,10,120],['calf',2,10,15,60],['deadbug',2,6,10,60]]),
 lift('Strength foundation · B','full',[['squat',2,6,10,150],['rdl',2,6,10,150],['ohp',2,6,10,120],['row',2,6,10,120],['calf',2,10,15,60],['deadbug',2,6,10,60]])]},
 {id:'ST3',goal:'strength',name:'Strength · Barbell full body 3',description:'Three days to build broad strength in the squat, press, hinge and pull. General strength is the focus, without added running.',days:3,minutes:70,experience:'some',equipment:'gym',source:'ACSM-2026',slots:[
 lift('Barbell strength · A','full',[['bar-squat',3,3,5,180],['bench',3,3,5,180],['row',2,6,10,120],['leg-curl',2,10,15,90],['deadbug',2,6,10,60]]),
 lift('Barbell strength · B','full',[['deadlift',3,3,5,180],['ohp',3,4,6,150],['pulldown',2,6,10,120],['split',2,8,12,90],['calf',2,10,15,60]]),
 lift('Barbell strength · C','full',[['bar-squat',3,4,6,180],['bench',3,4,6,180],['rdl',2,6,10,120],['row',2,8,12,120],['deadbug',2,6,10,60]])]},
 {id:'GF2',goal:'general',name:'General fitness · Dumbbell foundation 2',description:'Two repeatable sessions for strength and everyday movement. Modest starting work leaves room for walking and other activities you choose.',days:2,minutes:50,experience:'all',equipment:'dumbbells',source:'ACSM-2026',slots:[
 lift('General fitness · A','full',[['squat',2,8,12,120],['rdl',2,8,12,120],['pushup',2,6,12,90],['row',2,8,12,90],['calf',2,10,15,60],['deadbug',2,6,10,60]]),
 lift('General fitness · B','full',[['squat',2,8,12,120],['rdl',2,8,12,120],['ohp',2,8,12,90],['row',2,8,12,90],['calf',2,10,15,60],['deadbug',2,6,10,60]])]},
 {id:'GFHOME2',goal:'general',name:'General fitness · Home foundation 2',description:'Bodyweight and resistance-band work on two separated days. Requires a secure band anchor and stable push-up support.',days:2,minutes:45,experience:'all',equipment:'bodyweight-band',source:'ACSM-2026',slots:[
 lift('Home fitness · A','full',[['bw-squat',2,8,12,90],['bridge',2,8,12,90],['pushup',2,6,12,90],['band-row',2,8,12,90],['deadbug',2,6,10,60]]),
 lift('Home fitness · B','full',[['split',2,8,12,90],['bridge',2,8,12,90],['pushup',2,6,12,90],['band-row',2,8,12,90],['calf',2,10,15,60]])]},
 {id:'CAL2',goal:'calisthenics',name:'Calisthenics · Foundation 2',description:'Two days of controlled bodyweight work, with band rows for pulling. Choose a manageable push-up height; skills such as muscle-ups are not included.',days:2,minutes:45,experience:'all',equipment:'bodyweight-band',source:'ACSM-2026',slots:[
 lift('Calisthenics · A','full',[['bw-squat',2,8,12,90],['pushup',2,6,12,120],['band-row',2,8,12,90],['bridge',2,8,12,90],['deadbug',2,6,10,60]]),
 lift('Calisthenics · B','full',[['split',2,8,12,90],['pushup',2,6,12,120],['band-row',2,8,12,90],['calf',2,10,15,60],['deadbug',2,6,10,60]])]},
 {id:'CAL3',goal:'calisthenics',name:'Calisthenics · Practice 3',description:'Three brief, separated days for more frequent bodyweight practice. The movements stay familiar; changing leverage needs your review.',days:3,minutes:45,experience:'all',equipment:'bodyweight-band',source:'ACSM-2026',slots:[
 lift('Calisthenics practice · A','full',[['bw-squat',2,8,12,90],['pushup',2,6,12,120],['band-row',2,8,12,90],['deadbug',2,6,10,60]]),
 lift('Calisthenics practice · B','full',[['split',2,8,12,90],['pushup',2,6,12,120],['band-row',2,8,12,90],['bridge',2,8,12,90]]),
 lift('Calisthenics practice · C','full',[['bw-squat',2,8,12,90],['pushup',2,6,12,120],['band-row',2,8,12,90],['calf',2,10,15,60]])]},
 {id:'RNEASY3',goal:'running',name:'Running · Easy base 3',description:'Three conversational runs for adults who already run comfortably for 30 minutes. Stable durations support consistency; no race pace or distance target.',days:3,minutes:40,experience:'all',equipment:'dumbbells',runBase:true,source:'WHO-2020',slots:[run('Easy run · A','easy'),run('Easy run · B','easy'),run('Longer easy run','easy')]}
);


// Complete app-original alternatives. Public programs inform design; author names are not relabeled.
const dbA=():ProgramSlot['items']=>[['squat',3,8,12,120],['lib-db-floor-press',3,8,12,120],['row',3,8,12,120],['rdl',2,8,12,120],['calf',2,10,15,60],['deadbug',2,6,10,60]];
const dbB=():ProgramSlot['items']=>[['rdl',3,8,12,120],['ohp',3,8,12,120],['row',3,8,12,120],['split',2,8,12,90],['curl',2,10,15,90],['deadbug',2,6,10,60]];
const dbC=():ProgramSlot['items']=>[['squat',3,8,12,120],['lib-db-floor-press',3,8,12,120],['row',3,8,12,120],['rdl',2,8,12,120],['lateral',2,10,15,90],['calf',2,10,15,60]];
const homeA=():ProgramSlot['items']=>[['bw-squat',3,8,15,90],['pushup',3,6,12,120],['band-row',3,8,15,90],['bridge',3,10,15,90],['calf',2,10,15,60],['deadbug',2,6,10,60]];
const homeB=():ProgramSlot['items']=>[['split',3,8,12,90],['pushup',3,6,12,120],['band-row',3,8,15,90],['bridge',3,10,15,90],['calf',2,10,15,60],['deadbug',2,6,10,60]];
const machineA=():ProgramSlot['items']=>[['lib-stack-leg-press',3,8,12,120],['lib-stack-chest-press',3,8,12,120],['lib-cable-seated-row',3,8,12,120],['leg-curl',2,10,15,90],['calf',2,10,15,60],['deadbug',2,6,10,60]];
const machineB=():ProgramSlot['items']=>[['lib-stack-leg-press',3,8,12,120],['lib-stack-chest-press',3,8,12,120],['pulldown',3,8,12,120],['leg-curl',2,10,15,90],['lateral',2,10,15,90],['deadbug',2,6,10,60]];
programCatalog.push(
 {id:'PL2',goal:'powerlifting',name:'Powerlifting · Two-day SBD',description:'Two complete full-body sessions with all three competition lifts, pulling and trunk work. More rest days; each workout needs enough time for all three lifts.',days:2,minutes:80,experience:'all',level:'foundation',equipment:'gym',source:'PL-EXPERT',slots:[
 lift('SBD foundation · A','full',[['bar-squat',3,4,6,180],['bench',3,4,6,180],['deadlift',2,4,6,180],['row',2,8,12,120],['deadbug',2,6,10,60]]),
 lift('SBD foundation · B','full',[['deadlift',3,3,5,180],['bench',3,6,8,150],['bar-squat',2,6,8,150],['pulldown',2,8,12,120],['calf',2,10,15,60]])]},
 {id:'PBSTART2',goal:'powerbuilding',name:'Powerbuilding · Foundation 2',description:'A first strength-and-muscle block. Two full sessions keep squat, bench and hinge work, then add back, shoulders and trunk work. Each muscle group gets less weekly work than in a three- or four-day plan. No max tests.',days:2,minutes:75,experience:'all',level:'foundation',equipment:'gym',source:'PB-EXPERT',slots:[
 lift('Foundation · squat + bench','full',[['bar-squat',3,5,8,150],['bench',3,5,8,150],['row',3,8,12,120],['leg-curl',2,10,15,90],['lateral',2,10,15,90],['deadbug',2,6,10,60]]),
 lift('Foundation · hinge + press','full',[['deadlift',2,4,6,180],['bench',3,8,10,120],['squat',3,8,12,120],['pulldown',3,8,12,120],['curl',2,10,15,90],['calf',2,10,15,60]])]},
 {id:'PBSTART3',goal:'powerbuilding',name:'Powerbuilding · Foundation 3',description:'Three full-body sessions. Each starts with one main lift (squat, bench or deadlift), then moderate-rep muscle work and trunk work. Begin with two work sets while learning the lifts.',days:3,minutes:70,experience:'all',level:'foundation',equipment:'gym',source:'PB-EXPERT',slots:[
 lift('Foundation 3 · squat','full',[['bar-squat',3,5,8,150],['lib-db-floor-press',4,8,12,120],['row',3,8,12,120],['leg-curl',4,10,15,90],['curl',3,10,15,90],['deadbug',2,6,10,60]]),
 lift('Foundation 3 · bench','full',[['bench',4,5,8,150],['rdl',4,8,12,120],['pulldown',3,8,12,120],['split',3,8,12,90],['lateral',3,10,15,90],['lib-db-overhead-triceps',3,10,15,90]]),
 lift('Foundation 3 · deadlift','full',[['deadlift',2,4,6,180],['squat',4,8,12,120],['ohp',3,8,12,120],['row',3,8,12,120],['curl',3,10,15,90],['pushup',3,6,12,120]])]},
 {id:'PBDB3',goal:'powerbuilding',name:'Powerbuilding · Dumbbell strength + size',description:'A dumbbell strength-and-muscle alternative. The opening lift uses 5–8 reps; assistance uses higher ranges. This does not prepare competition barbell lifts.',days:3,minutes:75,experience:'all',equipment:'dumbbells',source:'PB-EXPERT',slots:[lift('Dumbbell strength + size · A','full',[['squat',3,5,8,150],['lib-db-floor-press',4,8,12,120],['row',3,8,12,120],['rdl',3,8,12,120],['curl',3,10,15,90],['lib-db-overhead-triceps',2,10,15,90]]),lift('Dumbbell strength + size · B','full',[['rdl',4,5,8,150],['lib-db-seated-shoulder-press',4,8,12,120],['row',3,8,12,120],['split',3,8,12,90],['curl',3,10,15,90],['lib-db-floor-press',3,8,12,120]]),lift('Dumbbell strength + size · C','full',[['lib-db-floor-press',4,5,8,150],['squat',4,8,12,120],['row',4,8,12,120],['rdl',3,8,12,120],['lateral',3,10,15,90],['lib-db-overhead-triceps',2,10,15,90],['curl',2,10,15,90]])]},
 {id:'BB2',goal:'hypertrophy',name:'Bodybuilding · Full body 2',description:'Two full muscle-building sessions. Each muscle group gets less weekly work than in a three- or four-day plan. Covers legs, chest, back, shoulders, arms and trunk across the week.',days:2,minutes:85,experience:'all',equipment:'gym',source:'HYP-EXPERT',slots:[
 lift('Two-day muscle · A','full',[...machineA(),['curl',2,10,15,90],['lateral',2,10,15,90]]),
 lift('Two-day muscle · B','full',[['bar-squat',3,8,12,150],['rdl',3,8,12,120],['incline-press',3,8,12,120],['pulldown',3,8,12,120],['triceps',2,10,15,90],['calf',2,10,15,60],['deadbug',2,6,10,60]])]},
 {id:'BBDB3',goal:'hypertrophy',name:'Bodybuilding · Dumbbell full body 3',description:'Three full muscle-building workouts without a bench or machines. Floor presses, rows, leg work and focused assistance; record each dumbbell separately from barbell loads.',days:3,minutes:75,experience:'all',equipment:'dumbbells',source:'HYP-EXPERT',slots:[lift('Dumbbell muscle · A','full',[['squat',4,8,12,120],['lib-db-floor-press',4,8,12,120],['row',3,8,12,120],['rdl',3,8,12,120],['curl',3,10,15,90],['lib-db-overhead-triceps',2,10,15,90]]),lift('Dumbbell muscle · B','full',[['rdl',4,8,12,120],['lib-db-seated-shoulder-press',4,8,12,120],['row',3,8,12,120],['split',3,8,12,90],['curl',3,10,15,90],['lib-db-floor-press',3,8,12,120]]),lift('Dumbbell muscle · C','full',[['squat',3,8,12,120],['lib-db-floor-press',4,8,12,120],['row',4,8,12,120],['rdl',3,8,12,120],['lateral',3,10,15,90],['lib-db-overhead-triceps',2,10,15,90],['curl',2,10,15,90]])]},
 {id:'BBM3',goal:'hypertrophy',name:'Bodybuilding · Machines + cables 3',description:'Full-body training built around clearly identified stack machines and cables, with small dumbbell and trunk exercises. A different setup from barbell training.',days:3,minutes:80,experience:'all',equipment:'gym',source:'HYP-EXPERT',requirements:['Selectorized leg press and chest press','Cable row and lat pulldown','Leg-curl and leg-extension machines','Dumbbells and floor space'],slots:[lift('Machine muscle · A','full',[['lib-stack-leg-press',3,8,12,120],['lib-stack-chest-press',3,8,12,120],['lib-cable-seated-row',3,8,12,120],['leg-curl',3,10,15,90],['curl',3,10,15,90],['triceps',3,10,15,90]]),lift('Machine muscle · B','full',[['lib-stack-leg-press',3,8,12,120],['lib-stack-chest-press',3,8,12,120],['pulldown',3,8,12,120],['leg-curl',3,10,15,90],['lateral',3,10,15,90],['triceps',2,10,15,90]]),lift('Machine muscle · C','full',[['lib-stack-leg-press',3,8,12,120],['lib-stack-chest-press',4,8,12,120],['lib-cable-seated-row',4,8,12,120],['leg-curl',4,10,15,90],['leg-extension',2,10,15,90],['lateral',3,10,15,90],['curl',2,10,15,90]])]},
 {id:'STGYM2',goal:'strength',name:'Strength · Guided machine start',description:'Two full sessions using stack machines, cables and controlled assistance. Learn the seat, pad and handle setup before choosing a load.',days:2,minutes:65,experience:'all',level:'foundation',equipment:'gym',source:'ACSM-2026',requirements:['Selectorized leg press and chest press','Cable row and lat pulldown','Leg-curl machine, light dumbbells and floor space'],slots:[lift('Machine strength · A','full',machineA()),lift('Machine strength · B','full',machineB())]},
 {id:'STDB3',goal:'strength',name:'Strength · Dumbbell full body 3',description:'Three complete sessions with squat, hinge, push, pull and trunk work. More weekly practice without a rack or a weight bench.',days:3,minutes:75,experience:'all',equipment:'dumbbells',source:'ACSM-2026',slots:[lift('Dumbbell strength · A','full',dbA()),lift('Dumbbell strength · B','full',dbB()),lift('Dumbbell strength · C','full',dbC())]},
 {id:'GF3',goal:'general',name:'General fitness · Full body 3',description:'Three complete dumbbell sessions for broad fitness. Strength is progressed within rep ranges; easy activity can be added separately if it fits your time.',days:3,minutes:75,experience:'all',equipment:'dumbbells',source:'ACSM-2026',slots:[lift('Full fitness · A','full',dbA()),lift('Full fitness · B','full',dbB()),lift('Full fitness · C','full',dbC())]},
 {id:'GFM2',goal:'general',name:'General fitness · Machine start',description:'Two repeatable gym sessions using machines and cables. Includes leg, push, pull, calf and trunk work with time for setup.',days:2,minutes:65,experience:'all',equipment:'gym',source:'ACSM-2026',requirements:['Selectorized leg press and chest press','Cable row and lat pulldown','Leg-curl machine, light dumbbells and floor space'],slots:[lift('Machine fitness · A','full',machineA()),lift('Machine fitness · B','full',machineB())]},
 {id:'CALBUILD3',goal:'calisthenics',name:'Calisthenics · Full-body build 3',description:'More work sets for established bodyweight training. Record support height and band setup. Progress reps first; a harder leverage needs your review and a new baseline.',days:3,minutes:70,experience:'some',equipment:'bodyweight-band',source:'ACSM-2026',slots:[lift('Bodyweight build · A','full',homeA()),lift('Bodyweight build · B','full',homeB()),lift('Bodyweight build · C','full',homeA())]},
 {id:'CALBUILD2',goal:'calisthenics',name:'Calisthenics · Full-body build 2',description:'Two longer bodyweight sessions for people comfortable with the foundation. Complete both sides of split squats and dead bugs; band rows keep pulling in the plan.',days:2,minutes:70,experience:'some',equipment:'bodyweight-band',source:'ACSM-2026',slots:[lift('Bodyweight build 2 · A','full',homeA()),lift('Bodyweight build 2 · B','full',homeB())]},
 {id:'HYHOME4',goal:'hybrid',name:'Hybrid · Home strength + walk–run',description:'Two complete bodyweight-and-band sessions and two separate walk–runs. A general base for new runners, with no race or sprint target.',days:4,minutes:60,experience:'all',equipment:'bodyweight-band',source:'CONCURRENT',slots:[lift('Home hybrid · A','full',homeA().map(i=>[i[0],2,i[2],i[3],i[4]])),run('Home walk–run · A','walkrun'),lift('Home hybrid · B','full',homeB().map(i=>[i[0],2,i[2],i[3],i[4]])),run('Home walk–run · B','walkrun')]},
 {id:'HYDB4',goal:'hybrid',name:'Hybrid · Dumbbells + easy runs',description:'Two full dumbbell sessions and two easy runs for someone already running 30 minutes comfortably. Maintain a running base while building strength.',days:4,minutes:75,experience:'all',equipment:'dumbbells',runBase:true,source:'CONCURRENT',slots:[lift('Dumbbell hybrid · A','full',dbA()),run('Easy run · A','easy'),lift('Dumbbell hybrid · B','full',dbB()),run('Longer easy run','easy')]},
 {id:'RNBASE4',goal:'running',name:'Running · Easy base 4',description:'Four easy runs for someone already running at least four days and 100 easy minutes each week. Four runs in seven days must include at least one pair of back-to-back days. This plan keeps to one pair, and all four runs are easy. A stable block with 90 running minutes and 40 warm-up/cool-down walking minutes per week; no race-pace targets or automatic distance increases.',days:4,minutes:40,experience:'some',equipment:'dumbbells',runBase:true,source:'WHO-2020',slots:[run('Easy run · A','easy'),run('Easy run · B','easy'),run('Easy run · C','easy'),run('Longer easy run','easy')]}
);
programCatalog.push({id:'BBHOME3',goal:'hypertrophy',name:'Bodybuilding · Home muscle base',description:'Three bodyweight-and-band sessions for a muscle-building base. Adjust support height and band resistance to keep the rep range useful. Biceps get only indirect pulling work here. Add a dumbbell or band curl if you have one. Equipment limits are shown; advanced weighted work needs a different plan.',days:3,minutes:70,experience:'all',equipment:'bodyweight-band',source:'HYP-EXPERT',slots:[lift('Home muscle · A','full',[['bw-squat',4,8,15,90],['pushup',4,6,12,120],['band-row',3,8,15,90],['ref-Lateral_Raise_-_With_Bands',3,10,15,60],['ref-Seated_Band_Hamstring_Curl',4,10,15,60],['bridge',3,10,15,90],['deadbug',2,6,10,60]]),lift('Home muscle · B','full',[['split',3,8,12,90],['ref-Incline_Push-Up_Close-Grip',3,8,12,90],['pushup',2,6,12,120],['band-row',3,8,15,90],['ref-Lateral_Raise_-_With_Bands',3,10,15,60],['ref-Seated_Band_Hamstring_Curl',3,10,15,60],['deadbug',2,6,10,60]]),lift('Home muscle · C','full',[['split',3,8,12,90],['pushup',4,6,12,120],['band-row',4,8,15,90],['ref-Speed_Band_Overhead_Triceps',3,10,15,60],['ref-Lateral_Raise_-_With_Bands',4,10,15,60],['ref-Seated_Band_Hamstring_Curl',3,10,15,60],['deadbug',2,6,10,60]])]});
const advancedMuscle=programCatalog.find(p=>p.id==='BB4')!;
programCatalog.push({...advancedMuscle,id:'BBADV4',name:'Bodybuilding · Established upper/lower',experience:'advanced',level:'advanced',minutes:100,description:'Four complete muscle-building sessions for established lifters. Main movements use four sets and assistance uses three. Confirm recent training first; more work is not automatically better.',slots:advancedMuscle.slots.map(x=>({...x,items:x.items.map((i,n)=>[i[0],n<2?4:3,i[2],i[3],i[4]])}))});

// Established lifters can choose distinct heavy / moderate sessions and planned lighter weeks.
for(const [id,base,name,goal] of [
 ['PLW4','PL4','Powerlifting · SBD development waves','powerlifting'],
 ['PBW4','PB4','Powerbuilding · Strength + size waves','powerbuilding'],
 ['ST4','PL4','Strength · Upper/lower development','strength']
] as const){
 const original=programCatalog.find(p=>p.id===base)!;
 programCatalog.push({...original,id,goal,name,experience:'advanced',level:'advanced',wave:true,minutes:90,description:'For established lifters with repeatable technique and recent training history. Rep targets change over three weeks, followed by a lighter week. Assistance stays in muscle-building ranges; no automatic max tests.',slots:original.slots.map(x=>({...x,items:x.items.map(i=>[...i] as ProgramSlot['items'][number])}))});
}
// Goal changes affect training amount as well as the label, while core movements can remain familiar.
for(const p of programCatalog){
 if(['STDB3','STGYM2'].includes(p.id))p.slots=p.slots.map(x=>({...x,items:x.items.map((i,n)=>n<3?[i[0],i[1],6,10,150]:i)}));
 if(p.id==='GF3')p.slots=p.slots.map(x=>({...x,items:x.items.map(i=>[i[0],2,i[2],i[3],i[4]])}));
}
// Short-session variants complement the full plans. These are deliberately smaller amounts of training.
const briefSlots=(prefix:string):ProgramSlot[]=>[
 lift(prefix+' · squat + push + pull','full',[['squat',1,8,12,90],['lib-db-floor-press',1,8,12,90],['row',1,8,12,90]]),
 lift(prefix+' · hinge + push + pull','full',[['rdl',1,8,12,90],['ohp',1,8,12,90],['row',1,8,12,90]]),
 lift(prefix+' · legs + trunk','full',[['split',1,8,12,90],['calf',1,10,15,60],['deadbug',1,6,10,60]])
];
for(const [id,goal,name,days] of [
 ['QG2','general','General fitness · Brief full body 2',2],
 ['QG3','general','General fitness · Brief full body 3',3],
 ['QS2','strength','Strength · Brief practice 2',2],
 ['QM2','hypertrophy','Bodybuilding · Brief muscle base 2',2],
 ['QC2','calisthenics','Calisthenics · Brief practice 2',2],
 ['QPB2','powerbuilding','Powerbuilding · Brief strength + size 2',2],
 ['QSP2','sport','Sport · Brief strength foundation 2',2],
 ['QS3','strength','Strength · Brief practice 3',3],
 ['QM3','hypertrophy','Bodybuilding · Brief muscle base',3],
 ['QPB3','powerbuilding','Powerbuilding · Brief strength + size',3],
 ['QC3','calisthenics','Calisthenics · Brief practice',3],
 ['QSP3','sport','Sport · Brief strength foundation',3]
] as const){let slots=briefSlots(name.split(' · ')[1]).slice(0,days);if(days===2&&!id.startsWith('QPB'))slots[1]={...slots[1],title:name.split(' · ')[1]+' · hinge + pull + core',items:[['rdl',1,8,12,90],['row',1,8,12,90],['deadbug',1,6,10,60]]};if(id==='QPB3'){slots[2]=lift('Brief strength + size · press + legs','full',[['lib-db-floor-press',1,5,8,120],['split',1,8,12,90],['deadbug',1,6,10,60]]);}if(id==='QPB3'||id==='QPB2')slots=slots.map(x=>({...x,items:x.items.map((i,n)=>n===0?[i[0],1,5,8,120]:i)}));programCatalog.push({id,goal,name,days,minutes:30,experience:'all',equipment:id.startsWith('QC')?'bodyweight-band':id.startsWith('QPB')?'dumbbells':'flexible',brief:true,youth:['general','strength','calisthenics','sport'].includes(goal),source:'TIME-EFFICIENT',description:'Less work each week, spread across short sessions. At 15 minutes, keep one work set per movement. Longer windows add work only when it fits. Review the listed equipment and weekly movement coverage. This smaller training amount is not promised equal to a longer plan.',slots});}
programCatalog.push(
 {id:'QPL3',goal:'powerlifting',name:'Powerlifting · Brief SBD practice',days:3,minutes:30,experience:'some',equipment:'gym',brief:true,source:'TIME-EFFICIENT',requirements:['Barbell, sufficient plates, squat rack with safeties and bench','Enough time to warm up your familiar working load; no maximal tests'],description:'One competition lift per short session with two controlled work sets. Practice all three lifts across the week. This is a short practice option for familiar lifters, not a full meet-preparation or maximal-strength block.',slots:[lift('Brief squat practice','full',[['bar-squat',2,4,6,150]]),lift('Brief bench practice','full',[['bench',2,4,6,150]]),lift('Brief deadlift practice','full',[['deadlift',2,4,6,150]])]},
 {id:'QHY4',goal:'hybrid',name:'Hybrid · Brief lift + walk–run',days:4,minutes:30,experience:'all',equipment:'flexible',brief:true,source:'CONCURRENT',description:'Two short strength sessions and two separate 15-minute walk–runs. A gentle start, not race preparation. Gym, dumbbell or home strength variations use the equipment you selected.',slots:[briefSlots('Brief hybrid')[0],{title:'Brief walk–run · A',group:'run',kind:'brief-run',items:[]},briefSlots('Brief hybrid')[1],{title:'Brief walk–run · B',group:'run',kind:'brief-run',items:[]}]},
 {id:'QR3',goal:'running',name:'Running · 15-minute walk–run start',days:3,minutes:15,experience:'all',equipment:'flexible',brief:true,source:'WHO-2020',description:'Five minutes walking, five rounds of 20 seconds easy jogging and 40 seconds walking, then five minutes walking. Repeat while building comfort. This is an app-designed introduction, not the NHS sequence or a promise to reach 5 km in 15 minutes.',slots:[0,1,2].map(i=>({title:'15-minute walk–run · '+String.fromCharCode(65+i),group:'run',kind:'brief-run',items:[]}))}
);
programCatalog.push({id:'SP2',goal:'sport',name:'Sport · Full strength foundation 2',days:2,minutes:60,experience:'all',equipment:'flexible',source:'ACSM-2026',description:'Two full strength sessions to support general athletic development outside a coach-led season. Covers squat, hinge, push, pull, calf and core work. Sport skills, sprint planning and position-specific prescriptions are not included.',slots:[lift('Athletic foundation · A','full',[['squat',2,8,12,120],['rdl',2,8,12,120],['lib-db-floor-press',2,8,12,120],['row',2,8,12,120],['calf',2,10,15,60],['deadbug',2,6,10,60]]),lift('Athletic foundation · B','full',[['split',2,8,12,90],['rdl',2,8,12,120],['ohp',2,8,12,120],['row',2,8,12,120],['calf',2,10,15,60],['deadbug',2,6,10,60]])]});
// Established lifting variants can progress weighted assistance; novice options retain simpler variations.
for(const p of programCatalog){if(['some','advanced'].includes(p.experience)&&['gym','dumbbells'].includes(p.equipment)&&!p.brief)p.slots=p.slots.map(x=>({...x,items:x.items.map(i=>[i[0]==='split'?'lib-db-split-squat':i[0]==='calf'?'ref-Standing_Dumbbell_Calf_Raise':i[0],i[1],i[2],i[3],i[4]])}));}
export const programFamilies=[
 {id:'general',name:'General fitness foundation'}, {id:'strength',name:'General strength'},
 {id:'powerlifting',name:'Pure powerlifting'}, {id:'powerbuilding',name:'Powerbuilding'},
 {id:'muscle-full',name:'Muscle growth · full body'}, {id:'muscle-split',name:'Muscle growth · split'},
 {id:'calisthenics',name:'Calisthenics'}, {id:'hybrid',name:'Strength + endurance'},
 {id:'running',name:'Running development'}, {id:'sport',name:'Athletic foundations'}
];
export function familyForProgram(p:ProgramDefinition){return programFamilies.find(f=>f.id===(p.goal==='hypertrophy'?(p.days>=4?'muscle-split':'muscle-full'):p.goal))!.name;}

// Accurate requirement summaries and progression levels are shown before acceptance.
for(const p of programCatalog){
 p.level??=p.experience==='all'?'foundation':'build';
 p.requirements??=p.equipment==='flexible'&&p.goal!=='running'?['Uses your selected home, dumbbell or full-gym setup','Home pulling needs a resistance band and suitable anchor']:p.goal==='running'?['Suitable route or treadmill; appropriate footwear']:p.equipment==='gym'?['Barbell, plates, rack with safeties and bench','Dumbbells, cable station and listed leg machines']:p.equipment==='dumbbells'?['A suitable range of dumbbell loads','Stable support for incline push-ups and floor space']:['Resistance band and an anchor designed for rows','Stable support for incline push-ups and floor space'];
}

export type ReferenceWorkout={title:string;items:[string,number,number,number,number,string?][]};
export type ProgramReference={id:string;goal:string;goals?:string[];name:string;author:string;days:number;weeks:number|null;experience:string;description:string;url:string;checked:string;equipment?:'gym'|'dumbbells'|'bodyweight';requirements?:string[];offsets?:number[][];workouts?:ReferenceWorkout[];progression?:string;scope?:string[];noFloor?:boolean;nonconsecutive?:boolean;minMinutes?:number;extraEveryOther?:ReferenceWorkout['items'];sourceUrls?:string[]};
export function referenceMatchesGoal(r:ProgramReference,goal:string){return r.goal===goal||!!r.goals?.includes(goal);}
export function referenceEquipment(r:ProgramReference){return r.equipment==='dumbbells'?'Dumbbells + listed supports':r.equipment==='bodyweight'?'Bodyweight + listed equipment':'Full gym';}
// Checked authorship and published format, not clinical validation or a licensed app implementation.
export const programReferences:ProgramReference[]=[
 {id:'ref-tsa-beginner',goal:'powerlifting',name:'TSA Beginner Approach',author:'The Strength Athlete',days:4,weeks:9,experience:'New to powerlifting',description:'An introduction to structured squat, bench and deadlift training. Review the author’s loading instructions before starting.',url:'https://www.thestrengthathlete.com/freebies',checked:'2026-10-07'},
 {id:'ref-tsa-intermediate',goal:'powerlifting',name:'TSA Intermediate 2.0',author:'The Strength Athlete',days:4,weeks:9,experience:'Intermediate',description:'A volume-focused opening, a deload, then heavier work. Includes the author’s RPE and program guidance.',url:'https://www.thestrengthathlete.com/freebies',checked:'2026-10-07'},
 {id:'ref-calgary16',goal:'powerlifting',name:'Calgary Barbell 16-Week',author:'Calgary Barbell',days:4,weeks:16,experience:'Established squat, bench and deadlift practice',description:'Frequent competition-lift practice, percentage and RPE loading, and a meet taper. Get the full program from its author.',url:'https://www.calgarybarbell.com/16-week-program',checked:'2026-10-07'},
 {id:'ref-phul',goal:'powerbuilding',name:'PHUL',author:'Brandon Campbell',days:4,weeks:12,experience:'Intermediate',description:'Two upper/lower power days and two upper/lower hypertrophy days. Strength and muscle growth share the focus.',url:'https://www.muscleandstrength.com/workouts/phul-workout',checked:'2026-10-07'},
 {id:'ref-phat',goal:'powerbuilding',name:'PHAT',author:'Layne Norton',days:5,weeks:null,experience:'Experienced with higher training volume',description:'Two power days and three hypertrophy days. The published example is a demanding ongoing structure, not a fixed-length block.',url:'https://biolayne.com/articles/training/phat-power-hypertrophy-adaptive-training/',checked:'2026-10-07'},
 {id:'ref-jt2',goal:'powerbuilding',name:'Jacked & Tan 2.0',author:'Cody Lefever',days:4,weeks:12,experience:'Experienced with higher training volume',description:'Two six-week blocks using primary, secondary and accessory tiers. Emphasizes muscle growth and work capacity alongside strength.',url:'https://swoleateveryheight.blogspot.com/2016/07/jacked-tan-20.html',checked:'2026-10-07'}
];

export function equipmentRequirements(p:ProgramDefinition,equipment:string):string[]{return p.equipment!=='flexible'||p.goal==='running'?p.requirements||[]:equipment==='Bodyweight + band'?['Floor space, a band and a secure anchor intended for rows','A stable push-up support']:equipment==='Full gym'?['Selectorized leg/chest press and cable row','Dumbbells, floor space and stable balance support']:['Dumbbells with suitable available loads; no weight bench needed','Floor space and stable balance support'];}

// Smaller complete blocks retain their own stated scope and training goal.
const shortHybrid=programCatalog.find(p=>p.id==='QHY4')!;
programCatalog.push({...shortHybrid,id:'QHY3',name:'Hybrid · Three-day starter',days:3,description:'Two short strength days and one 15-minute walk–run each week. A starting plan with less running practice than the four-day option.',slots:[shortHybrid.slots[0],shortHybrid.slots[2],shortHybrid.slots[1]]});
const fullHybrid=programCatalog.find(p=>p.id==='HY4')!;
programCatalog.push({...fullHybrid,id:'HY3',name:'Hybrid · Strength first, three days',days:3,description:'Two full strength sessions and one easy walk–run each week. Strength gets most of the time. One running day is not a race training plan.',slots:[fullHybrid.slots[0],fullHybrid.slots[2],{...fullHybrid.slots[1],kind:'brief-run'}]});
const shortRun=programCatalog.find(p=>p.id==='QR3')!;
programCatalog.push({...shortRun,id:'QR2',name:'Running · Two-day walk–run start',days:2,description:'Two repeatable 15-minute introductions each week. Walk instead of jogging when needed. This app-original start is not the NHS plan and does not promise race readiness.',slots:shortRun.slots.slice(0,2)});
programCatalog.push({id:'PLSTART3',goal:'powerlifting',name:'Powerlifting · SBD learning 3',description:'Three short practice sessions. One competition lift plus assistance each day. Start light and learn the setup. This is a learning block, not meet preparation. Allow more time if a lift is new; never rush the warm-up.',days:3,minutes:30,experience:'all',equipment:'gym',source:'PL-EXPERT',slots:[lift('Learn the squat + row','full',[['bar-squat',2,5,8,150],['row',2,8,12,90]]),lift('Learn the bench + calf raise','full',[['bench',2,5,8,150],['calf',2,10,15,60]]),lift('Learn the deadlift + core','full',[['deadlift',2,4,6,180],['deadbug',2,6,8,60]])]});

for(const [id,goal,label] of [['GFSTAND2','general','General fitness'],['STSTAND2','strength','Strength']] as const){
 programCatalog.push({id,goal,name:label+' · Standing band foundation',description:'A foundation without floor transfers. Use a wall for push-ups and steady support for squats and calf raises. A band and a rated row anchor are required. This is not a rehabilitation plan.',days:2,minutes:50,experience:'all',equipment:'bodyweight-band',noFloor:true,youth:true,source:'ACSM-2026',requirements:['Resistance band and anchor designed for rows','A clear wall and steady support; no floor transfers'],slots:[lift('Standing strength · A','full',[['bw-squat',2,8,12,90],['pushup',2,6,10,90],['band-row',2,8,12,90],['calf',2,10,15,60]]),lift('Standing strength · B','full',[['ref-Band_Good_Morning',2,8,12,90],['pushup',2,6,10,90],['band-row',2,8,12,90],['calf',2,10,15,60]])]});
}
programCatalog.push({id:'GFNOGROUND2',goal:'general',name:'General fitness · Seated machine foundation',description:'Two gym sessions without getting onto the floor. Covers legs, pushing and pulling with stable machines. Choose machines you can get into and out of comfortably; this is not rehabilitation.',days:2,minutes:50,experience:'all',equipment:'gym',noFloor:true,source:'ACSM-2026',requirements:['Selectorized leg press, chest press and seated leg curl','Seated cable row and lat pulldown','Steady support for calf raises'],slots:[lift('Machine foundation · A','full',[['lib-stack-leg-press',2,8,12,120],['lib-stack-chest-press',2,8,12,120],['lib-cable-seated-row',2,8,12,120],['calf',2,10,15,60]]),lift('Machine foundation · B','full',[['leg-curl',2,8,12,90],['lib-stack-leg-press',2,8,12,120],['lib-stack-chest-press',2,8,12,120],['pulldown',2,8,12,120]])]});
programCatalog.push({id:'GFNONE2',goal:'general',name:'General fitness · No-equipment movement start',description:'Two brief sessions using bodyweight, a clear wall and steady support. This introduces squat, push and calf work. It has no loaded pull or complete strength coverage; add a band or weights for that next step.',days:2,minutes:15,experience:'all',equipment:'none',brief:true,noFloor:true,youth:true,source:'WHO-2020',requirements:['Clear wall, floor space to stand and steady support','No weights or band; pulling strength is not covered'],slots:[lift('Movement start · A','full',[['bw-squat',1,8,12,90],['pushup',1,6,10,90],['calf',1,10,15,60]]),lift('Movement start · B','full',[['bw-squat',1,8,12,90],['pushup',1,6,10,90],['calf',1,10,15,60]])]});
// Standing alternatives retain push, pull, knee and hip work without floor transfers.
const standingA=():ProgramSlot['items']=>[['squat',2,8,12,120],['rdl',2,8,12,120],['pushup',2,6,12,90],['row',2,8,12,120],['calf',2,10,15,60]];
const standingB=():ProgramSlot['items']=>[['split',2,8,12,120],['rdl',2,8,12,120],['ohp',2,8,12,120],['row',2,8,12,120],['calf',2,10,15,60]];
for(const [id,goal,title,source] of [
 ['STDBST2','strength','Strength','ACSM-2026'],['GFDBST2','general','General fitness','ACSM-2026'],
 ['BBDBST2','hypertrophy','Build muscle','HYP-EXPERT'],['PBDBST2','powerbuilding','Strength + muscle','PB-EXPERT'],
 ['SPDBST2','sport','Sport strength foundation','ACSM-2026']]){
 const tune=(items:ProgramSlot['items']):ProgramSlot['items']=>items.map((i,n)=>goal==='powerbuilding'&&n===0?[i[0],2,5,8,150]:goal==='strength'&&['squat','rdl','ohp','row'].includes(i[0])?[i[0],2,6,10,150]:i);
 programCatalog.push({id,goal,name:title+' · Standing dumbbells 2',description:'Two full standing sessions with dumbbells, wall push-ups and balance support. No floor transfers, bench or band. '+(goal==='hypertrophy'||goal==='powerbuilding'?'Each muscle group gets less weekly work than in a three- or four-day plan. ':'')+(goal==='sport'?'This is general strength, not position-specific sport training.':goal==='powerbuilding'?'Strength and muscle work use dumbbells; this is not competition barbell practice.':'Keep support and movement range consistent. Wall push-ups may eventually need a more challenging reviewed alternative.'),days:2,minutes:55,experience:'all',equipment:'dumbbells',noFloor:true,source,requirements:['Dumbbells, clear wall and steady balance support','Space for standing rows and hip hinges; no floor work'],slots:[lift(title+' · Standing A','full',tune(standingA())),lift(title+' · Standing B','full',tune(standingB()))]});
}
programCatalog.push({id:'CALDB2',goal:'calisthenics',name:'Calisthenics · Bodyweight + dumbbell pulling',description:'Two standing bodyweight sessions with dumbbell rows for pulling. No floor transfers or band. This mixed-equipment foundation does not include advanced bodyweight skills or pure bodyweight pulling.',days:2,minutes:45,experience:'all',equipment:'dumbbells',noFloor:true,source:'ACSM-2026',requirements:['One dumbbell for rows, a clear wall and steady balance support'],slots:[lift('Bodyweight + pulling · A','full',[['bw-squat',2,8,12,90],['pushup',2,6,12,120],['row',2,8,12,90],['calf',2,10,15,60]]),lift('Bodyweight + pulling · B','full',[['split',2,8,12,90],['pushup',2,6,12,120],['row',2,8,12,90],['calf',2,10,15,60]])]});
for(const home of [false,true])programCatalog.push({id:home?'HYHOME2':'HYDB2',goal:'hybrid',name:'Hybrid · Two-day '+(home?'home':'dumbbell')+' introduction',description:'Two separated sessions combine strength practice with a fixed ten-minute walk/jog finish. A modest introduction for a small schedule, not a race plan or the same weekly work as a four-day block.',days:2,minutes:60,experience:'all',equipment:home?'bodyweight-band':'dumbbells',noFloor:!home,source:'CONCURRENT',requirements:home?['Resistance band, purpose-built secure anchor and stable push-up support','Suitable walking/jogging space or treadmill']:['Dumbbells, clear wall and steady balance support','Suitable walking/jogging space or treadmill'],slots:[{...lift('Combined strength + walk/jog · A','full',home?[['bw-squat',2,8,12,90],['bridge',2,8,12,90],['pushup',2,6,12,90],['band-row',2,8,12,90]]:standingA().slice(0,4)),conditioning:'walkrun'},{...lift('Combined strength + walk/jog · B','full',home?[['split',2,8,12,90],['bridge',2,8,12,90],['pushup',2,6,12,90],['band-row',2,8,12,90]]:standingB().slice(0,4)),conditioning:'walkrun'}]});
for(const p of programCatalog){p.level??=p.experience==='all'?'foundation':'build';p.requirements??=p.equipment==='gym'?['Barbell, plates, rack with safeties and bench','Dumbbells and steady support']:['Review each exercise’s listed equipment'];}

// Clear public names; program IDs and workout role titles remain stable.
const programDisplayNames: Record<string,string> = {
  "PL3": "Powerlifting · 3 days · Squat, bench and deadlift",
  "PL4": "Powerlifting · 4 days · Squat, bench and deadlift split",
  "PB3": "Powerbuilding · 3 days · Full body, strength then muscle",
  "PB4": "Powerbuilding · 4 days · Upper and lower, strength then muscle",
  "BB3": "Bodybuilding · 3 days · Full body",
  "BB4": "Bodybuilding · 4 days · Upper and lower",
  "HY4": "Strength + running · 4 days · Lifting and easy walk-runs",
  "HY5": "Strength + running · 5 days · Lifting and a running base",
  "BBPPL6": "Bodybuilding · 6 days · Push, pull, legs twice a week",
  "BBARN6": "Bodybuilding · 6 days · Arnold-style split",
  "PLTX3": "Powerlifting · 3 days · Texas Method-style",
  "PLSL3": "Powerlifting · 3 days · Beginner 5×5 (StrongLifts-style)",
  "PLU3": "Powerlifting · 3 days · Heavy, medium and light days",
  "PBPH4": "Powerbuilding · 4 days · Power work and muscle work",
  "PBT4": "Powerbuilding · 4 days · Tiered strength and size",
  "ST2": "Strength · 2 days · Dumbbells, full body",
  "ST3": "Strength · 3 days · Barbell, full body",
  "GF2": "General fitness · 2 days · Dumbbells, full body",
  "GFHOME2": "General fitness · 2 days · Home, bodyweight and bands",
  "CAL2": "Bodyweight · 2 days · Foundation",
  "CAL3": "Bodyweight · 3 days · Practice",
  "RNEASY3": "Running · 3 days · Easy base",
  "PL2": "Powerlifting · 2 days · Squat, bench and deadlift",
  "PBSTART2": "Powerbuilding · 2 days · Beginner foundation",
  "PBSTART3": "Powerbuilding · 3 days · Beginner foundation",
  "PBDB3": "Powerbuilding · 3 days · Dumbbells, strength and muscle",
  "BB2": "Bodybuilding · 2 days · Full body",
  "BBDB3": "Bodybuilding · 3 days · Dumbbells, full body",
  "BBM3": "Bodybuilding · 3 days · Machines and cables",
  "STGYM2": "Strength · 2 days · Guided machines",
  "STDB3": "Strength · 3 days · Dumbbells, full body",
  "GF3": "General fitness · 3 days · Dumbbells, full body",
  "GFM2": "General fitness · 2 days · Machines",
  "CALBUILD3": "Bodyweight · 3 days · Full-body muscle",
  "CALBUILD2": "Bodyweight · 2 days · Full-body muscle",
  "HYHOME4": "Strength + running · 4 days · Home lifting and walk-runs",
  "HYDB4": "Strength + running · 4 days · Dumbbells and easy runs",
  "RNBASE4": "Running · 4 days · Easy base",
  "BBHOME3": "Bodybuilding · 3 days · Home, bodyweight and bands",
  "BBADV4": "Bodybuilding · 4 days · Advanced upper and lower",
  "PLW4": "Powerlifting · 4 days · Advanced squat, bench and deadlift",
  "PBW4": "Powerbuilding · 4 days · Advanced strength and muscle",
  "ST4": "Strength · 4 days · Advanced upper and lower",
  "QG2": "General fitness · 2 days · 30 minutes, everyday base",
  "QG3": "General fitness · 3 days · 30 minutes, everyday base",
  "QS2": "Strength · 2 days · 30 minutes",
  "QM2": "Bodybuilding · 2 days · 30 minutes",
  "QC2": "Bodyweight · 2 days · 30 minutes",
  "QPB2": "Powerbuilding · 2 days · 30 minutes, dumbbells",
  "QSP2": "Sport · 2 days · 30 minutes, strength",
  "QS3": "Strength · 3 days · 30 minutes",
  "QM3": "Bodybuilding · 3 days · 30 minutes",
  "QPB3": "Powerbuilding · 3 days · 30 minutes, dumbbells",
  "QC3": "Bodyweight · 3 days · 30 minutes",
  "QSP3": "Sport · 3 days · 30 minutes, strength",
  "QPL3": "Powerlifting · 3 days · 30 minutes, squat, bench and deadlift",
  "QHY4": "Strength + running · 4 days · 30 minutes, lifting and walk-runs",
  "QR3": "Running · 3 days · 15-minute walk-runs",
  "SP2": "Sport · 2 days · Strength foundation",
  "QHY3": "Strength + running · 3 days · 30 minutes",
  "HY3": "Strength + running · 3 days · Lifting and walk-runs",
  "QR2": "Running · 2 days · 15-minute walk-runs",
  "PLSTART3": "Powerlifting · 3 days · Learn the lifts",
  "GFSTAND2": "General fitness · 2 days · Standing band base",
  "STSTAND2": "Strength · 2 days · Standing band",
  "GFNOGROUND2": "General fitness · 2 days · Seated machines",
  "GFNONE2": "General fitness · 2 days · No equipment",
  "STDBST2": "Strength · 2 days · Standing dumbbells",
  "GFDBST2": "General fitness · 2 days · Standing dumbbells",
  "BBDBST2": "Bodybuilding · 2 days · Standing dumbbells",
  "PBDBST2": "Powerbuilding · 2 days · Standing dumbbells",
  "SPDBST2": "Sport · 2 days · Standing dumbbells",
  "CALDB2": "Bodyweight · 2 days · Pulling and carrying, dumbbells",
  "HYDB2": "Strength + running · 2 days · Dumbbells and a run",
  "HYHOME2": "Strength + running · 2 days · Home lifting and walk-runs"
};
for (const program of programCatalog) program.name = programDisplayNames[program.id] ?? program.name;

// Public workout facts, transcribed with source links and original app wording.
// Loading, AMRAP decisions and failure-stage changes remain manual.
const rw=(title:string,items:ReferenceWorkout['items']):ReferenceWorkout=>({title,items});
const separated3=[[0,2,4],[0,2,5],[0,3,5]], separated2=[[0,2],[0,3],[0,4],[0,5]], split4=[[0,1,3,4]];
const gymSupports=['Barbell, plates, rack with safeties and bench','Listed dumbbells, cables and leg machines'];
const manualLoads='Choose your starting loads and edit future targets yourself using the linked source. Loading, failure resets and later stages are not automated.';
const phul=programReferences.find(r=>r.id==='ref-phul')!;
Object.assign(phul,{goals:['hypertrophy'],checked:'2026-10-09',equipment:'gym',noFloor:true,requirements:gymSupports,offsets:split4,progression:manualLoads+' The article supplies set/rep ranges but no fixed load-increase formula. Keep at least one rep in reserve.',scope:['Uses the lowest published set count when a set range is given.','Rest timers are app defaults: 3 minutes for power compounds, 90–120 seconds for assistance; extend them as needed.','Standing calf raise, seated calf raise and leg-press calf press are chosen source variants. Review machine setup before loading.'],workouts:[
 rw('Upper power',[['bench',3,3,5,180],['incline-press',3,6,10,120],['ref-Bent_Over_Barbell_Row',3,3,5,180],['pulldown',3,6,10,120],['lib-bar-overhead-press',2,5,8,180],['ref-Barbell_Curl',2,6,10,90],['ref-EZ-Bar_Skullcrusher',2,6,10,90]]),
 rw('Lower power',[['bar-squat',3,3,5,180],['deadlift',3,3,5,180],['lib-plate-leg-press-45',3,10,15,120],['leg-curl',3,6,10,90],['lib-plate-standing-calf-raise',4,6,10,90]]),
 rw('Upper hypertrophy',[['lib-bar-incline-bench',3,8,12,120],['ref-Dumbbell_Flyes',3,8,12,90],['lib-cable-seated-row',3,8,12,120],['ref-One-Arm_Dumbbell_Row',3,8,12,120],['lateral',3,8,12,90],['ref-Incline_Dumbbell_Curl',3,8,12,90],['triceps',3,8,12,90]]),
 rw('Lower hypertrophy',[['lib-bar-front-squat',3,8,12,120],['ref-Barbell_Lunge',3,8,12,120],['leg-extension',3,10,15,90],['leg-curl',3,10,15,90],['lib-plate-seated-calf-raise',3,8,12,90],['ref-Calf_Press_On_The_Leg_Press_Machine',3,8,12,90]])]});
const slWorkouts=[rw('Workout A',[['bar-squat',5,5,5,180],['bench',5,5,5,180],['ref-Bent_Over_Barbell_Row',5,5,5,180]]),rw('Workout B',[['bar-squat',5,5,5,180],['lib-bar-overhead-press',5,5,5,180],['deadlift',1,5,5,180]])];
const liteWorkouts=slWorkouts.map(w=>rw(w.title,w.items.map(i=>[i[0],2,5,5,180])));
const sl:Omit<ProgramReference,'id'|'days'|'offsets'>={goal:'strength',goals:['powerlifting'],name:'StrongLifts 5×5',author:'Mehdi Hadim',weeks:null,experience:'Beginner',description:'The published A/B barbell workouts alternate continuously. Base work sets are prefilled; weights remain editable.',url:'https://stronglifts.com/stronglifts-5x5/workout-program/',sourceUrls:['https://stronglifts.com/stronglifts-5x5/failure/'],checked:'2026-10-09',equipment:'gym',noFloor:true,requirements:gymSupports.slice(0,1),nonconsecutive:true,progression:manualLoads+' The source adds small load steps after completed reps, repeats a missed weight, and reduces it after repeated failures. Review its lift-specific increments.',scope:['Only the base A/B workouts are prefilled; optional assistance is not added.','Three-minute app rest defaults may need extending. Source loading and later set reductions are manual.'],workouts:slWorkouts};
const lite={...sl,name:'StrongLifts 5×5 Lite',description:'The published lower-volume A/B option uses two work sets per exercise, including deadlift.',url:'https://stronglifts.com/stronglifts-5x5/lite/',sourceUrls:[],workouts:liteWorkouts,progression:manualLoads};
const gzclWorkouts=[rw('A1 · squat / bench',[['bar-squat',5,3,3,180,'[AMRAP] Final T1 set is 3+.'],['bench',3,10,10,120,'T2 first stage.'],['pulldown',3,15,15,90,'[AMRAP] Final T3 set is 15+.']]),rw('B1 · press / deadlift',[['lib-bar-overhead-press',5,3,3,180,'[AMRAP] Final T1 set is 3+.'],['deadlift',3,10,10,120,'T2 first stage.'],['ref-One-Arm_Dumbbell_Row',3,15,15,90,'[AMRAP] Final T3 set is 15+.']]),rw('A2 · bench / squat',[['bench',5,3,3,180,'[AMRAP] Final T1 set is 3+.'],['bar-squat',3,10,10,120,'T2 first stage.'],['pulldown',3,15,15,90,'[AMRAP] Final T3 set is 15+.']]),rw('B2 · deadlift / press',[['deadlift',5,3,3,180,'[AMRAP] Final T1 set is 3+.'],['lib-bar-overhead-press',3,10,10,120,'T2 first stage.'],['ref-One-Arm_Dumbbell_Row',3,15,15,90,'[AMRAP] Final T3 set is 15+.']])];
const gzcl:Omit<ProgramReference,'id'|'days'|'offsets'|'nonconsecutive'>={goal:'strength',goals:['powerlifting','powerbuilding'],name:'GZCLP · first stage',author:'Cody Lefever / r/gzcl community guide',weeks:null,experience:'Beginner',description:'A1, B1, A2, B2 rotate continuously. The community guide’s first-stage tier targets are prefilled.',url:'https://www.reddit.com/r/gzcl/wiki/gzclp/',checked:'2026-10-09',equipment:'gym',noFloor:true,requirements:gymSupports,progression:manualLoads+' The guide adds load after successful exposures. T1 failure stages are 5×3 → 6×2 → 10×1; T2 stages are 3×10 → 3×8 → 3×6. Edit stages and resets explicitly.',scope:['Initial tier targets only. Final T1/T3 sets carry the source + rule; log actual extra reps without treating the base target as a maximum.','Rest timers (180/120/90 seconds by tier) are app planning defaults, not a complete author prescription.','The three-day cycle spans weeks; the four-day source option allows consecutive training days.'],workouts:gzclWorkouts};
const pullAccessories:ReferenceWorkout['items']=[['pulldown',3,8,12,120],['lib-cable-seated-row',3,8,12,120],['lib-cable-face-pull',5,15,20,90],['lib-db-hammer-curl',4,8,12,90],['curl',4,8,12,90]];
const pushAccessories:ReferenceWorkout['items']=[['incline-press',3,8,12,120],['triceps',3,8,12,90,'Pair with the first three lateral-raise sets.'],['lib-cable-overhead-triceps',3,8,12,90,'Pair with the last three lateral-raise sets.'],['lateral',6,15,20,90,'Six sets combine the source’s two groups of three paired sets; pairing is user directed.']];
const pplLegs:ReferenceWorkout['items']=[['bar-squat',3,5,5,180,'[AMRAP] Final set is 5+.'],['lib-bar-rdl',3,8,12,120],['lib-plate-leg-press-45',3,8,12,120],['leg-curl',3,8,12,120],['lib-plate-standing-calf-raise',5,8,12,90]];
programReferences.push(
 {...sl,id:'ref-stronglifts',days:3,offsets:separated3},
 {...lite,id:'ref-stronglifts-lite',days:3,offsets:separated3}, {...lite,id:'ref-stronglifts-lite-2',days:2,offsets:separated2},
 {id:'ref-fitness-basic',goal:'strength',goals:['powerlifting'],name:'r/Fitness Basic Beginner Routine',author:'r/Fitness community',days:3,weeks:12,experience:'Beginner',description:'Alternating three-lift sessions with a controlled final-set + rule. This template covers the lifting portion.',url:'https://thefitness.wiki/routines/r-fitness-basic-beginner-routine/',checked:'2026-10-09',equipment:'gym',noFloor:true,requirements:gymSupports,offsets:separated3,nonconsecutive:true,progression:manualLoads+' The source uses small per-exposure increases, a larger increase after a final set above ten, and a reduction after fewer than fifteen total reps. Keep 1–2 reps in reserve on the final set.',scope:['Lat pulldown is the source-allowed alternative selected for chin-ups.','Five base reps are prefilled; log extra controlled final-set reps as actuals.','Separate conditioning from the source is not scheduled. This introductory lifting block is limited to twelve weeks.','Rest timer defaults are three minutes; extend time as needed.'],workouts:[rw('Workout A',[['ref-Bent_Over_Barbell_Row',3,5,5,180,'[AMRAP] Final set is 5+; keep 1–2 controlled reps in reserve.'],['bench',3,5,5,180,'[AMRAP] Final set is 5+.'],['bar-squat',3,5,5,180,'[AMRAP] Final set is 5+.']]),rw('Workout B',[['pulldown',3,5,5,180,'[AMRAP] Source-allowed chin-up alternative; final set is 5+.'],['lib-bar-overhead-press',3,5,5,180,'[AMRAP] Final set is 5+.'],['deadlift',3,5,5,180,'[AMRAP] Final set is 5+.']])]},
 {...gzcl,id:'ref-gzclp',days:3,offsets:separated3,nonconsecutive:true}, {...gzcl,id:'ref-gzclp-4',days:4,offsets:split4},
 {id:'ref-metallicadpa-ppl',goal:'hypertrophy',goals:['powerbuilding'],name:'Metallicadpa Linear PPL',author:'u/Metallicadpa',days:6,weeks:null,experience:'Comfortable with the listed barbell movements',description:'Pull, push and legs twice weekly, with alternating heavy pulls and presses. Review the demanding weekly volume before choosing.',url:'https://www.reddit.com/r/Fitness/comments/37ylk5/a_linear_progression_based_ppl_program_for/',checked:'2026-10-09',equipment:'gym',noFloor:true,requirements:gymSupports,offsets:[[0,1,2,4,5,6],[0,1,2,3,4,5]],progression:manualLoads+' Main lifts increase after successful work; accessories progress at completed upper-range reps. Repeated strength failures use a source reset. Review the original lift-specific increments and form limits.',scope:['The two lateral-raise groups are combined as six sets in the logger, with pairing notes.','Standing machine calf raise is a selected calf variant. Rest timers start at three minutes for heavy lifts, 90–120 seconds for assistance; the source permits longer.','Final heavy sets have the source + rule. Pairing and extra reps are user directed.'],workouts:[rw('Pull A',[['deadlift',1,5,5,180,'[AMRAP] Final set is 5+.'],...pullAccessories]),rw('Push A',[['bench',5,5,5,180,'[AMRAP] Final set is 5+.'],['lib-bar-overhead-press',3,8,12,120],...pushAccessories]),rw('Legs A',pplLegs),rw('Pull B',[['ref-Bent_Over_Barbell_Row',5,5,5,180,'[AMRAP] Final set is 5+.'],...pullAccessories]),rw('Push B',[['lib-bar-overhead-press',5,5,5,180,'[AMRAP] Final set is 5+.'],['bench',3,8,12,120],...pushAccessories]),rw('Legs B',pplLegs)]},
 {id:'ref-db-stopgap',goal:'strength',goals:['hypertrophy','general'],name:'Dumbbell Stopgap',author:'u/Cammorak',days:3,weeks:null,experience:'Beginner',description:'Alternating dumbbell workouts. Plank duration is individually chosen, so enter targets from the source into this calendar.',url:'https://www.reddit.com/r/Fitness/comments/zc0uy/a_beginner_dumbbell_program_the_dumbbell_stopgap/',checked:'2026-10-09',equipment:'dumbbells',requirements:['Adjustable dumbbells and floor space'],offsets:separated3,nonconsecutive:true},
 {id:'ref-db-ppl',goal:'hypertrophy',name:'Dumbbell PPL',author:'u/gregariousHermit',days:6,weeks:null,experience:'Familiar with the listed movements',description:'Six-day dumbbell split. Its single-leg deadlift and every-other-workout core work need source-directed entry.',url:'https://www.reddit.com/r/Fitness/comments/2e79y4/dumbbell_ppl_proposed_alternative_to_dumbbell/',checked:'2026-10-09',equipment:'dumbbells',requirements:['Adjustable dumbbells, adjustable bench and secure pull-up bar'],offsets:[[0,1,2,3,4,5]]},
 {id:'ref-bwf-rr',goal:'calisthenics',goals:['strength','general'],name:'Recommended Routine',author:'r/bodyweightfitness community',days:3,weeks:null,experience:'Choose progressions for your current ability',description:'A paired bodyweight strength routine with individual movement progressions. Choose and enter suitable variants before training.',url:'https://www.reddit.com/r/bodyweightfitness/wiki/kb/recommended_routine/',checked:'2026-10-09',equipment:'bodyweight',requirements:['Rated pull-up, row and dip supports; floor space; equipment for chosen progressions'],offsets:separated3,nonconsecutive:true},
 {id:'ref-frankoman',goal:'hypertrophy',name:'Frankoman’s Dumbbell Only Split',author:'Frankoman',days:3,weeks:10,experience:'Familiar with the listed movements',description:'Chest/triceps, back/biceps and legs/shoulders. Enter the original per-set rep sequences; uniform set targets are not prefilled.',url:'https://www.muscleandstrength.com/workouts/frankoman-dumbbell-only-split.html',checked:'2026-10-09',equipment:'dumbbells',requirements:['Suitable dumbbells and adjustable bench'],offsets:separated3,nonconsecutive:true},
 {id:'ref-531-beginner',goal:'strength',goals:['powerlifting'],name:'5/3/1 for Beginners',author:'Jim Wendler',days:3,weeks:null,experience:'Beginner with established lift technique',description:'Two main lifts and First Set Last work per day. Enter training-max percentages and assistance from your own source copy.',url:'https://www.jimwendler.com/blogs/jimwendler-com/101065094-5-3-1-for-a-beginner',checked:'2026-10-09',offsets:separated3,nonconsecutive:true,requirements:gymSupports},
 {id:'ref-db-steve',goal:'hypertrophy',goals:['strength','general'],name:'Dumbbell Only Full Body',author:'Steve Shaw',days:3,weeks:8,experience:'Beginner',description:'Three full-body workouts with dumbbells and bodyweight. Review and enter the exact variations from the original, including its wide-grip pull-up and floor work.',url:'https://www.muscleandstrength.com/workouts/dumbbell-only-home-or-gym-fullbody-workout.html',sourceUrls:['https://cdn.muscleandstrength.com/sites/default/files/workouts/dumbbellonly.pdf'],checked:'2026-10-09',equipment:'dumbbells',requirements:['Dumbbells, suitable bench, stable step, rated pull-up support and floor space'],offsets:separated3,nonconsecutive:true},
 {id:'ref-db-josh',goal:'hypertrophy',name:'Dumbbell Only · 3 Day Full Body',author:'Josh England',days:3,weeks:8,experience:'Beginner',description:'A public three-day dumbbell schedule. Its exact hamstring-curl and press variations are not all mapped; enter reviewed source targets.',url:'https://www.muscleandstrength.com/workouts/3-day-full-body-dumbbell-workout',checked:'2026-10-09',equipment:'dumbbells',requirements:['Dumbbells, suitable bench and stable step'],offsets:separated3,nonconsecutive:true}
);
