import { extname } from "node:path";

import prettier from "prettier";
import * as astro from "prettier-plugin-astro";

import type { ProjectTemplate } from "./templates.js";

const formattableExtensions = new Set([
  ".astro",
  ".css",
  ".js",
  ".json",
  ".md",
  ".mdx",
  ".mjs",
  ".ts",
]);

/** Formats generated source files before they are written to the new project. */
export async function formatProjectTemplates(
  templates: readonly ProjectTemplate[],
): Promise<ProjectTemplate[]> {
  return Promise.all(
    templates.map(async (template) => {
      if (!formattableExtensions.has(extname(template.destination)))
        return template;
      return {
        ...template,
        content: await prettier.format(template.content, {
          filepath: template.destination,
          plugins: [astro],
        }),
      };
    }),
  );
}
