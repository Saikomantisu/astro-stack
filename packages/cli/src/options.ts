import {
  agentInstructionTargets,
  codeQualityTools,
  contentSetups,
  cssFrameworks,
  deploymentTargets,
  editorTargets,
  formIntegrations,
  mergeProjectConfiguration,
  type ProjectConfiguration,
  packageManagers,
  projectTypes,
  typeScriptPreferences,
} from "@astro-stack/utils";

export const types = projectTypes;
export const managers = packageManagers;
export const cssOptions = cssFrameworks;
export const tsOptions = typeScriptPreferences;
export const toolingOptions = codeQualityTools;
export const contentOptions = contentSetups;
export const formOptions = formIntegrations;
export const deploymentOptions = deploymentTargets;
export const agentOptions = agentInstructionTargets;
export const editorOptions = editorTargets;
export interface CliOptions {
  name?: string;
  directory?: string;
  type?: ProjectConfiguration["project"]["type"];
  packageManager?: ProjectConfiguration["project"]["packageManager"];
  css?: ProjectConfiguration["styling"]["css"];
  typescript?: ProjectConfiguration["styling"]["typescript"];
  content?: ProjectConfiguration["content"]["setup"];
  forms?: ProjectConfiguration["features"]["forms"];
  deployment?: ProjectConfiguration["deployment"]["target"];
  agent?: string[];
  editor?: string[];
  eslint: boolean;
  prettier: boolean;
  biome: boolean;
  git: boolean;
  hooks?: boolean;
  nonInteractive?: boolean;
  yes?: boolean;
}
export interface GenerateResult {
  /** Whether dependency installation completed; false leaves a ready-to-install project. */
  dependenciesInstalled: boolean;
  installError?: Error;
}
export type Generate = (
  configuration: ProjectConfiguration,
) => Promise<GenerateResult | undefined>;
/** Converts Commander options into the shared complete configuration model. */
export function configurationFrom(options: CliOptions): ProjectConfiguration {
  return mergeProjectConfiguration({
    project: {
      ...(options.name ? { name: options.name } : {}),
      ...(options.directory ? { directory: options.directory } : {}),
      ...(options.type ? { type: options.type } : {}),
      ...(options.packageManager
        ? { packageManager: options.packageManager }
        : {}),
      initializeGit: options.git,
    },
    styling: {
      ...(options.css ? { css: options.css } : {}),
      ...(options.typescript ? { typescript: options.typescript } : {}),
      eslint: options.eslint,
      prettier: options.prettier,
      biome: options.biome,
    },
    ...(options.content ? { content: { setup: options.content } } : {}),
    ...(options.forms ? { features: { forms: options.forms } } : {}),
    ...(options.deployment
      ? { deployment: { target: options.deployment } }
      : {}),
    developerExperience: {
      agents: (options.agent ??
        []) as ProjectConfiguration["developerExperience"]["agents"],
      editors: (options.editor ??
        []) as ProjectConfiguration["developerExperience"]["editors"],
      ...(typeof options.hooks === "boolean" ? { hooks: options.hooks } : {}),
    },
  });
}
