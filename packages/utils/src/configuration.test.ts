import { describe, expect, it } from "vitest";

import {
  defaultProjectConfiguration,
  mergeProjectConfiguration,
  summarizeProjectConfiguration,
  validateProjectConfiguration,
} from "./configuration.js";

describe("mergeProjectConfiguration", () => {
  it("applies defaults to independently supplied wizard sections", () => {
    const configuration = mergeProjectConfiguration({
      project: { name: "launch-site", type: "marketing" },
      styling: { css: "tailwind", prettier: false },
      deployment: { target: "vercel" },
    });

    expect(configuration).toMatchObject({
      project: {
        name: "launch-site",
        type: "marketing",
        packageManager: "pnpm",
      },
      styling: { css: "tailwind", typescript: "strict", prettier: false },
      deployment: { target: "vercel" },
    });
    expect(configuration.project).not.toBe(defaultProjectConfiguration.project);
  });
});

describe("validateProjectConfiguration", () => {
  it("reports invalid selections and incompatible combinations as displayable errors", () => {
    const configuration = mergeProjectConfiguration({
      project: { name: "Invalid Name" },
      features: { forms: "resend" },
      deployment: { target: "static" },
    });

    const result = validateProjectConfiguration(configuration);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "invalid-project-name",
          path: "project.name",
        }),
        expect.objectContaining({
          code: "resend-requires-server-runtime",
          level: "error",
        }),
      ]),
    );
  });

  it("returns warnings without rejecting an otherwise valid configuration", () => {
    const configuration = mergeProjectConfiguration({
      styling: {
        typescript: "relaxed",
        eslint: false,
        prettier: false,
        biome: false,
      },
      project: { initializeGit: false },
    });

    const result = validateProjectConfiguration(configuration);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        "relaxed-typescript",
        "no-code-quality-tooling",
        "git-not-initialized",
      ]),
    );
  });
});

describe("summarizeProjectConfiguration", () => {
  it("creates a stable summary from the complete configuration", () => {
    const summary = summarizeProjectConfiguration(
      mergeProjectConfiguration({
        styling: { css: "tailwind" },
        content: { setup: "mdx" },
      }),
    );

    expect(summary).toMatchObject({
      project: "my-astro-project",
      styling: "tailwind; TypeScript (strict), ESLint, Prettier, Biome",
      content: "mdx",
    });
  });
});
