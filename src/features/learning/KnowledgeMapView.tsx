import { Button, Icon, Progress } from "../../components/ui";
import { useCurriculum } from "../../context/CurriculumContext";
import { routePath } from "../../config/routes";
import {
  courseHref,
  ownedPublishedLessons,
  primaryEnrollment,
  studentProfile,
} from "../curriculum";
import { TheoryLessonsView } from "./TheoryLessonsView";

interface KnowledgeMapViewProps {
  onNavigate: (path: string) => void;
  onEarnGp: (amount: number, reason: string) => void;
}

const positions = [
  { left: "18%", top: "34%" },
  { left: "48%", top: "20%" },
  { left: "77%", top: "44%" },
  { left: "50%", top: "72%" },
];

export function KnowledgeMapView({
  onNavigate,
  onEarnGp,
}: KnowledgeMapViewProps) {
  const params = new URLSearchParams(window.location.search);
  if (params.has("topic") || params.has("lesson")) {
    return <TheoryLessonsView onNavigate={onNavigate} onEarnGp={onEarnGp} />;
  }

  const { subjects, topics, lessons, completedLessonIds, contentSource } =
    useCurriculum();

  const requestedSubjectId = params.get("subject");
  const enrolledCourses = studentProfile.enrollments;
  const enrollment =
    enrolledCourses.find(
      (item) =>
        item.subjectId === requestedSubjectId &&
        subjects.some((subject) => subject.id === item.subjectId),
    ) ?? primaryEnrollment;

  const subject =
    subjects.find((item) => item.id === enrollment.subjectId) ??
    subjects.find((item) => item.id === primaryEnrollment.subjectId)!;

  const enrolledSubjects = enrolledCourses
    .map((course) => ({
      course,
      subject: subjects.find((item) => item.id === course.subjectId),
    }))
    .filter((item) => Boolean(item.subject));

  const courseTopics = topics.filter(
    (topic) =>
      topic.gradeId === enrollment.gradeId &&
      topic.subjectId === enrollment.subjectId,
  );
  const courseLessons = ownedPublishedLessons(lessons, topics).filter(
    (lesson) =>
      lesson.gradeId === enrollment.gradeId &&
      lesson.subjectId === enrollment.subjectId,
  );
  const nextLesson =
    courseLessons.find((lesson) => !completedLessonIds.includes(lesson.id)) ??
    courseLessons[0];
  const currentTopicId = nextLesson?.topicId;

  const nodes = courseTopics.map((topic, index) => {
    const topicLessons = courseLessons.filter(
      (lesson) => lesson.topicId === topic.id,
    );
    const completed = topicLessons.filter((lesson) =>
      completedLessonIds.includes(lesson.id),
    ).length;
    const mastery = topicLessons.length
      ? Math.round((completed / topicLessons.length) * 100)
      : 0;
    const state =
      mastery === 100
        ? "mastered"
        : topic.id === currentTopicId
          ? "current"
          : mastery === 0
            ? "gap"
            : "current";

    return {
      ...topic,
      mastery,
      state,
      position: positions[index % positions.length],
      lessonCount: topicLessons.length,
    };
  });

  const totalMastery = nodes.length
    ? Math.round(
        nodes.reduce((sum, node) => sum + node.mastery, 0) / nodes.length,
      )
    : 0;
  const priority =
    nodes.find((node) => node.id === currentTopicId) ??
    nodes.find((node) => node.mastery < 100) ??
    nodes[0];

  const openTopic = (topicId: string) => {
    onNavigate(courseHref(enrollment.gradeId, enrollment.subjectId, topicId));
  };

  const chooseSubject = (subjectId: string) => {
    const query = new URLSearchParams({ subject: subjectId });
    onNavigate(routePath("hoc-bai") + "?" + query.toString());
  };

  return (
    <div className="learning-os-page">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="signal-label">
            <Icon name="route" />
            Knowledge Universe · {contentSource === "database" ? "Live DB" : "Fallback"}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-[-0.04em] text-brand sm:text-5xl">
            Kiến thức là một mạng lưới, không phải danh sách chương.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-600">
            Mỗi môn có cách học riêng. Toán có thể dùng công thức và đồ thị;
            Tiếng Anh ưu tiên tình huống, hình ảnh, từ vựng và hội thoại.
          </p>
        </div>

        <div className="w-full max-w-xs rounded-3xl border border-ink-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-ink-600">Mastery toàn môn</span>
            <strong className="text-2xl text-brand">{totalMastery}%</strong>
          </div>
          <Progress
            value={totalMastery}
            label="Mastery toàn môn"
            tone="accent"
            className="mt-3 h-2"
          />
          <p className="mt-3 text-xs leading-5 text-ink-500">
            {subject.name} · Lớp {enrollment.gradeId}
          </p>
        </div>
      </header>

      <section
        aria-label="Môn học đã đăng ký"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {enrolledSubjects.map((entry) => {
          const option = entry.subject!;
          const active = option.id === subject.id;
          return (
            <Button
              key={option.id}
              variant="surface"
              onClick={() => chooseSubject(option.id)}
              aria-pressed={active}
              className={
                active
                  ? "group overflow-hidden rounded-3xl border border-accent p-0 text-left shadow-card ring-4 ring-accent/10"
                  : "group overflow-hidden rounded-3xl border border-ink-200 bg-white p-0 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/25"
              }
            >
              <div className="h-32 overflow-hidden bg-surface-page">
                {option.cardImageUrl ? (
                  <img
                    src={option.cardImageUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl text-brand">
                    <Icon name={option.icon} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 p-4">
                <span
                  className={
                    active
                      ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white"
                      : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/8 text-brand"
                  }
                >
                  <Icon name={option.icon} />
                </span>
                <span className="min-w-0">
                  <strong className="block text-base text-brand">{option.name}</strong>
                  <span className="mt-0.5 block text-xs text-ink-500">
                    Lớp {entry.course.gradeId} ·{" "}
                    {option.capabilities?.math ? "Có công thức" : "Không cần LaTeX"}
                  </span>
                </span>
              </div>
            </Button>
          );
        })}
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <section className="knowledge-path sm:hidden" aria-label="Lộ trình kiến thức">
          {nodes.map((node, index) => (
            <Button
              key={node.id}
              variant="surface"
              className="knowledge-path-node"
              data-state={node.state}
              onClick={() => openTopic(node.id)}
            >
              {node.cardImageUrl && (
                <img
                  src={node.cardImageUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                />
              )}
              <span className="knowledge-path-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold uppercase tracking-wider opacity-70">
                  {node.state === "mastered"
                    ? "Mastered"
                    : node.state === "current"
                      ? "Current"
                      : "Bridge needed"}
                </span>
                <strong className="mt-1 block text-base leading-snug">
                  {node.title}
                </strong>
                <span className="mt-1 block text-xs opacity-70">
                  {node.lessonCount} learning objects
                </span>
              </span>
              <strong className="text-lg">{node.mastery}%</strong>
            </Button>
          ))}
        </section>

        <section
          className="knowledge-canvas hidden sm:block"
          aria-label="Bản đồ kiến thức"
        >
          <svg
            className="absolute inset-0 z-[1] h-full w-full"
            viewBox="0 0 1000 650"
            aria-hidden="true"
          >
            <line className="knowledge-edge" x1="180" y1="220" x2="480" y2="130" />
            <line className="knowledge-edge" x1="480" y1="130" x2="770" y2="285" />
            <line className="knowledge-edge" x1="480" y1="130" x2="500" y2="465" />
            <line className="knowledge-edge" x1="180" y1="220" x2="500" y2="465" />
          </svg>

          <div className="absolute left-1/2 top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand/10 bg-white/70 px-4 py-2 text-xs font-semibold text-brand backdrop-blur">
            YOU · {totalMastery}% mastery
          </div>

          {nodes.map((node) => (
            <Button
              key={node.id}
              variant="surface"
              className="knowledge-node"
              data-state={node.state}
              style={node.position}
              onClick={() => openTopic(node.id)}
            >
              {node.cardImageUrl && (
                <img
                  src={node.cardImageUrl}
                  alt=""
                  className="mb-3 h-20 w-full rounded-2xl object-cover"
                />
              )}
              <div className="flex items-start justify-between gap-3">
                <span>
                  <span className="block text-xs font-bold uppercase tracking-wider opacity-70">
                    {node.state === "mastered"
                      ? "Mastered"
                      : node.state === "current"
                        ? "Current"
                        : "Bridge needed"}
                  </span>
                  <strong className="mt-1 block text-base leading-snug">
                    {node.title}
                  </strong>
                </span>
                <span className="shrink-0 text-sm font-bold">{node.mastery}%</span>
              </div>
              <div className="knowledge-node__meter">
                <div
                  className="knowledge-node__fill"
                  style={{ width: String(node.mastery) + "%" }}
                />
              </div>
              <span className="mt-2 block text-xs opacity-70">
                {node.lessonCount} learning objects
              </span>
            </Button>
          ))}
        </section>

        <aside
          className="space-y-5 xl:sticky"
          style={{ top: "calc(var(--header-h) + 1.5rem)" }}
        >
          <section className="signal-card signal-card--accent">
            <p className="signal-label">
              <Icon name="auto_awesome" />
              AI Bridge
            </p>
            <h2 className="mt-3 text-xl font-bold text-brand">
              {priority?.title ?? "Bước tiếp theo"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              Tutor chọn bridge theo cấu trúc nội dung của từng môn. Với Tiếng
              Anh, bridge có thể là vocabulary/dialogue thay vì công thức.
            </p>
            {priority && (
              <Button className="mt-5" onClick={() => openTopic(priority.id)}>
                Mở chủ đề
                <Icon name="arrow_forward" />
              </Button>
            )}
          </section>

          <section className="signal-card">
            <p className="signal-label">
              <Icon name={subject.capabilities?.math ? "calculate" : "language"} />
              Content mode
            </p>
            <p className="mt-3 text-sm leading-6 text-ink-600">
              {subject.capabilities?.math
                ? "Môn này hỗ trợ công thức, đồ thị và math blocks."
                : "Môn này ưu tiên text, hình ảnh, vocabulary và dialogue; KaTeX không được tải nếu lesson không có công thức."}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
