import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'node:path';
import { loadRegistry } from '../utils/loadRegistry';
import { validateTemplate } from '../utils/validateTemplate';
import { cloneTemplate } from '../utils/cloneTemplate';
import { replacePlaceholders } from '../utils/replacePlaceholders';
import { ScaffoldxError, TemplateValidationError } from '../utils/errors';

function assertSafeProjectDirName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new TemplateValidationError('Project name cannot be empty.');
  }

  if (trimmed !== path.basename(trimmed)) {
    throw new TemplateValidationError('Project name must be a single path segment.');
  }

  for (const ch of ['/', '\\']) {
    if (trimmed.includes(ch)) {
      throw new TemplateValidationError('Project name cannot contain path separators.');
    }
  }

  if (trimmed.includes(path.sep)) {
    throw new TemplateValidationError('Project name cannot contain path separators.');
  }

  if (trimmed === '.' || trimmed === '..') {
    throw new TemplateValidationError(`"${trimmed}" is not allowed as a project name.`);
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    throw new TemplateValidationError(
      'Project name may only contain letters, numbers, dots, underscores, and hyphens.'
    );
  }

  return trimmed;
}

async function promptProjectName(): Promise<string> {
  const { projectName } = await inquirer.prompt<{ projectName: string }>([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      validate(input: string) {
        try {
          assertSafeProjectDirName(input);
          return true;
        } catch (err) {
          return err instanceof Error ? err.message : 'Invalid project name.';
        }
      },
    },
  ]);

  return assertSafeProjectDirName(projectName);
}

async function assertTargetDirUsable(dir: string): Promise<void> {
  if (!(await fs.pathExists(dir))) {
    return;
  }

  const entries = await fs.readdir(dir);
  if (entries.length > 0) {
    throw new ScaffoldxError(
      `Target directory already exists and is not empty: ${dir}\n` +
        'Choose another project name or remove the directory first.'
    );
  }
}

export async function runCreate(stack: string, template: string): Promise<void> {
  const registry = await loadRegistry();
  const source = validateTemplate(registry, stack, template);

  const projectName = await promptProjectName();
  const dest = path.resolve(process.cwd(), projectName);

  await assertTargetDirUsable(dest);
  await fs.mkdir(dest, { recursive: true });

  await cloneTemplate(source, dest);
  await replacePlaceholders(dest, projectName);

  console.log('');
  console.log(`Created "${projectName}" at ${dest}`);
  console.log(`Template: ${stack} / ${template} (${source})`);
}
