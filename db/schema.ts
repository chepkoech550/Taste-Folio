import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const portfolios = sqliteTable('portfolios', {
 id:text('id').primaryKey(), ownerId:text('owner_id').notNull().unique(), slug:text('slug').notNull().unique(),
 draft:text('draft').notNull(), published:text('published'), createdAt:text('created_at').notNull(), updatedAt:text('updated_at').notNull(), publishedAt:text('published_at')
});
export const assets = sqliteTable('assets', {
 id:text('id').primaryKey(), ownerId:text('owner_id').notNull(), objectKey:text('object_key').notNull(), contentType:text('content_type').notNull(), size:integer('size').notNull(), published:integer('published').notNull().default(0)
});
export const opportunities = sqliteTable('opportunities',{
 id:text('id').primaryKey().notNull(),buyerId:text('buyer_id').notNull(),sellerId:text('seller_id'),record:text('record').notNull(),version:integer('version').notNull().default(1),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()
},table=>[index('opportunities_buyer').on(table.buyerId),index('opportunities_seller').on(table.sellerId)]);
export const nostrIdentities=sqliteTable('nostr_identities',{
 userId:text('user_id').primaryKey().notNull(),pubkey:text('pubkey').unique().notNull(),listingJson:text('listing_json'),connectedAt:text('connected_at').notNull()
});
export const nostrChallenges=sqliteTable('nostr_challenges',{
 id:text('id').primaryKey().notNull(),userId:text('user_id').notNull(),pubkey:text('pubkey').notNull(),nonce:text('nonce').notNull(),expiresAt:integer('expires_at').notNull(),used:integer('used').notNull().default(0)
});
