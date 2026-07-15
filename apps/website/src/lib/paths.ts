/**
 * Prefix an internal path with Astro's configured base (project Pages safe).
 * `import.meta.env.BASE_URL` always ends with `/`.
 *
 * Hash-only paths (`#features`) resolve to the homepage under base
 * (`/astro-stack/#features`) so section links work from any route.
 */
export function withBase(path = "/"): string {
  const base = import.meta.env.BASE_URL;
  if (path === "/" || path === "") return base;
  // Homepage section anchors: always base-aware so they work off-home.
  if (path.startsWith("#")) return `${base}${path}`;
  // External or protocol-relative URLs are left alone.
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(path)) return path;
  // Already-absolute same-origin paths with base prefix: leave alone.
  if (path.startsWith(base)) return path;

  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${normalized}`;
}

/** True when the href points off-site (http(s), mailto, etc.). */
export function isExternalHref(href: string): boolean {
  return (
    /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(href) || href.startsWith("mailto:")
  );
}
