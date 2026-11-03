import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const server=spawn(process.execPath,['tools/serve.mjs'],{env:{...process.env,PORT:'4189'},stdio:['ignore','pipe','pipe']});
try {
  await Promise.race([once(server.stdout,'data'),once(server,'exit').then(([code])=>{throw new Error(`Server exited ${code}`)})]);
  for(const pathname of ['/docs/','/src/']) {
    const response=await fetch(`http://127.0.0.1:4189${pathname}`);
    assert.equal(response.status,404,pathname);
  }
  const response=await fetch('http://127.0.0.1:4189/');
  assert.equal(response.status,200);
  assert.match(await response.text(),/<!doctype html>/i);
  console.log('PASS: missing directory index returns 404 without stopping the server');
} finally { server.kill(); }
