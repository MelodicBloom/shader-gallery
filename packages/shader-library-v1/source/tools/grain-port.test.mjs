import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { DEFAULT_PARAMETERS, parameters, svgMarkup } from "../ports/grain/contract.mjs";

test("both backends share bounded numeric controls; invalid input is rejected", () => {
  assert.deepEqual(parameters(), DEFAULT_PARAMETERS);
  for (const input of [null, [], { strength: NaN }, { strength: Infinity }, { strength: -0.1 }, { strength: 1.1 }, { frequency: 0 }, { frequency: 0.51 }, { seed: -1 }, { seed: 65536 }, { seed: 1.5 }, { octaves: 0 }, { octaves: 6 }, { octaves: 2.5 }, { seed: "7" }, { unexpected: 1 }, { constructor: 1 }]) {
    assert.throws(() => parameters(input));
  }
  assert.equal(parameters({ strength: 0, frequency: 0.01, seed: 0, octaves: 1 }).strength, 0);
  assert.equal(parameters({ strength: 1, frequency: 0.5, seed: 65535, octaves: 5 }).seed, 65535);
});

test("SVG fixture generation is deterministic with an explicit zero-strength bypass", () => {
  assert.equal(svgMarkup(DEFAULT_PARAMETERS), svgMarkup(DEFAULT_PARAMETERS));
  assert.match(svgMarkup({ seed: 65535 }), /seed="65535"/);
  assert.doesNotMatch(svgMarkup({ strength: 0 }), / filter="url/);
  assert.match(svgMarkup({ strength: 0.65 }), / filter="url/);
});

test("preserved fixture and exact upstream filter excerpt match the source receipt", () => {
  const receipt = JSON.parse(readFileSync(new URL("../ports/grain/provenance.json", import.meta.url)));
  const fixture = readFileSync(new URL("../ports/grain/reference/rough-paper.svg", import.meta.url));
  const sha = bytes => createHash("sha256").update(bytes).digest("hex");
  assert.equal(sha(fixture), receipt.preservedFixture.sha256);
  const excerpt = fixture.toString().match(/<filter id="roughPaper">.*?<\/filter>/)[0];
  assert.equal(sha(excerpt), receipt.source.filterExcerptSha256);
  assert.equal(receipt.source.commit, "1d58b4a178d74f30d1f83699d1043eab8306455d");
});
