import rewardsData from "./rewards/rewards.json";

import type {
  RewardItem,
  RewardFilter,
  RewardFlowStep,
} from "../types/content";
import { validateRewardsData } from "./validation";

const catalog = rewardsData.catalog as RewardItem[];
const filters = rewardsData.filters as RewardFilter[];
const flow = rewardsData.flow as RewardFlowStep[];

if (process.env.NODE_ENV !== "production") {
  const errors = validateRewardsData(catalog);
  if (errors.length > 0) {
    console.warn("[Content Validation] Rewards issues:", errors);
  }
}

export function getRewardCatalog(): RewardItem[] {
  return catalog.map((item) => ({ ...item }));
}

export function getRewardItemById(id: string): RewardItem | undefined {
  const found = catalog.find((item) => item.id === id);
  return found ? { ...found } : undefined;
}

export function getRewardFilters(): RewardFilter[] {
  return filters.map((f) => ({ ...f }));
}

export function getRewardFlow(): RewardFlowStep[] {
  return flow.map((step) => ({ ...step }));
}

/** Backward-compatible exports loaded from JSON */
export const rewardCatalog: RewardItem[] = getRewardCatalog();
export const rewardFilters: RewardFilter[] = getRewardFilters();
export const rewardFlow: RewardFlowStep[] = getRewardFlow();
export type { RewardItem } from "../types/content";
