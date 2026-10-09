import { useRef, useState } from "react";
import { Alert, Button, Field, Icon, Select, Tabs, Textarea } from "../../components/ui";
import { RichMathText } from "../../components/MathLatex";
import { appConfig } from "../../config/app";
import { studentProfile } from "../../features/curriculum";
import type { PracticeProblem } from "../../types/content";
import {
  formulaTools,
  getPracticeProblems,
  practicePolicy,
} from "../../features/practice/data";
import {
  appendPracticeEvent,
  autonomyReward,
  getPracticeStats,
  getUsedPracticeHelp,
  verifyPracticeAnswer,
  type AnswerCheck,
} from "../../features/practice/domain";
import { usePracticeSession } from "../../features/practice/usePracticeSession";
import { getEnrolledPracticeProblems } from "../../features/practice/eligibility";
import { GraphStudy, SketchPad, AlgebraTiles } from "../../features/practice/StudyTools";
import { useCurriculum } from "../../context/CurriculumContext";
import { selectMathLab } from "../../features/microLabs/domain";
import { QuadraticMicroLab } from "../../features/microLabs/QuadraticMicroLab";
import { V2HeroArtwork } from "../components/V2HeroArtwork";
import "./focus-studio.css";
import "../../styles/student-studio.css";

type Tool = "graph" | "sketch" | "tiles" | "lab";

const toolItems = [
  { id: "graph", label: "Đồ thị", icon: "timeline" },
  { id: "sketch", label: "Vẽ nháp", icon: "gesture" },
  { id: "tiles", label: "Đại số", icon: "grid_view" },
  { id: "lab", label: "Micro-lab", icon: "science" },
] as const;

interface Props {
  onNavigate: (path: string) => void;
  onEarnGp: (amount: number, reason: string) => void;
  search: string;
}

export function FocusStudioPage({ onNavigate, onEarnGp, search }: Props) {
  const available = getEnrolledPracticeProblems(
    getPracticeProblems(),
    studentProfile.enrollments,
  );
  const queryId = new URLSearchParams(search).get("problem");
  const problem = queryId
    ? available.find((item) => item.id === queryId)
    : available.find((item) => item.id === practicePolicy.defaultStudioProblemId) ?? available[0];
  if (!problem) {
    return (
      <div className="v2-focus-empty">
        <Icon name="info" />
        <h1>Không tìm thấy bài luyện phù hợp</h1>
        <p>Đề bài không khả dụng hoặc chưa được mở trong khóa học của em.</p>
        <Button onClick={() => onNavigate("/hoc-bai")}>Xem các môn học</Button>
      </div>
    );
  }
  return (
    <FocusWorkspace
      key={problem.id}
      problem={problem}
      available={available}
      onNavigate={onNavigate}
      onEarnGp={onEarnGp}
    />
  );
}

function FocusWorkspace({
  problem,
  available,
  onNavigate,
  onEarnGp,
}: Omit<Props, "search"> & {
  problem: PracticeProblem;
  available: PracticeProblem[];
}) {
  const [session, updateSession, storageError] = usePracticeSession(problem.id);
  const { lessons, topics } = useCurriculum();
  const lab = selectMathLab(problem, lessons, topics, studentProfile.enrollments);
  const [tool, setTool] = useState<Tool>("graph");
  const [check, setCheck] = useState<AnswerCheck | null>(null);
  const [expandedPrompt, setExpandedPrompt] = useState<number | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const rewardRef = useRef(session.rewarded);
  const stats = getPracticeStats(session);
  const last = stats.checks.at(-1);
  const help = getUsedPracticeHelp(session);
  const reward = autonomyReward(appConfig.rewards.lessonCompletionGp, help.length);
  const usableTools = toolItems.filter((item) => item.id !== "lab" || lab);

  const updateInput = (input: string) => {
    updateSession((current) => ({ ...current, input }));
    setCheck(null);
  };
  const showHint = (hint: PracticeProblem["hints"][number]) => {
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
    const visible = expandedPrompt === index ? null : index;
    setExpandedPrompt(visible);
    if (visible === null) return;
    const prompt = problem.prompts[index];
    const detail = `${prompt.question} ${prompt.answer}`;
    updateSession((current) =>
      (current.events ?? []).some((event) => event.kind === "hint" && event.detail === detail)
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
  const insertFormula = (formula: string) => {
    const element = textarea.current;
    const start = element?.selectionStart ?? session.input.length;
    const end = element?.selectionEnd ?? start;
    updateInput(
      (session.input.slice(0, start) + formula + session.input.slice(end)).slice(
        0,
        practicePolicy.inputLimit,
      ),
    );
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(start + formula.length, start + formula.length);
    });
  };
  const resetDraft = () => {
    updateSession((current) => ({
      ...current,
      input: "",
      sketch: [],
      openedHints: [],
      usedHelp: getUsedPracticeHelp(current),
    }));
    setCheck(null);
    setExpandedPrompt(null);
    requestAnimationFrame(() => textarea.current?.focus());
  };

  return (
    <div className="v2-focus-page">
      <header className="v2-focus-hero">
        <V2HeroArtwork />
        <div>
          <p className="v2-focus-eyebrow"><Icon name="track_changes" /> Tự thử trước, hiểu sâu sau</p>
          <h1>Focus <span>Studio</span></h1>
          <p>Không chỉ tìm đáp án. Hãy khám phá cách em tự giải quyết vấn đề.</p>
        </div>
      </header>

      <section className="v2-focus-problem" aria-label="Đề bài hiện tại">
        <div className="v2-focus-panel-top">
          <h2><Icon name="track_changes" /> Bài toán hôm nay</h2>
          <label className="v2-focus-picker">
            <span>Đổi bài</span>
            <Select
              aria-label="Chọn bài tập luyện tập"
              value={problem.id}
              onChange={(event) => onNavigate(`/tu-giai?problem=${event.target.value}`)}
            >
              {available.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </Select>
          </label>
        </div>
        <div className="v2-focus-problem-body">
          <div className="v2-focus-problem-tags">
            <span><Icon name="school" /> {problem.course}</span>
            <span>{problem.difficulty}</span>
          </div>
          <h3><RichMathText text={problem.statement} /></h3>
          <div className="v2-focus-problem-footer">
            <span><Icon name="timer" /> {problem.durationMinutes ?? "—"} phút dự kiến</span>
            <Button onClick={() => {
              textarea.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              textarea.current?.focus({ preventScroll: true });
            }}>
              Viết lời giải <Icon name="arrow_forward" />
            </Button>
          </div>
        </div>
      </section>

      {storageError && <div className="v2-focus-alert"><Alert tone="warning">{storageError}</Alert></div>}
      <div className="v2-focus-workspace">
        <section className="v2-focus-editor" aria-labelledby="v2-focus-editor-title">
          <div className="v2-focus-panel-top">
            <h2 id="v2-focus-editor-title"><Icon name="edit_square" /> Thử lời giải của em</h2>
            <span className="v2-focus-save-state"><Icon name="save" /> Lưu trên thiết bị</span>
          </div>
          <div className="v2-focus-editor-surface">
            <Field
              label="Trình bày từng phép biến đổi"
              hint="Viết cách làm theo từng bước. Công cụ chỉ kiểm tra các dạng biểu thức được hỗ trợ."
            >
              <Textarea
                ref={textarea}
                rows={9}
                value={session.input}
                maxLength={practicePolicy.inputLimit}
                placeholder="Viết ý tưởng đầu tiên của em ở đây…"
                onChange={(event) => updateInput(event.target.value)}
              />
            </Field>
            <div className="v2-focus-formulas" role="toolbar" aria-label="Chèn ký hiệu toán học">
              {formulaTools.map((item) => (
                <Button
                  variant="ghost"
                  key={item.label}
                  title={item.title}
                  onClick={() => insertFormula(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <div className="v2-focus-editor-actions">
              <Button onClick={() => inspect(false)}>
                <Icon name="fact_check" /> Kiểm tra từng bước
              </Button>
              <Button variant="secondary" onClick={() => inspect(true)}>
                <Icon name="send" /> Nộp bài
              </Button>
            </div>
          </div>
          <div className="v2-focus-editor-bottom">
            <span>{session.input.length}/{practicePolicy.inputLimit} ký tự</span>
            <Button variant="ghost" onClick={resetDraft}>
              <Icon name="refresh" /> Xóa bản nháp
            </Button>
          </div>
        </section>

        <section className="v2-focus-visual" aria-label="Công cụ trực quan">
          <div className="v2-focus-panel-top">
            <h2><Icon name="timeline" /> Khám phá trực quan</h2>
          </div>
          <Tabs
            label="Công cụ Focus Studio V2"
            tabs={usableTools}
            value={tool}
            onChange={setTool}
            variant="pill"
            className="v2-focus-tool-tabs"
          />
          <div className="v2-focus-tool-content">
            {!stats.checks.length && (tool === "graph" || tool === "lab" || tool === "tiles") ? (
              <div className="v2-focus-tool-locked">
                <Icon name="psychology" />
                <h3>Hãy thử một bước giải trước nhé</h3>
                <p>Đồ thị và mô hình sẽ giúp em tự kiểm tra ý tưởng sau lần thử đầu tiên.</p>
                <Button onClick={() => textarea.current?.focus()}>
                  Bắt đầu viết
                </Button>
              </div>
            ) : tool === "graph" ? (
              <GraphStudy
                problem={problem}
                unlocked={
                  stats.solved ||
                  session.openedHints.includes(problem.hints.at(-1)?.id ?? 0)
                }
              />
            ) : tool === "sketch" ? (
              <SketchPad
                strokes={session.sketch ?? []}
                onChange={(sketch) =>
                  updateSession((current) => ({ ...current, sketch }))
                }
              />
            ) : tool === "tiles" ? (
              <AlgebraTiles problem={problem} />
            ) : tool === "lab" && lab ? (
              <QuadraticMicroLab lab={lab} />
            ) : null}
          </div>
          <p className="v2-focus-visual-caption">
            Mô hình và nét vẽ giúp quan sát; nét phác thảo chưa được chấm tự động.
          </p>
        </section>

        <aside className="v2-focus-aside" aria-label="Gợi ý và các lần thử">
          <section className="v2-focus-hints">
            <div className="v2-focus-panel-top">
              <h2><Icon name="lightbulb" /> Gợi ý theo bước</h2>
            </div>
            <p>Gợi ý có thể làm giảm điểm thưởng; em vẫn là người giải bài.</p>
            <div className="v2-focus-hint-list">
              {problem.hints.map((hint) => {
                const open = session.openedHints.includes(hint.id);
                const locked = hint.id > 1 && !stats.checks.length;
                return (
                  <div key={hint.id} className="v2-focus-hint">
                    <Button
                      variant="ghost"
                      aria-expanded={open}
                      disabled={locked}
                      onClick={() => showHint(hint)}
                    >
                      <span>{hint.id}</span>
                      <strong>{hint.title}</strong>
                      <Icon name={open ? "check_circle" : "expand_more"} />
                    </Button>
                    {open && (
                      <div className="v2-focus-hint-copy"><RichMathText text={hint.text} /></div>
                    )}
                    {locked && (
                      <small>Kiểm tra một bước để mở gợi ý này.</small>
                    )}
                  </div>
                );
              })}
            </div>
            <details className="v2-focus-socratic">
              <summary>Thêm câu hỏi định hướng</summary>
              {problem.prompts.map((prompt, index) => (
                <div key={prompt.question}>
                  <Button
                    variant="ghost"
                    aria-expanded={expandedPrompt === index}
                    onClick={() => openPrompt(index)}
                  >
                    {prompt.question} <Icon name="chevron_right" />
                  </Button>
                  {expandedPrompt === index && (
                    <div><RichMathText text={prompt.answer} /></div>
                  )}
                </div>
              ))}
            </details>
          </section>
          <section className="v2-focus-attempts">
            <div className="v2-focus-panel-top">
              <h2><Icon name="history" /> Lần thử gần đây</h2>
              <Button variant="ghost" onClick={() => onNavigate(`/replay?problem=${problem.id}`)}>
                Xem tất cả
              </Button>
            </div>
            {stats.checks.length ? (
              <ol aria-label="Các lần kiểm tra đã ghi nhận">
                {stats.checks.slice(-3).map((event, index) => (
                  <li key={event.id} data-correct={event.valid}>
                    <Icon name={event.valid ? "check_circle" : "edit_note"} />
                    <span>
                      <strong>Lần {stats.checks.length - Math.min(3, stats.checks.length) + index + 1}</strong>
                      <small>{event.valid ? "Bước giải khớp" : "Cần thử lại"}</small>
                    </span>
                    <time>{new Date(event.at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</time>
                  </li>
                ))}
              </ol>
            ) : (
              <p>Chưa có lần kiểm tra nào. Viết ý tưởng rồi nhấn Kiểm tra.</p>
            )}
          </section>
        </aside>
      </div>

      <section className="v2-focus-feedback" aria-label="Đánh giá và phản hồi">
        <div className="v2-focus-panel-top">
          <h2><Icon name="psychology" /> Phản hồi từ bước giải</h2>
          <span>{session.rewarded ? "Đã nhận thưởng hoàn thành" : `${reward} GP dự kiến nếu nộp đúng`}</span>
        </div>
        <div className="v2-focus-feedback-grid">
          <div className="v2-focus-feedback-card" data-kind="positive">
            <h3><Icon name="check_circle" /> Điều đã làm được</h3>
            <p>{stats.solved
              ? "Bài đã được kiểm tra đúng bằng quy tắc toán học của đề này."
              : stats.checks.length
                ? `Em đã tự kiểm tra ${stats.checks.length} lượt. Mỗi lần thử là dữ liệu để xem lại.`
                : "Hãy bắt đầu bằng một phép biến đổi của riêng em."}</p>
          </div>
          <div className="v2-focus-feedback-card" data-kind="revision" role="status">
            <h3><Icon name="edit_note" /> Điều cần xem lại</h3>
            <p>{check?.message ?? last?.detail ?? "Chưa có phản hồi. Công cụ sẽ chỉ ra bước cần điều chỉnh sau khi kiểm tra."}</p>
          </div>
          <div className="v2-focus-feedback-card" data-kind="next">
            <h3><Icon name="arrow_forward" /> Bước tiếp theo</h3>
            <p>{stats.solved
              ? "Mở Thinking Replay để xem lại cách em đã tìm ra lời giải."
              : stats.checks.length
                ? "Kiểm tra phép biến đổi tiếp theo; mở gợi ý khi cần."
                : "Tự thử một bước trước khi xem mô hình trực quan."}</p>
          </div>
          <Button
            className="v2-focus-replay-action"
            onClick={() => onNavigate(`/replay?problem=${problem.id}`)}
          >
            <Icon name="history" /> Xem Thinking Replay
          </Button>
        </div>
        <p className="v2-focus-feedback-integrity">
          <Icon name="info" /> Phản hồi đối chiếu từ quy tắc toán hiện có; không phải đánh giá từ mô hình AI trực tiếp.
        </p>
      </section>
    </div>
  );
}
