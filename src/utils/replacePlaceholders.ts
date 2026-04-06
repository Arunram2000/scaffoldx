import fs from 'fs-extra';
import path from 'node:path';

const PLACEHOLDER = '**PROJECT_NAME**';

const SKIP_DIR_NAMES = new Set(['.git', 'node_modules', '.hg', '.svn']);

const SKIP_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.zip',
  '.gz',
  '.tgz',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.jar',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.mp3',
  '.mp4',
  '.webm',
  '.avi',
  '.mov',
  '.pdf',
]);

function shouldTreatAsBinary(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return SKIP_EXTENSIONS.has(ext);
}

async function walk(dir: string, onFile: (fullPath: string) => Promise<void>): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIR_NAMES.has(entry.name)) {
        continue;
      }
      await walk(full, onFile);
    } else if (entry.isFile()) {
      await onFile(full);
    }
  }
}

export async function replacePlaceholders(rootDir: string, projectName: string): Promise<void> {
  await walk(rootDir, async (file) => {
    if (shouldTreatAsBinary(file)) {
      return;
    }

    let content: string;
    try {
      content = await fs.readFile(file, 'utf8');
    } catch {
      return;
    }

    if (!content.includes(PLACEHOLDER)) {
      return;
    }

    const updated = content.split(PLACEHOLDER).join(projectName);
    await fs.writeFile(file, updated, 'utf8');
  });
}
