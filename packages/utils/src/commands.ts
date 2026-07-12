import type { PackageManager, ProjectConfiguration } from "./model.js";

export interface GeneratedProjectCommand {
  script: string;
  command: string;
  description: string;
}

/** Returns the package-manager-specific command for a generated script. */
export function runProjectScript(
  manager: PackageManager,
  script: string,
): string {
  return manager === "npm" ? `npm run ${script}` : `${manager} ${script}`;
}

/** The small, stable command surface every generated project documents. */
export function generatedProjectCommands(
  configuration: ProjectConfiguration,
): readonly GeneratedProjectCommand[] {
  const command = (script: string, description: string) => ({
    script,
    command: runProjectScript(configuration.project.packageManager, script),
    description,
  });
  return [
    command("dev", "Start the development server"),
    command("build", "Build the production site"),
    command("preview", "Preview the production build"),
    command("typecheck", "Check Astro and TypeScript types"),
    ...(configuration.styling.eslint
      ? [command("lint", "Lint the project")]
      : []),
    ...(configuration.styling.prettier
      ? [command("format:check", "Check formatting")]
      : []),
    ...(configuration.styling.biome
      ? [command("check", "Run Biome checks")]
      : []),
  ];
}
