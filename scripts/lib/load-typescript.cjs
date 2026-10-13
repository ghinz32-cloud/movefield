const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'../..');
function createLoader(globals={}){
 const cache=new Map();
 function load(file){
  file=path.resolve(root,file);if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));
  if(cache.has(file))return cache.get(file).exports;
  const module={exports:{}};cache.set(file,module);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const localRequire=name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name+(name.endsWith('.json')?'':'.ts'))):require(name);
  new Function('require','module','exports',...Object.keys(globals),code)(localRequire,module,module.exports,...Object.values(globals));
  return module.exports;
 }
 return load;
}
module.exports={createLoader,root};
