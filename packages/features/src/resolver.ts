import type {
  ConfigurationIssue,
  ProjectConfiguration,
} from "@astro-stack/utils";
import type {
  FeatureAstroConfigContribution,
  FeatureCodeContribution,
  FeatureConfigurationChange,
  FeatureConflict,
  FeatureDefinition,
  FeatureDependency,
  FeatureEnvironmentVariable,
  FeatureLifecycleHooks,
  FeatureResolution,
  FeatureStarterPageContribution,
  FeatureTemplate,
} from "./contracts.js";
import { featureRegistry } from "./registry.js";
import type { FeatureSelectionGroupId } from "./selection-groups.js";

interface Owned<Value> {
  featureId: string;
  value: Value;
}

function stableFeatureOrder(
  features: readonly FeatureDefinition[],
): FeatureDefinition[] {
  return [...features].sort((left, right) => left.id.localeCompare(right.id));
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function addConflict(
  conflicts: FeatureConflict[],
  kind: FeatureConflict["kind"],
  target: string,
  featureIds: readonly string[],
  features: readonly FeatureDefinition[],
): void {
  const sortedFeatureIds = [...featureIds].sort();
  const groups = new Set(
    sortedFeatureIds
      .map(
        (featureId) =>
          features.find((feature) => feature.id === featureId)?.selection
            ?.group,
      )
      .filter((group): group is FeatureSelectionGroupId => group !== undefined),
  );
  const path = groups.size === 1 ? [...groups][0] : undefined;
  conflicts.push({
    kind,
    target,
    featureIds: sortedFeatureIds,
    code: `feature-${kind}-conflict`,
    ...(path ? { path } : {}),
    ...(path
      ? { suggestion: "Choose one of the conflicting selections." }
      : {}),
    message: `Features ${sortedFeatureIds.join(", ")} both change ${target}.`,
  });
}

/** Resolves selected features and rejects conflicts before filesystem work. */
export function resolveFeatures(
  configuration: ProjectConfiguration,
  registry: readonly FeatureDefinition[] = featureRegistry,
): FeatureResolution {
  const features = stableFeatureOrder(
    registry.filter((feature) => feature.isSelected(configuration)),
  );
  const dependencies: FeatureDependency[] = [];
  const templates: FeatureTemplate[] = [];
  const packageScripts: Record<string, string> = {};
  const integrations: FeatureCodeContribution[] = [];
  const vitePlugins: FeatureCodeContribution[] = [];
  const environmentVariables: FeatureEnvironmentVariable[] = [];
  const pnpmBuildDependencies: string[] = [];
  const starterPage: FeatureStarterPageContribution[] = [];
  const projectNotes: string[] = [];
  const configurationChanges: FeatureConfigurationChange[] = [];
  const hooks: {
    feature: FeatureDefinition;
    hooks: FeatureLifecycleHooks;
  }[] = [];
  const errors: ConfigurationIssue[] = [];
  const conflicts: FeatureConflict[] = [];

  const files = new Map<string, string>();
  const legacyChanges = new Map<string, Owned<unknown>>();
  const packages = new Map<string, Owned<FeatureDependency>>();
  const scripts = new Map<string, Owned<string>>();
  const integrationOwners = new Map<string, Owned<FeatureCodeContribution>>();
  const vitePluginOwners = new Map<string, Owned<FeatureCodeContribution>>();
  const environmentOwners = new Map<
    string,
    Owned<FeatureEnvironmentVariable>
  >();
  const starterPageOwners = new Map<
    string,
    Owned<FeatureStarterPageContribution>
  >();
  let outputOwner: Owned<"static" | "server"> | undefined;
  let adapterOwner: Owned<FeatureCodeContribution> | undefined;

  const providedCapabilities = new Set(
    features.flatMap((feature) => [...(feature.provides ?? [])]),
  );
  const selectedFeatureIds = new Set(features.map(({ id }) => id));
  const reportedIncompatibilities = new Set<string>();

  const addTemplates = (
    feature: FeatureDefinition,
    values: readonly FeatureTemplate[],
  ) => {
    for (const template of values) {
      const owner = files.get(template.destination);
      const environmentOwner = environmentOwners.values().next().value as
        | Owned<FeatureEnvironmentVariable>
        | undefined;
      if (owner)
        addConflict(
          conflicts,
          "file",
          template.destination,
          [owner, feature.id],
          features,
        );
      else if (template.destination === ".env.example" && environmentOwner)
        addConflict(
          conflicts,
          "file",
          template.destination,
          [environmentOwner.featureId, feature.id],
          features,
        );
      else files.set(template.destination, feature.id);
      templates.push(template);
    }
  };

  const addDependencies = (
    feature: FeatureDefinition,
    values: readonly FeatureDependency[],
  ) => {
    for (const dependency of values) {
      const existing = packages.get(dependency.name);
      if (existing && !sameValue(existing.value, dependency))
        addConflict(
          conflicts,
          "dependency",
          dependency.name,
          [existing.featureId, feature.id],
          features,
        );
      else if (!existing) {
        packages.set(dependency.name, {
          featureId: feature.id,
          value: dependency,
        });
        dependencies.push(dependency);
      }
    }
  };

  const addNamedCode = (
    feature: FeatureDefinition,
    target: string,
    contribution: FeatureCodeContribution,
    owners: Map<string, Owned<FeatureCodeContribution>>,
    values: FeatureCodeContribution[],
  ) => {
    const existing = owners.get(contribution.id);
    if (existing && !sameValue(existing.value, contribution))
      addConflict(
        conflicts,
        "configuration",
        `${target}.${contribution.id}`,
        [existing.featureId, feature.id],
        features,
      );
    else if (!existing) {
      owners.set(contribution.id, {
        featureId: feature.id,
        value: contribution,
      });
      values.push(contribution);
    }
  };

  const addAstroConfig = (
    feature: FeatureDefinition,
    astroConfig: FeatureAstroConfigContribution | undefined,
  ) => {
    if (!astroConfig) return;
    if (astroConfig.output) {
      const legacyOwner = legacyChanges.get("astro.config.mjs:output");
      if (legacyOwner)
        addConflict(
          conflicts,
          "configuration",
          "astro.config.mjs:output",
          [legacyOwner.featureId, feature.id],
          features,
        );
      else if (outputOwner && outputOwner.value !== astroConfig.output)
        addConflict(
          conflicts,
          "configuration",
          "astro.config.mjs:output",
          [outputOwner.featureId, feature.id],
          features,
        );
      else if (!outputOwner)
        outputOwner = { featureId: feature.id, value: astroConfig.output };
    }
    if (astroConfig.adapter) {
      const legacyOwner = legacyChanges.get("astro.config.mjs:adapter");
      if (legacyOwner)
        addConflict(
          conflicts,
          "configuration",
          "astro.config.mjs:adapter",
          [legacyOwner.featureId, feature.id],
          features,
        );
      else if (
        adapterOwner &&
        !sameValue(adapterOwner.value, astroConfig.adapter)
      )
        addConflict(
          conflicts,
          "configuration",
          "astro.config.mjs:adapter",
          [adapterOwner.featureId, feature.id],
          features,
        );
      else if (!adapterOwner)
        adapterOwner = {
          featureId: feature.id,
          value: astroConfig.adapter,
        };
    }
    for (const integration of astroConfig.integrations ?? []) {
      const legacyOwner = legacyChanges.get("astro.config.mjs:integrations");
      if (legacyOwner)
        addConflict(
          conflicts,
          "configuration",
          "astro.config.mjs:integrations",
          [legacyOwner.featureId, feature.id],
          features,
        );
      addNamedCode(
        feature,
        "astro.config.mjs:integrations",
        integration,
        integrationOwners,
        integrations,
      );
    }
    for (const plugin of astroConfig.vitePlugins ?? []) {
      const legacyOwner = legacyChanges.get("astro.config.mjs:vite.plugins");
      if (legacyOwner)
        addConflict(
          conflicts,
          "configuration",
          "astro.config.mjs:vite.plugins",
          [legacyOwner.featureId, feature.id],
          features,
        );
      addNamedCode(
        feature,
        "astro.config.mjs:vite.plugins",
        plugin,
        vitePluginOwners,
        vitePlugins,
      );
    }
  };

  for (const feature of features) {
    errors.push(...(feature.validate?.(configuration) ?? []));
    for (const requirement of feature.requires ?? [])
      if (!providedCapabilities.has(requirement.capability))
        errors.push({
          level: "error",
          code: requirement.code,
          path: requirement.path,
          message: requirement.message,
          ...(requirement.suggestion
            ? { suggestion: requirement.suggestion }
            : {}),
        });
    for (const incompatibility of feature.incompatibleWith ?? []) {
      if (!selectedFeatureIds.has(incompatibility.featureId)) continue;
      const key = [feature.id, incompatibility.featureId].sort().join(":");
      if (reportedIncompatibilities.has(key)) continue;
      reportedIncompatibilities.add(key);
      errors.push({
        level: "error",
        code: incompatibility.code,
        path: incompatibility.path,
        message: incompatibility.message,
        ...(incompatibility.suggestion
          ? { suggestion: incompatibility.suggestion }
          : {}),
      });
    }

    const contributions = feature.contributions;
    const legacyTemplates =
      typeof feature.templates === "function"
        ? feature.templates(configuration)
        : (feature.templates ?? []);
    const typedTemplates =
      typeof contributions?.templates === "function"
        ? contributions.templates(configuration)
        : (contributions?.templates ?? []);
    addTemplates(feature, [...legacyTemplates, ...typedTemplates]);

    for (const change of feature.configurationChanges ?? []) {
      const key = `${change.file}:${change.path}`;
      const existing = legacyChanges.get(key);
      const typedOwner =
        change.file === "package.json" && change.path.startsWith("scripts.")
          ? scripts.get(change.path.slice("scripts.".length))
          : change.file === "astro.config.mjs" && change.path === "output"
            ? outputOwner
            : change.file === "astro.config.mjs" && change.path === "adapter"
              ? adapterOwner
              : change.file === "astro.config.mjs" &&
                  change.path === "integrations"
                ? integrationOwners.values().next().value
                : change.file === "astro.config.mjs" &&
                    change.path === "vite.plugins"
                  ? vitePluginOwners.values().next().value
                  : undefined;
      if (typedOwner)
        addConflict(
          conflicts,
          "configuration",
          key,
          [typedOwner.featureId, feature.id],
          features,
        );
      else if (existing && !sameValue(existing.value, change.value))
        addConflict(
          conflicts,
          "configuration",
          key,
          [existing.featureId, feature.id],
          features,
        );
      else if (!existing)
        legacyChanges.set(key, {
          featureId: feature.id,
          value: change.value,
        });
      configurationChanges.push(change);
    }

    addDependencies(feature, [
      ...(feature.dependencies ?? []),
      ...(contributions?.dependencies ?? []),
    ]);

    for (const [script, value] of Object.entries(
      contributions?.packageScripts ?? {},
    )) {
      const existing = scripts.get(script);
      const legacyOwner = legacyChanges.get(`package.json:scripts.${script}`);
      if (legacyOwner)
        addConflict(
          conflicts,
          "configuration",
          `package.json:scripts.${script}`,
          [legacyOwner.featureId, feature.id],
          features,
        );
      else if (existing && existing.value !== value)
        addConflict(
          conflicts,
          "configuration",
          `package.json:scripts.${script}`,
          [existing.featureId, feature.id],
          features,
        );
      else if (!existing) {
        scripts.set(script, { featureId: feature.id, value });
        packageScripts[script] = value;
      }
    }

    addAstroConfig(feature, contributions?.astroConfig);

    for (const variable of contributions?.environmentVariables ?? []) {
      const existing = environmentOwners.get(variable.name);
      const fileOwner = files.get(".env.example");
      if (fileOwner)
        addConflict(
          conflicts,
          "file",
          ".env.example",
          [fileOwner, feature.id],
          features,
        );
      else if (existing && !sameValue(existing.value, variable))
        addConflict(
          conflicts,
          "configuration",
          `.env.example:${variable.name}`,
          [existing.featureId, feature.id],
          features,
        );
      else if (!existing) {
        environmentOwners.set(variable.name, {
          featureId: feature.id,
          value: variable,
        });
        environmentVariables.push(variable);
      }
    }
    for (const dependency of contributions?.pnpmBuildDependencies ?? [])
      if (!pnpmBuildDependencies.includes(dependency))
        pnpmBuildDependencies.push(dependency);
    for (const contribution of contributions?.starterPage ?? []) {
      const key = `${contribution.slot}:${contribution.id}`;
      const existing = starterPageOwners.get(key);
      if (existing && !sameValue(existing.value, contribution))
        addConflict(
          conflicts,
          "configuration",
          `starter-page:${key}`,
          [existing.featureId, feature.id],
          features,
        );
      else if (!existing) {
        starterPageOwners.set(key, {
          featureId: feature.id,
          value: contribution,
        });
        starterPage.push(contribution);
      }
    }

    const notes =
      typeof contributions?.projectNotes === "function"
        ? contributions.projectNotes(configuration)
        : (contributions?.projectNotes ?? []);
    for (const note of notes)
      if (!projectNotes.includes(note)) projectNotes.push(note);
    if (feature.hooks) hooks.push({ feature, hooks: feature.hooks });
  }

  return {
    features,
    dependencies,
    templates,
    packageScripts,
    astroConfig: {
      ...(outputOwner ? { output: outputOwner.value } : {}),
      ...(adapterOwner ? { adapter: adapterOwner.value } : {}),
      integrations,
      vitePlugins,
    },
    environmentVariables,
    pnpmBuildDependencies,
    starterPage,
    projectNotes,
    configurationChanges,
    hooks,
    errors,
    conflicts,
    valid: errors.length === 0 && conflicts.length === 0,
  };
}
