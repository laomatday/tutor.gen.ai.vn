/**
 * Unified Data Access Layer (JSON-First)
 *
 * Exposes strongly-typed content getters and helpers for curriculum,
 * practice problems, assessments, rewards, and application configurations.
 * Allows seamless migration to a future CMS / REST / GraphQL backend
 * without rewriting UI components.
 */

export * from "./curriculum";
export * from "./practice";
export * from "./progress";
export * from "./rewards";
export * from "./config";
export * from "./demo";
export * from "./validation";
