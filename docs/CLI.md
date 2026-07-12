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
