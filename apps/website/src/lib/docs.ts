export interface DocsNavItem {
  slug: string;
  label: string;
  description: string;
  section: "Guide" | "Reference";
  order: number;
}

export const docsNavigation: DocsNavItem[] = [
  {
    slug: "",
    label: "Introduction",
    description: "What Astro Stack creates and how the CLI works.",
    section: "Guide",
    order: 1,
  },
  {
    slug: "installation",
    label: "Installation",
    description: "Run the CLI and create your first project.",
    section: "Guide",
    order: 2,
  },
  {
    slug: "project-types",
    label: "Project types",
    description: "Choose the right minimal starting point for your work.",
    section: "Guide",
    order: 3,
  },
  {
    slug: "content",
    label: "Content",
    description: "Work with the Markdown and MDX content setup.",
    section: "Guide",
    order: 4,
  },
  {
    slug: "forms",
    label: "Forms",
    description: "Connect a contact form to Resend or a webhook.",
    section: "Guide",
    order: 5,
  },
  {
    slug: "deployment",
    label: "Deployment",
    description: "Prepare static and server-rendered projects for hosting.",
    section: "Guide",
    order: 6,
  },
  {
    slug: "cli-reference",
    label: "CLI reference",
    description: "Every option, default, and automation flag.",
    section: "Reference",
    order: 3,
  },
  {
    slug: "configuration",
    label: "Configuration",
    description: "What each choice adds to your generated project.",
    section: "Reference",
    order: 4,
  },
  {
    slug: "generated-projects",
    label: "Generated projects",
    description: "Understand the project ownership boundary.",
    section: "Reference",
    order: 5,
  },
  {
    slug: "project-structure",
    label: "Project structure",
    description:
      "See the generated project's core files and optional additions.",
    section: "Reference",
    order: 6,
  },
  {
    slug: "troubleshooting",
    label: "Troubleshooting",
    description: "Resolve setup, validation, and finishing issues.",
    section: "Reference",
    order: 11,
  },
  {
    slug: "tooling",
    label: "Tooling",
    description: "Run the generated checks, formatters, and hooks.",
    section: "Reference",
    order: 12,
  },
  {
    slug: "contributing",
    label: "Contributing",
    description: "Set up the workspace and understand its architecture.",
    section: "Reference",
    order: 13,
  },
];

export function docsHref(slug = ""): string {
  return slug ? `docs/${slug}/` : "docs/";
}

export function docsNeighbours(slug: string) {
  const index = docsNavigation.findIndex((item) => item.slug === slug);
  return {
    previous: index > 0 ? docsNavigation[index - 1] : undefined,
    next:
      index >= 0 && index < docsNavigation.length - 1
        ? docsNavigation[index + 1]
        : undefined,
  };
}
