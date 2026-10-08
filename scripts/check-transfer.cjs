const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript'),crypto=require('node:crypto');
// Loads lib/transfer-bundle.ts as the app does, then checks the password-protected transfer file format.
const cache=new Map();
function load(name){
 if(cache.has(name))return cache.get(name).exports;
 const m={exports:{}};cache.set(name,m);
 const src=ts.transpileModule(fs.readFileSync(path.join('lib',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',src)(s=>s.startsWith('./')?load(s.slice(2)):require(s),m,m.exports);
 return m.exports;
}
const T=load('transfer-bundle');
let checks=0;const ok=(v,msg)=>{assert.ok(v,msg);checks++};const same=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++};
const random=n=>new Uint8Array(crypto.randomBytes(n));
const PASSWORD='quiet river lantern 42';
const PLAIN=JSON.stringify({schema:2,note:'Café “quoted” — text',history:[{id:'w1',kg:82.5}]});
const failsWith=async(promise,code,msg)=>{try{await promise}catch(e){same(e instanceof T.TransferError,true,msg+' is a TransferError');same(e.code,code,msg);return}throw new Error(msg+' did not fail')};
(async()=>{
 // 1. Password rules come before any expensive work.
 same(T.passwordProblem('short')?.code,'short-password','a short password is refused');
 same(T.passwordProblem('Password123')?.code,'short-password','an 11-character password is refused');
 same(T.passwordProblem('password1234')?.code,'common-password','a common 12-character password is refused');
 same(T.passwordProblem('iloveyou1234')?.code,'common-password','another common password is refused');
 same(T.passwordProblem(PASSWORD),null,'a four-word phrase is accepted');
 same(T.passwordProblem('x'.repeat(1025))?.code,'long-password','an absurdly long password is refused');
 await failsWith(T.createTransferFile(PLAIN,'short',{source:'web',random}),'short-password','create refuses a short password');

 // 2. Round trip. The file never contains the plaintext.
 const start=Date.now();
 const file=await T.createTransferFile(PLAIN,PASSWORD,{source:'web',random,now:new Date('2026-10-08T12:00:00Z')});
 const seconds=((Date.now()-start)/1000).toFixed(2);
 ok(!file.includes('lantern')&&!file.includes('history'),'the transfer file does not show plaintext');
 same(T.isTransferFile(file),true,'the file is recognised as a transfer file');
 same(T.transferSource(file),'web','the source is recorded');
 same(await T.openTransferFile(file,PASSWORD),PLAIN,'the right password returns the same plaintext, including accented and curly-quoted text');
 console.log(`  Argon2id round trip took ${seconds} s in Node. Phone timing is not measured.`);

 // 3. Wrong password and tampering fail with one message, and never return partial data.
 await failsWith(T.openTransferFile(file,'quiet river lantern 43'),'wrong-password','a wrong password fails');
 await failsWith(T.openTransferFile(file,''),'wrong-password','an empty password asks for the password');
 const parsed=JSON.parse(file);
 const flipped={...parsed,data:(parsed.data.slice(0,-2)+(parsed.data.slice(-2)==='00'?'01':'00'))};
 await failsWith(T.openTransferFile(JSON.stringify(flipped),PASSWORD),'wrong-password','a changed ciphertext byte fails');
 await failsWith(T.openTransferFile(JSON.stringify({...parsed,createdAt:'2026-01-01T00:00:00.000Z'}),PASSWORD),'wrong-password','a changed creation time fails (header is authenticated)');
 await failsWith(T.openTransferFile(JSON.stringify({...parsed,source:'phone'}),PASSWORD),'wrong-password','a changed source fails (header is authenticated)');
 await failsWith(T.openTransferFile(JSON.stringify({...parsed,kdf:{...parsed.kdf,m:parsed.kdf.m+1}}),PASSWORD),'wrong-password','changed Argon2 memory fails (cannot be downgraded silently)');

 // 4. Bad or unsupported files are refused before the password is used.
 await failsWith(T.openTransferFile('not json',PASSWORD),'bad-format','non-JSON input is refused');
 await failsWith(T.openTransferFile(JSON.stringify({...parsed,format:'other'}),PASSWORD),'bad-format','another format name is refused');
 await failsWith(T.openTransferFile(JSON.stringify({...parsed,version:2}),PASSWORD),'unsupported-version','a newer file version asks the person to update');
 await failsWith(T.openTransferFile(JSON.stringify({...parsed,kdf:{...parsed.kdf,m:1024}}),PASSWORD),'bad-format','weak Argon2 settings are refused, not run');
 await failsWith(T.openTransferFile(JSON.stringify({...parsed,kdf:{...parsed.kdf,t:500}}),PASSWORD),'bad-format','huge pass counts are refused (memory-use guard)');
 await failsWith(T.openTransferFile(JSON.stringify({...parsed,nonce:'00'}),PASSWORD),'bad-format','a short nonce is refused');
 await failsWith(T.openTransferFile(JSON.stringify({...parsed,data:'zz'}),PASSWORD),'bad-format','non-hex ciphertext is refused');
 await failsWith(T.openTransferFile('x'.repeat(30_000_001),PASSWORD),'too-large','an oversized file is refused');
 same(T.isTransferFile('{"schema":2}'),false,'a plain backup is not a transfer file');
 same(T.transferSource('nope'),null,'an unreadable file has no source');

 // 5. Fresh salt and nonce every time, so the same backup never produces the same file twice.
 const again=await T.createTransferFile(PLAIN,PASSWORD,{source:'phone',random,now:new Date('2026-10-08T12:00:00Z')});
 const other=JSON.parse(again);
 ok(other.kdf.salt!==parsed.kdf.salt&&other.nonce!==parsed.nonce&&other.data!==parsed.data,'a new salt, nonce and ciphertext are used each time');
 same(await T.openTransferFile(again,PASSWORD),PLAIN,'the second file opens with the same password');
 same(JSON.parse(again).source,'phone','the phone source is recorded');

 console.log(`PASS transfer files: ${checks} checks`);
})().catch(error=>{console.error(error);process.exit(1)});
