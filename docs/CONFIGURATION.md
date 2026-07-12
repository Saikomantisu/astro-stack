# Configuration Model

`@astro-stack/utils` owns the configuration contract shared by the CLI, feature
registry, and generator. The complete `ProjectConfiguration` is assembled from
the following independently collected sections:

- `project`: name, output directory, project type, package manager, and Git.
- `styling`: CSS choice, TypeScript preference, and tooling selections for
  ESLint, Prettier, and Biome.
- `content`: none, Markdown, MDX, or Content Collections.
- `features`: forms integration.
- `deployment`: static, Vercel, Netlify, or Cloudflare.
- `summary`: whether the CLI requires final confirmation before writing files.

Use `mergeProjectConfiguration()` to combine wizard-section values with the
published defaults. Do not assemble configuration by mutating the default
object.

Before feature resolution or file creation, call
`validateProjectConfiguration()`. It returns structured `errors` and
`warnings`; each issue includes a stable code, a dotted field path, a
user-facing message, and, when useful, a suggested recovery. Any error blocks
generation. Warnings can be displayed on the summary screen without blocking
confirmation.

The initial cross-section rule is that Resend and webhook forwarding cannot use
the static deployment target because they require a server-capable runtime.
Feature-specific validation and pre-write conflict detection are performed by
`resolveFeatures()` in `@astro-stack/features`; its deterministic plan is the
input to project generation. `summarizeProjectConfiguration()` produces the
stable, display-ready values required by the CLI's final summary screen.

## Styling and tooling output

The selected styling and tooling features own their generated output. Vanilla
CSS and Tailwind each provide `src/styles/global.css`; Tailwind also adds the
Tailwind v4 Vite plugin and its development dependencies. ESLint, Prettier,
and Biome each add only their own configuration, scripts, and development
dependencies. Selecting more than one tooling option keeps their commands
separate: `lint` for ESLint, `format` and `format:check` for Prettier, and
`check` and `format:biome` for Biome.

## Content output

`none` leaves the generated project without starter content. Every other
content selection creates `src/content.config.ts` and a starter post under
`src/content/posts`, using Astro's built-in `glob()` loader. MDX additionally
installs and configures Astro's official MDX integration.

## Forms output

Resend and webhook forwarding each generate `src/pages/api/contact.ts` and
require a server-capable deployment target. Resend adds the `resend` runtime
dependency and documents `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and
`RESEND_TO_EMAIL` in `.env.example`. Webhook forwarding uses `WEBHOOK_URL` in
`.env.example`; it is read only on the server so the destination remains
private.

## Deployment output

Static output is explicit and adds no deployment dependency. Vercel, Netlify,
and Cloudflare use their respective official Astro adapters with server output.
The Cloudflare selection also includes Wrangler, which is required by the
adapter. Deploy by connecting the generated repository to the selected host or
using that host's CLI after building the project.
