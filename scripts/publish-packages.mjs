import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageDirectories = ["utils", "features", "generator", "cli"];
const dryRun = process.argv.includes("--dry-run");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    stdio: "inherit",
    ...options,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function packageIsPublished(name, version) {
  const result = spawnSync("npm", ["view", `${name}@${version}`, "version"], {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status === 0) return result.stdout.trim() === version;
  if (result.stderr.includes("E404")) return false;

  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

function ensureTag(name, version) {
  const tag = `${name}@${version}`;
  const existing = spawnSync(
    "git",
    ["rev-parse", "--verify", "--quiet", `refs/tags/${tag}`],
    { cwd: repositoryRoot, encoding: "utf8" },
  );

  if (existing.status === 0) {
    const taggedCommit = spawnSync("git", ["rev-list", "-n", "1", tag], {
      cwd: repositoryRoot,
      encoding: "utf8",
    }).stdout.trim();
    const head = spawnSync("git", ["rev-parse", "HEAD"], {
      cwd: repositoryRoot,
      encoding: "utf8",
    }).stdout.trim();

    if (taggedCommit !== head) {
      throw new Error(`${tag} already points to a different commit.`);
    }

    console.log(`Tag already exists: ${tag}`);
    return;
  }

  run("git", ["tag", "-a", tag, "-m", tag]);
  console.log(`Created tag: ${tag}`);
}

for (const packageDirectory of packageDirectories) {
  const directory = join(repositoryRoot, "packages", packageDirectory);
  const packageJson = JSON.parse(
    readFileSync(join(directory, "package.json"), "utf8"),
  );
  const { name, version } = packageJson;

  if (!dryRun && packageIsPublished(name, version)) {
    console.log(`Already published: ${name}@${version}`);
    ensureTag(name, version);
    continue;
  }

  console.log(`${dryRun ? "Packing" : "Publishing"}: ${name}@${version}`);
  run(
    "pnpm",
    [
      "publish",
      "--access",
      packageJson.publishConfig?.access ?? "public",
      "--no-git-checks",
      ...(dryRun ? ["--dry-run"] : []),
    ],
    { cwd: directory },
  );

  if (!dryRun) ensureTag(name, version);
}
