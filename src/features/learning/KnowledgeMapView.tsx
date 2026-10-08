import { Button, Icon, Progress } from "../../components/ui";
import { useCurriculum } from "../../context/CurriculumContext";
import {
  courseHref,
  ownedPublishedLessons,
  primaryEnrollment,
  subjectFor,
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
  if (
    params.has("subject") ||
    params.has("topic") ||
    params.has("lesson")
  ) {
    return <TheoryLessonsView onNavigate={onNavigate} onEarnGp={onEarnGp} />;
  }

  const { topics, lessons, completedLessonIds } = useCurriculum();
  const enrollment = primaryEnrollment;
  const subject = subjectFor(enrollment.subjectId)!;
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
    ? Math.round(nodes.reduce((sum, node) => sum + node.mastery, 0) / nodes.length)
    : 0;
  const priority =
    nodes.find((node) => node.id === currentTopicId) ??
    nodes.find((node) => node.mastery < 100) ??
    nodes[0];

  const openTopic = (topicId: string) => {
    onNavigate(courseHref(enrollment.gradeId, enrollment.subjectId, topicId));
  };

  return (
    <div className="learning-os-page">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="signal-label">
            <Icon name="route" />
            Knowledge Universe
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-[-0.04em] text-brand sm:text-5xl">
            Kiến thức là một mạng lưới, không phải danh sách chương.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-600">
            Tutor nối các chủ đề theo mức độ sẵn sàng của bạn. Node sáng là nội
            dung đã vững; node teal là bước hiện tại; node vàng là khoảng trống
            nên vá trước khi tăng độ khó.
          </p>
        </div>
        <div className="w-full max-w-xs rounded-3xl border border-ink-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-ink-600">Mastery toàn môn</span>
            <strong className="text-2xl text-brand">{totalMastery}%</strong>
          </div>
          <Progress value={totalMastery} label="Mastery toàn môn" tone="accent" className="mt-3 h-2" />
          <p className="mt-3 text-xs leading-5 text-ink-500">
            {subject.name} · Lớp {enrollment.gradeId}
          </p>
        </div>
      </header>

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
              <span className="knowledge-path-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold uppercase tracking-wider opacity-70">
                  {node.state === "mastered"
                    ? "Mastered"
                    : node.state === "current"
                      ? "Current"
                      : "Bridge needed"}
                </span>
                <strong className="mt-1 block text-base leading-snug">{node.title}</strong>
                <span className="mt-1 block text-xs opacity-70">{node.lessonCount} learning objects</span>
              </span>
              <strong className="text-lg">{node.mastery}%</strong>
            </Button>
          ))}
        </section>

        <section className="knowledge-canvas hidden sm:block" aria-label="Bản đồ kiến thức">
          <svg className="absolute inset-0 z-[1] h-full w-full" viewBox="0 0 1000 650" aria-hidden="true">
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
                  style={{ width: `${node.mastery}%` }}
                />
              </div>
              <span className="mt-2 block text-xs opacity-70">
                {node.lessonCount} learning objects
              </span>
            </Button>
          ))}
        </section>

        <aside className="space-y-5 xl:sticky" style={{ top: "calc(var(--header-h) + 1.5rem)" }}>
          <section className="signal-card signal-card--accent">
            <p className="signal-label">
              <Icon name="auto_awesome" />
              AI Bridge
            </p>
            <h2 className="mt-3 text-xl font-bold text-brand">
              {priority?.title ?? "Bước tiếp theo"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              Đây là node Tutor ưu tiên vì nó nằm ngay trước nhiệm vụ tiếp theo.
              Nếu mắc ở đây, hệ thống sẽ tạo một bridge ngắn thay vì bắt bạn học
              lại cả chương.
            </p>
            {priority && (
              <Button
                className="mt-5"
                onClick={() => openTopic(priority.id)}
              >
                Học bridge này
                <Icon name="arrow_forward" />
              </Button>
            )}
          </section>

          <section className="signal-card">
            <p className="signal-label">
              <Icon name="psychology" />
              Cách đọc bản đồ
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-brand" />
                <span>Đã vững — có thể làm prerequisite cho node khác.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-accent" />
                <span>Đang học — AI đang quan sát reasoning trace.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-warning-400" />
                <span>Khoảng trống — nên vá trước khi tăng độ khó.</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
