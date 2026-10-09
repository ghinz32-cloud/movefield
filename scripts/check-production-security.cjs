const {createRequire}=require('node:module'),path=require('node:path'),assert=require('node:assert/strict'),fs=require('node:fs');
const r=createRequire(path.resolve('package.json')),w=createRequire(r.resolve('wrangler/package.json')),{Miniflare}=w('miniflare');
const root=path.resolve('dist/server');
const files=fs.readdirSync(root,{recursive:true}).filter(x=>/\.m?js$/.test(x)).sort((a,b)=>a==='index.js'?-1:b==='index.js'?1:a.localeCompare(b));
async function main(){
 const mf=new Miniflare({modules:files.map(x=>({type:'ESModule',path:path.join(root,x),contents:fs.readFileSync(path.join(root,x),'utf8')})),modulesRoot:root,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],assets:{directory:path.resolve('dist/client'),routerConfig:{has_user_worker:true}},port:0});
 // Consume every response; abandoned SSR streams keep the worker alive at cleanup.
 const request=async(path='/',options)=>{const response=await mf.dispatchFetch('https://example.test'+path,options);return {response,bytes:new Uint8Array(await response.arrayBuffer())}};
 try{
  const {response:res,bytes}=await request(),body=new TextDecoder().decode(bytes),csp=res.headers.get('Content-Security-Policy'),nonce=csp?.match(/'nonce-([^']+)'/)?.[1];
  assert.equal(res.status,200);assert.ok(nonce);
  const modelPolicy=JSON.parse(fs.readFileSync('lib/qwen-network-policy.json','utf8'));
  const modelSources=[...new Set(modelPolicy.assets.flatMap(a=>[a.url,a.finalUrl]))];
  assert.equal(csp.split('; ').find(s=>s.startsWith('connect-src ')),`connect-src 'self' ${modelSources.join(' ')}`);
  assert.ok(csp.includes("worker-src 'self'")&&!csp.includes("'wasm-unsafe-eval'")&&!csp.includes("'unsafe-eval'"),'page permits same-origin workers without permitting page WASM or JavaScript eval');
  const runtime=await request('/runtime/qwen-worker.js'),workerPolicy=runtime.response.headers.get('Content-Security-Policy');
  assert.equal(runtime.response.status,200);assert.ok(runtime.bytes.length>10000);
  assert.equal(workerPolicy,"default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'",'worker permits bundled scripts/WASM only, with all network requests and child workers refused');
  const scripts=[...body.matchAll(/<script\b([^>]*)>/g)];assert.ok(scripts.length);
  for(const s of scripts)assert.ok(s[1].includes('nonce="'+nonce+'"'),'script missing nonce: '+s[1]);
  assert.notEqual((await request()).response.headers.get('Content-Security-Policy'),csp);
  assert.equal((await request('/',{method:'POST'})).response.status,405);
  for(const route of ['/__vinext/cache','/qa-preview','/exercise-photos/Air_Bike/0.jpg'])assert.equal((await request(route)).response.status,404,route);
  const starterPath=fs.readFileSync('app/page.tsx','utf8').match(/href=\{publicPath\('((?:downloads\/)movefield-mobile[^']+\.zip)'\)\}/)?.[1];
  assert.ok(starterPath,'Settings must link to the current generated starter');
  assert.equal(starterPath,'downloads/movefield-mobile-r14.zip');
  const starter=await request('/'+starterPath);
  assert.equal(starter.response.status,200);assert.equal(starter.bytes[0],80);assert.equal(starter.bytes[1],75);assert.ok(starter.bytes.length>1000);
  const privacy=await request('/privacy.html'),privacyText=new TextDecoder().decode(privacy.bytes);
  assert.equal(privacy.response.status,200);
  assert.deepEqual(privacy.bytes,new Uint8Array(fs.readFileSync('public/privacy.html')),'Hosted privacy notice matches the current source exactly');
  assert.ok(!/<(?:script|form)\b/i.test(privacyText),'Privacy notice has no scripts or data-entry form');
  const privacyPolicy=privacyText.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i)?.[1];
  assert.ok(privacyPolicy?.includes("script-src 'none'")&&privacyPolicy.includes("connect-src 'none'")&&privacyPolicy.includes("form-action 'none'"),'Static privacy notice refuses script, network and form execution');
  for(const asset of ['/fonts/inter-variable.ttf','/fonts/barlow-condensed-semibold.ttf','/brand/movefield-mark.svg'])assert.equal((await request(asset)).response.status,200,asset);
  console.log(JSON.stringify({brandAssetsAvailable:true,nativeStarterAvailable:true,privacyNoticeMatchesSource:true,privacyNoticeStaticPolicy:true,status:res.status,scripts:scripts.length,nonceMatched:true,nonceRotates:true,writeRouteClosed:true,internalRouteClosed:true,qaRouteAbsent:true,unclearedPhotosAbsent:true,cache:res.headers.get('Cache-Control')}));
 }finally{await mf.dispose()}
}
main().then(()=>process.exit(0),error=>{console.error(error);process.exit(1)});
