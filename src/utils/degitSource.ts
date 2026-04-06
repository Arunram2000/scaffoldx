import type { TemplateEntry } from '../config/templates';

/**
 * GitHub (and other hosts degit supports) accept `user/repo#branch`.
 * @see https://github.com/Rich-Harris/degit
 */
export function toDegitSource(entry: TemplateEntry): string {
  const repo = entry.repo.trim();
  const branch = entry.branch.trim();
  if (!repo) {
    throw new Error('Template entry is missing a non-empty "repo".');
  }
  if (!branch) {
    throw new Error('Template entry is missing a non-empty "branch".');
  }
  return `${repo}#${branch}`;
}
