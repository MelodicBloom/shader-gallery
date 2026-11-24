import { ShaderPlayer } from '../src/core/ShaderPlayer.js';
import { createSession, uniformsFor, validateDefinition } from './core.js';

const $ = id => document.getElementById(id);
const canvas = $('canvas');
const stage = $('stage');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const OPAL = 'precious-opal';
const defs = new Map();
const registry = [];
const MAX_PIXEL_RATIO = matchMedia('(pointer:coarse)').matches ? 1.25 : 1.65;
let session, player, selected = OPAL, paused = reducedMotion.matches;
let orbitX=0.18, orbitY=-0.28, zoom=1, drag = null, pinch = null;
let loadToken=0;

const setStatus = text => { $('statusLine').textContent=text; };
const metaUrl = entry => `../${entry.meta}`;
const shaderUrl = entry => `../${entry.shader}`;

function legacyToDefinition(entry,meta){
  const params = Object.entries(meta.uniforms??{}).filter(([,p])=>p.ui==='slider' && ['float','int'].includes(p.type) && [p.min,p.max,p.default].every(Number.isFinite)).map(([name,p])=>({id:name,label:(p.semanticRole||name).replace(/-/g,' '),group:'Published controls',type:p.type,min:p.min,max:p.max,step:p.step??0.01,default:p.default,unit:'normalized/author-defined',uniform:name,mechanism:'Original shader metadata (screen-space renderer)'}));
  return {id:entry.slug,name:entry.name,family:entry.family,description:meta.description||'',parameters:params,topologies:['fullscreen-plane'],kind:'legacy',authority:'MelodicBloom/shader-gallery legacy manifest and meta.json',renderer:{webgl2:shaderUrl(entry)},quality:{tier:'legacy-2d'}};
}
function dispatch(event){
  const state=session.dispatch(event);
  selected=state.materialId;
  updateUniforms();
  if(paused) player?.renderOnce({time:1.2345});
  return state;
}
function updateUniforms(){
  if(!player) return;
  const def=defs.get(selected);
  if(!def) return;
  const state=session.state;
  const mapped=uniformsFor(def,state.values,state.reveal);
  for(const [name,{type,value}] of Object.entries(mapped)) player.setUniform(name,type,value);
  if(selected===OPAL){
    player.setUniform('u_orbitX','float',orbitX);
    player.setUniform('u_orbitY','float',orbitY);
    player.setUniform('u_zoom','float',zoom);
  }
}
function syncControlValues(){
  for(const p of defs.get(selected).parameters){
    const input=document.getElementById(`param-${p.id}`);
    if(!input)continue;
    input.value=session.state.values[p.id];
    const val=input.closest('.control').querySelector('output');
    val.textContent=format(p,input.value);
  }
}
function format(p, value){
  if(p.id==='topology') return ['Sphere','Cabochon','Crystal'][Number(value)]||value;
  const n=Number(value);
  return `${Number.isInteger(n)?n:n.toFixed(p.step<0.01?3:2)}${p.unit && !['relative','fraction','unitless','normalized/author-defined','preset'].includes(p.unit)?' '+p.unit:''}`;
}
function renderCatalog(query='') {
  const target=$('catalog');target.replaceChildren();
  const groups=[['3D Materials',registry.filter(e=>e.kind==='3d')],['Published shaders · 2D',registry.filter(e=>e.kind==='legacy')]];
  for(const [label,list] of groups){
    const matches=list.filter(e=>`${e.name} ${e.family}`.toLowerCase().includes(query.toLowerCase()));
    if(!matches.length)continue;
    const title=document.createElement('div');title.className='category';title.textContent=label;target.append(title);
    for(const entry of matches){
      const button=document.createElement('button');button.type='button';button.dataset.material=entry.id;
      button.setAttribute('aria-current',String(entry.id===selected));
      const name=document.createElement('strong');name.textContent=entry.name;
      const sub=document.createElement('small');sub.textContent=entry.kind==='3d'?entry.family:`${entry.family} · 2D`;button.append(name,sub);
      button.addEventListener('click',()=>selectMaterial(entry.id));target.append(button);
    }
  }
}
function renderControls(def){
  $('description').textContent=def.description;
  $('authority').textContent=def.kind==='legacy'?'Original metadata controls; 3D topology and lighting not yet implemented for this specimen.':'Experimental optical approximation; compare with a reference and measured material before claiming physical fidelity.';
  const groups=new Map();
  for(const p of def.parameters){
    const arr=groups.get(p.group)||[];arr.push(p);groups.set(p.group,arr);
  }
  $('controlCount').textContent=`${def.parameters.length} dials`;
  $('controls').replaceChildren();
  for(const [group,parameters] of groups){
    const heading=document.createElement('h3');heading.textContent=group;$('controls').append(heading);
    for(const p of parameters){
      const wrap=document.createElement('div');wrap.className='control';
      const head=document.createElement('div');head.className='controlhead';
      const label=document.createElement('label');label.htmlFor=`param-${p.id}`;label.textContent=p.label;
      const val=document.createElement('output');val.textContent=format(p,session.state.values[p.id]);head.append(label,val);
      const input=document.createElement('input');input.type='range';input.id=`param-${p.id}`;input.min=p.min;input.max=p.max;input.step=p.step;input.value=session.state.values[p.id];
      input.addEventListener('input',()=>{try{dispatch({type:'PARAMETER_SET',id:p.id,value:Number(input.value)});val.textContent=format(p,session.state.values[p.id]);}catch(error){setStatus(error.message);}});
      const hint=document.createElement('small');hint.textContent=p.mechanism||'';
      wrap.append(head,input,hint);$('controls').append(wrap);
    }
  }
}
async function selectMaterial(id){
  const def=defs.get(id);
  if(!def)return;
  const token=++loadToken;
  if(player){player.destroy();player=null;}
  selected=id;
  session.dispatch({type:'MATERIAL_SELECTED',id});
  $('materialName').textContent=def.name;
  $('materialFamily').textContent=def.family;
  $('tier').textContent=id===OPAL?'3D · optical approximation · experimental':'Original WebGL2 shader · screen-space · not yet 3D';
  $('reveal').disabled=id!==OPAL;
  $('reveal').setAttribute('aria-pressed','false');
  $('reveal').textContent='Reveal optical structure';
  renderControls(def);
  renderCatalog($('search').value);
  $('renderStatus').textContent='Compiling WebGL2…';
  const next=new ShaderPlayer(canvas,def.renderer.webgl2,{autoStart:false,trackPointer:true,autoResize:true,preserveDrawingBuffer:true,pixelRatio:MAX_PIXEL_RATIO});
  try{
    await next.init();
    if(token!==loadToken){next.destroy();return;}
    player=next;
    updateUniforms();
    player.renderOnce({time:1.2345});
    if(!paused)player.start();
    $('renderStatus').textContent='WebGL2 · live';
    setStatus(id===OPAL?'Drag the opal or adjust its optical anatomy.':'Legacy specimen loaded with its own published parameters.');
  }catch(error){
    next.destroy();
    $('renderStatus').textContent='Render unavailable';
    setStatus(error.message);
    console.error('Material render failed',error);
  }
}
function setPaused(value){
  paused=value;
  $('pause').textContent=paused?'Play':'Pause';
  $('drawState').textContent=paused?'Frozen':'Live';
  if(!player)return;
  if(paused){player.stop();player.setFixedTime(1.2345);player.renderOnce({time:1.2345});}
  else {player.setFixedTime(null);player.start();}
}
$('pause').addEventListener('click',()=>setPaused(!paused));
$('search').addEventListener('input',e=>renderCatalog(e.target.value));
$('resetMaterial').addEventListener('click',()=>{dispatch({type:'PARAMETERS_RESET'});syncControlValues();setStatus('Parameters restored to authored defaults.');});
$('resetView').addEventListener('click',()=>{orbitX=0.18;orbitY=-0.28;zoom=1;updateUniforms();if(paused)player?.renderOnce({time:1.2345});setStatus('View restored.');});
$('reveal').addEventListener('click',()=>{
  if(selected!==OPAL)return;
  const next=!session.state.reveal;dispatch({type:'REVEAL_SET',value:next});
  $('reveal').setAttribute('aria-pressed',String(next));$('reveal').textContent=next?'Conceal optical structure':'Reveal optical structure';
  setStatus(`REVEAL_SET ${next} · revision ${session.state.revision} · replay ${JSON.stringify(session.replay())===JSON.stringify(session.state)?'matches':'MISMATCH'}`);
});
$('copyState').addEventListener('click',async()=>{
  const data=JSON.stringify({core:'0.1.0',...session.state,events:session.events},null,2);
  try{await navigator.clipboard.writeText(data);setStatus('State and replay events copied.');}
  catch{setStatus('Clipboard permission unavailable; use your browser to copy the state.');}
});
$('capture').addEventListener('click',()=>{
  if(!player)return;
  const a=document.createElement('a');a.download=`${selected.replaceAll('/','-')}-capture.png`;a.href=player.captureDataURL();a.click();
});
canvas.addEventListener('pointerdown',e=>{
  if(selected!==OPAL)return;
  canvas.setPointerCapture(e.pointerId);
  drag={id:e.pointerId,x:e.clientX,y:e.clientY};
});
canvas.addEventListener('pointermove',e=>{
  if(selected!==OPAL||!drag||drag.id!==e.pointerId)return;
  const bounds=canvas.getBoundingClientRect();
  orbitY+=(e.clientX-drag.x)/Math.max(1,bounds.width)*3.4;
  orbitX=Math.max(-1.25,Math.min(1.25,orbitX+(e.clientY-drag.y)/Math.max(1,bounds.height)*2.7));
  drag.x=e.clientX;drag.y=e.clientY;updateUniforms();if(paused)player?.renderOnce({time:1.2345});
});
for(const name of ['pointerup','pointercancel'])canvas.addEventListener(name,e=>{if(drag?.id===e.pointerId)drag=null;});
canvas.addEventListener('wheel',e=>{if(selected!==OPAL)return;e.preventDefault();zoom=Math.max(0.7,Math.min(1.6,zoom*Math.exp(-e.deltaY*.0007)));updateUniforms();if(paused)player?.renderOnce({time:1.2345});},{passive:false});
reducedMotion.addEventListener('change',e=>setPaused(e.matches));
document.addEventListener('visibilitychange',()=>{if(document.hidden){player?.stop();}else if(!paused)player?.start();});

async function boot(){
  try{
    const opal=validateDefinition(await fetch('./materials/precious-opal.json').then(r=>{if(!r.ok)throw Error('Missing opal definition');return r.json();}));
    opal.kind='3d';opal.renderer.webgl2='./shaders/precious-opal.frag';
    defs.set(opal.id,opal);registry.push(opal);
    let skipped=0;
    try{
      const response=await fetch('../manifest.json');
      if(response.ok){
        const manifest=await response.json();
        const entries=manifest.shaders||[];
        const resolved=await Promise.allSettled(entries.map(async entry=>{
          const r=await fetch(metaUrl(entry));if(!r.ok)throw Error(`Missing ${entry.meta}`);
          return validateDefinition(legacyToDefinition(entry,await r.json()));
        }));
        for(const result of resolved){
          if(result.status!=='fulfilled'){skipped++;continue;}
          const def=result.value;defs.set(def.id,def);registry.push(def);
        }
      }
    }catch(error){console.warn('Legacy catalog unavailable',error);}
    session=createSession([...defs.values()],OPAL);
    $('count').textContent=`${registry.length} indexed`;
    await selectMaterial(OPAL);
    setPaused(reducedMotion.matches);
    if(skipped)setStatus(`${skipped} original specimen metadata files could not be loaded; remaining entries are available.`);
  }catch(error){$('renderStatus').textContent='Initialization failed';setStatus(error.message);console.error(error);}
}
boot();
