import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import type {
  AgentInstructionTarget,
  ProjectConfiguration,
} from "@astro-stack/utils";
import type { FeatureTemplate } from "../contracts.js";
import { defineFeature } from "../define-feature.js";

const sharedFields = `    - name: title
      label: Title
      type: string
      required: true
    - name: description
      label: Description
      type: text
      required: true`;

const markdownBody = `    - name: body
      label: Body
      type: rich-text
      required: true`;

const mdxBody = `    - name: body
      label: Body
      type: code
      required: true
      options:
        format: mdx`;

function collectionConfiguration(configuration: ProjectConfiguration): string {
  if (configuration.project.type === "blog")
    return `  - name: blog
    label: Blog posts
    type: collection
    path: src/content/blog
    format: yaml-frontmatter
    filename: "{primary}.md"
    view:
      fields: [title, pubDate]
      primary: title
      sort: [pubDate, title]
      default:
        sort: pubDate
        order: desc
    fields:
${sharedFields}
    - name: pubDate
      label: Published
      type: date
      required: true
      options:
        format: yyyy-MM-dd
${markdownBody}`;

  if (configuration.project.type === "documentation")
    return `  - name: docs
    label: Documentation
    type: collection
    path: src/content/docs
    format: yaml-frontmatter
    filename: "{primary}.md"
    subfolders: true
    view:
      fields: [title, order]
      primary: title
      sort: [order, title]
      default:
        sort: order
        order: asc
    fields:
${sharedFields}
    - name: order
      label: Order
      type: number
${markdownBody}`;

  const mdx = configuration.content.setup === "mdx";
  return `  - name: posts
    label: Posts
    type: collection
    path: src/content/posts
    format: yaml-frontmatter
    filename: "{primary}.${mdx ? "mdx" : "md"}"
    subfolders: true
    view:
      fields: [title]
      primary: title
      sort: [title]
      default:
        sort: title
        order: asc
    fields:
${sharedFields}
${mdx ? mdxBody : markdownBody}`;
}

const pagesCmsSkillName = "astro-to-pagescms";
const pagesCmsSkillDirectory = fileURLToPath(
  new URL(`../../assets/skills/${pagesCmsSkillName}/`, import.meta.url),
);
const agentSkillDirectories = {
  codex: ".agents/skills",
  claude: ".claude/skills",
} as const satisfies Record<AgentInstructionTarget, string>;

let pagesCmsSkillFiles: readonly FeatureTemplate[] | undefined;

/** Reads the vendored Pages CMS skill once, in a stable file order. */
function readPagesCmsSkillFiles(): readonly FeatureTemplate[] {
  pagesCmsSkillFiles ??= readdirSync(pagesCmsSkillDirectory, {
    recursive: true,
    withFileTypes: true,
  })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const path = join(entry.parentPath, entry.name);
      return {
        destination: relative(pagesCmsSkillDirectory, path)
          .split(sep)
          .join("/"),
        content: readFileSync(path, "utf8"),
        verbatim: true,
      };
    })
    .sort((a, b) => (a.destination < b.destination ? -1 : 1));
  return pagesCmsSkillFiles;
}

/** Installs the Pages CMS skill for each selected coding agent. */
function pagesCmsSkillTemplates(
  configuration: ProjectConfiguration,
): readonly FeatureTemplate[] {
  return configuration.developerExperience.agents.flatMap((agent) =>
    readPagesCmsSkillFiles().map((template) => ({
      ...template,
      destination: `${agentSkillDirectories[agent]}/${pagesCmsSkillName}/${template.destination}`,
    })),
  );
}

function pagesCmsTemplates(
  configuration: ProjectConfiguration,
): readonly FeatureTemplate[] {
  return [
    {
      destination: ".pages.yml",
      content: `# Connect this GitHub repository at https://app.pagescms.org.
media:
  input: public/images
  output: /images
  categories: [image]
  rename: safe

content:
${collectionConfiguration(configuration)}

settings:
  content:
    merge: true
`,
    },
    { destination: "public/images/.gitkeep", content: "" },
    ...pagesCmsSkillTemplates(configuration),
  ];
}

export const cmsFeatures = [
  defineFeature({
    id: "cms:none",
    selection: { group: "content.cms", value: "none", label: "None" },
    isSelected: (configuration) => configuration.content.cms !== "pages",
  }),
  defineFeature({
    id: "cms:pages",
    selection: {
      group: "content.cms",
      value: "pages",
      label: "Pages CMS",
      hint: "Git-based editing for Astro content",
    },
    isSelected: (configuration) => configuration.content.cms === "pages",
    validate: (configuration) =>
      configuration.project.type === "blog" ||
      configuration.project.type === "documentation" ||
      configuration.content.setup !== "none"
        ? []
        : [
            {
              level: "error",
              code: "pages-cms-requires-content",
              path: "content.cms",
              message: "Pages CMS requires a file-backed content setup.",
              suggestion:
                "Choose Markdown, MDX, or Content Collections, or remove Pages CMS.",
            },
          ],
    contributions: {
      templates: pagesCmsTemplates,
      projectNotes: [
        "Push this project to GitHub, then connect the repository at https://app.pagescms.org.",
      ],
    },
  }),
] as const;
