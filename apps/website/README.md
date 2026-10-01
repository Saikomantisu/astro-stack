# `@astro-stack/website`

Marketing site for [Astro Stack](https://github.com/Saikomantisu/astro-stack).

Dark-first Astro 7 app with Starwind UI, Tailwind CSS v4, DM Sans + Manrope, and brand tokens aligned with `packages/cli/src/brand.ts`.

## Commands

From the monorepo root:

```sh
pnpm --filter @astro-stack/website dev
pnpm --filter @astro-stack/website build
pnpm --filter @astro-stack/website preview
pnpm --filter @astro-stack/website check
```

## Base path

The site deploys to GitHub Pages under the custom domain
`astrostack.ravinath.dev`, served from the root:

| Env | Default |
| --- | --- |
| `SITE_URL` | `https://astrostack.ravinath.dev` |
| `SITE_BASE` | `/` |

Keep using `withBase()` / `import.meta.env.BASE_URL` for all internal asset and
nav URLs so the site still builds under a sub-path if `SITE_BASE` is set.

```sh
pnpm --filter @astro-stack/website build
pnpm --filter @astro-stack/website preview
```

## Design

Implementation plan: [`docs/WEBSITE_DESIGN.md`](../../docs/WEBSITE_DESIGN.md).

Current state: **PR 1–5**: foundation through SEO (OG, sitemap, brand favicon). Deploy workflow lands in PR 6.
