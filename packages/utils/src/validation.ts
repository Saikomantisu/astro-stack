import {
  agentInstructionTargets,
  contentSetups,
  cssFrameworks,
  deploymentTargets,
  editorTargets,
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
/**
 * A conflict between selected options, described independently of where it is
 * surfaced. The interactive wizard uses these to warn at the deciding step; the
 * validator turns them into {@link ConfigurationIssue}s. Keeping the copy here
 * is the single source of truth so the two paths cannot drift.
 */
export interface ConfigurationConflict {
  code: string;
  path: string;
  message: string;
  suggestion: string;
}
/**
 * VS Code and Cursor both own the `.vscode` workspace configuration, so at most
 * one may be set up. Returns the conflict when both are selected.
 */
export function editorTargetsConflict(
  editors: readonly string[],
): ConfigurationConflict | undefined {
  if (!(editors.includes("vscode") && editors.includes("cursor")))
    return undefined;
  return {
    code: "incompatible-editor-targets",
    path: "developerExperience.editors",
    message:
      "VS Code and Cursor cannot be selected together because both own .vscode workspace configuration.",
    suggestion: "Choose either vscode or cursor.",
  };
}
/**
 * Resend and webhook forwarding need a server runtime, so they cannot pair with
 * a static deployment target. Returns the conflict when they do.
 */
export function serverRuntimeFormsConflict(
  forms: string,
  deploymentTarget: string,
): ConfigurationConflict | undefined {
  if (
    !(
      (forms === "resend" || forms === "webhooks") &&
      deploymentTarget === "static"
    )
  )
    return undefined;
  const isResend = forms === "resend";
  return {
    code: isResend
      ? "resend-requires-server-runtime"
      : "webhooks-require-server-runtime",
    path: "features.forms",
    message: `${isResend ? "Resend" : "Webhook forwarding"} requires a server-capable deployment target and cannot be used with static output.`,
    suggestion:
      "Choose Vercel, Netlify, or Cloudflare, or remove the Resend integration.",
  };
}
/** Validates a complete configuration before files or dependencies are touched. */
export function validateProjectConfiguration(
  configuration: ProjectConfiguration,
): ConfigurationValidationResult {
  const errors: ConfigurationIssue[] = [];
  const warnings: ConfigurationIssue[] = [];
  const {
    project,
    styling,
    content,
    features,
    deployment,
    developerExperience,
    summary,
  } = configuration;
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
  const validateSelections = (
    selections: unknown,
    supported: readonly string[],
    path: string,
    label: string,
  ) => {
    if (!Array.isArray(selections)) {
      errors.push(
        issue(
          "error",
          `invalid-${label}-selections`,
          path,
          `Selected ${label} targets must be a list.`,
        ),
      );
      return;
    }
    const seen = new Set<string>();
    for (const selection of selections) {
      if (!isOneOf(selection, supported))
        errors.push(
          issue(
            "error",
            `invalid-${label}-target`,
            path,
            `The selected ${label} target '${String(selection)}' is not supported.`,
          ),
        );
      else if (seen.has(selection))
        errors.push(
          issue(
            "error",
            `duplicate-${label}-target`,
            path,
            `The ${label} target '${selection}' was selected more than once.`,
          ),
        );
      else seen.add(selection);
    }
  };
  validateSelections(
    developerExperience.agents,
    agentInstructionTargets,
    "developerExperience.agents",
    "agent",
  );
  validateSelections(
    developerExperience.editors,
    editorTargets,
    "developerExperience.editors",
    "editor",
  );
  if (typeof developerExperience.hooks !== "boolean")
    errors.push(
      issue(
        "error",
        "invalid-hooks-selection",
        "developerExperience.hooks",
        "The Git hooks selection must be true or false.",
      ),
    );
  else if (developerExperience.hooks && !project.initializeGit)
    errors.push(
      issue(
        "error",
        "hooks-require-git",
        "developerExperience.hooks",
        "Pre-commit hooks require Git initialization.",
        "Enable Git or disable hooks.",
      ),
    );
  const editorConflict = editorTargetsConflict(developerExperience.editors);
  if (editorConflict)
    errors.push(
      issue(
        "error",
        editorConflict.code,
        editorConflict.path,
        editorConflict.message,
        editorConflict.suggestion,
      ),
    );
  const formsConflict = serverRuntimeFormsConflict(
    features.forms,
    deployment.target,
  );
  if (formsConflict)
    errors.push(
      issue(
        "error",
        formsConflict.code,
        formsConflict.path,
        formsConflict.message,
        formsConflict.suggestion,
      ),
    );
  if (
    (project.type === "blog" || project.type === "documentation") &&
    content.setup !== "none"
  )
    errors.push(
      issue(
        "error",
        "project-type-owns-content",
        "content.setup",
        `${project.type === "blog" ? "Blog" : "Documentation"} projects include their own content collection and do not accept a Content setup selection.`,
        "Remove --content and use the collection generated by the project type.",
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
