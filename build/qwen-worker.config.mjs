import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';

// Build separately from the app's server/RSC environments. The optional model
// code belongs in a browser worker, never the server or initial workout graph.
export default defineConfig({
 publicDir:false,
 resolve:{alias:[{find:/^(?:node:)?(?:url|module)$/,replacement:fileURLToPath(new URL('./worker-node-refusal.ts',import.meta.url))}]},
 build:{
  outDir:'public/runtime',emptyOutDir:true,sourcemap:false,
  lib:{entry:{'qwen-worker':fileURLToPath(new URL('../lib/qwen-runtime.worker.ts',import.meta.url)),
    'workout-coaching-worker':fileURLToPath(new URL('../lib/workout-coaching.worker.ts',import.meta.url))},formats:['es'],fileName:(_format,entry)=>entry+'.js'},
 },
});
