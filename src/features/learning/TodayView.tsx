import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  DemoDataNotice,
  Icon,
  Progress,
  Tabs,
} from "../../components/ui";
import { RichMathText } from "../../components/MathLatex";
import { useCurriculum } from "../../context/CurriculumContext";
import {
  courseHref,
  getCourseProgress,
  lessonHref,
  primaryEnrollment,
  studentProfile,
} from "../curriculum";
import { getPracticeProblems, practicePolicy } from "../practice/data";
import { getEnrolledPracticeProblems } from "../practice/eligibility";
import { getPracticeStats } from "../practice/domain";
import { routePath } from "../../config/routes";
import { practiceHref } from "./discovery";
import { useStudyJourney } from "./studyJourney";
import { CourseLearningPath } from "./CourseLearningPath";
import { LessonDiscovery } from "./LessonDiscovery";
import { selectDiscovery } from "./lessonDiscovery";
import { buildCoursePath } from "./coursePath";
import { HomeSquareLab } from "./HomeSquareLab";
import "../../styles/student-discovery.css";
import "../../styles/student-home.css";
import "../../styles/student-home-next.css";

interface TodayViewProps {
  onNavigate: (path: string) => void;
  onOpenBadges?: () => void;
  gpBalance: number;
  dailyGp: number;
  onEarnGp: (amount: number, reason: string) => void;
}

type LearningMood = "learn" | "practice" | "replay";

const learningMoods = [
  { id: "learn", label: "Học mới", icon: "menu_book" },
  { id: "practice", label: "Luyện một bài", icon: "edit_square" },
  { id: "replay", label: "Xem lại", icon: "history" },
] as const;

/**
 * Source-aware homepage: published curriculum, retained attempts and actual
 * device GP only. No artificial AI recommendations, streaks or mastery scores.
 */
export function TodayView({ onNavigate, onOpenBadges, gpBalance }: TodayViewProps) {
  const { subjects, topics, lessons, completedLessonIds } = useCurriculum();
  const [mood, setMood] = useState<LearningMood>("learn");
  const journey = useStudyJourney();
  const recentStats = getPracticeStats(journey.recentSession ?? undefined);
  const evidence = {
    attempts: recentStats.checks,
    selfCorrected: recentStats.corrections,
  };

  const allProgress = getCourseProgress(lessons, topics, completedLessonIds);
  const primaryProgress = getCourseProgress(
    lessons,
    topics,
    completedLessonIds,
    primaryEnrollment,
  );
  const nextLesson = primaryProgress.nextLesson ?? allProgress.nextLesson;
  const nextDiscovery = nextLesson ? selectDiscovery(nextLesson) : null;
  const nextSubject = subjects.find((item) => item.id === nextLesson?.subjectId);
  const nextTopic = topics.find((item) => item.id === nextLesson?.topicId);
  const firstName = studentProfile.name.trim().split(" ").at(-1) || "bạn";

  const courses = studentProfile.enrollments
    .map((enrollment) => ({
      enrollment,
      subject: subjects.find((item) => item.id === enrollment.subjectId),
      progress: getCourseProgress(lessons, topics, completedLessonIds, enrollment),
    }))
    .filter((item) => item.subject && item.progress.total > 0);

  const problems = getEnrolledPracticeProblems(
    getPracticeProblems(),
    studentProfile.enrollments,
  );
  const practice =
    problems.find((item) => item.id === journey.recentProblemId) ??
    problems.find((item) => item.id === practicePolicy.defaultStudioProblemId) ??
    problems[0];
  const recorded =
    !!practice &&
    practice.id === journey.recentSession?.problemId &&
    evidence.attempts.length > 0;
  const recentEvents = recorded ? evidence.attempts.slice(-3) : [];

  // This small visual is an illustration associated with the existing,
  // published and enrolled Grade 9 square-root lesson, not a generic AI lab.
  const squareLesson = lessons.find(
    (lesson) =>
      lesson.id === "can-bac-hai" &&
      lesson.gradeId === "9" &&
      lesson.subjectId === "toan" &&
      lesson.status === "published" &&
      topics.some(
        (topic) =>
          topic.id === lesson.topicId &&
          topic.gradeId === lesson.gradeId &&
          topic.subjectId === lesson.subjectId,
      ) &&
      studentProfile.enrollments.some(
        (course) =>
          course.gradeId === lesson.gradeId &&
          course.subjectId === lesson.subjectId,
      ),
  );

  const missionEnrollment =
    mood === "learn" && nextLesson
      ? { gradeId: nextLesson.gradeId, subjectId: nextLesson.subjectId }
      : mood !== "learn" && practice
        ? { gradeId: practice.gradeId, subjectId: practice.subjectId }
        : primaryEnrollment;
  const missionProgress = getCourseProgress(
    lessons,
    topics,
    completedLessonIds,
    missionEnrollment,
  );
  const missionSubject = subjects.find(
    (item) => item.id === missionEnrollment.subjectId,
  );
  const coursePath = buildCoursePath(
    topics,
    lessons,
    completedLessonIds,
    missionEnrollment,
  );

  const lessonDestination = nextLesson
    ? lessonHref(nextLesson)
    : routePath("hoc-bai");
  const practiceDestination = practice
    ? practiceHref(practice.id)
    : routePath("hoc-bai");

  return (
    <div className="learning-os-page home-hub home-exploration home-next">
      <header className="home-next-hero">
        <div className="home-next-hero-copy">
          <span className="home-next-hero-label">
            <Icon name="auto_awesome" /> Góc học tập chủ động
          </span>
          <h1>Hôm nay</h1>
          <p className="home-next-hero-greeting">
            Chào {firstName}, hôm nay mình khám phá gì?
          </p>
          <p className="home-next-hero-summary">
            {nextLesson ? (
              <>
                Bắt đầu với <strong>{nextLesson.title}</strong> trong môn{" "}
                {nextSubject?.name ?? "đang học"}. Thử ý tưởng của em trước
                khi xem lời giải.
              </>
            ) : (
              "Các bài đã xuất bản trong khóa học hiện tại đều đã hoàn thành. Em có thể chọn một chủ đề khác hoặc tự luyện thêm."
            )}
          </p>
          <div className="home-next-hero-meta">
            <span><Icon name="menu_book" /> {nextSubject?.name ?? "Môn học"} · Lớp {nextLesson?.gradeId ?? studentProfile.gradeId}</span>
            {nextLesson && nextLesson.durationMinutes > 0 && (
              <span><Icon name="schedule" /> {nextLesson.durationMinutes} phút</span>
            )}
            {nextTopic && (
              <span><Icon name="hub" /> {nextTopic.title}</span>
            )}
          </div>
          <div className="home-next-hero-actions">
            <Button
              variant="secondary"
              className="home-next-hero-start"
              onClick={() => onNavigate(lessonDestination)}
            >
              <Icon name="play_arrow" />
              {nextLesson ? "Bắt đầu bài học" : "Khám phá môn học"}
              <Icon name="arrow_forward" />
            </Button>
            <Button
              variant="ghost"
              className="home-next-hero-secondary"
              onClick={() => onNavigate(routePath("hoc-bai"))}
            >
              Xem lộ trình <Icon name="arrow_forward" />
            </Button>
          </div>
        </div>
        <div className="home-next-hero-aside">
          <div className="home-next-hero-progress">
            <span className="home-next-hero-mini-label">Tiến độ môn đang học</span>
            <strong>{primaryProgress.completed}/{primaryProgress.total} bài</strong>
            <Progress
              value={primaryProgress.completed}
              max={primaryProgress.total}
              label="Tiến độ môn học hiện tại"
            />
          </div>
          <div className="home-next-hero-signals">
            <div>
              <Icon name="edit_square" />
              <strong>{journey.totalAttempts}</strong>
              <span>lượt kiểm tra đã lưu</span>
            </div>
            <div>
              <Icon name="verified_user" />
              <strong>{journey.corrections}</strong>
              <span>lần tự sửa đúng</span>
            </div>
          </div>
          {onOpenBadges && (
            <Button
              variant="surface"
              className="home-wallet home-next-wallet"
              onClick={onOpenBadges}
            >
              <Icon name="workspace_premium" />
              <span>
                <strong>{gpBalance} GP</strong>
                <small>Điểm trên thiết bị</small>
              </span>
              <Icon name="chevron_right" />
            </Button>
          )}
        </div>
      </header>

      <div className="home-next-bento-top">
        <section className="home-mission home-next-lab-card" aria-labelledby="home-next-lab-title">
          <div className="home-next-section-heading">
            <div className="home-next-section-icon" aria-hidden="true">
              <Icon name="functions" />
            </div>
            <div>
              <p className="home-next-eyebrow">Khám phá bằng thao tác</p>
              <h2 id="home-next-lab-title">
                {squareLesson ? "Căn bậc hai qua mô hình hình vuông" : "Góc khám phá bài học"}
              </h2>
            </div>
            <Badge tone="info">Math Lab</Badge>
          </div>
          {squareLesson ? (
            <HomeSquareLab onOpenLesson={() => onNavigate(lessonHref(squareLesson))} />
          ) : nextLesson && nextDiscovery ? (
            <div className="home-next-no-square">
              <LessonDiscovery
                lesson={nextLesson}
                compact
                onContinue={() => onNavigate(lessonHref(nextLesson))}
              />
            </div>
          ) : (
            <div className="home-next-empty-lab">
              <Icon name="menu_book" />
              <p>Chưa có mô hình khám phá phù hợp với học liệu hiện tại.</p>
              <Button variant="secondary" onClick={() => onNavigate(routePath("hoc-bai"))}>
                Xem nội dung đã xuất bản <Icon name="arrow_forward" />
              </Button>
            </div>
          )}
          {mood === "learn" && squareLesson && nextLesson && nextDiscovery && (
            <div className="home-micro-lab" aria-label="Kiểm tra ý tưởng của bài học tiếp theo">
              <div className="home-next-discovery-head">
                <p className="home-next-eyebrow">Thử tiếp một ý tưởng</p>
                <span>{nextLesson.title}</span>
              </div>
              <LessonDiscovery
                lesson={nextLesson}
                compact
                onContinue={() => onNavigate(lessonHref(nextLesson))}
              />
              <p className="home-next-preview-note">
                Đây là bản khám phá thử, không cộng điểm hoặc hoàn thành bài.
              </p>
            </div>
          )}
        </section>

        <section className="home-next-modes" aria-labelledby="home-next-modes-title">
          <div className="home-next-section-heading">
            <div className="home-next-section-icon" aria-hidden="true">
              <Icon name="route" />
            </div>
            <div>
              <p className="home-next-eyebrow">Chọn cách học</p>
              <h2 id="home-next-modes-title">Lộ trình & chế độ học</h2>
            </div>
          </div>
          <p className="home-next-modes-intro">
            Học mới, tự thử sức hoặc xem lại lời giải. Mỗi lựa chọn đưa em đến
            một hoạt động thực sự.
          </p>
          <Tabs
            tabs={learningMoods}
            value={mood}
            onChange={setMood}
            variant="pill"
            label="Bạn muốn học thế nào?"
            className="home-next-mode-tabs"
          />
          <div
            className="home-next-mode-detail"
            role="tabpanel"
            aria-label={
              mood === "learn" ? "Học mới" : mood === "practice" ? "Luyện một bài" : "Xem lại"
            }
          >
            {mood === "learn" && (
              <>
                <p className="home-next-mode-kicker"><Icon name="menu_book" /> Bài tiếp theo</p>
                <h3>{nextLesson?.title ?? "Chọn một bài để khám phá"}</h3>
                <p>{nextLesson?.summary ?? "Khám phá một chủ đề và quay lại luyện tập khi sẵn sàng."}</p>
                <Button variant="primary" onClick={() => onNavigate(lessonDestination)}>
                  {nextLesson ? "Mở nội dung bài học" : "Xem môn học"}
                  <Icon name="arrow_forward" />
                </Button>
              </>
            )}
            {mood === "practice" && (
              <>
                <p className="home-next-mode-kicker"><Icon name="edit_square" /> Bài tự giải</p>
                <h3>{practice?.title ?? "Chọn một bài để thử sức"}</h3>
                <p>{practice?.course ?? "Tự giải từng bước"}{practice?.durationMinutes ? ` · ${practice.durationMinutes} phút` : ""}</p>
                {practice?.statement && (
                  <div className="home-next-practice-prompt">
                    <RichMathText text={practice.statement} />
                  </div>
                )}
                <Button variant="primary" onClick={() => onNavigate(practiceDestination)}>
                  {practice ? "Mở bàn tự giải" : "Khám phá bài học"}
                  <Icon name="arrow_forward" />
                </Button>
              </>
            )}
            {mood === "replay" && (
              <>
                <p className="home-next-mode-kicker"><Icon name="history" /> Xem lại cách giải</p>
                <h3>{recorded && practice ? practice.title : "Mỗi lần thử đều đáng lưu lại"}</h3>
                <p>
                  {recorded
                    ? "Dùng những lần kiểm tra đã lưu để tìm ra bước cần điều chỉnh."
                    : "Sau khi thử một bài tự giải, em có thể xem lại những lần thử và cả cách mình tự sửa."}
                </p>
                {recorded && (
                  <ol className="home-replay-notes" aria-label="Lượt kiểm tra mới nhất">
                    {recentEvents.map((event, index) => (
                      <li key={event.id}>
                        <Icon name={event.valid ? "check_circle" : "edit_note"} />
                        <span>
                          <strong>Lần thử {evidence.attempts.length - recentEvents.length + index + 1}</strong>
                          <small>{event.detail}</small>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
                <Button
                  variant="primary"
                  onClick={() =>
                    onNavigate(
                      recorded && practice
                        ? practiceHref(practice.id, true)
                        : practiceDestination,
                    )
                  }
                >
                  {recorded ? "Xem lại cách mình giải" : practice ? "Thử một bài trước nhé" : "Chọn bài để bắt đầu"}
                  <Icon name="arrow_forward" />
                </Button>
              </>
            )}
          </div>
          <div className="home-next-modes-bottom">
            <Icon name="lightbulb" />
            <p>Em không cần giỏi ngay lần đầu. Hãy thử, kiểm tra rồi sửa cách làm của mình.</p>
          </div>
        </section>
      </div>

      <div className="home-next-bento-bottom">
        <Card className="home-rhythm home-next-week-card" aria-label="Nhịp học tuần này">
          <div className="home-next-card-header">
            <span className="home-next-card-symbol"><Icon name="calendar_today" /></span>
            <h2>Nhịp học tuần này</h2>
          </div>
          <p className="home-next-card-desc">
            {journey.activeDays
              ? `Đã có ${journey.activeDays} ngày có lượt kiểm tra được lưu trong tuần.`
              : "Chưa có lượt kiểm tra nào được lưu trong tuần. Bắt đầu theo nhịp của em."}
          </p>
          <ol className="home-week">
            {journey.weekDays.map((day) => (
              <li
                key={day.key}
                className={day.isToday ? "is-today" : ""}
                data-active={day.active}
                aria-label={`${day.label}${day.isToday ? ", hôm nay" : ""}: ${day.attempts} lượt kiểm tra`}
              >
                <span>{day.label}</span>
                <span className="home-day-stamp">
                  {day.active ? (
                    <Icon name="check" />
                  ) : day.isToday ? (
                    <Icon name="add" />
                  ) : (
                    <span className="home-day-dot" />
                  )}
                </span>
                {day.isToday && <small>nay</small>}
              </li>
            ))}
          </ol>
          <div className="home-week-note">
            <Icon name={journey.todayAttempts ? "verified" : "wb_sunny"} />
            <p>
              {journey.todayAttempts
                ? `${journey.todayAttempts} lượt tự kiểm tra hôm nay. Một lần thử cũng là một bước tiến.`
                : "Mỗi ngày có lượt tự kiểm tra sẽ được đánh dấu ở đây. Cứ theo nhịp của bạn."}
            </p>
          </div>
          <Button
            variant="ghost"
            className="home-next-link-bottom"
            onClick={() => onNavigate(routePath("thoi-khoa-bieu"))}
          >
            Sắp xếp lịch học <Icon name="arrow_forward" />
          </Button>
        </Card>

        <section className="home-courses home-next-courses-card" aria-labelledby="home-courses-title">
          <div className="home-next-card-header home-next-card-header--spread">
            <div>
              <p className="home-next-eyebrow">Theo môn đã đăng ký</p>
              <h2 id="home-courses-title">Bạn muốn khám phá môn nào?</h2>
            </div>
            <Button variant="ghost" onClick={() => onNavigate(routePath("hoc-bai"))}>
              Xem tất cả <Icon name="arrow_forward" />
            </Button>
          </div>
          <p className="home-next-card-desc">
            Tiến độ được tính theo bài học đã xuất bản và bài đã hoàn thành.
          </p>
          <div className="home-next-course-list">
            {courses.map(({ enrollment, subject, progress }) => (
              <div className="home-next-course" key={`${enrollment.gradeId}-${enrollment.subjectId}`}>
                <div className="home-next-course-title">
                  <span className="home-next-course-icon"><Icon name={subject!.icon} /></span>
                  <div>
                    <strong>{subject!.name} · Lớp {enrollment.gradeId}</strong>
                    <small>{progress.nextLesson?.title ?? "Đã hoàn thành các bài hiện có"}</small>
                  </div>
                  <span className="home-next-course-count">{progress.completed}/{progress.total} bài</span>
                </div>
                <Progress
                  label={`Tiến độ môn ${subject!.name}`}
                  value={progress.completed}
                  max={progress.total}
                  tone={enrollment.subjectId === "toan" ? "primary" : "accent"}
                />
                <Button
                  variant="ghost"
                  className="home-next-course-open"
                  onClick={() =>
                    onNavigate(
                      progress.nextLesson
                        ? lessonHref(progress.nextLesson)
                        : courseHref(enrollment.gradeId, enrollment.subjectId),
                    )
                  }
                >
                  {progress.nextLesson ? "Học tiếp" : "Ôn lại"}
                  <Icon name="arrow_forward" />
                </Button>
              </div>
            ))}
            {!courses.length && (
              <div className="home-next-course-empty">
                <p>Các môn học đang được chuẩn bị.</p>
                <Button variant="secondary" onClick={() => onNavigate(routePath("hoc-bai"))}>
                  Mở lộ trình
                </Button>
              </div>
            )}
          </div>
          <details className="home-next-journey-details">
            <summary><Icon name="route" /> Xem các chặng học gần đây</summary>
            <div className="home-progress-header-info">
              <strong>{missionProgress.completed}/{missionProgress.total} bài đã hoàn thành</strong>
              <span> · {missionSubject?.name ?? "Môn học"} · Lớp {missionEnrollment.gradeId}</span>
            </div>
            <CourseLearningPath compact path={coursePath} onNavigate={onNavigate} />
          </details>
        </section>

        <Card className="home-next-evidence-card">
          <div className="home-next-card-header">
            <span className="home-next-card-symbol"><Icon name="psychology" /></span>
            <h2>Dấu ấn tự học</h2>
          </div>
          <p className="home-next-card-desc">
            Những gì được ghi lại từ các phiên tự giải trên thiết bị này.
          </p>
          <div className="home-progress-evidence">
            <div>
              <Icon name="edit_square" />
              <strong>{journey.totalAttempts}</strong>
              <span>lượt tự kiểm tra</span>
            </div>
            <div>
              <Icon name="verified_user" />
              <strong>{journey.corrections}</strong>
              <span>lần tự sửa đúng</span>
            </div>
            <div>
              <Icon name="menu_book" />
              <strong>{journey.savedMistakes}</strong>
              <span>lỗi đã lưu để ôn</span>
            </div>
          </div>
          <Button
            variant="ghost"
            className="home-next-link-bottom"
            onClick={() => onNavigate(routePath("tien-bo"))}
          >
            Xem tiến bộ <Icon name="arrow_forward" />
          </Button>
        </Card>
      </div>

      {practice && (
        <section className="home-next-challenge" aria-labelledby="home-next-challenge-title">
          <div className="home-next-challenge-icon"><Icon name="lightbulb" /></div>
          <div>
            <p className="home-next-eyebrow">Một thử thách ngay bây giờ</p>
            <h2 id="home-next-challenge-title">{practice.title}</h2>
            <p>{practice.course}{practice.durationMinutes ? ` · ${practice.durationMinutes} phút` : ""} · Tự giải từng bước và xem lại kết quả đã lưu.</p>
          </div>
          <Button variant="primary" onClick={() => onNavigate(practiceHref(practice.id))}>
            Thử sức <Icon name="arrow_forward" />
          </Button>
        </section>
      )}
      <DemoDataNotice
        className="home-next-data-notice"
        message="Hồ sơ học sinh hiện là dữ liệu minh họa; số lượt kiểm tra và tiến độ hiển thị theo kết quả đã lưu trên thiết bị."
      />
    </div>
  );
}
