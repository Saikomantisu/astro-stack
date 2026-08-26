import type { FeatureDefinition } from "./contracts.js";

/** Keeps feature declarations explicit while preserving their public contract. */
export function defineFeature(
  definition: FeatureDefinition,
): FeatureDefinition {
  return definition;
}
