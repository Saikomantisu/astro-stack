# CLI Usage

The CLI collects a complete `ProjectConfiguration`, validates it, displays a
summary, and only then hands it to the generator. It never starts generation
when validation fails or the user cancels the summary.

Run it interactively from a terminal:

```sh
npm create astro-stack@latest
```

## Requirements and installation

Astro Stack supports Node.js 22.13 or later. Run the create command with the
package manager you already use; no global installation is required:

```sh
npm create astro-stack@latest
pnpm create astro-stack
yarn create astro-stack
bun create astro-stack
```

The CLI installs the selected project's dependencies with the package manager
chosen during setup and creates that package manager's lockfile. The generated
project is independent of Astro Stack after creation. See the
[generated-project ownership guarantee](./GENERATED_PROJECTS.md) for what that
means in practice.

The guided flow covers Project, optional Agent Instructions and Editor
Integration, Styling & Tooling, Content, Forms, Deployment, and a final
Summary. Prompts use concise human-readable labels while retaining safe
defaults. Arrow keys navigate menus, Enter selects an option, and Space toggles
selections in the multi-selects. The final review lets you launch or cancel;
`Ctrl+C` also cancels without writing files.

The project-name field is intentionally empty: its `my-astro-project` hint is
an example, not a value that Enter can accidentally accept. After entering a
name, the output directory defaults to `./<project-name>` and can be edited.

## Supported choices and defaults

The following are the complete v0.1.1 selection set. Defaults apply to omitted
non-interactive options and are preselected in the wizard unless noted
otherwise.

| Area | Supported choices | Default |
| --- | --- | --- |
| Project type | `marketing`, `client`, `blog`, `documentation`, `portfolio`, `saas-landing`, `blank` | `blank` |
| Package manager | `npm`, `pnpm`, `yarn`, `bun` | `pnpm` |
| CSS | `vanilla`, `tailwind` | `vanilla` |
| TypeScript | `strict`, `relaxed` | `strict` |
| Code quality | ESLint, Prettier, Biome | All selected |
| Content | `none`, `markdown`, `mdx`, `collections` | `none` |
| Forms | `none`, `resend`, `webhooks` | `none` |
| Deployment | `static`, `vercel`, `netlify`, `cloudflare` | `static` |
| Agent instructions | `codex`, `claude` | None |
| Editor integration | `vscode`, `cursor`, `zed` | None |
| Git repository | Initialize or skip | Initialize |
| Pre-commit hook | Install or skip | Skip |
| Final confirmation | Confirm or cancel | Confirm |

In the interactive wizard, a project name is required and the directory starts
as `./<project-name>`. In non-interactive mode, omitted project fields use
`my-astro-project` and `./my-astro-project`; explicitly pass `--name` and
`--directory` for automation so the destination is unambiguous.

Project types choose a minimal starting page structure. Styling, content,
forms, deployment, tooling, agent, editor, and hook selections add only the
files, configuration, and dependencies needed for those selections. See the
[configuration reference](./CONFIGURATION.md) for the generated output owned
by each choice.

Forms have one compatibility rule: `resend` and `webhooks` require a
server-capable deployment (`vercel`, `netlify`, or `cloudflare`) and cannot be
used with `static`. VS Code and Cursor also cannot be selected together because
both own the same `.vscode` files. Invalid, duplicate, or incompatible choices
fail before the CLI writes project files.

## Agent and editor setup

Agent and editor setup is optional: press Enter on either interactive
multi-select, or omit the corresponding automation flags, to skip it. Optional
`codex` and `claude` agent targets generate versioned `AGENTS.md` and
`CLAUDE.md` files respectively. Optional `vscode` and `cursor` targets generate
`.vscode/settings.json` and `.vscode/extensions.json`, with recommendations
only for the selected code-quality tooling. The `zed` target generates
`.zed/settings.json` with selected formatting behavior. VS Code and Cursor
cannot be used together because they own the same workspace files.

Use repeatable `--agent <name>` (`codex` or `claude`) and `--editor <name>`
(`vscode`, `cursor`, or `zed`) options in non-interactive mode. Unknown,
duplicate, and incompatible selections fail before any files are written. Use
`--hooks` to opt into a pre-commit hook, or `--no-hooks` to explicitly skip it.
Hooks require Git, so `--hooks --no-git` fails before files are written.

The generated README and completion output use one concise command surface,
showing the selected package manager's exact development, build, and
project-health commands.

For automation, use `--non-interactive` with explicit selections. Defaults are
applied for omitted selections; use `--yes` to skip the final confirmation.

```sh
create-astro-stack --non-interactive --yes \
  --name launch-site --directory ./launch-site --type marketing \
  --css tailwind --content mdx --deployment vercel \
  --agent codex --agent claude --editor vscode --hooks
```

## Non-interactive reference

Use `--non-interactive --yes` together. Non-interactive runs without `--yes`
are rejected so a script cannot pause waiting for confirmation.

| Option | Values or behavior |
| --- | --- |
| `--name <name>` | Lowercase letters, numbers, and hyphens; required for a clear automated destination. |
| `--directory <path>` | Output directory. |
| `--type <type>` | Any supported project type. |
| `--package-manager <manager>` | `npm`, `pnpm`, `yarn`, or `bun`. |
| `--css <framework>` | `vanilla` or `tailwind`. |
| `--typescript <preference>` | `strict` or `relaxed`. |
| `--content <setup>` | `none`, `markdown`, `mdx`, or `collections`. |
| `--forms <integration>` | `none`, `resend`, or `webhooks`. |
| `--deployment <target>` | `static`, `vercel`, `netlify`, or `cloudflare`. |
| `--agent <target>` | Repeat for `codex` and/or `claude`. |
| `--editor <target>` | Repeat for `vscode`, `cursor`, and/or `zed`; do not combine VS Code with Cursor. |
| `--no-eslint`, `--no-prettier`, `--no-biome` | Remove a default code-quality tool. |
| `--no-git` | Skip Git initialization. |
| `--hooks`, `--no-hooks` | Explicitly enable or skip the pre-commit hook. Hooks require Git. |
| `--yes` | Confirm generation; required with `--non-interactive`. |
| `--non-interactive` | Do not display prompts. |

### Examples

Create a minimal static marketing site with vanilla CSS and no code-quality
tooling:

```sh
npm create astro-stack@latest -- --non-interactive --yes \
  --name launch-site --directory ./launch-site --type marketing \
  --no-eslint --no-prettier --no-biome
```

Create a blog with MDX, Tailwind, Vercel deployment, and a Codex instruction
file:

```sh
pnpm create astro-stack -- --non-interactive --yes \
  --name studio-journal --type blog --css tailwind --content mdx \
  --deployment vercel --agent codex
```

Create a Netlify project with a webhook form, VS Code setup, and the optional
pre-commit hook:

```sh
yarn create astro-stack --non-interactive --yes \
  --name contact-site --type client --forms webhooks --deployment netlify \
  --editor vscode --hooks
```

Use `--help` for the complete option list and supported values. Invalid values
and incompatible choices return a non-zero exit status before the generator is
called. A generator failure also returns a non-zero exit status and is never
reported as a ready project.

After rendering, the CLI installs dependencies using the selected package
manager, which creates its lockfile, and initializes Git by default. Use
`--no-git` to skip repository initialization. If installation or Git setup
fails, the CLI returns a non-zero status and never reports the project as ready;
the generated directory is retained so the failure can be inspected or removed.

When selected, the pre-commit hook is installed only after `git init` succeeds.
It runs selected formatting and safe lint fixes, followed by `typecheck`. If it
cannot be installed, the CLI reports recovery guidance and does not report the
project as ready.

The completion message includes the selected package manager's exact development,
build, preview, and project-health commands, followed by any required form
environment variables and deployment guidance.
