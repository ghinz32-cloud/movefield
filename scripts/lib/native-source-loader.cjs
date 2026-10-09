const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
function createSourceLoader(repo,overrides={}){
 const req=createRequire(path.join(repo,'mobile/package.json')),rootReq=createRequire(path.join(repo,'package.json')),ts=rootReq('typescript'),cache=new Map();
 function load(filename){
  filename=path.resolve(filename);if(cache.has(filename))return cache.get(filename).exports;
  const module={exports:{}};cache.set(filename,module);
  function resolve(source){
   if(Object.prototype.hasOwnProperty.call(overrides,source))return overrides[source];
   if(source.startsWith('.')){let found=path.resolve(path.dirname(filename),source);if(!path.extname(found))found+='.ts';return found.endsWith('.json')?JSON.parse(fs.readFileSync(found,'utf8')):load(found)}
   return req(source);
  }
  new Function('require','module','exports',ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText)(resolve,module,module.exports);return module.exports;
 }
 return {load,cache};
}
module.exports={createSourceLoader};
