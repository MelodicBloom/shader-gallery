import test from 'node:test';
import assert from 'node:assert/strict';
import { LINES_NM, PRESETS, SAMPLES_NM, coefficients, indexAtNm, reference, exportCandidate } from './cauchy.mjs';
const near = (a,b,tol=1e-11)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
test('all five presets yield normalized d-line and exact F-C/Abbe spread',()=>{
  for(const p of PRESETS){const r=reference(p.nd,p.vd);near(r.ndComputed,p.nd);near(r.deltaFC,(p.nd-1)/p.vd);assert.ok(r.nF>r.ndComputed&&r.ndComputed>r.nC);}
});
test('reference seven wavelengths remain ordered and index decreases for normal dispersion',()=>{
 const r=reference(1.62,30);assert.equal(r.sevenWavelengthIndices.length,7);
 for(let i=1;i<7;i++){assert.ok(SAMPLES_NM[i]>SAMPLES_NM[i-1]);assert.ok(r.sevenWavelengthIndices[i].n<r.sevenWavelengthIndices[i-1].n)}
 near(r.deltaFC,.62/30);
});
test('changing Abbe changes spread inversely; central index remains invariant',()=>{
 let x=reference(1.6,30),y=reference(1.6,60);near(x.deltaFC/2,y.deltaFC);near(x.ndComputed,y.ndComputed);
});
test('Cauchy coefficients agree with symbolic parameterization',()=>{
 const x=coefficients(1.62,30);near(x.A+x.B/(LINES_NM.d**2),1.62);
 near(indexAtNm(1.62,30,LINES_NM.F)-indexAtNm(1.62,30,LINES_NM.C),.62/30);
});
test('visual exaggeration is not propagated to physical model',()=>{
 const x=reference(1.62,30);near(x.display.displayedSpread,x.deltaFC*3);
 const y=exportCandidate('custom',1.62,30);near(y.refIndices.physicalModelSpread,x.deltaFC);
 assert.match(y.destination,/candidate-only/);
});
test('reject invalid values and nonvisible wavelengths',()=>{
 for(const [n,v] of [[NaN,30],[1,50],[1.62,0],[3.5,40],[1.5,Infinity]])assert.throws(()=>reference(n,v),RangeError);
 assert.throws(()=>indexAtNm(1.62,30,1000),RangeError);
});
