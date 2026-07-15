/** Homepage FAQ; keep answers short and aligned with README / PRD. */
export const faqSection = {
  id: "faq",
  eyebrow: "FAQ",
  title: "Questions before liftoff",
  description:
    "Straight answers about what Astro Stack generates, what it does not do, and how you run it.",
} as const;

export const faqItems = [
  {
    value: "what-is",
    question: "What is Astro Stack?",
    answer:
      "A guided CLI that generates production-ready Astro applications from a small set of configuration choices, with only the tools, integrations, and files you select.",
  },
  {
    value: "owned",
    question: "Do generated projects depend on Astro Stack at runtime?",
    answer:
      "No. Generated projects are fully project-owned. After creation they have no runtime dependency on Astro Stack.",
  },
  {
    value: "vs-create-astro",
    question: "How is this different from create-astro or a starter repo?",
    answer:
      "create-astro and many starters give you a starting template. Astro Stack walks you through project, tooling, content, forms, and deployment choices, then emits only the stack you chose, with no kitchen-sink leftovers to delete.",
  },
  {
    value: "install",
    question: "How do I run it?",
    answer:
      "Use your package manager’s create command, for example npm create astro-stack@latest. Equivalent commands exist for pnpm, yarn, and bun.",
  },
  {
    value: "requirements",
    question: "What are the requirements?",
    answer:
      "The CLI targets Node.js 22.13 or newer. Generated-project runtime and package-manager details are documented in the product requirements and CLI guide.",
  },
  {
    value: "not-a",
    question: "Is Astro Stack a CMS, host, or website builder?",
    answer:
      "No. It is not a CMS, visual editor, low-code platform, or hosting service. It generates project-owned Astro codebases you develop and deploy yourself.",
  },
  {
    value: "agents",
    question: "Can I add agent instructions or editor config?",
    answer:
      "Yes. During setup you can opt into agent instruction files (such as AGENTS.md or CLAUDE.md), editor integrations, and optional Git pre-commit hooks, each only if you select them.",
  },
] as const;
