'use strict';
// This worker only caches pinned public artifacts within this project scope.
const MANIFEST={"schema":1,"base":"/movefield/","version":"63aa0077e23f77d6194119f71aef28fa141d8cb8281b576a000143ce8013fdb4","workerTemplateSha256":"fee548f52250d007e6ada60a0d8a0b7e2ae26fc5796e18d9f60b2f4e77f48fd7","assets":{"/movefield/.nojekyll":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","/movefield/assets/account-security-BMvM1HMu.js":"2c74652456a55fc6fe62a0e9a2f0515f60d4272eccf8052783b09e4c1ce5e079","/movefield/assets/account-sync-DVkOh821.js":"4bfd6b9df1f9f2d66f7150a3c249df9a43e2baa566cfd9697e87673933578a7f","/movefield/assets/button-BZyDGPNM.js":"5901fcc142fcc2cbab3e3a832b727516580f2b4e73163d99ca5b4f9eede97a99","/movefield/assets/cloud-envelope-C85xs6Wf.js":"c38aa6c1e861300f24c38028e30cb4370d7208053cc0050a4240e6bc79461b44","/movefield/assets/customize-CnMED5ja.js":"35d5c979ffd33cdc5a3123a151adf53c87f3fe9a43b46990cdf7f00860dc49dd","/movefield/assets/daily-feedback-DYrCbmhC.js":"eb24121edb1fde3dae11176041e0e7674895eb175004aa43c862f978ad2b43bb","/movefield/assets/equipment-limits-D2Tu22zf.js":"194d24b92a72f93e097c0b0dcf9160e01a8a277f8799e902d42f50270d6072a1","/movefield/assets/exercise-substitutions-Cbg9mgp1.js":"48d861abf8f13a4ff53527bfbff6654ac8d247d19077ff288580d0674e220d22","/movefield/assets/index-CScTRmDb.css":"54e28a1221955275736ff273b92a70838b5d627cc95233125dd59d7747bd55f0","/movefield/assets/index-mVoiqKma.js":"72076f7f12ac2e7c4980d912af6cf8d84bb827641af2689fd77678c1ec173ea7","/movefield/assets/jsx-runtime-DUAcabCT.js":"afa9863e5c6f7611685a66c3ed93ea9226a1af161256ae0e9339e1524204ee53","/movefield/assets/plan-customizer-yEvyVXD9.js":"f0b63d266a95299e6b3b5a1f18ada7de2b43c9e7ca2118c066f6d66b510809eb","/movefield/assets/progress-dashboard-BYz9fRj5.js":"200929bba8ef7cfc52724619a15d3b9fd6108379920adc7d851d400867fe9e85","/movefield/assets/qwen-unavailable-IXSK3HSm.js":"3bd10437f03a9d63f02e37884b3e4a0b05c83c8d0da90aefea4c019d5d9bafe6","/movefield/assets/react-dom-Ci36WYJj.js":"405891fe4b8e9c1a5f464b147e0f1944bd8d911ef16a3047999ce82fbaa927ad","/movefield/assets/research-library-BwqyOoc1.js":"9a9ec4b82b5ee0cc910d672754a8921a70158f03ce6e778d9435b6d7cf1535e2","/movefield/assets/session-guide-3EUQPwSU.js":"b7bdbfff25b0080ced636e1ced0965d8da1f8a7185752bc36b0df3c9ac7a94e4","/movefield/assets/tracking-editor-DFbZKodS.js":"4f52f3464514d5571a717a2e4857b4ca27bac608435215238b87168a1e1a559a","/movefield/assets/training-jn8H07LS.js":"fdf0f3092f61218d5557af4d057e61c7a4a8933670c410d2de9161f6a846027c","/movefield/assets/training-onboarding-pVqV41YO.js":"5c5d75eb75be71e76e3ebf18c89ec1ed92c29de0c4c758af87ac9b74b83b93f8","/movefield/assets/transfer-bundle-6fSSPVW-.js":"faa5ec038faeb6b403c39fcf9474a1b99125ef4ed60425d9ccbe600173b38bee","/movefield/assets/transfer-dialog-BVJV3mnY.js":"3db3e0fe5cd9af2140a44d75cff7be06998d3d8cd74dedba5ab9784c462b4435","/movefield/assets/workout-review-B97Bn2Ri.js":"23097c150d091e3a7e3d4783cb6f8efa25bcb5da4bc958f5d98e0c5483275c99","/movefield/downloads/movefield-mobile-r14.zip":"3569203866a130c258da87dbd074e23996e4a43244f3e9a2456aa3b92bed3aa3","/movefield/exercise-content.json":"9a17a1c905fe80e7210803a7b1b466c0a207a40b702386f6e75fb891585b68bb","/movefield/exercise-guides.json":"62fa1d71ee08312f6e8809ce60e17e7df7e8a3a8d79f49bed15731592d0f7a38","/movefield/favicon.svg":"e60a09d8fe6ca9311ab14f0f9f05a5ed92cb2f74b3a41fc3680bde30f3a0b11e","/movefield/fitness-research.json":"437f2724162639849949aed8f6b47b0f8ab1eac88da1e0d4535920d2eebaa757","/movefield/fonts/Atkinson-Hyperlegible-OFL.txt":"e137caeef2ff7c04fbf87078ad09cf3dcba8a3a58a4aa4e2f399d42c50bc4b18","/movefield/fonts/Barlow-Condensed-OFL.txt":"186d750eb496a4c17a76385f82be6aea2ac1cf2de074a811d63786cf374ea73f","/movefield/fonts/Inter-OFL.txt":"5b9321a4298cfeb6b34354164a1c3afc3db114569984c502b9b35d988fd58c57","/movefield/fonts/Lexend-OFL.txt":"5da8505887d0fa7fe963445fd58852707fda34adfeb65af25c99d152bab285bd","/movefield/fonts/Nunito-OFL.txt":"580df76c95a1ec5ab878ceb25bb3d85c6a076804e9c970c8c6972aea775fdf65","/movefield/fonts/Oswald-OFL.txt":"23916cdee678823c3c517c699cb2e043088de0d46c959eeaa168b54bb84534df","/movefield/fonts/Saira-OFL.txt":"f2665d4718b452b3818a877191355ac884a6b9b419d35408fe7ee487e9e8f30f","/movefield/fonts/atkinson-hyperlegible-latin-400-normal.woff2":"d64ba838ef5472bba248620ec4fd8b5aa7cf0db2908e0bb230600caf279ba7bc","/movefield/fonts/atkinson-hyperlegible-latin-700-normal.woff2":"140e2bd25a7315c8a062508391426b0d8c3297400c947b8d847be28f73a199f0","/movefield/fonts/barlow-condensed-semibold.ttf":"7b619d14bc2327509a9ef32b0890f709626f7ecc9ff61191c2a4314c5499d2d9","/movefield/fonts/inter-variable.ttf":"29160a80ff49ddcab2c97711247e08b1fab27a484a329ce8b813d820dc559031","/movefield/fonts/lexend-latin-400-normal.woff2":"0601e0a909219a542cdd581e3f8f1ff8fb208978cbc9bca1c90df02fd8062bb1","/movefield/fonts/lexend-latin-700-normal.woff2":"52dcdaa127bac4a5ea4c39ee17a3f454ceacc18d9f2a45cc453eeab68d378588","/movefield/fonts/nunito-latin-400-normal.woff2":"a5906e15ceb68f73d3b2c2076b4057c3f6ed401186d56283b45ce12944ca0735","/movefield/fonts/nunito-latin-700-normal.woff2":"fa89300b9bbb3bd0f60d6991aa055965d98e2ccca27bf8688fe0c39cdc796846","/movefield/fonts/oswald-latin-600-normal.woff2":"f6cb541f4d9794b86145c9c3e7d778ffb78c92f8180c577e245238991503da6f","/movefield/fonts/oswald-latin-700-normal.woff2":"aae665c75af89ea7cb7d8ccc8b0911ea72267442ebcd84f6e3efa041ad3b3c16","/movefield/fonts/saira-latin-400-normal.woff2":"f477825b1d839c775bda7708f78e933bd246c582e7186769e9a25e9b1a59b350","/movefield/fonts/saira-latin-700-normal.woff2":"07eb78fecb9cbc519e08a727d438389b2983a140a4d8651d000141ec55b8bacf","/movefield/index.html":"ff85079cd918e00628680ff6ae1bf1ae8438bb17d2596e22e89212d166128dd6","/movefield/privacy.html":"3751ef5dbb3f22f949974808317f98b44d5f8e080c32169f304afa54897ab6e7"}};
const PREFIX='movefield-pages-v1-',CACHE=PREFIX+MANIFEST.version;
const entries=MANIFEST.assets;
async function checked(response,key){
 if(!Object.hasOwn(entries,key)||response.status!==200||response.type==='opaque'||response.type==='opaqueredirect')throw Error('Asset unavailable');
 const bytes=await response.arrayBuffer();
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
 if(digest!==entries[key])throw Error('Asset integrity mismatch');
 return new Response(bytes,{status:response.status,headers:response.headers});
}
async function verified(key){
 return checked(await fetch(key,{cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer'}),key);
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 try{for(const url of Object.keys(entries).filter(x=>!x.includes('/downloads/')))await cache.put(url,await verified(url));}
 catch(error){await caches.delete(CACHE);throw error;}
 // Never activate over an open workout. The browser activates after old clients close.
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(MANIFEST.base)||url.search)return;
 let key=url.pathname;
 if(request.mode==='navigate'&&(key===MANIFEST.base||key===MANIFEST.base+'index.html'))key=MANIFEST.base+'index.html';
 if(!Object.hasOwn(entries,key))return;
 event.respondWith((async()=>{
 const cache=await caches.open(CACHE),cached=await cache.match(key);
 if(cached){
  // Origin cache entries can change after installation; verify every hit.
  try{return await checked(cached,key);}
  catch{await cache.delete(key);}
 }
 const response=await verified(key);await cache.put(key,response.clone());return response;
})());
});
