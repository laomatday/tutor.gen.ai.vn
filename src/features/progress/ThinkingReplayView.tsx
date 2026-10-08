import { useLocalStorage } from "../../hooks/useLocalStorage";
import { storageKeys } from "../../config/storage";
import { routePath } from "../../config/routes";
import { Button, Icon } from "../../components/ui";
import { practiceProblem } from "../practice/data";
import {
  isPracticeSession,
  verifySampleAnswer,
  type PracticeSession,
} from "../practice/domain";
import { sampleAssessment, assessmentSummary } from "./data";

interface ThinkingReplayViewProps {
  onNavigate: (path: string) => void;
}

export function ThinkingReplayView({ onNavigate }: ThinkingReplayViewProps) {
  const [session] = useLocalStorage<PracticeSession>(
    storageKeys.practiceSession,
    { input: practiceProblem.initialInput, openedHints: [1], rewarded: false },
    isPracticeSession,
  );
  const check = verifySampleAnswer(session.input, practiceProblem.point);
  const assessment = assessmentSummary(sampleAssessment);
  const hintCount = session.openedHints.filter((id) => id !== 1).length;

  const timeline = [
    {
      time: "00:00",
      title: "Đọc đề & nhận diện cấu trúc",
      text: practiceProblem.title,
      icon: "visibility",
    },
    {
      time: "00:24",
      title: "Chọn chiến lược",
      text: "Thay tọa độ điểm vào y = ax² để cô lập hệ số a.",
      icon: "route",
    },
    {
      time: "00:52",
      title: hintCount ? "AI intervention" : "Tự tiếp tục",
      text: hintCount
        ? `Bạn đã mở ${hintCount} gợi ý. Tutor ghi nhận điểm cần hỗ trợ thay vì chỉ trừ điểm.`
        : "Bạn chưa cần mở thêm gợi ý — tín hiệu tự chủ đang tốt.",
      icon: "auto_awesome",
    },
    {
      time: "01:18",
      title: check.valid ? "Tự sửa & hoàn tất" : "Misconception detected",
      text: check.message,
      icon: check.valid ? "verified" : "warning",
    },
  ];

  const dna = [
    { label: "Biến đổi đại số", value: 78 },
    { label: "Kiểm tra điều kiện", value: 54 },
    { label: "Đọc dữ kiện", value: 86 },
    { label: "Tự sửa lỗi", value: check.valid ? 88 : 62 },
  ];

  return (
    <div className="learning-os-page">
      <header>
        <p className="signal-label">
          <Icon name="replay" />
          Thinking Replay
        </p>
        <h1 className="mt-3 max-w-4xl text-4xl font-extrabold tracking-[-0.04em] text-brand sm:text-5xl">
          Đừng chỉ xem đáp án. Hãy xem lại cách bạn đã nghĩ.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-600">
          Replay biến mỗi lần làm bài thành dữ liệu học tập: lúc nào bạn đổi
          chiến lược, mở gợi ý, mắc lỗi và tự sửa. Đây là nền để Tutor điều chỉnh
          mission tiếp theo.
        </p>
      </header>

      <section className="replay-hero">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white">
              {practiceProblem.course}
            </span>
            <span className="rounded-full bg-surface-page px-3 py-1.5 text-xs font-semibold text-ink-600">
              {practiceProblem.topic}
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-brand">
            {practiceProblem.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            Trạng thái hiện tại:{" "}
            <strong className={check.valid ? "text-success-700" : "text-warning-700"}>
              {check.valid ? "Reasoning hợp lệ" : "Còn bước cần xem lại"}
            </strong>
          </p>

          <div className="mt-7">
            {timeline.map((item) => (
              <div key={item.time} className="trace-item">
                <span className="trace-dot" />
                <span className="trace-time">{item.time}</span>
                <div>
                  <p className="flex items-center gap-2 font-bold text-brand">
                    <Icon name={item.icon} />
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-ink-600">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-3xl bg-surface-page p-5">
          <p className="signal-label">
            <Icon name="psychology" />
            Session signal
          </p>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-ink-500">Gợi ý đã dùng</p>
              <p className="mt-1 text-3xl font-extrabold text-brand">{hintCount}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-500">Điểm có thể lấy lại</p>
              <p className="mt-1 text-3xl font-extrabold text-brand">
                {assessment.recoverablePoints}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-500">Mistake cluster</p>
              <p className="mt-1 text-sm font-bold text-warning-800">
                {sampleAssessment.errors[0]?.category ?? "Chưa có"}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
        <section className="signal-card">
          <p className="signal-label">
            <Icon name="bar_chart" />
            Mistake DNA
          </p>
          <h2 className="mt-3 text-xl font-bold text-brand">
            Hồ sơ lỗi sai cá nhân
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            Tutor theo dõi pattern, không chỉ câu sai. Các thanh thấp là nơi AI
            sẽ tạo bridge ngắn trước mission kế tiếp.
          </p>
          <div className="mt-6 space-y-5">
            {dna.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink-700">{item.label}</span>
                  <strong className="text-brand">{item.value}%</strong>
                </div>
                <div className="dna-bar">
                  <span style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="signal-card signal-card--accent">
          <p className="signal-label">
            <Icon name="auto_awesome" />
            Next intervention
          </p>
          <h2 className="mt-3 text-xl font-bold text-brand">
            Ôn đúng một điểm, rồi quay lại bài.
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            Thay vì giao thêm một bộ bài tập dài, Tutor đề xuất một bridge ngắn
            tập trung vào bước biến đổi và kiểm tra điều kiện.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => onNavigate(routePath("tu-giai"))}>
              Quay lại Studio
              <Icon name="arrow_forward" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => onNavigate(routePath("hoc-bai"))}
            >
              Mở Knowledge Map
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
