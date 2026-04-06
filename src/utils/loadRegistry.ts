import {
  SCAFFOLDX_TEMPLATES_URL_ENV,
  DEFAULT_TEMPLATES_REGISTRY_URL,
  type TemplateEntry,
  type TemplatesRegistry,
} from '../config/templates';
import { RegistryError } from './errors';

const DEFAULT_FETCH_TIMEOUT_MS = 15_000;

let cached: Promise<TemplatesRegistry> | null = null;

function getRegistryUrl(): string {
  const fromEnv = process.env[SCAFFOLDX_TEMPLATES_URL_ENV]?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  return DEFAULT_TEMPLATES_REGISTRY_URL;
}

/** Clears the in-memory registry promise. Intended for tests. */
export function clearRegistryCacheForTests(): void {
  cached = null;
}

function parseTemplateEntry(stackKey: string, templateKey: string, raw: unknown): TemplateEntry {
  if (typeof raw === 'string') {
    const repo = raw.trim();
    if (!repo) {
      throw new RegistryError(
        `Template "${stackKey}/${templateKey}" string value must be a non-empty repo (e.g. user/repo).`
      );
    }
    return { repo, branch: 'main', description: '' };
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new RegistryError(
      `Template "${stackKey}/${templateKey}" must be a string (degit repo) or an object with "repo" and "branch".`
    );
  }

  const o = raw as Record<string, unknown>;
  const repo = o.repo;
  const branch = o.branch;
  const description = o.description;

  if (typeof repo !== 'string' || !repo.trim()) {
    throw new RegistryError(`Template "${stackKey}/${templateKey}" needs a non-empty string "repo".`);
  }
  if (typeof branch !== 'string' || !branch.trim()) {
    throw new RegistryError(`Template "${stackKey}/${templateKey}" needs a non-empty string "branch".`);
  }
  if (description !== undefined && typeof description !== 'string') {
    throw new RegistryError(`Template "${stackKey}/${templateKey}" field "description" must be a string if set.`);
  }

  const entry: TemplateEntry = {
    repo: repo.trim(),
    branch: branch.trim(),
  };

  if (typeof description === 'string') {
    entry.description = description.trim() || undefined;
  }

  return entry;
}

function parseRegistry(raw: unknown): TemplatesRegistry {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new RegistryError('Template registry root must be a JSON object.');
  }

  const out: TemplatesRegistry = {};

  for (const [stackKey, templatesValue] of Object.entries(raw)) {
    if (!stackKey.trim()) {
      throw new RegistryError('Template registry contains an empty stack key.');
    }

    if (
      typeof templatesValue !== 'object' ||
      templatesValue === null ||
      Array.isArray(templatesValue)
    ) {
      throw new RegistryError(`Stack "${stackKey}" must map to a JSON object of templates.`);
    }

    const inner: Record<string, TemplateEntry> = {};

    for (const [templateKey, node] of Object.entries(templatesValue)) {
      inner[templateKey] = parseTemplateEntry(stackKey, templateKey, node);
    }

    if (Object.keys(inner).length === 0) {
      throw new RegistryError(`Stack "${stackKey}" has no templates.`);
    }

    out[stackKey] = inner;
  }

  if (Object.keys(out).length === 0) {
    throw new RegistryError('Template registry contains no stacks.');
  }

  return out;
}

async function fetchRegistry(): Promise<TemplatesRegistry> {
  const url = getRegistryUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, DEFAULT_FETCH_TIMEOUT_MS);

  try {
    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: { accept: 'application/json' },
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new RegistryError(
          `Timed out loading template registry from ${url} (${DEFAULT_FETCH_TIMEOUT_MS}ms).`
        );
      }
      const cause = err instanceof Error ? err.message : String(err);
      throw new RegistryError(`Could not reach template registry at ${url}: ${cause}`);
    }

    if (!response.ok) {
      throw new RegistryError(
        `Template registry returned HTTP ${response.status} ${response.statusText} for ${url}`
      );
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new RegistryError(`Template registry at ${url} returned invalid JSON.`);
    }

    return parseRegistry(json);
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadRegistry(): Promise<TemplatesRegistry> {
  if (!cached) {
    cached = fetchRegistry();
  }
  return cached;
}
