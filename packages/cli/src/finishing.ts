import { createProject, finishProject } from "@astro-stack/generator";
import type { ProjectConfiguration } from "@astro-stack/utils";

import type { Generate } from "./options.js";

function managerRunCommand(
  manager: ProjectConfiguration["project"]["packageManager"],
  script: string,
): string {
  return manager === "npm" ? `npm run ${script}` : `${manager} ${script}`;
}

/** Creates, installs, and initializes the project used by the default CLI flow. */
export const generateAndFinish: Generate = async (configuration) => {
  const project = await createProject(configuration);
  await finishProject(configuration, project.directory);
  return project;
};

/** Produces only the next steps required by the selected configuration. */
export function nextSteps(
  configuration: ProjectConfiguration,
): readonly string[] {
  const manager = configuration.project.packageManager;
  const steps = [
    `cd ${configuration.project.directory}`,
    managerRunCommand(manager, "dev"),
  ];
  if (configuration.features.forms === "resend")
    steps.push(
      "Set RESEND_API_KEY in .env before submitting the contact form.",
    );
  if (configuration.features.forms === "webhooks")
    steps.push("Set WEBHOOK_URL in .env before submitting the contact form.");
  if (configuration.deployment.target === "vercel")
    steps.push("Deploy the project with Vercel.");
  if (configuration.deployment.target === "netlify")
    steps.push("Deploy the project with Netlify.");
  if (configuration.deployment.target === "cloudflare")
    steps.push("Configure and deploy the project with Cloudflare Workers.");
  return steps;
}
