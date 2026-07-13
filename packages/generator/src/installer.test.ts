import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { mergeProjectConfiguration } from "@astro-stack/utils";
import { describe, expect, it, vi } from "vitest";

import { finishProject, installDependencies, runCommand } from "./installer.js";

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

  it("initializes Git before dependencies so a failed install keeps the repository", async () => {
    const runner = vi.fn(async () => undefined);
    const result = await finishProject(
      mergeProjectConfiguration({ project: { initializeGit: true } }),
      "/project",
      runner,
    );
    expect(runner.mock.calls).toEqual([
      [{ command: "git", arguments: ["init"] }, "/project"],
      [{ command: "pnpm", arguments: ["install"] }, "/project"],
    ]);
    expect(result).toEqual({ dependenciesInstalled: true });
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

  it.each(
    (["npm", "pnpm", "yarn", "bun"] as const).flatMap((packageManager) =>
      (
        [
          [false, false],
          [true, false],
          [true, true],
        ] as const
      ).map(([initializeGit, hooks]) => ({
        packageManager,
        initializeGit,
        hooks,
      })),
    ),
  )("finishes a $packageManager project with git=$initializeGit and hooks=$hooks", async ({
    packageManager,
    initializeGit,
    hooks,
  }) => {
    const directory = await mkdtemp(join(tmpdir(), "astro-stack-lifecycle-"));
    try {
      const runner = vi.fn(async (command) => {
        if (command.command === "git")
          await import("node:fs/promises").then(({ mkdir }) =>
            mkdir(join(directory, ".git", "hooks"), { recursive: true }),
          );
      });
      const configuration = mergeProjectConfiguration({
        project: { packageManager, initializeGit },
        developerExperience: { hooks },
        styling: { eslint: false, prettier: false, biome: false },
      });

      await expect(
        finishProject(configuration, directory, runner),
      ).resolves.toEqual({
        dependenciesInstalled: true,
      });
      expect(runner).toHaveBeenLastCalledWith(
        { command: packageManager, arguments: ["install"] },
        directory,
      );
      expect(
        runner.mock.calls.some(([command]) => command.command === "git"),
      ).toBe(initializeGit);
      const hook = join(directory, ".git", "hooks", "pre-commit");
      if (hooks)
        await expect(readFile(hook, "utf8")).resolves.toContain(
          packageManager === "npm"
            ? "npm run typecheck"
            : `${packageManager} typecheck`,
        );
      else await expect(access(hook)).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("reports a failed install without discarding the repository or hooks", async () => {
    const directory = await mkdtemp(join(tmpdir(), "astro-stack-hook-"));
    try {
      const runner = vi.fn(async (command) => {
        if (command.command === "git")
          await import("node:fs/promises").then(({ mkdir }) =>
            mkdir(join(directory, ".git", "hooks"), { recursive: true }),
          );
        else throw new Error("network unavailable");
      });
      const result = await finishProject(
        mergeProjectConfiguration({
          project: { initializeGit: true },
          developerExperience: { hooks: true },
        }),
        directory,
        runner,
      );
      expect(result.dependenciesInstalled).toBe(false);
      expect(result.installError?.name).toBe("InstallationError");
      // The hook still landed even though installation failed afterward.
      await expect(
        access(join(directory, ".git", "hooks", "pre-commit")),
      ).resolves.toBeUndefined();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("installs an idempotent pre-commit hook after Git initialization", async () => {
    const directory = await mkdtemp(join(tmpdir(), "astro-stack-hook-"));
    try {
      const runner = vi.fn(async (command) => {
        if (command.command === "git")
          await import("node:fs/promises").then(({ mkdir }) =>
            mkdir(join(directory, ".git", "hooks"), { recursive: true }),
          );
      });
      const configuration = mergeProjectConfiguration({
        developerExperience: { hooks: true },
        styling: { biome: false },
      });
      await finishProject(configuration, directory, runner);
      await finishProject(configuration, directory, runner);

      const hook = join(directory, ".git", "hooks", "pre-commit");
      await expect(readFile(hook, "utf8")).resolves.toBe(
        "#!/bin/sh\n# Generated by Astro Stack. Edit this project-owned hook as needed.\nset -eu\n\npnpm format\npnpm lint:fix\npnpm typecheck\n",
      );
      await expect(access(hook)).resolves.toBeUndefined();
      expect(runner.mock.calls).toEqual([
        [{ command: "git", arguments: ["init"] }, directory],
        [{ command: "pnpm", arguments: ["install"] }, directory],
        [{ command: "git", arguments: ["init"] }, directory],
        [{ command: "pnpm", arguments: ["install"] }, directory],
      ]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
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

  it("reports an unavailable command with its operating-system error", async () => {
    await expect(
      runCommand(
        { command: "astro-stack-command-that-does-not-exist", arguments: [] },
        "/tmp",
      ),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });
});
