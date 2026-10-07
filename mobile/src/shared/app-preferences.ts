export const palettes = [
  {id:'green',name:'Volt green',from:'#c4f275',to:'#56dfae',strong:'#226345'},
  {id:'ocean',name:'Ocean blue',from:'#9bdfff',to:'#92a9ff',strong:'#2458a0'},
  {id:'violet',name:'Iris violet',from:'#dcbaff',to:'#b4a1ff',strong:'#6842a1'},
  {id:'sunset',name:'Sunset',from:'#ffd49b',to:'#ffa6b3',strong:'#97430c'},
  {id:'rose',name:'Berry pink',from:'#ffbbdb',to:'#ddaaff',strong:'#973968'},
  {id:'teal',name:'Glacier teal',from:'#afece7',to:'#79d8dd',strong:'#176568'},
  {id:'ember',name:'Ember red',from:'#ffb29c',to:'#ff8570',strong:'#9e2a14'},
  {id:'crimson',name:'Crimson',from:'#ffb8c4',to:'#ff8096',strong:'#a0153a'},
  {id:'red',name:'Signal red',from:'#ffb3ae',to:'#ff7a7a',strong:'#a0151d'},
  {id:'amber',name:'Amber gold',from:'#ffe59a',to:'#ffc247',strong:'#7a4a00'},
  {id:'graphite',name:'Graphite',from:'#d9e0e3',to:'#a9b7bd',strong:'#33434a'},
] as const;
export type PaletteId=typeof palettes[number]['id'];
export const fontOptions=[
  ['athletic','Athletic','Condensed headings with Inter text. The default.'],
  ['bold','Bold athletic','Heavier Oswald headings for a stronger, poster-style look.'],
  ['easy','Easy to read','Atkinson Hyperlegible for all text. Letter shapes are designed to be easier to tell apart.'],
  ['classic','Classic','Inter for all text, without condensed headings.'],
  ['saira','Saira','Squared sport lettering for headings, with Inter text.'],
  ['lexend','Lexend','Designed for easier reading. Lexend for all text, with slightly wider spacing.'],
  ['nunito','Nunito','Rounded and friendly. Nunito for all text.'],
] as const;
export type FontId=typeof fontOptions[number][0];
export const textSizeOptions=[[85,'Smallest'],[92,'Smaller'],[100,'Standard'],[115,'Large'],[130,'Larger']] as const;
export type TextSize=typeof textSizeOptions[number][0];
export const densityOptions=[
  ['compact','Compact','Smaller buttons and tighter spacing. Buttons stay at least 32 px tall on the web and 44 pt on the phone.'],
  ['comfortable','Comfortable','The default spacing.'],
  ['roomy','Roomy','Taller buttons and more space between items, which is easier to tap.'],
] as const;
export type DensityId=typeof densityOptions[number][0];
export type ModelChoice='auto'|'off'|'0.6b'|'1.7b'|'4b';
export type AppPreferences={mode:'system'|'light'|'dark';palette:PaletteId;font:FontId;textSize:TextSize;density:DensityId;contrast:boolean;reduceMotion:boolean;underlineLinks:boolean;reminders:boolean;reminderTime:string;model:ModelChoice};
export const defaultPreferences:AppPreferences={mode:'system',palette:'green',font:'athletic',textSize:100,density:'comfortable',contrast:false,reduceMotion:false,underlineLinks:false,reminders:false,reminderTime:'18:00',model:'auto'};
export const preferenceKey='training-studio:preferences:v1';
export function readPreferences(raw:string|null):AppPreferences {
  if(!raw)return {...defaultPreferences};
  try{
    const p=JSON.parse(raw);if(!p||typeof p!=='object'||Array.isArray(p))return {...defaultPreferences};
    return {mode:['system','light','dark'].includes(p.mode)?p.mode:'system',palette:palettes.some(x=>x.id===p.palette)?p.palette:'green',font:fontOptions.some(x=>x[0]===p.font)?p.font:'athletic',textSize:textSizeOptions.some(x=>x[0]===p.textSize)?p.textSize:100,density:densityOptions.some(x=>x[0]===p.density)?p.density:'comfortable',contrast:p.contrast===true,reduceMotion:p.reduceMotion===true,underlineLinks:p.underlineLinks===true,reminders:p.reminders===true,reminderTime:typeof p.reminderTime==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(p.reminderTime)?p.reminderTime:'18:00',model:['auto','off','0.6b','1.7b','4b'].includes(p.model)?p.model:'auto'};
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
