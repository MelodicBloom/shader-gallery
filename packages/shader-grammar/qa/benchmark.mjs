import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {spawnSync} from 'node:child_process';
import {packageRoot} from './gate.mjs';

const commands={original:['scripts/validate.mjs','--strict'],enhanced:['qa/gate.mjs']};
function sample(args){const start=performance.now();const r=spawnSync(process.execPath,args,{cwd:packageRoot,encoding:'utf8'});assert.equal(r.status,0,r.stderr||r.stdout);return performance.now()-start;}
for(const args of Object.values(commands))sample(args);
const samples={original:[],enhanced:[]};
for(let i=0;i<9;i++)for(const name of i%2?['enhanced','original']:['original','enhanced'])samples[name].push(sample(commands[name]));
const summarize=values=>{const ordered=[...values].sort((a,b)=>a-b);return {samplesMs:values,medianMs:ordered[4],minMs:ordered[0],maxMs:ordered[8],meanMs:values.reduce((a,b)=>a+b,0)/values.length};};
const report={at:new Date().toISOString(),node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model,method:'One warmup per command; nine alternating pairs of fresh Node processes. Includes startup, disk reads and schema compilation. Both use the same unchanged corpus; enhanced validation performs more checks.',original:summarize(samples.original),enhanced:summarize(samples.enhanced),scope:'Validator runtime comparison only; not GPU, shader compilation, image fidelity or a speedup claim'};
fs.mkdirSync(path.join(packageRoot,'.qa-tmp'),{recursive:true});fs.writeFileSync(path.join(packageRoot,'.qa-tmp/benchmark.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
