# CLI Usage

The CLI collects a complete `ProjectConfiguration`, validates it, displays a
summary, and only then hands it to the generator. It never starts generation
when validation fails or the user cancels the summary.

Run it interactively from a terminal:

```sh
npm create astro-stack@latest
```

The guided flow covers Project, Styling & Tooling, Content, Forms, Deployment,
and a final Summary. Arrow keys navigate menus, Enter selects an option, and
Space toggles selections in the tooling multi-select. Press `Ctrl+C` to cancel
without writing files.

The project-name and output-directory fields are intentionally empty. Their
`my-astro-project` and `./my-astro-project` hints are examples, not values that
Enter can accidentally accept; enter both values explicitly.

## Planned developer-experience additions

The next CLI experience expansion will add optional, selection-driven setup for
coding-agent instruction files, editor workspace settings, and pre-commit
hooks. These will be presented in the guided flow and reflected in the final
summary. Only the files and hooks explicitly selected by the developer will be
generated.

Its non-interactive equivalent will use repeatable `--agent <name>` and
`--editor <name>` flags plus `--hooks` or `--no-hooks`. These flags are planned,
not yet available; scripts must not rely on them until the implementation is
released. Hook setup will require Git.

The generated README and completion output will also converge on one concise
command surface, showing the selected package manager's exact development,
build, and project-health commands.

For automation, use `--non-interactive` with explicit selections. Defaults are
applied for omitted selections; use `--yes` to skip the final confirmation.

```sh
create-astro-stack --non-interactive --yes \
  --name launch-site --directory ./launch-site --type marketing \
  --css tailwind --content mdx --deployment vercel
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

The completion message includes the exact development command, required form
environment variables, and deployment guidance for the selected features.
