export const workSchema = [
 `CREATE TABLE IF NOT EXISTS opportunities (id TEXT PRIMARY KEY NOT NULL,buyer_id TEXT NOT NULL,seller_id TEXT,record TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`,
 `CREATE INDEX IF NOT EXISTS opportunities_buyer ON opportunities(buyer_id)`,
 `CREATE INDEX IF NOT EXISTS opportunities_seller ON opportunities(seller_id)`,
 `CREATE TABLE IF NOT EXISTS nostr_identities (user_id TEXT PRIMARY KEY NOT NULL,pubkey TEXT NOT NULL,listing_json TEXT,connected_at TEXT NOT NULL)`,
 `CREATE UNIQUE INDEX IF NOT EXISTS nostr_identities_pubkey_unique ON nostr_identities(pubkey)`,
 `CREATE TABLE IF NOT EXISTS nostr_challenges (id TEXT PRIMARY KEY NOT NULL,user_id TEXT NOT NULL,pubkey TEXT NOT NULL,nonce TEXT NOT NULL,expires_at INTEGER NOT NULL,used INTEGER NOT NULL DEFAULT 0)`,
];
let ready;
export function ensureWorkSchema(db) {
 if(!ready)ready=db.batch(workSchema.map(sql=>db.prepare(sql))).catch(error=>{ready=undefined;throw error});
 return ready;
}
