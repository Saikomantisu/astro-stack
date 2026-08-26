export {
  defineFeatureCatalog,
  type FeatureCatalog,
  type FeatureSelectionOption,
  featureCatalog,
  getFeatureSelectionOptions,
} from "./catalog.js";
export type {
  AstroConfigExpression,
  FeatureAstroConfigContribution,
  FeatureCapabilityRequirement,
  FeatureCodeContribution,
  FeatureConfigurationChange,
  FeatureConflict,
  FeatureContributions,
  FeatureDefinition,
  FeatureDependency,
  FeatureEnvironmentVariable,
  FeatureIncompatibility,
  FeatureLifecycleContext,
  FeatureLifecycleHooks,
  FeatureResolution,
  FeatureSelection,
  FeatureStarterPageContribution,
  FeatureTemplate,
  ResolvedFeatureAstroConfig,
} from "./contracts.js";
export { defineFeature } from "./define-feature.js";
export { featureRegistry } from "./registry.js";
export { resolveFeatures } from "./resolver.js";
export {
  type FeatureSelectionGroup,
  type FeatureSelectionGroupId,
  featureSelectionGroupIds,
  featureSelectionGroups,
  getFeatureSelectionGroup,
} from "./selection-groups.js";
