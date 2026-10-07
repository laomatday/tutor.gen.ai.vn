import appConfigJson from "./config/app.json";
import type { AppConfig } from "../types/content";

const config = appConfigJson as AppConfig;

export function getAppConfig(): AppConfig {
  return structuredClone(config);
}

/** Backward-compatible export loaded from JSON */
export const appConfig = Object.freeze(getAppConfig());
