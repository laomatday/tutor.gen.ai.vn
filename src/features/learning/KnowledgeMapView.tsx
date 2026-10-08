import { useRef, useState, type PointerEvent } from "react";
import {
  Badge,
  Button,
  Card,
  Icon,
  Input,
  Progress,
  Tabs,
} from "../../components/ui";
import { useCurriculum } from "../../context/CurriculumContext";
import {
  courseHref,
  getCourseProgress,
  lessonHref,
  ownedPublishedLessons,
  studentProfile,
} from "../curriculum";
import { normalizeSearch } from "../../lib/search";
import { getPracticeProblems, practicePolicy } from "../practice/data";
import { getEnrolledPracticeProblems } from "../practice/eligibility";
import { routePath } from "../../config/routes";
import { TheoryLessonsView } from "./TheoryLessonsView";
import { practiceHref, usePracticeEvidence } from "./discovery";
import { CourseLearningPath } from "./CourseLearningPath";
import { buildCoursePath } from "./coursePath";
import "../../styles/student-discovery.css";

interface KnowledgeMapViewProps {
  onNavigate: (path: string) => void;
  onEarnGp: (amount: number, reason: string) => void;
}

function CourseSearch({
  query,
  onNavigate,
}: {
  query: string;
  onNavigate: (path: string) => void;
}) {
  const { subjects, topics, lessons, completedLessonIds } = useCurriculum();
  const [text, setText] = useState(query);
  const needle = normalizeSearch(query);
  const results = ownedPublishedLessons(lessons, topics).filter((lesson) =>
    normalizeSearch(
      [
        lesson.title,
        lesson.summary,
        topics.find((item) => item.id === lesson.topicId)?.title ?? "",
        subjects.find((item) => item.id === lesson.subjectId)?.name ?? "",
      ].join(" "),
    ).includes(needle),
  );
  return (
    <div className="learning-os-page discovery-page">
      <Card className="knowledge-search-page">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate(routePath("hoc-bai"))}
        >
          <Icon name="arrow_back" /> Bản đồ tri thức
        </Button>
        <h1>Tìm bài học</h1>
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            onNavigate(
              `${routePath("hoc-bai")}?q=${encodeURIComponent(text.trim())}`,
            );
          }}
          className="knowledge-search-form"
        >
          <Input
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            aria-label="Từ khóa tìm bài học"
            placeholder="Tên bài hoặc chủ đề…"
          />
          <Button type="submit">
            <Icon name="search" /> Tìm
          </Button>
        </form>
        <p className="discovery-description">
          {results.length} kết quả cho “{query}” trong các môn đã đăng ký.
        </p>
      </Card>
      <section aria-label="Kết quả tìm kiếm" className="discovery-queue-grid">
        {results.map((lesson) => (
          <Card key={lesson.id} className="discovery-queue-card">
            <div className="discovery-section-heading">
              <Badge tone="primary">
                {subjects.find((item) => item.id === lesson.subjectId)?.name} ·
                Lớp {lesson.gradeId}
              </Badge>
              {completedLessonIds.includes(lesson.id) && (
                <Icon name="check_circle" className="discovery-accent" />
              )}
            </div>
            <h2>{lesson.title}</h2>
            <p>{lesson.summary}</p>
            <Button
              variant="secondary"
              className="discovery-queue-card__action"
              onClick={() => onNavigate(lessonHref(lesson))}
            >
              Mở bài học
              <Icon name="arrow_forward" />
            </Button>
          </Card>
        ))}
        {!results.length && (
          <Card className="knowledge-empty">
            <Icon name="search_off" />
            <h2>Chưa tìm thấy bài phù hợp</h2>
            <p>Thử một tên bài khác hoặc xem toàn bộ lộ trình.</p>
            <Button onClick={() => onNavigate(routePath("hoc-bai"))}>
              Xem lộ trình
            </Button>
          </Card>
        )}
      </section>
    </div>
  );
}

type TopicFilter = "all" | "pending" | "complete";

function KnowledgeMapOverview({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  const { subjects, topics, lessons, completedLessonIds } = useCurriculum();
  const params = new URLSearchParams(window.location.search);
  const enrolled = studentProfile.enrollments
    .map((enrollment) => ({
      enrollment,
      subject: subjects.find((item) => item.id === enrollment.subjectId),
      progress: getCourseProgress(
        lessons,
        topics,
        completedLessonIds,
        enrollment,
      ),
    }))
    .filter((item) => item.subject && item.progress.total > 0);
  const selected =
    enrolled.find(
      (item) =>
        item.enrollment.subjectId === params.get("subject") &&
        (!params.get("grade") ||
          item.enrollment.gradeId === params.get("grade")),
    ) ?? enrolled[0];
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TopicFilter>("all");
  const [view, setView] = useState<"path" | "map" | "list">("path");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const details = useRef<HTMLElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    originX: number;
    originY: number;
  } | null>(null);
  const evidence = usePracticeEvidence();
  const currentTopics = selected
    ? topics.filter(
        (topic) =>
          topic.gradeId === selected.enrollment.gradeId &&
          topic.subjectId === selected.enrollment.subjectId &&
          selected.progress.lessons.some(
            (lesson) => lesson.topicId === topic.id,
          ),
      )
    : [];
  const topicLessons = (id: string) =>
    selected?.progress.lessons.filter((lesson) => lesson.topicId === id) ?? [];
  const completed = (id: string) =>
    topicLessons(id).filter((lesson) => completedLessonIds.includes(lesson.id))
      .length;
  const eligibleProblems = selected
    ? getEnrolledPracticeProblems(
        getPracticeProblems(),
        studentProfile.enrollments,
        selected.enrollment,
      )
    : [];
  const coursePath = selected
    ? buildCoursePath(topics, lessons, completedLessonIds, selected.enrollment)
    : null;
  const practice =
    eligibleProblems.find(
      (problem) => problem.id === evidence.session.problemId,
    ) ??
    eligibleProblems.find(
      (problem) => problem.id === practicePolicy.defaultStudioProblemId,
    ) ??
    eligibleProblems[0];
  const hasAttempts =
    practice?.id === evidence.session.problemId && evidence.attempts.length > 0;
  const needsReview = hasAttempts && evidence.needsReview;
  const practiceLesson = selected?.progress.lessons.find(
    (lesson) => lesson.id === practice?.lessonId,
  );
  const practiceTopicId = practiceLesson?.topicId ?? practice?.topicId;
  const needle = normalizeSearch(query);
  const visibleTopics = currentTopics.filter((topic) => {
    const done = completed(topic.id);
    const total = topicLessons(topic.id).length;
    return (
      (filter === "all" ||
        (filter === "complete" ? done === total : done < total)) &&
      (!needle ||
        normalizeSearch(
          [
            topic.title,
            topic.description,
            ...topicLessons(topic.id).flatMap((lesson) => [
              lesson.title,
              lesson.summary,
            ]),
          ].join(" "),
        ).includes(needle))
    );
  });
  const focus =
    visibleTopics.find((topic) => topic.id === focusedId) ??
    visibleTopics.find(
      (topic) => completed(topic.id) < topicLessons(topic.id).length,
    ) ??
    visibleTopics[0];
  const focusedLessons = focus ? topicLessons(focus.id) : [];
  const focusedDone = focus ? completed(focus.id) : 0;
  const focusPractice = eligibleProblems.find(
    (problem) =>
      focusedLessons.some((lesson) => lesson.id === problem.lessonId) ||
      problem.topicId === focus?.id,
  );
  const next =
    focusedLessons.find((lesson) => !completedLessonIds.includes(lesson.id)) ??
    focusedLessons[0];
  const positions = currentTopics.map((topic, index) => {
    const angle =
      (index / Math.max(1, currentTopics.length)) * Math.PI * 2 -
      Math.PI * 0.78;
    return {
      topic,
      x: 350 + Math.cos(angle) * 155,
      y: 300 + Math.sin(angle) * 157,
      angle,
    };
  });
  function startPan(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      originX: pan.x,
      originY: pan.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function movePan(event: PointerEvent<HTMLDivElement>) {
    if (drag.current)
      setPan({
        x: drag.current.originX + event.clientX - drag.current.x,
        y: drag.current.originY + event.clientY - drag.current.y,
      });
  }
  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  return (
    <div className="learning-os-page discovery-page knowledge-explore">
      <header className="knowledge-banner">
        <div>
          <div className="discovery-badges">
            <Badge tone="success">
              <Icon name="route" /> Hành trình khám phá
            </Badge>
            <span className="discovery-meta">
              {selected?.progress.total ?? 0} bài học · {currentTopics.length}{" "}
              chủ đề
            </span>
          </div>
          <h1>Môn học</h1>
          <p>
            Mỗi bước, hiểu thêm một chút. Đi theo từng chặng, hoặc rẽ sang điều
            em tò mò.
          </p>
        </div>
        <div className="knowledge-banner__controls">
          <form
            role="search"
            className="knowledge-inline-search"
            onSubmit={(event) => {
              event.preventDefault();
              if (query.trim())
                onNavigate(
                  `${routePath("hoc-bai")}?q=${encodeURIComponent(query.trim())}`,
                );
            }}
          >
            <Icon name="search" />
            <Input
              type="search"
              placeholder="Tìm chủ đề, bài học…"
              aria-label="Tìm chủ đề, bài học"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              disabled={!query.trim()}
              aria-label="Xem tất cả kết quả tìm kiếm"
            >
              <Icon name="arrow_forward" />
            </Button>
          </form>
          <div
            className="knowledge-filter-row"
            aria-label="Lọc trạng thái chủ đề"
          >
            {(
              [
                { id: "all", label: "Tất cả chủ đề" },
                { id: "pending", label: "Đang khám phá" },
                { id: "complete", label: "Đã hoàn thành" },
              ] as const
            ).map((item) => (
              <Button
                key={item.id}
                size="sm"
                variant={filter === item.id ? "primary" : "ghost"}
                aria-pressed={filter === item.id}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </header>
      <nav className="knowledge-subjects" aria-label="Chọn môn học">
        {enrolled.map((item) => (
          <Button
            key={`${item.enrollment.gradeId}-${item.enrollment.subjectId}`}
            size="sm"
            variant={
              selected?.enrollment === item.enrollment ? "secondary" : "ghost"
            }
            aria-current={
              selected?.enrollment === item.enrollment ? "page" : undefined
            }
            onClick={() => {
              setQuery("");
              setFilter("all");
              setFocusedId(null);
              resetView();
              onNavigate(
                courseHref(item.enrollment.gradeId, item.enrollment.subjectId),
              );
            }}
          >
            <Icon name={item.subject!.icon} />
            {item.subject!.name} · Lớp {item.enrollment.gradeId}
            <span className="knowledge-count">
              {item.progress.completed}/{item.progress.total}
            </span>
          </Button>
        ))}
      </nav>
      {!selected ? (
        <Card className="knowledge-empty">
          <Icon name="menu_book" />
          <h2>Chưa có khóa học được xuất bản</h2>
          <p>
            Các chủ đề sẽ xuất hiện khi học liệu của môn em đăng ký được mở.
          </p>
        </Card>
      ) : (
        <>
          <div className="knowledge-view-switch">
            <div>
              <h2>
                {selected.subject!.name} · Lớp {selected.enrollment.gradeId}
              </h2>
              <p>{currentTopics.length} chặng học · Theo nhịp của em</p>
            </div>
            <Tabs
              tabs={
                [
                  { id: "path", label: "Lộ trình", icon: "route" },
                  { id: "map", label: "Bản đồ", icon: "hub" },
                  { id: "list", label: "Danh sách", icon: "menu_book" },
                ] as const
              }
              value={view}
              onChange={setView}
              label="Cách xem môn học"
              variant="pill"
            />
          </div>
          {view === "path" && coursePath ? (
            <div className="knowledge-path-layout">
              {visibleTopics.length ? (
                <CourseLearningPath
                  path={coursePath}
                  onNavigate={onNavigate}
                  practiceProblems={eligibleProblems}
                  visibleTopicIds={visibleTopics.map((topic) => topic.id)}
                />
              ) : (
                <Card className="knowledge-empty">
                  <Icon name="search_off" />
                  <h2>Chưa có chặng học phù hợp</h2>
                  <p>Thử từ khóa khác hoặc bỏ bộ lọc trạng thái.</p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setFilter("all");
                      setQuery("");
                    }}
                  >
                    Hiện tất cả chủ đề
                  </Button>
                </Card>
              )}
              <aside
                className="knowledge-path-companion"
                aria-label="Tiếp tục lộ trình"
              >
                <section className="knowledge-path-next">
                  <span className="discovery-eyebrow">
                    <Icon
                      name={
                        coursePath.nextLesson ? "play_arrow" : "check_circle"
                      }
                    />
                    {coursePath.nextLesson
                      ? "Một bước nhỏ hôm nay"
                      : "Em đã đi hết lộ trình"}
                  </span>
                  <h2>
                    {coursePath.nextLesson?.title ??
                      "Nhìn lại những điều đã học"}
                  </h2>
                  <p>
                    {coursePath.nextLesson?.summary ??
                      "Ôn lại một bài yêu thích, hoặc thử giải bài theo một cách mới."}
                  </p>
                  {coursePath.nextLesson ? (
                    <>
                      <span className="knowledge-path-next__duration">
                        <Icon name="schedule" />
                        {coursePath.nextLesson.durationMinutes} phút khám phá
                      </span>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          onNavigate(lessonHref(coursePath.nextLesson!))
                        }
                      >
                        {coursePath.completed
                          ? "Tiếp tục chặng học"
                          : "Bắt đầu chặng học"}
                        <Icon name="arrow_forward" />
                      </Button>
                    </>
                  ) : coursePath.units[0]?.steps[0] ? (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        onNavigate(
                          lessonHref(
                            coursePath.units[0].steps[0].lesson,
                            "examples",
                          ),
                        )
                      }
                    >
                      Ôn lại một bài
                      <Icon name="history" />
                    </Button>
                  ) : null}
                </section>
                <section
                  className="knowledge-path-progress"
                  aria-label="Tiến độ môn học"
                >
                  <h3>Những bước em đã đi</h3>
                  <div className="knowledge-path-progress__count">
                    <strong>
                      {coursePath.completed}
                      <span aria-hidden="true"> / </span>
                      {coursePath.total}
                    </strong>
                    <span>bài hoàn thành</span>
                  </div>
                  <Progress
                    value={coursePath.completed}
                    max={coursePath.total}
                    label={`Tiến độ ${selected.subject!.name}`}
                    tone="accent"
                  />
                  <p>
                    {
                      coursePath.units.filter(
                        (unit) => unit.state === "complete",
                      ).length
                    }
                    /{coursePath.units.length} chặng hoàn thành. Mỗi bài hiểu rõ
                    là một bước tiến.
                  </p>
                </section>
                {needsReview && practice && (
                  <section className="knowledge-path-progress">
                    <h3>Cùng xem lại một chút</h3>
                    <p>{evidence.lastAttempt?.detail}</p>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        onNavigate(practiceHref(practice.id, true))
                      }
                    >
                      <Icon name="history" />
                      Xem lần tự giải gần nhất
                    </Button>
                  </section>
                )}
                <div className="knowledge-path-note">
                  <Icon name="route" />
                  <p>
                    Em có thể mở bất kỳ bài nào. Lộ trình chỉ gợi ý một thứ tự
                    để dễ bắt đầu.
                  </p>
                </div>
              </aside>
            </div>
          ) : (
            <>
              <section
                className="knowledge-bridge"
                data-tone={needsReview ? "warning" : "accent"}
              >
                <span className="knowledge-bridge__icon">
                  <Icon name={needsReview ? "bolt" : "route"} />
                </span>
                <div>
                  <div className="discovery-badges">
                    <span className="discovery-eyebrow">
                      {needsReview
                        ? "Thêm một góc nhìn, thêm một cách hiểu"
                        : "Một bước nhỏ tiếp theo"}
                    </span>
                    <span className="discovery-meta">
                      {needsReview
                        ? "Từ lần kiểm tra gần nhất"
                        : `${selected.subject!.name} · Lớp ${selected.enrollment.gradeId}`}
                    </span>
                  </div>
                  <p>
                    {needsReview ? (
                      evidence.lastAttempt?.detail
                    ) : (
                      <>
                        Khám phá{" "}
                        <strong>
                          {selected.progress.nextLesson?.title ??
                            "những chủ đề đã hoàn thành"}
                        </strong>
                        . Bắt đầu từ một điều mới là đủ.
                      </>
                    )}
                  </p>
                </div>
                {needsReview && practice ? (
                  <Button onClick={() => onNavigate(practiceHref(practice.id))}>
                    Trở lại bài tự giải
                    <Icon name="arrow_forward" />
                  </Button>
                ) : selected.progress.nextLesson ? (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      onNavigate(lessonHref(selected.progress.nextLesson!))
                    }
                  >
                    Tiếp tục học
                    <Icon name="arrow_forward" />
                  </Button>
                ) : null}
              </section>
              <div className="knowledge-layout">
                <div className="knowledge-map-column">
                  <Card className="knowledge-map">
                    <div className="knowledge-map-heading">
                      <div>
                        <h2>Bản đồ khám phá</h2>
                        <p>Mỗi chủ đề là một điểm đến mới.</p>
                      </div>
                    </div>
                    <div className="knowledge-map__toolbar">
                      <span>
                        <Icon name="public" />
                        {selected.subject!.name} · {visibleTopics.length}/
                        {currentTopics.length} chủ đề
                      </span>
                      {view === "map" && (
                        <div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setZoom((value) =>
                                Math.min(
                                  1.6,
                                  Math.round((value + 0.2) * 10) / 10,
                                ),
                              )
                            }
                            disabled={zoom >= 1.6}
                            aria-label="Phóng to bản đồ"
                          >
                            <Icon name="add" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setZoom((value) =>
                                Math.max(
                                  0.6,
                                  Math.round((value - 0.2) * 10) / 10,
                                ),
                              )
                            }
                            disabled={zoom <= 0.6}
                            aria-label="Thu nhỏ bản đồ"
                          >
                            <span aria-hidden="true">−</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={resetView}
                            aria-label="Căn giữa bản đồ"
                          >
                            <Icon name="center_focus_strong" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {visibleTopics.length ? (
                      view === "map" ? (
                        <div
                          className="knowledge-viewport"
                          onPointerDown={startPan}
                          onPointerMove={movePan}
                          onPointerUp={() => {
                            drag.current = null;
                          }}
                          onPointerCancel={() => {
                            drag.current = null;
                          }}
                        >
                          <div
                            className="knowledge-graph"
                            style={{
                              transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
                            }}
                          >
                            <svg
                              viewBox="0 0 700 600"
                              preserveAspectRatio="none"
                              className="knowledge-links"
                              aria-hidden="true"
                            >
                              <defs>
                                <radialGradient id="knowledge-glow">
                                  <stop
                                    offset="0%"
                                    stopColor="var(--color-accent)"
                                    stopOpacity=".12"
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor="var(--color-accent)"
                                    stopOpacity="0"
                                  />
                                </radialGradient>
                              </defs>
                              <circle
                                cx="350"
                                cy="300"
                                r="260"
                                fill="url(#knowledge-glow)"
                              />
                              {positions.map(
                                ({ topic, x, y, angle }, index) => {
                                  const nextPosition =
                                    positions[(index + 1) % positions.length];
                                  return (
                                    <g
                                      key={topic.id}
                                      opacity={
                                        visibleTopics.some(
                                          (item) => item.id === topic.id,
                                        )
                                          ? 1
                                          : 0.12
                                      }
                                    >
                                      <path
                                        className="knowledge-link knowledge-link--course"
                                        d={`M${x} ${y}Q350 300 ${nextPosition.x} ${nextPosition.y}`}
                                      />
                                      {topicLessons(topic.id).map(
                                        (lesson, lessonIndex) => {
                                          const offset =
                                            (lessonIndex -
                                              (topicLessons(topic.id).length -
                                                1) /
                                                2) *
                                            0.45;
                                          const lx =
                                            350 +
                                            Math.cos(angle + offset) * 255;
                                          const ly =
                                            300 +
                                            Math.sin(angle + offset) * 250;
                                          return (
                                            <path
                                              className={`knowledge-link ${completedLessonIds.includes(lesson.id) ? "knowledge-link--complete" : ""}`}
                                              key={lesson.id}
                                              d={`M${x} ${y}L${lx} ${ly}`}
                                            />
                                          );
                                        },
                                      )}
                                    </g>
                                  );
                                },
                              )}
                            </svg>
                            <div className="knowledge-core">
                              <Icon name="hub" />
                              <span>Thế giới của em</span>
                              <strong>{selected.subject!.name}</strong>
                              <small>Lớp {selected.enrollment.gradeId}</small>
                            </div>
                            {positions.map(({ topic, x, y, angle }) => {
                              if (
                                !visibleTopics.some(
                                  (item) => item.id === topic.id,
                                )
                              )
                                return null;
                              const items = topicLessons(topic.id);
                              const done = completed(topic.id);
                              const state =
                                focus?.id === topic.id
                                  ? "selected"
                                  : done === items.length
                                    ? "complete"
                                    : needsReview &&
                                        practiceTopicId === topic.id
                                      ? "warning"
                                      : "pending";
                              return (
                                <div key={topic.id}>
                                  <Button
                                    variant="ghost"
                                    className="knowledge-topic-node"
                                    style={{
                                      left: `${x / 7}%`,
                                      top: `${y / 6}%`,
                                    }}
                                    data-state={state}
                                    onClick={() => setFocusedId(topic.id)}
                                    aria-pressed={focus?.id === topic.id}
                                  >
                                    <span className="knowledge-topic-node__orb">
                                      <Icon
                                        name={
                                          state === "complete"
                                            ? "check"
                                            : state === "warning"
                                              ? "warning"
                                              : selected.subject!.icon
                                        }
                                      />
                                    </span>
                                    {focus?.id === topic.id && (
                                      <span className="knowledge-topic-node__tag">
                                        Đang chọn
                                      </span>
                                    )}
                                    <strong>{topic.title}</strong>
                                    <small>
                                      {done}/{items.length} bài
                                    </small>
                                  </Button>
                                  {items.map((lesson, index) => {
                                    const offset =
                                      (index - (items.length - 1) / 2) * 0.45;
                                    const lx =
                                      350 + Math.cos(angle + offset) * 255;
                                    const ly =
                                      300 + Math.sin(angle + offset) * 250;
                                    return (
                                      <Button
                                        key={lesson.id}
                                        variant="ghost"
                                        className="knowledge-lesson-node"
                                        style={{
                                          left: `${lx / 7}%`,
                                          top: `${ly / 6}%`,
                                        }}
                                        data-complete={completedLessonIds.includes(
                                          lesson.id,
                                        )}
                                        onClick={() =>
                                          onNavigate(lessonHref(lesson))
                                        }
                                        aria-label={`Mở bài ${lesson.title}`}
                                      >
                                        <span>
                                          <Icon
                                            name={
                                              completedLessonIds.includes(
                                                lesson.id,
                                              )
                                                ? "check"
                                                : "menu_book"
                                            }
                                          />
                                        </span>
                                        <small>{lesson.title}</small>
                                      </Button>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div
                          className="knowledge-topic-cards"
                          aria-label="Danh sách chủ đề"
                        >
                          {visibleTopics.map((topic, index) => {
                            const items = topicLessons(topic.id);
                            const done = completed(topic.id);
                            return (
                              <Button
                                key={topic.id}
                                variant="surface"
                                className="knowledge-topic-card"
                                aria-pressed={focus?.id === topic.id}
                                onClick={() => setFocusedId(topic.id)}
                              >
                                <span className="knowledge-topic-card__number">
                                  {done === items.length ? (
                                    <Icon name="check" />
                                  ) : (
                                    String(index + 1).padStart(2, "0")
                                  )}
                                </span>
                                <strong>{topic.title}</strong>
                                <span>{topic.description}</span>
                                <span className="knowledge-topic-card__progress">
                                  <span>
                                    {done}/{items.length} bài hoàn thành
                                  </span>
                                  <Icon
                                    name={
                                      focus?.id === topic.id
                                        ? "check_circle"
                                        : "arrow_forward"
                                    }
                                  />
                                </span>
                              </Button>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      <div className="knowledge-empty knowledge-empty--graph">
                        <Icon name="search_off" />
                        <h2>Không có chủ đề phù hợp</h2>
                        <p>Thử từ khóa khác hoặc bỏ bộ lọc trạng thái.</p>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setFilter("all");
                            setQuery("");
                          }}
                        >
                          Hiện tất cả chủ đề
                        </Button>
                      </div>
                    )}
                    <div className="knowledge-map__footer">
                      <span>
                        <span className="discovery-status-dot" />
                        Đang chọn:{" "}
                        <strong>{focus?.title ?? "Chưa có chủ đề"}</strong>
                      </span>
                      {view === "map" && (
                        <small>
                          Kéo để khám phá · {Math.round(zoom * 100)}% · Chọn một
                          chủ đề để xem bài học
                        </small>
                      )}
                      {focus && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="knowledge-details-jump"
                          onClick={() => {
                            details.current?.focus({ preventScroll: true });
                            details.current?.scrollIntoView({
                              block: "start",
                              behavior: window.matchMedia(
                                "(prefers-reduced-motion: reduce)",
                              ).matches
                                ? "auto"
                                : "smooth",
                            });
                          }}
                        >
                          Xem {focusedLessons.length} bài học{" "}
                          <Icon name="arrow_forward" />
                        </Button>
                      )}
                    </div>
                    <div
                      className="knowledge-legend"
                      aria-label="Chú giải bản đồ"
                    >
                      <div>
                        <span data-state="complete">
                          <i />
                          Đã hoàn thành
                        </span>
                        <span data-state="selected">
                          <i />
                          Đang chọn
                        </span>
                        <span data-state="pending">
                          <i />
                          Chờ khám phá
                        </span>
                        {needsReview && (
                          <span data-state="warning">
                            <i />
                            Cùng xem lại
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                  <div className="knowledge-summary">
                    <Card>
                      <span className="discovery-evidence__icon">
                        <Icon name="menu_book" />
                      </span>
                      <div>
                        <span>Bài đã hoàn thành</span>
                        <strong>
                          {selected.progress.completed} /{" "}
                          {selected.progress.total}
                        </strong>
                      </div>
                    </Card>
                    <Card>
                      <span className="discovery-evidence__icon">
                        <Icon name="account_tree" />
                      </span>
                      <div>
                        <span>Chủ đề đã hoàn thành</span>
                        <strong>
                          {
                            currentTopics.filter(
                              (topic) =>
                                completed(topic.id) ===
                                topicLessons(topic.id).length,
                            ).length
                          }{" "}
                          / {currentTopics.length}
                        </strong>
                      </div>
                    </Card>
                    <Card>
                      <span className="discovery-evidence__icon">
                        <Icon name="edit_square" />
                      </span>
                      <div>
                        <span>Bài tự giải sẵn sàng</span>
                        <strong>{eligibleProblems.length} bài tập</strong>
                      </div>
                    </Card>
                  </div>
                </div>
                <aside
                  ref={details}
                  tabIndex={-1}
                  className="knowledge-details"
                  aria-label="Thông tin chủ đề"
                >
                  <Card className="knowledge-topic-node-panel">
                    {focus ? (
                      <>
                        <div className="discovery-section-heading">
                          <Badge tone="success">Điểm đến đang chọn</Badge>
                          <Icon
                            name="psychology"
                            className="discovery-accent"
                          />
                        </div>
                        <h2>{focus.title}</h2>
                        <p className="discovery-description">
                          {focus.description}
                        </p>
                        <div className="knowledge-score">
                          <div>
                            <span>Tiến độ chủ đề</span>
                            <strong>
                              {Math.round(
                                (focusedDone /
                                  Math.max(1, focusedLessons.length)) *
                                  100,
                              )}
                              %
                            </strong>
                          </div>
                          <Progress
                            value={focusedDone}
                            max={focusedLessons.length}
                            label={`Hoàn thành ${focus.title}`}
                            tone="accent"
                          />
                          <p>
                            {focusedDone}/{focusedLessons.length} bài đã hoàn
                            thành
                          </p>
                        </div>
                        <h3 className="discovery-eyebrow">
                          <Icon name="account_tree" /> Từng bước khám phá
                        </h3>
                        <ul className="knowledge-lesson-list">
                          {focusedLessons.map((lesson) => (
                            <li key={lesson.id}>
                              <Button
                                variant="surface"
                                onClick={() => onNavigate(lessonHref(lesson))}
                              >
                                <Icon
                                  name={
                                    completedLessonIds.includes(lesson.id)
                                      ? "check_circle"
                                      : "menu_book"
                                  }
                                />
                                <span>
                                  <strong>{lesson.title}</strong>
                                  <small>
                                    {completedLessonIds.includes(lesson.id)
                                      ? "Đã hoàn thành"
                                      : "Sẵn sàng khám phá"}{" "}
                                    · {lesson.durationMinutes} phút
                                  </small>
                                </span>
                                <Icon name="arrow_forward" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                        <div className="knowledge-topic-note">
                          <Icon name="target" />
                          <div>
                            <strong>Không cần tự xoay xở một mình</strong>
                            <p>
                              {focusedLessons.reduce(
                                (count, lesson) =>
                                  count + lesson.examples.length,
                                0,
                              )}{" "}
                              ví dụ có hướng dẫn và{" "}
                              {focusedLessons.reduce(
                                (count, lesson) =>
                                  count + lesson.exercises.length,
                                0,
                              )}{" "}
                              câu luyện tập trong chủ đề này.
                            </p>
                          </div>
                        </div>
                        {needsReview && practiceTopicId === focus.id && (
                          <div className="knowledge-review-note">
                            <div>
                              <Icon name="warning" />
                              <strong>Lần tự giải gần nhất</strong>
                            </div>
                            <p>{evidence.lastAttempt?.detail}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onNavigate(practiceHref(practice!.id, true))
                              }
                            >
                              Xem lại các bước
                              <Icon name="arrow_forward" />
                            </Button>
                          </div>
                        )}
                        {focusPractice && (
                          <Button
                            className="knowledge-primary-action"
                            onClick={() =>
                              onNavigate(practiceHref(focusPractice.id))
                            }
                          >
                            <Icon name="edit_square" />
                            Thử sức với một bài
                          </Button>
                        )}
                        {next && (
                          <Button
                            variant={focusPractice ? "secondary" : "primary"}
                            className="knowledge-primary-action"
                            onClick={() => onNavigate(lessonHref(next))}
                          >
                            {focusedDone === focusedLessons.length
                              ? "Ôn lại chủ đề"
                              : "Học bài tiếp theo"}
                            <Icon name="arrow_forward" />
                          </Button>
                        )}
                        {hasAttempts &&
                          practice &&
                          practiceTopicId === focus.id && (
                            <Button
                              variant="ghost"
                              className="knowledge-primary-action"
                              onClick={() =>
                                onNavigate(practiceHref(practice.id, true))
                              }
                            >
                              <Icon name="history" /> Xem lại hành trình tự giải
                            </Button>
                          )}
                      </>
                    ) : (
                      <div className="knowledge-empty">
                        <Icon name="hub" />
                        <p>Chọn một chủ đề trên bản đồ để xem các bài học.</p>
                      </div>
                    )}
                  </Card>
                  <Card className="knowledge-help">
                    <Icon name="hub" />
                    <div>
                      <strong>Mỗi nút, một bước tiến</strong>
                      <p>
                        {view === "map"
                          ? "Chọn nút lớn để khám phá chủ đề, nút nhỏ để mở bài học."
                          : "Chọn một thẻ chủ đề để xem bài học và tiếp tục nơi em muốn."}
                      </p>
                    </div>
                  </Card>
                </aside>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export function KnowledgeMapView({
  onNavigate,
  onEarnGp,
}: KnowledgeMapViewProps) {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q")?.trim();
  if (query)
    return <CourseSearch key={query} query={query} onNavigate={onNavigate} />;
  if (params.has("topic") || params.has("lesson"))
    return <TheoryLessonsView onNavigate={onNavigate} onEarnGp={onEarnGp} />;
  return <KnowledgeMapOverview onNavigate={onNavigate} />;
}
