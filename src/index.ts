#!/usr/bin/env node
import { program } from 'commander';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { runCreate } from './commands/create';
import { runList } from './commands/list';
import { ScaffoldxError } from './engine/errors';

function readVersion(): string {
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const raw = readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function formatCliError(err: unknown): string {
  if (err instanceof ScaffoldxError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

/**
 * Future: optional `scaffoldx --update` / startup check that compares this CLI version to npm
 * (or a custom endpoint) and prints an upgrade hint when outdated.
 */
async function main(): Promise<void> {
  program
    .name('scaffoldx')
    .description('Scaffold projects from Git-hosted templates')
    .version(readVersion(), '-v, --version', 'show version');

  program
    .command('create')
    .description('Create a project from a template')
    .argument('<stack>', 'stack key from registry (e.g. flutter)')
    .argument('<template>', 'template key for that stack (e.g. clean-arch)')
    .action(async (stack: string, template: string) => {
      await runCreate(stack, template);
    });

  program
    .command('list')
    .description('List stacks and templates from the remote registry')
    .action(async () => {
      await runList();
    });

  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    console.error(formatCliError(err));
    process.exitCode = err instanceof ScaffoldxError ? err.exitCode : 1;
  }
}

void main();
