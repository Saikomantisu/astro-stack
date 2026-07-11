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

# Folder Structure

```
packages/
    cli/
    generator/
    features/
    templates/
    utils/

docs/
```

---

# Design Goals

- Modular
- Predictable
- Testable
- Easy to extend
- Easy to debug
- Framework-native
