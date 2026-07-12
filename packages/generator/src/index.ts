import { resolve } from "node:path";

import { type FeatureDefinition, resolveFeatures } from "@astro-stack/features";
import {
  type ProjectConfiguration,
  validateProjectConfiguration,
} from "@astro-stack/utils";

import {
  applyConfigurationChanges,
  applyDependencies,
} from "./configuration.js";
import { createBaseTemplates } from "./templates.js";
import { writeProject } from "./writer.js";

export interface GeneratedProject {
  directory: string;
  files: readonly string[];
}

export {
  type Command,
  type CommandRunner,
  finishProject,
  InstallationError,
  initializeGit,
  installDependencies,
  installPreCommitHook,
  type ProjectFinishResult,
  runCommand,
} from "./installer.js";

/** Validates and creates a minimal independent Astro project. */
export async function createProject(
  configuration: ProjectConfiguration,
  registry?: readonly FeatureDefinition[],
): Promise<GeneratedProject> {
  const validation = validateProjectConfiguration(configuration);
  if (!validation.valid)
    throw new Error(
      `Cannot generate an invalid project: ${validation.errors.map(({ message }) => message).join(" ")}`,
    );
  const featureResolution = resolveFeatures(configuration, registry);
  if (!featureResolution.valid)
    throw new Error(
      `Cannot generate an invalid feature plan: ${featureResolution.errors
        .map(({ message }) => message)
        .concat(featureResolution.conflicts.map(({ message }) => message))
        .join(" ")}`,
    );
  const directory = resolve(configuration.project.directory);
  for (const { feature, hooks } of featureResolution.hooks)
    await hooks.beforeGenerate?.({ configuration, feature });
  const files = await writeProject(
    directory,
    applyConfigurationChanges(
      applyDependencies(
        [...createBaseTemplates(configuration), ...featureResolution.templates],
        featureResolution.dependencies,
      ),
      featureResolution.configurationChanges,
    ),
  );
  for (const { feature, hooks } of featureResolution.hooks)
    await hooks.afterGenerate?.({ configuration, feature });
  return { directory, files };
}
