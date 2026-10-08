import { useRef, useState } from "react";
import { RichMathText } from "../../components/MathLatex";
import { Alert, Button, Field, Icon, Textarea } from "../../components/ui";
import { useCurriculum } from "../../context/CurriculumContext";
import { appConfig } from "../../config/app";
import { storageKeys } from "../../config/storage";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { getCourseProgress } from "../curriculum";
import { formulaTools, getPracticeProblem, practicePolicy } from "./data";
import { ParabolaStudy } from "./ParabolaStudy";
import {
  appendPracticeEvent, autonomyReward, createPracticeSession,
  isPracticeSession, verifySampleAnswer, type AnswerCheck, type PracticeSession,
} from "./domain";

interface Props {
  onEarnGp: (amount: number, reason: string) => void;
  onNavigate?: (path: string) => void;
}

export function SelfSolveView({ onEarnGp, onNavigate }: Props) {
  const id = new URLSearchParams(window.location.search).get("problem");
  const problem = getPracticeProblem(id || undefined);
  const { lessons, topics, completedLessonIds } = useCurriculum();
  const progress = getCourseProgress(lessons, topics, completedLessonIds);
  const [session, setSession, storageError] = useLocalStorage<PracticeSession>(
    storageKeys.practiceSessionV2,
    createPracticeSession(problem.id),
    isPracticeSession,
  );
  const [check, setCheck] = useState<AnswerCheck | null>(null);
  const [promptIndex, setPromptIndex] = useState<number | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const rewardRef = useRef(session.rewarded);
  const activeSession = session.problemId === problem.id ? session : createPracticeSession(problem.id);
  const usedHints = activeSession.openedHints.length;
  const checks = (activeSession.events ?? []).filter(e => e.kind === "check" || e.kind === "submit");
  const reward = autonomyReward(appConfig.rewards.lessonCompletionGp, usedHints);

  const updateInput = (input: string) => {
    setSession((current) => ({ ...(current.problemId === problem.id ? current : createPracticeSession(problem.id)), input }));
    setCheck(null);
  };
  const showHint = (hint: { id: number; title: string }) => {
    if (activeSession.openedHints.includes(hint.id)) return;
    setSession((current) => {
      const base = current.problemId === problem.id ? current : createPracticeSession(problem.id);
      const next = { ...base, openedHints: [...base.openedHints, hint.id] };
      return appendPracticeEvent(next, "hint", `Mở gợi ý ${hint.id}: ${hint.title}`);
    });
  };
  const inspect = () => {
    const result = verifySampleAnswer(activeSession.input, problem.point);
    setCheck(result);
    setSession((current) => appendPracticeEvent(current.problemId === problem.id ? current : createPracticeSession(problem.id), "check", result.message, result.valid));
  };
  const submit = () => {
    const result = verifySampleAnswer(activeSession.input, problem.point);
    setCheck(result);
    setSession((current) => ({
      ...appendPracticeEvent(current, "submit", result.message, result.valid),
      rewarded: current.rewarded || result.valid,
    }));
    if (result.valid && !rewardRef.current) {
      rewardRef.current = true;
      onEarnGp(reward, `Hoàn thành: ${problem.title}`);
    }
  };
  const reset = () => {
    setSession((current) => ({ ...createPracticeSession(problem.id), rewarded: current.rewarded }));
    setCheck(null);
    setPromptIndex(null);
    requestAnimationFrame(() => textarea.current?.focus());
  };
  const insertFormula = (value: string) => {
    const input = textarea.current;
    const start = input?.selectionStart ?? activeSession.input.length;
    const end = input?.selectionEnd ?? start;
    updateInput(`${activeSession.input.slice(0, start)}${value}${activeSession.input.slice(end)}`.slice(0, practicePolicy.inputLimit));
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + value.length, start + value.length);
    });
  };

  return (
    <div className="learning-os-page ai-v3-page advanced-workspace">
      <header className="ai-v3-page-banner advanced-focus-banner">
        <p className="learning-mvp-kicker">FOCUS STUDIO · {problem.course}</p>
        <h1>Focus Studio · Tự giải bài tập</h1>
        <p>Viết các bước giải của bạn, nhận phản hồi từ bộ kiểm tra toán học và xem lại những lần thử. Đây chưa phải chức năng chấm bài bằng AI.</p>
      </header>
      <div className="ai-v3-studio-statusbar">
        <span className="ai-v3-status ai-v3-status--primary"><Icon name="edit_square"/> Phiên tự giải</span>
        <span><Icon name="timer"/> {checks.length} lượt kiểm tra/nộp bài</span>
        <span><Icon name="lightbulb"/> {usedHints}/{problem.hints.length} gợi ý đã mở</span>
        <span className="ml-auto"><Icon name="save"/> Lưu trên thiết bị</span>
      </div>
      {storageError && <Alert tone="warning">{storageError}</Alert>}
      <div className="ai-v3-studio-layout">
        <div className="space-y-4">
          <section className="ai-v3-card">
            <p className="learning-mvp-kicker">{problem.label} · {problem.topic}</p>
            <h2 className="mt-2 text-xl font-bold text-brand">{problem.title}</h2>
            <div className="mt-4 text-base leading-8"><RichMathText text={problem.statement} /></div>
            <p className="mt-3 text-xs text-ink-500">Mã bài: {problem.id} · {progress.completed}/{progress.total} bài học đã hoàn thành</p>
          </section>

          <section className="ai-v3-card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-brand"><Icon name="gesture" className="mr-2 inline text-accent-strong"/>Reasoning Canvas · Bài làm của em</h2>
              <span className="text-xs text-ink-600"><Icon name="save" className="inline h-4 w-4" /> Lưu trên trình duyệt</span>
            </div>
            <Field label="Trình bày từng phép biến đổi" hint="Ví dụ: thế tọa độ, rút gọn, tìm hệ số và kiểm tra điều kiện. Không cần viết lại đề.">
              <Textarea ref={textarea} rows={8} value={activeSession.input} maxLength={practicePolicy.inputLimit}
                placeholder="Viết bước giải đầu tiên của bạn tại đây…"
                onChange={(event) => updateInput(event.target.value)} className="min-h-44 font-mono text-base" />
            </Field>
            <div className="mt-3 flex flex-wrap gap-2" role="toolbar" aria-label="Chèn ký hiệu toán học">
              {formulaTools.map((tool) => (
                <Button key={tool.label} variant="secondary" size="sm" onClick={() => insertFormula(tool.value)}
                  title={tool.title}>{tool.label}</Button>
              ))}
            </div>
            {check && <div role="status" className="mt-4"><Alert tone={check.valid ? "success" : "warning"}>{check.message}</Alert></div>}
            <div className="mt-5 flex flex-wrap gap-2 border-t border-ink-100 pt-5">
              <Button onClick={submit}><Icon name="send" /> Nộp bài</Button>
              <Button variant="secondary" onClick={inspect}><Icon name="fact_check" /> Kiểm tra bước giải</Button>
              <Button variant="ghost" onClick={reset}><Icon name="restart_alt" /> Làm bài mới</Button>
              {onNavigate && <Button variant="ghost" onClick={() => onNavigate(`/replay?problem=${problem.id}`)}><Icon name="history" /> Xem lại bài làm</Button>}
            </div>
            {activeSession.rewarded && <p className="mt-3 text-xs text-ink-600">Bạn đã nhận thưởng hoàn thành bài mẫu này. Làm lại không cộng điểm lần thứ hai.</p>}
          </section>
          <section className="ai-v3-card">
            <div className="ai-v3-card__head">
              <div><p className="ai-v3-eyebrow"><Icon name="timeline"/> NHẬT KÝ THAO TÁC</p><h2 className="ai-v3-section-title">Các bước đã kiểm tra</h2></div>
              <span className="ai-v3-status">{checks.length} lượt thực tế</span>
            </div>
            {!checks.length ? (
              <p className="text-sm text-ink-600">Chưa có bước nào được kiểm tra. Viết lời giải rồi bấm “Kiểm tra bước giải” để ghi nhận.</p>
            ) : (
              <ol className="space-y-3">
                {checks.map((event, index) => (
                  <li key={event.id} className="ai-v3-reasoning-step" data-state={event.valid ? "success" : "danger"}>
                    <span className="ai-v3-step-number">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <strong>{event.kind === "submit" ? "Nộp bài" : "Kiểm tra"} · {event.valid ? "Phù hợp" : "Cần sửa"}</strong>
                      {event.input && <pre className="learning-mvp-event-data">{event.input}</pre>}
                      <p className="mt-2 text-sm text-ink-700">{event.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-4" aria-label="Hỗ trợ làm bài">
          <section className="ai-v3-card">
            <h2 className="text-lg font-bold text-brand">Gợi ý theo mức độ</h2>
            <p className="mt-2 text-sm text-ink-600">Chỉ mở khi cần. Gợi ý không đưa sẵn đáp án.</p>
            <div className="mt-4 space-y-3">
              {problem.hints.map((hint) => {
                const shown = activeSession.openedHints.includes(hint.id);
                return <div key={hint.id} className="learning-mvp-hint">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-sm">{hint.id}. {hint.title}</strong>
                    <Button size="sm" variant="ghost" aria-expanded={shown} onClick={() => showHint(hint)}>
                      {shown ? "Đã mở" : "Mở gợi ý"}
                    </Button>
                  </div>
                  {shown && <div className="mt-3 text-sm leading-6 text-ink-700"><RichMathText text={hint.text} /></div>}
                </div>;
              })}
            </div>
          </section>
          <section className="ai-v3-card">
            <p className="ai-v3-eyebrow"><Icon name="psychology"/> GỢI MỞ SOCRATIC</p>
            <h2 className="ai-v3-section-title">Tự đặt câu hỏi</h2>
            <p className="mt-2 text-sm text-ink-600">Gợi ý từ đúng nội dung đề đang giải; không tự động đưa đáp án.</p>
            <div className="mt-3 space-y-2">
              {problem.prompts.map((prompt, index) => (
                <Button key={prompt.question} variant="secondary" size="sm" className="w-full justify-start text-left"
                  aria-expanded={promptIndex === index} onClick={() => setPromptIndex(promptIndex === index ? null : index)}>
                  <Icon name="lightbulb"/>{prompt.question}
                </Button>
              ))}
            </div>
            {promptIndex !== null && <div role="status" className="advanced-socratic-answer mt-3 text-sm leading-6"><RichMathText text={problem.prompts[promptIndex].answer}/></div>}
          </section>
          <section className="ai-v3-card">
            <p className="ai-v3-eyebrow"><Icon name="account_tree"/> TRỰC QUAN TOÁN HỌC</p>
            <h2 className="ai-v3-section-title">Parabol và bảng giá trị</h2>
            {check?.valid || checks.some((event) => event.valid) || activeSession.openedHints.includes(3)
              ? <ParabolaStudy point={problem.point} graphXs={problem.graphXs}/>
              : <p className="mt-3 text-sm text-ink-600">Mô hình mở sau khi em kiểm tra đúng hoặc chủ động mở gợi ý mức 3. Không tiết lộ hệ số trước khi tự giải.</p>}
          </section>
          <section className="ai-v3-card">
            <h2 className="text-base font-bold text-brand">Phiên học này</h2>
            <p className="mt-2 text-sm text-ink-600">{Math.max(0,(activeSession.events?.length ?? 1)-1)} hành động đã ghi nhận · {usedHints} gợi ý đã mở.</p>
            <p className="mt-2 text-xs text-ink-500">Mọi sự kiện chỉ lưu trên thiết bị. Không có bộ máy AI đang theo dõi suy nghĩ của học sinh.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
