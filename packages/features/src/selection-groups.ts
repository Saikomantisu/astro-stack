import {
  agentInstructionTargets,
  codeQualityTools,
  contentSetups,
  cssFrameworks,
  deploymentTargets,
  editorTargets,
  formIntegrations,
  typeScriptPreferences,
} from "@astro-stack/utils";

export const featureSelectionGroupIds = [
  "developerExperience.agents",
  "developerExperience.editors",
  "styling.css",
  "styling.typescript",
  "styling.tooling",
  "content.setup",
  "features.forms",
  "deployment.target",
] as const;

export type FeatureSelectionGroupId = (typeof featureSelectionGroupIds)[number];

export interface FeatureSelectionGroup {
  id: FeatureSelectionGroupId;
  kind: "single" | "multiple";
  values: readonly string[];
  prompt: {
    message: string;
    optional?: boolean;
  };
  cli?: {
    flag: string;
    description: string;
  };
}

export const featureSelectionGroups = [
  {
    id: "developerExperience.agents",
    kind: "multiple",
    values: agentInstructionTargets,
    prompt: {
      message: "Agent instructions, press Enter to skip",
      optional: true,
    },
    cli: {
      flag: "--agent <target>",
      description: "Agent instruction target (repeatable)",
    },
  },
  {
    id: "developerExperience.editors",
    kind: "multiple",
    values: editorTargets,
    prompt: {
      message: "Editor integration, press Enter to skip",
      optional: true,
    },
    cli: {
      flag: "--editor <target>",
      description: "Editor integration target (repeatable)",
    },
  },
  {
    id: "styling.css",
    kind: "single",
    values: cssFrameworks,
    prompt: { message: "Styling: CSS" },
    cli: { flag: "--css <framework>", description: "CSS framework" },
  },
  {
    id: "styling.typescript",
    kind: "single",
    values: typeScriptPreferences,
    prompt: { message: "Styling: TypeScript" },
    cli: {
      flag: "--typescript <preference>",
      description: "TypeScript preference",
    },
  },
  {
    id: "styling.tooling",
    kind: "multiple",
    values: codeQualityTools,
    prompt: { message: "Styling: code-quality tools (Space toggles)" },
  },
  {
    id: "content.setup",
    kind: "single",
    values: contentSetups,
    prompt: { message: "Content setup" },
    cli: { flag: "--content <setup>", description: "Content setup" },
  },
  {
    id: "features.forms",
    kind: "single",
    values: formIntegrations,
    prompt: { message: "Forms integration" },
    cli: {
      flag: "--forms <integration>",
      description: "Forms integration",
    },
  },
  {
    id: "deployment.target",
    kind: "single",
    values: deploymentTargets,
    prompt: { message: "Deployment target" },
    cli: {
      flag: "--deployment <target>",
      description: "Deployment target",
    },
  },
] as const satisfies readonly FeatureSelectionGroup[];

export function getFeatureSelectionGroup(
  id: FeatureSelectionGroupId,
): FeatureSelectionGroup {
  const group = featureSelectionGroups.find((candidate) => candidate.id === id);
  if (!group) throw new Error(`Unknown feature selection group: ${id}`);
  return group;
}
