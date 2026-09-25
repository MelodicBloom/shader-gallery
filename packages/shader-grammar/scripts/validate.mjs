import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')), '..');
const read = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const errors = [];
const fail = message => errors.push(message);

function resolveRef(schemaRoot, ref) {
  if (!ref.startsWith('#/')) throw new Error(`External $ref is outside the dependency-free validator subset: ${ref}`);
  return ref.slice(2).split('/').reduce((node, key) => node[key.replaceAll('~1','/').replaceAll('~0','~')], schemaRoot);
}

function validate(instance, schema, schemaRoot, at='$') {
  if (schema.$ref) return validate(instance, resolveRef(schemaRoot, schema.$ref), schemaRoot, at);
  if (Object.hasOwn(schema,'const') && JSON.stringify(instance) !== JSON.stringify(schema.const)) fail(`${at}: expected constant ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.some(x => JSON.stringify(x) === JSON.stringify(instance))) fail(`${at}: value is outside enum`);
  const isObject = instance !== null && typeof instance === 'object' && !Array.isArray(instance);
  const typeOk = !schema.type || (schema.type === 'object' && isObject) || (schema.type === 'array' && Array.isArray(instance)) || (schema.type === 'string' && typeof instance === 'string') || (schema.type === 'number' && typeof instance === 'number' && Number.isFinite(instance)) || (schema.type === 'integer' && Number.isInteger(instance)) || (schema.type === 'boolean' && typeof instance === 'boolean');
  if (!typeOk) { fail(`${at}: expected ${schema.type}`); return; }
  if (typeof instance === 'string') {
    if (schema.minLength !== undefined && instance.length < schema.minLength) fail(`${at}: string is too short`);
    if (schema.pattern && !(new RegExp(schema.pattern)).test(instance)) fail(`${at}: does not match ${schema.pattern}`);
  }
  if (typeof instance === 'number' && schema.minimum !== undefined && instance < schema.minimum) fail(`${at}: below minimum`);
  if (Array.isArray(instance)) {
    if (schema.minItems !== undefined && instance.length < schema.minItems) fail(`${at}: too few items`);
    if (schema.uniqueItems && new Set(instance.map(x=>JSON.stringify(x))).size !== instance.length) fail(`${at}: duplicate array items`);
    if (schema.items) instance.forEach((item,i)=>validate(item,schema.items,schemaRoot,`${at}[${i}]`));
  }
  if (isObject) {
    for (const key of schema.required ?? []) if (!Object.hasOwn(instance,key)) fail(`${at}: missing required property ${key}`);
    if (schema.minProperties !== undefined && Object.keys(instance).length < schema.minProperties) fail(`${at}: too few properties`);
    for (const [key,value] of Object.entries(instance)) {
      if (schema.propertyNames) validate(key,schema.propertyNames,schemaRoot,`${at}.{propertyName}`);
      if (schema.properties?.[key]) validate(value,schema.properties[key],schemaRoot,`${at}.${key}`);
      else if (schema.additionalProperties === false) fail(`${at}: unexpected property ${key}`);
      else if (isObjectSchema(schema.additionalProperties)) validate(value,schema.additionalProperties,schemaRoot,`${at}.${key}`);
    }
  }
}
const isObjectSchema = value => value && typeof value === 'object' && !Array.isArray(value);
const uniqueIds = (items,label) => {
  const seen = new Set();
  for (const item of items) { if (seen.has(item.id)) fail(`${label}: duplicate id ${item.id}`); seen.add(item.id); }
  return seen;
};

const schemaFiles = ['parameter.schema.json','field.schema.json','operator.schema.json','recipe.schema.json'];
const schemas = Object.fromEntries(schemaFiles.map(name => [name,read(`schemas/${name}`)]));
for (const [name,schema] of Object.entries(schemas)) {
  if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail(`${name}: not Draft 2020-12`);
  if (!schema.$id || !schema.title) fail(`${name}: missing $id or title`);
}

const parameterCatalog = read('ontology/parameters.json');
const fieldCatalog = read('ontology/fields.json');
const operatorCatalog = read('ontology/operators.json');
validate(parameterCatalog,schemas['parameter.schema.json'],schemas['parameter.schema.json'],'parameters');
validate(fieldCatalog,schemas['field.schema.json'],schemas['field.schema.json'],'fields');
validate(operatorCatalog,schemas['operator.schema.json'],schemas['operator.schema.json'],'operators');
const parameterIds = uniqueIds(parameterCatalog.parameters,'parameters');
const fieldIds = uniqueIds(fieldCatalog.fields,'fields');
const operatorIds = uniqueIds(operatorCatalog.operators,'operators');

for (const field of fieldCatalog.fields) for (const dependency of field.parameterDependencies ?? []) if (!parameterIds.has(dependency)) fail(`${field.id}: unknown parameter dependency ${dependency}`);

const taxonomyText = fs.readFileSync(path.join(root,'material-taxonomy.yaml'),'utf8');
const familyIds = new Set([...taxonomyText.matchAll(/^  - id: ([a-z][a-z0-9_]*)$/gm)].map(match=>match[1]));
if (familyIds.size < 2) fail('material-taxonomy.yaml: could not parse material families');
const recipeDir = path.join(root,'recipes');
const recipeFiles = fs.readdirSync(recipeDir).filter(name=>name.endsWith('.recipe.json')).sort();
if (recipeFiles.length !== 12) fail(`recipes: expected 12 specimens, found ${recipeFiles.length}`);
const recipeIds = new Set();
const usage = new Map();
const specimens = recipeFiles.map(name=>read(`recipes/${name}`));
const specimenTokens = ['oil_slick','soap_film','nacre','labradorite','butterfly','holographic','bismuth','molten_chrome','caustic_water','cloud','nebula','opalescent_glass'];
const count = id => usage.set(id,(usage.get(id) ?? 0)+1);

for (const recipe of specimens) {
  validate(recipe,schemas['recipe.schema.json'],schemas['recipe.schema.json'],recipe.id ?? 'recipe');
  if (recipeIds.has(recipe.id)) fail(`recipes: duplicate id ${recipe.id}`); recipeIds.add(recipe.id);
  for (const family of recipe.materialFamilies ?? []) if (!familyIds.has(family)) fail(`${recipe.id}: unknown family ${family}`);
  const instanceIds = new Set();
  const addInstance = id => { if (instanceIds.has(id)) fail(`${recipe.id}: duplicate instance ${id}`); instanceIds.add(id); };
  for (const item of recipe.parameterValues ?? []) { if (!parameterIds.has(item.parameter)) fail(`${recipe.id}: unknown parameter ${item.parameter}`); count(item.parameter); }
  for (const item of recipe.fieldInstances ?? []) { addInstance(item.id); if (!fieldIds.has(item.field)) fail(`${recipe.id}: unknown field ${item.field}`); count(item.field); }
  for (const item of recipe.operatorInstances ?? []) { addInstance(item.id); if (!operatorIds.has(item.operator)) fail(`${recipe.id}: unknown operator ${item.operator}`); count(item.operator); }
  for (const item of recipe.parameterValues ?? []) if (item.modulatedBy && !instanceIds.has(item.modulatedBy)) fail(`${recipe.id}: modulation source ${item.modulatedBy} is not an instance`);
  for (const edge of recipe.graph ?? []) { if (!instanceIds.has(edge.from)) fail(`${recipe.id}: graph source ${edge.from} is missing`); if (!instanceIds.has(edge.to)) fail(`${recipe.id}: graph target ${edge.to} is missing`); }
  for (const [slot,target] of Object.entries(recipe.outputs ?? {})) {
    if (target.startsWith('parameter:')) { if (!parameterIds.has(target.slice(10))) fail(`${recipe.id}: output ${slot} has unknown parameter target ${target}`); }
    else if (!instanceIds.has(target)) fail(`${recipe.id}: output ${slot} target ${target} is missing`);
  }
}

for (const primitive of [...parameterIds,...fieldIds,...operatorIds]) for (const token of specimenTokens) if (primitive.includes(token)) fail(`one-off concept leak: ${primitive} contains specimen token ${token}`);
const usedOnce = [...usage].filter(([,n])=>n<2).map(([id])=>id).sort();
if (process.argv.includes('--strict') && usedOnce.length) fail(`strict reuse: primitives used by only one specimen: ${usedOnce.join(', ')}`);

const summary = {
  schemas:schemaFiles.length, parameters:parameterIds.size, fields:fieldIds.size, operators:operatorIds.size,
  specimens:specimens.length, taxonomyFamilies:familyIds.size, usedPrimitives:usage.size,
  sharedUsedPrimitives:[...usage.values()].filter(n=>n>=2).length, singleSpecimenPrimitives:usedOnce
};
if (errors.length) {
  console.error(`Shader Grammar validation FAILED (${errors.length} issue${errors.length===1?'':'s'})`);
  errors.forEach(error=>console.error(`- ${error}`));
  process.exit(1);
}
console.log('Shader Grammar validation PASSED');
console.log(JSON.stringify(summary,null,2));
