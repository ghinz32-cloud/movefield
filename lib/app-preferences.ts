import {isGrizzly} from './brand';
export const outdoorPalettes=[
 {id:'pine',name:'Pine forest',from:'#bad6a0',to:'#7fb894',strong:'#345c37'},
 {id:'moss',name:'Moss & stone',from:'#d5dda0',to:'#bbc7a0',strong:'#52602c'},
 {id:'campfire',name:'Campfire',from:'#ffc58c',to:'#f1a391',strong:'#903e22'},
 {id:'canyon',name:'Canyon clay',from:'#efc0ac',to:'#d6a19e',strong:'#823f37'},
 {id:'alpine',name:'Alpine lake',from:'#a8dfe3',to:'#8bbecd',strong:'#235d69'},
 {id:'midnight',name:'Midnight ridge',from:'#becce8',to:'#a6aed6',strong:'#414f79'},
 {id:'autumn',name:'Autumn trail',from:'#efcf88',to:'#dca888',strong:'#805121'},
 {id:'dunes',name:'Desert dunes',from:'#ebd4af',to:'#cfb49b',strong:'#715239'},
 {id:'meadow',name:'Wildflower meadow',from:'#d9c4ec',to:'#b2d9b3',strong:'#665078'},
 {id:'aurora',name:'Northern lights',from:'#9de2c5',to:'#bcb1ea',strong:'#365f58'},
] as const;
export const palettes = [
  ...(isGrizzly?[{id:'og',name:'OG black & white',from:'#ffffff',to:'#d8d8d8',strong:'#171717'} as const]:[]),
  ...(isGrizzly?outdoorPalettes:[]),
  ...(isGrizzly?[{id:'frost',name:'Arctic frost',from:'#b7e6f2',to:'#a9c9e1',strong:'#28586e'} as const]:[]),
  {id:'green',name:isGrizzly?'Grizzly amber':'Volt green',from:isGrizzly?'#f5cb79':'#c4f275',to:isGrizzly?'#e6ac69':'#56dfae',strong:isGrizzly?'#80501d':'#226345'},
  {id:'ocean',name:'Ocean blue',from:'#9bdfff',to:'#92a9ff',strong:'#2458a0'},
  {id:'violet',name:'Iris violet',from:'#dcbaff',to:'#b4a1ff',strong:'#6842a1'},
  {id:'sunset',name:'Sunset',from:'#ffd49b',to:'#ffa6b3',strong:'#97430c'},
  {id:'rose',name:'Berry pink',from:'#ffbbdb',to:'#ddaaff',strong:'#973968'},
  {id:'teal',name:'Glacier teal',from:'#afece7',to:'#79d8dd',strong:'#176568'},
] as const;
export type PaletteId=typeof palettes[number]['id'];
export type ModelChoice='auto'|'off'|'0.6b'|'1.7b'|'4b';
export const extremeHeadingFonts=[
 {"id": "roadrage", "name": "Road Rage", "family": "Road Rage", "group": "wild", "file": "roadrage-heading.ttf", "weight": 400, "vibe": "Claw-cut brush"},
 {"id": "rubikdistressed", "name": "Rubik Distressed", "family": "Rubik Distressed", "group": "wild", "file": "rubikdistressed-heading.ttf", "weight": 400, "vibe": "Weathered bark"},
 {"id": "rubikburned", "name": "Rubik Burned", "family": "Rubik Burned", "group": "wild", "file": "rubikburned-heading.ttf", "weight": 400, "vibe": "Scorched timber"},
 {"id": "rubikmarkerhatch", "name": "Rubik Marker Hatch", "family": "Rubik Marker Hatch", "group": "wild", "file": "rubikmarkerhatch-heading.ttf", "weight": 400, "vibe": "Crosshatched claws"},
 {"id": "rubikwetpaint", "name": "Rubik Wet Paint", "family": "Rubik Wet Paint", "group": "wild", "file": "rubikwetpaint-heading.ttf", "weight": 400, "vibe": "Molten sap"},
 {"id": "rubikspraypaint", "name": "Rubik Spray Paint", "family": "Rubik Spray Paint", "group": "wild", "file": "rubikspraypaint-heading.ttf", "weight": 400, "vibe": "Trail grit"},
 {"id": "rubikstorm", "name": "Rubik Storm", "family": "Rubik Storm", "group": "wild", "file": "rubikstorm-heading.ttf", "weight": 400, "vibe": "Storm-torn"},
 {"id": "lacquer", "name": "Lacquer", "family": "Lacquer", "group": "wild", "file": "lacquer-heading.ttf", "weight": 400, "vibe": "Splintered wood"},
 {"id": "frijole", "name": "Frijole", "family": "Frijole", "group": "wild", "file": "frijole-heading.ttf", "weight": 400, "vibe": "Feral heavyweight"},
 {"id": "shojumaru", "name": "Shojumaru", "family": "Shojumaru", "group": "wild", "file": "shojumaru-heading.ttf", "weight": 400, "vibe": "Bear-force brush"},
 {"id": "tradewinds", "name": "Trade Winds", "family": "Trade Winds", "group": "wild", "file": "tradewinds-heading.ttf", "weight": 400, "vibe": "Wild expedition"},
 {"id": "rubikmicrobe", "name": "Rubik Microbe", "family": "Rubik Microbe", "group": "wild", "file": "rubikmicrobe-heading.ttf", "weight": 400, "vibe": "Fur-textured"},
 {"id": "rubikpuddles", "name": "Rubik Puddles", "family": "Rubik Puddles", "group": "wild", "file": "rubikpuddles-heading.ttf", "weight": 400, "vibe": "Rain-eroded"},
 {"id": "butcherman", "name": "Butcherman", "family": "Butcherman", "group": "wild", "file": "butcherman-heading.ttf", "weight": 400, "vibe": "Ragged beast"},
 {"id": "creepster", "name": "Creepster", "family": "Creepster", "group": "wild", "file": "creepster-heading.ttf", "weight": 400, "vibe": "Creature feature"},
 {"id": "jollylodger", "name": "Jolly Lodger", "family": "Jolly Lodger", "group": "wild", "file": "jollylodger-heading.ttf", "weight": 400, "vibe": "Carved lodge"},
 {"id": "almendradisplay", "name": "Almendra Display", "family": "Almendra Display", "group": "wild", "file": "almendradisplay-heading.ttf", "weight": 400, "vibe": "Ancient woodland"},
 {"id": "rye", "name": "Rye", "family": "Rye", "group": "wild", "file": "rye-heading.ttf", "weight": 400, "vibe": "Timberline woodtype"},
 {"id": "unifrakturcook", "name": "UnifrakturCook", "family": "UnifrakturCook", "group": "wild", "file": "unifrakturcook-heading.ttf", "weight": 700, "vibe": "Ironwood gothic"},
 {"id": "sedgwickavedisplay", "name": "Sedgwick Ave Display", "family": "Sedgwick Ave Display", "group": "wild", "file": "sedgwickavedisplay-heading.ttf", "weight": 400, "vibe": "Scratch-tagged"},
] as const;
export const headingFonts=[
 ...extremeHeadingFonts,
 {id:'inter',name:'Inter',family:'Inter',group:'readable',file:'inter-variable.ttf',weight:650},
 {id:'barlow',name:'Barlow Condensed',family:'Barlow Condensed',group:'readable',file:'barlow-condensed-semibold.ttf',weight:600},
 {id:'oswald',name:'Oswald',family:'Oswald',group:'readable',file:'oswald-heading.ttf',weight:600},
 {id:'bitter',name:'Bitter',family:'Bitter',group:'readable',file:'bitter-heading.ttf',weight:600},
 {id:'rajdhani',name:'Rajdhani',family:'Rajdhani',group:'readable',file:'rajdhani-heading.ttf',weight:700},
 {id:'rocker',name:'New Rocker',family:'New Rocker',group:'wild',file:'newrocker-heading.ttf',weight:400},
 {id:'blackops',name:'Black Ops One',family:'Black Ops One',group:'wild',file:'blackopsone-heading.ttf',weight:400},
 {id:'dirt',name:'Rubik Dirt',family:'Rubik Dirt',group:'wild',file:'rubikdirt-heading.ttf',weight:400},
 {id:'metal',name:'Metal Mania',family:'Metal Mania',group:'wild',file:'metal-mania-regular.ttf',weight:400},
 {id:'bungee',name:'Bungee',family:'Bungee',group:'wild',file:'bungee-regular.ttf',weight:400},
 {id:'saira',name:'Saira Stencil One',family:'Saira Stencil One',group:'wild',file:'sairastencilone-heading.ttf',weight:400},
 {id:'stardos',name:'Stardos Stencil',family:'Stardos Stencil',group:'wild',file:'stardosstencil-heading.ttf',weight:700},
 {id:'pirata',name:'Pirata One',family:'Pirata One',group:'wild',file:'pirataone-heading.ttf',weight:400},
 {id:'eater',name:'Eater',family:'Eater',group:'wild',file:'eater-heading.ttf',weight:400},
 {id:'nosifer',name:'Nosifer',family:'Nosifer',group:'wild',file:'nosifer-heading.ttf',weight:400},
] as const;
export type HeadingFont=typeof headingFonts[number]['id'];
export type AppPreferences={mode:'system'|'light'|'dark';palette:PaletteId;grizzlyStyle:'wild'|'clean'|'og';headingFont:HeadingFont;headingFontVersion:2;textSize:100|115|130;contrast:boolean;reduceMotion:boolean;underlineLinks:boolean;reminders:boolean;reminderTime:string;model:ModelChoice};
export const defaultPreferences:AppPreferences={mode:isGrizzly?'dark':'system',palette:isGrizzly?'pine':'green',grizzlyStyle:isGrizzly?'wild':'clean',headingFont:isGrizzly?'frijole':'barlow',headingFontVersion:2,textSize:100,contrast:false,reduceMotion:false,underlineLinks:false,reminders:false,reminderTime:'18:00',model:'auto'};
export const preferenceKey=isGrizzly?'grizzly-fitness:preferences:v1':'training-studio:preferences:v1';
export function readPreferences(raw:string|null):AppPreferences {
  if(!raw)return {...defaultPreferences};
  try{
    const p=JSON.parse(raw);if(!p||typeof p!=='object'||Array.isArray(p))return {...defaultPreferences};
    // Upgrade prior automatic Grizzly fonts once; later explicit choices stay saved.
    const legacyDefault=isGrizzly&&(p.headingFont==='beast'||p.headingFont==='rocker'&&p.headingFontVersion===undefined);
    const heading=legacyDefault?'metal':p.headingFont;
    return {mode:['system','light','dark'].includes(p.mode)?p.mode:defaultPreferences.mode,palette:palettes.some(x=>x.id===p.palette)?p.palette:defaultPreferences.palette,grizzlyStyle:(isGrizzly?['wild','clean','og']:['wild','clean']).includes(p.grizzlyStyle)?p.grizzlyStyle:defaultPreferences.grizzlyStyle,headingFont:headingFonts.some(x=>x.id===heading)?heading:defaultPreferences.headingFont,headingFontVersion:2,textSize:[100,115,130].includes(p.textSize)?p.textSize:100,contrast:p.contrast===true,reduceMotion:p.reduceMotion===true,underlineLinks:p.underlineLinks===true,reminders:p.reminders===true,reminderTime:typeof p.reminderTime==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(p.reminderTime)?p.reminderTime:'18:00',model:['auto','off','0.6b','1.7b','4b'].includes(p.model)?p.model:'auto'};
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
