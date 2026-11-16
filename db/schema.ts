import { pgTable, text, jsonb, primaryKey } from 'drizzle-orm/pg-core';

// Preserve the source application's collection-based document format.
export const records = pgTable('medical_records', {
  workspace: text('workspace').notNull(),
  collection: text('collection').notNull(),
  id: text('id').notNull(),
  data: jsonb('data').notNull(),
}, table => [primaryKey({ columns: [table.workspace, table.collection, table.id] })]);
