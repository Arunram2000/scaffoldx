import { loadRegistry } from './loadRegistry';
import { toDegitSource } from './degitSource';

export async function listTemplates(): Promise<void> {
  const registry = await loadRegistry();
  const stacks = Object.keys(registry).sort((a, b) => a.localeCompare(b));

  if (stacks.length === 0) {
    console.log('No templates are available in the registry.');
    return;
  }

  for (const stack of stacks) {
    console.log(`${stack}:`);
    const templates = registry[stack];
    if (!templates) {
      continue;
    }
    const keys = Object.keys(templates).sort((a, b) => a.localeCompare(b));
    for (const key of keys) {
      const entry = templates[key];
      if (!entry) {
        continue;
      }
      const src = toDegitSource(entry);
      const desc = entry.description?.trim();
      if (desc) {
        console.log(`  - ${key} — ${desc}`);
        console.log(`      ${src}`);
      } else {
        console.log(`  - ${key} (${src})`);
      }
    }
    console.log('');
  }
}
