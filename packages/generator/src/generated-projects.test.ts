import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
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

async function availablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  if (!address || typeof address === "string")
    throw new Error("Unable to reserve a preview port.");
  return address.port;
}

async function stop(child: ReturnType<typeof spawn>): Promise<void> {
  if (child.exitCode !== null) return;
  try {
    if (child.pid) process.kill(-child.pid, "SIGTERM");
    else child.kill("SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
  await Promise.race([
    once(child, "exit"),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
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
  ["default marketing", { project: { type: "marketing" } }],
  ["default client", { project: { type: "client" } }],
  ["default blog", { project: { type: "blog" } }],
  ["default documentation", { project: { type: "documentation" } }],
  ["default portfolio", { project: { type: "portfolio" } }],
  ["default blank", { project: { type: "blank" } }],
  [
    "Tailwind MDX Vercel",
    {
      styling: { css: "tailwind" },
      content: { setup: "mdx" },
      deployment: { target: "vercel" },
    },
  ],
  [
    "documentation and webhook forms on Netlify",
    {
      project: { type: "documentation" },
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
    "installs and runs every selected quality command for %s",
    async (_name, input) => {
      const directory = await generate(input);
      await run("pnpm", ["install"], directory);
      await run("pnpm", ["typecheck"], directory);
      await run("pnpm", ["lint"], directory);
      await run("pnpm", ["check"], directory);
      await run("pnpm", ["format:check"], directory);
      await run("pnpm", ["build"], directory);
    },
    180_000,
  );

  it("serves a built static project with Astro preview", async () => {
    const directory = await generate({ project: { type: "blank" } });
    await run("pnpm", ["install"], directory);
    await run("pnpm", ["build"], directory);

    const port = await availablePort();
    const preview = spawn(
      "pnpm",
      ["preview", "--host", "127.0.0.1", "--port", String(port)],
      { cwd: directory, detached: true, stdio: "ignore" },
    );
    try {
      let response: Response | undefined;
      for (let attempt = 0; attempt < 30; attempt += 1) {
        try {
          response = await fetch(`http://127.0.0.1:${port}/`);
          break;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
      expect(response?.status).toBe(200);
      await expect(response?.text()).resolves.toContain("Astro Project");
    } finally {
      await stop(preview);
    }
  }, 180_000);
});
