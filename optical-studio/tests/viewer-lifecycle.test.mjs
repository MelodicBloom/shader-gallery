import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

// Exercise the viewer's actual frame and navigation handlers with a deterministic
// animation clock and a minimal GL stub; this is not browser or GPU evidence.
function viewer() {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const frame = html.slice(html.indexOf('function frame(now){'), html.indexOf('function fail(message)'));
  const handlers = html.slice(html.indexOf("window.addEventListener('pagehide'"), html.indexOf("sync();try{init()}"));
  assert.ok(frame.includes('requestAnimationFrame(frame)') && handlers.includes("'pageshow'"));
  let id = 0, draws = 0;
  const callbacks = new Map(), events = new Map(), nodes = new Map();
  const canvas = { clientWidth: 100, clientHeight: 60, width: 100, height: 60, hidden: false };
  const gl = { NO_ERROR: 0, TRIANGLES: 4, viewport() {}, useProgram() {}, uniform2f() {},
    uniform1f() {}, uniform3fv() {}, drawArrays() { draws++; }, getError() { return 0; } };
  const context = { canvas, gl, lost:false, dirty:false, previous:0, raf:0, displayed:null,
    state:{playing:false,time:0,camera:[0,0,3],uniforms:{}}, document:{hidden:false}, devicePixelRatio:1,
    performance:{now:()=>5000}, fallback:{hidden:true}, shaderFaults:new Map(), REV:1,
    acquire:()=>({p:{},uniforms:{}}), study:()=>({slug:'opal',name:'Opal',hash:'test'}),
    effectiveLight:()=>[0,1,1], showShaderFault:e=>{throw Error(e)},
    $:id=>{ if(!nodes.has(id)) nodes.set(id,{dataset:{}, value:'',textContent:''}); return nodes.get(id); },
    requestAnimationFrame:cb=>{callbacks.set(++id,cb);return id;}, cancelAnimationFrame:id=>callbacks.delete(id),
    window:{addEventListener:(name,fn)=>events.set(name,fn)},
  };
  vm.createContext(context);
  vm.runInContext(frame + '\n' + handlers, context);
  return { context, canvas, callbacks, events, get draws(){return draws;} };
}

test('paused viewer redraws at resized buffer dimensions', () => {
  const v = viewer();
  v.canvas.clientWidth = 200;
  v.context.frame(16);
  assert.equal(v.canvas.width, 200);
  assert.equal(v.canvas.height, 60);
  assert.equal(v.draws, 1);
  v.context.frame(32);
  assert.equal(v.draws, 1);
});

test('bfcache return resumes one loop without counting time away', () => {
  const v = viewer();
  v.context.frame(16);
  assert.equal(v.callbacks.size, 1);
  v.events.get('pagehide')({persisted:true});
  assert.equal(v.callbacks.size, 0);
  v.events.get('pageshow')({persisted:true});
  assert.equal(v.callbacks.size, 1);
  assert.equal(v.context.previous, 5000);
  assert.equal(v.context.dirty, true);
});
