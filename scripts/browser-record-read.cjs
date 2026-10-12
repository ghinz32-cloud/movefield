/** Test observer: reads the actual browser database, independent of app helpers. */
async function rawRecordBundle(page){return page.evaluate(async()=>{
 const req=indexedDB.open('movefield-private-records-v1',1),db=await new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
 try{if(!db.objectStoreNames.contains('meta'))return localStorage.getItem('training-studio-v2');
 const tx=db.transaction(['meta','rows']),root=await new Promise((resolve,reject)=>{const r=tx.objectStore('meta').get('root');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
 if(!root)return localStorage.getItem('training-studio-v2');
 // Open another transaction after awaiting; avoid depending on transaction idling.
 const rows=await new Promise((resolve,reject)=>{const r=db.transaction('rows').objectStore('rows').index('vaultId').getAll(JSON.parse(root).vaultId);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
 return rows.length?JSON.stringify({format:'movefield-record-bundle',version:1,root,rows}):root;
 }finally{db.close()}
 })}
async function clearRecords(page){await page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.deleteDatabase('movefield-private-records-v1');r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Test database remains open'))}))}
module.exports={rawRecordBundle,clearRecords};
