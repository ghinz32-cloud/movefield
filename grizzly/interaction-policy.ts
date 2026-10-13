/** Decoration never delays, intercepts, or changes a training action. */
export function wildMotionAllowed(style:string,reduceMotion:boolean,contrast:boolean,systemReduce:boolean,hidden:boolean){
 return (style==='wild'||style==='og')&&!reduceMotion&&!contrast&&!systemReduce&&!hidden;
}
export function impactPoint(x:number,y:number,width:number,height:number){
 return {x:Math.max(0,Math.min(width,Number.isFinite(x)?x:width/2)),y:Math.max(0,Math.min(height,Number.isFinite(y)?y:height/2))};
}
export const impactParticles=Array.from({length:10},(_,n)=>({x:Math.cos(n*Math.PI/5)*(54+n%3*17),y:Math.sin(n*Math.PI/5)*(44+n%4*11)-20,turn:(n%2?1:-1)*(45+n*17),leaf:n%3!==0}));
