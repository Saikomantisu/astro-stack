import {
  type ProjectConfiguration,
  validateProjectConfiguration,
} from "@astro-stack/utils";
import { log, note, outro } from "@clack/prompts";
import { projectReadyCard, projectReadyMessage } from "./brand.js";
import { installCommand, nextSteps, projectNotes } from "./finishing.js";
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
    log.step("Preparing your project for launch...");
    const result = await generator(configuration);
    const notes = projectNotes(configuration);
    const steps = [...nextSteps(configuration)];
    if (result && !result.dependenciesInstalled) {
      log.warn(
        `Dependencies were not installed automatically${result.installError ? `: ${result.installError.message}` : ""}.`,
      );
      // The install step has to run before `dev`, so slot it in after `cd`.
      steps.splice(1, 0, installCommand(configuration));
    }
    log.success(projectReadyMessage(configuration.project.name));
    note(projectReadyCard(steps, notes), "Your Astro project");
    outro("The stars are aligned. Start building.");
    return 0;
  } catch (error) {
    log.error(
      `Launch failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    outro("No project is ready. Fix the issue and launch again.");
    return 1;
  }
}
