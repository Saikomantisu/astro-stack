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
- `developerExperience`: optional agent instructions, editor integration, and
  pre-commit hook setup.
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

## Agent and editor output

Supported agent targets are `codex` (versioned `AGENTS.md`) and `claude`
(versioned `CLAUDE.md`). Supported editor targets are `vscode`, `cursor`, and
`zed`; leaving either selection list empty skips that integration. VS Code and
Cursor own `.vscode/settings.json` and `.vscode/extensions.json`, so they are
mutually exclusive. Zed uses `.zed/settings.json`. VS Code/Cursor
recommendations include Astro plus only the selected ESLint, Prettier, and
Biome extensions. The generator creates these files only for selected targets,
and its new-project-only writer never replaces an existing project directory or
user-owned file.

## Hooks and command surface

Set `developerExperience.hooks` to opt into a project-owned `.git/hooks/pre-commit`
script. Hooks require `project.initializeGit`; invalid combinations are rejected
before rendering. The hook is installed only after Git initialization succeeds,
then runs selected formatting and safe ESLint fixes before `typecheck`.

Every generated project documents the same command surface: `dev`, `build`,
`preview`, and `typecheck`, plus selected `lint`, `format:check`, and Biome
`check` health commands. The README and CLI completion message render these
with the selected package manager.

## Styling and tooling output

The selected styling and tooling features own their generated output. Vanilla
CSS and Tailwind each provide `src/styles/global.css` with the same starter
visual baseline for typography, spacing, navigation, and a centered content
width. The choice changes the authoring experience, not the initial design.
Tailwind also adds the Tailwind v4 Vite plugin and its development dependencies. ESLint, Prettier,
and Biome each add only their own configuration, scripts, and development
dependencies. Selecting more than one tooling option keeps their commands
separate: `lint` for ESLint, `format` and `format:check` for Prettier, and
`check` and `format:biome` for Biome.

## Content output

`none` leaves the generated project without generic starter content. Every other
content selection creates `src/content.config.ts` and a starter post under
`src/content/posts`, using Astro's built-in `glob()` loader. MDX additionally
installs and configures Astro's official MDX integration. Blog and Documentation
instead own required native collections (`blog` and `docs` respectively), so
they reject an explicit Content setup to avoid duplicate content structures.
Their schemas use Astro's current `astro/zod` entry point, and the Documentation
navigation is derived from its collection so it remains accurate as pages change.

## Forms output

Resend and webhook forwarding each generate `src/pages/api/contact.ts` and a
reusable `ContactForm` component. Marketing and Client starters render that
component automatically when a forms integration is selected.
require a server-capable deployment target. Resend adds the `resend` runtime
dependency and documents `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and
`RESEND_TO_EMAIL` in `.env.example`. Webhook forwarding uses `WEBHOOK_URL` in
`.env.example`; it is read only on the server so the destination remains
private.

## pnpm installation

For pnpm projects, Astro Stack generates `pnpm-workspace.yaml` with the
required `esbuild` build approval. This keeps the generated project's normal
non-interactive `pnpm install` command working with pnpm's build-script policy.

## Deployment output

Static output is explicit and adds no deployment dependency. Vercel, Netlify,
and Cloudflare use their respective official Astro adapters with server output.
The Cloudflare selection also includes Wrangler, which is required by the
adapter. Deploy by connecting the generated repository to the selected host or
using that host's CLI after building the project.
