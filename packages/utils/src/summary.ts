import type {
  ContentSetup,
  DeploymentTarget,
  FormIntegration,
  PackageManager,
  ProjectConfiguration,
  ProjectType,
} from "./model.js";
export interface ProjectConfigurationSummary {
  project: string;
  location: string;
  projectType: ProjectType;
  packageManager: PackageManager;
  styling: string;
  content: ContentSetup;
  forms: FormIntegration;
  deployment: DeploymentTarget;
}
/** Creates display-ready stable values for the CLI final summary. */
export function summarizeProjectConfiguration(
  configuration: ProjectConfiguration,
): ProjectConfigurationSummary {
  const tooling = [
    `TypeScript (${configuration.styling.typescript})`,
    ...(configuration.styling.eslint ? ["ESLint"] : []),
    ...(configuration.styling.prettier ? ["Prettier"] : []),
    ...(configuration.styling.biome ? ["Biome"] : []),
  ];
  return {
    project: configuration.project.name,
    location: configuration.project.directory,
    projectType: configuration.project.type,
    packageManager: configuration.project.packageManager,
    styling: `${configuration.styling.css}; ${tooling.join(", ")}`,
    content: configuration.content.setup,
    forms: configuration.features.forms,
    deployment: configuration.deployment.target,
  };
}
