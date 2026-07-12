export const projectTypes = [
  "marketing",
  "client",
  "blog",
  "documentation",
  "portfolio",
  "saas-landing",
  "blank",
] as const;
export const packageManagers = ["npm", "pnpm", "yarn", "bun"] as const;
export const cssFrameworks = ["vanilla", "tailwind"] as const;
export const typeScriptPreferences = ["strict", "relaxed"] as const;
export const contentSetups = [
  "none",
  "markdown",
  "mdx",
  "collections",
] as const;
export const formIntegrations = ["none", "resend", "webhooks"] as const;
export const deploymentTargets = [
  "static",
  "vercel",
  "netlify",
  "cloudflare",
] as const;
export type ProjectType = (typeof projectTypes)[number];
export type PackageManager = (typeof packageManagers)[number];
export type CssFramework = (typeof cssFrameworks)[number];
export type TypeScriptPreference = (typeof typeScriptPreferences)[number];
export type ContentSetup = (typeof contentSetups)[number];
export type FormIntegration = (typeof formIntegrations)[number];
export type DeploymentTarget = (typeof deploymentTargets)[number];
export interface ProjectConfiguration {
  project: {
    name: string;
    directory: string;
    type: ProjectType;
    packageManager: PackageManager;
    initializeGit: boolean;
  };
  styling: {
    css: CssFramework;
    typescript: TypeScriptPreference;
    eslint: boolean;
    prettier: boolean;
    biome: boolean;
  };
  content: { setup: ContentSetup };
  features: { forms: FormIntegration };
  deployment: { target: DeploymentTarget };
  summary: { confirmBeforeWrite: boolean };
}
export type ProjectConfigurationInput = {
  [Section in keyof ProjectConfiguration]?: Partial<
    ProjectConfiguration[Section]
  >;
};
export const defaultProjectConfiguration: Readonly<ProjectConfiguration> = {
  project: {
    name: "my-astro-project",
    directory: "./my-astro-project",
    type: "blank",
    packageManager: "pnpm",
    initializeGit: true,
  },
  styling: {
    css: "vanilla",
    typescript: "strict",
    eslint: true,
    prettier: true,
    biome: true,
  },
  content: { setup: "none" },
  features: { forms: "none" },
  deployment: { target: "static" },
  summary: { confirmBeforeWrite: true },
};
/** Combines independently collected wizard sections with detached defaults. */
export function mergeProjectConfiguration(
  input: ProjectConfigurationInput = {},
): ProjectConfiguration {
  return {
    project: { ...defaultProjectConfiguration.project, ...input.project },
    styling: { ...defaultProjectConfiguration.styling, ...input.styling },
    content: { ...defaultProjectConfiguration.content, ...input.content },
    features: { ...defaultProjectConfiguration.features, ...input.features },
    deployment: {
      ...defaultProjectConfiguration.deployment,
      ...input.deployment,
    },
    summary: { ...defaultProjectConfiguration.summary, ...input.summary },
  };
}
