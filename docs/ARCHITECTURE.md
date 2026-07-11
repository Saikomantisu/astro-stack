# Astro Stack Architecture

## Philosophy

Astro Stack is built around modularity.

Every feature is independent.

Nothing should exist in the generated project unless the developer explicitly selected it.

---

# High-Level Flow

```
CLI
    ↓
Grouped Configuration
    ↓
Configuration Object
    ↓
Validation
    ↓
Feature Resolution
    ↓
Project Generation
    ↓
Dependency Installation
    ↓
Project Ready
```

---

# Core Modules

## Package Boundaries

| Package | Public responsibility | May depend on |
| --- | --- | --- |
| `@astro-stack/cli` | Command entry point and user interaction | generator, features, utils |
| `@astro-stack/generator` | Rendering, file creation, and configuration application | features, utils, templates |
| `@astro-stack/features` | Feature contracts, definitions, validation, and resolution | utils, templates |
| `@astro-stack/utils` | Framework-agnostic shared types and helpers | no Astro Stack package |
| `packages/templates` | Source assets used only while generating a project | no runtime consumer |

Packages communicate through their declared public exports. A package must not
import another package's `src` or `dist` files. The dependency directions above
keep the CLI thin and ensure generated projects never depend on Astro Stack.

## CLI

Responsible for:

- Commands
- Banner
- Navigation
- Progress output

---

## Configuration Wizard

The configuration wizard is divided into sections instead of individual prompts.

Sections:

- Project
- Styling & Tooling
- Content
- Features
- Deployment
- Summary

Each section returns a partial configuration.

The final configuration is merged into a single object.

The shared configuration model, defaults, merging API, validation result, and
summary projection are owned by `@astro-stack/utils`. See
[Configuration Model](./CONFIGURATION.md) for the contract used by the CLI and
generator.

Example:

```ts
{
  projectType: "marketing",
  packageManager: "pnpm",
  styling: "tailwind",
  content: "collections",
  forms: "resend",
  deployment: "vercel"
}
```

---

## Validator

Checks for:

- incompatible selections
- unsupported combinations
- missing requirements

Warnings are displayed before generation begins.

---

## Feature Registry

Each feature is completely self-contained.

Example:

```
features/
    tailwind/
    resend/
    mdx/
    collections/
    vercel/
```

Each feature contains:

- dependencies
- templates
- configuration
- install hooks
- post-generation hooks

---

## Generator

Responsible for:

- creating files
- copying templates
- replacing variables
- merging configuration

---

## Installer

Responsible for:

- installing dependencies
- creating lockfiles
- running package manager
- initializing Git

---

## Workspace Layout

```
packages/
    cli/
    generator/
    features/
    templates/
    utils/

docs/
```

`packages/features` is the public registry boundary. Individual feature
definitions are added beneath it only when their dependencies, templates,
configuration changes, validation, and lifecycle behavior are specified.

---

# Design Goals

- Modular
- Predictable
- Testable
- Easy to extend
- Easy to debug
- Framework-native
