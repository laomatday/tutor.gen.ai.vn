import { useEffect, useState } from "react";
import { Button, Icon, Input } from "../../components/ui";
import { getPracticeProblems, practicePolicy } from "../../features/practice/data";
import {
  formatElapsed,
  getPracticeStats,
  getReplayCursor,
  type PracticeEvent,
} from "../../features/practice/domain";
import { usePracticeSession } from "../../features/practice/usePracticeSession";
import { getEnrolledPracticeProblems } from "../../features/practice/eligibility";
import { studentProfile } from "../../features/curriculum";
import type { PracticeProblem } from "../../types/content";
import { V2HeroArtwork } from "../components/V2HeroArtwork";
import "./thinking-replay.css";

interface Props {
  onNavigate: (path: string) => void;
  search: string;
}

function eventLabel(event: PracticeEvent): string {
  if (event.kind === "start") return "Bắt đầu giải";
  if (event.kind === "hint") return "Mở gợi ý";
  if (event.valid) return event.kind === "submit" ? "Nộp bài đúng" : "Bước giải phù hợp";
  if (event.issue === "incomplete") return "Cần thêm một bước";
  if (event.valid === false) return "Cần điều chỉnh";
  return "Đã ghi nhận";
}

function eventStatus(event: PracticeEvent): string {
  if (event.valid) return "correct";
  if (event.kind === "hint") return "hint";
  if (event.valid === false) return "review";
  return "neutral";
}

export function ThinkingReplayPage({ onNavigate, search }: Props) {
  const available = getEnrolledPracticeProblems(getPracticeProblems(), studentProfile.enrollments);
  const id = new URLSearchParams(search).get("problem");
  const problem = id ? available.find((item) => item.id === id) : available[0];
  if (!problem) {
    return (
      <section className="v2-replay-empty">
        <Icon name="info" />
        <h1>Chưa có bài phù hợp để xem lại</h1>
        <p>Bài tập đã chọn không tồn tại hoặc chưa có trong chương trình đã mở.</p>
        <Button onClick={() => onNavigate("/hoc-bai")}>Khám phá môn học</Button>
      </section>
    );
  }
  return <ReplayWorkspace key={problem.id} problem={problem} onNavigate={onNavigate} />;
}

function ReplayWorkspace({
  problem,
  onNavigate,
}: {
  problem: PracticeProblem;
  onNavigate: (path: string) => void;
}) {
  const [session, updateSession, storageError] = usePracticeSession(problem.id);
  const stats = getPracticeStats(session);
  const { events, durationMs, mistakes, hints, corrections } = stats;
  const start = session.startedAt ?? events[0]?.at ?? 0;
  const hasReplay = stats.checks.length > 0;
  const [playhead, setPlayhead] = useState(durationMs);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const cursor = getReplayCursor(events, start, playhead);
  const visibleEvents = events.slice(0, Math.max(0, cursor + 1));
  const activeEvent = visibleEvents.at(-1);
  const lastCapturedAttempt = [...visibleEvents].reverse().find(
    (event) => (event.kind === "check" || event.kind === "submit") && typeof event.input === "string",
  );
  const recentMistake = mistakes.at(-1);
  const saved = recentMistake ? (session.savedMistakes ?? []).includes(recentMistake.id) : false;

  useEffect(() => {
    if (!playing || !hasReplay) return;
    const begin = performance.now();
    const captured = playhead;
    const timer = window.setInterval(() => {
      const position = Math.min(durationMs, captured + (performance.now() - begin) * speed);
      setPlayhead(position);
      if (position >= durationMs) setPlaying(false);
    }, 80);
    return () => window.clearInterval(timer);
    // Captures a new base position only on play/seek/speed changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed, durationMs, hasReplay]);

  function seek(position: number) {
    setPlaying(false);
    setPlayhead(Math.max(0, Math.min(durationMs, position)));
  }
  function togglePlay() {
    if (playing) return setPlaying(false);
    if (playhead >= durationMs) setPlayhead(0);
    setPlaying(true);
  }
  function bookmark() {
    if (!recentMistake) return;
    updateSession((current) => ({
      ...current,
      savedMistakes: (current.savedMistakes ?? []).includes(recentMistake.id)
        ? (current.savedMistakes ?? []).filter((id) => id !== recentMistake.id)
        : [...(current.savedMistakes ?? []), recentMistake.id],
    }));
  }

  return (
    <div className="v2-replay-page">
      <header className="v2-replay-hero">
        <V2HeroArtwork />
        <div>
          <p className="v2-replay-eyebrow"><Icon name="history" /> Nhìn lại để hiểu sâu hơn</p>
          <h1>Thinking <span>Replay</span></h1>
          <p>Những lần thử, những bước chỉnh sửa và quá trình học của chính em.</p>
        </div>
      </header>

      {storageError && <div role="alert" className="v2-replay-warning">{storageError}</div>}
      <div className="v2-replay-context">
        <Button variant="ghost" onClick={() => onNavigate("/tu-giai")}>
          <Icon name="arrow_back" /> Quay về Focus Studio
        </Button>
        <div>
          <h2>{problem.title}</h2>
          <p>{problem.course} · {problem.topic}</p>
        </div>
        {hasReplay && (
          <div className="v2-replay-context-time">
            <Icon name="schedule" /> Khoảng thời gian: {formatElapsed(durationMs)}
          </div>
        )}
      </div>

      {!hasReplay ? (
        <section className="v2-replay-empty">
          <Icon name="history" />
          <h2>Chưa có lần thử nào? Bắt đầu thôi.</h2>
          <p>Sau khi em kiểm tra bước giải đầu tiên, các sự kiện thật sẽ xuất hiện ở đây.</p>
          <Button onClick={() => onNavigate(`/tu-giai?problem=${problem.id}`)}>
            Thử giải bài đầu tiên <Icon name="arrow_forward" />
          </Button>
        </section>
      ) : (
        <>
          <section className="v2-replay-main" aria-label="Phát lại quá trình tự giải">
            <aside className="v2-replay-timeline" aria-label="Các bước đã ghi nhận">
              <h2><Icon name="timeline" /> Dòng thời gian</h2>
              <ol>
                {events.map((event, index) => (
                  <li key={event.id} data-state={eventStatus(event)}>
                    <Button
                      variant="ghost"
                      aria-current={activeEvent?.id === event.id ? "step" : undefined}
                      onClick={() => seek(event.at - start)}
                    >
                      <span className="v2-replay-step-icon">
                        <Icon name={
                          event.kind === "hint" ? "lightbulb"
                            : event.valid ? "check_circle"
                              : event.valid === false ? "edit_note"
                                : "play_arrow"
                        } />
                      </span>
                      <span>
                        <strong>{index + 1}. {eventLabel(event)}</strong>
                        <small>{formatElapsed(event.at - start)}</small>
                      </span>
                    </Button>
                  </li>
                ))}
              </ol>
            </aside>

            <div className="v2-replay-player">
              <div className="v2-replay-paper">
                <div className="v2-replay-paper-title">
                  <span>Bản ghi lời giải</span>
                  <time>{activeEvent ? formatElapsed(activeEvent.at - start) : "00:00"}</time>
                </div>
                <h3>Đề bài</h3>
                <p>{problem.statement}</p>
                <div className="v2-replay-written" aria-live="polite">
                  {lastCapturedAttempt ? (
                    <pre data-event-id={lastCapturedAttempt.id}>{lastCapturedAttempt.input}</pre>
                  ) : (
                    <p className="v2-replay-no-input">
                      Chưa có văn bản lời giải tại mốc này. Chọn lần kiểm tra để xem nội dung đã lưu.
                    </p>
                  )}
                </div>
                {activeEvent && (
                  <div className="v2-replay-feedback" data-state={eventStatus(activeEvent)}>
                    <Icon name={activeEvent.valid ? "check_circle" : activeEvent.kind === "hint" ? "lightbulb" : "edit_note"} />
                    <span>{activeEvent.detail}</span>
                  </div>
                )}
              </div>

              <div className="v2-replay-transport">
                <Button
                  size="icon"
                  aria-label={playing ? "Tạm dừng" : "Phát lại"}
                  disabled={!durationMs}
                  onClick={togglePlay}
                ><Icon name={playing ? "pause" : "play_arrow"} /></Button>
                <span className="v2-replay-clock">{formatElapsed(playhead)} / {formatElapsed(durationMs)}</span>
                <Input
                  className="v2-replay-seek"
                  type="range"
                  aria-label="Vị trí phát lại"
                  min={0}
                  max={Math.max(1, durationMs)}
                  step={1}
                  value={playhead}
                  onChange={(event) => seek(Number(event.target.value))}
                />
                <div className="v2-replay-speeds" role="group" aria-label="Tốc độ phát lại">
                  {practicePolicy.replaySpeeds.map((rate) => (
                    <Button
                      key={rate}
                      variant="ghost"
                      size="sm"
                      aria-pressed={speed === rate}
                      onClick={() => setSpeed(rate)}
                    >{rate}×</Button>
                  ))}
                </div>
              </div>
            </div>

            <aside className="v2-replay-reflection" aria-label="Nhìn lại quá trình học">
              <h2><Icon name="psychology" /> Nhìn lại và hiểu hơn</h2>
              <div className="v2-replay-reflection-item" data-kind="mistake">
                <Icon name="edit_note" />
                <span><strong>Lần thử cần sửa</strong><small>{mistakes.length} lần kiểm tra sai đã ghi nhận</small></span>
              </div>
              <div className="v2-replay-reflection-item" data-kind="correction">
                <Icon name="verified_user" />
                <span><strong>Điều em đã sửa</strong><small>{corrections} lần kiểm tra đúng sau khi từng sai</small></span>
              </div>
              <div className="v2-replay-reflection-item" data-kind="hint">
                <Icon name="lightbulb" />
                <span><strong>Gợi ý đã mở</strong><small>{hints.length} sự kiện hỗ trợ trong phiên</small></span>
              </div>
              <div className="v2-replay-reflection-note">
                <strong>Nhận xét có bằng chứng</strong>
                <p>
                  {corrections
                    ? "Em đã thử cách khác và kiểm tra đúng sau lần sai. Hãy xem lại phép biến đổi đã thay đổi."
                    : stats.solved
                      ? "Có lượt kiểm tra đúng đã ghi nhận. Em có thể ôn lại các bước giải."
                      : "Các sự kiện đã ghi nhận giúp em xác định bước tiếp theo, không đoán suy nghĩ bên trong."}
                </p>
              </div>
              <Button
                className="v2-replay-return"
                onClick={() => onNavigate(`/tu-giai?problem=${problem.id}`)}
              >Tiếp tục tự giải <Icon name="arrow_forward" /></Button>
            </aside>
          </section>

          <div className="v2-replay-bottom">
            <section className="v2-replay-bottom-panel" aria-labelledby="v2-replay-attempts-title">
              <h2 id="v2-replay-attempts-title"><Icon name="edit_square" /> Những lần em tự kiểm tra</h2>
              <ol className="v2-replay-attempt-list">
                {stats.checks.map((event, index) => (
                  <li key={event.id} data-state={eventStatus(event)}>
                    <Button variant="ghost" onClick={() => seek(event.at - start)}>
                      <Icon name={event.valid ? "check_circle" : "edit_note"} />
                      <span>Lần {index + 1}</span>
                      <time>{formatElapsed(event.at - start)}</time>
                      <strong>{eventLabel(event)}</strong>
                    </Button>
                  </li>
                ))}
              </ol>
            </section>
            <section className="v2-replay-bottom-panel">
              <h2><Icon name="schedule" /> Tổng quan phiên học</h2>
              <div className="v2-replay-summary-grid">
                <div><strong>{stats.checks.length}</strong><span>Lượt tự kiểm tra</span></div>
                <div><strong>{hints.length}</strong><span>Gợi ý đã mở</span></div>
                <div><strong>{corrections}</strong><span>Lần tự sửa đúng</span></div>
              </div>
              <p className="v2-replay-disclaimer">Khoảng thời gian giữa các sự kiện không đồng nghĩa thời gian tập trung. Tất cả số liệu đến từ phiên bài làm này.</p>
            </section>
            <section className="v2-replay-bottom-panel">
              <h2><Icon name="menu_book" /> Tự cải thiện</h2>
              <p>{recentMistake?.detail ?? "Không có lỗi được ghi nhận ở bài này."}</p>
              <Button
                variant="secondary"
                aria-pressed={saved}
                disabled={!recentMistake}
                onClick={bookmark}
              ><Icon name={saved ? "check" : "bookmark"} /> {saved ? "Đã lưu lỗi để ôn" : "Lưu lỗi để ôn"}</Button>
              <Button onClick={() => onNavigate(`/tu-giai?problem=${problem.id}`)}>
                Làm lại bài này <Icon name="arrow_forward" />
              </Button>
            </section>
          </div>

          {(session.sketch ?? []).some((stroke) => stroke.length) && (
            <section className="v2-replay-bottom-panel">
              <h2><Icon name="gesture" /> Bản phác thảo gần nhất đã lưu</h2>
              <svg
                viewBox="0 0 800 300"
                preserveAspectRatio="none"
                className="v2-replay-sketch"
                role="img"
                aria-label="Bản phác thảo đã lưu trên thiết bị"
              >
                <g>
                  {(session.sketch ?? []).filter((stroke) => stroke.length).map((stroke, index) => (
                    <polyline
                      key={index}
                      points={stroke.map((point) => `${point.x},${point.y}`).join(" ")}
                      fill="none"
                      stroke="var(--color-cyan)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                </g>
              </svg>
              <p className="v2-replay-disclaimer">Đây là bản phác thảo mới nhất được lưu, không phải bản ghi từng nét theo thời gian.</p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
