/** Setup areas presented by the CLI, in prompt order. */
export const flightPlanSteps = [
  {
    step: 1,
    label: "Project",
    summary: "Name, type, package manager, directory, and Git",
    detail:
      "Choose what you are building, such as a marketing site, blog, docs, portfolio, or SaaS landing page, plus how to scaffold the repo.",
  },
  {
    step: 2,
    label: "Developer experience",
    summary: "Agent instructions, editor integration, pre-commit hooks",
    detail:
      "Optionally add agent instruction files, editor settings, and a safe pre-commit hook that runs format, lint, and type checks.",
  },
  {
    step: 3,
    label: "Styling & tooling",
    summary: "CSS, TypeScript, ESLint / Prettier / Biome",
    detail:
      "Pick Tailwind or vanilla CSS and the lint/format stack that matches your team, without extra tools you did not ask for.",
  },
  {
    step: 4,
    label: "Content",
    summary: "None, Markdown, MDX, or Content Collections",
    detail:
      "Add only the content path you need so documentation and blog projects stay lean.",
  },
  {
    step: 5,
    label: "Features",
    summary: "Forms and future integrations",
    detail:
      "Opt into features such as forms (Resend or webhooks). Each feature brings its own dependencies and configuration.",
  },
  {
    step: 6,
    label: "Deployment",
    summary: "Static, Vercel, Netlify, or Cloudflare",
    detail:
      "Configure the adapter and hosting target that matches how you ship.",
  },
  {
    step: 7,
    label: "Summary",
    summary: "Review → generate → install",
    detail:
      "Confirm the full flight plan, generate the project, install dependencies, and liftoff.",
  },
] as const;
