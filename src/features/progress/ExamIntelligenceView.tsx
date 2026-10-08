import { Button, Icon, Progress } from "../../components/ui";
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
        <h1>Tiến bộ của bạn</h1>
        <p>
          Hiển thị số bài bạn đã hoàn thành, không suy ra “mastery”, điểm thi dự
          đoán hoặc năng lực khi chưa có dữ liệu đánh giá phù hợp.
        </p>
      </header>
      <section className="learning-mvp-card">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-brand">Tổng tiến độ</h2>
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
        <h2 className="text-lg font-bold text-brand">
          Bài thi mẫu (dữ liệu minh họa)
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-600">
          Đây là dữ liệu được biên soạn để minh họa phương pháp phản hồi, chưa
          phải kết quả thi của học sinh.
        </p>
        <details className="mt-3 rounded-xl border border-ink-200 p-4">
          <summary className="cursor-pointer font-semibold">
            Xem thông tin bài thi mẫu
          </summary>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <p>Đề: {sampleAssessment.title}</p>
            <p>
              Điểm mẫu: {sampleAssessment.score}/{sampleAssessment.maximumScore}
            </p>
            <p>Điểm mất trong mẫu: {summary.recoverablePoints}</p>
            <p>Các nhóm cần hỗ trợ (mẫu): {summary.developingSkills.length}</p>
          </div>
        </details>
        {onOpenBadges && (
          <Button variant="ghost" className="mt-3" onClick={onOpenBadges}>
            Xem hồ sơ điểm thưởng minh họa
          </Button>
        )}
      </section>
    </div>
  );
}
