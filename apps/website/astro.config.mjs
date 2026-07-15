// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Interim project-Pages defaults; override via env in the deploy workflow.
const site = process.env.SITE_URL ?? "https://saikomantisu.github.io";
const base = process.env.SITE_BASE ?? "/";

// https://astro.build/config
export default defineConfig({
  site,
  base,
  trailingSlash: "always",
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
