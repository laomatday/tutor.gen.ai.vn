import { useReadingPosition } from "./useReadingPosition";
import { normalizeSearch } from "../../lib/search";
import {
  navigateTo,
  ordinaryLinkClick as ordinaryClick,
} from "../../app/navigation";
import { Button, Input, Select, Icon, buttonStyles, Progress } from "../../components/ui";
import { StudentPageHeader, StudentSignalStrip } from "../../components/student/StudentExperience";
import { appConfig } from "../../config/app";
import { routePath } from "../../config/routes";
import React, { useEffect, useState } from "react";
import { AdaptiveText } from "../../components/AdaptiveText";
import { LessonContentRenderer } from "../../components/LessonContentRenderer";
import { useCurriculum } from "../../context/CurriculumContext";
import {
  GRADES,
  studentProfile,
  canStudy,
  lessonHref,
  lessonStages,
  primaryEnrollment,
  courseLabel,
  courseHref,
  subjectFor,
  isPublishedInCurriculum,
  type Lesson,
  type LessonStage,
} from "../curriculum";

interface TheoryLessonsViewProps {
  onNavigate: (tab: string) => void;
  onEarnGp: (amount: number, reason: string) => void;
}
interface LearningLocation {
  gradeId: string;
  subjectId: string;
  topicId: string;
  lessonId: string;
  stage: LessonStage;
}
type LessonSort = "program" | "duration" | "unfinished";
type CompletionFilter = "all" | "unfinished" | "completed";
const stages = lessonStages.map((stage) => ({ ...stage, title: stage.label }));
function readLocation(): LearningLocation {
  const params = new URLSearchParams(window.location.search);
  const stage = params.get("stage");
  return {
    gradeId: params.get("grade") || studentProfile.gradeId,
    subjectId: params.get("subject") || "",
    topicId: params.get("topic") || "",
    lessonId: params.get("lesson") || "",
    stage: stages.some((item) => item.id === stage)
      ? (stage as LessonStage)
      : "theory",
  };
}

export const TheoryLessonsView: React.FC<TheoryLessonsViewProps> = ({
  onNavigate,
  onEarnGp,
}) => {
  const { subjects, topics, lessons, completedLessonIds, completeLesson, contentSource, contentLoading, contentError, storageError } =
    useCurriculum();
  const [location, setLocation] = useState(readLocation);
  const [answers, setAnswers] = useState<
    Record<string, Record<string, number>>
  >({});
  const [checkedLessons, setCheckedLessons] = useState<Record<string, boolean>>(
    {},
  );
  const [exerciseError, setExerciseError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<LessonSort>("program");
  const [completionFilter, setCompletionFilter] =
    useState<CompletionFilter>("all");
  useEffect(() => {
    const onHistory = () => {
      setLocation(readLocation());
      setExerciseError("");
    };
    window.addEventListener("popstate", onHistory);
    return () => window.removeEventListener("popstate", onHistory);
  }, []);

  const gradeId = GRADES.some((item) => item.id === location.gradeId)
    ? location.gradeId
    : studentProfile.gradeId;
  const subject = subjects.find((item) => item.id === location.subjectId);
  const owned = Boolean(subject && canStudy(gradeId, subject.id));
  const validPublished = (item: Lesson) =>
    isPublishedInCurriculum(item, topics);
  const enrollment = primaryEnrollment;
  const ownedLabel = courseLabel(enrollment.gradeId, enrollment.subjectId);
  const courseTopics = owned
    ? topics.filter(
        (item) => item.gradeId === gradeId && item.subjectId === subject!.id,
      )
    : [];
  const courseLessons = owned
    ? lessons
        .filter(
          (item) =>
            item.gradeId === gradeId &&
            item.subjectId === subject!.id &&
            validPublished(item),
        )
        .sort((a, b) => a.order - b.order)
    : [];
  const topic = courseTopics.find((item) => item.id === location.topicId);
  const lesson = courseLessons.find(
    (item) =>
      item.id === location.lessonId &&
      (!location.topicId || item.topicId === location.topicId),
  );
  const lessonTopic = lesson
    ? courseTopics.find((item) => item.id === lesson.topicId)
    : undefined;
  const registeredLessons = lessons
    .filter(
      (item) => validPublished(item) && canStudy(item.gradeId, item.subjectId),
    )
    .sort((a, b) => a.order - b.order);
  const finishedCount = registeredLessons.filter((item) =>
    completedLessonIds.includes(item.id),
  ).length;
  const progress = registeredLessons.length
    ? Math.round((finishedCount / registeredLessons.length) * 100)
    : 0;
  const resumeLesson =
    registeredLessons.find((item) => !completedLessonIds.includes(item.id)) ||
    registeredLessons[0];
  const lessonAnswers = lesson ? answers[lesson.id] || {} : {};
  const checked = Boolean(lesson && checkedLessons[lesson.id]);
  const done = Boolean(lesson && completedLessonIds.includes(lesson.id));
  const correctCount =
    lesson?.exercises.filter(
      (item) => lessonAnswers[item.id] === item.correctIndex,
    ).length || 0;
  const answeredCount =
    lesson?.exercises.filter((item) => lessonAnswers[item.id] !== undefined)
      .length || 0;
  const allCorrect = Boolean(
    lesson &&
    lesson.exercises.length > 0 &&
    correctCount === lesson.exercises.length,
  );
  const nextLesson = lesson
    ? courseLessons[
        courseLessons.findIndex((item) => item.id === lesson.id) + 1
      ]
    : undefined;
  const stageIndex = stages.findIndex((item) => item.id === location.stage);
  const filteredLessons = courseLessons
    .filter((item) => {
      const completed = completedLessonIds.includes(item.id);
      const topicTitle =
        courseTopics.find((entry) => entry.id === item.topicId)?.title || "";
      return (
        (!topic || item.topicId === topic.id) &&
        (completionFilter === "all" ||
          (completionFilter === "completed" ? completed : !completed)) &&
        normalizeSearch(`${item.title} ${item.summary} ${topicTitle}`).includes(
          normalizeSearch(search.trim()),
        )
      );
    })
    .sort((a, b) =>
      sortBy === "duration"
        ? a.durationMinutes - b.durationMinutes || a.order - b.order
        : sortBy === "unfinished"
          ? Number(completedLessonIds.includes(a.id)) -
              Number(completedLessonIds.includes(b.id)) || a.order - b.order
          : a.order - b.order,
    );
  const relatedLessons = lesson
    ? [
        ...courseLessons.filter(
          (item) => item.id !== lesson.id && item.topicId === lesson.topicId,
        ),
        ...courseLessons.filter(
          (item) => item.id !== lesson.id && item.topicId !== lesson.topicId,
        ),
      ].slice(0, 3)
    : [];
  const {
    readingSurfaceRef,
    readerToolbarRef,
    readingPosition,
    activeSectionId,
    readingSections,
    jumpToSection,
  } = useReadingPosition(lesson, location.stage);

  useEffect(() => {
    setSearch("");
    setSortBy("program");
    setCompletionFilter("all");
  }, [gradeId, subject?.id]);

  function lessonLink(item: Lesson, stage: LessonStage = "theory") {
    return {
      href: lessonHref(item, stage),
      onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (ordinaryClick(event)) {
          event.preventDefault();
          openLesson(item, stage);
        }
      },
    };
  }
  function renderContents(label: string) {
    return (
      <nav aria-label={label} className="space-y-1">
        {readingSections.map((item, index) => (
          <a
            key={item.id}
            href={`#${encodeURIComponent(item.id)}`}
            onClick={(event) => jumpToSection(event, item.id)}
            aria-current={activeSectionId === item.id ? "location" : undefined}
            className={`flex min-h-11 items-start gap-2 rounded-xl px-3 py-3 text-sm leading-relaxed transition-colors ${activeSectionId === item.id ? "bg-surface-container-low font-semibold text-primary" : "text-on-surface-variant hover:bg-surface-container-low/70"}`}
          >
            <span className="mt-0.5 shrink-0 text-xs tabular-nums text-secondary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0">
              <AdaptiveText text={item.title} />
            </span>
          </a>
        ))}
      </nav>
    );
  }

  function go(next: Partial<LearningLocation>) {
    const destination: LearningLocation = {
      gradeId,
      subjectId: subject?.id || "",
      topicId: "",
      lessonId: "",
      stage: "theory",
      ...next,
    };
    const url = new URL(window.location.href);
    url.hash = "";
    ["grade", "subject", "topic", "lesson", "stage"].forEach((key) =>
      url.searchParams.delete(key),
    );
    url.searchParams.set("grade", destination.gradeId);
    if (destination.subjectId)
      url.searchParams.set("subject", destination.subjectId);
    if (destination.topicId) url.searchParams.set("topic", destination.topicId);
    if (destination.lessonId) {
      url.searchParams.set("lesson", destination.lessonId);
      url.searchParams.set("stage", destination.stage);
    }
    navigateTo(`${url.pathname}${url.search}${url.hash}`);
  }
  function openLesson(item: Lesson, stage: LessonStage = "theory") {
    if (!canStudy(item.gradeId, item.subjectId) || !validPublished(item))
      return;
    go({
      gradeId: item.gradeId,
      subjectId: item.subjectId,
      topicId: item.topicId,
      lessonId: item.id,
      stage,
    });
  }
  function checkExercises(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !lesson ||
      !canStudy(lesson.gradeId, lesson.subjectId) ||
      !validPublished(lesson) ||
      !lesson.exercises.length
    )
      return;
    if (answeredCount !== lesson.exercises.length) {
      setExerciseError(
        "Bạn hãy chọn một đáp án cho mỗi câu trước khi kiểm tra nhé.",
      );
      return;
    }
    setExerciseError("");
    setCheckedLessons((previous) => ({ ...previous, [lesson.id]: true }));
    if (allCorrect && completeLesson(lesson.id))
      onEarnGp(
        appConfig.rewards.lessonCompletionGp,
        `Hoàn thành bài học: ${lesson.title}`,
      );
  }
  function lessonCard(item: Lesson) {
    const completed = completedLessonIds.includes(item.id);
    const itemTopic = courseTopics.find((entry) => entry.id === item.topicId);
    return (
      <a
        key={item.id}
        {...lessonLink(item)}
        className="group flex h-full flex-col ui-learning-card p-5 text-left transition-colors hover:border-secondary/45 hover:bg-surface-container-low/25 sm:p-6"
      >
        {item.thumbnailUrl && (
          <div className="-mx-5 -mt-5 mb-5 overflow-hidden border-b border-ink-100 bg-surface-page sm:-mx-6 sm:-mt-6">
            <img
              src={item.thumbnailUrl}
              alt=""
              className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          </div>
        )}
        <div className="mb-4 flex items-center justify-between gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${completed ? "bg-secondary/10 text-secondary" : "bg-surface-container-low text-primary"}`}
          >
            <Icon
              name={
                completed
                  ? "check_circle"
                  : item.kind === "problem-type"
                    ? "edit_note"
                    : "auto_stories"
              }
            />
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${completed ? "bg-secondary/10 text-secondary" : "bg-surface-container-low text-on-surface-variant"}`}
          >
            {completed ? "Đã hoàn thành" : "Chưa hoàn thành"}
          </span>
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-secondary">
          <AdaptiveText text={itemTopic?.title || ""} />
        </p>
        <h3 className="text-lg font-bold leading-snug text-primary">
          <AdaptiveText text={item.title} />
        </h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-on-surface-variant">
          <AdaptiveText text={item.summary} />
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-outline-variant/70 pt-4 text-xs text-on-surface-variant">
          <span>{item.kind === "problem-type" ? "Dạng bài" : "Bài học"}</span>
          <span className="inline-flex items-center gap-1">
            <Icon name="schedule" className="text-base" />
            {item.durationMinutes} phút
          </span>
          <span>{item.exercises.length} bài tập</span>
          <Icon
            name="arrow_forward"
            className="ml-auto text-lg text-primary transition-transform group-hover:translate-x-1"
          />
        </div>
      </a>
    );
  }

  return (
    <div className="learning-os-page">
      {subject && (
        <>
          <StudentPageHeader
            eyebrow={lesson ? "Learning session" : topic ? "Topic path" : "Course path"}
            icon={lesson ? "auto_stories" : "route"}
            title={lesson?.title ?? topic?.title ?? `${subject.name} lớp ${gradeId}`}
            description={
              lesson?.summary ??
              topic?.description ??
              `Theo dõi mastery, chọn chủ đề và học theo nhịp phù hợp trong ${ownedLabel}.`
            }
            meta={
              <>
                <span className="rounded-full bg-surface-page px-3 py-1.5 text-xs font-semibold text-brand">
                  {subject.name} · Lớp {gradeId}
                </span>
                {lesson && (
                  <span className="rounded-full bg-accent/8 px-3 py-1.5 text-xs font-semibold text-accent-strong">
                    {stages[stageIndex]?.label ?? "Lý thuyết"}
                  </span>
                )}
              </>
            }
            actions={
              <Button
                variant="secondary"
                onClick={() => go({ subjectId: subject.id, topicId: "", lessonId: "" })}
              >
                <Icon name="route" />
                Về course path
              </Button>
            }
          />

          <StudentSignalStrip
            items={
              lesson
                ? [
                    { icon: "timer", label: "Thời lượng", value: `${lesson.durationMinutes} phút` },
                    { icon: "edit_note", label: "Bài tập", value: `${lesson.exercises.length} câu` },
                    { icon: "progress_activity", label: "Stage", value: stages[stageIndex]?.label ?? "Lý thuyết" },
                    { icon: done ? "verified" : "target", label: "Trạng thái", value: done ? "Đã hoàn thành" : "Đang học" },
                  ]
                : [
                    { icon: "account_tree", label: "Chủ đề", value: `${courseTopics.length} chủ đề` },
                    { icon: "auto_stories", label: "Learning objects", value: `${courseLessons.length} bài` },
                    { icon: "progress_activity", label: "Mastery", value: `${progress}%` },
                    { icon: "play_arrow", label: "Next", value: resumeLesson?.title ?? "Đã hoàn tất" },
                  ]
            }
          />
        </>
      )}

      {storageError && (
        <p
          role="alert"
          className="rounded-2xl bg-error-container p-4 text-sm text-on-error-container"
        >
          {storageError}
        </p>
      )}
      {subject && (
        <nav
          aria-label="Vị trí trong chương trình học"
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-on-surface-variant sm:text-sm"
        >
          <Button
            variant="surface"
            type="button"
            onClick={() => go({ subjectId: "" })}
            className="rounded-md py-1 hover:text-primary"
          >
            Khóa học
          </Button>
          <Icon name="chevron_right" className="text-base" />
          <Button
            variant="surface"
            type="button"
            onClick={() => go({ subjectId: "" })}
            className="rounded-md py-1 hover:text-primary"
          >
            Lớp {gradeId}
          </Button>
          <Icon name="chevron_right" className="text-base" />
          {lesson || topic ? (
            <Button
              variant="surface"
              type="button"
              onClick={() => go({ subjectId: subject.id })}
              className="rounded-md py-1 hover:text-primary"
            >
              {subject.name}
            </Button>
          ) : (
            <span aria-current="page" className="font-semibold text-primary">
              {subject.name}
            </span>
          )}
          {(lessonTopic || topic) && (
            <>
              <Icon name="chevron_right" className="text-base" />
              {lesson ? (
                <Button
                  variant="surface"
                  type="button"
                  onClick={() => go({ topicId: lessonTopic!.id })}
                  className="rounded-md py-1 text-left hover:text-primary"
                >
                  <AdaptiveText text={lessonTopic!.title} />
                </Button>
              ) : (
                <span
                  aria-current="page"
                  className="font-semibold text-primary"
                >
                  <AdaptiveText text={topic!.title} />
                </span>
              )}
            </>
          )}
          {lesson && (
            <>
              <Icon name="chevron_right" className="text-base" />
              <span aria-current="page" className="font-semibold text-primary">
                {lesson.kind === "problem-type" ? "Dạng bài" : "Bài học"}
              </span>
            </>
          )}
        </nav>
      )}
      {location.lessonId && !lesson && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-low p-4 text-sm text-on-surface-variant"
        >
          <Icon name="lock" className="shrink-0 text-primary" />
          <p>
            Bài học này chưa được phát hành, không còn tồn tại hoặc không thuộc
            khóa bạn đã đăng ký. Hãy chọn một bài học hiện có bên dưới.
          </p>
        </div>
      )}

      {!subject && (
        <>
          <header>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-secondary">
              Học tập theo chương trình
            </p>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-primary sm:text-3xl">
              Vững kiến thức. Vững bước mỗi ngày.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
              Từ lý thuyết đến bài tập, mỗi bài học là một bước tiến nhỏ trên
              hành trình của bạn.
            </p>
          </header>
          <section
            className="grid overflow-hidden rounded-3xl border border-secondary/15 bg-secondary/8 lg:grid-cols-[1.5fr_1fr]"
            aria-labelledby="registered-course-title"
          >
            <div className="p-6 sm:p-7">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-secondary">
                <Icon name="verified" className="text-base" />
                Khóa học đã đăng ký
              </span>
              <h2
                id="registered-course-title"
                className="mt-4 text-2xl font-bold text-primary"
              >
                {ownedLabel}
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-on-surface-variant">
                Nắm chắc kiến thức nền, luyện từng dạng toán và tự tin chinh
                phục mục tiêu học tập.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-on-surface-variant">
                <span className="inline-flex items-center gap-1">
                  <Icon name="account_tree" className="text-base" />
                  {
                    topics.filter((item) =>
                      canStudy(item.gradeId, item.subjectId),
                    ).length
                  }{" "}
                  chủ đề
                </span>
                <span className="inline-flex items-center gap-1">
                  <Icon name="auto_stories" className="text-base" />
                  {registeredLessons.length} bài học & dạng bài
                </span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {resumeLesson && (
                  <Button
                    variant="primary"
                    type="button"
                    onClick={() => openLesson(resumeLesson)}
                  >
                    <Icon name="play_arrow" className="text-lg" />
                    {finishedCount === registeredLessons.length
                      ? "Ôn lại bài học"
                      : "Tiếp tục học"}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() =>
                    go({
                      gradeId: enrollment.gradeId,
                      subjectId: enrollment.subjectId,
                    })
                  }
                >
                  Xem chương trình
                  <Icon name="arrow_forward" className="text-lg" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col justify-center border-t border-secondary/10 p-6 sm:p-7 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-on-surface">
                  Hành trình của bạn
                </span>
                <span className="text-3xl font-bold text-primary">
                  {progress}
                  <span className="text-base">%</span>
                </span>
              </div>
              <Progress value={progress} label="Tiến độ khóa học đã đăng ký" tone="accent" className="mt-4 h-2 bg-white" />
              <p className="mt-3 text-xs text-on-surface-variant">
                Đã hoàn thành {finishedCount}/{registeredLessons.length} bài học
              </p>
              {resumeLesson && (
                <div className="mt-5 rounded-2xl bg-white/80 p-4">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-secondary">
                    {finishedCount === registeredLessons.length
                      ? "Gợi ý ôn tập"
                      : "Bài học tiếp theo"}
                  </p>
                  <p className="text-sm font-semibold leading-relaxed text-primary">
                    <AdaptiveText text={resumeLesson.title} />
                  </p>
                  <p className="mt-2 text-xs text-on-surface-variant">
                    {resumeLesson.durationMinutes} phút · Lý thuyết, ví dụ và
                    bài tập
                  </p>
                </div>
              )}
            </div>
          </section>
          <section aria-labelledby="catalog-title">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2
                  id="catalog-title"
                  className="text-xl font-bold text-primary"
                >
                  Khám phá chương trình học
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Chọn lớp, chọn môn và bắt đầu từ nền tảng.
                </p>
              </div>
              <p className="text-xs text-on-surface-variant">
                Tài khoản mẫu đã đăng ký {ownedLabel}
              </p>
            </div>
            <div
              aria-label="Chọn khối lớp"
              className="mb-5 flex flex-wrap gap-2"
            >
              {GRADES.map((grade) => (
                <Button
                  variant="surface"
                  key={grade.id}
                  type="button"
                  onClick={() => go({ gradeId: grade.id, subjectId: "" })}
                  aria-pressed={gradeId === grade.id}
                  className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${gradeId === grade.id ? "border-primary bg-primary text-white" : "border-outline-variant/45 bg-white text-on-surface-variant hover:border-primary/50 hover:text-primary"}`}
                >
                  {grade.label}
                </Button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {subjects.map((item) => {
                const enrolled = canStudy(gradeId, item.id);
                const count = enrolled
                  ? lessons.filter(
                      (entry) =>
                        entry.gradeId === gradeId &&
                        entry.subjectId === item.id &&
                        validPublished(entry),
                    ).length
                  : 0;
                return (
                  <Button
                    variant="surface"
                    type="button"
                    key={item.id}
                    onClick={() => go({ subjectId: item.id })}
                    className={`group flex flex-col rounded-2xl border bg-white p-5 text-left transition-colors hover:border-primary/50 ${enrolled ? "border-secondary/35" : "border-outline-variant/40"}`}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${enrolled ? "bg-secondary/10 text-secondary" : "bg-surface-container-low text-primary"}`}
                      >
                        <Icon name={item.icon} />
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${enrolled ? "bg-secondary/10 text-secondary" : "bg-surface-container-low text-on-surface-variant"}`}
                      >
                        <Icon
                          name={enrolled ? "check_circle" : "lock"}
                          className="text-sm"
                        />
                        {enrolled ? "Đã đăng ký" : "Chưa đăng ký"}
                      </span>
                    </div>
                    <span className="mt-5 block text-lg font-bold text-primary">
                      {item.name} {gradeId}
                    </span>
                    <span className="mt-2 flex-1 text-sm leading-relaxed text-on-surface-variant">
                      {item.description}
                    </span>
                    <span className="mt-5 flex w-full items-center justify-between border-t border-outline-variant/30 pt-4 text-xs font-semibold text-primary">
                      <span>
                        {enrolled
                          ? `${count} bài học · Vào học`
                          : "Thông tin khóa học"}
                      </span>
                      <Icon
                        name="arrow_forward"
                        className="text-lg transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </Button>
                );
              })}
            </div>
          </section>
        </>
      )}

      {subject && !owned && (
        <section className="rounded-3xl border border-outline-variant/40 bg-white p-6 text-center sm:p-12">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-low text-primary">
            <Icon name={subject.icon} className="text-3xl" />
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-widest text-secondary">
            {subject.name} · Lớp {gradeId}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-primary">
            Khóa học chưa được đăng ký
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-on-surface-variant">
            {subject.description} Tài khoản mẫu của bạn hiện chỉ có quyền học{" "}
            {ownedLabel}. Nội dung của môn học này sẽ hiển thị khi tài khoản
            được cấp quyền truy cập.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              variant="primary"
              type="button"
              onClick={() =>
                go({
                  gradeId: enrollment.gradeId,
                  subjectId: enrollment.subjectId,
                })
              }
            >
              Về khóa {ownedLabel}
              <Icon name="arrow_forward" className="text-lg" />
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => go({ subjectId: "" })}
            >
              Xem các môn học
            </Button>
          </div>
          <p className="mt-5 text-xs text-on-surface-variant">
            Bản trải nghiệm chưa hỗ trợ đăng ký hoặc thanh toán khóa học.
          </p>
        </section>
      )}

      {owned && !lesson && (
        <>
          <header className="flex flex-wrap items-end justify-between gap-4 ui-learning-card p-6 sm:p-8">
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-secondary">
                Chương trình đã đăng ký
              </p>
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-primary sm:text-3xl">
                {subject!.name} lớp {gradeId}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                Học theo từng chủ đề. Hiểu lý thuyết, theo dõi ví dụ và tự mình
                thực hành.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-xs font-semibold text-secondary">
              <Icon name="verified" className="text-lg" />
              {
                courseLessons.filter((item) =>
                  completedLessonIds.includes(item.id),
                ).length
              }
              /{courseLessons.length} bài đã hoàn thành
            </span>
          </header>
          <section
            aria-label="Lọc chương trình học"
            className="ui-learning-card p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-0 basis-full sm:flex-1 sm:basis-auto">
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl text-outline"
                />
                <Input
                  type="search"
                  aria-label="Tìm bài học"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm bài học, dạng bài, từ khóa…"
                  className="pl-10 pr-11"
                />
                {search && (
                  <Button
                    variant="surface"
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Xóa từ khóa"
                    className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
                  >
                    <Icon name="close" className="text-lg" />
                  </Button>
                )}
              </div>
              <label className="flex min-w-0 basis-full items-center gap-2 text-xs text-on-surface-variant sm:basis-auto sm:flex-none">
                Sắp xếp
                <Select
                  aria-label="Sắp xếp"
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as LessonSort)
                  }
                  variant="pill"
                  className="min-w-0 flex-1"
                >
                  <option value="program">Theo chương trình</option>
                  <option value="duration">Thời lượng ngắn</option>
                  <option value="unfinished">Chưa học trước</option>
                </Select>
              </label>
              <label className="flex min-w-0 basis-full items-center gap-2 text-xs text-on-surface-variant sm:basis-auto sm:flex-none">
                Tiến độ
                <Select
                  aria-label="Tiến độ"
                  value={completionFilter}
                  onChange={(event) =>
                    setCompletionFilter(event.target.value as CompletionFilter)
                  }
                  variant="pill"
                  className="min-w-0 flex-1"
                >
                  <option value="all">Tất cả</option>
                  <option value="unfinished">Chưa hoàn thành</option>
                  <option value="completed">Đã hoàn thành</option>
                </Select>
              </label>
            </div>
            <div
              role="group"
              aria-label="Chọn chủ đề"
              className="mt-4 flex gap-2 overflow-x-auto border-t border-outline-variant/70 pt-4 pb-1 lg:flex-wrap"
            >
              <Button
                variant="surface"
                type="button"
                aria-pressed={!topic}
                onClick={() => go({ subjectId: subject!.id })}
                className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-xs font-semibold ${!topic ? "border-primary bg-primary text-white" : "border-outline-variant bg-white text-on-surface-variant hover:border-primary/40"}`}
              >
                Tất cả chủ đề
              </Button>
              {courseTopics.map((item) => (
                <Button
                  variant="surface"
                  key={item.id}
                  type="button"
                  aria-pressed={topic?.id === item.id}
                  onClick={() => go({ topicId: item.id })}
                  className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-xs font-semibold ${topic?.id === item.id ? "border-secondary/30 bg-secondary/10 text-secondary" : "border-outline-variant bg-white text-on-surface-variant hover:border-primary/40"}`}
                >
                  <AdaptiveText text={item.title} />
                </Button>
              ))}
            </div>
          </section>
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
            <section className="min-w-0" aria-labelledby="course-lessons-title">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-secondary">
                    {topic ? "Chủ đề đang học" : "Nội dung khóa học"}
                  </p>
                  <h2
                    id="course-lessons-title"
                    className="text-xl font-bold text-primary"
                  >
                    <AdaptiveText text={topic?.title || "Bài học & dạng bài"} />
                  </h2>
                  {topic && (
                    <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                      <AdaptiveText text={topic.description} />
                    </p>
                  )}
                </div>
                <p
                  role="status"
                  className="text-xs tabular-nums text-on-surface-variant"
                >
                  {filteredLessons.length} / {courseLessons.length} bài học
                </p>
              </div>
              {filteredLessons.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredLessons.map(lessonCard)}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-outline-variant bg-white px-6 py-10 text-center">
                  <Icon
                    name="search_off"
                    className="mb-3 text-4xl text-outline"
                  />
                  <h3 className="text-lg font-bold text-primary">
                    Không tìm thấy bài học phù hợp
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-on-surface-variant">
                    Thử một từ khóa ngắn hơn hoặc xem lại bộ lọc chủ đề và tiến
                    độ.
                  </p>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setCompletionFilter("all");
                      setSortBy("program");
                      go({ subjectId: subject!.id });
                    }}
                    className="mt-5"
                  >
                    <Icon name="restart_alt" className="text-lg" />
                    Xóa bộ lọc
                  </Button>
                </div>
              )}
            </section>
            <aside className="space-y-5">
              <section className="ui-learning-card p-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-secondary">
                  Học theo nhịp của bạn
                </p>
                <h2 className="text-lg font-bold text-primary">
                  Mỗi bài, ba bước
                </h2>
                <ol className="mt-4 space-y-4">
                  {stages.map((item, index) => (
                    <li key={item.id} className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                          {index === 0
                            ? "Nắm kiến thức và điều kiện áp dụng."
                            : index === 1
                              ? "Theo dõi cách làm qua từng bước."
                              : "Tự thực hành và kiểm tra kết quả."}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
              {resumeLesson && (
                <section className="rounded-3xl border border-secondary/15 bg-secondary/8 p-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-secondary">
                    Gợi ý học tiếp
                  </p>
                  <a {...lessonLink(resumeLesson)} className="group block">
                    <h2 className="text-base font-bold leading-relaxed text-primary">
                      <AdaptiveText text={resumeLesson.title} />
                    </h2>
                    <p className="mt-2 text-xs text-on-surface-variant">
                      {resumeLesson.durationMinutes} phút ·{" "}
                      {resumeLesson.exercises.length} bài tập
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary">
                      Vào bài học
                      <Icon
                        name="arrow_forward"
                        className="text-lg transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </a>
                </section>
              )}
            </aside>
          </div>
        </>
      )}

      {lesson && (
        <>
          <header className="ui-learning-card p-6 sm:p-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
                {lesson.kind === "problem-type" ? "Dạng bài" : "Bài học"} ·{" "}
                {subject!.name} {gradeId}
              </span>
              {done && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
                  <Icon name="check_circle" className="text-base" />
                  Đã hoàn thành
                </span>
              )}
            </div>
            <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight text-primary sm:text-4xl">
              <AdaptiveText text={lesson.title} />
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-on-surface-variant">
              <AdaptiveText text={lesson.summary} />
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-on-surface-variant">
              <span className="inline-flex items-center gap-1">
                <Icon name="schedule" className="text-base" />
                {lesson.durationMinutes} phút học tập
              </span>
              <span className="inline-flex items-center gap-1">
                <Icon name="edit_note" className="text-base" />
                {lesson.exercises.length} bài tập vận dụng
              </span>
              <span className="inline-flex items-center gap-1">
                <Icon name="stars" className="text-base text-secondary" />
                {done
                  ? "Đã ghi nhận tiến độ"
                  : "Thưởng GP khi hoàn thành lần đầu"}
              </span>
            </div>
          </header>
          <div
            ref={readerToolbarRef}
            className="sticky top-[var(--header-h)] z-30 overflow-hidden ui-card rounded-2xl/95 shadow-sm backdrop-blur-sm"
          >
            <nav
              aria-label="Các bước của bài học"
              className="grid grid-cols-3 p-2"
            >
              {stages.map((item, index) => (
                <Button
                  variant="surface"
                  key={item.id}
                  type="button"
                  onClick={() => openLesson(lesson, item.id)}
                  aria-current={location.stage === item.id ? "step" : undefined}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-xs font-bold transition-colors sm:flex-row sm:gap-2 sm:text-sm ${location.stage === item.id ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:bg-white"}`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${location.stage === item.id ? "bg-white/20" : "bg-surface-container"}`}
                  >
                    {index + 1}
                  </span>
                  {item.title}
                </Button>
              ))}
            </nav>
            <div className="flex items-center justify-between gap-3 border-t border-outline-variant/60 px-4 py-2 text-xs text-on-surface-variant">
              <span>Vị trí đọc · {stages[stageIndex].title}</span>
              <span className="tabular-nums">{readingPosition}%</span>
            </div>
            <Progress value={readingPosition} label="Vị trí đọc trong phần hiện tại" tone="accent" className="h-0.5 rounded-none" />
          </div>
          <details className="ui-card rounded-2xl p-4 xl:hidden">
            <summary className="cursor-pointer text-sm font-bold text-primary">
              Trong phần này · {readingSections.length} mục
            </summary>
            <div className="mt-3">
              {renderContents("Mục lục trên điện thoại")}
            </div>
          </details>
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="min-w-0 ui-learning-card">
              <div ref={readingSurfaceRef} className="p-5 sm:p-7 lg:p-8">
                {location.stage === "theory" && (
                  <section aria-labelledby="lesson-theory-title">
                    <div className="mb-6 flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                        <Icon name="menu_book" />
                      </span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-secondary">
                          Bước 01
                        </p>
                        <h2
                          id="lesson-theory-title"
                          className="text-lg font-bold text-primary"
                        >
                          Nắm vững kiến thức
                        </h2>
                      </div>
                    </div>
                    <div className="mb-7 rounded-2xl border border-outline-variant bg-background p-5">
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-secondary">
                        Nội dung cần nắm
                      </h3>
                      <ul className="space-y-2">
                        {lesson.theory.map((block, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm leading-relaxed text-on-surface-variant"
                          >
                            <span className="font-semibold text-secondary">
                              {String(index + 1).padStart(2, "0")}.
                            </span>
                            <AdaptiveText text={block.heading} />
                          </li>
                        ))}
                      </ul>
                    </div>
                    {lesson.contentBlocks?.length ? (
                      <LessonContentRenderer blocks={lesson.contentBlocks} />
                    ) : (
                      <div className="space-y-8">
                        {lesson.theory.map((block, index) => (
                          <section
                            key={`${lesson.id}-theory-${index}`}
                            id={readingSections[index]?.id}
                            tabIndex={-1}
                            className="scroll-mt-48 border-b border-outline-variant/70 pb-7 last:border-b-0 last:pb-0"
                          >
                            <h3 className="mb-3 flex items-start gap-2 text-base font-bold text-on-surface">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs text-secondary">
                                {index + 1}
                              </span>
                              <AdaptiveText text={block.heading} />
                            </h3>
                            <div className="overflow-x-auto whitespace-pre-wrap text-base leading-[1.9] text-on-surface-variant">
                              <AdaptiveText text={block.text} />
                            </div>
                          </section>
                        ))}
                      </div>
                    )}
                    <div className="mt-6 flex items-start gap-3 rounded-xl bg-secondary/8 p-4">
                      <Icon
                        name="tips_and_updates"
                        className="shrink-0 text-secondary"
                      />
                      <p className="text-sm leading-relaxed text-on-surface-variant">
                        Đọc chậm các điều kiện áp dụng. Ở bước tiếp theo, bạn sẽ
                        thấy cách đưa kiến thức vào một tình huống cụ thể.
                      </p>
                    </div>
                  </section>
                )}
                {location.stage === "examples" && (
                  <section aria-labelledby="lesson-examples-title">
                    <div className="mb-6 flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                        <Icon name="lightbulb" />
                      </span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-secondary">
                          Bước 02
                        </p>
                        <h2
                          id="lesson-examples-title"
                          className="text-lg font-bold text-primary"
                        >
                          Hiểu cách giải qua ví dụ
                        </h2>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {lesson.examples.map((example, index) => (
                        <article
                          key={`${lesson.id}-example-${index}`}
                          id={readingSections[index]?.id}
                          tabIndex={-1}
                          className="scroll-mt-48 overflow-hidden rounded-2xl border border-outline-variant/40"
                        >
                          <div className="bg-surface-container-low/50 p-4 sm:p-5">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-secondary">
                              Ví dụ {index + 1}
                            </p>
                            <h3 className="text-base font-bold text-primary">
                              <AdaptiveText text={example.title} />
                            </h3>
                            <div className="mt-3 overflow-x-auto whitespace-pre-wrap text-base leading-relaxed text-on-surface">
                              <AdaptiveText text={example.prompt} />
                            </div>
                          </div>
                          <details open={index === 0}>
                            <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-primary marker:text-secondary">
                              Xem lời giải từng bước
                            </summary>
                            <div className="space-y-4 px-4 pb-5 sm:px-5">
                              {example.steps.map((step, stepIndex) => (
                                <div
                                  key={stepIndex}
                                  className="flex items-start gap-3"
                                >
                                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-xs font-bold text-primary">
                                    {stepIndex + 1}
                                  </span>
                                  <div className="min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap text-base leading-[1.8] text-on-surface-variant">
                                    <AdaptiveText text={step} />
                                  </div>
                                </div>
                              ))}
                              <div className="rounded-xl bg-secondary/10 p-4">
                                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-secondary">
                                  Kết luận
                                </p>
                                <div className="overflow-x-auto text-base font-semibold leading-relaxed text-on-surface">
                                  <AdaptiveText text={example.answer} />
                                </div>
                              </div>
                            </div>
                          </details>
                        </article>
                      ))}
                    </div>
                    {!lesson.examples.length && (
                      <p className="text-sm text-on-surface-variant">
                        Ví dụ cho bài học này đang được cập nhật.
                      </p>
                    )}
                  </section>
                )}
                {location.stage === "exercises" && (
                  <section aria-labelledby="lesson-exercises-title">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                          <Icon name="edit_note" />
                        </span>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-secondary">
                            Bước 03
                          </p>
                          <h2
                            id="lesson-exercises-title"
                            className="text-lg font-bold text-primary"
                          >
                            Đến lượt bạn thử sức
                          </h2>
                        </div>
                      </div>
                      <span className="rounded-full bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface-variant">
                        Đã chọn {answeredCount}/{lesson.exercises.length} câu
                      </span>
                    </div>
                    <p className="mb-5 text-sm leading-relaxed text-on-surface-variant">
                      Chọn đáp án và kiểm tra kết quả. Trả lời đúng tất cả các
                      câu để hoàn thành bài học.
                    </p>
                    <form onSubmit={checkExercises} className="space-y-6">
                      {lesson.exercises.map((exercise, index) => {
                        const chosen = lessonAnswers[exercise.id];
                        const isCorrect = chosen === exercise.correctIndex;
                        return (
                          <fieldset
                            key={exercise.id}
                            id={readingSections[index]?.id}
                            tabIndex={-1}
                            className="scroll-mt-48 min-w-0 rounded-2xl border border-outline-variant/40 p-4 sm:p-5"
                          >
                            <legend className="px-2 text-xs font-bold uppercase tracking-wider text-secondary">
                              Câu {index + 1}
                            </legend>
                            <div className="mb-4 overflow-x-auto whitespace-pre-wrap text-base font-semibold leading-[1.8] text-on-surface">
                              <AdaptiveText text={exercise.prompt} />
                            </div>
                            <div className="space-y-2">
                              {exercise.options.map((option, optionIndex) => (
                                <label
                                  key={optionIndex}
                                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-base transition-colors ${chosen === optionIndex ? (checked ? (isCorrect ? "border-secondary/60 bg-secondary/8" : "border-error/40 bg-error-container/40") : "border-primary/60 bg-surface-container-low") : "border-outline-variant/40 hover:border-primary/40 hover:bg-surface-container-low/30"}`}
                                >
                                  <Input
                                    type="radio"
                                    name={`${lesson.id}-${exercise.id}`}
                                    value={optionIndex}
                                    checked={chosen === optionIndex}
                                    onChange={() => {
                                      setAnswers((previous) => ({
                                        ...previous,
                                        [lesson.id]: {
                                          ...previous[lesson.id],
                                          [exercise.id]: optionIndex,
                                        },
                                      }));
                                      setCheckedLessons((previous) => ({
                                        ...previous,
                                        [lesson.id]: false,
                                      }));
                                      setExerciseError("");
                                    }}
                                    className="mt-1 shrink-0"
                                  />
                                  <span className="shrink-0 font-bold text-primary">
                                    {String.fromCharCode(65 + optionIndex)}.
                                  </span>
                                  <span className="min-w-0 flex-1 overflow-x-auto leading-relaxed text-on-surface">
                                    <AdaptiveText text={option} />
                                  </span>
                                </label>
                              ))}
                            </div>
                            {checked && (
                              <div
                                role="status"
                                className={`mt-4 rounded-xl p-4 text-sm ${isCorrect ? "bg-secondary/8" : "bg-error-container/40"}`}
                              >
                                <p
                                  className={`mb-2 flex items-center gap-1.5 font-bold ${isCorrect ? "text-secondary" : "text-error"}`}
                                >
                                  <Icon
                                    name={isCorrect ? "check_circle" : "info"}
                                    className="text-lg"
                                  />
                                  {isCorrect
                                    ? "Chính xác!"
                                    : "Chưa đúng, hãy thử lại nhé."}
                                </p>
                                <div className="overflow-x-auto leading-relaxed text-on-surface-variant">
                                  <AdaptiveText text={exercise.explanation} />
                                </div>
                              </div>
                            )}
                          </fieldset>
                        );
                      })}
                      {exerciseError && (
                        <p role="alert" className="text-sm text-error">
                          {exerciseError}
                        </p>
                      )}
                      {checked && (
                        <div
                          role="status"
                          className={`rounded-2xl p-5 ${allCorrect ? "bg-secondary/10" : "bg-surface-container-low"}`}
                        >
                          <p
                            className={`flex items-center gap-2 text-base font-bold ${allCorrect ? "text-secondary" : "text-primary"}`}
                          >
                            <Icon
                              name={allCorrect ? "celebration" : "auto_awesome"}
                            />
                            {allCorrect
                              ? "Bạn đã hoàn thành bài học!"
                              : `Bạn đã trả lời đúng ${correctCount}/${lesson.exercises.length} câu`}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                            {allCorrect
                              ? "Tiến độ đã được ghi nhận. Bạn có thể ôn lại bất cứ lúc nào; phần thưởng chỉ được tính một lần cho mỗi bài."
                              : "Xem phần giải thích, đối chiếu lại kiến thức rồi chọn lại những câu chưa đúng."}
                          </p>
                        </div>
                      )}
                      {lesson.exercises.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          <Button variant="primary" type="submit">
                            <Icon name="task_alt" className="text-lg" />
                            {checked ? "Kiểm tra lại" : "Kiểm tra & hoàn thành"}
                          </Button>
                          {done && nextLesson && (
                            <Button
                              variant="secondary"
                              type="button"
                              onClick={() => openLesson(nextLesson)}
                            >
                              Bài học tiếp theo
                              <Icon name="arrow_forward" className="text-lg" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <p className="rounded-xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                          Bài tập đang được bổ sung. Tiến độ sẽ được ghi nhận
                          khi bạn hoàn thành các bài tập được phát hành.
                        </p>
                      )}
                    </form>
                  </section>
                )}
                <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/40 pt-5">
                  {stageIndex > 0 ? (
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() =>
                        openLesson(lesson, stages[stageIndex - 1].id)
                      }
                      className="gap-2"
                    >
                      <Icon name="arrow_back" className="text-lg" />
                      {stages[stageIndex - 1].title}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => go({ topicId: lesson.topicId })}
                      className="gap-2"
                    >
                      <Icon name="arrow_back" className="text-lg" />
                      Về chủ đề
                    </Button>
                  )}
                  {stageIndex < stages.length - 1 && (
                    <Button
                      variant="primary"
                      type="button"
                      onClick={() =>
                        openLesson(lesson, stages[stageIndex + 1].id)
                      }
                    >
                      {stages[stageIndex + 1].title}
                      <Icon name="arrow_forward" className="text-lg" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <aside className="space-y-5 xl:sticky xl:top-44 xl:max-h-[calc(100dvh-12rem)] xl:overflow-y-auto xl:pr-1">
              <section className="hidden ui-learning-card p-5 xl:block">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-secondary">
                  {stages[stageIndex].title}
                </p>
                <h2 className="mb-3 text-base font-bold text-primary">
                  Trong phần này
                </h2>
                {renderContents("Mục lục bài học")}
                <p className="mt-4 border-t border-outline-variant/70 pt-3 text-xs leading-relaxed text-on-surface-variant">
                  Vị trí đọc giúp bạn theo dõi nội dung. Hoàn thành bài tập để
                  ghi nhận tiến độ học.
                </p>
              </section>
              {relatedLessons.length > 0 && (
                <section className="ui-learning-card p-5">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-secondary">
                    Tiếp nối kiến thức
                  </p>
                  <h2 className="mb-3 text-base font-bold text-primary">
                    Bài học trong khóa
                  </h2>
                  <div className="divide-y divide-outline-variant/70">
                    {relatedLessons.map((item) => (
                      <a
                        key={item.id}
                        {...lessonLink(item)}
                        className="group flex min-h-11 items-start gap-2 py-4"
                      >
                        <Icon
                          name={
                            completedLessonIds.includes(item.id)
                              ? "check_circle"
                              : "auto_stories"
                          }
                          className="mt-0.5 shrink-0 text-lg text-secondary"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold leading-relaxed text-primary group-hover:underline">
                            <AdaptiveText text={item.title} />
                          </span>
                          <span className="mt-1 block text-xs text-on-surface-variant">
                            {item.durationMinutes} phút ·{" "}
                            {completedLessonIds.includes(item.id)
                              ? "Đã hoàn thành"
                              : "Chưa hoàn thành"}
                          </span>
                        </span>
                      </a>
                    ))}
                  </div>
                  <Button
                    variant="surface"
                    type="button"
                    onClick={() => go({ subjectId: subject!.id })}
                    className="mt-3 min-h-11 rounded-lg py-2 text-xs font-semibold text-primary hover:underline"
                  >
                    Xem toàn bộ chương trình →
                  </Button>
                </section>
              )}
              {lesson.gradeId === "9" && lesson.subjectId === "toan" && (
                <section className="rounded-3xl bg-secondary/8 p-5">
                  <Icon name="psychology" className="text-3xl text-secondary" />
                  <h2 className="mt-2 text-sm font-bold text-primary">
                    Muốn luyện thêm?
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
                    Mở không gian Tự giải để thực hành từng bước và củng cố cách
                    tư duy.
                  </p>
                  <Button
                    variant="surface"
                    type="button"
                    onClick={() => onNavigate("tu-giai")}
                    className="mt-3 inline-flex min-h-11 items-center gap-1 rounded-lg py-2 text-xs font-bold text-primary hover:underline"
                  >
                    Đến không gian Tự giải
                    <Icon name="arrow_forward" className="text-base" />
                  </Button>
                </section>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
};
