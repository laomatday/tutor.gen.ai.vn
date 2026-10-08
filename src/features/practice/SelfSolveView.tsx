import { useRef, useState } from "react";
import { RichMathText } from "../../components/MathLatex";
import { Alert, Button, Field, Icon, Textarea } from "../../components/ui";
import { useCurriculum } from "../../context/CurriculumContext";
import { appConfig } from "../../config/app";
import { storageKeys } from "../../config/storage";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { getCourseProgress } from "../curriculum";
import { formulaTools, getPracticeProblem, practicePolicy } from "./data";
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
  const textarea = useRef<HTMLTextAreaElement>(null);
  const rewardRef = useRef(session.rewarded);
  const activeSession = session.problemId === problem.id ? session : createPracticeSession(problem.id);
  const usedHints = activeSession.openedHints.length;
  const reward = autonomyReward(appConfig.rewards.lessonCompletionGp, usedHints);

  const updateInput = (input: string) => {
    setSession((current) => ({ ...current, problemId: problem.id, input }));
    setCheck(null);
  };
  const showHint = (hint: { id: number; title: string }) => {
    if (activeSession.openedHints.includes(hint.id)) return;
    setSession((current) => {
      const next = { ...current, openedHints: [...current.openedHints, hint.id] };
      return appendPracticeEvent(next, "hint", `Mở gợi ý ${hint.id}: ${hint.title}`);
    });
  };
  const inspect = () => {
    const result = verifySampleAnswer(activeSession.input, problem.point);
    setCheck(result);
    setSession((current) => appendPracticeEvent(current, "check", result.message, result.valid));
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
    <div className="learning-os-page learning-mvp-page">
      <header className="learning-mvp-page-heading">
        <p className="learning-mvp-kicker">LUYỆN TẬP · {problem.course}</p>
        <h1>Tự giải bài tập</h1>
        <p>Viết các bước giải của bạn, nhận phản hồi từ bộ kiểm tra toán học và xem lại những lần thử. Đây chưa phải chức năng chấm bài bằng AI.</p>
      </header>
      {storageError && <Alert tone="warning">{storageError}</Alert>}
      <div className="learning-mvp-studio-grid">
        <div className="space-y-4">
          <section className="learning-mvp-card">
            <p className="learning-mvp-kicker">{problem.label} · {problem.topic}</p>
            <h2 className="mt-2 text-xl font-bold text-brand">{problem.title}</h2>
            <div className="mt-4 text-base leading-8"><RichMathText text={problem.statement} /></div>
            <p className="mt-3 text-xs text-ink-500">Mã bài: {problem.id} · {progress.completed}/{progress.total} bài học đã hoàn thành</p>
          </section>

          <section className="learning-mvp-card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-brand">Bài làm của bạn</h2>
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
        </div>

        <aside className="space-y-4" aria-label="Hỗ trợ làm bài">
          <section className="learning-mvp-card">
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
          <section className="learning-mvp-card">
            <h2 className="text-base font-bold text-brand">Phiên học này</h2>
            <p className="mt-2 text-sm text-ink-600">{Math.max(0,(activeSession.events?.length ?? 1)-1)} hành động đã ghi nhận · {usedHints} gợi ý đã mở.</p>
            <p className="mt-2 text-xs text-ink-500">Mọi sự kiện chỉ lưu trên thiết bị. Không có bộ máy AI đang theo dõi suy nghĩ của học sinh.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
