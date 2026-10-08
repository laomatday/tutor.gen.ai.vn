import { useState } from "react";
import { Button, Icon, Input } from "../../components/ui";
import { useCurriculum } from "../../context/CurriculumContext";
import { getCourseProgress, lessonHref, ownedPublishedLessons, studentProfile } from "../curriculum";
import { normalizeSearch } from "../../lib/search";
import { practiceProblem } from "../practice/data";
import { TheoryLessonsView } from "./TheoryLessonsView";

interface KnowledgeMapViewProps {
  onNavigate: (path: string) => void;
  onEarnGp: (amount: number, reason: string) => void;
}

function CourseSearch({ query, onNavigate }: { query: string; onNavigate: (path: string) => void }) {
  const { subjects, topics, lessons, completedLessonIds } = useCurriculum();
  const [text, setText] = useState(query);
  const needle = normalizeSearch(query);
  const results = ownedPublishedLessons(lessons, topics).filter((lesson) =>
    normalizeSearch([
      lesson.title,
      lesson.summary,
      topics.find((item) => item.id === lesson.topicId)?.title ?? "",
      subjects.find((item) => item.id === lesson.subjectId)?.name ?? "",
    ].join(" ")).includes(needle),
  );
  return <div className="learning-os-page learning-mvp-page">
    <h1 className="text-2xl font-extrabold text-brand">Tìm bài học</h1>
    <form role="search" onSubmit={(event) => {event.preventDefault();onNavigate(`/hoc-bai?q=${encodeURIComponent(text.trim())}`);}} className="mt-4 flex gap-2">
      <Input type="search" value={text} onChange={(event) => setText(event.target.value)} aria-label="Từ khóa tìm bài học" placeholder="Tên bài hoặc chủ đề…" />
      <Button type="submit">Tìm</Button>
    </form>
    <p className="text-sm text-ink-600">{results.length} kết quả cho “{query}” trong các môn đã đăng ký.</p>
    <section aria-label="Kết quả tìm kiếm" className="grid gap-3 md:grid-cols-2">
      {results.map((lesson) => <div key={lesson.id} className="learning-mvp-card">
        <p className="text-xs font-bold text-ink-500">{subjects.find((item) => item.id === lesson.subjectId)?.name} · Lớp {lesson.gradeId}</p>
        <h2 className="mt-2 text-lg font-bold text-brand">{lesson.title}</h2>
        <p className="mt-1 text-sm text-ink-600">{lesson.summary}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-ink-600">{completedLessonIds.includes(lesson.id) ? "Đã hoàn thành" : "Chưa hoàn thành"}</span>
          <Button size="sm" onClick={() => onNavigate(lessonHref(lesson))}>Mở bài học <Icon name="arrow_forward" /></Button>
        </div>
      </div>)}
      {!results.length && <div className="learning-mvp-card">
        <h2 className="font-bold">Không tìm thấy bài phù hợp</h2>
        <p className="mt-2 text-sm text-ink-600">Thử một tên bài khác hoặc xem toàn bộ lộ trình.</p>
        <Button className="mt-3" onClick={() => onNavigate("/hoc-bai")}>Xem lộ trình</Button>
      </div>}
    </section>
  </div>;
}

function KnowledgeMapOverview({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { subjects, topics, lessons, completedLessonIds } = useCurriculum();
  const requested = new URLSearchParams(window.location.search).get("subject");
  const enrolled = studentProfile.enrollments
    .map((enrollment) => ({
      enrollment,
      subject: subjects.find((subject) => subject.id === enrollment.subjectId),
      progress: getCourseProgress(lessons, topics, completedLessonIds, enrollment),
    }))
    .filter((item) => Boolean(item.subject) && item.progress.total > 0);
  const selected = enrolled.find((item) => item.subject?.id === requested) ?? enrolled[0];
  const progress = selected?.progress;
  const currentTopics = selected ? topics.filter((topic) => topic.gradeId === selected.enrollment.gradeId && topic.subjectId === selected.enrollment.subjectId) : [];
  return (
    <div className="learning-os-page learning-mvp-page">
      <header className="learning-mvp-page-heading">
        <p className="learning-mvp-kicker">LỘ TRÌNH HỌC TẬP</p>
        <h1>Lộ trình của bạn</h1>
        <p>Chọn một chủ đề để học lý thuyết, xem ví dụ và luyện bài tập. Tiến độ tính từ các bài đã hoàn thành.</p>
      </header>
      <nav aria-label="Chọn môn học" className="flex flex-wrap gap-2">
        {enrolled.map((item) => (
          <Button key={item.enrollment.subjectId} variant="surface" aria-current={selected?.enrollment.subjectId === item.enrollment.subjectId ? "page" : undefined}
            className="learning-mvp-subject-tab" onClick={() => onNavigate(`/hoc-bai?grade=${item.enrollment.gradeId}&subject=${item.enrollment.subjectId}`)}>
            <Icon name={item.subject!.icon}/>{item.subject!.name}
          </Button>
        ))}
      </nav>
      {selected ? <>
        <section className="learning-mvp-card">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-brand">{selected.subject!.name} · Lớp {selected.enrollment.gradeId}</h2>
            <strong className="text-lg text-brand">{progress!.percent}%</strong>
          </div>
          <div className="learning-mvp-progress mt-3"><span style={{width:`${progress!.percent}%`}}/></div>
          <p className="mt-2 text-xs text-ink-600">{progress!.completed}/{progress!.total} bài đã hoàn thành</p>
        </section>
        <div className="grid gap-3 lg:grid-cols-2">
          {currentTopics.map((topic) => {
            const items = progress!.lessons.filter((lesson) => lesson.topicId === topic.id);
            if (!items.length) return null;
            const completed = items.filter((lesson) => completedLessonIds.includes(lesson.id)).length;
            const next = items.find((lesson) => !completedLessonIds.includes(lesson.id)) ?? items[0];
            return <section className="learning-mvp-card" key={topic.id}>
              <p className="learning-mvp-kicker">{completed}/{items.length} BÀI HOÀN THÀNH</p>
              <h2 className="mt-2 text-xl font-bold text-brand">{topic.title}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-600">{topic.description}</p>
              <ol className="mt-4 space-y-2">
                {items.map((lesson) => <li key={lesson.id}>
                  <Button variant="ghost" className="learning-mvp-lesson" onClick={() => onNavigate(lessonHref(lesson))}>
                    <Icon name={completedLessonIds.includes(lesson.id) ? "check_circle" : "menu_book"} />
                    <span className="flex-1 text-left">{lesson.title}</span>
                    <Icon name="chevron_right" />
                  </Button>
                </li>)}
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => onNavigate(lessonHref(next))}>
                  {completed === items.length ? "Ôn lại chủ đề" : "Bắt đầu học"} <Icon name="arrow_forward" />
                </Button>
                {items.some((lesson) => lesson.id === practiceProblem.lessonId) && (
                  <Button size="sm" variant="secondary" onClick={() => onNavigate(`/tu-giai?problem=${practiceProblem.id}`)}>
                    Luyện tập parabol
                  </Button>
                )}
              </div>
            </section>;
          })}
        </div>
      </> : <div className="learning-mvp-card">Chưa có môn học đã đăng ký được xuất bản.</div>}
    </div>
  );
}

/** Route switcher deliberately has no conditional hooks. */
export function KnowledgeMapView({ onNavigate, onEarnGp }: KnowledgeMapViewProps) {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q")?.trim();
  if (query) return <CourseSearch key={query} query={query} onNavigate={onNavigate} />;
  if (params.has("topic") || params.has("lesson")) {
    return <TheoryLessonsView onNavigate={onNavigate} onEarnGp={onEarnGp} />;
  }
  return <KnowledgeMapOverview onNavigate={onNavigate} />;
}
