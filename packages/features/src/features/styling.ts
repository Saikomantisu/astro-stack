import { defineFeature } from "../define-feature.js";

const starterSiteStyles = `:root {
  font-family: Georgia, "Times New Roman", serif;
  color: #172033;
  background: #f8fafc;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body,
h1,
h2,
h3,
p,
ul {
  margin: 0;
}

body {
  min-width: 20rem;
  background: #f8fafc;
}

a {
  color: #0f766e;
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.16em;
}

h1,
h2,
h3 {
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-weight: 700;
  letter-spacing: -0.03em;
}

header,
nav,
main,
footer {
  width: min(100% - 2rem, 72rem);
  margin-inline: auto;
}

header {
  padding-block: 1.5rem;
  border-bottom: 1px solid color-mix(in srgb, #172033 15%, transparent);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-weight: 700;
}

nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding-block: 1rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

main {
  padding-block: clamp(3rem, 8vw, 6rem);
}

main > * + * {
  margin-top: 3rem;
}

article,
section {
  max-width: 44rem;
}

article > * + *,
section > * + * {
  margin-top: 1rem;
}

h1 {
  max-width: 12ch;
  font-size: clamp(2.5rem, 7vw, 5rem);
  line-height: 0.95;
}

h2 {
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  line-height: 1.1;
}

p,
li {
  font-size: 1.0625rem;
  line-height: 1.7;
}

ul {
  padding-left: 1.25rem;
}

footer {
  padding-block: 2rem;
  border-top: 1px solid color-mix(in srgb, #172033 15%, transparent);
  color: color-mix(in srgb, #172033 65%, transparent);
}
`;

const tailwindStyles = `@import "tailwindcss";

@theme {
  --color-ink: #172033;
  --color-paper: #f8fafc;
  --color-accent: #0f766e;
}

@layer base {
  :root {
    font-family: Georgia, "Times New Roman", serif;
    color: var(--color-ink);
    background: var(--color-paper);
  }

  body {
    min-width: 20rem;
    margin: 0;
    background: var(--color-paper);
  }

  a {
    color: var(--color-accent);
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.16em;
  }

  h1,
  h2,
  h3 {
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-weight: 700;
    letter-spacing: -0.03em;
  }
}

@layer components {
  header,
  nav,
  main,
  footer {
    width: min(100% - 2rem, 72rem);
    margin-inline: auto;
  }

  header {
    padding-block: 1.5rem;
    border-bottom: 1px solid color-mix(in srgb, var(--color-ink) 15%, transparent);
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-weight: 700;
  }

  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding-block: 1rem;
    font-family: ui-sans-serif, system-ui, sans-serif;
  }

  main {
    padding-block: clamp(3rem, 8vw, 6rem);
  }

  main > * + * {
    margin-top: 3rem;
  }

  article,
  section {
    max-width: 44rem;
  }

  article > * + *,
  section > * + * {
    margin-top: 1rem;
  }

  h1 {
    max-width: 12ch;
    font-size: clamp(2.5rem, 7vw, 5rem);
    line-height: 0.95;
  }

  h2 {
    font-size: clamp(1.5rem, 4vw, 2.25rem);
    line-height: 1.1;
  }

  p,
  li {
    font-size: 1.0625rem;
    line-height: 1.7;
  }

  ul {
    padding-left: 1.25rem;
  }

  footer {
    padding-block: 2rem;
    border-top: 1px solid color-mix(in srgb, var(--color-ink) 15%, transparent);
    color: color-mix(in srgb, var(--color-ink) 65%, transparent);
  }
}
`;

export const stylingFeatures = [
  defineFeature({
    id: "styling:vanilla",
    selection: {
      group: "styling.css",
      value: "vanilla",
      label: "Vanilla CSS",
    },
    isSelected: (configuration) => configuration.styling.css === "vanilla",
    contributions: {
      templates: [
        { destination: "src/styles/global.css", content: starterSiteStyles },
      ],
    },
  }),
  defineFeature({
    id: "styling:tailwind",
    selection: {
      group: "styling.css",
      value: "tailwind",
      label: "Tailwind CSS",
    },
    isSelected: (configuration) => configuration.styling.css === "tailwind",
    contributions: {
      dependencies: [
        { name: "@tailwindcss/vite", version: "^4.3.2", type: "devDependency" },
        { name: "tailwindcss", version: "^4.3.2", type: "devDependency" },
      ],
      templates: [
        { destination: "src/styles/global.css", content: tailwindStyles },
      ],
      astroConfig: {
        vitePlugins: [
          {
            id: "tailwindcss",
            expression: "tailwindcss()",
            imports: ['import tailwindcss from "@tailwindcss/vite";'],
          },
        ],
      },
    },
  }),
  ...(["strict", "relaxed"] as const).map((typescript) =>
    defineFeature({
      id: `typescript:${typescript}`,
      selection: {
        group: "styling.typescript",
        value: typescript,
        label: typescript === "strict" ? "Strict (recommended)" : "Relaxed",
      },
      isSelected: (configuration) =>
        configuration.styling.typescript === typescript,
    }),
  ),
] as const;
