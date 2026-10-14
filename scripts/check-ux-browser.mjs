import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
const {load}=createRequire(import.meta.url)('./domain-test-loader.cjs');
const name=load('lib/training.ts').exFor('bench').name;
const bases=[['movefield',process.env.MOVEFIELD_REVIEW_URL||'http://127.0.0.1:8826/movefield/review/'],['grizzly',process.env.GRIZZLY_REVIEW_URL||'http://127.0.0.1:8827/movefield/grizzly/']];
for(const [,base] of bases)assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname),'Local synthetic tests only');
const dir=resolve('.sites-runtime/ux-browser');await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',chromiumSandbox:true,args:['--disable-setuid-sandbox'],env:{...process.env,XDG_CONFIG_HOME:resolve('.sites-runtime/config'),XDG_CACHE_HOME:resolve('.sites-runtime/cache')}}),results=[];
try{
 for(const [brand,base] of bases){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(/exercise-(guides|content)\.json$/.test(new URL(request.url()).pathname))requests.push(request.url())});
  let fail=true;await page.route('**/exercise-guides.json',route=>fail?route.fulfill({status:503,body:'Synthetic missing reference'}):route.continue());
  await page.goto(base);await page.getByRole('button',{name:'Explore sample training',exact:true}).waitFor();
  assert.equal(requests.length,0,'Detailed library must not compete with welcome rendering');
  await page.getByRole('button',{name:'Explore sample training',exact:true}).click();await page.getByRole('heading',{name:'Today',exact:true}).waitFor();
  assert.equal(requests.length,0,'Today must not fetch reference data before a guide is opened');
  await page.getByRole('region',{name:'Today’s training'}).getByRole('button',{name:'Start workout',exact:true}).click();
  await page.getByRole('heading',{name:'Exercises in this workout',exact:true}).waitFor();
  const workoutAxe=[];
  for(const state of ['overview','focused logger']){
   if(state==='focused logger'){await page.locator('.workout-overview button').first().click();await page.locator('.exercise-log').waitFor()}
   const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();assert.deepEqual(scan.violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)})),[],brand+' '+state);workoutAxe.push({state,violations:scan.violations.length});
  }
  await page.getByRole('button',{name:'Toggle Sidebar',exact:true}).click();await page.getByRole('button',{name:'Exercises',exact:true}).click();
  await page.getByLabel('Search exercises',{exact:true}).fill(name);
  const trigger=page.getByRole('button').filter({has:page.getByRole('heading',{name,exact:true})}).first();await trigger.click();
  const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Retry exercise reference',exact:true}).waitFor();
  assert.equal(requests.length,2);const sampleKey=brand==='grizzly'?'grizzly-training-studio-sample-v1':'movefield-review-training-studio-sample-v1';
  const original=await page.evaluate(key=>sessionStorage.getItem(key),sampleKey);assert.ok(original,'Check actual sample data preservation');
  fail=false;await dialog.getByRole('button',{name:'Retry exercise reference',exact:true}).click();await dialog.getByText('Step-by-step guide · sources linked below',{exact:true}).waitFor();
  assert.equal(requests.filter(url=>url.endsWith('exercise-guides.json')).length,2);assert.equal(requests.filter(url=>url.endsWith('exercise-content.json')).length,1,'Retry retains successful media');
  await dialog.getByRole('heading',{name:'Set up',exact:true}).waitFor();await dialog.getByRole('link',{name:/(Open the form reference|Watch a demo on the source site)/}).waitFor();
  assert.equal(await dialog.getByRole('link',{name:/(Open the form reference|Watch a demo on the source site)/}).getAttribute('rel'),'noopener noreferrer');
  await page.setViewportSize({width:320,height:568});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Guide fits small phones');
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();assert.deepEqual(axe.violations.map(item=>({id:item.id,targets:item.nodes.map(node=>node.target)})),[]);
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});await trigger.click();await dialog.getByText('Step-by-step guide · sources linked below',{exact:true}).waitFor();assert.equal(requests.length,3,'Reopening uses loaded references');
  await page.screenshot({path:resolve(dir,brand+'-guide-phone.png'),fullPage:true});assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),sampleKey),original,'Reference reading/retry cannot alter training');assert.deepEqual(errors,[]);
  results.push({brand,requests:requests.map(url=>new URL(url).pathname),axeViolations:axe.violations.length,workoutAxe,guideRetryPreservesData:true,narrowGuideReflow:true});await context.close();
 }
 await writeFile(resolve(dir,'results.json'),JSON.stringify({checkedAt:new Date().toISOString(),scope:'Actual minified web apps, synthetic sample data, Chromium phone viewport/touch emulation; service workers blocked to isolate direct UI fetches. No Safari, physical phone, or native keyboard claim.',results},null,2)+'\n');console.log('PASS both brands: deferred reference requests, visible failure and successful retry, retained media, small-phone guide accessibility and unchanged sample records');
}finally{await browser.close()}
