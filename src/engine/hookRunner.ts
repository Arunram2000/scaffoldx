import { spawn } from 'node:child_process';
import fs from 'fs-extra';
import type { Answers, TemplateMeta } from '../types/template';
import { HookExecutionError } from './errors';

interface HookContext {
  hookPath: string | null;
  destinationDir: string;
  answers: Answers;
  templateMeta: TemplateMeta;
}

export async function runPostCreateHook(context: HookContext): Promise<void> {
  const hookPath = context.hookPath;
  if (!hookPath) {
    return;
  }

  if (!(await fs.pathExists(hookPath))) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [hookPath], {
      cwd: context.destinationDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        SCAFFOLDX_TARGET_DIR: context.destinationDir,
        SCAFFOLDX_ANSWERS_JSON: JSON.stringify(context.answers),
        SCAFFOLDX_TEMPLATE_NAME: context.templateMeta.name,
        SCAFFOLDX_TEMPLATE_STACK: context.templateMeta.stack,
      },
    }) as import('node:child_process').ChildProcess;

    child.on('error', (error: Error) => {
      reject(new HookExecutionError(`Failed to start post-create hook: ${error.message}`));
    });

    child.on('exit', (code: number | null) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new HookExecutionError(`post-create hook exited with code ${code ?? 'unknown'}`));
    });
  });
}
