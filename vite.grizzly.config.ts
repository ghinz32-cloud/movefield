import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';
import {offlineShell} from './build/offline-plugin';
const base='/movefield/grizzly/';
export default defineConfig({
 root:resolve(import.meta.dirname,'grizzly'),base,publicDir:resolve(import.meta.dirname,'public'),
 resolve:{alias:{'@':resolve(import.meta.dirname)}},
 define:{__MOVEFIELD_REVIEW_BASE__:JSON.stringify(base),__MOVEFIELD_APP_VARIANT__:'"grizzly"','process.env.NODE_ENV':'"production"'},
 plugins:[{
  name:'isolated-grizzly-profile',enforce:'pre',
  transform(code,id){if(id.includes('/node_modules/')||!/[.](?:ts|tsx|js|jsx)$/.test(id))return;return code.replaceAll('training-studio','grizzly-training-studio').replaceAll('movefield-private-records-v1','grizzly-private-records-v1').replaceAll('movefield-cloud-outbox-v1','grizzly-cloud-outbox-v1')},
 },react(),offlineShell(base,true,'grizzly-fitness-shell-', ['fonts/bungee-regular.ttf','fonts/rubik-beastly-regular.ttf','fonts/metal-mania-regular.ttf','brand/grizzly-fitness-logo.jpg','grizzly-favicon.svg','grizzly-paw.svg'])],
 build:{outDir:resolve(import.meta.dirname,'.sites-runtime/github-pages-grizzly'),emptyOutDir:true},
});
