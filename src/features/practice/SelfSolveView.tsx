import { useRef, useState } from 'react';
import { MathLatex, RichMathText, normalizeToLatex } from '../../components/MathLatex';
import { Alert, Badge, Button, Card, Field, Icon, Textarea } from '../../components/ui';
import { appConfig } from '../../config/app';
import { storageKeys } from '../../config/storage';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { formulaTools, practicePolicy, practiceProblem } from './data';
import { autonomyReward, isPracticeSession, verifySampleAnswer, type AnswerCheck, type PracticeSession } from './domain';
import { PracticeGuide } from './PracticeGuide';

interface SelfSolveViewProps { onEarnGp: (amount: number, reason: string) => void }

function GraphValues() {
  const coefficient = practiceProblem.point.y / practiceProblem.point.x ** 2;
  return <Card className="scroll-mt-24 p-5" id="practice-graph" tabIndex={-1}>
    <h2 className="text-lg font-bold text-primary">Bảng giá trị để phác đồ thị</h2>
    <p className="mt-2 text-sm text-on-surface-variant">Đánh dấu các điểm trên hệ trục tọa độ rồi nối thành một đường cong.</p>
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-72 text-center text-sm">
        <caption className="sr-only">Bảng giá trị của hàm số y = {coefficient}x²</caption>
        <thead><tr className="bg-surface-container-low"><th scope="col" className="p-3">x</th>{practiceProblem.graphXs.map(x => <th scope="col" key={x} className="p-3">{x}</th>)}</tr></thead>
        <tbody><tr><th scope="row" className="p-3"><MathLatex formula={`y=${coefficient}x^2`} /></th>{practiceProblem.graphXs.map(x => <td key={x} className="p-3">{coefficient * x ** 2}</td>)}</tr></tbody>
      </table>
    </div>
  </Card>;
}

export function SelfSolveView({ onEarnGp }: SelfSolveViewProps) {
  const [session, setSession, storageError] = useLocalStorage<PracticeSession>(storageKeys.practiceSession,
    { input: practiceProblem.initialInput, openedHints: [1], rewarded: false }, isPracticeSession);
  const [check, setCheck] = useState<AnswerCheck | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submittedRef = useRef(session.rewarded);
  const reward = autonomyReward(appConfig.rewards.lessonCompletionGp, session.openedHints.filter(id => id !== 1).length);
  const visibleHints = [...new Set([...session.openedHints, ...(check ? [2] : []), ...(check?.valid || session.rewarded ? [2, 3] : [])])];

  const updateInput = (input: string) => { setSession(previous => ({ ...previous, input })); setCheck(null); };
  const openGraph = () => {
    setShowGraph(true);
    requestAnimationFrame(() => {
      const graph = document.getElementById('practice-graph');
      graph?.focus({ preventScroll: true });
      graph?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };
  const insertFormula = (formula: string) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? session.input.length;
    const end = textarea?.selectionEnd ?? start;
    const insertion = ` ${formula} `;
    updateInput(`${session.input.slice(0, start)}${insertion}${session.input.slice(end)}`.slice(0, practicePolicy.inputLimit));
    requestAnimationFrame(() => { textarea?.focus(); textarea?.setSelectionRange(start + insertion.length, start + insertion.length); });
  };
  const submit = () => {
    const result = verifySampleAnswer(session.input, practiceProblem.point);
    setCheck(result);
    if (!result.valid || submittedRef.current) return;
    submittedRef.current = true;
    setSession(previous => ({ ...previous, rewarded: true }));
    onEarnGp(reward, `Hoàn thành ${practiceProblem.label}: ${practiceProblem.title}`);
  };

  return <div className="space-y-6 pb-8">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2"><Badge tone="primary">{practiceProblem.course}</Badge><span className="text-sm text-on-surface-variant">{practiceProblem.topic}</span></div>
        <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">Không gian tự giải</h1>
        <p className="mt-2 text-sm text-on-surface-variant">Từng bước tìm lời giải, đối chiếu rồi tự rút ra kết luận.</p>
      </div>
      <Badge tone={session.rewarded ? 'success' : 'primary'}>{session.rewarded ? 'Đã hoàn thành bài này' : `Thưởng tự chủ tối đa ${reward} GP`}</Badge>
    </header>
    <Alert tone="info">Bài luyện tập mẫu: phần kiểm tra chỉ đối chiếu các phép tính và kết quả của bài này.</Alert>
    {storageError && <Alert tone="warning">{storageError}</Alert>}
    <div className="grid items-start gap-6 lg:grid-cols-12">
      <div className="min-w-0 space-y-5 lg:col-span-7">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-container-low px-5 py-3"><Badge tone="primary">{practiceProblem.label}</Badge><Badge>{practiceProblem.difficulty}</Badge></div>
          <div className="p-5 sm:p-6"><h2 className="text-xl font-bold">{practiceProblem.title}</h2><p className="mt-4 leading-8"><RichMathText text={practiceProblem.statement} /></p></div>
        </Card>
        <Card className="p-5 sm:p-6"><h2 className="flex items-start gap-3 text-lg font-semibold"><Badge tone="success">1</Badge> Thiết lập giả thiết</h2><p className="mt-4 leading-8"><RichMathText text={practiceProblem.setup} /></p><p className="mt-3 text-sm text-on-surface-variant">Bước thiết lập đã được điền sẵn để bạn tiếp tục.</p></Card>
        <Card className="space-y-4 p-5 sm:p-6">
          <h2 className="flex items-start gap-3 text-lg font-semibold text-primary"><Badge tone="primary">2</Badge> Thay số và tìm hệ số a</h2>
          <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Chèn ký hiệu toán học">
            {formulaTools.map(tool => <Button key={tool.label} variant="secondary" size="sm" title={tool.title} aria-label={`Chèn ${tool.title.toLowerCase()}`} onClick={() => insertFormula(tool.value)} disabled={session.rewarded}>{tool.label}</Button>)}
          </div>
          <Field label="Trình bày bước giải của bạn" htmlFor="step-2-input" hint="Có thể viết a = 12/4 = 3 hoặc trình bày chuỗi phép biến đổi bằng ký hiệu ⇔.">
            <Textarea id="step-2-input" ref={textareaRef} value={session.input} maxLength={practicePolicy.inputLimit} rows={4} readOnly={session.rewarded} onChange={event => updateInput(event.target.value)} aria-invalid={check ? !check.valid : undefined} aria-describedby={check ? 'practice-check' : undefined} />
          </Field>
          <div className="min-w-0 rounded-xl bg-surface-container-low p-4"><p className="mb-2 text-xs font-semibold text-on-surface-variant">Xem trước công thức</p><div className="overflow-x-auto"><MathLatex formula={normalizeToLatex(session.input)} /></div></div>
          {check && <div id="practice-check" role="status"><Alert tone={check.valid ? 'success' : 'warning'}>{check.message}</Alert></div>}
          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="ghost" disabled={session.rewarded} onClick={() => updateInput(practiceProblem.initialInput)}><Icon name="undo" />Đặt lại bước</Button>
            <Button variant="secondary" disabled={session.rewarded} onClick={() => setCheck(verifySampleAnswer(session.input, practiceProblem.point))}><Icon name="fact_check" />Kiểm tra bước</Button>
          </div>
        </Card>
        <Card className="p-5 sm:p-6"><h2 className="flex items-start gap-3 text-lg font-semibold"><Badge>3</Badge> Kết luận và kiểm tra điều kiện</h2><p className="mt-4 leading-8">{check?.valid || session.rewarded ? <RichMathText text={practiceProblem.conclusion} /> : 'Hoàn thành bước biến đổi để mở phần đối chiếu kết luận.'}</p></Card>
        {showGraph && <GraphValues />}
        <Card className="flex flex-col items-stretch justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <Button variant="secondary" onClick={() => setShowGraph(value => !value)} aria-expanded={showGraph} aria-controls="practice-graph"><Icon name="table_chart" />{showGraph ? 'Ẩn bảng giá trị' : 'Bảng giá trị 5 điểm'}</Button>
          <Button onClick={submit} disabled={session.rewarded}><Icon name={session.rewarded ? 'verified' : 'send'} />{session.rewarded ? 'Đã hoàn thành' : 'Nộp bài hoàn chỉnh'}</Button>
        </Card>
        <p className="text-xs text-on-surface-variant">Bước giải được tự động lưu trên trình duyệt. Mỗi bài chỉ được nhận thưởng một lần, trong hạn mức GP của ngày.</p>
      </div>
      <div className="min-w-0 lg:col-span-5"><PracticeGuide visibleHints={visibleHints} reward={reward} onOpenHint={id => setSession(previous => ({ ...previous, openedHints: [...new Set([...previous.openedHints, id])] }))} onShowGraph={openGraph} /></div>
    </div>
  </div>;
}
