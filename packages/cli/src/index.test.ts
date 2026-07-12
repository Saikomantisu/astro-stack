import { stripVTControlCharacters } from "node:util";

import { describe, expect, it, vi } from "vitest";

import {
  createCli,
  type InteractivePrompts,
  runInteractive,
  runNonInteractive,
} from "./index.js";
import { configurationFrom } from "./options.js";

function interactivePrompts(
  textValues: string[],
  selections: string[],
  tooling = ["eslint", "prettier", "biome"],
): InteractivePrompts {
  let multiselectCount = 0;
  return {
    intro: vi.fn(),
    text: vi.fn(async () => textValues.shift() as string),
    select: vi.fn(async () => selections.shift() as never),
    multiselect: vi.fn(async () => {
      multiselectCount += 1;
      return (multiselectCount === 3 ? tooling : []) as never;
    }),
    note: vi.fn(),
    cancel: vi.fn(),
  };
}

describe("CLI", () => {
  it("requires confirmation in non-interactive mode", async () => {
    const generate = vi.fn(async () => undefined);
    await expect(
      runNonInteractive(
        { biome: true, eslint: true, git: true, prettier: true },
        generate,
      ),
    ).resolves.toBe(2);
    expect(generate).not.toHaveBeenCalled();
  });

  it("uses Commander to reject unsupported selections", () => {
    const cli = createCli();
    cli.exitOverride();
    expect(() =>
      cli.parse(["node", "astro-stack", "--type", "unsupported"]),
    ).toThrow();
  });

  it("maps the Biome option into the generated-project configuration", () => {
    expect(
      configurationFrom({
        biome: false,
        eslint: true,
        git: true,
        prettier: true,
      }),
    ).toMatchObject({ styling: { biome: false } });
  });

  it("collects repeatable agent and editor options", () => {
    expect(
      configurationFrom({
        agent: ["codex", "claude"],
        editor: ["vscode"],
        biome: true,
        eslint: true,
        git: true,
        prettier: true,
      }),
    ).toMatchObject({
      developerExperience: { agents: ["codex", "claude"], editors: ["vscode"] },
    });
  });

  it("keeps the project name empty until valid input is supplied", async () => {
    const prompts = interactivePrompts(
      ["./launch-site"],
      [
        "marketing",
        "pnpm",
        "tailwind",
        "strict",
        "mdx",
        "none",
        "vercel",
        "launch",
      ],
      ["eslint", "prettier"],
    );
    const generate = vi.fn(async () => undefined);
    vi.mocked(prompts.text).mockImplementationOnce(async (options) => {
      expect(options.validate?.("")).toBe(
        "Enter lowercase letters, numbers, and hyphens.",
      );
      return "launch-site";
    });

    await expect(runInteractive(generate, prompts)).resolves.toBe(0);

    const namePrompt = vi.mocked(prompts.text).mock.calls[0]?.[0];
    const directoryPrompt = vi.mocked(prompts.text).mock.calls[1]?.[0];
    expect(namePrompt?.placeholder).toBe("my-astro-project");
    expect(namePrompt?.validate?.("launch-site")).toBeUndefined();
    expect(directoryPrompt?.initialValue).toBe("./launch-site");
    const agentPrompt = vi.mocked(prompts.multiselect).mock.calls[0]?.[0];
    const editorPrompt = vi.mocked(prompts.multiselect).mock.calls[1]?.[0];
    expect(agentPrompt?.required).toBe(false);
    expect(editorPrompt?.required).toBe(false);
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        project: expect.objectContaining({ name: "launch-site" }),
        developerExperience: { agents: [], editors: [], hooks: false },
      }),
    );
  });

  it("cancels from the final review without generating files", async () => {
    const prompts = interactivePrompts(
      ["launch-site", "./launch-site"],
      [
        "blank",
        "pnpm",
        "vanilla",
        "strict",
        "none",
        "none",
        "static",
        "cancel",
      ],
    );
    const generate = vi.fn(async () => undefined);

    await expect(runInteractive(generate, prompts)).resolves.toBe(0);

    expect(generate).not.toHaveBeenCalled();
    expect(prompts.cancel).toHaveBeenCalledWith(
      "Launch cancelled. No files were written.",
    );
  });

  it("shows an accurate final summary for the selected configuration", async () => {
    const prompts = interactivePrompts(
      ["docs-site", "./apps/docs-site"],
      [
        "documentation",
        "bun",
        "tailwind",
        "relaxed",
        "collections",
        "webhooks",
        "cloudflare",
        "launch",
      ],
      ["biome"],
    );

    await expect(runInteractive(async () => undefined, prompts)).resolves.toBe(
      0,
    );

    const summary = vi.mocked(prompts.note).mock.calls[0]?.[0];
    expect(stripVTControlCharacters(summary ?? "")).toBe(
      [
        "project: docs-site",
        "location: ./apps/docs-site",
        "projectType: documentation",
        "packageManager: bun",
        "styling: tailwind; TypeScript (relaxed), Biome",
        "content: collections",
        "forms: webhooks",
        "deployment: cloudflare",
        "agents: none",
        "editors: none",
      ].join("\n"),
    );
    expect(prompts.note).toHaveBeenCalledWith(
      expect.any(String),
      "Flight plan",
    );
  });
});
