import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';

// Build separately from the app's server/RSC environments. The optional model
// code belongs in a browser worker, never the server or initial workout graph.
export default defineConfig({
 publicDir:false,
 build:{
  outDir:'public/runtime',emptyOutDir:true,sourcemap:false,
  lib:{entry:fileURLToPath(new URL('../lib/qwen-runtime.worker.ts',import.meta.url)),formats:['es'],fileName:()=> 'qwen-worker.js'},
 },
});
