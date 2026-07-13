# CLI Usage

The CLI collects a complete `ProjectConfiguration`, validates it, displays a
summary, and only then hands it to the generator. It never starts generation
when validation fails or the user cancels the summary.

Run it interactively from a terminal:

```sh
npm create astro-stack@latest
```

The guided flow covers Project, optional Agent Instructions and Editor
Integration, Styling & Tooling, Content, Forms, Deployment, and a final
Summary. Prompts use concise human-readable labels while retaining safe
defaults. Arrow keys navigate menus, Enter selects an option, and Space toggles
selections in the multi-selects. The final review lets you launch or cancel;
`Ctrl+C` also cancels without writing files.

The project-name field is intentionally empty: its `my-astro-project` hint is
an example, not a value that Enter can accidentally accept. After entering a
name, the output directory defaults to `./<project-name>` and can be edited.

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
