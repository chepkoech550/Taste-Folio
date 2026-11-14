import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const portfolios = sqliteTable('portfolios', {
 id:text('id').primaryKey(), ownerId:text('owner_id').notNull().unique(), slug:text('slug').notNull().unique(),
 draft:text('draft').notNull(), published:text('published'), createdAt:text('created_at').notNull(), updatedAt:text('updated_at').notNull(), publishedAt:text('published_at')
});
export const assets = sqliteTable('assets', {
 id:text('id').primaryKey(), ownerId:text('owner_id').notNull(), objectKey:text('object_key').notNull(), contentType:text('content_type').notNull(), size:integer('size').notNull(), published:integer('published').notNull().default(0)
});
