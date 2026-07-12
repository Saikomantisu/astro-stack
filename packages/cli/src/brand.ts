import { styleText } from "node:util";

import type { ProjectConfigurationSummary } from "@astro-stack/utils";

const violet = (text: string): string => styleText(["bold", "magenta"], text);
const peach = (text: string): string => styleText(["bold", "yellow"], text);
const soft = (text: string): string => styleText("dim", text);
const key = (text: string): string => styleText(["bold", "cyan"], text);

/** A compact celestial wordmark that fits naturally into a terminal flow. */
export function astroStackWordmark(): string {
  return `${peach("✦")} ${violet("astro")} ${soft("stack")} ${peach("✦")}`;
}

/** A compact completion message for the guided terminal timeline. */
export function projectReadyMessage(projectName: string): string {
  return `${peach("✦ PROJECT READY ✦")}  ${violet(projectName)} is ready for liftoff.`;
}

/** Clack measures ANSI-styled content safely, so this keeps next steps readable. */
export function projectReadyCard(
  steps: readonly string[],
  notes: readonly string[] = [],
): string {
  const lines = [
    "Next steps",
    ...steps.map((step, index) => `${index + 1}. ${step}`),
  ];
  if (notes.length > 0)
    lines.push("", ...notes.map((note) => `${soft("Note:")} ${note}`));
  return lines.join("\n");
}

/** Formats the selected configuration like a small syntax-highlighted manifest. */
export function flightPlan(summary: ProjectConfigurationSummary): string {
  return Object.entries(summary)
    .map(([name, value]) => `${key(name)}${soft(":")} ${violet(String(value))}`)
    .join("\n");
}
