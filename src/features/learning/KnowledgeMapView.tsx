import { useState } from "react";
import { Button, Card, Icon, Input, Progress } from "../../components/ui";
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
    .filter((item) => item.subject && item.progress.total > 0);
  const selected = enrolled.find((item) => item.subject?.id === requested) ?? enrolled[0];
  const currentTopics = selected
    ? topics.filter((topic) =>
      topic.gradeId === selected.enrollment.gradeId
      && topic.subjectId === selected.enrollment.subjectId
      && selected.progress.lessons.some((lesson) => lesson.topicId === topic.id))
    : [];
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const focus = currentTopics.find((topic) => topic.id === focusedId)
    ?? currentTopics.find((topic) =>
      selected?.progress.lessons.some((lesson) => lesson.topicId === topic.id && !completedLessonIds.includes(lesson.id)))
    ?? currentTopics[0];
  const topicLessonSet = (id: string) => selected?.progress.lessons.filter((lesson) => lesson.topicId === id) ?? [];
  const completed = (id: string) => topicLessonSet(id).filter((lesson) => completedLessonIds.includes(lesson.id)).length;
  const focusedLessons = focus ? topicLessonSet(focus.id) : [];
  const focusedDone = focus ? completed(focus.id) : 0;
  const next = focusedLessons.find((lesson) => !completedLessonIds.includes(lesson.id)) ?? focusedLessons[0];
  const positions = currentTopics.map((topic, index) => {
    const angle = (index / Math.max(1, currentTopics.length)) * Math.PI * 2 - Math.PI / 2;
    return { topic, x: 50 + 36 * Math.cos(angle), y: 50 + 36 * Math.sin(angle) };
  });
  return (
    <div className="learning-os-page ai-v3-page advanced-workspace">
      <section className="ai-v3-page-banner advanced-map-banner">
        <div>
          <p className="ai-v3-eyebrow">BẢN ĐỒ TRI THỨC · LỘ TRÌNH THỰC TẾ</p>
          <h1>Knowledge Universe <span>/ Môn học</span></h1>
          <p>Khám phá chủ đề và bài học đã xuất bản. Các đường nối thể hiện cùng một khóa học, không phải quan hệ tiên quyết do AI suy luận.</p>
        </div>
      </section>

      <nav aria-label="Chọn môn học" className="ai-v3-subject-tabs">
        {enrolled.map((item) => (
          <Button key={item.enrollment.subjectId} variant="surface"
            aria-current={selected?.enrollment.subjectId === item.enrollment.subjectId ? "page" : undefined}
            className={"ai-v3-subject-tab " + (selected?.enrollment.subjectId === item.enrollment.subjectId ? "is-active" : "")}
            onClick={() => onNavigate("/hoc-bai?grade=" + item.enrollment.gradeId + "&subject=" + item.enrollment.subjectId)}>
            <Icon name={item.subject!.icon} /><span><strong>{item.subject!.name} · Lớp {item.enrollment.gradeId}</strong><small>{item.progress.completed}/{item.progress.total} bài đã học</small></span>
          </Button>
        ))}
      </nav>
      {!selected ? (
        <Card className="p-6">
          <h2 className="font-bold text-brand">Chưa có khóa học được xuất bản</h2>
          <p className="mt-2 text-sm text-ink-600">Hãy đăng ký môn học hoặc chờ học liệu được xuất bản để xem bản đồ.</p>
        </Card>
      ) : (
        <>
          <section className="ai-v3-legend">
            <strong>Trạng thái lộ trình</strong>
            <span className="ai-v3-legend__item" data-state="mastered"><i/><b>Hoàn thành chủ đề</b></span>
            <span className="ai-v3-legend__item" data-state="current"><i/><b>Đang chọn</b></span>
            <span className="ai-v3-legend__item"><i/><b>Chưa hoàn thành</b></span>
            <span className="ml-auto text-sm font-semibold text-brand">{selected.progress.completed}/{selected.progress.total} bài đã hoàn thành</span>
          </section>
          <div className="ai-v3-map-layout">
            <section className="ai-v3-map-shell" aria-label="Sơ đồ kiến thức tương tác">
              <div className="ai-v3-map-shell__head">
                <div>
                  <p className="ai-v3-eyebrow"><Icon name="hub"/> SƠ ĐỒ CHỦ ĐỀ</p>
                  <h2>{selected.subject!.name} · Lớp {selected.enrollment.gradeId}</h2>
                  <p>Chạm vào từng nút để xem bài học, tiến độ và hoạt động tiếp theo.</p>
                </div>
                <span className="ai-v3-status">{currentTopics.length} chủ đề · {selected.progress.total} bài</span>
              </div>
              <div className="advanced-graph-viewport">
                <div className="ai-v3-knowledge-graph advanced-graph">
                  <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 1000 550" preserveAspectRatio="none">
                    {positions.map(({topic,x,y}) => (
                      <path key={topic.id} d={"M500 275 L" + x*10 + " " + y*5.5}
                        className={"ai-v3-map-edge " + (topic.id === focus?.id ? "" : "ai-v3-map-edge--soft")}/>
                    ))}
                  </svg>
                  <div className="ai-v3-map-core">
                    <Icon name="school"/>
                    <strong>{selected.subject!.name}</strong>
                    <small>{selected.progress.percent}% đã hoàn thành</small>
                  </div>
                  {positions.map(({ topic, x, y }) => {
                    const items = topicLessonSet(topic.id);
                    const done = completed(topic.id);
                    const state = items.length && done === items.length ? "mastered" : focus?.id === topic.id ? "current" : "untouched";
                    return (
                      <Button key={topic.id} variant="surface" data-state={state}
                        className="ai-v3-map-node"
                        style={{left:x+"%",top:y+"%"}}
                        onClick={() => setFocusedId(topic.id)}
                        aria-pressed={focus?.id === topic.id}
                        aria-label={topic.title + " — " + done + "/" + items.length + " bài hoàn thành"}>
                        <span className="ai-v3-map-node__orb"><Icon name={done === items.length ? "check" : "menu_book"}/></span>
                        <strong>{topic.title}</strong><small>{done}/{items.length} bài</small>
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="ai-v3-map-footer">
                <span><Icon name="info"/> Dữ liệu từ chương trình đang mở</span>
                <span>Chủ đề đang chọn: <strong>{focus?.title ?? "Chưa có"}</strong></span>
              </div>
            </section>
            <aside className="ai-v3-card ai-v3-node-panel" aria-label="Thông tin chủ đề">
              {focus ? (
                <>
                  <p className="ai-v3-eyebrow"><Icon name="account_tree"/> CHỦ ĐỀ ĐANG CHỌN</p>
                  <h2 className="ai-v3-section-title">{focus.title}</h2>
                  <p className="ai-v3-section-copy">{focus.description}</p>
                  <div className="ai-v3-node-score mt-5">
                    <span>Tiến độ bài học</span><strong>{focusedLessons.length ? Math.round(focusedDone / focusedLessons.length * 100) : 0}%</strong>
                    <Progress className="mt-3" tone="accent" value={focusedDone} max={focusedLessons.length||1} label={"Hoàn thành chủ đề " + focus.title}/>
                    <small>{focusedDone}/{focusedLessons.length} bài đã hoàn thành</small>
                  </div>
                  <div className="ai-v3-node-section mt-5">
                    <h3><Icon name="menu_book"/> Bài học trong chủ đề</h3>
                    <ul>
                      {focusedLessons.map((lesson) => (
                        <li key={lesson.id}>
                          <Icon name={completedLessonIds.includes(lesson.id)?"check_circle":"radio_button_unchecked"}/>
                          <span className="min-w-0 flex-1">{lesson.title}</span>
                          <Button variant="ghost" size="sm" aria-label={"Mở " + lesson.title} onClick={() => onNavigate(lessonHref(lesson))}><Icon name="arrow_forward"/></Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {next && <Button className="mt-5 w-full" onClick={() => onNavigate(lessonHref(next))}>{focusedDone===focusedLessons.length?"Ôn lại chủ đề":"Học bài tiếp theo"} <Icon name="arrow_forward"/></Button>}
                  {focusedLessons.some((lesson)=>lesson.id===practiceProblem.lessonId) && (
                    <Button variant="secondary" className="mt-2 w-full" onClick={() => onNavigate("/tu-giai?problem="+practiceProblem.id)}>Luyện tập parabol</Button>
                  )}
                </>
              ) : (
                <p className="text-sm text-ink-600">Chưa có chủ đề nào trong môn học này.</p>
              )}
            </aside>
          </div>
        </>
      )}
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
