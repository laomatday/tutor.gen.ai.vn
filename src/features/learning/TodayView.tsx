import { Button, Input, Select, Icon, buttonStyles, Progress } from "../../components/ui";
import { appConfig } from "../../config/app";
import { routePath } from "../../config/routes";
import React from "react";
import { useCurriculum } from "../../context/CurriculumContext";
import {
  canStudy,
  lessonHref,
  studentProfile,
  SUBJECTS,
  primaryEnrollment,
  courseLabel,
  courseHref,
  subjectFor,
  lessonStages,
  ownedPublishedLessons,
  summarizeProgress,
} from "../curriculum";
import { GoalsSection } from "../goals/GoalsSection";
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
  onEarnGp,
}) => {
  const { lessons, topics, completedLessonIds, storageError } = useCurriculum();
  const enrollment = primaryEnrollment;
  const enrolledSubject = subjectFor(enrollment.subjectId)!;
  const ownedLabel = courseLabel(enrollment.gradeId, enrollment.subjectId);
  const courseLessons = ownedPublishedLessons(lessons, topics).filter(
    (lesson) =>
      lesson.gradeId === enrollment.gradeId &&
      lesson.subjectId === enrollment.subjectId,
  );
  const completed = courseLessons.filter((lesson) =>
    completedLessonIds.includes(lesson.id),
  ).length;
  const percent = courseLessons.length
    ? Math.round((completed / courseLessons.length) * 100)
    : 0;
  const remaining = courseLessons.filter(
    (lesson) => !completedLessonIds.includes(lesson.id),
  );
  const nextLesson = remaining[0] ?? courseLessons[0];
  const courseTopics = topics.filter(
    (topic) =>
      canStudy(topic.gradeId, topic.subjectId) &&
      courseLessons.some((lesson) => lesson.topicId === topic.id),
  );
  const continueLearning = () =>
    onNavigate(
      nextLesson
        ? lessonHref(nextLesson)
        : courseHref(enrollment.gradeId, enrollment.subjectId),
    );

  const unlockedBadges = initialBadges.filter((b) => b.unlocked);
  const nextMilestoneBadge = initialBadges.find((b) => !b.unlocked);

  return (
    <div className="w-full space-y-6 pb-10">
      <div className="ui-page-header">
        <div>
          <p className="ui-page-kicker">
            KHÔNG GIAN HỌC TẬP CỦA BẠN
          </p>
          <h1 className="ui-page-title">
            Chào {studentProfile.name.split(" ").at(-1)}, cùng học tiếp nhé!
          </h1>
          <p className="ui-page-description">
            Hiểu từng bài. Vững từng bước. Tiến bộ mỗi ngày.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-white px-4 py-2 text-xs font-semibold text-primary">
          <Icon name="school" className="text-base" />
          {studentProfile.className} <span className="text-outline">·</span>{" "}
          {studentProfile.enrollments.length} môn đã đăng ký
        </span>
      </div>

      {storageError && (
        <p
          role="alert"
          className="rounded-xl bg-error-container p-4 text-sm text-on-error-container"
        >
          {storageError}
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <section className="overflow-hidden ui-learning-card">
          <div className="bg-secondary-container/45 p-5 sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> MÔN
                HỌC CỦA TÔI
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary">
                <Icon name="verified" className="text-base" />
                Đã đăng ký
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                  {enrolledSubject.name}{" "}
                  <span className="text-secondary">
                    lớp {enrollment.gradeId}
                  </span>
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-on-surface-variant">
                  Từ hiểu kiến thức đến tự tin vận dụng.
                  <br className="hidden sm:block" /> Học theo chủ đề, luyện tập
                  theo từng dạng bài.
                </p>
              </div>
              <span className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white/80 text-primary sm:flex">
                <Icon name={enrolledSubject.icon} className="text-5xl" />
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="folder_open" className="text-base text-secondary" />
                {courseTopics.length} chủ đề
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="menu_book" className="text-base text-secondary" />
                {courseLessons.length} bài học
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="school" className="text-base text-secondary" />
                Ôn tập & củng cố nền tảng
              </span>
            </div>
          </div>
          <div className="p-5 sm:p-7">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="text-on-surface-variant">
                Đã hoàn thành{" "}
                <strong className="text-primary">
                  {completed}/{courseLessons.length} bài
                </strong>
              </span>
              <strong className="text-secondary">{percent}%</strong>
            </div>
            <Progress value={percent} label={`Tiến độ ${ownedLabel}`} tone="accent" className="h-2" />
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-outline">
                  {remaining.length ? "Bài học tiếp theo" : "Ôn lại kiến thức"}
                </p>
                <p className="mt-1 text-sm font-semibold text-on-surface">
                  {nextLesson?.title ?? "Khám phá nội dung môn học"}
                </p>
              </div>
              <Button onClick={continueLearning}>
                {remaining.length ? "Tiếp tục học" : "Vào môn học"}
                <Icon name="arrow_forward" className="text-lg" />
              </Button>
            </div>
          </div>
        </section>

        <section className="flex flex-col ui-learning-card p-5 sm:p-7">
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container-low text-primary">
            <Icon name="route" />
          </span>
          <h2 className="text-lg font-bold text-primary">
            Một bài học, ba bước nắm vững
          </h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Học theo nhịp của bạn, từ hiểu đến làm được.
          </p>
          <ol className="mt-6 space-y-5">
            {lessonStages.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? "bg-primary text-white" : "bg-secondary-container/60 text-secondary"}`}
                >
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-on-surface">
                    {step.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section
        aria-label="Tóm tắt học tập"
        className="grid grid-cols-2 gap-4 ui-learning-card p-4 lg:grid-cols-4"
      >
        {[
          {
            icon: "menu_book",
            value: `${studentProfile.enrollments.length} môn`,
            label: `Đã đăng ký · ${ownedLabel}`,
          },
          {
            icon: "task_alt",
            value: `${completed} bài`,
            label: "Đã hoàn thành",
          },
          {
            icon: "savings",
            value: `${gpBalance} GP`,
            label: "Điểm tích lũy của bạn",
          },
          {
            icon: "bolt",
            value: `${dailyGp}/${appConfig.rewards.dailyLimit} GP`,
            label: "Tích lũy hôm nay",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-start gap-3 rounded-2xl bg-background p-3 sm:flex-row sm:p-4"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container/60 text-secondary">
              <Icon name={stat.icon} className="text-xl" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-bold text-primary">{stat.value}</p>
              <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Goals Section */}
      <GoalsSection
        onNavigate={onNavigate}
        onOpenBadges={onOpenBadges}
        onEarnGp={onEarnGp}
      />

      {/* Badges Milestone Banner */}
      <section className="rounded-3xl border border-secondary/20 bg-linear-to-r from-secondary/10 via-primary/5 to-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-white shadow-xs">
              <Icon name="military_tech" className="text-2xl" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  HUY HIỆU & MỐC THÀNH TÍCH
                </span>
                <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-bold text-secondary">
                  Đã đạt {unlockedBadges.length}/{initialBadges.length}
                </span>
              </div>
              <h3 className="text-base font-bold text-primary mt-0.5">
                {nextMilestoneBadge
                  ? `Mục tiêu kế tiếp: ${nextMilestoneBadge.title}`
                  : "Bạn đã chinh phục trọn bộ huy hiệu!"}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {nextMilestoneBadge
                  ? `${nextMilestoneBadge.description} (Thưởng +${nextMilestoneBadge.rewardGp} GP)`
                  : "Tiếp tục duy trì phong độ xuất sắc trong các bài học tiếp theo!"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenBadges && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenBadges}
                className="rounded-full font-bold text-xs"
              >
                <Icon name="workspace_premium" className="text-base" />
                Xem tất cả huy hiệu
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate("/thoi-khoa-bieu")}
              className="rounded-full font-bold text-xs"
            >
              <Icon name="calendar_month" className="text-base" />
              Thời khóa biểu
            </Button>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-secondary">
              HỌC THEO CHỦ ĐỀ
            </p>
            <h2 className="text-xl font-bold text-primary sm:text-2xl">
              Từng phần kiến thức, từng bước tiến
            </h2>
          </div>
          <Button
            variant="surface"
            type="button"
            onClick={() =>
              onNavigate(courseHref(enrollment.gradeId, enrollment.subjectId))
            }
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-primary hover:bg-surface-container-low"
          >
            Xem môn {enrolledSubject.name}
            <Icon name="arrow_forward" className="text-lg" />
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {courseTopics.map((topic, index) => {
            const topicLessons = courseLessons.filter(
              (lesson) => lesson.topicId === topic.id,
            );
            const done = topicLessons.filter((lesson) =>
              completedLessonIds.includes(lesson.id),
            ).length;
            return (
              <Button
                variant="surface"
                type="button"
                key={topic.id}
                onClick={() =>
                  onNavigate(
                    courseHref(topic.gradeId, topic.subjectId, topic.id),
                  )
                }
                className="group flex flex-col ui-learning-card p-5 text-left transition-colors hover:border-secondary/40 hover:bg-secondary-container/10"
              >
                <div className="mb-5 flex w-full items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-container-low text-primary">
                    <Icon name={enrolledSubject.icon} />
                  </span>
                  <span className="text-xs font-medium text-outline">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="text-base font-bold leading-6 text-primary">
                  {topic.title}
                </h3>
                <p className="mt-2 flex-1 text-xs leading-5 text-on-surface-variant">
                  {topic.description}
                </p>
                <div className="mt-5 flex w-full items-center justify-between border-t border-outline-variant pt-4 text-xs">
                  <span className="font-medium text-secondary">
                    {done}/{topicLessons.length} bài hoàn thành
                  </span>
                  <Icon
                    name="arrow_forward"
                    className="text-lg text-primary transition-transform group-hover:translate-x-1"
                  />
                </div>
              </Button>
            );
          })}
          {!courseTopics.length && (
            <p className="col-span-full rounded-2xl border border-dashed border-outline-variant p-6 text-sm text-on-surface-variant">
              Chưa có chủ đề được công bố cho môn học này.
            </p>
          )}
        </div>
      </section>

      <section className="ui-learning-card p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-secondary">
              MỞ RỘNG HÀNH TRÌNH HỌC
            </p>
            <h2 className="text-xl font-bold text-primary">
              Còn nhiều điều để khám phá
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Bạn hiện đã đăng ký {ownedLabel}. Các môn khác chưa có trong gói
              học của bạn.
            </p>
          </div>
          <Button
            variant="surface"
            type="button"
            onClick={() => onNavigate(routePath("hoc-bai"))}
            className="rounded-full border border-outline-variant px-4 py-2.5 text-sm font-semibold text-primary hover:bg-surface-container-low"
          >
            Xem các môn học
          </Button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {SUBJECTS.filter(
            (subject) => !canStudy(enrollment.gradeId, subject.id),
          ).map((subject) => (
            <Button
              variant="surface"
              type="button"
              key={subject.id}
              onClick={() =>
                onNavigate(courseHref(enrollment.gradeId, subject.id))
              }
              className="flex items-center gap-3 rounded-2xl bg-background p-4 text-left hover:bg-surface-container-low"
            >
              <Icon name={subject.icon} className="text-2xl text-outline" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-primary">
                  {subject.name} · Lớp {enrollment.gradeId}
                </p>
                <p className="mt-1 text-xs text-outline">Chưa đăng ký</p>
              </div>
              <Icon name="lock" className="text-base text-outline" />
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
};
