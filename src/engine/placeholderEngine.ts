import fs from 'fs-extra';
import path from 'node:path';
import type { Answers } from '../types/template';

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

function isLikelyBinary(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return SKIP_EXTENSIONS.has(ext);
}

function applyReplacements(content: string, answers: Answers): string {
  let updated = content;
  for (const [key, value] of Object.entries(answers)) {
    const token = `**${key}**`;
    if (updated.includes(token)) {
      updated = updated.split(token).join(value);
    }
  }
  return updated;
}

async function walkFiles(dir: string, onFile: (filePath: string) => Promise<void>): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIR_NAMES.has(entry.name)) {
        await walkFiles(fullPath, onFile);
      }
      continue;
    }
    if (entry.isFile()) {
      await onFile(fullPath);
    }
  }
}

export async function replacePlaceholdersInDirectory(rootDir: string, answers: Answers): Promise<void> {
  await walkFiles(rootDir, async (filePath) => {
    if (isLikelyBinary(filePath)) {
      return;
    }

    let content: string;
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch {
      return;
    }

    const updated = applyReplacements(content, answers);
    if (updated !== content) {
      await fs.writeFile(filePath, updated, 'utf8');
    }
  });
}
