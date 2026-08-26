import { defineFeature } from "../define-feature.js";

export const deploymentFeatures = [
  defineFeature({
    id: "deployment:static",
    selection: {
      group: "deployment.target",
      value: "static",
      label: "Static site",
    },
    isSelected: (configuration) => configuration.deployment.target === "static",
    contributions: { astroConfig: { output: "static" } },
  }),
  defineFeature({
    id: "deployment:vercel",
    selection: {
      group: "deployment.target",
      value: "vercel",
      label: "Vercel",
    },
    isSelected: (configuration) => configuration.deployment.target === "vercel",
    provides: ["server-runtime"],
    contributions: {
      dependencies: [
        { name: "@astrojs/vercel", version: "^11.0.2", type: "devDependency" },
      ],
      astroConfig: {
        adapter: {
          id: "vercel",
          expression: "vercel()",
          imports: ['import vercel from "@astrojs/vercel";'],
        },
        output: "server",
      },
    },
  }),
  defineFeature({
    id: "deployment:netlify",
    selection: {
      group: "deployment.target",
      value: "netlify",
      label: "Netlify",
    },
    isSelected: (configuration) =>
      configuration.deployment.target === "netlify",
    provides: ["server-runtime"],
    contributions: {
      dependencies: [
        { name: "@astrojs/netlify", version: "^8.1.1", type: "devDependency" },
      ],
      astroConfig: {
        adapter: {
          id: "netlify",
          expression: "netlify()",
          imports: ['import netlify from "@astrojs/netlify";'],
        },
        output: "server",
      },
      pnpmBuildDependencies: ["@parcel/watcher", "sharp"],
    },
  }),
  defineFeature({
    id: "deployment:cloudflare",
    selection: {
      group: "deployment.target",
      value: "cloudflare",
      label: "Cloudflare",
    },
    isSelected: (configuration) =>
      configuration.deployment.target === "cloudflare",
    provides: ["server-runtime"],
    contributions: {
      dependencies: [
        {
          name: "@astrojs/cloudflare",
          version: "^14.1.2",
          type: "devDependency",
        },
        { name: "wrangler", version: "^4.110.0", type: "devDependency" },
      ],
      astroConfig: {
        adapter: {
          id: "cloudflare",
          expression: "cloudflare()",
          imports: ['import cloudflare from "@astrojs/cloudflare";'],
        },
        output: "server",
      },
      pnpmBuildDependencies: ["sharp", "workerd"],
    },
  }),
] as const;
