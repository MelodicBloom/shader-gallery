// Native WebGL2/EGL shader smoke gate: requires repository's native validator libraries.
// Run from packages/shader-library-v1/source (the validator resolves paths relative to cwd).
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runShader} from '../../tools/native-runner.mjs';
const d=JSON.parse(readFileSync(new URL('../materials/precious-opal.json',import.meta.url),'utf8'));
const base=Object.fromEntries(d.parameters.map(p=>[p.uniform,{type:p.type,default:p.default}]));
const entry={shader:'material-atlas/shaders/precious-opal.frag'};
for(const topology of [0,1,2]){
 for(const lightAngle of [-0.8,1.3]){
  const meta={uniforms:{...base,u_topology:{type:'int',default:topology},u_lightAngle:{type:'float',default:lightAngle},u_orbitX:{type:'float',default:0.18},u_orbitY:{type:'float',default:-0.28},u_zoom:{type:'float',default:1},u_reveal:{type:'float',default:0}},preview:{time:1.2345}};
  const result=runShader({entry,meta,width:128,height:128});
  assert.ok(result.mean>0.5,`No visible image for topology ${topology} angle ${lightAngle}`);
  assert.ok(result.alpha>0.5,`Missing output alpha topology ${topology}`);
  console.log(`OK topology=${topology} light=${lightAngle} mean=${result.mean.toFixed(2)} variance=${result.variance.toFixed(2)}`);
 }
}
