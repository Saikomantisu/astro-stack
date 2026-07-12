import { stripVTControlCharacters } from "node:util";

import { describe, expect, it } from "vitest";

import {
  astroStackWordmark,
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
    const card = projectReadyCard("launch-site", [
      "cd ./launch-site",
      "pnpm dev",
    ]);
    expect(card).toBe(
      "launch-site is ready for liftoff.\n\nNext steps\n1. cd ./launch-site\n2. pnpm dev",
    );
    expect(stripVTControlCharacters(card)).toBe(card);
  });
});
