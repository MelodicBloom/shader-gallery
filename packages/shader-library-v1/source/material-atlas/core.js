// Renderer-independent material and narrative state core. No browser or Unreal dependencies.
export const CORE_VERSION = '0.1.0';
export const CORE_EVENTS = Object.freeze(['MATERIAL_SELECTED', 'PARAMETER_SET', 'PARAMETERS_RESET', 'REVEAL_SET']);

export function validateDefinition(definition) {
  if (!definition || typeof definition !== 'object' || !/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(definition.id || '')) throw new Error('Invalid material id');
  if (!Array.isArray(definition.parameters) || !definition.parameters.length) throw new Error('Material requires parameters');
  const seen = new Set();
  for (const p of definition.parameters) {
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(p.id || '') || seen.has(p.id)) throw new Error('Duplicate/invalid parameter id');
    seen.add(p.id);
    if (!['float', 'int'].includes(p.type) || ![p.min,p.max,p.default].every(Number.isFinite) || p.min >= p.max || p.default < p.min || p.default > p.max) throw new Error(`Invalid range: ${p.id}`);
    if (!(p.step > 0) || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(p.uniform || '')) throw new Error(`Invalid mapping: ${p.id}`);
  }
  if (!Array.isArray(definition.topologies) || !definition.topologies.length) throw new Error('Material must declare topologies');
  return definition;
}
export function defaults(definition) {
  validateDefinition(definition);
  return Object.fromEntries(definition.parameters.map(p => [p.id, p.default]));
}
export function updateParameter(definition, values, key, proposed) {
  const p = definition.parameters.find(p => p.id === key);
  if (!p) throw new Error(`Unknown parameter ${key}`);
  const number = Number(proposed);
  if (!Number.isFinite(number)) throw new Error(`Non-finite parameter ${key}`);
  const bounded = Math.max(p.min, Math.min(p.max, number));
  const snapped = p.min + Math.round((bounded - p.min) / p.step) * p.step;
  const value = Number(Math.max(p.min, Math.min(p.max, snapped)).toFixed(6));
  return { ...values, [key]: p.type === 'int' ? Math.round(value) : value };
}
export function transition(state, event, definitions) {
  if (!CORE_EVENTS.includes(event?.type)) throw new Error('Unsupported event');
  if (event.type === 'MATERIAL_SELECTED') {
    const def = definitions[event.id];
    if (!def) throw new Error(`Unknown material ${event.id}`);
    return { materialId: def.id, values: defaults(def), reveal: false, revision: state.revision + 1 };
  }
  const def = definitions[state.materialId];
  if (!def) throw new Error('State references missing material');
  switch (event.type) {
    case 'PARAMETER_SET': return { ...state, values: updateParameter(def,state.values,event.id,event.value), revision: state.revision + 1 };
    case 'PARAMETERS_RESET': return { ...state, values: defaults(def), revision: state.revision + 1 };
    case 'REVEAL_SET': return { ...state, reveal: Boolean(event.value), revision: state.revision + 1 };
    default: throw new Error('Unreachable event');
  }
}
export function createSession(definitions, initialId) {
  const definitionsById = Object.fromEntries(definitions.map(d=>[validateDefinition(d).id,d]));
  if (!definitionsById[initialId]) throw new Error('No initial material');
  let state = { materialId: initialId, values: defaults(definitionsById[initialId]), reveal: false, revision: 0 };
  const events = [];
  return {
    get state() { return structuredClone(state); },
    get events() { return structuredClone(events); },
    dispatch(event) { const next = transition(state,event,definitionsById); events.push(structuredClone(event)); state = next; return structuredClone(state); },
    replay() { let s = { materialId:initialId, values:defaults(definitionsById[initialId]), reveal:false, revision:0 };
      for (const e of events) s = transition(s,e,definitionsById); return s; }
  };
}
export function uniformsFor(definition, values, reveal=false) {
  const out = {};
  for (const p of definition.parameters) out[p.uniform] = { type:p.type, value:values[p.id] ?? p.default };
  out.u_reveal = { type:'float', value: reveal ? 1 : 0 };
  return out;
}
// Adapter-neutral mappings describe semantics, not platform-specific asset graphs.
export function unrealMappings(definition) {
  return definition.parameters.map(p=>({ id:p.id, materialParameter:p.uniform.slice(2), type:p.type==='int'?'Scalar (integer-valued)':'Scalar', unit:p.unit || 'unitless', mechanism:p.mechanism }));
}
