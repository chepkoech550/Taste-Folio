declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    FLASH_API_URL?: string;
    FLASH_API_KEY?: string;
  }
}

