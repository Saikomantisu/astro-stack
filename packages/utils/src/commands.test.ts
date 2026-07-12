import { describe, expect, it } from "vitest";

import {
  generatedProjectCommands,
  mergeProjectConfiguration,
} from "./index.js";

describe("generated project commands", () => {
  it("uses the selected package manager and selected health checks", () => {
    expect(
      generatedProjectCommands(
        mergeProjectConfiguration({
          project: { packageManager: "npm" },
          styling: { eslint: false, prettier: false, biome: true },
        }),
      ),
    ).toEqual([
      expect.objectContaining({ script: "dev", command: "npm run dev" }),
      expect.objectContaining({ script: "build", command: "npm run build" }),
      expect.objectContaining({
        script: "preview",
        command: "npm run preview",
      }),
      expect.objectContaining({
        script: "typecheck",
        command: "npm run typecheck",
      }),
      expect.objectContaining({ script: "check", command: "npm run check" }),
    ]);
  });
});
