import path from 'node:path';
import { copyTemplateFolder } from '../engine/templateCopier';
import { loadRegistry, resolveTemplateFromRegistry } from '../engine/registry';
import { loadTemplateBundle } from '../engine/loader';
import { runPrompts } from '../engine/promptRunner';
import { replacePlaceholdersInDirectory } from '../engine/placeholderEngine';
import { runPostCreateHook } from '../engine/hookRunner';

export async function runCreate(stack: string, template: string): Promise<void> {
  const registry = await loadRegistry();
  const registryEntry = resolveTemplateFromRegistry(registry, stack, template);

  const bundle = await loadTemplateBundle(registryEntry);
  const answers = await runPrompts(bundle.prompts);
  const destinationDir = path.resolve(process.cwd());

  await copyTemplateFolder(bundle.templateDir, destinationDir);
  await replacePlaceholdersInDirectory(destinationDir, answers);
  await runPostCreateHook({
    hookPath: bundle.hookPath,
    destinationDir,
    answers,
    templateMeta: bundle.templateMeta,
  });

  console.log('');
  console.log(`Created template "${stack}/${template}" in ${destinationDir}`);
  console.log(`Template repo: ${registryEntry.repo}#${registryEntry.branch ?? 'main'}`);
}
