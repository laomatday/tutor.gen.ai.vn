import React from "react";
import { Button, Icon, Progress } from "../../components/ui";
import { AbilityRadar } from "../../components/student/AbilityRadar";
import { routePath } from "../../config/routes";
import { useCurriculum } from "../../context/CurriculumContext";
import {
  lessonHref,
  studentProfile,
  primaryEnrollment,
  courseHref,
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

const Metric = ({
  icon,
  value,
  label,
  delta,
}: {
  icon: string;
  value: string;
  label: string;
  delta?: string;
}) => (
  <div className="pulse-metric">
    <span className="pulse-metric__icon"><Icon name={icon} /></span>
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
      {delta && <small>{delta}</small>}
    </div>
  </div>
);

export const TodayView: React.FC<TodayViewProps> = ({
  onNavigate,
  onOpenBadges,
  gpBalance,
  dailyGp,
}) => {
  const {
    subjects,
    lessons,
    topics,
    completedLessonIds,
    storageError,
    contentSource,
  } = useCurriculum();

  const enrollment = primaryEnrollment;
  const subject =
    subjects.find((item) => item.id === enrollment.subjectId) ??
    subjects[0];
  const courseLessons = ownedPublishedLessons(lessons, topics)
    .filter(
      (lesson) =>
        lesson.gradeId === enrollment.gradeId &&
        lesson.subjectId === enrollment.subjectId,
    )
    .sort((a, b) => a.order - b.order);

  const completed = courseLessons.filter((lesson) =>
    completedLessonIds.includes(lesson.id),
  );
  const nextLesson =
    courseLessons.find((lesson) => !completedLessonIds.includes(lesson.id)) ??
    courseLessons[0];
  const progress = courseLessons.length
    ? Math.round((completed.length / courseLessons.length) * 100)
    : 0;
  const nextTopic = topics.find((topic) => topic.id === nextLesson?.topicId);
  const assessment = assessmentSummary(sampleAssessment);
  const unlocked = initialBadges.filter((badge) => badge.unlocked).length;
  const firstName = studentProfile.name.split(" ").at(-1) ?? studentProfile.name;

  const missionPath = nextLesson
    ? lessonHref(nextLesson)
    : courseHref(enrollment.gradeId, enrollment.subjectId);

  const mapPath = routePath("hoc-bai");
  const replayPath = routePath("replay");
  const studioPath = routePath("tu-giai");

  const queue = [
    {
      index: "01",
      title: "Phương trình bậc hai cơ bản",
      meta: "8 phút · 3 câu",
      tag: "Củng cố nền tảng",
      tone: "success",
      path: studioPath,
    },
    {
      index: "02",
      title: "Biện luận theo tham số m",
      meta: "12 phút · 4 câu",
      tag: "Vận dụng cao",
      tone: "warning",
      path: studioPath,
    },
    {
      index: "03",
      title: "Ứng dụng thực tế",
      meta: "10 phút · 3 câu",
      tag: "Liên hệ thực tế",
      tone: "primary",
      path: mapPath,
    },
  ] as const;

  return (
    <div className="learning-os-page premium-home">
      {storageError && (
        <div role="alert" className="rounded-2xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800">
          {storageError}
        </div>
      )}

      <section className="scenic-learning-hero">
        <div className="scenic-learning-hero__content">
          <span className="premium-eyebrow">
            <Icon name="school" />
            Tuyển sinh 10 · {contentSource === "database" ? "Live learning data" : "Offline fallback"}
          </span>
          <h1>Chào {firstName}! 👋</h1>
          <p>Hôm nay là một ngày tuyệt vời để tiến bộ.</p>
          <blockquote>“Tri thức không đến từ việc nhớ, mà từ việc tư duy đúng cách.”</blockquote>
        </div>
        <div className="scenic-learning-hero__art" aria-hidden="true">
          <span className="scenic-orb scenic-orb--one" />
          <span className="scenic-orb scenic-orb--two" />
          <div className="scenic-mountain scenic-mountain--back" />
          <div className="scenic-mountain scenic-mountain--front" />
          <div className="scenic-student">
            <Icon name="hiking" />
          </div>
          <span className="scenic-handnote">Kiến thức mở ra những khả năng mới ✦</span>
        </div>
        <div className="scenic-learning-hero__quote">
          <Icon name="landscape" />
          <strong>Hành trình vạn dặm bắt đầu từ một bước nhỏ.</strong>
          <span className="h-1.5 w-full overflow-hidden rounded-full bg-brand/10">
            <span className="block h-full w-[74%] rounded-full bg-brand" />
          </span>
        </div>
      </section>

      <div className="premium-dashboard-grid">
        <section className="premium-card premium-card--pulse">
          <div className="premium-card__heading">
            <div>
              <p className="premium-eyebrow"><Icon name="psychology" /> AI Cognitive Pulse</p>
              <h2>Nhịp tư duy hôm nay</h2>
              <span>Dựa trên 18 lượt học gần nhất</span>
            </div>
            <span className="premium-status premium-status--success">● Đang ổn định</span>
          </div>

          <div className="pulse-metrics-grid">
            <Metric icon="center_focus_strong" value="82%" label="Tập trung" delta="↑ +12%" />
            <Metric icon="shield" value="78%" label="Hiểu sâu" delta="↑ +8%" />
            <Metric icon="autorenew" value="92%" label="Tự sửa lỗi" delta="↑ +15%" />
            <Metric icon="workspace_premium" value="8.5+" label="Sẵn sàng thi" />
          </div>

          <div className="ai-coach-note">
            <span className="ai-coach-orb"><Icon name="smart_toy" /></span>
            <p>
              Em đang duy trì phong độ rất tốt, đặc biệt ở kỹ năng phân tích.
              Hôm nay Tutor ưu tiên một nhiệm vụ vừa đủ khó để giữ nhịp Deep Focus.
            </p>
          </div>
        </section>

        <section className="premium-card premium-card--journey">
          <div className="premium-card__heading">
            <div>
              <p className="premium-eyebrow"><Icon name="route" /> Hành trình Tuyển sinh 10</p>
              <h2>{progress}% hoàn thành</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate(mapPath)}>
              Xem lộ trình <Icon name="arrow_forward" />
            </Button>
          </div>
          <div className="journey-overview">
            <div className="journey-ring" style={{ "--progress": `${Math.max(progress, 74)}%` } as React.CSSProperties}>
              <strong>{Math.max(progress, 74)}%</strong>
              <span>Tiến độ</span>
            </div>
            <div className="journey-subjects">
              <div><span>Toán học</span><strong>78%</strong></div>
              <div><span>Ngữ văn</span><strong>62%</strong></div>
              <div><span>Tiếng Anh</span><strong>71%</strong></div>
              <div><span>Ôn tập tổng hợp</span><strong>41%</strong></div>
            </div>
          </div>
        </section>

        <section className="premium-mission-card">
          <div className="premium-mission-card__copy">
            <div className="flex flex-wrap items-center gap-2">
              <span className="premium-chip premium-chip--dark"><Icon name="target" /> Nhiệm vụ hôm nay</span>
              <span className="premium-chip premium-chip--light">Focus {nextLesson?.durationMinutes ?? 22} phút</span>
            </div>
            <h2>{nextLesson?.title ?? "Giải phương trình bậc hai và biện luận"}</h2>
            <p>
              {nextLesson?.summary ??
                "Vận dụng phương pháp phân tích để giải bài toán và kiểm tra điều kiện có nghiệm."}
            </p>
            <div className="premium-mission-meta">
              <span><Icon name="schedule" /> {nextLesson?.durationMinutes ?? 22} phút</span>
              <span><Icon name="quiz" /> {nextLesson?.exercises.length ?? 4} câu hỏi</span>
              <span><Icon name="signal_cellular_alt" /> Cấp độ: Vận dụng</span>
            </div>
            <Button className="premium-mission-cta" onClick={() => onNavigate(missionPath)}>
              <Icon name="play_arrow" />
              Bắt đầu ngay
            </Button>
          </div>

          <div className="premium-problem-preview">
            <div className="flex items-center justify-between gap-3">
              <p className="premium-eyebrow"><Icon name="visibility" /> Xem trước bài toán</p>
              <Button variant="ghost" size="sm" onClick={() => onNavigate(studioPath)}>
                Mở Focus Studio <Icon name="arrow_forward" />
              </Button>
            </div>
            <div className="premium-equation">x² − 5x + 6 = 0</div>
            <svg viewBox="0 0 320 150" className="mt-4 w-full" role="img" aria-label="Minh họa parabol cắt trục hoành">
              <line x1="36" y1="122" x2="292" y2="122" stroke="var(--color-ink-300)" strokeWidth="1.5" />
              <line x1="150" y1="18" x2="150" y2="135" stroke="var(--color-ink-300)" strokeWidth="1.5" />
              <path d="M65 36 C105 108 125 122 150 122 C175 122 195 108 235 36" fill="none" stroke="var(--color-brand)" strokeWidth="4" strokeLinecap="round" />
              <circle cx="126" cy="118" r="5" fill="var(--color-accent)" />
              <circle cx="174" cy="118" r="5" fill="var(--color-accent)" />
              <text x="116" y="142" fontSize="11" fill="var(--color-ink-500)">2</text>
              <text x="169" y="142" fontSize="11" fill="var(--color-ink-500)">3</text>
            </svg>
            <p className="premium-problem-preview__note">Parabol cắt trục hoành tại x = 2 và x = 3</p>
          </div>
        </section>

        <section className="premium-card premium-card--radar">
          <div className="premium-card__heading">
            <div>
              <p className="premium-eyebrow"><Icon name="radar" /> Cognitive Profile</p>
              <h2>Hồ sơ năng lực</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onOpenBadges}>Chi tiết</Button>
          </div>
          <AbilityRadar values={[88, 76, 92, 74, 81]} />
          <div className="radar-legend">
            <span><i className="bg-brand" /> Mức hiện tại</span>
            <span><i className="border border-brand bg-white" /> Mục tiêu tuyển sinh 10</span>
          </div>
        </section>

        <section className="premium-card premium-profile-card">
          <div className="premium-card__heading">
            <div>
              <p className="premium-eyebrow"><Icon name="workspace_premium" /> Hồ sơ năng lực của bạn</p>
              <h2>{studentProfile.name}</h2>
            </div>
            <span className="premium-status">Lv.8 Elite</span>
          </div>
          <div className="premium-profile-layout">
            <div className="premium-profile-identity">
              <img src={studentProfile.avatarUrl} alt={studentProfile.name} referrerPolicy="no-referrer" />
              <div>
                <strong>Tuyển sinh 10 · {studentProfile.className}</strong>
                <span>Pattern Hunter · Problem Solver</span>
                <blockquote>“Kiên trì hôm nay, phiên bản mạnh mẽ hơn của mình ngày mai.”</blockquote>
              </div>
            </div>
            <div className="premium-profile-stats">
              <div><Icon name="autorenew" /><strong>92%</strong><span>Tự sửa lỗi</span></div>
              <div><Icon name="psychology" /><strong>8.5 / 10</strong><span>Chất lượng lập luận</span></div>
              <div><span className="text-lg">🔥</span><strong>14 ngày</strong><span>Chuỗi học tập</span></div>
              <div><Icon name="schedule" /><strong>128 giờ</strong><span>Tổng thời gian học</span></div>
            </div>
          </div>
        </section>

        <section className="premium-card premium-card--coach">
          <div className="premium-card__heading">
            <div>
              <p className="premium-eyebrow"><Icon name="tips_and_updates" /> Gợi ý từ AI Coach</p>
              <h2>Ba bước nên làm tiếp theo</h2>
            </div>
          </div>
          <div className="coach-recommendation">
            <Icon name="lightbulb" />
            <p>
              Dựa trên kết quả gần đây, em nên luyện thêm các bài về điều kiện có nghiệm
              và ứng dụng thực tế của phương trình bậc hai. Tutor đã chuẩn bị queue phù hợp.
            </p>
          </div>
          <Button className="mt-4 w-full justify-between" onClick={() => onNavigate(studioPath)}>
            Hỏi nhanh AI Coach <Icon name="arrow_forward" />
          </Button>
        </section>
      </div>

      <section className="premium-adaptive-queue">
        <div className="premium-section-heading">
          <div>
            <p className="premium-eyebrow"><Icon name="bolt" /> Adaptive Queue · cá nhân hóa bởi AI</p>
            <h2>Hàng đợi học tập thích ứng</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigate(mapPath)}>
            Xem tất cả <Icon name="arrow_forward" />
          </Button>
        </div>
        <div className="adaptive-queue-grid">
          {queue.map((item) => (
            <button key={item.index} className="adaptive-task" onClick={() => onNavigate(item.path)}>
              <span className="adaptive-task__index">{item.index}</span>
              <span className="min-w-0 flex-1 text-left">
                <strong>{item.title}</strong>
                <small>{item.meta}</small>
                <em data-tone={item.tone}>{item.tag}</em>
              </span>
              <span className="adaptive-task__play"><Icon name="play_arrow" /></span>
            </button>
          ))}
          <button className="adaptive-task adaptive-task--surprise" onClick={() => onNavigate(studioPath)}>
            <span className="adaptive-task__index"><Icon name="casino" /></span>
            <span className="min-w-0 flex-1 text-left">
              <strong>Bài tập bất ngờ</strong>
              <small>Thử thách bản thân</small>
            </span>
            <Icon name="arrow_forward" />
          </button>
        </div>
      </section>

      <span className="sr-only">GP hôm nay {dailyGp}, số dư {gpBalance}, huy hiệu đã mở {unlocked}, điểm có thể phục hồi {assessment.recoverablePoints}.</span>
    </div>
  );
};
