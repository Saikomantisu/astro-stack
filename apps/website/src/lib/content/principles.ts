export const principlesSection = {
  id: "principles",
  eyebrow: "How we think",
  title: "Guided by simplicity",
  description:
    "Product decisions follow a small set of principles. Condensed from the full principles document.",
} as const;

export const principles = [
  {
    title: "Stay close to Astro",
    description:
      "Generated projects should feel like Astro itself. Avoid unnecessary abstractions.",
  },
  {
    title: "Developers own the code",
    description:
      "Astro Stack is not a runtime dependency after creation. Your project is yours.",
  },
  {
    title: "Generate only what is needed",
    description:
      "Every file, dependency, and configuration exists because you chose it.",
  },
  {
    title: "Production first",
    description: "Ready for real-world development, not demo placeholders.",
  },
  {
    title: "Great developer experience",
    description:
      "Fast, clear, intentional CLI interactions from start to finish.",
  },
  {
    title: "Every prompt earns its place",
    description:
      "Each question has a meaningful effect on the generated project.",
  },
  {
    title: "Smart defaults",
    description: "Sensible defaults so you only change what matters to you.",
  },
  {
    title: "Native before custom",
    description:
      "Prefer official Astro features whenever possible over custom solutions.",
  },
] as const;
