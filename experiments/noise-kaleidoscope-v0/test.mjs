import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS,validatePatch,foldPolar,receipt} from './contract.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9);
test('default receipt',()=>{assert.equal(receipt(DEFAULTS,1.2345).controls.seed,314)});
test('invalid control fails closed',()=>{
 for(const p of [{unknown:5},{sectors:2},{seed:1.3},{warp:NaN}]) assert.throws(()=>validatePatch(p));
});
test('rotation sector invariance N=3..24',()=>{
 for(let n=3;n<=24;n++)for(let k=0;k<n;k++){
  let a=.135,angle=a+k*2*Math.PI/n;
  let p=foldPolar(Math.cos(angle),Math.sin(angle),n),q=foldPolar(Math.cos(a),Math.sin(a),n);
  near(p[0],q[0]);near(p[1],q[1]);
 }
});
test('reflection invariant',()=>{
 for(let n=3;n<=24;n++){
  let w=2*Math.PI/n,a=w*.18;
  let p=foldPolar(Math.cos(a),Math.sin(a),n),q=foldPolar(Math.cos(w-a),Math.sin(w-a),n);
  near(p[0],q[0]);near(p[1],q[1]);
 }
});
test('wedge seam continuous',()=>{
 for(let n=3;n<=24;n++){
  let w=2*Math.PI/n,e=1e-8;
  let p=foldPolar(Math.cos(w-e),Math.sin(w-e),n),q=foldPolar(Math.cos(w+e),Math.sin(w+e),n);
  assert.ok(Math.hypot(p[0]-q[0],p[1]-q[1])<1e-6);
 }
});