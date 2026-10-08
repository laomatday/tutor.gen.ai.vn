import demoBadges from "../../data/demo/badges.json";

export interface StudentBadge {
  id: string;
  title: string;
  description: string;
  criteria: string;
  category: "milestone" | "streak" | "mastery" | "tutor" | "reward";
  tier: "bronze" | "silver" | "gold" | "diamond";
  icon: string;
  rewardGp: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number; // 0 to 100
  currentValue: number;
  targetValue: number;
  unit: string;
}

/** Explicit illustrative achievements; not computed learner assessment. */
export const initialBadges: StudentBadge[] = structuredClone(
  demoBadges,
) as StudentBadge[];
