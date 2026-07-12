import { spawn } from "node:child_process";

import type { PackageManager, ProjectConfiguration } from "@astro-stack/utils";

export interface Command {
  command: string;
  arguments: readonly string[];
}

export type CommandRunner = (
  command: Command,
  directory: string,
) => Promise<void>;

export class InstallationError extends Error {
  constructor(
    readonly command: Command,
    cause: unknown,
  ) {
    super(
      `Could not run ${[command.command, ...command.arguments].join(" ")}: ${cause instanceof Error ? cause.message : String(cause)}`,
      { cause },
    );
    this.name = "InstallationError";
  }
}

const installCommands: Readonly<Record<PackageManager, Command>> = {
  npm: { command: "npm", arguments: ["install"] },
  pnpm: { command: "pnpm", arguments: ["install"] },
  yarn: { command: "yarn", arguments: ["install"] },
  bun: { command: "bun", arguments: ["install"] },
};

/** Executes a command without inheriting interactive input from the generator. */
export async function runCommand(
  command: Command,
  directory: string,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command.command, command.arguments, {
      cwd: directory,
      stdio: ["ignore", "inherit", "inherit"],
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            signal ? `terminated by ${signal}` : `exited with code ${code}`,
          ),
        );
    });
  });
}

/** Installs dependencies (and therefore creates the selected manager's lockfile). */
export async function installDependencies(
  configuration: ProjectConfiguration,
  directory: string,
  runner: CommandRunner = runCommand,
): Promise<void> {
  const command = installCommands[configuration.project.packageManager];
  try {
    await runner(command, directory);
  } catch (error) {
    throw new InstallationError(command, error);
  }
}

/** Initializes a repository for generated projects when requested. */
export async function initializeGit(
  directory: string,
  runner: CommandRunner = runCommand,
): Promise<void> {
  const command: Command = { command: "git", arguments: ["init"] };
  try {
    await runner(command, directory);
  } catch (error) {
    throw new InstallationError(command, error);
  }
}

/** Completes post-generation setup after the project directory has been written. */
export async function finishProject(
  configuration: ProjectConfiguration,
  directory: string,
  runner: CommandRunner = runCommand,
): Promise<void> {
  await installDependencies(configuration, directory, runner);
  if (configuration.project.initializeGit)
    await initializeGit(directory, runner);
}
