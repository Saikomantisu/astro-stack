import { resolve } from "node:path";

import { resolveFeatures } from "@astro-stack/features";
import {
  type ProjectConfiguration,
  validateProjectConfiguration,
} from "@astro-stack/utils";

import { applyConfigurationChanges } from "./configuration.js";
import { createBaseTemplates } from "./templates.js";
import { writeProject } from "./writer.js";

export interface GeneratedProject {
  directory: string;
  files: readonly string[];
}

/** Validates and creates a minimal independent Astro project. */
export async function createProject(
  configuration: ProjectConfiguration,
): Promise<GeneratedProject> {
  const validation = validateProjectConfiguration(configuration);
  if (!validation.valid)
    throw new Error(
      `Cannot generate an invalid project: ${validation.errors.map(({ message }) => message).join(" ")}`,
    );
  const featureResolution = resolveFeatures(configuration);
  if (!featureResolution.valid)
    throw new Error(
      `Cannot generate an invalid feature plan: ${featureResolution.errors
        .map(({ message }) => message)
        .concat(featureResolution.conflicts.map(({ message }) => message))
        .join(" ")}`,
    );
  const directory = resolve(configuration.project.directory);
  const files = await writeProject(
    directory,
    applyConfigurationChanges(
      createBaseTemplates(configuration),
      featureResolution.configurationChanges,
    ),
  );
  return { directory, files };
}
