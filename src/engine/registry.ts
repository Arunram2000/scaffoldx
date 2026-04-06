import { z } from "zod";
import { RegistryError, TemplateValidationError } from "./errors";
import type { Registry, RegistryTemplateEntry } from "../types/template";

export const DEFAULT_REGISTRY_URL =
  "https://raw.githubusercontent.com/Arunram2000/scaffoldx-registry/refs/heads/main/templates.json";
export const REGISTRY_URL_ENV = "SCAFFOLDX_TEMPLATES_URL";

const fetchTimeoutMs = 15_000;

const registryEntrySchema = z.object({
  repo: z.string().trim().min(1),
  branch: z.string().trim().min(1).optional(),
});

const registrySchema = z.record(
  z.string(),
  z.record(z.string(), registryEntrySchema),
);

let cachedRegistry: Promise<Registry> | null = null;

function getRegistryUrl(): string {
  const override = process.env[REGISTRY_URL_ENV]?.trim();
  return override || DEFAULT_REGISTRY_URL;
}

export function clearRegistryCacheForTests(): void {
  cachedRegistry = null;
}

async function fetchRawRegistryJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new RegistryError(
        `Failed to fetch registry: HTTP ${response.status} ${response.statusText} (${url})`,
      );
    }

    return (await response.json()) as unknown;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new RegistryError(
        `Registry request timed out after ${fetchTimeoutMs}ms (${url})`,
      );
    }
    const reason = error instanceof Error ? error.message : String(error);
    throw new RegistryError(`Failed to fetch registry from ${url}: ${reason}`);
  } finally {
    clearTimeout(timeout);
  }
}

function parseRegistry(raw: unknown): Registry {
  const result = registrySchema.safeParse(raw);
  if (!result.success) {
    throw new RegistryError(
      `Registry format is invalid: ${result.error.issues[0]?.message ?? "unknown issue"}`,
    );
  }
  return result.data as Registry;
}

export async function fetchRegistry(): Promise<Registry> {
  const url = getRegistryUrl();
  const raw = await fetchRawRegistryJson(url);
  return parseRegistry(raw);
}

export async function loadRegistry(): Promise<Registry> {
  if (!cachedRegistry) {
    cachedRegistry = fetchRegistry();
  }
  return cachedRegistry;
}

export function resolveTemplateFromRegistry(
  registry: Registry,
  stack: string,
  template: string,
): RegistryTemplateEntry {
  const stackKey = stack.trim();
  const templateKey = template.trim();

  const stackMap = registry[stackKey];
  if (!stackMap) {
    throw new TemplateValidationError(
      `Unknown stack "${stackKey}". Available: ${Object.keys(registry).sort().join(", ") || "(none)"}`,
    );
  }

  const entry = stackMap[templateKey];
  if (!entry) {
    throw new TemplateValidationError(
      `Unknown template "${templateKey}" for stack "${stackKey}". Available: ${
        Object.keys(stackMap).sort().join(", ") || "(none)"
      }`,
    );
  }

  return entry;
}
