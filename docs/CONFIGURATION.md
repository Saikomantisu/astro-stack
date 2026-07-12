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

The initial cross-section rule is that the Resend integration cannot use the
static deployment target because sending mail needs a server-capable runtime.
Feature-specific validation and pre-write conflict detection are performed by
`resolveFeatures()` in `@astro-stack/features`; its deterministic plan is the
input to project generation. `summarizeProjectConfiguration()` produces the
stable, display-ready values required by the CLI's final summary screen.
