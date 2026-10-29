import {FPS,DURATION,DEFAULTS,PRESETS,sanitizeParams,audioAt,derivedAudio,scheduleAt,buildProvenance} from './control.js';
import {KaleidoscopicRenderer} from './gl.js';
import {audioEnvelopeFromFile,isEnvelopeValid} from './audio.js';
const $=id=>document.getElementById(id),canvas=$('view'),player=$('player');
let renderer=null,params={...DEFAULTS},samples=[],frame=0,running=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let mode='fixture',source='fixtures/benchmark-12s.wav',lastRAF=0,deltaEMA=0,carryMs=0,objectURL=null,renderedFrame=-1,fixtureSamples=[];
function alertError(message){$('error').hidden=false;$('error').textContent=message;$('engine-status').textContent='EXPERIMENT PAUSED';running=false;}
function readUI(){for(const key of Object.keys(DEFAULTS))if($(key)&&$(key).type==='range')params[key]=Number($(key).value);params=sanitizeParams(params);}
function writeUI(){for(const [key,val] of Object.entries(params))if($(key)&&$(key).type==='range'){$(key).value=String(val);$(key+'-out').textContent=key==='grid'||key==='segments'?String(val):Number(val).toFixed(2);}}
function preset(name){params={...PRESETS[name]};writeUI();reset();document.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===name)));}
function reset(){frame=0;renderedFrame=-1;renderer?.reset();player.pause();try{player.currentTime=0;}catch{} drawExact(0);}
function drawExact(target){
 if(!renderer||!samples.length)return;
 target=Math.max(0,Math.min(samples.length-1,Math.round(target)));
 if(target<renderer.simStep-1){renderer.reset();}
 // Reproduce the feedback trajectory deterministically. Every step uses the same envelope + schedule.
 for(let i=renderer.simStep;i<=target;i++){
  const a=derivedAudio(audioAt(samples,i/FPS),params.audioGain);
  renderer.step(i/FPS,params,a);
 }
 frame=target;const a=derivedAudio(audioAt(samples,frame/FPS),params.audioGain),t=frame/FPS;
 renderer.render(params,a,t,scheduleAt(t));renderedFrame=target;
 $('rms').textContent=a.rms.toFixed(2);$('hit').textContent=a.hit.toFixed(2);
 $('rms-fill').style.width=(a.rms*100).toFixed(1)+'%';$('hit-fill').style.width=(a.hit*100).toFixed(1)+'%';
 $('time').value=String(frame);$('time').max=String(Math.min(FPS*DURATION,samples.length-1));
 $('hud').textContent='FRAME '+String(frame).padStart(4,'0')+' · '+(deltaEMA>0?(1000/deltaEMA).toFixed(1):'—')+' UI FPS';
}
function tick(stamp){requestAnimationFrame(tick);if(!renderer||!samples.length||!running||$('reduced').checked)return;
 const dt=lastRAF?Math.max(1,Math.min(200,stamp-lastRAF)):0;
 if(dt){deltaEMA=deltaEMA?deltaEMA*.88+dt*.12:dt;}
 lastRAF=stamp;
 const end=Math.min(FPS*DURATION,samples.length-1);
 if(!player.paused&&!player.ended&&player.readyState>=2){drawExact(Math.min(end,Math.floor(player.currentTime*FPS)));if(player.currentTime>=end/FPS)pause();}
 else {carryMs+=dt;const advance=Math.floor(carryMs/(1000/FPS));if(advance>0){carryMs-=advance*(1000/FPS);const target=Math.min(end,frame+advance);drawExact(target);if(target>=end)pause();}}
}
function pause(){running=false;carryMs=0;lastRAF=0;$('play').textContent='▶   PLAY';player.pause();}
async function useFixture(){
 try{const response=await fetch('./fixtures/envelope-60fps.json',{cache:'no-store'});if(!response.ok)throw Error('fixture HTTP '+response.status);
 const x=await response.json();if(!isEnvelopeValid(x.samples))throw Error('Invalid fixture envelope');
 fixtureSamples=x.samples;samples=x.samples;mode='fixture';source='fixtures/benchmark-12s.wav';player.src='./fixtures/benchmark-12s.wav';$('audio-name').textContent='REFERENCE SYNTH / 12 S';$('audio-note').textContent='Authored synthesis and event annotations; reproducible frame-indexed envelope.';
 pause();reset();}catch(e){alertError('Unable to load reference fixture: '+e.message);}
}
async function useUpload(file){
 if(!file)return;
 if(file.size>90*1024*1024){alertError('Audio must be 90 MB or smaller.');return;}
 try{const next=await audioEnvelopeFromFile(file);if(!isEnvelopeValid(next))throw Error('Could not decode a usable signal');
 if(objectURL)URL.revokeObjectURL(objectURL);objectURL=URL.createObjectURL(file);samples=next.slice(0,FPS*DURATION);mode='upload';source=file.name;
 player.src=objectURL;$('audio-name').textContent=file.name.slice(0,42);$('audio-note').textContent='Analyzed locally: RMS and threshold-based beat proxies. No file is uploaded or transmitted.';pause();reset();}
 catch(e){$('audio-note').textContent='Audio decode failed: '+e.message;}
}
function exportReceipt(){
 const a=derivedAudio(audioAt(samples,frame/FPS),params.audioGain);
 const record={...buildProvenance(params,samples,{userAgent:navigator.userAgent,canvas:{width:canvas.width,height:canvas.height},uiFPS:deltaEMA?+(1000/deltaEMA).toFixed(2):null}),
 capture:{frame,seconds:frame/FPS,schedule:scheduleAt(frame/FPS),audio:a},audio:{kind:mode,source,uploadedContentExcluded:true}, capturedAt:new Date().toISOString(),
 validation:{shaderCompilation:'runtime-only',performance:'browser-observed-ui-cadence-not-GPU-timing',touchDesignerParity:'not-tested',reproducibility:'fixed frame and provided audio envelope'} };
 saveBlob(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}),`KF-001-receipt-frame-${frame}.json`);
}
function saveBlob(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function capture(){// preserveDrawingBuffer must remain enabled for a reliable synchronous export.
 if(!renderer)return;drawExact(frame);canvas.toBlob(blob=>{if(blob)saveBlob(blob,`KF-001-frame-${frame}.png`);else alertError('PNG capture failed');},'image/png');}
function wire(){writeUI();for(const key of Object.keys(DEFAULTS))if($(key)&&$(key).type==='range')$(key).addEventListener('input',()=>{readUI();writeUI();document.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed','false'));if(key==='grid')renderer.setGrid(params.grid);renderer.reset();drawExact(frame);});
 document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>preset(b.dataset.preset)));
 $('play').addEventListener('click',async()=>{if(running){pause();return;}if(frame>=Math.min(FPS*DURATION,samples.length-1))reset();lastRAF=0;carryMs=0;running=true;$('play').textContent='Ⅱ   PAUSE';try{await player.play();}catch{};});
 $('reset').addEventListener('click',reset);$('capture').addEventListener('click',capture);$('receipt').addEventListener('click',exportReceipt);
 $('time').addEventListener('input',e=>{pause();const f=Number(e.target.value);try{player.currentTime=f/FPS;}catch{}drawExact(f);});
 $('fixture').addEventListener('click',useFixture);$('upload').addEventListener('change',e=>useUpload(e.target.files[0]));
 $('reduced').checked=!running;$('reduced').addEventListener('change',e=>{if(e.target.checked)pause();else{running=true;$('play').textContent='Ⅱ   PAUSE';}});
 window.addEventListener('keydown',e=>{if(e.code==='Space'&&!['INPUT','BUTTON'].includes(document.activeElement.tagName)){e.preventDefault();$('play').click();}});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();alertError('WebGL context lost. Reload the page to recreate GPU resources.');});
}
try{renderer=new KaleidoscopicRenderer(canvas);$('engine-status').textContent='WEBGL2 / GPU FIELD ACTIVE';wire();await useFixture();if(running)$('play').textContent='Ⅱ   PAUSE';requestAnimationFrame(tick);}catch(e){alertError('Renderer error: '+(e?.message||e));console.error(e);}
