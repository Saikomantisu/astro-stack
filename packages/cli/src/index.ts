#!/usr/bin/env node

import {
  editorTargetsConflict,
  mergeProjectConfiguration,
  serverRuntimeFormsConflict,
  summarizeProjectConfiguration,
} from "@astro-stack/utils";
import {
  cancel,
  intro,
  isCancel,
  log,
  multiselect,
  note,
  select,
  text,
} from "@clack/prompts";
import { Command } from "commander";
import { astroStackWordmark, flightPlan } from "./brand.js";
import { generateAndFinish } from "./finishing.js";
import { generateProject, validateForGeneration } from "./generation.js";
import {
  agentOptions,
  type CliOptions,
  configurationFrom,
  contentOptions,
  cssOptions,
  deploymentOptions,
  editorOptions,
  formOptions,
  type Generate,
  managers,
  tsOptions,
  types,
} from "./options.js";

const version = "0.1.1";

export type { CliOptions } from "./options.js";

const cancelled = (value: unknown): value is symbol => isCancel(value);

type PromptOption<Value extends string> = {
  value: Value;
  label: string;
  hint?: string;
};

/** The small prompt surface is injectable so the wizard can be interaction-tested. */
export interface InteractivePrompts {
  intro(message: string): void;
  text(options: {
    message: string;
    initialValue?: string;
    placeholder?: string;
    validate?: (value: string | undefined) => string | Error | undefined;
  }): Promise<string | symbol>;
  select<Value extends string>(options: {
    message: string;
    options: PromptOption<Value>[];
    initialValue?: Value;
  }): Promise<Value | symbol>;
  multiselect<Value extends string>(options: {
    message: string;
    options: PromptOption<Value>[];
    initialValues?: Value[];
    required?: boolean;
  }): Promise<Value[] | symbol>;
  note(message: string, title?: string): void;
  cancel(message: string): void;
}

const defaultPrompts: InteractivePrompts = {
  intro,
  text,
  select,
  multiselect,
  note,
  cancel,
} as InteractivePrompts;

const labels: Record<string, string> = {
  marketing: "Marketing site",
  client: "Client project",
  blog: "Blog",
  documentation: "Documentation",
  portfolio: "Portfolio",
  "saas-landing": "SaaS landing page",
  blank: "Blank project",
  npm: "npm",
  pnpm: "pnpm",
  yarn: "Yarn",
  bun: "Bun",
  vanilla: "Vanilla CSS",
  tailwind: "Tailwind CSS",
  strict: "Strict (recommended)",
  relaxed: "Relaxed",
  none: "None",
  markdown: "Markdown",
  mdx: "MDX",
  collections: "Content Collections",
  resend: "Resend",
  webhooks: "Webhooks",
  static: "Static site",
  vercel: "Vercel",
  netlify: "Netlify",
  cloudflare: "Cloudflare",
  codex: "Codex (AGENTS.md)",
  claude: "Claude Code (CLAUDE.md)",
  vscode: "VS Code",
  cursor: "Cursor",
  zed: "Zed",
};

function promptOptions<Value extends string>(
  values: readonly Value[],
): PromptOption<Value>[] {
  return values.map((value) => ({ value, label: labels[value] ?? value }));
}

/** Renders a conflict's message and its suggested fix as a single note body. */
const conflictNote = (conflict: { message: string; suggestion: string }) =>
  `${conflict.message} ${conflict.suggestion}`;

/**
 * Prompts for editor integrations, re-asking immediately if the selection is
 * invalid so the conflict surfaces at this step instead of the final summary.
 * VS Code and Cursor both own `.vscode` workspace config, so only one may win.
 */
async function promptEditors(
  prompts: InteractivePrompts,
  initialValues: (typeof editorOptions)[number][],
): Promise<(typeof editorOptions)[number][] | symbol> {
  while (true) {
    const editors = await prompts.multiselect({
      message: "Editor integration (optional — Enter to skip)",
      options: promptOptions(editorOptions),
      initialValues,
      required: false,
    });
    if (cancelled(editors)) return editors;
    const conflict = editorTargetsConflict(editors);
    if (conflict) {
      prompts.note(conflictNote(conflict), "Incompatible editors");
      continue;
    }
    return editors;
  }
}

/**
 * Prompts for the deployment target, re-asking immediately when the chosen
 * forms integration needs a server runtime that a static target cannot provide.
 * Deployment is the second half of the pair, so this is the deciding step.
 */
async function promptDeployment(
  prompts: InteractivePrompts,
  forms: string,
  initialValue: (typeof deploymentOptions)[number],
): Promise<(typeof deploymentOptions)[number] | symbol> {
  while (true) {
    const deployment = await prompts.select({
      message: "Deployment target",
      options: promptOptions(deploymentOptions),
      initialValue,
    });
    if (cancelled(deployment)) return deployment;
    const conflict = serverRuntimeFormsConflict(forms, deployment);
    if (conflict) {
      prompts.note(conflictNote(conflict), "Incompatible deployment target");
      continue;
    }
    return deployment;
  }
}

export async function runNonInteractive(
  options: CliOptions,
  generator: Generate = generateAndFinish,
): Promise<number> {
  if (!options.yes) {
    log.error("Non-interactive generation requires --yes.");
    return 2;
  }
  return generateProject(configurationFrom(options), generator);
}
export async function runInteractive(
  generator: Generate = generateAndFinish,
  prompts: InteractivePrompts = defaultPrompts,
): Promise<number> {
  prompts.intro(`${astroStackWordmark()} — Set your coordinates.`);
  const defaults = mergeProjectConfiguration();
  const name = await prompts.text({
    message: "Project name",
    placeholder: defaults.project.name,
    validate: (value) =>
      value && /^[a-z0-9][a-z0-9-]*$/.test(value)
        ? undefined
        : "Enter lowercase letters, numbers, and hyphens.",
  });
  if (cancelled(name)) return 0;
  const directory = await prompts.text({
    message: "Where should it be created?",
    initialValue: `./${name}`,
    validate: (value) =>
      value?.trim() ? undefined : "Enter an output directory.",
  });
  if (cancelled(directory)) return 0;
  const projectType = await prompts.select({
    message: "What are you building?",
    options: promptOptions(types),
    initialValue: defaults.project.type,
  });
  if (cancelled(projectType)) return 0;
  const packageManager = await prompts.select({
    message: "Package manager",
    options: promptOptions(managers),
    initialValue: defaults.project.packageManager,
  });
  if (cancelled(packageManager)) return 0;
  const agents = await prompts.multiselect({
    message: "Agent instructions (optional — Enter to skip)",
    options: promptOptions(agentOptions),
    initialValues: defaults.developerExperience.agents,
    required: false,
  });
  if (cancelled(agents)) return 0;
  const editors = await promptEditors(
    prompts,
    defaults.developerExperience.editors,
  );
  if (cancelled(editors)) return 0;
  const hooks = await prompts.select({
    message: "Set up a pre-commit hook?",
    options: [
      { value: "yes", label: "Yes — run safe fixes and project checks" },
      { value: "no", label: "No" },
    ],
    initialValue: "no",
  });
  if (cancelled(hooks)) return 0;
  const css = await prompts.select({
    message: "Styling: CSS",
    options: promptOptions(cssOptions),
    initialValue: defaults.styling.css,
  });
  if (cancelled(css)) return 0;
  const typescript = await prompts.select({
    message: "Styling: TypeScript",
    options: promptOptions(tsOptions),
    initialValue: defaults.styling.typescript,
  });
  if (cancelled(typescript)) return 0;
  const tooling = await prompts.multiselect({
    message: "Styling: code-quality tools (Space toggles)",
    options: [
      { value: "eslint", label: "ESLint" },
      { value: "prettier", label: "Prettier" },
      { value: "biome", label: "Biome" },
    ],
    initialValues: ["eslint", "prettier", "biome"],
  });
  if (cancelled(tooling)) return 0;
  const content = await prompts.select({
    message: "Content setup",
    options: promptOptions(contentOptions),
    initialValue: defaults.content.setup,
  });
  if (cancelled(content)) return 0;
  const forms = await prompts.select({
    message: "Forms integration",
    options: promptOptions(formOptions),
    initialValue: defaults.features.forms,
  });
  if (cancelled(forms)) return 0;
  const deployment = await promptDeployment(
    prompts,
    forms,
    defaults.deployment.target,
  );
  if (cancelled(deployment)) return 0;
  const configuration = mergeProjectConfiguration({
    project: { name, directory, type: projectType, packageManager },
    styling: {
      css,
      typescript,
      eslint: tooling.includes("eslint"),
      prettier: tooling.includes("prettier"),
      biome: tooling.includes("biome"),
    },
    content: { setup: content },
    features: { forms },
    deployment: { target: deployment },
    developerExperience: { agents, editors, hooks: hooks === "yes" },
  });
  if (!validateForGeneration(configuration)) return 2;
  prompts.note(
    flightPlan(summarizeProjectConfiguration(configuration)),
    "Flight plan",
  );
  const next = await prompts.select({
    message: "Launch this project?",
    options: [
      { value: "launch", label: "Launch project" },
      { value: "cancel", label: "Cancel" },
    ],
    initialValue: "launch",
  });
  if (cancelled(next) || next === "cancel") {
    prompts.cancel("Launch cancelled. No files were written.");
    return 0;
  }
  return generateProject(configuration, generator);
}
export function createCli(generator: Generate = generateAndFinish): Command {
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
    .option(
      "--agent <target>",
      "Agent instruction target (repeatable)",
      (value: string, previous: string[] = []) => [...previous, value],
      [],
    )
    .option(
      "--editor <target>",
      "Editor integration target (repeatable)",
      (value: string, previous: string[] = []) => [...previous, value],
      [],
    )
    .option("--no-eslint")
    .option("--no-prettier")
    .option("--no-biome")
    .option("--no-git")
    .option("--hooks", "Install a pre-commit hook (requires Git)")
    .option("--no-hooks", "Do not install a pre-commit hook")
    .action(async (options: CliOptions) => {
      process.exitCode = options.nonInteractive
        ? await runNonInteractive(options, generator)
        : await runInteractive(generator);
    });
  return cli;
}
if (import.meta.url === `file://${process.argv[1]}`)
  void createCli().parseAsync();
