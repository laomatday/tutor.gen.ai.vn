import { Button, Card, Icon, Progress } from "../../components/ui";
import { useCurriculum } from "../../context/CurriculumContext";
import { getCourseProgress, lessonHref, primaryEnrollment, studentProfile } from "../curriculum";
import { practiceProblem } from "../practice/data";
import { storageKeys } from "../../config/storage";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { createPracticeSession, isPracticeSession, type PracticeSession } from "../practice/domain";
import { RichMathText } from "../../components/MathLatex";

interface TodayViewProps {
  onNavigate: (path: string) => void;
  onOpenBadges?: () => void;
  gpBalance: number;
  dailyGp: number;
  onEarnGp: (amount: number, reason: string) => void;
}

/** Mission dashboard uses published lessons and recorded actions; no speculative AI scores. */
export function TodayView({ onNavigate, onOpenBadges, gpBalance }: TodayViewProps) {
  const { subjects, lessons, topics, completedLessonIds } = useCurriculum();
  const [session] = useLocalStorage<PracticeSession>(
    storageKeys.practiceSessionV2, createPracticeSession(practiceProblem.id), isPracticeSession,
  );
  const primary = getCourseProgress(lessons, topics, completedLessonIds, primaryEnrollment);
  const courses = studentProfile.enrollments
    .map((enrollment) => ({
      enrollment,
      subject: subjects.find((item) => item.id === enrollment.subjectId),
      progress: getCourseProgress(lessons, topics, completedLessonIds, enrollment),
    }))
    .filter((entry) => entry.subject && entry.progress.total > 0);
  const nextLesson = primary.nextLesson ?? courses.find((entry) => entry.progress.nextLesson)?.progress.nextLesson;
  const firstName = studentProfile.name.trim().split(" ").at(-1) || "bạn";
  const canPractice = courses.some((entry) => entry.progress.lessons.some((lesson) => lesson.id === practiceProblem.lessonId));
  const attempts = session.problemId === practiceProblem.id
    ? (session.events ?? []).filter((event) => event.kind === "check" || event.kind === "submit")
    : [];
  const errors = attempts.filter((event) => event.valid === false).length;
  const queue = courses.flatMap((entry) => entry.progress.lessons)
    .filter((lesson) => !completedLessonIds.includes(lesson.id)).slice(0, 3);
  const stages = nextLesson ? [
    { label: "Hiểu kiến thức", description: nextLesson.theory[0]?.heading ?? "Đọc lý thuyết", stage: "theory" as const, icon: "menu_book" },
    { label: "Quan sát ví dụ", description: nextLesson.examples[0]?.title ?? "Xem cách vận dụng", stage: "examples" as const, icon: "lightbulb" },
    { label: "Tự thực hành", description: String(nextLesson.exercises.length) + " câu luyện tập", stage: "exercises" as const, icon: "edit_square" },
  ] : [];

  return (
    <div className="learning-os-page ai-v3-page advanced-workspace">
      <section className="ai-v3-hero advanced-hero">
        <div className="ai-v3-hero__copy">
          <p className="ai-v3-eyebrow">NHỊP HỌC HÔM NAY · THEO DỮ LIỆU ĐÃ GHI NHẬN</p>
          <h1>Chào {firstName}, cùng học tiếp nhé!</h1>
          <p className="ai-v3-hero__lead">
            {nextLesson ? "Một nhiệm vụ rõ ràng, ba bước để tự làm chủ kiến thức." : "Em đã hoàn thành các bài hiện có. Hãy mở môn học để ôn tập."}
          </p>
          <p className="mt-3 text-sm leading-6 text-ink-600">
            Hiển thị tiến độ bài học và thao tác thật, không sử dụng điểm năng lực hay chẩn đoán AI giả.
          </p>
        </div>
        <div className="advanced-hero__signal">
          <div className="advanced-progress-ring" style={{ "--progress": primary.percent + "%" } as React.CSSProperties}>
            <span>{primary.percent}%</span>
          </div>
          <div><strong>Tiến độ môn chính</strong><small>{primary.completed}/{primary.total} bài · Lớp {primaryEnrollment.gradeId}</small></div>
        </div>
      </section>

      <div className="ai-v3-dashboard-grid">
        <div className="min-w-0 space-y-5">
          {nextLesson ? (
            <section className="ai-v3-card advanced-mission">
              <div className="ai-v3-card__head">
                <div>
                  <p className="ai-v3-eyebrow"><Icon name="target" /> NHIỆM VỤ TIẾP THEO</p>
                  <h2 className="ai-v3-section-title">{nextLesson.title}</h2>
                  <p className="ai-v3-section-copy">{nextLesson.summary}</p>
                </div>
                <span className="ai-v3-status"><Icon name="schedule" /> {nextLesson.durationMinutes} phút theo học liệu</span>
              </div>
              <ol className="advanced-mission__stages">
                {stages.map((stage, index) => (
                  <li key={stage.stage}>
                    <Button variant="surface" className="advanced-stage" onClick={() => onNavigate(lessonHref(nextLesson, stage.stage))}
                      aria-label={stage.label + " — " + nextLesson.title}>
                      <span className="advanced-stage__number">{String(index + 1).padStart(2, "0")}</span>
                      <span className="min-w-0 flex-1 text-left"><strong>{stage.label}</strong><small>{stage.description}</small></span>
                      <Icon name={stage.icon} />
                    </Button>
                  </li>
                ))}
              </ol>
              <div className="advanced-mission__actions">
                <Button size="lg" onClick={() => onNavigate(lessonHref(nextLesson))}><Icon name="play_arrow" /> Bắt đầu nhiệm vụ</Button>
                <span className="text-xs text-ink-500">Chủ đề: {topics.find((topic) => topic.id === nextLesson.topicId)?.title ?? nextLesson.title}</span>
              </div>
              {nextLesson.examples[0] && (
                <div className="advanced-preview">
                  <p className="ai-v3-eyebrow">XEM TRƯỚC VÍ DỤ · CHƯA HIỂN THỊ LỜI GIẢI</p>
                  <div className="mt-3 text-sm leading-7 text-ink-700"><RichMathText text={nextLesson.examples[0].prompt} /></div>
                </div>
              )}
            </section>
          ) : (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-brand">Đã hoàn thành các bài hiện có</h2>
              <p className="mt-2 text-sm text-ink-600">Em có thể xem lại môn học hoặc chọn bài để ôn tập.</p>
              <Button className="mt-4" onClick={() => onNavigate("/hoc-bai")}>Mở môn học</Button>
            </Card>
          )}
          <section className="ai-v3-card">
            <div className="ai-v3-card__head">
              <div><p className="ai-v3-eyebrow"><Icon name="account_tree" /> HÀNG ĐỢI HỌC TẬP</p><h2 className="ai-v3-section-title">Các bài cần học tiếp</h2></div>
              <Button variant="secondary" size="sm" onClick={() => onNavigate("/hoc-bai")}>Bản đồ tri thức <Icon name="arrow_forward" /></Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {queue.map((lesson, index) => (
                <Button variant="surface" key={lesson.id} className="ai-v3-queue-card ui-card-link" onClick={() => onNavigate(lessonHref(lesson))}>
                  <span className="ai-v3-queue-card__index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1"><strong>{lesson.title}</strong><small>{subjects.find((item) => item.id === lesson.subjectId)?.name} · {lesson.durationMinutes} phút</small></span>
                  <Icon name="chevron_right" />
                </Button>
              ))}
              {!queue.length && <p className="text-sm text-ink-600">Không còn bài chưa hoàn thành trong các môn đăng ký.</p>}
            </div>
          </section>
        </div>
        <aside className="space-y-5" aria-label="Tình trạng học tập">
          <section className="ai-v3-card">
            <p className="ai-v3-eyebrow"><Icon name="bar_chart" /> TIẾN ĐỘ THEO MÔN</p>
            <h2 className="ai-v3-section-title">Hồ sơ học tập</h2>
            <p className="ai-v3-section-copy">Theo số bài đã hoàn thành — không phải điểm năng lực.</p>
            <div className="mt-5 space-y-5">
              {courses.map(({ enrollment, subject, progress }) => (
                <div key={enrollment.subjectId}>
                  <div className="flex justify-between gap-2 text-sm"><strong>{subject!.name} · Lớp {enrollment.gradeId}</strong><strong>{progress.percent}%</strong></div>
                  <Progress value={progress.completed} max={progress.total} label={"Tiến độ " + subject!.name} className="mt-2" tone="accent"/>
                  <p className="mt-2 text-xs text-ink-600">{progress.completed}/{progress.total} bài hoàn thành</p>
                </div>
              ))}
            </div>
            {onOpenBadges && <Button variant="ghost" size="sm" className="mt-4" onClick={onOpenBadges}>Hồ sơ điểm thưởng (minh họa) · {gpBalance} GP</Button>}
          </section>
          <section className="ai-v3-card ai-v3-coach-panel">
            <p className="ai-v3-eyebrow"><Icon name="psychology" /> NHẬT KÝ TỰ GIẢI</p>
            <h2 className="ai-v3-section-title">Luyện tập theo tiến trình</h2>
            <p>{attempts.length ? ("Đã ghi nhận " + attempts.length + " lượt kiểm tra/nộp bài; " + errors + " lần cần sửa.") : "Chưa có lượt giải bài để phân tích cách làm. Hãy bắt đầu một bài cụ thể."}</p>
            {canPractice && <Button variant="secondary" onClick={() => onNavigate("/tu-giai?problem=" + practiceProblem.id)}><Icon name="edit_square" /> Mở bài luyện tập</Button>}
            {attempts.length > 0 && <Button variant="ghost" className="mt-2" onClick={() => onNavigate("/replay?problem=" + practiceProblem.id)}><Icon name="history" /> Xem lại bài làm</Button>}
          </section>
        </aside>
      </div>
    </div>
  );
}
