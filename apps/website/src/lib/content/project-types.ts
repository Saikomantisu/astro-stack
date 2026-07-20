/** Project types offered by the CLI; keep aligned with README / PRD. */
export const projectTypesSection = {
  id: "project-types",
  eyebrow: "What you can build",
  title: "Start from the project you actually need",
  description:
    "Pick a project shape during setup. Astro Stack generates structure for that intent, not a one-size-fits-all demo.",
} as const;

export const projectTypes = [
  "Marketing Website",
  "Client Site",
  "Blog",
  "Documentation",
  "Portfolio",
  "Blank Project",
] as const;
