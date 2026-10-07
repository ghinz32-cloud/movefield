export const palettes = [
  {id:'green',name:'Volt green',from:'#c4f275',to:'#56dfae',strong:'#226345'},
  {id:'ocean',name:'Ocean blue',from:'#9bdfff',to:'#92a9ff',strong:'#2458a0'},
  {id:'violet',name:'Iris violet',from:'#dcbaff',to:'#b4a1ff',strong:'#6842a1'},
  {id:'sunset',name:'Sunset',from:'#ffd49b',to:'#ffa6b3',strong:'#97430c'},
  {id:'rose',name:'Berry pink',from:'#ffbbdb',to:'#ddaaff',strong:'#973968'},
  {id:'teal',name:'Glacier teal',from:'#afece7',to:'#79d8dd',strong:'#176568'},
] as const;
export type PaletteId=typeof palettes[number]['id'];
export type ModelChoice='auto'|'off'|'0.6b'|'1.7b'|'4b';
export type AppPreferences={mode:'system'|'light'|'dark';palette:PaletteId;textSize:100|115|130;contrast:boolean;reduceMotion:boolean;underlineLinks:boolean;reminders:boolean;reminderTime:string;model:ModelChoice};
export const defaultPreferences:AppPreferences={mode:'system',palette:'green',textSize:100,contrast:false,reduceMotion:false,underlineLinks:false,reminders:false,reminderTime:'18:00',model:'auto'};
export const preferenceKey='training-studio:preferences:v1';
export function readPreferences(raw:string|null):AppPreferences {
  if(!raw)return {...defaultPreferences};
  try{
    const p=JSON.parse(raw);if(!p||typeof p!=='object'||Array.isArray(p))return {...defaultPreferences};
    return {mode:['system','light','dark'].includes(p.mode)?p.mode:'system',palette:palettes.some(x=>x.id===p.palette)?p.palette:'green',textSize:[100,115,130].includes(p.textSize)?p.textSize:100,contrast:p.contrast===true,reduceMotion:p.reduceMotion===true,underlineLinks:p.underlineLinks===true,reminders:p.reminders===true,reminderTime:typeof p.reminderTime==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(p.reminderTime)?p.reminderTime:'18:00',model:['auto','off','0.6b','1.7b','4b'].includes(p.model)?p.model:'auto'};
  }catch{return {...defaultPreferences};}
}
export const modelChoices:[ModelChoice,string,string][]=[['auto','Automatic','Use the largest model that passes testing on this phone.'],['0.6b','Qwen3 0.6B','Light download · about 0.5 GB'],['1.7b','Qwen3 1.7B','Balanced option · about 1.2 GB'],['4b','Qwen3 4B','Larger option · about 2.5 GB'],['off','Off','Use plans and tracking without a language model.']];

// Eligibility must come from testing the exact OS/backend/model build. Total
// device RAM or a recent release date alone cannot establish an app's budget.
export function qualifiedModel(choice:ModelChoice,passed:Exclude<ModelChoice,'auto'|'off'>[]):Exclude<ModelChoice,'auto'> {
  if(choice==='off')return 'off';
  const order:Exclude<ModelChoice,'auto'|'off'>[]=['4b','1.7b','0.6b'];
  const start=choice==='auto'?0:order.indexOf(choice);
  return order.slice(start).find(x=>passed.includes(x))||'off';
}
