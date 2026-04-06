import { z } from 'zod';

export const templateSchema = z.object({
  name: z.string().trim().min(1),
  stack: z.string().trim().min(1),
  version: z.string().trim().min(1),
  description: z.string().trim().min(1),
  placeholders: z.array(z.string().trim().min(1)).default([]),
});

export type TemplateSchema = z.infer<typeof templateSchema>;
