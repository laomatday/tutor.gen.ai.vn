import { useState, type FormEvent } from "react";
import { AdaptiveText } from "../../components/AdaptiveText";
import { LessonContentRenderer } from "../../components/LessonContentRenderer";
import { Button, Icon, Input, Progress, Tabs } from "../../components/ui";
import { appConfig } from "../../config/app";
import { useCurriculum } from "../../context/CurriculumContext";
import {
  canStudy,
  courseHref,
  getCourseProgress,
  isPublishedInCurriculum,
  lessonHref,
  lessonStages,
  type Lesson,
  type LessonStage,
} from "../../features/curriculum";
import { LessonDiscovery } from "../../features/learning/LessonDiscovery";
import { SupportHeader } from "../support/SupportUI";
import "./lesson-reader.css";

interface Props {
  search: string;
  onNavigate: (path: string) => void;
  onEarnGp: (amount: number, reason: string) => void;
}

const stageIds: LessonStage[] = ["theory", "examples", "exercises"];

export function LessonReaderPage({ search, onNavigate, onEarnGp }: Props) {
  const { lessons, topics, subjects } = useCurriculum();
  const params = new URLSearchParams(search);
  const id = params.get("lesson") ?? "";
  const lesson = lessons.find(
    (item) =>
      item.id === id &&
      isPublishedInCurriculum(item, topics) &&
      canStudy(item.gradeId, item.subjectId) &&
      (!params.has("grade") || params.get("grade") === item.gradeId) &&
      (!params.has("subject") || params.get("subject") === item.subjectId) &&
      (!params.has("topic") || params.get("topic") === item.topicId),
  );
  const requestedStage = params.get("stage");
  const stage = stageIds.includes(requestedStage as LessonStage)
    ? (requestedStage as LessonStage)
    : "theory";

  if (!lesson) {
    return (
      <div className="v2-support-page">
        <SupportHeader
          eyebrow="Học liệu đã xuất bản"
          title="Bài học không khả dụng"
          description="Bài không có trong chương trình đã xuất bản, chưa đăng ký hoặc đường dẫn không còn hợp lệ."
          icon="info"
        >
          <Button className="v2-support-on-hero" onClick={() => onNavigate("/hoc-bai")}>
            <Icon name="hub" /> Về Knowledge Universe
          </Button>
        </SupportHeader>
      </div>
    );
  }
  const subjectName = subjects.find((item) => item.id === lesson.subjectId)?.name ?? lesson.subjectId;
  const topicName = topics.find(
    (item) =>
      item.id === lesson.topicId &&
      item.gradeId === lesson.gradeId &&
      item.subjectId === lesson.subjectId,
  )?.title ?? "Chủ đề";

  return (
    <LessonReaderWorkspace
      key={lesson.id}
      lesson={lesson}
      stage={stage}
      subjectName={subjectName}
      topicName={topicName}
      onNavigate={onNavigate}
      onEarnGp={onEarnGp}
    />
  );
}

function LessonReaderWorkspace({
  lesson,
  stage,
  subjectName,
  topicName,
  onNavigate,
  onEarnGp,
}: {
  lesson: Lesson;
  stage: LessonStage;
  subjectName: string;
  topicName: string;
  onNavigate: (path: string) => void;
  onEarnGp: (amount: number, reason: string) => void;
}) {
  const { lessons, topics, completedLessonIds, completeLesson, storageError } = useCurriculum();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);
  const [exerciseError, setExerciseError] = useState("");
  const done = completedLessonIds.includes(lesson.id);
  const progress = getCourseProgress(
    lessons,
    topics,
    completedLessonIds,
    { gradeId: lesson.gradeId, subjectId: lesson.subjectId },
  );
  const courseLessons = progress.lessons;
  const index = courseLessons.findIndex((item) => item.id === lesson.id);
  const nextLesson = courseLessons[index + 1];
  const related = courseLessons.filter((item) => item.id !== lesson.id).slice(0, 4);
  const answeredCount = lesson.exercises.filter((exercise) => answers[exercise.id] !== undefined).length;
  const correctCount = lesson.exercises.filter((exercise) => answers[exercise.id] === exercise.correctIndex).length;
  const allCorrect = lesson.exercises.length > 0 && correctCount === lesson.exercises.length;
  const stageIndex = stageIds.indexOf(stage);

  function move(nextStage: LessonStage) {
    onNavigate(lessonHref(lesson, nextStage));
  }

  function checkExercises(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (answeredCount !== lesson.exercises.length) {
      setExerciseError("Em hãy chọn đáp án cho tất cả câu hỏi trước khi kiểm tra.");
      return;
    }
    setExerciseError("");
    setChecked(true);
    if (allCorrect && completeLesson(lesson.id)) {
      onEarnGp(
        appConfig.rewards.lessonCompletionGp,
        `Hoàn thành bài học: ${lesson.title}`,
      );
    }
  }

  const outline =
    stage === "theory"
      ? (lesson.contentBlocks?.length
          ? lesson.contentBlocks
            .filter((block) => block.type === "paragraph" || block.type === "math")
            .map((block) => ({ id: block.id, title: block.type === "math" ? block.label ?? "Công thức" : block.heading ?? "Nội dung" }))
          : lesson.theory.map((block, j) => ({ id: `theory-${j}`, title: block.heading })))
      : stage === "examples"
        ? lesson.examples.map((example, j) => ({ id: `example-${j}`, title: example.title }))
        : lesson.exercises.map((exercise, j) => ({ id: `exercise-${j}`, title: `Câu ${j + 1}` }));

  return (
    <div className="v2-lesson-page">
      <nav className="v2-lesson-breadcrumb" aria-label="Vị trí trong chương trình">
        <Button variant="ghost" onClick={() => onNavigate("/hoc-bai")}>
          <Icon name="hub" /> Knowledge Universe
        </Button>
        <Icon name="chevron_right" />
        <Button variant="ghost" onClick={() => onNavigate(courseHref(lesson.gradeId, lesson.subjectId, lesson.topicId))}>
          {subjectName} · {topicName}
        </Button>
      </nav>
      <header className="v2-lesson-header">
        <div>
          <p className="v2-lesson-eyebrow"><Icon name="auto_stories" /> {subjectName} · Lớp {lesson.gradeId}</p>
          <h1>{lesson.title}</h1>
          <p>{lesson.summary}</p>
          <div className="v2-lesson-meta">
            <span><Icon name="schedule" /> {lesson.durationMinutes} phút dự kiến</span>
            <span><Icon name={done ? "check_circle" : "edit_note"} /> {done ? "Đã hoàn thành bài học" : "Chưa hoàn thành"}</span>
          </div>
        </div>
        <div className="v2-lesson-header-progress">
          <span>Tiến độ môn {subjectName}</span>
          <strong>{progress.completed}/{progress.total} bài</strong>
          <Progress value={progress.completed} max={progress.total} label={`Tiến độ môn ${subjectName}`} />
        </div>
      </header>

      {storageError && <div className="v2-lesson-error" role="alert">{storageError}</div>}

      <div className="v2-lesson-navigation">
        <Tabs
          tabs={lessonStages.map((item) => ({ id: item.id, label: item.label, icon: item.icon }))}
          value={stage}
          onChange={move}
          label="Các bước của bài học"
          variant="pill"
          className="v2-lesson-stages"
        />
        <span className="v2-lesson-navigation-hint">Đọc → Quan sát ví dụ → Tự kiểm tra</span>
      </div>

      <div className="v2-lesson-layout">
        <article className="v2-lesson-reading" aria-label="Nội dung bài học">
          {stage === "theory" && (
            <section aria-labelledby="v2-lesson-theory">
              <div className="v2-lesson-section-heading">
                <span><Icon name="menu_book" /></span>
                <div><p>Bước 01 · Khám phá kiến thức</p><h2 id="v2-lesson-theory">Điều em cần hiểu</h2></div>
              </div>
              <div className="v2-lesson-discovery">
                <LessonDiscovery lesson={lesson} onContinue={() => move("examples")} />
              </div>
              <div className="v2-lesson-keypoints">
                <strong>Kiến thức chính</strong>
                <ol>{lesson.theory.map((block, j) => <li key={j}><AdaptiveText text={block.heading} /></li>)}</ol>
              </div>
              {lesson.contentBlocks?.length ? (
                <div className="v2-lesson-content-blocks"><LessonContentRenderer blocks={lesson.contentBlocks} /></div>
              ) : (
                <div className="v2-lesson-theory-blocks">
                  {lesson.theory.map((block, j) => (
                    <section key={j} id={`theory-${j}`} className="v2-lesson-theory-block">
                      <h3>{j + 1}. <AdaptiveText text={block.heading} /></h3>
                      <p><AdaptiveText text={block.text} /></p>
                    </section>
                  ))}
                </div>
              )}
            </section>
          )}

          {stage === "examples" && (
            <section aria-labelledby="v2-lesson-examples">
              <div className="v2-lesson-section-heading">
                <span><Icon name="lightbulb" /></span>
                <div><p>Bước 02 · Áp dụng và suy luận</p><h2 id="v2-lesson-examples">Quan sát cách giải</h2></div>
              </div>
              <p className="v2-lesson-instructions">Thử dự đoán bước giải trước, rồi mở từng ví dụ để đối chiếu.</p>
              {lesson.examples.map((example, j) => (
                <section className="v2-lesson-example" id={`example-${j}`} key={j}>
                  <div className="v2-lesson-example-question">
                    <span>Ví dụ {j + 1}</span>
                    <h3><AdaptiveText text={example.title} /></h3>
                    <p><AdaptiveText text={example.prompt} /></p>
                  </div>
                  <details>
                    <summary>Xem cách giải từng bước <Icon name="expand_more" /></summary>
                    <ol>
                      {example.steps.map((step, i) => (
                        <li key={i}><span>{i + 1}</span><AdaptiveText text={step} /></li>
                      ))}
                    </ol>
                    <div className="v2-lesson-example-answer"><strong>Kết luận</strong><AdaptiveText text={example.answer} /></div>
                  </details>
                </section>
              ))}
            </section>
          )}

          {stage === "exercises" && (
            <section aria-labelledby="v2-lesson-exercises">
              <div className="v2-lesson-section-heading">
                <span><Icon name="edit_square" /></span>
                <div><p>Bước 03 · Tự kiểm tra</p><h2 id="v2-lesson-exercises">Đến lượt em thử sức</h2></div>
              </div>
              <p className="v2-lesson-instructions">Đã chọn {answeredCount}/{lesson.exercises.length} câu. Hoàn thành tất cả mới ghi nhận kết quả bài học.</p>
              <form className="v2-lesson-exercise-form" onSubmit={checkExercises}>
                {lesson.exercises.map((exercise, j) => {
                  const chosen = answers[exercise.id];
                  const correct = chosen === exercise.correctIndex;
                  return (
                    <fieldset key={exercise.id} data-exercise-id={exercise.id} id={`exercise-${j}`} className="v2-lesson-exercise">
                      <legend>Câu {j + 1}</legend>
                      <h3><AdaptiveText text={exercise.prompt} /></h3>
                      <div className="v2-lesson-options">
                        {exercise.options.map((option, i) => (
                          <label key={i} data-selected={chosen === i} className="v2-lesson-option">
                            <Input
                              type="radio"
                              name={`${lesson.id}:${exercise.id}`}
                              value={i}
                              checked={chosen === i}
                              onChange={() => {
                                setAnswers((current) => ({ ...current, [exercise.id]: i }));
                                setChecked(false);
                                setExerciseError("");
                              }}
                            />
                            <strong>{String.fromCharCode(65 + i)}</strong>
                            <span><AdaptiveText text={option} /></span>
                          </label>
                        ))}
                      </div>
                      {checked && (
                        <div className="v2-lesson-check-feedback" data-correct={correct} role="status">
                          <strong>{correct ? "Chính xác!" : "Chưa đúng, hãy thử lại."}</strong>
                          <p><AdaptiveText text={exercise.explanation} /></p>
                        </div>
                      )}
                    </fieldset>
                  );
                })}
                {exerciseError && <p className="v2-lesson-error" role="alert">{exerciseError}</p>}
                {checked && (
                  <div className="v2-lesson-exercise-summary" data-complete={allCorrect} role="status">
                    <Icon name={allCorrect ? "verified" : "edit_note"} />
                    <div>
                      <strong>{allCorrect ? "Em đã hoàn thành bài học!" : `Đã đúng ${correctCount}/${lesson.exercises.length} câu`}</strong>
                      <p>{allCorrect ? "Bài được đánh dấu hoàn thành và GP chỉ tính trong lần đầu tiên." : "Đối chiếu giải thích rồi tự thử lại các câu chưa đúng."}</p>
                    </div>
                  </div>
                )}
                <div className="v2-lesson-actions">
                  <Button type="submit"><Icon name="fact_check" /> {checked ? "Kiểm tra lại" : "Kiểm tra & hoàn thành"}</Button>
                  {done && nextLesson && (
                    <Button variant="secondary" onClick={() => onNavigate(lessonHref(nextLesson))}>Bài tiếp theo <Icon name="arrow_forward" /></Button>
                  )}
                </div>
              </form>
            </section>
          )}

          <div className="v2-lesson-stage-footer">
            {stageIndex > 0 ? (
              <Button variant="ghost" onClick={() => move(stageIds[stageIndex - 1])}>
                <Icon name="arrow_back" /> {lessonStages[stageIndex - 1].label}
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => onNavigate(courseHref(lesson.gradeId, lesson.subjectId, lesson.topicId))}>
                <Icon name="arrow_back" /> Về chủ đề
              </Button>
            )}
            {stageIndex < stageIds.length - 1 && (
              <Button onClick={() => move(stageIds[stageIndex + 1])}>
                {lessonStages[stageIndex + 1].label} <Icon name="arrow_forward" />
              </Button>
            )}
          </div>
        </article>

        <aside className="v2-lesson-side" aria-label="Thông tin và điều hướng bài học">
          <section className="v2-lesson-side-panel">
            <h2><Icon name="route" /> Trong phần này</h2>
            <nav aria-label="Mục lục phần đang học">
              {outline.map((item, j) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  <span>{String(j + 1).padStart(2, "0")}</span><span><AdaptiveText text={item.title} /></span>
                </Button>
              ))}
            </nav>
            <p>Đọc nội dung và làm bài tập để ghi nhận kết quả. Mở mục lục không tạo tiến độ.</p>
          </section>
          <section className="v2-lesson-side-panel">
            <h2><Icon name="hub" /> Bài học trong môn</h2>
            <div className="v2-lesson-related">
              {related.map((item) => (
                <Button key={item.id} variant="ghost" onClick={() => onNavigate(lessonHref(item))}>
                  <Icon name={completedLessonIds.includes(item.id) ? "check_circle" : "menu_book"} />
                  <span>{item.title}</span>
                  <Icon name="chevron_right" />
                </Button>
              ))}
            </div>
            <Button variant="secondary" className="v2-lesson-more" onClick={() => onNavigate(courseHref(lesson.gradeId, lesson.subjectId))}>
              Xem toàn bộ môn học <Icon name="arrow_forward" />
            </Button>
          </section>
        </aside>
      </div>
      <p className="v2-lesson-integrity"><Icon name="info" /> Chỉ bài đã xuất bản và thuộc môn đăng ký mới được mở. Thao tác đọc, xem ví dụ và kéo slider không cộng GP hoặc hoàn thành bài học.</p>
    </div>
  );
}
