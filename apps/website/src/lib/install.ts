/** Package-manager create commands; keep aligned with README. */
export const installCommands = {
  npm: "npm create astro-stack@latest",
  pnpm: "pnpm create astro-stack",
  yarn: "yarn create astro-stack",
  bun: "bun create astro-stack",
} as const;

export type PackageManager = keyof typeof installCommands;

export const packageManagers = Object.keys(installCommands) as PackageManager[];

export const defaultPackageManager: PackageManager = "pnpm";
