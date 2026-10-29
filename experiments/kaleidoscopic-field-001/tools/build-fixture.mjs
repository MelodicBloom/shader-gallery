import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {FPS,DURATION} from '../src/control.js';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const rate=24000,n=rate*DURATION,pcm=Buffer.alloc(44+n*2);const kickStarts=[],snareStarts=[];
for(let frame=0;frame<FPS*DURATION;frame++){
 if(frame%30===0)kickStarts.push(frame);
 if(frame%60===15)snareStarts.push(frame);
}
const samples=[];
function fract(v){return v-Math.floor(v);}
function rand(i){return fract(Math.sin(i*12.9898+78.233)*43758.5453)*2-1;}
const phaseRate=2*Math.PI;
for(let i=0;i<n;i++){
 const t=i/rate;
 // Generated fixture: C minor ambience + patterned synthetic kick and snare, no copyrighted input.
 let x=.12*Math.sin(phaseRate*130.81*t)+.10*Math.sin(phaseRate*155.56*t)+.065*Math.sin(phaseRate*196*t);
 const bar=Math.floor(t*2),travel=Math.sin(phaseRate*(.125*t+.01*bar));x*=.64+.24*travel;
 for(const f of kickStarts){const d=t-f/FPS;if(d>=0&&d<.33){x+=.75*Math.exp(-d*24)*Math.sin(phaseRate*(52*d+43*d*d));}}
 for(const f of snareStarts){const d=t-f/FPS;if(d>=0&&d<.16){x+=.27*Math.exp(-d*40)*rand(i);}}
 x=Math.max(-.98,Math.min(.98,x));pcm.writeInt16LE(Math.round(x*32767),44+i*2);
}
pcm.write('RIFF',0);pcm.writeUInt32LE(36+n*2,4);pcm.write('WAVEfmt ',8);pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(1,22);pcm.writeUInt32LE(rate,24);pcm.writeUInt32LE(rate*2,28);pcm.writeUInt16LE(2,32);pcm.writeUInt16LE(16,34);pcm.write('data',36);pcm.writeUInt32LE(n*2,40);
for(let frame=0;frame<FPS*DURATION;frame++){
 let power=0;const start=Math.floor(frame*rate/FPS),end=Math.floor((frame+1)*rate/FPS);
 for(let i=start;i<end;i++){const x=pcm.readInt16LE(44+i*2)/32768;power+=x*x;}
 const elapsed=frame%30, snareElapsed=(frame-15+60)%60;
 const kick=elapsed===0?1:elapsed===1?.72:elapsed===2?.35:0;
 const snare=snareElapsed===0?1:snareElapsed===1?.72:snareElapsed===2?.35:0;
 samples.push({rms:Number(Math.min(1,Math.sqrt(power/Math.max(1,end-start))*1.8).toFixed(5)),kick,snare,rhythm:Math.max(kick,snare)});
}
fs.mkdirSync(path.join(base,'fixtures'),{recursive:true});
fs.writeFileSync(path.join(base,'fixtures/benchmark-12s.wav'),pcm);
fs.writeFileSync(path.join(base,'fixtures/envelope-60fps.json'),JSON.stringify({schema:'kf-audio-envelope/v1',sampleRate:rate,fps:FPS,durationSeconds:DURATION,annotationMethod:'authored onsets in tools/build-fixture.mjs',kickFrames:kickStarts,snareFrames:snareStarts,samples},null,0)+'\n');
console.log(`Generated ${samples.length} frames, ${pcm.length} WAV bytes, seedless deterministic synthesis`);
