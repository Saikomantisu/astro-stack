import {
  contentSetups,
  cssFrameworks,
  deploymentTargets,
  formIntegrations,
  type ProjectConfiguration,
  packageManagers,
  projectTypes,
  typeScriptPreferences,
} from "./model.js";
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
const isOneOf = (value: unknown, values: readonly string[]) =>
  typeof value === "string" && values.includes(value);
const issue = (
  level: ConfigurationIssueLevel,
  code: string,
  path: string,
  message: string,
  suggestion?: string,
): ConfigurationIssue => ({
  level,
  code,
  path,
  message,
  ...(suggestion ? { suggestion } : {}),
});
/** Validates a complete configuration before files or dependencies are touched. */
export function validateProjectConfiguration(
  configuration: ProjectConfiguration,
): ConfigurationValidationResult {
  const errors: ConfigurationIssue[] = [];
  const warnings: ConfigurationIssue[] = [];
  const { project, styling, content, features, deployment, summary } =
    configuration;
  const checks: readonly [
    unknown,
    readonly string[],
    string,
    string,
    string,
  ][] = [
    [
      project.type,
      projectTypes,
      "invalid-project-type",
      "project.type",
      "The selected project type is not supported.",
    ],
    [
      project.packageManager,
      packageManagers,
      "invalid-package-manager",
      "project.packageManager",
      "The selected package manager is not supported.",
    ],
    [
      styling.css,
      cssFrameworks,
      "invalid-css-framework",
      "styling.css",
      "The selected CSS framework is not supported.",
    ],
    [
      styling.typescript,
      typeScriptPreferences,
      "invalid-typescript-preference",
      "styling.typescript",
      "The selected TypeScript preference is not supported.",
    ],
    [
      content.setup,
      contentSetups,
      "invalid-content-setup",
      "content.setup",
      "The selected content setup is not supported.",
    ],
    [
      features.forms,
      formIntegrations,
      "invalid-forms-integration",
      "features.forms",
      "The selected forms integration is not supported.",
    ],
    [
      deployment.target,
      deploymentTargets,
      "invalid-deployment-target",
      "deployment.target",
      "The selected deployment target is not supported.",
    ],
  ];
  if (!/^[a-z0-9][a-z0-9-]*$/.test(project.name))
    errors.push(
      issue(
        "error",
        "invalid-project-name",
        "project.name",
        "Project names must use lowercase letters, numbers, and hyphens.",
        "Use a package-safe name such as 'my-astro-project'.",
      ),
    );
  if (typeof project.directory !== "string" || project.directory.trim() === "")
    errors.push(
      issue(
        "error",
        "missing-directory",
        "project.directory",
        "A target directory is required.",
      ),
    );
  for (const [value, values, code, path, message] of checks)
    if (!isOneOf(value, values))
      errors.push(issue("error", code, path, message));
  if (
    (features.forms === "resend" || features.forms === "webhooks") &&
    deployment.target === "static"
  )
    errors.push(
      issue(
        "error",
        features.forms === "resend"
          ? "resend-requires-server-runtime"
          : "webhooks-require-server-runtime",
        "features.forms",
        `${features.forms === "resend" ? "Resend" : "Webhook forwarding"} requires a server-capable deployment target and cannot be used with static output.`,
        "Choose Vercel, Netlify, or Cloudflare, or remove the Resend integration.",
      ),
    );
  if (styling.typescript === "relaxed")
    warnings.push(
      issue(
        "warning",
        "relaxed-typescript",
        "styling.typescript",
        "Relaxed TypeScript reduces compile-time safety.",
      ),
    );
  if (!styling.eslint && !styling.prettier && !styling.biome)
    warnings.push(
      issue(
        "warning",
        "no-code-quality-tooling",
        "styling",
        "No code-quality tooling is selected.",
      ),
    );
  if (!project.initializeGit)
    warnings.push(
      issue(
        "warning",
        "git-not-initialized",
        "project.initializeGit",
        "Git will not be initialized for this project.",
      ),
    );
  if (!summary.confirmBeforeWrite)
    warnings.push(
      issue(
        "warning",
        "summary-skipped",
        "summary.confirmBeforeWrite",
        "Generation will start without a final confirmation.",
      ),
    );
  return { valid: errors.length === 0, errors, warnings };
}
