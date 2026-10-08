export const contentDatabaseConfig = {
  url:
    import.meta.env.VITE_SUPABASE_URL ||
    "https://uketwpczthkflsmoiocs.supabase.co",
  publishableKey:
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_OGE2tF4o6NaZWh6WeMYOWg_nT-Zbu3W",
  enabled: import.meta.env.VITE_CONTENT_SOURCE !== "local",
} as const;
