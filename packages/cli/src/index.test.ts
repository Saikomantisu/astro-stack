import { readFileSync } from "node:fs";
import { mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";

import { describe, expect, it, vi } from "vitest";

import {
  createCli,
  type InteractivePrompts,
  isDirectExecution,
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
  it("reports the installed package version", () => {
    const packageManifest = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    ) as { version: string };

    expect(createCli().version()).toBe(packageManifest.version);
  });

  it("runs when npm invokes its bin through a symlink", async () => {
    const directory = await mkdtemp(join(tmpdir(), "astro-stack-cli-"));
    const binPath = join(directory, "astro-stack");

    try {
      await symlink(fileURLToPath(import.meta.url), binPath);
      expect(isDirectExecution(import.meta.url, binPath)).toBe(true);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

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

  it("does not accept the retired saas-landing project type", () => {
    const cli = createCli();
    cli.exitOverride();
    expect(() =>
      cli.parse(["node", "astro-stack", "--type", "saas-landing"]),
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
        "no",
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

  it("re-asks for editors immediately when VS Code and Cursor conflict", async () => {
    const editorSelections = [["vscode", "cursor"], ["vscode"]];
    const textValues = ["launch-site", "./launch-site"];
    const selectValues = [
      "blank",
      "pnpm",
      "no",
      "vanilla",
      "strict",
      "none",
      "none",
      "static",
      "launch",
    ];
    let multiselectCount = 0;
    const prompts: InteractivePrompts = {
      intro: vi.fn(),
      text: vi.fn(async () => textValues.shift() as string),
      select: vi.fn(async () => selectValues.shift() as never),
      multiselect: vi.fn(async () => {
        multiselectCount += 1;
        if (multiselectCount === 1) return [] as never; // agents
        if (multiselectCount === 2) return editorSelections[0] as never;
        if (multiselectCount === 3) return editorSelections[1] as never;
        return ["eslint", "prettier", "biome"] as never; // tooling
      }),
      note: vi.fn(),
      cancel: vi.fn(),
    };
    const generate = vi.fn(async () => undefined);

    await expect(runInteractive(generate, prompts)).resolves.toBe(0);

    expect(prompts.note).toHaveBeenCalledWith(
      expect.stringContaining(".vscode workspace configuration"),
      "Incompatible editors",
    );
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        developerExperience: expect.objectContaining({ editors: ["vscode"] }),
      }),
    );
  });

  it("re-asks for a deployment target when forms need a server runtime", async () => {
    const textValues = ["launch-site", "./launch-site"];
    const selectValues = [
      "blank",
      "pnpm",
      "no",
      "vanilla",
      "strict",
      "none",
      "resend",
      "static", // rejected: Resend needs a server runtime
      "vercel",
      "launch",
    ];
    const prompts: InteractivePrompts = {
      intro: vi.fn(),
      text: vi.fn(async () => textValues.shift() as string),
      select: vi.fn(async () => selectValues.shift() as never),
      multiselect: vi.fn(async () => [] as never),
      note: vi.fn(),
      cancel: vi.fn(),
    };
    const generate = vi.fn(async () => undefined);

    await expect(runInteractive(generate, prompts)).resolves.toBe(0);

    expect(prompts.note).toHaveBeenCalledWith(
      expect.stringContaining("server-capable deployment target"),
      "Incompatible deployment target",
    );
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        deployment: expect.objectContaining({ target: "vercel" }),
      }),
    );
  });

  it("cancels from the final review without generating files", async () => {
    const prompts = interactivePrompts(
      ["launch-site", "./launch-site"],
      [
        "blank",
        "pnpm",
        "no",
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
        "no",
        "tailwind",
        "relaxed",
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
        "content: built-in docs collection",
        "forms: webhooks",
        "deployment: cloudflare",
        "agents: none",
        "editors: none",
        "hooks: none",
      ].join("\n"),
    );
    expect(prompts.note).toHaveBeenCalledWith(
      expect.any(String),
      "Flight plan",
    );
  });

  it("maps --hooks into the generated-project configuration", () => {
    expect(
      configurationFrom({
        biome: true,
        eslint: true,
        git: true,
        hooks: true,
        prettier: true,
      }),
    ).toMatchObject({ developerExperience: { hooks: true } });
  });
});
