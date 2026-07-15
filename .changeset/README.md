# Changesets

Run `pnpm changeset` for each pull request that changes a publishable package
or its user-facing behavior. Select the semver bump and commit the generated
Markdown file with the pull request.

An empty changeset is appropriate only when no published package can be
affected, such as a CI-only change. The release owner decides borderline cases.

Changesets is the source of truth for package versions and package changelogs.
`@astro-stack/cli`, `generator`, `features`, and `utils` are versioned together
so their workspace dependencies cannot drift. The release workflow turns merged
changesets into a version PR; see [`docs/RELEASE.md`](../docs/RELEASE.md) for
validation, publishing, and rollback.
