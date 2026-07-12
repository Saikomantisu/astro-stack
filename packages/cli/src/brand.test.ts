import { stripVTControlCharacters } from "node:util";

import { describe, expect, it } from "vitest";

import {
  astroStackWordmark,
  flightPlan,
  projectReadyCard,
  projectReadyMessage,
} from "./brand.js";

describe("CLI brand treatment", () => {
  it("keeps the wordmark meaningful when terminal colors are removed", () => {
    expect(stripVTControlCharacters(astroStackWordmark())).toBe(
      "✦ astro stack ✦",
    );
  });

  it("combines a compact completion message with a project name", () => {
    expect(stripVTControlCharacters(projectReadyMessage("launch-site"))).toBe(
      "✦ PROJECT READY ✦  launch-site is ready for liftoff.",
    );
  });

  it("keeps card content free from terminal color codes", () => {
    const card = projectReadyCard(["cd ./launch-site", "pnpm dev"]);
    expect(card).toBe("Next steps\n1. cd ./launch-site\n2. pnpm dev");
    expect(stripVTControlCharacters(card)).toBe(card);
  });

  it("syntax-highlights the flight plan without changing its content", () => {
    const plan = flightPlan({
      project: "launch-site",
      location: "./launch-site",
      projectType: "marketing",
      packageManager: "pnpm",
      styling: "tailwind; TypeScript (strict)",
      content: "mdx",
      forms: "none",
      deployment: "vercel",
      agents: "none",
      editors: "none",
    });

    expect(stripVTControlCharacters(plan)).toBe(
      [
        "project: launch-site",
        "location: ./launch-site",
        "projectType: marketing",
        "packageManager: pnpm",
        "styling: tailwind; TypeScript (strict)",
        "content: mdx",
        "forms: none",
        "deployment: vercel",
        "agents: none",
        "editors: none",
      ].join("\n"),
    );
  });
});
