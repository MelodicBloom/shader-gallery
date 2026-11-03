import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS,validatePatch,foldPolar,receipt} from './contract.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9);
const viewport={width:1200,height:1000,pixelRatio:1.5};
test('default receipt includes the drawing buffer dimensions',()=>{const r=receipt(DEFAULTS,1.2345,viewport);assert.equal(r.controls.seed,314);assert.deepEqual(r.viewport,viewport)});
test('invalid control fails closed',()=>{
 for(const p of [{unknown:5},{sectors:2},{seed:1.3},{warp:NaN}, {constructor:5}, {toString:5}]) assert.throws(()=>validatePatch(p));
 const {sectors,...rest}=DEFAULTS;
 assert.throws(()=>receipt({...rest,constructor:5},0,viewport));
 for(const v of [null,{width:0,height:1,pixelRatio:1},{width:1,height:1,pixelRatio:NaN}]) assert.throws(()=>receipt(DEFAULTS,0,v));
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
