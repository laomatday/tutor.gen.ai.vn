import { useEffect, useRef, useState } from "react";
import { RichMathText } from "../../components/MathLatex";
import {
  Alert,
  Button,
  Field,
  Icon,
  Select,
  Tabs,
  Textarea,
} from "../../components/ui";
import { appConfig } from "../../config/app";
import type { PracticeProblem } from "../../types/content";
import {
  formulaTools,
  getPracticeProblem,
  getPracticeProblems,
  practicePolicy,
} from "./data";
import {
  appendPracticeEvent,
  autonomyReward,
  formatElapsed,
  getPracticeStats,
  getUsedPracticeHelp,
  verifyPracticeAnswer,
  type AnswerCheck,
} from "./domain";
import { usePracticeSession } from "./usePracticeSession";
import { AlgebraTiles, GraphStudy, SketchPad } from "./StudyTools";
import "../../styles/student-studio.css";

interface Props {
  onEarnGp: (amount: number, reason: string) => void;
  onNavigate?: (path: string) => void;
}
const toolTabs = [
  { id: "math", label: "Công thức Toán", icon: "functions" },
  { id: "sketch", label: "Bút phác thảo", icon: "gesture" },
  { id: "graph", label: "Parabol tương tác", icon: "timeline" },
  { id: "tiles", label: "Ghép hình đại số", icon: "grid_view" },
] as const;
type Tool = (typeof toolTabs)[number]["id"];

export function SelfSolveView(props: Props) {
  const id = new URLSearchParams(window.location.search).get("problem");
  const problems = getPracticeProblems();
  const problem =
    problems.find((item) => item.id === id) ??
    getPracticeProblem(practicePolicy.defaultStudioProblemId);
  return <FocusStudio key={problem.id} {...props} problem={problem} />;
}

function FocusStudio({
  onEarnGp,
  onNavigate,
  problem,
}: Props & { problem: PracticeProblem }) {
  const [session, updateSession, storageError] = usePracticeSession(problem.id);
  const [check, setCheck] = useState<AnswerCheck | null>(null);
  const [tool, setTool] = useState<Tool>("math");
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [promptIndex, setPromptIndex] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const coach = useRef<HTMLElement>(null);
  const rewardRef = useRef(session.rewarded);
  const stats = getPracticeStats(session);
  const usedHelp = getUsedPracticeHelp(session);
  const reward = autonomyReward(
    appConfig.rewards.lessonCompletionGp,
    usedHelp.length,
  );
  const lastCheck = stats.checks.at(-1);
  const nextHint = problem.hints.find(
    (hint) => !session.openedHints.includes(hint.id),
  );
  const status =
    check ??
    (lastCheck
      ? {
          valid: !!lastCheck.valid,
          message: lastCheck.detail,
          issue: lastCheck.issue,
        }
      : null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const updateInput = (input: string) => {
    updateSession((current) => ({ ...current, input }));
    setCheck(null);
  };
  const showHint = (hint: (typeof problem.hints)[number]) => {
    updateSession((current) =>
      current.openedHints.includes(hint.id)
        ? current
        : appendPracticeEvent(
            { ...current, openedHints: [...current.openedHints, hint.id] },
            "hint",
            `${hint.title}: ${hint.text}`,
            undefined,
            Date.now(),
            undefined,
            `hint:${hint.id}`,
          ),
    );
  };
  const openPrompt = (index: number) => {
    setPromptIndex(promptIndex === index ? null : index);
    const prompt = problem.prompts[index];
    const detail = `${prompt.question} ${prompt.answer}`;
    updateSession((current) =>
      (current.events ?? []).some(
        (event) => event.kind === "hint" && event.detail === detail,
      )
        ? current
        : appendPracticeEvent(
            current,
            "hint",
            detail,
            undefined,
            Date.now(),
            undefined,
            `prompt:${index}`,
          ),
    );
  };
  const inspect = (submit = false) => {
    const result = verifyPracticeAnswer(session.input, problem);
    setCheck(result);
    if (!session.input.trim()) {
      textarea.current?.focus();
      return;
    }
    updateSession((current) => ({
      ...appendPracticeEvent(
        current,
        submit ? "submit" : "check",
        result.message,
        result.valid,
        Date.now(),
        result.issue,
      ),
      rewarded: current.rewarded || (submit && result.valid),
    }));
    if (submit && result.valid && !rewardRef.current) {
      rewardRef.current = true;
      onEarnGp(reward, `Hoàn thành: ${problem.title}`);
    }
  };
  const insertFormula = (value: string) => {
    const input = textarea.current;
    const start = input?.selectionStart ?? session.input.length,
      end = input?.selectionEnd ?? start;
    updateInput(
      `${session.input.slice(0, start)}${value}${session.input.slice(end)}`.slice(
        0,
        practicePolicy.inputLimit,
      ),
    );
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + value.length, start + value.length);
    });
  };
  const reset = () => {
    updateSession((current) => ({
      ...current,
      input: "",
      sketch: [],
      openedHints: [],
      usedHelp: getUsedPracticeHelp(current),
    }));
    setCheck(null);
    setPromptIndex(null);
    requestAnimationFrame(() => textarea.current?.focus());
  };
  const focusWriter = () => {
    textarea.current?.focus({ preventScroll: true });
    textarea.current?.closest(".studio-editor")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };

  const showAchievement =
    !!lastCheck?.valid && lastCheck.input === session.input;

  return (
    <div className="studio-page">
      <header className="studio-welcome">
        <div className="studio-welcome-copy">
          <p className="studio-eyebrow">
            <Icon name="gesture" />
            Góc tự học <span>· Focus Studio</span>
          </p>
          <h1>Cứ thử một bước trước đã.</h1>
          <p>Viết ý tưởng của em. Có gợi ý nhỏ bên cạnh khi cần.</p>
        </div>
        <ol className="studio-checkpoints" aria-label="Hành trình giải bài">
          <li
            data-state={
              session.input.trim() || stats.checks.length ? "done" : "current"
            }
          >
            <span>
              {session.input.trim() || stats.checks.length ? (
                <Icon name="check" />
              ) : (
                "1"
              )}
            </span>
            <strong>Đọc đề</strong>
          </li>
          <li
            data-state={
              stats.checks.length
                ? "done"
                : session.input.trim()
                  ? "current"
                  : "next"
            }
          >
            <span>{stats.checks.length ? <Icon name="check" /> : "2"}</span>
            <strong>Thử cách giải</strong>
          </li>
          <li data-state={showAchievement ? "done" : "next"}>
            <span>{showAchievement ? <Icon name="check" /> : "3"}</span>
            <strong>Hiểu ra</strong>
          </li>
        </ol>
      </header>
      <div className="studio-statusbar">
        <div>
          <span className="studio-chip studio-chip-primary">
            <i />
            Không gian của em
          </span>
          <span>
            <Icon name="psychology" />
            Tập trung vào một bước thôi
          </span>
        </div>
        <div>
          <span className="studio-chip">
            <Icon name="timer" />
            {formatElapsed(now - (session.startedAt ?? now))}
            {problem.durationMinutes
              ? ` / ${problem.durationMinutes} phút`
              : ""}
          </span>
          <span className="studio-save">
            <Icon name="cloud_done" />
            Lưu trên thiết bị
          </span>
        </div>
      </div>
      {storageError && <Alert tone="warning">{storageError}</Alert>}
      <div className="studio-layout">
        <div className="studio-main">
          <section className="studio-card studio-problem">
            <div className="studio-section-head">
              <p className="studio-eyebrow">
                <span className="studio-chip">{problem.label}</span>
                <span>{problem.course}</span>
              </p>
              <span className="studio-chip studio-chip-success">
                {problem.difficulty}
              </span>
            </div>
            <h2 className="studio-problem-statement">
              <RichMathText text={problem.statement} />
            </h2>
            <Button className="studio-mobile-start" onClick={focusWriter}>
              <Icon name="gesture" />
              Viết ý tưởng
              <Icon name="arrow_forward" />
            </Button>
            <label className="studio-problem-picker">
              <span>Đổi bài tập</span>
              <Select
                aria-label="Chọn bài tập luyện tập"
                value={problem.id}
                onChange={(event) =>
                  onNavigate?.(`/tu-giai?problem=${event.target.value}`)
                }
                disabled={!onNavigate}
              >
                {getPracticeProblems().map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </Select>
            </label>
          </section>
          <section className="studio-card studio-reasoning">
            <div className="studio-section-head">
              <h2>
                <Icon name="gesture" />
                Bài làm của em
              </h2>
              <span className="studio-guard">
                <Icon name="verified_user" />
                Mỗi ý tưởng đều đáng thử
              </span>
            </div>
            <details className="studio-setup-note">
              <summary>
                <Icon name="lightbulb" />
                <strong>Chưa biết bắt đầu từ đâu?</strong>
                <Icon name="expand_more" />
              </summary>
              <p>
                <RichMathText text={problem.setup} />
              </p>
            </details>
            <div className="studio-editor">
              <div className="studio-section-head">
                <h3>
                  {stats.checks.length
                    ? "Tiếp tục lời giải của em"
                    : "Ý tưởng đầu tiên của em"}
                </h3>
                <span className="studio-caption">
                  {session.input.length}/{practicePolicy.inputLimit}
                </span>
              </div>
              <Field
                label="Trình bày từng phép biến đổi"
                hint={
                  problem.quadratic
                    ? "Viết mỗi phép biến đổi một dòng. Kết luận x = … hoặc x = …."
                    : "Viết các phép biến đổi, kết luận a = …; dùng ⇔ giữa các bước."
                }
              >
                <Textarea
                  ref={textarea}
                  rows={6}
                  value={session.input}
                  maxLength={practicePolicy.inputLimit}
                  placeholder="Bắt đầu bằng ý tưởng của em…"
                  onChange={(event) => updateInput(event.target.value)}
                />
              </Field>
              <div
                className="studio-formulas"
                role="toolbar"
                aria-label="Chèn ký hiệu toán học"
              >
                {formulaTools.map((item) => (
                  <Button
                    key={item.label}
                    variant="secondary"
                    size="sm"
                    title={item.title}
                    onClick={() => insertFormula(item.value)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
              {check && !check.valid && (
                <div role="status" className="studio-check">
                  <Alert
                    tone={
                      check.valid
                        ? "success"
                        : check.issue === "incomplete"
                          ? "info"
                          : "warning"
                    }
                  >
                    <strong className="studio-feedback-title">
                      {check.issue === "incomplete"
                        ? "Đúng hướng rồi, thêm một bước nữa nhé."
                        : check.issue === "format"
                          ? "Mình cần một cách viết rõ hơn chút."
                          : check.issue === "empty"
                            ? "Bắt đầu bằng điều em biết nhé."
                            : "Một chỗ nhỏ cần em xem lại."}
                    </strong>
                    {check.message}
                  </Alert>
                </div>
              )}
              <div className="studio-editor-actions">
                <Button onClick={() => inspect(true)}>
                  <Icon name="send" />
                  Nộp bài
                </Button>
                <Button variant="secondary" onClick={() => inspect()}>
                  <Icon name="fact_check" />
                  Kiểm tra bước giải
                </Button>
                {onNavigate && !showAchievement && (
                  <Button
                    variant="ghost"
                    onClick={() => onNavigate(`/replay?problem=${problem.id}`)}
                  >
                    <Icon name="history" />
                    Xem lại bài làm
                  </Button>
                )}
              </div>
              {showAchievement && (
                <section className="studio-achievement" role="status">
                  <span className="studio-achievement-icon">
                    <Icon name="auto_awesome" />
                  </span>
                  <div>
                    <p className="studio-eyebrow">Một bước tiến của em</p>
                    <h3>
                      {stats.corrections
                        ? "Em đã tự tìm ra chỗ cần sửa!"
                        : "Lời giải đã khớp. Em làm được rồi!"}
                    </h3>
                    <p>
                      {stats.checks.length} lượt kiểm tra · {stats.hints.length}{" "}
                      gợi ý trong phiên này.{" "}
                      {session.rewarded
                        ? "Lưu lại cách em đã tìm ra lời giải nhé."
                        : "Nộp bài để ghi nhận kết quả của em nhé."}
                    </p>
                    {onNavigate && (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          onNavigate(`/replay?problem=${problem.id}`)
                        }
                      >
                        <Icon name="history" />
                        Xem lại bài làm
                      </Button>
                    )}
                  </div>
                </section>
              )}
              <p className="studio-caption studio-checker-note">
                Đối chiếu phép tính trong bài tập này; lời giải tự do và nét vẽ
                chưa được chấm tự động.
              </p>
            </div>
            {stats.checks.length > 0 && (
              <div className="studio-history">
                <h3>Những lần thử giúp em hiểu hơn</h3>
                <ol
                  className="studio-steps"
                  aria-label="Các lần kiểm tra đã ghi nhận"
                >
                  {stats.checks.map((event, index) => (
                    <li
                      key={event.id}
                      className="studio-step"
                      data-state={
                        event.valid
                          ? "success"
                          : event.issue === "incomplete"
                            ? "neutral"
                            : "warning"
                      }
                    >
                      <div className="studio-step-heading">
                        <strong>
                          Lần thử {index + 1} ·{" "}
                          {event.valid
                            ? "Bước giải đã khớp"
                            : event.issue === "incomplete"
                              ? "Em đang đi đúng hướng"
                              : "Cùng xem lại bước này"}
                        </strong>
                        <time>
                          {formatElapsed(
                            event.at - (session.startedAt ?? event.at),
                          )}
                        </time>
                      </div>
                      <pre>{event.input}</pre>
                      <div className="studio-step-feedback">
                        <Icon
                          name={event.valid ? "check_circle" : "lightbulb"}
                        />
                        <p>{event.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
          <Button
            variant="secondary"
            className="studio-help-jump"
            onClick={() => {
              coach.current?.scrollIntoView({
                block: "start",
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
              });
              coach.current?.focus({ preventScroll: true });
            }}
          >
            <Icon name="lightbulb" /> Xem gợi ý từng bước
          </Button>
          <Button
            variant="secondary"
            className="studio-tool-dock-toggle"
            aria-controls="studio-tools"
            aria-expanded={toolsExpanded}
            onClick={() => setToolsExpanded((value) => !value)}
          >
            <Icon name="edit_square" />
            {toolsExpanded ? "Thu gọn công cụ" : "Công cụ hỗ trợ"}
            <Icon name={toolsExpanded ? "close" : "add"} />
          </Button>
          <section
            id="studio-tools"
            className={`studio-card studio-toolbar ${toolsExpanded ? "is-expanded" : ""}`}
            aria-label="Công cụ học tập"
          >
            <Tabs
              tabs={toolTabs}
              value={tool}
              onChange={setTool}
              label="Công cụ Focus Studio"
              variant="pill"
            />
            <div className="studio-toolbar-actions">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Đưa con trỏ về bài làm"
                onClick={() => {
                  setTool("math");
                  requestAnimationFrame(() => textarea.current?.focus());
                }}
              >
                <Icon name="center_focus_strong" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Xóa nháp để thử lại"
                onClick={reset}
              >
                <Icon name="restart_alt" />
              </Button>
            </div>
          </section>
          {tool === "sketch" && (
            <section className="studio-card">
              <SketchPad
                strokes={session.sketch ?? []}
                onChange={(sketch) =>
                  updateSession((current) => ({ ...current, sketch }))
                }
              />
            </section>
          )}
          {tool === "graph" && (
            <section className="studio-card">
              <GraphStudy
                problem={problem}
                unlocked={
                  stats.solved ||
                  session.openedHints.includes(problem.hints.at(-1)?.id ?? 0)
                }
              />
            </section>
          )}
          {tool === "tiles" && (
            <section className="studio-card">
              <AlgebraTiles problem={problem} />
            </section>
          )}
          {tool !== "tiles" && problem.quadratic && (
            <section className="studio-card">
              <AlgebraTiles problem={problem} />
            </section>
          )}
        </div>
        <aside ref={coach} tabIndex={-1} className="studio-coach studio-card" aria-label="Hỗ trợ làm bài">
          <div className="studio-coach-title">
            <span className="studio-coach-icon">
              <Icon name="psychology" />
            </span>
            <div>
              <h2>Cùng tìm hướng giải</h2>
              <p>Một câu hỏi nhỏ, thêm một hướng đi.</p>
            </div>
            <i />
          </div>
          <section className="studio-coach-panel">
            <p className="studio-eyebrow">
              <Icon name="edit_note" />
              Thử nhìn bài toán thế này
            </p>
            <div className="studio-concept">
              <span className="studio-concept-title">
                {problem.quadratic
                  ? "Tổng và tích có gì đặc biệt?"
                  : "Từ tọa độ đến hệ số"}
              </span>
              <div className="studio-concept-root">
                <RichMathText
                  text={
                    problem.quadratic
                      ? `$x^2 ${problem.quadratic.b < 0 ? "-" : "+"} ${Math.abs(problem.quadratic.b)}x ${problem.quadratic.c < 0 ? "-" : "+"} ${Math.abs(problem.quadratic.c)} = 0$`
                      : "$y=ax^2$"
                  }
                />
              </div>
              <div className="studio-concept-branches">
                {problem.quadratic ? (
                  <>
                    <div>
                      <small>Tổng hai số</small>
                      <strong>u + v = {problem.quadratic.b}</strong>
                      <span>Kiểm tra dấu của tổng</span>
                    </div>
                    <div>
                      <small>Tích hai số</small>
                      <strong>u × v = {problem.quadratic.c}</strong>
                      <span>Kiểm tra dấu của tích</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <small>Hoành độ</small>
                      <strong>x = {problem.point.x}</strong>
                      <span>Tính x² trước</span>
                    </div>
                    <div>
                      <small>Tung độ</small>
                      <strong>y = {problem.point.y}</strong>
                      <span>Thế vào phương trình</span>
                    </div>
                  </>
                )}
              </div>
              <p>
                <Icon name="lightbulb" />
                {problem.quadratic
                  ? "Cả hai điều kiện phải cùng đúng."
                  : "Bình phương một số âm cho kết quả dương."}
              </p>
            </div>
            <p className="studio-caption">
              Sơ đồ từ dữ kiện đề bài. Mở gợi ý khi em cần thêm một hướng đi.
            </p>
          </section>
          <section className="studio-coach-panel">
            <p className="studio-eyebrow">Em đang ở đâu rồi?</p>
            <dl className="studio-trace">
              <div>
                <dt>
                  <i />
                  Bước kiểm tra
                </dt>
                <dd>{stats.checks.length} lượt</dd>
              </div>
              <div>
                <dt>
                  <i />
                  Trạng thái bài làm
                </dt>
                <dd className="studio-chip studio-chip-success">
                  {stats.solved
                    ? "Đã giải đúng"
                    : stats.mistakes.length
                      ? "Đang điều chỉnh"
                      : "Đang tự khám phá"}
                </dd>
              </div>
              <div>
                <dt>
                  <i />
                  Gợi ý đã sử dụng
                </dt>
                <dd>{usedHelp.length} gợi ý đã dùng</dd>
              </div>
            </dl>
          </section>
          <section className="studio-coach-panel studio-coach-hints">
            <p className="studio-eyebrow">
              <Icon name="question_answer" />
              Một chút gợi ý nhé?
            </p>
            <p className="studio-coach-question">
              {status && !status.valid && status.issue === "equation"
                ? "Em thử khai triển lại từng nhân tử. Tổng và tích có đồng thời khớp với đề bài không?"
                : "Đang bí cũng không sao. Chọn một gợi ý nhỏ, rồi thử tiếp theo cách của em."}
            </p>
            <div className="studio-hint-list">
              {problem.hints.map((hint) => {
                const open = session.openedHints.includes(hint.id);
                return (
                  <div className="studio-hint" key={hint.id}>
                    <Button
                      variant="surface"
                      className="studio-hint-button"
                      aria-expanded={open}
                      onClick={() => showHint(hint)}
                    >
                      <span>{hint.id}</span>
                      <strong>{hint.title}</strong>
                      <Icon name={open ? "check_circle" : "arrow_forward"} />
                    </Button>
                    {open && (
                      <div className="studio-hint-content">
                        <RichMathText text={hint.text} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {nextHint && (
              <details className="studio-reward-note">
                <summary>Gợi ý và điểm thưởng</summary>
                <p>
                  Cứ mở khi em cần. Thưởng dự kiến cập nhật theo số gợi ý đã
                  dùng: mỗi gợi ý bớt {practicePolicy.hintPenaltyGp} GP, luôn có
                  ít nhất {practicePolicy.minimumRewardGp} GP khi nộp đúng.
                </p>
              </details>
            )}
          </section>
          <section className="studio-coach-panel">
            <p className="studio-eyebrow">
              <Icon name="psychology" />
              Hỏi thêm một chút
            </p>
            <div className="studio-prompt-list">
              {problem.prompts.map((prompt, index) => (
                <div key={prompt.question}>
                  <Button
                    variant="ghost"
                    aria-expanded={promptIndex === index}
                    onClick={() => openPrompt(index)}
                  >
                    {prompt.question}
                    <Icon name="chevron_right" />
                  </Button>
                  {promptIndex === index && (
                    <p className="studio-hint-content">
                      <RichMathText text={prompt.answer} />
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
          <div className="studio-reward">
            <Icon name="military_tech" />
            <div>
              <strong>
                {session.rewarded
                  ? "Đã nhận thưởng hoàn thành"
                  : "Tự tin với từng bước giải"}
              </strong>
              <span>
                {session.rewarded
                  ? "Làm lại để hiểu sâu hơn"
                  : `${reward} GP dự kiến khi nộp bài đúng`}
              </span>
            </div>
            <span className="studio-chip">
              {usedHelp.length ? "Có gợi ý" : "Tự chủ"}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
