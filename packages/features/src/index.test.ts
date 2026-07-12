import {
  mergeProjectConfiguration,
  type ProjectConfigurationInput,
} from "@astro-stack/utils";
import { describe, expect, it } from "vitest";

import { type FeatureDefinition, resolveFeatures } from "./index.js";

describe("resolveFeatures", () => {
  const selectionCases: readonly [string, ProjectConfigurationInput][] = [
    ["styling:vanilla", { styling: { css: "vanilla" } }],
    ["styling:tailwind", { styling: { css: "tailwind" } }],
    ["typescript:strict", { styling: { typescript: "strict" } }],
    ["typescript:relaxed", { styling: { typescript: "relaxed" } }],
    ["tooling:eslint", { styling: { eslint: true } }],
    ["tooling:prettier", { styling: { prettier: true } }],
    ["tooling:biome", { styling: { biome: true } }],
    ["content:none", { content: { setup: "none" } }],
    ["content:markdown", { content: { setup: "markdown" } }],
    ["content:mdx", { content: { setup: "mdx" } }],
    ["content:collections", { content: { setup: "collections" } }],
    ["forms:none", { features: { forms: "none" } }],
    [
      "forms:resend",
      { features: { forms: "resend" }, deployment: { target: "vercel" } },
    ],
    ["forms:webhooks", { features: { forms: "webhooks" } }],
    ["deployment:static", { deployment: { target: "static" } }],
    ["deployment:vercel", { deployment: { target: "vercel" } }],
    ["deployment:netlify", { deployment: { target: "netlify" } }],
    ["deployment:cloudflare", { deployment: { target: "cloudflare" } }],
  ];

  it.each(
    selectionCases,
  )("resolves the supported %s selection", (id, input) => {
    expect(resolveFeatures(mergeProjectConfiguration(input)).features).toEqual(
      expect.arrayContaining([expect.objectContaining({ id })]),
    );
  });

  it("resolves every supported selection into a stable feature plan", () => {
    const configuration = mergeProjectConfiguration({
      styling: {
        css: "tailwind",
        typescript: "relaxed",
        eslint: false,
        prettier: true,
        biome: true,
      },
      content: { setup: "mdx" },
      features: { forms: "webhooks" },
      deployment: { target: "cloudflare" },
    });

    const resolution = resolveFeatures(configuration);

    expect(resolution.valid).toBe(true);
    expect(resolution.features.map(({ id }) => id)).toEqual([
      "content:mdx",
      "deployment:cloudflare",
      "forms:webhooks",
      "styling:tailwind",
      "tooling:biome",
      "tooling:prettier",
      "typescript:relaxed",
    ]);
  });

  it("runs selected feature validation", () => {
    const resolution = resolveFeatures(
      mergeProjectConfiguration({ features: { forms: "resend" } }),
    );

    expect(resolution).toMatchObject({ valid: false });
    expect(resolution.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "resend-requires-server-runtime" }),
      ]),
    );
  });

  it("detects file, configuration, and dependency conflicts before generation", () => {
    const alwaysSelected = () => true;
    const registry: readonly FeatureDefinition[] = [
      {
        id: "first",
        isSelected: alwaysSelected,
        templates: [{ source: "a", destination: "src/page.astro" }],
        configurationChanges: [
          { file: "astro.config.mjs", path: "output", value: "static" },
        ],
        dependencies: [{ name: "astro", version: "5.0.0", type: "dependency" }],
      },
      {
        id: "second",
        isSelected: alwaysSelected,
        templates: [{ source: "b", destination: "src/page.astro" }],
        configurationChanges: [
          { file: "astro.config.mjs", path: "output", value: "server" },
        ],
        dependencies: [{ name: "astro", version: "4.0.0", type: "dependency" }],
      },
    ];

    const resolution = resolveFeatures(mergeProjectConfiguration(), registry);

    expect(resolution.valid).toBe(false);
    expect(
      resolution.conflicts.map(({ kind, target }) => [kind, target]),
    ).toEqual([
      ["file", "src/page.astro"],
      ["configuration", "astro.config.mjs:output"],
      ["dependency", "astro"],
    ]);
  });
});
