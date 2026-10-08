import { useState } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { storageKeys } from "../../config/storage";
import { routePath } from "../../config/routes";
import { Button, Icon } from "../../components/ui";
import { MathLatex } from "../../components/MathLatex";
import { practiceProblem } from "../practice/data";
import { studentProfile } from "../learning/data/student";
import {
  isPracticeSession,
  verifySampleAnswer,
  type PracticeSession,
} from "../practice/domain";
import { sampleAssessment, assessmentSummary } from "./data";

interface ThinkingReplayViewProps {
  onNavigate: (path: string) => void;
}

const speeds = [0.75, 1, 1.5, 2] as const;

export function ThinkingReplayView({ onNavigate }: ThinkingReplayViewProps) {
  const [session] = useLocalStorage<PracticeSession>(
    storageKeys.practiceSession,
    { input: practiceProblem.initialInput, openedHints: [1], rewarded: false },
    isPracticeSession,
  );
  const [speed, setSpeed] = useState<(typeof speeds)[number]>(1);
  const [playing, setPlaying] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(4);

  const check = verifySampleAnswer(session.input, practiceProblem.point);
  const assessment = assessmentSummary(sampleAssessment);
  const hintCount = session.openedHints.filter((id) => id !== 1).length;

  const events = [
    {
      time: "00:00",
      short: "Bắt đầu",
      title: "Đọc đề & nhận diện cấu trúc",
      state: "neutral",
      icon: "visibility",
      text: "Đọc đề, xác định dữ kiện điểm M và mục tiêu là tìm hệ số a của parabol.",
      note: "Tư duy ban đầu",
    },
    {
      time: "00:18",
      short: "Chọn phương pháp",
      title: "Lập kế hoạch biến đổi",
      state: "primary",
      icon: "route",
      text: "Thay tọa độ M(-2;12) vào y = ax² để biến bài hình học thành một phương trình theo a.",
      note: "Lập kế hoạch",
    },
    {
      time: "00:31",
      short: "Phát hiện sai",
      title: "Misconception detected",
      state: "warning",
      icon: "warning",
      text: "Bẫy nhận thức: dễ quên bình phương số âm hoặc dừng ở 12 = 4a mà chưa cô lập a.",
      note: "Cạm bẫy dấu & kết luận",
    },
    {
      time: "00:44",
      short: "AI gợi mở",
      title: "Gợi ý từ AI Socratic",
      state: "ai",
      icon: "auto_awesome",
      text: "“Em hãy kiểm tra lại (-2)² bằng bao nhiêu? Sau đó muốn cô lập a thì cần làm gì ở cả hai vế?”",
      note: "Đặt câu hỏi gợi mở",
    },
    {
      time: "01:02",
      short: "Tự sửa lỗi",
      title: "Aha! Moment & Self-correction",
      state: "success",
      icon: "verified",
      text: check.valid
        ? "Em đã tự hoàn thiện phép chia và viết rõ a = 3. Tutor ghi nhận self-correction mastery."
        : "Trace cho thấy em đang rất gần kết luận: từ 12 = 4a, chia hai vế cho 4 để viết rõ a = 3.",
      note: "Tự phát hiện & sửa sai",
    },
    {
      time: "01:35",
      short: "Hoàn thành",
      title: "Khép vòng reasoning",
      state: "done",
      icon: "flag",
      text: "Kiểm tra a = 3 ≠ 0, kết luận y = 3x² và đọc đúng chiều mở của đồ thị.",
      note: "Kết luận",
    },
  ] as const;

  const progress = [0, 20, 36, 50, 72, 100][selectedEvent] ?? 72;

  return (
    <div className="learning-os-page replay-v3">
      <section className="replay-hero-v3">
        <div>
          <p className="premium-eyebrow"><Icon name="history" /> Thinking Replay Engine</p>
          <h1>Thinking Replay</h1>
          <p>Xem lại toàn bộ quá trình tư duy, hiểu mình đã nghĩ gì, sai ở đâu và tiến bộ như thế nào.</p>
        </div>
        <div className="replay-hero-v3__art">
          <span className="scenic-handnote">Mỗi lỗi sai là một bước tiến gần hơn tới tư duy vững vàng ↗</span>
          <blockquote>Hiểu lại hành trình tư duy là cách học hiệu quả nhất.</blockquote>
        </div>
      </section>

      <section className="replay-summary-v3">
        <div className="replay-problem-v3">
          <span className="replay-problem-v3__icon"><Icon name="directions_run" /></span>
          <div>
            <small>Bài toán</small>
            <strong>{practiceProblem.title}</strong>
            <span className="text-lg text-brand"><MathLatex formula="y=ax^2, M(-2;12)" /></span>
          </div>
        </div>
        <span className="premium-status premium-status--success">✓ Hoàn thành đúng</span>
        <div className="replay-summary-stat"><Icon name="timer" /><strong>01:35</strong><span>Tổng thời gian</span></div>
        <div className="replay-summary-stat"><Icon name="tips_and_updates" /><strong>{Math.max(1, hintCount)}</strong><span>AI gợi ý</span></div>
        <div className="replay-summary-stat"><Icon name="psychology" /><strong>92%</strong><span>Tự lực giải</span></div>
        <div className="replay-summary-stat"><Icon name="genetics" /><strong>1</strong><span>Lỗi sai chính</span></div>
      </section>

      <section className="replay-player-v3">
        <div className="replay-player-v3__top">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              onClick={() => setPlaying((value) => !value)}
              aria-label={playing ? "Tạm dừng replay" : "Phát replay"}
              className="replay-play-button"
            >
              <Icon name={playing ? "pause" : "play_arrow"} />
            </Button>
            <strong>{events[selectedEvent]?.time ?? "01:02"} / 01:35</strong>
          </div>
          <div className="replay-speed" role="group" aria-label="Tốc độ phát">
            {speeds.map((value) => (
              <Button
                variant="ghost"
                size="sm"
                key={value}
                aria-pressed={speed === value}
                onClick={() => setSpeed(value)}
              >
                {value}x
              </Button>
            ))}
          </div>
        </div>
        <div className="replay-track">
          <div className="replay-track__fill" style={{ width: `${progress}%` }} />
          {events.map((event, index) => (
            <Button
              variant="surface"
              key={event.time}
              className="replay-marker"
              data-state={event.state}
              data-selected={selectedEvent === index}
              style={{ left: `${[0,20,36,50,72,100][index]}%` }}
              onClick={() => setSelectedEvent(index)}
            >
              <i />
              <time>{event.time}</time>
              <span>{event.short}</span>
            </Button>
          ))}
        </div>
      </section>

      <div className="replay-layout-v3">
        <main className="replay-thoughts-v3">
          <div className="premium-section-heading">
            <div>
              <p className="premium-eyebrow"><Icon name="route" /> Dòng suy nghĩ chi tiết</p>
              <h2>Đường suy nghĩ thực tế</h2>
              <p>Từng bước tư duy được ghi lại nguyên bản theo thời gian giải.</p>
            </div>
            <span className="premium-status">6 bước chuyển hóa</span>
          </div>

          <div className="thought-timeline-v3">
            {events.map((event, index) => (
              <article
                key={event.time}
                className="thought-event-v3"
                data-state={event.state}
                data-selected={selectedEvent === index}
                onClick={() => setSelectedEvent(index)}
              >
                <div className="thought-event-v3__time">
                  <time>{event.time}</time>
                  <strong>{event.short}</strong>
                </div>
                <span className="thought-event-v3__dot"><Icon name={event.icon} /></span>
                <div className="thought-event-v3__card">
                  <div className="flex items-center justify-between gap-3">
                    <strong>{event.title}</strong>
                    <span>{event.note}</span>
                  </div>
                  <p>{event.text}</p>
                  {index === 2 && (
                    <div className="mistake-equation-v3">
                      <MathLatex formula="(-2)^2 = -4quad 	ext{(sai)}" />
                      <span>→ Bình phương số âm luôn không âm.</span>
                    </div>
                  )}
                  {index === 4 && (
                    <div className="self-correction-v3">
                      <MathLatex formula="12=4aRightarrow a=3" />
                      <span><Icon name="verified" /> Tự phát hiện & sửa sai</span>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </main>

        <aside className="replay-insights-v3">
          <section className="premium-card mistake-dna-v3">
            <div className="premium-card__heading">
              <div>
                <p className="premium-eyebrow"><Icon name="genetics" /> Mistake DNA · AI Genome</p>
                <h2>Nhầm dấu & thiếu kết luận</h2>
              </div>
              <span className="premium-status premium-status--warning">Đã xuất hiện 1 lần</span>
            </div>
            <div className="dna-impact-v3">
              <span>Mức độ ảnh hưởng</span>
              <strong>Trung bình</strong>
              <div><i style={{ width: "62%" }} /></div>
            </div>
            <p>
              Pattern thường gặp là xử lý đúng dữ kiện nhưng bỏ sót kiểm tra dấu hoặc chưa
              viết kết luận cuối. Hãy kiểm tra cả phép biến đổi lẫn điều kiện của tham số.
            </p>
            <div className="dna-examples-v3">
              <strong>Mẹo ghi nhớ</strong>
              <p>“Thay dữ kiện → biến đổi từng bước → cô lập ẩn → kiểm tra điều kiện → kết luận.”</p>
            </div>
          </section>

          <section className="premium-card dynamic-bridge-v3">
            <div className="premium-card__heading">
              <div>
                <p className="premium-eyebrow"><Icon name="link" /> Dynamic Bridge</p>
                <h2>Cầu nối kiến thức cho bạn</h2>
              </div>
              <span className="premium-status premium-status--success">AI Gen</span>
            </div>
            <p>Luyện một micro-task 5 phút để củng cố đúng pattern vừa xuất hiện.</p>
            <div className="bridge-task-v3">
              <Icon name="bolt" />
              <div>
                <strong>Tìm hệ số từ điểm thuộc Parabol</strong>
                <span>4 bài nhanh · ~5 phút</span>
              </div>
            </div>
            <Button className="w-full" onClick={() => onNavigate(routePath("tu-giai"))}>
              Vào cầu nối 5 phút ngay <Icon name="arrow_forward" />
            </Button>
          </section>

          <section className="premium-card cognitive-badges-v3">
            <div className="premium-card__heading">
              <div>
                <p className="premium-eyebrow"><Icon name="workspace_premium" /> Dấu hiệu tư duy được ghi nhận</p>
                <h2>+60 XP Metacognition</h2>
              </div>
            </div>
            <div className="cognitive-badge-grid">
              <div><Icon name="autorenew" /><strong>Tự sửa lỗi ×18</strong><span>Xuất sắc</span></div>
              <div><Icon name="psychology" /><strong>Kiên trì suy nghĩ</strong><span>Tốt</span></div>
              <div><Icon name="tips_and_updates" /><strong>Tiếp nhận gợi ý</strong><span>Chủ động</span></div>
              <div><Icon name="shield" /><strong>Kiểm tra lại</strong><span>Cẩn thận</span></div>
            </div>
            <blockquote>“Sai không đáng sợ. Quan trọng là em đã dừng lại, suy nghĩ và tự tìm ra đáp án đúng.” — AI Coach</blockquote>
          </section>
        </aside>
      </div>

      <section className="stroke-replay-v3">
        <div className="premium-section-heading">
          <div>
            <p className="premium-eyebrow"><Icon name="draw" /> Ảnh chụp vết bút nháp</p>
            <h2>Stroke Replay</h2>
            <p>Xem lại cách bài làm thay đổi qua từng mốc thời gian.</p>
          </div>
          <Button variant="secondary"><Icon name="play_arrow" /> Phát lại vết bút</Button>
        </div>

        <div className="stroke-replay-grid">
          <article>
            <span>1. Nháp ban đầu · 00:20</span>
            <MathLatex formula="12=a(-2)^2" />
          </article>
          <Icon name="arrow_forward" />
          <article data-state="error">
            <span>2. Phát hiện sai · 00:31</span>
            <MathLatex formula="(-2)^2=-4" />
            <em>Không đúng!</em>
          </article>
          <Icon name="arrow_forward" />
          <article>
            <span>3. Suy nghĩ lại · 00:50</span>
            <MathLatex formula="(-2)^2=4Rightarrow 12=4a" />
          </article>
          <Icon name="arrow_forward" />
          <article data-state="success">
            <span>4. Lời giải đúng · 01:02</span>
            <MathLatex formula="a=3,quad y=3x^2" />
            <em>✓ Chuẩn xác</em>
          </article>
        </div>
      </section>

      <span className="sr-only">
        Điểm có thể phục hồi {assessment.recoverablePoints}. Hồ sơ của {studentProfile.name}.
      </span>
    </div>
  );
}
