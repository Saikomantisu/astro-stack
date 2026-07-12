import { styleText } from "node:util";

const violet = (text: string): string => styleText(["bold", "magenta"], text);
const peach = (text: string): string => styleText(["bold", "yellow"], text);
const soft = (text: string): string => styleText("dim", text);

/** A compact celestial wordmark that fits naturally into a terminal flow. */
export function astroStackWordmark(): string {
  return `${peach("✦")} ${violet("astro")} ${soft("stack")} ${peach("✦")}`;
}

/** A compact completion message for the guided terminal timeline. */
export function projectReadyMessage(projectName: string): string {
  return `${peach("✦ PROJECT READY ✦")}  ${violet(projectName)} is ready for liftoff.`;
}

/** Plain text is deliberate: Clack measures card content before it renders it. */
export function projectReadyCard(
  projectName: string,
  steps: readonly string[],
): string {
  return [
    `${projectName} is ready for liftoff.`,
    "",
    "Next steps",
    ...steps.map((step, index) => `${index + 1}. ${step}`),
  ].join("\n");
}
