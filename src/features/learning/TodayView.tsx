import { Button, Icon } from "../../components/ui";
import { useCurriculum } from "../../context/CurriculumContext";
import { getCourseProgress, lessonHref, studentProfile } from "../curriculum";
import { practiceProblem } from "../practice/data";

interface TodayViewProps {
  onNavigate: (path: string) => void;
  onOpenBadges?: () => void;
  gpBalance: number;
  dailyGp: number;
  onEarnGp: (amount: number, reason: string) => void;
}

/** First viewport must show a real next lesson rather than demo cognitive scores. */
export function TodayView({ onNavigate, onOpenBadges, gpBalance }: TodayViewProps) {
  const { subjects, lessons, topics, completedLessonIds } = useCurriculum();
  const progress = getCourseProgress(lessons, topics, completedLessonIds);
  const courses = studentProfile.enrollments
    .map((enrollment) => ({
      enrollment,
      subject: subjects.find((item) => item.id === enrollment.subjectId),
      progress: getCourseProgress(lessons, topics, completedLessonIds, enrollment),
    }))
    .filter((entry) => Boolean(entry.subject) && entry.progress.total > 0);
  const firstName = studentProfile.name.trim().split(" ").at(-1) || "bạn";
  const lesson = progress.nextLesson;

  return (
    <div className="learning-os-page learning-mvp-page">
      <section className="learning-mvp-hero">
        <div className="min-w-0">
          <p className="learning-mvp-kicker">NHIỆM VỤ HÔM NAY</p>
          <h1>Chào {firstName}, bắt đầu học nhé!</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
            {lesson ? "Tiếp tục từ bài học chưa hoàn thành. Mỗi bước học được ghi nhận từ kết quả làm bài của bạn." : "Bạn đã hoàn thành các bài học hiện có. Hãy mở lộ trình để ôn tập."}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => onNavigate(lesson ? lessonHref(lesson) : "/hoc-bai")}>
              <Icon name="play_arrow" />
              {lesson ? "Tiếp tục bài học" : "Xem lộ trình"}
            </Button>
            <span className="text-sm font-semibold text-ink-600">{progress.completed}/{progress.total} bài đã hoàn thành</span>
          </div>
        </div>
      </section>

      {lesson && (
        <section className="learning-mvp-card">
          <p className="learning-mvp-kicker">BÀI HỌC TIẾP THEO</p>
          <h2 className="mt-2 text-xl font-extrabold text-brand">{lesson.title}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-600">{lesson.summary}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-500">
            <span><Icon name="schedule" className="inline h-4 w-4" /> {lesson.durationMinutes} phút</span>
            <span>{lesson.exercises.length} câu luyện tập</span>
          </div>
        </section>
      )}

      <section className="learning-mvp-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-brand">Lộ trình của bạn</h2>
          <Button variant="ghost" size="sm" onClick={() => onNavigate("/hoc-bai")}>Tất cả môn học <Icon name="arrow_forward" /></Button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {courses.map(({ enrollment, subject, progress: course }) => (
            <div key={`${enrollment.gradeId}-${enrollment.subjectId}`} className="learning-mvp-course">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon name={subject!.icon} className="h-5 w-5 text-brand" />
                  <strong>{subject!.name} · Lớp {enrollment.gradeId}</strong>
                </div>
                <span className="text-xs font-bold text-ink-600">{course.percent}%</span>
              </div>
              <div className="learning-mvp-progress"><span style={{ width: `${course.percent}%` }} /></div>
              <p className="mt-2 text-xs text-ink-500">{course.completed}/{course.total} bài đã hoàn thành</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() =>
                onNavigate(course.nextLesson ? lessonHref(course.nextLesson) : `/hoc-bai?grade=${enrollment.gradeId}&subject=${enrollment.subjectId}`)}>
                {course.nextLesson ? "Học tiếp" : "Xem lại môn học"} <Icon name="arrow_forward" />
              </Button>
            </div>
          ))}
          {!courses.length && <p>Chưa có môn học được xuất bản trong chương trình đã đăng ký.</p>}
        </div>
      </section>

      <section className="learning-mvp-card">
        <h2 className="text-xl font-extrabold text-brand">Luyện tập tự giải</h2>
        <p className="mt-2 text-sm leading-6 text-ink-600">{practiceProblem.title} · {practiceProblem.course}. Phản hồi dựa trên bộ kiểm tra toán học của bài mẫu, chưa sử dụng AI.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => onNavigate(`/tu-giai?problem=${practiceProblem.id}`)}>
            <Icon name="edit_square" /> Mở bài luyện tập
          </Button>
          {onOpenBadges && <Button variant="ghost" onClick={onOpenBadges}>Hồ sơ · {gpBalance} GP (minh họa)</Button>}
        </div>
      </section>
    </div>
  );
}
