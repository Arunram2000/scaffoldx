/**
 * Template registry is loaded from remote JSON so templates can be added or changed
 * without publishing a new CLI build.
 *
 * Future: versioned registry URLs (e.g. /v2/templates.json) and a `minCliVersion` field
 * so older CLIs can prompt to upgrade.
 *
 * Future: private registry — same JSON endpoint with `Authorization: Bearer <token>`
 * (read from env, e.g. SCAFFOLDX_REGISTRY_TOKEN) when fetching the manifest.
 *
 * Future: signed manifests — verify a signature embedded in JSON or delivered via headers
 * before trusting template source strings.
 */

export const SCAFFOLDX_TEMPLATES_URL_ENV = 'SCAFFOLDX_TEMPLATES_URL';

/**
 * Maintainer: replace this URL with your hosted `templates.json` before publishing.
 * End users can override with SCAFFOLDX_TEMPLATES_URL.
 */
export const DEFAULT_TEMPLATES_REGISTRY_URL =
  'https://raw.githubusercontent.com/Arunram2000/scaffoldx-registry/refs/heads/main/templates.json';

/** One template: public Git repo + branch (degit clones `repo#branch`). */
export interface TemplateEntry {
  repo: string;
  branch: string;
  /** Shown in `scaffoldx list`; optional in JSON but recommended. */
  description?: string | undefined;
}

/** Remote JSON: stack → template slug → metadata */
export type TemplatesRegistry = Record<string, Record<string, TemplateEntry>>;
