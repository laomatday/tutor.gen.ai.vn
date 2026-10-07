import assert from 'node:assert/strict';
import { test } from 'node:test';
import { INITIAL_LESSONS, INITIAL_TOPICS, curriculumRules } from '../src/features/curriculum';
import { cleanLesson, createLessonDraft, getEditorErrors } from '../src/features/curriculum/admin/editorDomain';
import { validUsers } from '../src/features/admin/domain';
import { initialUsers } from '../src/features/admin/data';
import { isAssignments } from '../src/features/teacher/domain';
import { initialAssignments } from '../src/features/teacher/data';

test('new lesson follows the selected course and existing sequence', () => {
  const existing = INITIAL_LESSONS.filter(lesson => lesson.topicId === 'can-thuc');
  const draft = createLessonDraft('11', 'ngu-van', 'new-topic', existing);
  assert.equal(draft.gradeId, '11');
  assert.equal(draft.subjectId, 'ngu-van');
  assert.equal(draft.topicId, 'new-topic');
  assert.equal(draft.status, 'draft');
  assert.equal(draft.durationMinutes, curriculumRules.duration.default);
  assert.equal(draft.order, Math.max(...existing.map(lesson => lesson.order)) + 1);
  assert.ok(draft.exercises[0].id);
  assert.notEqual(createLessonDraft('11', 'ngu-van', 'new-topic', []).id, draft.id);
});

test('editor prevents cross-course topics, duplicate titles and invalid durations', () => {
  const source = INITIAL_LESSONS[0];
  const duplicate = { ...source, id: 'duplicate' };
  assert.ok(getEditorErrors(duplicate, INITIAL_TOPICS, INITIAL_LESSONS).some(error => error.includes('đã có')));
  assert.ok(getEditorErrors({ ...source, gradeId: '11' }, INITIAL_TOPICS, INITIAL_LESSONS).some(error => error.includes('chủ đề hợp lệ')));
  assert.ok(getEditorErrors({ ...source, durationMinutes: curriculumRules.duration.max + 1 }, INITIAL_TOPICS, INITIAL_LESSONS).some(error => error.includes('Thời lượng')));
  assert.deepEqual(getEditorErrors(source, INITIAL_TOPICS, INITIAL_LESSONS), []);
});

test('saving normalizes content without mutating the published source', () => {
  const source = structuredClone(INITIAL_LESSONS[0]);
  source.title = `  ${source.title}  `;
  source.examples[0].steps = ['  bước 1  ', '', ' bước 2 '];
  const snapshot = structuredClone(source);
  const saved = cleanLesson(source, 'draft');
  assert.equal(saved.title, source.title.trim());
  assert.deepEqual(saved.examples[0].steps, ['bước 1', 'bước 2']);
  assert.equal(saved.status, 'draft');
  assert.deepEqual(source, snapshot);
});

test('browser repository validators reject unsupported users and class references', () => {
  assert.equal(validUsers(initialUsers), true);
  assert.equal(validUsers([...initialUsers, initialUsers[0]]), false);
  assert.equal(validUsers([{ ...initialUsers[0], role: 'unknown' }]), false);
  assert.equal(isAssignments(initialAssignments), true);
  assert.equal(isAssignments([{ ...initialAssignments[0], classId: 'missing-class' }]), false);
  assert.equal(isAssignments([...initialAssignments, initialAssignments[0]]), false);
});
