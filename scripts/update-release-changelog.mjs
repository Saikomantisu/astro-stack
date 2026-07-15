import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = process.env.ASTRO_STACK_REPOSITORY_ROOT
  ? resolve(process.env.ASTRO_STACK_REPOSITORY_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliDirectory = join(repositoryRoot, "packages", "cli");
const changelogPath = join(repositoryRoot, "CHANGELOG.md");

function latestReleaseNotes(changelog, version) {
  const match = changelog.match(
    new RegExp(
      `^## ${version.replaceAll(".", "\\.")}\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`,
      "m",
    ),
  );

  if (!match) return [];

  return match[1]
    .split("\n")
    .filter((line) => line.startsWith("- "))
    .filter((line) => !line.startsWith("- Updated dependencies"))
    .filter((line) => !line.startsWith("  - "))
    .map((line) => line.slice(2).replace(/^[a-f\d]{7,}: /, ""));
}

const packageJson = JSON.parse(
  await readFile(join(cliDirectory, "package.json"), "utf8"),
);
let packageChangelog;

try {
  packageChangelog = await readFile(join(cliDirectory, "CHANGELOG.md"), "utf8");
} catch (error) {
  if (error && typeof error === "object" && error.code === "ENOENT") {
    process.exit(0);
  }

  throw error;
}
const releaseNotes = latestReleaseNotes(packageChangelog, packageJson.version);

if (releaseNotes.length > 0) {
  const changelog = await readFile(changelogPath, "utf8");
  const heading = `## ${packageJson.version}`;

  if (!changelog.includes(`${heading}\n`)) {
    const release = `${heading}\n\n${releaseNotes.map((note) => `- ${note}`).join("\n")}\n\n`;
    const updated = changelog.replace(
      /(^## Unreleased\n[\s\S]*?)(?=^## \d)/m,
      `$1${release}`,
    );

    if (updated === changelog) {
      throw new Error(
        "Could not find the release insertion point in CHANGELOG.md.",
      );
    }

    await writeFile(changelogPath, updated);
  }
}
