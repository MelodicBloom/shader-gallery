import { cp, mkdir } from "node:fs/promises";
await mkdir(new URL("../dist/astro", import.meta.url), { recursive: true });
await cp(new URL("../adapters/astro/FilterDefinitions.astro", import.meta.url), new URL("../dist/astro/FilterDefinitions.astro", import.meta.url));
await cp(new URL("../schema", import.meta.url), new URL("../dist/schema", import.meta.url), { recursive: true });
await cp(new URL("../recipes", import.meta.url), new URL("../dist/recipes", import.meta.url), { recursive: true });
