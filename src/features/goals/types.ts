export interface LearningGoal {
  id: string;
  title: string;
  category: "lesson" | "practice" | "gp" | "time" | "tutor" | "exam";
  timeframe: "daily" | "weekly";
  targetValue: number;
  currentValue: number;
  unit: string;
  completed: boolean;
  rewardGp: number;
  icon: string;
}

export { defaultDailyGoals, defaultWeeklyGoals } from "./data";
