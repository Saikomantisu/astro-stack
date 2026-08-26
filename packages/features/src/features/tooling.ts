import { defineFeature } from "../define-feature.js";

export const toolingFeatures = [
  defineFeature({
    id: "tooling:eslint",
    selection: {
      group: "styling.tooling",
      value: "eslint",
      label: "ESLint",
    },
    isSelected: (configuration) => configuration.styling.eslint,
    contributions: {
      dependencies: [
        { name: "@eslint/js", version: "^10.0.1", type: "devDependency" },
        { name: "eslint", version: "^10.7.0", type: "devDependency" },
        {
          name: "eslint-plugin-astro",
          version: "^3.0.0",
          type: "devDependency",
        },
        { name: "globals", version: "^17.7.0", type: "devDependency" },
        {
          name: "typescript-eslint",
          version: "^8.64.0",
          type: "devDependency",
        },
      ],
      templates: [
        {
          destination: "eslint.config.js",
          content:
            'import js from "@eslint/js";\nimport astro from "eslint-plugin-astro";\nimport globals from "globals";\nimport tseslint from "typescript-eslint";\n\nexport default [\n  {\n    ignores: ["**/.astro/**", "**/dist/**", "**/.netlify/**", "**/.vercel/**", "**/.wrangler/**"],\n  },\n  js.configs.recommended,\n  ...tseslint.configs.recommended,\n  ...astro.configs.recommended,\n  {\n    files: ["**/*.{astro,js,mjs,cjs,ts,mts,cts}"],\n    languageOptions: {\n      globals: globals.browser,\n    },\n  },\n];\n',
        },
      ],
      packageScripts: {
        lint: "eslint .",
        "lint:fix": "eslint . --fix",
      },
    },
  }),
  defineFeature({
    id: "tooling:prettier",
    selection: {
      group: "styling.tooling",
      value: "prettier",
      label: "Prettier",
    },
    isSelected: (configuration) => configuration.styling.prettier,
    contributions: {
      dependencies: [
        { name: "prettier", version: "^3.9.5", type: "devDependency" },
        {
          name: "prettier-plugin-astro",
          version: "^0.14.1",
          type: "devDependency",
        },
      ],
      templates: [
        {
          destination: ".prettierrc.json",
          content: '{\n  "plugins": ["prettier-plugin-astro"]\n}\n',
        },
        {
          destination: ".prettierignore",
          content:
            "node_modules/\ndist/\n.astro/\n.netlify/\n.vercel/\n.wrangler/\npnpm-lock.yaml\npackage-lock.json\nyarn.lock\nbun.lock\nbun.lockb\n",
        },
      ],
      packageScripts: {
        format: "prettier --write .",
        "format:check": "prettier --check .",
      },
    },
  }),
  defineFeature({
    id: "tooling:biome",
    selection: {
      group: "styling.tooling",
      value: "biome",
      label: "Biome",
    },
    isSelected: (configuration) => configuration.styling.biome,
    contributions: {
      dependencies: [
        { name: "@biomejs/biome", version: "2.5.4", type: "devDependency" },
      ],
      templates: [
        {
          destination: "biome.json",
          content:
            '{\n  "$schema": "https://biomejs.dev/schemas/2.5.4/schema.json",\n  "files": {\n    "includes": [\n      "**",\n      "!!**/*.astro",\n      "!!**/.astro",\n      "!!**/dist",\n      "!!**/.netlify",\n      "!!**/.vercel",\n      "!!**/.wrangler"\n    ]\n  },\n  "css": {\n    "parser": {\n      "tailwindDirectives": true\n    }\n  },\n  "formatter": {\n    "enabled": true,\n    "indentStyle": "space"\n  },\n  "assist": {\n    "enabled": false\n  },\n  "linter": {\n    "enabled": true,\n    "rules": {\n      "preset": "recommended"\n    }\n  }\n}\n',
        },
      ],
      packageScripts: {
        check: "biome check .",
        "format:biome": "biome format --write .",
      },
    },
  }),
] as const;
