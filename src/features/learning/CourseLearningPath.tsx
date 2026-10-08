import { Button, Icon, Progress } from "../../components/ui";
import { lessonHref, type PracticeProblem } from "../curriculum";
import { practiceHref } from "./discovery";
import { compactPathUnit, type CoursePath } from "./coursePath";
import "../../styles/student-path.css";

interface CourseLearningPathProps {
  path: CoursePath;
  onNavigate: (path: string) => void;
  practiceProblems?: PracticeProblem[];
  visibleTopicIds?: string[];
  compact?: boolean;
}

export function CourseLearningPath({
  path,
  onNavigate,
  practiceProblems = [],
  visibleTopicIds,
  compact = false,
}: CourseLearningPathProps) {
  const preview = compact ? compactPathUnit(path) : undefined;
  const units = compact
    ? preview
      ? [preview]
      : []
    : path.units.filter(
        (unit) => !visibleTopicIds || visibleTopicIds.includes(unit.topic.id),
      );
  return (
    <div className="course-learning-path" data-compact={compact}>
      {units.map((unit) => {
        const fullUnit = path.units.find(
          (item) => item.topic.id === unit.topic.id,
        )!;
        const practice = practiceProblems.find(
          (problem) =>
            problem.gradeId === unit.topic.gradeId &&
            problem.subjectId === unit.topic.subjectId &&
            (problem.topicId === unit.topic.id ||
              fullUnit.steps.some(
                (step) => step.lesson.id === problem.lessonId,
              )),
        );
        return (
          <section
            className="course-path-unit"
            key={unit.topic.id}
            data-topic-id={unit.topic.id}
            data-state={unit.state}
            aria-label={`Chặng ${unit.number}: ${unit.topic.title}`}
          >
            <header className="course-path-unit__header">
              <span className="course-path-unit__number" aria-hidden="true">
                {unit.state === "complete" ? (
                  <Icon name="check" />
                ) : (
                  String(unit.number).padStart(2, "0")
                )}
              </span>
              <div className="course-path-unit__intro">
                <span className="course-path-eyebrow">
                  Chặng {unit.number}
                  {unit.state === "current"
                    ? " · Đi tiếp từ đây"
                    : unit.state === "complete"
                      ? " · Đã hoàn thành"
                      : " · Chờ em khám phá"}
                </span>
                <h3>{unit.topic.title}</h3>
                {!compact && <p>{unit.topic.description}</p>}
              </div>
              <div className="course-path-unit__progress">
                <span>
                  {unit.completed}/{fullUnit.steps.length} bài
                </span>
                <Progress
                  value={unit.completed}
                  max={fullUnit.steps.length}
                  label={`Tiến độ chặng ${unit.number}`}
                  tone="accent"
                />
              </div>
            </header>
            <ol
              className="course-path-steps"
              aria-label={`Bài học trong ${unit.topic.title}`}
            >
              {unit.steps.map(({ lesson, state }, index) => (
                <li
                  key={lesson.id}
                  className="course-path-stop"
                  data-state={state}
                >
                  <Button
                    variant="ghost"
                    className="course-path-step"
                    data-lesson-id={lesson.id}
                    data-state={state}
                    aria-current={state === "current" ? "step" : undefined}
                    onClick={() =>
                      onNavigate(
                        lessonHref(
                          lesson,
                          state === "complete" ? "examples" : "theory",
                        ),
                      )
                    }
                  >
                    <span className="course-path-step__node" aria-hidden="true">
                      <Icon
                        name={
                          state === "complete"
                            ? "check"
                            : state === "current"
                              ? "play_arrow"
                              : lesson.kind === "problem-type"
                                ? "edit_square"
                                : "auto_awesome"
                        }
                      />
                    </span>
                    <span className="course-path-step__copy">
                      <strong>{lesson.title}</strong>
                      <span>
                        <Icon name="schedule" />
                        {lesson.durationMinutes} phút{" "}
                        <span aria-hidden="true">·</span>{" "}
                        {state === "complete"
                          ? "Đã hoàn thành"
                          : lesson.kind === "problem-type"
                            ? "Thử sức"
                            : "Khám phá kiến thức"}
                      </span>
                    </span>
                    <span className="course-path-step__action">
                      {state === "complete"
                        ? "Ôn lại"
                        : state === "current"
                          ? path.completed
                            ? "Học tiếp"
                            : "Bắt đầu"
                          : "Khám phá"}
                      <Icon name="arrow_forward" />
                    </span>
                  </Button>
                  {index === unit.steps.length - 1 && !compact && (
                    <span
                      className="course-path-stop__finish"
                      aria-hidden="true"
                    >
                      <Icon name="flag" />
                    </span>
                  )}
                </li>
              ))}
            </ol>
            {practice && !compact && (
              <Button
                variant="ghost"
                className="course-path-practice"
                onClick={() => onNavigate(practiceHref(practice.id))}
              >
                <span className="course-path-practice__icon">
                  <Icon name="edit_square" />
                </span>
                <span>
                  <strong>Thử sức: {practice.title}</strong>
                  <small>
                    Tự giải từng bước
                    {practice.durationMinutes
                      ? ` · ${practice.durationMinutes} phút`
                      : ""}
                  </small>
                </span>
                <Icon name="arrow_forward" />
              </Button>
            )}
          </section>
        );
      })}
    </div>
  );
}
