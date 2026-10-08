import { Button, Icon, Progress } from "../../components/ui";
import { useCurriculum } from "../../context/CurriculumContext";
import {
  courseHref,
  getCourseProgress,
  lessonHref,
  studentProfile,
} from "../curriculum";
import { assessmentSummary, sampleAssessment } from "./data";
import { storageKeys } from "../../config/storage";
import { browserStorage, readStoredValue } from "../../lib/browserStorage";
import { isPracticeSessions, type PracticeSessions } from "../practice/domain";
import { useStudyJourney } from "../learning/studyJourney";
import { summarizeLessonEvidence } from "./evidence";

interface Props {
  onNavigate: (path: string) => void;
  onOpenBadges?: () => void;
}

/** Completion is real local learning progress; test scores are explicitly sample data. */
export function ExamIntelligenceView({ onNavigate, onOpenBadges }: Props) {
  const { lessons, topics, subjects, completedLessonIds } = useCurriculum();
  // useStudyJourney refreshes this screen on focus/storage changes.
  useStudyJourney();
  const localSessions = readStoredValue<PracticeSessions>(
    browserStorage,
    storageKeys.practiceSessionsV3,
    {},
    isPracticeSessions,
  );
  const practiceEvidence = summarizeLessonEvidence(
    lessons,
    completedLessonIds,
    localSessions.value,
  );
  const attempted = practiceEvidence.filter((entry) => entry.studioAttempts > 0);
  const corrections = attempted.reduce((count, entry) => count + entry.corrections, 0);
  const needsReview = attempted.filter((entry) => entry.needsReview);
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
      <section className="learning-mvp-card" aria-label="Quá trình tự sửa trong Focus Studio">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-brand">Những bước em đã thử và tự sửa</h2>
            <p className="mt-2 text-sm text-ink-600">
              Chỉ tổng hợp các lần kiểm tra và nộp bài thực sự lưu trên thiết bị này.
              Đây không phải điểm năng lực hay kết quả thi.
            </p>
          </div>
          <span className="rounded-full bg-surface-container-low px-3 py-2 text-sm font-semibold text-brand">
            {corrections} lần tự sửa
          </span>
        </div>
        {localSessions.error && <p role="status" className="mt-3 text-sm text-warning-700">{localSessions.error}</p>}
        {attempted.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {attempted.map((entry) => {
              const lesson = lessons.find((item) => item.id === entry.lessonId);
              return (
                <article key={entry.lessonId} className="min-w-0 rounded-xl border border-ink-200 p-4">
                  <h3 className="font-semibold text-brand">{lesson?.title ?? "Bài học đã luyện"}</h3>
                  <p className="mt-2 text-sm text-ink-600">
                    {entry.studioAttempts} lần kiểm tra · {entry.validStudioAttempts} lần khớp · {entry.corrections} lần tự sửa
                  </p>
                  <p className="mt-1 text-xs text-ink-600">
                    {entry.needsReview ? "Lần kiểm tra cuối còn bước cần xem lại" : "Lần kiểm tra cuối đã khớp"}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={() => onNavigate(`/hoc-bai?${new URLSearchParams({
                      grade: lesson?.gradeId ?? studentProfile.gradeId,
                      subject: lesson?.subjectId ?? "toan",
                      topic: lesson?.topicId ?? "",
                      lesson: entry.lessonId,
                      stage: "examples",
                    })}`)}
                  >
                    Xem bài liên quan <Icon name="arrow_forward" />
                  </Button>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-600">
            Chưa có lần kiểm tra Focus Studio nào được lưu. Hãy thử một bài để bắt đầu ghi nhận quá trình học.
          </p>
        )}
        {needsReview.length > 0 && (
          <p role="status" className="mt-3 text-sm text-ink-700">
            Có {needsReview.length} bài có lần kiểm tra cuối cần xem lại.
          </p>
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
