import type { FeatureConfigurationChange } from "@astro-stack/features";
import { describe, expect, it } from "vitest";

import { applyConfigurationChanges } from "./configuration.js";
import type { ProjectTemplate } from "./templates.js";

const templates: readonly ProjectTemplate[] = [
  {
    destination: "package.json",
    content:
      '{"scripts":{"dev":"astro dev"},"devDependencies":{"astro":"^7.0.7"}}\n',
  },
  {
    destination: "tsconfig.json",
    content:
      '{"extends":"astro/tsconfigs/base","compilerOptions":{"strict":true}}\n',
  },
  {
    destination: "astro.config.mjs",
    content:
      "import { defineConfig } from 'astro/config';\n\nexport default defineConfig({});\n",
  },
];

const changes: readonly FeatureConfigurationChange[] = [
  {
    file: "package.json",
    path: "scripts.check",
    value: "biome check .",
  },
  {
    file: "package.json",
    path: "devDependencies.@biomejs/biome",
    value: "2.5.3",
  },
  {
    file: "tsconfig.json",
    path: "compilerOptions.noUnusedLocals",
    value: true,
  },
  {
    file: "astro.config.mjs",
    path: "output",
    value: "server",
  },
  {
    file: "astro.config.mjs",
    path: "vite.build.sourcemap",
    value: true,
  },
];

describe("applyConfigurationChanges", () => {
  it("merges JSON, TypeScript, and Astro configuration without losing siblings", () => {
    const merged = applyConfigurationChanges(templates, changes);
    const file = (destination: string) => {
      const template = merged.find(
        (candidate) => candidate.destination === destination,
      );
      if (!template) throw new Error(`Missing template: ${destination}`);
      return template.content;
    };

    expect(JSON.parse(file("package.json"))).toEqual({
      scripts: { dev: "astro dev", check: "biome check ." },
      devDependencies: { astro: "^7.0.7", "@biomejs/biome": "2.5.3" },
    });
    expect(JSON.parse(file("tsconfig.json"))).toEqual({
      extends: "astro/tsconfigs/base",
      compilerOptions: { strict: true, noUnusedLocals: true },
    });
    expect(file("astro.config.mjs")).toContain(
      'export default defineConfig({\n  "output": "server",\n  "vite": {\n    "build": {\n      "sourcemap": true\n    }\n  }\n});',
    );
  });

  it("rejects configuration changes for files that are not generated", () => {
    expect(() =>
      applyConfigurationChanges(templates, [
        { file: "missing.json", path: "enabled", value: true },
      ]),
    ).toThrow("Configuration target is not generated: missing.json");
  });
});
