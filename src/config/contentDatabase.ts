import publicContentSource from "../data/config/content-source.json";

// These are public, browser-visible settings. Never put a secret/service-role
// key here or in a VITE_ variable. Environment overrides preserve deployment
// flexibility while the JSON fallback keeps the published catalog available.
export const contentDatabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || publicContentSource.url,
  publishableKey:
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    publicContentSource.publishableKey,
  enabled:
    (import.meta.env.VITE_CONTENT_SOURCE || publicContentSource.source) !==
    "local",
} as const;
