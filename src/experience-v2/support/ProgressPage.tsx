import { Button, Icon, Progress } from "../../components/ui";
import { useCurriculum } from "../../context/CurriculumContext";
import { courseHref, getCourseProgress, lessonHref, studentProfile } from "../../features/curriculum";
import { useStudyJourney } from "../../features/learning/studyJourney";
import { SupportHeader } from "./SupportUI";
import "./support-ui.css";

interface Props {
  onNavigate: (path: string) => void;
  onOpenProfile: () => void;
}

export function ProgressPage({ onNavigate, onOpenProfile }: Props) {
  const { lessons, topics, subjects, completedLessonIds } = useCurriculum();
  const journey = useStudyJourney();
  const overall = getCourseProgress(lessons, topics, completedLessonIds);
  const courses = studentProfile.enrollments
    .map((enrollment) => ({
      enrollment,
      subject: subjects.find((subject) => subject.id === enrollment.subjectId),
      progress: getCourseProgress(lessons, topics, completedLessonIds, enrollment),
    }))
    .filter((item) => item.subject && item.progress.total > 0);

  const bestDay = Math.max(1, ...journey.weekDays.map((day) => day.attempts));

  return (
    <div className="v2-support-page v2-progress-page">
      <SupportHeader
        icon="bar_chart"
        eyebrow="Tiến bộ có bằng chứng"
        title="Hành trình của em"
        description="Theo dõi những bài đã hoàn thành và các lượt tự kiểm tra có dữ liệu — không đoán mức độ thành thạo."
      >
        <Button className="v2-support-on-hero" onClick={onOpenProfile}>
          <Icon name="person" /> Hồ sơ học tập
        </Button>
      </SupportHeader>

      <section className="v2-support-stats" aria-label="Tổng quan hoạt động được ghi nhận">
        <div className="v2-support-stat">
          <span><Icon name="menu_book" /> Bài đã hoàn thành</span>
          <strong>{overall.completed}<small> / {overall.total} bài</small></strong>
          <p>Theo bài đã xuất bản trong môn đăng ký</p>
        </div>
        <div className="v2-support-stat">
          <span><Icon name="edit_square" /> Lượt tự kiểm tra</span>
          <strong>{journey.totalAttempts}</strong>
          <p>Từ các phiên giải còn được lưu</p>
        </div>
        <div className="v2-support-stat">
          <span><Icon name="verified_user" /> Lượt tự sửa đúng</span>
          <strong>{journey.corrections}</strong>
          <p>Có lượt kiểm tra sai trước khi đúng</p>
        </div>
      </section>

      <div className="v2-support-grid v2-support-grid--progress">
        <section className="v2-support-panel v2-support-course-progress" aria-labelledby="v2-course-progress-title">
          <div className="v2-support-panel-heading">
            <div>
              <p className="v2-support-eyebrow">Theo học liệu đã xuất bản</p>
              <h2 id="v2-course-progress-title">Tiến độ từng môn</h2>
            </div>
            <Button variant="ghost" onClick={() => onNavigate("/hoc-bai")}>
              Mở bản đồ tri thức <Icon name="arrow_forward" />
            </Button>
          </div>
          {courses.length ? (
            <div className="v2-support-course-list">
              {courses.map(({ enrollment, subject, progress }) => (
                <article key={`${enrollment.gradeId}:${enrollment.subjectId}`} className="v2-support-course">
                  <div className="v2-support-course-icon"><Icon name={subject!.icon} /></div>
                  <div className="v2-support-course-body">
                    <div className="v2-support-course-topline">
                      <h3>{subject!.name} · Lớp {enrollment.gradeId}</h3>
                      <span>{progress.completed}/{progress.total} bài</span>
                    </div>
                    <Progress
                      label={`Tiến độ bài học ${subject!.name}`}
                      value={progress.completed}
                      max={progress.total}
                      tone={enrollment.subjectId === "toan" ? "primary" : "accent"}
                    />
                    <p>{progress.nextLesson?.title ?? "Các bài hiện có đã hoàn thành"}</p>
                    <Button
                      variant="ghost"
                      onClick={() => onNavigate(
                        progress.nextLesson
                          ? lessonHref(progress.nextLesson)
                          : courseHref(enrollment.gradeId, enrollment.subjectId),
                      )}
                    >
                      {progress.nextLesson ? "Học bài tiếp theo" : "Ôn lại chủ đề"}
                      <Icon name="arrow_forward" />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="v2-support-empty">
              <Icon name="school" />
              <p>Chưa có bài học đã xuất bản trong các môn đang đăng ký.</p>
              <Button onClick={() => onNavigate("/hoc-bai")}>Khám phá môn học</Button>
            </div>
          )}
        </section>

        <section className="v2-support-panel v2-support-rhythm" aria-labelledby="v2-progress-rhythm-title">
          <div className="v2-support-panel-heading">
            <div>
              <p className="v2-support-eyebrow">Theo lượt tự kiểm tra đã lưu</p>
              <h2 id="v2-progress-rhythm-title">Nhịp học tuần này</h2>
            </div>
          </div>
          <div
            className="v2-support-week"
            role="img"
            aria-label={`Có ${journey.activeDays} ngày học với ${journey.todayAttempts} lượt kiểm tra hôm nay`}
          >
            {journey.weekDays.map((day) => (
              <div key={day.key} data-today={day.isToday} data-active={day.active} className="v2-support-week-day">
                <div className="v2-support-week-plot">
                  <span style={{ height: `${day.attempts ? Math.max(18, Math.round(day.attempts / bestDay * 100)) : 5}%` }} />
                </div>
                <span>{day.label}</span>
              </div>
            ))}
          </div>
          <div className="v2-support-rhythm-caption">
            <span><strong>{journey.activeDays}/7</strong> ngày có lượt kiểm tra</span>
            <span><strong>{journey.todayAttempts}</strong> lượt hôm nay</span>
          </div>
          <p className="v2-support-footnote">Không tính thời gian tập trung hay ngày học chỉ từ việc mở ứng dụng.</p>
          <Button variant="secondary" onClick={() => onNavigate("/thoi-khoa-bieu")}>
            Xem lịch học <Icon name="arrow_forward" />
          </Button>
        </section>
      </div>

      <section className="v2-support-panel v2-support-review" aria-labelledby="v2-progress-next-title">
        <div className="v2-support-panel-heading">
          <div>
            <p className="v2-support-eyebrow">Hành động tiếp theo</p>
            <h2 id="v2-progress-next-title">{journey.savedMistakes > 0 ? "Ôn lại các lỗi đã lưu" : "Thử một bài để ghi lại quá trình"}</h2>
          </div>
          <span className="v2-support-pill">{journey.savedMistakes} lỗi được đánh dấu</span>
        </div>
        <p>Thinking Replay giúp xem lại từng lượt kiểm tra và cách em điều chỉnh lời giải.</p>
        <div className="v2-support-actions">
          {journey.recentProblemId ? (
            <Button onClick={() => onNavigate(`/replay?problem=${encodeURIComponent(journey.recentProblemId!)}`)}>
              <Icon name="history" /> Xem Thinking Replay
            </Button>
          ) : (
            <Button onClick={() => onNavigate("/tu-giai")}>
              <Icon name="edit_square" /> Mở Focus Studio
            </Button>
          )}
          <Button variant="secondary" onClick={() => onNavigate("/hoc-bai")}>
            Khám phá bài học <Icon name="arrow_forward" />
          </Button>
        </div>
      </section>
      <p className="v2-support-integrity"><Icon name="info" /> Hồ sơ lớp/môn hiện là dữ liệu minh họa; chỉ số hoàn thành và lượt tự giải được tính từ nội dung và phiên đã lưu trên thiết bị này. Chưa có kết quả thi thật hoặc mastery được xác minh.</p>
    </div>
  );
}
