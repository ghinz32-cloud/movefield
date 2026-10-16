import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const {load,workoutFixture}=createRequire(import.meta.url)('./domain-test-loader.cjs');
const {BrowserVault}=load('lib/browser-vault.ts');
const passphrase='Synthetic cross-tab setup audit';
const dir=resolve('.sites-runtime/comprehensive-security');
const origin=process.env.AUDIT_ORIGIN||'http://127.0.0.1:8836';
const brands=[{id:'movefield',base:origin+'/movefield/review/',prefix:'movefield-review-training-studio'},{id:'grizzly',base:origin+'/movefield/grizzly/',prefix:'grizzly-training-studio'}];
const results=[],errors=[];let complete=false;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',chromiumSandbox:true,args:['--disable-setuid-sandbox'],env:{...process.env,XDG_CONFIG_HOME:resolve('.sites-runtime/config'),XDG_CACHE_HOME:resolve('.sites-runtime/cache')}});
async function unlock(page,create=false){await page.getByLabel('Vault passphrase',{exact:true}).fill(passphrase);if(create)await page.getByLabel('Confirm passphrase',{exact:true}).fill(passphrase);await page.getByRole('button',{name:create?'Create encrypted profile':'Unlock profile',exact:true}).click();await page.getByRole('heading',{name:'Today',exact:true}).waitFor()}
try{for(const brand of brands){
 const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'}),first=await context.newPage();first.on('pageerror',e=>errors.push(e.message));
 try{
  const fixture=workoutFixture();fixture.active=null;
  await first.goto(brand.base);await first.getByRole('button',{name:'Create encrypted profile',exact:true}).waitFor();await first.evaluate(({state,prefix})=>{localStorage.setItem(prefix+'-v2',JSON.stringify(state));localStorage.setItem(prefix+'-access-v1','open')},{state:fixture,prefix:brand.prefix});await first.reload();await unlock(first,true);
  const original=await first.evaluate(key=>localStorage.getItem(key),brand.prefix+'-v2'),vault=await BrowserVault.open(passphrase,original);
  const draft=async(page)=>{const raw=await page.evaluate(key=>localStorage.getItem(key),brand.prefix+'-setup-v1');return raw?JSON.parse(await vault.decrypt(raw,'setup')):null};
  const waitDraft=async(name)=>{for(let i=0;i<100;i++){const value=await draft(first);if(value?.profile.name===name)return value;await first.waitForTimeout(30)}throw Error('Expected draft was not saved: '+name)};
  await first.getByRole('button',{name:'Build a plan',exact:true}).first().click();await first.getByLabel('Name',{exact:true}).fill('Synthetic first tab');await waitDraft('Synthetic first tab');
  const second=await context.newPage();second.on('pageerror',e=>errors.push(e.message));await second.goto(brand.base);await unlock(second);await second.getByRole('button',{name:'Build a plan',exact:true}).first().click();await second.getByLabel('Name',{exact:true}).waitFor();assert.equal(await second.getByLabel('Name',{exact:true}).inputValue(),'Synthetic first tab');
  await second.getByLabel('Name',{exact:true}).fill('Synthetic newer second tab');await waitDraft('Synthetic newer second tab');
  assert.equal(await first.getByLabel('Name',{exact:true}).inputValue(),'Synthetic first tab','First tab retains an older snapshot');
  await first.getByLabel('Age',{exact:true}).fill('29');
  await first.getByRole('button',{name:'Reload latest setup',exact:true}).waitFor();
  const preserved=await draft(first);assert.equal(preserved.profile.name,'Synthetic newer second tab');
  assert.equal(await first.getByLabel('Age',{exact:true}).inputValue(),'29','The stale window keeps its unsaved answers visible');
  const warnings=await first.getByRole('alert').allTextContents();assert.ok(warnings.some(text=>/Another tab saved different setup answers/.test(text)));
  const savedCopy=first.waitForEvent('download');await first.getByRole('button',{name:'Save this window’s answers',exact:true}).click();const downloaded=await savedCopy;assert.equal(await downloaded.failure(),null);
  const stream=await downloaded.createReadStream();let copied='';for await(const chunk of stream)copied+=chunk;const answers=JSON.parse(copied);assert.equal(answers.profile.name,'Synthetic first tab');assert.equal(answers.profile.age,29);
  assert.equal(await first.evaluate(key=>localStorage.getItem(key),brand.prefix+'-v2'),original,'Accepted encrypted profile remains unchanged');
  await first.getByRole('button',{name:'Reload latest setup',exact:true}).click();await unlock(first);await first.getByRole('button',{name:'Build a plan',exact:true}).first().click();await first.getByLabel('Name',{exact:true}).waitFor();assert.equal(await first.getByLabel('Name',{exact:true}).inputValue(),'Synthetic newer second tab','Reload preserves the newer name');
  const html=await(await fetch(brand.base)).text(),urls=[...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(m=>new URL(m[1],brand.base).href),assets=[];for(const url of urls){const bytes=Buffer.from(await(await fetch(url)).arrayBuffer());assets.push({url,sha256:createHash('sha256').update(bytes).digest('hex')})}
  await first.screenshot({path:resolve(dir,brand.id+'-draft-recovered.png'),fullPage:true});results.push({brand:brand.id,passed:true,newerDraftName:preserved.profile.name,unsavedAnswersExported:true,conflictWarnings:warnings,acceptedProfileCiphertextUnchanged:true,reloadedName:await first.getByLabel('Name',{exact:true}).inputValue(),assets});console.log('PASS '+brand.id+' concurrent setup conflict and recovery');
 }catch(e){await first.screenshot({path:resolve(dir,brand.id+'-draft-repro-error.png'),fullPage:true});await writeFile(resolve(dir,brand.id+'-draft-repro-error.txt'),String(e)+'\n'+await first.locator('body').innerText());throw e}finally{await context.close()}
}assert.deepEqual(errors,[]);complete=true}finally{await browser.close();await writeFile(resolve(dir,'draft-tabs-fixed-result.json'),JSON.stringify({checkedAt:new Date().toISOString(),complete,scope:'Two real browser tabs, actual web UI/WebCrypto/localStorage/Web Locks; disposable synthetic encrypted profiles; current audit candidate static assets; separate local test profiles.',results,errors},null,2)+'\n')}
