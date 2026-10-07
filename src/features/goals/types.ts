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

export const defaultDailyGoals: LearningGoal[] = [
  {
    id: "daily-1",
    title: "Hoàn thành 1 bài học lý thuyết",
    category: "lesson",
    timeframe: "daily",
    targetValue: 1,
    currentValue: 1,
    unit: "bài",
    completed: true,
    rewardGp: 15,
    icon: "menu_book",
  },
  {
    id: "daily-2",
    title: "Luyện 2 bước bài toán Tự giải",
    category: "practice",
    timeframe: "daily",
    targetValue: 2,
    currentValue: 1,
    unit: "bước",
    completed: false,
    rewardGp: 10,
    icon: "psychology",
  },
  {
    id: "daily-3",
    title: "Tích lũy 30 GP trong ngày",
    category: "gp",
    timeframe: "daily",
    targetValue: 30,
    currentValue: 24,
    unit: "GP",
    completed: false,
    rewardGp: 10,
    icon: "bolt",
  },
  {
    id: "daily-4",
    title: "20 phút ôn tập tập trung",
    category: "time",
    timeframe: "daily",
    targetValue: 20,
    currentValue: 20,
    unit: "phút",
    completed: true,
    rewardGp: 10,
    icon: "timer",
  },
];

export const defaultWeeklyGoals: LearningGoal[] = [
  {
    id: "weekly-1",
    title: "Nắm trọn 3 bài học chủ đề Căn bậc hai",
    category: "lesson",
    timeframe: "weekly",
    targetValue: 3,
    currentValue: 2,
    unit: "bài",
    completed: false,
    rewardGp: 40,
    icon: "school",
  },
  {
    id: "weekly-2",
    title: "Đạt từ 8.0 điểm trong bài thi thử",
    category: "exam",
    timeframe: "weekly",
    targetValue: 8,
    currentValue: 7.2,
    unit: "điểm",
    completed: false,
    rewardGp: 35,
    icon: "quiz",
  },
  {
    id: "weekly-3",
    title: "Tích lũy đạt mốc 150 GP cả tuần",
    category: "gp",
    timeframe: "weekly",
    targetValue: 150,
    currentValue: 120,
    unit: "GP",
    completed: false,
    rewardGp: 50,
    icon: "savings",
  },
  {
    id: "weekly-4",
    title: "Tham gia 1 buổi hỏi đáp cùng Tutor",
    category: "tutor",
    timeframe: "weekly",
    targetValue: 1,
    currentValue: 1,
    unit: "buổi",
    completed: true,
    rewardGp: 25,
    icon: "support_agent",
  },
];
