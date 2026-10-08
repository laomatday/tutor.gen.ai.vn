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
  { left: "17%", top: "30%" },
  { left: "50%", top: "15%" },
  { left: "82%", top: "34%" },
  { left: "70%", top: "76%" },
  { left: "35%", top: "82%" },
];

export function KnowledgeMapView({ onNavigate, onEarnGp }: KnowledgeMapViewProps) {
  const params = new URLSearchParams(window.location.search);
  if (params.has("topic") || params.has("lesson")) {
    return <TheoryLessonsView onNavigate={onNavigate} onEarnGp={onEarnGp} />;
  }

  const { subjects, topics, lessons, completedLessonIds, contentSource } = useCurriculum();
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
    .map((course) => ({ course, subject: subjects.find((item) => item.id === course.subjectId) }))
    .filter((item) => Boolean(item.subject));

  const courseTopics = topics.filter(
    (topic) => topic.gradeId === enrollment.gradeId && topic.subjectId === enrollment.subjectId,
  );
  const courseLessons = ownedPublishedLessons(lessons, topics).filter(
    (lesson) => lesson.gradeId === enrollment.gradeId && lesson.subjectId === enrollment.subjectId,
  );
  const nextLesson = courseLessons.find((lesson) => !completedLessonIds.includes(lesson.id)) ?? courseLessons[0];
  const currentTopicId = nextLesson?.topicId;

  const nodes = courseTopics.map((topic, index) => {
    const topicLessons = courseLessons.filter((lesson) => lesson.topicId === topic.id);
    const completed = topicLessons.filter((lesson) => completedLessonIds.includes(lesson.id)).length;
    const mastery = topicLessons.length ? Math.round((completed / topicLessons.length) * 100) : 0;
    const state =
      mastery === 100 ? "mastered" : topic.id === currentTopicId ? "current" : mastery === 0 ? "gap" : "current";
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

  const openTopic = (topicId: string) => onNavigate(courseHref(enrollment.gradeId, enrollment.subjectId, topicId));
  const chooseSubject = (subjectId: string) => {
    const query = new URLSearchParams({ subject: subjectId });
    onNavigate(routePath("hoc-bai") + "?" + query.toString());
  };

  const isMath = subject.capabilities?.math;

  return (
    <div className="learning-os-page ai-v3-page">
      <section className="ai-v3-page-banner">
        <div>
          <p className="ai-v3-eyebrow">Tuyển sinh 10 · {subject.name} · {contentSource === "database" ? "Live DB" : "Fallback"}</p>
          <h1>Knowledge Universe <span>/ Vũ trụ tri thức</span></h1>
          <p>Khám phá mối liên kết giữa các kiến thức, phát hiện lỗ hổng và xây dựng lộ trình học cá nhân hóa.</p>
        </div>
        <img src="/learning-media/learning-horizon.svg" alt="" />
      </section>

      <section className="ai-v3-subject-tabs" aria-label="Môn học đã đăng ký">
        {enrolledSubjects.map((entry) => {
          const option = entry.subject!;
          const active = option.id === subject.id;
          return (
            <Button
              key={option.id}
              variant="surface"
              onClick={() => chooseSubject(option.id)}
              aria-pressed={active}
              className={active ? "ai-v3-subject-tab is-active" : "ai-v3-subject-tab"}
            >
              <Icon name={option.icon} />
              <span><strong>{option.name}</strong><small>Lớp {entry.course.gradeId}</small></span>
            </Button>
          );
        })}
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <Button variant="secondary" size="sm"><Icon name="center_focus_strong" />Toàn màn hình</Button>
          <Button variant="secondary" size="sm"><Icon name="filter_alt" />Lọc hiển thị</Button>
        </div>
      </section>

      <section className="ai-v3-legend">
        <strong>Chú thích trạng thái nút</strong>
        {[
          ["mastered", "Đã nắm vững", "Thành thạo, sẵn sàng"],
          ["current", "Đang học", "Teal Pulse"],
          ["locked", "Chưa mở khóa", "Cần học kiến thức trước"],
          ["gap", "Lỗ hổng kiến thức", "Cần củng cố"],
          ["danger", "Cần can thiệp", "Hiểu sai nghiêm trọng"],
        ].map(([state, label, note]) => (
          <span key={state} className="ai-v3-legend__item" data-state={state}>
            <i /><span><b>{label}</b><small>{note}</small></span>
          </span>
        ))}
        <div className="ai-v3-legend__mastery">
          <div className="ai-v3-mini-ring" style={{ "--progress": `${totalMastery}%` } as React.CSSProperties}><span>{totalMastery}%</span></div>
          <span><b>Tổng thể chương</b><small>Đã bao phủ kiến thức trọng tâm</small></span>
        </div>
      </section>

      <section className="ai-v3-diagnostic">
        <span className="ai-v3-diagnostic__icon"><Icon name="bolt" /></span>
        <div className="min-w-0 flex-1">
          <p className="ai-v3-eyebrow">AI Diagnostic · Adaptive Bridge</p>
          <h2>{isMath ? "Phát hiện lỗ hổng: dấu của hệ số và chiều mở đồ thị." : "Phát hiện lỗ hổng: phản xạ dùng cấu trúc ngôn ngữ chưa ổn định."}</h2>
          <p>{isMath ? "Đề xuất hoạt động bắc cầu: xem lại dấu hệ số qua đồ thị + 5 bài tương tác." : "Đề xuất bridge ngắn: vocabulary → dialogue → 3 câu phản xạ."}</p>
        </div>
        <Button onClick={() => priority && openTopic(priority.id)}>Bắt đầu luyện tập ngay <Icon name="arrow_forward" /></Button>
      </section>

      <div className="ai-v3-map-layout">
        <main className="ai-v3-map-shell">
          <div className="ai-v3-map-shell__head">
            <div>
              <p className="ai-v3-eyebrow"><Icon name="hub" /> Bản đồ tri thức</p>
              <h2>{priority?.title ?? subject.name}</h2>
              <p>Nhấn vào từng nút để xem chi tiết, prerequisite và bridge do AI đề xuất.</p>
            </div>
            <div className="hidden gap-2 md:flex">
              <Button variant="secondary" size="sm"><Icon name="zoom_out" />Thu phóng</Button>
              <Button variant="secondary" size="sm"><Icon name="filter_list" />Lọc</Button>
            </div>
          </div>

          <div className="ai-v3-knowledge-graph">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 660" aria-hidden="true">
              <path d="M500 330 C360 245 270 220 170 200" className="ai-v3-map-edge" />
              <path d="M500 330 C510 210 500 145 500 95" className="ai-v3-map-edge" />
              <path d="M500 330 C650 240 760 220 840 220" className="ai-v3-map-edge ai-v3-map-edge--gap" />
              <path d="M500 330 C650 440 705 500 720 545" className="ai-v3-map-edge" />
              <path d="M500 330 C380 450 340 520 320 565" className="ai-v3-map-edge ai-v3-map-edge--soft" />
            </svg>

            <div className="ai-v3-map-core">
              <span><Icon name={isMath ? "functions" : "language"} /></span>
              <small>Đang học</small>
              <strong>{priority?.title ?? subject.name}</strong>
              <em>KP-{String((priority?.id ?? subject.id).length * 23).padStart(3, "0")}</em>
            </div>

            {nodes.map((node) => (
              <Button
                key={node.id}
                variant="surface"
                className="ai-v3-map-node"
                data-state={node.state}
                style={node.position}
                onClick={() => openTopic(node.id)}
              >
                <span className="ai-v3-map-node__orb">
                  <Icon name={node.state === "mastered" ? "check" : node.state === "gap" ? "warning" : "circle"} />
                </span>
                <strong>{node.title}</strong>
                <small>{node.mastery}% mastery</small>
              </Button>
            ))}

            <div className="ai-v3-map-you"><span>YOU</span><small>ARE HERE</small></div>
          </div>

          <div className="ai-v3-map-footer">
            <span><i className="bg-accent" /> Liên hệ kiến thức</span>
            <span><i className="bg-brand-300" /> Liên hệ nền tảng</span>
            <span className="ml-auto">Kéo · phóng to · chọn node để xem chi tiết</span>
          </div>
        </main>

        <aside className="ai-v3-card ai-v3-node-panel">
          <div className="ai-v3-card__head">
            <div>
              <p className="ai-v3-eyebrow">Node Intelligence</p>
              <h2 className="ai-v3-section-title">{priority?.title ?? "Kiến thức trọng tâm"}</h2>
            </div>
            <Button variant="ghost" size="icon" aria-label="Lưu kiến thức"><Icon name="bookmark" /></Button>
          </div>

          <div className="ai-v3-node-score">
            <span>Mức độ nắm vững của bạn</span><strong>{priority?.mastery ?? totalMastery}%</strong>
            <Progress value={priority?.mastery ?? totalMastery} label="Mức độ nắm vững" tone="accent" className="mt-3 h-2" />
            <small>Mục tiêu: 85%</small>
          </div>

          <div className="ai-v3-node-section">
            <h3><Icon name="account_tree" /> Tiền quyết & Lỗ hổng</h3>
            <ul>
              <li className="is-good"><Icon name="check_circle" /> Biểu thức đại số</li>
              <li className="is-good"><Icon name="check_circle" /> Nền tảng trước đó</li>
              <li className="is-gap"><Icon name="warning" /> {isMath ? "Dấu hệ số & chiều mở" : "Phản xạ cấu trúc"} <Button variant="ghost" size="sm">Củng cố</Button></li>
            </ul>
          </div>

          <div className="ai-v3-node-section">
            <h3><Icon name="school" /> Hỗ trợ học tập</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["play_circle", "Video", "12 phút"],
                ["extension", "Tương tác", "8 bài"],
                ["description", "Mindmap", "Tóm tắt"],
              ].map(([icon, title, meta]) => (
                <div key={title} className="ai-v3-support-tile"><Icon name={icon} /><b>{title}</b><small>{meta}</small></div>
              ))}
            </div>
          </div>

          <div className="ai-v3-mistake-card">
            <div className="flex items-center justify-between"><b>DNA lỗi sai thường gặp</b><span>Tần suất 62%</span></div>
            <p>{isMath ? "Nhầm dấu khi chuyển vế hoặc xác định chiều mở đồ thị." : "Nhầm dạng câu và dùng cấu trúc theo thói quen."}</p>
          </div>

          <div className="ai-v3-node-section">
            <h3><Icon name="emoji_events" /> Tầm quan trọng Tuyển sinh 10</h3>
            <p>Xuất hiện thường xuyên trong đề thi; ảnh hưởng trực tiếp đến vùng điểm mục tiêu.</p>
          </div>

          <Button className="w-full" onClick={() => onNavigate(routePath("tu-giai"))}><Icon name="play_arrow" />Luyện tập kiến thức này</Button>
          <Button variant="secondary" className="w-full" onClick={() => onNavigate(routePath("replay"))}><Icon name="history" />Xem Thinking Replay</Button>
        </aside>
      </div>

      <section className="grid gap-3 md:grid-cols-4">
        {[
          ["bar_chart", "Lực nắm bắt tổng thể", "82 / 100 PTS", "+12%"],
          ["warning", "Lỗ hổng nền tảng", "3 điểm cần vá", "Giảm 2"],
          ["emoji_events", "Dự phóng điểm tuyển sinh", "8.75 – 9.25", "Theo tiến độ"],
          ["target", "Mục tiêu của bạn", "≥ 9.0 điểm", "Tuyển sinh 10"],
        ].map(([icon, label, value, note]) => (
          <div key={label} className="ai-v3-stat-tile ai-v3-stat-tile--horizontal">
            <span><Icon name={icon} /></span><div><b>{label}</b><strong>{value}</strong><small>{note}</small></div>
          </div>
        ))}
      </section>
    </div>
  );
}
