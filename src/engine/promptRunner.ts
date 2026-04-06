import inquirer from 'inquirer';
import type { Answers, PromptsConfig } from '../types/template';

function normalizeAnswerValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

export async function runPrompts(config: PromptsConfig): Promise<Answers> {
  if (config.questions.length === 0) {
    return {};
  }

  const questions = config.questions.map((q) => ({
    type: q.type ?? 'input',
    name: q.name,
    message: q.message,
    default: q.default,
    choices: q.choices,
  }));

  const rawAnswers = await inquirer.prompt<Record<string, unknown>>(questions);
  const normalized: Answers = {};
  for (const [key, value] of Object.entries(rawAnswers)) {
    normalized[key] = normalizeAnswerValue(value);
  }
  return normalized;
}
