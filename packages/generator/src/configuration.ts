import type { FeatureConfigurationChange } from "@astro-stack/features";

import type { ProjectTemplate } from "./templates.js";

type ConfigurationValue = Record<string, unknown>;

function isObject(value: unknown): value is ConfigurationValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function applyPath(
  target: ConfigurationValue,
  path: string,
  value: unknown,
): void {
  const segments = path.split(".");
  if (segments.some((segment) => segment.length === 0))
    throw new Error(`Invalid configuration path: ${path}`);
  let current = target;
  for (const segment of segments.slice(0, -1)) {
    const existing = current[segment];
    if (existing === undefined) current[segment] = {};
    else if (!isObject(existing))
      throw new Error(`Cannot merge configuration path: ${path}`);
    current = current[segment] as ConfigurationValue;
  }
  const finalSegment = segments[segments.length - 1];
  if (finalSegment === undefined)
    throw new Error(`Invalid configuration path: ${path}`);
  current[finalSegment] = value;
}

function changesByFile(
  changes: readonly FeatureConfigurationChange[],
): ReadonlyMap<string, readonly FeatureConfigurationChange[]> {
  const grouped = new Map<string, FeatureConfigurationChange[]>();
  for (const change of changes) {
    const fileChanges = grouped.get(change.file) ?? [];
    fileChanges.push(change);
    grouped.set(change.file, fileChanges);
  }
  return grouped;
}

function mergeJson(
  content: string,
  changes: readonly FeatureConfigurationChange[],
): string {
  const configuration: unknown = JSON.parse(content);
  if (!isObject(configuration))
    throw new Error("JSON configuration must contain an object.");
  for (const change of changes)
    applyPath(configuration, change.path, change.value);
  return `${JSON.stringify(configuration, null, 2)}\n`;
}

function mergeAstroConfig(
  content: string,
  changes: readonly FeatureConfigurationChange[],
): string {
  const configuration: ConfigurationValue = {};
  for (const change of changes)
    applyPath(configuration, change.path, change.value);
  const rendered = JSON.stringify(configuration, null, 2);
  if (!content.includes("defineConfig({})"))
    throw new Error(
      "Astro configuration must use the generated defineConfig({}) placeholder.",
    );
  return content.replace("defineConfig({})", `defineConfig(${rendered})`);
}

/**
 * Applies a conflict-free feature plan to generated configuration templates.
 * JSON configuration is structurally merged, while Astro configuration is
 * rendered once from all selected feature changes.
 */
export function applyConfigurationChanges(
  templates: readonly ProjectTemplate[],
  changes: readonly FeatureConfigurationChange[],
): ProjectTemplate[] {
  const grouped = changesByFile(changes);
  const knownFiles = new Set(templates.map(({ destination }) => destination));
  for (const file of grouped.keys())
    if (!knownFiles.has(file))
      throw new Error(`Configuration target is not generated: ${file}`);
  return templates.map((template) => {
    const fileChanges = grouped.get(template.destination);
    if (!fileChanges) return template;
    if (template.destination.endsWith(".json"))
      return { ...template, content: mergeJson(template.content, fileChanges) };
    if (template.destination === "astro.config.mjs")
      return {
        ...template,
        content: mergeAstroConfig(template.content, fileChanges),
      };
    throw new Error(`Unsupported configuration file: ${template.destination}`);
  });
}
