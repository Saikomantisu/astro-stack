/** Stack choices supported by the CLI; keep aligned with docs/CONFIGURATION.md. */
export const featuresSection = {
  id: "features",
  eyebrow: "Build your stack",
  title: "Choose the tools your project needs",
  description:
    "Select the integrations and tooling that fit your project. Everything else stays out of the generated codebase.",
} as const;

export const features = [
  {
    title: "Styling",
    icon: "icons/tailwindcss.svg",
    iconAlt: "Tailwind CSS logo",
    description:
      "Choose Tailwind CSS or a lean vanilla CSS setup. Your styles start with only the approach you select.",
  },
  {
    title: "TypeScript",
    icon: "icons/typescript.svg",
    iconAlt: "TypeScript logo",
    description:
      "Set TypeScript to strict or relaxed based on the safety and flexibility your team prefers.",
  },
  {
    title: "Code quality",
    icon: "icons/biomejs.svg",
    iconAlt: "Biome logo",
    description:
      "Add ESLint, Prettier, and Biome independently—only the linting and formatting tools you want.",
  },
  {
    title: "Content",
    icon: "icons/markdown-dark.svg",
    iconAlt: "Markdown logo",
    description:
      "Start without content, or choose Markdown, MDX, or Astro Content Collections for a structured publishing path.",
  },
  {
    title: "Forms",
    icon: "icons/resend-icon-white.svg",
    iconAlt: "Resend logo",
    description:
      "Opt into a Resend-powered contact form or webhook forwarding when your project needs form handling.",
  },
  {
    title: "Deployment",
    icon: "icons/vercel_dark.svg",
    iconAlt: "Vercel logo",
    description:
      "Target static hosting, Vercel, Netlify, or Cloudflare with the matching official Astro adapter.",
  },
] as const;
