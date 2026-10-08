import { useState } from "react";
import { Badge, Button, Card, Icon, Progress, Tabs } from "../../components/ui";
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
import { routePath } from "../../config/routes";
import { practiceHref } from "./discovery";
import { getPracticeStats } from "../practice/domain";
import { useStudyJourney } from "./studyJourney";
import { CourseLearningPath } from "./CourseLearningPath";
import { LessonDiscovery } from "./LessonDiscovery";
import { selectDiscovery } from "./lessonDiscovery";
import { buildCoursePath } from "./coursePath";
import "../../styles/student-discovery.css";
import "../../styles/student-home.css";

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

/** One useful next step, with progress grounded in the learner's recorded work. */
export function TodayView({
  onNavigate,
  onOpenBadges,
  gpBalance,
}: TodayViewProps) {
  const { subjects, lessons, topics, completedLessonIds } = useCurriculum();
  const [mood, setMood] = useState<LearningMood>("learn");
  const journey = useStudyJourney();
  const recentStats = getPracticeStats(journey.recentSession ?? undefined);
  const evidence = {
    attempts: recentStats.checks,
    selfCorrected: recentStats.corrections,
  };
  const allProgress = getCourseProgress(lessons, topics, completedLessonIds);
  const primary = getCourseProgress(
    lessons,
    topics,
    completedLessonIds,
    primaryEnrollment,
  );
  const problems = getEnrolledPracticeProblems(
    getPracticeProblems(),
    studentProfile.enrollments,
  );
  const practice =
    problems.find((problem) => problem.id === journey.recentProblemId) ??
    problems.find(
      (problem) => problem.id === practicePolicy.defaultStudioProblemId,
    ) ??
    problems[0];
  const recorded =
    practice?.id === journey.recentSession?.problemId &&
    evidence.attempts.length > 0;
  const nextLesson = primary.nextLesson ?? allProgress.nextLesson;
  const nextDiscovery = nextLesson ? selectDiscovery(nextLesson) : null;
  const firstName = studentProfile.name.trim().split(" ").at(-1) || "bạn";
  const courses = studentProfile.enrollments
    .map((enrollment) => ({
      enrollment,
      subject: subjects.find((subject) => subject.id === enrollment.subjectId),
      progress: getCourseProgress(
        lessons,
        topics,
        completedLessonIds,
        enrollment,
      ),
    }))
    .filter((course) => course.subject && course.progress.total > 0);
  const recentEvents = recorded ? evidence.attempts.slice(-3) : [];
  const nextSubject = subjects.find(
    (subject) => subject.id === nextLesson?.subjectId,
  );
  const nextTopic = topics.find((topic) => topic.id === nextLesson?.topicId);
  const mission =
    mood === "learn"
      ? {
          label: nextLesson
            ? `Khám phá · ${nextTopic?.title ?? "Chặng tiếp theo"}`
            : "Một vòng học đã hoàn thành",
          title: nextLesson?.title ?? "Mình ôn lại một chút nhé?",
          description:
            nextLesson?.summary ??
            "Bạn đã học xong các bài hiện có. Chọn một chủ đề quen thuộc hoặc thử một cách giải mới.",
          meta: nextLesson
            ? `${nextSubject?.name ?? "Bài học"} · ${nextLesson.durationMinutes} phút`
            : `${allProgress.completed} bài đã hoàn thành`,
          icon: "menu_book",
          action: nextLesson ? "Bắt đầu bài học" : "Chọn chủ đề ôn lại",
          path: nextLesson ? lessonHref(nextLesson) : routePath("hoc-bai"),
        }
      : mood === "practice"
        ? {
            label: "Đến lượt ý tưởng của bạn",
            title: practice?.title ?? "Chọn một bài để thử sức",
            description:
              "Cứ thử cách của mình. Nếu mắc ở một bước, gợi ý sẽ giúp bạn tìm đường tiếp.",
            meta: practice
              ? `${practice.course}${practice.durationMinutes ? ` · ${practice.durationMinutes} phút` : ""}`
              : "Tự giải từng bước",
            icon: "edit_square",
            action: practice ? "Mở bàn tự giải" : "Khám phá bài học",
            path: practice ? practiceHref(practice.id) : routePath("hoc-bai"),
          }
        : {
            label: recorded
              ? "Nhìn lại để thấy mình đã tiến bộ"
              : "Mỗi cách thử đều đáng giữ lại",
            title:
              recorded && practice
                ? practice.title
                : "Khoảnh khắc “à, ra vậy!” của bạn",
            description: recorded
              ? "Tua lại các bước đã làm, nhận ra chỗ đổi cách nghĩ và mang điều đó sang bài tiếp theo."
              : "Sau khi thử một bài tự giải, bạn có thể xem lại từng bước và cả những lần tự sửa đúng.",
            meta: recorded
              ? `${evidence.attempts.length} lượt kiểm tra · ${evidence.selfCorrected} lần tự sửa`
              : "Hành trình từ lần thử đầu tiên",
            icon: "history",
            action: recorded
              ? "Xem lại cách mình giải"
              : practice
                ? "Thử một bài trước nhé"
                : "Chọn bài để bắt đầu",
            path: practice
              ? practiceHref(practice.id, recorded)
              : routePath("hoc-bai"),
          };
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
    (subject) => subject.id === missionEnrollment?.subjectId,
  );
  const coursePath = buildCoursePath(
    topics,
    lessons,
    completedLessonIds,
    missionEnrollment,
  );
  const shortcuts = [
    {
      title: "Hành trình của mình",
      description: "Từng chặng nhỏ, thêm điều mới",
      icon: "hub",
      path: routePath("hoc-bai"),
      tone: "sky",
    },
    {
      title: "Bàn tự giải",
      description: "Thử ý tưởng, gỡ từng bước",
      icon: "edit_square",
      path: practice ? practiceHref(practice.id) : routePath("tu-giai"),
      tone: "teal",
    },
    {
      title: "Replay của mình",
      description: "Xem lại những lần thử",
      icon: "history",
      path: practice ? practiceHref(practice.id, true) : routePath("replay"),
      tone: "navy",
    },
  ];

  return (
    <div className="learning-os-page home-hub home-exploration">
      <header className="home-greeting">
        <div className="home-greeting-lead">
          <p className="home-welcome-note">
            <Icon name="wb_sunny" /> Góc học của {firstName}
          </p>
          <h1 className="home-greeting-title">
            Hôm nay
          </h1>
          <p className="home-greeting-sub">
            Một bài học mới, một cách thử mới — bạn chọn điểm bắt đầu.
          </p>
        </div>
        {onOpenBadges && (
          <Button
            variant="surface"
            className="home-wallet"
            onClick={onOpenBadges}
          >
            <span>
              <Icon name="workspace_premium" />
            </span>
            <span>
              <strong>{gpBalance} GP</strong>
              <small>Điểm đã tích lũy</small>
            </span>
            <Icon name="chevron_right" />
          </Button>
        )}
      </header>

      {/* Mission Control: hành động chính trước, bằng chứng học tập phía sau. */}
      <div className="home-hero-trio">
        {/* Thẻ 1: Lối học chủ động */}
        <section
          className={`home-mission home-trio-card home-mood-card${mood === "learn" && nextDiscovery ? " has-discovery" : ""}`}
          aria-label="Chọn cách học hôm nay"
        >
          <div className="home-trio-head">
            <span className="home-mission-tag">
              <Icon name="auto_awesome" />
              Nhiệm vụ học tập
            </span>
            <h2>Chọn cách bạn muốn bắt đầu</h2>
            <Tabs
              tabs={learningMoods}
              value={mood}
              onChange={setMood}
              label="Bạn muốn học thế nào?"
              variant="pill"
              className="home-mood-tabs"
            />
          </div>

          <div
            role="tabpanel"
            aria-label={
              mood === "learn"
                ? "Học mới"
                : mood === "practice"
                  ? "Luyện một bài"
                  : "Xem lại"
            }
            className="home-trio-action-panel"
          >
                {mood === "learn" && (
                  <div className="home-action-focused" data-mood="learn">
                    <div className="home-action-badge" data-tone="sky">
                      <Icon name="menu_book" />
                      <span>{nextTopic?.title ?? "Học bài mới"}</span>
                    </div>
                    <div className="home-action-body">
                      <h3>{nextLesson?.title ?? "Khám phá kiến thức mới"}</h3>
                      <p className="home-action-meta">
                        <Icon name="school" />
                        <span>
                          {nextSubject?.name ?? "Môn học"} · Lớp{" "}
                          {studentProfile.gradeId}
                          {nextLesson
                            ? ` · ${nextLesson.durationMinutes} phút`
                            : ""}
                          {nextLesson?.exercises?.length
                            ? ` · ${nextLesson.exercises.length} câu tự luyện`
                            : ""}
                        </span>
                      </p>
                      <p className="home-action-desc">
                        {nextLesson?.summary ??
                          "Khám phá lý thuyết qua ví dụ thực tế và các câu tự luyện."}
                      </p>
                    </div>
                    <div className="home-action-footer">
                      <Button
                        className="home-primary-start-btn"
                        variant="primary"
                        onClick={() =>
                          onNavigate(
                            nextLesson
                              ? lessonHref(nextLesson)
                              : routePath("hoc-bai"),
                          )
                        }
                      >
                        <Icon name="play_arrow" />
                        <span>
                          {nextLesson ? "Bắt đầu bài học" : "Chọn chủ đề"}
                        </span>
                        <Icon name="arrow_forward" />
                      </Button>
                    </div>
                      {nextLesson && (
                        <div className="home-action-steps">
                          {[
                            { label: "Khám phá", stage: "theory" as const },
                            { label: "Ví dụ", stage: "examples" as const },
                            {
                              label: "Tự kiểm tra",
                              stage: "exercises" as const,
                            },
                          ].map((step, idx) => (
                            <Button
                              key={step.stage}
                              size="sm"
                              variant="ghost"
                              className="home-action-step-chip"
                              onClick={() =>
                                onNavigate(lessonHref(nextLesson, step.stage))
                              }
                            >
                              <span className="step-num">{idx + 1}</span>
                              <span>{step.label}</span>
                            </Button>
                          ))}
                        </div>
                      )}
                  </div>
                )}

                {mood === "practice" && (
                  <div className="home-action-focused" data-mood="practice">
                    <div className="home-action-badge" data-tone="teal">
                      <Icon name="edit_square" />
                      <span>Đến lượt ý tưởng của bạn</span>
                    </div>
                    <div className="home-action-body">
                      <h3>{practice?.title ?? "Bài toán thử sức hôm nay"}</h3>
                      <p className="home-action-meta">
                        <Icon name="psychology" />
                        <span>
                          {practice?.course ?? "Bàn tự giải"}
                          {practice?.durationMinutes
                            ? ` · ${practice.durationMinutes} phút`
                            : ""}
                        </span>
                      </p>
                      <div className="home-action-prompt-snippet">
                        {practice?.statement ? (
                          <RichMathText text={practice.statement} />
                        ) : (
                          <p>
                            Cứ thử cách của mình. Gợi ý sẽ giúp bạn tìm đường
                            tiếp.
                          </p>
                        )}
                      </div>
                      <p className="home-action-reassurance">
                        <Icon name="verified_user" />
                        <span>
                          Được thử, được sai, được thử lại với gợi ý theo bậc.
                        </span>
                      </p>
                    </div>
                    <div className="home-action-footer">
                      <Button
                        className="home-primary-start-btn"
                        variant="primary"
                        onClick={() =>
                          onNavigate(
                            practice
                              ? practiceHref(practice.id)
                              : routePath("tu-giai"),
                          )
                        }
                      >
                        <Icon name="psychology" />
                        <span>
                          {practice ? "Mở bàn tự giải" : "Khám phá bài tập"}
                        </span>
                        <Icon name="arrow_forward" />
                      </Button>
                    </div>
                  </div>
                )}

                {mood === "replay" && (
                  <div className="home-action-focused" data-mood="replay">
                    <div className="home-action-badge" data-tone="sky">
                      <Icon name="history" />
                      <span>Nhìn lại để tự tin hơn</span>
                    </div>
                    <div className="home-action-body">
                      <h3>
                        {recorded && practice
                          ? practice.title
                          : "Khoảnh khắc “à, ra vậy!” của bạn"}
                      </h3>
                      <p className="home-action-meta">
                        <Icon name="verified" />
                        <span>
                          {recorded
                            ? `${evidence.attempts.length} lượt kiểm tra · ${evidence.selfCorrected} lần tự sửa`
                            : "Lưu lại cách nghĩ từng bước"}
                        </span>
                      </p>
                      {recorded ? (
                        <ol className="home-replay-notes">
                          {recentEvents.map((event, index) => (
                            <li key={event.id}>
                              <span data-valid={event.valid}>
                                <Icon
                                  name={event.valid ? "check" : "edit_note"}
                                />
                              </span>
                              <div>
                                <strong>
                                  Lần thử{" "}
                                  {evidence.attempts.length -
                                    recentEvents.length +
                                    index +
                                    1}
                                </strong>
                                <p>{event.detail}</p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <div className="home-replay-empty-compact">
                          <Icon name="history" />
                          <div>
                            <strong>Chưa có bài giải nào được lưu</strong>
                            <p>
                              Sau khi thử một bài tự giải, bạn sẽ nhìn lại được
                              từng bước suy nghĩ của mình ở đây. Tự giải → nhận
                              gợi mở → nhìn lại cách nghĩ.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="home-action-footer">
                      <Button
                        className="home-primary-start-btn"
                        variant="primary"
                        onClick={() =>
                          onNavigate(
                            recorded && practice
                              ? practiceHref(practice.id, true)
                              : practice
                                ? practiceHref(practice.id)
                                : routePath("replay"),
                          )
                        }
                      >
                        <Icon name="history" />
                        <span>
                          {recorded
                            ? "Xem lại cách mình giải"
                            : practice
                              ? "Thử một bài trước nhé"
                              : "Chọn bài để bắt đầu"}
                        </span>
                        <Icon name="arrow_forward" />
                      </Button>
                    </div>
                  </div>
                )}
          </div>
          {mood === "learn" && nextLesson && nextDiscovery && (
            <aside className="home-micro-lab" aria-label="Thử khám phá trước khi vào bài">
              <LessonDiscovery
                lesson={nextLesson}
                compact
                onContinue={() => onNavigate(lessonHref(nextLesson))}
              />
              <p className="home-micro-lab__note">
                Khám phá nhanh không đánh dấu hoàn thành bài học hoặc cộng điểm.
              </p>
            </aside>
          )}
        </section>

        {/* Bằng chứng học tập: chỉ dùng kết quả đã lưu. */}
        <section
          className="home-milestones home-trio-card home-milestones-card"
          aria-labelledby="home-progress-title"
        >
                <div
                  className="home-progress-intro cursor-pointer select-none group"
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    onNavigate(
                      courseHref(
                        missionEnrollment.gradeId,
                        missionEnrollment.subjectId,
                      ),
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onNavigate(
                        courseHref(
                          missionEnrollment.gradeId,
                          missionEnrollment.subjectId,
                        ),
                      );
                    }
                  }}
                  aria-label={`Mở môn ${missionSubject?.name ?? "học"} lớp ${missionEnrollment.gradeId}`}
                >
                  <span className="home-panel-icon transition-transform group-hover:scale-105 group-active:scale-95">
                    <Icon name="route" />
                  </span>
                  <div className="home-progress-header-info flex-1 min-w-0">
                    <h2
                      id="home-progress-title"
                      className="group-hover:text-brand transition-colors"
                    >
                      Chặng tiếp theo của bạn
                    </h2>
                    <p>
                      {missionSubject?.name ?? "Môn học"} · Lớp{" "}
                      {missionEnrollment.gradeId}
                      {" · "}
                      <strong>
                        {missionProgress.completed}/{missionProgress.total} bài
                        đã hoàn thành
                      </strong>
                    </p>
                  </div>
                  <span
                    className="home-progress-intro-arrow ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-400 group-hover:bg-brand/10 group-hover:text-brand group-hover:translate-x-0.5 transition-all"
                    aria-hidden="true"
                  >
                    <Icon name="arrow_forward" />
                  </span>
                </div>
                <CourseLearningPath
                  path={coursePath}
                  compact
                  onNavigate={onNavigate}
                />
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
                  <Button
                    variant="ghost"
                    onClick={() => onNavigate(routePath("tien-bo"))}
                  >
                    Tiến bộ của bạn
                    <Icon name="arrow_forward" />
                  </Button>
                </div>
                <p className="home-history-caption">
                  Từ những lần tự giải bạn đã lưu. Mỗi lần thử đều có ý nghĩa.
                </p>
        </section>

        {/* Thẻ 3: Nhịp học tuần này */}
        <Card
          className="home-rhythm home-trio-card home-rhythm-card"
          aria-label="Nhịp học tuần này"
        >
          <div className="home-panel-title">
            <span className="home-panel-icon">
              <Icon name="calendar_today" />
            </span>
            <h2>Nhịp học tuần này</h2>
          </div>
          <p className="home-rhythm-lead">
            {journey.activeDays ? (
              <>
                Bạn đã dành <strong>{journey.activeDays} ngày</strong> để thử
                sức.
              </>
            ) : (
              <>
                Tuần này, bắt đầu bằng <strong>một lần thử</strong> nhé.
              </>
            )}
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
            className="home-calendar-link"
            onClick={() => onNavigate(routePath("thoi-khoa-bieu"))}
          >
            Sắp xếp thời gian học
            <Icon name="arrow_forward" />
          </Button>
        </Card>
      </div>

      {/* Khám phá các môn học - Fullwidth chia thành 3 cột như trên */}
      <section
        className="home-courses w-full"
        aria-labelledby="home-courses-title"
      >
        <div className="home-section-heading">
          <div>
            <h2 id="home-courses-title">Bạn muốn khám phá môn nào?</h2>
            <p>Khóa học theo tiến độ của bạn, từng chặng nhỏ vững vàng.</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => onNavigate(routePath("hoc-bai"))}
          >
            Xem tất cả môn
            <Icon name="arrow_forward" />
          </Button>
        </div>
        <div className="home-course-grid">
          {courses.map(({ enrollment, subject, progress }, index) => (
            <Card
              className="home-course-card"
              key={`${enrollment.gradeId}-${enrollment.subjectId}`}
              data-tone={index % 2 ? "teal" : "sky"}
            >
              <div className="home-course-heading">
                <span className="home-course-icon">
                  <Icon name={subject!.icon} />
                </span>
                <div>
                  <p>Lớp {enrollment.gradeId}</p>
                  <h3>{subject!.name}</h3>
                </div>
                <Badge tone={index % 2 ? "success" : "primary"}>
                  {progress.completed}/{progress.total} bài
                </Badge>
              </div>
              <Progress
                value={progress.completed}
                max={progress.total}
                label={`Tiến độ môn ${subject!.name}`}
                tone={index % 2 ? "accent" : "primary"}
              />
              <div className="home-course-next">
                <span>
                  {progress.nextLesson
                    ? "Chặng tiếp theo"
                    : "Đã hoàn thành các bài hiện có"}
                </span>
                <strong>
                  {progress.nextLesson?.title ??
                    "Ôn lại những điều bạn đã học"}
                </strong>
                <small>
                  {progress.nextLesson
                    ? `${progress.nextLesson.durationMinutes} phút · ${progress.nextLesson.exercises.length} câu tự kiểm tra`
                    : `${progress.total} bài sẵn sàng để ôn tập`}
                </small>
              </div>
              <div className="home-course-actions">
                <Button
                  onClick={() =>
                    onNavigate(
                      progress.nextLesson
                        ? lessonHref(progress.nextLesson)
                        : courseHref(
                            enrollment.gradeId,
                            enrollment.subjectId,
                          ),
                    )
                  }
                >
                  {progress.nextLesson
                    ? `Học tiếp ${subject!.name}`
                    : `Ôn lại ${subject!.name}`}
                  <Icon name="arrow_forward" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    onNavigate(
                      courseHref(enrollment.gradeId, enrollment.subjectId),
                    )
                  }
                >
                  Lộ trình
                </Button>
              </div>
            </Card>
          ))}
        </div>
        {!courses.length && (
          <Card className="home-empty-courses">
            <Icon name="school" />
            <h3>Các môn học đang được chuẩn bị</h3>
            <p>Quay lại bản đồ để xem những học liệu đã mở cho bạn.</p>
            <Button onClick={() => onNavigate(routePath("hoc-bai"))}>
              Mở lộ trình học
            </Button>
          </Card>
        )}
      </section>
    </div>
  );
}
