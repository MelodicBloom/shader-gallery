import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {load,check,packageRoot} from './gate.mjs';

const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(fs.readFileSync(path.join(packageRoot,'provenance/v0.1-manifest.json'),'utf8'));
assert.equal(manifest.files.length,28);
for(const file of manifest.files){const bytes=fs.readFileSync(path.join(packageRoot,file.relativePath));assert.equal(hash(bytes),file.sha256,file.relativePath);assert.equal(bytes.length,file.bytes);}
const original=spawnSync(process.execPath,['scripts/validate.mjs','--strict'],{cwd:packageRoot,encoding:'utf8'});
assert.equal(original.status,0,original.stderr);
const base=load();assert.deepEqual(check(base),[],'baseline must pass');
const oil=d=>d.recipes.find(r=>r.id==='recipe.oil_slick');
const cases=[
  ['wrong parameter type',d=>oil(d).parameterValues[0].value={invalid:true},'wrong value type'],
  ['out of range',d=>oil(d).parameterValues.find(p=>p.parameter==='surface.roughness').value=999,'artistic range'],
  ['dangling operator input',d=>oil(d).operatorInstances[0].inputs.input='missing','dangling operator input'],
  ['missing required input',d=>oil(d).operatorInstances[0].inputs={},'missing input'],
  ['self cycle',d=>oil(d).graph.push({from:oil(d).operatorInstances[0].id,to:oil(d).operatorInstances[0].id}),'cycle at'],
  ['dangling graph endpoint',d=>oil(d).graph[0].from='missing','dangling graph endpoint'],
  ['inputs and graph disagree',d=>oil(d).operatorInstances[0].inputs.input=oil(d).fieldInstances[1].id,'inputs/graph disagreement'],
  ['unknown input port',d=>oil(d).operatorInstances[0].inputs.extra=oil(d).fieldInstances[0].id,'unknown port'],
  ['duplicate parameter',d=>oil(d).parameterValues.push(structuredClone(oil(d).parameterValues[0])),'duplicate parameter'],
  ['missing specimen',d=>d.recipes.pop(),'required specimen set differs']
];
const results=[];
for(const [name,mutate,expected] of cases){const data=structuredClone(base);mutate(data);assert.notDeepEqual(data,base,`${name} must mutate data`);const errors=check(data);assert.ok(errors.some(e=>e.includes(expected)),`${name}: ${errors.join('; ')}`);results.push({name,correctlyRejected:true,errors});}
const report={at:new Date().toISOString(),node:process.version,originalValidatorPassed:true,baselineGuardrailsPassed:true,hashMatches:manifest.files.length,negativeCases:results,limitations:['No operator port type or dimensional-unit compatibility claim','No rendered image, GPU performance or physical correctness claim','Known baseline placeholder signatures and equations remain unchanged']};
const reports=path.join(packageRoot,'.qa-tmp');fs.mkdirSync(reports,{recursive:true});fs.writeFileSync(path.join(reports,'test.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
