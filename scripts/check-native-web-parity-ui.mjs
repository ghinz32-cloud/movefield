import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {resolve,extname,relative} from 'node:path';
import {chromium} from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';

// Reuse source-bound actual-App bundles from the adaptive builder, with exactly
// its synthetic state/OS boundary. Never rebuild or silently use older sources.
const input=resolve(process.env.NATIVE_UI_OUTPUT||'.sites-runtime/native-web-parity-2026-10-18/adaptive');
const output=resolve(process.env.NATIVE_PARITY_OUTPUT||'.sites-runtime/native-web-parity-2026-10-18/after');
for(const path of [input,output])assert.ok(!relative(resolve('.sites-runtime'),path).startsWith('..'),'Receipts must stay in ignored .sites-runtime');
const artifactReceipt=resolve(process.env.NATIVE_PARITY_ARTIFACT_RECEIPT||resolve(input,'results.json'));
const matrix=JSON.parse(await readFile(artifactReceipt,'utf8'));
const hash=value=>createHash('sha256').update(value).digest('hex');
async function sourcesUnchanged(){for(const [file,expected] of Object.entries(matrix.sourceHashes))assert.equal(hash(await readFile(file)),expected,'Adaptive artifact source no longer current: '+file)}
async function artifactsUnchanged(){assert.equal(matrix.artifacts?.length,2,'Use a fresh two-brand adaptive receipt with actual artifact hashes');for(const artifact of matrix.artifacts)for(const {file,SHA256} of artifact.files)assert.equal(hash(await readFile(resolve(input,artifact.variant,file))),SHA256,'Source-bound App artifact changed: '+artifact.variant+'/'+file)}
await sourcesUnchanged();await artifactsUnchanged();await mkdir(output,{recursive:true});
const results=[],captures=[],errors=[],servers=[];let completed=false;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',chromiumSandbox:true,args:['--disable-setuid-sandbox'],env:{...process.env,XDG_CONFIG_HOME:resolve('.sites-runtime/config'),XDG_CACHE_HOME:resolve('.sites-runtime/cache')}});
const button=(page,name)=>page.getByRole('button',{name,exact:true});
const saved=page=>page.evaluate(()=>window.nativeUiState());
async function serve(dir){const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://local').pathname,file=resolve(dir,'.'+(path==='/'?'/index.html':path));assert.ok(file.startsWith(dir+'/'));const bytes=await readFile(file);res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.ttf':'font/ttf','.jpg':'image/jpeg','.png':'image/png'})[extname(file)]||'application/octet-stream'});res.end(bytes)}catch{res.writeHead(404);res.end()}});await new Promise(done=>server.listen(0,'127.0.0.1',done));servers.push(server);return 'http://127.0.0.1:'+server.address().port}
async function ready(page){await page.getByRole('heading',{name:'Today',exact:true}).waitFor();await page.evaluate(async()=>{await Promise.all(['16px Inter','600 25px "Barlow Condensed"','25px Frijole'].map(spec=>document.fonts.load(spec)));await document.fonts.ready;document.title='Native app interface qualification';});}
async function navigate(page,label){if(!await button(page,'Open navigation menu').isVisible()){if(await button(page,'Workout').isVisible())await button(page,'Workout').click();await button(page,'Today').click();}await button(page,'Open navigation menu').click();await page.getByTestId('native-workspace-menu').getByRole('button',{name:label,exact:true}).click();await button(page,'Close navigation').waitFor({state:'hidden'});}
async function snapshot(page,brand,scale,screen,{axe=true,action}={}){
 for(const viewport of [{width:360,height:780},{width:390,height:844}]){
  await page.setViewportSize(viewport);await page.evaluate(()=>document.fonts.ready);
  const metrics=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,headings:[...document.querySelectorAll('[role=heading]')].filter(el=>el.getBoundingClientRect().height).map(el=>({text:el.textContent,font:getComputedStyle(el).fontFamily,size:getComputedStyle(el).fontSize})),scroll:[...document.querySelectorAll('div')].filter(el=>getComputedStyle(el).overflowY==='auto'&&el.scrollHeight>el.clientHeight&&el.clientHeight).map(el=>({height:el.clientHeight,scrollHeight:el.scrollHeight,scrollTop:el.scrollTop}))}));
  assert.ok(metrics.scrollWidth<=viewport.width+1&&metrics.scrollHeight<=viewport.height+1,'Bounded root '+brand+' '+screen);
  let actionBox;if(action){actionBox=await button(page,action).boundingBox();assert.ok(actionBox&&actionBox.height>=44&&actionBox.y>=0&&actionBox.y+actionBox.height<=viewport.height+1,'Primary action remains visible: '+screen)}
  const filename=`${brand}-${screen}-${scale}-${viewport.width}.png`;await page.screenshot({path:resolve(output,filename)});
  let violations=[];if(axe&&viewport.width===360){const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();violations=audit.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary})).slice(0,8)}));}
  captures.push({brand,scale,screen,viewport,screenshot:filename,...metrics,actionBox,axeRun:axe&&viewport.width===360,violations});
  console.log('Captured '+filename+(violations.length?' AXE '+JSON.stringify(violations):''));
 }
}
async function underlinePreference(page,brand){
 const initial=await saved(page),observations=[];
 for(const enabled of [true,false]){
  await navigate(page,'Profile & settings');
  const accessibility=page.getByRole('button',{name:/^Accessibility(?:\.|$)/});
  if(await accessibility.count())await accessibility.click();
  const toggle=page.getByRole('switch',{name:'Underline text links',exact:true});
  if((await toggle.getAttribute('aria-checked'))!==String(enabled))await toggle.click();
  await navigate(page,'Sources');await page.getByRole('heading',{name:'Science and sources',exact:true}).waitFor();
  const link=page.getByRole('link').first();await link.waitFor();
  await page.waitForFunction(({enabled})=>{const n=document.querySelector('[role="link"]');return n&&[n,...n.querySelectorAll('*')].some(el=>getComputedStyle(el).textDecorationLine.includes('underline'))===enabled;},{enabled});
  observations.push({enabled,label:await link.innerText(),underlined:await link.evaluate(n=>[n,...n.querySelectorAll('*')].some(el=>getComputedStyle(el).textDecorationLine.includes('underline')))});
  await button(page,'Close Science and sources').click();
 }
 assert.deepEqual(await saved(page),initial,'Link display preference never changes training');
 results.push({brand,check:'Actual Underline text links toggle updates rendered source-link decoration on and off',passed:true,observations});
 await navigate(page,'Today');
}
async function contextualWorkout(page,brand,scale){
 const initial=await saved(page),target=initial.active.targets[0];
 await button(page,'Resume workout').click();const amount=page.getByLabel(/ set 1 actual reps$/);await amount.waitFor();const name=(await amount.getAttribute('aria-label')).replace(' set 1 actual reps','');
 await snapshot(page,brand,scale,'logger',{action:'Log '+name+' set 1'});
 await button(page,'Guide').click();await button(page,'Learn the movement').waitFor();assert.deepEqual(await saved(page),initial,'Guide opens without changing training');await button(page,'Close Exercise guide').click();
 await button(page,'Substitute exercise').click();await page.getByRole('heading',{name:'Choose a substitute',exact:true}).waitFor();assert.deepEqual(await saved(page),initial,'Opening substitutes preserves accepted exercise/records');await page.getByRole('button',{name:'Close Choose a substitute',exact:true}).click();
 const measurements=button(page,'Set 1: optional measurements and notes');assert.equal(await measurements.getAttribute('aria-expanded'),'false');await measurements.click();assert.equal(await measurements.getAttribute('aria-expanded'),'true');await measurements.click();assert.equal(await measurements.getAttribute('aria-expanded'),'false');assert.deepEqual(await saved(page),initial,'Opening optional measurements preserves training');
 await amount.fill('9');const rir=button(page,'Reps left: not recorded');assert.equal(await rir.getAttribute('aria-expanded'),'false');await rir.click();assert.equal(await rir.getAttribute('aria-expanded'),'true');await button(page,`${name} set 1 reps left: 2`).click();await page.waitForFunction(()=>window.nativeUiState().active.sets[0].rir===2);await button(page,'Reps left: 2').click();assert.equal(await button(page,'Reps left: 2').getAttribute('aria-expanded'),'false');await button(page,`${name} set 1 reps left: 2`).waitFor({state:'hidden'});assert.equal(await amount.inputValue(),'9','Inline effort selection preserves reps');
 await button(page,'Log '+name+' set 1').click();await page.waitForFunction(()=>window.nativeUiState().active.sets[0].done);const logged=await saved(page);assert.equal(logged.active.sets[0].kg,null);assert.equal(logged.active.sets[0].rir,2);assert.ok(logged.restTimer);const second=page.getByLabel(name+' set 2 actual reps',{exact:true});await second.fill('7');await page.waitForFunction(()=>window.nativeUiState().active.sets[1].reps===7);const stable=await saved(page);
 await button(page,'Previous sets').click();await page.getByRole('button',{name:/^Set 1\. Saved(?:\.|$)/}).click();assert.equal(await page.getByLabel(name+' set 1 actual reps',{exact:true}).inputValue(),'9');await button(page,'Previous sets').click();await page.getByRole('button',{name:/^Set 2\. Not logged(?:\.|$)/}).click();assert.equal(await second.inputValue(),'7');
 await button(page,'Rest timer').click();await page.getByRole('heading',{name:'Rest timer',exact:true}).waitFor();await button(page,'Back to workout').click();assert.deepEqual(await saved(page),stable,'Read-only timer and set navigation retain exact rest deadline and all state');
 await button(page,'Plan instructions & starting load ›').click();await page.getByRole('heading',{name:'Plan instructions',exact:true}).waitFor();await button(page,'Back to current set').click();assert.deepEqual(await saved(page),stable);
 await navigate(page,'Today');await button(page,'Resume workout').click();assert.equal(await second.inputValue(),'7');assert.deepEqual(await saved(page),stable,'Workspace navigation preserves active set, history and rest');
 results.push({brand,scale,check:'Direct Guide/Substitute; inline reps-left; actual unknown-load log; previous-set values; rest/instruction navigation; workspace return',passed:true,exerciseId:target.exerciseId});
}
async function setupJourney(page,brand,scale,origin){
 await page.goto(origin+'/?setup');await ready(page);if(scale===130){await navigate(page,'Profile & settings');await page.getByRole('radio',{name:'Larger',exact:true}).click();assert.equal(await page.getByRole('radio',{name:'Larger',exact:true}).getAttribute('aria-checked'),'true');await navigate(page,'Today');}
 const initial=await saved(page);await button(page,'Build my plan').click();await page.getByRole('heading',{name:'About you',exact:true}).waitFor();assert.equal(await page.getByLabel('Setup sections',{exact:true}).count(),1);await snapshot(page,brand,scale,'setup',{action:'Continue to goal'});await page.setViewportSize({width:360,height:780});const rail=page.getByLabel('Setup sections',{exact:true});assert.ok(await rail.evaluate(n=>n.tabIndex>=0),'Setup progress strip receives keyboard focus');await rail.focus();await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('[aria-label="Setup sections"]').scrollLeft>0);await rail.evaluate(n=>{n.scrollLeft=0;n.blur()});
 await button(page,'Continue to goal').click();await button(page,'Your setup summary').click();assert.equal(await button(page,'Your setup summary').getAttribute('aria-expanded'),'true');await page.getByText(/Font layout fixture/).waitFor();await button(page,'Your setup summary').click();
 // Walk actual steps with the existing valid defaults; explicitly confirm the
 // inventory at its real prompt rather than bypassing equipment validation.
 for(let i=0;i<22;i++){
  if(await page.getByRole('heading',{name:'Choose your plan',exact:true}).count())break;
  const confirm=button(page,'Confirm this equipment list');if(await confirm.count())await confirm.click();
  const next=page.getByRole('button',{name:/^(Continue to |See my plans$)/}).last();assert.equal(await next.count(),1,'A setup next action is present');await next.click();
 }
 await page.getByRole('heading',{name:'Choose your plan',exact:true}).waitFor();assert.deepEqual(await saved(page),initial,'Plan preview has not accepted or replaced training');
 await snapshot(page,brand,scale,'plan-choice');
 const others=page.getByRole('button',{name:/^Show other plans · /});assert.ok(await others.count(),'Fixture offers alternative plans');await others.click();await page.getByText(/^Other plans 1–3 of /).waitFor();const reviews=page.getByRole('button',{name:/^Review /}).filter({hasNotText:'Review this plan'});assert.equal(await reviews.count(),3,'Exactly three alternative review actions in first page');const names=await reviews.allTextContents();await button(page,'More choices').click();await page.getByText(/^Other plans 4–6 of /).waitFor();assert.notDeepEqual(await reviews.allTextContents(),names,'Pagination changes actual alternatives');assert.equal(await reviews.count(),3);
 await page.getByText(/^Other plans 4–6 of /).evaluate(n=>n.scrollIntoView({block:'start'}));await snapshot(page,brand,scale,'plan-alternatives');await button(page,'Previous choices').click();await reviews.first().click();await page.getByRole('heading',{name:'Review your plan',exact:true}).waitFor();await snapshot(page,brand,scale,'plan-review',{action:'Start this plan'});assert.deepEqual(await saved(page),initial,'Review does not change accepted training');
 results.push({brand,scale,check:'Four-section setup; expandable summary; real inventory confirmation;3 alternative cards/page; selecting/reviewing alternative preserves accepted state',passed:true});
}
try{
 for(const brand of ['movefield','grizzly']){
  const origin=await serve(resolve(input,brand));
  for(const scale of [100,130]){
   const context=await browser.newContext({viewport:{width:360,height:780},reducedMotion:'reduce',serviceWorkers:'block'});await context.route('**/*',route=>new URL(route.request().url()).origin===origin&&route.request().method()==='GET'?route.continue():route.abort('blockedbyclient'));const page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',error=>errors.push({brand,scale,message:error.message}));
   try{
    await page.goto(origin);await ready(page);if(scale===130){await navigate(page,'Profile & settings');await page.getByRole('radio',{name:'Larger',exact:true}).click();assert.equal(await page.getByRole('radio',{name:'Larger',exact:true}).getAttribute('aria-checked'),'true');await navigate(page,'Today');}
    const state=await saved(page);await snapshot(page,brand,scale,'today');await button(page,'Open navigation menu').click();await snapshot(page,brand,scale,'navigation');await button(page,'Close navigation').click();
    await navigate(page,'Profile & settings');await page.getByRole('tab',{name:'Appearance',exact:true}).waitFor();assert.equal(await page.getByRole('tab',{name:'Appearance',exact:true}).getAttribute('aria-selected'),'true');await snapshot(page,brand,scale,'settings');await page.getByRole('tab',{name:'Training',exact:true}).click();assert.equal(await page.getByRole('tab',{name:'Training',exact:true}).getAttribute('aria-selected'),'true');await page.getByText('Workout coaching',{exact:true}).waitFor();await page.getByRole('tab',{name:'Profile & data',exact:true}).click();await page.getByRole('button',{name:/^Profile & equipment(?:\.|$)/}).waitFor();await page.getByRole('tab',{name:'Appearance',exact:true}).click();await page.getByRole('button',{name:/^Color palette(?:\.|$)/}).click();assert.equal(await page.getByRole('radio',{checked:true}).count(),1,'Current palette checked state is exposed');await button(page,'Done').click();await page.getByRole('heading',{name:'Settings',exact:true}).waitFor();assert.deepEqual(await saved(page),state,'Settings categories and gallery return preserve training');await navigate(page,'Today');
    if(scale===100)await underlinePreference(page,brand);await contextualWorkout(page,brand,scale);await setupJourney(page,brand,scale,origin);
   }catch(error){await page.screenshot({path:resolve(output,`${brand}-${scale}-failure.png`)});await writeFile(resolve(output,`${brand}-${scale}-failure.json`),JSON.stringify({error:String(error),text:await page.locator('body').innerText()},null,2));throw error}finally{await context.close()}
  }
 }
 await sourcesUnchanged();await artifactsUnchanged();assert.deepEqual(errors,[]);const violations=captures.filter(c=>c.violations.length);assert.deepEqual(violations,[],'No automated WCAG-tag violations in captured finite states');completed=true;
}finally{
 await writeFile(resolve(output,'results.json'),JSON.stringify({status:completed?'passed':'failed',checkedAt:new Date().toISOString(),sourceHashes:matrix.sourceHashes,artifacts:matrix.artifacts,artifactReceipt,artifactReceiptKind:matrix.kind,scope:'Actual native App via source-matched and byte-verified RNWeb adaptive artifacts; real bundled fonts, synthetic memory storage and mocked OS/account boundaries.360/390px100/130%apptext. Automated finite-state axe scans and contextual callbacks, not physical phone/TalkBack/UIKit certification.',results,captures,errors},null,2)+'\n');await browser.close();for(const server of servers)await new Promise(done=>server.close(done));
}
console.log('PASS native web parity contextual journeys and visual states');
