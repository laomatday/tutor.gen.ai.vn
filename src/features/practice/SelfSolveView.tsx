import { useRef, useState } from "react";
import { MathLatex, RichMathText, normalizeToLatex } from "../../components/MathLatex";
import { Alert, Badge, Button, Field, Icon, Textarea } from "../../components/ui";
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

const ToolTab = ({ icon, label, active = false }: { icon: string; label: string; active?: boolean }) => (
  <span className={active ? "studio-tool-tab is-active" : "studio-tool-tab"}>
    <Icon name={icon} />
    {label}
  </span>
);

export function SelfSolveView({ onEarnGp, onNavigate }: SelfSolveViewProps) {
  const [session, setSession, storageError] = useLocalStorage<PracticeSession>(
    storageKeys.practiceSession,
    { input: practiceProblem.initialInput, openedHints: [1], rewarded: false },
    isPracticeSession,
  );
  const [check, setCheck] = useState<AnswerCheck | null>(null);
  const [showGraph, setShowGraph] = useState(true);
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

  const openHint = (id: number) => {
    setSession((previous) => ({
      ...previous,
      openedHints: [...new Set([...previous.openedHints, id])],
    }));
  };

  const pulseText = check
    ? check.valid
      ? "Reasoning đã khớp. Em tự đi tới kết luận hợp lệ — Tutor chỉ cần ghi nhận trace."
      : "Có một bước chưa khép kín. AI sẽ chỉ hỏi gợi mở để em tự tìm điểm lệch."
    : openedEarly
      ? "Tutor đã nhận thấy em cần thêm một cầu nối nhỏ. Hãy thử trả lời một câu Socratic trước khi mở lời giải."
      : "Socratic Guard đang bật: AI quan sát cách em nghĩ nhưng chưa can thiệp.";

  const valid = Boolean(check?.valid || session.rewarded);

  return (
    <div className="learning-os-page focus-studio-v3">
      <section className="studio-hero-v3">
        <div>
          <p className="premium-eyebrow"><Icon name="my_location" /> Focus Studio</p>
          <h1>Giải bài cùng AI, rèn tư duy từng bước.</h1>
          <p>“Không chỉ tìm ra đáp án, mà hiểu sâu con đường đi đến đáp án.”</p>
        </div>
        <div className="studio-hero-v3__art">
          <span className="scenic-handnote">Tư duy hôm nay mạnh hơn phiên bản hôm qua ✦</span>
          <span className="studio-hero-quote">Những câu hỏi tốt sẽ dẫn bạn đi xa hơn những câu trả lời sẵn có.</span>
        </div>
      </section>

      {storageError && <Alert tone="warning">{storageError}</Alert>}

      <div className="studio-session-strip">
        <span className="premium-status premium-status--primary">● Focus Studio Live</span>
        <span><Icon name="psychology" /> Tự giác chủ động · Không giải hộ</span>
        <span className="premium-status premium-status--success"><Icon name="shield" /> Socratic Guard: Đang bật</span>
        <span><Icon name="timer" /> 18:45 / 25:00</span>
        <Button variant="ghost" size="sm" onClick={() => onNavigate?.(routePath("replay"))}>
          <Icon name="history" /> Replay Mode
        </Button>
      </div>

      <div className="studio-tool-ribbon">
        <ToolTab icon="functions" label="Công thức toán" active />
        <ToolTab icon="draw" label="Bút phác thảo" />
        <ToolTab icon="show_chart" label="Parabol tương tác" />
        <ToolTab icon="grid_view" label="Algebra Tiles" />
        <ToolTab icon="calculate" label="Máy tính" />
        <ToolTab icon="edit_note" label="Ghi chú nhanh" />
      </div>

      <div className="studio-layout-v3">
        <main className="studio-main-v3">
          <section className="studio-problem-v3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="premium-eyebrow"><Icon name="my_location" /> Đề bài</span>
              <Badge tone="primary">Tuyển sinh lớp 10</Badge>
              <Badge>{practiceProblem.topic}</Badge>
              <span className="ml-auto text-xs font-semibold text-ink-500">ID: TS10-ALG-0492</span>
            </div>
            <div className="mt-4 text-xl font-semibold leading-9 text-brand">
              <RichMathText text={practiceProblem.statement} />
            </div>
          </section>

          <section className="reasoning-canvas-v3">
            <div className="premium-section-heading">
              <div>
                <p className="premium-eyebrow"><Icon name="route" /> Quá trình tư duy & lời giải của bạn</p>
                <h2>Reasoning Canvas</h2>
              </div>
              <span className="inline-flex items-center gap-2 text-xs text-ink-500">
                <Icon name="cloud_done" /> Tự động lưu · 18:45
              </span>
            </div>

            <article className="reasoning-step-v3" data-state="neutral">
              <span className="reasoning-step-v3__index">1</span>
              <div className="reasoning-step-v3__body">
                <div className="reasoning-step-v3__heading">
                  <strong>Lần thử đầu tiên của bạn</strong>
                  <time>t = 00:42</time>
                </div>
                <div className="reasoning-math-box">
                  <RichMathText text={practiceProblem.setup} />
                  <div className="mt-3 text-lg text-brand">
                    <MathLatex formula={normalizeToLatex(practiceProblem.initialInput)} />
                  </div>
                </div>
              </div>
            </article>

            <article className="reasoning-step-v3" data-state={check && !check.valid ? "warning" : "waiting"}>
              <span className="reasoning-step-v3__index">2</span>
              <div className="reasoning-step-v3__body">
                <div className="reasoning-step-v3__heading">
                  <strong>{check && !check.valid ? "AI phát hiện điểm chưa chính xác" : "AI Guard đang quan sát"}</strong>
                  <time>t = 01:15</time>
                </div>
                <div className="reasoning-feedback-v3">
                  <div>
                    <Icon name={check && !check.valid ? "error" : "visibility"} />
                    <p>{check && !check.valid ? check.message : "Chưa có lỗi cần can thiệp. Hãy tự đi thêm một bước trước khi xin gợi ý."}</p>
                  </div>
                  <div className="reasoning-ai-nudge">
                    <Icon name="tips_and_updates" />
                    <p>
                      {check && !check.valid
                        ? "Em có thể kiểm tra lại dấu, bình phương số âm và xem mình đã cô lập hệ số a chưa?"
                        : "Nếu mắc, hãy tự hỏi: dữ kiện nào của điểm M phải thỏa mãn phương trình parabol?"}
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => openHint(2)}>
                      Gợi ý thêm một chút <Icon name="arrow_forward" />
                    </Button>
                  </div>
                </div>
              </div>
            </article>

            <article className="reasoning-step-v3" data-state="working">
              <span className="reasoning-step-v3__index">3</span>
              <div className="reasoning-step-v3__body">
                <div className="reasoning-step-v3__heading">
                  <strong>Bạn tự suy nghĩ và thử lại</strong>
                  <time>t = 03:28</time>
                </div>

                <div className="studio-input-v3">
                  <div className="studio-formula-toolbar" role="toolbar" aria-label="Chèn ký hiệu toán học">
                    {formulaTools.map((tool) => (
                      <Button
                        key={tool.label}
                        variant="secondary"
                        size="sm"
                        title={tool.title}
                        onClick={() => insertFormula(tool.value)}
                        disabled={session.rewarded}
                      >
                        {tool.label}
                      </Button>
                    ))}
                  </div>
                  <Field
                    label="Reasoning trace"
                    htmlFor="reasoning-input"
                    hint="Viết từng phép biến đổi. AI đánh giá trace, không chỉ đáp án cuối."
                  >
                    <Textarea
                      id="reasoning-input"
                      ref={textareaRef}
                      value={session.input}
                      maxLength={practicePolicy.inputLimit}
                      rows={5}
                      readOnly={session.rewarded}
                      onChange={(event) => updateInput(event.target.value)}
                      aria-invalid={check ? !check.valid : undefined}
                    />
                  </Field>
                  <div className="studio-live-preview">
                    <span>Live math preview</span>
                    <MathLatex formula={normalizeToLatex(session.input)} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" disabled={session.rewarded} onClick={inspect}>
                      <Icon name="fact_check" /> Kiểm tra bước
                    </Button>
                    <Button variant="ghost" disabled={session.rewarded} onClick={() => updateInput(practiceProblem.initialInput)}>
                      <Icon name="undo" /> Đặt lại
                    </Button>
                    <Button onClick={submit} disabled={session.rewarded}>
                      <Icon name="send" /> Nộp reasoning
                    </Button>
                  </div>
                </div>
              </div>
            </article>

            <article className="reasoning-step-v3" data-state={valid ? "success" : "locked"}>
              <span className="reasoning-step-v3__index">4</span>
              <div className="reasoning-step-v3__body">
                <div className="reasoning-step-v3__heading">
                  <strong>{valid ? "Hoàn thành lời giải" : "Kết luận sẽ mở khi reasoning khớp"}</strong>
                  <time>t = 04:12</time>
                </div>
                {valid ? (
                  <div className="reasoning-success-v3">
                    <Icon name="verified" />
                    <div>
                      <strong>Self-correction verified · Mastery Mindset +1</strong>
                      <p>{practiceProblem.conclusion}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-ink-500">
                    Tutor chưa hiển thị đáp án. Hãy hoàn thiện kết luận bằng cách tự cô lập hệ số a.
                  </p>
                )}
              </div>
            </article>

            {valid && onNavigate && (
              <Button className="w-full justify-center" onClick={() => onNavigate(routePath("replay"))}>
                <Icon name="history" /> Trace đã sẵn sàng · Mở Thinking Replay
              </Button>
            )}
          </section>

          <section className="visual-reasoning-v3">
            <div className="premium-section-heading">
              <div>
                <p className="premium-eyebrow"><Icon name="view_in_ar" /> Trực quan hóa hình học</p>
                <h2>Đồ thị Parabol từ hệ số a</h2>
                <p>Quan sát cách hệ số thay đổi độ mở và hướng của đồ thị.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setShowGraph((value) => !value)}>
                {showGraph ? "Ẩn trực quan" : "Mở trực quan"} <Icon name="arrow_forward" />
              </Button>
            </div>
            {showGraph && (
              <div className="parabola-visual-v3">
                <svg viewBox="0 0 520 280" role="img" aria-label="Đồ thị parabol y bằng 3x bình phương">
                  <line x1="35" y1="230" x2="490" y2="230" stroke="var(--color-ink-300)" strokeWidth="1.5" />
                  <line x1="260" y1="24" x2="260" y2="250" stroke="var(--color-ink-300)" strokeWidth="1.5" />
                  <path d="M95 42 C170 180 215 230 260 230 C305 230 350 180 425 42" fill="none" stroke="var(--color-brand)" strokeWidth="5" strokeLinecap="round" />
                  {[-2,-1,0,1,2].map((x, index) => {
                    const cx = 160 + index * 50;
                    const cy = 230 - (x * x) * 35;
                    return <circle key={x} cx={cx} cy={Math.max(cy,40)} r="6" fill="var(--color-accent)" />;
                  })}
                </svg>
                <div className="parabola-visual-v3__explain">
                  <strong>Bản chất đại số</strong>
                  <p>Điểm M(-2;12) buộc hệ số a sao cho 12 = a·4. Vì a &gt; 0 nên parabol mở lên.</p>
                  <span><Icon name="tips_and_updates" /> Khi a tăng, đồ thị hẹp hơn.</span>
                </div>
              </div>
            )}
          </section>
        </main>

        <aside className="studio-guide-v3">
          <section className="premium-card ai-guide-v3">
            <div className="ai-guide-v3__heading">
              <span className="ai-coach-orb"><Icon name="smart_toy" /></span>
              <div>
                <h2>AI Pulse & Cognitive Guide</h2>
                <p>Trợ lý đồng hành, gợi ý đúng lúc, không giải hộ</p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-success-500" />
            </div>

            <div className="ai-sketchnote-v3">
              <p className="premium-eyebrow">AI Sketchnote · Phân tích dữ kiện</p>
              <div className="ai-sketchnote-equation">
                <MathLatex formula="12=a(-2)^2" />
              </div>
              <div className="ai-sketchnote-arrows">
                <span>Điểm thuộc đồ thị</span>
                <span>(-2)² = 4</span>
                <span>12 = 4a</span>
                <span>a = 3</span>
              </div>
              <blockquote>Nhớ nhé: thay đúng tọa độ trước, rồi mới biến đổi đại số.</blockquote>
            </div>

            <div className="ai-pulse-note-v3">
              <Icon name="psychology" />
              <p>{pulseText}</p>
            </div>
          </section>

          <section className="premium-card">
            <div className="premium-card__heading">
              <div>
                <p className="premium-eyebrow"><Icon name="timeline" /> Live Reasoning Trace</p>
                <h2>Phiên hiện tại</h2>
              </div>
            </div>
            <ol className="live-trace-v3">
              <li data-state="success"><i />Nhận diện dữ kiện <time>00:12</time></li>
              <li data-state={check && !check.valid ? "warning" : "neutral"}><i />Kiểm tra phép biến đổi <time>00:42</time></li>
              <li data-state="primary"><i />AI gợi mở Socratic <time>01:15</time></li>
              <li data-state={valid ? "success" : "neutral"}><i />Tự kiểm tra kết luận <time>03:02</time></li>
              <li data-state={valid ? "success" : "neutral"}><i />Viết đáp án hoàn chỉnh <time>04:12</time></li>
            </ol>
          </section>

          <section className="premium-card">
            <div className="premium-card__heading">
              <div>
                <p className="premium-eyebrow"><Icon name="forum" /> Gợi ý câu hỏi Socratic</p>
                <h2>Tự hỏi trước khi mở đáp án</h2>
              </div>
            </div>
            <div className="socratic-question-list">
              {practiceProblem.prompts.map((prompt, index) => (
                <button key={prompt.question} onClick={() => openHint(Math.min(3, index + 1))}>
                  <span>{index + 1}</span>
                  <strong>{prompt.question}</strong>
                  <Icon name="arrow_forward" />
                </button>
              ))}
              <button onClick={() => openHint(3)}>
                <span>3</span>
                <strong>Em đã kiểm tra điều kiện a ≠ 0 chưa?</strong>
                <Icon name="arrow_forward" />
              </button>
            </div>
          </section>

          <section className="premium-card learner-mini-profile">
            <img src={studentProfile.avatarUrl} alt="" referrerPolicy="no-referrer" />
            <div>
              <strong>{studentProfile.name}</strong>
              <span>{studentProfile.levelLabel} · Pattern Hunter</span>
            </div>
            <span className="premium-status premium-status--success">92% tự sửa lỗi</span>
          </section>
        </aside>
      </div>
    </div>
  );
}
