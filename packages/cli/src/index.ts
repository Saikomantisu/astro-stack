#!/usr/bin/env node

import { readFileSync, realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  type FeatureSelectionGroupId,
  getFeatureSelectionGroup,
  getFeatureSelectionOptions,
  resolveFeatures,
} from "@astro-stack/features";
import {
  mergeProjectConfiguration,
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
  cmsOptions,
  configurationFrom,
  contentOptions,
  cssOptions,
  deploymentOptions,
  editorOptions,
  formOptions,
  type Generate,
  managers,
  toolingOptions,
  tsOptions,
  types,
} from "./options.js";

const { version } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };

export type { CliOptions } from "./options.js";

export function isDirectExecution(
  moduleUrl: string,
  entryPoint = process.argv[1],
): boolean {
  return (
    entryPoint !== undefined &&
    moduleUrl === pathToFileURL(realpathSync(entryPoint)).href
  );
}

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
  blank: "Blank project",
  npm: "npm",
  pnpm: "pnpm",
  yarn: "Yarn",
  bun: "Bun",
};

function promptOptions<Value extends string>(
  values: readonly Value[],
): PromptOption<Value>[] {
  return values.map((value) => ({ value, label: labels[value] ?? value }));
}

function featurePromptOptions<Value extends string>(
  groupId: FeatureSelectionGroupId,
  values: readonly Value[],
): PromptOption<Value>[] {
  const options = getFeatureSelectionOptions<Value>(groupId);
  if (
    options.length !== values.length ||
    options.some(({ value }, index) => value !== values[index])
  )
    throw new Error(`CLI values do not match the ${groupId} feature catalog.`);
  return options.map(({ value, label, hint }) => ({
    value,
    label,
    ...(hint ? { hint } : {}),
  }));
}

function featurePromptMessage(groupId: FeatureSelectionGroupId): string {
  return getFeatureSelectionGroup(groupId).prompt.message;
}

function featureCliMetadata(groupId: FeatureSelectionGroupId): {
  flag: string;
  description: string;
} {
  const metadata = getFeatureSelectionGroup(groupId).cli;
  if (!metadata)
    throw new Error(`Feature selection group ${groupId} has no CLI option.`);
  return metadata;
}

function featureChoiceOption(cli: Command, groupId: FeatureSelectionGroupId) {
  const metadata = featureCliMetadata(groupId);
  return cli
    .createOption(metadata.flag, metadata.description)
    .choices(getFeatureSelectionOptions(groupId).map(({ value }) => value));
}

function featureProblem(
  groupId: FeatureSelectionGroupId,
  configuration: ReturnType<typeof mergeProjectConfiguration>,
): { message: string; suggestion?: string } | undefined {
  const resolution = resolveFeatures(configuration);
  return (
    resolution.errors.find(({ path }) => path === groupId) ??
    resolution.conflicts.find(({ path }) => path === groupId)
  );
}

/** Renders a conflict's message and its suggested fix as a single note body. */
const conflictNote = (conflict: { message: string; suggestion?: string }) =>
  `${conflict.message}${conflict.suggestion ? ` ${conflict.suggestion}` : ""}`;

/**
 * Prompts for editor integrations, re-asking immediately if the selection is
 * invalid so the conflict surfaces at this step instead of the final summary.
 * VS Code and Cursor both own `.vscode` workspace config, so only one may win.
 */
async function promptEditors(
  prompts: InteractivePrompts,
  initialValues: (typeof editorOptions)[number][],
): Promise<(typeof editorOptions)[number][] | symbol> {
  const group = getFeatureSelectionGroup("developerExperience.editors");
  while (true) {
    const editors = await prompts.multiselect({
      message: group.prompt.message,
      options: featurePromptOptions(group.id, editorOptions),
      initialValues,
      required: false,
    });
    if (cancelled(editors)) return editors;
    const conflict = featureProblem(
      group.id,
      mergeProjectConfiguration({ developerExperience: { editors } }),
    );
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
  forms: (typeof formOptions)[number],
  initialValue: (typeof deploymentOptions)[number],
): Promise<(typeof deploymentOptions)[number] | symbol> {
  const group = getFeatureSelectionGroup("deployment.target");
  while (true) {
    const deployment = await prompts.select({
      message: group.prompt.message,
      options: featurePromptOptions(group.id, deploymentOptions),
      initialValue,
    });
    if (cancelled(deployment)) return deployment;
    const conflict = featureProblem(
      "features.forms",
      mergeProjectConfiguration({
        features: { forms },
        deployment: { target: deployment },
      }),
    );
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
    message: featurePromptMessage("developerExperience.agents"),
    options: featurePromptOptions("developerExperience.agents", agentOptions),
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
    message: featurePromptMessage("styling.css"),
    options: featurePromptOptions("styling.css", cssOptions),
    initialValue: defaults.styling.css,
  });
  if (cancelled(css)) return 0;
  const typescript = await prompts.select({
    message: featurePromptMessage("styling.typescript"),
    options: featurePromptOptions("styling.typescript", tsOptions),
    initialValue: defaults.styling.typescript,
  });
  if (cancelled(typescript)) return 0;
  const tooling = await prompts.multiselect({
    message: featurePromptMessage("styling.tooling"),
    options: featurePromptOptions("styling.tooling", toolingOptions),
    initialValues: [...toolingOptions],
  });
  if (cancelled(tooling)) return 0;
  const content =
    projectType === "blog" || projectType === "documentation"
      ? "none"
      : await prompts.select({
          message: featurePromptMessage("content.setup"),
          options: featurePromptOptions("content.setup", contentOptions),
          initialValue: defaults.content.setup,
        });
  if (cancelled(content)) return 0;
  const cms =
    projectType === "blog" ||
    projectType === "documentation" ||
    content !== "none"
      ? await prompts.select({
          message: featurePromptMessage("content.cms"),
          options: featurePromptOptions("content.cms", cmsOptions),
          initialValue: defaults.content.cms,
        })
      : defaults.content.cms;
  if (cancelled(cms)) return 0;
  const forms = await prompts.select({
    message: featurePromptMessage("features.forms"),
    options: featurePromptOptions("features.forms", formOptions),
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
    content: { setup: content, cms },
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
  const agentOption = featureCliMetadata("developerExperience.agents");
  const editorOption = featureCliMetadata("developerExperience.editors");
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
    .addOption(featureChoiceOption(cli, "styling.css"))
    .addOption(featureChoiceOption(cli, "styling.typescript"))
    .addOption(featureChoiceOption(cli, "content.setup"))
    .addOption(featureChoiceOption(cli, "content.cms"))
    .addOption(featureChoiceOption(cli, "features.forms"))
    .addOption(featureChoiceOption(cli, "deployment.target"))
    .option(
      agentOption.flag,
      agentOption.description,
      (value: string, previous: string[] = []) => [...previous, value],
      [],
    )
    .option(
      editorOption.flag,
      editorOption.description,
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
if (isDirectExecution(import.meta.url)) void createCli().parseAsync();
