import { useState } from 'react';
import { RichMathText } from '../../components/MathLatex';
import { Badge, Button, Card, Icon } from '../../components/ui';
import { practicePolicy, practiceProblem } from './data';

export function PracticeGuide({ visibleHints, reward, onOpenHint, onShowGraph }: {
  visibleHints: number[];
  reward: number;
  onOpenHint: (id: number) => void;
  onShowGraph: () => void;
}) {
  const [reply, setReply] = useState<string | null>(null);
  return <aside className="space-y-5 lg:sticky lg:top-24" aria-label="Gợi ý luyện tập">
    <Card className="overflow-hidden">
      <div className="bg-primary p-5 text-on-primary">
        <div className="flex items-center gap-3"><Icon name="psychology" /><div>
          <h2 className="text-lg font-bold">Gợi ý để tự giải</h2>
          <p className="mt-1 text-sm text-primary-fixed">Đọc từng gợi ý khi cần thêm hướng đi.</p>
        </div></div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>Đã mở {visibleHints.length}/{practiceProblem.hints.length} gợi ý</span>
          <span>Thưởng dự kiến: {reward} GP</span>
        </div>
      </div>
      <div className="space-y-4 p-5">
        {practiceProblem.hints.map(hint => {
          const isOpen = visibleHints.includes(hint.id);
          return <section key={hint.id} className="rounded-xl bg-surface-container-low p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold">Gợi ý {hint.id}: {hint.title}</h3>
              <Badge tone={isOpen ? 'success' : 'neutral'}>{isOpen ? 'Đã mở' : 'Đang khóa'}</Badge>
            </div>
            {isOpen ? <p className="mt-3 text-sm leading-7"><RichMathText text={hint.text} /></p> :
              hint.id === 2 ? <div className="mt-3 space-y-3">
                <p className="text-sm text-on-surface-variant">Tự thử một lần để mở gợi ý, hoặc xem trước và giảm thưởng tự chủ.</p>
                <Button variant="secondary" size="sm" onClick={() => onOpenHint(hint.id)}>Mở sớm (−{practicePolicy.hintPenaltyGp} GP thưởng)</Button>
              </div> : <p className="mt-3 text-sm text-on-surface-variant">Mở sau khi kiểm tra đúng bước biến đổi.</p>}
          </section>;
        })}
      </div>
    </Card>
    <Card className="space-y-3 p-5">
      <h2 className="font-semibold">Câu hỏi gợi mở</h2>
      <div className="flex flex-wrap gap-2">
        {practiceProblem.prompts.map(prompt => <Button key={prompt.question} variant="secondary" size="sm" onClick={() => setReply(prompt.answer)}>{prompt.question}</Button>)}
        <Button variant="secondary" size="sm" onClick={onShowGraph}>Lập bảng giá trị</Button>
      </div>
      {reply && <p className="rounded-xl bg-surface-container-low p-3 text-sm leading-7" role="status"><RichMathText text={reply} /></p>}
    </Card>
  </aside>;
}
