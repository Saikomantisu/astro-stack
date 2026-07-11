/** The kinds of Astro projects supported by the first release. */
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

export interface ProjectSectionConfiguration {
  name: string;
  directory: string;
  type: ProjectType;
  packageManager: PackageManager;
  initializeGit: boolean;
}

export interface StylingToolingSectionConfiguration {
  css: CssFramework;
  typescript: TypeScriptPreference;
  eslint: boolean;
  prettier: boolean;
}

export interface ContentSectionConfiguration {
  setup: ContentSetup;
}

export interface FeaturesSectionConfiguration {
  forms: FormIntegration;
}

export interface DeploymentSectionConfiguration {
  target: DeploymentTarget;
}

/** UI behavior which keeps the final review step explicit and testable. */
export interface SummarySectionConfiguration {
  confirmBeforeWrite: boolean;
}

/** Complete configuration passed from the CLI to feature resolution and generation. */
export interface ProjectConfiguration {
  project: ProjectSectionConfiguration;
  styling: StylingToolingSectionConfiguration;
  content: ContentSectionConfiguration;
  features: FeaturesSectionConfiguration;
  deployment: DeploymentSectionConfiguration;
  summary: SummarySectionConfiguration;
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
  },
  content: { setup: "none" },
  features: { forms: "none" },
  deployment: { target: "static" },
  summary: { confirmBeforeWrite: true },
};

/**
 * Combines independently collected wizard sections with the supported defaults.
 * The returned object is always detached from both the defaults and the input.
 */
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

export type ConfigurationIssueLevel = "error" | "warning";

export interface ConfigurationIssue {
  level: ConfigurationIssueLevel;
  code: string;
  path: string;
  message: string;
  suggestion?: string;
}

export interface ConfigurationValidationResult {
  valid: boolean;
  errors: ConfigurationIssue[];
  warnings: ConfigurationIssue[];
}

function isOneOf(value: unknown, values: readonly string[]): boolean {
  return typeof value === "string" && values.includes(value);
}

function issue(
  level: ConfigurationIssueLevel,
  code: string,
  path: string,
  message: string,
  suggestion?: string,
): ConfigurationIssue {
  return { level, code, path, message, ...(suggestion ? { suggestion } : {}) };
}

/** Validates a complete configuration before files or dependencies are touched. */
export function validateProjectConfiguration(
  configuration: ProjectConfiguration,
): ConfigurationValidationResult {
  const errors: ConfigurationIssue[] = [];
  const warnings: ConfigurationIssue[] = [];
  const { project, styling, content, features, deployment, summary } =
    configuration;

  if (!/^[a-z0-9][a-z0-9-]*$/.test(project.name)) {
    errors.push(
      issue(
        "error",
        "invalid-project-name",
        "project.name",
        "Project names must use lowercase letters, numbers, and hyphens.",
        "Use a package-safe name such as 'my-astro-project'.",
      ),
    );
  }
  if (
    typeof project.directory !== "string" ||
    project.directory.trim() === ""
  ) {
    errors.push(
      issue(
        "error",
        "missing-directory",
        "project.directory",
        "A target directory is required.",
      ),
    );
  }
  if (!isOneOf(project.type, projectTypes)) {
    errors.push(
      issue(
        "error",
        "invalid-project-type",
        "project.type",
        "The selected project type is not supported.",
      ),
    );
  }
  if (!isOneOf(project.packageManager, packageManagers)) {
    errors.push(
      issue(
        "error",
        "invalid-package-manager",
        "project.packageManager",
        "The selected package manager is not supported.",
      ),
    );
  }
  if (!isOneOf(styling.css, cssFrameworks)) {
    errors.push(
      issue(
        "error",
        "invalid-css-framework",
        "styling.css",
        "The selected CSS framework is not supported.",
      ),
    );
  }
  if (!isOneOf(styling.typescript, typeScriptPreferences)) {
    errors.push(
      issue(
        "error",
        "invalid-typescript-preference",
        "styling.typescript",
        "The selected TypeScript preference is not supported.",
      ),
    );
  }
  if (!isOneOf(content.setup, contentSetups)) {
    errors.push(
      issue(
        "error",
        "invalid-content-setup",
        "content.setup",
        "The selected content setup is not supported.",
      ),
    );
  }
  if (!isOneOf(features.forms, formIntegrations)) {
    errors.push(
      issue(
        "error",
        "invalid-forms-integration",
        "features.forms",
        "The selected forms integration is not supported.",
      ),
    );
  }
  if (!isOneOf(deployment.target, deploymentTargets)) {
    errors.push(
      issue(
        "error",
        "invalid-deployment-target",
        "deployment.target",
        "The selected deployment target is not supported.",
      ),
    );
  }

  if (features.forms === "resend" && deployment.target === "static") {
    errors.push(
      issue(
        "error",
        "resend-requires-server-runtime",
        "features.forms",
        "Resend requires a server-capable deployment target and cannot be used with static output.",
        "Choose Vercel, Netlify, or Cloudflare, or remove the Resend integration.",
      ),
    );
  }
  if (styling.typescript === "relaxed") {
    warnings.push(
      issue(
        "warning",
        "relaxed-typescript",
        "styling.typescript",
        "Relaxed TypeScript reduces compile-time safety.",
      ),
    );
  }
  if (!styling.eslint && !styling.prettier) {
    warnings.push(
      issue(
        "warning",
        "no-code-quality-tooling",
        "styling",
        "Neither ESLint nor Prettier is selected.",
      ),
    );
  }
  if (!project.initializeGit) {
    warnings.push(
      issue(
        "warning",
        "git-not-initialized",
        "project.initializeGit",
        "Git will not be initialized for this project.",
      ),
    );
  }
  if (!summary.confirmBeforeWrite) {
    warnings.push(
      issue(
        "warning",
        "summary-skipped",
        "summary.confirmBeforeWrite",
        "Generation will start without a final confirmation.",
      ),
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

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

/** Creates display-ready, stable values for the CLI's final summary screen. */
export function summarizeProjectConfiguration(
  configuration: ProjectConfiguration,
): ProjectConfigurationSummary {
  const tooling = [
    `TypeScript (${configuration.styling.typescript})`,
    ...(configuration.styling.eslint ? ["ESLint"] : []),
    ...(configuration.styling.prettier ? ["Prettier"] : []),
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
