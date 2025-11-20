import { z } from 'zod';

export const toolLinkSchema = z.object({
  label: z.string(),
  url: z.string().url(),
});

export const toolStatusSchema = z.enum(['Validé', 'En cours de revue', 'Communauté']);

export const toolSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  category: z.string(),
  colorLabel: z.string().nullable(),
  tags: z.array(z.string()),
  description: z.string().nullable(),
  links: z.array(toolLinkSchema),
  notes: z.string().nullable(),
  targetPopulation: z.string().nullable(),
  status: toolStatusSchema,
  createdAt: z.string(),
});

export const toolsResponseSchema = z.object({
  tools: z.array(toolSchema),
});

export type ToolDto = z.infer<typeof toolSchema>;
export type ToolStatus = z.infer<typeof toolStatusSchema>;
