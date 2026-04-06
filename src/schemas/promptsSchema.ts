import { z } from 'zod';

const promptTypeSchema = z.enum(['input', 'password', 'confirm', 'list', 'rawlist']);

export const promptQuestionSchema = z.object({
  name: z.string().trim().min(1),
  message: z.string().trim().min(1),
  type: promptTypeSchema.optional(),
  default: z.union([z.string(), z.number(), z.boolean()]).optional(),
  choices: z.array(z.string().trim().min(1)).optional(),
});

export const promptsSchema = z.object({
  questions: z.array(promptQuestionSchema).default([]),
});

export type PromptsSchema = z.infer<typeof promptsSchema>;
