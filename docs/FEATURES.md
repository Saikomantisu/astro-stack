# Feature catalog

`@astro-stack/features` owns the selectable feature catalog. The CLI reads its
labels and prompt metadata from that catalog. The generator reads the resolved
contributions. A new choice in an existing group does not require another label
or choice list in the CLI.

## Catalog structure

Selection groups live in `packages/features/src/selection-groups.ts`. A group
defines its stable ID, supported values, selection type, prompt copy, and
automation flag. The supported value arrays come from `@astro-stack/utils`,
which remains the owner of the public `ProjectConfiguration` type.

Built-in definitions live under `packages/features/src/features`. The explicit
registry in `packages/features/src/registry.ts` combines those modules. Explicit
imports keep the published package deterministic and avoid runtime file
discovery.

Each selectable definition has:

- A stable feature ID.
- Selection metadata with a group, value, and label.
- A predicate that reads the complete project configuration.
- Optional capabilities that it provides, requires, or cannot use with another
  feature.
- Typed contributions for generated output.

The catalog checks that every supported group value has exactly one labeled
definition. The CLI uses the catalog order and labels for interactive prompts,
while Commander continues to reject unsupported automation values.

## Typed contributions

New built-in features use the `contributions` object instead of dotted
configuration changes. Supported contributions include:

- Generated dependencies and files.
- Package scripts.
- Astro integrations, Vite plugins, one adapter, and the output mode.
- Environment variables and completion notes.
- pnpm build approvals.
- Starter-page content for defined page locations.

The resolver appends and deduplicates list contributions. It rejects different
values for singleton contributions such as the Astro adapter or output mode. It
also rejects conflicting package scripts, dependency versions, environment
variables, and generated file destinations before the generator writes files.

`FeatureConfigurationChange` remains available for existing programmatic
registries, but it is deprecated. New features should use typed contributions.

## Capabilities and compatibility

A feature can provide a named capability and another feature can require it.
For example, Vercel, Netlify, and Cloudflare provide `server-runtime`. Resend and
webhook forms require that capability. The resolver reports the requirement's
stable error code, configuration path, message, and suggested correction.

Direct incompatibilities reference another feature ID. VS Code uses this to
reject Cursor because both selections own `.vscode` files. File conflict
detection remains a second guard for custom registries.

## Adding a choice to an existing group

1. Add the typed value to the matching supported-value array in
   `packages/utils/src/model.ts`.
2. Add a definition under `packages/features/src/features` with selection
   metadata and typed contributions.
3. Export the definition through `packages/features/src/registry.ts`.
4. Add catalog, resolution, generator, and generated-project coverage.
5. Update the CLI and configuration documentation and add a changeset.

The CLI derives the choice label and prompt option from the catalog. The
generator consumes the same resolution structure for every feature.

Adding a new selection group still requires a configuration field, default,
validation, and one wizard location. This is intentional. New categories change
the public configuration contract and the order of the guided flow, so they
should remain explicit.

The CMS group follows this path. `content.cms` owns the `none` and `pages`
values, while the Pages CMS definition owns its root configuration, media
folder, compatibility check, and completion note.
