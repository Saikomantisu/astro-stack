# AGENTS.md

## Overview

Astro Stack is a pnpm workspace for a CLI that generates production-ready Astro projects. Keep generated output lean: every file, dependency, and configuration option must be justified by a user selection.

This repository is early-stage. Prefer well-scoped improvements that strengthen its long-term architecture over temporary local workarounds.

## Workspace layout

- `packages/cli`: command-line entry point and user-facing wizard flow.
- `packages/generator`: project file creation, template rendering, and configuration merging.
- `packages/utils`: shared, framework-agnostic utilities.
- `packages/features`: self-contained feature definitions and supporting documentation.
- `packages/templates`: source templates used by the generator.
- `docs`: product requirements, architecture, and guiding principles.

## Development commands

Use pnpm (the repository pins `pnpm@11.0.8`). Run commands from the repository root:

```sh
pnpm install
pnpm check
pnpm build
pnpm clean
```

For a single workspace package, use pnpm's filter support, for example:

```sh
pnpm --filter @astro-stack/generator check
```

Run `pnpm check` and `pnpm build` before considering a task complete. If tests are added, run the relevant package test command as well.

Generated-project smoke tests are intentionally not part of GitHub Actions.
Before handing off a major change to templates, feature resolution, generated
project dependencies or configuration, installation, or CI/release behavior,
run `pnpm test:generated` from the repository root and verify it passes. This
suite installs and builds disposable generated projects, so reserve it for
those higher-risk changes and release validation.

## Core priorities

1. Correctness and predictable generation behavior.
2. Reliability, including clear handling of invalid or incompatible selections.
3. Maintainability through modular, reusable feature definitions.

When a tradeoff is required, favor correctness and robust generated projects over short-term convenience.

## TypeScript conventions

- The workspace uses strict TypeScript and ESM with `NodeNext` module resolution.
- Keep imports ESM-compatible, including explicit `.js` extensions for relative imports when required by NodeNext output.
- Prefer small, focused modules and explicit types at package boundaries.
- Preserve the public package exports declared in each package's `package.json`.

## Design constraints

- Keep the CLI grouped around project, styling/tooling, content, features, deployment, and summary.
- Treat each feature as isolated: it should own its dependencies, templates, configuration, and hooks.
- Prefer official Astro capabilities over custom abstractions.
- Do not add runtime dependencies to generated projects unless the selected configuration needs them.
- Generated projects must remain independent of Astro Stack after creation.

## Maintainability

- Look for an appropriate shared module before adding functionality; do not duplicate configuration, validation, template, or dependency-resolution logic across packages.
- Make changes at the correct architectural boundary rather than patching a symptom in the CLI.
- Keep feature behavior explicit and composable so selections can be validated and tested independently.
- Do not edit or import from vendored/reference material if it is added to the repository; use it only as reference unless explicitly instructed otherwise.

## Before handing off changes

- For every user-facing change to a published package, CLI behavior, or generated
  project output, run `pnpm changeset` and include the generated changeset file
  in the same change. Do this automatically; do not wait for a separate
  release-note request. Choose the semver bump that matches the impact: patch
  for backward-compatible fixes, minor for backward-compatible capabilities,
  and major for breaking changes. Internal-only changes that cannot affect a
  published package do not need a changeset.
- Run `pnpm check` for TypeScript changes.
- Run `pnpm build` when package output or exports change.
- Run and verify `pnpm test:generated` for major generated-project or release
  changes.
- Update relevant documentation when changing generation behavior, supported options, or architecture.
