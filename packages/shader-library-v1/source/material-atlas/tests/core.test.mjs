import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateDefinition, createSession, updateParameter, uniformsFor, unrealMappings, CORE_VERSION } from '../core.js';
const def=JSON.parse(readFileSync(new URL('../materials/precious-opal.json',import.meta.url),'utf8'));
test('definition is a versioned, unique, bounded control contract',()=>{
  assert.equal(CORE_VERSION,def.schemaVersion);
  assert.equal(validateDefinition(def),def);
  assert.equal(new Set(def.parameters.map(p=>p.id)).size,def.parameters.length);
  assert.ok(def.parameters.every(p=>p.mechanism&&p.group));
  assert.deepEqual(def.topologies,['sphere','cabochon','crystal']);
});
test('parameter updates are bounded and quantized',()=>{
  const values={};
  assert.equal(updateParameter(def,values,'fire',999).fire,2);
  assert.equal(updateParameter(def,values,'fire',-100).fire,0);
  assert.equal(updateParameter(def,values,'topology',2.7).topology,2);
  assert.throws(()=>updateParameter(def,values,'fire',NaN),/Non-finite/);
  assert.throws(()=>updateParameter(def,values,'unlisted',1),/Unknown/);
});
test('selection, controls and narrative events replay deterministically',()=>{
  const session=createSession([def],def.id);
  session.dispatch({type:'PARAMETER_SET',id:'scatter',value:1.12});
  session.dispatch({type:'PARAMETER_SET',id:'topology',value:1});
  session.dispatch({type:'REVEAL_SET',value:true});
  assert.deepEqual(session.replay(),session.state);
  assert.equal(session.state.reveal,true);
  assert.equal(session.state.revision,3);
  const u=uniformsFor(def,session.state.values,session.state.reveal);
  assert.deepEqual(u.u_scatter,{type:'float',value:1.12});
  assert.deepEqual(u.u_topology,{type:'int',value:1});
  assert.deepEqual(u.u_reveal,{type:'float',value:1});
});
test('adapter-neutral Unreal map retains semantic units and mechanism',()=>{
  const x=unrealMappings(def);
  assert.equal(x.length,def.parameters.length);
  assert.equal(x.find(p=>p.id==='ior').materialParameter,'ior');
  assert.equal(x.find(p=>p.id==='topology').type,'Scalar (integer-valued)');
  assert.ok(x.every(p=>p.mechanism));
});
test('mutation cannot enter the canonical value log through a returned state object',()=>{
  const s=createSession([def],def.id);
  const state=s.state;
  state.values.fire=123;
  assert.equal(s.state.values.fire,def.parameters.find(p=>p.id==='fire').default);
});
