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

Project rendering and installation are implemented by the subsequent generator
stages. Until then, the generation boundary returns a clear error rather than
creating incomplete output.
