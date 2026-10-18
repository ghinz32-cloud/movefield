import {isGrizzly} from './brand';
import {palettes,type AppPreferences} from './app-preferences';

/** The website's reading surfaces and accent treatment, expressed without CSS
 * for native clients. Keep controls legible independently of decorative art. */
export function interfaceColors(p:AppPreferences,dark:boolean,grizzly=isGrizzly){
 const palette=palettes.find(x=>x.id===p.palette)||palettes[0];
 const wild=grizzly&&p.grizzlyStyle==='wild';
 const blend=(a:string,b:string,amount:number)=>'#'+[0,2,4].map(offset=>Math.round(parseInt(a.slice(1+offset,3+offset),16)*amount+parseInt(b.slice(1+offset,3+offset),16)*(1-amount)).toString(16).padStart(2,'0')).join('');
 let bg=dark?'#10191d':'#f5f7f8',ink=dark?'#edf3f5':'#15262a',white=dark?'#19262c':'#ffffff';
 let muted=dark?'#b4c7cf':'#53646a',line=dark?'#405660':'#dce3e7',inputBorder=dark?'#7d949e':'#71858e',pale=dark?'#293c44':'#e8edf0';
 if(grizzly){
  bg=dark?'#171a16':'#f6f3ec';ink=dark?'#f4f2e9':'#292923';white=dark?'#232820':'#fffefa';
  muted=dark?'#c1c7b6':'#5b5a4f';line=dark?'#535c48':'#cec5b6';inputBorder=dark?'#a0a68e':'#81735e';pale=dark?'#343d31':'#e9e4d9';
 }
 if(wild){
  bg=dark?'#07130e':'#eef3f5';ink=dark?'#f5f1e3':'#182732';white=dark?'#132219':'#f9fcfd';
  muted=dark?'#c0cbb7':'#4d5f6c';line=dark?'#637457':'#9fafba';inputBorder=dark?'#a8b38a':'#677d8d';pale=dark?'#293a2b':'#dbe5ea';
 }
 if(p.contrast){muted=dark?'#e4eef3':'#253b44';line=dark?'#a4bbc6':'#637982';inputBorder=dark?'#cfdee5':'#304c58'}
 const green=dark?palette.from:palette.strong,onAccent=dark?'#132325':'#ffffff';
 const heroForest=wild&&!p.contrast;
 return {
  bg,ink,white,muted,line,inputBorder,pale,green,onAccent,
  soft:p.contrast?white:blend(palette.from,white,dark?.1:.15),
  danger:dark?'#ffadb6':'#b62d3b',from:palette.from as string,to:palette.to as string,effect:'#d6b77c',
  heroFrom:heroForest?'#0b2117':palette.from as string,
  heroTo:heroForest?'#183b25':p.contrast?palette.from as string:palette.to as string,
  heroInk:heroForest?'#f5e6c6':'#132325',heroMuted:heroForest?'#c5cbb9':'#263e32',
  heroButton:heroForest?palette.from:'#172c30',heroOnButton:heroForest?'#132325':'#ffffff',
  heroBorder:heroForest?'#9a8858':palette.strong as string,
 };
}
