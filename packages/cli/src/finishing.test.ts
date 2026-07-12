import { mergeProjectConfiguration } from "@astro-stack/utils";
import { describe, expect, it } from "vitest";

import { installCommand, nextSteps, projectNotes } from "./finishing.js";

describe("nextSteps", () => {
  it("lists only the immediate actions to start the project", () => {
    expect(
      nextSteps(
        mergeProjectConfiguration({
          project: { directory: "./contact-site", packageManager: "npm" },
          features: { forms: "resend" },
          deployment: { target: "vercel" },
        }),
      ),
    ).toEqual(["cd ./contact-site", "npm run dev"]);
  });

  it("uses the configured package manager", () => {
    expect(nextSteps(mergeProjectConfiguration())).toEqual([
      "cd ./my-astro-project",
      "pnpm dev",
    ]);
  });
});

describe("projectNotes", () => {
  it("warns about environment variables a selected feature needs", () => {
    expect(
      projectNotes(
        mergeProjectConfiguration({ features: { forms: "resend" } }),
      ),
    ).toEqual([
      "Set RESEND_API_KEY in .env before the contact form will work.",
    ]);
  });

  it("returns nothing when no feature needs setup", () => {
    expect(projectNotes(mergeProjectConfiguration())).toEqual([]);
  });
});

describe("installCommand", () => {
  it.each([
    ["npm", "npm install"],
    ["pnpm", "pnpm install"],
    ["yarn", "yarn install"],
    ["bun", "bun install"],
  ] as const)("uses %s to finish setup", (packageManager, command) => {
    expect(
      installCommand(
        mergeProjectConfiguration({ project: { packageManager } }),
      ),
    ).toBe(command);
  });
});
