import degit from 'degit';
import fs from 'fs-extra';
import path from 'node:path';
import { promptsSchema } from '../schemas/promptsSchema';
import { templateSchema } from '../schemas/templateSchema';
import type { PromptsConfig, RegistryTemplateEntry, TemplateMeta } from '../types/template';
import { ensureCacheRoot, getTemplateCachePath, hasCachedTemplate, removeTemplateCache } from './cache';
import { TemplateValidationError } from './errors';

export interface LoadedTemplateBundle {
  cachePath: string;
  templateRoot: string;
  templateDir: string;
  templateMeta: TemplateMeta;
  prompts: PromptsConfig;
  hookPath: string | null;
}

function toDegitSource(entry: RegistryTemplateEntry): string {
  // Support local absolute paths in development tests.
  if (path.isAbsolute(entry.repo) || entry.repo.startsWith('file://')) {
    return entry.repo;
  }
  const ref = entry.branch?.trim() || 'main';
  return `${entry.repo.trim()}#${ref}`;
}

async function cloneToPath(entry: RegistryTemplateEntry, outputPath: string): Promise<void> {
  const source = toDegitSource(entry);
  const emitter = degit(source, { force: true, cache: false });
  await emitter.clone(outputPath);
}

async function readJsonFile(targetPath: string): Promise<unknown> {
  try {
    return await fs.readJson(targetPath);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new TemplateValidationError(`Failed reading JSON file ${targetPath}: ${reason}`);
  }
}

async function validateTemplateRepo(rootPath: string): Promise<LoadedTemplateBundle> {
  const templateJsonPath = path.join(rootPath, 'template.json');
  const promptsJsonPath = path.join(rootPath, 'prompts.json');
  const templateDir = path.join(rootPath, 'template');
  const hookPath = path.join(rootPath, 'hooks', 'post-create.js');

  if (!(await fs.pathExists(templateJsonPath))) {
    throw new TemplateValidationError(`template.json not found in template repo (${rootPath})`);
  }
  if (!(await fs.pathExists(promptsJsonPath))) {
    throw new TemplateValidationError(`prompts.json not found in template repo (${rootPath})`);
  }
  if (!(await fs.pathExists(templateDir))) {
    throw new TemplateValidationError(`template/ folder not found in template repo (${rootPath})`);
  }

  const templateRaw = await readJsonFile(templateJsonPath);
  const promptsRaw = await readJsonFile(promptsJsonPath);

  const templateMetaResult = templateSchema.safeParse(templateRaw);
  if (!templateMetaResult.success) {
    throw new TemplateValidationError(
      `Invalid template.json: ${templateMetaResult.error.issues[0]?.message ?? 'unknown issue'}`
    );
  }

  const promptsResult = promptsSchema.safeParse(promptsRaw);
  if (!promptsResult.success) {
    throw new TemplateValidationError(
      `Invalid prompts.json: ${promptsResult.error.issues[0]?.message ?? 'unknown issue'}`
    );
  }

  return {
    cachePath: rootPath,
    templateRoot: rootPath,
    templateDir,
    templateMeta: templateMetaResult.data,
    prompts: promptsResult.data,
    hookPath: (await fs.pathExists(hookPath)) ? hookPath : null,
  };
}

async function cloneIntoCache(entry: RegistryTemplateEntry, cachePath: string): Promise<void> {
  const tempClonePath = `${cachePath}.tmp-${Date.now()}`;
  await fs.remove(tempClonePath);
  await cloneToPath(entry, tempClonePath);
  await fs.remove(cachePath);
  await fs.move(tempClonePath, cachePath, { overwrite: true });
}

export async function loadTemplateBundle(entry: RegistryTemplateEntry): Promise<LoadedTemplateBundle> {
  await ensureCacheRoot();
  const cachePath = getTemplateCachePath(entry);

  if (!(await hasCachedTemplate(entry))) {
    await cloneIntoCache(entry, cachePath);
  }

  try {
    return await validateTemplateRepo(cachePath);
  } catch {
    // Cached copy may be stale/corrupted; refresh once.
    await removeTemplateCache(entry);
    await cloneIntoCache(entry, cachePath);
    return validateTemplateRepo(cachePath);
  }
}
