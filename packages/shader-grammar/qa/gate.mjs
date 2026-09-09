import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import YAML from 'yaml';

export const packageRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function load(root=packageRoot){
  const json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
  return {
    schemas:Object.fromEntries(['parameter','field','operator','recipe'].map(k=>[k,json(`schemas/${k}.schema.json`)])),
    parameters:json('ontology/parameters.json'),fields:json('ontology/fields.json'),operators:json('ontology/operators.json'),
    taxonomy:YAML.parse(fs.readFileSync(path.join(root,'material-taxonomy.yaml'),'utf8')),
    recipes:fs.readdirSync(path.join(root,'recipes')).filter(x=>x.endsWith('.recipe.json')).sort().map(x=>json('recipes/'+x)),
    example:json('examples/minimal-thin-film.recipe.json')
  };
}
export function check(data){
  const errors=[],fail=x=>errors.push(x),ajv=new Ajv2020({strict:false,allErrors:true});
  for(const [kind,schema] of Object.entries(data.schemas)){
    if(!ajv.validateSchema(schema)){fail(`invalid schema: ${kind}`);continue;}
    const validate=ajv.compile(schema),instances=kind==='recipe'?[...data.recipes,data.example]:[data[kind==='parameter'?'parameters':kind==='field'?'fields':'operators']];
    for(const obj of instances)if(!validate(obj))fail(`${kind}: ${JSON.stringify(validate.errors)}`);
  }
  if(errors.length)return errors;
  const families=new Set(data.taxonomy.families.map(x=>x.id));
  if(families.size!==data.taxonomy.families.length)fail('duplicate taxonomy families');
  const registry=(items,label)=>{const m=new Map();for(const x of items){if(m.has(x.id))fail(`${label}: duplicate ${x.id}`);m.set(x.id,x);}return m;};
  const params=registry(data.parameters.parameters,'parameters'),fields=registry(data.fields.fields,'fields'),ops=registry(data.operators.operators,'operators');
  const usage=new Map();const recipeIds=new Set();
  for(const r of data.recipes){
    const f=x=>fail(`${r.id}: ${x}`);
    if(recipeIds.has(r.id))f('duplicate recipe ID');recipeIds.add(r.id);
    for(const family of r.materialFamilies)if(!families.has(family))f(`unknown family ${family}`);
    const nodes=new Map(),seenParameters=new Set();
    for(const n of [...r.fieldInstances,...r.operatorInstances]){if(nodes.has(n.id))f(`duplicate node ${n.id}`);nodes.set(n.id,n);}
    for(const n of r.fieldInstances)if(!fields.has(n.field))f(`unknown field ${n.field}`);
    for(const n of r.operatorInstances)if(!ops.has(n.operator))f(`unknown operator ${n.operator}`);
    for(const p of r.parameterValues){
      const def=params.get(p.parameter);if(!def){f(`unknown parameter ${p.parameter}`);continue;}
      if(seenParameters.has(p.parameter))f(`duplicate parameter ${p.parameter}`);seenParameters.add(p.parameter);
      const value=p.value,type=def.valueType;
      const size={vec2:2,vec3:3,vec4:4,color:3}[type];
      const number=x=>typeof x==='number'&&Number.isFinite(x);
      if(type==='float'&&!number(value)||type==='int'&&!Number.isInteger(value)||type==='bool'&&typeof value!=='boolean'||size&&(!Array.isArray(value)||value.length!==size||!value.every(number)))f(`wrong value type ${p.parameter}`);
      if(number(value))for(const [label,range] of [['artistic',def.artisticRange],['physical',def.physicalRange]])if(range&&(value<range.min||value>range.max))f(`${label} range ${p.parameter}`);
      if(p.modulatedBy&&!nodes.has(p.modulatedBy))f(`unknown modulation source ${p.modulatedBy}`);
    }
    const adjacency=new Map([...nodes.keys()].map(k=>[k,[]]));
    const edgeSet=new Set(r.graph.map(e=>`${e.from}->${e.to}`));
    for(const e of r.graph){if(!nodes.has(e.from)||!nodes.has(e.to))f('dangling graph endpoint');else adjacency.get(e.from).push(e.to);}
    for(const n of r.operatorInstances){
      const def=ops.get(n.operator);if(!def)continue;
      const ports=new Map(def.signature.inputs.map(x=>[x.name,x]));
      for(const port of ports.values())if(!port.optional&&!Object.hasOwn(n.inputs,port.name))f(`missing input ${n.id}.${port.name}`);
      for(const [port,target] of Object.entries(n.inputs)){
        if(!ports.has(port))f(`unknown port ${n.id}.${port}`);
        if(typeof target!=='string'||!nodes.has(target))f(`dangling operator input ${n.id}.${port}`);
        else if(!edgeSet.has(`${target}->${n.id}`))f(`inputs/graph disagreement ${n.id}.${port}`);
      }
    }
    const visiting=new Set(),done=new Set();
    function visit(id){if(visiting.has(id)){f(`cycle at ${id}`);return;}if(done.has(id))return;visiting.add(id);for(const next of adjacency.get(id))visit(next);visiting.delete(id);done.add(id);}
    for(const id of nodes.keys())visit(id);
    for(const target of Object.values(r.outputs))if(target.startsWith('parameter:')?!params.has(target.slice(10)):!nodes.has(target))f(`unknown output ${target}`);
    for(const id of new Set([...r.parameterValues.map(x=>x.parameter),...r.fieldInstances.map(x=>x.field),...r.operatorInstances.map(x=>x.operator)])){if(!usage.has(id))usage.set(id,new Set());usage.get(id).add(r.id);}
  }
  const expected=['oil_slick','soap_film','nacre','labradorite','butterfly_structural_color','holographic_foil','bismuth_oxide','molten_chrome','caustic_water','cloud','nebula','opalescent_glass'];
  if(data.recipes.length!==12||expected.some(x=>!recipeIds.has('recipe.'+x)))fail('required specimen set differs');
  for(const [id,specimens] of usage)if(specimens.size<2)fail(`single-specimen primitive ${id}`);
  return errors;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const errors=check(load());console.log(JSON.stringify({gate:'structural-plus-guardrails; not a renderer conformance claim',passed:errors.length===0,errors},null,2));process.exitCode=errors.length?1:0;
}
