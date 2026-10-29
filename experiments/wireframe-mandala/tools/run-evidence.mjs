#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { normalize, generate, fingerprint, SOURCE_ID } from '../core.mjs';
const argv=process.argv.slice(2);
const get=(flag,fallback)=>{const i=argv.indexOf(flag);return i<0?fallback:argv[i+1]};
const preset=get('--preset',new URL('../presets/starting-preset.json',import.meta.url).pathname);
const time=Number(get('--time','0'));
if(!Number.isFinite(time)||time<0||time>86400)throw new RangeError('--time must be a finite number between 0 and 86400');
const params=normalize(JSON.parse(await readFile(preset,'utf8')));
const segments=generate(params,time).segments;
const result={schema:'wireframe-mandala-receipt/v1',sourceVideo:`https://youtube.com/watch?v=${SOURCE_ID}`,renderer:'geometry-only',params,frameTimeSeconds:time,segmentCount:segments.length,geometryFingerprint:fingerprint(segments),performanceClaim:'none',verifiedAt:new Date().toISOString()};
const target=get('--out',null);
if(target){await mkdir(dirname(resolve(target)),{recursive:true});await writeFile(target,JSON.stringify(result,null,2)+'\n');console.log(`Wrote ${target}`)}
else console.log(JSON.stringify(result,null,2));
