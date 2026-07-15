# Local Development

## Requirements

- Node.js 22.13 or later for the Astro Stack workspace.
- Corepack-enabled pnpm 11.0.8, as pinned in the root `package.json`.

Generated projects have separate runtime and package-manager requirements;
refer to the [generated-project support policy](./PRD.md#generated-project-support-policy).

## Setup

From the repository root:

```sh
corepack enable
pnpm install
```

Use pnpm for all workspace commands. The lockfile must stay in sync with
`package.json` changes.

## Commands

```sh
pnpm test          # Run the Vitest suite
pnpm check         # Type-check all workspace packages
pnpm check:biome   # Run formatting and lint checks
pnpm build         # Compile all workspace packages
pnpm clean         # Remove compiled package output
pnpm format        # Apply formatting changes
```

Run the same verification as CI before handing off a change:

```sh
pnpm build && pnpm check && pnpm check:biome && pnpm test
```

To run a command for one package, use pnpm filters. For example:

```sh
pnpm --filter @astro-stack/generator check
```

To try the CLI from the workspace root, build it and run:

```sh
pnpm --filter create-astro-stack start
```

After you enter a project name, its output directory defaults to
`./<project-name>`. The generator never overwrites an existing directory;
choose another output directory or remove the previous generated project before
running it again.

## Workspace Layout

- `packages/cli`: executable and user-facing flow.
- `packages/generator`: file generation and configuration application.
- `packages/features`: public home for feature contracts and feature
  definitions.
- `packages/templates`: source templates copied or rendered into generated
  projects; it is not published as a runtime package.
- `packages/utils`: framework-agnostic shared utilities.

Package source belongs in `src/` and compiled output goes to `dist/`. Do not
import from another package's source or `dist` directory: import its declared
package export instead.
