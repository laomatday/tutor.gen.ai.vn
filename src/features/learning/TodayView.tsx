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
  {
    id: "learn",
    label: "Học mới",
    icon: "menu_book",
    description: "Khám phá kiến thức, hiểu qua mô hình",
    actionLabel: "Chọn",
  },
  {
    id: "practice",
    label: "Luyện một bài",
    icon: "edit_square",
    description: "Tự giải từng bước, nhận gợi ý khi cần",
    actionLabel: "Chọn",
  },
  {
    id: "replay",
    label: "Xem lại",
    icon: "history",
    description: "Nhìn lại những lần thử và tự sửa",
    actionLabel: "Chọn",
  },
] as const;

function greetingForHour(hour: number) {
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/**
 * A screenshot-faithful learning dashboard driven by real published lessons,
 * device-backed practice events and the existing genAi design system.
 * Never simulate AI, XP, streaks, scores or class rankings.
 */
export function TodayView({
  onNavigate,
  onOpenBadges,
  gpBalance,
}: TodayViewProps) {
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
  const greeting = greetingForHour(new Date().getHours());

  const courses = studentProfile.enrollments
    .map((enrollment) => ({
      enrollment,
      subject: subjects.find((item) => item.id === enrollment.subjectId),
      progress: getCourseProgress(lessons, topics, completedLessonIds, enrollment),
    }))
    .filter((item) => item.subject && item.progress.total > 0);
  const englishNextLesson = courses.find(
    (item) => item.enrollment.subjectId === "tieng-anh",
  )?.progress.nextLesson;

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

  // Never show the square manipulative for unpublished or non-enrolled lessons.
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
          <h1 className="home-next-hero-label" aria-label="Hôm nay">
            <Icon name="auto_awesome" /> Hôm nay · Góc học của {firstName}
          </h1>
          <p className="home-next-hero-greeting">
            {greeting}, {firstName}! <span aria-hidden="true">👋</span>
          </p>
          <p className="home-next-hero-summary">
            {nextLesson ? (
              <>
                Hôm nay, mình khám phá <strong>{nextLesson.title}</strong>
                {englishNextLesson && englishNextLesson.id !== nextLesson.id && (
                  <> và <strong>{englishNextLesson.title}</strong></>
                )}.
                Hãy thử ý tưởng của em trước khi xem lời giải.
              </>
            ) : (
              "Em đã hoàn thành các bài hiện có. Hãy chọn một chủ đề để tiếp tục khám phá."
            )}
          </p>
          <div className="home-next-hero-stats" aria-label="Hoạt động học tập đã ghi nhận">
            {onOpenBadges && (
              <Button
                variant="surface"
                className="home-wallet home-next-hero-stat home-next-hero-stat--wallet"
                onClick={onOpenBadges}
              >
                <Icon name="workspace_premium" />
                <span>
                  <small>Điểm đã tích lũy</small>
                  <strong>{gpBalance} GP</strong>
                </span>
              </Button>
            )}
            <div className="home-next-hero-stat">
              <Icon name="edit_square" />
              <span>
                <small>Lượt kiểm tra hôm nay</small>
                <strong>{journey.todayAttempts} lượt</strong>
              </span>
            </div>
            <div className="home-next-hero-stat home-next-hero-stat--progress">
              <span>
                <small>Tiến độ {nextSubject?.name ?? "môn học"}</small>
                <strong>{primaryProgress.completed}/{primaryProgress.total} bài</strong>
              </span>
              <Progress
                value={primaryProgress.completed}
                max={primaryProgress.total}
                label="Tiến độ môn học hiện tại"
              />
            </div>
          </div>
        </div>
        <div className="home-next-hero-actions">
          <Button
            variant="secondary"
            className="home-next-hero-start"
            onClick={() => onNavigate(lessonDestination)}
          >
            <Icon name="play_arrow" />
            {nextLesson ? "Tiếp tục học ngay" : "Khám phá môn học"}
            <Icon name="arrow_forward" />
          </Button>
          <Button
            variant="ghost"
            className="home-next-hero-secondary"
            onClick={() => onNavigate(routePath("hoc-bai"))}
          >
            <Icon name="route" /> Xem lộ trình học
          </Button>
        </div>
      </header>

      <div className="home-next-bento-top">
        <section className="home-mission home-next-lab-card" aria-labelledby="home-next-lab-title">
          <div className="home-next-section-heading">
            <div className="home-next-section-icon" aria-hidden="true">
              <Icon name="functions" />
            </div>
            <div>
              <p className="home-next-eyebrow">
                Toán 9 <span aria-hidden="true">·</span>{" "}
                {squareLesson ? nextTopic?.title ?? "Căn bậc hai" : "Khám phá kiến thức"}
              </p>
              <h2 id="home-next-lab-title">
                {squareLesson ? "Căn bậc hai & căn thức bậc hai" : "Góc khám phá bài học"}
              </h2>
            </div>
            {squareLesson && <Badge tone="success">Phòng thí nghiệm</Badge>}
          </div>
          {squareLesson ? (
            <HomeSquareLab
              onOpenLesson={() => onNavigate(lessonHref(squareLesson))}
              onOpenExercises={() => onNavigate(lessonHref(squareLesson, "exercises"))}
            />
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
              <p>Chưa có mô hình phù hợp với học liệu hiện tại.</p>
              <Button variant="secondary" onClick={() => onNavigate(routePath("hoc-bai"))}>
                Xem nội dung đã xuất bản <Icon name="arrow_forward" />
              </Button>
            </div>
          )}
          {mood === "learn" && squareLesson && nextLesson && nextDiscovery && (
            <details className="home-micro-lab" aria-label="Kiểm tra ý tưởng của bài học tiếp theo">
              <summary className="home-next-discovery-head">
                <span><Icon name="lightbulb" /> Thử tiếp một ý tưởng</span>
                <strong>{nextLesson.title}</strong>
                <Icon name="expand_more" />
              </summary>
              <LessonDiscovery
                lesson={nextLesson}
                compact
                onContinue={() => onNavigate(lessonHref(nextLesson))}
              />
              <p className="home-next-preview-note">
                Bản khám phá thử, không cộng điểm hoặc hoàn thành bài.
              </p>
            </details>
          )}
        </section>

        <section className="home-next-modes" aria-labelledby="home-next-modes-title">
          <div className="home-next-section-heading">
            <div>
              <h2 id="home-next-modes-title">Lộ trình & chế độ học</h2>
              <p className="home-next-modes-intro">
                Chọn một cách học phù hợp với mục tiêu hôm nay.
              </p>
            </div>
          </div>
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
                <div>
                  <p className="home-next-mode-kicker"><Icon name="menu_book" /> Bài đang chờ em</p>
                  <h3>{nextLesson?.title ?? "Chọn một bài để khám phá"}</h3>
                  <small>
                    {nextSubject?.name ?? "Môn học"}
                    {nextLesson?.durationMinutes ? ` · ${nextLesson.durationMinutes} phút` : ""}
                  </small>
                </div>
                <Button variant="primary" onClick={() => onNavigate(lessonDestination)}>
                  {nextLesson ? "Vào học" : "Xem môn học"}
                  <Icon name="arrow_forward" />
                </Button>
              </>
            )}
            {mood === "practice" && (
              <>
                <div>
                  <p className="home-next-mode-kicker"><Icon name="edit_square" /> Bài tự giải</p>
                  <h3>{practice?.title ?? "Chọn một bài để thử sức"}</h3>
                  <small>
                    {practice?.course ?? "Luyện tập"}
                    {practice?.durationMinutes ? ` · ${practice.durationMinutes} phút` : ""}
                  </small>
                </div>
                <Button variant="primary" onClick={() => onNavigate(practiceDestination)}>
                  {practice ? "Mở bàn tự giải" : "Khám phá bài học"}
                  <Icon name="arrow_forward" />
                </Button>
              </>
            )}
            {mood === "replay" && (
              <>
                <div>
                  <p className="home-next-mode-kicker"><Icon name="history" /> Nhìn lại cách giải</p>
                  <h3>{recorded && practice ? practice.title : "Mỗi lần thử đều đáng lưu lại"}</h3>
                  <small>
                    {recorded
                      ? `${evidence.attempts.length} lượt kiểm tra · ${evidence.selfCorrected} lần tự sửa đúng`
                      : "Sau khi thử một bài tự giải, em có thể xem lại những lần thử và tự sửa."}
                  </small>
                </div>
                {recorded && (
                  <ol className="home-replay-notes" aria-label="Lượt kiểm tra mới nhất">
                    {recentEvents.map((event, index) => (
                      <li key={event.id}>
                        <Icon name={event.valid ? "check_circle" : "edit_square"} />
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
            <p><strong>Gợi ý:</strong> Hãy thử một bước của chính mình trước khi mở lời giải.</p>
          </div>
        </section>
      </div>

      <div className="home-next-bento-bottom">
        <Card className="home-rhythm home-next-week-card" aria-label="Nhịp học tuần này">
          <div className="home-next-card-header">
            <h2><Icon name="calendar_today" /> Nhịp học tuần này</h2>
            <Badge tone="neutral">{journey.activeDays} ngày học</Badge>
          </div>
          <p className="home-next-card-desc">
            {journey.activeDays
              ? `Tuần này đã ghi nhận ${journey.activeDays} ngày có lượt kiểm tra.`
              : "Chưa có lượt kiểm tra nào được lưu trong tuần."}
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
                : "Ngày có lượt tự kiểm tra đã lưu sẽ được đánh dấu ở đây."}
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
            <h2 id="home-courses-title">Bạn muốn khám phá môn nào?</h2>
            <Button variant="ghost" onClick={() => onNavigate(routePath("hoc-bai"))}>
              Xem tất cả <Icon name="arrow_forward" />
            </Button>
          </div>
          <p className="home-next-card-desc">
            Tiến độ theo số bài học đã xuất bản và hoàn thành.
          </p>
          <div className="home-next-course-list">
            {courses.map(({ enrollment, subject, progress }) => (
              <div className="home-next-course" key={`${enrollment.gradeId}-${enrollment.subjectId}`}>
                <div className="home-next-course-title">
                  <span className="home-next-course-icon"><Icon name={subject!.icon} /></span>
                  <strong>{subject!.name} · Lớp {enrollment.gradeId}</strong>
                  <span className="home-next-course-count">{progress.completed}/{progress.total} bài</span>
                </div>
                <p>{progress.nextLesson?.title ?? "Đã hoàn thành các bài hiện có"}</p>
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
            <h2><Icon name="psychology" /> Dấu ấn tự học</h2>
            <span className="home-next-aside-tag">Đã ghi nhận</span>
          </div>
          <p className="home-next-card-desc">
            Những kết quả có dữ liệu trên thiết bị này.
          </p>
          <div className="home-progress-evidence">
            <div>
              <span className="home-next-evidence-icon"><Icon name="edit_square" /></span>
              <span className="home-next-evidence-copy"><strong>Đã tự kiểm tra</strong><small>Các lượt đã lưu</small></span>
              <span className="home-next-evidence-number"><strong>{journey.totalAttempts}</strong>lượt tự kiểm tra</span>
            </div>
            <div>
              <span className="home-next-evidence-icon"><Icon name="verified_user" /></span>
              <span className="home-next-evidence-copy"><strong>Đã tự sửa</strong><small>Những bước sửa đúng</small></span>
              <span className="home-next-evidence-number"><strong>{journey.corrections}</strong>lần tự sửa đúng</span>
            </div>
            <div>
              <span className="home-next-evidence-icon"><Icon name="menu_book" /></span>
              <span className="home-next-evidence-copy"><strong>Đang ôn lại</strong><small>Lỗi đã ghi chú</small></span>
              <span className="home-next-evidence-number"><strong>{journey.savedMistakes}</strong>lỗi đã lưu để ôn</span>
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
          <span className="home-next-challenge-icon"><Icon name="lightbulb" /></span>
          <div>
            <p className="home-next-eyebrow">Thử thách cho hôm nay</p>
            <h2 id="home-next-challenge-title">{practice.title}</h2>
            <p>{practice.course}{practice.durationMinutes ? ` · ${practice.durationMinutes} phút` : ""} · Tự giải và kiểm tra từng bước.</p>
          </div>
          <Button variant="primary" onClick={() => onNavigate(practiceHref(practice.id))}>
            Bắt đầu thử thách <Icon name="arrow_forward" />
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
