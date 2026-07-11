import { describe, expect, it, vi } from "vitest";

import { createCli, runNonInteractive } from "./index.js";

describe("CLI", () => {
  it("requires confirmation in non-interactive mode", async () => {
    const generate = vi.fn(async () => undefined);
    await expect(
      runNonInteractive({ eslint: true, git: true, prettier: true }, generate),
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
});
