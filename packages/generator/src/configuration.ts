import type {
  AstroConfigExpression,
  FeatureConfigurationChange,
  FeatureDependency,
} from "@astro-stack/features";

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
  const imports = new Set<string>();
  for (const change of changes) {
    applyPath(configuration, change.path, change.value);
    for (const statement of change.imports ?? []) imports.add(statement);
  }
  const rendered = containsAstroConfigExpression(configuration)
    ? renderAstroConfiguration(configuration)
    : JSON.stringify(configuration, null, 2);
  if (!content.includes("defineConfig({})"))
    throw new Error(
      "Astro configuration must use the generated defineConfig({}) placeholder.",
    );
  const importBlock = [...imports].join("\n");
  const withImports = importBlock
    ? content.replace(
        "\n\nexport default",
        `\n${importBlock}\n\nexport default`,
      )
    : content;
  return withImports.replace("defineConfig({})", `defineConfig(${rendered})`);
}

function isAstroConfigExpression(
  value: unknown,
): value is AstroConfigExpression {
  return (
    isObject(value) &&
    value.type === "astro-config-expression" &&
    typeof value.code === "string"
  );
}

function containsAstroConfigExpression(value: unknown): boolean {
  if (isAstroConfigExpression(value)) return true;
  if (Array.isArray(value)) return value.some(containsAstroConfigExpression);
  return (
    isObject(value) && Object.values(value).some(containsAstroConfigExpression)
  );
}

function renderAstroConfiguration(value: unknown, depth = 0): string {
  if (isAstroConfigExpression(value)) return value.code;
  if (Array.isArray(value))
    return `[${value
      .map((item) => renderAstroConfiguration(item, depth + 1))
      .join(", ")}]`;
  if (isObject(value)) {
    const indentation = "  ".repeat(depth);
    const childIndentation = "  ".repeat(depth + 1);
    return `{\n${Object.entries(value)
      .map(
        ([key, item]) =>
          `${childIndentation}${JSON.stringify(key)}: ${renderAstroConfiguration(item, depth + 1)}`,
      )
      .join(",\n")}\n${indentation}}`;
  }
  return JSON.stringify(value);
}

/** Adds selected feature packages to the generated package manifest. */
export function applyDependencies(
  templates: readonly ProjectTemplate[],
  dependencies: readonly FeatureDependency[],
): ProjectTemplate[] {
  if (dependencies.length === 0) return [...templates];
  return templates.map((template) => {
    if (template.destination !== "package.json") return template;
    const manifest: unknown = JSON.parse(template.content);
    if (!isObject(manifest))
      throw new Error("package.json must contain an object.");
    for (const dependency of dependencies) {
      const section =
        dependency.type === "dependency" ? "dependencies" : "devDependencies";
      const existing = manifest[section];
      if (!isObject(existing)) manifest[section] = {};
      (manifest[section] as ConfigurationValue)[dependency.name] =
        dependency.version;
    }
    return { ...template, content: `${JSON.stringify(manifest, null, 2)}\n` };
  });
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
