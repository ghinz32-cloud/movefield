declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    MOVEFIELD_TRUST_SITES_AUTH?: string;
    MOVEFIELD_AI_BASE_URL?: string;
    MOVEFIELD_AI_API_KEY?: string;
    MOVEFIELD_AI_MODEL?: string;
  }
}
