import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';
import {offlineShell} from './build/offline-plugin';
const base='/movefield/review/';
export default defineConfig({
 root:resolve(import.meta.dirname,'github-pages'),base,publicDir:resolve(import.meta.dirname,'public'),
 resolve:{alias:{'@':resolve(import.meta.dirname)}},
 define:{__MOVEFIELD_REVIEW_BASE__:JSON.stringify(base),'process.env.NODE_ENV':'"production"'},
 plugins:[{
  name:'isolated-review-profile',enforce:'pre',
  transform(code,id){if(id.includes('/node_modules/')||!/[.](?:ts|tsx|js|jsx)$/.test(id))return;return code.replaceAll('training-studio','movefield-review-training-studio').replaceAll('movefield-private-records-v1','movefield-review-private-records-v1').replaceAll('movefield-cloud-outbox-v1','movefield-review-cloud-outbox-v1')},
 },react(),offlineShell(base,true)],
 build:{outDir:resolve(import.meta.dirname,'.sites-runtime/github-pages-review'),emptyOutDir:true},
});
