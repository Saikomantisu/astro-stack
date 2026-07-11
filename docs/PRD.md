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
