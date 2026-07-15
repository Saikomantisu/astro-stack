export const site = {
  name: "Astro Stack",
  tagline: "Your Astro project, ready for liftoff.",
  description:
    "A guided CLI for production-ready Astro projects with only the stack you choose, fully project-owned.",
} as const;

export const author = {
  name: "Ravinath Akalanka",
  github: "https://github.com/Saikomantisu",
} as const;

export const links = {
  github: "https://github.com/Saikomantisu/astro-stack",
  docs: "docs/",
  npm: "https://www.npmjs.com/package/create-astro-stack",
} as const;

/** GitHub blob URL for a file under `docs/` (e.g. `CLI.md`). */
export function docUrl(path: string): string {
  const normalized = path.replace(/^\//, "");
  return `https://github.com/Saikomantisu/astro-stack/blob/main/docs/${normalized}`;
}

/**
 * Primary header nav. Paths are site-relative (no leading slash) or hash
 * anchors; resolve with `withBase()` at render.
 */
export const primaryNav = [
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
] as const;

/** The small, high-value set of destinations surfaced from the Resources menu. */
export const resourceNav = [
  { label: "Installation", href: "docs/installation/" },
  { label: "Documentation", href: links.docs },
  { label: "Changelog", href: "changelog/" },
  { label: "GitHub", href: links.github, external: true },
] as const;

/** Footer link groups. Paths are site-relative or external URLs. */
export const footerNav = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Installation", href: "docs/installation/" },
  ],
  resources: [...resourceNav],
  company: [
    { label: "Privacy", href: "legal/privacy/" },
    { label: "Terms", href: "legal/terms/" },
  ],
} as const;

/** Deep-link CTA used by header primary button. */
export const cta = {
  label: "Get started",
  href: "docs/installation/",
} as const;
