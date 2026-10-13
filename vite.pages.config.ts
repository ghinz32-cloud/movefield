import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
const root=process.cwd();
export default defineConfig({root:path.join(root,'static-web'),base:'/movefield/',publicDir:false,define:{'__MOVEFIELD_PAGES__':'true','__MOVEFIELD_PUBLIC_BASE__':JSON.stringify('/movefield/')},plugins:[{name:'pages-font-base',enforce:'pre',transform(code,id){if(id.endsWith('/app/globals.css'))return code.replaceAll("url('/fonts/","url('/movefield/fonts/");}},react()],resolve:{alias:[{find:'@/components/qwen-demo',replacement:path.join(root,'static-web/qwen-unavailable.tsx')},{find:'@',replacement:root}]},build:{chunkSizeWarningLimit:1000,outDir:path.join(root,'dist-pages'),emptyOutDir:true,sourcemap:false,rollupOptions:{external:id=>/^\/movefield\/fonts\/[\w.-]+\.(?:ttf|woff2)$/.test(id)}}});
