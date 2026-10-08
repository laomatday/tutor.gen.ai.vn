import { useEffect, useState } from "react";
import { Button, Icon, Select } from "../../components/ui";
import { storageKeys } from "../../config/storage";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useCurriculum } from "../../context/CurriculumContext";
import { getCourseProgress } from "../curriculum";
import { getPracticeProblem } from "../practice/data";
import { createPracticeSession, isPracticeSession, type PracticeSession } from "../practice/domain";

interface Props { onNavigate: (path: string) => void; }

const formatElapsed = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
};

export function ThinkingReplayView({ onNavigate }: Props) {
  const id = new URLSearchParams(window.location.search).get("problem");
  const problem = getPracticeProblem(id || undefined);
  const [session] = useLocalStorage<PracticeSession>(
    storageKeys.practiceSessionV2, createPracticeSession(problem.id), isPracticeSession,
  );
  const { lessons, topics, completedLessonIds } = useCurriculum();
  const progress = getCourseProgress(lessons, topics, completedLessonIds);
  const events = session.problemId === problem.id ? session.events ?? [] : [];
  const [cursor, setCursor] = useState(events.length - 1);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const hasReplay = events.length > 1;

  useEffect(() => { setCursor(events.length - 1); setPlaying(false); }, [events.length]);
  useEffect(() => {
    if (!playing) return;
    if (cursor >= events.length - 1) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setCursor((current) => current + 1), 950 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, cursor, speed, events.length]);
  const startReplay = () => {
    if (playing) { setPlaying(false); return; }
    if (cursor >= events.length - 1) setCursor(0);
    setPlaying(true);
  };
  const revealed = events.slice(0, Math.max(0, cursor + 1));
  const lastEvent = revealed.at(-1);
  const elapsed = (eventAt: number) => formatElapsed((eventAt - (session.startedAt ?? events[0]?.at ?? eventAt)) / 1000);
  const actionLabel = (kind: string) =>
    kind === "hint" ? "Mở gợi ý" : kind === "check" ? "Kiểm tra bước giải" :
    kind === "submit" ? "Nộp bài" : "Bắt đầu phiên học";

  return <div className="learning-os-page learning-mvp-page">
    <header className="learning-mvp-page-heading">
      <p className="learning-mvp-kicker">LỊCH SỬ LÀM BÀI</p>
      <h1>Xem lại bài làm</h1>
      <p>Mỗi bước trong dòng thời gian được ghi khi bạn thực sự mở gợi ý, kiểm tra hoặc nộp bài. Không tạo lịch sử tư duy bằng dữ liệu giả.</p>
    </header>
    <section className="learning-mvp-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="learning-mvp-kicker">{problem.course} · {problem.id}</p><h2 className="mt-2 text-xl font-bold text-brand">{problem.title}</h2></div>
        <Button onClick={() => onNavigate(`/tu-giai?problem=${problem.id}`)}><Icon name="edit_square"/> Mở bài luyện tập</Button>
      </div>
      <p className="mt-3 text-sm text-ink-600">Tiến độ học liệu: {progress.completed}/{progress.total} bài ({progress.percent}%).</p>
    </section>
    {!hasReplay ? (
      <section className="learning-mvp-card" role="status">
        <h2 className="text-lg font-bold">Chưa có bước giải nào để xem lại</h2>
        <p className="mt-2 text-sm text-ink-600">Hãy bắt đầu bài luyện tập, thử một phép tính và bấm “Kiểm tra bước giải” hoặc “Nộp bài”.</p>
        <Button className="mt-4" onClick={() => onNavigate(`/tu-giai?problem=${problem.id}`)}>Bắt đầu luyện tập</Button>
      </section>
    ) : <>
      <section className="learning-mvp-card">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="icon" aria-label={playing ? "Tạm dừng" : "Phát lại"} onClick={startReplay}><Icon name={playing ? "pause" : "play_arrow"}/></Button>
          <span className="flex-1 text-sm font-semibold text-ink-600">{cursor + 1}/{events.length} sự kiện · {lastEvent ? elapsed(lastEvent.at) : "00:00"}</span>
          <label className="flex items-center gap-2 text-sm">
            Tốc độ
            <Select className="ui-field ui-field-sm" value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
              <option value={0.75}>0.75×</option><option value={1}>1×</option><option value={1.5}>1.5×</option><option value={2}>2×</option>
            </Select>
          </label>
        </div>
        <input type="range" className="mt-4 w-full accent-primary" aria-label="Vị trí phát lại"
          min={0} max={events.length - 1} step={1} value={Math.max(0,cursor)}
          onChange={(event) => {setPlaying(false);setCursor(Number(event.target.value));}}/>
      </section>
      <section className="learning-mvp-card">
        <h2 className="mb-4 text-lg font-bold text-brand">Các bước đã ghi nhận</h2>
        <ol className="space-y-3">
          {revealed.map((event) => <li key={event.id} className="learning-mvp-history-item">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-sm">{actionLabel(event.kind)}</strong>
              <time className="font-mono text-xs text-ink-500">{elapsed(event.at)}</time>
            </div>
            <p className="mt-2 text-sm leading-6 text-ink-700">{event.detail}</p>
            {event.input && <pre className="learning-mvp-event-data">{event.input}</pre>}
            {event.valid !== undefined && <p className="mt-2 text-xs font-semibold">{event.valid ? "Kiểm tra: hợp lệ" : "Kiểm tra: cần thử lại"}</p>}
          </li>)}
        </ol>
      </section>
    </>}
  </div>;
}
