# Release Governance

## Ownership

For the v0.1.0 release, **Ravinath Akalanka** is the release owner. The release
owner approves the release scope, verifies the production gate, publishes the
package, and coordinates a rollback if one is needed. Until another maintainer
is appointed, the release owner also performs the required technical review.

Future maintainers must be recorded in this document before they are assigned
release responsibilities.

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
