# Astro Stack - Product Requirements Document

## Overview

Astro Stack is a CLI that generates production-ready Astro applications based on the developer's requirements.

Rather than starting from a generic template, Astro Stack guides developers through a small number of grouped configuration screens, generating a clean project with only the tools, integrations, and configuration they need.

The goal is to eliminate repetitive setup while remaining as close to Astro's philosophy as possible.

---

# Vision

Become the standard way developers start production-ready Astro projects.

---

# Goals

- Reduce project setup time from 30–60 minutes to under 5 minutes.
- Generate clean, production-ready Astro projects.
- Only install what the developer selects.
- Follow Astro best practices.
- Produce code that developers fully own.
- Keep generated projects framework-native.
- Provide a modern, enjoyable CLI experience.

---

# Non Goals

Astro Stack is NOT:

- A CMS
- A website builder
- A visual editor
- A low-code platform
- A deployment platform
- A hosting service
- A template marketplace

---

# Target Users

## Primary

- Astro developers
- Freelancers
- Agencies
- Open source contributors

## Secondary

- Developers learning Astro
- Teams standardising Astro projects

---

# User Experience

Developers run:

```bash
npm create astro-stack@latest
```

Instead of asking one question at a time, Astro Stack groups related settings into logical sections.

## Configuration Flow

### 1. Project

- Project name
- What are you building?
- Package manager

### 2. Styling & Tooling

- CSS framework
- ESLint
- Prettier
- TypeScript preferences

### 3. Content

- Content Collections
- Markdown
- MDX

### 4. Features

- Forms
- Authentication (future)
- Analytics (future)
- Search (future)

### 5. Deployment

- Static
- Vercel
- Netlify
- Cloudflare

### 6. Summary

A complete summary of the selected stack is shown before any files are generated.

Developers can:

- Confirm
- Go back and edit
- Cancel

---

# Initial Project Types

- Marketing Website
- Client Website
- Blog
- Documentation
- Portfolio
- SaaS Landing Page
- Blank Project

---

# Initial Feature Set

## Styling

- Tailwind CSS
- Vanilla CSS

## Content

- None
- Markdown
- MDX
- Content Collections

## Forms

- None
- Resend
- Webhooks

## Deployment

- Static
- Vercel
- Netlify
- Cloudflare

## Tooling

- TypeScript
- ESLint
- Prettier

## v0.1.0 Scope Boundary

The initial release supports only the project types and selections listed in
this document's **Initial Project Types** and **Initial Feature Set** sections.
Authentication, analytics, search, community or team presets, and updates to
existing generated projects are explicitly deferred beyond v0.1.0. They must
not be presented as available CLI selections or implied by generated-project
behavior until their requirements and support policies are defined.

## Generated-Project Support Policy

Astro Stack v0.1.0 generates projects with `astro` `^7.0.7`. Generated
projects require Node.js `>=22.12.0` and an even-numbered Node.js release. The
CLI requires Node.js `>=22.13` because its pinned pnpm version has that runtime
minimum.

The generator supports these package-manager versions for generated projects:

| Package manager | Supported version |
| --- | --- |
| npm | `>=9.6.5` |
| pnpm | `>=7.1.0` |
| Yarn | `>=4.0.0` |
| Bun | `>=1.3.0` |

Each generated project uses exactly the package manager selected in the CLI and
produces only that manager's lockfile. The v0.1.0 compatibility commitment is
to install dependencies, type-check, and production-build every supported
selection with the listed runtime and package-manager ranges. Compatibility
with older Astro majors, older package-manager releases, or an unlisted package
manager is outside the release support policy.

---

# Success Metrics

- Time to first commit
- Number of generated projects
- Monthly CLI downloads
- GitHub stars
- Community contributions

---

# Future

- Add integrations to existing projects
- Remove integrations
- Plugin ecosystem
- Team presets
- Community presets
- Configuration sync
