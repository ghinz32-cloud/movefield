declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    APP_ORIGIN?: string;
    APP_VARIANT?: 'movefield' | 'grizzly';
    AUTH_SECRET?: string;
    NATIVE_AUTH_VERIFIED?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    MOVEFIELD_CLOUD_ENABLED?: string;
    FREE_ALLOWANCE_VERIFIED?: string;
    MOVEFIELD_LOCAL_TEST?: string;
    AI_PROVIDER_VERIFIED?: string;
    AI_API_KEY?: string;
    AI_MODEL?: string;
  }
}
