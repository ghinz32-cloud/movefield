import {parseSafeJson,readSavedState} from './saved-data';
import type {State} from './training';

/** A compatible reader must not silently strip a field from an older backup. */
export function assertPreservedFields(before:unknown,after:unknown,path='profile'):void {
 const fail=(field:string)=>Error('This build cannot preserve the old field '+field+'. Original training and device keys are kept.');
 if(Array.isArray(before)){
  if(!Array.isArray(after)||before.length!==after.length)throw fail(path);
  before.forEach((value,index)=>assertPreservedFields(value,after[index],path+'.'+index));return;
 }
 if(before&&typeof before==='object'){
  if(!after||typeof after!=='object')throw fail(path);
  for(const [field,value] of Object.entries(before)){
   if(path==='profile'&&field==='schema'&&value===2&&(after as {schema?:number}).schema===3)continue;
   if(!Object.prototype.hasOwnProperty.call(after,field))throw fail(path+'.'+field);
   assertPreservedFields(value,(after as Record<string,unknown>)[field],path+'.'+field);
  }return;
 }
 if(before!==after)throw fail(path);
}

export function readPreservedState(raw:string):State {
 const original=parseSafeJson(raw,24_000_000),state=readSavedState(raw);
 assertPreservedFields(original,state);return state;
}
