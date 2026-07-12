import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { mergeProjectConfiguration } from "@astro-stack/utils";
import { afterEach, describe, expect, it } from "vitest";

import { createProject } from "./index.js";

const enabled = process.env.ASTRO_STACK_RUN_GENERATED_TESTS === "1";
const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

function run(
  command: string,
  arguments_: readonly string[],
  directory: string,
) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, arguments_, {
      cwd: directory,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk: Buffer) => {
      output += chunk;
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} exited with code ${code}: ${output}`)),
    );
  });
}

async function generate(
  input: Parameters<typeof mergeProjectConfiguration>[0],
) {
  const parent = await mkdtemp(join(tmpdir(), "astro-stack-smoke-"));
  directories.push(parent);
  const directory = join(parent, "project");
  await createProject(
    mergeProjectConfiguration({
      ...input,
      project: {
        ...input?.project,
        directory,
        packageManager: "pnpm",
        initializeGit: false,
      },
    }),
  );
  return directory;
}

const smokeProjects = [
  ["static marketing", { project: { type: "marketing" } }],
  [
    "Tailwind MDX Vercel",
    {
      styling: { css: "tailwind" },
      content: { setup: "mdx" },
      deployment: { target: "vercel" },
    },
  ],
  [
    "collections and webhook forms on Netlify",
    {
      project: { type: "documentation" },
      content: { setup: "collections" },
      features: { forms: "webhooks" },
      deployment: { target: "netlify" },
    },
  ],
  [
    "Resend forms on Cloudflare",
    {
      project: { type: "portfolio" },
      features: { forms: "resend" },
      deployment: { target: "cloudflare" },
    },
  ],
] as const;

describe.runIf(enabled)("generated-project quality assurance", () => {
  it.each(smokeProjects)(
    "installs, type-checks, and builds %s",
    async (_name, input) => {
      const directory = await generate(input);
      await run("pnpm", ["install", "--ignore-scripts"], directory);
      await run("pnpm", ["exec", "astro", "check"], directory);
      await run("pnpm", ["build"], directory);
    },
    180_000,
  );

  it("serves a built static project with Astro preview", async () => {
    const directory = await generate({ project: { type: "blank" } });
    await run("pnpm", ["install", "--ignore-scripts"], directory);
    await run("pnpm", ["build"], directory);

    const preview = spawn(
      "pnpm",
      ["preview", "--", "--host", "127.0.0.1", "--port", "4321"],
      { cwd: directory, stdio: "ignore" },
    );
    try {
      let response: Response | undefined;
      for (let attempt = 0; attempt < 30; attempt += 1) {
        try {
          response = await fetch("http://127.0.0.1:4321/");
          break;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
      expect(response?.status).toBe(200);
      await expect(response?.text()).resolves.toContain("Astro Project");
    } finally {
      preview.kill("SIGTERM");
    }
  }, 180_000);
});
