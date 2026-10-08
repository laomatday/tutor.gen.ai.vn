import { Button, DemoDataNotice, Icon, Progress } from "../../components/ui";
import { useCurriculum } from "../../context/CurriculumContext";
import {
  courseHref,
  getCourseProgress,
  lessonHref,
  studentProfile,
} from "../curriculum";
import { assessmentSummary, sampleAssessment } from "./data";

interface Props {
  onNavigate: (path: string) => void;
  onOpenBadges?: () => void;
}

/** Completion is real local learning progress; test scores are explicitly sample data. */
export function ExamIntelligenceView({ onNavigate, onOpenBadges }: Props) {
  const { lessons, topics, subjects, completedLessonIds } = useCurriculum();
  const progress = getCourseProgress(lessons, topics, completedLessonIds);
  const plans = studentProfile.enrollments
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
  const summary = assessmentSummary(sampleAssessment);
  return (
    <div className="learning-os-page learning-mvp-page">
      <header className="learning-mvp-page-heading">
        <p className="learning-mvp-kicker">KẾT QUẢ HỌC TẬP</p>
        <h1>Tiến bộ</h1>
        <p>
          Theo dõi số bài học và bài tập em đã hoàn thành ở từng môn. Ghi nhận
          trung thực từng bước tiến bộ của em.
        </p>
      </header>
      <section className="learning-mvp-card">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-brand">Tiến độ tổng thể</h2>
          <strong className="text-2xl text-brand">{progress.percent}%</strong>
        </div>
        <Progress
          className="mt-3"
          value={progress.completed}
          max={progress.total}
          label="Tổng tiến độ bài học"
          tone="accent"
        />
        <p className="mt-3 text-sm text-ink-600">
          {progress.completed}/{progress.total} bài học đã hoàn thành trong các
          môn đã đăng ký.
        </p>
        {progress.nextLesson && (
          <Button
            className="mt-4"
            onClick={() => onNavigate(lessonHref(progress.nextLesson!))}
          >
            Tiếp tục học <Icon name="arrow_forward" />
          </Button>
        )}
      </section>
      <section
        aria-label="Tiến độ theo môn học"
        className="grid gap-3 md:grid-cols-2"
      >
        {plans.map(({ enrollment, subject, progress: item }) => (
          <div
            className="learning-mvp-card"
            key={`${enrollment.gradeId}-${enrollment.subjectId}`}
          >
            <h2 className="text-lg font-bold text-brand">
              {subject!.name} · Lớp {enrollment.gradeId}
            </h2>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm">
                {item.completed}/{item.total} bài hoàn thành
              </span>
              <strong>{item.percent}%</strong>
            </div>
            <Progress
              className="mt-2"
              value={item.completed}
              max={item.total}
              label={`Tiến độ ${subject!.name} lớp ${enrollment.gradeId}`}
              tone="accent"
            />
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() =>
                onNavigate(
                  item.nextLesson
                    ? lessonHref(item.nextLesson)
                    : courseHref(enrollment.gradeId, enrollment.subjectId),
                )
              }
            >
              {item.nextLesson ? "Học bài tiếp theo" : "Xem lại"}{" "}
              <Icon name="arrow_forward" />
            </Button>
          </div>
        ))}
      </section>
      <section className="learning-mvp-card">
        <DemoDataNotice
          className="mb-4"
          message="Đây là dữ liệu minh họa phương pháp phản hồi, chưa phải kết quả thi thật của bạn."
        />
        <h2 className="text-lg font-bold text-brand">Bài thi thử tham khảo</h2>
        <p className="mt-2 text-sm leading-6 text-ink-600">
          Minh họa cách hệ thống phân tích chi tiết các kỹ năng và điểm cần củng
          cố sau mỗi bài thi.
        </p>
        <details className="mt-3 rounded-xl border border-ink-200 p-4">
          <summary className="cursor-pointer font-semibold">
            Xem phân tích bài thi
          </summary>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <p>Đề: {sampleAssessment.title}</p>
            <p>
              Điểm số: {sampleAssessment.score}/{sampleAssessment.maximumScore}
            </p>
            <p>Điểm có thể cải thiện: {summary.recoverablePoints}</p>
            <p>
              Nhóm kỹ năng cần luyện thêm: {summary.developingSkills.length}
            </p>
          </div>
        </details>
        {onOpenBadges && (
          <Button variant="ghost" className="mt-3" onClick={onOpenBadges}>
            Xem huy hiệu và điểm thưởng
          </Button>
        )}
      </section>
    </div>
  );
}
