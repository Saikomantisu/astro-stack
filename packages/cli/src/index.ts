#!/usr/bin/env node

import { createProject } from "@astro-stack/generator";
import {
  mergeProjectConfiguration,
  type ProjectConfiguration,
  summarizeProjectConfiguration,
  validateProjectConfiguration,
} from "@astro-stack/utils";
import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  multiselect,
  note,
  outro,
  select,
  text,
} from "@clack/prompts";
import { Command } from "commander";

const version = "0.1.0";
const types = [
  "marketing",
  "client",
  "blog",
  "documentation",
  "portfolio",
  "saas-landing",
  "blank",
] as const;
const managers = ["npm", "pnpm", "yarn", "bun"] as const;
const cssOptions = ["vanilla", "tailwind"] as const;
const tsOptions = ["strict", "relaxed"] as const;
const contentOptions = ["none", "markdown", "mdx", "collections"] as const;
const formOptions = ["none", "resend", "webhooks"] as const;
const deploymentOptions = [
  "static",
  "vercel",
  "netlify",
  "cloudflare",
] as const;
type Generate = (configuration: ProjectConfiguration) => Promise<void>;

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
  eslint: boolean;
  prettier: boolean;
  git: boolean;
  nonInteractive?: boolean;
  yes?: boolean;
}
const cancelled = (value: unknown): value is symbol => isCancel(value);
function validate(configuration: ProjectConfiguration): boolean {
  const result = validateProjectConfiguration(configuration);
  result.warnings.forEach((issue) => {
    log.warn(issue.message);
  });
  result.errors.forEach((issue) => {
    log.error(
      `${issue.message}${issue.suggestion ? ` ${issue.suggestion}` : ""}`,
    );
  });
  return result.valid;
}
async function generate(
  configuration: ProjectConfiguration,
  generator: Generate,
): Promise<number> {
  if (!validate(configuration)) return 2;
  try {
    log.step("Generating your project...");
    await generator(configuration);
    outro("Project ready.");
    return 0;
  } catch (error) {
    log.error(
      `Generation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    outro("No project is ready. Fix the issue and run the command again.");
    return 1;
  }
}
function configurationFrom(options: CliOptions): ProjectConfiguration {
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
    },
    ...(options.content ? { content: { setup: options.content } } : {}),
    ...(options.forms ? { features: { forms: options.forms } } : {}),
    ...(options.deployment
      ? { deployment: { target: options.deployment } }
      : {}),
  });
}
export async function runNonInteractive(
  options: CliOptions,
  generator: Generate = createProject,
): Promise<number> {
  if (!options.yes) {
    log.error("Non-interactive generation requires --yes.");
    return 2;
  }
  return generate(configurationFrom(options), generator);
}
export async function runInteractive(
  generator: Generate = createProject,
): Promise<number> {
  intro("Astro Stack — Production-ready Astro apps.");
  const defaults = mergeProjectConfiguration();
  const name = await text({
    message: "Project name",
    initialValue: defaults.project.name,
    validate: (value) =>
      value && /^[a-z0-9][a-z0-9-]*$/.test(value)
        ? undefined
        : "Use lowercase letters, numbers, and hyphens.",
  });
  if (cancelled(name)) return 0;
  const directory = await text({
    message: "Output directory",
    initialValue: defaults.project.directory,
  });
  if (cancelled(directory)) return 0;
  const projectType = await select({
    message: "What are you building?",
    options: types.map((value) => ({ value })),
    initialValue: defaults.project.type,
  });
  if (cancelled(projectType)) return 0;
  const packageManager = await select({
    message: "Package manager",
    options: managers.map((value) => ({ value })),
    initialValue: defaults.project.packageManager,
  });
  if (cancelled(packageManager)) return 0;
  const css = await select({
    message: "CSS framework",
    options: cssOptions.map((value) => ({ value })),
    initialValue: defaults.styling.css,
  });
  if (cancelled(css)) return 0;
  const typescript = await select({
    message: "TypeScript preference",
    options: tsOptions.map((value) => ({ value })),
    initialValue: defaults.styling.typescript,
  });
  if (cancelled(typescript)) return 0;
  const tooling = await multiselect({
    message: "Select tooling (Space toggles an option)",
    options: [
      { value: "eslint", label: "ESLint" },
      { value: "prettier", label: "Prettier" },
    ],
    initialValues: ["eslint", "prettier"],
  });
  if (cancelled(tooling)) return 0;
  const content = await select({
    message: "Content setup",
    options: contentOptions.map((value) => ({ value })),
    initialValue: defaults.content.setup,
  });
  if (cancelled(content)) return 0;
  const forms = await select({
    message: "Forms integration",
    options: formOptions.map((value) => ({ value })),
    initialValue: defaults.features.forms,
  });
  if (cancelled(forms)) return 0;
  const deployment = await select({
    message: "Deployment target",
    options: deploymentOptions.map((value) => ({ value })),
    initialValue: defaults.deployment.target,
  });
  if (cancelled(deployment)) return 0;
  const configuration = mergeProjectConfiguration({
    project: { name, directory, type: projectType, packageManager },
    styling: {
      css,
      typescript,
      eslint: tooling.includes("eslint"),
      prettier: tooling.includes("prettier"),
    },
    content: { setup: content },
    features: { forms },
    deployment: { target: deployment },
  });
  if (!validate(configuration)) return 2;
  note(
    Object.entries(summarizeProjectConfiguration(configuration))
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n"),
    "Summary",
  );
  const accepted = await confirm({
    message: "Generate this project?",
    initialValue: true,
  });
  if (cancelled(accepted) || !accepted) {
    cancel("Generation cancelled. No files were written.");
    return 0;
  }
  return generate(configuration, generator);
}
export function createCli(generator: Generate = createProject): Command {
  const cli = new Command();
  cli
    .name("create-astro-stack")
    .description("Generate a production-ready Astro project.")
    .version(version, "-v, --version")
    .option("-y, --yes", "Confirm generation")
    .option("--non-interactive", "Do not prompt")
    .option("--name <name>", "Project name")
    .option("--directory <path>", "Output directory")
    .addOption(cli.createOption("--type <type>", "Project type").choices(types))
    .addOption(
      cli
        .createOption("--package-manager <manager>", "Package manager")
        .choices(managers),
    )
    .addOption(
      cli
        .createOption("--css <framework>", "CSS framework")
        .choices(cssOptions),
    )
    .addOption(
      cli
        .createOption("--typescript <preference>", "TypeScript preference")
        .choices(tsOptions),
    )
    .addOption(
      cli
        .createOption("--content <setup>", "Content setup")
        .choices(contentOptions),
    )
    .addOption(
      cli
        .createOption("--forms <integration>", "Forms integration")
        .choices(formOptions),
    )
    .addOption(
      cli
        .createOption("--deployment <target>", "Deployment target")
        .choices(deploymentOptions),
    )
    .option("--no-eslint")
    .option("--no-prettier")
    .option("--no-git")
    .action(async (options: CliOptions) => {
      process.exitCode = options.nonInteractive
        ? await runNonInteractive(options, generator)
        : await runInteractive(generator);
    });
  return cli;
}
if (import.meta.url === `file://${process.argv[1]}`)
  void createCli().parseAsync();
