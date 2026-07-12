import type {
  ConfigurationIssue,
  ProjectConfiguration,
} from "@astro-stack/utils";

/** A package required by a selected feature in the generated project. */
export interface FeatureDependency {
  name: string;
  version: string;
  type: "dependency" | "devDependency";
}

/** A template file a feature asks the generator to render. */
export interface FeatureTemplate {
  source: string;
  destination: string;
}

/** A single, addressable configuration value a feature asks the generator to set. */
export interface FeatureConfigurationChange {
  file: string;
  path: string;
  value: unknown;
}

/** Hooks are invoked by the generator at its corresponding lifecycle boundary. */
export interface FeatureLifecycleContext {
  configuration: ProjectConfiguration;
  feature: FeatureDefinition;
}

export interface FeatureLifecycleHooks {
  beforeGenerate?: (context: FeatureLifecycleContext) => void | Promise<void>;
  afterGenerate?: (context: FeatureLifecycleContext) => void | Promise<void>;
}

export interface FeatureDefinition {
  /** Globally stable identifier, used in diagnostics and generated plans. */
  id: string;
  /** Returns whether this definition is selected by a complete configuration. */
  isSelected: (configuration: ProjectConfiguration) => boolean;
  dependencies?: readonly FeatureDependency[];
  templates?: readonly FeatureTemplate[];
  configurationChanges?: readonly FeatureConfigurationChange[];
  validate?: (
    configuration: ProjectConfiguration,
  ) => readonly ConfigurationIssue[];
  hooks?: FeatureLifecycleHooks;
}

export interface FeatureConflict {
  kind: "file" | "configuration" | "dependency";
  target: string;
  featureIds: readonly string[];
  message: string;
}

export interface FeatureResolution {
  features: readonly FeatureDefinition[];
  dependencies: readonly FeatureDependency[];
  templates: readonly FeatureTemplate[];
  configurationChanges: readonly FeatureConfigurationChange[];
  hooks: readonly {
    feature: FeatureDefinition;
    hooks: FeatureLifecycleHooks;
  }[];
  errors: readonly ConfigurationIssue[];
  conflicts: readonly FeatureConflict[];
  valid: boolean;
}

function selectedFeature(
  id: string,
  isSelected: FeatureDefinition["isSelected"],
  options: Omit<FeatureDefinition, "id" | "isSelected"> = {},
): FeatureDefinition {
  return { id, isSelected, ...options };
}

function selectionIssue(
  code: string,
  path: string,
  message: string,
  suggestion?: string,
): ConfigurationIssue {
  return {
    level: "error",
    code,
    path,
    message,
    ...(suggestion ? { suggestion } : {}),
  };
}

/**
 * The complete initial registry. Definitions intentionally contain no output
 * yet: base generation and feature implementation phases add only the assets
 * required by their selection without changing the resolver contract.
 */
export const featureRegistry: readonly FeatureDefinition[] = [
  ...(["vanilla", "tailwind"] as const).map((css) =>
    selectedFeature(
      `styling:${css}`,
      (configuration) => configuration.styling.css === css,
    ),
  ),
  ...(["strict", "relaxed"] as const).map((typescript) =>
    selectedFeature(
      `typescript:${typescript}`,
      (configuration) => configuration.styling.typescript === typescript,
    ),
  ),
  selectedFeature(
    "tooling:eslint",
    (configuration) => configuration.styling.eslint,
  ),
  selectedFeature(
    "tooling:prettier",
    (configuration) => configuration.styling.prettier,
  ),
  ...(["none", "markdown", "mdx", "collections"] as const).map((setup) =>
    selectedFeature(
      `content:${setup}`,
      (configuration) => configuration.content.setup === setup,
    ),
  ),
  selectedFeature(
    "forms:none",
    (configuration) => configuration.features.forms === "none",
  ),
  selectedFeature(
    "forms:resend",
    (configuration) => configuration.features.forms === "resend",
    {
      validate: (configuration) =>
        configuration.deployment.target === "static"
          ? [
              selectionIssue(
                "resend-requires-server-runtime",
                "features.forms",
                "Resend requires a server-capable deployment target and cannot be used with static output.",
                "Choose Vercel, Netlify, or Cloudflare, or remove the Resend integration.",
              ),
            ]
          : [],
    },
  ),
  selectedFeature(
    "forms:webhooks",
    (configuration) => configuration.features.forms === "webhooks",
  ),
  ...(["static", "vercel", "netlify", "cloudflare"] as const).map((target) =>
    selectedFeature(
      `deployment:${target}`,
      (configuration) => configuration.deployment.target === target,
    ),
  ),
];

function stableFeatureOrder(
  features: readonly FeatureDefinition[],
): FeatureDefinition[] {
  return [...features].sort((left, right) => left.id.localeCompare(right.id));
}

function addConflict(
  conflicts: FeatureConflict[],
  kind: FeatureConflict["kind"],
  target: string,
  featureIds: readonly string[],
): void {
  conflicts.push({
    kind,
    target,
    featureIds: [...featureIds].sort(),
    message: `Features ${[...featureIds].sort().join(", ")} both change ${target}.`,
  });
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * Resolves selected features into a deterministic, generator-ready plan.
 * Conflicts are reported before any filesystem work begins.
 */
export function resolveFeatures(
  configuration: ProjectConfiguration,
  registry: readonly FeatureDefinition[] = featureRegistry,
): FeatureResolution {
  const features = stableFeatureOrder(
    registry.filter((feature) => feature.isSelected(configuration)),
  );
  const dependencies: FeatureDependency[] = [];
  const templates: FeatureTemplate[] = [];
  const configurationChanges: FeatureConfigurationChange[] = [];
  const hooks: {
    feature: FeatureDefinition;
    hooks: FeatureLifecycleHooks;
  }[] = [];
  const errors: ConfigurationIssue[] = [];
  const conflicts: FeatureConflict[] = [];
  const files = new Map<string, string>();
  const changes = new Map<string, { featureId: string; value: unknown }>();
  const packages = new Map<
    string,
    { featureId: string; dependency: FeatureDependency }
  >();

  for (const feature of features) {
    errors.push(...(feature.validate?.(configuration) ?? []));
    for (const template of feature.templates ?? []) {
      const owner = files.get(template.destination);
      if (owner)
        addConflict(conflicts, "file", template.destination, [
          owner,
          feature.id,
        ]);
      else files.set(template.destination, feature.id);
      templates.push(template);
    }
    for (const change of feature.configurationChanges ?? []) {
      const key = `${change.file}:${change.path}`;
      const existing = changes.get(key);
      if (existing && !sameValue(existing.value, change.value)) {
        addConflict(conflicts, "configuration", key, [
          existing.featureId,
          feature.id,
        ]);
      } else if (!existing)
        changes.set(key, { featureId: feature.id, value: change.value });
      configurationChanges.push(change);
    }
    for (const dependency of feature.dependencies ?? []) {
      const existing = packages.get(dependency.name);
      if (
        existing &&
        (existing.dependency.version !== dependency.version ||
          existing.dependency.type !== dependency.type)
      ) {
        addConflict(conflicts, "dependency", dependency.name, [
          existing.featureId,
          feature.id,
        ]);
      } else if (!existing) {
        packages.set(dependency.name, { featureId: feature.id, dependency });
        dependencies.push(dependency);
      }
    }
    if (feature.hooks) hooks.push({ feature, hooks: feature.hooks });
  }

  return {
    features,
    dependencies,
    templates,
    configurationChanges,
    hooks,
    errors,
    conflicts,
    valid: errors.length === 0 && conflicts.length === 0,
  };
}
