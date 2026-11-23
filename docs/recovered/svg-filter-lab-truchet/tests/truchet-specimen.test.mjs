import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root));
const receipt=JSON.parse(read('examples/truchet-seed35.receipt.json').toString('utf8'));
test('asset hash matches Seed Loom verified receipt',()=>{
  const asset=read('examples/truchet-seed35.svg');
  assert.equal(asset.length,13993);
  assert.equal(asset.length,receipt.outputBytes);
  assert.equal(crypto.createHash('sha256').update(asset).digest('hex'),receipt.outputSha256);
  assert.equal(receipt.outputSha256,'657805983bfdf69d1884674d035e201960cecccb1f80653f324bff07aad7913d');
});
test('receipt is pinned, original and not native-verified',()=>{
  assert.match(receipt.producerCommit,/^[a-f0-9]{40}$/);
  assert.equal(receipt.inputContract,'pattern.truchet');
  assert.equal(receipt.verification.nativeNotchVerified,false);
  assert.equal(receipt.fidelity,'original-approximation-not-notch-parity');
});
test('demo and index link to locally published specimen',()=>{
  assert.match(read('demos/truchet-seed35.html').toString('utf8'),/src="\.\.\/examples\/truchet-seed35\.svg"/);
  assert.match(read('index.html').toString('utf8'),/href="demos\/truchet-seed35\.html"/);
});
