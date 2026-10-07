import { stageMeta, hasContent, moveItem } from './blockDomain';
import { Button, Input, Textarea, Select, Icon, Field } from '../../../components/ui';
import React, { useEffect, useId, useRef, useState } from 'react';
import type { Lesson, LessonStage } from '..';
import { RichMathText } from '../../../components/MathLatex';

interface CurriculumLessonBlocksProps {
  lesson: Lesson;
  stage: LessonStage;
  preview: boolean;
  onChange: (change: Partial<Lesson>) => void;
}

type FocusTarget = {
  lessonId: string;
  stage: LessonStage;
  index: number | null;
  action?: 'up' | 'down';
};

function TextField({ label, value, onChange, rows = 3, placeholder }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <Field label={<> {label} </>}>
<Textarea value={value} onChange={event => onChange(event.target.value)} rows={rows} maxLength={12000} placeholder={placeholder} className={`resize-y leading-6`} />
    
</Field>
  );
}

function PreviewText({ text }: { text: string }) {
  return <div className="min-w-0 overflow-x-auto whitespace-pre-wrap break-words text-sm leading-7 text-on-surface-variant"><RichMathText text={text || 'Chưa có nội dung.'} /></div>;
}

function BlockCard({ index, count, stage, preview, onMove, onRemove, children }: {
  index: number;
  count: number;
  stage: LessonStage;
  preview: boolean;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const meta = stageMeta[stage];
  return (
    <section data-block-index={index} aria-label={`${meta.block} ${index + 1}`} className="min-w-0 space-y-4 ui-card p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/25 pb-3">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/10 text-xs font-bold text-secondary">{String(index + 1).padStart(2, '0')}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">{meta.block} {index + 1}</span>
        </div>
        {!preview && <div role="group" aria-label={`Thao tác ${meta.action} ${index + 1}`} className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" type="button" data-action="up" aria-label={`Chuyển ${meta.action} ${index + 1} lên`} title="Chuyển lên" disabled={index === 0} onClick={() => onMove(-1)} ><Icon className="text-lg">arrow_upward</Icon></Button>
          <Button variant="ghost" size="icon" type="button" data-action="down" aria-label={`Chuyển ${meta.action} ${index + 1} xuống`} title="Chuyển xuống" disabled={index === count - 1} onClick={() => onMove(1)} ><Icon className="text-lg">arrow_downward</Icon></Button>
          <Button variant="ghost" size="icon" type="button" aria-label={`Xóa ${meta.action} ${index + 1}`} title="Xóa" onClick={onRemove} className={`hover:bg-error-container/40 hover:text-error`}><Icon className="text-lg">delete</Icon></Button>
        </div>}
      </div>
      {children}
    </section>
  );
}

export function CurriculumLessonBlocks({ lesson, stage, preview, onChange }: CurriculumLessonBlocksProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const focusAfterRender = useRef<FocusTarget | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const headingId = useId();
  const meta = stageMeta[stage];
  const count = lesson[stage].length;

  useEffect(() => {
    const target = focusAfterRender.current;
    if (!target) return;
    focusAfterRender.current = null;
    if (target.lessonId !== lesson.id || target.stage !== stage || preview) return;
    if (target.index === null) {
      addButtonRef.current?.focus();
      return;
    }
    const block = containerRef.current?.querySelector<HTMLElement>(`[data-block-index="${target.index}"]`);
    const preferredButton = target.action ? block?.querySelector<HTMLButtonElement>(`[data-action="${target.action}"]:not(:disabled)`) : null;
    const fallbackButton = target.action ? block?.querySelector<HTMLButtonElement>('[data-action]:not(:disabled)') : null;
    (preferredButton || fallbackButton || block?.querySelector<HTMLElement>('input, textarea, select'))?.focus();
  }, [lesson, stage, preview]);

  const queueFocus = (index: number | null, action?: FocusTarget['action']) => {
    focusAfterRender.current = { lessonId: lesson.id, stage, index, action };
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= count) return;
    queueFocus(nextIndex, direction === -1 ? 'up' : 'down');
    if (stage === 'theory') onChange({ theory: moveItem(lesson.theory, index, direction) });
    else if (stage === 'examples') onChange({ examples: moveItem(lesson.examples, index, direction) });
    else onChange({ exercises: moveItem(lesson.exercises, index, direction) });
    setAnnouncement(`Đã chuyển ${meta.action} ${index + 1} đến vị trí ${nextIndex + 1}.`);
  };

  const removeBlock = (index: number) => {
    if (hasContent(lesson, stage, index) && !window.confirm(`Xóa ${meta.action} ${index + 1}? Nội dung trong ${meta.action} này sẽ bị xóa khỏi bài học.`)) return;
    queueFocus(count > 1 ? Math.min(index, count - 2) : null);
    if (stage === 'theory') onChange({ theory: lesson.theory.filter((_, itemIndex) => itemIndex !== index) });
    else if (stage === 'examples') onChange({ examples: lesson.examples.filter((_, itemIndex) => itemIndex !== index) });
    else onChange({ exercises: lesson.exercises.filter((_, itemIndex) => itemIndex !== index) });
    setAnnouncement(`Đã xóa ${meta.action} ${index + 1}. Còn ${count - 1} ${meta.action}.`);
  };

  const addBlock = () => {
    queueFocus(count);
    if (stage === 'theory') onChange({ theory: [...lesson.theory, { heading: '', text: '' }] });
    else if (stage === 'examples') onChange({ examples: [...lesson.examples, { title: '', prompt: '', steps: [''], answer: '' }] });
    else onChange({ exercises: [...lesson.exercises, { id: crypto.randomUUID(), prompt: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' }] });
    setAnnouncement(`Đã thêm ${meta.action} ${count + 1}.`);
  };

  const updateTheory = (index: number, change: Partial<Lesson['theory'][number]>) =>
    onChange({ theory: lesson.theory.map((item, itemIndex) => itemIndex === index ? { ...item, ...change } : item) });
  const updateExample = (index: number, change: Partial<Lesson['examples'][number]>) =>
    onChange({ examples: lesson.examples.map((item, itemIndex) => itemIndex === index ? { ...item, ...change } : item) });
  const updateExercise = (index: number, change: Partial<Lesson['exercises'][number]>) =>
    onChange({ exercises: lesson.exercises.map((item, itemIndex) => itemIndex === index ? { ...item, ...change } : item) });

  const cardProps = (index: number) => ({ index, count, stage, preview, onMove: (direction: -1 | 1) => moveBlock(index, direction), onRemove: () => removeBlock(index) });

  return (
    <div ref={containerRef} aria-labelledby={headingId} className="min-w-0 space-y-4">
      <div className="px-1">
        <h3 id={headingId} className="font-bold text-on-surface">{meta.heading}</h3>
        <p className="mt-1 text-xs leading-5 text-outline">{meta.description}</p>
      </div>
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</p>

      {stage === 'theory' && lesson.theory.map((item, index) => (
        <BlockCard key={`theory-${index}`} {...cardProps(index)}>
          {preview ? <>
            <h4 className="overflow-x-auto break-words font-bold text-on-surface"><RichMathText text={item.heading || 'Chưa có tiêu đề'} /></h4>
            <PreviewText text={item.text} />
          </> : <>
            <Field label={<> Tiêu đề mục {index + 1} </>}>
<Input value={item.heading} onChange={event => updateTheory(index, { heading: event.target.value })} maxLength={180} placeholder="Khái niệm, đặc điểm hoặc kiến thức cần nhớ" />
            
</Field>
            <TextField label={`Nội dung lý thuyết ${index + 1}`} value={item.text} onChange={value => updateTheory(index, { text: value })} rows={6} placeholder="Trình bày nội dung kiến thức..." />
          </>}
        </BlockCard>
      ))}

      {stage === 'examples' && lesson.examples.map((item, index) => (
        <BlockCard key={`example-${index}`} {...cardProps(index)}>
          {preview ? <>
            <h4 className="overflow-x-auto break-words font-bold text-on-surface"><RichMathText text={item.title || 'Chưa có tiêu đề'} /></h4>
            <PreviewText text={item.prompt} />
            <ol className="space-y-3">
              {item.steps.map((step, stepIndex) => <li key={stepIndex} className="flex min-w-0 gap-3">
                <span aria-hidden="true" className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">{stepIndex + 1}</span>
                <div className="min-w-0 flex-1"><PreviewText text={step} /></div>
              </li>)}
            </ol>
            <div className="rounded-xl bg-secondary/8 p-3"><p className="mb-1 text-xs font-bold text-secondary">Kết quả / Kết luận</p><PreviewText text={item.answer} /></div>
          </> : <>
            <Field label={<> Tên ví dụ {index + 1} </>}>
<Input value={item.title} onChange={event => updateExample(index, { title: event.target.value })} maxLength={180} placeholder="Tên tình huống hoặc ví dụ" />
            
</Field>
            <TextField label={`Đề bài / Tình huống ${index + 1}`} value={item.prompt} onChange={value => updateExample(index, { prompt: value })} />
            <TextField label={`Các bước hướng dẫn ${index + 1} (mỗi bước một dòng)`} value={item.steps.join('\n')} onChange={value => updateExample(index, { steps: value.split('\n') })} rows={4} />
            <TextField label={`Kết quả / Kết luận ví dụ ${index + 1}`} value={item.answer} onChange={value => updateExample(index, { answer: value })} rows={2} />
          </>}
        </BlockCard>
      ))}

      {stage === 'exercises' && lesson.exercises.map((item, index) => (
        <BlockCard key={item.id} {...cardProps(index)}>
          {preview ? <>
            <PreviewText text={item.prompt} />
            <ol className="space-y-2">
              {item.options.map((option, optionIndex) => <li key={optionIndex} className={`flex items-start gap-3 rounded-xl border p-3 ${item.correctIndex === optionIndex ? 'border-secondary/30 bg-secondary/8' : 'border-outline-variant/40 bg-white'}`}>
                <span className="text-xs font-bold leading-7 text-primary">{String.fromCharCode(65 + optionIndex)}.</span>
                <div className="min-w-0 flex-1"><PreviewText text={option} /></div>
                {item.correctIndex === optionIndex && <><Icon className="shrink-0 text-lg text-secondary">check_circle</Icon><span className="sr-only">Đáp án đúng</span></>}
              </li>)}
            </ol>
            <div className="border-t border-outline-variant/35 pt-3"><p className="mb-1 text-xs font-bold text-secondary">Giải thích</p><PreviewText text={item.explanation} /></div>
          </> : <>
            <TextField label={`Nội dung bài tập ${index + 1}`} value={item.prompt} onChange={value => updateExercise(index, { prompt: value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              {item.options.map((option, optionIndex) => <Field key={optionIndex} label={<> Bài {index + 1} · Lựa chọn {String.fromCharCode(65 + optionIndex)} </>}>
<Input value={option} onChange={event => updateExercise(index, { options: item.options.map((value, valueIndex) => valueIndex === optionIndex ? event.target.value : value) })} maxLength={1000} />
              
</Field>)}
            </div>
            <Field label={<> Đáp án đúng bài {index + 1} </>}>
<Select value={item.correctIndex} onChange={event => updateExercise(index, { correctIndex: Number(event.target.value) })}>
                {item.options.map((_, optionIndex) => <option key={optionIndex} value={optionIndex}>Lựa chọn {String.fromCharCode(65 + optionIndex)}</option>)}
              </Select>
            
</Field>
            <TextField label={`Giải thích đáp án bài ${index + 1}`} value={item.explanation} onChange={value => updateExercise(index, { explanation: value })} />
          </>}
        </BlockCard>
      ))}

      {!count && <div className="rounded-2xl border border-dashed border-outline-variant/60 bg-white px-4 py-8 text-center text-sm text-outline">{meta.empty}</div>}
      {!preview && <Button variant="secondary" ref={addButtonRef} type="button" onClick={addBlock} className="w-full"><Icon className="text-lg">add</Icon>{meta.add}</Button>}
    </div>
  );
}
