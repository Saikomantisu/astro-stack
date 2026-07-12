import { mergeProjectConfiguration } from "@astro-stack/utils";
import { describe, expect, it, vi } from "vitest";

import { finishProject, installDependencies } from "./installer.js";

describe("project finishing", () => {
  it.each([
    ["npm", { command: "npm", arguments: ["install"] }],
    ["pnpm", { command: "pnpm", arguments: ["install"] }],
    ["yarn", { command: "yarn", arguments: ["install"] }],
    ["bun", { command: "bun", arguments: ["install"] }],
  ] as const)("installs dependencies with %s", async (packageManager, command) => {
    const runner = vi.fn(async () => undefined);
    await installDependencies(
      mergeProjectConfiguration({ project: { packageManager } }),
      "/project",
      runner,
    );
    expect(runner).toHaveBeenCalledWith(command, "/project");
  });

  it("initializes Git after dependencies when selected", async () => {
    const runner = vi.fn(async () => undefined);
    await finishProject(
      mergeProjectConfiguration({ project: { initializeGit: true } }),
      "/project",
      runner,
    );
    expect(runner.mock.calls).toEqual([
      [{ command: "pnpm", arguments: ["install"] }, "/project"],
      [{ command: "git", arguments: ["init"] }, "/project"],
    ]);
  });

  it("does not run Git when it is disabled", async () => {
    const runner = vi.fn(async () => undefined);
    await finishProject(
      mergeProjectConfiguration({ project: { initializeGit: false } }),
      "/project",
      runner,
    );
    expect(runner).toHaveBeenCalledTimes(1);
  });

  it("reports the failed installation command", async () => {
    await expect(
      installDependencies(mergeProjectConfiguration(), "/project", async () => {
        throw new Error("network unavailable");
      }),
    ).rejects.toMatchObject({
      name: "InstallationError",
      command: { command: "pnpm", arguments: ["install"] },
    });
  });
});
