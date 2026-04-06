import { loadRegistry } from '../engine/registry';

export async function runList(): Promise<void> {
  const registry = await loadRegistry();
  const stacks = Object.keys(registry).sort((a, b) => a.localeCompare(b));

  if (stacks.length === 0) {
    console.log('No templates available.');
    return;
  }

  for (const stack of stacks) {
    console.log(`${stack}:`);
    const templates = registry[stack] ?? {};
    const names = Object.keys(templates).sort((a, b) => a.localeCompare(b));
    for (const name of names) {
      const entry = templates[name];
      if (!entry) {
        continue;
      }
      const ref = entry.branch?.trim() || 'main';
      console.log(`  - ${name} (${entry.repo}#${ref})`);
    }
    console.log('');
  }
}
