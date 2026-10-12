import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve('.sites-runtime/github-pages-review'),base='/movefield/review/',port=Number(process.argv[2]||8816);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Use a local port from 1024 to 65535');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf','.jpg':'image/jpeg','.png':'image/png','.zip':'application/zip'};
createServer(async(request,response)=>{try{const url=new URL(request.url,'http://127.0.0.1');if(!['GET','HEAD'].includes(request.method)){response.writeHead(405);response.end();return}if(!url.pathname.startsWith(base))throw Error();const file=resolve(root,decodeURIComponent(url.pathname.slice(base.length))||'index.html');if(!file.startsWith(root+'/')||!(await stat(file)).isFile())throw Error();const bytes=await readFile(file);response.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});response.end(request.method==='HEAD'?undefined:bytes)}catch{response.writeHead(404);response.end('Not found')}}).listen(port,'127.0.0.1',()=>console.log('Static GitHub review listening on loopback port '+port));
