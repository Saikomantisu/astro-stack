# Contributing to Astro Stack

Thanks for contributing. Astro Stack generates projects developers own, so
changes should be small, explicit, and safe across supported selections.

## Before You Start

- Read the [product requirements](./docs/PRD.md),
  [architecture](./docs/ARCHITECTURE.md), and
  [principles](./docs/PRINCIPLES.md).
- Check [the release checklist](./docs/TODO.md) for the current scope.
- Use the issue labels defined in [release governance](./docs/RELEASE.md) when
  opening or updating release-tracked work.

## Development Workflow

Follow the setup and command reference in
[local development](./docs/DEVELOPMENT.md). Keep each pull request focused on
one behavior or architectural change.

When changing generated output, document the supported selection, add or update
tests, and ensure no unselected dependency, file, or configuration is added to
the generated project.

## Pull Requests

Before requesting review:

- Run `pnpm test`, `pnpm check`, `pnpm check:biome`, and `pnpm build`.
- Update documentation for changed supported behavior or architecture.
- Explain validation, compatibility, and generated-output changes in the pull
  request description.
- Do not commit generated `dist` output, dependencies, credentials, or local
  environment files.

The release owner listed in [release governance](./docs/RELEASE.md) approves
release-scope changes until another maintainer is recorded there.
