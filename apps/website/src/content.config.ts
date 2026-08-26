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

const news = defineCollection({
  loader: glob({
    base: "./src/content/news",
    pattern: "**/*.{md,mdx}",
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(["Release", "Product", "Engineering"]),
    publishedAt: z.coerce.date(),
    readingTime: z.string(),
    order: z.number().int().nonnegative(),
    featured: z.boolean().default(false),
    relatedLinks: z.array(
      z.object({
        label: z.string(),
        href: z.string(),
      }),
    ),
  }),
});

export const collections = { docs, news };
