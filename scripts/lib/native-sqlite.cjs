const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
function createSqliteHarness(options={}){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'movefield-sqlite-audit-'));
 const filename=path.join(directory,'records.sqlite');
 const native=new DatabaseSync(filename);native.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
 // Model the qualified native compile default on each fresh connection. Node's
 // host SQLite is separate from the vendored native build; policy tests also
 // exercise its real unmodified default to prove refusal.
 const controller={calls:[],fail:null,mutateRead:null,transactionSynchronous:options.transactionSynchronous??3};let transactionQueue=Promise.resolve();
 const bindings=args=>args.length===1&&Array.isArray(args[0])?args[0]:args;
 async function before(scope,method,sql,args){
  const call={index:controller.calls.length+1,scope,method,sql,args};controller.calls.push(call);
  if(controller.fail&&await controller.fail(call))throw Error('Injected SQLITE_FULL/transaction failure');
 }
 function adapter(connection,scope){
  return {
   execAsync:async sql=>{await before(scope,'execAsync',sql,[]);connection.exec(sql);},
   runAsync:async(sql,...args)=>{await before(scope,'runAsync',sql,args);const value=connection.prepare(sql).run(...bindings(args));return {lastInsertRowId:Number(value.lastInsertRowid),changes:Number(value.changes)};},
   getFirstAsync:async(sql,...args)=>{await before(scope,'getFirstAsync',sql,args);let value=connection.prepare(sql).get(...bindings(args))??null;if(controller.mutateRead)value=await controller.mutateRead({scope,method:'getFirstAsync',sql,args,value});return value;},
   getAllAsync:async(sql,...args)=>{await before(scope,'getAllAsync',sql,args);let value=connection.prepare(sql).all(...bindings(args));if(controller.mutateRead)value=await controller.mutateRead({scope,method:'getAllAsync',sql,args,value});return value;},
  };
 }
 const db=adapter(native,'main');
 db.withExclusiveTransactionAsync=job=>{
  const next=transactionQueue.then(async()=>{
   const connection=new DatabaseSync(filename);connection.exec('PRAGMA foreign_keys=ON;');
   if(controller.transactionSynchronous!==null)connection.exec('PRAGMA synchronous='+Number(controller.transactionSynchronous));
   try{
    await before('transaction','begin','BEGIN EXCLUSIVE',[]);connection.exec('BEGIN EXCLUSIVE');
    await job(adapter(connection,'transaction'));
    await before('transaction','commit','COMMIT',[]);connection.exec('COMMIT');
   }catch(error){try{connection.exec('ROLLBACK')}catch{}throw error;}
   finally{connection.close();}
  });transactionQueue=next.catch(()=>undefined);return next;
 };
 return {db,controller,native,filename,close:()=>{native.close();fs.rmSync(directory,{recursive:true,force:true})}};
}
module.exports={createSqliteHarness};
if(require.main===module){(async()=>{const h=createSqliteHarness();try{await h.db.execAsync('CREATE TABLE demo(id INTEGER PRIMARY KEY,value TEXT);');await h.db.runAsync('INSERT INTO demo(value) VALUES (?)','before');h.controller.fail=call=>call.method==='commit';try{await h.db.withExclusiveTransactionAsync(async tx=>{await tx.runAsync('UPDATE demo SET value=?','after')})}catch{}if((await h.db.getFirstAsync('SELECT value FROM demo')).value!=='before')throw Error('SQL rollback failed');h.controller.fail=null;await h.db.withExclusiveTransactionAsync(async tx=>{await tx.runAsync('UPDATE demo SET value=?','after')});if((await h.db.getFirstAsync('SELECT value FROM demo')).value!=='after')throw Error('SQL commit failed');console.log('PASS node:sqlite adapter, real separate-connection exclusive transaction rollback/commit');}finally{h.close()}})().catch(e=>{console.error(e);process.exit(1)})}
