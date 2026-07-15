import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const docs = defineCollection({
  loader: glob({
    base: "./src/content/docs",
    pattern: "**/*.{md,mdx}",
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    section: z.enum(["Guide", "Reference"]),
    order: z.number().int().nonnegative(),
    previous: z.string().optional(),
    next: z.string().optional(),
  }),
});

export const collections = { docs };
