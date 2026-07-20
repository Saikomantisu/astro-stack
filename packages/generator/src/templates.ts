import {
  generatedProjectCommands,
  type ProjectConfiguration,
} from "@astro-stack/utils";

export interface ProjectTemplate {
  destination: string;
  content: string;
}

interface TemplateContext {
  contactForm: string;
  contactFormImport: string;
  installCommand: string;
  projectName: string;
  projectTitle: string;
  projectDescription: string;
  projectContent: string;
}

const projectDetails = {
  marketing: [
    "Marketing Website",
    "A focused Astro marketing site, ready for your message.",
  ],
  client: [
    "Client Website",
    "A practical multi-page starting point for your client.",
  ],
  blog: [
    "Blog",
    "A writing-ready Astro blog with a built-in content collection.",
  ],
  documentation: [
    "Documentation",
    "A semantic documentation starter with a built-in content collection.",
  ],
  portfolio: ["Portfolio", "A focused home for your work and case studies."],
  blank: ["Astro Project", "A minimal Astro project."],
} as const;

function render(template: string, context: TemplateContext): string {
  return template.replace(
    /{{(contactForm|contactFormImport|installCommand|projectName|projectTitle|projectDescription|projectContent)}}/g,
    (_match, key: keyof TemplateContext) => context[key],
  );
}

function createContext(configuration: ProjectConfiguration): TemplateContext {
  const [projectTitle, projectDescription] =
    projectDetails[configuration.project.type];
  return {
    contactForm:
      configuration.features.forms === "none"
        ? ""
        : "<ContactForm />",
    contactFormImport:
      configuration.features.forms === "none"
        ? ""
        : "import ContactForm from '../components/ContactForm.astro';",
    installCommand: `${configuration.project.packageManager} install`,
    projectName: configuration.project.name,
    projectTitle,
    projectDescription,
    projectContent:
      configuration.project.type === "blog"
        ? "\n## Content\n\nThis project includes a `blog` content collection and a sample post.\n"
        : configuration.project.type === "documentation"
          ? "\n## Content\n\nThis project includes a `docs` content collection and sample documentation pages.\n"
          : "",
  };
}

function manifest(configuration: ProjectConfiguration): string {
  return `${JSON.stringify({ name: configuration.project.name, version: "0.0.0", private: true, type: "module", engines: { node: ">=22.12.0" }, scripts: { dev: "astro dev", start: "astro dev", build: "astro build", preview: "astro preview", typecheck: "astro check" }, devDependencies: { "@astrojs/check": "^0.9.9", astro: "^7.0.7", typescript: "^5.8.3" } }, null, 2)}\n`;
}

function pnpmWorkspaceConfiguration(configuration: ProjectConfiguration): string {
  const buildDependencies = [
    "esbuild",
    ...(configuration.deployment.target === "netlify"
      ? ["@parcel/watcher", "sharp"]
      : configuration.deployment.target === "cloudflare"
        ? ["sharp", "workerd"]
        : []),
  ].sort();
  return `allowBuilds:\n${buildDependencies
    .map(
      (dependency) =>
        `  ${dependency.startsWith("@") ? JSON.stringify(dependency) : dependency}: true`,
    )
    .join("\n")}\n`;
}

const styledLayout = `---
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content={description} />
    <title>{title}</title>
  </head>
  <body>
    <header>
      <a href="/">{{projectTitle}}</a>
    </header>
    <main><slot /></main>
    <footer>
      <small>Built with Astro.</small>
    </footer>
  </body>
</html>
`;

const blogLayout = `---
interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content={description} />
    <title>{title}</title>
  </head>
  <body>
    <header>
      <a href="/">{{projectTitle}}</a>
    </header>
    <main><slot /></main>
    <footer>
      <small>Built with Astro.</small>
    </footer>
  </body>
</html>

<style is:global>
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 1rem;
    line-height: 1.6;
  }

  header,
  main,
  footer {
    width: min(100% - 2rem, 44rem);
    margin-inline: auto;
  }

  header,
  footer {
    padding-block: 1.5rem;
  }

  main {
    padding-block: 3rem;
  }

  article > * + *,
  main > * + * {
    margin-top: 1.5rem;
  }

  h1,
  h2 {
    font-family: ui-sans-serif, system-ui, sans-serif;
    line-height: 1.1;
  }

  h1 {
    font-size: clamp(2.25rem, 8vw, 4rem);
  }

  h2 {
    font-size: clamp(1.5rem, 4vw, 2rem);
  }

  p,
  li,
  time {
    font-size: 1rem;
  }
</style>
`;

function marketingTemplates(context: TemplateContext): ProjectTemplate[] {
  return [
    {
      destination: "src/layouts/SiteLayout.astro",
      content: render(styledLayout, context),
    },
    {
      destination: "src/pages/index.astro",
      content: render(
        `---
import SiteLayout from '../layouts/SiteLayout.astro';
{{contactFormImport}}
---

<SiteLayout title="{{projectTitle}}" description="{{projectDescription}}">
  <section>
    <p>Welcome</p>
    <h1>{{projectTitle}}</h1>
    <p>{{projectDescription}}</p>
    <a href="#contact">Start a conversation</a>
  </section>
  <section aria-labelledby="benefits">
    <h2 id="benefits">Why it matters</h2>
    <ul>
      <li>Clear message</li>
      <li>Focused audience</li>
      <li>Simple next step</li>
    </ul>
  </section>
  <section id="contact">
    <h2>Ready to begin?</h2>
    {{contactForm}}
    <p>Replace this call to action with your preferred contact path.</p>
  </section>
</SiteLayout>
`,
        context,
      ),
    },
  ];
}

function clientTemplates(context: TemplateContext): ProjectTemplate[] {
  const page = (title: string, description: string, body: string) =>
    render(
      `---
import SiteLayout from '../layouts/SiteLayout.astro';
---

<SiteLayout title="${title}" description="${description}">
  <h1>${title}</h1>
  <p>${body}</p>
</SiteLayout>
`,
      context,
    );
  return [
    {
      destination: "src/layouts/SiteLayout.astro",
      content: render(
        styledLayout.replace(
          "<main><slot /></main>",
          `<nav aria-label="Primary">
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/services">Services</a>
      <a href="/contact">Contact</a>
    </nav>
    <main><slot /></main>`,
        ),
        context,
      ),
    },
    {
      destination: "src/pages/index.astro",
      content: page(
        "{{projectTitle}}",
        "{{projectDescription}}",
        "Introduce the client, their work, and the outcome they create.",
      ),
    },
    {
      destination: "src/pages/about.astro",
      content: page(
        "About",
        "Learn about this client.",
        "Tell the client’s story, values, and approach.",
      ),
    },
    {
      destination: "src/pages/services.astro",
      content: page(
        "Services",
        "Explore available services.",
        "Describe the services or offerings available to visitors.",
      ),
    },
    {
      destination: "src/pages/contact.astro",
      content: render(
        `---
import SiteLayout from '../layouts/SiteLayout.astro';
{{contactFormImport}}
---

<SiteLayout title="Contact" description="Get in touch.">
  <h1>Contact</h1>
  {{contactForm}}
  <p>Add contact details here, or select a forms integration to add a contact form.</p>
</SiteLayout>
`,
        context,
      ),
    },
  ];
}

function blogTemplates(context: TemplateContext): ProjectTemplate[] {
  return [
    {
      destination: "src/layouts/BlogLayout.astro",
      content: render(blogLayout, context),
    },
    {
      destination: "src/content.config.ts",
      content:
        'import { defineCollection } from "astro:content";\nimport { glob } from "astro/loaders";\nimport { z } from "astro/zod";\n\nconst blog = defineCollection({\n  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),\n  schema: z.object({\n    title: z.string(),\n    description: z.string(),\n    pubDate: z.coerce.date(),\n  }),\n});\n\nexport const collections = { blog };\n',
    },
    {
      destination: "src/content/blog/welcome.md",
      content:
        "---\ntitle: Welcome to your blog\ndescription: Your first post, ready to make your own.\npubDate: 2026-01-01\n---\n\n# Start writing here\n\nThis post is rendered from the built-in blog collection.\n",
    },
    {
      destination: "src/pages/index.astro",
      content: render(
        '---\nimport BlogLayout from \'../layouts/BlogLayout.astro\';\n---\n\n<BlogLayout title="{{projectTitle}}" description="{{projectDescription}}">\n  <h1>{{projectTitle}}</h1>\n  <p>{{projectDescription}}</p>\n  <p><a href="/blog">Read the blog</a></p>\n</BlogLayout>\n',
        context,
      ),
    },
    {
      destination: "src/pages/blog/index.astro",
      content:
        '---\nimport { getCollection } from "astro:content";\nimport BlogLayout from \'../../layouts/BlogLayout.astro\';\n\nconst posts = (await getCollection("blog")).sort(\n  (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),\n);\n---\n\n<BlogLayout title="Blog" description="Latest writing.">\n  <h1>Blog</h1>\n  <ul>\n    {posts.map((post) => (\n      <li>\n        <article>\n          <h2><a href={`/blog/${post.id}/`}>{post.data.title}</a></h2>\n          <p>{post.data.description}</p>\n          <time datetime={post.data.pubDate.toISOString()}>\n            {post.data.pubDate.toLocaleDateString()}\n          </time>\n        </article>\n      </li>\n    ))}\n  </ul>\n</BlogLayout>\n',
    },
    {
      destination: "src/pages/blog/[...slug].astro",
      content:
        '---\nimport { getCollection, render, type CollectionEntry } from "astro:content";\nimport BlogLayout from \'../../layouts/BlogLayout.astro\';\n\nexport async function getStaticPaths() {\n  const posts = await getCollection("blog");\n  return posts.map((post) => ({\n    params: { slug: post.id },\n    props: { post },\n  }));\n}\n\nconst { post } = Astro.props as { post: CollectionEntry<"blog"> };\nconst { Content } = await render(post);\n---\n\n<BlogLayout title={post.data.title} description={post.data.description}>\n  <article>\n    <p><a href="/blog">Back to blog</a></p>\n    <h1>{post.data.title}</h1>\n    <p>{post.data.description}</p>\n    <time datetime={post.data.pubDate.toISOString()}>\n      {post.data.pubDate.toLocaleDateString()}\n    </time>\n    <Content />\n  </article>\n</BlogLayout>\n',
    },
  ];
}

function documentationTemplates(context: TemplateContext): ProjectTemplate[] {
  const docsLayout = `---
interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content={description} />
    <title>{title}</title>
  </head>
  <body>
    <header>
      <a href="/docs">Documentation</a>
    </header>
    <nav aria-label="Documentation">
      <ul>
        <li><a href="/docs">Overview</a></li>
        {pages.map((page) => (
          <li><a href={\`/docs/\${page.id}/\`}>{page.data.title}</a></li>
        ))}
      </ul>
    </nav>
    <main><slot /></main>
  </body>
</html>

<style is:global>
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 1rem;
    line-height: 1.6;
  }

  header,
  nav,
  main {
    width: min(100% - 2rem, 44rem);
    margin-inline: auto;
  }

  header {
    padding-top: 1.5rem;
  }

  nav {
    padding-block: 1rem;
  }

  nav ul {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  main {
    padding-block: 3rem;
  }

  article > * + *,
  main > * + * {
    margin-top: 1.5rem;
  }

  h1,
  h2 {
    font-family: ui-sans-serif, system-ui, sans-serif;
    line-height: 1.1;
  }

  h1 {
    font-size: clamp(2.25rem, 8vw, 4rem);
  }

  h2 {
    font-size: clamp(1.5rem, 4vw, 2rem);
  }

  p,
  li {
    font-size: 1rem;
  }
</style>
`;
  const collectionLayout = docsLayout.replace(
    "const { title, description } = Astro.props;\n---",
    'const { title, description } = Astro.props;\n\nimport { getCollection } from "astro:content";\n\nconst pages = (await getCollection("docs")).sort(\n  (a, b) => (a.data.order ?? 0) - (b.data.order ?? 0),\n);\n---',
  );
  return [
    { destination: "src/layouts/DocsLayout.astro", content: collectionLayout },
    {
      destination: "src/content.config.ts",
      content:
        'import { defineCollection } from "astro:content";\nimport { glob } from "astro/loaders";\nimport { z } from "astro/zod";\n\nconst docs = defineCollection({\n  loader: glob({ pattern: "**/*.md", base: "./src/content/docs" }),\n  schema: z.object({\n    title: z.string(),\n    description: z.string(),\n    order: z.number().optional(),\n  }),\n});\n\nexport const collections = { docs };\n',
    },
    {
      destination: "src/content/docs/getting-started.md",
      content:
        "---\ntitle: Getting started\ndescription: Set up the foundation for your documentation.\norder: 1\n---\n\n# Getting started\n\nThis is the first page in your documentation collection.\n",
    },
    {
      destination: "src/content/docs/guides/authoring.md",
      content:
        "---\ntitle: Authoring documentation\ndescription: Write clear, useful documentation pages.\norder: 2\n---\n\n# Authoring documentation\n\nAdd Markdown files under `src/content/docs` to grow this site.\n",
    },
    {
      destination: "src/pages/index.astro",
      content:
        '---\nimport DocsLayout from \'../layouts/DocsLayout.astro\';\n---\n\n<DocsLayout title="Documentation" description="Project documentation.">\n  <h1>Documentation</h1>\n  <p><a href="/docs">Open the documentation</a></p>\n</DocsLayout>\n',
    },
    {
      destination: "src/pages/docs/index.astro",
      content:
        '---\nimport { getCollection } from "astro:content";\nimport DocsLayout from \'../../layouts/DocsLayout.astro\';\n\nconst pages = (await getCollection("docs")).sort(\n  (a, b) => (a.data.order ?? 0) - (b.data.order ?? 0),\n);\n---\n\n<DocsLayout title="Documentation" description="Project documentation.">\n  <h1>Documentation</h1>\n  <p>Use these starter pages as the foundation for your docs.</p>\n  <ul>\n    {pages.map((page) => (\n      <li>\n        <a href={`/docs/${page.id}/`}>{page.data.title}</a> — {page.data.description}\n      </li>\n    ))}\n  </ul>\n</DocsLayout>\n',
    },
    {
      destination: "src/pages/docs/[...slug].astro",
      content:
        '---\nimport { getCollection, render, type CollectionEntry } from "astro:content";\nimport DocsLayout from \'../../layouts/DocsLayout.astro\';\n\nexport async function getStaticPaths() {\n  const pages = await getCollection("docs");\n  return pages.map((page) => ({\n    params: { slug: page.id },\n    props: { page },\n  }));\n}\n\nconst { page } = Astro.props as { page: CollectionEntry<"docs"> };\nconst { Content } = await render(page);\n---\n\n<DocsLayout title={page.data.title} description={page.data.description}>\n  <article>\n    <p><a href="/docs">Documentation</a></p>\n    <h1>{page.data.title}</h1>\n    <p>{page.data.description}</p>\n    <Content />\n  </article>\n</DocsLayout>\n',
    },
  ];
}

function portfolioTemplates(context: TemplateContext): ProjectTemplate[] {
  return [
    {
      destination: "src/layouts/PortfolioLayout.astro",
      content: render(styledLayout, context),
    },
    {
      destination: "src/pages/index.astro",
      content: render(
        '---\nimport PortfolioLayout from \'../layouts/PortfolioLayout.astro\';\n---\n\n<PortfolioLayout title="{{projectTitle}}" description="{{projectDescription}}">\n  <h1>{{projectTitle}}</h1>\n  <p>{{projectDescription}}</p>\n  <p><a href="/work">View selected work</a></p>\n</PortfolioLayout>\n',
        context,
      ),
    },
    {
      destination: "src/pages/work/index.astro",
      content:
        '---\nimport PortfolioLayout from \'../../layouts/PortfolioLayout.astro\';\n---\n\n<PortfolioLayout title="Selected work" description="Portfolio projects.">\n  <h1>Selected work</h1>\n  <article>\n    <h2><a href="/work/first-project">First project</a></h2>\n    <p>A short introduction to a representative piece of work.</p>\n  </article>\n</PortfolioLayout>\n',
    },
    {
      destination: "src/pages/work/first-project.astro",
      content:
        '---\nimport PortfolioLayout from \'../../layouts/PortfolioLayout.astro\';\n---\n\n<PortfolioLayout title="First project" description="A portfolio case study.">\n  <article>\n    <p><a href="/work">Back to work</a></p>\n    <h1>First project</h1>\n    <h2>Challenge</h2>\n    <p>Describe the context and problem.</p>\n    <h2>Approach</h2>\n    <p>Explain the work and decisions that shaped it.</p>\n    <h2>Outcome</h2>\n    <p>Share the result and what changed.</p>\n  </article>\n</PortfolioLayout>\n',
    },
  ];
}

function blankTemplates(context: TemplateContext): ProjectTemplate[] {
  return [
    {
      destination: "src/pages/index.astro",
      content: render(
        "---\nimport '../styles/global.css';\n\nconst title = '{{projectTitle}}';\n---\n\n<h1>{title}</h1>\n",
        context,
      ),
    },
  ];
}

function projectTemplates(
  configuration: ProjectConfiguration,
  context: TemplateContext,
): ProjectTemplate[] {
  switch (configuration.project.type) {
    case "marketing":
      return marketingTemplates(context);
    case "client":
      return clientTemplates(context);
    case "blog":
      return blogTemplates(context);
    case "documentation":
      return documentationTemplates(context);
    case "portfolio":
      return portfolioTemplates(context);
    case "blank":
      return blankTemplates(context);
  }
}

/** Returns only the base assets and selected project blueprint. */
export function createBaseTemplates(
  configuration: ProjectConfiguration,
): ProjectTemplate[] {
  const context = createContext(configuration);
  return [
    { destination: "package.json", content: manifest(configuration) },
    {
      destination: "astro.config.mjs",
      content:
        "import { defineConfig } from 'astro/config';\n\nexport default defineConfig({});\n",
    },
    {
      destination: "tsconfig.json",
      content: `${JSON.stringify({ extends: "astro/tsconfigs/base", compilerOptions: { strict: configuration.styling.typescript === "strict" } }, null, 2)}\n`,
    },
    {
      destination: ".gitignore",
      content: "node_modules/\ndist/\n.astro/\n.env\n.env.*\n!.env.example\n",
    },
    ...(configuration.project.packageManager === "pnpm"
      ? [
          {
            destination: "pnpm-workspace.yaml",
            content: pnpmWorkspaceConfiguration(configuration),
          },
        ]
      : []),
    {
      destination: "README.md",
      content: render(
        `# {{projectName}}\n\n{{projectDescription}}{{projectContent}}\n## Commands\n\n| Command | Action |\n| :-- | :-- |\n| \`{{installCommand}}\` | Install dependencies |\n${generatedProjectCommands(
          configuration,
        )
          .map(
            ({ command, description }) => `| \`${command}\` | ${description} |`,
          )
          .join("\n")}\n`,
        context,
      ),
    },
    ...projectTemplates(configuration, context),
  ];
}
