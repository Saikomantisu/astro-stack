import { createProject, finishProject } from "@astro-stack/generator";
import {
  type ProjectConfiguration,
  runProjectScript,
} from "@astro-stack/utils";

import type { Generate } from "./options.js";

/** Creates, installs, and initializes the project used by the default CLI flow. */
export const generateAndFinish: Generate = async (configuration) => {
  const project = await createProject(configuration);
  const { dependenciesInstalled, installError } = await finishProject(
    configuration,
    project.directory,
  );
  return { dependenciesInstalled, installError };
};

/** The command that finishes setup when automatic dependency installation fails. */
export function installCommand(configuration: ProjectConfiguration): string {
  return configuration.project.packageManager === "npm"
    ? "npm install"
    : `${configuration.project.packageManager} install`;
}

/** The immediate actions to get the freshly generated project running. */
export function nextSteps(
  configuration: ProjectConfiguration,
): readonly string[] {
  return [
    `cd ${configuration.project.directory}`,
    runProjectScript(configuration.project.packageManager, "dev"),
  ];
}

/** Prerequisite caveats a selected feature needs before it will work. */
export function projectNotes(
  configuration: ProjectConfiguration,
): readonly string[] {
  const notes: string[] = [];
  if (configuration.features.forms === "resend")
    notes.push("Set RESEND_API_KEY in .env before the contact form will work.");
  if (configuration.features.forms === "webhooks")
    notes.push("Set WEBHOOK_URL in .env before the contact form will work.");
  return notes;
}
