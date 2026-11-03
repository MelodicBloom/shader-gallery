import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.wav':'audio/wav','.md':'text/markdown; charset=utf-8'};
const port=Number(process.env.PORT)||4177;
http.createServer((req,res)=>{try{const requestPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const safe=path.resolve(root,'.'+requestPath);if(safe!==root&&!safe.startsWith(root+path.sep)){res.writeHead(403).end('Forbidden');return;}
 const filename=fs.statSync(safe).isDirectory()?path.join(safe,'index.html'):safe;
 const stat=fs.statSync(filename);if(!stat.isFile()){res.writeHead(404).end('Not found');return;}
 let start=0,end=stat.size-1,status=200;
 const headers={'content-type':types[path.extname(filename)]||'application/octet-stream','cache-control':'no-store','accept-ranges':'bytes'};
 if(req.headers.range){
  const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if(!match||(!match[1]&&!match[2])||stat.size===0){res.writeHead(416,{'content-range':`bytes */${stat.size}`}).end();return;}
  if(match[1]){start=Number(match[1]);if(match[2])end=Number(match[2]);}
  else{const suffix=Number(match[2]);if(suffix>0)start=Math.max(0,stat.size-suffix);else start=stat.size;}
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=stat.size||end<start){res.writeHead(416,{'content-range':`bytes */${stat.size}`}).end();return;}
  end=Math.min(end,stat.size-1);status=206;headers['content-range']=`bytes ${start}-${end}/${stat.size}`;
 }
 headers['content-length']=stat.size===0?0:end-start+1;
 if(req.method==='HEAD'||stat.size===0){res.writeHead(status,headers).end();return;}
 const stream=fs.createReadStream(filename,{start,end});
 stream.on('open',()=>{res.writeHead(status,headers);stream.pipe(res);});
 stream.on('error',()=>{if(!res.headersSent)res.writeHead(404).end('Not found');else res.destroy();});
 }catch{res.writeHead(404).end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`KF-001 http://127.0.0.1:${port}`));

