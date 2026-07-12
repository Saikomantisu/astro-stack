import type { ProjectConfiguration } from "@astro-stack/utils";

export interface ProjectTemplate {
  destination: string;
  content: string;
}

interface TemplateContext {
  buildCommand: string;
  devCommand: string;
  installCommand: string;
  projectName: string;
  projectTitle: string;
  projectDescription: string;
}

const projectDetails = {
  marketing: [
    "Marketing Website",
    "A focused Astro marketing site, ready for your message.",
  ],
  client: ["Client Website", "A polished Astro website for your client."],
  blog: ["Blog", "A clean Astro starting point for your writing."],
  documentation: ["Documentation", "Clear documentation starts here."],
  portfolio: ["Portfolio", "A simple Astro canvas for your work."],
  "saas-landing": [
    "SaaS Landing Page",
    "A focused landing page for your product.",
  ],
  blank: ["Astro Project", "A minimal Astro project."],
} as const;

function render(template: string, context: TemplateContext): string {
  return template.replace(
    /{{(buildCommand|devCommand|installCommand|projectName|projectTitle|projectDescription)}}/g,
    (_match, key: keyof TemplateContext) => context[key],
  );
}

function createContext(configuration: ProjectConfiguration): TemplateContext {
  const [projectTitle, projectDescription] =
    projectDetails[configuration.project.type];
  const manager = configuration.project.packageManager;
  return {
    installCommand: `${manager} install`,
    devCommand: manager === "npm" ? "npm run dev" : `${manager} dev`,
    buildCommand: manager === "npm" ? "npm run build" : `${manager} build`,
    projectName: configuration.project.name,
    projectTitle,
    projectDescription,
  };
}

function manifest(configuration: ProjectConfiguration): string {
  return `${JSON.stringify(
    {
      name: configuration.project.name,
      version: "0.0.0",
      private: true,
      type: "module",
      engines: { node: ">=22.12.0" },
      scripts: {
        dev: "astro dev",
        start: "astro dev",
        build: "astro build",
        preview: "astro preview",
        ...(configuration.styling.biome
          ? {
              check: "biome check .",
              format: "biome format --write .",
            }
          : {}),
      },
      devDependencies: {
        astro: "^7.0.7",
        ...(configuration.styling.biome ? { "@biomejs/biome": "2.5.3" } : {}),
      },
    },
    null,
    2,
  )}\n`;
}

function biomeConfiguration(configuration: ProjectConfiguration): string {
  return `${JSON.stringify(
    {
      $schema: "https://biomejs.dev/schemas/2.5.3/schema.json",
      ...(configuration.project.initializeGit
        ? {
            vcs: {
              enabled: true,
              clientKind: "git",
              useIgnoreFile: true,
            },
          }
        : {}),
      files: {
        includes: ["**", "!!**/dist"],
      },
      formatter: {
        enabled: true,
        indentStyle: "tab",
      },
      linter: {
        enabled: true,
        rules: { preset: "recommended" },
      },
      javascript: {
        formatter: {
          quoteStyle: "double",
        },
      },
      assist: {
        enabled: true,
        actions: {
          source: {
            organizeImports: "on",
          },
        },
      },
      ...(configuration.styling.css === "tailwind"
        ? {
            css: {
              parser: {
                tailwindDirectives: true,
              },
            },
          }
        : {}),
      overrides: [
        {
          includes: ["**/*.astro"],
          linter: {
            rules: {
              correctness: {
                noUnusedVariables: "off",
                noUnusedImports: "off",
              },
              style: {
                useImportType: "off",
              },
            },
          },
        },
      ],
    },
    null,
    2,
  )}\n`;
}

/** Returns only the base assets required for the selected project configuration. */
export function createBaseTemplates(
  configuration: ProjectConfiguration,
): ProjectTemplate[] {
  const context = createContext(configuration);
  const usesVanillaCss = configuration.styling.css === "vanilla";
  const templates: ProjectTemplate[] = [
    { destination: "package.json", content: manifest(configuration) },
    {
      destination: "astro.config.mjs",
      content:
        "import { defineConfig } from 'astro/config';\n\nexport default defineConfig({});\n",
    },
    {
      destination: "tsconfig.json",
      content: `${JSON.stringify({ extends: "astro/tsconfigs/base", compilerOptions: { strict: configuration.styling.typescript === "strict" } }, null, 2)}\n`,
    },
    {
      destination: ".gitignore",
      content: "node_modules/\ndist/\n.astro/\n.env\n.env.*\n!.env.example\n",
    },
    {
      destination: "README.md",
      content: render(
        "# {{projectName}}\n\n{{projectDescription}}\n\n## Commands\n\n| Command | Action |\n| :-- | :-- |\n| `{{installCommand}}` | Install dependencies |\n| `{{devCommand}}` | Start the development server |\n| `{{buildCommand}}` | Build the site |\n",
        context,
      ),
    },
  ];
  const cssImport = usesVanillaCss ? "import '../styles/global.css';\n\n" : "";
  if (configuration.project.type === "blank") {
    templates.push({
      destination: "src/pages/index.astro",
      content: render(
        `---\n${cssImport}const title = '{{projectTitle}}';\n---\n\n<h1>{title}</h1>\n`,
        context,
      ),
    });
  } else {
    templates.push(
      {
        destination: "src/layouts/BaseLayout.astro",
        content: `---\n${cssImport}interface Props {\n  title: string;\n  description: string;\n}\n\nconst { title, description } = Astro.props;\n---\n\n<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width" />\n    <meta name="description" content={description} />\n    <title>{title}</title>\n  </head>\n  <body>\n    <main><slot /></main>\n  </body>\n</html>\n`,
      },
      {
        destination: "src/pages/index.astro",
        content: render(
          "---\nimport BaseLayout from '../layouts/BaseLayout.astro';\n\nconst title = '{{projectTitle}}';\nconst description = '{{projectDescription}}';\n---\n\n<BaseLayout {title} {description}>\n  <h1>{title}</h1>\n  <p>{description}</p>\n</BaseLayout>\n",
          context,
        ),
      },
    );
  }
  if (usesVanillaCss)
    templates.push({
      destination: "src/styles/global.css",
      content:
        ":root {\n  font-family: system-ui, sans-serif;\n  color: #1f2937;\n  background: #ffffff;\n}\n\nbody {\n  margin: 0;\n}\n\nmain {\n  max-width: 72rem;\n  margin: 0 auto;\n  padding: 4rem 1.5rem;\n}\n",
    });
  if (configuration.styling.biome)
    templates.push({
      destination: "biome.json",
      content: biomeConfiguration(configuration),
    });
  return templates;
}
