import { describe, expect, it, vi } from "vitest";

import { createCli, runNonInteractive } from "./index.js";
import { configurationFrom } from "./options.js";

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
});
