export type ChangelogEntry = {
  title: string;
  detail: string;
};

export type Release = {
  version: string;
  label: string;
  summary: string;
  entries: ChangelogEntry[];
};

/**
 * Website-ready summary of released versions. Keep this aligned with the
 * repository CHANGELOG.md; detailed package notes remain in the repository.
 */
export const releases: Release[] = [
  {
    version: "0.1.0",
    label: "Initial public release",
    summary:
      "The first stable baseline for launching an Astro project with only the stack you choose.",
    entries: [
      {
        title: "Guided project generation",
        detail:
          "Create marketing sites, client projects, blogs, documentation, portfolios, SaaS landing pages, or a blank Astro project.",
      },
      {
        title: "Intentional stack choices",
        detail:
          "Choose styling, content, forms, deployment, code-quality tooling, and developer-experience integrations without adding unselected dependencies.",
      },
      {
        title: "Project-owned output",
        detail:
          "Generated projects are independent of Astro Stack and ready to develop, build, and deploy on their own terms.",
      },
    ],
  },
];
