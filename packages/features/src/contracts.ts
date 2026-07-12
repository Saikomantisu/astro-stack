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
  destination: string;
  content: string;
}
/** A JavaScript expression rendered without JSON stringification in Astro config. */
export interface AstroConfigExpression {
  readonly type: "astro-config-expression";
  readonly code: string;
}
/** A single, addressable configuration value a feature asks the generator to set. */
export interface FeatureConfigurationChange {
  file: string;
  path: string;
  value: unknown;
  imports?: readonly string[];
}
export interface FeatureLifecycleContext {
  configuration: ProjectConfiguration;
  feature: FeatureDefinition;
}
export interface FeatureLifecycleHooks {
  beforeGenerate?: (context: FeatureLifecycleContext) => void | Promise<void>;
  afterGenerate?: (context: FeatureLifecycleContext) => void | Promise<void>;
}
/** Self-contained behavior contributed by one selectable feature. */
export interface FeatureDefinition {
  id: string;
  isSelected: (configuration: ProjectConfiguration) => boolean;
  dependencies?: readonly FeatureDependency[];
  templates?:
    | readonly FeatureTemplate[]
    | ((configuration: ProjectConfiguration) => readonly FeatureTemplate[]);
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
/** The deterministic plan passed from feature selection to generation. */
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
