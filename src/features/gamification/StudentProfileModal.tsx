import { StudentAvatar } from "../../components/student/StudentAvatar";
import React, { useState } from "react";
import { Modal, Button, Icon, Progress } from "../../components/ui";
import { studentProfile } from "../learning/data/student";
import { initialBadges, type StudentBadge } from "./badges";
import { useCurriculum } from "../../context/CurriculumContext";

interface StudentProfileModalProps {
  open: boolean;
  onClose: () => void;
  gpBalance?: number;
  completedLessonsCount?: number;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  open,
  onClose,
  gpBalance = 0,
  completedLessonsCount = 0,
}) => {
  const { subjects } = useCurriculum();
  const enrolledCourses = studentProfile.enrollments
    .map(({ subjectId, gradeId }) => {
      const subject = subjects.find((item) => item.id === subjectId);
      return subject ? `${subject.name} ${gradeId}` : null;
    })
    .filter(Boolean)
    .join(" · ");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "unlocked" | "locked"
  >("all");
  const [selectedBadge, setSelectedBadge] = useState<StudentBadge | null>(null);

  const badges = initialBadges;
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  const filteredBadges = badges.filter((badge) => {
    if (activeFilter === "unlocked") return badge.unlocked;
    if (activeFilter === "locked") return !badge.unlocked;
    return true;
  });

  const tierLabels: Record<
    StudentBadge["tier"],
    { label: string; className: string }
  > = {
    bronze: {
      label: "Đồng",
      className: "text-brand bg-secondary/15 border-secondary/30",
    },
    silver: {
      label: "Bạc",
      className:
        "text-on-surface-variant bg-surface-container border-outline-variant",
    },
    gold: {
      label: "Vàng",
      className: "text-brand bg-secondary/20 border-secondary/40 font-bold",
    },
    diamond: {
      label: "Kim cương",
      className: "text-primary bg-primary/10 border-primary/30 font-bold",
    },
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Icon name="military_tech" className="text-secondary text-2xl" />
          <span>Hồ sơ & Bộ sưu tập Huy hiệu</span>
        </div>
      }
      description="Tiến độ và điểm thưởng trên thiết bị; bộ huy hiệu bên dưới là dữ liệu minh họa."
      className="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Student Profile Overview Card */}
        <div className="relative overflow-hidden rounded-3xl border border-secondary/20 bg-linear-to-br from-primary/5 via-secondary/10 to-transparent p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="relative">
              <StudentAvatar
                name={studentProfile.name}
                src={studentProfile.avatarUrl}
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover ring-4 ring-white shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-white shadow-sm ring-2 ring-white">
                <Icon name="verified" className="text-lg" />
              </span>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xl font-bold text-primary">
                  {studentProfile.name}
                </h3>
                <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                  Lớp {studentProfile.className}
                </span>
                <span className="rounded-full bg-secondary/15 px-3 py-0.5 text-xs font-bold text-secondary">
                  {studentProfile.levelLabel}
                </span>
              </div>

              <p className="mt-1 text-xs text-on-surface-variant">
                {enrolledCourses
                  ? `Môn đã đăng ký: ${enrolledCourses}`
                  : "Chưa đăng ký môn học"}
              </p>

              {/* Quick Stats */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/80 p-2.5 text-center shadow-2xs">
                  <p className="text-xs text-on-surface-variant">Huy hiệu</p>
                  <p className="text-base font-bold text-secondary">
                    {unlockedCount}/{badges.length}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/80 p-2.5 text-center shadow-2xs">
                  <p className="text-xs text-on-surface-variant">Điểm GP</p>
                  <p className="text-base font-bold text-primary">
                    {gpBalance} GP
                  </p>
                </div>
                <div className="rounded-2xl bg-white/80 p-2.5 text-center shadow-2xs">
                  <p className="text-xs text-on-surface-variant">Bài đã học</p>
                  <p className="text-base font-bold text-primary">
                    {completedLessonsCount} bài
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Collection Header & Filter */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-bold text-primary flex items-center gap-2">
                <Icon name="workspace_premium" className="text-secondary" />
                Huy hiệu minh họa ({unlockedCount}/{badges.length})
              </h4>
              <p className="text-xs text-on-surface-variant">
                Khám phá các mốc và phần thưởng trong bộ huy hiệu minh họa
              </p>
            </div>

            <div
              className="ui-segmented grid-cols-3"
              role="group"
              aria-label="Lọc huy hiệu"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilter("all")}
                aria-pressed={activeFilter === "all"}
              >
                Tất cả ({badges.length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilter("unlocked")}
                aria-pressed={activeFilter === "unlocked"}
              >
                Đã đạt ({unlockedCount})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilter("locked")}
                aria-pressed={activeFilter === "locked"}
              >
                Chưa đạt ({badges.length - unlockedCount})
              </Button>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredBadges.map((badge) => {
              const tierInfo = tierLabels[badge.tier];
              const isSelected = selectedBadge?.id === badge.id;

              return (
                <Button
                  variant="surface"
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`group relative flex items-start text-left w-full rounded-2xl border p-4 transition-all duration-200 ${
                    badge.unlocked
                      ? isSelected
                        ? "border-secondary bg-secondary/10 shadow-md ring-2 ring-secondary/20"
                        : "border-outline-variant/60 bg-white hover:border-secondary/50 hover:shadow-xs"
                      : "border-dashed border-outline-variant/70 bg-surface-container-low/50"
                  }`}
                >
                  <div className="flex items-start gap-3.5 w-full">
                    {/* Badge Icon Visual */}
                    <div className="relative shrink-0">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner transition-transform group-hover:scale-105 ${
                          badge.unlocked
                            ? "bg-secondary/15 text-secondary ring-2 ring-white"
                            : "bg-surface-container text-outline"
                        }`}
                      >
                        <Icon
                          name={badge.unlocked ? badge.icon : "lock"}
                          className="text-2xl"
                        />
                      </div>
                      {badge.unlocked && (
                        <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-secondary text-white shadow-xs">
                          <Icon name="check" className="text-xs" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h5 className="truncate text-sm font-bold text-primary group-hover:text-secondary">
                          {badge.title}
                        </h5>
                        <span
                          className={`rounded-md border px-1.5 py-0.5 text-xs ${tierInfo.className}`}
                        >
                          {tierInfo.label}
                        </span>
                      </div>

                      <p className="mt-1 text-xs line-clamp-2 text-on-surface-variant font-normal">
                        {badge.description}
                      </p>

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="font-semibold text-secondary flex items-center gap-1">
                          <Icon name="savings" className="text-xs" />+
                          {badge.rewardGp} GP
                        </span>
                        {badge.unlocked ? (
                          <span className="text-secondary font-medium">
                            Đã nhận
                          </span>
                        ) : (
                          <span className="text-outline">
                            {badge.currentValue}/{badge.targetValue}{" "}
                            {badge.unit}
                          </span>
                        )}
                      </div>

                      {/* Progress bar if locked */}
                      {!badge.unlocked && (
                        <Progress
                          value={badge.progress}
                          label={`Tiến độ huy hiệu ${badge.title}`}
                          tone="accent"
                          className="mt-1.5 h-1.5 w-full"
                        />
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Selected Badge Detail Modal Box */}
        {selectedBadge && (
          <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-secondary shadow-2xs">
                  <Icon name={selectedBadge.icon} className="text-2xl" />
                </span>
                <div>
                  <h5 className="text-sm font-bold text-primary flex items-center gap-2">
                    {selectedBadge.title}
                    {selectedBadge.unlocked && (
                      <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-bold text-secondary">
                        Đã mở khóa
                      </span>
                    )}
                  </h5>
                  <p className="text-xs text-on-surface-variant">
                    {selectedBadge.criteria}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBadge(null)}
                className="h-7 text-xs text-outline"
              >
                Đóng chi tiết
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs pt-2 border-t border-secondary/15 text-on-surface-variant">
              <span>
                Phần thưởng mẫu:{" "}
                <strong className="text-secondary font-bold">
                  +{selectedBadge.rewardGp} GP
                </strong>
              </span>
              <span>
                Trạng thái mẫu:{" "}
                <strong>
                  {selectedBadge.unlocked
                    ? `Hoàn thành ngày ${selectedBadge.unlockedAt}`
                    : `Tiến độ hiện tại: ${selectedBadge.currentValue}/${selectedBadge.targetValue} ${selectedBadge.unit} (${selectedBadge.progress}%)`}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
