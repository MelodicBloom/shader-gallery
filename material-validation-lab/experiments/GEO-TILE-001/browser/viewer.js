const $=id=>document.getElementById(id),view=$('view'),ctx=view.getContext('2d');
const cache=new Map();let generation=0;
async function image(url){
  if(!cache.has(url))cache.set(url,new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('Could not load '+url));i.src=url;}));
  return cache.get(url);
}
function pixels(img){const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);return g.getImageData(0,0,c.width,c.height).data;}
async function draw(){
  const token=++generation,preset=$('preset').value,map=$('map').value,root='generated/'+preset+'/';
  $('angle-value').value=$('angle').value+'°';$('angle').disabled=map!=='relight';$('receipt').href=root+'receipt.json';
  try{
    const r=await fetch(root+'receipt.json');if(!r.ok)throw Error('Generation receipt HTTP '+r.status);const receipt=await r.json();
    if(map!=='relight'){
      const img=await image(root+map);if(token!==generation)return;view.width=img.width;view.height=img.height;ctx.drawImage(img,0,0);$('semantics').textContent=receipt.map_semantics[map];
    }else{
      const imgs=await Promise.all(['base_color.png','normal_tangent_proxy.png','roughness.png','ambient_occlusion_proxy.png'].map(p=>image(root+p)));if(token!==generation)return;
      const [color,normal,rough,ao]=imgs.map(pixels);view.width=imgs[0].width;view.height=imgs[0].height;const out=ctx.createImageData(view.width,view.height),angle=Number($('angle').value)*Math.PI/180;
      for(let j=0;j<out.data.length;j+=4){
        const nx=normal[j]/127.5-1,ny=normal[j+1]/127.5-1,nz=normal[j+2]/127.5-1;
        const dot=Math.max(0,nx*Math.cos(angle)*0.57+ny*Math.sin(angle)*0.57+nz*0.82),light=0.18+0.75*dot,spec=Math.pow(dot,3+55*(1-rough[j]/255))*0.32;
        for(let c=0;c<3;c++)out.data[j+c]=Math.min(255,Math.round((color[j+c]/255*light*ao[j]/255+spec)*255));out.data[j+3]=255;
      }ctx.putImageData(out,0,0);$('semantics').textContent='CPU diagnostic relighting of the original normal, roughness, cavity and color maps. No physical-unit or material-validation claim.';
    }
    if(token===generation)$('status').textContent=receipt.algorithm+' · '+view.width+' × '+view.height+' · '+receipt.status;
  }catch(e){if(token===generation)$('status').textContent=e.message;}
}
$('preset').addEventListener('change',draw);$('map').addEventListener('change',draw);$('angle').addEventListener('input',draw);draw();
