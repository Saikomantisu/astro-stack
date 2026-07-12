# ✦ astro stack ✦

> Your Astro project, ready for liftoff.

Astro Stack is a guided CLI for launching production-ready Astro projects.
Choose the pieces your project needs and it assembles a clean, project-owned
codebase—without a starter repository full of things you did not choose.

**No unnecessary files. No unnecessary dependencies. Just the stack you choose.**

## Start a flight plan

Run Astro Stack directly:

```sh
npm create astro-stack@latest
```

Or use your preferred package manager:

```sh
pnpm create astro-stack
yarn create astro-stack
bun create astro-stack
```

For interactive and automation options, see the [CLI usage guide](./docs/CLI.md).

## What you configure

Astro Stack groups decisions into a focused setup flow, then generates only the
corresponding files, dependencies, and configuration.

| Flight system | Available choices |
| --- | --- |
| Project | Marketing site, client site, blog, documentation, portfolio, SaaS landing page, or blank project |
| Styling | Tailwind CSS or vanilla CSS |
| Content | None, Markdown, MDX, or Content Collections |
| Forms | None, Resend, or webhooks |
| Deployment | Static hosting, Vercel, Netlify, or Cloudflare |
| Tooling | TypeScript, ESLint, Prettier, Biome, AI instructions, and editor integrations |

```text
✦ astro stack ✦

Project
───────────────────────────────

Project name
❯ my-website

What are you building?
❯ Marketing Website

Package manager
❯ pnpm
```

When your flight plan is complete, Astro Stack creates the project, installs
its selected dependencies, and leaves it ready for development.

## Built for a clean launch

- **Close to Astro** — prefer Astro’s official capabilities over custom layers.
- **Project-owned output** — generated projects have no runtime dependency on Astro Stack.
- **Production-minded defaults** — start from a maintainable structure, not demo code.
- **Intentional prompts** — each selection changes the generated output.
- **Modular choices** — features own their dependencies, templates, configuration, and hooks.

Read the full [product principles](./docs/PRINCIPLES.md) and
[architecture](./docs/ARCHITECTURE.md).

## Release baseline

The initial public release is **v0.1.0**. The CLI supports **Node.js >=22.13**
and uses the pinned pnpm workspace version **pnpm@11.0.8**. Generated-project
runtime and package-manager requirements are defined in the
[support policy](./docs/PRD.md#generated-project-support-policy).

## On the horizon

- Pre-commit hooks
- A concise, consistent generated-project command surface
- Add and remove integrations in existing projects
- Community and team presets
- Plugin system
- Configuration sync

## Contributing

Ideas, feedback, and contributions are welcome. Start with
[CONTRIBUTING.md](./CONTRIBUTING.md) and the
[local development guide](./docs/DEVELOPMENT.md).

## License

[MIT](./LICENSE)
