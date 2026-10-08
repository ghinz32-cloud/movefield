export type MovementGuide={variant:string;summary?:string;equipment?:string[];setup:string[];execution:string[];finish?:string[];breathing:string[];commonErrors:string[];easierOption:string;safety:string;loadConvention:string;sourceURLs?:string[];sourceNote?:string;quickCues?:string[];terms?:{term:string;meaning:string}[]};
export type ExerciseMedia={name?:string;sourceUrl?:string;videoUrl?:string|null;hasVideo?:boolean;images?:string[];verification?:string};
// The upstream maintainer cannot confirm source-photo rights. Keep candidates
// in the provenance manifest, but do not request or redistribute the images.
export const exercisePhotoRightsCleared=false;
type Content={guides:Record<string,MovementGuide>;media:Record<string,ExerciseMedia>};
let pending:Promise<Content>|undefined;
/** Guides are a large optional download. Share one request and allow retry. */
export function loadExerciseContent():Promise<Content>{
 if(!pending)pending=Promise.all(['/exercise-guides.json','/exercise-content.json'].map(async path=>{
  const response=await fetch(path);
  if(!response.ok)throw Error('The exercise guide could not load.');
  return response.json();
 })).then(([guides,media])=>({guides:guides as Content['guides'],media:media as Content['media']})).catch(error=>{pending=undefined;throw error});
 return pending!;
}
