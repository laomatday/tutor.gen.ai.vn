import { Button, Input, Textarea, Select, Icon, Badge, Field } from '../../../components/ui';
import { statuses } from './editorDomain';
import { lessonStages as stages } from '../catalog';
import { curriculumRules } from '../rules';
import { useCurriculumEditor, type CurriculumAdminViewProps } from './useCurriculumEditor';
import { GRADES, SUBJECTS, type Lesson } from '..';
import { RichMathText } from '../../../components/MathLatex';
import { CurriculumLessonBlocks } from './CurriculumLessonBlocks';

function Status({ published }: { published: boolean }) {
  return <Badge tone={published ? 'success' : 'warning'}><span className="h-1.5 w-1.5 rounded-full bg-current" />{published ? 'Đã xuất bản' : 'Bản nháp'}</Badge>;
}

export function CurriculumAdminView({ initialLessonId, onNotice }: CurriculumAdminViewProps) {
  const { topicEditor, saveTopic, closeTopicEditor, setTopicEditor, setTopicError, topicError, draft, saveLesson, view, listHeadingRef, newLesson, gradeId, selectBranch, subjectId, topicId, branchTopics, selectedTopic, grade, subject, openTopicEditor, topicButtonRef, statusFilter, setStatusFilter, branchLessons, lessonQuery, setLessonQuery, visibleLessons, topics, openLesson, editorHeadingRef, persistedLesson, preview, dirty, setPreview, backToList, titleRef, updateDraft, errors, errorsRef, stage, setStage, stagePanelRef, editorTopics, changeClassification, editorTopic, unpublish, publishErrors, canLeave, adoptLesson, resetTopicEditor } = useCurriculumEditor({ initialLessonId, onNotice });

  const topicForm = topicEditor && <form onSubmit={saveTopic} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); closeTopicEditor(); } }} noValidate className="rounded-2xl border border-secondary/25 bg-secondary/5 p-4">
    <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-sm font-bold text-on-surface">{topicEditor.id ? 'Chỉnh sửa chủ đề' : 'Chủ đề mới'}</h2><p className="mt-1 text-xs text-outline">{GRADES.find(item => item.id === topicEditor.gradeId)?.label} · {SUBJECTS.find(item => item.id === topicEditor.subjectId)?.name}</p></div><Button variant="ghost" size="sm" type="button" onClick={closeTopicEditor} aria-label="Đóng biểu mẫu chủ đề" ><Icon className="text-lg">close</Icon></Button></div>
    <Field label={<> Tên chủ đề </>}>
<Input autoFocus value={topicEditor.title} onChange={event => { setTopicEditor({ ...topicEditor, title: event.target.value }); setTopicError(''); }} maxLength={160} placeholder="Nhập tên chủ đề" />
</Field>
    <Field className="mt-4" label={<> Mô tả chủ đề </>}>
<Textarea value={topicEditor.description} onChange={event => setTopicEditor({ ...topicEditor, description: event.target.value })} rows={3} maxLength={1000} className={`resize-y`} placeholder="Nội dung và mục tiêu của chủ đề" />
</Field>
    {topicError && <p role="alert" className="mt-3 text-sm text-error">{topicError}</p>}
    <div className="mt-4 flex flex-wrap justify-end gap-2"><Button variant="secondary" type="button" onClick={closeTopicEditor} >Hủy</Button><Button variant="primary" type="submit" >Lưu chủ đề</Button></div>
  </form>;

  const saveButtons = draft && <>
    <Button variant={draft.status === 'published' ? 'primary' : 'secondary'} type="button" onClick={() => saveLesson(draft.status)} className="flex-1 lg:w-full"><Icon className="text-lg">save</Icon>{draft.status === 'published' ? 'Lưu thay đổi' : 'Lưu bản nháp'}</Button>
    {draft.status === 'draft' && <Button variant="primary" type="button" onClick={() => saveLesson('published')} className={`flex-1 lg:w-full`}><Icon className="text-lg">publish</Icon>Xuất bản</Button>}
  </>;

  if (view === 'list') return <div className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-secondary">Không gian biên tập</p><h1 ref={listHeadingRef} tabIndex={-1} className="text-2xl font-bold tracking-tight text-on-surface outline-none md:text-3xl">Quản lý học liệu</h1><p className="mt-2 text-sm leading-6 text-on-surface-variant">Tổ chức chương trình, biên soạn và xuất bản từng bài học.</p></div>
      <Button variant="primary" type="button" onClick={newLesson} ><Icon className="text-lg">edit_square</Icon>Thêm bài học</Button>
    </div>

    <section aria-label="Lọc theo chương trình" className={`ui-card p-4 md:p-5`}>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.5fr]">
        <label className="space-y-2 text-xs font-bold text-on-surface-variant"><span className="block">Lớp</span><Select value={gradeId} onChange={event => selectBranch(event.target.value, subjectId)}>{GRADES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></label>
        <label className="space-y-2 text-xs font-bold text-on-surface-variant"><span className="block">Môn học</span><Select value={subjectId} onChange={event => selectBranch(gradeId, event.target.value)}>{SUBJECTS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label>
        <label className="space-y-2 text-xs font-bold text-on-surface-variant"><span className="block">Chủ đề</span><Select value={topicId} onChange={event => selectBranch(gradeId, subjectId, event.target.value)}><option value="">Tất cả chủ đề</option>{branchTopics.map(topic => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</Select></label>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/30 pt-3"><p className="text-xs leading-5 text-outline">{selectedTopic?.description || `${grade?.label} · ${subject?.name} · ${branchTopics.length} chủ đề`}</p><div className="flex flex-wrap gap-1">{selectedTopic && <Button variant="ghost" size="sm" type="button" onClick={() => openTopicEditor(true)} ><Icon className="text-base">edit</Icon>Sửa chủ đề</Button>}<Button variant="ghost" size="sm" ref={topicButtonRef} type="button" onClick={() => openTopicEditor(false)} ><Icon className="text-base">add</Icon>Thêm chủ đề</Button></div></div>
    </section>
    {topicForm}

    <div aria-label="Lọc trạng thái bài học" className="grid grid-cols-3 gap-2 sm:gap-4">{statuses.map(status => {
      const count = status.id === 'all' ? branchLessons.length : branchLessons.filter(lesson => lesson.status === status.id).length;
      return <Button variant="surface" key={status.id} type="button" aria-pressed={statusFilter === status.id} onClick={() => setStatusFilter(status.id)} className={`min-w-0 rounded-2xl border bg-white p-3 text-left transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary hover:shadow-sm sm:p-5 cursor-pointer ${statusFilter === status.id ? 'border-primary/40 ring-2 ring-primary/10' : 'border-outline-variant/45'}`}><span className={`flex items-center justify-between gap-1 text-xs font-bold sm:text-xs ${status.tone}`}>{status.label}<Icon className="hidden text-lg sm:inline">{status.icon}</Icon></span><span className={`mt-2 block text-2xl font-bold sm:text-3xl ${status.tone}`}>{count}</span><span className="mt-1 hidden text-xs text-outline sm:block">{status.detail}</span></Button>;
    })}</div>

    <section aria-label="Danh sách bài học" className={`ui-card overflow-hidden`}>
      <div className="flex flex-col justify-between gap-3 border-b border-outline-variant/35 p-4 sm:flex-row sm:items-center"><div><h2 className="text-sm font-bold text-on-surface">Bài học & dạng bài</h2><p aria-live="polite" className="mt-1 text-xs text-outline">Hiển thị {visibleLessons.length} / {branchLessons.length} bài học trong chương trình đang chọn</p></div><label className="relative sm:w-72"><span className="sr-only">Tìm bài học</span><Icon className="pointer-events-none absolute left-3 top-3 text-base text-outline">search</Icon><Input value={lessonQuery} onChange={event => setLessonQuery(event.target.value)} placeholder="Tìm tên bài, nội dung, chủ đề..." className={`pl-9`} /></label></div>
      <div className="divide-y divide-outline-variant/30">{visibleLessons.map(lesson => <article key={lesson.id} className="flex flex-col gap-4 p-4 transition-colors hover:bg-surface-container-low/30 md:flex-row md:items-center md:p-5">
        <div aria-hidden="true" className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/8 bg-surface-container-low text-primary sm:flex"><Icon className="text-3xl">{lesson.kind === 'problem-type' ? 'edit_note' : subject?.icon || 'menu_book'}</Icon></div>
        <div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-md bg-surface-container-low px-2 py-1 text-xs font-bold uppercase tracking-wide text-ink-700">{lesson.kind === 'problem-type' ? 'Dạng bài' : 'Bài học'}</span><Status published={lesson.status === 'published'} /></div><h3 className="text-base font-bold leading-6 text-on-surface"><RichMathText text={lesson.title} /></h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-on-surface-variant">{lesson.summary || 'Chưa có mô tả bài học.'}</p><p className="mt-2 text-xs leading-5 text-outline">{grade?.label} · {subject?.name} · {topics.find(topic => topic.id === lesson.topicId)?.title || 'Chủ đề chưa có tên'}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-outline"><span>{lesson.durationMinutes} phút</span><span>{lesson.examples.length} ví dụ</span><span>{lesson.exercises.length} bài tập</span></div></div>
        <div className="flex shrink-0 flex-wrap gap-2 self-end md:self-center"><Button variant="secondary" type="button" data-lesson-action={`${lesson.id}:preview`} aria-label={`Xem trước: ${lesson.title}`} onClick={() => openLesson(lesson, true, `${lesson.id}:preview`)} ><Icon className="text-base">visibility</Icon>Xem trước</Button><Button variant="primary" type="button" data-lesson-action={`${lesson.id}:edit`} aria-label={`Chỉnh sửa: ${lesson.title}`} onClick={() => openLesson(lesson, false, `${lesson.id}:edit`)} ><Icon className="text-base">edit</Icon>Chỉnh sửa</Button></div>
      </article>)}</div>
      {!visibleLessons.length && <div className="px-5 py-14 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-low text-primary"><Icon className="text-3xl">auto_stories</Icon></span><h3 className="mt-4 text-base font-bold text-on-surface">{branchLessons.length ? 'Chưa tìm thấy bài học phù hợp' : 'Chương trình đang chờ bài học đầu tiên'}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-outline">{branchLessons.length ? 'Thử từ khóa khác hoặc xem tất cả trạng thái.' : 'Bắt đầu từ một chủ đề, sau đó thêm lý thuyết, ví dụ và bài tập.'}</p>{branchLessons.length ? <Button variant="secondary" type="button" onClick={() => { setLessonQuery(''); setStatusFilter('all'); }} className={`mt-5`}>Xóa bộ lọc</Button> : <Button variant="primary" type="button" onClick={newLesson} className={`mt-5`}><Icon className="text-lg">add</Icon>{branchTopics.length ? 'Tạo bài học đầu tiên' : 'Tạo chủ đề đầu tiên'}</Button>}</div>}
    </section>
  </div>;

  if (!draft) return null;
  return <div className="min-w-0 space-y-5 pb-24 lg:pb-0">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><Button variant="ghost" size="sm" type="button" aria-label="Quay lại danh sách học liệu" onClick={backToList} className={`-ml-2 mb-2`}><Icon className="text-base">arrow_back</Icon>Quản lý học liệu</Button><h1 ref={editorHeadingRef} tabIndex={-1} className="text-2xl font-bold tracking-tight text-on-surface outline-none md:text-3xl">{preview ? 'Xem trước bài học' : persistedLesson ? 'Chỉnh sửa bài học' : 'Biên soạn bài học mới'}</h1><p className="mt-2 text-sm leading-6 text-on-surface-variant">{preview ? 'Kiểm tra nội dung trước khi đưa vào chương trình học.' : 'Hoàn thiện nội dung, kiểm tra và chủ động xuất bản khi sẵn sàng.'}</p></div>
      <div aria-label="Chế độ biên soạn" className="flex rounded-full border border-outline-variant/30 bg-surface-container-low p-1"><Button variant="surface" type="button" aria-pressed={!preview} onClick={() => { setPreview(false); requestAnimationFrame(() => titleRef.current?.focus()); }} className={`rounded-full px-4 py-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-primary cursor-pointer ${!preview ? 'bg-white text-primary shadow-sm' : 'text-outline'}`}>Chỉnh sửa</Button><Button variant="surface" type="button" aria-pressed={preview} onClick={() => setPreview(true)} className={`rounded-full px-4 py-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-primary cursor-pointer ${preview ? 'bg-white text-primary shadow-sm' : 'text-outline'}`}>Xem trước</Button></div>
    </header>

    {errors.length > 0 && <div ref={errorsRef} tabIndex={-1} role="alert" className="rounded-2xl border border-error/15 bg-error-container/60 p-4 text-sm text-on-error-container outline-none"><p className="font-bold">Vui lòng kiểm tra nội dung</p><ul className="mt-2 list-disc space-y-1 pl-5">{errors.map(message => <li key={message}>{message}</li>)}</ul></div>}

    <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div aria-label="Nội dung biên soạn" className="min-w-0 space-y-5">
        <section className={`ui-card p-5 md:p-6`}>
          {preview ? <><p className="text-xs font-semibold text-secondary">{GRADES.find(item => item.id === draft.gradeId)?.label} · {SUBJECTS.find(item => item.id === draft.subjectId)?.name} · {editorTopic?.title}</p><h2 className="mt-3 text-2xl font-bold leading-8 text-on-surface"><RichMathText text={draft.title || 'Bài học chưa có tên'} /></h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-on-surface-variant"><RichMathText text={draft.summary || 'Chưa có mô tả bài học.'} /></p><p className="mt-4 text-xs text-outline">{draft.kind === 'problem-type' ? 'Dạng bài' : 'Bài học'} · {draft.durationMinutes} phút</p></> : <div className="space-y-5"><Field label={<> Tên bài học / dạng bài </>}>
<Input ref={titleRef} value={draft.title} onChange={event => updateDraft({ title: event.target.value })} maxLength={180} placeholder="Đặt tên rõ ràng cho bài học" className={`text-base font-semibold`} />
</Field><Field label={<> Mô tả ngắn </>}>
<Textarea value={draft.summary} onChange={event => updateDraft({ summary: event.target.value })} rows={3} maxLength={1500} placeholder="Học sinh sẽ học được gì sau bài này?" className={`resize-y leading-6`} />
</Field></div>}
        </section>
        <section className={`ui-card overflow-hidden`}>
          <div aria-label="Các phần của bài học" className="grid grid-cols-3 border-b border-outline-variant/35 bg-surface-container-low/30 p-2">{stages.map(item => <Button variant="surface" key={item.id} type="button" aria-pressed={stage === item.id} onClick={() => setStage(item.id)} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-3 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-primary sm:flex-row sm:gap-2 sm:text-xs cursor-pointer ${stage === item.id ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-white'}`}><span className="inline-flex items-center gap-1"><Icon className="text-base">{item.icon}</Icon><span className={`rounded-full px-1.5 text-xs ${stage === item.id ? 'bg-white/15' : 'bg-surface-container-low'}`}>{draft[item.id].length}</span></span>{item.label}</Button>)}</div>
          <div ref={stagePanelRef} className="min-w-0 p-4 md:p-5"><CurriculumLessonBlocks lesson={draft} stage={stage} preview={preview} onChange={updateDraft} /></div>
        </section>
      </div>

      <aside aria-label="Phân loại và xuất bản" className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pr-1">
        <section aria-labelledby="curriculum-publish-title" className={`ui-card space-y-4 p-4`}>
          <div className="flex items-center justify-between gap-2"><h2 id="curriculum-publish-title" className="text-xs font-bold uppercase tracking-wider text-outline">Xuất bản</h2><Badge role="status" tone={dirty ? 'warning' : 'success'}>{dirty ? 'Chưa lưu' : 'Đã lưu'}</Badge></div>
          <div className="flex items-center justify-between gap-2"><span className="text-xs text-outline">Trạng thái hiện tại</span><Status published={persistedLesson?.status === 'published'} /></div>
          <p className="text-xs leading-5 text-on-surface-variant">{persistedLesson?.status === 'published' ? 'Bài đang hiển thị với học sinh đã đăng ký. Nội dung chỉ thay đổi khi bạn bấm Lưu thay đổi.' : 'Bản nháp chỉ hiển thị với quản trị. Xuất bản để đưa bài vào chương trình của học sinh đã đăng ký.'}</p>
          <div className="hidden flex-col gap-2 lg:flex">{saveButtons}</div>
          {(dirty || persistedLesson?.status === 'published') && <div className="flex flex-col gap-1 border-t border-outline-variant/30 pt-3">{dirty && <Button variant="ghost" size="sm" type="button" onClick={() => { if (!persistedLesson) backToList(); else if (canLeave()) { adoptLesson(persistedLesson); resetTopicEditor(); } }} ><Icon className="text-base">undo</Icon>{persistedLesson ? 'Hoàn tác thay đổi' : 'Hủy bài mới'}</Button>}{persistedLesson?.status === 'published' && <Button variant="ghost" size="sm" type="button" onClick={unpublish} ><Icon className="text-base">visibility_off</Icon>Ngừng xuất bản</Button>}</div>}
        </section>
        <section className={`ui-card space-y-4 p-4`}>
          <h2 className="text-xs font-bold uppercase tracking-wider text-outline">Phân loại bài học</h2>
          <Field label={<> Lớp của bài học </>}>
<Select value={draft.gradeId} onChange={event => changeClassification(event.target.value, draft.subjectId)} disabled={preview} >{GRADES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</Select>
</Field>
          <Field label={<> Môn của bài học </>}>
<Select value={draft.subjectId} onChange={event => changeClassification(draft.gradeId, event.target.value)} disabled={preview} >{SUBJECTS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
</Field>
          <Field label={<> Chủ đề của bài học </>}>
<Select value={draft.topicId} onChange={event => changeClassification(draft.gradeId, draft.subjectId, event.target.value)} disabled={preview || !editorTopics.length} >{editorTopics.length ? editorTopics.map(topic => <option key={topic.id} value={topic.id}>{topic.title}</option>) : <option value="">Chưa có chủ đề</option>}</Select>
</Field>
          {!preview && <div className="flex flex-wrap gap-1">{editorTopic && <Button variant="ghost" size="sm" type="button" onClick={() => openTopicEditor(true)} ><Icon className="text-base">edit</Icon>Sửa chủ đề</Button>}<Button variant="ghost" size="sm" ref={topicButtonRef} type="button" onClick={() => openTopicEditor(false)} ><Icon className="text-base">add</Icon>Thêm chủ đề</Button></div>}
          <Field label={<> Loại nội dung </>}>
<Select value={draft.kind} onChange={event => updateDraft({ kind: event.target.value as Lesson['kind'] })} disabled={preview} ><option value="lesson">Bài học</option><option value="problem-type">Dạng bài</option></Select>
</Field>
          <Field label={<> Thời lượng (phút) </>}>
<Input type="number" min={curriculumRules.duration.min} max={curriculumRules.duration.max} step={1} value={draft.durationMinutes || ''} onChange={event => updateDraft({ durationMinutes: Number(event.target.value) })} disabled={preview}  />
</Field>
        </section>
        {topicForm}

        <section aria-labelledby="curriculum-publish-check" className={`ui-card p-4`}>
          <div className="flex items-center justify-between gap-2"><h2 id="curriculum-publish-check" className="text-xs font-bold uppercase tracking-wider text-outline">Trước khi xuất bản</h2><Icon className={`text-lg ${publishErrors.length ? 'text-warning' : 'text-secondary'}`}>{publishErrors.length ? 'fact_check' : 'verified'}</Icon></div>
          {publishErrors.length ? <><p className="mt-3 text-xs font-semibold text-warning">Còn {publishErrors.length} nội dung cần hoàn thiện</p><ul className="mt-3 space-y-3">{publishErrors.map(message => <li key={message} className="flex items-start gap-2 text-xs leading-5 text-on-surface-variant"><Icon className="mt-0.5 shrink-0 text-base text-warning">radio_button_unchecked</Icon><span>{message}</span></li>)}</ul></> : <div className="mt-3 rounded-xl bg-secondary/8 p-3"><p className="flex items-center gap-2 text-sm font-semibold text-secondary"><Icon className="text-lg">check_circle</Icon>Đủ nội dung để xuất bản</p><p className="mt-2 text-xs leading-5 text-on-surface-variant">Lý thuyết, ví dụ và bài tập đã có đầy đủ nội dung bắt buộc.</p></div>}
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-outline-variant/30 pt-3 text-center">{stages.map(item => <Button variant="ghost" size="sm" key={item.id} type="button" onClick={() => { setStage(item.id); requestAnimationFrame(() => stagePanelRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })); }} ><strong className="mb-1 block text-base text-primary">{draft[item.id].length}</strong>{item.label}</Button>)}</div>
        </section>


      </aside>
    </div>
    <div aria-label="Lưu bài học" className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-outline-variant/50 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">{saveButtons}</div>
  </div>;
}
