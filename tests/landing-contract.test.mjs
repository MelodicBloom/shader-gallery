import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const readme=readFileSync(new URL('../README.md',import.meta.url),'utf8');

test('landing records planned trials without claiming a visual pass',()=>{
  assert.match(html,/MVT-ABALONE-001 is planned/i);
  assert.doesNotMatch(html,/MVT-ABALONE-001 is open \/ inconclusive/i);
  assert.doesNotMatch(html,/Each linked page returns HTTP 200/i);
});

test('landing supplies the four project-relative demo links',()=>{
  for(const path of ['docs/','library-v1/','abalone/','aurora/']) assert.ok(html.includes(`href="${path}"`),path);
  assert.match(readme,/Demo evidence and verification status/);
});

test('call-to-action foreground is readable in both normal and hover states',()=>{
  const luminance=hex=>{const rgb=hex.match(/\w\w/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]};
  const normal=html.match(/\.cta\{[^}]*background:#([0-9a-f]{6})/i)?.[1];
  const hover=html.match(/\.cta:hover\{background:#([0-9a-f]{6})/i)?.[1];
  assert.ok(normal && hover);
  for(const color of [normal,hover]) assert.ok(1.05/(luminance(color)+.05)>=4.5,`contrast for #${color}`);
});

test('browser requirement distinguishes live library from WebGL 1 studies',()=>{
  assert.match(html,/Live Shader Library v1 previews require WebGL2/i);
  assert.match(html,/Gallery, Abalone, and Aurora request WebGL 1/i);
  assert.doesNotMatch(html,/Needs a browser with WebGL2/i);
});
