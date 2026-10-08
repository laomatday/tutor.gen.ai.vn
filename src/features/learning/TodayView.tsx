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
import { LessonDiscovery } from "./LessonDiscovery";
import { CourseLearningPath } from "./CourseLearningPath";
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
        <div>
          <p className="home-welcome-note">
            <Icon name="wb_sunny" /> Góc học của {firstName}
          </p>
          <h1>Mỗi ngày, khám phá một điều mới.</h1>
          <p>Thử một ý tưởng. Tự tìm ra. Rồi bước tiếp.</p>
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

      <div className="home-top-grid">
        <section
          className="home-mission-area"
          aria-label="Chọn cách học hôm nay"
        >
          <Tabs
            tabs={learningMoods}
            value={mood}
            onChange={setMood}
            label="Bạn muốn học thế nào?"
            variant="pill"
            className="home-mood-tabs"
          />
          <div
            role="tabpanel"
            aria-label={learningMoods.find((item) => item.id === mood)!.label}
            className="home-mission"
            data-mood={mood}
          >
            <div className="home-mission-copy">
              <p className="home-mission-tag">
                <span className="home-small-spark">
                  <Icon name="auto_awesome" />
                </span>
                {mission.label}
              </p>
              <h2>{mission.title}</h2>
              <p className="home-mission-description">{mission.description}</p>
              <div className="home-mission-meta">
                <Icon name={mission.icon} />
                <span>{mission.meta}</span>
              </div>
              <Button
                size="lg"
                className="ui-btn-on-brand home-main-action"
                onClick={() => onNavigate(mission.path)}
              >
                <Icon name="play_arrow" />
                {mission.action}
                <Icon name="arrow_forward" />
              </Button>
              <p className="home-mission-reassurance">
                <Icon name="verified_user" />
                {mood === "practice"
                  ? "Được thử, được sai, được thử lại."
                  : mood === "replay"
                    ? "Điều quan trọng là cách bạn đã tìm ra."
                    : "Học theo nhịp của bạn, không cần vội."}
              </p>
            </div>
            {mood === "learn" && nextLesson?.exercises.length ? (
              <div className="home-discovery-preview">
                <LessonDiscovery
                  key={nextLesson.id}
                  lesson={nextLesson}
                  compact
                  onContinue={() => onNavigate(lessonHref(nextLesson))}
                />
              </div>
            ) : (
              <div
                className="home-mission-art"
                aria-label="Một phần nội dung sắp học"
              >
                <div className="home-paper-top">
                  <span>
                    <Icon name={mission.icon} />
                    {mood === "learn"
                      ? "Mở một ý mới"
                      : mood === "practice"
                        ? "Bài thử sức hôm nay"
                        : "Những lần mình thử"}
                  </span>
                  <span className="home-paper-stamp">
                    <Icon name="school" /> Lớp {studentProfile.gradeId}
                  </span>
                </div>
                <div className="home-paper">
                  {mood === "learn" && nextLesson ? (
                    <>
                      <span className="home-paper-caption">
                        {nextLesson.examples[0]?.title ??
                          nextTopic?.title ??
                          "Điểm bắt đầu"}
                      </span>
                      <div className="home-paper-prompt">
                        <RichMathText
                          text={
                            nextLesson.examples[0]?.prompt ?? nextLesson.summary
                          }
                        />
                      </div>
                      <div className="home-paper-nudge">
                        <Icon name="lightbulb" />
                        <p>
                          Bạn sẽ bắt đầu từ đâu?
                          <small>
                            {nextLesson.theory[0]?.heading ??
                              "Thử kết nối với điều mình đã biết."}
                          </small>
                        </p>
                      </div>
                    </>
                  ) : mood === "practice" && practice ? (
                    <>
                      <span className="home-paper-caption">
                        {practice.label}
                      </span>
                      <div className="home-paper-prompt">
                        <RichMathText text={practice.statement} />
                      </div>
                      <div className="home-paper-nudge">
                        <Icon name="psychology" />
                        <p>
                          Chưa cần đáp án ngay.
                          <small>Thử viết điều bạn biết ở bước đầu.</small>
                        </p>
                      </div>
                    </>
                  ) : mood === "replay" && recorded ? (
                    <ol className="home-replay-notes">
                      {recentEvents.map((event, index) => (
                        <li key={event.id}>
                          <span data-valid={event.valid}>
                            <Icon name={event.valid ? "check" : "edit_note"} />
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
                    <div className="home-paper-empty">
                      <Icon name={mood === "replay" ? "history" : "verified"} />
                      <strong>
                        {mood === "replay"
                          ? "Lần thử đầu tiên đang chờ bạn"
                          : "Bạn đã đi được một chặng rồi!"}
                      </strong>
                      <p>
                        {mood === "replay"
                          ? "Tự giải → nhận gợi mở → nhìn lại cách nghĩ."
                          : "Mở bản đồ để chọn điều muốn ôn lại."}
                      </p>
                    </div>
                  )}
                </div>
                <div className="home-paper-bottom">
                  <span className="home-paper-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span>
                    {mood === "learn" && nextLesson
                      ? `${nextLesson.examples.length} ví dụ · ${nextLesson.exercises.length} câu tự kiểm tra`
                      : mood === "practice"
                        ? "Từng bước đều được ghi lại"
                        : "Mỗi bước đều có câu chuyện của nó"}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div
            className="home-mission-steps"
            aria-label="Các bước trong bài học"
          >
            {mood === "learn" && nextLesson ? (
              [
                {
                  label: "Khám phá",
                  icon: "menu_book",
                  stage: "theory" as const,
                },
                {
                  label: "Thử cách làm",
                  icon: "lightbulb",
                  stage: "examples" as const,
                },
                {
                  label: "Tự kiểm tra",
                  icon: "check_circle",
                  stage: "exercises" as const,
                },
              ].map((step, index) => (
                <Button
                  key={step.stage}
                  variant="ghost"
                  onClick={() => onNavigate(lessonHref(nextLesson, step.stage))}
                >
                  <span className="home-step-number">{index + 1}</span>
                  <span>{step.label}</span>
                  <Icon name="arrow_forward" />
                </Button>
              ))
            ) : (
              <p>
                <Icon name="save" />{" "}
                {mood === "practice"
                  ? "Bài làm được lưu trên thiết bị, bạn có thể tiếp tục sau."
                  : "Mở lại bất cứ lúc nào để kết nối những điều mình đã hiểu."}
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="home-journey-grid">
        <section
          className="home-milestones"
          aria-labelledby="home-progress-title"
        >
          <div className="home-progress-intro">
            <span className="home-panel-icon">
              <Icon name="route" />
            </span>
            <div>
              <h2 id="home-progress-title">Chặng tiếp theo của bạn</h2>
              <p>
                {missionSubject?.name ?? "Môn học"} · Lớp{" "}
                {missionEnrollment.gradeId}
                {" · "}
                <strong>
                  {missionProgress.completed}/{missionProgress.total} bài đã
                  hoàn thành
                </strong>
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() =>
                onNavigate(
                  courseHref(
                    missionEnrollment.gradeId,
                    missionEnrollment.subjectId,
                  ),
                )
              }
            >
              Xem toàn bộ lộ trình
              <Icon name="arrow_forward" />
            </Button>
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
        <Card className="home-rhythm">
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
            Sắp một khoảng thời gian học
            <Icon name="arrow_forward" />
          </Button>
        </Card>
      </div>

      <section className="home-courses" aria-labelledby="home-courses-title">
        <div className="home-section-heading">
          <div>
            <h2 id="home-courses-title">Bạn muốn khám phá môn nào?</h2>
            <p>Chọn một chặng nhỏ. Phần còn lại để từ từ.</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => onNavigate(routePath("hoc-bai"))}
          >
            Chọn chặng học
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
                  {progress.nextLesson?.title ?? "Ôn lại những điều bạn đã học"}
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
                        : courseHref(enrollment.gradeId, enrollment.subjectId),
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
                  Xem lộ trình
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

      <nav className="home-shortcuts" aria-label="Khám phá không gian học tập">
        {shortcuts.map((shortcut) => (
          <Button
            key={shortcut.title}
            variant="surface"
            className="home-shortcut"
            data-tone={shortcut.tone}
            onClick={() => onNavigate(shortcut.path)}
          >
            <span className="home-shortcut-icon">
              <Icon name={shortcut.icon} />
            </span>
            <span>
              <strong>{shortcut.title}</strong>
              <small>{shortcut.description}</small>
            </span>
            <Icon name="arrow_forward" />
          </Button>
        ))}
      </nav>
    </div>
  );
}
