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
  content: ContentSetup | "built-in blog collection" | "built-in docs collection";
  forms: FormIntegration;
  deployment: DeploymentTarget;
  agents: string;
  editors: string;
  hooks: string;
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
    content:
      configuration.project.type === "blog"
        ? "built-in blog collection"
        : configuration.project.type === "documentation"
          ? "built-in docs collection"
          : configuration.content.setup,
    forms: configuration.features.forms,
    deployment: configuration.deployment.target,
    agents: configuration.developerExperience.agents.join(", ") || "none",
    editors: configuration.developerExperience.editors.join(", ") || "none",
    hooks: configuration.developerExperience.hooks ? "pre-commit" : "none",
  };
}
