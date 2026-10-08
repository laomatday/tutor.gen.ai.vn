import { useRef, useState } from "react";
import { MathLatex, RichMathText, normalizeToLatex } from "../../components/MathLatex";
import { Alert, Button, Field, Icon, Textarea } from "../../components/ui";
import { appConfig } from "../../config/app";
import { routePath } from "../../config/routes";
import { storageKeys } from "../../config/storage";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { studentProfile } from "../learning/data/student";
import { formulaTools, practicePolicy, practiceProblem } from "./data";
import {
  autonomyReward,
  isPracticeSession,
  verifySampleAnswer,
  type AnswerCheck,
  type PracticeSession,
} from "./domain";

interface SelfSolveViewProps {
  onEarnGp: (amount: number, reason: string) => void;
  onNavigate?: (path: string) => void;
}

export function SelfSolveView({ onEarnGp, onNavigate }: SelfSolveViewProps) {
  const [session, setSession, storageError] = useLocalStorage<PracticeSession>(
    storageKeys.practiceSession,
    { input: practiceProblem.initialInput, openedHints: [1], rewarded: false },
    isPracticeSession,
  );
  const [check, setCheck] = useState<AnswerCheck | null>(null);
  const [activeTool, setActiveTool] = useState("formula");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submittedRef = useRef(session.rewarded);
  const openedEarly = session.openedHints.filter((id) => id !== 1).length;
  const reward = autonomyReward(appConfig.rewards.lessonCompletionGp, openedEarly);

  const updateInput = (input: string) => {
    setSession((previous) => ({ ...previous, input }));
    setCheck(null);
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
      textarea?.setSelectionRange(start + insertion.length, start + insertion.length);
    });
  };

  const inspect = () => setCheck(verifySampleAnswer(session.input, practiceProblem.point));

  const submit = () => {
    const result = verifySampleAnswer(session.input, practiceProblem.point);
    setCheck(result);
    if (!result.valid || submittedRef.current) return;
    submittedRef.current = true;
    setSession((previous) => ({ ...previous, rewarded: true }));
    onEarnGp(reward, `Hoàn thành ${practiceProblem.label}: ${practiceProblem.title}`);
  };

  const state = check?.valid || session.rewarded ? "success" : check ? "warning" : "active";

  return (
    <div className="learning-os-page ai-v3-page">
      <section className="ai-v3-page-banner ai-v3-page-banner--studio">
        <div>
          <p className="ai-v3-eyebrow">Focus Studio · Live Reasoning</p>
          <h1>Focus Studio</h1>
          <p>Giải bài cùng AI, rèn tư duy từng bước — không chỉ tìm ra đáp án mà hiểu sâu con đường đi tới đáp án.</p>
        </div>
        <img src="/learning-media/learning-horizon.svg" alt="" />
      </section>

      {storageError && <Alert tone="warning">{storageError}</Alert>}

      <section className="ai-v3-studio-statusbar">
        <span className="ai-v3-status ai-v3-status--primary"><i />Focus Studio Live</span>
        <span><Icon name="psychology" />Tự giác chủ động · Không giải hộ</span>
        <span className="ai-v3-status ai-v3-status--success"><Icon name="shield" />Socratic Guard: Đang bật</span>
        <span className="ml-auto font-mono font-bold text-brand"><Icon name="timer" />18:45 / 25:00</span>
        {onNavigate && <Button variant="secondary" size="sm" onClick={() => onNavigate(routePath("replay"))}><Icon name="history" />Replay Mode</Button>}
      </section>

      <section className="ai-v3-tool-ribbon" aria-label="Công cụ Focus Studio">
        {[
          ["formula", "functions", "Công thức toán"],
          ["sketch", "gesture", "Bút phác thảo"],
          ["graph", "show_chart", "Parabol tương tác"],
          ["tiles", "grid_view", "Algebra Tiles"],
          ["note", "edit_note", "Ghi chú nhanh"],
        ].map(([id, icon, label]) => (
          <Button
            key={id}
            variant="surface"
            aria-pressed={activeTool === id}
            className={activeTool === id ? "ai-v3-tool is-active" : "ai-v3-tool"}
            onClick={() => setActiveTool(id)}
          >
            <Icon name={icon} />{label}
          </Button>
        ))}
      </section>

      <div className="ai-v3-studio-layout">
        <main className="space-y-4">
          <section className="ai-v3-card ai-v3-problem-card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="ai-v3-status ai-v3-status--primary"><Icon name="target" />Đề bài</span>
              <span className="ai-v3-status">Tuyển sinh lớp 10</span>
              <span className="ai-v3-status">{practiceProblem.topic}</span>
              <span className="ml-auto hidden font-mono text-xs text-ink-500 sm:inline">ID: TS10-ALG-0492</span>
            </div>
            <h2 className="mt-4 text-xl font-bold leading-8 text-brand">
              <RichMathText text={practiceProblem.statement} />
            </h2>
          </section>

          <section className="ai-v3-reasoning-canvas">
            <div className="ai-v3-card__head">
              <div><p className="ai-v3-eyebrow"><Icon name="gesture" /> Quá trình tư duy & lời giải của bạn</p><h2 className="ai-v3-section-title">Reasoning Canvas</h2></div>
              <span className="text-xs text-accent-strong"><Icon name="cloud_done" />Tự động lưu</span>
            </div>

            <div className="ai-v3-reasoning-step" data-state="neutral">
              <span className="ai-v3-step-number">1</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3"><strong>Lần thử đầu tiên của bạn</strong><code>t = 00:42</code></div>
                <div className="mt-3 rounded-2xl bg-surface-page p-4 font-mono text-base text-brand">
                  x² − 5x + 6 = 0<br />⇒ (x − 1)(x + 6) = 0
                </div>
              </div>
            </div>

            <div className="ai-v3-reasoning-step" data-state={check && !check.valid ? "danger" : "neutral"}>
              <span className="ai-v3-step-number">2</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3"><strong>AI kiểm tra consistency</strong><code>t = 01:15</code></div>
                <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_260px]">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="font-semibold text-danger-700">Có vẻ chưa đúng!</p>
                    <p className="mt-2 text-sm leading-6 text-ink-600">Khi nhân ngược lại, hệ số giữa chưa khớp với đề bài. Hãy kiểm tra cả <strong>tổng</strong> và <strong>tích</strong> của cặp số.</p>
                  </div>
                  <div className="rounded-2xl bg-danger-50 p-4 text-sm leading-6 text-danger-800">
                    <b>Gợi ý Socratic</b><br />Hai số nào có tích bằng 6 và tổng bằng −5?
                  </div>
                </div>
              </div>
            </div>

            <div className="ai-v3-reasoning-step" data-state="active">
              <span className="ai-v3-step-number">3</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3"><strong>Bạn tự suy nghĩ và thử lại</strong><code>live</code></div>
                <div className="mt-3 rounded-2xl border border-brand/10 bg-white p-4">
                  <Field label="Reasoning trace" htmlFor="step-2-input" hint="Viết từng phép biến đổi; AI đọc trace thay vì chỉ đọc đáp án cuối.">
                    <Textarea
                      id="step-2-input"
                      ref={textareaRef}
                      value={session.input}
                      maxLength={practicePolicy.inputLimit}
                      rows={5}
                      readOnly={session.rewarded}
                      onChange={(event) => updateInput(event.target.value)}
                      aria-invalid={check ? !check.valid : undefined}
                      className="mt-2 min-h-32 font-mono text-base"
                    />
                  </Field>
                  {activeTool === "formula" && (
                    <div className="mt-3 flex flex-wrap gap-2" role="toolbar" aria-label="Chèn ký hiệu toán học">
                      {formulaTools.map((tool) => (
                        <Button key={tool.label} variant="secondary" size="sm" title={tool.title} onClick={() => insertFormula(tool.value)} disabled={session.rewarded}>{tool.label}</Button>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 rounded-xl bg-surface-page p-3">
                    <span className="text-xs font-semibold text-ink-500">Live math preview</span>
                    <div className="mt-2 overflow-x-auto text-lg"><MathLatex formula={normalizeToLatex(session.input)} /></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ai-v3-reasoning-step" data-state={state === "success" ? "success" : "neutral"}>
              <span className="ai-v3-step-number">4</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3"><strong>Hoàn thành lời giải</strong><code>{state === "success" ? "100%" : "pending"}</code></div>
                {check && <div role="status" className="mt-3"><Alert tone={check.valid ? "success" : "warning"}>{check.message}</Alert></div>}
                {!check && <p className="mt-3 text-sm text-ink-500">Kiểm tra bước hiện tại để AI xác nhận consistency trước khi nộp.</p>}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-5">
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" disabled={session.rewarded} onClick={() => updateInput(practiceProblem.initialInput)}><Icon name="undo" />Đặt lại</Button>
                <Button variant="secondary" disabled={session.rewarded} onClick={inspect}><Icon name="fact_check" />Kiểm tra bước</Button>
              </div>
              <Button onClick={submit} disabled={session.rewarded}><Icon name={session.rewarded ? "verified" : "send"} />{session.rewarded ? "Đã hoàn thành" : "Nộp reasoning"}</Button>
            </div>
          </section>

          <section className="ai-v3-card">
            <div className="ai-v3-card__head">
              <div><p className="ai-v3-eyebrow"><Icon name="grid_view" /> Trực quan hóa với Algebra Tiles</p><h2 className="ai-v3-section-title">Mô hình diện tích hình chữ nhật</h2></div>
              <Button variant="secondary">Mở công cụ trực quan <Icon name="arrow_forward" /></Button>
            </div>
            <div className="ai-v3-tiles-grid">
              <div className="ai-v3-algebra-tiles">
                <div className="tile-x2">x²</div><div className="tile-x">−3x</div><div className="tile-y">−2x</div><div className="tile-n">+6</div>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl bg-white p-4"><b className="text-brand">Giải thích</b><p className="mt-2 text-sm leading-6 text-ink-600">Hình chữ nhật có kích thước (x − 2) × (x − 3). Cộng bốn vùng diện tích thu được x² − 5x + 6.</p></div>
                <div className="rounded-2xl bg-accent/8 p-4 text-sm text-accent-strong"><Icon name="lightbulb" /> Nhìn hình giúp liên kết cấu trúc đại số với trực quan.</div>
              </div>
            </div>
          </section>
        </main>

        <aside className="space-y-4">
          <section className="ai-v3-card ai-v3-guide-panel">
            <div className="ai-v3-card__head">
              <div><p className="ai-v3-eyebrow"><Icon name="smart_toy" /> AI Pulse & Cognitive Guide</p><h2 className="ai-v3-section-title">Trợ lý đúng lúc, không giải hộ.</h2></div>
              <span className="h-2 w-2 rounded-full bg-success-500" />
            </div>

            <div className="ai-v3-sketchnote">
              <span>AI Sketchnote</span>
              <strong>PHÂN TÍCH NHÂN TỬ</strong>
              <code>x² − 5x + 6 = 0</code>
              <div className="grid grid-cols-2 gap-2"><i>Tổng = −5</i><i>Tích = 6</i></div>
              <b>(x − 2)(x − 3)</b>
            </div>

            <div className="ai-v3-node-section">
              <h3><Icon name="timeline" />Live Reasoning Trace</h3>
              <ul>
                <li className="is-good"><Icon name="check_circle" />Nhận diện dạng bài <small>00:12</small></li>
                <li className={check && !check.valid ? "is-gap" : ""}><Icon name="error" />Thử phân tích nhân tử <small>00:42</small></li>
                <li><Icon name="auto_awesome" />AI gợi ý Socratic <small>01:15</small></li>
                <li className={check?.valid ? "is-good" : ""}><Icon name="verified" />Tự kiểm tra cặp số <small>03:02</small></li>
              </ul>
            </div>

            <div className="ai-v3-node-section">
              <h3><Icon name="question_answer" />Gợi ý câu hỏi Socratic</h3>
              <div className="space-y-2">
                {["Hai số nào có tích bằng 6?","Làm thế nào để tổng của chúng bằng −5?","Em có thể kiểm tra lại bằng cách nhân ra không?"].map((q,i) => (
                  <Button key={q} variant="surface" className="w-full justify-between rounded-xl border border-ink-100 px-3 py-2 text-left text-xs"><span><b>{i+1}.</b> {q}</span><Icon name="arrow_forward" /></Button>
                ))}
              </div>
            </div>
          </section>

          <section className="ai-v3-card ai-v3-profile-mini">
            <img src={studentProfile.avatarUrl} alt={studentProfile.name} referrerPolicy="no-referrer" />
            <div><strong>{studentProfile.name}</strong><small>{studentProfile.levelLabel}</small></div>
            <div className="ml-auto text-right"><b>92%</b><small>Tự sửa lỗi</small></div>
          </section>

          {(session.rewarded || check?.valid) && onNavigate && (
            <Button className="w-full justify-between" onClick={() => onNavigate(routePath("replay"))}>Mở Thinking Replay <Icon name="arrow_forward" /></Button>
          )}
        </aside>
      </div>
    </div>
  );
}
