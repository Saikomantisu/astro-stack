---
name: astro-stack-scaffolding
description: Scaffold a production-ready Astro project with the Astro Stack CLI. Use when a user asks to start a new Astro site, choose an Astro Stack template or integrations, receive an interactive or non-interactive creation command, or troubleshoot invalid Astro Stack CLI selections.
---

# Astro Stack Scaffolding

Use Astro Stack to create a new, independent Astro project. It adds only the files, configuration, and dependencies selected during setup; generated projects do not depend on Astro Stack at runtime.

## Choose the creation mode

Use the interactive flow unless the user needs a reproducible command, CI script, or already supplied every decision:

```sh
npm create astro-stack@latest
```

The CLI requires Node.js 22.13 or later. `pnpm create astro-stack`, `yarn create astro-stack`, and `bun create astro-stack` are equivalent entry points. In the wizard, explain the choices briefly, let the user select them, and review the summary before launching.

For automation, use `--non-interactive --yes` and always give an explicit name and destination. With npm and pnpm, pass CLI arguments after `--`:

```sh
npm create astro-stack@latest -- --non-interactive --yes \
  --name launch-site --directory ./launch-site --type marketing \
  --css tailwind --deployment vercel --agent codex
```

Use the equivalent direct argument form for Yarn or Bun:

```sh
yarn create astro-stack --non-interactive --yes \
  --name contact-site --directory ./contact-site --type client \
  --forms webhooks --deployment netlify --editor vscode --hooks
```

Do not add flags the user did not request. Omitted options retain Astro Stack's defaults: `blank`, `pnpm`, vanilla CSS, strict TypeScript, ESLint/Prettier/Biome, no content/forms/agent/editor setup, static deployment, Git enabled, and hooks disabled.

## Turn requirements into selections

Ask only for choices that are necessary and not already apparent:

- Project type: `marketing`, `client`, `blog`, `documentation`, `portfolio`, or `blank`.
- Styling: `vanilla` or `tailwind`; TypeScript: `strict` or `relaxed`.
- Content: `none`, `markdown`, `mdx`, or `collections`.
- Forms: `none`, `resend`, or `webhooks`; deployment: `static`, `vercel`, `netlify`, or `cloudflare`.
- Optional developer setup: repeat `--agent codex` / `--agent claude`; repeat `--editor vscode` / `--editor cursor` / `--editor zed`; use `--hooks` only when a pre-commit hook is desired.

Use `--no-eslint`, `--no-prettier`, and `--no-biome` only to remove the default tooling. Use `--no-git` only if the user does not want Git initialization.

## Enforce selection constraints

Before giving an automation command, check these rules:

- `blog` and `documentation` create and own their content collections. Do not pass `--content` with either type.
- `resend` and `webhooks` require `vercel`, `netlify`, or `cloudflare`; never pair them with `static`.
- Do not combine `--editor vscode` with `--editor cursor`, because both manage `.vscode` files.
- `--hooks` requires Git; do not combine it with `--no-git`.
- `--non-interactive` requires `--yes`, or the command is rejected.

## Hand off the project

Astro Stack installs dependencies with the selected package manager and initializes Git unless disabled. After a successful command, tell the user to enter the generated directory and use the commands printed by Astro Stack (also recorded in the generated README), typically:

```sh
cd launch-site
pnpm dev
```

If generation reports an installation or Git failure, keep the generated directory for inspection and report the failure; do not describe the project as ready. Use `npm create astro-stack@latest -- --help` to inspect the current CLI surface when options or behavior may have changed.
