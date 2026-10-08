import React from "react";
import { Button, Icon, Progress } from "../../components/ui";
import { routePath } from "../../config/routes";
import { useCurriculum } from "../../context/CurriculumContext";
import {
  lessonHref,
  studentProfile,
  primaryEnrollment,
  courseHref,
  subjectFor,
  ownedPublishedLessons,
} from "../curriculum";
import { sampleAssessment, assessmentSummary } from "../progress/data";
import { initialBadges } from "../gamification/badges";

interface TodayViewProps {
  onNavigate: (tab: string) => void;
  onOpenBadges?: () => void;
  gpBalance: number;
  dailyGp: number;
  onEarnGp: (amount: number, reason: string) => void;
}

const Radar = ({ progress }: { progress: number }) => {
  const pts = [
    [50, 10],
    [87, 36],
    [73, 82],
    [27, 82],
    [13, 36],
  ];
  const scale = (value: number) => 0.42 + value / 220;
  const values = [88, 76, 92, Math.max(64, progress), 81];
  const polygon = values
    .map((value, index) => {
      const [x, y] = pts[index];
      const s = scale(value);
      return `${50 + (x - 50) * s},${50 + (y - 50) * s}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" className="h-56 w-full" aria-label="Cognitive profile">
      {[0.34, 0.55, 0.76, 1].map((s) => (
        <polygon
          key={s}
          points={pts.map(([x, y]) => `${50 + (x - 50) * s},${50 + (y - 50) * s}`).join(" ")}
          fill="none"
          stroke="var(--color-ink-200)"
          strokeWidth="0.8"
        />
      ))}
      {pts.map(([x, y], i) => (
        <line key={i} x1="50" y1="50" x2={x} y2={y} stroke="var(--color-ink-100)" strokeWidth="0.8" />
      ))}
      <polygon points={polygon} fill="color-mix(in oklab, var(--color-brand) 18%, transparent)" stroke="var(--color-brand)" strokeWidth="2" />
      {polygon.split(" ").map((p) => {
        const [x, y] = p.split(",");
        return <circle key={p} cx={x} cy={y} r="2.5" fill="var(--color-brand)" />;
      })}
    </svg>
  );
};

export const TodayView: React.FC<TodayViewProps> = ({
  onNavigate,
  onOpenBadges,
  gpBalance,
  dailyGp,
}) => {
  const { lessons, topics, completedLessonIds, storageError } = useCurriculum();
  const enrollment = primaryEnrollment;
  const subject = subjectFor(enrollment.subjectId)!;
  const courseLessons = ownedPublishedLessons(lessons, topics)
    .filter((lesson) => lesson.gradeId === enrollment.gradeId && lesson.subjectId === enrollment.subjectId)
    .sort((a, b) => a.order - b.order);
  const completed = courseLessons.filter((lesson) => completedLessonIds.includes(lesson.id));
  const nextLesson = courseLessons.find((lesson) => !completedLessonIds.includes(lesson.id)) ?? courseLessons[0];
  const progress = courseLessons.length ? Math.round((completed.length / courseLessons.length) * 100) : 0;
  const nextTopic = topics.find((topic) => topic.id === nextLesson?.topicId);
  const assessment = assessmentSummary(sampleAssessment);
  const unlocked = initialBadges.filter((badge) => badge.unlocked).length;
  const firstName = studentProfile.name.split(" ").at(-1);
  const missionPath = nextLesson ? lessonHref(nextLesson) : courseHref(enrollment.gradeId, enrollment.subjectId);

  const pulseMetrics = [
    { icon: "headphones", label: "Tập trung", value: "82%", delta: "+12%" },
    { icon: "shield", label: "Hiểu sâu", value: "78%", delta: "+8%" },
    { icon: "verified", label: "Tự sửa lỗi", value: "92%", delta: "+15%" },
    { icon: "psychology", label: "Sẵn sàng thi", value: "8.5+", delta: "AI" },
  ];

  return (
    <div className="learning-os-page ai-v3-page">
      {storageError && <div role="alert" className="rounded-2xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800">{storageError}</div>}

      <section className="ai-v3-hero">
        <div className="ai-v3-hero__copy">
          <p className="ai-v3-eyebrow">AI Pulse · Cognitive Rhythm</p>
          <h1>Chào {firstName}! <span aria-hidden="true">👋</span></h1>
          <p className="ai-v3-hero__lead">Hôm nay là một ngày tuyệt vời để tiến bộ.</p>
          <p className="ai-v3-hero__quote">“Tri thức không đến từ việc nhớ, mà từ việc tư duy đúng cách.”</p>
        </div>
        <img src="/learning-media/learning-horizon.svg" alt="" className="ai-v3-hero__art" />
      </section>

      <div className="ai-v3-dashboard-grid">
        <div className="space-y-5">
          <section className="ai-v3-card">
            <div className="ai-v3-card__head">
              <div>
                <p className="ai-v3-eyebrow"><Icon name="auto_awesome" /> AI Cognitive Pulse</p>
                <h2 className="ai-v3-section-title">Nhịp tư duy hôm nay đang ổn định.</h2>
                <p className="ai-v3-section-copy">Dựa trên 18/18 lượt học gần đây.</p>
              </div>
              <span className="ai-v3-status ai-v3-status--success">Đang ổn định</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {pulseMetrics.map((item) => (
                <div key={item.label} className="ai-v3-metric">
                  <span className="ai-v3-metric__icon"><Icon name={item.icon} /></span>
                  <div>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                    <small>↑ {item.delta}</small>
                  </div>
                </div>
              ))}
            </div>
            <div className="ai-v3-coach-note">
              <span className="ai-v3-coach-note__bot"><Icon name="smart_toy" /></span>
              <p>Em đang duy trì phong độ rất tốt, đặc biệt ở kỹ năng phân tích. Hãy tiếp tục với phần <strong>{nextTopic?.title ?? subject.name}</strong> để củng cố toàn diện hơn nhé.</p>
            </div>
          </section>

          <section className="ai-v3-mission-card">
            <div className="ai-v3-mission-card__content">
              <div className="flex flex-wrap gap-2">
                <span className="ai-v3-pill ai-v3-pill--light"><Icon name="target" /> Nhiệm vụ hôm nay</span>
                <span className="ai-v3-pill ai-v3-pill--light">Focus {nextLesson?.durationMinutes ?? 22} phút</span>
              </div>
              <h2>{nextLesson?.title ?? "Giải phương trình bậc hai và biện luận"}</h2>
              <p>{nextLesson?.summary ?? "Vận dụng phương pháp tách hạng tử và kiểm tra điều kiện nghiệm."}</p>
              <div className="ai-v3-mission-meta">
                <span><Icon name="schedule" /> {nextLesson?.durationMinutes ?? 22} phút</span>
                <span><Icon name="quiz" /> {nextLesson?.exercises.length ?? 4} câu hỏi</span>
                <span><Icon name="bolt" /> Cấp độ: Vận dụng</span>
              </div>
              <Button variant="surface" className="ai-v3-mission-cta" onClick={() => onNavigate(missionPath)}>
                <Icon name="play_arrow" /> Bắt đầu ngay
              </Button>
            </div>
            <div className="ai-v3-problem-preview">
              <div className="flex items-center justify-between gap-3">
                <strong>Xem trước bài toán</strong>
                <Button variant="ghost" size="sm" onClick={() => onNavigate(routePath("tu-giai"))}>Mở Focus Studio <Icon name="arrow_forward" /></Button>
              </div>
              <p className="mt-4 text-sm text-ink-600">Giải phương trình:</p>
              <div className="mt-2 rounded-2xl bg-white px-4 py-3 font-mono text-lg font-bold text-brand">x² − 5x + 6 = 0</div>
              <svg viewBox="0 0 260 120" className="mt-4 w-full" aria-label="Parabol minh họa">
                <line x1="20" y1="96" x2="240" y2="96" stroke="var(--color-ink-300)" />
                <line x1="60" y1="15" x2="60" y2="110" stroke="var(--color-ink-300)" />
                <path d="M78 28 C110 100, 145 100, 205 28" fill="none" stroke="var(--color-brand)" strokeWidth="4" />
                <circle cx="125" cy="96" r="4" fill="var(--color-accent)" />
                <circle cx="165" cy="96" r="4" fill="var(--color-accent)" />
              </svg>
            </div>
          </section>

          <section className="ai-v3-card">
            <div className="ai-v3-card__head">
              <div>
                <p className="ai-v3-eyebrow"><Icon name="workspace_premium" /> Hồ sơ năng lực của bạn</p>
                <h2 className="ai-v3-section-title">{studentProfile.name}</h2>
                <p className="ai-v3-section-copy">Tuyển sinh 10 · {studentProfile.levelLabel}</p>
              </div>
              {onOpenBadges && <Button variant="secondary" onClick={onOpenBadges}>Xem chi tiết</Button>}
            </div>
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="ai-v3-profile-card">
                <img src={studentProfile.avatarUrl} alt={studentProfile.name} referrerPolicy="no-referrer" />
                <div>
                  <span className="ai-v3-level-badge">{studentProfile.levelLabel}</span>
                  <p>“Kiên trì hôm nay, phiên bản mạnh mẽ hơn của mình ngày mai.”</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["92%", "Tự sửa lỗi", "+12% so với tháng trước", "verified"],
                  ["8.5 / 10", "Chất lượng lập luận", "Được AI đánh giá", "psychology"],
                  ["14 ngày", "Chuỗi học tập", "Kỷ lục: 21 ngày", "local_fire_department"],
                  ["128 giờ", "Tổng thời gian học", "+18% so với tháng trước", "schedule"],
                ].map(([value, label, note, icon]) => (
                  <div key={label} className="ai-v3-stat-tile">
                    <span><Icon name={icon} /></span>
                    <div><strong>{value}</strong><b>{label}</b><small>{note}</small></div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="ai-v3-card">
            <div className="ai-v3-card__head">
              <div>
                <p className="ai-v3-eyebrow"><Icon name="playlist_play" /> Hàng đợi học tập thích ứng</p>
                <h2 className="ai-v3-section-title">Bước tiếp theo đã được AI sắp sẵn.</h2>
              </div>
              <span className="ai-v3-status">Cá nhân hóa bởi AI</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ["01", "Phương trình bậc hai cơ bản", "8 phút · 3 câu", "Củng cố nền tảng"],
                ["02", "Biện luận theo tham số m", "12 phút · 4 câu", "Vận dụng cao"],
                ["03", "Ứng dụng thực tế", "10 phút · 3 câu", "Liên hệ thực tế"],
              ].map(([n, title, meta, tag]) => (
                <Button key={n} variant="surface" onClick={() => onNavigate(routePath("tu-giai"))} className="ai-v3-queue-card">
                  <span className="ai-v3-queue-card__index">{n}</span>
                  <span className="min-w-0 flex-1 text-left"><strong>{title}</strong><small>{meta}</small><em>{tag}</em></span>
                  <Icon name="play_arrow" />
                </Button>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="ai-v3-card ai-v3-journey-card">
            <div className="ai-v3-card__head">
              <div><p className="ai-v3-eyebrow">Hành trình Tuyển sinh 10</p><h2 className="ai-v3-section-title">{progress}% tổng thể</h2></div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate(routePath("hoc-bai"))}>Xem lộ trình</Button>
            </div>
            <div className="ai-v3-ring" style={{ "--progress": `${progress}%` } as React.CSSProperties}><span>{progress}%</span></div>
            <div className="space-y-2">
              {[["Toán học", Math.max(progress, 78)], ["Ngữ văn", 62], ["Tiếng Anh", 71], ["Ôn tập tổng hợp", 41]].map(([name, value]) => (
                <div key={String(name)} className="ai-v3-course-progress">
                  <span>{name}</span><strong>{value}%</strong>
                  <div><i style={{ width: `${value}%` }} /></div>
                </div>
              ))}
            </div>
          </section>

          <section className="ai-v3-card">
            <div className="ai-v3-card__head">
              <div><p className="ai-v3-eyebrow">Cognitive Profile</p><h2 className="ai-v3-section-title">Radar năng lực tư duy</h2></div>
            </div>
            <Radar progress={progress} />
            <div className="flex items-center justify-center gap-4 text-xs text-ink-500"><span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-brand" /> Mức hiện tại</span><span>Mục tiêu Tuyển sinh 10</span></div>
          </section>

          <section className="ai-v3-card ai-v3-coach-panel">
            <p className="ai-v3-eyebrow"><Icon name="lightbulb" /> Gợi ý từ AI Coach</p>
            <p>Dựa trên kết quả gần đây, em nên luyện thêm điều kiện có nghiệm và các bài ứng dụng thực tế. AI đã chuẩn bị một bridge ngắn trước mission tiếp theo.</p>
            <Button className="w-full justify-between" onClick={() => onNavigate(routePath("tu-giai"))}>Hỏi nhanh AI Coach <Icon name="arrow_forward" /></Button>
          </section>

          <section className="ai-v3-card">
            <p className="ai-v3-eyebrow"><Icon name="military_tech" /> Thành tựu hiện tại</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="ai-v3-mini-achievement"><strong>{unlocked}</strong><span>Huy hiệu mở khóa</span></div>
              <div className="ai-v3-mini-achievement"><strong>{gpBalance}</strong><span>GP hiện có</span></div>
              <div className="ai-v3-mini-achievement"><strong>{dailyGp}</strong><span>GP hôm nay</span></div>
              <div className="ai-v3-mini-achievement"><strong>{assessment.recoverablePoints}</strong><span>Điểm có thể phục hồi</span></div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};
