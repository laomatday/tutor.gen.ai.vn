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

type NodeState = "mastered" | "current" | "locked" | "gap" | "intervention";

interface ConceptNode {
  id: string;
  title: string;
  subtitle?: string;
  state: NodeState;
  mastery: number;
  x: number;
  y: number;
  icon: string;
}

const mathNodes: ConceptNode[] = [
  { id: "quadratic", title: "Hàm số bậc hai", subtitle: "y = ax² + bx + c", state: "current", mastery: 78, x: 50, y: 48, icon: "functions" },
  { id: "algebra", title: "Biểu thức đại số", state: "mastered", mastery: 94, x: 25, y: 20, icon: "check" },
  { id: "equation", title: "Phương trình bậc hai", state: "mastered", mastery: 89, x: 50, y: 14, icon: "check" },
  { id: "sign-a", title: "Dấu của a & chiều mở", state: "gap", mastery: 62, x: 77, y: 23, icon: "warning" },
  { id: "vertex", title: "Đỉnh của Parabol", state: "current", mastery: 72, x: 87, y: 48, icon: "my_location" },
  { id: "axis", title: "Trục đối xứng", state: "mastered", mastery: 90, x: 82, y: 70, icon: "check" },
  { id: "line", title: "Đường thẳng & Parabol", state: "locked", mastery: 20, x: 67, y: 84, icon: "lock" },
  { id: "application", title: "Ứng dụng thực tế", state: "current", mastery: 68, x: 50, y: 88, icon: "bar_chart" },
  { id: "delta", title: "Nghiệm & Biệt thức Δ", state: "intervention", mastery: 58, x: 24, y: 75, icon: "priority_high" },
  { id: "canonical", title: "Dạng chính tắc", subtitle: "y = a(x-h)² + k", state: "mastered", mastery: 84, x: 15, y: 52, icon: "check" },
  { id: "graph", title: "Đồ thị Parabol", state: "mastered", mastery: 87, x: 13, y: 34, icon: "show_chart" },
];

const englishNodes: ConceptNode[] = [
  { id: "everyday", title: "Everyday English", subtitle: "Meaning in context", state: "current", mastery: 74, x: 50, y: 48, icon: "language" },
  { id: "vocab", title: "Everyday vocabulary", state: "mastered", mastery: 91, x: 22, y: 22, icon: "check" },
  { id: "conditional", title: "First conditional", state: "current", mastery: 76, x: 49, y: 16, icon: "call_split" },
  { id: "pronunciation", title: "Word stress", state: "gap", mastery: 61, x: 77, y: 24, icon: "record_voice_over" },
  { id: "listening", title: "Listening for intent", state: "current", mastery: 69, x: 86, y: 50, icon: "headphones" },
  { id: "invitation", title: "Polite invitations", state: "mastered", mastery: 86, x: 80, y: 73, icon: "check" },
  { id: "response", title: "Responding naturally", state: "locked", mastery: 32, x: 61, y: 85, icon: "lock" },
  { id: "speaking", title: "Speaking mission", state: "current", mastery: 71, x: 39, y: 86, icon: "forum" },
  { id: "grammar", title: "Verb forms", state: "intervention", mastery: 56, x: 20, y: 72, icon: "priority_high" },
  { id: "context", title: "Context clues", state: "mastered", mastery: 88, x: 13, y: 45, icon: "check" },
];

const stateLabel: Record<NodeState, string> = {
  mastered: "Đã nắm vững",
  current: "Đang học",
  locked: "Chưa mở khóa",
  gap: "Lỗ hổng",
  intervention: "Cần can thiệp",
};

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
  const searchQuery = (params.get("q") ?? "").trim().toLocaleLowerCase("vi");
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

  const completed = courseLessons.filter((lesson) =>
    completedLessonIds.includes(lesson.id),
  ).length;
  const courseMastery = courseLessons.length
    ? Math.round((completed / courseLessons.length) * 100)
    : 0;

  const allNodes = subject.id === "tieng-anh" ? englishNodes : mathNodes;
  const filteredNodes = searchQuery
    ? allNodes.filter((node) =>
        `${node.title} ${node.subtitle ?? ""}`
          .toLocaleLowerCase("vi")
          .includes(searchQuery),
      )
    : allNodes;

  const activeNode =
    filteredNodes.find((node) => node.state === "current") ??
    filteredNodes[0] ??
    allNodes[0];
  const gapNode =
    allNodes.find((node) => node.state === "gap") ??
    activeNode;

  const chooseSubject = (subjectId: string) => {
    const query = new URLSearchParams({ subject: subjectId });
    onNavigate(`${routePath("hoc-bai")}?${query.toString()}`);
  };

  const openFirstTopic = () => {
    const topic = courseTopics[0];
    if (topic) {
      onNavigate(courseHref(enrollment.gradeId, enrollment.subjectId, topic.id));
    }
  };

  const isEnglish = subject.id === "tieng-anh";
  const overall = Math.max(courseMastery, isEnglish ? 71 : 74);

  return (
    <div className="learning-os-page knowledge-universe-v3">
      <section className="knowledge-hero-v3">
        <div>
          <div className="premium-breadcrumb">
            <span>TUYỂN SINH 10</span>
            <Icon name="chevron_right" />
            <span>{subject.name}</span>
            <Icon name="chevron_right" />
            <strong>Vũ trụ tri thức</strong>
          </div>
          <h1>Knowledge Universe <span>/ Vũ trụ tri thức</span></h1>
          <p>
            Bản đồ tri thức {subject.name} tuyển sinh 10 · Khám phá mối liên kết,
            phát hiện lỗ hổng và xây dựng lộ trình học cá nhân hóa.
          </p>
          {searchQuery && (
            <span className="premium-status mt-3 inline-flex">
              Kết quả tìm kiếm: “{params.get("q")}”
            </span>
          )}
        </div>
        <div className="knowledge-hero-v3__art">
          <span className="scenic-handnote">Mỗi kiến thức là một bước gần hơn tới ước mơ của bạn ↗</span>
          <div className="knowledge-hero-quote">
            <Icon name="landscape" />
            <strong>“Học có bản đồ, bạn sẽ đi xa hơn.”</strong>
          </div>
        </div>
      </section>

      <div className="subject-switcher-v3" aria-label="Môn học đã đăng ký">
        {enrolledSubjects.map((entry) => {
          const option = entry.subject!;
          const active = option.id === subject.id;
          return (
            <Button
              key={option.id}
              variant="surface"
              aria-pressed={active}
              onClick={() => chooseSubject(option.id)}
              className={active ? "is-active" : ""}
            >
              <Icon name={option.icon} />
              {option.name}
              <span>{option.capabilities?.math ? "Math mode" : "Language mode"}</span>
            </Button>
          );
        })}
      </div>

      <section className="knowledge-legend-v3">
        <div>
          <strong>Chú thích trạng thái nút</strong>
          <span><i data-state="mastered" /> Đã nắm vững</span>
          <span><i data-state="current" /> Đang học</span>
          <span><i data-state="locked" /> Chưa mở khóa</span>
          <span><i data-state="gap" /> Lỗ hổng kiến thức</span>
          <span><i data-state="intervention" /> Cần can thiệp</span>
        </div>
        <div className="knowledge-overall-ring" style={{ "--progress": `${overall}%` } as React.CSSProperties}>
          <strong>{overall}%</strong>
          <span>Tổng thể chương</span>
        </div>
      </section>

      <section className="adaptive-diagnostic-v3">
        <span className="adaptive-diagnostic-v3__icon"><Icon name="bolt" /></span>
        <div>
          <p className="premium-eyebrow">AI Diagnostic · Adaptive Bridge</p>
          <strong>
            {isEnglish
              ? "Phát hiện lỗ hổng: Word stress đang làm giảm độ tự nhiên khi nghe và nói."
              : "Phát hiện lỗ hổng: Em còn nhầm dấu của a khi đọc chiều mở Parabol."}
          </strong>
          <span>
            {isEnglish
              ? "Đề xuất: 7 phút luyện stress + 4 lượt nghe phân biệt."
              : "Đề xuất: 7 phút cầu nối về dấu âm, bình phương và chiều mở đồ thị."}
          </span>
        </div>
        <Button onClick={() => onNavigate(routePath("tu-giai"))}>
          Bắt đầu luyện tập ngay <Icon name="arrow_forward" />
        </Button>
      </section>

      <div className="knowledge-workspace-v3">
        <section className="knowledge-graph-card-v3">
          <div className="premium-section-heading">
            <div>
              <p className="premium-eyebrow"><Icon name="hub" /> Bản đồ tri thức</p>
              <h2>{isEnglish ? "Everyday English & School Life" : "Hàm số bậc hai và Parabol"}</h2>
              <p>Khám phá mối liên hệ giữa các kiến thức. Nhấn node để xem tín hiệu.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm"><Icon name="zoom_in" /> Thu phóng</Button>
              <Button variant="secondary" size="sm"><Icon name="filter_alt" /> Lọc hiển thị</Button>
            </div>
          </div>

          <div className="knowledge-graph-v3">
            <svg viewBox="0 0 1000 650" className="knowledge-graph-v3__edges" aria-hidden="true">
              {allNodes.slice(1).map((node, index) => (
                <line
                  key={node.id}
                  x1="500"
                  y1="320"
                  x2={node.x * 10}
                  y2={node.y * 6.5}
                  data-state={node.state}
                  className={index % 2 ? "is-dashed" : ""}
                />
              ))}
            </svg>

            <div className="knowledge-core-v3">
              <span><Icon name={activeNode.icon} /></span>
              <strong>{activeNode.title}</strong>
              <small>{activeNode.subtitle ?? stateLabel[activeNode.state]}</small>
              <em>{activeNode.mastery}% mastery</em>
            </div>

            {filteredNodes.slice(1).map((node) => (
              <Button
                key={node.id}
                variant="surface"
                className="knowledge-concept-node-v3"
                data-state={node.state}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                onClick={() => {
                  const search = new URLSearchParams(params);
                  search.set("node", node.id);
                  onNavigate(`${routePath("hoc-bai")}?${search.toString()}`);
                }}
              >
                <span className="knowledge-concept-node-v3__icon"><Icon name={node.icon} /></span>
                <span>
                  <strong>{node.title}</strong>
                  {node.subtitle && <small>{node.subtitle}</small>}
                </span>
                <em>{stateLabel[node.state]}</em>
              </Button>
            ))}

            {filteredNodes.length <= 1 && searchQuery && (
              <div className="knowledge-search-empty">
                <Icon name="search_off" />
                <strong>Chưa thấy knowledge point phù hợp</strong>
                <span>Thử từ khóa khác hoặc xóa bộ lọc tìm kiếm.</span>
              </div>
            )}
          </div>

          <div className="knowledge-graph-hint">
            <Icon name="tips_and_updates" />
            <span>Kéo tư duy theo mối liên hệ: node xanh là nền vững, cam/đỏ là nơi nên vá trước.</span>
          </div>
        </section>

        <aside className="knowledge-intelligence-v3">
          <div className="premium-card__heading">
            <div>
              <p className="premium-eyebrow"><Icon name="psychology" /> Node Intelligence</p>
              <h2>{activeNode.title}</h2>
            </div>
            <span className="premium-status premium-status--success">{stateLabel[activeNode.state]}</span>
          </div>

          <div className="knowledge-intelligence-v3__mastery">
            <div className="flex items-end justify-between gap-4">
              <span>Mức độ nắm vững của bạn</span>
              <strong>{activeNode.mastery}%</strong>
            </div>
            <Progress value={activeNode.mastery} label="Mức độ nắm vững" tone="accent" className="mt-3 h-2" />
            <small>Mục tiêu khảo sát: ≥ 85%</small>
          </div>

          <div className="knowledge-intelligence-block">
            <div className="knowledge-intelligence-block__title">
              <Icon name="account_tree" />
              <strong>Tiền quyết & lỗ hổng</strong>
              <span>2/3 sẵn sàng</span>
            </div>
            <div className="intelligence-check"><Icon name="check_circle" /><span>{isEnglish ? "Everyday vocabulary" : "Biểu thức đại số"}</span></div>
            <div className="intelligence-check"><Icon name="check_circle" /><span>{isEnglish ? "Sentence patterns" : "Phương trình bậc hai"}</span></div>
            <div className="intelligence-check is-gap"><Icon name="warning" /><span>{gapNode.title}</span><strong>Củng cố ngay</strong></div>
          </div>

          <div className="knowledge-intelligence-block">
            <div className="knowledge-intelligence-block__title">
              <Icon name="school" />
              <strong>Hỗ trợ học tập</strong>
            </div>
            <div className="learning-support-grid">
              <Button variant="surface" onClick={openFirstTopic}><Icon name="play_circle" /><span>Video / bài học<small>12 phút</small></span></Button>
              <Button variant="surface" onClick={() => onNavigate(routePath("tu-giai"))}><Icon name="extension" /><span>Bài tập tương tác<small>8 bài</small></span></Button>
              <Button variant="surface" onClick={openFirstTopic}><Icon name="description" /><span>Mindmap tóm tắt<small>PDF / notes</small></span></Button>
            </div>
          </div>

          <div className="mistake-dna-mini">
            <div className="flex items-center justify-between">
              <strong><Icon name="genetics" /> DNA lỗi sai thường gặp</strong>
              <span>Tần suất 62%</span>
            </div>
            <p>
              {isEnglish
                ? "Nhấn sai trọng âm khiến nghe nhầm ý và phản xạ chậm."
                : "Nhầm dấu a làm xác định sai chiều mở Parabol và kéo theo sai giao điểm."}
            </p>
          </div>

          <div className="exam-impact-mini">
            <Icon name="emoji_events" />
            <div>
              <strong>Tầm quan trọng tuyển sinh 10</strong>
              <span>Rất cao · xuất hiện thường xuyên trong đề tổng hợp.</span>
            </div>
          </div>

          <Button className="w-full" onClick={() => onNavigate(routePath("tu-giai"))}>
            <Icon name="play_arrow" /> Luyện tập knowledge point này
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => onNavigate(routePath("replay"))}>
            <Icon name="history" /> Xem Thinking Replay lỗi mẫu
          </Button>
        </aside>
      </div>

      <div className="knowledge-summary-v3">
        <div><Icon name="bar_chart" /><span>Lực nắm bắt tổng thể<strong>82 / 100 PTS</strong><small>↑ +12% so với tháng trước</small></span></div>
        <div><Icon name="warning" /><span>Lỗ hổng nền tảng<strong>3 điểm cần vá</strong><small>Giảm 2 so với tuần trước</small></span></div>
        <div><Icon name="emoji_events" /><span>Dự phóng điểm tuyển sinh<strong>8.75 – 9.25</strong><small>Dựa trên tiến độ hiện tại</small></span></div>
        <div><Icon name="my_location" /><span>Mục tiêu của bạn<strong>≥ 9.0 điểm</strong><small>Tuyển sinh 10</small></span></div>
      </div>

      <span className="sr-only">
        Nội dung từ {contentSource}. Có {courseTopics.length} chủ đề, {courseLessons.length} bài học trong môn {subject.name}.
      </span>
    </div>
  );
}
