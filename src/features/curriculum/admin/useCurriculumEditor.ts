import { appConfig } from '../../../config/app';
import React, { useEffect, useRef, useState } from 'react';
import { useCurriculum } from '../../../context/CurriculumContext';
import { GRADES, SUBJECTS, studentProfile, getPublishErrors, type Lesson, type Topic } from '..';
import { normalizeSearch } from '../../../lib/search';
import { cleanLesson, createLessonDraft, getEditorErrors, type ContentStage, type TopicDraft } from './editorDomain';

export interface CurriculumAdminViewProps {
  initialLessonId?: string;
  onNotice: (message: string) => void;
}

export function useCurriculumEditor({ initialLessonId, onNotice }: CurriculumAdminViewProps) {
  const { topics, setTopics, lessons, setLessons } = useCurriculum();
  const initialLesson = lessons.find(lesson => lesson.id === initialLessonId) || null;
  const [view, setView] = useState<'list' | 'editor'>(initialLesson ? 'editor' : 'list');
  const [gradeId, setGradeId] = useState(initialLesson?.gradeId || studentProfile.enrollments[0]?.gradeId || GRADES[0].id);
  const [subjectId, setSubjectId] = useState(initialLesson?.subjectId || studentProfile.enrollments[0]?.subjectId || SUBJECTS[0].id);
  const [topicId, setTopicId] = useState(initialLesson?.topicId || '');
  const [draft, setDraft] = useState<Lesson | null>(() => initialLesson ? structuredClone(initialLesson) : null);
  const [savedValue, setSavedValue] = useState(() => JSON.stringify(initialLesson));
  const [stage, setStage] = useState<ContentStage>('theory');
  const [preview, setPreview] = useState(false);
  const [lessonQuery, setLessonQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Lesson['status']>('all');
  const [errors, setErrors] = useState<string[]>([]);
  const [topicEditor, setTopicEditor] = useState<TopicDraft | null>(null);
  const [savedTopicValue, setSavedTopicValue] = useState('null');
  const [topicError, setTopicError] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);
  const topicButtonRef = useRef<HTMLButtonElement>(null);
  const listHeadingRef = useRef<HTMLHeadingElement>(null);
  const editorHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorsRef = useRef<HTMLDivElement>(null);
  const stagePanelRef = useRef<HTMLDivElement>(null);
  const listScrollRef = useRef(0);
  const listTriggerRef = useRef<string | null>(null);
  const dirty = JSON.stringify(draft) !== savedValue;
  const topicDirty = topicEditor !== null && JSON.stringify(topicEditor) !== savedTopicValue;
  const hasUnsavedChanges = dirty || topicDirty;
  const branchTopics = topics.filter(topic => topic.gradeId === gradeId && topic.subjectId === subjectId);
  const selectedTopic = branchTopics.find(topic => topic.id === topicId);
  const branchLessons = lessons.filter(lesson => lesson.gradeId === gradeId && lesson.subjectId === subjectId && (!topicId || lesson.topicId === topicId)).sort((left, right) => left.order - right.order);
  const normalizedQuery = normalizeSearch(lessonQuery);
  const visibleLessons = branchLessons.filter(lesson => (statusFilter === 'all' || lesson.status === statusFilter) && normalizeSearch(`${lesson.title} ${lesson.summary} ${topics.find(topic => topic.id === lesson.topicId)?.title || ''}`).includes(normalizedQuery));
  const grade = GRADES.find(item => item.id === gradeId);
  const subject = SUBJECTS.find(item => item.id === subjectId);
  const persistedLesson = lessons.find(lesson => lesson.id === draft?.id);
  const editorTopics = draft ? topics.filter(topic => topic.gradeId === draft.gradeId && topic.subjectId === draft.subjectId) : [];
  const editorTopic = topics.find(topic => topic.id === draft?.topicId);

  const leaveMessage = topicDirty && dirty ? 'Bài học và chủ đề có thay đổi chưa lưu. Bỏ các thay đổi để tiếp tục?' : topicDirty ? 'Chủ đề có thay đổi chưa lưu. Bỏ các thay đổi để tiếp tục?' : 'Bài học có thay đổi chưa lưu. Bỏ các thay đổi để tiếp tục?';
  const canLeave = () => !hasUnsavedChanges || window.confirm(leaveMessage);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warnUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const warnNavigation = (event: Event) => { if (!window.confirm(leaveMessage)) event.preventDefault(); };
    window.addEventListener('beforeunload', warnUnload);
    window.addEventListener('genai:before-navigate', warnNavigation);
    return () => {
      window.removeEventListener('beforeunload', warnUnload);
      window.removeEventListener('genai:before-navigate', warnNavigation);
    };
  }, [hasUnsavedChanges, leaveMessage]);

  const publishErrors = draft ? [...new Set([...getEditorErrors(draft, topics, lessons), ...getPublishErrors(cleanLesson(draft, 'published'))])] : [];

  const resetTopicEditor = () => { setTopicEditor(null); setSavedTopicValue('null'); setTopicError(''); };
  const adoptLesson = (lesson: Lesson | null) => {
    const next = lesson ? structuredClone(lesson) : null;
    setDraft(next);
    setSavedValue(JSON.stringify(next));
    setStage('theory');
    setPreview(false);
    setErrors([]);
  };
  const updateDraft = (change: Partial<Lesson>) => { setDraft(current => current ? { ...current, ...change } : null); setErrors([]); };

  const selectBranch = (nextGrade: string, nextSubject: string, nextTopic = '') => {
    if (!canLeave()) return;
    setGradeId(nextGrade);
    setSubjectId(nextSubject);
    setTopicId(nextTopic);
    resetTopicEditor();
  };

  const openLesson = (lesson: Lesson, readOnlyPreview: boolean, trigger?: string) => {
    if (!canLeave()) return;
    listScrollRef.current = window.scrollY;
    listTriggerRef.current = trigger || null;
    adoptLesson(lesson);
    resetTopicEditor();
    setPreview(readOnlyPreview);
    setView('editor');
    requestAnimationFrame(() => { editorHeadingRef.current?.focus(); window.scrollTo({ top: 0 }); });
  };

  const backToList = () => {
    if (!canLeave()) return;
    adoptLesson(null);
    resetTopicEditor();
    setView('list');
    requestAnimationFrame(() => {
      const trigger = listTriggerRef.current ? document.querySelector<HTMLButtonElement>(`[data-lesson-action="${CSS.escape(listTriggerRef.current)}"]`) : null;
      (trigger || listHeadingRef.current)?.focus({ preventScroll: true });
      window.scrollTo({ top: listScrollRef.current });
    });
  };

  const newLesson = () => {
    if (!canLeave()) return;
    const nextTopic = selectedTopic || branchTopics[0];
    if (!nextTopic) { openTopicEditor(false, true); return; }
    const topicLessons = lessons.filter(lesson => lesson.topicId === nextTopic.id);
    const lesson = createLessonDraft(gradeId, subjectId, nextTopic.id, topicLessons);
    listScrollRef.current = window.scrollY;
    listTriggerRef.current = null;
    setDraft(lesson);
    setSavedValue('null');
    setStage('theory');
    setPreview(false);
    setErrors([]);
    resetTopicEditor();
    setView('editor');
    requestAnimationFrame(() => { titleRef.current?.focus(); window.scrollTo({ top: 0 }); });
  };

  const changeClassification = (nextGrade: string, nextSubject: string, preferredTopic?: string) => {
    if (!draft) return;
    if (topicDirty && !window.confirm('Chủ đề có thay đổi chưa lưu. Bỏ thay đổi chủ đề để đổi phân loại?')) return;
    const matching = topics.filter(topic => topic.gradeId === nextGrade && topic.subjectId === nextSubject);
    updateDraft({ gradeId: nextGrade, subjectId: nextSubject, topicId: matching.find(topic => topic.id === preferredTopic)?.id || matching[0]?.id || '' });
    resetTopicEditor();
  };

  const saveLesson = (status: Lesson['status']) => {
    if (!draft) return;
    const cleaned = cleanLesson(draft, status);
    const issues = [...new Set([...getEditorErrors(cleaned, topics, lessons), ...(status === 'published' ? getPublishErrors(cleaned) : [])])];
    if (issues.length) {
      setErrors(issues);
      requestAnimationFrame(() => errorsRef.current?.focus());
      return;
    }
    setLessons(current => current.some(lesson => lesson.id === cleaned.id) ? current.map(lesson => lesson.id === cleaned.id ? cleaned : lesson) : [...current, cleaned]);
    setDraft(cleaned);
    setSavedValue(JSON.stringify(cleaned));
    setErrors([]);
    onNotice(status === 'published' ? 'Đã xuất bản bài học cho học sinh đã đăng ký lớp và môn này trên trình duyệt hiện tại.' : 'Đã lưu bản nháp. Bài học chưa hiển thị với học sinh.');
  };

  const unpublish = () => {
    if (!draft || !window.confirm('Chuyển bài học về bản nháp? Bài học sẽ tạm ẩn khỏi mục Môn học của học sinh.')) return;
    saveLesson('draft');
  };

  function openTopicEditor(edit: boolean, alreadyConfirmed = false) {
    if (!alreadyConfirmed && topicDirty && !window.confirm('Chủ đề có thay đổi chưa lưu. Bỏ các thay đổi để tiếp tục?')) return;
    const currentTopic = view === 'editor' ? editorTopic : selectedTopic;
    const next: TopicDraft = edit && currentTopic ? { ...currentTopic } : { gradeId: view === 'editor' && draft ? draft.gradeId : gradeId, subjectId: view === 'editor' && draft ? draft.subjectId : subjectId, title: '', description: '' };
    setTopicEditor(next);
    setSavedTopicValue(JSON.stringify(next));
    setTopicError('');
  }

  const closeTopicEditor = () => {
    if (topicDirty && !window.confirm('Chủ đề có thay đổi chưa lưu. Bỏ các thay đổi này?')) return;
    resetTopicEditor();
    requestAnimationFrame(() => topicButtonRef.current?.focus());
  };

  const saveTopic = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!topicEditor) return;
    const title = topicEditor.title.trim();
    if (title.length < 2) { setTopicError('Tên chủ đề cần ít nhất 2 ký tự.'); return; }
    if (topics.some(topic => topic.id !== topicEditor.id && topic.gradeId === topicEditor.gradeId && topic.subjectId === topicEditor.subjectId && topic.title.trim().toLocaleLowerCase(appConfig.locale) === title.toLocaleLowerCase(appConfig.locale))) { setTopicError('Tên chủ đề này đã tồn tại trong lớp và môn đang chọn.'); return; }
    const topic: Topic = { ...topicEditor, id: topicEditor.id || crypto.randomUUID(), title, description: topicEditor.description.trim() };
    setTopics(current => current.some(item => item.id === topic.id) ? current.map(item => item.id === topic.id ? topic : item) : [...current, topic]);
    if (view === 'editor' && draft) updateDraft({ topicId: topic.id });
    else setTopicId(topic.id);
    const editingExisting = Boolean(topicEditor.id);
    resetTopicEditor();
    requestAnimationFrame(() => topicButtonRef.current?.focus());
    onNotice(editingExisting ? 'Đã cập nhật chủ đề.' : 'Đã tạo chủ đề. Bạn có thể thêm bài học vào chủ đề này.');
  };

  return { topicEditor, saveTopic, closeTopicEditor, setTopicEditor, setTopicError, topicError, draft, saveLesson, view, listHeadingRef, newLesson, gradeId, selectBranch, subjectId, topicId, branchTopics, selectedTopic, grade, subject, openTopicEditor, topicButtonRef, statusFilter, setStatusFilter, branchLessons, lessonQuery, setLessonQuery, visibleLessons, topics, openLesson, editorHeadingRef, persistedLesson, preview, dirty, setPreview, backToList, titleRef, updateDraft, errors, errorsRef, stage, setStage, stagePanelRef, editorTopics, changeClassification, editorTopic, unpublish, publishErrors, canLeave, adoptLesson, resetTopicEditor };
}
