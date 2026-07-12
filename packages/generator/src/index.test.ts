import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  mergeProjectConfiguration,
  type ProjectType,
} from "@astro-stack/utils";
import { afterEach, describe, expect, it } from "vitest";

import { createProject } from "./index.js";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function generate(type: ProjectType): Promise<string> {
  const parent = await mkdtemp(join(tmpdir(), "astro-stack-generator-"));
  directories.push(parent);
  const directory = join(parent, "project");
  await createProject(
    mergeProjectConfiguration({ project: { type, directory } }),
  );
  return directory;
}

describe("createProject", () => {
  it.each([
    "marketing",
    "client",
    "blog",
    "documentation",
    "portfolio",
    "saas-landing",
    "blank",
  ] as const)("creates a minimal %s project", async (type) => {
    const directory = await generate(type);
    await expect(
      readFile(join(directory, "package.json"), "utf8"),
    ).resolves.toContain('"astro": "^7.0.7"');
    await expect(
      readFile(join(directory, "astro.config.mjs"), "utf8"),
    ).resolves.toContain("defineConfig");
    await expect(
      readFile(join(directory, "src/pages/index.astro"), "utf8"),
    ).resolves.toContain("<h1>");
  });

  it("writes only vanilla CSS when it is selected", async () => {
    const parent = await mkdtemp(join(tmpdir(), "astro-stack-generator-"));
    directories.push(parent);
    const directory = join(parent, "tailwind-project");
    await createProject(
      mergeProjectConfiguration({
        project: { directory },
        styling: { css: "tailwind" },
      }),
    );
    await expect(
      readFile(join(directory, "src/styles/global.css"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("does not overwrite an existing target directory", async () => {
    const directory = await generate("blank");
    await expect(
      createProject(mergeProjectConfiguration({ project: { directory } })),
    ).rejects.toThrow("already exists");
  });

  it("does not add Astro Stack to the generated project", async () => {
    const directory = await generate("blank");
    const manifest = await readFile(join(directory, "package.json"), "utf8");

    expect(manifest).not.toContain("@astro-stack/");
  });

  it("installs and configures Biome only when selected", async () => {
    const parent = await mkdtemp(join(tmpdir(), "astro-stack-generator-"));
    directories.push(parent);
    const selectedDirectory = join(parent, "with-biome");
    const skippedDirectory = join(parent, "without-biome");
    const tailwindWithoutGitDirectory = join(parent, "tailwind-without-git");

    await createProject(
      mergeProjectConfiguration({
        project: { directory: selectedDirectory },
        styling: { biome: true },
      }),
    );
    await createProject(
      mergeProjectConfiguration({
        project: {
          directory: tailwindWithoutGitDirectory,
          initializeGit: false,
        },
        styling: { biome: true, css: "tailwind" },
      }),
    );
    await createProject(
      mergeProjectConfiguration({
        project: { directory: skippedDirectory },
        styling: { biome: false },
      }),
    );

    await expect(
      readFile(join(selectedDirectory, "package.json"), "utf8"),
    ).resolves.toContain('"@biomejs/biome": "2.5.3"');
    const biomeConfiguration = JSON.parse(
      await readFile(join(selectedDirectory, "biome.json"), "utf8"),
    );
    expect(biomeConfiguration).toMatchObject({
      $schema: "https://biomejs.dev/schemas/2.5.3/schema.json",
      vcs: { enabled: true, clientKind: "git", useIgnoreFile: true },
      files: { includes: ["**", "!!**/dist"] },
      formatter: { enabled: true, indentStyle: "tab" },
      linter: { enabled: true, rules: { preset: "recommended" } },
      javascript: { formatter: { quoteStyle: "double" } },
      assist: {
        enabled: true,
        actions: { source: { organizeImports: "on" } },
      },
      overrides: [
        {
          includes: ["**/*.astro"],
          linter: {
            rules: {
              correctness: {
                noUnusedVariables: "off",
                noUnusedImports: "off",
              },
              style: { useImportType: "off" },
            },
          },
        },
      ],
    });
    expect(biomeConfiguration.css).toBeUndefined();
    const tailwindWithoutGitConfiguration = JSON.parse(
      await readFile(join(tailwindWithoutGitDirectory, "biome.json"), "utf8"),
    );
    expect(tailwindWithoutGitConfiguration).toMatchObject({
      css: { parser: { tailwindDirectives: true } },
    });
    expect(tailwindWithoutGitConfiguration.vcs).toBeUndefined();
    await expect(
      readFile(join(skippedDirectory, "biome.json"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });
});
