import type {
  ConfigurationIssue,
  ProjectConfiguration,
  ProjectType,
} from "@astro-stack/utils";
import type { FeatureSelectionGroupId } from "./selection-groups.js";

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
/** A named expression that the generator can import and compose. */
export interface FeatureCodeContribution {
  id: string;
  expression: string;
  imports?: readonly string[];
}
/** Structured Astro configuration owned by a feature. */
export interface FeatureAstroConfigContribution {
  output?: "static" | "server";
  adapter?: FeatureCodeContribution;
  integrations?: readonly FeatureCodeContribution[];
  vitePlugins?: readonly FeatureCodeContribution[];
}
/** An environment variable documented in the generated `.env.example`. */
export interface FeatureEnvironmentVariable {
  name: string;
  example: string;
  comment?: string;
}
/** Markup a feature adds to a supported starter page location. */
export interface FeatureStarterPageContribution {
  id: string;
  slot: "contact";
  projectTypes: readonly ProjectType[];
  imports?: readonly string[];
  content: string;
}
/** Generator inputs that can be combined without editing another feature. */
export interface FeatureContributions {
  dependencies?: readonly FeatureDependency[];
  templates?:
    | readonly FeatureTemplate[]
    | ((configuration: ProjectConfiguration) => readonly FeatureTemplate[]);
  packageScripts?: Readonly<Record<string, string>>;
  astroConfig?: FeatureAstroConfigContribution;
  environmentVariables?: readonly FeatureEnvironmentVariable[];
  pnpmBuildDependencies?: readonly string[];
  starterPage?: readonly FeatureStarterPageContribution[];
  projectNotes?:
    | readonly string[]
    | ((configuration: ProjectConfiguration) => readonly string[]);
}
/** A single, addressable configuration value a feature asks the generator to set. */
export interface FeatureConfigurationChange {
  /** JSON files and the generated Astro config are the supported merge targets. */
  file: `${string}.json` | "astro.config.mjs";
  path: string;
  value: unknown;
  imports?: readonly string[];
}
export interface FeatureLifecycleContext {
  configuration: ProjectConfiguration;
  feature: FeatureDefinition;
}
export interface FeatureLifecycleHooks {
  /** Runs after the complete plan is validated and before any files are written. */
  beforeGenerate?: (context: FeatureLifecycleContext) => void | Promise<void>;
  /** Runs after all project files have been written successfully. */
  afterGenerate?: (context: FeatureLifecycleContext) => void | Promise<void>;
}
export interface FeatureSelection {
  group: FeatureSelectionGroupId;
  value: string;
  label: string;
  hint?: string;
}
export interface FeatureCapabilityRequirement {
  capability: string;
  code: string;
  path: string;
  message: string;
  suggestion?: string;
}
export interface FeatureIncompatibility {
  featureId: string;
  code: string;
  path: string;
  message: string;
  suggestion?: string;
}
/** Self-contained behavior contributed by one selectable feature. */
export interface FeatureDefinition {
  id: string;
  selection?: FeatureSelection;
  isSelected: (configuration: ProjectConfiguration) => boolean;
  /** Structured contributions used by built-in and new feature definitions. */
  contributions?: FeatureContributions;
  provides?: readonly string[];
  requires?: readonly FeatureCapabilityRequirement[];
  incompatibleWith?: readonly FeatureIncompatibility[];
  /** @deprecated Put new generator inputs under `contributions`. */
  dependencies?: readonly FeatureDependency[];
  /** @deprecated Put new generator inputs under `contributions`. */
  templates?:
    | readonly FeatureTemplate[]
    | ((configuration: ProjectConfiguration) => readonly FeatureTemplate[]);
  /** @deprecated Use typed contributions for new features. */
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
  code?: string;
  path?: string;
  suggestion?: string;
  message: string;
}
export interface ResolvedFeatureAstroConfig {
  output?: "static" | "server";
  adapter?: FeatureCodeContribution;
  integrations: readonly FeatureCodeContribution[];
  vitePlugins: readonly FeatureCodeContribution[];
}
/** The deterministic plan passed from feature selection to generation. */
export interface FeatureResolution {
  features: readonly FeatureDefinition[];
  dependencies: readonly FeatureDependency[];
  templates: readonly FeatureTemplate[];
  packageScripts: Readonly<Record<string, string>>;
  astroConfig: ResolvedFeatureAstroConfig;
  environmentVariables: readonly FeatureEnvironmentVariable[];
  pnpmBuildDependencies: readonly string[];
  starterPage: readonly FeatureStarterPageContribution[];
  projectNotes: readonly string[];
  /** Configuration changes from legacy feature definitions. */
  configurationChanges: readonly FeatureConfigurationChange[];
  hooks: readonly {
    feature: FeatureDefinition;
    hooks: FeatureLifecycleHooks;
  }[];
  errors: readonly ConfigurationIssue[];
  conflicts: readonly FeatureConflict[];
  valid: boolean;
}
