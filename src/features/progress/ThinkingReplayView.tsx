import { useEffect, useState } from "react";
import { Button, Icon, Select, Input, Card } from "../../components/ui";
import { storageKeys } from "../../config/storage";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useCurriculum } from "../../context/CurriculumContext";
import { getCourseProgress, primaryEnrollment } from "../curriculum";
import { getPracticeProblem } from "../practice/data";
import { createPracticeSession, isPracticeSession, type PracticeEvent, type PracticeSession } from "../practice/domain";

interface Props { onNavigate: (path: string) => void; }

const formatElapsed = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  return String(Math.floor(safe / 60)).padStart(2, "0") + ":" + String(safe % 60).padStart(2, "0");
};
function actionLabel(kind: PracticeEvent["kind"]) {
  if (kind === "hint") return "Mở gợi ý";
  if (kind === "check") return "Kiểm tra bước";
  if (kind === "submit") return "Nộp bài";
  return "Bắt đầu phiên";
}
function eventState(event: PracticeEvent) {
  if (event.valid === true) return "success";
  if (event.valid === false) return "danger";
  if (event.kind === "hint") return "ai";
  return "neutral";
}

export function ThinkingReplayView({ onNavigate }: Props) {
  const id = new URLSearchParams(window.location.search).get("problem");
  const problem = getPracticeProblem(id || undefined);
  const [session] = useLocalStorage<PracticeSession>(
    storageKeys.practiceSessionV2, createPracticeSession(problem.id), isPracticeSession,
  );
  const { lessons, topics, completedLessonIds } = useCurriculum();
  const progress = getCourseProgress(lessons, topics, completedLessonIds, primaryEnrollment);
  const events = session.problemId === problem.id ? session.events ?? [] : [];
  const [cursor, setCursor] = useState(events.length - 1);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const hasReplay = events.length > 1;
  const mistakes = events.filter((event) => (event.kind === "check" || event.kind === "submit") && event.valid === false);
  const corrections = events.filter((event) => (event.kind === "check" || event.kind === "submit") && event.valid === true);
  const hints = events.filter((event) => event.kind === "hint");
  const start = session.startedAt ?? events[0]?.at ?? 0;
  const elapsed = (at:number) => formatElapsed(Math.max(0, (at - start)/1000));
  const total = events.length ? elapsed(events[events.length - 1].at) : "00:00";

  useEffect(() => { setCursor(events.length - 1); setPlaying(false); }, [events.length]);
  useEffect(() => {
    if (!playing) return;
    if (cursor >= events.length - 1) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setCursor((previous) => previous + 1), 950 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, cursor, speed, events.length]);
  const togglePlayback = () => {
    if (playing) {setPlaying(false); return;}
    if (cursor >= events.length - 1) setCursor(0);
    setPlaying(true);
  };
  const revealed = events.slice(0, Math.max(0, cursor + 1));
  const currentEvent = revealed.at(-1);

  return (
    <div className="learning-os-page ai-v3-page advanced-workspace">
      <section className="ai-v3-page-banner advanced-replay-banner">
        <div>
          <p className="ai-v3-eyebrow"><Icon name="history"/> THINKING REPLAY · LỊCH SỬ THỰC TẾ</p>
          <h1>Xem lại bài làm <span>/ Tái hiện các bước</span></h1>
          <p>Từng sự kiện được ghi lại khi em mở gợi ý, kiểm tra hoặc nộp bài. Không phát sinh bước suy nghĩ, nét vẽ hay lời giải bằng dữ liệu tưởng tượng.</p>
        </div>
      </section>

      <section className="ai-v3-card ai-v3-replay-summary">
        <div>
          <p className="ai-v3-eyebrow">{problem.course} · {problem.id}</p>
          <h2 className="ai-v3-section-title">{problem.title}</h2>
          <p className="ai-v3-section-copy">Tiến độ môn: {progress.completed}/{progress.total} bài đã hoàn thành.</p>
        </div>
        <div className="ai-v3-replay-metrics">
          <div><Icon name="timer"/><strong>{hasReplay ? total : "—"}</strong><small>Thời gian ghi nhận</small></div>
          <div><Icon name="history"/><strong>{Math.max(0,events.length-1)}</strong><small>Sự kiện</small></div>
          <div><Icon name="warning"/><strong>{mistakes.length}</strong><small>Lượt cần sửa</small></div>
          <div><Icon name="lightbulb"/><strong>{hints.length}</strong><small>Gợi ý đã mở</small></div>
        </div>
      </section>

      {!hasReplay ? (
        <Card className="p-6" role="status">
          <h2 className="text-lg font-bold text-brand">Chưa có bài nộp để xem lại</h2>
          <p className="mt-2 text-sm leading-6 text-ink-600">Hãy bắt đầu luyện tập, thử một bước và bấm “Kiểm tra bước giải” hoặc “Nộp bài” để hệ thống ghi lại.</p>
          <Button className="mt-4" onClick={() => onNavigate("/tu-giai?problem="+problem.id)}>Bắt đầu luyện tập</Button>
        </Card>
      ) : (
        <>
          <section className="ai-v3-replay-player">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="icon" className="ai-v3-play-button" aria-label={playing ? "Tạm dừng" : "Phát lại"} onClick={togglePlayback}>
                <Icon name={playing ? "pause" : "play_arrow"} />
              </Button>
              <div className="min-w-0 flex-1">
                <strong className="text-sm text-brand">{currentEvent ? elapsed(currentEvent.at) : "00:00"} / {total}</strong>
                <p className="text-xs text-ink-600">{cursor + 1}/{events.length} sự kiện · {currentEvent ? actionLabel(currentEvent.kind) : "Chờ phát"}</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-600">
                Tốc độ
                <Select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} variant="pill">
                  <option value={0.75}>0.75×</option>
                  <option value={1}>1×</option>
                  <option value={1.5}>1.5×</option>
                  <option value={2}>2×</option>
                </Select>
              </label>
            </div>
            <Input type="range" className="mt-4 w-full accent-primary" aria-label="Vị trí phát lại"
              min={0} max={events.length-1} value={Math.max(0,cursor)}
              onChange={(event) => {setPlaying(false);setCursor(Number(event.target.value));}}/>
            <ol className="advanced-replay-markers" aria-label="Các mốc phát lại">
              {events.map((event, index) => (
                <li key={event.id}>
                  <Button variant="surface" className="advanced-replay-marker" data-state={eventState(event)}
                    aria-label={actionLabel(event.kind)+" tại "+elapsed(event.at)}
                    aria-current={cursor===index?"step":undefined}
                    onClick={() => {setPlaying(false);setCursor(index);}}>
                    <span className="advanced-replay-marker__dot"/>
                    <small>{elapsed(event.at)}</small>
                  </Button>
                </li>
              ))}
            </ol>
          </section>

          <div className="ai-v3-replay-layout">
            <section className="ai-v3-card">
              <div className="ai-v3-card__head">
                <div>
                  <p className="ai-v3-eyebrow"><Icon name="timeline"/> TỪNG SỰ KIỆN ĐÃ GHI NHẬN</p>
                  <h2 className="ai-v3-section-title">Các bước đã ghi nhận</h2>
                </div>
                <span className="ai-v3-status">{revealed.length} / {events.length} sự kiện</span>
              </div>
              <ol className="ai-v3-thought-log">
                {revealed.map((event) => (
                  <li className="ai-v3-thought-event" data-state={eventState(event)} key={event.id}>
                    <div className="ai-v3-thought-event__rail"><i/><time>{elapsed(event.at)}</time></div>
                    <div className="ai-v3-thought-event__card">
                      <strong>{actionLabel(event.kind)}</strong>
                      <p>{event.detail}</p>
                      {event.input && <pre className="learning-mvp-event-data">{event.input}</pre>}
                      {event.valid !== undefined && <p className="mt-2 text-xs font-semibold">{event.valid ? "Kiểm tra: hợp lệ" : "Kiểm tra: cần thử lại"}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <aside className="space-y-4" aria-label="Phân tích dựa trên các lượt làm bài">
              <section className="ai-v3-card">
                <p className="ai-v3-eyebrow"><Icon name="psychology"/> MISTAKE DNA · NHẬT KÝ CẦN SỬA</p>
                <h2 className="ai-v3-section-title">Những bước cần xem lại</h2>
                {mistakes.length === 0 ? (
                  <p className="mt-3 text-sm text-ink-600">Chưa ghi nhận phép biến đổi sai ở bài này. Không có dữ liệu để suy luận về một “mẫu lỗi” cá nhân.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-ink-600">Đã ghi nhận {mistakes.length} lượt chưa đạt từ chính bộ kiểm tra bài này. Không phải chẩn đoán năng lực tổng quát.</p>
                    {mistakes.map((event) => (
                      <div className="ai-v3-mistake-card" key={event.id}>
                        <b>{elapsed(event.at)} · {actionLabel(event.kind)}</b>
                        <p>{event.detail}</p>
                        {event.input && <pre className="learning-mvp-event-data">{event.input}</pre>}
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <section className="ai-v3-card ai-v3-coach-panel">
                <p className="ai-v3-eyebrow"><Icon name="verified"/> TỰ SỬA & GỢI Ý</p>
                <h2 className="ai-v3-section-title">Quá trình hoàn thành</h2>
                <p className="mt-3 text-sm text-ink-600">Có {corrections.length} lần kiểm tra/nộp bài phù hợp và {hints.length} gợi ý đã mở trong phiên này.</p>
                <Button variant="secondary" className="mt-3" onClick={() => onNavigate("/tu-giai?problem="+problem.id)}>
                  <Icon name="edit_square"/> Quay lại Focus Studio
                </Button>
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
