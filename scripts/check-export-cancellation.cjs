const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
const root=path.resolve(process.argv[2]||path.resolve(__dirname,'..')),req=createRequire(path.join(root,'package.json')),ts=req('typescript'),source=ts.transpileModule(fs.readFileSync(path.join(root,'components/transfer-dialog.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,results=[];
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}};
function harness(){const slots=[],effects=[],tasks=[],changes=[];let cursor=0,tree,downloads=0,calls=0;
 const react={useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value}]},useRef:initial=>{const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i]},useEffect:(fn,deps)=>{const i=cursor++,prior=effects[i];if(!prior||!deps||deps.some((v,n)=>!Object.is(v,prior.deps[n]))){prior?.cleanup?.();effects[i]={deps,cleanup:fn()}}},useCallback:fn=>fn,useMemo:fn=>fn()};
 const jsx={jsx:(type,props,key)=>({type,props,key}),jsxs:(type,props,key)=>({type,props,key}),Fragment:'Fragment'};
 class TransferError extends Error{};
 const transfer={createTransferFile:()=>{calls++;const task=deferred();tasks.push(task);return task.promise},passwordProblem:()=>null,TransferError,TRANSFER_MIN_PASSWORD:12};
 const m={exports:{}},url={createObjectURL:()=> 'blob:test',revokeObjectURL:()=>{}};
 new Function('require','module','exports','document','URL','setTimeout',source)(s=>s==='react'?react:s==='react/jsx-runtime'?jsx:s.endsWith('/transfer-bundle')?transfer:s.startsWith('@/components/ui/')?new Proxy({},{get:(_t,key)=>String(key)}):s.endsWith('/storage-capacity')?{readStoredSavedState:x=>x}:s.endsWith('/local-backup')?{previewBackup:()=>null}:req(s),m,m.exports,{createElement:()=>({click(){downloads++}})},url,fn=>{fn();return 0});
 const render=(open=true)=>{cursor=0;tree=m.exports.ExportTransferDialog({open,onOpenChange:value=>changes.push(value),plaintext:()=>'{"profile":"synthetic"}'});return tree};
 function nodes(node,predicate,out=[]){if(Array.isArray(node)){node.forEach(child=>nodes(child,predicate,out));return out}if(node&&typeof node==='object'&&node.props){if(predicate(node))out.push(node);nodes(node.props.children,predicate,out)}return out}
 const setup=()=>{render();for(const input of nodes(tree,n=>n.type==='Input'))input.props.onChange({target:{value:'four secure test words'}});render();return nodes(tree,n=>n.type==='form')[0]};
 return{setup,render,submit:()=>{const form=nodes(tree,n=>n.type==='form')[0];form.props.onSubmit({preventDefault(){}})},close:()=>tree.props.onOpenChange(false),unmount:()=>effects.forEach(e=>e?.cleanup?.()),resolve:async(index=0)=>{tasks[index].resolve('sealed-synthetic-file');for(let i=0;i<5;i++)await new Promise(resolve=>setImmediate(resolve))},downloads:()=>downloads,calls:()=>calls,changes};
}
async function test(name,fn){try{await fn();results.push({name,pass:true})}catch(e){results.push({name,pass:false,error:e.message})}}
(async()=>{
 await test('Cancel before async encryption completes prevents any later download',async()=>{const h=harness();h.setup();h.submit();h.close();await h.resolve();assert.deepEqual(h.changes,[false]);assert.equal(h.downloads(),0)});
 await test('Unmount before async encryption completes prevents any later download',async()=>{const h=harness();h.setup();h.submit();h.unmount();await h.resolve();assert.equal(h.downloads(),0)});
 await test('An open successful transfer still downloads exactly once',async()=>{const h=harness();h.setup();h.submit();await h.resolve();assert.equal(h.downloads(),1)});
 console.log(JSON.stringify({passed:results.filter(x=>x.pass).length,total:results.length,results},null,2));if(results.some(x=>!x.pass))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
