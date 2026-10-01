// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Served from a custom domain at the root; override via env if that changes.
const site = process.env.SITE_URL ?? "https://astrostack.ravinath.dev";
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
