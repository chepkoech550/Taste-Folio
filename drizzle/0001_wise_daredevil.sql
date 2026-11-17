CREATE TABLE IF NOT EXISTS `nostr_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`pubkey` text NOT NULL,
	`nonce` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `nostr_identities` (
	`user_id` text PRIMARY KEY NOT NULL,
	`pubkey` text NOT NULL,
	`listing_json` text,
	`connected_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `nostr_identities_pubkey_unique` ON `nostr_identities` (`pubkey`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `opportunities` (
	`id` text PRIMARY KEY NOT NULL,
	`buyer_id` text NOT NULL,
	`seller_id` text,
	`record` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `opportunities_buyer` ON `opportunities` (`buyer_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `opportunities_seller` ON `opportunities` (`seller_id`);