import { describe, expect, it } from "vitest";

import {
  defaultProjectConfiguration,
  editorTargetsConflict,
  mergeProjectConfiguration,
  serverRuntimeFormsConflict,
  summarizeProjectConfiguration,
  validateProjectConfiguration,
} from "./configuration.js";

describe("conflict helpers", () => {
  it("flags VS Code and Cursor only when both are selected", () => {
    expect(editorTargetsConflict(["vscode", "cursor"])).toMatchObject({
      code: "incompatible-editor-targets",
      path: "developerExperience.editors",
    });
    expect(editorTargetsConflict(["vscode", "zed"])).toBeUndefined();
  });

  it("flags server-runtime forms only on a static target", () => {
    expect(serverRuntimeFormsConflict("resend", "static")).toMatchObject({
      code: "resend-requires-server-runtime",
    });
    expect(serverRuntimeFormsConflict("webhooks", "static")).toMatchObject({
      code: "webhooks-require-server-runtime",
    });
    expect(serverRuntimeFormsConflict("resend", "vercel")).toBeUndefined();
    expect(serverRuntimeFormsConflict("none", "static")).toBeUndefined();
  });

  it("keeps the validator and helper copy in sync", () => {
    const configuration = mergeProjectConfiguration({
      features: { forms: "resend" },
      deployment: { target: "static" },
    });

    const conflict = serverRuntimeFormsConflict("resend", "static");
    const reported = validateProjectConfiguration(configuration).errors.find(
      (error) => error.code === "resend-requires-server-runtime",
    );

    expect(reported?.message).toBe(conflict?.message);
    expect(reported?.suggestion).toBe(conflict?.suggestion);
  });
});

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

  it("copies developer-experience selections instead of retaining caller arrays", () => {
    const agents = ["codex"] as const;
    const editors = ["zed"] as const;
    const configuration = mergeProjectConfiguration({
      developerExperience: { agents: [...agents], editors: [...editors] },
    });

    expect(configuration.developerExperience.agents).toEqual(agents);
    expect(configuration.developerExperience.editors).toEqual(editors);
    expect(configuration.developerExperience.agents).not.toBe(agents);
    expect(configuration.developerExperience.editors).not.toBe(editors);
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

  it("rejects webhook forwarding with static output", () => {
    const result = validateProjectConfiguration(
      mergeProjectConfiguration({ features: { forms: "webhooks" } }),
    );

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "webhooks-require-server-runtime" }),
      ]),
    );
  });

  it("rejects unknown, duplicate, and incompatible developer-experience selections", () => {
    const result = validateProjectConfiguration(
      mergeProjectConfiguration({
        developerExperience: {
          agents: ["codex", "codex", "unknown"] as never,
          editors: ["vscode", "cursor", "unknown"] as never,
        },
      }),
    );

    expect(result.errors.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        "duplicate-agent-target",
        "invalid-agent-target",
        "invalid-editor-target",
        "incompatible-editor-targets",
      ]),
    );
  });

  it("requires Git when pre-commit hooks are selected", () => {
    const result = validateProjectConfiguration(
      mergeProjectConfiguration({
        project: { initializeGit: false },
        developerExperience: { hooks: true },
      }),
    );

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "hooks-require-git" }),
      ]),
    );
  });

  it.each([
    ["codex", "vscode"],
    ["claude", "cursor"],
    ["codex", "zed"],
  ] as const)("accepts the supported %s and %s targets", (agent, editor) => {
    const result = validateProjectConfiguration(
      mergeProjectConfiguration({
        developerExperience: { agents: [agent], editors: [editor] },
      }),
    );

    expect(result.errors).toEqual([]);
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
