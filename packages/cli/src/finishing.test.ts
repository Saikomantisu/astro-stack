import { mergeProjectConfiguration } from "@astro-stack/utils";
import { describe, expect, it } from "vitest";

import { nextSteps } from "./finishing.js";

describe("nextSteps", () => {
  it("includes selected environment variables and deployment guidance", () => {
    expect(
      nextSteps(
        mergeProjectConfiguration({
          project: { directory: "./contact-site", packageManager: "npm" },
          features: { forms: "resend" },
          deployment: { target: "vercel" },
        }),
      ),
    ).toEqual([
      "cd ./contact-site",
      "npm run dev",
      "Set RESEND_API_KEY in .env before submitting the contact form.",
      "Deploy the project with Vercel.",
    ]);
  });

  it("does not print unselected feature instructions", () => {
    expect(nextSteps(mergeProjectConfiguration())).toEqual([
      "cd ./my-astro-project",
      "pnpm dev",
    ]);
  });
});
