import { useCurriculum } from "../../context/CurriculumContext";
import { Button, Icon, Progress } from "../../components/ui";
import { AdaptiveText } from "../../components/AdaptiveText";
import {
  getCourseProgress,
  lessonHref,
  primaryEnrollment,
  studentProfile,
} from "../../features/curriculum";
import { getPracticeProblems, practicePolicy } from "../../features/practice/data";
import { getEnrolledPracticeProblems } from "../../features/practice/eligibility";
import { getPracticeStats } from "../../features/practice/domain";
import { buildCoursePath } from "../../features/learning/coursePath";
import { practiceHref } from "../../features/learning/discovery";
import { useStudyJourney } from "../../features/learning/studyJourney";
import { selectDiscovery } from "../../features/learning/lessonDiscovery";
import { V2MiniLab } from "../components/V2MiniLab";
import "../pages/mission-control.css";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export function MissionControlPage({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  const { lessons, topics, subjects, completedLessonIds } = useCurriculum();
  const journey = useStudyJourney();
  const enrolledCourses = studentProfile.enrollments.map((course) => ({
    course,
    progress: getCourseProgress(lessons, topics, completedLessonIds, course),
  }));
  const primary = enrolledCourses.find(
    (item) =>
      item.course.gradeId === primaryEnrollment.gradeId &&
      item.course.subjectId === primaryEnrollment.subjectId,
  )?.progress;
  const overall = getCourseProgress(lessons, topics, completedLessonIds);
  const nextLesson = primary?.nextLesson ?? overall.nextLesson;
  const nextSubject = subjects.find((subject) => subject.id === nextLesson?.subjectId);
  const shortName = studentProfile.name.trim().split(/\s+/).slice(-2).join(" ") || "bạn";
  const firstExample = nextLesson?.examples?.[0];
  const path = buildCoursePath(
    topics,
    lessons,
    completedLessonIds,
    primaryEnrollment,
  );
  const pathSteps = path.units.flatMap((unit) => unit.steps);
  const currentIndex = Math.max(
    0,
    pathSteps.findIndex((item) => item.state === "current"),
  );
  const firstStep = Math.max(0, Math.min(currentIndex - 1, pathSteps.length - 5));
  const previewSteps = pathSteps.slice(firstStep, firstStep + 5);
  const problems = getEnrolledPracticeProblems(
    getPracticeProblems(),
    studentProfile.enrollments,
  );
  const practice =
    problems.find((item) => item.id === journey.recentProblemId) ??
    problems.find((item) => item.id === practicePolicy.defaultStudioProblemId) ??
    problems[0];
  const lastStats = getPracticeStats(journey.recentSession ?? undefined);
  const hasReplay = !!journey.recentProblemId && lastStats.checks.length > 0;
  const replayPath = hasReplay && journey.recentProblemId
    ? practiceHref(journey.recentProblemId, true)
    : practice ? practiceHref(practice.id) : "/hoc-bai";
  const labLesson = enrolledCourses
    .flatMap((item) => item.progress.lessons)
    .find((lesson) => selectDiscovery(lesson)?.model?.kind === "parabola");

  const nextDestination = nextLesson ? lessonHref(nextLesson) : "/hoc-bai";
  const practiceDestination = practice ? practiceHref(practice.id) : "/hoc-bai";

  return (
    <div className="v2-mission-page">
      <header className="v2-home-hero">
        <div className="v2-hero-scene" aria-hidden="true" />
        <div className="v2-home-hero-copy">
          <h1>{greeting()}, <em>{shortName}!</em> <span aria-hidden="true">👋</span></h1>
          <p>Hôm nay là một cơ hội tuyệt vời để học điều mới.<br className="v2-home-hero-break" /> Kiến thức hôm nay sẽ mở ra những cánh cửa lớn hơn cho ngày mai. ✨</p>
          <div className="v2-home-metrics" aria-label="Hoạt động học tập có dữ liệu">
            <div>
              <Icon name="auto_stories" />
              <span><strong>{primary?.completed ?? 0}/{primary?.total ?? 0}</strong><small>Bài học đã hoàn thành</small></span>
            </div>
            <div>
              <Icon name="bar_chart" />
              <span><strong>{journey.totalAttempts}</strong><small>Lượt tự kiểm tra đã lưu</small></span>
            </div>
            <div>
              <Icon name="stars" />
              <span><strong>{journey.corrections}</strong><small>Lần tự sửa đúng</small></span>
            </div>
          </div>
        </div>
      </header>

      <div className="v2-home-main-grid">
        <div className="v2-home-primary-col">
          <section className="v2-next-mission" aria-labelledby="v2-next-title">
            <div className="v2-section-top">
              <h2 id="v2-next-title"><Icon name="track_changes" /> Nhiệm vụ tiếp theo</h2>
              <Button variant="ghost" onClick={() => onNavigate("/hoc-bai")}>
                Xem lộ trình <Icon name="arrow_forward" />
              </Button>
            </div>
            <div className="v2-mission-surface">
              <div className="v2-mission-text">
                <div className="v2-mission-tags">
                  <span><Icon name="school" /> {nextSubject?.name ?? "Môn học"}</span>
                  <span>Lớp {nextLesson?.gradeId ?? studentProfile.gradeId}</span>
                </div>
                <h3>{nextLesson?.title ?? "Chọn một chủ đề để học tiếp"}</h3>
                <p>{firstExample?.prompt ? <AdaptiveText text={firstExample.prompt} /> : nextLesson?.summary ?? "Các bài đang có đã hoàn thành. Em có thể chọn một chủ đề để ôn lại."}</p>
                <div className="v2-mission-footer">
                  {nextLesson && nextLesson.durationMinutes > 0 && (
                    <span className="v2-mission-duration"><Icon name="timer" /> {nextLesson.durationMinutes} phút</span>
                  )}
                  <Button onClick={() => onNavigate(nextDestination)} className="v2-mission-primary">
                    {nextLesson ? "Bắt đầu ngay" : "Xem môn học"}
                    <Icon name="arrow_forward" />
                  </Button>
                </div>
              </div>
              <div className="v2-root-symbol" aria-hidden="true"><span>√x</span><i /><i /></div>
            </div>
          </section>

          <section className="v2-choices" aria-labelledby="v2-choices-title">
            <h2 id="v2-choices-title"><Icon name="group" /> Chọn cách học hôm nay</h2>
            <div className="v2-choices-grid">
              <Button
                className="v2-choice"
                onClick={() => onNavigate(nextDestination)}
              >
                <span className="v2-choice-icon v2-choice-icon--idea"><Icon name="lightbulb" /></span>
                <span><strong>Khám phá<br /> ý tưởng mới</strong><small>Khám phá kiến thức qua ví dụ trực quan, sinh động</small></span>
                <Icon name="chevron_right" />
              </Button>
              <Button className="v2-choice" onClick={() => onNavigate(practiceDestination)}>
                <span className="v2-choice-icon v2-choice-icon--try"><Icon name="edit_square" /></span>
                <span><strong>Tự giải thử</strong><small>Luyện tập với bài tập được cá nhân hóa theo bài đã chọn</small></span>
                <Icon name="chevron_right" />
              </Button>
              <Button className="v2-choice" onClick={() => onNavigate(replayPath)}>
                <span className="v2-choice-icon v2-choice-icon--replay"><Icon name="history" /></span>
                <span><strong>{hasReplay ? "Xem lại lỗi sai" : "Xem lại lỗi sai"}</strong><small>{hasReplay ? "Nhìn lại những lần thử đã lưu" : "Bắt đầu một lần tự giải để xem lại tiến trình"}</small></span>
                <Icon name="chevron_right" />
              </Button>
            </div>
          </section>
        </div>

        {labLesson ? (
          <V2MiniLab key={labLesson.id} lesson={labLesson} onOpen={() => onNavigate(lessonHref(labLesson))} />
        ) : (
          <section className="v2-panel v2-mini-lab" aria-label="Phòng khám phá">
            <header className="v2-panel-head"><h2><Icon name="science" /> Phòng khám phá</h2></header>
            <p>Micro-lab đang được chuẩn bị cho các bài học đã xuất bản.</p>
            <Button onClick={() => onNavigate("/hoc-bai")}>Xem môn học <Icon name="arrow_forward" /></Button>
          </section>
        )}
      </div>

      <div className="v2-home-lower-grid">
        <section className="v2-panel v2-journey" aria-labelledby="v2-journey-title">
          <header className="v2-panel-head">
            <h2 id="v2-journey-title"><Icon name="hub" /> Hành trình của em</h2>
            <Button variant="ghost" onClick={() => onNavigate("/hoc-bai")}>Xem chi tiết <Icon name="arrow_forward" /></Button>
          </header>
          {previewSteps.length ? (
            <ol className="v2-journey-steps">
              {previewSteps.map((item) => (
                <li key={item.lesson.id} data-state={item.state}>
                  <Button
                    variant="ghost"
                    onClick={() => onNavigate(lessonHref(item.lesson))}
                    aria-current={item.state === "current" ? "step" : undefined}
                  >
                    <span className="v2-journey-dot">
                      <Icon name={item.state === "complete" ? "check" : item.state === "current" ? "rocket_launch" : "flag"} />
                    </span>
                    <span>{item.lesson.title}</span>
                  </Button>
                </li>
              ))}
            </ol>
          ) : (
            <div className="v2-inline-empty">Chưa có chặng học phù hợp. <Button onClick={() => onNavigate("/hoc-bai")}>Mở môn học</Button></div>
          )}
          <div className="v2-journey-quote"><Icon name="auto_awesome" /><span>“Kiên trì hôm nay, tự tin ngày mai!”</span><Icon name="arrow_forward" /></div>
          <p className="v2-journey-foot">Các chặng được lấy từ bài học đã xuất bản; không khóa bài chưa học.</p>
        </section>

        <section className="v2-panel v2-rhythm" aria-labelledby="v2-rhythm-title">
          <header className="v2-panel-head">
            <h2 id="v2-rhythm-title"><Icon name="calendar_today" /> Nhịp học tuần này</h2>
          </header>
          <div className="v2-week-bars" role="img" aria-label={`Tuần này đã có ${journey.activeDays} ngày học có lượt kiểm tra`}>
            {journey.weekDays.map((day) => (
              <div key={day.key} className="v2-week-day" data-active={day.active} data-today={day.isToday}>
                <div className="v2-week-bar-track">
                  <span style={{ height: `${Math.min(100, 12 + day.attempts * 23)}%` }} />
                </div>
                <small>{day.label}</small>
              </div>
            ))}
          </div>
          <div className="v2-rhythm-summary">
            <div><strong>{journey.activeDays}/7</strong><small>Ngày có lượt kiểm tra</small></div>
            <div><strong>{journey.totalAttempts}</strong><small>Tổng lượt tự kiểm tra</small></div>
          </div>
          <Button variant="ghost" className="v2-rhythm-footer" onClick={() => onNavigate("/thoi-khoa-bieu")}>
            Xem lịch học <Icon name="arrow_forward" />
          </Button>
        </section>

        <section className="v2-panel v2-challenge" aria-labelledby="v2-challenge-title">
          <header className="v2-panel-head">
            <h2 id="v2-challenge-title"><Icon name="bolt" /> Thử thách hôm nay</h2>
          </header>
          {practice ? (
            <>
              <div className="v2-challenge-feature"><span className="v2-challenge-symbol"><Icon name="workspace_premium" /></span><span><strong>Thử thách tự giải</strong><small>Luyện một bài thật · không dùng thành tích mẫu</small></span></div>
              <h3>{practice.title}</h3>
              <p>{practice.course} {practice.durationMinutes ? `· ${practice.durationMinutes} phút` : ""}</p>
              <p className="v2-challenge-sub">Tự làm, kiểm tra từng bước rồi xem lại quá trình giải.</p>
              <Button className="v2-challenge-cta" onClick={() => onNavigate(practiceHref(practice.id))}>
                Tiếp tục thử thách <Icon name="arrow_forward" />
              </Button>
            </>
          ) : (
            <div className="v2-inline-empty">Chưa có bài luyện phù hợp. <Button onClick={() => onNavigate("/hoc-bai")}>Khám phá môn học</Button></div>
          )}
        </section>
      </div>

      <p className="v2-home-source">
        <Icon name="info" /> Hồ sơ đang là dữ liệu minh họa; tiến độ và lượt kiểm tra được lấy từ học liệu và các lần làm đã lưu trên thiết bị này.
      </p>
    </div>
  );
}
