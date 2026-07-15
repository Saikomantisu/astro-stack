# Release Governance

## Ownership

For the v0.1.0 release, **Ravinath Akalanka** is the release owner. The release
owner approves the release scope, verifies the production gate, publishes the
package, and coordinates a rollback if one is needed. Until another maintainer
is appointed, the release owner also performs the required technical review.

Future maintainers must be recorded in this document before they are assigned
release responsibilities.

## Versioning and changelog

Astro Stack uses [Semantic Versioning](https://semver.org/). A `major` release
contains breaking changes, a `minor` release adds backward-compatible
capabilities, and a `patch` release fixes backward-compatible defects. The
release owner decides whether a documented support-policy change is breaking.

[Changesets](../.changeset/README.md) is the authoritative record of pending
package changes. Every pull request that changes published behavior must include
a changeset with the appropriate semver bump and a concise, user-facing
description. Changesets keeps the CLI, generator, features, and utils packages
on one version so their workspace dependency ranges remain compatible.

The repository [changelog](../CHANGELOG.md) is the release index and the
website's source of release notes. The version command adds the CLI's released
Changeset notes to that index after Changesets generates detailed package
changelogs. Do not edit a generated package changelog by hand.

## Release procedure

1. Merge approved changesets to `main`. The **Prepare release** workflow opens
   or updates a `chore: release packages` pull request that consumes them,
   updates versions, generates package changelogs, and updates the repository
   changelog that powers the website.
2. The release owner reviews the version PR, confirms the intended semver bump
   and release notes, and completes the production definition of done below.
   Run `pnpm test:generated` for this release change as well as the standard
   verification commands.
3. Merge the version PR. From that exact commit, run `pnpm release:publish`
   with the registry credentials for the publishing account. Never publish from
   an unreviewed local branch.
4. Confirm the registry package version, install and smoke-test it in a fresh
   temporary directory, then create a GitHub release and an annotated
   `v<version>` tag from the merged version commit. Copy the generated package
   changelog notes into the GitHub release.
5. Record the package version, tag, validation results, and any known issues in
   the GitHub release. The release owner must keep the release PR and tag as
   the audit trail.

Publishing is intentionally a manual, credentialed step. Each publishable
package targets the public npm registry explicitly and declares public access;
the workspace package itself remains private. Before publishing, configure an
npm token with only the required publish scope and verify that
`pnpm release:publish` publishes only the intended public packages.

## Rollback

The release owner is the rollback decision-maker. Start a rollback when a
published CLI prevents generation, corrupts generated output, introduces a
security issue, or otherwise makes the documented supported flow unsafe.

1. Stop promotion immediately: do not add a tag or GitHub release for a
   version that has not finished validation. Preserve the failing logs and
   identify the last known-good version and tag.
2. If the bad version has already reached the registry, move the package's
   `latest` dist-tag back to the last known-good version, following the
   registry's current policy. Do not republish or overwrite an existing
   version. If removal is permitted and necessary, use the registry's supported
   removal path; otherwise deprecate the bad version with a clear migration
   message.
3. Open an urgent patch changeset that restores the supported behavior, run the
   full release validation, publish the patch, and move `latest` forward only
   after the fresh install smoke test passes.
4. Publish a GitHub release note (or amend the existing one) that identifies
   the affected versions, impact, workaround, rollback action, and fixed
   version. Update the changelog and issue tracker with the same facts.

Do not delete Git tags or rewrite release history as part of a rollback. Tags
and package versions are evidence for users who may already have installed the
affected release.

## Issue Labels

Use the following labels for all release-tracked issues:

| Label | Meaning |
| --- | --- |
| `type:bug` | A defect in Astro Stack or a generated project. |
| `type:feature` | New or changed user-facing generation capability. |
| `type:docs` | Documentation-only work. |
| `type:chore` | Maintenance, tooling, or repository work. |
| `priority:p0` | Blocks release; resolve before publishing. |
| `priority:p1` | Important for the current milestone, but not a release blocker. |
| `priority:p2` | Planned work that may move to a later milestone. |
| `status:needs-triage` | Awaiting scope, priority, and owner assignment. |
| `status:blocked` | Cannot progress because of a recorded dependency or decision. |
| `status:ready` | Acceptance criteria are met and the work is ready for review. |

## Production Definition of Done

A production release is complete only when the release owner confirms all of
the following:

- Every applicable item in `docs/TODO.md` is complete, or an intentional
  deferral is documented in the PRD.
- The supported generated-project combinations pass dependency installation,
  type-checking, and production builds on the documented runtime and
  package-manager ranges.
- Required checks, tests, and builds pass from a clean checkout.
- User-facing documentation, package metadata, the changelog, and release notes
  accurately describe the shipped behavior and known limitations.
- The Astro Stack website is deployed on GitHub Pages, and its installation,
  documentation, and repository links are verified before final release
  validation begins.
- The package is installed and smoke-tested from the published registry in a
  fresh temporary directory.
- A rollback target and the rollback decision-maker are identified before
  publishing; the release owner is the initial decision-maker.

## Developer-experience release check

Before publishing a release that includes developer-experience integrations,
verify the documented `--agent codex`, `--agent claude`, `--editor vscode`,
`--editor cursor`, `--editor zed`, `--hooks`, and `--no-hooks` paths. Confirm
that VS Code plus Cursor and hooks plus `--no-git` fail before generation, and
record the supported targets or any intentional deferral in the release notes.
