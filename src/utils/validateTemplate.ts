import type { TemplatesRegistry } from '../config/templates';
import { TemplateValidationError } from './errors';
import { toDegitSource } from './degitSource';

/**
 * Validates stack/template against a loaded registry and returns the degit source (`repo#branch`).
 */
export function validateTemplate(
  registry: TemplatesRegistry,
  stack: string,
  template: string
): string {
  const stackKey = stack.trim();
  const templateKey = template.trim();

  const stacks = registry[stackKey];
  if (!stacks) {
    const available = Object.keys(registry).sort().join(', ');
    throw new TemplateValidationError(
      `Unknown stack "${stackKey}". Available stacks: ${available || '(none)'}`
    );
  }

  const entry = stacks[templateKey];
  if (!entry) {
    const available = Object.keys(stacks).sort().join(', ');
    throw new TemplateValidationError(
      `Unknown template "${templateKey}" for stack "${stackKey}". Available templates: ${available || '(none)'}`
    );
  }

  return toDegitSource(entry);
}
