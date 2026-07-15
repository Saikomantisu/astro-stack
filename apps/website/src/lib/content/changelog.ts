export type ChangelogEntry = {
  detail: string;
};

export type Release = {
  version: string;
  summary?: string;
  entries: ChangelogEntry[];
};

/** Parses the repository release index for display on the marketing site. */
export function parseChangelog(changelog: string): Release[] {
  return Array.from(
    changelog.matchAll(/^## (\d+\.\d+\.\d+)\n([\s\S]*?)(?=^## |(?![\s\S]))/gm),
    ([, version, section]) => {
      const lines = section.trim().split("\n");
      const entries = lines
        .filter((line) => line.startsWith("- "))
        .map((line) => ({ detail: line.slice(2) }));
      const summary = lines.find(
        (line) => line.length > 0 && !line.startsWith("- "),
      );

      return { version, summary, entries };
    },
  );
}
