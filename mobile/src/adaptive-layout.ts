/** Available-window layout only. These dimensions do not identify a physical hinge. */
export function nativeWindowLayout(width:number,height:number,textSize=100,fontScale=1){
 const scale=Math.max(1,textSize/100)*Math.max(1,fontScale);
 return {
  compactHeight:height<500,
  expanded:height>=600&&width>=Math.max(840,704*scale+36),
  readingWidth:Math.max(680,Math.min(840,680*scale)),
  listWidth:Math.round(240*Math.min(scale,1.5)),
 };
}
