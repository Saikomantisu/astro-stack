import type { FeatureTemplate } from "../contracts.js";
import { defineFeature } from "../define-feature.js";

const contentConfigTemplate: FeatureTemplate = {
  destination: "src/content.config.ts",
  content:
    'import { defineCollection } from "astro:content";\nimport { glob } from "astro/loaders";\n\nconst posts = defineCollection({\n  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),\n});\n\nexport const collections = { posts };\n',
};

export const contentFeatures = [
  defineFeature({
    id: "content:none",
    selection: { group: "content.setup", value: "none", label: "None" },
    isSelected: (configuration) => configuration.content.setup === "none",
  }),
  defineFeature({
    id: "content:markdown",
    selection: {
      group: "content.setup",
      value: "markdown",
      label: "Markdown",
    },
    isSelected: (configuration) => configuration.content.setup === "markdown",
    contributions: {
      templates: [
        contentConfigTemplate,
        {
          destination: "src/content/posts/getting-started.md",
          content:
            "---\ntitle: Getting started\ndescription: Your first Markdown post.\n---\n\n# Getting started\n\nStart writing in Markdown. This entry is available through Astro's content layer.\n",
        },
      ],
    },
  }),
  defineFeature({
    id: "content:mdx",
    selection: { group: "content.setup", value: "mdx", label: "MDX" },
    isSelected: (configuration) => configuration.content.setup === "mdx",
    contributions: {
      dependencies: [
        { name: "@astrojs/mdx", version: "^7.0.2", type: "devDependency" },
      ],
      templates: [
        contentConfigTemplate,
        {
          destination: "src/content/posts/getting-started.mdx",
          content:
            "---\ntitle: Getting started\ndescription: Your first MDX post.\n---\n\n# Getting started\n\nYou can use **Markdown** and {`JavaScript expressions`} in this page.\n",
        },
      ],
      astroConfig: {
        integrations: [
          {
            id: "mdx",
            expression: "mdx()",
            imports: ['import mdx from "@astrojs/mdx";'],
          },
        ],
      },
    },
  }),
  defineFeature({
    id: "content:collections",
    selection: {
      group: "content.setup",
      value: "collections",
      label: "Content Collections",
    },
    isSelected: (configuration) =>
      configuration.content.setup === "collections",
    contributions: {
      templates: [
        contentConfigTemplate,
        {
          destination: "src/content/posts/getting-started.md",
          content:
            "---\ntitle: Getting started\ndescription: Your first content collection entry.\n---\n\n# Getting started\n\nThis entry is loaded through Astro's content layer.\n",
        },
      ],
    },
  }),
] as const;
