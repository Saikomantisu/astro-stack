# Generated Project Ownership

Astro Stack creates a new Astro project that you own completely. Once
generation finishes, the project is an ordinary independent codebase: you can
rename, edit, delete, deploy, transfer, or stop using it without involving
Astro Stack.

## What Astro Stack writes

The generator writes a minimal Astro application, the configuration and
dependencies required by your selected options, and any selected developer
experience files. This can include project source files, `package.json`, Astro
configuration, selected integration configuration, documentation, and optional
Git, editor, agent-instruction, and pre-commit-hook files.

Those files become your project files. Astro Stack does not retain ownership of
them, connect the project to a service, or require an Astro Stack account. You
can modify or remove any generated file, replace an integration, and maintain
the resulting project using normal Astro and package-manager workflows.

## No Astro Stack runtime dependency

Generated projects do not import, execute, or list an `@astro-stack/*` package
in `dependencies` or `devDependencies`. Astro Stack runs only while creating
the project. After generation, development, builds, previews, and deployment
use the generated project's own scripts and the dependencies selected for it.

For example, a project with only the base selection has Astro, TypeScript, and
Astro's type-checking tool as development dependencies. Selecting Tailwind,
MDX, an adapter, Resend, or a code-quality tool adds that selected integration
and its required packages; it never adds Astro Stack itself. The exact package
manifest is generated in your project directory and is the source of truth for
its dependencies.

## Maintaining a generated project

Install, run, and upgrade dependencies from the generated project's directory
with its selected package manager. The generated README lists the available
commands for that specific selection.

Astro Stack v0.1 does not provide a project-update or configuration-sync
command. Updates to Astro, integrations, and application code are therefore
made directly in the generated project, on your normal release schedule. This
keeps ownership and upgrade decisions with the project maintainer.

If you want to verify the boundary, inspect the generated `package.json` and
source imports: neither should reference `@astro-stack/*`. The generator test
suite enforces this manifest guarantee for generated projects.
