import {
  type ProjectConfiguration,
  validateProjectConfiguration,
} from "@astro-stack/utils";
import { log, outro } from "@clack/prompts";
import type { Generate } from "./options.js";
/** Displays validation diagnostics and returns whether generation may proceed. */
export function validateForGeneration(
  configuration: ProjectConfiguration,
): boolean {
  const result = validateProjectConfiguration(configuration);
  result.warnings.forEach((entry) => {
    log.warn(entry.message);
  });
  result.errors.forEach((entry) => {
    log.error(
      `${entry.message}${entry.suggestion ? ` ${entry.suggestion}` : ""}`,
    );
  });
  return result.valid;
}
/** Runs generation with consistent CLI progress and recovery messaging. */
export async function generateProject(
  configuration: ProjectConfiguration,
  generator: Generate,
): Promise<number> {
  if (!validateForGeneration(configuration)) return 2;
  try {
    log.step("Generating your project...");
    await generator(configuration);
    outro("Project ready.");
    return 0;
  } catch (error) {
    log.error(
      `Generation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    outro("No project is ready. Fix the issue and run the command again.");
    return 1;
  }
}
