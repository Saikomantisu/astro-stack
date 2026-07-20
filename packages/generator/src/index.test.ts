import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  mergeProjectConfiguration,
  type ProjectType,
} from "@astro-stack/utils";
import { afterEach, describe, expect, it } from "vitest";

import { createProject } from "./index.js";
import { formatProjectTemplates } from "./formatter.js";

const directories: string[] = [];
const stylingCombinations = (["vanilla", "tailwind"] as const).flatMap((css) =>
  (["strict", "relaxed"] as const).flatMap((typescript) =>
    [false, true].flatMap((eslint) =>
      [false, true].flatMap((prettier) =>
        [false, true].map((biome) => ({
          css,
          typescript,
          eslint,
          prettier,
          biome,
        })),
      ),
    ),
  ),
);
const contentSetups = ["none", "markdown", "mdx", "collections"] as const;
const serverForms = ["resend", "webhooks"] as const;
const deploymentTargets = [
  "static",
  "vercel",
  "netlify",
  "cloudflare",
] as const;
const serverDeploymentTargets = ["vercel", "netlify", "cloudflare"] as const;
const formDeploymentSelections = [
  ["none", "static"],
  ...serverForms.flatMap((forms) =>
    serverDeploymentTargets.map((target) => [forms, target] as const),
  ),
] as const;
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
    "blank",
  ] as const)("formats every generated source file for %s", async (type) => {
    const parent = await mkdtemp(join(tmpdir(), "astro-stack-generator-"));
    directories.push(parent);
    const directory = join(parent, "project");
    const project = await createProject(
      mergeProjectConfiguration({ project: { type, directory } }),
    );
    const formattable = project.files.filter((file) =>
      /\.(astro|css|js|json|md|mdx|mjs|ts)$/.test(file),
    );

    for (const destination of formattable) {
      const content = await readFile(join(directory, destination), "utf8");
      const [formatted] = await formatProjectTemplates([
        { destination, content },
      ]);
      expect(content).toBe(formatted?.content);
    }
  });

  it("runs feature lifecycle hooks in deterministic generation order", async () => {
    const parent = await mkdtemp(join(tmpdir(), "astro-stack-generator-"));
    directories.push(parent);
    const calls: string[] = [];
    const configuration = mergeProjectConfiguration({
      project: { directory: join(parent, "project") },
    });
    const feature = {
      id: "test:lifecycle",
      isSelected: () => true,
      hooks: {
        beforeGenerate: () => {
          calls.push("before");
        },
        afterGenerate: () => {
          calls.push("after");
        },
      },
    };

    await createProject(configuration, [feature]);

    expect(calls).toEqual(["before", "after"]);
  });

  it.each([
    "marketing",
    "client",
    "blog",
    "documentation",
    "portfolio",
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

  it("creates the Blog collection and its index and post routes", async () => {
    const directory = await generate("blog");
    const parent = await mkdtemp(join(tmpdir(), "astro-stack-generator-"));
    directories.push(parent);
    const tailwindDirectory = join(parent, "tailwind-blog");
    await createProject(
      mergeProjectConfiguration({
        project: { type: "blog", directory: tailwindDirectory },
        styling: { css: "tailwind" },
      }),
    );
    await expect(
      readFile(join(directory, "src/content.config.ts"), "utf8"),
    ).resolves.toContain("const blog = defineCollection");
    await expect(
      readFile(join(directory, "src/content.config.ts"), "utf8"),
    ).resolves.toContain('import { z } from "astro/zod"');
    await expect(
      readFile(join(directory, "src/content/blog/welcome.md"), "utf8"),
    ).resolves.toContain("Welcome to your blog");
    await expect(
      readFile(join(directory, "src/content/blog/welcome.md"), "utf8"),
    ).resolves.toContain("# Start writing here");
    await expect(
      readFile(join(directory, "src/content/blog/welcome.md"), "utf8"),
    ).resolves.not.toContain("# Welcome to your blog");
    await expect(
      readFile(join(directory, "src/pages/blog/index.astro"), "utf8"),
    ).resolves.toContain('getCollection("blog")');
    await expect(
      readFile(join(directory, "src/pages/blog/[...slug].astro"), "utf8"),
    ).resolves.toContain("getStaticPaths");
    await expect(
      readFile(join(directory, "src/layouts/BlogLayout.astro"), "utf8"),
    ).resolves.not.toContain("global.css");
    await expect(
      readFile(join(directory, "src/layouts/BlogLayout.astro"), "utf8"),
    ).resolves.toContain("font-size: clamp(2.25rem, 8vw, 4rem);");
    await expect(
      readFile(join(tailwindDirectory, "src/layouts/BlogLayout.astro"), "utf8"),
    ).resolves.toBe(
      await readFile(join(directory, "src/layouts/BlogLayout.astro"), "utf8"),
    );
    await expect(
      readFile(join(directory, "src/pages/blog/index.astro"), "utf8"),
    ).resolves.toContain("\n  <ul>\n");
    await expect(
      readFile(join(directory, "src/content.config.ts"), "utf8"),
    ).resolves.toContain("schema: z.object({\n");
  });

  it("creates unstyled documentation routes and starter pages", async () => {
    const directory = await generate("documentation");
    const parent = await mkdtemp(join(tmpdir(), "astro-stack-generator-"));
    directories.push(parent);
    const tailwindDirectory = join(parent, "tailwind-documentation");
    await createProject(
      mergeProjectConfiguration({
        project: { type: "documentation", directory: tailwindDirectory },
        styling: { css: "tailwind" },
      }),
    );
    await expect(
      readFile(join(directory, "src/content.config.ts"), "utf8"),
    ).resolves.toContain("const docs = defineCollection");
    await expect(
      readFile(join(directory, "src/content.config.ts"), "utf8"),
    ).resolves.toContain('import { z } from "astro/zod"');
    await expect(
      readFile(join(directory, "src/content/docs/getting-started.md"), "utf8"),
    ).resolves.toContain("Getting started");
    await expect(
      readFile(join(directory, "src/content/docs/guides/authoring.md"), "utf8"),
    ).resolves.toContain("Authoring documentation");
    await expect(
      readFile(join(directory, "src/layouts/DocsLayout.astro"), "utf8"),
    ).resolves.not.toContain("global.css");
    await expect(
      readFile(join(directory, "src/layouts/DocsLayout.astro"), "utf8"),
    ).resolves.toContain('<!doctype html>\n<html lang="en">');
    await expect(
      readFile(join(directory, "src/layouts/DocsLayout.astro"), "utf8"),
    ).resolves.toContain("font-size: clamp(2.25rem, 8vw, 4rem);");
    await expect(
      readFile(join(directory, "src/layouts/DocsLayout.astro"), "utf8"),
    ).resolves.toContain('const pages = (await getCollection("docs")).sort(');
    await expect(
      readFile(join(tailwindDirectory, "src/layouts/DocsLayout.astro"), "utf8"),
    ).resolves.toBe(
      await readFile(join(directory, "src/layouts/DocsLayout.astro"), "utf8"),
    );
    await expect(
      readFile(join(directory, "src/pages/docs/[...slug].astro"), "utf8"),
    ).resolves.toContain("getStaticPaths");
  });

  it("creates the distinct client, marketing, and portfolio page structures", async () => {
    const client = await generate("client");
    const marketing = await generate("marketing");
    const portfolio = await generate("portfolio");
    await expect(
      readFile(join(client, "src/pages/contact.astro"), "utf8"),
    ).resolves.toContain("Contact");
    await expect(
      readFile(join(marketing, "src/pages/index.astro"), "utf8"),
    ).resolves.toContain("Why it matters");
    await expect(
      readFile(join(portfolio, "src/pages/work/first-project.astro"), "utf8"),
    ).resolves.toContain("First project");
  });

  it("configures Tailwind with its Vite plugin and global stylesheet", async () => {
    const parent = await mkdtemp(join(tmpdir(), "astro-stack-generator-"));
    directories.push(parent);
    const directory = join(parent, "tailwind-project");
    const vanillaDirectory = join(parent, "vanilla-project");
    await createProject(
      mergeProjectConfiguration({
        project: { directory },
        styling: { css: "tailwind" },
      }),
    );
    await createProject(
      mergeProjectConfiguration({
        project: { directory: vanillaDirectory },
        styling: { css: "vanilla" },
      }),
    );
    await expect(
      readFile(join(directory, "src/styles/global.css"), "utf8"),
    ).resolves.toContain('@import "tailwindcss";');
    await expect(
      readFile(join(directory, "src/styles/global.css"), "utf8"),
    ).resolves.toContain("width: min(100% - 2rem, 72rem);");
    await expect(
      readFile(join(vanillaDirectory, "src/styles/global.css"), "utf8"),
    ).resolves.toContain('font-family: Georgia, "Times New Roman", serif;');
    await expect(
      readFile(join(vanillaDirectory, "src/styles/global.css"), "utf8"),
    ).resolves.toContain("font-size: clamp(2.5rem, 7vw, 5rem);");
    await expect(
      readFile(join(directory, "astro.config.mjs"), "utf8"),
    ).resolves.toContain('import tailwindcss from "@tailwindcss/vite";');
    await expect(
      readFile(join(directory, "package.json"), "utf8"),
    ).resolves.toContain('"tailwindcss": "^4.3.2"');
  });

  it.each(
    contentSetups,
  )("generates only the selected %s content setup", async (setup) => {
    const parent = await mkdtemp(join(tmpdir(), "astro-stack-generator-"));
    directories.push(parent);
    const directory = join(parent, "project");
    await createProject(
      mergeProjectConfiguration({
        project: { directory },
        styling: { eslint: false, prettier: false, biome: false },
        content: { setup },
      }),
    );

    const manifest = JSON.parse(
      await readFile(join(directory, "package.json"), "utf8"),
    ) as { devDependencies: Record<string, string> };

    if (setup === "none") {
      await expect(
        readFile(
          join(directory, "src/content/posts/getting-started.md"),
          "utf8",
        ),
      ).rejects.toMatchObject({ code: "ENOENT" });
      await expect(
        readFile(join(directory, "src/content.config.ts"), "utf8"),
      ).rejects.toMatchObject({ code: "ENOENT" });
      expect(manifest.devDependencies["@astrojs/mdx"]).toBeUndefined();
      return;
    }
    if (setup === "markdown") {
      await expect(
        readFile(
          join(directory, "src/content/posts/getting-started.md"),
          "utf8",
        ),
      ).resolves.toContain("Start writing in Markdown.");
      await expect(
        readFile(join(directory, "src/content.config.ts"), "utf8"),
      ).resolves.toContain("const posts = defineCollection");
      expect(manifest.devDependencies["@astrojs/mdx"]).toBeUndefined();
      return;
    }
    if (setup === "mdx") {
      await expect(
        readFile(
          join(directory, "src/content/posts/getting-started.mdx"),
          "utf8",
        ),
      ).resolves.toContain("JavaScript expressions");
      await expect(
        readFile(join(directory, "src/content.config.ts"), "utf8"),
      ).resolves.toContain("const posts = defineCollection");
      expect(manifest.devDependencies["@astrojs/mdx"]).toBe("^7.0.2");
      await expect(
        readFile(join(directory, "astro.config.mjs"), "utf8"),
      ).resolves.toContain('import mdx from "@astrojs/mdx";');
      return;
    }
    await expect(
      readFile(join(directory, "src/content.config.ts"), "utf8"),
    ).resolves.toContain(
      'loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" })',
    );
    await expect(
      readFile(join(directory, "src/content/posts/getting-started.md"), "utf8"),
    ).resolves.toContain("content layer");
    expect(manifest.devDependencies["@astrojs/mdx"]).toBeUndefined();
  });

  it("merges MDX and Tailwind configuration without losing either integration", async () => {
    const parent = await mkdtemp(join(tmpdir(), "astro-stack-generator-"));
    directories.push(parent);
    const directory = join(parent, "project");
    await createProject(
      mergeProjectConfiguration({
        project: { directory },
        styling: { css: "tailwind" },
        content: { setup: "mdx" },
      }),
    );

    const astro = await readFile(join(directory, "astro.config.mjs"), "utf8");
    expect(astro).toContain('import mdx from "@astrojs/mdx";');
    expect(astro).toContain('import tailwindcss from "@tailwindcss/vite";');
    expect(astro).toContain("integrations: [mdx()]");
    expect(astro).toContain("plugins: [tailwindcss()]");
  });

  it.each(
    formDeploymentSelections,
  )("generates only the selected %s forms integration", async (forms, target) => {
    const parent = await mkdtemp(join(tmpdir(), "astro-stack-generator-"));
    directories.push(parent);
    const directory = join(parent, "project");
    await createProject(
      mergeProjectConfiguration({
        project: { directory },
        styling: { eslint: false, prettier: false, biome: false },
        features: { forms },
        deployment: { target },
      }),
    );

    const manifest = JSON.parse(
      await readFile(join(directory, "package.json"), "utf8"),
    ) as { dependencies?: Record<string, string> };

    if (forms === "none") {
      await expect(
        readFile(join(directory, "src/pages/api/contact.ts"), "utf8"),
      ).rejects.toMatchObject({ code: "ENOENT" });
      expect(manifest.dependencies?.resend).toBeUndefined();
      return;
    }

    await expect(
      readFile(join(directory, "src/components/ContactForm.astro"), "utf8"),
    ).resolves.toContain('action={endpoint} method="post" data-contact-form');

    const endpoint = await readFile(
      join(directory, "src/pages/api/contact.ts"),
      "utf8",
    );
    const environment = await readFile(join(directory, ".env.example"), "utf8");
    await expect(
      readFile(join(directory, "astro.config.mjs"), "utf8"),
    ).resolves.toContain('output: "server"');

    if (forms === "resend") {
      expect(manifest.dependencies?.resend).toBe("^6.17.2");
      expect(endpoint).toContain('import { Resend } from "resend";');
      expect(environment).toContain("RESEND_API_KEY=");
      return;
    }
    expect(manifest.dependencies?.resend).toBeUndefined();
    expect(endpoint).toContain("fetch(webhookUrl");
    expect(environment).toContain("WEBHOOK_URL=");
  });

  it("wires selected forms into client contact pages", async () => {
    const parent = await mkdtemp(join(tmpdir(), "astro-stack-generator-"));
    directories.push(parent);
    const directory = join(parent, "client");
    await createProject(
      mergeProjectConfiguration({
        project: { type: "client", directory },
        features: { forms: "webhooks" },
        deployment: { target: "netlify" },
      }),
    );
    await expect(
      readFile(join(directory, "src/pages/contact.astro"), "utf8"),
    ).resolves.toContain("<ContactForm />");
  });

  it("adds pnpm build approvals only to pnpm projects", async () => {
    const parent = await mkdtemp(join(tmpdir(), "astro-stack-generator-"));
    directories.push(parent);
    const pnpmDirectory = join(parent, "pnpm");
    const cloudflareDirectory = join(parent, "cloudflare");
    const npmDirectory = join(parent, "npm");
    await createProject(
      mergeProjectConfiguration({ project: { directory: pnpmDirectory } }),
    );
    await createProject(
      mergeProjectConfiguration({
        project: { directory: npmDirectory, packageManager: "npm" },
      }),
    );
    await createProject(
      mergeProjectConfiguration({
        project: { directory: cloudflareDirectory },
        deployment: { target: "cloudflare" },
      }),
    );
    await expect(
      readFile(join(pnpmDirectory, "pnpm-workspace.yaml"), "utf8"),
    ).resolves.toBe("allowBuilds:\n  esbuild: true\n");
    await expect(
      readFile(join(cloudflareDirectory, "pnpm-workspace.yaml"), "utf8"),
    ).resolves.toBe("allowBuilds:\n  esbuild: true\n  sharp: true\n  workerd: true\n");
    await expect(
      readFile(join(npmDirectory, "pnpm-workspace.yaml"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it.each(
    serverForms,
  )("rejects %s when static output is selected", async (forms) => {
    const parent = await mkdtemp(join(tmpdir(), "astro-stack-generator-"));
    directories.push(parent);
    const directory = join(parent, "project");

    await expect(
      createProject(
        mergeProjectConfiguration({
          project: { directory },
          features: { forms },
          deployment: { target: "static" },
        }),
      ),
    ).rejects.toThrow("server-capable deployment target");
  });

  it.each(
    deploymentTargets,
  )("configures the selected %s deployment target", async (target) => {
    const parent = await mkdtemp(join(tmpdir(), "astro-stack-generator-"));
    directories.push(parent);
    const directory = join(parent, "project");
    await createProject(
      mergeProjectConfiguration({
        project: { directory },
        styling: { eslint: false, prettier: false, biome: false },
        deployment: { target },
      }),
    );

    const manifest = JSON.parse(
      await readFile(join(directory, "package.json"), "utf8"),
    ) as { devDependencies: Record<string, string> };
    const astro = await readFile(join(directory, "astro.config.mjs"), "utf8");

    if (target === "static") {
      expect(astro).toContain('import { defineConfig } from "astro/config";');
      expect(astro).toContain('output: "static"');
      expect(manifest.devDependencies["@astrojs/vercel"]).toBeUndefined();
      return;
    }

    expect(astro).toContain('output: "server"');
    if (target === "vercel") {
      expect(astro).toContain('import vercel from "@astrojs/vercel";');
      expect(astro).toContain("adapter: vercel()");
      expect(manifest.devDependencies["@astrojs/vercel"]).toBe("^11.0.2");
      return;
    }
    if (target === "netlify") {
      expect(astro).toContain('import netlify from "@astrojs/netlify";');
      expect(astro).toContain("adapter: netlify()");
      expect(manifest.devDependencies["@astrojs/netlify"]).toBe("^8.1.1");
      return;
    }
    expect(astro).toContain('import cloudflare from "@astrojs/cloudflare";');
    expect(astro).toContain("adapter: cloudflare()");
    expect(manifest.devDependencies["@astrojs/cloudflare"]).toBe("^14.1.2");
    expect(manifest.devDependencies.wrangler).toBe("^4.110.0");
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

  it.each([
    ["codex", "AGENTS.md"],
    ["claude", "CLAUDE.md"],
  ] as const)("generates only the selected %s instruction file", async (agent, file) => {
    const parent = await mkdtemp(join(tmpdir(), "astro-stack-generator-"));
    directories.push(parent);
    const selectedDirectory = join(parent, "selected");
    const skippedDirectory = join(parent, "skipped");

    await createProject(
      mergeProjectConfiguration({
        project: { directory: selectedDirectory },
        developerExperience: {
          agents: [agent],
        },
      }),
    );
    await createProject(
      mergeProjectConfiguration({ project: { directory: skippedDirectory } }),
    );

    await expect(
      readFile(join(selectedDirectory, file), "utf8"),
    ).resolves.toContain("agent instructions v1");
    const unselectedFile = agent === "codex" ? "CLAUDE.md" : "AGENTS.md";
    await expect(
      readFile(join(selectedDirectory, unselectedFile), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
    await expect(
      readFile(join(skippedDirectory, file), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it.each([
    ["vscode", ".vscode/settings.json"],
    ["cursor", ".vscode/settings.json"],
    ["zed", ".zed/settings.json"],
  ] as const)("generates only the selected %s editor integration", async (editor, file) => {
    const parent = await mkdtemp(join(tmpdir(), "astro-stack-generator-"));
    directories.push(parent);
    const selectedDirectory = join(parent, "selected");
    const skippedDirectory = join(parent, "skipped");

    await createProject(
      mergeProjectConfiguration({
        project: { directory: selectedDirectory },
        developerExperience: { editors: [editor] },
        styling: { eslint: true, prettier: false, biome: true },
      }),
    );
    await createProject(
      mergeProjectConfiguration({ project: { directory: skippedDirectory } }),
    );

    await expect(
      readFile(join(selectedDirectory, file), "utf8"),
    ).resolves.toBeDefined();
    await expect(
      readFile(join(skippedDirectory, file), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
    if (editor === "zed") {
      await expect(
        readFile(join(selectedDirectory, ".vscode/settings.json"), "utf8"),
      ).rejects.toMatchObject({ code: "ENOENT" });
      return;
    }
    const extensions = JSON.parse(
      await readFile(
        join(selectedDirectory, ".vscode/extensions.json"),
        "utf8",
      ),
    ) as { recommendations: string[] };
    expect(extensions.recommendations).toEqual([
      "astro-build.astro-vscode",
      "dbaeumer.vscode-eslint",
      "biomejs.biome",
    ]);
    await expect(
      readFile(join(skippedDirectory, ".vscode/settings.json"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("generates Zed settings without VS Code workspace files", async () => {
    const parent = await mkdtemp(join(tmpdir(), "astro-stack-generator-"));
    directories.push(parent);
    const directory = join(parent, "zed");
    await createProject(
      mergeProjectConfiguration({
        project: { directory },
        developerExperience: { editors: ["zed"] },
        styling: { prettier: true, biome: false },
      }),
    );

    await expect(
      readFile(join(directory, ".zed/settings.json"), "utf8"),
    ).resolves.toContain('"format_on_save": "on"');
    await expect(
      readFile(join(directory, ".vscode/settings.json"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("installs and configures Biome only when selected", async () => {
    const parent = await mkdtemp(join(tmpdir(), "astro-stack-generator-"));
    directories.push(parent);
    const selectedDirectory = join(parent, "with-biome");
    const skippedDirectory = join(parent, "without-biome");

    await createProject(
      mergeProjectConfiguration({
        project: { directory: selectedDirectory },
        styling: { biome: true },
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
    ).resolves.toContain('"@biomejs/biome": "2.5.4"');
    const biomeConfiguration = JSON.parse(
      await readFile(join(selectedDirectory, "biome.json"), "utf8"),
    );
    expect(biomeConfiguration).toMatchObject({
      $schema: "https://biomejs.dev/schemas/2.5.4/schema.json",
      files: {
        includes: [
          "**",
          "!!**/*.astro",
          "!!**/.astro",
          "!!**/dist",
          "!!**/.netlify",
          "!!**/.vercel",
          "!!**/.wrangler",
        ],
      },
      css: { parser: { tailwindDirectives: true } },
      formatter: { enabled: true, indentStyle: "space" },
      assist: { enabled: false },
      linter: { enabled: true, rules: { preset: "recommended" } },
    });
    await expect(
      readFile(join(skippedDirectory, "biome.json"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it.each(
    stylingCombinations,
  )("generates the selected styling and tooling combination ($css, $typescript, eslint=$eslint, prettier=$prettier, biome=$biome)", async ({
    css,
    typescript,
    eslint,
    prettier,
    biome,
  }) => {
    const parent = await mkdtemp(join(tmpdir(), "astro-stack-generator-"));
    directories.push(parent);
    const directory = join(parent, "project");
    await createProject(
      mergeProjectConfiguration({
        project: { directory },
        styling: { css, typescript, eslint, prettier, biome },
      }),
    );

    const manifest = JSON.parse(
      await readFile(join(directory, "package.json"), "utf8"),
    ) as {
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const tsconfig = JSON.parse(
      await readFile(join(directory, "tsconfig.json"), "utf8"),
    ) as {
      compilerOptions: { strict: boolean };
    };

    expect(tsconfig.compilerOptions.strict).toBe(typescript === "strict");
    expect(manifest.devDependencies.eslint === undefined).toBe(!eslint);
    expect(manifest.devDependencies.prettier === undefined).toBe(!prettier);
    expect(manifest.devDependencies["@biomejs/biome"] === undefined).toBe(
      !biome,
    );
    expect(manifest.scripts.lint === undefined).toBe(!eslint);
    expect(manifest.scripts["lint:fix"] === undefined).toBe(!eslint);
    expect(manifest.scripts.format === undefined).toBe(!prettier);
    expect(manifest.scripts.check === undefined).toBe(!biome);
    expect(manifest.scripts.typecheck).toBe("astro check");
  });
});
