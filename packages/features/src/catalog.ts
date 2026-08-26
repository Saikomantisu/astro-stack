import type { FeatureDefinition } from "./contracts.js";
import { featureRegistry } from "./registry.js";
import {
  type FeatureSelectionGroup,
  type FeatureSelectionGroupId,
  featureSelectionGroups,
  getFeatureSelectionGroup,
} from "./selection-groups.js";

export interface FeatureSelectionOption<Value extends string = string> {
  value: Value;
  label: string;
  hint?: string;
  featureId: string;
}

export interface FeatureCatalog {
  groups: readonly FeatureSelectionGroup[];
  features: readonly FeatureDefinition[];
}

export function defineFeatureCatalog(catalog: FeatureCatalog): FeatureCatalog {
  const featureIds = new Set<string>();
  for (const feature of catalog.features) {
    if (featureIds.has(feature.id))
      throw new Error(`Feature ID ${feature.id} is registered more than once.`);
    featureIds.add(feature.id);
    if (
      feature.selection &&
      !catalog.groups.some(({ id }) => id === feature.selection?.group)
    )
      throw new Error(
        `Feature ${feature.id} uses unknown selection group ${feature.selection.group}.`,
      );
  }
  for (const group of catalog.groups)
    for (const value of group.values) {
      const matches = catalog.features.filter(
        (feature) =>
          feature.selection?.group === group.id &&
          feature.selection.value === value,
      );
      if (matches.length !== 1)
        throw new Error(
          `Feature selection ${group.id}:${value} must have exactly one definition.`,
        );
    }
  return catalog;
}

/** Returns catalog labels in the stable value order declared by a group. */
export function getFeatureSelectionOptions<Value extends string = string>(
  groupId: FeatureSelectionGroupId,
  registry: readonly FeatureDefinition[] = featureRegistry,
): FeatureSelectionOption<Value>[] {
  const group = getFeatureSelectionGroup(groupId);
  const selections = registry.filter(
    (feature) => feature.selection?.group === groupId,
  );
  return group.values.map((value) => {
    const matches = selections.filter(
      (feature) => feature.selection?.value === value,
    );
    if (matches.length !== 1)
      throw new Error(
        `Feature selection ${groupId}:${value} must have exactly one definition.`,
      );
    const feature = matches[0];
    const selection = feature?.selection;
    if (!feature || !selection)
      throw new Error(`Feature selection metadata is missing for ${groupId}.`);
    return {
      value: selection.value as Value,
      label: selection.label,
      ...(selection.hint ? { hint: selection.hint } : {}),
      featureId: feature.id,
    };
  });
}

export const featureCatalog = defineFeatureCatalog({
  groups: featureSelectionGroups,
  features: featureRegistry,
});
