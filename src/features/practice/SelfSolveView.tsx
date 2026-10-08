import { useRef, useState } from "react";
import { MathLatex, RichMathText, normalizeToLatex } from "../../components/MathLatex";
import { Alert, Badge, Button, Card, Field, Icon, Textarea } from "../../components/ui";
import { appConfig } from "../../config/app";
import { routePath } from "../../config/routes";
import { storageKeys } from "../../config/storage";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { formulaTools, practicePolicy, practiceProblem } from "./data";
import {
  autonomyReward,
  isPracticeSession,
  verifySampleAnswer,
  type AnswerCheck,
  type PracticeSession,
} from "./domain";
import { PracticeGuide } from "./PracticeGuide";

interface SelfSolveViewProps {
  onEarnGp: (amount: number, reason: string) => void;
  onNavigate?: (path: string) => void;
}

function GraphValues() {
  const coefficient = practiceProblem.point.y / practiceProblem.point.x ** 2;
  return (
    <Card className="scroll-mt-24 p-5" id="practice-graph" tabIndex={-1}>
      <h2 className="text-lg font-bold text-brand">Bảng giá trị để phác đồ thị</h2>
      <p className="mt-2 text-sm text-ink-600">
        Đánh dấu các điểm trên hệ trục tọa độ rồi nối thành một đường cong.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-72 text-center text-sm">
          <caption className="sr-only">
            Bảng giá trị của hàm số y = {coefficient}x²
          </caption>
          <thead>
            <tr className="bg-surface-page">
              <th scope="col" className="p-3">x</th>
              {practiceProblem.graphXs.map((x) => (
                <th scope="col" key={x} className="p-3">{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="p-3">
                <MathLatex formula={`y=${coefficient}x^2`} />
              </th>
              {practiceProblem.graphXs.map((x) => (
                <td key={x} className="p-3">{coefficient * x ** 2}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function SelfSolveView({ onEarnGp, onNavigate }: SelfSolveViewProps) {
  const [session, setSession, storageError] = useLocalStorage<PracticeSession>(
    storageKeys.practiceSession,
    { input: practiceProblem.initialInput, openedHints: [1], rewarded: false },
    isPracticeSession,
  );
  const [check, setCheck] = useState<AnswerCheck | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submittedRef = useRef(session.rewarded);
  const openedEarly = session.openedHints.filter((id) => id !== 1).length;
  const reward = autonomyReward(
    appConfig.rewards.lessonCompletionGp,
    openedEarly,
  );
  const visibleHints = [
    ...new Set([
      ...session.openedHints,
      ...(check ? [2] : []),
      ...(check?.valid || session.rewarded ? [2, 3] : []),
    ]),
  ];

  const updateInput = (input: string) => {
    setSession((previous) => ({ ...previous, input }));
    setCheck(null);
  };

  const openGraph = () => {
    setShowGraph(true);
    requestAnimationFrame(() => {
      const graph = document.getElementById("practice-graph");
      graph?.focus({ preventScroll: true });
      graph?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const insertFormula = (formula: string) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? session.input.length;
    const end = textarea?.selectionEnd ?? start;
    const insertion = ` ${formula} `;
    updateInput(
      `${session.input.slice(0, start)}${insertion}${session.input.slice(end)}`.slice(
        0,
        practicePolicy.inputLimit,
      ),
    );
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(
        start + insertion.length,
        start + insertion.length,
      );
    });
  };

  const inspect = () => {
    setCheck(verifySampleAnswer(session.input, practiceProblem.point));
  };

  const submit = () => {
    const result = verifySampleAnswer(session.input, practiceProblem.point);
    setCheck(result);
    if (!result.valid || submittedRef.current) return;
    submittedRef.current = true;
    setSession((previous) => ({ ...previous, rewarded: true }));
    onEarnGp(
      reward,
      `Hoàn thành ${practiceProblem.label}: ${practiceProblem.title}`,
    );
  };

  const pulse = check
    ? check.valid
      ? "Reasoning đã khớp. Hãy nộp bài và mở Replay để xem lại đường suy nghĩ."
      : check.message
    : openedEarly
      ? "Bạn đã cần thêm gợi ý. Tutor đang đánh dấu bước này là một tín hiệu để mission sau điều chỉnh độ khó."
      : "Tutor chưa can thiệp. Hãy tự đi thêm một bước; nếu mắc, AI sẽ hỏi đúng tại vị trí đó thay vì đưa đáp án.";

  return (
    <div className="learning-os-page">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="signal-label">
            <Icon name="edit_square" />
            Focus Studio
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-brand sm:text-5xl">
            Nghĩ trên canvas. AI chỉ xuất hiện khi thật sự cần.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-600">
            Không gian này ưu tiên reasoning trace: từng phép biến đổi, gợi ý đã
            mở và lần tự sửa đều trở thành dữ liệu cho mission tiếp theo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={session.rewarded ? "success" : "primary"}>
            {session.rewarded
              ? "Mission hoàn tất"
              : `Tự chủ tối đa +${reward} GP`}
          </Badge>
          <Badge>{practiceProblem.course}</Badge>
        </div>
      </header>

      {storageError && <Alert tone="warning">{storageError}</Alert>}

      <div className="studio-shell">
        <main className="studio-canvas" aria-label="Canvas giải bài">
          <div className="studio-canvas__top">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-white">
                <Icon name="psychology" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-accent-strong">
                  Live reasoning session
                </p>
                <p className="text-sm font-semibold text-brand">
                  {practiceProblem.topic}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-ink-500">
              <span className="h-2 w-2 rounded-full bg-accent" />
              trace recording
            </span>
          </div>

          <section className="studio-problem">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge tone="primary">{practiceProblem.label}</Badge>
              <Badge>{practiceProblem.difficulty}</Badge>
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-brand">
              {practiceProblem.title}
            </h2>
            <div className="mt-4 text-base leading-8 text-ink-800">
              <RichMathText text={practiceProblem.statement} />
            </div>
          </section>

          <section className="studio-workspace">
            <div className="rounded-2xl bg-accent/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-accent-strong">
                Bước đã neo
              </p>
              <div className="mt-2 text-sm leading-7 text-ink-700">
                <RichMathText text={practiceProblem.setup} />
              </div>
            </div>

            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-brand">
                    Workspace của bạn
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    Viết từng phép biến đổi. Tutor đọc trace thay vì chỉ đọc đáp án cuối.
                  </p>
                </div>
                <div
                  className="flex flex-wrap gap-2"
                  role="toolbar"
                  aria-label="Chèn ký hiệu toán học"
                >
                  {formulaTools.map((tool) => (
                    <Button
                      key={tool.label}
                      variant="secondary"
                      size="sm"
                      title={tool.title}
                      aria-label={`Chèn ${tool.title.toLowerCase()}`}
                      onClick={() => insertFormula(tool.value)}
                      disabled={session.rewarded}
                    >
                      {tool.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="studio-input">
                <Field
                  label="Reasoning trace"
                  htmlFor="step-2-input"
                  hint="Có thể viết a = 12/4 = 3 hoặc chuỗi biến đổi bằng ⇔."
                >
                  <Textarea
                    id="step-2-input"
                    ref={textareaRef}
                    value={session.input}
                    maxLength={practicePolicy.inputLimit}
                    rows={6}
                    readOnly={session.rewarded}
                    onChange={(event) => updateInput(event.target.value)}
                    aria-invalid={check ? !check.valid : undefined}
                    className="min-h-36 border-0 bg-transparent shadow-none focus:ring-0"
                  />
                </Field>
              </div>
            </div>

            <div className="rounded-2xl border border-ink-100 bg-white p-4">
              <p className="mb-2 text-xs font-semibold text-ink-500">
                Live math preview
              </p>
              <div className="overflow-x-auto text-lg">
                <MathLatex formula={normalizeToLatex(session.input)} />
              </div>
            </div>

            {check && (
              <div id="practice-check" role="status">
                <Alert tone={check.valid ? "success" : "warning"}>
                  {check.message}
                </Alert>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-5">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  disabled={session.rewarded}
                  onClick={() => updateInput(practiceProblem.initialInput)}
                >
                  <Icon name="undo" />
                  Đặt lại
                </Button>
                <Button
                  variant="secondary"
                  disabled={session.rewarded}
                  onClick={inspect}
                >
                  <Icon name="fact_check" />
                  Kiểm tra bước
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowGraph((value) => !value)}
                  aria-expanded={showGraph}
                  aria-controls="practice-graph"
                >
                  <Icon name="table_chart" />
                  {showGraph ? "Ẩn dữ liệu" : "Mở dữ liệu"}
                </Button>
              </div>
              <Button onClick={submit} disabled={session.rewarded}>
                <Icon name={session.rewarded ? "verified" : "send"} />
                {session.rewarded ? "Đã hoàn thành" : "Nộp reasoning"}
              </Button>
            </div>

            {showGraph && <GraphValues />}

            {(session.rewarded || check?.valid) && onNavigate && (
              <div className="rounded-3xl border border-accent/20 bg-accent/5 p-5">
                <p className="signal-label">
                  <Icon name="replay" />
                  Trace ready
                </p>
                <h3 className="mt-2 text-lg font-bold text-brand">
                  Replay đã sẵn sàng.
                </h3>
                <p className="mt-1 text-sm leading-6 text-ink-600">
                  Xem lại lúc nào bạn đổi chiến lược, mở gợi ý và tự sửa lỗi.
                </p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => onNavigate(routePath("replay"))}
                >
                  Mở Thinking Replay
                  <Icon name="arrow_forward" />
                </Button>
              </div>
            )}
          </section>
        </main>

        <aside className="space-y-5">
          <section className="ai-pulse">
            <div className="ai-pulse__head">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-accent-pale">
                <Icon name="auto_awesome" />
                AI Pulse
              </p>
              <h2 className="mt-2 text-xl font-bold text-white">
                Tutor đang quan sát cách bạn nghĩ.
              </h2>
            </div>
            <div className="ai-pulse__body">
              <div className="ai-pulse__message">{pulse}</div>
              <div className="space-y-3 text-xs text-white/70">
                <div className="flex items-center justify-between">
                  <span>Gợi ý mở thêm</span>
                  <strong className="text-white">{openedEarly}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Autonomy reward</span>
                  <strong className="text-accent-pale">+{reward} GP</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Trace state</span>
                  <strong className="text-white">
                    {check?.valid ? "stable" : check ? "review" : "observing"}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <PracticeGuide
            visibleHints={visibleHints}
            reward={reward}
            onOpenHint={(id) =>
              setSession((previous) => ({
                ...previous,
                openedHints: [...new Set([...previous.openedHints, id])],
              }))
            }
            onShowGraph={openGraph}
          />
        </aside>
      </div>
    </div>
  );
}
