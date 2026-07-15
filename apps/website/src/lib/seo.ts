import { site as siteConfig } from "@/lib/site";

/**
 * Build a document title. Homepage-style titles that already include the brand
 * name are left as-is; others become `Astro Stack · {page}`.
 */
export function pageTitle(title?: string): string {
  if (!title || title === siteConfig.name) return siteConfig.name;
  if (title.startsWith(`${siteConfig.name}`)) return title;
  return `${siteConfig.name} · ${title}`;
}

/**
 * Absolute URL for a site path or full URL, using `import.meta.env.SITE` and
 * `BASE_URL` so project Pages paths stay correct.
 */
export function absoluteUrl(pathOrUrl = "/"): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const site = import.meta.env.SITE?.replace(/\/$/, "") ?? "";
  const base = import.meta.env.BASE_URL; // always ends with /

  if (pathOrUrl === "/" || pathOrUrl === "") {
    return site ? `${site}${base}` : base;
  }

  if (pathOrUrl.startsWith("#")) {
    return site ? `${site}${base}${pathOrUrl}` : `${base}${pathOrUrl}`;
  }

  const normalized = pathOrUrl.startsWith("/") ? pathOrUrl.slice(1) : pathOrUrl;

  // Avoid double-prefixing when callers pass a path that already includes base.
  if (normalized.startsWith(base.replace(/^\//, ""))) {
    return site ? `${site}/${normalized}` : `/${normalized}`;
  }

  return site ? `${site}${base}${normalized}` : `${base}${normalized}`;
}

/** Default Open Graph image path (site-relative, no leading slash). */
export const defaultOgImage = "og/default.png";

export function defaultJsonLd() {
  const url = absoluteUrl("/");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: siteConfig.name,
        url,
        description: siteConfig.description,
        inLanguage: "en",
      },
      {
        "@type": "SoftwareApplication",
        name: siteConfig.name,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Node.js",
        description: siteConfig.description,
        url,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };
}
