import { useEffect, useState } from "react";
import { RichMathText } from "../../components/MathLatex";
import { Alert, Button, Icon, Input } from "../../components/ui";
import {
  getPracticeProblem,
  getPracticeProblems,
  practicePolicy,
} from "../practice/data";
import {
  formatElapsed,
  getPracticeStats,
  getReplayCursor,
  type PracticeEvent,
} from "../practice/domain";
import { usePracticeSession } from "../practice/usePracticeSession";
import type { PracticeProblem } from "../../types/content";
import "../../styles/student-studio.css";

interface Props {
  onNavigate: (path: string) => void;
}
function actionLabel(event: PracticeEvent) {
  if (event.kind === "hint") return "Mở một gợi ý";
  if (event.valid)
    return event.kind === "submit"
      ? "Hoàn thành bài toán"
      : "Bước giải đã khớp";
  if (event.issue === "incomplete") return "Đi đúng hướng rồi";
  if (event.valid === false)
    return event.issue === "format"
      ? "Viết rõ hơn một chút"
      : "Dừng lại để xem kỹ";
  return "Bắt đầu phiên tự giải";
}
function eventState(event: PracticeEvent) {
  return event.valid
    ? "success"
    : event.kind === "hint"
      ? "hint"
      : event.valid === false && event.issue !== "incomplete"
        ? "warning"
        : "neutral";
}
export function ThinkingReplayView(props: Props) {
  const id = new URLSearchParams(window.location.search).get("problem");
  const problem =
    getPracticeProblems().find((item) => item.id === id) ??
    getPracticeProblem(practicePolicy.defaultStudioProblemId);
  return <ReplaySession key={problem.id} problem={problem} {...props} />;
}
function ReplaySession({
  onNavigate,
  problem,
}: Props & { problem: PracticeProblem }) {
  const [session, updateSession, storageError] = usePracticeSession(problem.id);
  const stats = getPracticeStats(session);
  const { events, durationMs, mistakes, hints, corrections } = stats;
  const start = session.startedAt ?? events[0]?.at ?? 0;
  const [playhead, setPlayhead] = useState(durationMs);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const cursor = getReplayCursor(events, start, playhead);
  const hasReplay = events.length > 1;
  const revealed = events.slice(0, Math.max(0, cursor + 1));
  const currentEvent = revealed.at(-1);
  const currentInput = [...revealed]
    .reverse()
    .find((event) => event.input)?.input;
  const latestMistake = mistakes.at(-1);
  const saved =
    !!latestMistake && (session.savedMistakes ?? []).includes(latestMistake.id);
  useEffect(() => {
    if (!playing) return;
    const wallStart = performance.now();
    const position = playhead;
    const timer = window.setInterval(() => {
      const next = Math.min(
        durationMs,
        position + (performance.now() - wallStart) * speed,
      );
      setPlayhead(next);
      if (next >= durationMs) setPlaying(false);
    }, 80);
    return () => window.clearInterval(timer);
    // The starting position is captured once per playback/seek; the wall clock drives subsequent ticks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed, durationMs]);
  const seek = (position: number) => {
    setPlaying(false);
    setPlayhead(Math.max(0, Math.min(durationMs, position)));
  };
  const toggle = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (playhead >= durationMs) setPlayhead(0);
    setPlaying(true);
  };
  const navigateToPractice = () => onNavigate(`/tu-giai?problem=${problem.id}`);
  const markers = (hasReplay ? events : []).filter(
    (_, index) =>
      events.length <= 6 ||
      index === 0 ||
      index === events.length - 1 ||
      index % Math.ceil(events.length / 5) === 0,
  );
  const bookmarkMistake = () => {
    if (!latestMistake) return;
    updateSession((current) => ({
      ...current,
      savedMistakes: (current.savedMistakes ?? []).includes(latestMistake.id)
        ? (current.savedMistakes ?? []).filter((id) => id !== latestMistake.id)
        : [...(current.savedMistakes ?? []), latestMistake.id],
    }));
  };
  return (
    <div className="replay-page">
      <header className="replay-welcome">
        <div>
          <p className="studio-eyebrow">
            <Icon name="history" />
            Hành trình của em <span>· Thinking Replay</span>
          </p>
          <h1>Nhìn lại để lần sau tự tin hơn.</h1>
          <p>
            Mỗi lần thử đều có điều đáng nhớ. Cùng xem em đã tìm ra lời giải thế
            nào.
          </p>
        </div>
        {hasReplay ? (
          <span className="replay-welcome-symbol" aria-hidden="true">
            <Icon name="route" />
          </span>
        ) : (
          <Button className="replay-start-entry" onClick={navigateToPractice}>
            <Icon name="gesture" />
            Viết lời giải đầu tiên
            <Icon name="arrow_forward" />
          </Button>
        )}
      </header>
      {storageError && <Alert tone="warning">{storageError}</Alert>}
      <section className="studio-card replay-player">
        <div className="replay-summary">
          <div>
            <div className="studio-eyebrow">
              <span className="studio-chip">
                <Icon name="psychology" />
                {hasReplay ? "Bài vừa khám phá" : "Bài em sắp thử"}
              </span>
              <span className="studio-caption">{problem.course}</span>
              {stats.solved && (
                <span className="studio-chip studio-chip-success">
                  <Icon name="verified" />
                  {corrections ? "Tự sửa lỗi thành công" : "Đã giải đúng"}
                </span>
              )}
            </div>
            <h2>{problem.title}</h2>
          </div>
          <div className="replay-metrics">
            <div>
              <span>Khoảng thời gian phiên</span>
              <strong>{hasReplay ? formatElapsed(durationMs) : "—"}</strong>
            </div>
            <div>
              <span>Gợi ý đã mở</span>
              <strong>{hints.length} lần</strong>
            </div>
            <div>
              <span>Tự sửa lỗi</span>
              <strong>{corrections} lần</strong>
            </div>
            <div>
              <span>Lượt thử lại</span>
              <strong>{mistakes.length} lượt</strong>
            </div>
          </div>
        </div>
        <div className="replay-controls">
          <div className="replay-control-row">
            <Button
              size="icon"
              aria-label={playing ? "Tạm dừng" : "Phát lại"}
              disabled={!hasReplay || !durationMs}
              onClick={toggle}
            >
              <Icon name={playing ? "pause" : "play_arrow"} />
            </Button>
            <span className="replay-clock">
              {formatElapsed(playhead)}{" "}
              <span>/ {formatElapsed(durationMs)}</span>
            </span>
            <div
              className="replay-speeds"
              role="group"
              aria-label="Tốc độ phát lại"
            >
              {practicePolicy.replaySpeeds.map((value) => (
                <Button
                  key={value}
                  variant="ghost"
                  size="sm"
                  aria-pressed={speed === value}
                  onClick={() => setSpeed(value)}
                >
                  {Number.isInteger(value) ? value.toFixed(1) : String(value)}×
                </Button>
              ))}
            </div>
          </div>
          <Input
            type="range"
            aria-label="Vị trí phát lại"
            min="0"
            max={Math.max(1, durationMs)}
            step="1"
            value={playhead}
            disabled={!hasReplay}
            onChange={(event) => seek(Number(event.target.value))}
            className="replay-seek"
          />
          <div className="replay-time-markers">
            {markers.map((event) => (
              <Button
                key={event.id}
                variant="ghost"
                className="replay-marker"
                data-state={eventState(event)}
                onClick={() => seek(event.at - start)}
              >
                <i />
                <time>{formatElapsed(event.at - start)}</time>
                <span>{actionLabel(event)}</span>
              </Button>
            ))}
          </div>
          {!hasReplay && (
            <p className="studio-caption">
              Lịch sử sẽ xuất hiện sau lần kiểm tra đầu tiên trong Focus Studio.
            </p>
          )}
        </div>
      </section>
      {corrections > 0 && (
        <section className="replay-insight" aria-label="Điều em đã làm được">
          <span>
            <Icon name="auto_awesome" />
          </span>
          <div>
            <h2>Em đã tự tìm ra chỗ cần sửa.</h2>
            <p>
              {corrections} lần điều chỉnh thành công trong phiên này. Chính
              những lần dừng lại kiểm tra giúp em hiểu lời giải của mình hơn.
            </p>
          </div>
          <span className="studio-chip studio-chip-success">
            <Icon name="verified" />
            Tiến bộ từ lần thử
          </span>
        </section>
      )}
      <div className="replay-layout">
        <div className="replay-main">
          <div className="studio-card replay-section-title">
            <span className="studio-icon-tile">
              <Icon name="timeline" />
            </span>
            <div>
              <h2>Từng bước em đã đi qua</h2>
              <p>Tua về bất kỳ mốc nào để xem lại ý tưởng lúc đó.</p>
            </div>
            <span className="studio-chip">
              {Math.max(0, revealed.length - 1)} thao tác
            </span>
          </div>
          {!hasReplay ? (
            <section className="studio-card replay-empty">
              <span className="replay-empty-icon">
                <Icon name="history" />
              </span>
              <h2>Chưa có lần thử nào? Bắt đầu thôi.</h2>
              <p>
                Chọn một cách giải và thử viết ra. Sau lần kiểm tra đầu tiên, em
                sẽ có một hành trình của riêng mình ở đây.
              </p>
              <div className="replay-empty-steps">
                <span>
                  <i>1</i>Tự thử
                </span>
                <Icon name="arrow_forward" />
                <span>
                  <i>2</i>Kiểm tra
                </span>
                <Icon name="arrow_forward" />
                <span>
                  <i>3</i>Nhìn lại
                </span>
              </div>
              <Button onClick={navigateToPractice}>
                <Icon name="gesture" />
                Thử giải bài đầu tiên
              </Button>
            </section>
          ) : (
            <ol className="replay-timeline" aria-label="Các bước đã ghi nhận">
              {revealed.map((event) => (
                <li
                  key={event.id}
                  data-state={eventState(event)}
                  className="replay-event"
                >
                  <span className="replay-event-dot" />
                  <div className="replay-event-card">
                    <div className="studio-step-heading">
                      <div>
                        <time>{formatElapsed(event.at - start)}</time>
                        <span className="studio-chip">
                          {actionLabel(event)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Xem mốc ${formatElapsed(event.at - start)}`}
                        onClick={() => seek(event.at - start)}
                      >
                        <Icon name="play_arrow" />
                      </Button>
                    </div>
                    {event.input && <pre>{event.input}</pre>}
                    <div className="replay-event-message">
                      <Icon
                        name={
                          event.kind === "hint"
                            ? "question_answer"
                            : event.valid
                              ? "check_circle"
                              : event.valid === false
                                ? "lightbulb"
                                : "flag"
                        }
                      />
                      <div>
                        <RichMathText text={event.detail} />
                      </div>
                    </div>
                    {event.valid &&
                      mistakes.some((mistake) => mistake.at < event.at) && (
                        <p className="studio-guard">
                          <Icon name="military_tech" />
                          Em đã kiểm tra lại và tìm ra cách sửa
                        </p>
                      )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
        <aside className="replay-aside" aria-label="Nhìn lại và củng cố">
          <section className="studio-card">
            <div className="replay-section-title">
              <span className="studio-icon-tile">
                <Icon name="biotech" />
              </span>
              <div>
                <h2>Một điều đáng nhớ</h2>
                <p>Ghi lại để lần sau nhận ra sớm hơn</p>
              </div>
            </div>
            <div className="replay-dna">
              <div className="studio-section-head">
                <span className="studio-chip">
                  {latestMistake ? "Từ bài làm của em" : "Sẵn sàng khám phá"}
                </span>
                <span className="studio-caption">
                  {mistakes.length} lượt trong phiên
                </span>
              </div>
              <h3>
                {latestMistake
                  ? latestMistake.issue === "roots"
                    ? "Kiểm tra lại tập nghiệm"
                    : "Đối chiếu từng phép biến đổi"
                  : "Mỗi lần sửa là một lần hiểu sâu"}
              </h3>
              {latestMistake ? (
                <>
                  <p>{latestMistake.detail}</p>
                  <pre>{latestMistake.input}</pre>
                  <div className="replay-dna-note">
                    <Icon name="psychology" />
                    <div>
                      <strong>Câu hỏi để tự kiểm tra</strong>
                      <RichMathText
                        text={
                          problem.hints[Math.min(1, problem.hints.length - 1)]
                            .text
                        }
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p>
                  Chưa có phép tính sai được ghi nhận. Sau khi em thử bài, các
                  bước cần sửa sẽ xuất hiện ở đây.
                </p>
              )}
              <p className="studio-caption">
                Dựa trên các lượt kiểm tra trong bài này.
              </p>
            </div>
            {hasReplay && (
              <div className="replay-correction-row">
                <div>
                  <small>Điều chỉnh thành công</small>
                  <strong>{corrections} lần tự sửa lỗi</strong>
                </div>
                <Icon name={corrections ? "trending_up" : "timeline"} />
              </div>
            )}
          </section>
          <section className="studio-card replay-bridge">
            <p className="studio-eyebrow">
              <Icon name="auto_awesome" />
              Thử thêm một chút
            </p>
            <h2>Mang điều vừa hiểu vào lần thử mới</h2>
            <p>
              {latestMistake
                ? "Quay về lời giải, kiểm tra lại bước chưa khớp rồi thử một lần nữa. Bản nháp của em vẫn được giữ nguyên."
                : "Tự giải bài tập để khám phá cách lập luận của em. Có thể mở từng gợi ý khi cần."}
            </p>
            <div className="replay-bridge-task">
              <div>
                <Icon name="bolt" />
                <h3>
                  {problem.quadratic
                    ? "Kiểm tra tổng, tích và nghiệm"
                    : "Thế tọa độ, đối chiếu hệ số"}
                </h3>
              </div>
              <p>
                <RichMathText text={problem.setup} />
              </p>
              <div className="replay-bridge-actions">
                <Button onClick={navigateToPractice}>
                  <Icon name="play_arrow" />
                  {hasReplay ? "Tiếp tục tự giải" : "Bắt đầu tự giải"}
                </Button>
                <Button
                  variant="secondary"
                  disabled={!latestMistake}
                  aria-pressed={saved}
                  onClick={bookmarkMistake}
                >
                  <Icon name={saved ? "check" : "bookmark"} />
                  {saved ? "Đã lưu vào sổ tay" : "Lưu lỗi vào sổ tay"}
                </Button>
              </div>
            </div>
          </section>
          <section className="studio-card">
            <p className="studio-eyebrow">
              <Icon name="military_tech" />
              Những điều em đã làm
            </p>
            <h2>Tự thử, tự tìm ra</h2>
            <div className="replay-milestones">
              <div>
                <Icon name="verified_user" />
                <strong>{corrections} lần tự sửa</strong>
                <span>Kiểm tra đúng sau bước sai</span>
              </div>
              <div>
                <Icon name="lightbulb" />
                <strong>{hints.length} gợi ý</strong>
                <span>
                  {hints.length
                    ? "Chủ động tìm hướng đi"
                    : "Thử sức bằng lập luận riêng"}
                </span>
              </div>
            </div>
            <p className="studio-caption">
              <Icon name="shield" />
              {session.rewarded
                ? "Bài tập đã được nộp đúng và nhận thưởng."
                : "Hoàn thành và nộp bài đúng để ghi nhận kết quả."}
            </p>
          </section>
        </aside>
      </div>
      <section className="studio-card replay-snapshot">
        <div className="studio-section-head">
          <h2>
            <Icon name="gesture" />
            Lời giải của em lúc đó
          </h2>
          <span className="studio-caption">
            {currentEvent && hasReplay
              ? `Thời điểm ${formatElapsed(currentEvent.at - start)}`
              : "Chưa có mốc"}
          </span>
        </div>
        <div className="replay-snapshot-stage">
          <div className="replay-paper">
            <span className="studio-caption">Lời giải đã nhập</span>
            {currentInput ? (
              <pre>{currentInput}</pre>
            ) : (
              <p>
                Chọn một lần kiểm tra trên dòng thời gian để xem lại lời giải
                tại thời điểm đó.
              </p>
            )}
            {currentEvent?.valid !== undefined && (
              <span
                className={`studio-chip ${currentEvent.valid ? "studio-chip-success" : ""}`}
              >
                <Icon
                  name={currentEvent.valid ? "check_circle" : "lightbulb"}
                />
                {currentEvent.valid ? "Đối chiếu phù hợp" : "Cần xem lại"}
              </span>
            )}
          </div>
        </div>
      </section>
      {session.sketch?.some((stroke) => stroke.length > 0) && (
        <section className="studio-card replay-saved-sketch">
          <div className="studio-section-head">
            <h2>
              <Icon name="gesture" />
              Bản phác thảo đã lưu
            </h2>
            <span className="studio-caption">
              Bản nháp mới nhất từ Focus Studio
            </span>
          </div>
          <svg
            viewBox="0 0 800 300"
            preserveAspectRatio="none"
            role="img"
            aria-label="Bản phác thảo đã lưu trên thiết bị"
            className="replay-sketch"
          >
            <defs>
              <pattern
                id="replay-sketch-grid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1" fill="currentColor" opacity=".14" />
              </pattern>
            </defs>
            <rect width="800" height="300" fill="url(#replay-sketch-grid)" />
            {session.sketch
              .filter((stroke) => stroke.length > 0)
              .map((stroke, index) => (
                <polyline
                  key={index}
                  points={stroke
                    .map((point) => `${point.x},${point.y}`)
                    .join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
          </svg>
        </section>
      )}
    </div>
  );
}
