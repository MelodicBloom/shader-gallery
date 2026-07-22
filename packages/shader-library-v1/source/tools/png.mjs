import zlib from "node:zlib";

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n=0;n<256;n+=1) {
    let c=n;
    for (let k=0;k<8;k+=1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c=0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type,data) {
  const typeBuffer=Buffer.from(type);
  const length=Buffer.alloc(4); length.writeUInt32BE(data.length);
  const crc=Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer,data])));
  return Buffer.concat([length,typeBuffer,data,crc]);
}

export function rgbaToPng(rgba,width,height,{ flipY=true }={}) {
  const stride=width*4;
  const scanlines=Buffer.alloc((stride+1)*height);
  for (let y=0;y<height;y+=1) {
    const sourceY=flipY ? height-1-y : y;
    const targetOffset=y*(stride+1);
    scanlines[targetOffset]=0;
    rgba.copy(scanlines,targetOffset+1,sourceY*stride,sourceY*stride+stride);
  }
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(width,0); ihdr.writeUInt32BE(height,4);
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ihdr),chunk("IDAT",zlib.deflateSync(scanlines,{level:9})),chunk("IEND",Buffer.alloc(0))]);
}
