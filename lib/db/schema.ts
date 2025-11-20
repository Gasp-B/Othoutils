import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const toolsCatalog = pgTable('tools_catalog', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  colorLabel: text('color_label'),
  tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
  description: text('description'),
  links: jsonb('links')
    .notNull()
    .$type<Array<{ label: string; url: string }>>()
    .default(sql`'[]'::jsonb`),
  notes: text('notes'),
  targetPopulation: text('target_population'),
  status: text('status').notNull().default('Validé'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ToolRecord = typeof toolsCatalog.$inferSelect;
