import { useState } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { storageKeys } from "../../config/storage";
import { routePath } from "../../config/routes";
import { Button, Icon } from "../../components/ui";
import { practiceProblem } from "../practice/data";
import { studentProfile } from "../learning/data/student";
import {
  isPracticeSession,
  verifySampleAnswer,
  type PracticeSession,
} from "../practice/domain";

interface ThinkingReplayViewProps {
  onNavigate: (path: string) => void;
}

export function ThinkingReplayView({ onNavigate }: ThinkingReplayViewProps) {
  const [session] = useLocalStorage<PracticeSession>(
    storageKeys.practiceSession,
    { input: practiceProblem.initialInput, openedHints: [1], rewarded: false },
    isPracticeSession,
  );
  const [speed, setSpeed] = useState("1.0x");
  const [playing, setPlaying] = useState(false);
  const check = verifySampleAnswer(session.input, practiceProblem.point);
  const hintCount = session.openedHints.filter((id) => id !== 1).length;

  const events = [
    { time: "00:00", label: "Bắt đầu", text: "Đọc đề và xác định đây là bài toán cần lập mô hình từ dữ kiện.", state: "neutral", icon: "flag" },
    { time: "00:18", label: "Chọn phương pháp", text: "Chọn chiến lược biến đổi và kiểm tra các hệ số trước khi kết luận.", state: "active", icon: "route" },
    { time: "00:31", label: "Phát hiện sai", text: "Reasoning chưa nhất quán: dấu và điều kiện chưa khớp dữ kiện ban đầu.", state: "danger", icon: "warning" },
    { time: "00:44", label: "AI gợi mở", text: "AI hỏi lại điều kiện thay vì đưa đáp án: “Em có thể kiểm tra tổng và tích một lần nữa không?”", state: "ai", icon: "auto_awesome" },
    { time: "01:02", label: "Tự sửa lỗi", text: "Bạn quay lại bước sai, tự kiểm tra và sửa reasoning mà không cần đáp án trực tiếp.", state: "success", icon: "verified" },
    { time: "01:35", label: "Hoàn thành", text: check.valid ? "Lời giải đã ổn định và được kiểm tra lại." : "Session kết thúc với một bridge cần ôn lại.", state: "neutral", icon: "sports_score" },
  ];

  return (
    <div className="learning-os-page ai-v3-page">
      <section className="ai-v3-page-banner ai-v3-page-banner--replay">
        <div>
          <p className="ai-v3-eyebrow">Thinking Replay Engine</p>
          <h1>Thinking Replay</h1>
          <p>Xem lại toàn bộ quá trình tư duy, hiểu mình đã nghĩ gì, sai ở đâu và tiến bộ như thế nào.</p>
        </div>
        <img src="/learning-media/learning-horizon.svg" alt="" />
      </section>

      <section className="ai-v3-card ai-v3-replay-summary">
        <div className="min-w-0">
          <p className="ai-v3-eyebrow">Bài toán · {practiceProblem.course}</p>
          <h2 className="ai-v3-section-title">{practiceProblem.title}</h2>
        </div>
        <div className="ai-v3-replay-metrics">
          <div><Icon name="timer" /><strong>01:35</strong><small>Tổng thời gian</small></div>
          <div><Icon name="lightbulb" /><strong>{Math.max(1, hintCount)}</strong><small>AI gợi ý</small></div>
          <div><Icon name="verified" /><strong>92%</strong><small>Tự lực giải</small></div>
          <div><Icon name="psychology" /><strong>1</strong><small>Lỗi sai chính</small></div>
        </div>
      </section>

      <section className="ai-v3-replay-player">
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            aria-label={playing ? "Tạm dừng replay" : "Phát replay"}
            onClick={() => setPlaying((value) => !value)}
            className="ai-v3-play-button"
          >
            <Icon name={playing ? "pause" : "play_arrow"} />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-xs text-ink-500">
              <span>01:02 / 01:35</span>
              <div className="flex gap-1">
                {["0.75x","1.0x","1.5x","2.0x"].map((item) => (
                  <Button key={item} variant="ghost" size="sm" aria-pressed={speed === item} className={speed === item ? "ai-v3-speed is-active" : "ai-v3-speed"} onClick={() => setSpeed(item)}>{item}</Button>
                ))}
              </div>
            </div>
            <div className="ai-v3-replay-track">
              <span className="ai-v3-replay-track__fill" />
              {events.map((event, index) => (
                <i key={event.time} data-state={event.state} style={{ left: `${(index / (events.length - 1)) * 100}%` }} />
              ))}
            </div>
            <div className="ai-v3-replay-labels">
              {events.map((event) => <span key={event.time}><b>{event.time}</b><small>{event.label}</small></span>)}
            </div>
          </div>
        </div>
      </section>

      <div className="ai-v3-replay-layout">
        <main className="ai-v3-card">
          <div className="ai-v3-card__head">
            <div><p className="ai-v3-eyebrow"><Icon name="timeline" /> Dòng suy nghĩ chi tiết</p><h2 className="ai-v3-section-title">Hành trình tư duy của bạn</h2></div>
            <span className="ai-v3-status ai-v3-status--success">Tự sửa lỗi thành công</span>
          </div>

          <div className="ai-v3-thought-log">
            {events.map((event) => (
              <article key={event.time} className="ai-v3-thought-event" data-state={event.state}>
                <div className="ai-v3-thought-event__rail"><i /><time>{event.time}</time></div>
                <div className="ai-v3-thought-event__card">
                  <div className="flex items-center justify-between gap-3">
                    <strong><Icon name={event.icon} />{event.label}</strong>
                    <span className="text-xs text-ink-500">{event.state === "danger" ? "Misconception detected" : event.state === "success" ? "Self-correction" : "Reasoning event"}</span>
                  </div>
                  <p>{event.text}</p>
                  {event.state === "danger" && <div className="ai-v3-thought-code">Nháp: (x − 1)(x − 6) = 0 → tổng không khớp</div>}
                  {event.state === "ai" && <blockquote>“Em hãy kiểm tra lại điều kiện thay vì tiếp tục tính. Cặp số em chọn có thỏa đồng thời cả hai yêu cầu không?”</blockquote>}
                  {event.state === "success" && <div className="ai-v3-thought-code is-success">Viết lại: (x − 2)(x − 3) = 0 → x = 2 hoặc x = 3</div>}
                </div>
              </article>
            ))}
          </div>
        </main>

        <aside className="space-y-4">
          <section className="ai-v3-card ai-v3-dna-panel">
            <div className="ai-v3-card__head">
              <div><p className="ai-v3-eyebrow">Mistake DNA · v3.2</p><h2 className="ai-v3-section-title">Nhầm tổng trong phân tích nhân tử</h2></div>
              <span className="ai-v3-status ai-v3-status--warning">Đã xuất hiện 1 lần</span>
            </div>
            <div className="ai-v3-dna-impact"><span>Mức độ ảnh hưởng</span><strong>Trung bình</strong><i /></div>
            <p className="mt-4 text-sm leading-6 text-ink-600">Bạn thường tìm đúng cặp số có tích phù hợp nhưng dễ bỏ qua điều kiện về tổng. Hãy luôn kiểm tra cả hai trước khi kết luận.</p>
            <div className="ai-v3-tip">
              <Icon name="lightbulb" />
              <span><b>Mẹo ghi nhớ</b><small>Với x² + bx + c = 0, hai số cần tìm phải có tổng bằng b và tích bằng c.</small></span>
            </div>
          </section>

          <section className="ai-v3-card">
            <p className="ai-v3-eyebrow"><Icon name="link" /> Dynamic Bridge</p>
            <h2 className="ai-v3-section-title">Cầu nối kiến thức cho bạn</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">Luyện thêm một micro-task tương tự để củng cố tư duy và tránh lặp lại lỗi sai.</p>
            <div className="mt-4 rounded-2xl bg-surface-page p-4">
              <b>Bài tập: Phân tích nhân tử</b>
              <p className="mt-2 text-sm text-ink-600">Tìm hai số có tổng −7 và tích 12. Viết phương trình tương ứng và tìm nghiệm.</p>
              <div className="mt-3 flex items-center justify-between"><small>~ 5 phút</small><Button size="sm" onClick={() => onNavigate(routePath("tu-giai"))}>Bắt đầu luyện tập</Button></div>
            </div>
          </section>

          <section className="ai-v3-card">
            <div className="ai-v3-card__head"><div><p className="ai-v3-eyebrow">Dấu hiệu tư duy được ghi nhận</p><h2 className="ai-v3-section-title">+60 XP</h2></div></div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["verified","Tự sửa lỗi","Xuất sắc!"],
                ["psychology","Kiên trì suy nghĩ","Tốt"],
                ["auto_awesome","Tiếp nhận gợi ý","Chủ động"],
                ["fact_check","Kiểm tra lại","Cẩn thận"],
              ].map(([icon,label,note]) => (
                <div key={label} className="ai-v3-signal-badge"><Icon name={icon} /><span><b>{label}</b><small>{note}</small></span></div>
              ))}
            </div>
          </section>

          <section className="ai-v3-card ai-v3-profile-mini">
            <img src={studentProfile.avatarUrl} alt={studentProfile.name} referrerPolicy="no-referrer" />
            <div><strong>{studentProfile.name}</strong><small>{studentProfile.levelLabel}</small></div>
            <div className="ml-auto text-right"><b>92%</b><small>Tự sửa lỗi</small></div>
          </section>
        </aside>
      </div>

      <section className="ai-v3-card">
        <div className="ai-v3-card__head">
          <div><p className="ai-v3-eyebrow"><Icon name="gesture" /> Ảnh chụp vết bút nháp</p><h2 className="ai-v3-section-title">Stroke Replay</h2></div>
          <Button variant="secondary"><Icon name="play_arrow" />Phát lại vết bút</Button>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ["1. Nháp ban đầu","x² − 5x + 6 = 0\n(x − 1)(x − 6) = 0"],
            ["2. Phát hiện sai","(x − 1)(x − 6) = 0\n−1 + (−6) = −7"],
            ["3. Suy nghĩ lại","Tích = 6 : (1,6) (2,3)\nTổng = −5"],
            ["4. Lời giải đúng","(x − 2)(x − 3) = 0\nx = 2 hoặc x = 3"],
          ].map(([title,text], index) => (
            <div key={title} className="ai-v3-stroke-card" data-state={index === 1 ? "danger" : index === 3 ? "success" : "neutral"}>
              <b>{title}</b><pre>{text}</pre>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
