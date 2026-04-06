import fs from 'fs-extra';
import path from 'node:path';
import { ScaffoldxError } from './errors';

async function ensureDestinationUsable(destinationDir: string): Promise<void> {
  await fs.mkdirp(destinationDir);
  const entries = await fs.readdir(destinationDir);
  if (entries.length > 0) {
    throw new ScaffoldxError(
      `Destination directory is not empty: ${destinationDir}. Run scaffoldx in an empty folder.`
    );
  }
}

export async function copyTemplateFolder(templateDir: string, destinationDir: string): Promise<void> {
  const sourceExists = await fs.pathExists(templateDir);
  if (!sourceExists) {
    throw new ScaffoldxError(`Template folder not found: ${templateDir}`);
  }

  await ensureDestinationUsable(destinationDir);

  const sourceEntries = await fs.readdir(templateDir);
  for (const entry of sourceEntries) {
    const sourcePath = path.join(templateDir, entry);
    const destPath = path.join(destinationDir, entry);
    await fs.copy(sourcePath, destPath, { overwrite: false, errorOnExist: true });
  }
}
