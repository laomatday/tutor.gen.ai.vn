import React from "react";
import { Button, Icon, Progress } from "../../components/ui";
import { routePath } from "../../config/routes";
import { useCurriculum } from "../../context/CurriculumContext";
import {
  lessonHref,
  studentProfile,
  primaryEnrollment,
  courseHref,
  subjectFor,
  ownedPublishedLessons,
} from "../curriculum";
import { sampleAssessment, assessmentSummary } from "../progress/data";
import { initialBadges } from "../gamification/badges";

interface TodayViewProps {
  onNavigate: (tab: string) => void;
  onOpenBadges?: () => void;
  gpBalance: number;
  dailyGp: number;
  onEarnGp: (amount: number, reason: string) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  onNavigate,
  onOpenBadges,
  gpBalance,
  dailyGp,
}) => {
  const { lessons, topics, completedLessonIds, storageError } = useCurriculum();
  const enrollment = primaryEnrollment;
  const subject = subjectFor(enrollment.subjectId)!;
  const courseLessons = ownedPublishedLessons(lessons, topics)
    .filter(
      (lesson) =>
        lesson.gradeId === enrollment.gradeId &&
        lesson.subjectId === enrollment.subjectId,
    )
    .sort((a, b) => a.order - b.order);
  const completed = courseLessons.filter((lesson) =>
    completedLessonIds.includes(lesson.id),
  );
  const nextLesson =
    courseLessons.find((lesson) => !completedLessonIds.includes(lesson.id)) ??
    courseLessons[0];
  const progress = courseLessons.length
    ? Math.round((completed.length / courseLessons.length) * 100)
    : 0;
  const nextTopic = topics.find((topic) => topic.id === nextLesson?.topicId);
  const assessment = assessmentSummary(sampleAssessment);
  const unlocked = initialBadges.filter((badge) => badge.unlocked).length;
  const firstName = studentProfile.name.split(" ").at(-1);

  const missionPath = nextLesson
    ? lessonHref(nextLesson)
    : courseHref(enrollment.gradeId, enrollment.subjectId);

  const mapPath = routePath("hoc-bai");
  const replayPath = routePath("replay");

  return (
    <div className="learning-os-page">
      {storageError && (
        <div
          role="alert"
          className="rounded-2xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800"
        >
          {storageError}
        </div>
      )}

      <section className="mission-hero" aria-labelledby="mission-title">
        <div className="mission-layout">
          <div>
            <span className="mission-kicker">
              <Icon name="auto_awesome" />
              Mission 01 · AI chọn cho bạn
            </span>
            <h1 id="mission-title" className="mission-title">
              {firstName}, hôm nay chỉ cần thắng một nhiệm vụ.
            </h1>
            <p className="mission-copy">
              Tutor đã nhìn vào tiến độ hiện tại và chọn một bước vừa đủ khó để
              bạn tiến lên mà không phải tự tìm bài giữa hàng chục màn hình.
            </p>

            <div className="mt-6 max-w-2xl rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent-pale">
                    Nhiệm vụ tiếp theo
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    {nextLesson?.title ?? "Khám phá chương trình học"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    {nextTopic?.title ?? subject.name} · {nextLesson?.durationMinutes ?? 15} phút
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                  {progress}% mastery
                </span>
              </div>
              <Progress
                value={progress}
                label="Tiến độ chương trình"
                tone="accent"
                className="mt-5 h-2 bg-white/10"
              />
            </div>

            <div className="mission-actions">
              <Button
                variant="surface"
                className="mission-primary-action"
                onClick={() => onNavigate(missionPath)}
              >
                Bắt đầu {nextLesson?.durationMinutes ?? 15} phút
                <Icon name="arrow_forward" />
              </Button>
              <Button
                variant="surface"
                className="mission-secondary-action"
                onClick={() => onNavigate(mapPath)}
              >
                <Icon name="route" />
                Xem Knowledge Map
              </Button>
            </div>
          </div>

          <div className="mission-orbit" aria-label="Tín hiệu học tập hôm nay">
            <div className="mission-orbit-core">
              <span className="text-4xl font-extrabold">{progress}%</span>
              <span className="mt-1 text-xs font-bold uppercase tracking-wider text-accent-strong">
                mastery
              </span>
            </div>
            <span className="mission-orbit-node mission-orbit-node--a" title="Tập trung">
              <Icon name="target" />
            </span>
            <span className="mission-orbit-node mission-orbit-node--b" title="AI Pulse">
              <Icon name="auto_awesome" />
            </span>
            <span className="mission-orbit-node mission-orbit-node--c" title="Replay">
              <Icon name="replay" />
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <section className="signal-card signal-card--accent">
          <div className="signal-label">
            <Icon name="psychology" />
            AI Pulse
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-brand">
            Không chỉ biết bạn sai. Tutor cần biết bạn đang nghĩ lệch ở đâu.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-600">
            Tín hiệu gần nhất cho thấy bạn còn mất khoảng{" "}
            <strong className="text-brand">{assessment.recoverablePoints} điểm</strong>{" "}
            ở các lỗi có thể sửa bằng ôn đúng prerequisite. Mission hôm nay ưu tiên
            phần liên quan trước khi tăng độ khó.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-semibold text-ink-500">Bài đã vững</p>
              <p className="mt-1 text-2xl font-bold text-brand">
                {completed.length}/{courseLessons.length}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-semibold text-ink-500">Huy hiệu mở khóa</p>
              <p className="mt-1 text-2xl font-bold text-brand">{unlocked}</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-semibold text-ink-500">GP hôm nay</p>
              <p className="mt-1 text-2xl font-bold text-brand">{dailyGp}</p>
            </div>
          </div>
        </section>

        <section className="signal-card">
          <div className="signal-label">
            <Icon name="replay" />
            Thinking Replay
          </div>
          <h2 className="mt-4 text-xl font-bold text-brand">
            Xem lại đường suy nghĩ, không chỉ xem điểm.
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            Replay cho thấy lúc nào bạn mở gợi ý, bước nào bị lệch và Tutor đã
            can thiệp ở đâu. Đây là hồ sơ học tập có thể dùng để học lại thông minh hơn.
          </p>
          <Button
            variant="secondary"
            className="mt-5"
            onClick={() => onNavigate(replayPath)}
          >
            Mở Replay
            <Icon name="arrow_forward" />
          </Button>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <section className="knowledge-preview" aria-labelledby="map-preview-title">
          <div className="relative z-20">
            <p className="signal-label">
              <Icon name="route" />
              Knowledge Universe
            </p>
            <h2 id="map-preview-title" className="mt-3 text-xl font-bold text-brand">
              Học theo mối liên hệ, không theo danh sách bài.
            </h2>
          </div>
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 700 300"
            aria-hidden="true"
          >
            <line className="knowledge-preview-line" x1="130" y1="200" x2="320" y2="100" />
            <line className="knowledge-preview-line" x1="320" y1="100" x2="540" y2="170" />
            <line className="knowledge-preview-line" x1="320" y1="100" x2="390" y2="245" />
          </svg>
          <span className="knowledge-preview-node" style={{ left: "13%", top: "68%" }}>
            Căn thức
          </span>
          <span className="knowledge-preview-node" data-active="true" style={{ left: "45%", top: "36%" }}>
            Hàm số
          </span>
          <span className="knowledge-preview-node" style={{ left: "74%", top: "58%" }}>
            Phương trình
          </span>
          <span className="knowledge-preview-node" style={{ left: "56%", top: "82%" }}>
            Hình học
          </span>
          <Button
            variant="surface"
            onClick={() => onNavigate(mapPath)}
            className="absolute bottom-5 right-5 z-20 min-h-11 rounded-full border border-brand/15 bg-white px-4 text-sm font-semibold text-brand shadow-card"
          >
            Mở toàn bản đồ
            <Icon name="arrow_forward" />
          </Button>
        </section>

        <section className="signal-card">
          <p className="signal-label">
            <Icon name="workspace_premium" />
            Mastery identity
          </p>
          <h2 className="mt-3 text-xl font-bold text-brand">Problem Solver</h2>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            Thành tích không chỉ đến từ điểm. Tutor ghi nhận việc tự sửa lỗi,
            kiên trì và sử dụng gợi ý đúng lúc.
          </p>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-surface-page px-4 py-3">
              <span>Tự sửa lỗi</span><strong className="text-accent-strong">× 17</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-surface-page px-4 py-3">
              <span>Không bỏ cuộc</span><strong className="text-accent-strong">× 8</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-surface-page px-4 py-3">
              <span>GP hiện có</span><strong className="text-brand">{gpBalance}</strong>
            </div>
          </div>
          {onOpenBadges && (
            <Button variant="ghost" className="mt-4" onClick={onOpenBadges}>
              Xem hồ sơ mastery
              <Icon name="arrow_forward" />
            </Button>
          )}
        </section>
      </div>
    </div>
  );
};
