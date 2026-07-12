# Features

`@astro-stack/features` owns the registry and resolution plan consumed by the
generator. A feature definition declares its selection predicate, dependencies,
templates, configuration changes, validation, and optional lifecycle hooks.

`resolveFeatures()` selects and sorts definitions by their stable IDs, making
the resulting plan deterministic. It also rejects conflicting template targets,
configuration addresses, and incompatible dependency requests before any files
are written. Each supported feature owns the templates, dependencies, and
configuration it contributes to the generated project.
