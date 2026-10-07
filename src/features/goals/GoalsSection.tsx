import React, { useState, useEffect } from "react";
import { Button, Icon, Modal, Input, Select, Progress } from "../../components/ui";
import {
  defaultDailyGoals,
  defaultWeeklyGoals,
  type LearningGoal,
} from "./types";
import { browserStorage } from "../../lib/browserStorage";
import { storageKeys } from "../../config/storage";

interface GoalsSectionProps {
  onNavigate?: (tab: string) => void;
  onOpenBadges?: () => void;
  onEarnGp?: (amount: number, reason: string) => void;
}

export const GoalsSection: React.FC<GoalsSectionProps> = ({
  onNavigate,
  onOpenBadges,
  onEarnGp,
}) => {
  const [activeTimeframe, setActiveTimeframe] = useState<"daily" | "weekly">(
    "daily",
  );
  const [goals, setGoals] = useState<LearningGoal[]>(() => {
    try {
      const stored = browserStorage.read(storageKeys.studentGoals);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [...defaultDailyGoals, ...defaultWeeklyGoals];
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] =
    useState<LearningGoal["category"]>("lesson");
  const [newTarget, setNewTarget] = useState("1");
  const [newUnit, setNewUnit] = useState("bài");

  useEffect(() => {
    try {
      browserStorage.write(storageKeys.studentGoals, JSON.stringify(goals));
    } catch {
      // ignore
    }
  }, [goals]);

  const currentGoals = goals.filter((g) => g.timeframe === activeTimeframe);
  const completedCount = currentGoals.filter((g) => g.completed).length;
  const totalCount = currentGoals.length;
  const percentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleGoal = (id: string) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id === id) {
          const nextCompleted = !goal.completed;
          if (nextCompleted && onEarnGp) {
            onEarnGp(goal.rewardGp, `Hoàn thành mục tiêu: ${goal.title}`);
          }
          return {
            ...goal,
            completed: nextCompleted,
            currentValue: nextCompleted
              ? goal.targetValue
              : Math.max(0, goal.currentValue - 1),
          };
        }
        return goal;
      }),
    );
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const iconMap: Record<LearningGoal["category"], string> = {
      lesson: "menu_book",
      practice: "psychology",
      gp: "bolt",
      time: "timer",
      tutor: "support_agent",
      exam: "quiz",
    };

    const newGoalItem: LearningGoal = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      timeframe: activeTimeframe,
      targetValue: parseFloat(newTarget) || 1,
      currentValue: 0,
      unit: newUnit || "lần",
      completed: false,
      rewardGp: activeTimeframe === "daily" ? 15 : 30,
      icon: iconMap[newCategory],
    };

    setGoals((prev) => [...prev, newGoalItem]);
    setNewTitle("");
    setIsAddModalOpen(false);
  };

  const deleteGoal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <section className="rounded-3xl border border-outline-variant bg-white p-5 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <Icon name="track_changes" className="text-xl" />
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-secondary">
              MỤC TIÊU HỌC TẬP & KỶ LUẬT
            </p>
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-primary sm:text-2xl">
            Kế hoạch rèn luyện{" "}
            {activeTimeframe === "daily" ? "hôm nay" : "tuần này"}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Daily vs Weekly switcher */}
          <div className="inline-flex rounded-full border border-outline-variant/80 bg-surface-container-low p-1 text-xs">
            <Button
              variant={activeTimeframe === "daily" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTimeframe("daily")}
              className="rounded-full text-xs h-8"
            >
              Mục tiêu hôm nay
            </Button>
            <Button
              variant={activeTimeframe === "weekly" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTimeframe("weekly")}
              className="rounded-full text-xs h-8"
            >
              Mục tiêu tuần
            </Button>
          </div>

          <Button
            variant="surface"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-full border border-outline-variant text-xs font-semibold hover:bg-surface-container-low"
          >
            <Icon name="add" className="text-base" />
            Thêm mục tiêu
          </Button>

          {onOpenBadges && (
            <Button
              variant="surface"
              size="sm"
              onClick={onOpenBadges}
              className="rounded-full border border-secondary/30 bg-secondary/10 text-xs font-bold text-secondary hover:bg-secondary/20"
            >
              <Icon name="military_tech" className="text-base" />
              Huy hiệu mốc
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar & Summary Banner */}
      <div className="mt-6 rounded-2xl bg-surface-container-low/80 p-4 sm:p-5 border border-outline-variant/40">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary text-sm">
              Tiến độ: {completedCount}/{totalCount} mục tiêu
            </span>
            {percentage === 100 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-0.5 font-bold text-secondary">
                <Icon name="stars" className="text-xs" /> Xuất sắc hoàn thành!
              </span>
            ) : (
              <span className="text-on-surface-variant">
                (Còn {totalCount - completedCount} mục tiêu cần thực hiện)
              </span>
            )}
          </div>
          <span className="text-base font-extrabold text-secondary">
            {percentage}%
          </span>
        </div>

        <Progress value={percentage} label={`Tiến độ mục tiêu ${activeTimeframe}`} tone="accent" className="h-2.5 bg-white" />
      </div>

      {/* Goals List */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {currentGoals.map((goal) => {
          const isDone = goal.completed;
          return (
            <Button
              variant="surface"
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`group relative flex items-center justify-between gap-3.5 rounded-2xl border p-4 text-left w-full transition-all duration-200 ${
                isDone
                  ? "border-secondary/30 bg-secondary/5 hover:bg-secondary/10"
                  : "border-outline-variant/60 bg-white hover:border-secondary/40 hover:shadow-2xs"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                {/* Checkbox Icon */}
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
                    isDone
                      ? "border-secondary bg-secondary text-white shadow-xs"
                      : "border-outline text-transparent group-hover:border-secondary"
                  }`}
                >
                  <Icon name="check" className="text-sm font-bold" />
                </span>

                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold transition-colors ${
                      isDone
                        ? "text-on-surface-variant line-through opacity-80"
                        : "text-primary group-hover:text-secondary"
                    }`}
                  >
                    {goal.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Icon
                        name={goal.icon}
                        className="text-xs text-secondary"
                      />
                      {goal.currentValue}/{goal.targetValue} {goal.unit}
                    </span>
                    <span>·</span>
                    <span className="font-bold text-secondary">
                      +{goal.rewardGp} GP
                    </span>
                  </div>
                </div>
              </div>

              {/* Action / Delete */}
              <div className="flex items-center gap-1 shrink-0">
                {goal.id.startsWith("custom-") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => deleteGoal(goal.id, e)}
                    aria-label="Xóa mục tiêu"
                    className="p-1 text-outline hover:text-secondary transition-colors rounded-lg h-7 w-7"
                  >
                    <Icon name="delete_outline" className="text-base" />
                  </Button>
                )}
                <span
                  className={`text-xs font-bold rounded-full px-2.5 py-1 ${
                    isDone
                      ? "bg-secondary/20 text-secondary"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {isDone ? "Đã xong" : "Đang làm"}
                </span>
              </div>
            </Button>
          );
        })}
      </div>

      {/* Add Custom Goal Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm mục tiêu học tập mới"
        description={`Thiết lập mục tiêu cá nhân cho ${activeTimeframe === "daily" ? "ngày hôm nay" : "tuần này"}`}
      >
        <form onSubmit={handleAddGoal} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Tên mục tiêu
            </label>
            <Input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="VD: Làm 3 bài tập rút gọn căn thức..."
              required
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Loại mục tiêu
              </label>
              <Select
                value={newCategory}
                onChange={(e) =>
                  setNewCategory(e.target.value as LearningGoal["category"])
                }
              >
                <option value="lesson">Học bài lý thuyết</option>
                <option value="practice">Tự giải từng bước</option>
                <option value="gp">Tích lũy điểm GP</option>
                <option value="time">Thời gian tập trung (Phút)</option>
                <option value="tutor">Học cùng Tutor</option>
                <option value="exam">Luyện đề thi thử</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Chỉ tiêu (Mục tiêu số)
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="w-20"
                />
                <Input
                  type="text"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="Đơn vị (bài, phút...)"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-outline-variant">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsAddModalOpen(false)}
            >
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              <Icon name="add_task" className="text-base" />
              Lưu mục tiêu
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
};
