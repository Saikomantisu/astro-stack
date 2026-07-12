import { mergeProjectConfiguration } from "@astro-stack/utils";
import { describe, expect, it, vi } from "vitest";

const clack = vi.hoisted(() => ({
  log: { step: vi.fn(), success: vi.fn(), warn: vi.fn(), error: vi.fn() },
  note: vi.fn(),
  outro: vi.fn(),
}));
vi.mock("@clack/prompts", () => clack);

import { generateProject } from "./generation.js";

describe("generateProject", () => {
  it("reports success and never touches the generator for invalid input", async () => {
    const generate = vi.fn(async () => undefined);
    const code = await generateProject(
      mergeProjectConfiguration({ project: { name: "Not Valid" } }),
      generate,
    );
    expect(code).toBe(2);
    expect(generate).not.toHaveBeenCalled();
  });

  it("keeps the project and shows a recovery step when install fails", async () => {
    clack.note.mockClear();
    const generate = vi.fn(async () => ({
      dependenciesInstalled: false,
      installError: new Error("network unavailable"),
    }));
    const code = await generateProject(
      mergeProjectConfiguration({ project: { packageManager: "npm" } }),
      generate,
    );
    expect(code).toBe(0);
    expect(clack.log.warn).toHaveBeenCalledWith(
      expect.stringContaining("network unavailable"),
    );
    const card = clack.note.mock.calls.at(-1)?.[0] as string;
    expect(card).toContain("npm install");
  });

  it("omits the install step when dependencies are installed", async () => {
    clack.note.mockClear();
    const generate = vi.fn(async () => ({ dependenciesInstalled: true }));
    const code = await generateProject(mergeProjectConfiguration(), generate);
    expect(code).toBe(0);
    const card = clack.note.mock.calls.at(-1)?.[0] as string;
    expect(card).not.toContain("install");
  });
});
