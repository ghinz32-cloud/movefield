const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
const requireWrangler=createRequire(require.resolve('wrangler/package.json')),{Miniflare}=requireWrangler('miniflare');
const root=path.resolve('.sites-runtime/pages/_worker.js');
const modules=fs.readdirSync(root,{recursive:true}).filter(x=>/\.m?js$/.test(x)).sort((a,b)=>a==='index.js'?-1:b==='index.js'?1:a.localeCompare(b)).map(file=>({type:'ESModule',path:path.join(root,file),contents:fs.readFileSync(path.join(root,file),'utf8')}));
(async()=>{
 const mf=new Miniflare({modules,modulesRoot:root,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],assets:{directory:path.resolve('.sites-runtime/pages'),binding:'ASSETS',routerConfig:{has_user_worker:true,invoke_user_worker_ahead_of_assets:true}},bindings:{MOVEFIELD_CLOUD_ENABLED:'true',FREE_ALLOWANCE_VERIFIED:'true',AI_PROVIDER_VERIFIED:'true',NATIVE_AUTH_VERIFIED:'true'},port:0});
 async function request(route,options){const response=await mf.dispatchFetch('https://pages.example.test'+route,options),bytes=await response.arrayBuffer();return new Response([204,205,304].includes(response.status)?null:bytes,{status:response.status,headers:response.headers})}
 try{
  const response=await request('/'),html=await response.text(),csp=response.headers.get('Content-Security-Policy'),nonce=csp?.match(/'nonce-([^']+)'/)?.[1];
  assert.equal(response.status,200);assert.ok(nonce);for(const [,attributes] of html.matchAll(/<script\b([^>]*)>/g))assert.ok(attributes.includes('nonce="'+nonce+'"'));
  assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.notEqual((await request('/')).headers.get('Content-Security-Policy'),csp);
  const receipt=JSON.parse(fs.readFileSync('.sites-runtime/pages-package-receipt.json','utf8'));
  for(const [file,expected] of Object.entries(receipt.files)){const actual=require('node:crypto').createHash('sha256').update(fs.readFileSync(path.resolve('.sites-runtime/pages',file))).digest('hex');assert.equal(actual,expected,'Package changed after receipt: '+file)}
  const asset=Object.keys(receipt.files).find(file=>file.startsWith('_next/')&&file.endsWith('.js'));assert.ok(asset);
  for(const file of ['/'+asset,'/fonts/inter-variable.ttf','/brand/movefield-mark.svg','/downloads/movefield-native-current.zip','/movefield-sw.js']){const response=await request(file);assert.equal(response.status,200,file);assert.equal(response.headers.get('Strict-Transport-Security'),'max-age=31536000; includeSubDomains');assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');const bytes=Buffer.from(await response.arrayBuffer()),expected=require('node:crypto').createHash('sha256').update(bytes).digest('hex');assert.equal(expected,receipt.files[file.slice(1)],'Served asset differs: '+file)}
  assert.equal((await request('/fonts/inter-variable.ttf',{method:'POST'})).status,405);
  assert.equal((await request('/_worker.js/application/index.js')).status,404);
  assert.equal((await request('/__vinext/cache')).status,404);
  assert.deepEqual(await (await request('/api/cloud/capabilities')).json(),{accounts:false,backups:false,coaching:false});assert.equal((await request('/api/cloud/profile')).status,503);
  const report={checkedAt:new Date().toISOString(),scope:'Exact locally packaged Pages modules and assets through Miniflare; no upload, connected account or live Pages claim.',passed:['nonce SSR shell and nonce rotation','all packaged file hashes','byte-identical JS, fonts, brand, native ZIP and service worker','static security headers and write rejection','server source and internal route denied','review package keeps cloud and AI off despite old project flags']};fs.writeFileSync('.sites-runtime/pages-check-receipt.json',JSON.stringify(report,null,2)+'\n');console.log('PASS Pages review package: SSR, exact assets, private routes, security headers and closed live-service gates');
 }finally{await mf.dispose()}
})().catch(error=>{console.error(error);process.exitCode=1});
