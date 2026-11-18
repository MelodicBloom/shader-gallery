#!/usr/bin/env node
// Default: print an exact preview request. --deploy uses the caller's existing Vercel token.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const registry=JSON.parse(fs.readFileSync(new URL('../docs/runtime-previews/registry.json',import.meta.url),'utf8'));
const args=process.argv.slice(2), id=args[0], deploy=args.includes('--deploy'), latest=args.includes('--latest');
const demo=registry.demos.find(d=>d.id===id);
if(!demo){console.error('Choose a demo ID: '+registry.demos.map(d=>d.id).join(', '));process.exit(2);}
let sha=demo.sourceSha;
if(latest){
  const r=await fetch(`https://api.github.com/repos/${registry.repository}/branches/${encodeURIComponent(demo.branch)}`,{headers:{Accept:'application/vnd.github+json'}});
  if(!r.ok)throw Error('Could not resolve branch: HTTP '+r.status);
  sha=(await r.json()).commit.sha;
}
if(!/^[a-f0-9]{40}$/.test(sha))throw Error('A full source commit SHA is required');
const requestBody={name:'shader-gallery',project:registry.projectId,gitSource:{type:'github',repoId:registry.repositoryId,ref:demo.branch,sha},projectSettings:demo.projectSettings};
// Deliberately omit target. This creates a preview and cannot promote production.
if(!deploy){console.log(JSON.stringify({teamId:registry.teamId,requestBody},null,2));process.exit(0);}
if(!process.env.VERCEL_TOKEN)throw Error('Use an existing VERCEL_TOKEN or pass the printed request to the authenticated Vercel connector');
const r=await fetch('https://api.vercel.com/v13/deployments?teamId='+encodeURIComponent(registry.teamId),{method:'POST',headers:{Authorization:'Bearer '+process.env.VERCEL_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(requestBody)});
const result=await r.json();if(!r.ok)throw Error(result.error?.message||'Deployment HTTP '+r.status);
console.log(JSON.stringify({id:result.id,url:result.url,readyState:result.readyState,sourceSha:sha},null,2));
