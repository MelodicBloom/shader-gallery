import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.wav':'audio/wav','.md':'text/markdown; charset=utf-8'};
const port=Number(process.env.PORT)||4177;
http.createServer((req,res)=>{try{const requestPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const safe=path.resolve(root,'.'+requestPath);if(safe!==root&&!safe.startsWith(root+path.sep)){res.writeHead(403).end('Forbidden');return;}
 const filename=fs.statSync(safe).isDirectory()?path.join(safe,'index.html'):safe;
 if(!fs.statSync(filename).isFile()){res.writeHead(404).end('Not found');return;}
 const stream=fs.createReadStream(filename);
 stream.on('open',()=>{res.writeHead(200,{'content-type':types[path.extname(filename)]||'application/octet-stream','cache-control':'no-store'});stream.pipe(res);});
 stream.on('error',()=>{if(!res.headersSent)res.writeHead(404).end('Not found');else res.destroy();});
 }catch{res.writeHead(404).end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`KF-001 http://127.0.0.1:${port}`));
