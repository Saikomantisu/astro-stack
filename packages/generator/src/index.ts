import type { ProjectConfiguration } from "@astro-stack/utils";

/**
 * Generation boundary used by the CLI after validation and final confirmation.
 * File rendering is implemented in the base-project-generation phase.
 */
export async function createProject(
  _configuration: ProjectConfiguration,
): Promise<void> {
  throw new Error(
    "Project generation is not available until base project generation is implemented.",
  );
}
