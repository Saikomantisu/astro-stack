# Quality Assurance

Astro Stack verifies the configuration model, feature resolution, generation,
and generated-project runtime separately. The standard pull-request test suite
is fast and does not require registry access. Generated-project smoke tests
install real dependencies, so they are run manually before major
generated-project changes and releases rather than in GitHub Actions.

Run both locally before a release:

```sh
pnpm test
pnpm test:generated
```

For the initial release, perform these final validation checks only after the
Astro Stack website is deployed on GitHub Pages and its installation and
documentation links have been verified. See the
[release checklist](./TODO.md) for the complete ordering.

`test:generated` creates disposable projects, installs their dependencies with
pnpm (without running third-party install hooks), runs `astro check`, builds
them, and starts an Astro preview server for a static project. It never writes
to the repository.

## Compatibility matrix

Every valid selection is covered at the generator level. The matrix below is
the release contract and identifies the focused smoke-test representatives.

| Area | Supported selections | Verification |
| --- | --- | --- |
| Project type | marketing, client, blog, documentation, portfolio, SaaS landing, blank | Each type generates its required page structure. |
| Styling | vanilla, Tailwind | Each styling option and every TypeScript/tooling combination generates only selected configuration and dependencies. Tailwind + MDX is smoke-tested. |
| TypeScript | strict, relaxed | Both preferences generate the matching `tsconfig` setting. |
| Tooling | ESLint, Prettier, Biome independently enabled or disabled | All 8 tooling combinations are generation-tested. |
| Content | none, Markdown, MDX, Content Collections | Each content setup is generation-tested; MDX and Collections are smoke-tested. |
| Forms | none, Resend, webhooks | Valid server-target combinations are generation-tested; Resend and webhooks are smoke-tested. Static forms are rejected. |
| Deployment | static, Vercel, Netlify, Cloudflare | Each adapter is generation-tested. Static preview, Vercel build, Netlify build, and Cloudflare build are smoke-tested. |
| Agent instructions | none, Codex, Claude | Each selected target generates only its versioned instruction file; unselected targets generate no agent file. |
| Editor integration | none, VS Code, Cursor, Zed | Each selected target generates only its workspace files and tooling-specific recommendations. The VS Code/Cursor conflict is rejected. |
| Finishing | npm, pnpm, Yarn, Bun; Git/hooks off/on | The lifecycle suite covers every package manager with each valid Git/hooks combination and verifies the matching install and hook commands. |

The generated-project smoke representatives deliberately combine selections
that exercise integration merging: static marketing, Tailwind + MDX + Vercel,
Collections + webhooks + Netlify, and Resend + Cloudflare.

The package-manager lifecycle tests do not install dependencies: they exercise
the generated-project finishing contract with a command runner test double.
The pnpm smoke suite performs the real install, type-check, build, and preview
verification. Run equivalent published-package checks with every supported
package manager during release validation.

## Failure-path coverage

The automated suite verifies invalid selections, incompatible static forms,
invalid or existing target directories, unavailable package-manager commands,
dependency-install failures, and the non-interactive confirmation guard. The
interactive flow returns before invoking generation when the user cancels any
prompt or declines the final summary; its copy is documented in `CLI.md`.
