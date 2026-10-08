import goalData from "../../data/demo/goals.json";
import type { LearningGoal } from "./types";

/** Illustrative starting goals; saved edits remain local to this browser. */
export const defaultDailyGoals = structuredClone(
  goalData.daily,
) as LearningGoal[];
export const defaultWeeklyGoals = structuredClone(
  goalData.weekly,
) as LearningGoal[];
