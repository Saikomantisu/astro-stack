import type {
  ConfigurationIssue,
  ProjectConfiguration,
} from "@astro-stack/utils";
import type {
  FeatureConfigurationChange,
  FeatureConflict,
  FeatureDefinition,
  FeatureDependency,
  FeatureLifecycleHooks,
  FeatureResolution,
  FeatureTemplate,
} from "./contracts.js";

export type {
  AstroConfigExpression,
  FeatureConfigurationChange,
  FeatureConflict,
  FeatureDefinition,
  FeatureDependency,
  FeatureLifecycleContext,
  FeatureLifecycleHooks,
  FeatureResolution,
  FeatureTemplate,
} from "./contracts.js";

function selectedFeature(
  id: string,
  isSelected: FeatureDefinition["isSelected"],
  options: Omit<FeatureDefinition, "id" | "isSelected"> = {},
): FeatureDefinition {
  return { id, isSelected, ...options };
}

function selectionIssue(
  code: string,
  path: string,
  message: string,
  suggestion?: string,
): ConfigurationIssue {
  return {
    level: "error",
    code,
    path,
    message,
    ...(suggestion ? { suggestion } : {}),
  };
}

/**
 * The complete initial registry. Each feature owns the files, dependencies,
 * and configuration it adds to a generated project.
 */
export const featureRegistry: readonly FeatureDefinition[] = [
  selectedFeature(
    "styling:vanilla",
    (configuration) => configuration.styling.css === "vanilla",
    {
      templates: [
        {
          destination: "src/styles/global.css",
          content:
            ":root {\n  font-family: system-ui, sans-serif;\n  color: #1f2937;\n  background: #ffffff;\n}\n\nbody {\n  margin: 0;\n}\n\nmain {\n  max-width: 72rem;\n  margin: 0 auto;\n  padding: 4rem 1.5rem;\n}\n",
        },
      ],
    },
  ),
  selectedFeature(
    "styling:tailwind",
    (configuration) => configuration.styling.css === "tailwind",
    {
      dependencies: [
        { name: "@tailwindcss/vite", version: "^4.3.2", type: "devDependency" },
        { name: "tailwindcss", version: "^4.3.2", type: "devDependency" },
      ],
      templates: [
        {
          destination: "src/styles/global.css",
          content: '@import "tailwindcss";\n',
        },
      ],
      configurationChanges: [
        {
          file: "astro.config.mjs",
          path: "vite.plugins",
          value: { type: "astro-config-expression", code: "[tailwindcss()]" },
          imports: ['import tailwindcss from "@tailwindcss/vite";'],
        },
      ],
    },
  ),
  ...(["strict", "relaxed"] as const).map((typescript) =>
    selectedFeature(
      `typescript:${typescript}`,
      (configuration) => configuration.styling.typescript === typescript,
    ),
  ),
  selectedFeature(
    "tooling:eslint",
    (configuration) => configuration.styling.eslint,
    {
      dependencies: [
        { name: "@eslint/js", version: "^10.0.1", type: "devDependency" },
        {
          name: "@typescript-eslint/parser",
          version: "^8.63.0",
          type: "devDependency",
        },
        { name: "eslint", version: "^10.7.0", type: "devDependency" },
        {
          name: "eslint-plugin-astro",
          version: "^3.0.0",
          type: "devDependency",
        },
        {
          name: "eslint-plugin-jsx-a11y",
          version: "^6.10.2",
          type: "devDependency",
        },
        { name: "globals", version: "^17.7.0", type: "devDependency" },
      ],
      templates: [
        {
          destination: "eslint.config.js",
          content:
            'import js from "@eslint/js";\nimport astro from "eslint-plugin-astro";\nimport globals from "globals";\n\nexport default [\n  js.configs.recommended,\n  ...astro.configs.recommended,\n  {\n    languageOptions: {\n      globals: globals.browser,\n    },\n  },\n];\n',
        },
      ],
      configurationChanges: [
        {
          file: "package.json",
          path: "scripts.lint",
          value: "eslint .",
        },
      ],
    },
  ),
  selectedFeature(
    "tooling:prettier",
    (configuration) => configuration.styling.prettier,
    {
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
          content: "node_modules/\ndist/\n.astro/\n",
        },
      ],
      configurationChanges: [
        {
          file: "package.json",
          path: "scripts.format",
          value: "prettier --write .",
        },
        {
          file: "package.json",
          path: "scripts.format:check",
          value: "prettier --check .",
        },
      ],
    },
  ),
  selectedFeature(
    "tooling:biome",
    (configuration) => configuration.styling.biome,
    {
      dependencies: [
        { name: "@biomejs/biome", version: "2.5.3", type: "devDependency" },
      ],
      templates: [
        {
          destination: "biome.json",
          content:
            '{\n  "$schema": "https://biomejs.dev/schemas/2.5.3/schema.json",\n  "files": {\n    "includes": ["**", "!!**/dist"]\n  },\n  "formatter": {\n    "enabled": true,\n    "indentStyle": "tab"\n  },\n  "linter": {\n    "enabled": true,\n    "rules": {\n      "preset": "recommended"\n    }\n  }\n}\n',
        },
      ],
      configurationChanges: [
        { file: "package.json", path: "scripts.check", value: "biome check ." },
        {
          file: "package.json",
          path: "scripts.format:biome",
          value: "biome format --write .",
        },
      ],
    },
  ),
  selectedFeature(
    "content:none",
    (configuration) => configuration.content.setup === "none",
  ),
  selectedFeature(
    "content:markdown",
    (configuration) => configuration.content.setup === "markdown",
    {
      templates: [
        {
          destination: "src/pages/posts/getting-started.md",
          content:
            "---\ntitle: Getting started\ndescription: Your first Markdown post.\n---\n\n# Getting started\n\nStart writing in Markdown. Astro turns this file into a page automatically.\n",
        },
      ],
    },
  ),
  selectedFeature(
    "content:mdx",
    (configuration) => configuration.content.setup === "mdx",
    {
      dependencies: [
        { name: "@astrojs/mdx", version: "^7.0.2", type: "devDependency" },
      ],
      templates: [
        {
          destination: "src/pages/posts/getting-started.mdx",
          content:
            "---\ntitle: Getting started\ndescription: Your first MDX post.\n---\n\n# Getting started\n\nYou can use **Markdown** and {`JavaScript expressions`} in this page.\n",
        },
      ],
      configurationChanges: [
        {
          file: "astro.config.mjs",
          path: "integrations",
          value: { type: "astro-config-expression", code: "[mdx()]" },
          imports: ['import mdx from "@astrojs/mdx";'],
        },
      ],
    },
  ),
  selectedFeature(
    "content:collections",
    (configuration) => configuration.content.setup === "collections",
    {
      templates: [
        {
          destination: "src/content.config.ts",
          content:
            'import { defineCollection } from "astro:content";\nimport { glob } from "astro/loaders";\n\nconst blog = defineCollection({\n  loader: glob({ pattern: "**/*.md", base: "./src/data/blog" }),\n});\n\nexport const collections = { blog };\n',
        },
        {
          destination: "src/data/blog/getting-started.md",
          content:
            "---\ntitle: Getting started\ndescription: Your first content collection entry.\n---\n\n# Getting started\n\nThis entry is loaded through Astro's content layer.\n",
        },
      ],
    },
  ),
  selectedFeature(
    "forms:none",
    (configuration) => configuration.features.forms === "none",
  ),
  selectedFeature(
    "forms:resend",
    (configuration) => configuration.features.forms === "resend",
    {
      validate: (configuration) =>
        configuration.deployment.target === "static"
          ? [
              selectionIssue(
                "resend-requires-server-runtime",
                "features.forms",
                "Resend requires a server-capable deployment target and cannot be used with static output.",
                "Choose Vercel, Netlify, or Cloudflare, or remove the Resend integration.",
              ),
            ]
          : [],
      dependencies: [
        { name: "resend", version: "^6.17.2", type: "dependency" },
      ],
      templates: [
        {
          destination: ".env.example",
          content:
            "# Create a sending-only API key and verify the sender domain in Resend.\nRESEND_API_KEY=re_your_api_key\nRESEND_FROM_EMAIL=contact@your-domain.com\nRESEND_TO_EMAIL=you@your-domain.com\n",
        },
        {
          destination: "src/pages/api/contact.ts",
          content:
            'import type { APIRoute } from "astro";\nimport { Resend } from "resend";\n\nconst value = (formData: FormData, key: string): string => {\n  const entry = formData.get(key);\n  return typeof entry === "string" ? entry.trim() : "";\n};\n\nexport const POST: APIRoute = async ({ request }) => {\n  const formData = await request.formData();\n  const name = value(formData, "name");\n  const email = value(formData, "email");\n  const message = value(formData, "message");\n\n  if (!email || !message)\n    return new Response(JSON.stringify({ error: "Email and message are required." }), {\n      status: 400,\n      headers: { "Content-Type": "application/json" },\n    });\n\n  const apiKey = import.meta.env.RESEND_API_KEY;\n  const from = import.meta.env.RESEND_FROM_EMAIL;\n  const to = import.meta.env.RESEND_TO_EMAIL;\n  if (!apiKey || !from || !to)\n    return new Response(JSON.stringify({ error: "Email delivery is not configured." }), {\n      status: 500,\n      headers: { "Content-Type": "application/json" },\n    });\n\n  const { error } = await new Resend(apiKey).emails.send({\n    from,\n    to: [to],\n    subject: `New contact form message from ${name || email}`,\n    replyTo: email,\n    text: `Name: ${name || "Not provided"}\\nEmail: ${email}\\n\\n${message}`,\n  });\n  if (error)\n    return new Response(JSON.stringify({ error: "Unable to send the message." }), {\n      status: 502,\n      headers: { "Content-Type": "application/json" },\n    });\n\n  return new Response(JSON.stringify({ ok: true }), {\n    status: 200,\n    headers: { "Content-Type": "application/json" },\n  });\n};\n',
        },
      ],
      configurationChanges: [
        { file: "astro.config.mjs", path: "output", value: "server" },
      ],
    },
  ),
  selectedFeature(
    "forms:webhooks",
    (configuration) => configuration.features.forms === "webhooks",
    {
      validate: (configuration) =>
        configuration.deployment.target === "static"
          ? [
              selectionIssue(
                "webhooks-require-server-runtime",
                "features.forms",
                "Webhook forwarding requires a server-capable deployment target and cannot be used with static output.",
                "Choose Vercel, Netlify, or Cloudflare, or remove the webhook integration.",
              ),
            ]
          : [],
      templates: [
        {
          destination: ".env.example",
          content:
            "# URL that will receive contact form submissions. Keep it private.\nWEBHOOK_URL=https://example.com/contact-webhook\n",
        },
        {
          destination: "src/pages/api/contact.ts",
          content:
            'import type { APIRoute } from "astro";\n\nconst value = (formData: FormData, key: string): string => {\n  const entry = formData.get(key);\n  return typeof entry === "string" ? entry.trim() : "";\n};\n\nexport const POST: APIRoute = async ({ request }) => {\n  const formData = await request.formData();\n  const email = value(formData, "email");\n  const message = value(formData, "message");\n  if (!email || !message)\n    return new Response(JSON.stringify({ error: "Email and message are required." }), {\n      status: 400,\n      headers: { "Content-Type": "application/json" },\n    });\n\n  const webhookUrl = import.meta.env.WEBHOOK_URL;\n  if (!webhookUrl)\n    return new Response(JSON.stringify({ error: "Webhook delivery is not configured." }), {\n      status: 500,\n      headers: { "Content-Type": "application/json" },\n    });\n\n  const response = await fetch(webhookUrl, {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify({\n      name: value(formData, "name"),\n      email,\n      message,\n    }),\n  });\n  if (!response.ok)\n    return new Response(JSON.stringify({ error: "Unable to deliver the message." }), {\n      status: 502,\n      headers: { "Content-Type": "application/json" },\n    });\n\n  return new Response(JSON.stringify({ ok: true }), {\n    status: 200,\n    headers: { "Content-Type": "application/json" },\n  });\n};\n',
        },
      ],
      configurationChanges: [
        { file: "astro.config.mjs", path: "output", value: "server" },
      ],
    },
  ),
  selectedFeature(
    "deployment:static",
    (configuration) => configuration.deployment.target === "static",
    {
      configurationChanges: [
        { file: "astro.config.mjs", path: "output", value: "static" },
      ],
    },
  ),
  selectedFeature(
    "deployment:vercel",
    (configuration) => configuration.deployment.target === "vercel",
    {
      dependencies: [
        { name: "@astrojs/vercel", version: "^11.0.2", type: "devDependency" },
      ],
      configurationChanges: [
        {
          file: "astro.config.mjs",
          path: "adapter",
          value: { type: "astro-config-expression", code: "vercel()" },
          imports: ['import vercel from "@astrojs/vercel";'],
        },
        { file: "astro.config.mjs", path: "output", value: "server" },
      ],
    },
  ),
  selectedFeature(
    "deployment:netlify",
    (configuration) => configuration.deployment.target === "netlify",
    {
      dependencies: [
        { name: "@astrojs/netlify", version: "^8.1.1", type: "devDependency" },
      ],
      configurationChanges: [
        {
          file: "astro.config.mjs",
          path: "adapter",
          value: { type: "astro-config-expression", code: "netlify()" },
          imports: ['import netlify from "@astrojs/netlify";'],
        },
        { file: "astro.config.mjs", path: "output", value: "server" },
      ],
    },
  ),
  selectedFeature(
    "deployment:cloudflare",
    (configuration) => configuration.deployment.target === "cloudflare",
    {
      dependencies: [
        {
          name: "@astrojs/cloudflare",
          version: "^14.1.2",
          type: "devDependency",
        },
        { name: "wrangler", version: "^4.110.0", type: "devDependency" },
      ],
      configurationChanges: [
        {
          file: "astro.config.mjs",
          path: "adapter",
          value: { type: "astro-config-expression", code: "cloudflare()" },
          imports: ['import cloudflare from "@astrojs/cloudflare";'],
        },
        { file: "astro.config.mjs", path: "output", value: "server" },
      ],
    },
  ),
];

function stableFeatureOrder(
  features: readonly FeatureDefinition[],
): FeatureDefinition[] {
  return [...features].sort((left, right) => left.id.localeCompare(right.id));
}

function addConflict(
  conflicts: FeatureConflict[],
  kind: FeatureConflict["kind"],
  target: string,
  featureIds: readonly string[],
): void {
  conflicts.push({
    kind,
    target,
    featureIds: [...featureIds].sort(),
    message: `Features ${[...featureIds].sort().join(", ")} both change ${target}.`,
  });
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * Resolves selected features into a deterministic, generator-ready plan.
 * Conflicts are reported before any filesystem work begins.
 */
export function resolveFeatures(
  configuration: ProjectConfiguration,
  registry: readonly FeatureDefinition[] = featureRegistry,
): FeatureResolution {
  const features = stableFeatureOrder(
    registry.filter((feature) => feature.isSelected(configuration)),
  );
  const dependencies: FeatureDependency[] = [];
  const templates: FeatureTemplate[] = [];
  const configurationChanges: FeatureConfigurationChange[] = [];
  const hooks: {
    feature: FeatureDefinition;
    hooks: FeatureLifecycleHooks;
  }[] = [];
  const errors: ConfigurationIssue[] = [];
  const conflicts: FeatureConflict[] = [];
  const files = new Map<string, string>();
  const changes = new Map<string, { featureId: string; value: unknown }>();
  const packages = new Map<
    string,
    { featureId: string; dependency: FeatureDependency }
  >();

  for (const feature of features) {
    errors.push(...(feature.validate?.(configuration) ?? []));
    for (const template of feature.templates ?? []) {
      const owner = files.get(template.destination);
      if (owner)
        addConflict(conflicts, "file", template.destination, [
          owner,
          feature.id,
        ]);
      else files.set(template.destination, feature.id);
      templates.push(template);
    }
    for (const change of feature.configurationChanges ?? []) {
      const key = `${change.file}:${change.path}`;
      const existing = changes.get(key);
      if (existing && !sameValue(existing.value, change.value)) {
        addConflict(conflicts, "configuration", key, [
          existing.featureId,
          feature.id,
        ]);
      } else if (!existing)
        changes.set(key, { featureId: feature.id, value: change.value });
      configurationChanges.push(change);
    }
    for (const dependency of feature.dependencies ?? []) {
      const existing = packages.get(dependency.name);
      if (
        existing &&
        (existing.dependency.version !== dependency.version ||
          existing.dependency.type !== dependency.type)
      ) {
        addConflict(conflicts, "dependency", dependency.name, [
          existing.featureId,
          feature.id,
        ]);
      } else if (!existing) {
        packages.set(dependency.name, { featureId: feature.id, dependency });
        dependencies.push(dependency);
      }
    }
    if (feature.hooks) hooks.push({ feature, hooks: feature.hooks });
  }

  return {
    features,
    dependencies,
    templates,
    configurationChanges,
    hooks,
    errors,
    conflicts,
    valid: errors.length === 0 && conflicts.length === 0,
  };
}
