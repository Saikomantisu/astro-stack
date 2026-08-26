import type { FeatureDefinition } from "./contracts.js";
import { cmsFeatures } from "./features/cms.js";
import { contentFeatures } from "./features/content.js";
import { deploymentFeatures } from "./features/deployment.js";
import { developerExperienceFeatures } from "./features/developer-experience.js";
import { formFeatures } from "./features/forms.js";
import { stylingFeatures } from "./features/styling.js";
import { toolingFeatures } from "./features/tooling.js";

/** The built-in definitions consumed by the catalog and generator. */
export const featureRegistry: readonly FeatureDefinition[] = [
  ...developerExperienceFeatures,
  ...stylingFeatures,
  ...toolingFeatures,
  ...contentFeatures,
  ...cmsFeatures,
  ...formFeatures,
  ...deploymentFeatures,
];
