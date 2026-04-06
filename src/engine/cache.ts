import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { RegistryTemplateEntry } from '../types/template';

const CACHE_DIR_ENV = 'SCAFFOLDX_CACHE_DIR';

function getDefaultCacheRoot(): string {
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Caches', 'scaffoldx');
  }
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    return path.join(localAppData, 'scaffoldx', 'cache');
  }
  return path.join(os.homedir(), '.cache', 'scaffoldx');
}

export function getCacheRoot(): string {
  const override = process.env[CACHE_DIR_ENV]?.trim();
  return override || getDefaultCacheRoot();
}

function getCacheKey(entry: RegistryTemplateEntry): string {
  const ref = entry.branch?.trim() || 'main';
  const raw = `${entry.repo.trim()}#${ref}`;
  return createHash('sha256').update(raw).digest('hex').slice(0, 24);
}

export function getTemplateCachePath(entry: RegistryTemplateEntry): string {
  const key = getCacheKey(entry);
  return path.join(getCacheRoot(), key);
}

export async function ensureCacheRoot(): Promise<void> {
  await fs.mkdirp(getCacheRoot());
}

export async function hasCachedTemplate(entry: RegistryTemplateEntry): Promise<boolean> {
  const cachePath = getTemplateCachePath(entry);
  return fs.pathExists(cachePath);
}

export async function removeTemplateCache(entry: RegistryTemplateEntry): Promise<void> {
  const cachePath = getTemplateCachePath(entry);
  await fs.remove(cachePath);
}
