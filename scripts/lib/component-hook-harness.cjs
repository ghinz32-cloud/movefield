const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
function sameDeps(a,b){return !!a&&!!b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]))}
function createHookHarness(){
 const cells=[];let cursor=0,dirty=true,rendering=false,component,props,tree,pending=[];
 const hooks={
  useState(initial){const at=cursor++;if(!cells[at])cells[at]={kind:'state',value:typeof initial==='function'?initial():initial};const cell=cells[at];return [cell.value,input=>{const next=typeof input==='function'?input(cell.value):input;if(!Object.is(next,cell.value)){cell.value=next;dirty=true}}]},
  useRef(initial){const at=cursor++;if(!cells[at])cells[at]={kind:'ref',value:{current:initial}};return cells[at].value},
  useMemo(make,deps){const at=cursor++;const previous=cells[at];if(!previous||!sameDeps(previous.deps,deps))cells[at]={kind:'memo',value:make(),deps};return cells[at].value},
  useEffect(effect,deps){const at=cursor++;const previous=cells[at];if(!previous||!sameDeps(previous.deps,deps)){cells[at]={kind:'effect',deps,cleanup:previous?.cleanup};pending.push({at,effect})}},
 };
 const element=(type,props,key)=>({type,props:props||{},key});
 const react={...hooks,Fragment:Symbol.for('test-fragment'),createElement:(type,props,...children)=>element(type,{...props,children:children.length===1?children[0]:children})};
 function render(){if(rendering)throw Error('Recursive hook render');rendering=true;cursor=0;dirty=false;try{tree=component(props)}finally{rendering=false}const effects=pending;pending=[];for(const {at,effect}of effects){cells[at].cleanup?.();cells[at].cleanup=effect()}}
 async function settle(){for(let i=0;i<50;i++){if(dirty)render();await new Promise(r=>setImmediate(r));if(!dirty&&!pending.length){await Promise.resolve();if(!dirty)return tree}}throw Error('Hook harness did not settle')}
 function visit(node,found=[]){if(Array.isArray(node)){node.forEach(x=>visit(x,found));return found}if(node&&typeof node==='object'&&'props'in node){found.push(node);visit(node.props.children,found)}return found}
 return {react,runtime:{jsx:element,jsxs:element,Fragment:react.Fragment},mount(fn,input){component=fn;props=input;dirty=true;return settle()},settle,get tree(){return tree},nodes:()=>visit(tree),find:test=>visit(tree).find(test),text(){const flatten=node=>Array.isArray(node)?node.map(flatten).join(' '):node&&typeof node==='object'&&'props'in node?flatten(node.props.children):typeof node==='string'||typeof node==='number'?String(node):'';return flatten(tree)},unmount(){for(const cell of cells)if(cell?.kind==='effect')cell.cleanup?.();component=()=>null;dirty=false},cells};
}
function createTsxLoader(repo,overrides={},sources={}){
 const req=createRequire(path.join(repo,'mobile/package.json')),rootReq=createRequire(path.join(repo,'package.json')),ts=rootReq('typescript'),cache=new Map();
 function load(filename){filename=path.resolve(filename);if(cache.has(filename))return cache.get(filename).exports;const module={exports:{}};cache.set(filename,module);
  function resolve(source){if(Object.prototype.hasOwnProperty.call(overrides,source))return overrides[source];if(source.startsWith('.')||source.startsWith('@/')){let full=source.startsWith('@/')?path.join(repo,source.slice(2)):path.resolve(path.dirname(filename),source);if(!path.extname(full))full+=fs.existsSync(full+'.tsx')?'.tsx':'.ts';return full.endsWith('.json')?JSON.parse(fs.readFileSync(full,'utf8')):load(full)}return req(source)}
  new Function('require','module','exports',ts.transpileModule(sources[filename]??fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(resolve,module,module.exports);return module.exports;
 }
 return {load,cache};
}
module.exports={createHookHarness,createTsxLoader};
