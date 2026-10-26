import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {getMarket} from '../lib/market.js';
import {build} from 'esbuild';
import {cp,mkdir} from 'node:fs/promises';
await mkdir('dist',{recursive:true});await cp('public','dist',{recursive:true});
await build({entryPoints:['src/app.js'],bundle:true,format:'esm',target:'es2022',outfile:'dist/app.js'});
const root=resolve('dist');const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');
if(url.pathname==='/api/market'){const r=await getMarket(Object.fromEntries(url.searchParams));res.writeHead(r.status,{'Content-Type':'application/json'});res.end(JSON.stringify(r.body));return;}
const name=['/','/swap'].includes(url.pathname)?'/index.html':decodeURIComponent(url.pathname);
const path=resolve(root,'.'+name);if(!path.startsWith(root+sep)){res.writeHead(403);res.end();return;}
const body=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'});res.end(body);
}catch{res.writeHead(404);res.end('Not found');}}).listen(Number(process.env.PORT || (process.argv.includes('--port') ? process.argv[process.argv.indexOf('--port')+1] : 3000)),'0.0.0.0',()=>console.log('AToken Spot ready'));
