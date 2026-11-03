import {FPS,clamp} from './control.js';
/** Analyze mono/stereo PCM once; sampling the returned envelope never depends on render frame rate. */
export function analyzeBuffer(buffer){
 const length=Math.max(1,Math.floor(buffer.duration*FPS));
 const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
 const fs=buffer.sampleRate,lowAlpha=1-Math.exp(-2*Math.PI*155/fs);
 let low=0,prevLow=0,prevBass=0,prevMid=0,lastKick=-100,lastSnare=-100;
 const frames=[];
 for(let f=0;f<length;f++){
  const start=Math.floor(f*fs/FPS),end=Math.min(buffer.length,Math.floor((f+1)*fs/FPS));
  let energy=0,bass=0,mid=0;
  for(let i=start;i<end;i++){
   let x=0;for(const ch of channels)x+=ch[i]||0;x/=channels.length;
   low+=lowAlpha*(x-low);let m=x-low;energy+=x*x;bass+=low*low;mid+=m*m;
  }
  const n=Math.max(1,end-start),rms=clamp(Math.sqrt(energy/n)*1.8,0,1);
  const b=Math.sqrt(bass/n),m=Math.sqrt(mid/n);
  const recent=frames.slice(-18);const meanBass=recent.reduce((a,z)=>a+z._bass,0)/Math.max(1,recent.length);
  const meanMid=recent.reduce((a,z)=>a+z._mid,0)/Math.max(1,recent.length);
  const kick=b>0.055&&b>meanBass*1.6&&b>prevBass*1.18&&(f-lastKick)>10?1:0;
  const snare=m>0.04&&m>meanMid*1.7&&m>prevMid*1.13&&(f-lastSnare)>9?1:0;
  if(kick)lastKick=f;if(snare)lastSnare=f;
  frames.push({rms,kick,snare,rhythm:Math.max(kick,snare),_bass:b,_mid:m});
  prevBass=b;prevMid=m;prevLow=low;
 }
 // Smooth audio events across 3 frames to avoid single-frame flashes.
 return frames.map((a,i)=>({rms:+a.rms.toFixed(5),kick:Math.max(a.kick,(frames[i-1]?.kick||0)*.72,(frames[i-2]?.kick||0)*.35),snare:Math.max(a.snare,(frames[i-1]?.snare||0)*.72,(frames[i-2]?.snare||0)*.35),rhythm:a.rhythm}));
}
export async function audioEnvelopeFromFile(file){
 const ctx=new (window.AudioContext||window.webkitAudioContext)();
 try {const buf=await ctx.decodeAudioData(await file.arrayBuffer());return analyzeBuffer(buf);}finally{await ctx.close();}
}
export function isEnvelopeValid(x){return Array.isArray(x)&&x.length>0&&x.length<=FPS*60*60&&x.every(s=>['rms','kick','snare','rhythm'].every(k=>Number.isFinite(s[k])&&s[k]>=0&&s[k]<=1));}
