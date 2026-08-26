# Features

`@astro-stack/features` owns the selection catalog and resolution plan consumed
by the CLI and generator. A feature definition declares its selection metadata,
typed contributions, compatibility requirements, validation, and optional
lifecycle hooks.

See the [Astro Stack repository](https://github.com/Saikomantisu/astro-stack)
for usage and architecture details.

`resolveFeatures()` selects and sorts definitions by their stable IDs, making
the resulting plan deterministic. It also rejects conflicting template targets,
configuration values, and incompatible dependency requests before any files are
written. The catalog also supplies stable labels and prompt metadata so CLI
choices cannot drift from feature definitions.
