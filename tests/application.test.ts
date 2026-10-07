import test from 'node:test';
import assert from 'node:assert/strict';
import { localDate } from '../src/lib/dates';
import { normalizeSearch } from '../src/lib/search';
import { readStoredValue, type StorageAdapter } from '../src/lib/browserStorage';
import { readRoute } from '../src/app/navigation';
import { allowedReward, validSpend } from '../src/app/useRewardWallet';
import { INITIAL_LESSONS, INITIAL_TOPICS, ownedPublishedLessons, summarizeProgress, getPublishErrors, isLessons, lessonHref, curriculumRules } from '../src/features/curriculum';

test('Vietnamese date boundaries and search normalization are consistent', () => {
  assert.equal(localDate(0, new Date('2026-10-07T18:00:00Z')), '2026-10-08');
  assert.equal(localDate(1, new Date('2026-12-31T12:00:00Z')), '2027-01-01');
  assert.equal(normalizeSearch('ĐƯỜNG tròn'), 'duong tron');
});
test('Storage boundary rejects invalid JSON and wrong data shape, tolerates denial', () => {
  const storage: StorageAdapter = { read: () => '{broken', write: () => {} };
  assert.equal(readStoredValue(storage, 'sample', 12).value, 12);
  storage.read = () => JSON.stringify('twelve');
  assert.ok(readStoredValue(storage, 'sample', 12).error);
  storage.read = () => { throw new Error('denied'); };
  assert.equal(readStoredValue(storage, 'sample', []).value.length, 0);
});
test('Wallet policy caps awards and rejects invalid or unaffordable spending', () => {
  assert.equal(allowedReward(20, 115), 5);
  assert.equal(allowedReward(20, 120), 0);
  assert.equal(allowedReward(-3, 0), 0);
  assert.equal(allowedReward(NaN, 0), 0);
  assert.equal(validSpend(350, 349), false);
  assert.equal(validSpend(-350, 860), false);
  assert.equal(validSpend(1.5, 860), false);
  assert.equal(validSpend(350, 860), true);
});
test('Course selectors hide unpurchased and unpublished content and ignore orphan lessons', () => {
  const course = ownedPublishedLessons(INITIAL_LESSONS, INITIAL_TOPICS);
  assert.equal(course.length, 6);
  assert.ok(course.every(lesson => lesson.gradeId === '9' && lesson.subjectId === 'toan'));
  assert.equal(ownedPublishedLessons(INITIAL_LESSONS, []).length, 0);
  const progress = summarizeProgress(course, ['can-bac-hai', 'unknown', 'can-bac-hai']);
  assert.equal(progress.completed, 1);
  assert.equal(progress.percent, 17);
  assert.equal(progress.nextLesson?.id, 'rut-gon-can-thuc');
});
test('Published schema and shared editor limits reject incomplete/ambiguous exercise content', () => {
  const lesson = structuredClone(INITIAL_LESSONS[0]);
  assert.equal(getPublishErrors(lesson).length, 0);
  lesson.exercises[0].options = ['same', 'same'];
  assert.ok(getPublishErrors(lesson).length);
  assert.equal(isLessons([lesson]), false);
  lesson.durationMinutes = curriculumRules.duration.max + 1;
  assert.ok(getPublishErrors(lesson).some(error => error.includes('Thời lượng')));
});
test('Navigation uses centralized routes and preserves lesson hierarchy', () => {
  assert.equal(readRoute('/giao-vien/lop-hoc/').section, 'classes');
  assert.equal(readRoute('/quan-tri/hoc-lieu').role, 'Quản trị');
  assert.equal(readRoute('/hoc-bai').section, 'hoc-bai');
  const link = new URL(lessonHref(INITIAL_LESSONS[0], 'exercises'), 'https://example.test');
  assert.equal(link.searchParams.get('grade'), '9');
  assert.equal(link.searchParams.get('topic'), INITIAL_LESSONS[0].topicId);
  assert.equal(link.searchParams.get('stage'), 'exercises');
});
