import assert from "node:assert/strict";
import { ensureNativeValidator } from "./native-runner.mjs";

function withEnvironment(overrides, callback) {
  const previous = new Map(Object.keys(overrides).map((key) => [key, process.env[key]]));
  try {
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    callback();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

withEnvironment({ NATIVE_VALIDATOR_LIBRARY_MODE: undefined, CHROMIUM_LIB_DIR: undefined }, () => {
  const validator = ensureNativeValidator();
  assert.match(validator.binary, /melodicbloom-glsl-smoke-system$/);
  assert.equal(validator.mode, "system");
});

withEnvironment({ NATIVE_VALIDATOR_LIBRARY_MODE: "not-a-mode" }, () => {
  assert.throws(() => ensureNativeValidator(), /Unsupported NATIVE_VALIDATOR_LIBRARY_MODE/);
});

withEnvironment({ NATIVE_VALIDATOR_LIBRARY_MODE: "chromium", CHROMIUM_LIB_DIR: "/definitely-missing-chromium-libraries" }, () => {
  assert.throws(() => ensureNativeValidator(), /requires libEGL\.so and libGLESv2\.so/);
});

console.log("✓ native validator defaults to system libraries and reports invalid/absent Chromium modes clearly");
