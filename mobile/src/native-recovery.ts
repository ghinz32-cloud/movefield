/** Tracks already-started native actions across an unexpected screen teardown. */
export function createNativeRecoveryGate(){
 let open=true;
 const pending=new Set<Promise<unknown>>();
 return {
  isOpen:()=>open,
  reopen:()=>{open=true},
  close:()=>{open=false},
  run<T>(action:()=>Promise<T>):Promise<T>{
   if(!open)return Promise.reject(Error('This screen has closed. Reopen the saved app before continuing.'));
   let task:Promise<T>;
   try{task=Promise.resolve(action())}catch(error){task=Promise.reject(error)}
   pending.add(task);
   void task.then(()=>pending.delete(task),()=>pending.delete(task));
   return task;
  },
  async settle(){while(pending.size)await Promise.allSettled([...pending])},
 };
}
