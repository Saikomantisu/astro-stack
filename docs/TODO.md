# Production Readiness To-Do List

This is the living checklist for the initial production release of Astro Stack. A
stage is complete only when its acceptance criteria are met, documented, and
verified. Items intentionally map to the initial scope in the [PRD](./PRD.md)
and the module boundaries in the [architecture](./ARCHITECTURE.md).

## 0. Release Definition

- [x] Define the first release version and supported Node.js versions.
- [x] Confirm the initial supported selections and explicitly defer future
  features (authentication, analytics, search, presets, and project updates).
- [x] Define the generated-project support policy, including supported Astro and
  package-manager versions.
- [x] Establish release owners, issue labels, and the definition of done for a
  production release.

## 1. Workspace Foundation

- [x] Configure the pnpm workspace, root scripts, shared TypeScript settings,
  linting, formatting, and test tooling.
- [x] Define public package exports for `cli`, `generator`, `features`, and
  `utils`.
- [x] Add CI to install dependencies, run checks, run tests, and build all
  packages on every change.
- [x] Add contribution, local-development, and architecture documentation.

## 2. Configuration Model and Validation

- [x] Define the complete, typed project configuration and defaults.
- [x] Implement section-level configuration for project, styling/tooling,
  content, features, deployment, and summary.
- [x] Validate required selections, invalid values, and incompatible
  combinations before generation.
- [x] Represent validation errors and warnings in a form the CLI can display
  clearly.
- [x] Test configuration merging, defaults, and validation independently of the
  CLI.

## 3. CLI Experience

- [x] Implement the `create astro-stack` command entry point and help/version
  output.
- [x] Build the grouped wizard with sensible defaults and cancellation support.
- [x] Show a final, accurate summary before any files are written.
- [x] Provide clear progress, errors, recovery guidance, and non-interactive
  behavior where supported.
- [x] Verify the CLI works from a clean environment and does not leave partial
  output after cancellation or failure.

## 4. Feature Registry and Resolution

- [x] Define a self-contained feature contract for dependencies, templates,
  configuration changes, validation, and lifecycle hooks.
- [x] Implement deterministic feature resolution for every valid selection.
- [x] Detect conflicting file and configuration changes before writing output.
- [x] Test feature resolution in isolation and across supported combinations.

## 5. Base Project Generation

- [x] Create the minimal Astro project structure for each initial project type:
  marketing, client, blog, documentation, portfolio, and
  blank.
- [x] Render templates safely with project variables and predictable naming.
- [x] Generate only selected files, dependencies, and configuration.
- [x] Merge JSON, TypeScript, and Astro configuration without overwriting
  intentional feature changes.
- [x] Ensure generated projects have no runtime dependency on Astro Stack.

## 6. Initial Supported Features

### Styling and tooling

- [x] Vanilla CSS
- [x] Tailwind CSS
- [x] TypeScript preferences
- [x] ESLint
- [x] Prettier
- [x] Biome

### Content

- [x] No content setup
- [x] Markdown
- [x] MDX
- [x] Content Collections

### Forms

- [x] No forms integration
- [x] Resend
- [x] Webhooks

### Deployment

- [x] Static output
- [x] Vercel
- [x] Netlify
- [x] Cloudflare

For each completed feature:

- [x] Add its feature definition, templates, dependencies, and configuration.
- [x] Add validation and any required environment-variable documentation.
- [x] Test it alone and in every supported combination it affects.

## 7. Installation and Finishing Steps

- [x] Install dependencies with the selected package manager and produce a
  lockfile.
- [x] Handle install failures without presenting a broken project as ready.
- [x] Initialize Git when selected or documented as the default behavior.
- [x] Print accurate next steps, including environment variables and deployment
  instructions required by selected features.

## 8. Quality Assurance

- [x] Add unit tests for utilities, configuration validation, feature
  resolution, and configuration merging.
- [x] Add integration tests that generate representative supported projects.
- [x] Run generated projects through install, type-check, build, and preview
  smoke tests.
- [x] Keep generated-project smoke tests out of GitHub Actions and run them
  manually before major generated-project changes and releases.
- [x] Maintain a compatibility matrix for project types, styling, content,
  forms, tooling, and deployment selections.
- [x] Test failure paths: invalid directory, unavailable package manager,
  dependency-install failure, invalid selection, and cancelled generation.
- [x] Review accessibility, developer-facing copy, and error messages.

## 9. Documentation and Website

- [x] Document installation, usage, all supported choices, defaults, and
  examples.
- [x] Document generated-project ownership and the no-runtime-dependency
  guarantee.
- [x] Create and deploy an Astro website on GitHub Pages with a clear product
  overview, installation instructions, CLI walkthrough, and links to the
  documentation and repository.
- [x] Add a changelog and release process, including versioning and rollback.
- [x] Prepare package metadata, license, repository links, and npm publishing
  configuration.

## 10. Final Release Validation

Complete this stage only after the website in stage 9 is deployed and its
installation and documentation links have been verified.

- [x] Run the required checks, tests, and builds from a clean checkout.
- [x] Run the generated-project compatibility suite and verify every supported
  combination passes installation, type-checking, and production builds.
- [x] Validate a published-package installation in a fresh temporary directory.
- [x] Publish the initial release and verify the documented `npm create` flow.

## 11. Developer Experience Expansion

This post-v0.1 work adopts the useful parts of Vite+'s creation experience
while preserving Astro Stack's rule that generated output is entirely driven by
explicit choices.

### Project input and flow

- [x] Show the suggested project name as a placeholder instead of a pre-filled
  value, and require an explicit valid name.
- [x] Review every prompt's default, label, help text, ordering, and cancel
  behavior as one coherent, concise setup flow.
- [x] Add CLI interaction tests for an empty project name, validation recovery,
  cancellation, and final-summary accuracy.

### Agent and editor setup

- [x] Define a typed developer-experience configuration section in
  `@astro-stack/utils` for agent instructions, editor integration, and hooks.
- [x] Define supported agent instruction targets and versioned templates;
  generate only selected files and never overwrite user-owned output.
- [x] Define supported editor targets and generate settings and extension
  recommendations only when selected and compatible with the chosen tooling.
- [x] Implement repeatable interactive multiselects and matching repeatable
  `--agent` and `--editor` non-interactive flags.
- [x] Validate unknown, duplicate, and incompatible agent/editor selections
  before rendering begins.

### Git hooks and command surface

- [x] Add `--hooks` / `--no-hooks` and an interactive opt-in for pre-commit
  setup; validate that hooks require Git.
- [x] Generate an idempotent pre-commit hook that runs the selected project's
  formatting, linting, and type-checking command with safe fixes.
- [x] Ensure hook installation runs only after Git initialization succeeds and
  gives actionable recovery guidance on failure.
- [x] Define a minimal generated-project command contract for development,
  build, preview, and selected project-health checks.
- [x] Make the generated README and completion output use that contract and
  show exact commands for the selected package manager.

### Verification and documentation

- [x] Add unit tests for configuration merging and validation plus generator
  tests for each integration's selected and unselected output.
- [x] Add integration tests covering every package manager, Git/hooks
  combination, and representative agent/editor selections.
- [x] Update CLI usage, configuration, architecture, and release documentation
  when the supported targets and flags are finalized.

## Final Production Gate

Do not mark the initial release complete until the website is deployed, all
applicable items above are checked, and the final release validation stage has
passed. Record any intentionally deferred item in the PRD rather than silently
excluding it from this checklist.
