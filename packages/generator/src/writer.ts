import { access, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

import type { ProjectTemplate } from "./templates.js";

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
function assertSafeDestination(destination: string): void {
  if (
    isAbsolute(destination) ||
    destination.split(/[\\/]/).includes("..") ||
    destination.includes("\0")
  )
    throw new Error(`Unsafe generated file path: ${destination}`);
}
async function writeTemplates(
  directory: string,
  templates: readonly ProjectTemplate[],
): Promise<string[]> {
  const files: string[] = [];
  for (const template of templates) {
    assertSafeDestination(template.destination);
    const output = resolve(directory, template.destination);
    if (relative(directory, output).startsWith(`..${sep}`))
      throw new Error(`Unsafe generated file path: ${template.destination}`);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, template.content, "utf8");
    files.push(template.destination);
  }
  return files;
}

/** Writes templates atomically and refuses to replace an existing project. */
export async function writeProject(
  directory: string,
  templates: readonly ProjectTemplate[],
): Promise<string[]> {
  if (await pathExists(directory))
    throw new Error(`The target directory already exists: ${directory}`);
  const temporaryDirectory = `${directory}.astro-stack-${process.pid}-${Date.now()}`;
  if (await pathExists(temporaryDirectory))
    throw new Error(
      `Unable to reserve a temporary project directory: ${temporaryDirectory}`,
    );
  await mkdir(dirname(directory), { recursive: true });
  try {
    await mkdir(temporaryDirectory);
    const files = await writeTemplates(temporaryDirectory, templates);
    await rename(temporaryDirectory, directory);
    return files;
  } catch (error) {
    await rm(temporaryDirectory, { recursive: true, force: true });
    throw error;
  }
}
