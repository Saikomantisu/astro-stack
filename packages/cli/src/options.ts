import {
  mergeProjectConfiguration,
  type ProjectConfiguration,
} from "@astro-stack/utils";

export const types = [
  "marketing",
  "client",
  "blog",
  "documentation",
  "portfolio",
  "saas-landing",
  "blank",
] as const;
export const managers = ["npm", "pnpm", "yarn", "bun"] as const;
export const cssOptions = ["vanilla", "tailwind"] as const;
export const tsOptions = ["strict", "relaxed"] as const;
export const contentOptions = [
  "none",
  "markdown",
  "mdx",
  "collections",
] as const;
export const formOptions = ["none", "resend", "webhooks"] as const;
export const deploymentOptions = [
  "static",
  "vercel",
  "netlify",
  "cloudflare",
] as const;
export const agentOptions = ["codex", "claude"] as const;
export const editorOptions = ["vscode", "cursor", "zed"] as const;
export interface CliOptions {
  name?: string;
  directory?: string;
  type?: ProjectConfiguration["project"]["type"];
  packageManager?: ProjectConfiguration["project"]["packageManager"];
  css?: ProjectConfiguration["styling"]["css"];
  typescript?: ProjectConfiguration["styling"]["typescript"];
  content?: ProjectConfiguration["content"]["setup"];
  forms?: ProjectConfiguration["features"]["forms"];
  deployment?: ProjectConfiguration["deployment"]["target"];
  agent?: string[];
  editor?: string[];
  eslint: boolean;
  prettier: boolean;
  biome: boolean;
  git: boolean;
  nonInteractive?: boolean;
  yes?: boolean;
}
export type Generate = (
  configuration: ProjectConfiguration,
) => Promise<unknown>;
/** Converts Commander options into the shared complete configuration model. */
export function configurationFrom(options: CliOptions): ProjectConfiguration {
  return mergeProjectConfiguration({
    project: {
      ...(options.name ? { name: options.name } : {}),
      ...(options.directory ? { directory: options.directory } : {}),
      ...(options.type ? { type: options.type } : {}),
      ...(options.packageManager
        ? { packageManager: options.packageManager }
        : {}),
      initializeGit: options.git,
    },
    styling: {
      ...(options.css ? { css: options.css } : {}),
      ...(options.typescript ? { typescript: options.typescript } : {}),
      eslint: options.eslint,
      prettier: options.prettier,
      biome: options.biome,
    },
    ...(options.content ? { content: { setup: options.content } } : {}),
    ...(options.forms ? { features: { forms: options.forms } } : {}),
    ...(options.deployment
      ? { deployment: { target: options.deployment } }
      : {}),
    developerExperience: {
      agents: (options.agent ??
        []) as ProjectConfiguration["developerExperience"]["agents"],
      editors: (options.editor ??
        []) as ProjectConfiguration["developerExperience"]["editors"],
    },
  });
}
