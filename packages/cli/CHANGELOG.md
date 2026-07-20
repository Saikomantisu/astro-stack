# create-astro-stack

## 1.0.0

### Major Changes

- 73a32ca: Replace the shared project starter with distinct Marketing, Client Website,
  Blog, Documentation, and Portfolio blueprints. Blog and Documentation now own
  their native content collections and routes. Remove the `saas-landing` project
  type; use `marketing` for product landing pages.

### Patch Changes

- 73a32ca: Fix generated project installation, quality-tooling checks, contact forms, and documentation navigation.
- Updated dependencies [73a32ca]
- Updated dependencies [73a32ca]
  - @astro-stack/generator@1.0.0
  - @astro-stack/utils@1.0.0

## 0.1.2

### Patch Changes

- 72d7f96: Fix `npm create astro-stack` so the installed CLI runs when npm invokes its bin through a symlink.
  - @astro-stack/generator@0.1.2
  - @astro-stack/utils@0.1.2

## 0.1.1

### Patch Changes

- 3acf155: Prepare public npm package metadata and publishing configuration.
- Updated dependencies [3acf155]
  - @astro-stack/generator@0.1.1
  - @astro-stack/utils@0.1.1
